import { describe, it, expect } from 'vitest'
import { NAV } from './nav'
import { RANK_USER, RANK_ADMIN, RANK_SYSTEM } from './roles'

describe('NAV', () => {
  it('has 13 items with unique routes and 2-char codes', () => {
    expect(NAV).toHaveLength(13)
    expect(new Set(NAV.map(n => n.route)).size).toBe(13)
    for (const n of NAV) expect(n.code).toHaveLength(2)
  })
})

describe('NAV minRank gating', () => {
  const visibleRoutes = (level: number) =>
    NAV.filter(n => level >= (n.minRank ?? 0)).map(n => n.route).sort()

  it('level 10 (user) sees only the USER-rank routes', () => {
    // 작업 현황(/jobs) = 진행 작업 + 작업 큐 통합, 조회는 USER 이상(백엔드 WithCompanyScope).
    expect(visibleRoutes(RANK_USER)).toEqual(
      ['/', '/accounts', '/order-policies', '/jobs'].sort(),
    )
  })

  it('level 20 (admin) adds ADMIN-rank routes but not SYSTEM-only ones', () => {
    const routes = visibleRoutes(RANK_ADMIN)
    expect(routes).toContain('/schedules')
    expect(routes).not.toContain('/users') // SYSTEM-only user management
    expect(routes).not.toContain('/clients') // SYSTEM-only company management
    expect(routes).not.toContain('/workers')
    expect(routes).not.toContain('/packages')
    expect(routes).not.toContain('/insurers')
  })

  it('level 30 (system) sees every route', () => {
    expect(visibleRoutes(RANK_SYSTEM)).toEqual(NAV.map(n => n.route).sort())
  })
})
