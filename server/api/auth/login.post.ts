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
      path: '/api', maxAge: 7 * 24 * 60 * 60,
    })
    return { ok: true }
  } catch (err: any) {
    // 401/403을 그대로 두지 않고 여기서 잡아 봉투로 변환한다 — bare rethrow는 h3가
    // unhandled로 표시해 스택트레이스(내부 주소 포함)를 그대로 클라이언트에 덤프한다.
    const { status, body: envelope } = toApiErrorResponse(err)
    setResponseStatus(event, status)
    return envelope
  }
})
