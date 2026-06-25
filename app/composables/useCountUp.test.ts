import { describe, it, expect } from 'vitest'
import { useCountUp } from './useCountUp'

describe('useCountUp', () => {
  it('sets the value instantly to target when rAF is unavailable', () => {
    const orig = globalThis.requestAnimationFrame
    // @ts-expect-error force the no-rAF branch
    globalThis.requestAnimationFrame = undefined
    try {
      const v = useCountUp(42)
      expect(v.value).toBe(42)
    } finally {
      globalThis.requestAnimationFrame = orig
    }
  })
})
