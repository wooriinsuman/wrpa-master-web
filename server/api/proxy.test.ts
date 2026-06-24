import { describe, it, expect, vi } from 'vitest'
import { buildProxyHeaders } from './_proxy-helpers'

describe('buildProxyHeaders', () => {
  it('adds Bearer auth when token cookie present', () => {
    const h = buildProxyHeaders('jwt-abc')
    expect(h.Authorization).toBe('Bearer jwt-abc')
  })
  it('omits auth when no token', () => {
    const h = buildProxyHeaders(undefined)
    expect(h.Authorization).toBeUndefined()
  })
})
