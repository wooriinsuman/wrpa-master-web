<!-- app/components/UserSessionsDrawer.vue -->
<!-- 관리자가 대상 유저의 세션을 조회/강제 로그아웃하는 드로어. WDrawer(v-model:open) 위에
     account/sessions.vue와 동일한 목록+WConfirm 패턴을 얹는다. open이 true로 바뀔 때마다
     대상 유저가 바뀌었을 수 있으므로 매번 다시 불러온다. -->
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { components } from '#shared/types/api'
import type { StatusKind } from '~/utils/status'
import { extractApiError } from '~/utils/apiError'
import { fmtDateTime } from '~/utils/format'
import { activityLabel, activityKind } from '~/utils/activity'

type SessionView = components['schemas']['SessionView']
type ActivityView = components['schemas']['ActivityView']

function statusOf(s: SessionView): { label: string; kind: StatusKind } {
  if (s.current) return { label: '현재 기기', kind: 'run' }
  return s.active ? { label: '활성', kind: 'done' } : { label: '만료', kind: 'idle' }
}

const props = defineProps<{ userId: string | null; open: boolean; userLabel?: string }>()
const emit = defineEmits<{ 'update:open': [v: boolean] }>()

const sessions = useSessions()
const { push } = useToast()

const list = ref<SessionView[]>([])
const pending = ref(false)
const activity = ref<ActivityView[]>([])
const activityPending = ref(false)

async function load() {
  const id = props.userId
  if (!id) { list.value = []; activity.value = []; return }
  pending.value = true
  try {
    list.value = await sessions.listForUser(id)
  } catch (e: any) {
    push(extractApiError(e, '세션 목록을 불러오지 못했습니다.'), 'error')
    list.value = []
  } finally {
    pending.value = false
  }
  activityPending.value = true
  try {
    activity.value = await sessions.activityForUser(id)
  } catch (e: any) {
    push(extractApiError(e, '활동 이력을 불러오지 못했습니다.'), 'error')
    activity.value = []
  } finally {
    activityPending.value = false
  }
}

// 열릴 때(또는 열린 채로 대상 유저가 바뀔 때)마다 새로 불러온다.
watch(() => [props.open, props.userId] as const, ([isOpen]) => { if (isOpen) load() }, { immediate: true })

const confirmOpen = ref(false)
const pendingRevoke = ref<SessionView | null>(null)
const confirmMessage = computed(() => {
  if (!pendingRevoke.value) return ''
  const device = pendingRevoke.value.userAgent || '알 수 없는 기기'
  const user = props.userLabel || '유저'
  return `${user} 님의 ${device} — 이 세션을 강제 로그아웃 처리합니다.`
})
function askRevoke(s: SessionView) { pendingRevoke.value = s; confirmOpen.value = true }
async function doRevoke() {
  const s = pendingRevoke.value
  pendingRevoke.value = null
  const id = props.userId
  if (!s || !id) return
  try {
    await sessions.revokeForUser(id, s.familyId)
    await load()
    push('강제 로그아웃되었습니다.', 'success')
  } catch (e: any) {
    push(extractApiError(e, '강제 로그아웃에 실패했습니다.'), 'error')
  }
}

function close() { emit('update:open', false) }
</script>

<template>
  <WDrawer :open="open" title="세션 관리" :description="userLabel ? `${userLabel}의 로그인 세션` : '유저의 로그인 세션'"
    @update:open="v => emit('update:open', v)">
    <div v-if="userLabel" class="user-header">{{ userLabel }} 님의 로그인 세션</div>
    <div v-if="pending" class="muted">불러오는 중…</div>
    <div v-else-if="!list.length" class="muted">활성 세션이 없습니다.</div>
    <ul v-else class="sess-list">
      <li v-for="s in list" :key="s.familyId" class="sess-row">
        <div class="sess-info">
          <div class="sess-ua">{{ s.userAgent || '알 수 없는 기기' }}</div>
          <div class="sess-meta">
            <span class="mono">{{ s.clientIp || '-' }}</span>
            <span>최초 {{ fmtDateTime(s.createdAt) }}</span>
            <span>최근 {{ fmtDateTime(s.lastUsedAt) }}</span>
          </div>
        </div>
        <WStatusBadge :label="statusOf(s).label" :kind="statusOf(s).kind" />
        <button v-if="!s.current && s.active" class="act act--danger" @click="askRevoke(s)">강제 로그아웃</button>
      </li>
    </ul>

    <div class="activity-header">활동 이력</div>
    <div v-if="activityPending" class="muted">불러오는 중…</div>
    <div v-else-if="!activity.length" class="muted">활동 이력이 없습니다.</div>
    <ul v-else class="sess-list">
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
    <template #footer>
      <button class="act act--ghost" @click="close">닫기</button>
    </template>
  </WDrawer>

  <WConfirm v-model:open="confirmOpen" title="세션 강제 로그아웃" :message="confirmMessage" confirm-label="강제 로그아웃" @confirm="doRevoke" />
</template>

<style scoped>
.user-header { color: var(--ink); font-size: 14px; font-weight: 600; margin-bottom: 16px; }
.muted { color: var(--ink-2); font-size: 12px; }
.activity-header { color: var(--ink); font-size: 13px; font-weight: 600; margin: 20px 0 10px; }
.sess-list { display: flex; flex-direction: column; gap: 10px; list-style: none; padding: 0; margin: 0; }
.sess-row { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border: 1px solid var(--line); border-radius: 10px; background: var(--th); }
.sess-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.sess-ua { font-size: 13px; font-weight: 600; color: var(--ink); }
.sess-meta { display: flex; flex-wrap: wrap; gap: 8px; font-size: 11px; color: var(--ink-2); }
.mono { font-family: var(--font-mono); }
</style>
