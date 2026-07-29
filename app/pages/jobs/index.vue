<script setup lang="ts">
import { computed, ref } from 'vue'
import type { components } from '#shared/types/api'
import type { Column } from '~/components/WDataTable.vue'
import { WORK_LIST_LIMIT, type WorkListParams, type WorkSummaryParams } from '~/composables/useWorks'
import { isStatusCell, type StatusCell } from '~/utils/status'
import { workStateKind } from '~/utils/dashboardState'
import { waitReasonCell } from '~/utils/waitReason'
import { categoryLabel } from '~/utils/category'
import { shortId } from '~/utils/idLabel'
import { blankWorkForm, type WorkForm } from '~/utils/workForm'
import { extractApiError } from '~/utils/apiError'

type WorkView = components['schemas']['WorkView']

interface WorkRow {
  id: string
  status: StatusCell
  waitReason: StatusCell | string
  company: string
  // 표시용 이름(못 찾으면 줄인 id)과, 툴팁으로 내보낼 원본 id를 분리해 둔다.
  account: string
  accountId: string
  category: string
  closingMonth: string
  runTime: string
  tasks: string
  priority: number
  // pending이면 자격 워커 후보 수(0이면 사고 배지), 아니면 배정된 워커 이름.
  worker: StatusCell | string
  workerId: string
  retried: number
  createType: string
  _src: WorkView
}

const works = useWorks()
const workers = useWorkers()
const accounts = useAccounts()
const insurers = useInsurers()
const dataTypes = useDataTypes()
const { push } = useToast()
// 이 화면은 USER까지 열려 있다(GET /works는 회사 스코프로 걸러진다). 하지만
// enqueue(POST /works)·priority·cancel은 RankSystem 전용이고, GET /workers도
// RankSystem 전용이다 — 워커 목록은 아예 조회하지 않는다(USER는 403).
const authStore = useAuthStore()

