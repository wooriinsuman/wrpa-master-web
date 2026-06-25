import type { components } from '#shared/types/api'
import { toCreateRequest, toUpdateRequest, type InsurerForm } from '~/utils/insurerForm'

type View = components['schemas']['InsuranceCompanyView']

export function useInsurers() {
  const api = useApi()
  return {
    list: () => api<View[]>('/insurance-companies'),
    create: (f: InsurerForm) => api('/insurance-companies', { method: 'POST', body: toCreateRequest(f) }),
    update: (id: string, f: InsurerForm) => api(`/insurance-companies/${id}`, { method: 'PUT', body: toUpdateRequest(f) }),
    remove: (id: string) => api(`/insurance-companies/${id}`, { method: 'DELETE' }),
  }
}
