import { defineStore } from 'pinia'
import type { components } from '#shared/types/api'
import { RANK_SYSTEM, RANK_ADMIN, rankOf } from '~/utils/roles'
type Me = components['schemas']['MeResponse']

export const useAuthStore = defineStore('auth', {
  state: () => ({ user: null as Me | null }),
  getters: {
    isAuthed: (s) => s.user !== null,
    // Prefer the server-sent level (source of truth); fall back to deriving
    // it from role names for tokens/responses issued before `level` existed.
    level: (s): number => s.user?.level ?? rankOf(s.user?.roles ?? []),
    isSystem(): boolean { return this.level >= RANK_SYSTEM },
    isAdmin(): boolean { return this.level >= RANK_ADMIN },
    companyId: (s): string => s.user?.companyId ?? '',
  },
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
