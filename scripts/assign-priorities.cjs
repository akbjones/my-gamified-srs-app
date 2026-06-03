#!/usr/bin/env node
/**
 * assign-priorities.cjs
 * Assigns priority 1/2/3 to every card in all 11 language decks.
 *  1 = practical daily-life sentences
 *  2 = useful but not urgent for beginners
 *  3 = specialized/cultural/academic/niche
 */

const fs = require('fs');
const path = require('path');

const LANGUAGES = [
  'spanish', 'italian', 'french', 'portuguese',
  'german', 'dutch', 'swedish', 'welsh',
  'hindi', 'turkish', 'russian'
];

const BASE = path.resolve(__dirname, '..', 'src', 'data');

// ─── Practical vocabulary set ────────────────────────────────────────────────

const PRACTICAL_WORDS = new Set([
  // Greetings / farewells
  'hello','hi','hey','goodbye','bye','morning','evening','afternoon',
  'please','thank','thanks','sorry','excuse','welcome','goodnight',
  'greetings','farewell',

  // Questions
  'how','what','where','when','who','why','which',

  // Food / drink
  'eat','drink','water','coffee','tea','milk','bread','rice','meat',
  'fish','chicken','soup','cake','fruit','vegetable','vegetables','restaurant',
  'menu','order','hungry','thirsty','breakfast','lunch','dinner','cook',
  'delicious','taste','food','beer','wine','juice','sugar','salt','pepper',
  'cheese','egg','eggs','butter','oil','pizza','salad','sandwich','chocolate',
  'ice','cream','dessert','plate','glass','cup','bottle','fork','knife',
  'spoon','snack','meal','oven','fridge','recipe',

  // Family
  'mother','mom','mum','father','dad','brother','sister','son','daughter',
  'husband','wife','children','child','parents','grandmother','grandfather',
  'grandma','grandpa','uncle','aunt','cousin','family','baby','friend',
  'friends','neighbor','neighbours','neighbors','pet','dog','cat',

  // Shopping
  'buy','sell','price','cost','money','shop','store','market','cheap',
  'expensive','pay','change','receipt','card','cash','discount','sale','bag',
  'size','gift','present','online','delivery','return',

  // Directions / transport
  'left','right','straight','near','far','close','station','bus','train',
  'taxi','cab','airport','street','road','turn','stop','map','drive',
  'car','bike','bicycle','walk','north','south','east','west','corner',
  'block','bridge','highway','parking','ticket','seat','platform','gate',
  'flight','subway','metro','tram','boat','ship','ferry',

  // Health
  'doctor','hospital','medicine','sick','ill','pain','help','emergency',
  'healthy','hurt','feel','headache','cold','fever','cough','allergy',
  'pharmacy','nurse','dentist','appointment','ambulance','blood','heart',
  'stomach','tooth','eye','eyes','ear','nose','head','hand','arm','leg',
  'foot','back','body','skin','bone','rest','exercise','vitamin','diet',
  'pregnant','surgery','injection','bandage','prescription',

  // Weather
  'weather','rain','raining','sun','sunny','hot','cold','warm','snow',
  'snowing','wind','windy','cloud','cloudy','temperature','storm','fog',
  'degree','degrees','forecast','umbrella','season','spring','summer',
  'autumn','fall','winter',

  // Daily routine
  'wake','sleep','sleeping','shower','brush','dress','leave','arrive',
  'home','office','clean','wash','iron','vacuum','laundry','garbage',
  'trash','routine','alarm','breakfast','commute','homework',

  // Time / numbers / calendar
  'time','hour','hours','minute','minutes','second','seconds','day','days',
  'week','weeks','month','months','year','years','today','tomorrow',
  'yesterday','night','early','late','clock','watch','schedule','calendar',
  'monday','tuesday','wednesday','thursday','friday','saturday','sunday',
  'january','february','march','april','may','june','july','august',
  'september','october','november','december','weekend','holiday','birthday',
  'anniversary','date','soon','later','ago','already','yet','still','always',
  'never','sometimes','often','usually','rarely','once','twice',
  'one','two','three','four','five','six','seven','eight','nine','ten',
  'eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen',
  'eighteen','nineteen','twenty','thirty','forty','fifty','sixty','seventy',
  'eighty','ninety','hundred','thousand','million','first','second','third',
  'half','quarter','zero','number','numbers','much','many','more','less',
  'few','several','every','each','all','some','any','no','none','both',
  'enough','lot','plenty',

  // Common verbs
  'be','am','is','are','was','were','been','being',
  'have','has','had','having',
  'do','does','did','doing','done',
  'go','goes','going','went','gone',
  'come','comes','coming','came',
  'see','sees','seeing','saw','seen',
  'know','knows','knowing','knew','known',
  'want','wants','wanting','wanted',
  'need','needs','needing','needed',
  'like','likes','liking','liked',
  'love','loves','loving','loved',
  'think','thinks','thinking','thought',
  'say','says','saying','said',
  'tell','tells','telling','told',
  'speak','speaks','speaking','spoke','spoken',
  'talk','talks','talking','talked',
  'give','gives','giving','gave','given',
  'take','takes','taking','took','taken',
  'make','makes','making','made',
  'get','gets','getting','got','gotten',
  'find','finds','finding','found',
  'use','uses','using','used',
  'try','tries','trying','tried',
  'put','puts','putting',
  'open','opens','opening','opened',
  'close','closes','closing','closed',
  'start','starts','starting','started',
  'begin','begins','beginning','began',
  'finish','finishes','finishing','finished',
  'wait','waits','waiting','waited',
  'run','runs','running','ran',
  'walk','walks','walking','walked',
  'sit','sits','sitting','sat',
  'stand','stands','standing','stood',
  'play','plays','playing','played',
  'learn','learns','learning','learned','learnt',
  'teach','teaches','teaching','taught',
  'understand','understands','understanding','understood',
  'remember','remembers','remembering','remembered',
  'forget','forgets','forgetting','forgot','forgotten',
  'bring','brings','bringing','brought',
  'send','sends','sending','sent',
  'call','calls','calling','called',
  'meet','meets','meeting','met',
  'live','lives','living','lived',
  'work','works','working','worked',
  'travel','travels','traveling','travelled','traveling',
  'read','reads','reading',
  'write','writes','writing','wrote','written',
  'listen','listens','listening','listened',
  'watch','watches','watching','watched',
  'show','shows','showing','showed','shown',
  'ask','asks','asking','asked',
  'answer','answers','answering','answered',
  'look','looks','looking','looked',
  'move','moves','moving','moved',
  'carry','carries','carrying','carried',
  'hold','holds','holding','held',
  'break','breaks','breaking','broke','broken',
  'fix','fixes','fixing','fixed',
  'build','builds','building','built',
  'choose','chooses','choosing','chose','chosen',
  'decide','decides','deciding','decided',
  'follow','follows','following','followed',
  'keep','keeps','keeping','kept',
  'leave','leaves','leaving','left',
  'let','lets','letting',
  'lose','loses','losing','lost',
  'miss','misses','missing','missed',
  'pass','passes','passing','passed',
  'pick','picks','picking','picked',
  'plan','plans','planning','planned',
  'pull','pulls','pulling','pulled',
  'push','pushes','pushing','pushed',
  'reach','reaches','reaching','reached',
  'return','returns','returning','returned',
  'save','saves','saving','saved',
  'share','shares','sharing','shared',
  'sing','sings','singing','sang','sung',
  'spend','spends','spending','spent',
  'stay','stays','staying','stayed',
  'turn','turns','turning','turned',
  'visit','visits','visiting','visited',
  'wear','wears','wearing','wore','worn',
  'win','wins','winning','won',
  'wish','wishes','wishing','wished',
  'worry','worries','worrying','worried',
  'enjoy','enjoys','enjoying','enjoyed',
  'believe','believes','believing','believed',
  'check','checks','checking','checked',
  'count','counts','counting','counted',
  'cross','crosses','crossing','crossed',
  'cut','cuts','cutting',
  'draw','draws','drawing','drew','drawn',
  'drop','drops','dropping','dropped',
  'fall','falls','falling','fell','fallen',
  'fill','fills','filling','filled',
  'fly','flies','flying','flew','flown',
  'grow','grows','growing','grew','grown',
  'happen','happens','happening','happened',
  'hope','hopes','hoping','hoped',
  'hurry','hurries','hurrying','hurried',
  'join','joins','joining','joined',
  'laugh','laughs','laughing','laughed',
  'lie','lies','lying','lay','lain',
  'notice','notices','noticing','noticed',
  'offer','offers','offering','offered',
  'pay','pays','paying','paid',
  'prefer','prefers','preferring','preferred',
  'prepare','prepares','preparing','prepared',
  'promise','promises','promising','promised',
  'protect','protects','protecting','protected',
  'raise','raises','raising','raised',
  'receive','receives','receiving','received',
  'sell','sells','selling','sold',
  'seem','seems','seeming','seemed',
  'smile','smiles','smiling','smiled',
  'suggest','suggests','suggesting','suggested',
  'suppose','supposes','supposing','supposed',
  'swim','swims','swimming','swam','swum',
  'thank','thanking','thanked',
  'throw','throws','throwing','threw','thrown',
  'touch','touches','touching','touched',
  'wake','wakes','waking','woke','woken',

  // Common adjectives
  'good','great','bad','big','large','small','little','old','new','young',
  'long','short','tall','hot','cold','warm','cool','beautiful','pretty',
  'handsome','ugly','nice','happy','sad','angry','scared','afraid','brave',
  'important','easy','simple','difficult','hard','ready','tired','busy',
  'different','same','similar','first','last','next','previous','favorite',
  'favourite','possible','impossible','necessary','free','available',
  'open','closed','full','empty','clean','dirty','fast','quick','slow',
  'quiet','loud','dark','light','bright','strong','weak','rich','poor',
  'safe','dangerous','wrong','right','true','false','real','fake',
  'sure','certain','special','normal','regular','usual','strange','weird',
  'perfect','terrible','wonderful','amazing','awful','incredible',
  'hungry','thirsty','comfortable','interested','interesting',
  'boring','bored','exciting','excited','surprised','surprising',
  'worried','nervous','confident','proud','lucky','unlucky',
  'single','married','alone','together','own','other','another',
  'enough','extra','main','basic','common','popular','famous',
  'modern','traditional','fresh','raw','cooked','sweet','sour','bitter',
  'spicy','salty',

  // Common nouns
  'house','home','apartment','flat','room','door','window','wall','floor',
  'ceiling','roof','stairs','kitchen','bathroom','bedroom','garden','yard',
  'car','phone','cellphone','mobile','computer','laptop','tablet','internet',
  'wifi','email','message','text','website','app','password','screen',
  'book','page','newspaper','magazine','letter','note','list',
  'picture','photo','photograph','video','camera','movie','film',
  'music','song','radio','television','tv',
  'game','sport','ball','team','match','score','player',
  'story','news','idea','problem','solution','question','answer',
  'place','city','town','village','country','world','area','region',
  'people','person','man','woman','boy','girl','guy','lady','gentleman',
  'name','age','job','work','career','boss','colleague','employee',
  'language','word','sentence','meaning','conversation','translation',
  'school','university','college','class','lesson','course','teacher',
  'student','exam','test','grade','degree','education','knowledge',
  'thing','stuff','part','piece','kind','type','way','side','end',
  'point','reason','example','fact','information','detail',
  'life','death','health','love','happiness','peace','truth',
  'air','fire','earth','land','sky','sea','ocean','river','lake',
  'mountain','hill','forest','tree','flower','plant','grass',
  'animal','bird','dog','cat','horse','cow','pig','sheep',
  'color','colour','red','blue','green','yellow','white','black',
  'brown','pink','orange','purple','grey','gray',
  'paper','pen','pencil','desk','board','chair','table','bed',
  'clothes','shirt','pants','shoes','hat','coat','jacket','dress',
  'pocket','button','zipper',
  'key','lock','light','lamp','mirror','towel','soap','toothbrush',
  'comb','blanket','pillow','curtain',
  'plan','project','meeting','report','document','contract','budget',
  'passport','visa','luggage','suitcase','backpack',
  'police','law','rule','government','president','minister','election',
  'bank','account','loan','interest','tax','insurance','investment',
  'church','mosque','temple','religion','god',
  'party','wedding','ceremony','celebration','vacation','trip','journey',
  'road','path','bridge','park','square','museum','library','theater',
  'hotel','hostel','motel',
  'sign','signal','entrance','exit','way','direction',
  'noise','sound','voice','silence',
  'chance','opportunity','success','failure','mistake','effort',
  'attention','experience','memory','dream','wish','goal',
  'opinion','choice','decision','permission','promise',
  'beginning','middle','end','top','bottom',
  'morning','afternoon','evening','night','midnight','noon',
  'breakfast','lunch','dinner','supper','snack','meal',
  'bill','check','tip','reservation',
  'sir','madam','mr','mrs','ms',
  'cent','dollar','euro','pound',

  // Pronouns / basics
  'i','me','my','mine','myself',
  'you','your','yours','yourself',
  'he','him','his','himself',
  'she','her','hers','herself',
  'it','its','itself',
  'we','us','our','ours','ourselves',
  'they','them','their','theirs','themselves',
  'this','that','these','those',
  'here','there','everywhere','somewhere','nowhere','anywhere',

  // Prepositions / conjunctions / adverbs
  'in','on','at','to','from','with','without','for','about','between',
  'under','over','above','below','behind','before','after','during',
  'through','into','out','up','down','off','away','back','around',
  'along','across','against','toward','towards','until','since',
  'because','so','but','and','or','if','then','than','also','too',
  'very','really','quite','just','only','even','still','already',
  'again','maybe','perhaps','probably','definitely','certainly',
  'exactly','almost','nearly','completely','absolutely',
  'yes','no','not','ok','okay','well','right','sure','fine',
  'now','then','here','there','today','tonight','tomorrow','yesterday',
  'again','also','too','very','really','quite','just','only',
  'together','apart','alone','instead','anyway',

  // Additional high-frequency daily words
  'rent','electricity','wifi','address','floor','elevator','lift',
  'kitchen','bathroom','shower','toilet','bedroom','living',
  'breakfast','lunch','dinner','supper','midnight','noon',
  'traffic','accident','speed','fuel','gas','petrol','tire',
  'repair','mechanic','insurance',
  'weather','forecast','temperature','degree',
  'appointment','schedule','calendar','deadline','meeting',
  'birthday','wedding','funeral','holiday','vacation','weekend',
  'newspaper','magazine','article','blog','post',
  'battery','charger','plug','socket','switch',
  'envelope','stamp','package','parcel','box',
  'scissors','tape','glue','string','rope',
  'smile','laugh','cry','shout','whisper','scream',
  'neighbor','colleague','boss','employee','customer','client',
  'lesson','homework','exam','test','practice','exercise',
  'wrong','correct','mistake','error',
  'safe','dangerous','careful','careless',
  'polite','rude','kind','cruel','gentle','rough',
  'honest','dishonest','loyal','trust',
  'accept','refuse','reject','agree','disagree',
  'invite','cancel','postpone','delay','hurry','rush',
  'borrow','lend','owe','debt',
  'complain','apologize','forgive','blame','praise',
  'recommend','suggest','advise','warn',
  'guess','doubt','wonder','expect','suppose',
  'improve','develop','increase','decrease','reduce',
  'compare','describe','explain','mention','introduce',
  'celebrate','congratulate','surprise','impress',
  'relax','rest','enjoy','suffer','survive',
]);

