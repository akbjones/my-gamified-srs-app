#!/usr/bin/env node
/**
 * English Lemmatizer for post-processing Google Translate output.
 *
 * Covers:
 *   A) 300+ irregular verb forms → base form
 *   B) 200+ irregular noun plurals → singular
 *   C) Regular pattern rules (verb -ing/-ed/-s, noun -s/-es/-ies/-ves)
 *
 * Usage:
 *   const { lemmatize } = require('./english-lemmatizer.cjs');
 *   lemmatize('eaten', 'v')  // → 'eat'
 *   lemmatize('children', 'n') // → 'child'
 */

// ─── A) Irregular verb forms ───────────────────────────────────────────────

const IRREGULAR_VERB_MAP = {};

function addVerb(base, forms) {
  for (const f of forms) {
    if (f !== base) IRREGULAR_VERB_MAP[f] = base;
  }
}

// be
addVerb('be', ['am', 'is', 'are', 'was', 'were', 'been', 'being']);
// have
addVerb('have', ['has', 'had', 'having']);
// do
addVerb('do', ['does', 'did', 'doing', 'done']);
// go
addVerb('go', ['goes', 'went', 'going', 'gone']);
// get
addVerb('get', ['gets', 'got', 'getting', 'gotten']);
// make
addVerb('make', ['makes', 'made', 'making']);
// say
addVerb('say', ['says', 'said', 'saying']);
// know
addVerb('know', ['knows', 'knew', 'knowing', 'known']);
// think
addVerb('think', ['thinks', 'thought', 'thinking']);
// take
addVerb('take', ['takes', 'took', 'taking', 'taken']);
// see
addVerb('see', ['sees', 'saw', 'seeing', 'seen']);
// come
addVerb('come', ['comes', 'came', 'coming']);
// want
addVerb('want', ['wants', 'wanted', 'wanting']);
// give
addVerb('give', ['gives', 'gave', 'giving', 'given']);
// find
addVerb('find', ['finds', 'found', 'finding']);
// tell
addVerb('tell', ['tells', 'told', 'telling']);
// put
addVerb('put', ['puts', 'putting']);
// leave
addVerb('leave', ['leaves', 'left', 'leaving']);
// keep
addVerb('keep', ['keeps', 'kept', 'keeping']);
// let
addVerb('let', ['lets', 'letting']);
// begin
addVerb('begin', ['begins', 'began', 'beginning', 'begun']);
// show
addVerb('show', ['shows', 'showed', 'showing', 'shown']);
// hear
addVerb('hear', ['hears', 'heard', 'hearing']);
// run
addVerb('run', ['runs', 'ran', 'running']);
// bring
addVerb('bring', ['brings', 'brought', 'bringing']);
// write
addVerb('write', ['writes', 'wrote', 'writing', 'written']);
// sit
addVerb('sit', ['sits', 'sat', 'sitting']);
// stand
addVerb('stand', ['stands', 'stood', 'standing']);
// lose
addVerb('lose', ['loses', 'lost', 'losing']);
// pay
addVerb('pay', ['pays', 'paid', 'paying']);
// meet
addVerb('meet', ['meets', 'met', 'meeting']);
// set
addVerb('set', ['sets', 'setting']);
// learn
addVerb('learn', ['learns', 'learned', 'learnt', 'learning']);
// lead
addVerb('lead', ['leads', 'led', 'leading']);
// read
addVerb('read', ['reads', 'reading']);
// grow
addVerb('grow', ['grows', 'grew', 'growing', 'grown']);
// spend
addVerb('spend', ['spends', 'spent', 'spending']);
// win
addVerb('win', ['wins', 'won', 'winning']);
// feel
addVerb('feel', ['feels', 'felt', 'feeling']);
// hold
addVerb('hold', ['holds', 'held', 'holding']);
// buy
addVerb('buy', ['buys', 'bought', 'buying']);
// send
addVerb('send', ['sends', 'sent', 'sending']);
// build
addVerb('build', ['builds', 'built', 'building']);
// fall
addVerb('fall', ['falls', 'fell', 'falling', 'fallen']);
// cut
addVerb('cut', ['cuts', 'cutting']);
// reach
addVerb('reach', ['reaches', 'reached', 'reaching']);
// kill
addVerb('kill', ['kills', 'killed', 'killing']);
// rise
addVerb('rise', ['rises', 'rose', 'rising', 'risen']);
// speak
addVerb('speak', ['speaks', 'spoke', 'speaking', 'spoken']);
// sell
addVerb('sell', ['sells', 'sold', 'selling']);
// drive
addVerb('drive', ['drives', 'drove', 'driving', 'driven']);
// break
addVerb('break', ['breaks', 'broke', 'breaking', 'broken']);
// eat
addVerb('eat', ['eats', 'ate', 'eating', 'eaten']);
// drink
addVerb('drink', ['drinks', 'drank', 'drinking', 'drunk']);
// sleep
addVerb('sleep', ['sleeps', 'slept', 'sleeping']);
// swim
addVerb('swim', ['swims', 'swam', 'swimming', 'swum']);
// fly
addVerb('fly', ['flies', 'flew', 'flying', 'flown']);
// sing
addVerb('sing', ['sings', 'sang', 'singing', 'sung']);
// draw
addVerb('draw', ['draws', 'drew', 'drawing', 'drawn']);
// catch
addVerb('catch', ['catches', 'caught', 'catching']);
// throw
addVerb('throw', ['throws', 'threw', 'throwing', 'thrown']);
// choose
addVerb('choose', ['chooses', 'chose', 'choosing', 'chosen']);
// wear
addVerb('wear', ['wears', 'wore', 'wearing', 'worn']);
// fight
addVerb('fight', ['fights', 'fought', 'fighting']);
// hide
addVerb('hide', ['hides', 'hid', 'hiding', 'hidden']);
// bite
addVerb('bite', ['bites', 'bit', 'biting', 'bitten']);
// blow
addVerb('blow', ['blows', 'blew', 'blowing', 'blown']);
// tear
addVerb('tear', ['tears', 'tore', 'tearing', 'torn']);
// strike
addVerb('strike', ['strikes', 'struck', 'striking', 'stricken']);
// shake
addVerb('shake', ['shakes', 'shook', 'shaking', 'shaken']);
// steal
addVerb('steal', ['steals', 'stole', 'stealing', 'stolen']);
// hang
addVerb('hang', ['hangs', 'hung', 'hanging']);
// dig
addVerb('dig', ['digs', 'dug', 'digging']);
// forget
addVerb('forget', ['forgets', 'forgot', 'forgetting', 'forgotten']);
// forgive
addVerb('forgive', ['forgives', 'forgave', 'forgiving', 'forgiven']);
// freeze
addVerb('freeze', ['freezes', 'froze', 'freezing', 'frozen']);
// lie
addVerb('lie', ['lies', 'lay', 'lying', 'lain']);
// wake
addVerb('wake', ['wakes', 'woke', 'waking', 'woken']);
// ride
addVerb('ride', ['rides', 'rode', 'riding', 'ridden']);
// ring
addVerb('ring', ['rings', 'rang', 'ringing', 'rung']);
// shoot
addVerb('shoot', ['shoots', 'shot', 'shooting']);
// seek
addVerb('seek', ['seeks', 'sought', 'seeking']);
// teach
addVerb('teach', ['teaches', 'taught', 'teaching']);
// understand
addVerb('understand', ['understands', 'understood', 'understanding']);
// feed
addVerb('feed', ['feeds', 'fed', 'feeding']);
// sweep
addVerb('sweep', ['sweeps', 'swept', 'sweeping']);
// stick
addVerb('stick', ['sticks', 'stuck', 'sticking']);
// spread
addVerb('spread', ['spreads', 'spreading']);
// hurt
addVerb('hurt', ['hurts', 'hurting']);
// shut
addVerb('shut', ['shuts', 'shutting']);
// cost
addVerb('cost', ['costs', 'costing']);
// quit
addVerb('quit', ['quits', 'quitting']);

