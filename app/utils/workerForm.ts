// 워커는 register-v2로 자기 자신을 등록하므로 이름/유형은 워커가 보고한 값을 쓴다.
// 관리자가 편집하는 것은 배정(회사·보험사)뿐 — legacy WorkerUpdating.owners에 대응.
export interface WorkerForm {
  companyIds: string[]
  insurerIds: string[]
}

export function blankWorkerForm(): WorkerForm {
  return { companyIds: [], insurerIds: [] }
}

// legacy WorkerType(pretty) 매핑. 워커가 보고한 코드값을 한글 라벨로 표시.
const WORKER_TYPE_LABELS: Record<string, string> = {
  Unknown: '알수없음',
  ContractCrawl: '보험사 전산 RPA',
  ContractCrawlByEmail: '계약자료 이메일 수신',
  GuaranteeInsuranceCrawl: '보증보험 RPA',
  SimpleDesign: '간편설계',
  Planning: '설계매니저',
}
export function workerTypeLabel(type: string): string {
  return WORKER_TYPE_LABELS[type] ?? (type || '—')
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
