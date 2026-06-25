<!-- app/components/WDataTable.vue -->
<script setup lang="ts">
import { isStatusCell } from '~/utils/status'
export interface Column { key: string; label: string; kind?: 'text' | 'mono' | 'muted' | 'status' }
defineProps<{ columns: Column[]; rows: Record<string, any>[] }>()
</script>
<template>
  <div class="dt-wrap">
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
.dt-wrap { overflow-x: auto; }
.dt-min { min-width: 680px; }
.dt-head { display: flex; align-items: center; background: var(--th); }
.dt-th { flex: 1; min-width: 0; padding: 10px 16px; font-size: 10px; letter-spacing: .06em; text-transform: uppercase; color: var(--ink-2); font-weight: 600; white-space: nowrap; }
.dt-actions-h { flex: none; width: 128px; text-align: right; }
.dt-row { display: flex; align-items: center; border-top: 1px solid var(--line); transition: background .15s ease; }
.dt-row:hover { background: var(--th); }
.dt-td { flex: 1; min-width: 0; padding: 11px 16px; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--ink); }
.dt-td--mono { font-family: var(--font-mono); }
.dt-td--muted { font-family: var(--font-mono); font-size: 12px; color: var(--ink-2); }
.dt-actions { flex: none; width: 128px; display: flex; gap: 6px; justify-content: flex-end; }
.dt-empty { padding: 32px 16px; text-align: center; font-size: 13px; color: var(--ink-2); }
</style>