// ─── Stop words ──────────────────────────────────────────────────────────────
const STOP_WORDS = new Set([
  'a','an','the','is','am','are','was','were','be','been','being',
  'do','does','did','has','have','had','having',
  'will','would','shall','should','can','could','may','might','must',
  'to','of','in','for','on','at','by','with','from','as',
  'and','but','or','not','no','nor','so','if','then','than',
  'that','this','these','those','it','its',
  'i','me','my','mine','we','us','our','ours',
  'you','your','yours','he','him','his','she','her','hers',
  'they','them','their','theirs',
  "don't","doesn't","didn't","won't","wouldn't","can't","couldn't",
  "shouldn't","isn't","aren't","wasn't","weren't","haven't","hasn't",
  "hadn't","i'm","i've","i'll","i'd","you're","you've","you'll","you'd",
  "he's","she's","it's","we're","we've","we'll","we'd",
  "they're","they've","they'll","they'd","that's","there's",
  "who's","what's","where's","when's","how's","let's",
]);

// ─── Impractical patterns ────────────────────────────────────────────────────

const IMPRACTICAL_ANIMAL_ACTIONS = /\b(peacock|snake|crow|parrot|frog|bat|python|bee|cuckoo|hawk|eagle|lion|tiger|elephant|monkey|camel|donkey|tortoise|hare|wolf|fox|deer|bear|whale|dolphin|penguin|owl|sparrow|pigeon|ant|spider|scorpion|lizard|crocodile|alligator|giraffe|zebra|rhino|hippopotamus|hippo|panther|leopard|cheetah|gorilla|orangutan)\b.*\b(dance|danc|crawl|caw|talk|croak|hang|swallow|hover|call|fly|roar|hunt|chase|pounce|slither|hiss|screech|howl|prowl|stalk|nest|migrate|hibernate|swim|dive|soar|glide|gallop|trot|bark|growl|purr|chirp|tweet|squawk|squeal|trumpet|bellow)\b/i;

