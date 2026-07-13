// @vitest-environment nuxt
import { describe, it, expect, vi } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import WorkersPage from './index.vue'

const { listMock, rotateMock, assignCompanyMock } = vi.hoisted(() => ({
  listMock: vi.fn(), rotateMock: vi.fn(), assignCompanyMock: vi.fn(),
}))
mockNuxtImport('useWorkers', () => () => ({
  list: listMock,
  remove: vi.fn(),
  rotateKey: rotateMock,
  assignCompany: assignCompanyMock,
  removeCompany: vi.fn(),
  assignInsurer: vi.fn(),
  removeInsurer: vi.fn(),
}))
mockNuxtImport('useClients', () => () => ({ list: () => Promise.resolve([{ id: 'c1', name: '우리인슈맨라이프' }]) }))
mockNuxtImport('useInsurers', () => () => ({ list: () => Promise.resolve([{ id: 'i1', code: 'samsung_property', name: '삼성화재' }]) }))
mockNuxtImport('useToast', () => () => ({ toasts: ref([]), push: vi.fn() }))

const oneWorker = () => [
  { id: 'wk1', name: 'ergate-01', type: 'ContractCrawl', state: 'online', shared: false, hidHealthCount: 2, hidTotalCount: 2, createdAt: 0, updatedAt: 0 },
]

describe('workers page', () => {
  it('renders a worker row with worker-reported name/type label and a status badge', async () => {
    listMock.mockResolvedValue(oneWorker())
    const el = await mountSuspended(WorkersPage)
    expect(el.text()).toContain('ergate-01')
    expect(el.text()).toContain('보험사 전산 RPA') // ContractCrawl → 한글 라벨
    expect(el.text()).toContain('배정 안됨') // 회사 미배정 = 작업 안 받음
    // no manual-create button (workers self-register)
    expect(el.text()).not.toContain('워커 등록')
    // workerStateKind('online') === 'done' → .badge--done
    expect(el.find('.badge--done').exists()).toBe(true)
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
})
