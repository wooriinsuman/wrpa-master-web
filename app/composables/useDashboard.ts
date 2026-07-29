import type { components } from '#shared/types/api'
import { localToday } from '~/utils/format'

type WorkersList = components['schemas']['WorkersList']
type WorkerView = components['schemas']['WorkerView']
type WorkView = components['schemas']['WorkView']

// 이 화면은 '오늘'의 작업만 센다 — 명시적 제품 결정이다.
//
// GET /works는 날짜로 스코프된다(date를 안 보내면 서버가 설정 시간대의 오늘을
// 채운다). 예전에는 이 호출이 날짜와 무관한 전체 목록이었고, 서버가 기본값을
// 넣기 시작하면서 대시보드가 아무 표시 없이 오늘로 좁혀졌다. 같은 일이 다시
// 조용히 일어나지 않도록 서버 기본값에 얹히지 않고 날짜를 직접 보낸다.
//
// '오늘'을 고른 이유: 타일(실행중/실패)과 '진행 중인 작업' 표는 지금 현장에서
// 벌어지는 일을 보는 화면이다. 어제 실패를 되짚는 것은 날짜를 고를 수 있는 작업
// 현황 화면(/jobs)의 몫이고, 여기에는 날짜 컨트롤이 없다. 날짜 계산은 그 화면과
// 같은 localToday()를 써서 두 화면이 언제나 같은 하루를 가리키게 한다.
function dashboardWorksQuery() {
  return { date: localToday() }
}

export function useDashboard() {
  const api = useApi()
  const workers = ref<WorkerView[]>([])
  const works = ref<WorkView[]>([])
  const { pending, refresh } = useAsyncData('dashboard', async () => {
    const [w, k] = await Promise.all([
      api<WorkersList>('/workers', { query: { size: 500 } }),
      api<WorkView[]>('/works', { query: dashboardWorksQuery() }),
    ])
    workers.value = w.values ?? []
    works.value = k ?? []
    return true
  })
  return { workers, works, pending, refresh }
}
