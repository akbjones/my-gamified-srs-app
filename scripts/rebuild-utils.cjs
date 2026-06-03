#!/usr/bin/env node
/**
 * Shared utilities for dictionary rebuild scripts.
 * Fixes three pipeline bugs:
 * 1. Truncated Google responses → detect and re-request individually
 * 2. French apostrophe tokenisation → split properly
 * 3. POS detection from English output (already in post-process-google.cjs)
 */

const https = require('https');
const API_KEY = 'AIzaSyBImkCNYcI1m9mloUNcYcDN2L5dQZwADzI';

// Common English words – if Google returns something NOT in this set
// and it's short (<6 chars), it might be truncated
const REAL_ENGLISH_WORDS = new Set([
  // 2-letter
  'ad','am','an','as','at','ax','be','by','do','go','ha','he','hi','if','in',
  'is','it','me','my','no','of','oh','ok','on','or','ox','so','to','up','us','we',
  // 3-letter common
  'ace','act','add','age','ago','aid','aim','air','ale','all','and','ant','any','ape',
  'apt','arc','are','ark','arm','art','ash','ask','ate','awe','axe','bad','bag','ban',
  'bar','bat','bay','bed','bee','bet','bid','big','bin','bit','boa','bob','bog','bow',
  'box','boy','bud','bug','bum','bun','bus','but','buy','cab','cam','can','cap','car',
  'cat','cop','cow','cry','cub','cud','cue','cup','cur','cut','dab','dad','dam','day',
  'den','dew','did','die','dig','dim','dip','dog','dot','dry','dub','dud','due','dug',
  'dun','duo','dye','ear','eat','eel','egg','ego','elm','emu','end','era','eve','ewe',
  'eye','fad','fan','far','fat','fax','fed','fee','few','fig','fin','fir','fit','fix',
  'flu','fly','foe','fog','for','fox','fry','fun','fur','gag','gal','gap','gas','gel',
  'gem','get','gig','gin','gnu','god','got','gum','gun','gut','guy','gym','had','hag',
  'ham','has','hat','hay','hem','hen','her','hew','hex','hid','him','hip','his','hit',
  'hob','hod','hoe','hog','hop','hot','how','hub','hue','hug','hum','hut','ice','icy',
  'ill','imp','ink','inn','ion','ire','irk','its','ivy','jab','jag','jam','jar','jaw',
  'jay','jet','jig','job','jog','jot','joy','jug','jut','keg','ken','key','kid','kin',
  'kit','lab','lad','lag','lap','law','lax','lay','lea','led','leg','let','lid','lie',
  'lip','lit','log','lot','low','lug','mad','man','map','mar','mat','maw','may','men',
  'met','mew','mid','mix','mob','mod','mop','mow','mud','mug','mum','nab','nag','nap',
  'nay','net','new','nil','nit','nod','nor','not','now','nub','nun','nut','oak','oaf',
  'oar','oat','odd','ode','off','oft','ohm','oil','old','one','opt','orb','ore','our',
  'out','owe','owl','own','pad','pal','pan','pap','par','pat','paw','pay','pea','peg',
  'pen','pep','per','pet','pew','pie','pig','pin','pit','ply','pod','pop','pot','pow',
  'pro','pry','pub','pug','pun','pup','pus','put','rag','ram','ran','rap','rat','raw',
  'ray','red','ref','rib','rid','rig','rim','rip','rob','rod','roe','rot','row','rub',
  'rug','rum','run','rut','rye','sac','sad','sag','sap','sat','saw','say','sea','see',
  'set','sew','she','shy','sin','sip','sir','sis','sit','six','ski','sky','sly','sob',
  'sod','son','sop','sot','sow','spa','spy','sty','sub','sue','sum','sun','sup','tab',
  'tad','tag','tan','tap','tar','tat','tax','tea','ten','the','thy','tie','tin','tip',
  'toe','ton','too','top','tot','tow','toy','try','tub','tug','tun','two','urn','use',
  'van','vat','vet','vex','via','vie','vow','wad','wag','war','was','wax','way','web',
  'wed','wet','who','why','wig','win','wit','woe','wok','won','woo','wow','yak','yam',
  'yap','yaw','yea','yes','yet','yew','you','zap','zen','zip','zoo',
  // 4-5 letter common
  'able','also','area','army','away','back','ball','band','bank','barn','base','bath',
  'bear','beat','been','beer','bell','belt','bend','best','bill','bind','bird','bite',
  'blow','blue','boat','body','bold','bomb','bond','bone','book','boot','born','boss',
  'both','bowl','burn','busy','cake','call','calm','came','camp','card','care','cart',
  'case','cash','cast','cave','chat','chip','city','clap','clay','clip','club','clue',
  'coat','code','coin','cold','come','cook','cool','cope','copy','cord','core','corn',
  'cost','crop','cure','cute','damp','dare','dark','data','date','dawn','dead','deaf',
  'deal','dear','debt','deck','deed','deep','deer','desk','dial','diet','dirt','dish',
  'dock','does','done','doom','door','dose','down','drag','draw','drew','drop','drum',
  'dual','duck','dull','dumb','dump','dust','duty','each','earn','ease','east','easy',
  'edge','else','even','ever','evil','exam','exit','face','fact','fade','fail','fair',
  'fake','fall','fame','farm','fast','fate','fear','feat','feed','feel','feet','fell',
  'felt','file','fill','film','find','fine','fire','firm','fish','fist','five','flag',
  'flat','fled','flew','flip','flog','flow','folk','fond','food','fool','foot','ford',
  'fore','fork','form','fort','foul','four','free','from','frog','from','fuel','full',
  'fund','fury','fuse','gain','gale','game','gang','gate','gave','gaze','gear','gene',
  'gift','girl','glad','glow','glue','goat','goes','gold','golf','gone','good','grab',
  'gray','grew','grey','grid','grin','grip','grow','gulf','gust','guys','hack','hair',
  'hail','half','hall','halt','hang','harm','harp','hash','hate','haul','have','haze',
  'head','heal','heap','hear','heat','heel','help','herb','herd','here','hero','hide',
  'high','hike','hill','hint','hire','hold','hole','holy','home','hood','hook','hope',
  'horn','host','hour','huge','hung','hunt','hurt','hymn','icon','idea','inch','into',
  'iron','isle','item','jack','jail','jazz','jean','jest','jobs','join','joke','jump',
  'jury','just','keen','keep','kept','kick','kids','kill','kind','king','kiss','knee',
  'knew','knit','knob','knot','know','lace','lack','laid','lake','lamb','lame','lamp',
  'land','lane','laps','last','late','lawn','lead','leaf','lean','leap','left','lend',
  'lens','lent','less','liar','lick','life','lift','like','limb','lime','limp','line',
  'link','lion','lips','list','live','load','loaf','loan','lock','logo','long','look',
  'loop','lord','lose','loss','lost','loud','love','luck','lump','lung','lure','lurk',
  'made','mail','main','make','male','mall','malt','mane','many','mark','mask','mass',
  'mast','mate','maze','meal','mean','meat','meet','melt','memo','mend','menu','mere',
  'mesh','mess','mild','mile','milk','mill','mind','mine','mint','miss','mist','mock',
  'mode','mold','mood','moon','moor','more','moss','most','moth','move','much','mule',
  'muse','must','mute','myth','nail','name','navy','near','neat','neck','need','nest',
  'news','next','nice','nine','node','none','noon','norm','nose','note','noun','nude',
  'null','numb','oath','obey','odds','odor','okay','once','only','onto','open','oral',
  'ours','oust','oven','over','pace','pack','pact','page','paid','pail','pain','pair',
  'pale','palm','pane','park','part','pass','past','path','pave','peak','pear','peel',
  'peer','pick','pile','pine','pink','pipe','plan','play','plea','plot','ploy','plug',
  'plum','plus','poem','poet','pole','poll','polo','pond','pool','poor','pope','pork',
  'port','pose','post','pray','prey','pump','pure','push','quit','race','rack','rage',
  'raid','rail','rain','rank','rape','rare','rash','rate','read','real','reap','rear',
  'reef','reel','rely','rent','rest','rice','rich','ride','rift','ring','riot','rise',
  'risk','road','roam','roar','robe','rock','rode','role','roll','roof','room','root',
  'rope','rose','ruin','rule','rush','rust','sack','safe','sage','said','sail','sake',
  'sale','salt','same','sand','sane','sang','save','scam','scan','seal','seam','seat',
  'seed','seek','seem','seen','self','sell','send','sent','sewn','shed','ship','shoe',
  'shop','shot','show','shut','sick','side','sigh','sign','silk','sing','sink','site',
  'size','skip','slab','slam','slap','slay','slid','slim','slip','slot','slow','slug',
  'snap','snow','soak','soap','soar','sock','soft','soil','sold','sole','some','song',
  'soon','sort','soul','sour','spin','spit','spot','star','stay','stem','step','stew',
  'stir','stop','stow','stub','such','suck','suit','sulk','sure','surf','swap','swim',
  'tail','take','tale','talk','tall','tame','tank','tape','task','team','tear','tell',
  'tend','tent','term','test','text','than','that','them','then','they','thin','this',
  'tidy','tied','tier','tile','till','time','tiny','tire','toad','toil','told','toll',
  'tomb','tone','took','tool','tops','tore','torn','tour','town','tram','trap','tray',
  'tree','trek','trim','trio','trip','trod','trot','true','tube','tuck','tuft','tune',
  'turn','twin','type','tyre','ugly','undo','unit','upon','urge','used','user','vain',
  'vale','vane','vary','vase','vast','veil','vein','vent','verb','very','vest','view',
  'vine','void','volt','vote','wade','wage','wait','wake','walk','wall','wand','want',
  'ward','warm','warn','warp','wary','wash','wasp','wave','wavy','waxy','weak','wear',
  'weed','week','weep','weld','well','went','were','west','what','when','whim','whip',
  'whom','wick','wide','wife','wild','will','wilt','wily','wind','wine','wing','wink',
  'wipe','wire','wise','wish','with','woke','wolf','wood','wool','word','wore','work',
  'worm','worn','wove','wrap','yawn','year','yell','yoga','yoke','your','zeal','zero',
  'zone',
  // 5+ common
  'about','above','abuse','admit','adopt','adult','after','again','agent','agree',
  'ahead','alarm','album','alien','align','alive','allow','alone','along','alter',
  'amaze','among','anger','angle','apart','apple','apply','arena','argue','arise',
  'aside','asset','avoid','awake','award','aware','badly','basic','beach','begin',
  'being','below','bench','birth','black','blade','blame','blank','blast','blaze',
  'bleed','blend','bless','blind','block','blood','blown','board','bonus','boost',
  'bound','brain','brand','brave','bread','break','breed','brick','bride','brief',
  'bring','broad','brown','brush','buddy','build','bunch','burst','buyer','cabin',
  'cable','candy','carry','catch','cause','chain','chair','chalk','chaos','charm',
  'chase','cheap','cheat','check','cheek','cheer','chess','chest','chief','child',
  'chill','china','choir','civil','claim','class','clean','clear','clerk','click',
  'cliff','climb','clock','clone','close','cloth','cloud','coach','coast','color',
  'count','court','cover','crack','craft','crash','crazy','cream','crime','cross',
  'crowd','crown','cruel','crush','curve','cycle','daily','dance','death','debug',
  'decay','delay','dense','depth','devil','dirty','donor','doubt','draft','drain',
  'drama','drank','drawn','dream','dress','dried','drift','drill','drink','drive',
  'drown','drunk','dying','eager','earth','eight','elect','elite','email','empty',
  'enemy','enjoy','enter','equal','error','essay','event','every','exact','exert',
  'exist','extra','faint','fairy','faith','false','fancy','fatal','fault','feast',
  'fence','fetch','fever','fewer','fiber','field','fifth','fifty','fight','final',
  'first','fixed','flame','flash','flesh','flies','float','flood','floor','flour',
  'fluid','focus','force','forth','forum','found','frame','fraud','fresh','front',
  'fruit','fully','funny','giant','given','glass','globe','glory','goose','grace',
  'grade','grain','grand','grant','graph','grasp','grass','grave','great','green',
  'greet','grief','grill','grind','groan','gross','group','grown','guard','guess',
  'guest','guide','guilt','taste','teach','teeth','theme','thick','thing','think',
  'third','those','three','throw','tight','tired','today','total','touch','tough',
  'tower','track','trade','trail','train','trait','treat','trend','trial','tribe',
  'trick','tried','troop','truck','truly','trunk','trust','truth','twice','twist',
  'uncle','under','union','unite','unity','until','upper','upset','urban','usual',
  'valid','value','video','virus','visit','vital','voice','waste','watch','water',
  'weave','weigh','wheel','where','which','while','white','whole','whose','woman',
  'women','world','worry','worse','worst','worth','would','wound','write','wrong',
  'wrote','yield','young','youth',
  'accept','access','across','action','active','actual','afford','afraid','agency',
  'amount','annual','answer','anyone','anyway','appeal','appear','around','arrive',
  'assume','attack','attend','author','barely','battle','beauty','before','behind',
  'belong','beside','beyond','bitter','border','bother','bottom','branch','breath',
  'bridge','bright','broken','budget','burden','button','cancel','carbon','career',
  'castle','chance','change','charge','choice','choose','church','circle','combat',
  'common','comply','copper','corner','cotton','couple','course','cousin','create',
  'credit','crisis','custom','damage','danger','deadly','debate','decade','decide',
  'defeat','defend','define','degree','demand','depart','depend','depict','deploy',
  'deputy','desert','design','desire','detail','detect','device','devote','differ',
  'dinner','direct','divide','domain','double','dozens','dragon','drawer',
  'effort','emerge','empire','employ','enable','endure','energy','engage','engine',
  'enough','ensure','entire','entity','escape','estate','ethnic','evolve','exceed',
  'except','excuse','expand','expect','expert','export','extend','extent','fabric',
  'factor','fairly','family','famous','farmer','father','fathom','fellow','female',
  'figure','finger','flight','follow','forbid','forest','forget','formal','former',
  'fossil','foster','fourth','freeze','friend','frozen','future','gained','garage',
  'garden','gather','gender','gentle','global','golden','govern','ground','growth',
  'handle','happen','hardly','health','heaven','height','hidden','highly','honest',
  'horror','hunger','hunter','ignore','impose','income','indeed','indoor','inform',
  'injury','insect','inside','insist','intact','intend','invest','island','itself',
  'jacket','junior','kidney','knight','launch','lawyer','layout','leader','league',
  'legend','length','lesson','letter','likely','listen','little','lively','locate',
  'lonely','lovely','mainly','manage','manner','margin','marine','market','master',
  'matter','medium','member','memory','mental','merely','method','middle','minute',
  'mirror','mobile','modern','modest','moment','monkey','mostly','mother','motion',
  'murder','muscle','museum','mutual','myself','narrow','nation','nature','nearby',
  'nearly','neatly','needle','nobody','normal','notice','notion','number','obtain',
  'occupy','offend','office','online','oppose','option','orange','origin','others',
  'output','oxford','oxygen','palace','parent','partly','patron','people','period',
  'permit','person','pillar','planet','player','please','plenty','pocket','poetry',
  'poison','police','policy','polish','poorly','portal','potato','powder','prayer',
  'prefer','pretty','prince','prison','profit','prompt','proper','proven','public',
  'pursue','racial','random','rarely','rather','rating','reader','really','reason',
  'recall','recent','record','reduce','reform','refuse','region','regret','reject',
  'relate','relief','remain','remote','remove','repair','repeat','report','rescue',
  'resign','resist','resort','result','retail','retain','retire','return','reveal',
  'review','reward','rhythm','rising','ritual','robust','rocket','rubber','rugged',
  'sacred','safely','salary','sample','school','screen','search','season','second',
  'secret','secure','select','seller','senate','senior','series','server','settle',
  'severe','shadow','shield','silver','simple','simply','single','sister','slight',
  'smooth','social','solely','source','speech','spirit','spread','spring','square',
  'stable','stream','street','stress','strict','strike','string','strong','studio',
  'submit','sudden','suffer','summer','summit','supply','surely','survey','switch',
  'symbol','target','temple','tender','thanks','thirty','threat','tissue','tongue',
  'toward','tragic','travel','treaty','tribal','twenty','unique','unlike','update',
  'useful','vacant','valley','varied','vessel','victim','viewer','violet','virtue',
  'vision','visual','volume','warmth','wealth','weapon','weekly','weight','wholly',
  'widely','window','winner','winter','wisdom','within','wonder','worker','worthy',
  'yellow',
  // Common adjectives not covered above  
  'succeed','succeed','success','miss','missing','pass','passage',
]);

