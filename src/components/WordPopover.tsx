import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { Star, X as CloseIcon, BookText } from 'lucide-react';
import { toggleFavorite, isFavorited, toggleEtymologyFavorite, isEtymologyFavorited } from '../services/storageService';
import { lookupEtymology } from '../services/etymologyService';
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

// Dynamic lookup per language – gracefully returns null for languages without a dictionary
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

// Pronoun → person index. Used to disambiguate ambiguous form matches
// using sentence context. E.g. German "spielen" matches both wir (3) and
// sie (5) — finding "wir" in the sentence picks 3; finding nothing picks
// 3rd person by default (since "die Kinder spielen" without an explicit
// "sie" is still 3pl, not 1pl).
//
// Ambiguous pronouns (German "sie" = she/they/Sie-formal, Dutch "ze"
// = she/they) are deliberately omitted — better to fall back to the
// 3rd-person default than to guess wrong.
const PRONOUN_INDEX: Record<string, Record<string, number>> = {
  spanish: { yo: 0, 'tú': 1, tu: 1, 'él': 2, ella: 2, usted: 2, ud: 2, nosotros: 3, nosotras: 3, vosotros: 4, vosotras: 4, ellos: 5, ellas: 5, ustedes: 5, uds: 5 },
  italian: { io: 0, tu: 1, lui: 2, lei: 2, noi: 3, voi: 4, loro: 5 },
  french: { je: 0, "j'": 0, tu: 1, il: 2, elle: 2, on: 2, nous: 3, vous: 4, ils: 5, elles: 5 },
  portuguese: { eu: 0, tu: 1, ele: 2, ela: 2, 'você': 2, voce: 2, vc: 2, 'nós': 3, nos: 3, 'vós': 4, vos: 4, eles: 5, elas: 5, 'vocês': 5, voces: 5 },
  german: { ich: 0, du: 1, er: 2, es: 2, wir: 3, ihr: 4 },
  dutch: { ik: 0, jij: 1, je: 1, hij: 2, het: 2, wij: 3, we: 3, jullie: 4 },
  swedish: { jag: 0, du: 1, han: 2, hon: 2, den: 2, det: 2, vi: 3, ni: 4, de: 5, dom: 5 },
  welsh: { fi: 0, ti: 1, fe: 2, hi: 2, ni: 3, chi: 4, nhw: 5 },
  hindi: { 'मैं': 0, 'तू': 1, 'वह': 2, 'यह': 2, 'हम': 3, 'तुम': 4, 'आप': 5, 'वे': 5 },
  turkish: { ben: 0, sen: 1, o: 2, biz: 3, siz: 4, onlar: 5 },
  russian: { 'я': 0, 'ты': 1, 'он': 2, 'она': 2, 'мы': 3, 'вы': 4, 'они': 5 },
};

