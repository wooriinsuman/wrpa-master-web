<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Column } from '~/components/WDataTable.vue'
import type { StatusCell } from '~/utils/status'
import type { PackageMeta } from '~/composables/usePackages'

const packages = usePackages()
const { push } = useToast()
const { data, refresh, pending } = await useAsyncData('packages', () => packages.list())

function fmtSize(bytes: number): string {
  if (!bytes) return '—'
  const u = ['B', 'KB', 'MB', 'GB']
  let n = bytes, i = 0
  while (n >= 1024 && i < u.length - 1) { n /= 1024; i++ }
  return `${n.toFixed(i ? 1 : 0)} ${u[i]}`
}

function fmtDate(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('ko-KR')
}

const search = ref('')
const list = computed<PackageMeta[]>(() => data.value ?? [])

interface PackageRow {
  name: string
  status: StatusCell
  version: string
  size: string
  created: string
  _src: PackageMeta
}

// Group by package name (sorted), versions newest-first within each group, and
// blank the name on every row but the group's first so the table reads grouped.
const rows = computed<PackageRow[]>(() => {
  const q = search.value.trim().toLowerCase()
  const filtered = q
    ? list.value.filter(p => [p.name, p.version].some(x => x.toLowerCase().includes(q)))
    : list.value

  const byName = new Map<string, PackageMeta[]>()
  for (const p of filtered) {
    const arr = byName.get(p.name) ?? []
    arr.push(p)
    byName.set(p.name, arr)
  }

  const out: PackageRow[] = []
  for (const name of [...byName.keys()].sort()) {
    const versions = byName.get(name)!.slice()
      .sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }))
    versions.forEach((p, i) => {
      out.push({
        name: i === 0 ? name : '',
        status: p.latest
          ? { label: '최신', kind: 'done' } as StatusCell
          : { label: '이전', kind: 'idle' } as StatusCell,
        version: p.version,
        size: fmtSize(p.size),
        created: fmtDate(p.createdAt),
        _src: p,
      })
    })
  }
  return out
})

const columns: Column[] = [
  { key: 'name', label: '패키지명', kind: 'mono' },
  { key: 'status', label: '구분', kind: 'status' },
  { key: 'version', label: '버전', kind: 'mono' },
  { key: 'size', label: '크기', kind: 'muted' },
  { key: 'created', label: '게시일', kind: 'text' },
]

// --- upload ---
const drawerOpen = ref(false)
const up = ref({ name: '', version: '' })
const selectedFile = ref<File | null>(null)

function openUpload() {
  up.value = { name: '', version: '' }
  selectedFile.value = null
  drawerOpen.value = true
}
function onFile(e: Event) {
  selectedFile.value = (e.target as HTMLInputElement).files?.[0] ?? null
}
async function doUpload() {
  if (!selectedFile.value) { push('파일을 선택하세요.'); return }
  if (!up.value.name.trim() || !up.value.version.trim()) { push('패키지명과 버전을 입력하세요.'); return }
  try {
    await packages.upload(selectedFile.value, up.value.name.trim(), up.value.version.trim())
    drawerOpen.value = false
    await refresh()
    push('업로드되었습니다.')
  } catch (e: any) {
    push(e?.data?.message ?? e?.message ?? '업로드에 실패했습니다.')
  }
}

// --- delete ---
async function doDelete(p: PackageMeta) {
  if (!confirm(`${p.name} ${p.version} 버전을 삭제할까요?\n실제 파일이 영구히 제거됩니다.`)) return
  try {
    await packages.remove(p)
    await refresh()
    push('삭제되었습니다.')
  } catch (e: any) {
    push(e?.data?.message ?? e?.message ?? '삭제에 실패했습니다.')
  }
}
</script>

<template>
  <section class="panel">
    <WPageHeader title="패키지" desc="배포 바이너리 (자동 업데이트 채널)" add-label="+ 패키지 업로드"
      v-model:search="search" @add="openUpload" />

    <WDataTable v-if="rows.length" :columns="columns" :rows="rows" :actions-width="168">
      <template #actions="{ row }">
        <a class="act act--ghost" :href="packages.downloadUrl(row._src)" download>다운로드</a>
        <button class="act act--danger" @click="doDelete(row._src)">삭제</button>
      </template>
    </WDataTable>
    <WEmptyState
      v-else
      title="패키지가 없습니다"
      :message="pending ? '불러오는 중…' : '아직 게시된 배포 바이너리가 없습니다.'"
      cta-label="+ 패키지 업로드"
      @cta="openUpload"
    />

    <WDrawer v-model:open="drawerOpen" title="패키지 업로드" description="배포 바이너리(.tar.gz)를 업로드합니다.">
      <label class="fld"><span>패키지명 <span class="req">*</span></span><input v-model="up.name" placeholder="wrpa-client" /></label>
      <label class="fld"><span>버전 <span class="req">*</span></span><input v-model="up.version" placeholder="1.0.0" /></label>
      <label class="fld"><span>파일 <span class="req">*</span></span><input type="file" accept=".gz,.tar,.tgz,application/gzip" @change="onFile" /></label>
      <p v-if="selectedFile" class="muted">{{ selectedFile.name }} ({{ fmtSize(selectedFile.size) }})</p>
      <template #footer>
        <button class="act act--ghost" @click="drawerOpen = false">취소</button>
        <button class="act act--primary" @click="doUpload">업로드</button>
      </template>
    </WDrawer>
  </section>
</template>

<style scoped>
/* .act / .fld come from the global DS (assets/css/components.css). */
a.act { text-decoration: none; display: inline-flex; align-items: center; }
.panel { background: var(--panel); border: 1px solid var(--line); border-radius: 14px; overflow: hidden; box-shadow: var(--rim), var(--elev); }
.muted { color: var(--ink-2); font-size: 12px; margin: 2px 0 0; }
</style>
