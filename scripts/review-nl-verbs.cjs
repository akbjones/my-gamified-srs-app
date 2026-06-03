#!/usr/bin/env node
/**
 * COMPLETE Dutch dictionary review script.
 * Checks EVERY SINGLE ENTRY for:
 *   A: "to " on non-verbs
 *   B: Verb form issues (past tense, gerund after "to ")
 *   C: Missing "to " on verbs
 *   D: Garbage semicolons (first part is noise, second is real meaning)
 *   E: Wrong meaning (Dutch knowledge)
 *   F: Backslash-garbled entries
 *   G: Truncated translations
 *   H: Wrong POS
 *   I: Wrong lemma
 *
 * Writes fixes to scripts/output/nl-full-verb-review.json
 * Then applies them directly to nl.ts.
 */

const fs = require('fs');
const path = require('path');

const DICT_PATH = path.join(__dirname, '..', 'src', 'data', 'dictionary', 'nl.ts');
const OUTPUT_PATH = path.join(__dirname, 'output', 'nl-full-verb-review.json');

const src = fs.readFileSync(DICT_PATH, 'utf8');

// ─── Parse all dictionary entries ───────────────────────────────────────────
const entries = [];
const lineRegex = /^\s*['"]([^'"]+)['"]\s*:\s*\{([^}]+)\}/gm;

function parseEntry(key, body) {
  const en = body.match(/en:\s*'((?:[^'\\]|\\.)*)'/)?.[1]?.replace(/\\'/g, "'") || '';
  const pos = body.match(/pos:\s*'((?:[^'\\]|\\.)*)'/)?.[1] || '';
  const lemma = body.match(/lemma:\s*'((?:[^'\\]|\\.)*)'/)?.[1] || undefined;
  const ipa = body.match(/ipa:\s*'((?:[^'\\]|\\.)*)'/)?.[1] || '';
  return { key, en, pos, lemma, ipa };
}

let m;
while ((m = lineRegex.exec(src)) !== null) {
  entries.push(parseEntry(m[1], m[2]));
}

console.log(`Total entries parsed: ${entries.length}`);

// Build entry lookup
const entryMap = {};
for (const e of entries) {
  entryMap[e.key] = e;
}

