import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { lookupWord as lookupEs, DictEntry } from '../data/dictionary/es';
import { lookupWord as lookupIt } from '../data/dictionary/it';
import { lookupWord as lookupFr } from '../data/dictionary/fr';
import { lookupWord as lookupPt } from '../data/dictionary/pt';
import { lookupWord as lookupDe } from '../data/dictionary/de';
import { lookupWord as lookupNl } from '../data/dictionary/nl';
import { lookupWord as lookupSv } from '../data/dictionary/sv';
import { lookupWord as lookupCy } from '../data/dictionary/cy';
import { lookupWord as lookupHi } from '../data/dictionary/hi';
import { lookupWord as lookupTr } from '../data/dictionary/tr';
import { lookupWord as lookupRu } from '../data/dictionary/ru';
import { conjugate as conjugateEs } from '../data/conjugation/es';
import { conjugate as conjugateIt } from '../data/conjugation/it';
import { conjugate as conjugateFr } from '../data/conjugation/fr';
import { conjugate as conjugatePt } from '../data/conjugation/pt';
import { conjugate as conjugateDe } from '../data/conjugation/de';
import { conjugate as conjugateNl } from '../data/conjugation/nl';
import { conjugate as conjugateSv } from '../data/conjugation/sv';
import { conjugate as conjugateCy } from '../data/conjugation/cy';
import { conjugateHindi } from '../data/conjugation/hi';
import { conjugate as conjugateTr } from '../data/conjugation/tr';
import { conjugate as conjugateRu } from '../data/conjugation/ru';
import { Language, ConjugationTable } from '../types';

// Dynamic lookup per language — gracefully returns null for languages without a dictionary
const LOOKUP_FNS: Partial<Record<Language, (w: string) => DictEntry | null>> = {
  spanish: lookupEs,
  italian: lookupIt,
  french: lookupFr,
  portuguese: lookupPt,
  german: lookupDe,
  dutch: lookupNl,
  swedish: lookupSv,
  welsh: lookupCy,
  hindi: lookupHi,
  turkish: lookupTr,
  russian: lookupRu,
};

const CONJUGATE_FNS: Partial<Record<Language, (inf: string) => ConjugationTable | null>> = {
  spanish: conjugateEs,
  italian: conjugateIt,
  french: conjugateFr,
  portuguese: conjugatePt,
  german: conjugateDe,
  dutch: conjugateNl,
  swedish: conjugateSv,
  welsh: conjugateCy,
  hindi: conjugateHindi,
  turkish: conjugateTr,
  russian: conjugateRu,
};

const PERSON_LABELS: Record<string, string[]> = {
  spanish: ['yo', 'tú', 'él', 'nosotros', 'vosotros', 'ellos'],
  italian: ['io', 'tu', 'lui', 'noi', 'voi', 'loro'],
  french: ['je', 'tu', 'il', 'nous', 'vous', 'ils'],
  portuguese: ['eu', 'tu', 'ele', 'nós', 'vós', 'eles'],
  german: ['ich', 'du', 'er/sie', 'wir', 'ihr', 'sie/Sie'],
  dutch: ['ik', 'jij', 'hij/zij', 'wij', 'jullie', 'zij'],
  swedish: ['jag', 'du', 'han/hon', 'vi', 'ni', 'de'],
  welsh: ['fi', 'ti', 'fe/hi', 'ni', 'chi', 'nhw'],
  hindi: ['मैं', 'तू', 'वह/यह', 'हम', 'तुम', 'आप/वे'],
  turkish: ['ben', 'sen', 'o', 'biz', 'siz', 'onlar'],
  russian: ['я', 'ты', 'он/она', 'мы', 'вы', 'они'],
};

// Fallback tense labels for legacy keys. Each conjugation engine now provides
// its own localized labels (e.g. "Presente (Present)") as tense object keys,
// so these only apply if a raw English key is encountered.
const TENSE_LABELS: Record<string, string> = {
  present: 'Present',
  preterite: 'Preterite',
  imperfect: 'Imperfect',
  future: 'Future',
  conditional: 'Conditional',
  subjunctive: 'Subjunctive',
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
  intj: 'intj',
  num: 'num',
  part: 'particle',
  postp: 'postp',
  name: 'name',
};

/** Sanitize/validate a definition before displaying it.
 *  Falls back to lemma definition when the inflected form's entry is a grammar description. */
