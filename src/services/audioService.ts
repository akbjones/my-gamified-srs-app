import { Language, LANGUAGE_CONFIG } from '../types';
import type { AudioSpeed } from './storageService';

let currentAudio: HTMLAudioElement | null = null;
let currentAbort: AbortController | null = null;
// Monotonic token used to bail out of stale playCardAudio calls when a newer
// one supersedes them (rapid card changes, Listen-mid-autoplay).
let playToken = 0;

// In-memory cache for Google TTS audio blobs (avoids re-fetching)
const ttsCache = new Map<string, string>(); // key → objectURL

// ─── Pre-recorded MP3 cache ─────────────────────────────────────
// Card audio is preloaded ahead of time so the user hears playback
// instantly on card change instead of waiting for a fresh fetch.
// Key: audio filename (e.g. "es-37.mp3"); value: { blob URL, mtime touch }.
// LRU-ish bounded — when full, drop the oldest non-pending entry.
// Bigger than the preload pressure (session warms 12 + current&plus;2 per card)
// so we don't churn — the old 24 evicted after ~8 cards, sometimes revoking a
// blob URL that was still playing (a cause of audio "disappearing" mid-session).
const MP3_CACHE_MAX = 64;
type Mp3CacheEntry = { url: string; touched: number };
const mp3Cache = new Map<string, Mp3CacheEntry>();
// In-flight fetches to dedupe concurrent preload+play requests
const mp3InFlight = new Map<string, Promise<string>>();

function getAudioBase(): string {
  return (import.meta.env.VITE_AUDIO_BASE_URL || '/quest-audio').replace(/\/$/, '');
}

// Bump whenever audio content changes — appended as ?v=N to every audio
// URL so CDN edge nodes serving stale bytes for unversioned URLs can't hit.
// Pair with audio-cache-vN bump in vite.config.ts.
const AUDIO_VERSION = '18';

function fetchAndCacheMp3(audioFile: string): Promise<string> {
  const cached = mp3Cache.get(audioFile);
  if (cached) {
    cached.touched = Date.now();
    return Promise.resolve(cached.url);
  }
  const existing = mp3InFlight.get(audioFile);
  if (existing) return existing;

  const url = `${getAudioBase()}/${audioFile}?v=${AUDIO_VERSION}`;
  const promise = (async () => {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`fetch ${r.status} for ${audioFile}`);
    const blob = await r.blob();
    const objectUrl = URL.createObjectURL(blob);
    // Evict the oldest IDLE entry when full. Never revoke the URL that's
    // currently playing (currentAudio.src) or one being fetched right now —
    // revoking an in-use blob URL is what made audio cut out mid-session.
    if (mp3Cache.size >= MP3_CACHE_MAX) {
      const playingUrl = currentAudio?.src;
      let oldestKey: string | null = null;
      let oldestTime = Infinity;
      for (const [k, v] of mp3Cache) {
        if (v.url === playingUrl) continue;   // in use — do not evict
        if (mp3InFlight.has(k)) continue;      // being fetched — do not evict
        if (v.touched < oldestTime) {
          oldestTime = v.touched;
          oldestKey = k;
        }
      }
      if (oldestKey) {
        const dropped = mp3Cache.get(oldestKey);
        if (dropped) URL.revokeObjectURL(dropped.url);
        mp3Cache.delete(oldestKey);
      }
      // If every entry was pinned, we simply skip eviction this round and the
      // cache grows slightly past MP3_CACHE_MAX until an entry frees up.
    }
    mp3Cache.set(audioFile, { url: objectUrl, touched: Date.now() });
    return objectUrl;
  })();
  mp3InFlight.set(audioFile, promise);
  promise.finally(() => mp3InFlight.delete(audioFile));
  return promise;
}

/**
 * Warm the cache for a whole session queue (first N cards), staggered so
 * we don't burst-hammer R2 on session start. Cold-start fetch flakiness
 * on a card's first appearance was a reported bug; this makes the first
 * plays come from memory.
 */
export const preloadSessionAudio = (audioFiles: (string | undefined)[], limit = 12): void => {
  const files = audioFiles.filter((f): f is string => !!f).slice(0, limit);
  files.forEach((f, i) => {
    setTimeout(() => preloadCardAudio(f), i * 250);
  });
};

/**
 * Preload audio for an upcoming card. Fire-and-forget — failures are
 * silent. Call this when you know which cards the user is likely to
 * hit next so the playback is instant when they get there.
 */
