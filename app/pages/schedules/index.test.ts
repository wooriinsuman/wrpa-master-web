// @vitest-environment nuxt
import { describe, it, expect, vi } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'
import SchedulesPage from './index.vue'

const { listMock, runMock } = vi.hoisted(() => ({ listMock: vi.fn(), runMock: vi.fn() }))
mockNuxtImport('useJobs', () => () => ({ list: listMock, create: vi.fn(), update: vi.fn(), remove: vi.fn(), run: runMock }))
mockNuxtImport('useToast', () => () => ({ toasts: ref([]), push: vi.fn() }))
// 참조 목록 — 등록 폼의 회사 → 계정 → 데이터타입 → 작업파일 연쇄를 재현할 최소 데이터.
mockNuxtImport('useClients', () => () => ({
  list: vi.fn().mockResolvedValue([{ id: 'c1', name: '우리인슈맨라이프', code: 'woori', active: true }]),
}))
mockNuxtImport('useAccounts', () => () => ({
  list: vi.fn().mockResolvedValue([
    { id: 'a1', companyId: 'c1', insuranceCompanyCode: 'samsung_property', name: '주계정', locked: false },
  ]),
}))
mockNuxtImport('useInsurers', () => () => ({
  list: vi.fn().mockResolvedValue([{ id: 'i1', code: 'samsung_property', name: '삼성화재', type: 'PROPERTY', url: '', active: true }]),
}))
mockNuxtImport('useWorkFiles', () => () => ({
  list: vi.fn().mockResolvedValue([
    { id: 'wf1', insuranceCompanyCode: 'samsung_property', dataType: 'new', name: '신계약 목록' },
    { id: 'wf2', insuranceCompanyCode: 'samsung_property', dataType: 'contract', name: '계속분 목록' },
  ]),
}))
mockNuxtImport('useDataTypes', () => () => ({
  list: vi.fn().mockResolvedValue([
    { code: 'new', name: '신계약' },
    { code: 'contract', name: '계속분' },
  ]),
}))

// 등록 drawer를 열고 안정될 때까지 기다린다(drawer는 document로 teleport된다).
// drawer는 document로 teleport되고 테스트 간 정리되지 않으므로, 항상 **마지막에 열린**
// panel로 쿼리를 좁힌다(이전 테스트가 남긴 drawer를 잡으면 상태가 섞인다).
async function openCreateDrawer(): Promise<HTMLElement> {
  listMock.mockResolvedValue([])
  const el = await mountSuspended(SchedulesPage)
  const addBtn = el.findAll('button').find(b => b.text() === '+ 일정 등록')!
  await addBtn.trigger('click')
  await el.vm.$nextTick()
  await new Promise(r => setTimeout(r))
  const panels = document.querySelectorAll('.dw-panel')
  return panels[panels.length - 1] as HTMLElement
}

function selects(root: HTMLElement) { return Array.from(root.querySelectorAll('select')) as HTMLSelectElement[] }
function buttons(root: HTMLElement, sel: string) { return Array.from(root.querySelectorAll(sel)) as HTMLButtonElement[] }
async function click(el: Element) {
  el.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  await new Promise(r => setTimeout(r))
}
async function pick(sel: HTMLSelectElement, value: string) {
  sel.value = value
  sel.dispatchEvent(new Event('change', { bubbles: true }))
  await new Promise(r => setTimeout(r))
}

// 회사 → 계정까지 고른 상태로 진행(데이터타입·작업파일 검증의 공통 전제).
async function pickAccount(root: HTMLElement) {
  const [company, account] = selects(root)
  await pick(company!, 'c1')
  await pick(account!, 'a1')
}

async function toggleExcludeHoliday(root: HTMLElement) {
  const label = Array.from(root.querySelector('.win')!.querySelectorAll('label'))
    .find(l => l.textContent?.includes('주말·공휴일 제외'))!
  const cb = label.querySelector('input') as HTMLInputElement
  cb.checked = !cb.checked
  cb.dispatchEvent(new Event('change', { bubbles: true }))
  await new Promise(r => setTimeout(r))
}

