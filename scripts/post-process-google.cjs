#!/usr/bin/env node
/**
 * Post-processing pipeline for Google Translate output.
 *
 * 16 rules applied in sequence:
 *  1. HTML entity decoding
 *  2. Truncated output detection
 *  3. Romanization detection
 *  4. Lowercase first letter
 *  5. Strip leading articles
 *  6. Strip leading pronouns
 *  7. Strip negation (don't/doesn't/didn't)
 *  8. Lemmatize verbs (+ prepend "to ")
 *  9. Lemmatize nouns (singularize)
 * 10. Fragment trim (>3 words → keep first 2 content words)
 * 11. Wrong POS detection
 * 12. Function word as definition
 * 13. Duplicate detection
 * 14. Length sanity (cap 50 chars)
 * 15. Source language chars in output
 * 16. Very long relative to source
 *
 * Usage:
 *   const { postProcess, PostProcessStats } = require('./post-process-google.cjs');
 *   const result = postProcess(rawTranslation, pos, sourceWord, stats);
 */

const { lemmatize } = require('./english-lemmatizer.cjs');

// ─── HTML entity map ────────────────────────────────────────────────────────

const HTML_ENTITIES = {
  '&#39;': "'", '&amp;': '&', '&quot;': '"', '&lt;': '<', '&gt;': '>',
  '&#x27;': "'", '&apos;': "'", '&nbsp;': ' ', '&#34;': '"',
  '&#38;': '&', '&#60;': '<', '&#62;': '>', '&#160;': ' ',
  '&ldquo;': '\u201C', '&rdquo;': '\u201D', '&lsquo;': '\u2018',
  '&rsquo;': '\u2019', '&mdash;': '\u2014', '&ndash;': '\u2013',
  '&hellip;': '\u2026', '&copy;': '\u00A9', '&reg;': '\u00AE',
  '&trade;': '\u2122', '&deg;': '\u00B0', '&plusmn;': '\u00B1',
  '&times;': '\u00D7', '&divide;': '\u00F7', '&micro;': '\u00B5',
  '&cent;': '\u00A2', '&pound;': '\u00A3', '&euro;': '\u20AC',
  '&yen;': '\u00A5',
};

// ─── Known function words ───────────────────────────────────────────────────

const FUNCTION_WORDS = new Set([
  'the', 'a', 'an', 'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being',
  'of', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'from', 'up', 'about',
  'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between',
  'under', 'over', 'and', 'but', 'or', 'nor', 'so', 'yet', 'if', 'than',
  'that', 'this', 'these', 'those', 'it', 'its', 'do', 'does', 'did',
  'has', 'had', 'have', 'will', 'would', 'shall', 'should', 'may', 'might',
  'can', 'could', 'must', 'not', 'no', 'as', 'very', 'much', 'more', 'most',
  'just', 'also', 'too', 'quite', 'rather', 'really', 'still', 'even',
  'only', 'well', 'then', 'now', 'here', 'there', 'when', 'where', 'how',
  'all', 'each', 'every', 'both', 'few', 'many', 'some', 'any', 'such',
]);

