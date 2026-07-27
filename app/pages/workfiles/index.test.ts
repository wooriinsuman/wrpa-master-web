// @vitest-environment nuxt
import { describe, it, expect, vi, afterEach } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'
import WorkFilesPage from './index.vue'

const { listMock } = vi.hoisted(() => ({ listMock: vi.fn() }))
mockNuxtImport('useWorkFiles', () => () => ({ list: listMock, create: vi.fn(), update: vi.fn(), remove: vi.fn() }))
mockNuxtImport('useDataTypes', () => () => ({
  list: vi.fn().mockResolvedValue([
    { code: 'contract', name: '계약', note: '' },
  ]),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}))
mockNuxtImport('useInsurers', () => () => ({
  list: vi.fn().mockResolvedValue([
    { id: 'i1', code: 'samsung_property', name: '삼성화재', type: 'PROPERTY', url: '', active: true },
  ]),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}))
mockNuxtImport('useToast', () => () => ({ toasts: ref([]), push: vi.fn() }))

describe('workfiles page', () => {
  afterEach(() => {
    // WDrawer's DialogPortal teleports to document.body; unmount between tests so body is clean
    document.body.innerHTML = ''
    // useAsyncData caches by key across mounts — without this a later test silently
    // re-uses the first test's list instead of its own listMock value.
    clearNuxtData()
  })

  it('renders a row from the work-file list', async () => {
    listMock.mockResolvedValue([{ id: '1', insuranceCompanyCode: 'samsung_property', dataType: 'contract', fileType: 'list', insureType: 'all', contentType: 'a', name: '계약 전체 목록' }])
    const el = await mountSuspended(WorkFilesPage)
    expect(el.text()).toContain('계약 전체 목록')
    expect(el.text()).toContain('작업 파일 등록')
  })

  it('renders insurer (dynamic) + dataType (dynamic) + fileType/insureType (enum) selects in the drawer', async () => {
    listMock.mockResolvedValue([{ id: '1', insuranceCompanyCode: 'samsung_property', dataType: 'contract', fileType: 'list', insureType: 'all', contentType: 'a', name: '계약 전체 목록' }])
    const el = await mountSuspended(WorkFilesPage)
    await el.find('.add').trigger('click') // opens the drawer (fields render into a teleported DialogPortal)
    const selects = Array.from(document.querySelectorAll('select'))
    const opts = (i: number) => Array.from(selects[i]!.querySelectorAll('option')).map(o => o.textContent)
    expect(opts(0)).toEqual(['— 보험사 선택 —', '삼성화재 (samsung_property)']) // insurer — fetched from insurance-companies
    expect(opts(1)).toEqual(['계약 (contract)']) // dataType — fetched from data-types
    expect(opts(2)).toEqual(['건별목록 (list)', '명세서 (statement)']) // fileType enum
    expect(opts(3)).toEqual(['전체 (all)', '장기 (longterm)', '일반 (general)', '자동차 (car)']) // insureType enum
  })

  // 헤더의 "조회" 버튼도 .act--ghost라 클래스로는 못 고른다 — 라벨로 찾는다.
  const clickByText = (el: any, text: string) =>
    el.findAll('button').find((b: any) => b.text() === text)!.trigger('click')

  it('복사 prefills the drawer from the row and keeps the insurer select editable', async () => {
    listMock.mockResolvedValue([{ id: '1', insuranceCompanyCode: 'samsung_property', dataType: 'contract', fileType: 'statement', insureType: 'car', contentType: 'b', name: '계약 전체 목록', originPath: '계약관리 > 계약조회' }])
    const el = await mountSuspended(WorkFilesPage)
    await clickByText(el, '복사')
    expect(document.body.textContent).toContain('작업 파일 복사 생성')

    const selects = Array.from(document.querySelectorAll('select'))
    expect(selects[0]!.value).toBe('samsung_property') // 보험사 프리필
    // 수정이 아니라 생성이므로 보험사를 다른 곳으로 바꿀 수 있어야 한다
    expect(selects[0]!.disabled).toBe(false)
    expect(selects[1]!.value).toBe('contract')
    expect(selects[2]!.value).toBe('statement')
    expect(selects[3]!.value).toBe('car')
    // 페이지의 검색창과 섞이지 않게 드로어 안으로 한정한다. 순서: 파일명, 컨텐츠, 전산경로.
    const panel = document.querySelector('.dw-panel')!
    const inputs = Array.from(panel.querySelectorAll('input')) as HTMLInputElement[]
    expect(inputs[0]!.value).toBe('계약 전체 목록') // 파일명 프리필
    expect(inputs[1]!.value).toBe('b') // 컨텐츠 프리필
    expect(inputs[2]!.value).toBe('계약관리 > 계약조회') // 전산경로 프리필(한 줄)
    expect((panel.querySelector('textarea') as HTMLTextAreaElement).value).toBe('') // 비고는 여전히 textarea
  })

  it('상세(수정) keeps the insurer select locked, unlike 복사', async () => {
    listMock.mockResolvedValue([{ id: '1', insuranceCompanyCode: 'samsung_property', dataType: 'contract', fileType: 'list', insureType: 'all', contentType: 'a', name: '계약 전체 목록' }])
    const el = await mountSuspended(WorkFilesPage)
    await clickByText(el, '상세')
    expect(document.body.textContent).toContain('작업 파일 수정')
    expect((document.querySelectorAll('select')[0] as HTMLSelectElement).disabled).toBe(true)
  })
})
