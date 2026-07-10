import type { components } from '#shared/types/api'

export interface DataTypeForm {
  code: string
  name: string
  note: string
}

export function toCreateDataTypeRequest(f: DataTypeForm): components['schemas']['CreateDataTypeRequest'] {
  return { code: f.code.trim(), name: f.name.trim(), note: f.note }
}

export function toUpdateDataTypeRequest(f: DataTypeForm): components['schemas']['UpdateDataTypeRequest'] {
  return { name: f.name.trim(), note: f.note }
}

// 소문자/숫자/언더스코어 — 백엔드 codeRe와 동일 규칙 (job_code 조립에 쓰임)
export function validateDataTypeForm(f: DataTypeForm): string | null {
  if (!/^[a-z0-9_]+$/.test(f.code.trim())) return '코드는 소문자/숫자/언더스코어만 가능합니다'
  if (!f.name.trim()) return '표시명을 입력하세요'
  return null
}
