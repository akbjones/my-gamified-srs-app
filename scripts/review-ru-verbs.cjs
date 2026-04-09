#!/usr/bin/env node
/**
 * COMPLETE Russian dictionary review script.
 * Checks EVERY SINGLE ENTRY for:
 *   A: "to " on non-verbs
 *   B: Verb form issues (past tense, gerund, -ed after "to ")
 *   C: Missing "to " on verbs (infinitives ending in -ть/-ться/-чь)
 *   D: Garbage semicolons (context bleed from sentence)
 *   E: Wrong meaning (Russian knowledge)
 *   F: Backslash-garbled entries
 *   G: Truncated translations
 *   H: Wrong POS tags
 *
 * Writes fixes to scripts/output/ru-full-verb-review.json
 * Then applies all fixes directly to the dictionary file.
 */

const fs = require('fs');
const path = require('path');

const DICT_PATH = path.join(__dirname, '..', 'src', 'data', 'dictionary', 'ru.ts');
const OUTPUT_PATH = path.join(__dirname, 'output', 'ru-full-verb-review.json');

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

// Build entry lookup
const entryMap = {};
for (const e of entries) {
  entryMap[e.key] = e;
}

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
  'hope','nest','smoke','steal','contain','endure','bother',
  'rage','rave','sharpen','forge','catalog','engrave','embroider',
  'rehearse','season','mutter','whisper','toss','develop','envelop',
  'clear','photograph','document','state','declare','claim','install',
  'observe','accumulate','promise','water','scatter','design',
]);

// ─── KNOWN English non-verb nouns ───────────────────────────────────────────
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
  // Russian-specific additions
  'baikal','balalaika','borsch','borscht','blini','samovar','matryoshka',
  'troika','valenki','izba','dacha','steppe','taiga','tundra',
  'velvet','sapphire','syrup','veterinarian','masterpiece','harpist',
  'cappuccino','waiter','waitress','peasant','jail','cartoon',
  'video game','hundredth','hundred','indicator','indication',
  'index','signal','sign','contribution','constitution',
  'comparison','contradiction','controversy','contract','opposite','contrary',
  'control','corridor','hallway','crust','covering','coverage',
  'habit','custom','tradition','climate','environment','coast',
  'constancy','contour','outline','view','speed',
  'pacification','calm','warmth',
]);

// ─── Bad verb forms after "to " ─────────────────────────────────────────────
function isBadVerbForm(word) {
  const w = word.toLowerCase();
  // Past tense irregulars
  const irregular = ['went','was','were','had','did','got','came','took','gave',
    'saw','knew','found','felt','kept','left','lost','met','paid','ran','said',
    'sat','set','shot','shut','sold','spent','stood','taught','told','thought',
    'understood','woke','won','wore','wrote','drove','drew','fell','flew','grew',
    'held','hung','led','meant','read','rang','rose','shook','showed','slept',
    'spoke','stole','struck','swam','swore','swept','threw','tore','brought',
    'caught','chose','fought','froze','hid','rode','fed','bled','bred','crept',
    'dealt','dug','knelt','lent','lit','shed','shone','shrank','slid','slung',
    'spun','stung','stunk','swung','wept','wound','wove','wrung',
    // -ed regular past
    'painted','cooked','started','ordered','convinced','called','left',
    'checked','helped','studied','apologized','learned','watched','allowed',
    'understood','renewed','spoke','stated','declared','claimed','installed',
    'observed','accumulated','promised','watered','scattered','designed',
    'opened','closed','finished','waited','talked','walked','worked',
    'played','asked','tried','looked','needed','turned','stopped','changed',
    'happened','reached','listened','loved','appeared','moved','lived',
    'wanted','laughed','accepted','approved','appreciated','announced',
    'cataloged','confessed','confided','controlled','documented',
    'engraved','embroidered','rehearsed','seasoned','muttered','whispered',
    'tossed','developed','enveloped','cleared','photographed','raged',
    'forged','sharpened','saved','informed','postponed','translated',
    'added','arranged','invented','discovered','pulled','carried','reached',
    'offered','suggested','admitted','confessed','accompanied','contained',
    'reported','climbed','received','hurried','resolved','printed',
    'installed','invented','designed','gathered','collected','deposited'];
  if (irregular.includes(w)) return true;
  // -ing forms (gerund)
  if (/ing$/.test(w) && w.length > 5 &&
      !['bring','ring','sing','string','spring','swing','sting','cling',
        'fling','sling','wring','thing'].includes(w)) return true;
  // -ed forms
  if (/ed$/.test(w) && w.length > 4 && !['bed','red','shed','need','feed','seed',
    'lead','read','proceed','exceed','succeed','bleed'].includes(w)) return true;
  return false;
}

// ─── Garbage first-parts in semicolon translations ─────────────────────────
const GARBAGE_FIRST_PARTS = new Set([
  "he's","she's","it's","i'm","we're","they're","you're",
  "he","she","we","they","i","you","it",
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
  "gasoline","insisting","wish","dunno",
  "anymore","accordance","never","evident","always","memory",
  "sculptor","hedgehog","colleague","archer","moment","love",
  "electric","word","accord","musician",
  "closer","electrician","milk","a surname","another",
  "boy","children","director","crocodile","fencer","mountaineer",
  "forester","twentieth","place","floor","brewer","courage",
  "childhood","silent","nurse","great","midwife","biologist",
  "store","four","russian","mom","dad","man","woman","people",
  "taxi","cat","jeweler","person","sea","bed","book",
  "things","reason","out","now","lost","often","main",
  "hello","year","favorite","plane","last",
  "don't","russia",
  // Russian-specific garbage
  "to gets","to talks","to wants","to takes","to lived",
  "to watched","to woken","to brought","to seen","to started",
  "to stood","to having","to coming","to known",
  "to cook","to start","to painted","to understand","to allow",
  "to watch","to order","to learn","to check","to renew",
  "to left","to lead","to convincing","to speak","to drove",
  "to help","to apologize","to study","to called","to read",
  "to run","to met","to happened","to explained","to smiling",
  "to waved","to drawing","to riding","to waiting","to hugging",
  "to offered","to informed","to cried","to saving","to cooking",
  "to talking","to locked","to finished","to knowing","to pulled",
  "to prepared","to saying","to thought","to inquired","to spoke",
  "to returned","to met","to decorated","to updated","to getting",
]);

// ============================================================
// MANUAL FIXES MAP (Russian knowledge-based corrections)
// ============================================================
const FIXES = {};

function fix(key, en, pos, lemma, issueType, note) {
  FIXES[key] = { en, pos, lemma, issueType, note };
}

