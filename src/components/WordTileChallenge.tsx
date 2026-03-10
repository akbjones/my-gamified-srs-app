import React, { useState, useEffect, useMemo } from 'react';
import { QuestCard, Language } from '../types';
import { Volume2 } from 'lucide-react';
import { playCardAudio } from '../services/audioService';
import { buildTiles, checkTileAnswer, TileCheckResult } from '../services/challengeService';
import type { AudioSpeed } from '../services/storageService';

interface WordTileChallengeProps {
  card: QuestCard;
  siblingCards: QuestCard[];
  onComplete: (correct: boolean) => void;
  autoPlayAudio: boolean;
  audioSpeed: AudioSpeed;
  googleTtsApiKey?: string;
  language: Language;
}

const WordTileChallenge: React.FC<WordTileChallengeProps> = ({
  card,
  siblingCards,
  onComplete,
  autoPlayAudio,
  audioSpeed,
  googleTtsApiKey,
  language,
}) => {
  const { correct, tiles } = useMemo(() => buildTiles(card.target, siblingCards), [card.id]);

  const [placedWords, setPlacedWords] = useState<string[]>([]);
  const [availableIndices, setAvailableIndices] = useState<Set<number>>(
    () => new Set(tiles.map((_, i) => i))
  );
  const [checkResult, setCheckResult] = useState<TileCheckResult | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // One-time hint for first tile challenge ever
  const HINT_KEY = 'quest_tile_hint_seen';
  const [showHint, setShowHint] = useState(() => !localStorage.getItem(HINT_KEY));
  const dismissHint = () => { setShowHint(false); localStorage.setItem(HINT_KEY, 'true'); };

  const verdict = checkResult?.verdict ?? 'pending';
  const allPlaced = placedWords.length === correct.length;
  const isCorrectVerdict = verdict === 'exact' || verdict === 'close';

  useEffect(() => {
    setPlacedWords([]);
    setAvailableIndices(new Set(tiles.map((_, i) => i)));
    setCheckResult(null);
  }, [card.id]);

  useEffect(() => {
    if (autoPlayAudio) {
      playCardAudio(card.audio, card.target, language, audioSpeed, googleTtsApiKey);
    }
  }, [card.id]);

  const handleTapWord = (idx: number) => {
    if (checkResult || placedWords.length >= correct.length) return;
    if (showHint) dismissHint();
    setPlacedWords(prev => [...prev, tiles[idx]]);
    setAvailableIndices(prev => {
      const next = new Set(prev);
      next.delete(idx);
      return next;
    });
  };

  const handleRemoveWord = (placedIdx: number) => {
    if (checkResult) return;
    const word = placedWords[placedIdx];
    const usedIndices = tiles
      .map((w, i) => ({ w, i }))
      .filter(({ i }) => !availableIndices.has(i))
      .filter(({ w }) => w === word);
    const restoreIdx = usedIndices.length > 0 ? usedIndices[usedIndices.length - 1].i : -1;
    setPlacedWords(prev => prev.filter((_, i) => i !== placedIdx));
    if (restoreIdx >= 0) {
      setAvailableIndices(prev => {
        const next = new Set(prev);
        next.add(restoreIdx);
        return next;
      });
    }
  };

  const handleSubmit = () => {
    if (!allPlaced || checkResult) return;
    const result = checkTileAnswer(placedWords, correct);
    setCheckResult(result);
    playCardAudio(card.audio, card.target, language, audioSpeed, googleTtsApiKey);
    const isCorrect = result.verdict !== 'wrong';
    setTimeout(() => onComplete(isCorrect), result.verdict === 'close' ? 2500 : 1500);
  };

  const handlePlayAudio = () => {
    setIsPlaying(true);
    playCardAudio(card.audio, card.target, language, audioSpeed, googleTtsApiKey)
      .finally(() => setIsPlaying(false));
  };

  const closeFeedback = useMemo(() => {
    if (!checkResult || checkResult.verdict !== 'close' || !checkResult.misplacedWords) return '';
    const m = checkResult.misplacedWords;
    if (m.length === 1) return `"${m[0]}" is in the wrong spot`;
    if (m.length === 2) return `"${m[0]}" and "${m[1]}" are swapped`;
    return `${m.length} words are in different positions`;
  }, [checkResult]);

  return (
    <div className="flex flex-col h-full px-4">
      {/* Prompt */}
      <div className="pt-5 pb-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <p className="text-base font-bold italic text-[var(--text-secondary)] leading-relaxed">
            {card.english}
          </p>
          <button
            onClick={handlePlayAudio}
            className={`p-1 rounded-md shrink-0 transition-colors ${
              isPlaying
                ? 'text-blue-500'
                : 'text-[var(--text-faint)] hover:text-blue-500'
            }`}
          >
            <Volume2 size={14} />
          </button>
        </div>
        <p className="text-[10px] text-[var(--text-faint)] font-bold uppercase tracking-widest">
          {correct.length} words
        </p>
      </div>

      {/* First-time hint */}
      {showHint && (
        <button
          onClick={dismissHint}
          className="mb-2 w-full text-center text-[10px] text-blue-500 font-semibold py-1.5 rounded-lg bg-blue-500/8 border border-blue-500/20 animate-fade-in"
        >
          Tap the words below to build the sentence &middot; tap to dismiss
        </button>
      )}

      {/* Sentence build area */}
      <div className={`rounded-xl p-4 min-h-[56px] transition-all ${
        isCorrectVerdict
          ? 'bg-emerald-500/8 ring-1 ring-emerald-500/25'
          : verdict === 'wrong'
          ? 'bg-red-500/8 ring-1 ring-red-500/25 animate-shake'
          : 'bg-[var(--bg-inset)] ring-1 ring-[var(--border-color)]'
      }`}>
        <div className="flex flex-wrap gap-1.5 min-h-[32px] items-center">
          {placedWords.length === 0 && !checkResult && (
            <span className="text-[var(--text-faint)] text-xs">
              {correct.map((_, i) => (
                <span key={i} className="inline-block w-8 h-[2px] bg-[var(--text-faint)]/30 rounded mx-1 align-middle" />
              ))}
            </span>
          )}
          {placedWords.map((word, i) => {
            const isMisplaced = verdict === 'close' && placedWords[i] !== correct[i];
            return (
              <button
                key={`placed-${i}`}
                onClick={() => handleRemoveWord(i)}
                className={`px-2.5 py-1.5 rounded-lg text-sm font-bold transition-all active:scale-95 ${
                  verdict === 'exact'
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                    : verdict === 'close'
                    ? isMisplaced
                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                      : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                    : verdict === 'wrong'
                    ? 'bg-red-500/15 text-red-600 dark:text-red-400'
                    : 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm border border-[var(--border-color)] hover:border-blue-500/30'
                }`}
              >
                {word}
              </button>
            );
          })}
        </div>
      </div>

      {/* Feedback — clean text only */}
      <div className="h-14 flex items-center justify-center">
        {verdict === 'exact' && (
          <p className="text-sm font-black text-emerald-500 animate-fade-in">Correct</p>
        )}
        {verdict === 'close' && (
          <div className="text-center animate-fade-in">
            <p className="text-sm font-black text-emerald-500">Correct</p>
            <p className="text-[10px] text-amber-500 font-semibold">{closeFeedback}</p>
          </div>
        )}
        {verdict === 'wrong' && (
          <div className="text-center animate-fade-in">
            <p className="text-xs text-[var(--text-muted)] font-semibold">{card.target}</p>
          </div>
        )}
        {verdict === 'pending' && allPlaced && (
          <button
            onClick={handleSubmit}
            className="px-8 py-2.5 rounded-xl btn-primary text-sm font-black uppercase tracking-wider animate-fade-in active:scale-[0.97] transition-all"
          >
            Check
          </button>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Tiles */}
      <div className="pb-5 pt-2">
        <div className="flex flex-wrap gap-2 justify-center">
          {tiles.map((word, i) => {
            const isUsed = !availableIndices.has(i);
            return (
              <button
                key={`tile-${i}`}
                onClick={() => !isUsed && handleTapWord(i)}
                disabled={isUsed || !!checkResult || allPlaced}
                className={`px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  isUsed
                    ? 'opacity-0 pointer-events-none'
                    : allPlaced || checkResult
                    ? 'opacity-30 border border-[var(--border-color)] text-[var(--text-muted)]'
                    : 'border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm hover:border-[var(--border-hover)] hover:shadow-md active:scale-95'
                }`}
              >
                {word}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WordTileChallenge;
