#!/usr/bin/env node
/**
 * Comprehensive Italian dictionary review + fix script.
 * Checks every single entry for all known issue types and applies fixes.
 */

const fs = require('fs');
const path = require('path');

const DICT_PATH = path.join(__dirname, '..', 'src', 'data', 'dictionary', 'it.ts');
const OUTPUT_PATH = path.join(__dirname, 'output', 'it-full-verb-review.json');

const src = fs.readFileSync(DICT_PATH, 'utf8');

// Parse all dictionary entries
const entries = [];
const lineRegex = /^\s*['"]([^'"]+)['"]\s*:\s*\{([^}]+)\}/gm;

function parseEntry(key, body) {
  const en = body.match(/en:\s*'([^']*(?:\\'[^']*)*)'/)?.[1]?.replace(/\\'/g, "'") || '';
  const pos = body.match(/pos:\s*'([^']*)'/)?.[1] || '';
  const lemma = body.match(/lemma:\s*'([^']*)'/)?.[1] || undefined;
  return { key, en, pos, lemma };
}

let m;
while ((m = lineRegex.exec(src)) !== null) {
  entries.push(parseEntry(m[1], m[2]));
}

console.log(`Total entries parsed: ${entries.length}`);

// Build infinitive set
const infinitives = new Set();
for (const e of entries) {
  if ((e.key.endsWith('are') || e.key.endsWith('ere') || e.key.endsWith('ire') ||
       e.key.endsWith('arsi') || e.key.endsWith('ersi') || e.key.endsWith('irsi')) && e.pos === 'v') {
    infinitives.add(e.key);
  }
}

// Build entry lookup
const entryMap = {};
for (const e of entries) entryMap[e.key] = e;

// ============================================================
// COMPREHENSIVE FIXES MAP
// ============================================================
const FIXES = {};

function fix(key, en, pos, lemma, issueType, note) {
  FIXES[key] = { en, pos, lemma, issueType, note };
}

