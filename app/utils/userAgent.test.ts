import { describe, it, expect } from 'vitest'
import { formatUserAgent } from './userAgent'

describe('formatUserAgent', () => {
  it('reads Chrome on Windows', () => {
    expect(formatUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'))
      .toBe('Chrome 126 · Windows')
  })

  // Edge/Opera/Whale 의 UA 에는 Chrome/ 도 들어 있다 — 더 구체적인 쪽이 먼저 걸려야 한다.
  it('prefers Edge over the Chrome token it also carries', () => {
    expect(formatUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0'))
      .toBe('Edge 126 · Windows')
  })

  it('reads Whale', () => {
    expect(formatUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Whale/3.26.244.21 Safari/537.36'))
      .toBe('Whale 3 · Windows')
  })

  it('reads Safari on macOS', () => {
    expect(formatUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15'))
      .toBe('Safari 17 · macOS')
  })

  // iPhone UA 는 "like Mac OS X" 를 포함한다 — iOS 가 macOS 보다 먼저 걸려야 한다.
  it('reads iOS rather than macOS for an iPhone', () => {
    expect(formatUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'))
      .toBe('Safari 17 · iOS')
  })

  // Android UA 는 Linux 를 포함한다 — Android 가 먼저 걸려야 한다.
  it('reads Android rather than Linux', () => {
    expect(formatUserAgent('Mozilla/5.0 (Linux; Android 14; SM-S911N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36'))
      .toBe('Chrome 126 · Android')
  })

  it('reads Firefox', () => {
    expect(formatUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0'))
      .toBe('Firefox 127 · Windows')
  })

  // 알아보지 못하면 원문을 그대로 돌려준다 — 파싱 실패로 정보를 잃지 않는다.
  // (프록시 헤더 수정 전에 기록된 세션은 UA 가 'node' 다.)
  it('returns the raw string when nothing is recognised', () => {
    expect(formatUserAgent('node')).toBe('node')
  })

  it('labels an empty or missing UA', () => {
    expect(formatUserAgent('')).toBe('알 수 없는 기기')
    expect(formatUserAgent(null)).toBe('알 수 없는 기기')
    expect(formatUserAgent(undefined)).toBe('알 수 없는 기기')
  })
})
