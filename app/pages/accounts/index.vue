<script setup lang="ts">
import type { components } from '#shared/types/api'
import type { Column } from '~/components/WDataTable.vue'
import type { CrudRow } from '~/utils/crud'
import type { StatusCell } from '~/utils/status'
import { blankAccountForm, type AccountForm } from '~/utils/accountForm'

type View = components['schemas']['AccountView']
interface AccountRow extends CrudRow { status: StatusCell; insurer: string; name: string; company: string; locked: boolean }

const columns: Column[] = [
  { key: 'status', label: '상태', kind: 'status' },
  { key: 'insurer', label: '보험사', kind: 'mono' },
  { key: 'name', label: '계정명', kind: 'text' },
  { key: 'company', label: '거래처', kind: 'mono' },
]

function toRow(a: View): AccountRow {
  return {
    id: a.id,
    status: { label: a.locked ? '잠금' : '정상', kind: a.locked ? 'fail' : 'done' } as StatusCell,
    insurer: a.insuranceCompanyCode,
    name: a.name,
    company: a.companyId ?? '—',
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
  })

async function runLock(row: AccountRow) {
  try { await accounts.lock(row.id); await refresh(); push('계정을 잠갔습니다.') }
  catch { push('잠금에 실패했습니다.') }
}
async function runUnlock(row: AccountRow) {
  try { await accounts.unlock(row.id); await refresh(); push('잠금을 해제했습니다.') }
  catch { push('잠금 해제에 실패했습니다.') }
}
</script>

<template>
  <WCrudPage
    title="계정"
    desc="보험사 로그인 계정"
    add-label="+ 계정 등록"
    empty-title="계정이 없습니다"
    :drawer-title="editingId ? '계정 수정' : '계정 등록'"
    drawer-description="계정 정보를 입력한 뒤 저장하세요. 비밀번호는 변경할 때만 입력하세요."
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
    <template #row-actions-lead="{ row }">
      <button v-if="row.locked" class="act act--ghost" @click="runUnlock(row)">잠금해제</button>
      <button v-else class="act act--ghost" @click="runLock(row)">잠금</button>
    </template>
    <template #fields>
      <label class="fld"><span>보험사 코드 *</span><input v-model="form.insuranceCompanyCode" :disabled="!!editingId" placeholder="samsung_property" /></label>
      <label class="fld"><span>계정명 *</span><input v-model="form.name" /></label>
      <label class="fld"><span>{{ editingId ? '로그인 ID (변경 시 입력)' : '로그인 ID *' }}</span><input v-model="form.loginId" :placeholder="editingId ? '변경 시에만 입력' : ''" /></label>
      <label class="fld"><span>{{ editingId ? '비밀번호 (변경 시 입력)' : '비밀번호 *' }}</span><input v-model="form.password" type="password" :placeholder="editingId ? '변경 시에만 입력' : ''" /></label>
      <label class="fld"><span>거래처 ID</span><input v-model="form.companyId" /></label>
      <label class="fld"><span>통신사</span><input v-model="form.telecomAgency" /></label>
      <label class="fld"><span>연락처</span><input v-model="form.phone" /></label>
      <label class="fld"><span>그룹 코드</span><input v-model="form.groupCode" /></label>
      <label class="fld"><span>보조 코드</span><input v-model="form.secondaryCode" /></label>
      <label class="fld"><span>보조 비밀번호</span><input v-model="form.secondaryPassword" type="password" :placeholder="editingId ? '변경 시에만 입력' : ''" /></label>
      <label class="fld"><span>수수료 비밀번호</span><input v-model="form.feePassword" type="password" :placeholder="editingId ? '변경 시에만 입력' : ''" /></label>
    </template>
  </WCrudPage>
</template>
