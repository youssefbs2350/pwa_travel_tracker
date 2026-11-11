import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    // Chunk splitting pour un meilleur cache long-terme
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-leaflet': ['leaflet'],
          'vendor-dexie': ['dexie'],
          'vendor-lucide': ['lucide-react'],
        }
      }
    },
    // Compresse les assets et met en cache-busting via hash dans le nom
    chunkSizeWarningLimit: 1000,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png', 'pwa-512x512.svg'],
      manifest: {
        id: '/',
        name: 'Travel Tracker PWA',
        short_name: 'TravelTracker',
        description: 'Application PWA tout-en-un organisez et optimisez vos séjours intelligemment.',
        theme_color: '#0284c7',
        background_color: '#020617',
        display: 'standalone',
        display_override: ['standalone', 'window-controls-overlay'],
        prefer_related_applications: false,
        categories: ['travel', 'lifestyle', 'productivity'],
        orientation: 'portrait-primary',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      devOptions: {
        enabled: true,
        type: 'module'
      },
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        // Pre-cache tous les assets statiques lors de l'installation SW
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,webp}'],
        runtimeCaching: [
          // ── API auth/users → jamais cachées (données sensibles) ──
          {
            urlPattern: /^\/api\/(users|auth|complaints)/i,
            handler: 'NetworkOnly',
          },
          // ── Messages temps réel → NetworkFirst très court (2 s) ──
          {
            urlPattern: /^\/api\/trips\/.*\/messages/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-messages-cache',
              networkTimeoutSeconds: 2,
              expiration: { maxEntries: 30, maxAgeSeconds: 120 },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          // ── Lieux, activités, dépenses (données stables) → StaleWhileRevalidate 10 min ──
          {
            urlPattern: /^\/api\/(places|activities|expenses|memories)\b/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'api-data-cache',
              expiration: { maxEntries: 200, maxAgeSeconds: 600 },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          // ── Voyages → StaleWhileRevalidate 5 min ──
          {
            urlPattern: /^\/api\/trips\b/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'api-trips-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 300 },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          // ── Tuiles OSM carte → CacheFirst 60 jours ──
          {
            urlPattern: /^https:\/\/[a-z]\.tile\.openstreetmap\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'osm-tiles-cache',
              expiration: { maxEntries: 1000, maxAgeSeconds: 5184000 },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          // ── Nominatim géocoding → StaleWhileRevalidate 7 jours ──
          {
            urlPattern: /^https:\/\/nominatim\.openstreetmap\.org\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'nominatim-cache',
              expiration: { maxEntries: 300, maxAgeSeconds: 604800 },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          // ── Wikipedia/Wikimedia photos → CacheFirst 14 jours ──
          {
            urlPattern: /^https:\/\/(fr|en)\.wikipedia\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'wikipedia-cache',
              expiration: { maxEntries: 300, maxAgeSeconds: 1209600 },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            urlPattern: /^https:\/\/commons\.wikimedia\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'wikimedia-images-cache',
              expiration: { maxEntries: 200, maxAgeSeconds: 2592000 },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          // ── Images Unsplash → CacheFirst 30 jours ──
          {
            urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'unsplash-images-cache',
              expiration: { maxEntries: 150, maxAgeSeconds: 2592000 },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          // ── Google Fonts → CacheFirst 1 an ──
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 30, maxAgeSeconds: 31536000 },
              cacheableResponse: { statuses: [0, 200] }
            }
          }
        ]
      }
    })
  ]
})
