// @vitest-environment nuxt
import { describe, it, expect, afterEach } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import WDrawer from './WDrawer.vue'

describe('WDrawer', () => {
  afterEach(() => {
    // DialogPortal teleports to document.body; unmount between tests so body is clean
    document.body.innerHTML = ''
  })

  it('renders title and body content when open', async () => {
    await mountSuspended(WDrawer, { props: { open: true, title: '보험사 등록' }, slots: { default: () => '폼내용' } })
    expect(document.body.textContent).toContain('보험사 등록')
    expect(document.body.textContent).toContain('폼내용')
  })
  it('renders nothing when closed', async () => {
    await mountSuspended(WDrawer, { props: { open: false, title: '보험사 등록' } })
    expect(document.body.textContent).not.toContain('보험사 등록')
  })
})
