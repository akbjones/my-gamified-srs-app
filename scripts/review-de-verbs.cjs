#!/usr/bin/env node
/**
 * review-de-verbs.cjs — COMPLETE German dictionary review
 *
 * Categories:
 *   1. "to " on non-verbs → strip, fix POS
 *   2. Verb form issues → lemmatize
 *   3. Missing "to " on infinitive verbs → add
 *   4. Context bleed semicolons → strip garbled first part
 *   5. Wrong meaning (German false friends, polysemous words)
 *   6. Garbled backslash entries → replace entirely
 *   7. Truncated translations → fix
 *   8. Wrong POS
 *   9. "to " + past tense/3rd person → fix verb form
 */

const fs = require('fs');
const path = require('path');

// ── Read and parse de.ts ─────────────────────────────────────
const src = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'data', 'dictionary', 'de.ts'),
  'utf8'
);

const dictStart = src.indexOf("const DICT: Record<string, DictEntry> = {");
const dictEnd = src.indexOf("};", dictStart) + 2;
const dictBlock = src.slice(dictStart, dictEnd);

const entryRe = /^\s*'([^']+)':\s*\{([^}]+)\}/gm;
const entries = {};
let m;
while ((m = entryRe.exec(dictBlock)) !== null) {
  const key = m[1];
  const body = m[2];
  const en = (body.match(/en:\s*'([^']*)'/) || body.match(/en:\s*"([^"]*)"/))?.[1] || '';
  const ipa = (body.match(/ipa:\s*'([^']*)'/) || body.match(/ipa:\s*"([^"]*)"/))?.[1] || '';
  const pos = (body.match(/pos:\s*'([^']*)'/) || body.match(/pos:\s*"([^"]*)"/))?.[1] || '';
  const lemmaMatch = body.match(/lemma:\s*'([^']*)'/) || body.match(/lemma:\s*"([^"]*)"/);
  const lemma = lemmaMatch ? lemmaMatch[1] : undefined;
  entries[key] = { en, ipa, pos, lemma };
}
const entryRe2 = /^\s*"([^"]+)":\s*\{([^}]+)\}/gm;
while ((m = entryRe2.exec(dictBlock)) !== null) {
  const key = m[1];
  const body = m[2];
  const en = (body.match(/en:\s*'([^']*)'/) || body.match(/en:\s*"([^"]*)"/))?.[1] || '';
  const ipa = (body.match(/ipa:\s*'([^']*)'/) || body.match(/ipa:\s*"([^"]*)"/))?.[1] || '';
  const pos = (body.match(/pos:\s*'([^']*)'/) || body.match(/pos:\s*"([^"]*)"/))?.[1] || '';
  const lemmaMatch = body.match(/lemma:\s*'([^']*)'/) || body.match(/lemma:\s*"([^"]*)"/);
  const lemma = lemmaMatch ? lemmaMatch[1] : undefined;
  entries[key] = { en, ipa, pos, lemma };
}

console.log(`Parsed ${Object.keys(entries).length} entries`);

// ══════════════════════════════════════════════════════════════
// COMPREHENSIVE KNOWN-GOOD TRANSLATIONS DATABASE
// Every entry here has been manually verified against German knowledge
// ══════════════════════════════════════════════════════════════

const FIXES = {};

// Helper to add a fix
function fix(key, en, pos, note, opts = {}) {
  FIXES[key] = { en, pos, note, ...opts };
}

