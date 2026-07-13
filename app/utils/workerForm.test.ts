import { describe, it, expect } from 'vitest'
import { blankWorkerForm, workerTypeLabel, workerStateLabel } from './workerForm'

describe('blankWorkerForm', () => {
  it('starts with empty company/insurer assignment', () => {
    expect(blankWorkerForm()).toEqual({ companyIds: [], insurerIds: [] })
  })
})

describe('workerTypeLabel', () => {
  it('maps legacy WorkerType codes to Korean', () => {
    expect(workerTypeLabel('ContractCrawl')).toBe('보험사 전산 RPA')
    expect(workerTypeLabel('GuaranteeInsuranceCrawl')).toBe('보증보험 RPA')
  })
  it('falls back to the raw value (or —) for unknown/empty', () => {
    expect(workerTypeLabel('crawler')).toBe('crawler')
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
