// UA 원문 → "Chrome 126 · Windows" 같은 짧은 라벨.
//
// 정확한 UA 파싱이 목적이 아니라 세션 목록에서 기기를 구분하는 것이 목적이다.
// 흔한 브라우저·OS 만 알아보고 나머지는 원문을 그대로 돌려준다 — 파싱 실패로
// 정보를 잃는 쪽이 못생긴 문자열이 보이는 쪽보다 나쁘다.

// 순서가 곧 우선순위다. Edge/Opera/Whale 의 UA 에는 Chrome/ 토큰도 들어 있으므로
// 더 구체적인 쪽을 먼저 둔다.
const BROWSERS: { re: RegExp; name: string }[] = [
  { re: /Edg\/(\d+)/, name: 'Edge' },
  { re: /OPR\/(\d+)/, name: 'Opera' },
  { re: /Whale\/(\d+)/, name: 'Whale' },
  { re: /Firefox\/(\d+)/, name: 'Firefox' },
  { re: /Chrome\/(\d+)/, name: 'Chrome' },
  { re: /Version\/(\d+).*Safari/, name: 'Safari' },
]

// 여기도 순서가 우선순위다. iPhone UA 는 "like Mac OS X" 를, Android UA 는 "Linux" 를
// 포함하므로 더 구체적인 쪽이 앞에 온다.
const OSES: { re: RegExp; name: string }[] = [
  { re: /Windows NT/, name: 'Windows' },
  { re: /Android/, name: 'Android' },
  { re: /(iPhone|iPad|iPod)/, name: 'iOS' },
  { re: /Mac OS X/, name: 'macOS' },
  { re: /Linux/, name: 'Linux' },
]

export function formatUserAgent(ua?: string | null): string {
  const raw = (ua ?? '').trim()
  if (!raw) return '알 수 없는 기기'

  const browser = BROWSERS.find(b => b.re.test(raw))
  const os = OSES.find(o => o.re.test(raw))
  if (!browser && !os) return raw

  const parts: string[] = []
  if (browser) {
    const major = raw.match(browser.re)?.[1]
    parts.push(major ? `${browser.name} ${major}` : browser.name)
  }
  if (os) parts.push(os.name)
  return parts.join(' · ')
}
