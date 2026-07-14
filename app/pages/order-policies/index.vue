<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { components } from '#shared/types/api'
import type { Column } from '~/components/WDataTable.vue'
import { categoryLabel, buildCategoryKey, offsetLabel, sortByDataTypeOrder } from '~/utils/category'
import { extractApiError } from '~/utils/apiError'
import {
  moveOrder,
  validateOrderPolicyForm,
  type OrderPolicyForm,
  type PolicyRowForm,
} from '~/utils/orderPolicyForm'

type View = components['schemas']['OrderPolicyView']
interface PolicyListRow { id: string; company: string; insurer: string; rowCount: number; summary: string; _src: View }

const orderPolicies = useOrderPolicies()
const clients = useClients()
const insurers = useInsurers()
const dataTypes = useDataTypes()
const { push } = useToast()

// GET /order-policies는 companyId가 필수라 — 회사 선택자(header select)가
// 곧 목록 스코프다. holidays의 year select와 동일한 패턴.
const { data: companiesData } = await useAsyncData('order-policies-companies', () => clients.list())
const companies = computed(() => companiesData.value ?? [])

const { data: insurersData } = await useAsyncData('order-policies-insurers', () => insurers.list())
const insurerList = computed(() => insurersData.value ?? [])

const { data: dataTypesData } = await useAsyncData('order-policies-datatypes', () => dataTypes.list())
const dataTypeList = computed(() => sortByDataTypeOrder(dataTypesData.value ?? []))
const dataTypeNames = computed<Record<string, string>>(() => Object.fromEntries(dataTypeList.value.map(d => [d.code, d.name])))

const companyId = ref('')
watch(companies, cs => { if (!companyId.value && cs.length) companyId.value = cs[0]!.id }, { immediate: true })

const { data, pending, refresh } = await useAsyncData(
  'order-policies',
  () => (companyId.value ? orderPolicies.list(companyId.value) : Promise.resolve([])),
  { watch: [companyId] },
)
const list = computed<View[]>(() => data.value ?? [])

function companyName(id: string) {
  return companies.value.find(c => c.id === id)?.name ?? id
}
function insurerName(code: string) {
  return insurerList.value.find(i => i.code === code)?.name ?? code
}

const columns: Column[] = [
  { key: 'company', label: '회사', kind: 'text' },
  { key: 'insurer', label: '보험사', kind: 'text' },
  { key: 'rowCount', label: '구간 수', kind: 'mono' },
  { key: 'summary', label: '요약', kind: 'muted' },
]

const rows = computed<PolicyListRow[]>(() => list.value.map(p => ({
  id: p.id,
  company: companyName(p.companyId),
  insurer: p.insuranceCompanyCode ? insurerName(p.insuranceCompanyCode) : '회사 기본',
  rowCount: p.rows.length,
  summary: p.rows[0]?.order.length
    ? p.rows[0].order.map(k => categoryLabel(k, dataTypeNames.value)).join(' → ')
    : '—',
  _src: p,
})))

// --- 드로어 ---
const drawerOpen = ref(false)
const editingId = ref<string | null>(null)

function blank(): OrderPolicyForm {
  return { companyId: companyId.value, insuranceCompanyCode: '', rows: [] }
}
const form = ref<OrderPolicyForm>(blank())

function openCreate() {
  editingId.value = null
  form.value = blank()
  drawerOpen.value = true
}

function openEdit(p: View) {
  editingId.value = p.id
  form.value = {
    companyId: p.companyId,
    insuranceCompanyCode: p.insuranceCompanyCode ?? '',
    rows: p.rows.map(r => ({ bizDayFrom: r.bizDayFrom, bizDayTo: r.bizDayTo ?? null, order: [...r.order], draftOffset: 0, draftDataType: '' })),
  }
  drawerOpen.value = true
}

function addRow() {
  form.value.rows.push({ bizDayFrom: 1, bizDayTo: null, order: [], draftOffset: 0, draftDataType: '' })
}
function removeRow(ri: number) {
  form.value.rows.splice(ri, 1)
}
function setBizDayTo(row: PolicyRowForm, e: Event) {
  const v = (e.target as HTMLInputElement).value
  row.bizDayTo = v === '' ? null : Number(v)
}
// 업적월(오프셋) + 데이터타입 조합을 카테고리 키로 만들어 순서 목록에 추가.
function addCategory(row: PolicyRowForm) {
  if (!row.draftDataType) { push('데이터 타입을 선택하세요'); return }
  const key = buildCategoryKey(row.draftOffset ?? 0, row.draftDataType)
  if (!row.order.includes(key)) row.order.push(key)
  row.draftDataType = '' // 오프셋은 유지해 연속 추가 편하게, 데이터타입만 리셋
}

async function save() {
  const err = validateOrderPolicyForm(form.value)
  if (err) {
    push(err)
    return
  }
  const editing = editingId.value
  try {
    if (editing) await orderPolicies.update(editing, form.value)
    else await orderPolicies.create(form.value)
    drawerOpen.value = false
    editingId.value = null
    // 다른 회사로 등록/이동했을 수 있으니 목록 스코프를 폼의 회사로 맞춘다.
    if (companyId.value !== form.value.companyId) companyId.value = form.value.companyId
    else await refresh()
    push(editing ? '수정되었습니다.' : '등록되었습니다.', 'success')
  } catch (e: any) {
    push(extractApiError(e, '저장에 실패했습니다.'), 'error')
  }
}

