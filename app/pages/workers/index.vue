<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { components } from '#shared/types/api'
import type { Column } from '~/components/WDataTable.vue'
import type { StatusCell } from '~/utils/status'
import { formatSince, livenessCell, msToSec } from '~/utils/dashboardState'
import { workerTypeLabel, blankWorkerCreateForm, toCreateWorkerRequest, WORKER_TYPE_OPTIONS, type WorkerCreateForm } from '~/utils/workerForm'
import { extractApiError } from '~/utils/apiError'

type WorkerView = components['schemas']['WorkerView']

interface WorkerRow {
  id: string
  name: string
  type: string
  companies: string[] | string // 배정 회사명 배열, 미배정이면 '배정 안됨' 문자열
  companiesTitle: string
  insurers: string[] // 배정 보험사명 배열 (빈 배열 → '—')
  insurersTitle: string
  host: string // 드로어 읽기전용 표시용(호스트명 단독)
  hostIp: string // 테이블 표기용 "호스트/IP" 합본
  hid: StatusCell
  lastSeen: string // 상대시간 텍스트. 색(생사)은 status 컬럼이 전담 — 여긴 근거 데이터만.
  status: StatusCell
  assign: StatusCell // 작업 배정 상태(배정중/중단) — paused 파생
  paused: boolean
  companyIds: string[]
  insurerIds: string[]
}

const workers = useWorkers()
const { push } = useToast()

// 워커 목록 + 이름 매핑용 회사/보험사 목록을 함께 로드.
const { data, refresh, pending } = await useAsyncData('workers', () => workers.list())
const { data: clients } = await useAsyncData('workers-clients', () => useClients().list())
const { data: insurers } = await useAsyncData('workers-insurers', () => useInsurers().list())

const clientName = computed(() => new Map((clients.value ?? []).map(c => [c.id, c.name])))
const insurerName = computed(() => new Map((insurers.value ?? []).map(i => [i.id, i.name])))
const namesOf = (ids: string[], map: Map<string, string>) => ids.map(id => map.get(id) ?? id)

// HID total은 클라이언트에서 1로 고정(단일 디바이스). N/M이 아니라 정상/끊김 상태로 표기.
// (혹시 미래에 total>1이면 카운트도 함께 노출)
function hidCell(health: number, total: number): StatusCell {
  if (!total) return { label: '—', kind: 'idle' }
  if (health >= total) return { label: total > 1 ? `정상 ${health}/${total}` : '정상', kind: 'done' }
  return { label: total > 1 ? `이상 ${health}/${total}` : '끊김', kind: 'fail' }
}

// 상대시간·라이브니스 기준 시각. 화면을 열어둔 채로도 시간이 흐르며 판정이 갱신되도록
// 클라이언트에서 주기적으로 갱신한다(하트비트 주기와 맞춰 5초). SSR/초기값은 setup 시점.
const nowSec = ref(Math.floor((globalThis.Date?.now?.() ?? 0) / 1000))
let clock: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  clock = setInterval(() => { nowSec.value = Math.floor((globalThis.Date?.now?.() ?? 0) / 1000) }, 5000)
})
onUnmounted(() => { if (clock) clearInterval(clock) })

const search = ref('')
const rows = computed<WorkerRow[]>(() => {
  const list: WorkerRow[] = (data.value ?? []).map((w: WorkerView) => {
    const companyIds = w.companyIds ?? []
    const insurerIds = w.insurerIds ?? []
    const companyNames = namesOf(companyIds, clientName.value)
    const insurerNames = namesOf(insurerIds, insurerName.value)
    // 0/누락은 '미접속'으로 취급(|| undefined) — 0을 넘기면 1970년 기준 상대시간이 찍힘.
    const lastSec = msToSec(w.lastConnectedAt || undefined)
    const live = livenessCell(lastSec, nowSec.value)
    return {
      id: w.id,
      name: w.name,
      type: workerTypeLabel(w.type),
      // 회사 미배정 = 배정 안됨(work 안 받음). 보험사 미배정 = '—'. 모두 칩으로 전체 표시.
      companies: companyIds.length ? companyNames : '배정 안됨',
      companiesTitle: companyNames.join(', '),
      insurers: insurerNames,
      insurersTitle: insurerNames.join(', '),
      host: w.host ?? '—',
      // 호스트명/IP를 한 칸에. 하나만 있으면 그것만, 둘 다 없으면 '—'.
      hostIp: [w.host, w.ip].filter(Boolean).join('/') || '—',
      hid: hidCell(w.hidHealthCount, w.hidTotalCount),
      lastSeen: formatSince(lastSec, nowSec.value),
      // 상태는 워커가 보고한 state 대신 last-seen 파생 생사(온라인/지연/오프라인).
      // 하드 크래시 시 보고 state는 최대 5분 얼어붙어 신뢰할 수 없기 때문.
      status: live,
      // 배정 상태는 생사와 별개(paused는 online이어도 작업만 안 받음).
      assign: w.paused ? { label: '일시중지', kind: 'warn' } : { label: '정상', kind: 'done' },
      paused: w.paused,
      companyIds,
      insurerIds,
    }
  })
  const q = search.value.trim().toLowerCase()
  return q
    ? list.filter(r => [r.name, r.type, r.companiesTitle, r.insurersTitle, r.hostIp, r.status.label].some(x => x.toLowerCase().includes(q)))
    : list
})

