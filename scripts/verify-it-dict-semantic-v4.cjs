#!/usr/bin/env node
/**
 * Italian dictionary semantic verification v4 - FINAL.
 *
 * Key insight: translate BOTH dict-en and google-en back to Italian.
 * Replace only when google-en back-translates CLOSER to the Italian word
 * than dict-en does. This eliminates synonym-swapping.
 *
 * Also: garbled entries (?, i\, wiktionary defs) always get replaced.
 * Also: skip verb conjugation noise (dict gives infinitive, Google gives tense).
 */

const fs = require('fs');
const https = require('https');
const path = require('path');

const DICT_PATH = path.join(__dirname, '..', 'src', 'data', 'dictionary', 'it.ts');
const API_KEY = 'AIzaSyBImkCNYcI1m9mloUNcYcDN2L5dQZwADzI';

const FUNCTION_WORDS = new Set([
  'il','lo','la','i','gli','le','l','un','uno','una',
  'a','di','da','in','con','su','per','tra','fra',
  'al','allo','alla','ai','agli','alle',
  'del','dello','della','dei','degli','delle',
  'dal','dallo','dalla','dai','dagli','dalle',
  'nel','nello','nella','nei','negli','nelle',
  'sul','sullo','sulla','sui','sugli','sulle',
  'e','ed','o','ma','però','che','se','né','oppure',
  'perché','quando','mentre','come','dove','anche','pure',
  'dunque','quindi','eppure','anzi','cioè','ossia',
  'io','tu','lui','lei','noi','voi','loro','esso','essa',
  'mi','ti','ci','vi','si','lo','la','li','le','ne',
  'me','te','sé','ce','ve',
  'questo','questa','questi','queste',
  'quello','quella','quelli','quelle',
  'chi','cui','quale','quali',
  'mio','mia','miei','mie','tuo','tua','tuoi','tue',
  'suo','sua','suoi','sue',
  'nostro','nostra','nostri','nostre',
  'vostro','vostra','vostri','vostre',
  'non','no','sì','già','più','molto','poco','mai',
  'sempre','ancora','solo','proprio','così','qui','qua',
  'lì','là','ora','adesso','poi','prima','dopo',
  'c','n','d','ecco',
  'è','sono','sei','siamo','siete',
  'ho','hai','ha','abbiamo','avete','hanno',
  'era','ero','eri','eravamo','eravate','erano',
  'sarà','sarò','sarai','saremo','sarete','saranno',
  'sia','siano','siate',
  'stato','stata','stati','state',
  'avevo','avevi','aveva','avevamo','avevate','avevano',
  'avrà','avrò','avrai','avremo','avrete','avranno',
  'abbia','abbiano','abbiate','abbi',
  'fa','fai','fanno','facciamo','fate',
  'do','dai','dà','diamo','danno','date',
  'sta','stai','stanno','stiamo',
  'può','posso','puoi','possiamo','possono','potete',
  'vuoi','vuole','voglio','vogliamo','volete','vogliono',
  'deve','devo','devi','dobbiamo','devono','dovete',
  'va','vai','andiamo','vanno','andate',
  'viene','vengo','vieni','veniamo','vengono','venite',
]);

function parseDictionary(src) {
  const entries = {};
  const re = /^\s*'([^']+)':\s*\{([^}]+)\}/gm;
  const re2 = /^\s*"([^"]+)":\s*\{([^}]+)\}/gm;
  let m;
  while ((m = re.exec(src)) !== null) {
    const key = m[1], body = m[2];
    const enM = body.match(/en:\s*'([^']*)'/) || body.match(/en:\s*"([^"]*)"/);
    const posM = body.match(/pos:\s*'([^']*)'/);
    if (enM) entries[key] = { en: enM[1], pos: posM ? posM[1] : '' };
  }
  while ((m = re2.exec(src)) !== null) {
    const key = m[1], body = m[2];
    const enM = body.match(/en:\s*'([^']*)'/) || body.match(/en:\s*"([^"]*)"/);
    const posM = body.match(/pos:\s*'([^']*)'/);
    if (enM) entries[key] = { en: enM[1], pos: posM ? posM[1] : '' };
  }
  return entries;
}