async function removePolicy(p: View) {
  const insurer = p.insuranceCompanyCode ? insurerName(p.insuranceCompanyCode) : '회사 기본'
  if (!confirm(`${companyName(p.companyId)} / ${insurer} 정책을 삭제할까요?`)) return
  try {
    await orderPolicies.remove(p.id)
    await refresh()
    push('삭제되었습니다.', 'success')
  } catch (e: any) {
    push(extractApiError(e, '삭제에 실패했습니다.'), 'error')
  }
}
</script>

<template>
  <section class="panel">
    <div class="hd">
      <div>
        <div class="hd-title">우선순위 정책</div>
        <div class="hd-desc">영업일 구간별로 카테고리(신계약/계속분 등)를 어떤 순서로 처리할지 정의합니다</div>
      </div>
      <div class="hd-actions">
        <select v-model="companyId" class="hd-year">
          <option v-for="c in companies" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
        <button class="act act--primary" @click="openCreate">+ 정책 등록</button>
      </div>
    </div>

    <WDataTable v-if="rows.length" :columns="columns" :rows="rows" :actions-width="140">
      <template #actions="{ row }">
        <button class="act act--ghost" @click="openEdit(row._src)">상세</button>
        <button class="act act--danger" @click="removePolicy(row._src)">삭제</button>
      </template>
    </WDataTable>
    <WEmptyState
      v-else
      title="등록된 정책이 없습니다"
      :message="pending ? '불러오는 중…' : '회사를 선택하고 정책을 등록하세요.'"
      cta-label="+ 정책 등록"
      @cta="openCreate"
    />

    <WDrawer
      v-model:open="drawerOpen"
      :title="editingId ? '정책 수정' : '정책 등록'"
      description="영업일 구간별 카테고리 처리 순서를 정의합니다."
    >
      <label class="fld"><span>회사 <span class="req">*</span></span>
        <select v-model="form.companyId" :disabled="!!editingId">
          <option v-for="c in companies" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
      </label>
      <label class="fld"><span>보험사 (비우면 회사 기본)</span>
        <select v-model="form.insuranceCompanyCode" :disabled="!!editingId">
          <option value="">— 회사 기본 —</option>
          <option v-for="i in insurerList" :key="i.code" :value="i.code">{{ i.name }}</option>
        </select>
      </label>

      <div class="fld">
        <span>영업일 구간</span>
        <div v-for="(row, ri) in form.rows" :key="ri" class="roles">
          <div class="fld fld--row">
            <span>영업일</span>
            <input type="number" v-model.number="row.bizDayFrom" min="1" class="mono" style="width:4rem" />
            <span>~</span>
            <input
              type="number"
              :value="row.bizDayTo ?? ''"
              min="1"
              placeholder="끝까지"
              style="width:4rem"
              @input="setBizDayTo(row, $event)"
            />
            <button class="act act--danger" style="margin-left:auto" @click="removeRow(ri)">구간 삭제</button>
          </div>
          <ol class="order-list">
            <li v-for="(key, oi) in row.order" :key="key" class="order-item">
              <span class="order-label">{{ categoryLabel(key, dataTypeNames) }}</span>
              <button class="act act--ghost" :disabled="oi === 0" @click="row.order = moveOrder(row.order, oi, -1)">↑</button>
              <button class="act act--ghost" :disabled="oi === row.order.length - 1" @click="row.order = moveOrder(row.order, oi, 1)">↓</button>
              <button class="act act--danger" @click="row.order.splice(oi, 1)">×</button>
            </li>
          </ol>
          <div class="cat-add">
            <span>업적월</span>
            <input type="number" v-model.number="row.draftOffset" class="mono" style="width:4rem" />
            <span class="cat-off">{{ offsetLabel(row.draftOffset ?? 0) }}</span>
            <select v-model="row.draftDataType" class="cat-dt">
              <option value="">데이터 타입</option>
              <option v-for="d in dataTypeList" :key="d.code" :value="d.code">{{ d.name }}</option>
            </select>
            <button class="act act--ghost" @click="addCategory(row)">+ 추가</button>
          </div>
        </div>
        <button class="act act--ghost" @click="addRow">+ 구간 추가</button>
      </div>

      <template #footer>
        <button class="act act--ghost" @click="drawerOpen = false">취소</button>
        <button class="act act--primary" @click="save">저장</button>
      </template>
    </WDrawer>
  </section>
</template>

<style scoped>
/* .fld / .act / .roles come from the global DS (assets/css/components.css). */
.panel { background: var(--panel); border: 1px solid var(--line); border-radius: 14px; overflow: hidden; box-shadow: var(--rim), var(--elev); }
.hd { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; padding: 16px 18px; border-bottom: 1px solid var(--line); }
.hd-title { font-family: var(--font-display); font-size: 15px; font-weight: 700; color: var(--ink); }
.hd-desc { font-size: 12px; color: var(--ink-2); margin-top: 2px; }
.hd-actions { display: flex; gap: 10px; align-items: center; }
.hd-year { padding: 8px 12px; border: 1px solid var(--line); border-radius: 9px; font-family: var(--font-mono); font-size: 12.5px; background: var(--th); color: var(--ink); }
.order-list { display: flex; flex-direction: column; gap: 6px; margin: 4px 0; padding: 0; list-style: none; }
.order-item { display: flex; align-items: center; gap: 6px; padding: 6px 8px; border: 1px solid var(--line); border-radius: 8px; background: var(--panel); }
.order-label { flex: 1; font-size: 12.5px; color: var(--ink); }
.cat-add { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 6px; font-size: 12.5px; }
.cat-add > span:first-child { color: var(--ink-2); }
.cat-off { font-size: 11px; color: var(--ink-2); min-width: 2.5rem; }
.cat-dt { min-width: 8rem; }
</style>
