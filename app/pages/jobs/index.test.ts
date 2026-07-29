// @vitest-environment nuxt
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'
import WorkStatusPage from './index.vue'
import { useAuthStore } from '~/stores/auth'

const {
  listMock, summaryMock, setPriorityMock, cancelMock, workersListMock, insurersListMock,
} = vi.hoisted(() => ({
  listMock: vi.fn(),
  summaryMock: vi.fn(),
  setPriorityMock: vi.fn(),
  cancelMock: vi.fn(),
  workersListMock: vi.fn(),
  insurersListMock: vi.fn(),
}))

mockNuxtImport('useWorks', () => () => ({
  list: listMock,
  summary: summaryMock,
  enqueue: vi.fn(),
  setPriority: setPriorityMock,
  cancel: cancelMock,
}))
// 실제 useWorkers().list()는 WorkerView[] 배열을 반환한다({ values } 봉투가 아니다).
mockNuxtImport('useWorkers', () => () => ({ list: workersListMock }))
mockNuxtImport('useInsurers', () => () => ({ list: insurersListMock }))
mockNuxtImport('useDataTypes', () => () => ({
  list: vi.fn().mockResolvedValue([{ code: 'new', name: '신계약', note: '' }]),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}))
mockNuxtImport('useToast', () => () => ({ toasts: ref([]), push: vi.fn() }))

const KEYS = ['works', 'works-summary', 'works-workers', 'works-insurers', 'works-datatypes']

// 컬럼 순서: 상태·대기사유·보험사·계정·카테고리·업적월·실행시각·tasks·우선순위·워커·시도·생성
// useWorks.ts의 WORK_LIST_LIMIT — mockNuxtImport가 모듈을 대체하므로 직접
// import하지 않고 값을 고정한 뒤, 페이지가 정말 이 값을 보내는지 단언한다.
const LIMIT = 1000
const COL_COMPANY = 2
const COL_PRIORITY = 8
const COL_WAIT = 1
const COL_WORKER = 9

function rows() {
  return [
    {
      id: 'w1', company: 'samsung_property', state: 'pending', category: '0:new',
      tasks: ['contract_list_all_a'], priority: 10, workerId: '', workDate: '2026-07-28',
      workTime: '09:00', closingMonth: '2026-07', retriedCount: 0, createType: 'Scheduled',
      accountId: 'a1', accountName: '계정1', eligibleWorkerCount: 0, waitReason: 'no_worker',
    },
    {
      id: 'w2', company: 'hyundai_marine', state: 'done', category: '0:new',
      tasks: [], priority: 5, workerId: 'worker-1', workDate: '2026-07-28',
      workTime: '10:00', closingMonth: '2026-07', retriedCount: 1, createType: 'Scheduled',
      accountId: 'a2', accountName: '계정2', eligibleWorkerCount: 2,
    },
  ]
}

function cellsOf(el: any, rowIdx: number) {
  return el.findAll('.dt-row')[rowIdx]!.findAll('.dt-td')
}

beforeEach(() => {
  vi.clearAllMocks()
  listMock.mockResolvedValue(rows())
  summaryMock.mockResolvedValue({ pending: 1, started: 0, done: 1, failed: 0, cancel: 0, businessDay: 3 })
  workersListMock.mockResolvedValue([{ id: 'worker-1', name: '워커1' }])
  insurersListMock.mockResolvedValue([{ id: 'i1', code: 'samsung_property', name: '삼성화재', type: 'PROPERTY', url: '', active: true }])
  clearNuxtData(KEYS)
  const auth = useAuthStore()
  auth.user = { userId: 'sys', username: 'sys', roles: [], level: 30 }
})

afterEach(() => {
  // WDrawer의 DialogPortal은 document.body로 teleport한다 — 다음 테스트에 새지 않게 비운다.
  document.body.innerHTML = ''
})

