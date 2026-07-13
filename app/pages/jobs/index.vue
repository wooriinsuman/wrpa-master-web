<script setup lang="ts">
import { ref, computed } from 'vue'
import type { components } from '#shared/types/api'
import type { Column } from '~/components/WDataTable.vue'
import type { StatusCell } from '~/utils/status'
import { workStateKind } from '~/utils/dashboardState'
import { blankWorkForm, type WorkForm } from '~/utils/workForm'
import { categoryLabel } from '~/utils/category'

type WorkView = components['schemas']['WorkView']
interface WorkRow { id: string; status: StatusCell; company: string; tasks: string; state: string; category: string }

const works = useWorks()
const dataTypes = useDataTypes()
const { push } = useToast()
const { data, refresh, pending } = await useAsyncData('works', () => works.list())
const { data: dtData } = await useAsyncData('works-datatypes', () => dataTypes.list())
const dataTypeNames = computed<Record<string, string>>(() =>
  Object.fromEntries((dtData.value ?? []).map(d => [d.code, d.name])))

const search = ref('')
const rows = computed<WorkRow[]>(() => {
  const list: WorkRow[] = (data.value ?? []).map(w => ({
    id: w.id,
    status: { label: w.state, kind: workStateKind(w.state) } as StatusCell,
    company: w.company,
    tasks: (w.tasks ?? []).join(', ') || '—',
    state: w.state,
    category: categoryLabel(w.category ?? '', dataTypeNames.value),
  }))
  const q = search.value.trim().toLowerCase()
  return q ? list.filter(r => [r.company, r.state, r.tasks].some(x => String(x).toLowerCase().includes(q))) : list
})

const columns: Column[] = [
  { key: 'status', label: '상태', kind: 'status' },
  { key: 'company', label: '보험사', kind: 'mono' },
  { key: 'category', label: '카테고리', kind: 'mono' },
  { key: 'tasks', label: '태스크', kind: 'text' },
  { key: 'id', label: '실행 ID', kind: 'muted' },
]

// enqueue drawer
const enqueueOpen = ref(false)
const form = ref<WorkForm>(blankWorkForm())
function openEnqueue() {
  form.value = blankWorkForm()
  enqueueOpen.value = true
}
async function submitEnqueue() {
  try {
    await works.enqueue(form.value)
    enqueueOpen.value = false
    await refresh()
    push('작업을 실행했습니다.', 'success')
  } catch (e: any) {
    push(e?.message ?? '작업 실행에 실패했습니다.', 'error')
  }
}

// result drawer (read-only)
const resultOpen = ref(false)
const selected = ref<WorkView | null>(null)
function openResult(row: WorkRow) {
  selected.value = (data.value ?? []).find(w => w.id === row.id) ?? null
  resultOpen.value = true
}
const paramsText = computed(() => selected.value?.parameters || '—')
const resultText = computed(() =>
  selected.value?.result ? JSON.stringify(selected.value.result, null, 2) : '결과가 없습니다.',
)
</script>

<template>
  <section class="panel">
    <WPageHeader title="진행 작업" desc="실행 중·완료된 작업" add-label="+ 작업 실행"
      v-model:search="search" @add="openEnqueue" />
    <WDataTable v-if="rows.length" :columns="columns" :rows="rows">
      <template #actions="{ row }">
        <button class="act act--ghost" @click="openResult(row as WorkRow)">결과</button>
      </template>
    </WDataTable>
    <WEmptyState v-else title="진행 중인 작업이 없습니다"
      :message="pending ? '불러오는 중…' : '작업을 실행하면 여기에 표시됩니다.'"
      cta-label="+ 작업 실행" @cta="openEnqueue" />

    <WDrawer v-model:open="enqueueOpen" title="작업 실행" description="보험사 코드와 태스크를 입력해 작업을 실행하세요.">
      <label class="fld"><span>보험사 코드 <span class="req">*</span></span><input v-model="form.company" placeholder="samsung_property" /></label>
      <label class="fld"><span>태스크 (쉼표 구분, 비우면 전체)</span><input v-model="form.tasksText" placeholder="contract_list_all_a, contract_list_all_b" /></label>
      <label class="fld"><span>파라미터 (JSON)</span><textarea v-model="form.parametersText" rows="4" placeholder='{"key":"value"}'></textarea></label>
      <label class="fld"><span>실행 시간 ms (기본 300000)</span><input v-model="form.lifetimeText" inputmode="numeric" placeholder="300000" /></label>
      <template #footer>
        <button class="act act--ghost" @click="enqueueOpen = false">취소</button>
        <button class="act act--primary" @click="submitEnqueue">실행</button>
      </template>
    </WDrawer>

    <WDrawer v-model:open="resultOpen" title="작업 결과" description="선택한 작업의 파라미터와 결과입니다.">
      <label class="fld"><span>파라미터</span><pre class="codeblock">{{ paramsText }}</pre></label>
      <label class="fld"><span>결과</span><pre class="codeblock">{{ resultText }}</pre></label>
      <template #footer>
        <button class="act act--ghost" @click="resultOpen = false">닫기</button>
      </template>
    </WDrawer>
  </section>
</template>

<style scoped>
/* .fld / .act come from the global DS (assets/css/components.css). */
.panel { background: var(--panel); border: 1px solid var(--line); border-radius: 14px; overflow: hidden; box-shadow: var(--rim), var(--elev); }
.codeblock { margin: 0; padding: 10px 12px; border: 1px solid var(--line); border-radius: 9px; background: var(--th); color: var(--ink); font-family: var(--font-mono); font-size: 12px; white-space: pre-wrap; word-break: break-all; max-height: 240px; overflow: auto; }
</style>
