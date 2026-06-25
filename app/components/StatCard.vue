<!-- app/components/StatCard.vue -->
<script setup lang="ts">
import type { StatusKind } from '~/utils/status'
defineProps<{ label: string; value: string; kind?: StatusKind; sub?: string }>()
</script>
<template>
  <div class="stat">
    <div class="stat-head">
      <span class="dot" :class="`dot--${kind ?? 'idle'}`"></span>
      <span class="stat-label">{{ label }}</span>
    </div>
    <div class="stat-value">{{ value }}</div>
    <div v-if="sub" class="stat-sub">{{ sub }}</div>
  </div>
</template>
<style scoped>
.stat { background: var(--panel); border: 1px solid var(--line); border-radius: 14px; padding: 16px 18px; box-shadow: var(--rim), var(--elev); transition: transform .18s ease, box-shadow .18s ease; }
.stat:hover { transform: translateY(-3px); box-shadow: var(--rim), var(--elev-hi); }
.stat-head { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
.dot { width: 8px; height: 8px; border-radius: 2px; }
.dot--run  { background: var(--run);  box-shadow: 0 0 8px var(--run); }
.dot--idle { background: var(--idle); box-shadow: 0 0 8px var(--idle); }
.dot--fail { background: var(--fail); box-shadow: 0 0 8px var(--fail); }
.dot--done { background: var(--done); box-shadow: 0 0 8px var(--done); }
.stat-label { font-size: 12.5px; font-weight: 600; color: var(--ink-2); }
.stat-value { font-family: var(--font-display); font-size: 34px; font-weight: 700; line-height: 1; color: var(--ink); font-variant-numeric: tabular-nums; }
.stat-sub { font-size: 11.5px; color: var(--ink-2); margin-top: 6px; }
@media (prefers-reduced-motion: reduce) { .stat { transition: none; } }
</style>
