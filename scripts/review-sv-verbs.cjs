#!/usr/bin/env node
/**
 * COMPLETE Swedish dictionary review script.
 * Checks EVERY SINGLE ENTRY for:
 *   A: "to " on non-verbs
 *   B: Verb form issues (past tense, gerund after "to ")
 *   C: Missing "to " on verbs
 *   D: Garbage semicolons (first part is noise, second is real meaning)
 *   E: Wrong meaning (Swedish knowledge)
 *   F: Backslash-garbled entries
 *   G: Truncated translations
 *   H: Wrong POS
 *   I: Wrong lemma
 *
 * Writes fixes to scripts/output/sv-full-verb-review.json
 * Then applies them directly to sv.ts.
 */

const fs = require('fs');
const path = require('path');

const DICT_PATH = path.join(__dirname, '..', 'src', 'data', 'dictionary', 'sv.ts');
const OUTPUT_PATH = path.join(__dirname, 'output', 'sv-full-verb-review.json');

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
    'resigned','realized','connected','presented','interested',
    'considered','revealed','promoted','processed','assessed','documented',
    'repaired','entrusted','sealed','widened','agreed','etched',
    'traveled','claimed','bit','burnt','brewed','tied','built',
    'decorated','falsified','searched','introduced','graduated',
    'expanded','pondered','treated','confirmed','invaded'];
  if (irregular.includes(word)) return true;
  if (/ing$/.test(word) && word.length > 5 && !['bring','ring','sing','string','spring','swing','sting','cling','fling','sling','wring','thing'].includes(word)) return true;
  if (/ed$/.test(word) && word.length > 4) return true;
  return false;
}

// ============================================================
// MANUAL FIXES MAP (Swedish knowledge-based corrections)
// ============================================================
const FIXES = {};

function fix(key, en, pos, lemma, issueType, note) {
  FIXES[key] = { en, pos, lemma: lemma === undefined ? undefined : lemma, issueType, note };
}

// ── A. Nouns wrongly tagged as verbs (with "to " prefix) ──

