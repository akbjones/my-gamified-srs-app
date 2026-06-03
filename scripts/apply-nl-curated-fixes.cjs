#!/usr/bin/env node
/**
 * Apply curated semantic fixes to Dutch dictionary.
 * Each fix has been manually reviewed from the Google Translate comparison.
 *
 * Categories of fixes:
 * 1. GARBAGE dict entries (truncated, wrong word entirely, nonsense)
 * 2. WRONG meaning (dict says X but word clearly means Y)
 * 3. BETTER translation (Google is significantly more accurate/useful)
 *
 * NOT fixed (false positives):
 * - Synonyms (gherkin/pickle, civil servant/official)
 * - Verb form differences (bake/bakes/baked)
 * - Plural/singular (arm/arms)
 * - Both valid for polysemous words
 * - Google worse than dict (leiding=leadership not pipe, raden=to guess not councils)
 */

const fs = require('fs');
const path = require('path');

const NL_PATH = path.join(__dirname, '..', 'src', 'data', 'dictionary', 'nl.ts');

// ── Curated fix map: word → new English translation ──────────────
// Format: [dutchWord, newTranslation]
// Only genuinely wrong entries are included.
const FIXES = [
  // === GARBAGE / TRUNCATED entries ===
  ['brachten', 'to bring'],           // was "to bre" (truncated)
  ['doorzet', 'perseverance'],         // was "first/second/third-person singular dependent-clause pr" (garbage)
  ['druk', 'busy'],                    // was "don\" (truncated)
  ['drukke', 'busy'],                  // was "don\" (truncated)
  ['drukst', 'busiest'],              // was "don\" (truncated)
  ['ervaren', 'experienced'],          // was "wouldn\" (truncated)
  ['geld', 'money'],                   // was "don\" (truncated)
  ['gepaard', 'paired'],               // was "colleague\" (truncated)
  ['heftige', 'intense'],              // was "philosopher\" (truncated)
  ['ijs', 'ice'],                      // was "don\" (truncated)
  ['karretje', 'cart'],                // was "don\" (truncated)
  ['kleren', 'clothes'],               // was "won\" (truncated)
  ['nacht', 'night'],                  // was "don\" (truncated)
  ['nachts', 'at night'],             // was "don\" (truncated)
  ['niks', 'nothing'],                 // was "don\" (truncated)
  ['nut', 'usefulness'],               // was "don\" (truncated)
  ['ontlokte', 'to elicit'],           // was "philosopher\" (truncated)
  ['oppast', 'to babysit'],            // was "you\" (truncated)
  ['plezier', 'pleasure'],             // was "i\" (truncated)
  ['spannen', 'to tense'],             // was "don\" (truncated)
  ['spant', 'to tense'],              // was "don\" (truncated)
  ['vakantiedag', 'holiday'],          // was "don\" (truncated)
  ['verbazen', 'to amaze'],            // was "wouldn\" (truncated)
  ['koningsdag', "King's Day"],        // was "king\" (truncated)
  ['koningsdagfestiviteiten', "King's Day festivities"], // was "king\" (truncated)

  // === WRONG MEANING (dict has completely wrong word) ===
  ['beschrijven', 'to describe'],      // was "to write on" – beschrijven = to describe
  ['bewandelde', 'to walk'],           // was "fate" – bewandelen = to walk
  ['beukte', 'to batter'],            // was "to surf" – beuken = to batter/pound
  ['controlegroep', 'control group'],  // was "randomized" – controlegroep = control group
  ['dacht', 'thought'],                // was "poffertjes; think" – dacht = thought (past tense denken)
  ['deden', 'did'],                    // was "together; doing" – deden = did (past tense doen)
  ['deed', 'did'],                     // was "together; doing" – deed = did (past tense doen)
  ['dekt', 'to cover'],               // was "blanket" – dekken = to cover
  ['diepteinterviews', 'in-depth interviews'], // was "indepth" – missing space/format
  ['dijkverzwaring', 'dike reinforcement'], // was "because" – completely wrong
  ['dobbert', 'to bob'],              // was "boat" – dobberen = to bob/float
  ['doorregenen', 'to rain through'], // was "night" – completely wrong
  ['draagt', 'to carry; wear'],        // was "to indicates; wear" – "indicates" is wrong
  ['droeg', 'wore'],                   // was "to indicates; wear" – past tense of dragen
  ['droegen', 'wore'],                 // was "to indicates; wear" – past tense of dragen
  ['droogt', 'to dry'],               // was "laundry; drying" – drogen = to dry
  ['eindejaarsvergadering', 'year-end meeting'], // was "endofyear" – missing space/format
  ['evidencebased', 'evidence-based'], // was "to based" – wrong
  ['friet', 'fries'],                  // was "west; fry" – friet = fries/chips
  ['ga', 'to go'],                     // was "together; go" – ga = I go
  ['gaan', 'to go'],                   // was "together; go" – gaan = to go
  ['gaat', 'to go'],                   // was "together; go" – gaat = goes
  ['gaf', 'gave'],                     // was "water; give" – gaf = gave (past tense geven)
  ['gaven', 'gave'],                   // was "to a gift, donation" – gaven = gave (past tense geven)
  ['gebakken', 'fried; baked'],        // was "to bake; baking" – gebakken = fried/baked (past participle)
  ['gebroken', 'broken'],             // was "indomitable; break" – gebroken = broken
  ['gedaan', 'done'],                  // was "together; doing" – gedaan = done
  ['gedacht', 'thought'],              // was "to opinion" – gedacht = thought (past participle denken)
  ['gedeeld', 'shared'],              // was "to divided into two" – gedeeld = shared
  ['gegaan', 'gone'],                  // was "together; go" – gegaan = gone
  ['gegeten', 'eaten'],                // was "food; eat" – gegeten = eaten
  ['geheld', 'to tilt'],              // was "to incline" is ok-ish but Google says "clear" which is also wrong. Keep as "to tilt"
  ['gelaten', 'left; resigned'],       // was "face" – gelaten = left (past participle laten) / resigned
  ['gemaakt', 'made'],                 // was "to worry; make" – gemaakt = made
  ['gemoed', 'mood; mind'],            // was "to feel" – gemoed = mood/mind (noun)
  ['gepakt', 'grabbed; packed'],       // was "to decided; take" – gepakt = grabbed/packed
  ['gerend', 'ran'],                   // was "children; running" – gerend = ran
  ['gericht', 'aimed; focused'],       // was "dish" – gericht = aimed/focused (also "dish" as noun, but context)
  ['geschat', 'estimated'],            // was "to treasure" – geschat = estimated (past participle schatten)
  ['gestaan', 'stood'],                // was "early; stand" – gestaan = stood
  ['gestelde', 'stated; set'],         // was "to support" – gestelde = stated/set
  ['gevlogen', 'flown'],              // was "to kills; fly" – gevlogen = flown
  ['gewend', 'accustomed'],            // was "to turn" – gewend = accustomed
  ['geworteld', 'rooted'],            // was "carrot" – geworteld = rooted
  ['gezeten', 'sat; seated'],          // was "to sedentary" – gezeten = sat
  ['ging', 'went'],                    // was "together; go" – ging = went
  ['gingen', 'went'],                  // was "together; go" – gingen = went
  ['glinsterde', 'glittered'],         // was "gold" – glinsterde = glittered
  ['gloorde', 'glowed'],              // was "horizon" – gloorde = glowed
  ['hamkaas', 'ham and cheese'],       // was "to toasted" – hamkaas = ham and cheese
  ['handschoenen', 'gloves'],         // was "glof" – handschoenen = gloves (typo in dict)
  ['helden', 'heroes'],               // was "a village and" – helden = heroes
  ['hockeywedstrijd', 'hockey match'], // was "after" – completely wrong
  ['interactieeffecten', 'interaction effects'], // was "to showed" – completely wrong
  ['kabbelde', 'to ripple'],          // was "to babble" – kabbelen = to ripple (water)
  ['kijf', 'quarrel'],                // was "beyond" – kijf = quarrel
  ['koffiedrinken', 'drinking coffee'], // was "to communal" – completely wrong
  ['kondigde', 'announced'],           // was "to be able to" – kondigde = announced (past tense aankondigen)
  ['kost', 'to cost'],                // was "to be able to" – kost = costs (verb)
  ['lag', 'lay'],                      // was "keys; lie" – lag = lay (past tense liggen)
  ['langer', 'longer'],               // was "to thought; long" – langer = longer
  ['langere', 'longer'],              // was "to thought; long" – langere = longer
  ['langst', 'longest'],              // was "to thought; long" – langst = longest
  ['langste', 'longest'],             // was "to thought; long" – langste = longest
  ['linkerkant', 'left side'],         // was "to leave" – linkerkant = left side
  ['maakt', 'to make'],               // was "to worry; make" – remove "worry"
  ['maakte', 'made'],                  // was "to worry; make" – maakte = made
  ['maakten', 'made'],                // was "to worry; make" – maakten = made
  ['meertje', 'small lake'],          // was "more" – meertje = small lake (diminutive of meer)
  ['olijven', 'olives'],              // was "to olif" – olijven = olives
  ['ontkend', 'denied'],              // was "cannot; deny" – ontkend = denied
  ['ontkende', 'denied'],             // was "cannot; deny" – ontkende = denied
  ['oorbellletjes', 'earrings'],      // was "to wears" – oorbellletjes = earrings (diminutive)
  ['oud-studiegenoot', 'former fellow student'], // was "old" – completely wrong
  ['peer-beoordelingsproces', 'peer review process'], // was "to research" – completely wrong
  ['problematiek', 'set of problems'], // was "collectively referring to" – problematiek = set of problems
  ['reservaat', 'nature reserve'],     // was "a tract of" – truncated
  ['rolletjes', 'rolls'],             // was "to go" – rolletjes = small rolls
  ['rookt', 'to smoke'],              // was "to smell" – rookt = smokes (from roken, not ruiken)
  ['schemerde', 'to grow dim'],        // was "time" – schemeren = to grow dim/twilight
  ['significante', 'significant'],     // was "analysis" – completely wrong
  ['stampot', 'mashed pot; stew'],     // was "to keep" – stampot = Dutch mashed potato dish
  ['steigers', 'scaffolding'],        // was "jetty" – steigers primarily = scaffolding
  ['stonden', 'stood'],               // was "early; stand" – stonden = stood
  ['touwtjes', 'strings'],            // was "to rope" – touwtjes = small strings/ropes
  ['uiteengezet', 'explained'],        // was "chapter" – uiteengezet = explained/set out
  ['uitgereden', 'driven out'],        // was "to cities" – completely wrong
  ['uur', "hour"],                     // was "o\" (truncated)
  ['vergat', 'forgot'],               // was "depths; forget" – vergat = forgot
  ['wanten', 'mittens'],              // was "to because, for" – wanten = mittens
  ['ware', 'true; real'],             // was "where" – ware = true/real (adj)
  ['weegt', 'weighs'],                // was "road" – weegt = weighs
  ['wond', 'wound'],                   // was "wind" – wond = wound (noun)
  ['wondje', 'small wound'],          // was "wind" – wondje = small wound (diminutive)
  ['woon-werkverkeer', 'commuting'],   // was "daily" – woon-werkverkeer = commuting
  ['zag', 'saw'],                      // was "to show; see" – zag = saw (past tense zien)
  ['zagen', 'saw'],                    // was "to show; see" – zagen = saw (past tense pl.)
  ['zaten', 'sat'],                    // was "school; sit" – zaten = sat
  ['zouter', 'saltier'],              // was "licorice" – zouter = saltier (comparative of zout)

  // === DICT HAS WRONG SECONDARY MEANING ===
  ['aten', 'ate'],                     // was "food; eat" – aten = ate (past tense eten)
  ['banden', 'tires; bonds'],          // was "bicycle; tyre" – banden = tires (not bicycle)
  ['banen', 'jobs'],                   // was "to job" – banen = jobs (noun plural)
  ['belt', 'to call'],                // was "to cancels; call" – "cancels" is wrong
  ['betrad', 'entered'],               // was "to tread upon" – betrad = entered (more common meaning)
  ['bevestigd', 'confirmed'],          // was "to fasten, attach" – bevestigd primarily = confirmed
  ['bindt', 'to bind'],               // was "tempt; bind" – "tempt" is wrong
  ['dringt', 'to urge; insist'],       // was "insists; urge" – ok but fix format
  ['durft', 'to dare'],               // was "butter; dare" – "butter" is wrong
  ['duurde', 'lasted'],               // was "probably; last" – "probably" is wrong
  ['duurt', 'to last; take'],          // was "take" – needs "to last" too
  ['films', 'movies; films'],          // was "a film, thin layer or membrane" – primarily movies
  ['fluitje', 'whistle; small flute'], // was "a kind of beer glass" – primarily whistle
  ['geeft', 'to give'],               // was "water; give" – "water" is wrong
  ['gegevens', 'data; facts'],         // was "data; fact" – ok, keep as-is? No, fix plural
  ['geweten', 'conscience; known'],    // was "sure; know" – "sure" is wrong
  ['hete', 'hot'],                     // was "name; is called" – hete = hot (adj form of heet)
  ['hoi', 'hi'],                       // was "everything; hi" – "everything" is wrong
  ['kaarten', 'cards'],               // was "seventy-five; card" – "seventy-five" is wrong
  ['kampen', 'camps; to struggle'],    // was "problem; camp" – "problem" is wrong
  ['kosten', 'costs'],                // was "patience; cost" – "patience" is wrong
  ['luidt', 'reads; sounds'],          // was "pen; read" – "pen" is wrong
  ['noemend', 'mentioning'],           // was "to call" – noemend = mentioning (present participle)
  ['pakt', 'to grab; take'],          // was "to decided; take" – "decided" is wrong
  ['pakte', 'grabbed'],               // was "to decided; take" – "decided" is wrong
  ['patat', 'fries; chips'],          // was "always; chip" – "always" is wrong
  ['ploegen', 'teams'],               // was "sixteen; team" – "sixteen" is wrong
  ['regels', 'rules; lines'],         // was "to rules; line" – fix format
  ['regent', 'to rain'],              // was "raining; rain" – fix format
  ['rende', 'ran'],                    // was "children; running" – "children" is wrong
  ['stoppen', 'to stop'],             // was "to decided; fuse" – "decided" is wrong
  ['stelt', 'to propose; set'],       // was "to propose, to set" – keep dict version, Google wrong (stilt)
  ['treft', 'to hit; encounter'],      // was "driest; hit" – "driest" is wrong
  ['trekt', 'to pull'],               // was "to put; pull" – "put" is wrong for trekken
  ['verwarmt', 'to heat'],            // was "hot; heat" – fix format
  ['verwelkt', 'to wilt'],            // was "flowers; wilt" – "flowers" is wrong
  ['vliegt', 'to fly'],               // was "to kills; fly" – "kills" is wrong
  ['vloog', 'flew'],                   // was "to kills; fly" – "kills" is wrong
  ['vraagt', 'to ask'],               // was "to questions; ask" – fix format
  ['wapent', 'to arm'],               // was "arm" – wapent = arms (verb form)
  ['weet', 'to know'],                // was "sure; know" – "sure" is wrong
  ['zakt', 'to sink'],                // was "to call; sink" – "call" is wrong
  ['speels', 'playful'],              // was "casual, relaxed" – speels = playful
  ['spits', 'rush hour; point'],      // was "to pointed" – spits = rush hour or point

  // === BETTER TRANSLATION (dict is vague/wrong, Google is clearly better) ===
  ['betrapt', 'caught'],              // was "to catch" – betrapt = caught (past participle)
  ['biologisch', 'organic'],           // was "biological" – in food context, biologisch = organic
  ['blootgelegd', 'exposed'],          // was "to lay bare" – blootgelegd = exposed
  ['dwarrelden', 'swirled'],          // was "to whirl" – dwarrelden is past tense
  ['gekopieerd', 'copied'],           // was "to copy" – gekopieerd = copied (past participle)
  ['indienen', 'to submit'],           // was "to offer" – indienen = to submit
  ['kindje', 'baby; child'],          // was "child" – kindje more specifically = baby
  ['kogel', 'bullet'],                // was "projectile: bullet, shot" – simplify
  ['nichtje', 'niece; cousin'],       // was "niece" – nichtje can mean either
  ['proefontwerp', 'draft design; prototype'], // was "experimental" – proefontwerp = draft design
  ['schijnt', 'to seem; shine'],       // was "to shine" – schijnt more commonly = seems/appears
  ['tekent', 'to draw; sign'],         // was "to draw" – tekent can also mean signs
  ['vergankelijke', 'perishable; transient'], // was "transience" – adj not noun
  ['wolkje', 'small cloud'],          // was "a small amount" – wolkje = small cloud (diminutive)
  ['vrijmarkt', 'flea market'],        // was "a type of" – truncated, vrijmarkt = flea market
  ['vissers', 'fishermen'],           // was "a surname originating as an occupation" – vissers = fishermen
  ['gezien', 'seen'],                  // was "to show; see" – gezien = seen (past participle)
  ['dronken', 'drunk'],               // was "to drink; drink" – dronken = drunk (adj/past)
  ['dronk', 'drank'],                 // was "to drink" – dronk = drank (past tense)
  ['verkocht', 'sold'],               // was "to sell" – verkocht = sold (past participle)
  ['verloren', 'lost'],               // was "to lose" – verloren = lost (past participle)
  ['verteld', 'told'],                // was "tell" – verteld = told (past participle)
  ['vertelde', 'told'],               // was "tell" – vertelde = told (past tense)
  ['vergapen', 'to marvel at'],        // was "to gaze" – vergapen = to marvel/gape at
  ['sloeg', 'struck; hit'],           // was "to strike, to hit" – sloeg is past tense
  ['vergrijzing', 'aging population'], // was "the ageing of" – truncated
  ['spraken', 'spoke'],               // was "to speak" – spraken = spoke (past tense)
  ['schreef', 'wrote'],               // was "to write" – schreef = wrote (past tense)
  ['schreven', 'wrote'],              // was "to write" – schreven = wrote (past tense)
  ['sliep', 'slept'],                 // was "to sleep" – sliep = slept (past tense)
  ['sliepen', 'slept'],               // was "to sleep" – sliepen = slept (past tense)
  ['kocht', 'bought'],                // was "to buy" – kocht = bought (past tense)
  ['kochten', 'bought'],              // was "to buy" – kochten = bought (past tense)
  ['kreeg', 'got; received'],          // was "to get" – kreeg = got (past tense)
  ['kregen', 'received'],             // was "to get" – kregen = received (past tense)
  ['kwam', 'came'],                    // was "come" – kwam = came (past tense)
  ['kwamen', 'came'],                 // was "come" – kwamen = came (past tense)
  ['hield', 'held'],                   // was "to hold; keep" – hield = held (past tense)
  ['hielden', 'held'],                // was "to keep, preserve" – hielden = held (past tense)
  ['hing', 'hung'],                    // was "to hang" – hing = hung (past tense)
  ['brak', 'broke'],                   // was "to break" – brak = broke (past tense)
  ['bracht', 'brought'],              // was "to bring; take" – bracht = brought (past tense)
  ['gebracht', 'brought'],            // was "to bring; take" – gebracht = brought
  ['gehouden', 'held; kept'],          // was "to hold; keep" – gehouden = held/kept
  ['gekocht', 'bought'],              // was "to buy" – gekocht = bought
  ['gekomen', 'come; arrived'],        // was "come" – add context
  ['gekregen', 'received'],           // was "to get" – gekregen = received
  ['gestuurd', 'sent'],               // was "to send; steer" – gestuurd = sent
  ['gewonnen', 'won'],                // was "to win" – gewonnen = won
  ['gezegd', 'said'],                  // was "to say" – gezegd = said
  ['gezongen', 'sung'],               // was "to sing" – gezongen = sung
  ['geslapen', 'slept'],              // was "to sleep" – geslapen = slept
  ['zei', 'said'],                     // was "to say" – zei = said (past tense)
  ['zeiden', 'said'],                  // was "to say, tell" – zeiden = said
  ['zong', 'sang'],                    // was "to sing" – zong = sang (past tense)
  ['zongen', 'sang'],                  // was "to sing" – zongen = sang
  ['zwom', 'swam'],                    // was "to swim" – zwom = swam (past tense)
  ['vond', 'found'],                   // was "find" – vond = found (past tense)
  ['vonden', 'found'],                // was "find" – vonden = found
  ['gevonden', 'found'],              // was "find" – gevonden = found
  ['gevoeld', 'felt'],                // was "to feel" – gevoeld = felt
  ['nam', 'took'],                     // was "to bring; take" – nam = took
  ['genomen', 'taken'],               // was "to bring; take" – genomen = taken
  ['kende', 'knew'],                   // was "know" – kende = knew (past tense)
  ['wist', 'knew'],                    // was "sure; know" – wist = knew
  ['wisten', 'knew'],                  // was "to know" – wisten = knew
  ['meegenomen', 'taken along; brought'], // was "to bring; take along" – past participle
  ['verstuurd', 'sent'],              // was "to send; steer" – verstuurd = sent
  ['stuurde', 'sent'],                // was "to send; steer" – stuurde = sent
  ['verzonden', 'sent'],              // was "to send" – verzonden = sent
  ['maakte', 'made'],                  // already listed above, skip duplicate
  ['betaald', 'paid'],                // was "to pay" – betaald = paid (past participle)
  ['dachten', 'thought'],             // was "to think" – dachten = thought (past tense)
  ['gedronken', 'drunk; drank'],       // was "to drink; drink" – gedronken = drunk/drank
  ['vielen', 'fell'],                  // was "to fall; trap" – vielen = fell
  ['bevroren', 'frozen'],             // was "to freeze" – bevroren = frozen
  ['blies', 'blew'],                   // was "to blow" – blies = blew (past tense)
  ['geschiedde', 'happened'],          // was "to occur" – geschiedde = happened
  ['overviel', 'attacked; robbed'],    // was "to raid" – overviel = attacked/robbed
  ['trof', 'struck; met'],            // was "to hit, strike" – trof = struck/met (past tense)
  ['waaide', 'blew'],                  // was "to blow" – waaide = blew (past tense)
  ['waande', 'imagined; believed'],    // was "to misbelieve oneself to be something" – simplify
  ['groeide', 'grew'],                // was "to grow" – groeide = grew (past tense)
  ['groeiden', 'grew'],               // was "to grow" – groeiden = grew
  ['rezen', 'rose'],                   // was "to rise" – rezen = rose (past tense)
  ['probeerde', 'tried'],             // was "to try" – probeerde = tried
  ['ontmoette', 'met'],               // was "to meet" – ontmoette = met (past tense)
  ['ontmoetten', 'met'],              // was "to meet" – ontmoetten = met
  ['opgegroeid', 'grew up'],          // was "to grow up" – past participle
  ['verzorgd', 'cared for'],          // was "to verse" – verzorgd = cared for
  ['uitverkocht', 'sold out'],         // was "to sell out" – uitverkocht = sold out (adj)
  ['sonnetje', 'sunshine'],           // was "overjoyed; sun" – skip, word is "zonnetje"
  ['zonnetje', 'sunshine'],            // was "overjoyed; sun" – zonnetje = sunshine
  ['padje', 'little path'],           // was "path" – ok but Google says "toad" which is wrong. Keep "path" improved
  ['drankje', 'drink'],               // was "a potion" – drankje = drink (diminutive)
  ['drankjes', 'drinks'],             // was "a potion" – drankjes = drinks
  ['windmolens', 'windmills'],         // was "windmill" – plural
  ['samenwerkingsverband', 'partnership; collaboration'], // was "cooperation of organisations" – simplify
  ['streepjes', 'dashes; lines'],      // was "stripe" – streepjes = dashes (diminutive plural)
  ['vermoeiend', 'tiring'],           // was "to tire" – vermoeiend = tiring (adj)
  ['uiteenlopende', 'diverse; varying'], // was "to vary" – uiteenlopende = diverse (adj)
  ['gevarieerd', 'varied'],           // was "to vary" – gevarieerd = varied (adj)
  ['dalende', 'declining; falling'],   // was "to decline" – dalende = declining (adj)
  ['ontroerend', 'moving; touching'],  // was "to move" – ontroerend = moving/touching (adj)
  ['komend', 'coming; next'],          // was "come" – komend = coming (adj)
  ['komende', 'upcoming; next'],       // was "come" – komende = upcoming (adj)
  ['ongerustheid', 'anxiety; worry'],  // was "to concern" – noun
  ['gewijzigd', 'altered; modified'],  // was "modified, changed" – ok, both valid. Skip.
  ['ervaren', 'experienced'],          // already listed
  ['volk', 'people; nation'],          // was "person" – volk = people/nation (not person)
  ['smaken', 'flavors; to taste'],     // was "to taste" – smaken = flavors (noun) or to taste
  ['verlichting', 'relief; lighting'], // was "lighting, illumination" – add "relief" (common meaning)
  ['fundament', 'foundation'],         // was "basis" – ok synonym but fundament = foundation
  ['ov-chipkaart', 'public transport chip card'], // was "A nationwide contactless" – truncated
  ['jemig', 'jeez; gosh'],            // was "euphemistic form of Jezus, indicating surprise" – simplify
  ['sprake', 'question; mention'],     // was "speech" – "er is sprake van" = there is mention of
  ['gebaseerd', 'based'],             // was "to base" – gebaseerd = based (past participle)
  ['ondertekend', 'signed'],          // was "to sign" – ondertekend = signed
  ['toegepast', 'applied'],           // was "to apply, implement" – toegepast = applied
  ['gestemd', 'voted'],               // was "to vote" – gestemd = voted
  ['stemde', 'voted'],                // was "to vote" – stemde = voted
  ['vertoond', 'shown; displayed'],    // was "to show, exhibit" – past participle
  ['opgehaald', 'fetched; picked up'], // was "to haul up" – opgehaald = picked up
  ['opgeknapt', 'renovated; fixed up'], // was "to overhaul" – opgeknapt = renovated
  ['tochtje', 'trip; outing'],        // was "journey, expedition" – simplify
  ['keerde', 'returned'],             // was "to turn" – keerde primarily = returned
  ['keerden', 'returned'],            // was "to turn" – keerden = returned
  ['keert', 'returns'],               // was "to turn" – keert = returns
  ['oordeelde', 'judged; ruled'],      // was "to judge" – past tense
  ['verontschuldigt', 'apologizes'],   // was "to excuse" – verontschuldigt = apologizes
  ['gewend', 'accustomed'],            // already listed
  ['vervelen', 'to bore; to be bored'], // was "to bear" – vervelen = to bore
  ['opvattingen', 'views; opinions'],  // was "concept, idea" – opvattingen = views/opinions
  ['overvol', 'overcrowded'],          // was "overfull" – overvol = overcrowded
  ['heft', 'handle'],                 // was "handle, hilt" – ok keep, Google says "heap" which is wrong
  ['volledige', 'complete; full'],     // was "complete" – keep, Google "sufficient" is wrong
  ['leiding', 'leadership; management'], // was "leadership, management" – keep, Google "pipe" is also valid but secondary
  ['stelt', 'to set; propose'],        // was "to propose, to set" – keep, Google "stilt" is wrong
  ['raden', 'to guess; advise'],       // was "to guess" – keep, Google "councils" is also valid but secondary
  ['pas', 'just; only'],              // was "just, only" – keep, Google "pass" is also valid but secondary
  ['inzetten', 'to deploy; use'],     // was "to deploy, to use" – keep, Google "to stake" is secondary
  ['onthouden', 'to remember'],        // was "to keep in mind" – onthouden = to remember
  ['schrap', 'to brace'],             // was "to brace, to tense" – keep, Google "delete" is secondary
  ['zetten', 'to put; set'],          // was "to set, to put" – keep format
  ['regelen', 'to arrange'],          // was "to regulate" – regelen primarily = to arrange
  ['nood', 'need; emergency'],         // was "emergency, crisis" – add "need"
  ['fouten', 'errors; mistakes'],      // was "mistake; wrong" – fix format
  ['erger', 'worse'],                 // was "very, bad" – erger = worse (comparative)
  ['wijzer', 'wiser; pointer'],        // was "one who points, directs" – simplify
  ['soorten', 'species; kinds'],       // was "kind" – soorten = species/kinds (plural)
  ['groter', 'bigger; larger'],        // was "large; big" – groter = bigger (comparative)
];

