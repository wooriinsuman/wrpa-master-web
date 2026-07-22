import { toApiErrorResponse } from '../../utils/proxy-error'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)
  try {
    const res = await $fetch<{ accessToken: string; refreshToken: string }>(
      `${config.rpaApiUrl}/api/auth/login`,
      { method: 'POST', body },
    )
    setCookie(event, 'access_token', res.accessToken, {
      httpOnly: true, secure: !import.meta.dev, sameSite: 'lax', path: '/',
    })
    setCookie(event, 'refresh_token', res.refreshToken, {
      httpOnly: true, secure: !import.meta.dev, sameSite: 'lax',
      path: '/api/auth', maxAge: 7 * 24 * 60 * 60,
    })
    return { ok: true }
  } catch (err: any) {
    const { status, body: envelope } = toApiErrorResponse(err)
    setResponseStatus(event, status)
    return envelope
  }
})
