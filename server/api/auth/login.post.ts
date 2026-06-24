export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)
  const res = await $fetch<{ accessToken: string }>(`${config.rpaApiUrl}/api/auth/login`, {
    method: 'POST', body,
  })
  setCookie(event, 'access_token', res.accessToken, {
    httpOnly: true, secure: true, sameSite: 'lax', path: '/',
  })
  return { ok: true }
})
