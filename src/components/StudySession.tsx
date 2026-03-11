import React, { useState, useEffect, useRef } from 'react';
import { QuestCard, SessionState, Language, ChallengeMode } from '../types';
import { Volume2, BookOpen, AlertTriangle, Swords, Zap } from 'lucide-react';
import { playCardAudio, stopAudio } from '../services/audioService';
import type { AudioSpeed } from '../services/storageService';
import WordPopover from './WordPopover';
import WordTileChallenge from './WordTileChallenge';

interface StudySessionProps {
  session: SessionState;
  onAnswer: (rating: 'AGAIN' | 'HARD' | 'GOOD' | 'EASY') => void;
  onUndoAnswer?: () => void;
  onAbort: () => void;
  onStudyMore?: () => void;
  hasMoreCards?: boolean;
  topicCards: QuestCard[];
  autoPlayAudio: boolean;
  audioSpeed: AudioSpeed;
  googleTtsApiKey?: string;
  tileCardIndices?: number[];
  pendingChallenge?: ChallengeMode | null;
  onStartChallenge?: () => void;
}

const GRADE_CONFIG = {
  AGAIN: { color: 'text-red-500', bg: 'hover:bg-red-500/10 active:bg-red-500/20', border: 'border-red-500/30' },
  HARD:  { color: 'text-orange-500', bg: 'hover:bg-orange-500/10 active:bg-orange-500/20', border: 'border-orange-500/30' },
  GOOD:  { color: 'text-emerald-500', bg: 'hover:bg-emerald-500/10 active:bg-emerald-500/20', border: 'border-emerald-500/30' },
  EASY:  { color: 'text-[var(--accent)]', bg: 'hover:bg-[var(--accent)]/10 active:bg-[var(--accent)]/20', border: 'border-[var(--accent)]/30' },
} as const;

