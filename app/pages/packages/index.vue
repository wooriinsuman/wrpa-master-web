<script setup lang="ts">
import { ref, computed } from 'vue'
import type { PackageMeta } from '~/composables/usePackages'
import type { AssetManifestMeta, AssetManifestDoc } from '~/composables/useAssets'
import type { AccordionGroup } from '~/components/WPackageAccordion.vue'
import { fmtSize, fmtDate } from '~/utils/format'
import { buildFileTree } from '~/utils/fileTree'

const packages = usePackages()
const assets = useAssets()
const { push } = useToast()
const { data, refresh, pending } = await useAsyncData('packages', () => packages.list())
const { data: assetData, refresh: refreshAssets } = await useAsyncData('asset-manifests', () => assets.list())

async function refreshAll() {
  await Promise.all([refresh(), refreshAssets()])
}

const search = ref('')

// 패키지 그룹 + 에셋 그룹을 하나의 아코디언으로. 패키지는 이름별로 묶고 각 그룹은
// 버전 최신순, 에셋은 매니페스트 버전 단일 스트림.
const groups = computed<AccordionGroup[]>(() => {
  const q = search.value.trim().toLowerCase()

  // --- 패키지 그룹 ---
  const pkgList = (data.value ?? []).filter(p =>
    !q || [p.name, p.version].some(x => x.toLowerCase().includes(q)))
  const byName = new Map<string, PackageMeta[]>()
  for (const p of pkgList) {
    const arr = byName.get(p.name) ?? []
    arr.push(p)
    byName.set(p.name, arr)
  }
  const pkgGroups: AccordionGroup[] = [...byName.keys()].sort().map((name) => {
    const versions = byName.get(name)!.slice()
      .sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }))
    return {
      kind: 'package' as const,
      name,
      deployedVersion: versions.find(p => p.latest)?.version ?? '',
      items: versions.map(p => ({ version: p.version, cols: [fmtSize(p.size), fmtDate(p.createdAt)], src: p })),
    }
  })

  // --- 에셋(assets) 그룹 --- (백엔드가 이미 최신순으로 반환)
  const assetList = (assetData.value ?? [])
    .filter(a => !q || a.version.toLowerCase().includes(q) || '에셋assets'.includes(q))
  const activeAsset = assetList.find(a => a.active)
  const assetGroups: AccordionGroup[] = assetList.length
    ? [{
      kind: 'asset' as const,
      name: '에셋(assets)',
      deployedVersion: activeAsset?.version ?? '',
      items: assetList.map(a => ({
        version: a.version,
        cols: [`파일 ${a.fileCount}개`, fmtSize(a.totalSize), fmtDate(a.createdAt)],
        src: a,
      })),
    }]
    : []

  return [...pkgGroups, ...assetGroups]
})

// --- 통합 확인 게이트 (배포/해제 · 패키지/에셋 공통) ---
interface ConfirmAction {
  title: string
  label: string
  message: string
  run: () => Promise<unknown>
  ok: string
  fail: string
}
const confirmOpen = ref(false)
const pendingAction = ref<ConfirmAction | null>(null)
function ask(a: ConfirmAction) {
  pendingAction.value = a
  confirmOpen.value = true
}
async function confirmRun() {
  const a = pendingAction.value
  if (!a) return
  try {
    await a.run()
    await refreshAll()
    push(a.ok, 'success')
  } catch (e: any) {
    push(extractApiError(e, a.fail), 'error')
  }
}

// 패키지 배포/해제
function askDeployPackage(p: PackageMeta) {
  ask({
    title: '버전 배포', label: '배포',
    message: `'${p.name}' 패키지를 ${p.version} 버전으로 배포할까요? 워커가 이 버전으로 자동 업데이트됩니다.`,
    run: () => packages.setLatest(p),
    ok: `${p.name} ${p.version} 버전을 배포했습니다.`, fail: '배포에 실패했습니다.',
  })
}
function askUndeployPackage(p: PackageMeta) {
  ask({
    title: '배포 해제', label: '해제',
    message: `'${p.name}' 패키지의 배포를 해제할까요? 어느 버전도 배포되지 않아 워커가 새 업데이트를 받지 않습니다.`,
    run: () => packages.clearLatest(p.name),
    ok: `${p.name} 배포를 해제했습니다.`, fail: '배포 해제에 실패했습니다.',
  })
}

