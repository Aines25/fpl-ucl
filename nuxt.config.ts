import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'

const cloudflareBuild = process.argv.includes('cloudflare-module')
  || process.env.NITRO_PRESET === 'cloudflare-module'

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
    resolve: cloudflareBuild
      ? undefined
      : {
          alias: {
            '@takumi-rs/wasm/next': '@takumi-rs/wasm/node',
          },
        },
  },
  app: {
    head: {
      title: 'Champions League · 2026/27',
      htmlAttrs: { lang: 'en' },
      meta: [
        { name: 'description', content: 'Private Fantasy Premier League Champions League competition.' },
        { name: 'theme-color', content: '#050B1A' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'apple-mobile-web-app-title', content: 'FPL UCL' },
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/favicon.png' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
        { rel: 'manifest', href: '/site.webmanifest' },
      ],
    },
  },
  nitro: {
    experimental: {
      wasm: true,
    },
    wasm: {
      esmImport: true,
    },
    minify: false,
    alias: cloudflareBuild
      ? undefined
      : {
          '@takumi-rs/wasm/next': '@takumi-rs/wasm/node',
        },
    cloudflare: {
      nodeCompat: true,
      deployConfig: true,
    },
    routeRules: {
      '/api/fpl/**': {
        cors: false,
        headers: {
          'cache-control': 'private, no-cache',
          'cdn-cache-control': 'public, s-maxage=30, stale-while-revalidate=30',
        },
      },
      '/api/og/**': {
        cors: false,
        headers: {
          'cache-control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      },
      '/api/competition/**': {
        cors: false,
        headers: {
          'cache-control': 'private, no-cache',
          'cdn-cache-control': 'public, s-maxage=30, stale-while-revalidate=30',
        },
      },
    },
  },
})
