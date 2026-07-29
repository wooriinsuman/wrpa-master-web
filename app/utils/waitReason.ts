import type { StatusKind } from './status'

export interface WaitReasonCell { label: string; kind: StatusKind }

// 백엔드 waitReason(httpapi 진단)의 표시 매핑. no_worker/account_locked는
// "영원히 실행되지 않는" 사고라 fail, 나머지는 정상 대기라 idle.
const REASON: Record<string, WaitReasonCell> = {
  no_worker: { label: '자격 워커 없음', kind: 'fail' },
  account_locked: { label: '계정 잠김', kind: 'fail' },
  not_yet: { label: '실행시각 대기', kind: 'idle' },
  account_busy: { label: '계정 사용중', kind: 'idle' },
  ready: { label: '대기 중', kind: 'idle' },
}

// 대기 사유는 pending 행에만 의미가 있다. 모르는 값이면 null — 임의 라벨을
// 지어내는 것보다 빈 칸이 정직하다.
export function waitReasonCell(reason: string | undefined, state: string): WaitReasonCell | null {
  if (state !== 'pending' || !reason) return null
  return REASON[reason] ?? null
}