// ── Category 6: Backslash-garbled entries (84 entries) ───────
// These had possessive/contraction apostrophes mangled
fix('ach', 'oh; alas', 'interj', 'garbled backslash → correct interjection');
fix('anzug', 'suit', 'n', 'garbled "men\\\\" → suit');
fix('arm', 'poor; arm', 'adj', 'garbled "you\\\\" → poor/arm');
fix('auszugehen', 'to go out', 'v', 'garbled "doesn\\\\" → to go out', { lemma: 'ausgehen' });
fix('berücksichtigen', 'to consider; to take into account', 'v', 'garbled "that\\\\" → to consider');
fix('berücksichtigt', 'considered; taken into account', 'v', 'garbled "that\\\\" → considered', { lemma: 'berücksichtigen' });
fix('beruhigt', 'calmed; reassured', 'adj', 'garbled "mother\\\\" → calmed');
fix('besitzt', 'to own; to possess', 'v', 'garbled "doesn\\\\" → to possess', { lemma: 'besitzen' });
fix('betrachten', 'to consider; to view', 'v', 'garbled "that\\\\" → to consider');
fix('bier', 'beer', 'n', 'garbled "that\\\\" → beer');
fix('bindfäden', 'strings (raining cats and dogs)', 'n', 'garbled "it\\\\" → strings');
fix('bitte', 'please; you are welcome', 'interj', 'garbled backslash in second part');
fix('blatt', 'leaf; sheet; page', 'n', 'garbled "doesn\\\\" → leaf/sheet/page');
fix('blätter', 'leaves; pages', 'n', 'garbled "doesn\\\\" → leaves/pages');
fix('bloß', 'just; merely', 'adv', 'garbled "don\\\\" → just/merely');
fix('bock', 'desire; buck', 'n', 'garbled "don\\\\" → desire/buck');
fix('deutschlands', 'of Germany', 'n', 'garbled → of Germany', { lemma: 'deutschland' });
fix('dran', 'on it; attached', 'adv', 'garbled "that\\\\" → on it');
fix('egal', 'indifferent; no matter', 'adj', 'garbled "don\\\\" → indifferent');
fix('ei', 'egg', 'n', 'garbled "that\\\\" → egg');
fix('eier', 'eggs', 'n', 'garbled "that\\\\" → eggs');
fix('eigenen', 'own', 'adj', 'garbled "he\\\\" → own');
fix('eingeladen', 'invited', 'v', 'garbled "didn\\\\" → invited', { lemma: 'einladen' });
fix('einwohnermeldeamt', 'residents registration office', 'n', 'garbled "residents\\\\" → correct');
fix('einzige', 'only; sole', 'adj', 'garbled "haven\\\\" → only/sole');
fix('froh', 'happy; glad', 'adj', 'garbled "child\\\\" → happy/glad');
fix('frohe', 'happy; merry', 'adj', 'garbled "child\\\\" → happy/merry', { lemma: 'froh' });
fix('früher', 'earlier; formerly', 'adv', 'garbled "don\\\\" → earlier/formerly');
fix('führerschein', 'driving license', 'n', 'garbled "driver\\\\" → driving license');
fix('gar', 'at all; even', 'adv', 'garbled "don\\\\" → at all');
fix('gefunden', 'found', 'v', 'garbled "didn\\\\" → found', { lemma: 'finden' });
fix('gelbe', 'yellow', 'adj', 'garbled "that\\\\" → yellow', { lemma: 'gelb' });
fix('geschehen', 'to happen; to occur', 'v', 'garbled "you\\\\" → to happen');
fix('gießen', 'to water; to pour', 'v', 'garbled "don\\\\" → to water/pour');
fix('gießt', 'to water; to pour', 'v', 'garbled "don\\\\" → waters/pours', { lemma: 'gießen' });
fix('glaubt', 'to believe', 'v', 'garbled "doesn\\\\" → to believe', { lemma: 'glauben' });
fix('goss', 'poured', 'v', 'garbled "don\\\\" → poured', { lemma: 'gießen' });
fix('großvaters', 'of grandfather', 'n', 'garbled "grandfather\\\\" → of grandfather', { lemma: 'großvater' });
fix('handwerkerrechnung', 'craftsman invoice', 'n', 'garbled "craftsman\\\\" → craftsman invoice');
fix('hinterher', 'afterwards; behind', 'adv', 'garbled "don\\\\" → afterwards');
fix('insgesamt', 'altogether; in total', 'adv', 'garbled "wasn\\\\" → altogether');
fix('kaffee', 'coffee', 'n', 'garbled "that\\\\" → coffee');
fix('kaffees', 'coffees', 'n', 'garbled "that\\\\" → coffees', { lemma: 'kaffee' });
fix('kinderzimmer', 'children\'s room', 'n', 'garbled "children\\\\" → children\'s room');
fix('kopf', 'head', 'n', 'garbled "doesn\\\\" → head');
fix('kuhhaut', 'cowhide (idiom: unbelievable)', 'n', 'garbled "it\\\\" → cowhide');
fix('längst', 'long since; long ago', 'adv', 'garbled "that\\\\" → long since');
fix('latein', 'Latin', 'n', 'garbled "i\\\\" → Latin');
fix('leid', 'sorry; suffering', 'n', 'garbled "i\\\\" → sorry/suffering');
fix('leuchten', 'to shine; to glow', 'v', 'garbled "daughter\\\\" → to shine');
fix('leuchtet', 'to shine; to glow', 'v', 'garbled "daughter\\\\" → shines', { lemma: 'leuchten' });
fix('leuchtete', 'shone; glowed', 'v', 'garbled "daughter\\\\" → shone', { lemma: 'leuchten' });
fix('muttertag', 'Mother\'s Day', 'n', 'garbled "mother\\\\" → Mother\'s Day');
fix('nachbarhauses', 'of the neighboring house', 'n', 'garbled "neighbor\\\\" → of neighboring house');
fix('nun', 'now; well', 'adv', 'garbled "that\\\\" → now/well');
fix('opas', 'grandpa\'s; grandpas', 'n', 'garbled "grandpa\\\\" → grandpa\'s', { lemma: 'opa' });
fix('passe', 'to fit; to suit', 'v', 'garbled "sister\\\\" → to fit', { lemma: 'passen' });
fix('peil', 'to gauge (ich peil das nicht)', 'v', 'garbled "don\\\\" → to gauge', { lemma: 'peilen' });
fix('penn', 'to sleep (colloquial)', 'v', 'garbled "i\\\\" → to sleep', { lemma: 'pennen' });
fix('platt', 'flat; stunned', 'adj', 'garbled "i\\\\" → flat/stunned');
fix('quatsch', 'nonsense; rubbish', 'n', 'garbled "don\\\\" → nonsense');
fix('rum', 'around (colloquial)', 'adv', 'garbled "don\\\\" → around');
fix('sängers', 'of the singer', 'n', 'garbled "singer\\\\" → of the singer', { lemma: 'sänger' });
fix('schmacht', 'longing; craving', 'n', 'garbled "let\\\\" → longing');
fix('schnall', 'to get; to understand (colloquial)', 'v', 'garbled "can\\\\" → to get', { lemma: 'schnallen' });
fix('schnapp', 'to snap; to grab', 'v', 'garbled "i\\\\" → to snap/grab', { lemma: 'schnappen' });
fix('schnee', 'snow', 'n', 'garbled "that\\\\" → snow');
fix('servus', 'hello; goodbye (South German)', 'interj', 'garbled "how\\\\" → hello/goodbye');
fix('silvester', 'New Year\'s Eve', 'n', 'garbled "new Year\\\\" → New Year\'s Eve');
fix('sitzen', 'to sit', 'v', 'garbled "we\\\\" → to sit');
fix('sitzt', 'to sit', 'v', 'garbled "we\\\\" → sits', { lemma: 'sitzen' });
fix('stammtisch', 'regulars\' table', 'n', 'garbled "regulars\\\\" → regulars\' table');
fix('streiten', 'to argue; to quarrel', 'v', 'garbled "that\\\\" → to argue');
fix('streitet', 'to argue; to quarrel', 'v', 'garbled "that\\\\" → argues', { lemma: 'streiten' });
fix('töpferscheibe', 'potter\'s wheel', 'n', 'garbled "potter\\\\" → potter\'s wheel');
fix('unmöglich', 'impossible', 'adj', 'garbled "you\\\\" → impossible');
fix('urteil', 'judgment; verdict', 'n', 'garbled "doesn\\\\" → judgment');
fix('verloren', 'lost', 'adj', 'garbled "didn\\\\" → lost');
fix('vernünftiges', 'something reasonable', 'adj', 'garbled "didn\\\\" → reasonable', { lemma: 'vernünftig' });
fix('weiß', 'white; to know', 'adj', 'garbled "doesn\\\\" → white/know');
fix('weißem', 'white', 'adj', 'garbled "doesn\\\\" → white', { lemma: 'weiß' });
fix('weißes', 'white', 'adj', 'garbled "doesn\\\\" → white', { lemma: 'weiß' });
fix('wundere', 'to wonder', 'v', 'garbled "i\\\\" → to wonder', { lemma: 'wundern' });
fix('hort', 'after-school care; hoard', 'n', 'garbled "ho" → after-school care');
fix('verfügt', 'to have; to possess', 'v', 'garbled "ha" → to have/possess', { lemma: 'verfügen' });

// ── Category 5: Wrong meanings / false friends ───────────────
fix('18', '18', 'num', 'number, not a verb');
fix('ab', 'from; off; away', 'prep', '"ab" is a preposition/particle');
fix('abends', 'in the evening', 'adv', 'adverb, not noun');
fix('abfallentsorgungsbetrieb', 'waste disposal company', 'n', 'noun, had "to " prefix');
fix('abfragen', 'to query; to test', 'v', 'verb, not noun; was "computer; query"');
fix('abgefahren', 'crazy; cool; departed', 'adj', 'adj/participle, was garbled');
fix('art', 'type; kind; manner', 'n', 'German Art = type/kind, not art');
fix('still', 'quiet; still', 'adj', 'German still = quiet, was tagged noun');
fix('rock', 'skirt', 'n', 'German Rock = skirt');
fix('note', 'grade; mark; note', 'n', 'German Note = grade/mark');
fix('lager', 'warehouse; camp; stock', 'n', 'German Lager = warehouse/camp');
fix('see', 'lake; sea', 'n', 'German See = lake/sea');
fix('neben', 'next to; beside', 'prep', 'preposition, was tagged adj');
fix('dank', 'thanks to', 'prep', 'preposition');
fix('muss', 'must (I/he/she must)', 'v', 'fixed translation', { lemma: 'müssen' });
fix('will', 'to want (I/he/she want(s))', 'v', 'verb form of wollen', { lemma: 'wollen' });

// ── Category 7: Truncated translations ───────────────────────
fix('aufarbeiten', 'to process; to work through', 'v', 'truncated "proces" → process');
fix('ausführlichen', 'detailed', 'adj', 'truncated "detaile" → detailed', { lemma: 'ausführlich' });
fix('beeindrucken', 'to impress', 'v', 'truncated "impres" → impress');
fix('beeindruckt', 'impressed', 'v', 'truncated "impres" → impressed', { lemma: 'beeindrucken' });
fix('besprechen', 'to discuss', 'v', 'truncated "discus" → discuss');
fix('besprochen', 'discussed', 'v', 'truncated "discus" → discussed', { lemma: 'besprechen' });
fix('detaillierten', 'detailed', 'adj', 'truncated "detaile" → detailed', { lemma: 'detailliert' });
fix('diskutieren', 'to discuss', 'v', 'truncated "discus" → discuss');
fix('diskutiert', 'discussed', 'v', 'truncated "discus" → discussed', { lemma: 'diskutieren' });
fix('erörtern', 'to discuss; to debate', 'v', 'truncated "discus" → discuss');
fix('berqueren', 'to cross', 'v', 'truncated "cros" → cross (likely überqueren)');
fix('begutachten', 'to assess; to evaluate', 'v', 'truncated "asses" → assess');
fix('fehlen', 'to miss; to be missing; to lack', 'v', 'truncated "mis" → miss/lack');
fix('vermissen', 'to miss (someone)', 'v', 'truncated "mis" → miss');
fix('verpasste', 'missed', 'v', 'truncated "mis" → missed', { lemma: 'verpassen' });
fix('schätze', 'to guess; to estimate', 'v', 'truncated "gues" → guess', { lemma: 'schätzen' });
fix('unruhigen', 'restless; uneasy', 'adj', 'truncated "restles" → restless', { lemma: 'unruhig' });

