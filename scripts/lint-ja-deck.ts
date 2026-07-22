/**
 * Japanese deck lint — the mechanical gate for the 300-card starter.
 *
 *   npx tsx scripts/lint-ja-deck.ts                # lint src/data/japanese/deck.json
 *   npx tsx scripts/lint-ja-deck.ts --file=path    # lint a wave file (pre-merge: audio/priority optional)
 *
 * Refuses (exit 1) on any hard-gate violation; prints warnings for soft
 * bands (tip coverage, tag distribution). Gates per docs/japanese-scoping.md:
 * token joins, punctuation-own-token, kana-only band, furigana coverage,
 * dictionary tap coverage, uniqueness, audio/priority convention, node-in-
 * band, register (sentence-final です/ます + offender lexicon), tip format.
 */
import { readFileSync } from 'fs';
import { lookupWord } from '../src/data/dictionary/ja';

const ROOT = new URL('..', import.meta.url).pathname;
const fileArg = process.argv.find(a => a.startsWith('--file='))?.split('=')[1];
const DECK_PATH = fileArg ?? ROOT + 'src/data/japanese/deck.json';
const raw = JSON.parse(readFileSync(DECK_PATH, 'utf8'));
// Wave files are {cards, dict, verbs}; the merged deck is a bare array.
const cards: any[] = Array.isArray(raw) ? raw : raw.cards;
const isWave = !Array.isArray(raw);

