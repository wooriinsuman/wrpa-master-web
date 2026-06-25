<script setup lang="ts">
import type { components } from '#shared/types/api'
import type { Column } from '~/components/WDataTable.vue'
import type { CrudRow } from '~/utils/crud'
import type { StatusCell } from '~/utils/status'
import { joinIds, type JobForm } from '~/utils/jobForm'

type View = components['schemas']['JobView']
interface JobRow extends CrudRow { status: StatusCell; insurer: string; company: string; account: string; runTime: string; priority: string }

const jobs = useJobs()
const { push } = useToast()

const columns: Column[] = [
  { key: 'status', label: '상태', kind: 'status' },
  { key: 'insurer', label: '보험사', kind: 'mono' },
  { key: 'company', label: '거래처', kind: 'mono' },
  { key: 'account', label: '계정', kind: 'mono' },
  { key: 'runTime', label: '실행시각', kind: 'mono' },
  { key: 'priority', label: '우선순위', kind: 'mono' },
]

function toRow(j: View): JobRow {
  return {
    id: j.id,
    status: { label: j.locked ? '잠금' : '활성', kind: j.locked ? 'idle' : 'done' } as StatusCell,
    insurer: j.insuranceCompanyCode,
    company: j.companyId,
    account: j.accountId,
    runTime: j.runTime ?? '—',
    priority: String(j.priority),
  }
}

function toForm(j: View): JobForm {
  return {
    companyId: j.companyId,
    accountId: j.accountId,
    workFileIdsText: joinIds(j.workFileIds ?? []),
    startDay: String(j.startDay),
    runTime: j.runTime ?? '',
    priority: String(j.priority),
    timeoutSec: String(j.timeoutSec),
    closingMonthOffset: String(j.closingMonthOffset),
    startBusinessDay: !!j.startBusinessDay,
    endBusinessDay: !!j.endBusinessDay,
    excludeWeekendHoliday: !!j.excludeWeekendHoliday,
    locked: j.locked,
    note: j.note ?? '',
  }
}

function blank(): JobForm {
  return {
    companyId: '', accountId: '', workFileIdsText: '', startDay: '1', runTime: '09:00', priority: '0',
    timeoutSec: '300', closingMonthOffset: '0', startBusinessDay: false, endBusinessDay: false,
    excludeWeekendHoliday: false, locked: false, note: '',
  }
}

const { rows, search, pending, drawerOpen, editingId, form, openCreate, openEdit, save, remove } = await useCrudPage<View, JobForm, JobRow>({
  key: 'jobs',
  resource: jobs,
  blank,
  toRow,
  toForm,
  searchKeys: ['insurer', 'company', 'account'],
})

async function runNow(row: JobRow) {
  try {
    const r = await jobs.run(row.id)
    push(`실행되었습니다 · ${r.workId}`)
  } catch {
    push('실행에 실패했습니다.')
  }
}
</script>

<template>
  <WCrudPage
    title="작업 일정"
    desc="예약 job 관리"
    add-label="+ 일정 등록"
    empty-title="작업 일정이 없습니다"
    :drawer-title="editingId ? '일정 수정' : '일정 등록'"
    drawer-description="작업 일정 정보를 입력한 뒤 저장하세요."
    :columns="columns"
    :rows="rows"
    :pending="pending"
    editable
    v-model:search="search"
    v-model:drawer-open="drawerOpen"
    @add="openCreate"
    @edit="openEdit"
    @save="save"
    @remove="remove"
  >
    <template #row-actions-lead="{ row }">
      <button class="act act--primary" @click="runNow(row)">지금실행</button>
    </template>
    <template #fields>
      <label class="fld"><span>거래처 ID *</span><input v-model="form.companyId" :disabled="!!editingId" /></label>
      <label class="fld"><span>계정 ID *</span><input v-model="form.accountId" :disabled="!!editingId" /></label>
      <label class="fld"><span>작업 파일 IDs * (쉼표 구분)</span><input v-model="form.workFileIdsText" placeholder="wf1, wf2" /></label>
      <label class="fld"><span>실행시각</span><input v-model="form.runTime" placeholder="09:00" /></label>
      <label class="fld"><span>시작일</span><input v-model="form.startDay" inputmode="numeric" /></label>
      <label class="fld"><span>우선순위</span><input v-model="form.priority" inputmode="numeric" /></label>
      <label class="fld"><span>타임아웃(초)</span><input v-model="form.timeoutSec" inputmode="numeric" /></label>
      <label class="fld fld--row"><input type="checkbox" v-model="form.locked" /><span>잠금</span></label>
      <label class="fld fld--row"><input type="checkbox" v-model="form.excludeWeekendHoliday" /><span>주말·공휴일 제외</span></label>
      <label class="fld fld--row"><input type="checkbox" v-model="form.startBusinessDay" /><span>영업일 시작 기준</span></label>
      <label class="fld fld--row"><input type="checkbox" v-model="form.endBusinessDay" /><span>영업일 종료 기준</span></label>
      <label class="fld"><span>비고</span><input v-model="form.note" /></label>
    </template>
  </WCrudPage>
</template>