// ── Category 4: Context bleed semicolons ─────────────────────
// Pattern: "BLEED_WORD; REAL_MEANING" where first part is from sentence context
fix('abreist', 'to depart', 'v', 'context bleed "leave; depart" → depart', { lemma: 'abreisen' });
fix('andere', 'other; different', 'adj', 'context bleed "explain; other" → other');
fix('anschaffen', 'to acquire; to purchase', 'v', 'context bleed "space; acquire" → acquire');
fix('artikel', 'article', 'n', 'context bleed "order; article" → article');
fix('aufgegeben', 'given up; abandoned', 'v', 'context bleed "position; abandoned"', { lemma: 'aufgeben' });
fix('aufgehört', 'stopped', 'v', 'context bleed "rain; stopped"', { lemma: 'aufhören' });
fix('aufsuchen', 'to visit; to seek out', 'v', 'context bleed "place; visit"');
fix('ausbildung', 'education; training', 'n', 'context bleed "open; education" + wrong POS');
fix('ausgefallen', 'failed; unusual; canceled', 'adj', 'context bleed "result; failed"');
fix('bedeutung', 'meaning; significance', 'n', 'context bleed "explain; meaning"');
fix('befassen', 'to deal with; to concern oneself', 'v', 'context bleed "time; deal"');
fix('bewältigen', 'to cope with; to manage', 'v', 'context bleed "time; get over"');
fix('braten', 'to fry; to roast', 'v', 'context bleed "smelled; fry"');
fix('dazu', 'in addition; to that', 'adv', 'context bleed "drink; in addition"');
fix('durchgeführte', 'carried out; conducted', 'v', 'context bleed "study; carried out"', { lemma: 'durchführen' });
fix('einverstanden', 'agreed; in agreement', 'adj', 'context bleed "survey; agreed"');
fix('ergebnis', 'result; outcome', 'n', 'context bleed "study; result"');
fix('ergebnisse', 'results; outcomes', 'n', 'context bleed "study; result"', { lemma: 'ergebnis' });
fix('fangen', 'to catch', 'v', 'context bleed "start; catch"');
fix('fängt', 'to catch', 'v', 'context bleed "start; catch"', { lemma: 'fangen' });
fix('fing', 'caught', 'v', 'context bleed "start; catch"', { lemma: 'fangen' });
fix('flugzeug', 'airplane', 'n', 'context bleed "train; airplane"');
fix('freu', 'to be happy', 'v', 'context bleed "forward; be happy"', { lemma: 'freuen' });
fix('freue', 'to be happy', 'v', 'context bleed "forward; be happy"', { lemma: 'freuen' });
fix('freuen', 'to be happy; to look forward to', 'v', 'context bleed "forward; be happy"');
fix('freut', 'to be happy; to please', 'v', 'context bleed "forward; be happy"', { lemma: 'freuen' });
fix('gefreut', 'to be happy', 'v', 'context bleed "forward; be happy"', { lemma: 'freuen' });
fix('friedensplatz', 'peace square', 'n', 'context bleed "change; peace square"');
fix('gelaufen', 'run; walked', 'v', 'context bleed "walk; run"', { lemma: 'laufen' });
fix('geruch', 'smell; odor', 'n', 'context bleed "smell; odor"');
fix('gezahlt', 'paid', 'v', 'context bleed "report; pay"', { lemma: 'zahlen' });
fix('gleis', 'platform; track', 'n', 'context bleed "train; track"');
fix('hin', 'there; towards', 'adv', 'context bleed "sit; there"');
fix('hole', 'to fetch; to get', 'v', 'context bleed "pick; fetch"', { lemma: 'holen' });
fix('holen', 'to fetch; to get', 'v', 'context bleed "pick; fetch"');
fix('holt', 'to fetch; to get', 'v', 'context bleed "pick; fetch"', { lemma: 'holen' });
fix('keineswegs', 'by no means; not at all', 'adv', 'context bleed "result; not at all"');
fix('laufe', 'to run; to walk', 'v', 'context bleed "walk; run"', { lemma: 'laufen' });
fix('laufen', 'to run; to walk', 'v', 'context bleed "walk; run"');
fix('läuft', 'to run; to walk', 'v', 'context bleed "walk; run"', { lemma: 'laufen' });
fix('los', 'go; off; loose', 'adv', 'context bleed "leave; go"');
fix('losfahren', 'to depart; to set off', 'v', 'context bleed "leave; start"');
fix('losgefahren', 'departed; set off', 'v', 'context bleed "leave; start"', { lemma: 'losfahren' });
fix('passiert', 'to happen; happened', 'v', 'context bleed "call; happened"', { lemma: 'passieren' });
fix('punkt', 'point; dot; period', 'n', 'context bleed "start; point"');
fix('punkte', 'points', 'n', 'context bleed "start; point"', { lemma: 'punkt' });
fix('sache', 'thing; matter', 'n', 'context bleed "point; matter"');
fix('sachen', 'things; matters', 'n', 'context bleed "point; matter"', { lemma: 'sache' });
fix('sachverhalt', 'facts; circumstances', 'n', 'context bleed "explain; fact"');
fix('spazieren', 'to walk; to stroll', 'v', 'context bleed "walk; stroll"');
fix('spaziergang', 'walk; stroll', 'n', 'context bleed "walk; stroll"');
fix('umgezogen', 'moved (house)', 'v', 'context bleed "room; move"', { lemma: 'umziehen' });
fix('umziehen', 'to move (house); to change clothes', 'v', 'context bleed "room; move"');
fix('vermutung', 'supposition; guess', 'n', 'context bleed "study; supposition"');
fix('verspätung', 'delay; lateness', 'n', 'context bleed "train; lateness"');
fix('verspätungen', 'delays', 'n', 'context bleed "train; lateness"', { lemma: 'verspätung' });
fix('wasserhahn', 'tap; faucet', 'n', 'context bleed "repair; tap"');
fix('weit', 'far; wide', 'adj', 'context bleed "open; far"');
fix('weitem', 'far; wide', 'adj', 'context bleed "open; far"', { lemma: 'weit' });
fix('besagt', 'aforementioned; said', 'adj', 'context bleed "report; say" → aforementioned');
fix('feierabend', 'quitting time; end of work', 'n', 'context bleed "work; quitting time"');
fix('freien', 'free; open', 'adj', 'context bleed "place; free"', { lemma: 'frei' });
fix('gesunken', 'sunk; declined', 'v', 'context bleed "report; sun" garbled → sunk', { lemma: 'sinken' });
fix('nachzügler', 'latecomer; straggler', 'n', 'context bleed "time; straggler"');
fix('ort', 'place; location', 'n', 'context bleed "place; location" → clean');
fix('rechtzeitig', 'on time; punctual', 'adv', 'context bleed "time; punctual"');
fix('schließe', 'to close', 'v', 'context bleed "work; close"', { lemma: 'schließen' });
fix('stelle', 'position; place; job', 'n', 'context bleed "place; position"');
fix('tickets', 'tickets', 'n', 'context bleed "price; ticket"');
fix('umfrage', 'survey; opinion poll', 'n', 'context bleed "survey; opinion poll" → clean');
fix('zahlen', 'to pay', 'v', 'context bleed "report; pay"');
fix('zug', 'train; pull; move', 'n', 'context bleed "train; pull" + wrong POS');
fix('zur', 'to the (contraction: zu + der)', 'prep', 'context bleed "work; to" + wrong POS');
fix('zurückgekommen', 'returned; come back', 'v', 'context bleed "work; returned"', { lemma: 'zurückkommen' });