/**
 * Check if a Google translation looks truncated.
 * Returns true if it looks like an incomplete English word.
 */
function looksLikeTruncation(text) {
  const clean = text.replace(/^to\s+/, '').trim().toLowerCase();
  if (clean.length < 2) return true;
  if (REAL_ENGLISH_WORDS.has(clean)) return false; // It's a real word
  if (clean.length >= 5) return false; // 5+ chars is likely a real word even if not in our list
  // If it's 2-4 chars and NOT in our comprehensive short-word list, it's likely truncated
  // (We have ~2000 common 2-4 letter English words in the list)
  return true;
}

/**
 * Translate a batch of words via Google Translate API.
 * Automatically retries truncated results individually.
 */
async function translateBatch(words, sourceLang, batchSize = 80) {
  const results = {};
  
  for (let i = 0; i < words.length; i += batchSize) {
    const batch = words.slice(i, i + batchSize);
    const params = batch.map(w => 'q=' + encodeURIComponent(w)).join('&');
    const url = `https://translation.googleapis.com/language/translate/v2?key=${API_KEY}&source=${sourceLang}&target=en&${params}`;
    
    const translations = await new Promise((resolve, reject) => {
      https.get(url, (res) => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data).data.translations.map(t => 
              t.translatedText.replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/&quot;/g, '"')
            ));
          } catch(e) { reject(e); }
        });
      }).on('error', reject);
    });
    
    // Check for truncations and re-request individually
    const retries = [];
    batch.forEach((word, j) => {
      const trans = translations[j];
      if (looksLikeTruncation(trans)) {
        retries.push({ word, index: j });
      } else {
        results[word] = trans;
      }
    });
    
    // Retry truncated words one at a time
    for (const { word } of retries) {
      const singleUrl = `https://translation.googleapis.com/language/translate/v2?key=${API_KEY}&source=${sourceLang}&target=en&q=${encodeURIComponent(word)}`;
      const singleTrans = await new Promise((resolve) => {
        https.get(singleUrl, (res) => {
          let data = '';
          res.on('data', c => data += c);
          res.on('end', () => {
            try {
              resolve(JSON.parse(data).data.translations[0].translatedText.replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/&quot;/g, '"'));
            } catch(e) { resolve('?'); }
          });
        }).on('error', () => resolve('?'));
      });
      results[word] = singleTrans;
      await sleep(100);
    }
    
    if (retries.length > 0) {
      console.log(`  Batch ${Math.floor(i/batchSize)}: retried ${retries.length} truncated words`);
    }
    
    await sleep(200);
  }
  
  return results;
}

