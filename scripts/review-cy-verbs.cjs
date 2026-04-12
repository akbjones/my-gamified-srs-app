#!/usr/bin/env node
/**
 * COMPLETE Welsh dictionary review script.
 * Checks EVERY SINGLE ENTRY for:
 *   A: "to " on non-verbs (nouns, adj, adv, prep, conj, det, pron, part, num, prefix)
 *   B: Verb form issues (past tense, gerund, "to was", "to he", etc.)
 *   C: Missing "to " on verbs
 *   D: Garbage semicolons (random/wrong first meaning before semicolon)
 *   E: Wrong meaning (Welsh knowledge - wrong translations, garbled text)
 *   F: Backslash-garbled entries
 *   G: Truncated translations
 *   H: Wrong POS
 *   I: Cyrillic/non-Latin characters in keys or translations
 *
 * Writes fixes to scripts/output/cy-full-verb-review.json and applies to cy.ts.
 */

const fs = require('fs');
const path = require('path');

const DICT_PATH = path.join(__dirname, '..', 'src', 'data', 'dictionary', 'cy.ts');
const OUTPUT_PATH = path.join(__dirname, 'output', 'cy-full-verb-review.json');

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

// ─── Welsh verb infinitive endings ──────────────────────────────────────────
// Welsh verb infinitives typically end in: -u, -i, -o, -ed, -eg, -yd, etc.
const WELSH_VERB_ENDINGS = ['u', 'i', 'o', 'ed', 'eg', 'yd', 'el', 'yn'];

// ─── KNOWN_ENGLISH_VERBS ───────────────────────────────────────────────────
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
  'restore','illuminate','oversee','reopen','redevelop','excavate',
  'absorb','outline','decelerate','catalogue','assess','signal',
  'commemorate','postpone','recycle','subdivide','hinder',
  'quieten','lessen','milk','stink','pour','grill','roast',
  'chew','swallow','shovel','sieve','crochet','knit','embroider',
]);

// ─── Welsh-specific knowledge: KNOWN WRONG MEANINGS ─────────────────────────
// Map of Welsh words to correct meanings when the dictionary has garbage
const KNOWN_FIXES = {
};

// ─── Specific Welsh word corrections ─────────────────────────────────────────
// These are entries we know are wrong based on Welsh language knowledge
const WELSH_KNOWN = {
  // Verb infinitives that should have "to " but are tagged as nouns
  'anghofio': { correctPos: 'v', correctEn: 'to forget' },
  'addysgu': { correctPos: 'v', correctEn: 'to teach' },
  'adolygu': { correctPos: 'v', correctEn: 'to review' },
  'adnewyddu': { correctPos: 'v', correctEn: 'to renovate' },
  'ailgylchu': { correctPos: 'v', correctEn: 'to recycle' },
  'arddangos': { correctPos: 'v', correctEn: 'to display' },
  'arwain': { correctPos: 'v', correctEn: 'to lead' },
  'casglu': { correctPos: 'v', correctEn: 'to collect' },
  'cerfio': { correctPos: 'v', correctEn: 'to carve' },
  'clirio': { correctPos: 'v', correctEn: 'to clear' },
  'adeiladu': { correctPos: 'v', correctEn: 'to build' },
  'dosbarthu': { correctPos: 'v', correctEn: 'to distribute' },
  'dyfu': { correctPos: 'v', correctEn: 'to grow' },
  'gofalu': { correctPos: 'v', correctEn: 'to take care' },
  'gorlifo': { correctPos: 'v', correctEn: 'to overflow' },
  'llywio': { correctPos: 'v', correctEn: 'to steer; navigate' },
  'rheoli': { correctPos: 'v', correctEn: 'to manage; control' },
  'rhestru': { correctPos: 'v', correctEn: 'to list' },
  'rhwystro': { correctPos: 'v', correctEn: 'to hinder; obstruct' },
  'ymdrin': { correctPos: 'v', correctEn: 'to deal with' },
  'anelu': { correctPos: 'v', correctEn: 'to aim' },
  'adrodd': { correctPos: 'v', correctEn: 'to report; tell' },
  'magu': { correctPos: 'v', correctEn: 'to raise; nurture' },
  'dweud': { correctPos: 'v', correctEn: 'to say; tell' },
  'yfed': { correctPos: 'v', correctEn: 'to drink' },
  'arfer': { correctPos: 'v', correctEn: 'to practice; be accustomed' },
};

// Words that are definitively NOT verbs but have "to " prefix
const NON_VERB_WORDS_WITH_TO = new Set([
  // Nouns that were incorrectly given "to " prefix
]);

// ─── Garbage first-senses to strip ──────────────────────────────────────────
// These are words that appear as garbage first meanings before semicolons
const GARBAGE_SENSES = new Set([
  'megan', 'catrin', 'rhodri', 'rhys', 'gareth', 'dafydd', 'siân', 'lowri', 'efa',
  'trystan', 'bryn', 'pwyll', 'cerys', 'robin', 'urdd', 'wales',
  // Random unrelated nouns that appear as garbage first senses
  'spy', 'champion', 'navigator', 'botanist', 'forester', 'everyone',
  'heritage', 'concert', 'podcast', 'documentary', 'xylography', 'carnival',
  'seminar', 'decathlon', 'flooding', 'hydroelectric', 'piccolo',
  'boxer', 'guacamole', 'producer', 'filmmaker', 'mountaineer',
  'psychologist', 'psychiatrist', 'shortlist', 'supervisor',
  'pendulum', 'glacial', 'roman', 'taxidermist',
  'dentist', 'doctor', 'officer', 'soldier', 'teacher', 'farmer',
  'librarian', 'mortar', 'auctioneer', 'stonemason', 'woodworker',
  'acrobat', 'laboratory', 'drone', 'helicopter', 'report', 'duke',
  'critic', 'architect', 'missionary', 'scripture', 'scriptwriter',
  'windmill', 'wind, turbine', 'pole', 'solar',
  'goalkeeper', 'red', 'female', 'local',
]);

