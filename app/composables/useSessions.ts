import type { components } from '#shared/types/api'

type SessionView = components['schemas']['SessionView']
type SessionsList = components['schemas']['SessionsList']

export function useSessions() {
  const api = useApi()
  return {
    list: (): Promise<SessionView[]> => api<SessionsList>('/auth/sessions').then(r => r.values ?? []),
    revoke: (familyId: string) => api(`/auth/sessions/${familyId}/revoke`, { method: 'POST' }),
    revokeOthers: () => api('/auth/sessions/revoke-others', { method: 'POST' }),
    // 관리자용: 특정 유저의 세션 조회/강제 로그아웃. 회사 스코프는 백엔드가 강제한다
    // (SYSTEM 전체, ADMIN 자기 회사만) — 여기서는 UI 노출만 역할로 게이트한다.
    listForUser: (id: string): Promise<SessionView[]> => api<SessionsList>(`/users/${id}/sessions`).then(r => r.values ?? []),
    revokeForUser: (id: string, familyId: string) => api(`/users/${id}/sessions/${familyId}/revoke`, { method: 'POST' }),
  }
}
