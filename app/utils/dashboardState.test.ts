import { describe, it, expect } from 'vitest'
import { workerStateKind, workStateKind, formatAge, ageColorKind, formatSince, msToSec, livenessCell } from './dashboardState'

describe('dashboardState', () => {
  it('maps worker states to kinds with fallback', () => {
    expect(workerStateKind('idle')).toBe('idle')
    expect(workerStateKind('busy')).toBe('run')
    expect(workerStateKind('running')).toBe('run')
    expect(workerStateKind('error')).toBe('fail')
    expect(workerStateKind('online')).toBe('done')
    expect(workerStateKind('whatever')).toBe('idle')
  })
  it('maps work states (pending/started/done/cancel)', () => {
    expect(workStateKind('started')).toBe('run')
    expect(workStateKind('done')).toBe('done')
    expect(workStateKind('pending')).toBe('idle')
    expect(workStateKind('cancel')).toBe('fail')
  })
  it('formats heartbeat age', () => {
    expect(formatAge(undefined, 1000)).toBe('—')
    expect(formatAge(995, 1000)).toBe('5s')
    expect(formatAge(800, 1000)).toBe('3m')
  })
  it('colors age by staleness', () => {
    expect(ageColorKind(995, 1000)).toBe('done')   // 5s
    expect(ageColorKind(900, 1000)).toBe('idle')   // 100s
    expect(ageColorKind(800, 1000)).toBe('fail')   // 200s
    expect(ageColorKind(undefined, 1000)).toBe('idle')
  })
  it('converts ms epoch to seconds (API is ms, utils are sec)', () => {
    expect(msToSec(undefined)).toBeUndefined()
    expect(msToSec(1_700_000_000_000)).toBe(1_700_000_000)
  })
  it('derives liveness from last-seen (online ≤15s, 지연 ≤5m, else offline)', () => {
    const now = 1_000_000
    expect(livenessCell(undefined, now)).toEqual({ label: '오프라인', kind: 'fail' })
    expect(livenessCell(now - 5, now)).toEqual({ label: '온라인', kind: 'done' })     // 5s
    expect(livenessCell(now - 15, now)).toEqual({ label: '온라인', kind: 'done' })    // 15s boundary
    expect(livenessCell(now - 60, now)).toEqual({ label: '지연', kind: 'warn' })       // 1m
    expect(livenessCell(now - 300, now)).toEqual({ label: '지연', kind: 'warn' })      // 5m boundary
    expect(livenessCell(now - 301, now)).toEqual({ label: '오프라인', kind: 'fail' })  // >5m
  })
  it('formats relative Korean "since" with hour/day granularity', () => {
    const now = 1_000_000
    expect(formatSince(undefined, now)).toBe('—')
    expect(formatSince(now - 30, now)).toBe('30초 전')      // 30s
    expect(formatSince(now - 300, now)).toBe('5분 전')       // 5m
    expect(formatSince(now - 7200, now)).toBe('2시간 전')    // 2h
    expect(formatSince(now - 172800, now)).toBe('2일 전')    // 2d
  })
})