// ─── KNOWN ENGLISH VERBS ────────────────────────────────────────────────────
const KNOWN_ENGLISH_VERBS = new Set([
  'be','have','do','say','go','get','make','know','think','take','see','come',
  'want','look','use','find','give','tell','work','call','try','ask','need',
  'feel','become','leave','put','mean','keep','let','begin','seem','help',
  'show','hear','play','run','move','live','believe','bring','happen','write',
  'provide','sit','stand','lose','pay','meet','include','continue','set',
  'learn','change','lead','understand','watch','follow','stop','create',
  'speak','read','allow','add','spend','grow','open','walk','win','offer',
  'remember','love','consider','appear','buy','wait','serve','die','send',
  'expect','build','stay','fall','cut','reach','kill','remain','suggest',
  'raise','pass','sell','require','report','decide','pull','develop',
  'eat','drink','cook','wash','clean','drive','ride','fly','swim','dance',
  'sing','fight','sleep','wake','wear','carry','hold','throw','catch',
  'break','fix','repair','teach','study','practice','train','travel',
  'visit','return','arrive','start','finish','complete','prepare','plan',
  'choose','pick','collect','gather','share','divide','join','connect',
  'compare','measure','count','check','test','prove','improve','increase',
  'decrease','reduce','solve','achieve','succeed','fail','accept','refuse',
  'agree','disagree','support','oppose','protect','save','waste','borrow',
  'lend','earn','invest','produce','deliver','order','arrange','organize',
  'manage','control','operate','maintain','replace','remove','destroy',
  'store','paint','draw','design','record','publish','translate','discuss',
  'argue','complain','apologize','forgive','praise','blame','search',
  'discover','invent','explore','investigate','observe','analyze','predict',
  'announce','declare','confirm','deny','admit','reveal','explain','describe',
  'define','identify','recognize','distinguish','combine','mix','pour',
  'fill','empty','lift','push','pull','stretch','twist','bend','turn',
  'roll','shake','swing','spin','slide','climb','jump','float','sink',
  'flow','spray','spread','attach','stick','tie','cover','expose','dig',
  'bury','plant','harvest','feed','breed','hunt','bite','scratch','boil',
  'fry','bake','roast','grill','steam','melt','freeze','dry','soak',
  'scrub','polish','crush','grind','chew','swallow','cough','breathe',
  'whisper','shout','scream','cry','laugh','smile','frown','nod','wave',
  'point','grab','drop','kick','punch','hug','kiss','smell','taste',
  'touch','rub','press','click','type','scroll','tap','drag','edit',
  'delete','copy','print','scan','upload','download','install','update',
  'shut','lock','unlock','sign','register','cancel','celebrate','worship',
  'pray','fulfill','respect','honor','decorate','distribute','donate',
  'migrate','settle','conquer','rule','govern','elect','protest','reform',
  'talk','listen','erode','comb','chat','coach','iron','fan','reward',
  'budget','channel','comfort','commission','compound','conflict','contest',
  'contrast','counsel','counter','credit','cycle','debate','default',
  'demand','detail','discount','draft','drill','echo','engineer','envy',
  'estimate','excuse','experiment','factor','fashion','favor','feature',
  'figure','file','film','focus','forecast','fork','fuel','function',
  'gesture','glance','glimpse','gossip','grace','guarantee','guess','guide',
  'hammer','handle','harm','harvest','head','heap','hint','hook','host',
  'humor','hurdle','image','impact','import','influence','interest','issue',
  'journey','judge','label','lack','land','last','layer','lecture','level',
  'license','limit','link','list','load','loan','lobby','log','lower',
  'lumber','market','mask','master','match','matter','measure','mentor',
  'merit','mirror','model','monitor','motion','mount','murder','murmur',
  'nail','name','note','notice','nurse','object','outline','pace','package',
  'paddle','page','pair','panel','parade','pardon','parent','park','part',
  'partner','pattern','peel','phrase','picture','pile','pilot','pin',
  'pioneer','pitch','place','pledge','plot','plug','pocket','point',
  'portion','position','post','power','premiere','pressure','price',
  'pride','process','profile','profit','program','progress','project',
  'promise','prompt','proof','question','queue','quote','race','rain',
  'rally','range','rank','rate','ration','reason','reference','refund',
  'reign','relay','release','remedy','rent','research','resort','result',
  'review','rifle','ring','rival','roam','rocket','romance','root','rope',
  'route','ruin','sacrifice','saddle','sail','sample','sanction','scale',
  'scar','scope','score','screen','seal','season','section','seed',
  'sentence','sequence','shade','shadow','shame','shape','shelter','shift',
  'ship','shop','shoulder','shovel','shower','sidestep','sight','signal',
  'silence','skin','slave','slice','slow','smile','smoke','snack',
  'snap','snow','socket','soldier','sound','source','space','spark',
  'spell','spiral','splash','split','sponsor','spot','spray','stage',
  'stake','star','station','steam','steer','stem','step','stock',
  'storm','strain','strap','stream','stress','structure','stuff','stump',
  'subject','summit','supply','surface','surprise','survey','suspect',
  'sway','swear','sweep','swell','switch','table','tackle','tag','tail',
  'target','tax','team','tender','term','thread','thunder','ticket',
  'tide','timber','time','title','toast','tool','top','total','tour',
  'tower','trace','track','trade','trail','treasure','trend','trick',
  'trigger','trim','triumph','trouble','trumpet','trust','tunnel','tutor',
  'unite','upgrade','urge','vacuum','value','venture','version',
  'view','voice','volunteer','voyage','wage','wager','wander','warehouse',
  'warrant','weather','welcome','whistle','witness','wonder','worship',
  'wound','wreck','wrestle','yield','zone','zoom',
  'accept','achieve','acquire','adapt','adjust','admire','advise','afford',
  'apologize','appreciate','approach','approve','assemble','assist',
  'assume','attach','attempt','attract','balance','behave','belong','benefit',
  'blame','block','boast','borrow','bother','bounce','breathe','broadcast',
  'browse','calculate','capture','challenge','charge','cheer',
  'circle','classify','collapse','command','commit','communicate',
  'compete','compose','concentrate','conclude','conduct','confess','confuse',
  'consist','construct','consult','consume','contain','contribute','convert',
  'convince','cooperate','coordinate','correct','correspond','crash',
  'crawl','criticize','cultivate','cure','customize','damage','deceive',
  'decline','dedicate','defeat','delay','demonstrate','depart',
  'depend','deposit','derive','deserve','desire','detect','determine','devote',
  'diagnose','differ','digest','direct','disappear','disappoint','discard',
  'discipline','disconnect','discourage','discriminate','disguise','dismiss',
  'display','dispose','dispute','dissolve','distract','disturb',
  'double','drip','dump','educate','elaborate','eliminate',
  'embrace','emerge','emit','emphasize','employ','enable','encounter',
  'encourage','enforce','engage','enhance','enrich','enroll',
  'ensure','entertain','equip','erase','escape','establish',
  'evaluate','evolve','examine','exceed','exchange','excite','exclude',
  'execute','exercise','exhibit','exist','expand','experience',
  'exploit','export','express','extend','extract',
  'facilitate','faint','fancy','filter','finance','flash',
  'flatten','flourish','fold','forbid','formulate','forward','foster','found','frame','frighten',
  'furnish','gain','generate','glow','graduate','grasp',
  'greet','grieve','guard','heal','hesitate','highlight','hire','hum','hurry','ignore',
  'illustrate','imagine','immerse','implement','impose','impress',
  'incorporate','indicate','induce','inform','inherit','initiate',
  'inject','innovate','inquire','insert','inspect','inspire',
  'institute','instruct','insult','integrate','intend','interact','interfere',
  'interpret','interrupt','intervene','introduce','invade',
  'investigate','invite','involve','isolate','jam','justify','knock',
  'launch','lay','lean','linger',
  'locate','long','manufacture','march','mark','mature','maximize','meditate','memorize','mention','merge',
  'minimize','mislead','moderate','modify','motivate',
  'multiply','narrow','navigate','neglect','negotiate',
  'nominate','normalize','notify','nourish','obey',
  'obligate','obtain','occupy','offend','offset','omit',
  'opt','orient','originate','overcome',
  'overlook','overtake','overwhelm','owe','own','pack','panic',
  'participate','pause','penetrate','perceive','perform','permit','persist',
  'persuade','photograph','plunge',
  'ponder','portray','pose','possess','postpone','prefer',
  'prescribe','preserve','preside','presume','pretend','prevail','prevent',
  'proceed','proclaim','prohibit','promote','pronounce','propose','prosecute',
  'prosper','provoke','purchase','pursue','qualify',
  'react','realize','rebel','recall','reckon','recommend',
  'reconcile','recover','recruit','recycle','redirect','refer','reflect',
  'regain','regard','regulate','reinforce','reject',
  'relate','relax','relieve','rely','remark','remind',
  'render','renew','renovate','repeat','represent',
  'reproduce','request','rescue','resemble','reserve','reside','resign',
  'resist','resolve','restore','restrict','retain','retreat',
  'retrieve','reverse','revise','revolve','ripen',
  'risk','rotate','rush',
  'satisfy','scatter','schedule',
  'secure','seize','select','sense','separate','settle','sew','shed',
  'shine','shock','shrink','simplify','simulate',
  'situate','skip','slam','slap','slip','smash','socialize',
  'soften','sort','specialize','specify','speed','spill',
  'spoil','squeeze','stabilize','stain','stare',
  'starve','stimulate','stir','strengthen',
  'strike','strip','strive','struggle',
  'submit','subscribe','substitute','sue','summarize',
  'summon','supplement','suppose','suppress','surpass','surrender',
  'surround','survive','suspend','sustain','swap',
  'sympathize','target',
  'tend','terminate','terrify','testify','threaten','thrive','tighten',
  'tip','tolerate','transform','transmit','transport',
  'trap','tumble',
  'undergo','underline','undermine','undertake','unfold',
  'unveil','utilize','validate','vanish','vary',
  'verify','violate','warn','weaken','weave',
  'weigh','widen','withdraw','withstand',
  'worsen','wrap','yell',
  'nest','hope','comment','avoid','narrow',
  'bath','bathe','egg','base',
  'receive','enjoy','regret','retire','surf','dwell','stall','form',
  'worry','apply','argue',
  'attend','beg','bless','bloom','bore',
  'burden','carve','claim','clarify',
  'confront','consent',
  'dare','defend',
  'depict','describe',
  'discharge','dominate','drift',
  'drown','elect',
  'force',
  'hope','nest',
  'recommend','advise','offer','announce','approach',
  'wonder','wander','exercise','skate','ski','cycle',
  'float','sail','row','paddle','hike','stroll',
  'browse','tidy','dust','polish','scrub','mop','sweep',
  'iron','fold','hang','dry','rinse','soak','spray','wipe',
  'knit','sew','weave','embroider','darn','stitch','crochet',
  'whisper','mumble','stammer','stutter','mutter','groan','sigh',
  'gasp','pant','snore','yawn','hiccup','belch','sneeze',
  'blink','wink','squint','glare','gaze','peer','peek',
  'dawn','dusk','rain','snow','hail','drizzle',
  'thunder','lighten','brighten','darken','gleam','shimmer',
  'glitter','sparkle','flicker','glow','blaze','smolder',
  'graduate','enroll','register','apply','submit','qualify',
]);

