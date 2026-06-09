#!/usr/bin/env node
/* Tip-card mismatch detector — HIGH CONFIDENCE version.
 *
 * Each rule has:
 *   tipPattern : regex matching tip text that names a SPECIFIC lexical item
 *   cardPattern: regex that detects whether that item is actually on the card
 *
 * Rules only fire on highly specific lexical claims (a particular verb,
 * a particular construction with a unique word). Generic structural rules
 * are skipped to avoid false positives from loose substring matches.
 *
 * Run:
 *   node scripts/tip-card-mismatch.cjs           # summary
 *   node scripts/tip-card-mismatch.cjs hi        # deep dive on one language
 *   node scripts/tip-card-mismatch.cjs --fix     # strip the grammar field on mismatches
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const fix = args.includes('--fix');
const lang1 = args.find(a => !a.startsWith('--'));

// Per-language: high-confidence concept rules.
// Each: [name, tipPattern, cardPattern]
const CONCEPTS = {
  spanish: [
    ['hay',           /\bhay\b\s*=|\bhay\b\s+(?:is|=|means)|hay.*there is/i,        /\bhay\b/i],
    ['por-para',      /\bpor\b.*\bpara\b|\bpara\b.*\bpor\b/i,                       /\b(por|para)\b/i],
    ['ser-estar',     /\bser\b\s+(?:for|=|means)|\bestar\b\s+(?:for|=|means)|ser.*estar.*both/i, /\b(soy|eres|es|somos|sois|son|estoy|estás|está|estamos|estáis|están|sea|seas|esté|estés|sido|estado|era|eran|fue|fueron|estaba|estaban|fui|fuiste|estuvo|estuvieron)(?!\w)/i],
    ['vosotros',      /\bvosotros\b/i,                                              /\b(vosotros|vuestro|vuestra|vuestras|vuestros|áis|éis|ís)\b/i],
    ['hay-vs-tener',  /\bhay\b.*\btener\b|\btener\b.*\bhay\b/i,                     /\b(hay|tengo|tienes|tiene|tenemos|tenéis|tienen)\b/i],
    ['acordarse-quejarse', /\bacordarse\b|\bquejarse\b/i,                          /\b(acuerd|quej)\w*/i],
  ],
  italian: [
    ['piacere',       /\bpiacere\b|\bpiace\b|\bpiacciono\b/i,                       /\b(piace|piacciono|piaceva|piaceranno|piaciuto|piaciuta|piacque)\b/i],
    ['stare-gerundio', /\bsto\b\s+\w+ando|stare\s*\+\s*gerundio|\b-ando\b.*\b-endo\b/i, /\b(sto|stai|sta|stiamo|state|stanno)\s+\w+(ando|endo)\b/i],
    ['ho-fame',       /\bho fame\b|\bho sete\b|\bho freddo\b|\bho paura\b/i,        /\b(ho|hai|ha|abbiamo|avete|hanno)\s+(fame|sete|freddo|caldo|paura|sonno|fretta|ragione|torto|anni)\b/i],
    ['c-e-ci-sono',   /\bc'è\b|\bci sono\b/i,                                       /\b(c'è|ci sono|c'era|c'erano|ci sarà|ci saranno)\b/i],
    ['piacere-flip',  /pizza is pleasing|piacere works backwards|\bpizza\b.*\bpiace\b/i, /\b(piace|piacciono)\b/i],
    ['congiuntivo-che', /\bcongiuntivo\b|\bsubjunctive\b/i,                         /\b(che|perch[éè]|affinch[éè]|prima che|sebbene|bench[éè]|nonostante|qualora)\b/i],
  ],
  french: [
    ['venir-de',      /\bvenir de\b|\bviens de\b|\bvient de\b/i,                    /\b(viens|vient|venons|venez|viennent)\s+d[e']/i],
    ['avoir-froid',   /\bavoir froid\b|\bavoir chaud\b|\bavoir faim\b|\bavoir soif\b/i, /\b(ai|as|a|avons|avez|ont)\s+(froid|chaud|faim|soif|sommeil|peur|raison|tort|mal|envie|besoin)\b/i],
    ['avoir-de-la-chance', /\bavoir de la chance\b|avoir.*luck/i,                   /\b(ai|as|a|avons|avez|ont)\s+de\s+la\s+chance\b/i],
    ['du-accent',     /\bdû\b/,                                                     /\bdû\b/],
    ['on-as-we',      /\bon\b\s*=.*we|\bon\b.*all-purpose|\bon\b\s+is\s+the/i,      /\bon\s+\w/i],
    ['y-replace',     /\b\by\b\b\s*=.*there|\by\s+vais\b|\by\b\s*=.*to it|\by\b\s*\(.*to it/i, /\b(y\s+vais|y\s+v[ao]\w*|j'y|tu y|on y|il y va|elle y va)\b/i],
    ['en-quantity',   /\ben\b\s+is required|\ben\b\s+stands|\ben\b\s*=.*(of them|of it)|j'en ai/i, /\b(j'en|tu en|il en|elle en|on en|nous en|vous en|ils en|elles en)\b/i],
    ['negation-pair', /\bne\s*…?\s*pas\b|\bne\s*…?\s*jamais\b|\bne\s*…?\s*rien\b|\bne\s*…?\s*personne\b|\bne\s*…?\s*plus\b/i, /\b(ne|n')\b/i],
    ['passe-compose-etre', /DR\s*&?\s*MRS|verbs.*être|with être|past with être|aller.*venir.*partir/i, /\b(suis|es|est|sommes|êtes|sont)\s+\S*(?:é|ée|és|ées|i|is|u|us|rt|rts|it|its|ait|nu)(?=\s|$|[.,;!?])/i],
  ],
  portuguese: [
    ['a-gente',       /\ba gente\b|us folks/i,                                      /\ba\s+gente\b/i],
    ['estar-com',     /estar com|\bestou com\b|\bestá com\b|am with hunger/i,       /\b(estou|estás|está|estamos|estão)\s+com\b/i],
    ['gostar-de',     /\bgostar\b.*\bde\b|\bgosto de\b|\bgosta de\b/i,              /\b(gosto|gostas|gosta|gostamos|gostam|gostei|gostou|gostava)\s+(?:de|da|do|dos|das)\b/i],
    ['tem-existential', /\btem\b\s+for\s+.*there is|tem.*= there is|brazilian.*tem/i, /\b(tem|tinha|tinham)\s+\w/i],
    ['talvez-subj',   /\btalvez\b/i,                                                 /\btalvez\b/i],
    ['estar-gerundio', /\bestar\b\s*\+\s*gerúndio|estou\s+\w+ndo|está\s+\w+ndo/i,   /\b(estou|estás|está|estamos|estão)\s+\w+(ando|endo|indo)\b/i],
    ['voce',          /\bvocê\b\s+conjugates|\bvocê\b.*3rd singular/i,              /\b(você|vocês)\b/i],
    ['contractions-pelo', /\bpor\s*\+\s*o\s*→\s*pelo|\bpelo\b|\bpela\b/i,           /\b(pelo|pela|pelos|pelas)\b/i],
  ],
  german: [
    ['dative-prep',   /mit\s*\/\s*aus\s*\/\s*bei\s*\/\s*nach|mit, aus, bei, nach/i, /\b(mit|aus|bei|nach|von|zu|seit|gegenüber)\b/i],
    ['acc-prep',      /für\s*\/\s*durch\s*\/\s*gegen|für, durch, gegen|für\s+always|für.*direct-object/i, /\b(für|durch|gegen|ohne|um|bis|wider)\b/i],
    ['möchte',        /\bmöchte\b/,                                                 /\b(möchte|möchtest|möchten|möchtet)\b/i],
    ['kein',          /\bkein\b\s*=|\bkein\b\s+negates|kein vs nicht/i,             /\b(kein|keine|keinen|keinem|keiner|keines)\b/i],
    ['weil-dass',     /\bweil\b.*\bdass\b|\bdass\b.*\bweil\b|weil.*pushes the verb/i, /\b(weil|dass|wenn|ob|obwohl|als|während|bevor|nachdem|sobald|damit)\b/i],
    ['helfen-dat',    /helfen takes dative|\bhelfen\b\s*\+\s*dative/i,              /\b(helf|half|geholfen|hilft|hilfst)/i],
    ['dative-pronouns', /\bmir\b.*\bdir\b|dative pronouns/i,                        /\b(mir|dir|ihm|ihr|uns|euch|ihnen|Ihnen)\b/i],
  ],
  dutch: [
    ['omdat-want',    /\bomdat\b.*\bwant\b|\bwant\b.*\bomdat\b/i,                   /\b(omdat|want)\b/i],
    ['ons-onze',      /\bons\b\s+vs\s+\bonze\b|onze.*ons/i,                         /\b(ons|onze)\b/i],
    ['geen-niet',     /\bgeen\b\s+negates|\bgeen\b\s*=\s*no/i,                      /\b(geen|niet)\b/i],
    ['modal-end',     /modal verb.*infinitive.*END|modal sits second/i,             /\b(kan|kunt|kunnen|moet|moeten|wil|willen|mag|mogen|zou|zouden)\b.*\w+en\b/i],
    ['er-existential', /\ber is\b|\ber zijn\b|er.*existential|er = .*there is/i,    /\b(er is|er zijn|er was|er waren)\b/i],
    ['je-jij',        /\bje\b\s*\(unstressed\)|\bjij\b\s*\(stressed\)/i,            /\b(je|jij|jou|jouw)\b/i],
  ],
  swedish: [
    ['det-finns',     /\bdet finns\b|\bdet är\b\s*=/i,                              /\b(det är|det finns|det var|det blir)\b/i],
    ['biff',          /\bBIFF\b|att.*när.*om.*eftersom/i,                           /\b(att|när|om|eftersom|fast|innan|därför att|för att|trots att|sedan)\b/i],
    ['har-supinum',   /\bhar\b\s*\+\s*supinum|\bsupinum\b|perfect.*har/i,           /\b(har|hade)\s+\w+(at|t|tt|it)\b/i],
    ['inte-position', /\binte\b\s+goes\s+(BEFORE|AFTER)|inte.*placement/i,          /\binte\b/i],
  ],
  welsh: [
    ['wedi',          /\bwedi\b\s*\+|\bwedi\b\s*=.*perfect|wedi.*perfect/i,         /\bwedi\b/i],
    ['mae-pivot',     /\bMae\b\s*=\s*is|Mae carries|Mae.*present-tense.*is/i,       /\b(mae|maent|mae'r)\b/i],
    ['n-mandatory',   /'n\b\s+is mandatory|\b'n\b\s+(between|after)/i,              /\b('n|yn)\b/i],
    ['ddim-wedi',     /\bddim wedi\b/i,                                              /\bddim\b/i],
    ['newydd',        /\bnewydd\b/i,                                                /\bnewydd\b/i],
  ],
  turkish: [
    ['iyor',          /\b-iyor\b|\b-ıyor\b|\b-uyor\b|\b-üyor\b/i,                  /\w+(ıyor|iyor|uyor|üyor)/i],
    ['ecek-acak',     /\b-ecek\b|\b-acak\b|future.*ecek/i,                          /\w+(ecek|acak|eceğ|acağ)/i],
    ['var-yok',       /\bvar\b\s*=\s*there is|var.*yok|\byok\b\s*=\s*there isn/i,  /\b(var|yok|vardı|yoktu|olacak)\b/i],
    ['mi-particle',   /question particle\s+mi|particle\s+mi.*floats|\bmi mu mü\b/i, /(\bmi\b|\bmı\b|\bmu\b|\bmü\b)/i],
    ['miş',           /\b-miş\b|\b-mış\b|hearsay/i,                                 /\w+(miş|mış|muş|müş)/i],
    ['negation-me',   /-me\s*\/\s*-ma\s+infix|negation.*-me/i,                      /\w+(me|ma)(d|y|m|n|k|niz|nız|nüz|nuz)/i],
    ['ablative-den',  /\b-den\b\s*\/\s*-dan\b|ablative.*from/i,                     /\w+(den|dan|ten|tan)\b/i],
    ['locative-de',   /\b-de\b\s*\/\s*-da\b|locative.*at\/on/i,                     /\w+(de|da|te|ta)\b/i],
    ['possession',    /\b-im\b.*\b-in\b.*\b-i\b|possession.*baked|evim.*evin/i,    /\w+(ım|im|um|üm|ın|in|un|ün|ısı|isi|usu|üsü)\b/i],
  ],
  hindi: [
    ['ne-ergative',   /\bने\b|ergative\s+ने|main+ne|ने.*subject/i,                /\bने\b|\bमैंने\b|\bतुमने\b|\bआपने\b|\bउन्होंने\b|\bउसने\b/],
    ['chahiye',       /\bचाहिए\b|chahiye/i,                                         /\bचाहिए\b/],
    ['ko-marker',     /\bको\b.*marker|को.*specific direct|को.*recipient/i,         /\bको\b/],
    ['past-tha',      /\bथा\b|\bथी\b|\bथे\b|past.*था|imperfect.*tha/i,             /\b(था|थी|थे|थीं)\b/],
    ['kya-question',  /\bक्या\b.*\(kya/i,                                           /\bक्या\b/],
    ['speaker-fem',   /a woman saying|woman.*करती|f form|female speaker/i,         /\bम(ैं|ें|ुझे)\b.*\w+(ती|तीं|ी)/],
    ['raha-continuous', /\bरहा\b|\bरही\b|\bरहे\b|continuous.*-rah|going.*rha/i,    /\b(रहा|रही|रहे|रहीं)\b/],
    ['gaya-past',     /\bगया\b|\bगई\b|main gaya|past intransitive.*ने/i,           /\b(गया|गयी|गई|गए)\b/],
  ],
  russian: [
    ['reflexive-sya', /\b-ся\b|\b-сь\b|sya|reflexive verbs end/i,                   /\w+(ся|сь)\b/],
    ['by-conditional', /\bбы\b\s*\+\s*past|\bбы\b\s*=.*conditional/i,              /\bбы\b/],
    ['esli-by',       /\bесли бы\b/i,                                              /\bесли бы\b/i],
    ['motion-pairs',  /\bидти\b.*\bходить\b|идти.*ехать.*ходить|motion.*pair/i,    /\b(иду|идёт|идём|идут|идёшь|идёте|ходи|ход|еду|ед|езд)/i],
    ['prepositional', /prepositional case|в\s*Москве|на\s*столе/i,                /\b(в|на|о|об|при)\s+\w+(е|и)\b/i],
    ['nu-numbers',    /numbers? 2\/3\/4|gen\.?\s*sg.*after.*two/i,                  /\b(два|две|три|четыре|оба|обе)\s+\w/i],
    ['adj-before',    /adjective.*BEFORE.*noun|adjective comes BEFORE/i,            /\b\w+(ый|ой|ий|ая|ое|ые|ие)\s+\w+\b/i],
  ],
};

function loadDeck(lang) {
  const p = path.join('src/data', lang, 'deck.json');
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

const langList = lang1 ? [lang1] : Object.keys(CONCEPTS);
const mismatchesByLang = {};

for (const lang of langList) {
  const concepts = CONCEPTS[lang];
  if (!concepts) continue;
  const deck = loadDeck(lang);
  if (!deck) continue;
  const mismatches = [];
  for (const card of deck) {
    if (!card.grammar) continue;
    for (const [name, tipPattern, cardPattern] of concepts) {
      if (tipPattern.test(card.grammar) && !cardPattern.test(card.target)) {
        mismatches.push({ id: card.id, concept: name, target: card.target, tip: card.grammar });
        break;
      }
    }
  }
  mismatchesByLang[lang] = mismatches;
}

if (lang1) {
  const mm = mismatchesByLang[lang1] || [];
  console.log('=== ' + lang1.toUpperCase() + ' ' + mm.length + ' mismatches ===\n');
  for (const m of mm.slice(0, 20)) {
    console.log('[' + m.id + ']  expected: ' + m.concept);
    console.log('  card: ' + m.target);
    console.log('  tip : ' + m.tip.slice(0, 130));
    console.log();
  }
  if (mm.length > 20) console.log('… (' + (mm.length - 20) + ' more)');
} else {
  console.log('Mismatch counts per language:');
  for (const lang of langList) {
    const n = (mismatchesByLang[lang] || []).length;
    console.log('  ' + lang.padEnd(11) + n);
  }
  console.log('\nRun with a language arg to see samples, or --fix to strip.');
}

if (fix) {
  let total = 0;
  for (const lang of langList) {
    const mm = mismatchesByLang[lang] || [];
    if (!mm.length) continue;
    const p = path.join('src/data', lang, 'deck.json');
    const deck = JSON.parse(fs.readFileSync(p, 'utf8'));
    const ids = new Set(mm.map(m => m.id));
    let stripped = 0;
    for (const card of deck) {
      if (ids.has(card.id)) { delete card.grammar; stripped++; }
    }
    fs.writeFileSync(p, JSON.stringify(deck, null, 2));
    console.log(lang + ': stripped grammar from ' + stripped + ' cards');
    total += stripped;
  }
  console.log('Total stripped: ' + total);
}
