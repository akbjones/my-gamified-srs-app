/**
 * Merge Korean wave 4 (slices A–D, ko-2301..ko-2300) into deck + dict +
 * engine (KNOWN_VERBS + IRREGULARS), with the standard wave gates.
 *
 *   npx tsx scripts/tmp/merge-ko-wave4.ts          # check only
 *   npx tsx scripts/tmp/merge-ko-wave4.ts --write  # write deck + dict + verbs
 */
import { readFileSync, writeFileSync } from 'fs';
import { lookupWord } from '../../src/data/dictionary/ko';
import { findInfinitive, haeyo, past, future, conjugate } from '../../src/data/conjugation/ko';

const ROOT = new URL('../..', import.meta.url).pathname;
const write = process.argv.includes('--write');

interface Card { id: string; target: string; english: string; audio: string; tags: string[]; grammarNode: string; priority: number; grammar?: string }
interface DictEntry { en: string; ipa?: string; pos?: string; lemma?: string }
type VerbSpec = string | { dict: string; haeyo: string } | [string, string];

const existing: Card[] = JSON.parse(readFileSync(`${ROOT}src/data/korean/deck.json`, 'utf8'));
const newCards: Card[] = [];
const dict: Record<string, DictEntry> = {};
const regulars = new Set<string>();
const irregulars = new Map<string, string>(); // dict form → haeyo
for (const b of ['A', 'B', 'C', 'D']) {
  newCards.push(...JSON.parse(readFileSync(`${ROOT}scripts/tmp/wave4-ko-cards-${b}.json`, 'utf8')));
  const d: Record<string, DictEntry> = JSON.parse(readFileSync(`${ROOT}scripts/tmp/wave4-ko-dict-${b}.json`, 'utf8'));
  for (const [k, v] of Object.entries(d)) if (!dict[k]) dict[k] = v;
  try {
    const vs: VerbSpec[] = JSON.parse(readFileSync(`${ROOT}scripts/tmp/wave4-ko-verbs-${b}.json`, 'utf8'));
    for (const v of vs) {
      if (typeof v === 'string') regulars.add(v);
      else if (Array.isArray(v)) { if (!irregulars.has(v[0])) irregulars.set(v[0], v[1]); }
      else if (!irregulars.has(v.dict)) irregulars.set(v.dict, v.haeyo);
    }
  } catch { /* verbs file optional */ }
}

const problems: string[] = [];
const warnings: string[] = [];

// ids: continue exactly from ko-0301
const allIds = new Set(existing.map(c => c.id));
newCards.sort((a, b) => a.id.localeCompare(b.id));
newCards.forEach((c, i) => {
  const want = `ko-${String(i + 2301).padStart(4, '0')}`;
  if (c.id !== want) problems.push(`id gap: got ${c.id}, expected ${want}`);
  if (allIds.has(c.id)) problems.push(`id collision: ${c.id}`);
  if (c.audio !== `ko-${c.id}.mp3`) problems.push(`${c.id}: audio "${c.audio}"`);
  if (!c.tags?.includes('general')) problems.push(`${c.id}: missing general tag`);
  if (!c.target || !c.english) problems.push(`${c.id}: null target/english`);
});

// sentence uniqueness across OLD + NEW (hangul-only normalization)
const norm = (t: string) => t.replace(/[^가-힣 ]/g, '').replace(/\s+/g, ' ').trim();
const seen = new Map<string, string>();
for (const c of [...existing, ...newCards]) {
  const n = norm(c.target);
  if (seen.has(n)) problems.push(`dup sentence: ${c.id} == ${seen.get(n)}`);
  seen.set(n, c.id);
}

// register offenders + register shape: every sentence ends -요 or -니다/-까
const off = JSON.parse(readFileSync(`${ROOT}docs/korean-register-offenders.json`, 'utf8'));
for (const c of newCards) {
  const toks = new Set(norm(c.target).split(' '));
  for (const o of off.offenders) if (toks.has(o.word)) problems.push(`${c.id}: offender "${o.word}" (${o.severity})`);
  const lastWord = norm(c.target).split(' ').pop() ?? '';
  if (lastWord && !/(요|니다|니까)$/.test(lastWord)) warnings.push(`${c.id}: sentence-final "${lastWord}" not -요/-니다 (check register)`);
}

// tips
const tips = newCards.filter(c => c.grammar);
for (const c of tips) if (c.grammar!.length > 120) problems.push(`${c.id}: tip ${c.grammar!.length} chars`);

// verb specs sanity: regulars must be engine-derivable NOW
for (const v of regulars) {
  if (!haeyo(v)) problems.push(`regular verb "${v}" not derivable — should it be an irregular spec?`);
}

