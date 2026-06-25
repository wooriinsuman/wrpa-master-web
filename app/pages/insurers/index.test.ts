// @vitest-environment nuxt
import { describe, it, expect, vi } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'
import InsurersPage from './index.vue'

const { listMock } = vi.hoisted(() => ({ listMock: vi.fn() }))
mockNuxtImport('useInsurers', () => () => ({ list: listMock, create: vi.fn(), update: vi.fn(), remove: vi.fn() }))
mockNuxtImport('useToast', () => () => ({ toasts: ref([]), push: vi.fn() }))

describe('insurers page', () => {
  it('renders an insurer row and its active status badge', async () => {
    listMock.mockResolvedValue([{ id: '1', code: 'SS-001', name: '삼성화재', type: 'PROPERTY', url: 'https://x', active: true }])
    const el = await mountSuspended(InsurersPage)
    expect(el.text()).toContain('삼성화재')
    expect(el.find('.badge--done').exists()).toBe(true)
  })
})
