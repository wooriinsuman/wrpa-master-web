import { defineStore } from 'pinia'
import type { components } from '#shared/types/api'
type Me = components['schemas']['MeResponse']

export const useAuthStore = defineStore('auth', {
  state: () => ({ user: null as Me | null }),
  getters: { isAuthed: (s) => s.user !== null },
  actions: {
    async fetchMe() {
      try { this.user = await useApi()('/auth/me') } catch { this.user = null }
    },
    async logout() {
      await $fetch('/api/auth/logout', { method: 'POST' })
      this.user = null
      await navigateTo('/login')
    },
  },
})
