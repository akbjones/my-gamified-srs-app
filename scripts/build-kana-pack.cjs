#!/usr/bin/env node
// Builds src/data/scripts/kana.json — the Japanese kana teacher pack.
//
// Curriculum (levels, mnemonics, similar-sets) is authored + adversarially
// verified into scripts/tmp/kana-pack/{hiragana,katakana}.json (workflow);
// this script assembles ids and derives everything that must come from the
// Japanese deck at authoring time (Hangul precedent, build-hangul-pack.cjs):
//   - per-level cumulative readableWordCount (via kana decomposition of the
//     deck's kana forms: kana tokens verbatim, kanji tokens via their r)
//   - an exampleWord snapshot per letter
//   - the level-final 'word' items (real, fully-readable deck words)
// Run: node scripts/build-kana-pack.cjs        (writes the pack)
//      node scripts/build-kana-pack.cjs --dry  (stats only)

const fs = require('fs');
const path = require('path');

const DECK = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/japanese/deck.json'), 'utf8'));
const HIRA = JSON.parse(fs.readFileSync(path.join(__dirname, 'tmp/kana-pack/hiragana.json'), 'utf8'));
const KATA = JSON.parse(fs.readFileSync(path.join(__dirname, 'tmp/kana-pack/katakana.json'), 'utf8'));

// ── Kana decomposition ───────────────────────────────────────────────────────
// Voiced/handakuten kana decompose to base + mark; small kana map across
// scripts to the taught hiragana modifiers (the rule transfers).
const VOICED = {
  'が':['か','゛'],'ぎ':['き','゛'],'ぐ':['く','゛'],'げ':['け','゛'],'ご':['こ','゛'],
  'ざ':['さ','゛'],'じ':['し','゛'],'ず':['す','゛'],'ぜ':['せ','゛'],'ぞ':['そ','゛'],
  'だ':['た','゛'],'ぢ':['ち','゛'],'づ':['つ','゛'],'で':['て','゛'],'ど':['と','゛'],
  'ば':['は','゛'],'び':['ひ','゛'],'ぶ':['ふ','゛'],'べ':['へ','゛'],'ぼ':['ほ','゛'],
  'ぱ':['は','゜'],'ぴ':['ひ','゜'],'ぷ':['ふ','゜'],'ぺ':['へ','゜'],'ぽ':['ほ','゜'],
  'ガ':['カ','゛'],'ギ':['キ','゛'],'グ':['ク','゛'],'ゲ':['ケ','゛'],'ゴ':['コ','゛'],
  'ザ':['サ','゛'],'ジ':['シ','゛'],'ズ':['ス','゛'],'ゼ':['セ','゛'],'ゾ':['ソ','゛'],
  'ダ':['タ','゛'],'ヂ':['チ','゛'],'ヅ':['ツ','゛'],'デ':['テ','゛'],'ド':['ト','゛'],
  'バ':['ハ','゛'],'ビ':['ヒ','゛'],'ブ':['フ','゛'],'ベ':['ヘ','゛'],'ボ':['ホ','゛'],
  'パ':['ハ','゜'],'ピ':['ヒ','゜'],'プ':['フ','゜'],'ペ':['ヘ','゜'],'ポ':['ホ','゜'],
  'ヴ':['ウ','゛'],
};
const SMALL = { 'ゃ':'ゃ','ゅ':'ゅ','ょ':'ょ','っ':'っ','ャ':'ゃ','ュ':'ゅ','ョ':'ょ','ッ':'っ','ー':'ー' };

function partsOf(ch) {
  if (VOICED[ch]) return VOICED[ch];
  if (SMALL[ch]) return [SMALL[ch]];
  return [ch];
}
const HIRA_RE = /^[ぁ-ゖー]+$/;
const KATA_RE = /^[ァ-ヺー]+$/;

