#!/usr/bin/env node
/**
 * COMPLETE Italian dictionary review script.
 * Checks EVERY SINGLE ENTRY for:
 *   A: "to " on non-verbs
 *   B: Verb form issues (past tense, gerund after "to ")
 *   C: Missing "to " on verbs
 *   D: Garbage semicolons
 *   E: Wrong meaning (Italian knowledge)
 * Also fixes: wrong POS, wrong lemma, meta-descriptions, garbage translations
 *
 * Applies all fixes directly to the dictionary file.
 */

const fs = require('fs');
const path = require('path');
const { lemmatize } = require('./english-lemmatizer.cjs');

const DICT_PATH = path.join(__dirname, '..', 'src', 'data', 'dictionary', 'it.ts');
const OUTPUT_PATH = path.join(__dirname, 'output', 'it-full-verb-review.json');

const src = fs.readFileSync(DICT_PATH, 'utf8');

// ─── Parse all dictionary entries ───────────────────────────────────────────
const entries = [];
const lineRegex = /^\s*['"]([^'"]+)['"]\s*:\s*\{([^}]+)\}/gm;

function parseEntry(key, body) {
  const en = body.match(/en:\s*'((?:[^'\\]|\\.)*)'/)?.[1]?.replace(/\\'/g, "'") || '';
  const pos = body.match(/pos:\s*'((?:[^'\\]|\\.)*)'/)?.[1] || '';
  const lemma = body.match(/lemma:\s*'((?:[^'\\]|\\.)*)'/)?.[1] || undefined;
  return { key, en, pos, lemma };
}

let m;
while ((m = lineRegex.exec(src)) !== null) {
  entries.push(parseEntry(m[1], m[2]));
}

console.log(`Total entries parsed: ${entries.length}`);

// Build infinitive set and entry lookup
const infinitives = new Set();
const entryMap = {};
for (const e of entries) {
  entryMap[e.key] = e;
  if ((e.key.endsWith('are') || e.key.endsWith('ere') || e.key.endsWith('ire') ||
       e.key.endsWith('arsi') || e.key.endsWith('ersi') || e.key.endsWith('irsi')) && e.pos === 'v') {
    infinitives.add(e.key);
  }
}

// ─── KNOWN_ENGLISH_VERBS from post-process-google.cjs ───────────────────────
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
]);

// ─── KNOWN English non-verb nouns (definite nouns that should never have "to ") ─
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
  // Additional Italian-specific mistranslations
  'act of announcing','act of','reflexive of','compound of',
  'chapel','acumen','velvet','sapphire','syrup','veterinarian',
  'masterpiece','harpist','cappuccino','channel','waiter','waitress',
  'peasant','farmer','jail','prison','rope','cartoon',
  'video game','hundredth','hundred','indicator','indication',
  'index','index finger','signal','sign','contribution','constitution',
  'comparison','contradiction','controversy','contract','opposite','contrary',
  'control','corridor','hallway','crust','covering','coverage',
  'habit','custom','tradition','climate','environment','coast',
  'constancy','peasant','contour','outline',
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
    'stolen','sworn','taken','torn','worn','woven','frozen'];
  if (irregular.includes(word)) return true;
  if (/ing$/.test(word) && word.length > 5 && word !== 'bring' && word !== 'ring' && word !== 'sing' && word !== 'string' && word !== 'spring' && word !== 'swing' && word !== 'sting' && word !== 'cling' && word !== 'fling' && word !== 'sling' && word !== 'wring' && word !== 'thing') return true;
  return false;
}

// ─── Italian noun suffixes ───────────────────────────────────────────────────
const IT_NOUN_SUFFIXES = ['zione','sione','mento','ezza','anza','enza',
  'tura','eria','aggio','ismo','ista','tore','trice','iere','iera'];

const IT_ADJ_SUFFIXES = ['oso','osa','osi','ose','ale','ali','ile','ili',
  'bile','bili','nte','nti','ivo','iva','ivi','ive'];

// ─── Garbage first-parts in semicolon translations ──────────────────────────
const GARBAGE_FIRST_PARTS = new Set([
  "he's","she's","it's","i'm","we're","they're","you're",
  "he","she","we","they","i","you",
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
  "new","electric","word","accord","himself","musician",
  "closer","electrician","milk","a surname","another",
  "to gets","to talks","to wants","to takes","to lived",
  "to watched","to woken","to brought","to seen","to started",
  "to stood","to having","to coming","to known",
]);

// ─── Italian function word POS ───────────────────────────────────────────────
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

// ─── WRONG LEMMA patterns ────────────────────────────────────────────────────
// Words incorrectly lemmatized to a wrong root verb
const WRONG_LEMMA_PATTERNS = [
  { lemma: 'affare', prefix: 'affar', desc: 'affare' },
  { lemma: 'abitare', prefix: 'abit', desc: 'abitare' },
  { lemma: 'accadere', prefix: 'accad', desc: 'accadere' },
  { lemma: 'appare', prefix: 'appar', desc: 'appare' },
  { lemma: 'cenare', prefix: 'cen', desc: 'cenare', exceptions: ['cenare','cenando','cenato','ceneremmo','ceni','ceno','cena'] },
  { lemma: 'contare', prefix: 'cont', desc: 'contare', exceptions: ['contare','conta','contaci','contano','contato','contava','contavo','conti','contiamo','conto'] },
  { lemma: 'correre', prefix: 'corr', desc: 'correre', exceptions: ['correre','corre','correndo','correte','correva','correvo','correvamo','corri','corriamo','corrono','corso','corse','corsi','corsa'] },
  { lemma: 'volare', prefix: 'vol', desc: 'volare', exceptions: ['volare','vola','volando','volano','volato','volava','volavamo','volavo','voli','voliamo','volerei'] },
  { lemma: 'sciare', prefix: 'sci', desc: 'sciare', exceptions: ['sciare','sciavamo','sciano','scia'] },
  { lemma: 'capire', prefix: 'cap', desc: 'capire', exceptions: ['capire','capisco','capisci','capisce','capiscono','capisca','capiscano','capissero','capisse','capissimo','capiva','capivamo','capivo','capiranno','capirà','capirò','capiremmo','capiresti','capirei','capendo','capii','capito'] },
  { lemma: 'costare', prefix: 'cost', desc: 'costare', exceptions: ['costare','costa','costano','costasse','costato','costava','costerà','costerebbe','costi','costo'] },
  { lemma: 'sedersi', prefix: 'sed', desc: 'sedersi', exceptions: ['sedersi','sedermi','sediamoci','seduto','seduti','sedetevi'] },
  { lemma: 'voltare', prefix: 'volt', desc: 'voltare', exceptions: ['voltare','volta','voltano','voltato','voltava','voltiamo','volti','volto'] },
  { lemma: 'segnare', prefix: 'segn', desc: 'segnare', exceptions: ['segnare','segna','segnano','segnato','segnava','segni','segno'] },
  { lemma: 'calmare', prefix: 'calm', desc: 'calmare', exceptions: ['calmare','calma','calmato','calmati','calmi','calmo'] },
  { lemma: 'interessare', prefix: 'interess', desc: 'interessare', exceptions: ['interessare','interessa','interessano','interessato','interessava'] },
  { lemma: 'contenere', prefix: 'conten', desc: 'contenere', exceptions: ['contenere','contiene','conteneva','contengono','contenuto','contenga'] },
  { lemma: 'cameriere', prefix: 'camer', desc: 'cameriere', exceptions: ['cameriere','cameriera','camerieri'] },
  { lemma: 'conseguire', prefix: 'consegu', desc: 'conseguire', exceptions: ['conseguire','consegue','conseguito','conseguono'] },
  { lemma: 'scalare', prefix: 'scal', desc: 'scalare', exceptions: ['scalare','scala','scalano','scalato'] },
  { lemma: 'ingegnere', prefix: 'ingegn', desc: 'ingegnere', exceptions: ['ingegnere','ingegnera'] },
  { lemma: 'influenzare', prefix: 'influenz', desc: 'influenzare', exceptions: ['influenzare','influenza','influenzano','influenzato','influenzerà'] },
  { lemma: 'informare', prefix: 'inform', desc: 'informare', exceptions: ['informare','informa','informano','informarsi','informati','informato','informeremo','informi','informiamo'] },
  { lemma: 'iniziare', prefix: 'inizi', desc: 'iniziare', exceptions: ['iniziare','inizia','iniziano','iniziato','inizierà','inizierò','inizio'] },
  { lemma: 'continuare', prefix: 'continu', desc: 'continuare', exceptions: ['continuare','continua','continuano','continuato','continuava','continuerà','continueremo','continui','continuiamo','continuo'] },
];

