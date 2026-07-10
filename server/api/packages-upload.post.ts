import { buildProxyHeaders } from '../utils/proxy-helpers'

// Dedicated upload route. The catch-all proxy parses bodies with readBody(),
// which corrupts binary multipart, so package uploads are streamed here instead:
// we re-assemble the multipart form and POST it to the backend's gated
// /api/packages endpoint, injecting the uploader token.
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
    return await $fetch(`${config.rpaApiUrl}/api/packages`, {
      method: 'POST',
      query: { name, version },
      headers: buildProxyHeaders(token, config.uploadToken),
      body: form,
    })
  } catch (err: any) {
    if (err?.response?.status === 401) {
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized', message: '업로드 권한이 없습니다.' })
    }
    const code = err?.cause?.code ?? err?.code
    if (!err?.response && ['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNRESET'].includes(code)) {
      console.error(`[upload] RPA API unreachable at ${config.rpaApiUrl}/api/packages (${code})`)
      throw createError({ statusCode: 502, statusMessage: 'Bad Gateway', message: 'RPA API를 사용할 수 없습니다. 잠시 후 다시 시도해 주세요.' })
    }
    throw err
  }
})
