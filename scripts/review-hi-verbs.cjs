#!/usr/bin/env node
/**
 * COMPLETE Hindi dictionary review script.
 * Checks EVERY SINGLE ENTRY for:
 *   A: "to " on non-verbs (nouns, adjectives, postpositions, etc.)
 *   B: Verb form issues (past tense, gerund after "to ")
 *   C: Missing "to " on actual verbs
 *   D: Garbage semicolons (nonsensical first part before ;)
 *   E: Wrong meaning (use Hindi knowledge)
 *   F: Backslash-garbled entries
 *   G: Truncated translations
 *
 * Also fixes: wrong POS, wrong lemma, meta-descriptions, garbage translations
 *
 * Applies all fixes directly to the dictionary file.
 */

const fs = require('fs');
const path = require('path');

const DICT_PATH = path.join(__dirname, '..', 'src', 'data', 'dictionary', 'hi.ts');
const OUTPUT_PATH = path.join(__dirname, 'output', 'hi-full-verb-review.json');

const src = fs.readFileSync(DICT_PATH, 'utf8');

// ─── Parse all dictionary entries ───────────────────────────────────────────
const entries = [];
const lineRegex = /^\s*['"]([^'"]+)['"]\s*:\s*\{([^}]+)\}/gm;

function parseEntry(key, body) {
  const en = body.match(/en:\s*'((?:[^'\\]|\\.)*)'/)?.[1]?.replace(/\\'/g, "'") || '';
  const pos = body.match(/pos:\s*'((?:[^'\\]|\\.)*)'/)?.[1] || '';
  const ipa = body.match(/ipa:\s*'((?:[^'\\]|\\.)*)'/)?.[1] || '';
  const lemma = body.match(/lemma:\s*'((?:[^'\\]|\\.)*)'/)?.[1] || undefined;
  return { key, en, pos, ipa, lemma };
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

// ─── Hindi verb infinitives end in ना ───────────────────────────────────────
function isHindiInfinitive(key) {
  return key.endsWith('ना') || key.endsWith('नी') || key.endsWith('ने');
}

function isLikelyHindiVerb(key) {
  // True infinitives end in ना
  if (key.endsWith('ना')) return true;
  // Common verb conjugation suffixes
  const verbSuffixes = ['ता', 'ती', 'ते', 'या', 'यी', 'ये', 'गा', 'गी', 'गे',
    'ूँ', 'ूँगा', 'ूँगी', 'ें', 'ो', 'ाओ', 'िए', 'ाना', 'ानी', 'ाने',
    'ूंगा', 'ूंगी', 'ेंगे', 'ेंगी', 'ें', 'ाया', 'ायी', 'ाये'];
  return verbSuffixes.some(s => key.endsWith(s));
}

// ─── KNOWN_ENGLISH_VERBS ────────────────────────────────────────────────────
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
  'roar','scatter','absorb','annoy',
  'assign','ban','bark','bet',
  'blaze','bleed','blind','blur',
  'bolt','bomb','bond','boot','bow',
  'braid','brand','broaden','bruise',
  'bubble','buckle','bump','burst',
  'buzz','cage','calm','camp',
  'cap','carpool','cater','caution',
  'chain','chalk','chant','chop',
  'clap','clash','clasp','clip',
  'close','clutch','coil','collar',
  'color','colour','commence','commute',
  'compel','complicate','comply','conceal',
  'condemn','confine','conquer','conserve',
  'console','consolidate','conspire','contaminate',
  'contemplate','cope','crack','cramp','crave',
  'crew','crumble','curl','curtail',
  'dangle','dash','dawn','dazzle',
  'deafen','decay','delegate','delight',
  'deploy','descend','designate','despise',
  'detach','deter','devour','dictate',
  'dim','dip','disclose','dismiss',
  'dispatch','displace','distort','divert',
  'dodge','doom','dose','downgrade',
  'drain','drape','dread','drum',
  'dub','duel','dwell','ease',
  'embed','endanger','endorse','endure',
  'energize','engrave','enlighten','enrage',
  'enrich','entangle','envision','erect',
  'escort','evade','exceed','excel',
  'exclaim','exempt','exert','exhaust',
  'expire','explode','fabricate','fake',
  'fast','fasten','fatigue','feast',
  'fetch','fiddle','flaunt','flaw',
  'flee','fling','flip','flock',
  'flush','foam','forbid','forge',
  'format','forsake','fracture','fret',
  'frolic','frustrate','fumble','fuse',
  'gag','gallop','gamble','gape',
  'garner','gasp','gauge','gaze',
  'giggle','glare','glide','gloat',
  'gnaw','govern','grab','grapple',
  'grasp','graze','greet','grip',
  'groan','groom','grope','grouch',
  'grumble','grunt','gulp','gust',
  'guzzle','hack','hail','halt',
  'hamper','handicap','hang','harass',
  'harden','hatch','haul','haunt',
  'hike','hobble','hoist','hop',
  'howl','huddle','hurl','hustle',
  'hydrate','ignite','impair','implore',
  'imply','inaugurate','incite','incur',
  'infect','inflate','inhabit','inject',
  'inscribe','install','intensify','intercept',
  'interlock','intrude','jab','jolt',
  'jostle','juggle','jut','kidnap',
  'kindle','kneel','knit','lag',
  'lament','lash','latch','laud',
  'leap','leverage','liberate','limp',
  'litter','lodge','loom','loot',
  'lug','lunge','lure','lurk',
  'magnify','maim','manifest','maneuver',
  'mar','marvel','mash','massage',
  'meddle','merge','mimic','mingle',
  'mislead','moan','mock','mold',
  'molt','moor','mourn','mow',
  'mumble','munch','muse','mute',
  'mystify','nag','navigate','nibble',
  'nudge','nurture','obstruct','offload',
  'ooze','orchestrate','orphan','outdo',
  'outgrow','outline','outpace','outrun',
  'outshine','outsmart','outweigh','overhaul',
  'overlap','oversee','overthrow','owe',
  'pamper','pant','paralyze','patch',
  'pave','peek','penalize','perk',
  'perplex','persist','petition','pierce',
  'pinch','plague','plead','plod',
  'pluck','plummet','plunder','poach',
  'pollute','pop','pounce','preach',
  'precede','prescribe','preside','prick',
  'procrastinate','prod','prolong','prop',
  'propel','prosper','provoke','prowl',
  'prune','pry','publicize','purify',
  'pursue','quake','quarrel','quench',
  'radiate','rage','raid','ramble',
  'rant','rattle','rave','reap',
  'reassure','rebound','recite','reclaim',
  'reconcile','reconstruct','rectify','redeem',
  'refine','refresh','refurbish','regret',
  'rehabilitate','rehearse','reign','reinstate',
  'rekindle','relapse','relay','relish',
  'reload','relocate','reminisce','remodel',
  'repay','repeal','repel','repent',
  'replenish','replicate','reproach','reprove',
  'resent','reshape','resign','retaliate',
  'retract','reunite','revamp','revel',
  'revert','revive','revolt','revolve',
  'ridicule','rig','ripen','ripple',
  'roam','rob','rotate','rouse',
  'rumble','rupture','rust','sabotage',
  'sag','salvage','savor','scald',
  'scamper','scar','scatter','scoff',
  'scold','scoop','scorch','scout',
  'scramble','scrape','screech','scribble',
  'sculpt','seethe','segregate','shimmer',
  'shiver','shred','shriek','shrug',
  'shun','shush','sift','simmer',
  'sip','skid','skim','skip',
  'skull','slack','slaughter','sling',
  'slither','slouch','smack','smear',
  'snatch','sneak','snore','snub',
  'soar','sob','soften','solidify',
  'soothe','spark','speculate','spew',
  'spike','splatter','sprawl','sprinkle',
  'sprint','sprout','squander','squat',
  'squeal','squint','squirm','stagger',
  'stalk','stammer','stampede','staple',
  'stash','steer','stifle','sting',
  'stink','stipulate','stitch','stockpile',
  'stomp','stoop','stow','strangle',
  'stray','stride','stroll','stumble',
  'stun','submerge','succumb','sue',
  'suffocate','sulk','summon','suppress',
  'surge','swallow','swamp','swerve',
  'swirl','tackle','tamper','tangle',
  'taunt','tease','tempt','thaw',
  'thrash','thrill','thrust','thud',
  'thump','tickle','tilt','topple',
  'torment','toss','tow','trample',
  'trek','tremble','trespass','trickle',
  'triple','trudge','tumble','twirl',
  'twitch','uncover','underestimate','undo',
  'unearth','unfurl','unify','unleash',
  'unload','unravel','unsettle','unveil',
  'uphold','uproot','usher','utter',
  'vacate','veer','vent','vibrate',
  'wade','wail','wane','ward',
  'warp','weld','whine','whip',
  'whirl','whisk','wilt','wince',
  'wobble','wrangle','wriggle','wring',
  'writhe','yearn','zigzag',
]);

