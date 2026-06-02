#!/usr/bin/env node
/**
 * Grammar-tips audit script.
 *
 * For every card with a grammar tip, this script checks whether the tip's
 * grammatical CLAIM (e.g. "preterite", "imperfect", "subjunctive", "ergative
 * ne construction") is supported by content in the card target.
 *
 * Why this exists: we mass-generated tips with broad regexes that matched
 * orthographic patterns (e.g. `\b[a-z]+ía\b` for Spanish imperfect) without
 * distinguishing verb forms from nouns ending the same way. Result: a card
 * like "La guía tiene un mapa del centro" — present tense, no past at all
 * — got tagged with an imperfect/preterite tip because "guía" / "centro"
 * ended in -ía / -tro. ~180 such mismatches in Spanish alone.
 *
 * The audit is HEURISTIC, not semantic. It uses pattern catalogs that map
 * a TIP-CLAIM (string match in the tip text) to a CARD-PRESENCE check
 * (regex over the card target). When tip-claim is detected but card-presence
 * is missing, we flag the pair.
 *
 * Run:
 *   node scripts/grammar-tips/audit.cjs                # JSON report stdout
 *   node scripts/grammar-tips/audit.cjs --apply        # clear mismatched tips
 *   node scripts/grammar-tips/audit.cjs --lang=spanish # one language
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const langArg = (args.find(a => a.startsWith('--lang=')) || '').split('=')[1];
const VERBOSE = args.includes('--verbose');

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

/**
 * Catalog of audit rules per language. Each rule has:
 *   tipClaim   — regex over the TIP text that identifies what the tip is about
 *   cardCheck  — regex over the CARD TARGET that must match for the claim to apply
 *   label      — short name for the rule (for reporting)
 *
 * A card-tip pair is flagged as MISMATCH when:
 *   tipClaim matches the tip text   AND   cardCheck does NOT match the card target.
 *
 * To avoid false-positive flags (e.g. a tip that mentions "preterite" while
 * primarily explaining something else), each rule should be specific.
 */