// ─── Bad verb forms after "to " ──────────────────────────────────────────────
function isBadVerbForm(word) {
  const irregular = ['went','feeds','eats','makes','gets','reads','stays',
    'comes','goes','takes','gives','puts','runs','says','sees','sits',
    'lets','sets','does','has','was','were','had','did','woken','stood',
    'slept','spoke','wrote','drove','knew','grew','drew','fell','felt',
    'found','gave','got','held','kept','left','lost','made','meant',
    'met','paid','ran','rang','rose','sat','saw','sent','set','shook',
    'shot','shut','sold','spent','struck','swam','swore','swept','swung',
    'taught','tore','threw','told','took','understood','woke','won','wore',
    'laughed','wanted','started','lived','moved','talked','walked','worked',
    'played','asked','called','tried','looked','needed','turned','learned',
    'stopped','changed','watched','happened','opened','reached','listened',
    'loved','appeared','tanned','crowded','accepted','approved','appreciated',
    'announced','arrested','catalogued','confessed','confided','controlled',
    'forbidden','seen','known','chosen','gotten','spoken','written','broken',
    'driven','eaten','fallen','given','gone','hidden','risen','shaken',
    'stolen','sworn','taken','torn','worn','woven','frozen',
    'caused','affected','designated','floated','silenced','delivered',
    'resigned','realized','connected','presented','interested'];
  if (irregular.includes(word)) return true;
  if (/ing$/.test(word) && word.length > 5 && !['bring','ring','sing','string','spring','swing','sting','cling','fling','sling','wring','thing'].includes(word)) return true;
  return false;
}

// ============================================================
// MANUAL FIXES MAP (Dutch knowledge-based corrections)
// ============================================================
const FIXES = {};

function fix(key, en, pos, lemma, issueType, note) {
  FIXES[key] = { en, pos, lemma: lemma === undefined ? undefined : lemma, issueType, note };
}

// ── A. Non-verbs wrongly tagged as verb (with garbled "to " translations) ──

// --- Nouns wrongly tagged as verb ---
fix('aanbesteding', 'tender, public tender', 'n', undefined, 'wrong-pos', 'noun not verb');
fix('aanleiding', 'cause, reason', 'n', undefined, 'wrong-pos', 'noun not verb');
fix('aansluiting', 'connection', 'n', undefined, 'wrong-pos', 'noun not verb');
fix('aanwijzingen', 'instructions, directions', 'n', 'aanwijzing', 'wrong-pos', 'noun not verb');
fix('abstractieniveau', 'level of abstraction', 'n', undefined, 'wrong-pos', 'noun not verb');
fix('accenten', 'accents', 'n', 'accent', 'wrong-pos', 'noun not verb');
fix('adem', 'breath', 'n', undefined, 'wrong-pos', 'noun not verb');
fix('adviezen', 'advice, tips', 'n', 'advies', 'wrong-pos', 'noun plural');
fix('afdelingen', 'departments', 'n', 'afdeling', 'wrong-pos', 'noun not verb');
fix('afloop', 'outcome, end', 'n', undefined, 'wrong-pos', 'noun not verb');
fix('afstandsbediening', 'remote control', 'n', undefined, 'wrong-pos', 'noun not adj');
fix('afval', 'waste, garbage', 'n', undefined, 'wrong-pos', 'noun not verb');
fix('afvalverwerkingsbedrijf', 'waste processing plant', 'n', undefined, 'wrong-pos', 'noun not verb');
fix('afwachting', 'anticipation, waiting', 'n', undefined, 'wrong-pos', 'noun not verb');
fix('akkoord', 'agreement, okay', 'n', undefined, 'wrong-pos', 'noun/adj not verb');
fix('alternatieven', 'alternatives', 'n', 'alternatief', 'wrong-pos', 'noun not verb');
fix('appel', 'apple', 'n', undefined, 'wrong-pos', 'noun not verb');
fix('appels', 'apples', 'n', 'appel', 'wrong-pos', 'noun not verb');
fix('appeltje', 'little apple', 'n', 'appel', 'wrong-pos', 'noun not verb');
fix('appelbomen', 'apple trees', 'n', 'appelboom', 'wrong-pos', 'noun not verb');
fix('arbeidsomstandigheden', 'working conditions', 'n', undefined, 'wrong-pos', 'noun not verb');
fix('arbeidsvoorwaarden', 'employment conditions', 'n', undefined, 'wrong-pos', 'noun not verb');
fix('afspraken', 'appointments, agreements', 'n', 'afspraak', 'wrong-pos', 'noun not verb');

// --- Adjectives wrongly tagged as verb ---
fix('aandachtig', 'attentive', 'adj', undefined, 'wrong-pos', 'adj not verb');
fix('aanstaande', 'upcoming, expectant', 'adj', undefined, 'wrong-pos', 'adj not verb');
fix('acht', 'eight', 'num', undefined, 'wrong-pos', 'number not verb');
fix('onlosmakelijk', 'inseparable, inextricable', 'adj', undefined, 'wrong-pos', 'adj not verb');

// --- Nouns wrongly tagged as adj ---
fix('aanwezig', 'present', 'adj', undefined, 'wrong-pos', 'adj not noun');
fix('ambitieus', 'ambitious', 'adj', undefined, 'wrong-pos', 'adj not noun');
fix('ambtenaar', 'civil servant', 'n', undefined, 'wrong-pos', 'noun not adj');

// --- Other POS fixes ---
fix('achteraan', 'at the back', 'adv', undefined, 'wrong-pos', 'adv not noun');
fix('achteraf', 'afterward', 'adv', undefined, 'wrong-pos', 'adv not noun');
fix('achternaam', 'surname, last name', 'n', undefined, 'wrong-meaning', 'noun not adj');
fix('allemaal', 'all, everyone', 'pron', undefined, 'wrong-pos', 'pron not noun');
fix('allen', 'all', 'pron', undefined, 'wrong-pos', 'pron not verb');
fix('allengs', 'gradually', 'adv', undefined, 'wrong-pos', 'adv not noun');
fix('allerminst', 'not at all', 'adv', undefined, 'wrong-pos', 'adv not noun');
fix('alom', 'everywhere', 'adv', undefined, 'wrong-pos', 'adv not noun');
fix('alsnog', 'after all, still', 'adv', undefined, 'wrong-pos', 'adv not noun');
fix('alsof', 'as if', 'conj', undefined, 'wrong-pos', 'conj not verb');
fix('althans', 'at least', 'adv', undefined, 'wrong-pos', 'adv not noun');
fix('alzo', 'so, consequently', 'adv', undefined, 'wrong-pos', 'adv not noun');
fix('amper', 'barely', 'adv', undefined, 'wrong-pos', 'adv not noun');
fix('anderhalf', 'one and a half', 'num', undefined, 'wrong-pos', 'num not noun');
fix('anderhalve', 'one and a half', 'num', 'anderhalf', 'wrong-pos', 'num not noun');
fix('zoveel', 'so much', 'adv', undefined, 'wrong-pos', 'adv not noun');
fix('zover', 'as far', 'adv', undefined, 'wrong-pos', 'adv not noun');