// ─── Pattern-based fixes ────────────────────────────────────────────────────
const fixes = [];
const stats = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0, G: 0, H: 0, I: 0 };

function addFix(key, category, oldEn, newEn, oldPos, newPos, reason) {
  const fix = { key, category, reason };
  if (newEn !== undefined && newEn !== oldEn) {
    fix.oldEn = oldEn;
    fix.newEn = newEn;
  }
  if (newPos !== undefined && newPos !== oldPos) {
    fix.oldPos = oldPos;
    fix.newPos = newPos;
  }
  // Only add if there's actually a change
  if (fix.newEn !== undefined || fix.newPos !== undefined) {
    fixes.push(fix);
    stats[category]++;
  }
}

// ─── Helper: past participle -> base form ──────────────────────────────────
function pastToBase(past) {
  const p = past.toLowerCase();
  const irregulars = {
    'promised': 'promise', 'assessed': 'assess', 'finished': 'finish',
    'answered': 'answer', 'collected': 'collect', 'opened': 'open',
    'closed': 'close', 'ordered': 'order', 'repaired': 'repair',
    'reopened': 'reopen', 'redeveloped': 'redevelop', 'printed': 'print',
    'adjusted': 'adjust', 'proposed': 'propose', 'organized': 'organize',
    'listed': 'list', 'studied': 'study', 'reviewed': 'review',
    'decorated': 'decorate', 'explored': 'explore', 'examined': 'examine',
    'observed': 'observe', 'investigated': 'investigate', 'reflected': 'reflect',
    'supported': 'support', 'protected': 'protect', 'painted': 'paint',
    'excavated': 'excavate', 'catalogued': 'catalogue', 'illuminated': 'illuminate',
    'supervised': 'supervise', 'renewed': 'renew', 'threatened': 'threaten',
    'praised': 'praise', 'borrowed': 'borrow', 'speckled': 'speckle',
    'completed': 'complete', 'counted': 'count', 'suspected': 'suspect',
    'tasted': 'taste', 'tried': 'try', 'went': 'go', 'came': 'come',
    'said': 'say', 'told': 'tell', 'thought': 'think', 'knew': 'know',
    'saw': 'see', 'found': 'find', 'gave': 'give', 'took': 'take',
    'made': 'make', 'got': 'get', 'had': 'have', 'was': 'be', 'did': 'do',
    'ran': 'run', 'won': 'win', 'lost': 'lose', 'sent': 'send',
    'kept': 'keep', 'left': 'leave', 'felt': 'feel', 'held': 'hold',
    'stood': 'stand', 'sat': 'sit', 'meant': 'mean', 'brought': 'bring',
    'built': 'build', 'read': 'read', 'paid': 'pay', 'met': 'meet',
    'led': 'lead', 'slept': 'sleep', 'understood': 'understand',
    'written': 'write', 'forgotten': 'forget', 'spoken': 'speak',
    'driven': 'drive', 'broken': 'break', 'chosen': 'choose',
    'frozen': 'freeze', 'hidden': 'hide', 'risen': 'rise', 'stolen': 'steal',
    'worn': 'wear', 'torn': 'tear', 'sworn': 'swear', 'given': 'give',
    'taken': 'take', 'eaten': 'eat', 'fallen': 'fall', 'drawn': 'draw',
    'grown': 'grow', 'known': 'know', 'shown': 'show', 'thrown': 'throw',
    'blown': 'blow', 'flown': 'fly', 'drunk': 'drink', 'sung': 'sing',
    'swum': 'swim', 'begun': 'begin', 'rang': 'ring', 'drank': 'drink',
    'sang': 'sing', 'sank': 'sink', 'shrank': 'shrink', 'stank': 'stink',
    'swore': 'swear', 'wore': 'wear', 'tore': 'tear', 'bore': 'bear',
    'froze': 'freeze', 'rose': 'rise', 'chose': 'choose', 'woke': 'wake',
    'spoke': 'speak', 'stole': 'steal', 'broke': 'break', 'drove': 'drive',
    'wrote': 'write', 'rode': 'ride', 'hid': 'hide',
    // Welsh dictionary specific
    'links': 'link', 'taxes': 'tax', 'rains': 'rain', 'snows': 'snow',
  };
  if (irregulars[p]) return irregulars[p];

  // -ied -> -y: studied -> study, carried -> carry
  if (p.endsWith('ied') && p.length > 4) return p.slice(0, -3) + 'y';
  // -eed -> -ee: freed -> free
  if (p.endsWith('eed')) return p.slice(0, -2);

  if (p.endsWith('ed') && p.length > 3) {
    const noEd = p.slice(0, -2);
    const noD = p.slice(0, -1);
    // Double consonant: stopped -> stop, planned -> plan
    if (noEd.length >= 3 && noEd[noEd.length-1] === noEd[noEd.length-2] && !/[aeiou]/.test(noEd[noEd.length-1])) {
      return noEd.slice(0, -1);
    }
    // -ated, -uted, -ited, -eted, -oted -> drop -d (decorated -> decorate)
    if (/[aeiou]ted$/.test(p)) return noD;
    // -ised, -ized, -osed, -used, -ased -> drop -d
    if (/[sz]ed$/.test(p) && /[aeiou][sz]ed$/.test(p)) return noD;
    // -ced, -ged, -ved, -red, -ned, -led where the base has silent-e
    if (/[cgvrnl]ed$/.test(p) && noEd.length >= 3) {
      // Check if KNOWN_ENGLISH_VERBS has the -e form
      if (KNOWN_ENGLISH_VERBS.has(noD)) return noD;
      if (KNOWN_ENGLISH_VERBS.has(noEd)) return noEd;
      // Default: return noEd for most
      return noEd;
    }
    // Default strip -ed
    if (KNOWN_ENGLISH_VERBS.has(noEd)) return noEd;
    if (KNOWN_ENGLISH_VERBS.has(noD)) return noD;
    if (noEd.length >= 3) return noEd;
  }
  return p;
}

