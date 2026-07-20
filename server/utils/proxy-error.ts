// 업스트림 실패를 백엔드 봉투 원형 그대로 중계하기 위한 변환.
//
// throw하지 않는 이유(docs/error-handling.md 참조):
//  - createError({data})는 Nitro가 한 겹 더 감싸 봉투를 e.data.data.error로 밀어낸다.
//  - bare rethrow는 h3가 unhandled로 표시해 스택트레이스를 통째로 덤프한다.
// h3 자신의 sendProxy도 같은 방식(상태코드 + 본문 중계)을 쓴다.

const NETWORK_CODES = ['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNRESET']

export interface ApiErrorEnvelope {
  error: { code: string; message: string }
}

export interface ApiErrorResponse {
  status: number
  body: ApiErrorEnvelope
}

// 네트워크 실패 코드는 cause 체인 깊숙이 묻혀 있다. localhost 연결 거부의 실제 형태는
//   FetchError(code=undefined)
//    → cause TypeError "fetch failed"(code=undefined)
//       → cause AggregateError(code=ECONNREFUSED)
//          → errors[] [ECONNREFUSED ::1, ECONNREFUSED 127.0.0.1]
// 이라, err.cause.code만 보면(한 겹) 놓친다. cause 체인과 AggregateError.errors를 모두 훑는다.
function findNetworkCode(err: any): string | undefined {
  const seen = new Set<any>()
  const visit = (e: any): string | undefined => {
    if (!e || typeof e !== 'object' || seen.has(e)) return undefined
    seen.add(e)
    if (typeof e.code === 'string' && NETWORK_CODES.includes(e.code)) return e.code
    if (Array.isArray(e.errors)) {
      for (const sub of e.errors) {
        const c = visit(sub)
        if (c) return c
      }
    }
    return visit(e.cause)
  }
  return visit(err)
}

/**
 * $fetch가 던진 에러를 {status, body}로 바꾼다.
 * 알아보지 못한 에러는 rethrow해 h3의 unhandled 경로로 보낸다(진짜 버그이므로).
 */
export function toApiErrorResponse(err: any): ApiErrorResponse {
  const status = err?.response?.status
  if (status) {
    const body = err?.data
    if (body?.error?.code) return { status, body }
    // 백엔드가 규약 밖 형태로 답해도 봉투 모양은 지킨다.
    return { status, body: { error: { code: 'upstream_error', message: `upstream returned ${status}` } } }
  }

  // err.response가 없다 = 백엔드가 응답 자체를 못 줬다. ofetch는 연결 실패를 응답 없는
  // FetchError로 던지므로, 네트워크 코드를 못 찾더라도 응답 없는 FetchError면 도달 불가로 본다.
  const netCode = findNetworkCode(err)
  if (netCode || err?.name === 'FetchError') {
    const detail = netCode ?? 'no response'
    // 내부 주소는 클라이언트 본문에는 절대 넣지 않는다(아래 body). 서버 로그에는
    // 진단을 위해 원본 메시지를 남긴다 — 코드를 못 찾은 경우(타임아웃 등) 특히 유용하다.
    console.error(`[proxy] RPA API unreachable (${detail})`, err?.message ?? '')
    return { status: 502, body: { error: { code: 'upstream_unavailable', message: `RPA API unreachable (${detail})` } } }
  }

  throw err
}