describe('작업 현황', () => {
  it('자격 워커가 0인 대기 작업은 워커 칸을 사고(fail)로 표시한다', async () => {
    const el = await mountSuspended(WorkStatusPage)
    const worker = cellsOf(el, 0)[COL_WORKER]!
    // 후보 0은 "영원히 실행되지 않는다"는 뜻이라 '후보 0'이 아니라 사고 배지여야 한다.
    expect(worker.text()).toBe('자격 워커 없음')
    expect(worker.find('.badge--fail').exists()).toBe(true)
    expect(worker.text()).not.toContain('후보')
    // 대기 사유 칸도 같은 진단을 fail로 보여준다.
    expect(cellsOf(el, 0)[COL_WAIT]!.find('.badge--fail').exists()).toBe(true)
  })

  it('실행이 끝난 작업은 후보 수가 아니라 실제 배정 워커를 보여준다', async () => {
    const el = await mountSuspended(WorkStatusPage)
    const worker = cellsOf(el, 1)[COL_WORKER]!
    expect(worker.text()).toBe('worker-1')
    expect(worker.text()).not.toContain('후보')
    // 대기 사유는 pending 행에만 의미가 있다.
    expect(cellsOf(el, 1)[COL_WAIT]!.text()).toBe('—')
  })

  it('대기 중 작업은 자격 워커 후보 수를 보여준다', async () => {
    listMock.mockResolvedValue([{ ...rows()[0], eligibleWorkerCount: 3, waitReason: 'not_yet' }])
    clearNuxtData(KEYS)
    const el = await mountSuspended(WorkStatusPage)
    expect(cellsOf(el, 0)[COL_WORKER]!.text()).toBe('후보 3')
    expect(cellsOf(el, 0)[COL_WAIT]!.text()).toBe('실행시각 대기')
  })

  it('요약 카운트와 영업일을 표시한다', async () => {
    const el = await mountSuspended(WorkStatusPage)
    const sum = el.find('.sum').text()
    expect(sum).toContain('대기 1')
    expect(sum).toContain('실행 0')
    expect(sum).toContain('성공 1')
    expect(sum).toContain('실패 0')
    expect(sum).toContain('취소 0')
    expect(sum).toContain('영업일 3일차')
  })

  it('서버가 준 claim 순서를 고정한다 — 헤더를 눌러도 정렬되지 않는다', async () => {
    const el = await mountSuspended(WorkStatusPage)
    const before = el.findAll('.dt-row').map(r => r.findAll('.dt-td')[COL_COMPANY]!.text())
    await el.findAll('.dt-th')[COL_PRIORITY]!.trigger('click') // 우선순위 헤더
    const after = el.findAll('.dt-row').map(r => r.findAll('.dt-td')[COL_COMPANY]!.text())
    expect(after).toEqual(before)
    expect(before).toEqual(['samsung_property', 'hyundai_marine'])
  })

  it('SYSTEM에게는 대기 행에만 우선순위 입력과 취소 버튼을 낸다', async () => {
    const el = await mountSuspended(WorkStatusPage)
    const inputs = el.findAll('.dt-row input[type="number"]')
    expect(inputs.length).toBe(1)
    expect((inputs[0]!.element as HTMLInputElement).value).toBe('10')
    expect(el.findAll('.dt-row button').filter(b => b.text() === '취소').length).toBe(1)
  })

  it('USER(rank 10)에게는 우선순위·취소·워커 필터를 노출하지 않고 워커 목록을 조회하지도 않는다', async () => {
    const auth = useAuthStore()
    auth.user = { userId: 'u1', username: 'user', roles: [], level: 10, companyId: 'c1' }
    clearNuxtData(KEYS)
    const el = await mountSuspended(WorkStatusPage)

    expect(el.findAll('.dt-row input[type="number"]').length).toBe(0)
    expect(el.findAll('.dt-row button').filter(b => b.text() === '취소').length).toBe(0)
    // GET /api/workers는 SYSTEM 전용이다 — 호출하면 USER는 403을 받는다.
    expect(el.find('select.f-worker').exists()).toBe(false)
    expect(workersListMock).not.toHaveBeenCalled()
    // 보험사 필터는 USER도 쓸 수 있어야 한다.
    expect(insurersListMock).toHaveBeenCalled()
    expect(el.find('select.f-company').exists()).toBe(true)
  })

  it('행을 클릭하면 결과 드로어가 열린다', async () => {
    const el = await mountSuspended(WorkStatusPage)
    expect(document.body.textContent).not.toContain('작업 결과')
    await el.findAll('.dt-row')[0]!.trigger('click')
    expect(document.body.textContent).toContain('작업 결과')
  })

  // 결과 드로어를 여는 유일한 수단이 행 클릭이므로 키보드로도 도달해야 한다.
  it('행에 포커스해 Enter로도 결과 드로어를 연다', async () => {
    const el = await mountSuspended(WorkStatusPage)
    const row = el.findAll('.dt-row')[0]!
    expect(row.attributes('tabindex')).toBe('0')
    await row.trigger('keydown', { key: 'Enter' })
    expect(document.body.textContent).toContain('작업 결과')
  })

  it('12컬럼이 말줄임되지 않도록 표에 넓은 min-width를 준다', async () => {
    const el = await mountSuspended(WorkStatusPage)
    expect(el.find('.dt-wrap').attributes('style')).toContain('--dt-min-w: 1400px')
  })

  it('목록 상한을 명시해 조회하고, 상한 미만이면 잘림 배너를 내지 않는다', async () => {
    const el = await mountSuspended(WorkStatusPage)
    expect(listMock).toHaveBeenCalledWith(expect.objectContaining({ size: LIMIT }))
    expect(el.find('.trunc').exists()).toBe(false)
  })

  it('상한만큼 받으면 잘렸다고 알린다 (요약은 그날 전량을 세므로)', async () => {
    const one = rows()[0]!
    listMock.mockResolvedValue(Array.from({ length: LIMIT }, (_, i) => ({ ...one, id: `w${i}` })))
    clearNuxtData(KEYS)
    // 1000행을 실제로 그리면 테스트 워커가 힙을 넘긴다. 배너는 표 바깥 마크업이라
    // 표를 스텁해도 판정(응답 행 수 === 상한)에는 영향이 없다.
    const el = await mountSuspended(WorkStatusPage, { global: { stubs: { WDataTable: true } } })
    expect(el.find('.trunc').text()).toContain(`상위 ${LIMIT}건만 표시합니다`)
  })

  it('검색으로 0건이면 선생성 안내가 아니라 조건 안내를 낸다', async () => {
    const el = await mountSuspended(WorkStatusPage)
    await el.find('.ph-search').setValue('존재하지않는보험사')
    expect(el.find('.dt-row').exists()).toBe(false)
    expect(el.text()).toContain('조건에 맞는 작업이 없습니다')
    expect(el.text()).not.toContain('아직 생성되지 않았습니다')
  })

  it('필터 없이 0건이면 선생성 안내를 낸다', async () => {
    listMock.mockResolvedValue([])
    clearNuxtData(KEYS)
    const el = await mountSuspended(WorkStatusPage)
    expect(el.text()).toContain('이 날짜의 작업이 아직 생성되지 않았습니다')
    expect(el.text()).toContain('선생성은 매일 17:00에 다음날 분을 만듭니다.')
  })
})