// === A section ===
fix('a', 'to, at', 'prep', null, 'wrong-pos', 'preposition');
fix('abbassare', 'to lower, to turn down', 'v', undefined, 'wrong-meaning', '"mind; lower" garbled');
fix('abbastanza', 'enough, fairly', 'adv', null, 'wrong-pos', 'adverb');
fix('abbronzato', 'tanned', 'adj', null, 'to-prefix-on-non-verb', 'adjective');
fix('abita', 'lives, resides', 'v', 'abitare', 'wrong-meaning', '"he\'s; he life" garbled');
fix('abitanti', 'inhabitants', 'n', null, 'to-prefix-on-non-verb', 'noun');
fix('abiti', 'clothes, garments', 'n', null, 'wrong-meaning', 'noun = clothes');
fix('abitua', 'gets used to', 'v', 'abituarsi', 'wrong-lemma', 'lemma should be abituarsi');
fix('abituali', 'habitual, usual', 'adj', null, 'to-prefix-on-non-verb', 'adj; wrong lemma');
fix('abitudine', 'habit', 'n', null, 'to-prefix-on-non-verb', 'noun');
fix('accada', 'happens (subjunctive)', 'v', 'accadere', 'garbage-translation', '"to ?" garbage');
fix('accademia', 'academy', 'n', null, 'to-prefix-on-non-verb', 'noun; wrong lemma');
fix('accede', 'accesses, logs in', 'v', 'accedere', 'wrong-meaning', '"stairs; logs in" garbled');
fix('accento', 'accent, stress', 'n', null, 'wrong-pos', 'noun not verb');
fix('accesa', 'turned on, lit', 'adj', 'acceso', 'wrong-meaning', '"fireplace; turned on" garbled');
fix('acceso', 'turned on, lit', 'adj', null, 'to-prefix-on-non-verb', 'adj not verb');
fix('accesso', 'access, admittance', 'n', undefined, 'wrong-pos', 'noun');
fix('accettabili', 'acceptable', 'adj', null, 'to-prefix-on-non-verb', 'adjective');
fix('accomodarsi', 'to sit down, to make oneself comfortable', 'v', undefined, 'garbage-translation', 'meta-description');
fix('accomodi', 'sit down, make yourself comfortable', 'v', 'accomodarsi', 'wrong-meaning', 'grammar desc as translation');
fix('accontentarti', 'to settle for, to be content with', 'v', 'accontentarsi', 'garbage-translation', '"to wants; settle for it" garbled');
fix('accorga', 'notices (subjunctive)', 'v', 'accorgersi', 'wrong-meaning', '"anyone; notice" garbled');
fix('accorgesse', 'noticed (subjunctive)', 'v', 'accorgersi', 'wrong-meaning', '"anyone; he noticed" garbled');
fix('accorto', 'noticed; shrewd', 'adj', null, 'wrong-meaning', '"hadn\'t; aware" garbled');
fix('accogliente', 'welcoming, cozy', 'adj', null, 'wrong-meaning', '"house; welcoming" garbled');
fix('accolto', 'welcomed, received', 'adj', 'accogliere', 'to-prefix-on-non-verb', 'adj');
fix('accolta', 'welcomed, received', 'adj', 'accogliere', 'to-prefix-on-non-verb', 'adj');
fix('acquisto', 'purchase', 'n', null, 'to-prefix-on-non-verb', 'noun');
fix('accanto', 'nearby, next to', 'adv', null, 'wrong-pos', 'adverb');
fix('ad', 'to, at', 'prep', null, 'wrong-pos', 'preposition');
fix('addirittura', 'even, actually', 'adv', null, 'wrong-pos', 'adverb');
fix('addormentarmi', 'to fall asleep', 'v', 'addormentarsi', 'garbage-translation', '"to compound of" meta');
fix('addormentarsi', 'to fall asleep', 'v', undefined, 'garbage-translation', '"to reflexive of" meta');
fix('addormentata', 'asleep', 'adj', 'addormentato', 'to-prefix-on-non-verb', 'adj');
fix('addormentato', 'asleep', 'adj', null, 'to-prefix-on-non-verb', 'adj');
fix('addietro', 'ago, back', 'adv', null, 'wrong-meaning', '"to known; ago" garbled');
fix('adesso', 'now', 'adv', null, 'wrong-pos', 'adverb');
fix('adottate', 'adopted', 'adj', 'adottare', 'to-prefix-on-non-verb', 'adj');
fix('affare', 'matter, deal', 'n', null, 'to-prefix-on-non-verb', 'noun');
fix('affari', 'business, affairs', 'n', 'affare', 'wrong-pos', 'noun');
fix('affascinante', 'fascinating, charming', 'adj', undefined, 'wrong-pos', 'adjective');
fix('affatto', 'at all, completely', 'adv', null, 'wrong-pos', 'adverb; wrong lemma');
fix('affermare', 'to state, to affirm', 'v', undefined, 'wrong-meaning', '"conclusion; affirm" garbled');
fix('affermato', 'stated, established', 'adj', 'affermare', 'wrong-meaning', '"conclusion; affirm" garbled');
fix('affetta', 'slices', 'v', 'affettare', 'wrong-meaning', '"to affected" wrong; wrong lemma');
fix('affetto', 'affection', 'n', null, 'wrong-meaning', 'noun; not "to affected"');
fix('affettuoso', 'affectionate', 'adj', null, 'to-prefix-on-non-verb', 'adj');
fix('affidabile', 'reliable, trustworthy', 'adj', null, 'to-prefix-on-non-verb', 'adj');
fix('affinche', 'so that', 'conj', null, 'to-prefix-on-non-verb', 'conjunction');
fix('affinché', 'so that', 'conj', null, 'to-prefix-on-non-verb', 'conjunction');
fix('affollata', 'crowded', 'adj', 'affollato', 'to-prefix-on-non-verb', 'adj');
fix('affollato', 'crowded', 'adj', null, 'to-prefix-on-non-verb', 'adj');
fix('affrettata', 'rushed, hasty', 'adj', 'affrettato', 'wrong-meaning', '"to view; rushed" garbled');
fix('affronta', 'faces, confronts', 'v', 'affrontare', 'wrong-meaning', '"to or confront" garbled');
fix('affrontare', 'to face, to confront', 'v', undefined, 'missing-to-prefix', 'verb needs "to "');
fix('affrontata', 'faced, confronted', 'adj', 'affrontare', 'wrong-pos', 'adj');
fix('affrontato', 'faced, confronted', 'adj', 'affrontare', 'wrong-pos', 'adj');
fix('affronti', 'affronts, insults', 'n', null, 'wrong-meaning', '"mayor; affront" garbled');
fix('affrontiamo', 'we face', 'v', 'affrontare', 'wrong-pos', 'verb');
fix('affacciata', 'overlooking', 'adj', 'affacciarsi', 'wrong-meaning', '"to woken; overlooking" garbled');
fix('affamati', 'hungry, starving', 'adj', null, 'wrong-lemma', 'wrong lemma affare');
fix('agenzia', 'agency', 'n', null, 'to-prefix-on-non-verb', 'noun');
fix('aggiornati', 'updated, up-to-date', 'adj', undefined, 'to-prefix-on-non-verb', 'adj');
fix('aggiunta', 'addition', 'n', null, 'to-prefix-on-non-verb', 'noun');
fix('aggiunto', 'added, additional', 'adj', null, 'to-prefix-on-non-verb', 'adj');
fix('agosto', 'August', 'n', null, 'to-prefix-on-non-verb', 'month name');
fix('agio', 'ease, comfort', 'n', null, 'wrong-meaning', 'noun not verb');
fix('ali', 'wings', 'n', 'ala', 'to-prefix-on-non-verb', 'noun');
fix('alcolici', 'alcoholic drinks', 'n', 'alcolico', 'wrong-meaning', '"it\'s; alcoholic beverage" garbled');
fix('alcun', 'any, no', 'det', null, 'wrong-meaning', '"to started; any" garbled');
fix('allegri', 'cheerful, merry', 'adj', 'allegro', 'to-prefix-on-non-verb', 'adj');
fix('allenatore', 'trainer, coach', 'n', undefined, 'wrong-meaning', '"to seems; trainer" garbled');
fix('allaperto', 'outdoors, in the open', 'adv', undefined, 'wrong-meaning', '"table" is wrong');
fix('allappuntamento', 'at the appointment', 'adv', undefined, 'wrong-meaning', '"to gave" wrong');
fix('allingresso', 'at the entrance', 'adv', undefined, 'wrong-meaning', '"to pay" wrong');
fix('allinizio', 'at the beginning', 'adv', undefined, 'wrong-meaning', '"enthusiastic" wrong');
fix('allinterno', 'inside, within', 'adv', undefined, 'wrong-meaning', '"to smoke" wrong');
fix('allevento', 'at the event', 'adv', undefined, 'wrong-meaning', '"really" wrong');
fix('allora', 'then, so', 'adv', undefined, 'wrong-pos', 'adverb');
fix('almeno', 'at least', 'adv', undefined, 'wrong-pos', 'adverb');
fix('altrettanto', 'likewise, equally', 'adv', undefined, 'wrong-meaning', '"health; likewise" garbled');
fix('alzarsi', 'to get up, to stand up', 'v', undefined, 'garbage-translation', '"to reflexive of" meta');
fix('alzavo', 'used to get up', 'v', 'alzare', 'wrong-meaning', '"i" truncated');
fix('alzerò', 'I will get up', 'v', 'alzare', 'wrong-meaning', '"tomorrow; i" garbled');
fix('alzi', 'get up, raise', 'v', 'alzare', 'wrong-meaning', '"late; raise" garbled');
fix('alzo', 'I get up, I raise', 'v', 'alzare', 'wrong-meaning', '"six; i raise" garbled');
fix('alzato', 'gotten up, raised', 'adj', 'alzare', 'wrong-meaning', '"to gotten; raised"');
fix('alzò', 'raised, got up', 'v', 'alzare', 'wrong-meaning', '"to stood; he raised" garbled');
fix('alza', 'raises, gets up', 'v', 'alzare', 'wrong-meaning', '"to gets; raise" garbled');
fix('aiutarla', 'to help her', 'v', 'aiutare', 'garbage-translation', '"to compound of" meta');
fix('aiutarli', 'to help them', 'v', 'aiutare', 'garbage-translation', '"to compound of" meta');
fix('alloggia', 'lodges, stays', 'v', 'alloggiare', 'wrong-meaning', '"latecomer; lodge" garbled');
fix('allergico', 'allergic', 'adj', undefined, 'wrong-pos', 'adjective');
fix('allegro', 'cheerful, merry', 'adj', undefined, 'wrong-pos', 'adjective');
fix('ai', 'to the (masc. pl.)', 'prep', null, 'wrong-pos', 'preposition');
fix('al', 'to the (masc.)', 'prep', null, 'wrong-pos', 'preposition');
fix('all', 'to the', 'prep', null, 'wrong-pos', 'preposition');
fix('alla', 'to the (fem.)', 'prep', null, 'wrong-pos', 'preposition');
fix('alle', 'to the (fem. pl.)', 'prep', null, 'wrong-pos', 'preposition');
fix('agli', 'to the (masc. pl.)', 'prep', null, 'wrong-pos', 'preposition');
fix('anche', 'also, too', 'adv', null, 'wrong-pos', 'adverb');
fix('ancora', 'still, again, yet', 'adv', null, 'wrong-pos', 'adverb');
fix('ambasciata', 'embassy', 'n', undefined, 'wrong-pos', 'noun');
fix('ambientale', 'environmental', 'adj', null, 'to-prefix-on-non-verb', 'adj');
fix('ambiente', 'environment', 'n', undefined, 'wrong-meaning', '"wine; environment" garbled');
fix('ambizione', 'ambition', 'n', null, 'to-prefix-on-non-verb', 'noun');
fix('ambizioso', 'ambitious', 'adj', null, 'to-prefix-on-non-verb', 'adj');
fix('ambulanza', 'ambulance', 'n', null, 'to-prefix-on-non-verb', 'noun');
fix('americana', 'American', 'adj', null, 'to-prefix-on-non-verb', 'adj');
fix('amicizia', 'friendship', 'n', undefined, 'wrong-meaning', '"didn\'t; friendship" garbled');
fix('ammesso', 'admitted, granted', 'adj', undefined, 'wrong-meaning', '"to assuming; admitted" garbled');
fix('ammetterlo', 'to admit it', 'v', 'ammettere', 'garbage-translation', '"to compound of" meta');
fix('amministrazione', 'administration', 'n', undefined, 'wrong-meaning', '"next; administration" garbled');
fix('ammirevole', 'admirable', 'adj', null, 'to-prefix-on-non-verb', 'adj');
fix('amore', 'love', 'n', null, 'to-prefix-on-non-verb', 'noun');
fix('amaro', 'bitter', 'adj', null, 'wrong-lemma', 'lemma amare wrong');
fix('amati', 'loved, beloved', 'adj', 'amare', 'to-prefix-on-non-verb', 'adj');
fix('animati', 'animated', 'adj', null, 'wrong-meaning', '"to watched; animated" garbled');
fix('annaffia', 'waters, sprinkles', 'v', 'annaffiare', 'wrong-meaning', '"by sprinkling water" garbled');
fix('annaffiate', 'water (imperative)', 'v', 'annaffiare', 'wrong-meaning', '"to by sprinkling water" garbled');
fix('annoia', 'bores, annoys', 'v', 'annoiarsi', 'wrong-meaning', '"to gets; it\'s boring" garbled');
fix('annullare', 'to cancel, to annul', 'v', undefined, 'wrong-meaning', '"to continues; delete" garbled');
fix('annunciate', 'announced', 'adj', 'annunciare', 'to-prefix-on-non-verb', 'adj');
fix('annunciato', 'announced', 'adj', 'annunciare', 'to-prefix-on-non-verb', 'adj');
fix('annuncio', 'announcement', 'n', null, 'to-prefix-on-non-verb', 'noun');
fix('antica', 'ancient, old', 'adj', 'antico', 'wrong-meaning', '"to lived; ancient" garbled');
fix('antichi', 'ancient, old', 'adj', 'antico', 'wrong-meaning', '"watchmaker; ancient" garbled');
fix('anticipatamente', 'in advance, beforehand', 'adv', undefined, 'wrong-meaning', '"thank; beforehand" garbled');
fix('anticipo', 'early; advance', 'n', undefined, 'wrong-pos', 'noun');
fix('antico', 'ancient, old', 'adj', null, 'wrong-meaning', '"to lived; ancient" garbled');
fix('antipatico', 'unpleasant, unlikeable', 'adj', undefined, 'wrong-pos', 'adj');
fix('anzi', 'rather, on the contrary', 'adv', undefined, 'wrong-pos', 'adverb');
fix('aperitivo', 'aperitif', 'n', undefined, 'wrong-pos', 'noun');
fix('aperta', 'open', 'adj', 'aperto', 'wrong-meaning', '"she\'d; open" garbled');
fix('aperte', 'open', 'adj', 'aperto', 'wrong-meaning', '"she\'d; open" garbled');
fix('aperti', 'open', 'adj', 'aperto', 'to-prefix-on-non-verb', 'adj');
fix('aperto', 'open', 'adj', undefined, 'wrong-meaning', '"she\'d; open" garbled');
fix('apertura', 'opening', 'n', null, 'to-prefix-on-non-verb', 'noun');
fix('appena', 'just, as soon as', 'adv', undefined, 'wrong-meaning', '"out; as soon as" garbled');
fix('appeso', 'hung, hanging', 'adj', null, 'to-prefix-on-non-verb', 'adj');
fix('appetito', 'appetite', 'n', undefined, 'wrong-pos', 'noun');
fix('appassionati', 'enthusiasts, passionate', 'n', undefined, 'wrong-meaning', '"students; enthusiast" garbled');
fix('approvata', 'approved', 'adj', 'approvare', 'to-prefix-on-non-verb', 'adj');
fix('approvato', 'approved', 'adj', 'approvare', 'to-prefix-on-non-verb', 'adj');
fix('apprezzata', 'appreciated, valued', 'adj', 'apprezzare', 'to-prefix-on-non-verb', 'adj');
fix('approccio', 'approach', 'n', null, 'to-prefix-on-non-verb', 'noun');
fix('approfondimento', 'in-depth analysis', 'n', undefined, 'wrong-meaning', '"deeper; in-depth analysis" garbled');
fix('appuntite', 'sharp, pointed', 'adj', null, 'wrong-meaning', '"to appear" wrong; wrong lemma');
fix('appunto', 'exactly, precisely', 'adv', null, 'wrong-meaning', 'adverb not verb');
fix('apportare', 'to bring, to make', 'v', undefined, 'wrong-pos', 'verb not noun');
fix('apprezzamento', 'appreciation', 'n', null, 'to-prefix-on-non-verb', 'noun');
fix('apposta', 'on purpose', 'adv', null, 'wrong-pos', 'adverb');
fix('apparve', 'appeared', 'v', 'apparire', 'verb-base-form', '"to appeared" wrong tense');
fix('arbitri', 'referees', 'n', null, 'to-prefix-on-non-verb', 'noun');
fix('aprile', 'April', 'n', null, 'to-prefix-on-non-verb', 'month not verb');
fix('arrangiarsi', 'to make do, to manage', 'v', undefined, 'wrong-meaning', '"something; make do" garbled');
fix('annoio', 'I get bored', 'v', 'annoiarsi', 'wrong-pos', 'verb');
fix('arrabbiare', 'to get angry', 'v', undefined, 'wrong-meaning', '"to have rabies" - should be get angry');
fix('appoggio', 'support', 'n', null, 'to-prefix-on-non-verb', 'noun');

