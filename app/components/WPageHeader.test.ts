// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { h } from 'vue'
import WPageHeader from './WPageHeader.vue'

describe('WPageHeader', () => {
  it('renders title and emits add on button click', async () => {
    const el = await mountSuspended(WPageHeader, { props: { title: '보험사', addLabel: '+ 보험사 등록' } })
    expect(el.text()).toContain('보험사')
    await el.find('button.add').trigger('click')
    expect(el.emitted('add')).toBeTruthy()
  })
  it('emits update:search on input', async () => {
    const el = await mountSuspended(WPageHeader, { props: { title: 'x', addLabel: 'y', search: '' } })
    await el.find('input').setValue('삼성')
    expect(el.emitted('update:search')?.[0]).toEqual(['삼성'])
  })
  it('marks the search input non-autofillable so Chrome cannot inject saved credentials into it', async () => {
    const el = await mountSuspended(WPageHeader, { props: { title: 'x', addLabel: 'y', search: '' } })
    const input = el.find('input.ph-search')
    expect(input.attributes('autocomplete')).toBe('off')
    expect(input.attributes('type')).toBe('search')
    expect(input.attributes('name')).toBe('q')
  })
  it('hides the refresh button when no onRefresh handler is provided', async () => {
    const el = await mountSuspended(WPageHeader, { props: { title: 'x', addLabel: 'y' } })
    expect(el.find('[aria-label="다시 조회"]').exists()).toBe(false)
  })
  it('shows the refresh button and calls onRefresh on click', async () => {
    let called = 0
    const el = await mountSuspended(WPageHeader, { props: { title: 'x' }, attrs: { onRefresh: () => { called++ } } })
    const btn = el.find('[aria-label="다시 조회"]')
    expect(btn.exists()).toBe(true)
    await btn.trigger('click')
    expect(called).toBe(1)
  })
  it('renders the header-actions slot', async () => {
    const el = await mountSuspended(WPageHeader, {
      props: { title: 'x', addLabel: 'y' },
      slots: { 'header-actions': () => h('a', { class: 'act', href: '/foo' }, '바로가기') },
    })
    expect(el.text()).toContain('바로가기')
  })
})
