// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  ssr: false,
  spaLoadingTemplate: false,
  experimental: {
    typedPages: true,
    viewTransition: true,
  },
  modules: [
    'vuetify-nuxt-module',
    '@nuxtjs/robots',
    '@nuxtjs/google-fonts',
    '@formkit/auto-animate/nuxt',
    '@nuxt/eslint',
  ],
  runtimeConfig: {
    wsApi: process.env.NUXT_WS_API ?? 'http://localhost:4567',
    public: {
      ws: process.env.NUXT_PUBLIC_WS ?? 'ws://localhost:4567',
    },
  },
  googleFonts: {
    families: {
      'Noto Color Emoji': true,
      'Chakra Petch': true,
    },
  },
  robots: {
    rules: {
      UserAgent: '*',
      Disallow: '/',
    },
  },
  app: {
    head: {
      link: [
        {
          rel: 'icon',
          type: 'image/x-icon',
          href: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🐔</text></svg>',
        },
      ],
    },
  },
  typescript: {
    tsConfig: {
      compilerOptions: {
        noImplicitAny: true,
        noImplicitReturns: true,
        noFallthroughCasesInSwitch: true,
        noUncheckedIndexedAccess: true,
      },
    },
  },
});
