import { describe, it, expect } from 'vitest'
import { workerStateKind, workStateKind, formatAge, ageColorKind } from './dashboardState'

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
})