// ============================================================
// MANUAL FIXES MAP (Italian knowledge-based corrections)
// ============================================================
const FIXES = {};

function fix(key, en, pos, lemma, issueType, note) {
  FIXES[key] = { en, pos, lemma, issueType, note };
}

// --- Prepositions / determiners / function words wrongly tagged as 'v' ---
fix('a', 'to, at', 'prep', null, 'wrong-pos', 'preposition');
fix('ad', 'to, at', 'prep', null, 'wrong-pos', 'preposition');
fix('ai', 'to the (masc. pl.)', 'prep', null, 'wrong-pos', 'preposition');
fix('al', 'to the (masc.)', 'prep', null, 'wrong-pos', 'preposition');
fix('all', 'to the', 'prep', null, 'wrong-pos', 'preposition');
fix('alla', 'to the (fem.)', 'prep', null, 'wrong-pos', 'preposition');
fix('alle', 'to the (fem. pl.)', 'prep', null, 'wrong-pos', 'preposition');
fix('agli', 'to the (masc. pl.)', 'prep', null, 'wrong-pos', 'preposition');
fix('allo', 'to the (masc.)', 'prep', null, 'wrong-pos', 'preposition');

// --- Adverbs ---
fix('abbastanza', 'enough, fairly', 'adv', null, 'wrong-pos', 'adverb');
fix('accanto', 'nearby, next to', 'adv', null, 'wrong-pos', 'adverb');
fix('addietro', 'ago, back', 'adv', null, 'wrong-meaning', 'adverb');
fix('addirittura', 'even, actually', 'adv', null, 'wrong-pos', 'adverb');

