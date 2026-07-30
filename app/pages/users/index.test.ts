// @vitest-environment nuxt
import { describe, it, expect, vi } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'
import { clearNuxtData } from '#app'
import UsersPage from './index.vue'
import { useAuthStore } from '~/stores/auth'

const { listMock, rolesMock, companiesMock, createMock, updateMock, setActiveMock, removeMock, pushMock } = vi.hoisted(() => ({
  listMock: vi.fn(), rolesMock: vi.fn(), companiesMock: vi.fn(),
  createMock: vi.fn(), updateMock: vi.fn(), setActiveMock: vi.fn(), removeMock: vi.fn(), pushMock: vi.fn(),
}))
mockNuxtImport('useUsers', () => () => ({ list: listMock, roles: rolesMock, create: createMock, update: updateMock, setActive: setActiveMock, remove: removeMock }))
mockNuxtImport('useClients', () => () => ({ list: companiesMock, create: vi.fn(), remove: vi.fn() }))
mockNuxtImport('useToast', () => () => ({ toasts: ref([]), push: pushMock }))

const seedUser = { id: 'u1', username: 'admin', name: '관리자', email: 'a@x.io', companyId: 'c1', createdAt: 0, active: true, roles: ['ADMIN'] }

function seedMocks(user = seedUser) {
  // useAsyncData('users')는 테스트 간 페이로드에 캐시된다 — 지우지 않으면 다음
  // 마운트가 캐시를 재사용해 list()를 아예 부르지 않는다.
  clearNuxtData('users')
  pushMock.mockClear()
  listMock.mockReset()
  listMock.mockResolvedValue([user])
  rolesMock.mockResolvedValue([{ id: 'ADMIN', name: '관리자' }])
  companiesMock.mockResolvedValue([{ id: 'c1', name: '우리인수만', code: 'WRI', active: true }])
  createMock.mockResolvedValue(undefined)
  updateMock.mockResolvedValue(undefined)
  setActiveMock.mockResolvedValue(undefined)
  removeMock.mockReset()
  removeMock.mockResolvedValue(undefined)
}

function findByText(el: any, tag: string, text: string) {
  return el.findAll(tag).find((n: any) => n.text().trim() === text)
}

