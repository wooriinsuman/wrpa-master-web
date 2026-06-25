import { describe, it, expect } from 'vitest'
import { filterRows } from './crud'

interface R { id: string; name: string; code: string; n: number }
const rows: R[] = [
  { id: '1', name: '삼성화재', code: 'SS', n: 10 },
  { id: '2', name: 'DB손보', code: 'DB', n: 20 },
]

describe('filterRows', () => {
  it('returns all rows for a blank query', () => {
    expect(filterRows(rows, '   ', ['name', 'code'])).toHaveLength(2)
  })
  it('matches case-insensitively on the listed keys', () => {
    expect(filterRows(rows, 'db', ['name', 'code']).map(r => r.id)).toEqual(['2'])
  })
  it('only searches the keys provided', () => {
    expect(filterRows(rows, '삼성', ['code'])).toHaveLength(0)
  })
  it('stringifies non-string values', () => {
    expect(filterRows(rows, '20', ['n']).map(r => r.id)).toEqual(['2'])
  })
})
