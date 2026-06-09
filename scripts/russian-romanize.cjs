#!/usr/bin/env node
/* Russian romanization injector.
 *
 * For each Russian tip that contains Cyrillic but no romanization yet,
 * find Cyrillic word/phrase chunks and inject (roman) annotations after
 * them. Uses a simplified BGN/PCGN-style transliteration.
 *
 *   node scripts/russian-romanize.cjs        # dry run with samples
 *   node scripts/russian-romanize.cjs --fix  # apply
 */

const fs = require('fs');

const args = process.argv.slice(2);
const fix = args.includes('--fix');

const DECK_PATH = 'src/data/russian/deck.json';
const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf8'));

// Simplified Russian → Latin transliteration table
const TRANSLIT = {
  // Lowercase
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
  'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
  'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
  'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch',
  'ъ': '', 'ы': 'y', 'ь': "'", 'э': 'e', 'ю': 'yu', 'я': 'ya',
  // Uppercase
  'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo',
  'Ж': 'Zh', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M',
  'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U',
  'Ф': 'F', 'Х': 'Kh', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Shch',
  'Ъ': '', 'Ы': 'Y', 'Ь': "'", 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya',
};

// Common Russian words with curated romanizations (override generic transliteration)
const CURATED = {
  'меня': 'menya', 'зовут': 'zovut',
  'мне': 'mne', 'тебе': 'tebe', 'ему': 'yemu', 'ей': 'ey',
  'есть': 'yest\'', 'нет': 'net',
  'хочу': 'khochu', 'хочешь': 'khochesh', 'хочет': 'khochet',
  'был': 'byl', 'была': 'byla', 'было': 'bylo', 'были': 'byli',
  'буду': 'budu', 'будешь': 'budesh', 'будет': 'budet',
  'это': 'eto', 'этот': 'etot', 'эта': 'eta',
  'тот': 'tot', 'та': 'ta', 'то': 'to',
  'всё': 'vsyo', 'все': 'vse', 'весь': 'ves', 'вся': 'vsya',
  'свой': 'svoy', 'своя': 'svoya', 'своё': 'svoyo', 'свои': 'svoi',
  'я': 'ya', 'ты': 'ty', 'он': 'on', 'она': 'ona', 'оно': 'ono',
  'мы': 'my', 'вы': 'vy', 'они': 'oni',
  'в': 'v', 'на': 'na', 'о': 'o', 'об': 'ob', 'при': 'pri',
  'с': 's', 'к': 'k', 'у': 'u', 'до': 'do', 'из': 'iz', 'от': 'ot',
  'по': 'po', 'за': 'za', 'для': 'dlya', 'про': 'pro', 'через': 'cherez',
  'без': 'bez', 'над': 'nad', 'под': 'pod',
  'и': 'i', 'или': 'ili', 'но': 'no', 'а': 'a',
  'если': 'yesli', 'бы': 'by', 'когда': 'kogda', 'потому': 'potomu',
  'что': 'chto', 'как': 'kak', 'где': 'gde', 'куда': 'kuda', 'откуда': 'otkuda',
  'кто': 'kto', 'какой': 'kakoy', 'какая': 'kakaya', 'какое': 'kakoye',
  'который': 'kotoryy', 'которая': 'kotoraya', 'которое': 'kotoroye',
  'много': 'mnogo', 'мало': 'malo', 'сколько': 'skolko', 'несколько': 'neskolko',
  'два': 'dva', 'две': 'dve', 'три': 'tri', 'четыре': 'chetyre', 'пять': 'pyat\'',
  'дом': 'dom', 'дома': 'doma', 'доме': 'dome',
  'жить': 'zhit\'', 'живу': 'zhivu', 'живёшь': 'zhivyosh', 'живёт': 'zhivyot',
  'идти': 'idti', 'иду': 'idu', 'идёшь': 'idyosh', 'идёт': 'idyot', 'идём': 'idyom',
  'ходить': 'khodit\'', 'хожу': 'khozhu', 'ходишь': 'khodish', 'ходит': 'khodit',
  'ехать': 'yekhat\'', 'еду': 'yedu', 'едешь': 'yedesh', 'едет': 'yedet',
  'ездить': 'yezdit\'', 'езжу': 'yezzhu', 'ездишь': 'yezdish',
  'красивый': 'krasivyy', 'красивая': 'krasivaya', 'красивое': 'krasivoye',
  'хороший': 'khoroshiy', 'хорошая': 'khoroshaya', 'хорошее': 'khorosheye',
  'большой': 'bolshoy', 'большая': 'bolshaya', 'большое': 'bolshoye',
  'маленький': 'malenkiy', 'маленькая': 'malenkaya', 'маленькое': 'malenkoye',
  'новый': 'novyy', 'новая': 'novaya', 'новое': 'novoye',
  'старый': 'staryy', 'старая': 'staraya', 'старое': 'staroye',
  'синий': 'siniy', 'синяя': 'sinyaya', 'синее': 'sineye',
  'много': 'mnogo', 'дома': 'doma',
  'москве': 'Moskve', 'москва': 'Moskva',
  'книгу': 'knigu', 'книгой': 'knigoy', 'книги': 'knigi', 'книга': 'kniga',
  'отце': 'ottse', 'отец': 'otets',
  'доме': 'dome', 'школе': 'shkole', 'работе': 'rabote',
  'думаю': 'dumayu', 'думаешь': 'dumayesh', 'думает': 'dumayet',
  'делать': 'delat\'', 'делаю': 'delayu', 'делаешь': 'delayesh', 'делает': 'delayet',
  'читать': 'chitat\'', 'читаю': 'chitayu', 'читаешь': 'chitayesh', 'читает': 'chitayet',
  'писать': 'pisat\'', 'пишу': 'pishu', 'пишешь': 'pishesh', 'пишет': 'pishet',
  'видеть': 'videt\'', 'вижу': 'vizhu', 'видишь': 'vidish', 'видит': 'vidit',
  'знать': 'znat\'', 'знаю': 'znayu', 'знаешь': 'znayesh', 'знает': 'znayet',
  'любить': 'lyubit\'', 'люблю': 'lyublyu', 'любишь': 'lyubish', 'любит': 'lyubit',
  'купить': 'kupit\'', 'куплю': 'kuplyu', 'купишь': 'kupish', 'купит': 'kupit',
  'говорить': 'govorit\'', 'говорю': 'govoryu', 'говоришь': 'govorish', 'говорит': 'govorit',
  'спать': 'spat\'', 'сплю': 'splyu', 'спишь': 'spish', 'спит': 'spit',
  'есть': 'yest\'', 'ем': 'yem', 'ешь': 'yesh', 'ест': 'yest',
  'пить': 'pit\'', 'пью': 'p\'yu', 'пьёшь': 'p\'yosh', 'пьёт': 'p\'yot',
  'мыть': 'myt\'', 'мою': 'moyu', 'моешь': 'moyesh', 'моется': 'moyetsya',
  'мыться': 'myt\'sya', 'моюсь': 'moyus\'', 'моешься': 'moyesh\'sya',
  'учиться': 'uchit\'sya', 'учусь': 'uchus\'', 'учишься': 'uchish\'sya',
  'смеяться': 'smeyat\'sya', 'смеюсь': 'smeyus\'',
  'находиться': 'nakhodit\'sya', 'находится': 'nakhoditsya',
  'улыбаться': 'ulybat\'sya', 'улыбается': 'ulybayetsya',
  'надеяться': 'nadeyat\'sya', 'надеется': 'nadeyetsya',
  'встречаться': 'vstrechat\'sya', 'встречается': 'vstrechayetsya',
  'целоваться': 'tselovat\'sya', 'целуются': 'tseluyutsya',
  'утром': 'utrom', 'днём': 'dnyom', 'вечером': 'vecherom', 'ночью': 'noch\'yu',
  'утра': 'utra', 'дня': 'dnya', 'вечера': 'vechera', 'ночи': 'nochi',
  'сегодня': 'segodnya', 'вчера': 'vchera', 'завтра': 'zavtra',
  'тоже': 'tozhe', 'также': 'takzhe', 'только': 'tol\'ko', 'уже': 'uzhe',
  'ещё': 'yeshchyo', 'может': 'mozhet', 'может быть': 'mozhet byt\'',
  'почему': 'pochemu', 'потому что': 'potomu chto',
  'хотел': 'khotel', 'хотела': 'khotela', 'хотели': 'khoteli',
  'был': 'byl', 'была': 'byla', 'было': 'bylo', 'были': 'byli',
  'олег': 'Oleg', 'мария': 'Mariya', 'иван': 'Ivan', 'анна': 'Anna',
  // Cases of common pronouns + relations
  'его': 'yego', 'её': 'yeyo', 'их': 'ikh',
  'кого': 'kogo', 'чего': 'chego',
  'кому': 'komu', 'чему': 'chemu',
  'кем': 'kem', 'чем': 'chem',
  // Question words
  'почему': 'pochemu', 'зачем': 'zachem',
};

