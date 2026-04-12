import { readFileSync, writeFileSync } from 'fs';

// Read CSV
const raw = readFileSync('curriculum.csv', 'utf-8');
const lines = raw.split('\n').filter(l => l.trim());
const header = lines[0];
const rows = lines.slice(1);

// Parse CSV (handle quoted fields)
function parseCSV(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') {
      inQuotes = !inQuotes;
    } else if (line[i] === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += line[i];
    }
  }
  fields.push(current.trim());
  return fields;
}

// Extract main English column (index 2) from each row
const sentences = rows.map((row, idx) => {
  const fields = parseCSV(row);
  return {
    originalIndex: idx,
    v1: fields[0] || '',
    v2: fields[1] || '',
    english: fields[2] || '',
    turkish: fields[3] || '',
    swedish: fields[4] || '',
    farsi: fields[5] || '',
    hindi: fields[6] || '',
    rawLine: row,
  };
});

// ====== TOPIC DEFINITIONS ======
// Each topic has keywords/patterns to match and a difficulty tier
// ====== REDESIGNED CURRICULUM TOPICS ======
// Based on CEFR progression + practical language learning needs
// Fewer, broader categories that reflect how people actually learn a language
const topics = [
  // === A0: SURVIVAL ===
  {
    id: 'survival',
    name: '1. Survival Phrases',
    tier: 'Foundation',
    patterns: [],
    manual: true, // greetings, yes/no, numbers, emergency basics
  },

  // === A1: ABOUT ME & PEOPLE ===
  {
    id: 'about_me',
    name: '2. About Me',
    tier: 'Novice',
    patterns: [
      /^I am /i,
      /^my name/i,
      /^I (live|work|study|come from|speak|have|do not have)/i,
      /^(do I|am I) /i,
    ],
  },
  {
    id: 'people',
    name: '3. People & Family',
    tier: 'Novice',
    patterns: [
      /\b(mother|father|brother|sister|parent|parents|family|son|daughter|husband|wife|uncle|aunt|cousin|grandma|grandfather|grandmother|grandpa|baby|child|children|kid|kids|nephew|niece|friend|friends|neighbor|neighbours|colleague|boss|teacher|student|classmate|roommate|partner)\b/i,
      /\b(wedding|marriage|married|born|birthday|pregnant|divorced|single|engaged)\b/i,
      /^(he is (my|a)|she is (my|a)|they are (my|our))/i,
    ],
  },
  {
    id: 'descriptions',
    name: '4. Describing People & Things',
    tier: 'Novice',
    patterns: [
      /^(you are|he is|she is|we are|they are|it is) /i,
      /^(he has|she has|they have|we have|you have) /i,
      /^(does he|does she|do they|do we|do you) /i,
      /^(he does not|she does not|they do not|we do not|you do not) /i,
      /^(his name|her name|their name)/i,
      /^(he lives|she lives|they live|we live|you live)/i,
      /^(he works|she works|they work|we work|you work)/i,
    ],
  },

  // === A1: DAILY LIFE ===
  {
    id: 'daily_life',
    name: '5. Daily Routines',
    tier: 'Beginner',
    patterns: [
      /\b(wake up|wakes up|go to (work|school|gym|bed|park|the club)|goes to (work|school|gym|bed)|sleep|sleeps|walk|walks|run|runs|sit|sits|stand|stands|wait|waits|carry|carries|clean|cleans|wash|washes)\b/i,
      /\b(every (morning|day|night|week))\b/i,
      /\b(brush|comb|shower|shave|dress|get dressed|get up|get ready|take a shower|do the dishes|do laundry|vacuum|sweep|mop|iron|fold)\b/i,
      /\b(read|reads|write|writes|watch|watches|listen|listens|play|plays|study|studies|practice|use|uses|check|checks|start|starts|finish|finishes|open|opens|close|closes|turn on|turn off|put|puts|keep|keeps|cut|cuts|send|sends)\b/i,
      /\b(television|TV|computer|phone|video games?|messages?|email|internet|website)\b/i,
      /\b(can |cannot |can't )(speak|show|help|visit|stay|hear|borrow|see|do|make|come|go|take|give|find)/i,
      /\b(ask|asks|solve|solves|visit|visits|sign|signs|need|needs|see|sees)\b/i,
      /\b(stay|stays|staying) (at home|home|here|there)/i,
    ],
  },
  {
    id: 'food',
    name: '6. Food & Drink',
    tier: 'Beginner',
    patterns: [
      /\b(eat|eats|eating|drink|drinks|drinking|breakfast|lunch|dinner|supper|snack|coffee|tea|water|milk|bread|rice|chicken|fish|soup|pasta|noodle|fruit|cheese|eggs?|salad|sandwich|cake|sugar|salt|pepper|butter|jam|honey|olive|pizza|tomato|onion|garlic|lemon|potato|potatoes|carrot|orange|apple|banana|grape|strawberry|vegetable|vegetables|meat|beef|pork|lamb|shrimp|lobster|pie|cookie|chocolate|ice cream|juice|beer|wine|soda|flour|dough|sauce|vinegar|spice|herb|cinnamon|vanilla|chili|watermelon|mango|peach|cherry|plum|pear|nut|almond|peanut|walnut|mushroom|cucumber|lettuce|corn|bean|beans|pea|peas|spinach|broccoli|avocado|coconut|yogurt|cream|cereal)\b/i,
      /\b(hungry|thirsty|full|cook|cooks|cooking|cooked|meal|meals|menu|order|orders|food|recipe|ingredient|bake|baked|fry|fried|boil|boiled|grill|grilled|slice|sliced|chop|chopped|peel|peels|stir|pour|mix|taste|tastes|delicious|serve|serves|plate|bowl|cup|glass|fork|knife|spoon|pot|pan|cutting board)\b/i,
    ],
  },
  {
    id: 'time',
    name: '7. Time & Days',
    tier: 'Beginner',
    patterns: [
      /\b(o'clock|morning|afternoon|evening|night|today|yesterday|monday|tuesday|wednesday|thursday|friday|saturday|sunday|january|february|march|april|may|june|july|august|september|october|november|december|month|months|week|weeks|hour|hours|minute|minutes|second|seconds|noon|midnight|late|early|always|never|sometimes|usually|often|rarely|daily|weekly|yearly|annual)\b/i,
      /\b(schedule|appointment|meeting|class|lesson|shift|deadline|calendar|date|year|century|decade|era)\b/i,
      /\b(at \d|at half|at quarter|by \d|until \d|from \d|since \d)\b/i,
      /^(it is (one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve))/i,
    ],
  },
  {
    id: 'feelings',
    name: '8. Feelings & Emotions',
    tier: 'Beginner',
    patterns: [
      /\b(feel|feels|feeling|happy|sad|angry|tired|excited|nervous|calm|bored|proud|afraid|scared|worried|lonely|disappointed|frustrated|surprised|confident|grateful|stressed|anxious|confused|embarrassed|jealous|guilty|upset|cheerful|miserable|relieved|hopeful|hopeless|curious|amazed|annoyed|furious|terrified|delighted|satisfied|dissatisfied|comfortable|uncomfortable|relaxed|tense)\b/i,
      /\b(like|likes|love|loves|enjoy|enjoys|hate|hates|dislike|prefer|prefers|favorite|favourite|miss|misses|care|cares)\b/i,
    ],
  },

  // === A1-A2: THE WORLD AROUND ===
  {
    id: 'home',
    name: '9. Home & Living',
    tier: 'Elementary',
    patterns: [
      /\b(house|apartment|flat|room|rooms|kitchen|bedroom|bathroom|living room|dining room|hallway|attic|basement|garage|balcony|patio|yard|garden|door|window|wall|ceiling|floor|roof|stairs|fence|gate)\b/i,
      /\b(table|chair|sofa|couch|bed|fridge|refrigerator|stove|oven|microwave|lamp|mirror|shower|sink|toilet|towel|pillow|blanket|closet|wardrobe|shelf|cupboard|cabinet|carpet|rug|desk|drawer|curtain|bookshelf|furniture)\b/i,
      /\b(plant|plants|vase|painting|frame|clock|fan|heater|air conditioning|laundry|trash|garbage|recycling|decoration)\b/i,
      /^there (is|are) /i,
    ],
  },
  {
    id: 'places',
    name: '10. Places & Getting Around',
    tier: 'Elementary',
    patterns: [
      /\b(direction|directions|turn left|turn right|go straight|straight ahead|corner|block|intersection|entrance|exit|looking for|nearest|where is|where are|where can|how do (we|I) get|find the)\b/i,
      /\b(station|airport|bank|post office|police|museum|library|gym|pharmacy|supermarket|bakery|park|hotel|motel|hostel|restaurant|café|cafeteria|cinema|theater|theatre|church|mosque|temple|office|factory|university|college|school|dormitory|neighborhood|city|town|village|street|road|avenue|bridge|building|tower|plaza|square|mall|center|centre|campus|studio|club|stadium|arena)\b/i,
      /\b(next to|between|behind|in front of|near|nearby|across from|inside|outside|on top of|middle of|beside|opposite|along|toward|towards)\b/i,
      /\b(here|there|everywhere|somewhere|nowhere|upstairs|downstairs|left|right|north|south|east|west)\b/i,
    ],
  },
  {
    id: 'shopping',
    name: '11. Shopping & Money',
    tier: 'Elementary',
    patterns: [
      /\b(buy|buys|buying|bought|sell|sells|selling|sold|pay|pays|paying|paid|cost|costs|price|shop|shopping|store|stores|market|dollars?|euros?|pounds?|money|cheap|cheaper|expensive|cash|card|bill|receipt|discount|sale|refund|exchange|checkout|online|delivery|package|item|product|brand|size|return)\b/i,
      /^(how much|the price|I want to buy|I need to buy)/i,
      /\b(my|your|his|her|our|their) (phone|key|keys|wallet|bag|purse|backpack|passport|notebook|card|pen|pencil|laptop|charger|headphones|sunglasses|umbrella|watch|belt|coat|jacket|shoes|boots|hat|scarf|gloves|ring|necklace|bracelet|suitcase|luggage|camera|bottle|spare)\b/i,
    ],
  },
  {
    id: 'health',
    name: '12. Health & Body',
    tier: 'Elementary',
    patterns: [
      /\b(doctor|hospital|pharmacy|drugstore|medicine|medication|pill|nurse|clinic|ambulance|fever|cough|cold|flu|allergy|allergic|blood|prescription|emergency|surgery|injury|injured|wound|bandage|vaccine|symptom|diagnosis|treatment|therapy|recovery|health|healthy|sick|illness|disease|infection|diet|exercise|fitness|weight|muscle|pain|headache|backache|toothache|hurt|hurts)\b/i,
      /\b(body|head|face|eye|eyes|ear|ears|nose|mouth|teeth|tooth|tongue|lip|lips|neck|shoulder|shoulders|arm|arms|hand|hands|finger|fingers|chest|back|leg|legs|knee|knees|foot|feet|toe|toes|skin|hair|bone|bones|heart|lung|lungs|brain|stomach)\b/i,
    ],
  },
  {
    id: 'weather',
    name: '13. Weather & Nature',
    tier: 'Elementary',
    patterns: [
      /\b(weather|sunny|rain|rains|raining|rained|rainy|snow|snows|snowing|snowed|snowy|wind|windy|cloud|cloudy|storm|stormy|fog|foggy|freeze|freezing|sky|sun|sunrise|sunset|moon|moonlight|star|stars|rainbow|thunder|lightning|ice|icy|frost|humidity|humid|dry|degree|degrees|temperature|forecast|season|spring|summer|autumn|fall|winter)\b/i,
      /\b(tree|trees|flower|flowers|leaf|leaves|grass|bush|forest|woods|jungle|mountain|mountains|hill|valley|lake|river|stream|waterfall|ocean|sea|beach|coast|shore|island|desert|field|meadow|cliff|cave|rock|pond|swamp)\b/i,
      /\b(bird|birds|dog|dogs|cat|cats|horse|horses|cow|sheep|goat|duck|rabbit|deer|bear|wolf|lion|tiger|elephant|monkey|snake|insect|butterfly|bee|ant|spider|whale|dolphin|penguin|eagle|owl)\b/i,
    ],
  },

  // === A2: EXPANDING ===
  {
    id: 'transport',
    name: '14. Transport & Travel',
    tier: 'Intermediate',
    patterns: [
      /\b(bus|buses|train|trains|taxi|taxis|cab|car|cars|flight|flights|ferry|boat|boats|ship|airplane|plane|ticket|tickets|arrive|arrives|arriving|arrived|leave|leaves|leaving|depart|departs|departure|travel|travels|traveling|travelled|drive|drives|driving|drove|ride|rides|riding|rode|stop|stops|gate|platform|timetable|highway|freeway|motorway|lane|traffic|parking|trunk|wheel|engine|gas|fuel|petrol|diesel|passport|visa|luggage|suitcase|backpack|journey|trip|tour|destination|route|map|GPS|boarding|terminal|runway|pilot|captain|crew|seat|aisle|bicycle|bike|motorcycle|scooter|subway|metro|tram)\b/i,
    ],
  },
  {
    id: 'past',
    name: '15. Talking About the Past',
    tier: 'Intermediate',
    patterns: [
      /\b(yesterday|last (week|month|night|year|weekend|summer|spring|winter|autumn|fall|time|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Monday))\b/i,
      /\b(walked|talked|played|cooked|visited|painted|finished|danced|worked|watched|started|washed|waited|used|repaired|climbed|opened|closed|listened|shared|moved|smiled|helped|pushed|pulled|checked|saved|jumped|learned|answered|stayed|looked|arrived|enjoyed|asked|surprised|spent|practiced|decided|bought|took|laughed|felt|found|gave|made|said|told|went|came|saw|knew|thought|brought|sent|ran|wrote|broke|caught|chose|drew|drove|fell|flew|forgot|grew|held|hid|hit|kept|led|lost|met|paid|sang|sat|sold|spoke|stood|stole|swam|taught|threw|understood|woke|won|wore|changed|noticed|realized|remembered|recognized|returned|stopped|tried|turned|became|began|built|created|discovered|joined|appeared|received)\b/i,
      /\b(was|were) (able|born|built|called|caused|closed|considered|created|damaged|designed|destroyed|discovered|done|driven|eaten|expected|filled|forced|found|given|gone|grown|heard|held|helped|hit|hurt|included|introduced|invited|kept|known|left|lost|made|meant|met|moved|needed|offered|opened|organized|owned|placed|played|produced|protected|provided|raised|reached|received|recorded|reduced|removed|reported|required|returned|run|said|seen|sent|set|shown|sold|spoken|started|stopped|taken|thought|told|tried|turned|understood|used|wanted|watched|won|written)\b/i,
      /\b(ago|once|formerly|previously|back then|in the past|used to)\b/i,
    ],
  },
  {
    id: 'future',
    name: '16. Plans & Future',
    tier: 'Intermediate',
    patterns: [
      /\b(will |plan to|planning to|going to|might |hope to|next (week|month|year|summer|winter|spring|autumn|fall))\b/i,
      /\b(soon|later|intend|expect|expected|likely|set to|about to|bound to|aim to|goal)\b/i,
      /\b(are you planning|is expected|are expected|is set|is likely|is about|are likely|is shifting)\b/i,
      /\b(tomorrow)\b/i,
    ],
  },
  {
    id: 'comparisons',
    name: '17. Comparing & Describing',
    tier: 'Intermediate',
    patterns: [
      /\b(more |less |better|worse|faster|slower|bigger|smaller|taller|shorter|cheaper|most |least |best|worst|greater|fewer|higher|lower|wider|narrower|deeper|simpler|harder|easier|further|farther|closer|longer|newer|older|younger|stronger|weaker|brighter|darker|louder|quieter|thicker|thinner|richer|poorer|healthier|happier|sadder)\b/i,
      /\b(than |as \w+ as )\b/i,
      /\b(big|small|old|new|tall|short|long|fast|slow|heavy|light|strong|weak|clean|dirty|beautiful|ugly|loud|quiet|bright|dark|thick|thin|wide|narrow|deep|hard|soft|rough|smooth|sharp|dull|flat|round|empty|full|busy|free|simple|easy|difficult|important|famous|popular|common|rare|real|fake|modern|ancient|fresh|raw|ripe|sweet|sour|bitter|salty|spicy|plain|fancy|tiny|huge|enormous|massive|gentle|fierce|wild|brave|shy|generous|kind|cruel|polite|rude)\b/i,
      /\b(black|white|red|blue|green|yellow|brown|gray|grey|purple|pink|silver|golden)\b/i,
    ],
  },

  // === B1: COMPLEX LANGUAGE ===
  {
    id: 'opinions',
    name: '18. Opinions & Advice',
    tier: 'Advanced',
    patterns: [
      /\b(should|ought to|had better|make sure|remember to|it is worth|I suggest|I recommend|I believe|I think|I doubt|I am convinced|I am sure|I am certain|personally|in my opinion|in my view|from my perspective|must not|need to|have to)\b/i,
      /\b(agree|disagree|argue|claim|support|oppose|debate|discuss|consider|point out|admit|deny|insist|maintain|propose|object)\b/i,
    ],
  },
  {
    id: 'conditionals',
    name: '19. Hypotheticals & Conditions',
    tier: 'Advanced',
    patterns: [
      /\bif (I|you|he|she|we|they|it|this|that|the|there|my|your)\b/i,
      /\b(would |could |might ).+(if|when|unless)\b/i,
      /\b(were circumstances|were it not|had I|had we|had they|unless|provided that|as long as|on condition|in case|suppose|assuming|even if|what if)\b/i,
      /\b(I wish|if only|would have|could have|should have|might have)\b/i,
    ],
  },
  {
    id: 'news',
    name: '20. News & Current Affairs',
    tier: 'Advanced',
    patterns: [
      /\b(is said|is thought|is believed|is rumored|is reported|reportedly|allegedly|according to|it is often said|it has been suggested|authorities|officials|reports say|reports suggest|widely seen|is accused|supporters claim|critics say|locals believe|health officials|experts say|sources say|analysts)\b/i,
      /\b(environment|pollution|climate|economy|government|society|education|technology|energy|carbon|recycling|solar|trade|budget|tax|inflation|politics|election|healthcare|immigration|protest|scandal|merger|corruption|justice|democracy|freedom|rights|law|legal|illegal|crime|criminal|poverty|wealth|inequality|unemployment|industry|science|research|discovery|innovation|pandemic|crisis|conflict|war|peace|diplomacy|treaty|refugee|sustainability|CEO|minister|mayor|senator|president|parliament|congress|hacker|billion|million|athlete|actor|writer|evidence|organic farming|rainforest|coral reef|glacier|endangered species|gig workers|labor laws|public trust|transparency|power outage|electric trucks|wastewater|encryption|server|software|cathedral|telescope|contract|grant|application|management|staff|compromise)\b/i,
    ],
  },
  {
    id: 'nuance',
    name: '21. Nuance & Subtlety',
    tier: 'Advanced',
    patterns: [
      /\b(it seems|it appears|there seems|I wonder|I suspect|might be|may be|perhaps|I am inclined|it feels|could be|not entirely|not quite|not necessarily|to some extent|arguably|understandably|realistically|interestingly|encouragingly|frankly|honestly|technically|essentially|fundamentally|ironically|surprisingly|unfortunately|fortunately|ideally|presumably)\b/i,
      /\b(the (thing|reason|point|fact|problem|issue|question|challenge|key|focus) (is|was|we|that|to))\b/i,
      /\b(what (I find|we cannot|strikes me|matters|concerns|remains|stands out))\b/i,
      /\b(cannot afford|tend to|come across|at (a|the) (very|same))\b/i,
      /\b(I see your point|I understand|I hear what|let us think|that really depends|this entire|nothing is guaranteed|I do not fully|the discussion has|only after|not until|only through|only when|it was (a|the) (missed|cracked|loose|change|missing|mistake))\b/i,
      /\b(sorry|mistake|accidentally|meant to say|I apologize)\b/i,
      /\b(from another angle|off the main topic|drifted)\b/i,
    ],
  },
];

// ====== CATEGORIZE SENTENCES ======
function categorize(sent) {
  const text = sent.english;
  if (!text) return null;

  // Try each topic in order (first match wins due to priority ordering)
  for (const topic of topics) {
    if (topic.manual) continue;
    for (const pattern of topic.patterns) {
      if (pattern.test(text)) {
        return topic.id;
      }
    }
  }
  return 'uncategorized';
}

// Categorize all
sentences.forEach(s => {
  s.topic = categorize(s);
});

// ====== NEW FOUNDATIONAL SENTENCES ======
// These fill the gaps at the very beginning
const newSentences = [
  // Survival Phrases
  { english: 'Hello.', topic: 'survival' },
  { english: 'Hi.', topic: 'survival' },
  { english: 'Good morning.', topic: 'survival' },
  { english: 'Good afternoon.', topic: 'survival' },
  { english: 'Good evening.', topic: 'survival' },
  { english: 'Good night.', topic: 'survival' },
  { english: 'Goodbye.', topic: 'survival' },
  { english: 'See you later.', topic: 'survival' },
  { english: 'Yes.', topic: 'survival' },
  { english: 'No.', topic: 'survival' },
  { english: 'Please.', topic: 'survival' },
  { english: 'Thank you.', topic: 'survival' },
  { english: 'You are welcome.', topic: 'survival' },
  { english: 'Sorry.', topic: 'survival' },
  { english: 'Excuse me.', topic: 'survival' },
  { english: 'How are you?', topic: 'survival' },
  { english: 'I am fine.', topic: 'survival' },
  { english: 'Nice to meet you.', topic: 'survival' },
  { english: 'What is your name?', topic: 'survival' },
  { english: 'My name is Sara.', topic: 'survival' },
  { english: 'I do not understand.', topic: 'survival' },
  { english: 'Can you repeat that?', topic: 'survival' },
  { english: 'I do not speak Turkish.', topic: 'survival' },
  { english: 'Do you speak English?', topic: 'survival' },
  { english: 'How do you say this?', topic: 'survival' },
  { english: 'One.', topic: 'survival' },
  { english: 'Two.', topic: 'survival' },
  { english: 'Three.', topic: 'survival' },
  { english: 'Four.', topic: 'survival' },
  { english: 'Five.', topic: 'survival' },
  { english: 'Six.', topic: 'survival' },
  { english: 'Seven.', topic: 'survival' },
  { english: 'Eight.', topic: 'survival' },
  { english: 'Nine.', topic: 'survival' },
  { english: 'Ten.', topic: 'survival' },
];

// ====== BUILD RESTRUCTURED ORDER ======
// Topic order defines the curriculum progression
const topicOrder = topics.map(t => t.id);

// Group existing sentences by topic
const grouped = {};
topicOrder.forEach(id => { grouped[id] = []; });
grouped['uncategorized'] = [];

sentences.forEach(s => {
  if (s.topic && grouped[s.topic]) {
    grouped[s.topic].push(s);
  } else if (s.topic) {
    grouped['uncategorized'].push(s);
  }
});

// Build final ordered list
const ordered = [];
let orderNum = 1;

// First: new foundational sentences
newSentences.forEach(ns => {
  ordered.push({
    order: orderNum++,
    english: ns.english,
    topic: ns.topic,
    topicName: topics.find(t => t.id === ns.topic)?.name || ns.topic,
    tier: topics.find(t => t.id === ns.topic)?.tier || 'Foundation',
    isNew: true,
    originalIndex: -1,
  });
});

// Then: existing sentences in topic order
topicOrder.forEach(topicId => {
  if (topicId === 'survival') return; // already added manually
  const group = grouped[topicId] || [];
  // Sort within topic by original order (preserves natural complexity progression)
  group.sort((a, b) => a.originalIndex - b.originalIndex);
  group.forEach(s => {
    ordered.push({
      order: orderNum++,
      english: s.english,
      turkish: s.turkish,
      swedish: s.swedish,
      farsi: s.farsi,
      hindi: s.hindi,
      topic: topicId,
      topicName: topics.find(t => t.id === topicId)?.name || topicId,
      tier: topics.find(t => t.id === topicId)?.tier || 'Unknown',
      isNew: false,
      originalIndex: s.originalIndex,
    });
  });
});

// Add uncategorized at the end
grouped['uncategorized'].forEach(s => {
  ordered.push({
    order: orderNum++,
    english: s.english,
    turkish: s.turkish,
    swedish: s.swedish,
    farsi: s.farsi,
    hindi: s.hindi,
    topic: 'uncategorized',
    topicName: 'Uncategorized',
    tier: 'Review',
    isNew: false,
    originalIndex: s.originalIndex,
  });
});

// ====== OUTPUT RESTRUCTURED CSV ======
function csvEscape(val) {
  if (!val) return '';
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

const outLines = ['Order,Tier,Topic,English,Turkish,Swedish,Farsi,Hindi,Is New'];
ordered.forEach(item => {
  outLines.push([
    item.order,
    csvEscape(item.tier),
    csvEscape(item.topicName),
    csvEscape(item.english),
    csvEscape(item.turkish || ''),
    csvEscape(item.swedish || ''),
    csvEscape(item.farsi || ''),
    csvEscape(item.hindi || ''),
    item.isNew ? 'NEW' : '',
  ].join(','));
});

writeFileSync('curriculum_restructured.csv', outLines.join('\n'), 'utf-8');

// ====== STATS ======
console.log('\n=== RESTRUCTURING COMPLETE ===\n');
console.log(`Total sentences: ${ordered.length}`);
console.log(`  New (added): ${ordered.filter(o => o.isNew).length}`);
console.log(`  Existing (reordered): ${ordered.filter(o => !o.isNew).length}`);
console.log(`  Uncategorized: ${grouped['uncategorized'].length}`);
console.log('\n--- TOPIC BREAKDOWN ---');
topicOrder.forEach(id => {
  const t = topics.find(t => t.id === id);
  const count = id === 'greetings'
    ? newSentences.filter(n => n.topic === 'survival').length
    : (grouped[id]?.length || 0);
  console.log(`  ${t.name} [${t.tier}]: ${count} sentences`);
});
console.log(`  Uncategorized: ${grouped['uncategorized'].length}`);
console.log('\nOutput: curriculum_restructured.csv');
