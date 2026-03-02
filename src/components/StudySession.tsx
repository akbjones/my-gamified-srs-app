import React, { useState } from 'react';
import { QuestCard, SessionState } from '../types';
import { Volume2 } from 'lucide-react';
import { playCardAudio, stopAudio } from '../services/audioService';

interface StudySessionProps {
  session: SessionState;
  onAnswer: (rating: 'AGAIN' | 'HARD' | 'GOOD' | 'EASY') => void;
  onAbort: () => void;
  topicCards: QuestCard[];
}

const GRADE_CONFIG = {
  AGAIN: { color: 'text-red-400', bg: 'hover:bg-red-500/10 active:bg-red-500/20', border: 'border-red-500/20' },
  HARD:  { color: 'text-orange-400', bg: 'hover:bg-orange-500/10 active:bg-orange-500/20', border: 'border-orange-500/20' },
  GOOD:  { color: 'text-emerald-400', bg: 'hover:bg-emerald-500/10 active:bg-emerald-500/20', border: 'border-emerald-500/20' },
  EASY:  { color: 'text-blue-400', bg: 'hover:bg-blue-500/10 active:bg-blue-500/20', border: 'border-blue-500/20' },
} as const;

const StudySession: React.FC<StudySessionProps> = ({ session, onAnswer, onAbort, topicCards = [] }) => {
  const [showInfo, setShowInfo] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  if (session.currentIndex >= session.queue.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-2xl">
          ✓
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-black text-slate-100 mb-2">Session Complete</h2>
          <p className="text-sm text-slate-500">{session.finishedCount} cards reviewed</p>
        </div>
        <button onClick={onAbort} className="px-8 py-3 btn-primary rounded-xl">
          Continue
        </button>
      </div>
    );
  }

  const card = session.queue[session.currentIndex];

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
    playCardAudio(card.audio, card.target).finally(() => setIsPlaying(false));
  };

  const submitAnswer = (rating: 'AGAIN' | 'HARD' | 'GOOD' | 'EASY') => {
    stopAudio();
    setIsFlipped(false);
    onAnswer(rating);
  };

  const getIntervalHint = (rating: string): string => {
    if (rating === 'AGAIN') return '1m';
    if (rating === 'HARD') return '6m';
    if (rating === 'GOOD') {
      if (card.mastery === 0) return '10m';
      if (card.mastery === 1 && card.step === 0) return '10m';
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
          className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-slate-900/90 backdrop-blur-sm animate-fade-in"
        >
          <div className="stat-card p-6 text-sm leading-8 text-slate-300 w-full max-w-xs">
            <h3 className="font-black text-slate-100 border-b border-slate-700 pb-3 mb-4 text-base">
              Grading Guide
            </h3>
            <p><span className="text-red-400 font-black">Again</span> — Didn't know it. Restart.</p>
            <p><span className="text-orange-400 font-black">Hard</span> — Struggled. Repeat soon.</p>
            <p><span className="text-emerald-400 font-black">Good</span> — Got it. Advance step.</p>
            <p><span className="text-blue-400 font-black">Easy</span> — Too easy. Skip ahead.</p>
            <div className="mt-5 pt-3 border-t border-slate-700 text-center text-xs text-slate-500 font-bold">
              Tap anywhere to close
            </div>
          </div>
        </div>
      )}

      <section className="flex flex-col justify-between py-2 text-center h-[calc(100vh-2rem)]">
        {/* Top bar */}
        <nav className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <button onClick={onAbort} className="btn-ghost text-[10px]">← Exit</button>

            <div className="flex items-center gap-4 stat-card py-1.5 px-4">
              <div className="text-center">
                <div className="text-sm font-black text-slate-300">{countNew}</div>
                <div className="text-[7px] font-bold text-slate-500 uppercase tracking-wider">new</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-black text-slate-300">{countLearn}</div>
                <div className="text-[7px] font-bold text-slate-500 uppercase tracking-wider">learn</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-black text-slate-300">{countReview}</div>
                <div className="text-[7px] font-bold text-slate-500 uppercase tracking-wider">review</div>
              </div>
            </div>

            <button
              onClick={() => setShowInfo(true)}
              className="w-7 h-7 rounded-lg border border-slate-700 text-[10px] font-bold text-slate-500 hover:text-slate-300 hover:border-slate-500 transition-colors"
            >
              ?
            </button>
          </div>

          <div>
            <div className="flex justify-between text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1 px-0.5">
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
          className="study-card flex-1 min-h-[250px] flex flex-col items-center justify-center p-6 cursor-pointer my-4 relative"
        >
          <button
            onClick={handlePlayAudio}
            className={`absolute top-4 right-4 p-2 rounded-lg border transition-all z-20 ${
              isPlaying
                ? 'bg-blue-500/20 border-blue-500/50 text-blue-400 animate-pulse'
                : 'border-slate-700 text-slate-500 hover:text-blue-400 hover:border-blue-500/50 bg-slate-800/50'
            }`}
          >
            <Volume2 size={18} />
          </button>

          <p className="text-xl md:text-2xl font-black tracking-tight text-slate-100 leading-tight max-w-sm mx-auto">
            {card.target}
          </p>

          {isFlipped ? (
            <div className="mt-8 pt-8 border-t border-slate-700/50 w-full animate-fade-in">
              <p className="text-base md:text-lg text-slate-400 font-bold italic leading-tight">
                {card.english}
              </p>
            </div>
          ) : (
            <div className="mt-8 text-[10px] text-slate-600 font-bold uppercase tracking-widest">
              Tap to reveal
            </div>
          )}
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
                  className={`py-3.5 rounded-xl bg-slate-800/80 border ${cfg.border} ${cfg.bg} ${cfg.color} active:scale-95 transition-all`}
                >
                  <div className="text-[10px] font-black uppercase">{rating}</div>
                  <div className="text-[8px] text-slate-500 font-mono mt-0.5">{getIntervalHint(rating)}</div>
                </button>
              );
            })}
          </div>
        )}

        {!isFlipped && <div className="h-[56px]" />}
      </section>
    </>
  );
};

export default StudySession;
