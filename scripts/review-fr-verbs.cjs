#!/usr/bin/env node
/**
 * COMPLETE French dictionary review script.
 * Checks EVERY SINGLE ENTRY for:
 *   A: "to " on non-verbs -> strip, fix POS
 *   B: Verb form issues (past tense, gerund, 3rd person after "to ") -> lemmatize
 *   C: Missing "to " on verbs -> add
 *   D: Garbage semicolons -> strip bad part
 *   E: Wrong meaning (French knowledge)
 *   F: Ambiguous noun/verb words -> check context
 *
 * Applies all fixes directly to the dictionary file.
 */

const fs = require('fs');
const path = require('path');
const { lemmatize } = require('./english-lemmatizer.cjs');

const DICT_PATH = path.join(__dirname, '..', 'src', 'data', 'dictionary', 'fr.ts');
const OUTPUT_PATH = path.join(__dirname, 'output', 'fr-full-verb-review.json');

const src = fs.readFileSync(DICT_PATH, 'utf8');

// --- Parse all dictionary entries ---
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

// Build French infinitive set and entry map
const infinitives = new Set();
const entryMap = {};
for (const e of entries) {
  entryMap[e.key] = e;
  // A French infinitive: ends in -er/-ir/-re/-oir, pos=v, no lemma (it IS the base form)
  if ((e.key.endsWith('er') || e.key.endsWith('ir') || e.key.endsWith('re') ||
       e.key.endsWith('oir')) && e.pos === 'v' && !e.lemma) {
    infinitives.add(e.key);
  }
}

// Also build a set of ALL known French verb entries (including conjugated forms with lemma)
const allVerbKeys = new Set();
for (const e of entries) {
  if (e.pos === 'v') allVerbKeys.add(e.key);
  // If it has a lemma pointing to a verb, it's also a verb form
  if (e.lemma && entryMap[e.lemma]?.pos === 'v') allVerbKeys.add(e.key);
}

// Detect if a French word is definitely a verb form (has lemma to verb infinitive)
function isDefiniteVerbForm(key) {
  const e = entryMap[key];
  if (!e) return false;
  // Has lemma pointing to a known infinitive
  if (e.lemma && infinitives.has(e.lemma)) return true;
  // IS an infinitive
  if (infinitives.has(key)) return true;
  // Has lemma pointing to another verb
  if (e.lemma && entryMap[e.lemma]?.pos === 'v') return true;
  return false;
}

console.log(`French infinitives: ${infinitives.size}`);
console.log(`All verb keys: ${allVerbKeys.size}`);

// --- KNOWN_ENGLISH_VERBS ---
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
  'nest','hope','comment','avoid','narrow','register','schedule',
  'reason','page','mark','bath','bathe','serve','egg','room','base',
  'receive','enjoy','regret','retire','surf','dwell','stall','form',
  'worry','apply','argue',
  'attend','beg','bless','bloom','bore',
  'burden','carve','claim','clarify',
  'confront','consent',
  'dare','defend',
  'depict','describe',
  'discharge','dominate','drift',
  'drown','elect',
  'force','hope','nest',
  'ventilate','accentuate','accompany','accomplish','hang','rush',
  'accommodate','accumulate','adapt','adopt','adore','address',
  'admit','age','aggravate','aid','alert','alleviate','alternate',
  'amaze','amuse','announce','annoy','anticipate','appeal',
  'applaud','assure','attract','authorize','awaken',
]);

