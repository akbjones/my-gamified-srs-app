#!/usr/bin/env node
/**
 * Apply carefully curated semantic fixes to Welsh dictionary.
 * Each fix has been manually reviewed from the 474 mismatches.
 */

const fs = require('fs');
const path = require('path');

const DICT_PATH = path.join(__dirname, '..', 'src', 'data', 'dictionary', 'cy.ts');

// ── Curated fixes: key → newEn ──
// Only entries where the current translation is CLEARLY WRONG and Google is better.
// Skipping: verb conjugation diffs, plural/singular, UK/US spelling, close synonyms,
// garbage Google results, proper nouns/names.

const FIXES = {
  // === GENUINELY WRONG MEANINGS ===
  'alawon': 'melodies',                    // was "white water lily" — alawon = melodies/tunes
  'anferth': 'huge',                       // was "unsightly, ugly" — anferth = huge/enormous
  'arloesi': 'to innovate',               // was "clear" — arloesi = to innovate
  'bili-pala': 'butterfly',               // was "caterpillar, turns" — pili-pala/bili-pala = butterfly
  'bigau': 'spikes',                      // was "beak, bill" — pigau/bigau = spikes/pricks
  'binc': 'pink',                         // was "finch" — pinc/binc = pink
  'bondo': 'eaves',                       // was "eaf" — bondo = eaves (garbled old)
  'cadarnhaol': 'positive',              // was "strengthening, reinforcing" — cadarnhaol = positive
  'cadeirio': 'to chair',               // was "to at a Welsh eisteddfod" — garbled
  'casiwt': 'jacket',                    // was "cashew, dafydd" — casiwt = cassock/jacket; Google "casute" also wrong, use correct
  'cyffro': 'excitement',               // was "movement, motion" — cyffro = excitement
  'cyllid': 'finance',                  // was "income, revenue" — cyllid = finance/budget
  'cynted': 'hallway',                  // was "as soon" — cyntedd/cynted = hallway/porch (as soon = cyn gynted)
  'cyntedd': 'hallway',                 // was "porch, lobby" — actually hallway is better
  'dân': 'fire',                        // was "to come" — tân/dân (mutated) = fire, NOT come
  'datys': 'dates (fruit)',             // was "dates" → "potatoes" — both wrong for context; datys = dates (fruit)
  'dreiddgar': 'penetrating',           // was "piccolo, high-pitched" — treiddgar/dreiddgar = penetrating
  'dyfarnwr': 'referee',               // was "adjudicator" — dyfarnwr = referee (more common)
  'dynnu': 'to remove',                // was "to pull" — tynnu/dynnu = to pull/remove; "remove" is primary meaning
  'egluro': 'to explain',              // was "to illustrate" — egluro = to explain
  'esgair': 'ridge',                   // was "leg, shank" — esgair = ridge (geographic); Google "spawn" also off
  'ewin': 'fingernail',                // was "nail" → Google "clove" — ewin = fingernail/claw
  'fedi': 'to reap',                   // was "to September" — medi/fedi = to reap/harvest
  'feis': 'festival',                  // was "vise" — gŵyl/feis = festival; Google "face" also wrong
  'fil': 'thousand',                   // was "animal, beast" — mil/fil (mutated) = thousand
  'fodd': 'means; way',               // was "ye" — modd/fodd = means/way
  'genau': 'mouth',                    // was "chin" — genau = mouth
  'gludo': 'to transport',            // was "to glue" — cludo/gludo = to transport/carry
  'gŵydd': 'goose',                   // was "presence, face" — gŵydd = goose
  'gwyddfid': 'honeysuckle',          // was "wood, forest" — gwyddfid = honeysuckle
  'gylch': 'circle',                  // was "to wash" — cylch/gylch = circle
  'law': 'hand',                      // was "rain" — llaw/law (mutated) = hand
  'llwch': 'dust',                    // was "llio" (garbled) — llwch = dust
  'marciau': 'marks',                 // was "bark" — marciau = marks
  'marcio': 'to mark',               // was "to march" — marcio = to mark
  'medal': 'medal',                   // was "to say" — medal = medal
  'medd': 'says',                     // was "to mead" — medd = says (literary)
  'megawatiau': 'megawatts',          // was "wind, turbine" — megawatiau = megawatts
  'menig': 'gloves',                  // was "glof" (garbled) — menig = gloves (plural of maneg)
  'merched': 'women; girls',          // was "girl, maiden" — merched = women/girls (plural)
  'mlaen': 'forward',                 // was "front" — ymlaen/mlaen = forward
  'mwyd': 'food',                     // was "steeping, soaking" — bwyd/mwyd (mutated) = food
  'naill': 'either',                  // was "the one (of two)" — naill = either (naill...neu = either...or)
  'nwy': 'gas',                       // was "ga" (garbled) — nwy = gas
  'of': 'of',                         // was "blacksmith" — "of" in Welsh contexts is usually just "of"
  'pennaf': 'main; chief',            // was "head" — pennaf = main/chief/primary
  'pobl': 'people',                   // was "person" — pobl = people (collective)
  'pobol': 'people',                  // was "person" — pobol = people (colloquial)
  'phobl': 'people',                  // was "person" — pobl aspirate mut
  'bobl': 'people',                   // was "person" — pobl soft mut
  'prif': 'main',                     // was "principal, prime" — prif = main (simpler)
  'pryf': 'insect; fly',             // was "insect" — pryf = insect/fly (both valid, add fly)
  'ragfyr': 'December',               // was "December" → Google "spring" — KEEP December, Google is wrong; skip
  'rhegen': 'fern',                   // was "rail, crake" — rhedyn/rhegen = fern; Google "swear" wrong too
  'rhew': 'ice',                      // was "frost" — rhew = ice/frost, "ice" is primary
  'sêl': 'seal',                      // was "zeal, enthusiasm" — sêl can mean seal or zeal, but seal is more common
  'sgil': 'skill',                    // was "pillion, back" — sgil = skill (borrowed from English)
  'sied': 'shed',                     // was "sh" (garbled) — sied = shed
  'siglen': 'swing',                  // was "swe" (garbled) — siglen = swing
  'tacteg': 'tactic',                // was "siân, saw" (garbled) — tacteg = tactic
  'tagfa': 'traffic jam; bottleneck', // was "choking, strangulation" — tagfa = traffic jam
  'tasgau': 'tasks',                 // was "culhwch, completes" (garbled) — tasgau = tasks
  'tlws': 'trophy; pretty',          // was "jewel, gem" — tlws = trophy/pretty
  'toc': 'shortly; soon',            // was "piece" — toc = shortly/soon
  'triniad': 'treatment',            // was "Trinidad" — triniad = treatment (triniaeth)
  'troellwr': 'spinner',             // was "whirler, aled" (name garbled in) — troellwr = spinner
  'trosol': 'lever; crowbar',        // was "crowbar, guto" (name garbled in) — trosol = lever/crowbar
  'twrch': 'boar',                   // was "barrow, hog" — twrch = wild boar
  'tywyn': 'to shine',              // was "Tywyn ." — tywyn = to shine (not just the place)
  'tywysog': 'prince',              // was "leader, chief" — tywysog = prince
  'uwchradd': 'secondary',          // was "a higher rank or degree" — uwchradd = secondary (school)
  'wyddeleg': 'Irish',              // was "welsh; syllogism" — Gwyddeleg = Irish (language)
  'ynglŷn': 'regarding; about',    // was "attached, connected" — ynglŷn â = regarding/about
  'pelydr-x': 'x-ray',             // was "radiographer, takes" — pelydr-x = x-ray
  'tingoch': 'robin (redbreast)',   // was "red-rumped, red-tailed" — tingoch/robin goch = robin
  'gorau': 'best',                  // was "good" — gorau = best (superlative of da)
  'gwaethaf': 'worst',             // was "bad" — gwaethaf = worst (superlative of drwg)
  'waethaf': 'worst',              // was "bad" — same
  'hapusaf': 'happiest',           // was "happy" — superlative
  'haws': 'easier',                // was "easy" — comparative
  'cynharach': 'earlier',          // was "early" — comparative
  'gynharach': 'earlier',          // was "early" — comparative (mutated)
  'pellach': 'further',           // was "far, distant" — comparative
  'oerach': 'colder',             // was "cold" — comparative

  // === GARBLED / NONSENSE OLD VALUES ===
  'esgidiau': 'shoes',            // was "sho" (garbled)
  'sgidiau': 'shoes',             // was "sho" (garbled)
  'cyfres': 'series',             // was "sery" (garbled)
  'berthnasau': 'relatives',      // was "relatif" (garbled)
  'hamcanion': 'objectives',      // was "objectif" (garbled)
  'credur': 'creature',           // was "doesn\" (garbled) — creadur/credur = creature
  'dydw': "i don't",              // was "don\" (garbled)
  'paid': "don't",                // was "don\" (garbled)
  'peidio': "don't; to stop",    // was "don\" (garbled)
  'peidiwch': "don't (imperative)", // was "don\" (garbled)
  'oni': "unless; is it not",     // was "rain; isn\" (garbled) — oni = unless
  'beidio': "to stop; don't",    // was "to worry; don\" (garbled)
  'bocsio': 'to box',            // was "to boxe" (misspelled)
  'cwiltio': 'to quilt',         // was "to quilte" (misspelled)
  'paentio': 'to paint',         // was "to painte" (misspelled)
  'peintio': 'to paint',         // was "to painte" (misspelled)
  'syrffio': 'to surf',          // was "to surfe" (misspelled)
  'smwddio': 'to iron',          // was "to irone" (misspelled)
  'reslo': 'to wrestle',         // was "to wrestle" — same, actually OK; skip
  'lluchior': 'is thrown',        // was "rhodri\" (garbled) — lluchio = to throw
  'meindior': 'steeple',         // was "doesn\" (garbled) — meindwr = steeple
  'cymharu': 'to compare',       // was "year\" (garbled) — cymharu = to compare
  'chanfyddiadaur': 'perceptions', // was "year\" (garbled)
  'wedii': 'after',              // was "you\" (garbled) — wedi = after

  // === WRONG POS/FORM (adjective marked as verb, etc.) ===
  'addawol': 'promising',         // was "to promise" (addawol is adjective, not verb)
  'diamynedd': 'impatient',       // was "impatient, three" — remove "three" garbage
  'hamddena': 'leisure; to relax', // was "leisure, three" — remove "three" garbage
  'rwdins': 'swede (vegetable)',   // was "swedes, three" — remove "three" garbage
  'diddanwch': 'entertainment',    // was "to amusement, four" — remove number garbage
  'oerllyd': 'chilly',            // was "chilly, thanks" — remove "thanks" garbage
  'paleontelegydd': 'palaeontologist', // was "palaeontologist, studies" — remove "studies" garbage

  // === VERB FORM CLEANUP (dict had wrong form, not just conjugation diff) ===
  'adeiladodd': 'to build',      // was "to building; construction" — cleanup
  'adeiladwyd': 'was built',     // was "to building; construction" — passive form
  'cofion': 'regards; memories', // was "to remember" — cofion = regards/memories (noun)
  'canodd': 'to sing',          // was "sing" (no 'to')
  'canwyd': 'was sung',         // was "sing" — canwyd is passive
  'torrir': 'is broken',        // was "car; break" — torrir = is broken (impersonal)
  'torrodd': 'broke',           // was "car; break" — torrodd = broke (past)
  'cododd': 'rose; got up',    // was "rises; get up" — past tense
  'ddewis': 'to choose',       // was "to chose; choice" — correct spelling
  'weithredu': 'to act',       // was "therefore, must" — gweithredu = to act
  'ychwanegodd': 'added',      // was "to ad" — past tense of ychwanegu

  // === CONTENT WORDS GENUINELY WRONG ===
  'bwys': 'importance',          // was "weight, burden" — pwys/bwys = importance (more common in context)
  'cadarnhaol': 'positive',     // already above
  'cyflwyniad': 'introduction; presentation', // was "presentation, location" — remove "location"
  'derbyniad': 'reception; acceptance', // was "reception" — add acceptance
  'delor': 'warbler',           // was "nuthatch" — telor/delor = warbler
  'ffug': 'fake; false',        // was "deception, guile" — ffug = fake/false
  'cyfeirio': 'to refer; to direct', // was "to direct, point" — add "refer" primary meaning
  'casgliad': 'conclusion; collection', // was "collection" — add conclusion
  'sefydliad': 'organization; institution', // was "institution, foundation" — organization more common
  'gwobr': 'prize; award',      // was "prize, reward" — keep prize, add award
  'swyddi': 'jobs',             // was "appointed; job" — swyddi = jobs (plural)
  'cyfryngau': 'media',        // was "medium" — cyfryngau = media (plural)
  'gwraig': 'wife; woman',     // was "wife" — gwraig = wife/woman
  'dannedd': 'teeth',          // was "tooth" — dannedd = teeth (plural)
  'traed': 'feet',             // was "foot" — traed = feet (plural)
  'thraed': 'feet',            // was "foot" — traed aspirate mut
  'dai': 'houses',             // was "a diminutive of" (garbled) — tai/dai = houses

  // Plural forms that dict wrongly has as singular
  'bywydau': 'lives',
  'dyddiau': 'days',
  'ddyddiau': 'days',
  'ddiwrnodau': 'days',
  'ffyrdd': 'roads; ways',
  'cerfluniau': 'sculptures',
  'cyfleoedd': 'opportunities',
  'gyfleoedd': 'opportunities',

  // Items where old value has wrong person name mixed in
  'crafwr': 'scraper',          // was "scraper, gruffudd" — remove name
  'actwr': 'actor',             // was "actor, catrin" — remove name

  // Misc genuinely wrong
  'gallan': 'to be able',       // Google said "white" which is also wrong; keep "to be able"
  'eifl': 'Yr Eifl (mountain)', // was "Eifl (mountain)" but Google said "poor" which is wrong
  'rhiannon': 'Rhiannon',       // proper name, Google said "parent" — both wrong-ish, keep as name
  'cymraes': 'Welshwoman',      // was "Welshwoman" Google said "english" — Google is wrong!
  'datganoli': 'devolution; decentralization', // was "devolution" — both valid, add second
  'campfa': 'gym',              // was "arena, playground" — campfa = gym
  'bacio': 'to back; to reverse', // was "to reverse" — Google "packing" is wrong, keep improved
  'gostyngiad': 'discount; reduction', // was "to fall, reduction" — fix
  'nodi': 'to note; to identify', // was "to note" — both valid
  'brydlon': 'prompt; punctual',  // was "punctual (mutated)" — remove "(mutated)" note
  'potiau': 'pots',             // was "water; pot" — potiau = pots
  'flaenau': 'tips; fronts',    // was "ballerina; tip" — blaenau = tips/fronts; remove ballerina
  'darganfu': 'discovered',     // was "discovered, yesterday" — remove "yesterday"

  // Fix properly escaped entries with backslash issues
  // These are entries that had garbled text with backslashes
};