// ── Additional 100+ common irregular verbs ──
addVerb('awake', ['awakes', 'awoke', 'awaking', 'awoken']);
addVerb('bear', ['bears', 'bore', 'bearing', 'born', 'borne']);
addVerb('beat', ['beats', 'beating', 'beaten']);
addVerb('become', ['becomes', 'became', 'becoming']);
addVerb('bend', ['bends', 'bent', 'bending']);
addVerb('bet', ['bets', 'betting']);
addVerb('bind', ['binds', 'bound', 'binding']);
addVerb('bleed', ['bleeds', 'bled', 'bleeding']);
addVerb('bless', ['blesses', 'blessed', 'blest', 'blessing']);
addVerb('breed', ['breeds', 'bred', 'breeding']);
addVerb('broadcast', ['broadcasts', 'broadcasting']);
addVerb('burst', ['bursts', 'bursting']);
addVerb('cast', ['casts', 'casting']);
addVerb('cling', ['clings', 'clung', 'clinging']);
addVerb('creep', ['creeps', 'crept', 'creeping']);
addVerb('deal', ['deals', 'dealt', 'dealing']);
addVerb('dive', ['dives', 'dove', 'diving']);
addVerb('dream', ['dreams', 'dreamed', 'dreamt', 'dreaming']);
addVerb('dwell', ['dwells', 'dwelt', 'dwelling']);
addVerb('flee', ['flees', 'fled', 'fleeing']);
addVerb('fling', ['flings', 'flung', 'flinging']);
addVerb('forbid', ['forbids', 'forbade', 'forbidding', 'forbidden']);
addVerb('forecast', ['forecasts', 'forecasting']);
addVerb('foresee', ['foresees', 'foresaw', 'foreseeing', 'foreseen']);
addVerb('grind', ['grinds', 'ground', 'grinding']);
addVerb('kneel', ['kneels', 'knelt', 'kneeling']);
addVerb('knit', ['knits', 'knitting']);
addVerb('lay', ['lays', 'laid', 'laying']);
addVerb('lean', ['leans', 'leaned', 'leant', 'leaning']);
addVerb('leap', ['leaps', 'leaped', 'leapt', 'leaping']);
addVerb('lend', ['lends', 'lent', 'lending']);
addVerb('light', ['lights', 'lit', 'lighting']);
addVerb('mean', ['means', 'meant', 'meaning']);
addVerb('mow', ['mows', 'mowed', 'mowing', 'mown']);
addVerb('overcome', ['overcomes', 'overcame', 'overcoming']);
addVerb('overtake', ['overtakes', 'overtook', 'overtaking', 'overtaken']);
addVerb('plead', ['pleads', 'pleaded', 'pled', 'pleading']);
addVerb('prove', ['proves', 'proved', 'proving', 'proven']);
addVerb('rebuild', ['rebuilds', 'rebuilt', 'rebuilding']);
addVerb('repay', ['repays', 'repaid', 'repaying']);
addVerb('rid', ['rids', 'ridding']);
addVerb('saw', ['saws', 'sawed', 'sawing', 'sawn']);
addVerb('sew', ['sews', 'sewed', 'sewing', 'sewn']);
addVerb('shed', ['sheds', 'shedding']);
addVerb('shine', ['shines', 'shone', 'shining']);
addVerb('shrink', ['shrinks', 'shrank', 'shrinking', 'shrunk']);
addVerb('sink', ['sinks', 'sank', 'sinking', 'sunk']);
addVerb('slay', ['slays', 'slew', 'slaying', 'slain']);
addVerb('slide', ['slides', 'slid', 'sliding']);
addVerb('sling', ['slings', 'slung', 'slinging']);
addVerb('slit', ['slits', 'slitting']);
addVerb('smell', ['smells', 'smelled', 'smelt', 'smelling']);
addVerb('sneak', ['sneaks', 'sneaked', 'snuck', 'sneaking']);
addVerb('sow', ['sows', 'sowed', 'sowing', 'sown']);
addVerb('spell', ['spells', 'spelled', 'spelt', 'spelling']);
addVerb('spill', ['spills', 'spilled', 'spilt', 'spilling']);
addVerb('spin', ['spins', 'spun', 'spinning']);
addVerb('spit', ['spits', 'spat', 'spitting']);
addVerb('split', ['splits', 'splitting']);
addVerb('spoil', ['spoils', 'spoiled', 'spoilt', 'spoiling']);
addVerb('spring', ['springs', 'sprang', 'springing', 'sprung']);
addVerb('squeeze', ['squeezes', 'squeezed', 'squeezing']);
addVerb('sting', ['stings', 'stung', 'stinging']);
addVerb('stink', ['stinks', 'stank', 'stinking', 'stunk']);
addVerb('stride', ['strides', 'strode', 'striding', 'stridden']);
addVerb('string', ['strings', 'strung', 'stringing']);
addVerb('strive', ['strives', 'strove', 'striving', 'striven']);
addVerb('swear', ['swears', 'swore', 'swearing', 'sworn']);
addVerb('sweep', ['sweeps', 'swept', 'sweeping']);
addVerb('swell', ['swells', 'swelled', 'swelling', 'swollen']);
addVerb('swing', ['swings', 'swung', 'swinging']);
addVerb('thrust', ['thrusts', 'thrusting']);
addVerb('tread', ['treads', 'trod', 'treading', 'trodden']);
addVerb('undergo', ['undergoes', 'underwent', 'undergoing', 'undergone']);
addVerb('undertake', ['undertakes', 'undertook', 'undertaking', 'undertaken']);
addVerb('undo', ['undoes', 'undid', 'undoing', 'undone']);
addVerb('unwind', ['unwinds', 'unwound', 'unwinding']);
addVerb('uphold', ['upholds', 'upheld', 'upholding']);
addVerb('upset', ['upsets', 'upsetting']);
addVerb('weave', ['weaves', 'wove', 'weaving', 'woven']);
addVerb('weep', ['weeps', 'wept', 'weeping']);
addVerb('wind', ['winds', 'wound', 'winding']);
addVerb('withdraw', ['withdraws', 'withdrew', 'withdrawing', 'withdrawn']);
addVerb('withhold', ['withholds', 'withheld', 'withholding']);
addVerb('withstand', ['withstands', 'withstood', 'withstanding']);
addVerb('wring', ['wrings', 'wrung', 'wringing']);