// --- NON-VERBS wrongly tagged as 'v' with "to " prefix ---
fix('аудитории', 'audience; auditorium', 'n', undefined, 'wrong-pos', 'noun not verb');
fix('байкал', 'Baikal', 'n', undefined, 'wrong-pos', 'proper noun not verb');
fix('баклуши', 'idleness', 'n', undefined, 'wrong-pos', 'noun (бить баклуши = idle)');
fix('балет', 'ballet', 'n', undefined, 'wrong-pos', 'noun not verb');
fix('беды', 'trouble', 'n', undefined, 'wrong-pos', 'noun not verb');
fix('белую', 'white', 'adj', undefined, 'wrong-pos', 'adjective not verb');
fix('берега', 'bank; shore', 'n', 'берег', 'wrong-pos', 'noun genitive');
fix('билет', 'ticket', 'n', undefined, 'wrong-pos', 'noun not verb');
fix('благодарность', 'gratitude', 'n', undefined, 'wrong-pos', 'noun not verb');
fix('благодаря', 'thanks to', 'prep', undefined, 'wrong-pos', 'preposition');
fix('блок', 'block', 'n', undefined, 'wrong-pos', 'noun not verb');
fix('боль', 'pain', 'n', undefined, 'wrong-pos', 'noun not verb');
fix('букет', 'bouquet', 'n', undefined, 'wrong-pos', 'noun not verb');
fix('вареньем', 'jam', 'n', undefined, 'wrong-pos', 'noun instrumental');
fix('вашего', 'your', 'pron', 'ваш', 'wrong-pos', 'pronoun not verb');
fix('вернёшь', 'you will return', 'v', 'вернуть', 'garbled-translation', 'garbled');
fix('вечеринки', 'party; parties', 'n', undefined, 'wrong-pos', 'noun not verb');
fix('вид', 'view; appearance', 'n', undefined, 'wrong-pos', 'noun not verb');
fix('видом', 'view; appearance', 'n', 'вид', 'wrong-pos', 'noun instrumental');
fix('виды', 'views; types', 'n', 'вид', 'wrong-pos', 'noun plural');

// --- Garbled "to " + pronoun/article/wrong form ---
fix('бегут', 'they are running', 'v', 'бежать', 'garbled-translation', 'not "to they\'re running"');
fix('беру', 'I take', 'v', 'брать', 'garbled-translation', 'not "to i\'ll take it"');
fix('болеет', 'is sick', 'v', 'болеть', 'garbled-translation', 'not "to is sick"');
fix('было', 'was', 'v', 'быть', 'garbled-translation', 'not "to was"');
fix('едете', 'you are going', 'v', 'ехать', 'garbled-translation', 'not "to you\'re going"');
fix('идёшь', 'you are going', 'v', 'идти', 'garbled-translation', 'not "to you\'re going"');
fix('известно', 'is known', 'adj', undefined, 'wrong-pos', 'adjective/predicate');
fix('моя', 'my (f.)', 'pron', undefined, 'wrong-pos', 'pronoun not verb');
fix('сердится', 'is angry', 'v', 'сердиться', 'garbled-translation', 'not "to is angry"');
fix('славится', 'is famous', 'v', 'славиться', 'garbled-translation', 'not "to is famous"');
fix('убирается', 'is being cleaned', 'v', 'убираться', 'garbled-translation', 'not "to is being cleaned up"');
fix('придётся', 'will have to', 'v', 'приходиться', 'garbled-translation', 'not "to have to"');
fix('вытащишь', 'you will pull out', 'v', 'вытащить', 'garbled-translation', 'garbled');
fix('закончишь', 'you will finish', 'v', 'закончить', 'garbled-translation', 'garbled');

// --- "to have + past participle" pattern (perfective gerund, NOT verb infinitive) ---
fix('встретившись', 'having met', 'v', 'встретиться', 'verb-form', 'perfective gerund');
fix('закончив', 'having finished', 'v', 'закончить', 'verb-form', 'perfective gerund');
fix('записав', 'having written down', 'v', 'записать', 'verb-form', 'perfective gerund');
fix('заплатив', 'having paid', 'v', 'заплатить', 'verb-form', 'perfective gerund');
fix('извинившись', 'having apologized', 'v', 'извиниться', 'verb-form', 'perfective gerund');
fix('изменилась', 'changed (f.)', 'v', 'измениться', 'verb-form', 'past tense not infinitive');
fix('купив', 'having bought', 'v', 'купить', 'verb-form', 'perfective gerund');
fix('набрав', 'having dialed', 'v', 'набрать', 'verb-form', 'perfective gerund');
fix('найдя', 'having found', 'v', 'найти', 'verb-form', 'perfective gerund');
fix('написав', 'having written', 'v', 'написать', 'verb-form', 'perfective gerund');
fix('окончив', 'having finished', 'v', 'окончить', 'verb-form', 'perfective gerund');
fix('отдохнув', 'having rested', 'v', 'отдохнуть', 'verb-form', 'perfective gerund');
fix('переехав', 'having moved', 'v', 'переехать', 'verb-form', 'perfective gerund');
fix('подготовившись', 'having prepared', 'v', 'подготовиться', 'verb-form', 'perfective gerund');
fix('позавтракал', 'had breakfast', 'v', 'позавтракать', 'verb-form', 'past tense');
fix('положив', 'having put', 'v', 'положить', 'verb-form', 'perfective gerund');
fix('получив', 'having received', 'v', 'получить', 'verb-form', 'perfective gerund');
fix('поняв', 'having understood', 'v', 'понять', 'verb-form', 'perfective gerund');
fix('пообедала', 'had lunch', 'v', 'пообедать', 'verb-form', 'past tense');
fix('попрощавшись', 'having said goodbye', 'v', 'попрощаться', 'verb-form', 'perfective gerund');
fix('посадив', 'having planted', 'v', 'посадить', 'verb-form', 'perfective gerund');
fix('посмотрев', 'having looked', 'v', 'посмотреть', 'verb-form', 'perfective gerund');
fix('поставив', 'having put', 'v', 'поставить', 'verb-form', 'perfective gerund');
fix('постирав', 'having washed', 'v', 'постирать', 'verb-form', 'perfective gerund');
fix('потеряв', 'having lost', 'v', 'потерять', 'verb-form', 'perfective gerund');
fix('поужинали', 'had dinner', 'v', 'поужинать', 'verb-form', 'past tense');
fix('приготовив', 'having prepared', 'v', 'приготовить', 'verb-form', 'perfective gerund');
fix('приехав', 'having arrived', 'v', 'приехать', 'verb-form', 'perfective gerund');
fix('проверив', 'having checked', 'v', 'проверить', 'verb-form', 'perfective gerund');
fix('решив', 'having decided', 'v', 'решить', 'verb-form', 'perfective gerund');
fix('сделав', 'having done', 'v', 'сделать', 'verb-form', 'perfective gerund');
fix('собрав', 'having collected', 'v', 'собрать', 'verb-form', 'perfective gerund');
fix('сфотографировав', 'having photographed', 'v', 'сфотографировать', 'verb-form', 'perfective gerund');
fix('убрав', 'having removed', 'v', 'убрать', 'verb-form', 'perfective gerund');
fix('узнав', 'having learned', 'v', 'узнать', 'verb-form', 'perfective gerund');
fix('услышав', 'having heard', 'v', 'услышать', 'verb-form', 'perfective gerund');

