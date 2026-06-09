#!/usr/bin/env node
/* Hindi (Devanagari) romanization injector — simplified IAST-ish.
 *   node scripts/hindi-romanize.cjs        # dry run
 *   node scripts/hindi-romanize.cjs --fix  # apply
 */

const fs = require('fs');

const args = process.argv.slice(2);
const fix = args.includes('--fix');

const DECK_PATH = 'src/data/hindi/deck.json';
const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf8'));

// Simplified Devanagari → Latin (no diacritics, learner-friendly)
const VOWELS = {
  'अ': 'a', 'आ': 'aa', 'इ': 'i', 'ई': 'ee', 'उ': 'u', 'ऊ': 'oo',
  'ऋ': 'ri', 'ए': 'e', 'ऐ': 'ai', 'ओ': 'o', 'औ': 'au',
};
const VOWEL_SIGNS = {
  'ा': 'aa', 'ि': 'i', 'ी': 'ee', 'ु': 'u', 'ू': 'oo',
  'ृ': 'ri', 'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au',
  'ं': 'n', 'ः': 'h', 'ँ': 'n', '़': '',
  '्': null, // halant suppresses inherent 'a'
};
const CONSONANTS = {
  'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'ङ': 'ng',
  'च': 'ch', 'छ': 'chh', 'ज': 'j', 'झ': 'jh', 'ञ': 'ny',
  'ट': 't', 'ठ': 'th', 'ड': 'd', 'ढ': 'dh', 'ण': 'n',
  'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n',
  'प': 'p', 'फ': 'ph', 'ब': 'b', 'भ': 'bh', 'म': 'm',
  'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'v',
  'श': 'sh', 'ष': 'sh', 'स': 's', 'ह': 'h',
  'क़': 'q', 'ख़': 'kh', 'ग़': 'g', 'ज़': 'z', 'ड़': 'r', 'ढ़': 'rh', 'फ़': 'f',
};

// Curated common words
const CURATED_HI = {
  'है': 'hai', 'हैं': 'hain', 'हूँ': 'hun', 'हो': 'ho',
  'था': 'tha', 'थी': 'thi', 'थे': 'the', 'थीं': 'theen',
  'मैं': 'main', 'तुम': 'tum', 'आप': 'aap', 'वह': 'vah', 'यह': 'yah',
  'हम': 'hum', 'ये': 'ye', 'वे': 've', 'वो': 'vo',
  'मेरा': 'mera', 'मेरी': 'meri', 'मेरे': 'mere',
  'तुम्हारा': 'tumhara', 'तुम्हारी': 'tumhari', 'तुम्हारे': 'tumhare',
  'उसका': 'uska', 'उसकी': 'uski', 'उसके': 'uske',
  'हमारा': 'hamara', 'हमारी': 'hamari', 'हमारे': 'hamare',
  'आपका': 'aapka', 'आपकी': 'aapki', 'आपके': 'aapke',
  'मैंने': 'mainne', 'तुमने': 'tumne', 'आपने': 'aapne',
  'उसने': 'usne', 'उन्होंने': 'unhone', 'हमने': 'hamne',
  'ने': 'ne', 'को': 'ko', 'से': 'se', 'में': 'mein', 'पर': 'par', 'तक': 'tak',
  'का': 'ka', 'की': 'ki', 'के': 'ke',
  'और': 'aur', 'या': 'ya', 'पर': 'par', 'लेकिन': 'lekin',
  'के लिए': 'ke liye', 'के पास': 'ke paas', 'के साथ': 'ke saath',
  'के बाद': 'ke baad', 'के बारे में': 'ke baare mein',
  'मुझको': 'mujhko', 'तुझको': 'tujhko', 'उसको': 'usko',
  'मुझे': 'mujhe', 'तुझे': 'tujhe', 'उसे': 'use',
  'क्या': 'kya', 'कब': 'kab', 'कहाँ': 'kahaan', 'कैसे': 'kaise', 'कौन': 'kaun',
  'क्यों': 'kyon', 'कितना': 'kitna', 'कितनी': 'kitni', 'कितने': 'kitne',
  'जाता': 'jata', 'जाती': 'jati', 'जाते': 'jate',
  'करता': 'karta', 'करती': 'karti', 'करते': 'karte',
  'राम': 'Ram', 'सीता': 'Sita', 'अशोक': 'Ashok',
  'बड़ा': 'bara', 'बड़ी': 'bari', 'बड़े': 'bare',
  'छोटा': 'chhota', 'छोटी': 'chhoti', 'छोटे': 'chhote',
  'बच्चे': 'bachche', 'बच्चा': 'bachcha', 'बच्ची': 'bachchi',
  'खाना': 'khana', 'पानी': 'pani', 'घर': 'ghar',
  'मेरे पास': 'mere paas', 'पास': 'paas', 'कार': 'kar',
  'बुलाओ': 'bulao', 'दो': 'do',
  'देखा': 'dekha', 'देखी': 'dekhi',
  'मोबाइल': 'mobile', 'लैपटॉप': 'laptop',
  'जाने': 'jaane',
  'इसके लिए': 'iske liye',
  'उसके लिए': 'uske liye',
  'इसके बाद': 'iske baad',
};

