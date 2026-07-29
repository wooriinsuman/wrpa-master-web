// NOTE: 백엔드 GET /schedule/queue 및 ScheduleQueue* 스키마는 이미 삭제되었다
// (wrpa-master-v2 openapi.yaml, 2026-07-28 통합). 이 컴포저블과
// app/pages/schedule-queue/index.vue는 Task 12에서 함께 제거될 예정이라 지금은
// 손대지 않는다 — 그래서 아래 타입은 더 이상 shared/types/api.d.ts에서 가져올 수
// 없어 삭제 전 스키마 형태를 그대로 로컬에 남겨둔다.
export interface ScheduleQueueEntry {
  /** 시뮬레이션이면 없음 */
  workId?: string
  jobId: string
  companyId: string
  insuranceCompanyCode: string
  accountId: string
  category: string
  closingMonth: string
  runTime: string
  priority: number
  tasks: string[]
  status: 'planned' | 'pending' | 'started' | 'done' | 'cancel' | 'failed'
  eligibleWorkerIds: string[]
}

export interface ScheduleQueueWorkerView {
  workerId: string
  name: string
  /** entries 배열 인덱스, 우선순위 순 */
  entryIndexes: number[]
}

export interface ScheduleQueueView {
  date: string
  /** 0 = 휴일 */
  businessDay: number
  /** true = 선생성 전 날짜의 시뮬레이션 */
  simulated: boolean
  entries: ScheduleQueueEntry[]
  workers: ScheduleQueueWorkerView[]
}

type QueueView = ScheduleQueueView

// GET /schedule/queue는 date를 생략하면 오늘 날짜 기준. 미래 날짜(아직 선생성
// 전)는 시뮬레이션 응답(QueueView.simulated=true)이 온다.
// PATCH .../priority, POST .../cancel은 기존 -v2 운영 경로(work.Service) 그대로
// 재사용 — 스케줄러가 만든 work도 동일한 work 레코드라 조작 방식이 같다.
export function useScheduleQueue() {
  const api = useApi()
  return {
    get: (date?: string) => api<QueueView>('/schedule/queue', { query: date ? { date } : {} }),
    setPriority: (workId: string, priority: number) =>
      api(`/works/${workId}/priority`, { method: 'PATCH', body: { priority } }),
    cancel: (workId: string) => api(`/works/${workId}/cancel`, { method: 'POST' }),
  }
}