/**
 * Tokenize a sentence, handling French/Italian apostrophe contractions properly.
 * "l'attention" → ["l'", "attention"] not ["lattention"]
 * "j'ai" → ["j'", "ai"]
 * "s'améliore" → ["s'", "améliore"]
 */
function tokenize(sentence, language) {
  // Strip punctuation except apostrophes
  let text = sentence.replace(/[।?,!.;:""«»()\-]/g, ' ');
  
  if (['french', 'italian'].includes(language)) {
    // Split on spaces first
    const rawTokens = text.split(/\s+/).filter(Boolean);
    const tokens = [];
    for (const token of rawTokens) {
      // Check for apostrophe contraction: l'eau, j'ai, s'il, d'accord, n'est, qu'il
      const apoMatch = token.match(/^([a-zA-ZÀ-ÿ]{1,3})'([a-zA-ZÀ-ÿ]+)$/);
      if (apoMatch) {
        // Don't add the prefix (l', j', s', etc.) as a dictionary entry
        // Just add the main word after the apostrophe
        tokens.push(apoMatch[2]);
      } else {
        tokens.push(token);
      }
    }
    return tokens;
  }
  
  // Default: split on whitespace
  return text.split(/\s+/).filter(Boolean);
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

/**
 * Translate full sentences via Google Translate API.
 * Returns a map of sentence → English translation.
 * Batches sentences to stay within API limits.
 */
async function translateSentences(sentences, sourceLang, batchSize = 50) {
  const results = {};

  for (let i = 0; i < sentences.length; i += batchSize) {
    const batch = sentences.slice(i, i + batchSize);
    const params = batch.map(s => 'q=' + encodeURIComponent(s)).join('&');
    const url = `https://translation.googleapis.com/language/translate/v2?key=${API_KEY}&source=${sourceLang}&target=en&${params}`;

    const translations = await new Promise((resolve, reject) => {
      https.get(url, (res) => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data).data.translations.map(t =>
              t.translatedText
                .replace(/&#39;/g, "'")
                .replace(/&amp;/g, '&')
                .replace(/&quot;/g, '"')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
            ));
          } catch(e) { reject(e); }
        });
      }).on('error', reject);
    });

    batch.forEach((sentence, j) => {
      results[sentence] = translations[j];
    });

    if (i % (batchSize * 10) === 0 && i > 0) {
      console.log(`  Translated ${i}/${sentences.length} sentences...`);
    }

    await sleep(200);
  }

  return results;
}

