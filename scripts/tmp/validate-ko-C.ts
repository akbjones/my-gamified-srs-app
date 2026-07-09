// Validation harness for Korean wave-3 slice C. Run: npx tsx scripts/tmp/validate-ko-C.ts
import { readFileSync } from 'node:fs';
import { lookupWord } from '../../src/data/dictionary/ko.ts';
import { haeyo, past, future, KNOWN_VERBS, findInfinitive } from '../../src/data/conjugation/ko.ts';

const DIR = new URL('.', import.meta.url).pathname;
const rd = (f: string) => JSON.parse(readFileSync(DIR + f, 'utf8'));

const cards = rd('wave3-ko-cards-C.json') as any[];
const dictC = rd('wave3-ko-dict-C.json') as Record<string, any>;
const verbsC = rd('wave3-ko-verbs-C.json') as any[];

// ---- Simulate the merge: push regular verbs into KNOWN_VERBS BEFORE any lookup ----
const irregLemmas = new Set<string>();
for (const v of verbsC) {
  if (typeof v === 'string') KNOWN_VERBS.push(v);
  else if (Array.isArray(v)) irregLemmas.add(v[0]);
  else irregLemmas.add(v.dict);
}

// Same particle list as the real dictionary (longest first).
const PARTICLES = [
  '에서는','에서도','한테서','으로는','까지는',
  '에서','에게','한테','부터','까지','처럼','보다','마다','으로','에는','이랑','하고','께',
  '은','는','이','가','을','를','에','도','만','와','과','랑','의','로',
];

const hangulOnly = (s: string) => s.replace(/[^가-힣]/g, '');
const inDictC = (k: string) => Object.prototype.hasOwnProperty.call(dictC, k);

function covered(rawTok: string): boolean {
  const clean = rawTok.replace(/^[^가-힣A-Za-z0-9]+|[^가-힣A-Za-z0-9]+$/g, '');
  if (!clean) return true;
  if (inDictC(clean)) return true;
  if (lookupWord(clean)) return true;
  const w = hangulOnly(clean);
  if (!w) return true; // numbers / latin only
  if (inDictC(w)) return true;
  if (lookupWord(w)) return true;
  const lem = findInfinitive(w);
  if (lem && (inDictC(lem) || lookupWord(lem))) return true;
  for (const p of PARTICLES) {
    if (w.endsWith(p) && w.length > p.length) {
      const base = w.slice(0, -p.length);
      if (inDictC(base) || lookupWord(base)) return true;
      const l2 = findInfinitive(base);
      if (l2 && (inDictC(l2) || lookupWord(l2))) return true;
    }
  }
  return false;
}

// ---------- checks ----------
const errors: string[] = [];
const uncovered = new Map<string, string[]>(); // token -> card ids

// 1. format + register + ids
let idErr = 0;
cards.forEach((c, i) => {
  const expected = 1801 + i;
  const wantNode = expected <= 1925 ? 'node-17' : 'node-18';
  if (c.id !== `ko-${expected}`) { errors.push(`id[${i}] ${c.id} != ko-${expected}`); idErr++; }
  if (c.priority !== expected) errors.push(`priority ${c.id} = ${c.priority} != ${expected}`);
  if (c.audio !== `ko-ko-${expected}.mp3`) errors.push(`audio ${c.id} = ${c.audio}`);
  if (c.grammarNode !== wantNode) errors.push(`node ${c.id} = ${c.grammarNode} != ${wantNode}`);
  if (!Array.isArray(c.tags) || !c.tags.includes('general')) errors.push(`tags ${c.id} missing general`);
  if (c.grammar && [...c.grammar].length > 120) errors.push(`tip>120 ${c.id} (${[...c.grammar].length})`);
  // register: sentence must end in 요 or 니다 (strip trailing punct/quotes and a
  // trailing vocative "…씨" as in deck ko-0001 "안녕하세요, 민수 씨.")
  let t = c.target.trim().replace(/["'”’.!?…\s]+$/g, '');
  t = t.replace(/,?\s*\S+\s*씨$/, ''); // drop trailing "name 씨" vocative
  t = t.replace(/["'”’.!?…\s]+$/g, '');
  if (!(t.endsWith('요') || t.endsWith('니다'))) errors.push(`register(final) ${c.id}: ...${t.slice(-6)}`);
  if (c.target.includes('당신')) errors.push(`banned 당신 ${c.id}`);
});

// 2. uniqueness vs existing (deck + A/B/D) + internal
const existing = new Set<string>(rd('_ko_existing_targets.json') as string[]);
const seen = new Set<string>();
for (const c of cards) {
  if (existing.has(c.target)) errors.push(`dup vs existing: ${c.id} ${c.target}`);
  if (seen.has(c.target)) errors.push(`internal dup: ${c.id} ${c.target}`);
  seen.add(c.target);
}

// 3. coverage
for (const c of cards) {
  for (const tok of c.target.split(/\s+/)) {
    if (!covered(tok)) {
      if (!uncovered.has(tok)) uncovered.set(tok, []);
      uncovered.get(tok)!.push(c.id);
    }
  }
}

// 4. verbs-C sanity
for (const v of verbsC) {
  if (typeof v === 'string') {
    const h = haeyo(v);
    if (!h) errors.push(`verbsC regular: haeyo('${v}') == null`);
    else if (!h.endsWith('요')) errors.push(`verbsC regular: haeyo('${v}')='${h}' !endsWith 요`);
    else {
      const back = findInfinitive(h);
      if (back !== v) errors.push(`verbsC regular roundtrip: findInfinitive('${h}')='${back}' != '${v}'`);
    }
  } else {
    const dict = Array.isArray(v) ? v[0] : v.dict;
    const hy = Array.isArray(v) ? v[1] : v.haeyo;
    if (!dict.endsWith('다')) errors.push(`verbsC irregular dict !endsWith 다: ${dict}`);
    if (!hy.endsWith('요')) errors.push(`verbsC irregular haeyo !endsWith 요: ${hy}`);
    const naive = haeyo(dict);
    if (naive === hy) errors.push(`verbsC irregular UNNEEDED (engine already derives): ${dict} -> ${hy}`);
  }
}

// 5. dictC lemma integrity: every lemma referenced must be conjugable (engine-known or in verbsC)
const knownSet = new Set(KNOWN_VERBS);
for (const [k, e] of Object.entries(dictC)) {
  if (e.lemma) {
    const lem = e.lemma;
    const ok = knownSet.has(lem) || irregLemmas.has(lem) || haeyo(lem) != null;
    if (!ok) errors.push(`dictC lemma not conjugable: '${k}' -> '${lem}'`);
  }
  if (!e.en || !e.ipa) errors.push(`dictC entry missing en/ipa: ${k}`);
}

// ---------- report ----------
console.log('cards:', cards.length);
console.log('dictC entries:', Object.keys(dictC).length);
console.log('verbsC entries:', verbsC.length);
console.log('ERRORS:', errors.length);
errors.slice(0, 60).forEach(e => console.log('  ✗', e));
console.log('UNCOVERED TOKEN TYPES:', uncovered.size);
const sorted = [...uncovered.entries()].sort((a, b) => a[0].localeCompare(b[0], 'ko'));
for (const [tok, ids] of sorted) {
  console.log(`  · ${tok}  (${ids.length}x, e.g. ${ids[0]})`);
}
// machine-readable
process.stdout.write('\n__UNCOVERED_JSON__' + JSON.stringify(sorted.map(x => x[0])) + '\n');
