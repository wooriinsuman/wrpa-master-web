<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Column } from '~/components/WDataTable.vue'
import type { StatusCell } from '~/utils/status'
import { joinIds, type JobForm } from '~/utils/jobForm'

const jobs = useJobs()
const { push } = useToast()
const { data, refresh, pending } = await useAsyncData('jobs', () => jobs.list())

const search = ref('')
const rows = computed(() => {
  const list = (data.value ?? []).map(j => ({
    id: j.id,
    status: { label: j.locked ? '잠금' : '활성', kind: j.locked ? 'idle' : 'done' } as StatusCell,
    insurer: j.insuranceCompanyCode, company: j.companyId, account: j.accountId,
    runTime: j.runTime ?? '—', priority: String(j.priority),
  }))
  const q = search.value.trim().toLowerCase()
  return q ? list.filter(r => [r.insurer, r.company, r.account].some(x => String(x).toLowerCase().includes(q))) : list
})
const columns: Column[] = [
  { key: 'status', label: '상태', kind: 'status' },
  { key: 'insurer', label: '보험사', kind: 'mono' },
  { key: 'company', label: '거래처', kind: 'mono' },
  { key: 'account', label: '계정', kind: 'mono' },
  { key: 'runTime', label: '실행시각', kind: 'mono' },
  { key: 'priority', label: '우선순위', kind: 'mono' },
]
const drawerOpen = ref(false)
const editingId = ref<string | null>(null)
function blank(): JobForm {
  return { companyId: '', accountId: '', workFileIdsText: '', startDay: '1', runTime: '09:00', priority: '0', timeoutSec: '300', closingMonthOffset: '0', startBusinessDay: false, endBusinessDay: false, excludeWeekendHoliday: false, locked: false, note: '' }
}
const form = ref<JobForm>(blank())
function openCreate() { editingId.value = null; form.value = blank(); drawerOpen.value = true }
function openEdit(id: string) {
  const j = (data.value ?? []).find(x => x.id === id); if (!j) return
  editingId.value = id
  form.value = {
    companyId: j.companyId, accountId: j.accountId, workFileIdsText: joinIds(j.workFileIds ?? []),
    startDay: String(j.startDay), runTime: j.runTime ?? '', priority: String(j.priority), timeoutSec: String(j.timeoutSec), closingMonthOffset: String(j.closingMonthOffset),
    startBusinessDay: !!j.startBusinessDay, endBusinessDay: !!j.endBusinessDay, excludeWeekendHoliday: !!j.excludeWeekendHoliday, locked: j.locked, note: j.note ?? '',
  }
  drawerOpen.value = true
}
async function save() {
  try {
    if (editingId.value) await jobs.update(editingId.value, form.value)
    else await jobs.create(form.value)
    drawerOpen.value = false; await refresh(); push(editingId.value ? '수정되었습니다.' : '등록되었습니다.')
  } catch (e: any) { push(e?.message ?? '저장에 실패했습니다.') }
}
async function remove(row: Record<string, any>) {
  try { await jobs.remove(row.id); await refresh(); push('삭제되었습니다.') }
  catch { push('삭제에 실패했습니다.') }
}
async function runNow(row: Record<string, any>) {
  try { const r = await jobs.run(row.id); push(`실행되었습니다 · ${r.workId}`) }
  catch { push('실행에 실패했습니다.') }
}
</script>

<template>
  <section class="panel">
    <WPageHeader title="작업 일정" desc="예약 job 관리" add-label="+ 일정 등록" v-model:search="search" @add="openCreate" />
    <WDataTable v-if="rows.length" :columns="columns" :rows="rows">
      <template #actions="{ row }">
        <button class="act act--primary" @click="runNow(row)">지금실행</button>
        <button class="act act--ghost" @click="openEdit(row.id)">상세</button>
        <button class="act act--danger" @click="remove(row)">삭제</button>
      </template>
    </WDataTable>
    <WEmptyState v-else title="작업 일정이 없습니다" :message="pending ? '불러오는 중…' : '아래에서 새 일정을 등록하세요.'" cta-label="+ 일정 등록" @cta="openCreate" />

    <WDrawer v-model:open="drawerOpen" :title="editingId ? '일정 수정' : '일정 등록'" description="작업 일정 정보를 입력한 뒤 저장하세요.">
      <label class="fld"><span>거래처 ID *</span><input v-model="form.companyId" :disabled="!!editingId" /></label>
      <label class="fld"><span>계정 ID *</span><input v-model="form.accountId" :disabled="!!editingId" /></label>
      <label class="fld"><span>작업 파일 IDs * (쉼표 구분)</span><input v-model="form.workFileIdsText" placeholder="wf1, wf2" /></label>
      <label class="fld"><span>실행시각</span><input v-model="form.runTime" placeholder="09:00" /></label>
      <label class="fld"><span>시작일</span><input v-model="form.startDay" inputmode="numeric" /></label>
      <label class="fld"><span>우선순위</span><input v-model="form.priority" inputmode="numeric" /></label>
      <label class="fld"><span>타임아웃(초)</span><input v-model="form.timeoutSec" inputmode="numeric" /></label>
      <label class="fld fld--row"><input type="checkbox" v-model="form.locked" /><span>잠금</span></label>
      <label class="fld fld--row"><input type="checkbox" v-model="form.excludeWeekendHoliday" /><span>주말·공휴일 제외</span></label>
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
.fld--row { flex-direction: row; align-items: center; }
</style>