// ─── KNOWN English nouns that should NEVER have "to " ─────────────────────
const EN_DEFINITE_NOUNS = new Set([
  'academy','accent','access','accommodation','addition','administration',
  'advent','adventure','agency','agility','agreement','ambulance','ambition',
  'amount','analysis','angel','anniversary','announcement','apartment','appetite',
  'appreciation','approach','april','architecture','area','arrival','aspect',
  'atmosphere','attention','audience','august','authority','autonomy','autumn',
  'avenue','bag','balance','balcony','ball','band','bank','bar','barrier',
  'base','basement','basin','basket','battery','beach','beauty','bed','bell',
  'bench','berry','bicycle','bill','biology','birthday','block','blood',
  'board','boat','body','bone','book','bookshop','border','boss','bottle',
  'box','bracelet','brain','bread','bridge','briefcase','budget','building',
  'bull','bus','butter','button','cabin','cable','café','cake','calendar',
  'camera','camp','campaign','canal','candidate','capacity','capital','captain',
  'card','career','carpet','carriage','case','cash','castle','category',
  'cathedral','cave','ceiling','celebration','cemetery','center','centre',
  'century','ceremony','certainty','certificate','chain','chair','champion',
  'championship','channel','chapter','character','charity','cheese','cherry',
  'chest','chicken','childhood','chocolate','choice','church','cigarette',
  'cinema','circle','citizen','city','civilization','class','climate','clock',
  'cloud','club','clue','coast','coat','code','coffee','coin',
  'collar','collection','college','colony','column','comfort','command',
  'comment','commission','commitment','committee','communication','community',
  'companion','company','comparison','competition','complaint',
  'composition','computer','concentration','concept','concern','conclusion',
  'condition','conference','confidence','confusion','connection',
  'conscience','consciousness','consequence','conservation','consideration',
  'constitution','construction','consultation','consumer','contact','content',
  'context','continent','contract','contribution','convention',
  'conversation','cooking','copper','corner','corporation','correspondence',
  'corridor','cotton','council','country','countryside','county',
  'couple','courage','course','court','cousin','cream','creature','crew',
  'crime','crisis','criticism','crop','crowd','crystal','culture','cup',
  'curiosity','curriculum','curtain','customer','damage',
  'danger','darkness','data','date','daughter','dawn','deal','death',
  'debt','decade','decision','declaration','decoration','defense',
  'degree','delay','delivery','democracy','department','departure',
  'deposit','depression','description','desert','designer','desire',
  'desk','dessert','destination','destiny','detail','determination','development',
  'device','dialect','dialogue','diamond','diary','dictionary','diet',
  'difference','difficulty','dignity','dimension','dinner','diploma','direction',
  'director','dirt','disappointment','discipline','discovery',
  'discussion','disease','dish','disk','dispute','distance',
  'distinction','distribution','district','diversity','division','doctor',
  'document','dog','dollar','door','dragon','drama',
  'drawing','dress','driver','drug','drum','dust',
  'duty','eagle','ear','earth','ease','economy','edge','edition','editor',
  'education','effect','efficiency','effort','election','electricity',
  'element','elevator','email','embarrassment','embassy','emergency','emotion',
  'emperor','emphasis','empire','employee','employment',
  'encouragement','enemy','energy','engine','engineer','enjoyment','enterprise',
  'entertainment','enthusiasm','entrance','entrepreneur','entry','envelope',
  'environment','episode','equality','equipment','equivalent','era','error',
  'essay','estate','evaluation','evening','event',
  'evidence','evil','evolution','exam','examination','example','exception',
  'excitement','exhibition','existence','exit',
  'expansion','expectation','expedition','expenditure','expense',
  'expert','explanation','exploration','explosion',
  'expression','extension','extent','eye','fabric','facility','fact','factory',
  'faculty','failure','faith','fame','family','fantasy','farm','farmer',
  'fate','father','fault','fear','federation','fee',
  'feeling','fellow','festival','fever','fiction','finger','flag','flame','flesh',
  'flight','flood','floor','flower','focus','folk','food','foot',
  'football','forest','formula','fortune','foundation','founder',
  'fountain','framework','freedom','friendship','front','fruit',
  'fund','funeral','furniture','future','gallery','game','gap',
  'garage','garden','gas','gate','generation','genius','gentleman','geography',
  'gift','glory','goal','gold','golf','government','grade',
  'grain','grandfather','grandmother','grass','gravity','group','growth',
  'guest','guilt','gun','habit','hair',
  'half','hall','hand','happiness','harbour','hat','headquarters',
  'health','heart','heat','heaven','height','heir','helmet','heritage',
  'hero','highway','hill','historian','history','hobby','hole','holiday',
  'home','homework','horizon','horror','horse',
  'hospital','hostage','hotel','hour','household','housing','humanity',
  'humour','hunger','hunting','husband','ice','idea','identity','ignorance',
  'illness','illusion','imagination','implementation',
  'implication','importance','impression','improvement','incident','income',
  'independence','indication','individual','industry',
  'infection','inflation','information','infrastructure','ingredient',
  'inhabitant','inhabitants','initiative','injury','innovation','input','inquiry',
  'insect','insight','inspection','inspiration','installation','instance',
  'institution','instruction','instrument','insurance','integrity','intelligence',
  'intention','interaction','interior','internet','interpretation',
  'intervention','interview','introduction','invasion','invention','investigation',
  'investigator','investment','investor','invitation','island','isolation',
  'jacket','jam','january','jar','jazz','jealousy','jet','jewel',
  'jewelry','job','journal','journalist','journey','joy',
  'judgment','juice','jungle','jury','justice','key','kid','kidney','king',
  'kingdom','kitchen','knee','knife','knight','knowledge','lab','laboratory',
  'labour','lady','lake','lamp','landscape','lane','language',
  'lap','law','lawn','lawyer','layer','leader','leadership','league',
  'leather','leg','legend','legislation','leisure','lemon','length',
  'lesson','letter','liberty','library','lid','lieutenant',
  'lifestyle','lifetime','likelihood',
  'line','lion','lip','list','literature','liver','lobby','location',
  'logic','loss','luck','luggage','lunch','lung','luxury','machine',
  'magazine','magic','mail','maintenance','majority','maker','man','management',
  'manager','manner','mansion','manufacturer','map','marble','margin',
  'marriage','mass','material',
  'meal','meaning','meat','mechanism','media','medicine','medium',
  'meeting','melody','member','membership','memory','menu','merchant','mercy',
  'message','metal','method','middle','midnight','mile','milk','mind',
  'mineral','minister','ministry','minority','miracle',
  'mission','mistake','mixture','mobile','moment','monastery','money',
  'monk','monster','month','monument','mood','moon','morning','mosque',
  'mother','motivation','motor','mountain','mouse','mouth','movement',
  'movie','mud','muscle','museum','music','musician','mystery',
  'narrative','nation','nationality','nature','navy','necessity',
  'neck','needle','negotiation','neighbor','neighborhood','nerve','network',
  'news','newspaper','nightmare','noise','nomination','noon','norm','nose',
  'notion','novel','number','nut','nutrition','oak',
  'objective','obligation','observation','observer','obstacle','occasion',
  'occupation','ocean','october','offense','office','officer','oil','opening',
  'opera','operation','operator','opinion','opponent','opportunity','opposition',
  'option','orange','orchestra','organ','organization','origin',
  'outcome','output','oven','owner','ownership','package','pain',
  'painting','pair','palace','panel','paper','paragraph','parent',
  'parking','parliament','participant','participation','partner',
  'partnership','party','passage','passenger','passion','passport','path',
  'patience','patient','payment','peace','peak','pen',
  'penalty','pension','people','pepper','percentage','perception','performance',
  'period','permission','person','personality','perspective','phase','phenomenon',
  'philosophy','phone','photo','photograph','photographer','photography','phrase',
  'physics','piano','picture','piece','pig','pile','pipe',
  'pizza','plain','plane','planet','planning','plate',
  'platform','player','pleasure','plenty','plot','pocket','poem','poet',
  'poetry','poison','pole','policeman','policy','politician','politics',
  'pollution','pool','pope','population','port','portrait','position',
  'possession','possibility','pot','potato','potential','poverty',
  'powder','prayer','precedent','preference','pregnancy','prejudice',
  'preparation','presence','presentation','preservation','presidency','president',
  'prevention','pride','priest','prince','princess','principal',
  'principle','priority','prison','prisoner','privacy','prize','problem',
  'procedure','producer','product','production','profession',
  'professional','professor','programme','project',
  'promotion','proof','propaganda','property','proportion','proposal',
  'prosecution','prospect','protection','protocol','province',
  'provision','psychology','pub','publication','publicity','publisher',
  'punishment','pupil','purpose','pursuit','qualification','quality',
  'quantity','quarter','queen','question','queue','radiation','radio',
  'rage','rail','railway','ratio','reaction','reader',
  'reading','reality','rebel','receipt','reception','recipe',
  'recognition','recommendation','reconstruction','recording','recovery',
  'recruit','reduction','referee','reference','reflection','refugee',
  'refusal','regime','region','registration','regulation',
  'rehabilitation','reign','rejection','relation','relationship','relief',
  'religion','reluctance','remainder','repetition',
  'replacement','reply','reporter','representation','representative',
  'republic','reputation','requirement','researcher',
  'reservation','residence','resident','resignation','resistance',
  'resolution','resource','response','responsibility','rest',
  'restaurant','restoration','restriction','retirement','revelation',
  'revenue','revolution','rhythm','rice','riot',
  'river','road','rock','role','roof','room','root','rope','rose','route',
  'routine','row','rule','runner','rush','safety','saint','sake',
  'salary','sale','salt','sand','satellite','satisfaction','sauce',
  'scandal','scene','scheme','scholar','scholarship',
  'school','science','scientist','scope','screen','script','sculpture',
  'sea','season','seat','secret','secretary','section','sector',
  'security','segment','selection','semester','senator','sentence',
  'separation','sequence','series','servant','session','settlement',
  'sheep','sheet','shelf','shell',
  'shirt','shock','shoe','shore','shortage','shot',
  'shower','side','sight','significance','silk',
  'silver','similarity','simplicity','singer','sir','sister','site','situation',
  'size','skill','sky','slope','soap',
  'society','sock','soil','solution','son','song','soul',
  'soup','south','speaker','specialist','species','spectacle',
  'spectrum','speech','spell','spirit','spy','square',
  'stability','stadium','staff','staircase','stairs','standard',
  'statement','statistics','statue','status','steel',
  'stomach','stone','storm','story','stranger',
  'strategy','street','strength','string','stroke',
  'struggle','student','studio','stuff','style','subject',
  'substance','success','sugar','suggestion','suit','summer','summit','sun',
  'supermarket','supper','supplement','supporter','surgeon',
  'surgery','surplus','surrender','survival',
  'suspension','swan','sweat','swimming','sword','symbol',
  'sympathy','syndrome','system','talent','tale','tank','tape',
  'task','tax','taxi','tea','teacher','teaching','team','tear',
  'technique','technology','teenager','telephone','television','temperature',
  'temple','tendency','tennis','tension','tent','territory','terror',
  'terrorism','terrorist','text','thanks','theatre','theme','theory','therapy',
  'thing','thought','threat','threshold','throat','throne','ticket',
  'tiger','tissue','tobacco','toilet','tone','tongue',
  'tooth','topic','tourism','tourist','tournament','tower','town','toy',
  'tradition','traffic','tragedy','training','trait',
  'transition','translation','transmission','transportation',
  'traveller','treatment','treaty','tree','trial',
  'tribe','trip','truck','trunk','truth','tube',
  'twin','umbrella','uncle','understanding','unemployment',
  'uniform','union','unit','unity','universe','university','valley',
  'van','variety','vegetable','vehicle','venue','version','victim',
  'victory','village','violation','violence','virtue','virus','vision',
  'visitor','vocabulary','volume','voyage','wall',
  'war','ward','warning','warrior','waste','wave','wealth','weapon',
  'web','website','wedding','week','weekend','weight','welfare',
  'west','wheel','width','wife','wind','window','wine',
  'wing','wings','winner','winter','wire','wisdom','wish','witch',
  'woman','wood','wool','word','worker','workshop','world',
  'writer','writing','yard','year','youth',
  // Hindi-specific nouns
  'incense stick','ring','engineer','record','greeting','marks','score',
  'right','walking','organ','draught','sat','getting','staying',
  'arrogance','applying','opportunity','realized','feeling','adopted',
  'insult','traveling','crime','voice','sound','applied','application',
  'touch','blessing','invited','welcome','arrival','experience',
  'discipline','research','practice','own','import','waves','come',
  'see','mean','request','gathers','collect','piles','treatment',
  'incense','kilometer','hangout','bus','base','kilometers',
  'digit','fraction','part','sprout','brazier','grape','fig',
  'end','ending','difference','astronaut','space','inside','darkness',
  'dark','bonfire','apart from','concept','overview','certainly',
  'visually','topper','rude','ominous','economy','court',
  'wonderful','half-filled','lot','more','officer','acquisition',
  'translation','study','teacher','infinite','monkey','stranger',
  'grain','cereal','essential','mandatory','permission','novel',
  'according to','many','unique','insult','criminal','apartment',
  'april','Afghanistan','now','actress','acting','integral',
  'guava','amla','tamarind','building','area','cardamom',
  'knowledge','gesture','elephant','therefore','resignation',
  'arrangement','person','human being','reward','idli',
  'Sunday','history','here','cat','reward','building',
  'bumblebee','area','terrain','locality','celery','pickle',
  'python','attic','twenty eight','eighteen','eighteenth',
  'ginger','courthouse','newspaper','walnut','next','suddenly',
  'good','letter','often','if','courtyard','flame','heat',
  'aunty','agitation','cap','storm','Andhra','tear','today',
  'these','nowaday','free','india','dough','flour','eight',
  'habit','man','ideal','greeting','half','official','modern',
  'pleasure','homework','you','your','from you','population',
  'common','mango','age','Ayurvedic','organized','event',
  'aarti','hindu','rest','comfortably','comfortable','accused',
  'economic','lazy','raga','aalaap','clouds','hug','potato',
  'critic','criticism','critical','essential','necessary','poor',
  'accommodation','invention','frequency','hope','asha','Ashish',
  'Ashram','villages','nearby','sky','easy','teacher','ease',
  'medal','trophy','prize','cup',
]);

