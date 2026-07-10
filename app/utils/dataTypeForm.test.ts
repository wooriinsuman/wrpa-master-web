import { describe, expect, it } from 'vitest'
import { toCreateDataTypeRequest, validateDataTypeForm } from './dataTypeForm'

describe('dataTypeForm', () => {
  it('validate: 코드 규칙', () => {
    expect(validateDataTypeForm({ code: 'NEW', name: 'x', note: '' })).toBeTruthy()
    expect(validateDataTypeForm({ code: 'new_2', name: '신계약', note: '' })).toBeNull()
    expect(validateDataTypeForm({ code: 'new', name: ' ', note: '' })).toBeTruthy()
  })
  it('toCreateRequest: trim', () => {
    expect(toCreateDataTypeRequest({ code: ' new ', name: ' 신계약 ', note: 'n' }))
      .toEqual({ code: 'new', name: '신계약', note: 'n' })
  })
})
