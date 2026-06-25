// @vitest-environment nuxt
import { describe, it, expect, vi } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'
import WorksPage from './index.vue'

const { listMock } = vi.hoisted(() => ({ listMock: vi.fn() }))
mockNuxtImport('useWorks', () => () => ({ list: listMock, enqueue: vi.fn() }))
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
})
