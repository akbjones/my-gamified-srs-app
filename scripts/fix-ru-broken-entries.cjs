#!/usr/bin/env node
/**
 * Fix remaining broken entries in Russian dictionary:
 * 1. Entries with trailing backslashes (truncated apostrophes from previous bad edits)
 * 2. Past tense verbs that should be infinitive
 * 3. Very short/meaningless translations
 * 4. Function words that crept in
 * Translates via Google API for broken ones, uses manual mapping for verb forms.
 */

const fs = require('fs');
const path = require('path');

const API_KEY = 'AIzaSyBImkCNYcI1m9mloUNcYcDN2L5dQZwADzI';
const DICT_PATH = path.join(__dirname, '..', 'src', 'data', 'dictionary', 'ru.ts');

let content = fs.readFileSync(DICT_PATH, 'utf-8');

// ── Find all broken entries ──
const re = /^\s*'([^']+)':\s*\{([^}]*)\}/gm;
let m;
const entries = [];
while ((m = re.exec(content)) !== null) {
  const key = m[1];
  const body = m[2];
  const enMatch = body.match(/en:\s*'([^']*)'/);
  const posMatch = body.match(/pos:\s*'([^']*)'/);
  const lemmaMatch = body.match(/lemma:\s*'([^']*)'/);
  if (enMatch) {
    entries.push({
      key,
      en: enMatch[1],
      pos: posMatch ? posMatch[1] : '',
      lemma: lemmaMatch ? lemmaMatch[1] : null,
    });
  }
}

// Identify broken entries
const broken = entries.filter(e => {
  const en = e.en.trim();
  // Truncated with backslash
  if (en.includes('\\')) return true;
  // Past tense verbs
  if (e.pos === 'v' && /^to (saw|took|drove|met|stood|went|came|gave|made|ran|ate|drank|sang|wrote|bought|sold|found|knew|said|told|got|thought|brought|felt|put|left|kept|lost|paid|sat|sent|spent|taught|threw|wore|won|broke|chose|drew|fell|flew|grew|held|hid|hung|led|lay|lit|meant|rode|rang|rose|shook|shot|shut|slept|spoke|stole|swept|swam|tore|woke|fought|forgot|froze|shone|spun|wept|wound)$/.test(en)) return true;
  // Very short (2 chars or less, or common function words only)
  if (en.length <= 2 && !['or', 'go', 'no'].includes(en)) return true;
  // "do" for delat' forms
  if (en === 'do' || en === 'go') return true;
  // "ko" or similar nonsense
  if (en === 'ko' || en === 'tv') return true;
  return false;
});

console.log(`Found ${broken.length} broken entries to fix`);

