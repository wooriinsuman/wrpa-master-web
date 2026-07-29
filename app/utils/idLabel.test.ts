import { describe, it, expect } from 'vitest'
import { shortId } from './idLabel'

describe('shortId', () => {
  it('uuid는 앞 8자로 줄이고 생략 기호를 붙인다', () => {
    expect(shortId('2bbfe3d3-e637-4ae0-a352-e84baa681aee')).toBe('2bbfe3d3…')
  })
  it('짧은 값은 그대로 둔다', () => {
    expect(shortId('worker-1')).toBe('worker-1')
    expect(shortId('')).toBe('')
  })
})