const columns: Column[] = [
  { key: 'name', label: '이름', kind: 'text' },
  { key: 'type', label: '유형', kind: 'text' },
  { key: 'companies', label: '회사', kind: 'chips', sortable: false },
  { key: 'insurers', label: '보험사', kind: 'chips', sortable: false, weight: 2.4 },
  { key: 'hostIp', label: '호스트/IP', kind: 'muted' },
  { key: 'hid', label: 'HID', kind: 'status' },
  { key: 'lastSeen', label: '최근 접속', kind: 'text', sortable: false },
  { key: 'status', label: '상태', kind: 'status' },
  { key: 'assign', label: '배정', kind: 'status' },
]

// --- 배정 편집 드로어 (이름/유형은 워커 보고값 → 읽기전용) ---
const crudOpen = ref(false)
const editing = ref<WorkerRow | null>(null)
const companyIds = ref<string[]>([])
const insurerIds = ref<string[]>([])

function toggleCompany(id: string) {
  companyIds.value = companyIds.value.includes(id)
    ? companyIds.value.filter(x => x !== id) : [...companyIds.value, id]
}
function toggleInsurer(id: string) {
  insurerIds.value = insurerIds.value.includes(id)
    ? insurerIds.value.filter(x => x !== id) : [...insurerIds.value, id]
}

function openEdit(row: WorkerRow) {
  editing.value = row
  companyIds.value = [...row.companyIds]
  insurerIds.value = [...row.insurerIds]
  crudOpen.value = true
}

async function save() {
  const row = editing.value
  if (!row) return
  try {
    await workers.setAssignments(row.id, { companyIds: companyIds.value, insurerIds: insurerIds.value })
    crudOpen.value = false
    await refresh()
    push('배정이 저장되었습니다.', 'success')
  } catch (e: any) {
    push(extractApiError(e, '저장에 실패했습니다.'), 'error')
  }
}

// --- 삭제 (확인 게이트) ---
const confirmOpen = ref(false)
const pendingRemove = ref<WorkerRow | null>(null)
function askRemove(row: WorkerRow) {
  pendingRemove.value = row
  confirmOpen.value = true
}
async function confirmRemove() {
  const row = pendingRemove.value
  if (!row) return
  try {
    await workers.remove(row.id)
    await refresh()
    push('삭제되었습니다.', 'success')
  } catch {
    push('삭제에 실패했습니다.', 'error')
  }
}

async function rotate(row: WorkerRow) {
  try {
    const res = await workers.rotateKey(row.id)
    keyForCreate.value = false
    revealKey(res.apiKey)
  } catch {
    push('키 재발급에 실패했습니다.', 'error')
  }
}

// 작업 배정 일시중지/재개 토글.
async function togglePause(row: WorkerRow) {
  try {
    if (row.paused) await workers.resume(row.id)
    else await workers.pause(row.id)
    await refresh()
    push(row.paused ? '작업을 재개했습니다.' : '작업을 일시중지했습니다.', 'success')
  } catch (e) {
    push(extractApiError(e, '상태 변경에 실패했습니다.'), 'error')
  }
}

