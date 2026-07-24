// @vitest-environment nuxt
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'
import ScheduleQueuePage from './index.vue'
import { useAuthStore } from '~/stores/auth'

const { getMock, setPriorityMock, cancelMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  setPriorityMock: vi.fn(),
  cancelMock: vi.fn(),
}))
mockNuxtImport('useScheduleQueue', () => () => ({
  get: getMock,
  setPriority: setPriorityMock,
  cancel: cancelMock,
}))
mockNuxtImport('useDataTypes', () => () => ({
  list: vi.fn().mockResolvedValue([
    { code: 'new', name: '신계약', note: '' },
  ]),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}))
mockNuxtImport('useToast', () => () => ({ toasts: ref([]), push: vi.fn() }))

function baseQueue(overrides: Record<string, any> = {}) {
  return {
    date: '2026-07-10',
    businessDay: 3,
    simulated: false,
    entries: [
      {
        workId: 'w1',
        jobId: 'j1',
        companyId: 'c1',
        insuranceCompanyCode: 'samsung_property',
        accountId: 'a1',
        category: '0:new',
        closingMonth: '2026-07',
        runTime: '09:00:00',
        priority: 10,
        tasks: ['contract_list_all_a'],
        status: 'pending',
        eligibleWorkerIds: ['worker-1'],
      },
      {
        workId: 'w2',
        jobId: 'j2',
        companyId: 'c1',
        insuranceCompanyCode: 'hyundai_marine',
        accountId: 'a2',
        category: '-1:new',
        closingMonth: '2026-06',
        runTime: '09:05:00',
        priority: 20,
        tasks: ['contract_list_all_b'],
        status: 'done',
        eligibleWorkerIds: ['worker-1'],
      },
    ],
    workers: [
      { workerId: 'worker-1', name: '워커1', entryIndexes: [0, 1] },
    ],
    ...overrides,
  }
}

describe('schedule-queue page', () => {
  // setPriority/cancel은 /works/{id}/...라 백엔드에서 RankSystem 전용이다 — 기존
  // 동작(우선순위 편집+취소 노출)은 SYSTEM 기준으로 검증한다. 비-SYSTEM 게이팅은 별도 테스트에서 확인.
  beforeEach(() => {
    const auth = useAuthStore()
    auth.user = { userId: 'sys', username: 'sys', roles: [], level: 30 }
  })

  it('renders one row per entry, an editable priority + cancel button only on the pending row, and worker options', async () => {
    getMock.mockResolvedValue(baseQueue())
    const el = await mountSuspended(ScheduleQueuePage)

    // 2 entries -> 2 data rows
    expect(el.findAll('.dt-row').length).toBe(2)

    // pending row: number input present, and exactly one (only the pending row gets it)
    const numberInputs = el.findAll('input[type="number"]')
    expect(numberInputs.length).toBe(1)
    expect((numberInputs[0]!.element as HTMLInputElement).value).toBe('10')

    // cancel button present exactly once (pending row only)
    const cancelButtons = el.findAll('button').filter(b => b.text() === '취소')
    expect(cancelButtons.length).toBe(1)

    // worker select has the 'all' option plus the one worker
    const options = el.find('select').findAll('option')
    expect(options.map(o => o.text())).toEqual(['전체 큐', '워커1'])
  })

  it('shows a simulation note in the description when simulated=true', async () => {
    getMock.mockResolvedValue(baseQueue({ simulated: true }))
    // useAsyncData caches by key across mounts within the same test file —
    // clear it so the second mount actually re-fetches instead of reusing
    // the first test's cached (non-simulated) payload.
    clearNuxtData(['schedule-queue', 'schedule-queue-datatypes'])
    const el = await mountSuspended(ScheduleQueuePage)
    expect(el.text()).toContain('시뮬레이션')
  })

  it('ADMIN(rank 20)에게는 우선순위 입력/취소 버튼이 보이지 않는다 (해당 엔드포인트는 RankSystem 전용)', async () => {
    const auth = useAuthStore()
    auth.user = { userId: 'a1', username: 'admin', roles: [], level: 20, companyId: 'c1' }
    getMock.mockResolvedValue(baseQueue())
    clearNuxtData(['schedule-queue', 'schedule-queue-datatypes'])
    const el = await mountSuspended(ScheduleQueuePage)

    expect(el.findAll('input[type="number"]').length).toBe(0)
    expect(el.findAll('button').filter(b => b.text() === '취소').length).toBe(0)
  })
})
