import { describe, it, expect, vi, beforeEach } from 'vitest'

// useUsers()는 useApi()(→ $fetch.create({...}))를 호출한다. Nuxt 자동 임포트는
// vitest 변환 단계에서 useApi를 실제 구현으로 치환하므로, 그 안에서 참조하는 전역
// $fetch만 스텁하면 된다 — useSessions.test.ts와 동일 패턴.
const apiMock = vi.fn()
const fetchStub = Object.assign(vi.fn(), { create: vi.fn(() => apiMock) })
vi.stubGlobal('$fetch', fetchStub)

import { useUsers } from './useUsers'

describe('useUsers', () => {
  beforeEach(() => apiMock.mockReset())

  // 아이디 UNIQUE 제약은 정지된 계정까지 포함하는데 목록 기본값은 활성만 준다.
  // 그래서 status를 실제로 실어 보내는지가 "화면에 없는 아이디" 문제의 핵심이다.
  it('list()는 기본값으로 활성 계정만 요청한다', async () => {
    apiMock.mockResolvedValue({ values: [] })
    await useUsers().list()
    expect(apiMock).toHaveBeenCalledWith('/users', { query: { size: 500, status: 'active' } })
  })

  it('list(status)는 status를 쿼리로 실어 보낸다', async () => {
    apiMock.mockResolvedValue({ values: [] })
    await useUsers().list('inactive')
    expect(apiMock).toHaveBeenCalledWith('/users', { query: { size: 500, status: 'inactive' } })
    await useUsers().list('all')
    expect(apiMock).toHaveBeenCalledWith('/users', { query: { size: 500, status: 'all' } })
  })

  it('list()는 values가 없으면 []로 떨어진다', async () => {
    apiMock.mockResolvedValue({})
    expect(await useUsers().list()).toEqual([])
  })

  it('setActive(id, true)로 정지된 계정을 다시 활성화한다', async () => {
    apiMock.mockResolvedValue({})
    await useUsers().setActive('u-1', true)
    expect(apiMock).toHaveBeenCalledWith('/users/u-1/active', { method: 'POST', body: { active: true } })
  })

  // 완전 삭제. 백엔드는 정지된 계정만 허용하므로(409 user_active) 화면이 활성 행에
  // 버튼을 내주지 않는 것과 짝을 이룬다.
  it('remove(id)는 DELETE /users/{id}를 호출한다', async () => {
    apiMock.mockResolvedValue({})
    await useUsers().remove('u-1')
    expect(apiMock).toHaveBeenCalledWith('/users/u-1', { method: 'DELETE' })
  })
})
