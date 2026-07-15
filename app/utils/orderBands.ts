// 영업일 타임라인 시각화(구간 밴드) 모델 계산 — 순수 함수.
// 백엔드 orderpolicy/resolver.go의 first-match 시맨틱을 그대로 반영:
// 행끼리 우선순위 경합이 아니라 "오늘이 어느 구간에 속하는가"로 선택되며,
// 겹치는 구간은 먼저 나온 행이 이긴다. 여기서는 그 겹침/공백을 시각화용으로 계산한다.

export interface BandRow {
  bizDayFrom: number
  bizDayTo?: number | null // null/undefined = 이후 전체 (API는 미지정 시 undefined 반환)
  order: string[]
}

// 행이 비어 있거나 값이 작을 때도 타임라인 눈금이 너무 좁아지지 않도록 하는 기본 축 최댓값.
export const DEFAULT_AXIS_MAX = 23

// rows가 실제로 필요로 하는 축 최댓값. bizDayTo(없으면 bizDayFrom) 중 최댓값이며 min 미만으로는 내려가지 않는다.
export function bandAxisMax(rows: BandRow[], min: number = DEFAULT_AXIS_MAX): number {
  let max = min
  for (const r of rows) {
    const end = r.bizDayTo ?? r.bizDayFrom
    if (end > max) max = end
  }
  return max
}

export interface BandSegment {
  index: number // 원본 행 인덱스
  from: number
  to: number | null // null = 이후 전체(open-ended)
  open: boolean // bizDayTo === null
  leftPct: number // 0..100
  widthPct: number // 0..100
  order: string[]
}

function clampPct(n: number): number {
  return Math.min(100, Math.max(0, n))
}

// rows를 축 길이 axisMax 기준 백분율 좌표(leftPct/widthPct)로 변환. 원본 순서/인덱스를 보존한다.
export function bandSegments(rows: BandRow[], axisMax: number): BandSegment[] {
  return rows.map((r, index) => {
    const to = r.bizDayTo ?? null // null/undefined 모두 이후 전체로 정규화
    const open = to === null
    const effectiveTo = open ? axisMax : to
    const leftPct = clampPct(((r.bizDayFrom - 1) / axisMax) * 100)
    const widthPct = clampPct(((effectiveTo - (r.bizDayFrom - 1)) / axisMax) * 100)
    return { index, from: r.bizDayFrom, to, open, leftPct, widthPct, order: r.order }
  })
}

// a<b 원본 인덱스 쌍. to는 겹친 구간의 끝(둘 다 open이면 null = 이후 전체까지 겹침).
export interface BandOverlap {
  a: number
  b: number
  from: number
  to: number | null
}

// 어느 행에도 커버되지 않는 영업일 구간(연속 구간 단위로 병합).
export interface BandGap {
  from: number
  to: number
}

// 행들 사이의 겹침(overlaps)과 커버되지 않는 공백(gaps)을 계산한다.
// overlaps: 모든 i<j 쌍에 대해 open bizDayTo를 +∞로 취급, 두 구간의 교집합이 비어있지 않으면 기록.
// gaps: upper = max(bizDayTo ?? bizDayFrom) (rows가 비면 0) 범위 [1, upper] 중
//       어느 행에도 속하지 않는 날짜들의 연속 구간. open 행은 upper까지 커버하므로 trailing gap은 생기지 않는다.
export function bandIssues(rows: BandRow[]): { overlaps: BandOverlap[]; gaps: BandGap[] } {
  const overlaps: BandOverlap[] = []
  for (let i = 0; i < rows.length; i++) {
    for (let j = i + 1; j < rows.length; j++) {
      const ri = rows[i]!
      const rj = rows[j]!
      const toI = ri.bizDayTo ?? Infinity // null/undefined = 이후 전체(+∞)
      const toJ = rj.bizDayTo ?? Infinity
      const overlapFrom = Math.max(ri.bizDayFrom, rj.bizDayFrom)
      const overlapTo = Math.min(toI, toJ)
      if (overlapFrom <= overlapTo) {
        const bothOpen = toI === Infinity && toJ === Infinity
        overlaps.push({ a: i, b: j, from: overlapFrom, to: bothOpen ? null : overlapTo })
      }
    }
  }

  const gaps: BandGap[] = []
  if (rows.length > 0) {
    const upper = Math.max(...rows.map(r => r.bizDayTo ?? r.bizDayFrom))
    let gapStart: number | null = null
    for (let d = 1; d <= upper; d++) {
      const covered = rows.some(r => r.bizDayFrom <= d && d <= (r.bizDayTo ?? upper))
      if (!covered) {
        if (gapStart === null) gapStart = d
      }
      else if (gapStart !== null) {
        gaps.push({ from: gapStart, to: d - 1 })
        gapStart = null
      }
    }
    if (gapStart !== null) gaps.push({ from: gapStart, to: upper })
  }

  return { overlaps, gaps }
}
