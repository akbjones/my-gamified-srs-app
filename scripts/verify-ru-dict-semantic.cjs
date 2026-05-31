#!/usr/bin/env node
/**
 * Semantic verification of Russian dictionary via Google Translate API.
 * 1. Parse all entries from ru.ts
 * 2. Skip function words
 * 3. Translate via Google (ru→en) in batches of 80
 * 4. Compare — zero match → replace
 * 5. Filter garbage Google results
 * 6. Apply fixes to ru.ts, preserving IPA/POS/lemma
 * 7. Verify TypeScript
 */

const fs = require('fs');
const path = require('path');

const API_KEY = 'AIzaSyBImkCNYcI1m9mloUNcYcDN2L5dQZwADzI';
const DICT_PATH = path.join(__dirname, '..', 'src', 'data', 'dictionary', 'ru.ts');
const BATCH_SIZE = 80;

// ── Function words to skip ──
const FUNCTION_WORDS = new Set([
  'а', 'без', 'более', 'больше', 'будет', 'будто', 'бы', 'был', 'была', 'были', 'было',
  'быть', 'в', 'вам', 'вами', 'вас', 'ваш', 'ваша', 'ваше', 'ваши', 'вашим', 'вашу',
  'ведь', 'весь', 'вместе', 'во', 'вот', 'все', 'всё', 'всего', 'всей', 'всем', 'всех',
  'вся', 'всю', 'вы', 'где', 'да', 'даже', 'два', 'для', 'до', 'другой', 'его', 'ее', 'её',
  'ей', 'если', 'ему', 'есть', 'ещё', 'еще', 'же', 'за', 'и', 'из', 'или', 'им', 'ими',
  'иногда', 'их', 'к', 'ка', 'кажется', 'как', 'какая', 'какие', 'каким', 'каких',
  'какой', 'какую', 'когда', 'кого', 'кому', 'кот', 'которая', 'которого', 'которое',
  'которой', 'котором', 'которому', 'которую', 'которые', 'которых', 'который', 'которым',
  'кто', 'куда', 'ли', 'либо', 'меня', 'между', 'мне', 'мной', 'мною', 'мог', 'могу',
  'мое', 'моё', 'моего', 'моей', 'можем', 'может', 'можете', 'можешь', 'можно', 'мои',
  'моим', 'моих', 'мой', 'мою', 'моя', 'мы', 'на', 'нам', 'нами', 'нас', 'наш', 'наша',
  'наше', 'нашего', 'нашей', 'нашем', 'наши', 'нашим', 'наших', 'нашу', 'не', 'него',
  'нее', 'неё', 'ней', 'нельзя', 'нём', 'нему', 'нет', 'ни', 'нибудь', 'никогда',
  'никто', 'ним', 'ними', 'них', 'но', 'ну', 'о', 'об', 'один', 'одна', 'одни', 'одним',
  'одно', 'одного', 'одной', 'одном', 'одну', 'он', 'она', 'они', 'оно', 'от', 'очень',
  'по', 'под', 'после', 'потом', 'потому', 'почему', 'почти', 'при', 'про', 'с', 'сам',
  'сама', 'сами', 'само', 'свое', 'своего', 'своей', 'своём', 'свои', 'своим', 'своих',
  'свой', 'свою', 'своя', 'себе', 'себя', 'сейчас', 'собой', 'собою', 'та', 'так',
  'такая', 'также', 'такие', 'таким', 'таких', 'такого', 'такое', 'такой', 'таком',
  'такому', 'такую', 'там', 'те', 'тебе', 'тебя', 'тем', 'теми', 'тех', 'то', 'тобой',
  'тобою', 'тогда', 'того', 'тоже', 'только', 'том', 'тому', 'тот', 'ту', 'тут', 'ты',
  'у', 'уж', 'уже', 'чего', 'чем', 'чему', 'через', 'что', 'чтобы', 'чья', 'чьё',
  'чьи', 'чьим', 'эта', 'эти', 'этим', 'этих', 'это', 'этого', 'этой', 'этом', 'этому',
  'этот', 'эту', 'я',
  // Extra forms
  'буду', 'будем', 'будете', 'будешь', 'будут', 'будь', 'будьте', 'будучи',
  'надо', 'нужен', 'нужна', 'нужно', 'нужны',
  'вдруг', 'вон', 'всегда', 'давай', 'давайте', 'зачем', 'здесь', 'именно',
  'лишь', 'нигде', 'ничего', 'ничто', 'опять', 'разве', 'сюда', 'туда',
  'хоть', 'хотя', 'чей',
]);

