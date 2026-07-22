// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import WCrudPage from './WCrudPage.vue'

const base = {
  title: '거래처',
  addLabel: '+ 거래처 등록',
  emptyTitle: '거래처가 없습니다',
  columns: [{ key: 'name', label: '이름', kind: 'text' as const }],
  rows: [{ id: '1', name: 'A' }],
  pending: false,
  drawerTitle: '거래처 등록',
}

describe('WCrudPage', () => {
  it('gates 삭제 behind a confirm dialog before emitting remove', async () => {
    const el = await mountSuspended(WCrudPage, { props: base })
    expect(el.text()).toContain('A')
    const del = el.findAll('button').find(b => b.text() === '삭제')!
    await del.trigger('click')
    // Destructive: must NOT emit until the confirm is accepted.
    expect(el.emitted('remove')).toBeFalsy()

    // WConfirm portals to document.body; accept it there.
    await flushPromises()
    const confirmBtn = [...document.querySelectorAll('.cf-panel button')].find(b => b.textContent?.trim() === '삭제')!
    expect(confirmBtn).toBeTruthy()
    confirmBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await flushPromises()
    expect(el.emitted('remove')?.[0]).toEqual([{ id: '1', name: 'A' }])
  })

  it('shows 상세 only when editable', async () => {
    const ro = await mountSuspended(WCrudPage, { props: base })
    expect(ro.findAll('button').some(b => b.text() === '상세')).toBe(false)
    const ed = await mountSuspended(WCrudPage, { props: { ...base, editable: true } })
    expect(ed.findAll('button').some(b => b.text() === '상세')).toBe(true)
  })

  it('renders the row-actions-lead slot', async () => {
    const el = await mountSuspended(WCrudPage, {
      props: base,
      slots: { 'row-actions-lead': () => h('button', { class: 'act act--primary' }, '지금실행') },
    })
    expect(el.text()).toContain('지금실행')
  })

  it('emits add from the header button', async () => {
    const el = await mountSuspended(WCrudPage, { props: base })
    const add = el.findAll('button').find(b => b.text().includes('거래처 등록'))!
    await add.trigger('click')
    expect(el.emitted('add')).toBeTruthy()
  })

  // A page's @refresh must survive the WCrudPage → WPageHeader hop and drive the
  // 조회 button. Regression: a template `:on-refresh` binding arrived kebab-cased
  // (on-refresh) so the header's camelCase detection never matched.
  it('shows the 조회 button and forwards @refresh to the page', async () => {
    let n = 0
    const Parent = defineComponent({ setup() { return () => h(WCrudPage, { ...base, onRefresh: () => { n++ } }) } })
    const el = await mountSuspended(Parent)
    const btn = el.find('[aria-label="다시 조회"]')
    expect(btn.exists()).toBe(true)
    await btn.trigger('click')
    expect(n).toBe(1)
  })

  it('hides the 조회 button when the page wires no @refresh', async () => {
    const el = await mountSuspended(WCrudPage, { props: base })
    expect(el.find('[aria-label="다시 조회"]').exists()).toBe(false)
  })

  it('forwards the header-actions slot into WPageHeader', async () => {
    const el = await mountSuspended(WCrudPage, {
      props: base,
      slots: { 'header-actions': () => h('a', { class: 'act', href: '/schedule-queue' }, '작업 큐 보기') },
    })
    expect(el.text()).toContain('작업 큐 보기')
  })
})
