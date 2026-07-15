// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import WOrderBands from './WOrderBands.vue'
import type { BandRow } from '~/utils/orderBands'

const dataTypeNames = { new: '신계약' }

describe('WOrderBands', () => {
  it('renders OK badge, one track per row, and a category label when gap/overlap-free', async () => {
    const rows: BandRow[] = [
      { bizDayFrom: 1, bizDayTo: 5, order: ['-1:new'] },
      { bizDayFrom: 6, bizDayTo: null, order: ['-1:new'] },
    ]
    const el = await mountSuspended(WOrderBands, { props: { rows, dataTypeNames } })
    expect(el.text()).toContain('겹침·공백 없음')
    expect(el.findAll('.obands-row').length).toBe(2)
    expect(el.text()).toContain('전월 신계약')
  })

  it('renders a 겹침 warning for overlapping rows', async () => {
    const rows: BandRow[] = [
      { bizDayFrom: 1, bizDayTo: 7, order: ['0:new'] },
      { bizDayFrom: 6, bizDayTo: 13, order: ['0:new'] },
    ]
    const el = await mountSuspended(WOrderBands, { props: { rows, dataTypeNames } })
    expect(el.text()).toContain('겹침')
    expect(el.text()).toContain('6')
  })

  it('renders a 공백 warning for gap rows', async () => {
    const rows: BandRow[] = [
      { bizDayFrom: 1, bizDayTo: 4, order: ['0:new'] },
      { bizDayFrom: 6, bizDayTo: 8, order: ['0:new'] },
    ]
    const el = await mountSuspended(WOrderBands, { props: { rows, dataTypeNames } })
    expect(el.text()).toContain('공백')
  })

  it('summary mode lists per-band date range + priority order (no timeline track/badge)', async () => {
    const rows: BandRow[] = [
      { bizDayFrom: 1, bizDayTo: 5, order: ['-1:new', '0:new'] },
      { bizDayFrom: 6, bizDayTo: null, order: ['-1:new'] },
    ]
    const el = await mountSuspended(WOrderBands, { props: { rows, dataTypeNames, summary: true } })
    expect(el.findAll('.obands-sum-line').length).toBe(2)
    expect(el.text()).toContain('구간 2개')
    expect(el.text()).toContain('영업일 1–5')
    expect(el.text()).toContain('영업일 6~')
    expect(el.text()).toContain('전월 신계약 › 당월 신계약') // 우선순위 순서
    // 요약 모드는 full 모드의 타임라인 트랙/배지를 렌더하지 않는다
    expect(el.find('.obands-row').exists()).toBe(false)
    expect(el.text()).not.toContain('겹침·공백 없음')
  })

  it('summary mode surfaces a 겹침 warning when rows overlap', async () => {
    const rows: BandRow[] = [
      { bizDayFrom: 1, bizDayTo: 7, order: ['0:new'] },
      { bizDayFrom: 6, bizDayTo: 13, order: ['0:new'] },
    ]
    const el = await mountSuspended(WOrderBands, { props: { rows, dataTypeNames, summary: true } })
    expect(el.text()).toContain('⚠ 겹침')
  })
})
