export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path === '/login') return
  const auth = useAuthStore()
  if (!auth.isAuthed) await auth.fetchMe()
  if (!auth.isAuthed) return navigateTo(`/login?redirect=${to.fullPath}`)
})
