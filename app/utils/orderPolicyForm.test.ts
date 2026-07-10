import { describe, expect, it } from 'vitest'
import { categoryCandidates, moveOrder, toOrderPolicyRequest, validateOrderPolicyForm } from './orderPolicyForm'

const base = { companyId: 'c1', insuranceCompanyCode: '', rows: [{ bizDayFrom: 1, bizDayTo: 2, order: ['-1:new', '0:new'] }] }

describe('orderPolicyForm', () => {
  it('validate: 정상/구간/키 오류', () => {
    expect(validateOrderPolicyForm(base)).toBeNull()
    expect(validateOrderPolicyForm({ ...base, companyId: '' })).toBeTruthy()
    expect(validateOrderPolicyForm({ ...base, rows: [] })).toBeTruthy()
    expect(validateOrderPolicyForm({ ...base, rows: [{ bizDayFrom: 0, bizDayTo: null, order: ['0:new'] }] })).toBeTruthy()
    expect(validateOrderPolicyForm({ ...base, rows: [{ bizDayFrom: 3, bizDayTo: 2, order: ['0:new'] }] })).toBeTruthy()
    expect(validateOrderPolicyForm({ ...base, rows: [{ bizDayFrom: 1, bizDayTo: null, order: [] }] })).toBeTruthy()
    expect(validateOrderPolicyForm({ ...base, rows: [{ bizDayFrom: 1, bizDayTo: null, order: ['bad'] }] })).toBeTruthy()
  })
  it('moveOrder: 경계/스왑, 불변', () => {
    const o = ['a', 'b', 'c']
    expect(moveOrder(o, 0, -1)).toBe(o)
    expect(moveOrder(o, 2, 1)).toBe(o)
    expect(moveOrder(o, 0, 1)).toEqual(['b', 'a', 'c'])
    expect(o).toEqual(['a', 'b', 'c'])
  })
  it('categoryCandidates: 사용 중 키 제외, 오프셋×코드 조합', () => {
    const c = categoryCandidates(['0:new'], ['new', 'contract'])
    expect(c).toContain('-1:new')
    expect(c).toContain('0:contract')
    expect(c).not.toContain('0:new')
    expect(c.length).toBe(5)
  })
  it('toOrderPolicyRequest: 빈 insuranceCompanyCode는 undefined로 변환', () => {
    expect(toOrderPolicyRequest(base)).toEqual({
      companyId: 'c1',
      insuranceCompanyCode: undefined,
      rows: [{ bizDayFrom: 1, bizDayTo: 2, order: ['-1:new', '0:new'] }],
    })
    expect(toOrderPolicyRequest({ ...base, insuranceCompanyCode: 'samsung_property' }).insuranceCompanyCode)
      .toBe('samsung_property')
  })
})
