import { describe, it, expect } from 'vitest'
import { toCreateJobRequest, toUpdateJobRequest, type JobForm } from './jobForm'

const base: JobForm = {
  companyId: 'c1', accountId: 'a1', workFileIds: ['wf1', 'wf2'],
  startDay: '3', endDay: '5', runTime: '09:00', priority: '5', timeoutSec: '300', closingMonthOffset: '0',
  startBusinessDay: true, endBusinessDay: false, excludeWeekendHoliday: true, locked: false, note: '야간',
}

describe('jobForm', () => {
  it('toCreateJobRequest parses numbers + passes the workFileIds array', () => {
    const r = toCreateJobRequest(base)
    expect(r.companyId).toBe('c1')
    expect(r.accountId).toBe('a1')
    expect(r.workFileIds).toEqual(['wf1', 'wf2'])
    expect(r.startDay).toBe(3)
    expect(r.endDay).toBe(5)
    expect(r.priority).toBe(5)
    expect(r.note).toBe('야간')
  })

  it('endDay: blank → null (끝까지), 숫자 → 정수', () => {
    expect(toCreateJobRequest({ ...base, endDay: '' }).endDay).toBeNull()
    expect(toCreateJobRequest({ ...base, endDay: '7' }).endDay).toBe(7)
  })

  it('toCreateJobRequest throws when company/account empty or no work files', () => {
    expect(() => toCreateJobRequest({ ...base, companyId: ' ' })).toThrow()
    expect(() => toCreateJobRequest({ ...base, accountId: '' })).toThrow()
    expect(() => toCreateJobRequest({ ...base, workFileIds: [] })).toThrow()
  })

  it('toUpdateJobRequest omits company/account but requires work files', () => {
    const r = toUpdateJobRequest(base)
    expect(r.workFileIds).toEqual(['wf1', 'wf2'])
    expect('companyId' in r).toBe(false)
    expect(() => toUpdateJobRequest({ ...base, workFileIds: [] })).toThrow()
  })
})
