import { describe, it, expect } from 'vitest'
import {
  blankWorkerForm, workerTypeLabel, workerStateLabel,
  blankWorkerCreateForm, toCreateWorkerRequest, WORKER_TYPE_OPTIONS,
} from './workerForm'

describe('blankWorkerForm', () => {
  it('starts with empty company/insurer assignment', () => {
    expect(blankWorkerForm()).toEqual({ companyIds: [], insurerIds: [] })
  })
})

describe('blankWorkerCreateForm', () => {
  it('defaults type to ContractCrawl, active (not paused)', () => {
    expect(blankWorkerCreateForm()).toEqual({ type: 'ContractCrawl', paused: false })
  })
})

describe('WORKER_TYPE_OPTIONS', () => {
  it('exposes the selectable types (currently only ContractCrawl)', () => {
    expect(WORKER_TYPE_OPTIONS).toEqual([{ value: 'ContractCrawl', label: '보험사 전산 RPA' }])
  })
})

describe('toCreateWorkerRequest', () => {
  it('passes type/paused through (name is not collected)', () => {
    expect(toCreateWorkerRequest({ type: 'ContractCrawl', paused: false }))
      .toEqual({ type: 'ContractCrawl', paused: false })
  })
  it('carries the paused flag when set', () => {
    expect(toCreateWorkerRequest({ type: 'ContractCrawl', paused: true }))
      .toEqual({ type: 'ContractCrawl', paused: true })
  })
  it('rejects an empty type', () => {
    expect(() => toCreateWorkerRequest({ type: '', paused: false })).toThrow('워커 유형')
  })
})

describe('workerTypeLabel', () => {
  it('maps the ContractCrawl code to Korean', () => {
    expect(workerTypeLabel('ContractCrawl')).toBe('보험사 전산 RPA')
  })
  it('falls back to the raw value (or —) for unmapped/empty', () => {
    expect(workerTypeLabel('crawler')).toBe('crawler')
    expect(workerTypeLabel('GuaranteeInsuranceCrawl')).toBe('GuaranteeInsuranceCrawl') // 제거된 레거시 유형은 원본 코드로 표시
    expect(workerTypeLabel('')).toBe('—')
  })
})

describe('workerStateLabel', () => {
  it('maps states to Korean (case-insensitive)', () => {
    expect(workerStateLabel('idle')).toBe('대기중')
    expect(workerStateLabel('BUSY')).toBe('작업중')
    expect(workerStateLabel('offline')).toBe('오프라인')
  })
  it('falls back to 알수없음 for empty', () => {
    expect(workerStateLabel('')).toBe('알수없음')
  })
})
