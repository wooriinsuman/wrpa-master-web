import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    // Allow per-file environment overrides (e.g. // @vitest-environment happy-dom)
    environmentMatchGlobs: [
      ['app/composables/useTheme.test.ts', 'happy-dom'],
    ],
    // Default to node for proxy/store/nav tests that don't need a DOM
    environment: 'node',
  },
  resolve: {
    alias: {
      '#shared': new URL('./shared', import.meta.url).pathname,
    },
  },
})
