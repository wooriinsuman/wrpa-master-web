import { describe, it, expect } from 'vitest'
import { toSummaryParams, type WorkListParams } from './useWorks'

// 목록(GET /works)과 요약(GET /works/summary)은 같은 화면의 두 숫자다. 요약
// 파라미터를 목록 파라미터에서 파생시키지 않고 손으로 나열해 두면, 필터가 하나
// 늘 때 목록만 좁혀지고 요약은 예전 모집단을 계속 세어 "한 화면의 두 숫자가 서로
// 다른 것을 센다"로 조용히 돌아간다.
describe('toSummaryParams', () => {
  it('요약이 해석하지 못하는 두 키(state·size)만 뺀다', () => {
    expect(toSummaryParams({
      date: '2026-07-28', state: 'failed', createType: 'Manual',
      company: 'samsung_property', workerId: 'w-1', size: 1000,
    })).toEqual({
      date: '2026-07-28', createType: 'Manual',
      company: 'samsung_property', workerId: 'w-1',
    })
  })

  // 이 케이스가 이 파일의 존재 이유다. 나열식 구현은 자기가 아는 키만 통과시키므로
  // 나중에 추가된 필터를 조용히 떨어뜨린다 — 파생식은 이름을 몰라도 통과시킨다.
  it('나중에 추가되는 필터는 이름을 몰라도 그대로 따라간다', () => {
    const withNewFilter = {
      date: '2026-07-28', state: 'pending', category: '0:new', accountId: 'a-1',
    } as WorkListParams & { accountId: string }

    const summary = toSummaryParams(withNewFilter) as Record<string, unknown>
    expect(summary.category).toBe('0:new')
    expect(summary.accountId).toBe('a-1')
    expect(summary).not.toHaveProperty('state')
  })

  it('원본을 건드리지 않는다', () => {
    const p: WorkListParams = { date: '2026-07-28', state: 'done', size: 10 }
    toSummaryParams(p)
    expect(p).toEqual({ date: '2026-07-28', state: 'done', size: 10 })
  })
})
