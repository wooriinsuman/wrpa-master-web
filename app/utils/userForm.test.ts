import { describe, it, expect } from 'vitest'
import { blankUserForm, toCreateUserRequest } from './userForm'

describe('blankUserForm', () => {
  it('returns empty strings and an empty roleIds array', () => {
    expect(blankUserForm()).toEqual({
      username: '', password: '', name: '', email: '', mobile: '', memo: '', companyId: '', roleIds: [],
    })
  })
})

describe('toCreateUserRequest', () => {
  it('requires username', () => {
    expect(() => toCreateUserRequest({ ...blankUserForm(), password: 'p', name: 'n' }))
      .toThrow('아이디를 입력하세요.')
  })
  it('requires password', () => {
    expect(() => toCreateUserRequest({ ...blankUserForm(), username: 'u', name: 'n' }))
      .toThrow('비밀번호를 입력하세요.')
  })
  it('requires name', () => {
    expect(() => toCreateUserRequest({ ...blankUserForm(), username: 'u', password: 'p' }))
      .toThrow('이름을 입력하세요.')
  })
  it('maps only the required fields when the rest is blank', () => {
    expect(toCreateUserRequest({ ...blankUserForm(), username: ' u ', password: 'p', name: ' n ' }))
      .toEqual({ username: 'u', password: 'p', name: 'n' })
  })
  it('does not trim the password', () => {
    expect(toCreateUserRequest({ ...blankUserForm(), username: 'u', password: ' p ', name: 'n' }))
      .toEqual({ username: 'u', password: ' p ', name: 'n' })
  })
  it('includes optional fields and roleIds when present', () => {
    const r = toCreateUserRequest({
      username: 'u', password: 'p', name: 'n', email: ' e@x.io ', mobile: '010', memo: 'm', companyId: 'c1', roleIds: ['r1', 'r2'],
    })
    expect(r).toEqual({ username: 'u', password: 'p', name: 'n', email: 'e@x.io', mobile: '010', memo: 'm', companyId: 'c1', roleIds: ['r1', 'r2'] })
  })
})
