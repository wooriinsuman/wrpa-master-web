import { describe, it, expect } from 'vitest'
import { blankWorkerForm, splitTags, toWorkerRequest } from './workerForm'

describe('blankWorkerForm', () => {
  it('is empty name/type/tags and shared false', () => {
    expect(blankWorkerForm()).toEqual({ name: '', type: '', tagsText: '', shared: false })
  })
})

describe('splitTags', () => {
  it('splits, trims, drops empties', () => {
    expect(splitTags(' a , b ,, c ')).toEqual(['a', 'b', 'c'])
    expect(splitTags('   ')).toEqual([])
  })
})

describe('toWorkerRequest', () => {
  it('requires name then type', () => {
    expect(() => toWorkerRequest(blankWorkerForm())).toThrow('이름을 입력하세요.')
    expect(() => toWorkerRequest({ ...blankWorkerForm(), name: 'w1' })).toThrow('유형을 입력하세요.')
  })
  it('maps name/type trimmed with shared, no tags when empty', () => {
    expect(toWorkerRequest({ name: ' w1 ', type: ' crawler ', tagsText: '', shared: true }))
      .toEqual({ name: 'w1', type: 'crawler', shared: true })
  })
  it('includes tags when present', () => {
    expect(toWorkerRequest({ name: 'w1', type: 'crawler', tagsText: 'a, b', shared: false }))
      .toEqual({ name: 'w1', type: 'crawler', shared: false, tags: ['a', 'b'] })
  })
})
