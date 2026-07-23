import { defineStore } from 'pinia'
import type { components } from '#shared/types/api'
type Me = components['schemas']['MeResponse']

export const useAuthStore = defineStore('auth', {
  state: () => ({ user: null as Me | null }),
  getters: { isAuthed: (s) => s.user !== null },
  actions: {
    async fetchMe() {
      try { this.user = await $fetch('/api/auth/me') } catch { this.user = null }
    },
    async logout() {
      try {
        await $fetch('/api/auth/logout', { method: 'POST' })
      } catch {
        // best-effort: the server-side proxy clears cookies on logout; even if this
        // request fails, clear local state and redirect so the user isn't stuck.
      } finally {
        this.user = null
        await navigateTo('/login')
      }
    },
  },
})
