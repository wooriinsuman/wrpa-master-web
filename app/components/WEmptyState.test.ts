// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import WEmptyState from './WEmptyState.vue'

describe('WEmptyState', () => {
  it('renders message and emits cta', async () => {
    const el = await mountSuspended(WEmptyState, { props: { title: '검색 결과가 없습니다', message: '다른 키워드로 검색하세요.', ctaLabel: '+ 등록' } })
    expect(el.text()).toContain('검색 결과가 없습니다')
    await el.find('button').trigger('click')
    expect(el.emitted('cta')).toBeTruthy()
  })
})
