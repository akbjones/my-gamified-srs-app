import React, { useState, useMemo } from 'react';
import { ChallengeMode, ChallengeQuestion, BossRing, Language } from '../types';
import { Zap } from 'lucide-react';
import { getBossForIndex } from '../data/bossArt';
import { calculateBossRing } from '../services/challengeService';
import WordTileChallenge from './WordTileChallenge';
import type { AudioSpeed } from '../services/storageService';

interface ChallengeScreenProps {
  mode: ChallengeMode;
  questions: ChallengeQuestion[];
  bossIndex?: number;
  onComplete: (results: boolean[], elapsedMs: number) => void;
  onAbort: () => void;
  language: Language;
  autoPlayAudio: boolean;
  audioSpeed: AudioSpeed;
  googleTtsApiKey?: string;
}

type Phase = 'intro' | 'fighting' | 'results';

const RING_COLORS: Record<BossRing, string> = {
  none: 'text-[var(--text-faint)]',
  bronze: 'text-amber-600',
  silver: 'text-slate-400',
  gold: 'text-yellow-400',
};

const RING_LABELS: Record<BossRing, string> = {
  none: 'Defeated...',
  bronze: 'Bronze Ring',
  silver: 'Silver Ring',
  gold: 'Gold Ring',
};

// ── Simple test tube SVG ──────────────────────────────────────
const TestTube: React.FC<{ color: string; size?: number; className?: string }> = ({
  color,
  size = 100,
  className = '',
}) => (
  <svg
    viewBox="0 0 80 160"
    width={size * 0.5}
    height={size}
    className={`drop-shadow-lg ${className}`}
    style={{ color: 'var(--text-muted)' }}
  >
    {/* Liquid fill */}
    <path
      d="M27 60 L27 110 Q27 138 40 138 Q53 138 53 110 L53 60"
      fill={color}
      opacity="0.65"
    />
    {/* Bubbles */}
    <circle cx="35" cy="90" r="3" fill="white" opacity="0.4" />
    <circle cx="45" cy="105" r="2" fill="white" opacity="0.3" />
    <circle cx="37" cy="118" r="2.5" fill="white" opacity="0.35" />
    {/* Tube outline */}
    <path
      d="M25 12 L25 110 Q25 140 40 140 Q55 140 55 110 L55 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    {/* Rim */}
    <line
      x1="20" y1="12" x2="60" y2="12"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
    />
  </svg>
);