// Known common nouns (for wrong-POS detection)
const KNOWN_NOUNS = new Set([
  'house', 'car', 'dog', 'cat', 'book', 'tree', 'water', 'food', 'man',
  'woman', 'child', 'day', 'night', 'time', 'year', 'people', 'way',
  'thing', 'place', 'hand', 'head', 'eye', 'face', 'room', 'door',
  'table', 'chair', 'bed', 'floor', 'wall', 'window', 'road', 'street',
  'city', 'town', 'world', 'country', 'school', 'family', 'mother',
  'father', 'brother', 'sister', 'friend', 'money', 'work', 'life',
  'name', 'word', 'number', 'part', 'group', 'problem', 'fact',
  'morning', 'evening', 'garden', 'kitchen', 'market', 'office',
  'village', 'river', 'mountain', 'forest', 'island', 'bridge',
  'temple', 'church', 'mosque', 'hospital', 'station', 'field',
  'flower', 'fruit', 'milk', 'bread', 'rice', 'tea', 'coffee',
  'sugar', 'salt', 'oil', 'butter', 'egg', 'meat', 'fish',
  'clothes', 'shirt', 'dress', 'shoe', 'hat', 'bag', 'box',
  'glass', 'cup', 'plate', 'knife', 'spoon', 'key', 'phone',
  'letter', 'paper', 'picture', 'music', 'song', 'story', 'game',
  'light', 'fire', 'earth', 'air', 'rain', 'snow', 'wind', 'sun',
  'moon', 'star', 'cloud', 'stone', 'gold', 'silver', 'iron',
  'king', 'queen', 'god', 'heart', 'blood', 'bone', 'skin',
  'hair', 'tooth', 'foot', 'arm', 'leg', 'finger', 'nose', 'ear',
  'mouth', 'shoulder', 'neck', 'back', 'stomach', 'chest',
  // Expanded set — nouns often mistaken as verbs
  'fly', 'finance', 'iron', 'steel', 'buddy', 'designer', 'coach', 'jersey', 'embargo', 'wifi',
  'building', 'reward', 'engineer', 'teacher', 'doctor', 'lawyer',
  'nurse', 'driver', 'singer', 'dancer', 'writer', 'player', 'leader',
  'worker', 'farmer', 'painter', 'soldier', 'officer', 'manager',
  'director', 'professor', 'musician', 'artist', 'architect', 'pilot',
  'actor', 'student', 'trainer', 'baker', 'butcher', 'carpenter',
  'dentist', 'plumber', 'mechanic', 'tailor', 'barber', 'sailor',
  'photographer', 'journalist', 'scientist', 'programmer', 'accountant',
  'neighbor', 'stranger', 'passenger', 'customer', 'visitor', 'guest',
  'partner', 'husband', 'wife', 'parent', 'daughter', 'son', 'baby',
  'uncle', 'aunt', 'cousin', 'grandfather', 'grandmother', 'nephew',
  'niece', 'boyfriend', 'girlfriend', 'boss', 'colleague', 'employee',
  'owner', 'citizen', 'resident', 'immigrant', 'refugee', 'volunteer',
  'hero', 'victim', 'witness', 'suspect', 'patient', 'prisoner',
  'ceiling', 'fence', 'roof', 'stair', 'stairs', 'basement', 'balcony',
  'corridor', 'hallway', 'apartment', 'bedroom', 'bathroom', 'garage',
  'factory', 'warehouse', 'restaurant', 'cinema', 'museum', 'library',
  'stadium', 'theater', 'palace', 'castle', 'tower', 'monument',
  'airport', 'harbor', 'highway', 'tunnel', 'track', 'path', 'trail',
  'beach', 'valley', 'hill', 'cliff', 'desert', 'jungle', 'swamp',
  'lake', 'ocean', 'sea', 'coast', 'shore', 'bay', 'cave', 'volcano',
  'sunset', 'sunrise', 'storm', 'thunder', 'lightning', 'frost', 'ice',
  'dust', 'mud', 'sand', 'soil', 'wood', 'metal', 'glass', 'rubber',
  'plastic', 'leather', 'cotton', 'silk', 'wool', 'fabric', 'steel',
  'copper', 'aluminum', 'cement', 'concrete', 'brick', 'marble',
  'diamond', 'crystal', 'pearl', 'ivory', 'coral', 'amber',
  'computer', 'laptop', 'screen', 'keyboard', 'mouse', 'printer',
  'camera', 'television', 'radio', 'speaker', 'microphone', 'battery',
  'engine', 'machine', 'device', 'robot', 'satellite', 'rocket',
  'bicycle', 'motorcycle', 'helicopter', 'submarine', 'vehicle',
  'wheel', 'mirror', 'clock', 'lamp', 'candle', 'blanket', 'pillow',
  'carpet', 'curtain', 'towel', 'basket', 'bucket', 'bottle', 'jar',
  'pot', 'pan', 'oven', 'fridge', 'microwave', 'blender', 'toaster',
  'breakfast', 'lunch', 'dinner', 'snack', 'dessert', 'soup', 'salad',
  'sauce', 'cheese', 'chocolate', 'candy', 'cake', 'cookie', 'pie',
  'juice', 'wine', 'beer', 'soda', 'cocktail', 'whiskey', 'vodka',
  'shirt', 'jacket', 'coat', 'sweater', 'vest', 'tie', 'scarf',
  'glove', 'belt', 'pocket', 'collar', 'sleeve', 'button', 'zipper',
  'boot', 'sandal', 'slipper', 'sock', 'uniform', 'costume', 'mask',
  'wallet', 'purse', 'suitcase', 'backpack', 'umbrella', 'cane',
  'adventure', 'journey', 'trip', 'vacation', 'holiday', 'festival',
  'ceremony', 'wedding', 'funeral', 'birthday', 'anniversary', 'party',
  'concert', 'performance', 'competition', 'race', 'championship',
  'victory', 'defeat', 'score', 'prize', 'medal', 'trophy', 'gift',
  'surprise', 'secret', 'mystery', 'puzzle', 'joke', 'trick', 'magic',
  'recipe', 'ingredient', 'flavor', 'aroma', 'texture', 'temperature',
  'weight', 'height', 'length', 'width', 'depth', 'speed', 'distance',
  'size', 'shape', 'color', 'pattern', 'style', 'fashion', 'trend',
  'symbol', 'signal', 'sign', 'label', 'brand', 'logo', 'title',
  'headline', 'article', 'paragraph', 'sentence', 'phrase', 'quote',
  'poem', 'novel', 'chapter', 'page', 'cover', 'version', 'edition',
  'copy', 'draft', 'outline', 'summary', 'review', 'report', 'survey',
  'budget', 'profit', 'loss', 'tax', 'debt', 'loan', 'wage', 'salary',
  'income', 'expense', 'investment', 'insurance', 'pension', 'receipt',
  'invoice', 'contract', 'agreement', 'guarantee', 'warranty', 'permit',
  'license', 'passport', 'visa', 'ticket', 'coupon', 'voucher',
  'reason', 'schedule', 'page', 'room', 'bathroom', 'server', 'egg',
  'basis', 'foundation', 'structure', 'frame', 'border', 'limit',
  'surface', 'bottom', 'top', 'side', 'corner', 'edge', 'center',
  'middle', 'end', 'front', 'entrance', 'exit', 'passage', 'gap',
  'hole', 'space', 'area', 'zone', 'region', 'district', 'quarter',
  'neighborhood', 'suburb', 'countryside', 'landscape', 'scenery',
  'horizon', 'atmosphere', 'climate', 'environment', 'nature',
  'universe', 'galaxy', 'planet', 'continent', 'surface', 'bottom',
  'floor', 'brand', 'mark', 'service', 'position', 'gift', 'present',
  'window', 'nail', 'price', 'cost', 'weight', 'stall', 'tomato',
  'vegetable', 'onion', 'garlic', 'pepper', 'potato', 'carrot',
  'lettuce', 'spinach', 'mushroom', 'corn', 'bean', 'pea', 'grape',
  'orange', 'lemon', 'lime', 'peach', 'cherry', 'strawberry',
  'blueberry', 'raspberry', 'pineapple', 'mango', 'coconut',
  'watermelon', 'avocado', 'cucumber', 'pumpkin', 'zucchini',
  'attachment', 'document', 'folder', 'file', 'message', 'email',
  'comment', 'post', 'link', 'website', 'application', 'program',
  'balance', 'shift', 'store', 'promise', 'form', 'salary', 'factory',
  'tool', 'pride', 'step', 'march', 'interview', 'entrance', 'exit',
  'secret', 'service', 'dwelling', 'sunset', 'sunrise', 'afternoon',
  'formula', 'formulary', 'equilibrium', 'turn', 'stock', 'supply',
  'demand', 'trade', 'profit', 'loss', 'rate', 'charge', 'fee',
  'discount', 'refund', 'deposit', 'withdrawal', 'transfer', 'payment',
]);

const NOT_VERB_WORDS = new Set([
    'together','morning','evening','afternoon','night','today','tomorrow','yesterday',
    'always','never','often','sometimes','usually','here','there','now','then',
    'very','much','more','less','also','too','just','only','still','already',
    'quickly','slowly','carefully','loudly','quietly','suddenly','immediately',
    'forward','backward','inside','outside','nearby','home','away','back',
    'above','below','between','behind','beside','around','across','along',
    'early','late','fast','hard','well','badly','enough','really','quite',
    'perhaps','maybe','definitely','certainly','probably','unfortunately',
    'approximately','completely','absolutely','exactly','especially','particularly',
    'separately','directly','properly','seriously','honestly','meanwhile',
    'otherwise','instead','however','therefore','moreover','apart','everywhere',
    'daily','weekly','monthly','yearly','regularly','occasionally','finally',
  ]);

