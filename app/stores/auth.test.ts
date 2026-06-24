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
})
