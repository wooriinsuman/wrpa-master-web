// @vitest-environment nuxt
import { describe, it, expect, vi } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'
import UsersPage from './index.vue'
import { useAuthStore } from '~/stores/auth'

const { listMock, rolesMock, companiesMock, createMock, updateMock, setActiveMock } = vi.hoisted(() => ({
  listMock: vi.fn(), rolesMock: vi.fn(), companiesMock: vi.fn(),
  createMock: vi.fn(), updateMock: vi.fn(), setActiveMock: vi.fn(),
}))
mockNuxtImport('useUsers', () => () => ({ list: listMock, roles: rolesMock, create: createMock, update: updateMock, setActive: setActiveMock }))
mockNuxtImport('useClients', () => () => ({ list: companiesMock, create: vi.fn(), remove: vi.fn() }))
mockNuxtImport('useToast', () => () => ({ toasts: ref([]), push: vi.fn() }))

const seedUser = { id: 'u1', username: 'admin', name: '관리자', email: 'a@x.io', companyId: 'c1', createdAt: 0, active: true, roles: ['ADMIN'] }

function seedMocks(user = seedUser) {
  listMock.mockResolvedValue([user])
  rolesMock.mockResolvedValue([{ id: 'ADMIN', name: '관리자' }])
  companiesMock.mockResolvedValue([{ id: 'c1', name: '우리인수만', code: 'WRI', active: true }])
  createMock.mockResolvedValue(undefined)
  updateMock.mockResolvedValue(undefined)
  setActiveMock.mockResolvedValue(undefined)
}

function findByText(el: any, tag: string, text: string) {
  return el.findAll(tag).find((n: any) => n.text().trim() === text)
}

describe('users page', () => {
  it('renders a user row with its username, active badge, and name-resolved role/company', async () => {
    seedMocks()
    const el = await mountSuspended(UsersPage)
    expect(el.text()).toContain('admin')
    expect(el.text()).toContain('사용자 등록')
    expect(el.find('.badge--done').exists()).toBe(true)
    // companyId/roleId는 이름으로 환원되어 표기된다.
    expect(el.text()).toContain('우리인수만')
    expect(el.text()).toContain('관리자')
  })

  it('편집 버튼은 프리필된 수정 드로어를 열고 저장 시 update를 호출한다', async () => {
    seedMocks()
    const el = await mountSuspended(UsersPage)
    await findByText(el, 'button', '편집')!.trigger('click')
    await el.vm.$nextTick()
    await new Promise(r => setTimeout(r)) // 드로어(reka-ui portal) 마운트 대기
    // 드로어는 body로 teleport되어 el 밖에 있으므로 document에서 확인.
    expect(document.body.textContent).toContain('사용자 수정')
    const saveBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.trim() === '저장')
    expect(saveBtn).toBeTruthy()
    saveBtn!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await el.vm.$nextTick()
    expect(updateMock).toHaveBeenCalledWith('u1', expect.objectContaining({ name: '관리자', roleIds: ['ADMIN'] }))
    expect(createMock).not.toHaveBeenCalled()
  })

  it('정지 버튼은 setActive(id, false)를 호출한다', async () => {
    seedMocks()
    const el = await mountSuspended(UsersPage)
    await findByText(el, 'button', '정지')!.trigger('click')
    await el.vm.$nextTick()
    expect(setActiveMock).toHaveBeenCalledWith('u1', false)
  })

  it('ADMIN(non-SYSTEM)에게는 회사 선택자가 없고, 등록/수정 폼이 자기 회사로 고정된다', async () => {
    seedMocks()
    const auth = useAuthStore()
    auth.user = { userId: 'a1', username: 'admin', roles: [], level: 20, companyId: 'c1' }
    const el = await mountSuspended(UsersPage)

    await findByText(el, 'button', '+ 사용자 등록')!.trigger('click')
    await el.vm.$nextTick()
    await new Promise(r => setTimeout(r))
    // 회사 select는 없고, 자기 회사명이 비활성 입력으로 표시된다.
    const drawerSelects = Array.from(document.querySelectorAll('select'))
    expect(drawerSelects.length).toBe(0)
    const companyInput = Array.from(document.querySelectorAll('input')).find(i => (i as HTMLInputElement).value === '우리인수만')
    expect(companyInput).toBeTruthy()
    expect((companyInput as HTMLInputElement).disabled).toBe(true)

    const nameInput = Array.from(document.querySelectorAll('input')).find(i => i.closest('label')?.textContent?.includes('이름')) as HTMLInputElement
    nameInput.value = '새 사용자'
    nameInput.dispatchEvent(new Event('input'))
    const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement
    passwordInput.value = 'pw12345'
    passwordInput.dispatchEvent(new Event('input'))
    const usernameInput = document.querySelector('input[placeholder="admin"]') as HTMLInputElement
    usernameInput.value = 'newuser'
    usernameInput.dispatchEvent(new Event('input'))

    const saveBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.trim() === '저장')!
    saveBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await el.vm.$nextTick()
    expect(createMock).toHaveBeenCalledWith(expect.objectContaining({ companyId: 'c1' }))
  })
})
