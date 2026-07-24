// 공용 표시 포맷 헬퍼.

// 바이트 → 사람이 읽는 크기(B/KB/MB/GB). 0/누락은 '—'.
export function fmtSize(bytes: number): string {
  if (!bytes) return '—'
  const u = ['B', 'KB', 'MB', 'GB']
  let n = bytes, i = 0
  while (n >= 1024 && i < u.length - 1) { n /= 1024; i++ }
  return `${n.toFixed(i ? 1 : 0)} ${u[i]}`
}

// 초 → "N분 M초" 사람이 읽는 표기. 0/음수/비수는 '—'.
export function fmtDuration(sec: number): string {
  if (!Number.isFinite(sec) || sec <= 0) return '—'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  if (m && s) return `${m}분 ${s}초`
  if (m) return `${m}분`
  return `${s}초`
}

// ISO 문자열 → ko-KR 로컬 표기. 빈값/파싱 실패는 '—'.
export function fmtDate(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('ko-KR')
}

// ms epoch → ko-KR 로컬 표기.
export function fmtDateTime(ms: number): string {
  if (!ms && ms !== 0) return '—'
  const d = new Date(ms)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('ko-KR')
}