// ─── Helper: gerund -> base form ───────────────────────────────────────────
function gerundToBase(gerund) {
  const g = gerund.toLowerCase();
  if (!g.endsWith('ing') || g.length <= 4) return g;
  const stem = g.slice(0, -3);

  // Known -e words: exploring -> explore, dancing -> dance
  const needsE = new Set(['mak', 'tak', 'com', 'giv', 'liv', 'hav', 'writ', 'driv', 'rid',
    'explor', 'danc', 'sav', 'mov', 'clos', 'ris', 'chang', 'manag',
    'observ', 'serv', 'practic', 'balanc', 'chas', 'promis', 'organiz',
    'recogniz', 'exercis', 'provid', 'believ', 'achiev', 'receiv',
    'caus', 'creat', 'debat', 'decor', 'defin', 'describ', 'determin',
    'examin', 'featur', 'forg', 'guid', 'hop', 'imagin', 'inspir',
    'investigat', 'invit', 'isol', 'judg', 'measur', 'notic', 'operat',
    'outlin', 'prais', 'prepar', 'produc', 'promot', 'recov',
    'reduc', 'releas', 'remov', 'requir', 'restor', 'shar',
    'solv', 'stor', 'translat', 'valu', 'wast', 'navigat',
    'car', 'compet', 'compar', 'complet', 'contribut', 'convinc',
    'illuminat', 'steer', 'pos', 'us', 'whin', 'danc', 'rac', 'trad',
    'nam', 'rat', 'slic', 'smil', 'tun', 'piec', 'brows', 'chas',
    'practic', 'influenc', 'financ', 'phas', 'purchas', 'eras',
    'embrac', 'escap', 'balanc', 'damag', 'packag', 'manag',
    'arrang', 'charg', 'engag', 'exchang', 'rang', 'averag',
    'leverag', 'messag', 'storag', 'voltag', 'courag',
  ]);

  if (needsE.has(stem)) return stem + 'e';
  // Double consonant: running -> run, swimming -> swim
  if (stem.length >= 3 && stem[stem.length-1] === stem[stem.length-2] && !/[aeiou]/.test(stem[stem.length-1])) {
    return stem.slice(0, -1);
  }
  // Check KNOWN_ENGLISH_VERBS
  if (KNOWN_ENGLISH_VERBS.has(stem + 'e')) return stem + 'e';
  if (KNOWN_ENGLISH_VERBS.has(stem)) return stem;
  return stem;
}

// ─── Helper: 3rd person -> base form ───────────────────────────────────────
function thirdPersonToBase(word) {
  const w = word.toLowerCase();
  if (w.endsWith('ies') && w.length > 4) return w.slice(0, -3) + 'y';
  if (w.endsWith('ses') || w.endsWith('zes') || w.endsWith('xes') || w.endsWith('ches') || w.endsWith('shes')) return w.slice(0, -2);
  if (w.endsWith('ss') || w.endsWith('us') || w.endsWith('is')) return w; // skip
  if (w.endsWith('s') && w.length > 3) return w.slice(0, -1);
  return w;
}

