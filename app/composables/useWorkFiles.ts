import type { components } from '#shared/types/api'
import { toCreateWorkFileRequest, toUpdateWorkFileRequest, type WorkFileForm } from '~/utils/workFileForm'
type View = components['schemas']['WorkFileView']
export function useWorkFiles() {
  const api = useApi()
  return {
    list: () => api<View[]>('/work-files'),
    create: (f: WorkFileForm) => api('/work-files', { method: 'POST', body: toCreateWorkFileRequest(f) }),
    update: (id: string, f: WorkFileForm) => api(`/work-files/${id}`, { method: 'PUT', body: toUpdateWorkFileRequest(f) }),
    remove: (id: string) => api(`/work-files/${id}`, { method: 'DELETE' }),
  }
}
