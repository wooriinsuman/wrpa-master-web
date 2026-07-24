// @vitest-environment nuxt
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'
import OrderPoliciesPage from './index.vue'
import { useAuthStore } from '~/stores/auth'

const { listMock, createMock } = vi.hoisted(() => ({ listMock: vi.fn(), createMock: vi.fn() }))
mockNuxtImport('useOrderPolicies', () => () => ({
  list: listMock,
  create: createMock,
  update: vi.fn(),
  remove: vi.fn(),
}))
mockNuxtImport('useClients', () => () => ({
  list: vi.fn().mockResolvedValue([
    { id: 'c1', name: '테스트회사', code: 'test', active: true },
    { id: 'c2', name: '다른회사', code: 'other', active: true },
  ]),
  create: vi.fn(),
  remove: vi.fn(),
}))
mockNuxtImport('useInsurers', () => () => ({
  list: vi.fn().mockResolvedValue([{ id: 'i1', code: 'samsung_property', name: '삼성화재', type: 'PROPERTY', url: '', active: true }]),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}))
mockNuxtImport('useDataTypes', () => () => ({
  list: vi.fn().mockResolvedValue([
    { code: 'new', name: '신계약', note: '' },
    { code: 'renewal', name: '계속분', note: '' },
  ]),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}))
mockNuxtImport('useToast', () => () => ({ toasts: ref([]), push: vi.fn() }))

