import type { components } from '#shared/types/api'
import { toEnqueueWorkRequest, type WorkForm } from '~/utils/workForm'

type WorkView = components['schemas']['WorkView']
type WorkSummaryView = components['schemas']['WorkSummaryView']

// 작업 현황 필터. 빈 값은 보내지 않는다 — 백엔드는 빈 문자열을 "필터 없음"으로
// 보지만, 쿼리스트링에 남기면 캐시 키만 지저분해진다.
export interface WorkListParams {
  date?: string
  state?: string
  createType?: string
  company?: string
  category?: string
  workerId?: string
}

function clean(p: WorkListParams): Record<string, string> {
  return Object.fromEntries(
    Object.entries(p).filter(([, v]) => v !== undefined && v !== ''),
  ) as Record<string, string>
}

// setPriority/cancel은 SYSTEM 전용 엔드포인트다 — 호출부에서 권한을 게이팅한다.
export function useWorks() {
  const api = useApi()
  return {
    list: (p: WorkListParams = {}) => api<WorkView[]>('/works', { query: clean(p) }),
    summary: (p: WorkListParams = {}) =>
      api<WorkSummaryView>('/works/summary', { query: clean(p) }),
    enqueue: (f: WorkForm) => api('/works', { method: 'POST', body: toEnqueueWorkRequest(f) }),
    setPriority: (workId: string, priority: number) =>
      api(`/works/${workId}/priority`, { method: 'PATCH', body: { priority } }),
    cancel: (workId: string) => api(`/works/${workId}/cancel`, { method: 'POST' }),
  }
}
