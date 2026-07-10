// 백엔드 에러 응답 봉투: {"error":{"code":"...","message":"..."}} (user_handler.go oapiErrorResponse).
// 이 프로젝트의 server/api/[...].ts 프록시는 실패 시 ofetch FetchError를 그대로 throw(bare rethrow)하므로,
// h3/ofetch 직렬화 경로를 거치며 .data가 정확히 어떤 모양으로 브라우저까지 도달하는지는 라이브 백엔드 없이는
// 완전히 확정할 수 없다. 그래서 있을 법한 모든 모양을 우선순위대로 시도하는 방어적 헬퍼로 통일한다.
export function extractApiError(e: any, fallback: string): string {
  return e?.data?.error?.message ?? e?.data?.message ?? e?.message ?? fallback
}
