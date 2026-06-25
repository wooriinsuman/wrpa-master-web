import type { components } from '#shared/types/api'
import { toWorkerRequest, type WorkerForm } from '~/utils/workerForm'

type WorkerView = components['schemas']['WorkerView']
type WorkersList = components['schemas']['WorkersList']
type WorkerCreateResponse = components['schemas']['WorkerCreateResponse']
type RotateKeyResponse = components['schemas']['RotateKeyResponse']

export function useWorkers() {
  const api = useApi()
  return {
    list: (): Promise<WorkerView[]> => api<WorkersList>('/workers', { query: { size: 500 } }).then(r => r.values ?? []),
    create: (f: WorkerForm) => api<WorkerCreateResponse>('/workers', { method: 'POST', body: toWorkerRequest(f) }),
    update: (id: string, f: WorkerForm) => api(`/workers/${id}`, { method: 'PUT', body: toWorkerRequest(f) }),
    remove: (id: string) => api(`/workers/${id}`, { method: 'DELETE' }),
    rotateKey: (id: string) => api<RotateKeyResponse>(`/workers/${id}/rotate-key`, { method: 'POST' }),
  }
}
