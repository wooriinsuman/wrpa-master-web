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

  // 기본 필터가 '전체'가 되면서 "'정지'로 바꿔 확인" 안내는 더 이상 맞지 않는다.
  // 대신 완전 삭제라는 조치를 알려 준다.
  it('아이디 중복은 재활성화/완전 삭제라는 조치를 안내한다', () => {
    const msg = extractApiError({ data: { error: { code: 'username_taken' } } }, 'fallback')
    expect(msg).toContain('정지된 계정')
    expect(msg).toContain('완전 삭제')
  })

  // 사용자 생애주기 409는 각각 조치가 다르다 — 공용 'conflict' 문구로는 다음에
  // 무엇을 해야 하는지 알 수 없다. 각 코드의 부분 문자열은 다른 메시지들과
  // 구별되어야 코드 전치(self_delete ↔ self_deactivate)를 감지할 수 있다.
  it('사용자 생애주기 409는 조치까지 안내한다', () => {
    const msg = (code: string) => extractApiError({ data: { error: { code } } }, 'fallback')
    expect(msg('user_active')).toContain('정지된 계정만')
    expect(msg('self_delete')).toContain('자기 계정은 삭제할 수 없습니다')
    expect(msg('self_deactivate')).toContain('자기 계정은 정지할 수 없습니다')
    expect(msg('last_system_user')).toContain('마지막 시스템 관리자')
  })

  // company_required는 400이지만 등재한다 — 역할을 관리자/사용자로 낮추는 순간 회사가
  // 필수가 되는 게 원인이고, 화면은 어느 필드가 문제인지 알 수 없다.
  it('회사 누락은 어느 필드를 채워야 하는지 알려준다', () => {
    const msg = extractApiError({ data: { error: { code: 'company_required' } } }, 'fallback')
    expect(msg).toContain('회사')
    expect(msg).not.toBe('fallback')
  })

  it('존재하지 않는 회사/역할 참조는 입력 오류로 안내한다', () => {
    expect(extractApiError(envelope('invalid_reference'), 'fallback'))
      .toBe('선택한 회사 또는 역할이 존재하지 않습니다. 목록을 다시 불러온 뒤 시도해 주세요.')
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
