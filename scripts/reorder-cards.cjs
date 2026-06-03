#!/usr/bin/env node
/**
 * reorder-cards.cjs – Reorder deck cards by grammar node, then difficulty
 *
 * Primary sort: grammarNode (node-01 < node-02 < ... < node-35)
 * Secondary sort: English-based difficulty score (easiest first within each node)
 *
 * Difficulty scoring uses the ENGLISH translation:
 *   1. Count uncommon English words (not in top ~1500 common words)
 *   2. difficulty = uncommonWordCount * 10 + sentenceLength + avgWordLength * 0.5
 *   3. Penalize repetitive patterns: if 5+ cards share near-identical English,
 *      keep 2 and push the rest to the end.
 *
 * For each language:
 *   1. Read deck.json
 *   2. Score each card by English translation difficulty
 *   3. Detect and penalize repetitive patterns
 *   4. Sort by grammarNode first, then by difficulty within each node
 *   5. Reassign IDs sequentially
 *   6. Update audio field to match new ID
 *   7. Write back to deck.json
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const LANGUAGES = [
  { dir: 'spanish',    code: 'es' },
  { dir: 'italian',    code: 'it' },
  { dir: 'french',     code: 'fr' },
  { dir: 'portuguese', code: 'pt' },
  { dir: 'german',     code: 'de' },
  { dir: 'dutch',      code: 'nl' },
  { dir: 'swedish',    code: 'sv' },
  { dir: 'welsh',      code: 'cy' },
  { dir: 'hindi',      code: 'hi' },
  { dir: 'turkish',    code: 'tr' },
  { dir: 'russian',    code: 'ru' },
];

// ─── Common English Words (~1500 most frequent) ───────────────────────────────
const COMMON_ENGLISH = new Set([
  // Pronouns & determiners
  'i', 'me', 'my', 'mine', 'myself', 'you', 'your', 'yours', 'yourself',
  'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself',
  'it', 'its', 'itself', 'we', 'us', 'our', 'ours', 'ourselves',
  'they', 'them', 'their', 'theirs', 'themselves',
  'this', 'that', 'these', 'those', 'the', 'a', 'an',
  'who', 'whom', 'whose', 'which', 'what', 'where', 'when', 'why', 'how',
  'whoever', 'whatever', 'wherever', 'whenever',

  // Conjunctions & prepositions
  'and', 'or', 'but', 'nor', 'so', 'yet', 'for', 'because', 'since',
  'although', 'though', 'while', 'whereas', 'if', 'unless', 'until',
  'after', 'before', 'during', 'in', 'on', 'at', 'to', 'from', 'with',
  'without', 'about', 'of', 'by', 'up', 'down', 'out', 'into', 'over',
  'under', 'between', 'through', 'across', 'along', 'around', 'near',
  'against', 'upon', 'within', 'among', 'towards', 'toward', 'behind',
  'beside', 'besides', 'beyond', 'above', 'below', 'beneath', 'despite',
  'except', 'per', 'via', 'than',

  // Common verbs (base + common inflections)
  'be', 'is', 'am', 'are', 'was', 'were', 'been', 'being',
  'have', 'has', 'had', 'having',
  'do', 'does', 'did', 'done', 'doing',
  'will', 'would', 'shall', 'should', 'can', 'could', 'may', 'might', 'must',
  'go', 'goes', 'went', 'gone', 'going',
  'come', 'comes', 'came', 'coming',
  'get', 'gets', 'got', 'gotten', 'getting',
  'make', 'makes', 'made', 'making',
  'take', 'takes', 'took', 'taken', 'taking',
  'give', 'gives', 'gave', 'given', 'giving',
  'say', 'says', 'said', 'saying',
  'tell', 'tells', 'told', 'telling',
  'ask', 'asks', 'asked', 'asking',
  'know', 'knows', 'knew', 'known', 'knowing',
  'think', 'thinks', 'thought', 'thinking',
  'see', 'sees', 'saw', 'seen', 'seeing',
  'look', 'looks', 'looked', 'looking',
  'find', 'finds', 'found', 'finding',
  'want', 'wants', 'wanted', 'wanting',
  'need', 'needs', 'needed', 'needing',
  'like', 'likes', 'liked', 'liking',
  'love', 'loves', 'loved', 'loving',
  'use', 'uses', 'used', 'using',
  'try', 'tries', 'tried', 'trying',
  'help', 'helps', 'helped', 'helping',
  'show', 'shows', 'showed', 'shown', 'showing',
  'keep', 'keeps', 'kept', 'keeping',
  'let', 'lets', 'letting',
  'begin', 'begins', 'began', 'begun', 'beginning',
  'start', 'starts', 'started', 'starting',
  'stop', 'stops', 'stopped', 'stopping',
  'end', 'ends', 'ended', 'ending',
  'finish', 'finishes', 'finished', 'finishing',
  'learn', 'learns', 'learned', 'learning',
  'teach', 'teaches', 'taught', 'teaching',
  'study', 'studies', 'studied', 'studying',
  'read', 'reads', 'reading',
  'write', 'writes', 'wrote', 'written', 'writing',
  'speak', 'speaks', 'spoke', 'spoken', 'speaking',
  'talk', 'talks', 'talked', 'talking',
  'listen', 'listens', 'listened', 'listening',
  'hear', 'hears', 'heard', 'hearing',
  'play', 'plays', 'played', 'playing',
  'run', 'runs', 'ran', 'running',
  'walk', 'walks', 'walked', 'walking',
  'move', 'moves', 'moved', 'moving',
  'live', 'lives', 'lived', 'living',
  'work', 'works', 'worked', 'working',
  'eat', 'eats', 'ate', 'eaten', 'eating',
  'drink', 'drinks', 'drank', 'drunk', 'drinking',
  'sleep', 'sleeps', 'slept', 'sleeping',
  'sit', 'sits', 'sat', 'sitting',
  'stand', 'stands', 'stood', 'standing',
  'put', 'puts', 'putting',
  'turn', 'turns', 'turned', 'turning',
  'open', 'opens', 'opened', 'opening',
  'close', 'closes', 'closed', 'closing',
  'bring', 'brings', 'brought', 'bringing',
  'carry', 'carries', 'carried', 'carrying',
  'send', 'sends', 'sent', 'sending',
  'pay', 'pays', 'paid', 'paying',
  'buy', 'buys', 'bought', 'buying',
  'sell', 'sells', 'sold', 'selling',
  'spend', 'spends', 'spent', 'spending',
  'save', 'saves', 'saved', 'saving',
  'hold', 'holds', 'held', 'holding',
  'feel', 'feels', 'felt', 'feeling',
  'leave', 'leaves', 'left', 'leaving',
  'call', 'calls', 'called', 'calling',
  'meet', 'meets', 'met', 'meeting',
  'change', 'changes', 'changed', 'changing',
  'follow', 'follows', 'followed', 'following',
  'lead', 'leads', 'led', 'leading',
  'lose', 'loses', 'lost', 'losing',
  'win', 'wins', 'won', 'winning',
  'break', 'breaks', 'broke', 'broken', 'breaking',
  'cut', 'cuts', 'cutting',
  'build', 'builds', 'built', 'building',
  'grow', 'grows', 'grew', 'grown', 'growing',
  'fall', 'falls', 'fell', 'fallen', 'falling',
  'pass', 'passes', 'passed', 'passing',
  'wait', 'waits', 'waited', 'waiting',
  'set', 'sets', 'setting',
  'reach', 'reaches', 'reached', 'reaching',
  'stay', 'stays', 'stayed', 'staying',
  'wear', 'wears', 'wore', 'worn', 'wearing',
  'watch', 'watches', 'watched', 'watching',
  'happen', 'happens', 'happened', 'happening',
  'become', 'becomes', 'became', 'becoming',
  'seem', 'seems', 'seemed', 'seeming',
  'appear', 'appears', 'appeared', 'appearing',
  'mean', 'means', 'meant', 'meaning',
  'believe', 'believes', 'believed', 'believing',
  'decide', 'decides', 'decided', 'deciding',
  'choose', 'chooses', 'chose', 'chosen', 'choosing',
  'pick', 'picks', 'picked', 'picking',
  'die', 'dies', 'died', 'dying',
  'born',
  'hope', 'hopes', 'hoped', 'hoping',
  'wish', 'wishes', 'wished', 'wishing',
  'remember', 'remembers', 'remembered', 'remembering',
  'forget', 'forgets', 'forgot', 'forgotten', 'forgetting',
  'understand', 'understands', 'understood', 'understanding',
  'agree', 'agrees', 'agreed', 'agreeing',
  'offer', 'offers', 'offered', 'offering',
  'accept', 'accepts', 'accepted', 'accepting',
  'refuse', 'refuses', 'refused', 'refusing',
  'enjoy', 'enjoys', 'enjoyed', 'enjoying',
  'care', 'cares', 'cared', 'caring',
  'worry', 'worries', 'worried', 'worrying',
  'mind', 'minds',
  'matter', 'matters', 'mattered',
  'guess', 'guesses', 'guessed', 'guessing',
  'cook', 'cooks', 'cooked', 'cooking',
  'clean', 'cleans', 'cleaned', 'cleaning',
  'wash', 'washes', 'washed', 'washing',
  'fill', 'fills', 'filled', 'filling',
  'cover', 'covers', 'covered', 'covering',
  'serve', 'serves', 'served', 'serving',
  'join', 'joins', 'joined', 'joining',
  'share', 'shares', 'shared', 'sharing',
  'add', 'adds', 'added', 'adding',
  'include', 'includes', 'included', 'including',
  'count', 'counts', 'counted', 'counting',
  'fit', 'fits', 'fitted', 'fitting',
  'match', 'matches', 'matched', 'matching',
  'protect', 'protects', 'protected', 'protecting',
  'support', 'supports', 'supported', 'supporting',
  'visit', 'visits', 'visited', 'visiting',
  'travel', 'travels', 'traveled', 'travelled', 'traveling', 'travelling',
  'arrive', 'arrives', 'arrived', 'arriving',
  'return', 'returns', 'returned', 'returning',
  'cross', 'crosses', 'crossed', 'crossing',
  'enter', 'enters', 'entered', 'entering',
  'miss', 'misses', 'missed', 'missing',
  'hate', 'hates', 'hated', 'hating',
  'prefer', 'prefers', 'preferred', 'preferring',
  'belong', 'belongs', 'belonged', 'belonging',
  'drop', 'drops', 'dropped', 'dropping',
  'throw', 'throws', 'threw', 'thrown', 'throwing',
  'catch', 'catches', 'caught', 'catching',
  'push', 'pushes', 'pushed', 'pushing',
  'pull', 'pulls', 'pulled', 'pulling',
  'lift', 'lifts', 'lifted', 'lifting',
  'hit', 'hits', 'hitting',
  'kick', 'kicks', 'kicked', 'kicking',
  'point', 'points', 'pointed', 'pointing',
  'touch', 'touches', 'touched', 'touching',
  'press', 'presses', 'pressed', 'pressing',
  'hang', 'hangs', 'hung', 'hanging',
  'drive', 'drives', 'drove', 'driven', 'driving',
  'ride', 'rides', 'rode', 'ridden', 'riding',
  'fly', 'flies', 'flew', 'flown', 'flying',
  'swim', 'swims', 'swam', 'swum', 'swimming',
  'draw', 'draws', 'drew', 'drawn', 'drawing',
  'sing', 'sings', 'sang', 'sung', 'singing',
  'dance', 'dances', 'danced', 'dancing',
  'smile', 'smiles', 'smiled', 'smiling',
  'cry', 'cries', 'cried', 'crying',
  'laugh', 'laughs', 'laughed', 'laughing',
  'kill', 'kills', 'killed', 'killing',
  'fight', 'fights', 'fought', 'fighting',
  'raise', 'raises', 'raised', 'raising',
  'create', 'creates', 'created', 'creating',
  'allow', 'allows', 'allowed', 'allowing',
  'continue', 'continues', 'continued', 'continuing',
  'explain', 'explains', 'explained', 'explaining',
  'consider', 'considers', 'considered', 'considering',
  'develop', 'develops', 'developed', 'developing',
  'suggest', 'suggests', 'suggested', 'suggesting',
  'require', 'requires', 'required', 'requiring',
  'prepare', 'prepares', 'prepared', 'preparing',
  'produce', 'produces', 'produced', 'producing',
  'receive', 'receives', 'received', 'receiving',
  'provide', 'provides', 'provided', 'providing',
  'expect', 'expects', 'expected', 'expecting',
  'suppose', 'supposes', 'supposed', 'supposing',
  'plan', 'plans', 'planned', 'planning',
  'notice', 'notices', 'noticed', 'noticing',
  'promise', 'promises', 'promised', 'promising',
  'improve', 'improves', 'improved', 'improving',
  'manage', 'manages', 'managed', 'managing',
  'check', 'checks', 'checked', 'checking',
  'fix', 'fixes', 'fixed', 'fixing',
  'place', 'places', 'placed', 'placing',
  'rain', 'rains', 'rained', 'raining',
  'snow', 'snows', 'snowed', 'snowing',

  // Adverbs
  'not', 'no', 'yes', 'very', 'really', 'quite', 'just', 'only',
  'also', 'too', 'still', 'already', 'yet', 'enough', 'much', 'more',
  'most', 'less', 'least', 'well', 'better', 'best', 'worse', 'worst',
  'again', 'back', 'away', 'together', 'apart', 'ahead', 'often',
  'always', 'never', 'sometimes', 'usually', 'probably', 'perhaps',
  'maybe', 'certainly', 'definitely', 'exactly', 'almost', 'nearly',
  'completely', 'totally', 'absolutely', 'especially', 'particularly',
  'quickly', 'slowly', 'carefully', 'easily', 'hardly', 'simply',
  'actually', 'recently', 'soon', 'early', 'late', 'here', 'there',
  'now', 'then', 'today', 'tomorrow', 'yesterday', 'tonight', 'ever',
  'even', 'however', 'therefore', 'instead', 'finally', 'suddenly',
  'immediately', 'anyway', 'otherwise', 'anymore', 'everywhere',
  'somewhere', 'nowhere', 'outside', 'inside', 'upstairs', 'downstairs',
  'ahead', 'forward', 'straight', 'directly',

  // Adjectives
  'good', 'bad', 'great', 'big', 'small', 'large', 'little', 'long',
  'short', 'tall', 'high', 'low', 'wide', 'deep', 'thick', 'thin',
  'old', 'new', 'young', 'fast', 'slow', 'hot', 'cold', 'warm', 'cool',
  'hard', 'soft', 'easy', 'difficult', 'heavy', 'light', 'strong',
  'weak', 'rich', 'poor', 'happy', 'sad', 'angry', 'tired', 'hungry',
  'thirsty', 'sick', 'ill', 'healthy', 'safe', 'dangerous', 'busy',
  'free', 'full', 'empty', 'clean', 'dirty', 'dark', 'bright',
  'beautiful', 'pretty', 'ugly', 'nice', 'fine', 'wonderful', 'terrible',
  'awful', 'amazing', 'important', 'necessary', 'possible', 'impossible',
  'sure', 'certain', 'true', 'false', 'real', 'wrong', 'right', 'ready',
  'able', 'different', 'same', 'similar', 'special', 'simple', 'clear',
  'usual', 'common', 'normal', 'natural', 'strange', 'funny', 'serious',
  'quiet', 'loud', 'public', 'private', 'popular', 'famous', 'own',
  'other', 'another', 'next', 'last', 'first', 'second', 'third',
  'main', 'whole', 'half', 'both', 'each', 'every', 'all', 'some',
  'any', 'few', 'many', 'several', 'certain', 'enough', 'extra',
  'whole', 'entire', 'complete', 'final', 'perfect', 'fresh', 'dry',
  'wet', 'flat', 'round', 'sharp', 'smooth', 'rough', 'sweet', 'bitter',
  'sour', 'lovely', 'pleasant', 'afraid', 'scared', 'nervous', 'proud',
  'sorry', 'glad', 'surprised', 'excited', 'interested', 'bored',
  'late', 'alone', 'together', 'available', 'responsible', 'careful',
  'various', 'local', 'modern', 'traditional', 'recent', 'current',
  'separate', 'single', 'double', 'wide', 'narrow',
  'dear', 'cheap', 'expensive', 'favorite', 'favourite',

  // Nouns – people
  'man', 'men', 'woman', 'women', 'child', 'children', 'boy', 'girl',
  'baby', 'person', 'people', 'father', 'mother', 'parent', 'parents',
  'brother', 'sister', 'son', 'daughter', 'husband', 'wife',
  'grandfather', 'grandmother', 'grandparent', 'uncle', 'aunt', 'cousin',
  'friend', 'friends', 'neighbor', 'neighbour', 'teacher', 'student',
  'doctor', 'nurse', 'worker', 'boss', 'manager', 'driver', 'artist',
  'writer', 'singer', 'player', 'king', 'queen', 'sir',
  'family', 'families', 'team', 'group', 'class', 'member', 'guest',

  // Nouns – body
  'body', 'head', 'face', 'eye', 'eyes', 'ear', 'ears', 'nose', 'mouth',
  'tooth', 'teeth', 'lip', 'lips', 'hair', 'hand', 'hands', 'finger',
  'fingers', 'arm', 'arms', 'leg', 'legs', 'foot', 'feet', 'knee',
  'shoulder', 'back', 'neck', 'heart', 'blood', 'skin', 'bone',
  'stomach', 'brain', 'voice',

  // Nouns – places
  'place', 'house', 'home', 'room', 'kitchen', 'bedroom', 'bathroom',
  'door', 'window', 'wall', 'floor', 'roof', 'garden', 'yard',
  'street', 'road', 'city', 'town', 'village', 'country', 'state',
  'world', 'area', 'region', 'center', 'centre', 'side', 'corner',
  'school', 'university', 'college', 'library', 'hospital', 'church',
  'office', 'store', 'shop', 'market', 'restaurant', 'hotel', 'park',
  'station', 'airport', 'bank', 'museum', 'theater', 'theatre', 'gym',
  'farm', 'factory', 'building', 'apartment', 'flat',

  // Nouns – nature
  'river', 'lake', 'sea', 'ocean', 'beach', 'island', 'mountain',
  'hill', 'valley', 'forest', 'field', 'land', 'ground', 'earth',
  'sky', 'sun', 'moon', 'star', 'stars', 'cloud', 'clouds', 'wind',
  'rain', 'snow', 'ice', 'fire', 'air', 'water', 'tree', 'trees',
  'flower', 'flowers', 'plant', 'plants', 'grass', 'leaf', 'leaves',
  'rock', 'stone', 'sand', 'dust', 'wood',

  // Nouns – animals
  'animal', 'animals', 'dog', 'dogs', 'cat', 'cats', 'bird', 'birds',
  'fish', 'horse', 'horses', 'cow', 'cows', 'chicken', 'pig',
  'sheep', 'rabbit', 'mouse', 'bear', 'lion', 'tiger', 'elephant',
  'monkey', 'snake', 'insect', 'butterfly', 'ant', 'bee', 'wolf',

  // Nouns – food & drink
  'food', 'meal', 'breakfast', 'lunch', 'dinner', 'bread', 'rice',
  'meat', 'chicken', 'fish', 'egg', 'eggs', 'cheese', 'butter',
  'milk', 'cream', 'sugar', 'salt', 'pepper', 'oil', 'flour',
  'fruit', 'apple', 'orange', 'banana', 'tomato', 'potato', 'onion',
  'carrot', 'salad', 'soup', 'cake', 'chocolate', 'ice',
  'tea', 'coffee', 'juice', 'beer', 'wine', 'drink', 'water',
  'vegetable', 'vegetables',

  // Nouns – objects
  'thing', 'things', 'book', 'books', 'page', 'letter', 'word', 'words',
  'paper', 'pen', 'pencil', 'picture', 'photo', 'photograph',
  'phone', 'telephone', 'computer', 'machine', 'screen',
  'table', 'chair', 'desk', 'bed', 'box', 'bag', 'bottle', 'cup',
  'glass', 'plate', 'bowl', 'knife', 'fork', 'spoon',
  'key', 'clock', 'watch', 'mirror', 'lamp', 'light',
  'car', 'bus', 'train', 'plane', 'boat', 'ship', 'bicycle', 'bike',
  'ticket', 'map', 'sign', 'door', 'gate',
  'ball', 'game', 'toy', 'gift', 'present', 'card',
  'clothes', 'shirt', 'dress', 'shoes', 'coat', 'hat', 'pants',
  'pocket', 'button', 'ring', 'umbrella',
  'money', 'coin', 'price', 'bill',
  'tool', 'piece', 'part', 'bit',
  'medicine', 'drug',

  // Nouns – abstract & time
  'time', 'day', 'days', 'night', 'nights', 'morning', 'afternoon',
  'evening', 'week', 'weeks', 'month', 'months', 'year', 'years',
  'hour', 'hours', 'minute', 'minutes', 'second', 'seconds', 'moment',
  'today', 'tomorrow', 'yesterday',
  'name', 'age', 'life', 'death', 'love', 'war', 'peace',
  'idea', 'thought', 'question', 'answer', 'problem', 'solution',
  'reason', 'cause', 'result', 'effect', 'fact', 'truth', 'lie',
  'news', 'information', 'knowledge', 'experience', 'education',
  'history', 'science', 'art', 'music', 'song', 'story', 'movie', 'film',
  'language', 'lesson', 'test', 'example', 'situation', 'condition',
  'chance', 'opportunity', 'choice', 'decision', 'plan', 'project',
  'job', 'career', 'business', 'company', 'industry',
  'power', 'energy', 'force', 'pressure', 'speed', 'weight', 'size',
  'space', 'distance', 'direction', 'north', 'south', 'east', 'west',
  'number', 'amount', 'level', 'degree', 'rate', 'percent', 'total',
  'kind', 'type', 'sort', 'form', 'shape', 'color', 'colour',
  'red', 'blue', 'green', 'yellow', 'white', 'black', 'brown', 'gray',
  'grey', 'pink', 'purple', 'orange',
  'way', 'method', 'system', 'rule', 'law', 'right', 'rights',
  'government', 'society', 'culture', 'tradition',
  'case', 'point', 'line', 'end', 'beginning', 'middle', 'top', 'bottom',
  'success', 'failure', 'mistake', 'effort', 'attention', 'interest',
  'goal', 'dream', 'wish', 'fear', 'surprise', 'pain', 'pleasure',
  'joy', 'happiness', 'health', 'wealth',
  'relationship', 'conversation', 'discussion', 'argument',
  'weather', 'temperature', 'season', 'spring', 'summer', 'autumn', 'winter',
  'holiday', 'vacation', 'trip', 'journey', 'adventure',
  'party', 'event', 'ceremony', 'wedding', 'birthday',
  'sport', 'sports', 'exercise',
  'market', 'economy',
  'future', 'past', 'present',

  // Numbers
  'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight',
  'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen',
  'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty', 'thirty',
  'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety',
  'hundred', 'thousand', 'million', 'zero',

  // Other common words
  'lot', 'lots', 'bit', 'kind', 'part', 'rest',
  'everything', 'something', 'anything', 'nothing',
  'everyone', 'someone', 'anyone', 'no one', 'nobody', 'everybody', 'somebody', 'anybody',
  'mr', 'mrs', 'ms', 'dr',
  'ok', 'okay', 'please', 'thank', 'thanks', 'sorry', 'hello', 'hi',
  'bye', 'goodbye', 'welcome',

  // Additional common words for SRS context
  'need', 'want', 'know', 'think', 'feel', 'see', 'look', 'hear',
  'such', 'own', 'like', 'as', 'don\'t', 'didn\'t', 'doesn\'t', 'isn\'t',
  'aren\'t', 'wasn\'t', 'weren\'t', 'won\'t', 'wouldn\'t', 'shouldn\'t',
  'couldn\'t', 'can\'t', 'haven\'t', 'hasn\'t', 'hadn\'t',
  'there\'s', 'it\'s', 'that\'s', 'what\'s', 'he\'s', 'she\'s', 'i\'m',
  'you\'re', 'we\'re', 'they\'re', 'i\'ve', 'you\'ve', 'we\'ve', 'they\'ve',
  'i\'ll', 'you\'ll', 'he\'ll', 'she\'ll', 'we\'ll', 'they\'ll', 'i\'d',
  'there', 'the',
  'able', 'while', 'among', 'during',
  'likely', 'real', 'practice', 'practice', 'course', 'land',
  'possible',  'political', 'social', 'national', 'international',
  'general', 'personal', 'physical', 'basic', 'medical', 'military',
  'religious', 'financial', 'legal', 'official',
  'environment', 'technology', 'internet', 'computer', 'website',
  'phone', 'email',
  'door', 'window', 'table', 'chair', 'floor', 'wall',
  'bed', 'kitchen', 'garden', 'bathroom',
  'clothes', 'dress', 'shirt', 'shoes', 'hat', 'coat',
  'camera', 'radio', 'television', 'tv',
  'report', 'article', 'magazine', 'newspaper', 'document',
  'note', 'list', 'message', 'mail', 'sign',
  'address', 'road', 'bridge', 'corner', 'path', 'step', 'steps',
  'stair', 'stairs',
  'noise', 'sound', 'color', 'colour', 'smell', 'taste',
  'feeling', 'thought', 'memory', 'opinion', 'expression',
  'century', 'period', 'era', 'generation', 'population',
  'rule', 'standard', 'process', 'practice', 'performance', 'production',
  'army', 'police', 'security', 'crime', 'prison',
  'neck', 'chest', 'wing', 'tail',
  'professor', 'scientist', 'engineer', 'lawyer', 'judge', 'officer',
  'soldier', 'captain', 'chief', 'president', 'minister', 'leader',
  'citizen', 'customer', 'patient', 'audience', 'crowd', 'passenger',
]);

// ─── Advanced Concept Words (~200 words that are "common" but conceptually hard) ─
// These words appear frequently in English but represent abstract/professional
// concepts that are NOT appropriate for beginner lessons. Each adds +5 to difficulty.
const ADVANCED_CONCEPT_WORDS = new Set([
  // Professional/academic
  'field', 'area', 'research', 'policy', 'economy', 'society', 'culture',
  'environment', 'government', 'philosophy', 'technology', 'industry',
  'opinion', 'analysis', 'experience', 'opportunity', 'responsibility',
  'situation', 'community', 'organization', 'development', 'education',
  'relationship', 'communication', 'management', 'performance', 'perspective',
  'contribution', 'influence', 'achievement', 'strategy', 'approach',
  'investment', 'budget', 'revenue', 'profit', 'capital', 'resource',
  'infrastructure', 'institution', 'administration', 'legislation',
  'regulation', 'initiative', 'assessment', 'evaluation', 'implementation',

  // Abstract reasoning
  'concept', 'theory', 'principle', 'aspect', 'factor', 'element',
  'context', 'structure', 'framework', 'mechanism', 'phenomenon',
  'consequence', 'significance', 'implication', 'assumption', 'hypothesis',
  'evidence', 'conclusion', 'interpretation', 'criteria', 'priority',
  'alternative', 'proportion', 'distribution', 'tendency', 'pattern',

  // Professional life
  'career', 'profession', 'colleague', 'department', 'conference',
  'presentation', 'schedule', 'deadline', 'appointment', 'interview',
  'negotiation', 'contract', 'agreement', 'proposal', 'recommendation',
  'qualification', 'certificate', 'diploma', 'promotion', 'salary',
  'pension', 'insurance', 'mortgage', 'investment', 'stakeholder',

  // Society/politics
  'democracy', 'parliament', 'constitution', 'authority', 'bureaucracy',
  'ideology', 'campaign', 'election', 'candidate', 'representative',
  'minority', 'majority', 'inequality', 'discrimination', 'migration',
  'immigration', 'refugee', 'citizenship', 'sovereignty', 'diplomacy',

  // Science/tech
  'algorithm', 'database', 'network', 'artificial', 'intelligence',
  'sustainability', 'renewable', 'ecosystem', 'biodiversity', 'emissions',
  'pollution', 'conservation', 'innovation', 'automation', 'engineering',
  'laboratory', 'experiment', 'methodology', 'statistics', 'variable',

  // Complex everyday
  'circumstances', 'consequences', 'expectations', 'requirements',
  'arrangements', 'accommodation', 'maintenance', 'renovation',
  'transportation', 'destination', 'reservation', 'itinerary',
  'registration', 'application', 'subscription', 'transaction',
  'documentation', 'identification', 'authorization', 'notification',
  'guarantee', 'warranty', 'complaint', 'compensation', 'reimbursement',

  // Abstract qualities
  'efficiency', 'effectiveness', 'flexibility', 'reliability', 'integrity',
  'transparency', 'accountability', 'diversity', 'complexity', 'controversy',
  'ambiguity', 'consistency', 'competence', 'independence', 'autonomy',
  'prosperity', 'welfare', 'heritage', 'legacy', 'reputation',
  'awareness', 'consciousness', 'perception', 'attitude', 'motivation',
  'inspiration', 'commitment', 'dedication', 'enthusiasm', 'satisfaction',
  'frustration', 'anxiety', 'depression', 'therapy', 'psychology',
  'discipline', 'curriculum', 'syllabus', 'academic', 'intellectual',
  'philosophical', 'theoretical', 'practical', 'fundamental', 'comprehensive',
]);

// ─── Subordinating Conjunctions (signal complex sentence structure) ────────────
const SUBORDINATING_CONJUNCTIONS = new Set([
  'because', 'although', 'though', 'unless', 'whereas', 'while',
  'whenever', 'wherever', 'whoever', 'whatever', 'whichever',
  'provided', 'supposing', 'assuming',
]);

// ─── Abstract question patterns (beyond simple "What is this?") ────────────────
const ABSTRACT_QUESTION_PATTERNS = [
  /\bwhat (?:field|area|kind of work|type of|sort of|sector|branch)\b/i,
  /\bwhich (?:area|field|sector|department|direction|approach|method)\b/i,
  /\bhow (?:often|long|much|many|far)\b.*\b(?:usually|typically|generally|normally)\b/i,
  /\bwhat (?:do you|does \w+) (?:think|believe|consider|recommend|suggest|prefer)\b/i,
  /\bwhat (?:is|are) (?:your|his|her|their) (?:opinion|view|perspective|take|thought)\b/i,
  /\bhow would you (?:describe|explain|define|characterize)\b/i,
  /\bwhat (?:role|impact|effect|influence|contribution)\b/i,
  /\bto what (?:extent|degree)\b/i,
  /\bin what (?:way|sense|respect|manner)\b/i,
];

/**
 * Tokenize a sentence into words (handles Latin, Cyrillic, Devanagari, etc.)
 */