// --- "to " + past tense (bad verb forms) ---
fix('бушевала', 'raged', 'v', 'бушевать', 'verb-form', 'past tense not infinitive');
fix('выгравировала', 'engraved', 'v', 'выгравировать', 'verb-form', 'past tense');
fix('выделывал', 'was making', 'v', 'выделывать', 'verb-form', 'past tense');
fix('выковал', 'forged', 'v', 'выковать', 'verb-form', 'past tense');
fix('выстиранная', 'washed; laundered', 'adj', 'выстирать', 'wrong-pos', 'participle = adj');
fix('добавил', 'added', 'v', 'добавить', 'verb-form', 'past tense');
fix('долгожданную', 'long-awaited', 'adj', undefined, 'wrong-pos', 'adjective');
fix('задокументировал', 'documented', 'v', 'задокументировать', 'verb-form', 'past tense');
fix('затачивал', 'sharpened', 'v', 'затачивать', 'verb-form', 'past tense');
fix('заявил', 'stated', 'v', 'заявить', 'verb-form', 'past tense');
fix('заявила', 'stated', 'v', 'заявить', 'verb-form', 'past tense');
fix('изобретено', 'invented', 'adj', undefined, 'wrong-pos', 'short participle');
fix('каталогизировал', 'cataloged', 'v', 'каталогизировать', 'verb-form', 'past tense');
fix('мечтала', 'dreamed', 'v', 'мечтать', 'verb-form', 'past tense');
fix('наблюдал', 'observed', 'v', 'наблюдать', 'verb-form', 'past tense');
fix('обсуждал', 'discussed', 'v', 'обсуждать', 'verb-form', 'past tense');
fix('окутал', 'enveloped', 'v', 'окутать', 'verb-form', 'past tense');
fix('пообещал', 'promised', 'v', 'пообещать', 'verb-form', 'past tense');
fix('пообещала', 'promised', 'v', 'пообещать', 'verb-form', 'past tense');
fix('пробормотал', 'muttered', 'v', 'пробормотать', 'verb-form', 'past tense');
fix('прошептала', 'whispered', 'v', 'прошептать', 'verb-form', 'past tense');
fix('разработал', 'developed', 'v', 'разработать', 'verb-form', 'past tense');
fix('расчищал', 'was clearing', 'v', 'расчищать', 'verb-form', 'past tense');
fix('расшивала', 'was embroidering', 'v', 'расшивать', 'verb-form', 'past tense');
fix('репетировала', 'rehearsed', 'v', 'репетировать', 'verb-form', 'past tense');
fix('утверждал', 'claimed', 'v', 'утверждать', 'verb-form', 'past tense');
fix('утверждала', 'claimed', 'v', 'утверждать', 'verb-form', 'past tense');
fix('приправил', 'seasoned', 'v', 'приправить', 'verb-form', 'past tense');
fix('подбрасывал', 'was tossing', 'v', 'подбрасывать', 'verb-form', 'past tense');
fix('потускневшую', 'faded; tarnished', 'adj', undefined, 'wrong-pos', 'participle = adj');
fix('левой', 'left', 'adj', undefined, 'wrong-pos', 'adjective');
fix('одетый', 'dressed', 'adj', undefined, 'wrong-pos', 'participle = adj');
fix('скучающий', 'bored; boring', 'adj', undefined, 'wrong-pos', 'participle = adj');
fix('приготовленный', 'prepared; cooked', 'adj', 'приготовить', 'wrong-pos', 'participle = adj');
fix('собранный', 'gathered; assembled', 'adj', 'собрать', 'wrong-pos', 'participle = adj');
fix('переведённая', 'translated', 'adj', 'перевести', 'wrong-pos', 'participle = adj');
fix('рассказанная', 'told; narrated', 'adj', 'рассказать', 'wrong-pos', 'participle = adj');
fix('нарисованная', 'drawn; painted', 'adj', 'нарисовать', 'wrong-pos', 'participle = adj');
fix('сваренный', 'boiled; cooked', 'adj', 'сварить', 'wrong-pos', 'participle = adj');
fix('прочитанная', 'read (participle)', 'adj', 'прочитать', 'wrong-pos', 'participle = adj');

// --- "to " + passive forms (reflexive -ся verbs used as passives) ---
fix('высаживают', 'are planted', 'v', 'высаживать', 'verb-form', '3pl present');
fix('доставляются', 'are delivered', 'v', 'доставляться', 'verb-form', 'passive');
fix('запекаются', 'are baked', 'v', 'запекаться', 'verb-form', 'passive');
fix('запомнится', 'will be remembered', 'v', 'запомниться', 'verb-form', 'passive');
fix('играются', 'are played', 'v', 'играться', 'verb-form', 'passive');
fix('изучается', 'is being studied', 'v', 'изучаться', 'verb-form', 'passive');
fix('используется', 'is used', 'v', 'использоваться', 'verb-form', 'passive');
fix('обижается', 'is offended', 'v', 'обижаться', 'verb-form', 'reflexive');
fix('обновляется', 'is being updated', 'v', 'обновляться', 'verb-form', 'passive');
fix('организуется', 'is being organized', 'v', 'организоваться', 'verb-form', 'passive');
fix('печатаются', 'are printed', 'v', 'печататься', 'verb-form', 'passive');
fix('понадобится', 'will be needed', 'v', 'понадобиться', 'verb-form', 'future');
fix('приближается', 'is approaching', 'v', 'приближаться', 'verb-form', 'reflexive');
fix('продают', 'sell; are sold', 'v', 'продавать', 'verb-form', '3pl present');
fix('проводится', 'is carried out', 'v', 'проводиться', 'verb-form', 'passive');
fix('прячутся', 'are hiding', 'v', 'прятаться', 'verb-form', '3pl present');
fix('разрешится', 'will be resolved', 'v', 'разрешиться', 'verb-form', 'future');
fix('распространяются', 'are spreading', 'v', 'распространяться', 'verb-form', 'passive');
fix('реставрируется', 'is being restored', 'v', 'реставрироваться', 'verb-form', 'passive');
fix('сидят', 'are sitting', 'v', 'сидеть', 'verb-form', '3pl present');
fix('сносится', 'is being demolished', 'v', 'сноситься', 'verb-form', 'passive');
fix('соблюдаются', 'are observed', 'v', 'соблюдаться', 'verb-form', 'passive');
fix('считаются', 'are considered', 'v', 'считаться', 'verb-form', 'passive');
fix('цветут', 'are blooming', 'v', 'цвести', 'verb-form', '3pl present');
fix('задерживается', 'is delayed', 'v', 'задерживаться', 'verb-form', 'reflexive');
fix('подаётся', 'is served', 'v', 'подаваться', 'verb-form', 'passive');
fix('знакомятся', 'get acquainted', 'v', 'знакомиться', 'verb-form', 'reflexive');
fix('одевается', 'gets dressed', 'v', 'одеваться', 'verb-form', 'reflexive');
fix('одевалась', 'was getting dressed', 'v', 'одеваться', 'verb-form', 'past reflexive');
fix('оделась', 'got dressed', 'v', 'одеться', 'verb-form', 'past reflexive');
fix('оделся', 'got dressed', 'v', 'одеться', 'verb-form', 'past reflexive');
fix('уезжает', 'is leaving', 'v', 'уезжать', 'verb-form', '3sg present');
fix('обрадовалась', 'was delighted', 'v', 'обрадоваться', 'verb-form', 'past tense');
fix('удивились', 'were surprised', 'v', 'удивиться', 'verb-form', 'past tense');
fix('удивляется', 'is surprised', 'v', 'удивляться', 'verb-form', 'reflexive');
fix('планируем', 'we are planning', 'v', 'планировать', 'verb-form', '1pl present');
fix('строим', 'we are building', 'v', 'строить', 'verb-form', '1pl present');
fix('находимся', 'we are located', 'v', 'находиться', 'verb-form', '1pl present');
fix('задержался', 'was delayed', 'v', 'задержаться', 'verb-form', 'past tense');
fix('спроектировано', 'was designed', 'adj', undefined, 'wrong-pos', 'short participle');
fix('основан', 'was founded', 'adj', undefined, 'wrong-pos', 'short participle');
fix('обсуждался', 'was discussed', 'v', 'обсуждаться', 'verb-form', 'past passive');

