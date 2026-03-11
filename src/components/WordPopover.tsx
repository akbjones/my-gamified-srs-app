import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { lookupWord as lookupEs, DictEntry } from '../data/dictionary/es';
import { lookupWord as lookupIt } from '../data/dictionary/it';
import { Language } from '../types';

// Dynamic lookup per language — gracefully returns null for languages without a dictionary
const LOOKUP_FNS: Partial<Record<Language, (w: string) => DictEntry | null>> = {
  spanish: lookupEs,
  italian: lookupIt,
};

interface WordPopoverProps {
  sentence: string;
  language: Language;
  className?: string;
}

const POS_LABELS: Record<string, string> = {
  n: 'noun',
  v: 'verb',
  adj: 'adj',
  adv: 'adv',
  prep: 'prep',
  conj: 'conj',
  det: 'det',
  pron: 'pron',
};

const WordPopover: React.FC<WordPopoverProps> = ({ sentence, language, className = '' }) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [popoverRect, setPopoverRect] = useState<DOMRect | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);

  const lookup = useCallback(
    (word: string) => (LOOKUP_FNS[language] ?? (() => null))(word),
    [language],
  );

  // Tokenize: split on spaces, keeping punctuation attached to words
  const tokens = sentence.split(/(\s+)/).filter(Boolean);

  useEffect(() => {
    if (activeIndex === null) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActiveIndex(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [activeIndex]);

  const handleWordClick = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const token = tokens[index];
    if (!token || token.trim() === '') return;

    const entry = lookup(token);
    if (!entry) return;

    // Get the word element's viewport rect for portal positioning
    const wordEl = wordRefs.current[index];
    if (wordEl) {
      setPopoverRect(wordEl.getBoundingClientRect());
    }

    setActiveIndex(activeIndex === index ? null : index);
  };

  // Get the active entry for the portal popover
  const activeEntry = activeIndex !== null ? lookup(tokens[activeIndex]) : null;

  return (
    <div ref={containerRef} className={`inline ${className}`}>
      {tokens.map((token, i) => {
        // Whitespace tokens
        if (token.trim() === '') return <span key={i}>{token}</span>;

        const entry = lookup(token);
        const isActive = activeIndex === i;
        const hasEntry = entry !== null;

        return (
          <span key={i} className="relative inline-block">
            <span
              ref={(el) => { wordRefs.current[i] = el; }}
              onClick={(e) => handleWordClick(i, e)}
              className={`
                transition-all duration-150 cursor-pointer rounded-sm px-[1px] -mx-[1px]
                ${hasEntry ? 'hover:bg-blue-500/15 hover:text-blue-500' : ''}
                ${isActive ? 'bg-blue-500/15 text-blue-500' : ''}
              `}
            >
              {token}
            </span>
          </span>
        );
      })}

      {/* Portal popover — rendered at document body to escape overflow containers */}
      {activeEntry && popoverRect && (
        <PopoverPortal entry={activeEntry} wordRect={popoverRect} />
      )}
    </div>
  );
};

/** Fixed-position popover rendered via portal to escape overflow:hidden/auto parents */
const PopoverPortal: React.FC<{ entry: DictEntry; wordRect: DOMRect }> = ({ entry, wordRect }) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [measured, setMeasured] = useState(false);
  const [finalPos, setFinalPos] = useState({ top: 0, left: 0 });
  const [position, setPosition] = useState<'above' | 'below'>('above');

  useEffect(() => {
    if (!popoverRef.current) return;
    const popH = popoverRef.current.offsetHeight;
    const popW = popoverRef.current.offsetWidth;
    const gap = 8;

    // Prefer above; fall below if not enough room
    const goAbove = wordRect.top > popH + gap + 20;
    setPosition(goAbove ? 'above' : 'below');

    const top = goAbove
      ? wordRect.top - popH - gap
      : wordRect.bottom + gap;

    // Center horizontally on the word, clamped to viewport
    let left = wordRect.left + wordRect.width / 2 - popW / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - popW - 8));

    setFinalPos({ top, left });
    setMeasured(true);
  }, [wordRect]);

  return ReactDOM.createPortal(
    <div
      ref={popoverRef}
      className="fixed z-[9999] w-72 max-w-[90vw] bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-lg p-4 animate-fade-in"
      style={{
        top: finalPos.top,
        left: finalPos.left,
        opacity: measured ? 1 : 0,
        pointerEvents: measured ? 'auto' : 'none',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Arrow */}
      <div
        className={`
          absolute left-1/2 -translate-x-1/2 w-2.5 h-2.5
          bg-[var(--bg-card)] border-[var(--border-color)] rotate-45
          ${position === 'above'
            ? 'bottom-[-6px] border-r border-b'
            : 'top-[-6px] border-l border-t'
          }
        `}
      />

      {/* Translation */}
      <div className="text-base font-bold text-[var(--text-primary)] leading-snug">
        {entry.en}
      </div>

      {/* IPA */}
      <div className="text-sm text-blue-500 font-mono mt-1.5">
        /{entry.ipa}/
      </div>

      {/* Part of speech */}
      {entry.pos && (
        <div className="mt-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] bg-[var(--bg-inset)] px-1.5 py-0.5 rounded">
            {POS_LABELS[entry.pos] || entry.pos}
          </span>
        </div>
      )}
    </div>,
    document.body
  );
};

export default WordPopover;
