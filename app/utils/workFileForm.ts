import type { components } from '#shared/types/api'
type CreateReq = components['schemas']['CreateWorkFileRequest']
type UpdateReq = components['schemas']['UpdateWorkFileRequest']
export interface WorkFileForm { insuranceCompanyCode: string; dataType: string; fileType: string; insureType: string; contentType: string; name: string; note: string; originPath: string }

function req(v: string, label: string) { if (!v.trim()) throw new Error(`${label}을(를) 입력하세요.`) }
function assertCommon(f: WorkFileForm) {
  req(f.dataType, 'dataType'); req(f.fileType, 'fileType'); req(f.insureType, 'insureType'); req(f.contentType, 'contentType'); req(f.name, '이름')
}
export function toCreateWorkFileRequest(f: WorkFileForm): CreateReq {
  req(f.insuranceCompanyCode, '보험사 코드'); assertCommon(f)
  return { insuranceCompanyCode: f.insuranceCompanyCode.trim(), dataType: f.dataType, fileType: f.fileType, insureType: f.insureType, contentType: f.contentType, name: f.name.trim(), note: f.note, originPath: f.originPath }
}
export function toUpdateWorkFileRequest(f: WorkFileForm): UpdateReq {
  assertCommon(f)
  return { dataType: f.dataType, fileType: f.fileType, insureType: f.insureType, contentType: f.contentType, name: f.name.trim(), note: f.note, originPath: f.originPath }
}