// --- "to " + past tense that look weird ---
fix('получал', 'received; was receiving', 'v', 'получать', 'verb-form', 'past tense');
fix('получала', 'received; was receiving', 'v', 'получать', 'verb-form', 'past tense');
fix('получали', 'received; were receiving', 'v', 'получать', 'verb-form', 'past tense');
fix('получил', 'received', 'v', 'получить', 'verb-form', 'past tense');
fix('получила', 'received', 'v', 'получить', 'verb-form', 'past tense');
fix('получили', 'received', 'v', 'получить', 'verb-form', 'past tense');
fix('прочитал', 'read (past)', 'v', 'прочитать', 'verb-form', 'past tense');
fix('прочитала', 'read (past)', 'v', 'прочитать', 'verb-form', 'past tense');
fix('прочитали', 'read (past)', 'v', 'прочитать', 'verb-form', 'past tense');
fix('прочитать', 'to read', 'v', undefined, 'verb-form', 'needs "to" prefix');
fix('прочитаю', 'will read', 'v', 'прочитать', 'verb-form', 'future tense');
fix('читает', 'reads', 'v', 'читать', 'verb-form', '3sg present');
fix('читаешь', 'you read', 'v', 'читать', 'verb-form', '2sg present');
fix('читай', 'read! (imperative)', 'v', 'читать', 'verb-form', 'imperative');
fix('читайте', 'read! (imperative pl.)', 'v', 'читать', 'verb-form', 'imperative');
fix('читал', 'read; was reading', 'v', 'читать', 'verb-form', 'past tense');
fix('читала', 'read; was reading', 'v', 'читать', 'verb-form', 'past tense');
fix('читали', 'read; were reading', 'v', 'читать', 'verb-form', 'past tense');
fix('читать', 'to read', 'v', undefined, 'missing-to', 'infinitive needs "to"');
fix('читаю', 'I read', 'v', 'читать', 'verb-form', '1sg present');
fix('читающий', 'reading (participle)', 'adj', 'читать', 'wrong-pos', 'participle = adj');
fix('читая', 'while reading', 'v', 'читать', 'verb-form', 'imperfective gerund');
fix('чтение', 'reading', 'n', undefined, 'wrong-pos', 'noun not verb');

// --- Garbage semicolons with context bleed from first part ---
fix('бабочек', 'butterfly; butterflies', 'n', 'бабочка', 'garbage-semicolon', '"biologist;" bleed');
fix('бабушке', 'grandma', 'n', 'бабушка', 'garbage-semicolon', '"boy;" bleed');
fix('бегает', 'runs', 'v', 'бегать', 'garbage-semicolon', '"director;" bleed');
fix('бегаю', 'I run', 'v', 'бегать', 'garbage-semicolon', '"mornings;" bleed');
fix('бегают', 'they run', 'v', 'бегать', 'garbage-semicolon', '"children;" bleed');
fix('бежит', 'runs', 'v', 'бежать', 'garbage-semicolon', '"big;" bleed');
fix('берегу', 'shore; bank', 'n', 'берег', 'garbage-semicolon', '"crocodile;" bleed');
fix('берёт', 'beret', 'n', undefined, 'garbage-semicolon', '"courage;" bleed');
fix('беру', 'I take', 'v', 'брать', 'garbage-semicolon', 'garbled');
fix('блестит', 'shines', 'v', 'блестеть', 'garbage-semicolon', '"all;" bleed');
fix('ближайшее', 'nearest', 'adj', undefined, 'garbage-semicolon', '"please;" bleed');
fix('блин', 'pancake; damn', 'n', undefined, 'garbage-semicolon', '"first;" bleed');
fix('блинов', 'pancakes', 'n', 'блин', 'garbage-semicolon', '"first;" bleed');
fix('большая', 'big', 'adj', undefined, 'garbage-semicolon', '"russia;" bleed');
fix('больного', 'sick; the patient', 'adj', undefined, 'garbage-semicolon', '"nurse;" bleed');
fix('будто', 'as if', 'conj', undefined, 'garbage-semicolon', '"silent;" bleed');
fix('будущую', 'future', 'adj', undefined, 'garbage-semicolon', '"midwife;" bleed');
fix('бури', 'storm; storms', 'n', 'буря', 'garbage-semicolon', '"forester;" bleed');
fix('бурным', 'stormy', 'adj', undefined, 'garbage-semicolon', '"twentieth;" bleed');
fix('бывает', 'happens; it happens', 'v', 'бывать', 'garbage-semicolon', '"russian;" bleed');
fix('бывают', 'there are; they happen', 'v', 'бывать', 'garbage-semicolon', '"four;" bleed');
fix('банка', 'jar; can', 'n', undefined, 'garbage-semicolon', '"store;" bleed');
fix('большом', 'big', 'adj', 'большой', 'garbage-semicolon', '"floor;" bleed');
fix('большого', 'big', 'adj', 'большой', 'garbage-semicolon', '"doctor\'s;" bleed');

// More garbage semicolons
fix('варил', 'cooked', 'v', 'варить', 'garbage-semicolon', '"brewer;" bleed');
fix('везла', 'transported; carried', 'v', 'везти', 'garbage-semicolon', '"transporting;" bleed');
fix('вёл', 'led', 'v', 'вести', 'garbage-semicolon', '"boy;" bleed');
fix('велела', 'ordered', 'v', 'велеть', 'garbage-semicolon', '"mom;" bleed');
fix('велели', 'ordered', 'v', 'велеть', 'garbage-semicolon', '"monday;" bleed');
fix('великолепной', 'magnificent', 'adj', undefined, 'garbage-semicolon', '"fencer;" bleed');
fix('вернулась', 'returned', 'v', 'вернуться', 'garbage-semicolon', '"childhood;" bleed');
fix('вернусь', 'I will return', 'v', 'вернуться', 'garbage-semicolon', 'wrong pos n');
fix('версии', 'version; versions', 'n', undefined, 'garbage-semicolon', '"all;" bleed');
fix('вершины', 'peak; summit', 'n', 'вершина', 'garbage-semicolon', '"mountaineer;" bleed');
fix('везёт', 'is lucky; carries', 'v', 'везти', 'garbage-semicolon', '"taxi;" bleed');

// --- Nouns wrongly tagged ---
fix('ароматным', 'fragrant', 'adj', undefined, 'wrong-pos', 'adjective not noun');
fix('бизнес', 'business', 'n', undefined, 'wrong-pos', 'noun not adj');
fix('богаче', 'richer', 'adj', undefined, 'wrong-pos', 'comparative adj not noun');
fix('болезней', 'disease; diseases', 'n', 'болезнь', 'wrong-pos', 'noun not adj');
fix('более', 'more', 'adv', undefined, 'wrong-pos', 'adverb not adj');
fix('боюсь', 'I am afraid', 'v', 'бояться', 'wrong-pos', 'verb not noun');
fix('ближе', 'closer', 'adv', undefined, 'wrong-pos', 'adverb not noun');
fix('вдалеке', 'in the distance', 'adv', undefined, 'wrong-pos', 'adverb not noun');
fix('вдоль', 'along', 'prep', undefined, 'wrong-pos', 'preposition not noun');
fix('везде', 'everywhere', 'adv', undefined, 'wrong-pos', 'adverb not noun');
fix('век', 'century', 'n', undefined, 'wrong-pos', 'noun not adj');
fix('вероятность', 'probability; chance', 'n', undefined, 'wrong-pos', 'noun not adj');

