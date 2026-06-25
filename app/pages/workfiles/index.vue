<script setup lang="ts">
import type { components } from '#shared/types/api'
import type { Column } from '~/components/WDataTable.vue'
import type { CrudRow } from '~/utils/crud'
import type { WorkFileForm } from '~/utils/workFileForm'

type View = components['schemas']['WorkFileView']
interface WorkFileRow extends CrudRow { name: string; insurer: string; dataType: string; fileType: string; insureType: string }

const columns: Column[] = [
  { key: 'name', label: '파일명', kind: 'text' },
  { key: 'insurer', label: '보험사', kind: 'mono' },
  { key: 'dataType', label: '데이터', kind: 'text' },
  { key: 'fileType', label: '유형', kind: 'text' },
  { key: 'insureType', label: '보종', kind: 'text' },
]

function toRow(w: View): WorkFileRow {
  return {
    id: w.id,
    name: w.name,
    insurer: w.insuranceCompanyCode,
    dataType: w.dataType ?? '—',
    fileType: w.fileType ?? '—',
    insureType: w.insureType ?? '—',
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
  return { insuranceCompanyCode: '', dataType: '', fileType: '', insureType: '', contentType: '', name: '', note: '', originPath: '' }
}

const { rows, search, pending, drawerOpen, editingId, form, openCreate, openEdit, save, remove } = await useCrudPage<View, WorkFileForm, WorkFileRow>({
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
    :drawer-title="editingId ? '작업 파일 수정' : '작업 파일 등록'"
    drawer-description="작업 파일 정보를 입력한 뒤 저장하세요."
    :columns="columns"
    :rows="rows"
    :pending="pending"
    editable
    v-model:search="search"
    v-model:drawer-open="drawerOpen"
    @add="openCreate"
    @edit="openEdit"
    @save="save"
    @remove="remove"
  >
    <template #fields>
      <label class="fld"><span>보험사 코드 *</span><input v-model="form.insuranceCompanyCode" :disabled="!!editingId" placeholder="samsung_property" /></label>
      <label class="fld"><span>이름 *</span><input v-model="form.name" placeholder="계약 전체 목록" /></label>
      <label class="fld"><span>데이터 *</span><input v-model="form.dataType" placeholder="contract" /></label>
      <label class="fld"><span>유형 *</span><input v-model="form.fileType" placeholder="list" /></label>
      <label class="fld"><span>보종 *</span><input v-model="form.insureType" placeholder="all" /></label>
      <label class="fld"><span>컨텐츠 *</span><input v-model="form.contentType" placeholder="a" /></label>
      <label class="fld"><span>비고</span><input v-model="form.note" /></label>
    </template>
  </WCrudPage>
</template>
