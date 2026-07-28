// 활동 로그 action → 한국어 라벨 + WStatusBadge kind 매핑.
import type { StatusKind } from './status'

const LABELS: Record<string, string> = {
  login: '로그인',
  logout: '로그아웃',
  session_revoked: '이 기기에서 세션 종료',
  other_sessions_revoked: '다른 기기 모두 로그아웃',
  admin_session_revoked: '관리자에 의한 강제 로그아웃',
  admin_all_sessions_revoked: '관리자에 의한 전체 강제 로그아웃',
  refresh_reuse_detected: '토큰 재사용 탐지 — 세션 차단',
  session_absolute_expired: '세션 만료 — 재인증 필요',
}
const KINDS: Record<string, StatusKind> = {
  login: 'done', logout: 'idle', session_revoked: 'warn',
  other_sessions_revoked: 'warn', admin_session_revoked: 'fail',
  admin_all_sessions_revoked: 'fail',
  refresh_reuse_detected: 'fail', session_absolute_expired: 'idle',
}
export function activityLabel(action: string): string { return LABELS[action] ?? action }
export function activityKind(action: string): StatusKind { return KINDS[action] ?? 'idle' }
