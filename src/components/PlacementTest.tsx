import React, { useState, useMemo, useEffect } from 'react';
import { QuestCard, MasteryMap, UserStats, Language, LANGUAGE_CONFIG } from '../types';
import type { AudioSpeed } from '../services/storageService';
import { MAIN_PATH, getNodeName } from '../data/topicConfig';
import { getGrammarNudge } from '../data/grammarDescriptions';
import { selectPlacementCards, applyPlacementResults, ConfidenceRating } from '../services/placementService';
import { playCardAudio, stopAudio } from '../services/audioService';
import { ChevronLeft, ArrowRight, BookOpen, Volume2 } from 'lucide-react';

interface PlacementTestProps {
  deck: QuestCard[];
  lang: Language;
  userStats: UserStats;
  masteryMap: MasteryMap;
  onComplete: (newMasteryMap: MasteryMap, newUserStats: UserStats, fastTrackedCount: number) => void;
  onSkip: () => void;
  autoPlayAudio: boolean;
  audioSpeed: AudioSpeed;
  googleTtsApiKey?: string;
}

type Phase = 'intro' | 'question' | 'reveal' | 'results';

const PlacementTest: React.FC<PlacementTestProps> = ({
  deck,
  lang,
  userStats,
  masteryMap,
  onComplete,
  onSkip,
  autoPlayAudio,
  audioSpeed,
  googleTtsApiKey,
}) => {
  const [phase, setPhase] = useState<Phase>('intro');
  const [nodeIndex, setNodeIndex] = useState(0);
  const [cardIndex, setCardIndex] = useState(0);
  // Per-node tracking: count of "mostly" and "no_idea" per node index
  const [nodeScores, setNodeScores] = useState<Record<number, { mostly: number; noIdea: number }>>({});
  const [lastRating, setLastRating] = useState<ConfidenceRating | null>(null);
  const [ceilingNode, setCeilingNode] = useState<number | null>(null);
  const [showGrammarDetail, setShowGrammarDetail] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Pre-select 2 cards per node (35 nodes × 2 = 70 total cards)
  const placementCards = useMemo(() => selectPlacementCards(deck), [deck]);

  // Total cards across all nodes (for progress bar)
  const totalTestCards = placementCards.reduce((sum, arr) => sum + arr.length, 0);
  const completedCards = placementCards
    .slice(0, nodeIndex)
    .reduce((sum, arr) => sum + arr.length, 0) + cardIndex;

  const currentNode = MAIN_PATH[nodeIndex];
  const currentCard = placementCards[nodeIndex]?.[cardIndex];
  const nudge = currentNode ? getGrammarNudge(currentNode.id, lang) : '';

  // Auto-play audio when a new question appears (not on reveal)
  useEffect(() => {
    if (phase === 'question' && currentCard && autoPlayAudio) {
      playCardAudio(currentCard.audio, currentCard.target, lang, audioSpeed, googleTtsApiKey);
    }
    return () => { stopAudio(); };
  }, [phase, nodeIndex, cardIndex]);

  const handlePlayAudio = () => {
    if (!currentCard || isPlaying) return;
    setIsPlaying(true);
    playCardAudio(currentCard.audio, currentCard.target, lang, audioSpeed, googleTtsApiKey)
      .finally(() => setIsPlaying(false));
  };

  // Strict placement scoring:
  // - 1 "no idea" in a node → fail that node
  // - 2 "mostly" in a single node → fail that node
  // - 2 "mostly" across two adjacent nodes → fail the later node

  function handleConfidence(rating: ConfidenceRating) {
    setLastRating(rating);
    setShowGrammarDetail(false);

    // Update per-node score
    setNodeScores(prev => {
      const current = prev[nodeIndex] || { mostly: 0, noIdea: 0 };
      return {
        ...prev,
        [nodeIndex]: {
          mostly: current.mostly + (rating === 'mostly' ? 1 : 0),
          noIdea: current.noIdea + (rating === 'no_idea' ? 1 : 0),
        },
      };
    });

    setPhase('reveal');
  }

  function handleRerate() {
    // Undo the last rating and go back to question
    if (lastRating) {
      setNodeScores(prev => {
        const current = prev[nodeIndex] || { mostly: 0, noIdea: 0 };
        return {
          ...prev,
          [nodeIndex]: {
            mostly: current.mostly - (lastRating === 'mostly' ? 1 : 0),
            noIdea: current.noIdea - (lastRating === 'no_idea' ? 1 : 0),
          },
        };
      });
    }
    setLastRating(null);
    setPhase('question');
  }

  /** Check if a node should be failed based on scores so far */
  function shouldFailNode(ni: number, scores: Record<number, { mostly: number; noIdea: number }>): boolean {
    const s = scores[ni] || { mostly: 0, noIdea: 0 };
    // 1 "no idea" → instant fail
    if (s.noIdea >= 1) return true;
    // 2 "mostly" in same node → fail
    if (s.mostly >= 2) return true;
    // Adjacent spillover: 1 "mostly" in previous node + 1 "mostly" in this node → fail
    if (ni > 0 && s.mostly >= 1) {
      const prev = scores[ni - 1] || { mostly: 0, noIdea: 0 };
      if (prev.mostly >= 1) return true;
    }
    return false;
  }

  function handleNext() {
    const nextCardIndex = cardIndex + 1;
    const nodeCards = placementCards[nodeIndex] || [];

    // Check if a "no idea" was just given — fail immediately (don't wait for node to finish)
    const currentNodeScore = nodeScores[nodeIndex] || { mostly: 0, noIdea: 0 };
    if (currentNodeScore.noIdea >= 1) {
      setCeilingNode(nodeIndex);
      setPhase('results');
      return;
    }

    if (nextCardIndex < nodeCards.length) {
      // More cards in this node
      setCardIndex(nextCardIndex);
      setPhase('question');
      setLastRating(null);
      return;
    }

    // Finished all cards for this node — check stop conditions
    if (shouldFailNode(nodeIndex, nodeScores)) {
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
    setPhase('question');
    setLastRating(null);
  }

  function handleApply() {
    const results = { ceilingNodeIndex: ceilingNode };
    const { newMasteryMap, newUserStats, fastTrackedCount } = applyPlacementResults(
      results,
      deck,
      masteryMap,
      userStats,
      lang
    );
    onComplete(newMasteryMap, newUserStats, fastTrackedCount);
  }

  // ── Intro screen ──────────────────────────────────────────

  if (phase === 'intro') {
    return (
      <div className="flex flex-col h-dvh px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
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
            We'll show you {LANGUAGE_CONFIG[lang].name} sentences from easy to advanced.
            Rate how well you understand each one.
          </p>
          <div className="stat-card p-3.5 mb-6">
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              <span className="font-bold text-[var(--text-primary)]">Be strict with yourself.</span>
              {' '}Only mark "Know it" if you could reproduce the sentence from memory when prompted.
              Focus on grammar and structure, not just vocabulary.
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
      <div className="flex flex-col h-dvh px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
        {/* Header: exit + tier + node name */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={onSkip}
              className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider hover:text-[var(--text-secondary)] transition-colors mr-1"
            >
              &larr; Exit
            </button>
            <span
              className="text-[10px] font-black uppercase tracking-wider"
              style={{ color: currentNode.color }}
            >
              {currentNode.tier}
            </span>
            <span className="text-xs font-bold text-[var(--text-secondary)]">
              {getNodeName(currentNode.id, lang)}
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
      <div className="flex flex-col h-dvh px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={onSkip}
              className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider hover:text-[var(--text-secondary)] transition-colors mr-1"
            >
              &larr; Exit
            </button>
            <span
              className="text-[10px] font-black uppercase tracking-wider"
              style={{ color: currentNode.color }}
            >
              {currentNode.tier}
            </span>
            <span className="text-xs font-bold text-[var(--text-secondary)]">
              {getNodeName(currentNode.id, lang)}
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

          {/* Grammar nudge — compact, below card */}
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

        {/* Bottom buttons — right below content */}
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
    return (
      <div className="flex flex-col h-dvh px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
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
                Comfortable through <span className="font-bold">{lastPassedNode ? getNodeName(lastPassedNode.id, lang) : ''}</span>
              </p>
              <p className="text-xs text-[var(--text-muted)] mb-1">
                Starting from: <span className="font-bold" style={{ color: ceilingNodeObj?.color }}>{ceilingNodeObj?.tier} — {ceilingNodeObj ? getNodeName(ceilingNodeObj.id, lang) : ''}</span>
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
        </div>

        {/* Apply button */}
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
