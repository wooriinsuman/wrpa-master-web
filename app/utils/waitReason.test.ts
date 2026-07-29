import { describe, it, expect } from 'vitest'
import { waitReasonCell } from './waitReason'

describe('waitReasonCell', () => {
  it('사고 사유는 fail로 표시한다 — 영원히 실행되지 않는 상태이므로', () => {
    expect(waitReasonCell('no_worker', 'pending')).toEqual({ label: '자격 워커 없음', kind: 'fail' })
    expect(waitReasonCell('account_locked', 'pending')).toEqual({ label: '계정 잠김', kind: 'fail' })
  })

  it('정상 대기 사유는 idle로 표시한다', () => {
    expect(waitReasonCell('not_yet', 'pending')).toEqual({ label: '실행시각 대기', kind: 'idle' })
    expect(waitReasonCell('account_busy', 'pending')).toEqual({ label: '계정 사용중', kind: 'idle' })
    expect(waitReasonCell('ready', 'pending')).toEqual({ label: '대기 중', kind: 'idle' })
  })

  it('pending이 아니면 표시하지 않는다', () => {
    expect(waitReasonCell('ready', 'started')).toBeNull()
    expect(waitReasonCell(undefined, 'done')).toBeNull()
  })

  it('알 수 없는 값은 표시하지 않는다 — 잘못된 라벨보다 빈 칸이 낫다', () => {
    expect(waitReasonCell('something_new', 'pending')).toBeNull()
  })
})
