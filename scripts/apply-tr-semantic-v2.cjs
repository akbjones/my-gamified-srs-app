#!/usr/bin/env node
/**
 * Turkish dictionary semantic verification - Phase 2
 * Reads raw mismatches, reverse-verifies via en→tr translation,
 * then applies only confirmed fixes.
 */

const fs = require('fs');
const https = require('https');
const path = require('path');

const DICT_PATH = path.join(__dirname, '..', 'src', 'data', 'dictionary', 'tr.ts');
const FIXES_PATH = path.join(__dirname, 'output', 'tr-semantic-fixes.json');

const fixes = JSON.parse(fs.readFileSync(FIXES_PATH, 'utf8'));

// ── Google Translate ──
function googleTranslate(words, sl, tl) {
  return new Promise((resolve, reject) => {
    const params = words.map(w => `q=${encodeURIComponent(w)}`).join('&');
    const url = `https://translation.googleapis.com/language/translate/v2?${params}&source=${sl}&target=${tl}&key=${process.env.GOOGLE_API_KEY}&format=text`;
    https.get(url, { timeout: 30000 }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          if (json.error) { reject(new Error(json.error.message)); return; }
          resolve(json.data.translations.map(t => t.translatedText));
        } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

// ── Helpers ──
function stem(word) {
  return word.toLowerCase()
    .replace(/ies$/, 'y').replace(/ied$/, 'y')
    .replace(/(ing|ed|er|est|ment|ness|tion|sion|ly|able|ible|ful|less|ous|ive|al|ial|ical|s|es)$/, '')
    .replace(/(.)\1$/, '$1');
}

const STOP = new Set('a an the to of in on at is it and or for be am are was were been being do does did has have had i my me we us our you your he his him she her they them their this that these those not no so but if up out with from by as very will can may just would should could might must shall'.split(' '));

function contentStems(phrase) {
  return phrase.toLowerCase().replace(/[^a-z ]/g, '').split(/\s+/)
    .filter(w => w.length > 2 && !STOP.has(w))
    .map(stem).filter(s => s.length > 2);
}

function hasOverlap(a, b) {
  const aStems = contentStems(a);
  const bStems = contentStems(b);
  if (aStems.length === 0 || bStems.length === 0) return false;
  const bSet = new Set(bStems);
  for (const s of aStems) {
    if (bSet.has(s)) return true;
    for (const bs of bStems) {
      const len = Math.min(s.length, bs.length);
      if (len >= 3 && s.slice(0, Math.max(3, len - 1)) === bs.slice(0, Math.max(3, len - 1))) return true;
    }
  }
  return false;
}

// Turkish stemming (very basic - remove common suffixes for comparison)
function trNormalize(w) {
  return w.toLowerCase()
    .replace(/(ları|leri|lar|ler|ının|inin|unun|ünün|nın|nin|nun|nün|ımız|imiz|umuz|ümüz|ınız|iniz|unuz|ünüz|ıyor|iyor|uyor|üyor|acak|ecek|mak|mek|dır|dir|dur|dür|tır|tir|tur|tür|dan|den|tan|ten|da|de|ta|te|ı|i|u|ü|a|e|ya|ye|mı|mi|mu|mü|ım|im|um|üm|sın|sin|sun|sün|ız|iz|uz|üz|dı|di|du|dü)$/, '');
}

// ── Filter known-good dict entries that Google gets wrong ──
// These are words where Google Translate is notoriously inaccurate
const DICT_OVERRIDES_KEEP = new Set([
  'acı',      // bitter/spicy/pain - NOT angle
  'adı',      // its name - NOT ordinary
  'ayın',     // of the month - NOT ritual
]);

// ── Categorize each mismatch ──
function categorize(f) {
  const d = f.dictEn.toLowerCase().trim();
  const g = f.googleEn.toLowerCase().trim();

  // Skip dict overrides we know are correct
  if (DICT_OVERRIDES_KEEP.has(f.tr)) return 'keep';

  // Google returned Turkish word back = garbage
  if (g === f.tr.toLowerCase()) return 'skip-garbage';
  if (g.length <= 1) return 'skip-garbage';

  // ── DEFINITELY FIX: garbled dict entries ──
  if (/^(i|he|she|it|we|they|to i|to he|to she|to it|to we|to they|to the|to a|to my|to is|to are|to was|to its|to his|to her|to our|to your|to their|sho|your sho|to car|to hungry|to opened|to are opening)$/i.test(d)) {
    return 'fix-garbled';
  }

  // Truncated entries (dict en < 4 chars and not a real word)
  if (d.length <= 3 && !['yes','no','but','and','or','big','old','new','hot','sad','ill','eat','run','cut','put','get','set','sit','lie','die','buy','fly','try','dry','wet','red','raw','mad','bad','fit','hit','mix','fix','rub','hug','dig','tie','win','own','ask','add','arm','art','bag','bar','bed','bit','box','bus','cap','cow','cup','day','ear','egg','eye','fan','fat','fun','fur','gap','gas','god','gun','guy','hat','ice','ink','jam','jar','jaw','jet','job','joy','key','kid','kit','lap','law','leg','lip','log','lot','map','mat','mud','net','nut','oil','pan','pig','pin','pit','pot','pub','rat','raw','rib','rod','row','rug','rum','sad','sin','sir','ski','sky','spy','sum','sun','tap','tax','tea','tin','tip','toe','top','toy','van','war','wax','web','wig','zoo'].includes(d)) {
    return 'fix-garbled';
  }

  // Has overlap already - skip
  if (hasOverlap(d, g)) return 'skip-overlap';

  // ── Verb form vs infinitive: dict="to X", google=conjugated form ──
  if (d.startsWith('to ')) {
    return 'needs-verify';
  }

  // Everything else needs verification
  return 'needs-verify';
}

async function main() {
  console.log(`Total mismatches: ${fixes.length}`);

  const autoFix = [];
  const needsVerify = [];
  let skipCount = 0;

  for (const f of fixes) {
    const cat = categorize(f);
    if (cat === 'fix-garbled') autoFix.push(f);
    else if (cat === 'needs-verify') needsVerify.push(f);
    else skipCount++;
  }

  console.log(`Auto-fix (garbled): ${autoFix.length}`);
  console.log(`Needs reverse verification: ${needsVerify.length}`);
  console.log(`Skipped (overlap/garbage/keep): ${skipCount}`);

  // ── Reverse verify: translate Google English → Turkish, compare with original TR word ──
  console.log('\nRunning reverse verification...');
  const BATCH = 80;
  const verified = [...autoFix]; // Start with auto-fixes

  for (let i = 0; i < needsVerify.length; i += BATCH) {
    const batch = needsVerify.slice(i, i + BATCH);
    const googleEnPhrases = batch.map(f => f.googleEn);

    let backTranslations;
    let retries = 0;
    while (retries < 3) {
      try {
        backTranslations = await googleTranslate(googleEnPhrases, 'en', 'tr');
        break;
      } catch (e) {
        retries++;
        console.error(`  Batch error (attempt ${retries}): ${e.message}`);
        if (retries >= 3) backTranslations = null;
        await new Promise(r => setTimeout(r, 2000 * retries));
      }
    }

    if (!backTranslations) continue;

    for (let j = 0; j < batch.length; j++) {
      const f = batch[j];
      const backTr = backTranslations[j].toLowerCase();
      const origTr = f.tr.toLowerCase();

      // Check if back-translation relates to original Turkish word
      const origNorm = trNormalize(origTr);
      const backNorm = trNormalize(backTr);

      // If back-translation shares stem with original → Google was right, dict is wrong
      const related = origNorm.length >= 3 && backNorm.length >= 3 &&
        (backNorm.includes(origNorm.slice(0, Math.max(3, origNorm.length - 2))) ||
         origNorm.includes(backNorm.slice(0, Math.max(3, backNorm.length - 2))) ||
         backTr.includes(origTr) || origTr.includes(backTr) ||
         backTr.split(/\s+/).some(w => trNormalize(w) === origNorm));

      if (related) {
        verified.push(f);
      }
      // If back-translation is completely unrelated to original TR → Google was probably wrong
      // Skip these - keep the dict entry as-is
    }

    if ((Math.floor(i / BATCH) + 1) % 5 === 0 || i + BATCH >= needsVerify.length) {
      console.log(`  Reverse verified: ${Math.min(i + BATCH, needsVerify.length)}/${needsVerify.length} (${verified.length - autoFix.length} confirmed)`);
    }

    await new Promise(r => setTimeout(r, 150));
  }

  console.log(`\nTotal verified fixes: ${verified.length}`);

  // ── Apply fixes ──
  let src = fs.readFileSync(DICT_PATH, 'utf8');
  let fixCount = 0;

  for (const f of verified) {
    const trEsc = f.tr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`((?:'|")${trEsc}(?:'|")\\s*:\\s*\\{\\s*en:\\s*')([^']*?)(')`);
    const match = src.match(re);
    if (!match) continue;

    let newEn = f.googleEn.trim()
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&#39;/g, "'").replace(/&quot;/g, '"')
      .replace(/\.$/, '');

    // Lowercase first letter (unless I or proper noun)
    if (newEn.length > 0 && newEn[0] === newEn[0].toUpperCase()) {
      if (!/^(I |I'|I$)/.test(newEn)) {
        newEn = newEn[0].toLowerCase() + newEn.slice(1);
      }
    }

    // Escape single quotes
    newEn = newEn.replace(/'/g, "\\'");

    if (newEn.length <= 1) continue;
    if (newEn.toLowerCase() === f.tr.toLowerCase()) continue;
    if (newEn === match[2]) continue;

    src = src.replace(re, `$1${newEn}$3`);
    fixCount++;
  }

  console.log(`Applied ${fixCount} fixes to tr.ts`);
  fs.writeFileSync(DICT_PATH, src);
  console.log('Written updated tr.ts');
  console.log(`\nTURKISH SEMANTIC VERIFICATION – ${fixCount} fixes applied`);
}

main().catch(e => { console.error(e); process.exit(1); });
