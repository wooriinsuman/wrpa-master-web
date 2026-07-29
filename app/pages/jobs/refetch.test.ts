// @vitest-environment nuxt
//
// 재조회(useAsyncData) 인자만 다루는 파일. 이 파일은 페이지를 딱 한 번 mount한다.
//
// 왜 분리했나: useAsyncData의 키('works', 'works-summary', 'works-workers')는
// 한 Nuxt 인스턴스 안에서 전역이다. 한 파일에서 페이지를 여러 번 mount하면 같은
// 키에 여러 인스턴스의 핸들러가 얽혀, 필터를 바꾼 뒤 "어떤 인자로 다시
// 조회했는가"를 단언할 때 두 번째 이후 인스턴스가 아니라 첫 인스턴스의 낡은
// 인자를 보고 조용히 통과할 수 있다. 인자 단언은 mount가 하나뿐인 여기에서만 한다.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import WorkStatusPage from './index.vue'
import { useAuthStore } from '~/stores/auth'

const { listMock, summaryMock, workersListMock, insurersListMock, accountsListMock } = vi.hoisted(() => ({
  listMock: vi.fn(),
  summaryMock: vi.fn(),
  workersListMock: vi.fn(),
  insurersListMock: vi.fn(),
  accountsListMock: vi.fn(),
}))

mockNuxtImport('useWorks', () => () => ({
  list: listMock, summary: summaryMock, enqueue: vi.fn(), setPriority: vi.fn(), cancel: vi.fn(),
}))
mockNuxtImport('useWorkers', () => () => ({ list: workersListMock }))
mockNuxtImport('useAccounts', () => () => ({ list: accountsListMock }))
mockNuxtImport('useInsurers', () => () => ({ list: insurersListMock }))
mockNuxtImport('useDataTypes', () => () => ({
  list: vi.fn().mockResolvedValue([]), create: vi.fn(), update: vi.fn(), remove: vi.fn(),
}))
mockNuxtImport('useToast', () => () => ({ toasts: ref([]), push: vi.fn() }))

// useWorks.ts의 WORK_LIST_LIMIT — mockNuxtImport가 모듈을 대체하므로 직접
// import하지 않고 값을 고정한 뒤, 페이지가 정말 이 값을 보내는지 단언한다.
const LIMIT = 1000

beforeEach(() => {
  listMock.mockResolvedValue([])
  summaryMock.mockResolvedValue({ pending: 0, started: 0, done: 0, failed: 0, cancel: 0, businessDay: 1 })
  workersListMock.mockResolvedValue([])
  accountsListMock.mockResolvedValue([])
  insurersListMock.mockResolvedValue([])
  const auth = useAuthStore()
  auth.user = { userId: 'sys', username: 'sys', roles: [], level: 30 }
})

describe('작업 현황 · 재조회 인자', () => {
  it('필터를 바꾸면 그 인자로 다시 읽고, 요약에는 state를 보내지 않는다', async () => {
    const el = await mountSuspended(WorkStatusPage)

    // 최초 조회: 목록은 상한을 명시하고, 요약은 state 키 자체가 없다.
    expect(listMock).toHaveBeenCalledWith(expect.objectContaining({ size: LIMIT }))
    expect(summaryMock).toHaveBeenCalledTimes(1)
    expect(summaryMock.mock.calls[0]![0]).not.toHaveProperty('state')

    listMock.mockClear()
    summaryMock.mockClear()

    await el.find('select.f-state').setValue('failed')
    await flushPromises()

    // 목록은 새 state로 다시 읽는다.
    expect(listMock).toHaveBeenCalledWith(expect.objectContaining({ state: 'failed', size: LIMIT }))
    // 요약은 상태 분포 자체라 state에 반응하지 않는다 — 다시 읽지도 않는다.
    expect(summaryMock).not.toHaveBeenCalled()

    // ── 이어서 같은 인스턴스로 검증한다. 여기서 페이지를 다시 mount하면 위
    //    주석의 함정에 그대로 빠진다(같은 키 → 첫 인스턴스의 낡은 핸들러).
    listMock.mockClear()
    await el.find('select.f-create').setValue('Manual')
    await flushPromises()

    // 상태 외의 필터는 목록과 요약을 함께 다시 읽게 한다.
    expect(listMock).toHaveBeenCalledWith(
      expect.objectContaining({ createType: 'Manual', state: 'failed', size: LIMIT }),
    )
    expect(summaryMock).toHaveBeenCalledWith(expect.objectContaining({ createType: 'Manual' }))
    expect(summaryMock.mock.calls.at(-1)![0]).not.toHaveProperty('state')
  })
})