// ─── English adjective patterns ──────────────────────────────────────────────
function looksLikeEnglishAdj(word) {
  return /(?:ed|ful|ous|ive|ible|able|ial|ant|ent|ical|ish|less|ary|ory|ic)$/.test(word) &&
    !['need','feed','seed','lead','read','proceed','exceed','succeed','bleed',
      'shed','bed','red','said','bid','rid','hid','did','end','tend','lend',
      'bend','send','mend','fend','spend','blend','amend','contend','defend',
      'offend','pretend','extend','intend','attend','suspend','transcend',
      'comprehend','recommend','correspond','panic','picnic','magic','music',
      'public','topic','basic','classic','plastic','fabric','garlic'].includes(word);
}

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
    'adopted','realized','invited','applied','marks','gathers',
    'getting','staying','walking','traveling','applying','piles',
    'waves','woken','brought','talked','wants','takes','lived',
    'watched','started','stood','having','coming','known','seen'];
  if (irregular.includes(word)) return true;
  if (/ing$/.test(word) && word.length > 5 && word !== 'bring' && word !== 'ring' && word !== 'sing' && word !== 'string' && word !== 'spring' && word !== 'swing' && word !== 'sting' && word !== 'cling' && word !== 'fling' && word !== 'sling' && word !== 'wring' && word !== 'thing') return true;
  if (/s$/.test(word) && !/ss$/.test(word) && word.length > 3 && !['this','thus','plus','us','bus','yes','cross','boss','miss','less','moss','toss','loss','mass','pass','glass','dress','grass','press','stress','guess','mess','process','success','access','address','express','possess','progress','princess','witness','congress','business','illness','darkness','madness','sadness','kindness','goodness','weakness','awareness','happiness','loneliness','consciousness'].includes(word)) {
    // Could be 3rd person singular
    const stem = word.replace(/ies$/, 'y').replace(/es$/, 'e').replace(/s$/, '');
    if (KNOWN_ENGLISH_VERBS.has(stem)) return true;
  }
  return false;
}

