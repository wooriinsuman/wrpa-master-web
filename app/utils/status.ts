export type StatusKind = 'run' | 'idle' | 'fail' | 'done' | 'warn'

const LABEL_KIND: Record<string, StatusKind> = {
  실행중: 'run', 예약: 'run', 사용중: 'run',
  대기: 'idle', 비활성: 'idle', 정지: 'idle', 보관: 'idle',
  지연: 'warn',
  실패: 'fail', 오프라인: 'fail',
  완료: 'done', 온라인: 'done', 활성: 'done', 배포됨: 'done',
}

export function labelToKind(label: string): StatusKind {
  return LABEL_KIND[label] ?? 'idle'
}

export interface StatusCell { label: string; kind: StatusKind }
export function isStatusCell(v: unknown): v is StatusCell {
  return typeof v === 'object' && v !== null && 'label' in v && 'kind' in v
}