// ─── Check every single entry ──────────────────────────────────────────────
for (const e of entries) {
  const { key, en, pos, lemma } = e;

  if (en === '?') continue; // Skip unknown entries

  const enLower = en.toLowerCase();
  const parts = en.split('; ');
  const firstPart = parts[0].trim();
  const firstPartLower = firstPart.toLowerCase();

  // ─── I: Cyrillic or non-Latin characters ──────────────────────────────
  if (/[\u0400-\u04FF]/.test(key) || /[\u0400-\u04FF]/.test(en)) {
    // Has Cyrillic chars - likely garbled entry
    addFix(key, 'I', en, undefined, pos, undefined, 'Cyrillic/non-Latin chars in entry');
    continue; // Skip further checks for garbled entries
  }

  // ─── F: Backslash-garbled entries ────────────────────────────────────
  if (en.includes('\\') && !en.includes("\\'")) {
    addFix(key, 'F', en, en.replace(/\\/g, ''), pos, undefined, 'Backslash-garbled');
    continue;
  }

  // ─── G: Truncated translations ───────────────────────────────────────
  if (en.length > 0 && en.length <= 3 && !['or', 'ax', 'be', 'do', 'go', 'cd', 'ai', 'ad', 'an', 'in', 'on', 'up', 'no', 'am', 'of', 'me', 'my', 'we', 'he', 'so', 'at', 'by', 'if', 'it', 'to', 'is', 'as', 'us'].includes(enLower) && pos !== 'part' && pos !== 'det' && pos !== 'num') {
    // Check for truncated words
    const truncatedPatterns = ['atla', 'acte', 'discus', 'printe', 'specy', 'rhinocero', 'tran', 'nowaday'];
    if (truncatedPatterns.includes(enLower)) {
      const truncFixes = {
        'atla': 'atlas', 'acte': 'act', 'discus': 'discuss', 'printe': 'print',
        'specy': 'species', 'rhinocero': 'rhinoceros', 'tran': 'across', 'nowaday': 'nowadays'
      };
      if (truncFixes[enLower]) {
        addFix(key, 'G', en, truncFixes[enLower], pos, undefined, 'Truncated translation');
      }
    }
  }
  // Check for truncated words appearing anywhere
  if (/\bacte\b/.test(enLower) && !enLower.includes('active') && !enLower.includes('acted') && !enLower.includes('acter')) {
    const newEn = en.replace(/\bacte\b/i, 'act');
    addFix(key, 'G', en, newEn, pos, undefined, 'Truncated "acte" -> "act"');
    continue;
  }
  if (/\bprinte\b/.test(enLower)) {
    const newEn = en.replace(/\bprinte\b/i, 'print');
    addFix(key, 'G', en, newEn, pos, undefined, 'Truncated "printe" -> "print"');
    continue;
  }
  if (/\bspecy\b/.test(enLower)) {
    addFix(key, 'G', en, en.replace(/\bspecy\b/i, 'species'), pos, undefined, 'Truncated "specy" -> "species"');
    continue;
  }
  if (/\brhinocero\b/.test(enLower)) {
    addFix(key, 'G', en, en.replace(/\brhinocero\b/i, 'rhinoceros'), pos, undefined, 'Truncated "rhinocero" -> "rhinoceros"');
    continue;
  }
  if (/\batla\b/.test(enLower) && key === 'atlas') {
    addFix(key, 'G', en, 'atlas', pos, undefined, 'Truncated "atla" -> "atlas"');
    continue;
  }

  // ─── Helper: pastToBase ────────────────────────────────────────────────
  // (defined at top level to avoid re-creation)

  // ─── B: Verb form issues ──────────────────────────────────────────────
  // "to was ..." pattern
  if (/^to was\b/.test(enLower)) {
    const newEn = en.replace(/^to was /, 'to be ');
    addFix(key, 'B', en, newEn, pos, undefined, '"to was X" -> "to be X" (passive)');
    continue;
  }

  // "to I tried" / "to I finished" / "to he went" etc.
  if (/^to (he|she|I|we|they|it|you) /i.test(en)) {
    const match = en.match(/^to (he|she|I|we|they|it|you) (.+)$/i);
    if (match) {
      let rest = match[2].trim();
      // Try to convert the remaining word to base form
      const restWord = rest.split(/[;, ]/)[0].trim().toLowerCase();
      const base = pastToBase(restWord);
      if (base !== restWord && base) {
        // Replace conjugated word with base
        const afterParts = rest.split('; ');
        afterParts[0] = base;
        addFix(key, 'B', en, 'to ' + afterParts.join('; '), pos, undefined, `"to ${match[1]} ${restWord}" -> "to ${base}"`);
      } else {
        addFix(key, 'B', en, 'to ' + rest, pos, undefined, `"to ${match[1]} X" -> "to X"`);
      }
      continue;
    }
  }

  // "to promised" / "to assessed" / "to finished" etc. (past tense after "to ")
  // But NOT "to need", "to open", "to feed", etc.
  if (/^to \w+ed$/i.test(en) && pos === 'v') {
    const word = en.replace(/^to /, '');
    const wordLower = word.toLowerCase();
    const naturalEdVerbs = new Set(['need', 'feed', 'seed', 'speed', 'bleed', 'breed', 'proceed', 'succeed', 'exceed', 'heed', 'weed']);
    if (!naturalEdVerbs.has(wordLower) && !KNOWN_ENGLISH_VERBS.has(wordLower)) {
      const base = pastToBase(wordLower);
      if (base !== wordLower && base.length >= 2) {
        addFix(key, 'B', en, 'to ' + base, pos, undefined, `Past tense "to ${word}" -> "to ${base}"`);
        continue;
      }
    }
  }

  // "to walking", "to exploring", etc. (gerund after "to ")
  if (/^to \w+ing\b/.test(en) && pos === 'v') {
    const gerund = en.match(/^to (\w+ing)/)?.[1];
    if (gerund && gerund.length > 4 && !['bring', 'ring', 'sing', 'spring', 'sting', 'string', 'swing', 'thing', 'king', 'cling', 'fling', 'sling', 'wring'].includes(gerund.toLowerCase())) {
      const base = gerundToBase(gerund);
      if (base !== gerund) {
        if (en.includes('; ')) {
          const newParts = [...parts];
          newParts[0] = 'to ' + base;
          addFix(key, 'B', en, newParts.join('; '), pos, undefined, 'Gerund after "to "');
        } else {
          addFix(key, 'B', en, 'to ' + base, pos, undefined, 'Gerund after "to "');
        }
        continue;
      }
    }
  }

  // "to floats", "to sets", "to decorates" etc. (3rd person after "to ")
  if (/^to \w+s\b/.test(en) && pos === 'v' && !/^to (this|thus|his|its|less|across|towards|plus|bus|yes|is|was|has|does|goes)/.test(enLower)) {
    const word3rd = en.match(/^to (\w+)/)?.[1];
    if (word3rd && word3rd.endsWith('s') && word3rd.length > 3) {
      const base = thirdPersonToBase(word3rd);
      if (base !== word3rd && KNOWN_ENGLISH_VERBS.has(base)) {
        if (en.includes('; ')) {
          const newParts = [...parts];
          newParts[0] = 'to ' + base;
          addFix(key, 'B', en, newParts.join('; '), pos, undefined, `3rd person "to ${word3rd}" -> "to ${base}"`);
        } else {
          addFix(key, 'B', en, 'to ' + base, pos, undefined, `3rd person "to ${word3rd}" -> "to ${base}"`);
        }
        continue;
      }
    }
  }

  // ─── A: "to " on non-verbs ───────────────────────────────────────────
  if (pos !== 'v' && enLower.startsWith('to ')) {
    // Check if this is actually a verb that has wrong POS
    const enAfterTo = en.slice(3).split(';')[0].trim().split(' ')[0].toLowerCase();

    if (KNOWN_ENGLISH_VERBS.has(enAfterTo)) {
      // It IS a verb - fix the POS
      addFix(key, 'H', en, undefined, pos, 'v', `"to ${enAfterTo}" should be pos:v not pos:${pos}`);
      continue;
    }

    // It's a non-verb with "to " - strip it
    const newEn = en.replace(/^to /, '');
    addFix(key, 'A', en, newEn, pos, undefined, `"to " on non-verb (pos:${pos})`);
    continue;
  }

  // ─── C: Missing "to " on verbs ───────────────────────────────────────
  if (pos === 'v' && !enLower.startsWith('to ')) {
    // Check what the first word is
    const firstWord = firstPartLower.split(' ')[0];

    // Skip if it's a question mark or very short
    if (en === '?' || en.length < 2) continue;

    // These verb entries look like they describe nouns/adjectives, not verbs
    // Skip entries that are clearly noun/adj descriptions for mutated forms
    if (['free', 'lost', 'sad', 'broken', 'warm', 'wide', 'strong', 'deep',
         'frustrated', 'rusty', 'honest', 'proud', 'expensive', 'heavy',
         'bad', 'stupid', 'slow', 'impossible', 'uncertain', 'suitable',
         'obvious', 'special', 'difficult', 'funny', 'strange', 'gentle',
         'nasty', 'lucky', 'happy', 'beautiful', 'ugly', 'clean', 'dirty',
         'tired', 'angry', 'sick', 'hungry', 'thirsty', 'cold', 'hot',
         'wet', 'dry', 'full', 'empty', 'new', 'old', 'young', 'tall',
         'short', 'long', 'thick', 'thin'].includes(firstWord) && !en.includes('; ')) {
      // This is likely a wrongly-tagged adjective
      addFix(key, 'H', en, undefined, pos, 'adj', `"${firstWord}" is adj not verb`);
      continue;
    }

    // For multi-sense entries, check if the first sense is garbage
    if (en.includes('; ') && parts.length >= 2) {
      const sense1 = parts[0].trim().toLowerCase();
      const sense2 = parts[parts.length-1].trim().toLowerCase();
      const sense2word = sense2.split(' ')[0];

      // Check if first sense is a past participle and second is the base verb
      const baseOfFirst = pastToBase(sense1);
      if (baseOfFirst !== sense1 && KNOWN_ENGLISH_VERBS.has(sense2word)) {
        // First sense is conjugated, second is the real verb
        addFix(key, 'C', en, 'to ' + sense2word, pos, undefined, `Missing "to " - using verb sense "${sense2word}"`);
        continue;
      }

      // If first sense is garbage noun but second is a verb
      if (KNOWN_ENGLISH_VERBS.has(sense2word) && !KNOWN_ENGLISH_VERBS.has(sense1.split(' ')[0])) {
        addFix(key, 'C', en, 'to ' + sense2, pos, undefined, `Missing "to " - using verb sense "${sense2}"`);
        continue;
      }

      // If second is the verb sense, add "to " to just that
      if (KNOWN_ENGLISH_VERBS.has(sense2word)) {
        addFix(key, 'C', en, 'to ' + en, pos, undefined, 'Missing "to " on verb');
        continue;
      }
    }

    // Simple single-sense verbs
    if (KNOWN_ENGLISH_VERBS.has(firstWord)) {
      addFix(key, 'C', en, 'to ' + en, pos, undefined, 'Missing "to " on verb');
      continue;
    }
  }

  // ─── D: Garbage semicolons ────────────────────────────────────────────
  if (en.includes('; ') && parts.length >= 2) {
    const firstSense = parts[0].trim().toLowerCase();
    const restSenses = parts.slice(1).join('; ');

    // Check if first sense is a known garbage/unrelated word
    let isGarbage = false;
    let garbageReason = '';

    // Welsh personal names as first sense
    if (GARBAGE_SENSES.has(firstSense) || GARBAGE_SENSES.has(firstSense.replace(/^to /, ''))) {
      isGarbage = true;
      garbageReason = `Garbage first sense "${firstSense}"`;
    }

    // "i'm" / "it's" / "don't" / "that's" / "i've" / "we'll" appearing as first sense
    if (/^(i'm|it's|don't|that's|i've|we'll|i'd|he's|she's|they're|we're|you're|isn't|aren't|wasn't|weren't|haven't|hasn't|hadn't|won't|wouldn't|couldn't|shouldn't|didn't|can't|mustn't)$/i.test(firstSense)) {
      isGarbage = true;
      garbageReason = `Contraction "${firstSense}" as first sense`;
    }

    // Random word + semicolon where second part is the real meaning
    // E.g., "concert; amazing" -> "amazing"  (for anhygoel which means incredible)
    // E.g., "spy; collect" -> "collect" (for casglu)
    // Check if first sense seems unrelated (different word class)
    if (!isGarbage && parts.length === 2) {
      const sense1 = parts[0].trim().toLowerCase();
      const sense2 = parts[1].trim().toLowerCase();

      // Specific known garbage patterns for Welsh dict
      const knownGarbageFirstSenses = [
        'megan', 'catrin', 'rhodri', 'gareth', 'dafydd', 'siân', 'lowri',
        'trystan', 'bryn', 'pwyll', 'cerys', 'aled', 'manon', 'efa',
        'robin', 'arthur', 'mari',
        // Random English words that shouldn't be first sense
        'spy', 'champion', 'navigator', 'botanist', 'forester', 'everyone',
        'heritage', 'concert', 'podcast', 'documentary', 'carnival',
        'seminar', 'decathlon', 'piccolo', 'xylography',
        'boxer', 'guacamole', 'producer', 'filmmaker', 'mountaineer',
        'psychologist', 'psychiatrist', 'shortlist', 'supervisor',
        'pendulum', 'taxidermist', 'windmill',
        'acrobat', 'laboratory', 'drone', 'helicopter', 'report',
        'critic', 'architect', 'missionary', 'scripture', 'scriptwriter',
        'auctioneer', 'stonemason', 'woodworker',
        'goalkeeper', 'local',
        'flooding', 'hydroelectric', 'solar', 'glacial',
        'inner', 'forward', 'attention', 'word',
        'born', 'old', 'early', 'deadline', 'headteacher',
        'methodology', 'arts', 'castle', 'countryside',
        'everywhere', 'raining', 'nearest', 'further',
        'window', 'children', 'qualifications',
        'kidneys', 'duke', 'drought', 'pole',
        'short', 'towels', 'better', 'life', 'pendulum',
        'sea', 'beautiful', 'urdd', 'spring', 'cerdd',
        'yellow', 'although', 'nothing', 'female',
      ];

      if (knownGarbageFirstSenses.includes(sense1) ||
          knownGarbageFirstSenses.includes(sense1.replace(/^to /, ''))) {
        isGarbage = true;
        garbageReason = `Garbage first sense "${sense1}"`;
      }
    }

    if (isGarbage && restSenses.trim()) {
      let newEn = restSenses.trim();
      // If verb, ensure "to " prefix
      if (pos === 'v' && !newEn.toLowerCase().startsWith('to ')) {
        newEn = 'to ' + newEn;
      }
      addFix(key, 'D', en, newEn, pos, undefined, garbageReason);
      continue;
    }
  }

  // ─── E: Wrong meaning / POS issues ────────────────────────────────────

  // Check known Welsh word corrections
  if (WELSH_KNOWN[key]) {
    const known = WELSH_KNOWN[key];
    let needsFix = false;
    let newEn = en;
    let newPos = pos;

    if (known.correctEn && known.correctEn !== en) {
      newEn = known.correctEn;
      needsFix = true;
    }
    if (known.correctPos && known.correctPos !== pos) {
      newPos = known.correctPos;
      needsFix = true;
    }
    if (needsFix) {
      addFix(key, 'E', en, newEn, pos, newPos, `Known Welsh correction: ${key}`);
      continue;
    }
  }

  // entries ending in -ur that are impersonal passive forms but tagged as nouns
  // e.g., "carur" -> "to loved; lover" should probably be handled
  if (key.endsWith('ur') && pos === 'n' && en.includes('; ')) {
    const baseParts = en.split('; ');
    // Check if it's a passive/impersonal form
    if (baseParts.length === 2 &&
        (baseParts[0].startsWith('to ') || baseParts[1].includes('is ') || baseParts[1].includes('will be'))) {
      // These -r/-ur forms are often impersonal verb forms in Welsh
      // Leave them as-is for now, they serve a purpose in the dictionary
    }
  }

  // Entries with wrong POS: adj that should be n, n that should be adj, etc.
  // "education" tagged as adj -> should be n
  if (pos === 'adj' && !en.includes('; ')) {
    const definiteNouns = ['education', 'member', 'quality', 'speech', 'effort',
      'time', 'success', 'style', 'light', 'place', 'practice',
      'arts', 'class', 'amount', 'size', 'half', 'opinion'];
    if (definiteNouns.includes(enLower)) {
      addFix(key, 'H', en, undefined, pos, 'n', `"${en}" should be pos:n not pos:adj`);
      continue;
    }
  }

  // Wrong sense: man; identify -> identify; man -> should be noun if key is 'adnabod'
  // Skip these complex cases - they need careful manual review

  // ─── Deep specific for "to X; Y" -> strip if first verb form is wrong
  if (pos === 'v' && en.startsWith('to ') && en.includes('; ')) {
    const verbPart = parts[0].replace(/^to /, '').trim().toLowerCase();
    const PAST_FORMS = new Set(['left', 'counted', 'suspected', 'heard', 'seen', 'built', 'written',
         'known', 'said', 'done', 'gone', 'taken', 'given', 'broken', 'chosen',
         'spoken', 'driven', 'eaten', 'fallen', 'frozen', 'hidden', 'risen',
         'stolen', 'sworn', 'torn', 'worn', 'kept', 'meant', 'slept', 'felt',
         'held', 'led', 'read', 'paid', 'sat', 'stood', 'understood',
         'promised', 'assessed', 'finished', 'answered', 'explored', 'observed',
         'collected', 'studied', 'protected', 'supported', 'painted', 'listed',
         'reviewed', 'organized', 'adjusted']);
    if (PAST_FORMS.has(verbPart)) {
      const secondSense = parts.slice(1).join('; ').trim();
      const secondWord = secondSense.split(/[;, ]/)[0].toLowerCase();
      // Only use second sense if it looks like a verb action, not a noun or pronoun
      const SKIP_SECOND = new Set(['i', 'we', 'he', 'she', 'they', 'it', 'you',
        'leek', 'spy', 'stone', 'castle', 'tree', 'house', 'water', 'fire', 'river',
        'man', 'woman', 'child', 'boy', 'girl', 'king', 'queen',
        'car', 'dog', 'cat', 'food', 'day', 'night', 'time']);
      if (!SKIP_SECOND.has(secondWord)) {
        const base = pastToBase(verbPart);
        // Use base form if it's a real verb, else use second sense
        if (base !== verbPart && KNOWN_ENGLISH_VERBS.has(base)) {
          addFix(key, 'B', en, 'to ' + base + '; ' + secondSense, pos, undefined, `Past participle "to ${verbPart}" -> "to ${base}"`);
        } else {
          const newEn = 'to ' + secondSense;
          addFix(key, 'B', en, newEn, pos, undefined, `Past participle "${verbPart}" after "to ", using second sense`);
        }
        continue;
      } else {
        // Second sense is a noun/pronoun - use base form of past participle
        const base = pastToBase(verbPart);
        if (base !== verbPart) {
          addFix(key, 'B', en, 'to ' + base + '; ' + secondSense, pos, undefined, `Past participle "to ${verbPart}" -> "to ${base}"`);
          continue;
        }
      }
    }
  }
}