// More context bleed from deep scan
fix('ähnelt', 'to resemble', 'v', 'context bleed "resembles" 3rd person → infinitive', { lemma: 'ähneln' });
fix('allerhöchsten', 'highest; utmost', 'adj', 'context bleed "rents; most exalted" → highest', { lemma: 'hoch' });
fix('antiken', 'ancient; antique', 'adj', 'context bleed "repairs; ancient" → antique', { lemma: 'antik' });
fix('augenzeugen', 'eyewitnesses', 'n', 'context bleed "to eyewitness" → eyewitnesses');
fix('aussehen', 'to look; appearance', 'v', 'context bleed "resembles; look" → to look/appearance');
fix('aussieht', 'to look', 'v', 'context bleed "resembles; look"', { lemma: 'aussehen' });
fix('bank', 'bank; bench', 'n', 'context bleed "sits; bank" + wrong POS');
fix('bedenken', 'to consider; concerns', 'v', 'context bleed "concerns; consider"');
fix('bekannt', 'known; famous', 'adj', 'context bleed "results; known"');
fix('bekommen', 'to receive; to get', 'v', 'context bleed "tickets; receive"');
fix('bekommt', 'to receive; to get', 'v', 'context bleed "tickets; receive"', { lemma: 'bekommen' });
fix('beteiligt', 'involved; participating', 'adj', 'context bleed "participates; involved"');
fix('bevorzugt', 'preferred', 'adj', 'context bleed "prefers; preferred"');
fix('bewundert', 'admired', 'v', 'context bleed "admires; admired"', { lemma: 'bewundern' });
fix('biologische', 'biological; organic', 'adj', 'context bleed "buys; biological"', { lemma: 'biologisch' });
fix('blick', 'view; glance; look', 'n', 'context bleed "takes; view"');
fix('defekte', 'defective; faulty', 'adj', 'context bleed "complains; defective"', { lemma: 'defekt' });
fix('deuten', 'to interpret; to point', 'v', 'context bleed "results; interpret"');
fix('dicke', 'thickness; fat', 'n', 'context bleed "wears; thickness"');
fix('dunkelheit', 'darkness', 'n', 'context bleed "forbids; darkness"');
fix('ehrenamtlich', 'voluntary; honorary', 'adj', 'context bleed "volunteers; voluntarily"');
fix('einbruch', 'burglary; break-in', 'n', 'context bleed "forbids; burglary"');
fix('eintauschen', 'to exchange; to trade', 'v', 'context bleed "wants; exchange"');
fix('engagiert', 'committed; dedicated', 'adj', 'context bleed "volunteers; committed"');
fix('erbschaft', 'inheritance; heritage', 'n', 'context bleed "argues; heritage"');
fix('ergänzt', 'supplemented; added', 'v', 'context bleed "supplements; added"', { lemma: 'ergänzen' });
fix('erklärt', 'explained; declared', 'v', 'context bleed "explains; explained"', { lemma: 'erklären' });
fix('erster', 'first', 'adj', 'context bleed "needs; first"', { lemma: 'erst' });
fix('fass', 'barrel; keg', 'n', 'context bleed "orders; barrel"');
fix('fernsehen', 'television; to watch TV', 'n', 'context bleed "watches; tv"');
fix('flüssigsten', 'most fluid; most fluent', 'adj', 'context bleed "speaks; liquid" → fluent', { lemma: 'flüssig' });
fix('freitags', 'on Fridays', 'adv', 'context bleed "takes; friday"');
fix('freiwilligen', 'volunteers; voluntary', 'n', 'context bleed "volunteers; voluntary"');
fix('fremd', 'foreign; strange; unfamiliar', 'adj', 'context bleed "feels; foreign"');
fix('fressen', 'to eat (animals); to devour', 'v', 'context bleed "gives; eat"');
fix('frisst', 'to eat (animals); to devour', 'v', 'context bleed "gives; eat"', { lemma: 'fressen' });
fix('fünfzehn', 'fifteen', 'num', 'context bleed "picks; fifteen"');
fix('furchtbar', 'terrible; dreadful', 'adj', 'context bleed "gets; terrible"');
fix('gefallene', 'fallen', 'adj', 'context bleed "leaves; fallen"', { lemma: 'gefallen' });
fix('gehorcht', 'obeyed', 'v', 'context bleed "obeys; obeyed"', { lemma: 'gehorchen' });
fix('gepressten', 'pressed; squeezed', 'adj', 'context bleed "drinks; pressed"', { lemma: 'gepresst' });
fix('helles', 'bright; light; pale (beer)', 'adj', 'context bleed "orders; bright"', { lemma: 'hell' });
fix('heraus', 'out; out of', 'adv', 'context bleed "goes; out of here"');
fix('hineinruft', 'to call in; to shout inside', 'v', 'context bleed "goes; shouts inside"', { lemma: 'hineinrufen' });
fix('hoch', 'high; tall', 'adj', 'context bleed "rolls; high"');
fix('höchste', 'highest', 'adj', 'context bleed "rolls; high"', { lemma: 'hoch' });
fix('höchsten', 'highest', 'adj', 'context bleed "rolls; high"', { lemma: 'hoch' });
fix('hohen', 'high; tall', 'adj', 'context bleed "rolls; high"', { lemma: 'hoch' });
fix('höher', 'higher', 'adj', 'context bleed "rolls; high"', { lemma: 'hoch' });
fix('irgendetwas', 'something; anything', 'pron', 'context bleed "seems; anything"');
fix('karten', 'cards; tickets; maps', 'n', 'context bleed "tickets; card"');
fix('kasse', 'checkout; cash register', 'n', 'context bleed "stands; checkout"');
fix('kette', 'chain; necklace', 'n', 'context bleed "gives; chain"');
fix('kleidung', 'clothing; clothes', 'n', 'context bleed "changes; clothing"');
fix('korrigiert', 'corrected', 'v', 'context bleed "corrects; corrected"', { lemma: 'korrigieren' });
fix('letzten', 'last; latest', 'adj', 'context bleed "prices; last"', { lemma: 'letzt' });
fix('lieb', 'dear; sweet; kind', 'adj', 'context bleed "loves; dear"');
fix('lockt', 'to attract; to lure', 'v', 'context bleed "attracts; entice"', { lemma: 'locken' });
fix('losgeht', 'to start; to begin', 'v', 'context bleed "takes; and go"', { lemma: 'losgehen' });
fix('luft', 'air', 'n', 'context bleed "takes; air"');
fix('mitte', 'center; middle', 'n', 'context bleed "opens; center"');
fix('montags', 'on Mondays', 'adv', 'context bleed "takes; monday"');
fix('nerven', 'to annoy; nerves', 'v', 'context bleed "gets; annoy"');
fix('nervt', 'to annoy', 'v', 'context bleed "gets; annoy"', { lemma: 'nerven' });
fix('not', 'need; distress; emergency', 'n', 'context bleed "makes; not" → need/distress');
fix('notfall', 'emergency', 'n', 'context bleed "tries; emergency"');
fix('nützt', 'to be useful; to benefit', 'v', 'context bleed "benefits; useful"', { lemma: 'nützen' });
fix('oasen', 'oases', 'n', 'context bleed "to oasis" → oases');
fix('obdachlosen', 'homeless people', 'n', 'context bleed "to homeless" → homeless people');
fix('passt', 'to fit; to suit', 'v', 'context bleed "adjusts; fit"', { lemma: 'passen' });
fix('prost', 'cheers!', 'interj', 'context bleed "to cheers" → cheers!');
fix('rasenmäher', 'lawn mower', 'n', 'context bleed "lends; mowing machine"');
fix('regeln', 'to regulate; rules', 'v', 'context bleed "rules; regulate"');
fix('reich', 'rich; wealthy', 'adj', 'context bleed "collects; rich"');
fix('schallt', 'to echo; to resound', 'v', 'context bleed "goes; echo"', { lemma: 'schallen' });
fix('scheint', 'to seem; to shine', 'v', 'context bleed "seems; appear"', { lemma: 'scheinen' });
fix('schicht', 'layer; shift (work)', 'n', 'context bleed "starts; layer"');
fix('sehenswürdigkeiten', 'sights; tourist attractions', 'n', 'context bleed "sights; sightseeing"');
fix('seltensten', 'rarest', 'adj', 'context bleed "rains; rarest"', { lemma: 'selten' });
fix('spanisch', 'Spanish', 'adj', 'context bleed "seems; spanish"');
fix('stamme', 'to come from; to originate', 'v', 'context bleed "thinks; origin"', { lemma: 'stammen' });
fix('stammt', 'to come from; to originate', 'v', 'context bleed "comes; origin"', { lemma: 'stammen' });
fix('stimmt', 'to be right; that\'s correct', 'v', 'context bleed "seems; true"', { lemma: 'stimmen' });
fix('stolz', 'proud', 'adj', 'context bleed "serves; proud"');
fix('täglich', 'daily', 'adj', 'context bleed "loads; daily"');
fix('tägliche', 'daily', 'adj', 'context bleed "loads; daily"', { lemma: 'täglich' });
fix('tägliches', 'daily', 'adj', 'context bleed "loads; daily"', { lemma: 'täglich' });
fix('ton', 'clay; tone; sound', 'n', 'context bleed "calls; clay"');
fix('trainiert', 'to train; trained', 'v', 'context bleed "trains; trained"', { lemma: 'trainieren' });
fix('treten', 'to step; to kick', 'v', 'context bleed "measures; step"');
fix('ums', 'about the (um + das)', 'prep', 'context bleed "comes; about"');
fix('unnötig', 'unnecessary', 'adj', 'context bleed "parents; unnecessary"');
fix('unnötige', 'unnecessary', 'adj', 'context bleed "parents; unnecessary"', { lemma: 'unnötig' });
fix('untersucht', 'examined; investigated', 'v', 'context bleed "examines; examined"', { lemma: 'untersuchen' });
fix('verbessert', 'improved', 'v', 'context bleed "improves; improved"', { lemma: 'verbessern' });
fix('verbietet', 'to forbid; to prohibit', 'v', 'context bleed "forbids; prohibit"', { lemma: 'verbieten' });
fix('verboten', 'forbidden; prohibited', 'adj', 'context bleed "parents; forbidden"');
fix('verkauft', 'sold', 'v', 'context bleed "sells; sold"', { lemma: 'verkaufen' });
fix('verständlich', 'understandable; comprehensible', 'adj', 'context bleed "explains; understandable"');
fix('vertraut', 'trusted; familiar', 'adj', 'context bleed "trusts; trusted"');
fix('verzichtet', 'to do without; to waive', 'v', 'context bleed "saves; waived"', { lemma: 'verzichten' });
fix('vom', 'from the (von + dem)', 'prep', 'context bleed "orders; from the" + wrong POS');
fix('wald', 'forest; woods', 'n', 'context bleed "goes; forest"');
fix('waldes', 'of the forest', 'n', 'context bleed "goes; forest"', { lemma: 'wald' });
fix('widerspruch', 'contradiction; objection', 'n', 'context bleed "obeys; contradiction"');
fix('wirft', 'to throw', 'v', 'context bleed "takes; throw"', { lemma: 'werfen' });
fix('wirtschaft', 'economy; business; pub', 'n', 'context bleed "appears; business"');
fix('zusammenhang', 'connection; context', 'n', 'context bleed "results; connection"');

