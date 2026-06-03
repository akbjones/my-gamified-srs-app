#!/usr/bin/env node
/**
 * reassign-nodes-practical.cjs
 *
 * For every language deck, adjust grammarNode assignments so that
 * practical everyday sentences land in early nodes and cultural/obscure
 * vocabulary is pushed to later nodes.
 *
 * Algorithm:
 *   1. Parse English sentence for keyword hits.
 *   2. Compute a "practicality delta" from keyword analysis.
 *   3. new_node = clamp(old_node_number + delta, 1, 35)
 *   4. Resort cards by (new_node, old difficulty proxy), reassign IDs.
 *   5. Restore audio paths by matching target sentences.
 */

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Keyword lists
// ---------------------------------------------------------------------------

// Keywords that indicate IMPRACTICAL / cultural / rare content → push later
const IMPRACTICAL_KEYWORDS = [
  // Cultural ceremonies
  'ceremony', 'ritual', 'procession', 'pilgrimage', 'devotee', 'devotion',
  'worship', 'offering', 'prayer bead', 'hymn', 'scripture', 'sacred',
  'blessing ceremony', 'tonsure', 'baby shower ceremony', 'garland ceremony',
  'swearing-in', 'oath ceremony',
  // Music instruments (culture-specific)
  'shehnai', 'sitar', 'tabla', 'dhol', 'dholak', 'raga', 'raag', 'alap',
  'teen taal', 'taal', 'veena', 'harmonium', 'sarangi',
  // Wildlife/nature (obscure)
  'hawk-cuckoo', 'cuckoo', 'parrot', 'peacock', 'nightingale', 'mynah',
  // Jewelry/traditional dress
  'bangle', 'anklet', 'henna', 'turban', 'lac bangle',
  // Historical/architectural
  'palace', 'fortress', 'chariot', 'conch', 'dynasty', 'emperor', 'mughal',
  'archaeological', 'heritage', 'sculpture', 'monument', 'inscription',
  'craftsmanship', 'architecture specimen',
  // Mythology/literature
  'mythology', 'epic', 'sage', 'deity', 'shrine',
  // Clan/tribe
  'clan gathers', 'clan',
  // Specific cultural items
  'wedding procession', 'wedding food', 'wedding ritual',
  'folk singer', 'folk song', 'folk dance',
  'incense', 'sandalwood', 'palanquin', 'tricolor',
  // European cultural equivalents
  'cathedral', 'monastery', 'medieval', 'feudal', 'peasant', 'knight',
  'crusade', 'viking', 'folklore', 'proverb', 'parable',
  'baroque', 'renaissance', 'gothic',
  // Welsh/Celtic specific
  'eisteddfod', 'druid', 'bard', 'mead',
  // Turkish/Russian specific
  'sultan', 'czar', 'tsar', 'boyar', 'ottoman',
];

// Keywords that indicate HIGHLY PRACTICAL content → pull earlier
const PRACTICAL_KEYWORDS = [
  // Greetings
  'hello', 'goodbye', 'good morning', 'good evening', 'good night',
  'how are you', 'nice to meet', 'welcome',
  // Politeness
  'please', 'thank', 'sorry', 'excuse me', 'pardon',
  // Questions
  'where is', 'how much', 'how many', 'what time', 'what is your name',
  'do you have', 'can you', 'could you', 'is there',
  // Basic needs
  'want', 'need', 'would like', 'hungry', 'thirsty',
  'eat', 'drink', 'sleep', 'rest',
  // Food/drink
  'water', 'coffee', 'tea', 'bread', 'rice', 'food', 'meal',
  'breakfast', 'lunch', 'dinner', 'restaurant', 'menu', 'order',
  // Travel
  'hotel', 'room', 'station', 'airport', 'bus', 'train', 'taxi', 'ticket',
  'reservation', 'check in', 'check out', 'luggage', 'passport',
  // Shopping
  'buy', 'sell', 'shop', 'store', 'market', 'price', 'cheap', 'expensive',
  'money', 'pay', 'change', 'receipt', 'bill',
  // Emergency
  'help', 'doctor', 'hospital', 'police', 'emergency', 'ambulance',
  'medicine', 'pharmacy', 'sick', 'pain', 'hurt',
  // Time
  'today', 'tomorrow', 'yesterday', 'morning', 'afternoon', 'evening',
  'now', 'later', 'early', 'late', 'hour', 'minute', 'o\'clock',
  // Basics
  'yes', 'no', 'ok', 'my name is', 'i live', 'i work', 'i am from',
  // Description
  'good', 'bad', 'big', 'small', 'hot', 'cold', 'new', 'old',
  'open', 'close', 'left', 'right', 'near', 'far',
  // Numbers/days referenced in speech
  'one', 'two', 'three', 'first', 'second',
  // Communication
  'speak', 'understand', 'repeat', 'slowly', 'phone', 'call',
  // Family
  'mother', 'father', 'brother', 'sister', 'child', 'friend', 'family',
];

