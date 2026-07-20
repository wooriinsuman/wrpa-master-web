// @vitest-environment nuxt
import { describe, it, expect, vi } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'
import UsersPage from './index.vue'

const { listMock, rolesMock, companiesMock } = vi.hoisted(() => ({ listMock: vi.fn(), rolesMock: vi.fn(), companiesMock: vi.fn() }))
mockNuxtImport('useUsers', () => () => ({ list: listMock, roles: rolesMock, create: vi.fn() }))
mockNuxtImport('useClients', () => () => ({ list: companiesMock, create: vi.fn(), remove: vi.fn() }))
mockNuxtImport('useToast', () => () => ({ toasts: ref([]), push: vi.fn() }))

describe('users page', () => {
  it('renders a user row with its username and active status badge', async () => {
    listMock.mockResolvedValue([
      { id: 'u1', username: 'admin', name: '관리자', companyId: 'c1', createdAt: 0, active: true, roles: ['ADMIN'] },
    ])
    rolesMock.mockResolvedValue([{ id: 'ADMIN', name: '관리자' }])
    companiesMock.mockResolvedValue([{ id: 'c1', name: '우리인수만', code: 'WRI', active: true }])
    const el = await mountSuspended(UsersPage)
    expect(el.text()).toContain('admin')
    expect(el.text()).toContain('사용자 등록')
    expect(el.find('.badge--done').exists()).toBe(true)
    // companyId/roleId는 이름으로 환원되어 표기된다.
    expect(el.text()).toContain('우리인수만')
    expect(el.text()).toContain('관리자')
  })
})
