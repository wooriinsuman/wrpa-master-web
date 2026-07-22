<script setup lang="ts">
import { computed } from 'vue'
import type { components } from '#shared/types/api'
import type { Column } from '~/components/WDataTable.vue'
import type { CrudRow } from '~/utils/crud'
import type { WorkFileForm } from '~/utils/workFileForm'

type View = components['schemas']['WorkFileView']
interface WorkFileRow extends CrudRow { code: string; name: string; insurer: string; dataType: string; fileType: string; insureType: string; path: string }

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
  { key: 'path', label: '전산경로', kind: 'muted' },
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

const { rows, search, pending, drawerOpen, editingId, form, openCreate, openEdit, save, remove, refresh } = await useCrudPage<View, WorkFileForm, WorkFileRow>({
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
    :drawer-title="editingId ? '작업 파일 수정' : '작업 파일 등록'"
    drawer-description="작업 파일 정보를 입력한 뒤 저장하세요."
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
    <template #fields>
      <label class="fld"><span>보험사 코드 <span class="req">*</span></span><input v-model="form.insuranceCompanyCode" :disabled="!!editingId" placeholder="samsung_property" /></label>
      <label class="fld"><span>이름 <span class="req">*</span></span><input v-model="form.name" placeholder="계약 전체 목록" /></label>
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
      <label class="fld"><span>전산경로</span><input v-model="form.originPath" placeholder="보험사 사이트 메뉴 경로 (참고용)" /></label>
      <label class="fld"><span>비고</span><textarea v-model="form.note" rows="3" placeholder="메모"></textarea></label>
    </template>
  </WCrudPage>
</template>
