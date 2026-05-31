#!/usr/bin/env node
/**
 * Apply Italian dictionary fixes from v4 analysis.
 * Handles:
 * 1. Garbled entries (?, i\, wiktionary defs) → use Google translation
 * 2. Wrong translations where Google back-translates closer → replace
 * 3. Wrong POS (marked as 'v' but should be 'n'/'adj') → fix POS too
 * 4. Verb conjugation noise → skip
 * 5. Valid synonyms → skip
 * 6. Additional "to " prefix cleanup
 */

const fs = require('fs');
const path = require('path');

const DICT_PATH = path.join(__dirname, '..', 'src', 'data', 'dictionary', 'it.ts');
const fixes = require('./output/it-semantic-v4-fixes.json');

// ── Google wrong translations (manual blacklist) ────────────────
const SKIP_WORDS = new Set([
  'farò',       // farò = I will do, not lighthouse
  'allora',     // "then, so" better than "at that time"
  'egli',       // egli = he, Google said "they"
  'buenos',     // not Italian
  'verrò',      // Google said "boar" (verrò = I will come)
  'foss',       // foss = fossi/fosse form, "ditch" is a different word
  'subito',     // "immediately" is fine, "right away" is just synonym
  'meta',       // "destination" is correct, "half" is a different word (metà)
  'morire',     // "death" is wrong POS but "die" needs "to die"
  'moto',       // both "movement" and "motorcycle" valid
  'sugo',       // "tomato sauce" is actually more specific/better than "juice"
  'piste',      // "track, trail" and "slopes" are both valid
  'doveva',     // garbled entry but Google gave "where you go" which is wrong
  'unaria',     // "air" → "unary" -- unary is wrong
  'proviene',   // "to try" is wrong for proviene but "comes from" should not have "to"
  'corso',      // "course" is right but adding "to" makes it wrong
  'nuotato',    // "to swam" is ungrammatical
  'parlato',    // "to spoke" is ungrammatical
  'insegnato',  // "to taught" is ungrammatical
  'tornerò',    // "to i'll be back" is garbled
]);

// ── Entries where dict is better or both are valid synonyms ─────
const DICT_BETTER = new Set([
  'abitare', 'aggiustare', 'addirittura', 'allegato', 'alzare', 'ampio',
  'annullare', 'badare', 'cancellare', 'compiere', 'compilare', 'concentrare',
  'condurre', 'confondere', 'cogliere', 'elaborare', 'ferire', 'molti',
  'principalmente', 'raccogliere', 'avvenire', 'richiedere', 'ordinato',
  'accomodi', 'approfittare', 'condannare', 'recitare', 'congresso',
  'avvertire', 'discreto', 'porre', 'risultare', 'sostenere', 'tendere',
  'guarire', 'marciapiede', 'passeggiare', 'passeggiata', 'ricorrere',
  'successivamente', 'ricercare', 'provocare', 'distrarre', 'maestro',
  'incomodare', 'sede', 'realizzare', 'indossare', 'tassa', 'svolgere',
  'valutare', 'superato', 'subire', 'legale', 'processo',
  'rivivere', 'ragionevole', 'miseria', 'orientale', 'generare',
  'esaurire', 'ferita', 'autorizzare', 'assomigliare', 'commerciale',
  'relativo', 'globale', 'pungente',
]);

// ── Words where POS needs correction (v → n/adj/adv/prep) ──────
const POS_FIXES = {
  'chiusi': 'adj',       // closed (adj)
  'climatico': 'adj',    // climate (adj)
  'credito': 'n',        // credit (noun)
  'divano': 'n',         // sofa (noun)
  'dovere': 'n',         // duty/obligation (noun form, but also verb - keep as-is)
  'entrambe': 'pron',    // both (pronoun)
  'entrambi': 'pron',    // both (pronoun)
  'entrata': 'n',        // entrance (noun)
  'entro': 'prep',       // within (preposition)
  'entrò': 'v',          // he/she entered (verb - keep)
  'finestra': 'n',       // window (noun)
  'fino': 'prep',        // until (preposition)
  'finora': 'adv',       // until now (adverb)
  'laffitto': 'n',       // the rent
  'lanima': 'n',         // the soul
  'lerrore': 'n',        // the error
  'lidraulico': 'n',     // the plumber
  'lingresso': 'n',      // the entrance
  'notte': 'n',          // night (noun)
  'pagella': 'n',        // report card
  'pagina': 'n',         // page
  'passaporto': 'n',     // passport
  'passato': 'n',        // past
  'passeggero': 'n',     // passenger
  'portavoce': 'n',      // spokesman
  'presa': 'n',          // socket
  'principio': 'n',      // principle
  'ritratto': 'n',       // portrait
  'salario': 'n',        // salary
  'salute': 'n',         // health
  'stadio': 'n',         // stadium
  'stagione': 'n',       // season
  'stanotte': 'adv',     // tonight
  'statua': 'n',         // statue
  'suono': 'n',          // sound
  'terrà': 'v',          // will hold (verb - keep original)
  'tessuto': 'n',        // tissue/fabric
  'testo': 'n',          // text
  'tiramisù': 'n',       // tiramisu
  'unica': 'adj',        // unique (adj)
  'unico': 'adj',        // unique (adj)
  'uscita': 'n',         // exit
  'venerdi': 'n',        // friday
  'venerdì': 'n',        // friday
  'venezia': 'n',        // Venice
  'vent': 'n',           // wind
  'ventitré': 'n',       // twenty-three
  'vento': 'n',          // wind
  'legato': 'adj',       // bound (adj)
  'stessi': 'adj',       // same (adj)
};

