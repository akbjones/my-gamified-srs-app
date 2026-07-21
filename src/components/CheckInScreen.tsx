import React from 'react';
import { Language, LANGUAGE_CONFIG } from '../types';
import { Gauge, FastForward, Check, Feather } from 'lucide-react';

/** Tally of the ratings from the session that just ended – the evidence line. */
export interface SessionTally { noIdea: number; hard: number; good: number; easy: number }

interface CheckInScreenProps {
  lang: Language;
  tally: SessionTally;
  /** "Too easy" → route to the placement test to skip ahead properly. */
  onTooEasy: () => void;
  /** "About right" → nothing changes. */
  onAboutRight: () => void;
  /** "Too hard" → halve the daily new-card limit (returns the new value applied). */
  onTooHard: () => void;
  /** The new-cards/day value that WOULD apply if they pick Too hard (shown on the card). */
  easedLimitPreview: { from: number; to: number };
}

/**
 * One-shot difficulty check-in – a full SCREEN in the view FSM, deliberately
 * not a dismissible popup (popups get clicked away unnoticed). Shown once per
 * language, at the end of an early session, once there's real evidence to
 * show. Every answer has a concrete consequence, stated on the button.
 */
const CheckInScreen: React.FC<CheckInScreenProps> = ({ lang, tally, onTooEasy, onAboutRight, onTooHard, easedLimitPreview }) => {
  const total = tally.noIdea + tally.hard + tally.good + tally.easy;
  return (
    <div className="flex flex-col h-dvh px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="flex-1 flex flex-col justify-center">
        <div className="flex items-center gap-2 mb-3">
          <Gauge size={20} className="text-[var(--accent)]" />
          <h1 className="text-2xl font-black text-[var(--text-primary)]">
            Quick check – how's the difficulty?
          </h1>
        </div>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">
          You've studied {LANGUAGE_CONFIG[lang].name} a few times now. One question, once –
          so your starting level isn't quietly wrong for weeks.
        </p>
        {total > 0 && (
          <div className="stat-card p-3.5 mb-6">
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              <span className="font-bold text-[var(--text-primary)]">This session:</span>{' '}
              {tally.easy > 0 && <span className="text-sky-500 font-bold">{tally.easy} very easy</span>}
              {tally.easy > 0 && (tally.good > 0 || tally.hard > 0 || tally.noIdea > 0) && ' · '}
              {tally.good > 0 && <span className="text-emerald-500 font-bold">{tally.good} knew it</span>}
              {tally.good > 0 && (tally.hard > 0 || tally.noIdea > 0) && ' · '}
              {tally.hard > 0 && <span className="text-amber-500 font-bold">{tally.hard} hard</span>}
              {tally.hard > 0 && tally.noIdea > 0 && ' · '}
              {tally.noIdea > 0 && <span className="text-red-500 font-bold">{tally.noIdea} no idea</span>}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2.5">
          <button
            onClick={onTooEasy}
            className="w-full p-4 rounded-xl border border-sky-500/30 bg-[var(--bg-card)] hover:bg-sky-500/10 active:scale-[0.98] transition-all text-left"
          >
            <div className="flex items-center gap-2 mb-0.5">
              <FastForward size={15} className="text-sky-500" />
              <span className="text-sm font-black text-sky-500">Too easy</span>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              Take a 2-minute level check and skip the cards you already know.
            </p>
          </button>

          <button
            onClick={onAboutRight}
            className="w-full p-4 rounded-xl border border-emerald-500/30 bg-[var(--bg-card)] hover:bg-emerald-500/10 active:scale-[0.98] transition-all text-left"
          >
            <div className="flex items-center gap-2 mb-0.5">
              <Check size={15} className="text-emerald-500" />
              <span className="text-sm font-black text-emerald-500">About right</span>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              Great – nothing changes, and we won't ask again.
            </p>
          </button>

          <button
            onClick={onTooHard}
            className="w-full p-4 rounded-xl border border-amber-500/30 bg-[var(--bg-card)] hover:bg-amber-500/10 active:scale-[0.98] transition-all text-left"
          >
            <div className="flex items-center gap-2 mb-0.5">
              <Feather size={15} className="text-amber-500" />
              <span className="text-sm font-black text-amber-500">Too hard</span>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              We'll ease off: new cards {easedLimitPreview.from} → {easedLimitPreview.to}/day.
              Reviews will consolidate what you've seen. Change anytime in Settings.
            </p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckInScreen;
