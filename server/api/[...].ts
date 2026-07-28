import { buildProxyHeaders, clientContextHeaders } from '../utils/proxy-helpers'
import { toApiErrorResponse } from '../utils/proxy-error'
import { refreshTokens } from '../utils/refresh'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const path = event.path
  const method = event.method
  const body = ['GET', 'HEAD'].includes(method)
    ? undefined
    : await readBody(event).catch(() => undefined)

  // 원 클라이언트 IP·UA — 한 번만 계산해 첫 시도·재시도·토큰 회전에 모두 같은 값을 쓴다.
  const clientCtx = clientContextHeaders(event)

  // Shared request options so the first attempt and the retry are built identically —
  // only the bearer token differs. Kept as a plain-object builder (not a $fetch-calling
  // closure) so both call sites below can `return await $fetch(...)` directly; routing
  // the fetch itself through an intermediary function trips a TS "excessive stack depth"
  // error while resolving Nitro's internal route-return-type map for '/api/**'.
  const options = (token: string | undefined) => ({
    method,
    headers: { ...buildProxyHeaders(token, config.uploadToken), ...clientCtx },
    body,
  })

  const token = getCookie(event, 'access_token')
  try {
    return await $fetch(`${config.rpaApiUrl}${path}`, options(token))
  } catch (err: any) {
    const first = toApiErrorResponse(err)
    if (first.status !== 401) {
      setResponseStatus(event, first.status)
      return first.body
    }
    // Access expired/invalid → try a single refresh + retry.
    const refreshToken = getCookie(event, 'refresh_token')
    if (refreshToken) {
      const rotated = await refreshTokens(config.rpaApiUrl, refreshToken, clientCtx)
      if (rotated) {
        setCookie(event, 'access_token', rotated.accessToken, {
          httpOnly: true, secure: !import.meta.dev, sameSite: 'lax', path: '/',
        })
        setCookie(event, 'refresh_token', rotated.refreshToken, {
          httpOnly: true, secure: !import.meta.dev, sameSite: 'lax',
          path: '/api', maxAge: 7 * 24 * 60 * 60,
        })
        try {
          return await $fetch(`${config.rpaApiUrl}${path}`, options(rotated.accessToken))
        } catch (err2: any) {
          const second = toApiErrorResponse(err2)
          setResponseStatus(event, second.status)
          return second.body
        }
      }
    }
    // No refresh cookie or refresh failed → clear cookies, relay 401.
    deleteCookie(event, 'access_token')
    deleteCookie(event, 'refresh_token', { path: '/api' })
    setResponseStatus(event, first.status)
    return first.body
  }
})
