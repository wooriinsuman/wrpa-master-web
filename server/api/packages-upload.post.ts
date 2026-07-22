import { buildProxyHeaders } from '../utils/proxy-helpers'
import { toApiErrorResponse } from '../utils/proxy-error'

// Dedicated upload route. The catch-all proxy parses bodies with readBody(),
// which corrupts binary multipart, so package uploads are streamed here instead:
// we re-assemble the multipart form and POST it to the backend's gated
// /api/worker/packages endpoint (machine plane), injecting the uploader token.
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const token = getCookie(event, 'access_token')

  const parts = await readMultipartFormData(event)
  if (!parts) throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: '업로드 데이터가 없습니다.' })

  let name = ''
  let version = ''
  let file: { data: Buffer; filename?: string; type?: string } | undefined
  for (const p of parts) {
    if (p.name === 'name') name = p.data.toString('utf-8').trim()
    else if (p.name === 'version') version = p.data.toString('utf-8').trim()
    else if (p.name === 'file') file = p
  }
  if (!name || !version || !file) {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: '패키지명, 버전, 파일이 모두 필요합니다.' })
  }

  const form = new FormData()
  form.append('file', new Blob([new Uint8Array(file.data)], { type: file.type || 'application/gzip' }), file.filename || `${name}.tar.gz`)

  try {
    // Explicit generic: this hits the external backend, not an internal Nuxt
    // route, and $fetch's route-augmented overloads otherwise blow TS's
    // recursion budget here ("Excessive stack depth") as the app's type graph grows.
    return await $fetch<unknown>(`${config.rpaApiUrl}/api/worker/packages`, {
      method: 'POST',
      query: { name, version },
      headers: buildProxyHeaders(token, config.uploadToken),
      body: form,
    })
  } catch (err: any) {
    const { status, body } = toApiErrorResponse(err)
    setResponseStatus(event, status)
    return body
  }
})
