// Accurate Portuguese dictionary coverage checker
// Simulates the full lookupWord() logic from pt.ts
const fs = require('fs');
const path = require('path');

const deck = require('../src/data/portuguese/deck.json');
const dictContent = fs.readFileSync(path.join(__dirname, '../src/data/dictionary/pt.ts'), 'utf8');

// ── Extract ALL dictionary keys using permissive regex ──
const dictKeys = new Set();
const lines = dictContent.split('\n');
const dictStart = lines.findIndex(l => l.includes('const dictionary: Record<string, DictEntry>'));
for (let i = dictStart; i < lines.length; i++) {
  const line = lines[i];
  const qm = line.match(/^\s+"([^"]+)":\s*\{/);
  if (qm) { dictKeys.add(qm[1].toLowerCase()); continue; }
  const bm = line.match(/^\s+([^\s:]+):\s*\{/);
  if (bm && !bm[1].startsWith('//') && !bm[1].startsWith('}')) {
    dictKeys.add(bm[1].toLowerCase());
  }
}

// ── Extract IRREGULAR_MAP ──
const irregMap = {};
const irregSection = dictContent.match(/const IRREGULAR_MAP[\s\S]*?^};/m);
if (irregSection) {
  // Match both bare and quoted keys - use permissive pattern for accented chars
  const re = /(?:^|[\s,])([a-zA-ZÀ-ÖØ-öø-ÿ][a-zA-ZÀ-ÖØ-öø-ÿ0-9]*)\s*:\s*'([^']+)'/g;
  let m;
  while ((m = re.exec(irregSection[0])) !== null) {
    irregMap[m[1].toLowerCase()] = m[2].toLowerCase();
  }
  // Also match quoted keys like "é"
  const re2 = /"([^"]+)"\s*:\s*'([^']+)'/g;
  while ((m = re2.exec(irregSection[0])) !== null) {
    irregMap[m[1].toLowerCase()] = m[2].toLowerCase();
  }
}

// ── Extract CONTRACTION_MAP ──
const contrMap = {};
const contrSection = dictContent.match(/const CONTRACTION_MAP[\s\S]*?^};/m);
if (contrSection) {
  const re = /'([^']+)'\s*:\s*\[([^\]]+)\]/g;
  let m;
  while ((m = re.exec(contrSection[0])) !== null) {
    const parts = m[2].match(/'([^']+)'/g);
    if (parts) {
      contrMap[m[1].toLowerCase()] = parts.map(p => p.replace(/'/g, '').toLowerCase());
    }
  }
}

function has(w) { return dictKeys.has(w); }

