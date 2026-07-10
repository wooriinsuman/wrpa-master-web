import { describe, it, expect } from 'vitest'
import { NAV } from './nav'
describe('NAV', () => {
  it('has 13 items with unique routes and 2-char codes', () => {
    expect(NAV).toHaveLength(13)
    expect(new Set(NAV.map(n => n.route)).size).toBe(13)
    for (const n of NAV) expect(n.code).toHaveLength(2)
  })
})