// Massive context bleed fixes: "doubt; arrive" family
for (const prefix of ['arriva', 'arrivando', 'arrivano', 'arrivare', 'arrivasse', 'arrivassero',
  'arrivassi', 'arrivata', 'arrivati', 'arrivato', 'arrivava', 'arrivavano', 'arrivavo',
  'arriverà', 'arriveranno', 'arriveremo', 'arriverebbe', 'arriverei', 'arriveresti',
  'arriverò', 'arrivi', 'arriviamo', 'arrivo']) {
  const entry = entryMap[prefix];
  if (entry && entry.en.includes('doubt')) {
    const cleanEn = entry.en.replace(/^doubt;\s*/, '').trim();
    const isInf = prefix.endsWith('are');
    fix(prefix, isInf ? 'to arrive' : (cleanEn || 'arrive'), isInf ? 'v' : 'v',
      isInf ? undefined : 'arrivare', 'garbage-semicolon', '"doubt;" is context bleed');
  }
}

// "arrendiamo" family
fix('arrendiamo', 'we surrender', 'v', 'arrendersi', 'wrong-meaning', '"although; we surrender" garbled');
fix('arreso', 'surrendered', 'adj', 'arrendersi', 'wrong-meaning', '"despite; surrendered" garbled');

// "entrare" missing "to "
fix('entrare', 'to enter', 'v', undefined, 'missing-to-prefix', 'verb needs "to "');
fix('fissare', 'to fix, to schedule', 'v', undefined, 'wrong-meaning', '"schedule; secure" garbled');
fix('raggiungere', 'to reach', 'v', undefined, 'missing-to-prefix', 'verb needs "to "');
fix('scendere', 'to descend, to go down', 'v', undefined, 'wrong-meaning', '"station; descend" garbled');
fix('tornare', 'to return', 'v', undefined, 'wrong-meaning', '"promise; return" garbled');

// ============================================================
// AUTOMATED CHECKS (process all entries)
// ============================================================
const allFixes = [];
const issueCounts = {};

function countIssue(type) {
  issueCounts[type] = (issueCounts[type] || 0) + 1;
}

// Known garbage semicolon first-parts (from analysis)
const GARBAGE_FIRST_PARTS = new Set([
  "he's", "she's", "it's", "i'm", "we're", "they're", "you're",
  "he", "she", "we", "they", "i", "you",
  "doubt", "himself", "please", "although", "time", "nice", "promise",
  "closing", "truth", "once", "whatever", "booked", "genre", "really",
  "boarding", "girl", "since", "company", "yet", "far", "despite",
  "dear", "all", "good", "everyone", "child", "lot", "tall", "out",
  "didn't", "she'd", "he'd", "stairs", "fireplace", "house", "anyone",
  "hadn't", "latecomer", "mayor", "conclusion", "tomorrow", "six", "late",
  "enthusiastic", "health", "table", "wine", "something", "students",
  "deeper", "next", "watchmaker", "thank", "animals",
  // Additional ones discovered
  "longer", "slowly", "tonight", "beautiful", "first", "second",
  "small", "large", "big", "old", "new", "young", "bad", "long",
  "early", "already", "yesterday", "today", "maybe", "perhaps",
  "brother", "sister", "mother", "father", "son", "daughter",
  "husband", "wife", "friend", "teacher", "doctor", "lawyer",
  "police", "money", "price", "cost", "work", "school", "home",
  "morning", "evening", "night", "afternoon", "summer", "winter",
  "spring", "autumn", "sunday", "monday", "tuesday", "wednesday",
  "thursday", "friday", "saturday", "january", "february", "march",
  "april", "may", "june", "july", "august", "september", "october",
  "november", "december",
]);

