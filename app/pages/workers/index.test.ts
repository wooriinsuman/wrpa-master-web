// @vitest-environment nuxt
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import WorkersPage from './index.vue'

const { listMock, rotateMock, assignCompanyMock, createMock, pauseMock, resumeMock } = vi.hoisted(() => ({
  listMock: vi.fn(), rotateMock: vi.fn(), assignCompanyMock: vi.fn(), createMock: vi.fn(),
  pauseMock: vi.fn(), resumeMock: vi.fn(),
}))
mockNuxtImport('useWorkers', () => () => ({
  list: listMock,
  create: createMock,
  remove: vi.fn(),
  rotateKey: rotateMock,
  pause: pauseMock,
  resume: resumeMock,
  assignCompany: assignCompanyMock,
  removeCompany: vi.fn(),
  assignInsurer: vi.fn(),
  removeInsurer: vi.fn(),
}))
mockNuxtImport('useClients', () => () => ({ list: () => Promise.resolve([{ id: 'c1', name: '우리인슈맨라이프' }]) }))
mockNuxtImport('useInsurers', () => () => ({ list: () => Promise.resolve([{ id: 'i1', code: 'samsung_property', name: '삼성화재' }]) }))
mockNuxtImport('useToast', () => () => ({ toasts: ref([]), push: vi.fn() }))

const oneWorker = () => [
  { id: 'wk1', name: 'ergate-01', type: 'ContractCrawl', state: 'online', shared: false, paused: false, hidHealthCount: 2, hidTotalCount: 2, createdAt: 0, updatedAt: 0 },
]

