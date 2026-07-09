#!/usr/bin/env node
/**
 * Pass 3: Fix entries where pos='v' + en starts with "to " but Google says it's clearly a noun.
 * Also fix remaining corrupt entries and entries with uppercase after "to ".
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const BASE = path.resolve(__dirname, '..');
const DICT_DIR = path.join(BASE, 'src/data/dictionary');
const OUT_DIR = path.join(BASE, 'scripts/output');

const API_KEY = process.env.GOOGLE_TTS_KEY;
const BATCH_SIZE = 80;

const LANGUAGES = ['es', 'it', 'fr', 'pt', 'de', 'nl', 'sv', 'cy', 'hi', 'tr', 'ru'];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function parseDictionary(lang) {
  const filePath = path.join(DICT_DIR, `${lang}.ts`);
  const content = fs.readFileSync(filePath, 'utf-8');
  const entries = [];
  const entryRegex = /(['"])((?:(?!\1).|\\.)+)\1\s*:\s*\{([^}]+)\}/g;
  let m;
  while ((m = entryRegex.exec(content)) !== null) {
    const key = m[2].replace(/\\'/g, "'").replace(/\\"/g, '"');
    const body = m[3];
    const enMatch = body.match(/en:\s*(['"])((?:(?!\1).|\\.)*)(\1)/);
    if (!enMatch) continue;
    const en = enMatch[2].replace(/\\'/g, "'").replace(/\\"/g, '"');
    const posMatch = body.match(/pos:\s*['"]([^'"]*)['"]/);
    const pos = posMatch ? posMatch[1] : '';
    entries.push({ key, en, pos });
  }
  return entries;
}

async function translateBatch(words, sourceLang) {
  const results = {};
  for (let i = 0; i < words.length; i += BATCH_SIZE) {
    const batch = words.slice(i, i + BATCH_SIZE);
    const params = batch.map(w => 'q=' + encodeURIComponent(w)).join('&');
    const url = `https://translation.googleapis.com/language/translate/v2?key=${API_KEY}&source=${sourceLang}&target=en&${params}`;

    const translations = await new Promise((resolve, reject) => {
      https.get(url, (res) => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (!parsed.data || !parsed.data.translations) {
              resolve(batch.map(() => '?'));
              return;
            }
            resolve(parsed.data.translations.map(t =>
              t.translatedText.replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/&quot;/g, '"')
            ));
          } catch (e) { reject(e); }
        });
      }).on('error', reject);
    });

    batch.forEach((word, j) => {
      results[word] = translations[j] || '?';
    });
    await sleep(300);
  }
  return results;
}

const VERB_FIRST_WORDS = new Set([
  'i', 'he', 'she', 'we', 'they', 'it', 'you', 'one',
  'let', "let's", 'will', 'would', 'could', 'should', 'can', 'may', 'might', 'must', 'shall',
  'is', 'are', 'am', 'was', 'were', 'has', 'have', 'had',
  'do', 'does', 'did', 'being', 'been', "don't", "doesn't", "didn't",
  'not', 'never', 'to',
]);

function looksLikeVerb(gt) {
  if (!gt) return false;
  const first = gt.toLowerCase().trim().split(/\s+/)[0];
  return VERB_FIRST_WORDS.has(first);
}

// Check if Google's translation is a clear noun (no verb indicators)
function isNounTranslation(gt) {
  if (!gt || gt === '?') return false;
  const gtLower = gt.toLowerCase().trim();
  // If it starts with verb indicator, it's a verb
  if (looksLikeVerb(gt)) return false;
  // If it ends with common -ing form and is 1-2 words, it could be either
  const words = gtLower.split(/\s+/);
  if (words.length === 1 && words[0].endsWith('ing')) return false; // gerund/noun ambiguous
  // If it's 1-2 words without verb indicators, likely a noun
  if (words.length <= 3) return true;
  return false;
}

function applyFixes(lang, fixes) {
  if (fixes.length === 0) return 0;

  const filePath = path.join(DICT_DIR, `${lang}.ts`);
  let content = fs.readFileSync(filePath, 'utf-8');
  let applied = 0;

  for (const fix of fixes) {
    const escapedKey = fix.key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const entryRegex = new RegExp(
      `(['"]${escapedKey}['"])\\s*:\\s*\\{([^}]+)\\}`,
      'g'
    );
    const match = entryRegex.exec(content);
    if (!match) continue;

    let entryBody = match[2];
    let changed = false;

    if (fix.newEn !== undefined) {
      const enRegex = /en:\s*(['"])((?:(?!\1).|\\.)*)(\1)/;
      const enMatch = entryBody.match(enRegex);
      if (enMatch) {
        const quote = enMatch[1];
        const newEn = fix.newEn.replace(/'/g, "\\'");
        entryBody = entryBody.replace(enRegex, `en: ${quote}${newEn}${quote}`);
        changed = true;
      }
    }

    if (fix.newPos !== undefined) {
      const posRegex = /pos:\s*['"]([^'"]*)['"]/;
      if (posRegex.test(entryBody)) {
        entryBody = entryBody.replace(posRegex, `pos: '${fix.newPos}'`);
        changed = true;
      }
    }

    if (changed) {
      content = content.slice(0, match.index) + match[0].replace(match[2], entryBody) + content.slice(match.index + match[0].length);
      applied++;
    }
  }

  fs.writeFileSync(filePath, content);
  return applied;
}

// ── Semantic overlap helpers ─────────────────────────────────────

const { lemmatize } = require('./english-lemmatizer.cjs');

const STOP_WORDS = new Set([
  'to', 'a', 'an', 'the', 'of', 'in', 'on', 'at', 'for', 'with', 'from',
  'by', 'is', 'it', 'and', 'or', 'but', 'not', 'no', 'be', 'do', 'have',
  'i', 'you', 'he', 'she', 'we', 'they', 'my', 'your', 'his', 'her', 'our',
  'their', 'its', 'this', 'that', 'these', 'those', 'up', 'out', 'down',
  'off', 'over', 'one', 'all', 'some', 'any', 'each', 'every', 'as',
]);

function getContentLemmas(text) {
  const words = text.toLowerCase()
    .replace(/[;,/()[\]{}!?.:"'`\\]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1 && !STOP_WORDS.has(w));
  const lemmas = new Set();
  for (const w of words) {
    lemmas.add(lemmatize(w));
  }
  return lemmas;
}

function hasSemanticOverlap(ourEn, googleEn) {
  const ourLemmas = getContentLemmas(ourEn.replace(/^to /, ''));
  const gtLemmas = getContentLemmas(googleEn);
  for (const l of ourLemmas) {
    if (gtLemmas.has(l)) return true;
  }
  // substring check
  for (const ol of ourLemmas) {
    for (const gl of gtLemmas) {
      if (ol.length >= 3 && gl.length >= 3 && (ol.includes(gl) || gl.includes(ol))) return true;
    }
  }
  return false;
}

async function main() {
  console.log('=== Pass 3: Fix verb-tagged nouns with "to " prefix ===\n');

  const report = {};

  for (const lang of LANGUAGES) {
    console.log(`\n--- ${lang.toUpperCase()} ---`);
    const entries = parseDictionary(lang);

    // Find candidates: pos='v' + en starts with "to " + suspicious patterns
    const candidates = [];
    const fixCaps = [];
    const fixCorrupt = [];

    for (const e of entries) {
      // Fix "to UPPERCASE" patterns
      if (e.pos === 'v' && /^to [A-Z]/.test(e.en)) {
        fixCaps.push(e);
      }

      // Fix corrupt backslash entries
      if (e.en.includes('\\') || e.en.endsWith('"') || e.en.length < 2) {
        fixCorrupt.push(e);
        continue;
      }

      // Main target: pos='v' + en starts with "to "
      if (e.pos === 'v' && e.en.startsWith('to ')) {
        const afterTo = e.en.slice(3).trim().toLowerCase();
        // Skip clearly valid verbs
        if (afterTo.length < 2) continue;
        candidates.push(e);
      }
    }

    console.log(`  ${candidates.length} verb entries with "to " to verify`);
    console.log(`  ${fixCaps.length} uppercase after "to "`);
    console.log(`  ${fixCorrupt.length} corrupt entries`);

    // Translate ALL candidates to verify
    const allKeys = [...new Set([
      ...candidates.map(e => e.key),
      ...fixCaps.map(e => e.key),
      ...fixCorrupt.map(e => e.key),
    ])];

    if (allKeys.length === 0) {
      report[lang] = { noun_fixes: 0, cap_fixes: 0, corrupt_fixes: 0, total: 0 };
      continue;
    }

    console.log(`  Translating ${allKeys.length} entries...`);
    const gtMap = await translateBatch(allKeys, lang);

    const fixes = [];

    // Fix entries where Google says it's a noun
    for (const entry of candidates) {
      const gt = gtMap[entry.key];
      if (!gt || gt === '?') continue;

      // Check if there's semantic overlap between our definition and Google's
      if (hasSemanticOverlap(entry.en, gt)) continue; // our definition is fine

      // No overlap – Google's translation is different
      // If Google gives a noun, fix both en and pos
      if (isNounTranslation(gt)) {
        const gtClean = gt.toLowerCase().trim();
        if (gtClean.length >= 2 && gtClean.length <= 50) {
          fixes.push({
            key: entry.key,
            newEn: gtClean,
            newPos: 'n',
            reason: `noun_fix: was="${entry.en}" GT="${gt}"`
          });
        }
      }
    }

    // Fix uppercase "to DO" → "to do"
    for (const entry of fixCaps) {
      const enLower = 'to ' + entry.en.slice(3).toLowerCase();
      if (enLower !== entry.en) {
        fixes.push({
          key: entry.key,
          newEn: enLower,
          reason: `cap_fix: was="${entry.en}"`
        });
      }
    }

    // Fix corrupt entries
    for (const entry of fixCorrupt) {
      const gt = gtMap[entry.key];
      if (!gt || gt === '?') continue;
      const gtClean = gt.toLowerCase().replace(/&#39;/g, "'").replace(/&amp;/g, '&').trim();
      if (gtClean.length >= 2 && gtClean.length <= 50) {
        fixes.push({
          key: entry.key,
          newEn: looksLikeVerb(gt) ? (gtClean.startsWith('to ') ? gtClean : 'to ' + gtClean) : gtClean,
          newPos: looksLikeVerb(gt) ? 'v' : 'n',
          reason: `corrupt_fix: was="${entry.en}" GT="${gt}"`
        });
      }
    }

    console.log(`  ${fixes.length} fixes`);
    const applied = applyFixes(lang, fixes);
    console.log(`  Applied: ${applied}`);

    report[lang] = {
      noun_fixes: fixes.filter(f => f.reason.startsWith('noun')).length,
      cap_fixes: fixes.filter(f => f.reason.startsWith('cap')).length,
      corrupt_fixes: fixes.filter(f => f.reason.startsWith('corrupt')).length,
      total: fixes.length,
      applied,
    };
  }

  fs.writeFileSync(path.join(OUT_DIR, 'fix-pass3-report.json'), JSON.stringify(report, null, 2));

  console.log('\n=== SUMMARY ===');
  console.log('| Lang | Noun | Caps | Corrupt | Total | Applied |');
  console.log('|------|------|------|---------|-------|---------|');
  let total = 0;
  for (const lang of LANGUAGES) {
    const r = report[lang];
    console.log(`| ${lang.toUpperCase().padEnd(4)} | ${String(r.noun_fixes).padEnd(4)} | ${String(r.cap_fixes).padEnd(4)} | ${String(r.corrupt_fixes).padEnd(7)} | ${String(r.total).padEnd(5)} | ${String(r.applied).padEnd(7)} |`);
    total += r.total;
  }
  console.log(`| ALL  |      |      |         | ${total}   |         |`);
}

main().catch(e => { console.error(e); process.exit(1); });
