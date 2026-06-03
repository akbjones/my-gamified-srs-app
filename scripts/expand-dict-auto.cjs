#!/usr/bin/env node
/**
 * expand-dict-auto.cjs
 *
 * Automatically expands a language dictionary by analyzing deck.json cards.
 * For each missing word, it tries to infer the translation from the card's
 * english field and assigns approximate IPA + POS.
 *
 * Usage: node scripts/expand-dict-auto.cjs --lang=de [--write] [--limit=500]
 */
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const lang = (args.find(a => a.startsWith('--lang=')) || '').split('=')[1];
const doWrite = args.includes('--write');
const limit = parseInt((args.find(a => a.startsWith('--limit=')) || '').split('=')[1]) || 99999;

if (!lang) {
  console.error('Usage: node scripts/expand-dict-auto.cjs --lang=CODE [--write] [--limit=N]');
  process.exit(1);
}

const LANG_MAP = {
  es: 'spanish', it: 'italian', fr: 'french', pt: 'portuguese',
  de: 'german', nl: 'dutch', sv: 'swedish', cy: 'welsh',
  hi: 'hindi', tr: 'turkish', ru: 'russian',
};
const langDir = LANG_MAP[lang];
if (!langDir) { console.error('Unknown lang: ' + lang); process.exit(1); }

const BASE = path.join(__dirname, '..', 'src', 'data');
const deckPath = path.join(BASE, langDir, 'deck.json');
const dictPath = path.join(BASE, 'dictionary', `${lang}.ts`);

// Load deck
const deck = JSON.parse(fs.readFileSync(deckPath, 'utf8'));
console.log(`Loaded ${deck.length} cards from ${langDir} deck`);

// Extract all words from deck with their card context
const wordContexts = new Map(); // word → [{target, english}]
for (const card of deck) {
  const sentence = card.target || '';
  const words = sentence.split(/\s+/).filter(Boolean);
  for (const w of words) {
    const clean = w.replace(/[.,!?;:""''()––\-…¿¡«»\[\]{}]/g, '').trim().toLowerCase();
    if (clean && clean.length > 0) {
      if (!wordContexts.has(clean)) wordContexts.set(clean, []);
      wordContexts.get(clean).push({
        target: sentence,
        english: card.english || '',
        targetWords: words.map(w2 => w2.replace(/[.,!?;:""''()––\-…¿¡«»\[\]{}]/g, '').trim().toLowerCase()),
        englishWords: (card.english || '').split(/\s+/).map(w2 => w2.replace(/[.,!?;:""''()––\-…¿¡«»\[\]{}]/g, '').trim().toLowerCase()),
      });
    }
  }
}

