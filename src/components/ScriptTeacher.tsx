import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Language, QuestCard, MasteryMap, SessionState, LANGUAGE_CONFIG } from '../types';
import type { ScriptPack, ScriptItem } from '../data/scripts/types';
import type { AudioSpeed } from '../services/storageService';
import {
  toScriptCard, saveScriptCardProgress, levelStats, isLevelUnlocked,
  nextLessonBatch, buildScriptQueue, selectDrill, scriptSummary,
  type Drill,
} from '../services/scriptSrsService';
import { handleAnswerLogic } from '../services/srsService';
import { playCardAudio, stopAudio } from '../services/audioService';
import { ChevronLeft, Volume2, Lock, BookOpen, RotateCcw, Check, Sparkles } from 'lucide-react';

interface ScriptTeacherProps {
  pack: ScriptPack;
  lang: Language;
  progress: MasteryMap;
  /** Fired with the fresh map after every persisted answer (already saved). */
  onProgressChange: (map: MasteryMap) => void;
  /** Fired once when a quiz/review session starts – App updates the streak
   *  (a study day is a study day) but NEVER cardsLearned/totalReviews. */
  onSessionStart: () => void;
  onExit: () => void;
  autoPlayAudio: boolean;
  audioSpeed: AudioSpeed;
  googleTtsApiKey?: string;
}

type Phase = 'map' | 'lesson' | 'lessonQuiz' | 'review' | 'summary';

/** Answer feedback shown between tap and advance. */
type Feedback = { correct: boolean; chosenId: string } | null;

/** Fast/slow boundary for the derived rating: correct under 6s → GOOD, over → HARD. */
const SLOW_MS = 6000;
/** Lesson batch size (5-8 per the design; 6 is the default). */
const BATCH_SIZE = 6;

