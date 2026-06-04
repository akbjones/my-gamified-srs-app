import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { execSync } from 'child_process';
import { readFileSync } from 'fs';

// Inject app version + git short SHA at build time so the footer can
// display them. Fall back to "dev" when not in a git repo or git isn't
// installed in the build environment.
const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));
let sha = 'dev';
try { sha = execSync('git rev-parse --short HEAD').toString().trim(); } catch {}
const buildDate = new Date().toISOString().slice(0, 10);

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __APP_SHA__: JSON.stringify(sha),
    __APP_BUILD_DATE__: JSON.stringify(buildDate),
  },
  preview: {
    // Allow tunneling services so we can share the preview build externally.
    allowedHosts: ['.trycloudflare.com', '.ngrok.io', 'langlab-srs.netlify.app', 'localhost'],
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'LangLab',
        short_name: 'LangLab',
        description: 'Gamified spaced-repetition language learning',
        theme_color: '#7C3AED',
        background_color: '#0F0A1A',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Take control of all clients immediately on activation so users
        // see the new version on next page load (no need to close all tabs).
        skipWaiting: true,
        clientsClaim: true,
        // Wipe outdated precaches so old assets don't linger.
        cleanupOutdatedCaches: true,
        // Import our custom notification handler into the generated SW
        importScripts: ['sw-notifications.js'],
        // Only precache the app shell — NOT the 9000+ audio files
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        globIgnores: ['quest-audio/**', 'sw-notifications.js'],
        maximumFileSizeToCacheInBytes: 20 * 1024 * 1024, // 20 MB — bundle includes 11 language deck/dictionary/conjugation data
        // Runtime cache audio files on demand
        runtimeCaching: [
          {
            urlPattern: /\/quest-audio\/.*\.mp3$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'audio-cache',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              },
              rangeRequests: true,
            },
          },
          {
            // Cache Google Fonts
            urlPattern: /^https:\/\/fonts\.googleapis\.com/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
              },
            },
          },
        ],
      },
    }),
  ],
});
