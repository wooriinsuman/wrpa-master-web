// @vitest-environment nuxt
import { describe, it, expect, vi } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import WorkersPage from './index.vue'

const { listMock, rotateMock } = vi.hoisted(() => ({ listMock: vi.fn(), rotateMock: vi.fn() }))
mockNuxtImport('useWorkers', () => () => ({
  list: listMock, create: vi.fn(), update: vi.fn(), remove: vi.fn(), rotateKey: rotateMock,
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

  it('rotates the key and reveals it when 키 재발급 is clicked', async () => {
    listMock.mockResolvedValue([
      { id: 'wk1', name: 'ergate-01', type: 'crawler', state: 'online', shared: true, hidHealthCount: 2, hidTotalCount: 2, createdAt: 0, updatedAt: 0 },
    ])
    rotateMock.mockResolvedValue({ apiKey: 'wk_NEWKEY123' })
    const el = await mountSuspended(WorkersPage)
    const btn = el.findAll('button').find(b => b.text() === '키 재발급')!
    expect(btn).toBeTruthy()
    await btn.trigger('click')
    await flushPromises()
    expect(rotateMock).toHaveBeenCalledWith('wk1')
    expect(document.body.textContent).toContain('wk_NEWKEY123')
  })
})
