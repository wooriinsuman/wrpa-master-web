import { describe, it, expect, vi } from 'vitest'
import { toApiErrorResponse } from './proxy-error'

describe('toApiErrorResponse', () => {
  it('relays the backend envelope and status verbatim', () => {
    const err = {
      response: { status: 403 },
      data: { error: { code: 'account_inactive', message: 'account inactive' } },
    }
    expect(toApiErrorResponse(err)).toEqual({
      status: 403,
      body: { error: { code: 'account_inactive', message: 'account inactive' } },
    })
  })

  it('synthesises upstream_unavailable when the backend never answered', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const r = toApiErrorResponse({ cause: { code: 'ECONNREFUSED' }, message: 'fetch failed' })
    expect(r.status).toBe(502)
    expect(r.body.error.code).toBe('upstream_unavailable')
    spy.mockRestore()
  })

  it('reads the network code from err.code as well as err.cause.code', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(toApiErrorResponse({ code: 'ETIMEDOUT' }).body.error.code).toBe('upstream_unavailable')
    spy.mockRestore()
  })

  it('detects a network failure buried deep in the cause chain (real ofetch shape)', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    // localhost 연결 거부의 실제 형태: FetchError → TypeError "fetch failed"
    //  → AggregateError(code=ECONNREFUSED) → errors[]. err.cause.code는 undefined다.
    const agg: any = new Error('')
    agg.name = 'AggregateError'
    agg.code = 'ECONNREFUSED'
    agg.errors = [Object.assign(new Error('connect ECONNREFUSED ::1:9998'), { code: 'ECONNREFUSED' })]
    const mid: any = new TypeError('fetch failed')
    mid.cause = agg
    const err: any = new Error('[POST] "http://localhost:9998/api/auth/login": <no response> fetch failed')
    err.name = 'FetchError'
    err.cause = mid

    const r = toApiErrorResponse(err)
    expect(r.status).toBe(502)
    expect(r.body.error.code).toBe('upstream_unavailable')
    expect(JSON.stringify(r.body)).not.toContain('9998') // 내부 주소 유출 없음
    spy.mockRestore()
  })

  it('treats a response-less FetchError as unreachable even without a known code', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const err: any = new Error('fetch failed')
    err.name = 'FetchError' // response 없음, code 없음
    expect(toApiErrorResponse(err).body.error.code).toBe('upstream_unavailable')
    spy.mockRestore()
  })

  it('never leaks the upstream url into the client body', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const err = { cause: { code: 'ECONNREFUSED' }, message: 'connect ECONNREFUSED http://localhost:9998/api/x' }
    expect(JSON.stringify(toApiErrorResponse(err).body)).not.toContain('9998')
    spy.mockRestore()
  })

  it('keeps the envelope shape when the backend answers off-contract', () => {
    const r = toApiErrorResponse({ response: { status: 500 }, data: '<html>gateway</html>' })
    expect(r.status).toBe(500)
    expect(r.body.error.code).toBe('upstream_error')
  })

  it('rethrows anything it does not recognise', () => {
    expect(() => toApiErrorResponse(new Error('programmer error'))).toThrow('programmer error')
  })
})