// Additional common verbs
addVerb('arise', ['arises', 'arose', 'arising', 'arisen']);
addVerb('bid', ['bids', 'bidding']);
addVerb('cling', ['clings', 'clung', 'clinging']);
addVerb('creep', ['creeps', 'crept', 'creeping']);
addVerb('dare', ['dares', 'dared', 'daring']);
addVerb('deal', ['deals', 'dealt', 'dealing']);
addVerb('forbid', ['forbids', 'forbade', 'forbidding', 'forbidden']);
addVerb('forgive', ['forgives', 'forgave', 'forgiving', 'forgiven']);
addVerb('grind', ['grinds', 'ground', 'grinding']);
addVerb('kneel', ['kneels', 'knelt', 'kneeled', 'kneeling']);
addVerb('mistake', ['mistakes', 'mistook', 'mistaking', 'mistaken']);
addVerb('outgrow', ['outgrows', 'outgrew', 'outgrowing', 'outgrown']);
addVerb('overcome', ['overcomes', 'overcame', 'overcoming']);
addVerb('overdo', ['overdoes', 'overdid', 'overdoing', 'overdone']);
addVerb('overhear', ['overhears', 'overheard', 'overhearing']);
addVerb('oversee', ['oversees', 'oversaw', 'overseeing', 'overseen']);
addVerb('overthrow', ['overthrows', 'overthrew', 'overthrowing', 'overthrown']);
addVerb('partake', ['partakes', 'partook', 'partaking', 'partaken']);
addVerb('preset', ['presets', 'presetting']);
addVerb('retell', ['retells', 'retold', 'retelling']);
addVerb('rewrite', ['rewrites', 'rewrote', 'rewriting', 'rewritten']);
addVerb('slit', ['slits', 'slitting']);
addVerb('spin', ['spins', 'spun', 'spinning']);
addVerb('split', ['splits', 'splitting']);
addVerb('sting', ['stings', 'stung', 'stinging']);
addVerb('stride', ['strides', 'strode', 'striding']);
addVerb('string', ['strings', 'strung', 'stringing']);
addVerb('swear', ['swears', 'swore', 'swearing', 'sworn']);
addVerb('swing', ['swings', 'swung', 'swinging']);
addVerb('wake', ['wakes', 'woke', 'woken', 'waking']);
addVerb('weave', ['weaves', 'wove', 'weaving', 'woven']);
addVerb('weep', ['weeps', 'wept', 'weeping']);
addVerb('wind', ['winds', 'wound', 'winding']);
addVerb('wring', ['wrings', 'wrung', 'wringing']);

