// @vitest-environment nuxt
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'
import AccountsPage from './index.vue'
import { useAuthStore } from '~/stores/auth'

const { listMock, lockMock, createMock } = vi.hoisted(() => ({ listMock: vi.fn(), lockMock: vi.fn(), createMock: vi.fn() }))
mockNuxtImport('useAccounts', () => () => ({
  list: listMock, create: createMock, update: vi.fn(), remove: vi.fn(), lock: lockMock, unlock: vi.fn(),
}))
mockNuxtImport('useClients', () => () => ({
  list: vi.fn().mockResolvedValue([{ id: 'c1', name: '우리인슈맨라이프', code: 'woori', active: true }]),
  create: vi.fn(), remove: vi.fn(),
}))
mockNuxtImport('useToast', () => () => ({ toasts: ref([]), push: vi.fn() }))

describe('accounts page', () => {
  // 기존 동작(등록/잠금 버튼 노출)은 ADMIN 기준으로 검증한다 — USER 게이팅은 별도 테스트에서 확인.
  beforeEach(() => {
    const auth = useAuthStore()
    auth.user = { userId: 'a0', username: 'admin', roles: [], level: 20, companyId: 'c1' }
  })

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

  it('ADMIN(non-SYSTEM)에게는 회사 선택자가 없고, 등록 폼이 자기 회사로 고정된다', async () => {
    listMock.mockResolvedValue([])
    const auth = useAuthStore()
    auth.user = { userId: 'a1', username: 'admin', roles: [], level: 20, companyId: 'c1' }
    const el = await mountSuspended(AccountsPage)

    const addBtn = el.findAll('button').find(b => b.text() === '+ 계정 등록')!
    await addBtn.trigger('click')
    await el.vm.$nextTick()
    await new Promise(r => setTimeout(r))

    const drawerSelects = Array.from(document.querySelectorAll('select'))
    expect(drawerSelects.length).toBe(0)
    const companyInput = Array.from(document.querySelectorAll('input')).find(i => (i as HTMLInputElement).value === '우리인슈맨라이프')
    expect(companyInput).toBeTruthy()
    expect((companyInput as HTMLInputElement).disabled).toBe(true)

    // 표시만이 아니라 실제 저장 payload가 자기 회사로 고정되는지 검증한다
    // (강제 라인이 사라져도 잡히도록). 필수 입력을 채우고 저장한다.
    createMock.mockResolvedValue(undefined)
    for (const el2 of Array.from(document.querySelectorAll('input')) as HTMLInputElement[]) {
      if (el2.disabled) continue
      el2.value = 'x'
      el2.dispatchEvent(new Event('input', { bubbles: true }))
    }
    const saveBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.trim() === '저장')!
    saveBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await new Promise(r => setTimeout(r))
    expect(createMock).toHaveBeenCalledWith(expect.objectContaining({ companyId: 'c1' }))
  })

  it('USER(rank 10)에게는 등록/상세/삭제/잠금 버튼이 보이지 않는다', async () => {
    listMock.mockResolvedValue([
      { id: 'a1', insuranceCompanyCode: 'samsung_property', name: '주계정', companyId: 'c1', locked: false, createdAt: 0, updatedAt: 0 },
    ])
    const auth = useAuthStore()
    auth.user = { userId: 'u1', username: 'user', roles: [], level: 10, companyId: 'c1' }
    const el = await mountSuspended(AccountsPage)

    const buttonTexts = el.findAll('button').map(b => b.text())
    expect(buttonTexts).not.toContain('+ 계정 등록')
    expect(buttonTexts).not.toContain('상세')
    expect(buttonTexts).not.toContain('삭제')
    expect(buttonTexts).not.toContain('잠금')
    expect(buttonTexts).not.toContain('잠금해제')
  })
})
