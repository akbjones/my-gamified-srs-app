// Hindi coverage compiler: maps the deck against the ranked syllabus and
// reports gaps, too-late introductions, inversions, and dead-weight cards.
// The syllabus (docs/hindi/syllabus.json) is the contract; this script is
// the enforcement. Run: npx tsx scripts/hindi-coverage-compiler.ts
import fs from 'fs';

interface Teachable { id: string; hi: string; roman: string; en: string; type: 'word' | 'chunk' | 'paradigm'; tier: number; note?: string }
interface Hit { firstPos: number | null; firstId: string | null; count: number }

const deck = JSON.parse(fs.readFileSync('src/data/hindi/deck.json', 'utf8'));
const syllabus: Teachable[] = JSON.parse(fs.readFileSync('docs/hindi/syllabus.json', 'utf8')).items;
const general = deck
  .filter((c: any) => (c.tags || []).includes('general'))
  .sort((a: any, b: any) => (a.priority ?? 999999) - (b.priority ?? 999999));

const NUKTA = /़/g;
const norm = (s: string) => s.normalize('NFC');
const denukta = (s: string) => norm(s).replace(NUKTA, '');

// Tokenized targets, raw + nukta-stripped, precomputed once.
// Phrase matching runs on punctuation-flattened text: a card ending
// "खाना खाया?" must satisfy the chunk "खाना खाया?" whatever the punctuation,
// and hyphenated pairs (भाई-बहन) must match across the hyphen.
const flatten = (s: string) => norm(s).replace(/[।.,:!?"'()–…-]/g, ' ').replace(/\s+/g, ' ').trim();
const cards = general.map((c: any, i: number) => {
  const text = flatten(c.target as string);
  const tokens = text.split(' ').filter(Boolean);
  return { id: c.id, pos: i + 1, text, textDn: denukta(text), tokens: new Set(tokens), tokensDn: new Set(tokens.map(denukta)) };
});

// Common irregular perfectives/forms for high-frequency verbs.
const IRREGULAR: Record<string, string[]> = {
  'करना': ['किया', 'की', 'किए', 'कीजिए', 'करूँ', 'करो', 'करें'],
  'जाना': ['गया', 'गई', 'गए', 'गयी', 'गये', 'जाइए', 'जाओ', 'जाएँ', 'जाऊँ'],
  'लेना': ['लिया', 'ली', 'लिए', 'लीजिए', 'लो', 'लें', 'लूँगा', 'लूँगी', 'लेगा', 'लेगी', 'लेंगे'],
  'देना': ['दिया', 'दी', 'दिए', 'दीजिए', 'दो', 'दें', 'दूँगा', 'देगा', 'देंगे'],
  'पीना': ['पिया', 'पी', 'पिए', 'पीजिए', 'पियो'],
  'होना': ['है', 'हैं', 'हूँ', 'हो', 'था', 'थी', 'थे', 'हुआ', 'हुई', 'हुए', 'होगा', 'होगी', 'होंगे'],
  'खाना': ['खाया', 'खाई', 'खाए', 'खाइए', 'खाओ', 'खाएँ'],
  'आना': ['आया', 'आई', 'आए', 'आइए', 'आओ', 'आएँ', 'आऊँगा', 'आएगा', 'आएँगे'],
};
// Regular suffix expansion on the verb stem (infinitive minus ना).
const V_SUFFIX = ['ना', 'ने', 'नी', 'ता', 'ती', 'ते', 'या', 'ये', 'ई', 'ए', 'ो', 'ें', 'ेगा', 'ेगी', 'ेंगे', 'कर', 'के', 'िए', 'ऊँगा', 'ाया', 'ेना'];

// A syllabus entry may list variants ("यह / ये", "हूँ / हो / है / हैं") and
// paradigms may use suffix notation ("-ता / -ती / -ते + हूँ/है/हैं"). Split on
// slashes and '+', drop the leading hyphen of a bound suffix, and treat each
// alternative as a form: matching ANY alternative counts as coverage.
function variants(hi: string): string[] {
  return norm(hi)
    .split(/[/+]/)
    .map(s => s.trim())
    .filter(Boolean)
    .map(s => s.replace(/^-/, ''));
}

// Noun/adjective inflection: plurals and oblique forms. A learner meeting
// चीज़ें has met चीज़; scoring only the citation form invents false gaps.
const N_SUFFIX = ['ें', 'ों', 'याँ', 'ियाँ', 'ियों', 'े', 'ी', 'ा'];

function wordForms(t: Teachable): string[] {
  const forms = new Set<string>();
  for (const base of variants(t.hi)) {
    forms.add(base);
    // Any ना-final headword is a verb in practice (खाना is both "food" and
    // "to eat"). Gating on an "to ..." gloss missed सकना ("can; be able"),
    // whose 24 सकता cards were reported as a gap.
    if (base.endsWith('ना')) {
      const stem = base.slice(0, -2);
      for (const s of V_SUFFIX) forms.add(stem + s);
      for (const f of IRREGULAR[base] || []) forms.add(f);
    } else if (t.type === 'word') {
      for (const s of N_SUFFIX) forms.add(base + s);
      // ा-final nouns/adjectives take े / ों on the stem (लड़का → लड़के/लड़कों)
      if (base.endsWith('ा')) {
        const stem = base.slice(0, -1);
        for (const s of ['े', 'ों', 'ी']) forms.add(stem + s);
      }
    }
  }
  return [...forms];
}

// Paradigms/chunks that are notation rather than literal text (bound suffixes,
// example glosses) can't be substring-matched against sentences. Their coverage
// is judged on their alternatives as tokens instead.
const isNotation = (hi: string) => /[-+]/.test(hi);

const results = new Map<string, Hit>();
for (const t of syllabus) {
  const hit: Hit = { firstPos: null, firstId: null, count: 0 };
  // A multiword verb chunk ("बंद करना", "अच्छा लगना") never appears in its
  // citation form - cards say "बंद करो", "अच्छा लग रहा है". Match the fixed
  // part plus any inflection of the final verb.
  const verbChunk = /\s\S+ना$/.test(norm(t.hi).trim()) && !/\.{2,}|…|\//.test(t.hi);
  // Paradigm items listing comma-separated examples ("शर्मा जी, माता जी") are
  // notation, not a phrase: matching ANY example proves the pattern is taught.
  const exampleList = t.type === 'paradigm' && /,/.test(t.hi);

  if (verbChunk) {
    const words = norm(t.hi).trim().split(/\s+/);
    const inf = words.pop()!;
    const prefix = flatten(words.join(' '));
    const stem = inf.slice(0, -2);
    const forms = [inf, ...V_SUFFIX.map(s => stem + s), ...(IRREGULAR[inf] || [])];
    for (const c of cards) {
      const at = c.text.indexOf(prefix);
      if (at === -1) continue;
      const rest = c.text.slice(at + prefix.length);
      if (!forms.some(f => rest.includes(f))) continue;
      hit.count++;
      if (hit.firstPos === null) { hit.firstPos = c.pos; hit.firstId = c.id; }
    }
    results.set(t.id, hit);
    continue;
  }
  if (exampleList) {
    const examples = norm(t.hi).split(',').map(s => flatten(s)).filter(Boolean);
    for (const c of cards) {
      if (!examples.some(e => c.text.includes(e))) continue;
      hit.count++;
      if (hit.firstPos === null) { hit.firstPos = c.pos; hit.firstId = c.id; }
    }
    results.set(t.id, hit);
    continue;
  }

  const literalPhrase = (t.type === 'chunk' || t.type === 'paradigm' || /\s/.test(t.hi)) && !isNotation(t.hi) && !/\//.test(t.hi);
  if (literalPhrase) {
    // A frame like "मेरा नाम ... है" is a slot pattern: its fixed parts must
    // appear in order, with anything in the gap. Split on the ellipsis BEFORE
    // flattening - flatten() strips dots, so flattening first silently fuses
    // "मेरा नाम" and "है" into one unmatchable string and reports every frame
    // as missing.
    const parts = norm(t.hi).split(/\.{2,}|…/).map(s => flatten(s)).filter(Boolean);
    const partsDn = parts.map(denukta);
    const inOrder = (hay: string, needles: string[]) => {
      let from = 0;
      for (const n of needles) {
        const at = hay.indexOf(n, from);
        if (at === -1) return false;
        from = at + n.length;
      }
      return true;
    };
    for (const c of cards) {
      if (inOrder(c.text, parts) || inOrder(c.textDn, partsDn)) {
        hit.count++;
        if (hit.firstPos === null) { hit.firstPos = c.pos; hit.firstId = c.id; }
      }
    }
  } else {
    const forms = wordForms(t);
    const formsDn = forms.map(denukta);
    for (const c of cards) {
      const found = forms.some(f => c.tokens.has(f)) || formsDn.some(f => c.tokensDn.has(f));
      if (found) {
        hit.count++;
        if (hit.firstPos === null) { hit.firstPos = c.pos; hit.firstId = c.id; }
      }
    }
  }
  results.set(t.id, hit);
}

// Tier position bands: by when a teachable of this tier should have appeared.
const BAND: Record<number, number> = { 1: 200, 2: 600, 3: 1200, 4: 2200, 5: 3200, 6: Infinity };
const gaps = syllabus.filter(t => t.tier <= 4 && results.get(t.id)!.firstPos === null);
const tail5 = syllabus.filter(t => t.tier >= 5 && results.get(t.id)!.firstPos === null);
const late = syllabus.filter(t => {
  const h = results.get(t.id)!;
  return h.firstPos !== null && h.firstPos > (BAND[t.tier] ?? Infinity);
});

// Card-side: which cards introduce which teachables (first occurrence).
const introducedAt = new Map<string, string[]>();
for (const t of syllabus) {
  const h = results.get(t.id)!;
  if (h.firstId) {
    if (!introducedAt.has(h.firstId)) introducedAt.set(h.firstId, []);
    introducedAt.get(h.firstId)!.push(t.id);
  }
}
// Dead weight: past position 300, introduces nothing, and reinforces fewer
// than two tier<=4 items.
const tierOf = new Map(syllabus.map(t => [t.id, t.tier]));
const formIndex: { forms: string[]; id: string; tier: number }[] = syllabus
  .filter(t => t.tier <= 4)
  .map(t => ({ forms: wordForms(t).map(denukta), id: t.id, tier: t.tier }));
const deadWeight: { id: string; pos: number }[] = [];
for (const c of cards) {
  if (c.pos <= 300) continue;
  if (introducedAt.has(c.id)) continue;
  let reinforce = 0;
  for (const f of formIndex) if (f.forms.some(x => c.tokensDn.has(x))) { reinforce++; if (reinforce >= 2) break; }
  if (reinforce < 2) deadWeight.push({ id: c.id, pos: c.pos });
}

const out = {
  summary: {
    syllabusItems: syllabus.length,
    covered: syllabus.filter(t => results.get(t.id)!.firstPos !== null).length,
    gapsTier1to4: gaps.length,
    uncoveredTail: tail5.length,
    tooLate: late.length,
    deadWeightCards: deadWeight.length,
  },
  gaps: gaps.map(t => ({ id: t.id, hi: t.hi, en: t.en, tier: t.tier })),
  tooLate: late.map(t => ({ id: t.id, hi: t.hi, en: t.en, tier: t.tier, firstPos: results.get(t.id)!.firstPos, firstCard: results.get(t.id)!.firstId, band: BAND[t.tier] })),
  deadWeight,
  introductions: Object.fromEntries([...introducedAt.entries()].map(([k, v]) => [k, v])),
};
fs.writeFileSync('docs/hindi/coverage-report.json', JSON.stringify(out, null, 1));
console.log(JSON.stringify(out.summary, null, 1));
console.log('\nTier-1/2 gaps:');
for (const g of out.gaps.filter(g => g.tier <= 2)) console.log(' ', g.tier, g.hi, '–', g.en);
console.log('\nWorst too-late (tier 1-2):');
for (const l of out.tooLate.filter(l => l.tier <= 2).slice(0, 20)) console.log(' ', l.tier, l.hi, '–', l.en, '@', l.firstPos, `(band ${l.band})`);
