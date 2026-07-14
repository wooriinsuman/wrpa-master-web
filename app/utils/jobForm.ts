import type { components } from '#shared/types/api'
type CreateReq = components['schemas']['CreateJobRequest']
type UpdateReq = components['schemas']['UpdateJobRequest']

export interface JobForm {
  companyId: string
  accountId: string
  workFileIds: string[]
  startDay: string
  endDay: string // '' = 미지정(시작일만)
  fromMonthEnd: boolean // window 경계를 월말에서부터 카운트(시작·종료 공통, 1=말일)
  runTimes: string[]
  weekdays: number[] // 0=일 … 6=토, 비우면 전 영업일
  priority: string
  timeoutSec: string
  closingMonthOffset: string
  startBusinessDay: boolean
  endBusinessDay: boolean
  excludeWeekendHoliday: boolean
  locked: boolean
  note: string
}

function num(v: string, fallback: number): number {
  const n = parseInt(v, 10)
  return Number.isFinite(n) ? n : fallback
}

// 빈 문자열/비수 → null(끝까지). 그 외 정수.
function numOrNull(v: string): number | null {
  const t = v.trim()
  if (t === '') return null
  const n = parseInt(t, 10)
  return Number.isFinite(n) ? n : null
}

export function toCreateJobRequest(f: JobForm): CreateReq {
  if (!f.companyId.trim()) throw new Error('회사를 선택하세요.')
  if (!f.accountId.trim()) throw new Error('계정을 선택하세요.')
  if (f.workFileIds.length === 0) throw new Error('작업 파일을 1개 이상 선택하세요.')
  return {
    companyId: f.companyId.trim(),
    accountId: f.accountId.trim(),
    workFileIds: f.workFileIds,
    startDay: num(f.startDay, 1),
    startFromMonthEnd: f.fromMonthEnd,
    endDay: numOrNull(f.endDay),
    endFromMonthEnd: f.fromMonthEnd,
    runTimes: (() => {
      const rt = f.runTimes.map(s => s.trim()).filter(Boolean)
      if (rt.length === 0) throw new Error('실행시각을 1개 이상 입력하세요.')
      return rt
    })(),
    weekdays: f.weekdays,
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
  if (f.workFileIds.length === 0) throw new Error('작업 파일을 1개 이상 선택하세요.')
  return {
    workFileIds: f.workFileIds,
    startDay: num(f.startDay, 1),
    startFromMonthEnd: f.fromMonthEnd,
    endDay: numOrNull(f.endDay),
    endFromMonthEnd: f.fromMonthEnd,
    runTimes: (() => {
      const rt = f.runTimes.map(s => s.trim()).filter(Boolean)
      if (rt.length === 0) throw new Error('실행시각을 1개 이상 입력하세요.')
      return rt
    })(),
    weekdays: f.weekdays,
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
