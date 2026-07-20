import type { components } from '#shared/types/api'

type WorkerView = components['schemas']['WorkerView']
type WorkersList = components['schemas']['WorkersList']
type RotateKeyResponse = components['schemas']['RotateKeyResponse']
type CreateWorkerRequest = components['schemas']['CreateWorkerRequest']
type WorkerCreateResponse = components['schemas']['WorkerCreateResponse']

// 워커는 자기 등록(register-v2)으로 자기 정보를 갱신하지만, 워커 레코드+API 키 자체는
// 관리자가 미리 생성해야 한다(POST /workers, apiKey는 1회만 반환). 그 외 관리자 작업:
// 배정(회사·보험사) 편집 + 키 재발급 + 삭제(비활성).
export function useWorkers() {
  const api = useApi()
  return {
    list: (): Promise<WorkerView[]> => api<WorkersList>('/workers', { query: { size: 500 } }).then(r => r.values ?? []),
    create: (body: CreateWorkerRequest) => api<WorkerCreateResponse>('/workers', { method: 'POST', body }),
    remove: (id: string) => api(`/workers/${id}`, { method: 'DELETE' }),
    rotateKey: (id: string) => api<RotateKeyResponse>(`/workers/${id}/rotate-key`, { method: 'POST' }),
    // 작업 배정 일시중단/재개. paused 워커는 online 유지하되 poll 시 새 작업을 받지 않음.
    pause: (id: string) => api(`/workers/${id}/pause`, { method: 'POST' }),
    resume: (id: string) => api(`/workers/${id}/resume`, { method: 'POST' }),
    assignCompany: (id: string, companyId: string) => api(`/workers/${id}/companies/${companyId}`, { method: 'POST' }),
    removeCompany: (id: string, companyId: string) => api(`/workers/${id}/companies/${companyId}`, { method: 'DELETE' }),
    assignInsurer: (id: string, insurerId: string) => api(`/workers/${id}/insurers/${insurerId}`, { method: 'POST' }),
    removeInsurer: (id: string, insurerId: string) => api(`/workers/${id}/insurers/${insurerId}`, { method: 'DELETE' }),
  }
}