// 에셋 배포/해제
function askDeployAsset(a: AssetManifestMeta) {
  ask({
    title: '에셋 배포', label: '배포',
    message: `에셋 매니페스트 v${a.version}을(를) 배포할까요? 워커가 이 버전으로 동기화됩니다.`,
    run: () => assets.activate(a.version),
    ok: `에셋 v${a.version}을(를) 배포했습니다.`, fail: '에셋 배포에 실패했습니다.',
  })
}
function askUndeployAsset() {
  ask({
    title: '에셋 배포 해제', label: '해제',
    message: '에셋 배포를 해제할까요? 어느 매니페스트도 배포되지 않아 워커는 현재 에셋을 유지합니다.',
    run: () => assets.clearActive(),
    ok: '에셋 배포를 해제했습니다.', fail: '에셋 배포 해제에 실패했습니다.',
  })
}

// 아코디언 이벤트 라우팅 (그룹 kind로 분기)
function onActivate(g: AccordionGroup, row: { src: any }) {
  if (g.kind === 'package') askDeployPackage(row.src as PackageMeta)
  else askDeployAsset(row.src as AssetManifestMeta)
}
function onDeactivate(g: AccordionGroup, row: { src: any }) {
  if (g.kind === 'package') askUndeployPackage(row.src as PackageMeta)
  else askUndeployAsset()
}

// --- 패키지 삭제 ---
async function doDelete(_g: AccordionGroup, row: { src: any }) {
  const p = row.src as PackageMeta
  if (!confirm(`${p.name} ${p.version} 버전을 삭제할까요?\n실제 파일이 영구히 제거됩니다.`)) return
  try {
    await packages.remove(p)
    await refreshAll()
    push('삭제되었습니다.', 'success')
  } catch (e: any) {
    push(extractApiError(e, '삭제에 실패했습니다.'), 'error')
  }
}

// --- 에셋 매니페스트 보기 ---
const viewOpen = ref(false)
const viewMeta = ref<AssetManifestMeta | null>(null)
const viewDoc = ref<AssetManifestDoc | null>(null)
const viewTree = computed(() => buildFileTree(viewDoc.value?.files ?? {}))
async function onView(_g: AccordionGroup, row: { src: any }) {
  const a = row.src as AssetManifestMeta
  viewMeta.value = a
  viewDoc.value = null
  viewOpen.value = true
  try {
    viewDoc.value = await assets.getManifest(a.version)
  } catch {
    push('매니페스트를 불러오지 못했습니다.', 'error')
  }
}

// --- 패키지 업로드 ---
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
    push('업로드되었습니다.', 'success')
  } catch (e: any) {
    push(e?.data?.message ?? e?.message ?? '업로드에 실패했습니다.', 'error')
  }
}
</script>

<template>
  <section class="panel">
    <WPageHeader title="패키지" desc="배포 바이너리·에셋 (자동 업데이트 채널) · 버전 chip을 클릭하면 배포됩니다" add-label="+ 패키지 업로드"
      v-model:search="search" @add="openUpload" @refresh="refreshAll" />

    <WPackageAccordion v-if="groups.length" :groups="groups" :download-url="packages.downloadUrl"
      @activate="onActivate" @deactivate="onDeactivate" @remove="doDelete" @view="onView" />
    <WEmptyState
      v-else
      title="패키지가 없습니다"
      :message="pending ? '불러오는 중…' : '아직 게시된 배포 바이너리가 없습니다.'"
      cta-label="+ 패키지 업로드"
      @cta="openUpload"
    />

    <WConfirm v-model:open="confirmOpen" :danger="false" :title="pendingAction?.title ?? ''"
      :confirm-label="pendingAction?.label ?? '확인'" :message="pendingAction?.message ?? ''" @confirm="confirmRun" />

    <WDrawer v-model:open="viewOpen" :title="`에셋 매니페스트 v${viewMeta?.version ?? ''}`"
      :description="viewMeta ? `파일 ${viewMeta.fileCount}개 · ${fmtSize(viewMeta.totalSize)}` : ''">
      <p v-if="!viewDoc" class="muted">불러오는 중…</p>
      <p v-else-if="!viewTree.fileCount" class="muted">파일이 없습니다.</p>
      <div v-else class="mf">
        <WFileTree :dirs="viewTree.dirs" :files="viewTree.files" />
      </div>
      <template #footer>
        <button class="act act--ghost" @click="viewOpen = false">닫기</button>
      </template>
    </WDrawer>

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
.panel { background: var(--panel); border: 1px solid var(--line); border-radius: 14px; overflow: hidden; box-shadow: var(--rim), var(--elev); }
.muted { color: var(--ink-2); font-size: 12px; margin: 2px 0 0; }
.mf { max-height: 60vh; overflow: auto; }
</style>
