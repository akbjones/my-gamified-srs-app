/**
 * Wave-3 Greek slice D — dict coverage validator.
 * Reports every uncovered Greek token in the card targets, where a token
 * is covered iff:
 *   - dict-D.json (my new entries) has it, OR
 *   - lookupWord (base dict, accent-tolerant, conj->dict) resolves it, OR
 *   - findInfinitive (engine reverse-lookup) resolves it, OR
 *   - it is a surface form of a verbs-D verb (via conjugate()).
 * Also confirms each verbs-D lemma conjugates via conjugate().
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { lookupWord } from '../../src/data/dictionary/el';
import { findInfinitive, conjugate, normalizeGreek } from '../../src/data/conjugation/el';

const HERE = dirname(fileURLToPath(import.meta.url));
type Entry = { en: string; ipa: string; pos: string; lemma?: string };
type Card = { id: string; target: string };

const cards: Card[] = JSON.parse(readFileSync(join(HERE, 'wave3-el-cards-D.json'), 'utf8'));
const verbs: string[] = JSON.parse(readFileSync(join(HERE, 'wave3-el-verbs-D.json'), 'utf8'));

let dictD: Record<string, Entry> = {};
try {
  dictD = JSON.parse(readFileSync(join(HERE, 'wave3-el-dict-D.json'), 'utf8'));
} catch {
  console.log('(no dict-D.json yet — running in extraction mode)');
}

// ── 1. Confirm every verbs-D verb conjugates, and collect surface forms ──
const verbForms = new Set<string>();
const conjFail: string[] = [];
for (const v of verbs) {
  const t = conjugate(v);
  if (!t) {
    conjFail.push(v);
    continue;
  }
  for (const forms of Object.values(t.tenses)) {
    for (const f of forms) {
      for (const piece of [f, f.replace(/^θα\s+/, '')]) {
        verbForms.add(normalizeGreek(piece));
      }
    }
  }
}

// ── 2. Tokenize card targets into normalized Greek tokens ──
const GREEK = /[Ͱ-Ͽἀ-῿]+/g;
const tokens = new Map<string, { raw: string; cards: Set<string> }>();
for (const c of cards) {
  const m = c.target.match(GREEK) ?? [];
  for (const raw of m) {
    const key = normalizeGreek(raw);
    if (!tokens.has(key)) tokens.set(key, { raw, cards: new Set() });
    tokens.get(key)!.cards.add(c.id);
  }
}

// ── 3. Coverage check ──
const isCovered = (key: string): string => {
  if (dictD[key]) return 'dict-D';
  if (lookupWord(key)) return 'lookupWord';
  if (findInfinitive(key)) return 'findInfinitive';
  if (verbForms.has(key)) return 'verbs-D form';
  return '';
};

const uncovered: { key: string; raw: string; cards: string[] }[] = [];
for (const [key, info] of tokens) {
  if (!isCovered(key)) {
    uncovered.push({ key, raw: info.raw, cards: [...info.cards].sort() });
  }
}
uncovered.sort((a, b) => a.key.localeCompare(b.key, 'el'));

// ── Report ──
console.log(`verbs-D: ${verbs.length} lemmas, conjugate() failures: ${conjFail.length}`);
if (conjFail.length) console.log('  FAILED:', conjFail.join(', '));
console.log(`tokens: ${tokens.size} unique Greek tokens`);
console.log(`dict-D entries: ${Object.keys(dictD).length}`);
console.log(`UNCOVERED: ${uncovered.length}`);
for (const u of uncovered) {
  console.log(`  ${u.key}\t(cards: ${u.cards.slice(0, 3).join(',')}${u.cards.length > 3 ? '…' : ''})`);
}

if (process.env.SHOW_CTX) {
  console.log('\n=== context sentences for uncovered ===');
  const byCard = new Map(cards.map((c) => [c.id, c.target]));
  for (const u of uncovered) {
    console.log(`\n${u.key}:`);
    for (const cid of u.cards.slice(0, 2)) console.log(`  [${cid}] ${byCard.get(cid)}`);
  }
}

process.exit(uncovered.length === 0 && conjFail.length === 0 ? 0 : 1);
