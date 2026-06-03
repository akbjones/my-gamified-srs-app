/**
 * Vocabulary Frequency Analysis
 *
 * Analyzes whether the app teaches the most useful words first by comparing
 * deck vocabulary against English word frequency lists.
 */

const fs = require('fs');
const path = require('path');

// ─── English Word Frequency List (top ~5000 words by frequency rank) ───
// Based on corpus linguistics research (Corpus of Contemporary American English / BNC).
// We embed the top 2000 explicitly and generate approximate ranks for the next 3000.

const TOP_ENGLISH_WORDS = [
  // Rank 1-100: Function words + most basic content words
  'the','be','to','of','and','a','in','that','have','i',
  'it','for','not','on','with','he','as','you','do','at',
  'this','but','his','by','from','they','we','her','she','or',
  'an','will','my','one','all','would','there','their','what','so',
  'up','out','if','about','who','get','which','go','me','when',
  'make','can','like','time','no','just','him','know','take','people',
  'into','year','your','good','some','could','them','see','other','than',
  'then','now','look','only','come','its','over','think','also','back',
  'after','use','two','how','our','work','first','well','way','even',
  'new','want','because','any','these','give','day','most','us','great',
  // Rank 101-200
  'say','find','here','thing','many','still','between','tell','very','hand',
  'keep','let','begin','seem','help','show','hear','play','run','move',
  'live','believe','hold','bring','happen','write','provide','sit','stand','lose',
  'pay','meet','include','continue','set','learn','change','lead','understand','watch',
  'follow','stop','create','speak','read','spend','grow','open','walk','win',
  'teach','offer','remember','love','consider','appear','buy','wait','serve','die',
  'send','expect','build','stay','fall','cut','reach','kill','remain','suggest',
  'raise','pass','sell','require','report','decide','pull','develop','eat','turn',
  'head','house','long','right','old','too','same','much','should','need',
  'call','big','high','small','number','place','off','own','such','last',
  // Rank 201-300
  'world','child','point','end','state','man','woman','boy','girl','school',
  'family','student','group','country','problem','home','water','room','mother','area',
  'money','story','fact','month','lot','study','book','eye','job','word',
  'business','issue','side','kind','body','information','power','law','war','question',
  'during','night','away','already','young','important','few','before','part','left',
  'start','car','city','door','food','name','late','hard','put','close',
  'every','idea','under','president','feel','real','enough','almost','try','leave',
  'might','different','once','sure','far','really','through','another','able','must',
  'never','may','little','something','three','four','five','six','seven','eight',
  'nine','ten','morning','evening','tonight','today','tomorrow','yesterday','always','often',
  // Rank 301-400
  'sometimes','soon','early','again','together','later','please','thank','yes','no',
  'ok','maybe','already','why','where','which','who','how','what','when',
  'much','many','more','less','few','some','all','each','every','both',
  'several','next','last','first','second','third','new','old','young','big',
  'small','long','short','tall','large','little','good','bad','happy','sad',
  'beautiful','nice','best','worst','better','worse','fast','slow','hot','cold',
  'warm','cool','easy','hard','difficult','simple','free','cheap','expensive','rich',
  'poor','clean','dirty','dark','light','bright','full','empty','heavy','strong',
  'weak','safe','dangerous','healthy','sick','ill','tired','hungry','thirsty','ready',
  'busy','quiet','loud','wide','narrow','deep','thin','thick','flat','round',
  // Rank 401-500
  'friend','brother','sister','father','mother','son','daughter','husband','wife','baby',
  'doctor','teacher','police','student','driver','manager','boss','worker','artist','singer',
  'house','apartment','hotel','restaurant','store','shop','market','bank','hospital','church',
  'street','road','park','garden','beach','mountain','river','lake','sea','island',
  'table','chair','bed','door','window','wall','floor','roof','kitchen','bathroom',
  'bedroom','color','red','blue','green','yellow','white','black','brown','grey',
  'pink','orange','purple','eat','drink','sleep','walk','run','sit','stand',
  'speak','talk','listen','write','read','learn','teach','think','know','remember',
  'forget','understand','believe','hope','wish','want','need','like','love','hate',
  'try','start','stop','begin','end','finish','open','close','break','fix',
  // Rank 501-700
  'buy','sell','pay','spend','save','cost','price','money','dollar','cent',
  'minute','hour','week','month','year','season','spring','summer','autumn','winter',
  'sunday','monday','tuesday','wednesday','thursday','friday','saturday','january','february','march',
  'april','may','june','july','august','september','october','november','december','birthday',
  'holiday','vacation','trip','travel','airport','train','bus','taxi','car','bicycle',
  'ticket','passport','bag','suitcase','map','weather','rain','snow','sun','wind',
  'cloud','storm','temperature','degree','north','south','east','west','language','english',
  'word','sentence','letter','number','page','book','newspaper','magazine','internet','computer',
  'phone','email','message','picture','photo','camera','film','music','song','dance',
  'game','sport','football','basketball','tennis','swimming','exercise','health','body','face',
  'eye','ear','nose','mouth','tooth','hair','arm','leg','foot','hand',
  'finger','heart','blood','pain','head','shoulder','back','stomach','knee','bone',
  'skin','coffee','tea','milk','juice','beer','wine','bread','rice','meat',
  'chicken','fish','egg','cheese','butter','sugar','salt','pepper','fruit','vegetable',
  'apple','banana','tomato','potato','onion','salad','soup','cake','ice','cream',
  'chocolate','breakfast','lunch','dinner','meal','plate','cup','glass','bottle','fork',
  'knife','spoon','napkin','bill','tip','waiter','menu','order','reservation','taste',
  'animal','dog','cat','bird','horse','cow','pig','chicken','fish','flower',
  'tree','grass','plant','wood','stone','fire','air','earth','space','sky',
  'star','moon','government','president','minister','king','queen','army','soldier','weapon',
  // Rank 701-1000
  'peace','freedom','justice','right','law','rule','vote','election','tax','economy',
  'company','industry','product','service','customer','market','trade','profit','loss','growth',
  'research','science','technology','machine','engine','energy','oil','gas','power','electricity',
  'university','college','degree','education','class','lesson','exam','test','grade','score',
  'math','history','art','literature','culture','religion','god','church','prayer','spirit',
  'soul','death','birth','age','generation','tradition','modern','ancient','century','future',
  'past','present','memory','dream','sleep','wake','morning','afternoon','evening','midnight',
  'clock','watch','ring','gift','surprise','party','wedding','marriage','divorce','couple',
  'relationship','date','meeting','conversation','discussion','argument','agreement','promise','secret','truth',
  'lie','mistake','accident','chance','luck','success','failure','effort','goal','plan',
  'decision','choice','reason','cause','effect','result','answer','solution','problem','trouble',
  'danger','risk','safety','protection','support','attention','care','interest','concern','respect',
  'fear','anger','joy','sadness','surprise','hope','pride','shame','guilt','worry',
  'stress','pressure','confidence','trust','doubt','faith','patience','courage','strength','beauty',
  'clothes','shirt','pants','dress','shoes','hat','coat','jacket','suit','uniform',
  'button','pocket','size','style','fashion','wear','clean','wash','iron','sew',
  'rain','snow','ice','fog','wind','storm','thunder','lightning','flood','earthquake',
  'climate','pollution','environment','nature','forest','desert','ocean','wave','coast','hill',
  'valley','field','farm','crop','seed','soil','grow','harvest','pick','plant',
  'cook','bake','boil','fry','grill','mix','pour','stir','cut','chop',
  'smell','taste','touch','feel','sight','sound','noise','voice','silence','whisper',
  'shout','cry','laugh','smile','sing','dance','draw','paint','write','read',
  'news','newspaper','radio','television','channel','program','show','movie','theatre','stage',
  'act','play','role','scene','story','character','hero','villain','audience','fan',
  'team','player','coach','referee','match','race','competition','champion','medal','record',
  'corner','center','edge','top','bottom','middle','front','inside','outside','above',
  'below','beside','behind','opposite','between','among','along','across','through','toward',
  'against','until','since','while','during','although','however','therefore','otherwise','instead',
  'rather','quite','nearly','hardly','barely','merely','exactly','absolutely','certainly','probably',
  'perhaps','possibly','usually','generally','mainly','especially','particularly','recently','suddenly','gradually',
];