// --- "to " + -ed/-ing garbled on nouns/adjectives ---
fix('беспокойство', 'anxiety; worry', 'n', undefined, 'garbage-semicolon', '"sorry;" bleed');
fix('безусловно', 'undoubtedly', 'adv', undefined, 'garbage-semicolon', '"(formal);" bleed');
fix('бегущая', 'running (adj.)', 'adj', 'бежать', 'verb-form', 'participle = adj');

// --- Wrong meaning fixes (Russian knowledge) ---
fix('беспокоить', 'to bother; to worry', 'v', undefined, 'missing-to', 'infinitive');
fix('анализировал', 'analyzed', 'v', 'анализировать', 'verb-form', 'past tense not infinitive');
fix('бить', 'to beat; to hit', 'v', undefined, 'garbage-semicolon', '"to stop;" wrong');
fix('браться', 'to take on; to undertake', 'v', undefined, 'garbage-semicolon', '"to stop;" wrong');
fix('благодарим', 'we thank', 'v', 'благодарить', 'wrong-pos', 'verb not adj');
fix('благодарю', 'I thank you', 'v', 'благодарить', 'wrong-pos', 'verb not noun');

// --- Missing "to " on infinitives ---
fix('заказать', 'to order', 'v', undefined, 'garbage-semicolon', '"table;" bleed + missing to');
fix('кататься', 'to ride; to go for a ride', 'v', undefined, 'garbage-semicolon', '"last;" bleed + missing to');
fix('наступать', 'to attack; to step on', 'v', undefined, 'garbage-semicolon', '"step;" bleed + missing to');
fix('ходить', 'to walk; to go', 'v', undefined, 'garbage-semicolon', '"reason;" bleed + missing to');

// --- Garbled "to " + verb context bleed ---
fix('включив', 'having turned on', 'v', 'включить', 'verb-form', 'perfective gerund');
fix('выйдя', 'having gone out', 'v', 'выйти', 'verb-form', 'perfective gerund');
fix('достав', 'having delivered', 'v', 'достать', 'verb-form', 'perfective gerund');
fix('закрыв', 'having closed', 'v', 'закрыть', 'verb-form', 'perfective gerund');
fix('лёг', 'lay down', 'v', 'лечь', 'verb-form', 'past tense');
fix('обратился', 'appealed; turned to', 'v', 'обратиться', 'verb-form', 'past tense');
fix('поблагодарив', 'having thanked', 'v', 'поблагодарить', 'verb-form', 'perfective gerund');
fix('погладив', 'having stroked', 'v', 'погладить', 'verb-form', 'perfective gerund');
fix('сдавался', 'gave up; surrendered', 'v', 'сдаваться', 'verb-form', 'past tense');
fix('сказав', 'having said', 'v', 'сказать', 'verb-form', 'perfective gerund');
fix('умывшись', 'having washed up', 'v', 'умыться', 'verb-form', 'perfective gerund');
fix('вышел', 'came out; went out', 'v', 'выйти', 'verb-form', 'past tense');
fix('вышли', 'came out; went out', 'v', 'выйти', 'verb-form', 'past tense');

// --- More garbled semicolon entries ---
fix('довезла', 'drove; brought', 'v', 'довезти', 'garbage-semicolon', '"to drove;" garbled');
fix('довёл', 'brought to; led to', 'v', 'довести', 'garbage-semicolon', '"to finished;" garbled');
fix('дороги', 'road; roads', 'n', 'дорога', 'garbage-semicolon', '"to knowing;" garbled');
fix('достал', 'got; pulled out', 'v', 'достать', 'garbage-semicolon', '"to pulled;" garbled');
fix('дошёл', 'reached; arrived', 'v', 'дойти', 'garbage-semicolon', '"to reached;" garbled');
fix('жду', 'I wait; I am waiting', 'v', 'ждать', 'garbage-semicolon', '"to hugging;" garbled');
fix('живыми', 'alive; living', 'adj', undefined, 'garbage-semicolon', '"to decorated;" garbled');
fix('завезли', 'brought in; delivered', 'v', 'завезти', 'garbage-semicolon', '"to dropped;" garbled');
fix('занимаетесь', 'you are doing; you do', 'v', 'заниматься', 'garbled-translation', '"to be you doing" garbled');
fix('занимаюсь', 'I am doing; I do', 'v', 'заниматься', 'garbage-semicolon', '"to inquired;" garbled');
fix('занимаясь', 'while doing', 'v', 'заниматься', 'verb-form', '"to while doing" garbled');
fix('знакомимся', 'we are getting acquainted', 'v', 'знакомиться', 'garbage-semicolon', '"to meeting;" garbled');

// --- Nouns/adjectives with garbled context bleed ---
fix('картина', 'painting', 'n', undefined, 'garbage-semicolon', '"to painted;" garbled');
fix('ключ', 'key', 'n', undefined, 'garbage-semicolon', '"to locked;" garbled');
fix('ключами', 'keys', 'n', 'ключ', 'garbage-semicolon', '"to locked;" garbled');
fix('ключи', 'keys', 'n', 'ключ', 'garbage-semicolon', '"to locked;" garbled');
fix('ко', 'to; towards', 'prep', undefined, 'garbage-semicolon', '"to ran;" garbled');
fix('конца', 'end', 'n', 'конец', 'garbage-semicolon', '"to finished;" garbled');
fix('кровати', 'bed; beds', 'n', 'кровать', 'garbage-semicolon', '"to pulled;" garbled');
fix('лекции', 'lecture; lectures', 'n', 'лекция', 'garbage-semicolon', '"to laughing;" garbled');
fix('начало', 'beginning; start', 'n', undefined, 'garbage-semicolon', '"to beginning;" garbled');
fix('началом', 'beginning', 'n', 'начало', 'garbage-semicolon', '"to read;" garbled');
fix('обидно', 'it\'s offensive; it\'s a pity', 'adv', undefined, 'garbage-semicolon', '"to cried;" garbled');
fix('плотно', 'tightly; densely', 'adv', undefined, 'garbage-semicolon', '"to having;" garbled');
fix('пробежку', 'jog; run', 'n', 'пробежка', 'garbage-semicolon', '"to having;" garbled');
fix('пробку', 'cork; traffic jam', 'n', 'пробка', 'garbage-semicolon', '"to drove;" garbled');
fix('продуктов', 'products; groceries', 'n', 'продукт', 'garbage-semicolon', '"to prepared;" garbled');
fix('прощание', 'parting; farewell', 'n', undefined, 'garbage-semicolon', '"to waved;" garbled');
fix('путешествие', 'journey; trip', 'n', undefined, 'garbage-semicolon', '"to saved;" garbled');
fix('самого', 'himself; itself', 'pron', undefined, 'garbage-semicolon', '"to waiting;" garbled');
fix('словно', 'as if; like', 'conj', undefined, 'garbage-semicolon', '"to spoke;" garbled');
fix('слова', 'word; words', 'n', 'слово', 'garbage-semicolon', '"to left;" garbled');
fix('скорость', 'speed', 'n', undefined, 'wrong-pos', 'noun not verb');
fix('твоей', 'your', 'pron', undefined, 'garbage-semicolon', '"to happened;" garbled');
fix('тёплом', 'warm; warmth', 'adj', undefined, 'garbage-semicolon', '"to washed;" garbled');
fix('уверенно', 'confidently', 'adv', undefined, 'garbage-semicolon', '"to having;" garbled');
fix('улицу', 'street', 'n', 'улица', 'garbage-semicolon', '"to having;" garbled');
fix('умиротворение', 'pacification; tranquility', 'n', undefined, 'garbage-semicolon', '"to drawing;" garbled');
fix('урока', 'lesson', 'n', 'урок', 'garbage-semicolon', '"to ran;" garbled');
fix('фильме', 'film; movie', 'n', 'фильм', 'garbage-semicolon', '"to talking;" garbled');
fix('хозяев', 'owners; hosts', 'n', 'хозяин', 'garbage-semicolon', '"to having;" garbled');
fix('человеком', 'person; human', 'n', 'человек', 'garbage-semicolon', '"to met;" garbled');
fix('чем', 'than; what', 'conj', undefined, 'garbage-semicolon', '"to thought;" garbled');
fix('экскурсии', 'excursion; tour', 'n', 'экскурсия', 'garbage-semicolon', '"to led;" garbled');
fix('спокойствие', 'calm; tranquility', 'n', undefined, 'garbage-semicolon', '"to drawing;" garbled');
fix('пейзажем', 'landscape', 'n', 'пейзаж', 'garbage-semicolon', '"to riding;" garbled');
fix('подарена', 'donated; given as a gift', 'adj', 'подарить', 'garbage-semicolon', '"to painted;" garbled');
fix('почту', 'mail; post office', 'n', 'почта', 'garbage-semicolon', '"to having;" garbled');
fix('правильное', 'correct; right', 'adj', undefined, 'garbage-semicolon', '"to convincing;" garbled');
fix('предложила', 'suggested; offered', 'v', 'предложить', 'garbage-semicolon', '"to offered;" garbled');
fix('пришла', 'came; arrived', 'v', 'прийти', 'garbage-semicolon', '"to explained;" garbled');
fix('пришли', 'came; arrived', 'v', 'прийти', 'garbage-semicolon', '"to called;" garbled');
fix('протянула', 'stretched out; handed', 'v', 'протянуть', 'garbage-semicolon', '"to smiling;" garbled');
fix('прошли', 'passed; went through', 'v', 'пройти', 'garbage-semicolon', '"to walked;" garbled');
fix('себя', 'oneself', 'pron', undefined, 'wrong-pos', 'pronoun');

