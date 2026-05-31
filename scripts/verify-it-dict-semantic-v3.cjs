#!/usr/bin/env node
/**
 * Italian dictionary semantic verification v3.
 *
 * Strategy:
 * 1. Forward translate IT→EN via Google for all entries
 * 2. For mismatches, back-translate DICT English → IT
 * 3. If dict English back-translates to a DIFFERENT Italian word → dict is WRONG
 * 4. If dict English back-translates to SAME Italian word → valid synonym, skip
 * 5. Extra filter: skip verb conjugation noise, garbage Google results
 * 6. For entries with '?' or garbled en, always use Google
 */

const fs = require('fs');
const https = require('https');
const path = require('path');

const DICT_PATH = path.join(__dirname, '..', 'src', 'data', 'dictionary', 'it.ts');
const API_KEY = 'AIzaSyBImkCNYcI1m9mloUNcYcDN2L5dQZwADzI';

// ── Function words to skip ──────────────────────────────────────
const FUNCTION_WORDS = new Set([
  'il', 'lo', 'la', 'i', 'gli', 'le', 'l', 'un', 'uno', 'una',
  'a', 'di', 'da', 'in', 'con', 'su', 'per', 'tra', 'fra',
  'al', 'allo', 'alla', 'ai', 'agli', 'alle',
  'del', 'dello', 'della', 'dei', 'degli', 'delle',
  'dal', 'dallo', 'dalla', 'dai', 'dagli', 'dalle',
  'nel', 'nello', 'nella', 'nei', 'negli', 'nelle',
  'sul', 'sullo', 'sulla', 'sui', 'sugli', 'sulle',
  'e', 'ed', 'o', 'ma', 'però', 'che', 'se', 'né', 'oppure',
  'perché', 'quando', 'mentre', 'come', 'dove', 'anche', 'pure',
  'dunque', 'quindi', 'eppure', 'anzi', 'cioè', 'ossia',
  'io', 'tu', 'lui', 'lei', 'noi', 'voi', 'loro', 'esso', 'essa',
  'mi', 'ti', 'ci', 'vi', 'si', 'lo', 'la', 'li', 'le', 'ne',
  'me', 'te', 'sé', 'ce', 've',
  'questo', 'questa', 'questi', 'queste',
  'quello', 'quella', 'quelli', 'quelle',
  'chi', 'cui', 'quale', 'quali',
  'mio', 'mia', 'miei', 'mie', 'tuo', 'tua', 'tuoi', 'tue',
  'suo', 'sua', 'suoi', 'sue',
  'nostro', 'nostra', 'nostri', 'nostre',
  'vostro', 'vostra', 'vostri', 'vostre',
  'non', 'no', 'sì', 'già', 'più', 'molto', 'poco', 'mai',
  'sempre', 'ancora', 'solo', 'proprio', 'così', 'qui', 'qua',
  'lì', 'là', 'ora', 'adesso', 'poi', 'prima', 'dopo',
  'c', 'n', 'd', 'ecco',
  'è', 'sono', 'sei', 'siamo', 'siete',
  'ho', 'hai', 'ha', 'abbiamo', 'avete', 'hanno',
  'era', 'ero', 'eri', 'eravamo', 'eravate', 'erano',
  'sarà', 'sarò', 'sarai', 'saremo', 'sarete', 'saranno',
  'sia', 'siano', 'siate',
  'stato', 'stata', 'stati', 'state',
  'avevo', 'avevi', 'aveva', 'avevamo', 'avevate', 'avevano',
  'avrà', 'avrò', 'avrai', 'avremo', 'avrete', 'avranno',
  'abbia', 'abbiano', 'abbiate', 'abbi',
  'fa', 'fai', 'fanno', 'facciamo', 'fate',
  'do', 'dai', 'dà', 'diamo', 'danno', 'date',
  'sta', 'stai', 'stanno', 'stiamo',
  'può', 'posso', 'puoi', 'possiamo', 'possono', 'potete',
  'vuoi', 'vuole', 'voglio', 'vogliamo', 'volete', 'vogliono',
  'deve', 'devo', 'devi', 'dobbiamo', 'devono', 'dovete',
  'va', 'vai', 'andiamo', 'vanno', 'andate',
  'viene', 'vengo', 'vieni', 'veniamo', 'vengono', 'venite',
]);

