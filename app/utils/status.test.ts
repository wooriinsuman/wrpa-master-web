import { describe, it, expect } from 'vitest'
import { labelToKind } from './status'

describe('labelToKind', () => {
  it('maps domain labels to kinds', () => {
    expect(labelToKind('활성')).toBe('done')
    expect(labelToKind('정지')).toBe('idle')
    expect(labelToKind('실패')).toBe('fail')
    expect(labelToKind('실행중')).toBe('run')
  })
  it('falls back to idle for unknown labels', () => {
    expect(labelToKind('머시기')).toBe('idle')
  })
})
