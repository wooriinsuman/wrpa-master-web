import type { StatusCell, StatusKind } from './status'
import { workStateKind } from './dashboardState'

// 작업 현황의 상태 칸. 백엔드 state만으로는 성공/실패를 가릴 수 없다.
//
// work.sql의 FinishWork는 워커가 보낸 success/status와 무관하게 무조건
// state='done'으로 쓴다 — model.go의 정의대로 done은 "워커가 결과를 보고했다"는
// 뜻이고, failed는 "재시도 예산을 소진한 타임아웃" 전용이다. 그래서 driveTo 실패
// 같은 success=false·status=500 결과도 DB에는 done으로 남고, state만 보고 라벨을
// 붙이면 실패한 작업이 "성공"으로 보인다. 판정은 결과 본문(WorkView.result —
// 워커가 보낸 원본 JSON 그대로)이 쥐고 있으므로 여기서 함께 읽는다.
//
// ※ 상단 요약 스트립과 대시보드 "실패" 타일은 백엔드 집계(SummarizeWorks가
//    state='failed'만 센다)라 이 보정이 닿지 않는다 — 이 화면의 행 라벨과
//    요약 숫자가 어긋나는 건 알려진 한계이고, 맞추려면 백엔드를 고쳐야 한다.
export const WORK_STATE_LABEL: Record<string, string> = {
  pending: '대기', started: '실행중', done: '성공', failed: '실패', cancel: '취소',
}

// 상태 필터의 라벨은 행 라벨과 다르다. 필터는 백엔드 state를 그대로 보내므로
// done을 "성공"이라 부르면 실패로 표시된 행이 "성공" 필터에 딸려 나오고 "실패"
// 필터에서는 사라진다. 필터 쪽에서는 백엔드가 실제로 나누는 기준(결과 도착 /
// 타임아웃)을 그대로 이름에 드러낸다.
export const WORK_STATE_FILTER_LABEL: Record<string, string> = {
  ...WORK_STATE_LABEL, done: '완료', failed: '실패(타임아웃)',
}

const FAIL: StatusCell = { label: '실패', kind: 'fail' }

// 워커 결과가 실패인가. success가 실려 있으면 그게 최종 판단이고(워커가 status를
// 안 채우는 경우가 있다), 없을 때만 status로 물러난다. 둘 다 없으면 null —
// 판단 근거가 없는 걸 실패로 몰면 멀쩡히 끝난 작업이 사고로 보인다.
function resultFailed(result: unknown): boolean | null {
  if (typeof result !== 'object' || result === null) return null
  const r = result as { success?: unknown; status?: unknown }
  if (typeof r.success === 'boolean') return !r.success
  // status 0/누락은 "결과 없음"이라 판단 근거가 아니다.
  if (typeof r.status === 'number' && r.status !== 0) return r.status < 200 || r.status >= 300
  return null
}

// state가 done일 때만 결과를 본다. 재실행된 작업은 pending인 채로 직전 실행의
// result를 그대로 달고 있어(RestartWork는 result 컬럼을 비우지 않는다) 상태와
// 무관하게 result를 읽으면 대기 중인 작업이 실패로 보인다.
export function workStatusCell(state: string, result: unknown): StatusCell {
  if (state === 'done' && resultFailed(result) === true) return FAIL
  return { label: WORK_STATE_LABEL[state] ?? state, kind: workStateKind(state) as StatusKind }
}
