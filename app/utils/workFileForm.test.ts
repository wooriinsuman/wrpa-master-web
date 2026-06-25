import { describe, it, expect } from 'vitest'
import { toCreateWorkFileRequest, toUpdateWorkFileRequest, type WorkFileForm } from './workFileForm'
const base: WorkFileForm = { insuranceCompanyCode: 'samsung_property', dataType: 'contract', fileType: 'list', insureType: 'all', contentType: 'a', name: '계약 전체 목록', note: 'n', originPath: '/p' }
describe('workFileForm', () => {
  it('create maps all required + optional fields', () => {
    expect(toCreateWorkFileRequest(base)).toEqual({ insuranceCompanyCode: 'samsung_property', dataType: 'contract', fileType: 'list', insureType: 'all', contentType: 'a', name: '계약 전체 목록', note: 'n', originPath: '/p' })
  })
  it('update omits insuranceCompanyCode', () => {
    expect('insuranceCompanyCode' in toUpdateWorkFileRequest(base)).toBe(false)
  })
  it('throws when a required field is empty', () => {
    expect(() => toCreateWorkFileRequest({ ...base, name: ' ' })).toThrow()
    expect(() => toCreateWorkFileRequest({ ...base, insuranceCompanyCode: '' })).toThrow()
  })
})