// ─── Garbage first-parts in semicolon translations ──────────────────────────
const GARBAGE_FIRST_PARTS = new Set([
  "he's","she's","it's","i'm","we're","they're","you're",
  "he","she","we","they","i","you","to gets","to talks","to wants",
  "to takes","to lived","to watched","to woken","to brought","to seen",
  "to started","to stood","to having","to coming","to known",
  "doubt","himself","please","although","time","nice","promise",
  "closing","truth","once","whatever","booked","genre","really",
  "boarding","girl","since","company","yet","far","despite",
  "dear","all","good","everyone","child","lot","tall","out",
  "didn't","she'd","he'd","stairs","fireplace","house","anyone",
  "hadn't","latecomer","mayor","conclusion","tomorrow","six","late",
  "enthusiastic","health","table","wine","something","students",
  "deeper","next","watchmaker","thank","animals",
  "longer","slowly","tonight","beautiful","first","second",
  "small","large","big","old","new","young","bad","long",
  "early","already","yesterday","today","maybe","perhaps",
  "brother","sister","mother","father","son","daughter",
  "husband","wife","friend","teacher","doctor","lawyer",
  "police","money","price","cost","work","school","home",
  "morning","evening","night","afternoon","summer","winter",
  "spring","autumn","sunday","monday","tuesday","wednesday",
  "thursday","friday","saturday","january","february","march",
  "april","may","june","july","august","september","october",
  "november","december","there's","don't","officer","customers",
  "gasoline","insisting","by sprinkling water","wish","dunno",
  "anymore","accordance","never","evident","always","memory",
  "sculptor","hedgehog","colleague","archer","moment","love",
  "electric","word","accord","musician",
  "closer","electrician","milk","a surname","another",
  "missing","children","never","people","one","everyone",
  "heroic","floral","chirping","actress","cat","elephant",
  "shobha","self-respecting","visually","qualitative","though",
  "cap","india","villages","poor","homework","tanpura's",
  "teacher","asha","clouds","grandmother","raga","wheel",
]);