// --- EN_DEFINITE_NOUNS: nouns that should never have "to " ---
// IMPORTANT: Do NOT include words that are also common verbs (welcome, love, approach, etc.)
const EN_DEFINITE_NOUNS = new Set([
  'academy','accent','access','accommodation','addition','administration',
  'advent','adventure','agency','agility','agreement','ambulance','ambition',
  'amount','analysis','angel','anniversary','announcement','apartment','appetite',
  'appreciation','april','architecture','area','arrival','aspect',
  'atmosphere','attention','audience','august','authority','autonomy','autumn',
  'avenue','bag','balcony','ball','band','bank','bar','barrier',
  'basement','basin','basket','battery','beach','beauty','bed','bell',
  'bench','berry','bicycle','bill','biology','birthday','block','blood',
  'board','boat','body','bone','book','bookshop','border','boss','bottle',
  'box','bracelet','brain','bread','briefcase','budget','building',
  'bull','bus','butter','button','cabin','cable','cafe','cake','calendar',
  'camera','camp','campaign','canal','candidate','capacity','capital','captain',
  'card','career','carpet','carriage','cash','castle','category',
  'cathedral','cave','ceiling','celebration','cemetery','center','centre',
  'century','ceremony','certainty','certificate','chain','chair','champion',
  'championship','chapter','character','charity','cheese','cherry',
  'chest','chicken','childhood','chocolate','choice','church','cigarette',
  'cinema','citizen','city','civilization','class','climate','clock',
  'cloud','club','clue','coast','coat','code','coffee','coin',
  'collar','collection','college','colony','column',
  'commitment','committee','communication','community',
  'companion','company','comparison','competition','complaint',
  'composition','computer','concentration','concept','concern','conclusion',
  'condition','conference','confidence','confusion','connection',
  'conscience','consciousness','consequence','conservation','consideration',
  'constitution','construction','consultation','consumer','contact',
  'context','continent','contract','contribution','convention',
  'conversation','cooking','copper','corner','corporation','correspondence',
  'corridor','cotton','council','country','countryside','county',
  'couple','courage','course','court','cousin','cream','creature','crew',
  'crime','crisis','criticism','crop','crowd','crystal','culture','cup',
  'curiosity','curriculum','curtain','customer',
  'danger','darkness','data','date','daughter','dawn','death',
  'debt','decade','decision','declaration','decoration','defense',
  'degree','delivery','democracy','department','departure',
  'depression','description','desert','designer',
  'desk','dessert','destination','destiny','determination','development',
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
  'encouragement','enemy','energy','engine','enjoyment','enterprise',
  'entertainment','enthusiasm','entrepreneur','entry','envelope',
  'environment','episode','equality','equipment','equivalent','era','error',
  'essay','estate','evaluation','evening','event',
  'evidence','evil','evolution','exam','examination','example','exception',
  'excitement','exhibition','existence',
  'expansion','expectation','expedition','expenditure','expense',
  'expert','explanation','exploration','explosion',
  'expression','extension','extent','eye','fabric','facility','fact','factory',
  'faculty','failure','faith','fame','family','fantasy','farm','farmer',
  'fate','father','fault','fear','federation','fee',
  'feeling','fellow','festival','fever','fiction','finger','flag','flame','flesh',
  'flight','flood','floor','flower','folk','food','foot',
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
  'homework','horizon','horror','horse',
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
  'jewelry','job','journal','journalist','joy',
  'judgment','juice','jungle','jury','justice','key','kid','kidney','king',
  'kingdom','kitchen','knee','knife','knight','knowledge','lab','laboratory',
  'labour','lady','lake','lamp','landscape','lane','language',
  'lap','law','lawn','lawyer','layer','leadership','league',
  'leather','leg','legend','legislation','leisure','lemon','length',
  'lesson','letter','liberty','library','lid','lieutenant',
  'lifestyle','lifetime','likelihood',
  'lion','lip','literature','liver','lobby','location',
  'logic','luck','luggage','lunch','lung','luxury','machine',
  'magazine','mail','maintenance','majority','maker','management',
  'manner','mansion','manufacturer','map','marble','margin',
  'marriage','mass','material',
  'meal','meaning','meat','mechanism','media','medicine','medium',
  'melody','member','membership','memory','menu','merchant','mercy',
  'message','metal','method','middle','midnight','mile','milk',
  'mineral','minister','ministry','minority','miracle',
  'mission','mistake','mixture','mobile','moment','monastery','money',
  'monk','monster','month','monument','mood','moon','morning','mosque',
  'motivation','motor','mountain','mouse','mouth','movement',
  'movie','mud','museum','music','musician','mystery',
  'narrative','nation','nationality','nature','navy','necessity',
  'neck','needle','negotiation','neighborhood','nerve','network',
  'news','newspaper','nightmare','noise','nomination','noon','norm','nose',
  'notion','novel','number','nut','nutrition','oak',
  'objective','obligation','observation','observer','obstacle','occasion',
  'occupation','ocean','october','offense','officer','oil','opening',
  'opera','operation','operator','opinion','opponent','opportunity','opposition',
  'option','orange','orchestra','organ','organization','origin',
  'outcome','output','oven','owner','ownership','pain',
  'painting','palace','parliament','participant','participation',
  'partnership','passage','passenger','passion','passport','path',
  'patience','patient','payment','peace','peak','pen',
  'penalty','pension','people','pepper','percentage','perception','performance',
  'period','permission','personality','perspective','phase','phenomenon',
  'philosophy','phone','photo','photograph','photographer','photography',
  'physics','piano','piece','pig','pile','pipe',
  'pizza','plain','plane','planet','planning','plate',
  'platform','player','pleasure','plenty','pocket','poem','poet',
  'poetry','poison','pole','policeman','policy','politician','politics',
  'pollution','pool','pope','population','port','portrait',
  'possession','possibility','pot','potato','potential','poverty',
  'powder','prayer','precedent','preference','pregnancy','prejudice',
  'preparation','presence','presentation','preservation','presidency','president',
  'prevention','priest','prince','princess','principal',
  'principle','priority','prison','prisoner','privacy','problem',
  'procedure','producer','product','production','profession',
  'professional','professor','programme',
  'promotion','propaganda','property','proportion','proposal',
  'prosecution','prospect','protection','protocol','province',
  'provision','psychology','pub','publication','publicity','publisher',
  'punishment','pupil','purpose','pursuit','qualification','quality',
  'quantity','quarter','queen','radiation','radio',
  'rage','rail','railway','ratio','reader',
  'reading','reality','receipt','reception','recipe',
  'recognition','recommendation','reconstruction','recording','recovery',
  'reduction','referee','reflection','refugee',
  'refusal','regime','registration','regulation',
  'rehabilitation','rejection','relationship','relief',
  'religion','reluctance','remainder','repetition',
  'replacement','reply','reporter','representation','representative',
  'republic','reputation','requirement','researcher',
  'reservation','residence','resident','resignation','resistance',
  'resolution','resource','response','responsibility',
  'restaurant','restoration','restriction','retirement','revelation',
  'revenue','revolution','rhythm','rice','riot',
  'river','road','rock','role','roof','root','rose',
  'routine','row','runner','safety','saint','sake',
  'salary','salt','sand','satellite','satisfaction','sauce',
  'scandal','scene','scheme','scholar','scholarship',
  'school','science','scientist','scope','script','sculpture',
  'sea','seat','secretary','section','sector',
  'security','segment','selection','semester','senator',
  'separation','series','servant','session','settlement',
  'sheep','sheet','shelf','shell',
  'shirt','shoe','shore','shortage','shot',
  'side','significance','silk',
  'silver','similarity','simplicity','singer','sir','sister','site','situation',
  'size','skill','sky','slope','soap',
  'society','sock','soil','solution','song','soul',
  'soup','south','speaker','specialist','species','spectacle',
  'spectrum','speech','spirit','spy','square',
  'stability','stadium','staff','staircase','stairs','standard',
  'statement','statistics','statue','status','steel',
  'stomach','stone','story','stranger',
  'strategy','street','strength','string','stroke',
  'student','studio','stuff','style',
  'substance','success','sugar','suggestion','suit','summer','summit','sun',
  'supermarket','supper','supplement','supporter','surgeon',
  'surgery','surplus','survival',
  'suspension','swan','sweat','swimming','sword','symbol',
  'sympathy','syndrome','system','talent','tale','tank','tape',
  'task','taxi','tea','teaching','tear',
  'technique','technology','teenager','telephone','television','temperature',
  'temple','tendency','tennis','tension','tent','territory','terror',
  'terrorism','terrorist','text','thanks','theatre','theme','theory','therapy',
  'thing','thought','threat','threshold','throat','throne','ticket',
  'tiger','tissue','tobacco','toilet','tone','tongue',
  'tooth','topic','tourism','tourist','tournament','town','toy',
  'tradition','traffic','tragedy','training','trait',
  'transition','translation','transmission','transportation',
  'traveller','treatment','treaty','tree','trial',
  'tribe','truck','trunk','truth','tube',
  'twin','uncle','understanding','unemployment',
  'uniform','union','unit','unity','universe','university','valley',
  'van','variety','vegetable','vehicle','venue','victim',
  'victory','village','violation','violence','virtue','virus','vision',
  'visitor','vocabulary','volume','wall',
  'war','ward','warning','warrior','wealth','weapon',
  'web','website','wedding','week','weekend','welfare',
  'west','width','wine',
  'wings','winner','winter','wire','wisdom','witch',
  'woman','wood','wool','worker','workshop','world',
  'writing','yard','youth',
  // French-specific nouns
  'purchase','adequacy','magnitude','anime','workshop','acclamation',
  'cheering','birth','welcoming','greetings','arbitrator',
  'practice','behavior','shelter','bone','lung','liver','kidney','muscle',
  'exercise','sport','medal','trophy','record',
]);