// Known English adjectives — prevent "to full", "to dear" etc.
const KNOWN_ADJECTIVES = new Set([
  'full','empty','dear','wanted','closed','broken','frozen','lost',
  'born','tired','bored','excited','scared','worried','confused','surprised',
  'married','divorced','retired','pregnant','drunk','sober','naked','blind',
  'deaf','dumb','mute','lame','mad','crazy','wild','tame','calm','fierce',
  'gentle','rough','smooth','sharp','dull','bright','dim','clear','dark',
  'light','heavy','thick','thin','wide','narrow','deep','shallow','flat',
  'round','square','straight','crooked','curved','bent','twisted','tight',
  'loose','firm','soft','hard','wet','dry','hot','cold','warm','cool',
  'fresh','stale','raw','ripe','rotten','sweet','sour','bitter','salty',
  'spicy','bland','tasty','delicious','disgusting','ugly','pretty',
  'beautiful','handsome','cute','lovely','gorgeous','plain','fancy',
  'elegant','cheap','expensive','free','busy','idle','lazy','active',
  'passive','slow','quick','fast','rapid','sudden','gradual','steady',
  'stable','unstable','safe','dangerous','risky','secure','insecure',
  'rich','poor','wealthy','humble','proud','modest','shy','bold',
  'brave','cowardly','afraid','fearless','anxious','nervous','confident',
  'certain','uncertain','sure','unsure','obvious','subtle','visible',
  'invisible','apparent','hidden','secret','public','private','personal',
  'social','local','foreign','domestic','urban','rural','ancient',
  'modern','new','old','young','elderly','mature','immature','adult',
  'juvenile','senior','junior','main','minor','major','tiny','huge',
  'enormous','massive','vast','slim','fat','skinny','lean','muscular',
  'fit','healthy','sick','ill','weak','strong','powerful','mighty',
  'guilty','innocent','fair','unfair','just','unjust','legal','illegal',
  'valid','invalid','true','false','real','fake','genuine','artificial',
  'natural','synthetic','organic','toxic','poisonous','harmless',
  'covered','exposed','mixed','fixed','attached','detached','connected',
  'gone','registered','creative','narrow','last','wide','next','deep',
  'near','far','close','late','early','past','recent','current','former',
  'present','future','average','common','rare','familiar','separate',
  'various','multiple','additional','extra','brief','entire','complete',
  'whole','necessary','essential','critical','obvious','relative','basic',
  'complex','simple','original','independent','individual','available',
  'traditional','revolutionary','gentle','amable','kind','transferred',
  'stalled','revolutionized','transformed','organized','specialized',
  'limited','approved','certified','qualified','experienced','advanced',
  'improved','increased','reduced','established','determined','dedicated',
  'interested','worried','amazed','astonished','delighted','disappointed',
  'embarrassed','fascinated','frustrated','horrified','impressed',
  'inspired','motivated','overwhelmed','puzzled','relaxed','relieved',
  'satisfied','shocked','stunned','terrified','thrilled','touched',
  'secondary','primary','tertiary','final','initial','annual',
  'several','charming','dwelling','andean','alpine','coastal',
  'suburban','metropolitan','continental','domestic','foreign',
  'financed','received','inscribed','registered',
  'retired','surfed','stalled','formed','balanced','shifted',
  'stored','promised','just','mere','sole','main','chief','prime',
]);

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
    // Expanded set 2 — addresses remaining missing_to_on_verb failures
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
    'unite','update','upgrade','urge','vacuum','value','venture','version',
    'view','voice','volunteer','voyage','wage','wager','wander','warehouse',
    'warrant','weather','welcome','whistle','witness','wonder','worship',
    'wound','wreck','wrestle','yield','zone','zoom',
    // Expanded set — addresses missing_to_on_verb failures
    'accept','achieve','acquire','adapt','adjust','admire','advise','afford',
    'announce','apologize','appreciate','approach','approve','assemble','assist',
    'assume','attach','attempt','attract','balance','behave','belong','benefit',
    'blame','block','boast','borrow','bother','bounce','breathe','broadcast',
    'browse','budget','calculate','capture','challenge','charge','chat','cheer',
    'circle','classify','collapse','comfort','command','commit','communicate',
    'compete','compose','concentrate','conclude','conduct','confess','confuse',
    'consist','construct','consult','consume','contain','contribute','convert',
    'convince','cooperate','coordinate','correct','correspond','counsel','crash',
    'crawl','criticize','cultivate','cure','customize','damage','deceive',
    'declare','decline','dedicate','defeat','delay','demonstrate','deny','depart',
    'depend','deposit','derive','deserve','desire','detect','determine','devote',
    'diagnose','differ','digest','direct','disappear','disappoint','discard',
    'discipline','disconnect','discourage','discriminate','disguise','dismiss',
    'display','dispose','dispute','dissolve','distinguish','distract','disturb',
    'double','download','draft','drip','dump','educate','elaborate','eliminate',
    'embrace','emerge','emit','emphasize','employ','enable','encounter',
    'encourage','enforce','engage','engineer','enhance','enrich','enroll',
    'ensure','entertain','equip','erase','escape','establish','estimate',
    'evaluate','evolve','examine','exceed','exchange','excite','exclude',
    'execute','exercise','exhibit','exist','expand','expect','experience',
    'experiment','exploit','export','expose','express','extend','extract',
    'facilitate','faint','fancy','feature','figure','filter','finance','flash',
    'flatten','float','flourish','fold','forbid','forecast','forgive','format',
    'formulate','forward','foster','found','frame','frighten','function',
    'furnish','gain','generate','gesture','glow','govern','graduate','grasp',
    'greet','grieve','guarantee','guard','handle','harm','harvest','hasten',
    'heal','hesitate','highlight','hire','host','hum','hurry','ignore',
    'illustrate','imagine','immerse','implement','import','impose','impress',
    'incorporate','indicate','induce','influence','inform','inherit','initiate',
    'inject','innovate','inquire','insert','inspect','inspire','install',
    'institute','instruct','insult','integrate','intend','interact','interfere',
    'interpret','interrupt','intervene','introduce','invade','invent','invest',
    'investigate','invite','involve','isolate','jam','judge','justify','knock',
    'label','lack','land','last','launch','lay','lean','lecture','lend','level',
    'license','limit','linger','link','list','load','lobby','locate','log',
    'long','lower','maintain','manufacture','march','mark','master','match',
    'matter','mature','maximize','meditate','memorize','mention','merge',
    'minimize','mislead','moderate','modify','monitor','motivate','mount',
    'multiply','murder','murmur','narrow','navigate','neglect','negotiate',
    'nominate','normalize','note','notify','nourish','nurse','obey','object',
    'obligate','observe','obtain','occupy','offend','offset','omit','operate',
    'oppose','opt','organize','orient','originate','outline','overcome',
    'overlook','overtake','overwhelm','owe','own','pace','pack','panic',
    'participate','pause','penetrate','perceive','perform','permit','persist',
    'persuade','photograph','pioneer','pitch','pledge','plunge','polish',
    'ponder','portray','pose','possess','postpone','pour','predict','prefer',
    'prescribe','preserve','preside','presume','pretend','prevail','prevent',
    'proceed','proclaim','profit','prohibit','project','promise','promote',
    'pronounce','propose','prosecute','prospect','prosper','provoke','purchase',
    'pursue','qualify','quote','race','rain','rally','range','rank','rate',
    'react','realize','reason','rebel','recall','reckon','recommend',
    'reconcile','recover','recruit','recycle','redirect','refer','reflect',
    'refuse','regain','regard','register','regulate','reinforce','reject',
    'relate','relax','release','relieve','rely','remark','remedy','remind',
    'render','renew','renovate','rent','repeat','replace','report','represent',
    'reproduce','request','rescue','resemble','reserve','reside','resign',
    'resist','resolve','resort','restore','restrict','retain','retreat',
    'retrieve','reveal','reverse','revise','revolve','reward','ring','ripen',
    'risk','rival','roam','rotate','rub','rush','sacrifice','sample',
    'satisfy','scatter','schedule','scratch','scream','secure','seize',
    // Expanded set 3 — more missing verbs
    'nest','hope','comment','avoid','score','narrow','register','schedule',
    'reason','page','mark','bath','bathe','serve','egg','room','base',
    'receive','enjoy','regret','retire','surf','dwell','stall','form',
    'fulfill','complete','achieve','maintain','obtain','contain','retain',
    'sustain','restrain','explain','complain','remain','entertain',
    'appreciate','celebrate','communicate','concentrate','demonstrate',
    'educate','eliminate','estimate','evaluate','examine','generate',
    'illustrate','investigate','negotiate','participate','recognize',
    'worry','expect','announce','apply','approach','argue','assume',
    'attempt','attend','beg','belong','bless','bloom','boast','bore',
    'breathe','burden','capture','carve','claim','clarify','collapse',
    'command','commit','communicate','compete','compose','concern',
    'conclude','confront','connect','consent','construct','consult',
    'consume','contain','contribute','convince','cooperate','correct',
    'correspond','counsel','dare','deceive','declare','decline','defend',
    'define','delay','demand','demonstrate','deny','depend','depict',
    'derive','describe','deserve','desire','detect','determine','differ',
    'disappear','disappoint','discharge','discover','disguise','dismiss',
    'display','distinguish','distract','disturb','dominate','drift',
    'drown','dump','educate','elect','eliminate','embrace','emerge',
    'emit','emphasize','employ','enable','encounter','enforce','engage',
    'enhance','ensure','entertain','equip','erase','escape','evaluate',
    'evolve','examine','exceed','excite','exclude','execute','exhibit',
    'expand','experiment','exploit','export','extend','extract',
    'facilitate','fancy','feature','finance','flash','fold','force',
    'forecast','formulate','found','frame','frighten','function',
    'furnish','gain','generate','gesture','glow','grasp','greet',
    'guarantee','guard','handle','harm','hasten','heal','hesitate',
    'highlight','hire','host','hurry','ignore','illustrate','imagine',
    'implement','impose','impress','incorporate','indicate','induce',
    'influence','inform','inherit','initiate','inject','innovate',
    'inquire','insert','inspect','inspire','integrate','intend',
    'interact','interfere','interpret','interrupt','intervene','introduce',
    'invade','involve','isolate','justify','label','lack','launch',
    'lean','lecture','lend','level','license','limit','link','list',
    'load','locate','log','lower','manufacture','mention','merge',
    'minimize','mislead','moderate','modify','motivate','mount',
    'multiply','murder','murmur','navigate','neglect','negotiate',
    'nominate','normalize','note','notify','nourish','object','obligate',
    'observe','obtain','occupy','offend','offset','omit','oppose',
    'opt','orient','originate','outline','overcome','overlook','overtake',
    'overwhelm','owe','own','participate','pause','penetrate','perceive',
    'perform','permit','persist','persuade','photograph','pioneer',
    'pitch','pledge','plunge','polish','ponder','portray','pose',
    'possess','postpone','predict','prefer','prescribe','preserve',
    'preside','presume','pretend','prevail','prevent','proceed','proclaim',
    'profit','prohibit','promote','pronounce','propose','prosecute',
    'prosper','provoke','purchase','pursue','qualify','quote','race',
    'rain','rally','range','rank','rate','react','realize','rebel',
    'recall','reckon','recommend','reconcile','recover','recruit',
    'recycle','redirect','refer','reflect','refuse','regain','regard',
    'regulate','reinforce','reject','relate','relax','release','relieve',
    'rely','remark','remedy','remind','render','renew','renovate',
    'rent','repeat','replace','report','represent','reproduce','request',
    'rescue','resemble','reserve','reside','resign','resist','resolve',
    'resort','restore','restrict','retain','retreat','retrieve','reveal',
    'reverse','revise','revolve','reward','ring','ripen','risk','rival',
    'roam','rotate','rub','rush','sacrifice','sample','satisfy','scatter',
    'seal','secure','seize',
    'select','sense','separate','serve','settle','sew','shed','shelter',
    'shift','shine','shock','shout','shrink','signal','simplify','simulate',
    'sink','situate','skip','slam','slap','slip','smash','snap','socialize',
    'soften','sort','spark','specialize','specify','speed','spell','spill',
    'split','spoil','sponsor','spray','squeeze','stabilize','stain','stare',
    'starve','stimulate','stir','store','strain','strengthen','stretch',
    'strike','strip','strive','structure','struggle','stuff','stumble',
    'submit','subscribe','substitute','succeed','sue','suggest','summarize',
    'summon','supplement','suppose','suppress','surpass','surprise','surrender',
    'surround','survive','suspect','suspend','sustain','swallow','swap',
    'swear','sweep','swell','switch','sympathize','tackle','target','taste',
    'tend','terminate','terrify','testify','threaten','thrive','tighten',
    'tip','tolerate','trace','trade','transform','transmit','transport',
    'trap','treasure','trigger','triumph','trouble','tumble','twist',
    'undergo','underline','undermine','undertake','unfold','unite','unlock',
    'unveil','upload','urge','utilize','validate','value','vanish','vary',
    'venture','verify','violate','volunteer','wander','warn','weaken','weave',
    'weigh','welcome','whistle','widen','withdraw','withstand','witness',
    'wonder','worsen','worship','wound','wrap','wrestle','yell','yield','zoom',
  ]);

