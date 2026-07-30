<script setup lang="ts">
import { computed, ref } from 'vue'
import type { components } from '#shared/types/api'
import type { Column } from '~/components/WDataTable.vue'
import { WORK_LIST_LIMIT, toSummaryParams, type WorkListParams, type WorkSummaryParams } from '~/composables/useWorks'
import { isStatusCell, type StatusCell } from '~/utils/status'
import { workStatusCell, WORK_STATE_FILTER_LABEL } from '~/utils/workStatus'
import { waitReasonCell } from '~/utils/waitReason'
import { categoryLabel } from '~/utils/category'
import { shortId } from '~/utils/idLabel'
import { blankWorkForm, type WorkForm } from '~/utils/workForm'
import { extractApiError } from '~/utils/apiError'

type WorkView = components['schemas']['WorkView']
type WorkerView = components['schemas']['WorkerView']

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
  // 배열 그대로 넘긴다 — 쉼표로 join하면 한 줄이 되어 셀 폭에서 말줄임된다.
  // WDataTable의 kind:'tags'가 개별 태그로 줄바꿈해 전부 보여준다.
  tasks: string[]
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

// 서버로 나가는 필터는 전부 여기 한 곳에 모은다 — 목록과 요약이 같은 출처에서
// 파생돼야 둘이 서로 다른 모집단을 세는 일이 없다. search는 일부러 빼 뒀다:
// 클라이언트에서 이미 받은 행만 거르는 값이라 서버로 보내면 안 된다.
const filters = ref({
  date: localToday(),
  state: '',
  createType: '',
  company: '',
  workerId: '',
})
const search = ref('')

const params = computed<WorkListParams>(() => ({ ...filters.value }))

