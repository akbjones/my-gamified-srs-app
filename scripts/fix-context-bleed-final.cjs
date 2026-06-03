/**
 * fix-context-bleed-final.cjs
 *
 * Strips misattributed definition parts from multi-part dictionary entries.
 * A part is misattributed if:
 *   1. It is the PRIMARY definition of ANOTHER word in the dictionary
 *   2. That other word co-occurs on at least one card with our word
 *   3. The part is NOT a plausible synonym of the first/primary part
 *
 * Also strips bare pronouns, articles, and prepositions (unless the entry IS that POS).
 *
 * Conservative: when in doubt, keep both parts.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// ── Language configs ────────────────────────────────────────────────────────
const LANGUAGES = [
  { code: 'es', dictFile: 'es.ts', deckDir: 'spanish' },
  { code: 'fr', dictFile: 'fr.ts', deckDir: 'french' },
  { code: 'de', dictFile: 'de.ts', deckDir: 'german' },
  { code: 'it', dictFile: 'it.ts', deckDir: 'italian' },
  { code: 'pt', dictFile: 'pt.ts', deckDir: 'portuguese' },
  { code: 'nl', dictFile: 'nl.ts', deckDir: 'dutch' },
  { code: 'sv', dictFile: 'sv.ts', deckDir: 'swedish' },
  { code: 'tr', dictFile: 'tr.ts', deckDir: 'turkish' },
  { code: 'ru', dictFile: 'ru.ts', deckDir: 'russian' },
  { code: 'hi', dictFile: 'hi.ts', deckDir: 'hindi' },
  { code: 'cy', dictFile: 'cy.ts', deckDir: 'welsh' },
];

// ── Bare words to strip from definitions ────────────────────────────────────
const BARE_PRONOUNS = new Set([
  'i', 'me', 'my', 'mine', 'myself',
  'you', 'your', 'yours', 'yourself', 'yourselves',
  'he', 'him', 'his', 'himself',
  'she', 'her', 'hers', 'herself',
  'it', 'its', 'itself',
  'we', 'us', 'our', 'ours', 'ourselves',
  'they', 'them', 'their', 'theirs', 'themselves',
]);
const BARE_ARTICLES = new Set(['the', 'a', 'an']);
const BARE_PREPOSITIONS = new Set([
  'in', 'on', 'at', 'to', 'from', 'with', 'by', 'for',
  'of', 'about', 'into', 'through', 'during', 'before',
  'after', 'above', 'below', 'between', 'under', 'over',
]);

// ── Synonym groups ──────────────────────────────────────────────────────────
const SYNONYM_GROUPS = [
  // Preposition groups (critical - these are multi-meaning by nature)
  ['of', 'from', 'off'],
  ['in', 'on', 'at', 'into', 'onto'],
  ['to', 'at', 'toward', 'towards', 'for'],
  ['with', 'by', 'along', 'alongside', 'together'],
  ['for', 'to', 'toward'],
  ['about', 'around', 'concerning', 'regarding'],
  ['before', 'in front of', 'ahead of'],
  ['after', 'behind', 'following'],
  ['under', 'below', 'beneath', 'underneath'],
  ['over', 'above', 'on top of'],
  ['between', 'among', 'amongst'],
  ['through', 'across', 'via'],
  ['up', 'above', 'upward', 'upwards'],
  ['down', 'below', 'downward', 'downwards', 'beneath'],
  ['along', 'with', 'together'],
  // Conjunction/connector synonyms
  ['and', 'also', 'too', 'as well', 'plus'],
  ['but', 'however', 'yet', 'though', 'although', 'nevertheless'],
  ['or', 'otherwise', 'alternatively', 'either'],
  ['because', 'since', 'as', 'for', 'due to'],
  ['if', 'whether', 'in case'],
  ['that', 'which', 'who', 'whom', 'whose'],
  ['when', 'while', 'as', 'during'],
  ['so', 'therefore', 'thus', 'hence', 'consequently', 'then'],
  // Determiner/pronoun synonyms
  ['this', 'that', 'these', 'those'],
  ['some', 'any', 'a few', 'certain'],
  ['all', 'every', 'each', 'everyone', 'everything', 'everybody'],
  ['who', 'which', 'that', 'whom', 'whose'],
  ['what', 'which', 'that'],
  ['he', 'she', 'it', 'they'],
  ['him', 'her', 'them', 'us'],
  ['his', 'her', 'their', 'its', 'our', 'your', 'my'],
  // Movement verbs
  ['go', 'come', 'walk', 'run', 'move', 'travel', 'leave', 'depart', 'arrive', 'approach', 'advance', 'proceed', 'pass', 'wander', 'roam', 'stroll'],
  // Speech verbs
  ['say', 'tell', 'speak', 'talk', 'ask', 'answer', 'reply', 'respond', 'state', 'declare', 'mention', 'explain', 'describe', 'express', 'utter', 'announce'],
  // Vision verbs
  ['see', 'look', 'watch', 'observe', 'view', 'notice', 'spot', 'gaze', 'stare', 'glance', 'glimpse', 'peer', 'examine', 'inspect'],
  // Cognition verbs
  ['think', 'know', 'believe', 'understand', 'realize', 'recognize', 'consider', 'suppose', 'imagine', 'remember', 'recall', 'forget', 'learn', 'study', 'comprehend'],
  // Emotion verbs
  ['like', 'love', 'enjoy', 'prefer', 'adore', 'appreciate', 'admire', 'fancy', 'care', 'cherish'],
  ['hate', 'dislike', 'despise', 'detest', 'loathe', 'abhor'],
  ['fear', 'worry', 'dread', 'fright', 'scare', 'terrify', 'alarm'],
  // Giving/Taking
  ['give', 'offer', 'provide', 'supply', 'grant', 'donate', 'present', 'hand', 'deliver', 'lend'],
  ['take', 'grab', 'seize', 'catch', 'snatch', 'grasp', 'hold', 'receive', 'accept', 'get', 'obtain'],
  // Creation/Destruction
  ['make', 'create', 'build', 'construct', 'produce', 'form', 'craft', 'manufacture', 'develop'],
  ['break', 'destroy', 'ruin', 'damage', 'smash', 'shatter', 'crush', 'wreck', 'demolish'],
  // Start/Stop
  ['start', 'begin', 'commence', 'initiate', 'launch', 'open'],
  ['stop', 'end', 'finish', 'cease', 'conclude', 'halt', 'terminate', 'complete', 'close'],
  // Eating/Drinking
  ['eat', 'consume', 'devour', 'dine', 'feast', 'chew', 'swallow', 'taste', 'bite'],
  ['drink', 'sip', 'gulp', 'swallow', 'consume'],
  // Writing/Reading
  ['write', 'compose', 'draft', 'pen', 'inscribe', 'record', 'note'],
  ['read', 'study', 'peruse', 'scan', 'browse', 'skim'],
  // Size adjectives
  ['big', 'large', 'huge', 'enormous', 'giant', 'vast', 'great', 'immense', 'massive', 'grand'],
  ['small', 'little', 'tiny', 'minute', 'miniature', 'compact', 'petite', 'slight'],
  // Quality adjectives
  ['good', 'nice', 'fine', 'great', 'excellent', 'wonderful', 'superb', 'fantastic', 'pleasant', 'lovely', 'decent', 'fair', 'well'],
  ['bad', 'poor', 'terrible', 'awful', 'horrible', 'dreadful', 'lousy', 'nasty', 'wicked'],
  // Beauty adjectives
  ['beautiful', 'pretty', 'lovely', 'gorgeous', 'attractive', 'handsome', 'stunning', 'elegant', 'nice'],
  ['ugly', 'hideous', 'unsightly', 'unattractive', 'grotesque'],
  // Temperature
  ['hot', 'warm', 'heated', 'boiling', 'burning', 'scorching'],
  ['cold', 'cool', 'chilly', 'freezing', 'icy', 'frigid', 'frosty'],
  // Speed
  ['fast', 'quick', 'rapid', 'swift', 'speedy', 'hasty', 'prompt', 'brisk'],
  ['slow', 'gradual', 'sluggish', 'leisurely', 'unhurried'],
  // Age
  ['old', 'elderly', 'aged', 'ancient', 'senior', 'mature', 'vintage'],
  ['young', 'youthful', 'juvenile', 'adolescent', 'teen'],
  ['new', 'fresh', 'recent', 'modern', 'novel', 'latest', 'current', 'contemporary'],
  // Strength
  ['strong', 'powerful', 'mighty', 'robust', 'sturdy', 'tough', 'firm', 'solid', 'hard'],
  ['weak', 'feeble', 'frail', 'fragile', 'delicate', 'soft', 'tender', 'gentle'],
  // Happiness
  ['happy', 'glad', 'joyful', 'cheerful', 'delighted', 'pleased', 'content', 'merry', 'jolly', 'elated'],
  ['sad', 'unhappy', 'sorrowful', 'melancholy', 'depressed', 'gloomy', 'miserable', 'dejected'],
  // Intelligence
  ['smart', 'intelligent', 'clever', 'bright', 'brilliant', 'wise', 'sharp', 'astute'],
  ['stupid', 'dumb', 'foolish', 'silly', 'idiotic', 'ignorant'],
  // Time words
  ['morning', 'dawn', 'sunrise', 'daybreak'],
  ['evening', 'dusk', 'sunset', 'twilight', 'nightfall'],
  ['night', 'midnight', 'darkness'],
  ['today', 'now', 'presently', 'currently'],
  ['yesterday', 'previously', 'formerly', 'before'],
  ['tomorrow', 'later', 'soon', 'next'],
  ['always', 'forever', 'constantly', 'perpetually', 'eternally', 'ever'],
  ['never', 'rarely', 'seldom', 'hardly'],
  ['often', 'frequently', 'regularly', 'usually', 'commonly', 'normally', 'typically'],
  ['sometimes', 'occasionally', 'periodically', 'intermittently'],
  ['once', 'one time', 'formerly'],
  ['already', 'yet', 'still'],
  // Place words
  ['house', 'home', 'residence', 'dwelling', 'abode'],
  ['room', 'chamber', 'hall', 'space', 'area'],
  ['street', 'road', 'lane', 'avenue', 'path', 'way', 'route', 'track'],
  ['city', 'town', 'village', 'municipality'],
  ['country', 'nation', 'state', 'land', 'homeland', 'territory'],
  ['shop', 'store', 'market', 'marketplace'],
  // Family
  ['father', 'dad', 'daddy', 'papa', 'pa'],
  ['mother', 'mom', 'mommy', 'mama', 'ma', 'mum', 'mummy'],
  ['brother', 'sibling'],
  ['sister', 'sibling'],
  ['child', 'kid', 'youngster', 'offspring', 'infant', 'baby', 'toddler', 'children'],
  ['son', 'boy', 'lad'],
  ['daughter', 'girl', 'lass'],
  // People
  ['man', 'gentleman', 'guy', 'fellow', 'male', 'lad', 'bloke', 'dude'],
  ['woman', 'lady', 'female', 'gal'],
  ['person', 'individual', 'human', 'being', 'somebody', 'someone', 'one'],
  ['friend', 'companion', 'buddy', 'pal', 'mate'],
  // Amounts
  ['much', 'many', 'a lot', 'lots', 'plenty', 'numerous', 'abundant', 'ample', 'very'],
  ['little', 'few', 'scant', 'scarce', 'meager', 'sparse'],
  ['all', 'every', 'each', 'entire', 'whole', 'total', 'complete', 'full'],
  ['none', 'nothing', 'zero', 'nil'],
  ['some', 'several', 'a few', 'certain', 'various'],
  // Color
  ['red', 'scarlet', 'crimson', 'ruby', 'vermillion'],
  ['blue', 'azure', 'navy', 'cobalt', 'indigo'],
  ['green', 'emerald', 'lime', 'olive', 'jade'],
  // Truth
  ['true', 'correct', 'right', 'accurate', 'exact', 'precise'],
  ['false', 'wrong', 'incorrect', 'inaccurate', 'mistaken'],
  // Noise
  ['loud', 'noisy', 'deafening', 'boisterous'],
  ['quiet', 'silent', 'still', 'hushed', 'calm', 'peaceful', 'tranquil', 'serene'],
  // Light
  ['light', 'bright', 'luminous', 'radiant', 'shining', 'brilliant', 'glowing'],
  ['dark', 'dim', 'gloomy', 'murky', 'shadowy', 'obscure'],
  // Difficulty
  ['easy', 'simple', 'straightforward', 'effortless'],
  ['hard', 'difficult', 'tough', 'challenging', 'complex'],
  // Clean/Dirty
  ['clean', 'tidy', 'neat', 'spotless', 'pure', 'pristine', 'immaculate'],
  ['dirty', 'filthy', 'grimy', 'messy', 'unclean', 'soiled', 'grubby'],
  // Wet/Dry
  ['wet', 'moist', 'damp', 'soggy', 'soaked', 'drenched'],
  ['dry', 'arid', 'parched', 'dehydrated'],
  // Rich/Poor
  ['rich', 'wealthy', 'affluent', 'prosperous', 'well-off'],
  ['poor', 'impoverished', 'destitute', 'needy', 'broke'],
  // Open/Close
  ['open', 'unlock', 'unfasten', 'undo', 'unseal'],
  ['close', 'shut', 'lock', 'seal', 'fasten'],
  // Carry/bring
  ['carry', 'bring', 'transport', 'convey', 'haul', 'bear'],
  // Put/Place
  ['put', 'place', 'set', 'lay', 'position', 'deposit'],
  // Search/Find
  ['search', 'seek', 'hunt', 'look for', 'pursue'],
  ['find', 'discover', 'locate', 'detect', 'uncover', 'spot'],
  // Wait/Stay
  ['wait', 'stay', 'remain', 'linger', 'pause', 'hold'],
  // Work
  ['work', 'labor', 'toil', 'operate', 'function'],
  ['job', 'work', 'employment', 'occupation', 'profession', 'career', 'position', 'role'],
  // Sleep/Wake
  ['sleep', 'rest', 'nap', 'doze', 'slumber'],
  ['wake', 'awaken', 'arise', 'rouse', 'stir'],
  // Buy/Sell
  ['buy', 'purchase', 'acquire', 'obtain', 'procure'],
  ['sell', 'vend', 'trade', 'market', 'deal'],
  // Help
  ['help', 'assist', 'aid', 'support', 'serve'],
  ['protect', 'defend', 'guard', 'shield', 'secure', 'shelter'],
  // Send/Receive
  ['send', 'dispatch', 'transmit', 'forward', 'deliver', 'mail', 'ship'],
  ['receive', 'get', 'obtain', 'accept', 'collect'],
  // Show/Hide
  ['show', 'display', 'exhibit', 'present', 'demonstrate', 'reveal', 'expose'],
  ['hide', 'conceal', 'cover', 'obscure', 'mask', 'veil'],
  // Change
  ['change', 'alter', 'modify', 'transform', 'convert', 'adjust', 'vary', 'shift'],
  // Grow/Shrink
  ['grow', 'increase', 'expand', 'enlarge', 'extend', 'rise', 'escalate', 'swell'],
  ['shrink', 'decrease', 'reduce', 'diminish', 'decline', 'lessen', 'contract', 'dwindle'],
  // Agree/Disagree
  ['agree', 'consent', 'approve', 'accept', 'concur', 'believe'],
  ['disagree', 'object', 'oppose', 'reject', 'refuse', 'deny', 'decline'],
  // Live/Die
  ['live', 'exist', 'survive', 'dwell', 'reside', 'inhabit'],
  ['die', 'perish', 'expire', 'decease', 'pass away'],
  // Pull/Push
  ['pull', 'drag', 'draw', 'tug', 'haul', 'yank'],
  ['push', 'shove', 'press', 'thrust', 'force', 'propel'],
  // Climb/Fall
  ['climb', 'ascend', 'mount', 'scale', 'rise'],
  ['fall', 'drop', 'descend', 'plunge', 'tumble', 'plummet', 'sink'],
  // Laugh/Cry
  ['laugh', 'giggle', 'chuckle', 'snicker', 'cackle', 'grin', 'smile'],
  ['cry', 'weep', 'sob', 'wail', 'whimper', 'moan'],
  // Win/Lose
  ['win', 'triumph', 'prevail', 'conquer', 'succeed', 'overcome'],
  ['lose', 'fail', 'forfeit', 'surrender', 'yield'],
  // Cut
  ['cut', 'slice', 'chop', 'trim', 'carve', 'sever', 'clip', 'snip'],
  // Throw/Catch
  ['throw', 'toss', 'hurl', 'fling', 'pitch', 'cast', 'launch'],
  ['catch', 'grab', 'seize', 'snatch', 'capture', 'trap'],
  // Turn/Spin
  ['turn', 'rotate', 'spin', 'twist', 'revolve', 'pivot', 'swivel', 'return'],
  // Touch/Feel
  ['touch', 'feel', 'handle', 'stroke', 'caress', 'pat', 'tap'],
  // Choose/Pick
  ['choose', 'pick', 'select', 'elect', 'opt', 'decide', 'prefer'],
  // Teach/Learn
  ['teach', 'instruct', 'educate', 'train', 'tutor', 'coach', 'guide'],
  ['learn', 'study', 'absorb', 'grasp', 'master', 'memorize'],
  // Allow/Forbid
  ['allow', 'permit', 'let', 'authorize', 'enable', 'grant'],
  ['forbid', 'prohibit', 'ban', 'bar', 'restrict', 'prevent', 'block'],
  // Want/Need
  ['hope', 'wish', 'desire', 'want', 'long', 'yearn', 'crave', 'aspire'],
  ['need', 'require', 'demand', 'must', 'have to'],
  // Dangerous/Safe
  ['dangerous', 'risky', 'hazardous', 'perilous', 'unsafe', 'treacherous'],
  ['safe', 'secure', 'protected', 'sheltered', 'harmless'],
  // Tall/Short height
  ['tall', 'high', 'lofty', 'towering', 'elevated'],
  ['short', 'low', 'brief', 'compact', 'squat'],
  // Long/Short
  ['long', 'lengthy', 'extended', 'prolonged', 'enduring'],
  // Wide/Narrow
  ['wide', 'broad', 'expansive', 'spacious'],
  ['narrow', 'thin', 'slim', 'slender'],
  // Thick/Thin
  ['thick', 'dense', 'heavy', 'stout'],
  ['thin', 'slim', 'slender', 'lean', 'skinny', 'gaunt'],
  // Near/Far
  ['near', 'close', 'nearby', 'adjacent', 'neighboring'],
  ['far', 'distant', 'remote', 'faraway'],
  // Cheap/Expensive
  ['cheap', 'inexpensive', 'affordable', 'economical', 'budget'],
  ['expensive', 'costly', 'pricey', 'dear', 'premium'],
  // Brave/Afraid
  ['brave', 'courageous', 'bold', 'fearless', 'valiant', 'daring', 'heroic'],
  ['afraid', 'scared', 'frightened', 'fearful', 'terrified', 'anxious', 'nervous', 'worried'],
  // Sick/Healthy
  ['sick', 'ill', 'unwell', 'ailing', 'diseased'],
  ['healthy', 'well', 'fit', 'sound', 'robust', 'vigorous'],
  // Arrive/Leave
  ['arrive', 'reach', 'come', 'appear', 'show up', 'land'],
  ['leave', 'depart', 'exit', 'go', 'quit', 'withdraw', 'retreat'],
  // Wear
  ['wear', 'dress', 'don', 'put on', 'clothe'],
  ['undress', 'remove', 'take off', 'strip'],
  // Raise/Lower
  ['raise', 'lift', 'elevate', 'hoist'],
  ['lower', 'drop', 'reduce', 'decrease', 'descend'],
  // Weather
  ['weather', 'season', 'climate'],
  ['heat', 'summer', 'warmth'],
  ['cold', 'winter', 'chill'],
  ['rain', 'rainfall', 'shower', 'downpour', 'drizzle'],
  ['snow', 'snowfall', 'blizzard'],
  ['wind', 'breeze', 'gust', 'gale'],
  // Moon/month (many languages use the same word)
  ['moon', 'month'],
  // Hour/time
  ['hour', 'time', 'o\'clock'],
  ['clock', 'watch', 'timepiece'],
  // Face/hundred (shared in many languages)
  ['face', 'countenance', 'visage'],
  // Film/movie
  ['film', 'movie', 'picture', 'motion picture'],
  // Air/weather
  ['air', 'atmosphere', 'breeze', 'weather'],
  // Money
  ['money', 'cash', 'currency', 'funds'],
  ['price', 'cost', 'charge', 'fee', 'rate', 'expense'],
  // Both/also
  ['both', 'also', 'too', 'as well'],
  // Language/tongue
  ['language', 'tongue', 'speech'],
  // Morning/evening (time of day)
  ['morning', 'forenoon', 'am'],
  ['afternoon', 'pm'],
  // Year/age
  ['year', 'age'],
  // Food
  ['food', 'meal', 'dish', 'cuisine', 'fare'],
  ['bread', 'loaf', 'toast', 'roll', 'bun'],
  ['water', 'liquid', 'fluid'],
  ['meat', 'flesh', 'beef', 'pork', 'chicken', 'lamb'],
  // Clothing
  ['shirt', 'blouse', 'top'],
  ['pants', 'trousers', 'jeans', 'slacks'],
  ['dress', 'gown', 'robe', 'frock'],
  ['shoe', 'boot', 'sandal', 'slipper'],
  ['hat', 'cap', 'bonnet', 'headwear'],
  // Exactly/fully
  ['exactly', 'fully', 'completely', 'entirely', 'precisely', 'totally', 'wholly'],
  // Develop/improve
  ['develop', 'improve', 'enhance', 'advance', 'progress', 'evolve', 'refine'],
  // Return/go back
  ['return', 'go back', 'come back'],
  // Answer/respond
  ['answer', 'respond', 'reply', 'retort'],
  // Sort/arrange
  ['sort', 'arrange', 'organize', 'order', 'classify', 'categorize'],
  // Announce/declare
  ['announce', 'declare', 'proclaim', 'state', 'affirm'],
  // Move/walk
  ['move', 'walk', 'go', 'proceed', 'advance', 'step'],
  // Body parts
  ['head', 'skull', 'cranium'],
  ['face', 'countenance', 'visage'],
  ['hand', 'fist', 'palm'],
  ['foot', 'feet'],
  ['eye', 'eyes'],
  // Miscellaneous known multi-meaning pairs that are NOT bleed
  ['right', 'correct', 'true'],
  ['just', 'only', 'merely', 'simply', 'fair'],
  ['still', 'yet', 'even', 'quiet', 'calm'],
  ['even', 'also', 'still', 'flat', 'level'],
  ['quite', 'rather', 'fairly', 'pretty', 'somewhat'],
  ['enough', 'sufficient', 'adequate', 'plenty'],
  ['world', 'earth', 'globe'],
  ['story', 'tale', 'narrative', 'account', 'history'],
  ['power', 'strength', 'force', 'energy', 'might'],
  ['fire', 'flame', 'blaze'],
  ['light', 'lamp', 'glow', 'illumination'],
  ['ground', 'earth', 'floor', 'soil', 'land'],
  ['piece', 'part', 'bit', 'portion', 'section', 'fragment'],
  ['voice', 'sound', 'tone'],
  ['thing', 'object', 'item', 'matter', 'stuff'],
  ['place', 'spot', 'location', 'site', 'position', 'area'],
  ['point', 'spot', 'dot', 'tip'],
  ['side', 'edge', 'border', 'margin'],
  ['end', 'finish', 'conclusion', 'termination'],
  ['part', 'piece', 'section', 'portion', 'component'],
  ['kind', 'type', 'sort', 'variety', 'species'],
  ['way', 'manner', 'method', 'path', 'road', 'route'],
  ['back', 'behind', 'rear'],
  ['head', 'chief', 'leader', 'boss', 'top'],
  ['game', 'play', 'match', 'sport'],
  ['number', 'figure', 'digit', 'amount', 'quantity'],
  ['letter', 'character', 'note', 'message', 'epistle'],
  ['book', 'volume', 'tome', 'text'],
  ['school', 'academy', 'institute', 'college'],
  ['church', 'temple', 'mosque', 'chapel'],
  // Certainty/emphasis adverbs
  ['certainly', 'definitely', 'surely', 'absolutely', 'indeed', 'undoubtedly', 'of course'],
  ['perhaps', 'maybe', 'possibly', 'probably', 'likely'],
  // Amazing/wonderful adjectives
  ['wonderful', 'amazing', 'fantastic', 'incredible', 'marvelous', 'extraordinary', 'remarkable', 'splendid', 'magnificent', 'outstanding', 'superb', 'terrific'],
  // Vacation/holidays
  ['vacation', 'holiday', 'holidays', 'break', 'leave', 'time off', 'getaway'],
  // Official/officer
  ['official', 'officer', 'authority', 'functionary'],
  // Free/independent
  ['free', 'independent', 'liberated', 'autonomous', 'unrestricted'],
  // Appropriate/suitable
  ['appropriate', 'suitable', 'proper', 'fitting', 'apt', 'correct', 'right', 'adequate'],
  // Ahead/forward
  ['ahead', 'forward', 'in front', 'onwards', 'onward'],
  // Best/better
  ['best', 'better', 'finest', 'greatest', 'superior', 'top'],
  // A/one (for determiners)
  ['a', 'one', 'an'],
  // Past/over/finished
  ['past', 'over', 'finished', 'done', 'ended', 'gone'],
  // Important/significant
  ['important', 'significant', 'major', 'crucial', 'essential', 'vital', 'key', 'critical'],
  // Beautiful/nice (already have similar but add more)
  ['beautiful', 'nice', 'pretty', 'lovely', 'fine', 'gorgeous', 'handsome'],
  // Hurry/rush/haste
  ['hurry', 'rush', 'haste', 'hasten', 'hustle'],
  // Cook/chef
  ['cook', 'chef'],
  // Emergency/urgent
  ['emergency', 'urgent', 'critical'],
  // Together/jointly
  ['together', 'jointly', 'collectively'],
  // Bloom/flower
  ['bloom', 'blossom', 'flower', 'flourish'],
  // Sure/certain
  ['sure', 'certain', 'confident', 'positive', 'convinced'],
  // Only/alone
  ['only', 'alone', 'sole', 'single', 'just', 'merely'],
  // Real/true
  ['real', 'true', 'genuine', 'authentic', 'actual'],
  // Own/possess
  ['own', 'possess', 'have', 'hold'],
  // Entire/whole
  ['entire', 'whole', 'complete', 'full', 'total'],
  // Special/particular
  ['special', 'particular', 'specific', 'unique', 'distinct', 'singular'],
  // Possible/potential
  ['possible', 'potential', 'feasible', 'viable', 'achievable'],
  // Common/usual
  ['common', 'usual', 'ordinary', 'normal', 'regular', 'typical', 'standard'],
  // Simple/plain
  ['simple', 'plain', 'basic', 'straightforward', 'uncomplicated'],
  // Clear/obvious
  ['clear', 'obvious', 'evident', 'apparent', 'plain', 'visible'],
  // Announce/affirm/state
  ['affirm', 'state', 'assert', 'declare', 'confirm', 'announce', 'proclaim'],
  // Hundred/face (Turkish yüz means both)
  ['hundred', 'face'],
  // Different/various
  ['different', 'various', 'diverse', 'varied', 'distinct', 'assorted'],
  // Ready/prepared
  ['ready', 'prepared', 'set'],
  // Whole/entire/complete
  ['whole', 'entire', 'complete', 'total', 'full'],
  // Enough/sufficient
  ['enough', 'sufficient', 'adequate', 'ample'],
  // Necessary/needed
  ['necessary', 'needed', 'required', 'essential', 'vital'],
  // Understand/comprehend
  ['understand', 'comprehend', 'grasp', 'realize', 'get'],
  // Accept/receive
  ['accept', 'receive', 'take', 'get', 'welcome'],
  // Continue/keep
  ['continue', 'keep', 'persist', 'proceed', 'go on', 'carry on', 'maintain'],
  // Happen/occur
  ['happen', 'occur', 'take place', 'arise', 'come about'],
  // Became/happened (for Hindi/conjugated forms)
  ['happened', 'became', 'occurred'],
  // Follow/pursue
  ['follow', 'pursue', 'chase', 'trail', 'track'],
  // Meet/encounter
  ['meet', 'encounter', 'find', 'come across'],
  // Call/name
  ['call', 'name', 'label', 'title', 'designate'],
  // Seem/appear
  ['seem', 'appear', 'look'],
  // Remain/stay
  ['remain', 'stay', 'linger', 'persist', 'endure', 'last'],
  // Promise/vow
  ['promise', 'vow', 'pledge', 'swear', 'commit'],
  // Famous/well-known
  ['famous', 'well-known', 'renowned', 'celebrated', 'noted', 'prominent'],
  // Useful/helpful
  ['useful', 'helpful', 'handy', 'practical', 'beneficial'],
  // Angry/mad/upset
  ['angry', 'mad', 'upset', 'furious', 'irritated', 'annoyed', 'cross'],
  // Surprised/amazed/astonished
  ['surprised', 'amazed', 'astonished', 'stunned', 'shocked'],
  // Proud/pleased
  ['proud', 'pleased', 'satisfied', 'gratified'],
  // Sorry/regretful
  ['sorry', 'regretful', 'apologetic', 'remorseful'],
  // Empty/vacant
  ['empty', 'vacant', 'void', 'bare', 'hollow'],
  // Strange/odd/weird
  ['strange', 'odd', 'weird', 'unusual', 'peculiar', 'bizarre', 'curious'],
  // Excellent/outstanding
  ['excellent', 'outstanding', 'superb', 'exceptional', 'first-rate'],
  // Problem/issue
  ['problem', 'issue', 'trouble', 'difficulty', 'challenge'],
  // Reason/cause
  ['reason', 'cause', 'motive', 'purpose', 'basis', 'ground'],
  // Example/instance
  ['example', 'instance', 'case', 'sample', 'illustration'],
  // Opportunity/chance
  ['opportunity', 'chance', 'occasion', 'opening', 'possibility'],
  // Effort/attempt
  ['effort', 'attempt', 'try', 'endeavor'],
  // Result/outcome
  ['result', 'outcome', 'consequence', 'effect', 'impact'],
  // Law/rule
  ['law', 'rule', 'regulation', 'statute', 'ordinance'],
  // Correct/right
  ['correct', 'right', 'proper', 'accurate'],
  // Rent/income (same word in many languages like Spanish "renta")
  ['rent', 'income', 'revenue'],
  // Refined/elegant
  ['refined', 'elegant', 'sophisticated', 'polished', 'cultured'],
  // Garden/orchard (shared in some languages)
  ['garden', 'orchard', 'yard'],
  // Question/issue/matter
  ['question', 'issue', 'matter', 'topic', 'subject'],
  // Standing/current
  ['standing', 'current', 'present', 'existing'],
  // Simile/metaphor (literary terms)
  ['simile', 'metaphor', 'comparison', 'analogy'],
  // Exit/go out
  ['exit', 'go out', 'leave', 'depart'],
  // Within/by/inside
  ['within', 'by', 'inside', 'in'],
  // Certain/determined
  ['certain', 'determined', 'definite', 'decided', 'resolute'],
  // Grove/garden (nature)
  ['grove', 'garden', 'orchard', 'park'],
  // Field/farm
  ['field', 'farm', 'farmland', 'plot', 'patch'],
  // Cotton/cloth/fabric
  ['cotton', 'cloth', 'fabric', 'textile', 'material'],
  // Until/as much as (Turkish "kadar" means both)
  ['until', 'as much as', 'up to', 'as far as'],
  // Clock/watch/hour (same word in many languages)
  ['clock', 'watch', 'hour', 'time'],
  // West/setting (sun sets in the west)
  ['west', 'sets', 'setting'],
  // Waits/waiting
  ['waits', 'waiting', 'wait'],
  // Behind/back
  ['behind', 'back', 'rear', 'backwards'],
  // Ochre/saffron-colored (similar colors)
  ['ochre', 'saffron-colored', 'orange-yellow'],
];

// Build a map: normalized word -> set of synonym-group indices
const synonymMap = new Map();
for (let gi = 0; gi < SYNONYM_GROUPS.length; gi++) {
  for (const w of SYNONYM_GROUPS[gi]) {
    const key = w.toLowerCase();
    if (!synonymMap.has(key)) synonymMap.set(key, new Set());
    synonymMap.get(key).add(gi);
  }
}

/**
 * Check if two English definition parts are plausible synonyms.
 */
