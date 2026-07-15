import type { components } from '#shared/types/api'
import { parseCategory } from './category'

// 한 구간(row)의 편집 모델: 카테고리 순서는 키 배열 (위=우선).
// draft* 는 "업적월+데이터타입 조합 추가" 입력용 임시값 — 저장/검증에는 쓰이지 않음.
export interface PolicyRowForm {
  bizDayFrom: number
  bizDayTo: number | null // null = 이후 전체
  order: string[]         // 카테고리 키 "-1:new" 등
  draftOffset?: number    // 업적월 오프셋 입력(임시)
  draftDataType?: string  // 데이터 타입 입력(임시)
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

export interface CopyTargetSource { companyId: string; insuranceCompanyCode?: string | null }

// 복사 대상 유효성. targetInsurer '' = 회사 기본. targetCompanyPolicies = 대상 회사의 기존 정책 목록.
// 반환: 에러 메시지(한국어) 또는 null(정상).
export function validateCopyTarget(
  source: CopyTargetSource,
  targetCompanyId: string,
  targetInsurer: string,
  targetCompanyPolicies: { insuranceCompanyCode?: string | null }[],
): string | null {
  if (!targetCompanyId) return '대상 회사를 선택하세요'
  const srcInsurer = source.insuranceCompanyCode ?? ''
  if (targetCompanyId === source.companyId && targetInsurer === srcInsurer) return '원본과 같은 대상입니다'
  if (targetCompanyPolicies.some(p => (p.insuranceCompanyCode ?? '') === targetInsurer)) {
    return '이미 해당 회사·보험사 정책이 있습니다. 수정에서 변경하세요.'
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

// 순서 배열에서 from 위치 항목을 to 위치로 이동 (불변 반환). moveOrder와 병존.
// 네이티브 드래그앤드롭(항목 i를 드래그해 위치 j에 드롭) 백엔드로 사용.
export function reorder(order: string[], from: number, to: number): string[] {
  if (from === to || from < 0 || from >= order.length || to < 0 || to >= order.length) return order
  const next = [...order]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item!)
  return next
}