// ── Category 9: "to " + past tense/3rd person on verbs ───────
fix('akzeptiert', 'accepted', 'v', '"to accepted" → accepted', { lemma: 'akzeptieren' });
fix('älteren', 'older; elderly', 'adj', 'context bleed "helped; older"', { lemma: 'alt' });
fix('angelegt', 'created; designed', 'v', '"to created" → created', { lemma: 'anlegen' });
fix('angemeldet', 'registered; logged in', 'v', 'context bleed "signed; logged in"', { lemma: 'anmelden' });
fix('angepasst', 'adjusted; adapted', 'v', '"to adjusted" → adjusted', { lemma: 'anpassen' });
fix('antreten', 'to compete; to start', 'v', 'context bleed "explained; compete"');
fix('anvertraut', 'entrusted', 'v', '"to entrusted" → entrusted', { lemma: 'anvertrauen' });
fix('aufgebunden', 'untied; pulled (someone\'s leg)', 'v', 'context bleed "pulled; tied up"', { lemma: 'aufbinden' });
fix('ausgefüllten', 'filled out; completed', 'adj', '"to completed" → completed', { lemma: 'ausgefüllt' });
fix('ausgelaugt', 'exhausted; drained', 'adj', '"to exhausted" → exhausted');
fix('ausgeschildert', 'signposted', 'adj', '"to signposted" → signposted');
fix('ausgetauscht', 'exchanged; replaced', 'v', 'context bleed "replaced; exchanged"', { lemma: 'austauschen' });
fix('ausrichten', 'to align; to convey', 'v', 'context bleed "supposed; align"');
fix('auszeichnung', 'award; distinction', 'n', 'context bleed "passed; award"');
fix('bären', 'bears (animals)', 'n', 'context bleed "pulled; bear"');
fix('bearbeitete', 'edited; processed', 'v', 'context bleed "worked; edited"', { lemma: 'bearbeiten' });
fix('beaufsichtigt', 'supervised', 'v', '"to supervised" → supervised', { lemma: 'beaufsichtigen' });
fix('bedürfnisse', 'needs; requirements', 'n', '"to need" on noun → needs');
fix('befragt', 'interviewed; questioned', 'v', '"to interviewed" → interviewed', { lemma: 'befragen' });
fix('begleitete', 'accompanied', 'v', '"to accompanied" → accompanied', { lemma: 'begleiten' });
fix('belastete', 'burdened; strained', 'v', '"to burdened" → burdened', { lemma: 'belasten' });
fix('benotet', 'graded', 'v', '"to graded" → graded', { lemma: 'benoten' });
fix('berreicht', 'reached', 'v', '"to reported" garbled → reached', { lemma: 'erreichen' });
fix('bersteigt', 'exceeds', 'v', '"to exceed" → exceeds (likely übersteigt)', { lemma: 'übersteigen' });
fix('berwacht', 'guarded; monitored', 'v', '"to guarded" → monitored (likely überwacht)', { lemma: 'überwachen' });
fix('bestickte', 'embroidered', 'adj', '"to embroidered" → embroidered', { lemma: 'bestickt' });
fix('beteiligten', 'involved; participants', 'n', '"to involved" → involved/participants');
fix('bewertung', 'evaluation; assessment; rating', 'n', 'context bleed "achieved; evaluation"');
fix('bewilligt', 'approved; granted', 'v', '"to approved" → approved', { lemma: 'bewilligen' });
fix('beworben', 'applied (for)', 'v', 'context bleed "applied; advertised"', { lemma: 'bewerben' });
fix('bratkartoffeln', 'fried potatoes', 'n', '"to fried potato" on noun → fried potatoes');
fix('brauche', 'to need', 'v', '"to need" → to need (already has to)', { lemma: 'brauchen' });
fix('brauchen', 'to need', 'v', 'correct verb');
fix('brauchst', 'to need', 'v', '"to need"', { lemma: 'brauchen' });
fix('braucht', 'to need', 'v', '"to need"', { lemma: 'brauchen' });
fix('bräuchten', 'would need', 'v', '"to need" → would need', { lemma: 'brauchen' });
fix('darum', 'therefore; that\'s why', 'adv', 'context bleed "requested; therefore"');
fix('denkmalgeschützt', 'listed; heritage-protected', 'adj', '"to listed building" → heritage-protected');
fix('dient', 'to serve', 'v', 'context bleed "served; serf"', { lemma: 'dienen' });
fix('diskussionsbedarf', 'need for discussion', 'n', '"to need for discussion" → noun');
fix('diskutierte', 'discussed', 'v', '"to discussed" → discussed', { lemma: 'diskutieren' });
fix('dokumentiert', 'documented', 'v', '"to documented" → documented', { lemma: 'dokumentieren' });
fix('dokumentierte', 'documented', 'v', '"to documented" → documented', { lemma: 'dokumentieren' });
fix('durchgeführt', 'carried out; conducted', 'v', '"to carried out" → carried out', { lemma: 'durchführen' });
fix('eingeführten', 'introduced; imported', 'adj', '"to introduced" → introduced', { lemma: 'eingeführt' });
fix('eingehalten', 'kept; maintained', 'v', 'context bleed "supposed; retain" → kept', { lemma: 'einhalten' });
fix('eingeklemmt', 'trapped; jammed', 'adj', '"to trapped" → trapped');
fix('eingelebt', 'settled in', 'v', '"to settled in" → settled in', { lemma: 'einleben' });
fix('eingepackt', 'packed; wrapped', 'v', 'context bleed "wrapped; packed"', { lemma: 'einpacken' });
fix('eingeschränkt', 'restricted; limited', 'adj', '"to restricted" → restricted');
fix('eingesehen', 'realized; viewed', 'v', 'context bleed "realized; viewed"', { lemma: 'einsehen' });
fix('eingestuft', 'classified; rated', 'v', '"to classified" → classified', { lemma: 'einstufen' });
fix('eingetreten', 'entered; occurred', 'v', '"to entered" → entered', { lemma: 'eintreten' });
fix('eingetroffenen', 'arrived', 'adj', '"to arrived" → arrived', { lemma: 'eingetroffen' });
fix('einhalten', 'to keep; to comply with', 'v', 'context bleed "supposed; retain" → to keep');
fix('empfangen', 'to receive; received', 'v', '"to received" → to receive');
fix('entdeckte', 'discovered', 'v', '"to discovered" → discovered', { lemma: 'entdecken' });
fix('entdeckten', 'discovered', 'v', '"to discovered" → discovered', { lemma: 'entdecken' });
fix('entschlossen', 'determined; decided', 'adj', 'context bleed "decided; determined"');
fix('entwickelte', 'developed', 'v', '"to developed" → developed', { lemma: 'entwickeln' });
fix('entworfene', 'designed', 'adj', '"to designed" → designed', { lemma: 'entworfen' });
fix('erlitten', 'suffered; sustained', 'v', '"to suffered" → suffered', { lemma: 'erleiden' });
fix('erst', 'first; only; not until', 'adv', 'context bleed "arrived; first" → first/only');
fix('erstellen', 'to create; to produce', 'v', 'context bleed "supposed; create" → to create');
fix('erwähnt', 'mentioned', 'v', '"to mentioned" → mentioned', { lemma: 'erwähnen' });
fix('evakuierte', 'evacuated', 'v', '"to evacuated" → evacuated', { lemma: 'evakuieren' });
fix('fertig', 'finished; ready; done', 'adj', '"to finished; complete" → finished/ready');
fix('fertigprodukte', 'finished products', 'n', '"to finished product" → finished products');
fix('festzuhalten', 'to hold on to; to note', 'v', 'context bleed "noted; be held"');
fix('ffnete', 'opened (likely öffnete)', 'v', '"to opened" garbled → opened', { lemma: 'öffnen' });
fix('freigesprochen', 'acquitted', 'v', '"to acquitted" → acquitted', { lemma: 'freisprechen' });
fix('führung', 'tour; leadership; guidance', 'n', 'context bleed "requested; guide"');
fix('fuß', 'foot', 'n', 'context bleed "walked; foot"');
fix('füße', 'feet', 'n', 'context bleed "walked; foot"', { lemma: 'fuß' });
fix('futter', 'animal feed; lining', 'n', '"to feed" on noun → animal feed');
fix('geantwortet', 'replied; answered', 'v', '"to replied" → replied', { lemma: 'antworten' });
fix('gebäck', 'pastry; baked goods', 'n', 'context bleed "ordered; pastry"');
fix('gebucht', 'booked', 'v', '"to booked" → booked', { lemma: 'buchen' });
fix('gefahren', 'driven; traveled', 'v', '"to traveled; driven"', { lemma: 'fahren' });
fix('gelegene', 'located; situated', 'adj', '"to located" → located');
fix('gelernt', 'learned; studied', 'v', 'context bleed "studied; learned"', { lemma: 'lernen' });
fix('genannten', 'mentioned; named', 'adj', '"to mentioned" → mentioned');
fix('genehmigt', 'approved; authorized', 'v', '"to approved" → approved', { lemma: 'genehmigen' });
fix('geräuchertem', 'smoked (food)', 'adj', '"to smoked" → smoked', { lemma: 'geräuchert' });
fix('geschätzt', 'estimated; appreciated', 'v', 'context bleed "appreciated; estimated"', { lemma: 'schätzen' });
fix('geschätzte', 'estimated; appreciated', 'adj', 'context bleed "appreciated; estimated"', { lemma: 'geschätzt' });
fix('gestreut', 'scattered; sprinkled', 'v', '"to scattered" → scattered', { lemma: 'streuen' });
fix('geträumt', 'dreamed', 'v', '"to dreamed" → dreamed', { lemma: 'träumen' });
fix('gewünschten', 'desired; requested', 'adj', 'context bleed "requested; desired"', { lemma: 'gewünscht' });
fix('gezwungen', 'forced; compelled', 'adj', '"to forced" → forced');
fix('gravierte', 'engraved', 'v', '"to engraved" → engraved', { lemma: 'gravieren' });
fix('handlungsbedarf', 'need for action', 'n', '"to need for action" → noun');
fix('heiratsantrag', 'marriage proposal', 'n', 'context bleed "proposed; marriage proposal"');
fix('her', 'here; this way; ago', 'adv', 'context bleed "produced; her" → here/ago');
fix('inbegriffen', 'included', 'adj', '"to included" → included');
fix('intensiviert', 'intensified', 'v', '"to intensified" → intensified', { lemma: 'intensivieren' });
fix('kamen', 'came', 'v', '"to arrived; came"', { lemma: 'kommen' });
fix('katalogisierte', 'cataloged', 'v', '"to cataloged" → cataloged', { lemma: 'katalogisieren' });
fix('knapp', 'scarce; tight; narrow', 'adj', 'context bleed "passed; meager"');
fix('komplizierten', 'complicated; complex', 'adj', '"to complicated" → complicated', { lemma: 'kompliziert' });
fix('meißelte', 'chiseled', 'v', '"to chiseled" → chiseled', { lemma: 'meißeln' });
fix('müdigkeit', 'fatigue; tiredness', 'n', 'context bleed "went; fatigue"');
fix('mülltrennung', 'waste separation; recycling', 'n', '"to waste separation" → noun');
fix('nderung', 'change (likely Änderung)', 'n', '"to change" garbled → change');
fix('notwendigkeit', 'necessity; need', 'n', '"to need" on noun → necessity');
fix('optimierte', 'optimized', 'v', '"to optimized" → optimized', { lemma: 'optimieren' });
fix('parierte', 'parried', 'v', '"to parried" → parried', { lemma: 'parieren' });
fix('schämt', 'ashamed', 'v', '"to ashamed" → ashamed', { lemma: 'schämen' });
fix('schärfte', 'sharpened', 'v', '"to sharpened" → sharpened', { lemma: 'schärfen' });
fix('scheiterten', 'failed', 'v', '"to failed" → failed', { lemma: 'scheitern' });
fix('seid', 'are (you, plural)', 'v', 'context bleed "reported; be"', { lemma: 'sein' });
fix('sinkt', 'to sink; to decline', 'v', 'context bleed "expected; sink"', { lemma: 'sinken' });
fix('sofort', 'immediately; at once', 'adv', 'context bleed "supposed; immediately"');
fix('storniert', 'canceled', 'v', '"to canceled" → canceled', { lemma: 'stornieren' });
fix('strukturierter', 'more structured', 'adj', '"to structured" → structured', { lemma: 'strukturiert' });
fix('technische', 'technical', 'adj', 'context bleed "compared; technical"', { lemma: 'technisch' });
fix('tobte', 'raged; rampaged', 'v', '"to raged" → raged', { lemma: 'toben' });
fix('überquerte', 'crossed', 'v', '"to crossed" → crossed', { lemma: 'überqueren' });
fix('umgebaut', 'converted; rebuilt', 'v', 'context bleed "converted; rebuilt"', { lemma: 'umbauen' });
fix('validierter', 'validated', 'adj', '"to validated" → validated', { lemma: 'validiert' });
fix('veraltete', 'outdated; obsolete', 'adj', '"to outdated" → outdated');
fix('verarbeitete', 'processed', 'v', '"to processed" → processed', { lemma: 'verarbeiten' });
fix('verbindlich', 'binding; obligatory', 'adj', 'context bleed "pointed; binding"');
fix('verblasste', 'faded', 'v', '"to faded" → faded', { lemma: 'verblassen' });
fix('verbraucht', 'consumed; used up', 'v', '"to consumed" → consumed', { lemma: 'verbrauchen' });
fix('verdoppelt', 'doubled', 'v', '"to doubled" → doubled', { lemma: 'verdoppeln' });
fix('verdorrten', 'withered', 'adj', '"to withered" → withered', { lemma: 'verdorrt' });
fix('vergleich', 'comparison', 'n', 'context bleed "compared; comparison"');
fix('verhaftet', 'arrested', 'v', '"to arrested" → arrested', { lemma: 'verhaften' });
fix('verkürzt', 'shortened', 'v', '"to shortened" → shortened', { lemma: 'verkürzen' });
fix('verlängertes', 'extended', 'adj', '"to extended" → extended', { lemma: 'verlängert' });
fix('verlaufen', 'to get lost; to run', 'v', 'context bleed "reported; get lost"');
fix('verläuft', 'to run; to proceed', 'v', 'context bleed "reported; get lost"', { lemma: 'verlaufen' });
fix('verliefen', 'proceeded; ran', 'v', 'context bleed "reported; get lost"', { lemma: 'verlaufen' });
fix('vernachlässigt', 'neglected', 'v', 'context bleed "worked; neglected"', { lemma: 'vernachlässigen' });
fix('verpflichtet', 'obligated; committed', 'adj', '"to obligated" → obligated');
fix('verschlechtert', 'worsened; deteriorated', 'v', '"to worsened" → worsened', { lemma: 'verschlechtern' });
fix('verschlüsselten', 'encrypted', 'adj', '"to encrypted" → encrypted', { lemma: 'verschlüsselt' });
fix('verschoben', 'postponed; shifted', 'v', 'context bleed "postponed; delay"', { lemma: 'verschieben' });
fix('verschont', 'spared', 'v', '"to spared" → spared', { lemma: 'verschonen' });
fix('verstaucht', 'sprained', 'adj', '"to sprained" → sprained');
fix('verstorbenen', 'deceased', 'adj', '"to deceased" → deceased');
fix('verteilt', 'distributed', 'v', '"to distributed" → distributed', { lemma: 'verteilen' });
fix('verursacht', 'caused', 'v', '"to caused" → caused', { lemma: 'verursachen' });
fix('verwendet', 'used', 'v', '"to used" → used', { lemma: 'verwenden' });
fix('verzögerte', 'delayed', 'v', '"to delayed" → delayed', { lemma: 'verzögern' });
fix('voraussichtlich', 'expected; presumably', 'adv', '"to expected" → presumably');
fix('vorgestellt', 'introduced; presented', 'v', 'context bleed "introduced; presented"', { lemma: 'vorstellen' });
fix('vorliegenden', 'present; available', 'adj', 'context bleed "based; present"', { lemma: 'vorliegend' });
fix('vorstellen', 'to introduce; to imagine', 'v', 'context bleed "supposed; introduce"');
fix('wohngemeinschaft', 'shared apartment; flat share', 'n', '"to shared apartment" → noun');
fix('zerstörte', 'destroyed', 'v', '"to destroyed" → destroyed', { lemma: 'zerstören' });
fix('zufrieden', 'satisfied; content', 'adj', '"to satisfied" → satisfied');
fix('zurückgesandt', 'sent back; returned', 'v', '"to returned" → sent back', { lemma: 'zurücksenden' });
fix('zurückgezogen', 'withdrawn; reclusive', 'adj', 'context bleed "smelled; withdrawn"');

