import { buildProxyHeaders } from '../utils/proxy-helpers'
import { toApiErrorResponse } from '../utils/proxy-error'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const token = getCookie(event, 'access_token')
  const path = event.path // includes /api/...
  try {
    return await $fetch(`${config.rpaApiUrl}${path}`, {
      method: event.method,
      headers: buildProxyHeaders(token, config.uploadToken),
      body: ['GET', 'HEAD'].includes(event.method) ? undefined : await readBody(event).catch(() => undefined),
    })
  } catch (err: any) {
    // 봉투를 원형 그대로 중계한다. throw하지 않는 이유는 docs/error-handling.md 참조.
    const { status, body } = toApiErrorResponse(err)
    if (status === 401) deleteCookie(event, 'access_token')
    setResponseStatus(event, status)
    return body
  }
})