// ── Garbled nouns with verb-like first sense ──
fix('alpen', 'Alps', 'n', undefined, 'wrong-pos', 'proper noun not verb');
fix('antwerpen', 'Antwerp', 'n', undefined, 'wrong-pos', 'proper noun not verb');
fix('bot', 'bone', 'n', undefined, 'wrong-meaning', 'noun: bone');
fix('deur', 'door', 'n', undefined, 'wrong-meaning', 'noun: door');
fix('deuren', 'doors', 'n', 'deur', 'wrong-meaning', 'noun: doors');
fix('hand', 'hand', 'n', undefined, 'wrong-meaning', 'noun not verb');
fix('handen', 'hands', 'n', 'hand', 'wrong-meaning', 'noun not verb');
fix('handje', 'little hand', 'n', 'hand', 'wrong-meaning', 'noun not verb');
fix('heen', 'away, there', 'adv', undefined, 'wrong-pos', 'adv not verb');
fix('kwestie', 'issue, matter', 'n', undefined, 'wrong-meaning', 'noun not verb');
fix('leiding', 'leadership, management', 'n', undefined, 'wrong-meaning', 'noun not verb');
fix('men', 'one, people', 'pron', undefined, 'wrong-pos', 'pron not verb');
fix('spoor', 'track, trace', 'n', undefined, 'wrong-pos', 'noun not verb');
fix('trein', 'train', 'n', undefined, 'wrong-pos', 'noun not verb');
fix('treinen', 'trains', 'n', 'trein', 'wrong-pos', 'noun not verb');
fix('treinkaartje', 'train ticket', 'n', undefined, 'wrong-pos', 'noun not verb');
fix('stofzuiger', 'vacuum cleaner', 'n', undefined, 'wrong-pos', 'noun not verb');
fix('zuiden', 'south', 'n', undefined, 'wrong-pos', 'noun not verb');
fix('zwembad', 'swimming pool', 'n', undefined, 'wrong-pos', 'noun not verb');
fix('zwemles', 'swimming lesson', 'n', undefined, 'wrong-pos', 'noun not verb');
fix('zwemvaardigheden', 'swimming skills', 'n', undefined, 'wrong-pos', 'noun not verb');
fix('hapje', 'snack, bite', 'n', undefined, 'wrong-meaning', 'noun not verb');
fix('woningen', 'dwellings, homes', 'n', 'woning', 'wrong-pos', 'noun not verb');
fix('benadering', 'approach, approximation', 'n', undefined, 'wrong-pos', 'noun not verb');
fix('benaderingen', 'approaches', 'n', 'benadering', 'wrong-pos', 'noun not verb');

// ── B. Verb translations that are garbled/wrong ──

// "to " + wrong English word (the Dutch word has a garbled first sense from Google Translate)
fix('aanbreekt', 'dawns, breaks', 'v', 'aanbreken', 'wrong-meaning', 'garbled "spring"');
fix('aandacht', 'attention', 'n', undefined, 'wrong-pos', 'noun not adj');
fix('aannemer', 'contractor', 'n', undefined, 'ok', 'already correct');
fix('aanpak', 'approach', 'n', undefined, 'wrong-pos', 'noun not verb');
fix('aanschouwd', 'beheld, witnessed', 'v', 'aanschouwen', 'wrong-meaning', 'missing infinitive "to"');
fix('aanstaat', 'is on, pleases', 'v', 'aanstaan', 'wrong-meaning', 'garbled "vacuum"');
fix('aanvaardt', 'to accept', 'v', 'aanvaarden', 'ok', 'ok');
fix('aanvoelt', 'to feel, to sense', 'v', 'aanvoelen', 'ok', 'ok');
fix('aantrekken', 'to attract, to put on', 'v', undefined, 'wrong-meaning', 'garbled "bed"');
fix('aanleggen', 'to install, to construct', 'v', undefined, 'wrong-meaning', 'garbled "soon"');
fix('aangelegd', 'installed, constructed', 'v', 'aanleggen', 'wrong-meaning', 'garbled "soon"');
fix('aap', 'monkey', 'n', undefined, 'wrong-meaning', 'garbled "now"');
fix('afkijken', 'to copy, to cheat', 'v', undefined, 'wrong-meaning', 'garbled "although"');
fix('afkoelen', 'to cool down', 'v', undefined, 'wrong-meaning', 'garbled "to off"');
fix('afkeer', 'aversion, dislike', 'n', undefined, 'ok', 'ok');
fix('afkomst', 'origin, descent', 'n', undefined, 'wrong-meaning', 'garbled "proud"');
fix('aflopen', 'to end, to expire', 'v', undefined, 'wrong-meaning', 'garbled "end" – needs "to "');
fix('afgesloten', 'closed', 'adj', undefined, 'wrong-pos', 'adj not verb');
fix('afgerond', 'to complete, to round off', 'v', 'afronden', 'ok', 'ok');
fix('afrondt', 'to round off, to complete', 'v', 'afronden', 'wrong-meaning', 'garbled "says"');
fix('afgestemd', 'tuned, coordinated', 'adj', undefined, 'wrong-meaning', 'garbled "academic"');
fix('afgezien', 'apart from', 'adv', undefined, 'wrong-pos', 'adv not noun');
fix('amuseren', 'to amuse', 'v', undefined, 'wrong-meaning', 'garbled "wonderful"');
fix('analyseert', 'to analyze', 'v', 'analyseren', 'wrong-meaning', 'truncated "analyz"');

// ── Wrong/garbled semicolon entries ──
fix('aangekomen', 'arrived', 'adj', 'aankomen', 'wrong-meaning', 'garbled "to train; arrived"');
fix('aangenomen', 'accepted, assumed', 'adj', undefined, 'wrong-meaning', 'garbled "law"');
fix('aangepast', 'adapted, adjusted', 'adj', undefined, 'wrong-meaning', 'adj not verb');
fix('aangetekende', 'registered', 'adj', undefined, 'ok', 'ok');
fix('aangifte', 'declaration, report', 'n', undefined, 'wrong-meaning', 'garbled "neighbor"');
fix('aanhoorden', 'listened to', 'v', 'aanhoren', 'wrong-meaning', 'garbled "tale"');
fix('aangenaam', 'pleasant, nice', 'adj', undefined, 'wrong-meaning', 'garbled "nice meet"');
fix('aangenamer', 'more pleasant', 'adj', 'aangenaam', 'wrong-meaning', 'garbled "nice meet"');
fix('aangezien', 'since, because', 'conj', undefined, 'wrong-meaning', 'garbled "sobriety"');
fix('aanzien', 'prestige, respect', 'n', undefined, 'wrong-meaning', 'garbled "tolerance"');
fix('aanwezig', 'present', 'adj', undefined, 'wrong-pos', 'adj not noun');
fix('aanwezigen', 'attendees', 'n', 'aanwezige', 'wrong-meaning', 'garbled "chairman"');
fix('aardige', 'nice', 'adj', 'aardig', 'ok', 'ok');
fix('afgenomen', 'decreased, taken', 'v', 'afnemen', 'wrong-meaning', 'garbled "survey"');
fix('afgelopen', 'past, last', 'adj', undefined, 'wrong-meaning', 'garbled "changed"');
fix('afdwong', 'to enforce', 'v', 'afdwingen', 'wrong-meaning', 'garbled "resigned"');
fix('andermans', "someone else's", 'pron', undefined, 'wrong-meaning', 'garbled "doesn\'t"');
fix('annuleerde', 'to cancel', 'v', 'annuleren', 'wrong-lemma', 'wrong lemma annuleerden');
fix('antwoordde', 'answered', 'v', 'antwoorden', 'wrong-pos', 'verb not noun');
fix('aanbod', 'offer', 'n', undefined, 'wrong-pos', 'noun not verb');

