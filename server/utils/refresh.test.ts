import { describe, it, expect, vi, beforeEach } from 'vitest'

// $fetch를 전역 모킹
const fetchMock = vi.fn()
vi.stubGlobal('$fetch', fetchMock)

import { refreshTokens, __resetRefreshInflight } from './refresh'

describe('refreshTokens single-flight', () => {
  beforeEach(() => { fetchMock.mockReset(); __resetRefreshInflight() })

  it('coalesces concurrent calls for the same token into one backend call', async () => {
    fetchMock.mockResolvedValue({ accessToken: 'a2', refreshToken: 'r2' })
    const [x, y, z] = await Promise.all([
      refreshTokens('http://b', 'r1'),
      refreshTokens('http://b', 'r1'),
      refreshTokens('http://b', 'r1'),
    ])
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(x).toEqual({ accessToken: 'a2', refreshToken: 'r2' })
    expect(y).toEqual(x); expect(z).toEqual(x)
  })

  it('returns null on backend failure', async () => {
    fetchMock.mockRejectedValue(new Error('401'))
    expect(await refreshTokens('http://b', 'r1')).toBeNull()
  })
})