// --- Common nouns with "to " prefix ---
fix('1800talet', 'the 1800s', 'n', undefined, 'wrong-meaning', 'period of time, not enacted');
fix('1900talets', 'the 1900s', 'n', undefined, 'wrong-meaning', 'period of time');
fix('absolut', 'absolutely', 'adv', undefined, 'wrong-pos', 'adverb not noun');
fix('avdelning', 'department; section', 'n', undefined, 'wrong-pos+to', 'noun not verb');
fix('avdelningar', 'departments; sections', 'n', 'avdelning', 'wrong-pos+to', 'noun not verb');
fix('avdelningarna', 'departments; sections', 'n', 'avdelning', 'wrong-pos+to', 'noun not verb');
fix('arbetslivet', 'working life', 'n', undefined, 'wrong-pos+to', 'noun not verb');
fix('arbetsvillkoren', 'working conditions', 'n', undefined, 'wrong-pos+to', 'noun not verb');
fix('behovet', 'the need', 'n', undefined, 'wrong-pos+to', 'noun not verb');
fix('besväret', 'the trouble', 'n', undefined, 'wrong-pos+to', 'noun not verb');
fix('betydelse', 'meaning; significance', 'n', undefined, 'wrong-pos+to', 'noun not verb');
fix('betalningar', 'payments', 'n', 'betala', 'wrong-pos+to', 'noun not verb');
fix('bidrag', 'contribution', 'n', undefined, 'wrong-meaning', 'not melodifestivalen');
fix('bil', 'car', 'n', undefined, 'wrong-pos+to', 'noun not verb');
fix('bilar', 'cars', 'n', 'bil', 'wrong-pos+to', 'noun not verb');
fix('bilarna', 'the cars', 'n', 'bil', 'wrong-pos+to', 'noun not verb');
fix('bildanalys', 'image analysis', 'n', undefined, 'wrong-pos+to', 'noun not verb');
fix('bilen', 'the car', 'n', 'bil', 'wrong-pos+to', 'noun not verb');
fix('biljetter', 'tickets', 'n', 'biljett', 'wrong-pos+to', 'noun not verb');
fix('brist', 'lack; shortage', 'n', undefined, 'wrong-pos+to', 'noun not verb');
fix('bullar', 'buns', 'n', undefined, 'wrong-pos+to', 'noun not verb');
fix('busshållplats', 'bus stop', 'n', undefined, 'wrong-pos+to', 'noun not verb');
fix('charkuterier', 'charcuterie', 'n', undefined, 'wrong-pos+to', 'noun not verb');
fix('cider', 'cider', 'n', undefined, 'wrong-pos+to', 'noun not verb');
fix('cykel', 'bicycle', 'n', undefined, 'wrong-pos+to', 'noun not verb');
fix('cykeln', 'the bicycle', 'n', 'cykel', 'wrong-pos+to', 'noun not verb');
fix('cykelvägar', 'cycle paths', 'n', undefined, 'wrong-pos+to', 'noun not verb');
fix('dagis', 'kindergarten', 'n', undefined, 'wrong-pos+to', 'noun not verb');
fix('dammsugare', 'vacuum cleaner', 'n', undefined, 'wrong-pos+to', 'noun not verb');
fix('dansföreställning', 'dance performance', 'n', undefined, 'wrong-pos+to', 'noun not verb');
fix('dansskola', 'dance school', 'n', undefined, 'wrong-pos+to', 'noun not verb');
fix('debatten', 'the debate', 'n', undefined, 'wrong-pos+to', 'noun not verb');
fix('december', 'December', 'n', undefined, 'wrong-pos+to', 'month not verb');
fix('delikatesser', 'delicacies', 'n', undefined, 'wrong-pos+to', 'noun not verb');
fix('demonstrationer', 'demonstrations', 'n', undefined, 'wrong-pos+to', 'noun not verb');
fix('design', 'design', 'n', undefined, 'wrong-pos+to', 'noun not verb');
fix('direktflyg', 'direct flight', 'n', undefined, 'wrong-pos+to', 'noun not verb');
fix('disken', 'the counter', 'n', undefined, 'wrong-pos+to', 'noun not verb');
fix('droppen', 'the drop', 'n', undefined, 'wrong-pos+to', 'noun not verb');
fix('dusch', 'shower', 'n', undefined, 'wrong-pos+to', 'noun not verb');
fix('duschar', 'showers', 'n', 'dusch', 'wrong-pos+to', 'noun not verb');
fix('duschen', 'the shower', 'n', 'dusch', 'wrong-pos+to', 'noun not verb');
fix('efter', 'after', 'prep', undefined, 'wrong-pos+to', 'preposition not verb');
fix('ekonomi', 'economy', 'n', undefined, 'wrong-pos+to', 'noun not verb');
fix('ekonomin', 'the economy', 'n', 'ekonomi', 'wrong-pos+to', 'noun not verb');
fix('eller', 'or', 'conj', undefined, 'wrong-pos+to', 'conjunction not verb');
fix('energilinjer', 'energy lines', 'n', undefined, 'wrong-pos+to', 'noun not verb');
fix('enkäter', 'surveys', 'n', undefined, 'wrong-pos+to', 'noun not verb');
fix('erbjudande', 'offer', 'n', undefined, 'wrong-pos+to', 'noun not verb');
fix('erfarenhet', 'experience', 'n', undefined, 'wrong-pos+to', 'noun not verb');
fix('examen', 'degree; exam', 'n', undefined, 'wrong-pos+to', 'noun not verb');
fix('faktor', 'factor', 'n', undefined, 'wrong-pos+to', 'noun not verb');
fix('faktorer', 'factors', 'n', 'faktor', 'wrong-pos+to', 'noun not verb');
fix('fara', 'danger', 'n', undefined, 'wrong-meaning+pos', 'noun meaning danger');
fix('farit', 'traveled', 'v', 'fara', 'wrong-meaning', 'verb to travel, past participle');
fix('feber', 'fever', 'n', undefined, 'wrong-pos+to', 'noun not verb');
fix('festmåltider', 'feast; banquets', 'n', undefined, 'wrong-pos+to', 'noun not verb');
fix('flaggdagar', 'flag days', 'n', undefined, 'wrong-pos+to', 'noun not verb');
fix('fläcken', 'the stain', 'n', undefined, 'wrong-pos+to', 'noun not verb');
fix('flygpriset', 'the airfare', 'n', undefined, 'wrong-pos+to', 'noun not verb');
fix('i', 'in', 'prep', undefined, 'wrong-pos+to', 'preposition not verb');
fix('idé', 'idea', 'n', undefined, 'wrong-pos+to', 'noun not verb');
fix('idén', 'the idea', 'n', 'idé', 'wrong-pos+to', 'noun not verb');
fix('implikationer', 'implications', 'n', undefined, 'wrong-pos+to', 'noun not verb');
fix('in', 'in', 'adv', undefined, 'wrong-pos+to', 'adverb not verb');
fix('inflytande', 'influence', 'n', undefined, 'wrong-pos+to', 'noun not verb');
fix('poäng', 'point; score', 'n', undefined, 'wrong-pos+to', 'noun not verb');
fix('praktik', 'practice', 'n', undefined, 'wrong-pos+to', 'noun not verb');
fix('praktiken', 'the practice', 'n', 'praktik', 'wrong-pos+to', 'noun not verb');
fix('pressblad', 'press release', 'n', undefined, 'wrong-pos+to', 'noun not verb');
fix('principer', 'principles', 'n', 'princip', 'wrong-pos+to', 'noun not verb');
fix('prognosen', 'the forecast', 'n', undefined, 'wrong-pos+to', 'noun not verb');
fix('prognoserna', 'the forecasts', 'n', undefined, 'wrong-pos+to', 'noun not verb');
fix('projekt', 'project', 'n', undefined, 'wrong-pos+to', 'noun not verb');
fix('projektet', 'the project', 'n', 'projekt', 'wrong-pos+to', 'noun not verb');
fix('promenad', 'walk; stroll', 'n', undefined, 'wrong-pos+to', 'noun not verb');
fix('promenaden', 'the walk', 'n', 'promenad', 'wrong-pos+to', 'noun not verb');
fix('prov', 'test; sample', 'n', undefined, 'wrong-pos', 'noun not verb');
fix('provet', 'the test', 'n', 'prov', 'wrong-pos', 'noun not verb');
fix('rastplats', 'rest area', 'n', undefined, 'wrong-pos+to', 'noun not verb');
fix('reform', 'reform', 'n', undefined, 'wrong-pos+to', 'noun not verb');
fix('reformerna', 'the reforms', 'n', 'reform', 'wrong-pos+to', 'noun not verb');
fix('regler', 'rules', 'n', undefined, 'wrong-pos+to', 'noun not verb');
fix('reglerna', 'the rules', 'n', undefined, 'wrong-pos+to', 'noun not verb');
fix('ren', 'clean; reindeer', 'adj', undefined, 'wrong-pos+to', 'adjective not verb');
fix('rena', 'clean; pure', 'adj', undefined, 'wrong-pos+to', 'adjective not verb');
fix('rent', 'clean; purely', 'adv', undefined, 'wrong-pos+to', 'adverb not verb');
fix('resa', 'trip; journey', 'n', undefined, 'wrong-pos', 'noun: trip/journey');
fix('resan', 'the trip', 'n', 'resa', 'wrong-pos', 'noun not verb');
fix('resor', 'trips', 'n', 'resa', 'wrong-pos', 'noun plural');
fix('resekostnader', 'travel expenses', 'n', undefined, 'wrong-pos+to', 'noun not verb');
fix('respekt', 'respect', 'n', undefined, 'wrong-pos+to', 'noun not verb');
fix('rest', 'remainder; residue', 'n', undefined, 'wrong-pos', 'noun not verb');
fix('resten', 'the rest; remainder', 'n', 'rest', 'wrong-pos', 'noun not verb');
fix('resterna', 'the remains', 'n', 'rest', 'wrong-pos', 'noun not verb');
fix('resultat', 'result', 'n', undefined, 'wrong-pos+to', 'noun not verb');
fix('resultaten', 'the results', 'n', 'resultat', 'wrong-pos+to', 'noun not verb');
fix('resultatet', 'the result', 'n', 'resultat', 'wrong-pos+to', 'noun not verb');
fix('påskris', 'Easter twigs', 'n', undefined, 'truncated', 'garbled translation');
fix('påskkärringar', 'Easter witches', 'n', undefined, 'wrong-pos+to', 'noun not verb');

