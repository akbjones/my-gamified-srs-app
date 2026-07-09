import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipForward, SkipBack, X, Volume2 } from 'lucide-react';
import { QuestCard, Language, LANGUAGE_CONFIG } from '../types';
import { playCardAudio, stopAudio, preloadCardAudio } from '../services/audioService';
import type { AudioSpeed } from '../services/storageService';

interface ListenModeProps {
  cards: QuestCard[]; // pre-filtered list of "seen" cards to play through
  language: Language;
  audioSpeed: AudioSpeed;
  googleTtsApiKey?: string;
  onExit: () => void;
}

/**
 * Passive listening mode. Plays through cards the user has already seen,
 * back-to-back, so they can absorb pronunciation and rhythm while their
 * hands are busy. Works in the background as long as the audio service
 * is using MP3s (which it does whenever a recorded file exists).
 *
 * UX intent: open, tap Play, pocket the phone. No interaction required.
 * Minimal controls: pause, skip forward/back, close.
 */
const ListenMode: React.FC<ListenModeProps> = ({ cards, language, audioSpeed, googleTtsApiKey, onExit }) => {
  // Shuffle the cards on mount so users hear them in a fresh random order
  // every time. Cycle through the whole shuffled list before reshuffling so
  // no card repeats until everything's been heard once. Skip-back uses a
  // separate history stack so going backwards retraces the actual play
  // order, not just the shuffled index.
  const shuffledRef = useRef<QuestCard[]>([]);
  if (shuffledRef.current.length !== cards.length) {
    const arr = [...cards];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    shuffledRef.current = arr;
  }
  const playList = shuffledRef.current;

  const [idx, setIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showTranslation, setShowTranslation] = useState(false);
  // Avoid re-triggering playback on every render – only fire when the
  // playback state actually changes.
  const playingForCardId = useRef<string | null>(null);
  const timerRef = useRef<number | null>(null);

  const card = playList[idx];

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const playCurrent = useCallback(async () => {
    if (!card) return;
    playingForCardId.current = card.id;
    const shownAt = Date.now();
    // Preload the next 2 cards so playback is instant after the dwell.
    for (let lookahead = 1; lookahead <= 2; lookahead++) {
      const next = playList[(idx + lookahead) % playList.length];
      if (next?.audio) preloadCardAudio(next.audio);
    }
    // Advance to the next card, but ALWAYS keep it on screen long enough to
    // read. When audio genuinely can't play (missing device TTS voice for a
    // language, a stale cache, a network blip), playback resolves/​rejects
    // almost instantly — without a floor the deck would zip past silently
    // (the reported Hindi bug). MIN_CARD_MS guarantees a readable dwell.
    const MIN_CARD_MS = 3500;
    const advance = (extraPause: number) => {
      if (playingForCardId.current !== card.id || !isPlaying) return;
      const wait = Math.max(extraPause, MIN_CARD_MS - (Date.now() - shownAt));
      clearTimer();
      timerRef.current = window.setTimeout(() => {
        setShowTranslation(false);
        setIdx(i => (i + 1) % playList.length);
      }, wait);
    };
    try {
      // Resolves when audio FINISHES (real files dwell for their duration).
      await playCardAudio(card.audio, card.target, language, audioSpeed, googleTtsApiKey);
      advance(1200);
    } catch {
      // Audio failed — don't zip past; hold for the readable minimum.
      advance(0);
    }
  }, [card, language, audioSpeed, googleTtsApiKey, isPlaying, cards.length]);

  // Whenever the card OR playback state changes, restart playback.
  useEffect(() => {
    if (!card) return;
    if (isPlaying) {
      playCurrent();
    } else {
      stopAudio();
      clearTimer();
    }
    return () => {
      clearTimer();
    };
    // playCurrent intentionally NOT in deps to avoid loop – it depends on
    // card.id which is already a dep.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card?.id, isPlaying]);

  useEffect(() => {
    // Stop audio on unmount
    return () => {
      stopAudio();
      clearTimer();
    };
  }, []);

  if (!card) {
    return (
      <div className="flex flex-col h-dvh items-center justify-center px-6 text-center">
        <p className="text-[var(--text-muted)]">No cards to play yet – study a few first.</p>
        <button onClick={onExit} className="mt-4 px-4 py-2 rounded-lg border border-[var(--border-color)] text-sm font-bold">Back</button>
      </div>
    );
  }

  const wordCount = card.target.split(/\s+/).length;
  const sizeClass = wordCount <= 6 ? 'text-3xl md:text-4xl'
    : wordCount <= 10 ? 'text-2xl md:text-3xl'
    : wordCount <= 14 ? 'text-xl md:text-2xl'
    : 'text-lg md:text-xl';

  return (
    <section className="flex flex-col h-dvh pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] px-5">
      {/* Top bar */}
      <header className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Volume2 size={16} className="text-[var(--accent)]" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">
            Listen · {LANGUAGE_CONFIG[language].name}
          </span>
        </div>
        <button onClick={onExit} className="p-2 -mr-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-secondary)]" aria-label="Exit">
          <X size={20} />
        </button>
      </header>

      {/* Progress indicator – calm dot row, no progress bar */}
      <div className="flex items-center gap-1.5 mb-6 justify-center">
        <span className="text-[10px] font-mono text-[var(--text-muted)]">{idx + 1}</span>
        <span className="text-[10px] text-[var(--text-faint)]">/</span>
        <span className="text-[10px] font-mono text-[var(--text-muted)]">{cards.length}</span>
      </div>

      {/* Card */}
      <div className="flex-1 flex flex-col items-center justify-center text-center min-h-0">
        <p className={`${sizeClass} font-black text-[var(--text-primary)] leading-snug max-w-md mx-auto mb-6`}>
          {card.target}
        </p>
        {showTranslation ? (
          <p className="text-base md:text-lg text-[var(--text-secondary)] italic font-medium leading-relaxed max-w-md mx-auto animate-fade-in">
            {card.english}
          </p>
        ) : (
          <button
            onClick={() => setShowTranslation(true)}
            className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
          >
            Show translation
          </button>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 pt-6">
        <button
          onClick={() => { setShowTranslation(false); setIdx(i => (i - 1 + playList.length) % playList.length); }}
          className="p-3 rounded-full border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--accent)] hover:border-[var(--accent)]/40 active:scale-95 transition-all"
          aria-label="Previous"
        >
          <SkipBack size={20} />
        </button>
        <button
          onClick={() => setIsPlaying(p => !p)}
          className="p-5 rounded-full bg-[var(--accent)] text-white active:scale-95 transition-transform shadow-lg shadow-[var(--accent)]/30"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause size={24} /> : <Play size={24} />}
        </button>
        <button
          onClick={() => { setShowTranslation(false); setIdx(i => (i + 1) % playList.length); }}
          className="p-3 rounded-full border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--accent)] hover:border-[var(--accent)]/40 active:scale-95 transition-all"
          aria-label="Next"
        >
          <SkipForward size={20} />
        </button>
      </div>

      {/* Hint */}
      <p className="text-[10px] text-center text-[var(--text-faint)] uppercase tracking-widest font-bold mt-6">
        Background-friendly · Keep the phone locked
      </p>
    </section>
  );
};

export default ListenMode;
