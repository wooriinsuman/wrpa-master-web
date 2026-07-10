// @vitest-environment nuxt
import { describe, it, expect, vi } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'
import OrderPoliciesPage from './index.vue'

const { listMock } = vi.hoisted(() => ({ listMock: vi.fn() }))
mockNuxtImport('useOrderPolicies', () => () => ({
  list: listMock,
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}))
mockNuxtImport('useClients', () => () => ({
  list: vi.fn().mockResolvedValue([{ id: 'c1', name: '테스트회사', code: 'test', active: true }]),
  create: vi.fn(),
  remove: vi.fn(),
}))
mockNuxtImport('useInsurers', () => () => ({
  list: vi.fn().mockResolvedValue([{ id: 'i1', code: 'samsung_property', name: '삼성화재', type: 'PROPERTY', url: '', active: true }]),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}))
mockNuxtImport('useDataTypes', () => () => ({
  list: vi.fn().mockResolvedValue([
    { code: 'new', name: '신계약', note: '' },
    { code: 'renewal', name: '계속분', note: '' },
  ]),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}))
mockNuxtImport('useToast', () => () => ({ toasts: ref([]), push: vi.fn() }))

describe('order-policies page', () => {
  it('renders policy rows with company name, "회사 기본" label and category summary', async () => {
    listMock.mockResolvedValue([
      {
        id: 'p1',
        companyId: 'c1',
        insuranceCompanyCode: null,
        rows: [{ bizDayFrom: 1, bizDayTo: 2, order: ['-1:new', '0:new'] }],
        createdAt: 0,
        updatedAt: 0,
      },
    ])
    const el = await mountSuspended(OrderPoliciesPage)
    expect(el.text()).toContain('테스트회사')
    expect(el.text()).toContain('회사 기본')
    expect(el.text()).toContain('전월 신계약')
    expect(listMock).toHaveBeenCalledWith('c1')
  })
})
