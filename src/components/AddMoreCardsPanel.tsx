import React, { useState } from 'react';
import { Plus } from 'lucide-react';

interface AddMoreCardsPanelProps {
  onStart: (count: number) => void;
  /** 'end-of-session' = compact panel inside review complete screen.
   *  'home' = home-page card shown when reviews queue is empty. */
  variant?: 'end-of-session' | 'home';
  defaultCount?: number;
}

/**
 * Shared UI for adding N more cards to today's queue. Used both at the
 * end of a study session AND on the home screen when the user is all
 * caught up but still wants to keep learning. Same visual language as
 * the rest of the app: stat-card container, uppercase micro-label, and
 * a primary-styled Start button that matches the top Study button.
 */
const AddMoreCardsPanel: React.FC<AddMoreCardsPanelProps> = ({
  onStart,
  variant = 'end-of-session',
  defaultCount = 10,
}) => {
  const [count, setCount] = useState(defaultCount);
  const isHome = variant === 'home';

  return (
    <div
      className={
        isHome
          ? 'w-full stat-card px-4 py-4 mb-2'
          : 'w-full p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]'
      }
    >
      <div className="flex items-center justify-center gap-1.5 mb-3">
        {isHome && <Plus size={14} className="text-[var(--text-secondary)]" />}
        <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
          {isHome ? 'Add more for today' : 'Add more cards'}
        </div>
      </div>

      <div className="flex items-stretch gap-2 mb-2.5">
        <button
          onClick={() => setCount(c => Math.max(1, c - 5))}
          className="w-14 rounded-xl border-2 border-[var(--border-color)] text-[var(--text-secondary)] text-lg font-bold hover:border-[var(--border-hover)] hover:text-[var(--text-primary)] active:scale-95 transition"
          aria-label="Decrease by 5"
        >
          −5
        </button>
        <input
          type="number"
          min={1}
          max={100}
          value={count}
          onChange={e => {
            const v = parseInt(e.target.value, 10);
            if (!isNaN(v) && v >= 1 && v <= 100) setCount(v);
          }}
          className="flex-1 rounded-xl text-center text-xl font-extrabold bg-[var(--bg-inset)] border-2 border-[var(--border-color)] text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none py-2 tabular-nums"
        />
        <button
          onClick={() => setCount(c => Math.min(100, c + 5))}
          className="w-14 rounded-xl border-2 border-[var(--border-color)] text-[var(--text-secondary)] text-lg font-bold hover:border-[var(--border-hover)] hover:text-[var(--text-primary)] active:scale-95 transition"
          aria-label="Increase by 5"
        >
          +5
        </button>
      </div>

      <button
        onClick={() => onStart(count)}
        className="w-full py-3 rounded-xl btn-primary text-sm font-bold uppercase tracking-wide"
      >
        {isHome ? `Study ${count} new` : 'Continue session'}
      </button>
    </div>
  );
};

export default AddMoreCardsPanel;