// ── Translation overrides (when Google is close but needs cleanup) ──
const TRANSLATION_OVERRIDES = {
  'chiusi': 'closed',
  'climatico': 'climatic',
  'divano': 'sofa',
  'entrambe': 'both (fem.)',
  'entrambi': 'both (masc.)',
  'entrata': 'entrance, entry',
  'entro': 'within, by',
  'finestra': 'window',
  'fino': 'until, up to',
  'finora': 'until now, so far',
  'notte': 'night',
  'pagella': 'report card',
  'pagina': 'page',
  'passaporto': 'passport',
  'passato': 'past',
  'passeggero': 'passenger',
  'portavoce': 'spokesman, spokesperson',
  'presa': 'socket, grip',
  'principio': 'principle, beginning',
  'ritratto': 'portrait',
  'salario': 'salary, wage',
  'salute': 'health',
  'stadio': 'stadium',
  'stagione': 'season',
  'stanotte': 'tonight',
  'statua': 'statue',
  'suono': 'sound',
  'tessuto': 'fabric, tissue',
  'testo': 'text',
  'tiramisù': 'tiramisu',
  'unica': 'unique, only (fem.)',
  'unico': 'unique, only',
  'uscita': 'exit, way out',
  'venerdi': 'Friday',
  'venerdì': 'Friday',
  'venezia': 'Venice',
  'vent': 'wind',
  'ventitré': 'twenty-three',
  'vento': 'wind',
  'laffitto': 'the rent',
  'lanima': 'the soul',
  'lerrore': 'the error',
  'lidraulico': 'the plumber',
  'lingresso': 'the entrance',
  'stessi': 'same',
  'legato': 'bound, tied',
  'credito': 'credit',
  'dovere': 'duty, must',  // It's actually both noun and verb
  'entrò': 'entered',
  'terrà': 'will hold',   // terrà = he/she will hold (tenere)
  // Additional cleanup
  'corso': 'course',
  'doppio': 'double',
  'notevole': 'remarkable, notable',
  'stazione': 'station',
  'morire': 'to die',
  'boh': "I don't know",
  'ascoltava': 'was listening',
  'riusciremo': 'we will succeed',
  'sto': 'I am',
  'sinistra': 'left (direction)',
  'proviene': 'comes from',
  'valutala': 'evaluate it',
  // Elided forms
  'lapertura': 'the opening',
  'lesperienza': 'the experience',
  'limpatto': 'the impact',
  'limportanza': 'the importance',
  'linvestimento': 'the investment',
  'lobiettivo': 'the goal, the objective',
  'lorologio': 'the clock, the watch',
  'lunica': 'the only one (fem.)',
  'unalternativa': 'an alternative',
  'unapplicazione': 'an application',
  'uninsalata': 'a salad',
  'unofferta': 'an offer',
  'unultima': 'one last',
  'unitalia': 'Italy united',
  'deuropa': 'of Europe',
  'ditalia': 'of Italy',
  'didentità': 'identity',
  'guardandola': 'looking at her',
  'inseguilo': 'chase him',
  'presentarmi': 'to introduce myself',
  'concentriamoci': "let's focus",
  'ascoltiamo': "let's listen",
  'assicuriamoci': "let's make sure",
  'preghiamo': "let's pray",
  'sediamo': "let's sit down",
  'separiamo': "let's separate",
  'divertiamo': "let's have fun",
  'addormentiamo': "let's fall asleep",
};

// ── POS overrides for elided/compound forms ─────────────────────
const EXTRA_POS_FIXES = {
  'lapertura': 'n',
  'lesperienza': 'n',
  'limpatto': 'n',
  'limportanza': 'n',
  'linvestimento': 'n',
  'lobiettivo': 'n',
  'lorologio': 'n',
  'lunica': 'adj',
  'unalternativa': 'n',
  'unapplicazione': 'n',
  'uninsalata': 'n',
  'unofferta': 'n',
  'unultima': 'adj',
  'unitalia': 'n',
  'deuropa': 'n',
  'ditalia': 'n',
  'didentità': 'n',
  'guardandola': 'v',
  'inseguilo': 'v',
  'presentarmi': 'v',
  'concentriamoci': 'v',
  'ascoltiamo': 'v',
  'assicuriamoci': 'v',
  'preghiamo': 'v',
  'sediamo': 'v',
  'separiamo': 'v',
  'divertiamo': 'v',
  'addormentiamo': 'v',
  'stazione': 'n',
  'sinistra': 'n',
  'proviene': 'v',
  'notevole': 'adj',
  'corso': 'n',
  'boh': 'interj',
  'ascoltava': 'v',
  'riusciremo': 'v',
  'sto': 'v',
  'valutala': 'v',
  'morire': 'v',
  'doppio': 'adj',
};

