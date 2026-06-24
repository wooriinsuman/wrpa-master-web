import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    // Default to node; DOM-needing tests opt in per-file via
    // `// @vitest-environment happy-dom` (e.g. useTheme.test.ts).
    // (Vitest 4 removed `environmentMatchGlobs`; the docblock is the supported path.)
    environment: 'node',
  },
  resolve: {
    alias: {
      '#shared': new URL('./shared', import.meta.url).pathname,
    },
  },
})