const PUNCT_TOKEN = /^[\s。、！？．，「」『』（）()［］【】!?.,;:…・〜~«»""''"'¿¡–-]+$/;
const HAN = /[一-鿿㐀-䶿々]/;
const PURE_KANA = /^[ぁ-ゖァ-ヺー]+$/;

const offenders: { word: string; severity: string }[] = JSON.parse(
  readFileSync(ROOT + 'docs/japanese-register-offenders.json', 'utf8'),
).offenders;

// seq band → allowed grammar nodes (bridge band 251-300 may reach back)
function allowedNodes(seq: number): [number, number] {
  if (seq <= 50) return [1, 4];
  if (seq <= 100) return [5, 7];
  if (seq <= 150) return [8, 10];
  if (seq <= 200) return [11, 13];
  if (seq <= 250) return [14, 16];
  return [1, 18];
}

const errors: string[] = [];
const warns: string[] = [];
const err = (id: string, msg: string) => errors.push(`${id}: ${msg}`);

const seenTargets = new Map<string, string>();
const seenIds = new Set<string>();
const dictMisses = new Map<string, number>();
let tipCount = 0;
const tagCounts: Record<string, number> = { travel: 0, work: 0, family: 0 };

for (const c of cards) {
  const id = String(c.id ?? '?');
  // ── identity & convention ──────────────────────────────────────
  if (!/^ja-\d{4}$/.test(id)) err(id, `bad id format`);
  if (seenIds.has(id)) err(id, `duplicate id`);
  seenIds.add(id);
  const seq = c.seq ?? c.priority;
  if (typeof seq !== 'number' || seq < 1 || seq > 300) err(id, `bad seq/priority ${seq}`);
  if (parseInt(id.slice(3), 10) !== seq) err(id, `id number != seq (${seq})`);
  if (!isWave) {
    if (c.audio !== `ja-${id}.mp3`) err(id, `audio "${c.audio}" != ja-${id}.mp3`);
    if (c.priority !== seq) err(id, `priority ${c.priority} != seq`);
  }
  if (!c.english || typeof c.english !== 'string') err(id, `missing english`);

  // ── tokens ─────────────────────────────────────────────────────
  const tokens: { t: string; r?: string }[] = c.tokens ?? [];
  if (!tokens.length) { err(id, `no tokens`); continue; }
  const joined = tokens.map(t => t.t).join('');
  if (joined !== c.target) err(id, `tokens join "${joined}" != target "${c.target}"`);
  const content = tokens.filter(t => !PUNCT_TOKEN.test(t.t));
  for (const t of content) {
    if (/[。、！？「」『』（）]/.test(t.t)) err(id, `punctuation glued inside token "${t.t}"`);
    if (HAN.test(t.t)) {
      if (!t.r) err(id, `kanji token "${t.t}" missing reading r`);
      else if (!PURE_KANA.test(t.r)) err(id, `reading "${t.r}" for "${t.t}" is not pure kana`);
    } else if (t.r) {
      warns.push(`${id}: kana token "${t.t}" carries redundant r`);
    }
    if (!lookupWord(t.t)) dictMisses.set(t.t, (dictMisses.get(t.t) ?? 0) + 1);
  }

  // ── kana-only band + length band ───────────────────────────────
  const isSetPhraseNode = String(c.grammarNode) === 'node-01';
  if (seq <= 50) {
    if (HAN.test(c.target)) err(id, `kanji in kana-only band: "${c.target}"`);
    // node-01 set phrases (こんにちは。) are legitimately 1-2 tokens
    const min = isSetPhraseNode ? 1 : 3;
    if (content.length < min || content.length > 6) err(id, `seq<=50 needs ${min}-6 content tokens, has ${content.length}`);
  } else if (content.length > 12) {
    warns.push(`${id}: long sentence (${content.length} content tokens)`);
  }

  // ── node band ──────────────────────────────────────────────────
  const nodeNum = parseInt(String(c.grammarNode ?? '').replace('node-', ''), 10);
  const [lo, hi] = allowedNodes(seq);
  if (!(nodeNum >= lo && nodeNum <= hi)) err(id, `node ${c.grammarNode} outside band ${lo}-${hi} for seq ${seq}`);

  // ── register ───────────────────────────────────────────────────
  const bare = c.target.replace(/[。！？]+$/, '');
  const polite = /(です|ます|ません|ました|でした|ましょう|ください)(か)?(ね|よ)?$/.test(bare);
  if (nodeNum !== 1 && !polite) err(id, `not sentence-final です/ます: "${c.target}"`);
  for (const o of offenders) {
    if (o.severity === 'high' && c.target.includes(o.word)) err(id, `register offender "${o.word}"`);
  }

  // ── uniqueness ─────────────────────────────────────────────────
  if (seenTargets.has(c.target)) err(id, `duplicate target of ${seenTargets.get(c.target)}`);
  seenTargets.set(c.target, id);

  // ── tips ───────────────────────────────────────────────────────
  if (c.grammar) {
    tipCount++;
    if (c.grammar.length > 120) err(id, `tip ${c.grammar.length} chars (>120)`);
    if (c.grammar.includes('—')) err(id, `tip contains em dash`);
    // Romanization parenthetical: "(gakusei = student)" or "(konnichiwa)"
    if (!/\([^)]*[A-Za-zāēīōū][^)]*\)/.test(c.grammar)) warns.push(`${id}: tip has no romaji parenthetical`);
  }

  // ── tags ───────────────────────────────────────────────────────
  const tags: string[] = c.tags ?? [];
  if (!tags.includes('general')) err(id, `tags missing "general"`);
  for (const t of tags) {
    if (!['general', 'travel', 'work', 'family'].includes(t)) err(id, `unknown tag "${t}"`);
    if (t !== 'general') tagCounts[t]++;
  }
}

// ── corpus-level bands (soft unless wildly off) ──────────────────
const n = cards.length;
const tipPct = (100 * tipCount) / Math.max(1, n);
if (tipPct < 20 || tipPct > 40) warns.push(`tip coverage ${tipPct.toFixed(1)}% outside 25-35% band`);
for (const [tag, count] of Object.entries(tagCounts)) {
  const pct = (100 * count) / Math.max(1, n);
  if (pct < 35 || pct > 65) warns.push(`tag "${tag}" on ${pct.toFixed(0)}% of cards (target 40-60%)`);
}

if (dictMisses.size) {
  errors.push(
    `dictionary tap-coverage misses (${dictMisses.size} surfaces): ` +
      [...dictMisses.entries()].sort((a, b) => b[1] - a[1]).slice(0, 40).map(([w, k]) => `${w}×${k}`).join(' '),
  );
}

console.log(`lint-ja-deck: ${n} cards, ${tipCount} tips (${tipPct.toFixed(1)}%), tags t/w/f = ${tagCounts.travel}/${tagCounts.work}/${tagCounts.family}`);
for (const w of warns) console.log(`  WARN ${w}`);
for (const e of errors) console.log(`  FAIL ${e}`);
console.log(errors.length ? `\n${errors.length} hard failure(s)` : '\nall hard gates green');
process.exit(errors.length ? 1 : 0);
