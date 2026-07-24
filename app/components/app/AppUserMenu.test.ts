// @vitest-environment nuxt
import { describe, it, expect, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import AppUserMenu from './AppUserMenu.vue'
import { useAuthStore } from '~/stores/auth'

describe('AppUserMenu', () => {
  it('renders the logged-in user name/role when authenticated', async () => {
    const auth = useAuthStore()
    auth.user = { userId: '1', username: 'kim.hj', roles: ['ROLE_ADMIN'] }
    const el = await mountSuspended(AppUserMenu)
    expect(el.text()).toContain('kim.hj')
    expect(el.text()).toContain('ROLE_ADMIN')
  })

  it('renders nothing when there is no logged-in user', async () => {
    const auth = useAuthStore()
    auth.user = null
    const el = await mountSuspended(AppUserMenu)
    expect(el.html()).toBe('<!--v-if-->')
  })

  it('shows an always-visible logout button that calls auth.logout() directly', async () => {
    const auth = useAuthStore()
    auth.user = { userId: '1', username: 'kim.hj', roles: ['ROLE_ADMIN'] }
    auth.logout = vi.fn().mockResolvedValue(undefined)
    const el = await mountSuspended(AppUserMenu)

    const logoutButton = el.find('button.um-logout')
    expect(logoutButton.exists()).toBe(true)
    expect(logoutButton.text()).toContain('로그아웃')

    await logoutButton.trigger('click')
    expect(auth.logout).toHaveBeenCalledTimes(1)
  })
})
