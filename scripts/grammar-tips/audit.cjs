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
      // NOTE: JS \b is ASCII-only — it false-matches inside words containing
      // accented chars (despué\bs because é→s is treated as a word boundary).
      // We use unicode lookaround over the Spanish alphabet (incl. accents).
      cardCheck: t => {
        // Irregular preterite forms
        const irr = /(?<![a-záéíóúñü])(fui|fuiste|fue|fuimos|fuisteis|fueron|tuve|tuviste|tuvo|tuvimos|tuvisteis|tuvieron|hice|hiciste|hizo|hicimos|hicisteis|hicieron|dije|dijiste|dijo|dijimos|dijisteis|dijeron|estuve|estuviste|estuvo|estuvimos|estuvisteis|estuvieron|vi|viste|vio|vimos|vine|viniste|vino|vinimos|vinisteis|vinieron|di|diste|dio|dimos|disteis|dieron|puse|pusiste|puso|pusimos|pusisteis|pusieron|supe|supiste|supo|supimos|supisteis|supieron|pude|pudiste|pudo|pudimos|pudisteis|pudieron|quise|quisiste|quiso|quisimos|quisisteis|quisieron|trajo|trajeron|leyó|leyeron|oyó|oyeron)(?![a-záéíóúñü])/i;
        if (irr.test(t)) return true;
        // Regular preterite endings — strict: must be whole-word, min 2-letter stem
        const reg = /(?<![a-záéíóúñü])[a-záéíóúñü]{2,}(?:aste|asteis|aron|iste|isteis|ieron|ió)(?![a-záéíóúñü])/i;
        return reg.test(t);
      },
    },
    {
      label: 'imperfect',
      tipClaim: /\bimperfect\b/i,
      cardCheck: t => {
        // -ar imperfect: reliable verb-only endings
        if (/(?<![a-záéíóúñü])[a-záéíóúñü]{2,}(?:aba|abas|ábamos|abais|aban)(?![a-záéíóúñü])/i.test(t)) return true;
        // Irregular era/iba
        if (/(?<![a-záéíóúñü])(era|eras|éramos|erais|eran|iba|ibas|íbamos|ibais|iban)(?![a-záéíóúñü])/i.test(t)) return true;
        // -ía endings: exclude common -ía-ending nouns
        const NOUN_IA = /^(día|días|guía|guías|tía|tías|policía|policías|alegría|alegrías|economía|categoría|fotografía|geografía|filosofía|teoría|melodía|simpatía|panadería|librería|carnicería|pastelería|peluquería|joyería|cafetería|sandía|magia|sangría|rabia|ironía|mía|tuya|suya|hacia|gracias|familia|frecuencia|provincia|farmacia|democracia|burocracia|justicia|noticia|delicia|propia|propias|sucia|sucias|limpia|limpias|sabia|sabias|amplia|amplias|envidia|distancia|importancia|paciencia|presencia|tendencia|experiencia|conciencia|preferencia|ciencia|geografía|infancia|frío|fría|frías)$/i;
        const cands = t.match(/(?<![a-záéíóúñü])[a-záéíóúñü]{2,}(?:ía|ías|íamos|íais|ían)(?![a-záéíóúñü])/gi) || [];
        return cands.some(w => !NOUN_IA.test(w));
      },
    },
    {
      label: 'subjunctive',
      tipClaim: /\bsubjunctive\b/i,
      cardCheck: t => /(?<![a-záéíóúñü])(que|cuando|aunque|ojalá|quizás|tal\s+vez)(?![a-záéíóúñü])/i.test(t) &&
                     /(?<![a-záéíóúñü])[a-záéíóúñü]+(?:e|es|en|emos|éis|a|as|an|amos|áis)(?![a-záéíóúñü])/i.test(t) ||
                     /(?<![a-záéíóúñü])(sea|seas|seamos|sean|tenga|tengas|tengamos|tengan|haga|hagas|hagamos|hagan|vaya|vayas|vayamos|vayan|pueda|puedas|podamos|puedan|quiera|quieras|queramos|quieran|sepa|sepas|sepamos|sepan|venga|vengas|vengamos|vengan|dé|des|demos|den|esté|estés|estemos|estén|fuera|fueras|fuéramos|fueran|tuviera|tuvieras|tuviéramos|tuvieran)(?![a-záéíóúñü])/i.test(t),
    },
    {
      label: 'conditional',
      tipClaim: /\bconditional\b/i,
      cardCheck: t => /(?<![a-záéíóúñü])[a-záéíóúñü]+(?:ría|rías|ríamos|ríais|rían)(?![a-záéíóúñü])/i.test(t) ||
                     /(?<![a-záéíóúñü])(sería|serías|seríamos|serían|tendría|tendrías|tendríamos|tendrían|haría|harías|haríamos|harían|podría|podrías|podríamos|podrían|querría|querrías|querríamos|querrían|debería|deberías|deberíamos|deberían|gustaría|gustarían)(?![a-záéíóúñü])/i.test(t),
    },
    {
      label: 'future',
      tipClaim: /\bfuture tense\b/i,
      cardCheck: t => /(?<![a-záéíóúñü])[a-záéíóúñü]+(?:aré|arás|ará|aremos|aréis|arán|eré|erás|erá|eremos|eréis|erán|iré|irás|irá|iremos|iréis|irán)(?![a-záéíóúñü])/i.test(t) ||
                     /(?<![a-záéíóúñü])(será|seré|serás|seremos|serán|tendré|tendrás|tendrá|tendremos|tendrán|haré|harás|hará|haremos|harán|podré|podrás|podrá|podremos|podrán|iré|irás|irá|iremos|irán|haré|sabré|querré|pondré|saldré|valdré|cabré)(?![a-záéíóúñü])/i.test(t),
    },
  ],

  italian: [
    {
      label: 'passato remoto',
      tipClaim: /\bpassato remoto\b/i,
      cardCheck: t => /(?<![a-zàèéìòù])[a-zàèéìòù]{2,}(?:asti|ammo|arono|esti|emmo|este|erono|isti|immo|iste|irono)(?![a-zàèéìòù])/i.test(t) ||
                     /(?<![a-zàèéìòù])(fui|fosti|fu|fummo|foste|furono|ebbi|avesti|ebbe|avemmo|aveste|ebbero|feci|facesti|fece|facemmo|faceste|fecero|dissi|dicesti|disse|dicemmo|diceste|dissero|venni|venisti|venne|vidi|vide|vedemmo|vissi|visse)(?![a-zàèéìòù])/i.test(t),
    },
    {
      label: 'imperfetto',
      tipClaim: /\bimperfetto\b/i,
      cardCheck: t => /(?<![a-zàèéìòù])[a-zàèéìòù]{2,}(?:avo|avi|ava|avamo|avate|avano|evo|evi|eva|evamo|evate|evano|ivo|ivi|iva|ivamo|ivate|ivano)(?![a-zàèéìòù])/i.test(t) ||
                     /(?<![a-zàèéìòù])(ero|eri|era|eravamo|eravate|erano|avevo|avevi|aveva|avevamo|avevate|avevano)(?![a-zàèéìòù])/i.test(t),
    },
    {
      label: 'congiuntivo',
      tipClaim: /\bcongiuntivo|subjunctive\b/i,
      cardCheck: t => /(?<![a-zàèéìòù])(che|sebbene|benché|affinché)(?![a-zàèéìòù])/i.test(t) ||
                     /(?<![a-zàèéìòù])(sia|siano|abbia|abbiano|faccia|facciano|vada|vadano|venga|vengano|possa|possano|sappia|sappiano|voglia|vogliano|debba|debbano|stia|stiano|dia|diano|fosse|fossero|avesse|avessero|fossi|avessi|amassi|finissi|prendessi)(?![a-zàèéìòù])/i.test(t),
    },
  ],

  french: [
    {
      label: 'passé composé',
      tipClaim: /\bpassé composé\b/i,
      cardCheck: t => /(?<![a-zàâçéèêëîïôûùüÿ])(a|ai|as|avons|avez|ont|est|es|sommes|êtes|sont)\s+[a-zàâçéèêëîïôûùüÿ]+(?:é|ée|és|ées|i|is|ie|ies|u|us|ue|ues|t|ts|te|tes)(?![a-zàâçéèêëîïôûùüÿ])/i.test(t),
    },
    {
      label: 'imparfait',
      tipClaim: /\b(imparfait|imperfect)\b/i,
      cardCheck: t => /(?<![a-zàâçéèêëîïôûùüÿ])[a-zàâçéèêëîïôûùüÿ]{2,}(?:ais|ait|aient|ions|iez)(?![a-zàâçéèêëîïôûùüÿ])/i.test(t) ||
                     /(?<![a-zàâçéèêëîïôûùüÿ])(était|étais|étaient|étions|étiez|avait|avais|avaient|avions|aviez|allait|allais|faisait|faisais|disait|venait)(?![a-zàâçéèêëîïôûùüÿ])/i.test(t),
    },
    {
      label: 'subjonctif',
      tipClaim: /\b(subjonctif|subjunctive)\b/i,
      cardCheck: t => /(?<![a-zàâçéèêëîïôûùüÿ])(que|qu'on|qu'il|qu'elle|qu'ils|qu'elles)(?![a-zàâçéèêëîïôûùüÿ])/i.test(t) ||
                     /(?<![a-zàâçéèêëîïôûùüÿ])(soit|soient|aie|aies|ait|ayons|ayez|aient|fasse|fasses|fassent|aille|ailles|aillent|puisse|puisses|puissent|veuille|veuilles|veuillent|sache|saches|sachions|sachiez|sachent)(?![a-zàâçéèêëîïôûùüÿ])/i.test(t),
    },
    {
      label: 'conditionnel',
      tipClaim: /\b(conditionnel|conditional)\b/i,
      cardCheck: t => /(?<![a-zàâçéèêëîïôûùüÿ])[a-zàâçéèêëîïôûùüÿ]{2,}(?:rais|rait|rions|riez|raient)(?![a-zàâçéèêëîïôûùüÿ])/i.test(t) ||
                     /(?<![a-zàâçéèêëîïôûùüÿ])(serait|serais|seraient|aurait|aurais|auraient|ferait|ferais|feraient|pourrait|pourrais|pourraient|voudrait|voudrais|voudraient|irait|irais|iraient|devrait|devrais|devraient|aimerait|aimerais|aimeraient)(?![a-zàâçéèêëîïôûùüÿ])/i.test(t),
    },
  ],

  portuguese: [
    {
      label: 'pretérito perfeito',
      tipClaim: /\b(pretérito perfeito|preterite)\b/i,
      cardCheck: t => /(?<![a-záéíóúâêîôûãõç])[a-záéíóúâêîôûãõç]{2,}(?:aste|astes|aram|este|estes|eram|iste|istes|iram|iu|eu|ou)(?![a-záéíóúâêîôûãõç])/i.test(t) ||
                     /(?<![a-záéíóúâêîôûãõç])(fui|foste|foi|fomos|fostes|foram|tive|tiveste|teve|tivemos|tivestes|tiveram|fiz|fizeste|fez|fizemos|fizestes|fizeram|disse|disseste|disse|dissemos|dissestes|disseram|vi|viste|viu|vimos|vistes|viram|vim|vieste|veio|viemos|viestes|vieram|dei|deste|deu|demos|destes|deram|pus|puseste|pôs)(?![a-záéíóúâêîôûãõç])/i.test(t),
    },
    {
      label: 'imperfeito',
      tipClaim: /\b(imperfeito|imperfect)\b/i,
      cardCheck: t => {
        if (/(?<![a-záéíóúâêîôûãõç])[a-záéíóúâêîôûãõç]{2,}(?:ava|avas|ávamos|aváveis|avam)(?![a-záéíóúâêîôûãõç])/i.test(t)) return true;
        if (/(?<![a-záéíóúâêîôûãõç])(era|eras|éramos|éreis|eram|ia|ias|íamos|íeis|iam|tinha|tinhas|tínhamos|tínheis|tinham|via|vias|fazia|fazias|dizia)(?![a-záéíóúâêîôûãõç])/i.test(t)) {
          const NOUN_IA = /^(família|história|polícia|farmácia|democracia|geografia|filosofia|economia|teoria|biografia|categoria|fotografia|criança|infância|esperança|distância|importância|paciência|presença|tendência|experiência|consciência|preferência|ciência|justiça|notícia|delícia|caricia|magia|alegria|graça|herança|frequência|elegância|essência|circunstância)$/i;
          const cands = t.match(/(?<![a-záéíóúâêîôûãõç])[a-záéíóúâêîôûãõç]{2,}(?:ia|ias|íamos|íeis|iam)(?![a-záéíóúâêîôûãõç])/gi) || [];
          return cands.some(w => !NOUN_IA.test(w)) || /(?<![a-záéíóúâêîôûãõç])(era|eras|éramos|tinha|tinhas)(?![a-záéíóúâêîôûãõç])/i.test(t);
        }
        return false;
      },
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
