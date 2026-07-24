<script setup lang="ts">
import { computed, ref } from 'vue'
import type { components } from '#shared/types/api'
import type { Column } from '~/components/WDataTable.vue'
import type { StatusCell, StatusKind } from '~/utils/status'
import { categoryLabel } from '~/utils/category'
import { extractApiError } from '~/utils/apiError'

type Entry = components['schemas']['ScheduleQueueEntry']

interface QueueRow {
  idx: number
  company: string
  category: string
  closingMonth: string
  runTime: string
  tasks: string
  priority: number
  status: StatusCell
  _src: Entry
}

const queue = useScheduleQueue()
const dataTypes = useDataTypes()
const { push } = useToast()
// setPriority/cancel은 /works/{id}/... 엔드포인트라 백엔드에서 RankSystem
// 전용이다(RankAdmin이 아님 — app.go의 works 라우트 그룹 참고) — 우선순위
// 편집/취소 컨트롤은 SYSTEM에게만 노출한다.
const authStore = useAuthStore()

function today(): string {
  return new Date().toISOString().slice(0, 10)
}
const date = ref(today())
const view = ref<'all' | string>('all') // 'all' 또는 workerId

const { data, pending, refresh } = await useAsyncData(
  'schedule-queue',
  () => queue.get(date.value),
  { watch: [date] },
)
const { data: dtList } = await useAsyncData('schedule-queue-datatypes', () => dataTypes.list())
const dataTypeNames = computed<Record<string, string>>(() =>
  Object.fromEntries((dtList.value ?? []).map(d => [d.code, d.name])))

const entries = computed<Entry[]>(() => data.value?.entries ?? [])
const workers = computed(() => data.value?.workers ?? [])

// 워커별 보기 = "그 워커가 가져갈 수 있는 후보"의 소진 순서 — 같은 회사를 여러
// 워커가 공유하면 실제 배정은 경쟁이라 1:1 예언이 아니다.
const visibleEntries = computed<Entry[]>(() => {
  if (view.value === 'all') return entries.value
  const w = workers.value.find(w => w.workerId === view.value)
  return (w?.entryIndexes ?? []).map(i => entries.value[i]).filter((e): e is Entry => !!e)
})

// planned(시뮬레이션 미생성)·pending(대기)은 아직 실행 전이니 idle, started는
// run, done은 done, cancel/failed는 fail로 접는다. (StatusKind에는 busy가
// 없어 '실행중'은 run으로 대체.)
function statusKind(status: string): StatusKind {
  if (status === 'started') return 'run'
  if (status === 'done') return 'done'
  if (status === 'cancel' || status === 'failed') return 'fail'
  return 'idle'
}

const columns: Column[] = [
  { key: 'idx', label: '#', kind: 'mono' },
  { key: 'company', label: '보험사', kind: 'mono' },
  { key: 'category', label: '카테고리', kind: 'text' },
  { key: 'closingMonth', label: '업적월', kind: 'mono' },
  { key: 'runTime', label: '실행시각', kind: 'mono' },
  { key: 'tasks', label: 'tasks', kind: 'text' },
  { key: 'priority', label: '우선순위', kind: 'mono' },
  { key: 'status', label: '상태', kind: 'status' },
]

const rows = computed<QueueRow[]>(() => visibleEntries.value.map((e, i) => ({
  idx: i + 1,
  company: e.insuranceCompanyCode,
  category: categoryLabel(e.category, dataTypeNames.value),
  closingMonth: e.closingMonth,
  runTime: e.runTime,
  tasks: e.tasks.join(', ') || '—',
  priority: e.priority,
  status: { label: e.status, kind: statusKind(e.status) } as StatusCell,
  _src: e,
})))

function isPending(e: Entry): boolean {
  return !!e.workId && e.status === 'pending'
}

