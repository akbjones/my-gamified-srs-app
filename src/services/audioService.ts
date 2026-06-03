import { Language, LANGUAGE_CONFIG } from '../types';
import type { AudioSpeed } from './storageService';

let currentAudio: HTMLAudioElement | null = null;
let currentAbort: AbortController | null = null;
// Monotonic token used to bail out of stale playCardAudio calls when a newer
// one supersedes them (rapid card changes, Listen-mid-autoplay).
let playToken = 0;

// In-memory cache for Google TTS audio blobs (avoids re-fetching)
const ttsCache = new Map<string, string>(); // key → objectURL

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
// Maps our Language type to Google Cloud TTS voice names
// Using Standard voices (free tier friendly) – Latin American where available
const GOOGLE_VOICE_MAP: Record<Language, { languageCode: string; name: string }> = {
  spanish: { languageCode: 'es-US', name: 'es-US-Wavenet-A' },     // LatAm female
  italian: { languageCode: 'it-IT', name: 'it-IT-Wavenet-A' },
  german:  { languageCode: 'de-DE', name: 'de-DE-Wavenet-A' },
  french:  { languageCode: 'fr-FR', name: 'fr-FR-Wavenet-A' },
  portuguese: { languageCode: 'pt-BR', name: 'pt-BR-Wavenet-A' },
  dutch: { languageCode: 'nl-NL', name: 'nl-NL-Wavenet-A' },
  swedish: { languageCode: 'sv-SE', name: 'sv-SE-Wavenet-D' },
  welsh: { languageCode: 'cy-GB', name: 'cy-GB-Standard-A' }, // no Wavenet for Welsh – browser TTS fallback
  hindi: { languageCode: 'hi-IN', name: 'hi-IN-Wavenet-A' },
  turkish: { languageCode: 'tr-TR', name: 'tr-TR-Wavenet-A' },
  russian: { languageCode: 'ru-RU', name: 'ru-RU-Wavenet-A' },
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
function playBrowserTts(text: string, lang: Language, speed: AudioSpeed): void {
  if (!('speechSynthesis' in window)) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = LANGUAGE_CONFIG[lang].bcp47;
  utterance.rate = speed;
  window.speechSynthesis.speak(utterance);
}

// ─── Main entry point ───────────────────────────────────────────
export const playCardAudio = async (
  audioFile: string,
  targetText: string,
  lang: Language = 'spanish',
  speed: AudioSpeed = 0.8,
  googleApiKey?: string,
): Promise<void> => {
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
    // VITE_AUDIO_BASE_URL: set at build time when audio is hosted elsewhere
    // (e.g. Cloudflare R2). Falls back to relative `/quest-audio` for local dev
    // where files are served from public/quest-audio.
    const AUDIO_BASE = (import.meta.env.VITE_AUDIO_BASE_URL || '/quest-audio').replace(/\/$/, '');
    const url = `${AUDIO_BASE}/${audioFile}`;
    let objectUrl: string | null = null;
    // Each call gets a token; if a newer call comes in (rapid card changes,
    // user clicks Listen mid-autoplay), the older call's `currentAudio !==
    // audio` check will skip play() and the rejection-from-pause noise.
    const myToken = ++playToken;

    // Retry once if the first fetch fails – this happens when the CDN is
    // briefly cold or the user just unlocked the screen on mobile. Without
    // a retry, the user used to hear robotic browser TTS as a fallback,
    // then on the next card the real voice came back.
    const fetchWithRetry = async (): Promise<Response> => {
      try {
        const r = await fetch(url);
        if (!r.ok) throw new Error(`fetch ${r.status} for ${audioFile}`);
        return r;
      } catch (firstErr) {
        // Quick retry, but only if we haven't been superseded.
        if (myToken !== playToken) throw firstErr;
        await new Promise(res => setTimeout(res, 350));
        if (myToken !== playToken) throw firstErr;
        const r = await fetch(url);
        if (!r.ok) throw new Error(`retry fetch ${r.status} for ${audioFile}`);
        return r;
      }
    };

    try {
      const resp = await fetchWithRetry();
      const blob = await resp.blob();
      // If a newer playCardAudio call has superseded this one, bail quietly.
      if (myToken !== playToken) return;
      objectUrl = URL.createObjectURL(blob);
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
      const finalUrl = objectUrl;
      return new Promise<void>((resolve, reject) => {
        const cleanup = () => {
          if (finalUrl) URL.revokeObjectURL(finalUrl);
          objectUrl = null;
        };
        audio.addEventListener('ended', () => { cleanup(); resolve(); }, { once: true });
        audio.addEventListener('error', () => { cleanup(); reject(new Error('audio playback error')); }, { once: true });
        // pause()-on-stopAudio fires `pause` not `ended`. If a newer call
        // supersedes us, currentAudio gets swapped out – bail on the pause
        // event so the caller's await doesn't hang.
        audio.addEventListener('pause', () => {
          if (currentAudio !== audio) { cleanup(); resolve(); }
        }, { once: true });
        audio.play().catch(err => { cleanup(); reject(err); });
      });
    } catch (err) {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
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
      // We do NOT fall through to browser TTS when an audioFile was set –
      // see the audioFile check at the end of this function. Falling through
      // would play the robot voice and then the next card would play the real
      // voice, which was disorienting.
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

  // 3. Browser TTS fallback – but ONLY when no MP3 was available to try in
  // the first place. If an audioFile was provided and just failed to load
  // (network error, transient 404), we'd rather stay silent than play the
  // robotic system voice that doesn't match the recorded woman voice.
  // The user can tap the audio button to retry; the MP3 will likely succeed
  // on second attempt now that the cache is warm.
  if (!audioFile) {
    playBrowserTts(targetText, lang, speed);
  }
};