function sanitizeDefinition(en: string, lemmaEn?: string): string | null {
  if (!en) return lemmaEn || null;

  // If definition looks like a grammar description, try lemma instead
  const GRAMMAR_PATTERNS = /^(strong|weak|mixed|nominative|accusative|genitive|dative|oblique|vocative|masculine|feminine|neuter|singular|plural|inflection|form|participle|imperfect|preterite|subjunctive|imperative|conditional|gerund|superlative|comparative|diminutive|augmentative)/i;

  if (GRAMMAR_PATTERNS.test(en)) {
    return lemmaEn || null; // Fall back to lemma's definition
  }

  // Strip wiki markup artifacts
  let cleaned = en
    .replace(/\[.*?\]/g, '') // Remove [with dative] etc
    .replace(/\((?:archaic|dated|colloquial|formal|informal|literary|rare|obsolete|regional|dialectal|vulgar|slang|figurative|literally|by extension|derogatory|humorous|euphemistic|pejorative)(?:,?\s*(?:archaic|dated|colloquial|formal|informal|literary|rare|obsolete|regional|dialectal|vulgar|slang|figurative|literally|by extension|derogatory|humorous|euphemistic|pejorative))*\)/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  // If it ends with "..." and is very short, it's truncated garbage
  if (cleaned.endsWith('...') && cleaned.length < 15) return lemmaEn || null;

  // Strip trailing "..."
  if (cleaned.endsWith('...')) cleaned = cleaned.replace(/\.\.\.+$/, '').trim();

  // If empty after cleaning, use lemma
  if (!cleaned || cleaned.length < 2) return lemmaEn || null;

  return cleaned;
}

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
function extractInfinitive(translation: string | null | undefined): string | null {
  if (!translation) return null;
  // Try parenthesized form first: "to open (abrir)"
  const parenMatch = translation.match(/\(([^)]+)\)/);
  if (parenMatch) return parenMatch[1].trim().toLowerCase();

  return null;
}

