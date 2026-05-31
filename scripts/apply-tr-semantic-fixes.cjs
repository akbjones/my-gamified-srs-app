#!/usr/bin/env node
/**
 * Apply semantic fixes to Turkish dictionary.
 * Reads mismatches from tr-semantic-fixes.json, filters carefully, applies to tr.ts.
 */

const fs = require('fs');
const path = require('path');

const DICT_PATH = path.join(__dirname, '..', 'src', 'data', 'dictionary', 'tr.ts');
const FIXES_PATH = path.join(__dirname, 'output', 'tr-semantic-fixes.json');

const fixes = JSON.parse(fs.readFileSync(FIXES_PATH, 'utf8'));
let src = fs.readFileSync(DICT_PATH, 'utf8');

// ── Stemming helper ──
// Common English suffixes for basic stemming
function stem(word) {
  return word
    .replace(/ies$/, 'y')
    .replace(/ied$/, 'y')
    .replace(/(s|es|ed|ing|ment|ness|tion|sion|ly|er|est|able|ible|ful|less|ous|ive|al|ial|ical)$/, '')
    .replace(/(.)\1$/, '$1'); // doubled letters: running -> runn -> run
}

function stems(phrase) {
  return phrase.toLowerCase()
    .replace(/[^a-z ]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2)
    .map(stem)
    .filter(w => w.length > 2);
}

// Stop words for English
const STOP = new Set([
  'a','an','the','to','of','in','on','at','is','it','and','or','for','be','am','are',
  'was','were','been','being','do','does','did','has','have','had','i','my','me','we',
  'us','our','you','your','he','his','him','she','her','they','them','their','this',
  'that','these','those','not','no','so','but','if','up','out','with','from','by','as',
  'very','will','can','may','just','would','should','could','might','must','shall',
  'won','don','didn','doesn','haven','hasn','hadn','couldn','wouldn','shouldn',
  'get','got','getting','going','been','also','its','more','much','than','about',
]);

function contentStems(phrase) {
  return stems(phrase).filter(s => !STOP.has(s));
}

// Check if dict and google translations are semantically related
function isSemanticallyRelated(dictEn, googleEn) {
  const dStems = contentStems(dictEn);
  const gStems = contentStems(googleEn);

  if (dStems.length === 0 || gStems.length === 0) return false;

  const gSet = new Set(gStems);
  for (const ds of dStems) {
    if (gSet.has(ds)) return true;
    // Partial stem match (first 3+ chars)
    for (const gs of gStems) {
      const minLen = Math.min(ds.length, gs.length);
      if (minLen >= 3) {
        const compareLen = Math.max(3, Math.floor(minLen * 0.65));
        if (ds.slice(0, compareLen) === gs.slice(0, compareLen)) return true;
      }
    }
  }
  return false;
}