// More everyday verbs often seen in translations
addVerb('ask', ['asks', 'asked', 'asking']);
addVerb('call', ['calls', 'called', 'calling']);
addVerb('carry', ['carries', 'carried', 'carrying']);
addVerb('change', ['changes', 'changed', 'changing']);
addVerb('close', ['closes', 'closed', 'closing']);
addVerb('cook', ['cooks', 'cooked', 'cooking']);
addVerb('count', ['counts', 'counted', 'counting']);
addVerb('cover', ['covers', 'covered', 'covering']);
addVerb('create', ['creates', 'created', 'creating']);
addVerb('cross', ['crosses', 'crossed', 'crossing']);
addVerb('cry', ['cries', 'cried', 'crying']);
addVerb('dance', ['dances', 'danced', 'dancing']);
addVerb('decide', ['decides', 'decided', 'deciding']);
addVerb('deliver', ['delivers', 'delivered', 'delivering']);
addVerb('die', ['dies', 'died', 'dying']);
addVerb('dry', ['dries', 'dried', 'drying']);
addVerb('enjoy', ['enjoys', 'enjoyed', 'enjoying']);
addVerb('enter', ['enters', 'entered', 'entering']);
addVerb('explain', ['explains', 'explained', 'explaining']);
addVerb('fill', ['fills', 'filled', 'filling']);
addVerb('finish', ['finishes', 'finished', 'finishing']);
addVerb('follow', ['follows', 'followed', 'following']);
addVerb('gather', ['gathers', 'gathered', 'gathering']);
addVerb('happen', ['happens', 'happened', 'happening']);
addVerb('help', ['helps', 'helped', 'helping']);
addVerb('hope', ['hopes', 'hoped', 'hoping']);
addVerb('include', ['includes', 'included', 'including']);
addVerb('increase', ['increases', 'increased', 'increasing']);
addVerb('join', ['joins', 'joined', 'joining']);
addVerb('jump', ['jumps', 'jumped', 'jumping']);
addVerb('laugh', ['laughs', 'laughed', 'laughing']);
addVerb('like', ['likes', 'liked', 'liking']);
addVerb('listen', ['listens', 'listened', 'listening']);
addVerb('live', ['lives', 'lived', 'living']);
addVerb('look', ['looks', 'looked', 'looking']);
addVerb('love', ['loves', 'loved', 'loving']);
addVerb('move', ['moves', 'moved', 'moving']);
addVerb('need', ['needs', 'needed', 'needing']);
addVerb('notice', ['notices', 'noticed', 'noticing']);
addVerb('offer', ['offers', 'offered', 'offering']);
addVerb('open', ['opens', 'opened', 'opening']);
addVerb('order', ['orders', 'ordered', 'ordering']);
addVerb('pass', ['passes', 'passed', 'passing']);
addVerb('pick', ['picks', 'picked', 'picking']);
addVerb('place', ['places', 'placed', 'placing']);
addVerb('plan', ['plans', 'planned', 'planning']);
addVerb('play', ['plays', 'played', 'playing']);
addVerb('point', ['points', 'pointed', 'pointing']);
addVerb('pour', ['pours', 'poured', 'pouring']);
addVerb('prepare', ['prepares', 'prepared', 'preparing']);
addVerb('press', ['presses', 'pressed', 'pressing']);
addVerb('protect', ['protects', 'protected', 'protecting']);
addVerb('provide', ['provides', 'provided', 'providing']);
addVerb('pull', ['pulls', 'pulled', 'pulling']);
addVerb('push', ['pushes', 'pushed', 'pushing']);
addVerb('raise', ['raises', 'raised', 'raising']);
addVerb('receive', ['receives', 'received', 'receiving']);
addVerb('remember', ['remembers', 'remembered', 'remembering']);
addVerb('remove', ['removes', 'removed', 'removing']);
addVerb('repeat', ['repeats', 'repeated', 'repeating']);
addVerb('return', ['returns', 'returned', 'returning']);
addVerb('save', ['saves', 'saved', 'saving']);
addVerb('search', ['searches', 'searched', 'searching']);
addVerb('serve', ['serves', 'served', 'serving']);
addVerb('share', ['shares', 'shared', 'sharing']);
addVerb('smile', ['smiles', 'smiled', 'smiling']);
addVerb('start', ['starts', 'started', 'starting']);
addVerb('stay', ['stays', 'stayed', 'staying']);
addVerb('stop', ['stops', 'stopped', 'stopping']);
addVerb('study', ['studies', 'studied', 'studying']);
addVerb('suggest', ['suggests', 'suggested', 'suggesting']);
addVerb('support', ['supports', 'supported', 'supporting']);
addVerb('suppose', ['supposes', 'supposed', 'supposing']);
addVerb('talk', ['talks', 'talked', 'talking']);
addVerb('touch', ['touches', 'touched', 'touching']);
addVerb('travel', ['travels', 'traveled', 'travelled', 'traveling', 'travelling']);
addVerb('try', ['tries', 'tried', 'trying']);
addVerb('turn', ['turns', 'turned', 'turning']);
addVerb('use', ['uses', 'used', 'using']);
addVerb('visit', ['visits', 'visited', 'visiting']);
addVerb('wait', ['waits', 'waited', 'waiting']);
addVerb('walk', ['walks', 'walked', 'walking']);
addVerb('wash', ['washes', 'washed', 'washing']);
addVerb('watch', ['watches', 'watched', 'watching']);
addVerb('wish', ['wishes', 'wished', 'wishing']);
addVerb('wonder', ['wonders', 'wondered', 'wondering']);
addVerb('work', ['works', 'worked', 'working']);
addVerb('worry', ['worries', 'worried', 'worrying']);
addVerb('wrap', ['wraps', 'wrapped', 'wrapping']);

