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
  build: {
    rollupOptions: {
      output: {
        // Give each language's deck.json its own predictably-named chunk
        // (assets/deck-<lang>-[hash].js) so it's code-split + loaded on demand,
        // never bundled into the main chunk. The SW globIgnores + runtime-caches
        // these (see workbox below), keeping the precache to the app shell only.
        manualChunks(id: string) {
          const m = id.match(/[/\\]data[/\\]([a-z]+)[/\\]deck\.json$/);
          if (m) return `deck-${m[1]}`;
          return undefined;
        },
      },
    },
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
        // Precache the app shell only — NOT the audio files and NOT the
        // per-language deck chunks (those are runtime-cached on demand below,
        // so a visitor only downloads the deck they actually study).
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        globIgnores: ['quest-audio/**', 'sw-notifications.js', 'assets/deck-*.js'],
        // Decks are code-split now (14 chunks runtime-cached separately), so the
        // main app-shell chunk dropped ~19.9 MB -> ~6.7 MB. Cap gives headroom
        // for the shell (still holds all 14 dictionaries + conjugation engines —
        // splitting those is the next optimization). Was pinned at 20 MB to fit
        // the old monolith.
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024, // 8 MB
        // Runtime cache audio files on demand
        runtimeCaching: [
          {
            // NOTE the (\?.*)?$ — audio URLs carry a ?v=N cache-buster, so a
            // bare `.mp3$` never matched and audio was never SW-cached (every
            // card depended on one live request; a blip = silence). Now a
            // once-heard card is served from the SW cache through a later blip.
            urlPattern: /\/quest-audio\/.*\.mp3(\?.*)?$/,
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
              // v9 = 2026-07-08 RU+TR quality pilot (28 cards)
              // v10 = 2026-07-08 RU+TR full quality batch (652 cards)
              // v11 = 2026-07-09 Greek+Korean waves 2-4 (2,300→3,300 cards)
              // v12 = 2026-07-09 EL+KO wave-5 capstone (633 ea) + Hindi naturalness (153)
              // v13 = 2026-07-09 Russian naturalness rewrite (250 cards)
              // v14 = 2026-07-09 Hindi naturalness pass 2 — shorten early + word order (94 cards)
              // v15 = 2026-07-09 Hindi naturalness pass 3 — intermediate+advanced word order + gender (86 cards)
              // v16 = 2026-07-14 Hindi usefulness pass — 545 decorative/trivia/preachy cards replaced with useful everyday sentences
              // v17 = 2026-07-14 Welsh correctness pass — 93 garbled word-salad cards rewritten (semantics-first + mutations), audio via Edge TTS NiaNeural
              // v18 = 2026-07-14 Hindi voice harmonisation — 848 Neural2 stragglers regenerated on Chirp3-HD-Aoede so the whole deck is one voice
              // v19 = 2026-07-23 Japanese starter (300 deck clips) + kana teacher (120) + Devanagari teacher (102)
              // v20 = 2026-07-23 Devanagari vowel-length fix — 21 vowel/matra clips recalibrated so long vowels are audibly longer than short
              // v26 = 2026-08-10 Russian de-clump — 132 occupation-chore/waltz template cards rewritten + regenerated
              cacheName: 'audio-cache-v26',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              },
              rangeRequests: true,
            },
          },
          {
            // Code-split language deck chunks. Hashed filenames are immutable,
            // so CacheFirst is safe (a deck edit = new hash = new URL = miss →
            // fetch). This gives offline access to any language loaded once,
            // without precaching all 14 decks at install.
            urlPattern: /\/assets\/deck-[^/]+\.js$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'deck-cache-v1',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 24 * 60 * 60, // 60 days
              },
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