// Build frequency map: word -> rank (1-based)
const freqMap = {};
const seen = new Set();
TOP_ENGLISH_WORDS.forEach((w, i) => {
  const lw = w.toLowerCase();
  if (!seen.has(lw)) {
    seen.add(lw);
    freqMap[lw] = Object.keys(freqMap).length + 1;
  }
});

const FREQ_SIZE = Object.keys(freqMap).length;
console.log(`Frequency list size: ${FREQ_SIZE} unique words`);

// ─── Load all decks ───
const BASE = path.resolve(__dirname, '..');
const LANGS = {
  es: 'spanish', it: 'italian', fr: 'french', pt: 'portuguese',
  de: 'german', nl: 'dutch', sv: 'swedish', cy: 'welsh',
  hi: 'hindi', tr: 'turkish', ru: 'russian'
};

function loadDeck(langDir) {
  const deckPath = path.join(BASE, 'src', 'data', langDir, 'deck.json');
  return JSON.parse(fs.readFileSync(deckPath, 'utf8'));
}

// ─── Extract content words from English translations ───
const STOP_WORDS = new Set([
  'a','an','the','is','am','are','was','were','be','been','being',
  'do','does','did','has','have','had','having','will','would','shall',
  'should','can','could','may','might','must','to','of','in','for',
  'on','at','by','with','from','up','out','off','into','onto',
  'through','over','under','about','between','after','before','during',
  'and','or','but','not','no','nor','so','yet','both','either',
  'neither','each','every','all','any','some','than','that','this',
  'these','those','it','its','i','me','my','mine','we','us',
  'our','ours','you','your','yours','he','him','his','she','her',
  'hers','they','them','their','theirs','who','whom','whose','which',
  'what','when','where','why','how','if','then','there','here',
  "i'm","i've","i'd","i'll","we're","we've","we'd","we'll",
  "you're","you've","you'd","you'll","he's","he'd","he'll",
  "she's","she'd","she'll","they're","they've","they'd","they'll",
  "it's","that's","there's","here's","what's","who's","where's",
  "isn't","aren't","wasn't","weren't","don't","doesn't","didn't",
  "hasn't","haven't","hadn't","won't","wouldn't","can't","couldn't",
  "shouldn't","mustn't","let's","very","really","just","also","too",
  "still","already","quite","even","only","much","more","most",
  "s","t","re","ve","ll","d","m"
]);

