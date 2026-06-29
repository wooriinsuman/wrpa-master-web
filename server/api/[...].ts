import { buildProxyHeaders } from '../utils/proxy-helpers'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const token = getCookie(event, 'access_token')
  const path = event.path // includes /api/...
  try {
    return await $fetch(`${config.rpaApiUrl}${path}`, {
      method: event.method,
      headers: buildProxyHeaders(token),
      body: ['GET', 'HEAD'].includes(event.method) ? undefined : await readBody(event).catch(() => undefined),
    })
  } catch (err: any) {
    if (err?.response?.status === 401) {
      deleteCookie(event, 'access_token')
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }
    // Backend (rpaApiUrl) unreachable — surface a clean 502 instead of an
    // unhandled ECONNREFUSED stack trace flooding the dev server logs.
    const code = err?.cause?.code ?? err?.code
    if (!err?.response && ['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNRESET'].includes(code)) {
      // Log the internal target server-side only; never leak the upstream URL
      // (internal infrastructure) to the client.
      console.error(`[proxy] RPA API unreachable at ${config.rpaApiUrl}${path} (${code})`)
      throw createError({
        statusCode: 502,
        statusMessage: 'Bad Gateway',
        message: 'RPA API를 사용할 수 없습니다. 잠시 후 다시 시도해 주세요.',
      })
    }
    throw err
  }
})
