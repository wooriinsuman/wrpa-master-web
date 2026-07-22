<script setup lang="ts">
import { computed } from 'vue'
import type { components } from '#shared/types/api'
import type { Column } from '~/components/WDataTable.vue'
import type { CrudRow } from '~/utils/crud'
import type { StatusCell } from '~/utils/status'
import { blankAccountForm, type AccountForm } from '~/utils/accountForm'

type View = components['schemas']['AccountView']
type Company = components['schemas']['Company']
interface AccountRow extends CrudRow { status: StatusCell; insurer: string; name: string; company: string; locked: boolean }

// 회사(거래처) 목록 — companyId(UUID)를 한글 회사명으로 표시하고, 등록/수정 시
// 직접 입력 대신 select로 고르게 한다.
const clients = useClients()
const { data: companiesData } = await useAsyncData('accounts:companies', () => clients.list())
const companies = computed<Company[]>(() => companiesData.value ?? [])
const companyNameById = computed(() => new Map(companies.value.map(c => [c.id, c.name])))
function companyName(id?: string | null): string {
  if (!id) return '—'
  return companyNameById.value.get(id) ?? id // 목록에 없으면(삭제 등) id로 폴백
}

const columns: Column[] = [
  { key: 'insurer', label: '보험사', kind: 'mono' },
  { key: 'name', label: '계정명', kind: 'text' },
  { key: 'company', label: '회사', kind: 'text' },
  { key: 'status', label: '상태', kind: 'status' },
]

function toRow(a: View): AccountRow {
  return {
    id: a.id,
    status: { label: a.locked ? '잠금' : '정상', kind: a.locked ? 'fail' : 'done' } as StatusCell,
    insurer: a.insuranceCompanyCode,
    name: a.name,
    company: companyName(a.companyId),
    locked: a.locked,
  }
}

function toForm(a: View): AccountForm {
  return {
    companyId: a.companyId ?? '',
    insuranceCompanyCode: a.insuranceCompanyCode,
    name: a.name,
    loginId: '',
    password: '',
    telecomAgency: a.telecomAgency ?? '',
    phone: a.phone ?? '',
    groupCode: a.groupCode ?? '',
    secondaryCode: a.secondaryCode ?? '',
    secondaryPassword: '',
    feePassword: '',
  }
}

const accounts = useAccounts()
const { push } = useToast()
const { rows, search, pending, drawerOpen, editingId, form, openCreate, openEdit, save, remove, refresh } =
  await useCrudPage<View, AccountForm, AccountRow>({
    key: 'accounts',
    resource: accounts,
    blank: blankAccountForm,
    toRow,
    toForm,
    searchKeys: ['insurer', 'name', 'company'],
    messages: { removed: '계정을 삭제했습니다.' },
  })

async function runLock(row: AccountRow) {
  try { await accounts.lock(row.id); await refresh(); push('계정을 잠갔습니다.', 'success') }
  catch { push('잠금에 실패했습니다.', 'error') }
}
async function runUnlock(row: AccountRow) {
  try { await accounts.unlock(row.id); await refresh(); push('잠금을 해제했습니다.', 'success') }
  catch { push('잠금 해제에 실패했습니다.', 'error') }
}
</script>

<template>
  <WCrudPage
    title="계정"
    desc="보험사 로그인 계정"
    add-label="+ 계정 등록"
    empty-title="계정이 없습니다"
    remove-noun="계정"
    index-column
    :drawer-title="editingId ? '계정 수정' : '계정 등록'"
    drawer-description="계정 정보를 입력한 뒤 저장하세요. 비밀번호는 변경할 때만 입력하세요."
    :columns="columns"
    :rows="rows"
    :pending="pending"
    editable
    :actions-width="208"
    v-model:search="search"
    v-model:drawer-open="drawerOpen"
    @add="openCreate"
    @refresh="refresh"
    @edit="openEdit"
    @save="save"
    @remove="remove"
  >
    <template #row-actions-lead="{ row }">
      <button v-if="row.locked" class="act act--ghost" @click="runUnlock(row)">잠금해제</button>
      <button v-else class="act act--ghost" @click="runLock(row)">잠금</button>
    </template>
    <template #fields>
      <label class="fld"><span>회사</span>
        <select v-model="form.companyId">
          <option value="">(회사 없음)</option>
          <option v-for="c in companies" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
      </label>
      <label class="fld"><span>보험사 코드 <span class="req">*</span></span><input v-model="form.insuranceCompanyCode" :disabled="!!editingId" placeholder="samsung_property" /></label>
      <label class="fld"><span>계정명 <span class="req">*</span></span><input v-model="form.name" /></label>
      <label class="fld"><span>로그인 ID <span v-if="!editingId" class="req">*</span><span v-else> (변경 시 입력)</span></span><input v-model="form.loginId" :placeholder="editingId ? '변경 시에만 입력' : ''" /></label>
      <label class="fld"><span>비밀번호 <span v-if="!editingId" class="req">*</span><span v-else> (변경 시 입력)</span></span><input v-model="form.password" type="password" :placeholder="editingId ? '변경 시에만 입력' : ''" /></label>
      <label class="fld"><span>통신사</span><input v-model="form.telecomAgency" /></label>
      <label class="fld"><span>연락처</span><input v-model="form.phone" /></label>
      <label class="fld"><span>그룹 코드</span><input v-model="form.groupCode" /></label>
      <label class="fld"><span>2차 코드</span><input v-model="form.secondaryCode" /></label>
      <label class="fld"><span>2차 비밀번호</span><input v-model="form.secondaryPassword" type="password" :placeholder="editingId ? '변경 시에만 입력' : ''" /></label>
      <label class="fld"><span>수수료 비밀번호</span><input v-model="form.feePassword" type="password" :placeholder="editingId ? '변경 시에만 입력' : ''" /></label>
    </template>
  </WCrudPage>
</template>