// ── Parse dictionary ────────────────────────────────────────────
function parseDictionary(src) {
  const entries = {};
  const re = /^\s*'([^']+)':\s*\{([^}]+)\}/gm;
  const re2 = /^\s*"([^"]+)":\s*\{([^}]+)\}/gm;
  let m;
  while ((m = re.exec(src)) !== null) {
    const key = m[1];
    const body = m[2];
    const enMatch = body.match(/en:\s*'([^']*)'/) || body.match(/en:\s*"([^"]*)"/);
    const posMatch = body.match(/pos:\s*'([^']*)'/);
    if (enMatch) {
      entries[key] = { en: enMatch[1], pos: posMatch ? posMatch[1] : '' };
    }
  }
  while ((m = re2.exec(src)) !== null) {
    const key = m[1];
    const body = m[2];
    const enMatch = body.match(/en:\s*'([^']*)'/) || body.match(/en:\s*"([^"]*)"/);
    const posMatch = body.match(/pos:\s*'([^']*)'/);
    if (enMatch) {
      entries[key] = { en: enMatch[1], pos: posMatch ? posMatch[1] : '' };
    }
  }
  return entries;
}

// ── Google Translate ────────────────────────────────────────────
function googleTranslateBatch(words, sourceLang, targetLang) {
  return new Promise((resolve, reject) => {
    const qParams = words.map(w => `q=${encodeURIComponent(w)}`).join('&');
    const url = `https://translation.googleapis.com/language/translate/v2?${qParams}&source=${sourceLang}&target=${targetLang}&key=${API_KEY}&format=text`;
    https.get(url, { timeout: 30000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error) { reject(new Error(json.error.message)); return; }
          resolve(json.data.translations.map(t => t.translatedText));
        } catch (e) { reject(new Error(`Parse: ${e.message}`)); }
      });
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function batchTranslate(words, src, tgt, label) {
  const BATCH = 80;
  const results = {};
  const batches = [];
  for (let i = 0; i < words.length; i += BATCH) {
    batches.push(words.slice(i, i + BATCH));
  }
  console.log(`  ${label}: ${batches.length} batches (${words.length} words)`);
  for (let bi = 0; bi < batches.length; bi++) {
    const batch = batches[bi];
    try {
      const res = await googleTranslateBatch(batch, src, tgt);
      for (let j = 0; j < batch.length; j++) results[batch[j]] = res[j];
    } catch (err) {
      await new Promise(r => setTimeout(r, 2000));
      try {
        const res = await googleTranslateBatch(batch, src, tgt);
        for (let j = 0; j < batch.length; j++) results[batch[j]] = res[j];
      } catch (err2) { console.error(`    Batch ${bi+1} failed twice`); }
    }
    if ((bi+1) % 10 === 0 || bi === batches.length-1) console.log(`    ${bi+1}/${batches.length}`);
    if (bi < batches.length-1) await new Promise(r => setTimeout(r, 80));
  }
  return results;
}

// ── Comparison helpers ──────────────────────────────────────────
const STOP = new Set(['a','an','the','to','of','in','on','at','for','and','or','but',
  'is','are','was','were','be','been','being','it','its','he','she','they','we','you',
  'i','me','my','your','his','her','their','our','us','them','do','does','did','will',
  'would','can','could','shall','should','may','might','must','have','has','had',
  'not','no','up','out','off','by','with','from','as','this','that','these','those',
  'some','any','all','each','every','very','so','too','also','just','more','most',
  'own','other','one','oneself','something','someone','thing']);

function contentWords(text) {
  if (!text) return [];
  return text.toLowerCase().replace(/[().,!?;:"""''\/\-–—]/g,' ')
    .split(/\s+/).filter(w => w.length > 1 && !STOP.has(w));
}

function stem(w) {
  w = w.toLowerCase();
  for (const suf of ['ation','tion','sion','ness','ment','able','ible','ing','ous','ive','ful','less','ally','ly','ed','er','est','ies','es','s']) {
    if (w.endsWith(suf) && w.length > suf.length + 2) { w = w.slice(0, -suf.length); break; }
  }
  return w;
}

function wordsMatch(t1, t2) {
  const w1 = contentWords(t1);
  const w2 = contentWords(t2);
  if (w1.length === 0 || w2.length === 0) return true;
  const s1 = new Set(w1.map(stem));
  const s2 = new Set(w2.map(stem));
  for (const a of s1) {
    if (a.length < 3) continue;
    for (const b of s2) {
      if (b.length < 3) continue;
      if (a === b) return true;
      if (a.length >= 4 && b.length >= 4 && a.slice(0,4) === b.slice(0,4)) return true;
      if (a.length >= 4 && b.length >= 4 && (a.includes(b) || b.includes(a))) return true;
    }
  }
  return false;
}

function italianMatch(w1, w2) {
  const a = w1.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z]/g,'');
  const b = w2.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z]/g,'');
  if (a === b) return true;
  if (a.length >= 4 && b.length >= 4 && a.slice(0,Math.min(a.length,b.length)-1) === b.slice(0,Math.min(a.length,b.length)-1)) return true;
  if (a.length >= 5 && b.length >= 5 && a.slice(0,5) === b.slice(0,5)) return true;
  return false;
}

function isGarbage(en, itWord) {
  if (!en || en.trim() === '') return true;
  // Google returned the Italian word
  const enClean = en.toLowerCase().replace(/[^a-zàèéìòù]/g,'');
  const itClean = itWord.toLowerCase().replace(/[^a-zàèéìòù]/g,'');
  if (enClean === itClean) return true;
  // Contains non-English characters
  if (/[àèéìòùА-я]/.test(en)) return true;
  // Too long
  if (en.length > 60) return true;
  return false;
}

function isDictGarbled(en) {
  // Entries that are clearly broken
  if (en === '?') return true;
  if (en.includes('i\\')) return true;  // escaped quote issue
  if (en.includes("i'")) return true;   // another variant
  if (/^[a-z]{1,2}$/.test(en)) return true; // just 1-2 chars
  // Wiktionary-style definitions
  if (/^(a |an |the )?(female|male|masculine|feminine) (given|form|variant)/i.test(en)) return true;
  if (/\b(form of|variant of|plural of|diminutive of)\b/i.test(en)) return true;
  if (/\bprovince\b/i.test(en) && !/\bprovince\b/i.test(en.replace(/province/i,''))) return true;
  // Town/place definitions that aren't useful
  if (/\b(town|city|village|municipality|commune) (in|of|near)\b/i.test(en)) return true;
  if (/\bSiena\b|\bTuscany\b|\bLombardy\b|\bVeneto\b|\bCampania\b/i.test(en)) return true;
  // Starts with "nonstandard" or "colloquial form"
  if (/^(nonstandard|colloquial|archaic|obsolete|dialectal)/i.test(en)) return true;
  // "apocopic form of"
  if (/apocopic/i.test(en)) return true;
  return false;
}

function cleanTranslation(en, pos) {
  let c = en.trim();
  // Remove "He/She/It/I/We/They" prefix from conjugated translations
  c = c.replace(/^(he|she|it|i|we|they|you|let'?s?)\s+/i, '');
  // Lowercase
  c = c.toLowerCase();
  // Add "to " for verbs
  if (pos === 'v' && !c.startsWith('to ')) {
    c = 'to ' + c;
  }
  c = c.replace(/\.$/, '');
  return c;
}

// ── Main ────────────────────────────────────────────────────────
async function main() {
  console.log('Reading dictionary...');
  const src = fs.readFileSync(DICT_PATH, 'utf8');
  const entries = parseDictionary(src);
  const allKeys = Object.keys(entries);
  console.log(`Parsed ${allKeys.length} entries`);

  const toCheck = allKeys.filter(k => !FUNCTION_WORDS.has(k));
  console.log(`Checking ${toCheck.length} entries (skipped ${allKeys.length - toCheck.length} function words)\n`);

  // ── Phase 1: Forward translate (IT→EN) ────────────────────────
  console.log('Phase 1: Forward translation (IT→EN)');
  const forward = await batchTranslate(toCheck, 'it', 'en', 'IT→EN');

  // ── Find all candidates for replacement ───────────────────────
  const candidates = [];
  let directMatch = 0;

  for (const key of toCheck) {
    const dictEn = entries[key].en;
    const googleEn = forward[key];
    if (!googleEn) continue;
    if (isGarbage(googleEn, key)) continue;

    // Always flag garbled dict entries
    if (isDictGarbled(dictEn)) {
      candidates.push({ word: key, dictEn, googleEn, pos: entries[key].pos, reason: 'garbled' });
      continue;
    }

    // Forward match check
    if (wordsMatch(dictEn, googleEn)) {
      directMatch++;
      continue;
    }

    candidates.push({ word: key, dictEn, googleEn, pos: entries[key].pos, reason: 'mismatch' });
  }

  console.log(`\nForward matches: ${directMatch}`);
  console.log(`Candidates for verification: ${candidates.length}`);
  console.log(`  Garbled entries: ${candidates.filter(c => c.reason === 'garbled').length}`);
  console.log(`  Mismatches: ${candidates.filter(c => c.reason === 'mismatch').length}`);

  // ── Phase 2: Back-translate dict English → Italian ────────────
  // Only for 'mismatch' candidates (garbled ones we'll replace unconditionally)
  const mismatches = candidates.filter(c => c.reason === 'mismatch');
  const garbled = candidates.filter(c => c.reason === 'garbled');

  console.log(`\nPhase 2: Back-translation for ${mismatches.length} mismatches`);

  const backTranslateInputs = mismatches.map(m => {
    let en = m.dictEn;
    if (en.startsWith('to ')) en = en.slice(3);
    en = en.split(',')[0].split(';')[0].trim();
    return en;
  });

  const backResults = await batchTranslate(backTranslateInputs, 'en', 'it', 'EN→IT (back)');

  // ── Phase 3: Decide what to replace ───────────────────────────
  console.log(`\nPhase 3: Deciding replacements...`);
  const fixes = [];
  let savedBySynonym = 0;

  // All garbled entries get replaced
  for (const g of garbled) {
    fixes.push(g);
  }

  // For mismatches, only replace if back-translation doesn't match original Italian
  for (let i = 0; i < mismatches.length; i++) {
    const mm = mismatches[i];
    const backItalian = backResults[backTranslateInputs[i]];

    if (backItalian && italianMatch(backItalian, mm.word)) {
      // Dict English back-translates to same Italian word → valid synonym
      savedBySynonym++;
      continue;
    }

    // Additional: check if dict has multiple meanings and ANY match
    const parts = mm.dictEn.split(/[,;]/).map(s => s.trim());
    if (parts.length > 1) {
      let anyMatch = false;
      for (const part of parts) {
        if (wordsMatch(part, mm.googleEn)) { anyMatch = true; break; }
      }
      if (anyMatch) { savedBySynonym++; continue; }
    }

    fixes.push(mm);
  }

  console.log(`Saved by synonym/back-translate: ${savedBySynonym}`);
  console.log(`Total fixes: ${fixes.length}`);

  // ── Phase 4: Apply ────────────────────────────────────────────
  console.log(`\nPhase 4: Applying ${fixes.length} fixes...`);
  let fixedSrc = src;
  let applied = 0;
  let skipped = 0;

  for (const fix of fixes) {
    const key = fix.word;
    const dictEn = fix.dictEn;
    const pos = fix.pos;
    let newEn = cleanTranslation(fix.googleEn, pos);

    // Skip if identical after cleaning
    if (newEn === dictEn || newEn.toLowerCase() === dictEn.toLowerCase()) { skipped++; continue; }
    // Skip if Google gave garbage we didn't catch
    if (newEn.length < 2) { skipped++; continue; }

    const escapedDictEn = dictEn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Try single-quoted key
    const re1 = new RegExp(`('${escapedKey}':\\s*\\{[^}]*en:\\s*')${escapedDictEn}(')`);
    // Try double-quoted key
    const re2 = new RegExp(`("${escapedKey}":\\s*\\{[^}]*en:\\s*')${escapedDictEn}(')`);

    const safeNewEn = newEn.replace(/'/g, "\\'");

    if (re1.test(fixedSrc)) {
      fixedSrc = fixedSrc.replace(re1, `$1${safeNewEn}$2`);
      applied++;
    } else if (re2.test(fixedSrc)) {
      fixedSrc = fixedSrc.replace(re2, `$1${safeNewEn}$2`);
      applied++;
    } else {
      skipped++;
    }
  }

  console.log(`Applied: ${applied}, Skipped: ${skipped}`);

  if (applied > 0) {
    fs.writeFileSync(DICT_PATH, fixedSrc);
    console.log(`Wrote to ${DICT_PATH}`);
  }

  // Save report
  const outPath = path.join(__dirname, 'output', 'it-semantic-v3-fixes.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(fixes, null, 2));

  // Print samples
  console.log(`\n=== SAMPLE FIXES (garbled) ===`);
  garbled.slice(0, 15).forEach(f => console.log(`  ${f.word}: "${f.dictEn}" → "${f.googleEn}"`));
  console.log(`\n=== SAMPLE FIXES (wrong) ===`);
  fixes.filter(f => f.reason === 'mismatch').slice(0, 30).forEach(f =>
    console.log(`  ${f.word}: "${f.dictEn}" → "${f.googleEn}"`)
  );

  console.log(`\n=== FINAL SUMMARY ===`);
  console.log(`Total entries: ${allKeys.length}`);
  console.log(`Checked: ${toCheck.length}`);
  console.log(`Direct matches: ${directMatch}`);
  console.log(`Garbled entries fixed: ${garbled.length}`);
  console.log(`Wrong translations fixed: ${fixes.filter(f=>f.reason==='mismatch').length}`);
  console.log(`Saved by back-translation: ${savedBySynonym}`);
  console.log(`Total applied: ${applied}`);

  return applied;
}

main().then(n => {
  console.log(`\nITALIAN COMPLETE — ${n} fixes`);
}).catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
