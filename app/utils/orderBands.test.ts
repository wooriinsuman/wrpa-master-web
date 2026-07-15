import { describe, expect, it } from 'vitest'
import { bandAxisMax, bandIssues, bandSegments, DEFAULT_AXIS_MAX } from './orderBands'
import type { BandRow } from './orderBands'

describe('orderBands', () => {
  describe('bandAxisMax', () => {
    it('빈 rows → min(기본값)', () => {
      expect(bandAxisMax([])).toBe(DEFAULT_AXIS_MAX)
    })
    it('rows의 bizDayTo(없으면 bizDayFrom) 최댓값, min 미만이면 min', () => {
      const rows: BandRow[] = [
        { bizDayFrom: 1, bizDayTo: 5, order: [] },
        { bizDayFrom: 10, bizDayTo: null, order: [] },
      ]
      expect(bandAxisMax(rows)).toBe(DEFAULT_AXIS_MAX) // 10 < 23
      expect(bandAxisMax(rows, 5)).toBe(10)
    })
    it('rows 최댓값이 min을 초과하면 그 값', () => {
      const rows: BandRow[] = [{ bizDayFrom: 1, bizDayTo: 30, order: [] }]
      expect(bandAxisMax(rows)).toBe(30)
    })
  })

  describe('bandSegments', () => {
    it('closed row: left/width 계산 및 원본 인덱스/필드 보존', () => {
      const rows: BandRow[] = [{ bizDayFrom: 3, bizDayTo: 7, order: ['a', 'b'] }]
      const segs = bandSegments(rows, 23)
      expect(segs).toEqual([
        {
          index: 0,
          from: 3,
          to: 7,
          open: false,
          leftPct: ((3 - 1) / 23) * 100,
          widthPct: ((7 - 2) / 23) * 100,
          order: ['a', 'b'],
        },
      ])
    })
    it('open row(bizDayTo null): axisMax을 유효 끝으로 사용, open=true', () => {
      const rows: BandRow[] = [{ bizDayFrom: 10, bizDayTo: null, order: [] }]
      const segs = bandSegments(rows, 20)
      expect(segs[0]!.open).toBe(true)
      expect(segs[0]!.to).toBeNull()
      expect(segs[0]!.leftPct).toBeCloseTo(((10 - 1) / 20) * 100)
      expect(segs[0]!.widthPct).toBeCloseTo(((20 - 9) / 20) * 100)
    })
    it('원본 순서/인덱스 보존', () => {
      const rows: BandRow[] = [
        { bizDayFrom: 5, bizDayTo: 8, order: [] },
        { bizDayFrom: 1, bizDayTo: 4, order: [] },
      ]
      const segs = bandSegments(rows, 23)
      expect(segs.map(s => s.index)).toEqual([0, 1])
      expect(segs.map(s => s.from)).toEqual([5, 1])
    })
    it('leftPct/widthPct는 [0,100]으로 clamp', () => {
      const rows: BandRow[] = [{ bizDayFrom: 1, bizDayTo: 100, order: [] }]
      const segs = bandSegments(rows, 23)
      expect(segs[0]!.leftPct).toBeGreaterThanOrEqual(0)
      expect(segs[0]!.widthPct).toBeLessThanOrEqual(100)
    })
  })

  describe('bandIssues', () => {
    it('빈 rows → overlaps/gaps 모두 []', () => {
      expect(bandIssues([])).toEqual({ overlaps: [], gaps: [] })
    })
    it('인접(비겹침) rows → overlap/gap 없음', () => {
      const rows: BandRow[] = [
        { bizDayFrom: 1, bizDayTo: 2, order: [] },
        { bizDayFrom: 3, bizDayTo: 5, order: [] },
      ]
      expect(bandIssues(rows)).toEqual({ overlaps: [], gaps: [] })
    })
    it('두 row가 겹치면 overlap 1건, 정확한 range', () => {
      const rows: BandRow[] = [
        { bizDayFrom: 1, bizDayTo: 5, order: [] },
        { bizDayFrom: 3, bizDayTo: 8, order: [] },
      ]
      const { overlaps } = bandIssues(rows)
      expect(overlaps).toEqual([{ a: 0, b: 1, from: 3, to: 5 }])
    })
    it('row 사이 gap 감지', () => {
      const rows: BandRow[] = [
        { bizDayFrom: 1, bizDayTo: 2, order: [] },
        { bizDayFrom: 5, bizDayTo: 7, order: [] },
      ]
      const { gaps } = bandIssues(rows)
      expect(gaps).toEqual([{ from: 3, to: 4 }])
    })
    it('첫 row가 1보다 크면 leading gap', () => {
      const rows: BandRow[] = [{ bizDayFrom: 3, bizDayTo: 5, order: [] }]
      const { gaps } = bandIssues(rows)
      expect(gaps).toEqual([{ from: 1, to: 2 }])
    })
    it('open-ended row는 upper까지 커버 → trailing gap 없음', () => {
      const rows: BandRow[] = [
        { bizDayFrom: 1, bizDayTo: 3, order: [] },
        { bizDayFrom: 4, bizDayTo: null, order: [] },
      ]
      expect(bandIssues(rows).gaps).toEqual([])
    })
    it('open row가 뒤에 더 큰 bizDayTo를 가진 row와 겹치지 않으면, upper까지만 커버 확인', () => {
      const rows: BandRow[] = [
        { bizDayFrom: 1, bizDayTo: 2, order: [] },
        { bizDayFrom: 4, bizDayTo: null, order: [] },
        { bizDayFrom: 10, bizDayTo: 12, order: [] },
      ]
      // upper = max(2, 4, 12) = 12; open row(4,null)은 4..12 커버 → day3만 gap
      expect(bandIssues(rows).gaps).toEqual([{ from: 3, to: 3 }])
    })
    it('둘 다 open이면 overlap.to === null', () => {
      const rows: BandRow[] = [
        { bizDayFrom: 1, bizDayTo: null, order: [] },
        { bizDayFrom: 5, bizDayTo: null, order: [] },
      ]
      const { overlaps } = bandIssues(rows)
      expect(overlaps).toEqual([{ a: 0, b: 1, from: 5, to: null }])
    })
  })
})