// Known Italian noun suffixes
const IT_NOUN_SUFFIXES = ['zione', 'sione', 'mento', 'ezza', 'anza', 'enza',
  'tura', 'eria', 'aggio', 'ismo', 'ista', 'tore', 'trice', 'iere', 'iera'];

// Known Italian adj suffixes (that aren't verb endings)
const IT_ADJ_SUFFIXES = ['oso', 'osa', 'osi', 'ose', 'ale', 'ali', 'ile', 'ili',
  'bile', 'bili', 'nte', 'nti', 'ivo', 'iva', 'ivi', 'ive'];

// English words that are definitely nouns (can't be verb infinitives)
const EN_NOUNS = new Set([
  'academy', 'accent', 'access', 'accommodation', 'addition', 'administration',
  'advent', 'adventure', 'agency', 'agility', 'agreement', 'ambulance', 'ambition',
  'amount', 'analysis', 'angel', 'anniversary', 'announcement', 'apartment', 'appetite',
  'appreciation', 'approach', 'april', 'architecture', 'area', 'arrival', 'aspect',
  'atmosphere', 'attention', 'audience', 'august', 'authority', 'autonomy', 'autumn',
  'avenue', 'bag', 'balance', 'balcony', 'ball', 'band', 'bank', 'bar', 'barrier',
  'base', 'basement', 'basin', 'basket', 'battery', 'beach', 'beauty', 'bed', 'bell',
  'bench', 'berry', 'bicycle', 'bill', 'biology', 'birthday', 'block', 'blood',
  'board', 'boat', 'body', 'bone', 'book', 'bookshop', 'border', 'boss', 'bottle',
  'box', 'bracelet', 'brain', 'bread', 'bridge', 'briefcase', 'budget', 'building',
  'bull', 'bus', 'butter', 'button', 'cabin', 'cable', 'café', 'cake', 'calendar',
  'camera', 'camp', 'campaign', 'canal', 'candidate', 'capacity', 'capital', 'captain',
  'card', 'career', 'carpet', 'carriage', 'case', 'cash', 'castle', 'category',
  'cathedral', 'cause', 'cave', 'ceiling', 'celebration', 'cemetery', 'center', 'centre',
  'century', 'ceremony', 'certainty', 'certificate', 'chain', 'chair', 'champion',
  'championship', 'channel', 'chapter', 'character', 'charity', 'cheese', 'cherry',
  'chest', 'chicken', 'childhood', 'chocolate', 'choice', 'church', 'cigarette',
  'cinema', 'circle', 'citizen', 'city', 'civilization', 'class', 'climate', 'clock',
  'cloud', 'club', 'clue', 'coach', 'coast', 'coat', 'code', 'coffee', 'coin',
  'collar', 'collection', 'college', 'colony', 'column', 'comfort', 'command',
  'comment', 'commission', 'commitment', 'committee', 'communication', 'community',
  'companion', 'company', 'comparison', 'competition', 'complaint', 'complex',
  'composition', 'computer', 'concentration', 'concept', 'concern', 'conclusion',
  'condition', 'conference', 'confidence', 'conflict', 'confusion', 'connection',
  'conscience', 'consciousness', 'consequence', 'conservation', 'consideration',
  'constitution', 'construction', 'consultation', 'consumer', 'contact', 'content',
  'context', 'continent', 'contract', 'contribution', 'control', 'convention',
  'conversation', 'cooking', 'copper', 'corner', 'corporation', 'correspondence',
  'corridor', 'cost', 'cotton', 'council', 'country', 'countryside', 'county',
  'couple', 'courage', 'course', 'court', 'cousin', 'cream', 'creature', 'crew',
  'crime', 'crisis', 'criticism', 'crop', 'crowd', 'crystal', 'culture', 'cup',
  'curiosity', 'curriculum', 'curtain', 'customer', 'cycle', 'damage', 'dance',
  'danger', 'darkness', 'data', 'date', 'daughter', 'dawn', 'deal', 'death',
  'debate', 'debt', 'decade', 'decision', 'declaration', 'decoration', 'defense',
  'degree', 'delay', 'delivery', 'demand', 'democracy', 'department', 'departure',
  'deposit', 'depression', 'description', 'desert', 'design', 'designer', 'desire',
  'desk', 'dessert', 'destination', 'destiny', 'detail', 'determination', 'development',
  'device', 'dialect', 'dialogue', 'diamond', 'diary', 'dictionary', 'diet',
  'difference', 'difficulty', 'dignity', 'dimension', 'dinner', 'diploma', 'direction',
  'director', 'dirt', 'disappointment', 'discipline', 'discount', 'discovery',
  'discussion', 'disease', 'dish', 'disk', 'display', 'dispute', 'distance',
  'distinction', 'distribution', 'district', 'diversity', 'division', 'doctor',
  'document', 'dog', 'dollar', 'door', 'double', 'doubt', 'dragon', 'drama',
  'drawing', 'dream', 'dress', 'drink', 'driver', 'drop', 'drug', 'drum', 'dust',
  'duty', 'eagle', 'ear', 'earth', 'ease', 'economy', 'edge', 'edition', 'editor',
  'education', 'effect', 'efficiency', 'effort', 'egg', 'election', 'electricity',
  'element', 'elevator', 'email', 'embarrassment', 'embassy', 'emergency', 'emotion',
  'emperor', 'emphasis', 'empire', 'employee', 'employment', 'encounter',
  'encouragement', 'enemy', 'energy', 'engine', 'engineer', 'enjoyment', 'enterprise',
  'entertainment', 'enthusiasm', 'entrance', 'entrepreneur', 'entry', 'envelope',
  'environment', 'episode', 'equality', 'equipment', 'equivalent', 'era', 'error',
  'escape', 'essay', 'estate', 'estimate', 'evaluation', 'evening', 'event',
  'evidence', 'evil', 'evolution', 'exam', 'examination', 'example', 'exception',
  'exchange', 'excitement', 'excuse', 'exercise', 'exhibition', 'existence', 'exit',
  'expansion', 'expectation', 'expedition', 'expenditure', 'expense', 'experience',
  'experiment', 'expert', 'explanation', 'exploration', 'explosion', 'export',
  'expression', 'extension', 'extent', 'eye', 'fabric', 'facility', 'fact', 'factory',
  'faculty', 'failure', 'faith', 'fame', 'family', 'fan', 'fantasy', 'farm', 'farmer',
  'fashion', 'fate', 'father', 'fault', 'fear', 'feature', 'federation', 'fee',
  'feeling', 'fellow', 'festival', 'fever', 'fiction', 'field', 'fight', 'figure',
  'film', 'finance', 'finger', 'fire', 'fish', 'flag', 'flame', 'flat', 'flesh',
  'flight', 'flood', 'floor', 'flower', 'fly', 'focus', 'folk', 'food', 'foot',
  'football', 'force', 'forest', 'form', 'formula', 'fortune', 'foundation', 'founder',
  'fountain', 'frame', 'framework', 'freedom', 'friendship', 'front', 'fruit', 'fuel',
  'function', 'fund', 'funeral', 'furniture', 'future', 'gallery', 'game', 'gap',
  'garage', 'garden', 'gas', 'gate', 'generation', 'genius', 'gentleman', 'geography',
  'gesture', 'gift', 'glass', 'glory', 'goal', 'gold', 'golf', 'government', 'grade',
  'grain', 'grandfather', 'grandmother', 'grass', 'gravity', 'group', 'growth',
  'guarantee', 'guard', 'guess', 'guest', 'guide', 'guilt', 'gun', 'habit', 'hair',
  'half', 'hall', 'hand', 'happiness', 'harbour', 'hat', 'head', 'headquarters',
  'health', 'heart', 'heat', 'heaven', 'height', 'heir', 'helmet', 'help', 'heritage',
  'hero', 'highway', 'hill', 'historian', 'history', 'hobby', 'hole', 'holiday',
  'home', 'homework', 'honor', 'honour', 'hope', 'horizon', 'horror', 'horse',
  'hospital', 'host', 'hostage', 'hotel', 'hour', 'household', 'housing', 'humanity',
  'humour', 'hunger', 'hunting', 'husband', 'ice', 'idea', 'identity', 'ignorance',
  'illness', 'illusion', 'image', 'imagination', 'impact', 'implementation',
  'implication', 'importance', 'impression', 'improvement', 'incident', 'income',
  'increase', 'independence', 'index', 'indication', 'individual', 'industry',
  'infection', 'inflation', 'influence', 'information', 'infrastructure', 'ingredient',
  'inhabitant', 'inhabitants', 'initiative', 'injury', 'innovation', 'input', 'inquiry',
  'insect', 'insight', 'inspection', 'inspiration', 'installation', 'instance',
  'institution', 'instruction', 'instrument', 'insurance', 'integrity', 'intelligence',
  'intention', 'interaction', 'interest', 'interior', 'internet', 'interpretation',
  'intervention', 'interview', 'introduction', 'invasion', 'invention', 'investigation',
  'investigator', 'investment', 'investor', 'invitation', 'iron', 'island', 'isolation',
  'issue', 'jacket', 'jam', 'january', 'jar', 'jazz', 'jealousy', 'jet', 'jewel',
  'jewelry', 'job', 'joke', 'journal', 'journalist', 'journey', 'joy', 'judge',
  'judgment', 'juice', 'jungle', 'jury', 'justice', 'key', 'kid', 'kidney', 'king',
  'kingdom', 'kitchen', 'knee', 'knife', 'knight', 'knowledge', 'lab', 'laboratory',
  'labour', 'lack', 'lady', 'lake', 'lamp', 'land', 'landscape', 'lane', 'language',
  'lap', 'launch', 'law', 'lawn', 'lawyer', 'layer', 'leader', 'leadership', 'league',
  'leather', 'lecture', 'leg', 'legend', 'legislation', 'leisure', 'lemon', 'length',
  'lesson', 'letter', 'level', 'liberty', 'library', 'license', 'lid', 'lieutenant',
  'life', 'lifestyle', 'lifetime', 'light', 'likelihood', 'limit', 'line', 'link',
  'lion', 'lip', 'list', 'literature', 'liver', 'loan', 'lobby', 'location', 'lock',
  'logic', 'loss', 'love', 'luck', 'luggage', 'lunch', 'lung', 'luxury', 'machine',
  'magazine', 'magic', 'mail', 'maintenance', 'majority', 'maker', 'man', 'management',
  'manager', 'manner', 'mansion', 'manufacturer', 'map', 'marble', 'margin', 'mark',
  'market', 'marriage', 'mask', 'mass', 'master', 'match', 'material', 'matter',
  'meal', 'meaning', 'measure', 'meat', 'mechanism', 'media', 'medicine', 'medium',
  'meeting', 'melody', 'member', 'membership', 'memory', 'menu', 'merchant', 'mercy',
  'message', 'metal', 'method', 'middle', 'midnight', 'mile', 'milk', 'mind', 'mine',
  'mineral', 'minister', 'ministry', 'minority', 'miracle', 'mirror', 'mission',
  'mistake', 'mixture', 'mobile', 'model', 'moment', 'monastery', 'money', 'monitor',
  'monk', 'monster', 'month', 'monument', 'mood', 'moon', 'morning', 'mosque',
  'mother', 'motion', 'motivation', 'motor', 'mountain', 'mouse', 'mouth', 'movement',
  'movie', 'mud', 'murder', 'muscle', 'museum', 'music', 'musician', 'mystery',
  'nail', 'name', 'narrative', 'nation', 'nationality', 'nature', 'navy', 'necessity',
  'neck', 'needle', 'negotiation', 'neighbor', 'neighborhood', 'nerve', 'network',
  'news', 'newspaper', 'nightmare', 'noise', 'nomination', 'noon', 'norm', 'nose',
  'note', 'notion', 'novel', 'number', 'nurse', 'nut', 'nutrition', 'oak', 'object',
  'objective', 'obligation', 'observation', 'observer', 'obstacle', 'occasion',
  'occupation', 'ocean', 'october', 'offense', 'office', 'officer', 'oil', 'opening',
  'opera', 'operation', 'operator', 'opinion', 'opponent', 'opportunity', 'opposition',
  'option', 'orange', 'orchestra', 'order', 'organ', 'organization', 'origin',
  'outcome', 'output', 'oven', 'owner', 'ownership', 'package', 'page', 'pain',
  'painting', 'pair', 'palace', 'panel', 'panic', 'paper', 'paragraph', 'parent',
  'park', 'parking', 'parliament', 'part', 'participant', 'participation', 'partner',
  'partnership', 'party', 'passage', 'passenger', 'passion', 'passport', 'path',
  'patience', 'patient', 'pattern', 'pause', 'payment', 'peace', 'peak', 'pen',
  'penalty', 'pension', 'people', 'pepper', 'percentage', 'perception', 'performance',
  'period', 'permission', 'person', 'personality', 'perspective', 'phase', 'phenomenon',
  'philosophy', 'phone', 'photo', 'photograph', 'photographer', 'photography', 'phrase',
  'physics', 'piano', 'picture', 'piece', 'pig', 'pile', 'pilot', 'pin', 'pipe',
  'pitch', 'pizza', 'plain', 'plan', 'plane', 'planet', 'planning', 'plant', 'plate',
  'platform', 'player', 'pleasure', 'plenty', 'plot', 'pocket', 'poem', 'poet',
  'poetry', 'point', 'poison', 'pole', 'policeman', 'policy', 'politician', 'politics',
  'pollution', 'pool', 'pope', 'population', 'port', 'portrait', 'position',
  'possession', 'possibility', 'post', 'pot', 'potato', 'potential', 'poverty',
  'powder', 'power', 'prayer', 'precedent', 'preference', 'pregnancy', 'prejudice',
  'preparation', 'presence', 'presentation', 'preservation', 'presidency', 'president',
  'pressure', 'prevention', 'pride', 'priest', 'prince', 'princess', 'principal',
  'principle', 'priority', 'prison', 'prisoner', 'privacy', 'prize', 'problem',
  'procedure', 'process', 'producer', 'product', 'production', 'profession',
  'professional', 'professor', 'profile', 'profit', 'programme', 'progress', 'project',
  'promotion', 'proof', 'propaganda', 'property', 'proportion', 'proposal',
  'prosecution', 'prospect', 'protection', 'protest', 'protocol', 'province',
  'provision', 'psychology', 'pub', 'publication', 'publicity', 'publisher',
  'punishment', 'pupil', 'purchase', 'purpose', 'pursuit', 'qualification', 'quality',
  'quantity', 'quarter', 'queen', 'question', 'queue', 'race', 'radiation', 'radio',
  'rage', 'rail', 'railway', 'rain', 'range', 'rank', 'ratio', 'reaction', 'reader',
  'reading', 'reality', 'reason', 'rebel', 'receipt', 'reception', 'recipe',
  'recognition', 'recommendation', 'reconstruction', 'recording', 'recovery',
  'recruit', 'reduction', 'referee', 'reference', 'reflection', 'reform', 'refugee',
  'refusal', 'regime', 'region', 'register', 'registration', 'regulation',
  'rehabilitation', 'reign', 'rejection', 'relation', 'relationship', 'relief',
  'religion', 'reluctance', 'remainder', 'remedy', 'rent', 'repair', 'repetition',
  'replacement', 'reply', 'report', 'reporter', 'representation', 'representative',
  'republic', 'reputation', 'request', 'requirement', 'research', 'researcher',
  'reservation', 'reserve', 'residence', 'resident', 'resignation', 'resistance',
  'resolution', 'resource', 'respect', 'response', 'responsibility', 'rest',
  'restaurant', 'restoration', 'restriction', 'result', 'retirement', 'revelation',
  'revenue', 'revolution', 'reward', 'rhythm', 'rice', 'ring', 'riot', 'risk',
  'river', 'road', 'rock', 'role', 'roof', 'room', 'root', 'rope', 'rose', 'route',
  'routine', 'row', 'rule', 'runner', 'rush', 'sacrifice', 'safety', 'saint', 'sake',
  'salary', 'sale', 'salt', 'sample', 'sand', 'satellite', 'satisfaction', 'sauce',
  'scale', 'scandal', 'scene', 'schedule', 'scheme', 'scholar', 'scholarship',
  'school', 'science', 'scientist', 'scope', 'score', 'screen', 'script', 'sculpture',
  'sea', 'seal', 'season', 'seat', 'secret', 'secretary', 'section', 'sector',
  'security', 'segment', 'selection', 'semester', 'senator', 'sense', 'sentence',
  'separation', 'sequence', 'series', 'servant', 'service', 'session', 'settlement',
  'shadow', 'shame', 'shape', 'sheep', 'sheet', 'shelf', 'shell', 'shelter', 'shift',
  'ship', 'shirt', 'shock', 'shoe', 'shop', 'shore', 'shortage', 'shot', 'shoulder',
  'shower', 'side', 'sight', 'sign', 'signal', 'significance', 'silence', 'silk',
  'silver', 'similarity', 'simplicity', 'singer', 'sir', 'sister', 'site', 'situation',
  'size', 'skill', 'skin', 'sky', 'slave', 'slice', 'slope', 'snow', 'soap',
  'society', 'sock', 'soil', 'soldier', 'solution', 'son', 'song', 'soul', 'sound',
  'soup', 'source', 'south', 'space', 'speaker', 'specialist', 'species', 'spectacle',
  'spectrum', 'speech', 'speed', 'spell', 'spirit', 'spot', 'spy', 'square',
  'stability', 'stadium', 'staff', 'stage', 'staircase', 'stairs', 'stake', 'standard',
  'star', 'state', 'statement', 'station', 'statistics', 'statue', 'status', 'steel',
  'stem', 'step', 'stock', 'stomach', 'stone', 'store', 'storm', 'story', 'stranger',
  'strategy', 'stream', 'street', 'strength', 'strike', 'string', 'strip', 'stroke',
  'structure', 'struggle', 'student', 'studio', 'stuff', 'style', 'subject',
  'substance', 'success', 'sugar', 'suggestion', 'suit', 'summer', 'summit', 'sun',
  'supermarket', 'supper', 'supplement', 'supply', 'supporter', 'surface', 'surgeon',
  'surgery', 'surplus', 'surprise', 'surrender', 'survey', 'survival', 'suspect',
  'suspension', 'swan', 'sweat', 'swimming', 'swing', 'switch', 'sword', 'symbol',
  'sympathy', 'syndrome', 'system', 'talent', 'tale', 'tank', 'tape', 'target',
  'task', 'taste', 'tax', 'taxi', 'tea', 'teacher', 'teaching', 'team', 'tear',
  'technique', 'technology', 'teenager', 'telephone', 'television', 'temperature',
  'temple', 'tendency', 'tennis', 'tension', 'tent', 'term', 'territory', 'terror',
  'terrorism', 'terrorist', 'text', 'thanks', 'theatre', 'theme', 'theory', 'therapy',
  'thing', 'thought', 'threat', 'threshold', 'throat', 'throne', 'ticket', 'tide',
  'tiger', 'timber', 'tip', 'tissue', 'title', 'tobacco', 'toilet', 'tone', 'tongue',
  'tool', 'tooth', 'topic', 'tourism', 'tourist', 'tournament', 'tower', 'town', 'toy',
  'track', 'tradition', 'traffic', 'tragedy', 'trail', 'training', 'trait',
  'transition', 'translation', 'transmission', 'transport', 'transportation', 'trap',
  'travel', 'traveller', 'treasure', 'treatment', 'treaty', 'tree', 'trend', 'trial',
  'tribe', 'trick', 'trip', 'triumph', 'trouble', 'truck', 'trunk', 'truth', 'tube',
  'tunnel', 'twin', 'type', 'umbrella', 'uncle', 'understanding', 'unemployment',
  'uniform', 'union', 'unit', 'unity', 'universe', 'university', 'valley', 'value',
  'van', 'variety', 'vegetable', 'vehicle', 'venture', 'venue', 'version', 'victim',
  'victory', 'video', 'village', 'violation', 'violence', 'virtue', 'virus', 'vision',
  'visitor', 'vocabulary', 'voice', 'volume', 'volunteer', 'voyage', 'wage', 'wall',
  'war', 'ward', 'warning', 'warrior', 'waste', 'water', 'wave', 'wealth', 'weapon',
  'weather', 'web', 'website', 'wedding', 'week', 'weekend', 'weight', 'welfare',
  'well', 'west', 'wheel', 'whistle', 'width', 'wife', 'wind', 'window', 'wine',
  'wing', 'wings', 'winner', 'winter', 'wire', 'wisdom', 'wish', 'witch', 'witness',
  'woman', 'wonder', 'wood', 'wool', 'word', 'worker', 'workshop', 'world', 'worry',
  'wound', 'writer', 'writing', 'yard', 'year', 'youth', 'zone',
  // Italian-specific frequent mistranslations as nouns
  'act of announcing', 'act of', 'reflexive of', 'compound of',
]);