const ScriptTeacher: React.FC<ScriptTeacherProps> = ({
  pack, lang, progress, onProgressChange, onSessionStart, onExit,
  autoPlayAudio, audioSpeed, googleTtsApiKey,
}) => {
  const [phase, setPhase] = useState<Phase>('map');
  const [lessonBatch, setLessonBatch] = useState<ScriptItem[]>([]);
  const [lessonIndex, setLessonIndex] = useState(0);
  const [queue, setQueue] = useState<QuestCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [drill, setDrill] = useState<Drill | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [revealWrong, setRevealWrong] = useState(false);
  const [answered, setAnswered] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [popoverItem, setPopoverItem] = useState<ScriptItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Freshest progress for drill building / persistence (state prop lags a render).
  const progressRef = useRef<MasteryMap>(progress);
  useEffect(() => { progressRef.current = progress; }, [progress]);
  const shownAtRef = useRef(0);
  const startSummaryRef = useRef(scriptSummary(pack, progress));
  const sessionStartedRef = useRef(false);
  // Queue/index updates held while the wrong-answer reveal is on screen.
  const pendingUpdatesRef = useRef<Partial<SessionState> | null>(null);

  // Proper font shaping for the target script (Devanagari conjuncts etc.).
  const bcp47 = pack.language ? LANGUAGE_CONFIG[pack.language].bcp47 : undefined;

  const byId = useMemo(() => new Map(pack.items.map(i => [i.id, i])), [pack]);
  const summary = useMemo(() => scriptSummary(pack, progress), [pack, progress]);
  const dueCount = summary.dueCount;
  const batchPreview = useMemo(() => nextLessonBatch(pack, progress, BATCH_SIZE), [pack, progress]);

  const currentCard = queue[currentIndex];
  const currentItem = currentCard ? byId.get(currentCard.id) : undefined;

  const play = useCallback((item: ScriptItem) => {
    if (isPlaying) return;
    setIsPlaying(true);
    playCardAudio(item.audio, item.glyph, lang, audioSpeed, googleTtsApiKey)
      .finally(() => setIsPlaying(false));
  }, [isPlaying, lang, audioSpeed, googleTtsApiKey]);

  // Build the drill whenever a new card comes up in quiz/review.
  useEffect(() => {
    if ((phase !== 'lessonQuiz' && phase !== 'review') || !currentItem) return;
    const d = selectDrill(currentItem, pack, progressRef.current);
    setDrill(d);
    setFeedback(null);
    setRevealWrong(false);
    shownAtRef.current = Date.now();
    // Audio-prompt drills NEED the sound (it IS the question) – play regardless
    // of the autoplay setting; there's a replay button either way.
    if (d.prompt === 'audio') play(d.item);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentIndex, currentCard?.id]);

  // Lesson screens: autoplay per the user's setting.
  useEffect(() => {
    if (phase !== 'lesson') return;
    const item = lessonBatch[lessonIndex];
    if (item && autoPlayAudio) play(item);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, lessonIndex]);

  useEffect(() => () => { stopAudio(); }, [phase, currentIndex, lessonIndex]);

  // ── session control ────────────────────────────────────────────────────────

  const beginSession = (cards: QuestCard[], next: Phase) => {
    if (cards.length === 0) return;
    if (!sessionStartedRef.current) { sessionStartedRef.current = true; onSessionStart(); }
    startSummaryRef.current = scriptSummary(pack, progressRef.current);
    setQueue(cards);
    setCurrentIndex(0);
    setAnswered(0);
    setCorrectCount(0);
    setPhase(next);
  };

  const startLesson = () => {
    const batch = nextLessonBatch(pack, progressRef.current, BATCH_SIZE);
    if (batch.length === 0) return;
    setLessonBatch(batch);
    setLessonIndex(0);
    setPhase('lesson');
  };

  const startLessonQuiz = () => {
    beginSession(lessonBatch.map(it => toScriptCard(it, progressRef.current[it.id])), 'lessonQuiz');
  };

  const startReview = () => {
    beginSession(buildScriptQueue(pack, progressRef.current), 'review');
  };

  const advance = (updates: Partial<SessionState>) => {
    const nextQueue = updates.queue ?? queue;
    const nextIndex = updates.currentIndex ?? currentIndex + 1;
    if (nextIndex >= nextQueue.length) {
      setPhase('summary');
    } else {
      setQueue(nextQueue);
      setCurrentIndex(nextIndex);
    }
  };

  /** Rate the current card through the real FSRS pipeline and move on. */
  const rate = (rating: 'AGAIN' | 'HARD' | 'GOOD') => {
    if (!currentCard) return;
    const session = { queue, currentIndex, newCardsSeen: 0 } as unknown as SessionState;
    const { sessionUpdates } = handleAnswerLogic(rating, currentCard, session, (card) => {
      const map = saveScriptCardProgress(card, lang);
      progressRef.current = map;
      onProgressChange(map);
    });
    return sessionUpdates;
  };

  const handleChoice = (chosen: ScriptItem) => {
    if (!drill || feedback) return;
    const correct = chosen.id === drill.item.id;
    const elapsed = Date.now() - shownAtRef.current;
    setFeedback({ correct, chosenId: chosen.id });
    setAnswered(n => n + 1);
    if (correct) {
      setCorrectCount(n => n + 1);
      const updates = rate(elapsed > SLOW_MS ? 'HARD' : 'GOOD');
      setTimeout(() => updates && advance(updates), 450);
    } else {
      // Wrong: rating applies now (AGAIN → reinserted a few cards out), the
      // reveal panel shows the answer + mnemonic until the learner continues.
      const updates = rate('AGAIN');
      setRevealWrong(true);
      pendingUpdatesRef.current = updates ?? null;
    }
  };

  const continueAfterWrong = () => {
    const updates = pendingUpdatesRef.current;
    pendingUpdatesRef.current = null;
    if (updates) advance(updates);
  };

  // ── composition drill (tap component tiles in order) ───────────────────────
  const [composed, setComposed] = useState<string[]>([]);
  useEffect(() => { setComposed([]); }, [drill]);

  const handleTile = (tile: ScriptItem) => {
    if (!drill || drill.kind !== 'composition' || feedback) return;
    const target = drill.item.components ?? [];
    const expected = target[composed.length];
    if (tile.id === expected) {
      const next = [...composed, tile.id];
      setComposed(next);
      if (next.length === target.length) {
        const elapsed = Date.now() - shownAtRef.current;
        setFeedback({ correct: true, chosenId: tile.id });
        setAnswered(n => n + 1);
        setCorrectCount(n => n + 1);
        const updates = rate(elapsed > SLOW_MS ? 'HARD' : 'GOOD');
        setTimeout(() => updates && advance(updates), 450);
      }
    } else {
      setFeedback({ correct: false, chosenId: tile.id });
      setAnswered(n => n + 1);
      const updates = rate('AGAIN');
      setRevealWrong(true);
      pendingUpdatesRef.current = updates ?? null;
    }
  };

  // ── shared bits ────────────────────────────────────────────────────────────

  const masteryColor = (id: string): string => {
    const m = progress[id]?.mastery ?? -1;
    if (m >= 2) return 'border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
    if (m >= 0 && progress[id]) return 'border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400';
    return 'border-[var(--border-color)] bg-[var(--bg-inset)] text-[var(--text-muted)]';
  };

  const progressPct = queue.length > 0 ? Math.min(100, (currentIndex / queue.length) * 100) : 0;

  // ── MAP ────────────────────────────────────────────────────────────────────
  if (phase === 'map') {
    return (
      <div className="flex flex-col min-h-dvh px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <button onClick={onExit} className="btn-ghost self-start text-[10px] font-bold uppercase tracking-wider mb-4">
          <ChevronLeft size={14} /> Back
        </button>

        <div className="flex items-center gap-2 mb-1">
          <BookOpen size={20} className="text-[var(--accent)]" />
          <h1 className="text-2xl font-black text-[var(--text-primary)]">{pack.name}</h1>
        </div>
        <p className="text-sm text-[var(--text-secondary)] mb-1.5">{pack.tagline}</p>
        <p className="text-xs text-[var(--text-muted)] mb-5">
          {summary.graduated}/{summary.total} letters mastered
          {summary.seen > summary.graduated && ` · ${summary.seen - summary.graduated} learning`}
          {summary.readableWords > 0 && ` · ${summary.readableWords} deck words readable`}
        </p>

        {/* Primary actions */}
        <div className="flex flex-col gap-2 mb-6">
          {batchPreview.length > 0 && (
            <button
              onClick={startLesson}
              className="w-full py-3.5 btn-primary rounded-xl text-sm font-black"
            >
              Lesson · {batchPreview.length} new {batchPreview.length === 1 ? 'character' : 'characters'}
            </button>
          )}
          <button
            onClick={startReview}
            disabled={dueCount === 0}
            className={`w-full py-3 rounded-xl text-sm font-bold border transition active:scale-[0.98] ${
              dueCount > 0
                ? 'border-[var(--accent)]/40 bg-[var(--bg-card)] text-[var(--accent)] hover:bg-[var(--accent)]/10'
                : 'border-[var(--border-color)] bg-[var(--bg-inset)] text-[var(--text-faint)] cursor-default'
            }`}
          >
            {dueCount > 0 ? `Review · ${dueCount} due` : 'No reviews due'}
          </button>
        </div>

        {/* Level rows */}
        <div className="flex flex-col gap-4">
          {pack.levels.map(lvl => {
            const unlocked = isLevelUnlocked(pack, lvl.level, progress);
            const stats = levelStats(pack, lvl.level, progress);
            return (
              <div key={lvl.level}>
                <div className="flex items-center gap-1.5 mb-1.5">
                  {!unlocked && <Lock size={11} className="text-[var(--text-faint)]" />}
                  <span className={`text-[11px] font-bold uppercase tracking-wider ${unlocked ? 'text-[var(--text-secondary)]' : 'text-[var(--text-faint)]'}`}>
                    Level {lvl.level} · {lvl.title}
                  </span>
                  {unlocked && stats.graduated === stats.total && <Check size={12} className="text-emerald-500" />}
                </div>
                <div className={`flex flex-wrap gap-1.5 ${unlocked ? '' : 'opacity-40'}`}>
                  {lvl.itemIds.map(id => {
                    const item = byId.get(id);
                    if (!item) return null;
                    const seen = !!progress[id];
                    return (
                      <button
                        key={id}
                        onClick={() => seen && setPopoverItem(item)}
                        disabled={!seen}
                        lang={bcp47}
                        className={`w-11 h-11 rounded-lg border flex items-center justify-center text-xl font-bold transition ${masteryColor(id)} ${seen ? 'active:scale-95' : 'cursor-default'}`}
                      >
                        {item.glyph}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Mnemonic recap popover */}
        {popoverItem && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={() => setPopoverItem(null)}>
            <div
              className="w-full max-w-md bg-[var(--bg-card)] rounded-t-2xl p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] animate-fade-in"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-4 mb-3">
                <span lang={bcp47} className="text-6xl font-bold text-[var(--text-primary)]">{popoverItem.glyph}</span>
                <div>
                  <p className="text-lg font-black text-[var(--text-primary)]">{popoverItem.sound}</p>
                  <p className="text-xs text-[var(--text-muted)]">{popoverItem.romanization}</p>
                </div>
                <button
                  onClick={() => play(popoverItem)}
                  className="ml-auto w-10 h-10 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/30 flex items-center justify-center text-[var(--accent)] active:scale-95 transition"
                >
                  <Volume2 size={18} />
                </button>
              </div>
              {popoverItem.mnemonic && (
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{popoverItem.mnemonic}</p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── LESSON ─────────────────────────────────────────────────────────────────
  if (phase === 'lesson') {
    const item = lessonBatch[lessonIndex];
    if (!item) { setPhase('map'); return null; }
    const similars = (item.similar ?? []).map(id => byId.get(id)!).filter(Boolean);
    const comps = (item.components ?? []).map(id => byId.get(id)!).filter(Boolean);
    const isLast = lessonIndex === lessonBatch.length - 1;
    return (
      <div className="flex flex-col h-dvh px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => setPhase('map')} className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider hover:text-[var(--text-secondary)] transition-colors">
            &larr; Exit
          </button>
          <span className="text-xs font-bold text-[var(--text-muted)] tabular-nums">{lessonIndex + 1}/{lessonBatch.length}</span>
        </div>
        <div className="h-1 bg-[var(--progress-bg)] rounded-full mb-4 overflow-hidden">
          <div className="h-full bg-[var(--accent)] rounded-full transition-all" style={{ width: `${((lessonIndex + 1) / lessonBatch.length) * 100}%` }} />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <span lang={bcp47} className="text-[7rem] leading-none font-bold text-[var(--text-primary)] mb-4">{item.glyph}</span>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl font-black text-[var(--accent)]">{item.sound}</span>
            <button
              onClick={() => play(item)}
              className="w-10 h-10 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/30 flex items-center justify-center text-[var(--accent)] active:scale-95 transition"
            >
              <Volume2 size={18} />
            </button>
          </div>
          {item.mnemonic && (
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-xs mb-4">{item.mnemonic}</p>
          )}
          {comps.length > 0 && (
            <p className="text-xs text-[var(--text-muted)] mb-3">
              Built from {comps.map(c => `${c.glyph} (${c.romanization})`).join(' + ')}
            </p>
          )}
          {similars.length > 0 && (
            <div className="stat-card px-3.5 py-2.5">
              <p className="text-xs text-[var(--text-secondary)]">
                <span className="font-bold text-amber-500">Don't confuse with:</span>{' '}
                {similars.map(s => `${s.glyph} (${s.romanization})`).join(' · ')}
              </p>
            </div>
          )}
          {item.exampleWord && (
            <p className="text-xs text-[var(--text-muted)] mt-3">
              You'll meet it in <span className="font-bold text-[var(--text-secondary)]">{item.exampleWord.target}</span> – {item.exampleWord.english}
            </p>
          )}
        </div>

        <button
          onClick={() => (isLast ? startLessonQuiz() : setLessonIndex(i => i + 1))}
          className="w-full py-3.5 btn-primary rounded-xl text-sm font-black"
        >
          {isLast ? 'Quiz these' : 'Next'}
        </button>
      </div>
    );
  }

  // ── QUIZ / REVIEW ──────────────────────────────────────────────────────────
  if ((phase === 'lessonQuiz' || phase === 'review') && drill && currentItem) {
    const isComposition = drill.kind === 'composition';
    const answerIsGlyph = drill.kind !== 'recognition' && !isComposition;
    return (
      <div className="flex flex-col h-dvh px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => setPhase(answered > 0 ? 'summary' : 'map')} className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider hover:text-[var(--text-secondary)] transition-colors">
            &larr; End
          </button>
          <span className="text-xs font-bold text-[var(--text-muted)] tabular-nums">{Math.min(currentIndex + 1, queue.length)}/{queue.length}</span>
        </div>
        <div className="h-1 bg-[var(--progress-bg)] rounded-full mb-4 overflow-hidden">
          <div className="h-full bg-[var(--accent)] rounded-full transition-all" style={{ width: `${progressPct}%` }} />
        </div>

        {/* Prompt */}
        <div className="flex-1 flex flex-col items-center justify-center text-center min-h-0">
          {drill.kind === 'discrimination' && (
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500 mb-3">Look-alikes – listen closely</p>
          )}
          {drill.prompt === 'glyph' && (
            <span lang={bcp47} className="text-[6rem] leading-none font-bold text-[var(--text-primary)] mb-6">{drill.item.glyph}</span>
          )}
          {drill.prompt === 'romanization' && (
            <span className="text-5xl font-black text-[var(--text-primary)] mb-6">{drill.item.romanization}</span>
          )}
          {drill.prompt === 'audio' && (
            <button
              onClick={() => play(drill.item)}
              className="w-20 h-20 rounded-full bg-[var(--accent)]/10 border-2 border-[var(--accent)]/40 flex items-center justify-center text-[var(--accent)] active:scale-95 transition mb-6"
            >
              <Volume2 size={32} />
            </button>
          )}
          <p className="text-xs text-[var(--text-muted)] mb-5">
            {isComposition ? `Build it: tap the parts of ${drill.item.romanization} in order`
              : drill.kind === 'recognition' ? 'What sound is this?'
              : 'Pick the right character'}
          </p>

          {/* Choices */}
          {isComposition ? (
            <>
              <div className="flex gap-2 mb-4 min-h-[3rem]">
                {(drill.item.components ?? []).map((cid, i) => (
                  <div key={cid + i} className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center text-2xl font-bold ${
                    i < composed.length ? 'border-emerald-500/60 bg-emerald-500/10 text-[var(--text-primary)]' : 'border-dashed border-[var(--border-color)] text-transparent'
                  }`}>
                    {i < composed.length ? byId.get(composed[i])?.glyph : '·'}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2 w-full max-w-xs">
                {drill.choices.map(c => (
                  <button
                    key={c.id}
                    onClick={() => handleTile(c)}
                    disabled={!!feedback || composed.includes(c.id)}
                    className={`py-3.5 rounded-xl border text-2xl font-bold transition active:scale-95 ${
                      composed.includes(c.id)
                        ? 'border-emerald-500/40 bg-emerald-500/5 text-[var(--text-faint)]'
                        : feedback && !feedback.correct && feedback.chosenId === c.id
                          ? 'border-red-500/60 bg-red-500/10 text-red-500'
                          : 'border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]'
                    }`}
                  >
                    {c.glyph}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 w-full max-w-xs">
              {drill.choices.map(c => {
                const isAnswer = c.id === drill.item.id;
                const chosen = feedback?.chosenId === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => handleChoice(c)}
                    disabled={!!feedback}
                    className={`py-4 rounded-xl border font-bold transition active:scale-95 ${answerIsGlyph ? 'text-3xl' : 'text-lg'} ${
                      feedback
                        ? isAnswer
                          ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : chosen
                            ? 'border-red-500/60 bg-red-500/10 text-red-500'
                            : 'border-[var(--border-color)] bg-[var(--bg-inset)] text-[var(--text-faint)]'
                        : 'border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]'
                    }`}
                  >
                    {answerIsGlyph ? c.glyph : c.romanization}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Wrong-answer reveal: the answer + mnemonic recap */}
        {revealWrong && (
          <div className="stat-card p-4 mb-3 animate-fade-in">
            <div className="flex items-center gap-3 mb-1.5">
              <span lang={bcp47} className="text-4xl font-bold text-[var(--text-primary)]">{drill.item.glyph}</span>
              <div>
                <p className="text-sm font-black text-[var(--text-primary)]">{drill.item.sound}</p>
                <p className="text-[11px] text-[var(--text-muted)]">{drill.item.romanization}</p>
              </div>
              <button
                onClick={() => play(drill.item)}
                className="ml-auto w-9 h-9 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/30 flex items-center justify-center text-[var(--accent)] active:scale-95 transition"
              >
                <Volume2 size={16} />
              </button>
            </div>
            {drill.item.mnemonic && (
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-3">{drill.item.mnemonic}</p>
            )}
            <button onClick={continueAfterWrong} className="w-full py-2.5 btn-primary rounded-xl text-sm font-bold">
              Got it
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── SUMMARY ────────────────────────────────────────────────────────────────
  if (phase === 'summary') {
    const end = scriptSummary(pack, progressRef.current);
    const gradDelta = end.graduated - startSummaryRef.current.graduated;
    const readableDelta = end.readableWords - startSummaryRef.current.readableWords;
    return (
      <div className="flex flex-col items-center justify-center h-dvh px-6 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] animate-fade-in">
        <Sparkles size={40} className="text-[var(--accent)] mb-3" />
        <h2 className="text-xl font-black text-[var(--text-primary)] mb-1">Nice work</h2>
        <p className="text-sm text-[var(--text-muted)] mb-1">
          {correctCount}/{answered} correct
        </p>
        {gradDelta > 0 && (
          <p className="text-sm font-bold text-emerald-500 mb-1">+{gradDelta} {gradDelta === 1 ? 'character' : 'characters'} mastered</p>
        )}
        {readableDelta > 0 && (
          <p className="text-sm font-bold text-[var(--accent)] mb-1">+{readableDelta} deck words now readable</p>
        )}
        <p className="text-xs text-[var(--text-secondary)] mt-2 mb-6">
          {end.graduated}/{end.total} letters mastered overall
        </p>
        <div className="flex flex-col gap-2 w-full max-w-xs">
          <button onClick={() => setPhase('map')} className="w-full py-3 btn-primary rounded-xl text-sm font-bold">
            <span className="inline-flex items-center gap-1.5"><RotateCcw size={14} /> Back to the map</span>
          </button>
          <button onClick={onExit} className="w-full py-2.5 rounded-xl text-sm font-bold bg-[var(--bg-inset)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] active:scale-95 transition">
            Done
          </button>
        </div>
      </div>
    );
  }

  // Drill still building (first render of a quiz/review) – blank frame.
  return null;
};

export default ScriptTeacher;
