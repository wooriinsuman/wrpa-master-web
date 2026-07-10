// @vitest-environment nuxt
import { describe, it, expect, vi } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'
import DataTypesPage from './index.vue'

const { listMock } = vi.hoisted(() => ({ listMock: vi.fn() }))
mockNuxtImport('useDataTypes', () => () => ({ list: listMock, create: vi.fn(), update: vi.fn(), remove: vi.fn() }))
mockNuxtImport('useToast', () => () => ({ toasts: ref([]), push: vi.fn() }))

describe('data-types page', () => {
  it('renders data type rows and column headers', async () => {
    listMock.mockResolvedValue([
      { code: 'new', name: '신계약', note: '신규 계약 건', deleted: false },
      { code: 'renewal', name: '계속분', note: '', deleted: false },
    ])
    const el = await mountSuspended(DataTypesPage)
    expect(el.text()).toContain('신계약')
    expect(el.text()).toContain('계속분')
    expect(el.text()).toContain('코드')
    expect(el.text()).toContain('표시명')
    expect(el.text()).toContain('메모')
  })
})
