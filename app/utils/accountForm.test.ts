import { describe, it, expect } from 'vitest'
import { blankAccountForm, toCreateAccountRequest, toUpdateAccountRequest } from './accountForm'

const full = () => ({
  ...blankAccountForm(),
  insuranceCompanyCode: 'samsung_property', name: '주계정', loginId: 'user1', password: 'pw',
})

describe('blankAccountForm', () => {
  it('is all empty strings', () => {
    expect(blankAccountForm()).toEqual({
      companyId: '', insuranceCompanyCode: '', name: '', loginId: '', password: '',
      telecomAgency: '', phone: '', groupCode: '', secondaryCode: '', secondaryPassword: '', feePassword: '',
    })
  })
})

describe('toCreateAccountRequest', () => {
  it('requires insuranceCompanyCode, name, loginId, password', () => {
    expect(() => toCreateAccountRequest(blankAccountForm())).toThrow('보험사 코드를 입력하세요.')
    expect(() => toCreateAccountRequest({ ...blankAccountForm(), insuranceCompanyCode: 'x' })).toThrow('계정명을 입력하세요.')
    expect(() => toCreateAccountRequest({ ...blankAccountForm(), insuranceCompanyCode: 'x', name: 'n' })).toThrow('로그인 ID를 입력하세요.')
    expect(() => toCreateAccountRequest({ ...blankAccountForm(), insuranceCompanyCode: 'x', name: 'n', loginId: 'l' })).toThrow('비밀번호를 입력하세요.')
  })
  it('maps the required fields, trimming non-secrets but not the password', () => {
    expect(toCreateAccountRequest({ ...full(), insuranceCompanyCode: ' samsung_property ', name: ' 주계정 ', loginId: ' user1 ', password: ' pw ' }))
      .toEqual({ insuranceCompanyCode: 'samsung_property', name: '주계정', loginId: 'user1', password: ' pw ' })
  })
  it('includes optional fields only when present', () => {
    expect(toCreateAccountRequest({ ...full(), phone: '010', secondaryPassword: 'sp' }))
      .toEqual({ insuranceCompanyCode: 'samsung_property', name: '주계정', loginId: 'user1', password: 'pw', phone: '010', secondaryPassword: 'sp' })
  })
})

describe('toUpdateAccountRequest', () => {
  it('omits insuranceCompanyCode and all blank secrets, keeping non-blank non-secrets', () => {
    expect(toUpdateAccountRequest({ ...blankAccountForm(), insuranceCompanyCode: 'x', name: '수정명', phone: '010' }))
      .toEqual({ name: '수정명', phone: '010' })
  })
  it('includes a secret only when the user re-entered it', () => {
    expect(toUpdateAccountRequest({ ...blankAccountForm(), name: 'n', password: 'newpw' }))
      .toEqual({ name: 'n', password: 'newpw' })
  })
  it('omits a blank password so it is not cleared', () => {
    const r = toUpdateAccountRequest({ ...blankAccountForm(), name: 'n' })
    expect('password' in r).toBe(false)
    expect('loginId' in r).toBe(false)
  })
})