// English adjective patterns
function looksLikeEnglishAdj(word) {
  return /(?:ed|ful|ous|ive|ible|able|ial|ant|ent|ical|ish|less|ary|ory|ic)$/.test(word) &&
    !['need', 'feed', 'seed', 'lead', 'read', 'proceed', 'exceed', 'succeed', 'bleed',
      'shed', 'bed', 'red', 'said', 'bid', 'rid', 'hid', 'did', 'end', 'tend', 'lend',
      'bend', 'send', 'mend', 'fend', 'spend', 'blend', 'amend', 'contend', 'defend',
      'offend', 'pretend', 'extend', 'intend', 'attend', 'suspend', 'transcend',
      'comprehend', 'recommend', 'correspond', 'panic', 'picnic', 'magic', 'music',
      'public', 'topic', 'basic', 'classic', 'plastic', 'fabric', 'garlic'].includes(word);
}

// English past tense / gerund that shouldn't follow "to "
function isBadVerbForm(word) {
  // Past tense irregular
  const irregular = ['went', 'feeds', 'eats', 'makes', 'gets', 'reads', 'stays',
    'comes', 'goes', 'takes', 'gives', 'puts', 'runs', 'says', 'sees', 'sits',
    'lets', 'sets', 'does', 'has', 'was', 'were', 'had', 'did', 'woken', 'stood',
    'slept', 'spoke', 'wrote', 'drove', 'knew', 'grew', 'drew', 'fell', 'felt',
    'found', 'gave', 'got', 'held', 'kept', 'left', 'lost', 'made', 'meant',
    'met', 'paid', 'ran', 'rang', 'rose', 'sat', 'saw', 'sent', 'set', 'shook',
    'shot', 'shut', 'sold', 'spent', 'struck', 'swam', 'swore', 'swept', 'swung',
    'taught', 'tore', 'threw', 'told', 'took', 'understood', 'woke', 'won', 'wore',
    'laughed', 'wanted', 'started', 'lived', 'moved', 'talked', 'walked', 'worked',
    'played', 'asked', 'called', 'tried', 'looked', 'needed', 'turned', 'learned',
    'stopped', 'changed', 'watched', 'happened', 'opened', 'reached', 'listened',
    'loved'];
  if (irregular.includes(word)) return true;
  // -ing form
  if (/ing$/.test(word) && word.length > 5) return true;
  // 3rd person -s
  if (/[^s]s$/.test(word) && word.length > 3 &&
      !['across', 'bus', 'us', 'this', 'thus', 'plus', 'campus', 'bonus', 'status',
        'virus', 'focus', 'circus', 'venus', 'census', 'versus', 'minus', 'radius',
        'genius', 'thesis'].includes(word)) {
    // Could be 3rd person
    return false; // too ambiguous, skip
  }
  return false;
}