function tokenize(sentence) {
  if (!sentence) return [];
  const tokens = sentence.match(/[\p{L}\p{M}\p{N}]+(?:['']\p{L}+)*/gu);
  if (!tokens) return [];
  return tokens.map(t => t.toLowerCase());
}

/**
 * Tokenize English text – strips punctuation, lowercases, splits on whitespace.
 */
function tokenizeEnglish(sentence) {
  if (!sentence) return [];
  // Remove punctuation except apostrophes within words, then split
  const cleaned = sentence.toLowerCase().replace(/[^a-z0-9' ]/g, ' ');
  return cleaned.split(/\s+/).filter(w => w.length > 0);
}

/**
 * Normalize an English sentence for duplicate detection.
 * Strips articles, common filler, lowercases, and sorts content words.
 */
function normalizeForDuplicateDetection(english) {
  if (!english) return '';
  const words = tokenizeEnglish(english);
  // Remove very common function words for pattern matching
  const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'in', 'on', 'at', 'to', 'of', 'and', 'or', 'but', 'for', 'with']);
  const contentWords = words.filter(w => !stopWords.has(w) && w.length > 1);
  return contentWords.sort().join(' ');
}

/**
 * Score a card's difficulty based on English translation.
 *
 * Scoring components:
 *   1. Uncommon English words: +10 per word not in top ~1500
 *   2. Advanced concept words: +5 per word (common but conceptually hard)
 *   3. Abstract question patterns: +8 if the question asks about abstract topics
 *   4. Subordinating conjunctions: +3 per conjunction (complex sentence structure)
 *   5. Sentence length: +1 per word
 *   6. Average word length: +0.5
 */