function googleTranslateBatch(words, src, tgt) {
  return new Promise((resolve, reject) => {
    const qParams = words.map(w => `q=${encodeURIComponent(w)}`).join('&');
    const url = `https://translation.googleapis.com/language/translate/v2?${qParams}&source=${src}&target=${tgt}&key=${API_KEY}&format=text`;
    https.get(url, { timeout: 30000 }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const j = JSON.parse(data);
          if (j.error) { reject(new Error(j.error.message)); return; }
          resolve(j.data.translations.map(t => t.translatedText));
        } catch (e) { reject(e); }
      });
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function batchTranslate(words, src, tgt, label) {
  const BS = 80, results = {};
  const batches = [];
  for (let i = 0; i < words.length; i += BS) batches.push(words.slice(i, i + BS));
  console.log(`  ${label}: ${batches.length} batches (${words.length} words)`);
  for (let bi = 0; bi < batches.length; bi++) {
    const b = batches[bi];
    try {
      const r = await googleTranslateBatch(b, src, tgt);
      for (let j = 0; j < b.length; j++) results[b[j]] = r[j];
    } catch (err) {
      await new Promise(r => setTimeout(r, 2000));
      try {
        const r = await googleTranslateBatch(b, src, tgt);
        for (let j = 0; j < b.length; j++) results[b[j]] = r[j];
      } catch (e2) { console.error(`    Batch ${bi+1} failed twice`); }
    }
    if ((bi+1)%10===0||bi===batches.length-1) console.log(`    ${bi+1}/${batches.length}`);
    if (bi < batches.length-1) await new Promise(r => setTimeout(r, 80));
  }
  return results;
}

const STOP = new Set(['a','an','the','to','of','in','on','at','for','and','or','but',
  'is','are','was','were','be','been','being','it','its','he','she','they','we','you',
  'i','me','my','your','his','her','their','our','us','them','do','does','did','will',
  'would','can','could','shall','should','may','might','must','have','has','had',
  'not','no','up','out','off','by','with','from','as','this','that','these','those',
  'some','any','all','each','every','very','so','too','also','just','more','most',
  'own','other','one','oneself','something','someone','thing']);

function contentWords(t) {
  if (!t) return [];
  return t.toLowerCase().replace(/[().,!?;:"""''\/\-–—]/g,' ')
    .split(/\s+/).filter(w => w.length > 1 && !STOP.has(w));
}

function stem(w) {
  w = w.toLowerCase();
  for (const s of ['ation','tion','sion','ness','ment','able','ible','ing','ous','ive','ful','less','ally','ly','ed','er','est','ies','es','s']) {
    if (w.endsWith(s) && w.length > s.length + 2) { w = w.slice(0, -s.length); break; }
  }
  return w;
}

function wordsMatch(t1, t2) {
  const w1 = contentWords(t1), w2 = contentWords(t2);
  if (w1.length===0 || w2.length===0) return true;
  const s1 = new Set(w1.map(stem)), s2 = new Set(w2.map(stem));
  for (const a of s1) {
    if (a.length<3) continue;
    for (const b of s2) {
      if (b.length<3) continue;
      if (a===b) return true;
      if (a.length>=4 && b.length>=4 && a.slice(0,4)===b.slice(0,4)) return true;
      if (a.length>=4 && b.length>=4 && (a.includes(b)||b.includes(a))) return true;
    }
  }
  return false;
}

function normalize(it) {
  return it.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z]/g,'');
}

function italianCloseness(backIt, originalIt) {
  const a = normalize(backIt), b = normalize(originalIt);
  if (a === b) return 1.0;
  // Shared prefix ratio
  let shared = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] === b[i]) shared++; else break;
  }
  const prefixRatio = shared / Math.max(a.length, b.length);
  // If first 4+ chars match, high closeness
  if (shared >= 5) return 0.9;
  if (shared >= 4) return 0.8;
  if (shared >= 3) return 0.6;
  return prefixRatio;
}

function isGarbage(en, itWord) {
  if (!en || !en.trim()) return true;
  const cl = en.toLowerCase().replace(/[^a-zàèéìòù]/g,'');
  const it = itWord.toLowerCase().replace(/[^a-zàèéìòù]/g,'');
  if (cl === it) return true;
  if (/[àèéìòùА-я]/.test(en)) return true;
  if (en.length > 60) return true;
  return false;
}

function isDictGarbled(en) {
  if (en === '?') return true;
  if (en.includes('i\\')) return true;
  if (/^[a-z]{1,2}$/.test(en.trim())) return true;
  if (/\b(form of|variant of|plural of|diminutive of)\b/i.test(en)) return true;
  if (/\b(town|city|village|municipality|commune) (in|of|near)\b/i.test(en)) return true;
  if (/\bSiena\b|\bTuscany\b|\bLombardy\b|\bVeneto\b|\bCampania\b/i.test(en)) return true;
  if (/^(nonstandard|colloquial|archaic|obsolete|dialectal)/i.test(en)) return true;
  if (/apocopic/i.test(en)) return true;
  if (/^a (female|male) given/i.test(en)) return true;
  return false;
}

function isVerbConjNoise(dictEn, googleEn, pos) {
  // If dict gives infinitive ("to X") and Google gives conjugated form, skip
  if (!dictEn.startsWith('to ') || pos !== 'v') return false;
  const g = googleEn.toLowerCase();
  // Starts with pronoun + verb
  if (/^(i |he |she |we |they |you |it |let'?s? |was |were |had |has |have |will |would |could |should |am |are )/i.test(g)) return true;
  // Single conjugated English word
  if (g.split(' ').length === 1 && /^[a-z]+(ed|es|s|ing|en|nt)$/.test(g)) return true;
  return false;
}

function cleanTranslation(en, pos) {
  let c = en.trim();
  c = c.replace(/^(he|she|it|i|we|they|you|let'?s?)\s+/i, '');
  c = c.toLowerCase();
  if (pos === 'v' && !c.startsWith('to ')) c = 'to ' + c;
  c = c.replace(/\.$/, '');
  return c;
}

async function main() {
  console.log('Reading dictionary...');
  const src = fs.readFileSync(DICT_PATH, 'utf8');
  const entries = parseDictionary(src);
  const allKeys = Object.keys(entries);
  console.log(`Parsed ${allKeys.length} entries`);

  const toCheck = allKeys.filter(k => !FUNCTION_WORDS.has(k));
  console.log(`Checking ${toCheck.length} entries\n`);

  // Phase 1: Forward IT→EN
  console.log('Phase 1: Forward (IT→EN)');
  const forward = await batchTranslate(toCheck, 'it', 'en', 'IT→EN');

  // Find candidates
  const garbled = [];
  const mismatches = [];
  let matched = 0;

  for (const key of toCheck) {
    const dictEn = entries[key].en;
    const googleEn = forward[key];
    if (!googleEn) continue;
    if (isGarbage(googleEn, key)) continue;

    if (isDictGarbled(dictEn)) {
      garbled.push({ word: key, dictEn, googleEn, pos: entries[key].pos });
      continue;
    }

    if (wordsMatch(dictEn, googleEn)) { matched++; continue; }
    if (isVerbConjNoise(dictEn, googleEn, entries[key].pos)) { matched++; continue; }

    mismatches.push({ word: key, dictEn, googleEn, pos: entries[key].pos });
  }

  console.log(`\nMatched: ${matched}`);
  console.log(`Garbled: ${garbled.length}`);
  console.log(`Mismatches: ${mismatches.length}`);

  // Phase 2: DUAL back-translation
  // Back-translate BOTH dictEn AND googleEn to Italian
  // Only replace if googleEn back-translates CLOSER to original Italian
  console.log(`\nPhase 2: Dual back-translation for ${mismatches.length} mismatches`);

  const dictEnInputs = mismatches.map(m => {
    let en = m.dictEn;
    if (en.startsWith('to ')) en = en.slice(3);
    return en.split(',')[0].split(';')[0].trim();
  });
  const googleEnInputs = mismatches.map(m => {
    let en = m.googleEn;
    if (en.startsWith('to ')) en = en.slice(3);
    return en.split(',')[0].split(';')[0].trim();
  });

  // Combine both for fewer API calls
  const allBackInputs = [...new Set([...dictEnInputs, ...googleEnInputs])];
  console.log(`  Unique back-translate inputs: ${allBackInputs.length}`);

  const backResults = await batchTranslate(allBackInputs, 'en', 'it', 'EN→IT (back)');

  // Phase 3: Compare closeness
  console.log(`\nPhase 3: Comparing closeness...`);
  const fixes = [...garbled.map(g => ({ ...g, reason: 'garbled' }))];
  let savedBySynonym = 0;
  let googleBetter = 0;

  for (let i = 0; i < mismatches.length; i++) {
    const mm = mismatches[i];
    const dictBack = backResults[dictEnInputs[i]];
    const googleBack = backResults[googleEnInputs[i]];

    const dictCloseness = dictBack ? italianCloseness(dictBack, mm.word) : 0;
    const googleCloseness = googleBack ? italianCloseness(googleBack, mm.word) : 0;

    // Only replace if Google's back-translation is STRICTLY closer
    if (googleCloseness > dictCloseness + 0.05) {
      fixes.push({ ...mm, reason: 'google-closer', dictClose: dictCloseness, googleClose: googleCloseness });
      googleBetter++;
    } else {
      savedBySynonym++;
    }
  }

  console.log(`Google closer (replace): ${googleBetter}`);
  console.log(`Dict valid (keep): ${savedBySynonym}`);
  console.log(`Total fixes: ${fixes.length}`);

  // Phase 4: Apply
  console.log(`\nPhase 4: Applying ${fixes.length} fixes...`);
  let fixedSrc = src;
  let applied = 0;

  for (const fix of fixes) {
    const key = fix.word;
    const dictEn = fix.dictEn;
    let newEn = cleanTranslation(fix.googleEn, fix.pos);

    if (newEn === dictEn || newEn.toLowerCase() === dictEn.toLowerCase()) continue;
    if (newEn.length < 2) continue;

    const eDictEn = dictEn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const eKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const re1 = new RegExp(`('${eKey}':\\s*\\{[^}]*en:\\s*')${eDictEn}(')`);
    const re2 = new RegExp(`("${eKey}":\\s*\\{[^}]*en:\\s*')${eDictEn}(')`);

    const safe = newEn.replace(/'/g, "\\'");

    if (re1.test(fixedSrc)) {
      fixedSrc = fixedSrc.replace(re1, `$1${safe}$2`);
      applied++;
    } else if (re2.test(fixedSrc)) {
      fixedSrc = fixedSrc.replace(re2, `$1${safe}$2`);
      applied++;
    }
  }

  console.log(`Applied: ${applied}`);

  if (applied > 0) {
    fs.writeFileSync(DICT_PATH, fixedSrc);
    console.log(`Wrote to ${DICT_PATH}`);
  }

  // Save report
  const outPath = path.join(__dirname, 'output', 'it-semantic-v4-fixes.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(fixes, null, 2));

  console.log(`\n=== GARBLED FIXES (${garbled.length}) ===`);
  garbled.slice(0, 20).forEach(f => console.log(`  ${f.word}: "${f.dictEn}" → "${f.googleEn}"`));

  console.log(`\n=== GOOGLE-CLOSER FIXES (${googleBetter}) ===`);
  fixes.filter(f=>f.reason==='google-closer').slice(0,40).forEach(f =>
    console.log(`  ${f.word}: "${f.dictEn}" → "${f.googleEn}" [dict=${f.dictClose?.toFixed(2)} google=${f.googleClose?.toFixed(2)}]`)
  );

  console.log(`\n=== SUMMARY ===`);
  console.log(`Total entries: ${allKeys.length}`);
  console.log(`Checked: ${toCheck.length}`);
  console.log(`Direct matches: ${matched}`);
  console.log(`Garbled fixed: ${garbled.length}`);
  console.log(`Google-closer fixed: ${googleBetter}`);
  console.log(`Saved by synonym: ${savedBySynonym}`);
  console.log(`Applied: ${applied}`);

  return applied;
}

main().then(n => {
  console.log(`\nITALIAN COMPLETE — ${n} fixes`);
}).catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
