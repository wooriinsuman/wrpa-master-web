<script setup lang="ts">
import type { components } from '#shared/types/api'
import type { Column } from '~/components/WDataTable.vue'
import type { CrudRow } from '~/utils/crud'
import type { DataTypeForm } from '~/utils/dataTypeForm'

// DataTypeView는 code가 PK이며 id 필드가 없다 — useCrudPage<Entity extends {id:string}> 계약을
// 만족시키기 위해 list() 결과에 id:=code를 실제로 얹어서 넘긴다 (타입만 넓히면 openEdit의
// data.find(e => e.id === row.id) 조회가 런타임에 항상 실패하므로 타입 단언만으로는 불충분).
type View = components['schemas']['DataTypeView'] & { id: string }
interface Row extends CrudRow { code: string; name: string; note: string }

const columns: Column[] = [
  { key: 'code', label: '코드', kind: 'mono' },
  { key: 'name', label: '표시명', kind: 'text' },
  { key: 'note', label: '메모', kind: 'muted' },
]

function toRow(v: View): Row {
  return { id: v.code, code: v.code, name: v.name, note: v.note }
}
function toForm(v: View): DataTypeForm {
  return { code: v.code, name: v.name, note: v.note }
}
function blank(): DataTypeForm {
  return { code: '', name: '', note: '' }
}

const dataTypes = useDataTypes()
const resource = {
  ...dataTypes,
  list: () => dataTypes.list().then(vs => vs.map(v => ({ ...v, id: v.code }))),
}

const { rows, search, pending, drawerOpen, editingId, form, openCreate, openEdit, save, remove, refresh } =
  await useCrudPage<View, DataTypeForm, Row>({
    key: 'data-types',
    resource,
    blank,
    toRow,
    toForm,
    searchKeys: ['code', 'name'],
  })
</script>

<template>
  <WCrudPage
    title="데이터 유형"
    desc="작업 유형(신계약/계속분 등) — 우선순위 정책의 카테고리 축"
    add-label="+ 유형 등록"
    empty-title="데이터 유형이 없습니다"
    remove-noun="데이터 유형"
    index-column
    :drawer-title="editingId ? '유형 수정' : '유형 등록'"
    drawer-description="작업파일이 참조 중인 유형은 삭제할 수 없습니다."
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
      <label class="fld"><span>코드 <span class="req">*</span></span>
        <input v-model="form.code" placeholder="new" :disabled="!!editingId" /></label>
      <label class="fld"><span>표시명 <span class="req">*</span></span>
        <input v-model="form.name" placeholder="신계약" /></label>
      <label class="fld"><span>메모</span><textarea v-model="form.note" rows="3" placeholder="메모"></textarea></label>
    </template>
  </WCrudPage>
</template>
