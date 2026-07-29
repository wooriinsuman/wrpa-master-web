// @vitest-environment nuxt
//
// 이 파일이 지키는 것: 대시보드가 GET /works를 '날짜 없이' 부르지 않는다는 것.
// 서버는 date가 없으면 오늘로 채우므로 날짜를 생략해도 화면은 멀쩡해 보인다 —
// 그래서 예전에 이 호출이 날짜 무관 전체 목록에서 오늘로 조용히 좁혀졌을 때
// 아무 테스트도 울지 않았다. 인자를 직접 단언해 그 침묵을 막는다.
import { describe, it, expect, vi, beforeEach } from 'vitest'

const apiMock = vi.fn()
const fetchStub = Object.assign(vi.fn(), { create: vi.fn(() => apiMock) })
vi.stubGlobal('$fetch', fetchStub)

const { useDashboard } = await import('./useDashboard')
const { localToday } = await import('~/utils/format')

describe('useDashboard', () => {
  beforeEach(() => {
    apiMock.mockReset()
    apiMock.mockImplementation((url: string) => url === '/workers' ? { values: [] } : [])
    clearNuxtData('dashboard')
  })

  it('/works를 명시적인 오늘 날짜로 조회한다 (서버 기본값에 얹히지 않는다)', async () => {
    const { refresh } = useDashboard()
    await refresh()
    expect(apiMock).toHaveBeenCalledWith('/works', { query: { date: localToday() } })
  })

  it('작업 현황 화면과 같은 하루를 가리킨다', async () => {
    const { refresh } = useDashboard()
    await refresh()
    const call = apiMock.mock.calls.find(c => c[0] === '/works')
    expect(call?.[1]?.query?.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(call?.[1]?.query?.date).toBe(localToday())
  })
})
