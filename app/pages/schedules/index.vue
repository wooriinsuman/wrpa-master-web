<script setup lang="ts">
import { computed, ref } from 'vue'
import type { components } from '#shared/types/api'
import type { Column } from '~/components/WDataTable.vue'
import type { CrudRow } from '~/utils/crud'
import type { StatusCell } from '~/utils/status'
import type { JobForm } from '~/utils/jobForm'
import { fmtDuration } from '~/utils/format'
import { offsetLabel, sortByDataTypeOrder } from '~/utils/category'

type View = components['schemas']['JobView']
interface JobRow extends CrudRow {
  status: StatusCell; insurer: string; company: string; account: string; offset: string; dataType: string; files: string[]; runTime: string; timeout: string; priority: string
}

const jobs = useJobs()
const { push } = useToast()

// 이름 매핑·선택자용 참조 목록.
const { data: clientsData } = await useAsyncData('schedules-clients', () => useClients().list())
const { data: accountsData } = await useAsyncData('schedules-accounts', () => useAccounts().list())
const { data: insurersData } = await useAsyncData('schedules-insurers', () => useInsurers().list())
const { data: workFilesData } = await useAsyncData('schedules-workfiles', () => useWorkFiles().list())
const { data: dataTypesData } = await useAsyncData('schedules-datatypes', () => useDataTypes().list())
const clients = computed(() => clientsData.value ?? [])
const accounts = computed(() => accountsData.value ?? [])
const insurers = computed(() => insurersData.value ?? [])
const workFiles = computed(() => workFilesData.value ?? [])
const dataTypeList = computed(() => dataTypesData.value ?? [])

const clientName = computed(() => new Map(clients.value.map(c => [c.id, c.name])))
const accountName = computed(() => new Map(accounts.value.map(a => [a.id, a.name])))
const insurerName = computed(() => new Map(insurers.value.map(i => [i.code, i.name])))
const workFile = computed(() => new Map(workFiles.value.map(w => [w.id, w])))
const dataTypeName = computed(() => new Map(dataTypeList.value.map(d => [d.code, d.name])))

// 완성된 테이블 관례: 식별 정보 먼저, 상태 배지는 마지막.
const columns: Column[] = [
  { key: 'insurer', label: '보험사', kind: 'text' },
  { key: 'company', label: '회사', kind: 'text' },
  { key: 'account', label: '계정', kind: 'text' },
  { key: 'offset', label: '업적월', kind: 'text' },
  { key: 'dataType', label: '데이터 타입', kind: 'text' },
  { key: 'files', label: '작업 파일', kind: 'tags', weight: 3 },
  { key: 'runTime', label: '실행시각', kind: 'mono' },
  { key: 'timeout', label: '타임아웃', kind: 'mono' },
  { key: 'priority', label: '우선순위', kind: 'mono' },
  { key: 'status', label: '상태', kind: 'status' },
]

function toRow(j: View): JobRow {
  const wfs = (j.workFileIds ?? []).map(id => workFile.value.get(id))
  const files = wfs.map((w, i) => w?.name ?? j.workFileIds![i]!)
  // 데이터 타입은 job에 없어 작업파일에서 유도(보통 1개, 레거시 혼합이면 나열).
  const dtCodes = [...new Set(wfs.map(w => w?.dataType).filter(Boolean) as string[])]
  return {
    id: j.id,
    status: { label: j.locked ? '잠금' : '활성', kind: j.locked ? 'idle' : 'done' } as StatusCell,
    insurer: insurerName.value.get(j.insuranceCompanyCode) ?? j.insuranceCompanyCode,
    company: clientName.value.get(j.companyId) ?? j.companyId,
    account: accountName.value.get(j.accountId) ?? j.accountId,
    offset: offsetLabel(j.closingMonthOffset),
    dataType: dtCodes.length ? dtCodes.map(c => dataTypeName.value.get(c) ?? c).join(', ') : '—',
    files,
    runTime: j.runTime ?? '—',
    timeout: fmtDuration(j.timeoutSec),
    priority: String(j.priority),
  }
}

function toForm(j: View): JobForm {
  return {
    companyId: j.companyId,
    accountId: j.accountId,
    workFileIds: [...(j.workFileIds ?? [])],
    startDay: String(j.startDay),
    endDay: j.endDay == null ? '' : String(j.endDay),
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
    companyId: '', accountId: '', workFileIds: [], startDay: '1', endDay: '', runTime: '09:00', priority: '0',
    // 영업일 시작/종료 기준은 기본 켬.
    timeoutSec: '300', closingMonthOffset: '0', startBusinessDay: true, endBusinessDay: true,
    excludeWeekendHoliday: false, locked: false, note: '',
  }
}

