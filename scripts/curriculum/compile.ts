// Language-agnostic curriculum compiler.
//
// Measures any deck against its ranked syllabus and reports gaps, late
// introductions and dead weight. Inflection is handled by normalising every
// token through the language's OWN dictionary (lookupWord + lemma links)
// rather than hand-written suffix rules - the Hindi prototype needed seven
// matcher fixes precisely because those rules were hand-written, and there is
// no appetite for repeating that thirteen times.
//
//   npx tsx scripts/curriculum/compile.ts <language>
//
// Reads  docs/curriculum/<language>/syllabus.json
// Writes docs/curriculum/<language>/coverage-report.json
import fs from 'fs';
import path from 'path';

const LANG = process.argv[2];
if (!LANG) { console.error('usage: compile.ts <language>'); process.exit(1); }

const DICT_CODE: Record<string, string> = {
  spanish: 'es', french: 'fr', german: 'de', italian: 'it', portuguese: 'pt',
  russian: 'ru', turkish: 'tr', dutch: 'nl', swedish: 'sv', welsh: 'cy',
  greek: 'el', korean: 'ko', indonesian: 'id', hindi: 'hi', japanese: 'ja',
};
const code = DICT_CODE[LANG];
if (!code) { console.error('unknown language', LANG); process.exit(1); }

interface Teachable { id: string; hi?: string; word?: string; roman?: string; en: string; type: 'word' | 'chunk' | 'paradigm'; tier: number; note?: string }
interface Hit { firstPos: number | null; firstId: string | null; count: number }

const DIR = `docs/curriculum/${LANG}`;
const deck = JSON.parse(fs.readFileSync(`src/data/${LANG}/deck.json`, 'utf8'));
const syllabus: Teachable[] = JSON.parse(fs.readFileSync(path.join(DIR, 'syllabus.json'), 'utf8')).items;

const { lookupWord } = await import(`../../src/data/dictionary/${code}.ts`);

const general = deck
  .filter((c: any) => (c.tags || []).includes('general'))
  .sort((a: any, b: any) => (a.priority ?? 999999) - (b.priority ?? 999999));