describe('schedules page', () => {
  it('renders a job row with its company id', async () => {
    listMock.mockResolvedValue([{ id: 'j1', insuranceCompanyCode: 'samsung_property', companyId: 'c9', accountId: 'a9', workFileIds: ['wf1'], startDay: 1, closingMonthOffset: 0, priority: 5, timeoutSec: 300, locked: false }])
    const el = await mountSuspended(SchedulesPage)
    expect(el.text()).toContain('c9')
    expect(el.text()).toContain('일정 등록')
  })

  it('explains auto-generation of the daily queue', async () => {
    listMock.mockResolvedValue([])
    const el = await mountSuspended(SchedulesPage)
    expect(el.text()).toContain('매일 17:00에 다음날 작업으로 자동 생성됩니다')
  })

  // 빈 weekdays = 요일 제한 없음(주말·공휴일 포함) — 문구가 이를 오해 없이 말해야 한다.
  it('요일 7개를 선택 가능하게 노출한다', async () => {
    const d = await openCreateDrawer()
    const wk = buttons(d, '.wk')
    expect(wk.map(b => b.textContent?.trim())).toEqual(['일', '월', '화', '수', '목', '금', '토'])
    expect(d.textContent).toContain('미선택 = 제한 없음')
    // 짧은 표시 뒤 전체 설명은 툴팁으로 — "비면 영업일만"이라는 오해를 막는다.
    expect(d.querySelector('[title*="요일 제한이 없습니다"]')).toBeTruthy()
    expect(d.querySelectorAll('.wk.on').length).toBe(0) // 기본은 미선택

    await click(wk[1]!)
    expect(d.querySelectorAll('.wk.on').length).toBe(1)
  })

  // 주말·공휴일 제외가 켜지면 토·일은 어차피 생성되지 않으므로 선택에서 제거·잠근다.
  it('주말·공휴일 제외를 켜면 토·일 선택이 해제되고 잠긴다', async () => {
    const d = await openCreateDrawer()
    const wk = buttons(d, '.wk')
    await click(wk[0]!) // 일
    await click(wk[6]!) // 토
    expect(d.querySelectorAll('.wk.on').length).toBe(2)

    await toggleExcludeHoliday(d)

    const after = buttons(d, '.wk')
    expect(d.querySelectorAll('.wk.on').length).toBe(0)
    expect(after[0]!.disabled).toBe(true)
    expect(after[6]!.disabled).toBe(true)
    expect(after[3]!.disabled).toBe(false)
  })

  // 시작/종료 경계는 (달력일|영업일)·월말 조합이라 요약 문장으로 확인 가능해야 한다.
  it('생성 기간을 요약 문장으로 보여준다', async () => {
    const d = await openCreateDrawer()
    // blank(): startDay=1, endDay='' , 영업일 기준 on
    expect(d.querySelector('.win-sum')!.textContent).toContain('매월 1영업일부터 마지막 영업일까지')
    // 달력일 토글로 전환하면 요약도 따라 바뀐다.
    await click(buttons(d, '.seg button').find(b => b.textContent === '달력일')!)
    expect(d.querySelector('.win-sum')!.textContent).toContain('매월 1일부터')
  })

  // 주말·공휴일 제외는 날짜를 거르는 옵션이므로 경계와 같은 박스에서 관리한다.
  it('주말·공휴일 제외를 생성 기간 박스 안에 두고 요약에 반영한다', async () => {
    const d = await openCreateDrawer()
    const box = d.querySelector('.win')!
    expect(
      Array.from(box.querySelectorAll('label')).some(l => l.textContent?.includes('주말·공휴일 제외')),
      '주말·공휴일 제외는 생성 기간 박스 안에 있어야 한다',
    ).toBe(true)

    expect(d.querySelector('.win-sum')!.textContent).not.toContain('주말·공휴일 제외')
    await toggleExcludeHoliday(d)
    expect(d.querySelector('.win-sum')!.textContent).toContain('주말·공휴일 제외')
  })

  it('계정 미선택 상태의 작업 파일 영역에 다음 단계를 안내한다', async () => {
    const d = await openCreateDrawer()
    expect(d.querySelector('.wf-empty')!.textContent).toContain('회사·계정을 먼저 선택하세요')
  })

  it('데이터 타입이 없으면 작업 파일 등록 경로를 안내한다', async () => {
    const d = await openCreateDrawer()
    await pickAccount(d)
    // 데이터 타입 미선택 상태 → 선택 안내, 계정까지 골랐으므로 문구가 바뀐다.
    expect(d.querySelector('.wf-empty')!.textContent).toContain('데이터 타입을 먼저 선택하세요')
  })

  it("데이터 타입 '전체'는 신계약·계속분 파일을 함께 보여준다", async () => {
    const d = await openCreateDrawer()
    await pickAccount(d)

    const dt = selects(d)[2]!
    const allOpt = Array.from(dt.options).find(o => o.text.includes('전체'))
    expect(allOpt, '데이터타입이 2종 이상이면 전체 옵션이 있어야 한다').toBeTruthy()
    expect(allOpt!.text).toContain('신계약')
    expect(allOpt!.text).toContain('계속분')

    await pick(dt, allOpt!.value)
    const chips = buttons(d, '.chip').map(c => c.textContent?.trim())
    expect(chips).toContain('신계약 목록')
    expect(chips).toContain('계속분 목록')
    // 유형별로 묶여 라벨이 붙는다.
    expect(Array.from(d.querySelectorAll('.wf-group-lab')).map(g => g.textContent?.trim()))
      .toEqual(['신계약', '계속분'])

    // 전체 선택 버튼은 보이는 파일을 모두 담는다.
    await click(buttons(d, '.wf-act').find(b => b.textContent === '전체 선택')!)
    expect(d.querySelectorAll('.chip--on').length).toBe(2)
  })

  it('단일 데이터 타입을 고르면 그 유형 파일만 남는다', async () => {
    const d = await openCreateDrawer()
    await pickAccount(d)
    await pick(selects(d)[2]!, 'new')
    expect(buttons(d, '.chip').map(c => c.textContent?.trim())).toEqual(['신계약 목록'])
  })
})
