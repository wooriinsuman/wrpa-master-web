import { buildProxyHeaders } from '../utils/proxy-helpers'
import { toApiErrorResponse } from '../utils/proxy-error'
import { refreshTokens } from '../utils/refresh'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const path = event.path
  const method = event.method
  const body = ['GET', 'HEAD'].includes(method)
    ? undefined
    : await readBody(event).catch(() => undefined)

  // Shared request options so the first attempt and the retry are built identically —
  // only the bearer token differs. Kept as a plain-object builder (not a $fetch-calling
  // closure) so both call sites below can `return await $fetch(...)` directly; routing
  // the fetch itself through an intermediary function trips a TS "excessive stack depth"
  // error while resolving Nitro's internal route-return-type map for '/api/**'.
  const options = (token: string | undefined) => ({
    method,
    headers: buildProxyHeaders(token, config.uploadToken),
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
      const rotated = await refreshTokens(config.rpaApiUrl, refreshToken)
      if (rotated) {
        setCookie(event, 'access_token', rotated.accessToken, {
          httpOnly: true, secure: !import.meta.dev, sameSite: 'lax', path: '/',
        })
        setCookie(event, 'refresh_token', rotated.refreshToken, {
          httpOnly: true, secure: !import.meta.dev, sameSite: 'lax',
          path: '/api/auth', maxAge: 7 * 24 * 60 * 60,
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
    deleteCookie(event, 'refresh_token', { path: '/api/auth' })
    setResponseStatus(event, first.status)
    return first.body
  }
})
