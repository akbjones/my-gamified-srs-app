import React, { useState, useMemo, useEffect, useRef } from 'react';
import { QuestCard, MasteryMap, UserStats, Language, LANGUAGE_CONFIG } from '../types';
import type { AudioSpeed } from '../services/storageService';
import { MAIN_PATH, getNodeName } from '../data/topicConfig';
import { getGrammarNudge } from '../data/grammarDescriptions';
import { grammarTipsEnabled } from '../config/featureFlags';
import {
  selectPlacementCards, applyPlacementResults, countFastTrackable,
  ConfidenceRating, RATING_POINTS, NodeStrength,
} from '../services/placementService';
import { playCardAudio, stopAudio } from '../services/audioService';
import { ChevronLeft, ArrowRight, BookOpen, Volume2, FastForward } from 'lucide-react';

interface PlacementTestProps {
  deck: QuestCard[];
  lang: Language;
  userStats: UserStats;
  masteryMap: MasteryMap;
  onComplete: (newMasteryMap: MasteryMap, newUserStats: UserStats, fastTrackedCount: number) => void;
  /** Decline: "I'm new – start from zero". Marks placement complete and starts studying. */
  onSkip: () => void;
  /** Leave without deciding (back/exit). Placement stays incomplete – the fork
   *  screen reappears on the next Study tap. Nothing is permanent. */
  onExit: () => void;
  /** Third fork option for languages with a script pack: "Learn the alphabet
   *  first". Leaves placement incomplete (the fork returns after) – learning
   *  the script is a detour, not a placement decision. */
  onLearnScript?: () => void;
  scriptName?: string;
  autoPlayAudio: boolean;
  audioSpeed: AudioSpeed;
  googleTtsApiKey?: string;
}

type Phase = 'intro' | 'question' | 'reveal' | 'results';

/** Scoring (2 cards per node, points no_idea=0 hard=1 knew=2 easy=3, max 6):
 *   total ≤ 2  → FAIL the node (includes no_idea+knew_it – previously a pass)
 *   total = 3  → WOBBLE: passes, but two wobbles in a row fail the second
 *   total ≥ 4  → pass ('strong' when ≥ 5)
 *  Every rule is reachable with n=2 – the old "3 mostly → fail" branch never
 *  could fire. There is no per-card Skip anymore: "No idea" IS the honest
 *  skip, and it scores. */
function nodeVerdict(points: number[]): { fail: boolean; wobble: boolean; strength: NodeStrength } {
  const total = points.reduce((a, b) => a + b, 0);
  if (total <= 2) return { fail: true, wobble: false, strength: 'wobble' };
  if (total === 3) return { fail: false, wobble: true, strength: 'wobble' };
  return { fail: false, wobble: false, strength: total >= 5 ? 'strong' : 'normal' };
}

