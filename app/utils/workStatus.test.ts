import { describe, it, expect } from 'vitest'
import { workStatusCell } from './workStatus'

describe('workStatusCell', () => {
  // 이 화면이 존재하는 이유 자체다. 백엔드 state='done'은 "성공"이 아니라 "워커가
  // 결과를 보고했다"는 뜻이고, FinishWork는 실패 결과도 done으로 저장한다.
  it('done이어도 워커가 실패를 보고했으면 실패로 표시한다', () => {
    expect(workStatusCell('done', {
      success: false,
      status: 500,
      reason: 'setup: InternalError: ReconAbort: driveTo /삼성화재/홈 실패',
      resultValue: '{}',
    })).toEqual({ label: '실패', kind: 'fail' })
  })

  it('done이고 워커가 성공을 보고했으면 성공으로 표시한다', () => {
    expect(workStatusCell('done', { success: true, status: 200, resultValue: '{}' }))
      .toEqual({ label: '성공', kind: 'done' })
  })

  // success 키를 안 실어 보내는 워커가 있어도 상태 코드만으로 실패를 잡아낸다 —
  // 이 폴백이 없으면 그 워커의 실패는 정확히 원래 버그(성공으로 표시)로 되돌아간다.
  it('success가 없으면 status로 판정한다', () => {
    expect(workStatusCell('done', { status: 500 })).toEqual({ label: '실패', kind: 'fail' })
    expect(workStatusCell('done', { status: 200 })).toEqual({ label: '성공', kind: 'done' })
    expect(workStatusCell('done', { status: 204 })).toEqual({ label: '성공', kind: 'done' })
  })

  // success가 명시돼 있으면 그게 최종 판단이다. 워커가 status를 안 채우고
  // success=false만 보내는 경우(status 0/누락)를 성공으로 뒤집으면 안 된다.
  it('success가 명시되면 status보다 우선한다', () => {
    expect(workStatusCell('done', { success: false })).toEqual({ label: '실패', kind: 'fail' })
    expect(workStatusCell('done', { success: false, status: 200 })).toEqual({ label: '실패', kind: 'fail' })
  })

  // 결과 본문을 못 읽는 경우까지 실패로 몰면 멀쩡히 끝난 작업이 사고로 보인다.
  // 판단 근거가 없으면 백엔드 state를 그대로 따른다.
  it('결과 본문이 없거나 판단 근거가 없으면 state를 그대로 따른다', () => {
    expect(workStatusCell('done', null)).toEqual({ label: '성공', kind: 'done' })
    expect(workStatusCell('done', undefined)).toEqual({ label: '성공', kind: 'done' })
    expect(workStatusCell('done', {})).toEqual({ label: '성공', kind: 'done' })
    expect(workStatusCell('done', { status: 0 })).toEqual({ label: '성공', kind: 'done' })
  })

  // done이 아닌 상태에는 결과 판정을 적용하지 않는다. 재실행으로 pending이 된
  // 작업은 직전 실행의 result를 그대로 달고 있어서(RestartWork는 result를 비우지
  // 않는다) 여기서 result를 보면 대기 중인 작업이 "실패"로 보인다.
  it('done이 아닌 상태는 결과와 무관하게 state 라벨을 쓴다', () => {
    const failed = { success: false, status: 500 }
    expect(workStatusCell('pending', failed)).toEqual({ label: '대기', kind: 'idle' })
    expect(workStatusCell('started', failed)).toEqual({ label: '실행중', kind: 'run' })
    expect(workStatusCell('cancel', failed)).toEqual({ label: '취소', kind: 'idle' })
  })

  it('타임아웃으로 끝난 failed는 그대로 실패다', () => {
    expect(workStatusCell('failed', null)).toEqual({ label: '실패', kind: 'fail' })
  })

  it('모르는 state는 지어내지 않고 원문을 그대로 보여준다', () => {
    expect(workStatusCell('weird', null)).toEqual({ label: 'weird', kind: 'idle' })
  })
})
