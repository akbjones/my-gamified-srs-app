#!/usr/bin/env node
// Builds src/data/scripts/hangul.json — the full Hangul teacher pack.
//
// The curriculum (levels, similar-sets, components, mnemonics) is authored
// INLINE below; this script derives everything that must come from the Korean
// deck at authoring time (correction #7 in docs/script-teacher-scoping.md):
//   - per-level cumulative readableWordCount (via jamo decomposition)
//   - an exampleWord snapshot per letter (a deck word containing that jamo)
//   - the L-final 'word' items (simple, fully-readable deck words)
// Run: node scripts/build-hangul-pack.cjs        (writes the pack)
//      node scripts/build-hangul-pack.cjs --dry  (stats only)

const fs = require('fs');
const path = require('path');

const DECK = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/korean/deck.json'), 'utf8'));

// ── Hangul decomposition (U+AC00 block arithmetic) ───────────────────────────
const CHO = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
const JUNG = ['ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅘ','ㅙ','ㅚ','ㅛ','ㅜ','ㅝ','ㅞ','ㅟ','ㅠ','ㅡ','ㅢ','ㅣ'];
const JONG = ['','ㄱ','ㄲ','ㄳ','ㄴ','ㄵ','ㄶ','ㄷ','ㄹ','ㄺ','ㄻ','ㄼ','ㄽ','ㄾ','ㄿ','ㅀ','ㅁ','ㅂ','ㅄ','ㅅ','ㅆ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
// Cluster/compound jamo → taught parts (for readability: knowing the parts is enough to sound it out)
const PARTS = {
  'ㄳ':['ㄱ','ㅅ'],'ㄵ':['ㄴ','ㅈ'],'ㄶ':['ㄴ','ㅎ'],'ㄺ':['ㄹ','ㄱ'],'ㄻ':['ㄹ','ㅁ'],'ㄼ':['ㄹ','ㅂ'],
  'ㄽ':['ㄹ','ㅅ'],'ㄾ':['ㄹ','ㅌ'],'ㄿ':['ㄹ','ㅍ'],'ㅀ':['ㄹ','ㅎ'],'ㅄ':['ㅂ','ㅅ'],
  'ㅙ':['ㅗ','ㅐ'],'ㅞ':['ㅜ','ㅔ'],
};
const RR = { // naive Revised-Romanization per jamo (initial / vowel; finals handled below)
  'ㄱ':'g','ㄲ':'kk','ㄴ':'n','ㄷ':'d','ㄸ':'tt','ㄹ':'r','ㅁ':'m','ㅂ':'b','ㅃ':'pp','ㅅ':'s','ㅆ':'ss',
  'ㅇ':'','ㅈ':'j','ㅉ':'jj','ㅊ':'ch','ㅋ':'k','ㅌ':'t','ㅍ':'p','ㅎ':'h',
  'ㅏ':'a','ㅐ':'ae','ㅑ':'ya','ㅒ':'yae','ㅓ':'eo','ㅔ':'e','ㅕ':'yeo','ㅖ':'ye','ㅗ':'o','ㅘ':'wa','ㅙ':'wae',
  'ㅚ':'oe','ㅛ':'yo','ㅜ':'u','ㅝ':'wo','ㅞ':'we','ㅟ':'wi','ㅠ':'yu','ㅡ':'eu','ㅢ':'ui','ㅣ':'i',
};
const RR_FINAL = { 'ㄱ':'k','ㄲ':'k','ㄴ':'n','ㄷ':'t','ㄹ':'l','ㅁ':'m','ㅂ':'p','ㅅ':'t','ㅆ':'t','ㅇ':'ng','ㅈ':'t','ㅊ':'t','ㅋ':'k','ㅌ':'t','ㅍ':'p','ㅎ':'t' };

function decomposeSyllable(ch) {
  const code = ch.codePointAt(0) - 0xAC00;
  if (code < 0 || code > 11171) return null;
  const cho = CHO[Math.floor(code / 588)];
  const jung = JUNG[Math.floor((code % 588) / 28)];
  const jong = JONG[code % 28];
  return { cho, jung, jong };
}
function jamoOf(word) {
  const out = [];
  for (const ch of word) {
    const d = decomposeSyllable(ch);
    if (!d) continue;
    for (const j of [d.cho, d.jung, d.jong]) {
      if (!j) continue;
      if (PARTS[j]) out.push(...PARTS[j]); else out.push(j);
    }
  }
  return out;
}
const hangulOnly = s => [...s].filter(c => decomposeSyllable(c)).join('');

// ── Curriculum ───────────────────────────────────────────────────────────────
// L(level, title, items). Letters carry mnemonics (verified separately);
// composed items are drills, no mnemonic. similar = confusable ids (filled by
// glyph below for readability). Sounds follow the "display / answer-key" split.
const l = (glyph, sound, romanization, mnemonic, similar = []) => ({ kind: 'letter', glyph, sound, romanization, mnemonic, similar });
const c = (glyph, romanization, components) => ({ kind: 'composed', glyph, sound: romanization, romanization, mnemonic: '', components });

const LEVELS = [
  { title: 'First consonants and vowels', items: [
    l('ㄱ', 'g/k', 'g', "The tongue's back rising to block the throat – g (as in go). At the end of a syllable it tightens to k.", ['ㅋ','ㄲ']),
    l('ㄴ', 'n', 'n', "The tongue's tip touching the ridge behind the teeth – n. The corner opens the opposite way to ㄱ (g).", ['ㄷ','ㄹ']),
    l('ㄷ', 'd/t', 'd', "ㄴ (n) with a lid on top – the tongue taps the same ridge, just harder: d (t at the end of a syllable).", ['ㄴ','ㅌ','ㄸ']),
    l('ㄹ', 'r/l', 'r', "A winding path – the tongue flicks along it: Korean r/l, one sound between the two.", ['ㄴ','ㄷ']),
    l('ㅁ', 'm', 'm', 'A closed mouth, lips sealed in a square – m.', ['ㅂ','ㅇ']),
    l('ㅏ', 'a', 'a', 'A standing line with its stroke pointing right, toward the sunrise – bright a (father).', ['ㅓ']),
    l('ㅓ', 'eo', 'eo', 'The stroke points left, away from the sun – darker eo (the u in fun).', ['ㅏ']),
    l('ㅗ', 'o', 'o', 'A flat ground with a stroke pointing up at the sky – o (go).', ['ㅜ']),
    l('ㅜ', 'u', 'u', 'The stroke hangs below the ground line, like a root going down – u (moon).', ['ㅗ']),
    l('ㅡ', 'eu', 'eu', 'A flat horizon – say it with flat, spread lips: eu (a grunted uh).', []),
    l('ㅣ', 'i', 'i', 'A person standing tall – ee (see).', []),
  ]},
  { title: 'Your first syllable blocks', items: [
    c('가', 'ga', ['ㄱ','ㅏ']), c('너', 'neo', ['ㄴ','ㅓ']), c('도', 'do', ['ㄷ','ㅗ']),
    c('리', 'ri', ['ㄹ','ㅣ']), c('무', 'mu', ['ㅁ','ㅜ']), c('나', 'na', ['ㄴ','ㅏ']),
    c('고', 'go', ['ㄱ','ㅗ']), c('미', 'mi', ['ㅁ','ㅣ']),
  ]},
  { title: 'The rest of the basics', items: [
    l('ㅂ', 'b/p', 'b', 'A pot with two handles sticking up – lips press together for b (p at the end of a syllable).', ['ㅁ','ㅍ','ㅃ']),
    l('ㅅ', 's', 's', 'A little tent – air hisses out through the gap at the bottom, between the two legs: s.', ['ㅈ','ㅆ']),
    l('ㅇ', 'silent / ng', 'ng', 'A circle: an empty placeholder at the START of a block, the sound ng (sing) at the END.', ['ㅁ']),
    l('ㅈ', 'j', 'j', 'The ㅅ tent with a roof beam across the top – the hiss hardens into j.', ['ㅅ','ㅊ','ㅉ']),
    l('ㅎ', 'h', 'h', 'A hat on a round head (the ㅇ circle) – breathe out: h is just a puff of air.', ['ㅇ']),
  ]},
  { title: 'Y-vowels and new blocks', items: [
    l('ㅑ', 'ya', 'ya', 'ㅏ (a) with a second tick – the extra tick adds a y: ya.', ['ㅕ','ㅏ']),
    l('ㅕ', 'yeo', 'yeo', 'ㅓ (eo) with a second tick – add a y: yeo.', ['ㅑ','ㅓ']),
    l('ㅛ', 'yo', 'yo', 'ㅗ (o) with a second stroke up – add a y: yo.', ['ㅠ','ㅗ']),
    l('ㅠ', 'yu', 'yu', 'ㅜ (u) with a second stroke down – add a y: yu.', ['ㅛ','ㅜ']),
    c('바', 'ba', ['ㅂ','ㅏ']), c('서', 'seo', ['ㅅ','ㅓ']), c('지', 'ji', ['ㅈ','ㅣ']), c('호', 'ho', ['ㅎ','ㅗ']),
  ]},
  { title: 'The breathy four', items: [
    l('ㅋ', 'k', 'k', 'ㄱ (g) with one extra stroke – the extra stroke is a puff of breath: k.', ['ㄱ','ㄲ']),
    l('ㅌ', 't', 't', 'ㄷ (d) with one extra stroke – add breath: t.', ['ㄷ','ㄸ']),
    l('ㅍ', 'p', 'p', 'ㅂ (b) tipped on its side – two bars top and bottom, two legs between. Same lips as ㅂ, plus a puff of breath: p.', ['ㅂ','ㅃ']),
    l('ㅊ', 'ch', 'ch', 'ㅈ (j) with one extra stroke on top – add breath: ch.', ['ㅈ','ㅉ']),
    c('카', 'ka', ['ㅋ','ㅏ']), c('처', 'cheo', ['ㅊ','ㅓ']),
  ]},
  { title: 'The tense twins', items: [
    l('ㄲ', 'kk', 'kk', 'Two ㄱ side by side – squeeze the g tight, no breath: kk (a stiff, clipped g).', ['ㄱ','ㅋ']),
    l('ㄸ', 'tt', 'tt', 'Two ㄷ – squeeze the d tight: tt.', ['ㄷ','ㅌ']),
    l('ㅃ', 'pp', 'pp', 'Two ㅂ – press the lips tight: pp.', ['ㅂ','ㅍ']),
    l('ㅆ', 'ss', 'ss', 'Two ㅅ tents – a sharper, tenser hiss: ss.', ['ㅅ']),
    l('ㅉ', 'jj', 'jj', 'Two ㅈ – squeeze the j tight: jj.', ['ㅈ','ㅊ']),
    c('까', 'kka', ['ㄲ','ㅏ']), c('싸', 'ssa', ['ㅆ','ㅏ']),
  ]},
  { title: 'Bright pairs', items: [
    l('ㅐ', 'ae', 'ae', 'ㅏ with an ㅣ leaning on it – a brightened a: ae (the e in bed, mouth a bit wider).', ['ㅔ']),
    l('ㅔ', 'e', 'e', 'ㅓ with an ㅣ against it – e (the e in bed). Today ㅐ and ㅔ sound nearly the same – spelling tells them apart.', ['ㅐ']),
    l('ㅒ', 'yae', 'yae', 'ㅑ + ㅣ – ya brightened to yae. Rare; mostly in 얘 (this kid).', ['ㅖ']),
    l('ㅖ', 'ye', 'ye', 'ㅕ + ㅣ – ye. You\'ll see it in 예 (ye = yes, formal) and 시계 (sigye = clock).', ['ㅒ']),
  ]},
  { title: 'Gliding vowels', items: [
    l('ㅘ', 'wa', 'wa', 'ㅗ (o) sliding into ㅏ (a) – say them fast together: wa.', ['ㅝ']),
    l('ㅝ', 'wo', 'wo', 'ㅜ (u) sliding into ㅓ (eo) – wo (as in won).', ['ㅘ']),
    l('ㅚ', 'oe', 'oe', 'ㅗ + ㅣ – said weh in modern Korean, like the we- in wet.', ['ㅟ']),
    l('ㅟ', 'wi', 'wi', 'ㅜ + ㅣ – wi (as in we).', ['ㅚ']),
    l('ㅢ', 'ui', 'ui', 'ㅡ + ㅣ – a quick eu-i glide: ui. In 의 (ui = of).', []),
  ]},
  { title: 'Blocks with a floor', items: [
    c('한', 'han', ['ㅎ','ㅏ','ㄴ']), c('밥', 'bap', ['ㅂ','ㅏ','ㅂ']), c('물', 'mul', ['ㅁ','ㅜ','ㄹ']),
    c('곰', 'gom', ['ㄱ','ㅗ','ㅁ']), c('강', 'gang', ['ㄱ','ㅏ','ㅇ']), c('집', 'jip', ['ㅈ','ㅣ','ㅂ']),
  ]},
  { title: 'Real words from your deck', items: [] }, // filled from the deck below
];

// ── Assemble items with ids ──────────────────────────────────────────────────
const items = [];
const glyphToId = new Map();
let seq = 0;
for (let li = 0; li < LEVELS.length; li++) {
  for (const it of LEVELS[li].items) {
    seq++;
    const id = `sc-ko-${String(seq).padStart(4, '0')}`;
    glyphToId.set(it.glyph, id);
    items.push({ id, level: li + 1, ...it });
  }
}
// resolve similar/components from glyphs to ids (authored by glyph above)
for (const it of items) {
  if (it.similar) it.similar = it.similar.map(g => glyphToId.get(g)).filter(Boolean);
  if (it.components) {
    it.components = it.components.map(g => {
      const id = glyphToId.get(g);
      if (!id) throw new Error(`component ${g} of ${it.glyph} is not a taught item`);
      return id;
    });
  }
  if (!it.similar?.length) delete it.similar;
}

// ── Deck-derived data ────────────────────────────────────────────────────────
// Letters taught cumulatively per level (composed/word items add no new jamo).
const letterLevels = new Map(); // jamo glyph -> level introduced
for (const it of items) if (it.kind === 'letter') letterLevels.set(it.glyph, it.level);
const knownAt = lvl => new Set([...letterLevels.entries()].filter(([, l2]) => l2 <= lvl).map(([g]) => g));

// Unique deck words (Hangul tokens), keeping first-card order (≈ difficulty order).
const words = [];
const seen = new Set();
for (const card of DECK) {
  for (const tok of card.target.split(/[^가-힣]+/)) {
    if (tok.length < 1 || seen.has(tok)) continue;
    seen.add(tok);
    words.push({ word: tok, cardId: card.id, english: card.english });
  }
}
const readableWith = (word, known) => jamoOf(word).every(j => known.has(j));

// Per-level cumulative readable counts
const levelCounts = [];
for (let lvl = 1; lvl <= LEVELS.length; lvl++) {
  const known = knownAt(lvl);
  levelCounts.push(words.filter(w => readableWith(w.word, known)).length);
}

// exampleWord per letter: earliest deck word containing the jamo, preferring
// words fully readable at that letter's level.
for (const it of items) {
  if (it.kind !== 'letter') continue;
  const known = knownAt(it.level);
  const contains = w => jamoOf(w.word).includes(it.glyph);
  const pick = words.find(w => contains(w) && readableWith(w.word, known)) || words.find(contains);
  if (pick) it.exampleWord = { target: pick.word, english: pick.english, deckCardId: pick.cardId };
}

// L-final word items: simple fully-readable deck words. Naive per-jamo
// romanization is only honest when no sound-change rules apply, so restrict
// mid-word finals to stable nasals (ㄴㅁㅇ) not followed by ㅇ/ㄹ (liaison/assimilation).
function naiveRR(word) {
  const sylls = [...word].map(decomposeSyllable);
  let out = '';
  for (let i = 0; i < sylls.length; i++) {
    const s = sylls[i];
    out += RR[s.cho] + RR[s.jung];
    if (s.jong) out += RR_FINAL[s.jong]; // finals always use coda values (ㅇ = ng, mid-word too)
  }
  return out;
}
function simpleEnough(word) {
  const sylls = [...word].map(decomposeSyllable);
  for (let i = 0; i < sylls.length; i++) {
    const s = sylls[i];
    if (!s.jong) continue;
    if (i < sylls.length - 1) {
      if (!['ㄴ','ㅁ','ㅇ'].includes(s.jong)) return false;
      if (['ㅇ','ㄹ'].includes(sylls[i + 1].cho)) return false;
    } else if (PARTS[s.jong]) return false; // cluster finals sound as one part – skip
  }
  return true;
}
const allKnown = knownAt(LEVELS.length);
const wordItems = [];
const usedRoman = new Set(items.map(i => i.romanization));
for (const w of words) {
  if (wordItems.length >= 6) break;
  if (w.word.length < 2 || w.word.length > 3) continue;
  if (!readableWith(w.word, allKnown) || !simpleEnough(w.word)) continue;
  const rr = naiveRR(w.word);
  if (usedRoman.has(rr)) continue;
  usedRoman.add(rr);
  seq++;
  wordItems.push({
    id: `sc-ko-${String(seq).padStart(4, '0')}`, kind: 'word', glyph: w.word, sound: rr, romanization: rr,
    mnemonic: '', level: LEVELS.length,
    exampleWord: { target: w.word, english: w.english, deckCardId: w.cardId },
  });
}
items.push(...wordItems);

// ── Emit ─────────────────────────────────────────────────────────────────────
const pack = {
  scriptId: 'hangul',
  language: 'korean',
  name: 'Hangul',
  tagline: 'Read Korean in about 3 days',
  drill: { recallPrompts: ['audio', 'romanization'], discriminationPrompt: 'audio' },
  items: items.map(it => ({
    id: it.id, kind: it.kind, glyph: it.glyph, sound: it.sound, romanization: it.romanization,
    mnemonic: it.mnemonic, level: it.level,
    ...(it.similar?.length ? { similar: it.similar } : {}),
    ...(it.components ? { components: it.components } : {}),
    ...(it.exampleWord ? { exampleWord: it.exampleWord } : {}),
    audio: `${it.id}.mp3`,
  })),
  levels: LEVELS.map((L, i) => ({
    level: i + 1, title: L.title,
    itemIds: items.filter(it => it.level === i + 1).map(it => it.id),
    readableWordCount: levelCounts[i],
  })),
};

// sanity: unique glyphs+ids, components/similar resolve, mnemonic limits
const ids = new Set(pack.items.map(i => i.id));
if (ids.size !== pack.items.length) throw new Error('duplicate ids');
for (const it of pack.items) {
  for (const ref of [...(it.similar || []), ...(it.components || [])]) if (!ids.has(ref)) throw new Error(`dangling ref ${ref} in ${it.id}`);
  if (it.mnemonic.length > 200) throw new Error(`mnemonic too long: ${it.id} (${it.mnemonic.length})`);
  if (it.mnemonic.includes('—')) throw new Error(`em dash in mnemonic: ${it.id}`);
}

console.log(`items: ${pack.items.length} (letters ${pack.items.filter(i=>i.kind==='letter').length}, composed ${pack.items.filter(i=>i.kind==='composed').length}, words ${pack.items.filter(i=>i.kind==='word').length})`);
console.log('readable words per level:', levelCounts.join(' → '));
console.log('word items:', wordItems.map(w => `${w.glyph} (${w.romanization} – ${w.exampleWord.english.slice(0, 30)})`).join(', '));
if (process.argv.includes('--dry')) process.exit(0);
fs.writeFileSync(path.join(__dirname, '../src/data/scripts/hangul.json'), JSON.stringify(pack, null, 2) + '\n');
console.log('wrote src/data/scripts/hangul.json');