describe('workers page', () => {
  beforeEach(() => {
    // 각 테스트가 mock 호출 이력을 깨끗이 시작하도록(예: not.toHaveBeenCalled 단언).
    vi.clearAllMocks()
  })

  afterEach(() => {
    // WDrawer's DialogPortal teleports to document.body; clear it between tests so
    // a leftover open drawer doesn't leak into the next mount.
    document.body.innerHTML = ''
    // useAsyncData('workers') payload is cached per key across mounts in this file;
    // clear it so each test's listMock value is actually re-fetched (otherwise the
    // first resolved value sticks for the whole file).
    clearNuxtData()
  })

  it('renders a worker row with worker-reported name/type label and a status badge', async () => {
    listMock.mockResolvedValue(oneWorker())
    const el = await mountSuspended(WorkersPage)
    expect(el.text()).toContain('ergate-01')
    expect(el.text()).toContain('보험사 전산 RPA') // ContractCrawl → 한글 라벨
    expect(el.text()).toContain('배정 안됨') // 회사 미배정 = 작업 안 받음
    // 관리자가 워커를 미리 생성 → 생성 버튼 노출
    expect(el.text()).toContain('워커 등록')
    // workerStateKind('online') === 'done' → .badge--done
    expect(el.find('.badge--done').exists()).toBe(true)
  })

  it('creates a worker and reveals the issued key', async () => {
    // Keep the same list as the other tests: useAsyncData('workers') payload is shared
    // across mounts in this file, so varying it here would leak into sibling tests.
    listMock.mockResolvedValue(oneWorker())
    createMock.mockResolvedValue({ id: 'wk9', apiKey: 'wk_CREATED999' })
    const el = await mountSuspended(WorkersPage)
    await el.findAll('button').find(b => b.text() === '+ 워커 등록')!.trigger('click')
    await flushPromises()
    // 생성 드로어는 body로 포탈됨 — 이름 입력 후 저장.
    const nameInput = Array.from(document.body.querySelectorAll('input'))
      .find(i => (i as HTMLInputElement).placeholder === 'win-worker-1') as HTMLInputElement
    expect(nameInput).toBeTruthy()
    nameInput.value = 'win-worker-1'
    nameInput.dispatchEvent(new Event('input'))
    await flushPromises()
    const save = Array.from(document.body.querySelectorAll('button')).find(b => b.textContent === '저장') as HTMLButtonElement
    save.click()
    await flushPromises()
    expect(createMock).toHaveBeenCalledWith({ name: 'win-worker-1', type: 'ContractCrawl', paused: false })
    expect(document.body.textContent).toContain('wk_CREATED999')
  })

  it('assigns a selected company at creation time', async () => {
    listMock.mockResolvedValue(oneWorker())
    createMock.mockResolvedValue({ id: 'wk9', apiKey: 'wk_CREATED999' })
    assignCompanyMock.mockResolvedValue(undefined)
    const el = await mountSuspended(WorkersPage)
    await el.findAll('button').find(b => b.text() === '+ 워커 등록')!.trigger('click')
    await flushPromises()
    const nameInput = Array.from(document.body.querySelectorAll('input'))
      .find(i => (i as HTMLInputElement).placeholder === 'win-worker-1') as HTMLInputElement
    nameInput.value = 'win-worker-1'
    nameInput.dispatchEvent(new Event('input'))
    await flushPromises()
    // 생성 드로어의 회사 칩을 선택.
    const chip = Array.from(document.body.querySelectorAll('button')).find(b => b.textContent?.trim() === '우리인슈맨라이프') as HTMLButtonElement
    expect(chip).toBeTruthy()
    chip.click()
    await flushPromises()
    const save = Array.from(document.body.querySelectorAll('button')).find(b => b.textContent === '저장') as HTMLButtonElement
    save.click()
    await flushPromises()
    expect(createMock).toHaveBeenCalled()
    expect(assignCompanyMock).toHaveBeenCalledWith('wk9', 'c1')
  })

  it('creates a paused worker when the checkbox is checked', async () => {
    listMock.mockResolvedValue(oneWorker())
    createMock.mockResolvedValue({ id: 'wk9', apiKey: 'wk_X' })
    const el = await mountSuspended(WorkersPage)
    await el.findAll('button').find(b => b.text() === '+ 워커 등록')!.trigger('click')
    await flushPromises()
    const nameInput = Array.from(document.body.querySelectorAll('input'))
      .find(i => (i as HTMLInputElement).placeholder === 'win-worker-1') as HTMLInputElement
    nameInput.value = 'win-worker-1'
    nameInput.dispatchEvent(new Event('input'))
    const check = document.body.querySelector('input[type=checkbox]') as HTMLInputElement
    check.checked = true
    check.dispatchEvent(new Event('change'))
    await flushPromises()
    const save = Array.from(document.body.querySelectorAll('button')).find(b => b.textContent === '저장') as HTMLButtonElement
    save.click()
    await flushPromises()
    expect(createMock).toHaveBeenCalledWith({ name: 'win-worker-1', type: 'ContractCrawl', paused: true })
  })

  it('does not call create when the name is empty', async () => {
    listMock.mockResolvedValue(oneWorker())
    const el = await mountSuspended(WorkersPage)
    await el.findAll('button').find(b => b.text() === '+ 워커 등록')!.trigger('click')
    await flushPromises()
    const save = Array.from(document.body.querySelectorAll('button')).find(b => b.textContent === '저장') as HTMLButtonElement
    save.click()
    await flushPromises()
    expect(createMock).not.toHaveBeenCalled()
  })

  it('rotates the key and reveals it when 키 재발급 is clicked', async () => {
    listMock.mockResolvedValue(oneWorker())
    rotateMock.mockResolvedValue({ apiKey: 'wk_NEWKEY123' })
    const el = await mountSuspended(WorkersPage)
    const btn = el.findAll('button').find(b => b.text() === '키 재발급')!
    expect(btn).toBeTruthy()
    await btn.trigger('click')
    await flushPromises()
    expect(rotateMock).toHaveBeenCalledWith('wk1')
    expect(document.body.textContent).toContain('wk_NEWKEY123')
  })

  it('assigns a company via the 배정 drawer chips', async () => {
    listMock.mockResolvedValue(oneWorker())
    assignCompanyMock.mockResolvedValue(undefined)
    const el = await mountSuspended(WorkersPage)
    await el.findAll('button').find(b => b.text() === '배정')!.trigger('click')
    await flushPromises()
    // Drawer is portalled to body; find the company chip + 저장 there.
    const chip = Array.from(document.body.querySelectorAll('button')).find(b => b.textContent === '우리인슈맨라이프') as HTMLButtonElement
    expect(chip).toBeTruthy()
    chip.click()
    const save = Array.from(document.body.querySelectorAll('button')).find(b => b.textContent === '저장') as HTMLButtonElement
    save.click()
    await flushPromises()
    expect(assignCompanyMock).toHaveBeenCalledWith('wk1', 'c1')
  })

  it('pauses an active worker from the row action', async () => {
    listMock.mockResolvedValue(oneWorker()) // paused:false
    pauseMock.mockResolvedValue(undefined)
    const el = await mountSuspended(WorkersPage)
    expect(el.text()).toContain('정상') // 배정 상태 뱃지(활성)
    await el.findAll('button').find(b => b.text() === '일시중지')!.trigger('click')
    await flushPromises()
    expect(pauseMock).toHaveBeenCalledWith('wk1')
  })

  it('shows 재개 and resumes a paused worker', async () => {
    listMock.mockResolvedValue([{ ...oneWorker()[0], paused: true }])
    resumeMock.mockResolvedValue(undefined)
    const el = await mountSuspended(WorkersPage)
    expect(el.text()).toContain('일시중지') // 배정 상태 뱃지(일시중지)
    await el.findAll('button').find(b => b.text() === '재개')!.trigger('click')
    await flushPromises()
    expect(resumeMock).toHaveBeenCalledWith('wk1')
  })
})
