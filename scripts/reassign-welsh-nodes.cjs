#!/usr/bin/env node
/**
 * reassign-welsh-nodes.cjs
 *
 * Reassigns all 3,933 Welsh cards to grammar-based nodes (1-35) using
 * morphological analysis of Welsh text, English text, and grammar tips.
 *
 * Strategy: Each card gets scored for every node. Scores are based on
 * pattern matches with different weights. Cards go to the highest-scoring
 * node, with fallback to current assignment. Then rebalance to 80-200.
 */

const fs = require('fs');
const path = require('path');

const DECK_PATH = path.join(__dirname, '..', 'src', 'data', 'welsh', 'deck.json');
const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf8'));

const MIN_PER_NODE = 80;
const MAX_PER_NODE = 200;
const TOTAL_NODES = 35;

// ── Scoring rules ────────────────────────────────────────────────────
// Each rule: { node, test(welsh, english, tip) => boolean, weight }
// Higher weight = stronger signal

const rules = [];

function r(node, weight, testFn) {
  rules.push({ node, weight, test: testFn });
}

// Helper: test welsh text
function w(regex) { return (welsh) => regex.test(welsh); }
// Helper: test english text
function e(regex) { return (_, eng) => regex.test(eng); }
// Helper: test grammar tip
function g(regex) { return (_, __, tip) => tip && regex.test(tip); }