// Medium practical - slightly encourage these toward middle nodes
const MEDIUM_PRACTICAL_KEYWORDS = [
  'office', 'school', 'university', 'class', 'teacher', 'student',
  'meeting', 'appointment', 'boss', 'colleague',
  'house', 'apartment', 'kitchen', 'bathroom', 'bedroom',
  'weather', 'rain', 'sun', 'snow', 'wind', 'cloud',
  'book', 'read', 'write', 'learn', 'study',
  'happy', 'sad', 'angry', 'tired', 'afraid', 'worried',
  'birthday', 'party', 'gift', 'holiday', 'vacation',
  'car', 'drive', 'road', 'street', 'bridge',
  'movie', 'music', 'game', 'sport', 'swim',
];

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

function scorePracticality(english) {
  const lower = english.toLowerCase();
  let delta = 0;

  // Check impractical keywords - push later
  let impracticalHits = 0;
  for (const kw of IMPRACTICAL_KEYWORDS) {
    if (lower.includes(kw)) {
      impracticalHits++;
    }
  }

  // Check practical keywords - pull earlier
  let practicalHits = 0;
  for (const kw of PRACTICAL_KEYWORDS) {
    if (lower.includes(kw)) {
      practicalHits++;
    }
  }

  // Check medium practical
  let mediumHits = 0;
  for (const kw of MEDIUM_PRACTICAL_KEYWORDS) {
    if (lower.includes(kw)) {
      mediumHits++;
    }
  }

  // Multiple impractical hits = very cultural, push hard
  if (impracticalHits >= 3) {
    delta = 15;
  } else if (impracticalHits >= 2) {
    delta = 12;
  } else if (impracticalHits >= 1) {
    delta = 8;
  }

  // Practical hits pull earlier (mild – respect grammar complexity)
  if (practicalHits >= 3) {
    delta -= 4;
  } else if (practicalHits >= 2) {
    delta -= 2;
  } else if (practicalHits >= 1) {
    delta -= 1;
  }

  // Medium hits: tiny pull
  if (mediumHits >= 2) {
    delta -= 1;
  }

  // If a card is practical AND impractical (e.g. "Please visit the temple"),
  // the impractical push should win slightly for beginner ordering
  if (impracticalHits > 0 && practicalHits > 0) {
    delta = Math.max(delta, 3); // at least push a bit
  }

  return delta;
}

function parseNodeNumber(nodeStr) {
  const m = nodeStr.match(/node-(\d+)/);
  return m ? parseInt(m[1], 10) : 1;
}

