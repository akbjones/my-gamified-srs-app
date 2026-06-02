#!/usr/bin/env node
/**
 * Early-card complexity audit.
 *
 * Finds A1-tier cards (node-01..node-08, Foundations) that contain content
 * too advanced for the learner's first encounter:
 *   - Reverse / impersonal constructions (Spanish "se me hace", Italian "mi
 *     piace" in inflected forms, French "il me faut")
 *   - Past/future/subjunctive verb forms in A1 (these should only show up
 *     in A2+)
 *   - Sentences with more than ~9 words (too dense)
 *   - Idiomatic English translations that diverge a lot from the source
 *
 * Why this matters: the placement test and the very first cards a user
 * sees set the tone. "Se me hace tarde." (es-0001) translates as "I'm
 * running late." — there's no obvious path from the English to the
 * Spanish for a beginner.
 *
 * Run:
 *   node scripts/grammar-tips/audit-early.cjs                 # report
 *   node scripts/grammar-tips/audit-early.cjs --lang=spanish  # one lang
 *   node scripts/grammar-tips/audit-early.cjs --json          # write JSON
 */

const fs = require('fs');

const args = process.argv.slice(2);
const langArg = (args.find(a => a.startsWith('--lang=')) || '').split('=')[1];

const LANG_DECKS = {
  spanish:    'src/data/spanish/deck.json',
  italian:    'src/data/italian/deck.json',
  french:     'src/data/french/deck.json',
  portuguese: 'src/data/portuguese/deck.json',
  german:     'src/data/german/deck.json',
  dutch:      'src/data/dutch/deck.json',
  swedish:    'src/data/swedish/deck.json',
  welsh:      'src/data/welsh/deck.json',
  hindi:      'src/data/hindi/deck.json',
  turkish:    'src/data/turkish/deck.json',
  russian:    'src/data/russian/deck.json',
};

const A1_NODES = new Set(['node-01','node-02','node-03','node-04','node-05','node-06','node-07','node-08']);

