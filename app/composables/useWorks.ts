import type { components } from '#shared/types/api'
import { toEnqueueWorkRequest, type WorkForm } from '~/utils/workForm'

type WorkView = components['schemas']['WorkView']
type WorkSummaryView = components['schemas']['WorkSummaryView']
type WorkActionResponse = components['schemas']['WorkActionResponse']

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

// 요약(GET /works/summary)은 그 날짜의 상태 분포 자체가 결과물이라 state를
// 받지 않는다 — WorkListParams를 그대로 재사용하면 state를 넘겨도 조용히
// 무시되어(백엔드가 파싱조차 하지 않는다) "필터가 걸린 요약"이라는 착각만
// 남는다. 목록에서 state와 size를 빼 컴파일 단계에서 막는다.
export type WorkSummaryParams = Omit<WorkListParams, 'state' | 'size'>

// 요약 파라미터는 목록 파라미터에서 "빼서" 만든다 — 손으로 다시 나열하면 필터가
// 하나 늘 때 목록만 좁혀지고 요약은 예전 모집단을 계속 세어, 한 화면의 두 숫자가
// 서로 다른 것을 세게 된다. 빼는 두 키에는 각각 이유가 있다:
//   state — 상태 분포가 요약의 결과물 자체다(백엔드가 파싱조차 하지 않는다).
//   size  — 요약에는 페이징이 없다. 그날 전량을 센다.
// 나머지는 이름을 몰라도 그대로 따라가므로, 새 필터는 목록 쪽에만 추가하면 된다.
export function toSummaryParams(p: WorkListParams): WorkSummaryParams {
  const { state: _state, size: _size, ...rest } = p
  return rest
}

// 목록 상한. 백엔드 listPaging은 기본 200건, [1,1000]으로 클램프한다 — 명시하지
// 않으면 200건에서 조용히 잘리는데 요약(/works/summary)은 그날 전량을 세므로
// 표와 요약이 서로 다른 모집단을 말하게 된다. 상한에 닿았는지는 호출부가
// "받은 행 수 === 이 값"으로 판정해 사용자에게 알린다.
export const WORK_LIST_LIMIT = 1000

function clean(p: WorkListParams | WorkSummaryParams): Record<string, string | number> {
  return Object.fromEntries(
    Object.entries(p).filter(([, v]) => v !== undefined && v !== ''),
  ) as Record<string, string | number>
}

// setPriority/cancel은 SYSTEM 전용 엔드포인트다 — 호출부에서 권한을 게이팅한다.
export function useWorks() {
  const api = useApi()
  return {
    list: (p: WorkListParams = {}) => api<WorkView[]>('/works', { query: clean(p) }),
    summary: (p: WorkSummaryParams = {}) =>
      api<WorkSummaryView>('/works/summary', { query: clean(p) }),
    enqueue: (f: WorkForm) => api('/works', { method: 'POST', body: toEnqueueWorkRequest(f) }),
    setPriority: (workId: string, priority: number) =>
      api(`/works/${workId}/priority`, { method: 'PATCH', body: { priority } }),
    // cancel/restart는 멱등이다 — 이미 끝난 work이나 없는 id에도 200 + { result }를
    // 돌려준다. 응답으로 존재 여부를 구분할 수 없다는 뜻이므로 화면은 성공 토스트
    // 뒤에 반드시 목록을 다시 읽어 실제 상태를 확인해야 한다.
    // (POST /works/{id}/restart도 같은 규약으로 문서화돼 있지만 아직 화면이 없어
    //  래핑하지 않는다 — 쓰는 곳이 생길 때 추가한다.)
    cancel: (workId: string) =>
      api<WorkActionResponse>(`/works/${workId}/cancel`, { method: 'POST' }),
  }
}
