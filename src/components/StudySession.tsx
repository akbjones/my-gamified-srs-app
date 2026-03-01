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

const StudySession: React.FC<StudySessionProps> = ({ session, onAnswer, onAbort, topicCards = [] }) => {
  const [showInfo, setShowInfo] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  if (session.currentIndex >= session.queue.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-6 animate-fade-in">
        <div className="text-4xl">✅</div>
        <h2 className="text-2xl font-black text-slate-100 uppercase">Session Complete</h2>
        <button
          onClick={onAbort}
          className="px-8 py-3 bg-slate-100 text-slate-900 font-bold"
        >
          Return
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
    return '4d'; // EASY
  };

  return (
    <>
      {showInfo && (
        <div
          onClick={() => setShowInfo(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-slate-900/90 backdrop-blur-sm animate-fade-in"
        >
          <div className="bg-slate-800 p-8 border-2 border-slate-600 text-sm leading-8 text-slate-300 w-full max-w-xs">
            <h3 className="font-extrabold text-slate-100 border-b-2 border-slate-600 pb-4 mb-4 uppercase text-lg">
              Logic Protocol
            </h3>
            <p><span className="text-red-500 font-black">[1] AGAIN</span><br />Fail step. Restart learn.</p>
            <p><span className="text-orange-500 font-black">[2] HARD</span><br />Repeat step. No advance.</p>
            <p><span className="text-emerald-500 font-black">[3] GOOD</span><br />Advance step (1m→10m→Grad).</p>
            <p><span className="text-blue-500 font-black">[4] EASY</span><br />Instant graduation (4d).</p>
            <div className="mt-6 pt-4 border-t-2 border-slate-700 text-center font-bold uppercase tracking-widest text-slate-500">
              Tap to close
            </div>
          </div>
        </div>
      )}

      <section className="flex-grow flex flex-col justify-between py-2 text-center h-[calc(100vh-2rem)]">
        <nav className="flex flex-col gap-2 px-1">
          <div className="flex justify-between items-center">
            <button
              onClick={onAbort}
              className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-300"
            >
              [ Abort ]
            </button>
            <div className="flex items-center gap-3 bg-slate-800 px-3 py-1 border border-slate-700">
              <span className="text-blue-500 font-black text-xs">{countNew}</span>
              <span className="text-red-500 font-black text-xs">{countLearn}</span>
              <span className="text-emerald-500 font-black text-xs">{countReview}</span>
            </div>
            <button
              onClick={() => setShowInfo(true)}
              className="w-6 h-6 border border-slate-600 font-black text-[10px] text-slate-500 hover:text-slate-300"
            >
              ?
            </button>
          </div>

          <div className="w-full">
            <div className="flex justify-between text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 px-1">
              <span>Topic Mastery</span>
              <span>{Math.round(topicProgress)}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 overflow-hidden border border-slate-700">
              <div
                className="h-full bg-blue-500 transition-all duration-700"
                style={{ width: `${topicProgress}%` }}
              />
            </div>
          </div>
        </nav>

        <div
          onClick={!isFlipped ? handleFlip : undefined}
          className="glass-slab flex-1 min-h-[250px] flex flex-col items-center justify-center p-6 cursor-pointer border-2 border-slate-600 transition-all my-4 relative hover:border-slate-500"
          style={{ boxShadow: '0 6px 0 #0f172a' }}
        >
          <button
            onClick={handlePlayAudio}
            className={`absolute top-4 right-4 p-2 border-2 transition-all z-20
              ${isPlaying
                ? 'bg-blue-600 border-blue-600 text-white animate-pulse'
                : 'border-slate-600 text-slate-500 hover:text-blue-500 hover:border-blue-500 bg-slate-800'
              }`}
          >
            <Volume2 size={20} />
          </button>

          <p className="text-xl md:text-2xl font-black tracking-tight text-slate-100 leading-tight max-w-sm mx-auto">
            {card.target}
          </p>

          {isFlipped ? (
            <div className="mt-8 pt-8 border-t border-slate-700 w-full animate-fade-in">
              <p className="text-base md:text-lg text-slate-400 font-black italic leading-tight">
                {card.english}
              </p>
            </div>
          ) : (
            <div className="mt-8 text-[10px] text-slate-600 font-black uppercase tracking-[0.2em]">
              Tap to reveal
            </div>
          )}
        </div>

        {isFlipped && (
          <div className="grid grid-cols-4 gap-2 animate-slide-up pb-2">
            {(['AGAIN', 'HARD', 'GOOD', 'EASY'] as const).map(rating => {
              const colors: Record<string, string> = {
                AGAIN: 'text-red-500 hover:bg-red-500/10',
                HARD: 'text-orange-500 hover:bg-orange-500/10',
                GOOD: 'text-emerald-500 hover:bg-emerald-500/10',
                EASY: 'text-blue-500 hover:bg-blue-500/10',
              };
              return (
                <button
                  key={rating}
                  onClick={() => submitAnswer(rating)}
                  className={`py-4 bg-slate-800 border-2 border-slate-700 group active:translate-y-1 transition-all ${colors[rating]}`}
                >
                  <div className="text-[10px] font-black uppercase">{rating}</div>
                  <div className="text-[8px] text-slate-500 font-mono">{getIntervalHint(rating)}</div>
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
