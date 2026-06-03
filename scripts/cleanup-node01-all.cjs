#!/usr/bin/env node
/**
 * cleanup-node01-all.cjs
 * Move non-beginner cards out of node-01 for all languages (except Hindi, already done).
 *
 * Logic: tokenize the English sentence, count "rare" words (not in a ~2500-word basic list).
 * If 3+ rare words → flag for move to node-15.
 * Smart filtering: proper nouns, common verb forms, food words, family words etc. are NOT rare.
 */

const fs = require('fs');
const path = require('path');

// ─── Basic vocabulary: ~2000+ most common English words plus beginner-friendly content ───
const BASIC_WORDS = new Set([
  // Determiners, pronouns, prepositions, conjunctions, etc.
  'a','an','the','this','that','these','those','my','your','his','her','its','our','their',
  'i','me','we','us','you','he','him','she','it','they','them','myself','yourself','himself',
  'herself','itself','ourselves','themselves','who','whom','whose','which','what','where','when',
  'how','why','whoever','whatever','wherever','whenever',
  'and','or','but','so','because','if','although','though','while','when','after','before',
  'since','until','unless','whether','that','than','as',
  'in','on','at','to','for','with','from','by','about','of','up','down','into','out','over',
  'under','between','through','during','without','around','against','along','across','behind',
  'beside','besides','below','above','near','off','toward','towards','upon','within','among',
  'onto','throughout',

  // Common verbs (base forms)
  'be','am','is','are','was','were','been','being',
  'have','has','had','having',
  'do','does','did','done','doing',
  'will','would','shall','should','can','could','may','might','must',
  'go','goes','went','gone','going',
  'get','gets','got','gotten','getting',
  'make','makes','made','making',
  'come','comes','came','coming',
  'take','takes','took','taken','taking',
  'give','gives','gave','given','giving',
  'say','says','said','saying',
  'tell','tells','told','telling',
  'know','knows','knew','known','knowing',
  'think','thinks','thought','thinking',
  'see','sees','saw','seen','seeing',
  'look','looks','looked','looking',
  'find','finds','found','finding',
  'want','wants','wanted','wanting',
  'need','needs','needed','needing',
  'use','uses','used','using',
  'try','tries','tried','trying',
  'ask','asks','asked','asking',
  'work','works','worked','working',
  'call','calls','called','calling',
  'put','puts','putting',
  'keep','keeps','kept','keeping',
  'let','lets','letting',
  'begin','begins','began','begun','beginning',
  'start','starts','started','starting',
  'show','shows','showed','shown','showing',
  'hear','hears','heard','hearing',
  'play','plays','played','playing',
  'run','runs','ran','running',
  'move','moves','moved','moving',
  'live','lives','lived','living',
  'believe','believes','believed','believing',
  'bring','brings','brought','bringing',
  'happen','happens','happened','happening',
  'write','writes','wrote','written','writing',
  'sit','sits','sat','sitting',
  'stand','stands','stood','standing',
  'lose','loses','lost','losing',
  'pay','pays','paid','paying',
  'meet','meets','met','meeting',
  'include','includes','included','including',
  'continue','continues','continued','continuing',
  'set','sets','setting',
  'learn','learns','learned','learnt','learning',
  'change','changes','changed','changing',
  'lead','leads','led','leading',
  'understand','understands','understood','understanding',
  'watch','watches','watched','watching',
  'follow','follows','followed','following',
  'stop','stops','stopped','stopping',
  'speak','speaks','spoke','spoken','speaking',
  'read','reads','reading',
  'spend','spends','spent','spending',
  'grow','grows','grew','grown','growing',
  'open','opens','opened','opening',
  'walk','walks','walked','walking',
  'win','wins','won','winning',
  'teach','teaches','taught','teaching',
  'offer','offers','offered','offering',
  'remember','remembers','remembered','remembering',
  'love','loves','loved','loving',
  'consider','considers','considered','considering',
  'appear','appears','appeared','appearing',
  'buy','buys','bought','buying',
  'wait','waits','waited','waiting',
  'serve','serves','served','serving',
  'die','dies','died','dying',
  'send','sends','sent','sending',
  'expect','expects','expected','expecting',
  'build','builds','built','building',
  'stay','stays','stayed','staying',
  'fall','falls','fell','fallen','falling',
  'cut','cuts','cutting',
  'reach','reaches','reached','reaching',
  'kill','kills','killed','killing',
  'remain','remains','remained','remaining',
  'suggest','suggests','suggested','suggesting',
  'raise','raises','raised','raising',
  'pass','passes','passed','passing',
  'sell','sells','sold','selling',
  'require','requires','required','requiring',
  'report','reports','reported','reporting',
  'decide','decides','decided','deciding',
  'pull','pulls','pulled','pulling',
  'develop','develops','developed','developing',
  'eat','eats','ate','eaten','eating',
  'drink','drinks','drank','drunk','drinking',
  'sleep','sleeps','slept','sleeping',
  'wake','wakes','woke','woken','waking',
  'sing','sings','sang','sung','singing',
  'drive','drives','drove','driven','driving',
  'ride','rides','rode','ridden','riding',
  'fly','flies','flew','flown','flying',
  'swim','swims','swam','swum','swimming',
  'draw','draws','drew','drawn','drawing',
  'break','breaks','broke','broken','breaking',
  'wear','wears','wore','worn','wearing',
  'hold','holds','held','holding',
  'carry','carries','carried','carrying',
  'cook','cooks','cooked','cooking',
  'clean','cleans','cleaned','cleaning',
  'wash','washes','washed','washing',
  'help','helps','helped','helping',
  'feel','feels','felt','feeling',
  'leave','leaves','left','leaving',
  'turn','turns','turned','turning',
  'close','closes','closed','closing',
  'pick','picks','picked','picking',
  'finish','finishes','finished','finishing',
  'plan','plans','planned','planning',
  'prepare','prepares','prepared','preparing',
  'visit','visits','visited','visiting',
  'enjoy','enjoys','enjoyed','enjoying',
  'miss','misses','missed','missing',
  'like','likes','liked','liking',
  'hate','hates','hated','hating',
  'hope','hopes','hoped','hoping',
  'wish','wishes','wished','wishing',
  'prefer','prefers','preferred','preferring',
  'forget','forgets','forgot','forgotten','forgetting',
  'save','saves','saved','saving',
  'share','shares','shared','sharing',
  'check','checks','checked','checking',
  'fix','fixes','fixed','fixing',
  'choose','chooses','chose','chosen','choosing',
  'travel','travels','traveled','travelled','traveling','travelling',
  'arrive','arrives','arrived','arriving',
  'return','returns','returned','returning',
  'study','studies','studied','studying',
  'practice','practices','practiced','practicing','practise','practises','practised','practising',
  'paint','paints','painted','painting',
  'dance','dances','danced','dancing',
  'sing','sings','sang','sung','singing',
  'cry','cries','cried','crying',
  'smile','smiles','smiled','smiling',
  'laugh','laughs','laughed','laughing',
  'thank','thanks','thanked','thanking',
  'celebrate','celebrates','celebrated','celebrating',
  'order','orders','ordered','ordering',
  'bake','bakes','baked','baking',
  'taste','tastes','tasted','tasting',
  'smell','smells','smelled','smelling',
  'touch','touches','touched','touching',
  'grab','grabs','grabbed','grabbing',
  'hang','hangs','hung','hanging',
  'cost','costs','costing',
  'fit','fits','fitted','fitting',
  'rent','rents','rented','renting',
  'talk','talks','talked','talking',
  'rain','rains','rained','raining',
  'snow','snows','snowed','snowing',
  'shine','shines','shone','shining',
  'blow','blows','blew','blown','blowing',
  'add','adds','added','adding',
  'join','joins','joined','joining',
  'move','moves','moved','moving',
  'fill','fills','filled','filling',
  'cover','covers','covered','covering',
  'suppose','supposed',
  'train','trains','trained','training',
  'sign','signs','signed','signing',
  'cross','crosses','crossed','crossing',
  'park','parks','parked','parking',
  'charge','charges','charged','charging',
  'hurry','hurries','hurried','hurrying',
  'care','cares','cared','caring',
  'worry','worries','worried','worrying',
  'borrow','borrows','borrowed','borrowing',
  'lend','lends','lent','lending',
  'explain','explains','explained','explaining',
  'promise','promises','promised','promising',
  'invite','invites','invited','inviting',
  'accept','accepts','accepted','accepting',
  'refuse','refuses','refused','refusing',
  'allow','allows','allowed','allowing',
  'improve','improves','improved','improving',
  'happen','happens','happened','happening',
  'create','creates','created','creating',
  'earn','earns','earned','earning',
  'belong','belongs','belonged','belonging',
  'seem','seems','seemed','seeming',
  'matter','matters','mattered','mattering',
  'mean','means','meant','meaning',
  'fail','fails','failed','failing',
  'become','becomes','became','becoming',
  'guess','guesses','guessed','guessing',
  'realize','realizes','realized','realizing',
  'notice','notices','noticed','noticing',
  'organize','organizes','organized','organizing',
  'lock','locks','locked','locking',
  'lay','lays','laid','laying',
  'imagine','imagines','imagined','imagining',
  'ring','rings','rang','rung','ringing',
  'hide','hides','hid','hidden','hiding',
  'climb','climbs','climbed','climbing',
  'throw','throws','threw','thrown','throwing',
  'catch','catches','caught','catching',
  'tie','ties','tied','tying',
  'wake','wakes','woke','woken','waking',
  'switch','switches','switched','switching',
  'wrap','wraps','wrapped','wrapping',
  'pack','packs','packed','packing',
  'plant','plants','planted','planting',
  'water','waters','watered','watering',
  'feed','feeds','fed','feeding',
  'grow','grows','grew','grown','growing',
  'collect','collects','collected','collecting',
  'deliver','delivers','delivered','delivering',
  'donate','donates','donated','donating',
  'complain','complains','complained','complaining',
  'apologize','apologizes','apologized','apologizing',

  // Common nouns
  'people','person','man','men','woman','women','child','children','boy','girl','baby',
  'family','father','mother','dad','mom','mum','parent','parents','son','daughter',
  'brother','sister','husband','wife','grandmother','grandfather','grandma','grandpa',
  'grandparent','grandparents','uncle','aunt','cousin','nephew','niece','neighbor','neighbours',
  'friend','friends',
  'teacher','student','students','doctor','nurse','lawyer','engineer','artist','writer',
  'musician','singer','actor','actress','driver','worker','farmer','chef','boss','manager',
  'officer','professor','scientist','pilot',
  'house','home','room','kitchen','bedroom','bathroom','garden','door','window','floor',
  'wall','roof','stairs','apartment','building','office','store','shop','market',
  'school','university','college','library','hospital','church','bank','hotel','restaurant',
  'cafe','station','airport','park','museum','theater','theatre','cinema','gym','pool',
  'city','town','village','country','street','road','bridge','corner','block',
  'car','bus','train','plane','taxi','bicycle','bike','boat','ship',
  'food','meal','breakfast','lunch','dinner','snack',
  'water','tea','coffee','milk','juice','beer','wine','soda',
  'bread','rice','meat','fish','chicken','egg','eggs','cheese','butter','sugar','salt',
  'pepper','oil','flour','soup','salad','sandwich','pizza','pasta','cake','pie',
  'chocolate','ice','cream','cookie','cookies','fruit','apple','banana','orange','lemon',
  'tomato','potato','onion','garlic','carrot','lettuce','mushroom','bean','beans',
  'vegetable','vegetables',
  'morning','afternoon','evening','night','midnight','noon','dawn','sunset',
  'day','days','week','weeks','month','months','year','years','today','tomorrow','yesterday',
  'monday','tuesday','wednesday','thursday','friday','saturday','sunday',
  'january','february','march','april','june','july','august','september','october','november','december',
  'spring','summer','autumn','fall','winter',
  'time','minute','minutes','hour','hours','second','seconds','moment','clock','watch',
  'weather','rain','snow','sun','wind','cloud','clouds','storm','fog',
  'name','age','birthday','holiday','vacation','weekend','party','wedding','festival',
  'number','letter','word','sentence','question','answer','problem','idea','story','news',
  'book','page','paper','pen','pencil','note','list','map','picture','photo','photograph',
  'music','song','movie','film','game','sport','team',
  'phone','computer','internet','email','message','call',
  'money','price','dollar','euro','pound','cent','bill','coin','cash','card','account',
  'job','work','career','business','company','project','meeting',
  'head','face','eye','eyes','ear','ears','nose','mouth','tooth','teeth','hair','neck',
  'hand','hands','arm','arms','finger','fingers','leg','legs','foot','feet','knee','back',
  'heart','blood','bone','skin','body',
  'dog','cat','bird','horse','cow','pig','sheep','rabbit','mouse','fish',
  'tree','flower','plant','leaf','leaves','grass','forest','river','lake','sea','ocean',
  'mountain','hill','beach','island','field','land',
  'air','fire','earth','ground','sky','star','stars','moon','world',
  'color','colour','red','blue','green','yellow','black','white','brown','pink','purple',
  'orange','gray','grey','dark','light',
  'thing','things','place','way','part','kind','type','sort','side','end','point',
  'fact','reason','case','example','group','lot','bit','pair','piece','set',
  'door','key','table','chair','bed','desk','shelf','lamp','mirror','couch','sofa',
  'plate','cup','glass','bowl','bottle','fork','knife','spoon','pot','pan',
  'towel','soap','bag','box','basket','umbrella',
  'shirt','dress','coat','jacket','hat','shoe','shoes','sock','socks','pants','jeans',
  'skirt','sweater','scarf','gloves','suit','tie','belt','pocket',
  'class','lesson','test','exam','grade','homework','subject','math','science','history',
  'language','english','art','course',
  'life','death','health','pain','sleep','dream','rest',
  'love','peace','fun','luck','surprise','gift','present',
  'noise','sound','voice','silence',
  'right','left','top','bottom','front','middle','center','centre','edge',
  'north','south','east','west',
  'space','area','size','shape','circle','line','step','steps',
  'plan','rule','law','power','energy','force',

  // Common adjectives
  'good','better','best','bad','worse','worst','great','big','small','little','large',
  'long','short','tall','high','low','wide','narrow','deep','thick','thin',
  'old','new','young','modern','ancient','recent',
  'fast','slow','quick','early','late',
  'hot','cold','warm','cool','fresh','dry','wet',
  'hard','soft','easy','difficult','simple','heavy','light',
  'beautiful','pretty','handsome','ugly','cute','lovely','wonderful','amazing','incredible',
  'nice','fine','great','perfect','excellent','terrible','awful','horrible',
  'happy','sad','angry','tired','sick','ill','healthy','well','alive','dead',
  'hungry','thirsty','full','empty','clean','dirty','neat','messy',
  'busy','free','ready','comfortable','safe','dangerous','quiet','loud','noisy',
  'rich','poor','cheap','expensive','valuable',
  'important','special','favorite','favourite','popular','famous','common','normal','usual',
  'different','same','similar','other','another','extra','various',
  'true','false','real','fake','wrong','correct','right',
  'sure','certain','possible','impossible','necessary','available',
  'open','closed','public','private','local','foreign','international',
  'main','basic','general','specific','entire','whole','complete','final','total',
  'next','last','first','second','third','only','own','single','double',
  'strong','weak','bright','dark','clear','sharp','flat','round','straight','smooth','rough',
  'sweet','sour','bitter','salty','spicy','delicious','tasty',
  'funny','serious','interesting','boring','exciting','strange','weird','crazy',
  'kind','polite','rude','gentle','friendly','helpful','patient','careful','careless',
  'proud','brave','scared','afraid','nervous','confident','shy','calm','relaxed',
  'traditional','cultural','natural','organic','environmental','medical',
  'married','single','pregnant',
  'entire','separate','particular','obvious','original',

  // Common adverbs
  'very','really','quite','pretty','rather','too','so','enough','almost','already',
  'just','still','even','ever','never','always','usually','often','sometimes','rarely',
  'again','also','together','alone','away','back','here','there','everywhere','nowhere',
  'now','then','soon','later','ago','recently','finally','suddenly','slowly','quickly',
  'well','badly','easily','hard','fast','carefully','exactly','probably','maybe','perhaps',
  'especially','actually','definitely','certainly','obviously','apparently','honestly',
  'today','tonight','tomorrow','yesterday','daily','weekly','monthly','yearly',
  'outside','inside','upstairs','downstairs','nearby','far','close',
  'much','many','more','most','less','least','few','several','some','any','all','both',
  'each','every','no','none','either','neither','another','other','others',

  // Numbers
  'one','two','three','four','five','six','seven','eight','nine','ten',
  'eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen',
  'twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety','hundred','thousand','million',
  'half','quarter','dozen','twice','once',
  'first','second','third','fourth','fifth',

  // Common misc
  'yes','no','not','ok','okay','please','sorry','excuse','hello','hi','bye','goodbye',
  'thanks','welcome','congratulations',
  'mr','mrs','ms','sir','dear',
  'lot','lots','plenty','everything','everyone','everybody','everywhere','something','someone',
  'somebody','somewhere','anything','anyone','anybody','anywhere','nothing','nobody','nowhere',
  'own','self','stuff','ones',

  // Contractions & informal
  "don't","doesn't","didn't","won't","wouldn't","can't","couldn't","shouldn't","isn't","aren't",
  "wasn't","weren't","haven't","hasn't","hadn't","i'm","i've","i'll","i'd","you're","you've",
  "you'll","you'd","he's","she's","it's","we're","we've","we'll","we'd","they're","they've",
  "they'll","they'd","that's","there's","here's","what's","who's","let's","ain't",
  "dont","doesnt","didnt","wont","wouldnt","cant","couldnt","shouldnt","isnt","arent",
  "wasnt","werent","havent","hasnt","hadnt","im","ive","ill","id","youre","youve",
  "youll","youd","hes","shes","its","were","weve","well","wed","theyre","theyve",
  "theyll","theyd","thats","theres","heres","whats","whos","lets",

  // More common words that appear in beginner sentences
  'information','experience','government','community','education','system','country','service',
  'program','development','research','percent','president','team','hand','eye',
  'head','right','left','top','bottom','side','place','case','point','fact',
  'number','part','group','problem','way','line','story','example','area','course',
  'game','result','change','need','end','point','turn','show','run',
  'yet','else','instead','however','therefore','anyway','otherwise','meanwhile',

  // Travel & daily life
  'ticket','seat','luggage','bag','suitcase','passport','visa','reservation','booking',
  'checkout','departure','arrival','delay','platform','gate','terminal','flight','trip',
  'journey','tour','guide','tourist','destination','route','direction','entrance','exit',
  'receipt','menu','bill','tip','waiter','waitress','bartender',
  'schedule','appointment','calendar',
  'traffic','accident','speed','lane','highway','parking',
  'elevator','lift','escalator','lobby','hall','hallway','corridor',
  'sign','signal','notice','warning',

  // Household & daily
  'laundry','dishes','trash','garbage','recycling','vacuum',
  'remote','battery','charger','cable','plug','socket','switch',
  'heater','fan','fridge','refrigerator','oven','stove','microwave','toaster',
  'blanket','pillow','sheet','curtain','carpet','rug',
  'grocery','groceries','ingredient','ingredients','recipe',
  'medicine','pill','prescription',

  // Nature & weather
  'temperature','degree','degrees','forecast','climate','season',
  'wave','sand','rock','stone','dirt','mud','dust','ice',
  'sunrise','daylight','shade','shadow',
  'animal','animals','insect','butterfly','bee',

  // Body & health
  'stomach','shoulder','elbow','wrist','ankle','chest','lung','brain','muscle',
  'fever','cold','cough','allergy','headache','injury','wound',
  'exercise','diet','weight',

  // Emotions & personality
  'feeling','feelings','emotion','mood','attitude','personality',
  'joy','happiness','sadness','anger','fear','worry','stress','anxiety',
  'excitement','disappointment','frustration','confusion','doubt',
  'hope','faith','trust','respect','honor','honour',

  // Social
  'conversation','discussion','argument','debate','opinion','advice','suggestion',
  'agreement','permission','apology',
  'relationship','couple','date','partner',
  'guest','host','stranger','crowd','audience','public',

  // Education & work
  'degree','diploma','certificate','skill','experience','interview','salary','promotion',
  'task','goal','progress','success','effort','mistake','decision',

  // Abstract but common
  'chance','choice','difference','effect','opportunity','possibility','situation','condition',
  'attention','interest','purpose','benefit','advantage','method','approach','strategy',
  'tradition','culture','society','generation','population',
  'freedom','justice','rights','responsibility','duty',
  'truth','lie','secret','mystery','miracle',
  'memory','thought','mind','knowledge','wisdom','imagination',
  'beauty','quality','value','worth','meaning','sense',

  // More food & cooking
  'recipe','meal','dish','course','appetizer','dessert','snack',
  'grill','fry','boil','steam','roast','chop','slice','mix','stir','pour',
  'beef','pork','lamb','turkey','shrimp','seafood','lobster','crab',
  'noodle','noodles','dumpling','dumplings','pancake','pancakes','waffle','cereal','porridge','oatmeal',
  'yogurt','jam','honey','syrup','vinegar','sauce','ketchup','mustard','mayonnaise',
  'peach','pear','grape','grapes','strawberry','berry','berries','watermelon','melon','mango',
  'cherry','plum','pineapple','coconut',
  'cucumber','broccoli','spinach','cabbage','corn','pea','peas','pepper','peppers',
  'nut','nuts','almond','peanut','walnut',
  'snack','treat','candy','gum',
  'bottle','jar','can','packet','portion','serving',

  // Clothing & shopping
  'clothes','clothing','outfit','uniform','costume','pajamas','underwear',
  'size','medium','large','extra',
  'store','mall','market','supermarket','bakery','pharmacy','bookstore',
  'discount','sale','deal','bargain','brand','quality',
  'cash','credit','debit','payment','wallet','purse','coin',

  // House/home
  'ceiling','attic','basement','garage','porch','balcony','terrace','yard','fence',
  'drawer','cabinet','closet','wardrobe','shelf','bookcase',
  'sink','tap','faucet','drain','pipe','shower','bathtub','toilet',
  'electricity','gas','heat','power','air conditioning',
  'decoration','furniture','appliance',

  // Common expressions / small words
  'able','about','above','actually','after','again','ago','agree','ahead','alright',
  'amount','apart','around','away','become','behind','believe','below','beneath',
  'besides','between','beyond','bother','cannot','certain','certainly','completely','consider',
  'deal','despite','direct','directly','done','during','either','else','entire',
  'especially','eventually','exactly','except','extra','fair','fairly','figure','forward',
  'further','general','generally','given','gone','hard','herself','himself','itself',
  'indeed','instead','itself','likely','literally','mainly','matter','merely','mostly',
  'much','nearly','nor','normally','nowadays','obviously','onto','otherwise','ought',
  'ourselves','overall','particularly','per','perfectly','personally','plain','plus',
  'possibly','previously','properly','provided','quite','rather','regardless','relatively',
  'rest','roughly','seriously','simply','slightly','somewhat','therefore','thus','towards',
  'truly','unless','unlike','upon','whatever','whenever','whereas','wherever','whether',
  'whilst','widely','willing','within','worth','yet',

  // More verb forms that are common
  'bit','born','beaten','bet','bitten','bled','blown','bored','bound',
  'burnt','burst','cast','chosen','clung','crept','dealt','dug','drawn',
  'dreamt','driven','drunk','eaten','fallen','fed','fit','fled','flung',
  'forbidden','forgiven','forgotten','frozen','gotten','ground','grown','hidden',
  'hurt','knelt','knit','known','laid','leapt','lent','lied','lit',
  'meant','mistaken','overcome','proven','quit','risen','rung','shaken',
  'shone','shot','shrunk','shut','slid','slit','slung','smelt','sown',
  'spelt','spilt','spit','split','spoilt','spread','sprung','stolen','stricken',
  'struck','strung','stuck','stung','stunk','sung','sunk','swam','swept',
  'swollen','sworn','swum','swung','torn','trodden','understood','upset','woken','worn','wound','woven','wrung',

  // Words appearing commonly in language-learning beginner sentences
  'abroad','accent','afternoon','ahead','airport','aisle','alarm','alive','allergic',
  'already','amazing','anniversary','annual','anymore','apartment','app','appointment','area',
  'aroma','arrange','article','asleep','assignment','assistant','assume','attend','available',
  'awake','aware','awful',
  'bakery','balcony','band','barely','basically','basket','bathroom','battery','beach',
  'beard','become','bedroom','beginning','behavior','behaviour','bench','benefit','beside',
  'blanket','block','blossom','board','border','boring','born','both','branch',
  'breath','breathe','breeze','bridge','brief','bright','brilliant','broken','browse',
  'brush','bucket','budget','bunch','burn','bury',
  'cabinet','calm','camera','cancel','candle','capable','capital','captain','career',
  'carpet','carriage','casual','cathedral','celebrate','ceremony','challenge','champion',
  'channel','chapter','charity','chart','childhood','citizen','climate','climb','clinic',
  'closet','coach','coast','colleague','collection','column','comfortable','commit','common',
  'communicate','companion','compare','compete','complain','completely','concert','confident',
  'confirm','confuse','connect','consider','contact','contest','contrast','contribute',
  'control','convenient','cook','corner','correct','couch','courage','court','cozy',
  'creative','crew','crop','crowded','crush','culture','curious','currency','current',
  'curtain','custom','customer',
  'daily','damage','dare','deadline','debate','debt','decorate','deliver','demand',
  'depart','department','depend','deposit','describe','desert','deserve','design','desire',
  'despite','dessert','detail','determine','develop','device','diet','digital','direction',
  'dirt','disappear','discover','dish','display','distance','district','divide','donate',
  'double','doubt','downtown','drama','drawer','driveway',
  'economy','effective','efficient','effort','elderly','embarrass','emergency','emotion',
  'employ','encourage','endless','enemy','engage','engine','enormous','entertainment',
  'entrance','environment','equipment','escape','essential','establish','estate','estimate',
  'exact','exam','examine','exchange','excited','executive','exercise','exhibit','expand',
  'expense','experience','experiment','expert','explore','express','extend','extra',
  'extreme','extremely',
  'facility','factor','factory','familiar','fancy','fantastic','fare','fashion','fault',
  'feature','fence','festival','fiber','fiction','field','figure','final','financial',
  'firm','flag','flavor','flight','flood','focus','folk','footstep','forecast',
  'forehead','forever','formal','former','fortune','foundation','frame','freeze','frequent',
  'fresh','frighten','frog','frontier','frozen','fuel','furniture','future',
  'gain','gallery','gap','garage','gather','generous','genuine','gesture','giant',
  'gifted','glad','global','glory','gorgeous','grab','graceful','grade','gradually',
  'grain','grand','grateful','grave','greet','grill','grin','grind','grocery',
  'guarantee','guard','guilty','guitar',
  'habit','halfway','handle','handsome','harbor','harbour','hardly','harvest','headline',
  'heal','heap','heat','height','helmet','heritage','hero','highlight','hike',
  'hire','historic','hobby','homeland','honest','honor','horrible','host','household',
  'housework','huge','humble','humor','humour',
  'identical','ignore','illegal','illustrate','immediate','immigrant','impact','impress',
  'incident','income','indicate','individual','indoor','industrial','infant','influence',
  'inform','initial','inner','innocent','inspire','install','instance','institution',
  'instruction','instrument','insurance','intelligence','intend','intense','interior',
  'invest','investigate','investment','invisible','involve','iron','issue','item',
  'jail','jaw','jewel','jewelry','jewellery','journey','judge','junior',
  'keen','kettle','kingdom',
  'label','labor','labour','ladder','landscape','lane','laptop','launch','lawn',
  'layer','layout','league','leather','lecture','legal','legend','leisure','length',
  'lessen','lid','lifetime','likewise','limit','link','liquid','listener','literary',
  'literature','load','loan','locate','location','lodge','log','lonely','loose',
  'lord','luxury',
  'machine','magazine','magic','magnificent','maid','maintain','major','makeup','manage',
  'manner','manufacture','marathon','margin','mark','massive','master','match','material',
  'maximum','mayor','measure','media','mental','mention','merchant','mere','mess',
  'method','mild','military','mineral','minimum','minor','minority','mirror','mission',
  'mixture','mobile','model','monitor','mood','moral','motion','motor','mount',
  'movement','mud','multiply','muscle','mutual',
  'nail','narrow','nation','native','nature','necessary','negative','negotiate',
  'nerve','network','neutral','noble','nod','normal','northern','notable','notion',
  'novel','nowhere','numerous',
  'objective','observe','obtain','occasion','occupy','odd','offense','official',
  'operate','opinion','opponent','oppose','opposite','option','ordinary','organic',
  'origin','otherwise','outdoor','outer','outline','output','overcome','overlook','owe',
  'owner','oxygen',
  'pace','package','palace','pale','pan','panel','panic','paradise','paragraph',
  'passage','passenger','passion','path','patience','pattern','pause','peak','pension',
  'percent','percentage','perform','permanent','permit','phase','philosophy','phrase',
  'physical','pile','pin','pitch','plain','platform','pleasant','plot','plug',
  'plus','pocket','poem','poet','poetry','polish','polite','politics','pollution',
  'pool','popular','portion','portrait','positive','possess','potential','pound','pour',
  'poverty','pray','prayer','precious','precise','predict','prefer','preparation',
  'presence','preserve','press','pressure','pretend','prevent','previous','pride','primary',
  'principle','prior','priority','prison','privilege','procedure','proceed','process',
  'produce','production','profession','profile','profit','promote','prompt','proof',
  'properly','property','proportion','proposal','propose','prospect','protect','protest',
  'prove','provide','province','pursue','puzzle',
  'qualify','quantity','quarter','quit',
  'rarely','rate','raw','react','reality','recognize','recommend','recover','reduce',
  'refer','reflect','reform','refrigerator','refuse','region','register','regular',
  'reject','relate','relation','relative','release','relevant','relief','religion',
  'rely','remark','remedy','remote','remove','renew','repair','repeat','replace',
  'represent','request','rescue','reserve','resident','resist','resolve','resource',
  'respond','response','restore','restrict','retire','reveal','revenue','review',
  'revolution','reward','rhythm','rid','ride','ritual','rival','roll','romance',
  'romantic','root','rope','rough','row','royal','rural',
  'sacred','sacrifice','sample','sand','satisfy','scale','scan','scenery','scent',
  'scholar','scratch','screen','seal','search','secure','seed','seek','select',
  'sense','sensitive','sentence','separate','sequence','settle','severe','shadow','shallow',
  'shame','sharp','shelter','shift','shore','shortage','shoulder','shout','shut',
  'sight','signal','significant','silly','silver','sincere','sink','site','situation',
  'skill','slave','slight','slip','slope','smooth','snap','soil','solar','solid',
  'solution','somewhat','soul','source','southern','spare','specific','speech','spirit',
  'spiritual','split','sponsor','spot','spray','stable','staff','stage','stair',
  'stake','standard','stare','status','steady','steel','steep','stem','stick',
  'stock','stomach','storage','storm','strain','stranger','strategy','stream','strength',
  'stretch','strict','strike','string','strip','structure','struggle','studio','stuff',
  'style','substance','succeed','sufficient','summary','sunset','super','supply','support',
  'surface','surgery','surround','survey','survive','suspect','suspend','sustain','swear',
  'sweep','symbol','sympathy','symptom','tale','talent','target','technique','temple',
  'temporary','tend','tender','tension','tent','term','territory','text','theme','theory',
  'therapy','thereby','threat','thrill','throat','tide','tight','timber','tiny','tissue',
  'title','tone','tongue','topic','total','tough','tour','tourist','tower','trace',
  'track','trade','tradition','traffic','trail','transform','translate','transport',
  'trap','treasure','trend','trial','trick','trigger','triumph','tropical','trust',
  'tube','tunnel','twist','typical',
  'ultimate','undergo','unique','unite','universe','unlike','unusual','update','upper',
  'urban','urge','usual','utility',
  'valid','valley','vast','vehicle','venture','version','victim','view','virtue',
  'visible','vital','vivid','volunteer','vote',
  'wage','warn','warrior','waste','wealthy','weapon','web','weed','welfare','western',
  'wheel','whereas','whisper','widen','wild','willing','wind','wisdom','witness',
  'wonder','wooden','wool',
  'zone',

  // Very common in SRS sentences
  'able','absolutely','accent','according','across','actually','address','admire','adult',
  'adventure','advice','afford','afternoon','afterwards','agree','ahead','aim','allow',
  'almost','alone','along','already','although','altogether','always','among','amount',
  'ancient','angry','announce','annual','apart','apology','apparently','apply','appreciate',
  'approach','approve','argue','arrange','array','aside','asleep','assume','atmosphere',
  'attach','attempt','attend','attract','audience','autumn','average','avoid','awake',
  'award','aware','awful',
  'background','backward','badly','balance','ban','band','bare','bargain','barrier',
  'base','basis','bay','bear','beat','bed','before','begin','behave','belief',
  'belong','bend','beneath','beside','besides','bet','beyond','billion','bind','birth',
  'bite','bitter','blade','blame','blast','bleed','blend','bless','blind','blow','board',
  'bond','bore','borrow','bother','bottom','bound','bow','bowl','brand','brave',
  'breakdown','breast','breathe','breed','brick','brief','brilliant','broad','broadcast',
  'broken','brush','bubble','buddy','bunch','burden','burn','burst','busy','buyer',
]);

