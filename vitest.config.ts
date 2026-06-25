import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    // Default to node; component tests that need mountSuspended opt in per-file via
    // `// @vitest-environment nuxt` (e.g. WDrawer.test.ts).
    // (Vitest 4 removed `environmentMatchGlobs`; the docblock is the supported path.)
    environment: 'node',
  },
  resolve: {
    alias: {
      '#shared': new URL('./shared', import.meta.url).pathname,
    },
  },
})
