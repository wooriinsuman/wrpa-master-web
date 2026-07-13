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
    // PUT /api/packages/{name}/{version}/latest — 이 버전을 배포(latest)로 재지정. 구버전 롤백도 가능.
    setLatest: (p: PackageMeta) =>
      api(`/packages/${encodeURIComponent(p.name)}/${encodeURIComponent(p.version)}/latest`, { method: 'PUT' }),
    // DELETE /api/packages/{name}/latest — 배포 해제(어느 버전도 배포하지 않음). 버전은 보존.
    clearLatest: (name: string) =>
      api(`/packages/${encodeURIComponent(name)}/latest`, { method: 'DELETE' }),
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
