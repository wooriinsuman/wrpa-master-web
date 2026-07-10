import { describe, it, expect } from 'vitest'
import { NAV } from './nav'
describe('NAV', () => {
  it('has 12 items with unique routes and 2-char codes', () => {
    expect(NAV).toHaveLength(12)
    expect(new Set(NAV.map(n => n.route)).size).toBe(12)
    for (const n of NAV) expect(n.code).toHaveLength(2)
  })
})
