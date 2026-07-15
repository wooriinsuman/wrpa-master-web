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

  it('compact mode renders the strip without badge or chip text', async () => {
    const rows: BandRow[] = [
      { bizDayFrom: 1, bizDayTo: 5, order: ['-1:new'] },
      { bizDayFrom: 6, bizDayTo: null, order: ['-1:new'] },
    ]
    const el = await mountSuspended(WOrderBands, { props: { rows, dataTypeNames, compact: true } })
    expect(el.find('.obands-strip').exists()).toBe(true)
    expect(el.text()).not.toContain('겹침·공백 없음')
    expect(el.text()).not.toContain('전월 신계약')
    expect(el.findAll('.obands-block').length).toBe(2)
  })
})