// ── Proper nouns / names to skip ──
const NAMES = new Set([
  'анна', 'антон', 'борис', 'вадим', 'валентин', 'валентина', 'василий',
  'виктор', 'виктория', 'владимир', 'дарья', 'дима', 'дмитрий', 'евгений',
  'екатерина', 'елена', 'иван', 'игорь', 'ирина', 'катя', 'константин',
  'лена', 'максим', 'марина', 'мария', 'маша', 'михаил', 'наталья',
  'николай', 'нина', 'оксана', 'олег', 'ольга', 'павел', 'пётр', 'петр',
  'саша', 'светлана', 'сергей', 'татьяна', 'юлия', 'юрий',
  // Place names
  'байкал', 'москва', 'москве', 'москвы', 'петербург', 'петербурге', 'россия',
  'россию', 'россии', 'сибири', 'сибирь', 'кремль', 'кремля',
]);

// ── Parse dictionary ──
function parseDictionary(content) {
  const entries = [];
  // Match lines like:  'ключ': { en: 'value', ...
  const re = /^\s*'([^']+)':\s*\{([^}]+)\}/gm;
  let m;
  while ((m = re.exec(content)) !== null) {
    const key = m[1];
    const body = m[2];
    const enMatch = body.match(/en:\s*'([^']*)'/);
    const ipaMatch = body.match(/ipa:\s*'([^']*)'/);
    const posMatch = body.match(/pos:\s*'([^']*)'/);
    const lemmaMatch = body.match(/lemma:\s*'([^']*)'/);
    if (enMatch) {
      entries.push({
        key,
        en: enMatch[1],
        ipa: ipaMatch ? ipaMatch[1] : '',
        pos: posMatch ? posMatch[1] : '',
        lemma: lemmaMatch ? lemmaMatch[1] : null,
      });
    }
  }
  return entries;
}