// ─── Devanagari / Arabic / CJK / Cyrillic ranges for source char detection ─

const NON_LATIN_RANGES = [
  /[\u0900-\u097F]/,  // Devanagari
  /[\u0600-\u06FF]/,  // Arabic
  /[\u0400-\u04FF]/,  // Cyrillic
  /[\u4E00-\u9FFF]/,  // CJK
  /[\u3040-\u309F]/,  // Hiragana
  /[\u30A0-\u30FF]/,  // Katakana
  /[\uAC00-\uD7AF]/,  // Korean
  /[\u0980-\u09FF]/,  // Bengali
  /[\u0A80-\u0AFF]/,  // Gujarati
  /[\u0B00-\u0B7F]/,  // Oriya
  /[\u0B80-\u0BFF]/,  // Tamil
  /[\u0C00-\u0C7F]/,  // Telugu
  /[\u0C80-\u0CFF]/,  // Kannada
  /[\u0D00-\u0D7F]/,  // Malayalam
  /[\u0E00-\u0E7F]/,  // Thai
];

/**
 * Stats tracker for post-processing rules.
 */
class PostProcessStats {
  constructor() {
    this.counts = {
      html_entities: 0,
      truncated: 0,
      romanization: 0,
      lowercased: 0,
      stripped_article: 0,
      stripped_pronoun: 0,
      stripped_negation: 0,
      lemmatized_verb: 0,
      lemmatized_noun: 0,
      fragment_trimmed: 0,
      wrong_pos: 0,
      function_word_def: 0,
      duplicate: 0,
      length_capped: 0,
      stripped_false_to: 0,
      stripped_false_to_v2: 0,
      source_chars: 0,
      too_long: 0,
      self_referencing: 0,
      mixed_case_cleanup: 0,
      proper_noun_was_verb: 0,
    };
    this.flagged = new Set();
    this.translationCounts = new Map(); // track duplicates
    this.details = {}; // rule → [word, ...]
    for (const key of Object.keys(this.counts)) {
      this.details[key] = [];
    }
  }

