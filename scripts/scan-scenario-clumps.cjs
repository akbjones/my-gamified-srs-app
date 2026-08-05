#!/usr/bin/env node
// Phase 0 of the cross-deck scenario de-clump (docs/scenario-declump-playbook.md).
// Measures every deck for scenario clumping WITHOUT judging anything:
//   - scenario-family candidates: a folded content token appearing too often,
//     too early, or too densely inside one grammar node
//   - near-duplicate pairs: token-set Jaccard between cards
//   - repeated sentence openings (first two folded tokens)
// Emits a per-deck clump score so decks can be ranked. Post-fix Hindi is the
// calibration anchor: it just went through the full pass, so anything scoring
// clearly above it has clumps worth judging.
// Run: node scripts/scan-scenario-clumps.cjs [--json=docs/declump/scan.json]
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

// ── per-language token folding ──────────────────────────────────────
// The goal is grouping inflected forms of the same content word, not real
// lemmatisation. Crude is fine: the scanner ranks decks, it doesn't judge.
const KO_PARTICLES = /(이|가|은|는|을|를|의|에|에서|도|와|과|랑|로|으로|만|까지|부터|처럼|보다|한테|에게|께서)$/;
function foldToken(tok, lang) {
  let t = tok.toLowerCase();
  switch (lang) {
    case 'turkish':
      t = t.replace(/ı/g, 'i');
      // agglutinative tail: fold to a 5-char stem prefix for grouping
      return t.length > 5 ? t.slice(0, 5) : t;
    case 'russian':
      t = t.normalize('NFC');
      // strip 1-2 char case/agreement endings from longer words
      return t.length > 5 ? t.replace(/(ами|ями|ого|его|ому|ему|ыми|ими|ах|ях|ам|ям|ой|ей|ом|ем|ую|юю|ая|яя|ое|ее|ые|ие|ов|ев|у|ю|а|я|ы|и|е|о)$/, '') : t;
    case 'greek':
      t = t.normalize('NFD').replace(/[̀-ͯ]/g, '');
      return t.length > 5 ? t.replace(/(ουμε|ετε|ουνε|ονται|εται|ουν|ει|εις|ες|ας|ος|ου|ων|ο|α|η|ι|ε)$/, '') : t;
    case 'korean':
      return t.length > 2 ? t.replace(KO_PARTICLES, '') : t;
    case 'hindi':
      return t.length > 3 ? t.replace(/(ों|ें|ौं|ीं|ाँ|ियों|ियाँ|ी|े|ा)$/, '') : t;
    case 'german':
      return t.length > 5 ? t.replace(/(ern|en|er|es|em|e|s|n)$/, '') : t;
    case 'spanish': case 'italian': case 'portuguese': case 'french':
      t = t.normalize('NFD').replace(/[̀-ͯ]/g, '');
      return t.length > 4 ? t.replace(/(es|s|i|e|a|o)$/, '') : t;
    case 'dutch': case 'swedish': case 'welsh': case 'indonesian':
      return t.length > 4 ? t.replace(/(en|er|et|s|e)$/, '') : t;
    default:
      return t;
  }
}

