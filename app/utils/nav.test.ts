import { describe, it, expect } from 'vitest'
import { NAV } from './nav'
describe('NAV', () => {
  it('has 10 items with unique routes and 2-char codes', () => {
    expect(NAV).toHaveLength(10)
    expect(new Set(NAV.map(n => n.route)).size).toBe(10)
    for (const n of NAV) expect(n.code).toHaveLength(2)
  })
})