// --- Major garbled/wrong translations (Check E: Italian knowledge) ---
fix('abbassare', 'to lower, to turn down', 'v', undefined, 'wrong-meaning', '"mind; lower" garbled');
fix('abbronzato', 'tanned', 'adj', null, 'to-prefix-on-non-verb', 'adjective');
fix('abita', 'lives, resides', 'v', 'abitare', 'wrong-meaning', 'garbled');
fix('abitanti', 'inhabitants', 'n', null, 'to-prefix-on-non-verb', 'noun');
fix('abiti', 'clothes, garments', 'n', null, 'wrong-meaning', 'noun = clothes');
fix('abitua', 'gets used to', 'v', 'abituarsi', 'wrong-lemma', 'lemma should be abituarsi');
fix('abituali', 'habitual, usual', 'adj', null, 'to-prefix-on-non-verb', 'adj');
fix('abitudine', 'habit', 'n', null, 'to-prefix-on-non-verb', 'noun');
fix('accada', 'happens (subjunctive)', 'v', 'accadere', 'garbage-translation', '"to ?" garbage');
fix('accademia', 'academy', 'n', null, 'to-prefix-on-non-verb', 'noun');
fix('accede', 'accesses, logs in', 'v', 'accedere', 'wrong-meaning', 'garbled');
fix('accento', 'accent, stress', 'n', null, 'wrong-pos', 'noun not verb');
fix('accesa', 'turned on, lit', 'adj', 'acceso', 'wrong-meaning', 'garbled');
fix('acceso', 'turned on, lit', 'adj', null, 'to-prefix-on-non-verb', 'adj');
fix('accesso', 'access, admittance', 'n', undefined, 'wrong-pos', 'noun');
fix('accettabili', 'acceptable', 'adj', null, 'to-prefix-on-non-verb', 'adj');
fix('accomodarsi', 'to sit down, to make oneself comfortable', 'v', undefined, 'garbage-translation', 'meta');
fix('accomodi', 'sit down, make yourself comfortable', 'v', 'accomodarsi', 'wrong-meaning', 'grammar desc');
fix('accontentarti', 'to settle for, to be content with', 'v', 'accontentarsi', 'garbage-translation', 'garbled');
fix('accorga', 'notices (subjunctive)', 'v', 'accorgersi', 'wrong-meaning', 'garbled');
fix('accorgesse', 'noticed (subjunctive)', 'v', 'accorgersi', 'wrong-meaning', 'garbled');
fix('accorto', 'noticed; shrewd', 'adj', null, 'wrong-meaning', 'garbled');
fix('accogliente', 'welcoming, cozy', 'adj', null, 'wrong-meaning', 'garbled');
fix('accolto', 'welcomed, received', 'adj', 'accogliere', 'to-prefix-on-non-verb', 'adj');
fix('accolta', 'welcomed, received', 'adj', 'accogliere', 'to-prefix-on-non-verb', 'adj');
fix('acquisto', 'purchase', 'n', null, 'to-prefix-on-non-verb', 'noun');
fix('addormentarmi', 'to fall asleep', 'v', 'addormentarsi', 'garbage-translation', 'meta');
fix('addormentarsi', 'to fall asleep', 'v', undefined, 'garbage-translation', 'meta');
fix('addormentata', 'asleep', 'adj', 'addormentato', 'to-prefix-on-non-verb', 'adj');
fix('addormentato', 'asleep', 'adj', null, 'to-prefix-on-non-verb', 'adj');
fix('affare', 'matter, deal', 'n', null, 'to-prefix-on-non-verb', 'noun');
fix('affari', 'business, affairs', 'n', 'affare', 'wrong-pos', 'noun');
fix('affascinante', 'fascinating, charming', 'adj', undefined, 'wrong-pos', 'adj');
fix('affatto', 'at all, completely', 'adv', null, 'wrong-pos', 'adverb');
fix('affermare', 'to state, to affirm', 'v', undefined, 'wrong-meaning', 'garbled');
fix('affermato', 'stated, established', 'adj', 'affermare', 'wrong-meaning', 'garbled');
fix('affetta', 'slices', 'v', 'affettare', 'wrong-meaning', 'wrong lemma');
fix('affetto', 'affection', 'n', null, 'wrong-meaning', 'noun');
fix('affettuoso', 'affectionate', 'adj', null, 'to-prefix-on-non-verb', 'adj');
fix('affidabile', 'reliable, trustworthy', 'adj', null, 'to-prefix-on-non-verb', 'adj');
fix('affinche', 'so that', 'conj', null, 'to-prefix-on-non-verb', 'conj');
fix('affinché', 'so that', 'conj', null, 'to-prefix-on-non-verb', 'conj');
fix('affollata', 'crowded', 'adj', 'affollato', 'to-prefix-on-non-verb', 'adj');
fix('affollato', 'crowded', 'adj', null, 'to-prefix-on-non-verb', 'adj');
fix('affrettata', 'rushed, hasty', 'adj', 'affrettato', 'wrong-meaning', 'garbled');
fix('affronta', 'faces, confronts', 'v', 'affrontare', 'wrong-meaning', 'garbled');
fix('affrontare', 'to face, to confront', 'v', undefined, 'missing-to-prefix', 'verb');
fix('affrontata', 'faced, confronted', 'adj', 'affrontare', 'wrong-pos', 'adj');
fix('affrontato', 'faced, confronted', 'adj', 'affrontare', 'wrong-pos', 'adj');
fix('affronti', 'affronts, insults', 'n', null, 'wrong-meaning', 'garbled');
fix('affrontiamo', 'we face', 'v', 'affrontare', 'wrong-pos', 'verb');
fix('affacciata', 'overlooking', 'adj', 'affacciarsi', 'wrong-meaning', 'garbled');
fix('affamati', 'hungry, starving', 'adj', null, 'wrong-lemma', 'wrong lemma');
fix('agenzia', 'agency', 'n', null, 'to-prefix-on-non-verb', 'noun');
fix('aggiornati', 'updated, up-to-date', 'adj', undefined, 'to-prefix-on-non-verb', 'adj');
fix('aggiunta', 'addition', 'n', null, 'to-prefix-on-non-verb', 'noun');
fix('aggiunto', 'added, additional', 'adj', null, 'to-prefix-on-non-verb', 'adj');
fix('agosto', 'August', 'n', null, 'to-prefix-on-non-verb', 'month');
fix('agio', 'ease, comfort', 'n', null, 'wrong-meaning', 'noun');
fix('ali', 'wings', 'n', 'ala', 'to-prefix-on-non-verb', 'noun');
fix('alcolici', 'alcoholic drinks', 'n', 'alcolico', 'wrong-meaning', 'garbled');
fix('alcun', 'any, no', 'det', null, 'wrong-meaning', 'garbled');
fix('allegri', 'cheerful, merry', 'adj', 'allegro', 'to-prefix-on-non-verb', 'adj');
fix('allegro', 'cheerful, merry', 'adj', undefined, 'wrong-pos', 'adj');
fix('allergico', 'allergic', 'adj', undefined, 'wrong-pos', 'adj');
fix('allenatore', 'trainer, coach', 'n', undefined, 'wrong-meaning', 'garbled');
fix('allaperto', 'outdoors, in the open', 'adv', undefined, 'wrong-meaning', 'wrong');
fix('allappuntamento', 'at the appointment', 'adv', undefined, 'wrong-meaning', 'wrong');
fix('allingresso', 'at the entrance', 'adv', undefined, 'wrong-meaning', 'wrong');
fix('allinizio', 'at the beginning', 'adv', undefined, 'wrong-meaning', 'wrong');
fix('allinterno', 'inside, within', 'adv', undefined, 'wrong-meaning', 'wrong');
fix('allevento', 'at the event', 'adv', undefined, 'wrong-meaning', 'wrong');
fix('altrettanto', 'likewise, equally', 'adv', undefined, 'wrong-meaning', 'garbled');
fix('alzarsi', 'to get up, to stand up', 'v', undefined, 'garbage-translation', 'meta');
fix('alzavo', 'used to get up', 'v', 'alzare', 'wrong-meaning', 'truncated');
fix('alzerò', 'I will get up', 'v', 'alzare', 'wrong-meaning', 'garbled');
fix('alzi', 'get up, raise', 'v', 'alzare', 'wrong-meaning', 'garbled');
fix('alzo', 'I get up, I raise', 'v', 'alzare', 'wrong-meaning', 'garbled');
fix('alzato', 'gotten up, raised', 'adj', 'alzare', 'wrong-meaning', 'garbled');
fix('alzò', 'raised, got up', 'v', 'alzare', 'wrong-meaning', 'garbled');
fix('alza', 'raises, gets up', 'v', 'alzare', 'wrong-meaning', 'garbled');
fix('aiutarla', 'to help her', 'v', 'aiutare', 'garbage-translation', 'meta');
fix('aiutarli', 'to help them', 'v', 'aiutare', 'garbage-translation', 'meta');
fix('alloggia', 'lodges, stays', 'v', 'alloggiare', 'wrong-meaning', 'garbled');
fix('ambasciata', 'embassy', 'n', undefined, 'wrong-pos', 'noun');
fix('ambientale', 'environmental', 'adj', null, 'to-prefix-on-non-verb', 'adj');
fix('ambiente', 'environment', 'n', undefined, 'wrong-meaning', 'garbled');
fix('ambizione', 'ambition', 'n', null, 'to-prefix-on-non-verb', 'noun');
fix('ambizioso', 'ambitious', 'adj', null, 'to-prefix-on-non-verb', 'adj');
fix('ambulanza', 'ambulance', 'n', null, 'to-prefix-on-non-verb', 'noun');
fix('americana', 'American', 'adj', null, 'to-prefix-on-non-verb', 'adj');
fix('amicizia', 'friendship', 'n', undefined, 'wrong-meaning', 'garbled');
fix('ammesso', 'admitted, granted', 'adj', undefined, 'wrong-meaning', 'garbled');
fix('ammetterlo', 'to admit it', 'v', 'ammettere', 'garbage-translation', 'meta');
fix('amministrazione', 'administration', 'n', undefined, 'wrong-meaning', 'garbled');
fix('ammirevole', 'admirable', 'adj', null, 'to-prefix-on-non-verb', 'adj');
fix('amore', 'love', 'n', null, 'to-prefix-on-non-verb', 'noun');
fix('amaro', 'bitter', 'adj', null, 'wrong-lemma', 'wrong lemma');
fix('amati', 'loved, beloved', 'adj', 'amare', 'to-prefix-on-non-verb', 'adj');
fix('animati', 'animated', 'adj', null, 'wrong-meaning', 'garbled');
fix('annaffia', 'waters, sprinkles', 'v', 'annaffiare', 'wrong-meaning', 'garbled');
fix('annaffiate', 'water (imperative)', 'v', 'annaffiare', 'wrong-meaning', 'garbled');
fix('annoia', 'bores, annoys', 'v', 'annoiarsi', 'wrong-meaning', 'garbled');
fix('annullare', 'to cancel, to annul', 'v', undefined, 'wrong-meaning', 'garbled');
fix('annunciate', 'announced', 'adj', 'annunciare', 'to-prefix-on-non-verb', 'adj');
fix('annunciato', 'announced', 'adj', 'annunciare', 'to-prefix-on-non-verb', 'adj');
fix('annuncio', 'announcement', 'n', null, 'to-prefix-on-non-verb', 'noun');
fix('antica', 'ancient, old', 'adj', 'antico', 'wrong-meaning', 'garbled');
fix('antichi', 'ancient, old', 'adj', 'antico', 'wrong-meaning', 'garbled');
fix('anticipatamente', 'in advance, beforehand', 'adv', undefined, 'wrong-meaning', 'garbled');
fix('anticipo', 'early; advance', 'n', undefined, 'wrong-pos', 'noun');
fix('antico', 'ancient, old', 'adj', null, 'wrong-meaning', 'garbled');
fix('antipatico', 'unpleasant, unlikeable', 'adj', undefined, 'wrong-pos', 'adj');
fix('aperitivo', 'aperitif', 'n', undefined, 'wrong-pos', 'noun');
fix('aperta', 'open', 'adj', 'aperto', 'wrong-meaning', 'garbled');
fix('aperte', 'open', 'adj', 'aperto', 'wrong-meaning', 'garbled');
fix('aperti', 'open', 'adj', 'aperto', 'to-prefix-on-non-verb', 'adj');
fix('aperto', 'open', 'adj', undefined, 'wrong-meaning', 'garbled');
fix('apertura', 'opening', 'n', null, 'to-prefix-on-non-verb', 'noun');
fix('appena', 'just, as soon as', 'adv', undefined, 'wrong-meaning', 'garbled');
fix('appeso', 'hung, hanging', 'adj', null, 'to-prefix-on-non-verb', 'adj');
fix('appetito', 'appetite', 'n', undefined, 'wrong-pos', 'noun');
fix('appassionati', 'enthusiasts, passionate', 'n', undefined, 'wrong-meaning', 'garbled');
fix('approvata', 'approved', 'adj', 'approvare', 'to-prefix-on-non-verb', 'adj');
fix('approvato', 'approved', 'adj', 'approvare', 'to-prefix-on-non-verb', 'adj');
fix('apprezzata', 'appreciated, valued', 'adj', 'apprezzare', 'to-prefix-on-non-verb', 'adj');
fix('approccio', 'approach', 'n', null, 'to-prefix-on-non-verb', 'noun');
fix('approfondimento', 'in-depth analysis', 'n', undefined, 'wrong-meaning', 'garbled');
fix('appuntite', 'sharp, pointed', 'adj', null, 'wrong-meaning', 'wrong');
fix('appunto', 'exactly, precisely', 'adv', null, 'wrong-meaning', 'adverb');
fix('apportare', 'to bring, to make', 'v', undefined, 'wrong-pos', 'verb');
fix('apprezzamento', 'appreciation', 'n', null, 'to-prefix-on-non-verb', 'noun');
fix('apparve', 'appeared', 'v', 'apparire', 'verb-base-form', 'wrong tense');
fix('arbitri', 'referees', 'n', null, 'to-prefix-on-non-verb', 'noun');
fix('aprile', 'April', 'n', null, 'to-prefix-on-non-verb', 'month');
fix('arrangiarsi', 'to make do, to manage', 'v', undefined, 'wrong-meaning', 'garbled');
fix('annoio', 'I get bored', 'v', 'annoiarsi', 'wrong-pos', 'verb');
fix('arrabbiare', 'to get angry', 'v', undefined, 'wrong-meaning', 'not rabies');
fix('appoggio', 'support', 'n', null, 'to-prefix-on-non-verb', 'noun');
fix('arrendiamo', 'we surrender', 'v', 'arrendersi', 'wrong-meaning', 'garbled');
fix('arreso', 'surrendered', 'adj', 'arrendersi', 'wrong-meaning', 'garbled');

