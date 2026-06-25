<script setup lang="ts">
import { ref, computed } from 'vue'
import type { components } from '#shared/types/api'
import type { Column } from '~/components/WDataTable.vue'
import type { StatusCell } from '~/utils/status'
import { workerStateKind } from '~/utils/dashboardState'
import { blankWorkerForm, type WorkerForm } from '~/utils/workerForm'

type WorkerView = components['schemas']['WorkerView']
interface WorkerRow { id: string; status: StatusCell; name: string; type: string; host: string; hid: string }

const workers = useWorkers()
const { push } = useToast()
const { data, refresh, pending } = await useAsyncData('workers', () => workers.list())

const search = ref('')
const rows = computed<WorkerRow[]>(() => {
  const list: WorkerRow[] = (data.value ?? []).map(w => ({
    id: w.id,
    status: { label: w.state, kind: workerStateKind(w.state) } as StatusCell,
    name: w.name,
    type: w.type,
    host: w.host ?? w.ip ?? '—',
    hid: `${w.hidHealthCount}/${w.hidTotalCount}`,
  }))
  const q = search.value.trim().toLowerCase()
  return q ? list.filter(r => [r.name, r.type, r.status.label].some(x => String(x).toLowerCase().includes(q))) : list
})

const columns: Column[] = [
  { key: 'status', label: '상태', kind: 'status' },
  { key: 'name', label: '이름', kind: 'text' },
  { key: 'type', label: '유형', kind: 'mono' },
  { key: 'host', label: '호스트', kind: 'muted' },
  { key: 'hid', label: 'HID', kind: 'mono' },
]

// create / edit drawer
const crudOpen = ref(false)
const editingId = ref<string | null>(null)
const form = ref<WorkerForm>(blankWorkerForm())
function openCreate() {
  editingId.value = null
  form.value = blankWorkerForm()
  crudOpen.value = true
}
function openEdit(row: WorkerRow) {
  const w = (data.value ?? []).find(x => x.id === row.id)
  if (!w) return
  editingId.value = w.id
  form.value = { name: w.name, type: w.type, tagsText: (w.tags ?? []).join(', '), shared: w.shared }
  crudOpen.value = true
}
async function save() {
  try {
    if (editingId.value) {
      await workers.update(editingId.value, form.value)
      push('수정되었습니다.')
    } else {
      const res = await workers.create(form.value)
      revealKey(res.apiKey)
    }
    crudOpen.value = false
    await refresh()
  } catch (e: any) {
    push(e?.message ?? '저장에 실패했습니다.')
  }
}
async function remove(row: WorkerRow) {
  try {
    await workers.remove(row.id)
    await refresh()
    push('삭제되었습니다.')
  } catch {
    push('삭제에 실패했습니다.')
  }
}
async function rotate(row: WorkerRow) {
  try {
    const res = await workers.rotateKey(row.id)
    revealKey(res.apiKey)
  } catch {
    push('키 재발급에 실패했습니다.')
  }
}

// one-time API key reveal
const keyOpen = ref(false)
const revealedKey = ref('')
function revealKey(key: string) {
  revealedKey.value = key
  keyOpen.value = true
}
async function copyKey() {
  try {
    await navigator.clipboard.writeText(revealedKey.value)
    push('복사되었습니다.')
  } catch {
    push('복사에 실패했습니다. 키를 직접 선택해 복사하세요.')
  }
}
</script>

<template>
  <section class="panel">
    <WPageHeader title="워커" desc="RPA 워커 호스트" add-label="+ 워커 등록"
      v-model:search="search" @add="openCreate" />
    <WDataTable v-if="rows.length" :columns="columns" :rows="rows">
      <template #actions="{ row }">
        <button class="act act--ghost" @click="rotate(row as WorkerRow)">키 재발급</button>
        <button class="act act--ghost" @click="openEdit(row as WorkerRow)">상세</button>
        <button class="act act--danger" @click="remove(row as WorkerRow)">삭제</button>
      </template>
    </WDataTable>
    <WEmptyState v-else title="워커가 없습니다"
      :message="pending ? '불러오는 중…' : '아래에서 새 워커를 등록하세요.'"
      cta-label="+ 워커 등록" @cta="openCreate" />

    <WDrawer v-model:open="crudOpen" :title="editingId ? '워커 수정' : '워커 등록'" description="워커 정보를 입력한 뒤 저장하세요.">
      <label class="fld"><span>이름 *</span><input v-model="form.name" placeholder="ergate-01" /></label>
      <label class="fld"><span>유형 *</span><input v-model="form.type" placeholder="crawler" /></label>
      <label class="fld"><span>태그 (쉼표 구분)</span><input v-model="form.tagsText" placeholder="seoul, gpu" /></label>
      <label class="fld fld--row"><input type="checkbox" v-model="form.shared" /><span>공유 워커</span></label>
      <template #footer>
        <button class="act act--ghost" @click="crudOpen = false">취소</button>
        <button class="act act--primary" @click="save">저장</button>
      </template>
    </WDrawer>

    <WDrawer v-model:open="keyOpen" title="API 키" description="워커 API 키입니다. 지금 복사해 두세요.">
      <p class="warn">이 키는 지금만 표시되며 다시 확인할 수 없습니다. 안전한 곳에 복사해 두세요.</p>
      <pre class="codeblock">{{ revealedKey }}</pre>
      <template #footer>
        <button class="act act--ghost" @click="keyOpen = false">닫기</button>
        <button class="act act--primary" @click="copyKey">복사</button>
      </template>
    </WDrawer>
  </section>
</template>

<style scoped>
.panel { background: var(--panel); border: 1px solid var(--line); border-radius: 14px; overflow: hidden; box-shadow: var(--rim), var(--elev); }
.act { padding: 5px 11px; border-radius: 8px; font-family: var(--font-sans); font-size: 12px; font-weight: 600; cursor: pointer; white-space: nowrap; }
.act--ghost { background: transparent; border: 1px solid var(--line); color: var(--ink-2); }
.act--danger { background: transparent; border: 1px solid var(--line); color: var(--fail); }
.act--primary { background: var(--run); border: none; color: var(--on-accent); box-shadow: 0 2px 8px var(--run-shadow); }
.fld { display: flex; flex-direction: column; gap: 6px; font-size: 12px; font-weight: 600; color: var(--ink-2); }
.fld input { padding: 10px 12px; border: 1px solid var(--line); border-radius: 9px; font-size: 13px; background: var(--th); color: var(--ink); }
.fld--row { flex-direction: row; align-items: center; }
.warn { margin: 0; font-size: 12px; color: var(--fail); font-weight: 600; }
.codeblock { margin: 0; padding: 10px 12px; border: 1px solid var(--line); border-radius: 9px; background: var(--th); color: var(--ink); font-family: var(--font-mono); font-size: 13px; white-space: pre-wrap; word-break: break-all; }
</style>