const PlacementTest: React.FC<PlacementTestProps> = ({
  deck,
  lang,
  userStats,
  masteryMap,
  onComplete,
  onSkip,
  onExit,
  onLearnScript,
  scriptName,
  autoPlayAudio,
  audioSpeed,
  googleTtsApiKey,
}) => {
  const [phase, setPhase] = useState<Phase>('intro');
  const [nodeIndex, setNodeIndex] = useState(0);
  const [cardIndex, setCardIndex] = useState(0);
  // Points per rated card, per node index.
  const [nodePoints, setNodePoints] = useState<Record<number, number[]>>({});
  // Strength of each PASSED node (feeds FSRS seeding on apply).
  const [nodeStrengths, setNodeStrengths] = useState<Record<number, NodeStrength>>({});
  const [lastRating, setLastRating] = useState<ConfidenceRating | null>(null);
  const [ceilingNode, setCeilingNode] = useState<number | null>(null);
  const [showGrammarDetail, setShowGrammarDetail] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  // Whether the user peeked at the English for the current question. Peeking
  // is fine (it's how you verify you understood) but it caps the claim: you
  // can't rate "Very easy" on a sentence you needed the translation for.
  const [translationRevealed, setTranslationRevealed] = useState(false);
  // Tracks whether the previous completed node was a wobble (two consecutive
  // wobbles fail the second one).
  const prevWobbleRef = useRef(false);
  const lastAutoplayedCardId = useRef<string | null>(null);

  // Pre-select 2 cards per node (35 nodes × 2 = 70 total cards)
  const placementCards = useMemo(() => selectPlacementCards(deck), [deck]);

  // Card-based progress (single scale – the header shows the same count)
  const totalTestCards = placementCards.reduce((sum, arr) => sum + arr.length, 0);
  const completedCards = placementCards
    .slice(0, nodeIndex)
    .reduce((sum, arr) => sum + arr.length, 0) + cardIndex;

  const currentNode = MAIN_PATH[nodeIndex];
  const currentCard = placementCards[nodeIndex]?.[cardIndex];
  const nudge = currentNode ? getGrammarNudge(currentNode.id, lang) : '';

  // Auto-play audio – fires AT MOST ONCE per card (tracked by card id).
  useEffect(() => {
    if (phase !== 'question' || !currentCard || !autoPlayAudio) return;
    if (lastAutoplayedCardId.current === currentCard.id) return;
    lastAutoplayedCardId.current = currentCard.id;
    playCardAudio(currentCard.audio, currentCard.target, lang, audioSpeed, googleTtsApiKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, nodeIndex, cardIndex]);

  // Stop audio when leaving the card entirely (new card or unmount).
  useEffect(() => {
    return () => { stopAudio(); };
  }, [nodeIndex, cardIndex]);

  // Reset the peek state whenever a new question loads
  useEffect(() => {
    setTranslationRevealed(false);
  }, [nodeIndex, cardIndex]);

  const handlePlayAudio = () => {
    if (!currentCard || isPlaying) return;
    setIsPlaying(true);
    playCardAudio(currentCard.audio, currentCard.target, lang, audioSpeed, googleTtsApiKey)
      .finally(() => setIsPlaying(false));
  };

  /** Advance after the current card has a rating recorded in `points`.
   *  Called with the FRESH points map (state updates are async). Confident
   *  ratings skip the reveal screen entirely – half the taps for the users
   *  the test exists for. */
  function advance(points: Record<number, number[]>) {
    const nodeCards = placementCards[nodeIndex] || [];
    const ratedAll = (points[nodeIndex]?.length || 0) >= nodeCards.length;

    if (!ratedAll) {
      setCardIndex(cardIndex + 1);
      setPhase('question');
      setLastRating(null);
      return;
    }

    // Node complete – verdict
    const v = nodeVerdict(points[nodeIndex] || []);
    if (v.fail || (v.wobble && prevWobbleRef.current)) {
      setCeilingNode(nodeIndex);
      setPhase('results');
      return;
    }
    prevWobbleRef.current = v.wobble;
    setNodeStrengths(prev => ({ ...prev, [nodeIndex]: v.strength }));

    const nextNode = nodeIndex + 1;
    if (nextNode >= MAIN_PATH.length) {
      setCeilingNode(null); // passed everything
      setPhase('results');
      return;
    }
    setNodeIndex(nextNode);
    setCardIndex(0);
    setPhase('question');
    setLastRating(null);
  }

  function handleConfidence(rating: ConfidenceRating) {
    setLastRating(rating);
    setShowGrammarDetail(false);

    const pts = RATING_POINTS[rating];
    const fresh: Record<number, number[]> = {
      ...nodePoints,
      [nodeIndex]: [...(nodePoints[nodeIndex] || []), pts],
    };
    setNodePoints(fresh);

    // Confident answers go straight on; uncertain ones get the reveal screen
    // (that's where seeing the answer actually helps).
    if (rating === 'knew_it' || rating === 'very_easy') {
      advance(fresh);
    } else {
      setPhase('reveal');
    }
  }

  function handleRerate() {
    // Undo the last rating and go back to the question
    setNodePoints(prev => {
      const arr = [...(prev[nodeIndex] || [])];
      arr.pop();
      return { ...prev, [nodeIndex]: arr };
    });
    setLastRating(null);
    setPhase('question');
  }

  function handleNext() {
    advance(nodePoints);
  }

  function handleApply() {
    const results = { ceilingNodeIndex: ceilingNode, nodeStrengths };
    const { newMasteryMap, newUserStats, fastTrackedCount } = applyPlacementResults(
      results,
      deck,
      masteryMap,
      userStats,
      lang
    );
    onComplete(newMasteryMap, newUserStats, fastTrackedCount);
  }

  // ── Intro: the fork. Full screen, benefit-first, nothing dismissible. ──

  if (phase === 'intro') {
    return (
      <div className="flex flex-col h-dvh px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <button
          onClick={onExit}
          className="btn-ghost self-start text-[10px] font-bold uppercase tracking-wider mb-8"
        >
          <ChevronLeft size={14} /> Back
        </button>

        <div className="flex-1 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-3">
            <FastForward size={20} className="text-[var(--accent)]" />
            <h1 className="text-2xl font-black text-[var(--text-primary)]">
              Skip what you already know
            </h1>
          </div>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">
            Know some {LANGUAGE_CONFIG[lang].name}? A quick check finds your level and marks
            everything below it as learned – that can be hundreds of cards you'll
            never have to grind through.
          </p>
          <div className="stat-card p-3.5 mb-6">
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              <span className="font-bold text-[var(--text-primary)]">How it works:</span>
              {' '}you'll see sentences from easy to advanced and rate each one with the
              same buttons you'll use when studying. Rate before revealing the English –
              "Knew it" means you understood it on your own.
            </p>
          </div>
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold mb-8">
            2 minutes if you're new · up to 10 if you know a lot
          </p>
        </div>

        <button
          onClick={() => setPhase('question')}
          className="w-full py-2.5 rounded-xl text-sm font-bold bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90 active:scale-95 transition mb-2"
        >
          Find my level
        </button>
        {onLearnScript && (
          <button
            onClick={onLearnScript}
            className="w-full py-2.5 rounded-xl text-sm font-bold border border-[var(--accent)]/40 bg-[var(--bg-card)] text-[var(--accent)] hover:bg-[var(--accent)]/10 active:scale-95 transition mb-2"
          >
            Learn the alphabet first{scriptName ? ` – ${scriptName}` : ''}
          </button>
        )}
        <button
          onClick={onSkip}
          className="w-full py-2.5 rounded-xl text-sm font-bold bg-[var(--bg-inset)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] active:scale-95 transition"
        >
          I'm new – start from zero
        </button>
      </div>
    );
  }

  // ── Question screen ───────────────────────────────────────

  if (phase === 'question' && currentCard) {
    const peeked = translationRevealed;
    return (
      <div className="flex flex-col h-dvh px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={onExit}
            className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider hover:text-[var(--text-secondary)] transition-colors"
          >
            &larr; Exit
          </button>
          <span className="text-xs font-bold text-[var(--text-muted)] tabular-nums">
            {completedCards + 1}/{totalTestCards}
          </span>
        </div>

        {/* Progress bar – same card-based scale as the header count */}
        <div className="h-1 bg-[var(--progress-bg)] rounded-full mb-6 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${(completedCards / totalTestCards) * 100}%`,
              background: currentNode.color,
            }}
          />
        </div>

        {/* Card */}
        <div className="flex-1 flex items-center justify-center">
          <div className="study-card w-full max-h-[50dvh] flex flex-col items-center justify-center p-6">
            <p className="text-lg font-extrabold text-[var(--text-primary)] text-center leading-relaxed mb-3">
              {currentCard.target}
            </p>
            <button
              onClick={handlePlayAudio}
              className="p-2 rounded-full hover:bg-[var(--bg-inset)] transition-colors"
              aria-label="Play audio"
            >
              <Volume2 size={20} className={isPlaying ? 'text-blue-500 animate-pulse' : 'text-[var(--text-muted)]'} />
            </button>
            {translationRevealed ? (
              <p className="mt-4 pt-4 border-t border-[var(--border-color)] text-sm text-[var(--text-secondary)] italic text-center leading-relaxed animate-fade-in">
                {currentCard.english}
              </p>
            ) : (
              <button
                onClick={() => setTranslationRevealed(true)}
                className="mt-3 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
              >
                Show translation
              </button>
            )}
          </div>
        </div>

        {/* Rating buttons – the SAME four you use when studying, low → high.
            After peeking at the English, "Very easy" is off the table: you
            can't claim a sentence was trivially easy if you needed the answer. */}
        <div className="grid grid-cols-4 gap-1.5 mt-4 mb-2 shrink-0">
          <button
            onClick={() => handleConfidence('no_idea')}
            className="py-3.5 rounded-xl border border-red-500/30 bg-[var(--bg-card)] hover:bg-red-500/10 active:bg-red-500/20 transition-all"
          >
            <div className="text-[11px] font-black text-red-500 uppercase">No idea</div>
          </button>
          <button
            onClick={() => handleConfidence('hard')}
            className="py-3.5 rounded-xl border border-amber-500/30 bg-[var(--bg-card)] hover:bg-amber-500/10 active:bg-amber-500/20 transition-all"
          >
            <div className="text-[11px] font-black text-amber-500 uppercase">Hard</div>
          </button>
          <button
            onClick={() => handleConfidence('knew_it')}
            className="py-3.5 rounded-xl border border-emerald-500/30 bg-[var(--bg-card)] hover:bg-emerald-500/10 active:bg-emerald-500/20 transition-all"
          >
            <div className="text-[11px] font-black text-emerald-500 uppercase">Knew it</div>
          </button>
          <button
            onClick={() => handleConfidence('very_easy')}
            disabled={peeked}
            className={`py-3.5 rounded-xl border transition-all ${
              peeked
                ? 'border-[var(--border-color)] bg-[var(--bg-inset)] opacity-40'
                : 'border-sky-500/30 bg-[var(--bg-card)] hover:bg-sky-500/10 active:bg-sky-500/20'
            }`}
          >
            <div className={`text-[11px] font-black uppercase ${peeked ? 'text-[var(--text-faint)]' : 'text-sky-500'}`}>Very easy</div>
          </button>
        </div>
        {peeked && (
          <p className="text-center text-[10px] text-[var(--text-faint)] mb-2 shrink-0">
            You peeked – "Very easy" is for sentences you didn't need the translation for.
          </p>
        )}
      </div>
    );
  }

  // ── Reveal screen (only after uncertain ratings – No idea / Hard) ──

  if (phase === 'reveal' && currentCard) {
    return (
      <div className="flex flex-col h-dvh px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={onExit}
              className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider hover:text-[var(--text-secondary)] transition-colors mr-1"
            >
              &larr; Exit
            </button>
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ backgroundColor: currentNode.color }}
              aria-hidden="true"
            />
            <span className="text-xs font-bold text-[var(--text-secondary)]">
              {getNodeName(currentNode.id, lang)}
            </span>
          </div>
          <span className={`text-[10px] font-black uppercase tracking-wider ${
            lastRating === 'hard' ? 'text-amber-500' : 'text-red-500'
          }`}>
            {lastRating === 'hard' ? 'Hard' : 'No idea'}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-[var(--progress-bg)] rounded-full mb-6 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${((completedCards + 1) / totalTestCards) * 100}%`,
              background: currentNode.color,
            }}
          />
        </div>

        {/* Card + translation centered */}
        <div className="flex-1 flex flex-col justify-center overflow-y-auto">
          <div className="study-card w-full p-6 mb-4">
            <p className="text-lg font-extrabold text-[var(--text-primary)] text-center leading-relaxed mb-1">
              {currentCard.target}
            </p>
            <div className="flex justify-center mb-3">
              <button
                onClick={handlePlayAudio}
                className="p-1.5 rounded-full hover:bg-[var(--bg-inset)] transition-colors"
                aria-label="Play audio"
              >
                <Volume2 size={16} className={isPlaying ? 'text-blue-500 animate-pulse' : 'text-[var(--text-muted)]'} />
              </button>
            </div>
            <div className="h-px bg-[var(--border-color)] mb-3" />
            <p className="text-base text-[var(--text-secondary)] text-center italic leading-relaxed">
              {currentCard.english}
            </p>
          </div>

          {/* Grammar nudge – compact, below card */}
          {nudge && (
            <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-3 mb-3">
              <div className="flex items-start gap-2">
                <BookOpen size={14} className="text-amber-500 mt-0.5 shrink-0" />
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {nudge}
                </p>
              </div>
            </div>
          )}

          {/* Per-card grammar detail (if available) */}
          {grammarTipsEnabled(lang) && currentCard.grammar && (
            <div className="mb-3">
              <button
                onClick={() => setShowGrammarDetail(!showGrammarDetail)}
                className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider hover:text-[var(--text-secondary)] transition-colors"
              >
                {showGrammarDetail ? 'Hide detail' : 'See detail'}
              </button>
              {showGrammarDetail && (
                <div className="mt-2 rounded-lg bg-[var(--bg-inset)] p-3">
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    {currentCard.grammar}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom buttons */}
        <div className="flex gap-2 shrink-0 mt-2 mb-2">
          <button
            onClick={handleRerate}
            className="px-4 py-3 rounded-xl text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors border border-[var(--border-color)]"
          >
            <ChevronLeft size={14} className="inline -mt-0.5" /> Re-rate
          </button>
          <button
            onClick={handleNext}
            className="flex-1 py-3 btn-primary rounded-xl text-sm flex items-center justify-center gap-2"
          >
            Next <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  // ── Results screen ────────────────────────────────────────

  if (phase === 'results') {
    const passedNodes = ceilingNode !== null ? ceilingNode : MAIN_PATH.length;
    const lastPassedNode = passedNodes > 0 ? MAIN_PATH[passedNodes - 1] : null;
    const ceilingNodeObj = ceilingNode !== null ? MAIN_PATH[ceilingNode] : null;
    // The payoff, concretely, BEFORE the user commits.
    const projected = countFastTrackable({ ceilingNodeIndex: ceilingNode, nodeStrengths }, deck);
    return (
      <div className="flex flex-col h-dvh px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="flex-1 flex flex-col justify-center">
          {ceilingNode !== null && ceilingNode > 0 ? (
            <>
              <h1 className="text-2xl font-black text-[var(--text-primary)] mb-2">
                You're ready to roll
              </h1>
              <p className="text-sm text-[var(--text-secondary)] mb-4">
                Comfortable through <span className="font-bold">{lastPassedNode ? getNodeName(lastPassedNode.id, lang) : ''}</span>
              </p>
              <div className="stat-card p-4 mb-4 text-center">
                <p className="text-3xl font-black text-[var(--accent)] mb-1">{projected.toLocaleString()}</p>
                <p className="text-xs text-[var(--text-secondary)]">
                  cards marked as known – you skip straight past them
                </p>
              </div>
              <p className="text-xs text-[var(--text-muted)] mb-1 flex items-center justify-center gap-2">
                Starting from
                <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: ceilingNodeObj?.color }} aria-hidden="true" />
                <span className="font-bold text-[var(--text-secondary)]">{ceilingNodeObj ? getNodeName(ceilingNodeObj.id, lang) : ''}</span>
              </p>
              <p className="text-[10px] text-[var(--text-faint)] text-center mt-2">
                Skipped cards come back as spaced reviews over the next days – nothing is lost.
              </p>
            </>
          ) : ceilingNode === 0 ? (
            <>
              <h1 className="text-2xl font-black text-[var(--text-primary)] mb-2">
                Starting fresh
              </h1>
              <p className="text-sm text-[var(--text-secondary)] mb-6">
                You'll begin with the basics – that's a great foundation to build on.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-black text-[var(--text-primary)] mb-2">
                Impressive!
              </h1>
              <p className="text-sm text-[var(--text-secondary)] mb-2">
                You passed all {MAIN_PATH.length} levels.
              </p>
              <div className="stat-card p-4 mb-4 text-center">
                <p className="text-3xl font-black text-[var(--accent)] mb-1">{projected.toLocaleString()}</p>
                <p className="text-xs text-[var(--text-secondary)]">cards marked as known</p>
              </div>
            </>
          )}
        </div>

        {ceilingNode !== 0 ? (
          <button
            onClick={handleApply}
            className="w-full py-4 btn-primary rounded-xl text-base mb-3"
          >
            Start Learning
          </button>
        ) : (
          <button
            onClick={onSkip}
            className="w-full py-4 btn-primary rounded-xl text-base mb-3"
          >
            Start Learning
          </button>
        )}
      </div>
    );
  }

  // Fallback (shouldn't reach here)
  return null;
};

export default PlacementTest;
