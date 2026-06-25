<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Column } from '~/components/WDataTable.vue'
import type { WorkFileForm } from '~/utils/workFileForm'

const workFiles = useWorkFiles()
const { push } = useToast()
const { data, refresh, pending } = await useAsyncData('workfiles', () => workFiles.list())

const search = ref('')
const rows = computed(() => {
  const list = (data.value ?? []).map(w => ({
    id: w.id, name: w.name, insurer: w.insuranceCompanyCode, dataType: w.dataType ?? '—', fileType: w.fileType ?? '—',
    insureType: w.insureType ?? '—', contentType: w.contentType ?? '—', note: w.note ?? '—', originPath: w.originPath ?? '—',
  }))
  const q = search.value.trim().toLowerCase()
  return q ? list.filter(r => [r.name, r.insurer, r.dataType].some(x => String(x).toLowerCase().includes(q))) : list
})
const columns: Column[] = [
  { key: 'name', label: '파일명', kind: 'text' },
  { key: 'insurer', label: '보험사', kind: 'mono' },
  { key: 'dataType', label: '데이터', kind: 'text' },
  { key: 'fileType', label: '유형', kind: 'text' },
  { key: 'insureType', label: '보종', kind: 'text' },
]
const drawerOpen = ref(false)
const editingId = ref<string | null>(null)
function blank(): WorkFileForm { return { insuranceCompanyCode: '', dataType: '', fileType: '', insureType: '', contentType: '', name: '', note: '', originPath: '' } }
const form = ref<WorkFileForm>(blank())
function openCreate() { editingId.value = null; form.value = blank(); drawerOpen.value = true }
function openEdit(row: any) {
  editingId.value = row.id
  form.value = { insuranceCompanyCode: row.insurer, dataType: row.dataType, fileType: row.fileType, insureType: row.insureType, contentType: row.contentType, name: row.name, note: row.note === '—' ? '' : row.note, originPath: row.originPath === '—' ? '' : row.originPath }
  drawerOpen.value = true
}
async function save() {
  try {
    if (editingId.value) await workFiles.update(editingId.value, form.value)
    else await workFiles.create(form.value)
    drawerOpen.value = false; await refresh(); push(editingId.value ? '수정되었습니다.' : '등록되었습니다.')
  } catch (e: any) { push(e?.message ?? '저장에 실패했습니다.') }
}
async function remove(row: any) {
  try { await workFiles.remove(row.id); await refresh(); push('삭제되었습니다.') }
  catch { push('삭제에 실패했습니다.') }
}
</script>

<template>
  <section class="panel">
    <WPageHeader title="작업 파일" desc="work-file 관리" add-label="+ 작업 파일 등록" v-model:search="search" @add="openCreate" />
    <WDataTable v-if="rows.length" :columns="columns" :rows="rows">
      <template #actions="{ row }">
        <button class="act act--ghost" @click="openEdit(row)">상세</button>
        <button class="act act--danger" @click="remove(row)">삭제</button>
      </template>
    </WDataTable>
    <WEmptyState v-else title="작업 파일이 없습니다" :message="pending ? '불러오는 중…' : '아래에서 새 작업 파일을 등록하세요.'" cta-label="+ 작업 파일 등록" @cta="openCreate" />

    <WDrawer v-model:open="drawerOpen" :title="editingId ? '작업 파일 수정' : '작업 파일 등록'" description="작업 파일 정보를 입력한 뒤 저장하세요.">
      <label class="fld"><span>보험사 코드 *</span><input v-model="form.insuranceCompanyCode" :disabled="!!editingId" placeholder="samsung_property" /></label>
      <label class="fld"><span>이름 *</span><input v-model="form.name" placeholder="계약 전체 목록" /></label>
      <label class="fld"><span>데이터 *</span><input v-model="form.dataType" placeholder="contract" /></label>
      <label class="fld"><span>유형 *</span><input v-model="form.fileType" placeholder="list" /></label>
      <label class="fld"><span>보종 *</span><input v-model="form.insureType" placeholder="all" /></label>
      <label class="fld"><span>컨텐츠 *</span><input v-model="form.contentType" placeholder="a" /></label>
      <label class="fld"><span>비고</span><input v-model="form.note" /></label>
      <template #footer>
        <button class="act act--ghost" @click="drawerOpen = false">취소</button>
        <button class="act act--primary" @click="save">저장</button>
      </template>
    </WDrawer>
  </section>
</template>

<style scoped>
.panel { background: var(--panel); border: 1px solid var(--line); border-radius: 14px; overflow: hidden; box-shadow: var(--rim), var(--elev); }
.act { padding: 5px 11px; border-radius: 8px; font-family: var(--font-sans); font-size: 12px; font-weight: 600; cursor: pointer; white-space: nowrap; }
.act--ghost { background: transparent; border: 1px solid var(--line); color: var(--ink-2); }
.act--danger { background: transparent; border: 1px solid var(--line); color: var(--fail); }
.act--primary { background: var(--run); border: none; color: var(--on-accent); box-shadow: 0 2px 8px rgba(45,125,210,.3); }
.fld { display: flex; flex-direction: column; gap: 6px; font-size: 12px; font-weight: 600; color: var(--ink-2); }
.fld input { padding: 10px 12px; border: 1px solid var(--line); border-radius: 9px; font-size: 13px; background: var(--th); color: var(--ink); }
.fld input:disabled { opacity: .6; }
</style>