// --- 워커 생성 (관리자가 미리 생성 → 키 발급) ---
const createOpen = ref(false)
const createForm = ref<WorkerCreateForm>(blankWorkerCreateForm())
const createCompanyIds = ref<string[]>([]) // 생성 시 함께 배정할 회사
const createInsurerIds = ref<string[]>([]) // 생성 시 함께 배정할 보험사
function toggleCreateCompany(id: string) {
  createCompanyIds.value = createCompanyIds.value.includes(id)
    ? createCompanyIds.value.filter(x => x !== id) : [...createCompanyIds.value, id]
}
function toggleCreateInsurer(id: string) {
  createInsurerIds.value = createInsurerIds.value.includes(id)
    ? createInsurerIds.value.filter(x => x !== id) : [...createInsurerIds.value, id]
}
const creating = ref(false) // 저장 진행 중 — 이중 제출(중복 워커·키) 방지
function openCreate() {
  createForm.value = blankWorkerCreateForm()
  createCompanyIds.value = []
  createInsurerIds.value = []
  createOpen.value = true
}
async function saveCreate() {
  if (creating.value) return
  // 0) 폼 검증은 생성 호출 전에 — 검증 메시지(빈 이름 등)를 그대로 노출.
  let body: ReturnType<typeof toCreateWorkerRequest>
  try {
    body = toCreateWorkerRequest(createForm.value)
  } catch (e: any) {
    push(e?.message ?? '입력값을 확인하세요.', 'error')
    return
  }
  creating.value = true
  const hadCompanies = createCompanyIds.value.length > 0
  // 1) 워커 생성 + 배정을 단일 원자 호출로 (키는 이 응답에서만 1회 노출 — 실패 시 즉시 중단)
  let created: { id: string, apiKey: string }
  try {
    created = await workers.create({ ...body, companyIds: createCompanyIds.value, insurerIds: createInsurerIds.value })
  } catch (e) {
    push(extractApiError(e, '워커 생성에 실패했습니다.'), 'error')
    creating.value = false
    return
  }
  createOpen.value = false
  keyForCreate.value = true
  keyCreateNoCompany.value = !hadCompanies
  revealKey(created.apiKey)
  push('워커가 생성되었습니다.', 'success')
  try { await refresh() } catch { /* 목록 갱신 실패는 무시 */ }
  creating.value = false
}

// --- 1회성 API 키 노출 (생성·재발급 공용) ---
const keyOpen = ref(false)
const revealedKey = ref('')
const keyForCreate = ref(false) // true면 생성 직후(회사 배정 안내 대상)
const keyCreateNoCompany = ref(false) // 생성 시 회사를 하나도 안 골랐을 때만 안내
function revealKey(key: string) {
  revealedKey.value = key
  keyOpen.value = true
}
async function copyKey() {
  try {
    await navigator.clipboard.writeText(revealedKey.value)
    push('복사되었습니다.', 'success')
  } catch {
    push('복사에 실패했습니다. 키를 직접 선택해 복사하세요.', 'error')
  }
}
</script>

<template>
  <section class="panel">
    <WPageHeader title="워커" desc="RPA 워커 호스트 · 미리 생성해 키를 발급하고 배정(회사·보험사)을 관리합니다"
      add-label="+ 워커 등록" v-model:search="search" @add="openCreate" />
    <WDataTable v-if="rows.length" :columns="columns" :rows="rows" index-column :actions-width="288">
      <template #actions="{ row }">
        <button class="act act--ghost" @click="togglePause(row as WorkerRow)">{{ (row as WorkerRow).paused ? '재개' : '일시중지' }}</button>
        <button class="act act--ghost" @click="rotate(row as WorkerRow)">키 재발급</button>
        <button class="act act--ghost" @click="openEdit(row as WorkerRow)">배정</button>
        <button class="act act--danger" @click="askRemove(row as WorkerRow)">삭제</button>
      </template>
    </WDataTable>
    <WEmptyState v-else title="워커가 없습니다"
      :message="pending ? '불러오는 중…' : '워커가 등록되면 여기에 표시됩니다.'" />

    <WDrawer v-model:open="createOpen" title="워커 등록" description="워커를 미리 생성합니다. 저장하면 API 키가 1회 표시됩니다.">
      <label class="fld">
        <span>이름 <span class="req">*</span></span>
        <input v-model="createForm.name" placeholder="win-worker-1" />
      </label>
      <label class="fld">
        <span>유형 <span class="req">*</span></span>
        <select v-model="createForm.type">
          <option v-for="o in WORKER_TYPE_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
        </select>
      </label>
      <div class="fld">
        <span>회사 <small class="hint">선택 안 하면 작업을 받지 않음 (나중에 「배정」에서 지정 가능)</small></span>
        <div class="chips">
          <button v-for="c in clients ?? []" :key="c.id" type="button" class="chip"
            :class="{ 'chip--on': createCompanyIds.includes(c.id) }" @click="toggleCreateCompany(c.id)"><span class="chip-t" :title="c.name">{{ c.name }}</span></button>
          <span v-if="!(clients ?? []).length" class="chips-empty">회사 없음</span>
        </div>
      </div>
      <div class="fld">
        <span>보험사</span>
        <div class="chips">
          <button v-for="i in insurers ?? []" :key="i.id" type="button" class="chip"
            :class="{ 'chip--on': createInsurerIds.includes(i.id) }" @click="toggleCreateInsurer(i.id)"><span class="chip-t" :title="i.name">{{ i.name }}</span></button>
          <span v-if="!(insurers ?? []).length" class="chips-empty">보험사 없음</span>
        </div>
      </div>
      <label class="fld fld--row">
        <input type="checkbox" v-model="createForm.paused" />
        <span>일시중지 상태로 생성 <small class="hint">체크 시 '재개' 전까지 작업을 받지 않음</small></span>
      </label>
      <template #footer>
        <button class="act act--ghost" @click="createOpen = false">취소</button>
        <button class="act act--primary" :disabled="creating" @click="saveCreate">저장</button>
      </template>
    </WDrawer>

    <WDrawer v-model:open="crudOpen" title="워커 배정" description="워커가 처리할 회사·보험사를 지정하세요.">
      <div v-if="editing" class="ro">
        <div class="ro-item"><span>이름</span><b>{{ editing.name }}</b></div>
        <div class="ro-item"><span>유형</span><b>{{ editing.type }}</b></div>
        <div class="ro-item"><span>호스트</span><b class="mono">{{ editing.host }}</b></div>
      </div>

      <div class="fld">
        <span>회사 <small class="hint">선택 안 하면 어느 회사에도 속하지 않아 작업을 받지 않음</small></span>
        <div class="chips">
          <button v-for="c in clients ?? []" :key="c.id" type="button" class="chip"
            :class="{ 'chip--on': companyIds.includes(c.id) }" @click="toggleCompany(c.id)"><span class="chip-t" :title="c.name">{{ c.name }}</span></button>
          <span v-if="!(clients ?? []).length" class="chips-empty">회사 없음</span>
        </div>
      </div>

      <div class="fld">
        <span>보험사</span>
        <div class="chips">
          <button v-for="i in insurers ?? []" :key="i.id" type="button" class="chip"
            :class="{ 'chip--on': insurerIds.includes(i.id) }" @click="toggleInsurer(i.id)"><span class="chip-t" :title="i.name">{{ i.name }}</span></button>
          <span v-if="!(insurers ?? []).length" class="chips-empty">보험사 없음</span>
        </div>
      </div>

      <template #footer>
        <button class="act act--ghost" @click="crudOpen = false">취소</button>
        <button class="act act--primary" @click="save">저장</button>
      </template>
    </WDrawer>

    <WConfirm v-model:open="confirmOpen" title="워커 삭제"
      :message="`'${pendingRemove?.name ?? ''}' 워커를 삭제하시겠습니까?`" @confirm="confirmRemove" />

    <WDrawer v-model:open="keyOpen" title="API 키" description="워커 API 키입니다. 지금 복사해 두세요.">
      <p class="warn">이 키는 지금만 표시되며 다시 확인할 수 없습니다. 안전한 곳에 복사해 두세요.</p>
      <pre class="codeblock">{{ revealedKey }}</pre>
      <p v-if="keyForCreate && keyCreateNoCompany" class="hint">회사가 배정되지 않은 워커는 작업을 받지 않습니다. 필요하면 목록의 「배정」에서 지정하세요.</p>
      <template #footer>
        <button class="act act--ghost" @click="keyOpen = false">닫기</button>
        <button class="act act--primary" @click="copyKey">복사</button>
      </template>
    </WDrawer>
  </section>