// --- More verb form fixes ---
fix('веселятся', 'are having fun', 'v', 'веселиться', 'verb-form', 'not "to have fun"');
fix('ужинать', 'to have dinner', 'v', undefined, 'verb-form', 'correct meaning');

// --- More garbled entries ---
fix('возвращаемся', 'we are returning', 'v', 'возвращаться', 'garbled-translation', '"to returning" garbled');
fix('волновались', 'were worried', 'v', 'волноваться', 'garbled-translation', '"to convincing" garbled');
fix('вкусным', 'delicious', 'adj', undefined, 'garbage-semicolon', '"to cooked;" garbled');
fix('всему', 'everything', 'pron', undefined, 'garbage-semicolon', '"to painted;" garbled');
fix('встречи', 'meeting; meetings', 'n', 'встреча', 'garbage-semicolon', '"to meeting;" garbled');
fix('вынесла', 'carried out; endured', 'v', 'вынести', 'garbage-semicolon', '"to carried;" garbled');
fix('говоря', 'speaking; talking', 'v', 'говорить', 'garbage-semicolon', '"to talking;" garbled');
fix('готовились', 'were preparing', 'v', 'готовиться', 'garbled-translation', '"to be preparing" garbled');
fix('готовится', 'is being prepared', 'v', 'готовиться', 'garbled-translation', '"to preparing" garbled');
fix('гуляли', 'were walking; strolled', 'v', 'гулять', 'garbled-translation', '"to walked" garbled');
fix('держи', 'hold! (imperative)', 'v', 'держать', 'garbage-semicolon', '"to updated;" garbled');
fix('должность', 'position; job title', 'n', undefined, 'garbage-semicolon', '"to offered;" garbled');
fix('едя', 'riding; eating', 'v', 'ехать', 'garbage-semicolon', '"to riding;" garbled');
fix('ехал', 'was driving', 'v', 'ехать', 'garbled-translation', '"to be driving" garbled');
fix('ехала', 'was driving', 'v', 'ехать', 'garbled-translation', '"to be driving" garbled');
fix('ехали', 'were driving', 'v', 'ехать', 'garbled-translation', '"to be driving" garbled');
fix('курить', 'to smoke', 'v', undefined, 'garbage-semicolon', '"to smoking;" garbled');
fix('лежала', 'was lying', 'v', 'лежать', 'garbage-semicolon', '"to read;" garbled');
fix('мыл', 'washed', 'v', 'мыть', 'garbage-semicolon', '"to washed;" garbled');
fix('начался', 'began; started', 'v', 'начаться', 'garbled-translation', '"to started" garbled');
fix('несёт', 'carries', 'v', 'нести', 'garbled-translation', '"to carrying" garbled');
fix('обнаружили', 'discovered', 'v', 'обнаружить', 'garbled-translation', '"to discovered" garbled');
fix('обнимаю', 'I hug', 'v', 'обнимать', 'garbage-semicolon', '"to hugging;" garbled');
fix('обрадовались', 'were delighted', 'v', 'обрадоваться', 'garbage-semicolon', '"to returned;" garbled');
fix('открылась', 'opened', 'v', 'открыться', 'garbled-translation', '"to opened" garbled');
fix('отправилась', 'went; set off', 'v', 'отправиться', 'garbage-semicolon', '"to having;" garbled');
fix('ошибся', 'made a mistake', 'v', 'ошибиться', 'garbage-semicolon', '"to thought;" garbled');
fix('перенёс', 'transferred; endured', 'v', 'перенести', 'garbage-semicolon', '"to carried;" garbled');
fix('перенесена', 'transferred; rescheduled', 'adj', 'перенести', 'garbage-semicolon', '"to informed;" garbled');
fix('перенесено', 'postponed; rescheduled', 'adj', 'перенести', 'garbled-translation', '"to postponed" garbled');
fix('перенесли', 'transferred; moved', 'v', 'перенести', 'garbage-semicolon', '"to moved;" garbled');
fix('передали', 'handed over; passed', 'v', 'передать', 'garbage-semicolon', '"to called;" garbled');
fix('поднялся', 'rose; climbed', 'v', 'подняться', 'garbled-translation', '"to climbed" garbled');
fix('подъехала', 'drove up; arrived', 'v', 'подъехать', 'garbage-semicolon', '"to drove;" garbled');
fix('поехали', 'went; let\'s go', 'v', 'поехать', 'garbled-translation', '"to went" garbled');
fix('полили', 'watered', 'v', 'полить', 'garbled-translation', '"to watered" garbled');
fix('поставь', 'put! (imperative)', 'v', 'поставить', 'garbage-semicolon', '"to set;" garbled');
fix('призналась', 'admitted; confessed', 'v', 'признаться', 'garbled-translation', '"to admitted" garbled');
fix('признался', 'admitted; confessed', 'v', 'признаться', 'garbled-translation', '"to admitted" garbled');
fix('провести', 'to conduct; to spend (time)', 'v', undefined, 'garbage-semicolon', '"to talked;" garbled');
fix('проехали', 'drove past; passed', 'v', 'проехать', 'garbage-semicolon', '"to drove;" garbled');
fix('рисуя', 'while drawing', 'v', 'рисовать', 'verb-form', '"to while drawing" garbled');
fix('решал', 'was solving; decided', 'v', 'решать', 'garbage-semicolon', '"to solving;" garbled');
fix('расставил', 'arranged', 'v', 'расставить', 'garbled-translation', '"to arranged" garbled');
fix('сообщила', 'informed; reported', 'v', 'сообщить', 'garbage-semicolon', '"to informed;" garbled');
fix('сопровождала', 'accompanied', 'v', 'сопровождать', 'garbled-translation', '"to accompanied" garbled');
fix('содержала', 'contained', 'v', 'содержать', 'garbled-translation', '"to contained" garbled');
fix('смогла', 'managed; was able', 'v', 'смочь', 'garbage-semicolon', '"to saying;" garbled');
fix('становимся', 'we become', 'v', 'становиться', 'garbled-translation', '"to getting" garbled');
fix('становится', 'becomes', 'v', 'становиться', 'garbled-translation', '"to getting" garbled');
fix('становятся', 'they become', 'v', 'становиться', 'garbled-translation', '"to getting" garbled');
fix('считал', 'considered; thought', 'v', 'считать', 'garbage-semicolon', '"to thought;" garbled');
fix('торопились', 'were in a hurry', 'v', 'торопиться', 'garbled-translation', '"to hurried" garbled');
fix('убеждал', 'was convincing; persuaded', 'v', 'убеждать', 'garbled-translation', '"to convincing" garbled');
fix('убеждала', 'was convincing; persuaded', 'v', 'убеждать', 'garbled-translation', '"to convincing" garbled');
fix('убирала', 'was cleaning', 'v', 'убирать', 'garbage-semicolon', '"to cooking;" garbled');
fix('узнаём', 'we learn; we find out', 'v', 'узнавать', 'garbage-semicolon', '"to called;" garbled');
fix('узнать', 'to find out; to learn', 'v', undefined, 'garbage-semicolon', '"to called;" garbled');
fix('шёл', 'was walking; went', 'v', 'идти', 'garbage-semicolon', '"to went;" garbled');
fix('исполнилось', 'turned (age); fulfilled', 'v', 'исполниться', 'garbled-translation', '"to turned" garbled');
fix('накопила', 'accumulated; saved up', 'v', 'накопить', 'garbage-semicolon', '"to saved;" garbled');
fix('установил', 'installed', 'v', 'установить', 'garbled-translation', '"to installed" garbled');
fix('вёз', 'was carrying; was transporting', 'v', 'везти', 'verb-form', '"to be driving" garbled');
fix('вела', 'led; was leading', 'v', 'вести', 'garbage-semicolon', '"to leading;" garbled');