// --- Nonsense/truncated ---
fix('aalsmeer', 'Aalsmeer', 'n', undefined, 'wrong-meaning', 'place name not ?');
fix('a2', 'A2 motorway', 'n', undefined, 'wrong-meaning', 'proper noun');
fix('a10', 'A10 motorway', 'n', undefined, 'ok', 'ok');
fix('appeltje-eitje', 'piece of cake', 'n', undefined, 'wrong-meaning', 'truncated "a"');
fix('appeltjeeitje', 'piece of cake', 'n', undefined, 'wrong-meaning', 'truncated "piece"');

// ── Fix: "to floated", "to silent", "to swim pool" etc. ──
fix('zweefde', 'to float', 'v', 'zweven', 'wrong-meaning', '"to floated" past tense');
fix('zweeg', 'to be silent', 'v', 'zwijgen', 'wrong-meaning', '"to silent" not a verb form');
fix('stofzuigt', 'to vacuum', 'v', 'stofzuigen', 'ok', 'ok');
fix('aangericht', 'to cause', 'v', 'aanrichten', 'wrong-meaning', '"to caused" past tense');
fix('aangetast', 'to affect', 'v', 'aantasten', 'wrong-meaning', '"to affected" past tense');
fix('aangewezen', 'to designate', 'v', 'aanwijzen', 'wrong-meaning', '"to designated" past tense');
fix('afgegeven', 'to deliver, to issue', 'v', 'afgeven', 'wrong-meaning', '"to delivered" past tense');
fix('bezorgd', 'worried', 'adj', undefined, 'wrong-meaning', 'garbled "delivered"');
fix('berustte', 'to rest, to resign oneself', 'v', 'berusten', 'wrong-meaning', 'garbled "resigned"');
fix('gewijzigd', 'modified, changed', 'adj', undefined, 'wrong-meaning', '"changed" as adj');
fix('geaccepteerd', 'accepted', 'adj', undefined, 'wrong-meaning', 'adj not verb');
fix('gespeeld', 'played', 'adj', 'spelen', 'wrong-meaning', 'garbled "read"');
fix('realiseerde', 'to realize', 'v', 'realiseren', 'wrong-meaning', 'garbled "train"');
fix('naderende', 'approaching', 'adj', 'naderend', 'wrong-meaning', '"to approache" typo');

// ── Fix: Verbs missing "to " ──
fix('vroeg', 'early', 'adj', undefined, 'wrong-pos', 'adj: early, not a verb');
fix('vroege', 'early', 'adj', 'vroeg', 'wrong-pos', 'adj not verb');
fix('draai', 'to turn, to play', 'v', 'draaien', 'missing-to', 'missing "to "');
fix('zette', 'to set, to put', 'v', 'zetten', 'ok', 'ok already has "place; make"');
fix('zetten', 'to set, to put', 'v', undefined, 'ok', 'ok');
fix('sneeuwen', 'to snow', 'v', undefined, 'ok', 'verb ok');

// ── Fix garbled semicolons where first part is noise ──
fix('bekeken', 'to review, to look at', 'v', 'bekijken', 'ok', 'ok');
fix('bedekt', 'covered', 'adj', undefined, 'wrong-meaning', 'garbled "snow; covered"');
fix('hetgeen', 'which, what', 'pron', undefined, 'wrong-pos', 'pron not verb');
fix('opladen', 'to charge, to upload', 'v', undefined, 'wrong-meaning', 'garbled "top; upload"');
fix('bijten', 'to bite', 'v', undefined, 'ok', 'ok');
fix('gebeten', 'bitten', 'adj', 'bijten', 'wrong-meaning', 'past part → adj');
fix('zure', 'sour', 'adj', 'zuur', 'wrong-meaning', 'garbled "to bite; sour"');
fix('slaan', 'to strike, to hit', 'v', undefined, 'wrong-meaning', 'garbled "turn; strike"');
fix('slaat', 'to strike, to hit', 'v', 'slaan', 'wrong-meaning', 'garbled');
fix('sloeg', 'to strike, to hit', 'v', 'slaan', 'wrong-meaning', 'garbled');
fix('verheugen', 'to look forward to, to rejoice', 'v', undefined, 'wrong-meaning', 'garbled "forward"');
fix('verheug', 'to look forward to', 'v', 'verheugen', 'wrong-meaning', 'garbled');
fix('vries', 'to freeze', 'v', 'vriezen', 'wrong-meaning', 'garbled "last; freeze"');
fix('schrijven', 'to write', 'v', undefined, 'wrong-meaning', 'garbled "sign; write"');
fix('schrijf', 'to write', 'v', 'schrijven', 'wrong-meaning', 'garbled');
fix('schrijft', 'to write', 'v', 'schrijven', 'wrong-meaning', 'garbled');
fix('schreef', 'to write', 'v', 'schrijven', 'wrong-meaning', 'garbled');
fix('geschreven', 'written', 'adj', 'schrijven', 'wrong-meaning', 'garbled');
fix('inschrijven', 'to register, to enroll', 'v', undefined, 'wrong-meaning', 'garbled');
fix('ingeschreven', 'registered', 'adj', 'inschrijven', 'wrong-meaning', 'garbled');
fix('verbonden', 'connected', 'adj', undefined, 'wrong-meaning', 'garbled "matter; connected"');
fix('vertrekken', 'to depart, to leave', 'v', undefined, 'wrong-meaning', 'garbled "train"');
fix('vertrekt', 'to depart, to leave', 'v', 'vertrekken', 'wrong-meaning', 'garbled');
fix('vertrok', 'to depart, to leave', 'v', 'vertrekken', 'wrong-meaning', 'garbled');
fix('vertrokken', 'departed, left', 'adj', 'vertrekken', 'wrong-meaning', 'garbled');
fix('spelen', 'to play', 'v', undefined, 'wrong-meaning', 'garbled "read; play"');
fix('speelt', 'to play', 'v', 'spelen', 'wrong-meaning', 'garbled');
fix('speelde', 'to play', 'v', 'spelen', 'wrong-meaning', 'garbled');
fix('speelden', 'to play', 'v', 'spelen', 'wrong-meaning', 'garbled');
fix('trainen', 'to train', 'v', undefined, 'wrong-meaning', 'garbled');
fix('traint', 'to train', 'v', 'trainen', 'wrong-meaning', 'garbled');
fix('lezen', 'to read', 'v', undefined, 'ok', 'ok');
fix('lees', 'to read', 'v', 'lezen', 'ok', 'ok');
fix('leest', 'to read', 'v', 'lezen', 'ok', 'ok');
fix('las', 'to read', 'v', 'lezen', 'ok', 'ok');
fix('lazen', 'to read', 'v', 'lezen', 'ok', 'ok');
fix('gelezen', 'to read', 'v', 'lezen', 'ok', 'ok');
fix('doorgelezen', 'to read through', 'v', 'doorlezen', 'ok', 'ok');
fix('voorlas', 'to read aloud', 'v', 'voorlezen', 'ok', 'ok');
fix('voorleesavonden', 'reading evenings', 'n', undefined, 'wrong-pos', 'noun not verb');
fix('naderde', 'to approach', 'v', 'naderen', 'ok', 'ok');
fix('nadere', 'further, closer', 'adj', undefined, 'wrong-pos', 'adj not verb');
fix('naderen', 'to approach', 'v', undefined, 'ok', 'ok');
fix('nadert', 'to approach', 'v', 'naderen', 'ok', 'ok');
fix('inzetten', 'to deploy, to use', 'v', undefined, 'wrong-meaning', 'garbled "wants; stake"');
fix('sort', 'to throw, to dump', 'v', 'storten', 'wrong-meaning', 'garbled "throws; dump"');
fix('stort', 'to throw, to dump', 'v', 'storten', 'wrong-meaning', 'garbled');
fix('zwemmen', 'to swim', 'v', undefined, 'wrong-meaning', 'OK but garbled semicolons');
fix('zwemt', 'to swim', 'v', 'zwemmen', 'wrong-meaning', 'OK');
fix('zwom', 'to swim', 'v', 'zwemmen', 'wrong-meaning', 'OK');

