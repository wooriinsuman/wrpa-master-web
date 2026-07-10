export function buildProxyHeaders(token: string | undefined, uploadToken?: string): Record<string, string> {
  const h: Record<string, string> = {}
  if (token) h.Authorization = `Bearer ${token}`
  // The uploader token gates the package/asset publish + delete endpoints. It is
  // harmless on other routes (the backend ignores it), so we forward it whenever
  // configured rather than special-casing paths.
  if (uploadToken) h['X-Upload-Token'] = uploadToken
  return h
}
