import { describe, it, expect } from 'vitest'
import { extractApiError } from './apiError'

describe('extractApiError', () => {
  it('prefers the nested backend envelope message (data.error.message)', () => {
    const e = { data: { error: { code: 'conflict', message: '작업파일이 참조 중이라 삭제할 수 없습니다' } }, message: 'Conflict' }
    expect(extractApiError(e, 'fallback')).toBe('작업파일이 참조 중이라 삭제할 수 없습니다')
  })

  it('falls back to data.message when data.error is absent', () => {
    const e = { data: { message: '플랫 형태 메시지' }, message: 'Bad Request' }
    expect(extractApiError(e, 'fallback')).toBe('플랫 형태 메시지')
  })

  it('falls back to e.message when .data is absent entirely', () => {
    const e = new Error('네트워크 오류')
    expect(extractApiError(e, 'fallback')).toBe('네트워크 오류')
  })

  it('falls back to the caller-supplied fallback when nothing else is present', () => {
    expect(extractApiError({}, 'fallback 메시지')).toBe('fallback 메시지')
    expect(extractApiError(null, 'fallback 메시지')).toBe('fallback 메시지')
    expect(extractApiError(undefined, 'fallback 메시지')).toBe('fallback 메시지')
  })
})
