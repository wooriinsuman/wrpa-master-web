<!-- app/components/UserSessionsDrawer.vue -->
<!-- 관리자가 대상 유저의 세션을 조회/강제 로그아웃하는 드로어. 로그인 세션과 활동
     이력을 2열로 나란히 두고(좁은 화면에서는 1열), 세션 컬럼 헤더에서 일괄 강제
     로그아웃을 건다. open이 true로 바뀔 때마다 대상 유저가 바뀌었을 수 있으므로
     매번 다시 불러온다. -->
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { components } from '#shared/types/api'
import type { StatusKind } from '~/utils/status'
import { extractApiError } from '~/utils/apiError'
import { fmtDateTime } from '~/utils/format'
import { activityLabel, activityKind } from '~/utils/activity'
import { formatUserAgent } from '~/utils/userAgent'

type SessionView = components['schemas']['SessionView']
type ActivityView = components['schemas']['ActivityView']

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

// 일괄 로그아웃이 실제로 끊을 세션 = 활성이면서 호출자 본인 것이 아닌 것.
// 백엔드가 본인 세션을 남기므로(RevokeAllSessionsAsAdmin), 화면의 개수도 같은
// 기준으로 세야 확인 문구의 숫자가 결과와 어긋나지 않는다.
const revocable = computed(() => list.value.filter(s => s.active && !s.current))

// '최근 활동' 뱃지 대상. 관리자가 남의 세션을 볼 때는 current 가 전부 false 라
// 어느 기기가 지금 쓰이는지 단서가 없다 — 그 자리를 메운다. 활성 세션이 하나뿐이면
// "가장 최근"이 아무것도 구분해주지 않으므로 표시하지 않는다.
const recentFamilyId = computed(() => {
  const active = list.value.filter(s => s.active)
  if (active.length < 2) return null
  return active.reduce((a, b) => (b.lastUsedAt > a.lastUsedAt ? b : a)).familyId
})

function statusOf(s: SessionView): { label: string; kind: StatusKind } {
  if (s.current) return { label: '현재 기기', kind: 'run' }
  if (!s.active) return { label: '만료', kind: 'idle' }
  if (s.familyId === recentFamilyId.value) return { label: '최근 활동', kind: 'run' }
  return { label: '활성', kind: 'done' }
}

// 개별/일괄을 확인 다이얼로그 하나로 처리한다 — 'all'이 일괄, SessionView가 개별.
const confirmOpen = ref(false)
const pendingRevoke = ref<SessionView | 'all' | null>(null)

const confirmTitle = computed(() => pendingRevoke.value === 'all' ? '전체 강제 로그아웃' : '세션 강제 로그아웃')
const confirmLabel = computed(() => pendingRevoke.value === 'all' ? '전체 강제 로그아웃' : '강제 로그아웃')
const confirmMessage = computed(() => {
  const target = pendingRevoke.value
  if (!target) return ''
  const who = props.userLabel || '유저'
  if (target === 'all') {
    // 관리자가 자기 계정을 대상으로 했다면 현재 기기는 남는다 — 문구에 드러낸다.
    return list.value.some(s => s.current)
      ? `현재 기기를 제외한 세션 ${revocable.value.length}개를 강제 로그아웃합니다.`
      : `${who} 님의 세션 ${revocable.value.length}개를 모두 강제 로그아웃합니다. 해당 사용자는 즉시 로그아웃됩니다.`
  }
  return `${who} 님의 ${formatUserAgent(target.userAgent)} — 이 세션을 강제 로그아웃 처리합니다.`
})

function askRevoke(s: SessionView) { pendingRevoke.value = s; confirmOpen.value = true }
function askRevokeAll() { pendingRevoke.value = 'all'; confirmOpen.value = true }

async function doRevoke() {
  const target = pendingRevoke.value
  pendingRevoke.value = null
  const id = props.userId
  if (!target || !id) return
  try {
    if (target === 'all') await sessions.revokeAllForUser(id)
    else await sessions.revokeForUser(id, target.familyId)
    await load()
    push('강제 로그아웃되었습니다.', 'success')
  } catch (e: any) {
    push(extractApiError(e, '강제 로그아웃에 실패했습니다.'), 'error')
  }
}

function close() { emit('update:open', false) }
</script>

