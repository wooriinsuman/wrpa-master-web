import { describe, it, expect } from 'vitest'
import { fmtSize, fmtDate } from './format'

describe('fmtSize', () => {
  it('formats bytes into B/KB/MB/GB', () => {
    expect(fmtSize(0)).toBe('—')
    expect(fmtSize(512)).toBe('512 B')
    expect(fmtSize(2048)).toBe('2.0 KB')
    expect(fmtSize(5 * 1024 * 1024)).toBe('5.0 MB')
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