// ── Normalize for comparison ──
function normalize(s) {
  return s.toLowerCase()
    .replace(/^to\s+/, '')
    .replace(/[;,]/g, ' ')
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/[''""!?.]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function getWords(s) {
  return normalize(s).split(/\s+/).filter(w => w.length > 0);
}

// ── Check if any meaningful word overlaps ──
function hasSemanticOverlap(existing, google) {
  const existingWords = new Set(getWords(existing));
  const googleWords = getWords(google);

  // Trivial words to ignore in comparison
  const trivial = new Set(['the', 'a', 'an', 'to', 'is', 'are', 'am', 'was', 'were',
    'be', 'been', 'being', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
    'my', 'your', 'his', 'her', 'its', 'our', 'their', 'me', 'him', 'us', 'them',
    'in', 'on', 'at', 'of', 'for', 'with', 'by', 'from', 'up', 'about', 'into',
    'not', 'no', 'and', 'or', 'but', 'if', 'than', 'that', 'this', 'these', 'those',
    'do', 'does', 'did', 'will', 'would', 'could', 'should', 'can', 'may', 'might',
    'have', 'has', 'had', 'very', 'more', 'most', 'some', 'any', 'each', 'every',
    'what', 'which', 'who', 'whom', 'whose', 'where', 'when', 'how', 'why',
    'all', 'both', 'few', 'many', 'much', 'other', 'another', 'such', 'own']);

  for (const gw of googleWords) {
    if (trivial.has(gw)) continue;
    if (existingWords.has(gw)) return true;

    // Stem-like matching: check if 4+ char prefix matches
    if (gw.length >= 4) {
      const prefix = gw.substring(0, Math.max(4, Math.floor(gw.length * 0.7)));
      for (const ew of existingWords) {
        if (ew.length >= 4 && ew.startsWith(prefix)) return true;
        if (gw.startsWith(ew.substring(0, Math.max(4, Math.floor(ew.length * 0.7))))) return true;
      }
    }
  }

  // Also check existing words against google set
  const googleSet = new Set(googleWords);
  for (const ew of existingWords) {
    if (trivial.has(ew)) continue;
    if (googleSet.has(ew)) return true;
  }

  return false;
}

// ── Google Translate batch ──
async function translateBatch(words) {
  const url = new URL('https://translation.googleapis.com/language/translate/v2');
  url.searchParams.set('key', API_KEY);

  const body = {
    q: words,
    source: 'ru',
    target: 'en',
    format: 'text',
  };

  const resp = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Google Translate API error ${resp.status}: ${text}`);
  }

  const data = await resp.json();
  return data.data.translations.map(t => t.translatedText);
}

// ── Garbage filter ──
function isGarbageTranslation(russian, google) {
  const g = google.toLowerCase().trim();
  // If Google just returned the Russian word back
  if (g === russian.toLowerCase()) return true;
  // If translation is empty
  if (g.length === 0) return true;
  // If it's mostly non-Latin characters (transliteration fail)
  const latinChars = (g.match(/[a-z]/gi) || []).length;
  if (latinChars < g.replace(/\s/g, '').length * 0.5) return true;
  return false;
}

// ── Format translation for dictionary ──
function formatTranslation(google, pos) {
  let t = google.toLowerCase().trim();
  // Remove articles
  t = t.replace(/^(the|a|an)\s+/i, '');
  // Add 'to ' for verbs
  if (pos === 'v' && !t.startsWith('to ')) {
    t = 'to ' + t;
  }
  return t;
}

// ── Main ──
async function main() {
  console.log('Reading ru.ts...');
  const content = fs.readFileSync(DICT_PATH, 'utf-8');
  const entries = parseDictionary(content);
  console.log(`Parsed ${entries.length} dictionary entries`);

  // Filter to content words only
  const toCheck = entries.filter(e => {
    const k = e.key.toLowerCase();
    if (FUNCTION_WORDS.has(k)) return false;
    if (NAMES.has(k)) return false;
    return true;
  });
  console.log(`Content words to verify: ${toCheck.length} (skipped ${entries.length - toCheck.length} function/name words)`);

  // Batch translate
  const allTranslations = new Map();
  const batches = [];
  for (let i = 0; i < toCheck.length; i += BATCH_SIZE) {
    batches.push(toCheck.slice(i, i + BATCH_SIZE));
  }
  console.log(`Processing ${batches.length} batches of ${BATCH_SIZE}...`);

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const words = batch.map(e => e.key);
    try {
      const translations = await translateBatch(words);
      for (let j = 0; j < batch.length; j++) {
        allTranslations.set(batch[j].key, translations[j]);
      }
      if ((i + 1) % 10 === 0 || i === batches.length - 1) {
        console.log(`  Batch ${i + 1}/${batches.length} done`);
      }
    } catch (err) {
      console.error(`  Batch ${i + 1} failed: ${err.message}`);
      // Wait and retry once
      await new Promise(r => setTimeout(r, 2000));
      try {
        const translations = await translateBatch(words);
        for (let j = 0; j < batch.length; j++) {
          allTranslations.set(batch[j].key, translations[j]);
        }
        console.log(`  Batch ${i + 1} retry succeeded`);
      } catch (err2) {
        console.error(`  Batch ${i + 1} retry failed: ${err2.message}`);
      }
    }
    // Small delay between batches
    if (i < batches.length - 1) {
      await new Promise(r => setTimeout(r, 100));
    }
  }

  console.log(`\nTranslated ${allTranslations.size} words. Comparing...`);

  // Compare and collect fixes
  const fixes = [];
  let matchCount = 0;
  let skipCount = 0;

  for (const entry of toCheck) {
    const google = allTranslations.get(entry.key);
    if (!google) {
      skipCount++;
      continue;
    }

    if (isGarbageTranslation(entry.key, google)) {
      skipCount++;
      continue;
    }

    if (hasSemanticOverlap(entry.en, google)) {
      matchCount++;
      continue;
    }

    // No overlap — this is a mismatch
    const newEn = formatTranslation(google, entry.pos);
    fixes.push({
      key: entry.key,
      oldEn: entry.en,
      newEn,
      google: google,
      ipa: entry.ipa,
      pos: entry.pos,
      lemma: entry.lemma,
    });
  }

  console.log(`\nResults:`);
  console.log(`  Semantic match: ${matchCount}`);
  console.log(`  Skipped (garbage/missing): ${skipCount}`);
  console.log(`  Mismatches to fix: ${fixes.length}`);

  if (fixes.length === 0) {
    console.log('\nNo fixes needed!');
    return;
  }

  // Show sample
  console.log(`\nSample mismatches (first 30):`);
  for (const f of fixes.slice(0, 30)) {
    console.log(`  ${f.key}: "${f.oldEn}" → "${f.newEn}"`);
  }

  // Apply fixes to ru.ts
  console.log(`\nApplying ${fixes.length} fixes to ru.ts...`);
  let modified = content;
  let appliedCount = 0;

  for (const fix of fixes) {
    // Build the old line pattern and new line
    const escapedKey = fix.key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Match the full entry line
    const lineRegex = new RegExp(
      `(\\s*'${escapedKey}':\\s*\\{\\s*en:\\s*')([^']*)(')`,
    );
    const match = modified.match(lineRegex);
    if (match) {
      const escapedNewEn = fix.newEn.replace(/'/g, "\\'");
      modified = modified.replace(lineRegex, `$1${escapedNewEn}$3`);
      appliedCount++;
    }
  }

  console.log(`Applied ${appliedCount} fixes`);

  // Write
  fs.writeFileSync(DICT_PATH, modified);
  console.log('Written to ru.ts');

  // Save fix log
  const logPath = path.join(__dirname, 'output', 'ru-semantic-fixes.json');
  fs.mkdirSync(path.dirname(logPath), { recursive: true });
  fs.writeFileSync(logPath, JSON.stringify(fixes, null, 2));
  console.log(`Fix log saved to ${logPath}`);

  console.log(`\nDone — ${appliedCount} fixes applied.`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