const StudySession: React.FC<StudySessionProps> = ({ session, onAnswer, onUndoAnswer, onAbort, onStudyMore, hasMoreCards, topicCards = [], autoPlayAudio, audioSpeed, googleTtsApiKey, tileCardIndices = [], pendingChallenge, onStartChallenge }) => {
  const [showInfo, setShowInfo] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showGrammar, setShowGrammar] = useState(false);

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
            <button onClick={onStudyMore} className="px-8 py-3 btn-primary rounded-xl w-full">
              Study More Cards
            </button>
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

  const masteredCount = topicCards.filter(c => c.mastery === 2).length;
  const topicProgress = topicCards.length > 0 ? (masteredCount / topicCards.length) * 100 : 0;

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
    onAnswer(rating);
  };

  const getIntervalHint = (rating: string): string => {
    if (rating === 'AGAIN') return '1m';
    if (rating === 'HARD') return '6m';
    if (rating === 'GOOD') {
      if (card!.mastery === 0) return '10m';
      if (card!.mastery === 1 && card!.step === 0) return '10m';
      return '1d';
    }
    return '4d';
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

      <section className="flex flex-col pt-[max(0.25rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] px-1 text-center h-dvh">
        {/* Top bar */}
        <nav className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <button onClick={onAbort} className="btn-ghost text-xs">&larr; Exit</button>

            <div className="flex items-center gap-5 stat-card py-2 px-5">
              <div className="text-center">
                <div className="text-base font-black text-sky-400">{countNew}</div>
                <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">new</div>
              </div>
              <div className="text-center">
                <div className="text-base font-black text-rose-400">{countLearn}</div>
                <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">learn</div>
              </div>
              <div className="text-center">
                <div className="text-base font-black text-teal-400">{countReview}</div>
                <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">review</div>
              </div>
            </div>

            <button
              onClick={() => setShowInfo(true)}
              className="w-8 h-8 rounded-lg border border-[var(--border-color)] text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:border-[var(--border-hover)] transition-colors"
            >
              ?
            </button>
          </div>

          <div className="progress-rail mt-1">
            <div className="progress-fill bg-[var(--accent)]" style={{ width: `${topicProgress}%` }} />
          </div>
        </nav>

        {/* Tile challenge or Flashcard */}
        {tileCardIndices.includes(session.currentIndex) ? (
          <div className="study-card flex-1 min-h-0 max-h-[52dvh] flex flex-col my-1.5 overflow-hidden">
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
          className="study-card flex-1 min-h-0 flex flex-col cursor-pointer my-1.5 relative"
        >
          {/* Grammar overlay — tap anywhere to dismiss */}
          {showGrammar && card!.grammar && (
            <div
              className="absolute inset-0 z-10 bg-amber-50/95 dark:bg-[#1a1207]/95 rounded-2xl flex flex-col items-center justify-center p-8 animate-fade-in cursor-pointer"
              onClick={(e) => { e.stopPropagation(); setShowGrammar(false); }}
            >
              <div className="flex items-center gap-1.5 mb-4">
                <BookOpen size={14} className="text-amber-500" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500">Grammar Tip</span>
              </div>
              <p className="text-sm md:text-base text-slate-700 dark:text-amber-100 leading-relaxed text-center max-w-xs">
                {card!.grammar}
              </p>
            </div>
          )}

          {/* Leech badge — top of card */}
          {card!.isLeech && (
            <div className="flex justify-center pt-2 shrink-0">
              <div className="flex items-center gap-1 bg-orange-500/10 border border-orange-500/40 rounded-lg px-1.5 py-0.5">
                <AlertTriangle size={10} className="text-orange-500" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-orange-500">Leech</span>
              </div>
            </div>
          )}

          {/* Card content — dynamic font size based on sentence length */}
          {(() => {
            const wordCount = card!.target.split(/\s+/).length;
            const sizeClass = wordCount <= 6
              ? 'text-xl md:text-2xl'
              : wordCount <= 10
              ? 'text-lg md:text-xl'
              : wordCount <= 14
              ? 'text-base md:text-lg'
              : 'text-sm md:text-base';
            const engSizeClass = wordCount <= 10
              ? 'text-sm md:text-base'
              : 'text-xs md:text-sm';
            return (
              <div className="flex-1 flex flex-col items-center justify-center px-3 sm:px-5 min-h-0 overflow-y-auto">
                <WordPopover
                  sentence={card!.target}
                  language={session.language}
                  className={`${sizeClass} font-black tracking-tight text-[var(--text-primary)] leading-snug max-w-sm mx-auto`}
                />
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

          {/* Toolbar — bottom of card, proper touch targets */}
          <div className="flex items-center justify-center gap-3 px-4 py-2.5 shrink-0">
            {isFlipped && card!.grammar && (
              <button
                onClick={(e) => { e.stopPropagation(); document.dispatchEvent(new MouseEvent('click', { bubbles: false })); setShowGrammar(!showGrammar); }}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all border active:scale-95 ${
                  showGrammar
                    ? 'bg-[var(--accent)]/10 border-[var(--accent)]/40 text-[var(--accent)]'
                    : 'border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)]/40'
                }`}
              >
                <BookOpen size={13} />
                <span>Grammar</span>
              </button>
            )}
            {isFlipped && (
              <button
                onClick={handleSlowReplay}
                className={`px-3.5 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all border active:scale-95 ${
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
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all border active:scale-95 ${
                isPlaying
                  ? 'bg-[var(--accent)]/10 border-[var(--accent)]/40 text-[var(--accent)] animate-pulse'
                  : 'border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)]/40'
              }`}
            >
              <Volume2 size={13} />
              <span>Listen</span>
            </button>
          </div>
        </div>
        )}

        {/* Grading buttons — hidden for tile cards (they self-grade) */}
        {isFlipped && !tileCardIndices.includes(session.currentIndex) && (
          <div className="animate-slide-up pb-2 shrink-0">
            <div className="grid grid-cols-4 gap-2">
              {(['AGAIN', 'HARD', 'GOOD', 'EASY'] as const).map(rating => {
                const cfg = GRADE_CONFIG[rating];
                return (
                  <button
                    key={rating}
                    onClick={() => submitAnswer(rating)}
                    className={`py-4 rounded-xl bg-[var(--bg-card)] border ${cfg.border} ${cfg.bg} ${cfg.color} active:scale-95 transition-all`}
                  >
                    <div className="text-xs font-black uppercase">{rating}</div>
                    <div className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5">{getIntervalHint(rating)}</div>
                  </button>
                );
              })}
            </div>
            <div className="flex justify-center mt-1.5">
              <button
                onClick={() => { setIsFlipped(false); setShowGrammar(false); }}
                className="py-2 px-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider hover:text-[var(--text-secondary)] transition-colors"
              >
                &larr; Back
              </button>
            </div>
          </div>
        )}

        {!isFlipped && !tileCardIndices.includes(session.currentIndex) && (
          <div className="h-[60px] shrink-0 flex items-center justify-center">
            {onUndoAnswer && session.currentIndex > 0 && (
              <button
                onClick={() => { setShowGrammar(false); onUndoAnswer(); }}
                className="py-2 px-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider hover:text-[var(--text-secondary)] transition-colors"
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

export default StudySession;
