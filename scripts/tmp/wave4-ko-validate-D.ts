// Validation harness for Korean wave-4 slice D (ko-3051..ko-3300).
// Run: npx tsx scripts/tmp/wave4-ko-validate-D.ts
import { readFileSync, existsSync } from 'node:fs';
import { lookupWord } from '../../src/data/dictionary/ko.ts';
import { haeyo, KNOWN_VERBS, findInfinitive } from '../../src/data/conjugation/ko.ts';

const DIR = new URL('.', import.meta.url).pathname;
const rd = (f: string) => JSON.parse(readFileSync(DIR + f, 'utf8'));

const cards = rd('wave4-ko-cards-D.json') as any[];
const dictD = rd('wave4-ko-dict-D.json') as Record<string, any>;
const verbsD = rd('wave4-ko-verbs-D.json') as any[];

// ---- Simulate the merge: push regular verbs into KNOWN_VERBS BEFORE any lookup ----
const irregLemmas = new Set<string>();
for (const v of verbsD) {
  if (typeof v === 'string') KNOWN_VERBS.push(v);
  else if (Array.isArray(v)) irregLemmas.add(v[0]);
  else irregLemmas.add(v.dict);
}

const PARTICLES = [
  '에서는', '에서도', '한테서', '으로는', '까지는',
  '에서', '에게', '한테', '부터', '까지', '처럼', '보다', '마다', '으로', '에는', '이랑', '하고', '께',
  '은', '는', '이', '가', '을', '를', '에', '도', '만', '와', '과', '랑', '의', '로',
];

const hangulOnly = (s: string) => s.replace(/[^가-힣]/g, '');
const inDictD = (k: string) => Object.prototype.hasOwnProperty.call(dictD, k);

function covered(rawTok: string): boolean {
  const clean = rawTok.replace(/^[^가-힣A-Za-z0-9]+|[^가-힣A-Za-z0-9]+$/g, '');
  if (!clean) return true;
  if (inDictD(clean)) return true;
  if (lookupWord(clean)) return true;
  const w = hangulOnly(clean);
  if (!w) return true; // numbers / latin only
  if (inDictD(w)) return true;
  if (lookupWord(w)) return true;
  const lem = findInfinitive(w);
  if (lem && (inDictD(lem) || lookupWord(lem))) return true;
  for (const p of PARTICLES) {
    if (w.endsWith(p) && w.length > p.length) {
      const base = w.slice(0, -p.length);
      if (inDictD(base) || lookupWord(base)) return true;
      const l2 = findInfinitive(base);
      if (l2 && (inDictD(l2) || lookupWord(l2))) return true;
    }
  }
  return false;
}

const errors: string[] = [];
const uncovered = new Map<string, string[]>();

// 1. format + register + ids
cards.forEach((c, i) => {
  const expected = 3051 + i;
  const wantNode = expected <= 3175 ? 'node-27' : 'node-28';
  if (c.id !== `ko-${expected}`) errors.push(`id[${i}] ${c.id} != ko-${expected}`);
  if (c.priority !== expected) errors.push(`priority ${c.id} = ${c.priority} != ${expected}`);
  if (c.audio !== `ko-ko-${expected}.mp3`) errors.push(`audio ${c.id} = ${c.audio}`);
  if (c.grammarNode !== wantNode) errors.push(`node ${c.id} = ${c.grammarNode} != ${wantNode}`);
  if (!Array.isArray(c.tags) || !c.tags.includes('general')) errors.push(`tags ${c.id} missing general`);
  if (c.grammar && [...c.grammar].length > 120) errors.push(`tip>120 ${c.id} (${[...c.grammar].length})`);
  let t = c.target.trim().replace(/["'”’.!?…\s]+$/g, '');
  t = t.replace(/,?\s*\S+\s*씨$/, '');
  t = t.replace(/["'”’.!?…\s]+$/g, '');
  if (!(t.endsWith('요') || t.endsWith('니다'))) errors.push(`register(final) ${c.id}: ...${t.slice(-6)}`);
  if (c.target.includes('당신')) errors.push(`banned 당신 ${c.id}`);
  if (/\b(나는|내가|너는|네가|너를|너의)\b/.test(c.target)) errors.push(`banmal pronoun ${c.id}`);
});

// 2. uniqueness vs existing deck + siblings A/C (+ internal)
const existing = new Set<string>(rd('_ko_existing_targets_D.json') as string[]);
for (const sib of ['wave4-ko-cards-A.json', 'wave4-ko-cards-C.json']) {
  if (existsSync(DIR + sib)) (rd(sib) as any[]).forEach((c) => existing.add(c.target));
}
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

// 4. verbs sanity
for (const v of verbsD) {
  if (typeof v === 'string') {
    const h = haeyo(v);
    if (!h) errors.push(`verbsD regular: haeyo('${v}') == null`);
    else if (!h.endsWith('요')) errors.push(`verbsD regular: haeyo('${v}')='${h}' !endsWith 요`);
    else {
      const back = findInfinitive(h);
      if (back !== v) errors.push(`verbsD regular roundtrip: findInfinitive('${h}')='${back}' != '${v}'`);
    }
  } else {
    const dict = Array.isArray(v) ? v[0] : v.dict;
    const hy = Array.isArray(v) ? v[1] : v.haeyo;
    if (!dict.endsWith('다')) errors.push(`verbsD irregular dict !endsWith 다: ${dict}`);
    if (!hy.endsWith('요')) errors.push(`verbsD irregular haeyo !endsWith 요: ${hy}`);
    const naive = haeyo(dict);
    if (naive === hy) errors.push(`verbsD irregular UNNEEDED (engine already derives): ${dict} -> ${hy}`);
  }
}

// 5. dictD integrity
const knownSet = new Set(KNOWN_VERBS);
for (const [k, e] of Object.entries(dictD)) {
  if (e.lemma) {
    const lem = e.lemma;
    const ok = knownSet.has(lem) || irregLemmas.has(lem) || haeyo(lem) != null;
    if (!ok) errors.push(`dictD lemma not conjugable: '${k}' -> '${lem}'`);
  }
  if (!e.en || !e.ipa) errors.push(`dictD entry missing en/ipa: ${k}`);
}

// ---------- report ----------
console.log('cards:', cards.length);
console.log('dictD entries:', Object.keys(dictD).length);
console.log('verbsD entries:', verbsD.length);
console.log('ERRORS:', errors.length);
errors.slice(0, 80).forEach((e) => console.log('  ✗', e));
console.log('UNCOVERED TOKEN TYPES:', uncovered.size);
const sorted = [...uncovered.entries()].sort((a, b) => a[0].localeCompare(b[0], 'ko'));
for (const [tok, ids] of sorted) console.log(`  · ${tok}  (${ids.length}x, e.g. ${ids[0]})`);
process.stdout.write('\n__UNCOVERED_JSON__' + JSON.stringify(sorted.map((x) => x[0])) + '\n');
