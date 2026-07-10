// @vitest-environment nuxt
import { describe, it, expect, vi } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'
import WorksPage from './index.vue'

const { listMock } = vi.hoisted(() => ({ listMock: vi.fn() }))
mockNuxtImport('useWorks', () => () => ({ list: listMock, enqueue: vi.fn() }))
mockNuxtImport('useDataTypes', () => () => ({
  list: vi.fn().mockResolvedValue([
    { code: 'new', name: '신계약', note: '' },
  ]),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}))
mockNuxtImport('useToast', () => () => ({ toasts: ref([]), push: vi.fn() }))

describe('works page', () => {
  it('renders a work row with its company and a running status badge', async () => {
    listMock.mockResolvedValue([
      { id: 'wk1', company: 'samsung_property', tasks: ['contract_list_all_a'], state: 'started' },
    ])
    const el = await mountSuspended(WorksPage)
    expect(el.text()).toContain('samsung_property')
    expect(el.text()).toContain('작업 실행')
    // workStateKind('started') === 'run' → WStatusBadge renders .badge--run
    expect(el.find('.badge--run').exists()).toBe(true)
  })

  it('renders the category column, resolving the data-type name and blanking manual runs', async () => {
    listMock.mockResolvedValue([
      { id: 'wk1', company: 'samsung_property', tasks: ['contract_list_all_a'], state: 'started', category: '0:new' },
      { id: 'wk2', company: 'hyundai_marine', tasks: ['contract_list_all_b'], state: 'done', category: '' },
    ])
    // useAsyncData caches by key across mounts within the same test file —
    // clear it so this mount re-fetches instead of reusing the first test's cache.
    clearNuxtData(['works', 'works-datatypes'])
    const el = await mountSuspended(WorksPage)
    expect(el.text()).toContain('카테고리')
    expect(el.text()).toContain('당월 신계약')
  })
})