// ── Category 1: "to " on noun-suffix words ───────────────────
// These all have noun suffixes but are tagged v with "to "
fix('änderung', 'change; amendment', 'n', '"to change" on -ung noun → change');
fix('angelegenheit', 'matter; affair', 'n', '"to matter" on -heit noun → matter');
fix('anlehnung', 'reference; in keeping with', 'n', '"to reference" on -ung noun');
fix('apfelkuchen', 'apple pie', 'n', '"to apple pie" on noun → apple pie');
fix('berücksichtigung', 'consideration', 'n', 'context bleed + -ung noun');
fix('besprechung', 'meeting; discussion', 'n', '"to meet" on -ung noun');
fix('besprechungsraum', 'meeting room', 'n', '"to meet room" → meeting room');
fix('bestellung', 'order; reservation', 'n', '"to order" on -ung noun');
fix('bewegung', 'movement; exercise', 'n', 'context bleed "exercise; movement" → noun');
fix('bilderkennung', 'image recognition', 'n', '"to image recognition" → noun');
fix('entschuldigung', 'sorry; excuse me; apology', 'n', '"to excuse me, sorry" → noun');
fix('erfahrung', 'experience', 'n', '"to experience" on -ung noun');
fix('erlebnis', 'experience; event', 'n', '"to experience" on -nis noun');
fix('erhöhung', 'increase; raise', 'n', '"to increase" on -ung noun');
fix('eröffnung', 'opening; inauguration', 'n', '"to open" on -ung noun');
fix('experiment', 'experiment', 'n', '"to experiment" on noun');
fix('finanzierung', 'financing; funding', 'n', '"to finance" on -ung noun');
fix('forschung', 'research', 'n', '"to research" on -ung noun');
fix('forschungsgemeinschaft', 'research community', 'n', '"to research community" → noun');
fix('führerscheinprüfung', 'driving test', 'n', '"to drive test" → driving test');
fix('geschäftsordnung', 'rules of procedure', 'n', '"to rule of procedure" → noun');
fix('heilung', 'cure; healing', 'n', '"to cure" on -ung noun');
fix('herausforderung', 'challenge', 'n', '"to challenge" on -ung noun');
fix('hoffnung', 'hope', 'n', '"to hope" on -ung noun');
fix('mannschaft', 'team', 'n', '"to team" on -schaft noun');
fix('planung', 'planning', 'n', '"to plan" on -ung noun');
fix('portion', 'portion; serving', 'n', '"to portion" → noun');
fix('projektmanagement', 'project management', 'n', '"to project management" → noun');
fix('reiseversicherung', 'travel insurance', 'n', '"to travel insurance" → noun');
fix('rettungsaktion', 'rescue operation', 'n', '"to rescue operation" → noun');
fix('rückmeldung', 'feedback; response', 'n', 'context bleed "appreciate; return message"');
fix('sitzung', 'meeting; session', 'n', '"to meet" on -ung noun');
fix('sortiment', 'range; assortment', 'n', '"to range" → noun');
fix('tanzaufführung', 'dance performance', 'n', '"to dance performance" → noun');
fix('übung', 'exercise; practice', 'n', 'context bleed "practice; exercise" → noun');
fix('unterstützung', 'support; assistance', 'n', '"to support" on -ung noun');
fix('verhältnis', 'relationship; ratio', 'n', 'context bleed "decide; relationship"');
fix('verständnis', 'understanding', 'n', '"to understand" on -nis noun');
fix('verwendung', 'use; usage', 'n', '"to use" on -ung noun');
fix('vorlesung', 'lecture', 'n', '"to lecture" on -ung noun');
fix('weiterbildung', 'continuing education', 'n', 'context bleed "plan; continuing education"');

