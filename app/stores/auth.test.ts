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
    s.user = { id: '1', username: 'admin', name: '관리자', roles: ['admin'] } as any
    expect(s.isAuthed).toBe(true)
  })
})