  hit(rule, word) {
    this.counts[rule]++;
    if (this.details[rule].length < 20) { // keep up to 20 examples
      this.details[rule].push(word);
    }
  }

  flag(word, reason) {
    this.flagged.add(word + '|' + reason);
  }

  trackTranslation(word, translation) {
    const t = translation.toLowerCase().trim();
    if (!this.translationCounts.has(t)) this.translationCounts.set(t, []);
    this.translationCounts.get(t).push(word);
  }

  getDuplicates(threshold = 10) {
    const dupes = [];
    for (const [trans, words] of this.translationCounts.entries()) {
      if (words.length >= threshold) {
        dupes.push({ translation: trans, count: words.length, sample: words.slice(0, 5) });
      }
    }
    return dupes;
  }

  report() {
    const lines = ['=== Post-Processing Report ==='];
    for (const [rule, count] of Object.entries(this.counts)) {
      if (count > 0) {
        lines.push(`  ${rule}: ${count}`);
        if (this.details[rule].length > 0) {
          lines.push(`    examples: ${this.details[rule].slice(0, 5).join(', ')}`);
        }
      }
    }
    lines.push(`  total_flagged: ${this.flagged.size}`);
    const dupes = this.getDuplicates();
    if (dupes.length > 0) {
      lines.push(`  duplicate_translations (10+): ${dupes.length}`);
      for (const d of dupes.slice(0, 5)) {
        lines.push(`    "${d.translation}" → ${d.count} entries`);
      }
    }
    return lines.join('\n');
  }
}

/**
 * Apply all 16 post-processing rules to a Google Translate output.
 *
 * @param {string} raw - Raw translation from Google
 * @param {string} pos - Part of speech ('n', 'v', 'adj', 'adv', etc.)
 * @param {string} sourceWord - Original source-language word
 * @param {PostProcessStats} stats - Stats tracker
 * @returns {{ text: string, flagged: boolean, flagReasons: string[] }}
 */