// Function word POS fixes
const FUNC_WORD_POS = {
  'anche': 'adv', 'ancora': 'adv', 'allora': 'adv', 'almeno': 'adv', 'adesso': 'adv',
  'anzi': 'adv', 'appena': 'adv', 'apposta': 'adv', 'bene': 'adv', 'benissimo': 'adv',
  'certo': 'adv', 'circa': 'adv', 'come': 'adv', 'comunque': 'adv', 'davanti': 'adv',
  'davvero': 'adv', 'dentro': 'adv', 'dietro': 'adv', 'dopo': 'adv', 'dove': 'adv',
  'ecco': 'adv', 'forse': 'adv', 'fuori': 'adv', 'già': 'adv', 'giù': 'adv',
  'inoltre': 'adv', 'insieme': 'adv', 'invece': 'adv', 'lì': 'adv', 'là': 'adv',
  'magari': 'adv', 'mai': 'adv', 'male': 'adv', 'meno': 'adv', 'mica': 'adv',
  'molto': 'adv', 'nemmeno': 'adv', 'neanche': 'adv', 'neppure': 'adv', 'non': 'adv',
  'oggi': 'adv', 'ora': 'adv', 'ormai': 'adv', 'oltre': 'adv', 'piuttosto': 'adv',
  'più': 'adv', 'poco': 'adv', 'poi': 'adv', 'praticamente': 'adv', 'presto': 'adv',
  'prima': 'adv', 'purtroppo': 'adv', 'quasi': 'adv', 'qui': 'adv', 'qua': 'adv',
  'sempre': 'adv', 'sicuramente': 'adv', 'solo': 'adv', 'sopra': 'adv',
  'soprattutto': 'adv', 'sotto': 'adv', 'spesso': 'adv', 'subito': 'adv',
  'tanto': 'adv', 'tardi': 'adv', 'troppo': 'adv', 'veramente': 'adv',
  'volentieri': 'adv', 'nulla': 'pron', 'niente': 'pron', 'qualcosa': 'pron',
  'qualcuno': 'pron',
  'che': 'conj', 'e': 'conj', 'ed': 'conj', 'ma': 'conj', 'o': 'conj',
  'oppure': 'conj', 'perché': 'conj', 'però': 'conj', 'quando': 'conj',
  'se': 'conj', 'né': 'conj', 'dunque': 'conj', 'quindi': 'conj', 'eppure': 'conj',
  'mentre': 'conj', 'sebbene': 'conj', 'siccome': 'conj',
  'con': 'prep', 'da': 'prep', 'di': 'prep', 'fra': 'prep', 'in': 'prep',
  'per': 'prep', 'tra': 'prep', 'senza': 'prep', 'su': 'prep', 'verso': 'prep',
  'il': 'det', 'lo': 'det', 'la': 'det', 'le': 'det', 'i': 'det', 'gli': 'det',
  'un': 'det', 'uno': 'det', 'una': 'det',
  'io': 'pron', 'tu': 'pron', 'lui': 'pron', 'lei': 'pron', 'noi': 'pron',
  'voi': 'pron', 'loro': 'pron', 'ci': 'pron', 'mi': 'pron', 'ti': 'pron',
  'si': 'pron', 'vi': 'pron', 'ne': 'pron', 'li': 'pron',
  'questo': 'det', 'questa': 'det', 'questi': 'det', 'queste': 'det',
  'quello': 'det', 'quella': 'det', 'quelli': 'det', 'quelle': 'det',
  'ogni': 'det', 'tutto': 'det', 'tutta': 'det', 'tutti': 'det', 'tutte': 'det',
  'mio': 'det', 'mia': 'det', 'miei': 'det', 'mie': 'det',
  'tuo': 'det', 'tua': 'det', 'tuoi': 'det', 'tue': 'det',
  'suo': 'det', 'sua': 'det', 'suoi': 'det', 'sue': 'det',
  'nostro': 'det', 'nostra': 'det', 'nostri': 'det', 'nostre': 'det',
  'vostro': 'det', 'vostra': 'det', 'vostri': 'det', 'vostre': 'det',
};