// --- English adjective pattern detector ---
function looksLikeEnglishAdj(word) {
  return /(?:ful|ous|ive|ible|able|ial|ical|ish|less|ary|ory)$/.test(word) &&
    !['panic','picnic','magic','music','public','topic','basic','classic','plastic','fabric','garlic'].includes(word);
}

const KNOWN_ADJECTIVES = new Set([
  'full','empty','dear','wanted','closed','broken','frozen','lost',
  'born','tired','bored','excited','scared','worried','confused','surprised',
  'married','divorced','retired','pregnant','drunk','sober','naked','blind',
  'deaf','calm','gentle','rough','smooth','sharp','dull','bright','clear','dark',
  'light','heavy','thick','thin','wide','narrow','deep','shallow','flat',
  'round','straight','tight','loose','firm','soft','hard','wet','dry',
  'hot','cold','warm','cool','fresh','stale','raw','ripe','sweet','sour',
  'bitter','salty','spicy','bland','ugly','pretty',
  'beautiful','handsome','cute','lovely','gorgeous','plain','fancy',
  'elegant','cheap','expensive','free','busy','lazy','active',
  'slow','quick','fast','rapid','sudden','gradual','steady',
  'stable','safe','dangerous','rich','poor','wealthy','humble','proud',
  'modest','shy','bold','brave','afraid','anxious','nervous','confident',
  'certain','sure','obvious','subtle','visible','hidden','secret',
  'public','private','personal','social','local','foreign','domestic',
  'urban','rural','ancient','modern','new','old','young','elderly',
  'hung','hooked','tanned','crowded','registered','creative',
  'grateful','appropriate','tidy','able','tall','nice','early','better',
  'late','right','available','current','entire',
  'complete','whole','necessary','essential','critical','relative',
  'complex','simple','original','independent','individual','traditional',
  'kind','limited','approved','certified','qualified','experienced',
  'advanced','improved','increased','reduced','established','determined',
  'dedicated','interested','amazed','delighted','disappointed',
  'embarrassed','fascinated','frustrated','horrified','impressed',
  'inspired','motivated','overwhelmed','puzzled','relaxed','relieved',
  'satisfied','shocked','stunned','terrified','thrilled','touched',
  'acquired','sufficient','adequate','adopted','added','affected',
  'announced','watered','assured','appeared','approved',
]);