function areSynonyms(a, b) {
  const na = normalizePart(a);
  const nb = normalizePart(b);
  if (na === nb) return true;

  const ba = na.replace(/^to /, '');
  const bb = nb.replace(/^to /, '');
  if (ba === bb) return true;

  // Check synonym groups for base forms
  function checkSynonymGroups(wa, wb) {
    const ga = synonymMap.get(wa);
    const gb = synonymMap.get(wb);
    if (ga && gb) {
      for (const g of ga) {
        if (gb.has(g)) return true;
      }
    }
    return false;
  }

  if (checkSynonymGroups(ba, bb)) return true;
  if (checkSynonymGroups(na, nb)) return true;

  // For multi-word first parts like "pass it to him", check if b is a synonym
  // of any word in the first part. This handles "give him, her" cases.
  if (na.includes(' ')) {
    const words = na.split(/\s+/);
    for (const word of words) {
      if (checkSynonymGroups(word, bb)) return true;
    }
  }
  if (nb.includes(' ')) {
    const words = nb.split(/\s+/);
    for (const word of words) {
      if (checkSynonymGroups(ba, word)) return true;
    }
  }

  return false;
}

function normalizePart(s) {
  return s.toLowerCase()
    .replace(/\s*\([^)]*\)/g, '') // strip parentheticals
    .replace(/[!?.,;:]/g, '')
    .trim();
}