function reverseVerb(form) {
  const arSuffixes = [
    ['o','ar'],['as','ar'],['a','ar'],['amos','ar'],['am','ar'],
    ['ei','ar'],['aste','ar'],['ou','ar'],['aram','ar'],
    ['ava','ar'],['avas','ar'],['ávamos','ar'],['avam','ar'],
    ['e','ar'],['es','ar'],['emos','ar'],['em','ar'],
    ['aria','ar'],['arias','ar'],['aríamos','ar'],['ariam','ar'],
    ['arei','ar'],['ará','ar'],['aremos','ar'],['arão','ar'],
    ['ando','ar'],['ado','ar'],['ada','ar'],
    ['asse','ar'],['assem','ar'],['ássemos','ar'],
  ];
  const erSuffixes = [
    ['o','er'],['es','er'],['e','er'],['emos','er'],['em','er'],
    ['i','er'],['este','er'],['eu','er'],['eram','er'],
    ['ia','er'],['ias','er'],['íamos','er'],['iam','er'],
    ['a','er'],['as','er'],['amos','er'],['am2','er'],
    ['eria','er'],['erias','er'],['eríamos','er'],['eriam','er'],
    ['erei','er'],['erá','er'],['eremos','er'],['erão','er'],
    ['endo','er'],['ido','er'],['ida','er'],
    ['esse','er'],['essem','er'],['êssemos','er'],
  ];
  const irSuffixes = [
    ['o','ir'],['es','ir'],['e','ir'],['imos','ir'],['em','ir'],
    ['i','ir'],['iste','ir'],['iu','ir'],['iram','ir'],
    ['ia','ir'],['ias','ir'],['íamos','ir'],['iam','ir'],
    ['a','ir'],['as','ir'],['amos','ir'],
    ['iria','ir'],['irias','ir'],['iríamos','ir'],['iriam','ir'],
    ['irei','ir'],['irá','ir'],['iremos','ir'],['irão','ir'],
    ['indo','ir'],['ido','ir'],['ida','ir'],
    ['isse','ir'],['issem','ir'],['íssemos','ir'],
  ];

  for (const [suffix, ending] of arSuffixes) {
    if (form.endsWith(suffix) && form.length > suffix.length + 1) {
      const candidate = form.slice(0, -suffix.length) + ending;
      if (has(candidate)) return candidate;
    }
  }
  for (const [suffix, ending] of erSuffixes) {
    if (form.endsWith(suffix) && form.length > suffix.length + 1) {
      const candidate = form.slice(0, -suffix.length) + ending;
      if (has(candidate)) return candidate;
    }
  }
  for (const [suffix, ending] of irSuffixes) {
    if (form.endsWith(suffix) && form.length > suffix.length + 1) {
      const candidate = form.slice(0, -suffix.length) + ending;
      if (has(candidate)) return candidate;
    }
  }
  return null;
}

