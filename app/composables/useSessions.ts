import type { components } from '#shared/types/api'

type SessionView = components['schemas']['SessionView']
type SessionsList = components['schemas']['SessionsList']
type ActivityView = components['schemas']['ActivityView']
type ActivityList = components['schemas']['ActivityList']

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
    // 대상 유저의 모든 세션을 한 번에 종료한다. 호출한 관리자 본인의 현재 세션은
    // 백엔드가 제외하므로(RevokeAllSessionsAsAdmin), 자기 계정에 써도 화면이 끊기지 않는다.
    revokeAllForUser: (id: string) => api(`/users/${id}/sessions/revoke-all`, { method: 'POST' }),
    // 활동 타임라인: 자기 자신(SELF) / 관리자용(특정 유저).
    activity: (page = 0, size = 50): Promise<ActivityView[]> =>
      api<ActivityList>('/auth/activity', { query: { page, size } }).then(r => r.values ?? []),
    activityForUser: (id: string, page = 0, size = 50): Promise<ActivityView[]> =>
      api<ActivityList>(`/users/${id}/activity`, { query: { page, size } }).then(r => r.values ?? []),
  }
}
