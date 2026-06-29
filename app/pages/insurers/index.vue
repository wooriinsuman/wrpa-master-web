<script setup lang="ts">
import type { components } from '#shared/types/api'
import type { Column } from '~/components/WDataTable.vue'
import type { CrudRow } from '~/utils/crud'
import type { StatusCell } from '~/utils/status'
import type { InsurerForm } from '~/utils/insurerForm'

type View = components['schemas']['InsuranceCompanyView']
interface InsurerRow extends CrudRow { status: StatusCell; name: string; code: string; type: string; url: string }

const columns: Column[] = [
  { key: 'status', label: '상태', kind: 'status' },
  { key: 'name', label: '보험사명', kind: 'text' },
  { key: 'code', label: '코드', kind: 'mono' },
  { key: 'type', label: '구분', kind: 'text' },
  { key: 'url', label: 'URL', kind: 'muted' },
]

function toRow(v: View): InsurerRow {
  return {
    id: v.id,
    status: { label: v.active ? '활성' : '정지', kind: v.active ? 'done' : 'idle' } as StatusCell,
    name: v.name,
    code: v.code,
    type: v.type,
    url: v.url,
  }
}

function toForm(v: View): InsurerForm {
  return { code: v.code, name: v.name, type: v.type, url: v.url, active: v.active }
}

function blank(): InsurerForm {
  return { code: '', name: '', type: 'PROPERTY', url: '', active: true }
}

const { rows, search, pending, drawerOpen, editingId, form, openCreate, openEdit, save, remove } = await useCrudPage<View, InsurerForm, InsurerRow>({
  key: 'insurers',
  resource: useInsurers(),
  blank,
  toRow,
  toForm,
  searchKeys: ['name', 'code', 'url'],
})
</script>

<template>
  <WCrudPage
    title="보험사"
    desc="자동화 대상 보험사"
    add-label="+ 보험사 등록"
    empty-title="보험사가 없습니다"
    :drawer-title="editingId ? '보험사 수정' : '보험사 등록'"
    drawer-description="보험사 정보를 입력한 뒤 저장하세요."
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
      <label class="fld"><span>코드 <span class="req">*</span></span><input v-model="form.code" placeholder="samsung_property" /></label>
      <label class="fld"><span>보험사명 <span class="req">*</span></span><input v-model="form.name" placeholder="삼성화재" /></label>
      <label class="fld"><span>구분</span>
        <select v-model="form.type"><option>LIFE</option><option>PROPERTY</option><option>GUARANTEE</option><option>UNKNOWN</option></select>
      </label>
      <label class="fld"><span>URL</span><input v-model="form.url" placeholder="https://" /></label>
      <label class="fld fld--row"><input type="checkbox" v-model="form.active" /><span>활성</span></label>
    </template>
  </WCrudPage>
</template>
