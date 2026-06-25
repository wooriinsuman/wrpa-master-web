// @vitest-environment nuxt
import { describe, it, expect, vi } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'
import WorkersPage from './index.vue'

const { listMock } = vi.hoisted(() => ({ listMock: vi.fn() }))
mockNuxtImport('useWorkers', () => () => ({
  list: listMock, create: vi.fn(), update: vi.fn(), remove: vi.fn(), rotateKey: vi.fn(),
}))
mockNuxtImport('useToast', () => () => ({ toasts: ref([]), push: vi.fn() }))

describe('workers page', () => {
  it('renders a worker row with its name and an online status badge', async () => {
    listMock.mockResolvedValue([
      { id: 'wk1', name: 'ergate-01', type: 'crawler', state: 'online', shared: true, hidHealthCount: 2, hidTotalCount: 2, createdAt: 0, updatedAt: 0 },
    ])
    const el = await mountSuspended(WorkersPage)
    expect(el.text()).toContain('ergate-01')
    expect(el.text()).toContain('워커 등록')
    // workerStateKind('online') === 'done' → .badge--done
    expect(el.find('.badge--done').exists()).toBe(true)
  })
})
