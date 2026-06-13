/**
 * Test 100 random verb lemmas across all 11 languages and report any
 * conjugation-engine issues: crashes, empty tables, missing tenses,
 * empty forms.
 *
 * Verb lemmas are extracted via regex over the dictionary .ts source
 * (rather than importing the module) so we don't have to care which
 * languages export `dictionary` vs `dict`.
 *
 * Run:  npx tsx scripts/test-100-conjugations.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

import { conjugate as conjugateEs } from '../src/data/conjugation/es';
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

import type { ConjugationTable } from '../src/types';

type LangCode = 'es' | 'it' | 'fr' | 'pt' | 'de' | 'nl' | 'sv' | 'cy' | 'hi' | 'tr' | 'ru';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const LANGS: Record<LangCode, {
  name: string;
  dictPath: string;
  conjugate: (inf: string) => ConjugationTable | null;
}> = {
  es: { name: 'Spanish',    dictPath: 'src/data/dictionary/es.ts', conjugate: conjugateEs },
  it: { name: 'Italian',    dictPath: 'src/data/dictionary/it.ts', conjugate: conjugateIt },
  fr: { name: 'French',     dictPath: 'src/data/dictionary/fr.ts', conjugate: conjugateFr },
  pt: { name: 'Portuguese', dictPath: 'src/data/dictionary/pt.ts', conjugate: conjugatePt },
  de: { name: 'German',     dictPath: 'src/data/dictionary/de.ts', conjugate: conjugateDe },
  nl: { name: 'Dutch',      dictPath: 'src/data/dictionary/nl.ts', conjugate: conjugateNl },
  sv: { name: 'Swedish',    dictPath: 'src/data/dictionary/sv.ts', conjugate: conjugateSv },
  cy: { name: 'Welsh',      dictPath: 'src/data/dictionary/cy.ts', conjugate: conjugateCy },
  hi: { name: 'Hindi',      dictPath: 'src/data/dictionary/hi.ts', conjugate: conjugateHindi },
  tr: { name: 'Turkish',    dictPath: 'src/data/dictionary/tr.ts', conjugate: conjugateTr },
  ru: { name: 'Russian',    dictPath: 'src/data/dictionary/ru.ts', conjugate: conjugateRu },
};

interface Issue {
  lang: string;
  lemma: string;
  kind: 'no_table' | 'no_tenses' | 'empty_tense' | 'empty_form' | 'crash';
  detail: string;
}

// Extract verb infinitives by scanning the dictionary source for entries
// with pos: 'v'. If the entry has a lemma field (i.e. is an inflected form),
// resolve to the lemma — matches what WordPopover does at runtime. Returns
// a deduplicated list of infinitives the conjugation engine will actually
// be called with.
function extractVerbInfinitives(filepath: string): string[] {
  const src = fs.readFileSync(filepath, 'utf8');
  const out = new Set<string>();
  const lineRe = /^\s*['"]([^'"]+)['"]\s*:\s*\{([^}]*)\}/gm;
  let m: RegExpExecArray | null;
  while ((m = lineRe.exec(src)) !== null) {
    const key = m[1];
    const body = m[2];
    if (!/pos\s*:\s*['"]v['"]/.test(body)) continue;
    const lemmaMatch = body.match(/lemma\s*:\s*['"]([^'"]+)['"]/);
    out.add(lemmaMatch ? lemmaMatch[1] : key);
  }
  return [...out];
}

const issues: Issue[] = [];
let totalTested = 0;
let totalOk = 0;
const okSamples: Record<string, string[]> = {};

const verbsPerLang: Record<LangCode, string[]> = {} as Record<LangCode, string[]>;
for (const [code, cfg] of Object.entries(LANGS) as [LangCode, typeof LANGS[LangCode]][]) {
  verbsPerLang[code] = extractVerbInfinitives(path.join(ROOT, cfg.dictPath));
}

const langsWithVerbs = (Object.keys(LANGS) as LangCode[]).filter(c => verbsPerLang[c].length > 0);
const perLang = Math.max(1, Math.floor(100 / langsWithVerbs.length));

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

for (const code of langsWithVerbs) {
  const cfg = LANGS[code];
  const sample = shuffled(verbsPerLang[code], verbsPerLang[code].length).slice(0, perLang);
  okSamples[cfg.name] = [];
  for (const lemma of sample) {
    totalTested++;
    let table: ConjugationTable | null = null;
    try {
      table = cfg.conjugate(lemma);
    } catch (e) {
      issues.push({ lang: cfg.name, lemma, kind: 'crash', detail: (e as Error).message.slice(0, 120) });
      continue;
    }
    if (!table) {
      issues.push({ lang: cfg.name, lemma, kind: 'no_table', detail: 'conjugate() returned null' });
      continue;
    }
    const tenses = Object.keys(table.tenses);
    if (tenses.length === 0) {
      issues.push({ lang: cfg.name, lemma, kind: 'no_tenses', detail: 'tenses object empty' });
      continue;
    }
    let langOk = true;
    for (const t of tenses) {
      const forms = table.tenses[t];
      if (!forms || forms.length === 0) {
        issues.push({ lang: cfg.name, lemma, kind: 'empty_tense', detail: `tense "${t}" has 0 forms` });
        langOk = false;
        break;
      }
      const allBlank = forms.every(f => !f || f === '');
      if (allBlank) {
        issues.push({ lang: cfg.name, lemma, kind: 'empty_form', detail: `tense "${t}" all forms blank` });
        langOk = false;
        break;
      }
    }
    if (langOk) {
      totalOk++;
      if (okSamples[cfg.name].length < 3) okSamples[cfg.name].push(lemma);
    }
  }
}

const byLang: Record<string, { tested: number; ok: number; issues: number }> = {};
for (const code of langsWithVerbs) {
  const name = LANGS[code].name;
  byLang[name] = {
    tested: Math.min(perLang, verbsPerLang[code].length),
    ok: 0,
    issues: 0,
  };
}
for (const it of issues) byLang[it.lang].issues++;
for (const lang of Object.keys(byLang)) byLang[lang].ok = byLang[lang].tested - byLang[lang].issues;

console.log('═══════════════════════════════════════════════════════════════');
console.log(`100-RANDOM CONJUGATION TEST  ·  ${totalTested} verbs across ${langsWithVerbs.length} languages`);
console.log('═══════════════════════════════════════════════════════════════\n');
console.log('Per-language results (showing 3 example verbs that worked):');
console.log('  lang          tested  ok  issues  examples');
for (const [name, r] of Object.entries(byLang)) {
  const examples = okSamples[name]?.slice(0, 3).join(', ') || '-';
  console.log(`  ${name.padEnd(12)}  ${String(r.tested).padStart(6)}  ${String(r.ok).padStart(3)}  ${String(r.issues).padStart(6)}  ${examples}`);
}
console.log();
console.log(`TOTAL: ${totalOk}/${totalTested} ok  ·  ${issues.length} issues\n`);

if (issues.length === 0) {
  console.log('✓ No issues found.');
} else {
  console.log('Issues by kind:');
  const byKind: Record<string, Issue[]> = {};
  for (const it of issues) (byKind[it.kind] ||= []).push(it);
  for (const [kind, items] of Object.entries(byKind)) {
    console.log(`\n  ── ${kind} (${items.length})`);
    for (const it of items.slice(0, 10)) {
      console.log(`     ${it.lang}: ${it.lemma}  →  ${it.detail}`);
    }
    if (items.length > 10) console.log(`     ... +${items.length - 10} more`);
  }
}

process.exit(issues.length > 0 ? 1 : 0);