const ChallengeScreen: React.FC<ChallengeScreenProps> = ({
  mode,
  questions,
  bossIndex = 0,
  onComplete,
  onAbort,
  language,
  autoPlayAudio,
  audioSpeed,
  googleTtsApiKey,
}) => {
  const [phase, setPhase] = useState<Phase>('intro');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [startTime, setStartTime] = useState(0);
  const [finalElapsedMs, setFinalElapsedMs] = useState(0);

  const boss = useMemo(() => getBossForIndex(bossIndex, language), [bossIndex, language]);
  const totalQuestions = questions.length;
  const correctCount = answers.filter(Boolean).length;
  // Use frozen time on results screen so ring doesn't change between renders
  const elapsedMs = phase === 'results' ? finalElapsedMs : (startTime > 0 ? Date.now() - startTime : 0);
  const ring = mode === 'boss' ? calculateBossRing(correctCount, totalQuestions, elapsedMs) : 'none' as BossRing;
  const bossDefeated = mode === 'boss' ? correctCount >= 6 : true;
  const bossHealth = Math.max(0, ((totalQuestions - correctCount) / totalQuestions) * 100);

  const handleStart = () => {
    setPhase('fighting');
    setStartTime(Date.now());
  };

  const handleQuestionComplete = (correct: boolean) => {
    const newAnswers = [...answers, correct];
    setAnswers(newAnswers);

    if (newAnswers.length >= totalQuestions) {
      // All questions done — freeze elapsed time before transitioning
      setFinalElapsedMs(Date.now() - startTime);
      setTimeout(() => setPhase('results'), 500);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleFinish = () => {
    onComplete(answers, finalElapsedMs || Date.now() - startTime);
  };

  // ── Intro Phase ──────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div className="flex flex-col items-center justify-center h-dvh px-6 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] animate-fade-in">
        {mode === 'boss' ? (
          <>
            <div className="text-[10px] font-bold uppercase tracking-widest text-red-500 mb-3">
              Boss Battle
            </div>
            <TestTube color={boss.color} size={110} className="mb-3 animate-boss-appear" />
            <h2 className="text-xl font-black text-[var(--text-primary)] mb-0.5">{boss.name}</h2>
            <p className="text-sm text-[var(--text-muted)] italic mb-4">{boss.translation}</p>
            <p className="text-xs text-[var(--text-secondary)] mb-6 text-center leading-relaxed">
              Arrange {totalQuestions} sentences correctly.
              <br />6+ to win &middot; Perfect = silver &middot; Perfect under 90s = gold
            </p>
          </>
        ) : (
          <>
            <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center mb-3">
              <Zap size={24} className="text-violet-500" />
            </div>
            <h2 className="text-xl font-black text-[var(--text-primary)] mb-1">Quick Challenge!</h2>
            <p className="text-sm text-[var(--text-secondary)] mb-6 text-center">
              {totalQuestions} rapid-fire word puzzles from your recent cards.
            </p>
          </>
        )}
        <button
          onClick={handleStart}
          className={`px-10 py-3.5 rounded-xl font-black uppercase tracking-wider text-sm transition-all active:scale-95 ${
            mode === 'boss'
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-violet-500 text-white hover:bg-violet-600'
          }`}
        >
          {mode === 'boss' ? 'Fight!' : 'Start'}
        </button>
        <button
          onClick={onAbort}
          className="mt-3 text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors font-bold"
        >
          Skip for now
        </button>
      </div>
    );
  }

  // ── Fighting Phase ───────────────────────────────────────
  if (phase === 'fighting') {
    const currentQ = questions[currentIndex];
    return (
      <section className="flex flex-col h-dvh pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.25rem,env(safe-area-inset-bottom))]">
        {/* Top bar: progress + boss health */}
        <div className="px-4 pb-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
              {currentIndex + 1} / {totalQuestions}
            </span>
            {mode === 'boss' && (
              <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">
                {boss.name}
              </span>
            )}
          </div>
          {/* Progress bar */}
          <div className="progress-rail">
            <div
              className={`progress-fill ${mode === 'boss' ? 'bg-red-500' : 'bg-violet-500'}`}
              style={{ width: `${((currentIndex) / totalQuestions) * 100}%` }}
            />
          </div>
          {/* Boss health bar */}
          {mode === 'boss' && (
            <div className="mt-2">
              <div className="h-3 rounded-full bg-[var(--progress-bg)] overflow-hidden">
                <div
                  className="h-full bg-red-500 rounded-full transition-all duration-500"
                  style={{ width: `${bossHealth}%` }}
                />
              </div>
              <div className="flex justify-between mt-0.5">
                <span className="text-[9px] font-bold text-red-500/60 uppercase">Boss HP</span>
                <span className="text-[9px] font-mono font-bold text-[var(--text-muted)]">
                  {totalQuestions - correctCount}/{totalQuestions}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Current question (tile challenge) */}
        <div className="flex-1 min-h-0 study-card mx-2 my-1.5 overflow-hidden">
          <WordTileChallenge
            key={currentQ.card.id + '-' + currentIndex}
            card={currentQ.card}
            siblingCards={questions.map(q => q.card)}
            onComplete={handleQuestionComplete}
            autoPlayAudio={autoPlayAudio}
            audioSpeed={audioSpeed}
            googleTtsApiKey={googleTtsApiKey}
            language={language}
          />
        </div>
      </section>
    );
  }

  // ── Results Phase ────────────────────────────────────────
  return (
    <div className="flex flex-col items-center justify-center h-dvh px-6 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] animate-fade-in">
      {mode === 'boss' ? (
        <>
          {bossDefeated ? (
            <>
              <div className="text-4xl mb-3 animate-ring-reveal">
                {ring === 'gold' ? '👑' : ring === 'silver' ? '🥈' : ring === 'bronze' ? '🥉' : '💀'}
              </div>
              <TestTube color={boss.color} size={70} className="mb-3 opacity-60" />
              <h2 className="text-xl font-black text-[var(--text-primary)] mb-0.5">
                {boss.name} Defeated!
              </h2>
              <p className={`text-sm font-bold mb-0.5 ${RING_COLORS[ring]}`}>
                {RING_LABELS[ring]}
              </p>
              <p className="text-xs text-[var(--text-muted)] mb-5">
                {correctCount}/{totalQuestions} correct &middot; {Math.round(elapsedMs / 1000)}s
              </p>
            </>
          ) : (
            <>
              <div className="text-4xl mb-3">💀</div>
              <TestTube color={boss.color} size={70} className="mb-3 opacity-40 grayscale" />
              <h2 className="text-xl font-black text-[var(--text-primary)] mb-0.5">
                {boss.name} Wins...
              </h2>
              <p className="text-sm text-[var(--text-muted)] mb-1">
                {correctCount}/{totalQuestions} correct. Need 6 to win.
              </p>
              <p className="text-xs text-[var(--text-secondary)] mb-5">
                Keep studying and try again!
              </p>
            </>
          )}
        </>
      ) : (
        <>
          <div className="text-4xl mb-3">
            {correctCount === totalQuestions ? '⚡' : correctCount >= 3 ? '✨' : '💪'}
          </div>
          <h2 className="text-xl font-black text-[var(--text-primary)] mb-0.5">
            Challenge Complete!
          </h2>
          <p className="text-sm text-[var(--text-muted)] mb-5">
            {correctCount}/{totalQuestions} correct
          </p>
        </>
      )}

      {/* Answer summary dots */}
      <div className="flex gap-2 mb-6">
        {answers.map((correct, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full ${
              correct ? 'bg-emerald-500' : 'bg-red-500'
            }`}
          />
        ))}
      </div>

      <button
        onClick={handleFinish}
        className="px-10 py-3.5 btn-primary rounded-xl"
      >
        Continue
      </button>
    </div>
  );
};

export default ChallengeScreen;
