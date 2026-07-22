/**
 * P2 merge: 6 wave files → src/data/japanese/deck.json + append-only
 * splice of new dictionary entries and verb classifications between the
 * GENERATED-* markers (existing hand-curated entries and their comments
 * are preserved verbatim; conflicts keep the existing entry and warn).
 *
 *   npx tsx scripts/tmp/ja-p2/merge.ts
 */
import { readFileSync, writeFileSync } from 'fs';
import { DICT } from '../../../src/data/dictionary/ja';
import { KNOWN_VERBS } from '../../../src/data/conjugation/ja';

const ROOT = new URL('../../..', import.meta.url).pathname;
const WAVE_DIR = ROOT + 'scripts/tmp/ja-p2/';

interface WaveCard {
  id: string; seq: number; target: string; english: string;
  tokens: { t: string; r?: string }[]; tags: string[]; grammarNode: string; grammar?: string;
}
interface Wave {
  cards: WaveCard[];
  dict: { key: string; en: string; romaji: string; pos?: string; lemma?: string }[];
  verbs: { lemma: string; cls: string; kana?: string }[];
}

const waves: Wave[] = [];
for (let i = 1; i <= 6; i++) waves.push(JSON.parse(readFileSync(`${WAVE_DIR}wave-${i}.json`, 'utf8')));

// ── deck ─────────────────────────────────────────────────────────
const cards = waves.flatMap(w => w.cards).sort((a, b) => a.seq - b.seq);
if (cards.length !== 300) console.warn(`WARN: ${cards.length} cards (expected 300)`);
const seqs = new Set(cards.map(c => c.seq));
for (let s = 1; s <= 300; s++) if (!seqs.has(s)) console.warn(`WARN: missing seq ${s}`);

const deck = cards.map(c => ({
  id: c.id,
  target: c.target,
  english: c.english,
  tokens: c.tokens,
  ...(c.grammar ? { grammar: c.grammar } : {}),
  audio: `ja-${c.id}.mp3`,
  tags: c.tags?.includes('general') ? c.tags : ['general', ...(c.tags ?? [])],
  grammarNode: c.grammarNode,
  priority: c.seq,
}));
writeFileSync(ROOT + 'src/data/japanese/deck.json', JSON.stringify(deck, null, 1) + '\n');
console.log(`deck.json: ${deck.length} cards written`);

// ── splice helper ────────────────────────────────────────────────
function splice(path: string, endMarker: string, newLines: string[]): void {
  if (!newLines.length) { console.log(`${path}: nothing to add`); return; }
  const text = readFileSync(path, 'utf8');
  const endIdx = text.indexOf(endMarker);
  if (endIdx < 0) throw new Error(`marker ${endMarker} not found in ${path}`);
  // closing "};" immediately before the end marker
  const closeIdx = text.lastIndexOf('};', endIdx);
  if (closeIdx < 0) throw new Error(`closing }; not found before marker in ${path}`);
  const updated = text.slice(0, closeIdx) + newLines.join('\n') + '\n' + text.slice(closeIdx);
  writeFileSync(path, updated);
  console.log(`${path}: +${newLines.length} entries`);
}

const q = (s: string) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

// ── dictionary ───────────────────────────────────────────────────
const dictLines: string[] = ['  // ── P2 wave-authored entries (merged) ──'];
const dictSeen = new Set(Object.keys(DICT));
let dictSkipped = 0;
for (const w of waves) {
  for (const d of w.dict ?? []) {
    if (!d.key || dictSeen.has(d.key)) { dictSkipped++; continue; }
    dictSeen.add(d.key);
    const parts = [`en: ${q(d.en)}`, `ipa: ${q(d.romaji ?? '')}`];
    if (d.pos) parts.push(`pos: ${q(d.pos)}`);
    if (d.lemma) parts.push(`lemma: ${q(d.lemma)}`);
    dictLines.push(`  ${q(d.key)}: { ${parts.join(', ')} },`);
  }
}
splice(ROOT + 'src/data/dictionary/ja.ts', 'GENERATED-DICT-END', dictLines.length > 1 ? dictLines : []);
console.log(`dict: ${dictSeen.size - Object.keys(DICT).length} new, ${dictSkipped} duplicates skipped`);

// ── verbs ────────────────────────────────────────────────────────
const CLS_OK = new Set(['godan', 'ichidan', 'suru', 'kuru', 'iadj']);
const verbLines: string[] = ['  // ── P2 wave-authored verbs (merged) ──'];
const verbSeen = new Set(Object.keys(KNOWN_VERBS));
let verbSkipped = 0;
for (const w of waves) {
  for (const v of w.verbs ?? []) {
    if (!v.lemma || verbSeen.has(v.lemma)) {
      const existing = (KNOWN_VERBS as any)[v.lemma];
      if (existing && existing.cls !== v.cls) console.warn(`WARN: class conflict ${v.lemma}: existing ${existing.cls} vs authored ${v.cls} (kept existing)`);
      verbSkipped++;
      continue;
    }
    if (!CLS_OK.has(v.cls)) { console.warn(`WARN: unknown class ${v.cls} for ${v.lemma} — skipped`); continue; }
    verbSeen.add(v.lemma);
    const parts = [`cls: ${q(v.cls)}`];
    if (v.kana && v.kana !== v.lemma) parts.push(`kana: ${q(v.kana)}`);
    verbLines.push(`  ${q(v.lemma)}: { ${parts.join(', ')} },`);
  }
}
splice(ROOT + 'src/data/conjugation/ja.ts', 'GENERATED-VERBS-END', verbLines.length > 1 ? verbLines : []);
console.log(`verbs: ${verbSeen.size - Object.keys(KNOWN_VERBS).length} new, ${verbSkipped} already known/dup`);
console.log('merge complete — now run: npx tsx scripts/lint-ja-deck.ts');