/**
 * For a source word with an individual translation, validate against
 * sentence translations and card English. Returns the best definition,
 * potentially with multiple senses.
 *
 * @param {string} word - source language word
 * @param {string} individualTranslation - Google's word-level translation
 * @param {Array<{cardEnglish: string, sentenceTranslation: string}>} contexts
 *   - all cards containing this word, with their English and Google sentence translation
 * @returns {string} best definition, possibly multi-sense ("morning; tomorrow")
 */
function validateAndEnrich(word, individualTranslation, contexts) {
  if (!contexts || contexts.length === 0) return individualTranslation;

  const indivLower = individualTranslation.toLowerCase().replace(/^to /, '');
  const indivWords = indivLower.split(/[\s,;\/]+/).filter(w => w.length > 2);

  // Check: does the individual translation appear in any card's English or sentence translation?
  let indivMatchCount = 0;
  const alternativeSenses = new Map(); // sense → count

  for (const { cardEnglish, sentenceTranslation } of contexts) {
    const cardLower = cardEnglish.toLowerCase();
    const sentLower = (sentenceTranslation || '').toLowerCase();

    // Does individual translation match?
    const indivMatches = indivWords.some(w => cardLower.includes(w) || sentLower.includes(w));
    if (indivMatches) indivMatchCount++;

    // Find words in card/sentence English that could be alternative senses
    // (words not in the individual translation)
    const cardWords = cardLower.split(/\s+/).filter(w => w.length > 2);
    const sentWords = sentLower.split(/\s+/).filter(w => w.length > 2);
    const allContextWords = [...new Set([...cardWords, ...sentWords])];

    // Common English stop words to skip
    const STOP = new Set(['the','and','but','for','are','was','were','been','being','has','had','have',
      'does','did','not','you','she','his','her','its','our','they','them','will','would','could',
      'should','shall','can','may','might','must','that','this','with','from','into','than','then',
      'very','just','also','more','most','some','each','both','such','when','where','what','which',
      'who','how','why','there','here','about','after','before','between','through','during','without']);

    for (const w of allContextWords) {
      if (STOP.has(w)) continue;
      if (indivWords.includes(w)) continue; // already in individual translation
      // This is a potential alternative sense – but only if it's not just a common word
      // We'll collect all and pick the most frequent
      alternativeSenses.set(w, (alternativeSenses.get(w) || 0) + 1);
    }
  }

  // Count how many contexts DON'T match the individual translation
  const mismatchCount = contexts.length - indivMatchCount;

  // If individual matches ALL contexts, it's definitely right
  if (indivMatchCount === contexts.length) return individualTranslation;

  // Find the most common alternative sense from mismatched contexts only
  const mismatchAlternatives = new Map();
  for (const { cardEnglish, sentenceTranslation } of contexts) {
    const cardLower = cardEnglish.toLowerCase();
    const sentLower = (sentenceTranslation || '').toLowerCase();

    // Skip contexts where individual translation already matches
    const indivMatches = indivWords.some(w => cardLower.includes(w) || sentLower.includes(w));
    if (indivMatches) continue;

    // For mismatched contexts, collect content words from card English
    const STOP = new Set(['the','and','but','for','are','was','were','been','being','has','had','have',
      'does','did','not','you','she','his','her','its','our','they','them','will','would','could',
      'should','shall','can','may','might','must','that','this','with','from','into','than','then',
      'very','just','also','more','most','some','each','both','such','when','where','what','which',
      'who','how','why','there','here','about','after','before','between','through','during','without',
      'every','still','only','much','many','well','like','make','made','take','took','come','came',
      'give','gave','know','knew','think','want','need','feel','seem','look','find','found','keep',
      'tell','told','said','say','see','saw','get','got','going','been','being','your','their',
      'other','even','back','down','over','under','around','while']);

    const cardWords = cardLower.split(/[\s.,!?;:]+/).filter(w => w.length > 2 && !STOP.has(w));
    for (const w of cardWords) {
      mismatchAlternatives.set(w, (mismatchAlternatives.get(w) || 0) + 1);
    }
  }

  // Pick the best alternative
  const sorted = [...mismatchAlternatives.entries()].sort((a, b) => b[1] - a[1]);

  if (sorted.length > 0 && sorted[0][1] >= 1) {
    const bestAlt = sorted[0][0];
    // Return both senses
    if (indivMatchCount > 0) {
      // Individual is right sometimes, alternative is right other times → show both
      return bestAlt + '; ' + individualTranslation.toLowerCase().replace(/^to /, '');
    } else {
      // Individual NEVER matches → use alternative as primary, individual as secondary
      return bestAlt + '; ' + individualTranslation.toLowerCase().replace(/^to /, '');
    }
  }

  return individualTranslation;
}

module.exports = { translateBatch, translateSentences, tokenize, validateAndEnrich, looksLikeTruncation, REAL_ENGLISH_WORDS };
