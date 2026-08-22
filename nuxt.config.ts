import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/tailwind.css'],
  modules: ['shadcn-nuxt', '@nuxt/fonts'],
  components: {
    dirs: [
      { path: '~/components/layout', pathPrefix: false },
      { path: '~/components/brand', pathPrefix: false },
      { path: '~/components/competition', pathPrefix: false },
      '~/components',
    ],
  },
  shadcn: {
    prefix: '',
    componentDir: '@/components/ui',
  },
  fonts: {
    families: [
      { name: 'Cinzel', provider: 'google', weights: [400, 600, 700] },
      { name: 'Barlow Condensed', provider: 'google', weights: [500, 600, 700] },
      { name: 'Inter', provider: 'google', weights: [400, 500, 600] },
    ],
  },
  alias: {
    '#data': fileURLToPath(new URL('./data', import.meta.url)),
    '#engine': fileURLToPath(new URL('./lib/engine', import.meta.url)),
    '#types': fileURLToPath(new URL('./lib/types', import.meta.url)),
  },
  vite: {
    plugins: [tailwindcss()],
  },
  app: {
    head: {
      title: 'Champions League · 2026/27',
      htmlAttrs: { lang: 'en' },
      meta: [
        { name: 'description', content: 'Private Fantasy Premier League Champions League competition.' },
        { name: 'theme-color', content: '#050B1A' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
      ],
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    },
  },
  nitro: {
    routeRules: {
      '/api/fpl/**': {
        cors: false,
        headers: { 'cache-control': 's-maxage=60' },
      },
    },
  },
})