// ─── Additional pass: entries with garbled IPA (likely garbled entries) ──────
for (const e of entries) {
  if (e.ipa && /[\u0400-\u04FF]/.test(e.ipa)) {
    // Cyrillic in IPA - garbled
    const existing = fixes.find(f => f.key === e.key);
    if (!existing) {
      fixes.push({ key: e.key, category: 'I', reason: 'Cyrillic chars in IPA', note: 'IPA needs cleanup' });
      stats['I']++;
    }
  }
}

// ─── Additional pass: Specific known fixes ──────────────────────────────────
const specificFixes = [
  // Truncated translations
  { key: 'actio', oldEn: 'to acte', newEn: 'to act', cat: 'G', reason: 'Truncated "acte" -> "act"' },
  { key: 'argraffu', oldEn: 'to printe', newEn: 'to print', cat: 'G', reason: 'Truncated "printe" -> "print"' },
  { key: 'atlas', oldEn: 'atla', newEn: 'atlas', cat: 'G', reason: 'Truncated "atla" -> "atlas"' },
  { key: 'rhywogaeth', oldEn: 'specy', newEn: 'species', cat: 'G', reason: 'Truncated "specy" -> "species"' },
  { key: 'rhinoseros', oldEn: 'rhinocero', newEn: 'rhinoceros', cat: 'G', reason: 'Truncated "rhinocero" -> "rhinoceros"' },
  // Wrong POS
  { key: 'addysg', newPos: 'n', cat: 'H', reason: '"education" should be n not adj' },
  { key: 'aelod', newPos: 'n', cat: 'H', reason: '"member" should be n not adj' },
  { key: 'araith', newPos: 'n', cat: 'H', reason: '"speech" should be n not adj' },
  { key: 'ansawdd', newPos: 'n', cat: 'H', reason: '"quality" should be n not adj' },
  { key: 'adnoddau', newPos: 'n', cat: 'H', reason: '"resource" should be n not adj' },
  // Deep: should be adj not n
  { key: 'anghyffredin', newPos: 'adj', cat: 'H', reason: '"uncommon" should be adj not n' },
  { key: 'anniben', newPos: 'adj', cat: 'H', reason: '"untidy" should be adj not n' },
  { key: 'annisgwyl', newPos: 'adj', cat: 'H', reason: '"unexpected" should be adj not n' },
  { key: 'aneglur', newPos: 'adj', cat: 'H', reason: '"unclear" should be adj not n' },
  { key: 'anferth', newPos: 'adj', cat: 'H', reason: '"huge" should be adj not n' },
  // Welsh-specific: anferth means "huge/enormous", not "unsightly"
  { key: 'anferth', oldEn: 'unsightly, ugly', newEn: 'huge, enormous', cat: 'E', reason: 'anferth = huge/enormous, not unsightly' },
  // aeddfed means "mature/ripe" not "guacamole"
  { key: 'aeddfed', oldEn: 'guacamole; mature', newEn: 'mature, ripe', cat: 'D', reason: 'aeddfed = mature/ripe' },
  // allweddol is adj, not n
  { key: 'allweddol', newPos: 'adj', cat: 'H', reason: '"key, crucial" should be adj not n' },
  // Capitalization fix
  { key: 'dwfn', oldEn: 'Deep', newEn: 'deep', cat: 'E', reason: 'Unnecessary capitalization' },
  { key: 'dyfn', oldEn: 'Deep', newEn: 'deep', cat: 'E', reason: 'Unnecessary capitalization' },
  { key: 'dyfnion', oldEn: 'Deep', newEn: 'deep', cat: 'E', reason: 'Unnecessary capitalization' },
];

