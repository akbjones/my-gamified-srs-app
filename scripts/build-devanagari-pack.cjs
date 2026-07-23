#!/usr/bin/env node
// Builds src/data/scripts/devanagari.json — the Hindi script teacher pack.
//
// Curriculum (levels, mnemonics, similar-sets) is authored + adversarially
// verified into scripts/tmp/devanagari-pack/{half-a,half-b}.json (workflow);
// this script assembles ids and derives everything deck-bound (Hangul/kana
// precedent): per-level cumulative readableWordCount, exampleWord snapshots,
// and the final 'word' level from the Hindi deck.
// Run: node scripts/build-devanagari-pack.cjs        (writes the pack)
//      node scripts/build-devanagari-pack.cjs --dry  (stats only)

const fs = require('fs');
const path = require('path');

const DECK = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/hindi/deck.json'), 'utf8'));
const HALF_A = JSON.parse(fs.readFileSync(path.join(__dirname, 'tmp/devanagari-pack/half-a.json'), 'utf8'));
const HALF_B = JSON.parse(fs.readFileSync(path.join(__dirname, 'tmp/devanagari-pack/half-b.json'), 'utf8'));

// ── Character classes ────────────────────────────────────────────────────────
const VOWELS = 'अआइईउऊऋएऐओऔ';
const CONS = 'कखगघङचछजझञटठडढणतथदधनपफबभमयरलवशषसह';
const NUKTA_UNITS = ['ज़', 'फ़', 'ड़', 'ढ़'].map(g => g.normalize('NFC')); // NFC DECOMPOSES these (base + ़) — always compare as 2-codepoint units
const NUKTA_SIGN = '़';
const MATRAS = 'ािीुूृेैोौ';
const SIGNS = 'ंँः';
const HALANT = '्';

// ── Romanization (Hunterian-ish, typed-answer ascii) ─────────────────────────
const V_ROM = { 'अ':'a','आ':'aa','इ':'i','ई':'ee','उ':'u','ऊ':'oo','ऋ':'ri','ए':'e','ऐ':'ai','ओ':'o','औ':'au' };
const M_ROM = { 'ा':'aa','ि':'i','ी':'ee','ु':'u','ू':'oo','ृ':'ri','े':'e','ै':'ai','ो':'o','ौ':'au' };
const C_ROM = {
  'क':'ka','ख':'kha','ग':'ga','घ':'gha','ङ':'nga','च':'cha','छ':'chha','ज':'ja','झ':'jha','ञ':'nya',
  'ट':'ta','ठ':'tha','ड':'da','ढ':'dha','ण':'na','त':'ta','थ':'tha','द':'da','ध':'dha','न':'na',
  'प':'pa','फ':'pha','ब':'ba','भ':'bha','म':'ma','य':'ya','र':'ra','ल':'la','व':'va',
  'श':'sha','ष':'sha','स':'sa','ह':'ha','ज़':'za','फ़':'fa','ड़':'ra','ढ़':'rha',
};
const S_ROM = { 'ं':'n','ँ':'n','ः':'h' };
for (const [k, v] of Object.entries(C_ROM)) { const n = k.normalize('NFC'); if (n !== k) { delete C_ROM[k]; C_ROM[n] = v; } }

/** Split an NFC string into units, merging consonant+nukta into one unit
 *  (ज + ़ → "ज़") so taught nukta letters compare as single glyphs. */
function unitsOf(str) {
  const cps = [...str.normalize('NFC')];
  const out = [];
  for (const cp of cps) {
    if (cp === NUKTA_SIGN && out.length) out[out.length - 1] += cp;
    else out.push(cp);
  }
  return out;
}

/** Naive-but-honest romanizer: only called on words that pass simpleEnough
 *  (every consonant followed by matra/halant or word-final → the internal
 *  schwa-deletion problem never arises). Word-final inherent a drops. */
function romanize(word) {
  const chars = unitsOf(word);
  let out = '';
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i], next = chars[i + 1];
    if (V_ROM[ch]) { out += V_ROM[ch]; continue; }
    if (S_ROM[ch]) { out += S_ROM[ch]; continue; }
    if (C_ROM[ch]) {
      const stem = C_ROM[ch].slice(0, -1);
      if (next && M_ROM[next]) { out += stem + M_ROM[next]; i++; continue; }
      if (next === HALANT) { out += stem; i++; continue; }
      // bare consonant: inherent a, dropped word-finally (schwa deletion)
      const isFinal = i === chars.length - 1 || (chars.slice(i + 1).every(c => S_ROM[c]));
      out += isFinal ? stem : C_ROM[ch];
      continue;
    }
    return null; // untaught char class
  }
  return out;
}
function simpleEnough(word) {
  const chars = unitsOf(word);
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    if (!C_ROM[ch]) continue;
    const next = chars[i + 1];
    const finalish = i === chars.length - 1 || chars.slice(i + 1).every(c => S_ROM[c]);
    if (!(next && (M_ROM[next] || next === HALANT)) && !finalish) return false; // internal inherent a — ambiguous schwa
  }
  return true;
}

// ── Assemble items with ids ──────────────────────────────────────────────────
const LEVELS = [
  ...HALF_A.levels.map(L => ({ ...L })),
  ...HALF_B.levels.map(L => ({ ...L })),
  { title: 'Real words from your deck', items: [] },
];
const items = [];
const glyphToId = new Map();
let seq = 0;
for (let li = 0; li < LEVELS.length; li++) {
  for (const it of LEVELS[li].items) {
    seq++;
    const id = `sc-hi-${String(seq).padStart(4, '0')}`;
    if (glyphToId.has(it.glyph)) throw new Error(`duplicate glyph ${it.glyph}`);
    glyphToId.set(it.glyph.normalize('NFC'), id);
    items.push({ id, level: li + 1, ...it });
  }
}
for (const it of items) {
  if (it.similar) it.similar = it.similar.map(g => glyphToId.get(g.normalize('NFC'))).filter(Boolean);
  if (it.components) {
    it.components = it.components.map(g => {
      const id = glyphToId.get(g.normalize('NFC'));
      if (!id) throw new Error(`component ${g} of ${it.glyph} is not a taught item`);
      return id;
    });
  }
  if (!it.similar?.length) delete it.similar;
}

