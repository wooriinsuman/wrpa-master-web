// @vitest-environment nuxt
import { describe, it, expect, vi, afterEach } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'
import UserSessionsDrawer from './UserSessionsDrawer.vue'

const { listForUser, activityForUser, revokeAllForUser, revokeForUser } = vi.hoisted(() => ({
  listForUser: vi.fn(),
  activityForUser: vi.fn(),
  revokeAllForUser: vi.fn(),
  revokeForUser: vi.fn(),
}))
mockNuxtImport('useSessions', () => () => ({
  listForUser, activityForUser, revokeAllForUser, revokeForUser,
  list: vi.fn(), revoke: vi.fn(), revokeOthers: vi.fn(), activity: vi.fn(),
}))
mockNuxtImport('useToast', () => () => ({ toasts: ref([]), push: vi.fn() }))

const NOW = 1_753_600_000_000

describe('UserSessionsDrawer', () => {
  afterEach(() => {
    // WDrawer의 DialogPortal은 document.body로 teleport한다 — 테스트 간 정리.
    document.body.innerHTML = ''
    listForUser.mockReset(); activityForUser.mockReset()
    revokeAllForUser.mockReset(); revokeForUser.mockReset()
  })

  it('renders both columns with parsed UA and activity labels', async () => {
    listForUser.mockResolvedValue([{
      familyId: 'f1', createdAt: NOW, lastUsedAt: NOW, active: true, current: false,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      clientIp: '203.0.113.9',
    }])
    activityForUser.mockResolvedValue([{ action: 'login', createdAt: NOW, ip: '203.0.113.9' }])

    await mountSuspended(UserSessionsDrawer, { props: { open: true, userId: 'u-1', userLabel: '홍길동' } })

    expect(document.body.textContent).toContain('로그인 세션')
    expect(document.body.textContent).toContain('활동 이력')
    expect(document.body.textContent).toContain('Chrome 126 · Windows')
    expect(document.body.textContent).toContain('203.0.113.9')
    expect(document.body.textContent).toContain('로그인')
  })

  it('shows the bulk revoke button when there is a revocable session', async () => {
    listForUser.mockResolvedValue([
      { familyId: 'f1', createdAt: NOW, lastUsedAt: NOW, active: true, current: false },
    ])
    activityForUser.mockResolvedValue([])

    await mountSuspended(UserSessionsDrawer, { props: { open: true, userId: 'u-1', userLabel: '홍길동' } })
    expect(document.body.textContent).toContain('전체 강제 로그아웃')
  })

  // 끊을 수 있는 세션이 없으면 버튼 자체를 그리지 않는다 — 눌러도 아무 일도
  // 일어나지 않는 버튼을 두면 실패한 것처럼 보인다.
  it('hides the bulk revoke button when only the caller\'s own session remains', async () => {
    listForUser.mockResolvedValue([
      { familyId: 'f-self', createdAt: NOW, lastUsedAt: NOW, active: true, current: true },
    ])
    activityForUser.mockResolvedValue([])

    await mountSuspended(UserSessionsDrawer, { props: { open: true, userId: 'u-1', userLabel: '홍길동' } })
    expect(document.body.textContent).not.toContain('전체 강제 로그아웃')
    expect(document.body.textContent).toContain('현재 기기')
  })

  it('hides the bulk revoke button when there are no sessions at all', async () => {
    listForUser.mockResolvedValue([])
    activityForUser.mockResolvedValue([])

    await mountSuspended(UserSessionsDrawer, { props: { open: true, userId: 'u-1', userLabel: '홍길동' } })
    expect(document.body.textContent).not.toContain('전체 강제 로그아웃')
    expect(document.body.textContent).toContain('활성 세션이 없습니다')
  })

  // 관리자가 남의 세션을 볼 때는 current 가 전부 false 라 어느 기기가 지금 쓰이는지
  // 단서가 없다 — lastUsedAt 이 가장 큰 하나를 표시한다.
  it('badges the most recently used session when two or more are active', async () => {
    listForUser.mockResolvedValue([
      { familyId: 'f-old', createdAt: NOW, lastUsedAt: NOW, active: true, current: false },
      { familyId: 'f-new', createdAt: NOW, lastUsedAt: NOW + 60_000, active: true, current: false },
    ])
    activityForUser.mockResolvedValue([])

    await mountSuspended(UserSessionsDrawer, { props: { open: true, userId: 'u-1', userLabel: '홍길동' } })
    expect(document.body.textContent).toContain('최근 활동')
  })

  // 단 하나뿐이면 "가장 최근"이라는 표시가 아무것도 구분해주지 않는다.
  it('does not badge a lone active session', async () => {
    listForUser.mockResolvedValue([
      { familyId: 'f1', createdAt: NOW, lastUsedAt: NOW, active: true, current: false },
    ])
    activityForUser.mockResolvedValue([])

    await mountSuspended(UserSessionsDrawer, { props: { open: true, userId: 'u-1', userLabel: '홍길동' } })
    expect(document.body.textContent).not.toContain('최근 활동')
  })
})
