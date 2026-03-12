import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { lookupWord as lookupEs, DictEntry } from '../data/dictionary/es';
import { lookupWord as lookupIt } from '../data/dictionary/it';
import { lookupWord as lookupFr } from '../data/dictionary/fr';
import { conjugate as conjugateEs } from '../data/conjugation/es';
import { conjugate as conjugateIt } from '../data/conjugation/it';
import { conjugate as conjugateFr } from '../data/conjugation/fr';
import { Language, ConjugationTable } from '../types';

// Dynamic lookup per language — gracefully returns null for languages without a dictionary
const LOOKUP_FNS: Partial<Record<Language, (w: string) => DictEntry | null>> = {
  spanish: lookupEs,
  italian: lookupIt,
  french: lookupFr,
};

const CONJUGATE_FNS: Partial<Record<Language, (inf: string) => ConjugationTable | null>> = {
  spanish: conjugateEs,
  italian: conjugateIt,
  french: conjugateFr,
};

const PERSON_LABELS: Record<string, string[]> = {
  spanish: ['yo', 'tú', 'él', 'nosotros', 'vosotros', 'ellos'],
  italian: ['io', 'tu', 'lui', 'noi', 'voi', 'loro'],
  french: ['je', 'tu', 'il', 'nous', 'vous', 'ils'],
};

const DEFAULT_TENSE_LABELS: Record<string, string> = {
  present: 'Present',
  preterite: 'Preterite',
  imperfect: 'Imperfect',
  future: 'Future',
  conditional: 'Cond.',
  subjunctive: 'Subj.',
};

const TENSE_LABELS_BY_LANG: Partial<Record<string, Record<string, string>>> = {
  french: { ...DEFAULT_TENSE_LABELS, preterite: 'Passé C.' },
  italian: { ...DEFAULT_TENSE_LABELS, preterite: 'Passato' },
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
  const activeToken = activeIndex !== null ? tokens[activeIndex] : '';

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
        <PopoverPortal entry={activeEntry} rawToken={activeToken} wordRect={popoverRect} language={language} />
      )}
    </div>
  );
};

/** Extract infinitive from dictionary translation like "to open (abrir)" or "to eat" */
function extractInfinitive(translation: string): string | null {
  // Try parenthesized form first: "to open (abrir)"
  const parenMatch = translation.match(/\(([^)]+)\)/);
  if (parenMatch) return parenMatch[1].trim().toLowerCase();

  return null;
}