// ── Manual fixes for known entries ──
const manual = {
  // Truncated "let's..." entries
  'встретимся': "to let's meet",
  'встречаемся': 'to meet; to get together',
  'выпьем': "to let's drink",
  'давай': "let's; come on",
  'давайте': "let's; come on",
  'договариваемся': 'to agree; to arrange',
  'закончим': "to let's finish",
  'идём': "to let's go; to we're going",
  'катаемся': 'to ride; to go for a ride',
  'наряжаем': 'to decorate; to dress up',
  'наслаждаемся': 'to enjoy',
  'начинаем': 'to begin; to start',
  'останемся': "to let's stay",
  'поедем': "to let's go (by vehicle)",
  'поехали': "to let's go; to went (by vehicle)",
  'пойдём': "to let's go",
  'попробуем': "to let's try",
  'поболтаем': "to let's chat",
  'поговорим': "to let's talk",
  'сходим': "to let's go (on foot)",
  'обменяемся': "to let's exchange",
  'уберём': "to let's clean up",

  // Truncated "I..." entries
  'горжусь': 'to be proud',
  'довольна': 'satisfied; pleased',
  'добираемся': 'to get to; to make our way',
  'еду': 'to ride; to go (by vehicle)',
  'едем': 'to ride; to go (by vehicle)',
  'ездим': 'to drive; to ride regularly',
  'захожу': 'to come in; to drop by',
  'записываюсь': 'to sign up; to enroll',
  'иду': 'to go; to walk',
  'интересуюсь': 'to be interested in',
  'ищу': 'to look for; to search',
  'ложусь': 'to lie down; to go to bed',
  'найду': 'to find',
  'напишу': 'to write',
  'несу': 'to carry',
  'обедаю': 'to have lunch',
  'объясню': 'to explain',
  'освобожусь': 'to be free; to become available',
  'открою': 'to open',
  'перехожу': 'to cross; to switch',
  'поднимаюсь': 'to go up; to climb',
  'поеду': 'to go (by vehicle)',
  'позвоню': 'to call (phone)',
  'привыкаю': 'to get used to',
  'придёшь': 'to come; to arrive',
  'приду': 'to come; to arrive',
  'прихожу': 'to come; to arrive',
  'причёсываюсь': 'to comb one\'s hair',
  'расскажу': 'to tell; to narrate',
  'стою': 'to stand',
  'удивляюсь': 'to be surprised',
  'умываюсь': 'to wash one\'s face',
  'хожу': 'to walk; to go regularly',
  'закончу': 'to finish',
  'приезжаем': 'to arrive',
  'проходим': 'to pass through; to go through',
  'разговариваем': 'to talk; to converse',
  'сидим': 'to sit',
  'справимся': 'to cope; to manage',
  'справляемся': 'to cope; to manage',
  'опаздываем': 'to be late',
  'обедаем': 'to have lunch',
  'уезжаем': 'to leave; to depart',

  // Truncated "it's..." entries
  'душно': 'stuffy; muggy',
  'жаль': 'it\'s a pity; too bad',
  'нелегко': 'not easy; difficult',
  'обидно': 'offensive; hurtful',
  'понятно': 'clear; understandable',
  'пора': 'it\'s time',
  'ясно': 'clear; obviously',

  // Truncated other entries
  'вчерашней': 'yesterday\'s',
  'горы': 'mountains',
  'гуляем': 'to walk; to stroll',
  'детская': 'children\'s; nursery',
  'детской': 'children\'s',
  'детскую': 'children\'s',
  'новогоднюю': 'New Year\'s',
  'называется': 'to be called',
  'надо': 'need to; must',
  'нигде': 'nowhere',
  'остаёмся': 'to stay; to remain',
  'поэтому': 'therefore; that\'s why',
  'рада': 'glad; happy',
  'учителя': 'teacher; teachers',
  'читательский': 'reading (adj.); reader\'s',
  'завтрашнее': 'tomorrow\'s',
  'завтрашней': 'tomorrow\'s',
  'завтрашнему': 'tomorrow\'s',

  // Possessive forms
  'своего': 'one\'s own',
  'своей': 'one\'s own',
  'свои': 'one\'s own',
  'своим': 'one\'s own',
  'своих': 'one\'s own',
  'свой': 'one\'s own',
  'свою': 'one\'s own',
  'своя': 'one\'s own',

  // Past tense verbs → infinitive form
  'бежал': 'to run',
  'вёл': 'to lead; to drive',
  'видела': 'to see',
  'говорили': 'to speak; to say',
  'дала': 'to give',
  'ездил': 'to drive; to travel',
  'ездила': 'to drive; to travel',
  'ездили': 'to drive; to travel',
  'забывал': 'to forget',
  'забывала': 'to forget',
  'забывали': 'to forget',
  'поел': 'to eat',
  'поспал': 'to sleep; to nap',
  'сказали': 'to say; to tell',
  'считала': 'to count; to consider',
  'отправлено': 'sent; dispatched',
  'сделали': 'to do; to make',
  'сделать': 'to do; to make',
  'положил': 'to put; to place',
  'положила': 'to put; to place',
  'поставил': 'to put; to place',
  'поставила': 'to put; to place',
  'поставьте': 'to put; to place (imperative)',
  'ставить': 'to put; to place',

  // Short/function words
  'делать': 'to do; to make',
  'делают': 'to do; to make',
  'идти': 'to go; to walk',
  'поехать': 'to go (by vehicle)',
  'ко': 'to; towards',
  'телевизору': 'TV; television',

  // Function words that shouldn't have been changed
  'если': 'if',
  'или': 'or',
  'мне': 'to me',
  'моё': 'my; mine',
  'мой': 'my; mine',
  'мы': 'we',
  'нам': 'to us',
  'нами': 'with us',
  'нас': 'us',
  'нет': 'no; not',
  'нигде': 'nowhere',
  'он': 'he',
  'она': 'she',
  'они': 'they',
  'оно': 'it',
  'тебе': 'to you',
};

let fixCount = 0;
for (const entry of broken) {
  const key = entry.key;
  let newEn = manual[key];

  if (!newEn) {
    console.log(`  No manual fix for: ${key} ("${entry.en}")`);
    continue;
  }

  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const lineRe = new RegExp(`(\\s*'${escaped}':\\s*\\{\\s*en:\\s*')([^']*)(')`, '');
  const escapedVal = newEn.replace(/'/g, "\\'");

  if (content.match(lineRe)) {
    content = content.replace(lineRe, `$1${escapedVal}$3`);
    fixCount++;
  }
}

fs.writeFileSync(DICT_PATH, content);
console.log(`\nFixed ${fixCount} broken entries`);
