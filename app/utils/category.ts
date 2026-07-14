// 우선순위 카테고리 키 "{업적월오프셋}:{dataType코드}" (예 "-1:new") 표시/파싱 유틸.
// 백엔드 orderpolicy.CategoryKey와 동일 형식.
export interface Category {
  offset: number
  dataType: string
}

export function parseCategory(key: string): Category | null {
  const idx = key.indexOf(':')
  if (idx <= 0) return null
  const offset = Number(key.slice(0, idx))
  const dataType = key.slice(idx + 1)
  if (!Number.isInteger(offset) || !dataType) return null
  return { offset, dataType }
}

export function offsetLabel(offset: number): string {
  if (offset === 0) return '당월'
  if (offset === -1) return '전월'
  if (offset === -2) return '전전월'
  return `${-offset}개월 전`
}

export function categoryLabel(key: string, dataTypeNames: Record<string, string>): string {
  const c = parseCategory(key)
  if (!c) return key
  return `${offsetLabel(c.offset)} ${dataTypeNames[c.dataType] ?? c.dataType}`
}

export function buildCategoryKey(offset: number, dataType: string): string {
  return `${offset}:${dataType}`
}

// 데이터 타입 표시 순서(레거시 대시보드 기준): 신계약 → 수금 → 수수료 → 모니터링 → 계약상세.
// 관리자가 추가한 미등록 코드는 뒤로, 이름 가나다순.
export const DATA_TYPE_ORDER = ['new', 'contract', 'commission', 'monitoring', 'contract_detail']

export function dataTypeRank(code: string): number {
  const i = DATA_TYPE_ORDER.indexOf(code)
  return i === -1 ? DATA_TYPE_ORDER.length : i
}

export function sortByDataTypeOrder<T extends { code: string; name: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const d = dataTypeRank(a.code) - dataTypeRank(b.code)
    return d !== 0 ? d : a.name.localeCompare(b.name, 'ko')
  })
}
