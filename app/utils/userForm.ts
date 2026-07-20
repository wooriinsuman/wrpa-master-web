import type { components } from '#shared/types/api'

type CreateUserRequest = components['schemas']['CreateUserRequest']
type UpdateUserRequest = components['schemas']['UpdateUserRequest']

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

// 수정 요청 본문. username은 변경 불가라 제외한다. 백엔드 UpdateUser는 프로필
// 컬럼을 전량 덮어쓰므로 빈 값은 생략해 NULL로 정리되게 하고, roleIds는 항상
// 보내 현재 체크 상태로 역할을 교체한다(빈 배열이면 전체 해제). password는
// 입력했을 때만 재설정.
export function toUpdateUserRequest(f: UserForm): UpdateUserRequest {
  const name = f.name.trim()
  if (!name) throw new Error('이름을 입력하세요.')

  const req: UpdateUserRequest = { name, roleIds: f.roleIds }
  if (f.email.trim()) req.email = f.email.trim()
  if (f.mobile.trim()) req.mobile = f.mobile.trim()
  if (f.memo.trim()) req.memo = f.memo.trim()
  if (f.companyId.trim()) req.companyId = f.companyId.trim()
  if (f.password) req.password = f.password
  return req
}
