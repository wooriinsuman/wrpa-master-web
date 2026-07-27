// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import AppSidebar from './AppSidebar.vue'
import { useAuthStore } from '~/stores/auth'

describe('AppSidebar role gating', () => {
  it('level 10 (user) sees only USER-rank items, not admin/system-only ones', async () => {
    const auth = useAuthStore()
    auth.user = { userId: '1', username: 'u', roles: [], level: 10 }
    const el = await mountSuspended(AppSidebar)
    expect(el.text()).toContain('대시보드')
    expect(el.text()).toContain('계정')
    expect(el.text()).not.toContain('사용자')
    expect(el.text()).not.toContain('워커')
    // Group with no visible items at this level (시스템 group is all admin/system-rank).
    expect(el.text()).not.toContain('시스템')
  })

  it('level 20 (admin) sees admin items but not system-only items', async () => {
    const auth = useAuthStore()
    auth.user = { userId: '2', username: 'a', roles: [], level: 20 }
    const el = await mountSuspended(AppSidebar)
    expect(el.text()).toContain('작업 일정')
    // 사용자/회사 관리는 SYSTEM 전용으로 승격 — ADMIN에게는 더 이상 노출되지 않는다.
    expect(el.text()).not.toContain('사용자')
    expect(el.text()).not.toContain('회사')
    expect(el.text()).not.toContain('워커')
    expect(el.text()).not.toContain('패키지')
  })

  it('level 30 (system) sees every nav item', async () => {
    const auth = useAuthStore()
    auth.user = { userId: '3', username: 's', roles: [], level: 30 }
    const el = await mountSuspended(AppSidebar)
    for (const label of ['대시보드', '워커', '패키지', '보험사', '데이터 유형', '작업 파일', '휴일', '사용자']) {
      expect(el.text()).toContain(label)
    }
  })
})