/** Fixed-position popover rendered via portal to escape overflow:hidden/auto parents */
const PopoverPortal: React.FC<{ entry: DictEntry; rawToken: string; wordRect: DOMRect; language: Language }> = ({ entry, rawToken, wordRect, language }) => {
  // Lemma-first lookup: if entry has a lemma, look it up for display
  const lemmaEntry = React.useMemo(() => {
    if (!entry.lemma) return null;
    const lookupFn = LOOKUP_FNS[language];
    if (!lookupFn) return null;
    return lookupFn(entry.lemma);
  }, [entry.lemma, language]);

  // Determine the display definition: prefer lemma's definition, sanitized
  const displayDefinition = React.useMemo(() => {
    try {
      const lemmaEn = lemmaEntry?.en;
      const sanitized = sanitizeDefinition(entry.en, lemmaEn);
      return sanitized || entry.en || 'unknown';
    } catch (e) {
      console.error('Definition error for', entry, e);
      return entry.en || 'unknown';
    }
  }, [entry.en, lemmaEntry]);

  // Display IPA: prefer lemma's IPA for inflected forms
  const displayIpa = (lemmaEntry?.ipa) || entry.ipa;
  const popoverRef = useRef<HTMLDivElement>(null);
  const [measured, setMeasured] = useState(false);
  const [finalPos, setFinalPos] = useState({ top: 0, left: 0 });
  const [position, setPosition] = useState<'above' | 'below'>('above');
  const [showConj, setShowConj] = useState(false);
  const [conjTense, setConjTense] = useState('present');

  // Try to get conjugation table for verbs
  const conjugation = useCallback((): ConjugationTable | null => {
    // Show conjugation if POS is verb OR if definition contains verb meaning ("to X")
    const hasVerbMeaning = entry.en?.includes('to ') || entry.pos === 'v';
    if (!hasVerbMeaning) return null;
    const conjugateFn = CONJUGATE_FNS[language];
    if (!conjugateFn) return null;

    // Try the raw token as-is (works when tapping an infinitive like "parler")
    const clean = rawToken.toLowerCase().replace(/[.,!?;:""«»()]/g, '');
    const direct = conjugateFn(clean);
    if (direct) return direct;

    // Try the lemma field (base/infinitive form) — most reliable for inflected forms
    if (entry.lemma) {
      const result = conjugateFn(entry.lemma);
      if (result) return result;
    }

    // Try the infinitive from translation parenthetical: "to speak (parler)"
    const inf = extractInfinitive(entry.en);
    if (inf) {
      const result = conjugateFn(inf);
      if (result) return result;
    }

    // Try to reconstruct infinitive from conjugated form
    // Validate all candidates against dictionary to avoid fake verbs
    // (e.g., "agissons" should find "agir", not create fake "agisser")
    const lookupFn = LOOKUP_FNS[language];
    if (lookupFn) {
      // Generate candidate stems by progressively trimming from the end
      // Include the full word as a stem — Germanic verbs like "ontmoet" need
      // stem + "en" → "ontmoeten" to find the infinitive
      const stems = new Set<string>();
      stems.add(clean);
      for (let i = 1; i <= Math.min(clean.length - 2, 7); i++) {
        stems.add(clean.slice(0, -i));
      }
      for (const stem of stems) {
        // IMPORTANT: When adding a new language, add its infinitive endings here!
        // Romance: -ir, -er, -re, -ar, -or  |  Germanic: -en, -ern, -eln, -n
        // Swedish: -a, -e  |  Turkish: -mek, -mak  |  Hindi: -ना (-nā)
        // Russian: -ать, -ять, -еть, -уть, -оть, -ыть, -ить, -ти, -чь, -ться, -тись
        for (const ending of [
          'ir', 'er', 're', 'ar', 'or',          // Romance
          'en', 'ern', 'eln', 'n',                // Germanic (DE/NL)
          'a', 'e',                                // Swedish
          'mek', 'mak',                            // Turkish
          'ना',                                     // Hindi
          'ать', 'ять', 'еть', 'уть', 'оть',     // Russian (-ать/-ять/-еть/-уть/-оть)
          'ыть', 'ить', 'ть', 'ти', 'чь',         // Russian (-ыть/-ить/-ть/-ти/-чь)
          'ться', 'тись',                           // Russian reflexive
        ]) {
          const candidate = stem + ending;
          const dictEntry = lookupFn(candidate);
          if (dictEntry?.pos === 'v') {
            const r = conjugateFn(candidate);
            if (r) return r;
          }
        }
      }
    }

    return null;
  }, [entry, rawToken, language]);

  let conjTable: ConjugationTable | null = null;
  try { conjTable = conjugation(); } catch (e) { console.error('Conjugation error for', rawToken, ':', e); }

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

      {/* Translation — uses lemma definition when available and sanitized */}
      <div className="text-base font-bold text-[var(--text-primary)] leading-snug">
        {displayDefinition}
      </div>

      {/* Lemma (base form) — always shown with arrow format for consistency */}
      {entry.lemma && (
        <div className="text-sm text-[var(--text-muted)] mt-0.5">
          → {entry.lemma}
        </div>
      )}

      {/* IPA — prefers lemma IPA for inflected forms */}
      {displayIpa && (
        <div className="text-sm text-blue-500 font-mono mt-1.5">
          /{displayIpa}/
        </div>
      )}

      {/* Part of speech */}
      {entry.pos && (
        <div className="mt-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] bg-[var(--bg-inset)] px-1.5 py-0.5 rounded">
            {POS_LABELS[entry.pos] || entry.pos}
          </span>
        </div>
      )}

      {/* Flag this word as wrong */}
      <div className="mt-3 pt-3 border-t border-[var(--border-color)]">
        <button
          onClick={async () => {
            const btn = document.activeElement as HTMLElement;
            const originalText = '⚑ Flag as wrong';
            if (btn) btn.textContent = '⏳ Sending...';

            const flagEntry = {
              language,
              word: rawToken,
              currentTranslation: entry.en || '',
              currentPos: entry.pos || '',
              timestamp: Date.now(),
            };

            // Save locally too (backup)
            const flags = JSON.parse(localStorage.getItem('quest_flagged_words') || '[]');
            if (!flags.find((f: any) => f.language === language && f.word === rawToken)) {
              flags.push(flagEntry);
              localStorage.setItem('quest_flagged_words', JSON.stringify(flags));
            }

            // POST to Netlify Forms
            try {
              const formData = new URLSearchParams();
              formData.append('form-name', 'word-flag');
              formData.append('language', language);
              formData.append('word', rawToken);
              formData.append('currentTranslation', entry.en || '');
              formData.append('currentPos', entry.pos || '');
              formData.append('sentence', '');
              formData.append('suggestion', '');
              await fetch('/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData.toString(),
              });
              if (btn) btn.textContent = '✓ Sent. Thanks!';
            } catch (e) {
              if (btn) btn.textContent = '✓ Saved locally';
            }
            setTimeout(() => { if (btn) btn.textContent = originalText; }, 2000);
          }}
          className="text-[10px] font-medium text-[var(--text-muted)] hover:text-orange-500 transition-colors"
        >
          ⚑ Flag as wrong
        </button>
      </div>

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
                    {TENSE_LABELS[tense] || tense}
                  </button>
                ))}
              </div>

              {/* Conjugation grid */}
              {conjTable.tenses[conjTense] && (
                <div className="space-y-1">
                  {conjTable.tenses[conjTense].map((form, i) => (
                    <div key={i} className="flex items-baseline gap-2">
                      <span className="text-[10px] text-[var(--text-faint)] font-mono w-16 text-right shrink-0">
                        {language === 'french' && i === 0 && /^[aeéèêëiîïoôuûùüyh]/i.test(form)
                          ? "j'"
                          : personLabels[i]}
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

// Error boundary to prevent WordPopover crashes from taking down the whole app
class WordPopoverErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('WordPopover crashed:', error.message, info.componentStack);
  }
  render() {
    if (this.state.hasError) {
      // Reset on next render cycle so user can try clicking another word
      setTimeout(() => this.setState({ hasError: false, error: null }), 2000);
      return this.props.children; // Still render the sentence, just without the popover
    }
    return this.props.children;
  }
}

const SafeWordPopover: React.FC<React.ComponentProps<typeof WordPopover>> = (props) => (
  <WordPopoverErrorBoundary>
    <WordPopover {...props} />
  </WordPopoverErrorBoundary>
);

export default SafeWordPopover;