describe('order-policies page', () => {
  // 기존 동작(전체 회사 선택자)은 SYSTEM 기준으로 검증한다 — ADMIN 잠금은 별도 테스트에서 확인.
  beforeEach(() => {
    const auth = useAuthStore()
    auth.user = { userId: 'sys', username: 'sys', roles: [], level: 30 }
  })
  afterEach(() => {
    // WDrawer's DialogPortal teleports to document.body; unmount between tests so body is clean
    document.body.innerHTML = ''
  })

  it('renders policy rows with company name, "회사 기본" label and a per-band summary', async () => {
    listMock.mockResolvedValue([
      {
        id: 'p1',
        companyId: 'c1',
        insuranceCompanyCode: null,
        rows: [{ bizDayFrom: 1, bizDayTo: 2, order: ['-1:new', '0:new'] }],
        createdAt: 0,
        updatedAt: 0,
      },
    ])
    const el = await mountSuspended(OrderPoliciesPage)
    expect(el.text()).toContain('테스트회사')
    expect(el.text()).toContain('회사 기본')
    expect(el.find('.obands-sum').exists()).toBe(true)
    expect(el.text()).toContain('구간 1개')
    expect(el.text()).toContain('영업일 1–2')
    expect(el.text()).toContain('전월 신계약 › 당월 신계약')
    expect(listMock).toHaveBeenCalledWith('c1')
  })

  it('filters the list by insurer (client-side)', async () => {
    listMock.mockResolvedValue([
      {
        id: 'p1',
        companyId: 'c1',
        insuranceCompanyCode: null,
        rows: [{ bizDayFrom: 1, bizDayTo: 2, order: ['-1:new', '0:new'] }],
        createdAt: 0,
        updatedAt: 0,
      },
      {
        id: 'p2',
        companyId: 'c1',
        insuranceCompanyCode: 'samsung_property',
        rows: [{ bizDayFrom: 1, bizDayTo: null, order: ['0:new'] }],
        createdAt: 0,
        updatedAt: 0,
      },
    ])
    // useAsyncData caches by key across mounts within the same test file —
    // clear it so this mount re-fetches instead of reusing the first test's cache.
    clearNuxtData(['order-policies'])
    const el = await mountSuspended(OrderPoliciesPage)

    const selects = el.findAll('select')
    const insurerFilter = selects[1]!
    const options = insurerFilter.findAll('option')
    expect(options.map(o => o.attributes('value'))).toEqual(expect.arrayContaining(['', '__default__', 'samsung_property']))

    // 전체(default): both rows visible
    expect(el.findAll('.dt-row')).toHaveLength(2)
    expect(el.findAll('.dt-row').some(r => r.text().includes('회사 기본'))).toBe(true)
    expect(el.findAll('.dt-row').some(r => r.text().includes('삼성화재'))).toBe(true)

    // filter to the specific insurer: 회사 기본 row should disappear
    await insurerFilter.setValue('samsung_property')
    const filteredRows = el.findAll('.dt-row')
    expect(filteredRows).toHaveLength(1)
    expect(filteredRows[0]!.text()).toContain('삼성화재')
  })

  it('"선택 복사" is disabled until exactly one row is selected', async () => {
    listMock.mockResolvedValue([
      {
        id: 'p1',
        companyId: 'c1',
        insuranceCompanyCode: null,
        rows: [{ bizDayFrom: 1, bizDayTo: 2, order: ['-1:new', '0:new'] }],
        createdAt: 0,
        updatedAt: 0,
      },
    ])
    clearNuxtData(['order-policies'])
    const el = await mountSuspended(OrderPoliciesPage)

    const copyBtn = el.findAll('button').find(b => b.text() === '선택 복사')!
    expect(copyBtn.attributes('disabled')).toBeDefined()

    const rowCheckbox = el.find('.dt-td--sel input[type="checkbox"]')
    await rowCheckbox.setValue(true)

    const copyBtnAfter = el.findAll('button').find(b => b.text() === '선택 복사')!
    expect(copyBtnAfter.attributes('disabled')).toBeUndefined()
  })

  it('copies the selected policy to a target insurer via create()', async () => {
    createMock.mockResolvedValue({ id: 'p2' })
    listMock.mockImplementation((companyId: string) => {
      if (companyId === 'c1') {
        return Promise.resolve([
          {
            id: 'p1',
            companyId: 'c1',
            insuranceCompanyCode: null,
            rows: [{ bizDayFrom: 1, bizDayTo: 2, order: ['-1:new', '0:new'] }],
            createdAt: 0,
            updatedAt: 0,
          },
        ])
      }
      return Promise.resolve([])
    })
    clearNuxtData(['order-policies'])
    const el = await mountSuspended(OrderPoliciesPage)

    const rowCheckbox = el.find('.dt-td--sel input[type="checkbox"]')
    await rowCheckbox.setValue(true)

    const copyBtn = el.findAll('button').find(b => b.text() === '선택 복사')!
    await copyBtn.trigger('click')
    await new Promise(r => setTimeout(r, 0))

    // dialog content is teleported into document.body (DialogPortal), not under `el`.
    const dialogSelects = Array.from(document.querySelectorAll('select')) as HTMLSelectElement[]
    const targetInsurerSelect = dialogSelects[dialogSelects.length - 1]!
    targetInsurerSelect.value = 'samsung_property'
    targetInsurerSelect.dispatchEvent(new Event('change'))
    await new Promise(r => setTimeout(r, 0))

    const dialogButtons = Array.from(document.querySelectorAll('button')) as HTMLButtonElement[]
    const doCopyBtn = dialogButtons.find(b => b.textContent === '복사')!
    doCopyBtn.click()
    await new Promise(r => setTimeout(r, 0))

    expect(createMock).toHaveBeenCalledTimes(1)
    expect(createMock).toHaveBeenCalledWith({
      companyId: 'c1',
      insuranceCompanyCode: 'samsung_property',
      rows: [{ bizDayFrom: 1, bizDayTo: 2, order: ['-1:new', '0:new'] }],
    })
  })

  it('ADMIN(non-SYSTEM)에게는 회사 선택자가 없고 목록 스코프가 자기 회사로 고정된다', async () => {
    const auth = useAuthStore()
    auth.user = { userId: 'a1', username: 'admin', roles: [], level: 20, companyId: 'c1' }
    listMock.mockResolvedValue([])
    clearNuxtData(['order-policies'])
    const el = await mountSuspended(OrderPoliciesPage)

    // 회사 선택자(select)는 렌더되지 않고(보험사 필터 select만 남음), 회사명이 정적 텍스트로 표시된다.
    expect(el.findAll('select')).toHaveLength(1)
    expect(el.text()).toContain('테스트회사')
    // companies[0]가 아니라 auth.companyId('c1')로 목록을 조회한다.
    expect(listMock).toHaveBeenCalledWith('c1')
  })

  it('ADMIN(non-SYSTEM)의 등록 드로어/복사 대상 select도 회사 선택자가 없고 자기 회사로 고정된다', async () => {
    const auth = useAuthStore()
    auth.user = { userId: 'a1', username: 'admin', roles: [], level: 20, companyId: 'c1' }
    listMock.mockResolvedValue([
      {
        id: 'p1',
        companyId: 'c1',
        insuranceCompanyCode: null,
        rows: [{ bizDayFrom: 1, bizDayTo: 2, order: ['-1:new', '0:new'] }],
        createdAt: 0,
        updatedAt: 0,
      },
    ])
    clearNuxtData(['order-policies'])
    const el = await mountSuspended(OrderPoliciesPage)

    // 등록 드로어: 회사 select가 없고, 자기 회사명이 disabled input으로 표시된다.
    const addBtn = el.findAll('button').find(b => b.text() === '+ 정책 등록')!
    await addBtn.trigger('click')
    await new Promise(r => setTimeout(r, 0))
    let panel = document.querySelector('.dw-panel')!
    expect(panel.querySelectorAll('select')).toHaveLength(1) // 보험사 select만 남는다
    const companyInput = panel.querySelector('input[disabled]') as HTMLInputElement
    expect(companyInput.value).toBe('테스트회사')

    const cancelBtn = Array.from(panel.querySelectorAll('button')).find(b => b.textContent === '취소') as HTMLButtonElement
    cancelBtn.click()
    await new Promise(r => setTimeout(r, 0))

    // 복사 대상 select도 동일하게 잠긴다.
    const rowCheckbox = el.find('.dt-td--sel input[type="checkbox"]')
    await rowCheckbox.setValue(true)
    const copyBtn = el.findAll('button').find(b => b.text() === '선택 복사')!
    await copyBtn.trigger('click')
    await new Promise(r => setTimeout(r, 0))
    panel = document.querySelector('.dw-panel')!
    expect(panel.querySelectorAll('select')).toHaveLength(1) // 대상 보험사 select만 남는다
    const targetCompanyInput = panel.querySelector('input[disabled]') as HTMLInputElement
    expect(targetCompanyInput.value).toBe('테스트회사')
  })

  it('USER(rank 10)에게는 등록/선택 복사/상세/삭제 버튼이 보이지 않는다', async () => {
    const auth = useAuthStore()
    auth.user = { userId: 'u1', username: 'user', roles: [], level: 10, companyId: 'c1' }
    listMock.mockResolvedValue([
      {
        id: 'p1',
        companyId: 'c1',
        insuranceCompanyCode: null,
        rows: [{ bizDayFrom: 1, bizDayTo: 2, order: ['-1:new', '0:new'] }],
        createdAt: 0,
        updatedAt: 0,
      },
    ])
    clearNuxtData(['order-policies'])
    const el = await mountSuspended(OrderPoliciesPage)

    const buttonTexts = el.findAll('button').map(b => b.text())
    expect(buttonTexts).not.toContain('+ 정책 등록')
    expect(buttonTexts).not.toContain('선택 복사')
    expect(buttonTexts).not.toContain('상세')
    expect(buttonTexts).not.toContain('삭제')
  })
})
