<script setup lang="ts">
import { ref, computed } from 'vue'
import type { components } from '#shared/types/api'
import type { Column } from '~/components/WDataTable.vue'
import type { StatusCell } from '~/utils/status'
import { extractApiError } from '~/utils/apiError'
import { blankUserForm, type UserForm } from '~/utils/userForm'
import type { UserListStatus } from '~/composables/useUsers'

type UserView = components['schemas']['UserView']
type Role = components['schemas']['Role']
interface UserRow { id: string; status: StatusCell; username: string; name: string; roles: string; company: string; active: boolean }

const users = useUsers()
const { push } = useToast()
const authStore = useAuthStore()
// "세션" 관리 액션은 관리자/시스템에게만 노출한다(백엔드도 동일하게 강제하지만
// UI에서 먼저 숨겨 혼란을 줄인다).
const canManageSessions = computed(() => authStore.isAdmin)
// 정지는 soft delete다 — 행은 deactivated_at만 채워지고 남는다. 기본값이 '활성'이면
// 정지 직후 refresh에서 행이 사라져 삭제처럼 보이고, 아이디 UNIQUE 제약이 정지된
// 계정까지 덮으므로 "화면에 없는 아이디"가 중복으로 거절된다. 이 화면은 SYSTEM
// 전용(nav.ts의 minRank, 백엔드 routes.go의 RequireMinRole)이므로 기본으로 전부 보여준다.
const statusFilter = ref<UserListStatus>('all')
const STATUS_OPTIONS: { value: UserListStatus; label: string }[] = [
  { value: 'active', label: '활성' },
  { value: 'inactive', label: '정지' },
  { value: 'all', label: '전체' },
]
const { data, refresh, pending } = await useAsyncData('users', async () => {
  const [list, roleList, companyList] = await Promise.all([
    users.list(statusFilter.value), users.roles(), useClients().list(),
  ])
  return { list, roleList, companyList }
}, { watch: [statusFilter] })
const roleOptions = computed<Role[]>(() => data.value?.roleList ?? [])
// 체크박스 표시 순서: SYSTEM(30) > ADMIN(20) > USER(10) — rank 내림차순.
// 원본 roleOptions(이름순)는 그대로 두고 표시용 사본만 정렬한다.
const sortedRoleOptions = computed<Role[]>(() =>
  [...roleOptions.value].sort((a, b) => (b.rank ?? 0) - (a.rank ?? 0)),
)
const companyOptions = computed(() => data.value?.companyList ?? [])
// id→이름 매핑. UserView.roles/companyId가 이름이 아닌 id를 담을 수 있어 목록에선
// 이름으로 환원한다(매핑 실패 시 원본 값으로 폴백).
const roleName = computed(() => new Map(roleOptions.value.map(r => [r.id, r.name])))
const companyName = computed(() => new Map(companyOptions.value.map(c => [c.id, c.name])))
// ADMIN(non-SYSTEM)은 자기 회사에 고정된다 — 폼에 표시할 자기 회사명(폴백: id).
const ownCompanyName = computed(() => companyName.value.get(authStore.companyId) ?? authStore.companyId)
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

// 빈 목록 문구는 필터를 반영한다 — 필터가 걸린 상태에서 "새 사용자를 등록하세요"는
// 목록이 빈 이유를 오해하게 만든다. 기본값('전체')에서는 정말로 사용자가 없다.
const emptyTitle = computed(() => {
  if (statusFilter.value === 'inactive') return '정지된 사용자가 없습니다'
  if (statusFilter.value === 'active') return '활성 사용자가 없습니다'
  return '사용자가 없습니다'
})
const emptyMessage = computed(() => {
  if (pending.value) return '불러오는 중…'
  if (statusFilter.value !== 'all') return '상태 필터를 \'전체\'로 바꾸면 모든 사용자를 볼 수 있습니다.'
  return '아래에서 새 사용자를 등록하세요.'
})

const drawerOpen = ref(false)
const editingId = ref<string | null>(null)
const form = ref<UserForm>(blankUserForm())
const isEdit = computed(() => editingId.value !== null)
const drawerTitle = computed(() => (isEdit.value ? '사용자 수정' : '사용자 등록'))

