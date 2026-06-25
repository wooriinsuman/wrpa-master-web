import { describe, it, expect } from 'vitest'
import { blankWorkForm, splitTasks, toEnqueueWorkRequest } from './workForm'

describe('blankWorkForm', () => {
  it('returns all-empty strings', () => {
    expect(blankWorkForm()).toEqual({ company: '', tasksText: '', parametersText: '', lifetimeText: '' })
  })
})

describe('splitTasks', () => {
  it('splits, trims, and drops empties', () => {
    expect(splitTasks(' a , b ,, c ')).toEqual(['a', 'b', 'c'])
    expect(splitTasks('   ')).toEqual([])
  })
})

describe('toEnqueueWorkRequest', () => {
  it('requires company', () => {
    expect(() => toEnqueueWorkRequest(blankWorkForm())).toThrow('보험사 코드를 입력하세요.')
  })

  it('maps company only when the rest is blank', () => {
    expect(toEnqueueWorkRequest({ ...blankWorkForm(), company: ' samsung_property ' }))
      .toEqual({ company: 'samsung_property' })
  })

  it('includes tasks when present', () => {
    const r = toEnqueueWorkRequest({ ...blankWorkForm(), company: 'x', tasksText: 'a, b' })
    expect(r).toEqual({ company: 'x', tasks: ['a', 'b'] })
  })

  it('parses parameters JSON', () => {
    const r = toEnqueueWorkRequest({ ...blankWorkForm(), company: 'x', parametersText: '{"k":1}' })
    expect(r).toEqual({ company: 'x', parameters: { k: 1 } })
  })

  it('throws on invalid parameters JSON', () => {
    expect(() => toEnqueueWorkRequest({ ...blankWorkForm(), company: 'x', parametersText: '{bad' }))
      .toThrow('파라미터가 올바른 JSON이 아닙니다.')
  })

  it('parses a positive lifetime', () => {
    const r = toEnqueueWorkRequest({ ...blankWorkForm(), company: 'x', lifetimeText: '600000' })
    expect(r).toEqual({ company: 'x', lifetime: 600000 })
  })

  it('rejects a non-positive lifetime', () => {
    expect(() => toEnqueueWorkRequest({ ...blankWorkForm(), company: 'x', lifetimeText: '0' }))
      .toThrow('실행 시간(ms)은 양수여야 합니다.')
  })

  it('rejects non-object JSON parameters (scalar)', () => {
    expect(() => toEnqueueWorkRequest({ ...blankWorkForm(), company: 'x', parametersText: '5' }))
      .toThrow('파라미터는 JSON 객체여야 합니다.')
  })

  it('rejects array JSON parameters', () => {
    expect(() => toEnqueueWorkRequest({ ...blankWorkForm(), company: 'x', parametersText: '[1,2]' }))
      .toThrow('파라미터는 JSON 객체여야 합니다.')
  })

  it('rejects a negative lifetime', () => {
    expect(() => toEnqueueWorkRequest({ ...blankWorkForm(), company: 'x', lifetimeText: '-1' }))
      .toThrow('실행 시간(ms)은 양수여야 합니다.')
  })

  it('treats a whitespace-only lifetime as absent', () => {
    expect(toEnqueueWorkRequest({ ...blankWorkForm(), company: 'x', lifetimeText: '   ' }))
      .toEqual({ company: 'x' })
  })
})