// ── node-01: Present tense with bod (Rydw i'n...) ───────────────────
// A1 basics: simple present with bod
r('node-01', 15, w(/\b(dw i'n|rwy'n|rydw i'n)\b/i));
r('node-01', 12, w(/\bwyt ti'n\b/i));
r('node-01', 12, w(/\bmaen nhw'n\b/i));
r('node-01', 12, w(/\brŷn ni'n\b/i));
r('node-01', 12, w(/\brŷch chi'n\b/i));
r('node-01', 10, g(/\bbod\b/i));
r('node-01', 8, g(/\bpresent\b.*\btense\b/i));

// ── node-02: Present tense with bod (continued) ─────────────────────
r('node-02', 15, w(/\b(sy'n|sydd)\b/i));
r('node-02', 12, w(/\bmae\s+(e|o|hi)\b/i));
r('node-02', 10, w(/\bmae\b.*\byn\b.*\b(hoffi|gallu|medru|gweithio|byw|siarad)\b/i));
r('node-02', 8, g(/\birregular\b/i));

// ── node-03: Questions & answers ─────────────────────────────────────
r('node-03', 20, w(/\b(beth|pwy|ble|pryd|sut|pam|faint)\b/i));
r('node-03', 15, w(/\b(ydw|wyt|ydy|ydyn|ydych)\b/i));
r('node-03', 15, w(/\b(oes|nag oes|nac ydw)\b/i));
r('node-03', 12, w(/\?$/));
r('node-03', 10, e(/\b(what|who|where|when|how|why|how many|how much)\b/i));
r('node-03', 8, g(/\bquestion\b/i));

// ── node-04: Articles, gender & mutations ────────────────────────────
// Only strong signal when article is the FOCUS, not just present
r('node-04', 15, g(/\barticle\b/i));
r('node-04', 15, g(/\bgender\b/i));
r('node-04', 15, g(/\b(feminine|masculine)\b/i));
r('node-04', 12, g(/\by\/yr\b/i));
r('node-04', 10, w(/\b(y|yr)\s+(ferch|fachgen|fenyw|dyn|ci|gath|tŷ|ysgol|eglwys)\b/i));

// ── node-05: Numerals & counting mutations ───────────────────────────
r('node-05', 20, w(/\b(un|dau|dwy|tri|tair|pedwar|pedair|pump|chwech|saith|wyth|naw|deg)\b/i));
r('node-05', 15, w(/\b(ugain|deugain|hanner cant|cant|mil)\b/i));
r('node-05', 15, w(/\b(cyntaf|ail|trydydd|pedwerydd|pumed)\b/i));
r('node-05', 15, w(/o'r gloch/i));
r('node-05', 12, e(/\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|twenty|hundred|thousand)\b/i));
r('node-05', 12, e(/\b(first|second|third|fourth|fifth)\b/i));
r('node-05', 10, e(/\b(o'clock|quarter|half past)\b/i));
r('node-05', 8, g(/\bnumber\b/i));
r('node-05', 8, g(/\bcount/i));

// ── node-06: Possession & genitive (fy/dy/ei) ───────────────────────
r('node-06', 20, w(/\b(fy|dy|ei|ein|eich|eu)\s+\w/i));
r('node-06', 15, w(/\bgen\s+i\b/i));
r('node-06', 15, w(/\bganddo\b/i));
r('node-06', 15, w(/\bganddi\b/i));
r('node-06', 15, w(/\bgennym\b/i));
r('node-06', 15, w(/\bgennych\b/i));
r('node-06', 15, w(/\bganddyn\b/i));
r('node-06', 12, w(/\bpiau\b/i));
r('node-06', 10, e(/\b(my|your|his|her|our|their)\s+\w/i));
r('node-06', 8, g(/\bposses/i));
r('node-06', 8, g(/\bgenitive\b/i));

// ── node-07: Negation (ddim/dim/na) ─────────────────────────────────
r('node-07', 20, w(/\bddim\b/i));
r('node-07', 15, w(/\bdoes dim\b/i));
r('node-07', 15, w(/\bnid\b/i));
r('node-07', 15, w(/\bnac\b/i));
r('node-07', 12, w(/\bdim\b/i));
r('node-07', 10, e(/\b(not|don't|doesn't|didn't|won't|can't|isn't|aren't|never|nothing|nobody|nowhere)\b/i));
r('node-07', 8, g(/\bnegat/i));

// ── node-08: Common expressions & particles ──────────────────────────
r('node-08', 20, w(/\b(diolch|os gwelwch yn dda|bore da|prynhawn da|nos da|shwmae|croeso|hwyl)\b/i));
r('node-08', 15, w(/\b(iawn|da iawn|wrth gwrs|efallai|siŵr|gobeithio)\b/i));
r('node-08', 12, e(/\b(hello|goodbye|please|thank|sorry|welcome|good morning|good afternoon|good evening)\b/i));
r('node-08', 10, e(/\b(of course|perhaps|maybe|certainly|hopefully)\b/i));
r('node-08', 8, g(/\bexpression\b/i));
r('node-08', 8, g(/\bgreet/i));
r('node-08', 8, g(/\bparticle\b/i));

// ── node-09: Past tense (preterite) ─────────────────────────────────
r('node-09', 20, w(/\b(wnes|wnest|wnaeth|wnaethon|wnaethoch)\b/i));
r('node-09', 20, w(/\b(es|est|aeth|aethon|aethoch)\b/i));
r('node-09', 15, w(/\b(ges|gest|gafodd|gawson|gawsoch)\b/i));
r('node-09', 12, w(/\bddoe\b/i));
r('node-09', 12, w(/\bneithiwr\b/i));
r('node-09', 10, w(/\b(llynedd|echdoe)\b/i));
r('node-09', 10, e(/\b(yesterday|last night|last week|last month|last year)\b/i));
r('node-09', 8, e(/\b(went|came|ate|drank|saw|heard|did|made|got|gave|took|said|told|bought|sold|found|lost|wrote|drove|ran|sang|paid|thought|felt|knew|left|met|began|became|broke|brought|built|caught|sent|spoke|stood|woke|wore|won)\b/i));
r('node-09', 8, g(/\bpast\b/i));
r('node-09', 8, g(/\bpreterite\b/i));

// ── node-10: Imperfect tense ────────────────────────────────────────
r('node-10', 20, w(/\b(roeddwn|roeddet|roedd|roedden|roeddech)\b/i));
r('node-10', 20, w(/\b(ro'n i|ro't ti)\b/i));
r('node-10', 15, w(/\b(o'n i'n|oedd e'n|oedd hi'n)\b/i));
r('node-10', 12, w(/\barfer\b/i));
r('node-10', 10, e(/\bused to\b/i));
r('node-10', 10, e(/\b(was|were)\s+\w+ing\b/i));
r('node-10', 8, g(/\bimperfect\b/i));

// ── node-11: Modal verbs ────────────────────────────────────────────
r('node-11', 20, w(/\b(gallu|alla|alli|gall|gallwn|gallwch|gallan)\b/i));
r('node-11', 20, w(/\b(eisiau|isio|moyn)\b/i));
r('node-11', 15, w(/\b(hoffi|hoffwn|hoffet|hoffai)\b/i));
r('node-11', 15, w(/\b(medru|medra|medri|medr)\b/i));
r('node-11', 15, w(/\b(dylwn|dylet|dylai|dylen|dylech)\b/i));
r('node-11', 15, w(/\brhaid\b/i));
r('node-11', 10, e(/\b(can|could|want|need|must|should|have to|able to|may|might)\b/i));
r('node-11', 8, g(/\bmodal\b/i));

// ── node-12: Object pronouns & agreement ────────────────────────────
r('node-12', 15, w(/\b(i mi|i ti|iddo|iddi|i ni|i chi|iddyn)\b/i));
r('node-12', 15, w(/\b(wrthof|wrthot|wrtho|wrthi|wrthon|wrthoch|wrthyn)\b/i));
r('node-12', 15, w(/\b(amdanaf|amdanat|amdano|amdani|amdanom|amdanoch|amdanyn)\b/i));
r('node-12', 10, e(/\b(to me|to him|to her|to us|to them|about me|about him|about her)\b/i));
r('node-12', 8, g(/\bobject pronoun/i));
r('node-12', 8, g(/\bagreement\b/i));

// ── node-13: Prepositions & prepositional pronouns ──────────────────
r('node-13', 20, w(/\b(arnaf|arnat|arno|arni|arnom|arnoch|arnyn)\b/i));
r('node-13', 20, w(/\b(ataf|atat|ato|ati|atom|atoch|atyn)\b/i));
r('node-13', 20, w(/\b(ohonof|ohonot|ohono|ohoni|ohonom|ohonoch|ohonyn)\b/i));
r('node-13', 15, w(/\b(gennyf|gennyt|ganddo|ganddi|gennym|gennych|ganddyn)\b/i));
r('node-13', 12, w(/\b(ar|am|at|dan|dros|drwy|gan|heb|hyd|wrth|rhwng)\b/i));
r('node-13', 8, g(/\bpreposition/i));

// ── node-14: Adjective agreement & mutation ─────────────────────────
r('node-14', 15, w(/\b(mawr|bach|da|drwg|hen|newydd|ifanc|tal|byr|hir|tew|tenau|hardd|prydferth|hyll|trist|hapus|tawel|swnllyd)\b/i));
r('node-14', 12, w(/\b(coch|glas|gwyrdd|melyn|gwyn|du|brown|oren|pinc)\b/i));
r('node-14', 10, e(/\b(big|small|good|bad|old|new|young|tall|short|long|beautiful|ugly|sad|happy|quiet|loud|red|blue|green|yellow|white|black)\b/i));
r('node-14', 8, g(/\badjective\b/i));
r('node-14', 8, g(/\bcolou?r\b/i));
r('node-14', 8, g(/\bdescri/i));

// ── node-15: Comparatives & superlatives ────────────────────────────
r('node-15', 20, w(/\b(mwy|fwy|llai|gwell|gwaeth)\b/i));
r('node-15', 20, w(/\b(mwyaf|lleiaf|gorau|gwaethaf)\b/i));
r('node-15', 15, w(/\bmor\b.*\bâ\b/i));
r('node-15', 15, w(/\bcyn\b.*\bâ\b/i));
r('node-15', 10, e(/\b(more|most|less|least|better|best|worse|worst|bigger|smaller|taller|shorter|older|younger|faster|slower)\b/i));
r('node-15', 10, e(/\bthan\b/i));
r('node-15', 8, g(/\bcompar/i));
r('node-15', 8, g(/\bsuperlat/i));

// ── node-16: Soft mutation (Treiglad Meddal) ────────────────────────
// Basic trigger contexts: after feminine singular nouns, yn+adj, prepositions
r('node-16', 15, g(/\bsoft mutation\b/i));
r('node-16', 15, g(/\btreiglad meddal\b/i));
r('node-16', 12, g(/\bp→b|t→d|c→g|b→f|d→dd|g→|m→f|ll→l|rh→r/i));
r('node-16', 10, w(/\byn\s+(f[aeiouwyâêîôûŵŷ]|d[aeiouwyâêîôûŵŷ]|g[aeiouwyâêîôûŵŷ]|b[aeiouwyâêîôûŵŷ]|dd[aeiouwyâêîôûŵŷ])/i));

// ── node-17: Nasal mutation (Treiglad Trwynol) ─────────────────────
r('node-17', 20, w(/\b(Nghymru|Nghaerdydd|Nghaernarfon|Nhŷ|Nhref|Nhad|Mhriod)\b/i));
r('node-17', 15, w(/\byn\s+(Ng|Nh|M|ng|nh)/));
r('node-17', 15, w(/\bfy\s+(ng|nh|m)/i));
r('node-17', 12, g(/\bnasal mutation\b/i));
r('node-17', 12, g(/\btreiglad trwynol\b/i));

// ── node-18: Aspirate mutation (Treiglad Lleddf) ────────────────────
r('node-18', 20, w(/\b(â|gyda)\s+(ch|ph|th)/i));
r('node-18', 15, w(/\bei\s+(ch|ph|th)/i));
r('node-18', 15, w(/\b(tri|chwe)\s+(ch|ph|th)/i));
r('node-18', 12, w(/\b(chath|phen|thad|thref|phump)\b/i));
r('node-18', 10, g(/\baspirate mutation\b/i));
r('node-18', 10, g(/\btreiglad lleddf\b/i));

// ── node-19: Imperative mood ────────────────────────────────────────
r('node-19', 20, w(/\b(paid|peidiwch)\s+â/i));
r('node-19', 15, w(/\b(cer|ewch|dere|dewch|rho|rhowch|byddwch|gwna|gwnewch|tyrd|cerwch)\b/i));
r('node-19', 12, e(/\b(don't|do not)\b/i));
r('node-19', 10, e(/^(go|come|eat|drink|read|write|run|stop|wait|listen|look|give|take|put|sit|stand|open|close|tell|show|help)\b/i));
r('node-19', 8, g(/\bimperative\b/i));
r('node-19', 8, g(/\bcommand\b/i));

// ── node-20: Soft mutation advanced contexts ────────────────────────
r('node-20', 15, w(/\b(fe|mi)\s+(f|d|g|b|dd|l|r)\w+/i));
r('node-20', 15, w(/\b(ni|na)\s+(f|d|g|b|dd|l|r)\w+/i));
r('node-20', 12, w(/\bnewydd\s+(f|d|g|b|dd|l|r)\w+/i));
r('node-20', 12, w(/\b(dyma|dyna)\s+(f|d|g|b|dd|l|r)\w+/i));
r('node-20', 10, g(/\bdirect object\b/i));
r('node-20', 10, g(/\bmutation context\b/i));

// ── node-21: Nasal & aspirate in complex sentences ──────────────────
r('node-21', 15, g(/\bnasal\b.*\baspirate\b/i));
r('node-21', 15, g(/\bmutation\b.*\bcomplex\b/i));
r('node-21', 12, w(/\byn\s+(ng|nh|m)\w+.*\b(sy|sydd|oedd|mae)\b/i));
r('node-21', 12, w(/\bei\s+(ch|ph|th)\w+.*\b(sy|sydd|oedd|mae)\b/i));

// ── node-22: Relative clauses (a/sy/sydd) ───────────────────────────
r('node-22', 20, w(/\bsy'n\b/i));
r('node-22', 20, w(/\bsydd\b/i));
r('node-22', 15, w(/\ba\s+(sy'n|sydd)\b/i));
r('node-22', 10, e(/\bwho\s+(is|was|has|had)\b/i));
r('node-22', 10, e(/\bthat\s+(is|was|has|had)\b/i));
r('node-22', 8, g(/\brelative\b/i));

// ── node-23: Future tense ───────────────────────────────────────────
r('node-23', 20, w(/\b(bydda|byddi|bydd|byddwn|byddwch|byddan)\b/i));
r('node-23', 15, w(/\bfory\b/i));
r('node-23', 12, w(/\b(wythnos nesaf|mis nesaf|blwyddyn nesaf)\b/i));
r('node-23', 10, e(/\bwill\b/i));
r('node-23', 10, e(/\b(going to|tomorrow|next week|next month|next year|soon)\b/i));
r('node-23', 8, g(/\bfuture\b/i));

// ── node-24: Conditional ────────────────────────────────────────────
r('node-24', 20, w(/\b(baswn|baset|basai|basen|basech)\b/i));
r('node-24', 15, w(/\b(petai|petawn|petaet)\b/i));
r('node-24', 15, w(/\btaswn\b/i));
r('node-24', 12, w(/\bbyddai'n\b/i));
r('node-24', 10, e(/\bwould\b/i));
r('node-24', 10, e(/\bif\b.*\b(would|could|were)\b/i));
r('node-24', 8, g(/\bconditional\b/i));

// ── node-25: Emphatic & focus structures ────────────────────────────
r('node-25', 20, w(/\b(fi|ti|fe|hi|ni|chi|nhw)\s+(sy'n|sydd|yw|oedd)\b/i));
r('node-25', 15, w(/\b(mai|taw)\b/i));
r('node-25', 12, w(/\b(dyna|dyma)\b/i));
r('node-25', 10, e(/\bit\s+(is|was)\s+\w+\s+(who|that)\b/i));
r('node-25', 8, g(/\bemphatic\b/i));
r('node-25', 8, g(/\bfocus\b/i));

// ── node-26: Reported speech ────────────────────────────────────────
r('node-26', 20, w(/\b(dywedodd|meddai|dweud)\b/i));
r('node-26', 15, w(/\b(dywedais|dywedaist|dywedon|dywedoch)\b/i));
r('node-26', 12, w(/\b(honni|awgrymu|esbonio)\b/i));
r('node-26', 10, e(/\b(said|told|mentioned|asked|replied|explained|claimed|suggested|reported)\b/i));
r('node-26', 8, g(/\breport/i));
r('node-26', 8, g(/\bspeech\b/i));

// ── node-27: Advanced verb constructions ────────────────────────────
r('node-27', 15, w(/\bwedi\b/i));
r('node-27', 15, w(/\bnewydd\b/i));
r('node-27', 12, w(/\bar fin\b/i));
r('node-27', 10, w(/\bheb\b.*\b(wneud|gael)\b/i));
r('node-27', 8, g(/\bverb construction\b/i));
r('node-27', 8, g(/\bwedi\b/i));
r('node-27', 8, g(/\bnewydd\b/i));

// ── node-28: Welsh idioms & expressions ─────────────────────────────
r('node-28', 15, w(/\b(wrth fy modd|ar bigau'r drain|codi pais|mynd i'r afael)\b/i));
r('node-28', 12, w(/\bfel\b.*\b(cath|ci|draig|aderyn)\b/i));
r('node-28', 10, g(/\bidiom/i));
r('node-28', 10, g(/\bsaying\b/i));
r('node-28', 10, g(/\bproverb\b/i));

// ── node-29: Formal register & chi/ti ───────────────────────────────
r('node-29', 15, w(/\b(a allwch|a fyddech|a hoffech)\b/i));
r('node-29', 15, w(/\b(maddeuwch|esgusodwch)\b/i));
r('node-29', 12, w(/\b(tybed|os gwelwch)\b/i));
r('node-29', 10, e(/\b(formal|polite|sir|madam)\b/i));
r('node-29', 8, g(/\bformal\b/i));
r('node-29', 8, g(/\bregister\b/i));
r('node-29', 8, g(/\bchi\b.*\bti\b/i));

// ── node-30: Particle verbs & compound expressions ──────────────────
r('node-30', 15, w(/\b(edrych ar|gwrando ar|meddwl am|sôn am|dibynnu ar|gofalu am)\b/i));
r('node-30', 12, w(/\b(mynd|dod|cael|gwneud|rhoi|cymryd)\s+(i|â|o|am|ar|drwy)\b/i));
r('node-30', 8, g(/\bparticle verb\b/i));
r('node-30', 8, g(/\bcompound\b/i));
r('node-30', 8, g(/\bphrasal\b/i));

// ── node-31: Complex sentences & connectors ─────────────────────────
r('node-31', 15, w(/\b(er|serch|er mwyn|oherwydd|achos|oblegid)\b/i));
r('node-31', 15, w(/\b(fodd bynnag|er hynny|serch hynny|ar y llaw arall)\b/i));
r('node-31', 12, w(/\b(felly|oherwydd hynny|o ganlyniad)\b/i));
r('node-31', 10, w(/\b(pan|tra|ers|cyn|ar ôl|erbyn|hyd nes)\b/i));
r('node-31', 10, e(/\b(although|however|nevertheless|therefore|consequently|furthermore|moreover|despite|whereas)\b/i));
r('node-31', 8, g(/\bconnector\b/i));
r('node-31', 8, g(/\bconjunction\b/i));

// ── node-32: Passive voice & advanced structures ────────────────────
r('node-32', 20, w(/\b(cael|cafodd|caiff|cafwyd)\b.*\bei\b/i));
r('node-32', 15, w(/\b(ganwyd|darganfuwyd|crëwyd|adeiladwyd)\b/i));
r('node-32', 12, w(/wyd\b/i));
r('node-32', 10, e(/\bwas\b.*\b(built|made|created|discovered|found|written|born)\b/i));
r('node-32', 8, g(/\bpassive\b/i));

// ── node-33: Academic & professional Welsh ──────────────────────────
r('node-33', 15, w(/\b(ymchwil|astudiaeth|dadansoddiad|theori|strategaeth)\b/i));
r('node-33', 15, w(/\b(cyflwyno|cyhoeddi|archwilio|gwerthuso|adolygu)\b/i));
r('node-33', 12, w(/\b(polisi|deddf|rheoliad|cyfansoddiad)\b/i));
r('node-33', 10, e(/\b(research|study|analysis|theory|strategy|policy|law|regulation)\b/i));
r('node-33', 8, g(/\bacademic\b/i));
r('node-33', 8, g(/\bprofessional\b/i));

// ── node-34: Literature & poetry ────────────────────────────────────
r('node-34', 15, w(/\b(cerdd|barddoniaeth|llenyddiaeth|stori|nofel|chwedl)\b/i));
r('node-34', 15, w(/\b(awdl|englyn|cywydd|eisteddfod)\b/i));
r('node-34', 12, w(/\b(bardd|llenor|awdur|beirniad)\b/i));
r('node-34', 10, e(/\b(poem|poetry|literature|story|novel|legend|poet|author|literary)\b/i));
r('node-34', 8, g(/\bliterature\b/i));
r('node-34', 8, g(/\bpoetry\b/i));

// ── node-35: Advanced mixed mastery ─────────────────────────────────
r('node-35', 10, w(/\b(yn ogystal|yn enwedig|yn arbennig)\b/i));
r('node-35', 8, g(/\badvanced\b/i));
r('node-35', 8, g(/\bmastery\b/i));

// ── Scoring function ─────────────────────────────────────────────────

function scoreCard(card) {
  const welsh = card.target || '';
  const english = card.english || '';
  const tip = card.grammar || '';

  const scores = {};
  for (let n = 1; n <= TOTAL_NODES; n++) {
    scores[`node-${String(n).padStart(2, '0')}`] = 0;
  }

  for (const rule of rules) {
    if (rule.test(welsh, english, tip)) {
      scores[rule.node] += rule.weight;
    }
  }

  return scores;
}

function getBestNode(scores) {
  let best = null;
  let bestScore = -1;
  for (const [node, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      best = node;
    }
  }
  return { node: best, score: bestScore };
}

// ── Assignment ───────────────────────────────────────────────────────

console.log('=== Welsh Node Reassignment ===');
console.log(`Total cards: ${deck.length}\n`);

// Show current distribution
const currentDist = {};
deck.forEach(c => {
  const n = c.grammarNode || 'unknown';
  currentDist[n] = (currentDist[n] || 0) + 1;
});
console.log('BEFORE - Current distribution:');
for (let n = 1; n <= TOTAL_NODES; n++) {
  const nodeId = `node-${String(n).padStart(2, '0')}`;
  console.log(`  ${nodeId}: ${currentDist[nodeId] || 0} cards`);
}

// Score all cards
const cardData = deck.map((card, idx) => {
  const scores = scoreCard(card);
  const { node: bestNode, score: bestScore } = getBestNode(scores);
  return {
    idx,
    scores,
    bestNode: bestScore > 0 ? bestNode : card.grammarNode,
    bestScore,
    currentNode: card.grammarNode,
    // Also track 2nd and 3rd best for rebalancing
    ranked: Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .filter(([_, s]) => s > 0)
      .map(([n]) => n),
  };
});

// Build initial buckets
const buckets = {};
for (let n = 1; n <= TOTAL_NODES; n++) {
  buckets[`node-${String(n).padStart(2, '0')}`] = [];
}

for (const cd of cardData) {
  buckets[cd.bestNode].push(cd);
}

console.log('\nPre-rebalance distribution:');
for (let n = 1; n <= TOTAL_NODES; n++) {
  const nodeId = `node-${String(n).padStart(2, '0')}`;
  const count = buckets[nodeId].length;
  const marker = count < MIN_PER_NODE ? ' LOW' : count > MAX_PER_NODE ? ' HIGH' : '';
  console.log(`  ${nodeId}: ${count} cards${marker}`);
}

// ── Rebalancing ──────────────────────────────────────────────────────

// Sort each bucket: highest-scoring first (they stay)
for (const nodeId of Object.keys(buckets)) {
  buckets[nodeId].sort((a, b) => b.bestScore - a.bestScore);
}

// Phase A: Cap overflowed nodes at MAX_PER_NODE, move excess to pool
const pool = [];
for (const [nodeId, bucket] of Object.entries(buckets)) {
  while (bucket.length > MAX_PER_NODE) {
    pool.push(bucket.pop()); // remove lowest-scoring
  }
}

console.log(`\nOverflow pool: ${pool.length} cards`);

// Phase B: Distribute pool cards to underflowed nodes
// Sort pool cards by number of alternative nodes (fewer alternatives = harder to place, do first)
pool.sort((a, b) => a.ranked.length - b.ranked.length);

for (const cd of pool) {
  // Find the best underflowed node for this card
  let placed = false;
  for (const altNode of cd.ranked) {
    if (buckets[altNode].length < MAX_PER_NODE) {
      buckets[altNode].push(cd);
      cd.bestNode = altNode;
      placed = true;
      break;
    }
  }
  if (!placed) {
    // Place in the most underflowed node
    let minNode = null;
    let minCount = Infinity;
    for (const [nodeId, bucket] of Object.entries(buckets)) {
      if (bucket.length < minCount) {
        minCount = bucket.length;
        minNode = nodeId;
      }
    }
    buckets[minNode].push(cd);
    cd.bestNode = minNode;
  }
}

// Phase C: Fill underflowed nodes by stealing from largest nodes
let iterations = 0;
while (iterations < 50) {
  iterations++;
  let anyUnder = false;

  for (let n = 1; n <= TOTAL_NODES; n++) {
    const nodeId = `node-${String(n).padStart(2, '0')}`;
    const bucket = buckets[nodeId];

    if (bucket.length >= MIN_PER_NODE) continue;
    anyUnder = true;

    const needed = MIN_PER_NODE - bucket.length;

    // Find donor nodes (sorted by size descending)
    const donors = Object.entries(buckets)
      .filter(([id]) => id !== nodeId)
      .sort((a, b) => b[1].length - a[1].length);

    let moved = 0;
    for (const [donorId, donorBucket] of donors) {
      if (donorBucket.length <= MIN_PER_NODE + 2) continue;

      // Find cards in donor that have this node as an alternative
      const candidates = [];
      for (let i = donorBucket.length - 1; i >= 0; i--) {
        const cd = donorBucket[i];
        if (cd.ranked.includes(nodeId) || cd.scores[nodeId] >= 0) {
          candidates.push({ cd, donorIdx: i });
        }
      }

      // Sort candidates: prefer ones with lower score in donor (easier to part with)
      candidates.sort((a, b) => a.cd.bestScore - b.cd.bestScore);

      for (const { cd, donorIdx } of candidates) {
        if (moved >= needed) break;
        if (donorBucket.length <= MIN_PER_NODE + 2) break;

        // Move card
        donorBucket.splice(donorBucket.indexOf(cd), 1);
        bucket.push(cd);
        cd.bestNode = nodeId;
        moved++;
      }

      if (moved >= needed) break;
    }
  }

  if (!anyUnder) break;
}

// ── Apply assignments ────────────────────────────────────────────────

let changed = 0;
for (const cd of cardData) {
  if (deck[cd.idx].grammarNode !== cd.bestNode) {
    changed++;
  }
  deck[cd.idx].grammarNode = cd.bestNode;
}

// Final distribution
console.log(`\nAFTER - Final distribution (${changed} cards reassigned):`);
const finalDist = {};
let totalCards = 0;
deck.forEach(c => {
  finalDist[c.grammarNode] = (finalDist[c.grammarNode] || 0) + 1;
});

let nodesUnder = 0;
let nodesOver = 0;
for (let n = 1; n <= TOTAL_NODES; n++) {
  const nodeId = `node-${String(n).padStart(2, '0')}`;
  const count = finalDist[nodeId] || 0;
  totalCards += count;
  const bar = '#'.repeat(Math.round(count / 5));
  let marker = '';
  if (count < MIN_PER_NODE) { marker = ' [LOW]'; nodesUnder++; }
  if (count > MAX_PER_NODE) { marker = ' [HIGH]'; nodesOver++; }
  console.log(`  ${nodeId}: ${String(count).padStart(4)} ${bar}${marker}`);
}
console.log(`  Total: ${totalCards}`);
console.log(`  Nodes under ${MIN_PER_NODE}: ${nodesUnder}`);
console.log(`  Nodes over ${MAX_PER_NODE}: ${nodesOver}`);

// Write updated deck
fs.writeFileSync(DECK_PATH, JSON.stringify(deck, null, 2) + '\n');
console.log(`\nDeck written to ${DECK_PATH}`);
