/**
 * Sweep: for ~50 random inflected verb entries (entries with a `lemma`
 * field) across all 11 languages, simulate the WordPopover lookup with the
 * NEW lemma-first logic and verify:
 *
 *   1. The returned table's infinitive equals the entry's lemma (not the
 *      raw token, which is the broken behavior we just fixed).
 *   2. The original tapped form IS findable in one of the table's forms.
 *
 * If both pass, the fix works end-to-end for that entry. Output: per-
 * language pass count and a list of any failures.
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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const LANGS: Record<string, { name: string; dictPath: string; conjugate: (s: string) => any }> = {
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

interface InflectedEntry { key: string; lemma: string; }

function extractInflected(filepath: string): InflectedEntry[] {
  const src = fs.readFileSync(filepath, 'utf8');
  const out: InflectedEntry[] = [];
  const lineRe = /^\s*['"]([^'"]+)['"]\s*:\s*\{([^}]*)\}/gm;
  let m: RegExpExecArray | null;
  while ((m = lineRe.exec(src)) !== null) {
    const body = m[2];
    if (!/pos\s*:\s*['"]v['"]/.test(body)) continue;
    const lm = body.match(/lemma\s*:\s*['"]([^'"]+)['"]/);
    if (lm) out.push({ key: m[1], lemma: lm[1] });
  }
  return out;
}

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

const strict = (s: string) => s.toLowerCase().replace(/[.,!?;:""''«»()¿¡—–\-]/g, '').replace(/\s+/g, '');
const loose = (s: string) => strict(s).normalize('NFD').replace(/[̀-ͯ]/g, '');

interface Fail { lang: string; key: string; lemma: string; reason: string; gotInf?: string; }
const fails: Fail[] = [];
const perLangPerLang: Record<string, { total: number; pass: number }> = {};

const SAMPLE_PER_LANG = 5;

for (const [code, cfg] of Object.entries(LANGS)) {
  perLangPerLang[cfg.name] = { total: 0, pass: 0 };
  const inflected = extractInflected(path.join(ROOT, cfg.dictPath));
  const sample = shuffled(inflected, inflected.length).slice(0, SAMPLE_PER_LANG);

  for (const e of sample) {
    perLangPerLang[cfg.name].total++;
    // NEW lemma-first logic (simulates the WordPopover fix)
    const table = cfg.conjugate(e.lemma);
    if (!table) {
      fails.push({ lang: cfg.name, key: e.key, lemma: e.lemma, reason: 'engine returned null on lemma' });
      continue;
    }
    if (table.infinitive !== e.lemma) {
      fails.push({ lang: cfg.name, key: e.key, lemma: e.lemma, reason: 'table.infinitive mismatch', gotInf: table.infinitive });
      continue;
    }
    // Verify the original tapped form appears somewhere in the conjugation
    const sT = strict(e.key), lT = loose(e.key);
    let found = false;
    for (const forms of Object.values(table.tenses) as string[][]) {
      if (forms.some(f => f && f !== '-' && (strict(f) === sT || loose(f) === lT))) { found = true; break; }
    }
    if (!found) {
      fails.push({ lang: cfg.name, key: e.key, lemma: e.lemma, reason: 'tapped form not found in any tense' });
      continue;
    }
    perLangPerLang[cfg.name].pass++;
  }
}

console.log('═══════════════════════════════════════════════════════════════');
console.log('LEMMA-FIRST FIX SWEEP — 5 random inflected entries per language');
console.log('═══════════════════════════════════════════════════════════════\n');
console.log('lang          tested  pass  fail');
for (const [name, r] of Object.entries(perLangPerLang)) {
  console.log(`  ${name.padEnd(12)}  ${String(r.total).padStart(6)}  ${String(r.pass).padStart(4)}  ${String(r.total - r.pass).padStart(4)}`);
}
const totalPass = Object.values(perLangPerLang).reduce((s, r) => s + r.pass, 0);
const totalTotal = Object.values(perLangPerLang).reduce((s, r) => s + r.total, 0);
console.log(`\nTotal: ${totalPass}/${totalTotal} pass\n`);

if (fails.length > 0) {
  console.log('Failures:');
  const byReason: Record<string, Fail[]> = {};
  for (const f of fails) (byReason[f.reason] ||= []).push(f);
  for (const [reason, items] of Object.entries(byReason)) {
    console.log(`\n  ── ${reason} (${items.length})`);
    for (const f of items.slice(0, 8)) {
      const extra = f.gotInf ? ` (got "${f.gotInf}")` : '';
      console.log(`     ${f.lang}: tapped "${f.key}" → lemma "${f.lemma}"${extra}`);
    }
  }
}