function primaryDef(en) {
  const parts = splitDef(en);
  return normalizePart(parts[0]);
}

function splitDef(en) {
  if (en.includes(',')) {
    return en.split(',').map(p => p.trim()).filter(Boolean);
  }
  if (en.includes(' / ')) {
    return en.split(' / ').map(p => p.trim()).filter(Boolean);
  }
  return [en.trim()];
}

function joinDef(parts, originalEn) {
  if (originalEn.includes(',') && !originalEn.includes(' / ')) {
    return parts.join(', ');
  }
  if (!originalEn.includes(',') && originalEn.includes(' / ')) {
    return parts.join(' / ');
  }
  if (originalEn.includes(',')) {
    return parts.join(', ');
  }
  return parts.join(' / ');
}

// ── Dictionary parsing ──────────────────────────────────────────────────────

function parseDictionary(src) {
  const entries = [];
  const lines = src.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    let match = line.match(
      /^(\s*)(['"])((?:[^'"\\\n]|\\.)*)(\2)\s*:\s*\{[^}]*en:\s*(['"])((?:[^'"\\\n]|\\.)*)(\5)/
    );
    if (!match) continue;

    const word = match[3].replace(/\\'/g, "'").replace(/\\"/g, '"');
    const en = match[6].replace(/\\'/g, "'").replace(/\\"/g, '"');
    const posMatch = line.match(/pos:\s*['"]([^'"]+)['"]/);
    const pos = posMatch ? posMatch[1] : null;

    entries.push({ word, en, pos, lineIndex: i, fullLine: line });
  }

  return entries;
}

function applyFix(lines, lineIndex, oldEn, newEn) {
  const line = lines[lineIndex];

  // Try exact match for single-quoted
  const sqOld = `en: '${oldEn.replace(/'/g, "\\'")}'`;
  const sqNew = `en: '${newEn.replace(/'/g, "\\'")}'`;
  if (line.includes(sqOld)) {
    lines[lineIndex] = line.replace(sqOld, sqNew);
    return true;
  }

  // Try exact match for double-quoted
  const dqOld = `en: "${oldEn.replace(/"/g, '\\"')}"`;
  const dqNew = `en: "${newEn.replace(/"/g, '\\"')}"`;
  if (line.includes(dqOld)) {
    lines[lineIndex] = line.replace(dqOld, dqNew);
    return true;
  }

  // Fallback: regex-based
  const enRegex = /en:\s*(['"])((?:[^'"\\\n]|\\.)*)(\1)/;
  const m = line.match(enRegex);
  if (m && (m[2].replace(/\\'/g, "'").replace(/\\"/g, '"') === oldEn)) {
    const q = m[1];
    const escaped = newEn.replace(q === "'" ? /'/g : /"/g, q === "'" ? "\\'" : '\\"');
    lines[lineIndex] = line.replace(enRegex, `en: ${q}${escaped}${q}`);
    return true;
  }

  return false;
}

function extractWords(sentence, langCode) {
  return sentence
    .split(/[\s]+/)
    .map(w => w.replace(/^[¿¡.,!?;:"""''()––\-…·«»]+/, '')
              .replace(/[¿¡.,!?;:"""''()––\-…·«»]+$/, ''))
    .filter(Boolean)
    .map(w => {
      if (['es', 'fr', 'de', 'it', 'pt', 'nl', 'sv', 'tr', 'cy'].includes(langCode)) {
        return w.toLowerCase();
      }
      return w;
    });
}

// ── Main processing ─────────────────────────────────────────────────────────

function processLanguage(lang) {
  const dictPath = path.join(ROOT, 'src/data/dictionary', lang.dictFile);
  const deckPath = path.join(ROOT, 'src/data', lang.deckDir, 'deck.json');

  if (!fs.existsSync(dictPath) || !fs.existsSync(deckPath)) {
    console.log(`  Skipping ${lang.code}: missing files`);
    return { code: lang.code, fixed: 0, examples: [] };
  }

  const dictSrc = fs.readFileSync(dictPath, 'utf8');
  const deck = JSON.parse(fs.readFileSync(deckPath, 'utf8'));

  // 1. Parse dictionary
  const entries = parseDictionary(dictSrc);

  // 2. Build word -> set of card IDs index
  const wordToCards = new Map();
  for (const card of deck) {
    const words = extractWords(card.target, lang.code);
    for (const w of words) {
      if (!wordToCards.has(w)) wordToCards.set(w, new Set());
      wordToCards.get(w).add(card.id);
    }
  }

  // 3. Build en-primary -> set of target words index
  const enToTargetWords = new Map();
  for (const entry of entries) {
    const parts = splitDef(entry.en);
    const primary = normalizePart(parts[0]);
    if (!primary) continue;
    if (!enToTargetWords.has(primary)) enToTargetWords.set(primary, new Set());
    enToTargetWords.get(primary).add(entry.word);
  }

  // 4. For each multi-part entry, apply the algorithm
  const lines = dictSrc.split('\n');
  const fixes = [];

  // Function-word POS types
  const FUNCTION_WORD_POS = new Set(['det', 'pron', 'prep', 'conj', 'art', 'part']);

  // All function words (for detecting function-word entries with wrong POS)
  const ALL_FUNCTION_WORDS = new Set([
    ...BARE_PRONOUNS, ...BARE_ARTICLES, ...BARE_PREPOSITIONS,
    'not', 'no', 'yes', 'nor', 'or', 'and', 'but', 'if', 'when',
    'where', 'how', 'why', 'what', 'who', 'which', 'that', 'this',
    'these', 'those', 'there', 'here', 'then', 'than', 'as',
    'so', 'because', 'since', 'while', 'although', 'though',
    'until', 'unless', 'whether', 'either', 'neither',
    'both', 'each', 'every', 'all', 'any', 'some', 'such',
    'own', 'other', 'another', 'one', 'ones',
    'us', 'ourselves', 'them', 'themselves',
    'himself', 'herself', 'itself', 'myself', 'yourself',
    'whose', 'whom',
  ]);

  /**
   * Detect if an entry is likely a function word despite wrong POS.
   * Returns true if the primary definition is a common function word.
   */
  function isLikelyFunctionWord(entry) {
    if (FUNCTION_WORD_POS.has(entry.pos)) return true;
    const primary = normalizePart(splitDef(entry.en)[0]);
    // Check if primary def is a function word
    if (ALL_FUNCTION_WORDS.has(primary)) return true;
    // Check if primary starts with common function patterns
    if (/^(to|at|from|of|in|on|with|by|for|the|a|an|his|her|their|my|your|our|its|it|he|she|they|we|you|who|which|that|this|those|these|some|any|each|every|us|them)\b/.test(primary)) {
      // If it's "to X" and has pos=v, it's a verb, not a function word
      if (/^to /.test(primary) && entry.pos === 'v') return false;
      // If it starts with "the " and the rest is a content word, check pos
      if (/^(the|a|an) /.test(primary)) return false;
      return true;
    }
    return false;
  }

  for (const entry of entries) {
    const parts = splitDef(entry.en);
    if (parts.length < 2) continue;

    const firstPart = parts[0];
    const firstNorm = normalizePart(firstPart);
    const keptParts = [firstPart];
    const isFunctionWord = isLikelyFunctionWord(entry);

    for (let pi = 1; pi < parts.length; pi++) {
      const part = parts[pi];
      const norm = normalizePart(part);
      if (!norm) { keptParts.push(part); continue; }

      let shouldStrip = false;
      const normLower = norm.toLowerCase();

      // Check: bare pronoun/article/preposition (only for content words)
      // But be conservative: only strip if the first part is NOT a synonym
      // (e.g., "down / below" should keep both since they're synonyms)
      if (!isFunctionWord) {
        if (BARE_PRONOUNS.has(normLower) && !areSynonyms(firstNorm, normLower)) {
          shouldStrip = true;
        } else if (BARE_ARTICLES.has(normLower) && !areSynonyms(firstNorm, normLower)) {
          shouldStrip = true;
        } else if (BARE_PREPOSITIONS.has(normLower) && !areSynonyms(firstNorm, normLower)) {
          // Only strip bare prepositions from nouns and verbs
          if (entry.pos === 'n' || entry.pos === 'v') {
            shouldStrip = true;
          }
        }
      }

      // Check: misattributed from another word via co-occurrence
      // Skip this for function words (they legitimately have multiple meanings)
      if (!shouldStrip && !isFunctionWord) {
        const otherWords = enToTargetWords.get(norm);
        if (otherWords) {
          const ourCards = wordToCards.get(entry.word);
          if (ourCards) {
            let coOccurringWord = null;
            for (const otherWord of otherWords) {
              if (otherWord === entry.word) continue;
              const otherCards = wordToCards.get(otherWord);
              if (otherCards) {
                for (const cardId of ourCards) {
                  if (otherCards.has(cardId)) {
                    coOccurringWord = otherWord;
                    break;
                  }
                }
              }
              if (coOccurringWord) break;
            }

            if (coOccurringWord) {
              if (!areSynonyms(firstNorm, norm)) {
                shouldStrip = true;
              }
            }
          }
        }
      }

      if (!shouldStrip) {
        keptParts.push(part);
      }
    }

    // Safety: never strip ALL parts - always keep at least the first
    if (keptParts.length < parts.length && keptParts.length >= 1) {
      const newEn = joinDef(keptParts, entry.en);
      if (newEn !== entry.en) {
        fixes.push({
          word: entry.word,
          oldEn: entry.en,
          newEn,
          lineIndex: entry.lineIndex,
        });
      }
    }
  }

  // Apply fixes
  let applied = 0;
  for (const fix of fixes) {
    if (applyFix(lines, fix.lineIndex, fix.oldEn, fix.newEn)) {
      applied++;
    }
  }

  if (applied > 0) {
    fs.writeFileSync(dictPath, lines.join('\n'), 'utf8');
  }

  return {
    code: lang.code,
    fixed: applied,
    examples: fixes.slice(0, 10).map(f => ({
      word: f.word,
      old: f.oldEn,
      new: f.newEn,
    })),
  };
}

// ── Run ─────────────────────────────────────────────────────────────────────

console.log('=== Context-Bleed Fix (Final) ===\n');

let totalFixed = 0;

for (const lang of LANGUAGES) {
  console.log(`Processing ${lang.code}...`);
  const result = processLanguage(lang);
  totalFixed += result.fixed;
  console.log(`  ${lang.code}: ${result.fixed} entries fixed`);
  if (result.examples.length > 0) {
    console.log('  Examples:');
    for (const ex of result.examples) {
      console.log(`    "${ex.word}": "${ex.old}" -> "${ex.new}"`);
    }
  }
  console.log();
}

console.log(`\nTotal: ${totalFixed} entries fixed across all languages`);