// --- Bad verb forms after "to " ---
function isBadVerbForm(word) {
  const irregular = ['went','feeds','eats','makes','gets','reads','stays',
    'comes','goes','takes','gives','puts','runs','says','sees','sits',
    'lets','sets','does','has','was','were','had','did','woken','stood',
    'slept','spoke','wrote','drove','knew','grew','drew','fell','felt',
    'found','gave','got','held','kept','left','lost','made','meant',
    'met','paid','ran','rang','rose','sat','saw','sent','shook',
    'shot','shut','sold','spent','struck','swam','swore','swept','swung',
    'taught','tore','threw','told','took','understood','woke','won','wore',
    'laughed','wanted','started','lived','moved','talked','walked','worked',
    'played','asked','called','tried','looked','needed','turned','learned',
    'stopped','changed','watched','happened','opened','reached','listened',
    'loved','appeared','tanned','crowded','accepted','approved','appreciated',
    'announced','forbidden','seen','known','chosen','gotten','spoken','written','broken',
    'driven','eaten','fallen','given','gone','hidden','risen','shaken',
    'stolen','sworn','taken','torn','worn','woven','frozen',
    'adopted','added','affected','improved','provided',
    'reminded','favored','hinted','dropped','warned',
    'built','results','ate','falls','left',
    'arrived','followed','dreamed','split','watered','assured',
  ];
  if (irregular.includes(word)) return true;
  // -ing gerund forms (not verbs that inherently end in -ing like bring, ring, sing)
  if (/ing$/.test(word) && word.length > 5 && !['bring','ring','sing','string','spring','swing','sting','cling','fling','sling','wring','thing'].includes(word)) return true;
  // -ed past tense forms (not words that inherently end in -ed)
  if (/ed$/.test(word) && word.length > 4 && !['need','feed','seed','proceed','exceed','succeed','shed','bed'].includes(word)) return true;
  return false;
}

// --- French noun suffixes (excluding verb conjugation patterns!) ---
const FR_NOUN_SUFFIXES_STRICT = ['tion','sion','ment','esse','ance','ence',
  'ture','erie','isme','teur','trice','ette','ade','ude','ure'];

// --- Garbage first-parts in semicolon translations ---
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
  "electric","word","accord","musician",
  "closer","electrician","milk","a surname","another",
  "journalist","situation","contrary","pleasure","nowhere","hero",
  "herself","himself","close","closed","his","her","their","our","my","your",
  "party","street","nice",
  "myself","grateful","better","tidy","appropriate","mind",
  "right","soon","bike","way","any","dark","grandmother",
  "that's","they'll","you'd","can't","sunset","breakfast",
  "one","children","born","able","slow","least","hesitation",
  "dreamed","true","haven't","apparently","normally","hopefully",
  "completely","carefully","quickly","immediately","formerly",
  "unfortunately","moreover","sometimes","probably","recently",
  "finally","especially","eventually","absolutely","directly",
  "we'd","i'd","let's","won't","aren't","isn't","wasn't",
  "weren't","couldn't","wouldn't","shouldn't","mustn't","needn't",
  "whoever","whatever","wherever","whenever","however","meanwhile",
  "nevertheless","furthermore","otherwise","therefore","hence",
  "thus","still","again","almost","enough","quite","rather",
  "too","very","much","more","most","less","just","even",
  "also","already","yet","barely","hardly","seldom","rarely",
  "often","usually","frequently","occasionally",
  "certainly","definitely","surely","truly","simply","merely",
  "literally","basically","essentially","practically","virtually",
  "obviously","clearly","evidently","presumably",
  "honestly","seriously","personally","privately","publicly",
  "generally","typically","normally","originally","primarily",
  "automatically","randomly","fortunately","happily","sadly",
  "anyway","besides","instead","consequently","subsequently","accordingly",
]);

// ============================================================
// MANUAL FIXES MAP (French knowledge-based corrections)
// ============================================================
const FIXES = {};

function fix(key, en, pos, lemma, issueType, note) {
  FIXES[key] = { en, pos, lemma, issueType, note };
}

// --- Wrong POS ---
fix('absence', 'absence', 'n', null, 'wrong-pos', 'noun not adj');
fix('accès', 'access', 'n', null, 'wrong-pos', 'noun not adj');
fix('accord', 'agreement', 'n', null, 'wrong-pos', 'noun not verb');
fix('achat', 'purchase', 'n', null, 'wrong-pos', 'noun not verb');
fix('acclamations', 'cheering, applause', 'n', 'acclamation', 'wrong-pos', 'noun not verb');
fix('acquis', 'acquired', 'adj', null, 'garbage-semicolon', 'strip "true;"');
fix('accroché', 'hung, hooked', 'v', 'accrocher', 'wrong-pos', 'verb form not noun');
fix('accroches', 'hang, hook', 'v', 'accrocher', 'wrong-pos', 'verb form not noun');
fix('accueillant', 'welcoming', 'adj', null, 'wrong-pos', 'adj not verb');
fix('accueillants', 'welcoming', 'adj', 'accueillant', 'wrong-pos', 'adj not verb');
fix('accentuera', 'will accentuate', 'v', 'accentuer', 'wrong-meaning', 'fix translation');
fix('atelier', 'workshop', 'n', null, 'wrong-pos', 'noun not verb');
fix('ampleur', 'magnitude, scale', 'n', null, 'wrong-pos', 'noun not verb');
fix('attentivement', 'carefully', 'adv', null, 'wrong-pos', 'adverb');
fix('arrivée', 'arrival', 'n', null, 'wrong-pos', 'noun not verb');
fix('amoureux', 'in love, loving', 'adj', null, 'wrong-pos', 'adj not verb');

// adorXX family
fix('adorait', 'to adore, to worship', 'v', 'adorer', 'garbage-semicolon', 'strip "you\'re;"');
fix('adoré', 'to adore, to worship', 'v', 'adorer', 'garbage-semicolon', 'strip "you\'re;"');
fix('adorent', 'to adore, to worship', 'v', 'adorer', 'garbage-semicolon', 'strip "you\'re;"');
fix('adorer', 'to adore, to worship', 'v', undefined, 'garbage-semicolon', 'strip "you\'re;"');
fix('adorerais', 'to adore, to worship', 'v', 'adorer', 'garbage-semicolon', 'strip "you\'re;"');
fix('adorions', 'to adore, to worship', 'v', 'adorer', 'garbage-semicolon', 'strip "you\'re;"');