// ─── B) Irregular noun plurals → singular ──────────────────────────────────

const IRREGULAR_NOUN_MAP = {
  // Classic irregulars
  'mice': 'mouse', 'children': 'child', 'teeth': 'tooth', 'feet': 'foot',
  'geese': 'goose', 'women': 'woman', 'men': 'man', 'people': 'person',
  'oxen': 'ox', 'lice': 'louse', 'dice': 'die',

  // -f/-fe → -ves
  'knives': 'knife', 'leaves': 'leaf', 'wolves': 'wolf', 'lives': 'life',
  'halves': 'half', 'wives': 'wife', 'shelves': 'shelf', 'selves': 'self',
  'calves': 'calf', 'loaves': 'loaf', 'thieves': 'thief', 'scarves': 'scarf',
  'wharves': 'wharf', 'dwarves': 'dwarf', 'elves': 'elf', 'hooves': 'hoof',

  // Latin/Greek forms
  'cacti': 'cactus', 'fungi': 'fungus', 'alumni': 'alumnus',
  'stimuli': 'stimulus', 'syllabi': 'syllabus', 'criteria': 'criterion',
  'phenomena': 'phenomenon', 'analyses': 'analysis', 'crises': 'crisis',
  'hypotheses': 'hypothesis', 'oases': 'oasis', 'theses': 'thesis',
  'axes': 'axis', 'indices': 'index', 'matrices': 'matrix',
  'vertices': 'vertex', 'appendices': 'appendix', 'radii': 'radius',
  'nuclei': 'nucleus', 'foci': 'focus', 'curricula': 'curriculum',
  'data': 'datum', 'media': 'medium', 'bacteria': 'bacterium',
  'strata': 'stratum', 'memoranda': 'memorandum', 'formulae': 'formula',
  'antennae': 'antenna', 'larvae': 'larva', 'vertebrae': 'vertebra',
  'algae': 'alga', 'amoebae': 'amoeba', 'minutiae': 'minutia',
  'nebulae': 'nebula', 'alumni': 'alumnus', 'alumnae': 'alumna',
  'apparatuses': 'apparatus', 'plateaux': 'plateau', 'chateaux': 'chateau',
  'bureaux': 'bureau', 'tableaux': 'tableau',

  // -is → -es (already covered above but adding more)
  'bases': 'base', 'diagnoses': 'diagnosis', 'ellipses': 'ellipsis',
  'neuroses': 'neurosis', 'parentheses': 'parenthesis', 'synopses': 'synopsis',
  'prognoses': 'prognosis',

  // Zero-plural (these map to themselves, but useful to know)
  // sheep, fish, deer, moose, series, species, aircraft, etc.

  // Other irregulars
  'brethren': 'brother', 'cherubim': 'cherub', 'seraphim': 'seraph',
  'phenomena': 'phenomenon', 'automata': 'automaton',

  // Common compound/unusual plurals
  'brothers-in-law': 'brother-in-law', 'sisters-in-law': 'sister-in-law',
  'mothers-in-law': 'mother-in-law', 'fathers-in-law': 'father-in-law',
  'passers-by': 'passer-by', 'runners-up': 'runner-up',
  'courts-martial': 'court-martial',

  // More everyday irregulars
  'tomatoes': 'tomato', 'potatoes': 'potato', 'heroes': 'hero',
  'echoes': 'echo', 'torpedoes': 'torpedo', 'vetoes': 'veto',
  'volcanoes': 'volcano', 'mosquitoes': 'mosquito', 'mangoes': 'mango',
  'buffaloes': 'buffalo', 'dominoes': 'domino', 'zeroes': 'zero',

  // -ies (these are technically regular but we include for safety)
  'stories': 'story', 'babies': 'baby', 'cities': 'city',
  'families': 'family', 'parties': 'party', 'countries': 'country',
  'bodies': 'body', 'armies': 'army', 'activities': 'activity',
  'abilities': 'ability', 'batteries': 'battery', 'beauties': 'beauty',
  'berries': 'berry', 'boundaries': 'boundary', 'butterflies': 'butterfly',
  'calories': 'calorie', 'categories': 'category', 'centuries': 'century',
  'ceremonies': 'ceremony', 'cherries': 'cherry', 'colonies': 'colony',
  'companies': 'company', 'communities': 'community', 'copies': 'copy',
  'counties': 'county', 'dairies': 'dairy', 'deliveries': 'delivery',
  'dictionaries': 'dictionary', 'difficulties': 'difficulty',
  'discoveries': 'discovery', 'duties': 'duty', 'economies': 'economy',
  'emergencies': 'emergency', 'enemies': 'enemy', 'energies': 'energy',
  'entries': 'entry', 'factories': 'factory', 'fairies': 'fairy',
  'flies': 'fly', 'galleries': 'gallery', 'groceries': 'grocery',
  'histories': 'history', 'holidays': 'holiday', 'industries': 'industry',
  'injuries': 'injury', 'inquiries': 'inquiry', 'jellies': 'jelly',
  'journeys': 'journey', 'keys': 'key', 'ladies': 'lady',
  'libraries': 'library', 'lilies': 'lily', 'memories': 'memory',
  'mercies': 'mercy', 'mysteries': 'mystery', 'navies': 'navy',
  'necessities': 'necessity', 'nurseries': 'nursery', 'opportunities': 'opportunity',
  'penalties': 'penalty', 'pennies': 'penny', 'personalities': 'personality',
  'philosophies': 'philosophy', 'policies': 'policy', 'ponies': 'pony',
  'possibilities': 'possibility', 'priorities': 'priority', 'properties': 'property',
  'puppies': 'puppy', 'qualities': 'quality', 'quantities': 'quantity',
  'queries': 'query', 'remedies': 'remedy', 'replies': 'reply',
  'responsibilities': 'responsibility', 'rubies': 'ruby', 'salaries': 'salary',
  'secretaries': 'secretary', 'societies': 'society', 'strategies': 'strategy',
  'studies': 'study', 'supplies': 'supply', 'theories': 'theory',
  'territories': 'territory', 'therapies': 'therapy', 'tragedies': 'tragedy',
  'treasuries': 'treasury', 'universities': 'university', 'utilities': 'utility',
  'valleys': 'valley', 'varieties': 'variety', 'victories': 'victory',
  'worries': 'worry',
};