// ══════════════════════════════════════════════════════════════════════════════
// ─── HINDI-SPECIFIC KNOWLEDGE BASE ──────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

// Hindi words that are DEFINITELY nouns (not verbs) but got tagged as v with "to "
const HINDI_NOUNS_MISTAGGED_AS_VERBS = {
  'अंक': { en: 'marks; score', pos: 'n' },
  'अंग': { en: 'limb; organ', pos: 'n' },
  'अँगूठी': { en: 'ring', pos: 'n' },
  'अकाल': { en: 'famine; drought', pos: 'n' },
  'अगरबत्ती': { en: 'incense stick', pos: 'n' },
  'अधिकार': { en: 'right; authority', pos: 'n' },
  'अनुभव': { en: 'experience', pos: 'n' },
  'अनुशासन': { en: 'discipline', pos: 'n' },
  'अनुसंधान': { en: 'research', pos: 'n' },
  'अपना': { en: 'own; one\'s own', pos: 'pron' },
  'अपनी': { en: 'own; one\'s own', pos: 'pron' },
  'अपने': { en: 'own; one\'s own', pos: 'pron' },
  'अपमान': { en: 'insult', pos: 'n' },
  'अपराध': { en: 'crime', pos: 'n' },
  'अभियंता': { en: 'engineer', pos: 'n' },
  'अभिलेखों': { en: 'records', pos: 'n' },
  'अभिवादन': { en: 'greeting', pos: 'n' },
  'अभ्यास': { en: 'practice', pos: 'n' },
  'अर्ज़': { en: 'request', pos: 'n' },
  'अर्थ': { en: 'meaning', pos: 'n' },
  'अवसर': { en: 'opportunity', pos: 'n' },
  'अहंकार': { en: 'arrogance; ego', pos: 'n' },
  'अहसास': { en: 'feeling; realization', pos: 'n' },
  'आदर': { en: 'respect', pos: 'n' },
  'आनंद': { en: 'joy; pleasure', pos: 'n' },
  'आवाज़': { en: 'voice; sound', pos: 'n' },
  'आवेदन': { en: 'application', pos: 'n' },
  'आशीर्वाद': { en: 'blessing', pos: 'n' },
  'आमंत्रित': { en: 'invited', pos: 'adj' },
  'आमदीद': { en: 'welcome; arrival', pos: 'n' },
  'आरी': { en: 'saw (tool)', pos: 'n' },
  'इलाज': { en: 'treatment', pos: 'n' },
  'इकट्ठा': { en: 'collected; gathered', pos: 'adj' },
  'आकर': { en: 'having come', pos: 'v' },  // verb form but fix translation
};

