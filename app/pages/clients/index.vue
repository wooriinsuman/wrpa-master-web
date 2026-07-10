<script setup lang="ts">
import type { components } from '#shared/types/api'
import type { Column } from '~/components/WDataTable.vue'
import type { CrudRow } from '~/utils/crud'
import type { StatusCell } from '~/utils/status'
import type { ClientForm } from '~/utils/clientForm'

type Company = components['schemas']['Company']
interface ClientRow extends CrudRow { status: StatusCell; name: string; code: string; leaderName: string; phone: string }

const columns: Column[] = [
  { key: 'status', label: '상태', kind: 'status' },
  { key: 'name', label: '회사명', kind: 'text' },
  { key: 'code', label: '코드', kind: 'mono' },
  { key: 'leaderName', label: '담당자', kind: 'text' },
  { key: 'phone', label: '연락처', kind: 'mono' },
]

function toRow(c: Company): ClientRow {
  return {
    id: c.id,
    status: { label: c.active ? '활성' : '정지', kind: c.active ? 'done' : 'idle' } as StatusCell,
    name: c.name,
    code: c.code,
    leaderName: c.leaderName ?? '—',
    phone: c.phone ?? '—',
  }
}

function blank(): ClientForm {
  return { name: '', code: '', phone: '', leaderName: '', businessRegistrationNumber: '' }
}

const { rows, search, pending, drawerOpen, form, openCreate, save, remove } = await useCrudPage<Company, ClientForm, ClientRow>({
  key: 'clients',
  resource: useClients(),
  blank,
  toRow,
  searchKeys: ['name', 'code', 'leaderName'],
})
</script>

<template>
  <WCrudPage
    title="회사"
    desc="자동화 대상 회사"
    add-label="+ 회사 등록"
    empty-title="회사가 없습니다"
    drawer-title="회사 등록"
    drawer-description="회사 정보를 입력한 뒤 저장하세요."
    :columns="columns"
    :rows="rows"
    :pending="pending"
    v-model:search="search"
    v-model:drawer-open="drawerOpen"
    @add="openCreate"
    @save="save"
    @remove="remove"
  >
    <template #fields>
      <label class="fld"><span>회사명 <span class="req">*</span></span><input v-model="form.name" placeholder="로앤손해사정" /></label>
      <label class="fld"><span>코드 <span class="req">*</span></span><input v-model="form.code" placeholder="LA-01" /></label>
      <label class="fld"><span>담당자</span><input v-model="form.leaderName" /></label>
      <label class="fld"><span>연락처</span><input v-model="form.phone" /></label>
      <label class="fld"><span>사업자번호</span><input v-model="form.businessRegistrationNumber" /></label>
    </template>
  </WCrudPage>
</template>
