import type { components } from '#shared/types/api'
import { buildCategoryKey, parseCategory } from './category'

// 한 구간(row)의 편집 모델: 카테고리 순서는 키 배열 (위=우선)
export interface PolicyRowForm {
  bizDayFrom: number
  bizDayTo: number | null // null = 이후 전체
  order: string[]         // 카테고리 키 "-1:new" 등
}

export interface OrderPolicyForm {
  companyId: string
  insuranceCompanyCode: string // '' = 회사 기본
  rows: PolicyRowForm[]
}

export function toOrderPolicyRequest(f: OrderPolicyForm): components['schemas']['CreateOrderPolicyRequest'] {
  return {
    companyId: f.companyId,
    insuranceCompanyCode: f.insuranceCompanyCode || undefined,
    rows: f.rows.map(r => ({ bizDayFrom: r.bizDayFrom, bizDayTo: r.bizDayTo, order: r.order })),
  }
}

export function validateOrderPolicyForm(f: OrderPolicyForm): string | null {
  if (!f.companyId) return '회사를 선택하세요'
  if (f.rows.length === 0) return '구간을 1개 이상 추가하세요'
  for (const r of f.rows) {
    if (r.bizDayFrom < 1) return '시작 영업일은 1 이상이어야 합니다'
    if (r.bizDayTo !== null && r.bizDayTo < r.bizDayFrom) return '끝 영업일은 시작 이상이어야 합니다'
    if (r.order.length === 0) return '각 구간에 카테고리 순서를 1개 이상 넣으세요'
    for (const key of r.order) if (!parseCategory(key)) return `잘못된 카테고리: ${key}`
  }
  return null
}

// 순서 배열 안에서 항목을 위/아래로 이동 (불변 반환)
export function moveOrder(order: string[], index: number, dir: -1 | 1): string[] {
  const j = index + dir
  if (j < 0 || j >= order.length) return order
  const next = [...order]
  ;[next[index], next[j]] = [next[j]!, next[index]!]
  return next
}

// 카테고리 후보: 오프셋(0,-1,-2) × 활성 dataType 중 아직 order에 없는 키
export function categoryCandidates(order: string[], dataTypeCodes: string[]): string[] {
  const used = new Set(order)
  const out: string[] = []
  for (const offset of [0, -1, -2]) {
    for (const code of dataTypeCodes) {
      const key = buildCategoryKey(offset, code)
      if (!used.has(key)) out.push(key)
    }
  }
  return out
}
