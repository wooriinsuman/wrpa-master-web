import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from './auth'

describe('auth store', () => {
  beforeEach(() => setActivePinia(createPinia()))
  it('isAuthed is false without user', () => {
    expect(useAuthStore().isAuthed).toBe(false)
  })
  it('isAuthed is true once user set', () => {
    const s = useAuthStore()
    s.user = { userId: '1', username: 'admin', roles: ['admin'] }
    expect(s.isAuthed).toBe(true)
  })

  it('level prefers the server-sent level over role-derived rank', () => {
    const s = useAuthStore()
    s.user = { userId: '1', username: 'u', roles: ['ROLE_USER'], level: 30 }
    expect(s.level).toBe(30)
  })

  it('level falls back to rankOf(roles) when level is absent', () => {
    const s = useAuthStore()
    s.user = { userId: '1', username: 'u', roles: ['ROLE_ADMIN'] }
    expect(s.level).toBe(20)
  })

  it('level is 0 with no user', () => {
    expect(useAuthStore().level).toBe(0)
  })

  it('isSystem/isAdmin reflect the rank thresholds', () => {
    const s = useAuthStore()
    s.user = { userId: '1', username: 'u', roles: [], level: 10 }
    expect(s.isAdmin).toBe(false)
    expect(s.isSystem).toBe(false)

    s.user = { userId: '1', username: 'u', roles: [], level: 20 }
    expect(s.isAdmin).toBe(true)
    expect(s.isSystem).toBe(false)

    s.user = { userId: '1', username: 'u', roles: [], level: 30 }
    expect(s.isAdmin).toBe(true)
    expect(s.isSystem).toBe(true)
  })

  it('companyId defaults to an empty string', () => {
    const s = useAuthStore()
    expect(s.companyId).toBe('')
    s.user = { userId: '1', username: 'u', roles: [], companyId: 'c1' }
    expect(s.companyId).toBe('c1')
  })
})