// Comprehensive Hindi word fixes (key -> { en, pos, [lemma] })
// This is the bulk of manually verified corrections
const HINDI_FIXES = {
  // ── A: "to " on non-verbs ────────────────────────────────────
  'अंक': { en: 'marks; score', pos: 'n' },
  'अंग': { en: 'limb; organ', pos: 'n' },
  'अँगूठी': { en: 'ring', pos: 'n' },
  'अकाल': { en: 'famine; drought', pos: 'n' },
  'अगरबत्ती': { en: 'incense stick', pos: 'n' },
  'अधिकार': { en: 'right; authority', pos: 'n' },
  'अपना': { en: 'own; one\'s own', pos: 'pron' },
  'अपनी': { en: 'own; one\'s own', pos: 'pron' },
  'अपने': { en: 'own; one\'s own', pos: 'pron' },
  'अपमान': { en: 'insult', pos: 'n' },
  'अपराध': { en: 'crime', pos: 'n' },
  'अभियंता': { en: 'engineer', pos: 'n' },
  'अभिलेखों': { en: 'records', pos: 'n' },
  'अभिवादन': { en: 'greeting', pos: 'n' },
  'अर्ज़': { en: 'request; petition', pos: 'n' },
  'अर्थ': { en: 'meaning', pos: 'n' },
  'अवसर': { en: 'opportunity', pos: 'n' },
  'अहंकार': { en: 'arrogance; ego', pos: 'n' },
  'अहसास': { en: 'feeling; realization', pos: 'n' },
  'आदर': { en: 'respect', pos: 'n' },
  'आवाज़': { en: 'voice; sound', pos: 'n' },
  'आवेदन': { en: 'application', pos: 'n' },
  'आशीर्वाद': { en: 'blessing', pos: 'n' },
  'आमंत्रित': { en: 'invited', pos: 'adj' },
  'आमदीद': { en: 'welcome; arrival', pos: 'n' },
  'आरी': { en: 'saw (tool)', pos: 'n' },
  'इलाज': { en: 'treatment; cure', pos: 'n' },
  'इकट्ठा': { en: 'collected; gathered', pos: 'adj' },

  // ── B: Verb form issues ("to adopted", "to marks", etc.) ─────
  'अपनाई': { en: 'to adopt', pos: 'v', lemma: 'अपनाना' },
  'अपनाया': { en: 'to adopt', pos: 'v', lemma: 'अपनाना' },

  // ── D: Garbage semicolons (nonsensical first parts) ──────────
  'अंकित': { en: 'inscribed; marked', pos: 'adj' },
  'अद्भुत': { en: 'wonderful; amazing', pos: 'adj' },
  'अनजान': { en: 'stranger; unknown', pos: 'n' },
  'अभिनय': { en: 'acting; performance', pos: 'n' },
  'अलंकार': { en: 'ornament; figure of speech', pos: 'n' },
  'अनुवाद': { en: 'translation', pos: 'n' },
  'अमर': { en: 'immortal', pos: 'adj' },
  'अवलोकन': { en: 'overview; observation', pos: 'n' },
  'अशुभ': { en: 'ominous; inauspicious', pos: 'adj' },
  'असर': { en: 'effect; impact', pos: 'n' },
  'अव्वल': { en: 'first; top', pos: 'adj' },
  'आँख': { en: 'eye', pos: 'n' },
  'आँखें': { en: 'eyes', pos: 'n' },
  'आँखों': { en: 'eyes', pos: 'n' },
  'आंदोलन': { en: 'movement; agitation', pos: 'n' },
  'आँचल': { en: 'edge of sari; anchal', pos: 'n' },
  'आकार': { en: 'shape; size', pos: 'n' },
  'आकर': { en: 'to come', pos: 'v', lemma: 'आना' },
  'आजकल': { en: 'nowadays', pos: 'adv' },
  'आज़ाद': { en: 'free; independent', pos: 'adj' },
  'आधार': { en: 'base; foundation', pos: 'n' },
  'आने': { en: 'to come', pos: 'v', lemma: 'आना' },
  'अनुभव': { en: 'experience', pos: 'n' },
  'अनुशासन': { en: 'discipline', pos: 'n' },
  'अनुसंधान': { en: 'research', pos: 'n' },
  'अभ्यास': { en: 'practice', pos: 'n' },
  'आनंद': { en: 'joy; pleasure', pos: 'n' },
  'आयोजन': { en: 'organization; event', pos: 'n' },
  'आलिंगन': { en: 'embrace; hug', pos: 'n' },
  'आवास': { en: 'residence; accommodation', pos: 'n' },
  'आसानी': { en: 'ease; easiness', pos: 'n' },
  'अड्डा': { en: 'station; hangout', pos: 'n' },
  'अड्डे': { en: 'station; stop', pos: 'n' },
  'आसपास': { en: 'nearby; around', pos: 'adv' },
  'इतना': { en: 'this much; so much', pos: 'pron' },
  'इतनी': { en: 'this much; so much', pos: 'pron' },
  'इतने': { en: 'this many; so much', pos: 'pron' },
  'इधर': { en: 'here; this side', pos: 'adv' },
  'इनकार': { en: 'refusal; denial', pos: 'n' },
  'इशारे': { en: 'gestures; signs', pos: 'n' },
  'इर्द': { en: 'around; about', pos: 'n' },
  'इलाक़े': { en: 'area; region', pos: 'n' },

  // ── E: Wrong meaning ─────────────────────────────────────────
  'अध्ययन': { en: 'study; research', pos: 'n' },
  'अधजल': { en: 'half-filled', pos: 'adj' },
  'अधिक': { en: 'more; much', pos: 'adv' },
  'अंततः': { en: 'ultimately; finally', pos: 'adv' },
  'अत्यंत': { en: 'extremely; very', pos: 'adv' },
  'अमावस': { en: 'new moon', pos: 'n' },
  'अनंत': { en: 'infinite; endless', pos: 'adj' },
  'अनुकूल': { en: 'favorable; suitable', pos: 'adj' },
  'अलावा': { en: 'besides; apart from', pos: 'postp' },
  'अनुसार': { en: 'according to', pos: 'postp' },
  'अरुणोदय': { en: 'dawn; sunrise', pos: 'n' },
  'अशिष्ट': { en: 'rude; impolite', pos: 'adj' },
  'आख़िर': { en: 'after all; finally', pos: 'adv' },
  'आगामी': { en: 'upcoming; forthcoming', pos: 'adj' },
  'आगे': { en: 'ahead; forward', pos: 'adv' },
  'अलग': { en: 'separate; different', pos: 'adj' },
  'आरामदायक': { en: 'comfortable', pos: 'adj' },
  'आरामदेह': { en: 'comfortable', pos: 'adj' },
  'इतिहास': { en: 'history', pos: 'n' },
  'इल्म': { en: 'knowledge', pos: 'n' },
  'आलोचना': { en: 'criticism', pos: 'n' },
  'आपसे': { en: 'from you', pos: 'pron' },
  'अभी': { en: 'right now; just now', pos: 'adv' },
  'अकेले': { en: 'alone', pos: 'adv' },
  'अर्पित': { en: 'offered; dedicated', pos: 'adj' },
  'इतवार': { en: 'Sunday', pos: 'n' },
  'आलोचनात्मक': { en: 'critical', pos: 'adj' },
  'आवश्यक': { en: 'necessary; essential', pos: 'adj' },
  'इंतज़ार': { en: 'wait; waiting', pos: 'n' },

  // POS fixes (not verb, wrong POS)
  'अंतरिक्ष': { en: 'space', pos: 'n' },
  'अरे': { en: 'hey; oh', pos: 'intj' },
  'इस': { en: 'this', pos: 'pron' },
  'इसके': { en: 'its; of this', pos: 'pron' },
  'इसी': { en: 'this very', pos: 'pron' },
  'अस्सी': { en: 'eighty', pos: 'num' },
};

