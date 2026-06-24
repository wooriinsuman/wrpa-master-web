// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest'
import { useTheme } from './useTheme'

describe('useTheme', () => {
  beforeEach(() => { localStorage.clear(); document.documentElement.removeAttribute('data-theme') })
  it('toggle flips and persists', () => {
    const t = useTheme()
    expect(t.dark.value).toBe(false)
    t.toggle()
    expect(t.dark.value).toBe(true)
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(localStorage.getItem('wrpa-theme')).toBe('dark')
  })
})