// 로컬(운영자 = KST) 기준 오늘. toISOString()은 UTC라 09:00 이전에는 어제를
// 가리킨다 — "오늘 작업"이 화면의 전제이므로 로컬 날짜로 만든다.
function today(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

const date = ref(today())
const state = ref('')
const createType = ref('')
const company = ref('')
const workerId = ref('')
const search = ref('')

const params = computed<WorkListParams>(() => ({
  date: date.value,
  state: state.value,
  createType: createType.value,
  company: company.value,
  workerId: workerId.value,
}))

const { data, pending, refresh } = await useAsyncData(
  'works', () => works.list({ ...params.value, size: WORK_LIST_LIMIT }), { watch: [params] },
)
// 상한에 정확히 닿았다 = 더 있을 수 있다. 요약은 페이징 없이 그날 전량을 세므로,
// 알리지 않으면 "대기 480"이라 써 놓고 표에는 1000행만 그리는 화면이 된다.
const truncated = computed(() => (data.value?.length ?? 0) >= WORK_LIST_LIMIT)
// 요약은 상태 분포 자체라 state를 아예 받지 않는다(WorkSummaryParams가 타입으로
// 막는다) — 나머지 필터만 그대로 넘긴다.
const summaryParams = computed<WorkSummaryParams>(() => ({
  date: date.value,
  createType: createType.value,
  company: company.value,
  workerId: workerId.value,
}))
const { data: sum, refresh: refreshSummary } = await useAsyncData(
  'works-summary', () => works.summary(summaryParams.value), { watch: [summaryParams] },
)
const { data: workerList } = await useAsyncData(
  'works-workers', () => authStore.isSystem ? workers.list() : Promise.resolve([]),
)
// 계정 목록은 회사 스코프 읽기 권한 묶음에 있어 USER도 조회할 수 있다 —
// 표의 '계정' 칸을 uuid가 아니라 이름으로 그리는 유일한 수단이다(백엔드는
// accountName을 pending 행에만 채워 준다).
const { data: accountList } = await useAsyncData('works-accounts', () => accounts.list())
const { data: insurerList } = await useAsyncData('works-insurers', () => insurers.list())
const { data: dtData } = await useAsyncData('works-datatypes', () => dataTypes.list())

const dataTypeNames = computed<Record<string, string>>(() =>
  Object.fromEntries((dtData.value ?? []).map(d => [d.code, d.name])))
// id → 이름. 이름이 빈 레코드는 아예 담지 않는다 — 빈 문자열을 "이름"으로
// 취급하면 없는 이름을 찾은 척하게 된다.
function nameMap(list: { id: string; name?: string }[] | null): Record<string, string> {
  return Object.fromEntries(list?.filter(x => x.name).map(x => [x.id, x.name!]) ?? [])
}
const accountNames = computed(() => nameMap(accountList.value ?? null))
// GET /workers는 SYSTEM 전용이라 그 미만에게는 이 맵이 항상 비어 있다 — 워커
// 칸은 줄인 id로 떨어진다(아래 workerLabel).
const workerNames = computed(() => nameMap(workerList.value ?? null))

async function refreshAll() {
  await Promise.all([refresh(), refreshSummary()])
}

const summaryItems = computed<string[]>(() => {
  const s = sum.value
  if (!s) return []
  return [
    `대기 ${s.pending}`, `실행 ${s.started}`, `성공 ${s.done}`,
    `실패 ${s.failed}`, `취소 ${s.cancel}`, `영업일 ${s.businessDay}일차`,
  ]
})

const STATE_LABEL: Record<string, string> = {
  pending: '대기', started: '실행중', done: '성공', failed: '실패', cancel: '취소',
}
const CREATE_TYPE_LABEL: Record<string, string> = {
  Scheduled: '예약', Manual: '수동', Immediately: '즉시',
}

// 워커 칸의 두 얼굴: 대기 행은 "지금 이걸 가져갈 수 있는 워커 수", 그 외는 실제
// 배정 워커. 후보 0은 영원히 실행되지 않는다는 뜻이라 숫자가 아니라 사고로 알린다.
function workerCell(w: WorkView): StatusCell | string {
  if (w.state !== 'pending') return workerLabel(w.workerId)
  const n = w.eligibleWorkerCount ?? 0
  return n === 0 ? { label: '자격 워커 없음', kind: 'fail' } : `후보 ${n}`
}

// 워커 이름 → 없으면 줄인 id. 지어낸 이름은 절대 쓰지 않는다: 목록을 못 읽는
// USER/ADMIN에게는 "test-worker-001"이 아니라 "e60aa178…"이 보이고, 전체 값은
// 셀의 title에 남는다.
function workerLabel(id: string | undefined): string {
  if (!id) return '—'
  return workerNames.value[id] ?? shortId(id)
}

// 계정 칸: 목록에서 찾은 이름 → 백엔드가 준 accountName(pending 행에만 채워진다)
// → 줄인 id 순. 운영자에게 36자 uuid가 기본 화면이 되는 일은 없어야 한다.
function accountLabel(w: WorkView): string {
  const id = w.accountId
  if (!id) return w.accountName || '—'
  return accountNames.value[id] ?? (w.accountName || shortId(id))
}

const rows = computed<WorkRow[]>(() => {
  const list: WorkRow[] = (data.value ?? []).map(w => ({
    id: w.id,
    status: { label: STATE_LABEL[w.state] ?? w.state, kind: workStateKind(w.state) },
    waitReason: waitReasonCell(w.waitReason, w.state) ?? '—',
    company: w.company,
    account: accountLabel(w),
    accountId: w.accountId ?? '',
    category: w.category ? categoryLabel(w.category, dataTypeNames.value) : '—',
    closingMonth: w.closingMonth || '—',
    runTime: w.workTime || '—',
    tasks: (w.tasks ?? []).join(', ') || '—',
    priority: w.priority ?? 0,
    worker: workerCell(w),
    workerId: w.workerId ?? '',
    retried: w.retriedCount ?? 0,
    createType: CREATE_TYPE_LABEL[w.createType ?? ''] ?? (w.createType || '—'),
    _src: w,
  }))
  const q = search.value.trim().toLowerCase()
  if (!q) return list
  return list.filter(r => [r.company, r.account, r.tasks, r.category, r.status.label]
    .some(x => String(x).toLowerCase().includes(q)))
})

// 날짜는 항상 있으니 필터로 세지 않는다. 나머지 조건이 하나라도 걸려 있으면
// 0건은 "선생성이 안 됐다"가 아니라 "조건에 맞는 게 없다"는 뜻이다 — 지정 문구를
// 그대로 쓰면 운영자가 선생성 실패로 오독해 불필요한 재생성을 시도한다.
const narrowed = computed(() =>
  !!(search.value.trim() || state.value || createType.value || company.value || workerId.value))

// 서버가 준 순서가 곧 claim 소진 순서(priority DESC, seq)다 — 헤더 클릭 정렬로
// 흐트러지면 "이 순서대로 소진된다"는 화면의 의미 자체가 사라진다.
const columns: Column[] = [
  { key: 'status', label: '상태', kind: 'status', sortable: false },
  { key: 'waitReason', label: '대기사유', kind: 'status', sortable: false },
  { key: 'company', label: '보험사', kind: 'mono', sortable: false },
  { key: 'account', label: '계정', kind: 'text', sortable: false },
  { key: 'category', label: '카테고리', kind: 'text', sortable: false },
  { key: 'closingMonth', label: '업적월', kind: 'mono', sortable: false },
  { key: 'runTime', label: '실행시각', kind: 'mono', sortable: false },
  { key: 'tasks', label: 'tasks', kind: 'text', sortable: false },
  { key: 'priority', label: '우선순위', kind: 'mono', sortable: false },
  { key: 'worker', label: '워커', kind: 'mono', sortable: false },
  { key: 'retried', label: '시도', kind: 'mono', sortable: false },
  { key: 'createType', label: '생성', kind: 'muted', sortable: false },
]

// priority 인라인 수정: pending만 (백엔드가 409로 방어하지만 UI에서도 막는다)
const editing = ref<Record<string, number>>({})
function priorityDraft(w: WorkView): number {
  return editing.value[w.id] !== undefined ? editing.value[w.id]! : (w.priority ?? 0)
}
function onPriorityInput(w: WorkView, ev: Event) {
  editing.value[w.id] = Number((ev.target as HTMLInputElement).value)
}
async function savePriority(w: WorkView) {
  const p = editing.value[w.id]
  if (p === undefined || p === w.priority) return
  try {
    await works.setPriority(w.id, p)
    push('우선순위가 변경되었습니다.', 'success')
    await refreshAll()
  } catch (err: any) {
    push(extractApiError(err, '변경에 실패했습니다. (대기 중 작업만 조정 가능)'), 'error')
  } finally {
    // 초안을 지우지 않으면 서버가 거부한 값(예: 이미 pending이 아니라 409)이
    // 입력칸에 그대로 남고, 이후 새로고침해도 초안이 서버 값을 계속 덮어써
    // 운영자는 실제 우선순위를 영영 볼 수 없다. 성공했으면 refreshAll()이 이미
    // 새 값을 가져왔으므로 어느 쪽이든 지우는 게 맞다.
    delete editing.value[w.id]
  }
}

// 취소 확인. 네이티브 confirm() 대신 DS의 WConfirm을 쓴다 — 다이얼로그를 닫으면
// (@confirm이 오지 않으므로) 작업은 그대로 남는다.
const cancelOpen = ref(false)
const cancelTarget = ref<WorkView | null>(null)
function askCancel(w: WorkView) {
  cancelTarget.value = w
  cancelOpen.value = true
}
async function confirmCancel() {
  const w = cancelTarget.value
  cancelTarget.value = null
  if (!w) return
  try {
    await works.cancel(w.id)
    push('취소되었습니다.', 'success')
    // cancel은 멱등이라 200이 "정말 취소됐다"를 뜻하지 않는다 — 목록을 다시 읽어
    // 실제 상태를 보여준다.
    await refreshAll()
  } catch (err: any) {
    push(extractApiError(err, '취소에 실패했습니다.'), 'error')
  }
}

// enqueue drawer
const enqueueOpen = ref(false)
const form = ref<WorkForm>(blankWorkForm())
function openEnqueue() {
  form.value = blankWorkForm()
  enqueueOpen.value = true
}
async function submitEnqueue() {
  try {
    await works.enqueue(form.value)
    enqueueOpen.value = false
    await refreshAll()
    push('작업을 실행했습니다.', 'success')
  } catch (e: any) {
    push(e?.message ?? '작업 실행에 실패했습니다.', 'error')
  }
}

// result drawer (read-only) — 행 아무 곳이나 클릭하면 열린다.
const resultOpen = ref(false)
const selected = ref<WorkView | null>(null)
function openResult(row: Record<string, any>) {
  selected.value = (row as WorkRow)._src
  resultOpen.value = true
}
const paramsText = computed(() => selected.value?.parameters || '—')
const resultText = computed(() =>
  selected.value?.result ? JSON.stringify(selected.value.result, null, 2) : '결과가 없습니다.',
)
</script>

<template>
  <section class="panel">
    <WPageHeader
      title="작업 현황" desc="선택한 날짜의 작업을 소진 순서(우선순위 → 생성순)대로 보여줍니다"
      :add-label="authStore.isSystem ? '+ 작업 실행' : undefined"
      v-model:search="search" @add="openEnqueue" @refresh="refreshAll"
    >
      <template #header-actions>
        <input v-model="date" type="date" class="hd-field" aria-label="작업일" />
        <select v-model="state" class="hd-field f-state" aria-label="상태">
          <option value="">상태 전체</option>
          <option value="pending">대기</option>
          <option value="started">실행중</option>
          <option value="done">성공</option>
          <option value="failed">실패</option>
          <option value="cancel">취소</option>
        </select>
        <select v-model="createType" class="hd-field f-create" aria-label="생성구분">
          <option value="">생성 전체</option>
          <option value="Scheduled">예약</option>
          <option value="Manual">수동</option>
          <option value="Immediately">즉시</option>
        </select>
        <select v-model="company" class="hd-field f-company" aria-label="보험사">
          <option value="">보험사 전체</option>
          <option v-for="c in insurerList ?? []" :key="c.id" :value="c.code">{{ c.name }}</option>
        </select>
        <!-- GET /workers는 SYSTEM 전용이다 — 그 미만에게는 조회도 노출도 하지 않는다. -->
        <select v-if="authStore.isSystem" v-model="workerId" class="hd-field f-worker" aria-label="워커">
          <option value="">워커 전체</option>
          <option v-for="w in workerList ?? []" :key="w.id" :value="w.id">{{ w.name || w.id }}</option>
        </select>
      </template>
    </WPageHeader>

    <div v-if="summaryItems.length" class="sum">
      <template v-for="(s, i) in summaryItems" :key="s">
        <span v-if="i" class="sum-sep">·</span>
        <span class="sum-item">{{ s }}</span>
      </template>
    </div>

    <p v-if="truncated" class="trunc">
      상위 {{ WORK_LIST_LIMIT }}건만 표시합니다 — 위 요약은 이 날짜 전체를 세므로 표보다 클 수 있습니다.
      필터로 범위를 좁혀 보세요.
    </p>

    <!-- 컬럼이 12개라 기본 680px로는 어떤 폭에서도 스크롤 대신 말줄임만 난다. -->
    <WDataTable
      v-if="rows.length" :columns="columns" :rows="rows" :actions-width="190" :min-width="1400"
      row-clickable @row-click="openResult"
    >
      <template #cell-waitReason="{ row }">
        <WStatusBadge v-if="isStatusCell(row.waitReason)" :label="row.waitReason.label" :kind="row.waitReason.kind" />
        <span v-else>{{ row.waitReason }}</span>
      </template>
      <!-- 이름을 못 찾아 id를 줄여 보여준 칸에서도 전체 값은 확인할 수 있어야 한다. -->
      <template #cell-account="{ row }">
        <span :title="(row as WorkRow).accountId || undefined">{{ row.account }}</span>
      </template>
      <template #cell-worker="{ row }">
        <WStatusBadge v-if="isStatusCell(row.worker)" :label="row.worker.label" :kind="row.worker.kind" />
        <span v-else :title="(row as WorkRow).workerId || undefined">{{ row.worker }}</span>
      </template>
      <template #actions="{ row }">
        <template v-if="authStore.isSystem && (row as WorkRow)._src.state === 'pending'">
          <input
            type="number" class="mono pr-input"
            :value="priorityDraft((row as WorkRow)._src)"
            @input="onPriorityInput((row as WorkRow)._src, $event)"
            @change="savePriority((row as WorkRow)._src)"
          />
          <button class="act act--danger" @click="askCancel((row as WorkRow)._src)">취소</button>
        </template>
        <span v-else class="muted">—</span>
      </template>
    </WDataTable>
    <WEmptyState
      v-else-if="narrowed"
      title="조건에 맞는 작업이 없습니다"
      :message="pending ? '불러오는 중…' : '필터나 검색어를 바꿔 보세요.'"
    />
    <WEmptyState
      v-else
      title="이 날짜의 작업이 아직 생성되지 않았습니다"
      :message="pending ? '불러오는 중…' : '선생성은 매일 17:00에 다음날 분을 만듭니다.'"
    />

    <!-- 확인 버튼 라벨을 '취소'로 두면 두 버튼이 모두 '취소'가 돼 어느 쪽이
         작업을 취소하는지 알 수 없다 — 닫기/작업 취소로 갈라 놓는다. -->
    <WConfirm
      v-model:open="cancelOpen"
      title="이 작업을 취소할까요?"
      message="대기 중이거나 실행 중인 작업이 취소 상태로 바뀝니다. 되돌리려면 다시 실행해야 합니다."
      confirm-label="작업 취소" cancel-label="닫기"
      @confirm="confirmCancel"
    />

    <WDrawer v-model:open="enqueueOpen" title="작업 실행" description="보험사 코드와 태스크를 입력해 작업을 실행하세요.">
      <label class="fld"><span>보험사 코드 <span class="req">*</span></span><input v-model="form.company" placeholder="samsung_property" /></label>
      <label class="fld"><span>태스크 (쉼표 구분, 비우면 전체)</span><input v-model="form.tasksText" placeholder="contract_list_all_a, contract_list_all_b" /></label>
      <label class="fld"><span>파라미터 (JSON)</span><textarea v-model="form.parametersText" rows="4" placeholder='{"key":"value"}'></textarea></label>
      <label class="fld"><span>실행 시간 ms (기본 300000)</span><input v-model="form.lifetimeText" inputmode="numeric" placeholder="300000" /></label>
      <template #footer>
        <button class="act act--ghost" @click="enqueueOpen = false">취소</button>
        <button class="act act--primary" @click="submitEnqueue">실행</button>
      </template>
    </WDrawer>

    <WDrawer v-model:open="resultOpen" title="작업 결과" description="선택한 작업의 파라미터와 결과입니다.">
      <label class="fld"><span>파라미터</span><pre class="codeblock">{{ paramsText }}</pre></label>
      <label class="fld"><span>결과</span><pre class="codeblock">{{ resultText }}</pre></label>
      <template #footer>
        <button class="act act--ghost" @click="resultOpen = false">닫기</button>
      </template>
    </WDrawer>
  </section>
</template>

<style scoped>
/* .fld / .act come from the global DS (assets/css/components.css). */
.panel { background: var(--panel); border: 1px solid var(--line); border-radius: 14px; overflow: hidden; box-shadow: var(--rim), var(--elev); }
/* .hd-field: 헤더 필터 컨트롤 스타일 (구 작업 큐 화면에서 이식). */
.hd-field { padding: 8px 12px; border: 1px solid var(--line); border-radius: 9px; font-family: var(--font-mono); font-size: 12.5px; background: var(--th); color: var(--ink); }
.sum { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; padding: 10px 18px; border-bottom: 1px solid var(--line); background: var(--th); font-family: var(--font-mono); font-size: 12.5px; color: var(--ink-2); }
.sum-sep { color: var(--line); }
.trunc { margin: 0; padding: 9px 18px; border-bottom: 1px solid var(--line); box-shadow: inset 3px 0 0 var(--warn); background: var(--th); font-size: 12.5px; color: var(--ink-2); }
.pr-input { width: 5.5rem; padding: 5px 8px; border: 1px solid var(--line); border-radius: 7px; background: var(--panel); color: var(--ink); }
.muted { font-size: 12px; color: var(--ink-2); }
.codeblock { margin: 0; padding: 10px 12px; border: 1px solid var(--line); border-radius: 9px; background: var(--th); color: var(--ink); font-family: var(--font-mono); font-size: 12px; white-space: pre-wrap; word-break: break-all; max-height: 240px; overflow: auto; }
</style>
