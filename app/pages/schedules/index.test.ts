// @vitest-environment nuxt
import { describe, it, expect, vi } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'
import SchedulesPage from './index.vue'

const { listMock, runMock } = vi.hoisted(() => ({ listMock: vi.fn(), runMock: vi.fn() }))
mockNuxtImport('useJobs', () => () => ({ list: listMock, create: vi.fn(), update: vi.fn(), remove: vi.fn(), run: runMock }))
mockNuxtImport('useToast', () => () => ({ toasts: ref([]), push: vi.fn() }))

describe('schedules page', () => {
  it('renders a job row with its company id', async () => {
    listMock.mockResolvedValue([{ id: 'j1', insuranceCompanyCode: 'samsung_property', companyId: 'c1', accountId: 'a1', workFileIds: ['wf1'], startDay: 1, closingMonthOffset: 0, priority: 5, timeoutSec: 300, locked: false }])
    const el = await mountSuspended(SchedulesPage)
    expect(el.text()).toContain('c1')
    expect(el.text()).toContain('일정 등록')
  })

  it('explains auto-generation and links to the schedule queue screen', async () => {
    listMock.mockResolvedValue([])
    const el = await mountSuspended(SchedulesPage)
    expect(el.text()).toContain('매일 17:00에 다음날 작업으로 자동 생성됩니다')
    expect(el.text()).toContain('작업 큐 보기')
    expect(el.find('a[href="/schedule-queue"]').exists()).toBe(true)
  })
})
