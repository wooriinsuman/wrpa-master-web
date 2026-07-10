import type { components } from '#shared/types/api'
type CreateReq = components['schemas']['CreateJobRequest']
type UpdateReq = components['schemas']['UpdateJobRequest']

export interface JobForm {
  companyId: string
  accountId: string
  workFileIdsText: string
  startDay: string
  runTime: string
  priority: string
  timeoutSec: string
  closingMonthOffset: string
  startBusinessDay: boolean
  endBusinessDay: boolean
  excludeWeekendHoliday: boolean
  locked: boolean
  note: string
}

export function splitIds(text: string): string[] {
  return text.split(/[,\s]+/).map(s => s.trim()).filter(Boolean)
}

export function joinIds(ids: string[]): string {
  return ids.join(', ')
}

function num(v: string, fallback: number): number {
  const n = parseInt(v, 10)
  return Number.isFinite(n) ? n : fallback
}

function assertWorkFileIds(f: JobForm): string[] {
  if (!f.companyId.trim()) throw new Error('회사를 입력하세요.')
  if (!f.accountId.trim()) throw new Error('계정을 입력하세요.')
  const workFileIds = splitIds(f.workFileIdsText)
  if (workFileIds.length === 0) throw new Error('작업 파일 ID를 1개 이상 입력하세요.')
  return workFileIds
}

function assertWorkFileIdsOnly(f: JobForm): string[] {
  const workFileIds = splitIds(f.workFileIdsText)
  if (workFileIds.length === 0) throw new Error('작업 파일 ID를 1개 이상 입력하세요.')
  return workFileIds
}

export function toCreateJobRequest(f: JobForm): CreateReq {
  const workFileIds = assertWorkFileIds(f)
  return {
    companyId: f.companyId.trim(),
    accountId: f.accountId.trim(),
    workFileIds,
    startDay: num(f.startDay, 1),
    runTime: f.runTime,
    priority: num(f.priority, 0),
    timeoutSec: num(f.timeoutSec, 300),
    closingMonthOffset: num(f.closingMonthOffset, 0),
    startBusinessDay: f.startBusinessDay,
    endBusinessDay: f.endBusinessDay,
    excludeWeekendHoliday: f.excludeWeekendHoliday,
    locked: f.locked,
    note: f.note,
  }
}

export function toUpdateJobRequest(f: JobForm): UpdateReq {
  const workFileIds = assertWorkFileIdsOnly(f)
  return {
    workFileIds,
    startDay: num(f.startDay, 1),
    runTime: f.runTime,
    priority: num(f.priority, 0),
    timeoutSec: num(f.timeoutSec, 300),
    closingMonthOffset: num(f.closingMonthOffset, 0),
    startBusinessDay: f.startBusinessDay,
    endBusinessDay: f.endBusinessDay,
    excludeWeekendHoliday: f.excludeWeekendHoliday,
    locked: f.locked,
    note: f.note,
  }
}