function postProcess(raw, pos, sourceWord, stats) {
  if (!raw || typeof raw !== 'string') {
    return { text: '?', flagged: true, flagReasons: ['empty_input'] };
  }

  let text = raw.trim();
  const flagReasons = [];

  // ── Rule 1: HTML entities ──
  let hadEntity = false;
  for (const [entity, replacement] of Object.entries(HTML_ENTITIES)) {
    if (text.includes(entity)) {
      text = text.split(entity).join(replacement);
      hadEntity = true;
    }
  }
  // Also decode numeric entities
  text = text.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)));
  text = text.replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCharCode(parseInt(code, 16)));
  if (hadEntity) {
    stats.hit('html_entities', sourceWord);
  }

  // ── Rule 2: Truncated output ──
  if (text.length < 4 && !/^[a-z]{2,3}$/i.test(text)) {
    stats.hit('truncated', sourceWord);
    stats.flag(sourceWord, 'truncated');
    flagReasons.push('truncated');
    // Don't return yet — still apply other rules
  }

  // ── Rule 3: Romanization detection ──
  if (sourceWord && text.length >= 3) {
    const srcLower = sourceWord.toLowerCase().replace(/[^a-z]/g, '');
    const txtLower = text.toLowerCase().replace(/[^a-z]/g, '');
    if (srcLower.length >= 3 && txtLower.length >= 3) {
      // Check character overlap
      const srcChars = new Set(srcLower.split(''));
      const txtChars = new Set(txtLower.split(''));
      let overlap = 0;
      for (const c of txtChars) {
        if (srcChars.has(c)) overlap++;
      }
      const overlapRatio = overlap / Math.max(txtChars.size, 1);
      // Also check if they look very similar (Levenshtein-like)
      if (overlapRatio > 0.7 && Math.abs(srcLower.length - txtLower.length) < 3) {
        stats.hit('romanization', sourceWord);
        stats.flag(sourceWord, 'romanization');
        flagReasons.push('romanization');
      }
    }
  }

  // ── Rule 5: Strip leading articles (before lowercasing so "The X" → "X") ──
  const articleMatch = text.match(/^(the|a|an)\s+(.+)$/i);
  if (articleMatch) {
    text = articleMatch[2];
    stats.hit('stripped_article', sourceWord);
  }

  // ── Rule 4: Normalize case ──
  // Fix mixed case like "tO DO" → "to do", then lowercase first letter
  // Step 1: Fix any word with mixed case (lowercase after first char has uppercase)
  text = text.replace(/\b\w+\b/g, (word) => {
    // If word has mixed case like "tO" or "dO" or "DO", normalize
    if (/[a-z][A-Z]/.test(word) || /^[A-Z]{2,}$/.test(word)) {
      return word.toLowerCase();
    }
    return word;
  });
  // Step 2: Lowercase first letter (Google capitalizes all single-word responses)
  if (text.length > 0 && text[0] !== text[0].toLowerCase()) {
    text = text[0].toLowerCase() + text.slice(1);
    stats.hit('lowercased', sourceWord);
  }

  // ── Rule 6: Strip leading pronouns ──
  const pronounMatch = text.match(/^(i|we|they|he|she|you|it)\s+(.+)$/i);
  if (pronounMatch) {
    text = pronounMatch[2];
    stats.hit('stripped_pronoun', sourceWord);
  }

  // ── Rule 7: Strip negation ──
  const negMatch = text.match(/^(don'?t|doesn'?t|didn'?t|cannot|can'?t|won'?t|wouldn'?t|shouldn'?t|couldn'?t|isn'?t|aren'?t|wasn'?t|weren'?t)\s+(.+)$/i);
  if (negMatch) {
    text = negMatch[2];
    stats.hit('stripped_negation', sourceWord);
  }

  // ── Rule 8: Lemmatize verbs ──
  // ── Rule 8a: Proper noun detection ──
  // Only treat as proper noun if the translation looks like a transliteration
  // (output chars very similar to source chars) AND source uses non-Latin script.
  // Google capitalises ALL single-word translations, so we can't use capitalisation alone.
  const singleWord = text.replace(/^to\s+/, '').trim();
  if (singleWord.length >= 3 && sourceWord) {
    const srcHasNonLatin = NON_LATIN_RANGES.some(r => r.test(sourceWord));
    const outputIsLatinOnly = /^[a-zA-Z]+$/.test(singleWord);
    // If source is non-Latin and output is just Latin letters that look like transliteration
    if (srcHasNonLatin && outputIsLatinOnly) {
      // Check if it's NOT a common English word (proper nouns aren't common words)
      const lower = singleWord.toLowerCase();
      // Also check via lemmatizer — if lemmatize changes it, it's a known English word form
      const verbLemma = lemmatize(lower, 'v');
      const nounLemma = lemmatize(lower, 'n');
      const isKnownForm = verbLemma !== lower || nounLemma !== lower;
      // Extra common English words that aren't in the specific lists above
      const COMMON_ENGLISH = new Set([
        'season','fresh','old','new','big','small','hot','cold','warm','cool',
        'long','short','tall','wide','narrow','deep','high','low','heavy','light',
        'fast','slow','clean','dirty','dry','wet','hard','soft','sweet','sour',
        'bitter','salty','rich','poor','cheap','expensive','free','busy','empty',
        'full','open','closed','dark','bright','loud','quiet','safe','dangerous',
        'happy','sad','angry','tired','hungry','thirsty','sick','healthy','ready',
        'beautiful','ugly','strong','weak','young','thin','thick','flat','round',
        'sharp','smooth','rough','tight','loose','straight','wrong','right',
        'certain','possible','impossible','necessary','important','different',
        'similar','same','other','another','next','last','first','second','third',
        'whole','half','double','single','main','real','true','false','local',
        'foreign','public','private','general','special','common','rare','normal',
        'strange','simple','complex','easy','difficult','basic','traditional',
        'modern','ancient','famous','popular','favorite','perfect','wonderful',
        'terrible','amazing','interesting','boring','useful','useless','natural',
        'official','social','political','economic','cultural','religious','military',
        'medical','legal','technical','digital','electric','nuclear','solar',
        'gold','silver','iron','steel','wooden','plastic','cotton','silk','leather',
        'medical','dental','mental','physical','emotional','spiritual','musical',
        'seasonal','annual','daily','weekly','monthly','national','international',
        // Expanded — common nouns/adjectives not in KNOWN_NOUNS
        'house','money','study','music','place','power','point','group','state',
        'system','program','question','business','story','night','world','area',
        'course','company','problem','service','country','number','issue','part',
        'level','student','class','market','college','member','family','church',
        'experience','interest','information','community','education','practice',
        'support','research','history','industry','development','design','model',
        'standard','product','position','quality','moment','period','society',
        'theory','opportunity','trade','figure','ground','nature','effort',
        'center','effect','process','growth','material','chance','pressure',
        'attention','access','concern','resource','direction','technology',
        'knowledge','evidence','performance','result','success','structure',
        'authority','purpose','weather','season','summer','winter','spring',
        'autumn','price','amount','reason','method','language','century',
        'science','culture','speech','audience','presence','message','range',
        'benefit','challenge','majority','minority','average','surface','edge',
        'border','corner','section','series','pattern','shape','context',
        'chapter','scene','screen','version','feature','movement','signal',
        'measure','approach','aspect','instance','presence','absence','essence',
        // More adjectives
        'afraid','alive','aware','capable','careful','certain','clever','confident',
        'conscious','curious','decent','delicate','desperate','distinct','eager',
        'efficient','elegant','enormous','essential','evident','exact','excellent',
        'excessive','exotic','explicit','extreme','fabulous','fierce','firm',
        'flexible','fortunate','fragile','frequent','genuine','gentle','gorgeous',
        'graceful','grateful','guilty','handsome','harsh','honest','humble',
        'identical','immediate','immense','impressive','incredible','independent',
        'inevitable','initial','innocent','intense','intimate','invisible','keen',
        'lengthy','liable','liberal','likely','logical','lonely','loyal','lucky',
        'magnificent','massive','mature','meaningful','mere','mild','minimum',
        'minor','mobile','moderate','modest','mutual','naked','narrow','native',
        'neat','noble','numerous','obvious','odd','ordinary','original','outer',
        'overall','painful','parallel','partial','passive','peculiar','permanent',
        'persistent','plain','pleasant','polite','portable','positive','potential',
        'precious','precise','preliminary','previous','primary','primitive',
        'principal','profound','prominent','prompt','proper','proud','pure',
        'radical','random','rapid','rational','raw','reasonable','regular',
        'relevant','reluctant','remarkable','remote','representative','respective',
        'responsible','rigid','romantic','rough','routine','rural','sacred',
        'satisfied','secure','selective','sensitive','severe','shallow','shy',
        'significant','silly','sincere','slight','smart','sole','solid',
        'sophisticated','spare','specific','spectacular','stable','standard',
        'steep','stiff','strict','striking','subtle','successive','sufficient',
        'suitable','sunny','superb','superior','supreme','surprised','suspicious',
        'tender','tense','terrible','thorough','tiny','tough','tremendous',
        'tropical','typical','ugly','ultimate','unable','uncertain','unique',
        'unlikely','unusual','upper','upset','urgent','vacant','vague','valid',
        'valuable','vast','visible','visual','vital','vivid','vulnerable',
        'widespread','willing','worthy',
      ]);
      const isCommonWord = FUNCTION_WORDS.has(lower) || KNOWN_NOUNS.has(lower) || KNOWN_ENGLISH_VERBS.has(lower) || NOT_VERB_WORDS.has(lower) || isKnownForm || lower.length <= 4 || COMMON_ENGLISH.has(lower);
      if (!isCommonWord) {
        // It's a transliterated proper noun — capitalize and return
        text = singleWord.charAt(0).toUpperCase() + singleWord.slice(1).toLowerCase();
        flagReasons.push('proper_noun');
        return { text, flagged: flagReasons.length > 0, flagReasons };
      }
    }
  }


  // ── Rule 8b: Non-verb word detection ──
  // If Google returned a word that's clearly not a verb, don't add 'to '

  const googleWord = text.replace(/^to\s+/, '').trim().toLowerCase();
  if (NOT_VERB_WORDS.has(googleWord)) {
    text = text.replace(/^to\s+/, '');
    stats.hit('stripped_false_to', sourceWord);
  }

  // ── Rule 8b2: Strip auxiliary verbs for verb entries ──
  // "will open" → "open", "would have" → "have", "will have" → "have"
  // Also handles "will do/make" → "do/make"
  // Then the main verb detection will add "to "
  {
    const auxMatch = text.match(/^(will|would|shall|should|could|might|must)\s+(.+)$/i);
    if (auxMatch) {
      text = auxMatch[2];
      stats.hit('stripped_pronoun', sourceWord); // reuse counter
    }
  }

  // ── Rule 8b3: Strip parenthetical annotations ──
  // "gave (subj.)" → "gave", "were (subj.)" → "were"
  {
    const parenMatch = text.match(/^(.+?)\s*\(.*\)\s*$/);
    if (parenMatch && parenMatch[1].trim().length > 1) {
      text = parenMatch[1].trim();
    }
  }

  // ── Rule 8b4: Handle slash-separated alternatives ──
  // "do/make" → take first: "do"
  {
    const slashMatch = text.match(/^([^\/]+)\/(.+)$/);
    if (slashMatch && slashMatch[1].trim().length > 1) {
      text = slashMatch[1].trim();
    }
  }

  // ── Rule 8c: Determine verb/noun from ENGLISH output, using source POS as tiebreaker ──
  // Check if Google's English output IS a verb form.
  // When ambiguous (word is both noun and verb), respect source POS.

  const cleanText = text.replace(/^to\s+/, '').trim().toLowerCase();
  const firstWord = cleanText.split(/\s+/)[0];
  const verbLemmaWord = lemmatize(firstWord, 'v');
  const isEnglishVerb = KNOWN_ENGLISH_VERBS.has(firstWord) || KNOWN_ENGLISH_VERBS.has(verbLemmaWord);
  const isAlsoNoun = KNOWN_NOUNS.has(firstWord) || KNOWN_NOUNS.has(lemmatize(firstWord, 'n'));
  const isAdjective = KNOWN_ADJECTIVES.has(firstWord) || KNOWN_ADJECTIVES.has(lemmatize(firstWord, 'v'));

  // Determine effective treatment: verb wins unless:
  //  - source POS says noun AND English is also a known noun
  //  - the English word is a known adjective (don't add "to full", "to covered")
  //  - source POS is adj/adv (never add "to" to adjectives/adverbs)
  const treatAsVerb = isEnglishVerb && !NOT_VERB_WORDS.has(cleanText) &&
    !isAdjective &&
    !(pos === 'n' && isAlsoNoun) &&
    !(pos === 'adj' || pos === 'adv');

  if (treatAsVerb) {
    // It IS a verb — lemmatize and add "to "
    let verbText = text.replace(/^to\s+/, '');
    const words = verbText.split(/\s+/);
    if (words.length <= 3) {
      const lemma = lemmatize(words[0], 'v');
      if (lemma !== words[0].toLowerCase()) {
        words[0] = lemma;
        stats.hit('lemmatized_verb', sourceWord);
      }
      verbText = words.join(' ');
    }
    text = 'to ' + verbText;
  } else if (text.startsWith('to ') && !treatAsVerb) {
    // Has "to " but should not be treated as verb — strip it
    text = text.replace(/^to\s+/, '');
    stats.hit('stripped_false_to_v2', sourceWord);
  }

  // ── Rule 9: Lemmatize nouns ──
  if (!treatAsVerb) {
    const words = text.split(/\s+/);
    // Singularize the last content word (the head noun)
    const lastIdx = words.length - 1;
    const lemma = lemmatize(words[lastIdx], 'n');
    if (lemma !== words[lastIdx].toLowerCase()) {
      words[lastIdx] = lemma;
      stats.hit('lemmatized_noun', sourceWord);
    }
    text = words.join(' ');
  }

  // ── Rule 10: Fragment trim ──
  {
    const words = text.split(/\s+/).filter(w => w.length > 0);
    // For verbs, exclude the leading "to" from the word count
    const countableWords = (pos === 'v' && words[0] === 'to') ? words.slice(1) : words;
    if (countableWords.length > 3) {
      // Keep content words (skip function words)
      const contentWords = countableWords.filter(w => !FUNCTION_WORDS.has(w.toLowerCase()));
      if (contentWords.length > 2) {
        // For verbs, keep "to" + first 2 content words
        if (pos === 'v' && words[0] === 'to') {
          text = 'to ' + contentWords.slice(0, 2).join(' ');
        } else {
          text = contentWords.slice(0, 2).join(' ');
        }
        stats.hit('fragment_trimmed', sourceWord);
      }
    }
  }

  // ── Rule 11: Wrong POS detection ──
  if (pos === 'v') {
    const verbCore = text.replace(/^to\s+/, '').toLowerCase();
    const verbCoreFirst = verbCore.split(/\s+/)[0];
    const isVerbCore = KNOWN_ENGLISH_VERBS.has(verbCoreFirst) || KNOWN_ENGLISH_VERBS.has(lemmatize(verbCoreFirst, 'v'));
    // Flag wrong_pos if:
    //  a) English output is a known noun/adjective/adverb, OR
    //  b) POS=v but the English output is NOT a known verb (pipeline didn't add "to")
    if ((KNOWN_NOUNS.has(verbCore) && verbCore.length > 3) ||
        KNOWN_ADJECTIVES.has(verbCore) ||
        NOT_VERB_WORDS.has(verbCore) ||
        (!text.startsWith('to ') && !isVerbCore && verbCore.length > 2)) {
      stats.hit('wrong_pos', sourceWord);
      stats.flag(sourceWord, 'wrong_pos:verb_but_not_verb');
      flagReasons.push('wrong_pos');
    }
  }
  if (pos === 'n') {
    if (text.startsWith('to ')) {
      stats.hit('wrong_pos', sourceWord);
      stats.flag(sourceWord, 'wrong_pos:noun_but_verb');
      flagReasons.push('wrong_pos');
    }
  }

  // ── Rule 12: Function word as definition ──
  {
    const cleanText = text.replace(/^to\s+/, '').toLowerCase().trim();
    const allWords = cleanText.split(/\s+/);
    const isAllFunction = allWords.every(w => FUNCTION_WORDS.has(w));
    if (isAllFunction && !FUNCTION_WORDS.has(sourceWord)) {
      stats.hit('function_word_def', sourceWord);
      stats.flag(sourceWord, 'function_word_def');
      flagReasons.push('function_word_def');
    }
  }

  // ── Rule 13: Duplicate detection ──
  // (tracked in stats, flagging happens post-hoc via getDuplicates())
  stats.trackTranslation(sourceWord, text);

  // ── Rule 14: Length sanity ──
  if (text.length > 50) {
    text = text.slice(0, 47) + '...';
    // Actually, spec says no trailing "..."
    text = text.replace(/\.{3}$/, '').trim();
    if (text.length > 50) text = text.slice(0, 50);
    stats.hit('length_capped', sourceWord);
  }

  // ── Rule 15: Source language chars in output ──
  for (const pattern of NON_LATIN_RANGES) {
    if (pattern.test(text)) {
      stats.hit('source_chars', sourceWord);
      stats.flag(sourceWord, 'source_chars');
      flagReasons.push('source_chars');
      break;
    }
  }

  // ── Rule 16: Very long relative to source ──
  if (sourceWord && text.length > sourceWord.length * 5 && text.length > 15) {
    // Trim to reasonable length
    const words = text.split(/\s+/);
    if (words.length > 4) {
      if (pos === 'v' && words[0] === 'to') {
        text = words.slice(0, 4).join(' ');
      } else {
        text = words.slice(0, 3).join(' ');
      }
    }
    stats.hit('too_long', sourceWord);
  }

  // ── Rule 17: Self-referencing detection ──
  // If the translation equals the source word (Google couldn't translate it),
  // flag it UNLESS it's a known international/cognate word.
  if (sourceWord && text.toLowerCase().replace(/[^a-zà-ÿ]/g, '') === sourceWord.toLowerCase().replace(/[^a-zà-ÿ]/g, '') && text.length > 2) {
    // Known international words that are the same in English — NOT self-referencing errors
    const KNOWN_COGNATES = new Set([
      'taxi', 'hotel', 'wifi', 'radio', 'piano', 'sofa', 'yoga', 'safari',
      'embargo', 'jersey', 'chocolate', 'banana', 'guitar', 'plaza', 'fiesta',
      'mosquito', 'tornado', 'volcano', 'canyon', 'cafeteria', 'patio', 'rodeo',
      'siesta', 'sombrero', 'taco', 'tortilla', 'burrito', 'salsa', 'pueblo',
      'machete', 'marina', 'cargo', 'guerrilla', 'vigilante', 'desperado',
      'incognito', 'renegade', 'stampede', 'lasso', 'poncho', 'llama',
      'internet', 'blog', 'email', 'software', 'online', 'digital', 'video',
      'audio', 'metro', 'bus', 'gas', 'bar', 'club', 'pub', 'café', 'menu',
      'buffet', 'chef', 'gourmet', 'restaurant', 'pizza', 'pasta', 'kebab',
      'champagne', 'vodka', 'whisky', 'cognac', 'rum', 'gin', 'tequila',
      'opera', 'ballet', 'drama', 'comedy', 'musical', 'festival', 'carnival',
      'tennis', 'golf', 'basketball', 'football', 'volleyball', 'marathon',
      'karate', 'judo', 'kung fu', 'ski', 'surf', 'rugby', 'hockey',
      'robot', 'laser', 'radar', 'satellite', 'astronaut', 'cosmos',
      'algebra', 'algorithm', 'zero', 'algebra', 'safari', 'atlas',
      'museum', 'stadium', 'hospital', 'pharmacy', 'doctor', 'virus',
      'bacteria', 'microbe', 'vitamin', 'protein', 'insulin', 'vaccine',
      'agenda', 'propaganda', 'amnesia', 'anorexia', 'phobia', 'trauma',
      'panorama', 'drama', 'dilemma', 'enigma', 'stigma', 'diploma',
      'favor', 'color', 'terror', 'error', 'horror', 'tumor', 'humor',
      'motor', 'sector', 'factor', 'vector', 'reactor', 'detector',
      'sensor', 'mentor', 'tutor', 'pastor', 'inventor', 'conductor',
      'inspector', 'instructor', 'constructor', 'destructor',
      'central', 'general', 'federal', 'lateral', 'mineral', 'animal',
      'criminal', 'original', 'final', 'total', 'brutal', 'vital',
      'formal', 'normal', 'natural', 'cultural', 'social', 'legal',
      'moral', 'mental', 'dental', 'brutal', 'fatal', 'rural',
      'ideal', 'real', 'visual', 'manual', 'actual', 'virtual',
      // More international words and proper nouns
      'ferry', 'extra', 'idea', 'argentina', 'barcelona', 'terminal',
      'director', 'conductor', 'professor', 'doctor', 'actor', 'mentor',
      'sensor', 'receptor', 'inspector', 'instructor', 'reactor',
      'festival', 'hospital', 'animal', 'mineral', 'criminal',
      'diagonal', 'original', 'traditional', 'regional', 'colonial',
      'tropical', 'industrial', 'commercial', 'cultural', 'personal',
      'principal', 'capital', 'pedal', 'medal', 'spiral', 'rival',
      'canal', 'coral', 'crystal', 'sandal', 'metal', 'petal',
      'continental', 'accidental', 'fundamental', 'monumental',
      'sentimental', 'experimental', 'elemental', 'ornamental',
      'incidental', 'horizontal', 'vertical', 'oriental',
      'color', 'favor', 'error', 'horror', 'terror', 'humor',
      'motor', 'sector', 'factor', 'vector', 'tumor', 'vigor',
      'paella', 'salsa', 'tango', 'mambo', 'samba', 'rumba',
      'fiesta', 'siesta', 'vista', 'pasta', 'pizza', 'latte',
      'souvenir', 'croissant', 'baguette', 'elite', 'facade',
      'debut', 'detour', 'entrepreneur', 'plateau', 'boutique',
      'whatsapp', 'facebook', 'twitter', 'instagram', 'uber',
      'capoeira', 'pikachu', 'karaoke', 'manga', 'anime', 'emoji',
      'sushi', 'tofu', 'wasabi', 'sake', 'tsunami', 'kimono',
    ]);
    const normalized = text.toLowerCase().replace(/[^a-z]/g, '');
    if (!KNOWN_COGNATES.has(normalized) && !KNOWN_COGNATES.has(text.toLowerCase())) {
      stats.hit('self_referencing', sourceWord);
      stats.flag(sourceWord, 'self_referencing');
      flagReasons.push('self_referencing');
    }
    // Keep the text regardless — it's the correct translation for cognates
  }

  // ── Rule 18: Mixed case cleanup ──
  // Final check: if text still has weird case patterns, normalize
  if (/[a-z][A-Z]/.test(text)) {
    text = text.toLowerCase();
    stats.hit('mixed_case_cleanup', sourceWord);
  }

  // Final cleanup
  text = text.trim();
  if (!text || text === 'to') {
    text = '?';
    flagReasons.push('empty_result');
  }

  return {
    text,
    flagged: flagReasons.length > 0,
    flagReasons,
  };
}