// Synonyms / near-synonyms that should count as matches
const SYNONYM_GROUPS = [
  ['buy', 'purchase', 'get', 'take', 'obtain', 'acquire'],
  ['cry', 'weep', 'sob'],
  ['big', 'large', 'great', 'huge'],
  ['small', 'little', 'tiny'],
  ['happy', 'glad', 'joyful', 'pleased'],
  ['sad', 'unhappy', 'sorrowful'],
  ['start', 'begin', 'commence'],
  ['end', 'finish', 'complete'],
  ['fast', 'quick', 'rapid', 'swift'],
  ['slow', 'sluggish'],
  ['talk', 'speak', 'say', 'tell', 'narrate', 'explain', 'describe'],
  ['walk', 'stroll'],
  ['run', 'jog', 'sprint'],
  ['look', 'see', 'watch', 'view', 'observe', 'gaze'],
  ['hear', 'listen'],
  ['eat', 'consume', 'dine'],
  ['drink', 'sip'],
  ['sleep', 'rest', 'nap', 'doze'],
  ['think', 'consider', 'ponder', 'reflect'],
  ['know', 'understand', 'comprehend', 'recognize'],
  ['want', 'desire', 'wish', 'hope'],
  ['need', 'require'],
  ['give', 'provide', 'offer'],
  ['put', 'place', 'set'],
  ['make', 'create', 'build', 'produce', 'construct'],
  ['break', 'shatter', 'crack'],
  ['hold', 'grip', 'grasp', 'clutch'],
  ['leave', 'depart', 'exit', 'go'],
  ['come', 'arrive', 'approach'],
  ['go', 'leave', 'depart'],
  ['send', 'dispatch'],
  ['receive', 'get', 'obtain'],
  ['help', 'assist', 'aid'],
  ['use', 'utilize', 'employ'],
  ['find', 'discover', 'locate'],
  ['show', 'display', 'demonstrate', 'exhibit'],
  ['turn', 'rotate', 'spin'],
  ['move', 'shift', 'transfer'],
  ['close', 'shut', 'seal'],
  ['open', 'unseal'],
  ['keep', 'maintain', 'retain', 'preserve'],
  ['write', 'compose', 'pen'],
  ['read', 'peruse'],
  ['learn', 'study'],
  ['teach', 'instruct', 'educate'],
  ['play', 'perform'],
  ['work', 'labor', 'toil'],
  ['live', 'reside', 'dwell', 'inhabit'],
  ['die', 'perish', 'pass away'],
  ['fight', 'battle', 'combat', 'struggle'],
  ['win', 'triumph', 'prevail'],
  ['lose', 'forfeit'],
  ['pay', 'compensate'],
  ['sell', 'vend'],
  ['bring', 'fetch', 'carry'],
  ['throw', 'toss', 'hurl'],
  ['pull', 'drag', 'tug'],
  ['push', 'shove'],
  ['cut', 'slice', 'chop'],
  ['clean', 'wash', 'tidy'],
  ['fix', 'repair', 'mend'],
  ['try', 'attempt', 'endeavor'],
  ['wait', 'await'],
  ['ask', 'inquire', 'question'],
  ['answer', 'reply', 'respond'],
  ['call', 'phone', 'ring'],
  ['meet', 'encounter'],
  ['join', 'connect', 'combine', 'unite'],
  ['lift', 'elevator', 'raise', 'elevate'],
  ['car', 'automobile', 'vehicle'],
  ['house', 'home', 'residence'],
  ['road', 'street', 'path', 'way'],
  ['water', 'aqua'],
  ['food', 'meal', 'dish'],
  ['money', 'cash', 'currency'],
  ['child', 'kid', 'offspring'],
  ['man', 'guy', 'fellow', 'male'],
  ['woman', 'lady', 'female'],
  ['pain', 'ache', 'hurt', 'sore'],
  ['ill', 'sick', 'unwell'],
  ['beautiful', 'pretty', 'gorgeous', 'lovely', 'attractive'],
  ['ugly', 'hideous'],
  ['rich', 'wealthy', 'affluent'],
  ['poor', 'impoverished', 'needy'],
  ['old', 'ancient', 'elderly', 'aged'],
  ['new', 'fresh', 'novel'],
  ['young', 'youthful', 'juvenile'],
  ['hot', 'warm', 'heated'],
  ['cold', 'cool', 'chilly', 'freezing'],
  ['angry', 'mad', 'furious', 'upset'],
  ['afraid', 'scared', 'frightened', 'fearful'],
  ['strange', 'weird', 'odd', 'unusual', 'bizarre'],
  ['correct', 'right', 'proper', 'accurate'],
  ['wrong', 'incorrect', 'mistaken'],
  ['enough', 'sufficient', 'adequate'],
  ['city', 'town', 'urban'],
  ['country', 'nation', 'land'],
  ['world', 'globe', 'earth'],
  ['door', 'gate', 'entrance'],
  ['window', 'pane'],
  ['room', 'chamber'],
  ['shoe', 'sho', 'footwear'],
  ['clothes', 'clothing', 'garment', 'apparel'],
  ['search', 'seek', 'look for', 'hunt'],
  ['choose', 'select', 'pick'],
  ['fill', 'load', 'stuff'],
  ['drop', 'fall'],
  ['grow', 'increase', 'expand'],
  ['rise', 'ascend', 'climb'],
  ['stay', 'remain'],
  ['stop', 'halt', 'cease'],
  ['change', 'alter', 'modify', 'transform'],
  ['return', 'come back', 'go back'],
  ['pass', 'cross', 'traverse'],
  ['follow', 'trail', 'pursue'],
  ['carry', 'transport', 'bear'],
  ['reach', 'arrive', 'attain'],
  ['wear', 'put on', 'don'],
  ['forget', 'neglect'],
  ['remember', 'recall', 'recollect'],
  ['believe', 'trust', 'faith'],
  ['succeed', 'achieve'],
  ['fail', 'flop'],
  ['accept', 'agree', 'approve'],
  ['refuse', 'reject', 'decline', 'deny'],
  ['prepare', 'ready', 'arrange'],
  ['celebrate', 'festive', 'festival'],
  ['fire', 'flame', 'blaze'],
  ['stone', 'rock', 'pebble'],
  ['river', 'stream', 'creek'],
  ['mountain', 'hill', 'peak'],
  ['forest', 'wood', 'jungle'],
  ['sea', 'ocean'],
  ['sky', 'heaven'],
  ['flower', 'blossom', 'bloom'],
  ['tree', 'timber'],
  ['bird', 'fowl'],
  ['fish', 'seafood'],
  ['dog', 'canine', 'hound'],
  ['cat', 'feline', 'kitten'],
  ['horse', 'stallion', 'mare'],
  ['brother', 'sibling', 'bro'],
  ['sister', 'sibling', 'sis'],
  ['father', 'dad', 'papa', 'daddy'],
  ['mother', 'mom', 'mama', 'mommy', 'mum'],
];

