/**
 * Random conjugation coverage audit. Simulates 100 random "user taps a verb
 * on a card" events stratified across all 11 languages. For each, replicates
 * the WordPopover matcher logic to see if the tapped form would highlight
 * in the conjugation overlay. Reports failure rate + classification of
 * failure modes so we know what to fix.
 *
 * Run:  npx tsx scripts/conjugation-coverage-audit.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

import { conjugate as conjugateEs, type ConjugationTable as CT } from '../src/data/conjugation/es';
import { conjugate as conjugateIt } from '../src/data/conjugation/it';
import { conjugate as conjugateFr } from '../src/data/conjugation/fr';
import { conjugate as conjugatePt } from '../src/data/conjugation/pt';
import { conjugate as conjugateDe } from '../src/data/conjugation/de';
import { conjugate as conjugateNl } from '../src/data/conjugation/nl';
import { conjugate as conjugateSv } from '../src/data/conjugation/sv';
import { conjugate as conjugateCy } from '../src/data/conjugation/cy';
import { conjugateHindi } from '../src/data/conjugation/hi';
import { conjugate as conjugateTr } from '../src/data/conjugation/tr';
import { conjugate as conjugateRu } from '../src/data/conjugation/ru';

import { lookupWord as lookupEs } from '../src/data/dictionary/es';
import { lookupWord as lookupIt } from '../src/data/dictionary/it';
import { lookupWord as lookupFr } from '../src/data/dictionary/fr';
import { lookupWord as lookupPt } from '../src/data/dictionary/pt';
import { lookupWord as lookupDe } from '../src/data/dictionary/de';
import { lookupWord as lookupNl } from '../src/data/dictionary/nl';
import { lookupWord as lookupSv } from '../src/data/dictionary/sv';
import { lookupWord as lookupCy } from '../src/data/dictionary/cy';
import { lookupWord as lookupHi } from '../src/data/dictionary/hi';
import { lookupWord as lookupTr } from '../src/data/dictionary/tr';
import { lookupWord as lookupRu } from '../src/data/dictionary/ru';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

type LangCode = 'es' | 'it' | 'fr' | 'pt' | 'de' | 'nl' | 'sv' | 'cy' | 'hi' | 'tr' | 'ru';
type LookupFn = (w: string) => { en?: string; pos?: string; lemma?: string } | null;
type ConjugateFn = (inf: string) => any;

const LANGS: Record<LangCode, { name: string; deckPath: string; lookup: LookupFn; conjugate: ConjugateFn }> = {
  es: { name: 'Spanish',    deckPath: 'src/data/spanish/deck.json',    lookup: lookupEs as LookupFn, conjugate: conjugateEs },
  it: { name: 'Italian',    deckPath: 'src/data/italian/deck.json',    lookup: lookupIt as LookupFn, conjugate: conjugateIt },
  fr: { name: 'French',     deckPath: 'src/data/french/deck.json',     lookup: lookupFr as LookupFn, conjugate: conjugateFr },
  pt: { name: 'Portuguese', deckPath: 'src/data/portuguese/deck.json', lookup: lookupPt as LookupFn, conjugate: conjugatePt },
  de: { name: 'German',     deckPath: 'src/data/german/deck.json',     lookup: lookupDe as LookupFn, conjugate: conjugateDe },
  nl: { name: 'Dutch',      deckPath: 'src/data/dutch/deck.json',      lookup: lookupNl as LookupFn, conjugate: conjugateNl },
  sv: { name: 'Swedish',    deckPath: 'src/data/swedish/deck.json',    lookup: lookupSv as LookupFn, conjugate: conjugateSv },
  cy: { name: 'Welsh',      deckPath: 'src/data/welsh/deck.json',      lookup: lookupCy as LookupFn, conjugate: conjugateCy },
  hi: { name: 'Hindi',      deckPath: 'src/data/hindi/deck.json',      lookup: lookupHi as LookupFn, conjugate: conjugateHindi },
  tr: { name: 'Turkish',    deckPath: 'src/data/turkish/deck.json',    lookup: lookupTr as LookupFn, conjugate: conjugateTr },
  ru: { name: 'Russian',    deckPath: 'src/data/russian/deck.json',    lookup: lookupRu as LookupFn, conjugate: conjugateRu },
};

// Same normalizers + matcher passes as WordPopover.tsx
const stripPunct = (s: string) => s.replace(/[.,!?;:""''«»()¿¡—–\-।॥]/g, '');
function stripFrenchElision(s: string, lang: string): string {
  if (lang !== 'French') return s;
  return s.replace(/^(qu|j|m|t|s|n|l|d|c)'/i, '');
}
const strict = (s: string, lang = '') => stripPunct(stripFrenchElision(s, lang).toLowerCase()).replace(/\s+/g, '');
const loose  = (s: string, lang = '') => strict(s, lang).normalize('NFD').replace(/[̀-ͯ]/g, '');

function matcherMatches(forms: string[], rawToken: string, lang = ''): boolean {
  const sT = strict(rawToken, lang), lT = loose(rawToken, lang);
  // Pass 1: strict full-string
  if (forms.some(f => f && f !== '-' && strict(f) === sT)) return true;
  // Pass 2: loose full-string
  if (forms.some(f => f && f !== '-' && loose(f) === lT)) return true;
  // Pass 3: word-level strict
  const wordsOf = (f: string) => f.split(/[\s/]+/).map(w => stripPunct(w.toLowerCase())).filter(Boolean);
  if (forms.some(f => f && f !== '-' && wordsOf(f).some(w => strict(w).replace(/\s+/g, '') === sT))) return true;
  // Pass 4: word-level loose
  if (forms.some(f => f && f !== '-' && wordsOf(f).some(w => loose(w) === lT))) return true;
  // Pass 5: German colloquial -e drop ("hab" → "habe")
  if (lang === 'German') {
    const augS = sT + 'e';
    const augL = lT + 'e';
    if (forms.some(f => f && f !== '-' && strict(f) === augS)) return true;
    if (forms.some(f => f && f !== '-' && loose(f) === augL)) return true;
  }
  // Pass 5: Welsh soft-mutation reverse. The engine emits radical forms but
  // cards may carry mutated forms (c→g, p→b, t→d, g→Ø, b→f, d→dd, m→f,
  // ll→l, rh→r).
  if (lang === 'Welsh') {
    const variants: string[] = [];
    const c0 = sT.charAt(0);
    if (c0 === 'g') variants.push('c' + sT.slice(1));
    if (c0 === 'b') variants.push('p' + sT.slice(1));
    if (c0 === 'd' && sT.charAt(1) !== 'd') variants.push('t' + sT.slice(1));
    if (c0 === 'f') { variants.push('b' + sT.slice(1)); variants.push('m' + sT.slice(1)); }
    if (sT.startsWith('dd')) variants.push('d' + sT.slice(2));
    if (c0 === 'l' && sT.charAt(1) !== 'l') variants.push('ll' + sT.slice(1));
    if (c0 === 'r' && sT.charAt(1) !== 'h') variants.push('rh' + sT.slice(1));
    if ('aeiouwy'.includes(c0)) variants.push('g' + sT);
    for (const v of variants) {
      // Full-string match
      if (forms.some(f => f && f !== '-' && (strict(f) === v || loose(f) === v))) return true;
      // Word-level match — engine emits "gallwch chi", "rhedeg" alone in
      // wordsOf("yn rhedeg"), etc.
      if (forms.some(f => f && f !== '-' && wordsOf(f).some(w => strict(w).replace(/\s+/g, '') === v || loose(w) === v))) return true;
    }
  }
  return false;
}

interface Failure {
  lang: string;
  card: string;
  token: string;
  lemma: string | null;
  cls: 'no_dict' | 'not_verb' | 'no_table' | 'matcher_miss';
  detail: string;
}

const failures: Failure[] = [];
const buckets = { success: 0, no_dict: 0, not_verb: 0, no_table: 0, matcher_miss: 0 };
const perLang: Record<string, { tested: number; pass: number }> = {};

// Stratified random sample: ~10 verb taps per language → 110 total
function shuffled<T>(arr: T[], seed: number): T[] {
  const out = arr.slice();
  let s = seed | 0;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) | 0;
    const j = Math.abs(s) % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const SAMPLE_PER_LANG = 10;
let seed = 42;

for (const [code, cfg] of Object.entries(LANGS) as [LangCode, typeof LANGS[LangCode]][]) {
  perLang[cfg.name] = { tested: 0, pass: 0 };
  const deckPath = path.join(ROOT, cfg.deckPath);
  if (!fs.existsSync(deckPath)) continue;
  const deck = JSON.parse(fs.readFileSync(deckPath, 'utf8')) as Array<{ id: string; target: string }>;
  const cards = shuffled(deck, seed++).slice(0, 200); // top-200 by shuffle then filter

  let tested = 0;
  for (const card of cards) {
    if (tested >= SAMPLE_PER_LANG) break;
    // Match the real app's tokenizer: just whitespace split. Punctuation
    // including apostrophes is preserved for lookupWord to handle (lookupWord
    // for French has elision rules; lookupWord for others strips the right
    // punct as needed).
    const tokens = (card.target || '').split(/\s+/).filter(Boolean);
    for (const tok of tokens) {
      if (tested >= SAMPLE_PER_LANG) break;
      const entry = cfg.lookup(tok);
      if (!entry) continue;                              // not a verb candidate at all; skip token (not a failure)
      if (entry.pos !== 'v') continue;                   // not flagged as verb; skip
      // We have a verb. Treat this as one "test" trial.
      tested++;
      perLang[cfg.name].tested++;

      // Try the WordPopover conjugation lookup chain.
      // Real WordPopover strips ASCII punctuation before passing to conjugate
      // (so "dormir." → "dormir" → conjugate("dormir") works). Mirror that.
      const lemma = entry.lemma ?? null;
      const clean = tok.toLowerCase().replace(/[.,!?;:""''«»()¿¡—–]/g, '');
      let table: CT | null = null;
      if (lemma) table = cfg.conjugate(lemma) as CT | null;
      if (!table) table = cfg.conjugate(clean) as CT | null;

      if (!table) {
        buckets.no_table++;
        failures.push({ lang: cfg.name, card: card.target, token: tok, lemma, cls: 'no_table', detail: 'engine returned null' });
        continue;
      }
      // Banner-handled case: if the tapped (cleaned) form IS the engine's
      // infinitive, the UI shows the blue "Dictionary form" banner from
      // Phase 4B. The matcher correctly returns no row (infinitives aren't
      // rows) but the user experience is correct — they see "you tapped the
      // base infinitive, conjugations below". Count this as a pass.
      const cleanLower = clean.toLowerCase();
      const infLower = table.infinitive.toLowerCase();
      if (cleanLower === infLower) {
        buckets.success++; perLang[cfg.name].pass++;
        continue;
      }
      // Run matcher against every tense's forms
      let matched = false;
      for (const forms of Object.values(table.tenses)) {
        if (matcherMatches(forms as string[], tok, cfg.name)) { matched = true; break; }
      }
      if (matched) { buckets.success++; perLang[cfg.name].pass++; }
      else {
        buckets.matcher_miss++;
        failures.push({ lang: cfg.name, card: card.target, token: tok, lemma, cls: 'matcher_miss', detail: `infinitive=${table.infinitive}` });
      }
    }
  }
}

const totalTested = Object.values(perLang).reduce((s, r) => s + r.tested, 0);
const totalPass = Object.values(perLang).reduce((s, r) => s + r.pass, 0);

console.log('═══════════════════════════════════════════════════════════════');
console.log(`CONJUGATION COVERAGE AUDIT  ·  ${totalTested} random verb taps across 11 languages`);
console.log('═══════════════════════════════════════════════════════════════\n');
console.log('Per-language pass rate:');
console.log('  lang          tested  pass  fail');
for (const [name, r] of Object.entries(perLang)) {
  console.log(`  ${name.padEnd(12)}  ${String(r.tested).padStart(6)}  ${String(r.pass).padStart(4)}  ${String(r.tested - r.pass).padStart(4)}`);
}
console.log(`\nOverall: ${totalPass}/${totalTested} (${(totalPass*100/totalTested).toFixed(1)}%)`);
console.log(`\nFailure modes:`);
console.log(`  no_table     ${buckets.no_table.toString().padStart(3)}  — engine returned null for both lemma and raw token`);
console.log(`  matcher_miss ${buckets.matcher_miss.toString().padStart(3)}  — engine produced table but tapped form not in any tense row`);

if (failures.length > 0) {
  console.log(`\nFailure samples (max 30):`);
  for (const f of failures.slice(0, 30)) {
    console.log(`  [${f.lang}] "${f.card.slice(0, 50)}" tap "${f.token}" lemma=${f.lemma}  →  ${f.cls} (${f.detail})`);
  }
}