// ── Hepburn romanizer for word items ─────────────────────────────────────────
const HEP = {
  'あ':'a','い':'i','う':'u','え':'e','お':'o','か':'ka','き':'ki','く':'ku','け':'ke','こ':'ko',
  'さ':'sa','し':'shi','す':'su','せ':'se','そ':'so','た':'ta','ち':'chi','つ':'tsu','て':'te','と':'to',
  'な':'na','に':'ni','ぬ':'nu','ね':'ne','の':'no','は':'ha','ひ':'hi','ふ':'fu','へ':'he','ほ':'ho',
  'ま':'ma','み':'mi','む':'mu','め':'me','も':'mo','や':'ya','ゆ':'yu','よ':'yo',
  'ら':'ra','り':'ri','る':'ru','れ':'re','ろ':'ro','わ':'wa','を':'o','ん':'n',
  'が':'ga','ぎ':'gi','ぐ':'gu','げ':'ge','ご':'go','ざ':'za','じ':'ji','ず':'zu','ぜ':'ze','ぞ':'zo',
  'だ':'da','ぢ':'ji','づ':'zu','で':'de','ど':'do','ば':'ba','び':'bi','ぶ':'bu','べ':'be','ぼ':'bo',
  'ぱ':'pa','ぴ':'pi','ぷ':'pu','ぺ':'pe','ぽ':'po',
};
// katakana → hiragana codepoint shift for romanization (ー handled inline)
const kataToHira = s => [...s].map(c => (c >= 'ァ' && c <= 'ヶ' ? String.fromCharCode(c.charCodeAt(0) - 0x60) : c)).join('');
const YOON = { 'ゃ':'ya','ゅ':'yu','ょ':'yo' };
// Lexical exceptions: the greeting-final は is the particle, read wa.
const ROMANIZE_EXCEPTIONS = { 'こんにちは': 'konnichiwa', 'こんばんは': 'konbanwa' };
function romanize(kana) {
  if (ROMANIZE_EXCEPTIONS[kana]) return ROMANIZE_EXCEPTIONS[kana];
  const s = kataToHira(kana);
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const ch = s[i], next = s[i + 1];
    if (ch === 'っ') { // gemination: double the next consonant
      const nx = next && HEP[next];
      out += nx ? nx[0] : '';
      continue;
    }
    if (ch === 'ー') { out += out.match(/[aiueo]$/) ? out.slice(-1) : ''; continue; }
    if (next && YOON[next] && HEP[ch] && HEP[ch].endsWith('i')) {
      const stem = HEP[ch].slice(0, -1); // き→k, し→sh, ち→ch, じ→j
      const y = YOON[next];
      out += (stem === 'sh' || stem === 'ch' || stem === 'j') ? stem + y[1] : stem + y;
      i++;
      continue;
    }
    out += HEP[ch] ?? '';
  }
  return out;
}

// ── Assemble items with ids ──────────────────────────────────────────────────
const LEVELS = [
  ...HIRA.levels.map(L => ({ ...L })),
  ...KATA.levels.map(L => ({ ...L })),
];
const items = [];
const glyphToId = new Map();
let seq = 0;
for (let li = 0; li < LEVELS.length; li++) {
  for (const it of LEVELS[li].items) {
    seq++;
    const id = `sc-ja-${String(seq).padStart(4, '0')}`;
    if (glyphToId.has(it.glyph)) throw new Error(`duplicate glyph ${it.glyph}`);
    glyphToId.set(it.glyph, id);
    items.push({ id, level: li + 1, ...it });
  }
}
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

// completeness: all 46 base kana per script must be taught as letters
const GOJUON_H = 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん';
const GOJUON_K = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
for (const g of GOJUON_H) if (!glyphToId.has(g)) throw new Error(`missing hiragana ${g}`);
for (const g of GOJUON_K) if (!glyphToId.has(g)) throw new Error(`missing katakana ${g}`);