// Process all entries
for (const entry of entries) {
  const { key, en, pos, lemma } = entry;

  // Skip if already has a manual fix
  if (FIXES[key]) {
    const f = FIXES[key];
    const fixEntry = {
      key, issueType: f.issueType, note: f.note,
      old: { en, pos }, new: { en: f.en, pos: f.pos },
    };
    if (lemma) fixEntry.old.lemma = lemma;
    if (f.lemma !== undefined) fixEntry.new.lemma = f.lemma;
    allFixes.push(fixEntry);
    countIssue(f.issueType);
    continue;
  }

  // === PATTERN 1: Grammar descriptions as translations ===
  if (en.includes('first/second/third-person') || en.includes('singular present subjunctive') ||
      en.includes('first-person') || en.includes('second-person') || en.includes('third-person')) {
    allFixes.push({
      key, issueType: 'garbage-meta-description',
      note: 'Grammar description used as translation',
      old: { en, pos }, new: { en: '?', pos: 'v', ...(lemma ? { lemma } : {}) }
    });
    countIssue('garbage-meta-description');
    continue;
  }

  // === PATTERN 2: "to reflexive/compound of X" meta-descriptions ===
  if (/^to (reflexive of|compound of)\b/.test(en)) {
    let fixEn = en;
    if (lemma) {
      const le = entryMap[lemma];
      if (le && !le.en.includes('reflexive of') && !le.en.includes('compound of')) {
        fixEn = le.en;
      }
    }
    if (fixEn === en) fixEn = '?';
    allFixes.push({
      key, issueType: 'garbage-meta-description',
      note: `"${en}" is meta-description`,
      old: { en, pos }, new: { en: fixEn, pos, ...(lemma ? { lemma } : {}) }
    });
    countIssue('garbage-meta-description');
    continue;
  }

  // === PATTERN 3: "to ?" garbage ===
  if (en === 'to ?' || en === 'to?') {
    allFixes.push({
      key, issueType: 'truncated-garbled', note: '"to ?" is garbage',
      old: { en, pos }, new: { en: '?', pos }
    });
    countIssue('truncated-garbled');
    continue;
  }

  // === PATTERN 4: Context bleed "X; Y" ===
  if (en.includes(';')) {
    const parts = en.split(';').map(p => p.trim());
    const first = parts[0].toLowerCase();
    if (GARBAGE_FIRST_PARTS.has(first) || /^to \w+s$/.test(first) || /^to \w+ed$/.test(first) || /^to \w+ing$/.test(first)) {
      const rest = parts.slice(1).join('; ').trim();
      if (rest) {
        allFixes.push({
          key, issueType: 'garbage-semicolon',
          note: `"${parts[0]}" is context bleed`,
          old: { en, pos }, new: { en: rest, pos }
        });
        countIssue('garbage-semicolon');
        continue;
      }
    }
  }

  // === PATTERN 5: "to " prefix on non-verbs ===
  if (en.startsWith('to ')) {
    const afterTo = en.slice(3).trim();
    const firstWord = afterTo.split(/[,;]/)[0].trim().toLowerCase();

    // "to " + noun
    if (EN_NOUNS.has(firstWord) && pos === 'v') {
      allFixes.push({
        key, issueType: 'to-prefix-on-non-verb',
        note: `"to ${firstWord}" - noun shouldn't have "to "`,
        old: { en, pos }, new: { en: afterTo, pos: 'n' }
      });
      countIssue('to-prefix-on-non-verb');
      continue;
    }

    // "to " + English adj
    if (looksLikeEnglishAdj(firstWord) && pos === 'v') {
      allFixes.push({
        key, issueType: 'to-prefix-on-non-verb',
        note: `"to ${firstWord}" - adjective shouldn't have "to "`,
        old: { en, pos }, new: { en: afterTo, pos: 'adj' }
      });
      countIssue('to-prefix-on-non-verb');
      continue;
    }

    // "to " + bad verb form (past tense, gerund, 3rd person)
    if (isBadVerbForm(firstWord) && pos === 'v') {
      allFixes.push({
        key, issueType: 'verb-base-form',
        note: `"to ${firstWord}" has wrong form after "to "`,
        old: { en, pos }, new: { en: afterTo, pos: 'adj' }
      });
      countIssue('verb-base-form');
      continue;
    }

    // Italian word has noun suffix but is tagged as verb with "to "
    if (pos === 'v' && IT_NOUN_SUFFIXES.some(s => key.endsWith(s)) && !infinitives.has(key)) {
      allFixes.push({
        key, issueType: 'to-prefix-on-non-verb',
        note: `"${key}" has noun suffix, not a verb`,
        old: { en, pos }, new: { en: afterTo, pos: 'n' }
      });
      countIssue('to-prefix-on-non-verb');
      continue;
    }

    // Italian word has adj suffix but is tagged as verb with "to "
    if (pos === 'v' && IT_ADJ_SUFFIXES.some(s => key.endsWith(s)) && !infinitives.has(key)) {
      allFixes.push({
        key, issueType: 'to-prefix-on-non-verb',
        note: `"${key}" has adjective suffix, not a verb`,
        old: { en, pos }, new: { en: afterTo, pos: 'adj' }
      });
      countIssue('to-prefix-on-non-verb');
      continue;
    }
  }

  // === PATTERN 6: Function word POS fixes ===
  if (FUNC_WORD_POS[key] && pos !== FUNC_WORD_POS[key]) {
    allFixes.push({
      key, issueType: 'wrong-pos',
      note: `"${key}" should be ${FUNC_WORD_POS[key]}, was ${pos}`,
      old: { en, pos }, new: { en, pos: FUNC_WORD_POS[key] }
    });
    countIssue('wrong-pos');
    continue;
  }

  // === PATTERN 7: Wrong lemma (word lemma'd to wrong root) ===
  if (lemma === 'affare' && !key.startsWith('affar')) {
    allFixes.push({
      key, issueType: 'wrong-lemma',
      note: `wrong lemma "affare" for "${key}"`,
      old: { en, pos, lemma }, new: { en, pos, lemma: null }
    });
    countIssue('wrong-lemma');
    continue;
  }
  if (lemma === 'abitare' && !key.startsWith('abit')) {
    allFixes.push({
      key, issueType: 'wrong-lemma',
      note: `wrong lemma "abitare" for "${key}"`,
      old: { en, pos, lemma }, new: { en, pos, lemma: null }
    });
    countIssue('wrong-lemma');
    continue;
  }
  if (lemma === 'accadere' && !key.startsWith('accad')) {
    allFixes.push({
      key, issueType: 'wrong-lemma',
      note: `wrong lemma "accadere" for "${key}"`,
      old: { en, pos, lemma }, new: { en, pos, lemma: null }
    });
    countIssue('wrong-lemma');
    continue;
  }
  if (lemma === 'appare' && !key.startsWith('appar')) {
    allFixes.push({
      key, issueType: 'wrong-lemma',
      note: `wrong lemma "appare" for "${key}"`,
      old: { en, pos, lemma }, new: { en, pos, lemma: null }
    });
    countIssue('wrong-lemma');
    continue;
  }
}

