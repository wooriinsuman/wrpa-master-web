import { describe, expect, it } from 'vitest'
import { buildCategoryKey, categoryLabel, offsetLabel, parseCategory } from './category'

describe('category utils', () => {
  it('parseCategory: 정상/비정상', () => {
    expect(parseCategory('0:new')).toEqual({ offset: 0, dataType: 'new' })
    expect(parseCategory('-1:contract')).toEqual({ offset: -1, dataType: 'contract' })
    expect(parseCategory('bad')).toBeNull()
    expect(parseCategory('x:new')).toBeNull()
    expect(parseCategory('1:')).toBeNull()
  })
  it('offsetLabel', () => {
    expect(offsetLabel(0)).toBe('당월')
    expect(offsetLabel(-1)).toBe('전월')
    expect(offsetLabel(-2)).toBe('전전월')
    expect(offsetLabel(-3)).toBe('3개월 전')
  })
  it('categoryLabel: dataType 표시명 결합, 미등록 코드는 코드 그대로', () => {
    const names = { new: '신계약', contract: '계속분' }
    expect(categoryLabel('-1:new', names)).toBe('전월 신계약')
    expect(categoryLabel('0:ghost', names)).toBe('당월 ghost')
    expect(categoryLabel('broken', names)).toBe('broken')
  })
  it('buildCategoryKey', () => {
    expect(buildCategoryKey(-1, 'new')).toBe('-1:new')
  })
})
