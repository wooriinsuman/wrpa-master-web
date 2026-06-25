// @vitest-environment nuxt
import { describe, it, expect, vi } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'
import AccountsPage from './index.vue'

const { listMock } = vi.hoisted(() => ({ listMock: vi.fn() }))
mockNuxtImport('useAccounts', () => () => ({
  list: listMock, create: vi.fn(), update: vi.fn(), remove: vi.fn(), lock: vi.fn(), unlock: vi.fn(),
}))
mockNuxtImport('useToast', () => () => ({ toasts: ref([]), push: vi.fn() }))

describe('accounts page', () => {
  it('renders an account row with its name and a normal (unlocked) status badge', async () => {
    listMock.mockResolvedValue([
      { id: 'a1', insuranceCompanyCode: 'samsung_property', name: '주계정', companyId: 'c1', locked: false, createdAt: 0, updatedAt: 0 },
    ])
    const el = await mountSuspended(AccountsPage)
    expect(el.text()).toContain('주계정')
    expect(el.text()).toContain('계정 등록')
    expect(el.find('.badge--done').exists()).toBe(true)
  })
})
