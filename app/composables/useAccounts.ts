import type { components } from '#shared/types/api'
import { toCreateAccountRequest, toUpdateAccountRequest, type AccountForm } from '~/utils/accountForm'

type AccountView = components['schemas']['AccountView']
type AccountsList = components['schemas']['AccountsList']

export function useAccounts() {
  const api = useApi()
  return {
    list: (): Promise<AccountView[]> => api<AccountsList>('/accounts', { query: { size: 500 } }).then(r => r.values ?? []),
    create: (f: AccountForm) => api('/accounts', { method: 'POST', body: toCreateAccountRequest(f) }),
    update: (id: string, f: AccountForm) => api(`/accounts/${id}`, { method: 'PUT', body: toUpdateAccountRequest(f) }),
    remove: (id: string) => api(`/accounts/${id}`, { method: 'DELETE' }),
    lock: (id: string) => api(`/accounts/${id}/lock`, { method: 'POST' }),
    unlock: (id: string) => api(`/accounts/${id}/unlock`, { method: 'POST' }),
  }
}