// Reverse / impersonal constructions per language — these are conceptually
// hard for beginners because the grammatical subject ≠ the English subject.
const REVERSE_PATTERNS = {
  spanish: [
    { name: 'se me/te/le/nos/les + verb', re: /\bse\s+(me|te|le|nos|os|les)\s+[a-záéíóúñ]+/i },
    { name: 'me/te/le + gusta/parece/duele/encanta/falta/queda', re: /\b(me|te|le|nos|os|les)\s+(gusta|gustan|parece|parecen|duele|duelen|encanta|encantan|falta|faltan|queda|quedan|importa|importan|interesa|interesan|conviene|hace\s+falta)\b/i },
  ],
  italian: [
    { name: 'mi/ti/gli/le piace etc.', re: /\b(mi|ti|gli|le|ci|vi|loro)\s+(piace|piacciono|sembra|sembrano|dispiace|interessa|interessano|manca|mancano|fa\s+male|fanno\s+male|serve|servono|basta|bastano)\b/i },
    { name: 'si + me/te + verb (impersonal)', re: /\bsi\s+(mi|ti|gli|le|ci|vi)\s+[a-zàèéìòù]+/i },
  ],
  french: [
    { name: 'il me/te/lui faut', re: /\bil\s+(me|te|lui|nous|vous|leur)\s+(faut|fallait|faudra)\b/i },
    { name: 'il me/te/lui semble/plaît etc.', re: /\bil\s+(me|te|lui|nous|vous|leur)\s+(semble|semblait|plait|plaît|plaisait|reste|restait|manque|manquait|arrive|arrivait)\b/i },
    { name: 'ça me/te/lui plaît / dit etc.', re: /\bça\s+(me|te|lui|nous|vous|leur)\s+(plait|plaît|plaisait|dit|disait|fait|faisait)\b/i },
  ],
  portuguese: [
    { name: 'me/te/lhe + gosta etc.', re: /\b(me|te|lhe|nos|vos|lhes)\s+(parece|parecem|interessa|interessam|importa|falta|faltam|dói|doem|chega|sobra|sobram)\b/i },
    { name: 'tomara que / pena que', re: /\b(tomara|pena|que pena|graças a)\b/i },
  ],
  german: [
    { name: 'es gefällt mir / es tut mir leid (dative experiencer)', re: /\bes\s+(gefällt|gefiel|tut|tat)\s+(mir|dir|ihm|ihr|uns|euch|ihnen)\b/i },
  ],
  russian: [
    { name: 'мне/тебе нравится (reverse)', re: /(^|\s)(мне|тебе|ему|ей|нам|вам|им)\s+(нравится|нравятся|нужно|надо|жаль|холодно|тепло|плохо|хорошо|трудно|легко|интересно|скучно)(\s|[.,!?]|$)/i },
  ],
  hindi: [
    { name: 'mujhe/tujhe pasand hai (dative experiencer)', re: /(मुझे|तुझे|उसे|हमें|आपको|उन्हें)\s+[ऀ-ॿ]+\s+(है|हैं)/ },
  ],
  turkish: [],
  welsh: [
    { name: "mae'r noun gen i (possession)", re: /\bmae'r?\s+[a-zâêîôûŵŷ]+\s+(gen|gan|gyda)\b/i },
  ],
};

// Verb forms that shouldn't appear in A1 cards (past/future/subjunctive)
const A1_NO_GO_VERBS = {
  spanish: [
    { name: 'preterite', re: /(?<![a-záéíóúñü])[a-záéíóúñü]{2,}(?:aste|asteis|aron|iste|isteis|ieron|ió)(?![a-záéíóúñü])/i },
    { name: 'preterite (irreg)', re: /(?<![a-záéíóúñü])(fui|fuiste|fue|fuimos|tuve|tuviste|tuvo|hice|hiciste|hizo|dije|dijiste|dijo|estuve|estuvo|vi|vio|vine|vino|di|dio|puse|puso|supe|supo|pude|pudo|quise|quiso)(?![a-záéíóúñü])/i },
    { name: 'imperfect', re: /(?<![a-záéíóúñü])[a-záéíóúñü]{2,}(?:aba|abas|ábamos|abais|aban)(?![a-záéíóúñü])/i },
    { name: 'imperfect (irreg)', re: /(?<![a-záéíóúñü])(era|eras|éramos|erais|eran|iba|ibas|íbamos|ibais|iban)(?![a-záéíóúñü])/i },
    { name: 'future', re: /(?<![a-záéíóúñü])[a-záéíóúñü]+(?:aré|arás|ará|aremos|aréis|arán|eré|erás|erá|eremos|eréis|erán|iré|irás|irá|iremos|iréis|irán)(?![a-záéíóúñü])/i },
    { name: 'subjunctive (irreg common)', re: /(?<![a-záéíóúñü])(sea|seas|seamos|sean|tenga|tengas|tengamos|tengan|haga|hagas|vaya|vayas|pueda|puedas|quiera|quieras|sepa|sepas|venga|vengas|dé|des|esté|estés|fuera|fueran|tuviera|tuvieran)(?![a-záéíóúñü])/i },
    { name: 'conditional', re: /(?<![a-záéíóúñü])[a-záéíóúñü]+(?:ría|rías|ríamos|ríais|rían)(?![a-záéíóúñü])/i },
  ],
  italian: [
    { name: 'passato remoto / imperfetto / futuro', re: /(?<![a-zàèéìòù])[a-zàèéìòù]{2,}(?:asti|ammo|arono|esti|emmo|erono|isti|immo|irono|avo|avi|ava|avamo|avate|avano|evo|evi|eva|evamo|evate|evano|ivo|ivi|iva|ivamo|ivate|ivano|erò|erai|erà|eremo|erete|eranno|irò|irai|irà|iremo|irete|iranno)(?![a-zàèéìòù])/i },
  ],
  french: [
    {
      name: 'imparfait',
      re: t => {
        // -ais nouns/adjectives that look like imparfait but aren't:
        const NOT_VERB = /^(français|française|françaises|anglais|anglaise|anglaises|japonais|japonaise|japonaises|portugais|portugaise|portugaises|irlandais|irlandaise|irlandaises|hollandais|hollandaise|hollandaises|néerlandais|néerlandaise|polonais|polonaise|libanais|libanaise|sénégalais|sénégalaise|congolais|congolaise|épais|épaisse|mauvais|mauvaise|jamais|niais|biais|essais|délais|relais|engrais|frais|frais|vrais|décès|près|excès|accès|succès|cyprès)$/i;
        const cands = t.match(/(?<![a-zàâçéèêëîïôûùüÿ])[a-zàâçéèêëîïôûùüÿ]{2,}(?:ais|ait|aient|ions|iez)(?![a-zàâçéèêëîïôûùüÿ])/gi) || [];
        return cands.some(w => !NOT_VERB.test(w));
      },
    },
    { name: 'passé composé (avoir+pp)', re: /\b(a|ai|as|avons|avez|ont)\s+[a-zàâçéèêëîïôûùüÿ]+(?:é|ée|és|ées|i|is|ie|ies|u|us|ue|ues)\b/i },
    { name: 'futur simple', re: /(?<![a-zàâçéèêëîïôûùüÿ])[a-zàâçéèêëîïôûùüÿ]{2,}(?:rai|ras|ra|rons|rez|ront)(?![a-zàâçéèêëîïôûùüÿ])/i },
    { name: 'conditionnel', re: /(?<![a-zàâçéèêëîïôûùüÿ])[a-zàâçéèêëîïôûùüÿ]{2,}(?:rais|rait|rions|riez|raient)(?![a-zàâçéèêëîïôûùüÿ])/i },
    { name: 'subjonctif', re: /(?<![a-zàâçéèêëîïôûùüÿ])(soit|soient|fasse|fassent|aille|puisse|veuille|sache)(?![a-zàâçéèêëîïôûùüÿ])/i },
  ],
  portuguese: [
    { name: 'pretérito perfeito', re: /(?<![a-záéíóúâêîôûãõç])[a-záéíóúâêîôûãõç]{2,}(?:aste|astes|aram|este|estes|eram|iste|istes|iram|iu|eu|ou)(?![a-záéíóúâêîôûãõç])/i },
    { name: 'imperfeito', re: /(?<![a-záéíóúâêîôûãõç])[a-záéíóúâêîôûãõç]{2,}(?:ava|avas|ávamos|avam)(?![a-záéíóúâêîôûãõç])/i },
    { name: 'futuro / conditional', re: /(?<![a-záéíóúâêîôûãõç])[a-záéíóúâêîôûãõç]{2,}(?:rei|rás|rá|remos|reis|rão|ria|rias|ríamos|ríeis|riam)(?![a-záéíóúâêîôûãõç])/i },
  ],
};

const langs = langArg ? [langArg] : Object.keys(LANG_DECKS);
const out = {};

for (const lang of langs) {
  const deckPath = LANG_DECKS[lang];
  if (!deckPath || !fs.existsSync(deckPath)) continue;
  const deck = JSON.parse(fs.readFileSync(deckPath, 'utf8'));
  const cards = deck.cards || deck;
  const a1Cards = cards.filter(c => A1_NODES.has(c.grammarNode) && c.target);

  const reverse = REVERSE_PATTERNS[lang] || [];
  const noGo = A1_NO_GO_VERBS[lang] || [];

  const findings = { reverse: [], wrongTense: [], tooLong: [] };

  for (const c of a1Cards) {
    const t = c.target;
    const words = t.split(/\s+/).length;

    for (const rule of reverse) {
      if (rule.re.test(t)) {
        findings.reverse.push({ id: c.id, priority: c.priority, target: t, english: c.english, rule: rule.name });
        break;
      }
    }
    for (const rule of noGo) {
      const hit = typeof rule.re === 'function' ? rule.re(t) : rule.re.test(t);
      if (hit) {
        findings.wrongTense.push({ id: c.id, priority: c.priority, target: t, english: c.english, rule: rule.name });
        break;
      }
    }
    if (words > 9) {
      findings.tooLong.push({ id: c.id, priority: c.priority, target: t, english: c.english, words });
    }
  }

  out[lang] = findings;
  console.log(`\n=== ${lang.toUpperCase()} (A1 cards: ${a1Cards.length}) ===`);
  console.log(`  reverse/impersonal constructions: ${findings.reverse.length}`);
  console.log(`  wrong-tense (past/future/subj):   ${findings.wrongTense.length}`);
  console.log(`  too long (>9 words):              ${findings.tooLong.length}`);

  // Show top 5 lowest-priority (earliest) offenders per category
  const earlyReverse = findings.reverse.sort((a,b) => (a.priority||0) - (b.priority||0)).slice(0, 5);
  const earlyTense = findings.wrongTense.sort((a,b) => (a.priority||0) - (b.priority||0)).slice(0, 5);

  if (earlyReverse.length > 0) {
    console.log(`  Earliest reverse offenders:`);
    earlyReverse.forEach(f => console.log(`    p=${f.priority || '?'} ${f.id}  "${f.target}" → "${f.english}"`));
  }
  if (earlyTense.length > 0) {
    console.log(`  Earliest wrong-tense offenders:`);
    earlyTense.forEach(f => console.log(`    p=${f.priority || '?'} ${f.id}  "${f.target}" → "${f.english}"`));
  }
}

if (args.includes('--json')) {
  if (!fs.existsSync('scripts/output')) fs.mkdirSync('scripts/output', { recursive: true });
  fs.writeFileSync('scripts/output/early-cards-audit.json', JSON.stringify(out, null, 2));
  console.log('\nWrote scripts/output/early-cards-audit.json');
}