function lookupWord(raw) {
  let clean = raw.toLowerCase().replace(/[¿¡.,!?;:"""\u2018\u2019()—–«»\d/]/g, '');
  if (!clean) return null;

  // Direct match
  if (has(clean)) return 'direct';

  // Irregular verb form map
  if (irregMap[clean] && has(irregMap[clean])) return 'irregular';

  // Contraction handling
  if (contrMap[clean]) {
    for (const part of contrMap[clean]) {
      if (has(part)) return 'contraction';
    }
  }

  // Hyphenated words
  if (clean.includes('-')) {
    const parts = clean.split('-');
    const base = parts[0];
    if (has(base)) return 'hyphen-base';
    if (irregMap[base] && has(irregMap[base])) return 'hyphen-irreg';
    const inf = reverseVerb(base);
    if (inf) return 'hyphen-verb';
    const deaccented = base.replace(/á/g, 'a').replace(/ê/g, 'e').replace(/ô/g, 'o');
    if (deaccented !== base) {
      if (has(deaccented)) return 'hyphen-deacc';
      if (has(deaccented + 'r')) return 'hyphen-deacc-r';
    }
    const last = parts[parts.length - 1];
    if (has(last)) return 'hyphen-last';
    for (const p of parts) {
      const stripped = p.replace(/s$/, '');
      if (has(stripped)) return 'hyphen-strip';
      if (has(p)) return 'hyphen-part';
    }
    const joined = clean.replace(/-/g, '');
    if (has(joined)) return 'hyphen-join';
  }

  // Verb form reversal
  const inf = reverseVerb(clean);
  if (inf) return 'verb-reverse';

  // Spelling changes (ç, gu, qu)
  if (clean.endsWith('ço') || clean.endsWith('ça') || clean.endsWith('çam') || clean.endsWith('ças') || clean.endsWith('çamos')) {
    const stem = clean.replace(/ç([oa])/, 'c$1').replace(/çam/, 'cam').replace(/ças/, 'cas').replace(/çamos/, 'camos');
    const rev = reverseVerb(stem);
    if (rev) return 'spell-ç';
  }
  if (clean.includes('ç')) {
    const rev = reverseVerb(clean);
    if (rev) return 'spell-ç2';
    const withCedilla = clean.replace(/cei$/, 'çar').replace(/ce$/, 'çar').replace(/cem$/, 'çar');
    if (withCedilla !== clean && has(withCedilla)) return 'spell-ç3';
  }
  if (clean.endsWith('cei') && clean.length > 4) {
    const stem = clean.slice(0, -3);
    if (has(stem + 'çar')) return 'spell-ç4';
  }
  if (clean.endsWith('ce') && clean.length > 3) {
    const stem = clean.slice(0, -2);
    if (has(stem + 'çar')) return 'spell-ç5';
  }
  if (clean.endsWith('guei') || clean.endsWith('gue') || clean.endsWith('guem') || clean.endsWith('gues')) {
    const stem = clean.replace(/gu(e[ims]?)$/, 'g$1');
    const rev = reverseVerb(stem);
    if (rev) return 'spell-gu';
    const stem2 = clean.replace(/guei$/, 'gar').replace(/gue$/, 'gar').replace(/guem$/, 'gar').replace(/gues$/, 'gar');
    if (has(stem2)) return 'spell-gu2';
  }
  if (clean.endsWith('quei') || clean.endsWith('que') || clean.endsWith('quem')) {
    const stem2 = clean.replace(/quei$/, 'car').replace(/que$/, 'car').replace(/quem$/, 'car');
    if (has(stem2)) return 'spell-qu';
  }

  // Present subjunctive for -er/-ir verbs
  if (clean.endsWith('am') && clean.length > 4) {
    const stem = clean.slice(0, -2);
    if (has(stem + 'er')) return 'subj-er';
    if (has(stem + 'ir')) return 'subj-ir';
  }
  if (clean.endsWith('amos') && clean.length > 5) {
    const stem = clean.slice(0, -4);
    if (has(stem + 'er')) return 'subj-amos';
    if (has(stem + 'ir')) return 'subj-amos-ir';
  }

  // Personal infinitive
  if (clean.endsWith('arem') && clean.length > 5) {
    const base = clean.slice(0, -4) + 'ar';
    if (has(base)) return 'pers-inf-ar';
  }
  if (clean.endsWith('erem') && clean.length > 5) {
    const base = clean.slice(0, -4) + 'er';
    if (has(base)) return 'pers-inf-er';
  }
  if (clean.endsWith('irem') && clean.length > 5) {
    const base = clean.slice(0, -4) + 'ir';
    if (has(base)) return 'pers-inf-ir';
  }

  // -ear verbs
  if (clean.endsWith('eia') || clean.endsWith('eio') || clean.endsWith('eiam') || clean.endsWith('eias')) {
    const stem = clean.replace(/ei[oa]s?$/, '').replace(/eiam$/, '');
    if (has(stem + 'ear')) return 'ear-verb';
  }

  // -mente adverb
  if (clean.endsWith('mente') && clean.length > 7) {
    const adj = clean.slice(0, -5);
    if (has(adj)) return 'adverb';
    if (adj.endsWith('a')) {
      const masc = adj.slice(0, -1) + 'o';
      if (has(masc)) return 'adverb-masc';
    }
  }

  // Plural stripping
  if (clean.endsWith('ões')) {
    const sing = clean.slice(0, -3) + 'ão';
    if (has(sing)) return 'plural-ões';
  }
  if (clean.endsWith('ais')) {
    const sing = clean.slice(0, -3) + 'al';
    if (has(sing)) return 'plural-ais';
  }
  if (clean.endsWith('éis')) {
    const sing = clean.slice(0, -3) + 'el';
    if (has(sing)) return 'plural-éis';
    const sing2 = clean.slice(0, -3) + 'il';
    if (has(sing2)) return 'plural-éis2';
  }
  if (clean.endsWith('eis') && clean.length > 4) {
    const sing = clean.slice(0, -3) + 'il';
    if (has(sing)) return 'plural-eis';
    const sing2 = clean.slice(0, -3) + 'el';
    if (has(sing2)) return 'plural-eis2';
  }
  if (clean.endsWith('is') && clean.length > 3) {
    const sing = clean.slice(0, -2) + 'l';
    if (has(sing)) return 'plural-is';
  }
  if (clean.endsWith('ns') && clean.length > 3) {
    const sing = clean.slice(0, -2) + 'm';
    if (has(sing)) return 'plural-ns';
  }
  if (clean.endsWith('zes') && clean.length > 4) {
    const sing = clean.slice(0, -2);
    if (has(sing)) return 'plural-zes';
  }
  if (clean.endsWith('res') && clean.length > 4) {
    const sing = clean.slice(0, -2);
    if (has(sing)) return 'plural-res';
  }
  if (clean.endsWith('eses') && clean.length > 4) {
    const sing = clean.slice(0, -4) + 'ês';
    if (has(sing)) return 'plural-eses';
  }
  if (clean.endsWith('es') && clean.length > 3) {
    const sing = clean.slice(0, -2);
    if (has(sing)) return 'plural-es';
  }
  if (clean.endsWith('s') && clean.length > 2) {
    const sing = clean.slice(0, -1);
    if (has(sing)) return 'plural-s';
    if (sing.endsWith('a') && sing.length > 3) {
      const masc = sing.slice(0, -1) + 'o';
      if (has(masc)) return 'plural-fem-masc';
    }
  }

  // Feminine → masculine
  if (clean.endsWith('a') && clean.length > 3) {
    const masc = clean.slice(0, -1) + 'o';
    if (has(masc)) return 'fem-masc';
  }
  if (clean.endsWith('ora') && clean.length > 4) {
    const masc = clean.slice(0, -1);
    if (has(masc)) return 'fem-ora';
  }
  if (clean.endsWith('oras') && clean.length > 5) {
    const masc = clean.slice(0, -2);
    if (has(masc)) return 'fem-oras';
  }
  if (clean.endsWith('esa') && clean.length > 4) {
    const masc = clean.slice(0, -3) + 'ês';
    if (has(masc)) return 'fem-esa';
  }
  if (clean.endsWith('esas') && clean.length > 5) {
    const masc = clean.slice(0, -4) + 'ês';
    if (has(masc)) return 'fem-esas';
  }
  if (clean.endsWith('eira') && clean.length > 5) {
    const masc = clean.slice(0, -1) + 'o';
    if (has(masc)) return 'fem-eira';
  }

  // Superlative
  if (clean.endsWith('íssima') || clean.endsWith('íssimo')) {
    const base = clean.replace(/íssim[oa]$/, '');
    if (has(base + 'o')) return 'superlative';
    if (has(base)) return 'superlative2';
  }

  // Diminutive
  if (clean.endsWith('inho') || clean.endsWith('inha')) {
    const base = clean.slice(0, -4);
    if (has(base)) return 'diminutive';
    if (has(base + 'o')) return 'diminutive-o';
    if (has(base + 'a')) return 'diminutive-a';
    if (has(base + 'e')) return 'diminutive-e';
    if (base.endsWith('z')) {
      const innerBase = base.slice(0, -1);
      if (has(innerBase)) return 'diminutive-z';
      if (has(innerBase + 'o')) return 'diminutive-zo';
      if (has(innerBase + 'ão')) return 'diminutive-zão';
    }
  }

  // Past participle → infinitive
  if (clean.endsWith('ado') || clean.endsWith('ada') || clean.endsWith('ados') || clean.endsWith('adas')) {
    const stem = clean.replace(/ad[oa]s?$/, '');
    if (has(stem + 'ar')) return 'participle-ar';
  }
  if (clean.endsWith('ido') || clean.endsWith('ida') || clean.endsWith('idos') || clean.endsWith('idas')) {
    const stem = clean.replace(/id[oa]s?$/, '');
    if (has(stem + 'ir')) return 'participle-ir';
    if (has(stem + 'er')) return 'participle-er';
  }
  if (clean.endsWith('ído') || clean.endsWith('ída') || clean.endsWith('ídos') || clean.endsWith('ídas')) {
    const stem = clean.replace(/íd[oa]s?$/, '');
    if (has(stem + 'ir')) return 'participle-ír';
    if (has(stem + 'uir')) return 'participle-uir';
  }
  if (clean.endsWith('erto') || clean.endsWith('erta')) {
    const stem = clean.replace(/ert[oa]$/, '');
    if (has(stem + 'rir')) return 'participle-erto';
  }
  if (clean.endsWith('rito') || clean.endsWith('rita')) {
    const stem = clean.replace(/rit[oa]$/, '');
    if (has(stem + 'rever')) return 'participle-rito';
  }
  if (clean.endsWith('enso') || clean.endsWith('ensa') || clean.endsWith('ensos') || clean.endsWith('ensas')) {
    const stem = clean.replace(/ens[oa]s?$/, '');
    if (has(stem + 'ender')) return 'participle-enso';
  }

  // Pluperfect: -ara → -ar, -era → -er, -ira → -ir
  if (clean.endsWith('ara') && clean.length > 4) {
    if (has(clean.slice(0, -3) + 'ar')) return 'pluperfect-ar';
  }
  if (clean.endsWith('era') && clean.length > 4) {
    if (has(clean.slice(0, -3) + 'er')) return 'pluperfect-er';
  }
  if (clean.endsWith('ira') && clean.length > 4) {
    if (has(clean.slice(0, -3) + 'ir')) return 'pluperfect-ir';
  }
  if (clean.endsWith('êra') && clean.length > 4) {
    const cand = clean.slice(0, -3) + 'er';
    if (has(cand)) return 'pluperfect-êr';
    const deacc = clean.replace(/ê/g, 'e');
    if (has(deacc.slice(0, -3) + 'er')) return 'pluperfect-ê2';
  }
  if (clean.endsWith('íra') && clean.length > 4) {
    const cand = clean.slice(0, -3) + 'ir';
    if (has(cand)) return 'pluperfect-ír';
    const deacc = clean.replace(/í/g, 'i');
    if (has(deacc.slice(0, -3) + 'ir')) return 'pluperfect-í2';
  }

  return null;
}

// ── Extract all deck words ──
const words = new Map();
deck.forEach(card => {
  const text = card.target;
  if (!text) return;
  const tokens = text.toLowerCase()
    .replace(/[.,!?;:""()¡¿…—–\-«»\d/]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 0);
  tokens.forEach(w => {
    words.set(w, (words.get(w) || 0) + 1);
  });
});

console.log('Total unique deck words:', words.size);
console.log('Dict keys (including irregular+contraction):', dictKeys.size);
console.log('Irregular map entries:', Object.keys(irregMap).length);
console.log('Contraction map entries:', Object.keys(contrMap).length);

let resolved = 0;
let directMatches = 0;
const missing = [];
const resolutionTypes = {};

for (const [word, count] of words) {
  const result = lookupWord(word);
  if (result) {
    resolved++;
    if (result === 'direct') directMatches++;
    resolutionTypes[result] = (resolutionTypes[result] || 0) + 1;
  } else {
    missing.push({ word, count });
  }
}

console.log('\n=== RESOLUTION BREAKDOWN ===');
const sortedTypes = Object.entries(resolutionTypes).sort((a, b) => b[1] - a[1]);
for (const [type, count] of sortedTypes) {
  console.log(`  ${type}: ${count}`);
}

console.log('\n=== COVERAGE ===');
console.log('Direct matches:', directMatches);
console.log('Total resolved:', resolved);
console.log('Effective coverage:', (resolved / words.size * 100).toFixed(1) + '%');
console.log('Missing:', missing.length);

missing.sort((a, b) => b.count - a.count);

console.log('\nMissing 5+:', missing.filter(w => w.count >= 5).length);
console.log('Missing 2-4:', missing.filter(w => w.count >= 2 && w.count < 5).length);
console.log('Missing 1:', missing.filter(w => w.count === 1).length);

console.log('\n=== TOP 80 TRULY MISSING ===');
missing.slice(0, 80).forEach(w => console.log(`${w.word} (${w.count})`));