// ── More garbled translations found in dictionary scan ──
fix('aanbreekt', 'to dawn, to break', 'v', 'aanbreken', 'wrong-pos', 'not adj');
fix('aardbeien', 'strawberries', 'n', 'aardbei', 'ok', 'ok');
fix('achthonderdvijftig', 'eight hundred and fifty', 'num', undefined, 'wrong-meaning', 'incomplete');
fix('aarde', 'earth, soil', 'n', undefined, 'ok', 'ok');
fix('abstractieniveau', 'level of abstraction', 'n', undefined, 'wrong-pos', 'noun not verb');
fix('allerbeste', 'very best', 'adj', undefined, 'wrong-pos', 'adj not num');
fix('allergootste', 'very biggest', 'adj', undefined, 'wrong-meaning', 'likely typo for allergrootste');
fix('app', 'app', 'n', undefined, 'wrong-pos', 'noun not adv');

// ── More wrong POS fixes ──
fix('aardappelballetjes', 'potato balls', 'n', undefined, 'ok', 'ok');
fix('achteraan', 'at the back', 'adv', undefined, 'wrong-pos', 'adv not noun');
fix('achteraf', 'afterward', 'adv', undefined, 'wrong-pos', 'adv not noun');
fix('achttiende', 'eighteenth', 'num', undefined, 'wrong-pos', 'num not noun');
fix('adellijke', 'noble', 'adj', 'adellijk', 'ok', 'ok');
fix('zwart', 'black', 'adj', undefined, 'wrong-pos', 'adj not noun');
fix('zwaarste', 'heaviest', 'adj', 'zwaar', 'wrong-pos', 'adj not noun');

// ── Fix place names and proper nouns tagged as verbs ──
fix('zuid-frankrijk', 'southern France', 'n', undefined, 'wrong-meaning', 'garbled "every"');
fix('zuidfrankrijk', 'southern France', 'n', undefined, 'wrong-meaning', 'garbled "france"');

// ── Round 2: Fix remaining bad verb forms and truncated translations ──

// Bad verb forms (garbled semicolons where first part is noise)
fix('begin', 'to begin, to start', 'v', 'beginnen', 'wrong-meaning', 'garbled "beginning"');
fix('behandeling', 'treatment', 'n', undefined, 'wrong-pos', 'noun not verb');
fix('bekommert', 'to worry, to concern oneself', 'v', 'bekommeren', 'wrong-meaning', 'garbled "takes"');
fix('beslist', 'definitely, certainly', 'adv', undefined, 'wrong-pos', 'adv not verb');
fix('betreft', 'to concern, regarding', 'v', 'betreffen', 'wrong-meaning', 'garbled "planning"');
fix('bevinding', 'finding, discovery', 'n', undefined, 'wrong-pos', 'noun not verb');
fix('bewaard', 'preserved, kept', 'adj', 'bewaren', 'wrong-meaning', 'garbled "kept"');
fix('bleef', 'to stay, to remain', 'v', 'blijven', 'wrong-meaning', 'garbled "makes"');
fix('bleken', 'to turn out, to appear', 'v', 'blijken', 'wrong-meaning', 'garbled "turned"');
fix('bleven', 'to stay, to remain', 'v', 'blijven', 'wrong-meaning', 'garbled "makes"');
fix('blijft', 'to stay, to remain', 'v', 'blijven', 'wrong-meaning', 'garbled "makes"');
fix('blijven', 'to stay, to remain', 'v', undefined, 'wrong-meaning', 'garbled "makes"');
fix('bonen', 'beans', 'n', 'boon', 'wrong-pos', 'noun not verb');
fix('controle', 'control, inspection', 'n', undefined, 'wrong-pos', 'noun not verb');
fix('financiering', 'financing, funding', 'n', undefined, 'wrong-pos', 'noun not verb');
fix('gearresteerd', 'arrested', 'adj', 'arresteren', 'wrong-meaning', 'past participle adj');
fix('gepland', 'planned', 'adj', 'plannen', 'wrong-meaning', 'garbled "planning"');
fix('gestolen', 'stolen', 'adj', 'stelen', 'wrong-meaning', 'past participle adj');
fix('gevallen', 'fallen; cases', 'n', 'geval', 'wrong-meaning', 'garbled "fell"');
fix('gewild', 'wanted, desired', 'adj', 'willen', 'wrong-meaning', 'past participle adj');
fix('haringseizoen', 'herring season', 'n', undefined, 'wrong-pos', 'noun not verb');
fix('heft', 'handle, hilt', 'n', undefined, 'wrong-meaning', 'garbled "taken; heap"');
fix('herhaling', 'repetition, repeat', 'n', undefined, 'wrong-pos', 'noun not verb');
fix('inspant', 'to exert, to make effort', 'v', 'inspannen', 'wrong-meaning', 'garbled "makes"');
fix('klopt', 'to knock; is correct', 'v', 'kloppen', 'wrong-meaning', 'garbled "feeling"');
fix('koe', 'cow', 'n', undefined, 'wrong-pos', 'noun not verb');
fix('koeien', 'cows', 'n', 'koe', 'wrong-pos', 'noun not verb');
fix('links', 'left, on the left', 'adj', undefined, 'wrong-pos', 'adj not verb');
fix('loopafstand', 'walking distance', 'n', undefined, 'wrong-pos', 'noun not verb');
fix('maas', 'mesh; Meuse', 'n', undefined, 'wrong-pos', 'noun not verb');
fix('muren', 'walls', 'n', 'muur', 'wrong-meaning', 'garbled "sent"');
fix('muur', 'wall', 'n', undefined, 'wrong-meaning', 'garbled "sent"');
fix('neerkomt', 'to come down to', 'v', 'neerkomen', 'wrong-meaning', 'garbled "comes"');
fix('noorderzon', 'northern sun', 'n', undefined, 'wrong-meaning', 'garbled "left"');
fix('nul', 'zero', 'num', undefined, 'wrong-pos', 'num not verb');
fix('ontmoet', 'to meet', 'v', 'ontmoeten', 'wrong-meaning', 'garbled "met"');
fix('oordeelde', 'to judge', 'v', 'oordelen', 'wrong-meaning', 'garbled "judging"');
fix('oordelen', 'to judge', 'v', undefined, 'wrong-meaning', 'garbled "judging"');
fix('opende', 'to open', 'v', 'openen', 'wrong-meaning', 'garbled "opened"');
fix('plannen', 'to plan; plans', 'v', undefined, 'wrong-meaning', 'garbled "planning"');
fix('porties', 'servings, portions', 'n', 'portie', 'wrong-pos', 'noun not verb');
fix('rekest', 'petition', 'n', undefined, 'wrong-pos', 'noun not verb');
fix('rozen', 'roses', 'n', 'roos', 'wrong-pos', 'noun not verb');
fix('schrap', 'to brace, to tense', 'v', 'schrappen', 'wrong-meaning', 'garbled');
fix('spek', 'bacon', 'n', undefined, 'wrong-pos', 'noun not verb');
fix('sporten', 'to exercise, to play sport', 'v', undefined, 'wrong-meaning', 'garbled "exercising"');
fix('stelt', 'to propose, to set', 'v', 'stellen', 'wrong-meaning', 'garbled "makes; stilt"');
fix('uitsmijter', 'bouncer; fried egg sandwich', 'n', undefined, 'wrong-pos', 'noun not verb');
fix('verboden', 'forbidden, prohibited', 'adj', 'verbieden', 'wrong-meaning', 'adj not verb');
fix('verscheen', 'to appear', 'v', 'verschijnen', 'wrong-meaning', 'garbled "appeared"');
fix('vriest', 'to freeze', 'v', 'vriezen', 'wrong-meaning', 'garbled "freezing"');
fix('warmpjes', 'warmly, comfortably', 'adv', undefined, 'wrong-meaning', 'garbled "sitting"');
fix('wedstrijd', 'match, competition', 'n', undefined, 'wrong-pos', 'noun not verb');
fix('zin', 'sentence; desire', 'n', undefined, 'wrong-pos', 'noun not verb');
fix('zoek', 'lost, missing', 'adj', undefined, 'wrong-pos', 'adj not verb');