// priority 인라인 수정: pending만 (백엔드가 409로 방어하지만 UI에서도 막는다)
const editing = ref<Record<string, number>>({})
function priorityDraft(e: Entry): number {
  return (e.workId && editing.value[e.workId] !== undefined) ? editing.value[e.workId]! : e.priority
}
function onPriorityInput(e: Entry, ev: Event) {
  if (!e.workId) return
  editing.value[e.workId] = Number((ev.target as HTMLInputElement).value)
}
async function savePriority(e: Entry) {
  if (!e.workId) return
  const p = editing.value[e.workId]
  if (p === undefined || p === e.priority) return
  try {
    await queue.setPriority(e.workId, p)
    push('우선순위가 변경되었습니다.', 'success')
    await refresh()
  } catch (err: any) {
    push(extractApiError(err, '변경에 실패했습니다. (대기 중 작업만 조정 가능)'), 'error')
  }
}

async function cancelWork(e: Entry) {
  if (!e.workId) return
  if (!confirm('이 작업을 취소할까요?')) return
  try {
    await queue.cancel(e.workId)
    push('취소되었습니다.', 'success')
    await refresh()
  } catch (err: any) {
    push(extractApiError(err, '취소에 실패했습니다.'), 'error')
  }
}
</script>

<template>
  <section class="panel">
    <div class="hd">
      <div>
        <div class="hd-title">작업 큐</div>
        <div class="hd-desc">
          영업일 {{ data?.businessDay ?? '-' }}일차{{ data?.simulated ? ' · 시뮬레이션(선생성 전)' : '' }} — 위에서부터 소진됩니다
        </div>
      </div>
      <div class="hd-actions">
        <input v-model="date" type="date" class="hd-field" />
        <select v-model="view" class="hd-field">
          <option value="all">전체 큐</option>
          <option v-for="w in workers" :key="w.workerId" :value="w.workerId">{{ w.name || w.workerId }}</option>
        </select>
        <button class="act act--ghost" @click="refresh()">새로고침</button>
      </div>
    </div>

    <WDataTable v-if="rows.length" :columns="columns" :rows="rows" :actions-width="190">
      <template #actions="{ row }">
        <template v-if="authStore.isSystem && isPending((row as QueueRow)._src)">
          <input
            type="number"
            class="mono pr-input"
            :value="priorityDraft((row as QueueRow)._src)"
            @input="onPriorityInput((row as QueueRow)._src, $event)"
            @change="savePriority((row as QueueRow)._src)"
          />
          <button class="act act--danger" @click="cancelWork((row as QueueRow)._src)">취소</button>
        </template>
        <span v-else class="muted">—</span>
      </template>
    </WDataTable>
    <WEmptyState
      v-else
      title="해당 날짜에 예정된 작업이 없습니다"
      :message="pending ? '불러오는 중…' : '다른 날짜를 선택해 보세요.'"
    />

    <p class="muted note">
      워커별 보기는 "그 워커가 가져갈 수 있는 후보"의 순서입니다 — 같은 회사를 여러 워커가
      공유하면 실제 배정은 경쟁이라 1:1 예언이 아닙니다.
    </p>
  </section>
</template>

<style scoped>
/* .fld / .act come from the global DS (assets/css/components.css). */
.panel { background: var(--panel); border: 1px solid var(--line); border-radius: 14px; overflow: hidden; box-shadow: var(--rim), var(--elev); }
.hd { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; padding: 16px 18px; border-bottom: 1px solid var(--line); }
.hd-title { font-family: var(--font-display); font-size: 15px; font-weight: 700; color: var(--ink); }
.hd-desc { font-size: 12px; color: var(--ink-2); margin-top: 2px; }
.hd-actions { display: flex; gap: 10px; align-items: center; }
.hd-field { padding: 8px 12px; border: 1px solid var(--line); border-radius: 9px; font-family: var(--font-mono); font-size: 12.5px; background: var(--th); color: var(--ink); }
.pr-input { width: 5.5rem; padding: 5px 8px; border: 1px solid var(--line); border-radius: 7px; background: var(--panel); color: var(--ink); }
.muted { font-size: 12px; color: var(--ink-2); }
.note { padding: 14px 18px 18px; margin: 0; }
</style>