function toNodeStr(n) {
  return `node-${String(n).padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// Language configs
// ---------------------------------------------------------------------------

const LANGUAGE_CONFIGS = {
  hindi:      { prefix: 'hi', audioPrefix: 'hi-hi-', audioExt: '.mp3' },
  spanish:    { prefix: 'es', audioPrefix: 'es-',    audioExt: '.mp3' },
  french:     { prefix: 'fr', audioPrefix: 'fr-',    audioExt: '.mp3' },
  italian:    { prefix: 'it', audioPrefix: 'it-',    audioExt: '.mp3' },
  portuguese: { prefix: 'pt', audioPrefix: 'pt-',    audioExt: '.mp3' },
  german:     { prefix: 'de', audioPrefix: 'de-de-', audioExt: '.mp3' },
  dutch:      { prefix: 'nl', audioPrefix: 'nl-',    audioExt: '.mp3' },
  swedish:    { prefix: 'sv', audioPrefix: 'sv-sv-', audioExt: '.mp3' },
  welsh:      { prefix: 'cy', audioPrefix: 'cy-',    audioExt: '.mp3' },
  turkish:    { prefix: 'tr', audioPrefix: 'tr-tr-', audioExt: '.mp3' },
  russian:    { prefix: 'ru', audioPrefix: 'ru-ru-', audioExt: '.mp3' },
};

// ---------------------------------------------------------------------------
// Process one language
// ---------------------------------------------------------------------------

function processLanguage(lang, verbose) {
  const deckPath = path.join(__dirname, '..', 'src', 'data', lang, 'deck.json');
  if (!fs.existsSync(deckPath)) {
    console.log(`  Skipping ${lang}: deck.json not found`);
    return null;
  }

  const deck = JSON.parse(fs.readFileSync(deckPath, 'utf8'));
  const config = LANGUAGE_CONFIGS[lang];
  if (!config) {
    console.log(`  Skipping ${lang}: no config`);
    return null;
  }

  // Build audio map: target sentence → audio path (preserve original audio)
  const audioByTarget = new Map();
  for (const card of deck) {
    audioByTarget.set(card.target, card.audio);
  }

  // Track movements
  let pushed = 0, pulled = 0, unchanged = 0;
  const movements = [];

  // Compute new nodes
  for (const card of deck) {
    const oldNode = parseNodeNumber(card.grammarNode);
    const delta = scorePracticality(card.english);
    let newNode = oldNode + delta;
    newNode = Math.max(1, Math.min(35, newNode));

    if (newNode > oldNode) pushed++;
    else if (newNode < oldNode) pulled++;
    else unchanged++;

    if (Math.abs(newNode - oldNode) >= 5) {
      movements.push({
        english: card.english.substring(0, 70),
        from: oldNode,
        to: newNode,
        delta
      });
    }

    card._oldNode = oldNode;
    card._newNode = newNode;
    card.grammarNode = toNodeStr(newNode);
  }

  // Sort by: new node, then old node (grammar complexity proxy), then original index
  deck.forEach((c, i) => { c._origIdx = i; });
  deck.sort((a, b) => {
    if (a._newNode !== b._newNode) return a._newNode - b._newNode;
    if (a._oldNode !== b._oldNode) return a._oldNode - b._oldNode;
    return a._origIdx - b._origIdx;
  });

  // Reassign sequential IDs
  const padLen = String(deck.length).length;
  for (let i = 0; i < deck.length; i++) {
    const num = String(i + 1).padStart(4, '0');
    deck[i].id = `${config.prefix}-${num}`;
  }

  // Restore audio paths from target sentence
  for (const card of deck) {
    const origAudio = audioByTarget.get(card.target);
    if (origAudio) {
      card.audio = origAudio;
    }
  }

  // Clean up temp fields
  for (const card of deck) {
    delete card._oldNode;
    delete card._newNode;
    delete card._origIdx;
  }

  // Write back
  fs.writeFileSync(deckPath, JSON.stringify(deck, null, 2) + '\n');

  // Node distribution after
  const dist = {};
  deck.forEach(c => { dist[c.grammarNode] = (dist[c.grammarNode] || 0) + 1; });

  const stats = { total: deck.length, pushed, pulled, unchanged, movements: movements.length };

  if (verbose) {
    console.log(`  ${lang}: ${deck.length} cards – ${pushed} pushed later, ${pulled} pulled earlier, ${unchanged} unchanged`);
    console.log(`    Node distribution: ${Object.keys(dist).sort().map(k => `${k}:${dist[k]}`).join(' ')}`);
  }

  return { deck, stats, dist, movements };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const targetLang = process.argv[2]; // optional: run just one language

  const languages = targetLang
    ? [targetLang]
    : Object.keys(LANGUAGE_CONFIGS);

  console.log(`\n=== Reassigning nodes for practicality (${languages.length} languages) ===\n`);

  const results = {};

  for (const lang of languages) {
    const result = processLanguage(lang, true);
    if (result) results[lang] = result;
  }

  // Detailed report for Hindi (or target lang)
  const reportLang = targetLang || 'hindi';
  if (results[reportLang]) {
    const { deck, movements } = results[reportLang];

    console.log(`\n--- First 20 cards of ${reportLang} ---`);
    for (let i = 0; i < 20 && i < deck.length; i++) {
      const c = deck[i];
      console.log(`  ${c.id} [${c.grammarNode}] ${c.english.substring(0, 75)}`);
    }

    // Find specific cards
    console.log(`\n--- Where specific cards ended up (${reportLang}) ---`);
    const searchTerms = ['hawk-cuckoo', 'wedding food', 'shehnai', 'clan gathers',
                         'pilgrimage', 'bangle', 'chariot', 'cuckoo', 'temple',
                         'procession', 'ceremony'];
    for (const term of searchTerms) {
      const found = deck.filter(c => c.english.toLowerCase().includes(term));
      if (found.length > 0) {
        console.log(`  "${term}": ${found.length} cards`);
        found.slice(0, 3).forEach(c => {
          console.log(`    ${c.id} [${c.grammarNode}] ${c.english.substring(0, 70)}`);
        });
      }
    }

    // Show biggest movements
    console.log(`\n--- Biggest movements (${reportLang}, delta >= 5) ---`);
    movements.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
    movements.slice(0, 15).forEach(m => {
      const dir = m.delta > 0 ? '→ later' : '→ earlier';
      console.log(`  node-${String(m.from).padStart(2,'0')} → node-${String(m.to).padStart(2,'0')} (${dir}) ${m.english}`);
    });
  }

  // Summary across all languages
  if (Object.keys(results).length > 1) {
    console.log('\n--- Summary across all languages ---');
    for (const [lang, r] of Object.entries(results)) {
      const { stats } = r;
      console.log(`  ${lang.padEnd(12)} ${stats.total} cards: ${stats.pushed} pushed later, ${stats.pulled} pulled earlier`);
    }
  }

  console.log('\nDone!');
}

main();