for (const sf of specificFixes) {
  // Check the entry exists and hasn't already been fixed
  const entry = entryMap[sf.key];
  if (!entry) continue;

  // Check if already fixed in main pass
  const alreadyFixed = fixes.find(f => f.key === sf.key);
  if (alreadyFixed) continue;

  // Verify old values match if specified
  if (sf.oldEn && entry.en !== sf.oldEn) continue;

  const fix = { key: sf.key, category: sf.cat, reason: sf.reason };
  if (sf.newEn !== undefined) {
    fix.oldEn = entry.en;
    fix.newEn = sf.newEn;
  }
  if (sf.newPos !== undefined) {
    fix.oldPos = entry.pos;
    fix.newPos = sf.newPos;
  }
  if (fix.newEn !== undefined || fix.newPos !== undefined) {
    fixes.push(fix);
    stats[sf.cat]++;
  }
}

// ─── Dedup fixes (same key) - keep only the first ──────────────────────────
const seenKeys = new Set();
const dedupedFixes = [];
for (const f of fixes) {
  if (!seenKeys.has(f.key)) {
    seenKeys.add(f.key);
    dedupedFixes.push(f);
  }
}

// ─── Output results ─────────────────────────────────────────────────────────
console.log(`\n=== Welsh Dictionary Review Results ===`);
console.log(`Total entries: ${entries.length}`);
console.log(`Total fixes: ${dedupedFixes.length}`);
console.log(`  A: "to " on non-verbs: ${stats.A}`);
console.log(`  B: Verb form issues: ${stats.B}`);
console.log(`  C: Missing "to " on verbs: ${stats.C}`);
console.log(`  D: Garbage semicolons: ${stats.D}`);
console.log(`  E: Wrong meaning: ${stats.E}`);
console.log(`  F: Backslash-garbled: ${stats.F}`);
console.log(`  G: Truncated translations: ${stats.G}`);
console.log(`  H: Wrong POS: ${stats.H}`);
console.log(`  I: Cyrillic/non-Latin: ${stats.I}`);