// token coverage (report-only; audit-lang enforces post-write)
const verbForms = new Set<string>();
const addForms = (dictForm: string, politeOverride?: string) => {
  const forms = [politeOverride ?? haeyo(dictForm), past(dictForm), future(dictForm), dictForm];
  for (const f of forms) {
    if (!f) continue;
    for (const p of f.split(' ')) { verbForms.add(p); if (p.endsWith('요')) verbForms.add(p.slice(0, -1)); }
  }
};
for (const v of regulars) addForms(v);
for (const [d, h] of irregulars) addForms(d, h);
const missing = new Map<string, number>();
for (const c of newCards) {
  for (const raw of c.target.split(/\s+/)) {
    const tok = raw.replace(/[^가-힣]/g, '');
    if (!tok) continue;
    if (dict[tok]) continue;
    if (lookupWord(tok)) continue;
    if (findInfinitive(tok)) continue;
    if (verbForms.has(tok)) continue;
    if ([...verbForms].some(f => f.length >= 2 && tok.endsWith(f))) continue;
    missing.set(tok, (missing.get(tok) || 0) + 1);
  }
}
if (missing.size) warnings.push(`${missing.size} tokens uncovered (audit will enforce): ${[...missing.keys()].slice(0, 20).join(', ')}`);

const tagCount: Record<string, number> = {};
for (const c of newCards) for (const t of c.tags) tagCount[t] = (tagCount[t] || 0) + 1;
console.log(`new cards: ${newCards.length}, tips: ${tips.length} (${Math.round(tips.length * 100 / newCards.length)}%), dict offered: ${Object.keys(dict).length}, verbs: +${regulars.size} regular, +${irregulars.size} irregular`);
console.log('tags:', JSON.stringify(tagCount));
for (const w of warnings.slice(0, 25)) console.log('WARN:', w);
if (warnings.length > 25) console.log(`  … ${warnings.length - 25} more warnings`);
if (problems.length) {
  console.log(`\n${problems.length} PROBLEMS:`);
  for (const p of problems.slice(0, 40)) console.log('  ·', p);
}

if (write) {
  if (problems.length) { console.log('\nrefusing to --write with problems present'); process.exit(1); }
  writeFileSync(`${ROOT}src/data/korean/deck.json`, JSON.stringify([...existing, ...newCards], null, 1) + '\n');
  // dict splice before DICT closing brace (followed by PARTICLES comment)
  let src = readFileSync(`${ROOT}src/data/dictionary/ko.ts`, 'utf8');
  const existingKeys = new Set([...src.matchAll(/^\s{2}['"]([^'"]+)['"]:\s*\{/gm)].map(m => m[1]));
  const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const lines = Object.entries(dict)
    .filter(([k]) => !existingKeys.has(k))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => {
      const parts = [`en: '${esc(v.en)}'`];
      parts.push(`ipa: '${esc(v.ipa ?? '')}'`);
      if (v.pos) parts.push(`pos: '${esc(v.pos)}'`);
      if (v.lemma) parts.push(`lemma: '${esc(v.lemma)}'`);
      return `  '${esc(k)}': { ${parts.join(', ')} },`;
    });
  const block = `\n  // ── Wave-4 entries (generated by merge-ko-wave4.ts) ──\n${lines.join('\n')}\n`;
  const dictAnchor = /\n};\n\n\/\/ Noun particles/;
  if (!dictAnchor.test(src)) { console.log('dict anchor missing'); process.exit(1); }
  src = src.replace(dictAnchor, `${block}};\n\n// Noun particles`);
  writeFileSync(`${ROOT}src/data/dictionary/ko.ts`, src);
  // engine: KNOWN_VERBS + IRREGULARS splices
  let eng = readFileSync(`${ROOT}src/data/conjugation/ko.ts`, 'utf8');
  const freshReg = [...regulars, ...irregulars.keys()].filter(v => !eng.includes(`'${v}'`)).sort();
  const kvRe = /\n];\n\nfunction buildReverse/;
  if (!kvRe.test(eng)) { console.log('KNOWN_VERBS anchor missing'); process.exit(1); }
  if (freshReg.length) {
    eng = eng.replace(kvRe, `\n  // wave-4 verbs\n  ${freshReg.map(v => `'${v}'`).join(', ')},\n];\n\nfunction buildReverse`);
  }
  const irrRe = /\n};\n\n\/\/ Past forms the/;
  if (!irrRe.test(eng)) { console.log('IRREGULARS anchor missing'); process.exit(1); }
  const freshIrr = [...irregulars].filter(([d]) => !eng.includes(`'${d}':`));
  if (freshIrr.length) {
    eng = eng.replace(irrRe, `\n  // wave-4 irregulars\n${freshIrr.map(([d, h]) => `  '${d}': '${h}',`).join('\n')}\n};\n\n// Past forms the`);
  }
  writeFileSync(`${ROOT}src/data/conjugation/ko.ts`, eng);
  console.log(`\nwrote deck (${existing.length + newCards.length} cards), dict (+${lines.length}), verbs (+${freshReg.length} known, +${freshIrr.length} irregular)`);
}
