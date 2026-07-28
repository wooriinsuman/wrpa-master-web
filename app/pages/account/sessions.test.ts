// @vitest-environment nuxt
import { describe, it, expect, vi, afterEach } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'
import SessionsPage from './sessions.vue'

const { listMock, activityMock } = vi.hoisted(() => ({ listMock: vi.fn(), activityMock: vi.fn() }))
mockNuxtImport('useSessions', () => () => ({
  list: listMock, activity: activityMock,
  revoke: vi.fn(), revokeOthers: vi.fn(),
  listForUser: vi.fn(), revokeForUser: vi.fn(), revokeAllForUser: vi.fn(), activityForUser: vi.fn(),
}))
mockNuxtImport('useToast', () => () => ({ toasts: ref([]), push: vi.fn() }))

const NOW = 1_753_600_000_000
const CHROME_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'

function session(over: Record<string, unknown> = {}) {
  return { familyId: 'f1', createdAt: NOW, lastUsedAt: NOW, active: true, current: false, ...over }
}

describe('account sessions page', () => {
  afterEach(() => {
    // useAsyncData caches by key across mounts — without this a later test silently
    // re-uses the first test's value instead of its own mock.
    clearNuxtData()
    listMock.mockReset(); activityMock.mockReset()
  })

  it('shows the shortened UA label rather than the raw string', async () => {
    listMock.mockResolvedValue([session({ userAgent: CHROME_UA, clientIp: '203.0.113.9' })])
    activityMock.mockResolvedValue([])

    const el = await mountSuspended(SessionsPage)
    expect(el.text()).toContain('Chrome 126 · Windows')
    expect(el.text()).not.toContain('AppleWebKit')
  })

  // 축약해도 원문을 잃지 않아야 한다 — 관리자 드로어와 같은 규칙.
  it('keeps the raw UA available as a tooltip', async () => {
    listMock.mockResolvedValue([session({ userAgent: CHROME_UA })])
    activityMock.mockResolvedValue([])

    const el = await mountSuspended(SessionsPage)
    expect(el.find(`[title="${CHROME_UA}"]`).exists()).toBe(true)
  })

  // 툴팁은 원문이 있을 때만 붙어야 한다. 페이지의 다른 요소(헤더 버튼 등)도 title을 갖고
  // 있으므로 [title] 존재 여부가 아니라 빈 툴팁이 렌더되지 않는지를 본다.
  it('labels a session with no UA and renders no empty tooltip', async () => {
    listMock.mockResolvedValue([session({ userAgent: undefined })])
    activityMock.mockResolvedValue([])

    const el = await mountSuspended(SessionsPage)
    expect(el.text()).toContain('알 수 없는 기기')
    expect(el.html()).not.toContain('title=""')
    expect(el.html()).not.toContain('title="undefined"')
  })

  // 프록시 수정 전에 기록된 세션은 UA가 'node'다 — 알아보지 못하면 원문을 그대로 보여준다.
  it('passes an unrecognised UA through unchanged', async () => {
    listMock.mockResolvedValue([session({ userAgent: 'node' })])
    activityMock.mockResolvedValue([])

    const el = await mountSuspended(SessionsPage)
    expect(el.text()).toContain('node')
  })
})
