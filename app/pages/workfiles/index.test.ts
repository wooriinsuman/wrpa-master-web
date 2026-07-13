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
mockNuxtImport('useToast', () => () => ({ toasts: ref([]), push: vi.fn() }))

describe('workfiles page', () => {
  afterEach(() => {
    // WDrawer's DialogPortal teleports to document.body; unmount between tests so body is clean
    document.body.innerHTML = ''
  })

  it('renders a row from the work-file list', async () => {
    listMock.mockResolvedValue([{ id: '1', insuranceCompanyCode: 'samsung_property', dataType: 'contract', fileType: 'list', insureType: 'all', contentType: 'a', name: '계약 전체 목록' }])
    const el = await mountSuspended(WorkFilesPage)
    expect(el.text()).toContain('계약 전체 목록')
    expect(el.text()).toContain('작업 파일 등록')
  })

  it('renders dataType (dynamic) + fileType/insureType (enum) selects in the drawer', async () => {
    listMock.mockResolvedValue([{ id: '1', insuranceCompanyCode: 'samsung_property', dataType: 'contract', fileType: 'list', insureType: 'all', contentType: 'a', name: '계약 전체 목록' }])
    const el = await mountSuspended(WorkFilesPage)
    await el.find('.add').trigger('click') // opens the drawer (fields render into a teleported DialogPortal)
    const selects = Array.from(document.querySelectorAll('select'))
    const opts = (i: number) => Array.from(selects[i]!.querySelectorAll('option')).map(o => o.textContent)
    expect(opts(0)).toEqual(['계약 (contract)']) // dataType — fetched from data-types
    expect(opts(1)).toEqual(['건별목록 (list)', '명세서 (statement)']) // fileType enum
    expect(opts(2)).toEqual(['전체 (all)', '장기 (longterm)', '일반 (general)', '자동차 (car)']) // insureType enum
  })
})