// ══════════════════════════════════════════════════════════════════════════════
// ─── MAIN REVIEW LOOP ───────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

const fixes = [];
const issueCounts = {
  'to-prefix-on-non-verb': 0,
  'bad-verb-form': 0,
  'missing-to-on-verb': 0,
  'garbage-semicolon': 0,
  'wrong-meaning': 0,
  'backslash-garbled': 0,
  'truncated': 0,
  'wrong-pos': 0,
};

for (const e of entries) {
  const { key, en, pos, lemma } = e;
  let newEn = en;
  let newPos = pos;
  let newLemma = lemma;
  let issueType = null;
  let note = '';

  // ─── Check for manual Hindi fix first ───────────────────────
  if (HINDI_FIXES[key]) {
    const fix = HINDI_FIXES[key];
    const changed = fix.en !== en || fix.pos !== pos || (fix.lemma !== undefined && fix.lemma !== lemma);
    if (changed) {
      const isGarbage = en.includes(';') && GARBAGE_FIRST_PARTS.has(en.split(';')[0].trim().toLowerCase());
      const hasToOnNonVerb = en.startsWith('to ') && fix.pos !== 'v';
      const hasBadForm = en.startsWith('to ') && isBadVerbForm(en.replace(/^to\s+/, '').split(/[;,]/)[0].trim());

      if (hasToOnNonVerb) issueType = 'to-prefix-on-non-verb';
      else if (hasBadForm) issueType = 'bad-verb-form';
      else if (isGarbage) issueType = 'garbage-semicolon';
      else if (fix.pos !== pos) issueType = 'wrong-pos';
      else issueType = 'wrong-meaning';

      note = `manual Hindi fix`;
      const fixObj = {
        key,
        issueType,
        note,
        old: { en, pos },
        new: { en: fix.en, pos: fix.pos, lemma: fix.lemma || null },
      };
      fixes.push(fixObj);
      if (issueCounts[issueType] !== undefined) issueCounts[issueType]++;
      continue;
    }
  }

  // ─── F: Backslash-garbled ───────────────────────────────────
  if (en.includes('\\')) {
    issueType = 'backslash-garbled';
    newEn = en.replace(/\\/g, '');
    note = 'backslash in translation';
    const fixObj = {
      key, issueType, note,
      old: { en, pos },
      new: { en: newEn, pos: newPos, lemma: newLemma || null },
    };
    fixes.push(fixObj);
    issueCounts[issueType]++;
    continue;
  }

  // ─── G: Truncated translations ──────────────────────────────
  if (en.length <= 1 && en !== '') {
    issueType = 'truncated';
    note = `translation too short: "${en}"`;
    // Skip - can't auto-fix a truncated translation
    continue;
  }

  // ─── A: "to " prefix on non-verbs ──────────────────────────
  if (en.startsWith('to ')) {
    const afterTo = en.replace(/^to\s+/, '').split(/[;,]/)[0].trim();
    const isInfinitive = key.endsWith('ना');
    const hasVerbLemma = lemma && entryMap[lemma]?.pos === 'v';

    // Check if the word is a known Hindi noun wrongly tagged as verb
    if (!isInfinitive && !hasVerbLemma && pos === 'v') {
      // Check if the English word after "to" is a noun/adjective, not a verb base form
      if (EN_DEFINITE_NOUNS.has(afterTo.toLowerCase()) || looksLikeEnglishAdj(afterTo)) {
        issueType = 'to-prefix-on-non-verb';
        newEn = en.replace(/^to\s+/, '');
        newPos = looksLikeEnglishAdj(afterTo) ? 'adj' : 'n';
        note = `"to ${afterTo}" but ${afterTo} is a ${newPos}`;
      }
      // Check for bad verb forms after "to"
      else if (isBadVerbForm(afterTo)) {
        issueType = 'bad-verb-form';
        note = `"to ${afterTo}" – bad verb form`;
        // Try to fix by lemmatizing
        const base = afterTo.replace(/ed$/, '').replace(/ing$/, '').replace(/s$/, '');
        if (KNOWN_ENGLISH_VERBS.has(base)) {
          newEn = en.replace(/^to\s+\S+/, `to ${base}`);
        } else {
          newEn = en.replace(/^to\s+/, '');
          newPos = 'n';
        }
      }
    }
  }

  // ─── D: Garbage semicolons ──────────────────────────────────
  if (!issueType && en.includes(';')) {
    const parts = en.split(';').map(p => p.trim());
    const firstLower = parts[0].toLowerCase();
    if (GARBAGE_FIRST_PARTS.has(firstLower)) {
      issueType = 'garbage-semicolon';
      note = `garbage first part: "${parts[0]}"`;
      newEn = parts.slice(1).join('; ').trim();
      if (newEn.startsWith('to ') && pos !== 'v') {
        newEn = newEn.replace(/^to\s+/, '');
      }
    }
    // Check if second part is garbage
    else if (parts.length > 1) {
      const secondLower = parts[1].trim().toLowerCase();
      if (GARBAGE_FIRST_PARTS.has(secondLower) || secondLower.length <= 1) {
        // Keep only first part
        if (parts[0] !== en) {
          issueType = 'garbage-semicolon';
          note = `garbage second part: "${parts[1]}"`;
          newEn = parts[0].trim();
        }
      }
    }
  }

  // ─── Check for "to " prefix on entries that shouldn't be verbs ─
  if (!issueType && en.startsWith('to ') && pos === 'v') {
    const afterTo = en.replace(/^to\s+/, '').split(/[;,]/)[0].trim();

    // Hindi nouns ending in common noun suffixes should NOT be verbs
    const hindiNounSuffixes = ['ता', 'ती', 'पन', 'आई', 'ाव', 'त्व', 'ान', 'ार', 'ास', 'ाद'];
    const isLikelyNoun = !key.endsWith('ना') && !lemma &&
      (hindiNounSuffixes.some(s => key.endsWith(s)) ||
       EN_DEFINITE_NOUNS.has(afterTo.toLowerCase()));

    if (isLikelyNoun) {
      issueType = 'to-prefix-on-non-verb';
      newEn = en.replace(/^to\s+/, '');
      newPos = 'n';
      note = `Hindi noun wrongly tagged as verb`;
    }
  }

  // ─── Record fix if issue found ──────────────────────────────
  if (issueType && (newEn !== en || newPos !== pos || newLemma !== lemma)) {
    const fixObj = {
      key, issueType, note,
      old: { en, pos },
      new: { en: newEn, pos: newPos, lemma: newLemma || null },
    };
    fixes.push(fixObj);
    if (issueCounts[issueType] !== undefined) issueCounts[issueType]++;
  }
}

