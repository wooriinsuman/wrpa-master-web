import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useToast } from './useToast'

describe('useToast', () => {
  beforeEach(() => { vi.useFakeTimers(); useToast().toasts.value.splice(0) })
  afterEach(() => vi.useRealTimers())
  it('pushes a toast then auto-removes after 2200ms', () => {
    const { toasts, push } = useToast()
    push('저장되었습니다')
    expect(toasts.value).toHaveLength(1)
    expect(toasts.value[0]!.msg).toBe('저장되었습니다')
    vi.advanceTimersByTime(2200)
    expect(toasts.value).toHaveLength(0)
  })
})