fix('admires', 'to admire', 'v', 'admirer', 'garbage-semicolon', 'strip "musician;"');
fix('adéquation', 'adequacy', 'n', null, 'wrong-pos', 'noun not verb');
fix('aboutisse', 'to result', 'v', 'aboutir', 'garbage-semicolon', 'strip "it\'s;"');
fix('adresse', 'address', 'n', null, 'garbage-semicolon', 'strip "please;"');
fix('adresser', 'to address', 'v', undefined, 'garbage-semicolon', 'strip "liberty;"');
fix('aérer', 'to ventilate', 'v', undefined, 'garbage-semicolon', 'strip "to opened;"');
fix('affaire', 'affair, matter', 'n', null, 'garbage-semicolon', 'strip "let\'s;"');
fix('affaires', 'business, things', 'n', null, 'garbage-semicolon', 'keep both');
fix('accueillons', 'to welcome', 'v', 'accueillir', 'verb-base-form', 'strip let\'s');
fix('abord', 'first, at first', 'n', null, 'garbage-semicolon', 'strip "first;"');
fix('addition', 'bill, addition', 'n', null, 'garbage-semicolon', 'semicolon to comma');
fix('ans', 'years', 'n', 'an', 'garbage-semicolon', 'strip "to wearing;"');
fix('animes', 'anime, cartoons', 'n', null, 'garbage-semicolon', 'strip "to watched;"');
fix('aperçût', 'noticed', 'v', 'apercevoir', 'garbage-semicolon', 'strip "to noticing;"');
fix('courir', 'to run', 'v', undefined, 'garbage-semicolon', 'strip "slow;"');
fix('inquiéter', 'to worry', 'v', undefined, 'garbage-semicolon', 'strip "reason;"');
fix('sauter', 'to jump', 'v', undefined, 'garbage-semicolon', 'strip "step;"');

// --- Bad lemmatization fixes ---
fix('effondra', 'to collapse', 'v', "s'effondrer", 'verb-base-form', '"to collapsed" bad lemma');
fix('inondées', 'flooded', 'adj', 'inonder', 'verb-base-form', '"to flooded" -> adj');
fix('réchauffé', 'reheated', 'adj', 'réchauffer', 'verb-base-form', '"to reheated" -> adj');
fix('secourues', 'rescued', 'adj', 'secourir', 'verb-base-form', '"to rescued" -> adj');
fix('polluée', 'polluted', 'adj', 'polluer', 'verb-base-form', '"to polluted" -> adj');
fix('protégée', 'protected', 'adj', 'protéger', 'verb-base-form', '"to protected" -> adj');
fix('bloquee', 'blocked', 'adj', 'bloquer', 'verb-base-form', '"to blocked" -> adj');
fix('bloquée', 'blocked', 'adj', 'bloquer', 'verb-base-form', '"to blocked" -> adj');
fix('élu', 'elected', 'adj', 'élire', 'verb-base-form', '"to elected" -> adj');
fix('ému', 'moved, touched', 'adj', 'émouvoir', 'verb-base-form', '"to moved" -> adj');
fix('inclus', 'included', 'adj', 'inclure', 'verb-base-form', '"to included" -> adj');
fix('distrait', 'distracted', 'adj', null, 'verb-base-form', '"to distracted" -> adj');
fix('interdit', 'forbidden', 'adj', 'interdire', 'verb-base-form', '"to forbidden" -> adj');
fix('adopté', 'adopted', 'adj', 'adopter', 'verb-base-form', '"to adopted" -> adj');
fix('ajouté', 'added', 'adj', 'ajouter', 'verb-base-form', '"to added" -> adj');
fix('amélioré', 'improved', 'adj', 'améliorer', 'verb-base-form', '"to improved" -> adj');
fix('annoncée', 'announced', 'adj', 'annoncer', 'verb-base-form', '"to announced" -> adj');
fix('affectés', 'affected', 'adj', 'affecter', 'verb-base-form', '"to affected" -> adj');
fix('apparu', 'appeared', 'adj', 'apparaître', 'verb-base-form', '"to appeared" -> adj');
fix('apparue', 'appeared', 'adj', 'apparaître', 'verb-base-form', '"to appeared" -> adj');
fix('arrosé', 'watered', 'adj', 'arroser', 'verb-base-form', '"to watered" -> adj');
fix('assuré', 'assured, insured', 'adj', 'assurer', 'verb-base-form', '"to assured" -> adj');
fix('approuvé', 'approved', 'adj', 'approuver', 'verb-base-form', '"to approved" -> adj');
fix('bronzée', 'tanned', 'adj', 'bronzer', 'verb-base-form', '"to tanned" -> adj');

