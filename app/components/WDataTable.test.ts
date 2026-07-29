// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { h } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import WDataTable from './WDataTable.vue'

const columns = [
  { key: 'status', label: '상태', kind: 'status' as const },
  { key: 'name', label: '보험사명', kind: 'text' as const },
  { key: 'code', label: '코드', kind: 'mono' as const },
]

describe('WDataTable', () => {
  it('renders headers and rows, with status cell as a badge', async () => {
    const rows = [{ status: '활성', name: '삼성화재', code: 'SS-001' }]
    const el = await mountSuspended(WDataTable, { props: { columns, rows } })
    expect(el.text()).toContain('보험사명')
    expect(el.text()).toContain('삼성화재')
    expect(el.find('.badge--done').exists()).toBe(true)
  })
  it('renders the actions slot per row', async () => {
    const rows = [{ status: '활성', name: '삼성화재', code: 'SS-001' }]
    const el = await mountSuspended(WDataTable, {
      props: { columns, rows },
      slots: { actions: ({ row }: any) => `act-${row.code}` },
    })
    expect(el.text()).toContain('act-SS-001')
  })
  it('emits rowClick for a row body click but not for a click inside the actions cell', async () => {
    const rows = [{ status: '활성', name: '삼성화재', code: 'SS-001' }]
    const el = await mountSuspended(WDataTable, {
      props: { columns, rows },
      slots: { actions: () => h('button', { class: 'act' }, '취소') },
    })
    await el.find('.dt-row .dt-td').trigger('click')
    expect(el.emitted('rowClick')?.length).toBe(1)
    // 액션 셀은 propagation을 멈춘다 — 우선순위 입력/취소가 행 클릭을 겸하면 안 된다.
    await el.find('.dt-actions button').trigger('click')
    expect(el.emitted('rowClick')?.length).toBe(1)
  })

  it('renders a StatusCell with its explicit kind', async () => {
    const cols = [{ key: 'status', label: '상태', kind: 'status' as const }]
    const rows = [{ status: { label: '대기', kind: 'fail' } }]
    const el = await mountSuspended(WDataTable, { props: { columns: cols, rows } })
    expect(el.find('.badge--fail').exists()).toBe(true)
    expect(el.text()).toContain('대기')
  })
})
