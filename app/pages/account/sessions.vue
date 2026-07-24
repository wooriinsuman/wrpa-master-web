<script setup lang="ts">
import { computed, ref } from 'vue'
import type { components } from '#shared/types/api'
import type { Column } from '~/components/WDataTable.vue'
import type { StatusCell } from '~/utils/status'
import { extractApiError } from '~/utils/apiError'
import { fmtDateTime } from '~/utils/format'
import { activityLabel, activityKind } from '~/utils/activity'

type SessionView = components['schemas']['SessionView']
type ActivityView = components['schemas']['ActivityView']
interface SessionRow {
  familyId: string
  device: string
  ip: string
  createdAt: string
  lastUsedAt: string
  status: StatusCell
  _src: SessionView
}

const sessions = useSessions()
const { push } = useToast()

const { data, pending, refresh } = await useAsyncData('my-sessions', () => sessions.list())
const list = computed<SessionView[]>(() => data.value ?? [])

const columns: Column[] = [
  { key: 'device', label: '기기', kind: 'text' },
  { key: 'ip', label: 'IP', kind: 'mono' },
  { key: 'createdAt', label: '최초 로그인', kind: 'mono' },
  { key: 'lastUsedAt', label: '최근 사용', kind: 'mono' },
  { key: 'status', label: '상태', kind: 'status' },
]

const rows = computed<SessionRow[]>(() => list.value.map(s => ({
  familyId: s.familyId,
  device: s.userAgent || '알 수 없는 기기',
  ip: s.clientIp || '-',
  createdAt: fmtDateTime(s.createdAt),
  lastUsedAt: fmtDateTime(s.lastUsedAt),
  status: s.current
    ? { label: '현재 기기', kind: 'run' } as StatusCell
    : s.active
      ? { label: '활성', kind: 'done' } as StatusCell
      : { label: '만료', kind: 'idle' } as StatusCell,
  _src: s,
})))

// 로그아웃(개별) — 다른 목록 메뉴 관례대로 공용 WConfirm으로 게이트.
const confirmOpen = ref(false)
const pendingRevoke = ref<SessionView | null>(null)
const confirmMessage = computed(() =>
  pendingRevoke.value ? `${pendingRevoke.value.userAgent || '알 수 없는 기기'} — 이 기기를 로그아웃 처리합니다.` : '',
)
function askRevoke(s: SessionView) { pendingRevoke.value = s; confirmOpen.value = true }
async function doRevoke() {
  const s = pendingRevoke.value
  pendingRevoke.value = null
  if (!s) return
  try {
    await sessions.revoke(s.familyId)
    await refresh()
    push('로그아웃되었습니다.', 'success')
  } catch (e: any) {
    push(extractApiError(e, '로그아웃에 실패했습니다.'), 'error')
  }
}

// 다른 기기 모두 로그아웃 — 확인 없이 즉시 실행할 만큼 되돌리기 쉬운 작업은 아니므로 동일하게 WConfirm으로 게이트.
const confirmOthersOpen = ref(false)
async function doRevokeOthers() {
  try {
    await sessions.revokeOthers()
    await refresh()
    push('다른 기기가 모두 로그아웃되었습니다.', 'success')
  } catch (e: any) {
    push(extractApiError(e, '로그아웃에 실패했습니다.'), 'error')
  }
}

// 내 활동 타임라인 — "더 보기"는 페이지 크기를 늘려 다시 조회하는 단순한 방식으로 시작.
const activitySize = ref(50)
const { data: activityData, pending: activityPending, refresh: refreshActivity } = await useAsyncData(
  'my-activity',
  () => sessions.activity(0, activitySize.value),
  { watch: [activitySize] },
)
const activity = computed<ActivityView[]>(() => activityData.value ?? [])
const canLoadMoreActivity = computed(() => activity.value.length >= activitySize.value)
function loadMoreActivity() { activitySize.value += 50 }
</script>

<template>
  <section class="panel">
    <WPageHeader title="내 세션" desc="현재 로그인된 기기 목록을 관리합니다" @refresh="refresh">
      <template #header-actions>
        <WButton variant="danger" @click="confirmOthersOpen = true">다른 기기 모두 로그아웃</WButton>
      </template>
    </WPageHeader>

    <WDataTable v-if="rows.length" :columns="columns" :rows="rows" :actions-width="110">
      <template #actions="{ row }">
        <button
          v-if="!(row as SessionRow)._src.current && (row as SessionRow)._src.active"
          class="act act--danger"
          @click="askRevoke((row as SessionRow)._src)"
        >로그아웃</button>
      </template>
    </WDataTable>
    <WEmptyState
      v-else
      title="세션이 없습니다"
      :message="pending ? '불러오는 중…' : '로그인된 기기가 없습니다.'"
    />

    <WConfirm v-model:open="confirmOpen" title="세션 로그아웃" :message="confirmMessage" confirm-label="로그아웃" @confirm="doRevoke" />
    <WConfirm
      v-model:open="confirmOthersOpen"
      title="다른 기기 모두 로그아웃"
      message="현재 기기를 제외한 모든 세션이 로그아웃됩니다."
      confirm-label="모두 로그아웃"
      @confirm="doRevokeOthers"
    />
  </section>

  <section class="panel activity-panel">
    <WPageHeader title="활동 기록" desc="로그인·세션 관련 계정 활동 이력" @refresh="refreshActivity" />

    <ul v-if="activity.length" class="sess-list">
      <li v-for="(e, i) in activity" :key="i" class="sess-row">
        <div class="sess-info">
          <WStatusBadge :label="activityLabel(e.action)" :kind="activityKind(e.action)" />
          <div class="sess-meta">
            <span>{{ fmtDateTime(e.createdAt) }}</span>
            <span v-if="e.ip" class="mono">{{ e.ip }}</span>
          </div>
        </div>
      </li>
    </ul>
    <WEmptyState
      v-else
      title="활동 기록이 없습니다"
      :message="activityPending ? '불러오는 중…' : '계정 활동 이력이 없습니다.'"
    />

    <div v-if="canLoadMoreActivity" class="activity-more">
      <button class="act act--ghost" :disabled="activityPending" @click="loadMoreActivity">더 보기</button>
    </div>
  </section>
</template>

<style scoped>
.panel { background: var(--panel); border: 1px solid var(--line); border-radius: 14px; overflow: hidden; box-shadow: var(--rim), var(--elev); }
.activity-panel { margin-top: 20px; padding-bottom: 16px; }
.sess-list { display: flex; flex-direction: column; gap: 10px; list-style: none; padding: 0 20px; margin: 0; }
.sess-row { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border: 1px solid var(--line); border-radius: 10px; background: var(--th); }
.sess-info { flex: 1; min-width: 0; display: flex; align-items: center; gap: 12px; }
.sess-meta { display: flex; flex-wrap: wrap; gap: 8px; font-size: 11px; color: var(--ink-2); }
.mono { font-family: var(--font-mono); }
.activity-more { display: flex; justify-content: center; padding: 14px 20px 4px; }
</style>
