#!/usr/bin/env node
/* Non-grammar tip detector.
 *
 * Flags grammar-field tips that are actually idiom / vocab / cultural
 * notes — i.e. content that describes a specific fixed phrase rather
 * than a productive grammatical rule.
 *
 * Conservative by default: prints counts + samples; --fix strips matched
 * tips entirely. Run a dry-count first and eyeball samples before --fix.
 *
 *   node scripts/non-grammar-detect.cjs               # counts across all langs
 *   node scripts/non-grammar-detect.cjs french        # deep dive (every flag)
 *   node scripts/non-grammar-detect.cjs --fix         # strip after manual review
 *
 * Signature categories:
 *   IDIOM_MARKER  – explicit "idiom"/"idiomatic"/"set phrase" mentions
 *   FIXED_PHRASE  – tip names a multi-word lexical expression that is
 *                   non-productive (avoir du bol, ho fame, faire la queue,
 *                   tener hambre, etc.)
 *   VOCAB_GLOSS   – "X means Y" / "X = Y meaning" with no structural rule
 *   CULTURAL      – "Spaniards/Italians/Germans say…" without a grammatical
 *                   form being taught
 *   LITERAL_GLOSS – "literally means X" used to translate an idiom
 *
 * Each tip can match multiple categories. Reporting groups by language ×
 * category so we can see which languages have which kind of pollution.
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const fix = args.includes('--fix');
const lang1 = args.find(a => !a.startsWith('--'));

const LANGS = ['spanish','italian','french','portuguese','german','dutch','swedish','welsh','turkish','hindi','russian'];

// Known non-productive fixed phrases per language. These are
// idioms / collocations that learners memorise as units — not
// productive patterns. Hitting one in a tip = the tip is teaching
// the phrase, not a rule.
const FIXED_PHRASES = {
  french: [
    /\bavoir du bol\b/i,
    /\bavoir de la chance\b/i,
    /\bfaire la queue\b/i,
    /\bfaire la (cuisine|vaisselle|lessive)\b/i,
    /\bprendre (un café|une douche|le métro|le train)\b/i,
    /\ben avoir marre\b/i,
    /\bavoir le cafard\b/i,
    /\bcoup de (foudre|main|fil)\b/i,
    /\bmettre la table\b/i,
  ],
  italian: [
    /\bho fame\b/i,
    /\bho sete\b/i,
    /\bho freddo\b/i,
    /\bho caldo\b/i,
    /\bho paura\b/i,
    /\bin bocca al lupo\b/i,
    /\bfare (la spesa|colazione|tardi|presto)\b/i,
    /\bin gamba\b/i,
    /\bdai!\b/i,
  ],
  spanish: [
    /\btener (hambre|sed|frío|calor|miedo|sueño|prisa|razón)\b/i,
    /\bdar (un paseo|una vuelta|los buenos días)\b/i,
    /\bhacer (la cama|la compra|cola|caso)\b/i,
    /\bechar de menos\b/i,
    /\bdar igual\b/i,
    /\bme da igual\b/i,
    /\bvale la pena\b/i,
    /\bestar de (vacaciones|moda|viaje)\b/i,
  ],
  portuguese: [
    /\bestar com (fome|sede|frio|calor|medo|sono|pressa|razão)\b/i,
    /\bter (saudade|saudades)\b/i,
    /\bdar (um jeito|uma volta)\b/i,
    /\bvaler a pena\b/i,
    /\bfazer (cara|questão|falta)\b/i,
    /\btomar (banho|café da manhã)\b/i,
  ],
  german: [
    /\bDaumen drücken\b/i,
    /\bdie Nase voll haben\b/i,
    /\bauf die Palme bringen\b/i,
    /\bes geht mir auf den (Keks|Geist)\b/i,
    /\b(viel|kein) Bock\b/i,
    /\bkeinen Plan\b/i,
    /\bSchnauze voll\b/i,
  ],
  dutch: [
    /\bde kat uit de boom kijken\b/i,
    /\bin het ootje nemen\b/i,
    /\bgeen flauw idee\b/i,
    /\bdat klopt\b/i,
    /\bhet maakt niet uit\b/i,
  ],
  swedish: [
    /\bdet är lugnt\b/i,
    /\bingen fara\b/i,
    /\binte alls\b/i,
    /\bvarsågod\b/i,
  ],
  welsh: [
    /\bdiolch yn fawr\b/i,
    /\bcroeso\b\s*=\s*welcome/i,
  ],
  turkish: [
    /\bafiyet olsun\b/i,
    /\bkolay gelsin\b/i,
    /\bgüle güle\b/i,
    /\beline sağlık\b/i,
  ],
  hindi: [
    /\bधन्यवाद\b\s*=/,
    /\bनमस्ते\b\s*=/,
  ],
  russian: [
    /\bна здоровье\b/i,
    /\bпока\b\s*=\s*bye/i,
  ],
};

// Cross-language signature regexes (apply to every language).
// VOCAB_GLOSS dropped — the "X = Y" format is the desired worked-example
// format for legitimate grammar tips, so it cannot distinguish.
const GENERIC_SIGNATURES = {
  IDIOM_MARKER: /\b(idiom(atic)?|set phrase|fixed expression|fixed phrase|colloquial(ism)?)\b/i,
  LITERAL_GLOSS: /\bliterally\b\s+(means|=|translates|is)/i,
  CULTURAL: /\b(Spaniards|Italians|French people|Germans|Dutch people|Brazilians|Portuguese people|Russians|Turks)\s+(say|use|prefer)/i,
};

// Words/phrases that indicate the tip IS grammar — if any present,
// we should NOT flag it as idiom even if a fixed-phrase regex matches.
// Cast wide: any productive-pattern terminology rescues the tip.
const GRAMMAR_RESCUE = new RegExp(
  '\\b(' + [
    // Tense / aspect / mood
    'tense','aspect','mood','voice','active','passive',
    'subjunctive','indicative','imperative','conditional',
    'imperfect','preterite','perfect(ive)?','pluperfect','imperfective',
    'present','past','future','past-participle',
    // Cases & marking
    'case','accusative','nominative','dative','genitive',
    'instrumental','locative','ablative','ergative','absolutive','oblique',
    // Agreement & inflection
    'agree(s|ment|ing)?','gender','masculine','feminine','neuter',
    'plural','singular','number',
    'conjugat(e|es|ion|ing)','declens(e|ion)','inflect(ion|ed|s)?',
    'ending(s)?','stem','suffix','prefix','root','class','irregular','regular',
    'diminutive','augmentative',
    // Constructions
    'auxiliary','modal','clitic','reflexive','reciprocal',
    'transitive','intransitive','impersonal','copula','existential',
    'partitive','contraction','elision','reduplication','periphras(is|tic)',
    'comparative','superlative','possession','pronominal','compound',
    'konjunktiv','konj','experiencer','dative-experiencer',
    'noun','verb','adjective','adverb',
    // ('phrase' deliberately NOT in rescue — it conflicts with "fixed phrase" idiom marker)
    // Lay grammar wording learners encounter
    'backwards','reverse','reversed','swap(s|ped)?','sub-?ject','reverses',
    // Function words
    'pronoun','preposition','postposition','particle','article',
    'definite','indefinite','demonstrative','possessive','relative',
    // Structure
    'word order','sentence','clause','main clause','subordinate',
    'negation','question','interrogative','focus',
    'subject','object','direct object','indirect object',
    'agent','patient',
    // Phonological grammar
    'mutation','harmony','sandhi','vowel','consonant',
    // Specific structural terms
    'gerund','infinitive','participle','supine','supinum',
    // Patterns / rules
    'pattern','rule','form(s)?','ends in','before [a-z]','after [a-z]',
    'use [a-zA-Z]+ when','use [a-zA-Z]+ for','use [a-zA-Z]+ to',
    // Specific language operators (lexical but grammatical)
    'ser vs estar','por vs para','por/para','ser/estar',
    'piacere','gustar','ne[- ](ergative|particle)',
  ].join('|') + ')\\b', 'i');

function loadDeck(lang) {
  const p = path.join('src/data', lang, 'deck.json');
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

const report = {};

for (const lang of LANGS) {
  const deck = loadDeck(lang);
  if (!deck) continue;
  const fixedPatterns = FIXED_PHRASES[lang] || [];
  const flagged = [];
  for (const card of deck) {
    if (!card.grammar) continue;
    const cats = [];
    const rescued = GRAMMAR_RESCUE.test(card.grammar);

    // IDIOM_MARKER is high-signal even with grammar rescue (saying "fixed
    // expression" or "colloquialism" is itself a vocab framing).
    if (GENERIC_SIGNATURES.IDIOM_MARKER.test(card.grammar) && !rescued) cats.push('IDIOM_MARKER');
    if (GENERIC_SIGNATURES.LITERAL_GLOSS.test(card.grammar) && !rescued) cats.push('LITERAL_GLOSS');
    // CULTURAL dropped — "Brazilians prefer X" too often pairs with a real grammar rule.

    for (const re of fixedPatterns) {
      if (re.test(card.grammar) && !rescued) {
        cats.push('FIXED_PHRASE');
        break;
      }
    }

    if (cats.length) {
      flagged.push({ id: card.id, target: card.target, tip: card.grammar, cats });
    }
  }
  report[lang] = flagged;
}

if (lang1) {
  const list = report[lang1] || [];
  console.log('=== ' + lang1.toUpperCase() + ' ' + list.length + ' non-grammar tips ===\n');
  // Group by primary category
  const byCat = {};
  for (const f of list) {
    const k = f.cats[0];
    if (!byCat[k]) byCat[k] = [];
    byCat[k].push(f);
  }
  for (const [cat, items] of Object.entries(byCat)) {
    console.log('--- ' + cat + ' (' + items.length + ') ---');
    for (const f of items.slice(0, 6)) {
      console.log('  [' + f.id + '] ' + f.target);
      console.log('    » ' + f.tip.slice(0, 130));
    }
    if (items.length > 6) console.log('  …(' + (items.length - 6) + ' more)');
    console.log();
  }
} else {
  console.log('Non-grammar tip counts (dry):\n');
  console.log('lang        total  idiom-marker  fixed-phrase  literal-gloss');
  let grand = 0;
  for (const lang of LANGS) {
    const list = report[lang] || [];
    const counts = { IDIOM_MARKER:0, FIXED_PHRASE:0, LITERAL_GLOSS:0 };
    for (const f of list) for (const c of f.cats) counts[c]++;
    console.log([
      lang.padEnd(11),
      String(list.length).padStart(5),
      String(counts.IDIOM_MARKER).padStart(12),
      String(counts.FIXED_PHRASE).padStart(12),
      String(counts.LITERAL_GLOSS).padStart(13),
    ].join('  '));
    grand += list.length;
  }
  console.log('\nGrand total flagged: ' + grand);
}

if (fix) {
  let total = 0;
  for (const lang of LANGS) {
    const list = report[lang] || [];
    if (!list.length) continue;
    const p = path.join('src/data', lang, 'deck.json');
    const deck = JSON.parse(fs.readFileSync(p, 'utf8'));
    const ids = new Set(list.map(f => f.id));
    let stripped = 0;
    for (const card of deck) {
      if (ids.has(card.id)) { delete card.grammar; stripped++; }
    }
    fs.writeFileSync(p, JSON.stringify(deck, null, 2));
    console.log(lang + ': stripped ' + stripped + ' cards');
    total += stripped;
  }
  console.log('Total stripped: ' + total);
}