// Tie-break order when multiple form rows match and no pronoun in context
// resolves it. 3rd-person first because cards typically describe others
// ("die Kinder spielen", "ele tem") without an explicit pronoun. 1st/2nd
// person always require an explicit pronoun in most languages — if no
// pronoun is present, those persons are unlikely intent.
const PERSON_TIEBREAK = [2, 5, 3, 0, 1, 4];

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

      {/* Portal popover – rendered at document body to escape overflow containers */}
      {activeEntry && popoverRect && (
        <PopoverPortal
          entry={activeEntry}
          rawToken={activeToken}
          wordRect={popoverRect}
          language={language}
          sentence={sentence}
          onDismiss={() => setActiveIndex(null)}
        />
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
const PopoverPortal: React.FC<{
  entry: DictEntry;
  rawToken: string;
  wordRect: DOMRect;
  language: Language;
  sentence: string;
  onDismiss: () => void;
}> = ({ entry, rawToken, wordRect, language, sentence, onDismiss }) => {
  // Local state mirroring favorite status so the star icon updates on click.
  const [isFav, setIsFav] = useState(() => isFavorited(rawToken, language));
  // Etymology expand/collapse – collapsed by default so the entry shows up
  // as a small tab the user opens deliberately.
  const [etymologyExpanded, setEtymologyExpanded] = useState(false);
  // Local mirror of etymology favorite state so the Save toggle flips
  // immediately on tap without needing to close/reopen the modal.
  const [etyFavSnapshot, setEtyFavSnapshot] = useState(false);
  useEffect(() => {
    if (etymologyExpanded) {
      try { setEtyFavSnapshot(isEtymologyFavorited(rawToken, language)); } catch {}
    }
  }, [etymologyExpanded, rawToken, language]);
  useEffect(() => {
    setIsFav(isFavorited(rawToken, language));
  }, [rawToken, language]);
  // Russian aspect-pair swap state. Hoisted above lemmaEntry because that
  // memo reads it. Reset whenever the conjugation overlay closes.
  const [swappedTo, setSwappedTo] = useState<string | null>(null);

  // Lemma-first lookup: if entry has a lemma, look it up for display.
  // When the aspect-pair swap is active, look up THAT verb instead so the
  // header title, English meaning, and aspect badge all reflect the swap.
  const lemmaEntry = React.useMemo(() => {
    const target = swappedTo || entry.lemma;
    if (!target) return null;
    const lookupFn = LOOKUP_FNS[language];
    if (!lookupFn) return null;
    return lookupFn(target);
  }, [swappedTo, entry.lemma, language]);

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
  // Tracks whether the user has manually picked a tense – if so, we stop
  // auto-switching when the modal re-opens for the same word.
  const [userPickedTense, setUserPickedTense] = useState(false);
  // swappedTo is declared earlier (hoisted) so the lemmaEntry memo can read
  // it. Reset whenever the overlay closes so the next open starts fresh.
  useEffect(() => { if (!showConj) setSwappedTo(null); }, [showConj]);

  // Try to get conjugation table for verbs
  const conjugation = useCallback((): ConjugationTable | null => {
    const conjugateFn = CONJUGATE_FNS[language];
    if (!conjugateFn) return null;

    // Aspect-pair swap takes precedence — when the user clicks the pair link
    // we just conjugate the target verb directly, no fallback chain.
    if (swappedTo) return conjugateFn(swappedTo);

    // Show conjugation if POS is verb OR if definition contains verb meaning ("to X")
    const hasVerbMeaning = entry.en?.includes('to ') || entry.pos === 'v';
    if (!hasVerbMeaning) return null;

    const clean = rawToken.toLowerCase().replace(/[.,!?;:""«»()]/g, '');

    // Lemma FIRST when the dict entry is inflected. A `lemma` field on a
    // dict entry means "this is an inflected form; the real infinitive is
    // X" — so we MUST go to X to get the correct table. Without this we
    // hit the bug where conjugatePt("quer") happily returns a fake -er
    // verb on stem "qu" (forms: quo, ques, que, ...) instead of resolving
    // to "querer". The fake table title showed "quer", the row matcher
    // couldn't find "quer" anywhere in those fake forms, and the "used on
    // this card" banner never fired.
    if (entry.lemma) {
      const result = conjugateFn(entry.lemma);
      if (result) return result;
    }

    // No lemma in the entry (or the lemma engine call failed) — try the
    // raw token itself. Works when tapping a real infinitive like "parler"
    // that has no `lemma` field of its own.
    const direct = conjugateFn(clean);
    if (direct) return direct;

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
      // Include the full word as a stem – Germanic verbs like "ontmoet" need
      // stem + "en" → "ontmoeten" to find the infinitive
      const stems = new Set<string>();
      stems.add(clean);
      for (let i = 1; i <= Math.min(clean.length - 2, 7); i++) {
        stems.add(clean.slice(0, -i));
      }
      // Local normalize for matching forms against the input token.
      const norm = (s: string) =>
        s.toLowerCase().replace(/\s+/g, '').normalize('NFD').replace(/[̀-ͯ]/g, '');
      const tokenNorm = norm(clean);

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
          // Fallback: candidate isn't in the dictionary, but the conjugation
          // engine still generates a table. Accept it ONLY if the input token
          // actually appears as one of the generated forms – that proves the
          // candidate is the real infinitive, not nonsense like "agisser".
          // Catches verbs missing from the dict (e.g. Spanish "despedir" from
          // "despedimos") without inventing fake verbs.
          else if (!dictEntry) {
            const r = conjugateFn(candidate);
            if (r) {
              for (const forms of Object.values(r.tenses)) {
                if (forms.some(f => f && f !== '-' && norm(f) === tokenNorm)) {
                  return r;
                }
              }
            }
          }
        }
      }
    }

    return null;
  }, [entry, rawToken, language, swappedTo]);

  let conjTable: ConjugationTable | null = null;
  try { conjTable = conjugation(); } catch (e) { console.error('Conjugation error for', rawToken, ':', e); }

  // Two normalize layers. Both strip leading/trailing punctuation so a tapped
  // word like "entendo," (with a comma from the sentence) still matches the
  // form "entendo" in the table. Strict preserves diacritics so we can
  // distinguish "tem" (3sg, no accent) from "têm" (3pl, circumflex) in
  // Portuguese — same letters, different forms. Loose strips accents as a
  // tolerant fallback for cases like a user tapping "ecris" when the table
  // has "j'écris".
  const stripPunct = (s: string) => s.replace(/[.,!?;:""''«»()¿¡—–\-।॥]/g, '');
  // French elision: tokens like "j'aurais", "m'avais", "n'est", "qu'on" carry
  // a contraction prefix that the conjugation engine never emits. Strip it
  // for matching purposes so the verb form alone matches the table row.
  const stripFrenchElision = (s: string): string => {
    if (language !== 'french') return s;
    return s.replace(/^(qu|j|m|t|s|n|l|d|c)'/, '');
  };
  const strict = (s: string) => stripPunct(stripFrenchElision(s).toLowerCase()).replace(/\s+/g, '');
  const loose  = (s: string) => strict(s).normalize('NFD').replace(/[̀-ͯ]/g, '');
  const normalize = loose;        // keep available for any out-of-block callers
  const strictToken = strict(rawToken);
  const looseToken  = loose(rawToken);
  const normalizedToken = looseToken;

  // For each tense, the exact form-row index the user tapped — -1 if no match.
  //
  //   1. Strict pass collects ALL rows whose form equals the tapped token
  //      (case-folded, accents preserved — so "tem" doesn't match "têm").
  //   2. If only one strict match, use it.
  //   3. If multiple (e.g. German "spielen" = wir/sie/Sie share the form),
  //      look for a pronoun in the sentence that points at one of them.
  //   4. Otherwise tie-break by PERSON_TIEBREAK (3sg/3pl preferred over 1/2
  //      person, because cards without an explicit pronoun usually describe
  //      a 3rd-person subject — "die Kinder spielen", not "we play").
  //   5. If no strict match at all, repeat with loose (accent-stripped) match
  //      as a tolerant fallback.
  const matchedIndexPerTense = React.useMemo(() => {
    const out: Record<string, number> = {};
    if (!conjTable) return out;

    // Detect pronouns nearby in the sentence — these break ties when the form
    // matches multiple person rows.
    const pronouns = PRONOUN_INDEX[language] || {};
    const tokens = sentence
      .toLowerCase()
      .replace(/[.,!?;:""''«»()¿¡]/g, '')
      .split(/\s+/)
      .filter(Boolean);
    const personsInContext = new Set<number>();
    for (const w of tokens) {
      if (w in pronouns) personsInContext.add(pronouns[w]);
    }

    const pickBest = (matches: number[]): number => {
      if (matches.length === 0) return -1;
      if (matches.length === 1) return matches[0];
      const ctxHit = matches.find(i => personsInContext.has(i));
      if (ctxHit !== undefined) return ctxHit;
      for (const p of PERSON_TIEBREAK) if (matches.includes(p)) return p;
      return matches[0];
    };

    // Word-level helpers — needed because compound conjugation forms span
    // multiple words ("देता हूँ", "ho mangiato", "j'ai mangé", "ich habe
    // gegessen"). The user taps ONE word, but the whole-string comparison
    // never matches. Splitting the form on whitespace and matching the
    // tapped token against any of its words resolves this for every
    // compound-tense language at once.
    const stripPunctLocal = (s: string) => s.replace(/[.,!?;:""''«»()¿¡—–\-।॥]/g, '');
    // Split on whitespace AND slash. Engines emit slash-joined alternates for
    // gender (Russian past "встречался/встречалась") and stress-variant
    // imperatives (Russian "позволи/позволь", "позволите/позвольте"). Both
    // need to be matchable as separate words.
    const wordsOf = (form: string) =>
      form.split(/[\s/]+/).map(w => stripPunctLocal(w.toLowerCase())).filter(Boolean);
    const formContainsWord = (form: string, normFn: (s: string) => string, target: string) =>
      wordsOf(form).some(w => normFn(w) === target);

    for (const [tense, forms] of Object.entries(conjTable.tenses)) {
      // Pass 1 — strict full-string match (preserves accents).
      const strictMatches: number[] = [];
      forms.forEach((f, i) => {
        if (f && f !== '-' && strict(f) === strictToken) strictMatches.push(i);
      });
      if (strictMatches.length > 0) {
        out[tense] = pickBest(strictMatches);
        continue;
      }
      // Pass 2 — loose full-string match (accent-stripped).
      const looseMatches: number[] = [];
      forms.forEach((f, i) => {
        if (f && f !== '-' && loose(f) === looseToken) looseMatches.push(i);
      });
      if (looseMatches.length > 0) {
        out[tense] = pickBest(looseMatches);
        continue;
      }
      // Pass 3 — word-level strict match. Splits the form on whitespace and
      // checks if any word matches the tapped token. Catches Hindi "देता हूँ",
      // Italian "ho mangiato", French "j'ai mangé", German "habe gegessen".
      const wordStrictMatches: number[] = [];
      forms.forEach((f, i) => {
        if (f && f !== '-' && formContainsWord(f, s => stripPunctLocal(s).replace(/\s+/g,''), strictToken)) wordStrictMatches.push(i);
      });
      if (wordStrictMatches.length > 0) {
        out[tense] = pickBest(wordStrictMatches);
        continue;
      }
      // Pass 4 — word-level loose match.
      const wordLooseMatches: number[] = [];
      forms.forEach((f, i) => {
        if (f && f !== '-' && formContainsWord(f, s => loose(s), looseToken)) wordLooseMatches.push(i);
      });
      if (wordLooseMatches.length > 0) {
        out[tense] = pickBest(wordLooseMatches);
        continue;
      }
      // Pass 5 — German colloquial -e drop. Speakers commonly drop the final
      // -e from 1sg present ("ich hab" instead of "ich habe", "ich sag"
      // instead of "ich sage"). The engine emits the formal -e form, so add
      // an "e" to the tapped token and retry.
      if (language === 'german') {
        const augmented = strictToken + 'e';
        const augLoose  = looseToken + 'e';
        const augStrictMatches: number[] = [];
        forms.forEach((f, i) => {
          if (f && f !== '-' && strict(f) === augmented) augStrictMatches.push(i);
        });
        if (augStrictMatches.length > 0) {
          out[tense] = pickBest(augStrictMatches);
          continue;
        }
        const augLooseMatches: number[] = [];
        forms.forEach((f, i) => {
          if (f && f !== '-' && loose(f) === augLoose) augLooseMatches.push(i);
        });
        out[tense] = pickBest(augLooseMatches);
        continue;
      }
      // Pass 5 — Welsh consonant mutations. The engine emits the radical (base)
      // form (e.g. "clywed", "rhedeg", "gallu") but on cards the form may be
      // soft-mutated by a triggering preposition or particle:
      //   c → g    (clywed → glywed)
      //   p → b    (pen → ben)
      //   t → d    (tad → dad)
      //   g → Ø    (gallu → allu — the G is dropped entirely)
      //   b → f    (bod → fod)
      //   d → dd   (dod → ddod)
      //   m → f    (mam → fam)
      //   ll → l   (llaeth → laeth)
      //   rh → r   (rhedeg → redeg)
      // For each tapped form try its de-mutated variants and re-match.
      if (language === 'welsh') {
        const variants: string[] = [];
        const tok = strictToken;
        if (tok.length > 0) {
          const c0 = tok.charAt(0);
          if (c0 === 'g') variants.push('c' + tok.slice(1));        // glywed → clywed
          if (c0 === 'b') variants.push('p' + tok.slice(1));        // ben → pen
          if (c0 === 'd' && tok.charAt(1) !== 'd') variants.push('t' + tok.slice(1));
          if (c0 === 'f') {
            variants.push('b' + tok.slice(1));                       // fod → bod
            variants.push('m' + tok.slice(1));                       // fam → mam
          }
          if (tok.startsWith('dd')) variants.push('d' + tok.slice(2));    // ddod → dod
          if (c0 === 'l' && tok.charAt(1) !== 'l') variants.push('ll' + tok.slice(1));  // laeth → llaeth
          if (c0 === 'r' && tok.charAt(1) !== 'h') variants.push('rh' + tok.slice(1));  // redeg → rhedeg
          // G-drop: vowel-initial token may be a g-dropped soft mutation
          if ('aeiouwy'.includes(c0)) variants.push('g' + tok);     // allwch → gallwch
        }
        let matched = -1;
        const wordsOf = (f: string) => f.split(/\s+/).map(w => stripPunct(w.toLowerCase())).filter(Boolean);
        for (const v of variants) {
          forms.forEach((f, i) => {
            if (matched !== -1) return;
            if (!f || f === '-') return;
            if (strict(f) === v || loose(f) === v) { matched = i; return; }
            // Word-level: engine emits "gallwch chi" / "yn rhedeg" etc.
            if (wordsOf(f).some(w => strict(w) === v || loose(w) === v)) matched = i;
          });
          if (matched !== -1) break;
        }
        if (matched !== -1) { out[tense] = matched; continue; }
      }
      out[tense] = -1;
    }
    return out;
  }, [conjTable, strictToken, looseToken, sentence, language]);

  // For each tense, record whether it contains the matched form.
  // This drives both the tab indicator (a small dot) and the auto-open tense.
  const tenseHasMatch = React.useMemo(() => {
    const out: Record<string, boolean> = {};
    for (const [tense, idx] of Object.entries(matchedIndexPerTense)) out[tense] = idx !== -1;
    return out;
  }, [matchedIndexPerTense]);

  // Locate the matched form's exact tense + person so the "on this card" banner
  // can spell it out for the user before they even read the table.
  const matchedFormInfo = React.useMemo(() => {
    if (!conjTable) return null;
    const labels = PERSON_LABELS[language] || PERSON_LABELS.spanish;
    for (const [tense, forms] of Object.entries(conjTable.tenses)) {
      const idx = matchedIndexPerTense[tense];
      if (idx !== undefined && idx !== -1) {
        const rawTense = TENSE_LABELS[tense] || tense;
        const tenseShort = rawTense.replace(/\s*\([^)]+\)\s*$/, '').trim().toLowerCase();
        return { tense, tenseShort, form: forms[idx], personLabel: labels[idx], isInfinitive: false };
      }
    }
    // No row matched. Detect the "user tapped the infinitive itself" case so
    // we can show a friendly badge instead of a blank header — saves the
    // table looking broken when it's just the dictionary form.
    if (conjTable.infinitive) {
      const infNorm = strict(conjTable.infinitive);
      if (infNorm === strictToken || loose(conjTable.infinitive) === looseToken) {
        return { tense: '', tenseShort: '', form: conjTable.infinitive, personLabel: '', isInfinitive: true };
      }
    }
    return null;
  }, [conjTable, normalizedToken, strictToken, looseToken, language]);

  // When the modal opens for a new word, auto-pick the first tense that
  // contains the matched form. Only fires once per modal-open – if the
  // user then taps a different tab, we don't fight them.
  useEffect(() => {
    if (!showConj || !conjTable || userPickedTense) return;
    const firstMatch = Object.entries(tenseHasMatch).find(([, hit]) => hit)?.[0];
    if (firstMatch && firstMatch !== conjTense) {
      setConjTense(firstMatch);
    }
  }, [showConj, conjTable, tenseHasMatch, userPickedTense, conjTense]);

  // Reset userPickedTense when the modal closes, so the next open re-runs
  // the auto-select logic for a potentially different word.
  useEffect(() => {
    if (!showConj) setUserPickedTense(false);
  }, [showConj]);

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
    <>
      {/* Transparent backdrop: click anywhere on the screen to dismiss the
          popover (including the conjugation table inside it). Sits below
          the popover but above everything else. Uses onMouseDown so it
          fires before any underlying click/tap can register on app UI. */}
      <div
        className="fixed inset-0 z-[9998]"
        style={{ background: 'transparent' }}
        onMouseDown={onDismiss}
        onTouchStart={onDismiss}
      />
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
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
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

      {/* Favorite button – pill-style with label, top-right. Far more visible
          than a bare icon so users actually realise they can save words. */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleFavorite(rawToken, language, {
            translation: displayDefinition || entry.en || '',
            ipa: displayIpa || '',
            pos: entry.pos,
            lemma: entry.lemma,
            example: sentence,
          });
          setIsFav(prev => !prev);
        }}
        aria-label={isFav ? 'Remove from favourites' : 'Add to favourites'}
        className={`absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 ${
          isFav
            ? 'bg-yellow-400/15 text-yellow-600 border border-yellow-400/40'
            : 'bg-[var(--bg-inset)] text-[var(--text-muted)] border border-[var(--border-color)] hover:border-yellow-400/40 hover:text-yellow-500'
        }`}
      >
        <Star size={12} fill={isFav ? 'currentColor' : 'none'} />
        <span>{isFav ? 'Saved' : 'Save'}</span>
      </button>

      {/* Translation – uses lemma definition when available and sanitized.
          pr-16 leaves room for the Save pill on the right. */}
      <div className="text-base font-bold text-[var(--text-primary)] leading-snug pr-16">
        {displayDefinition}
      </div>

      {/* Lemma (base form) – always shown with arrow format for consistency */}
      {entry.lemma && (
        <div className="text-sm text-[var(--text-muted)] mt-0.5">
          → {entry.lemma}
        </div>
      )}

      {/* IPA – prefers lemma IPA for inflected forms */}
      {displayIpa && (
        <div className="text-sm text-blue-500 font-mono mt-1.5">
          /{displayIpa}/
        </div>
      )}

      {/* Part of speech chip – small, neutral. */}
      {entry.pos && (
        <div className="mt-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] bg-[var(--bg-inset)] px-1.5 py-0.5 rounded">
            {POS_LABELS[entry.pos] || entry.pos}
          </span>
        </div>
      )}

      {/* Etymology – when this word has a verified entry, surface it as a
          full-width violet button so it's impossible to miss. Opens the
          centered violet overlay (mirroring the amber grammar tip). */}
      {lookupEtymology(rawToken, language) && (
        <button
          onClick={(e) => { e.stopPropagation(); setEtymologyExpanded(true); }}
          className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-300 bg-violet-500/10 border border-violet-500/40 hover:bg-violet-500/15 transition-all active:scale-95"
        >
          <BookText size={14} />
          <span>See etymology</span>
        </button>
      )}

      {/* Conjugation: open full-screen modal */}
      {conjTable && (
        <div className="mt-3 pt-3 border-t border-[var(--border-color)]">
          <button
            onClick={(e) => { e.stopPropagation(); setShowConj(true); }}
            className="text-[11px] font-bold text-blue-500 hover:text-blue-400 transition-colors uppercase tracking-wider flex items-center gap-1"
          >
            View conjugation
            {conjTable.isReflexive && <span className="text-[var(--text-muted)] font-normal">(reflexive)</span>}
            <span aria-hidden="true">↗</span>
          </button>
        </div>
      )}

      {/* Flag this word as wrong – bottom-right of the popover, small text
          so it never competes with the translation / cognate content above. */}
      <div className="mt-2 flex justify-end">
        <button
          onClick={() => {
            // 1) Persist the flag to localStorage synchronously — this is the
            //    real "save" path. Anything below is best-effort telemetry.
            const flagEntry = {
              language,
              word: rawToken,
              currentTranslation: entry.en || '',
              currentPos: entry.pos || '',
              timestamp: Date.now(),
            };
            const flags = JSON.parse(localStorage.getItem('quest_flagged_words') || '[]');
            if (!flags.find((f: any) => f.language === language && f.word === rawToken)) {
              flags.push(flagEntry);
              localStorage.setItem('quest_flagged_words', JSON.stringify(flags));
            }

            // 2) Fire-and-forget Netlify form submission with a 4-second hard
            //    timeout via AbortSignal. Earlier code awaited fetch('/') with
            //    no timeout, so when the form endpoint was unconfigured (it
            //    always is right now) the POST would hang and freeze the
            //    popover on "Sending..." indefinitely.
            const ctrl = new AbortController();
            setTimeout(() => ctrl.abort(), 4000);
            const formData = new URLSearchParams();
            formData.append('form-name', 'word-flag');
            formData.append('language', language);
            formData.append('word', rawToken);
            formData.append('currentTranslation', entry.en || '');
            formData.append('currentPos', entry.pos || '');
            formData.append('sentence', sentence || '');
            formData.append('suggestion', '');
            fetch('/', {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: formData.toString(),
              signal: ctrl.signal,
            }).catch(() => { /* silently ignore — localStorage already has it */ });

            // 3) Dismiss the popover immediately so the user sees feedback,
            //    not a stuck "Sending..." button.
            onDismiss();
          }}
          className="text-[10px] font-medium text-[var(--text-faint)] hover:text-orange-500 transition-colors"
        >
          Flag as wrong
        </button>
      </div>
      </div>

      {/* Full-screen conjugation overlay – polished layout so users can
         actually read the tables comfortably. */}
      {showConj && conjTable && (
        <div
          className="fixed inset-0 z-[10000] bg-black/70 backdrop-blur-md flex items-stretch sm:items-center justify-center animate-fade-in"
          onClick={(e) => { e.stopPropagation(); setShowConj(false); }}
        >
          <div
            className="bg-[var(--bg-card)] w-full sm:max-w-xl sm:rounded-3xl shadow-2xl border border-[var(--border-color)] overflow-hidden max-h-screen sm:max-h-[88vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header – compact on mobile, more breathing room on desktop.
                Safe-area padding on top so content stays clear of the notch / status bar. */}
            <div className="relative px-5 pb-3 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6 sm:pt-6 sm:pb-5 border-b border-[var(--border-color)] bg-gradient-to-b from-blue-500/5 to-transparent">
              <button
                onClick={() => setShowConj(false)}
                className="absolute right-3 sm:right-4 top-[max(0.75rem,env(safe-area-inset-top))] sm:top-4 p-2 rounded-xl hover:bg-[var(--bg-card-hover)] active:scale-95 transition"
                aria-label="Close"
              >
                <CloseIcon size={20} className="text-[var(--text-secondary)]" />
              </button>
              <div className="text-xs sm:text-sm font-bold text-blue-500 uppercase tracking-[0.2em] mb-1">
                Conjugation
              </div>
              <div className="flex items-baseline gap-2 flex-wrap pr-10">
                <div className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">
                  {conjTable.infinitive}
                </div>
                {conjTable.isReflexive && (
                  <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-purple-500 bg-purple-500/10 px-2 py-0.5 rounded-md">
                    Reflexive
                  </span>
                )}
                {/* English meaning inline next to the infinitive on mobile */}
                {lemmaEntry?.en && (
                  <span className="text-xs sm:text-sm text-[var(--text-muted)]">
                    · {lemmaEntry.en.split(';')[0].trim()}
                  </span>
                )}
              </div>
              {/* Russian aspect indicator — shows imperfective/perfective/bi-aspectual
                  badge + pair link + (where present) a user-friendly explainer for
                  suppletive pairs, motion verbs, and semantic shifts. */}
              {(() => {
                const aspectEntry = lemmaEntry?.aspect ? lemmaEntry : (entry.aspect ? entry : null);
                if (!aspectEntry || language !== 'russian') return null;
                const pillFor = {
                  impf: { label: 'Imperfective', cls: 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 border-emerald-500/30' },
                  pf:   { label: 'Perfective',   cls: 'text-orange-700 dark:text-orange-300 bg-orange-500/15 border-orange-500/30'   },
                  bi:   { label: 'Both aspects', cls: 'text-purple-700 dark:text-purple-300 bg-purple-500/15 border-purple-500/30'   },
                } as const;
                const p = pillFor[aspectEntry.aspect as 'impf' | 'pf' | 'bi'];
                if (!p) return null;
                return (
                  <div className="mt-2.5 flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 flex-wrap text-xs sm:text-sm">
                      <span className={`font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${p.cls}`}>
                        {p.label}
                      </span>
                      {aspectEntry.pair && (
                        <>
                          <span className="text-[var(--text-muted)]">pair:</span>
                          <button
                            onClick={() => {
                              setSwappedTo(aspectEntry.pair!);
                              setUserPickedTense(false);
                            }}
                            className="font-bold text-blue-500 hover:text-blue-400 active:scale-95 transition-all underline decoration-blue-500/30 underline-offset-2 hover:decoration-blue-500/70"
                          >
                            {aspectEntry.pair} ↗
                          </button>
                        </>
                      )}
                      {swappedTo && (
                        <button
                          onClick={() => { setSwappedTo(null); setUserPickedTense(false); }}
                          className="ml-auto text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors px-2 py-1 rounded border border-[var(--border-color)] hover:border-[var(--border-hover)]"
                        >
                          ← back
                        </button>
                      )}
                    </div>
                    {aspectEntry.note && (
                      <div className="text-xs leading-relaxed text-[var(--text-secondary)] bg-amber-500/10 border-l-2 border-amber-500/60 px-3 py-2 rounded-r-md">
                        {aspectEntry.note}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* "On this card" banner — spells out the matched form + tense + person
                before the user has to scan the table. Branches: matched form (amber)
                vs infinitive-tapped (blue informational). The latter prevents the
                overlay looking broken when the user tapped the dictionary form. */}
            {matchedFormInfo && !matchedFormInfo.isInfinitive && (
              <div className="px-5 py-3 sm:px-6 sm:py-4 border-b border-[var(--border-color)] bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-10 sm:h-12 bg-amber-500 rounded-full shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs sm:text-sm font-bold text-amber-500 uppercase tracking-[0.18em] mb-0.5">
                      Used on this card
                    </div>
                    <div className="text-base sm:text-lg leading-tight">
                      <span className="font-bold text-[var(--text-primary)]">{matchedFormInfo.form}</span>
                      <span className="text-[var(--text-muted)] text-xs sm:text-sm"> · {matchedFormInfo.personLabel} · {matchedFormInfo.tenseShort}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {matchedFormInfo && matchedFormInfo.isInfinitive && (
              <div className="px-5 py-3 sm:px-6 sm:py-4 border-b border-[var(--border-color)] bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-transparent">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-10 sm:h-12 bg-blue-500 rounded-full shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs sm:text-sm font-bold text-blue-500 uppercase tracking-[0.18em] mb-0.5">
                      Dictionary form
                    </div>
                    <div className="text-sm sm:text-base text-[var(--text-secondary)] leading-tight">
                      You tapped the base infinitive. Its conjugations are below.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tense tabs – wrap onto multiple rows so all are visible on mobile.
                Native name + English translation in parens (smaller, dimmed).
                An amber dot indicates that this tense contains the clicked form. */}
            <div className="px-4 py-3 sm:px-5 sm:py-4 border-b border-[var(--border-color)]">
              <div className="flex flex-wrap gap-2">
                {Object.keys(conjTable.tenses).map(tense => {
                  const fullLabel = TENSE_LABELS[tense] || tense;
                  const m = fullLabel.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
                  const native = m ? m[1].trim() : fullLabel;
                  const english = m ? m[2].trim() : null;
                  const isActive = conjTense === tense;
                  const hasMatch = tenseHasMatch[tense];
                  return (
                    <button
                      key={tense}
                      onClick={() => { setConjTense(tense); setUserPickedTense(true); }}
                      className={`relative px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-lg text-xs sm:text-sm font-bold uppercase tracking-wide transition-all whitespace-nowrap ${
                        isActive
                          ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30'
                          : 'bg-[var(--bg-inset)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {native}
                      {english && (
                        <span className="ml-1.5 text-xs sm:text-sm font-medium opacity-70">({english})</span>
                      )}
                      {/* Match indicator – amber dot in the top-right corner so it
                          stays distinct from the active-tab blue. Ring matches the
                          card bg so the dot reads as a floating badge, not blended. */}
                      {hasMatch && (
                        <span
                          aria-label="this card's form is in this tense"
                          className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-[var(--bg-card)]"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Forms – scrolling region. Tighter on mobile so all 6 persons fit.
                Bottom safe-area padding so iPhone home indicator doesn't cover the last row. */}
            {conjTable.tenses[conjTense] && (
              <div className="overflow-y-auto flex-1">
                <div className="p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-5 space-y-1 sm:space-y-1.5">
                  {conjTable.tenses[conjTense].map((form, i) => {
                    const personLabel =
                      language === 'french' && i === 0 && /^[aeéèêëiîïoôuûùüyh]/i.test(form)
                        ? "j'"
                        : personLabels[i];
                    const isMatchedForm = i === matchedIndexPerTense[conjTense];
                    return (
                      <div
                        key={i}
                        className={`flex items-center gap-3 px-3 py-2.5 sm:px-4 sm:py-3.5 rounded-xl transition-colors ${
                          isMatchedForm
                            ? 'bg-amber-500/15 ring-2 ring-amber-500/60 shadow-lg shadow-amber-500/5 border-l-4 border-amber-500'
                            : 'hover:bg-[var(--bg-inset)]/50'
                        }`}
                      >
                        <span className={`text-xs sm:text-sm uppercase tracking-wider w-16 sm:w-24 text-right shrink-0 ${
                          isMatchedForm ? 'text-amber-500 font-extrabold' : 'text-[var(--text-muted)] font-semibold'
                        }`}>
                          {personLabel}
                        </span>
                        <span className={`text-base sm:text-lg font-bold tracking-tight ${
                          isMatchedForm ? 'text-amber-500' : 'text-[var(--text-primary)]'
                        }`}>
                          {form}
                        </span>
                        {isMatchedForm && (
                          <span className="ml-auto text-xs sm:text-sm font-bold uppercase tracking-wider text-amber-500 bg-amber-500/20 px-2 py-1 rounded-md whitespace-nowrap">
                            ← on this card
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Etymology overlay – centered modal with backdrop. Same layout pattern
          as the Grammar Tip overlay on the study card, just violet instead of
          amber. Tap anywhere to dismiss. Save toggle mirrors the one in the
          card-level etymology overlay in StudySession. */}
      {etymologyExpanded && (() => {
        const ety = lookupEtymology(rawToken, language);
        if (!ety) return null;
        return (
          <div
            className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in cursor-pointer"
            onClick={(e) => { e.stopPropagation(); setEtymologyExpanded(false); }}
          >
            <div
              className="bg-violet-50 dark:bg-[#100a1a] border border-violet-500/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => {
                  try {
                    toggleEtymologyFavorite(
                      rawToken,
                      language,
                      ety.origin,
                      ety.note,
                      ety.cognates,
                      ety.sources,
                      sentence,
                    );
                    setEtyFavSnapshot(prev => !prev);
                  } catch (e) { console.error('toggleEtymologyFavorite failed:', e); }
                }}
                className={`absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 ${
                  etyFavSnapshot
                    ? 'bg-violet-500/20 text-violet-700 dark:text-violet-300 border border-violet-500/50'
                    : 'bg-white/80 dark:bg-[#06030d] text-violet-600 dark:text-violet-400 border border-violet-500/30 hover:border-violet-500/60'
                }`}
              >
                <Star size={11} fill={etyFavSnapshot ? 'currentColor' : 'none'} />
                <span>{etyFavSnapshot ? 'Saved' : 'Save'}</span>
              </button>
              <div className="flex items-center gap-1.5 mb-3 justify-center">
                <BookText size={14} className="text-violet-500" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-violet-500">Etymology</span>
              </div>
              <div className="text-2xl font-black text-violet-700 dark:text-violet-200 mb-2 text-center tracking-tight">
                {rawToken}
              </div>
              <div className="text-sm font-bold text-violet-600 dark:text-violet-300 mb-3 text-center">{ety.origin}</div>
              {ety.cognates && ety.cognates.length > 0 && (
                <div className="text-xs text-slate-700 dark:text-violet-100 mb-3 text-center">
                  <span className="font-bold">Cognates: </span>
                  {ety.cognates.join(', ')}
                </div>
              )}
              <p className="text-sm md:text-base text-slate-700 dark:text-violet-100 leading-relaxed text-center italic">
                {ety.note}
              </p>
              <div className="mt-4 text-center text-[9px] font-mono text-violet-500/60 uppercase tracking-wider">
                Sources · {ety.sources.join(' · ')}
              </div>
            </div>
          </div>
        );
      })()}
    </>,
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
