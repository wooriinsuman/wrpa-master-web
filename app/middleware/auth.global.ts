import { NAV_GROUPS } from '~/utils/nav'

// route -> minRank lookup, flattened from the nav config. Longest-prefix match
// so sub-routes (e.g. /users/123) inherit their parent nav item's rank.
const ROUTE_RANKS: Array<[string, number]> = NAV_GROUPS
  .flatMap(g => g.items)
  .map(item => [item.route, item.minRank ?? 0] as [string, number])
  .sort((a, b) => b[0].length - a[0].length)

function requiredRankFor(path: string): number {
  for (const [route, rank] of ROUTE_RANKS) {
    if (route === '/' ? path === '/' : path === route || path.startsWith(route + '/')) return rank
  }
  return 0
}

export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path === '/login') return
  const auth = useAuthStore()
  if (!auth.isAuthed) await auth.fetchMe()
  if (!auth.isAuthed) return navigateTo(`/login?redirect=${to.fullPath}`)
  // Backend is the real gate; this only spares the user a 403 round-trip by
  // redirecting away from pages their role can't use.
  if (auth.level < requiredRankFor(to.path)) return navigateTo('/')
})