export const preloadCardAudio = (audioFile: string | undefined): void => {
  if (!audioFile) return;
  if (mp3Cache.has(audioFile) || mp3InFlight.has(audioFile)) return;
  fetchAndCacheMp3(audioFile).catch(() => {
    // Silent: preloading failures don't matter; live fetch will retry.
  });
};

export const stopAudio = (): void => {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  if (currentAbort) {
    currentAbort.abort();
    currentAbort = null;
  }
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};

// ─── Google Cloud TTS ───────────────────────────────────────────
// Canonical voices: Chirp3-HD-Aoede (the same voice generate-audio.cjs
// regen'd all 10 non-Welsh languages with in 2026-06-28). When the
// pre-recorded MP3 fails to load and we fall back to live API
// synthesis, this MUST match — otherwise the user hears one voice on
// cards whose MP3 fetched cleanly and a DIFFERENT voice on cards
// whose MP3 fetch failed. (That's how we discovered users heard
// "switching between two voices" on Hindi.)
//
// Earlier note about Aoede struggling with non-Latin scripts was
// addressed by Google; verified across all 10 languages.
// 'msa' is staged (registry + audits only) ahead of app-side Language integration
const GOOGLE_VOICE_MAP: Record<Language | 'msa', { languageCode: string; name: string }> = {
  spanish: { languageCode: 'es-US', name: 'es-US-Chirp3-HD-Aoede' },
  italian: { languageCode: 'it-IT', name: 'it-IT-Chirp3-HD-Aoede' },
  german:  { languageCode: 'de-DE', name: 'de-DE-Chirp3-HD-Aoede' },
  french:  { languageCode: 'fr-FR', name: 'fr-FR-Chirp3-HD-Aoede' },
  portuguese: { languageCode: 'pt-BR', name: 'pt-BR-Chirp3-HD-Aoede' },
  dutch: { languageCode: 'nl-NL', name: 'nl-NL-Chirp3-HD-Aoede' },
  swedish: { languageCode: 'sv-SE', name: 'sv-SE-Chirp3-HD-Aoede' },
  welsh: { languageCode: 'cy-GB', name: 'cy-GB-Standard-A' }, // no Google premium for Welsh — browser TTS fallback
  hindi: { languageCode: 'hi-IN', name: 'hi-IN-Chirp3-HD-Aoede' },
  turkish: { languageCode: 'tr-TR', name: 'tr-TR-Chirp3-HD-Aoede' },
  russian: { languageCode: 'ru-RU', name: 'ru-RU-Chirp3-HD-Aoede' },
  indonesian: { languageCode: 'id-ID', name: 'id-ID-Chirp3-HD-Aoede' },
  greek: { languageCode: 'el-GR', name: 'el-GR-Chirp3-HD-Aoede' },
  korean: { languageCode: 'ko-KR', name: 'ko-KR-Chirp3-HD-Aoede' },
  japanese: { languageCode: 'ja-JP', name: 'ja-JP-Chirp3-HD-Aoede' },
  msa: { languageCode: 'ar-XA', name: 'ar-XA-Chirp3-HD-Aoede' },
};

// Speed maps to Google TTS speakingRate (0.25–4.0, 1.0 = normal)
const GOOGLE_SPEED_MAP: Record<AudioSpeed, number> = {
  0.6: 0.75,
  0.8: 0.9,
  1.0: 1.0,
};

