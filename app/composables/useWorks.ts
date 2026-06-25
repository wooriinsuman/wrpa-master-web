import type { components } from '#shared/types/api'
import { toEnqueueWorkRequest, type WorkForm } from '~/utils/workForm'

type WorkView = components['schemas']['WorkView']

export function useWorks() {
  const api = useApi()
  return {
    list: () => api<WorkView[]>('/works'),
    enqueue: (f: WorkForm) => api('/works', { method: 'POST', body: toEnqueueWorkRequest(f) }),
  }
}
