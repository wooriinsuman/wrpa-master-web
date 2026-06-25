// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import LoginPage from './login.vue'

describe('login page', () => {
  it('renders the wordmark, both credential inputs, and the submit button', async () => {
    const el = await mountSuspended(LoginPage)
    expect(el.text()).toContain('WRPA')
    expect(el.text()).toContain('관제 콘솔 입장')
    expect(el.findAll('input').length).toBe(2)
    expect(el.find('input[autocomplete="username"]').exists()).toBe(true)
    expect(el.find('input[type="password"]').exists()).toBe(true)
  })
})