const RULES = {
  spanish: [
    {
      label: 'preterite',
      tipClaim: /\bpreterite\b/i,
      // A real preterite form: stems + actual preterite endings.
      // To not match nouns ending in -ó (rare), we require either a known
      // irregular preterite form OR a stem-of-3-or-more consonants + endings.
      cardCheck: t => {
        // Irregular preterites that don't look like one ending
        if (/\b(fui|fuiste|fue|fuimos|fuisteis|fueron|tuve|tuviste|tuvo|tuvimos|tuvisteis|tuvieron|hice|hiciste|hizo|hicimos|hicisteis|hicieron|dije|dijiste|dijo|dijimos|dijisteis|dijeron|estuve|estuviste|estuvo|estuvimos|estuvisteis|estuvieron|fui|fuiste|vi|viste|vio|vine|viniste|vino|vinimos|vinisteis|vinieron|di|diste|dio|dimos|disteis|dieron|puse|pusiste|puso|pusimos|pusisteis|pusieron|supe|supiste|supo|supimos|supisteis|supieron|pude|pudiste|pudo|pudimos|pudisteis|pudieron|quise|quisiste|quiso|quisimos|quisisteis|quisieron)\b/i.test(t)) return true;
        // Regular preterite endings on -ar/-er/-ir verb stems (at least 2 letters of stem)
        if (/\b[a-záéíóúñ]{2,}(é|aste|ó|aron|ieron|ió|í|iste|amos|imos)\b/i.test(t)) {
          // But exclude obvious noun cases: words ending in -amos/-imos that aren't verbs
          // For simplicity we accept the match; nouns ending in -amos are extremely rare
          return true;
        }
        return false;
      },
    },
    {
      label: 'imperfect',
      tipClaim: /\bimperfect\b/i,
      cardCheck: t => {
        // -ar imperfect: -aba, -abas, -ábamos, -abais, -aban (always verbs, ~no nouns)
        if (/\b[a-záéíóúñ]{2,}(aba|abas|ábamos|abais|aban)\b/i.test(t)) return true;
        // -er/-ir imperfect: -ía endings BUT these collide with many nouns (día, guía).
        // Require the word to be a known verb stem + -ía/-ías/-íamos/-íais/-ían.
        // Heuristic: stem length >= 3, not in known-noun list.
        const NOUN_IA_WORDS = /\b(día|días|guía|guías|tía|tías|policía|policías|alegría|alegrías|economía|categoría|fotografía|geografía|filosofía|teoría|melodía|simpatía|panadería|librería|carnicería|pastelería|peluquería|joyería|cafetería|sandía|magia|sangría|rabia|ironía|mía|tuya|suya)\b/i;
        const iaMatches = t.match(/\b[a-záéíóúñ]{2,}(ía|ías|íamos|íais|ían)\b/gi) || [];
        for (const m of iaMatches) {
          if (!NOUN_IA_WORDS.test(m)) return true;
        }
        // Also check: "era" / "eras" / "éramos" / "erais" / "eran" — imperfect of ser
        if (/\b(era|eras|éramos|erais|eran)\b/i.test(t)) return true;
        // "iba" / "ibas" / "íbamos" / "ibais" / "iban" — imperfect of ir
        if (/\b(iba|ibas|íbamos|ibais|iban)\b/i.test(t)) return true;
        return false;
      },
    },
    {
      label: 'subjunctive',
      tipClaim: /\bsubjunctive\b/i,
      cardCheck: t => /\b(que|cuando|aunque|para que|sin que|antes que|hasta que|en caso de que|a menos que|ojalá|quizás|tal vez)\b.*\b[a-záéíóúñ]+(e|es|en|emos|éis|a|as|an|amos|áis)\b/i.test(t) ||
                     /\b(sea|seas|seamos|sean|tenga|tengas|tengamos|tengan|haga|hagas|hagamos|hagan|vaya|vayas|vayamos|vayan|pueda|puedas|podamos|puedan|quiera|quieras|queramos|quieran|sepa|sepas|sepamos|sepan|venga|vengas|vengamos|vengan|dé|des|demos|den|esté|estés|estemos|estén)\b/i.test(t),
    },
    {
      label: 'conditional',
      tipClaim: /\bconditional\b/i,
      cardCheck: t => /\b[a-záéíóúñ]+(ría|rías|ríamos|ríais|rían)\b/i.test(t) ||
                     /\b(sería|serías|seríamos|serían|tendría|tendrías|tendríamos|tendrían|haría|harías|haríamos|harían|podría|podrías|podríamos|podrían|querría|querrías|querríamos|querrían)\b/i.test(t),
    },
    {
      label: 'future',
      tipClaim: /\bfuture tense\b/i,
      cardCheck: t => /\b[a-záéíóúñ]+(aré|arás|ará|aremos|aréis|arán|eré|erás|erá|eremos|eréis|erán|iré|irás|irá|iremos|iréis|irán)\b/i.test(t) ||
                     /\b(será|seré|serás|seremos|serán|tendré|tendrás|tendrá|tendremos|tendrán|haré|harás|hará|haremos|harán|podré|podrás|podrá|podremos|podrán)\b/i.test(t),
    },
  ],

  italian: [
    {
      label: 'passato remoto',
      tipClaim: /\bpassato remoto\b/i,
      cardCheck: t => /\b[a-zàèéìòù]+(ai|asti|ò|ammo|aste|arono|ei|esti|é|emmo|este|erono|ii|isti|ì|immo|iste|irono)\b/i.test(t),
    },
    {
      label: 'imperfetto',
      tipClaim: /\bimperfetto\b/i,
      cardCheck: t => /\b[a-zàèéìòù]+(avo|avi|ava|avamo|avate|avano|evo|evi|eva|evamo|evate|evano|ivo|ivi|iva|ivamo|ivate|ivano)\b/i.test(t),
    },
    {
      label: 'congiuntivo',
      tipClaim: /\bcongiuntivo|subjunctive\b/i,
      cardCheck: t => /\b(che|sebbene|benché|affinché|prima che|senza che)\b/i.test(t) ||
                     /\b(sia|siano|abbia|abbiano|faccia|facciano|vada|vadano|venga|vengano|possa|possano|sappia|sappiano|voglia|vogliano|debba|debbano|stia|stiano|dia|diano)\b/i.test(t),
    },
  ],

  french: [
    {
      label: 'passé composé',
      tipClaim: /\bpassé composé\b/i,
      cardCheck: t => /\b(a|ai|as|avons|avez|ont|est|es|sommes|êtes|sont)\s+[a-zàâçéèêëîïôûùüÿ]+(é|ée|és|ées|i|is|ie|ies|u|us|ue|ues)\b/i.test(t),
    },
    {
      label: 'imparfait',
      tipClaim: /\bimparfait|imperfect\b/i,
      cardCheck: t => /\b[a-zàâçéèêëîïôûùüÿ]+(ais|ait|aient|ions|iez)\b/i.test(t) ||
                     /\b(était|étais|étaient|étions|étiez|avait|avais|avaient|avions|aviez)\b/i.test(t),
    },
    {
      label: 'subjonctif',
      tipClaim: /\bsubjonctif|subjunctive\b/i,
      cardCheck: t => /\b(que|qu'on|qu'il|qu'elle|qu'ils|qu'elles)\b/i.test(t) ||
                     /\b(soit|soient|aie|aies|ait|ayons|ayez|aient|fasse|fasses|fassent|aille|ailles|aillent|puisse|puisses|puissent|veuille|veuilles|veuillent)\b/i.test(t),
    },
    {
      label: 'conditionnel',
      tipClaim: /\bconditionnel|conditional\b/i,
      cardCheck: t => /\b[a-zàâçéèêëîïôûùüÿ]+(rais|rait|rions|riez|raient)\b/i.test(t) ||
                     /\b(serait|serais|seraient|aurait|aurais|auraient|ferait|ferais|feraient|pourrait|pourrais|pourraient|voudrait|voudrais|voudraient)\b/i.test(t),
    },
  ],

  portuguese: [
    {
      label: 'pretérito perfeito',
      tipClaim: /\bpretérito perfeito|preterite\b/i,
      cardCheck: t => /\b[a-záéíóúâêîôûãõç]+(ei|aste|ou|amos|astes|aram|i|este|eu|emos|estes|eram|i|iste|iu|imos|istes|iram)\b/i.test(t) ||
                     /\b(fui|foste|foi|fomos|fostes|foram|tive|tiveste|teve|tivemos|tivestes|tiveram|fiz|fizeste|fez|fizemos|fizestes|fizeram)\b/i.test(t),
    },
    {
      label: 'imperfeito',
      tipClaim: /\bimperfeito|imperfect\b/i,
      cardCheck: t => /\b[a-záéíóúâêîôûãõç]+(ava|avas|ávamos|aváveis|avam|ia|ias|íamos|íeis|iam)\b/i.test(t),
    },
  ],

  german: [
    {
      label: 'Präteritum',
      tipClaim: /\bpräteritum|preterite\b/i,
      cardCheck: t => /\b(war|warst|waren|wart|hatte|hattest|hatten|hattet|ging|gingen|kam|kamen|sah|sahen|sagte|sagten|machte|machten|wollte|wollten|konnte|konnten|sollte|sollten|musste|mussten|durfte|durften)\b/i.test(t),
    },
    {
      label: 'Perfekt',
      tipClaim: /\bperfekt|present perfect\b/i,
      cardCheck: t => /\b(habe|hast|hat|haben|habt|bin|bist|ist|sind|seid)\s+[a-zäöüß]+(t|en)\b/i.test(t) ||
                     /\bge[a-zäöüß]+(t|en)\b/i.test(t),
    },
  ],

  russian: [
    {
      label: 'perfective aspect',
      tipClaim: /\bperfective\b/i,
      cardCheck: t => /(^|\s)(прочитал|прочитала|написал|написала|сделал|сделала|купил|купила|увидел|увидела|пришёл|пришла|сказал|сказала|поел|поела|выпил|съел|съела|приехал|приехала|ушёл|ушла|закончил|закончила|открыл|открыла|закрыл|закрыла|посмотрел|посмотрела|позвонил|позвонила|вернулся|вернулась)(\s|[.,!?]|$)/i.test(t),
    },
    {
      label: 'instrumental case',
      tipClaim: /\binstrumental\b/i,
      cardCheck: t => /(^|\s)(с|со)\s+[а-яёА-ЯЁ]+(ом|ем|ой|ей|ью|ами|ями)(\s|[.,!?]|$)/i.test(t),
    },
  ],

  hindi: [
    {
      label: 'ergative ने',
      tipClaim: /\bergative\b|ne construction|ने/i,
      cardCheck: t => /ने/.test(t),
    },
  ],

  welsh: [
    {
      label: 'soft mutation',
      tipClaim: /\bsoft mutation\b/i,
      // Also catches the contracted `'n` form (yn → 'n after a vowel),
      // numbers like un/dau triggering, and lone soft-mutated words.
      cardCheck: t => /\b(yn|dau|dwy|dy|fy|ei|tri|chwe|am|ar|at|tan|dros|dan|drwy|gan|wrth|heb)\s+(b|d|g|m|ll|rh|t|c|p|f)\w*/i.test(t) ||
                     /'n\s+(b|d|g|m|ll|rh|t|c|p|f)\w*/i.test(t) ||
                     // Soft-mutated word after preposition i/o (one-letter forms)
                     /\b[io]\s+(b|d|g|m|ll|rh|t|c|p|f)\w*/i.test(t) ||
                     // Feminine noun after y/yr/'r article
                     /\b(y|yr|'r)\s+(b|d|g|m|ll|rh|t|c|p|f)\w+/i.test(t),
    },
    {
      label: 'nasal mutation',
      tipClaim: /\bnasal mutation\b/i,
      cardCheck: t => /\b(fy|yn|yng|ym)\s+(ngh|mh|nh|ng|m|n)\w/i.test(t),
    },
  ],

  turkish: [
    {
      label: 'evidential past',
      // Only flag tips whose PRIMARY topic is evidential (not contrastive
      // mentions like "Distinct from -miş…" which legitimately explain -di
      // by contrast). Skip if the tip also explains -di or use-di.
      tipClaim: /\b(evidential|hearsay)\b/i,
      cardCheck: (t, tip) => {
        if (tip && /\b(use\s+-di|-di\s+for\s+things|distinct\s+from|compare)/i.test(tip)) return true; // contrastive, OK
        return /[a-zçğıöşü]+(miş|mış|muş|müş)/i.test(t);
      },
    },
  ],
};

// ── Audit ─────────────────────────────────────────────────

const langs = langArg ? [langArg] : Object.keys(LANG_DECKS);
const totals = { checked: 0, mismatches: 0, byLang: {} };
const report = {};

for (const lang of langs) {
  const deckPath = LANG_DECKS[lang];
  if (!deckPath || !fs.existsSync(deckPath)) {
    console.error(`skip ${lang} (no deck)`);
    continue;
  }
  const deck = JSON.parse(fs.readFileSync(deckPath, 'utf8'));
  const cards = deck.cards || deck;
  const rules = RULES[lang] || [];

  const langReport = { checked: 0, mismatches: 0, byRule: {}, examples: [] };

  for (const c of cards) {
    if (!c.grammar || !c.grammar.trim()) continue;
    langReport.checked++;
    totals.checked++;

    for (const rule of rules) {
      if (rule.tipClaim.test(c.grammar)) {
        const ok = rule.cardCheck(c.target || '', c.grammar);
        if (!ok) {
          langReport.mismatches++;
          totals.mismatches++;
          langReport.byRule[rule.label] = (langReport.byRule[rule.label] || 0) + 1;
          if (langReport.examples.length < 8) {
            langReport.examples.push({
              id: c.id,
              target: c.target,
              tipExcerpt: c.grammar.substring(0, 100) + (c.grammar.length > 100 ? '…' : ''),
              violatedRule: rule.label,
            });
          }
          if (APPLY) {
            delete c.grammar;
          }
          break; // one mismatch per card is enough
        }
      }
    }
  }

  report[lang] = langReport;
  totals.byLang[lang] = langReport;

  if (APPLY && langReport.mismatches > 0) {
    fs.writeFileSync(deckPath, JSON.stringify(deck, null, 2) + '\n');
  }

  console.log(`${lang.padEnd(11)} checked=${langReport.checked}  mismatches=${langReport.mismatches}`);
  for (const [rule, n] of Object.entries(langReport.byRule)) {
    console.log(`             • ${rule.padEnd(28)} ${n}`);
  }
  if (VERBOSE && langReport.examples.length > 0) {
    console.log(`             Examples:`);
    for (const ex of langReport.examples.slice(0, 3)) {
      console.log(`               – ${ex.target}`);
      console.log(`                 violated: ${ex.violatedRule}`);
      console.log(`                 tip: ${ex.tipExcerpt}`);
    }
  }
}

console.log(`\nTOTAL: checked ${totals.checked}, mismatches ${totals.mismatches} (${Math.round(totals.mismatches/totals.checked*100)}%)`);
if (APPLY) {
  console.log('Applied: mismatched tips cleared. Re-run engine.cjs --apply to refill with tighter patterns.');
} else {
  console.log('(dry run — pass --apply to clear mismatched tips)');
}

if (args.includes('--json')) {
  fs.writeFileSync('scripts/output/grammar-audit.json', JSON.stringify(report, null, 2));
  console.log('Wrote scripts/output/grammar-audit.json');
}