</template>

<style scoped>
/* .fld / .act come from the global DS (assets/css/components.css). */
.panel { background: var(--panel); border: 1px solid var(--line); border-radius: 14px; overflow: hidden; box-shadow: var(--rim), var(--elev); }
.warn { margin: 0; font-size: 12px; color: var(--fail); font-weight: 600; }
.codeblock { margin: 0; padding: 10px 12px; border: 1px solid var(--line); border-radius: 9px; background: var(--th); color: var(--ink); font-family: var(--font-mono); font-size: 13px; white-space: pre-wrap; word-break: break-all; }

/* Read-only worker facts (worker-reported, not editable) */
.ro { display: flex; flex-direction: column; gap: 6px; padding: 10px 12px; border: 1px solid var(--line); border-radius: 9px; background: var(--th); }
.ro-item { display: flex; justify-content: space-between; gap: 12px; font-size: 13px; }
.ro-item span { color: var(--ink-2); }
.ro-item .mono { font-family: var(--font-mono); font-size: 12px; }

.hint { font-weight: 400; color: var(--ink-2); font-size: 11px; margin-left: 6px; }
/* equal-width chips on an aligned grid so rows & columns line up; chips stay on
   a single line. A name too long for its column is ellipsis-truncated inside the
   button (full name on hover) instead of bleeding into the padding — the inner
   label owns the ellipsis so the button's padding stays intact. */
.chips { display: grid; grid-template-columns: repeat(auto-fill, minmax(108px, 1fr)); gap: 6px; }
.chips-empty { font-size: 12px; color: var(--ink-2); grid-column: 1 / -1; }
.chip { display: flex; align-items: center; justify-content: center; min-width: 0; padding: 6px 11px; border-radius: 999px; border: 1px solid var(--line); background: var(--panel); color: var(--ink-2); font-size: 12.5px; cursor: pointer; transition: all .12s ease; }
.chip-t { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.chip:hover { border-color: var(--run); color: var(--ink); }
.chip--on { background: var(--nav-active); border-color: var(--run); color: var(--run); font-weight: 600; }
</style>
