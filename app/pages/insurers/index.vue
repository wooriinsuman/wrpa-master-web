<script setup lang="ts">
import { ref, computed } from 'vue'
import type { components } from '#shared/types/api'
import type { Column } from '~/components/WDataTable.vue'
import type { CrudRow } from '~/utils/crud'
import type { StatusCell } from '~/utils/status'
import type { InsurerForm } from '~/utils/insurerForm'

type View = components['schemas']['InsuranceCompanyView']
interface InsurerRow extends CrudRow { status: StatusCell; name: string; code: string; type: string; typeEnum: string; url: string }

// 생손보 구분: 저장은 enum, 표시는 한글 라벨.
const TYPE_LABELS: Record<string, string> = { LIFE: '생보', PROPERTY: '손보', GUARANTEE: '보증', UNKNOWN: '미상' }
const TYPE_ORDER = ['생보', '손보', '보증', '미상']
const TYPE_OPTIONS = (Object.keys(TYPE_LABELS) as string[]).map(v => ({ value: v, label: TYPE_LABELS[v]! }))

const columns: Column[] = [
  { key: 'name', label: '보험사명', kind: 'text' },
  { key: 'code', label: '코드', kind: 'mono' },
  { key: 'type', label: '구분', kind: 'text', order: TYPE_ORDER },
  { key: 'status', label: '상태', kind: 'status' },
  { key: 'url', label: 'URL', kind: 'muted' },
]

function toRow(v: View): InsurerRow {
  return {
    id: v.id,
    name: v.name,
    code: v.code,
    type: TYPE_LABELS[v.type] ?? v.type,
    typeEnum: v.type,
    status: { label: v.active ? '활성' : '정지', kind: v.active ? 'done' : 'idle' } as StatusCell,
    url: v.url,
  }
}

function toForm(v: View): InsurerForm {
  return { code: v.code, name: v.name, type: v.type, url: v.url, active: v.active }
}

function blank(): InsurerForm {
  return { code: '', name: '', type: 'PROPERTY', url: '', active: true }
}

const { rows, search, pending, drawerOpen, editingId, form, openCreate, openEdit, save, remove, refresh } = await useCrudPage<View, InsurerForm, InsurerRow>({
  key: 'insurers',
  resource: useInsurers(),
  blank,
  toRow,
  toForm,
  searchKeys: ['name', 'code', 'url'],
  messages: { removed: '보험사를 삭제했습니다.' },
})

// 구분 칩 필터 (검색과 별개, AND). null = 전체.
const typeFilter = ref<string | null>(null)
const visibleRows = computed(() =>
  typeFilter.value ? rows.value.filter(r => r.typeEnum === typeFilter.value) : rows.value,
)
</script>

<template>
  <WCrudPage
    title="보험사"
    desc="자동화 대상 보험사"
    add-label="+ 보험사 등록"
    empty-title="보험사가 없습니다"
    remove-noun="보험사"
    index-column
    :drawer-title="editingId ? '보험사 수정' : '보험사 등록'"
    drawer-description="보험사 정보를 입력한 뒤 저장하세요."
    :columns="columns"
    :rows="visibleRows"
    :pending="pending"
    editable
    v-model:search="search"
    v-model:drawer-open="drawerOpen"
    @add="openCreate"
    @refresh="refresh"
    @edit="openEdit"
    @save="save"
    @remove="remove"
  >
    <template #toolbar>
      <div class="ins-toolbar">
        <div class="chips">
          <button class="chip" :class="{ 'chip--on': typeFilter === null }" @click="typeFilter = null">전체</button>
          <button
            v-for="opt in TYPE_OPTIONS"
            :key="opt.value"
            class="chip"
            :class="{ 'chip--on': typeFilter === opt.value }"
            @click="typeFilter = opt.value"
          >{{ opt.label }}</button>
        </div>
        <div class="count">
          <strong>{{ visibleRows.length }}</strong>개<span v-if="visibleRows.length !== rows.length" class="count-total"> / 전체 {{ rows.length }}</span>
        </div>
      </div>
    </template>

    <template #fields>
      <label class="fld"><span>코드 <span class="req">*</span></span>
        <input v-model="form.code" placeholder="samsung_property" :disabled="!!editingId" />
        <small v-if="editingId" class="fld-hint">코드는 자산·계정 연결 키라 수정할 수 없습니다.</small>
      </label>
      <label class="fld"><span>보험사명 <span class="req">*</span></span><input v-model="form.name" placeholder="삼성화재" /></label>
      <label class="fld"><span>구분</span>
        <select v-model="form.type">
          <option v-for="opt in TYPE_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </label>
      <label class="fld"><span>URL</span><input v-model="form.url" placeholder="https://" /></label>
      <label class="fld fld--row"><input type="checkbox" v-model="form.active" /><span>활성</span></label>
    </template>
  </WCrudPage>
</template>

<style scoped>
.ins-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; padding: 10px 18px; border-bottom: 1px solid var(--line); }
.chips { display: flex; gap: 6px; flex-wrap: wrap; }
.chip { padding: 5px 12px; border-radius: 999px; border: 1px solid var(--line); background: var(--th); color: var(--ink-2); font-size: 12.5px; font-weight: 600; cursor: pointer; transition: all .15s ease; }
.chip:hover { color: var(--ink); border-color: var(--idle); }
.chip--on { background: var(--run); border-color: var(--run); color: var(--on-accent); }
.count { font-size: 12.5px; color: var(--ink-2); white-space: nowrap; }
.count strong { color: var(--ink); font-family: var(--font-mono); }
.count-total { color: var(--ink-2); }
.fld-hint { margin-top: 4px; font-size: 11.5px; color: var(--ink-2); }
</style>