const IMPRACTICAL_TRADES = /\b(potter|confectioner|blacksmith|cobbler|weaver|goldsmith|sculptor|carpenter|tanner|dyer|bangle[- ]?seller|washerman|ironsmith|tinsmith|coppersmith|glassblower|stonemason|wheelwright|fletcher|falconer|chandler|scribe|alchemist|apothecary|farrier|milliner|haberdasher|saddler)\b/i;

const IMPRACTICAL_SCIENCE = /\b(ampere|voltage|molecule|atom|fossil|chromosome|neutron|proton|electron|photosynthesis|evaporation|condensation|fertilizer|irrigation|megahertz|quantum|relativity|isotope|catalyst|enzyme|mitosis|osmosis|alloy|thermodynamics|electromagnet|semiconductor|superconductor|radioactive|spectrometer|microscope|telescope|nebula|constellation|asteroid|comet|meteor|gravitational|centripetal|kinetic|potential energy|refraction|diffraction|wavelength|frequency|amplitude)\b/i;

const IMPRACTICAL_PROVERBS = /\b(proverb|saying goes|as they say|wisdom says|old saying|adage|maxim|moral of|once upon a time|legend has it)\b/i;

const IMPRACTICAL_HISTORICAL = /\b(dynasty|emperor|empire|mughal|ashoka|kalinga|independence.1947|archaeological|excavation|manuscript|ancient.civilization|pharaoh|gladiator|medieval|feudal|crusade|colonialism|renaissance|reformation|inquisition|ottoman|byzantine|samurai|shogun|viking|aztec|inca|maya|mesopotamia|sumerian|babylonian|persian empire|roman empire|greek empire|mongol|genghis|conquistador|charlemagne)\b/i;

