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
      throw createError({
        statusCode: 502,
        statusMessage: 'Bad Gateway',
        message: `RPA API unreachable at ${config.rpaApiUrl} (${code})`,
      })
    }
    throw err
  }
})