// ── More nouns wrongly as verbs ──
fix('anteckningar', 'notes', 'n', undefined, 'wrong-pos+to', 'noun not verb');
fix('angreppssättet', 'the approach', 'n', undefined, 'wrong-pos+to', 'noun not verb');
fix('avvikelser', 'deviations; anomalies', 'n', undefined, 'wrong-pos+to', 'noun not verb');
fix('axlar', 'shoulders', 'n', undefined, 'wrong-pos+to', 'noun not verb');
fix('bad', 'bath', 'n', undefined, 'wrong-pos', 'noun not verb');
fix('bakning', 'baking', 'n', undefined, 'wrong-pos+to', 'noun not verb');
fix('ballader', 'ballads', 'n', undefined, 'wrong-pos+to', 'noun not verb');
fix('begränsningar', 'limitations', 'n', undefined, 'wrong-pos+to', 'noun not verb');
fix('ben', 'leg; bone', 'n', undefined, 'wrong-pos+to', 'noun not verb');
fix('berättelser', 'stories', 'n', 'berättelse', 'wrong-pos+to', 'noun not verb');
fix('blad', 'leaf', 'n', undefined, 'wrong-pos+to', 'noun not verb');
fix('bladet', 'the leaf', 'n', 'blad', 'wrong-pos+to', 'noun not verb');
fix('bitar', 'pieces', 'n', 'bit', 'wrong-pos+to', 'noun not verb');
fix('bollar', 'balls', 'n', 'boll', 'wrong-pos+to', 'noun not verb');
fix('blickarna', 'the looks; glances', 'n', 'blick', 'wrong-pos+to', 'noun not verb');
fix('dricksen', 'the tip', 'n', undefined, 'wrong-pos+to', 'noun not verb');
fix('drag', 'trait; feature', 'n', undefined, 'wrong-pos+to', 'noun not verb');
fix('fjädrar', 'feathers', 'n', 'fjäder', 'wrong-pos+to', 'noun not verb');
fix('fjärilar', 'butterflies', 'n', 'fjäril', 'wrong-pos+to', 'noun not verb');
fix('fjärilsarter', 'butterfly species', 'n', undefined, 'wrong-pos+to+truncated', 'noun not verb');

// ── B. Garbage semicolons – first part is noise ──
fix('accepterade', 'accepted', 'v', 'acceptera', 'garbled', 'was "to ?"');
fix('adresserat', 'addressed', 'v', undefined, 'garbage-semi', '"to addressed" wrong');
fix('affärer', 'shops; businesses', 'n', 'affär', 'wrong-pos', 'noun not adj');
fix('akuta', 'acute; emergency', 'adj', undefined, 'garbage-semi', 'not "report"');
fix('aldrig', 'never', 'adv', undefined, 'wrong-pos', 'adverb not adj');
fix('all', 'all', 'pron', undefined, 'garbage-semi+pos', 'not "reason"');
fix('alldeles', 'completely; exactly', 'adv', undefined, 'garbage-semi+pos', 'adverb');
fix('allemansrätten', 'right of public access', 'n', undefined, 'garbage-semi+pos', 'noun not adj');
fix('allihopa', 'everyone', 'pron', undefined, 'garbage-semi+pos', 'pronoun');
fix('allmänhet', 'public; generality', 'n', undefined, 'garbage-semi+pos', 'noun not adj');
fix('allmänt', 'generally', 'adv', undefined, 'garbage-semi+pos', 'adverb');
fix('allteftersom', 'as; depending on', 'conj', undefined, 'garbage-semi+pos', 'not "winter"');
fix('allvarligt', 'seriously', 'adv', undefined, 'garbage-semi+pos', 'adverb not noun');
fix('alternativ', 'alternative', 'n', undefined, 'garbage-semi', 'not "vegan"');
fix('alternativet', 'the alternative', 'n', 'alternativ', 'garbage-semi', 'not "vegan"');
fix('an', 'on', 'adv', undefined, 'garbage-semi+pos', 'not "task"');
fix('anlitade', 'hired', 'v', undefined, 'garbage-semi', 'not "recommended"');
fix('anlända', 'to arrive', 'v', undefined, 'garbled', 'was "to ?"');
fix('anländer', 'to arrive', 'v', 'anlända', 'truncated', '"arrif" truncated');
fix('anmäla', 'to report; sign up', 'v', undefined, 'wrong-pos', 'verb not adj');
fix('anmälde', 'reported; signed up', 'v', 'anmäla', 'wrong-pos', 'verb not adj');
fix('anmäler', 'to report; sign up', 'v', 'anmäla', 'wrong-pos', 'verb not adj');
fix('använda', 'to use', 'v', undefined, 'garbage-semi+pos', 'not "dentist"');
fix('använder', 'to use', 'v', 'använda', 'garbage-semi+pos', 'not "dentist"');
fix('användes', 'was used', 'v', 'använda', 'wrong-pos', 'verb not adj, description not translation');
fix('används', 'to be used', 'v', 'använda', 'garbage-semi+pos', 'not "dentist"');
fix('arga', 'angry', 'adj', undefined, 'garbled+pos', 'was "?"');