// ─── C) Regular pattern rules ──────────────────────────────────────────────

// Set of double-consonant base words (for -ing removal: running→run)
const DOUBLE_CONSONANT_BASES = new Set([
  'run', 'sit', 'put', 'get', 'set', 'cut', 'hit', 'let', 'win', 'swim',
  'dig', 'rub', 'hug', 'nod', 'beg', 'bid', 'dip', 'fan', 'fit', 'grip',
  'hop', 'jam', 'jog', 'knit', 'lap', 'map', 'mop', 'nap', 'net', 'nip',
  'pad', 'pan', 'pat', 'peg', 'pet', 'pin', 'pit', 'plot', 'plug', 'pop',
  'pot', 'prod', 'prop', 'ram', 'rap', 'rip', 'rob', 'rot', 'sag', 'sap',
  'scan', 'ship', 'shop', 'shut', 'skip', 'slam', 'slap', 'slim', 'slip',
  'slit', 'snap', 'snip', 'sob', 'span', 'spin', 'spit', 'split', 'spot',
  'stab', 'star', 'step', 'stir', 'stop', 'strap', 'strip', 'stun', 'sub',
  'sum', 'sun', 'swap', 'tag', 'tan', 'tap', 'thin', 'tip', 'top', 'trap',
  'trek', 'trim', 'trip', 'trot', 'tug', 'wag', 'wed', 'wet', 'whip',
  'win', 'wrap', 'zip', 'ban', 'bar', 'bat', 'blur', 'bob', 'bop', 'brim',
  'bud', 'bug', 'bus', 'cap', 'chat', 'chip', 'chop', 'clap', 'clip',
  'clog', 'cop', 'cram', 'crop', 'dam', 'drag', 'drip', 'drop', 'drum',
  'dub', 'dump', 'flip', 'flog', 'flop', 'fog', 'gag', 'gap', 'grab',
  'grin', 'gut', 'hem', 'hip', 'hog', 'jab', 'jet', 'jot', 'kid', 'kit',
  'knot', 'lag', 'lid', 'log', 'lug', 'mad', 'man', 'mat', 'mob', 'mud',
  'mug', 'nag', 'nut', 'occur', 'omit', 'pen', 'pep', 'permit', 'pig',
  'plan', 'plod', 'plop', 'plug', 'prefer', 'prig', 'prim', 'prod', 'pug',
  'quit', 'quiz', 'rag', 'ram', 'recap', 'red', 'refer', 'regret', 'rig',
  'rim', 'rot', 'sad', 'scar', 'ship', 'shred', 'sin', 'skim', 'skin',
  'skid', 'sled', 'slid', 'smog', 'snag', 'snub', 'sod', 'sop', 'squat',
  'stag', 'stem', 'stint', 'strop', 'strut', 'submit', 'swig', 'swot',
  'tab', 'throb', 'thud', 'tot', 'tram', 'trot', 'wad', 'whet', 'wig',
  'wit', 'yap',
]);

