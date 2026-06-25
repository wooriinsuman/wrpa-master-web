// @vitest-environment nuxt
import { describe, it, expect, vi } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'
import WorkFilesPage from './index.vue'

const { listMock } = vi.hoisted(() => ({ listMock: vi.fn() }))
mockNuxtImport('useWorkFiles', () => () => ({ list: listMock, create: vi.fn(), update: vi.fn(), remove: vi.fn() }))
mockNuxtImport('useToast', () => () => ({ toasts: ref([]), push: vi.fn() }))

describe('workfiles page', () => {
  it('renders a row from the work-file list', async () => {
    listMock.mockResolvedValue([{ id: '1', insuranceCompanyCode: 'samsung_property', dataType: 'contract', fileType: 'list', insureType: 'all', contentType: 'a', name: '계약 전체 목록' }])
    const el = await mountSuspended(WorkFilesPage)
    expect(el.text()).toContain('계약 전체 목록')
    expect(el.text()).toContain('작업 파일 등록')
  })
})
