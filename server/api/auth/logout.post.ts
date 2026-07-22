export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const refreshToken = getCookie(event, 'refresh_token')
  if (refreshToken) {
    // best-effort family revocation; ignore backend failures
    await $fetch(`${config.rpaApiUrl}/api/auth/logout`, {
      method: 'POST', body: { refreshToken },
    }).catch(() => {})
  }
  deleteCookie(event, 'access_token')
  deleteCookie(event, 'refresh_token', { path: '/api/auth' })
  return { ok: true }
})
