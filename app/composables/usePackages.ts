// The /api/packages channel (deploy binaries) is not part of the generated
// OpenAPI spec, so its shape is declared here rather than in #shared/types/api.
export interface PackageMeta {
  name: string
  version: string
  hash: string // sha256 hex of the package blob
  object: string // blob object key
  size: number
  createdAt: string
  latest?: boolean // true for the current latest version of its package
}

export function usePackages() {
  const api = useApi()
  return {
    // GET /api/packages → { packages: PackageMeta[] } (all versions, newest-first per name)
    list: async () => (await api<{ packages: PackageMeta[] }>('/packages')).packages ?? [],
    // DELETE /api/packages/{name}/{version} — removes the blob, repairs latest.
    remove: (p: PackageMeta) =>
      api(`/packages/${encodeURIComponent(p.name)}/${encodeURIComponent(p.version)}`, { method: 'DELETE' }),
    // POST multipart to the dedicated upload proxy route.
    upload: (file: File, name: string, version: string) => {
      const form = new FormData()
      form.append('name', name)
      form.append('version', version)
      form.append('file', file)
      return $fetch('/api/packages-upload', { method: 'POST', body: form })
    },
    downloadUrl: (p: PackageMeta) =>
      `/api/packages/${encodeURIComponent(p.name)}/${encodeURIComponent(p.version)}/download`,
  }
}
