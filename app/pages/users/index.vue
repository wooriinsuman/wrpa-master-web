<script setup lang="ts">
import { ref, computed } from 'vue'
import type { components } from '#shared/types/api'
import type { Column } from '~/components/WDataTable.vue'
import type { StatusCell } from '~/utils/status'
import { blankUserForm, type UserForm } from '~/utils/userForm'

type UserView = components['schemas']['UserView']
type Role = components['schemas']['Role']
interface UserRow { id: string; status: StatusCell; username: string; name: string; roles: string; company: string; active: boolean }

const users = useUsers()
const { push } = useToast()
const { data, refresh, pending } = await useAsyncData('users', async () => {
  const [list, roleList, companyList] = await Promise.all([users.list(), users.roles(), useClients().list()])
  return { list, roleList, companyList }
})
const roleOptions = computed<Role[]>(() => data.value?.roleList ?? [])
const companyOptions = computed(() => data.value?.companyList ?? [])
// id→이름 매핑. UserView.roles/companyId가 이름이 아닌 id를 담을 수 있어 목록에선
// 이름으로 환원한다(매핑 실패 시 원본 값으로 폴백).
const roleName = computed(() => new Map(roleOptions.value.map(r => [r.id, r.name])))
const companyName = computed(() => new Map(companyOptions.value.map(c => [c.id, c.name])))
// 편집 프리필용: id로 원본 UserView 조회.
const userById = computed(() => new Map((data.value?.list ?? []).map(u => [u.id, u])))

// UserView.roles가 역할 id든 이름이든 체크박스가 인식하는 role id 집합으로 환원.
// 알 수 없는 값은 버려 존재하는 역할만 미리 체크되게 한다.
const roleIdByName = computed(() => new Map(roleOptions.value.map(r => [r.name, r.id])))
function resolveRoleIds(raw: string[]): string[] {
  const ids = new Set(roleOptions.value.map(r => r.id))
  return raw.map(v => (ids.has(v) ? v : roleIdByName.value.get(v) ?? '')).filter(v => ids.has(v))
}

const search = ref('')
const rows = computed<UserRow[]>(() => {
  const list: UserRow[] = (data.value?.list ?? []).map(u => ({
    id: u.id,
    status: { label: u.active ? '활성' : '정지', kind: u.active ? 'done' : 'idle' } as StatusCell,
    username: u.username,
    name: u.name,
    roles: (u.roles ?? []).map(r => roleName.value.get(r) ?? r).join(', ') || '—',
    company: u.companyId ? (companyName.value.get(u.companyId) ?? u.companyId) : '—',
    active: u.active,
  }))
  const q = search.value.trim().toLowerCase()
  return q ? list.filter(r => [r.username, r.name, r.roles, r.company].some(x => String(x).toLowerCase().includes(q))) : list
})

// 상태는 다른 목록 메뉴 관례대로 맨 뒤 컬럼.
const columns: Column[] = [
  { key: 'username', label: '아이디', kind: 'mono' },
  { key: 'name', label: '이름', kind: 'text' },
  { key: 'roles', label: '역할', kind: 'text' },
  { key: 'company', label: '회사', kind: 'text' },
  { key: 'status', label: '상태', kind: 'status' },
]

const drawerOpen = ref(false)
const editingId = ref<string | null>(null)
const form = ref<UserForm>(blankUserForm())
const isEdit = computed(() => editingId.value !== null)
const drawerTitle = computed(() => (isEdit.value ? '사용자 수정' : '사용자 등록'))

function openCreate() {
  editingId.value = null
  form.value = blankUserForm()
  drawerOpen.value = true
}
function openEdit(row: UserRow) {
  const u = userById.value.get(row.id)
  if (!u) return
  editingId.value = row.id
  // username은 변경 불가라 표시만; password는 비워 두고 입력 시에만 재설정.
  form.value = {
    username: u.username,
    password: '',
    name: u.name,
    email: u.email ?? '',
    mobile: u.mobile ?? '',
    memo: u.memo ?? '',
    companyId: u.companyId ?? '',
    roleIds: resolveRoleIds(u.roles ?? []),
  }
  drawerOpen.value = true
}
function toggleRole(id: string) {
  const i = form.value.roleIds.indexOf(id)
  if (i === -1) form.value.roleIds.push(id)
  else form.value.roleIds.splice(i, 1)
}
async function save() {
  const editing = editingId.value
  try {
    if (editing) await users.update(editing, form.value)
    else await users.create(form.value)
    drawerOpen.value = false
    await refresh()
    push(editing ? '수정되었습니다.' : '등록되었습니다.', 'success')
  } catch (e: any) {
    push(e?.message ?? '저장에 실패했습니다.', 'error')
  }
}
async function toggleActive(row: UserRow) {
  try {
    await users.setActive(row.id, !row.active)
    await refresh()
    push(row.active ? '정지되었습니다.' : '활성화되었습니다.', 'success')
  } catch (e: any) {
    push(e?.message ?? '변경에 실패했습니다.', 'error')
  }
}
</script>

<template>
  <section class="panel">
    <WPageHeader title="사용자" desc="시스템 사용자 관리" add-label="+ 사용자 등록"
      v-model:search="search" @add="openCreate" />
    <WDataTable v-if="rows.length" :columns="columns" :rows="rows" :actions-width="150">
      <template #actions="{ row }">
        <button class="act act--ghost" @click="openEdit(row as UserRow)">편집</button>
        <button class="act" :class="(row as UserRow).active ? 'act--danger' : 'act--primary'"
          @click="toggleActive(row as UserRow)">{{ (row as UserRow).active ? '정지' : '활성' }}</button>
      </template>
    </WDataTable>
    <WEmptyState v-else title="사용자가 없습니다"
      :message="pending ? '불러오는 중…' : '아래에서 새 사용자를 등록하세요.'"
      cta-label="+ 사용자 등록" @cta="openCreate" />

    <WDrawer v-model:open="drawerOpen" :title="drawerTitle" description="사용자 정보를 입력한 뒤 저장하세요.">
      <label class="fld"><span>아이디 <span v-if="!isEdit" class="req">*</span></span>
        <input v-model="form.username" placeholder="admin" :disabled="isEdit" /></label>
      <label class="fld"><span>{{ isEdit ? '새 비밀번호' : '비밀번호' }} <span v-if="!isEdit" class="req">*</span></span>
        <input v-model="form.password" type="password" :placeholder="isEdit ? '변경 시에만 입력' : ''" /></label>
      <label class="fld"><span>이름 <span class="req">*</span></span><input v-model="form.name" /></label>
      <label class="fld"><span>이메일</span><input v-model="form.email" type="email" placeholder="user@example.com" /></label>
      <label class="fld"><span>휴대폰</span><input v-model="form.mobile" /></label>
      <label class="fld"><span>회사</span>
        <select v-model="form.companyId">
          <option value="">(회사 없음)</option>
          <option v-for="c in companyOptions" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
      </label>
      <div class="fld">
        <span>역할</span>
        <div v-if="roleOptions.length" class="roles">
          <label v-for="r in roleOptions" :key="r.id" class="fld fld--row">
            <input type="checkbox" :checked="form.roleIds.includes(r.id)" @change="toggleRole(r.id)" />
            <span>{{ r.name }}</span>
          </label>
        </div>
        <span v-else class="muted">사용 가능한 역할이 없습니다.</span>
      </div>
      <label class="fld"><span>메모</span><textarea v-model="form.memo" rows="3" placeholder="메모"></textarea></label>
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
.muted { color: var(--ink-2); font-size: 12px; }
</style>
