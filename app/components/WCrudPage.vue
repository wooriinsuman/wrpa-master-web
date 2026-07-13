<!-- app/components/WCrudPage.vue -->
<script setup lang="ts" generic="Row extends CrudRow">
import { ref } from 'vue'
import type { CrudRow } from '~/utils/crud'
import type { Column } from '~/components/WDataTable.vue'

const props = defineProps<{
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
  indexColumn?: boolean
  // Label shown inside the delete confirm ("<removeNoun> 삭제하시겠습니까?").
  removeNoun?: string
}>()

const emit = defineEmits<{
  add: []
  save: []
  edit: [row: Row]
  remove: [row: Row]
}>()

const search = defineModel<string>('search', { default: '' })
const drawerOpen = defineModel<boolean>('drawerOpen', { default: false })

// Destructive deletes are gated behind a confirm dialog (all CRUD pages).
const confirmOpen = ref(false)
const pendingRow = ref<Row | null>(null)
function askRemove(row: Row) { pendingRow.value = row; confirmOpen.value = true }
function confirmRemove() {
  if (pendingRow.value) emit('remove', pendingRow.value)
  pendingRow.value = null
}
</script>

<template>
  <section class="panel">
    <WPageHeader :title="title" :desc="desc" :add-label="addLabel" v-model:search="search" @add="emit('add')">
      <template #header-actions>
        <slot name="header-actions" />
      </template>
    </WPageHeader>
    <slot name="toolbar" />
    <WDataTable v-if="rows.length" :columns="columns" :rows="rows" :actions-width="actionsWidth" :index-column="indexColumn">
      <template #actions="{ row }">
        <slot name="row-actions-lead" :row="(row as Row)" />
        <button v-if="editable" class="act act--ghost" @click="emit('edit', row as Row)">상세</button>
        <button class="act act--danger" @click="askRemove(row as Row)">삭제</button>
      </template>
    </WDataTable>
    <WEmptyState
      v-else
      :title="emptyTitle"
      :message="pending ? '불러오는 중…' : '아래에서 새 항목을 등록하세요.'"
      :cta-label="addLabel"
      @cta="emit('add')"
    />

    <WConfirm
      v-model:open="confirmOpen"
      :title="`${removeNoun ?? '항목'} 삭제`"
      message="삭제하면 되돌릴 수 없습니다. 계속하시겠습니까?"
      confirm-label="삭제"
      @confirm="confirmRemove"
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
/* Form fields & action buttons come from the global DS (assets/css/components.css). */
.panel { background: var(--panel); border: 1px solid var(--line); border-radius: 14px; overflow: hidden; box-shadow: var(--rim), var(--elev); }
</style>
