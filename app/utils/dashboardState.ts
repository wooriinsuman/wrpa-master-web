import type { StatusKind } from './status'

const WORKER_KIND: Record<string, StatusKind> = {
  idle: 'idle', ready: 'idle', offline: 'idle',
  busy: 'run', running: 'run', started: 'run', active: 'run',
  error: 'fail', failed: 'fail', unavailable: 'fail',
  online: 'done', done: 'done',
}
export function workerStateKind(state: string): StatusKind {
  return WORKER_KIND[state?.toLowerCase()] ?? 'idle'
}

// work.State* 전부를 덮는다 — 'failed'가 빠져 있으면 재시도 예산을 소진해 끝난
// 작업이 대시보드에서 idle(회색)로 보이고 실패 카운트에서도 빠진다.
const WORK_KIND: Record<string, StatusKind> = {
  started: 'run', done: 'done', pending: 'idle', cancel: 'fail', failed: 'fail',
}
export function workStateKind(state: string): StatusKind {
  return WORK_KIND[state?.toLowerCase()] ?? 'idle'
}

export function formatAge(lastSec: number | undefined, nowSec: number): string {
  if (lastSec == null) return '—'
  const age = Math.max(0, nowSec - lastSec)
  return age < 60 ? `${Math.floor(age)}s` : `${Math.floor(age / 60)}m`
}

// API의 lastConnectedAt은 ms epoch인데 아래 시간 유틸(formatAge·formatSince·
// ageColorKind)은 모두 초 단위 규약이다. 넘기기 전에 반드시 이걸로 변환한다.
export function msToSec(ms: number | undefined): number | undefined {
  return ms == null ? undefined : Math.floor(ms / 1000)
}

// 목록용 상대시간(한글). formatAge는 분까지만 표기하므로 시/일 단위가 필요한
// 리스트에는 이걸 쓴다. lastSec는 초 단위(대시보드와 동일 규약).
export function formatSince(lastSec: number | undefined, nowSec: number): string {
  if (lastSec == null) return '—'
  const age = Math.max(0, nowSec - lastSec)
  if (age < 60) return `${Math.floor(age)}초 전`
  if (age < 3600) return `${Math.floor(age / 60)}분 전`
  if (age < 86400) return `${Math.floor(age / 3600)}시간 전`
  return `${Math.floor(age / 86400)}일 전`
}

// last-seen(초)만으로 워커 생사를 판정한다. 하드 크래시 시 워커가 보고한 state는
// sweeper가 뒤집기 전까지 최대 5분 얼어붙으므로, 하트비트가 더 신뢰할 수 있는 신호다.
// 임계값은 백엔드 설정에 정렬: 하트비트 5초 → 15초(3회 누락) 이내 온라인,
// 5분(deadWorkerThresholdSec, sweeper의 offline 판정) 이내는 지연(재부팅 등), 그 이상 오프라인.
export function livenessCell(lastSec: number | undefined, nowSec: number): { label: string; kind: StatusKind } {
  if (lastSec == null) return { label: '오프라인', kind: 'fail' }
  const age = nowSec - lastSec
  if (age <= 15) return { label: '온라인', kind: 'done' }
  if (age <= 300) return { label: '지연', kind: 'warn' }
  return { label: '오프라인', kind: 'fail' }
}

export function ageColorKind(lastSec: number | undefined, nowSec: number): StatusKind {
  if (lastSec == null) return 'idle'
  const age = nowSec - lastSec
  if (age <= 10) return 'done'
  if (age <= 120) return 'idle'
  return 'fail'
}