describe('users page', () => {
  // 정지는 soft delete다(deactivated_at). 기본이 활성만이면 정지 직후 행이 사라져
  // 삭제와 구분되지 않으므로, 이 화면(SYSTEM 전용)은 기본으로 전부 보여준다.
  it('첫 로드는 정지 계정까지 포함해 조회한다', async () => {
    seedMocks()
    await mountSuspended(UsersPage)
    expect(listMock).toHaveBeenCalledWith('all')
  })

  it('정지된 사용자도 정지 배지와 함께 목록에 나온다', async () => {
    seedMocks({ ...seedUser, id: 'u2', username: 'ghost', active: false })
    const el = await mountSuspended(UsersPage)
    expect(el.text()).toContain('ghost')
    expect(el.find('.badge--idle').exists()).toBe(true)
  })

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

  // --- 정지 계정 가시성 (사용자 등록 500 버그의 UX 절반) ---
  // 아이디 UNIQUE 제약은 정지 계정까지 포함하는데 목록 기본값은 활성만 보여준다.
  // 필터가 없으면 운영자는 "화면에 없는 아이디"가 중복이라는 말만 듣고 끝난다.

  // status가 실제로 요청에 실리는지는 useUsers.test.ts가 본다(여기서는
  // useAsyncData('users')가 파일 내 첫 마운트의 핸들러를 재사용해 인자를 신뢰할 수 없다).
  it('상태 필터를 정지로 바꾸면 목록을 다시 읽어 비활성 계정을 보여준다', async () => {
    seedMocks()
    const el = await mountSuspended(UsersPage)
    const select = el.find('select[aria-label="상태"]')
    expect(select.exists()).toBe(true)
    // 활성/정지/전체 세 선택지가 있어야 운영자가 아이디의 주인을 찾을 수 있다.
    expect(select.findAll('option').map(o => o.text())).toEqual(['활성', '정지', '전체'])
    expect(select.findAll('option').map(o => o.attributes('value'))).toEqual(['active', 'inactive', 'all'])

    const before = listMock.mock.calls.length
    listMock.mockResolvedValue([{ ...seedUser, id: 'u2', username: 'dbg-h-0730', active: false }])
    await select.setValue('inactive')
    await new Promise(r => setTimeout(r))
    expect(listMock.mock.calls.length).toBeGreaterThan(before) // 필터 변경 → 재조회
    expect(el.text()).toContain('dbg-h-0730')
    // 정지 계정은 '정지' 배지로 구분되고, 다시 활성화할 수 있어야 한다.
    expect(el.find('.badge--idle').exists()).toBe(true)
    expect(findByText(el, 'button', '활성')).toBeTruthy()
  })

  it('아이디 중복 409는 정지 계정 확인 방법을 안내한다', async () => {
    seedMocks()
    createMock.mockRejectedValue({ data: { error: { code: 'username_taken', message: 'username already in use' } } })
    const el = await mountSuspended(UsersPage)
    await findByText(el, 'button', '+ 사용자 등록')!.trigger('click')
    await el.vm.$nextTick()
    await new Promise(r => setTimeout(r))
    const saveBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.trim() === '저장')!
    saveBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await new Promise(r => setTimeout(r))

    const [message, kind] = pushMock.mock.calls.at(-1)!
    expect(kind).toBe('error')
    expect(message).toContain('이미 사용 중인 아이디입니다')
    expect(message).toContain('정지')
    // 백엔드 영문 message는 화면에 절대 나오지 않는다.
    expect(message).not.toContain('username already in use')
  })

  // 완전 삭제는 되돌릴 수 없으므로 정지(되돌릴 수 있는 동작) 뒤에만 노출한다.
  it('활성 계정에는 삭제 버튼이 없다', async () => {
    seedMocks()
    const el = await mountSuspended(UsersPage)
    expect(findByText(el, 'button', '삭제')).toBeUndefined()
  })

  it('정지된 계정의 삭제 버튼은 확인 다이얼로그를 열고 아직 삭제하지 않는다', async () => {
    seedMocks({ ...seedUser, active: false })
    const el = await mountSuspended(UsersPage)
    await findByText(el, 'button', '삭제')!.trigger('click')
    await el.vm.$nextTick()
    await new Promise(r => setTimeout(r)) // WConfirm(reka-ui portal) 마운트 대기
    expect(document.body.textContent).toContain('사용자 완전 삭제')
    // 'admin' 단독으로는 검증되지 않는다 — 아이디 컬럼에 이미 렌더링되어 있어
    // deleteMessage가 비어 있어도 통과한다. deleteMessage만이 만드는 문구로 검증한다.
    expect(document.body.textContent).toContain('관리자(admin) 계정을 완전히 삭제합니다')
    expect(document.body.textContent).toContain('복구할 수 없으며, 감사 이력은 보존됩니다')
    expect(removeMock).not.toHaveBeenCalled()
  })

  it('확인 다이얼로그에서 완전 삭제를 누르면 remove(id)를 호출한다', async () => {
    seedMocks({ ...seedUser, active: false })
    const el = await mountSuspended(UsersPage)
    await findByText(el, 'button', '삭제')!.trigger('click')
    await el.vm.$nextTick()
    await new Promise(r => setTimeout(r))
    const confirmBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.trim() === '완전 삭제')
    expect(confirmBtn).toBeTruthy()
    confirmBtn!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await el.vm.$nextTick()
    expect(removeMock).toHaveBeenCalledWith('u1')
  })

  // 완전 삭제의 토스트 계약을 고정한다: 성공 문구가 나가고 실패 문구는 나가지 않는다.
  // 주의 — 이 테스트는 refresh를 try 안/밖으로 옮기는 것을 구분하지 못한다. 지금의
  // useAsyncData refresh()가 에러를 던지지 않고 흡수하기 때문이다. 잡아내는 것은
  // 토스트 문구·개수가 바뀌거나 두 토스트가 함께 나가는 회귀다.
  it('삭제 성공 후 재조회가 실패해도 실패 토스트를 내지 않는다', async () => {
    seedMocks({ ...seedUser, active: false })
    listMock.mockReset()
    listMock.mockResolvedValueOnce([{ ...seedUser, active: false }])
    listMock.mockRejectedValue(new Error('boom'))
    const el = await mountSuspended(UsersPage)
    await findByText(el, 'button', '삭제')!.trigger('click')
    await el.vm.$nextTick()
    await new Promise(r => setTimeout(r))
    const confirmBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.trim() === '완전 삭제')
    confirmBtn!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await el.vm.$nextTick()
    await new Promise(r => setTimeout(r))

    expect(removeMock).toHaveBeenCalledWith('u1')
    expect(pushMock).toHaveBeenCalledWith('완전히 삭제되었습니다.', 'success')
    expect(pushMock).not.toHaveBeenCalledWith(expect.stringContaining('삭제에 실패'), 'error')
  })

  // 빈 목록 문구는 필터마다 참이어야 한다. 기본값이 '전체'가 되면서 "'전체'로 바꾸면
  // 보입니다"를 기본 문구로 쓰면 이미 그 필터에 있는 운영자에게 하는 말이 된다.
  it('빈 목록 문구는 상태 필터마다 사실인 문장을 낸다', async () => {
    seedMocks()
    listMock.mockResolvedValue([])
    const el = await mountSuspended(UsersPage)

    // 기본값 '전체' — 필터가 아무것도 감추지 않으므로 정말로 사용자가 없다.
    expect(el.text()).toContain('사용자가 없습니다')
    expect(el.text()).toContain('아래에서 새 사용자를 등록하세요.')
    expect(el.text()).not.toContain('상태 필터를')

    for (const [value, title] of [['active', '활성 사용자가 없습니다'], ['inactive', '정지된 사용자가 없습니다']]) {
      await el.find('select').setValue(value)
      await el.vm.$nextTick()
      await new Promise(r => setTimeout(r)) // useAsyncData watch 재조회 대기
      expect(el.text()).toContain(title)
      expect(el.text()).toContain('상태 필터를 \'전체\'로 바꾸면 모든 사용자를 볼 수 있습니다.')
    }
  })
})