// completeness: every vowel, consonant, nukta letter, matra, sign + halant taught
for (const g of VOWELS + CONS) if (!glyphToId.has(g)) throw new Error(`missing letter ${g}`);
for (const g of NUKTA_UNITS) if (!glyphToId.has(g)) throw new Error(`missing nukta ${g}`);
for (const g of MATRAS + SIGNS + HALANT) if (!glyphToId.has(g)) throw new Error(`missing modifier ${g}`);

// ── Deck-derived data ────────────────────────────────────────────────────────
const words = [];
const seen = new Set();
for (const card of DECK) {
  for (const tok of String(card.target).normalize('NFC').split(/[^ऀ-ॿ]+/)) {
    if (tok.length < 1 || seen.has(tok)) continue;
    seen.add(tok);
    words.push({ word: tok, cardId: String(card.id), english: card.english });
  }
}
const glyphLevels = new Map();
for (const it of items) if (it.kind === 'letter' || it.kind === 'modifier') glyphLevels.set(it.glyph.normalize('NFC'), it.level);
const knownAt = lvl => new Set([...glyphLevels.entries()].filter(([, l2]) => l2 <= lvl).map(([g]) => g));
const readableWith = (word, known) => unitsOf(word).every(ch => known.has(ch));

const levelCounts = [];
for (let lvl = 1; lvl <= LEVELS.length; lvl++) {
  const known = knownAt(lvl);
  levelCounts.push(words.filter(w => readableWith(w.word, known)).length);
}

for (const it of items) {
  if (it.kind !== 'letter') continue;
  const known = knownAt(it.level);
  const contains = w => unitsOf(w.word).includes(it.glyph.normalize('NFC'));
  const pick = words.find(w => contains(w) && readableWith(w.word, known)) || words.find(contains);
  if (pick) it.exampleWord = { target: pick.word, english: pick.english, deckCardId: pick.cardId };
}

// final word level: simple fully-readable deck words with honest romanization
const allKnown = knownAt(LEVELS.length);
const usedRoman = new Set(items.map(i => i.romanization));
const wordItems = [];
for (const w of words) {
  if (wordItems.length >= 8) break;
  const len = [...w.word].length;
  if (len < 2 || len > 5) continue;
  if (!readableWith(w.word, allKnown) || !simpleEnough(w.word)) continue;
  const rr = romanize(w.word);
  if (!rr || usedRoman.has(rr)) continue;
  usedRoman.add(rr);
  seq++;
  wordItems.push({
    id: `sc-hi-${String(seq).padStart(4, '0')}`, kind: 'word', glyph: w.word, sound: rr, romanization: rr,
    mnemonic: '', level: LEVELS.length,
    exampleWord: { target: w.word, english: w.english, deckCardId: w.cardId },
  });
}
items.push(...wordItems);

// ── Emit ─────────────────────────────────────────────────────────────────────
const pack = {
  scriptId: 'devanagari',
  language: 'hindi',
  name: 'Devanagari',
  tagline: 'Read Hindi in about a week',
  // AUDIO-led discrimination (locked decision 2): retroflex/dental and
  // aspiration contrasts are ear lessons — a romanization prompt cannot
  // express what ट vs त is asking. Both rows share ascii "ta" on purpose.
  drill: { recallPrompts: ['audio', 'romanization'], discriminationPrompt: 'audio' },
  items: items.map(it => ({
    id: it.id, kind: it.kind, glyph: it.glyph, sound: it.sound, romanization: it.romanization,
    mnemonic: it.mnemonic ?? '', level: it.level,
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

const ids = new Set(pack.items.map(i => i.id));
if (ids.size !== pack.items.length) throw new Error('duplicate ids');
for (const it of pack.items) {
  for (const ref of [...(it.similar || []), ...(it.components || [])]) if (!ids.has(ref)) throw new Error(`dangling ref ${ref} in ${it.id}`);
  if ((it.kind === 'letter' || it.kind === 'modifier') && !it.mnemonic) throw new Error(`missing mnemonic: ${it.id} ${it.glyph}`);
  if (it.mnemonic.length > 200) throw new Error(`mnemonic too long: ${it.id} (${it.mnemonic.length})`);
  if (it.mnemonic.includes('—')) throw new Error(`em dash in mnemonic: ${it.id}`);
}

console.log(`items: ${pack.items.length} (letters ${pack.items.filter(i=>i.kind==='letter').length}, modifiers ${pack.items.filter(i=>i.kind==='modifier').length}, composed ${pack.items.filter(i=>i.kind==='composed').length}, words ${pack.items.filter(i=>i.kind==='word').length}), levels ${pack.levels.length}`);
console.log('readable words per level:', levelCounts.join(' → '));
console.log('word items:', wordItems.map(w => `${w.glyph} (${w.romanization} – ${w.exampleWord.english.slice(0, 25)})`).join(', '));
if (process.argv.includes('--dry')) process.exit(0);
fs.writeFileSync(path.join(__dirname, '../src/data/scripts/devanagari.json'), JSON.stringify(pack, null, 2) + '\n');
console.log('wrote src/data/scripts/devanagari.json');