async function playGoogleTts(
  text: string,
  lang: Language,
  speed: AudioSpeed,
  apiKey: string,
): Promise<void> {
  const voice = GOOGLE_VOICE_MAP[lang];
  const cacheKey = `${lang}:${speed}:${text}`;

  let objectUrl = ttsCache.get(cacheKey);

  if (!objectUrl) {
    const abort = new AbortController();
    currentAbort = abort;

    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abort.signal,
        body: JSON.stringify({
          input: { text },
          voice: {
            languageCode: voice.languageCode,
            name: voice.name,
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: GOOGLE_SPEED_MAP[speed],
            pitch: 0, // neutral
          },
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Google TTS API error: ${response.status}`);
    }

    const data = await response.json();
    const audioBytes = atob(data.audioContent);
    const audioArray = new Uint8Array(audioBytes.length);
    for (let i = 0; i < audioBytes.length; i++) {
      audioArray[i] = audioBytes.charCodeAt(i);
    }
    const blob = new Blob([audioArray], { type: 'audio/mpeg' });
    objectUrl = URL.createObjectURL(blob);
    ttsCache.set(cacheKey, objectUrl);

    // Cap cache size – evict oldest entries past 200
    if (ttsCache.size > 200) {
      const firstKey = ttsCache.keys().next().value;
      if (firstKey) {
        const oldUrl = ttsCache.get(firstKey);
        if (oldUrl) URL.revokeObjectURL(oldUrl);
        ttsCache.delete(firstKey);
      }
    }
  }

  return new Promise<void>((resolve, reject) => {
    const audio = new Audio(objectUrl);
    currentAudio = audio;
    audio.onended = () => resolve();
    audio.onerror = () => reject(new Error('Audio playback error'));
    audio.play().catch(reject);
  });
}

// ─── Browser TTS (fallback) ─────────────────────────────────────
// Pick the best system voice for a bcp47 tag. Without an explicit voice the
// OS default speaks — for Welsh (cy-GB) that is typically a jarring robotic
// MALE voice, the "old robotic Welsh voice" users reported when a recording
// failed to load. Prefer an exact-locale voice, then a base-language voice,
// and among matches prefer a female one to stay close to the recorded voices
// (all our decks use female TTS). speechSynthesis.getVoices() is empty until
// the async 'voiceschanged' fires, so we cache and refresh.
let cachedVoices: SpeechSynthesisVoice[] = [];
function refreshVoices() { try { cachedVoices = window.speechSynthesis.getVoices() || []; } catch { /* ignore */ } }
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  refreshVoices();
  try { window.speechSynthesis.addEventListener('voiceschanged', refreshVoices); } catch { /* ignore */ }
}
const FEMALE_HINT = /female|woman|nia|siwan|aled|-a$|zira|susan|samantha|karen|serena|amelie|anna|nora/i;
function pickVoice(bcp47: string): SpeechSynthesisVoice | undefined {
  if (!cachedVoices.length) refreshVoices();
  const base = bcp47.split('-')[0].toLowerCase();
  const exact = cachedVoices.filter(v => v.lang.toLowerCase() === bcp47.toLowerCase());
  const byBase = cachedVoices.filter(v => v.lang.toLowerCase().startsWith(base));
  const pool = exact.length ? exact : byBase;
  if (!pool.length) return undefined; // no matching voice — let the OS decide
  return pool.find(v => FEMALE_HINT.test(v.name)) ?? pool[0];
}

// Returns a Promise that resolves when the utterance finishes (or is
// cancelled by stopAudio). Without this, callers like ListenMode's auto-
// advance would race ahead while the speech was still mid-sentence and
// the next card's stopAudio() would chop off the previous one.
function playBrowserTts(text: string, lang: Language, speed: AudioSpeed): Promise<void> {
  return new Promise<void>((resolve) => {
    if (!('speechSynthesis' in window)) {
      resolve();
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = LANGUAGE_CONFIG[lang].bcp47;
    const voice = pickVoice(LANGUAGE_CONFIG[lang].bcp47);
    if (voice) utterance.voice = voice;
    utterance.rate = speed;
    // Resolve on both end and error – cancel via speechSynthesis.cancel()
    // also fires onend. We don't reject on error because the caller treats
    // "audio finished playing" and "audio failed" identically for advance.
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    window.speechSynthesis.speak(utterance);
  });
}

// ─── Main entry point ───────────────────────────────────────────
export const playCardAudio = async (
  audioFile: string,
  targetText: string,
  lang: Language = 'spanish',
  speed: AudioSpeed = 0.8,
  googleApiKey?: string,
  opts?: { allowBrowserTts?: boolean },
): Promise<void> => {
  // opts.allowBrowserTts is retained for API compat but no longer suppresses
  // the audible fallback — see step 3. Silence during study was the bug.
  void opts;
  stopAudio();

  // 1. Try pre-recorded MP3 first.
  //
  // We fetch the file as a blob and create an object URL, then hand that to
  // the Audio element. Going via blob avoids two failure modes that plagued
  // the previous direct-`/quest-audio/...` approach:
  //   1. Range-request stalls – some environments (PWA via service worker,
  //      certain mobile browsers) never fire `canplaythrough` for small MP3s
  //      because the buffered-estimate heuristic gets confused and the
  //      Audio element parks in `networkState=2 readyState=0` indefinitely.
  //   2. Silent autoplay fallthrough – when the load stalled, we used to
  //      time out and fall through to browser TTS, which on systems without
  //      a matching voice is just silence.
  if (audioFile) {
    // Each call gets a token; if a newer call comes in (rapid card changes,
    // user clicks Listen mid-autoplay), the older call's `currentAudio !==
    // audio` check will skip play() and the rejection-from-pause noise.
    const myToken = ++playToken;
    let objectUrl: string | null = null;

    // Try the preload cache first. If hit, playback is instant (no fetch).
    // Falls through to fetchAndCacheMp3 on miss (which itself retries via
    // the existing logic — but we replicate the 350ms retry on miss only).
    // Three attempts with growing backoff — transient R2/network blips on a
    // card's FIRST appearance were the "no audio, then it works later" bug.
    const fetchWithCache = async (): Promise<string> => {
      const delays = [350, 1200];
      for (let attempt = 0; ; attempt++) {
        try {
          return await fetchAndCacheMp3(audioFile);
        } catch (err) {
          if (myToken !== playToken || attempt >= delays.length) throw err;
          await new Promise(res => setTimeout(res, delays[attempt]));
          if (myToken !== playToken) throw err;
        }
      }
    };

    try {
      const cachedUrl = await fetchWithCache();
      // If a newer playCardAudio call has superseded this one, bail quietly.
      if (myToken !== playToken) return;
      // Use the cached URL directly — do NOT revoke it in cleanup, since the
      // cache owns the URL lifecycle.
      objectUrl = cachedUrl;
      const audio = new Audio(objectUrl);
      // Pre-recorded files are generated at 0.95x speaking rate, so adjust
      // playback rate to compensate (avoid double-slowdown)
      audio.playbackRate = speed === 1.0 ? 1.05 : speed === 0.8 ? 1.0 : 0.8;
      currentAudio = audio;

      // Resolve when the audio FINISHES, not when it starts.
      // The old code did `await audio.play()` and returned immediately, which
      // resolves as soon as playback begins. That broke ListenMode's auto-
      // advance (1800ms after START, not END) and made other callers think
      // playback was done before it actually was. Now we await full duration,
      // matching the Google TTS path.
      // NOTE: do not revoke objectUrl on cleanup — the mp3 cache owns its
      // lifecycle (eviction releases the URL). Revoking here would break
      // subsequent cache hits for the same file.
      return new Promise<void>((resolve, reject) => {
        audio.addEventListener('ended', () => { resolve(); }, { once: true });
        audio.addEventListener('error', () => { reject(new Error('audio playback error')); }, { once: true });
        audio.addEventListener('pause', () => {
          if (currentAudio !== audio) { resolve(); }
        }, { once: true });
        audio.play().catch(err => { reject(err); });
      });
    } catch (err) {
      // Don't revoke — cache owns the URL.
      // If we got superseded, don't clobber the current audio or fall through.
      if (myToken !== playToken) return;
      currentAudio = null;
      const msg = (err as Error).message ?? String(err);
      // Race: stopAudio() was called while play() was still pending. Common
      // when the user clicks Listen during autoplay or rapidly switches cards.
      // The newer call is already handling playback; nothing to do.
      if (msg.includes('interrupted by a call to pause')) return;
      // Surface real failures so they're visible in DevTools.
      console.warn('[audioService] pre-recorded audio failed (after retry):', msg);
      // NOTE: execution DOES fall through to the browser-TTS fallback at the
      // end of this function (step 3) — better a system voice than silence
      // when a recording genuinely fails (e.g. an r2.dev throttle on an
      // uncached card). pickVoice() keeps that fallback close to the recorded
      // voice instead of the OS default (which was the robotic male Welsh
      // voice users reported). The real recording is warmed in the background
      // so the canonical voice returns on the next play.
    }
  }

  // 2. Try Google Cloud TTS if API key is set
  // Skip for Welsh – Google Cloud TTS does not support cy-GB
  if (googleApiKey && lang !== 'welsh') {
    try {
      await playGoogleTts(targetText, lang, speed, googleApiKey);
      return;
    } catch (err) {
      // If it's an abort, don't fall through
      if (err instanceof DOMException && err.name === 'AbortError') return;
      console.warn('Google TTS failed, falling back to browser TTS:', err);
    }
  }

  // 3. Audible fallback. The pre-recorded MP3 genuinely failed (now rare: the
  // cache no longer revokes in-use URLs and the service worker caches audio).
  // Speak the sentence with the system voice rather than leaving the learner
  // in silence — hearing the sentence matters more than voice consistency,
  // and this only fires on a real failure, not a slow-but-successful load.
  // Warm the real recording in the background so the canonical voice returns
  // on the next play of this card.
  if (audioFile) setTimeout(() => preloadCardAudio(audioFile), 1500);
  await playBrowserTts(targetText, lang, speed);
};
