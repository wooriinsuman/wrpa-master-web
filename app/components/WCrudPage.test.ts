// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { h } from 'vue'
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
  it('renders rows and a 삭제 action that emits remove with the row', async () => {
    const el = await mountSuspended(WCrudPage, { props: base })
    expect(el.text()).toContain('A')
    const del = el.findAll('button').find(b => b.text() === '삭제')!
    await del.trigger('click')
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
})
