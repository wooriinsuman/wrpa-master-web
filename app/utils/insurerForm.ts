import type { components } from '#shared/types/api'

type CreateReq = components['schemas']['CreateInsuranceCompanyRequest']
type UpdateReq = components['schemas']['UpdateInsuranceCompanyRequest']

export interface InsurerForm {
  code: string
  name: string
  type: string
  url: string
  active: boolean
}

function assertRequired(f: InsurerForm) {
  if (!f.code.trim()) throw new Error('코드를 입력하세요.')
  if (!f.name.trim()) throw new Error('보험사명을 입력하세요.')
}

export function toCreateRequest(f: InsurerForm): CreateReq {
  assertRequired(f)
  return { code: f.code.trim(), name: f.name.trim(), type: f.type, url: f.url, active: f.active }
}

export function toUpdateRequest(f: InsurerForm): UpdateReq {
  assertRequired(f)
  return { code: f.code.trim(), name: f.name.trim(), type: f.type, url: f.url, active: f.active }
}
