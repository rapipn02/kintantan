import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script-defer',
      includeAssets: ['icons/favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        id: '/',
        name: 'Kintantan — Jelajah Kebun Binatang',
        short_name: 'Kintantan',
        description:
          'Peta interaktif kebun binatang. Datangi kandang, scan QR, kumpulkan semua hewan!',
        lang: 'id',
        start_url: '/',
        scope: '/',
        display: 'fullscreen',
        orientation: 'landscape',
        theme_color: '#8cc063',
        background_color: '#a9d47a',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icons/maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // App shell, peta, sprite & font di-precache supaya tetap jalan saat sinyal hilang.
        globPatterns: ['**/*.{js,css,html,webp,png,svg,woff2}'],
        // Pemindai wasm (~1 MB) hanya dibutuhkan browser tanpa BarcodeDetector bawaan (iOS),
        // jadi tidak di-precache untuk semua orang; di-cache saat pertama kali diambil.
        globIgnores: ['**/*.wasm'],
        // Peta dipakai sebagai PNG asli tanpa kompres (bisa belasan MiB), jadi batas default 2 MiB
        // dinaikkan agar peta tetap di-precache untuk mode offline. Cloudflare membatasi 25 MiB/file.
        maximumFileSizeToCacheInBytes: 30 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.endsWith('.wasm'),
            handler: 'CacheFirst',
            options: { cacheName: 'kintantan-wasm', expiration: { maxEntries: 4 } },
          },
        ],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
      },
    }),
  ],
  build: {
    target: 'es2022',
    // Jangan inline gambar ke JS; biarkan jadi file ber-hash yang di-cache selamanya.
    assetsInlineLimit: 0,
  },
  server: {
    host: true,
  },
})