// Truncated translations - proper values
fix('beethoven', 'Beethoven', 'n', undefined, 'truncated', 'proper name');
fix('boersma', 'Boersma', 'n', undefined, 'truncated', 'surname');
fix('cbs', 'CBS (Statistics Netherlands)', 'n', undefined, 'truncated', 'abbreviation');
fix('dataset', 'dataset', 'n', undefined, 'truncated', 'needs value');
fix('dien', 'that; serve', 'pron', undefined, 'truncated', 'demonstrative');
fix('diverse', 'various, diverse', 'adj', undefined, 'truncated', 'adj');
fix('echo', 'echo', 'n', undefined, 'truncated', 'noun');
fix('lactose', 'lactose', 'n', undefined, 'truncated', 'noun');
fix('multivariate', 'multivariate', 'adj', undefined, 'truncated', 'adj');
fix('ovchipkaart', 'OV-chipkaart (travel card)', 'n', undefined, 'truncated', 'noun');
fix('parkandride', 'park and ride', 'n', undefined, 'truncated', 'noun');
fix('relevant', 'relevant', 'adj', undefined, 'truncated', 'adj');
fix('sorry', 'sorry', 'interj', undefined, 'truncated', 'interjection');
fix('wateren', 'waters', 'n', 'water', 'truncated', 'noun');

// Short pronouns/particles that are correct but flagged - just skip them
// hij, ik, me, mij, mijn, of, we, wij are fine as-is

// ============================================================================
// NOW: SYSTEMATIC SCAN OF ALL ENTRIES
// ============================================================================
const fixes = [];
const stats = { toOnNonVerb: 0, verbFormIssues: 0, missingTo: 0, garbageSemi: 0,
  wrongMeaning: 0, backslash: 0, truncated: 0, wrongPos: 0, wrongLemma: 0, total: 0 };