/**
 * Check if a consonant is doubled for -ing/-ed forms.
 * E.g. "running" → last consonant doubled.
 */
function isDoubledConsonant(stem) {
  if (stem.length < 3) return false;
  const last = stem[stem.length - 1];
  const secondLast = stem[stem.length - 2];
  return last === secondLast && /[bcdfghjklmnpqrstvwxyz]/.test(last);
}

/**
 * Lemmatize a verb: try irregular map first, then regular rules.
 */
function lemmatizeVerb(word) {
  const w = word.toLowerCase().trim();

  // Check irregular map
  if (IRREGULAR_VERB_MAP[w]) return IRREGULAR_VERB_MAP[w];

  // -ing removal
  if (w.endsWith('ing') && w.length > 4) {
    const stem = w.slice(0, -3);

    // Double consonant: running → run
    if (isDoubledConsonant(stem)) {
      const base = stem.slice(0, -1);
      if (DOUBLE_CONSONANT_BASES.has(base)) return base;
      // If not in known set but looks right, still try
      if (base.length >= 2) return base;
    }

    // -ying → -y (but NOT "dying" type — those are irregular)
    if (stem.endsWith('y')) return stem; // e.g. "playing" → stem is "play"

    // Try adding back -e: making → mak → make
    const withE = stem + 'e';
    // Simple heuristic: if stem ends in consonant, try +e
    if (/[bcdfghjklmnpqrstvwxyz]$/.test(stem)) {
      // But not if it would look weird (3+ consonants before -e)
      return withE;
    }

    // Default: just the stem
    return stem;
  }

  // -ed removal
  if (w.endsWith('ed') && w.length > 3) {
    // Words ending in -eed are base forms, not -ed suffixed (need, feed, seed, weed, bleed, breed, speed, deed)
    if (w.endsWith('eed')) return w;

    const stem = w.slice(0, -2);

    // -ied → -y: carried → carry
    if (w.endsWith('ied')) {
      return w.slice(0, -3) + 'y';
    }

    // Double consonant: stopped → stop
    if (isDoubledConsonant(stem)) {
      const base = stem.slice(0, -1);
      if (base.length >= 2) return base;
    }

    // If stem ends in consonant, might need +e: loved → lov → love
    if (/[bcdfghjklmnpqrstvwxyz]$/.test(stem) && stem.length >= 2) {
      // Check if stem + e makes more sense than stem alone
      // Heuristic: if previous char is vowel + consonant, stem is fine (played → play — wait, that's -ed)
      // Actually "played" → stem="play", which is fine
      // "loved" → stem="lov" → need "love"
      // "used" → stem="us" → need "use"
      const prev = stem[stem.length - 2];
      if (/[aeiouy]/.test(prev)) {
        // vowel + consonant + ed: "used" → "use", "loved" → "love"
        return stem + 'e';
      }
      // consonant + consonant + ed: "helped" → "help"
      return stem;
    }

    // Default: remove -d only: "saved" → stem is "save" + d? No, we removed "ed"
    // Actually -ed was already removed. If stem ends in vowel, that's fine: "freed" → "free"
    return stem;
  }

  // -s/-es removal
  if (w.endsWith('s') && w.length > 2) {
    // -ies → -y: carries → carry
    if (w.endsWith('ies') && w.length > 4) {
      return w.slice(0, -3) + 'y';
    }

    // -es: watches → watch, pushes → push, fixes → fix
    if (w.endsWith('es') && w.length > 3) {
      const stemNoEs = w.slice(0, -2);
      if (/(?:sh|ch|ss|x|z|o)$/.test(stemNoEs)) {
        return stemNoEs;
      }
    }

    // Simple -s: eats → eat
    return w.slice(0, -1);
  }

  return w;
}

/**
 * Lemmatize a noun: try irregular map first, then regular plural rules.
 */