function transliterateWord(word) {
  if (CURATED_HI[word]) return CURATED_HI[word];
  let result = '';
  let i = 0;
  while (i < word.length) {
    const ch = word[i];
    const next = word[i+1];
    if (CONSONANTS[ch]) {
      const isLast = i === word.length - 1;
      result += CONSONANTS[ch];
      if (VOWEL_SIGNS[next] !== undefined) {
        if (VOWEL_SIGNS[next] === null) { i += 2; continue; }
        result += VOWEL_SIGNS[next];
        i += 2;
      } else if (isLast) {
        // Drop schwa at word-final position (Hindi schwa deletion)
        i += 1;
      } else {
        result += 'a';
        i += 1;
      }
    } else if (VOWELS[ch]) {
      result += VOWELS[ch];
      i += 1;
    } else if (VOWEL_SIGNS[ch]) {
      if (VOWEL_SIGNS[ch] !== null) result += VOWEL_SIGNS[ch];
      i += 1;
    } else {
      result += ch;
      i += 1;
    }
  }
  return result;
}

function romanizeChunk(phrase) {
  return phrase.split(/\s+/).map(transliterateWord).join(' ');
}

function romanizeTip(tip) {
  if (/\([^)]*[a-zA-Z]{2,}/.test(tip)) return tip; // already has roman parenthetical

  let romanized = false;
  // First try backtick chunks
  let result = tip.replace(/`([ऀ-ॿ][ऀ-ॿ\s\-']*)`/, (m, dev) => {
    if (romanized) return m;
    romanized = true;
    const trimmed = dev.trim();
    const words = trimmed.split(/\s+/).slice(0, 4);
    return '`' + dev + '` (' + words.map(transliterateWord).join(' ') + ')';
  });
  if (romanized) return result;

  // Fall back to first standalone Devanagari phrase
  result = tip.replace(/([ऀ-ॿ][ऀ-ॿ\-']*(?:\s+[ऀ-ॿ][ऀ-ॿ\-']*){0,2})/, (m, phrase) => {
    if (romanized) return m;
    romanized = true;
    return phrase + ' (' + romanizeChunk(phrase) + ')';
  });
  return result;
}

let processed = 0;
const changes = [];

for (const card of deck) {
  if (!card.grammar) continue;
  if (!/[ऀ-ॿ]/.test(card.grammar)) continue;
  if (/\([^)]*[a-zA-Z]{2,}/.test(card.grammar)) continue;
  const newTip = romanizeTip(card.grammar);
  if (newTip !== card.grammar) {
    changes.push({ id: card.id, before: card.grammar, after: newTip });
    if (fix) card.grammar = newTip;
    processed++;
  }
}

console.log('Processed', processed);
for (const c of changes.slice(0, 5)) {
  console.log('[' + c.id + ']');
  console.log('  before: ' + c.before.slice(0, 130));
  console.log('  after : ' + c.after.slice(0, 160));
  console.log();
}

if (fix) {
  fs.writeFileSync(DECK_PATH, JSON.stringify(deck, null, 2));
  console.log('Hindi deck written.');
}
