#!/usr/bin/env node
/**
 * Final cleanup of Russian dict fixes:
 * 1. Revert remaining bad fixes (past tense verbs with good originals, marginal synonyms)
 * 2. Manually improve good fixes (clean up conjugated forms)
 */

const fs = require('fs');
const path = require('path');

const DICT_PATH = path.join(__dirname, '..', 'src', 'data', 'dictionary', 'ru.ts');
let content = fs.readFileSync(DICT_PATH, 'utf-8');
const lines = content.split('\n');

function findLine(key) {
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].match(new RegExp(`^\\s+'${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}':`))) {
      return i;
    }
  }
  return -1;
}

function parseLine(line) {
  const enIdx = line.indexOf("en: '") + 5;
  let enEnd = enIdx;
  while (enEnd < line.length && !(line[enEnd] === "'" && line[enEnd-1] !== '\\')) enEnd++;
  const en = line.substring(enIdx, enEnd).replace(/\\'/g, "'");
  const ipaMatch = line.match(/ipa:\s*'([^']*)'/);
  const posMatch = line.match(/pos:\s*'([^']*)'/);
  const lemmaMatch = line.match(/lemma:\s*'([^']*)'/);
  return {
    en,
    ipa: ipaMatch ? ipaMatch[1] : '',
    pos: posMatch ? posMatch[1] : '',
    lemma: lemmaMatch ? lemmaMatch[1] : null,
  };
}

function buildLine(key, en, ipa, pos, lemma) {
  const escapedEn = en.replace(/'/g, "\\'");
  let line = `  '${key}': { en: '${escapedEn}', ipa: '${ipa}', pos: '${pos}'`;
  if (lemma) line += `, lemma: '${lemma}'`;
  line += ' },';
  return line;
}

function setEn(key, newEn) {
  const idx = findLine(key);
  if (idx === -1) return false;
  const p = parseLine(lines[idx]);
  lines[idx] = buildLine(key, newEn, p.ipa, p.pos, p.lemma);
  return true;
}

// ── Manual corrections: override Google where it's wrong or needs cleanup ──
const overrides = {
  // Verb conjugated forms → clean infinitive meanings
  'вернёмся': 'to return; to come back',
  'вернусь': 'to return; to come back',
  'взяв': 'to take; having taken',
  'взял': 'to take',
  'возвращаемся': 'to return; to come back',
  'возьмите': 'to take (imperative)',
  'встанешь': 'to get up; to stand up',
  'встаю': 'to get up; to stand up',
  'выйдя': 'to go out; having gone out',
  'говорят': 'to say; to speak',
  'готовила': 'to cook; to prepare',
  'гуляла': 'to walk; to stroll',
  'делает': 'to do; to make',
  'делал': 'to do; to make',
  'делали': 'to do; to make',
  'держи': 'to hold; here (imperative)',
  'добираемся': 'to get to; to make our way',
  'изучаем': 'to study; to learn',
  'имел': 'to have',
  'имея': 'to have; having',
  'качается': 'to swing; to rock',
  'клялся': 'to swear; to vow',
  'летит': 'to fly',
  'молол': 'to grind',
  'мыл': 'to wash',
  'отвечал': 'to answer; to reply',
  'отвечала': 'to answer; to reply',
  'отвечали': 'to answer; to reply',
  'перелетела': 'to fly over',
  'получилась': 'to turn out',
  'помолол': 'to grind',
  'помочь': 'to help',
  'попал': 'to get into; to hit',
  'попросил': 'to ask; to request',
  'послал': 'to send',
  'поставил': 'to put; to place',
  'построим': 'to build',
  'потребляем': 'to consume',
  'потянулся': 'to stretch',
  'предложили': 'to offer; to suggest',
  'придёшь': 'to come; to arrive',
  'приеду': 'to come; to arrive (by vehicle)',
  'пробежал': 'to run through',
  'проснулась': 'to wake up',
  'прыгнул': 'to jump',
  'рассказала': 'to tell; to narrate',
  'рассказали': 'to tell; to narrate',
  'расскажи': 'to tell (imperative)',
  'решила': 'to decide',
  'родилась': 'to be born',
  'сделать': 'to do; to make',
  'спросил': 'to ask',
  'стреляет': 'to shoot',
  'танцует': 'to dance',
  'указал': 'to point; to indicate',
  'унёс': 'to carry away',
  'учишь': 'to study; to learn',
  'хватит': 'enough; to suffice',

  // Nouns: fix genuinely wrong translations
  'волнами': 'waves',
  'города': 'city; cities',
  'городов': 'cities',
  'жены': 'wife; wives',
  'зубами': 'teeth',
  'качелях': 'swing; swings',
  'лилий': 'lilies',
  'людей': 'people',
  'люди': 'people',
  'мужчин': 'men',
  'мышей': 'mice',
  'ножи': 'knives',
  'щенят': 'puppies',
  'словам': 'words',

  // Adjectives
  'жаль': "it\\'s a pity; too bad",

  // Adverbs / particles
  'домом': 'house; home',
  'дому': 'house; home',

  // Genuinely wrong originals
  'ездит': 'to drive; to ride',
  'мира': 'world; peace',
  'перед': 'in front of; before',
  'всеми': 'everyone; all',
  'несколько': 'several; a few',
  'тюрьмы': 'prison; jail',
  'тёмной': 'dark',
  'правду': 'truth',
  'строителей': 'builders',
  'хвостик': 'little tail',
};

// ── Entries to fully revert (Google was wrong, original was fine) ──
const fullReverts = [
  'конечно',    // "of course" → "certainly" – both fine, keep original
  'рассказывает', // probably fine as is
  'сохранить', // probably fine as is
];

let fixCount = 0;
let revertCount = 0;

// Apply overrides
for (const [key, newEn] of Object.entries(overrides)) {
  if (setEn(key, newEn)) fixCount++;
}

// Apply reverts – find these in the fix log and restore original
const fixLog = require('./output/ru-semantic-fixes-v2.json');
const fixMap = new Map(fixLog.map(f => [f.key, f.oldEn]));

for (const key of fullReverts) {
  const oldEn = fixMap.get(key);
  if (oldEn && setEn(key, oldEn)) revertCount++;
}

fs.writeFileSync(DICT_PATH, lines.join('\n'));
console.log(`Applied ${fixCount} overrides, reverted ${revertCount}`);
