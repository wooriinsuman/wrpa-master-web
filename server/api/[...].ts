import { buildProxyHeaders } from './_proxy-helpers'

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
    throw err
  }
})
