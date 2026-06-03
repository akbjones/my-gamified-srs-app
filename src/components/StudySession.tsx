import React, { useState, useEffect, useRef, useMemo } from 'react';
import { QuestCard, SessionState, Language, ChallengeMode } from '../types';
import { Volume2, BookOpen, BookText, AlertTriangle, Swords, Zap, Star } from 'lucide-react';
import { playCardAudio, stopAudio } from '../services/audioService';
import { lookupEtymology } from '../services/etymologyService';
import {
  toggleGrammarFavorite, isGrammarFavorited,
  toggleEtymologyFavorite, isEtymologyFavorited,
} from '../services/storageService';
import type { AudioSpeed } from '../services/storageService';
import WordPopover from './WordPopover';
import WordTileChallenge from './WordTileChallenge';

/** Find the first word in a target sentence that has a verified etymology
 *  entry. Returns both the cleaned word (no punctuation) and the entry.
 *  Used to surface a card-level "Etymology · word" button at the top of
 *  the card so the user discovers etymology without first having to tap
 *  individual words.
 *
 *  Defensive try/catch — if any unexpected data shape slips through, we
 *  fall back to no etymology rather than crashing the whole session. */
function findCardEtymology(targetSentence: string, language: Language) {
  try {
    if (!targetSentence || typeof targetSentence !== 'string') return null;
    const tokens = targetSentence.split(/\s+/);
    for (const raw of tokens) {
      const cleaned = raw.replace(/[.,!?;:""«»()'"¿¡]/g, '').trim();
      if (!cleaned) continue;
      const entry = lookupEtymology(cleaned, language);
      if (entry) return { word: cleaned, entry };
    }
  } catch (e) {
    console.error('findCardEtymology failed:', e);
  }
  return null;
}

interface StudySessionProps {
  session: SessionState;
  onAnswer: (rating: 'AGAIN' | 'HARD' | 'GOOD' | 'EASY') => void;
  onUndoAnswer?: () => void;
  onAbort: () => void;
  onStudyMore?: (count: number) => void;
  hasMoreCards?: boolean;
  topicCards: QuestCard[];
  autoPlayAudio: boolean;
  audioSpeed: AudioSpeed;
  googleTtsApiKey?: string;
  tileCardIds?: Set<string>;
  pendingChallenge?: ChallengeMode | null;
  onStartChallenge?: () => void;
}

const GRADE_CONFIG = {
  AGAIN: { color: 'text-red-500', bg: 'hover:bg-red-500/10 active:bg-red-500/20', border: 'border-red-500/30' },
  HARD:  { color: 'text-orange-500', bg: 'hover:bg-orange-500/10 active:bg-orange-500/20', border: 'border-orange-500/30' },
  GOOD:  { color: 'text-emerald-500', bg: 'hover:bg-emerald-500/10 active:bg-emerald-500/20', border: 'border-emerald-500/30' },
  EASY:  { color: 'text-[var(--accent)]', bg: 'hover:bg-[var(--accent)]/10 active:bg-[var(--accent)]/20', border: 'border-[var(--accent)]/30' },
} as const;

const FIRST_WOW_KEY = 'first-session-wow-shown';

const StudySession: React.FC<StudySessionProps> = ({ session, onAnswer, onUndoAnswer, onAbort, onStudyMore, hasMoreCards, topicCards = [], autoPlayAudio, audioSpeed, googleTtsApiKey, tileCardIds = new Set(), pendingChallenge, onStartChallenge }) => {
  const [showInfo, setShowInfo] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showGrammar, setShowGrammar] = useState(false);
  const [showEtymology, setShowEtymology] = useState(false);
  // Local mirrors of favorite state so the Save button in each overlay flips
  // immediately on tap. Recomputed when the relevant overlay opens.
  const [grammarFavd, setGrammarFavd] = useState(false);
  const [etyFavd, setEtyFavd] = useState(false);
  const [studyMoreCount, setStudyMoreCount] = useState(10);
  // First-time hint: shown only on the very first card of the user's first
  // session, so they discover that words are tappable. Disappears on the
  // first tap or after the card advances.
  const [showFirstWowHint, setShowFirstWowHint] = useState(() => {
    try {
      return localStorage.getItem(FIRST_WOW_KEY) === null;
    } catch {
      return false;
    }
  });
  const dismissFirstWowHint = () => {
    setShowFirstWowHint(false);
    try { localStorage.setItem(FIRST_WOW_KEY, '1'); } catch {}
  };

  const isComplete = session.currentIndex >= session.queue.length;
  const card = isComplete ? null : session.queue[session.currentIndex];

  // All hooks MUST be above any early return
  const prevCardId = useRef<string | null>(null);
  useEffect(() => {
    if (card && card.id !== prevCardId.current) {
      prevCardId.current = card.id;
      if (autoPlayAudio) {
        playCardAudio(card.audio, card.target, session.language, audioSpeed, googleTtsApiKey);
      }
    }
  }, [card, session.language, autoPlayAudio, audioSpeed, googleTtsApiKey]);

  // Keyboard shortcuts: 1=Again, 2=Hard, 3=Good, 4=Easy, Space=flip
  // MUST be defined here (before any early return) to satisfy Rules of Hooks
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (!card) return;

      if (!isFlipped && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault();
        setIsFlipped(true);
        return;
      }

      if (isFlipped && !tileCardIds.has(card.id)) {
        const ratings = { '1': 'AGAIN', '2': 'HARD', '3': 'GOOD', '4': 'EASY' } as const;
        const rating = ratings[e.key as keyof typeof ratings];
        if (rating) {
          e.preventDefault();
          submitAnswer(rating);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [card, isFlipped, tileCardIds]);

  // Find a card-level etymology word: first word in the target sentence with
  // a verified etymology entry. Memoized on card+language so we don't rescan
  // on every render. MUST live above the `if (isComplete)` early return —
  // otherwise the hook is skipped on the completion screen and React crashes
  // with "Rendered fewer hooks than during the previous render."
  const cardEty = useMemo(
    () => (card?.target ? findCardEtymology(card.target, session.language) : null),
    [card?.target, session.language],
  );

  // Sync the Save button state when an overlay opens for a new card.
  // Both effects are no-ops on closed overlays, so they don't fire spuriously.
  useEffect(() => {
    if (showGrammar && card?.grammar) {
      setGrammarFavd(isGrammarFavorited(card.grammar, session.language));
    }
  }, [showGrammar, card?.grammar, session.language]);

  useEffect(() => {
    if (showEtymology && cardEty) {
      setEtyFavd(isEtymologyFavorited(cardEty.word, session.language));
    }
  }, [showEtymology, cardEty, session.language]);

  if (isComplete) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-2xl">
          &#x2713;
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-black text-[var(--text-primary)] mb-2">Session Complete!</h2>
          <p className="text-sm text-[var(--text-secondary)]">{session.finishedCount} cards reviewed</p>
        </div>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          {/* Challenge CTA — checkpoint or boss battle */}
          {pendingChallenge && onStartChallenge && (
            <button
              onClick={onStartChallenge}
              className={`px-8 py-4 rounded-xl w-full font-black uppercase tracking-wider text-sm transition-all active:scale-95 ${
                pendingChallenge === 'boss'
                  ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse-glow'
                  : 'bg-violet-500 text-white hover:bg-violet-600'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                {pendingChallenge === 'boss' ? <Swords size={16} /> : <Zap size={16} />}
                {pendingChallenge === 'boss' ? 'Boss Battle!' : 'Quick Challenge!'}
              </div>
            </button>
          )}
          {hasMoreCards && onStudyMore && (
            <div className="w-full p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
              <div className="text-xs font-bold uppercase tracking-wide text-[var(--text-secondary)] mb-2 text-center">
                Add more cards
              </div>
              <div className="flex items-stretch gap-2 mb-2">
                <button
                  onClick={() => setStudyMoreCount(c => Math.max(1, c - 5))}
                  className="w-12 rounded-xl border-2 border-[var(--border-color)] text-[var(--text-muted)] font-bold hover:border-[var(--border-hover)] hover:text-[var(--text-primary)] active:scale-95 transition"
                  aria-label="Decrease by 5"
                >
                  −5
                </button>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={studyMoreCount}
                  onChange={e => {
                    const v = parseInt(e.target.value, 10);
                    if (!isNaN(v) && v >= 1 && v <= 100) setStudyMoreCount(v);
                  }}
                  className="flex-1 rounded-xl text-center text-2xl font-extrabold font-mono bg-[var(--bg-inset)] border-2 border-[var(--border-color)] text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none py-2"
                />
                <button
                  onClick={() => setStudyMoreCount(c => Math.min(100, c + 5))}
                  className="w-12 rounded-xl border-2 border-[var(--border-color)] text-[var(--text-muted)] font-bold hover:border-[var(--border-hover)] hover:text-[var(--text-primary)] active:scale-95 transition"
                  aria-label="Increase by 5"
                >
                  +5
                </button>
              </div>
              <button
                onClick={() => onStudyMore(studyMoreCount)}
                className="w-full py-3 rounded-xl btn-primary text-sm font-bold"
              >
                Start session
              </button>
            </div>
          )}
          <button
            onClick={onAbort}
            className={`px-8 py-3 rounded-xl w-full ${
              (hasMoreCards && onStudyMore) || pendingChallenge
                ? 'bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] font-bold hover:bg-[var(--bg-card-hover)] active:bg-[var(--bg-inset)] transition-colors'
                : 'btn-primary'
            }`}
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const sessionProgress = session.queue.length > 0
    ? (session.currentIndex / session.queue.length) * 100
    : 0;

  const remainingQueue = session.queue.slice(session.currentIndex);
  const countNew = remainingQueue.filter(c => c.mastery === 0).length;
  const countLearn = remainingQueue.filter(c => c.mastery === 1).length;
  const countReview = remainingQueue.filter(c => c.mastery === 2).length;

  const handleFlip = () => setIsFlipped(true);

  const handlePlayAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPlaying(true);
    playCardAudio(card!.audio, card!.target, session.language, audioSpeed, googleTtsApiKey).finally(() => setIsPlaying(false));
  };

  const handleSlowReplay = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPlaying(true);
    playCardAudio(card!.audio, card!.target, session.language, 0.6, googleTtsApiKey).finally(() => setIsPlaying(false));
  };

  const submitAnswer = (rating: 'AGAIN' | 'HARD' | 'GOOD' | 'EASY') => {
    stopAudio();
    setIsFlipped(false);
    setShowGrammar(false);
    setShowEtymology(false);
    onAnswer(rating);
  };

  // Explicit time units so "1m" can't be misread as "1 month".
  const getIntervalHint = (rating: string): string => {
    if (rating === 'AGAIN') return '1 min';
    if (rating === 'HARD') return '6 min';
    if (rating === 'GOOD') {
      if (card!.mastery === 0) return '10 min';
      if (card!.mastery === 1 && card!.step === 0) return '10 min';
      return '1 day';
    }
    return '4 days';
  };

  return (
    <>
      {/* Info modal */}
      {showInfo && (
        <div
          onClick={() => setShowInfo(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-[var(--overlay)] backdrop-blur-sm animate-fade-in"
        >
          <div className="stat-card p-6 text-sm leading-8 text-[var(--text-secondary)] w-full max-w-xs">
            <h3 className="font-black text-[var(--text-primary)] border-b border-[var(--border-color)] pb-3 mb-4 text-base">
              Grading Guide
            </h3>
            <p><span className="text-red-500 font-black">Again</span> &mdash; Didn't know it. Restart.</p>
            <p><span className="text-orange-500 font-black">Hard</span> &mdash; Struggled. Repeat soon.</p>
            <p><span className="text-emerald-500 font-black">Good</span> &mdash; Got it. Advance step.</p>
            <p><span className="text-[var(--accent)] font-black">Easy</span> &mdash; Too easy. Skip ahead.</p>
            <div className="mt-5 pt-3 border-t border-[var(--border-color)] text-center text-xs text-[var(--text-muted)] font-bold">
              Tap anywhere to close
            </div>
          </div>
        </div>
      )}

      <section className="flex flex-col pt-[max(0.25rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] px-4 text-center h-dvh">
        {/* Top bar */}
        <nav className="flex flex-col gap-1">
          <div className="flex justify-between items-center">
            <button onClick={onAbort} className="btn-ghost text-sm">&larr; Exit</button>

            <div className="flex items-center gap-5 stat-card py-2 px-5">
              <div className="text-center">
                <div className="text-lg font-black text-sky-400">{countNew}</div>
                <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">new</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-black text-rose-400">{countLearn}</div>
                <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">learn</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-black text-teal-400">{countReview}</div>
                <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">review</div>
              </div>
            </div>

            <div className="w-12" /> {/* Spacer to center the card counts */}
          </div>

          <div className="progress-rail mt-1">
            <div className="progress-fill bg-[var(--accent)]" style={{ width: `${sessionProgress}%` }} />
          </div>
        </nav>

        {/* Tile challenge or Flashcard */}
        {tileCardIds.has(card!.id) ? (
          <div className="study-card flex-1 min-h-0 flex flex-col my-1 overflow-hidden">
            <WordTileChallenge
              card={card!}
              siblingCards={topicCards}
              onComplete={(correct) => {
                stopAudio();
                onAnswer(correct ? 'GOOD' : 'AGAIN');
              }}
              autoPlayAudio={autoPlayAudio}
              audioSpeed={audioSpeed}
              googleTtsApiKey={googleTtsApiKey}
              language={session.language}
            />
          </div>
        ) : (
        <div
          onClick={!isFlipped ? handleFlip : undefined}
          className="study-card flex-1 min-h-0 flex flex-col cursor-pointer my-1 relative"
        >
          {/* Grammar overlay — centered modal with backdrop. Same layout
              pattern as the etymology overlay in WordPopover, just amber
              instead of violet so the two surfaces are visually parallel. */}
          {showGrammar && card!.grammar && (
            <div
              className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in cursor-pointer"
              onClick={(e) => { e.stopPropagation(); setShowGrammar(false); }}
            >
              <div
                className="bg-amber-50 dark:bg-[#1a1207] border border-amber-500/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Save toggle — saves the tip to Favorites under the 'grammar'
                    kind. The card target sits in `example` so the user can recall
                    which sentence the tip came from. */}
                <button
                  onClick={() => {
                    toggleGrammarFavorite(card!.grammar!, session.language, card!.target);
                    setGrammarFavd(prev => !prev);
                  }}
                  className={`absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 ${
                    grammarFavd
                      ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/50'
                      : 'bg-white/80 dark:bg-[#0a0604] text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:border-amber-500/60'
                  }`}
                >
                  <Star size={11} fill={grammarFavd ? 'currentColor' : 'none'} />
                  <span>{grammarFavd ? 'Saved' : 'Save'}</span>
                </button>
                <div className="flex items-center gap-1.5 mb-4 justify-center">
                  <BookOpen size={14} className="text-amber-500" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500">Grammar</span>
                </div>
                <p className="text-sm md:text-base text-slate-700 dark:text-amber-100 leading-relaxed text-center">
                  {card!.grammar}
                </p>
                <div
                  className="mt-4 text-center text-[9px] font-bold text-amber-500/60 uppercase tracking-wider cursor-pointer"
                  onClick={(e) => { e.stopPropagation(); setShowGrammar(false); }}
                >
                  Tap to close
                </div>
              </div>
            </div>
          )}

          {/* "Tough" badge — replaces the cryptic "Leech" jargon. Cards that
              fail 5+ times become flagged so the user knows to focus extra
              attention. The title attribute provides hover/tap clarification. */}
          {card!.isLeech && (
            <div className="flex justify-center pt-2 shrink-0">
              <div
                className="flex items-center gap-1 bg-orange-500/10 border border-orange-500/40 rounded-lg px-2 py-0.5"
                title="You've struggled with this one — take a moment to re-read it"
              >
                <AlertTriangle size={10} className="text-orange-500" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-orange-500">Tough one</span>
              </div>
            </div>
          )}

          {/* Top-of-card chips — Grammar always sits in the left slot,
              Etymology always in the right slot. We render an empty slot
              when one is missing so the present chip never drifts toward
              the center. Both open the same centered modal shape, just
              different colors (amber / violet). */}
          {(card!.grammar || cardEty) && (
            <div className="flex items-center justify-between gap-2 px-4 pt-2 shrink-0">
              <div className="flex-1 flex justify-start">
                {card!.grammar && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowGrammar(true); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-300 bg-amber-500/10 border border-amber-500/40 hover:bg-amber-500/15 transition-all active:scale-95"
                  >
                    <BookOpen size={12} />
                    <span>Grammar</span>
                  </button>
                )}
              </div>
              <div className="flex-1 flex justify-end">
                {cardEty && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowEtymology(true); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-300 bg-violet-500/10 border border-violet-500/40 hover:bg-violet-500/15 transition-all active:scale-95"
                  >
                    <BookText size={12} />
                    <span>Etymology</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Etymology overlay — same modal pattern as Grammar Tip, violet
              palette. The word being explained sits prominently above the
              origin so the user always knows what's being discussed. */}
          {showEtymology && cardEty && (
            <div
              className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in cursor-pointer"
              onClick={(e) => { e.stopPropagation(); setShowEtymology(false); }}
            >
              <div
                className="bg-violet-50 dark:bg-[#100a1a] border border-violet-500/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Save toggle — same shape as the Grammar overlay, violet
                    palette. Stores under the 'etymology' kind keyed by word so
                    it can't collide with vocab favorites for that same word. */}
                <button
                  onClick={() => {
                    toggleEtymologyFavorite(
                      cardEty.word,
                      session.language,
                      cardEty.entry.origin,
                      cardEty.entry.note,
                      cardEty.entry.cognates,
                      cardEty.entry.sources,
                      card!.target,
                    );
                    setEtyFavd(prev => !prev);
                  }}
                  className={`absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 ${
                    etyFavd
                      ? 'bg-violet-500/20 text-violet-700 dark:text-violet-300 border border-violet-500/50'
                      : 'bg-white/80 dark:bg-[#06030d] text-violet-600 dark:text-violet-400 border border-violet-500/30 hover:border-violet-500/60'
                  }`}
                >
                  <Star size={11} fill={etyFavd ? 'currentColor' : 'none'} />
                  <span>{etyFavd ? 'Saved' : 'Save'}</span>
                </button>
                <div className="flex items-center gap-1.5 mb-3 justify-center">
                  <BookText size={14} className="text-violet-500" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-violet-500">Etymology</span>
                </div>
                <div className="text-2xl font-black text-violet-700 dark:text-violet-200 mb-2 text-center tracking-tight">
                  {cardEty.word}
                </div>
                <div className="text-sm font-bold text-violet-600 dark:text-violet-300 mb-3 text-center">
                  {cardEty.entry.origin}
                </div>
                {cardEty.entry.cognates && cardEty.entry.cognates.length > 0 && (
                  <div className="text-xs text-slate-700 dark:text-violet-100 mb-3 text-center">
                    <span className="font-bold">Cognates: </span>
                    {cardEty.entry.cognates.join(', ')}
                  </div>
                )}
                <p className="text-sm text-slate-700 dark:text-violet-100 leading-relaxed text-center italic">
                  {cardEty.entry.note}
                </p>
                <div className="mt-4 text-center text-[9px] font-mono text-violet-500/60 uppercase tracking-wider">
                  Sources · {cardEty.entry.sources.join(' · ')}
                </div>
                <div
                  className="mt-2 text-center text-[9px] font-bold text-violet-500/60 uppercase tracking-wider cursor-pointer"
                  onClick={(e) => { e.stopPropagation(); setShowEtymology(false); }}
                >
                  Tap to close
                </div>
              </div>
            </div>
          )}

          {/* Card content — dynamic font size based on sentence length */}
          {(() => {
            const wordCount = card!.target.split(/\s+/).length;
            const sizeClass = wordCount <= 6
              ? 'text-2xl md:text-3xl'
              : wordCount <= 10
              ? 'text-xl md:text-2xl'
              : wordCount <= 14
              ? 'text-lg md:text-xl'
              : 'text-base md:text-lg';
            const engSizeClass = wordCount <= 10
              ? 'text-base md:text-lg'
              : 'text-sm md:text-base';
            return (
              <div
                className="flex-1 flex flex-col items-center justify-center px-3 sm:px-5 min-h-0 overflow-y-auto"
                onClickCapture={showFirstWowHint ? dismissFirstWowHint : undefined}
              >
                <WordPopover
                  sentence={card!.target}
                  language={session.language}
                  className={`${sizeClass} font-black tracking-tight text-[var(--text-primary)] leading-snug max-w-sm mx-auto`}
                />
                {/* First-session hint — shown once on the very first card
                    to reveal that any word is tappable for instant context.
                    Subtle: dashed border + soft animation. Dismisses on
                    any tap inside the card area. */}
                {showFirstWowHint && !isFlipped && (
                  <div className="mt-5 px-3 py-2 rounded-lg border border-dashed border-[var(--accent)]/50 bg-[var(--accent)]/5 text-[11px] font-semibold text-[var(--accent)] animate-fade-in text-center">
                    Try tapping any word for instant context
                  </div>
                )}
                {isFlipped ? (
                  <div className="mt-4 pt-4 border-t border-[var(--border-color)] w-full animate-fade-in">
                    <p className={`${engSizeClass} text-[var(--text-secondary)] font-bold italic leading-relaxed`}>
                      {card!.english}
                    </p>
                  </div>
                ) : (
                  <div className="mt-6 text-xs text-[var(--text-muted)] font-bold uppercase tracking-widest">
                    Tap to reveal
                  </div>
                )}
              </div>
            );
          })()}

          {/* Toolbar — bottom of card, audio actions only. Grammar Tip and
              Etymology moved to the top chip row so they're discoverable
              before flipping. */}
          <div className="flex items-center justify-center gap-2.5 px-4 py-2.5 shrink-0">
            {isFlipped && (
              <button
                onClick={handleSlowReplay}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border active:scale-95 ${
                  isPlaying
                    ? 'bg-[var(--accent)]/10 border-[var(--accent)]/40 text-[var(--accent)]'
                    : 'border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)]/40'
                }`}
              >
                Slow
              </button>
            )}
            <button
              onClick={handlePlayAudio}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border active:scale-95 ${
                isPlaying
                  ? 'bg-[var(--accent)]/10 border-[var(--accent)]/40 text-[var(--accent)] animate-pulse'
                  : 'border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)]/40'
              }`}
            >
              <Volume2 size={14} />
              <span>Listen</span>
            </button>
          </div>
        </div>
        )}

        {/* Grading buttons — hidden for tile cards (they self-grade) */}
        {isFlipped && !tileCardIds.has(card!.id) && (
          <div className="animate-slide-up pb-2 shrink-0">
            <div className="grid grid-cols-4 gap-2">
              {(['AGAIN', 'HARD', 'GOOD', 'EASY'] as const).map(rating => {
                const cfg = GRADE_CONFIG[rating];
                return (
                  <button
                    key={rating}
                    onClick={() => submitAnswer(rating)}
                    className={`py-5 rounded-xl bg-[var(--bg-card)] border ${cfg.border} ${cfg.bg} ${cfg.color} active:scale-95 transition-all`}
                  >
                    <div className="text-sm font-black uppercase">{rating}</div>
                    <div className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5">{getIntervalHint(rating)}</div>
                  </button>
                );
              })}
            </div>
            <div className="flex justify-center mt-2 gap-4">
              <button
                onClick={() => { setIsFlipped(false); setShowGrammar(false); }}
                className="py-2.5 px-5 text-sm font-bold text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
              >
                &larr; Back
              </button>
              <button
                onClick={() => setShowInfo(true)}
                className="py-2.5 px-4 text-sm font-bold text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
              >
                ?
              </button>
            </div>
          </div>
        )}

        {!isFlipped && !tileCardIds.has(card!.id) && (
          <div className="h-[60px] shrink-0 flex items-center justify-center">
            {onUndoAnswer && session.currentIndex > 0 && (
              <button
                onClick={() => { setShowGrammar(false); onUndoAnswer(); }}
                className="py-2.5 px-5 text-sm font-bold text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
              >
                &larr; Back
              </button>
            )}
          </div>
        )}
      </section>
    </>
  );
};

// Error boundary to prevent StudySession crashes from showing a blank screen
class StudySessionErrorBoundary extends React.Component<
  { children: React.ReactNode; onAbort: () => void },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode; onAbort: () => void }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('StudySession crashed:', error.message, info.componentStack);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 animate-fade-in p-6">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center">
            <AlertTriangle size={32} className="text-red-500" />
          </div>
          <div className="text-center max-w-sm">
            <h2 className="text-2xl font-black text-[var(--text-primary)] mb-2">Something went wrong</h2>
            <p className="text-sm text-[var(--text-secondary)] mb-2">The session encountered an error and had to stop.</p>
            <p className="text-xs text-[var(--text-secondary)] opacity-60 mb-4">{this.state.error?.message}</p>
          </div>
          <button
            onClick={() => { this.setState({ hasError: false, error: null }); this.props.onAbort(); }}
            className="px-8 py-4 btn-primary rounded-xl font-black uppercase tracking-wider text-sm"
          >
            Back to Home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const SafeStudySession: React.FC<StudySessionProps> = (props) => (
  <StudySessionErrorBoundary onAbort={props.onAbort}>
    <StudySession {...props} />
  </StudySessionErrorBoundary>
);

export default SafeStudySession;
