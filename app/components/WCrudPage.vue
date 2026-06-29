<!-- app/components/WCrudPage.vue -->
<script setup lang="ts" generic="Row extends CrudRow">
import type { CrudRow } from '~/utils/crud'
import type { Column } from '~/components/WDataTable.vue'

defineProps<{
  title: string
  desc?: string
  addLabel: string
  emptyTitle: string
  columns: Column[]
  rows: Row[]
  pending: boolean
  drawerTitle: string
  drawerDescription?: string
  editable?: boolean
  actionsWidth?: number
}>()

const emit = defineEmits<{
  add: []
  save: []
  edit: [row: Row]
  remove: [row: Row]
}>()

const search = defineModel<string>('search', { default: '' })
const drawerOpen = defineModel<boolean>('drawerOpen', { default: false })
</script>

<template>
  <section class="panel">
    <WPageHeader :title="title" :desc="desc" :add-label="addLabel" v-model:search="search" @add="emit('add')" />
    <WDataTable v-if="rows.length" :columns="columns" :rows="rows" :actions-width="actionsWidth">
      <template #actions="{ row }">
        <slot name="row-actions-lead" :row="(row as Row)" />
        <button v-if="editable" class="act act--ghost" @click="emit('edit', row as Row)">상세</button>
        <button class="act act--danger" @click="emit('remove', row as Row)">삭제</button>
      </template>
    </WDataTable>
    <WEmptyState
      v-else
      :title="emptyTitle"
      :message="pending ? '불러오는 중…' : '아래에서 새 항목을 등록하세요.'"
      :cta-label="addLabel"
      @cta="emit('add')"
    />

    <WDrawer v-model:open="drawerOpen" :title="drawerTitle" :description="drawerDescription">
      <slot name="fields" />
      <template #footer>
        <button class="act act--ghost" @click="drawerOpen = false">취소</button>
        <button class="act act--primary" @click="emit('save')">저장</button>
      </template>
    </WDrawer>
  </section>
</template>

<style scoped>
.panel { background: var(--panel); border: 1px solid var(--line); border-radius: 14px; overflow: hidden; box-shadow: var(--rim), var(--elev); }
:deep(.act) { padding: 5px 11px; border-radius: 8px; font-family: var(--font-sans); font-size: 12px; font-weight: 600; cursor: pointer; white-space: nowrap; }
:deep(.act--ghost) { background: transparent; border: 1px solid var(--line); color: var(--ink-2); }
:deep(.act--danger) { background: transparent; border: 1px solid var(--line); color: var(--fail); }
:deep(.act--primary) { background: var(--run); border: none; color: var(--on-accent); box-shadow: 0 2px 8px var(--run-shadow); }
:deep(.fld) { display: flex; flex-direction: column; gap: 6px; font-size: 12px; font-weight: 600; color: var(--ink-2); }
:deep(.fld input), :deep(.fld select) { padding: 10px 12px; border: 1px solid var(--line); border-radius: 9px; font-size: 13px; background: var(--th); color: var(--ink); }
:deep(.fld input:disabled) { opacity: .6; }
:deep(.fld--row) { flex-direction: row; align-items: center; }
</style>
