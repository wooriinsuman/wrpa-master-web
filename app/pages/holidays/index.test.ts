// @vitest-environment nuxt
import { describe, it, expect, vi } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'
import HolidaysPage from './index.vue'

const { listMock, syncMock } = vi.hoisted(() => ({ listMock: vi.fn(), syncMock: vi.fn() }))
mockNuxtImport('useHolidays', () => () => ({
  list: listMock,
  upsert: vi.fn(),
  remove: vi.fn(),
  sync: syncMock,
}))
mockNuxtImport('useToast', () => () => ({ toasts: ref([]), push: vi.fn() }))

describe('holidays page', () => {
  it('renders holiday rows and marks inactive holidays as worked', async () => {
    listMock.mockResolvedValue([
      { day: '2026-01-01', name: '신정', source: 'api', active: true },
      { day: '2026-01-02', name: '대체공휴일', source: 'manual', active: false },
    ])
    const el = await mountSuspended(HolidaysPage)
    expect(el.text()).toContain('신정')
    expect(el.text()).toContain('대체공휴일')
    expect(el.text()).toContain('작업함')
    expect(el.text()).toContain('동기화')
  })
})
