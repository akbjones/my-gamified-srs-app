#!/usr/bin/env node
/**
 * Second pass fix: aggressively fix pos='v' entries that are actually nouns.
 *
 * Strategy:
 * 1. For pos='v' without "to " in en → translate via Google → if Google gives a noun → fix POS
 * 2. Fix corrupt/truncated entries ("let\\", empty strings)
 * 3. For pos='v' with "to " but Google gives a noun → fix both en and POS
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
              console.error('  API error:', JSON.stringify(parsed).slice(0, 200));
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

// Words that indicate a verb conjugation (not a noun)
const VERB_INDICATORS = new Set([
  'i', 'he', 'she', 'we', 'they', 'it', 'you', 'one',
  'let', "let's", 'will', 'would', 'could', 'should', 'can', 'may', 'might', 'must', 'shall',
  'is', 'are', 'am', 'was', 'were', 'has', 'have', 'had',
  'do', 'does', 'did', 'being', 'been', 'don\'t', 'doesn\'t', 'didn\'t',
  'not', 'never',
]);

function looksLikeVerbPhrase(gt) {
  if (!gt) return false;
  const words = gt.toLowerCase().trim().split(/\s+/);
  if (words.length === 0) return false;

  // Check first word
  if (VERB_INDICATORS.has(words[0])) return true;

  // "to X" is a verb
  if (words[0] === 'to' && words.length >= 2 && words[1] !== 'the' && words[1] !== 'a') return true;

  // Gerund (-ing) at end
  if (words[words.length - 1].endsWith('ing') && words.length <= 3) return true;

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

async function main() {
  console.log('=== Pass 2: Fix noun-verbs and corrupt entries ===\n');

  const report = {};

  for (const lang of LANGUAGES) {
    console.log(`\n--- ${lang.toUpperCase()} ---`);
    const entries = parseDictionary(lang);

    // Find problematic entries:
    // 1. pos='v' but en doesn't start with "to "
    // 2. Corrupt entries (backslash-escaped, empty, truncated)
    const candidates = [];
    const corrupt = [];

    for (const e of entries) {
      // Check for corrupt entries
      if (e.en.includes('\\\\') || e.en.includes('let\\') || e.en.length < 2 || e.en.endsWith('\\')) {
        corrupt.push(e);
        continue;
      }

      if (e.pos === 'v' && !e.en.toLowerCase().startsWith('to ')) {
        // Skip entries that look like valid verb phrases ("let me", "I will", etc.)
        const enLower = e.en.toLowerCase();
        if (/^(i |he |she |we |they |it |let |don't |can |will |would |could |should |may |might |must )/.test(enLower)) {
          continue;
        }
        candidates.push(e);
      }
    }

    console.log(`  ${candidates.length} pos='v' without 'to '`);
    console.log(`  ${corrupt.length} corrupt entries`);

    if (candidates.length === 0 && corrupt.length === 0) {
      report[lang] = { pos_fixes: 0, corrupt_fixes: 0, total: 0 };
      continue;
    }

    // Translate candidates to verify if they're nouns or verbs
    const fixes = [];

    if (candidates.length > 0) {
      const words = candidates.map(e => e.key);
      console.log(`  Translating ${words.length} candidates...`);
      const gtMap = await translateBatch(words, lang);

      for (const entry of candidates) {
        const gt = gtMap[entry.key];
        if (!gt || gt === '?') continue;

        if (looksLikeVerbPhrase(gt)) {
          // Google thinks it's a verb form – add "to " if we can extract infinitive
          // Actually, just leave it – the entry might be a conjugated form
          // Better to change POS to match what it actually is
          continue;
        }

        // Google returned a noun/adj – fix POS
        const gtClean = gt.toLowerCase().replace(/&#39;/g, "'").replace(/&amp;/g, '&').trim();

        // If Google's translation matches our English, just fix POS
        if (gtClean === entry.en.toLowerCase() || gt.toLowerCase() === entry.en.toLowerCase()) {
          fixes.push({
            key: entry.key,
            newPos: 'n', // could also be adj, but 'n' is safer default
            reason: `pos_fix: GT="${gt}" matches our="${entry.en}"`
          });
        } else {
          // Google gave different translation AND it's not a verb – fix both
          if (gtClean.length >= 2 && gtClean.length <= 50) {
            fixes.push({
              key: entry.key,
              newEn: gtClean,
              newPos: 'n',
              reason: `both_fix: was="${entry.en}" GT="${gt}"`
            });
          }
        }
      }
    }

    // Fix corrupt entries
    if (corrupt.length > 0) {
      const corruptWords = corrupt.map(e => e.key);
      console.log(`  Translating ${corruptWords.length} corrupt entries...`);
      const gtCorrupt = await translateBatch(corruptWords, lang);

      for (const entry of corrupt) {
        const gt = gtCorrupt[entry.key];
        if (!gt || gt === '?') continue;

        const gtClean = gt.toLowerCase().replace(/&#39;/g, "'").replace(/&amp;/g, '&').trim();
        if (gtClean.length >= 2 && gtClean.length <= 50) {
          const newPos = looksLikeVerbPhrase(gt) ? 'v' : 'n';
          const newEn = newPos === 'v' && !gtClean.startsWith('to ') ? 'to ' + gtClean : gtClean;
          fixes.push({
            key: entry.key,
            newEn: newEn,
            newPos: newPos,
            reason: `corrupt_fix: was="${entry.en}" GT="${gt}"`
          });
        }
      }
    }

    console.log(`  ${fixes.length} total fixes`);
    const applied = applyFixes(lang, fixes);
    console.log(`  Applied: ${applied}`);

    report[lang] = {
      pos_fixes: fixes.filter(f => !f.reason.startsWith('corrupt')).length,
      corrupt_fixes: fixes.filter(f => f.reason.startsWith('corrupt')).length,
      total: fixes.length,
      applied,
      examples: fixes.slice(0, 10).map(f => `${f.key}: ${f.reason}`),
    };
  }

  // Write report
  fs.writeFileSync(path.join(OUT_DIR, 'fix-pass2-report.json'), JSON.stringify(report, null, 2));

  console.log('\n=== SUMMARY ===');
  console.log('| Lang | POS | Corrupt | Total | Applied |');
  console.log('|------|-----|---------|-------|---------|');
  for (const lang of LANGUAGES) {
    const r = report[lang];
    console.log(`| ${lang.toUpperCase().padEnd(4)} | ${String(r.pos_fixes).padEnd(3)} | ${String(r.corrupt_fixes).padEnd(7)} | ${String(r.total).padEnd(5)} | ${String(r.applied).padEnd(7)} |`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