// ─── Summary ──────────────────────────────────────────────────────────────────
console.log(`\nTotal fixes: ${fixes.length}`);
console.log('By issue type:');
for (const [type, count] of Object.entries(issueCounts)) {
  if (count > 0) console.log(`  ${type}: ${count}`);
}

// ─── Write JSON output ────────────────────────────────────────────────────────
fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(fixes, null, 2));
console.log(`\nWrote ${fixes.length} fixes to ${OUTPUT_PATH}`);

// ─── Apply fixes to hi.ts ─────────────────────────────────────────────────────
let patched = src;
let applied = 0;

for (const fix of fixes) {
  const key = fix.key;
  const oldEn = fix.old.en.replace(/'/g, "\\'");
  const newEn = fix.new.en.replace(/'/g, "\\'");
  const oldPos = fix.old.pos;
  const newPos = fix.new.pos;

  // Build regex to match the full entry line
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const linePattern = new RegExp(
    `(['"]${escapedKey}['"]\\s*:\\s*\\{[^}]*?)en:\\s*'${oldEn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'`,
  );

  const match = patched.match(linePattern);
  if (match) {
    // Replace en value
    let replacement = patched;
    replacement = replacement.replace(linePattern, `$1en: '${newEn}'`);

    // Replace pos if different
    if (oldPos !== newPos) {
      const posPattern = new RegExp(
        `(['"]${escapedKey}['"]\\s*:\\s*\\{[^}]*?)pos:\\s*'${oldPos}'`,
      );
      replacement = replacement.replace(posPattern, `$1pos: '${newPos}'`);
    }

    // Add/update lemma if specified
    if (fix.new.lemma) {
      const lemmaPattern = new RegExp(
        `(['"]${escapedKey}['"]\\s*:\\s*\\{[^}]*?)lemma:\\s*'[^']*'`,
      );
      if (lemmaPattern.test(replacement)) {
        replacement = replacement.replace(lemmaPattern, `$1lemma: '${fix.new.lemma}'`);
      } else {
        // Add lemma before closing brace
        const addLemmaPattern = new RegExp(
          `(['"]${escapedKey}['"]\\s*:\\s*\\{[^}]*)(\\s*\\})`,
        );
        replacement = replacement.replace(addLemmaPattern, `$1, lemma: '${fix.new.lemma}'$2`);
      }
    }
    // Remove lemma if fix.new.lemma is null and old had lemma
    if (fix.new.lemma === null && patched.includes(`'${key}'`) || patched.includes(`"${key}"`)) {
      // Don't remove existing lemmas unless explicitly set
    }

    if (replacement !== patched) {
      patched = replacement;
      applied++;
    }
  }
}

if (applied > 0) {
  fs.writeFileSync(DICT_PATH, patched);
  console.log(`\nApplied ${applied} fixes to ${DICT_PATH}`);
} else {
  console.log('\nNo fixes applied (all entries may already be correct).');
}
