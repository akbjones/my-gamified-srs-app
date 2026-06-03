#!/usr/bin/env node
/**
 * Audit basics coverage across all 11 language decks.
 *
 * For each language, count how many cards exemplify each "basics" category
 * (numbers, colors, days, months, family, body, food, weather, etc).
 * A category is considered well-covered if it has ≥ 5 cards.
 *
 * Search is done on the English translation field – we look for English
 * keywords that signal the category. This catches both vocabulary cards
 * and contextual usage cards.
 *
 * Output: scripts/basics-coverage.json
 */
const fs = require('fs');

const DECKS = {
  spanish:    'src/data/spanish/deck.json',
  french:     'src/data/french/deck.json',
  italian:    'src/data/italian/deck.json',
  portuguese: 'src/data/portuguese/deck.json',
  german:     'src/data/german/deck.json',
  dutch:      'src/data/dutch/deck.json',
  swedish:    'src/data/swedish/deck.json',
  welsh:      'src/data/welsh/deck.json',
  hindi:      'src/data/hindi/deck.json',
  turkish:    'src/data/turkish/deck.json',
  russian:    'src/data/russian/deck.json',
};

// Categories with English keywords we expect to find in a basic-coverage deck.
// Each category is a list of \b-bounded patterns (lowercase regex).
const CATEGORIES = {
  'numbers_low':   /\b(one|two|three|four|five|six|seven|eight|nine|ten)\b/,
  'numbers_high':  /\b(eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand)\b/,
  'colors':        /\b(red|blue|green|yellow|black|white|brown|orange|pink|purple|grey|gray)\b/,
  'days':          /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
  'months':        /\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/i,
  'family_core':   /\b(mother|father|brother|sister|son|daughter|husband|wife|mom|dad|parent|child)\b/i,
  'body_parts':    /\b(head|hand|foot|eye|ear|nose|mouth|hair|leg|arm|finger|tooth|teeth|stomach|back|heart)\b/i,
  'food_basics':   /\b(bread|water|milk|coffee|tea|sugar|salt|rice|egg|apple|cheese|wine|beer|meat|fish|fruit|vegetable)\b/i,
  'time_words':    /\b(today|tomorrow|yesterday|morning|afternoon|evening|night|now|later|soon|always|never|often)\b/i,
  'time_telling':  /\b(o'clock|half past|quarter past|quarter to|noon|midnight|am|pm)\b/i,
  'weather':       /\b(sunny|cloudy|rainy|snowy|hot|cold|warm|cool|wind|rain|snow|sun|cloud|storm)\b/i,
  'greetings':     /\b(hello|hi|goodbye|good morning|good evening|good night|see you|nice to meet)\b/i,
  'polite':        /\b(please|thank|thanks|sorry|excuse me|pardon|welcome|no problem)\b/i,
  'questions_wh':  /\b(who|what|where|when|why|how|which|whose)\b/i,
  'directions':    /\b(left|right|straight|north|south|east|west|north|near|far|across|behind)\b/i,
  'transport':     /\b(bus|train|taxi|metro|subway|car|bike|bicycle|airport|station|ticket|flight)\b/i,
  'home_rooms':    /\b(kitchen|bedroom|bathroom|living room|garden|balcony|door|window|stairs|wall)\b/i,
  'clothes':       /\b(shirt|trousers|pants|jacket|coat|shoes|hat|scarf|gloves|socks|dress|skirt)\b/i,
  'jobs':          /\b(teacher|doctor|engineer|nurse|driver|cook|writer|student|farmer|baker|lawyer|police)\b/i,
  'money':         /\b(money|pay|buy|sell|cost|price|expensive|cheap|change|coin|bill|cash|euro|dollar|lira|ruble|rupee|pound)\b/i,
  'animals':       /\b(dog|cat|horse|cow|chicken|fish|bird|sheep|pig|mouse|bear|wolf|fox)\b/i,
  'verbs_basic':   /\b(go|come|see|eat|drink|sleep|work|live|love|like|want|need|have|do|make|give|take|say|know|think|read|write|speak|listen|walk|run|sit|stand)\b/i,
};

const result = {};

for (const [lang, deckPath] of Object.entries(DECKS)) {
  const deck = JSON.parse(fs.readFileSync(deckPath, 'utf8'));
  const counts = {};
  const samples = {};
  for (const [cat, re] of Object.entries(CATEGORIES)) {
    counts[cat] = 0;
    samples[cat] = [];
    for (const card of deck) {
      if (re.test(card.english)) {
        counts[cat]++;
        if (samples[cat].length < 3) samples[cat].push(card.id + ': "' + card.english + '"');
      }
    }
  }
  result[lang] = { totalCards: deck.length, counts, samples };
}

fs.writeFileSync('scripts/basics-coverage.json', JSON.stringify(result, null, 2));

// Print compact table
console.log('BASICS COVERAGE per language (count of cards mentioning each category in English)');
console.log();
const cats = Object.keys(CATEGORIES);
const langs = Object.keys(DECKS);

// Header
const header = ['category'].concat(langs.map(l => l.slice(0, 3))).join('\\t');
console.log(header);
console.log('─'.repeat(header.length));

for (const cat of cats) {
  const row = [cat.padEnd(15)];
  for (const lang of langs) {
    const n = result[lang].counts[cat];
    const flag = n < 5 ? '⚠' : (n < 20 ? '·' : ' ');
    row.push(flag + n);
  }
  console.log(row.join('\\t'));
}

console.log();
console.log('⚠ = under-covered (< 5 cards) ;  · = thin (5–19) ;  blank = OK (≥ 20)');
console.log();
console.log('Saved scripts/basics-coverage.json');