// Massive context bleed: "doubt; arrive" family
for (const k of ['arriva','arrivando','arrivano','arrivare','arrivasse','arrivassero',
  'arrivassi','arrivata','arrivati','arrivato','arrivava','arrivavano','arrivavo',
  'arriverà','arriverai','arriveranno','arriveremmo','arriveremo',
  'arrivi','arriviamo','arrivo','arrivederci']) {
  const e = entryMap[k];
  if (e && (e.en.includes('doubt') || (k === 'arrivederci' && e.en.includes('doubt')))) {
    const isInf = k.endsWith('are');
    const isGoodbye = k === 'arrivederci';
    fix(k, isGoodbye ? 'goodbye' : (isInf ? 'to arrive' : 'arrive'),
      isGoodbye ? 'n' : 'v', isInf || isGoodbye ? undefined : 'arrivare',
      'garbage-semicolon', '"doubt;" context bleed');
  }
}

// "himself; understand" context bleed on capire family + wrongly lemmatized words
fix('capire', 'to understand', 'v', undefined, 'wrong-meaning', 'garbled');
fix('capirà', 'will understand', 'v', 'capire', 'wrong-meaning', 'garbled');
fix('capiremmo', 'we would understand', 'v', 'capire', 'wrong-meaning', 'garbled');
fix('capirò', 'I will understand', 'v', 'capire', 'wrong-meaning', 'garbled');
fix('capisca', 'understand (subjunctive)', 'v', 'capire', 'wrong-meaning', 'garbled');
fix('capiscano', 'understand (subjunctive pl.)', 'v', 'capire', 'wrong-meaning', 'garbled');
fix('capisce', 'understands', 'v', 'capire', 'wrong-meaning', 'garbled');
fix('capisco', 'I understand', 'v', 'capire', 'wrong-meaning', 'garbled');
fix('capiscono', 'they understand', 'v', 'capire', 'wrong-meaning', 'garbled');
fix('capisse', 'understood (subjunctive)', 'v', 'capire', 'wrong-meaning', 'garbled');
fix('capissero', 'understood (subjunctive pl.)', 'v', 'capire', 'wrong-meaning', 'garbled');
fix('capito', 'understood', 'adj', 'capire', 'wrong-meaning', 'garbled');
fix('capiva', 'used to understand', 'v', 'capire', 'wrong-meaning', 'garbled');
fix('capivamo', 'we used to understand', 'v', 'capire', 'wrong-meaning', 'garbled');
fix('capivo', 'I used to understand', 'v', 'capire', 'wrong-meaning', 'garbled');
fix('capelli', 'hair', 'n', null, 'wrong-meaning', 'noun');
fix('capo', 'boss, head', 'n', null, 'wrong-meaning', 'noun');
fix('capitolo', 'chapter', 'n', null, 'wrong-meaning', 'noun');
fix('cappello', 'hat', 'n', null, 'wrong-meaning', 'noun');
fix('cappotto', 'coat', 'n', null, 'wrong-meaning', 'noun');
fix('cappuccino', 'cappuccino', 'n', null, 'wrong-meaning', 'noun');
fix('capolavoro', 'masterpiece', 'n', null, 'wrong-meaning', 'noun');
fix('capolinea', 'terminus, end of the line', 'n', null, 'wrong-meaning', 'noun');
fix('capacità', 'capacity, ability', 'n', null, 'wrong-meaning', 'noun');
fix('capitale', 'capital', 'n', null, 'wrong-meaning', 'noun');

