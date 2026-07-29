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
  size?: number
}

// 목록 상한. 백엔드 listPaging은 기본 200건, [1,1000]으로 클램프한다 — 명시하지
// 않으면 200건에서 조용히 잘리는데 요약(/works/summary)은 그날 전량을 세므로
// 표와 요약이 서로 다른 모집단을 말하게 된다. 상한에 닿았는지는 호출부가
// "받은 행 수 === 이 값"으로 판정해 사용자에게 알린다.
export const WORK_LIST_LIMIT = 1000

function clean(p: WorkListParams): Record<string, string | number> {
  return Object.fromEntries(
    Object.entries(p).filter(([, v]) => v !== undefined && v !== ''),
  ) as Record<string, string | number>
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
