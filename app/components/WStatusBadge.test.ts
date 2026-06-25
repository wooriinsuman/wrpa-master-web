// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import WStatusBadge from './WStatusBadge.vue'

describe('WStatusBadge', () => {
  it('renders the label and the kind class', async () => {
    const el = await mountSuspended(WStatusBadge, { props: { label: '활성' } })
    expect(el.text()).toContain('활성')
    expect(el.find('.badge--done').exists()).toBe(true)
  })
})