// ── Deck-derived data ────────────────────────────────────────────────────────
// Kana form of every deck token: kana tokens verbatim, kanji tokens via r.
const PUNCT = /^[\s。、！？「」『』（）()!?.,;:…・〜–-]+$/;
const words = [];
const seen = new Set();
for (const card of DECK) {
  for (const tok of card.tokens ?? []) {
    if (PUNCT.test(tok.t)) continue;
    const kana = tok.r ?? tok.t;
    if (!kana || seen.has(kana)) continue;
    if (!HIRA_RE.test(kana) && !KATA_RE.test(kana)) continue; // mixed/latin — skip
    seen.add(kana);
    words.push({ word: kana, display: tok.t, cardId: card.id, english: card.english });
  }
}

const glyphLevels = new Map(); // glyph -> level introduced (letters AND modifiers count as taught)
for (const it of items) if (it.kind === 'letter' || it.kind === 'modifier') glyphLevels.set(it.glyph, it.level);
const knownAt = lvl => new Set([...glyphLevels.entries()].filter(([, l2]) => l2 <= lvl).map(([g]) => g));
const readableWith = (word, known) => [...word].every(ch => partsOf(ch).every(p => known.has(p)));

const levelCounts = [];
for (let lvl = 1; lvl <= LEVELS.length; lvl++) {
  const known = knownAt(lvl);
  levelCounts.push(words.filter(w => readableWith(w.word, known)).length);
}

// exampleWord per letter: earliest deck word containing the glyph (or a
// voiced/small form built on it), preferring fully readable at that level.
for (const it of items) {
  if (it.kind !== 'letter') continue;
  const known = knownAt(it.level);
  const contains = w => [...w.word].some(ch => partsOf(ch).includes(it.glyph) || ch === it.glyph);
  const pick = words.find(w => contains(w) && readableWith(w.word, known)) || words.find(contains);
  if (pick) it.exampleWord = { target: pick.display, english: pick.english, deckCardId: pick.cardId };
}

// word items: fill the two empty deck-word levels (hiragana final, katakana final)
const usedRoman = new Set(items.map(i => i.romanization));
function fillWordLevel(levelIdx, re, count) {
  const lvl = levelIdx + 1;
  const known = knownAt(lvl);
  const out = [];
  for (const w of words) {
    if (out.length >= count) break;
    if (w.word.length < 2 || w.word.length > 5) continue;
    if (!re.test(w.word)) continue;
    if (!readableWith(w.word, known)) continue;
    const rr = romanize(w.word);
    if (!rr || usedRoman.has(rr)) continue;
    usedRoman.add(rr);
    seq++;
    out.push({
      id: `sc-ja-${String(seq).padStart(4, '0')}`, kind: 'word', glyph: w.word, sound: rr, romanization: rr,
      mnemonic: '', level: lvl,
      exampleWord: { target: w.display, english: w.english, deckCardId: w.cardId },
    });
  }
  items.push(...out);
  return out;
}
const hiraWordLevel = HIRA.levels.length - 1;           // last hiragana level (0-based)
const kataWordLevel = LEVELS.length - 1;                 // last level overall (0-based)
const hw = fillWordLevel(hiraWordLevel, HIRA_RE, 6);
const kw = fillWordLevel(kataWordLevel, KATA_RE, 5);

// ── Emit ─────────────────────────────────────────────────────────────────────
const pack = {
  scriptId: 'kana',
  language: 'japanese',
  name: 'Kana',
  tagline: 'Learn to read Japanese kana',
  // Kana confusables (シ/ツ, ソ/ン) are a VISUAL contrast — same reasoning as
  // Hangul's tense consonants: discrimination prompts by romanization.
  drill: { recallPrompts: ['audio', 'romanization'], discriminationPrompt: 'romanization' },
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

// sanity (Hangul precedent + kana-specific)
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
console.log('hira words:', hw.map(w => `${w.glyph} (${w.romanization})`).join(', '));
console.log('kata words:', kw.map(w => `${w.glyph} (${w.romanization})`).join(', '));
if (process.argv.includes('--dry')) process.exit(0);
fs.writeFileSync(path.join(__dirname, '../src/data/scripts/kana.json'), JSON.stringify(pack, null, 2) + '\n');
console.log('wrote src/data/scripts/kana.json');
