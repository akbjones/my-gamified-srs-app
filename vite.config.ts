import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { execSync } from 'child_process';
import { readFileSync } from 'fs';

// Inject app version + git short SHA at build time so the footer can
// display them.
// Resolution order:
//   1. CF_PAGES_COMMIT_SHA  – Cloudflare Pages exposes this for every build
//   2. VERCEL_GIT_COMMIT_SHA – Vercel equivalent
//   3. COMMIT_REF           – Netlify equivalent
//   4. `git rev-parse --short HEAD`         – local dev
//   5. 'dev' literal as last resort
// The platform env var is preferred over `git` because some CI runners
// use shallow clones / detached HEADs where the local git command can
// return blank.
const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));
let sha = process.env.CF_PAGES_COMMIT_SHA?.slice(0, 7) ||
          process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ||
          process.env.COMMIT_REF?.slice(0, 7) ||
          '';
if (!sha) {
  try { sha = execSync('git rev-parse --short HEAD').toString().trim(); } catch {}
}
if (!sha) sha = 'dev';
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
            // StaleWhileRevalidate: serve cached audio instantly, then refresh
            // from network in the background. Two reasons we switched off
            // CacheFirst: (1) when a user studies on multiple devices, a PC
            // that's been offline can have stale audio bytes locked in cache
            // forever; SwR auto-heals on next play. (2) audio regens won't
            // need a cache-name bump to reach existing users — the next play
            // after the regen pulls fresh bytes.
            handler: 'StaleWhileRevalidate',
            options: {
              // BUMP THIS NAME whenever the audio voice/source changes —
              // ensures users with broken cached bytes get a one-shot fresh
              // download even before SwR's background refresh kicks in.
              // v2 = 2026-06-11 Welsh fix + 10-language Chirp3-HD upgrade
              // v4 = 2026-06-13 force-evict stale v3 entries after native-voice regen
              // v5 = 2026-06-14 switch to StaleWhileRevalidate for cross-device resilience
              // v6 = 2026-06-27 Hindi register cleanup (473 cards regen'd)
              // v7 = 2026-06-28 10-lang Chirp3-HD-Aoede regen (~38k files)
              // v8 = 2026-07-07 Hindi greetings register fix (5 cards)
              cacheName: 'audio-cache-v8',
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
