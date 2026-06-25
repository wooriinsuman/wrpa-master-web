import { describe, it, expect } from 'vitest'
import { toCreateRequest, toUpdateRequest, type InsurerForm } from './insurerForm'

const base: InsurerForm = { code: 'ss', name: '삼성화재', type: 'PROPERTY', url: 'https://x', active: true }

describe('insurerForm mappers', () => {
  it('toCreateRequest passes through required+optional fields', () => {
    expect(toCreateRequest(base)).toEqual({ code: 'ss', name: '삼성화재', type: 'PROPERTY', url: 'https://x', active: true })
  })
  it('toCreateRequest throws when code or name missing', () => {
    expect(() => toCreateRequest({ ...base, code: '' })).toThrow()
    expect(() => toCreateRequest({ ...base, name: '  ' })).toThrow()
  })
  it('toUpdateRequest requires active too (always boolean)', () => {
    expect(toUpdateRequest({ ...base, active: false }).active).toBe(false)
  })
})
