import React, { useState, useEffect, useRef } from 'react';
import { QuestCard, SessionState } from '../types';
import { Volume2, BookOpen, AlertTriangle } from 'lucide-react';
import { playCardAudio, stopAudio } from '../services/audioService';
import type { AudioSpeed } from '../services/storageService';
import WordPopover from './WordPopover';

interface StudySessionProps {
  session: SessionState;
  onAnswer: (rating: 'AGAIN' | 'HARD' | 'GOOD' | 'EASY') => void;
  onAbort: () => void;
  onStudyMore?: () => void;
  hasMoreCards?: boolean;
  topicCards: QuestCard[];
  autoPlayAudio: boolean;
  audioSpeed: AudioSpeed;
  googleTtsApiKey?: string;
}

const GRADE_CONFIG = {
  AGAIN: { color: 'text-red-500', bg: 'hover:bg-red-500/10 active:bg-red-500/20', border: 'border-red-500/30' },
  HARD:  { color: 'text-orange-500', bg: 'hover:bg-orange-500/10 active:bg-orange-500/20', border: 'border-orange-500/30' },
  GOOD:  { color: 'text-emerald-500', bg: 'hover:bg-emerald-500/10 active:bg-emerald-500/20', border: 'border-emerald-500/30' },
  EASY:  { color: 'text-blue-500', bg: 'hover:bg-blue-500/10 active:bg-blue-500/20', border: 'border-blue-500/30' },
} as const;

const StudySession: React.FC<StudySessionProps> = ({ session, onAnswer, onAbort, onStudyMore, hasMoreCards, topicCards = [], autoPlayAudio, audioSpeed, googleTtsApiKey }) => {
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
          {hasMoreCards && onStudyMore && (
            <button onClick={onStudyMore} className="px-8 py-3 btn-primary rounded-xl w-full">
              Study More Cards
            </button>
          )}
          <button
            onClick={onAbort}
            className={`px-8 py-3 rounded-xl w-full ${
              hasMoreCards && onStudyMore
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
            <p><span className="text-blue-500 font-black">Easy</span> &mdash; Too easy. Skip ahead.</p>
            <div className="mt-5 pt-3 border-t border-[var(--border-color)] text-center text-xs text-[var(--text-muted)] font-bold">
              Tap anywhere to close
            </div>
          </div>
        </div>
      )}

      <section className="flex flex-col justify-between py-2 text-center h-[calc(100dvh-0.5rem)]">
        {/* Top bar */}
        <nav className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <button onClick={onAbort} className="btn-ghost text-xs">&larr; Exit</button>

            <div className="flex items-center gap-5 stat-card py-2 px-5">
              <div className="text-center">
                <div className="text-base font-black text-blue-500">{countNew}</div>
                <div className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">new</div>
              </div>
              <div className="text-center">
                <div className="text-base font-black text-orange-500">{countLearn}</div>
                <div className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">learn</div>
              </div>
              <div className="text-center">
                <div className="text-base font-black text-emerald-500">{countReview}</div>
                <div className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">review</div>
              </div>
            </div>

            <button
              onClick={() => setShowInfo(true)}
              className="w-8 h-8 rounded-lg border border-[var(--border-color)] text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:border-[var(--border-hover)] transition-colors"
            >
              ?
            </button>
          </div>

          <div>
            <div className="flex justify-between text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1 px-0.5">
              <span>Progress</span>
              <span>{Math.round(topicProgress)}%</span>
            </div>
            <div className="progress-rail">
              <div className="progress-fill bg-blue-500" style={{ width: `${topicProgress}%` }} />
            </div>
          </div>
        </nav>

        {/* Flashcard */}
        <div
          onClick={!isFlipped ? handleFlip : undefined}
          className="study-card flex-1 min-h-0 flex flex-col cursor-pointer my-2 relative"
        >
          {/* Toolbar — audio + grammar icons */}
          <div className="flex items-center justify-end gap-1.5 px-3 pt-2 pb-1 shrink-0">
            {isFlipped && card!.grammar && (
              <button
                onClick={(e) => { e.stopPropagation(); document.dispatchEvent(new MouseEvent('click', { bubbles: false })); setShowGrammar(!showGrammar); }}
                className={`p-1.5 rounded-lg border transition-all mr-auto ${
                  showGrammar
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-500'
                    : 'border-[var(--border-color)] text-[var(--text-muted)] hover:text-amber-500 hover:border-amber-500/40 bg-[var(--bg-card)]'
                }`}
              >
                <BookOpen size={14} />
              </button>
            )}
            {card!.isLeech && (
              <div className="flex items-center gap-1 bg-orange-500/10 border border-orange-500/40 rounded-lg px-1.5 py-0.5 mr-auto">
                <AlertTriangle size={10} className="text-orange-500" />
                <span className="text-[8px] font-bold uppercase tracking-wider text-orange-500">Leech</span>
              </div>
            )}
            {isFlipped && (
              <button
                onClick={handleSlowReplay}
                className={`p-1 rounded-lg border transition-all ${
                  isPlaying
                    ? 'bg-blue-500/10 border-blue-500/40 text-blue-500'
                    : 'border-[var(--border-color)] text-[var(--text-muted)] hover:text-blue-500 hover:border-blue-500/40 bg-[var(--bg-card)]'
                }`}
                title="Slow replay"
              >
                <span className="text-[8px] font-bold font-mono w-[14px] h-[14px] flex items-center justify-center">.6x</span>
              </button>
            )}
            <button
              onClick={handlePlayAudio}
              className={`p-1 rounded-lg border transition-all ${
                isPlaying
                  ? 'bg-blue-500/10 border-blue-500/40 text-blue-500 animate-pulse'
                  : 'border-[var(--border-color)] text-[var(--text-muted)] hover:text-blue-500 hover:border-blue-500/40 bg-[var(--bg-card)]'
              }`}
            >
              <Volume2 size={14} />
            </button>
          </div>

          {/* Grammar overlay — tap anywhere to dismiss */}
          {showGrammar && card!.grammar && (
            <div
              className="absolute inset-0 z-10 bg-amber-50/95 dark:bg-amber-900/30 rounded-2xl flex flex-col items-center justify-center p-8 animate-fade-in cursor-pointer"
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
              <div className="flex-1 flex flex-col items-center justify-center px-5 pb-4 min-h-0">
                <WordPopover
                  sentence={card!.target}
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
        </div>

        {/* Grading buttons */}
        {isFlipped && (
          <div className="grid grid-cols-4 gap-2 animate-slide-up pb-2">
            {(['AGAIN', 'HARD', 'GOOD', 'EASY'] as const).map(rating => {
              const cfg = GRADE_CONFIG[rating];
              return (
                <button
                  key={rating}
                  onClick={() => submitAnswer(rating)}
                  className={`py-4 rounded-xl bg-[var(--bg-card)] border ${cfg.border} ${cfg.bg} ${cfg.color} active:scale-95 transition-all`}
                >
                  <div className="text-xs font-black uppercase">{rating}</div>
                  <div className="text-[9px] text-[var(--text-muted)] font-mono mt-0.5">{getIntervalHint(rating)}</div>
                </button>
              );
            })}
          </div>
        )}

        {!isFlipped && <div className="h-[60px]" />}
      </section>
    </>
  );
};

export default StudySession;