// ── Category: Remaining "to " on non-verb entries ────────────
fix('autobahn', 'highway; motorway', 'n', 'context bleed "driving; highway"');
fix('autobiographischen', 'autobiographical', 'adj', '"to autobiographical" → adj', { lemma: 'autobiographisch' });
fix('bayerischen', 'Bavarian', 'adj', '"to bavarian" → Bavarian', { lemma: 'bayerisch' });

// ── Category 3: Verbs genuinely missing "to " ────────────────
fix('lernen', 'to learn', 'v', 'missing "to " on infinitive verb');
fix('sprechen', 'to speak', 'v', 'missing "to " on infinitive verb');
fix('teilen', 'to split; to share', 'v', 'missing "to " on infinitive verb');
fix('biegen', 'to turn; to bend', 'v', 'missing "to " on infinitive verb');
fix('schalten', 'to switch; to shift', 'v', 'context bleed "turn; switch" → to switch');
fix('namen', 'name; names', 'n', '"to name; name" → noun (Namen = names)');

// ── More wrong POS entries ──────────────────────────────────
fix('beschissen', 'shitty; lousy', 'adj', '"to shitty" → adj, not verb');

// ══════════════════════════════════════════════════════════════
// GENERATE FIXES
// ══════════════════════════════════════════════════════════════

