<script setup lang="ts">
import { computed } from 'vue'
import type { components } from '#shared/types/api'
import type { Column } from '~/components/WDataTable.vue'
import type { CrudRow } from '~/utils/crud'
import type { WorkFileForm } from '~/utils/workFileForm'

type View = components['schemas']['WorkFileView']
interface WorkFileRow extends CrudRow { code: string; name: string; insurer: string; dataType: string; fileType: string; insureType: string; path: string }

// 보험사 목록 — 보험사 메뉴(useInsurers)에 등록된 항목을 등록/수정 select 옵션으로.
const { data: insurersData } = await useAsyncData('wf-insurers', () => useInsurers().list())
const insurerOptions = computed(() => insurersData.value ?? [])

// 데이터 유형 목록 — dataType 코드를 한글 표시명으로 매핑 + 등록/수정 select 옵션.
const { data: dtData } = await useAsyncData('wf-datatypes', () => useDataTypes().list())
const dataTypeOptions = computed(() => dtData.value ?? [])
const dataTypeNameByCode = computed(() => new Map(dataTypeOptions.value.map(d => [d.code, d.name])))
function dataTypeLabel(code?: string | null): string {
  if (!code) return '—'
  return dataTypeNameByCode.value.get(code) ?? code // 목록에 없으면 코드로 폴백
}

// 유형(fileType) / 보종(insureType) — legacy enum(ContractFileType / ContractFileInsureType).
// 저장값은 소문자(자산 폴더 jobCode와 정합), 표시는 한글 라벨.
const FILE_TYPE_OPTIONS = [
  { value: 'list', label: '건별목록' },
  { value: 'statement', label: '명세서' },
]
const INSURE_TYPE_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'longterm', label: '장기' },
  { value: 'general', label: '일반' },
  { value: 'car', label: '자동차' },
]
const fileTypeLabel = (v?: string | null) => FILE_TYPE_OPTIONS.find(o => o.value === v)?.label ?? (v || '—')
const insureTypeLabel = (v?: string | null) => INSURE_TYPE_OPTIONS.find(o => o.value === v)?.label ?? (v || '—')

const columns: Column[] = [
  { key: 'code', label: '코드', kind: 'mono' },
  { key: 'name', label: '파일명', kind: 'text' },
  { key: 'insurer', label: '보험사', kind: 'mono' },
  { key: 'dataType', label: '데이터', kind: 'text' },
  { key: 'fileType', label: '유형', kind: 'text' },
  { key: 'insureType', label: '보종', kind: 'text' },
  { key: 'path', label: '전산경로', kind: 'muted', weight: 3 }, // 경로+절차라 가장 길다
]

function toRow(w: View): WorkFileRow {
  return {
    id: w.id,
    code: w.jobCode, // dataType_fileType_insureType_contentType (예: new_list_all_a)
    name: w.name,
    insurer: w.insuranceCompanyCode,
    dataType: dataTypeLabel(w.dataType),
    fileType: fileTypeLabel(w.fileType),
    insureType: insureTypeLabel(w.insureType),
    path: w.originPath || '—',
  }
}

function toForm(w: View): WorkFileForm {
  return {
    insuranceCompanyCode: w.insuranceCompanyCode,
    dataType: w.dataType ?? '',
    fileType: w.fileType ?? '',
    insureType: w.insureType ?? '',
    contentType: w.contentType ?? '',
    name: w.name,
    note: w.note ?? '',
    originPath: w.originPath ?? '',
  }
}

function blank(): WorkFileForm {
  return { insuranceCompanyCode: '', dataType: '', fileType: 'list', insureType: 'all', contentType: '', name: '', note: '', originPath: '' }
}

const { rows, search, pending, drawerOpen, editingId, copying, form, openCreate, openEdit, openCopy, save, remove, refresh } = await useCrudPage<View, WorkFileForm, WorkFileRow>({
  key: 'workfiles',
  resource: useWorkFiles(),
  blank,
  toRow,
  toForm,
  searchKeys: ['name', 'insurer', 'dataType'],
})
</script>

<template>
  <WCrudPage
    title="작업 파일"
    desc="work-file 관리"
    add-label="+ 작업 파일 등록"
    empty-title="작업 파일이 없습니다"
    remove-noun="작업 파일"
    index-column
    :drawer-title="editingId ? '작업 파일 수정' : copying ? '작업 파일 복사 생성' : '작업 파일 등록'"
    :drawer-description="copying ? '원본 값이 채워져 있습니다. 바꿀 항목만 수정한 뒤 저장하세요.' : '작업 파일 정보를 입력한 뒤 저장하세요.'"
    :drawer-width="760"
    :actions-width="176"
    :columns="columns"
    :rows="rows"
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
    <template #row-actions-lead="{ row }">
      <button class="act act--ghost" @click="openCopy(row)">복사</button>
    </template>
    <template #fields>
      <div class="form-grid">
        <label class="fld"><span>보험사 <span class="req">*</span></span>
          <select v-model="form.insuranceCompanyCode" :disabled="!!editingId">
            <option value="" disabled>— 보험사 선택 —</option>
            <option v-for="i in insurerOptions" :key="i.code" :value="i.code">{{ i.name }} ({{ i.code }})</option>
          </select></label>
        <label class="fld"><span>파일명 <span class="req">*</span><span class="hint">목록·작업일정에서 이 이름으로 고릅니다</span></span>
          <input v-model="form.name" placeholder="계약 전체 목록" /></label>
        <label class="fld"><span>데이터 유형 <span class="req">*</span></span>
          <select v-model="form.dataType">
            <option v-for="d in dataTypeOptions" :key="d.code" :value="d.code">{{ d.name }} ({{ d.code }})</option>
          </select></label>
        <label class="fld"><span>유형 <span class="req">*</span></span>
          <select v-model="form.fileType">
            <option v-for="o in FILE_TYPE_OPTIONS" :key="o.value" :value="o.value">{{ o.label }} ({{ o.value }})</option>
          </select></label>
        <label class="fld"><span>보종 <span class="req">*</span></span>
          <select v-model="form.insureType">
            <option v-for="o in INSURE_TYPE_OPTIONS" :key="o.value" :value="o.value">{{ o.label }} ({{ o.value }})</option>
          </select></label>
        <label class="fld"><span>컨텐츠 <span class="req">*</span></span><input v-model="form.contentType" placeholder="a" /></label>
        <!-- 전산경로 = legacy 상세경로. 실제 값이 한 줄짜리 메뉴 경로라 input 으로 둔다
             (길어서 전폭). 긴 절차 설명은 비고에 적는다. -->
        <label class="fld fld--full"><span>전산경로<span class="hint">보험사 사이트 메뉴 경로 (참고용)</span></span>
          <input v-model="form.originPath" placeholder="전체메뉴 > 장기보험 > 보유/미납계약" /></label>
        <label class="fld fld--full"><span>비고</span><textarea v-model="form.note" rows="6" placeholder="메모"></textarea></label>
      </div>
    </template>
  </WCrudPage>
</template>

<style scoped>
/* 다이얼로그가 세로로 길어져 잘리므로 폼을 2열로. 넓은 필드만 전폭. */
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px 16px; align-items: start; }
.fld--full { grid-column: 1 / -1; }
.hint { font-weight: 400; color: var(--ink-2); font-size: 11px; margin-left: 6px; }
</style>