function scoreCard(card) {
  const english = card.english || '';
  const words = tokenizeEnglish(english);
  const sentenceLength = words.length;

  // Count uncommon English words
  let uncommonCount = 0;
  for (const w of words) {
    // Skip very short words (contractions, articles) and numbers
    if (w.length <= 1) continue;
    if (/^\d+$/.test(w)) continue;
    if (!COMMON_ENGLISH.has(w)) {
      uncommonCount++;
    }
  }

  // Count advanced concept words (these ARE in COMMON_ENGLISH but are conceptually hard)
  let advancedConceptCount = 0;
  for (const w of words) {
    if (ADVANCED_CONCEPT_WORDS.has(w)) {
      advancedConceptCount++;
    }
  }

  // Check for abstract question patterns
  let abstractQuestionPenalty = 0;
  for (const pattern of ABSTRACT_QUESTION_PATTERNS) {
    if (pattern.test(english)) {
      abstractQuestionPenalty = 8;
      break;
    }
  }

  // Count subordinating conjunctions (complex sentence structure)
  let subordinatingCount = 0;
  for (const w of words) {
    if (SUBORDINATING_CONJUNCTIONS.has(w)) {
      subordinatingCount++;
    }
  }

  // Average English word length
  const avgWordLength = words.length > 0
    ? words.reduce((sum, w) => sum + w.length, 0) / words.length
    : 0;

  // Combined difficulty score
  const difficulty =
    uncommonCount * 10 +           // rare vocabulary
    advancedConceptCount * 5 +     // conceptually advanced words
    abstractQuestionPenalty +       // abstract question patterns
    subordinatingCount * 3 +       // complex sentence structure
    sentenceLength * 1 +           // longer = harder
    avgWordLength * 0.5;           // longer words = harder

  return { card, difficulty, uncommonCount, advancedConceptCount, subordinatingCount, abstractQuestionPenalty, sentenceLength };
}