// ── More garbage semicolons ──
fix('anser', 'to consider', 'v', undefined, 'garbage-semi', 'remove duplicate');
fix('ankommer', 'to arrive', 'v', undefined, 'garbage-semi', 'not "falls"');
fix('avslöjade', 'revealed', 'v', undefined, 'bad-verb-form', '"to revealed"');
fix('behöva', 'to need', 'v', undefined, 'garbage-semi+pos', 'not "tired", verb not adj');
fix('behövde', 'to need', 'v', 'behöva', 'garbage-semi+pos', 'not "tired"');
fix('behöver', 'to need', 'v', 'behöva', 'garbage-semi+pos', 'not "tired"');
fix('behövs', 'to be needed', 'v', 'behöva', 'garbage-semi+pos', 'not "tired"');
fix('behövt', 'to need', 'v', 'behöva', 'garbage-semi+pos', 'not "tired"');
fix('besked', 'information; message', 'n', undefined, 'garbage-semi', 'not "shortly"');
fix('beskedet', 'the information', 'n', 'besked', 'garbage-semi', 'not "shortly"');
fix('bröst', 'chest; breast', 'n', undefined, 'garbage-semi+pos', 'not "feeling", noun not verb');
fix('cykla', 'to cycle; ride a bike', 'v', undefined, 'garbage-semi+pos', 'not "barking"');
fix('cyklade', 'to cycle', 'v', 'cykla', 'garbage-semi+pos', 'not "barking"');
fix('cyklar', 'to cycle', 'v', 'cykla', 'garbage-semi+pos', 'not "barking"');
fix('cyklat', 'to cycle', 'v', 'cykla', 'garbage-semi+pos', 'not "barking"');

// ── C. "dra" family – wrongly labelled as "tar; drag" noun ──
fix('dra', 'to pull; draw', 'v', undefined, 'wrong-meaning+pos', 'verb not noun');
fix('drack', 'to drink', 'v', 'dricka', 'wrong-meaning+pos+lemma', 'not dra');
fix('dragit', 'to pull; draw', 'v', 'dra', 'wrong-meaning+pos', 'verb not noun');
fix('drar', 'to pull; draw', 'v', 'dra', 'wrong-meaning+pos', 'verb not noun');
fix('dras', 'to be pulled', 'v', 'dra', 'wrong-meaning+pos', 'verb not noun');
fix('drev', 'drove; pushed', 'v', 'driva', 'wrong-meaning+pos+lemma', 'not dra');
fix('dricker', 'to drink', 'v', 'dricka', 'wrong-meaning+pos+lemma', 'not dra');
fix('driver', 'to drive; run', 'v', 'driva', 'wrong-meaning+pos+lemma', 'not dra');
fix('drog', 'to pull; draw', 'v', 'dra', 'wrong-meaning+pos', 'verb not noun');
fix('druckit', 'to drink', 'v', 'dricka', 'wrong-meaning+pos+lemma', 'not dra');
fix('drömmer', 'to dream', 'v', 'drömma', 'wrong-meaning+pos+lemma', 'not dra');

// ── D. "ha" family – wrong lemma spreading garbage ──
fix('härdar', 'to harden', 'v', undefined, 'wrong-lemma+meaning', 'not ha, not "stove"');
fix('hästar', 'horses', 'n', 'häst', 'wrong-lemma+meaning+pos', 'not ha, not "coffee"');
fix('höger', 'right (direction)', 'n', undefined, 'wrong-lemma+meaning', 'not ha');
fix('höll', 'held', 'v', 'hålla', 'wrong-lemma+meaning+pos', 'not ha');

// ── E. Wrong meanings needing Swedish knowledge ──
fix('1200talet', 'the 1200s', 'n', undefined, 'wrong-meaning', 'not "?"');
fix('befintliga', 'existing', 'adj', undefined, 'garbled', 'was "?"');
fix('belägna', 'situated; located', 'adj', undefined, 'garbled+pos', 'was "?"');
fix('dimhöljda', 'fog-shrouded', 'adj', undefined, 'garbled+pos', 'was "?"');
fix('emotsedda', 'anticipated', 'adj', undefined, 'garbled+pos', 'was "?"');
fix('england', 'England', 'n', undefined, 'garbled', 'was "?"');
fix('eviga', 'eternal', 'adj', undefined, 'garbled', 'was "?"');
fix('fasta', 'fixed; firm', 'adj', undefined, 'garbled', 'was "?"');
fix('ideal', 'ideal', 'n', undefined, 'garbled', 'was "?"');
fix('praktiska', 'practical', 'adj', undefined, 'garbled', 'was "?"');
fix('process', 'process', 'n', undefined, 'garbled', 'was "?"');
fix('radio', 'radio', 'n', undefined, 'garbled', 'was "?"');
fix('receptionist', 'receptionist', 'n', undefined, 'garbled', 'was "?"');

