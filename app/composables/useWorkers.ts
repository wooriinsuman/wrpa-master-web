import type { components } from '#shared/types/api'

type WorkerView = components['schemas']['WorkerView']
type WorkersList = components['schemas']['WorkersList']
type RotateKeyResponse = components['schemas']['RotateKeyResponse']

// 워커는 자기 등록(register-v2)되므로 관리자 create/update는 없다.
// 관리자가 하는 일: 배정(회사·보험사) 편집 + 키 재발급 + 삭제(비활성).
export function useWorkers() {
  const api = useApi()
  return {
    list: (): Promise<WorkerView[]> => api<WorkersList>('/workers', { query: { size: 500 } }).then(r => r.values ?? []),
    remove: (id: string) => api(`/workers/${id}`, { method: 'DELETE' }),
    rotateKey: (id: string) => api<RotateKeyResponse>(`/workers/${id}/rotate-key`, { method: 'POST' }),
    assignCompany: (id: string, companyId: string) => api(`/workers/${id}/companies/${companyId}`, { method: 'POST' }),
    removeCompany: (id: string, companyId: string) => api(`/workers/${id}/companies/${companyId}`, { method: 'DELETE' }),
    assignInsurer: (id: string, insurerId: string) => api(`/workers/${id}/insurers/${insurerId}`, { method: 'POST' }),
    removeInsurer: (id: string, insurerId: string) => api(`/workers/${id}/insurers/${insurerId}`, { method: 'DELETE' }),
  }
}