// --- French elision forms with bad "to was/am/are" translations ---
fix('jallais', 'to go (I was going)', 'v', 'aller', 'verb-base-form', '"to was going" bad');
fix('javais', 'to have (I had)', 'v', 'avoir', 'verb-base-form', '"to had" bad');
fix('jécris', 'to write (I write)', 'v', 'écrire', 'verb-base-form', '"to am writing" bad');
fix('jétudié', 'to study (I studied)', 'v', 'étudier', 'verb-base-form', '"to studied" bad');
fix('jhabitais', 'to live (I lived)', 'v', 'habiter', 'verb-base-form', '"to lived" bad');
fix('mattendais', 'to expect (I was expecting)', 'v', 'attendre', 'verb-base-form', '"to was expecting" bad');
fix('mavais', 'to have (I had)', 'v', 'avoir', 'verb-base-form', '"to had" bad');
fix('mavait', 'to have (had me)', 'v', 'avoir', 'verb-base-form', '"to had" bad');
fix('mécoutais', 'to listen (I was listening)', 'v', 'écouter', 'verb-base-form', '"to was listening" bad');
fix('navais', 'to have (I had not)', 'v', 'avoir', 'verb-base-form', '"to had" bad');
fix('navions', 'to have (we had not)', 'v', 'avoir', 'verb-base-form', '"to had" bad');
fix('nétaient', 'to be (they were not)', 'v', 'être', 'verb-base-form', '"to were" bad');
fix('sétait', 'to be (had been)', 'v', 'être', 'verb-base-form', '"to had" bad');
fix('tintéresse', 'to interest (interests you)', 'v', 'intéresser', 'verb-base-form', '"to are you interested" bad');
fix('avaitil', 'to have (did he have)', 'v', 'avoir', 'verb-base-form', '"to had" bad');

// --- More wrong POS ---
fix('changement', 'change', 'n', null, 'to-prefix-on-non-verb', 'noun not verb');
fix('consignes', 'instructions', 'n', null, 'to-prefix-on-non-verb', 'noun not verb');
fix('dexpérience', 'experience', 'n', null, 'to-prefix-on-non-verb', 'noun not verb');
fix('étude', 'study', 'n', null, 'to-prefix-on-non-verb', 'noun not verb');
fix('expérience', 'experience', 'n', null, 'to-prefix-on-non-verb', 'noun not verb');
fix('graves', 'serious', 'adj', null, 'to-prefix-on-non-verb', 'adj not verb');

// ferme/fermé family
fix('ferme', 'farm, firm', 'n', null, 'garbage-semicolon', '"close; farm" -> farm');
fix('fermé', 'closed', 'adj', 'fermer', 'garbage-semicolon', '"closed; farm" -> closed');
fix('fermée', 'closed', 'adj', 'fermer', 'garbage-semicolon', '"closed; farm" -> closed');
fix('nulle', 'none, no', 'adj', null, 'garbage-semicolon', '"nowhere; none" -> none');
fix('pédaler', 'to pedal', 'v', undefined, 'garbage-semicolon', '"nowhere; pedal" -> pedal');
fix('remarqué', 'noticed, remarked', 'adj', 'remarquer', 'garbage-semicolon', '"herself; remark" -> noticed');
fix('afin', 'in order to', 'conj', null, 'garbage-semicolon', '"him; in order to" -> in order to');
fix('ailleurs', 'elsewhere', 'adv', null, 'garbage-semicolon', '"nowhere; elsewhere" -> elsewhere');
fix('brandit', 'brandished', 'v', 'brandir', 'garbage-semicolon', '"hero; brandit" garbage');
fix('chargea', 'to charge, to load', 'v', 'charger', 'garbage-semicolon', '"hero; chargea" garbage');
fix('désire', 'to desire', 'v', 'désirer', 'garbage-semicolon', '"situation; desire" garbage');
fix('agréable', 'pleasant', 'adj', null, 'garbage-semicolon', '"pleasure; pleasant" -> pleasant');


// ============================================================
// MAIN REVIEW LOOP
// ============================================================
const allFixes = [];
const issueCounts = {};
function countIssue(type) {
  issueCounts[type] = (issueCounts[type] || 0) + 1;
}

