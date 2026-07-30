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
  | 'workfile_duplicate'
  | 'username_taken'
  | 'invalid_reference'
  | 'user_active'
  | 'self_delete'
  | 'self_deactivate'
  | 'last_system_user'
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
  workfile_duplicate: '같은 보험사에 동일한 분류 조합(데이터/유형/보종/컨텐츠)의 작업 파일이 이미 있습니다.',
  // 아이디 UNIQUE 제약은 정지된 계정까지 포함한다. 목록 기본값이 '전체'라 그 계정이
  // 화면에 보이므로, 재활성화든 완전 삭제든 조치를 바로 취할 수 있다.
  username_taken: '이미 사용 중인 아이디입니다. 정지된 계정이 쓰고 있을 수 있으니 목록에서 해당 계정을 재활성화하거나 완전 삭제해 주세요.',
  // 사용자 생애주기 409. 코드마다 조치가 다르므로 공용 'conflict'로 묶지 않는다.
  user_active: '정지된 계정만 완전 삭제할 수 있습니다. 먼저 정지한 뒤 삭제해 주세요.',
  self_delete: '자기 계정은 삭제할 수 없습니다. 다른 시스템 관리자에게 요청해 주세요.',
  self_deactivate: '자기 계정은 정지할 수 없습니다. 다른 시스템 관리자에게 요청해 주세요.',
  last_system_user: '마지막 시스템 관리자 계정입니다. 다른 시스템 관리자를 먼저 만들어 주세요.',
  invalid_reference: '선택한 회사 또는 역할이 존재하지 않습니다. 목록을 다시 불러온 뒤 시도해 주세요.',
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