const fixes = [];
const stats = {
  backslashGarbled: 0,
  contextBleed: 0,
  toOnNonVerb: 0,
  truncated: 0,
  wrongMeaning: 0,
  wrongPos: 0,
  toPastTense: 0,
  missingTo: 0,
  total: 0,
};

for (const [key, desired] of Object.entries(FIXES)) {
  const current = entries[key];
  if (!current) {
    // Entry doesn't exist in dict, skip
    continue;
  }

  // Check if anything actually needs changing
  const enChanged = current.en !== desired.en;
  const posChanged = current.pos !== desired.pos;
  const lemmaChanged = desired.lemma !== undefined && current.lemma !== desired.lemma;

  if (!enChanged && !posChanged && !lemmaChanged) continue;

  // Determine issue type
  let issueType = 'fix';
  if (current.en.includes('\\')) {
    issueType = 'backslash-garbled';
    stats.backslashGarbled++;
  } else if (desired.note.includes('truncated')) {
    issueType = 'truncated';
    stats.truncated++;
  } else if (desired.note.includes('context bleed')) {
    issueType = 'context-bleed';
    stats.contextBleed++;
  } else if (desired.note.includes('"to ') && desired.note.includes('noun')) {
    issueType = 'to-on-non-verb';
    stats.toOnNonVerb++;
  } else if (desired.note.includes('→') && desired.note.includes('to ')) {
    issueType = 'to-past-tense';
    stats.toPastTense++;
  } else if (desired.note.includes('missing "to "')) {
    issueType = 'missing-to';
    stats.missingTo++;
  } else if (desired.note.includes('wrong') || desired.note.includes('false friend') || desired.note.includes('German')) {
    issueType = 'wrong-meaning';
    stats.wrongMeaning++;
  } else if (posChanged && !enChanged) {
    issueType = 'wrong-pos';
    stats.wrongPos++;
  } else {
    // Classify by characteristics
    if (current.en.includes('\\')) {
      issueType = 'backslash-garbled';
      stats.backslashGarbled++;
    } else if (current.en.includes(';') && desired.note.includes('bleed')) {
      issueType = 'context-bleed';
      stats.contextBleed++;
    } else {
      issueType = 'other-fix';
      stats.wrongMeaning++;
    }
  }

  const fixObj = {
    key,
    issueType,
    note: desired.note,
    old: { en: current.en, pos: current.pos },
    new: { en: desired.en, pos: desired.pos },
  };

  if (lemmaChanged || (desired.lemma && current.lemma !== desired.lemma)) {
    fixObj.old.lemma = current.lemma || null;
    fixObj.new.lemma = desired.lemma || null;
  }

  fixes.push(fixObj);
  stats.total++;
}

// Sort by key
fixes.sort((a, b) => a.key.localeCompare(b.key, 'de'));

// Write output
const outPath = path.join(__dirname, 'output', 'de-full-verb-review.json');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(fixes, null, 2));

console.log(`\n═══ German Dictionary COMPLETE Review ═══`);
console.log(`Total entries reviewed: ${Object.keys(entries).length}`);
console.log(`Total fixes: ${stats.total}`);
console.log(`  Backslash-garbled entries: ${stats.backslashGarbled}`);
console.log(`  Context bleed semicolons: ${stats.contextBleed}`);
console.log(`  "to " on non-verbs: ${stats.toOnNonVerb}`);
console.log(`  Truncated translations: ${stats.truncated}`);
console.log(`  "to " + past tense/3rd person: ${stats.toPastTense}`);
console.log(`  Missing "to " on verbs: ${stats.missingTo}`);
console.log(`  Wrong meaning: ${stats.wrongMeaning}`);
console.log(`  Wrong POS: ${stats.wrongPos}`);
console.log(`\nFixes written to: ${outPath}`);

// Also log some examples for verification
console.log(`\n─── Sample fixes ───`);
for (const f of fixes.slice(0, 5)) {
  console.log(`  ${f.key}: "${f.old.en}" (${f.old.pos}) → "${f.new.en}" (${f.new.pos}) [${f.issueType}]`);
}
