import React, { useState, useMemo } from 'react';
import { QuestCard, MasteryMap, UserStats, Language, LearningGoal } from '../types';
import { MAIN_PATH } from '../data/topicConfig';
import { GRAMMAR_NUDGES } from '../data/grammarDescriptions';
import { selectPlacementCards, applyPlacementResults, ConfidenceRating } from '../services/placementService';
import { ChevronLeft, ArrowRight, Zap, BookOpen } from 'lucide-react';

interface PlacementTestProps {
  deck: QuestCard[];
  lang: Language;
  userStats: UserStats;
  masteryMap: MasteryMap;
  onComplete: (newMasteryMap: MasteryMap, newUserStats: UserStats) => void;
  onSkip: () => void;
}

type Phase = 'intro' | 'question' | 'reveal' | 'results';

const PlacementTest: React.FC<PlacementTestProps> = ({
  deck,
  lang,
  userStats,
  masteryMap,
  onComplete,
  onSkip,
}) => {
  const [phase, setPhase] = useState<Phase>('intro');
  const [nodeIndex, setNodeIndex] = useState(0);
  const [cardIndex, setCardIndex] = useState(0);
  const [noIdeaCount, setNoIdeaCount] = useState(0);
  const [lastRating, setLastRating] = useState<ConfidenceRating | null>(null);
  const [ceilingNode, setCeilingNode] = useState<number | null>(null);
  const [showGrammarDetail, setShowGrammarDetail] = useState(false);

  // Pre-select 3 cards per node
  const placementCards = useMemo(() => selectPlacementCards(deck), [deck]);

  // Total cards across all nodes (for progress bar)
  const totalTestCards = placementCards.reduce((sum, arr) => sum + arr.length, 0);
  const completedCards = placementCards
    .slice(0, nodeIndex)
    .reduce((sum, arr) => sum + arr.length, 0) + cardIndex;

  const currentNode = MAIN_PATH[nodeIndex];
  const currentCard = placementCards[nodeIndex]?.[cardIndex];
  const nudge = currentNode ? GRAMMAR_NUDGES[currentNode.id] || '' : '';

  // Count cards that would be fast-tracked
  const fastTrackCount = useMemo(() => {
    if (ceilingNode === null && phase !== 'results') return 0;
    const upTo = ceilingNode !== null ? ceilingNode : MAIN_PATH.length;
    const nodeIds = new Set(MAIN_PATH.slice(0, upTo).map(n => n.id));
    return deck.filter(c => nodeIds.has(c.topic) && c.mastery !== 2).length;
  }, [ceilingNode, phase, deck]);

  const fastTrackXP = fastTrackCount * 10;

  function handleConfidence(rating: ConfidenceRating) {
    setLastRating(rating);
    setShowGrammarDetail(false);

    // Track "no idea" for this node
    const newNoIdea = rating === 'no_idea' ? noIdeaCount + 1 : noIdeaCount;
    setNoIdeaCount(newNoIdea);

    setPhase('reveal');
  }

  function handleNext() {
    const nextCardIndex = cardIndex + 1;
    const nodeCards = placementCards[nodeIndex] || [];

    if (nextCardIndex < nodeCards.length) {
      // More cards in this node
      setCardIndex(nextCardIndex);
      setPhase('question');
      setLastRating(null);
      return;
    }

    // Finished all cards for this node — check stop condition
    if (noIdeaCount >= 2) {
      // Ceiling found
      setCeilingNode(nodeIndex);
      setPhase('results');
      return;
    }

    // Advance to next node
    const nextNode = nodeIndex + 1;
    if (nextNode >= MAIN_PATH.length) {
      // Passed everything
      setCeilingNode(null);
      setPhase('results');
      return;
    }

    setNodeIndex(nextNode);
    setCardIndex(0);
    setNoIdeaCount(0);
    setPhase('question');
    setLastRating(null);
  }

  function handleApply() {
    const results = { ceilingNodeIndex: ceilingNode };
    const { newMasteryMap, newUserStats } = applyPlacementResults(
      results,
      deck,
      masteryMap,
      userStats,
      lang
    );
    onComplete(newMasteryMap, newUserStats);
  }

  // ── Intro screen ──────────────────────────────────────────

  if (phase === 'intro') {
    return (
      <div className="flex flex-col h-dvh px-5 py-6">
        <button
          onClick={onSkip}
          className="btn-ghost self-start text-[10px] font-bold uppercase tracking-wider mb-8"
        >
          <ChevronLeft size={14} /> Skip
        </button>

        <div className="flex-1 flex flex-col justify-center">
          <h1 className="text-2xl font-black text-[var(--text-primary)] mb-3">
            What do you already know?
          </h1>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">
            We'll show you Spanish sentences from easy to advanced.
            Rate how well you understand each one.
          </p>
          <div className="stat-card p-3.5 mb-6">
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              <span className="font-bold text-[var(--text-primary)]">Pay attention to structure, not just words.</span>
              {' '}Two people might know the vocabulary but only one notices the grammar
              pattern. Think about <em>why</em> the sentence is built the way it is.
            </p>
          </div>
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold mb-8">
            About 2 minutes
          </p>
        </div>

        <button
          onClick={() => setPhase('question')}
          className="w-full py-4 btn-primary rounded-xl text-base mb-3"
        >
          Start
        </button>
        <button
          onClick={onSkip}
          className="w-full py-3 text-xs text-[var(--text-muted)] font-bold hover:text-[var(--text-secondary)] transition-colors"
        >
          Start from the beginning instead
        </button>
      </div>
    );
  }

  // ── Question screen ───────────────────────────────────────

  if (phase === 'question' && currentCard) {
    return (
      <div className="flex flex-col h-dvh px-5 py-4">
        {/* Header: tier + node name */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span
              className="text-[10px] font-black uppercase tracking-wider"
              style={{ color: currentNode.color }}
            >
              {currentNode.tier}
            </span>
            <span className="text-xs font-bold text-[var(--text-secondary)]">
              {currentNode.name}
            </span>
          </div>
          <span className="text-[10px] font-mono text-[var(--text-muted)]">
            {nodeIndex + 1}/{MAIN_PATH.length}
          </span>
        </div>

        {/* Progress bar */}
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
          <div className="study-card w-full max-h-[50dvh] flex items-center justify-center p-6">
            <p className="text-lg font-extrabold text-[var(--text-primary)] text-center leading-relaxed">
              {currentCard.target}
            </p>
          </div>
        </div>

        {/* Confidence buttons */}
        <div className="grid grid-cols-3 gap-2 mt-4 mb-2 shrink-0">
          <button
            onClick={() => handleConfidence('know_it')}
            className="py-3.5 rounded-xl border border-emerald-500/30 bg-[var(--bg-card)] hover:bg-emerald-500/10 active:bg-emerald-500/20 transition-all"
          >
            <div className="text-xs font-black text-emerald-500 uppercase">Know it</div>
          </button>
          <button
            onClick={() => handleConfidence('mostly')}
            className="py-3.5 rounded-xl border border-amber-500/30 bg-[var(--bg-card)] hover:bg-amber-500/10 active:bg-amber-500/20 transition-all"
          >
            <div className="text-xs font-black text-amber-500 uppercase">Mostly</div>
          </button>
          <button
            onClick={() => handleConfidence('no_idea')}
            className="py-3.5 rounded-xl border border-red-500/30 bg-[var(--bg-card)] hover:bg-red-500/10 active:bg-red-500/20 transition-all"
          >
            <div className="text-xs font-black text-red-500 uppercase">No idea</div>
          </button>
        </div>
      </div>
    );
  }

  // ── Reveal screen ─────────────────────────────────────────

  if (phase === 'reveal' && currentCard) {
    return (
      <div className="flex flex-col h-dvh px-5 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span
              className="text-[10px] font-black uppercase tracking-wider"
              style={{ color: currentNode.color }}
            >
              {currentNode.tier}
            </span>
            <span className="text-xs font-bold text-[var(--text-secondary)]">
              {currentNode.name}
            </span>
          </div>
          <span className={`text-[10px] font-black uppercase tracking-wider ${
            lastRating === 'know_it' ? 'text-emerald-500' :
            lastRating === 'mostly' ? 'text-amber-500' : 'text-red-500'
          }`}>
            {lastRating === 'know_it' ? 'Know it' :
             lastRating === 'mostly' ? 'Mostly' : 'No idea'}
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

        {/* Card with reveal */}
        <div className="flex-1 overflow-y-auto">
          <div className="study-card w-full p-6 mb-4">
            <p className="text-lg font-extrabold text-[var(--text-primary)] text-center leading-relaxed mb-3">
              {currentCard.target}
            </p>
            <div className="h-px bg-[var(--border-color)] mb-3" />
            <p className="text-base text-[var(--text-secondary)] text-center italic leading-relaxed">
              {currentCard.english}
            </p>
          </div>

          {/* Grammar nudge */}
          <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-3.5 mb-3">
            <div className="flex items-start gap-2">
              <BookOpen size={14} className="text-amber-500 mt-0.5 shrink-0" />
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {nudge}
              </p>
            </div>
          </div>

          {/* Per-card grammar detail (if available) */}
          {currentCard.grammar && (
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

        {/* Next button */}
        <button
          onClick={handleNext}
          className="w-full py-4 btn-primary rounded-xl text-sm flex items-center justify-center gap-2 shrink-0 mt-2 mb-2"
        >
          Next <ArrowRight size={16} />
        </button>
      </div>
    );
  }

  // ── Results screen ────────────────────────────────────────

  if (phase === 'results') {
    const passedNodes = ceilingNode !== null ? ceilingNode : MAIN_PATH.length;
    const lastPassedNode = passedNodes > 0 ? MAIN_PATH[passedNodes - 1] : null;
    const ceilingNodeObj = ceilingNode !== null ? MAIN_PATH[ceilingNode] : null;
    const levelsGained = Math.floor(fastTrackXP / 100);

    return (
      <div className="flex flex-col h-dvh px-5 py-6">
        <div className="flex-1 flex flex-col justify-center">
          {ceilingNode !== null && ceilingNode > 0 ? (
            <>
              {/* Found a ceiling with some passed nodes */}
              <div
                className="text-[10px] font-black uppercase tracking-wider mb-2"
                style={{ color: lastPassedNode?.color }}
              >
                Your level
              </div>
              <h1 className="text-3xl font-black text-[var(--text-primary)] mb-1">
                {lastPassedNode?.tier}
              </h1>
              <p className="text-sm text-[var(--text-secondary)] mb-6">
                Comfortable through <span className="font-bold">{lastPassedNode?.name}</span>
              </p>
              <p className="text-xs text-[var(--text-muted)] mb-1">
                Starting from: <span className="font-bold" style={{ color: ceilingNodeObj?.color }}>{ceilingNodeObj?.tier} — {ceilingNodeObj?.name}</span>
              </p>
            </>
          ) : ceilingNode === 0 ? (
            <>
              {/* Hit ceiling on first node */}
              <h1 className="text-2xl font-black text-[var(--text-primary)] mb-2">
                Starting fresh
              </h1>
              <p className="text-sm text-[var(--text-secondary)] mb-6">
                You'll begin with the basics — that's a great foundation to build on.
              </p>
            </>
          ) : (
            <>
              {/* Passed everything */}
              <h1 className="text-2xl font-black text-[var(--text-primary)] mb-2">
                Impressive!
              </h1>
              <p className="text-sm text-[var(--text-secondary)] mb-6">
                You passed all {MAIN_PATH.length} levels. All cards will be marked as known.
              </p>
            </>
          )}

          {/* Stats preview */}
          {fastTrackCount > 0 && (
            <div className="stat-card p-4 mb-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-lg font-black font-mono text-[var(--text-primary)]">
                    {fastTrackCount.toLocaleString()}
                  </div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    Cards
                  </div>
                </div>
                <div>
                  <div className="text-lg font-black font-mono text-blue-500">
                    {fastTrackXP.toLocaleString()}
                  </div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    XP
                  </div>
                </div>
                <div>
                  <div className="text-lg font-black font-mono text-amber-500 flex items-center justify-center gap-1">
                    <Zap size={14} className="fill-amber-500" />
                    {levelsGained}
                  </div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    Levels
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Apply button */}
        {fastTrackCount > 0 ? (
          <button
            onClick={handleApply}
            className="w-full py-4 btn-primary rounded-xl text-base mb-3"
          >
            Apply & Start Learning
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
