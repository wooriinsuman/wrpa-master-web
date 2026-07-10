import type { components } from '#shared/types/api'
import { toOrderPolicyRequest, type OrderPolicyForm } from '~/utils/orderPolicyForm'

type View = components['schemas']['OrderPolicyView']

// GET /order-policies는 companyId가 필수 쿼리 파라미터다 (회사 스코프) —
// 목록은 항상 특정 회사 기준으로 조회한다.
export function useOrderPolicies() {
  const api = useApi()
  return {
    list: (companyId: string) => api<View[]>('/order-policies', { query: { companyId } }),
    create: (f: OrderPolicyForm) => api('/order-policies', { method: 'POST', body: toOrderPolicyRequest(f) }),
    update: (id: string, f: OrderPolicyForm) => api(`/order-policies/${id}`, { method: 'PUT', body: toOrderPolicyRequest(f) }),
    remove: (id: string) => api(`/order-policies/${id}`, { method: 'DELETE' }),
  }
}
