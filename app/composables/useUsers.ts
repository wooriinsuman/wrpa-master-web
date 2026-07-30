import type { components } from '#shared/types/api'
import { toCreateUserRequest, toUpdateUserRequest, type UserForm } from '~/utils/userForm'

type UserView = components['schemas']['UserView']
type UsersList = components['schemas']['UsersList']
type Role = components['schemas']['Role']

/**
 * 목록의 활성 상태 필터. 백엔드 기본값은 'active'지만 사용자 화면은 'all'을 명시해
 * 호출한다 — 정지는 soft delete이고 아이디 UNIQUE 제약이 정지된 계정까지 덮으므로,
 * 관리자는 정지된 계정을 항상 볼 수 있어야 한다(백엔드 docs/error-contract.md 참고).
 */
export type UserListStatus = 'active' | 'inactive' | 'all'

export function useUsers() {
  const api = useApi()
  return {
    list: (status: UserListStatus = 'active'): Promise<UserView[]> =>
      api<UsersList>('/users', { query: { size: 500, status } }).then(r => r.values ?? []),
    roles: () => api<Role[]>('/roles'),
    create: (f: UserForm) => api('/users', { method: 'POST', body: toCreateUserRequest(f) }),
    update: (id: string, f: UserForm) => api(`/users/${id}`, { method: 'PUT', body: toUpdateUserRequest(f) }),
    setActive: (id: string, active: boolean) => api(`/users/${id}/active`, { method: 'POST', body: { active } }),
    // 완전 삭제(hard delete). 백엔드는 정지된 계정만 허용한다 — 활성 계정이면
    // 409 user_active로 거절되고, 자기 자신/마지막 SYSTEM 계정도 409로 막힌다.
    remove: (id: string) => api(`/users/${id}`, { method: 'DELETE' }),
  }
}