const crud = await useCrudPage<View, JobForm, JobRow>({
  key: 'jobs',
  resource: jobs,
  blank,
  toRow,
  toForm,
  searchKeys: ['insurer', 'company', 'account', 'dataType', 'files'],
})
const { rows, search, pending, drawerOpen, editingId, form, save, remove } = crud

// 구성: 회사 → 계정(회사 종속) → 업적월(숫자) + 데이터타입(계정 보험사 기준) → 작업파일.
// selectedDataType는 파일을 좁히기 위한 UI 임시 상태(Job에는 저장되지 않고, 파일의 dataType로 표현됨).
const selectedDataType = ref('')
const accountsForCompany = computed(() => accounts.value.filter(a => a.companyId === form.value.companyId))
const selectedInsurerCode = computed(() => accounts.value.find(a => a.id === form.value.accountId)?.insuranceCompanyCode ?? '')
// 계정 보험사에 작업파일이 실제로 있는 데이터타입만 선택지로 노출.
const availableDataTypes = computed(() => {
  const codes = new Set(
    workFiles.value.filter(w => w.insuranceCompanyCode === selectedInsurerCode.value).map(w => w.dataType).filter(Boolean),
  )
  return sortByDataTypeOrder(dataTypeList.value.filter(d => codes.has(d.code)))
})
const availableWorkFiles = computed(() =>
  selectedDataType.value
    ? workFiles.value.filter(w => w.insuranceCompanyCode === selectedInsurerCode.value && w.dataType === selectedDataType.value)
    : [],
)

// @change는 사용자 조작 시에만 발생 → 수정 진입(프로그램적 폼 로드) 때는 하위 선택이 유지된다.
function onCompanyChange() { form.value.accountId = ''; selectedDataType.value = ''; form.value.workFileIds = [] }
function onAccountChange() { selectedDataType.value = ''; form.value.workFileIds = [] }
function onDataTypeChange() { form.value.workFileIds = [] }
function toggleWorkFile(id: string) {
  const arr = form.value.workFileIds
  form.value.workFileIds = arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id]
}

// 등록/수정 진입 시 selectedDataType 초기화·복원(수정은 기존 파일의 dataType에서 유도).
function openCreate() { selectedDataType.value = ''; crud.openCreate() }
function openEdit(row: JobRow) {
  crud.openEdit(row)
  const first = form.value.workFileIds[0]
  selectedDataType.value = workFiles.value.find(w => w.id === first)?.dataType ?? ''
}

// 초 입력값을 분·초로 환산해 옆에 보조 표기(초 단위 감 잡기 어려워서).
const timeoutHint = computed(() => fmtDuration(Number(form.value.timeoutSec)))

async function runNow(row: JobRow) {
  try {
    const r = await jobs.run(row.id)
    push(`실행되었습니다 · ${r.workId}`, 'success')
  } catch {
    push('실행에 실패했습니다.', 'error')
  }
}

// --- 다음날 수동 재생성 (17시 자동생성과 별개, 파괴적 → 확인 게이트) ---
const confirmRegenOpen = ref(false)
async function confirmRegen() {
  try {
    const r = await jobs.regenerate()
    push(`${r.date} 재생성 완료 — 대기분 ${r.deleted}건 정리 후 재생성`, 'success')
  } catch (e: any) {
    push(e?.data?.message ?? e?.message ?? '재생성에 실패했습니다.', 'error')
  }
}
</script>

