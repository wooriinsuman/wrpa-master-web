import { describe, it, expect } from 'vitest'
import { splitIds, joinIds, toCreateJobRequest, type JobForm } from './jobForm'

const base: JobForm = {
  companyId: 'c1', accountId: 'a1', workFileIdsText: 'wf1, wf2',
  startDay: '1', runTime: '09:00', priority: '5', timeoutSec: '300', closingMonthOffset: '0',
  startBusinessDay: true, endBusinessDay: false, excludeWeekendHoliday: true, locked: false, note: '야간',
}

describe('jobForm', () => {
  it('splitIds trims, splits on comma/space, drops empties', () => {
    expect(splitIds('wf1, wf2 ,, wf3')).toEqual(['wf1', 'wf2', 'wf3'])
    expect(splitIds('   ')).toEqual([])
  })
  it('joinIds joins with ", "', () => {
    expect(joinIds(['a', 'b'])).toBe('a, b')
  })
  it('toCreateJobRequest parses numbers + workFileIds array', () => {
    const r = toCreateJobRequest(base)
    expect(r.companyId).toBe('c1')
    expect(r.workFileIds).toEqual(['wf1', 'wf2'])
    expect(r.startDay).toBe(1)
    expect(r.priority).toBe(5)
    expect(r.locked).toBe(false)
    expect(r.note).toBe('야간')
  })
  it('throws when companyId/accountId empty or no workFileIds', () => {
    expect(() => toCreateJobRequest({ ...base, companyId: ' ' })).toThrow()
    expect(() => toCreateJobRequest({ ...base, accountId: '' })).toThrow()
    expect(() => toCreateJobRequest({ ...base, workFileIdsText: '  ' })).toThrow()
  })
})
