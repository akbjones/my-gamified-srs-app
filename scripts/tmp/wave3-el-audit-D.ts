/**
 * ADVERSARIAL coverage audit — Greek wave-3 slice D (el-2051..el-2300).
 *
 * Coverage of a card-target Greek token (strip non-Greek letters, σ-normalize):
 *   lookupWord(tok) resolves, OR
 *   findInfinitive(tok) resolves, OR
 *   token appears (accent-blind) in slice dict-D, OR
 *   token is a form conjugate(lemma) produces for any verbs-D lemma.
 * Also: 250 cards / sequential ids / non-empty; NO dup targets vs deck.json
 * and vs sibling wave-3 slices; every verbs-D lemma conjugates.
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { lookupWord } from '../../src/data/dictionary/el';
import { findInfinitive, conjugate, normalizeGreek, stripAccents } from '../../src/data/conjugation/el';

const HERE = dirname(fileURLToPath(import.meta.url));
type Entry = { en: string; ipa?: string; pos?: string; lemma?: string };
type Card = { id: string; target: string; english: string };

const cards: Card[] = JSON.parse(readFileSync(join(HERE, 'wave3-el-cards-D.json'), 'utf8'));
const verbs: string[] = JSON.parse(readFileSync(join(HERE, 'wave3-el-verbs-D.json'), 'utf8'));
const dictD: Record<string, Entry> = JSON.parse(readFileSync(join(HERE, 'wave3-el-dict-D.json'), 'utf8'));

// ── normalization helpers ──
const bareOf = (t: string) => stripAccents(normalizeGreek(t));
// strip everything that is not a Greek letter (basic + extended blocks)
const STRIP_NON_GREEK = /[^Ͱ-Ͽἀ-῿]/g;
const toToken = (raw: string) => normalizeGreek(raw.replace(STRIP_NON_GREEK, ''));

// ── (a) structural checks ──
const structural: string[] = [];
if (cards.length !== 250) structural.push(`card count ${cards.length} != 250`);
cards.forEach((c, i) => {
  const want = `el-${2051 + i}`;
  if (c.id !== want) structural.push(`id ${c.id} != ${want}`);
  if (!c.target || !c.target.trim()) structural.push(`${c.id}: empty target`);
  if (!c.english || !c.english.trim()) structural.push(`${c.id}: empty english`);
});

// ── (c) verbs conjugate + collect engine surface forms (accent-blind) ──
const verbForms = new Set<string>();
const conjFail: string[] = [];
for (const v of verbs) {
  const t = conjugate(v);
  if (!t) { conjFail.push(v); continue; }
  verbForms.add(bareOf(v));
  for (const forms of Object.values(t.tenses)) {
    for (const f of forms) {
      for (const piece of f.split(/\s+/)) verbForms.add(bareOf(piece));
    }
  }
}

// ── slice-dict accent-blind index ──
const dictBare = new Set<string>();
for (const k of Object.keys(dictD)) dictBare.add(bareOf(k));

// ── (b) duplicate-target detection ──
const targetNorm = (t: string) =>
  bareOf(t).replace(/[^α-ω ]/g, '').replace(/\s+/g, ' ').trim();
const deck: Card[] = JSON.parse(readFileSync(join(HERE, '../../src/data/greek/deck.json'), 'utf8'));
const siblings: Record<string, Card[]> = {};
for (const s of ['A', 'B', 'C']) {
  try { siblings[s] = JSON.parse(readFileSync(join(HERE, `wave3-el-cards-${s}.json`), 'utf8')); } catch { /* absent */ }
}
const dupTargets: string[] = [];
const seenNorm = new Map<string, string>();
for (const c of deck) seenNorm.set(targetNorm(c.target), `deck:${c.id}`);
for (const [s, arr] of Object.entries(siblings)) {
  for (const c of arr) seenNorm.set(targetNorm(c.target), `slice-${s}:${c.id}`);
}
// intra-D dup + against deck/siblings
const dInternal = new Map<string, string>();
for (const c of cards) {
  const n = targetNorm(c.target);
  if (seenNorm.has(n)) dupTargets.push(`${c.id} == ${seenNorm.get(n)} :: "${c.target}"`);
  if (dInternal.has(n)) dupTargets.push(`${c.id} == D:${dInternal.get(n)} (internal) :: "${c.target}"`);
  dInternal.set(n, c.id);
}

// ── coverage over every token ──
const tokens = new Map<string, { raw: string; cards: Set<string> }>();
for (const c of cards) {
  for (const raw of c.target.split(/\s+/)) {
    const tok = toToken(raw);
    if (!tok) continue;
    if (!tokens.has(tok)) tokens.set(tok, { raw, cards: new Set() });
    tokens.get(tok)!.cards.add(c.id);
  }
}

const coverOf = (tok: string): string => {
  if (dictD[tok] || dictBare.has(bareOf(tok))) return 'dict-D';
  if (lookupWord(tok)) return 'lookupWord';
  if (findInfinitive(tok)) return 'findInfinitive';
  if (verbForms.has(bareOf(tok))) return 'verbs-D';
  return '';
};

const uncovered: { tok: string; raw: string; cards: string[] }[] = [];
for (const [tok, info] of tokens) {
  if (!coverOf(tok)) uncovered.push({ tok, raw: info.raw, cards: [...info.cards].sort() });
}
uncovered.sort((a, b) => a.tok.localeCompare(b.tok, 'el'));

// ── report ──
console.log(`cards=${cards.length} structural-problems=${structural.length}`);
for (const s of structural.slice(0, 20)) console.log('  STRUCT', s);
console.log(`verbs=${verbs.length} conjFail=${conjFail.length}${conjFail.length ? ' :: ' + conjFail.join(', ') : ''}`);
console.log(`dup-targets=${dupTargets.length}`);
for (const d of dupTargets.slice(0, 20)) console.log('  DUP', d);
console.log(`unique-tokens=${tokens.size} dictD-entries=${Object.keys(dictD).length}`);
console.log(`UNCOVERED=${uncovered.length}`);
const byCard = new Map(cards.map((c) => [c.id, c.target]));
for (const u of uncovered) {
  const cid = u.cards[0];
  console.log(`  ${u.tok}\t[${u.cards.length} card(s)] ${cid}: ${byCard.get(cid)}`);
}

process.exit(uncovered.length === 0 && conjFail.length === 0 && dupTargets.length === 0 && structural.length === 0 ? 0 : 1);
