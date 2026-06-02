#!/usr/bin/env node
/**
 * Re-tag A1 cards whose verb forms belong in higher tiers.
 *
 * For Romance languages (es, it, fr, pt) the A1 (Foundations) tier should
 * contain present-tense forms only. Cards with past tense, future, condi-
 * tional, or subjunctive forms get re-assigned to their proper tier node:
 *
 *   preterite (regular)   → node-09 (Past tense: regular,   A2)
 *   preterite (irregular) → node-10 (Past tense: irregular, A2)
 *   imperfect             → node-11 (Imperfect tense,       A2)
 *   subjunctive           → node-16 (Present subjunctive,   B1)
 *   conditional           → node-18 (Conditional,           B1)
 *   future                → node-19 (Future tense,          B1)
 *
 * Also bumps es-0001 ("Se me hace tarde.") out of the first-impression zone
 * since its reverse-construction grammar is heavy for a brand-new learner.
 *
 * Run:
 *   node scripts/grammar-tips/retag-a1.cjs            # dry run
 *   node scripts/grammar-tips/retag-a1.cjs --apply    # write changes
 */

const fs = require('fs');

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');

const LANG_DECKS = {
  spanish:    'src/data/spanish/deck.json',
  italian:    'src/data/italian/deck.json',
  french:     'src/data/french/deck.json',
  portuguese: 'src/data/portuguese/deck.json',
};

const A1_NODES = new Set(['node-01','node-02','node-03','node-04','node-05','node-06','node-07','node-08']);

