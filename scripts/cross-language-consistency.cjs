#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA = path.join(ROOT, 'src', 'data');
const OUT = path.join(__dirname, 'output');

const LANGUAGES = [
  { key: 'spanish',    code: 'es' },
  { key: 'italian',    code: 'it' },
  { key: 'french',     code: 'fr' },
  { key: 'portuguese', code: 'pt' },
  { key: 'german',     code: 'de' },
  { key: 'dutch',      code: 'nl' },
  { key: 'swedish',    code: 'sv' },
  { key: 'welsh',      code: 'cy' },
  { key: 'hindi',      code: 'hi' },
  { key: 'turkish',    code: 'tr' },
  { key: 'russian',    code: 'ru' },
];

// ── Topic classification patterns ──────────────────────────────────────
const TOPIC_PATTERNS = {
  GREETING: /\b(hello|hi there|good morning|good afternoon|good evening|good night|goodbye|bye|nice to meet|how are you|pleased to meet|welcome)\b/i,
  FOOD_DRINK: /\b(eat|eats|eating|ate|drink|drinks|drinking|drank|food|water|coffee|tea|restaurant|hungry|thirsty|cook|cooks|cooking|meal|breakfast|lunch|dinner|bread|rice|fruit|vegetable|sugar|salt|pepper|cheese|meat|fish|chicken|wine|beer|juice|milk|cake|soup|pizza|egg|apple|orange|banana)\b/i,
  DIRECTIONS: /\b(where is|how to get|how do I get|station|airport|bus|train|taxi|left|right|near|far|map|street|road|corner|straight|turn|direction|north|south|east|west|address|route|downtown|city center|across|next to|in front|behind)\b/i,
  SHOPPING: /\b(buy|buys|bought|price|cost|costs|how much|shop|store|market|cheap|expensive|pay|pays|paying|paid|money|euro|dollar|discount|sale|receipt|credit card|cash)\b/i,
  FAMILY: /\b(mother|father|brother|sister|family|children|son|daughter|husband|wife|parents|grandm|grandf|grandp|uncle|aunt|cousin|nephew|niece|sibling|baby|kid|child|relative|married|wedding|spouse)\b/i,
  TIME_NUMBERS: /\b(time|o'clock|day|week|month|year|today|tomorrow|yesterday|hour|minute|second|monday|tuesday|wednesday|thursday|friday|saturday|sunday|january|february|march|april|may|june|july|august|september|october|november|december|morning|afternoon|evening|night|noon|midnight|one|two|three|four|five|six|seven|eight|nine|ten|first|second|third|once|twice|soon|later|early|late|always|never|often|sometimes|usually|rarely|daily|weekly|monthly|already|ago|number|calendar|date|clock|schedule)\b/i,
  DAILY_ROUTINE: /\b(wake up|wakes up|sleep|sleeps|sleeping|slept|work|works|working|school|study|studies|studying|read|reads|reading|write|writes|writing|exercise|exercises|exercising|shower|brush|teeth|dress|dressed|commute|office|homework|class|lesson|learn|practice|routine)\b/i,
  WEATHER: /\b(weather|rain|rains|raining|rainy|sun|sunny|sunshine|cold|hot|warm|snow|snows|snowing|snowy|wind|windy|cloud|cloudy|fog|foggy|storm|stormy|temperature|degree|forecast|humid|dry|freeze|freezing|ice|icy)\b/i,
  HEALTH: /\b(doctor|hospital|sick|medicine|pain|help|emergency|nurse|pharmacy|headache|fever|cough|flu|allergy|appointment|health|healthy|ill|illness|hurt|hurts|injured|injury|ambulance|dentist|symptom|prescription|vaccine|operation|surgery)\b/i,
  DESCRIPTION: /\b(beautiful|pretty|ugly|big|small|large|tiny|old|new|good|bad|nice|color|colour|red|blue|green|yellow|white|black|pink|purple|brown|grey|gray|orange|tall|short|long|wide|narrow|thick|thin|heavy|light|fast|slow|bright|dark|clean|dirty|soft|hard|strong|weak|loud|quiet|young|modern|ancient|wonderful|terrible|amazing|awful|fantastic|horrible|excellent|perfect|important|dangerous|safe|strange|normal|famous|favorite|favourite)\b/i,
  INTRODUCTION: /\b(my name|name is|i am from|come from|i live|i speak|language|country|nationality|born|origin|hometown|profession|occupation|job|what do you do|where are you from|introduce|pleased to meet)\b/i,
};

// ── Basic 1000-word English list (simplified) ──────────────────────────
// A representative basic vocabulary list (top ~1000 most frequent English words)
const BASIC_WORDS = new Set([
  'the','be','to','of','and','a','in','that','have','i','it','for','not','on','with',
  'he','as','you','do','at','this','but','his','by','from','they','we','her','she','or',
  'an','will','my','one','all','would','there','their','what','so','up','out','if','about',
  'who','get','which','go','me','when','make','can','like','time','no','just','him','know',
  'take','people','into','year','your','good','some','could','them','see','other','than',
  'then','now','look','only','come','its','over','think','also','back','after','use','two',
  'how','our','work','first','well','way','even','new','want','because','any','these','give',
  'day','most','us','is','are','was','were','been','being','am','has','had','having','does',
  'did','doing','say','said','says','go','goes','went','gone','going','get','gets','got',
  'getting','make','makes','made','making','know','knows','knew','known','knowing',
  'think','thinks','thought','thinking','take','takes','took','taken','taking',
  'see','sees','saw','seen','seeing','come','comes','came','coming',
  'want','wants','wanted','wanting','look','looks','looked','looking',
  'use','uses','used','using','find','finds','found','finding',
  'give','gives','gave','given','giving','tell','tells','told','telling',
  'ask','asks','asked','asking','try','tries','tried','trying',
  'need','needs','needed','needing','feel','feels','felt','feeling',
  'become','becomes','became','becoming','leave','leaves','left','leaving',
  'put','puts','putting','mean','means','meant','meaning',
  'keep','keeps','kept','keeping','let','lets','letting',
  'begin','begins','began','begun','beginning',
  'show','shows','showed','shown','showing',
  'hear','hears','heard','hearing','play','plays','played','playing',
  'run','runs','ran','running','move','moves','moved','moving',
  'live','lives','lived','living','believe','believes','believed','believing',
  'bring','brings','brought','bringing','happen','happens','happened','happening',
  'write','writes','wrote','written','writing',
  'sit','sits','sat','sitting','stand','stands','stood','standing',
  'lose','loses','lost','losing','pay','pays','paid','paying',
  'meet','meets','met','meeting','include','includes','included','including',
  'continue','continues','continued','continuing',
  'set','sets','setting','learn','learns','learned','learning',
  'change','changes','changed','changing','lead','leads','led','leading',
  'understand','understands','understood','understanding',
  'watch','watches','watched','watching','follow','follows','followed','following',
  'stop','stops','stopped','stopping','create','creates','created','creating',
  'speak','speaks','spoke','spoken','speaking',
  'read','reads','reading','allow','allows','allowed','allowing',
  'add','adds','added','adding','spend','spends','spent','spending',
  'grow','grows','grew','grown','growing','open','opens','opened','opening',
  'walk','walks','walked','walking','win','wins','won','winning',
  'offer','offers','offered','offering','remember','remembers','remembered','remembering',
  'love','loves','loved','loving','consider','considers','considered','considering',
  'appear','appears','appeared','appearing','buy','buys','bought','buying',
  'wait','waits','waited','waiting','serve','serves','served','serving',
  'die','dies','died','dying','send','sends','sent','sending',
  'expect','expects','expected','expecting','build','builds','built','building',
  'stay','stays','stayed','staying','fall','falls','fell','fallen','falling',
  'cut','cuts','cutting','reach','reaches','reached','reaching',
  'kill','kills','killed','killing','remain','remains','remained','remaining',
  'suggest','suggests','suggested','suggesting',
  'raise','raises','raised','raising','pass','passes','passed','passing',
  'sell','sells','sold','selling','require','requires','required','requiring',
  'report','reports','reported','reporting','decide','decides','decided','deciding',
  'pull','pulls','pulled','pulling','develop','develops','developed','developing',
  'eat','eats','ate','eaten','eating','drink','drinks','drank','drunk','drinking',
  'sleep','sleeps','slept','sleeping','sing','sings','sang','sung','singing',
  'drive','drives','drove','driven','driving','fly','flies','flew','flown','flying',
  'swim','swims','swam','swum','swimming','draw','draws','drew','drawn','drawing',
  'teach','teaches','taught','teaching','carry','carries','carried','carrying',
  'wear','wears','wore','worn','wearing','break','breaks','broke','broken','breaking',
  'hold','holds','held','holding','close','closes','closed','closing',
  'call','calls','called','calling','help','helps','helped','helping',
  'talk','talks','talked','talking','turn','turns','turned','turning',
  'start','starts','started','starting','might','may','shall','should','must',
  'will','would','can','could',
  // Nouns
  'man','woman','child','children','boy','girl','baby','person','people','friend',
  'family','mother','father','brother','sister','son','daughter','husband','wife',
  'parents','home','house','room','door','window','table','chair','bed','car',
  'bus','train','plane','boat','street','road','city','town','country','school',
  'book','phone','water','food','money','hand','head','eye','face','body',
  'heart','life','world','name','place','part','case','group','problem','fact',
  'company','number','point','story','question','word','side','area','night',
  'morning','afternoon','evening','end','line','thing','idea','right','left',
  'dog','cat','tree','garden','park','office','shop','store','market','restaurant',
  'coffee','tea','milk','bread','egg','meat','fish','fruit','rice','sugar','salt',
  'doctor','teacher','student','music','game','sport','team','movie','picture',
  'color','colour','red','blue','green','yellow','white','black',
  // Adjectives
  'big','small','old','new','good','bad','great','little','long','high','young',
  'large','important','different','same','early','late','last','next','right','left',
  'best','better','sure','free','nice','beautiful','happy','easy','hard',
  'hot','cold','warm','clean','clear','fast','slow','strong','simple',
  // Adverbs/prepositions/etc
  'very','really','too','here','there','where','when','why','how','much','many',
  'more','less','still','already','always','never','often','sometimes','usually',
  'again','together','away','off','down','under','above','between','before','after',
  'during','without','around','near','far','inside','outside','again','enough',
  'every','each','both','few','several','another','own','same','different',
  'yes','no','not','please','thank','thanks','sorry','hello','hi','goodbye','bye',
  'today','tomorrow','yesterday','week','month','year','hour','minute',
]);

// ── Advanced grammar topic keywords ────────────────────────────────────
const BASIC_GRAMMAR_KEYWORDS = /\b(present tense|present simple|basic|beginner|simple sentence|vocabulary|noun|pronoun|article|definite|indefinite|plural|singular|gender|greeting|introduction|common phrase|everyday|regular verb|conjugat|agreement|word order|subject|object|adjective|adverb|preposition)\b/i;
const ADVANCED_GRAMMAR_KEYWORDS = /\b(subjunctive|passive|passive voice|conditional|perfect|pluperfect|future perfect|past perfect|relative clause|complex clause|subordinate|gerund|participle|infinitive clause|reported speech|indirect speech|causative|impersonal|literary|formal register|hypothetical|contrary to fact|wish|counterfactual|modal perfect|double object|cleft sentence|topicalization|nominalization|voice|aspect)\b/i;

// ── Load all decks ─────────────────────────────────────────────────────
function loadDecks() {
  const decks = {};
  for (const lang of LANGUAGES) {
    const fp = path.join(DATA, lang.key, 'deck.json');
    decks[lang.key] = JSON.parse(fs.readFileSync(fp, 'utf8'));
  }
  return decks;
}

// ── 1. Topic Coverage at Node-01 ───────────────────────────────────────
function analyzeTopicCoverage(decks) {
  const TOPICS = Object.keys(TOPIC_PATTERNS);
  const matrix = {};
  const flags = [];

  for (const lang of LANGUAGES) {
    const node01 = decks[lang.key].filter(c => c.grammarNode === 'node-01');
    matrix[lang.key] = {};
    for (const t of TOPICS) matrix[lang.key][t] = 0;
    matrix[lang.key].OTHER = 0;

    for (const card of node01) {
      const eng = card.english || '';
      let matched = false;
      for (const t of TOPICS) {
        if (TOPIC_PATTERNS[t].test(eng)) {
          matrix[lang.key][t]++;
          matched = true;
        }
      }
      if (!matched) matrix[lang.key].OTHER++;
    }
  }

  // Flag topics with 0 in one lang but 5+ in others
  const allTopics = [...TOPICS, 'OTHER'];
  for (const t of allTopics) {
    const counts = LANGUAGES.map(l => ({ lang: l.key, count: matrix[l.key][t] }));
    const maxCount = Math.max(...counts.map(c => c.count));
    for (const c of counts) {
      if (c.count === 0 && maxCount >= 5) {
        flags.push({ topic: t, language: c.lang, count: 0, maxInOthers: maxCount });
      }
    }
  }

  return { matrix, flags };
}

// ── 2. Card Count Balance Per Node ─────────────────────────────────────
function analyzeCardCountBalance(decks) {
  const nodes = [];
  for (let i = 1; i <= 35; i++) nodes.push(`node-${String(i).padStart(2, '0')}`);

  const table = {};
  const flags = [];

  for (const node of nodes) {
    table[node] = {};
    for (const lang of LANGUAGES) {
      table[node][lang.key] = decks[lang.key].filter(c => c.grammarNode === node).length;
    }
    const counts = Object.values(table[node]);
    const min = Math.min(...counts);
    const max = Math.max(...counts);
    const range = max - min;
    if (range > 100) {
      const minLang = LANGUAGES.find(l => table[node][l.key] === min).key;
      const maxLang = LANGUAGES.find(l => table[node][l.key] === max).key;
      flags.push({ node, range, min, minLang, max, maxLang });
    }
  }

  return { table, flags };
}

// ── 3. Vocabulary Level Progression ────────────────────────────────────
function analyzeVocabProgression(decks) {
  const nodes = [];
  for (let i = 1; i <= 35; i++) nodes.push(`node-${String(i).padStart(2, '0')}`);

  const results = {};
  const flags = [];

  for (const lang of LANGUAGES) {
    results[lang.key] = {};
    let prevPct = -1;
    let nonMonotonic = false;

    for (const node of nodes) {
      const cards = decks[lang.key].filter(c => c.grammarNode === node);
      if (cards.length === 0) {
        results[lang.key][node] = { totalWords: 0, basicWords: 0, basicPct: 0 };
        continue;
      }

      let totalWords = 0;
      let basicCount = 0;
      for (const card of cards) {
        const words = (card.english || '').toLowerCase().replace(/[^a-z' ]/g, ' ').split(/\s+/).filter(Boolean);
        for (const w of words) {
          totalWords++;
          if (BASIC_WORDS.has(w)) basicCount++;
        }
      }

      const pct = totalWords > 0 ? Math.round((basicCount / totalWords) * 1000) / 10 : 0;
      results[lang.key][node] = { totalWords, basicWords: basicCount, basicPct: pct };

      // Check monotonicity: basic % should generally decrease as nodes increase
      // We check if there's a significant increase (>5pp) compared to previous
      if (prevPct >= 0 && pct > prevPct + 5) {
        nonMonotonic = true;
      }
      prevPct = pct;
    }

    if (nonMonotonic) {
      flags.push({ language: lang.key, note: 'Basic word % does not consistently decrease across nodes' });
    }
  }

  return { results, flags };
}

// ── 4. Grammar Tip Topic Alignment ─────────────────────────────────────
function analyzeGrammarTipAlignment(decks) {
  const flags = [];

  for (const lang of LANGUAGES) {
    // Node-01 tips
    const node01 = decks[lang.key].filter(c => c.grammarNode === 'node-01' && c.grammar && c.grammar.trim());
    const earlyAdvanced = [];
    for (const card of node01) {
      if (ADVANCED_GRAMMAR_KEYWORDS.test(card.grammar)) {
        earlyAdvanced.push({ id: card.id, tip: card.grammar.slice(0, 80) });
      }
    }
    if (earlyAdvanced.length > 0) {
      flags.push({
        language: lang.key,
        issue: 'advanced_grammar_in_node01',
        count: earlyAdvanced.length,
        examples: earlyAdvanced.slice(0, 3),
      });
    }

    // Node 30+ tips
    const lateNodes = decks[lang.key].filter(c => {
      const n = parseInt((c.grammarNode || '').replace('node-', ''), 10);
      return n >= 30 && c.grammar && c.grammar.trim();
    });
    let advancedCount = 0;
    let basicOnlyCount = 0;
    for (const card of lateNodes) {
      if (ADVANCED_GRAMMAR_KEYWORDS.test(card.grammar)) advancedCount++;
      else if (BASIC_GRAMMAR_KEYWORDS.test(card.grammar) && !ADVANCED_GRAMMAR_KEYWORDS.test(card.grammar)) basicOnlyCount++;
    }

    // Summary per language
    const node01BasicTips = node01.filter(c => BASIC_GRAMMAR_KEYWORDS.test(c.grammar)).length;
    flags.push({
      language: lang.key,
      issue: 'grammar_tip_summary',
      node01_total_tips: node01.length,
      node01_basic_topic_tips: node01BasicTips,
      node30plus_total_tips: lateNodes.length,
      node30plus_advanced_tips: advancedCount,
      node30plus_basic_only_tips: basicOnlyCount,
    });
  }

  return { flags };
}

// ── Main ───────────────────────────────────────────────────────────────
function main() {
  console.log('Loading decks...');
  const decks = loadDecks();

  console.log('\n========================================');
  console.log('  CROSS-LANGUAGE CONSISTENCY ANALYSIS');
  console.log('========================================\n');

  // 1. Topic Coverage
  console.log('--- 1. TOPIC COVERAGE AT NODE-01 ---\n');
  const topicResult = analyzeTopicCoverage(decks);

  // Print matrix
  const TOPICS = [...Object.keys(TOPIC_PATTERNS), 'OTHER'];
  const header = ['Language', ...TOPICS.map(t => t.slice(0, 8))];
  console.log(header.map(h => h.padEnd(10)).join(''));
  console.log('-'.repeat(header.length * 10));
  for (const lang of LANGUAGES) {
    const row = [lang.key.slice(0, 10).padEnd(10)];
    for (const t of TOPICS) {
      row.push(String(topicResult.matrix[lang.key][t]).padEnd(10));
    }
    console.log(row.join(''));
  }

  if (topicResult.flags.length > 0) {
    console.log('\nFLAGS (0 cards where others have 5+):');
    for (const f of topicResult.flags) {
      console.log(`  ! ${f.language} has 0 "${f.topic}" cards (max in others: ${f.maxInOthers})`);
    }
  } else {
    console.log('\nNo missing topic flags.');
  }

  // 2. Card Count Balance
  console.log('\n\n--- 2. CARD COUNT BALANCE PER NODE ---\n');
  const balanceResult = analyzeCardCountBalance(decks);

  // Print compact table
  const nodeHeader = ['Node', ...LANGUAGES.map(l => l.code)];
  console.log(nodeHeader.map(h => h.padEnd(6)).join(''));
  console.log('-'.repeat(nodeHeader.length * 6));
  for (let i = 1; i <= 35; i++) {
    const node = `node-${String(i).padStart(2, '0')}`;
    const row = [node.replace('node-', '').padEnd(6)];
    for (const lang of LANGUAGES) {
      row.push(String(balanceResult.table[node][lang.key]).padEnd(6));
    }
    const counts = LANGUAGES.map(l => balanceResult.table[node][l.key]);
    const range = Math.max(...counts) - Math.min(...counts);
    if (range > 100) row.push(' *** FLAGGED');
    console.log(row.join(''));
  }

  if (balanceResult.flags.length > 0) {
    console.log('\nFLAGS (range > 100):');
    for (const f of balanceResult.flags) {
      console.log(`  ! ${f.node}: range=${f.range} (min=${f.min} in ${f.minLang}, max=${f.max} in ${f.maxLang})`);
    }
  } else {
    console.log('\nNo card count imbalance flags.');
  }

  // 3. Vocab Progression
  console.log('\n\n--- 3. VOCABULARY LEVEL PROGRESSION ---\n');
  const vocabResult = analyzeVocabProgression(decks);

  // Print basic % per node for each language (compact: first/mid/last nodes)
  const sampleNodes = ['node-01', 'node-05', 'node-10', 'node-15', 'node-20', 'node-25', 'node-30', 'node-35'];
  const vpHeader = ['Language', ...sampleNodes.map(n => n.replace('node-', 'N'))];
  console.log(vpHeader.map(h => h.padEnd(10)).join(''));
  console.log('-'.repeat(vpHeader.length * 10));
  for (const lang of LANGUAGES) {
    const row = [lang.key.slice(0, 10).padEnd(10)];
    for (const n of sampleNodes) {
      const d = vocabResult.results[lang.key][n];
      row.push(d ? (d.basicPct + '%').padEnd(10) : 'N/A'.padEnd(10));
    }
    console.log(row.join(''));
  }

  if (vocabResult.flags.length > 0) {
    console.log('\nFLAGS (non-monotonic progression):');
    for (const f of vocabResult.flags) {
      console.log(`  ! ${f.language}: ${f.note}`);
    }
  } else {
    console.log('\nAll languages show monotonic basic-word progression.');
  }

  // 4. Grammar Tip Alignment
  console.log('\n\n--- 4. GRAMMAR TIP TOPIC ALIGNMENT ---\n');
  const grammarResult = analyzeGrammarTipAlignment(decks);

  const advIssues = grammarResult.flags.filter(f => f.issue === 'advanced_grammar_in_node01');
  if (advIssues.length > 0) {
    console.log('ADVANCED GRAMMAR IN EARLY NODES:');
    for (const f of advIssues) {
      console.log(`  ! ${f.language}: ${f.count} node-01 tips mention advanced topics`);
      for (const ex of f.examples) {
        console.log(`      "${ex.tip}..."`);
      }
    }
  } else {
    console.log('No advanced grammar topics found in node-01 tips.');
  }

  console.log('\nGRAMMAR TIP SUMMARY PER LANGUAGE:');
  console.log('Language     N01-Tips  N01-Basic  N30+-Tips  N30+-Adv  N30+-BasicOnly');
  console.log('-'.repeat(75));
  const summaries = grammarResult.flags.filter(f => f.issue === 'grammar_tip_summary');
  for (const s of summaries) {
    console.log(
      `${s.language.padEnd(13)}${String(s.node01_total_tips).padEnd(10)}${String(s.node01_basic_topic_tips).padEnd(11)}` +
      `${String(s.node30plus_total_tips).padEnd(11)}${String(s.node30plus_advanced_tips).padEnd(10)}${s.node30plus_basic_only_tips}`
    );
  }

  // ── Write JSON output ────────────────────────────────────────────────
  const output = {
    generatedAt: new Date().toISOString(),
    topicCoverage: topicResult,
    cardCountBalance: balanceResult,
    vocabProgression: vocabResult,
    grammarTipAlignment: grammarResult,
  };

  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'cross-language-consistency.json'), JSON.stringify(output, null, 2));
  console.log(`\nResults written to scripts/output/cross-language-consistency.json`);
}

main();
