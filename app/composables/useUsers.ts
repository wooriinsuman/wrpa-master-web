import type { components } from '#shared/types/api'
import { toCreateUserRequest, toUpdateUserRequest, type UserForm } from '~/utils/userForm'

type UserView = components['schemas']['UserView']
type UsersList = components['schemas']['UsersList']
type Role = components['schemas']['Role']

export function useUsers() {
  const api = useApi()
  return {
    list: (): Promise<UserView[]> => api<UsersList>('/users', { query: { size: 500 } }).then(r => r.values ?? []),
    roles: () => api<Role[]>('/roles'),
    create: (f: UserForm) => api('/users', { method: 'POST', body: toCreateUserRequest(f) }),
    update: (id: string, f: UserForm) => api(`/users/${id}`, { method: 'PUT', body: toUpdateUserRequest(f) }),
    setActive: (id: string, active: boolean) => api(`/users/${id}/active`, { method: 'POST', body: { active } }),
  }
}