/** Fixed-position popover rendered via portal to escape overflow:hidden/auto parents */
const PopoverPortal: React.FC<{ entry: DictEntry; rawToken: string; wordRect: DOMRect; language: Language }> = ({ entry, rawToken, wordRect, language }) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [measured, setMeasured] = useState(false);
  const [finalPos, setFinalPos] = useState({ top: 0, left: 0 });
  const [position, setPosition] = useState<'above' | 'below'>('above');
  const [showConj, setShowConj] = useState(false);
  const [conjTense, setConjTense] = useState('present');

  // Try to get conjugation table for verbs
  const conjugation = useCallback((): ConjugationTable | null => {
    if (entry.pos !== 'v') return null;
    const conjugateFn = CONJUGATE_FNS[language];
    if (!conjugateFn) return null;

    // Try the raw token as-is (works when tapping an infinitive like "parler")
    const clean = rawToken.toLowerCase().replace(/[.,!?;:""«»()]/g, '');
    const direct = conjugateFn(clean);
    if (direct) return direct;

    // Try the infinitive from translation parenthetical: "to speak (parler)"
    const inf = extractInfinitive(entry.en);
    if (inf) {
      const result = conjugateFn(inf);
      if (result) return result;
    }

    // Try to reconstruct infinitive from the translation "to speak" pattern
    // by looking for common infinitive endings in the entry key
    const enTranslation = entry.en.toLowerCase();
    if (enTranslation.startsWith('to ')) {
      // For entries whose key IS the infinitive (e.g., "parler" -> { en: "to speak" })
      // The lookupWord may have resolved a conjugated form to this entry
      // Try common infinitive reconstructions from the conjugated form
      for (const ending of ['er', 'ir', 're']) {
        // Try the stem + ending: "parle" → "parl" + "er" = "parler"
        const stems = [clean];
        // Strip common conjugation suffixes
        if (clean.endsWith('e') || clean.endsWith('s') || clean.endsWith('t')) stems.push(clean.slice(0, -1));
        if (clean.endsWith('es') || clean.endsWith('ez') || clean.endsWith('nt') || clean.endsWith('ai') || clean.endsWith('as')) stems.push(clean.slice(0, -2));
        if (clean.endsWith('ent') || clean.endsWith('ons') || clean.endsWith('ais') || clean.endsWith('ait')) stems.push(clean.slice(0, -3));
        if (clean.endsWith('ions') || clean.endsWith('ient')) stems.push(clean.slice(0, -4));
        for (const stem of stems) {
          if (stem.length < 2) continue;
          const candidate = stem + ending;
          const r = conjugateFn(candidate);
          if (r) return r;
        }
      }
    }

    return null;
  }, [entry, rawToken, language]);

  const conjTable = conjugation();

  useEffect(() => {
    if (!popoverRef.current) return;
    const reposition = () => {
      if (!popoverRef.current) return;
      const popH = popoverRef.current.offsetHeight;
      const popW = popoverRef.current.offsetWidth;
      const gap = 8;

      const goAbove = wordRect.top > popH + gap + 20;
      setPosition(goAbove ? 'above' : 'below');

      const top = goAbove
        ? wordRect.top - popH - gap
        : wordRect.bottom + gap;

      let left = wordRect.left + wordRect.width / 2 - popW / 2;
      left = Math.max(8, Math.min(left, window.innerWidth - popW - 8));

      setFinalPos({ top, left });
      setMeasured(true);
    };
    reposition();
  }, [wordRect, showConj, conjTense]);

  const personLabels = PERSON_LABELS[language] || PERSON_LABELS.spanish;

  return ReactDOM.createPortal(
    <div
      ref={popoverRef}
      className="fixed z-[9999] w-72 max-w-[90vw] max-h-[70vh] overflow-y-auto bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-lg p-4 animate-fade-in"
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

      {/* Conjugation toggle */}
      {conjTable && (
        <div className="mt-3 pt-3 border-t border-[var(--border-color)]">
          <button
            onClick={() => setShowConj(!showConj)}
            className="text-[11px] font-bold text-blue-500 hover:text-blue-400 transition-colors uppercase tracking-wider"
          >
            {showConj ? 'Hide' : 'Show'} Conjugation
            {conjTable.isReflexive && ' (reflexive)'}
          </button>

          {showConj && (
            <div className="mt-2 animate-fade-in">
              {/* Tense tabs */}
              <div className="flex flex-wrap gap-1 mb-2">
                {Object.keys(conjTable.tenses).map(tense => (
                  <button
                    key={tense}
                    onClick={() => setConjTense(tense)}
                    className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider transition-all ${
                      conjTense === tense
                        ? 'bg-blue-500/15 text-blue-500'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                    }`}
                  >
                    {(TENSE_LABELS_BY_LANG[language] || DEFAULT_TENSE_LABELS)[tense] || tense}
                  </button>
                ))}
              </div>

              {/* Conjugation grid */}
              {conjTable.tenses[conjTense] && (
                <div className="space-y-1">
                  {conjTable.tenses[conjTense].map((form, i) => (
                    <div key={i} className="flex items-baseline gap-2">
                      <span className="text-[10px] text-[var(--text-faint)] font-mono w-16 text-right shrink-0">
                        {personLabels[i]}
                      </span>
                      <span className="text-xs text-[var(--text-primary)] font-semibold">
                        {form}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>,
    document.body
  );
};

export default WordPopover;
