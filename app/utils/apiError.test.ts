import { describe, it, expect } from 'vitest'
import { extractApiError, apiErrorCode } from './apiError'

const envelope = (code: string, message = 'dev-facing english') => ({ data: { error: { code, message } } })

describe('apiErrorCode', () => {
  it('reads the code out of the backend envelope', () => {
    expect(apiErrorCode(envelope('not_found'))).toBe('not_found')
  })
  it('returns undefined when there is no envelope', () => {
    expect(apiErrorCode(new Error('boom'))).toBeUndefined()
    expect(apiErrorCode(null)).toBeUndefined()
  })
})

describe('extractApiError', () => {
  it('maps a known code to Korean copy', () => {
    expect(extractApiError(envelope('invalid_credentials'), 'fallback'))
      .toBe('아이디 또는 비밀번호가 올바르지 않습니다.')
  })

  it('distinguishes an inactive account from a wrong password', () => {
    expect(extractApiError(envelope('account_inactive'), 'fallback'))
      .toBe('비활성화된 계정입니다. 관리자에게 문의하세요.')
  })

  it('reports a dead backend as a server problem, not a credentials problem', () => {
    expect(extractApiError(envelope('upstream_unavailable'), 'fallback'))
      .toBe('RPA API를 사용할 수 없습니다. 잠시 후 다시 시도해 주세요.')
  })

  it('never surfaces the backend english message', () => {
    const e = envelope('forbidden', 'workerId does not match authenticated worker')
    expect(extractApiError(e, 'fallback')).toBe('권한이 없습니다.')
  })

  it('leaves generic codes to the caller fallback, which knows the entity', () => {
    expect(extractApiError(envelope('not_found'), '휴일을 찾을 수 없습니다.'))
      .toBe('휴일을 찾을 수 없습니다.')
    expect(extractApiError(envelope('bad_request'), '입력값을 확인하세요.'))
      .toBe('입력값을 확인하세요.')
    expect(extractApiError(envelope('conflict'), '이미 존재하는 코드입니다.'))
      .toBe('이미 존재하는 코드입니다.')
  })

  it('lets an override win over the shared map so the page can interpolate', () => {
    expect(extractApiError(envelope('workfile_in_use'), 'fallback', {
      workfile_in_use: '작업파일이 참조 중이라 삭제할 수 없습니다: DT-1',
    })).toBe('작업파일이 참조 중이라 삭제할 수 없습니다: DT-1')
  })

  it('gives workfile_in_use a base sentence when the page does not override', () => {
    expect(extractApiError(envelope('workfile_in_use'), 'fallback'))
      .toBe('작업파일이 참조 중이라 삭제할 수 없습니다.')
  })

  it('falls back for an unknown code so a new backend code never renders blank', () => {
    expect(extractApiError(envelope('some_future_code'), '저장에 실패했습니다.'))
      .toBe('저장에 실패했습니다.')
  })

  it('falls back when there is no envelope at all', () => {
    expect(extractApiError(new Error('boom'), '저장에 실패했습니다.')).toBe('저장에 실패했습니다.')
    expect(extractApiError({}, 'f')).toBe('f')
    expect(extractApiError(null, 'f')).toBe('f')
    expect(extractApiError(undefined, 'f')).toBe('f')
  })
})