// Wrong lemma: "cenare" bleeding into unrelated words
fix('centesimo', 'hundredth', 'adj', null, 'wrong-lemma', 'not cenare');
fix('centinaio', 'about a hundred', 'n', null, 'wrong-lemma', 'not cenare');
fix('cento', 'hundred', 'n', null, 'wrong-lemma', 'not cenare');
fix('centrale', 'central', 'adj', null, 'wrong-lemma', 'not cenare');
fix('centro', 'center', 'n', null, 'wrong-lemma', 'not cenare');

// Wrong lemma: "contare" bleeding
fix('contadino', 'peasant, farmer', 'n', null, 'wrong-lemma', 'not contare');
fix('contagiosa', 'contagious', 'adj', null, 'wrong-lemma', 'not contare');
fix('contagioso', 'infectious, contagious', 'adj', null, 'wrong-lemma', 'not contare');
fix('contempo', 'at the same time', 'adv', null, 'wrong-lemma', 'not contare');
fix('contenti', 'happy, pleased', 'adj', 'contento', 'wrong-lemma', 'not contare');
fix('contento', 'happy, pleased', 'adj', null, 'wrong-meaning', 'garbled');
fix('contenuto', 'content, contents', 'n', null, 'wrong-meaning', 'noun');
fix('contesto', 'context, setting', 'n', null, 'wrong-lemma', 'not contare');
fix('continente', 'continent', 'n', null, 'wrong-lemma', 'not contare');
fix('contrario', 'opposite, contrary', 'adj', null, 'wrong-lemma', 'not contare');
fix('contratto', 'contract', 'n', null, 'wrong-lemma', 'not contare');
fix('contorno', 'side dish; outline', 'n', null, 'wrong-lemma', 'not contare');
fix('contro', 'against', 'prep', null, 'wrong-lemma', 'not contare');
fix('controlla', 'checks, controls', 'v', 'controllare', 'wrong-lemma', 'not contare');
fix('controlli', 'checks, controls', 'n', null, 'wrong-lemma', 'not contare');
fix('controllo', 'control, check', 'n', null, 'wrong-lemma', 'not contare');
fix('controversa', 'controversial', 'adj', null, 'wrong-lemma', 'not contare');
fix('costretti', 'forced, compelled', 'adj', 'costringere', 'wrong-lemma', 'not costare');
fix('costante', 'constant', 'adj', null, 'wrong-lemma', 'not costare');
fix('costanza', 'constancy', 'n', null, 'wrong-lemma', 'not costare');
fix('costiera', 'coastal', 'adj', null, 'wrong-lemma', 'not costare');
fix('costituzione', 'constitution', 'n', null, 'wrong-lemma', 'not costare');
fix('costare', 'to cost', 'v', undefined, 'missing-to-prefix', 'verb');
fix('costasse', 'would cost', 'v', 'costare', 'missing-to-prefix', 'verb');
fix('costato', 'cost (past part.)', 'v', 'costare', 'missing-to-prefix', 'verb');
fix('costava', 'used to cost', 'v', 'costare', 'missing-to-prefix', 'verb');
fix('costerà', 'will cost', 'v', 'costare', 'missing-to-prefix', 'verb');
fix('costerebbe', 'would cost', 'v', 'costare', 'missing-to-prefix', 'verb');

// Wrong lemma: "correre" bleeding
fix('corridoi', 'corridors', 'n', null, 'wrong-lemma', 'not correre');
fix('corridoio', 'corridor, hallway', 'n', null, 'wrong-lemma', 'not correre');
fix('corrente', 'current', 'n', null, 'wrong-lemma', 'not correre');
fix('correntemente', 'currently, fluently', 'adv', null, 'wrong-meaning', 'garbled');
fix('corretta', 'correct', 'adj', 'corretto', 'wrong-lemma', 'not correre');
fix('corretto', 'correct', 'adj', null, 'wrong-lemma', 'not correre');

// Wrong lemma: "volare" bleeding
fix('volentieri', 'willingly, gladly', 'adv', null, 'wrong-lemma', 'not volare');
fix('volente', 'willing', 'adj', null, 'wrong-lemma', 'not volare');
fix('voler', 'to want (infinitive stem)', 'v', 'volere', 'wrong-lemma', 'not volare');
fix('volerei', 'I would want', 'v', 'volere', 'wrong-lemma', 'not volare');
fix('volo', 'flight', 'n', null, 'wrong-lemma', 'not volare');
fix('volontà', 'will, willpower', 'n', null, 'wrong-lemma', 'not volare');
fix('volume', 'volume', 'n', null, 'wrong-lemma', 'not volare');
fix('voluti', 'wanted, desired', 'adj', 'volere', 'wrong-lemma', 'not volare');
fix('volente', 'willing', 'adj', null, 'wrong-lemma', 'not volare');

// Wrong lemma: "sciare" bleeding
fix('sciarpa', 'scarf', 'n', null, 'wrong-meaning', 'not ski');
fix('sciroppo', 'syrup', 'n', null, 'wrong-meaning', 'not ski');
fix('scivoloso', 'slippery', 'adj', null, 'wrong-meaning', 'not ski');
fix('scienza', 'science', 'n', null, 'wrong-lemma', 'not sciare');
fix('scienziato', 'scientist', 'n', null, 'wrong-lemma', 'not sciare');
fix('sciocco', 'silly, foolish', 'adj', null, 'wrong-lemma', 'not sciare');
fix('sciopero', 'strike', 'n', null, 'wrong-pos', 'noun');

