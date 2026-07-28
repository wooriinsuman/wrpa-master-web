import { describe, it, expect, vi } from 'vitest'
import { buildProxyHeaders, clientContextHeaders } from './proxy-helpers'

describe('buildProxyHeaders', () => {
  it('adds Bearer auth when token cookie present', () => {
    const h = buildProxyHeaders('jwt-abc')
    expect(h.Authorization).toBe('Bearer jwt-abc')
  })
  it('omits auth when no token', () => {
    const h = buildProxyHeaders(undefined)
    expect(h.Authorization).toBeUndefined()
  })
})

// getHeader(event, name)은 event.node.req.headers[name]을 읽는다 — 실제 H3Event
// 전체를 만들 필요 없이 그 형태만 갖추면 된다.
function fakeEvent(headers: Record<string, string>, remoteAddress?: string) {
  return { node: { req: { headers, socket: { remoteAddress } } } } as never
}

describe('clientContextHeaders', () => {
  it('takes the edge-written X-Real-IP', () => {
    const h = clientContextHeaders(fakeEvent({ 'x-real-ip': '203.0.113.9' }, '10.0.0.1'))
    expect(h['X-Real-IP']).toBe('203.0.113.9')
  })

  it('falls back to the socket address when X-Real-IP is absent (local dev, no edge)', () => {
    const h = clientContextHeaders(fakeEvent({}, '10.0.0.1'))
    expect(h['X-Real-IP']).toBe('10.0.0.1')
  })

  // X-Forwarded-For 는 읽지 않는다: Caddy 가 자기가 본 주소(HAProxy IP)를 덧붙여
  // 항목을 세야 하고, h3 의 getRequestIP()는 버전에 따라 첫 항목을 골라 클라이언트가
  // 보낸 위조값을 채택한다.
  it('ignores X-Forwarded-For entirely', () => {
    const h = clientContextHeaders(fakeEvent({ 'x-forwarded-for': '1.2.3.4, 10.0.0.2' }, '10.0.0.1'))
    expect(h['X-Real-IP']).toBe('10.0.0.1')
  })

  it('forwards the User-Agent', () => {
    const h = clientContextHeaders(fakeEvent({ 'user-agent': 'Mozilla/5.0 Chrome/126' }))
    expect(h['User-Agent']).toBe('Mozilla/5.0 Chrome/126')
  })

  it('truncates an oversized User-Agent to 256 chars', () => {
    const h = clientContextHeaders(fakeEvent({ 'user-agent': 'x'.repeat(400) }))
    expect(h['User-Agent']).toHaveLength(256)
  })

  it('omits keys with no value rather than sending empty strings', () => {
    expect(clientContextHeaders(fakeEvent({}))).toEqual({})
  })
})