for (const entry of entries) {
  const { key, en, pos, lemma } = entry;

  // Skip entries in the IRREGULAR_MAP section (they don't have en/pos)
  if (!en && !pos) continue;

  // Check if there's a manual fix
  if (FIXES[key]) {
    const f = FIXES[key];
    // Only add if the fix actually changes something
    if (f.en !== en || f.pos !== pos || (f.lemma !== undefined && f.lemma !== lemma)) {
      fixes.push({
        key,
        old: { en, pos, lemma },
        new: { en: f.en, pos: f.pos, lemma: f.lemma },
        issue: f.issueType,
        note: f.note
      });
      stats.total++;
      if (f.issueType === 'wrong-pos') stats.wrongPos++;
      else if (f.issueType === 'wrong-meaning') stats.wrongMeaning++;
      else if (f.issueType === 'missing-to') stats.missingTo++;
      else if (f.issueType === 'wrong-lemma') stats.wrongLemma++;
      else if (f.issueType === 'to-prefix-on-non-verb') stats.toOnNonVerb++;
      else if (f.issueType === 'garbage-translation') stats.garbageSemi++;
    }
    continue;
  }

  // ─── AUTO-DETECT: "to " on entries tagged as non-verb ───
  if (en.startsWith('to ') && pos !== 'v') {
    // This shouldn't happen - but flag
    stats.toOnNonVerb++;
    stats.total++;
    fixes.push({
      key,
      old: { en, pos, lemma },
      new: { en, pos: 'v', lemma },
      issue: 'to-prefix-on-non-verb',
      note: 'auto: has "to " but pos=' + pos
    });
    continue;
  }

  // ─── AUTO-DETECT: Verbs with garbled semicolon first parts ───
  if (en.includes(';')) {
    const parts = en.split(';').map(p => p.trim());
    if (parts.length >= 2) {
      const first = parts[0];
      const rest = parts.slice(1).join('; ').trim();
      const firstLower = first.toLowerCase().replace(/^to\s+/, '');

      // Detect garbage first parts: very short, or known garbage words
      const garbageFirst = new Set([
        'a','an','the','?','he','she','it','we','they','i','you',
        'now','yet','far','out','all','lot','big','old','new','bad',
        'sir','mr','mrs','ms','soon','bed','top','last','next',
        'every','nice','good','tale','dear','late','law','sign',
        'snow','turn','forward','doubt','proud','survey','sobriety',
        'chairman','neighbor','tolerance','accord','spring','touching',
        'touched','boarding','memory','company','despite','conclusion',
        'gas','students','animals','academic','electric','word','another',
        'france','amsterdam','milk','doesn\'t','didn\'t','hadn\'t',
        'he\'s','she\'s','it\'s','i\'m','we\'re','they\'re','there\'s',
      ]);

      if (garbageFirst.has(firstLower) || (firstLower.length <= 2 && firstLower !== 'to')) {
        const newEn = en.startsWith('to ') ? 'to ' + rest.replace(/^to\s+/, '') : rest;
        if (newEn !== en) {
          stats.garbageSemi++;
          stats.total++;
          fixes.push({
            key,
            old: { en, pos, lemma },
            new: { en: newEn, pos, lemma },
            issue: 'garbage-semicolon',
            note: 'auto: dropped garbage first "' + first + '"'
          });
          continue;
        }
      }
    }
  }

  // ─── AUTO-DETECT: "to " followed by bad verb forms ───
  if (en.startsWith('to ')) {
    const afterTo = en.slice(3).split(';')[0].split(',')[0].trim();
    const firstWord = afterTo.split(' ')[0];
    if (isBadVerbForm(firstWord)) {
      stats.verbFormIssues++;
      stats.total++;
      // Try to fix: remove the -ed/-en suffix
      let fixed = firstWord;
      if (firstWord.endsWith('ed') && firstWord.length > 4) {
        fixed = firstWord.slice(0, -2);
        if (fixed.endsWith('i')) fixed = fixed.slice(0, -1) + 'y'; // tried→try
        if (fixed.endsWith(fixed[fixed.length-1]) && !'llss'.includes(fixed.slice(-2))) {
          fixed = fixed.slice(0, -1); // stopped→stop
        }
      } else if (firstWord.endsWith('en') && firstWord.length > 4) {
        // frozen→freeze, etc. - can't auto-fix these well
        fixed = firstWord;
      }
      if (KNOWN_ENGLISH_VERBS.has(fixed)) {
        const newEn = 'to ' + fixed + en.slice(3 + afterTo.length);
        fixes.push({
          key,
          old: { en, pos, lemma },
          new: { en: newEn, pos, lemma },
          issue: 'bad-verb-form',
          note: 'auto: "to ' + firstWord + '" → "to ' + fixed + '"'
        });
      } else {
        fixes.push({
          key,
          old: { en, pos, lemma },
          new: { en, pos, lemma },
          issue: 'bad-verb-form-unfixed',
          note: 'manual: "to ' + firstWord + '" needs review'
        });
      }
      continue;
    }
  }

  // ─── AUTO-DETECT: truncated translations ───
  // Skip valid short entries: pronouns, particles, determiners, conjunctions
  const validShort = new Set(['he','I','me','my','we','or','if','no','so','on','at','in','to','an','it','be','do','go','up','us','oh','hi','by','ok','am','is','of']);
  if ((en.length <= 2 || en === '?' || en.match(/^[a-z]$/)) && !validShort.has(en)) {
    stats.truncated++;
    stats.total++;
    fixes.push({
      key,
      old: { en, pos, lemma },
      new: { en, pos, lemma },
      issue: 'truncated',
      note: 'manual: translation too short "' + en + '"'
    });
    continue;
  }

  // ─── AUTO-DETECT: Backslash garbled ───
  if (en.includes('\\')) {
    stats.backslash++;
    stats.total++;
    const newEn = en.replace(/\\/g, "'");
    fixes.push({
      key,
      old: { en, pos, lemma },
      new: { en: newEn, pos, lemma },
      issue: 'backslash',
      note: 'auto: backslash → apostrophe'
    });
    continue;
  }

  // ─── AUTO-DETECT: Dutch nouns wrongly tagged as verb ───
  if (pos === 'v' && !en.startsWith('to ')) {
    // Nouns that should not be verbs
    const nlNounEndings = ['ing','heid','schap','atie','iteit','ment','sel','nis'];
    const isLikelyNoun = nlNounEndings.some(s => key.endsWith(s) && !key.endsWith('en'));
    if (isLikelyNoun && !en.startsWith('to ')) {
      stats.wrongPos++;
      stats.total++;
      fixes.push({
        key,
        old: { en, pos, lemma },
        new: { en, pos: 'n', lemma },
        issue: 'wrong-pos',
        note: 'auto: Dutch -' + nlNounEndings.find(s => key.endsWith(s)) + ' noun tagged as verb'
      });
      continue;
    }
  }

  // ─── AUTO-DETECT: Nouns wrongly tagged as adj or verb ───
  if (pos === 'adj') {
    // Remote control, vacuum cleaner, etc are nouns not adj
    const nounTranslations = ['remote control', 'vacuum cleaner'];
    if (nounTranslations.some(n => en.toLowerCase().includes(n))) {
      stats.wrongPos++;
      stats.total++;
      fixes.push({
        key,
        old: { en, pos, lemma },
        new: { en, pos: 'n', lemma },
        issue: 'wrong-pos',
        note: 'auto: clearly a noun'
      });
      continue;
    }
  }
}

// ─── Write output ──────────────────────────────────────────────────────────
fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
fs.writeFileSync(OUTPUT_PATH, JSON.stringify({ stats, fixes }, null, 2));

console.log('\n=== DUTCH DICTIONARY REVIEW ===');
console.log(`Total entries: ${entries.length}`);
console.log(`Total fixes: ${fixes.length}`);
console.log('\nBreakdown:');
console.log(`  Wrong POS:              ${stats.wrongPos}`);
console.log(`  Wrong meaning:          ${stats.wrongMeaning}`);
console.log(`  Garbage semicolons:     ${stats.garbageSemi}`);
console.log(`  Bad verb forms:         ${stats.verbFormIssues}`);
console.log(`  Missing "to ":          ${stats.missingTo}`);
console.log(`  "to " on non-verbs:     ${stats.toOnNonVerb}`);
console.log(`  Truncated:              ${stats.truncated}`);
console.log(`  Backslash:              ${stats.backslash}`);
console.log(`  Wrong lemma:            ${stats.wrongLemma}`);

// ─── Apply fixes to nl.ts ──────────────────────────────────────────────────
console.log('\n=== APPLYING FIXES ===');
let modified = src;
let applied = 0;

for (const f of fixes) {
  if (f.new.en === f.old.en && f.new.pos === f.old.pos && f.new.lemma === f.old.lemma) continue;

  // Build old pattern
  const escKey = f.key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escEn = f.old.en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/'/g, "\\'");

  // Match the full entry line
  const entryPattern = new RegExp(
    `(['"]${escKey}['"])\\s*:\\s*\\{[^}]*\\}`,
    'g'
  );

  const match = entryPattern.exec(modified);
  if (!match) continue;

  const oldLine = match[0];

  // Build new entry
  let newEntry = oldLine;

  // Replace en value
  if (f.new.en !== f.old.en) {
    const oldEnEscaped = f.old.en.replace(/'/g, "\\'");
    const newEnEscaped = f.new.en.replace(/'/g, "\\'");
    newEntry = newEntry.replace(
      new RegExp(`en:\\s*'${oldEnEscaped.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'`),
      `en: '${newEnEscaped}'`
    );
  }

  // Replace pos value
  if (f.new.pos !== f.old.pos) {
    newEntry = newEntry.replace(
      new RegExp(`pos:\\s*'${f.old.pos.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'`),
      `pos: '${f.new.pos}'`
    );
  }

  // Replace lemma
  if (f.new.lemma !== undefined && f.new.lemma !== f.old.lemma) {
    if (f.old.lemma) {
      newEntry = newEntry.replace(
        new RegExp(`lemma:\\s*'${f.old.lemma.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'`),
        `lemma: '${f.new.lemma}'`
      );
    } else if (f.new.lemma) {
      // Add lemma before closing brace
      newEntry = newEntry.replace(/\}$/, `, lemma: '${f.new.lemma}' }`);
    }
  }

  // Remove lemma if new.lemma is null but old had one
  if (f.new.lemma === null && f.old.lemma) {
    newEntry = newEntry.replace(/,?\s*lemma:\s*'[^']*'/, '');
  }

  if (newEntry !== oldLine) {
    modified = modified.replace(oldLine, newEntry);
    applied++;
  }
}

fs.writeFileSync(DICT_PATH, modified);
console.log(`Applied ${applied} fixes to nl.ts`);
console.log(`Output saved to ${OUTPUT_PATH}`);