function lemmatizeNoun(word) {
  const w = word.toLowerCase().trim();

  // Check irregular map
  if (IRREGULAR_NOUN_MAP[w]) return IRREGULAR_NOUN_MAP[w];

  // Not plural? Return as-is
  if (!w.endsWith('s') || w.length < 3) return w;

  // Don't singularize -ness, -less, -ous, -us, -is, -ss words (these aren't plurals)
  if (/(?:ness|less|ous|[^aeiouy]us|[^aeiouy]is|ss)$/.test(w)) return w;

  // -ies → -y: countries → country
  if (w.endsWith('ies') && w.length > 4) {
    return w.slice(0, -3) + 'y';
  }

  // -ves → -f or -fe: scarves → scarf
  if (w.endsWith('ves') && w.length > 4) {
    const stemF = w.slice(0, -3) + 'f';
    const stemFe = w.slice(0, -3) + 'fe';
    // Both are valid possibilities; prefer -fe for common words
    const feWords = new Set(['knife', 'life', 'wife', 'strife']);
    if (feWords.has(stemFe)) return stemFe;
    return stemF;
  }

  // -es: watches → watch, boxes → box, buses → bus
  if (w.endsWith('es') && w.length > 3) {
    const stemNoEs = w.slice(0, -2);
    // -sses → -ss: dresses → dress
    if (w.endsWith('sses')) return w.slice(0, -2);
    // -shes, -ches, -xes, -zes → remove -es
    if (/(?:sh|ch|x|z)$/.test(stemNoEs)) return stemNoEs;
    // -oes → -o: tomatoes → tomato (but already in irregular)
    if (w.endsWith('oes')) return w.slice(0, -2);
  }

  // Simple -s: cats → cat
  return w.slice(0, -1);
}

/**
 * Main lemmatizer function.
 * @param {string} word - The word to lemmatize
 * @param {string} pos - Part of speech: 'v' for verb, 'n' for noun, or other
 * @returns {string} The base/lemma form
 */
function lemmatize(word, pos) {
  if (!word) return word;
  const w = word.toLowerCase().trim();

  // Direct lookup in irregular verbs (regardless of POS, as a fallback)
  if (pos === 'v' || pos === 'verb') {
    return lemmatizeVerb(w);
  }

  if (pos === 'n' || pos === 'noun') {
    return lemmatizeNoun(w);
  }

  // For adjectives/adverbs, try both and return the shorter one
  if (pos === 'adj' || pos === 'adv') {
    // Try removing common suffixes
    if (w.endsWith('er') && w.length > 3) {
      // "bigger" → "big", "taller" → "tall"
      const stem = w.slice(0, -2);
      if (isDoubledConsonant(stem + w[w.length - 3])) return stem;
      return w.slice(0, -2);
    }
    if (w.endsWith('est') && w.length > 4) {
      const stem = w.slice(0, -3);
      return stem;
    }
    if (w.endsWith('ly') && w.length > 3) {
      return w.slice(0, -2);
    }
    return w;
  }

  // Unknown POS: try verb first, then noun
  const vResult = lemmatizeVerb(w);
  if (vResult !== w) return vResult;
  const nResult = lemmatizeNoun(w);
  if (nResult !== w) return nResult;
  return w;
}

// Export for use as module
module.exports = { lemmatize, IRREGULAR_VERB_MAP, IRREGULAR_NOUN_MAP };

// Self-test if run directly
if (require.main === module) {
  const tests = [
    // Irregular verbs
    ['eaten', 'v', 'eat'],
    ['went', 'v', 'go'],
    ['was', 'v', 'be'],
    ['thought', 'v', 'think'],
    ['taken', 'v', 'take'],
    ['spoken', 'v', 'speak'],
    ['frozen', 'v', 'freeze'],
    ['slept', 'v', 'sleep'],
    ['taught', 'v', 'teach'],
    ['understood', 'v', 'understand'],
    // Regular verb -ing
    ['making', 'v', 'make'],
    ['running', 'v', 'run'],
    ['sitting', 'v', 'sit'],
    ['giving', 'v', 'give'],
    ['playing', 'v', 'play'],
    // Regular verb -ed
    ['carried', 'v', 'carry'],
    ['loved', 'v', 'love'],
    ['played', 'v', 'play'],
    ['helped', 'v', 'help'],
    // Regular verb -s
    ['carries', 'v', 'carry'],
    ['watches', 'v', 'watch'],
    ['eats', 'v', 'eat'],
    // Irregular nouns
    ['children', 'n', 'child'],
    ['mice', 'n', 'mouse'],
    ['teeth', 'n', 'tooth'],
    ['knives', 'n', 'knife'],
    ['analyses', 'n', 'analysis'],
    // Regular nouns
    ['countries', 'n', 'country'],
    ['watches', 'n', 'watch'],
    ['cats', 'n', 'cat'],
    ['boxes', 'n', 'box'],
  ];

  let passed = 0, failed = 0;
  for (const [input, pos, expected] of tests) {
    const result = lemmatize(input, pos);
    if (result === expected) {
      passed++;
    } else {
      failed++;
      console.log(`FAIL: lemmatize("${input}", "${pos}") = "${result}" (expected "${expected}")`);
    }
  }
  console.log(`\nResults: ${passed} passed, ${failed} failed out of ${tests.length} tests`);
  console.log(`Irregular verbs: ${Object.keys(IRREGULAR_VERB_MAP).length} entries`);
  console.log(`Irregular nouns: ${Object.keys(IRREGULAR_NOUN_MAP).length} entries`);
}
