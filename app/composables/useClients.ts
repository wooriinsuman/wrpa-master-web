import type { components } from '#shared/types/api'
import { toCreateClientRequest, type ClientForm } from '~/utils/clientForm'
type Company = components['schemas']['Company']
export function useClients() {
  const api = useApi()
  return {
    list: () => api<Company[]>('/companies'),
    create: (f: ClientForm) => api('/companies', { method: 'POST', body: toCreateClientRequest(f) }),
    remove: (id: string) => api(`/companies/${id}`, { method: 'DELETE' }),
  }
}