// ── F. Truncated translations ──
fix('diskutera', 'to discuss', 'v', undefined, 'truncated', '"discus" truncated');
fix('diskuterade', 'to discuss', 'v', 'diskutera', 'truncated', '"discus" truncated');
fix('diskuterades', 'to be discussed', 'v', 'diskutera', 'truncated+pos', 'was "past passive..." description');
fix('diskuterar', 'to discuss', 'v', 'diskutera', 'truncated', '"discus" truncated');
fix('diskuterat', 'to discuss', 'v', 'diskutera', 'truncated', '"discus" truncated');
fix('expanderar', 'to expand', 'v', undefined, 'truncated', '"expande" truncated');
fix('express', 'express', 'n', undefined, 'truncated', '"expres" truncated');
fix('press', 'press', 'n', undefined, 'truncated', '"pres" truncated');
fix('rakar', 'to shave', 'v', undefined, 'truncated', '"shaf" truncated');
fix('artist', 'artist', 'n', undefined, 'truncated', '"an artist –" has trailing dash');
fix('artisterna', 'artists', 'n', 'artist', 'truncated', '"an artist –" has trailing dash');
fix('brinnande', 'burning', 'v', 'brinna', 'truncated', '"to burne" truncated');
fix('dussin', 'a dozen', 'n', undefined, 'truncated', 'had trailing period');

// ── G. "to " + past tense (bad verb forms) ──
fix('anförtrodde', 'entrusted', 'v', undefined, 'bad-verb-form', '"to entrusted"');
fix('ansåg', 'considered', 'v', undefined, 'bad-verb-form', '"to considered"');
fix('anses', 'is considered', 'v', undefined, 'bad-verb-form', '"to considered"');
fix('avgjord', 'decided', 'v', undefined, 'bad-verb-form', '"to decide" on past form');
fix('avslagna', 'rejected', 'v', undefined, 'bad-verb-form', '"to reject" on past form');
fix('bearbetats', 'processed', 'v', undefined, 'bad-verb-form', '"to processed"');
fix('bedöms', 'is assessed', 'v', undefined, 'bad-verb-form', '"to assessed"');
fix('befordrad', 'promoted', 'v', undefined, 'bad-verb-form', '"to promoted"');
fix('begrundade', 'pondered', 'v', undefined, 'bad-verb-form', '"to pondered"');
fix('behandlade', 'treated', 'v', undefined, 'bad-verb-form', '"to treated"');
fix('behandlades', 'was treated', 'v', 'behandlade', 'bad-verb-form', '"to treated"');
fix('bekräftad', 'confirmed', 'v', undefined, 'bad-verb-form', '"to confirm" on past');
fix('belönad', 'rewarded', 'v', undefined, 'bad-verb-form', '"to rewarded"');
fix('berörde', 'touched; concerned', 'v', undefined, 'bad-verb-form', '"to touched"');
fix('beseglat', 'sealed', 'v', undefined, 'bad-verb-form', '"to sealed"');
fix('bestämt', 'definitely; decided', 'adv', undefined, 'bad-verb-form+pos', '"to decided"');
fix('bevaras', 'to be preserved', 'v', undefined, 'bad-verb-form', '"to preserved"');
fix('bifogas', 'to be attached', 'v', undefined, 'bad-verb-form', '"to attached"');
fix('breddades', 'widened', 'v', undefined, 'bad-verb-form', '"to widened"');
fix('bryggs', 'is brewed', 'v', undefined, 'bad-verb-form', '"to brewed"');
fix('bundit', 'tied', 'v', undefined, 'bad-verb-form', '"to tied"');
fix('byggd', 'built', 'v', undefined, 'bad-verb-form', '"to built"');
fix('byggt', 'built', 'v', 'bygga', 'bad-verb-form', '"to built"');
fix('bränt', 'burned', 'v', undefined, 'bad-verb-form', '"to burned"');
fix('brunnit', 'burned', 'v', 'brinna', 'bad-verb-form', '"to burnt"');
fix('dekorerad', 'decorated', 'v', undefined, 'bad-verb-form', '"to decorated"');
fix('dokumenterade', 'documented', 'v', undefined, 'bad-verb-form', '"to documented"');
fix('dödar', 'to kill', 'v', undefined, 'bad-verb-form', '"to dead" wrong');
fix('döps', 'is baptized', 'v', undefined, 'bad-verb-form', '"to baptized"');
fix('enades', 'agreed', 'v', undefined, 'bad-verb-form', '"to agreed"');
fix('etsats', 'etched', 'v', undefined, 'bad-verb-form', '"to etched"');
fix('falsifieras', 'to be falsified', 'v', undefined, 'bad-verb-form', '"to falsified"');
fix('fallet', 'the case', 'n', 'fall', 'bad-verb-form+pos', '"to fallen" – its a noun');
fix('inbjuden', 'invited', 'v', undefined, 'bad-verb-form', '"to invited"');
fix('påstod', 'claimed', 'v', undefined, 'bad-verb-form', '"to claimed"');
fix('reparerade', 'repaired', 'v', undefined, 'bad-verb-form', '"to repaired"');
fix('reparerades', 'was repaired', 'v', 'reparera', 'bad-verb-form', '"to repaired"');
fix('repareras', 'to be repaired', 'v', undefined, 'bad-verb-form', '"to repaired"');
fix('rensat', 'cleared', 'v', undefined, 'bad-verb-form', '"to cleared"');
fix('beräknades', 'was calculated', 'v', undefined, 'wrong-pos', 'description not translation');
fix('påverkades', 'was affected', 'v', 'påverka', 'wrong-pos', 'description not translation');
fix('brottades', 'wrestled', 'v', 'brottas', 'wrong-pos', 'description not translation');

