#!/usr/bin/env node
/**
 * Rebuild French dictionary using Google Translate as PRIMARY source.
 * Hand-verified function words (~120) are never sent to Google.
 * Pipeline: function table → Google Translate → post-process → lemma copy → apply to fr.ts
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { postProcess, PostProcessStats } = require('./post-process-google.cjs');

const ROOT = path.resolve(__dirname, '..');
const DICT_PATH = path.join(ROOT, 'src/data/dictionary/fr.ts');
const DECK_PATH = path.join(ROOT, 'src/data/french/deck.json');
const OUT_DIR = path.join(ROOT, 'scripts/output');
const API_KEY = 'AIzaSyBImkCNYcI1m9mloUNcYcDN2L5dQZwADzI';

// ── Step 1: Hand-verified French function words (~120) ──────
const FUNCTION_WORDS = {
  // Articles
  'le': 'the (m.)', 'la': 'the (f.)', 'les': 'the (pl.)',
  'un': 'a, one (m.)', 'une': 'a, one (f.)', 'des': 'some, of the',
  'du': 'of the, some (m.)', 'de': 'of, from', "d": 'of, from',
  "l": 'the', 'au': 'to the, at the (m.)', 'aux': 'to the, at the (pl.)',

  // Pronouns
  'je': 'I', 'tu': 'you (informal)', 'il': 'he, it',
  'elle': 'she, it', 'on': 'one, we (informal)',
  'nous': 'we, us', 'vous': 'you (formal/pl.)', 'ils': 'they (m.)',
  'elles': 'they (f.)', 'me': 'me, myself', 'te': 'you, yourself',
  'se': 'oneself', 'lui': 'him, to him/her', 'leur': 'their, to them',
  'moi': 'me', 'toi': 'you', 'soi': 'oneself',
  'en': 'of it, some', 'y': 'there, to it',
  'ce': 'this, it', 'ça': 'that, it', 'cela': 'that',
  'qui': 'who, which', 'que': 'that, which, what',
  'quoi': 'what', 'où': 'where', 'dont': 'of which, whose',
  'lequel': 'which one',

  // Prepositions
  'à': 'to, at', 'dans': 'in, inside', 'sur': 'on, upon',
  'sous': 'under', 'avec': 'with', 'sans': 'without',
  'pour': 'for', 'par': 'by, through', 'vers': 'towards',
  'chez': 'at the home of', 'entre': 'between',
  'contre': 'against', 'pendant': 'during',
  'depuis': 'since, for', 'jusqu': 'until',

  // Conjunctions
  'et': 'and', 'ou': 'or', 'mais': 'but', 'car': 'because, for',
  'donc': 'so, therefore', 'ni': 'neither, nor',
  'si': 'if, so', 'quand': 'when', 'comme': 'like, as',
  'parce': 'because', 'puisque': 'since, because',
  'lorsque': 'when',

  // Adverbs
  'très': 'very', 'aussi': 'also, too', 'bien': 'well, good',
  'mal': 'badly, bad', 'plus': 'more, no longer',
  'moins': 'less, fewer', 'trop': 'too much',
  'assez': 'enough, rather', 'encore': 'still, again',
  'toujours': 'always, still', 'jamais': 'never, ever',
  'souvent': 'often', 'déjà': 'already',
  'ici': 'here', 'là': 'there',
  "aujourd'hui": 'today', 'hier': 'yesterday',
  'demain': 'tomorrow', 'maintenant': 'now',

  // Auxiliaries – être
  'suis': 'am', 'es': 'are (informal)', 'est': 'is',
  'sommes': 'are (we)', 'êtes': 'are (you)', 'sont': 'are (they)',
  'étais': 'was (I/you)', 'était': 'was (he/she)',
  'étaient': 'were (they)',
  'serai': 'will be (I)', 'sera': 'will be (he/she)',
  'seront': 'will be (they)',

  // Auxiliaries – avoir
  'ai': 'have (I)', 'as': 'have (you)', 'a': 'has',
  'avons': 'have (we)', 'avez': 'have (you pl.)', 'ont': 'have (they)',
  'avais': 'had (I/you)', 'avait': 'had (he/she)',
  'avaient': 'had (they)',
  'aurai': 'will have (I)', 'aura': 'will have (he/she)',
  'auront': 'will have (they)',

  // Common verb forms – faire
  'fais': 'do, make (I/you)', 'fait': 'does, makes',
  'faisons': 'do, make (we)', 'faites': 'do, make (you pl.)',
  'font': 'do, make (they)',

  // Common verb forms – aller
  'vais': 'go (I)', 'vas': 'go (you)', 'va': 'goes',
  'allons': 'go (we)', 'allez': 'go (you pl.)', 'vont': 'go (they)',

  // Common verb forms – pouvoir
  'peux': 'can (I/you)', 'peut': 'can (he/she)',
  'pouvons': 'can (we)', 'peuvent': 'can (they)',

  // Common verb forms – devoir
  'dois': 'must (I/you)', 'doit': 'must (he/she)',
  'devons': 'must (we)', 'doivent': 'must (they)',

  // Common verb forms – vouloir
  'veux': 'want (I/you)', 'veut': 'wants',
  'voulons': 'want (we)', 'veulent': 'want (they)',

  // Common verb forms – savoir
  'sais': 'know (I/you)', 'sait': 'knows',
  'savons': 'know (we)', 'savent': 'know (they)',
};

// ── Parse dictionary from .ts file ───────────────────────────
function parseDictionary() {
  const src = fs.readFileSync(DICT_PATH, 'utf8');
  const entries = {};

  // Match each entry: 'key': { ... } or "key": { ... }
  const entryRe = /^\s*'([^']+)':\s*\{([^}]+)\}/gm;
  const entryRe2 = /^\s*"([^"]+)":\s*\{([^}]+)\}/gm;

  function parseBody(body) {
    const obj = {};
    const enM = body.match(/en:\s*'([^']*)'/);
    if (enM) obj.en = enM[1];
    else {
      const enM2 = body.match(/en:\s*"([^"]*)"/);
      if (enM2) obj.en = enM2[1];
    }
    const ipaM = body.match(/ipa:\s*'([^']*)'/);
    if (ipaM) obj.ipa = ipaM[1];
    else {
      const ipaM2 = body.match(/ipa:\s*"([^"]*)"/);
      if (ipaM2) obj.ipa = ipaM2[1];
    }
    const posM = body.match(/pos:\s*'([^']*)'/);
    if (posM) obj.pos = posM[1];
    else {
      const posM2 = body.match(/pos:\s*"([^"]*)"/);
      if (posM2) obj.pos = posM2[1];
    }
    const lemmaM = body.match(/lemma:\s*'([^']*)'/);
    if (lemmaM) obj.lemma = lemmaM[1];
    else {
      const lemmaM2 = body.match(/lemma:\s*"([^"]*)"/);
      if (lemmaM2) obj.lemma = lemmaM2[1];
    }
    return obj;
  }

  let m;
  while ((m = entryRe.exec(src)) !== null) {
    entries[m[1]] = parseBody(m[2]);
  }
  while ((m = entryRe2.exec(src)) !== null) {
    entries[m[1]] = parseBody(m[2]);
  }

  return entries;
}

// ── Load deck ────────────────────────────────────────────────
function loadDeck() {
  return JSON.parse(fs.readFileSync(DECK_PATH, 'utf8'));
}

// ── Google Translate batch ───────────────────────────────────
function googleTranslateBatch(words) {
  return new Promise((resolve, reject) => {
    const qParams = words.map(w => `q=${encodeURIComponent(w)}`).join('&');
    const url = `https://translation.googleapis.com/language/translate/v2?key=${API_KEY}&source=fr&target=en&${qParams}`;

    https.get(url, { timeout: 30000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error) {
            reject(new Error(`Google API error: ${json.error.message}`));
            return;
          }
          const translations = json.data.translations.map(t => t.translatedText);
          resolve(translations);
        } catch (e) {
          reject(new Error(`Parse error: ${e.message}\nBody: ${data.slice(0, 500)}`));
        }
      });
      res.on('error', reject);
    }).on('error', reject);
  });
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ── Validation: check translation against card English ──────
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from',
  'is', 'are', 'was', 'were', 'am', 'be', 'been', 'being',
  'has', 'have', 'had', 'do', 'does', 'did',
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
  'my', 'your', 'his', 'her', 'its', 'our', 'their',
  'this', 'that', 'these', 'those',
  'and', 'or', 'but', 'not', 'no', 'yes',
  'if', 'then', 'so', 'as', 'than', 'very', 'too', 'also',
  'will', 'would', 'can', 'could', 'should', 'may', 'might', 'shall',
  'up', 'out', 'about', 'into', 'over', 'after', 'before',
]);

function extractContentWords(text) {
  return text.toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));
}

function buildWordToCardsIndex(deck) {
  const index = {};
  for (const card of deck) {
    const frenchWords = card.target.replace(/[.,?!;:'"()«»\-]/g, ' ').split(/\s+/).filter(w => w.length > 0);
    for (const w of frenchWords) {
      const lower = w.toLowerCase();
      if (!index[lower]) index[lower] = [];
      index[lower].push(card);
    }
  }
  return index;
}

function validateEntry(newEn, frenchWord, wordCardsIndex) {
  const cards = wordCardsIndex[frenchWord.toLowerCase()] || [];
  if (cards.length < 2) return false;

  const contentWords = extractContentWords(newEn);
  if (contentWords.length === 0) return false;

  for (const cw of contentWords) {
    let matchCount = 0;
    for (const card of cards) {
      const cardWords = card.english.toLowerCase().split(/\s+/);
      if (cardWords.some(w => w.replace(/[^a-z]/g, '').includes(cw) || cw.includes(w.replace(/[^a-z]/g, '')))) {
        matchCount++;
        if (matchCount >= 2) break;
      }
    }
    if (matchCount >= 2) return true;
  }
  return false;
}

// ── Generate .ts output ─────────────────────────────────────
function generateTsOutput(results) {
  // Read the original file to preserve the header (interface, lookup function, reverseVerb)
  const originalSrc = fs.readFileSync(DICT_PATH, 'utf8');

  // Find where dictionary entries start
  const dictStart = originalSrc.indexOf("export const dictionary: Record<string, DictEntry> = {");
  if (dictStart === -1) {
    throw new Error('Could not find dictionary export in fr.ts');
  }

  const header = originalSrc.slice(0, dictStart);

  // Sort results by word
  const sorted = [...results].sort((a, b) => a.word.localeCompare(b.word, 'fr'));

  let dictLines = 'export const dictionary: Record<string, DictEntry> = {\n';

  for (const r of sorted) {
    // Decide quoting: use double quotes if word contains apostrophe
    const needsDoubleQuote = r.word.includes("'");
    const keyQuote = needsDoubleQuote ? '"' : "'";

    // Escape the en value for single quotes
    const enEscaped = r.new_en.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const ipaEscaped = (r.ipa || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");

    let line = `  ${keyQuote}${r.word}${keyQuote}: { en: '${enEscaped}', ipa: '${ipaEscaped}'`;
    if (r.pos) line += `, pos: '${r.pos}'`;
    if (r.lemma) {
      const lemmaEscaped = r.lemma.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
      line += `, lemma: '${lemmaEscaped}'`;
    }
    line += ' },';
    dictLines += line + '\n';
  }

  dictLines += '};\n';

  return header + dictLines;
}

// ── Main ─────────────────────────────────────────────────────
async function main() {
  console.log('Parsing French dictionary...');
  const dict = parseDictionary();
  const allKeys = Object.keys(dict);
  console.log(`  ${allKeys.length} entries found`);

  console.log('Loading deck...');
  const deck = loadDeck();
  console.log(`  ${deck.length} cards`);

  const wordCardsIndex = buildWordToCardsIndex(deck);

  // Separate function words from Google words
  const functionWordKeys = [];
  const googleWordKeys = [];

  for (const key of allKeys) {
    if (FUNCTION_WORDS[key] !== undefined) {
      functionWordKeys.push(key);
    } else {
      googleWordKeys.push(key);
    }
  }

  console.log(`  ${functionWordKeys.length} function word entries (hand-verified)`);
  console.log(`  ${googleWordKeys.length} entries to send to Google Translate`);

  // Step 1: Process function words
  const results = [];
  for (const key of functionWordKeys) {
    const entry = dict[key];
    results.push({
      word: key,
      old_en: entry.en || '?',
      new_en: FUNCTION_WORDS[key],
      source: 'function_table',
      validated: true,
      pos: entry.pos || '',
      ipa: entry.ipa || '',
      lemma: entry.lemma || undefined,
    });
  }

  // Step 2: Google Translate in batches
  const BATCH_SIZE = 80;
  const DELAY = 200;
  const googleResults = {};

  console.log(`\nSending ${googleWordKeys.length} words to Google Translate in batches of ${BATCH_SIZE}...`);

  for (let i = 0; i < googleWordKeys.length; i += BATCH_SIZE) {
    const batch = googleWordKeys.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(googleWordKeys.length / BATCH_SIZE);

    process.stdout.write(`  Batch ${batchNum}/${totalBatches} (${batch.length} words)...`);

    try {
      const translations = await googleTranslateBatch(batch);
      for (let j = 0; j < batch.length; j++) {
        googleResults[batch[j]] = translations[j];
      }
      console.log(' done');
    } catch (err) {
      console.log(` ERROR: ${err.message}`);
      for (const w of batch) {
        googleResults[w] = null;
      }
    }

    if (i + BATCH_SIZE < googleWordKeys.length) {
      await sleep(DELAY);
    }
  }

  // Step 3: Post-process Google results using shared post-processor
  console.log('\nPost-processing Google results...');
  const ppStats = new PostProcessStats();

  const googleProcessed = {};
  for (const key of googleWordKeys) {
    const entry = dict[key];
    const rawTranslation = googleResults[key];

    if (rawTranslation === null || rawTranslation === undefined) {
      googleProcessed[key] = { text: entry.en || '?', failed: true };
      continue;
    }

    const result = postProcess(rawTranslation, entry.pos || '', key, ppStats);
    googleProcessed[key] = { text: result.text, flagged: result.flagged, flagReasons: result.flagReasons };
  }

  // Step 4: Lemma copy – collect base translations, then copy to inflected forms
  console.log('Applying lemma copy...');
  const lemmaTranslations = {};
  let lemmaCopyCount = 0;

  // First pass: collect translations for base forms (no lemma field)
  for (const key of googleWordKeys) {
    if (!dict[key].lemma) {
      lemmaTranslations[key] = googleProcessed[key].text;
    }
  }
  // Also add function words as potential lemma bases
  for (const key of functionWordKeys) {
    lemmaTranslations[key] = FUNCTION_WORDS[key];
  }

  // Build results for Google words
  for (const key of googleWordKeys) {
    const entry = dict[key];
    const processed = googleProcessed[key];

    let newEn = processed.text;
    let source = processed.failed ? 'google_failed' : 'google';

    // If entry has a lemma and we have a translation for it, copy it
    if (entry.lemma && lemmaTranslations[entry.lemma]) {
      newEn = lemmaTranslations[entry.lemma];
      source = 'lemma_copy';
      lemmaCopyCount++;
    }

    const validated = validateEntry(newEn, key, wordCardsIndex);

    results.push({
      word: key,
      old_en: entry.en || '?',
      new_en: newEn,
      source,
      validated,
      pos: entry.pos || '',
      ipa: entry.ipa || '',
      lemma: entry.lemma || undefined,
    });
  }

  console.log(`  Lemma copies applied: ${lemmaCopyCount}`);

  // ── Stats ──────────────────────────────────────────────────
  const sourceBreakdown = {};
  let validatedCount = 0;
  let changedCount = 0;
  let questionMarkFixed = 0;

  for (const r of results) {
    sourceBreakdown[r.source] = (sourceBreakdown[r.source] || 0) + 1;
    if (r.validated) validatedCount++;
    if (r.old_en !== r.new_en) changedCount++;
    if (r.old_en === '?' && r.new_en !== '?') questionMarkFixed++;
  }

  // ── Write JSON output ─────────────────────────────────────
  console.log('\nWriting output files...');

  const jsonPath = path.join(OUT_DIR, 'fr-google-rebuild.json');
  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));
  console.log(`  ${jsonPath}`);

  // ── Write preview MD ──────────────────────────────────────
  const shuffled = [...results].sort(() => Math.random() - 0.5);
  const sample = shuffled.slice(0, 200);

  let md = `# French Dictionary Google Rebuild – Preview (200 random samples)\n\n`;
  md += `**Date:** ${new Date().toISOString().split('T')[0]}\n`;
  md += `**Total entries:** ${results.length}\n`;
  md += `**Changed:** ${changedCount}\n`;
  md += `**Question marks fixed:** ${questionMarkFixed}\n`;
  md += `**Source breakdown:**\n`;
  for (const [src, count] of Object.entries(sourceBreakdown).sort((a, b) => b[1] - a[1])) {
    md += `- ${src}: ${count}\n`;
  }
  md += `**Validated:** ${validatedCount} / ${results.length} (${(100 * validatedCount / results.length).toFixed(1)}%)\n\n`;

  md += `| # | Word | Old EN | New EN | Source | Valid |\n`;
  md += `|---|------|--------|--------|--------|-------|\n`;
  sample.forEach((r, i) => {
    const oldE = r.old_en.replace(/\|/g, '\\|');
    const newE = r.new_en.replace(/\|/g, '\\|');
    md += `| ${i + 1} | ${r.word} | ${oldE} | ${newE} | ${r.source} | ${r.validated ? 'Y' : 'N'} |\n`;
  });

  const mdPath = path.join(OUT_DIR, 'fr-google-rebuild-preview.md');
  fs.writeFileSync(mdPath, md);
  console.log(`  ${mdPath}`);

  // ── Apply to fr.ts ────────────────────────────────────────
  console.log('\nGenerating new fr.ts...');
  const newTs = generateTsOutput(results);
  fs.writeFileSync(DICT_PATH, newTs);
  console.log(`  Written to ${DICT_PATH}`);

  // ── Post-processing report ────────────────────────────────
  console.log('\n' + ppStats.report());

  // ── Print summary ─────────────────────────────────────────
  console.log('\n=== SUMMARY ===');
  console.log(`Total entries: ${results.length}`);
  console.log(`Changed: ${changedCount}`);
  console.log(`Question marks fixed: ${questionMarkFixed}`);
  console.log('Source breakdown:');
  for (const [src, count] of Object.entries(sourceBreakdown).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${src}: ${count}`);
  }
  console.log(`Validated: ${validatedCount} / ${results.length} (${(100 * validatedCount / results.length).toFixed(1)}%)`);
  console.log(`Lemma copies: ${lemmaCopyCount}`);

  // ── Print 50 samples to stdout ────────────────────────────
  console.log('\n=== 50 RANDOM SAMPLES ===');
  const samples50 = [...results].sort(() => Math.random() - 0.5).slice(0, 50);
  console.log('Word | Old EN | New EN | Source');
  console.log('-----|--------|--------|-------');
  for (const r of samples50) {
    console.log(`${r.word} | ${r.old_en} | ${r.new_en} | ${r.source}`);
  }
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