// ─── Tokenize English sentence into words ───
function tokenize(english) {
  return english
    .replace(/['']/g, "'")
    .replace(/[^a-zA-Z' -]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 0);
}

// ─── Check if a word is "rare" ───
function isRare(word) {
  // Skip very short words (a, I, etc.)
  if (word.length <= 2) return false;

  // Proper nouns (capitalized and not start of sentence – we'll handle that in caller)
  // We check if word starts with uppercase
  if (/^[A-Z]/.test(word)) return false;

  // Check against basic list (lowercase)
  const lower = word.toLowerCase();
  if (BASIC_WORDS.has(lower)) return false;

  // Common suffixes: -ing, -ed, -er, -est, -ly, -tion, -ness, -ment, -ful, -less, -able, -ible, -ous, -ive
  // Try stripping them and checking root
  const suffixPatterns = [
    [/ing$/, ''], [/ing$/, 'e'],
    [/ed$/, ''], [/ed$/, 'e'], [/ied$/, 'y'],
    [/er$/, ''], [/er$/, 'e'],
    [/est$/, ''], [/est$/, 'e'],
    [/ly$/, ''], [/ly$/, 'le'], [/ily$/, 'y'], [/ally$/, 'al'],
    [/tion$/, 't'], [/tion$/, 'te'],
    [/ness$/, ''],
    [/ment$/, ''],
    [/ful$/, ''],
    [/less$/, ''],
    [/able$/, ''], [/able$/, 'e'],
    [/ible$/, ''],
    [/ous$/, ''], [/ous$/, 'e'],
    [/ive$/, ''], [/ive$/, 'e'],
    [/ies$/, 'y'],
    [/s$/, ''],
    [/es$/, ''], [/es$/, 'e'],
    [/ier$/, 'y'],
    [/iest$/, 'y'],
    [/ily$/, 'y'],
    [/pped$/, 'p'], [/tted$/, 't'], [/nned$/, 'n'],
    [/pping$/, 'p'], [/tting$/, 't'], [/nning$/, 'n'],
  ];

  for (const [pattern, replacement] of suffixPatterns) {
    if (pattern.test(lower)) {
      const root = lower.replace(pattern, replacement);
      if (root.length >= 2 && BASIC_WORDS.has(root)) return false;
    }
  }

  return true;
}

// ─── Get rare words from an English sentence ───
function getRareWords(english) {
  const words = tokenize(english);
  const rare = [];
  for (const word of words) {
    if (isRare(word)) {
      rare.push(word.toLowerCase());
    }
  }
  return [...new Set(rare)]; // unique
}

// ─── Process a single language ───
function processLanguage(langDir, langName) {
  const deckPath = path.join(langDir, 'deck.json');
  const deck = JSON.parse(fs.readFileSync(deckPath, 'utf8'));

  const node01Before = deck.filter(c => c.grammarNode === 'node-01').length;

  const toMove = [];
  const kept = [];

  for (const card of deck) {
    if (card.grammarNode !== 'node-01') continue;

    const rare = getRareWords(card.english);
    if (rare.length >= 3) {
      toMove.push({ card, rare });
      card.grammarNode = 'node-15'; // Move to node-15
    } else {
      kept.push(card);
    }
  }

  const node01After = node01Before - toMove.length;

  // Now re-sort entire deck by (node number, word count), then reassign IDs
  // Detect ID format
  const prefix = deck[0].id.replace(/\d+$/, '');

  deck.sort((a, b) => {
    const nodeA = parseInt(a.grammarNode.replace('node-', ''));
    const nodeB = parseInt(b.grammarNode.replace('node-', ''));
    if (nodeA !== nodeB) return nodeA - nodeB;
    // Within same node, sort by English word count
    const wcA = a.english.split(/\s+/).length;
    const wcB = b.english.split(/\s+/).length;
    return wcA - wcB;
  });

  // Reassign IDs preserving audio
  for (let i = 0; i < deck.length; i++) {
    deck[i].id = prefix + String(i + 1).padStart(4, '0');
  }

  // Write back
  fs.writeFileSync(deckPath, JSON.stringify(deck, null, 2) + '\n');

  // Check for possibly legitimate beginner cards among moved ones
  const maybeLegit = toMove.filter(({ rare }) => {
    // If all rare words are only mildly unusual, might be legit
    return rare.length === 3 && rare.every(w => w.length <= 6);
  });

  return {
    langName,
    node01Before,
    node01After,
    movedCount: toMove.length,
    moved: toMove.map(({ card, rare }) => ({
      english: card.english,
      rare: rare.join(', '),
      audio: card.audio,
    })),
    maybeLegit: maybeLegit.map(({ card, rare }) => ({
      english: card.english,
      rare: rare.join(', '),
    })),
  };
}

// ─── Main ───
const BASE = path.join(__dirname, '..', 'src', 'data');
const LANGUAGES = ['spanish', 'italian', 'french', 'portuguese', 'german', 'dutch', 'swedish', 'welsh', 'turkish', 'russian'];

const results = [];
for (const lang of LANGUAGES) {
  const langDir = path.join(BASE, lang);
  if (!fs.existsSync(path.join(langDir, 'deck.json'))) {
    console.log(`Skipping ${lang} – no deck.json`);
    continue;
  }
  const result = processLanguage(langDir, lang);
  results.push(result);
}

// ─── Report ───
console.log('\n=== NODE-01 CLEANUP REPORT ===\n');
let totalMoved = 0;
for (const r of results) {
  console.log(`--- ${r.langName.toUpperCase()} ---`);
  console.log(`  node-01: ${r.node01Before} → ${r.node01After} (moved ${r.movedCount} to node-15)`);
  totalMoved += r.movedCount;

  if (r.moved.length > 0) {
    console.log('  Moved cards:');
    for (const m of r.moved) {
      console.log(`    "${m.english}" [rare: ${m.rare}]`);
    }
  }

  if (r.maybeLegit.length > 0) {
    console.log('  ⚠ Possibly legitimate (review these):');
    for (const m of r.maybeLegit) {
      console.log(`    "${m.english}" [rare: ${m.rare}]`);
    }
  }
  console.log('');
}
console.log(`TOTAL: moved ${totalMoved} cards across ${results.length} languages`);