// "it's; continue" context bleed on continuare family
for (const k of ['continua','continuano','continuare','continuato','continuava','continuerà','continui','continuiamo','continuo']) {
  const e = entryMap[k];
  if (e && e.en.includes("it's; continue")) {
    const isInf = k.endsWith('are');
    fix(k, isInf ? 'to continue' : 'continue', 'v', isInf ? undefined : 'continuare', 'garbage-semicolon', '"it\'s;" context bleed');
  }
}

// vivere family: "to living; live" → "to live"
for (const k of ['vivere','viva','vivace','vivaci','vive','vivesse','viveva','vivevo',
  'vivi','viviamo','vivo','vivono','vivrà','vivrei','vivremmo','vivrò','vivevano','vivevo']) {
  const e = entryMap[k];
  if (e && e.en.includes('living; live')) {
    const isInf = k === 'vivere';
    fix(k, isInf ? 'to live' : 'live', 'v', isInf ? undefined : 'vivere', 'verb-base-form', '"to living; live" bad form');
  }
}

// scendere family: "station; descend" → clean
for (const k of ['scenda','scende','scendere','scendi']) {
  const e = entryMap[k];
  if (e && e.en.includes('station; descend')) {
    const isInf = k === 'scendere';
    fix(k, isInf ? 'to descend, to go down' : 'descend, go down', 'v', isInf ? undefined : 'scendere', 'garbage-semicolon', '"station;" bleed');
  }
}

// More specific fixes
fix('entrare', 'to enter', 'v', undefined, 'missing-to-prefix', 'verb');
fix('raggiungere', 'to reach', 'v', undefined, 'missing-to-prefix', 'verb');
fix('fissare', 'to fix, to schedule', 'v', undefined, 'wrong-meaning', 'garbled');
fix('tornare', 'to return', 'v', undefined, 'wrong-meaning', 'garbled');
fix('scherzare', 'to joke', 'v', undefined, 'missing-to-prefix', 'verb');
fix('calmare', 'to calm, to calm down', 'v', undefined, 'wrong-pos', 'verb');
fix('convincere', 'to convince, to persuade', 'v', undefined, 'wrong-meaning', 'garbled');
fix('convincerlo', 'to convince him', 'v', 'convincere', 'wrong-meaning', 'garbled');
fix('convinto', 'convinced', 'adj', 'convincere', 'wrong-meaning', 'garbled');

// cameriere/cameriera wrong lemma
fix('cameriera', 'waitress', 'n', 'cameriere', 'to-prefix-on-non-verb', 'noun');
fix('cameriere', 'waiter', 'n', undefined, 'to-prefix-on-non-verb', 'noun');
fix('camerieri', 'waiters', 'n', 'cameriere', 'to-prefix-on-non-verb', 'noun');
fix('camerino', 'dressing room', 'n', null, 'wrong-meaning', 'not waiter');
fix('camere', 'rooms', 'n', 'camera', 'to-prefix-on-non-verb', 'noun');
fix('cantina', 'cellar, wine cellar', 'n', null, 'wrong-meaning', 'not sing');

// canale, carcere, cavi, cavo
fix('canale', 'channel', 'n', null, 'to-prefix-on-non-verb', 'noun');
fix('carcere', 'jail, prison', 'n', null, 'to-prefix-on-non-verb', 'noun');
fix('cavi', 'cables', 'n', 'cavo', 'to-prefix-on-non-verb', 'noun');
fix('cavo', 'cable', 'n', null, 'wrong-meaning', 'noun');
fix('cambiamenti', 'changes', 'n', null, 'to-prefix-on-non-verb', 'noun');
fix('cambiamento', 'change', 'n', null, 'to-prefix-on-non-verb', 'noun');

// carta/carte: "to pay; paper" → "paper, card"
fix('carta', 'paper, card', 'n', null, 'wrong-meaning', 'garbled');
fix('carte', 'papers, cards', 'n', 'carta', 'wrong-meaning', 'garbled');
fix('carro', 'wagon, cart', 'n', null, 'wrong-meaning', 'garbled');
fix('cartoni', 'cartoons; cardboard', 'n', null, 'to-prefix-on-non-verb', 'noun');
fix('corda', 'rope', 'n', null, 'to-prefix-on-non-verb', 'noun');
fix('copertura', 'coverage, covering', 'n', null, 'to-prefix-on-non-verb', 'noun');
fix('conflitto', 'conflict', 'n', null, 'to-prefix-on-non-verb', 'noun');
fix('confronto', 'comparison', 'n', null, 'to-prefix-on-non-verb', 'noun');
fix('condizioni', 'conditions', 'n', 'condizione', 'to-prefix-on-non-verb', 'noun');
fix('conseguenza', 'consequence', 'n', null, 'to-prefix-on-non-verb', 'noun');
fix('conseguenze', 'consequences', 'n', 'conseguenza', 'to-prefix-on-non-verb', 'noun');
fix('contributo', 'contribution', 'n', null, 'to-prefix-on-non-verb', 'noun');
fix('contentissimi', 'very happy', 'adj', 'contento', 'to-prefix-on-non-verb', 'adj');
fix('conoscenza', 'knowledge', 'n', null, 'wrong-pos', 'noun');

// ingegnere family
fix('ingegnera', 'engineer (fem.)', 'n', 'ingegnere', 'to-prefix-on-non-verb', 'noun');
fix('ingegnere', 'engineer', 'n', undefined, 'to-prefix-on-non-verb', 'noun');
fix('ingegneria', 'engineering', 'n', null, 'to-prefix-on-non-verb', 'noun');
fix('ingresso', 'entrance', 'n', null, 'wrong-meaning', 'garbled');

// iniziativa, inizialmente
fix('iniziativa', 'initiative', 'n', null, 'to-prefix-on-non-verb', 'noun');
fix('inizialmente', 'initially, at first', 'adv', null, 'to-prefix-on-non-verb', 'adverb');
fix('indicazione', 'indication, direction', 'n', null, 'to-prefix-on-non-verb', 'noun');
fix('indice', 'index, index finger', 'n', null, 'to-prefix-on-non-verb', 'noun');
fix('interesse', 'interest', 'n', null, 'to-prefix-on-non-verb', 'noun');
fix('interpretazione', 'interpretation', 'n', null, 'to-prefix-on-non-verb', 'noun');
fix('investimento', 'investment', 'n', null, 'to-prefix-on-non-verb', 'noun');
fix('invincibili', 'invincible', 'adj', null, 'wrong-lemma', 'not inviare');
fix('invisibile', 'invisible', 'adj', null, 'wrong-lemma', 'not inviare');
fix('insegnamento', 'teaching', 'n', null, 'to-prefix-on-non-verb', 'noun');
fix('incoraggianti', 'encouraging', 'adj', 'incoraggiante', 'to-prefix-on-non-verb', 'adj');
fix('incuriosito', 'intrigued', 'adj', null, 'to-prefix-on-non-verb', 'adj');
fix('innamorato', 'in love', 'adj', 'innamorarsi', 'to-prefix-on-non-verb', 'adj');
fix('innamorarsi', 'to fall in love', 'v', undefined, 'garbage-translation', 'meta');
fix('interessato', 'interested', 'adj', 'interessare', 'to-prefix-on-non-verb', 'adj');
fix('informazione', 'information', 'n', null, 'wrong-pos', 'noun');
fix('informazioni', 'information', 'n', null, 'wrong-pos', 'noun');

