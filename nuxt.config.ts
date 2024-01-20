// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  ssr: false,
  experimental: {
    typedPages: true,
  },
  runtimeConfig: {
    wsApi: process.env.NUXT_WS_API ?? 'http://localhost:4567',
    public: {
      ws: process.env.NUXT_PUBLIC_WS ?? 'ws://localhost:4567',
    },
  },
});