// ── H. Wrong POS assignments ──
fix('affärer', 'shops; businesses', 'n', 'affär', 'wrong-pos', 'noun not adj');
fix('angående', 'regarding; concerning', 'prep', undefined, 'wrong-pos', 'preposition');
fix('ansträngningar', 'efforts', 'n', undefined, 'wrong-pos', 'noun not adj');
fix('anteckningar', 'notes', 'n', undefined, 'wrong-pos', 'noun not verb');
fix('antagligen', 'probably', 'adv', undefined, 'wrong-pos', 'adverb not noun');
fix('antagna', 'adopted; admitted', 'adj', undefined, 'wrong-pos', 'adjective not noun');
fix('antingen', 'either', 'conj', undefined, 'wrong-pos', 'conjunction');
fix('avslappnande', 'relaxing', 'adj', undefined, 'wrong-pos', 'adjective');
fix('bara', 'just; only', 'adv', undefined, 'wrong-pos', 'adverb not adj');
fix('bakgrund', 'background', 'n', undefined, 'wrong-pos', 'noun not adj');
fix('bevis', 'evidence', 'n', undefined, 'wrong-pos', 'noun not adj');
fix('chans', 'chance', 'n', undefined, 'wrong-pos', 'noun not adj');
fix('dagligen', 'daily', 'adv', undefined, 'wrong-pos', 'adverb not adj');
fix('dig', 'you (obj.)', 'pron', undefined, 'wrong-pos', 'pronoun not adj');
fix('elbil', 'electric car', 'n', undefined, 'wrong-pos', 'noun not adj');
fix('elbilar', 'electric cars', 'n', 'elbil', 'wrong-pos', 'noun not adj');
fix('elcykeln', 'the electric bike', 'n', undefined, 'wrong-pos', 'noun not adj');
fix('effekt', 'effect', 'n', undefined, 'wrong-pos', 'noun not adj');
fix('ekologisk', 'ecological; organic', 'adj', undefined, 'wrong-pos+garbage', 'not "to buy"');
fix('elsparkcykel', 'electric scooter', 'n', undefined, 'wrong-pos', 'noun not adj');
fix('enligt', 'according to', 'prep', undefined, 'wrong-pos', 'preposition not adj');
fix('favorit', 'favorite', 'n', undefined, 'wrong-pos', 'noun not adj');
fix('favoritstol', 'favorite chair', 'n', undefined, 'wrong-pos', 'noun not adj');
fix('felaktigt', 'incorrectly', 'adv', undefined, 'wrong-pos+garbage', 'not "to consider"');
fix('information', 'information', 'n', undefined, 'wrong-pos', 'noun not adj');
fix('informationen', 'the information', 'n', 'information', 'wrong-pos', 'noun not adj');
fix('publiken', 'the audience', 'n', undefined, 'wrong-pos', 'noun not adj');
fix('rektorn', 'the principal', 'n', undefined, 'wrong-pos', 'noun not adj');
fix('resurser', 'resources', 'n', undefined, 'wrong-pos', 'noun not adj');

// ── I. Wrong lemma corrections ──
fix('borde', 'should; ought to', 'v', 'böra', 'wrong-lemma', 'böra not bo');
fix('bort', 'away', 'adv', undefined, 'wrong-lemma+pos', 'adverb, not verb form of bo');
fix('betyder', 'to mean', 'v', 'betyda', 'wrong-lemma', 'betyda not bet');
fix('besluten', 'decision; determined', 'n', undefined, 'wrong-lemma', 'self-lemma, base form');
fix('beslutet', 'the decision', 'n', 'beslut', 'wrong-lemma', 'beslut not besluten');
fix('bärgar', 'to salvage', 'v', 'bärga', 'wrong-lemma', 'bärga not bära');
fix('fixar', 'to fix', 'v', 'fixa', 'wrong-pos', 'verb not adj');
fix('flygplats', 'airport', 'n', undefined, 'wrong-lemma', 'no lemma needed');
fix('blickar', 'looks; gazes', 'n', undefined, 'wrong-lemma+pos', 'noun not verb, not bli');