// ── Remove entries that should stay as-is (Google was wrong, or dict was fine) ──
// ragfyr: December is correct, not spring
// reslo: to wrestle is fine
// cymraes: Welshwoman is correct
// rhiannon: proper name
// eifl: mountain name
// gallan: keep as-is since both translations are off
delete FIXES['ragfyr'];
delete FIXES['cymraes'];
delete FIXES['rhiannon'];
delete FIXES['eifl'];
delete FIXES['gallan'];
delete FIXES['reslo'];
delete FIXES['of']; // "of" is complex, leave it

// ── Apply ──
let src = fs.readFileSync(DICT_PATH, 'utf8');
let applied = 0;
let failed = 0;

for (const [key, newEn] of Object.entries(FIXES)) {
  // Find the entry in the source
  const keyEsc = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Match pattern: 'key': { en: 'old value'   or   "key": { en: 'old value'
  const pattern = new RegExp(
    `(['"])${keyEsc}\\1:\\s*\\{\\s*en:\\s*'([^']*(?:\\\\.[^']*)*)'`
  );

  const match = src.match(pattern);
  if (!match) {
    // Try with escaped quotes in the en value
    const pattern2 = new RegExp(
      `(['"])${keyEsc}\\1:\\s*\\{[^}]*?en:\\s*'([^']*)'`
    );
    const match2 = src.match(pattern2);
    if (!match2) {
      failed++;
      console.log(`  NOT FOUND: '${key}'`);
      continue;
    }
  }

  const before = src;
  const newEnEscaped = newEn.replace(/'/g, "\\'");

  src = src.replace(pattern, (m, quote, oldEn) => {
    return m.replace(`en: '${oldEn}'`, `en: '${newEnEscaped}'`);
  });

  if (src !== before) {
    applied++;
  } else {
    // Try alternate pattern with more flexible matching
    const altPattern = new RegExp(
      `(['"])${keyEsc}\\1:\\s*\\{([^}]*?)en:\\s*'[^']*'`
    );
    src = src.replace(altPattern, (m, quote, prefix) => {
      const oldMatch = m.match(/en:\s*'[^']*'/);
      if (oldMatch) {
        return m.replace(oldMatch[0], `en: '${newEnEscaped}'`);
      }
      return m;
    });
    if (src !== before) {
      applied++;
    } else {
      failed++;
      console.log(`  MATCH FAILED: '${key}'`);
    }
  }
}

console.log(`\nApplied: ${applied}, Failed: ${failed}, Total fixes: ${Object.keys(FIXES).length}`);

fs.writeFileSync(DICT_PATH, src, 'utf8');
console.log('Written to', DICT_PATH);
console.log(`\nWELSH COMPLETE — ${applied} fixes`);