// Build lookup
const synonymMap = new Map();
for (const group of SYNONYM_GROUPS) {
  for (const word of group) {
    const existing = synonymMap.get(word) || new Set();
    for (const other of group) existing.add(other);
    synonymMap.set(word, existing);
  }
}

function areSynonyms(w1, w2) {
  w1 = w1.toLowerCase();
  w2 = w2.toLowerCase();
  if (w1 === w2) return true;
  const s1 = synonymMap.get(w1);
  if (s1 && s1.has(w2)) return true;
  const s2 = synonymMap.get(stem(w1));
  if (s2 && s2.has(stem(w2))) return true;
  return false;
}

function hasSynonymOverlap(dictEn, googleEn) {
  const dWords = dictEn.toLowerCase().replace(/^to /, '').replace(/[^a-z ]/g, '').split(/\s+/).filter(w => w.length > 1);
  const gWords = googleEn.toLowerCase().replace(/^to /, '').replace(/[^a-z ]/g, '').split(/\s+/).filter(w => w.length > 1);

  for (const dw of dWords) {
    for (const gw of gWords) {
      if (areSynonyms(dw, gw)) return true;
      if (areSynonyms(stem(dw), stem(gw))) return true;
    }
  }
  return false;
}

// ── Clean up Google translation for use as replacement ──
function cleanGoogleTranslation(googleEn, dictEn, trWord) {
  let g = googleEn.trim();

  // Remove HTML entities
  g = g.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&quot;/g, '"');

  // Remove trailing periods
  g = g.replace(/\.$/, '');

  // Lowercase first letter if not a proper noun
  if (g.length > 0 && g[0] === g[0].toUpperCase() && g[1] && g[1] === g[1].toLowerCase()) {
    // Check if it starts with I (pronoun) or is proper noun
    if (!/^(I |I'|[A-Z][a-z]*[A-Z])/.test(g)) {
      g = g[0].toLowerCase() + g.slice(1);
    }
  }

  // If the original dict entry starts with "to " (verb), try to extract verb form
  if (dictEn.startsWith('to ') && !g.startsWith('to ')) {
    // For verb forms, keep the conjugated meaning
  }

  // Escape single quotes for TS
  g = g.replace(/'/g, "\\'");

  return g;
}

// ── Decide which mismatches to actually fix ──
function shouldFix(f) {
  const d = f.dictEn.toLowerCase().trim();
  const g = f.googleEn.toLowerCase().trim();

  // Skip if Google returned the Turkish word back
  if (g === f.tr.toLowerCase()) return false;

  // Skip if Google returned garbage (very short, non-English)
  if (g.length <= 1) return false;

  // Skip if already semantically related
  if (isSemanticallyRelated(d, g)) return false;
  if (hasSynonymOverlap(d, g)) return false;

  // ── Garbled dict entries - DEFINITELY fix ──
  // Dict entry is just "i", "he", "she", "to i", "to he", "sho", etc.
  if (/^(i|he|she|it|we|they|to i|to he|to she|to it|to we|to they|to the|to a|to my|to is|to are|to was|to its|to his|to her|to our|to your|to their|sho|your sho)$/i.test(d)) {
    return true;
  }

  // Dict has truncated words ("sho" for "shoe")
  if (d.length <= 3 && g.length > d.length) return true;

  // ── Verb conjugation handling ──
  // If dict says "to X" and google gives a conjugated form of a DIFFERENT verb, fix
  if (d.startsWith('to ')) {
    const dictVerb = d.replace(/^to /, '');
    const gClean = g.replace(/^(i |you |he |she |it |we |they |i'm |i am |you are |he is |she is |it is |we are |they are |will |would |should |could |can |may |might |must |shall |let's |let me |has |have |had |is |are |was |were |been |being |not |won't |don't |didn't |doesn't |haven't |hasn't |hadn't |couldn't |wouldn't |shouldn't |i'll |you'll |he'll |she'll |we'll |they'll |i'd |you'd |he'd |she'd |we'd |they'd )/gi, '').trim();

    // Check stem similarity
    const dStem = stem(dictVerb);
    const gStem = stem(gClean.split(/\s/)[0] || '');

    if (dStem.length >= 3 && gStem.length >= 3) {
      const compareLen = Math.max(3, Math.min(dStem.length, gStem.length) - 1);
      if (dStem.slice(0, compareLen) === gStem.slice(0, compareLen)) return false;
    }

    // Dict verb and Google verb are completely unrelated = fix
    return true;
  }

  // ── Noun/adj cases ──
  // If the dict translation is clearly wrong (no overlap at all)
  return true;
}

// Count fixes
const toFix = fixes.filter(shouldFix);
console.log(`Mismatches to fix: ${toFix.length} out of ${fixes.length}`);

// Show some examples
console.log('\nSample fixes:');
toFix.slice(0, 20).forEach(f => {
  console.log(`  ${f.tr}: "${f.dictEn}" → "${f.googleEn}"`);
});

// ── Apply fixes ──
let fixCount = 0;
for (const f of toFix) {
  const trEsc = f.tr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Match the en: 'xxx' part for this entry
  const re = new RegExp(`((?:'|")${trEsc}(?:'|")\\s*:\\s*\\{\\s*en:\\s*')([^']*?)(')`);
  const match = src.match(re);

  if (!match) continue;

  const oldEn = match[2];
  const newEn = cleanGoogleTranslation(f.googleEn, f.dictEn, f.tr);

  // Don't replace if new is same as old
  if (oldEn.toLowerCase() === newEn.toLowerCase()) continue;

  // Don't replace with garbage
  if (newEn.length <= 1) continue;
  if (newEn.toLowerCase() === f.tr.toLowerCase()) continue;

  src = src.replace(re, `$1${newEn}$3`);
  fixCount++;
}

console.log(`\nApplied ${fixCount} fixes to tr.ts`);
fs.writeFileSync(DICT_PATH, src);
console.log('Written updated tr.ts');
