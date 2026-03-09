import React, { useState, useRef, useEffect } from 'react';
import { lookupWord, DictEntry } from '../data/dictionary/es';

interface WordPopoverProps {
  sentence: string;
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

const WordPopover: React.FC<WordPopoverProps> = ({ sentence, className = '' }) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [popoverPos, setPopoverPos] = useState<'above' | 'below'>('above');
  const containerRef = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);

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

    const entry = lookupWord(token);
    if (!entry) return;

    // Determine if popover should go above or below
    const wordEl = wordRefs.current[index];
    if (wordEl) {
      const rect = wordEl.getBoundingClientRect();
      setPopoverPos(rect.top > 200 ? 'above' : 'below');
    }

    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div ref={containerRef} className={`inline ${className}`}>
      {tokens.map((token, i) => {
        // Whitespace tokens
        if (token.trim() === '') return <span key={i}>{token}</span>;

        const entry = lookupWord(token);
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

            {/* Popover */}
            {isActive && entry && (
              <Popover entry={entry} position={popoverPos} />
            )}
          </span>
        );
      })}
    </div>
  );
};

const Popover: React.FC<{ entry: DictEntry; position: 'above' | 'below' }> = ({ entry, position }) => {
  return (
    <div
      className={`
        absolute z-50 left-1/2 -translate-x-1/2 w-52
        bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-lg
        p-3 animate-fade-in
        ${position === 'above' ? 'bottom-full mb-2' : 'top-full mt-2'}
      `}
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
      <div className="text-sm font-bold text-[var(--text-primary)] leading-snug">
        {entry.en}
      </div>

      {/* IPA */}
      <div className="text-xs text-blue-500 font-mono mt-1">
        /{entry.ipa}/
      </div>

      {/* Part of speech */}
      {entry.pos && (
        <div className="mt-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] bg-[var(--bg-inset)] px-1.5 py-0.5 rounded">
            {POS_LABELS[entry.pos] || entry.pos}
          </span>
        </div>
      )}
    </div>
  );
};

export default WordPopover;