// --- More wrong POS fixes ---
fix('бреется', 'shaves', 'v', 'бриться', 'wrong-meaning', '"shaf" is garbage');
fix('бегая', 'while running', 'v', 'бегать', 'verb-form', 'imperfective gerund');
fix('бегут', 'they are running', 'v', 'бежать', 'garbled-translation', 'not "to they\'re running"');
fix('боится', 'is afraid', 'v', 'бояться', 'verb-form', 'not "to be afraid" for conjugated form');
fix('боялся', 'was afraid', 'v', 'бояться', 'verb-form', 'past tense');
fix('боятся', 'are afraid', 'v', 'бояться', 'verb-form', '3pl present');
fix('буду', 'I will', 'v', 'быть', 'verb-form', 'not "to will"');
fix('будучи', 'being', 'v', 'быть', 'verb-form', 'gerund');
fix('бегал', 'ran; used to run', 'v', 'бегать', 'verb-form', 'past tense');
fix('бегала', 'ran; used to run', 'v', 'бегать', 'verb-form', 'past tense');
fix('бегали', 'ran; used to run', 'v', 'бегать', 'verb-form', 'past tense');

// --- Entries with IPA containing quotes ---
fix('блюдо', 'dish', 'n', undefined, 'backslash', 'IPA has quote in it');

// --- Wrong meaning entries ---
fix('бегут', 'they are running', 'v', 'бежать', 'garbled-translation', 'garbled');
fix('беспокоиться', 'to worry', 'v', undefined, 'correct', 'already correct');

// --- POS fixes for miscategorized entries ---
fix('ближайшему', 'the nearest', 'adj', undefined, 'wrong-pos', 'adjective not noun');
fix('веселее', 'more cheerful', 'adj', 'весёлый', 'wrong-pos', 'comparative adj');
fix('вернёмся', 'we will return', 'v', 'вернуться', 'wrong-pos', 'verb not noun');
fix('вернёшься', 'you will return', 'v', 'вернуться', 'wrong-pos', 'verb not noun');
fix('ваша', 'your (f.)', 'pron', 'ваш', 'wrong-pos', 'pronoun');
fix('ваше', 'your (n.)', 'pron', 'ваш', 'wrong-pos', 'pronoun');
fix('бежал', 'ran', 'v', 'бежать', 'verb-form', 'past tense');

// --- Additional garbled with "to" on various verb forms ---
fix('обедали', 'were having lunch', 'v', 'обедать', 'verb-form', '"to have lunch" wrong');

// --- Additional fixes for "having" pattern ---
fix('вещами', 'things; belongings', 'n', 'вещь', 'garbage-semicolon', 'garbled');

// --- Fix bogus entries ---
fix('ведёт', 'leads; drives', 'v', 'вести', 'garbage-semicolon', '"to drives;" garbled');

// ============================================================
// AUTOMATED FIXES - process remaining entries
// ============================================================

const allFixes = [];