// Load existing dictionary keys
const dictContent = fs.readFileSync(dictPath, 'utf8');
const dictKeys = new Set();
const keyPattern = /(?:^|\n)\s*(?:['"]([^'"]+)['"]|(\w[\w\u00C0-\u024F\u0400-\u04FF\u0900-\u097F]*)):\s*\{\s*en:/g;
let match;
while ((match = keyPattern.exec(dictContent)) !== null) {
  const key = (match[1] || match[2] || '').toLowerCase();
  if (key) dictKeys.add(key);
}

// Find missing words sorted by frequency
const missing = [];
for (const [word, contexts] of wordContexts) {
  if (!dictKeys.has(word)) {
    missing.push({ word, count: contexts.length, contexts });
  }
}
missing.sort((a, b) => b.count - a.count);

console.log(`Dictionary has ${dictKeys.size} entries`);
console.log(`Missing words: ${missing.length}`);

// ── POS detection ──────────────────────────────────────────
function detectPOS(word, lang) {
  // Common patterns by language
  if (lang === 'de') {
    if (/^(der|die|das|ein|eine|einem|einer|eines|den|dem|des)$/i.test(word)) return 'art';
    if (/^(ich|du|er|sie|es|wir|ihr|mich|mir|dich|dir|sich|uns|euch|ihnen|ihn|ihm)$/i.test(word)) return 'pron';
    if (/^(und|oder|aber|denn|sondern|weil|dass|ob|wenn|als|bevor|nachdem|obwohl|während|damit|sodass|falls|seit|bis|indem|sobald)$/i.test(word)) return 'conj';
    if (/^(in|an|auf|über|unter|vor|hinter|neben|zwischen|mit|von|zu|aus|bei|nach|seit|für|durch|gegen|ohne|um|bis|trotz|wegen|statt|während)$/i.test(word)) return 'prep';
    if (/^(nicht|sehr|schon|noch|auch|hier|dort|heute|morgen|gestern|immer|nie|oft|fast|nur|ganz|wirklich|besonders|vielleicht|wahrscheinlich|ziemlich|leider|gerne?)$/i.test(word)) return 'adv';
    if (/en$/.test(word) && word.length > 3) return 'v'; // German infinitives end in -en
    if (/^[A-ZÄÖÜ]/.test(word) && word.length > 1) return 'n'; // German nouns are capitalized
    if (/(lich|ig|isch|bar|sam|haft|los|voll|reich|arm|isch|lich)$/.test(word)) return 'adj';
    if (/(ung|heit|keit|schaft|nis|tum|ling|chen|lein)$/.test(word)) return 'n';
  }
  if (lang === 'nl') {
    if (/^(de|het|een)$/i.test(word)) return 'art';
    if (/^(ik|jij|je|hij|zij|ze|het|wij|we|jullie|u|hen|hun|hem|haar|ons|mij|me)$/i.test(word)) return 'pron';
    if (/^(en|of|maar|want|dus|dat|omdat|als|wanneer|terwijl|hoewel|tenzij|zodra|voordat|nadat|totdat|opdat)$/i.test(word)) return 'conj';
    if (/^(in|op|aan|bij|met|van|voor|naar|uit|over|onder|door|tussen|achter|naast|tegen|om|tot|zonder|tijdens)$/i.test(word)) return 'prep';
    if (/en$/.test(word) && word.length > 3) return 'v';
    if (/(lijk|ig|isch|baar|zaam|achtig|loos|vol|rijk)$/.test(word)) return 'adj';
    if (/(ing|heid|nis|schap|dom|ling|sel|ster|aar|eur)$/.test(word)) return 'n';
  }
  if (lang === 'fr') {
    if (/^(le|la|les|un|une|des|l|d)$/i.test(word)) return 'art';
    if (/^(je|tu|il|elle|on|nous|vous|ils|elles|me|te|se|lui|leur|en|y|moi|toi|soi)$/i.test(word)) return 'pron';
    if (/(er|ir|re|oir)$/.test(word)) return 'v';
    if (/(ment|tion|sion|eur|euse|ence|ance|isme|iste|ité|age|ail)$/.test(word)) return 'n';
    if (/(eux|euse|if|ive|ique|able|ible|el|elle|eux|ant|ent)$/.test(word)) return 'adj';
  }
  if (lang === 'pt') {
    if (/^(o|a|os|as|um|uma|uns|umas)$/i.test(word)) return 'art';
    if (/^(eu|tu|ele|ela|nós|vós|eles|elas|me|te|se|lhe|nos|vos|lhes|mim|ti|si)$/i.test(word)) return 'pron';
    if (/(ar|er|ir)$/.test(word)) return 'v';
    if (/(ção|são|dade|ismo|ista|mento|ência|ância|agem)$/.test(word)) return 'n';
    if (/(oso|osa|ível|ável|ico|ica|nte|al)$/.test(word)) return 'adj';
  }
  if (lang === 'sv') {
    if (/^(en|ett|den|det|de)$/i.test(word)) return 'art';
    if (/^(jag|du|han|hon|den|det|vi|ni|de|mig|dig|sig|oss|er|dem|honom|henne)$/i.test(word)) return 'pron';
    if (/a$/.test(word) && word.length > 2) return 'v'; // Swedish infinitives end in -a
    if (/(lig|ig|isk|bar|sam|lös|full|rik)$/.test(word)) return 'adj';
    if (/(ning|het|skap|dom|ande|else|tion|sion)$/.test(word)) return 'n';
  }
  // Default: try to guess from word length and patterns
  if (word.length <= 3) return 'adv';
  return 'n'; // conservative default
}

// ── Translation inference ───────────────────────────────────
// Try to find English equivalent by position alignment
function inferTranslation(word, contexts) {
  // Collect candidate translations from all context pairs
  const candidates = new Map();

  for (const ctx of contexts.slice(0, 10)) { // limit to 10 contexts for speed
    const ti = ctx.targetWords.indexOf(word);
    if (ti === -1) continue;

    // Try position-based alignment
    const ratio = ctx.englishWords.length / ctx.targetWords.length;
    const approxPos = Math.round(ti * ratio);

    // Check words around the approximate position
    for (let offset = -2; offset <= 2; offset++) {
      const ei = approxPos + offset;
      if (ei >= 0 && ei < ctx.englishWords.length) {
        const ew = ctx.englishWords[ei];
        if (ew && ew.length > 1 && !/^(the|a|an|is|am|are|was|were|to|of|in|on|at|for|and|or|but|it|i|he|she|we|they|my|your|his|her|our|their|this|that|these|those|not|do|does|did|have|has|had|will|would|can|could|may|might|shall|should|must|with|from|by|as|up|out|if|so|no|all|been|be|very|just|also|than|more|its|there)$/.test(ew)) {
          candidates.set(ew, (candidates.get(ew) || 0) + 1);
        }
      }
    }
  }

  // Return most frequent candidate
  if (candidates.size === 0) return word; // fallback to source word
  const sorted = [...candidates.entries()].sort((a, b) => b[1] - a[1]);
  return sorted[0][0];
}

// ── IPA generation (approximate) ────────────────────────────
function generateIPA(word, lang) {
  let ipa = word.toLowerCase();

  if (lang === 'de') {
    // German IPA rules
    ipa = ipa
      .replace(/sch/g, 'ʃ')
      .replace(/^st/g, 'ʃt').replace(/^sp/g, 'ʃp')
      .replace(/tsch/g, 'tʃ')
      .replace(/ck/g, 'k')
      .replace(/ch/g, (m, offset, str) => {
        const prev = str[offset - 1];
        return /[aouAOU]/.test(prev) ? 'x' : 'ç';
      })
      .replace(/ß/g, 's')
      .replace(/ei/g, 'aɪ')
      .replace(/ie/g, 'iː')
      .replace(/eu/g, 'ɔʏ').replace(/äu/g, 'ɔʏ')
      .replace(/au/g, 'aʊ')
      .replace(/ä/g, 'ɛ').replace(/ö/g, 'ø').replace(/ü/g, 'y')
      .replace(/aa/g, 'aː').replace(/ee/g, 'eː').replace(/oo/g, 'oː')
      .replace(/z/g, 'ts')
      .replace(/v/g, 'f')
      .replace(/w/g, 'v')
      .replace(/ph/g, 'f')
      .replace(/th/g, 't')
      .replace(/qu/g, 'kv')
      .replace(/er$/, 'ɐ')
      .replace(/en$/, 'ən')
      .replace(/e$/, 'ə')
      .replace(/ng/g, 'ŋ')
      .replace(/nk/g, 'ŋk')
      .replace(/j/g, 'j')
      .replace(/y/g, 'y');
  }
  if (lang === 'nl') {
    ipa = ipa
      .replace(/sch/g, 'sx')
      .replace(/ch/g, 'x')
      .replace(/ij/g, 'ɛi').replace(/ei/g, 'ɛi')
      .replace(/ui/g, 'œy')
      .replace(/ou/g, 'ɑu').replace(/au/g, 'ɑu')
      .replace(/oe/g, 'u')
      .replace(/eu/g, 'ø')
      .replace(/aa/g, 'aː').replace(/ee/g, 'eː').replace(/oo/g, 'oː').replace(/uu/g, 'yː')
      .replace(/ng/g, 'ŋ')
      .replace(/nk/g, 'ŋk')
      .replace(/g/g, 'ɣ')
      .replace(/v/g, 'v')
      .replace(/w/g, 'ʋ')
      .replace(/j/g, 'j')
      .replace(/en$/, 'ən')
      .replace(/e$/, 'ə');
  }
  if (lang === 'fr') {
    ipa = ipa
      .replace(/ou/g, 'u')
      .replace(/eau/g, 'o').replace(/au/g, 'o')
      .replace(/eu/g, 'ø')
      .replace(/oi/g, 'wa')
      .replace(/on/g, 'ɔ̃').replace(/om/g, 'ɔ̃')
      .replace(/an/g, 'ɑ̃').replace(/am/g, 'ɑ̃').replace(/en/g, 'ɑ̃').replace(/em/g, 'ɑ̃')
      .replace(/in/g, 'ɛ̃').replace(/im/g, 'ɛ̃').replace(/un/g, 'œ̃')
      .replace(/ai/g, 'ɛ').replace(/ei/g, 'ɛ')
      .replace(/ch/g, 'ʃ')
      .replace(/gn/g, 'ɲ')
      .replace(/qu/g, 'k')
      .replace(/gu/g, 'g')
      .replace(/ph/g, 'f')
      .replace(/ç/g, 's')
      .replace(/j/g, 'ʒ')
      .replace(/e$/, '');
  }
  if (lang === 'pt') {
    ipa = ipa
      .replace(/ão/g, 'ɐ̃ʊ̃')
      .replace(/nh/g, 'ɲ')
      .replace(/lh/g, 'ʎ')
      .replace(/ch/g, 'ʃ')
      .replace(/ou/g, 'o')
      .replace(/ei/g, 'ɛi')
      .replace(/ç/g, 's')
      .replace(/ss/g, 's')
      .replace(/rr/g, 'ʁ')
      .replace(/^r/g, 'ʁ')
      .replace(/j/g, 'ʒ')
      .replace(/x/g, 'ʃ')
      .replace(/e$/, 'i');
  }
  if (lang === 'sv') {
    ipa = ipa
      .replace(/sj/g, 'ɧ')
      .replace(/sk/g, (m, offset, str) => {
        const next = str[offset + 2];
        return /[eiyäöø]/.test(next) ? 'ɧ' : 'sk';
      })
      .replace(/tj/g, 'ɕ').replace(/kj/g, 'ɕ')
      .replace(/ng/g, 'ŋ')
      .replace(/å/g, 'oː')
      .replace(/ä/g, 'ɛ')
      .replace(/ö/g, 'ø')
      .replace(/j/g, 'j')
      .replace(/v/g, 'v');
  }

  return ipa;
}

// ── Generate entries ────────────────────────────────────────
const newEntries = [];
for (const { word, count, contexts } of missing.slice(0, limit)) {
  // Skip numbers and very short words
  if (/^\d+$/.test(word)) continue;
  if (word.length < 2) continue;

  const pos = detectPOS(word, lang);
  const translation = inferTranslation(word, contexts);
  const ipa = generateIPA(word, lang);

  newEntries.push({ word, en: translation, ipa, pos, count });
}

console.log(`\nGenerated ${newEntries.length} new entries`);

if (doWrite) {
  // Find the closing of the DICT object and insert before it
  const insertPoint = dictContent.lastIndexOf('};');
  if (insertPoint === -1) {
    console.error('Could not find DICT closing brace');
    process.exit(1);
  }

  // Generate new entry lines
  const lines = newEntries.map(e => {
    const key = /['\s\-]/.test(e.word) ? `'${e.word}'` : e.word;
    const enVal = e.en.replace(/'/g, "\\'");
    return `  ${key}: { en: '${enVal}', ipa: '${e.ipa}', pos: '${e.pos}' },`;
  });

  const newContent = dictContent.slice(0, insertPoint) +
    '  // ── Auto-expanded entries ──\n' +
    lines.join('\n') + '\n' +
    dictContent.slice(insertPoint);

  fs.writeFileSync(dictPath, newContent);
  console.log(`Written ${newEntries.length} entries to ${dictPath}`);
} else {
  console.log('\nSample entries (run with --write to save):');
  for (const e of newEntries.slice(0, 20)) {
    console.log(`  ${e.word}: { en: '${e.en}', ipa: '${e.ipa}', pos: '${e.pos}' } (${e.count}x)`);
  }
}

// Final coverage
const newCoverage = (dictKeys.size + newEntries.length) / wordContexts.size * 100;
console.log(`\nProjected coverage: ${newCoverage.toFixed(1)}% (${dictKeys.size + newEntries.length}/${wordContexts.size})`);
