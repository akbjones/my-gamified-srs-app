#!/usr/bin/env node
/**
 * Semantic verification of Russian dictionary via Google Translate API – v2.
 * Avoids apostrophe escaping issues by using line-based reconstruction.
 *
 * Steps:
 * 1. Parse ALL entries from ru.ts using a robust TS-aware parser
 * 2. Skip function words, names, short words
 * 3. Translate ALL remaining via Google (ru→en), batch 80
 * 4. Compare – zero content word match → flag for replacement
 * 5. Filter garbage Google results
 * 6. Apply to ru.ts by reconstructing lines – preserve IPA/POS/lemma exactly
 * 7. Verify TypeScript
 */

const fs = require('fs');
const path = require('path');

const API_KEY = process.env.GOOGLE_TTS_KEY;
const DICT_PATH = path.join(__dirname, '..', 'src', 'data', 'dictionary', 'ru.ts');
const BATCH_SIZE = 80;

// ── Function words & names to skip ──
const SKIP_WORDS = new Set([
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
  'буду', 'будем', 'будете', 'будешь', 'будут', 'будь', 'будьте', 'будучи',
  'надо', 'нужен', 'нужна', 'нужно', 'нужны',
  'вдруг', 'вон', 'всегда', 'давай', 'давайте', 'зачем', 'здесь', 'именно',
  'лишь', 'нигде', 'ничего', 'ничто', 'опять', 'разве', 'сюда', 'туда',
  'хоть', 'хотя', 'чей',
  // Names
  'анна', 'антон', 'борис', 'вадим', 'валентин', 'валентина', 'василий',
  'виктор', 'виктория', 'владимир', 'дарья', 'дима', 'дмитрий', 'евгений',
  'екатерина', 'елена', 'иван', 'игорь', 'ирина', 'катя', 'константин',
  'лена', 'максим', 'марина', 'мария', 'маша', 'михаил', 'наталья',
  'николай', 'нина', 'оксана', 'олег', 'ольга', 'павел', 'пётр', 'петр',
  'саша', 'светлана', 'сергей', 'татьяна', 'юлия', 'юрий',
  'байкал', 'москва', 'москве', 'москвы', 'петербург', 'петербурге', 'россия',
  'россию', 'россии', 'сибири', 'сибирь', 'кремль', 'кремля',
]);