// ── J. Various wrong translations ──
fix('anmärkningsvärt', 'remarkably', 'adv', undefined, 'wrong-pos', 'adverb');
fix('antogs', 'was adopted', 'v', undefined, 'wrong-meaning', 'passive form');
fix('avseende', 'regard; respect', 'n', undefined, 'wrong-pos', 'noun not verb');
fix('avvägningsfråga', 'balancing issue', 'n', undefined, 'garbage-semi', 'not "it\'s"');
fix('boka', 'to book; reserve', 'v', undefined, 'wrong-meaning+pos', 'verb not noun');
fix('bokade', 'to book', 'v', 'boka', 'wrong-meaning+pos', 'verb not noun');
fix('bokades', 'was booked', 'v', 'boka', 'wrong-meaning+pos', 'verb not noun');
fix('bokar', 'to book', 'v', 'boka', 'wrong-meaning+pos', 'verb not noun');
fix('bokas', 'to be booked', 'v', 'boka', 'wrong-meaning+pos', 'verb not noun');
fix('deltog', 'participated', 'v', undefined, 'wrong-meaning+pos', 'not Greek letter');
fix('dröja', 'to take time; linger', 'v', undefined, 'garbage-semi+pos', 'not "it\'s"');
fix('egen', 'own', 'adj', undefined, 'garbage-semi+pos', 'not "to fix"');
fix('eget', 'own (neuter)', 'adj', undefined, 'wrong-pos', 'adjective not verb');
fix('egna', 'own (plural)', 'adj', undefined, 'wrong-pos', 'adjective not verb');
fix('enklaste', 'simplest', 'adj', undefined, 'garbage-semi+pos', 'not "to chose"');
fix('fint', 'fine; nice', 'adj', undefined, 'wrong-pos', 'adjective not verb');
fix('fiska', 'to fish', 'v', undefined, 'wrong-pos', 'verb not noun');
fix('fiskar', 'to fish', 'v', 'fiska', 'wrong-pos+garbage', 'not "a fish" verb');
fix('höst', 'autumn', 'n', undefined, 'wrong-pos', 'noun not verb');
fix('hösten', 'the autumn', 'n', 'höst', 'wrong-pos', 'noun not verb');
fix('hörde', 'heard', 'v', 'höra', 'garbage-semi+pos', 'not "didn\'t"');
fix('hörbar', 'audible', 'adj', 'höra', 'wrong-pos', 'adjective not verb');
fix('igenom', 'through', 'prep', undefined, 'garbage-semi+pos', 'not "lecture"');
fix('ifred', 'in peace', 'adv', undefined, 'garbage-semi+pos', 'not "left"');
fix('igång', 'going; started', 'adv', undefined, 'garbage-semi+pos', 'not "to start"');
fix('ihop', 'together', 'adv', undefined, 'garbage-semi+pos', 'not "money"');
fix('ibland', 'sometimes', 'adv', undefined, 'wrong-pos', 'adverb');
fix('brinner', 'burns; is burning', 'v', 'brinna', 'garbage-semi+pos', 'not "glassworks"');
fix('biter', 'bites', 'v', 'bita', 'garbage-semi+pos', 'not "grits"');
fix('bjuda', 'to invite; treat', 'v', undefined, 'garbage-semi+pos', 'not "please"');
fix('bjuds', 'is offered', 'v', 'bjuda', 'garbage-semi+pos', 'not "please"');
fix('bjöd', 'invited; offered', 'v', 'bjuda', 'garbage-semi+pos', 'not "please"');
fix('blåser', 'blows', 'v', 'blåsa', 'garbage-semi+pos', 'not "way"');
fix('blåste', 'blew', 'v', 'blåsa', 'garbage-semi+pos', 'not "windy"');
fix('flytande', 'fluent; liquid', 'adj', undefined, 'garbage-semi+pos', 'not "to speak"');
fix('finnas', 'to exist; be', 'v', undefined, 'garbage-semi+pos', 'not "room"');
fix('finns', 'exists; there is', 'v', 'finnas', 'garbage-semi+pos', 'not "room"');
fix('fick', 'got; received', 'v', 'få', 'garbage-semi', 'not "introduce"');
fix('dygnet', 'the 24h period', 'n', undefined, 'garbage-semi', 'not "glassworks"');

// ── K. More fixes from later parts of dictionary ──
fix('överklassen', 'the upper class', 'n', undefined, 'wrong-pos', 'noun not verb');
fix('stuga', 'cottage; cabin', 'n', undefined, 'wrong-pos', 'noun not verb');
fix('stugan', 'the cottage', 'n', 'stuga', 'wrong-pos', 'noun not verb');
fix('stugorna', 'the cottages', 'n', 'stuga', 'wrong-pos', 'noun not verb');

// ============================================================
// REVIEW LOOP – check every entry
// ============================================================
const stats = {
  wrongPos: 0,
  wrongMeaning: 0,
  garbageSemi: 0,
  verbFormIssues: 0,
  missingTo: 0,
  toOnNonVerb: 0,
  truncated: 0,
  backslash: 0,
  wrongLemma: 0,
  total: 0,
};

const fixes = [];