function isVerbFormNoise(fix) {
  if (fix.pos !== 'v') return false;
  if (POS_FIXES[fix.word]) return false; // Will fix POS separately
  if (TRANSLATION_OVERRIDES[fix.word]) return false;

  const g = fix.googleEn.toLowerCase();
  if (fix.dictEn.startsWith('to ')) {
    if (/^(i |he |she |we |they |you |it |let'?s? |was |were |am |are |had |has |have |will |would |could |should |going )/i.test(g)) return true;
    if (g.split(' ').length === 1 && /^[a-z]+(ed|es|s|ing|en|nt)$/.test(g)) return true;
    // Past participles
    const pp = ['sung','hit','bought','sold','won','flown','sworn','held','paid','gone',
      'left','driven','worn','written','spoken','taken','given','seen','done','known',
      'brought','chosen','fallen','grown','hidden','led','lost','met','read','risen',
      'sat','sent','shut','slept','stood','thrown','woken','wound','caught','dealt',
      'drawn','drunk','eaten','forgotten','frozen','hung','hurt','kept','laid','lent',
      'let','lit','meant','put','quit','said','set','shaken','shone','shot','shown',
      'slung','sped','spent','split','spread','stuck','stung','struck','strung','sunk',
      'swept','sworn','swung','torn','woven','wept','wrung'];
    if (pp.includes(g.trim())) return true;
  }
  return false;
}

// ── Main ────────────────────────────────────────────────────────
function main() {
  let src = fs.readFileSync(DICT_PATH, 'utf8');
  let applied = 0;
  let skipped = 0;
  const appliedList = [];

  for (const fix of fixes) {
    const key = fix.word;

    // Skip blacklisted
    if (SKIP_WORDS.has(key)) { skipped++; continue; }
    // Skip dict-better synonyms (only for non-garbled)
    if (fix.reason !== 'garbled' && DICT_BETTER.has(key)) { skipped++; continue; }
    // Skip verb conjugation noise
    if (fix.reason !== 'garbled' && isVerbFormNoise(fix)) { skipped++; continue; }

    const dictEn = fix.dictEn;

    // Determine new translation
    let newEn = TRANSLATION_OVERRIDES[key];
    if (!newEn) {
      let g = fix.googleEn.trim();
      // Remove subject pronouns
      g = g.replace(/^(He |She |It |I |We |They |You )/i, '');
      g = g.toLowerCase();

      // Only add "to " for actual verbs
      const actualPos = POS_FIXES[key] || EXTRA_POS_FIXES[key] || fix.pos;
      if (actualPos === 'v' && !g.startsWith('to ') && !g.startsWith("let'")) {
        g = 'to ' + g;
      }
      g = g.replace(/\.$/, '');
      newEn = g;
    }

    // Skip if identical
    if (newEn === dictEn || newEn.toLowerCase() === dictEn.toLowerCase()) { skipped++; continue; }
    if (newEn.length < 2) { skipped++; continue; }

    // Determine new POS
    const newPos = POS_FIXES[key] || EXTRA_POS_FIXES[key] || null;

    // Apply translation fix
    const eDictEn = dictEn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const eKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const safe = newEn.replace(/'/g, "\\'");

    const re1 = new RegExp(`('${eKey}':\\s*\\{[^}]*en:\\s*')${eDictEn}(')`);
    const re2 = new RegExp(`("${eKey}":\\s*\\{[^}]*en:\\s*')${eDictEn}(')`);

    let matched = false;
    if (re1.test(src)) {
      src = src.replace(re1, `$1${safe}$2`);
      matched = true;
    } else if (re2.test(src)) {
      src = src.replace(re2, `$1${safe}$2`);
      matched = true;
    }

    // Apply POS fix if needed
    if (matched && newPos) {
      const posRe1 = new RegExp(`('${eKey}':\\s*\\{[^}]*pos:\\s*')([^']*)(')`);
      const posRe2 = new RegExp(`("${eKey}":\\s*\\{[^}]*pos:\\s*')([^']*)(')`);
      if (posRe1.test(src)) {
        src = src.replace(posRe1, `$1${newPos}$3`);
      } else if (posRe2.test(src)) {
        src = src.replace(posRe2, `$1${newPos}$3`);
      }
    }

    if (matched) {
      applied++;
      appliedList.push({ word: key, old: dictEn, new: newEn, pos: newPos || fix.pos, reason: fix.reason });
    } else {
      skipped++;
    }
  }

  // Write
  fs.writeFileSync(DICT_PATH, src);
  console.log(`Applied: ${applied}`);
  console.log(`Skipped: ${skipped}`);

  // Print all
  console.log(`\n=== ALL ${applied} FIXES ===`);
  appliedList.forEach(f => console.log(`  ${f.word} (${f.pos}): "${f.old}" → "${f.new}" [${f.reason}]`));

  return applied;
}

const n = main();
console.log(`\nITALIAN COMPLETE — ${n} fixes`);
