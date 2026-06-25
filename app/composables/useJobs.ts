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
  }
}
