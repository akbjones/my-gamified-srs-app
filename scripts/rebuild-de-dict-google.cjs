#!/usr/bin/env node
/**
 * Rebuild German dictionary using Google Translate as PRIMARY source.
 * Same approach as Hindi: function word table + Google Translate + post-processing + lemma copy.
 *
 * Steps:
 *  1. ~120 hand-verified German function words
 *  2. Google Translate all other entries (batch 80, source=de)
 *  3. Post-process with 16-rule pipeline
 *  4. Lemma copy: entries with lemma field copy their base word's new definition
 *  5. Apply directly to dictionary file
 *  6. Force function table overrides last
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { postProcess, PostProcessStats } = require('./post-process-google.cjs');

const ROOT = path.resolve(__dirname, '..');
const DICT_PATH = path.join(ROOT, 'src/data/dictionary/de.ts');
const DECK_PATH = path.join(ROOT, 'src/data/german/deck.json');
const OUT_DIR = path.join(ROOT, 'scripts/output');
const API_KEY = 'AIzaSyBImkCNYcI1m9mloUNcYcDN2L5dQZwADzI';

// ── Step 1: Hand-verified German function words (~120) ──────

const FUNCTION_WORDS = {
  // Articles
  'der': 'the (m. nom.)', 'die': 'the (f./pl.)', 'das': 'the (n.)',
  'den': 'the (m. acc.)', 'dem': 'the (dat.)', 'des': 'the (gen.)',
  'ein': 'a, one', 'eine': 'a (f.)', 'einen': 'a (m. acc.)',
  'einem': 'a (dat.)', 'einer': 'a (f. dat./gen.)', 'eines': 'a (n. gen.)',

  // Personal pronouns
  'ich': 'I', 'du': 'you (informal)', 'er': 'he', 'sie': 'she, they, you (formal)',
  'es': 'it', 'wir': 'we', 'ihr': 'you (pl.)',

  // Accusative/dative pronouns
  'mich': 'me (acc.)', 'dich': 'you (acc.)', 'sich': 'oneself',
  'uns': 'us', 'euch': 'you (pl. acc./dat.)',
  'mir': 'me (dat.)', 'dir': 'you (dat.)',
  'ihm': 'him (dat.)', 'ihnen': 'them (dat.)',

  // Possessive pronouns
  'mein': 'my', 'meine': 'my (f./pl.)', 'meinen': 'my (acc.)',
  'meinem': 'my (dat.)', 'meiner': 'my (gen./dat. f.)', 'meines': 'my (gen. n.)',
  'dein': 'your (informal)', 'deine': 'your (f./pl.)', 'deinen': 'your (acc.)',
  'deinem': 'your (dat.)', 'deiner': 'your (gen.)',
  'sein': 'his, its; to be', 'seine': 'his (f./pl.)', 'seinem': 'his (dat.)',
  'seiner': 'his (gen.)', 'seinen': 'his (acc.)',
  'unser': 'our', 'unsere': 'our (f./pl.)', 'unserem': 'our (dat.)',
  'unserer': 'our (gen.)', 'unseren': 'our (acc.)',
  'euer': 'your (pl.)', 'eure': 'your (pl. f.)',

  // Interrogative pronouns
  'wer': 'who', 'was': 'what', 'wo': 'where', 'wann': 'when',
  'wie': 'how', 'warum': 'why', 'welche': 'which', 'welcher': 'which (m.)',
  'welches': 'which (n.)', 'welchem': 'which (dat.)', 'welchen': 'which (acc.)',

  // Relative/demonstrative
  'dieser': 'this (m.)', 'diese': 'this (f.), these', 'dieses': 'this (n.)',
  'diesem': 'this (dat.)', 'diesen': 'this (acc.)',
  'jener': 'that (m.)', 'jene': 'that (f.), those', 'jenes': 'that (n.)',

  // Prepositions
  'in': 'in, into', 'an': 'at, on', 'auf': 'on, onto', 'über': 'over, about',
  'unter': 'under, among', 'vor': 'before, in front of', 'hinter': 'behind',
  'neben': 'next to, beside', 'zwischen': 'between',
  'zu': 'to, at', 'nach': 'to, after', 'von': 'from, of', 'mit': 'with',
  'bei': 'at, near', 'aus': 'from, out of', 'für': 'for',
  'um': 'around, at', 'durch': 'through', 'gegen': 'against',
  'ohne': 'without', 'bis': 'until, to',

  // Conjunctions
  'und': 'and', 'oder': 'or', 'aber': 'but', 'denn': 'because, for',
  'weil': 'because', 'dass': 'that', 'wenn': 'if, when',
  'als': 'when, as, than', 'ob': 'whether', 'sondern': 'but rather',
  'doch': 'but, however, yet',

  // Common adverbs
  'sehr': 'very', 'auch': 'also, too', 'schon': 'already',
  'noch': 'still, yet', 'nicht': 'not', 'nie': 'never',
  'immer': 'always', 'oft': 'often', 'hier': 'here',
  'da': 'there, since', 'dort': 'there', 'heute': 'today',
  'morgen': 'tomorrow', 'gestern': 'yesterday', 'jetzt': 'now',
  'dann': 'then', 'gern': 'gladly, willingly', 'gerne': 'gladly',
  'mal': 'once, time', 'nur': 'only', 'so': 'so, thus',
  'ja': 'yes', 'nein': 'no', 'vielleicht': 'maybe, perhaps',
  'wirklich': 'really', 'eigentlich': 'actually',
  'ziemlich': 'quite, fairly', 'fast': 'almost',
  'wieder': 'again', 'zusammen': 'together',

  // Auxiliaries: sein
  'bin': 'am', 'bist': 'are (you)', 'ist': 'is',
  'sind': 'are', 'seid': 'are (you pl.)',
  'war': 'was', 'warst': 'were (you)', 'waren': 'were', 'wart': 'were (you pl.)',

  // Auxiliaries: haben
  'habe': 'have', 'hast': 'have (you)', 'hat': 'has',
  'haben': 'to have', 'habt': 'have (you pl.)',
  'hatte': 'had', 'hattest': 'had (you)', 'hatten': 'had (pl.)', 'hattet': 'had (you pl.)',

  // Auxiliaries: werden
  'werde': 'will, become', 'wirst': 'will (you)', 'wird': 'will, becomes',
  'werden': 'to become', 'werdet': 'will (you pl.)',
  'wurde': 'became', 'wurdest': 'became (you)', 'wurden': 'became (pl.)',

  // Modal verbs: können
  'kann': 'can', 'kannst': 'can (you)', 'können': 'to be able to', 'könnt': 'can (you pl.)',
  'konnte': 'could', 'konnten': 'could (pl.)',
  // Modal: müssen
  'muss': 'must', 'musst': 'must (you)', 'müssen': 'to have to', 'müsst': 'must (you pl.)',
  'musste': 'had to', 'mussten': 'had to (pl.)',
  // Modal: dürfen
  'darf': 'may', 'darfst': 'may (you)', 'dürfen': 'to be allowed to', 'dürft': 'may (you pl.)',
  'durfte': 'was allowed to', 'durften': 'were allowed to',
  // Modal: sollen
  'soll': 'should, shall', 'sollst': 'should (you)', 'sollen': 'should, shall',
  'sollt': 'should (you pl.)', 'sollte': 'should (subj.)', 'sollten': 'should (pl.)',
  // Modal: wollen
  'will': 'want to', 'willst': 'want to (you)', 'wollen': 'to want to',
  'wollt': 'want to (you pl.)', 'wollte': 'wanted to', 'wollten': 'wanted to (pl.)',
  // Modal: mögen
  'mag': 'like, may', 'magst': 'like (you)', 'mögen': 'to like',
  'mögt': 'like (you pl.)', 'mochte': 'liked', 'mochten': 'liked (pl.)',
  'möchte': 'would like', 'möchtest': 'would like (you)',
  'möchten': 'would like (pl.)',
};

// ── Parse dictionary from .ts file ──────────────────────────

function parseDictionary() {
  const src = fs.readFileSync(DICT_PATH, 'utf8');
  const entries = {};

  // Match each entry: 'key': { ... } or "key": { ... }
  const entryRe = /^\s*'([^']+)':\s*\{([^}]+)\}/gm;
  const entryRe2 = /^\s*"([^"]+)":\s*\{([^}]+)\}/gm;

  function parseBody(body) {
    const obj = {};
    // en
    const enM = body.match(/en:\s*'([^']*)'/);
    if (enM) obj.en = enM[1];
    else {
      const enM2 = body.match(/en:\s*"([^"]*)"/);
      if (enM2) obj.en = enM2[1];
    }
    // ipa
    const ipaM = body.match(/ipa:\s*'([^']*)'/);
    if (ipaM) obj.ipa = ipaM[1];
    else {
      const ipaM2 = body.match(/ipa:\s*"([^"]*)"/);
      if (ipaM2) obj.ipa = ipaM2[1];
    }
    // pos
    const posM = body.match(/pos:\s*'([^']*)'/);
    if (posM) obj.pos = posM[1];
    else {
      const posM2 = body.match(/pos:\s*"([^"]*)"/);
      if (posM2) obj.pos = posM2[1];
    }
    // lemma
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

// ── Google Translate batch ──────────────────────────────────

function googleTranslateBatch(words) {
  return new Promise((resolve, reject) => {
    const qParams = words.map(w => `q=${encodeURIComponent(w)}`).join('&');
    const url = `https://translation.googleapis.com/language/translate/v2?key=${API_KEY}&source=de&target=en&${qParams}`;

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

// ── Apply changes to de.ts ──────────────────────────────────

function applyToDict(results) {
  let src = fs.readFileSync(DICT_PATH, 'utf8');

  // Build lookup: word -> new en
  const newEnMap = {};
  for (const r of results) {
    if (r.new_en && r.new_en !== '?') {
      newEnMap[r.word] = r.new_en;
    }
  }

  // Replace en: '...' for each entry
  // Strategy: match each dictionary line and replace the en value
  const lines = src.split('\n');
  let changed = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Match single-quoted key
    let keyMatch = line.match(/^\s*'([^']+)':\s*\{/);
    if (!keyMatch) {
      keyMatch = line.match(/^\s*"([^"]+)":\s*\{/);
    }
    if (!keyMatch) continue;

    const key = keyMatch[1];
    if (!newEnMap[key]) continue;

    const newEn = newEnMap[key];

    // Replace en: 'old' with en: 'new' (or en: "old" with en: 'new')
    const enSingleRe = /en:\s*'[^']*'/;
    const enDoubleRe = /en:\s*"[^"]*"/;

    // Escape single quotes in new value
    const escapedEn = newEn.replace(/'/g, "\\'");

    if (enSingleRe.test(lines[i])) {
      const before = lines[i];
      lines[i] = lines[i].replace(enSingleRe, `en: '${escapedEn}'`);
      if (lines[i] !== before) changed++;
    } else if (enDoubleRe.test(lines[i])) {
      const before = lines[i];
      lines[i] = lines[i].replace(enDoubleRe, `en: '${escapedEn}'`);
      if (lines[i] !== before) changed++;
    }
  }

  fs.writeFileSync(DICT_PATH, lines.join('\n'));
  return changed;
}

// ── Main ────────────────────────────────────────────────────

async function main() {
  console.log('Parsing German dictionary...');
  const dict = parseDictionary();
  const allKeys = Object.keys(dict);
  console.log(`  ${allKeys.length} entries found`);

  // Separate function words from Google words
  const functionWordEntries = [];
  const googleWordEntries = [];

  for (const key of allKeys) {
    if (FUNCTION_WORDS[key] !== undefined) {
      functionWordEntries.push(key);
    } else {
      googleWordEntries.push(key);
    }
  }

  console.log(`  ${functionWordEntries.length} function word entries (hand-verified)`);
  console.log(`  ${googleWordEntries.length} entries to send to Google Translate`);

  // ── Step 1: Process function words ──
  const results = [];
  for (const key of functionWordEntries) {
    const entry = dict[key];
    results.push({
      word: key,
      old_en: entry.en || '?',
      new_en: FUNCTION_WORDS[key],
      source: 'function_table',
      pos: entry.pos || '',
      ipa: entry.ipa || '',
      lemma: entry.lemma || undefined,
    });
  }

  // ── Step 2: Google Translate in batches ──
  const BATCH_SIZE = 80;
  const DELAY = 200;
  const googleResults = {}; // word -> raw translation

  console.log(`\nSending ${googleWordEntries.length} words to Google Translate in batches of ${BATCH_SIZE}...`);

  for (let i = 0; i < googleWordEntries.length; i += BATCH_SIZE) {
    const batch = googleWordEntries.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(googleWordEntries.length / BATCH_SIZE);

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

    if (i + BATCH_SIZE < googleWordEntries.length) {
      await sleep(DELAY);
    }
  }

  // ── Step 3: Post-process Google results ──
  console.log('\nPost-processing Google results...');
  const stats = new PostProcessStats();

  const googleProcessed = {};
  for (const key of googleWordEntries) {
    const entry = dict[key];
    const rawTranslation = googleResults[key];

    if (rawTranslation === null || rawTranslation === undefined) {
      googleProcessed[key] = { text: entry.en || '?', failed: true };
      continue;
    }

    // German uses Latin chars, so romanization check is less relevant,
    // but the post-processor handles it gracefully
    const processed = postProcess(rawTranslation, entry.pos || '', key, stats);
    googleProcessed[key] = { text: processed.text, failed: false, flagged: processed.flagged };
  }

  console.log('\n' + stats.report());

  // ── Step 4: Lemma copy ──
  // First pass: collect base word translations
  const baseTranslations = {};
  // From function words
  for (const key of functionWordEntries) {
    baseTranslations[key] = FUNCTION_WORDS[key];
  }
  // From Google (non-lemma entries only)
  for (const key of googleWordEntries) {
    if (!dict[key].lemma) {
      baseTranslations[key] = googleProcessed[key].text;
    }
  }

  // Second pass: build results for Google words, applying lemma copy
  let lemmaCopyCount = 0;
  for (const key of googleWordEntries) {
    const entry = dict[key];
    const processed = googleProcessed[key];

    let newEn = processed.text;
    let source = processed.failed ? 'google_failed' : 'google';

    // If entry has lemma and we have a translation for it, use lemma's translation
    if (entry.lemma && baseTranslations[entry.lemma]) {
      newEn = baseTranslations[entry.lemma];
      source = 'lemma_copy';
      lemmaCopyCount++;
    }

    results.push({
      word: key,
      old_en: entry.en || '?',
      new_en: newEn,
      source,
      pos: entry.pos || '',
      ipa: entry.ipa || '',
      lemma: entry.lemma || undefined,
    });
  }

  console.log(`\nLemma copy: ${lemmaCopyCount} entries copied from base word`);

  // ── Step 6: Force function table overrides ──
  // (already done — function words were added first and will be in the results)
  // But we must ensure they override in the final output, so we apply them last
  // Build the final map with function words forced last
  const finalMap = {};
  for (const r of results) {
    finalMap[r.word] = r;
  }
  // Force function table
  for (const key of functionWordEntries) {
    finalMap[key].new_en = FUNCTION_WORDS[key];
    finalMap[key].source = 'function_table';
  }

  const allResults = Object.values(finalMap);

  // ── Step 5: Apply to dictionary file ──
  console.log('\nApplying changes to de.ts...');
  const linesChanged = applyToDict(allResults);
  console.log(`  ${linesChanged} lines changed in de.ts`);

  // ── Stats & Report ──
  const sourceBreakdown = {};
  let changedCount = 0;

  for (const r of allResults) {
    sourceBreakdown[r.source] = (sourceBreakdown[r.source] || 0) + 1;
    if (r.old_en !== r.new_en) changedCount++;
  }

  // Save JSON output
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  const jsonPath = path.join(OUT_DIR, 'de-google-rebuild.json');
  fs.writeFileSync(jsonPath, JSON.stringify(allResults, null, 2));
  console.log(`  JSON output: ${jsonPath}`);

  // 50 sample old->new (prioritize changed entries)
  const changedResults = allResults.filter(r => r.old_en !== r.new_en);
  const sample = changedResults.slice(0, 50);

  console.log('\n═══ SUMMARY ═══');
  console.log(`Total entries: ${allResults.length}`);
  console.log(`Changed: ${changedCount}`);
  console.log('Source breakdown:');
  for (const [src, count] of Object.entries(sourceBreakdown).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${src}: ${count}`);
  }

  console.log(`\n═══ 50 SAMPLE OLD → NEW ═══`);
  console.log('Word | Old EN | New EN | Source');
  console.log('-----|--------|--------|-------');
  for (const r of sample) {
    console.log(`${r.word} | ${r.old_en} | ${r.new_en} | ${r.source}`);
  }
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
