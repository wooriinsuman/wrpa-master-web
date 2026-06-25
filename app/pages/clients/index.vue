<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Column } from '~/components/WDataTable.vue'
import type { StatusCell } from '~/utils/status'
import type { ClientForm } from '~/utils/clientForm'

const clients = useClients()
const { push } = useToast()
const { data, refresh, pending } = await useAsyncData('clients', () => clients.list())

const search = ref('')
const rows = computed(() => {
  const list = (data.value ?? []).map(c => ({
    id: c.id,
    status: { label: c.active ? '활성' : '정지', kind: c.active ? 'done' : 'idle' } as StatusCell,
    name: c.name, code: c.code, leaderName: c.leaderName ?? '—', phone: c.phone ?? '—',
  }))
  const q = search.value.trim().toLowerCase()
  return q ? list.filter(r => [r.name, r.code, r.leaderName].some(x => String(x).toLowerCase().includes(q))) : list
})
const columns: Column[] = [
  { key: 'status', label: '상태', kind: 'status' },
  { key: 'name', label: '거래처명', kind: 'text' },
  { key: 'code', label: '코드', kind: 'mono' },
  { key: 'leaderName', label: '담당자', kind: 'text' },
  { key: 'phone', label: '연락처', kind: 'mono' },
]
const drawerOpen = ref(false)
const form = ref<ClientForm>({ name: '', code: '', phone: '', leaderName: '', businessRegistrationNumber: '' })
function openCreate() { form.value = { name: '', code: '', phone: '', leaderName: '', businessRegistrationNumber: '' }; drawerOpen.value = true }
async function save() {
  try { await clients.create(form.value); drawerOpen.value = false; await refresh(); push('등록되었습니다.') }
  catch (e: any) { push(e?.message ?? '저장에 실패했습니다.') }
}
async function remove(row: any) {
  try { await clients.remove(row.id); await refresh(); push('삭제되었습니다.') }
  catch { push('삭제에 실패했습니다.') }
}
</script>

<template>
  <section class="panel">
    <WPageHeader title="거래처" desc="발주 회사 관리" add-label="+ 거래처 등록" v-model:search="search" @add="openCreate" />
    <WDataTable v-if="rows.length" :columns="columns" :rows="rows">
      <template #actions="{ row }">
        <button class="act act--danger" @click="remove(row)">삭제</button>
      </template>
    </WDataTable>
    <WEmptyState v-else title="거래처가 없습니다" :message="pending ? '불러오는 중…' : '아래에서 새 거래처를 등록하세요.'" cta-label="+ 거래처 등록" @cta="openCreate" />

    <WDrawer v-model:open="drawerOpen" title="거래처 등록" description="거래처 정보를 입력한 뒤 저장하세요.">
      <label class="fld"><span>거래처명 *</span><input v-model="form.name" placeholder="로앤손해사정" /></label>
      <label class="fld"><span>코드 *</span><input v-model="form.code" placeholder="LA-01" /></label>
      <label class="fld"><span>담당자</span><input v-model="form.leaderName" /></label>
      <label class="fld"><span>연락처</span><input v-model="form.phone" /></label>
      <label class="fld"><span>사업자번호</span><input v-model="form.businessRegistrationNumber" /></label>
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
</style>