const flatten = (s: string) =>
  s.normalize('NFC').replace(/[।.,:;!?"'()\[\]–—…«»¿¡]/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();

// A token's key is its lemma when the dictionary knows one, else the token
// itself. Matching on keys makes "schnurrenden"/"schnurren" and "चीज़ें"/"चीज़"
// the same teachable without a single hand-written rule.
const keyCache = new Map<string, string>();
function keyOf(token: string): string {
  const t = token.normalize('NFC').toLowerCase();
  const hit = keyCache.get(t);
  if (hit !== undefined) return hit;
  let k = t;
  try {
    const e = lookupWord(t);
    if (e && e.lemma) k = String(e.lemma).normalize('NFC').toLowerCase();
  } catch { /* dictionary miss - fall back to the surface form */ }
  keyCache.set(t, k);
  return k;
}

const cards = general.map((c: any, i: number) => {
  const text = flatten(String(c.target));
  const tokens = text.split(' ').filter(Boolean);
  return { id: c.id, pos: i + 1, text, tokens: new Set(tokens), keys: new Set(tokens.map(keyOf)) };
});

const headword = (t: Teachable) => String(t.hi ?? t.word ?? '').normalize('NFC');
// Variants ("yo / tú", "hûn / ye"), bound suffixes ("-ando"), example lists.
const variants = (s: string) => s.split(/[/+]/).map(x => x.trim().replace(/^-/, '')).filter(Boolean);
const isNotation = (s: string) => /[-+→]/.test(s);

const results = new Map<string, Hit>();
for (const t of syllabus) {
  const hw = headword(t);
  const hit: Hit = { firstPos: null, firstId: null, count: 0 };
  if (!hw) { results.set(t.id, hit); continue; }

  const multiword = /\s/.test(hw.trim());
  const hasSlot = /\.{2,}|…/.test(hw);
  const exampleList = t.type === 'paradigm' && /,/.test(hw);

  let test: (c: typeof cards[number]) => boolean;

  if (exampleList) {
    const examples = hw.split(',').map(flatten).filter(Boolean);
    test = c => examples.some(e => c.text.includes(e));
  } else if (hasSlot) {
    // "me llamo ... y soy de ..." - fixed parts must appear in order.
    const parts = hw.split(/\.{2,}|…/).map(flatten).filter(Boolean);
    test = c => {
      let from = 0;
      for (const p of parts) {
        const at = c.text.indexOf(p, from);
        if (at === -1) return false;
        from = at + p.length;
      }
      return true;
    };
  } else if (multiword && !isNotation(hw) && !hw.includes('/')) {
    // Multiword expression. Try it literally, then allow the final word to
    // inflect ("bajar la basura" -> "baja la basura") by matching the fixed
    // prefix plus any token sharing the final word's lemma key.
    const flat = flatten(hw);
    const words = flat.split(' ');
    const last = words.pop()!;
    const prefix = words.join(' ');
    const lastKey = keyOf(last);
    test = c => {
      if (c.text.includes(flat)) return true;
      if (!prefix || !c.text.includes(prefix)) return false;
      const rest = c.text.slice(c.text.indexOf(prefix) + prefix.length).trim().split(' ');
      return rest.some(w => w === last || keyOf(w) === lastKey);
    };
  } else {
    // Single word (or a variant list): any variant, by surface or by lemma key.
    const forms = variants(hw).map(v => flatten(v)).filter(Boolean);
    const keys = forms.map(keyOf);
    test = c => forms.some(f => c.tokens.has(f)) || keys.some(k => c.keys.has(k));
  }

  for (const c of cards) {
    if (!test(c)) continue;
    hit.count++;
    if (hit.firstPos === null) { hit.firstPos = c.pos; hit.firstId = c.id; }
  }
  results.set(t.id, hit);
}

// Bands scale with deck size so the metric is comparable across decks of
// different lengths (a 3,100-card deck and a 3,950-card one both mean "the
// first ~6% of the course" for tier 1).
const N = cards.length;
const BAND: Record<number, number> = {
  1: Math.round(N * 0.06), 2: Math.round(N * 0.19),
  3: Math.round(N * 0.38), 4: Math.round(N * 0.70), 5: N, 6: Infinity,
};

const gaps = syllabus.filter(t => t.tier <= 4 && results.get(t.id)!.firstPos === null);
const late = syllabus.filter(t => {
  const h = results.get(t.id)!;
  return h.firstPos !== null && h.firstPos > (BAND[t.tier] ?? Infinity);
});
const introducedAt = new Map<string, string[]>();
for (const t of syllabus) {
  const h = results.get(t.id)!;
  if (!h.firstId) continue;
  if (!introducedAt.has(h.firstId)) introducedAt.set(h.firstId, []);
  introducedAt.get(h.firstId)!.push(t.id);
}

const byTier = (arr: Teachable[]) => [1, 2, 3, 4].map(t => arr.filter(x => x.tier === t).length);
const out = {
  language: LANG,
  summary: {
    deckCards: N,
    syllabusItems: syllabus.length,
    covered: syllabus.filter(t => results.get(t.id)!.firstPos !== null).length,
    gapsTotal: gaps.length,
    gapsByTier: byTier(gaps),
    tooLate: late.length,
    tooLateByTier: byTier(late),
    cardsThatTeachSomething: introducedAt.size,
    bands: BAND,
  },
  gaps: gaps.map(t => ({ id: t.id, word: headword(t), en: t.en, tier: t.tier })),
  tooLate: late.map(t => ({ id: t.id, word: headword(t), en: t.en, tier: t.tier,
    firstPos: results.get(t.id)!.firstPos, firstCard: results.get(t.id)!.firstId, band: BAND[t.tier] })),
  introductions: Object.fromEntries(introducedAt),
};
fs.mkdirSync(DIR, { recursive: true });
fs.writeFileSync(path.join(DIR, 'coverage-report.json'), JSON.stringify(out, null, 1));
console.log(JSON.stringify(out.summary, null, 1));
