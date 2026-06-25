// @vitest-environment nuxt
import { describe, it, expect, vi } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'
import DashboardPage from './index.vue'

const { workersRef, worksRef } = vi.hoisted(() => ({
  workersRef: { value: [] as any[] },
  worksRef: { value: [] as any[] },
}))
mockNuxtImport('useDashboard', () => () => ({
  workers: ref(workersRef.value),
  works: ref(worksRef.value),
  pending: ref(false),
  refresh: vi.fn(),
}))

describe('dashboard page', () => {
  it('renders a fleet cell for a worker', async () => {
    workersRef.value = [{ id: 'w1', name: 'ergate-01', type: 'crawler', state: 'idle', shared: false, hidHealthCount: 0, hidTotalCount: 0, createdAt: 0, updatedAt: 0, lastConnectedAt: 0 }]
    const el = await mountSuspended(DashboardPage)
    expect(el.text()).toContain('ergate-01')
  })
})
