import type { components } from '#shared/types/api'

type QueueView = components['schemas']['ScheduleQueueView']

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
