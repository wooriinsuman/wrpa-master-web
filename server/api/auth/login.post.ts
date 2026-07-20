import { toApiErrorResponse } from '../../utils/proxy-error'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)
  try {
    const res = await $fetch<{ accessToken: string }>(`${config.rpaApiUrl}/api/auth/login`, {
      method: 'POST', body,
    })
    setCookie(event, 'access_token', res.accessToken, {
      httpOnly: true, secure: !import.meta.dev, sameSite: 'lax', path: '/',
    })
    return { ok: true }
  } catch (err: any) {
    // 로그인 실패(401)와 계정 비활성(403)은 정상적인 결과다. unhandled로 흘려보내면
    // Nitro가 스택트레이스를 덤프하고 내부 주소가 응답 본문에 실린다.
    const { status, body: envelope } = toApiErrorResponse(err)
    setResponseStatus(event, status)
    return envelope
  }
})
