import { describe, it, expect } from 'vitest'
import { fmtSize, fmtDate, fmtDuration, localToday } from './format'

describe('fmtSize', () => {
  it('formats bytes into B/KB/MB/GB', () => {
    expect(fmtSize(0)).toBe('—')
    expect(fmtSize(512)).toBe('512 B')
    expect(fmtSize(2048)).toBe('2.0 KB')
    expect(fmtSize(5 * 1024 * 1024)).toBe('5.0 MB')
  })
})

describe('fmtDuration', () => {
  it('formats seconds into 분/초', () => {
    expect(fmtDuration(0)).toBe('—')
    expect(fmtDuration(45)).toBe('45초')
    expect(fmtDuration(300)).toBe('5분')
    expect(fmtDuration(330)).toBe('5분 30초')
  })
})

describe('fmtDate', () => {
  it('returns — for empty or invalid input', () => {
    expect(fmtDate('')).toBe('—')
    expect(fmtDate('not-a-date')).toBe('—')
  })
  it('formats a valid ISO string', () => {
    expect(fmtDate('2026-07-10T00:00:00Z')).not.toBe('—')
  })
})

// localToday는 날짜로 스코프되는 조회(GET /works)에 그대로 실려 나간다 —
// UTC로 계산하면 KST 09:00 이전에 어제 목록을 보게 된다.
describe('localToday', () => {
  it('로컬 시간 기준 YYYY-MM-DD를 만든다', () => {
    expect(localToday(new Date(2026, 6, 28, 10, 0, 0))).toBe('2026-07-28')
  })

  it('월/일을 0으로 채운다', () => {
    expect(localToday(new Date(2026, 0, 3, 0, 0, 0))).toBe('2026-01-03')
  })

  // toISOString().slice(0,10)로 짰다면 KST 08:00은 전날(UTC 23:00)이 된다.
  it('자정 직후에도 UTC로 밀리지 않는다', () => {
    expect(localToday(new Date(2026, 6, 28, 0, 30, 0))).toBe('2026-07-28')
  })
})
