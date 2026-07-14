// app/composables/useJobs.ts
import type { components } from '#shared/types/api'
import { toCreateJobRequest, toUpdateJobRequest, type JobForm } from '~/utils/jobForm'
type JobView = components['schemas']['JobView']
type RunResp = components['schemas']['RunJobResponse']

export function useJobs() {
  const api = useApi()
  return {
    list: () => api<JobView[]>('/jobs'),
    create: (f: JobForm) => api('/jobs', { method: 'POST', body: toCreateJobRequest(f) }),
    update: (id: string, f: JobForm) => api(`/jobs/${id}`, { method: 'PUT', body: toUpdateJobRequest(f) }),
    remove: (id: string) => api(`/jobs/${id}`, { method: 'DELETE' }),
    run: (id: string) => api<RunResp>(`/jobs/${id}/run`, { method: 'POST' }),
    // 수동 재생성: 해당 날짜(기본 내일)의 대기 중 자동생성분을 지우고 재생성. ADMIN 전용.
    regenerate: (date?: string) =>
      api<{ date: string; deleted: number }>('/schedule/regenerate', { method: 'POST', query: date ? { date } : undefined }),
  }
}