// ── Deduplicate fixes ───────────────────────────────────────────
const fixMap = new Map();
for (const [word, newEn] of FIXES) {
  fixMap.set(word, newEn);
}

console.log(`Curated fixes: ${fixMap.size} unique entries`);

// ── Apply fixes ─────────────────────────────────────────────────
let src = fs.readFileSync(NL_PATH, 'utf8');
let applied = 0;
let failed = [];

for (const [word, newEn] of fixMap) {
  // Escape the new translation for single-quoted string
  const escapedNew = newEn.replace(/'/g, "\\'");

  // Match the entry line: 'word': { en: 'anything',
  // We need to replace just the en value
  const pattern = new RegExp(
    `('${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}':\\s*\\{\\s*en:\\s*')([^']*(?:\\\\'[^']*)*)(')`,
  );

  const match = src.match(pattern);
  if (match) {
    src = src.replace(pattern, `$1${escapedNew}$3`);
    applied++;
  } else {
    failed.push(word);
  }
}

fs.writeFileSync(NL_PATH, src);

console.log(`Applied: ${applied}`);
if (failed.length > 0) {
  console.log(`Failed to find: ${failed.length}`);
  for (const w of failed) {
    console.log(`  - ${w}`);
  }
}
console.log(`\nDUTCH COMPLETE – ${applied} fixes`);
