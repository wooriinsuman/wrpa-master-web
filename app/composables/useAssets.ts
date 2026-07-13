// The /api/assets channel (versioned training-data manifest) is not part of the
// generated OpenAPI spec, so its shape is declared here.

// One row of the manifest version index. version is the uploader/CI-supplied
// label (e.g. "1.0.42"), used verbatim as the identity.
export interface AssetManifestMeta {
  version: string
  createdAt: string
  fileCount: number
  totalSize: number
  active: boolean // true for the currently deployed manifest version
}

// A full manifest snapshot: version label + path → blob map.
export interface AssetManifestDoc {
  version: string
  files: Record<string, { hash: string; size: number }>
}

export function useAssets() {
  const api = useApi()
  return {
    // GET /api/assets/manifests → { manifests: AssetManifestMeta[] } (newest-first)
    list: async () => (await api<{ manifests: AssetManifestMeta[] }>('/assets/manifests')).manifests ?? [],
    // GET /api/assets/manifests/{version} — a specific snapshot (for the view drawer).
    getManifest: (version: string) => api<AssetManifestDoc>(`/assets/manifests/${encodeURIComponent(version)}`),
    // PUT /api/assets/manifests/{version}/activate — 이 버전을 배포(활성)로 재지정. 롤백 포함.
    activate: (version: string) => api(`/assets/manifests/${encodeURIComponent(version)}/activate`, { method: 'PUT' }),
    // DELETE /api/assets/active — 배포 해제(어느 버전도 활성 아님). 버전은 보존.
    clearActive: () => api('/assets/active', { method: 'DELETE' }),
  }
}
