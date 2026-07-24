import type { components } from '#shared/types/api'

type CreateWorkerRequest = components['schemas']['CreateWorkerRequest']

// 워커는 register-v2로 자기 자신을 등록하므로 이름/유형은 워커가 보고한 값을 쓴다.
// 관리자가 편집하는 것은 배정(회사·보험사)뿐 — legacy WorkerUpdating.owners에 대응.
export interface WorkerForm {
  companyIds: string[]
  insurerIds: string[]
}

export function blankWorkerForm(): WorkerForm {
  return { companyIds: [], insurerIds: [] }
}

// 워커 유형(코드값 → 한글 라벨). 현재는 '보험사 전산 RPA'(ContractCrawl) 하나만 사용.
// 레거시 유형(이메일 수신·보증보험·간편설계·설계매니저 등)은 v2에서 미사용이라 제거함.
// 추후 유형 구분이 필요해지면 여기 항목을 추가하면 셀렉트/라벨에 자동 반영된다.
const WORKER_TYPE_LABELS: Record<string, string> = {
  ContractCrawl: '보험사 전산 RPA',
}
export function workerTypeLabel(type: string): string {
  return WORKER_TYPE_LABELS[type] ?? (type || '—')
}

// --- 워커 생성 (관리자) ---
// 신원은 서버가 발급하는 API 키뿐이고, 표시 이름은 런처가 register 시 채운다.
// 생성 시 필요한 값은 유형뿐이다. (id는 서버 생성, tags/shared는 현재 UI에서 다루지 않음)
export interface WorkerCreateForm {
  type: string
  paused: boolean // true면 작업 배정 중단 상태로 생성 (재개 전까지 작업 안 받음)
}

export function blankWorkerCreateForm(): WorkerCreateForm {
  return { type: 'ContractCrawl', paused: false }
}

// 생성 <select> 옵션. WORKER_TYPE_LABELS에서 파생(항목 추가 시 자동 반영).
export const WORKER_TYPE_OPTIONS: { value: string, label: string }[] =
  Object.entries(WORKER_TYPE_LABELS).map(([value, label]) => ({ value, label }))

export function toCreateWorkerRequest(f: WorkerCreateForm): CreateWorkerRequest {
  if (!f.type) throw new Error('워커 유형을 선택하세요.')
  return { type: f.type, paused: f.paused }
}

// 목록 표시용 이름. 워커가 아직 런처에서 register 하기 전이면 name이 빈 문자열이므로
// 사용자가 "대기중"임을 알 수 있는 placeholder를 보여준다.
export function workerDisplayName(name: string): string {
  return name || '(런처 대기중)'
}

// legacy WorkerStateEnum(pretty) 매핑 + 스위퍼가 찍는 offline 포함.
const WORKER_STATE_LABELS: Record<string, string> = {
  idle: '대기중',
  busy: '작업중',
  unavailable: '응답없음',
  update: '업데이트중',
  offline: '오프라인',
  error: '오류',
  ready: '준비',
  online: '온라인',
  unknown: '알수없음',
}
export function workerStateLabel(state: string): string {
  return WORKER_STATE_LABELS[state?.toLowerCase()] ?? (state || '알수없음')
}
