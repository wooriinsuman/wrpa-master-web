// @vitest-environment nuxt
//
// ⚠️ 이 파일의 케이스는 매번 페이지를 새로 mount하지만 useAsyncData 키('works',
// 'works-summary', 'works-workers' …)는 모든 mount가 공유한다. beforeEach의
// clearNuxtData로 데이터는 비우지만, 같은 키로 두 번째 mount가 등록하는 핸들러는
// 첫 mount의 것이 남아 있을 수 있다 — 그래서 "필터를 바꾸면 어떤 인자로 다시
// 조회하는가"를 단언하면 첫 인스턴스의 낡은 인자를 보고 조용히 통과할 수 있다.
// 재조회 인자 검증은 mount를 한 번만 하는 ./refetch.test.ts에 둔다.
// 여기에는 "한 번 그려진 화면이 무엇을 보여주는가"만 넣는다.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { ref, nextTick } from 'vue'
import WorkStatusPage from './index.vue'
import { useAuthStore } from '~/stores/auth'

const {
  listMock, summaryMock, setPriorityMock, cancelMock, workersListMock, insurersListMock,
  accountsListMock,
} = vi.hoisted(() => ({
  listMock: vi.fn(),
  summaryMock: vi.fn(),
  setPriorityMock: vi.fn(),
  cancelMock: vi.fn(),
  workersListMock: vi.fn(),
  insurersListMock: vi.fn(),
  accountsListMock: vi.fn(),
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
mockNuxtImport('useAccounts', () => () => ({ list: accountsListMock }))
mockNuxtImport('useInsurers', () => () => ({ list: insurersListMock }))
mockNuxtImport('useDataTypes', () => () => ({
  list: vi.fn().mockResolvedValue([{ code: 'new', name: '신계약', note: '' }]),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}))
mockNuxtImport('useToast', () => () => ({ toasts: ref([]), push: vi.fn() }))

const KEYS = ['works', 'works-summary', 'works-workers', 'works-accounts', 'works-insurers', 'works-datatypes']

// 컬럼 순서: 상태·대기사유·보험사·계정·카테고리·업적월·실행시각·tasks·우선순위·워커·시도·생성
const COL_COMPANY = 2
const COL_ACCOUNT = 3
const COL_PRIORITY = 8
const COL_WAIT = 1
const COL_WORKER = 9
const LIMIT = 1000

// 운영 화면에서 실제로 새던 값들: 계정·워커가 36자 uuid로 그려졌다.
const ACC2 = '2bbfe3d3-e637-4ae0-a352-e84baa681aee'
const WORKER2 = 'e60aa178-d08a-4653-a217-853a8b11d81a'

function rows() {
  return [
    {
      id: 'w1', company: 'samsung_property', state: 'pending', category: '0:new',
      tasks: ['contract_list_all_a'], priority: 10, workerId: '', workDate: '2026-07-28',
      workTime: '09:00', closingMonth: '2026-07', retriedCount: 0, createType: 'Scheduled',
      accountId: 'a1', accountName: '계정1', eligibleWorkerCount: 0, waitReason: 'no_worker',
    },
    {
      // 끝난 행은 백엔드가 accountName을 채워 주지 않는다(buildDiagInput은 pending만
      // 조회한다) — 화면이 계정 목록에서 직접 이름을 찾아야 한다.
      id: 'w2', company: 'hyundai_marine', state: 'done', category: '0:new',
      tasks: [], priority: 5, workerId: WORKER2, workDate: '2026-07-28',
      workTime: '10:00', closingMonth: '2026-07', retriedCount: 1, createType: 'Scheduled',
      accountId: ACC2, accountName: '', eligibleWorkerCount: 2,
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
  workersListMock.mockResolvedValue([{ id: WORKER2, name: 'test-worker-001' }])
  accountsListMock.mockResolvedValue([
    { id: 'a1', name: '계정1' }, { id: ACC2, name: '현대-김철수' },
  ])
  insurersListMock.mockResolvedValue([{ id: 'i1', code: 'samsung_property', name: '삼성화재', type: 'PROPERTY', url: '', active: true }])
  clearNuxtData(KEYS)
  const auth = useAuthStore()
  auth.user = { userId: 'sys', username: 'sys', roles: [], level: 30 }
})

afterEach(() => {
  // WDrawer/WConfirm의 DialogPortal은 document.body로 teleport한다 — 다음 테스트에 새지 않게 비운다.
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

  it('실행이 끝난 작업은 후보 수가 아니라 배정 워커 이름을 보여준다', async () => {
    const el = await mountSuspended(WorkStatusPage)
    const worker = cellsOf(el, 1)[COL_WORKER]!
    // 운영자에게 uuid를 그대로 보이면 안 된다 — 필터 드롭다운이 이미 아는 이름이다.
    expect(worker.text()).toBe('test-worker-001')
    expect(worker.text()).not.toContain(WORKER2)
    expect(worker.text()).not.toContain('후보')
    // 전체 id는 툴팁으로 남긴다.
    expect(worker.find('span').attributes('title')).toBe(WORKER2)
    // 대기 사유는 pending 행에만 의미가 있다.
    expect(cellsOf(el, 1)[COL_WAIT]!.text()).toBe('—')
  })

  it('워커 목록에 없는 id는 이름을 지어내지 않고 줄여서 보여준다', async () => {
    workersListMock.mockResolvedValue([])
    clearNuxtData(KEYS)
    const el = await mountSuspended(WorkStatusPage)
    const worker = cellsOf(el, 1)[COL_WORKER]!
    expect(worker.text()).toBe('e60aa178…')
    expect(worker.text()).not.toContain(WORKER2)
  })

  it('끝난 작업의 계정 칸도 uuid가 아니라 계정 이름을 보여준다', async () => {
    const el = await mountSuspended(WorkStatusPage)
    // 백엔드는 pending 행에만 accountName을 채운다 — 끝난 행은 계정 목록에서 찾는다.
    const account = cellsOf(el, 1)[COL_ACCOUNT]!
    expect(account.text()).toBe('현대-김철수')
    expect(account.text()).not.toContain(ACC2)
    expect(account.find('span').attributes('title')).toBe(ACC2)
    // 대기 행은 목록에서 찾은 이름이 그대로 쓰인다.
    expect(cellsOf(el, 0)[COL_ACCOUNT]!.text()).toBe('계정1')
  })

  it('계정 목록에서 못 찾으면 백엔드 accountName → 줄인 id 순으로 물러난다', async () => {
    accountsListMock.mockResolvedValue([])
    clearNuxtData(KEYS)
    const el = await mountSuspended(WorkStatusPage)
    // 대기 행은 백엔드가 준 이름이 있다.
    expect(cellsOf(el, 0)[COL_ACCOUNT]!.text()).toBe('계정1')
    // 끝난 행은 둘 다 없으므로 줄인 id — 그래도 36자 uuid는 아니다.
    expect(cellsOf(el, 1)[COL_ACCOUNT]!.text()).toBe('2bbfe3d3…')
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

  // 요약 스트립은 실패와 취소를 따로 센다. 상태 배지도 같은 기준이어야 한다 —
  // 취소를 fail(빨강)로 칠하면 "실패 0"이라 써 놓고 실패로 보이는 행이 남는다.
  it('취소된 작업은 실패로 칠하지 않는다 (요약의 실패/취소 분리와 같은 기준)', async () => {
    listMock.mockResolvedValue([{ ...rows()[1], id: 'w3', state: 'cancel' }])
    summaryMock.mockResolvedValue({ pending: 0, started: 0, done: 0, failed: 0, cancel: 1, businessDay: 3 })
    clearNuxtData(KEYS)
    const el = await mountSuspended(WorkStatusPage)
    const status = cellsOf(el, 0)[0]!
    expect(status.text()).toBe('취소')
    expect(status.find('.badge--fail').exists()).toBe(false)
    expect(el.find('.sum').text()).toContain('실패 0')
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

  // 게이트는 isSystem(level >= 30)이라 ADMIN(20)은 논리적으로 빠지지만, 경계값이
  // 고정돼 있지 않으면 게이트를 isAdmin으로 바꿔도 아무 테스트가 울지 않는다.
  it('ADMIN(rank 20)에게는 우선순위·취소·워커 필터를 노출하지 않는다', async () => {
    const auth = useAuthStore()
    auth.user = { userId: 'ad1', username: 'admin', roles: [], level: 20, companyId: 'c1' }
    clearNuxtData(KEYS)
    const el = await mountSuspended(WorkStatusPage)

    expect(el.findAll('.dt-row input[type="number"]').length).toBe(0)
    expect(el.findAll('.dt-row button').filter(b => b.text() === '취소').length).toBe(0)
    expect(el.find('select.f-worker').exists()).toBe(false)
    expect(workersListMock).not.toHaveBeenCalled()
    // 워커 목록이 없어도 워커 칸이 비거나 터지지 않는다 — 줄인 id로 물러난다.
    expect(cellsOf(el, 1)[COL_WORKER]!.text()).toBe('e60aa178…')
    // 계정 이름은 ADMIN도 볼 수 있어야 한다(GET /accounts는 회사 스코프 읽기).
    expect(cellsOf(el, 1)[COL_ACCOUNT]!.text()).toBe('현대-김철수')
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
    expect(cellsOf(el, 1)[COL_WORKER]!.text()).toBe('e60aa178…')
    // 보험사 필터는 USER도 쓸 수 있어야 한다.
    expect(insurersListMock).toHaveBeenCalled()
    expect(el.find('select.f-company').exists()).toBe(true)
    // 계정 목록도 USER 권한 안에 있다 — 계정 칸을 이름으로 그리는 수단이다.
    expect(accountsListMock).toHaveBeenCalled()
    expect(cellsOf(el, 1)[COL_ACCOUNT]!.text()).toBe('현대-김철수')
  })

  it('우선순위 저장이 거부되면 초안을 버리고 서버 값으로 되돌린다', async () => {
    setPriorityMock.mockRejectedValue({ data: { message: '대기 중 작업만 조정할 수 있습니다.' } })
    const el = await mountSuspended(WorkStatusPage)
    const input = el.find('.dt-row input[type="number"]')
    await input.setValue('99')
    await input.trigger('change')
    await flushPromises()
    await nextTick()

    expect(setPriorityMock).toHaveBeenCalledWith('w1', 99)
    // 초안이 남으면 서버가 받아준 적 없는 99가 계속 보이고, 새로고침해도 초안이
    // 서버 값을 덮어써 실제 우선순위를 영영 볼 수 없다.
    const after = el.find('.dt-row input[type="number"]').element as HTMLInputElement
    expect(after.value).toBe('10')
  })

  // 서버 값과 같은 숫자로 blur하면 보낼 게 없어 조기 반환한다. 그때 초안을
  // 남겨 두면 priorityDraft가 서버 값보다 초안을 우선하므로, 이후 다른 운영자가
  // 우선순위를 바꿔도 이 화면은 새로고침해도 옛 숫자를 계속 보여준다.
  it('서버 값과 같은 값으로 되돌려 저장하면 초안을 남기지 않는다', async () => {
    const el = await mountSuspended(WorkStatusPage)
    // setValue()는 input과 change를 함께 쏘므로 "타이핑"을 흉내 낼 수 없다
    // (한 글자 고칠 때마다 저장돼 버린다) — 값만 넣고 input만 발생시킨다.
    const input = () => el.find('.dt-row input[type="number"]')
    async function type(v: string) {
      const w = input()
      ;(w.element as HTMLInputElement).value = v
      await w.trigger('input')
    }

    // 20으로 고쳤다가 원래 값 10으로 되돌리고 blur — 서버 호출은 없다.
    await type('20')
    await type('10')
    await input().trigger('change')
    await flushPromises()
    expect(setPriorityMock).not.toHaveBeenCalled()

    // 그 사이 다른 운영자가 5로 바꿨다 → 목록을 다시 읽으면 5가 보여야 한다.
    listMock.mockResolvedValue([{ ...rows()[0], priority: 5 }, rows()[1]])
    await el.find('[aria-label="다시 조회"]').trigger('click')
    await flushPromises()
    await nextTick()

    const after = el.find('.dt-row input[type="number"]').element as HTMLInputElement
    expect(after.value).toBe('5')
  })

  it('취소는 확인 다이얼로그를 거친다 — 닫으면 취소되지 않는다', async () => {
    const el = await mountSuspended(WorkStatusPage)
    const btn = el.findAll('.dt-row button').find(b => b.text() === '취소')!
    await btn.trigger('click')
    // 네이티브 confirm()이 아니라 DS 다이얼로그를 띄운다.
    expect(document.body.textContent).toContain('이 작업을 취소할까요?')
    expect(cancelMock).not.toHaveBeenCalled()

    const foot = [...document.body.querySelectorAll('.cf-foot button')] as HTMLButtonElement[]
    foot.find(b => b.textContent?.trim() === '닫기')!.click()
    await flushPromises()
    expect(cancelMock).not.toHaveBeenCalled()
  })

  it('확인 다이얼로그에서 확정해야 실제로 취소된다', async () => {
    cancelMock.mockResolvedValue({ result: 'cancelled' })
    const el = await mountSuspended(WorkStatusPage)
    await el.findAll('.dt-row button').find(b => b.text() === '취소')!.trigger('click')
    const foot = [...document.body.querySelectorAll('.cf-foot button')] as HTMLButtonElement[]
    foot.find(b => b.textContent?.trim() === '작업 취소')!.click()
    await flushPromises()
    expect(cancelMock).toHaveBeenCalledWith('w1')
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

  it('상한 미만이면 잘림 배너를 내지 않는다', async () => {
    const el = await mountSuspended(WorkStatusPage)
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

  // 계정·워커 칸이 uuid에서 이름으로 바뀌면서 "로그에서 복사한 uuid를 붙여 넣어
  // 행을 찾는" 운영 습관이 깨졌다. 이름으로도 id로도 찾혀야 한다.
  it('검색은 계정·워커 이름과 원본 uuid를 모두 대상으로 한다', async () => {
    const el = await mountSuspended(WorkStatusPage)
    const search = el.find('.ph-search')

    // 표시값은 이름이지만 로그에서 복사한 36자 계정 uuid로도 그 행을 찾는다.
    await search.setValue(ACC2)
    expect(el.findAll('.dt-row').length).toBe(1)
    expect(cellsOf(el, 0)[COL_ACCOUNT]!.text()).toBe('현대-김철수')

    // 워커 uuid도 마찬가지 — 화면에는 test-worker-001만 보인다.
    await search.setValue(WORKER2)
    expect(el.findAll('.dt-row').length).toBe(1)
    expect(cellsOf(el, 0)[COL_WORKER]!.text()).toBe('test-worker-001')

    // 사람 이름 검색은 그대로 살아 있어야 한다(id 검색을 얻자고 잃으면 안 된다).
    await search.setValue('현대-김철수')
    expect(el.findAll('.dt-row').length).toBe(1)
    await search.setValue('test-worker-001')
    expect(el.findAll('.dt-row').length).toBe(1)
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
