<!-- app/components/FleetStrip.vue -->
<script setup lang="ts">
import type { StatusKind } from '~/utils/status'
export interface FleetCell { key: string; kind: StatusKind; age: string; ageKind: StatusKind; sub: string }
defineProps<{ cells: FleetCell[] }>()
// deterministic state-based sparkline points (decorative)
const SERIES: Record<StatusKind, number[]> = {
  run: [.4,.72,.5,.86,.6,.9,.55,.78], done: [.5,.62,.56,.66,.6,.7,.63,.61],
  idle: [.3,.28,.33,.29,.31,.27,.3,.28], fail: [.62,.55,.4,.3,.16,.09,.05,.04],
}
function spark(kind: StatusKind): string {
  const arr = SERIES[kind]
  return arr.map((v, k) => `${(k * (64 / (arr.length - 1))).toFixed(1)},${(16 - v * 13 - 1.5).toFixed(1)}`).join(' ')
}
</script>
<template>
  <div class="grid">
    <div v-for="c in cells" :key="c.key" class="cell">
      <div class="cell-head">
        <span class="hb">
          <span class="pulse" :class="`pulse--${c.kind}`"></span>
          <span class="core" :class="`core--${c.kind}`"></span>
        </span>
        <span class="age" :class="`age--${c.ageKind}`">{{ c.age }}</span>
      </div>
      <div class="key">{{ c.key }}</div>
      <div class="sub">{{ c.sub }}</div>
      <svg class="spark" width="100%" height="16" viewBox="0 0 64 16" preserveAspectRatio="none">
        <polyline :points="spark(c.kind)" fill="none" :class="`stroke--${c.kind}`" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round" />
      </svg>
    </div>
  </div>
</template>
<style scoped>
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(122px, 1fr)); gap: 10px; }
.cell { position: relative; background: var(--cell); border: 1px solid var(--line); border-radius: 11px; padding: 11px 12px; overflow: hidden; box-shadow: var(--rim), var(--elev); transition: transform .18s ease, box-shadow .18s ease; }
.cell:hover { transform: translateY(-3px); box-shadow: var(--rim), var(--elev-hi); }
.cell-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 9px; }
.hb { position: relative; width: 9px; height: 9px; }
.pulse, .core { position: absolute; inset: 0; border-radius: 50%; }
.pulse { transform-origin: center; animation: wrpaPulse 1.6s ease-out infinite; }
.pulse--run { background: var(--run); } .pulse--done { background: var(--done); }
.pulse--idle { background: var(--idle); animation-duration: 3s; } .pulse--fail { background: var(--fail); }
.core--run { background: var(--run); box-shadow: 0 0 8px var(--run); }
.core--done { background: var(--done); box-shadow: 0 0 8px var(--done); }
.core--idle { background: var(--idle); box-shadow: 0 0 8px var(--idle); }
.core--fail { background: var(--fail); box-shadow: 0 0 8px var(--fail); }
.age { font-family: var(--font-mono); font-size: 11px; font-weight: 600; }
.age--done { color: var(--done); } .age--idle { color: var(--ink-2); } .age--fail { color: var(--fail); } .age--run { color: var(--run); }
.key { font-family: var(--font-mono); font-size: 12.5px; font-weight: 600; color: var(--ink); }
.sub { font-family: var(--font-mono); font-size: 10.5px; color: var(--ink-2); margin-top: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.spark { display: block; margin-top: 8px; overflow: visible; opacity: .8; }
.stroke--run { stroke: var(--run); } .stroke--done { stroke: var(--done); } .stroke--idle { stroke: var(--idle); } .stroke--fail { stroke: var(--fail); }
@keyframes wrpaPulse { 0% { transform: scale(1); opacity: .5; } 100% { transform: scale(3.4); opacity: 0; } }
@media (prefers-reduced-motion: reduce) { .pulse { animation: none; } .cell { transition: none; } }
</style>
