// @vitest-environment nuxt
import { describe, it, expect, vi } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'
import AccountsPage from './index.vue'

const { listMock, lockMock } = vi.hoisted(() => ({ listMock: vi.fn(), lockMock: vi.fn() }))
mockNuxtImport('useAccounts', () => () => ({
  list: listMock, create: vi.fn(), update: vi.fn(), remove: vi.fn(), lock: lockMock, unlock: vi.fn(),
}))
mockNuxtImport('useClients', () => () => ({
  list: vi.fn().mockResolvedValue([{ id: 'c1', name: '우리인슈맨라이프', code: 'woori', active: true }]),
  create: vi.fn(), remove: vi.fn(),
}))
mockNuxtImport('useToast', () => () => ({ toasts: ref([]), push: vi.fn() }))

describe('accounts page', () => {
  it('renders an account row with the company name (not its UUID) and a normal status badge', async () => {
    listMock.mockResolvedValue([
      { id: 'a1', insuranceCompanyCode: 'samsung_property', name: '주계정', companyId: 'c1', locked: false, createdAt: 0, updatedAt: 0 },
    ])
    const el = await mountSuspended(AccountsPage)
    expect(el.text()).toContain('주계정')
    expect(el.text()).toContain('계정 등록')
    expect(el.text()).toContain('우리인슈맨라이프') // companyId → 회사명 매핑
    expect(el.text()).not.toContain('c1')
    expect(el.find('.badge--done').exists()).toBe(true)
  })

  it('shows a 잠금 button for an unlocked account and calls lock when clicked', async () => {
    listMock.mockResolvedValue([
      { id: 'a1', insuranceCompanyCode: 'samsung_property', name: '주계정', companyId: 'c1', locked: false, createdAt: 0, updatedAt: 0 },
    ])
    lockMock.mockResolvedValue(null)
    const el = await mountSuspended(AccountsPage)
    const btn = el.findAll('button').find(b => b.text() === '잠금')!
    expect(btn).toBeTruthy()
    await btn.trigger('click')
    expect(lockMock).toHaveBeenCalledWith('a1')
  })
})