const IMPRACTICAL_CLASSICAL_ARTS = /\b(raga|raag|tarana|classical.singing|sitar|tabla|kathak|bharatanatyam|odissi|kuchipudi|mohiniyattam|manipuri|sattriya|carnatic|hindustani music|dhrupad|khayal|thumri|ghazal|qawwali|veena|sarangi|shehnai|santoor|harmonium recital)\b/i;

const IMPRACTICAL_NICHE = /\b(alchemy|astrology|horoscope|zodiac|palmistry|numerology|feng shui|acupuncture meridian|chakra alignment|crystal healing|tarot|divination|séance|ouija|oracle bone|heraldry|calligraphy brush|origami crane|bonsai pruning|falconry|jousting|archery tournament|polo match|dressage|regatta|fencing bout)\b/i;

function isImpractical(english) {
  return IMPRACTICAL_ANIMAL_ACTIONS.test(english)
    || IMPRACTICAL_TRADES.test(english)
    || IMPRACTICAL_SCIENCE.test(english)
    || IMPRACTICAL_PROVERBS.test(english)
    || IMPRACTICAL_HISTORICAL.test(english)
    || IMPRACTICAL_CLASSICAL_ARTS.test(english)
    || IMPRACTICAL_NICHE.test(english);
}

// ─── Tokenizer / scorer ─────────────────────────────────────────────────────

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/['']/g, "'")
    .replace(/[^a-z0-9' -]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 0);
}

function assignPriority(card) {
  const english = card.english || '';

  // Check impractical patterns first
  if (isImpractical(english)) return 3;

  const tokens = tokenize(english);
  const contentWords = tokens.filter(w => !STOP_WORDS.has(w));

  if (contentWords.length === 0) {
    // All stop words – likely very short practical phrase
    return tokens.length <= 5 ? 1 : 2;
  }

  const practicalCount = contentWords.filter(w => PRACTICAL_WORDS.has(w)).length;
  const ratio = practicalCount / contentWords.length;

  // Very short sentences (<=3 words total) with any practical word → P1
  if (tokens.length <= 3 && practicalCount > 0) return 1;

  // Short sentences (4-5 words) need decent ratio
  if (tokens.length <= 5 && ratio >= 0.5) return 1;

  // Longer sentences need slightly higher practical density
  if (tokens.length >= 10) {
    if (ratio >= 0.82) return 1;
    if (ratio >= 0.45) return 2;
    return 3;
  }

  if (ratio >= 0.78) return 1;
  if (ratio >= 0.42) return 2;
  return 3;
}

// ─── Main ────────────────────────────────────────────────────────────────────

function processLanguage(lang) {
  const deckPath = path.join(BASE, lang, 'deck.json');
  const deck = JSON.parse(fs.readFileSync(deckPath, 'utf8'));

  const counts = { 1: 0, 2: 0, 3: 0 };
  const examples = { 1: [], 2: [], 3: [] };

  for (const card of deck) {
    const p = assignPriority(card);
    card.priority = p;
    counts[p]++;
    if (examples[p].length < 5) {
      examples[p].push(card.english);
    }
  }

  fs.writeFileSync(deckPath, JSON.stringify(deck, null, 2) + '\n', 'utf8');

  const total = deck.length;
  console.log(`\n=== ${lang.toUpperCase()} (${total} cards) ===`);
  for (const p of [1, 2, 3]) {
    const pct = ((counts[p] / total) * 100).toFixed(1);
    console.log(`  P${p}: ${counts[p]} (${pct}%)`);
  }
  console.log(`  --- P1 examples ---`);
  examples[1].forEach(e => console.log(`    "${e}"`));
  console.log(`  --- P3 examples ---`);
  examples[3].forEach(e => console.log(`    "${e}"`));

  return { lang, total, counts };
}

console.log('Assigning priorities to all language decks...\n');
const results = [];
for (const lang of LANGUAGES) {
  results.push(processLanguage(lang));
}

console.log('\n\n=== SUMMARY ===');
console.log('Language     | Total |   P1   |   P2   |   P3');
console.log('-------------|-------|--------|--------|--------');
for (const r of results) {
  const p1pct = ((r.counts[1] / r.total) * 100).toFixed(1).padStart(5);
  const p2pct = ((r.counts[2] / r.total) * 100).toFixed(1).padStart(5);
  const p3pct = ((r.counts[3] / r.total) * 100).toFixed(1).padStart(5);
  console.log(
    `${r.lang.padEnd(13)}| ${String(r.total).padStart(5)} | ${String(r.counts[1]).padStart(4)} ${p1pct}% | ${String(r.counts[2]).padStart(4)} ${p2pct}% | ${String(r.counts[3]).padStart(4)} ${p3pct}%`
  );
}
console.log('\nDone!');
