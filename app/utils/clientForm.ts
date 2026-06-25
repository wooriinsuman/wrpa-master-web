import type { components } from '#shared/types/api'
type CreateReq = components['schemas']['CreateCompanyRequest']
export interface ClientForm { name: string; code: string; phone: string; leaderName: string; businessRegistrationNumber: string }
export function toCreateClientRequest(f: ClientForm): CreateReq {
  if (!f.name.trim()) throw new Error('거래처명을 입력하세요.')
  if (!f.code.trim()) throw new Error('코드를 입력하세요.')
  return { name: f.name.trim(), code: f.code.trim(), phone: f.phone, leaderName: f.leaderName, businessRegistrationNumber: f.businessRegistrationNumber }
}