// Per language, ORDERED list of detectors. First match wins.
// Each detector decides which destination node a card belongs in.
const DETECTORS = {
  spanish: [
    {
      tense: 'imperfect',
      destNode: 'node-11',
      test: t => /(?<![a-záéíóúñü])[a-záéíóúñü]{2,}(?:aba|abas|ábamos|abais|aban)(?![a-záéíóúñü])/i.test(t) ||
                /(?<![a-záéíóúñü])(era|eras|éramos|erais|eran|iba|ibas|íbamos|ibais|iban|tenía|tenías|teníamos|tenían|hacía|hacías|hacíamos|hacían|veía|veías|veíamos|veían|sentía|sentías|podía|podías|podían|sabía|sabías|sabían|quería|querías|querían|conocía|conocías|conocían)(?![a-záéíóúñü])/i.test(t),
    },
    {
      tense: 'preterite (irregular)',
      destNode: 'node-10',
      test: t => /(?<![a-záéíóúñü])(fui|fuiste|fue|fuimos|fuisteis|fueron|tuve|tuviste|tuvo|tuvimos|tuvisteis|tuvieron|hice|hiciste|hizo|hicimos|hicisteis|hicieron|dije|dijiste|dijo|dijimos|dijisteis|dijeron|estuve|estuviste|estuvo|estuvimos|estuvisteis|estuvieron|vi|viste|vio|vimos|vine|viniste|vino|vinimos|vinisteis|vinieron|di|diste|dio|dimos|disteis|dieron|puse|pusiste|puso|pusimos|pusisteis|pusieron|supe|supiste|supo|supimos|supisteis|supieron|pude|pudiste|pudo|pudimos|pudisteis|pudieron|quise|quisiste|quiso|quisimos|quisisteis|quisieron|trajo|trajeron|leyó|leyeron|oyó|oyeron)(?![a-záéíóúñü])/i.test(t),
    },
    {
      tense: 'preterite (regular)',
      destNode: 'node-09',
      test: t => /(?<![a-záéíóúñü])[a-záéíóúñü]{2,}(?:aste|asteis|aron|iste|isteis|ieron|ió)(?![a-záéíóúñü])/i.test(t),
    },
    {
      tense: 'future',
      destNode: 'node-19',
      test: t => /(?<![a-záéíóúñü])[a-záéíóúñü]+(?:aré|arás|ará|aremos|aréis|arán|eré|erás|erá|eremos|eréis|erán|iré|irás|irá|iremos|iréis|irán)(?![a-záéíóúñü])/i.test(t),
    },
    {
      tense: 'conditional',
      destNode: 'node-18',
      test: t => /(?<![a-záéíóúñü])[a-záéíóúñü]+(?:ría|rías|ríamos|ríais|rían)(?![a-záéíóúñü])/i.test(t),
    },
    {
      tense: 'subjunctive',
      destNode: 'node-16',
      test: t => /(?<![a-záéíóúñü])(sea|seas|seamos|sean|tenga|tengas|tengamos|tengan|haga|hagas|hagamos|hagan|vaya|vayas|vayamos|vayan|pueda|puedas|podamos|puedan|quiera|quieras|queramos|quieran|sepa|sepas|sepamos|sepan|venga|vengas|vengamos|vengan|dé|des|demos|den|esté|estés|estemos|estén|fuera|fueras|fuéramos|fueran|tuviera|tuvieras|tuviéramos|tuvieran)(?![a-záéíóúñü])/i.test(t),
    },
  ],
  italian: [
    {
      tense: 'imperfetto',
      destNode: 'node-11',
      test: t => /(?<![a-zàèéìòù])[a-zàèéìòù]{2,}(?:avo|avi|ava|avamo|avate|avano|evo|evi|eva|evamo|evate|evano|ivo|ivi|iva|ivamo|ivate|ivano)(?![a-zàèéìòù])/i.test(t) ||
                /(?<![a-zàèéìòù])(ero|eri|era|eravamo|eravate|erano|avevo|avevi|aveva|avevamo|avevate|avevano)(?![a-zàèéìòù])/i.test(t),
    },
    {
      tense: 'passato remoto',
      destNode: 'node-10',
      test: t => /(?<![a-zàèéìòù])[a-zàèéìòù]{2,}(?:asti|ammo|arono|esti|emmo|este|erono|isti|immo|iste|irono)(?![a-zàèéìòù])/i.test(t) ||
                /(?<![a-zàèéìòù])(fui|fosti|fu|fummo|foste|furono|ebbi|avesti|ebbe|feci|facesti|fece|dissi|dicesti|disse|venni|vide|vidi|vissi)(?![a-zàèéìòù])/i.test(t),
    },
    {
      tense: 'futuro',
      destNode: 'node-19',
      test: t => /(?<![a-zàèéìòù])[a-zàèéìòù]{2,}(?:erò|erai|erà|eremo|erete|eranno|irò|irai|irà|iremo|irete|iranno)(?![a-zàèéìòù])/i.test(t),
    },
    {
      tense: 'condizionale',
      destNode: 'node-18',
      test: t => /(?<![a-zàèéìòù])[a-zàèéìòù]{2,}(?:erei|eresti|erebbe|eremmo|ereste|erebbero|irei|iresti|irebbe|iremmo|ireste|irebbero)(?![a-zàèéìòù])/i.test(t),
    },
    {
      tense: 'congiuntivo',
      destNode: 'node-16',
      test: t => /(?<![a-zàèéìòù])(sia|siano|abbia|abbiano|faccia|facciano|vada|vadano|venga|vengano|possa|possano|sappia|sappiano|voglia|vogliano|debba|debbano|stia|stiano|dia|diano|fosse|fossero|avesse|avessero)(?![a-zàèéìòù])/i.test(t),
    },
  ],
  french: [
    {
      tense: 'imparfait',
      destNode: 'node-11',
      test: t => {
        const NOT_VERB = /^(français|française|françaises|anglais|anglaise|anglaises|japonais|japonaise|portugais|portugaise|irlandais|irlandaise|hollandais|néerlandais|polonais|libanais|sénégalais|congolais|épais|épaisse|mauvais|mauvaise|jamais|niais|biais|essais|délais|relais|engrais|frais|vrais)$/i;
        const cands = t.match(/(?<![a-zàâçéèêëîïôûùüÿ])[a-zàâçéèêëîïôûùüÿ]{2,}(?:ais|ait|aient|ions|iez)(?![a-zàâçéèêëîïôûùüÿ])/gi) || [];
        if (cands.some(w => !NOT_VERB.test(w))) return true;
        return /(?<![a-zàâçéèêëîïôûùüÿ])(était|étais|étaient|étions|étiez|avait|avais|avaient|avions|aviez|allait|allais|faisait|faisais|disait|venait)(?![a-zàâçéèêëîïôûùüÿ])/i.test(t);
      },
    },
    {
      tense: 'passé composé',
      destNode: 'node-21',
      test: t => /(?<![a-zàâçéèêëîïôûùüÿ])(a|ai|as|avons|avez|ont|est|es|sommes|êtes|sont)\s+[a-zàâçéèêëîïôûùüÿ]+(?:é|ée|és|ées|i|is|ie|ies|u|us|ue|ues)(?![a-zàâçéèêëîïôûùüÿ])/i.test(t),
    },
    {
      tense: 'futur',
      destNode: 'node-19',
      test: t => /(?<![a-zàâçéèêëîïôûùüÿ])[a-zàâçéèêëîïôûùüÿ]{2,}(?:rai|ras|ra|rons|rez|ront)(?![a-zàâçéèêëîïôûùüÿ])/i.test(t),
    },
    {
      tense: 'conditionnel',
      destNode: 'node-18',
      test: t => /(?<![a-zàâçéèêëîïôûùüÿ])[a-zàâçéèêëîïôûùüÿ]{2,}(?:rais|rait|rions|riez|raient)(?![a-zàâçéèêëîïôûùüÿ])/i.test(t),
    },
    {
      tense: 'subjonctif',
      destNode: 'node-16',
      test: t => /(?<![a-zàâçéèêëîïôûùüÿ])(soit|soient|fasse|fassent|aille|puisse|veuille|sache)(?![a-zàâçéèêëîïôûùüÿ])/i.test(t),
    },
  ],
  portuguese: [
    {
      tense: 'imperfeito',
      destNode: 'node-11',
      test: t => {
        if (/(?<![a-záéíóúâêîôûãõç])[a-záéíóúâêîôûãõç]{2,}(?:ava|avas|ávamos|aváveis|avam)(?![a-záéíóúâêîôûãõç])/i.test(t)) return true;
        if (/(?<![a-záéíóúâêîôûãõç])(era|eras|éramos|éreis|eram|tinha|tinhas|tínhamos|tínheis|tinham|via|vias|fazia|fazias|dizia)(?![a-záéíóúâêîôûãõç])/i.test(t)) return true;
        const NOUN_IA = /^(família|história|polícia|farmácia|democracia|geografia|filosofia|economia|teoria|biografia|categoria|fotografia|criança|infância|esperança|distância|importância|paciência|presença|tendência|experiência|consciência|preferência|ciência|justiça|notícia|delícia|caricia|magia|alegria|graça|herança|frequência|elegância|essência|circunstância|farmácia)$/i;
        const cands = t.match(/(?<![a-záéíóúâêîôûãõç])[a-záéíóúâêîôûãõç]{2,}(?:ia|ias|íamos|íeis|iam)(?![a-záéíóúâêîôûãõç])/gi) || [];
        return cands.some(w => !NOUN_IA.test(w));
      },
    },
    {
      tense: 'pretérito (irregular)',
      destNode: 'node-10',
      test: t => /(?<![a-záéíóúâêîôûãõç])(fui|foste|foi|fomos|fostes|foram|tive|tiveste|teve|tivemos|tivestes|tiveram|fiz|fizeste|fez|fizemos|fizestes|fizeram|disse|dissemos|disseram|vi|viste|viu|vimos|vistes|viram|vim|vieste|veio|viemos|vieram|dei|deste|deu|demos|deram|pus|puseste|pôs)(?![a-záéíóúâêîôûãõç])/i.test(t),
    },
    {
      tense: 'pretérito (regular)',
      destNode: 'node-09',
      test: t => /(?<![a-záéíóúâêîôûãõç])[a-záéíóúâêîôûãõç]{2,}(?:aste|astes|aram|este|estes|eram|iste|istes|iram|iu|eu|ou)(?![a-záéíóúâêîôûãõç])/i.test(t),
    },
    {
      tense: 'futuro/condicional',
      destNode: 'node-19',
      test: t => /(?<![a-záéíóúâêîôûãõç])[a-záéíóúâêîôûãõç]{2,}(?:rei|rás|rá|remos|reis|rão|ria|rias|ríamos|ríeis|riam)(?![a-záéíóúâêîôûãõç])/i.test(t),
    },
  ],
};

