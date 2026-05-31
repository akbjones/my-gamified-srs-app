/**
 * Swedish Dictionary — Final Careful Fix Application v2
 * Handles escaped quotes (it\'s) in en values properly
 */

const fs = require('fs');
const https = require('https');

const DICT_PATH = '/Users/antoinevj/Documents/GitHub/my-gamified-srs-app/.claude/worktrees/agitated-boyd/src/data/dictionary/sv.ts';
const API_KEY = 'AIzaSyBImkCNYcI1m9mloUNcYcDN2L5dQZwADzI';

function translateBatch(words, sourceLang, targetLang) {
  return new Promise((resolve, reject) => {
    const queryParts = words.map(w => `q=${encodeURIComponent(w)}`).join('&');
    const url = `https://translation.googleapis.com/language/translate/v2?${queryParts}&source=${sourceLang}&target=${targetLang}&key=${API_KEY}&format=text`;
    https.get(url, { timeout: 30000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error) { reject(new Error(json.error.message)); return; }
          resolve(json.data.translations.map(t => t.translatedText));
        } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

/**
 * Replace the en value for a given key in the dictionary source.
 * Handles escaped single quotes like it\'s properly.
 */
function replaceEnValue(src, key, newEn) {
  // Escape key for regex
  const ek = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Match pattern: 'key': { en: '...' where ... can contain \' (escaped quotes)
  // The en value is: everything between en: ' and the next unescaped '
  // An unescaped ' is a ' not preceded by \
  const pattern = new RegExp(
    `(['"]${ek}['"]\\s*:\\s*\\{\\s*en:\\s*')((?:[^'\\\\]|\\\\.)*)(')`
  );
  const match = src.match(pattern);
  if (!match) return { src, changed: false, oldEn: null };
  const oldEn = match[2];
  // Escape single quotes in newEn for the JS source
  const safeNew = newEn.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  // Actually we want the raw escaped version - just escape single quotes
  const safeNew2 = newEn.replace(/'/g, "\\'");
  if (oldEn === safeNew2) return { src, changed: false, oldEn };
  const newSrc = src.replace(pattern, `$1${safeNew2}$3`);
  return { src: newSrc, changed: true, oldEn };
}

async function main() {
  let src = fs.readFileSync(DICT_PATH, 'utf8');
  let fixCount = 0;

  function applyFix(key, newEn, category) {
    const result = replaceEnValue(src, key, newEn);
    if (result.changed) {
      src = result.src;
      fixCount++;
      // Unescape for display
      const displayOld = (result.oldEn || '').replace(/\\'/g, "'");
      console.log(`  [${category}] ${key}: "${displayOld}" -> "${newEn}"`);
    }
    return result.changed;
  }

  // ════════════════════════════════════════════════════════════
  // Category 1: Garbage prefix removal
  // ════════════════════════════════════════════════════════════
  console.log('Category 1: Garbage prefix fixes');

  const garbageFixes = {
    // "it's; X" entries
    'dans':        'dance',
    'dansen':      'the dance',
    'fel':         'wrong; fault',
    'felet':       'the error; the fault',
    'lika':        'equal; alike',
    'orimlighet':  'absurdity',
    'påstås':      'to be alleged',
    'uppges':      'to be stated',
    'vara':        'to be; to last',
    'varade':      'to last',
    'varar':       'to last',
    'varit':       'to be',
    'varnade':     'to warn',
    'varnades':    'to be warned',
    'visserligen': 'indeed; admittedly',
    'vore':        'to be',
    'är':          'to be',
    'ärade':       'to honor',
    // "always; X" entries
    'gav':         'to give',
    'ge':          'to give',
    'ger':         'to give',
    'ges':         'to be given',
    'gett':        'to give',
    'känna':       'to feel; to know',
    'känner':      'to feel; to know',
    'leta':        'to search; to look for',
    'letade':      'to search; to look for',
    'uppe':        'up; awake',
    // "choice; X" entries
    'såsom':       'such as; as',
    'val':         'choice; election',
    'valet':       'the choice; the election',
  };

  for (const [key, newEn] of Object.entries(garbageFixes)) {
    applyFix(key, newEn, 'garbage');
  }

  // ════════════════════════════════════════════════════════════
  // Category 2: "?" translations
  // ════════════════════════════════════════════════════════════
  console.log('\nCategory 2: ? translation fixes');

  const qmFixes = {
    'framförda':      'presented; put forward',
    'förfallna':      'dilapidated; decayed',
    'genomförda':     'carried out; completed',
    'halva':          'half',
    'hobby':          'hobby',
    'ivriga':         'eager; keen',
    'jämställda':     'equal; on equal footing',
    'jätteglada':     'very happy; thrilled',
    'kassan':         'the cash register; the till',
    'london':         'London',
    'motstridiga':    'contradictory; conflicting',
    'oslo':           'Oslo',
    'spss':           'SPSS',
    'statistiska':    'statistical',
    'svala':          'a swallow; cool',
    'systematiska':   'systematic',
    'tacksamma':      'grateful; thankful',
    'text':           'text',
    'undersökta':     'examined; investigated',
    'uppenbara':      'obvious; evident',
    'utvalda':        'selected; chosen',
    'vetenskapliga':  'scientific',
    'ägda':           'owned',
    'ödmjuka':        'humble',
  };

  for (const [key, newEn] of Object.entries(qmFixes)) {
    applyFix(key, newEn, '?->fixed');
  }

  // ════════════════════════════════════════════════════════════
  // Category 3: Wiktionary-style definitions
  // ════════════════════════════════════════════════════════════
  console.log('\nCategory 3: Wiktionary-style fixes');

  const wiktionaryFixes = {
    'minsta':       'smallest; least',
    'omsorgsfullt': 'carefully; meticulously',
    'strängaste':   'strictest; most severe',
  };

  for (const [key, newEn] of Object.entries(wiktionaryFixes)) {
    applyFix(key, newEn, 'wiktionary');
  }

  // ════════════════════════════════════════════════════════════
  // Category 4: Genuinely wrong translations
  // ════════════════════════════════════════════════════════════
  console.log('\nCategory 4: Semantic fixes');

  const semanticFixes = {
    'enklare':         'simpler; easier',
    'företagen':       'the companies',
    'förväntansfull':  'expectant; full of anticipation',
    'lavan':           'the lava',
    'marken':          'the ground; the soil',
    'mitten':          'the middle; the center',
    'måttlig':         'moderate; modest',
    'nys':             'a sneeze',
    'nätet':           'the net; the web',
    'podd':            'a podcast',
    'räckte':          'to hand; to reach; to suffice',
    'serien':          'the series',
    'självklarhet':    'obviousness; a given',
    'herrgården':      'the manor; the mansion',
    'öden':            'fates; destinies',
    // Also fix 'vara' POS — it should be 'v' not 'n'
  };

  for (const [key, newEn] of Object.entries(semanticFixes)) {
    applyFix(key, newEn, 'semantic');
  }

  // ════════════════════════════════════════════════════════════
  // Category 5: Fix POS for 'vara' — it's a verb not a noun
  // ════════════════════════════════════════════════════════════
  console.log('\nCategory 5: POS fixes');
  // vara should be pos: 'v' not 'n'
  if (src.includes("'vara': { en: 'to be; to last', ipa: 'vɑːra', pos: 'n'")) {
    src = src.replace(
      "'vara': { en: 'to be; to last', ipa: 'vɑːra', pos: 'n'",
      "'vara': { en: 'to be; to last', ipa: 'vɑːra', pos: 'v'"
    );
    fixCount++;
    console.log('  [pos] vara: pos n -> v');
  }

  // Write file
  fs.writeFileSync(DICT_PATH, src, 'utf8');
  console.log(`\nTotal fixes applied: ${fixCount}`);
  return fixCount;
}

main().then(n => {
  console.log(`\nSWEDISH COMPLETE — ${n} fixes`);
}).catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