for (const entry of entries) {
  const { key, pos, lemma } = entry;
  let { en } = entry;

  // === MANUAL FIX (highest priority) ===
  if (FIXES[key]) {
    const f = FIXES[key];
    const oldEn = en;
    const oldPos = pos;
    const oldLemma = lemma;
    const newEn = f.en;
    const newPos = f.pos;
    const newLemma = f.lemma;

    if (newEn !== oldEn || newPos !== oldPos || (newLemma !== undefined && newLemma !== oldLemma)) {
      allFixes.push({
        key, issueType: f.issueType,
        note: f.note,
        old: { en: oldEn, pos: oldPos, lemma: oldLemma },
        new: { en: newEn, pos: newPos, lemma: newLemma }
      });
      countIssue(f.issueType);
    }
    continue;
  }

  // *** SKIP verb forms that have a lemma pointing to a verb ***
  // These are valid conjugated forms and should NOT be modified
  const isVerbForm = isDefiniteVerbForm(key);

  // === PATTERN 1: Garbage semicolons (Check D) ===
  if (en.includes(';')) {
    const parts = en.split(';').map(p => p.trim());
    const first = parts[0].toLowerCase();
    const rest = parts.slice(1).join('; ').trim();

    // Check if first part is garbage
    if (rest && (
      GARBAGE_FIRST_PARTS.has(first) ||
      /^(he|she|it|we|they|you|i)\s/.test(first) ||
      /^(he's|she's|it's|i'm|we're|they're|you're|that's|they'll|you'd|can't|don't|didn't|won't|haven't|hasn't|hadn't|isn't|aren't|wasn't|weren't)$/.test(first) ||
      /^(he'd|she'd|we'd|i'd|let's)$/.test(first)
    )) {
      // Determine the correct POS from the second part
      let newPos = pos;
      const secondFirst = rest.split(/[,;]/)[0].trim().toLowerCase();

      // If it's a known verb form, keep pos=v and ensure "to " prefix
      if (isVerbForm) {
        newPos = 'v';
        let newEn = rest;
        if (!rest.startsWith('to ') && KNOWN_ENGLISH_VERBS.has(secondFirst)) {
          newEn = 'to ' + rest;
        }
        allFixes.push({
          key, issueType: 'garbage-semicolon',
          note: `"${parts[0]}" is context bleed`,
          old: { en, pos }, new: { en: newEn, pos: newPos }
        });
      } else {
        if (rest.startsWith('to ') && KNOWN_ENGLISH_VERBS.has(rest.slice(3).split(/[,;]/)[0].trim().toLowerCase())) {
          newPos = 'v';
        } else if (EN_DEFINITE_NOUNS.has(secondFirst)) {
          newPos = 'n';
        } else if (KNOWN_ADJECTIVES.has(secondFirst) || looksLikeEnglishAdj(secondFirst)) {
          newPos = 'adj';
        }
        allFixes.push({
          key, issueType: 'garbage-semicolon',
          note: `"${parts[0]}" is context bleed`,
          old: { en, pos }, new: { en: rest, pos: newPos }
        });
      }
      countIssue('garbage-semicolon');
      continue;
    }

    // Check if SECOND part is garbage
    const secondLower = rest.toLowerCase();
    if (rest && (
      GARBAGE_FIRST_PARTS.has(secondLower) ||
      /^(he|she|it|we|they|you|i)\s/.test(secondLower) ||
      /^(he's|she's|it's|i'm|we're|they're|you're)$/.test(secondLower)
    )) {
      allFixes.push({
        key, issueType: 'garbage-semicolon',
        note: `"${rest}" is context bleed (second part)`,
        old: { en, pos }, new: { en: parts[0], pos }
      });
      countIssue('garbage-semicolon');
      continue;
    }

    // Check if first part starts with "to " + bad verb form
    if (first.startsWith('to ')) {
      const afterTo = first.slice(3).trim();
      if (isBadVerbForm(afterTo) && rest) {
        // Use the second part instead
        let newPos = pos;
        const secondFirst = rest.split(/[,;]/)[0].trim().toLowerCase();
        if (isVerbForm) {
          newPos = 'v';
          let newEn = rest;
          if (!rest.startsWith('to ') && KNOWN_ENGLISH_VERBS.has(secondFirst)) {
            newEn = 'to ' + rest;
          }
          allFixes.push({
            key, issueType: 'garbage-semicolon',
            note: `"${parts[0]}" has bad verb form`,
            old: { en, pos }, new: { en: newEn, pos: newPos }
          });
        } else {
          if (EN_DEFINITE_NOUNS.has(secondFirst)) newPos = 'n';
          else if (KNOWN_ADJECTIVES.has(secondFirst) || looksLikeEnglishAdj(secondFirst)) newPos = 'adj';
          allFixes.push({
            key, issueType: 'garbage-semicolon',
            note: `"${parts[0]}" has bad verb form`,
            old: { en, pos }, new: { en: rest, pos: newPos }
          });
        }
        countIssue('garbage-semicolon');
        continue;
      }
    }

    // Semicolons that aren't garbage but should be commas (for consistency)
    if (!en.includes(',')) {
      const newEn = parts.join(', ');
      if (newEn !== en) {
        allFixes.push({
          key, issueType: 'semicolon-to-comma',
          note: 'replace semicolons with commas',
          old: { en, pos }, new: { en: newEn, pos }
        });
        countIssue('semicolon-to-comma');
        continue;
      }
    }
  }

  // Skip further checks for definite verb forms - they're fine with "to "
  if (isVerbForm) continue;

  // === PATTERN 2: "to " prefix on non-verbs (Check A) ===
  if (en.startsWith('to ')) {
    const afterTo = en.slice(3).trim();
    const firstWord = afterTo.split(/[,;]/)[0].trim().toLowerCase();

    // Don't strip "to " from words that ARE verb infinitives
    if (infinitives.has(key)) continue;

    // "to " + definite noun (only if the English word is NOT also a known verb)
    if (EN_DEFINITE_NOUNS.has(firstWord) && !KNOWN_ENGLISH_VERBS.has(firstWord)) {
      allFixes.push({
        key, issueType: 'to-prefix-on-non-verb',
        note: `"to ${firstWord}" - noun shouldn't have "to "`,
        old: { en, pos }, new: { en: afterTo, pos: 'n' }
      });
      countIssue('to-prefix-on-non-verb');
      continue;
    }

    // "to " + known adjective (and NOT a known verb)
    if ((KNOWN_ADJECTIVES.has(firstWord) || looksLikeEnglishAdj(firstWord)) && !KNOWN_ENGLISH_VERBS.has(firstWord)) {
      allFixes.push({
        key, issueType: 'to-prefix-on-non-verb',
        note: `"to ${firstWord}" - adjective shouldn't have "to "`,
        old: { en, pos }, new: { en: afterTo, pos: 'adj' }
      });
      countIssue('to-prefix-on-non-verb');
      continue;
    }

    // "to " + auxiliary verb pattern ("to was X", "to am X", "to are X", "to had X")
    if (/^(was|am|are|were|had|has|did|is)\b/.test(firstWord)) {
      // These are all badly formed: strip and make adj
      allFixes.push({
        key, issueType: 'verb-base-form',
        note: `"to ${firstWord}..." has auxiliary verb after "to "`,
        old: { en, pos }, new: { en: afterTo, pos: 'adj' }
      });
      countIssue('verb-base-form');
      continue;
    }

    // "to let's X" pattern
    if (afterTo.startsWith("let's ")) {
      const realVerb = afterTo.slice(6).trim();
      allFixes.push({
        key, issueType: 'verb-base-form',
        note: `"to let's ${realVerb}" -> "to ${realVerb}"`,
        old: { en, pos }, new: { en: 'to ' + realVerb, pos: 'v' }
      });
      countIssue('verb-base-form');
      continue;
    }

    // "to " + bad verb form (Check B) - only for NON-verb-forms
    if (isBadVerbForm(firstWord)) {
      const base = lemmatize(firstWord, 'v');
      // Only fix if lemmatization produces a valid-looking result
      if (base !== firstWord && base.length >= 2 && !base.endsWith('e') || ['have','be','come','give','make','take','live','love','move','use','close','lose','chose'].includes(base)) {
        allFixes.push({
          key, issueType: 'verb-base-form',
          note: `"to ${firstWord}" -> "to ${base}"`,
          old: { en, pos }, new: { en: 'to ' + base, pos: 'v' }
        });
      } else {
        // Can't lemmatize properly: treat as adjective (past participle)
        allFixes.push({
          key, issueType: 'verb-base-form',
          note: `"to ${firstWord}" has wrong form -> adjective`,
          old: { en, pos }, new: { en: afterTo, pos: 'adj' }
        });
      }
      countIssue('verb-base-form');
      continue;
    }

    // French word with strict noun suffix tagged as verb with "to " but NOT a verb
    if (pos === 'v' && FR_NOUN_SUFFIXES_STRICT.some(s => key.endsWith(s)) &&
        !key.endsWith('er') && !key.endsWith('ir') && !key.endsWith('re') && !key.endsWith('oir')) {
      allFixes.push({
        key, issueType: 'to-prefix-on-non-verb',
        note: `"${key}" has noun suffix, not a verb`,
        old: { en, pos }, new: { en: afterTo, pos: 'n' }
      });
      countIssue('to-prefix-on-non-verb');
      continue;
    }

    // French -ment adverbs tagged as verb
    if (pos === 'v' && key.endsWith('ment') && key.length > 6) {
      allFixes.push({
        key, issueType: 'to-prefix-on-non-verb',
        note: `"${key}" is an adverb (-ment), not a verb`,
        old: { en, pos }, new: { en: afterTo, pos: 'adv' }
      });
      countIssue('to-prefix-on-non-verb');
      continue;
    }
  }

  // === PATTERN 3: Missing "to " on verbs (Check C) ===
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

  // === PATTERN 4: French noun wrongly tagged as adj ===
  if (pos === 'adj' && !en.startsWith('to ')) {
    const firstWord = en.split(/[,;]/)[0].trim().toLowerCase();
    if (EN_DEFINITE_NOUNS.has(firstWord) && !KNOWN_ADJECTIVES.has(firstWord) && !looksLikeEnglishAdj(firstWord)) {
      allFixes.push({
        key, issueType: 'wrong-pos',
        note: `"${key}" is a noun, not adj (en="${firstWord}")`,
        old: { en, pos }, new: { en, pos: 'n' }
      });
      countIssue('wrong-pos');
      continue;
    }
  }

  // === PATTERN 5: Verb forms wrongly tagged as noun (lemma points to verb) ===
  if (pos === 'n' && lemma && entryMap[lemma] && entryMap[lemma].pos === 'v') {
    let newEn = en;
    if (!en.startsWith('to ')) {
      const firstWord = en.split(/[,;]/)[0].trim().toLowerCase();
      if (KNOWN_ENGLISH_VERBS.has(firstWord) || KNOWN_ENGLISH_VERBS.has(lemmatize(firstWord, 'v'))) {
        newEn = 'to ' + en;
      }
    }
    allFixes.push({
      key, issueType: 'wrong-pos',
      note: `"${key}" is verb form of "${lemma}", not noun`,
      old: { en, pos, lemma }, new: { en: newEn, pos: 'v', lemma }
    });
    countIssue('wrong-pos');
    continue;
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

const fixByKey = {};
for (const f of allFixes) {
  fixByKey[f.key] = f;
}

const dictSrc = fs.readFileSync(DICT_PATH, 'utf8');
const lines = dictSrc.split('\n');
let applied = 0;
let failed = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const keyMatch = line.match(/^\s*['"]([^'"]+)['"]\s*:\s*\{/);
  if (!keyMatch) continue;

  const key = keyMatch[1];
  const f = fixByKey[key];
  if (!f) continue;

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

  // Replace en value
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
    const escapedLemma = newLemma.replace(/'/g, "\\'");
    if (newBody.includes('lemma:')) {
      newBody = newBody.replace(/lemma:\s*'(?:[^'\\]|\\.)*'/, `lemma: '${escapedLemma}'`);
    } else {
      newBody = newBody.replace(/(pos:\s*'(?:[^'\\]|\\.)*')/, `$1, lemma: '${escapedLemma}'`);
    }
  }

  if (newBody !== body) {
    lines[i] = prefix + newBody + suffix;
    applied++;
  }
}

fs.writeFileSync(DICT_PATH, lines.join('\n'));
console.log(`Applied: ${applied}, Failed: ${failed}`);
console.log(`\nDone! ${applied} fixes applied to French dictionary.`);
