import { describe, it, expect } from 'vitest'
import { rankOf, RANK_USER, RANK_ADMIN, RANK_SYSTEM } from './roles'

describe('rankOf', () => {
  it('returns 0 for an empty or missing list', () => {
    expect(rankOf([])).toBe(0)
    expect(rankOf()).toBe(0)
  })
  it('returns 0 for unknown role names', () => {
    expect(rankOf(['ROLE_UNKNOWN'])).toBe(0)
  })
  it('resolves a single known role', () => {
    expect(rankOf(['ROLE_USER'])).toBe(RANK_USER)
    expect(rankOf(['ROLE_ADMIN'])).toBe(RANK_ADMIN)
    expect(rankOf(['ROLE_SYSTEM'])).toBe(RANK_SYSTEM)
  })
  it('returns the max rank across multiple roles, order-independent', () => {
    expect(rankOf(['ROLE_USER', 'ROLE_ADMIN'])).toBe(RANK_ADMIN)
    expect(rankOf(['ROLE_ADMIN', 'ROLE_USER'])).toBe(RANK_ADMIN)
    expect(rankOf(['ROLE_SYSTEM', 'ROLE_ADMIN', 'ROLE_USER'])).toBe(RANK_SYSTEM)
    expect(rankOf(['ROLE_USER', 'ROLE_SYSTEM', 'ROLE_ADMIN'])).toBe(RANK_SYSTEM)
  })
  it('ignores unknown roles mixed with known ones', () => {
    expect(rankOf(['ROLE_UNKNOWN', 'ROLE_ADMIN'])).toBe(RANK_ADMIN)
  })
})