function tokens(card, lang) {
  // Japanese carries a tokens[] field (CJK has no spaces); everyone else splits.
  // Japanese tokens are objects ({t: "…"} with optional furigana reading).
  const raw = (Array.isArray(card.tokens) && card.tokens.length
    ? card.tokens.map(t => typeof t === 'string' ? t : (t.t ?? t.surface ?? ''))
    : String(card.target).split(/[\s,।。、？?!.;:"'«»()\-–]+/u)).filter(Boolean);
  return raw.map(t => foldToken(t, lang)).filter(t => t.length >= 2);
}

function scanDeck(lang, deck) {
  const N = deck.length;
  // rank by priority when present, else array order
  const ranked = [...deck].sort((a, b) => (a.priority ?? 9e9) - (b.priority ?? 9e9));
  const rankOf = new Map(ranked.map((c, i) => [c.id, i + 1]));
  const toks = new Map(deck.map(c => [c.id, tokens(c, lang)]));

  // document frequency → stopword list (function words + carrier grammar)
  const df = new Map();
  for (const c of deck) for (const t of new Set(toks.get(c.id))) df.set(t, (df.get(t) || 0) + 1);
  const stop = new Set([...df.entries()].sort((a, b) => b[1] - a[1]).slice(0, Math.max(40, N / 40)).map(e => e[0]));

  // ── scenario families ──
  const fam = new Map(); // token -> {ids, nodes: Map(node->n), early}
  for (const c of deck) {
    for (const t of new Set(toks.get(c.id))) {
      if (stop.has(t)) continue;
      let f = fam.get(t);
      if (!f) fam.set(t, f = { ids: [], nodes: new Map(), early: 0 });
      f.ids.push(c.id);
      const node = c.grammarNode || 'none';
      f.nodes.set(node, (f.nodes.get(node) || 0) + 1);
      if ((rankOf.get(c.id) || 9e9) <= 600) f.early++;
    }
  }
  const scale = N / 3172; // thresholds calibrated on Hindi's size
  const families = [];
  for (const [t, f] of fam) {
    const maxNode = Math.max(...f.nodes.values());
    if (maxNode >= 3 || f.early >= Math.ceil(5 * scale) || f.ids.length >= Math.ceil(8 * scale)) {
      families.push({ token: t, total: f.ids.length, early: f.early, maxInOneNode: maxNode,
        sampleIds: f.ids.slice(0, 6) });
    }
  }
  families.sort((a, b) => (b.maxInOneNode * 3 + b.early + b.total) - (a.maxInOneNode * 3 + a.early + a.total));

  // ── near-duplicate pairs (Jaccard over content-token sets) ──
  const sets = deck.map(c => ({ id: c.id, node: c.grammarNode,
    s: new Set(toks.get(c.id).filter(t => !stop.has(t))) }));
  const dups = [];
  for (let i = 0; i < sets.length; i++) {
    const A = sets[i]; if (A.s.size < 3) continue;
    for (let j = i + 1; j < sets.length; j++) {
      const B = sets[j]; if (B.s.size < 3) continue;
      let inter = 0;
      for (const t of A.s) if (B.s.has(t)) inter++;
      const uni = A.s.size + B.s.size - inter;
      if (uni >= 4 && inter / uni >= 0.6) dups.push({ a: A.id, b: B.id, j: +(inter / uni).toFixed(2) });
    }
  }

  // ── repeated openings ──
  const open = new Map();
  for (const c of deck) {
    const k = toks.get(c.id).slice(0, 2).join(' ');
    if (k.length < 3) continue;
    open.set(k, (open.get(k) || []).concat(c.id));
  }
  const openings = [...open.entries()].filter(([, ids]) => ids.length >= 4)
    .map(([k, ids]) => ({ opening: k, count: ids.length, ids: ids.slice(0, 6) }))
    .sort((a, b) => b.count - a.count);

  // headline score, normalised per 1000 cards
  const famScore = families.reduce((s, f) => s + (f.maxInOneNode >= 3 ? 3 : 0) + Math.max(0, f.early - 4) + Math.max(0, f.total - 7) * 0.5, 0);
  const score = +(((famScore + dups.length * 2 + openings.length) / N) * 1000).toFixed(1);

  return { lang, cards: N, score,
    familyCount: families.length, nearDupPairs: dups.length, repeatedOpenings: openings.length,
    topFamilies: families.slice(0, 12), topDups: dups.slice(0, 12), topOpenings: openings.slice(0, 8) };
}

// ── run over every deck ─────────────────────────────────────────────
const out = [];
for (const dir of fs.readdirSync(path.join(ROOT, 'src/data'))) {
  const p = path.join(ROOT, 'src/data', dir, 'deck.json');
  if (!fs.existsSync(p)) continue;
  const deck = JSON.parse(fs.readFileSync(p, 'utf8'));
  if (!Array.isArray(deck) || !deck.length) continue;
  out.push(scanDeck(dir, deck));
}
out.sort((a, b) => b.score - a.score);

console.log('deck        cards  score  families  nearDups  openings');
for (const r of out)
  console.log(`${r.lang.padEnd(11)} ${String(r.cards).padStart(5)}  ${String(r.score).padStart(5)}  ${String(r.familyCount).padStart(8)}  ${String(r.nearDupPairs).padStart(8)}  ${String(r.repeatedOpenings).padStart(8)}`);

const jsonArg = process.argv.find(a => a.startsWith('--json='));
if (jsonArg) {
  const dest = path.join(ROOT, jsonArg.split('=')[1]);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, JSON.stringify(out, null, 1));
  console.log('\nwrote', dest);
}