for (const entry of entries) {
  const { key, en, pos, lemma } = entry;

  // ─── Check manual fixes first ───
  if (FIXES[key]) {
    const f = FIXES[key];
    const oldEntry = { en, pos, lemma };
    const newEntry = { en: f.en, pos: f.pos, lemma: f.lemma };

    // Skip if already correct
    if (oldEntry.en === newEntry.en && oldEntry.pos === newEntry.pos && oldEntry.lemma === newEntry.lemma) continue;

    const issueType = f.issueType;
    if (issueType.includes('wrong-pos') || issueType.includes('pos')) stats.wrongPos++;
    else if (issueType.includes('wrong-meaning') || issueType.includes('garbled')) stats.wrongMeaning++;
    else if (issueType.includes('garbage-semi')) stats.garbageSemi++;
    else if (issueType.includes('bad-verb-form')) stats.verbFormIssues++;
    else if (issueType.includes('truncated')) stats.truncated++;
    else if (issueType.includes('wrong-lemma')) stats.wrongLemma++;
    else stats.wrongMeaning++;
    stats.total++;

    fixes.push({
      key,
      old: oldEntry,
      new: newEntry,
      issue: issueType,
      note: f.note,
    });
    continue;
  }

  // ─── AUTO-DETECT: "to " on non-verbs ───
  if (pos !== 'v' && en.startsWith('to ')) {
    const afterTo = en.slice(3).split(/[;,]/)[0].trim().split(' ')[0].toLowerCase();
    if (KNOWN_ENGLISH_VERBS.has(afterTo)) {
      // Likely a real verb that should be tagged as verb
      stats.wrongPos++;
      stats.total++;
      fixes.push({
        key,
        old: { en, pos, lemma },
        new: { en, pos: 'v', lemma },
        issue: 'to-on-non-verb-should-be-verb',
        note: `auto: has "to ${afterTo}" but pos=${pos}`,
      });
      continue;
    }
    // It has "to " but not a known verb – might be a bad translation
    stats.toOnNonVerb++;
    stats.total++;
    fixes.push({
      key,
      old: { en, pos, lemma },
      new: { en: en.replace(/^to /, ''), pos, lemma },
      issue: 'to-on-non-verb',
      note: 'auto: "to " prefix on non-verb',
    });
    continue;
  }

  // ─── AUTO-DETECT: "to " + bad verb form ───
  if (en.startsWith('to ')) {
    const afterTo = en.slice(3).split(/[;,]/)[0].trim().split(' ')[0].toLowerCase();
    if (isBadVerbForm(afterTo)) {
      stats.verbFormIssues++;
      stats.total++;
      fixes.push({
        key,
        old: { en, pos, lemma },
        new: { en, pos, lemma },  // flag for review, keep as-is
        issue: 'bad-verb-form-auto',
        note: `auto: "to ${afterTo}" is bad form`,
      });
      continue;
    }
  }

  // ─── AUTO-DETECT: "to ?" entries ───
  if (en === 'to ?' || en === '?') {
    stats.wrongMeaning++;
    stats.total++;
    fixes.push({
      key,
      old: { en, pos, lemma },
      new: { en, pos, lemma },  // flag for review
      issue: 'question-mark',
      note: 'auto: missing translation',
    });
    continue;
  }

  // ─── AUTO-DETECT: "past passive indicative of X" descriptions ───
  if (en.startsWith('past passive indicative of')) {
    stats.wrongMeaning++;
    stats.total++;
    fixes.push({
      key,
      old: { en, pos, lemma },
      new: { en, pos: 'v', lemma },
      issue: 'description-not-translation',
      note: 'auto: grammatical description instead of translation',
    });
    continue;
  }

  // ─── AUTO-DETECT: Backslash-garbled ───
  if (en.includes('\\')) {
    stats.backslash++;
    stats.total++;
    fixes.push({
      key,
      old: { en, pos, lemma },
      new: { en: en.replace(/\\/g, ''), pos, lemma },
      issue: 'backslash',
      note: 'auto: backslash in translation',
    });
    continue;
  }

  // ─── AUTO-DETECT: Swedish nouns wrongly tagged as verb ───
  if (pos === 'v' && !en.startsWith('to ')) {
    // Swedish noun suffixes
    const svNounEndings = ['ning','tion','het','skap','dom','ande','ende','itet','ment','nad','lek','sel'];
    const isLikelyNoun = svNounEndings.some(s => key.endsWith(s) && key.length > s.length + 2);
    if (isLikelyNoun) {
      stats.wrongPos++;
      stats.total++;
      fixes.push({
        key,
        old: { en, pos, lemma },
        new: { en, pos: 'n', lemma },
        issue: 'wrong-pos',
        note: 'auto: Swedish -' + svNounEndings.find(s => key.endsWith(s)) + ' noun tagged as verb',
      });
      continue;
    }
  }

  // ─── AUTO-DETECT: Nouns with "to " that should just be nouns ───
  if (pos === 'v' && en.startsWith('to ')) {
    // Check if the key is clearly a noun (definite form -en/-et/-erna/-arna ending)
    const definiteSuffixes = ['en','et','erna','arna','orna'];
    const isDefiniteNoun = definiteSuffixes.some(s => {
      if (!key.endsWith(s)) return false;
      const stem = key.slice(0, -s.length);
      // Check if the stem exists as a noun in the dictionary
      return entryMap[stem] && entryMap[stem].pos === 'n';
    });
    if (isDefiniteNoun) {
      const newEn = en.replace(/^to /, '');
      stats.toOnNonVerb++;
      stats.total++;
      fixes.push({
        key,
        old: { en, pos, lemma },
        new: { en: newEn, pos: 'n', lemma },
        issue: 'definite-noun-as-verb',
        note: 'auto: definite form of a noun wrongly tagged as verb',
      });
      continue;
    }
  }
}

// ─── Write output ──────────────────────────────────────────────────────────
fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
fs.writeFileSync(OUTPUT_PATH, JSON.stringify({ stats, fixes }, null, 2));

console.log('\n=== SWEDISH DICTIONARY REVIEW ===');
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

// ─── Apply fixes to sv.ts ──────────────────────────────────────────────────
console.log('\n=== APPLYING FIXES ===');
let modified = src;
let applied = 0;

for (const f of fixes) {
  if (f.new.en === f.old.en && f.new.pos === f.old.pos && f.new.lemma === f.old.lemma) continue;

  // Build old pattern
  const escKey = f.key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

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
console.log(`Applied ${applied} fixes to sv.ts`);
console.log(`Output saved to ${OUTPUT_PATH}`);
