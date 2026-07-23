import type { components } from '#shared/types/api'

type SessionView = components['schemas']['SessionView']
type SessionsList = components['schemas']['SessionsList']

export function useSessions() {
  const api = useApi()
  return {
    list: (): Promise<SessionView[]> => api<SessionsList>('/auth/sessions').then(r => r.values ?? []),
    revoke: (familyId: string) => api(`/auth/sessions/${familyId}/revoke`, { method: 'POST' }),
    revokeOthers: () => api('/auth/sessions/revoke-others', { method: 'POST' }),
  }
}
