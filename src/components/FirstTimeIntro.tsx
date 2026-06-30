import React from 'react';
import { Hand, Star, X } from 'lucide-react';

interface FirstTimeIntroProps {
  onDismiss: () => void;
}

/**
 * One-shot overlay shown on the very first study session, explaining the
 * two interactions that aren't otherwise obvious: tap-any-word for
 * definitions, and the Save pill that favorites the word for later review.
 * Dismissal is recorded in localStorage by the parent.
 */
const FirstTimeIntro: React.FC<FirstTimeIntroProps> = ({ onDismiss }) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
      onClick={onDismiss}
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-2xl p-6 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onDismiss}
          aria-label="Close intro"
          className="absolute top-3 right-3 text-[var(--text-muted)] hover:text-[var(--text-primary)] active:scale-95"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-black tracking-tight text-[var(--text-primary)] mb-1">
          Welcome to LangLab
        </h2>
        <p className="text-sm text-[var(--text-secondary)] mb-5">
          Two things worth knowing before you start.
        </p>

        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="shrink-0 w-9 h-9 rounded-lg bg-[var(--accent)]/15 text-[var(--accent)] flex items-center justify-center">
              <Hand size={18} />
            </div>
            <div className="flex-1">
              <div className="font-bold text-[var(--text-primary)] text-sm">
                Tap any word
              </div>
              <div className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Tap a word in the sentence to see its definition, pronunciation,
                and how it conjugates.
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="shrink-0 w-9 h-9 rounded-lg bg-yellow-400/15 text-yellow-600 flex items-center justify-center">
              <Star size={18} fill="currentColor" />
            </div>
            <div className="flex-1">
              <div className="font-bold text-[var(--text-primary)] text-sm">
                Save words you want to remember
              </div>
              <div className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Hit the <span className="font-bold">Save</span> pill on any word
                popover. Saved words live in the Library tab on the home screen.
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={onDismiss}
          className="mt-6 w-full py-3 rounded-xl bg-[var(--accent)] text-white font-bold text-sm tracking-wide active:scale-[0.98] transition-transform"
        >
          Got it
        </button>
      </div>
    </div>
  );
};

export default FirstTimeIntro;
