export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  ssr: false,
  modules: ['@pinia/nuxt'],
  css: ['~/assets/css/fonts.css', '~/assets/css/tokens.css'],
  devServer: { port: 3200 },
  runtimeConfig: {
    rpaApiUrl: process.env.NUXT_RPA_API_URL || 'http://localhost:9998',
    public: {},
  },
  app: { head: { htmlAttrs: { lang: 'ko' } } },
})
