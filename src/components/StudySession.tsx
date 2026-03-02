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
  AGAIN: { color: 'text-red-500', bg: 'hover:bg-red-50 active:bg-red-100', border: 'border-red-200' },
  HARD:  { color: 'text-orange-500', bg: 'hover:bg-orange-50 active:bg-orange-100', border: 'border-orange-200' },
  GOOD:  { color: 'text-emerald-600', bg: 'hover:bg-emerald-50 active:bg-emerald-100', border: 'border-emerald-200' },
  EASY:  { color: 'text-blue-500', bg: 'hover:bg-blue-50 active:bg-blue-100', border: 'border-blue-200' },
} as const;

const StudySession: React.FC<StudySessionProps> = ({ session, onAnswer, onAbort, topicCards = [] }) => {
  const [showInfo, setShowInfo] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  if (session.currentIndex >= session.queue.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-2xl">
          ✓
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-black text-slate-800 mb-2">Session Complete</h2>
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
          className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/40 backdrop-blur-sm animate-fade-in"
        >
          <div className="stat-card p-6 text-sm leading-8 text-slate-600 w-full max-w-xs">
            <h3 className="font-black text-slate-800 border-b border-slate-200 pb-3 mb-4 text-base">
              Grading Guide
            </h3>
            <p><span className="text-red-500 font-black">Again</span> — Didn't know it. Restart.</p>
            <p><span className="text-orange-500 font-black">Hard</span> — Struggled. Repeat soon.</p>
            <p><span className="text-emerald-600 font-black">Good</span> — Got it. Advance step.</p>
            <p><span className="text-blue-500 font-black">Easy</span> — Too easy. Skip ahead.</p>
            <div className="mt-5 pt-3 border-t border-slate-200 text-center text-xs text-slate-400 font-bold">
              Tap anywhere to close
            </div>
          </div>
        </div>
      )}

      <section className="flex flex-col justify-between py-2 text-center h-[calc(100vh-2rem)]">
        {/* Top bar */}
        <nav className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <button onClick={onAbort} className="btn-ghost text-xs">← Exit</button>

            <div className="flex items-center gap-5 stat-card py-2 px-5">
              <div className="text-center">
                <div className="text-base font-black text-blue-500">{countNew}</div>
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">new</div>
              </div>
              <div className="text-center">
                <div className="text-base font-black text-orange-500">{countLearn}</div>
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">learn</div>
              </div>
              <div className="text-center">
                <div className="text-base font-black text-emerald-500">{countReview}</div>
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">review</div>
              </div>
            </div>

            <button
              onClick={() => setShowInfo(true)}
              className="w-8 h-8 rounded-lg border border-slate-200 text-xs font-bold text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-colors"
            >
              ?
            </button>
          </div>

          <div>
            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 px-0.5">
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
                ? 'bg-blue-50 border-blue-300 text-blue-500 animate-pulse'
                : 'border-slate-200 text-slate-400 hover:text-blue-500 hover:border-blue-300 bg-white'
            }`}
          >
            <Volume2 size={18} />
          </button>

          <p className="text-xl md:text-2xl font-black tracking-tight text-slate-800 leading-tight max-w-sm mx-auto">
            {card.target}
          </p>

          {isFlipped ? (
            <div className="mt-8 pt-8 border-t border-slate-200 w-full animate-fade-in">
              <p className="text-base md:text-lg text-slate-500 font-bold italic leading-tight">
                {card.english}
              </p>
            </div>
          ) : (
            <div className="mt-8 text-xs text-slate-400 font-bold uppercase tracking-widest">
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
                  className={`py-4 rounded-xl bg-white border ${cfg.border} ${cfg.bg} ${cfg.color} active:scale-95 transition-all`}
                >
                  <div className="text-xs font-black uppercase">{rating}</div>
                  <div className="text-[9px] text-slate-400 font-mono mt-0.5">{getIntervalHint(rating)}</div>
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