const summary = {};

for (const [lang, deckPath] of Object.entries(LANG_DECKS)) {
  if (!fs.existsSync(deckPath)) continue;
  const deck = JSON.parse(fs.readFileSync(deckPath, 'utf8'));
  const cards = deck.cards || deck;
  const detectors = DETECTORS[lang] || [];
  const moves = {};
  let touched = 0;

  for (const c of cards) {
    if (!A1_NODES.has(c.grammarNode)) continue;
    if (!c.target) continue;
    for (const det of detectors) {
      if (det.test(c.target)) {
        const key = `${c.grammarNode} → ${det.destNode}  (${det.tense})`;
        moves[key] = (moves[key] || 0) + 1;
        if (APPLY) c.grammarNode = det.destNode;
        touched++;
        break;
      }
    }
  }

  // Solution A — bump es-0001 priority so it's no longer the first card
  if (lang === 'spanish') {
    const first = cards.find(c => c.id === 'es-0001');
    if (first && first.priority < 1500) {
      const oldP = first.priority;
      if (APPLY) first.priority = 2500;
      moves[`es-0001 priority ${oldP} → 2500`] = 1;
    }
  }

  if (APPLY && touched > 0) {
    fs.writeFileSync(deckPath, JSON.stringify(deck, null, 2) + '\n');
  }

  // Count cards per node after the (potential) reassignment
  const counts = {};
  for (const c of cards) counts[c.grammarNode] = (counts[c.grammarNode] || 0) + 1;
  summary[lang] = { touched, moves, counts };

  console.log(`\n=== ${lang.toUpperCase()} === ${touched} cards re-tagged`);
  for (const [k, n] of Object.entries(moves).sort((a,b) => b[1]-a[1])) {
    console.log(`   ${n.toString().padStart(4)}  ${k}`);
  }
}

// Print final balance summary
console.log('\n── Final card balance per node ──');
console.log('         ' + '   '.padEnd(2) + Array.from({length: 21}, (_, i) => String(i+1).padStart(4)).join(''));
for (const lang of Object.keys(LANG_DECKS)) {
  const counts = summary[lang].counts;
  const row = Array.from({length: 21}, (_, i) => String(counts[`node-${String(i+1).padStart(2, '0')}`] || '').padStart(4)).join('');
  console.log(`${lang.padEnd(10)} ${row}`);
}

if (!APPLY) console.log('\n(dry run — pass --apply to write changes)');