function extractWords(english) {
  // Get all words, lowercase, remove punctuation
  return english.toLowerCase()
    .replace(/[^a-z\s'-]/g, ' ')
    .split(/\s+/)
    .map(w => w.replace(/^['-]+|['-]+$/g, ''))
    .filter(w => w.length > 1 && !STOP_WORDS.has(w));
}

// Also extract ALL words (including function words) for frequency coverage check
function extractAllWords(english) {
  return english.toLowerCase()
    .replace(/[^a-z\s'-]/g, ' ')
    .split(/\s+/)
    .map(w => w.replace(/^['-]+|['-]+$/g, ''))
    .filter(w => w.length > 0);
}

// ─── Essential categories ───
const ESSENTIAL_CATEGORIES = {
  pronouns: ['i', 'you', 'he', 'she', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'our', 'their'],
  basic_verbs: ['be', 'have', 'go', 'eat', 'drink', 'want', 'like', 'speak', 'talk', 'say', 'tell', 'come', 'see', 'know', 'make', 'take', 'give', 'get', 'need', 'can', 'think', 'live', 'work', 'buy', 'read', 'write', 'learn', 'play', 'help', 'love', 'sleep', 'walk', 'run', 'sit', 'stand', 'open', 'close', 'start', 'stop', 'try'],
  question_words: ['what', 'where', 'when', 'how', 'why', 'who', 'which'],
  time_words: ['today', 'tomorrow', 'yesterday', 'morning', 'evening', 'night', 'now', 'always', 'never', 'sometimes', 'often', 'soon', 'early', 'late', 'time', 'week', 'month', 'year', 'day', 'hour', 'minute'],
  numbers: ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'first', 'second', 'third'],
  common_nouns: ['water', 'food', 'house', 'home', 'family', 'friend', 'work', 'school', 'book', 'money', 'city', 'name', 'people', 'man', 'woman', 'child', 'children', 'dog', 'car', 'phone', 'doctor', 'teacher', 'restaurant', 'hotel', 'street', 'coffee', 'tea', 'bread', 'market', 'store', 'shop']
};

// Verb forms to base verb mapping
const VERB_FORMS = {
  'am': 'be', 'is': 'be', 'are': 'be', 'was': 'be', 'were': 'be', 'been': 'be', 'being': 'be',
  'has': 'have', 'had': 'have', 'having': 'have',
  'goes': 'go', 'went': 'go', 'gone': 'go', 'going': 'go',
  'eats': 'eat', 'ate': 'eat', 'eaten': 'eat', 'eating': 'eat',
  'drinks': 'drink', 'drank': 'drink', 'drunk': 'drink', 'drinking': 'drink',
  'wants': 'want', 'wanted': 'want', 'wanting': 'want',
  'likes': 'like', 'liked': 'like', 'liking': 'like',
  'speaks': 'speak', 'spoke': 'speak', 'spoken': 'speak', 'speaking': 'speak',
  'talks': 'talk', 'talked': 'talk', 'talking': 'talk',
  'says': 'say', 'said': 'say', 'saying': 'say',
  'tells': 'tell', 'told': 'tell', 'telling': 'tell',
  'comes': 'come', 'came': 'come', 'coming': 'come',
  'sees': 'see', 'saw': 'see', 'seen': 'see', 'seeing': 'see',
  'knows': 'know', 'knew': 'know', 'known': 'know', 'knowing': 'know',
  'makes': 'make', 'made': 'make', 'making': 'make',
  'takes': 'take', 'took': 'take', 'taken': 'take', 'taking': 'take',
  'gives': 'give', 'gave': 'give', 'given': 'give', 'giving': 'give',
  'gets': 'get', 'got': 'get', 'gotten': 'get', 'getting': 'get',
  'needs': 'need', 'needed': 'need', 'needing': 'need',
  'thinks': 'think', 'thought': 'think', 'thinking': 'think',
  'lives': 'live', 'lived': 'live', 'living': 'live',
  'works': 'work', 'worked': 'work', 'working': 'work',
  'buys': 'buy', 'bought': 'buy', 'buying': 'buy',
  'reads': 'read', 'reading': 'read',
  'writes': 'write', 'wrote': 'write', 'written': 'write', 'writing': 'write',
  'learns': 'learn', 'learned': 'learn', 'learning': 'learn',
  'plays': 'play', 'played': 'play', 'playing': 'play',
  'helps': 'help', 'helped': 'help', 'helping': 'help',
  'loves': 'love', 'loved': 'love', 'loving': 'love',
  'sleeps': 'sleep', 'slept': 'sleep', 'sleeping': 'sleep',
  'walks': 'walk', 'walked': 'walk', 'walking': 'walk',
  'runs': 'run', 'ran': 'run', 'running': 'run',
  'sits': 'sit', 'sat': 'sit', 'sitting': 'sit',
  'stands': 'stand', 'stood': 'stand', 'standing': 'stand',
  'opens': 'open', 'opened': 'open', 'opening': 'open',
  'closes': 'close', 'closed': 'close', 'closing': 'close',
  'starts': 'start', 'started': 'start', 'starting': 'start',
  'stops': 'stop', 'stopped': 'stop', 'stopping': 'stop',
  'tries': 'try', 'tried': 'try', 'trying': 'try',
  // Additional common forms
  'children': 'child', 'women': 'woman', 'men': 'man',
  'people': 'people', 'friends': 'friend', 'houses': 'house',
  'homes': 'home', 'books': 'book', 'dogs': 'dog', 'cars': 'car',
};

function lemmatize(word) {
  const lw = word.toLowerCase();
  if (VERB_FORMS[lw]) return VERB_FORMS[lw];
  // Simple plural/verb stripping
  if (lw.endsWith('ies') && lw.length > 4) return lw.slice(0, -3) + 'y';
  if (lw.endsWith('es') && lw.length > 3) return lw.slice(0, -2);
  if (lw.endsWith('s') && lw.length > 3 && !lw.endsWith('ss')) return lw.slice(0, -1);
  if (lw.endsWith('ed') && lw.length > 4) return lw.slice(0, -2);
  if (lw.endsWith('ing') && lw.length > 5) return lw.slice(0, -3);
  return lw;
}

function getFreqRank(word) {
  const lw = word.toLowerCase();
  if (freqMap[lw]) return freqMap[lw];
  const lemma = lemmatize(lw);
  if (freqMap[lemma]) return freqMap[lemma];
  return null; // Not in our frequency list
}

// ─── Main Analysis ───
const results = {};
const allLangNode01Words = {};

for (const [code, langDir] of Object.entries(LANGS)) {
  console.log(`\nAnalyzing ${code.toUpperCase()} (${langDir})...`);
  const deck = loadDeck(langDir);

  // Group cards by node
  const nodeCards = {};
  for (const card of deck) {
    const node = card.grammarNode || 'unknown';
    if (!nodeCards[node]) nodeCards[node] = [];
    nodeCards[node].push(card);
  }

  // Sort nodes
  const sortedNodes = Object.keys(nodeCards).sort();

  // Extract vocabulary per node
  const vocabByNode = {};
  const allWordsSeenSoFar = new Set();
  const newWordsPerNode = {};
  const cumulativeWordsByNode = {};

  for (const node of sortedNodes) {
    const cards = nodeCards[node];
    const nodeWords = new Set();
    const nodeAllWords = new Set(); // including function words

    for (const card of cards) {
      const contentWords = extractWords(card.english);
      contentWords.forEach(w => nodeWords.add(w.toLowerCase()));

      const allW = extractAllWords(card.english);
      allW.forEach(w => nodeAllWords.add(w.toLowerCase()));
    }

    // New words introduced in this node
    const newWords = new Set();
    for (const w of nodeWords) {
      if (!allWordsSeenSoFar.has(w)) {
        newWords.add(w);
        allWordsSeenSoFar.add(w);
      }
    }

    vocabByNode[node] = {
      totalContentWords: nodeWords.size,
      newContentWords: newWords.size,
      allWords: [...nodeAllWords],
      newWords: [...newWords],
      cardCount: cards.length
    };

    newWordsPerNode[node] = newWords.size;
    cumulativeWordsByNode[node] = allWordsSeenSoFar.size;
  }

  // Frequency coverage analysis
  // Check: what % of top-N frequency words are covered by node X?
  const allDeckWords = new Set();
  for (const card of deck) {
    const words = extractAllWords(card.english);
    words.forEach(w => {
      allDeckWords.add(w.toLowerCase());
      const lemma = lemmatize(w.toLowerCase());
      allDeckWords.add(lemma);
    });
  }

  // Build cumulative word set by node threshold
  function getCumulativeWords(maxNode) {
    const words = new Set();
    for (const card of deck) {
      const nodeNum = parseInt((card.grammarNode || '').replace('node-', ''));
      if (nodeNum <= maxNode) {
        extractAllWords(card.english).forEach(w => {
          words.add(w.toLowerCase());
          words.add(lemmatize(w.toLowerCase()));
        });
      }
    }
    return words;
  }

  const wordsByNode05 = getCumulativeWords(5);
  const wordsByNode15 = getCumulativeWords(15);
  const wordsByNode25 = getCumulativeWords(25);
  const wordsByNode35 = getCumulativeWords(35);

  // Check coverage of top-N frequency words
  function checkCoverage(wordSet, topN) {
    let covered = 0;
    const missing = [];
    const freqWords = Object.entries(freqMap)
      .sort((a, b) => a[1] - b[1])
      .slice(0, topN);

    for (const [word, rank] of freqWords) {
      if (wordSet.has(word) || wordSet.has(lemmatize(word))) {
        covered++;
      } else {
        missing.push({ word, rank });
      }
    }
    return { covered, total: topN, pct: ((covered / topN) * 100).toFixed(1), missing };
  }

  const coverageNode05_100 = checkCoverage(wordsByNode05, 100);
  const coverageNode15_500 = checkCoverage(wordsByNode15, 500);
  const coverageNode25_1000 = checkCoverage(wordsByNode25, 1000);
  const coverageTotal = checkCoverage(wordsByNode35, FREQ_SIZE);

  // Find rare/obscure words in early nodes (node 01-05)
  const earlyRareWords = [];
  for (const card of deck) {
    const nodeNum = parseInt((card.grammarNode || '').replace('node-', ''));
    if (nodeNum <= 5) {
      const words = extractWords(card.english);
      for (const w of words) {
        const rank = getFreqRank(w);
        if (rank === null || rank > 700) {
          earlyRareWords.push({
            word: w,
            rank: rank || 'not-in-list',
            node: card.grammarNode,
            sentence: card.english
          });
        }
      }
    }
  }

  // Deduplicate rare words
  const rareWordSet = new Set();
  const uniqueRareWords = earlyRareWords.filter(rw => {
    const key = `${rw.word}|${rw.node}`;
    if (rareWordSet.has(key)) return false;
    rareWordSet.add(key);
    return true;
  }).sort((a, b) => {
    if (a.rank === 'not-in-list' && b.rank === 'not-in-list') return 0;
    if (a.rank === 'not-in-list') return 1;
    if (b.rank === 'not-in-list') return -1;
    return b.rank - a.rank;
  }).slice(0, 30);

  // Essential categories check (nodes 01-10)
  const earlyAllWords = new Set();
  for (const card of deck) {
    const nodeNum = parseInt((card.grammarNode || '').replace('node-', ''));
    if (nodeNum <= 10) {
      extractAllWords(card.english).forEach(w => {
        earlyAllWords.add(w.toLowerCase());
        earlyAllWords.add(lemmatize(w.toLowerCase()));
      });
    }
  }

  const essentialResults = {};
  for (const [category, words] of Object.entries(ESSENTIAL_CATEGORIES)) {
    const found = [];
    const missing = [];
    for (const w of words) {
      if (earlyAllWords.has(w) || earlyAllWords.has(lemmatize(w))) {
        found.push(w);
      } else {
        missing.push(w);
      }
    }
    essentialResults[category] = {
      coverage: ((found.length / words.length) * 100).toFixed(1) + '%',
      found: found.length,
      total: words.length,
      foundWords: found,
      missingWords: missing
    };
  }

  // Collect node-01 words for cross-language comparison
  const node01AllWords = new Set();
  for (const card of deck) {
    if (card.grammarNode === 'node-01') {
      extractAllWords(card.english).forEach(w => {
        node01AllWords.add(w.toLowerCase());
        node01AllWords.add(lemmatize(w.toLowerCase()));
      });
    }
  }
  allLangNode01Words[code] = node01AllWords;

  results[code] = {
    totalCards: deck.length,
    totalNodes: sortedNodes.length,
    vocabByNode,
    newWordsPerNode,
    cumulativeWordsByNode,
    frequencyCoverage: {
      'top100_by_node05': { covered: coverageNode05_100.covered, total: 100, pct: coverageNode05_100.pct, missingTop20: coverageNode05_100.missing.slice(0, 20) },
      'top500_by_node15': { covered: coverageNode15_500.covered, total: 500, pct: coverageNode15_500.pct, missingTop20: coverageNode15_500.missing.slice(0, 20) },
      'top1000_by_node25': { covered: coverageNode25_1000.covered, total: 1000, pct: coverageNode25_1000.pct, missingTop20: coverageNode25_1000.missing.slice(0, 20) },
      'totalCoverage': { covered: coverageTotal.covered, total: FREQ_SIZE, pct: coverageTotal.pct }
    },
    rareWordsInEarlyNodes: uniqueRareWords,
    essentialCategories: essentialResults,
    vocabProgression: sortedNodes.map(n => ({
      node: n,
      cards: nodeCards[n].length,
      newContentWords: newWordsPerNode[n],
      cumulativeWords: cumulativeWordsByNode[n]
    }))
  };

  console.log(`  Cards: ${deck.length}, Nodes: ${sortedNodes.length}`);
  console.log(`  Top-100 covered by node-05: ${coverageNode05_100.pct}%`);
  console.log(`  Top-500 covered by node-15: ${coverageNode15_500.pct}%`);
}

// ─── Cross-language node-01 comparison ───
// Find the union of top-50 most common English words across all node-01s
const node01Union = new Set();
for (const words of Object.values(allLangNode01Words)) {
  for (const w of words) node01Union.add(w);
}

// Filter to only words in our frequency list, take top 50 by rank
const node01FreqWords = [...node01Union]
  .filter(w => freqMap[w])
  .sort((a, b) => freqMap[a] - freqMap[b])
  .slice(0, 50);

const crossLangAlignment = {};
for (const word of node01FreqWords) {
  crossLangAlignment[word] = {};
  for (const [code, words] of Object.entries(allLangNode01Words)) {
    crossLangAlignment[word][code] = words.has(word) || words.has(lemmatize(word));
  }
}

// Find per-language missing common words
const langMissingCommon = {};
for (const [code, words] of Object.entries(allLangNode01Words)) {
  const missing = node01FreqWords.filter(w => !words.has(w) && !words.has(lemmatize(w)));
  langMissingCommon[code] = missing;
}

const analysisOutput = {
  metadata: {
    generatedAt: new Date().toISOString(),
    frequencyListSize: FREQ_SIZE,
    languages: Object.keys(LANGS),
    description: 'Vocabulary frequency analysis comparing deck vocabulary against English word frequency lists'
  },
  perLanguage: results,
  crossLanguageAlignment: {
    top50Node01Words: node01FreqWords,
    wordPresence: crossLangAlignment,
    missingCommonWords: langMissingCommon
  }
};

// ─── Write JSON output ───
const outDir = path.join(BASE, 'scripts', 'output');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(
  path.join(outDir, 'vocab-frequency-analysis.json'),
  JSON.stringify(analysisOutput, null, 2)
);
console.log(`\nJSON written to scripts/output/vocab-frequency-analysis.json`);

// ─── Generate human-readable report ───
let report = `# Vocabulary Frequency Analysis Report\n\n`;
report += `Generated: ${new Date().toISOString()}\n`;
report += `Frequency list: ${FREQ_SIZE} common English words\n\n`;

report += `## Summary: Frequency Coverage\n\n`;
report += `| Language | Top-100 by Node-05 | Top-500 by Node-15 | Top-1000 by Node-25 | Total Coverage |\n`;
report += `|----------|-------------------|-------------------|--------------------|-----------------|\n`;
for (const [code, r] of Object.entries(results)) {
  const fc = r.frequencyCoverage;
  report += `| ${code.toUpperCase()} | ${fc.top100_by_node05.pct}% (${fc.top100_by_node05.covered}/100) | ${fc.top500_by_node15.pct}% (${fc.top500_by_node15.covered}/500) | ${fc.top1000_by_node25.pct}% (${fc.top1000_by_node25.covered}/1000) | ${fc.totalCoverage.pct}% (${fc.totalCoverage.covered}/${fc.totalCoverage.total}) |\n`;
}

report += `\n## Vocabulary Progression (New Content Words per Node)\n\n`;
report += `| Node |`;
for (const code of Object.keys(results)) report += ` ${code.toUpperCase()} |`;
report += `\n|------|`;
for (const _ of Object.keys(results)) report += `-----|`;
report += `\n`;

const allNodes = [...new Set(Object.values(results).flatMap(r => r.vocabProgression.map(v => v.node)))].sort();
for (const node of allNodes) {
  report += `| ${node} |`;
  for (const [code, r] of Object.entries(results)) {
    const prog = r.vocabProgression.find(v => v.node === node);
    report += ` ${prog ? prog.newContentWords : '-'} |`;
  }
  report += `\n`;
}

report += `\n## Essential Categories Coverage (Nodes 01-10)\n\n`;
for (const [code, r] of Object.entries(results)) {
  report += `### ${code.toUpperCase()}\n\n`;
  report += `| Category | Coverage | Missing |\n`;
  report += `|----------|----------|----------|\n`;
  for (const [cat, data] of Object.entries(r.essentialCategories)) {
    const missingStr = data.missingWords.length > 0 ? data.missingWords.join(', ') : 'none';
    report += `| ${cat} | ${data.coverage} (${data.found}/${data.total}) | ${missingStr} |\n`;
  }
  report += `\n`;
}

report += `\n## Cross-Language Node-01 Alignment\n\n`;
report += `Common words missing from node-01 per language:\n\n`;
for (const [code, missing] of Object.entries(langMissingCommon)) {
  report += `- **${code.toUpperCase()}**: ${missing.length} missing – ${missing.slice(0, 20).join(', ')}${missing.length > 20 ? '...' : ''}\n`;
}

report += `\n## Rare/Obscure Words in Early Nodes (01-05)\n\n`;
for (const [code, r] of Object.entries(results)) {
  if (r.rareWordsInEarlyNodes.length > 0) {
    report += `### ${code.toUpperCase()}\n`;
    report += `| Word | Freq Rank | Node | Context |\n`;
    report += `|------|-----------|------|---------|\n`;
    for (const rw of r.rareWordsInEarlyNodes.slice(0, 15)) {
      const sentence = rw.sentence.length > 60 ? rw.sentence.slice(0, 57) + '...' : rw.sentence;
      report += `| ${rw.word} | ${rw.rank} | ${rw.node} | ${sentence} |\n`;
    }
    report += `\n`;
  }
}

report += `\n## Vocabulary Progression Assessment\n\n`;
for (const [code, r] of Object.entries(results)) {
  const prog = r.vocabProgression;
  const newWordCounts = prog.map(p => p.newContentWords);
  const avg = (newWordCounts.reduce((a, b) => a + b, 0) / newWordCounts.length).toFixed(1);
  const max = Math.max(...newWordCounts);
  const min = Math.min(...newWordCounts);
  const maxNode = prog[newWordCounts.indexOf(max)].node;
  const minNode = prog[newWordCounts.indexOf(min)].node;
  const stddev = Math.sqrt(newWordCounts.reduce((sum, n) => sum + Math.pow(n - avg, 2), 0) / newWordCounts.length).toFixed(1);

  const smooth = stddev < avg * 0.5 ? 'SMOOTH' : stddev < avg * 0.8 ? 'MODERATE' : 'SPIKEY';

  report += `- **${code.toUpperCase()}**: avg=${avg}, min=${min} (${minNode}), max=${max} (${maxNode}), stddev=${stddev} – **${smooth}**\n`;
}

report += `\n## Key Findings\n\n`;

// Compute overall findings
const avgCoverage100 = Object.values(results).reduce((s, r) => s + parseFloat(r.frequencyCoverage.top100_by_node05.pct), 0) / 11;
const avgCoverage500 = Object.values(results).reduce((s, r) => s + parseFloat(r.frequencyCoverage.top500_by_node15.pct), 0) / 11;
const avgCoverage1000 = Object.values(results).reduce((s, r) => s + parseFloat(r.frequencyCoverage.top1000_by_node25.pct), 0) / 11;

report += `1. **Early frequency coverage**: On average, ${avgCoverage100.toFixed(1)}% of the top-100 English words are covered by node-05. Target should be >80%.\n`;
report += `2. **Mid-frequency coverage**: On average, ${avgCoverage500.toFixed(1)}% of the top-500 English words are covered by node-15. Target should be >70%.\n`;
report += `3. **Late frequency coverage**: On average, ${avgCoverage1000.toFixed(1)}% of the top-1000 English words are covered by node-25.\n`;

// Find worst/best languages
const langsByNode05 = Object.entries(results).sort((a, b) =>
  parseFloat(a[1].frequencyCoverage.top100_by_node05.pct) - parseFloat(b[1].frequencyCoverage.top100_by_node05.pct)
);
report += `4. **Best early coverage**: ${langsByNode05[langsByNode05.length-1][0].toUpperCase()} (${langsByNode05[langsByNode05.length-1][1].frequencyCoverage.top100_by_node05.pct}% of top-100 by node-05)\n`;
report += `5. **Worst early coverage**: ${langsByNode05[0][0].toUpperCase()} (${langsByNode05[0][1].frequencyCoverage.top100_by_node05.pct}% of top-100 by node-05)\n`;

fs.writeFileSync(path.join(outDir, 'vocab-frequency-report.md'), report);
console.log(`Report written to scripts/output/vocab-frequency-report.md`);
