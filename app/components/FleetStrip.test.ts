// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import FleetStrip from './FleetStrip.vue'

const cells = [
  { key: 'ergate-01', kind: 'run' as const, age: '2s', ageKind: 'done' as const, sub: 'kr-rpa-a01' },
  { key: 'ergate-07', kind: 'fail' as const, age: '47s', ageKind: 'idle' as const, sub: 'kr-rpa-b03' },
]

describe('FleetStrip', () => {
  it('renders one cell per worker with key, age, and pulse', async () => {
    const el = await mountSuspended(FleetStrip, { props: { cells } })
    expect(el.findAll('.cell')).toHaveLength(2)
    expect(el.text()).toContain('ergate-01')
    expect(el.text()).toContain('47s')
    expect(el.find('.pulse--run').exists()).toBe(true)
  })
})
