import type { components } from '#shared/types/api'

type CreateAccountRequest = components['schemas']['CreateAccountRequest']
type UpdateAccountRequest = components['schemas']['UpdateAccountRequest']

export interface AccountForm {
  companyId: string
  insuranceCompanyCode: string
  name: string
  loginId: string
  password: string
  telecomAgency: string
  phone: string
  groupCode: string
  secondaryCode: string
  secondaryPassword: string
  feePassword: string
}

export function blankAccountForm(): AccountForm {
  return {
    companyId: '', insuranceCompanyCode: '', name: '', loginId: '', password: '',
    telecomAgency: '', phone: '', groupCode: '', secondaryCode: '', secondaryPassword: '', feePassword: '',
  }
}

export function toCreateAccountRequest(f: AccountForm): CreateAccountRequest {
  const insuranceCompanyCode = f.insuranceCompanyCode.trim()
  if (!insuranceCompanyCode) throw new Error('보험사 코드를 입력하세요.')
  const name = f.name.trim()
  if (!name) throw new Error('계정명을 입력하세요.')
  const loginId = f.loginId.trim()
  if (!loginId) throw new Error('로그인 ID를 입력하세요.')
  if (!f.password) throw new Error('비밀번호를 입력하세요.')

  const req: CreateAccountRequest = { insuranceCompanyCode, name, loginId, password: f.password }
  if (f.companyId.trim()) req.companyId = f.companyId.trim()
  if (f.telecomAgency.trim()) req.telecomAgency = f.telecomAgency.trim()
  if (f.phone.trim()) req.phone = f.phone.trim()
  if (f.groupCode.trim()) req.groupCode = f.groupCode.trim()
  if (f.secondaryCode.trim()) req.secondaryCode = f.secondaryCode.trim()
  if (f.secondaryPassword) req.secondaryPassword = f.secondaryPassword
  if (f.feePassword) req.feePassword = f.feePassword
  return req
}

export function toUpdateAccountRequest(f: AccountForm): UpdateAccountRequest {
  const req: UpdateAccountRequest = {}
  if (f.companyId.trim()) req.companyId = f.companyId.trim()
  if (f.name.trim()) req.name = f.name.trim()
  if (f.telecomAgency.trim()) req.telecomAgency = f.telecomAgency.trim()
  if (f.phone.trim()) req.phone = f.phone.trim()
  if (f.groupCode.trim()) req.groupCode = f.groupCode.trim()
  if (f.secondaryCode.trim()) req.secondaryCode = f.secondaryCode.trim()
  if (f.loginId.trim()) req.loginId = f.loginId.trim()
  if (f.password) req.password = f.password
  if (f.secondaryPassword) req.secondaryPassword = f.secondaryPassword
  if (f.feePassword) req.feePassword = f.feePassword
  return req
}