// voce, via, vista, voto, videogiochi, veterinario, votazione
fix('voce', 'voice', 'n', null, 'wrong-meaning', 'garbled');
fix('via', 'away; street', 'n', null, 'wrong-meaning', 'garbled');
fix('vista', 'view, sight', 'n', null, 'to-prefix-on-non-verb', 'noun');
fix('viste', 'seen; views', 'n', 'visto', 'wrong-meaning', 'garbled');
fix('visto', 'seen', 'adj', null, 'wrong-meaning', 'garbled');
fix('voto', 'vote; grade', 'n', null, 'wrong-meaning', 'noun');
fix('votazione', 'voting, vote', 'n', null, 'to-prefix-on-non-verb', 'noun');
fix('videogiochi', 'video games', 'n', null, 'to-prefix-on-non-verb', 'noun');
fix('veterinario', 'veterinarian', 'n', null, 'wrong-meaning', 'garbled');
fix('vorrei', 'I would like', 'v', 'volere', 'wrong-meaning', 'garbled');
fix('volesse', 'wanted (subjunctive)', 'v', 'volere', 'wrong-meaning', 'garbled');
fix('voleva', 'to want', 'v', 'volere', 'verb-base-form', '"to wanted"');
fix('volevamo', 'to want', 'v', 'volere', 'verb-base-form', '"to wanted"');
fix('volevano', 'to want', 'v', 'volere', 'verb-base-form', '"to wanted"');
fix('volevo', 'to want', 'v', 'volere', 'verb-base-form', '"to wanted"');

fix('sbaglia', 'is wrong, makes a mistake', 'v', 'sbagliare', 'wrong-meaning', 'garbled');
fix('sbagliato', 'wrong, incorrect', 'adj', 'sbagliare', 'wrong-meaning', 'garbled');
fix('sbrigare', 'to hurry', 'v', undefined, 'wrong-meaning', 'garbled');
fix('sbrigarsi', 'to hurry up', 'v', undefined, 'garbage-translation', 'meta');
fix('sbrigatevi', 'hurry up!', 'v', 'sbrigarsi', 'wrong-meaning', 'garbled');
fix('scelta', 'choice', 'n', null, 'to-prefix-on-non-verb', 'noun');
fix('scelte', 'choices', 'n', 'scelta', 'wrong-meaning', 'garbled');
fix('scelto', 'chosen', 'adj', 'scegliere', 'to-prefix-on-non-verb', 'adj');
fix('scarpe', 'shoes', 'n', 'scarpa', 'wrong-meaning', '"sho" truncated');
fix('scrivania', 'desk', 'n', null, 'to-prefix-on-non-verb', 'noun');
fix('scrivanie', 'desks', 'n', 'scrivania', 'wrong-meaning', 'not "to write"');
fix('scritto', 'written', 'adj', 'scrivere', 'to-prefix-on-non-verb', 'adj');
fix('segnale', 'signal, sign', 'n', null, 'to-prefix-on-non-verb', 'noun');
fix('segno', 'sign, mark', 'n', null, 'to-prefix-on-non-verb', 'noun');
fix('sede', 'headquarters, seat', 'n', null, 'wrong-meaning', 'noun');
fix('seme', 'seed', 'n', null, 'to-prefix-on-non-verb', 'noun');
fix('semplici', 'simple', 'adj', 'semplice', 'wrong-meaning', 'not surname');
fix('sconti', 'discounts', 'n', 'sconto', 'to-prefix-on-non-verb', 'noun');
fix('scontro', 'collision, clash', 'n', null, 'to-prefix-on-non-verb', 'noun');
fix('seguente', 'following, next', 'adj', 'seguire', 'to-prefix-on-non-verb', 'adj');
fix('seguenti', 'following, next', 'adj', 'seguire', 'to-prefix-on-non-verb', 'adj');

fix('scomoda', 'uncomfortable', 'adj', null, 'to-prefix-on-non-verb', 'adj');
fix('scavi', 'excavations', 'n', null, 'to-prefix-on-non-verb', 'noun');
fix('scottato', 'scalded, burned', 'adj', 'scottare', 'wrong-meaning', 'garbled');
fix('sbiadite', 'faded', 'adj', null, 'to-prefix-on-non-verb', 'adj');
fix('vincitore', 'winner', 'n', null, 'to-prefix-on-non-verb', 'noun');
fix('asciugare', 'to dry', 'v', undefined, 'garbage-translation', '"to ?" garbage');
fix('vita', 'life', 'n', null, 'wrong-meaning', '"day; life" garbled');
fix('caffè', 'coffee', 'n', undefined, 'wrong-meaning', 'garbled');
fix('così', 'so, like this', 'adv', undefined, 'wrong-meaning', 'garbled');
fix('sé', 'oneself', 'pron', undefined, 'wrong-meaning', 'garbled');
fix('vietato', 'forbidden, prohibited', 'adj', 'vietare', 'to-prefix-on-non-verb', 'adj');
fix('vivace', 'lively, vivacious', 'adj', null, 'wrong-meaning', 'not "to living"');
fix('vivaci', 'lively, vivacious', 'adj', 'vivace', 'wrong-meaning', 'not "to living"');

fix('volontariato', 'volunteering', 'n', undefined, 'wrong-meaning', 'garbled');
fix('giù', 'down, below', 'adv', null, 'wrong-meaning', 'garbled');
fix('arrosto', 'roast', 'n', null, 'wrong-pos', 'noun');
fix('catalogato', 'catalogued', 'adj', null, 'to-prefix-on-non-verb', 'adj');
fix('celebre', 'celebrated, famous', 'adj', null, 'to-prefix-on-non-verb', 'adj');
fix('cena', 'dinner', 'n', null, 'wrong-meaning', 'noun not verb');
fix('scambio', 'exchange', 'n', null, 'to-prefix-on-non-verb', 'noun');
fix('carattere', 'character', 'n', null, 'to-prefix-on-non-verb', 'noun');
fix('carbonara', 'carbonara', 'n', undefined, 'wrong-meaning', 'garbled');

// ============================================================
// AUTOMATED CHECKS (process all entries)
// ============================================================
const allFixes = [];
const issueCounts = {};

