// 백엔드 에러 봉투: {"error":{"code":"...","message":"..."}}
// message는 영문 개발자용이라 화면에 표시하지 않는다. 화면 문구는 code로 매핑한다.
// 규약 원본은 ../wrpa-master-v2/docs/error-contract.md, 적용 규칙은 docs/error-handling.md.

/** 백엔드 어휘 + 프록시가 합성하는 FE 전용 code. */
export type ApiErrorCode =
  | 'bad_request'
  | 'invalid_credentials'
  | 'unauthorized'
  | 'account_inactive'
  | 'forbidden'
  | 'not_found'
  | 'conflict'
  | 'work_not_pending'
  | 'workfile_in_use'
  | 'upstream_unavailable' // 프록시 합성: 백엔드 무응답
  | 'upstream_error' // 프록시 합성: 백엔드가 봉투 밖 형태로 응답

// 화면 문맥과 무관하게 단일 문구가 옳은 code만 등재한다.
// not_found/bad_request/conflict는 의도적으로 제외 — 화면이 자기 엔티티를 알기에
// 호출부 fallback("휴일을 찾을 수 없습니다")이 공용 문구보다 항상 더 정확하다.
// 여기 넣으면 우선순위상 공용 문구가 더 나은 fallback을 덮어써 퇴행한다.
const MESSAGES: Partial<Record<ApiErrorCode, string>> = {
  invalid_credentials: '아이디 또는 비밀번호가 올바르지 않습니다.',
  account_inactive: '비활성화된 계정입니다. 관리자에게 문의하세요.',
  unauthorized: '세션이 만료되었습니다. 다시 로그인해 주세요.',
  forbidden: '권한이 없습니다.',
  work_not_pending: '대기 중인 작업만 조정할 수 있습니다.',
  workfile_in_use: '작업파일이 참조 중이라 삭제할 수 없습니다.',
  upstream_unavailable: 'RPA API를 사용할 수 없습니다. 잠시 후 다시 시도해 주세요.',
  upstream_error: 'RPA API 응답을 처리할 수 없습니다. 잠시 후 다시 시도해 주세요.',
}

/** 봉투에서 code만 꺼낸다. 분기(리다이렉트 등)가 필요한 호출부용. */
export function apiErrorCode(e: any): string | undefined {
  return e?.data?.error?.code
}

/**
 * 에러를 화면 문구로 바꾼다. 우선순위: overrides → 공용 매핑 → fallback.
 * fallback은 필수다 — 백엔드에 새 code가 생겨도 화면이 비면 안 된다.
 */
export function extractApiError(e: any, fallback: string, overrides?: Record<string, string>): string {
  const code = apiErrorCode(e)
  if (!code) return fallback
  return overrides?.[code] ?? MESSAGES[code as ApiErrorCode] ?? fallback
}
