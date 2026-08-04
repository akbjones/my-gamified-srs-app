import React from 'react';
import { Hand, Star, X } from 'lucide-react';

export interface IntroItem {
  icon: React.ReactNode;
  /** Tailwind classes for the icon chip, e.g. "bg-[var(--accent)]/15 text-[var(--accent)]" */
  tone: string;
  title: string;
  body: React.ReactNode;
}

interface FirstTimeIntroProps {
  onDismiss: () => void;
  /** Override the default tap-a-word / save-a-word content. */
  title?: string;
  subtitle?: string;
  items?: IntroItem[];
  cta?: string;
}

/**
 * One-shot overlay shown on the very first study session, explaining the
 * two interactions that aren't otherwise obvious: tap-any-word for
 * definitions, and the Save pill that favorites the word for later review.
 * Dismissal is recorded in localStorage by the parent.
 */
const DEFAULT_ITEMS: IntroItem[] = [
  {
    icon: <Hand size={18} />,
    tone: 'bg-[var(--accent)]/15 text-[var(--accent)]',
    title: 'Tap any word',
    body: 'Tap a word in the sentence to see its definition, pronunciation, and how it conjugates.',
  },
  {
    icon: <Star size={18} fill="currentColor" />,
    tone: 'bg-yellow-400/15 text-yellow-600',
    title: 'Save words you want to remember',
    body: <>Hit the <span className="font-bold">Save</span> pill on any word popover. Saved words live in the Library tab on the home screen.</>,
  },
];

const FirstTimeIntro: React.FC<FirstTimeIntroProps> = ({ onDismiss, title, subtitle, items, cta }) => {
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
          {title ?? 'Welcome to LangLab'}
        </h2>
        <p className="text-sm text-[var(--text-secondary)] mb-5">
          {subtitle ?? 'Two things worth knowing before you start.'}
        </p>

        <div className="space-y-4">
          {(items ?? DEFAULT_ITEMS).map((item, i) => (
            <div key={i} className="flex gap-3">
              <div className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${item.tone}`}>
                {item.icon}
              </div>
              <div className="flex-1">
                <div className="font-bold text-[var(--text-primary)] text-sm">
                  {item.title}
                </div>
                <div className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {item.body}
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onDismiss}
          className="mt-6 w-full py-3 rounded-xl bg-[var(--accent)] text-white font-bold text-sm tracking-wide active:scale-[0.98] transition-transform"
        >
          {cta ?? 'Got it'}
        </button>
      </div>
    </div>
  );
};

export default FirstTimeIntro;