function countIssue(type) {
  issueCounts[type] = (issueCounts[type] || 0) + 1;
}

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
    // Look up lemma's translation to replace
    let fixEn = '?';
    if (lemma && entryMap[lemma]) {
      const le = entryMap[lemma];
      if (!le.en.includes('first/second') && !le.en.includes('subjunctive')) {
        fixEn = le.en;
      }
    }
    allFixes.push({
      key, issueType: 'garbage-meta-description',
      note: 'Grammar description used as translation',
      old: { en, pos }, new: { en: fixEn, pos: 'v', ...(lemma ? { lemma } : {}) }
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
  if (en === 'to ?' || en === 'to?' || en === '?') {
    // Try to resolve from lemma
    let fixEn = '?';
    if (lemma && entryMap[lemma] && entryMap[lemma].en !== '?' && !entryMap[lemma].en.includes('to ?')) {
      fixEn = entryMap[lemma].en;
    }
    allFixes.push({
      key, issueType: 'truncated-garbled', note: 'garbage translation',
      old: { en, pos }, new: { en: fixEn, pos, ...(lemma ? { lemma } : {}) }
    });
    countIssue('truncated-garbled');
    continue;
  }

  // === PATTERN 4: Context bleed "X; Y" (Check D) ===
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

  // === PATTERN 5: "to " prefix on non-verbs (Check A) ===
  if (en.startsWith('to ')) {
    const afterTo = en.slice(3).trim();
    const firstWord = afterTo.split(/[,;]/)[0].trim().toLowerCase();

    // "to " + definite noun
    if (EN_DEFINITE_NOUNS.has(firstWord)) {
      allFixes.push({
        key, issueType: 'to-prefix-on-non-verb',
        note: `"to ${firstWord}" - noun shouldn't have "to "`,
        old: { en, pos }, new: { en: afterTo, pos: 'n' }
      });
      countIssue('to-prefix-on-non-verb');
      continue;
    }

    // "to " + English adj
    if (looksLikeEnglishAdj(firstWord) && !KNOWN_ENGLISH_VERBS.has(firstWord)) {
      allFixes.push({
        key, issueType: 'to-prefix-on-non-verb',
        note: `"to ${firstWord}" - adjective shouldn't have "to "`,
        old: { en, pos }, new: { en: afterTo, pos: 'adj' }
      });
      countIssue('to-prefix-on-non-verb');
      continue;
    }

    // "to " + bad verb form (Check B)
    if (isBadVerbForm(firstWord)) {
      // Try to lemmatize
      const base = lemmatize(firstWord, 'v');
      const fixEn = base !== firstWord ? 'to ' + base : afterTo;
      const fixPos = base !== firstWord ? 'v' : 'adj';
      allFixes.push({
        key, issueType: 'verb-base-form',
        note: `"to ${firstWord}" has wrong form after "to "`,
        old: { en, pos }, new: { en: fixEn, pos: fixPos }
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

  // === PATTERN 6: Missing "to " on verbs (Check C) ===
  if (!en.startsWith('to ') && pos === 'v' && infinitives.has(key)) {
    const firstWord = en.split(/[,;]/)[0].trim().toLowerCase();
    if (KNOWN_ENGLISH_VERBS.has(firstWord) || KNOWN_ENGLISH_VERBS.has(lemmatize(firstWord, 'v'))) {
      allFixes.push({
        key, issueType: 'missing-to-prefix',
        note: `verb "${key}" missing "to " prefix`,
        old: { en, pos }, new: { en: 'to ' + en, pos }
      });
      countIssue('missing-to-prefix');
      continue;
    }
  }

  // === PATTERN 7: Function word POS fixes ===
  if (FUNC_WORD_POS[key] && pos !== FUNC_WORD_POS[key]) {
    allFixes.push({
      key, issueType: 'wrong-pos',
      note: `"${key}" should be ${FUNC_WORD_POS[key]}, was ${pos}`,
      old: { en, pos }, new: { en, pos: FUNC_WORD_POS[key] }
    });
    countIssue('wrong-pos');
    continue;
  }

  // === PATTERN 8: Wrong lemma (word lemma'd to wrong root) ===
  if (lemma) {
    for (const pattern of WRONG_LEMMA_PATTERNS) {
      if (lemma === pattern.lemma && !key.startsWith(pattern.prefix)) {
        // Check exceptions
        if (pattern.exceptions && pattern.exceptions.includes(key)) continue;
        allFixes.push({
          key, issueType: 'wrong-lemma',
          note: `wrong lemma "${pattern.lemma}" for "${key}"`,
          old: { en, pos, lemma }, new: { en, pos, lemma: null }
        });
        countIssue('wrong-lemma');
        break;
      }
    }
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
console.log('\n=== APPLYING FIXES ===\n');

// Build a lookup of fixes by key
const fixByKey = {};
for (const f of allFixes) {
  fixByKey[f.key] = f;
}

const dictSrc = fs.readFileSync(DICT_PATH, 'utf8');
const lines = dictSrc.split('\n');
let applied = 0;
let failed = 0;

// Process line by line
const entryLineRegex = /^(\s*)(['"])((?:[^'"]|(?<=\\)['"])*?)\2(\s*:\s*\{)(.*?)(\},?\s*)$/;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  // Try to match a dictionary entry line
  const keyMatch = line.match(/^\s*['"]([^'"]+)['"]\s*:\s*\{/);
  if (!keyMatch) continue;

  const key = keyMatch[1];
  const f = fixByKey[key];
  if (!f) continue;

  // Extract the body between { and }
  const braceStart = line.indexOf('{');
  const braceEnd = line.lastIndexOf('}');
  if (braceStart < 0 || braceEnd < 0) { failed++; continue; }

  const prefix = line.slice(0, braceStart + 1);
  const body = line.slice(braceStart + 1, braceEnd);
  const suffix = line.slice(braceEnd);

  let newBody = body;
  const newEn = f.new.en;
  const newPos = f.new.pos;
  const newLemma = f.new.lemma;

  // Replace en value (handle escaped apostrophes)
  if (newEn !== undefined) {
    const escaped = newEn.replace(/'/g, "\\'");
    newBody = newBody.replace(/en:\s*'(?:[^'\\]|\\.)*'/, `en: '${escaped}'`);
  }

  // Replace pos value
  if (newPos !== undefined) {
    newBody = newBody.replace(/pos:\s*'(?:[^'\\]|\\.)*'/, `pos: '${newPos}'`);
  }

  // Handle lemma
  if (newLemma === null) {
    newBody = newBody.replace(/,\s*lemma:\s*'(?:[^'\\]|\\.)*'/, '');
  } else if (newLemma !== undefined) {
    if (newBody.includes('lemma:')) {
      newBody = newBody.replace(/lemma:\s*'(?:[^'\\]|\\.)*'/, `lemma: '${newLemma}'`);
    } else {
      newBody = newBody.replace(/(pos:\s*'(?:[^'\\]|\\.)*')/, `$1, lemma: '${newLemma}'`);
    }
  }

  if (newBody !== body) {
    lines[i] = prefix + newBody + suffix;
    applied++;
  }
}

fs.writeFileSync(DICT_PATH, lines.join('\n'));
console.log(`Applied: ${applied}, Failed: ${failed}`);
console.log(`\nDone! ${applied} fixes applied to Italian dictionary.`);
