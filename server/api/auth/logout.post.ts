export default defineEventHandler((event) => {
  deleteCookie(event, 'access_token')
  return { ok: true }
})
