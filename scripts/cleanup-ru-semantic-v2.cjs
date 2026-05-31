#!/usr/bin/env node
/**
 * Post-process Russian semantic fixes v2:
 * Revert bad replacements, keep only genuine fixes.
 */

const fs = require('fs');
const path = require('path');

const DICT_PATH = path.join(__dirname, '..', 'src', 'data', 'dictionary', 'ru.ts');
const fixes = require('./output/ru-semantic-fixes-v2.json');

const content = fs.readFileSync(DICT_PATH, 'utf-8');
const lines = content.split('\n');

// Parse entries for line lookup
function findLine(lines, key) {
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].match(new RegExp(`^\\s+'${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}':`))) {
      return i;
    }
  }
  return -1;
}

// Reconstruct a line preserving existing IPA/pos/lemma
function buildLine(key, en, ipa, pos, lemma) {
  const escapedEn = en.replace(/'/g, "\\'");
  let line = `  '${key}': { en: '${escapedEn}', ipa: '${ipa}', pos: '${pos}'`;
  if (lemma) line += `, lemma: '${lemma}'`;
  line += ' },';
  return line;
}

// Parse a line to get fields
function parseLine(line) {
  const keyMatch = line.match(/^\s+'([^']+)':\s*\{/);
  if (!keyMatch) return null;
  const key = keyMatch[1];
  const enIdx = line.indexOf("en: '") + 5;
  let enEnd = enIdx;
  while (enEnd < line.length && !(line[enEnd] === "'" && line[enEnd-1] !== '\\')) enEnd++;
  const en = line.substring(enIdx, enEnd).replace(/\\'/g, "'");
  const ipaMatch = line.match(/ipa:\s*'([^']*)'/);
  const posMatch = line.match(/pos:\s*'([^']*)'/);
  const lemmaMatch = line.match(/lemma:\s*'([^']*)'/);
  return {
    key, en,
    ipa: ipaMatch ? ipaMatch[1] : '',
    pos: posMatch ? posMatch[1] : '',
    lemma: lemmaMatch ? lemmaMatch[1] : null,
  };
}

// Categorize fixes
const revert = []; // bad fixes to revert
const keep = [];   // good fixes to keep
const improve = []; // fixes to apply with better values

for (const f of fixes) {
  const { key, oldEn, newEn, google } = f;

  // 1. Exact/near-identical: revert (no real change)
  const oldNorm = oldEn.toLowerCase().replace(/^to /, '').replace(/[;,]\s*/g, ' ').trim();
  const newNorm = newEn.toLowerCase().replace(/^to /, '').replace(/[;,]\s*/g, ' ').trim();
  if (oldNorm === newNorm) {
    revert.push({ key, reason: 'identical', oldEn });
    continue;
  }

  // 2. Google gave past tense for verbs — revert unless original was genuinely wrong
  const pastTenseWords = ['saw', 'took', 'drove', 'met', 'stood', 'went', 'came', 'gave',
    'made', 'ran', 'ate', 'drank', 'sang', 'wrote', 'bought', 'sold', 'found', 'knew',
    'said', 'told', 'got', 'thought', 'brought', 'felt', 'put', 'left', 'kept', 'lost',
    'paid', 'sat', 'sent', 'spent', 'taught', 'threw', 'wore', 'won', 'broke', 'chose',
    'drew', 'fell', 'flew', 'grew', 'held', 'hid', 'hung', 'led', 'lay', 'lit', 'meant',
    'rode', 'rang', 'rose', 'shook', 'shot', 'shut', 'slept', 'spoke', 'stole', 'swept',
    'swam', 'tore', 'woke', 'fought', 'forgot', 'froze', 'shone', 'spun', 'wept', 'wound',
    'abandoned', 'cooked', 'objected', 'studied', 'played', 'worked', 'lived', 'loved',
    'wanted', 'collected', 'realized', 'decided', 'noticed', 'appeared', 'seemed', 'looked',
    'started', 'finished', 'opened', 'closed', 'turned', 'moved', 'changed', 'tried',
    'helped', 'asked', 'answered', 'called', 'walked', 'arrived', 'returned', 'stopped',
    'waited', 'hoped', 'believed', 'missed', 'passed', 'carried', 'learned', 'taught',
    'translated', 'saved', 'graduated', 'prepared', 'received', 'touched'];

  const newWords = newEn.replace(/^to /, '').toLowerCase().split(/\s+/);
  const isPastTense = newWords.some(w => pastTenseWords.includes(w));

  // Check if old translation was a valid infinitive
  const oldIsInfinitive = oldEn.startsWith('to ') &&
    !pastTenseWords.some(w => oldEn.toLowerCase().includes(w));

  if (isPastTense && oldIsInfinitive) {
    revert.push({ key, reason: 'past_tense', oldEn });
    continue;
  }

  // 3. Synonym swaps where original was fine
  // "quickly" → "fast", "more cheerful" → "more fun" etc.
  const synonymPairs = [
    ['quickly', 'fast'],
    ['more cheerful', 'more fun'],
    ['rich', 'wealthy'],
    ['big', 'large'],
    ['small', 'little'],
    ['fast', 'quick'],
    ['beautiful', 'pretty'],
    ['difficult', 'hard'],
    ['easy', 'simple'],
    ['happy', 'joyful'],
    ['sad', 'unhappy'],
    ['afraid', 'scared'],
  ];
  let isSynonym = false;
  for (const [a, b] of synonymPairs) {
    if ((oldNorm.includes(a) && newNorm.includes(b)) ||
        (oldNorm.includes(b) && newNorm.includes(a))) {
      isSynonym = true;
      break;
    }
  }
  if (isSynonym) {
    revert.push({ key, reason: 'synonym', oldEn });
    continue;
  }

  // 4. Google translating a noun form differently but both correct
  // e.g. "house" → "home", "city" → "cities" — usually fine, revert unless original was garbled
  const garbledOld = /\\|waf|drif|[^a-zA-Z\s;,()\-'./!?0-9]/.test(oldEn) ||
                     oldEn.trim().length <= 2;

  if (!garbledOld && newEn.length <= oldEn.length * 0.5 && !isPastTense) {
    // New is much shorter — likely losing information, revert
    revert.push({ key, reason: 'info_loss', oldEn });
    continue;
  }

  // 5. Genuine fixes — keep
  keep.push({ key, oldEn, newEn });
}

console.log(`Total fixes: ${fixes.length}`);
console.log(`Reverting: ${revert.length}`);
console.log(`Keeping: ${keep.length}`);
console.log(`Improving: ${improve.length}`);

// Apply reverts
let revertCount = 0;
for (const r of revert) {
  const lineIdx = findLine(lines, r.key);
  if (lineIdx === -1) continue;
  const parsed = parseLine(lines[lineIdx]);
  if (!parsed) continue;
  const newLine = buildLine(r.key, r.oldEn, parsed.ipa, parsed.pos, parsed.lemma);
  lines[lineIdx] = newLine;
  revertCount++;
}

// Show kept fixes
console.log(`\nKept fixes (${keep.length}):`);
for (const k of keep.slice(0, 50)) {
  console.log(`  ${k.key}: "${k.oldEn}" → "${k.newEn}"`);
}
if (keep.length > 50) console.log(`  ... and ${keep.length - 50} more`);

fs.writeFileSync(DICT_PATH, lines.join('\n'));
console.log(`\nReverted ${revertCount} bad fixes. Net fixes: ${keep.length}`);
