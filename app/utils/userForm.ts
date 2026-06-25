import type { components } from '#shared/types/api'

type CreateUserRequest = components['schemas']['CreateUserRequest']

export interface UserForm {
  username: string
  password: string
  name: string
  email: string
  mobile: string
  memo: string
  companyId: string
  roleIds: string[]
}

export function blankUserForm(): UserForm {
  return { username: '', password: '', name: '', email: '', mobile: '', memo: '', companyId: '', roleIds: [] }
}

export function toCreateUserRequest(f: UserForm): CreateUserRequest {
  const username = f.username.trim()
  if (!username) throw new Error('아이디를 입력하세요.')
  if (!f.password) throw new Error('비밀번호를 입력하세요.')
  const name = f.name.trim()
  if (!name) throw new Error('이름을 입력하세요.')

  const req: CreateUserRequest = { username, password: f.password, name }
  if (f.email.trim()) req.email = f.email.trim()
  if (f.mobile.trim()) req.mobile = f.mobile.trim()
  if (f.memo.trim()) req.memo = f.memo.trim()
  if (f.companyId.trim()) req.companyId = f.companyId.trim()
  if (f.roleIds.length) req.roleIds = f.roleIds
  return req
}
