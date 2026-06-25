// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import StatCard from './StatCard.vue'

describe('StatCard', () => {
  it('renders label, value, sub and the kind dot class', async () => {
    const el = await mountSuspended(StatCard, { props: { label: '실행중', value: '18', kind: 'run', sub: '활성 워크' } })
    expect(el.text()).toContain('실행중')
    expect(el.text()).toContain('18')
    expect(el.text()).toContain('활성 워크')
    expect(el.find('.dot--run').exists()).toBe(true)
  })
})