module.exports = { postProcess, PostProcessStats };

// Self-test
if (require.main === module) {
  const stats = new PostProcessStats();

  const tests = [
    // Rule 1: HTML entities
    { raw: "don&#39;t know", pos: 'v', src: 'test1', expect: 'to know' },
    // Rule 4+5: Lowercase + strip article
    { raw: "The House", pos: 'n', src: 'test2', expect: 'house' },
    // Rule 6: Strip pronoun
    { raw: "I eat", pos: 'v', src: 'test3', expect: 'to eat' },
    // Rule 7: Strip negation
    { raw: "don't go", pos: 'v', src: 'test4', expect: 'to go' },
    // Rule 8: Lemmatize verb
    { raw: "eaten", pos: 'v', src: 'test5', expect: 'to eat' },
    { raw: "running", pos: 'v', src: 'test6', expect: 'to run' },
    // Rule 9: Lemmatize noun
    { raw: "children", pos: 'n', src: 'test7', expect: 'child' },
    { raw: "countries", pos: 'n', src: 'test8', expect: 'country' },
    // Rule 10: Fragment trim
    { raw: "very large and important building", pos: 'n', src: 'test9', expect: 'large important' },
  ];

  let pass = 0, fail = 0;
  for (const t of tests) {
    const result = postProcess(t.raw, t.pos, t.src, stats);
    if (result.text === t.expect) {
      pass++;
    } else {
      fail++;
      console.log(`FAIL: "${t.raw}" (${t.pos}) → "${result.text}" (expected "${t.expect}")`);
    }
  }
  console.log(`\nResults: ${pass} passed, ${fail} failed out of ${tests.length} tests`);
  console.log('\n' + stats.report());
}
