import { buildProxyHeaders } from '../utils/proxy-helpers'

// Dedicated download route. Two reasons it can't go through the catch-all proxy
// or straight to the machine plane:
//   1. 머신플레인 /api/worker/packages/{name}/{version}/download 는 worker key
//      (Authorization: Bearer wk_)를 요구한다. 브라우저 <a href download>는 헤더를
//      못 실으므로 401 JSON을 받아 download.json 으로 저장되며 다운로드가 실패한다.
//   2. catch-all 프록시는 $fetch로 응답을 파싱해 tar.gz 바이너리를 손상시키고
//      Content-Disposition(파일명)도 잃는다.
// 그래서 admin plane(/api/packages/.../download)으로 uploader token을 주입해
// sendProxy로 스트리밍한다 — 응답 헤더(Content-Type, Content-Disposition)가 그대로
// 브라우저에 전달되어 wrpa-launcher-1.0.12.tar.gz 로 저장된다.
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  // 관리자 세션 없이 바이너리를 흘리지 않는다 — admin plane의 나머지와 동일한 posture.
  const token = getCookie(event, 'access_token')
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized', message: '로그인이 필요합니다.' })
  }

  const { name, version } = getQuery(event) as { name?: string, version?: string }
  if (!name || !version) {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: '패키지명과 버전이 필요합니다.' })
  }

  const target = `${config.rpaApiUrl}/api/packages/${encodeURIComponent(name)}/${encodeURIComponent(version)}/download`
  return sendProxy(event, target, {
    headers: buildProxyHeaders(token, config.uploadToken),
  })
})
