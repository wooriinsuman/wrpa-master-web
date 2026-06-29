<!-- app/components/WDataTable.vue -->
<script setup lang="ts">
import { isStatusCell } from '~/utils/status'
export interface Column { key: string; label: string; kind?: 'text' | 'mono' | 'muted' | 'status' }
const props = defineProps<{ columns: Column[]; rows: Record<string, any>[]; actionsWidth?: number }>()
</script>
<template>
  <div class="dt-wrap" :style="{ '--dt-actions-w': `${props.actionsWidth ?? 128}px` }">
    <div class="dt-min">
      <div class="dt-head">
        <div v-for="c in columns" :key="c.key" class="dt-th">{{ c.label }}</div>
        <div class="dt-th dt-actions-h">액션</div>
      </div>
      <div v-if="rows.length === 0" class="dt-empty">
        <slot name="empty">데이터가 없습니다.</slot>
      </div>
      <div v-for="(row, i) in rows" :key="i" class="dt-row">
        <div v-for="c in columns" :key="c.key" class="dt-td" :class="`dt-td--${c.kind ?? 'text'}`">
          <template v-if="c.kind === 'status'">
            <WStatusBadge v-if="isStatusCell(row[c.key])" :label="row[c.key].label" :kind="row[c.key].kind" />
            <WStatusBadge v-else :label="String(row[c.key])" />
          </template>
          <span v-else>{{ row[c.key] }}</span>
        </div>
        <div class="dt-td dt-actions"><slot name="actions" :row="row" /></div>
      </div>
    </div>
  </div>
</template>
<style scoped>
/* When the wrap is a flex child of a height-bounded .panel (list pages) it
   fills the remaining space and scrolls internally; elsewhere (e.g. dashboard)
   it has no bounded height, so it simply grows to content. */
.dt-wrap { flex: 1; min-height: 0; overflow: auto; }
.dt-min { min-width: 680px; }
.dt-head { position: sticky; top: 0; z-index: 2; display: flex; align-items: center; background: var(--th); border-bottom: 1px solid var(--line); }
.dt-th { flex: 1; min-width: 0; padding: 11px 16px; font-size: 12.5px; letter-spacing: .04em; text-transform: uppercase; color: var(--ink-2); font-weight: 600; white-space: nowrap; text-align: center; }
.dt-actions-h { flex: none; width: var(--dt-actions-w, 128px); text-align: center; }
.dt-row { display: flex; align-items: center; border-top: 1px solid var(--line); transition: background .15s ease; }
.dt-row:first-child { border-top: none; }
.dt-row:hover { background: var(--th); }
.dt-td { flex: 1; min-width: 0; padding: 11px 16px; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--ink); text-align: center; }
.dt-td--mono { font-family: var(--font-mono); }
.dt-td--muted { font-family: var(--font-mono); font-size: 12px; color: var(--ink-2); }
.dt-actions { flex: none; width: var(--dt-actions-w, 128px); display: flex; gap: 6px; justify-content: center; }
.dt-empty { padding: 32px 16px; text-align: center; font-size: 13px; color: var(--ink-2); }
</style>
