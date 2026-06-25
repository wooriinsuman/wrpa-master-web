// @vitest-environment nuxt
import { describe, it, expect, vi } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'
import ClientsPage from './index.vue'

const { listMock } = vi.hoisted(() => ({ listMock: vi.fn() }))
mockNuxtImport('useClients', () => () => ({ list: listMock, create: vi.fn(), remove: vi.fn() }))
mockNuxtImport('useToast', () => () => ({ toasts: ref([]), push: vi.fn() }))

describe('clients page', () => {
  it('renders a row from the company list', async () => {
    listMock.mockResolvedValue([{ id: '1', name: '로앤손해사정', code: 'LA-01', active: true }])
    const el = await mountSuspended(ClientsPage)
    expect(el.text()).toContain('로앤손해사정')
    expect(el.text()).toContain('거래처 등록')
  })
})
