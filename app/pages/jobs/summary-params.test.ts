// @vitest-environment nuxt
//
// 목록과 요약이 같은 필터 집합을 쓰는지만 다루는 파일. refetch.test.ts와 같은
// 이유로 페이지를 딱 한 번만 mount한다(useAsyncData 키는 한 Nuxt 인스턴스 안에서
// 전역이라, 여러 번 mount하면 낡은 인스턴스의 인자를 보고 조용히 통과할 수 있다).
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

beforeEach(() => {
  listMock.mockResolvedValue([])
  summaryMock.mockResolvedValue({ pending: 0, started: 0, done: 0, failed: 0, cancel: 0, businessDay: 1 })
  workersListMock.mockResolvedValue([])
  accountsListMock.mockResolvedValue([])
  insurersListMock.mockResolvedValue([])
  const auth = useAuthStore()
  auth.user = { userId: 'sys', username: 'sys', roles: [], level: 30 }
})

function lastArgs(m: typeof listMock): Record<string, unknown> {
  return m.mock.calls.at(-1)![0] as Record<string, unknown>
}

describe('작업 현황 · 목록과 요약의 모집단', () => {
  it('요약 파라미터는 목록 파라미터에서 파생된다 — 나중에 붙는 필터도 양쪽에 닿는다', async () => {
    const el = await mountSuspended(WorkStatusPage)

    // 지금 걸린 필터로 두 호출이 같은 모집단을 가리키는지: 기대값을 손으로 적지
    // 않고 실제 목록 호출에서 만든다(state·size는 요약이 해석하지 않는 두 키).
    const { state: _s, size: _z, ...expected } = lastArgs(listMock)
    expect(lastArgs(summaryMock)).toEqual(expected)

    listMock.mockClear()
    summaryMock.mockClear()

    // ── 여기가 이 테스트의 핵심. "나중에 필터가 하나 늘었다"를 그대로 재현한다:
    //    페이지의 서버 필터 묶음(filters)에 새 키를 하나 밀어 넣는다. 요약이
    //    목록에서 파생돼 있으면 이름을 몰라도 따라가고, 손으로 베낀 목록이면
    //    목록만 좁혀지고 요약은 예전 모집단을 계속 센다(= 같은 화면의 두 숫자가
    //    서로 다른 것을 세는 상태).
    ;(el.vm as any).filters.category = '0:new'
    await flushPromises()

    expect(lastArgs(listMock)).toMatchObject({ category: '0:new' })
    expect(summaryMock).toHaveBeenCalled()
    expect(lastArgs(summaryMock)).toMatchObject({ category: '0:new' })
    // 그러면서도 요약이 해석하지 못하는 키는 여전히 새지 않는다.
    expect(lastArgs(summaryMock)).not.toHaveProperty('state')
    expect(lastArgs(summaryMock)).not.toHaveProperty('size')
  })
})
