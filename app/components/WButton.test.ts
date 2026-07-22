// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { h } from 'vue'
import WButton from './WButton.vue'

describe('WButton', () => {
  it('defaults to ghost / md / type=button', async () => {
    const el = await mountSuspended(WButton, { slots: { default: () => '저장' } })
    const btn = el.find('button')
    expect(btn.classes()).toContain('act')
    expect(btn.classes()).toContain('act--ghost')
    expect(btn.classes()).not.toContain('act--md')
    expect(btn.classes()).not.toContain('act--sm')
    expect(btn.attributes('type')).toBe('button')
    expect(btn.text()).toContain('저장')
  })

  it('maps variant and size to .act modifiers', async () => {
    const el = await mountSuspended(WButton, { props: { variant: 'danger', size: 'sm' }, slots: { default: () => '삭제' } })
    const btn = el.find('button')
    expect(btn.classes()).toContain('act--danger')
    expect(btn.classes()).toContain('act--sm')
  })

  it('renders leading and trailing icon slots', async () => {
    const el = await mountSuspended(WButton, {
      slots: {
        leading: () => h('svg', { class: 'lead' }),
        trailing: () => h('svg', { class: 'trail' }),
        default: () => '조회',
      },
    })
    expect(el.find('.wbtn__icon .lead').exists()).toBe(true)
    expect(el.find('.wbtn__icon .trail').exists()).toBe(true)
  })

  it('when loading: disables, marks aria-busy, and keeps the leading icon (shimmer overlay)', async () => {
    const el = await mountSuspended(WButton, {
      props: { loading: true },
      slots: { leading: () => h('svg', { class: 'lead' }), default: () => '조회' },
    })
    const btn = el.find('button')
    expect(btn.attributes('disabled')).toBeDefined()
    expect(btn.attributes('aria-busy')).toBe('true')
    expect(btn.classes()).toContain('wbtn--loading')
    // Icon stays in place during loading (shimmer sweeps over it, not a spinner swap).
    expect(el.find('.wbtn__icon .lead').exists()).toBe(true)
  })

  it('forwards native click through inheritAttrs', async () => {
    let n = 0
    const el = await mountSuspended(WButton, { attrs: { onClick: () => { n++ } }, slots: { default: () => 'x' } })
    await el.find('button').trigger('click')
    expect(n).toBe(1)
  })
})
