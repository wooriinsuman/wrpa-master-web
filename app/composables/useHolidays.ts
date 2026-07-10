import type { components } from '#shared/types/api'

type View = components['schemas']['HolidayView']

export function useHolidays() {
  const api = useApi()
  return {
    list: (year: number) => api<View[]>('/holidays', { query: { year } }),
    upsert: (day: string, name: string, active: boolean) =>
      api(`/holidays/${day}`, { method: 'PUT', body: { name, active } }),
    remove: (day: string) => api(`/holidays/${day}`, { method: 'DELETE' }),
    sync: () => api<components['schemas']['SyncHolidaysResponse']>('/holidays/sync', { method: 'POST' }),
  }
}
