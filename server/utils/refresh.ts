export interface RefreshResult {
  accessToken: string
  refreshToken: string
}

// Coalesce concurrent refreshes keyed by the presented refresh-token plaintext,
// so N simultaneous 401s trigger exactly one backend rotation. The first
// caller's client-context headers win — concurrent callers share one refresh
// token, so they are the same browser anyway.
const inflight = new Map<string, Promise<RefreshResult | null>>()

export function refreshTokens(
  rpaApiUrl: string,
  refreshToken: string,
  headers?: Record<string, string>,
): Promise<RefreshResult | null> {
  const existing = inflight.get(refreshToken)
  if (existing) return existing

  const p = (async (): Promise<RefreshResult | null> => {
    try {
      return await $fetch<RefreshResult>(`${rpaApiUrl}/api/auth/refresh`, {
        method: 'POST',
        body: { refreshToken },
        headers,
      })
    } catch {
      return null
    }
  })().finally(() => { inflight.delete(refreshToken) })

  inflight.set(refreshToken, p)
  return p
}

// test-only: clear the in-flight map between cases
export function __resetRefreshInflight() { inflight.clear() }