// Process every entry
for (const e of entries) {
  // Skip if already manually fixed
  if (FIXES[e.key]) {
    const f = FIXES[e.key];
    if (f.issueType === 'correct') continue; // Skip correct entries
    allFixes.push({
      key: e.key,
      old: { en: e.en, pos: e.pos, lemma: e.lemma },
      new: { en: f.en, pos: f.pos, lemma: f.lemma },
      issueType: f.issueType,
      note: f.note,
    });
    continue;
  }

  let newEn = e.en;
  let newPos = e.pos;
  let newLemma = e.lemma;
  let issueType = null;
  let note = '';

  // ─── Check A: "to " on non-verbs ──────────────────────────────
  if (e.en.startsWith('to ') && e.pos !== 'v') {
    const rest = e.en.slice(3);
    newEn = rest;
    issueType = 'to-prefix-on-non-verb';
    note = `"to " on ${e.pos}`;
  }

  // ─── Check B: Garbled "to " + pronoun/article/past form on verbs ─
  if (e.en.startsWith('to ') && e.pos === 'v') {
    const rest = e.en.slice(3);
    const firstWord = rest.split(/[;,\s]/)[0].toLowerCase().replace(/'/g, "'");

    // "to " + pronoun/article patterns
    if (/^(i'm|he's|she's|it's|we're|they're|you're|i'll|you'll|he'll|she'll|they'll|we'll)/.test(rest.toLowerCase().replace(/'/g, "'"))) {
      // Garbled: strip "to " and clean up
      const cleaned = rest.replace(/^(i'm|he's|she's|it's|we're|they're|you're|i'll|you'll|he'll|she'll|they'll|we'll)\s*/i, '').trim();
      if (!issueType) {
        newEn = cleaned || rest;
        issueType = 'garbled-translation';
        note = `"to ${firstWord}" garbled`;
      }
    }
    // "to " + subject pronoun
    else if (/^(he |she |they |i |we |you |it |is |was |were |has |have |had |the |a |an |my |his |her |its |our |your |their |this |that |these |those )/.test(rest.toLowerCase())) {
      if (!issueType) {
        // Remove the subject and fix
        const cleaned = rest.replace(/^(he|she|they|i|we|you|it|is|was|were|has|have|had|the|a|an|my|his|her|its|our|your|their|this|that|these|those)\s+/i, '').trim();
        newEn = cleaned || rest;
        issueType = 'garbled-translation';
        note = `"to ${firstWord}" garbled`;
      }
    }
    // "to " + bad verb form (past tense, -ing, -ed)
    else if (isBadVerbForm(firstWord)) {
      if (!issueType) {
        // For infinitives (ть/ться), keep "to " but fix the verb form
        if (e.key.endsWith('ть') || e.key.endsWith('ться') || e.key.endsWith('чь') || e.key.endsWith('чься')) {
          // This is an infinitive that should have "to " + base form
          // We can't always auto-fix the base form, but we try
          issueType = 'verb-base-form';
          note = `"to ${firstWord}" should be base form`;
        } else {
          // Non-infinitive: remove "to "
          newEn = rest;
          issueType = 'verb-form';
          note = `conjugated form, not infinitive`;
        }
      }
    }
    // "to having;" pattern
    else if (rest.startsWith('having;') || rest.startsWith('having ')) {
      if (!issueType && rest.includes(';')) {
        const parts = rest.split(';');
        const good = parts.slice(1).join(';').trim();
        if (good) {
          newEn = good;
          issueType = 'garbage-semicolon';
          note = '"to having;" context bleed';
        }
      }
    }
  }

  // ─── Check C: Missing "to " on verb infinitives ────────────────
  if (!issueType && e.pos === 'v' && !e.en.startsWith('to ') &&
      (e.key.endsWith('ть') || e.key.endsWith('ться') || e.key.endsWith('чь') || e.key.endsWith('чься'))) {
    const firstWord = e.en.split(/[;,\s]/)[0].toLowerCase();
    if (KNOWN_ENGLISH_VERBS.has(firstWord) || /^[a-z]+$/.test(firstWord)) {
      // Check if the English starts with a verb
      if (!e.en.includes(';')) {
        newEn = 'to ' + e.en;
        issueType = 'missing-to';
        note = 'infinitive missing "to "';
      }
    }
  }

  // ─── Check D: Garbage semicolons ──────────────────────────────
  if (!issueType && e.en.includes(';')) {
    const parts = e.en.split(';').map(p => p.trim());
    const first = parts[0].toLowerCase();

    // Check if first part is garbage context
    if (GARBAGE_FIRST_PARTS.has(first)) {
      const good = parts.slice(1).join('; ').trim();
      if (good) {
        newEn = good;
        issueType = 'garbage-semicolon';
        note = `"${first};" context bleed`;
      }
    }

    // Check if first part starts with "to " and is a bad verb translation for a semicolon entry
    if (!issueType && parts[0].startsWith('to ')) {
      const verbPart = parts[0].slice(3).split(/[\s,]/)[0].toLowerCase();
      if (isBadVerbForm(verbPart)) {
        const good = parts.slice(1).join('; ').trim();
        if (good) {
          newEn = good;
          issueType = 'garbage-semicolon';
          note = `"to ${verbPart};" bad verb form context bleed`;
        }
      }
    }
  }

  // ─── Check F: Backslash-garbled entries ─────────────────────────
  if (!issueType && e.en.includes('\\')) {
    issueType = 'backslash';
    newEn = e.en.replace(/\\/g, '');
    note = 'backslash garbled';
  }

  // ─── Check G: Truncated translations ───────────────────────────
  if (!issueType && e.en.length === 0) {
    issueType = 'truncated';
    note = 'empty translation';
    // Don't fix, just flag
    continue;
  }

  // ─── Check H: Wrong POS ───────────────────────────────────────
  if (!issueType) {
    // Russian function words with wrong POS
    const RU_FUNC_WORDS = {
      'без': 'prep', 'в': 'prep', 'во': 'prep', 'для': 'prep', 'до': 'prep',
      'за': 'prep', 'из': 'prep', 'к': 'prep', 'ко': 'prep', 'на': 'prep',
      'над': 'prep', 'о': 'prep', 'об': 'prep', 'от': 'prep', 'по': 'prep',
      'под': 'prep', 'при': 'prep', 'про': 'prep', 'с': 'prep', 'со': 'prep',
      'у': 'prep', 'через': 'prep',
      'а': 'conj', 'и': 'conj', 'но': 'conj', 'или': 'conj', 'что': 'conj',
      'если': 'conj', 'когда': 'conj', 'потому': 'conj', 'хотя': 'conj',
      'чтобы': 'conj', 'пока': 'conj',
      'я': 'pron', 'ты': 'pron', 'он': 'pron', 'она': 'pron', 'оно': 'pron',
      'мы': 'pron', 'вы': 'pron', 'они': 'pron',
      'мне': 'pron', 'меня': 'pron', 'мной': 'pron',
      'тебе': 'pron', 'тебя': 'pron', 'тобой': 'pron',
      'ему': 'pron', 'его': 'pron', 'им': 'pron', 'них': 'pron',
      'ей': 'pron', 'её': 'pron', 'ей': 'pron',
      'нас': 'pron', 'нам': 'pron', 'нами': 'pron',
      'вам': 'pron', 'вас': 'pron', 'вами': 'pron',
      'себя': 'pron', 'себе': 'pron', 'собой': 'pron',
      'не': 'part', 'ни': 'part', 'бы': 'part', 'же': 'part', 'ли': 'part',
      'вот': 'part', 'ведь': 'part', 'даже': 'part', 'только': 'part',
      'уже': 'adv', 'ещё': 'adv', 'тоже': 'adv', 'тут': 'adv',
      'там': 'adv', 'здесь': 'adv', 'теперь': 'adv', 'потом': 'adv',
      'очень': 'adv', 'всегда': 'adv', 'никогда': 'adv', 'сейчас': 'adv',
      'тогда': 'adv', 'быстро': 'adv', 'медленно': 'adv',
    };

    if (RU_FUNC_WORDS[e.key] && e.pos !== RU_FUNC_WORDS[e.key]) {
      newPos = RU_FUNC_WORDS[e.key];
      issueType = 'wrong-pos';
      note = `should be ${newPos}`;
    }
  }

  if (issueType && (newEn !== e.en || newPos !== e.pos || newLemma !== e.lemma)) {
    allFixes.push({
      key: e.key,
      old: { en: e.en, pos: e.pos, lemma: e.lemma },
      new: { en: newEn, pos: newPos, lemma: newLemma },
      issueType,
      note,
    });
  }
}

// ─── Summary ────────────────────────────────────────────────────────────────
const byType = {};
for (const f of allFixes) {
  byType[f.issueType] = (byType[f.issueType] || 0) + 1;
}
console.log('\n=== FIX SUMMARY ===');
for (const [type, count] of Object.entries(byType).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${type}: ${count}`);
}
console.log(`  TOTAL: ${allFixes.length}`);

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
console.log(`\nDone! ${applied} fixes applied to Russian dictionary.`);