function openCreate() {
  editingId.value = null
  form.value = blankUserForm()
  // ADMIN은 회사 선택이 없다 — 항상 자기 회사로 고정해 생성한다.
  if (!authStore.isSystem) form.value.companyId = authStore.companyId
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
    // ADMIN은 회사를 바꿀 수 없다 — SYSTEM만 원본 companyId를 그대로 편집.
    companyId: authStore.isSystem ? (u.companyId ?? '') : authStore.companyId,
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
    // code → 한국어(apiError.ts). 백엔드 message는 영문 개발자용이라 쓰지 않는다 —
    // 아이디 중복(username_taken)이 여기서 정지 계정을 안내하는 문구로 바뀐다.
    push(extractApiError(e, editing ? '수정에 실패했습니다.' : '등록에 실패했습니다.'), 'error')
  }
}
const sessionDrawerOpen = ref(false)
const sessionUserId = ref<string | null>(null)
const sessionUserLabel = ref('')
function openSessions(row: UserRow) {
  sessionUserId.value = row.id
  sessionUserLabel.value = row.name || row.username
  sessionDrawerOpen.value = true
}
async function toggleActive(row: UserRow) {
  try {
    await users.setActive(row.id, !row.active)
    await refresh()
    push(row.active ? '정지되었습니다.' : '활성화되었습니다.', 'success')
  } catch (e: any) {
    push(extractApiError(e, '변경에 실패했습니다.'), 'error')
  }
}
// 완전 삭제. 정지된 행에만 버튼을 내주므로 여기 오는 row는 항상 비활성이다
// (백엔드도 활성 계정을 409 user_active로 거절한다).
const deleteConfirmOpen = ref(false)
const pendingDelete = ref<UserRow | null>(null)
const deleteMessage = computed(() => {
  const r = pendingDelete.value
  if (!r) return ''
  return `${r.name}(${r.username}) 계정을 완전히 삭제합니다. 복구할 수 없으며, 감사 이력은 보존됩니다.`
})
function askDelete(row: UserRow) {
  pendingDelete.value = row
  deleteConfirmOpen.value = true
}
async function doDelete() {
  const row = pendingDelete.value
  if (!row) return
  try {
    await users.remove(row.id)
    await refresh()
    push('완전히 삭제되었습니다.', 'success')
  } catch (e: any) {
    push(extractApiError(e, '삭제에 실패했습니다.'), 'error')
  } finally {
    pendingDelete.value = null
  }
}
</script>

<template>
  <section class="panel">
    <WPageHeader title="사용자" desc="시스템 사용자 관리" add-label="+ 사용자 등록"
      v-model:search="search" @add="openCreate" @refresh="refresh">
      <template #header-actions>
        <select v-model="statusFilter" class="hd-field" aria-label="상태">
          <option v-for="o in STATUS_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
        </select>
      </template>
    </WPageHeader>
    <WDataTable v-if="rows.length" :columns="columns" :rows="rows" :actions-width="canManageSessions ? 270 : 210">
      <template #actions="{ row }">
        <button class="act act--ghost" @click="openEdit(row as UserRow)">편집</button>
        <button v-if="canManageSessions" class="act act--ghost" @click="openSessions(row as UserRow)">세션</button>
        <button class="act" :class="(row as UserRow).active ? 'act--danger' : 'act--primary'"
          @click="toggleActive(row as UserRow)">{{ (row as UserRow).active ? '정지' : '활성' }}</button>
        <button v-if="!(row as UserRow).active" class="act act--danger"
          @click="askDelete(row as UserRow)">삭제</button>
      </template>
    </WDataTable>
    <WEmptyState v-else :title="emptyTitle" :message="emptyMessage"
      cta-label="+ 사용자 등록" @cta="openCreate" />

    <WDrawer v-model:open="drawerOpen" :title="drawerTitle" description="사용자 정보를 입력한 뒤 저장하세요.">
      <label class="fld"><span>아이디 <span v-if="!isEdit" class="req">*</span></span>
        <input v-model="form.username" placeholder="admin" autocomplete="off" :disabled="isEdit" /></label>
      <label class="fld"><span>{{ isEdit ? '새 비밀번호' : '비밀번호' }} <span v-if="!isEdit" class="req">*</span></span>
        <input v-model="form.password" type="password" autocomplete="new-password" :placeholder="isEdit ? '변경 시에만 입력' : ''" /></label>
      <label class="fld"><span>이름 <span class="req">*</span></span><input v-model="form.name" /></label>
      <label class="fld"><span>이메일</span><input v-model="form.email" type="email" placeholder="user@example.com" /></label>
      <label class="fld"><span>휴대폰</span><input v-model="form.mobile" /></label>
      <label class="fld"><span>회사</span>
        <select v-if="authStore.isSystem" v-model="form.companyId">
          <option value="">(회사 없음)</option>
          <option v-for="c in companyOptions" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
        <input v-else :value="ownCompanyName" disabled />
      </label>
      <div class="fld">
        <span>역할</span>
        <div v-if="roleOptions.length" class="roles">
          <label v-for="r in sortedRoleOptions" :key="r.id" class="fld fld--row">
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

    <UserSessionsDrawer v-if="canManageSessions" v-model:open="sessionDrawerOpen"
      :user-id="sessionUserId" :user-label="sessionUserLabel" />
    <WConfirm v-model:open="deleteConfirmOpen" title="사용자 완전 삭제" :message="deleteMessage"
      confirm-label="완전 삭제" @confirm="doDelete" />
  </section>
</template>

<style scoped>
/* .fld / .act / .roles come from the global DS (assets/css/components.css). */
.panel { background: var(--panel); border: 1px solid var(--line); border-radius: 14px; overflow: hidden; box-shadow: var(--rim), var(--elev); }
.muted { color: var(--ink-2); font-size: 12px; }
/* .hd-field: 헤더 필터 컨트롤 스타일 (작업 현황 화면과 동일). */
.hd-field { padding: 8px 12px; border: 1px solid var(--line); border-radius: 9px; font-family: var(--font-mono); font-size: 12.5px; background: var(--th); color: var(--ink); }
</style>