// ── Robust TS-aware parser ──
// Parse entries properly handling escaped quotes in en values
function parseEntries(content) {
  const entries = new Map(); // key → { en, ipa, pos, lemma, lineIdx }
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Match the key
    const keyMatch = line.match(/^\s+'([^']+)':\s*\{/);
    if (!keyMatch) continue;

    const key = keyMatch[1];

    // Extract en value by finding en: ' and then scanning for unescaped closing '
    const enIdx = line.indexOf("en: '");
    if (enIdx === -1) continue;
    const enStart = enIdx + 5;
    let enEnd = enStart;
    while (enEnd < line.length) {
      if (line[enEnd] === "'" && line[enEnd - 1] !== '\\') break;
      enEnd++;
    }
    const en = line.substring(enStart, enEnd).replace(/\\'/g, "'");

    // Extract ipa
    const ipaIdx = line.indexOf("ipa: '", enEnd);
    let ipa = '';
    if (ipaIdx !== -1) {
      const ipaStart = ipaIdx + 6;
      let ipaEnd = ipaStart;
      while (ipaEnd < line.length && line[ipaEnd] !== "'") ipaEnd++;
      ipa = line.substring(ipaStart, ipaEnd);
    }

    // Extract pos
    const posIdx = line.indexOf("pos: '", enEnd);
    let pos = '';
    if (posIdx !== -1) {
      const posStart = posIdx + 6;
      let posEnd = posStart;
      while (posEnd < line.length && line[posEnd] !== "'") posEnd++;
      pos = line.substring(posStart, posEnd);
    }

    // Extract lemma
    const lemmaIdx = line.indexOf("lemma: '", enEnd);
    let lemma = null;
    if (lemmaIdx !== -1) {
      const lemmaStart = lemmaIdx + 8;
      let lemmaEnd = lemmaStart;
      while (lemmaEnd < line.length && line[lemmaEnd] !== "'") lemmaEnd++;
      lemma = line.substring(lemmaStart, lemmaEnd);
    }

    entries.set(key, { en, ipa, pos, lemma, lineIdx: i });
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

function hasSemanticOverlap(existing, google) {
  const trivial = new Set(['the', 'a', 'an', 'to', 'is', 'are', 'am', 'was', 'were',
    'be', 'been', 'being', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
    'my', 'your', 'his', 'her', 'its', 'our', 'their', 'me', 'him', 'us', 'them',
    'in', 'on', 'at', 'of', 'for', 'with', 'by', 'from', 'up', 'about', 'into',
    'not', 'no', 'and', 'or', 'but', 'if', 'than', 'that', 'this', 'these', 'those',
    'do', 'does', 'did', 'will', 'would', 'could', 'should', 'can', 'may', 'might',
    'have', 'has', 'had', 'very', 'more', 'most', 'some', 'any', 'each', 'every',
    'what', 'which', 'who', 'whom', 'whose', 'where', 'when', 'how', 'why',
    'all', 'both', 'few', 'many', 'much', 'other', 'another', 'such', 'own',
    'just', 'also', 'still', 'even', 'well', 'too', 'here', 'there', 'then',
    'now', 'back', 'out', 'so', 'like', 'over', 'only', 'down', 'off']);

  const existingWords = new Set(getWords(existing));
  const googleWords = getWords(google);

  for (const gw of googleWords) {
    if (trivial.has(gw)) continue;
    if (existingWords.has(gw)) return true;
    // Stem match
    if (gw.length >= 4) {
      const prefix = gw.substring(0, Math.max(4, Math.floor(gw.length * 0.7)));
      for (const ew of existingWords) {
        if (ew.length >= 4 && ew.startsWith(prefix)) return true;
        if (gw.startsWith(ew.substring(0, Math.max(4, Math.floor(ew.length * 0.7))))) return true;
      }
    }
  }

  const googleSet = new Set(googleWords);
  for (const ew of existingWords) {
    if (trivial.has(ew)) continue;
    if (googleSet.has(ew)) return true;
    if (ew.length >= 4) {
      const prefix = ew.substring(0, Math.max(4, Math.floor(ew.length * 0.7)));
      for (const gw of googleWords) {
        if (gw.length >= 4 && gw.startsWith(prefix)) return true;
      }
    }
  }

  return false;
}

// ── Google Translate batch ──
async function translateBatch(words) {
  const url = new URL('https://translation.googleapis.com/language/translate/v2');
  url.searchParams.set('key', API_KEY);

  const resp = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: words, source: 'ru', target: 'en', format: 'text' }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Google Translate API error ${resp.status}: ${text}`);
  }

  const data = await resp.json();
  return data.data.translations.map(t => t.translatedText);
}

function isGarbageTranslation(russian, google) {
  const g = google.toLowerCase().trim();
  if (g === russian.toLowerCase()) return true;
  if (g.length === 0) return true;
  const latinChars = (g.match(/[a-z]/gi) || []).length;
  if (latinChars < g.replace(/\s/g, '').length * 0.5) return true;
  return false;
}

function formatTranslation(google, pos) {
  let t = google.trim();
  // Decode HTML entities
  t = t.replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/&quot;/g, '"');
  // Lowercase
  t = t.toLowerCase();
  // Remove leading articles
  t = t.replace(/^(the|a|an)\s+/i, '');
  // Remove personal pronouns for verbs
  if (pos === 'v') {
    t = t.replace(/^(i |you |he |she |it |we |they |i'm |you're |he's |she's |it's |we're |they're |i'll |you'll |he'll |she'll |we'll |they'll |i've |you've |we've |they've |i'd |you'd |he'd |she'd |we'd |they'd )/i, '');
    if (!t.startsWith('to ')) {
      t = 'to ' + t;
    }
  }
  return t;
}

// ── Reconstruct a dictionary line ──
function buildLine(key, en, ipa, pos, lemma) {
  // Escape single quotes in en value
  const escapedEn = en.replace(/'/g, "\\'");
  let line = `  '${key}': { en: '${escapedEn}', ipa: '${ipa}', pos: '${pos}'`;
  if (lemma) {
    line += `, lemma: '${lemma}'`;
  }
  line += ' },';
  return line;
}

// ── Main ──
async function main() {
  console.log('Reading ru.ts...');
  const content = fs.readFileSync(DICT_PATH, 'utf-8');
  const entries = parseEntries(content);
  console.log(`Parsed ${entries.size} dictionary entries`);

  // Filter to content words
  const toCheck = [];
  for (const [key, entry] of entries) {
    if (!SKIP_WORDS.has(key.toLowerCase())) {
      toCheck.push({ key, ...entry });
    }
  }
  console.log(`Content words to verify: ${toCheck.length} (skipped ${entries.size - toCheck.length})`);

  // Batch translate
  const allTranslations = new Map();
  const batches = [];
  for (let i = 0; i < toCheck.length; i += BATCH_SIZE) {
    batches.push(toCheck.slice(i, i + BATCH_SIZE));
  }
  console.log(`Processing ${batches.length} batches...`);

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const words = batch.map(e => e.key);
    try {
      const translations = await translateBatch(words);
      for (let j = 0; j < batch.length; j++) {
        allTranslations.set(batch[j].key, translations[j]);
      }
    } catch (err) {
      console.error(`  Batch ${i + 1} failed: ${err.message}`);
      await new Promise(r => setTimeout(r, 2000));
      try {
        const translations = await translateBatch(words);
        for (let j = 0; j < batch.length; j++) {
          allTranslations.set(batch[j].key, translations[j]);
        }
      } catch (err2) {
        console.error(`  Batch ${i + 1} retry failed`);
      }
    }
    if ((i + 1) % 10 === 0 || i === batches.length - 1) {
      console.log(`  Batch ${i + 1}/${batches.length} done`);
    }
    if (i < batches.length - 1) await new Promise(r => setTimeout(r, 100));
  }

  console.log(`\nTranslated ${allTranslations.size} words. Comparing...`);

  // Compare and collect fixes
  const fixes = new Map(); // key → newEn
  let matchCount = 0, skipCount = 0;

  for (const entry of toCheck) {
    const google = allTranslations.get(entry.key);
    if (!google) { skipCount++; continue; }
    if (isGarbageTranslation(entry.key, google)) { skipCount++; continue; }

    if (hasSemanticOverlap(entry.en, google)) {
      matchCount++;
      continue;
    }

    // Mismatch – prepare replacement
    const newEn = formatTranslation(google, entry.pos);
    fixes.set(entry.key, newEn);
  }

  console.log(`\nResults:`);
  console.log(`  Semantic match: ${matchCount}`);
  console.log(`  Skipped: ${skipCount}`);
  console.log(`  Mismatches: ${fixes.size}`);

  // Show sample
  console.log(`\nSample mismatches (first 30):`);
  let count = 0;
  for (const [key, newEn] of fixes) {
    if (count++ >= 30) break;
    const entry = entries.get(key);
    console.log(`  ${key}: "${entry.en}" → "${newEn}"`);
  }

  if (fixes.size === 0) {
    console.log('\nNo fixes needed!');
    return;
  }

  // Apply fixes by reconstructing lines
  console.log(`\nApplying ${fixes.size} fixes...`);
  const lines = content.split('\n');
  let appliedCount = 0;

  for (const [key, newEn] of fixes) {
    const entry = entries.get(key);
    if (!entry) continue;

    const newLine = buildLine(key, newEn, entry.ipa, entry.pos, entry.lemma);
    lines[entry.lineIdx] = newLine;
    appliedCount++;
  }

  const result = lines.join('\n');
  fs.writeFileSync(DICT_PATH, result);
  console.log(`Applied ${appliedCount} fixes to ru.ts`);

  // Save log
  const log = [];
  for (const [key, newEn] of fixes) {
    const entry = entries.get(key);
    log.push({ key, oldEn: entry.en, newEn, google: allTranslations.get(key) });
  }
  const logPath = path.join(__dirname, 'output', 'ru-semantic-fixes-v2.json');
  fs.mkdirSync(path.dirname(logPath), { recursive: true });
  fs.writeFileSync(logPath, JSON.stringify(log, null, 2));
  console.log(`Log saved to ${logPath}`);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