// Save fixes
fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(dedupedFixes, null, 2));
console.log(`\nFixes written to ${OUTPUT_PATH}`);

// ─── Apply fixes to cy.ts ──────────────────────────────────────────────────
let modified = src;
let appliedCount = 0;

for (const fix of dedupedFixes) {
  const entry = entryMap[fix.key];
  if (!entry) continue;

  // Build regex to find this entry's line
  const escapedKey = fix.key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Match the whole entry line
  const entryRegex = new RegExp(
    `([ \\t]*['"]${escapedKey}['"]\\s*:\\s*\\{)([^}]+)(\\})`,
    'g'
  );

  const match = entryRegex.exec(modified);
  if (!match) continue;

  let body = match[2];
  let changed = false;

  // Apply en fix
  if (fix.newEn !== undefined) {
    const oldEnEscaped = (fix.oldEn || entry.en).replace(/'/g, "\\'");
    const newEnEscaped = fix.newEn.replace(/'/g, "\\'");
    const enRegex = new RegExp(`en:\\s*'${oldEnEscaped.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'`);
    if (enRegex.test(body)) {
      body = body.replace(enRegex, `en: '${newEnEscaped}'`);
      changed = true;
    }
  }

  // Apply pos fix
  if (fix.newPos !== undefined) {
    const oldPos = fix.oldPos || entry.pos;
    const posRegex = new RegExp(`pos:\\s*'${oldPos}'`);
    if (posRegex.test(body)) {
      body = body.replace(posRegex, `pos: '${fix.newPos}'`);
      changed = true;
    }
  }

  if (changed) {
    modified = modified.slice(0, match.index) + match[1] + body + match[3] + modified.slice(match.index + match[0].length);
    appliedCount++;
    // Reset regex
    entryRegex.lastIndex = 0;
  }
}

if (appliedCount > 0) {
  fs.writeFileSync(DICT_PATH, modified);
  console.log(`\nApplied ${appliedCount} fixes to cy.ts`);
} else {
  console.log('\nNo fixes applied.');
}

// Show sample fixes
console.log('\n── Sample fixes (first 30) ──');
for (const fix of dedupedFixes.slice(0, 30)) {
  const parts = [`  ${fix.key} [${fix.category}]`];
  if (fix.newEn) parts.push(`en: "${fix.oldEn}" -> "${fix.newEn}"`);
  if (fix.newPos) parts.push(`pos: "${fix.oldPos}" -> "${fix.newPos}"`);
  parts.push(`(${fix.reason})`);
  console.log(parts.join(' | '));
}
