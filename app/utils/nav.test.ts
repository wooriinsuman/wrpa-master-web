import { describe, it, expect } from 'vitest'
import { NAV } from './nav'
import { RANK_USER, RANK_ADMIN, RANK_SYSTEM } from './roles'

describe('NAV', () => {
  it('has 14 items with unique routes and 2-char codes', () => {
    expect(NAV).toHaveLength(14)
    expect(new Set(NAV.map(n => n.route)).size).toBe(14)
    for (const n of NAV) expect(n.code).toHaveLength(2)
  })
})

describe('NAV minRank gating', () => {
  const visibleRoutes = (level: number) =>
    NAV.filter(n => level >= (n.minRank ?? 0)).map(n => n.route).sort()

  it('level 10 (user) sees only the USER-rank routes', () => {
    // /jobs = /works monitoring (SYSTEM-only backend), so NOT visible to USER.
    expect(visibleRoutes(RANK_USER)).toEqual(
      ['/', '/accounts', '/order-policies', '/schedule-queue'].sort(),
    )
  })

  it('level 20 (admin) adds ADMIN-rank routes but not SYSTEM-only ones', () => {
    const routes = visibleRoutes(RANK_ADMIN)
    expect(routes).toContain('/users')
    expect(routes).toContain('/clients')
    expect(routes).toContain('/schedules')
    expect(routes).not.toContain('/workers')
    expect(routes).not.toContain('/packages')
    expect(routes).not.toContain('/insurers')
    expect(routes).not.toContain('/jobs') // SYSTEM-only works monitoring
  })

  it('level 30 (system) sees every route', () => {
    expect(visibleRoutes(RANK_SYSTEM)).toEqual(NAV.map(n => n.route).sort())
  })
})
