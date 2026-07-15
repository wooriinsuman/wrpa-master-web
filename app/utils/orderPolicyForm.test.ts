import { describe, expect, it } from 'vitest'
import { moveOrder, reorder, toOrderPolicyRequest, validateCopyTarget, validateOrderPolicyForm } from './orderPolicyForm'

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
  it('reorder: no-op(from===to, out-of-range)은 동일 참조 반환', () => {
    const o = ['a', 'b', 'c']
    expect(reorder(o, 1, 1)).toBe(o)
    expect(reorder(o, -1, 1)).toBe(o)
    expect(reorder(o, 1, 3)).toBe(o)
    expect(reorder(o, 3, 1)).toBe(o)
  })
  it('reorder: forward/backward 이동, 입력 불변', () => {
    const o = ['a', 'b', 'c', 'd']
    expect(reorder(o, 0, 2)).toEqual(['b', 'c', 'a', 'd'])
    expect(reorder(o, 3, 0)).toEqual(['d', 'a', 'b', 'c'])
    expect(o).toEqual(['a', 'b', 'c', 'd'])
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

  describe('validateCopyTarget', () => {
    const src = { companyId: 'c1', insuranceCompanyCode: 'samsung_property' }

    it('대상 회사 미선택 시 에러', () => {
      expect(validateCopyTarget(src, '', 'samsung_property', [])).toBe('대상 회사를 선택하세요')
    })

    it('원본과 동일한 회사+보험사면 에러', () => {
      expect(validateCopyTarget(src, 'c1', 'samsung_property', [])).toBe('원본과 같은 대상입니다')
    })

    it('원본과 동일한 회사+회사 기본(null vs "")도 동일 대상으로 취급', () => {
      const srcDefault = { companyId: 'c1', insuranceCompanyCode: null }
      expect(validateCopyTarget(srcDefault, 'c1', '', [])).toBe('원본과 같은 대상입니다')
      const srcUndefined = { companyId: 'c1', insuranceCompanyCode: undefined }
      expect(validateCopyTarget(srcUndefined, 'c1', '', [])).toBe('원본과 같은 대상입니다')
    })

    it('대상 회사·보험사 슬롯에 이미 정책이 있으면 에러 (회사 기본 포함)', () => {
      expect(validateCopyTarget(src, 'c2', 'samsung_property', [{ insuranceCompanyCode: 'samsung_property' }])).toBe(
        '이미 해당 회사·보험사 정책이 있습니다. 수정에서 변경하세요.',
      )
      // 회사 기본 슬롯: null과 '' 동등
      expect(validateCopyTarget(src, 'c2', '', [{ insuranceCompanyCode: null }])).toBe(
        '이미 해당 회사·보험사 정책이 있습니다. 수정에서 변경하세요.',
      )
    })

    it('다른 회사의 비어있는 슬롯으로 복사하면 정상(null)', () => {
      expect(validateCopyTarget(src, 'c2', 'samsung_property', [{ insuranceCompanyCode: 'db_life' }])).toBeNull()
      expect(validateCopyTarget(src, 'c2', '', [{ insuranceCompanyCode: 'samsung_property' }])).toBeNull()
    })

    it('같은 회사의 다른 보험사 슬롯으로 복사하면 정상(null)', () => {
      expect(validateCopyTarget(src, 'c1', 'db_life', [{ insuranceCompanyCode: 'samsung_property' }])).toBeNull()
    })
  })
})