<template>
  <WDrawer :open="open" :width="880" title="세션 관리"
    :description="userLabel ? `${userLabel}의 로그인 세션` : '유저의 로그인 세션'"
    @update:open="v => emit('update:open', v)">
    <div v-if="userLabel" class="user-header">{{ userLabel }} 님의 접속 현황</div>

    <div class="cols">
      <section class="col">
        <div class="col-head">
          <h3 class="col-title">로그인 세션<span v-if="list.length" class="col-count">{{ list.length }}</span></h3>
          <button v-if="revocable.length" class="act act--danger act--sm" @click="askRevokeAll">전체 강제 로그아웃</button>
        </div>
        <div v-if="pending" class="muted">불러오는 중…</div>
        <div v-else-if="!list.length" class="muted">활성 세션이 없습니다.</div>
        <ul v-else class="sess-list">
          <li v-for="s in list" :key="s.familyId" class="sess-row">
            <div class="sess-top">
              <div class="sess-ua" :title="s.userAgent || undefined">{{ formatUserAgent(s.userAgent) }}</div>
              <WStatusBadge :label="statusOf(s).label" :kind="statusOf(s).kind" />
            </div>
            <div class="sess-meta">
              <span class="mono">{{ s.clientIp || '-' }}</span>
              <span>최초 {{ fmtDateTime(s.createdAt) }}</span>
              <span>최근 {{ fmtDateTime(s.lastUsedAt) }}</span>
            </div>
            <button v-if="!s.current && s.active" class="act act--danger act--sm sess-act"
              @click="askRevoke(s)">강제 로그아웃</button>
          </li>
        </ul>
      </section>

      <section class="col">
        <div class="col-head"><h3 class="col-title">활동 이력</h3></div>
        <div v-if="activityPending" class="muted">불러오는 중…</div>
        <div v-else-if="!activity.length" class="muted">활동 이력이 없습니다.</div>
        <ul v-else class="sess-list">
          <li v-for="(e, i) in activity" :key="i" class="sess-row">
            <div class="sess-top">
              <WStatusBadge :label="activityLabel(e.action)" :kind="activityKind(e.action)" />
            </div>
            <div class="sess-meta">
              <span>{{ fmtDateTime(e.createdAt) }}</span>
              <span v-if="e.ip" class="mono">{{ e.ip }}</span>
            </div>
          </li>
        </ul>
      </section>
    </div>

    <template #footer>
      <button class="act act--ghost" @click="close">닫기</button>
    </template>
  </WDrawer>

  <WConfirm v-model:open="confirmOpen" :title="confirmTitle" :message="confirmMessage"
    :confirm-label="confirmLabel" @confirm="doRevoke" />
</template>

<style scoped>
.user-header { color: var(--ink); font-size: 14px; font-weight: 600; }
.muted { color: var(--ink-2); font-size: 12px; }
.cols { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; align-items: start; }
.col { min-width: 0; display: flex; flex-direction: column; gap: 10px; }
.col-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-height: 28px; }
.col-title { font-size: 13px; font-weight: 600; color: var(--ink); margin: 0; }
.col-count { margin-left: 6px; font-size: 12px; font-weight: 500; color: var(--ink-2); }
/* 한쪽 목록이 길어져도 다이얼로그 높이가 튀지 않도록 컬럼마다 따로 스크롤한다. */
.sess-list { display: flex; flex-direction: column; gap: 10px; list-style: none; padding: 0; margin: 0; max-height: 52vh; overflow-y: auto; }
.sess-row { display: flex; flex-direction: column; gap: 6px; padding: 10px 12px; border: 1px solid var(--line); border-radius: 10px; background: var(--th); }
.sess-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
/* 컬럼 폭이 ~410px라 UA·호스트가 길면 넘친다 — 잘라내지 말고 줄바꿈한다. */
.sess-ua { font-size: 13px; font-weight: 600; color: var(--ink); min-width: 0; overflow-wrap: anywhere; }
.sess-meta { display: flex; flex-wrap: wrap; gap: 8px; font-size: 11px; color: var(--ink-2); }
.mono { font-family: var(--font-mono); }
.act--sm { font-size: 11.5px; padding: 4px 9px; }
.sess-act { align-self: flex-start; }
@media (max-width: 820px) {
  .cols { grid-template-columns: 1fr; }
  .sess-list { max-height: none; }
}
</style>