const { data, pending, refresh } = await useAsyncData(
  'works', () => works.list({ ...params.value, size: WORK_LIST_LIMIT }), { watch: [params] },
)
// 상한에 정확히 닿았다 = 더 있을 수 있다. 요약은 페이징 없이 그날 전량을 세므로,
// 알리지 않으면 "대기 480"이라 써 놓고 표에는 1000행만 그리는 화면이 된다.
const truncated = computed(() => (data.value?.length ?? 0) >= WORK_LIST_LIMIT)
// 요약은 상태 분포 자체라 state를 아예 받지 않는다(WorkSummaryParams가 타입으로
// 막는다). 목록 파라미터를 손으로 베껴 쓰지 않고 파생시키는 이유: 베껴 두면
// 필터가 하나 늘 때 목록만 좁혀지고 요약은 예전 모집단을 계속 세어, 한 화면의
// 두 숫자가 서로 다른 것을 세는 상태로 조용히 되돌아간다.
const summaryParams = computed<WorkSummaryParams>(() => toSummaryParams(params.value))
const { data: sum, refresh: refreshSummary } = await useAsyncData(
  'works-summary', () => works.summary(summaryParams.value),
  // 정체성이 아니라 내용으로 감시한다. 파생 계산은 params가 바뀔 때마다 새 객체를
  // 만들므로, 그대로 watch하면 요약이 무시하는 state만 건드려도 요약을 다시 읽게
  // 된다(같은 답을 받으려고 왕복 한 번).
  { watch: [() => JSON.stringify(summaryParams.value)] },
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
// GET /workers는 SYSTEM 전용이라 그 미만에게는 이 맵이 항상 비어 있다 — 그
// 사용자들의 워커 칸은 백엔드가 실어 준 workerName이 받는다(아래 workerLabel).
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

const CREATE_TYPE_LABEL: Record<string, string> = {
  Scheduled: '예약', Manual: '수동', Immediately: '즉시',
}

// 워커 온라인 판정: register·poll이 last_connected를 주기적으로 갱신한다는 전제를
// 그대로 따른다(dashboard_handler.go의 임베디드 대시보드가 쓰는 것과 같은 15초
// 끊김 = offline 관례). 백엔드 waitReason/eligibleWorkerCount는 liveness를 전혀
// 보지 않으므로(PopPendingWork 게이트와 동일하게 SQL 패리티를 지키기 위해서다)
// 이 판정은 화면 전용 보조 신호일 뿐, 후보 수·대기사유 어느 쪽도 바꾸지 않는다.
const WORKER_ALIVE_MS = 15_000
function isWorkerAlive(w: WorkerView): boolean {
  return !!w.lastConnectedAt && Date.now() - w.lastConnectedAt <= WORKER_ALIVE_MS
}

// 이 work를 가져갈 수 있는 후보(eligibleWorkerCount) 중 지금 온라인인 수. 자격
// 규칙은 work.sql의 배정 규칙과 같다(§3.4: 미배정 워커는 company_ref가 빈 work만,
// 매핑된 워커는 매핑된 회사만) — 다만 일시중지·계정 잠김 등은 이미
// eligibleWorkerCount에 반영돼 있으므로 여기서는 paused만 한 번 더 걸러낸다.
function onlineEligibleCount(w: WorkView, list: WorkerView[]): number {
  return list.filter(worker =>
    !worker.paused && isWorkerAlive(worker) &&
    (!w.company || (worker.companyIds ?? []).includes(w.company)),
  ).length
}

// 워커 칸의 두 얼굴: 대기 행은 "지금 이걸 가져갈 수 있는 워커 수", 그 외는 실제
// 배정 워커. 후보 0은 영원히 실행되지 않는다는 뜻이라 숫자가 아니라 사고로 알린다.
// 후보가 있어도 그 유일한 후보가 하루 종일 오프라인이면 "대기 중"만 보고는 알 수
// 없다 — GET /workers가 SYSTEM 전용이라 이 워커 목록을 가진 사용자에게만 온라인
// 수를 덧붙인다. USER/ADMIN은 workerList를 아예 못 받으므로(403) 이 칸을 보태지
// 않는다 — 항상 0으로 보이는 거짓 신호보다 아예 안 보이는 게 낫다.
function workerCell(w: WorkView): StatusCell | string {
  if (w.state !== 'pending') return workerLabel(w)
  const n = w.eligibleWorkerCount ?? 0
  if (n === 0) return { label: '자격 워커 없음', kind: 'fail' }
  if (!authStore.isSystem) return `후보 ${n}`
  const online = onlineEligibleCount(w, workerList.value ?? [])
  return `후보 ${n} (온라인 ${online})`
}

// 워커 칸: 목록에서 찾은 이름 → 백엔드가 준 workerName → 줄인 id 순(계정 칸과
// 같은 규칙). GET /workers는 SYSTEM 전용이라 USER/ADMIN에게 workerNames는 항상
// 비어 있다 — 이 사용자들에게 uuid를 면하게 해 주는 건 workerName뿐이고, 읽기
// 권한을 USER까지 내린 게 바로 이 화면이다. 어느 쪽도 못 찾으면 줄인 id로
// 물러난다: 지어낸 이름은 절대 쓰지 않고, 전체 값은 셀의 title에 남는다.
function workerLabel(w: WorkView): string {
  const id = w.workerId
  if (!id) return '—'
  return workerNames.value[id] ?? (w.workerName || shortId(id))
}

// 계정 칸: 목록에서 찾은 이름 → 백엔드가 준 accountName(pending 행에만 채워진다)
// → 줄인 id 순. 운영자에게 36자 uuid가 기본 화면이 되는 일은 없어야 한다.
function accountLabel(w: WorkView): string {
  const id = w.accountId
  if (!id) return w.accountName || '—'
  return accountNames.value[id] ?? (w.accountName || shortId(id))
}

// 워커 필터 옵션 라벨. SQL이 일시중지 워커를 자격에서 정확히 빼면서, 그 워커로
// 필터링한 운영자에게는 "대기 작업 없음"만 보이고 진짜 이유(일시중지)는 안 보이는
// 화면이 됐다 — 드롭다운 단계에서 바로 알려준다.
function workerOptionLabel(w: WorkerView): string {
  const base = w.name || w.id
  return w.paused ? `${base} (일시중지)` : base
}

const rows = computed<WorkRow[]>(() => {
  const list: WorkRow[] = (data.value ?? []).map(w => ({
    id: w.id,
    // 상태는 state만으로 정해지지 않는다 — 워커가 실패를 보고해도 백엔드는
    // done으로 저장한다(workStatus.ts 주석). 결과 본문을 함께 넘겨 판정한다.
    status: workStatusCell(w.state, w.result),
    waitReason: waitReasonCell(w.waitReason, w.state) ?? '—',
    company: w.company,
    account: accountLabel(w),
    accountId: w.accountId ?? '',
    category: w.category ? categoryLabel(w.category, dataTypeNames.value) : '—',
    closingMonth: w.closingMonth || '—',
    runTime: w.workTime || '—',
    tasks: w.tasks ?? [],
    priority: w.priority ?? 0,
    worker: workerCell(w),
    workerId: w.workerId ?? '',
    retried: w.retriedCount ?? 0,
    createType: CREATE_TYPE_LABEL[w.createType ?? ''] ?? (w.createType || '—'),
    _src: w,
  }))
  const q = search.value.trim().toLowerCase()
  if (!q) return list
  // 화면에 이름이 보인다고 검색까지 이름 전용이 되면 안 된다 — 운영자는 로그에서
  // 복사한 36자 uuid를 그대로 붙여 넣어 행을 찾는다. 표시값(계정·워커 이름)과
  // 원본 id를 모두 대상에 넣어 사람 이름과 id 둘 다로 찾히게 한다.
  return list.filter(r => [
    r.company, r.account, r.accountId,
    isStatusCell(r.worker) ? r.worker.label : r.worker, r.workerId,
    // 태그 배열은 공백으로 잇는다 — String(배열)은 "a,b"라서 화면에 보이는 대로
    // 띄어 쓴 검색어("a b")가 걸리지 않는다.
    r.tasks.join(' '), r.category, r.status.label,
  ].some(x => String(x).toLowerCase().includes(q)))
})

// 지금 표에 보이는 행 중 "결과는 왔지만 실패"인 건수. 요약 스트립의 성공 수에
// 섞여 있는 값이라, 그 어긋남을 알리는 안내문(아래 state-note)의 트리거다.
const failedInDone = computed(() =>
  rows.value.filter(r => r._src.state === 'done' && r.status.kind === 'fail').length,
)

// 날짜는 항상 있으니 필터로 세지 않는다. 나머지 조건이 하나라도 걸려 있으면
// 0건은 "선생성이 안 됐다"가 아니라 "조건에 맞는 게 없다"는 뜻이다 — 지정 문구를
// 그대로 쓰면 운영자가 선생성 실패로 오독해 불필요한 재생성을 시도한다.
const narrowed = computed(() => {
  const { date: _date, ...rest } = filters.value
  return !!(search.value.trim() || Object.values(rest).some(v => v))
})

// 순서는 v1 작업현황(wrpa-web /rpa/states)의 배열을 따른다: 생성구분 → 무엇을
// 하는 작업인지(보험사·계정·카테고리·tasks) → 언제(업적월·실행시각) → 누가·언제쯤
// (워커·우선순위) → 결과(상태·대기사유·시도). 그 화면을 쓰던 운영자가 눈을 옮기지
// 않아도 되게 하는 게 목적이라, 상태는 앞이 아니라 결과 묶음에 둔다.
//
// 정렬은 전 컬럼에서 끈다. 서버가 준 순서가 곧 claim 소진 순서(priority DESC,
// seq)라 헤더 클릭 정렬로 흐트러지면 "이 순서대로 소진된다"는 화면의 의미 자체가
// 사라진다 — 컬럼을 재배치해도 이 이유는 그대로다.
const columns: Column[] = [
  { key: 'createType', label: '생성', kind: 'muted', sortable: false },
  { key: 'company', label: '보험사', kind: 'mono', sortable: false },
  { key: 'account', label: '계정', kind: 'text', sortable: false },
  { key: 'category', label: '카테고리', kind: 'text', sortable: false },
  // tags + weight 2: 말줄임 대신 줄바꿈해 태스크 이름을 전부 보여준다. 폭을 두 배로
  // 주지 않으면 태그가 한 줄에 하나씩 접혀 행이 쓸데없이 높아진다.
  { key: 'tasks', label: 'tasks', kind: 'tags', weight: 2, sortable: false },
  { key: 'closingMonth', label: '업적월', kind: 'mono', sortable: false },
  { key: 'runTime', label: '실행시각', kind: 'mono', sortable: false },
  { key: 'worker', label: '워커', kind: 'mono', sortable: false },
  { key: 'priority', label: '우선순위', kind: 'mono', sortable: false },
  { key: 'status', label: '상태', kind: 'status', sortable: false },
  { key: 'waitReason', label: '대기사유', kind: 'status', sortable: false },
  { key: 'retried', label: '시도', kind: 'mono', sortable: false },
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
  if (p === undefined || p === w.priority) {
    // 보낼 게 없어도 초안은 반드시 지운다. 남겨 두면 priorityDraft가 서버 값보다
    // 초안을 우선하므로, 값을 바꿨다 되돌린 뒤 다른 운영자가 우선순위를 조정해도
    // 이 화면만 새로고침해도 옛 숫자를 계속 보여준다.
    delete editing.value[w.id]
    return
  }
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

// 행 액션은 상태를 따라간다. 백엔드가 받아 주는 상태 조합을 그대로 옮긴 것이다:
//   pending  → 우선순위 조정 + 취소   (PATCH priority는 pending만, POST cancel)
//   started  → 중지                   (같은 POST cancel — 실행 중인 걸 "취소"라
//                                      부르면 예약을 무르는 것으로 읽힌다)
//   done/failed/cancel → 재시작       (POST restart)
// 셋 다 SYSTEM 전용 엔드포인트라 authStore.isSystem으로 한 번 더 게이팅한다.
type RowAction = 'cancel' | 'stop' | 'restart' | null
function rowAction(state: string): RowAction {
  if (state === 'pending') return 'cancel'
  if (state === 'started') return 'stop'
  // 성공한 작업도 재시작을 연다(v1과 같다) — 백엔드도 done/cancel/failed를 모두 받는다.
  if (state === 'done' || state === 'failed' || state === 'cancel') return 'restart'
  return null
}

// 확인 문구는 액션마다 다르다. 특히 재시작은 성공한 작업에도 열려 있어, 결과
// 파일이 지워지고 시도 횟수가 오른다는 사실을 누르기 전에 알려야 한다.
const ACTION_COPY: Record<Exclude<RowAction, null>, {
  button: string; title: string; message: string; confirm: string
}> = {
  cancel: {
    button: '취소',
    title: '이 작업을 취소할까요?',
    message: '대기 중인 작업이 취소 상태로 바뀝니다. 되돌리려면 다시 실행해야 합니다.',
    confirm: '작업 취소',
  },
  stop: {
    button: '중지',
    title: '실행 중인 작업을 중지할까요?',
    message: '워커는 다음 상태 확인에서 중지 신호를 보고 멈춥니다 — 즉시 끊기지는 않습니다.',
    confirm: '작업 중지',
  },
  restart: {
    button: '재시작',
    title: '이 작업을 다시 실행할까요?',
    message: '같은 작업이 대기 상태로 되돌아갑니다. 이전 실행의 결과 파일과 스크린샷은 지워지고 시도 횟수가 1 올라갑니다.',
    confirm: '작업 재시작',
  },
}

// 확인 다이얼로그. 네이티브 confirm() 대신 DS의 WConfirm을 쓴다 — 다이얼로그를
// 닫으면 (@confirm이 오지 않으므로) 작업은 그대로 남는다.
const confirmOpen = ref(false)
const actionTarget = ref<WorkView | null>(null)
const actionKind = ref<Exclude<RowAction, null>>('cancel')
const actionCopy = computed(() => ACTION_COPY[actionKind.value])

function askAction(w: WorkView, kind: Exclude<RowAction, null>) {
  actionTarget.value = w
  actionKind.value = kind
  confirmOpen.value = true
}

async function confirmAction() {
  const w = actionTarget.value
  const kind = actionKind.value
  actionTarget.value = null
  if (!w) return
  const restarting = kind === 'restart'
  try {
    await (restarting ? works.restart(w.id) : works.cancel(w.id))
    push(restarting ? '재시작했습니다.' : '중지 요청을 보냈습니다.', 'success')
    // cancel/restart 모두 멱등이라 200이 "정말 그렇게 됐다"를 뜻하지 않는다 —
    // 목록을 다시 읽어 실제 상태를 보여준다.
    await refreshAll()
  } catch (err: any) {
    push(extractApiError(err, restarting ? '재시작에 실패했습니다.' : '중지에 실패했습니다.'), 'error')
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
        <input v-model="filters.date" type="date" class="hd-field" aria-label="작업일" />
        <select v-model="filters.state" class="hd-field f-state" aria-label="상태">
          <option value="">상태 전체</option>
          <option value="pending">대기</option>
          <option value="started">실행중</option>
          <!-- 필터 값은 백엔드 state 그대로다. done은 성공이 아니라 "결과가
               도착함"이고 실패 결과도 여기 들어간다 — 라벨로 그 사실을 드러낸다. -->
          <option value="done">완료</option>
          <option value="failed">실패(타임아웃)</option>
          <option value="cancel">취소</option>
        </select>
        <select v-model="filters.createType" class="hd-field f-create" aria-label="생성구분">
          <option value="">생성 전체</option>
          <option value="Scheduled">예약</option>
          <option value="Manual">수동</option>
          <option value="Immediately">즉시</option>
        </select>
        <select v-model="filters.company" class="hd-field f-company" aria-label="보험사">
          <option value="">보험사 전체</option>
          <option v-for="c in insurerList ?? []" :key="c.id" :value="c.code">{{ c.name }}</option>
        </select>
        <!-- GET /workers는 SYSTEM 전용이다 — 그 미만에게는 조회도 노출도 하지 않는다. -->
        <select v-if="authStore.isSystem" v-model="filters.workerId" class="hd-field f-worker" aria-label="워커">
          <option value="">워커 전체</option>
          <option v-for="w in workerList ?? []" :key="w.id" :value="w.id">{{ workerOptionLabel(w) }}</option>
        </select>
      </template>
    </WPageHeader>

    <div v-if="summaryItems.length" class="sum">
      <template v-for="(s, i) in summaryItems" :key="s">
        <span v-if="i" class="sum-sep">·</span>
        <span class="sum-item">{{ s }}</span>
      </template>
    </div>

    <!-- 요약은 일부러 state를 안 받는다(위 summaryParams 주석) — 그래서 상태를
         좁혀 표가 비거나 줄어도 요약 숫자는 그 날 전체를 그대로 보여준다. 이 차이를
         모르면 "요약엔 있는데 표엔 없다"를 버그로 오독한다. -->
    <p v-if="filters.state && summaryItems.length" class="state-note">
      위 요약은 상태 필터와 무관하게 이 날짜 전체를 셉니다 — 표는 "{{ WORK_STATE_FILTER_LABEL[filters.state] ?? filters.state }}" 상태만 보여줍니다.
    </p>

    <!-- 요약의 "성공/실패"는 백엔드 집계(state)라 행 라벨과 기준이 다르다. 워커가
         실패를 보고한 작업도 서버는 done으로 세므로 요약의 성공 수에 섞여 있다.
         행 라벨만 고친 화면이라, 그 차이를 여기서 밝히지 않으면 운영자는 "성공
         3인데 표에는 실패가 있다"를 화면 버그로 오독한다. -->
    <p v-if="failedInDone" class="state-note">
      이 목록에 실패한 작업이 {{ failedInDone }}건 있습니다 — 서버는 결과가 도착한 작업을 성공/실패 구분 없이 "완료"로 집계하므로,
      위 요약의 "성공 {{ sum?.done ?? 0 }}"에는 이 실패 건이 포함돼 있고 "실패"는 타임아웃만 셉니다.
    </p>

    <p v-if="truncated" class="trunc">
      상위 {{ WORK_LIST_LIMIT }}건만 표시합니다 — 위 요약은 이 날짜 전체를 세므로 표보다 클 수 있습니다.
      필터로 범위를 좁혀 보세요.
    </p>

    <!-- 컬럼이 12개라 기본 680px로는 어떤 폭에서도 스크롤 대신 말줄임만 난다.
         tasks가 2배 폭을 가져가므로 1400으로는 나머지 칸이 다시 좁아진다. -->
    <WDataTable
      v-if="rows.length" :columns="columns" :rows="rows" :actions-width="190" :min-width="1500"
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
        <template v-if="authStore.isSystem && rowAction((row as WorkRow)._src.state)">
          <!-- 우선순위는 pending에서만 조정할 수 있다(백엔드가 409로 막는다). -->
          <input
            v-if="(row as WorkRow)._src.state === 'pending'"
            type="number" class="mono pr-input"
            :value="priorityDraft((row as WorkRow)._src)"
            @input="onPriorityInput((row as WorkRow)._src, $event)"
            @change="savePriority((row as WorkRow)._src)"
          />
          <!-- 재시작은 되돌리는 동작이 아니라 다시 굴리는 동작이라 danger로 칠하지 않는다. -->
          <button
            class="act" :class="rowAction((row as WorkRow)._src.state) === 'restart' ? 'act--ghost' : 'act--danger'"
            @click="askAction((row as WorkRow)._src, rowAction((row as WorkRow)._src.state)!)"
          >{{ ACTION_COPY[rowAction((row as WorkRow)._src.state)!].button }}</button>
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
      v-model:open="confirmOpen"
      :title="actionCopy.title" :message="actionCopy.message"
      :confirm-label="actionCopy.confirm" cancel-label="닫기"
      :danger="actionKind !== 'restart'"
      @confirm="confirmAction"
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
.state-note { margin: 0; padding: 9px 18px; border-bottom: 1px solid var(--line); box-shadow: inset 3px 0 0 var(--idle); background: var(--th); font-size: 12.5px; color: var(--ink-2); }
.pr-input { width: 5.5rem; padding: 5px 8px; border: 1px solid var(--line); border-radius: 7px; background: var(--panel); color: var(--ink); }
.muted { font-size: 12px; color: var(--ink-2); }
.codeblock { margin: 0; padding: 10px 12px; border: 1px solid var(--line); border-radius: 9px; background: var(--th); color: var(--ink); font-family: var(--font-mono); font-size: 12px; white-space: pre-wrap; word-break: break-all; max-height: 240px; overflow: auto; }
</style>
