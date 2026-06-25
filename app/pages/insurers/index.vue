<!-- app/pages/insurers/index.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import type { components } from '#shared/types/api'
import type { Column } from '~/components/WDataTable.vue'
import type { InsurerForm } from '~/utils/insurerForm'
type View = components['schemas']['InsuranceCompanyView']

const insurers = useInsurers()
const { push } = useToast()
const { data, refresh, pending } = await useAsyncData('insurers', () => insurers.list())

const search = ref('')
const rows = computed(() => {
  const list = (data.value ?? []).map(v => ({
    id: v.id, status: v.active ? '활성' : '정지', name: v.name, code: v.code,
    type: v.type, url: v.url,
  }))
  const q = search.value.trim().toLowerCase()
  return q ? list.filter(r => [r.name, r.code, r.url].some(x => String(x).toLowerCase().includes(q))) : list
})

const columns: Column[] = [
  { key: 'status', label: '상태', kind: 'status' },
  { key: 'name', label: '보험사명', kind: 'text' },
  { key: 'code', label: '코드', kind: 'mono' },
  { key: 'type', label: '구분', kind: 'text' },
  { key: 'url', label: 'URL', kind: 'muted' },
]

const drawerOpen = ref(false)
const editingId = ref<string | null>(null)
const form = ref<InsurerForm>({ code: '', name: '', type: 'PROPERTY', url: '', active: true })

function openCreate() {
  editingId.value = null
  form.value = { code: '', name: '', type: 'PROPERTY', url: '', active: true }
  drawerOpen.value = true
}
function openEdit(row: any) {
  editingId.value = row.id
  form.value = { code: row.code, name: row.name, type: row.type, url: row.url, active: row.status === '활성' }
  drawerOpen.value = true
}
async function save() {
  try {
    if (editingId.value) await insurers.update(editingId.value, form.value)
    else await insurers.create(form.value)
    drawerOpen.value = false
    await refresh()
    push(editingId.value ? '수정되었습니다.' : '등록되었습니다.')
  } catch (e: any) { push(e?.message ?? '저장에 실패했습니다.') }
}
async function remove(row: any) {
  try { await insurers.remove(row.id); await refresh(); push('삭제되었습니다.') }
  catch { push('삭제에 실패했습니다.') }
}
</script>

<template>
  <section class="panel">
    <WPageHeader title="보험사" desc="자동화 대상 보험사" add-label="+ 보험사 등록"
      v-model:search="search" @add="openCreate" />
    <WDataTable v-if="rows.length" :columns="columns" :rows="rows">
      <template #actions="{ row }">
        <button class="act act--ghost" @click="openEdit(row)">상세</button>
        <button class="act act--danger" @click="remove(row)">삭제</button>
      </template>
    </WDataTable>
    <WEmptyState v-else title="보험사가 없습니다"
      :message="pending ? '불러오는 중…' : '아래에서 새 보험사를 등록하세요.'"
      cta-label="+ 보험사 등록" @cta="openCreate" />

    <WDrawer v-model:open="drawerOpen" :title="editingId ? '보험사 수정' : '보험사 등록'" description="보험사 정보를 입력한 뒤 저장하세요.">
      <label class="fld"><span>코드 *</span><input v-model="form.code" placeholder="samsung_property" /></label>
      <label class="fld"><span>보험사명 *</span><input v-model="form.name" placeholder="삼성화재" /></label>
      <label class="fld"><span>구분</span>
        <select v-model="form.type"><option>LIFE</option><option>PROPERTY</option><option>GUARANTEE</option><option>UNKNOWN</option></select>
      </label>
      <label class="fld"><span>URL</span><input v-model="form.url" placeholder="https://" /></label>
      <label class="fld fld--row"><input type="checkbox" v-model="form.active" /><span>활성</span></label>
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
.fld input, .fld select { padding: 10px 12px; border: 1px solid var(--line); border-radius: 9px; font-size: 13px; background: var(--th); color: var(--ink); }
.fld--row { flex-direction: row; align-items: center; }
</style>
