import { describe, it, expect, vi, beforeEach } from 'vitest'

// useSessions()는 useApi()(→ $fetch.create({...}))를 호출한다(useUsers.ts와 동일 패턴).
// Nuxt 자동 임포트는 vitest 변환 단계에서 useApi를 실제 구현으로 치환하므로,
// 그 안에서 참조하는 전역 $fetch만 스텁하면 된다 — refresh.test.ts의
// vi.stubGlobal('$fetch', ...) 패턴과 동일. $fetch.create(...)가 이 mock을 반환하게 한다.
const apiMock = vi.fn()
const fetchStub = Object.assign(vi.fn(), { create: vi.fn(() => apiMock) })
vi.stubGlobal('$fetch', fetchStub)

import { useSessions } from './useSessions'

describe('useSessions', () => {
  beforeEach(() => apiMock.mockReset())

  it('list() calls GET /auth/sessions and unwraps values', async () => {
    apiMock.mockResolvedValue({ values: [{ familyId: 'f1', createdAt: 1, lastUsedAt: 2, active: true, current: true }] })
    const result = await useSessions().list()
    expect(apiMock).toHaveBeenCalledWith('/auth/sessions')
    expect(result).toEqual([{ familyId: 'f1', createdAt: 1, lastUsedAt: 2, active: true, current: true }])
  })

  it('list() defaults to [] when values is missing', async () => {
    apiMock.mockResolvedValue({})
    expect(await useSessions().list()).toEqual([])
  })

  it('revoke(familyId) posts to /auth/sessions/{familyId}/revoke', async () => {
    apiMock.mockResolvedValue({})
    await useSessions().revoke('fam-123')
    expect(apiMock).toHaveBeenCalledWith('/auth/sessions/fam-123/revoke', { method: 'POST' })
  })

  it('revokeOthers() posts to /auth/sessions/revoke-others', async () => {
    apiMock.mockResolvedValue({})
    await useSessions().revokeOthers()
    expect(apiMock).toHaveBeenCalledWith('/auth/sessions/revoke-others', { method: 'POST' })
  })

  it('listForUser(id) calls GET /users/{id}/sessions and unwraps values', async () => {
    apiMock.mockResolvedValue({ values: [{ familyId: 'f2', createdAt: 1, lastUsedAt: 2, active: true, current: false }] })
    const result = await useSessions().listForUser('u-1')
    expect(apiMock).toHaveBeenCalledWith('/users/u-1/sessions')
    expect(result).toEqual([{ familyId: 'f2', createdAt: 1, lastUsedAt: 2, active: true, current: false }])
  })

  it('listForUser(id) defaults to [] when values is missing', async () => {
    apiMock.mockResolvedValue({})
    expect(await useSessions().listForUser('u-1')).toEqual([])
  })

  it('revokeForUser(id, familyId) posts to /users/{id}/sessions/{familyId}/revoke', async () => {
    apiMock.mockResolvedValue({})
    await useSessions().revokeForUser('u-1', 'fam-456')
    expect(apiMock).toHaveBeenCalledWith('/users/u-1/sessions/fam-456/revoke', { method: 'POST' })
  })
})
