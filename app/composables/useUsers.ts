import type { components } from '#shared/types/api'
import { toCreateUserRequest, toUpdateUserRequest, type UserForm } from '~/utils/userForm'

type UserView = components['schemas']['UserView']
type UsersList = components['schemas']['UsersList']
type Role = components['schemas']['Role']

/**
 * 목록의 활성 상태 필터. 백엔드 기본값은 'active'다.
 * 아이디 UNIQUE 제약이 정지된 계정까지 덮으므로, 중복 아이디의 정체를 확인하려면
 * 'inactive'/'all'로 조회해야 한다(백엔드 docs/error-contract.md 참고).
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
  }
}
