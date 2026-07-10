import type { components } from '#shared/types/api'
import { toCreateDataTypeRequest, toUpdateDataTypeRequest, type DataTypeForm } from '~/utils/dataTypeForm'

type View = components['schemas']['DataTypeView']

export function useDataTypes() {
  const api = useApi()
  return {
    list: () => api<View[]>('/data-types'),
    create: (f: DataTypeForm) => api('/data-types', { method: 'POST', body: toCreateDataTypeRequest(f) }),
    update: (code: string, f: DataTypeForm) => api(`/data-types/${code}`, { method: 'PUT', body: toUpdateDataTypeRequest(f) }),
    remove: (code: string) => api(`/data-types/${code}`, { method: 'DELETE' }),
  }
}
