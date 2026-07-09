/**
 * Merge Greek wave 4 (slices A–D, el-2301..el-2300) into deck + dict +
 * KNOWN_VERBS, with the wave-5 Indonesian gates.
 *
 *   npx tsx scripts/tmp/merge-el-wave4.ts          # check only
 *   npx tsx scripts/tmp/merge-el-wave4.ts --write  # write deck + dict + verbs
 */
import { readFileSync, writeFileSync } from 'fs';
import { lookupWord } from '../../src/data/dictionary/el';
import { findInfinitive, conjugate, normalizeGreek, stripAccents } from '../../src/data/conjugation/el';

const ROOT = new URL('../..', import.meta.url).pathname;
const write = process.argv.includes('--write');

interface Card { id: string; target: string; english: string; audio: string; tags: string[]; grammarNode: string; priority: number; grammar?: string }
interface DictEntry { en: string; ipa?: string; pos?: string; lemma?: string }

const existing: Card[] = JSON.parse(readFileSync(`${ROOT}src/data/greek/deck.json`, 'utf8'));
const newCards: Card[] = [];
const dict: Record<string, DictEntry> = {};
const newVerbs = new Set<string>();
for (const b of ['A', 'B', 'C', 'D']) {
  newCards.push(...JSON.parse(readFileSync(`${ROOT}scripts/tmp/wave4-el-cards-${b}.json`, 'utf8')));
  const d: Record<string, DictEntry> = JSON.parse(readFileSync(`${ROOT}scripts/tmp/wave4-el-dict-${b}.json`, 'utf8'));
  for (const [k, v] of Object.entries(d)) {
    const key = normalizeGreek(k);
    if (!dict[key]) dict[key] = v;
  }
  try {
    for (const r of JSON.parse(readFileSync(`${ROOT}scripts/tmp/wave4-el-verbs-${b}.json`, 'utf8'))) newVerbs.add(r);
  } catch { /* verbs file optional */ }
}

const problems: string[] = [];
const warnings: string[] = [];

// ids: continue exactly from el-0301, unique overall
const allIds = new Set(existing.map(c => c.id));
newCards.sort((a, b) => a.id.localeCompare(b.id));
newCards.forEach((c, i) => {
  const want = `el-${String(i + 2301).padStart(4, '0')}`;
  if (c.id !== want) problems.push(`id gap: got ${c.id}, expected ${want}`);
  if (allIds.has(c.id)) problems.push(`id collision: ${c.id}`);
  if (c.audio !== `el-${c.id}.mp3`) problems.push(`${c.id}: audio "${c.audio}"`);
  if (!c.tags?.includes('general')) problems.push(`${c.id}: missing general tag`);
  if (!c.target || !c.english) problems.push(`${c.id}: null target/english`);
});

// sentence uniqueness across OLD + NEW (accent-blind, σ-normalized)
const norm = (t: string) => stripAccents(normalizeGreek(t)).replace(/[^α-ω ]/g, '').replace(/\s+/g, ' ').trim();
const seen = new Map<string, string>();
for (const c of [...existing, ...newCards]) {
  const n = norm(c.target);
  if (seen.has(n)) problems.push(`dup sentence: ${c.id} == ${seen.get(n)}`);
  seen.set(n, c.id);
}

// register offenders
const off = JSON.parse(readFileSync(`${ROOT}docs/greek-register-offenders.json`, 'utf8'));
for (const c of newCards) {
  const toks = new Set(norm(c.target).split(' '));
  for (const o of off.offenders) if (toks.has(norm(o.word))) problems.push(`${c.id}: offender "${o.word}" (${o.severity})`);
}

// tips
const tips = newCards.filter(c => c.grammar);
for (const c of tips) if (c.grammar!.length > 120) problems.push(`${c.id}: tip ${c.grammar!.length} chars`);

// token coverage: existing dict lookup, engine reversal, offered dict, new verbs
const verbForms = new Set<string>();
for (const v of newVerbs) {
  const t = conjugate(v);
  if (!t) { problems.push(`new verb "${v}" not conjugable by engine`); continue; }
  for (const forms of Object.values(t.tenses)) {
    for (const f of forms) for (const p of f.split(' ')) verbForms.add(stripAccents(normalizeGreek(p)));
  }
  verbForms.add(stripAccents(normalizeGreek(v)));
}
const missing = new Map<string, number>();
for (const c of newCards) {
  for (const raw of c.target.split(/\s+/)) {
    const tok = normalizeGreek(raw).replace(/[^α-ω]/g, '');
    if (!tok) continue;
    const bare = stripAccents(tok);
    if (dict[tok] || dict[bare]) continue;
    if (lookupWord(tok)) continue;
    if (findInfinitive(tok)) continue;
    if (verbForms.has(bare)) continue;
    missing.set(tok, (missing.get(tok) || 0) + 1);
  }
}
if (missing.size) warnings.push(`${missing.size} tokens uncovered (audit will enforce): ${[...missing.keys()].slice(0, 20).join(', ')}`);

const tagCount: Record<string, number> = {};
for (const c of newCards) for (const t of c.tags) tagCount[t] = (tagCount[t] || 0) + 1;
console.log(`new cards: ${newCards.length}, tips: ${tips.length} (${Math.round(tips.length * 100 / newCards.length)}%), dict offered: ${Object.keys(dict).length}, new verbs: ${newVerbs.size}`);
console.log('tags:', JSON.stringify(tagCount));
for (const w of warnings) console.log('WARN:', w);
if (problems.length) {
  console.log(`\n${problems.length} PROBLEMS:`);
  for (const p of problems.slice(0, 40)) console.log('  ·', p);
}

if (write) {
  if (problems.length) { console.log('\nrefusing to --write with problems present'); process.exit(1); }
  writeFileSync(`${ROOT}src/data/greek/deck.json`, JSON.stringify([...existing, ...newCards], null, 1) + '\n');
  // dict splice before the DICT closing brace (which is followed by lookupWord)
  let src = readFileSync(`${ROOT}src/data/dictionary/el.ts`, 'utf8');
  const existingKeys = new Set([...src.matchAll(/^\s{2}['"]([^'"]+)['"]:\s*\{/gm)].map(m => normalizeGreek(m[1])));
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
  const block = `\n  // ── Wave-4 entries (generated by merge-el-wave4.ts) ──\n${lines.join('\n')}\n`;
  if (!/\n};\n\nexport function lookupWord/.test(src)) { console.log('dict anchor missing'); process.exit(1); }
  src = src.replace(/\n};\n\nexport function lookupWord/, `${block}};\n\nexport function lookupWord`);
  writeFileSync(`${ROOT}src/data/dictionary/el.ts`, src);
  // KNOWN_VERBS splice
  let eng = readFileSync(`${ROOT}src/data/conjugation/el.ts`, 'utf8');
  const fresh = [...newVerbs].filter(v => !eng.includes(`'${v}'`)).sort();
  if (fresh.length) {
    const re = /\n];\n\nlet KNOWN_MAP/;
    if (!re.test(eng)) { console.log('verbs anchor missing'); process.exit(1); }
    eng = eng.replace(re, `\n  // wave-4 verbs\n  ${fresh.map(v => `'${v}'`).join(', ')},\n];\n\nlet KNOWN_MAP`);
    writeFileSync(`${ROOT}src/data/conjugation/el.ts`, eng);
  }
  console.log(`\nwrote deck (${existing.length + newCards.length} cards), dict (+${lines.length}), verbs (+${fresh.length})`);
}