<template>
  <WCrudPage
    title="작업 일정"
    desc="등록된 일정은 매일 17:00에 다음날 작업으로 자동 생성됩니다 — 생성된 큐는 '작업 큐'에서 확인/조정"
    add-label="+ 일정 등록"
    empty-title="작업 일정이 없습니다"
    :drawer-title="editingId ? '일정 수정' : '일정 등록'"
    drawer-description="회사·계정·작업 파일을 선택한 뒤 저장하세요."
    :columns="columns"
    :rows="rows"
    :pending="pending"
    editable
    :actions-width="208"
    v-model:search="search"
    v-model:drawer-open="drawerOpen"
    @add="openCreate"
    @edit="openEdit"
    @save="save"
    @remove="remove"
  >
    <template #header-actions>
      <button class="act act--ghost" @click="confirmRegenOpen = true">다음날 재생성</button>
      <WConfirm v-model:open="confirmRegenOpen" title="다음날 재생성" confirm-label="재생성"
        message="내일 자동 생성분(대기 중)을 모두 지우고 작업 일정에서 다시 생성합니다. 실행 중·완료된 작업은 유지됩니다." @confirm="confirmRegen" />
    </template>
    <template #row-actions-lead="{ row }">
      <button class="act act--primary" @click="runNow(row)">지금실행</button>
    </template>
    <template #fields>
      <label class="fld"><span>회사 <span class="req">*</span></span>
        <select v-model="form.companyId" :disabled="!!editingId" @change="onCompanyChange">
          <option value="" disabled>— 회사 선택 —</option>
          <option v-for="c in clients" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
      </label>
      <label class="fld"><span>계정 <span class="req">*</span></span>
        <select v-model="form.accountId" :disabled="!!editingId || !form.companyId" @change="onAccountChange">
          <option value="" disabled>{{ form.companyId ? '— 계정 선택 —' : '회사를 먼저 선택' }}</option>
          <option v-for="a in accountsForCompany" :key="a.id" :value="a.id">{{ a.name }}</option>
        </select>
      </label>
      <label class="fld"><span>업적월 <span class="req">*</span></span>
        <div class="to-row">
          <input type="number" v-model="form.closingMonthOffset" class="to-input" />
          <span class="to-hint">{{ offsetLabel(Number(form.closingMonthOffset) || 0) }}</span>
        </div>
      </label>
      <label class="fld"><span>데이터 타입 <span class="req">*</span></span>
        <select v-model="selectedDataType" :disabled="!form.accountId" @change="onDataTypeChange">
          <option value="" disabled>{{ form.accountId ? '— 데이터 타입 선택 —' : '계정을 먼저 선택' }}</option>
          <option v-for="d in availableDataTypes" :key="d.code" :value="d.code">{{ d.name }}</option>
        </select>
      </label>
      <div class="fld"><span>작업 파일 <span class="req">*</span> <small class="hint">보험사·데이터타입 기준</small></span>
        <div v-if="!selectedDataType" class="chips-empty">데이터 타입을 먼저 선택하세요</div>
        <div v-else-if="!availableWorkFiles.length" class="chips-empty">해당 조건의 작업 파일이 없습니다</div>
        <div v-else class="chips">
          <button v-for="w in availableWorkFiles" :key="w.id" type="button" class="chip"
            :class="{ 'chip--on': form.workFileIds.includes(w.id) }" @click="toggleWorkFile(w.id)">{{ w.name }}</button>
        </div>
      </div>
      <label class="fld"><span>실행시각</span><input v-model="form.runTime" placeholder="09:00" /></label>
      <label class="fld"><span>시작일</span><input v-model="form.startDay" inputmode="numeric" /></label>
      <label class="fld"><span>종료일 <small class="hint">비우면 시작일만</small></span><input v-model="form.endDay" inputmode="numeric" placeholder="끝까지" /></label>
      <label class="fld"><span>우선순위</span><input v-model="form.priority" inputmode="numeric" /></label>
      <label class="fld"><span>타임아웃(초)</span>
        <div class="to-row">
          <input v-model="form.timeoutSec" inputmode="numeric" class="to-input" />
          <span class="to-hint">{{ timeoutHint }}</span>
        </div>
      </label>
      <label class="fld fld--row"><input type="checkbox" v-model="form.locked" /><span>잠금</span></label>
      <label class="fld fld--row"><input type="checkbox" v-model="form.excludeWeekendHoliday" /><span>주말·공휴일 제외</span></label>
      <label class="fld fld--row"><input type="checkbox" v-model="form.startBusinessDay" /><span>영업일 시작 기준</span></label>
      <label class="fld fld--row"><input type="checkbox" v-model="form.endBusinessDay" /><span>영업일 종료 기준</span></label>
      <label class="fld"><span>비고</span><textarea v-model="form.note" rows="3" placeholder="메모"></textarea></label>
    </template>
  </WCrudPage>
</template>

<style scoped>
/* .fld / .act come from the global DS (assets/css/components.css). */
.hint { font-weight: 400; color: var(--ink-2); font-size: 11px; margin-left: 6px; }
.to-row { display: flex; align-items: center; gap: 10px; }
.to-input { flex: 1; min-width: 0; }
.to-hint { flex: none; font-family: var(--font-mono); font-size: 12px; color: var(--ink-2); white-space: nowrap; }
.chips { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 6px; }
.chips-empty { font-size: 12px; color: var(--ink-2); padding: 4px 0; }
.chip { display: flex; align-items: center; justify-content: center; min-width: 0; padding: 6px 11px; border-radius: 999px; border: 1px solid var(--line); background: var(--panel); color: var(--ink-2); font-size: 12.5px; cursor: pointer; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; transition: all .12s ease; }
.chip:hover { border-color: var(--run); color: var(--ink); }
.chip--on { background: var(--nav-active); border-color: var(--run); color: var(--run); font-weight: 600; }
</style>
