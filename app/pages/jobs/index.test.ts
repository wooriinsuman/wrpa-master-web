// @vitest-environment nuxt
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'
import WorksPage from './index.vue'
import { useAuthStore } from '~/stores/auth'

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
  // GET/POST /works는 백엔드에서 RankSystem 전용이다 — 기존 동작(실행 버튼 노출)은
  // SYSTEM 기준으로 검증한다. ADMIN/USER 게이팅은 별도 테스트에서 확인.
  beforeEach(() => {
    const auth = useAuthStore()
    auth.user = { userId: 'sys', username: 'sys', roles: [], level: 30 }
  })

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

  it('ADMIN(rank 20)에게는 "+ 작업 실행" 버튼이 보이지 않는다 (POST /works는 RankSystem 전용)', async () => {
    const auth = useAuthStore()
    auth.user = { userId: 'a1', username: 'admin', roles: [], level: 20, companyId: 'c1' }
    listMock.mockResolvedValue([
      { id: 'wk1', company: 'samsung_property', tasks: ['contract_list_all_a'], state: 'started' },
    ])
    clearNuxtData(['works', 'works-datatypes'])
    const el = await mountSuspended(WorksPage)
    expect(el.findAll('button').map(b => b.text())).not.toContain('+ 작업 실행')
  })
})
