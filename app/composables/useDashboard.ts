import type { components } from '#shared/types/api'
type WorkersList = components['schemas']['WorkersList']
type WorkerView = components['schemas']['WorkerView']
type WorkView = components['schemas']['WorkView']

export function useDashboard() {
  const api = useApi()
  const workers = ref<WorkerView[]>([])
  const works = ref<WorkView[]>([])
  const { pending, refresh } = useAsyncData('dashboard', async () => {
    const [w, k] = await Promise.all([
      api<WorkersList>('/workers', { query: { size: 500 } }),
      api<WorkView[]>('/works'),
    ])
    workers.value = w.values ?? []
    works.value = k ?? []
    return true
  })
  return { workers, works, pending, refresh }
}