console.log(`\nTotal issues found: ${allFixes.length}`);
console.log('\nBreakdown by type:');
for (const [type, count] of Object.entries(issueCounts).sort((a,b) => b[1] - a[1])) {
  if (count > 0) console.log(`  ${type}: ${count}`);
}

// Write output
fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(allFixes, null, 2));
console.log(`\nWrote ${allFixes.length} fixes to ${OUTPUT_PATH}`);

// ============================================================
// APPLY FIXES TO DICTIONARY
// ============================================================

if (process.argv.includes('--apply')) {
  console.log('\n=== APPLYING FIXES ===\n');

  let dictSrc = fs.readFileSync(DICT_PATH, 'utf8');
  let applied = 0;
  let failed = 0;

  for (const fix of allFixes) {
    const { key } = fix;
    const newEn = fix.new.en;
    const newPos = fix.new.pos;
    const newLemma = fix.new.lemma;

    // Build regex to find this entry
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const entryRegex = new RegExp(
      `(['"]${escapedKey}['"]\\s*:\\s*\\{)([^}]+)(\\})`,
      'g'
    );

    const match = entryRegex.exec(dictSrc);
    if (!match) {
      // Try without the regex
      failed++;
      continue;
    }

    const oldBody = match[2];
    let newBody = oldBody;

    // Replace en value
    if (newEn !== undefined) {
      const escaped = newEn.replace(/'/g, "\\'");
      newBody = newBody.replace(/en:\s*'[^']*(?:\\'[^']*)*'/, `en: '${escaped}'`);
    }

    // Replace pos value
    if (newPos !== undefined) {
      newBody = newBody.replace(/pos:\s*'[^']*'/, `pos: '${newPos}'`);
    }

    // Handle lemma
    if (newLemma === null) {
      // Remove lemma
      newBody = newBody.replace(/,\s*lemma:\s*'[^']*'/, '');
    } else if (newLemma !== undefined) {
      // Add or replace lemma
      if (newBody.includes('lemma:')) {
        newBody = newBody.replace(/lemma:\s*'[^']*'/, `lemma: '${newLemma}'`);
      } else {
        // Add lemma before closing
        newBody = newBody.replace(/(\s*pos:\s*'[^']*')/, `$1, lemma: '${newLemma}'`);
      }
    }

    if (newBody !== oldBody) {
      dictSrc = dictSrc.replace(match[0], match[1] + newBody + match[3]);
      applied++;
    }

    // Reset regex
    entryRegex.lastIndex = 0;
  }

  fs.writeFileSync(DICT_PATH, dictSrc);
  console.log(`Applied: ${applied}, Failed: ${failed}`);
}
