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

const WORK_KIND: Record<string, StatusKind> = {
  started: 'run', done: 'done', pending: 'idle', cancel: 'fail',
}
export function workStateKind(state: string): StatusKind {
  return WORK_KIND[state?.toLowerCase()] ?? 'idle'
}

export function formatAge(lastSec: number | undefined, nowSec: number): string {
  if (lastSec == null) return '—'
  const age = Math.max(0, nowSec - lastSec)
  return age < 60 ? `${Math.floor(age)}s` : `${Math.floor(age / 60)}m`
}

export function ageColorKind(lastSec: number | undefined, nowSec: number): StatusKind {
  if (lastSec == null) return 'idle'
  const age = nowSec - lastSec
  if (age <= 10) return 'done'
  if (age <= 120) return 'idle'
  return 'fail'
}