function transliterate(word) {
  const lower = word.toLowerCase();
  if (CURATED[lower]) {
    // Preserve initial-capital if original is capitalized
    if (word[0] === word[0].toUpperCase()) {
      return CURATED[lower][0].toUpperCase() + CURATED[lower].slice(1);
    }
    return CURATED[lower];
  }
  let result = '';
  for (const ch of word) {
    result += TRANSLIT[ch] ?? ch;
  }
  return result;
}

// Romanize the FIRST Cyrillic chunk in the tip ONLY, to keep tip length down.
// Skip if any parenthetical with Latin letters already exists anywhere in the tip
// (we treat that as a romanization already present).
function romanizeTip(tip) {
  if (/\([a-zA-Z]{2,}/.test(tip)) return tip; // already has roman parenthetical

  // Pass 1: backtick-delimited chunks. Romanize FIRST one only.
  let romanized = false;
  let result = tip.replace(/`([Ѐ-ӿ][Ѐ-ӿ\s\-']*)`/, (_m, cyr) => {
    if (romanized) return _m;
    romanized = true;
    const trimmed = cyr.trim();
    const words = trimmed.split(/\s+/).slice(0, 4); // cap at 4 words
    const romans = words.map(transliterate).join(' ');
    return '`' + cyr + '` (' + romans + ')';
  });
  if (romanized) return result;

  // Pass 2: first standalone Cyrillic phrase
  result = tip.replace(/([Ѐ-ӿ][Ѐ-ӿ\-']*(?:\s+[Ѐ-ӿ][Ѐ-ӿ\-']*){0,2})/, (m, phrase) => {
    if (romanized) return m;
    romanized = true;
    const words = phrase.split(/\s+/);
    const romans = words.map(transliterate).join(' ');
    return phrase + ' (' + romans + ')';
  });
  return result;
}

const noRomRe = /\([a-zA-Z][a-zA-Z' ]+\s*[=,]/;

let processed = 0;
const changes = [];

for (const card of deck) {
  if (!card.grammar) continue;
  if (!/[Ѐ-ӿ]/.test(card.grammar)) continue;
  if (noRomRe.test(card.grammar)) continue;
  const newTip = romanizeTip(card.grammar);
  if (newTip !== card.grammar) {
    changes.push({ id: card.id, before: card.grammar, after: newTip });
    if (fix) card.grammar = newTip;
    processed++;
  }
}

console.log('Processed', processed, 'cards (of 241 candidates)');
console.log();
for (const c of changes.slice(0, 5)) {
  console.log('[' + c.id + ']');
  console.log('  before: ' + c.before.slice(0, 130));
  console.log('  after : ' + c.after.slice(0, 150));
  console.log();
}

if (fix) {
  fs.writeFileSync(DECK_PATH, JSON.stringify(deck, null, 2));
  console.log('Russian deck written.');
}
