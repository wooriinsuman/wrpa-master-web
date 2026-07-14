// @vitest-environment nuxt
import { describe, it, expect, vi } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'
import SchedulesPage from './index.vue'

const { listMock, runMock } = vi.hoisted(() => ({ listMock: vi.fn(), runMock: vi.fn() }))
mockNuxtImport('useJobs', () => () => ({ list: listMock, create: vi.fn(), update: vi.fn(), remove: vi.fn(), run: runMock }))
mockNuxtImport('useToast', () => () => ({ toasts: ref([]), push: vi.fn() }))
// 이름 매핑·선택자 참조 목록 — 비워두면 표는 원본 ID로 폴백해 표기.
mockNuxtImport('useClients', () => () => ({ list: vi.fn().mockResolvedValue([]) }))
mockNuxtImport('useAccounts', () => () => ({ list: vi.fn().mockResolvedValue([]) }))
mockNuxtImport('useInsurers', () => () => ({ list: vi.fn().mockResolvedValue([]) }))
mockNuxtImport('useWorkFiles', () => () => ({ list: vi.fn().mockResolvedValue([]) }))
mockNuxtImport('useDataTypes', () => () => ({ list: vi.fn().mockResolvedValue([]) }))

describe('schedules page', () => {
  it('renders a job row with its company id', async () => {
    listMock.mockResolvedValue([{ id: 'j1', insuranceCompanyCode: 'samsung_property', companyId: 'c1', accountId: 'a1', workFileIds: ['wf1'], startDay: 1, closingMonthOffset: 0, priority: 5, timeoutSec: 300, locked: false }])
    const el = await mountSuspended(SchedulesPage)
    expect(el.text()).toContain('c1')
    expect(el.text()).toContain('일정 등록')
  })

  it('explains auto-generation of the daily queue', async () => {
    listMock.mockResolvedValue([])
    const el = await mountSuspended(SchedulesPage)
    expect(el.text()).toContain('매일 17:00에 다음날 작업으로 자동 생성됩니다')
  })
})
