export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  ssr: false,
  modules: ['@pinia/nuxt'],
  css: ['~/assets/css/fonts.css', '~/assets/css/tokens.css', '~/assets/css/components.css'],
  devServer: { port: 3200 },
  runtimeConfig: {
    rpaApiUrl: process.env.NUXT_RPA_API_URL || 'http://localhost:9998',
    // Shared uploader token for the gated package/asset publish endpoints. The
    // server proxy injects it as X-Upload-Token. Reuses the backend's
    // WRPA_UPLOAD_TOKEN so the two stay in sync; empty disables the gate (dev).
    uploadToken: process.env.NUXT_UPLOAD_TOKEN || process.env.WRPA_UPLOAD_TOKEN || '',
    public: {},
  },
  app: { head: { htmlAttrs: { lang: 'ko' } } },
})
