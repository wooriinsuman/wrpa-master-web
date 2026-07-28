import { getHeader, type H3Event } from 'h3'

export function buildProxyHeaders(token: string | undefined, uploadToken?: string): Record<string, string> {
  const h: Record<string, string> = {}
  if (token) h.Authorization = `Bearer ${token}`
  // The uploader token gates the package/asset publish + delete endpoints. It is
  // harmless on other routes (the backend ignores it), so we forward it whenever
  // configured rather than special-casing paths.
  if (uploadToken) h['X-Upload-Token'] = uploadToken
  return h
}

// UA 는 헤더/DB 값이 무한정 커지지 않도록 자른다 (엣지의 로그 캡처 길이와 동일).
const UA_MAX = 256

// 원 클라이언트 컨텍스트(IP·UA)를 master 로 넘기는 헤더.
//
// 브라우저는 master 를 직접 호출하지 않고 이 서버가 대신 호출한다. 이 헤더를 붙이지
// 않으면 master 에는 이 프로세스의 UA(node)와 주소가 기록되어, 모든 세션의 기기
// 정보가 같은 값이 된다.
//
// IP 는 엣지(HAProxy)가 `http-request set-header X-Real-IP %[src]` 로 한 번만 기록한
// X-Real-IP 를 그대로 쓴다. X-Forwarded-For 는 Caddy 가 자기가 본 주소를 덧붙이므로
// 항목을 세야 하는데, 프록시가 추가/제거되면 그 숫자가 조용히 틀려진다.
//
// h3 의 getRequestIP() 는 쓰지 않는다 — 버전에 따라 XFF 의 첫 항목을 고르는데,
// 그러면 클라이언트가 보낸 위조 XFF 가 그대로 채택된다.
export function clientContextHeaders(event: H3Event): Record<string, string> {
  const h: Record<string, string> = {}
  const ip = getHeader(event, 'x-real-ip')?.trim() || event.node.req.socket?.remoteAddress
  if (ip) h['X-Real-IP'] = ip
  const ua = getHeader(event, 'user-agent')?.trim()
  if (ua) h['User-Agent'] = ua.slice(0, UA_MAX)
  return h
}
