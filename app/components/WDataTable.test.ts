// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
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
})
