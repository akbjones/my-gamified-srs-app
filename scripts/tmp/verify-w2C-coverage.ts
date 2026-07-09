/**
 * Coverage validation for wave-2 slice C (el-0801..el-1050):
 * every target token must resolve via lookupWord (el.ts dict),
 * findInfinitive (engine), the slice-C dict, or a form of a slice-C verb.
 */
import { readFileSync } from 'fs';
import { lookupWord } from '../../src/data/dictionary/el';
import { findInfinitive, conjugate, normalizeGreek, stripAccents } from '../../src/data/conjugation/el';

const ROOT = '/Users/antoinevj/Documents/GitHub/my-gamified-srs-app/.claude/worktrees/awesome-jones';
const cards: any[] = JSON.parse(readFileSync(`${ROOT}/scripts/tmp/wave2-el-cards-C.json`, 'utf8'));
const dict: Record<string, any> = JSON.parse(readFileSync(`${ROOT}/scripts/tmp/wave2-el-dict-C.json`, 'utf8'));
const verbs: string[] = JSON.parse(readFileSync(`${ROOT}/scripts/tmp/wave2-el-verbs-C.json`, 'utf8'));

const errs: string[] = [];

// dict hygiene: keys lowercase + σ-normalized, entries complete
const dictBare = new Set<string>();
for (const [k, v] of Object.entries(dict)) {
  if (k !== normalizeGreek(k)) errs.push(`dict key not σ-normalized/lowercase: ${k}`);
  if (!v.en || !v.ipa || !v.pos) errs.push(`dict entry incomplete: ${k}`);
  if (v.lemma && !conjugate(v.lemma)) errs.push(`dict ${k}: lemma ${v.lemma} not conjugatable`);
  dictBare.add(stripAccents(k));
}

// verbs: engine must conjugate each, with the tenses the cards rely on
const verbForms = new Set<string>();
for (const v of verbs) {
  const t = conjugate(v);
  if (!t) { errs.push(`verb ${v}: engine returns null`); continue; }
  if (!t.tenses['Παρατατικός (Imperfect)']) errs.push(`verb ${v}: no imperfect`);
  for (const forms of Object.values(t.tenses)) {
    for (const f of forms) {
      for (const piece of f.split(' ')) verbForms.add(stripAccents(normalizeGreek(piece)));
    }
  }
  verbForms.add(stripAccents(normalizeGreek(v)));
}

// token coverage
const tokenize = (t: string): string[] =>
  t.split(/\s+/)
    .map((w) => normalizeGreek(w).replace(/[^α-ωάέήίόύώϊϋΐΰ]/g, ''))
    .filter(Boolean);

const allTokens = new Set<string>();
const uncovered = new Map<string, string>();
let viaDict = 0, viaEngine = 0, viaNewDict = 0, viaNewVerbs = 0;
for (const c of cards) {
  for (const tok of tokenize(c.target)) {
    if (allTokens.has(tok)) continue;
    allTokens.add(tok);
    if (lookupWord(tok)) { viaDict++; continue; }
    if (findInfinitive(tok)) { viaEngine++; continue; }
    if (dict[tok] || dictBare.has(stripAccents(tok))) { viaNewDict++; continue; }
    if (verbForms.has(stripAccents(tok))) { viaNewVerbs++; continue; }
    uncovered.set(tok, c.id);
  }
}

console.log(`cards: ${cards.length}`);
console.log(`unique tokens: ${allTokens.size}`);
console.log(`covered — el.ts dict: ${viaDict}, engine: ${viaEngine}, new dict: ${viaNewDict}, new verbs: ${viaNewVerbs}`);
console.log(`new dict entries: ${Object.keys(dict).length}, new verbs: ${verbs.length}`);
console.log(`UNCOVERED: ${uncovered.size}`);
for (const [tok, id] of uncovered) console.log(`  ${id}: ${tok}`);
if (errs.length) { console.log(`\nERRORS (${errs.length}):`); for (const e of errs) console.log('  ·', e); }
process.exit(errs.length || uncovered.size ? 1 : 0);
