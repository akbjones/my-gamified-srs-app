import { Language, LANGUAGE_CONFIG } from '../types';
import type { AudioSpeed } from './storageService';

let currentAudio: HTMLAudioElement | null = null;
let currentAbort: AbortController | null = null;

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
// Using Standard voices (free tier friendly) — Latin American where available
const GOOGLE_VOICE_MAP: Record<Language, { languageCode: string; name: string }> = {
  spanish: { languageCode: 'es-US', name: 'es-US-Standard-A' },   // LatAm female
  italian: { languageCode: 'it-IT', name: 'it-IT-Standard-A' },
  german:  { languageCode: 'de-DE', name: 'de-DE-Standard-A' },
  french:  { languageCode: 'fr-FR', name: 'fr-FR-Standard-A' },
  portuguese: { languageCode: 'pt-BR', name: 'pt-BR-Standard-A' },
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

    // Cap cache size — evict oldest entries past 200
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

  // 1. Try pre-recorded MP3 first
  if (audioFile) {
    try {
      const audio = new Audio(`/quest-audio/${audioFile}`);
      audio.playbackRate = speed === 1.0 ? 1 : speed === 0.8 ? 0.9 : 0.7;
      currentAudio = audio;
      // Wait for the audio to be loadable before playing — otherwise a 404
      // resolves play() but fires a media error silently, skipping TTS fallback.
      await new Promise<void>((resolve, reject) => {
        audio.oncanplaythrough = () => resolve();
        audio.onerror = () => reject(new Error('Audio file not found'));
        // Timeout: if nothing happens in 2s, fall through
        setTimeout(() => reject(new Error('Audio load timeout')), 2000);
      });
      await audio.play();
      return;
    } catch {
      currentAudio = null;
      // Fall through to TTS
    }
  }

  // 2. Try Google Cloud TTS if API key is set
  if (googleApiKey) {
    try {
      await playGoogleTts(targetText, lang, speed, googleApiKey);
      return;
    } catch (err) {
      // If it's an abort, don't fall through
      if (err instanceof DOMException && err.name === 'AbortError') return;
      console.warn('Google TTS failed, falling back to browser TTS:', err);
    }
  }

  // 3. Browser TTS fallback
  playBrowserTts(targetText, lang, speed);
};
