<!-- app/pages/index.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import type { Column } from '~/components/WDataTable.vue'
import type { FleetCell } from '~/components/FleetStrip.vue'
import type { StatusCell } from '~/utils/status'
import { workerStateKind, workStateKind, formatAge, ageColorKind } from '~/utils/dashboardState'

const { workers, works, pending } = useDashboard()
const nowSec = Math.floor((globalThis.Date?.now?.() ?? 0) / 1000)

const cells = computed<FleetCell[]>(() => workers.value.map(w => ({
  key: w.name,
  kind: workerStateKind(w.state),
  age: formatAge(w.lastConnectedAt ?? undefined, nowSec),
  ageKind: ageColorKind(w.lastConnectedAt ?? undefined, nowSec),
  sub: w.host || w.state || '—',
})))

const counts = computed(() => {
  const online = workers.value.filter(w => workerStateKind(w.state) !== 'idle').length
  const running = works.value.filter(w => workStateKind(w.state) === 'run').length
  const failed = works.value.filter(w => workStateKind(w.state) === 'fail').length
  const done = works.value.filter(w => workStateKind(w.state) === 'done').length
  return { fleet: workers.value.length, online, running, failed, done }
})
const fleetN = useCountUp(computed(() => counts.value.fleet))
const onlineN = useCountUp(computed(() => counts.value.online))
const runningN = useCountUp(computed(() => counts.value.running))
const failedN = useCountUp(computed(() => counts.value.failed))

const workCols: Column[] = [
  { key: 'status', label: '상태', kind: 'status' },
  { key: 'id', label: 'Work ID', kind: 'mono' },
  { key: 'company', label: '회사', kind: 'text' },
  { key: 'state', label: '단계', kind: 'text' },
]
const workRows = computed(() => works.value
  .filter(w => workStateKind(w.state) === 'run')
  .map(w => ({
    status: { label: w.state === 'started' ? '실행중' : w.state, kind: workStateKind(w.state) } as StatusCell,
    id: w.id, company: w.company, state: w.state,
  })))
</script>

<template>
  <div class="dash">
    <div class="vitals">
      <div class="vital"><span class="vl">함대</span><span class="vv">{{ fleetN }}</span></div>
      <div class="vital"><span class="vl">온라인</span><span class="vv vv--done">{{ onlineN }}</span></div>
      <div class="vital"><span class="vl">실행</span><span class="vv vv--run">{{ runningN }}</span></div>
      <div class="vital"><span class="vl">실패</span><span class="vv vv--fail">{{ failedN }}</span></div>
    </div>

    <section class="panel reveal">
      <div class="panel-head">
        <span class="live-dot"></span>
        <h2>라이브 하트비트 · 함대</h2>
        <span class="muted mono">{{ counts.fleet }} workers</span>
      </div>
      <FleetStrip v-if="cells.length" :cells="cells" />
      <WEmptyState v-else title="연결된 워커가 없습니다" :message="pending ? '불러오는 중…' : '워커가 연결되면 여기에 표시됩니다.'" />
    </section>

    <div class="stats reveal">
      <StatCard label="실행중" :value="String(runningN)" kind="run" sub="활성 워크" />
      <StatCard label="온라인" :value="String(onlineN)" kind="done" sub="연결된 워커" />
      <StatCard label="실패" :value="String(failedN)" kind="fail" sub="실패한 워크" />
      <StatCard label="함대" :value="String(fleetN)" kind="idle" sub="전체 워커" />
    </div>

    <section class="panel reveal">
      <div class="panel-head">
        <h2>진행 중인 작업</h2>
        <span class="muted mono">{{ workRows.length }} running</span>
        <NuxtLink to="/schedule-queue" class="queue-link">작업 큐 →</NuxtLink>
      </div>
      <WDataTable v-if="workRows.length" :columns="workCols" :rows="workRows">
        <template #actions><span class="muted mono">—</span></template>
      </WDataTable>
      <WEmptyState v-else title="진행 중인 작업이 없습니다" :message="pending ? '불러오는 중…' : '실행 중인 작업이 없습니다.'" />
    </section>
  </div>
</template>

<style scoped>
.dash { display: flex; flex-direction: column; gap: 18px; }
.vitals { display: flex; gap: 8px; flex-wrap: wrap; }
.vital { display: flex; flex-direction: column; padding: 6px 12px; border-radius: 9px; background: var(--th); border: 1px solid var(--line); }
.vl { font-size: 9px; letter-spacing: .07em; text-transform: uppercase; color: var(--ink-2); }
.vv { font-family: var(--font-mono); font-size: 16px; font-weight: 600; color: var(--ink); font-variant-numeric: tabular-nums; }
.vv--done { color: var(--done); } .vv--run { color: var(--run); } .vv--fail { color: var(--fail); }
.panel { background: var(--panel); border: 1px solid var(--line); border-radius: 14px; padding: 18px; box-shadow: var(--rim), var(--elev); }
.panel-head { display: flex; align-items: center; gap: 10px; margin-bottom: 15px; }
.panel-head h2 { margin: 0; font-family: var(--font-display); font-size: 15px; font-weight: 700; color: var(--ink); }
.live-dot { width: 9px; height: 9px; border-radius: 50%; background: var(--run); box-shadow: 0 0 0 4px rgba(45,125,210,.16), 0 0 10px var(--run); }
.muted { font-size: 11px; color: var(--ink-2); } .mono { font-family: var(--font-mono); }
.queue-link { margin-left: auto; font-size: 12px; font-weight: 600; color: var(--run); text-decoration: none; }
.queue-link:hover { text-decoration: underline; }
.stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(168px, 1fr)); gap: 14px; }
.reveal { animation: wrpaRise .4s ease both; }
@keyframes wrpaRise { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
@media (prefers-reduced-motion: reduce) { .reveal { animation: none; } }
</style>
