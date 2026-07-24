// Frontend mirror of the backend's internal/auth.RankOf — numeric role ranks
// used for hierarchical authorization (USER < ADMIN < SYSTEM) instead of
// exact role-name matching. Used as a fallback when the server-sent
// MeResponse.level is absent (e.g. tokens issued before the `lvl` claim).
export const RANK_USER = 10
export const RANK_ADMIN = 20
export const RANK_SYSTEM = 30

const ROLE_RANKS: Record<string, number> = {
  ROLE_USER: RANK_USER,
  ROLE_ADMIN: RANK_ADMIN,
  ROLE_SYSTEM: RANK_SYSTEM,
}

// Returns the highest rank among the given role names. Unknown names
// contribute 0; an empty/missing slice returns 0.
export function rankOf(roles: string[] = []): number {
  let max = 0
  for (const name of roles) {
    const r = ROLE_RANKS[name] ?? 0
    if (r > max) max = r
  }
  return max
}