function processLanguage({ dir, code }) {
  const deckPath = path.join(ROOT, 'src', 'data', dir, 'deck.json');

  if (!fs.existsSync(deckPath)) {
    console.log(`  SKIP: ${deckPath} not found`);
    return;
  }

  const cards = JSON.parse(fs.readFileSync(deckPath, 'utf8'));
  if (!Array.isArray(cards) || cards.length === 0) {
    console.log(`  SKIP: ${dir} – empty or not an array`);
    return;
  }

  console.log(`\n=== ${dir.toUpperCase()} (${code}) – ${cards.length} cards ===`);

  // Step 1: Score each card by English translation
  const scored = cards.map(card => scoreCard(card));

  // Step 2: Detect repetitive patterns in English translations
  // Group cards by normalized English content
  const patternGroups = new Map();
  for (const item of scored) {
    const normalized = normalizeForDuplicateDetection(item.card.english);
    if (!normalized) continue;
    if (!patternGroups.has(normalized)) {
      patternGroups.set(normalized, []);
    }
    patternGroups.get(normalized).push(item);
  }

  // Mark repetitive cards: if 5+ share near-identical English, keep 2 and penalize the rest
  const penalized = new Set();
  let totalPenalized = 0;
  for (const [pattern, group] of patternGroups) {
    if (group.length >= 5) {
      // Sort by original difficulty so we keep the 2 easiest
      group.sort((a, b) => a.difficulty - b.difficulty);
      for (let i = 2; i < group.length; i++) {
        penalized.add(group[i]);
        group[i].difficulty += 9999; // Push to end
        totalPenalized++;
      }
    }
  }

  if (totalPenalized > 0) {
    console.log(`  Penalized ${totalPenalized} repetitive cards (pushed to end)`);
  }

  // Step 3: Sort by grammarNode first, then by difficulty within each node
  scored.sort((a, b) => {
    // Extract node number (e.g., "node-01" -> 1, "node-35" -> 35)
    const nodeA = parseInt((a.card.grammarNode || 'node-99').replace('node-', ''), 10);
    const nodeB = parseInt((b.card.grammarNode || 'node-99').replace('node-', ''), 10);
    if (nodeA !== nodeB) return nodeA - nodeB;
    // Within the same node, sort by difficulty (easiest first)
    return a.difficulty - b.difficulty;
  });

  // Step 4: Reassign IDs and audio
  const reordered = scored.map(({ card }, index) => {
    const num = index + 1;
    const paddedNum = String(num).padStart(4, '0');
    const newId = `${code}-${paddedNum}`;

    // Determine audio pattern based on language format
    // Hindi/Turkish/Russian use: "hi/hi-0001.mp3" (subfolder, zero-padded)
    // Others use: "es-1.mp3" (no subfolder, no zero-padding)
    let newAudio;
    if (['hi', 'tr', 'ru'].includes(code)) {
      newAudio = `${code}/${code}-${paddedNum}.mp3`;
    } else {
      newAudio = `${code}-${num}.mp3`;
    }

    return {
      ...card,
      id: newId,
      audio: newAudio,
    };
  });

  // Step 5: Write back
  fs.writeFileSync(deckPath, JSON.stringify(reordered, null, 2) + '\n', 'utf8');

  // Step 6: Print first 5 and last 5
  console.log('  FIRST 5 (node-01, easiest):');
  for (let i = 0; i < Math.min(5, reordered.length); i++) {
    const c = reordered[i];
    const eng = (c.english || '').substring(0, 60);
    const s = scored[i];
    const sc = s.difficulty.toFixed(2);
    console.log(`    ${c.id} | ${c.grammarNode} | score=${sc} unc=${s.uncommonCount} adv=${s.advancedConceptCount} subj=${s.subordinatingCount} aq=${s.abstractQuestionPenalty} | ${eng}`);
  }
  console.log('  LAST 5 (node-35, hardest):');
  for (let i = Math.max(0, reordered.length - 5); i < reordered.length; i++) {
    const c = reordered[i];
    const eng = (c.english || '').substring(0, 60);
    const s = scored[i];
    const rawDiff = s.difficulty;
    const sc = rawDiff >= 9999 ? `${(rawDiff - 9999).toFixed(2)}+REP` : rawDiff.toFixed(2);
    console.log(`    ${c.id} | ${c.grammarNode} | score=${sc} unc=${s.uncommonCount} adv=${s.advancedConceptCount} | ${eng}`);
  }

  // Verify node ordering
  let violations = 0;
  for (let i = 1; i < reordered.length; i++) {
    const prevNode = parseInt((reordered[i-1].grammarNode || 'node-99').replace('node-', ''), 10);
    const currNode = parseInt((reordered[i].grammarNode || 'node-99').replace('node-', ''), 10);
    if (currNode < prevNode) violations++;
  }
  console.log(`  Node ordering violations: ${violations}`);

  console.log(`  Done: ${reordered.length} cards reordered and saved.`);
}

// Run for all languages
console.log('Card Reordering Script – Grammar node order + difficulty scoring');
console.log('Primary: grammarNode (node-01 < node-02 < ... < node-35)');
console.log('Secondary: uncommon*10 + advancedConcept*5 + abstractQ*8 + subordinating*3 + sentLen + avgWordLen*0.5');
console.log('Repetitive patterns (5+ identical) penalized to end of their node\n');

for (const lang of LANGUAGES) {
  processLanguage(lang);
}

console.log('\nAll languages processed.');
