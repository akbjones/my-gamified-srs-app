#!/usr/bin/env node
/**
 * Fix remaining dictionary issues across ALL 11 languages:
 *   Step 2: Fix missing "to " on verb entries
 *   Step 3: Fix real semantic failures (re-translate via Google)
 *   Step 4: Fix false infinitives (nouns wrongly tagged as verbs)
 *
 * Usage: node scripts/fix-remaining-issues.cjs [--dry-run]
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const BASE = path.resolve(__dirname, '..');
const DICT_DIR = path.join(BASE, 'src/data/dictionary');
const OUT_DIR = path.join(BASE, 'scripts/output');

const API_KEY = 'AIzaSyBImkCNYcI1m9mloUNcYcDN2L5dQZwADzI';
const DRY_RUN = process.argv.includes('--dry-run');
const BATCH_SIZE = 80;

const LANGUAGES = ['es', 'it', 'fr', 'pt', 'de', 'nl', 'sv', 'cy', 'hi', 'tr', 'ru'];

// ── Known English verbs (base forms) ──────────────────────────────────
const KNOWN_ENGLISH_VERBS = new Set([
  'accept', 'achieve', 'act', 'add', 'admit', 'advise', 'afford', 'agree', 'allow', 'announce',
  'answer', 'appear', 'apply', 'argue', 'arrange', 'arrive', 'ask', 'attack', 'attempt', 'attend',
  'avoid', 'bake', 'bathe', 'be', 'bear', 'beat', 'become', 'begin', 'behave', 'believe',
  'belong', 'bend', 'bet', 'bite', 'bleed', 'bless', 'blow', 'boil', 'borrow', 'bother',
  'break', 'breathe', 'bring', 'broadcast', 'build', 'burn', 'burst', 'buy', 'calculate', 'call',
  'cancel', 'care', 'carry', 'catch', 'cause', 'celebrate', 'change', 'charge', 'chat', 'check',
  'choose', 'claim', 'clean', 'clear', 'climb', 'close', 'collect', 'combine', 'come', 'comment',
  'commit', 'communicate', 'compare', 'compete', 'complain', 'complete', 'concentrate', 'concern',
  'confirm', 'connect', 'consider', 'consist', 'contact', 'contain', 'continue', 'contribute',
  'control', 'convince', 'cook', 'cool', 'copy', 'correct', 'cost', 'count', 'cover', 'crash',
  'create', 'cross', 'cry', 'cut', 'damage', 'dance', 'dare', 'deal', 'decide', 'declare',
  'decorate', 'decrease', 'defend', 'deliver', 'demand', 'deny', 'depend', 'describe', 'design',
  'desire', 'destroy', 'detect', 'determine', 'develop', 'die', 'dig', 'direct', 'disappear',
  'discover', 'discuss', 'dislike', 'disturb', 'divide', 'do', 'doubt', 'drag', 'draw', 'dream',
  'dress', 'drink', 'drive', 'drop', 'dry', 'earn', 'eat', 'employ', 'enable', 'encourage',
  'end', 'enjoy', 'enter', 'escape', 'establish', 'examine', 'exchange', 'excite', 'excuse',
  'exercise', 'exist', 'expand', 'expect', 'experience', 'explain', 'explore', 'express', 'extend',
  'face', 'fail', 'fall', 'fancy', 'feed', 'feel', 'fight', 'fill', 'find', 'finish',
  'fit', 'fix', 'flow', 'fly', 'fold', 'follow', 'forbid', 'force', 'forget', 'forgive',
  'form', 'found', 'freeze', 'frighten', 'fulfill', 'gain', 'gather', 'generate', 'get', 'give',
  'go', 'grab', 'greet', 'grow', 'guarantee', 'guard', 'guess', 'handle', 'hang', 'happen',
  'hate', 'have', 'hear', 'heat', 'help', 'hide', 'hire', 'hit', 'hold', 'hope', 'hug',
  'hunt', 'hurry', 'hurt', 'identify', 'ignore', 'illustrate', 'imagine', 'implement', 'imply',
  'import', 'impose', 'impress', 'improve', 'include', 'increase', 'indicate', 'influence',
  'inform', 'insist', 'install', 'intend', 'interest', 'introduce', 'invest', 'investigate',
  'invite', 'involve', 'iron', 'join', 'joke', 'judge', 'jump', 'justify', 'keep', 'kick',
  'kill', 'kiss', 'knock', 'know', 'lack', 'last', 'laugh', 'launch', 'lay', 'lead', 'lean',
  'learn', 'leave', 'lend', 'let', 'lie', 'lift', 'light', 'like', 'limit', 'link', 'listen',
  'live', 'load', 'lock', 'look', 'lose', 'love', 'maintain', 'make', 'manage', 'mark', 'marry',
  'match', 'matter', 'mean', 'measure', 'meet', 'mention', 'mind', 'miss', 'mix', 'monitor',
  'move', 'murder', 'name', 'need', 'negotiate', 'note', 'notice', 'obtain', 'occur', 'offer',
  'open', 'operate', 'order', 'organize', 'overcome', 'owe', 'own', 'pack', 'paint', 'park',
  'participate', 'pass', 'pause', 'pay', 'perform', 'permit', 'persuade', 'pick', 'place', 'plan',
  'play', 'please', 'point', 'pour', 'practice', 'pray', 'prefer', 'prepare', 'present', 'press',
  'pretend', 'prevent', 'proceed', 'produce', 'promise', 'promote', 'propose', 'protect', 'prove',
  'provide', 'publish', 'pull', 'punch', 'punish', 'push', 'put', 'qualify', 'question', 'quit',
  'race', 'rain', 'raise', 'reach', 'read', 'realize', 'receive', 'recognize', 'recommend',
  'record', 'recover', 'reduce', 'refer', 'reflect', 'refuse', 'regard', 'register', 'regret',
  'reject', 'relate', 'relax', 'release', 'rely', 'remain', 'remember', 'remind', 'remove',
  'rent', 'repair', 'repeat', 'replace', 'reply', 'report', 'represent', 'request', 'require',
  'rescue', 'research', 'resign', 'resist', 'resolve', 'respect', 'respond', 'rest', 'restore',
  'result', 'retire', 'return', 'reveal', 'ride', 'ring', 'rise', 'risk', 'rob', 'roll', 'row',
  'rub', 'ruin', 'rule', 'run', 'rush', 'satisfy', 'save', 'say', 'search', 'see', 'seek',
  'seem', 'select', 'sell', 'send', 'separate', 'serve', 'set', 'settle', 'shake', 'shape',
  'share', 'shine', 'shoot', 'shop', 'shout', 'show', 'shut', 'sign', 'sing', 'sit', 'sleep',
  'slip', 'smell', 'smile', 'smoke', 'snow', 'solve', 'sort', 'sound', 'speak', 'spend', 'spill',
  'split', 'spread', 'stand', 'stare', 'start', 'state', 'stay', 'steal', 'step', 'stick',
  'stop', 'store', 'stretch', 'strike', 'struggle', 'study', 'submit', 'succeed', 'suffer',
  'suggest', 'suit', 'supply', 'support', 'suppose', 'surprise', 'surround', 'survive', 'suspect',
  'swallow', 'swear', 'sweep', 'swim', 'swing', 'switch', 'take', 'talk', 'taste', 'teach',
  'tear', 'tell', 'tend', 'test', 'thank', 'think', 'threaten', 'throw', 'tie', 'touch',
  'train', 'translate', 'travel', 'treat', 'trick', 'trust', 'try', 'turn', 'type', 'understand',
  'upset', 'urge', 'use', 'used', 'value', 'vary', 'visit', 'vote', 'wait', 'wake', 'walk',
  'want', 'warn', 'wash', 'waste', 'watch', 'wave', 'wear', 'weigh', 'welcome', 'whisper',
  'win', 'wind', 'wish', 'wonder', 'work', 'worry', 'wrap', 'write', 'yell',
  // Additional common ones
  'abandon', 'absorb', 'abuse', 'accompany', 'accumulate', 'accuse', 'adapt', 'admire',
  'adopt', 'advance', 'advertise', 'aim', 'alert', 'allocate', 'amuse', 'analyze', 'announce',
  'anticipate', 'apologize', 'appreciate', 'approach', 'approve', 'arrest', 'assess', 'assign',
  'assist', 'assume', 'assure', 'attach', 'attract', 'ban', 'bargain', 'base', 'behave',
  'bet', 'bind', 'blame', 'blend', 'block', 'blow', 'boast', 'bore', 'bounce', 'bow',
  'brag', 'brake', 'breed', 'broadcast', 'brush', 'bury', 'calculate', 'calm', 'capture',
  'chase', 'cheat', 'cheer', 'chew', 'choke', 'circulate', 'cite', 'clap', 'classify',
  'cling', 'collapse', 'command', 'compensate', 'compile', 'compose', 'compromise', 'conceal',
  'conclude', 'conduct', 'confess', 'confine', 'confront', 'confuse', 'consent', 'conserve',
  'consult', 'consume', 'convert', 'cope', 'counsel', 'crawl', 'criticize', 'crush', 'cure',
  'curse', 'dare', 'debate', 'deceive', 'declare', 'decline', 'dedicate', 'delight', 'demonstrate',
  'depart', 'deposit', 'depress', 'derive', 'deserve', 'detect', 'devote', 'diagnose', 'dictate',
  'differentiate', 'dine', 'disagree', 'disappoint', 'disapprove', 'discard', 'discharge',
  'discipline', 'disconnect', 'discourage', 'discriminate', 'disguise', 'dismiss', 'display',
  'dispose', 'dispute', 'dissolve', 'distinguish', 'distribute', 'disturb', 'dive', 'dominate',
  'donate', 'dose', 'download', 'drain', 'drift', 'drill', 'drown', 'dump', 'dust', 'dwell',
  'echo', 'edit', 'educate', 'elect', 'eliminate', 'embarrass', 'embrace', 'emerge', 'emit',
  'emphasize', 'encounter', 'endure', 'enforce', 'engage', 'enhance', 'ensure', 'entertain',
  'envy', 'equip', 'erase', 'evaluate', 'evolve', 'exaggerate', 'exceed', 'exclude', 'exhibit',
  'exhaust', 'exploit', 'expose', 'extract', 'facilitate', 'fade', 'favor', 'feature', 'fetch',
  'finance', 'fine', 'fire', 'flash', 'flee', 'float', 'flood', 'flourish', 'flush', 'focus',
  'forbid', 'forecast', 'forgive', 'frame', 'fulfill', 'function', 'fund', 'furnish', 'gamble',
  'gaze', 'gesture', 'glance', 'glow', 'govern', 'grasp', 'greet', 'grind', 'grip', 'groom',
  'growl', 'guarantee', 'guide', 'halt', 'hammer', 'harvest', 'haunt', 'heal', 'hesitate',
  'highlight', 'hint', 'hop', 'host', 'humble', 'identify', 'illustrate', 'imitate', 'immerse',
  'imply', 'impose', 'incorporate', 'induce', 'inflate', 'inherit', 'initiate', 'inject',
  'innovate', 'inquire', 'insert', 'inspect', 'inspire', 'integrate', 'interact', 'interfere',
  'interpret', 'interrupt', 'intervene', 'isolate', 'kneel', 'knit', 'label', 'lag', 'land',
  'leap', 'lecture', 'lessen', 'level', 'liberate', 'linger', 'list', 'locate', 'lodge',
  'manipulate', 'manufacture', 'march', 'mature', 'melt', 'memorize', 'merge', 'migrate',
  'minimize', 'mislead', 'modify', 'mold', 'motivate', 'mount', 'multiply', 'murmur', 'neglect',
  'negotiate', 'nominate', 'normalize', 'nourish', 'obey', 'object', 'oblige', 'observe',
  'occupy', 'offend', 'oppose', 'opt', 'originate', 'outline', 'output', 'overlook', 'overthrow',
  'overwhelm', 'owe', 'pace', 'panic', 'parade', 'penetrate', 'perceive', 'persist', 'petition',
  'phrase', 'pile', 'pioneer', 'pity', 'plant', 'plead', 'plot', 'plunge', 'polish', 'possess',
  'postpone', 'praise', 'precede', 'predict', 'preserve', 'presume', 'prevail', 'pride',
  'prioritize', 'probe', 'process', 'proclaim', 'prohibit', 'pronounce', 'provoke', 'pursue',
  'puzzle', 'quote', 'rally', 'range', 'rate', 'reckon', 'reclaim', 'reconstruct', 'recruit',
  'refine', 'reform', 'regain', 'regulate', 'reinforce', 'remark', 'remedy', 'renew', 'repay',
  'reproduce', 'resemble', 'reserve', 'reside', 'resist', 'restrict', 'retain', 'retreat',
  'retrieve', 'revise', 'revive', 'revolt', 'reward', 'rid', 'roam', 'rock', 'rotate', 'ruin',
  'sacrifice', 'scan', 'scare', 'scatter', 'schedule', 'score', 'scream', 'seal', 'secure',
  'seize', 'sense', 'shed', 'shelter', 'shift', 'signal', 'simplify', 'simulate', 'sink',
  'sketch', 'slide', 'snap', 'soak', 'soar', 'specialize', 'specify', 'speculate', 'spell',
  'spin', 'split', 'sponsor', 'spot', 'squeeze', 'stab', 'stack', 'stain', 'stamp', 'starve',
  'steer', 'stimulate', 'stir', 'store', 'strain', 'strengthen', 'strip', 'strive', 'stroke',
  'stumble', 'substitute', 'suck', 'summarize', 'supplement', 'sustain', 'swallow', 'sway',
  'switch', 'sympathize', 'tackle', 'tap', 'target', 'tease', 'tempt', 'terminate', 'terrify',
  'testify', 'tighten', 'toss', 'trace', 'track', 'transform', 'transmit', 'transport', 'trap',
  'trigger', 'triumph', 'tuck', 'twist', 'undergo', 'underline', 'undertake', 'undo', 'unfold',
  'unify', 'unite', 'update', 'upgrade', 'uphold', 'utilize', 'vanish', 'venture', 'verify',
  'violate', 'volunteer', 'wander', 'weaken', 'widen', 'withdraw', 'withstand', 'witness',
  'worship', 'wound', 'yield', 'zoom',
]);

// ── Phrases/auxiliaries that should NOT get "to " ──────────────────────
const PHRASE_PATTERNS = [
  /^(i |he |she |we |they |it |one |you )/i,
  /^(is |are |am |was |were |been |being )/i,
  /^(has |have |had |let |let's |don't |can |will |would |could |should |may |might |must |shall )/i,
  /^(not |no |yes |how |what |where |when |who |why )/i,
  /^(here |there |this |that |the |a |an )/i,
  /^(very |too |quite |rather |so |much |more |most |less |least )/i,
  /^(good |bad |big |small |old |new |long |short |high |low |hot |cold |warm |cool )/i,
  /^(see you|thank|thanks|hello|goodbye|excuse me|sorry|please|welcome)/i,
  /^(each other|one another)/i,
];

// ── False infinitives: nouns that look like verb infinitives ──────────
const FALSE_INFINITIVES = {
  hi: new Set([
    'योजना', 'कमरा', 'सपना', 'अपना', 'नाना', 'मामा', 'बहाना', 'किराना', 'ठिकाना',
    'नशा', 'तमाशा', 'दवाखाना', 'अखबारखाना', 'जमाना', 'खाना', 'राजधानी', 'पानी',
    'कहानी', 'नानी', 'दादी', 'दादा', 'चाचा', 'मौसी', 'बुआ', 'जीजा', 'साला',
    'बेटा', 'लड़का', 'पहना', 'खिलौना', 'आईना', 'मैदाना', 'ज़माना', 'अफ़साना',
    'गाना', 'बाना', 'ताना', 'दाना', 'बचपना', 'दीवाना', 'पागलपना', 'फ़साना',
  ]),
  sv: new Set([
    'lista', 'historia', 'skola', 'flicka', 'kvinna', 'kyrka', 'vecka', 'resa',
    'fråga', 'gata', 'stuga', 'soffa', 'lampa', 'väska', 'jacka', 'matta',
    'tavla', 'flaska', 'klocka', 'trappa', 'pizza', 'pasta', 'data', 'kamera',
    'opera', 'yoga', 'sofa', 'villa', 'banana', 'panda', 'zebra', 'cobra',
    'sauna', 'flora', 'fauna', 'aura', 'era', 'idea', 'area', 'tema',
    'drama', 'dilemma', 'schema', 'diploma', 'panorama', 'klima', 'firma',
    'forma', 'norma', 'reforma', 'plattforma', 'uniforma', 'terma',
    'saga', 'fika', 'mamma', 'pappa', 'budgeta', 'karta', 'reklama',
  ]),
  tr: new Set([
    'karınca', 'araba', 'masa', 'okuma', 'yazma', 'dondurma', 'bina',
    'dolma', 'kapama', 'kavurma', 'çorba', 'salata', 'pasta', 'pizza',
  ]),
  cy: new Set([]),
  de: new Set([]),
  nl: new Set([]),
  es: new Set([]),
  it: new Set([]),
  fr: new Set([]),
  pt: new Set([]),
  ru: new Set([]),
};

// ── Helpers ──────────────────────────────────────────────────────

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function parseDictionary(lang) {
  const filePath = path.join(DICT_DIR, `${lang}.ts`);
  const content = fs.readFileSync(filePath, 'utf-8');
  const entries = [];
  const entryRegex = /(['"])((?:(?!\1).|\\.)+)\1\s*:\s*\{([^}]+)\}/g;
  let m;
  while ((m = entryRegex.exec(content)) !== null) {
    const key = m[2].replace(/\\'/g, "'").replace(/\\"/g, '"');
    const body = m[3];
    const enMatch = body.match(/en:\s*(['"])((?:(?!\1).|\\.)*)(\1)/);
    if (!enMatch) continue;
    const en = enMatch[2].replace(/\\'/g, "'").replace(/\\"/g, '"');
    const posMatch = body.match(/pos:\s*['"]([^'"]*)['"]/);
    const pos = posMatch ? posMatch[1] : '';
    const lemmaMatch = body.match(/lemma:\s*['"]([^'"]*)['"]/);
    const lemma = lemmaMatch ? lemmaMatch[1] : '';
    entries.push({ key, en, pos, lemma, fullMatch: m[0], index: m.index });
  }
  return entries;
}

function isPhrase(en) {
  for (const re of PHRASE_PATTERNS) {
    if (re.test(en)) return true;
  }
  return false;
}

function isKnownVerb(en) {
  const word = en.toLowerCase().replace(/[^a-z ]/g, '').trim().split(/\s+/)[0];
  return KNOWN_ENGLISH_VERBS.has(word);
}

// ── Google Translate ──────────────────────────────────────────────

async function translateBatch(words, sourceLang) {
  const results = {};
  for (let i = 0; i < words.length; i += BATCH_SIZE) {
    const batch = words.slice(i, i + BATCH_SIZE);
    const params = batch.map(w => 'q=' + encodeURIComponent(w)).join('&');
    const url = `https://translation.googleapis.com/language/translate/v2?key=${API_KEY}&source=${sourceLang}&target=en&${params}`;

    const translations = await new Promise((resolve, reject) => {
      https.get(url, (res) => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (!parsed.data || !parsed.data.translations) {
              console.error('  API error:', JSON.stringify(parsed).slice(0, 200));
              resolve(batch.map(() => '?'));
              return;
            }
            resolve(parsed.data.translations.map(t =>
              t.translatedText.replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/&quot;/g, '"')
            ));
          } catch (e) { reject(e); }
        });
      }).on('error', reject);
    });

    batch.forEach((word, j) => {
      results[word] = translations[j] || '?';
    });

    await sleep(300);
  }
  return results;
}

// ── Step 2: Fix missing "to " on verb entries ────────────────────

function fixMissingTo(entries, allEntries) {
  const fixes = [];
  const lemmaMap = {};
  for (const e of allEntries) {
    lemmaMap[e.key] = e;
  }

  for (const entry of entries) {
    if (entry.pos !== 'v') continue;
    const en = entry.en.trim();
    if (en.startsWith('to ')) continue;

    // Skip phrases with auxiliaries
    if (isPhrase(en)) {
      // Change pos to 'phrase' instead
      fixes.push({ key: entry.key, field: 'pos', oldVal: 'v', newVal: 'phrase', reason: 'phrase_not_verb' });
      continue;
    }

    // If entry has a lemma, check if lemma's definition starts with "to "
    if (entry.lemma && lemmaMap[entry.lemma]) {
      const lemmaEntry = lemmaMap[entry.lemma];
      if (lemmaEntry.en.startsWith('to ')) {
        fixes.push({ key: entry.key, field: 'en', oldVal: en, newVal: 'to ' + en, reason: 'lemma_has_to' });
        continue;
      }
    }

    // Check if the English word is a known verb
    if (isKnownVerb(en)) {
      fixes.push({ key: entry.key, field: 'en', oldVal: en, newVal: 'to ' + en, reason: 'known_verb' });
      continue;
    }

    // Multi-word starting with verb: "give up" → "to give up"
    const firstWord = en.split(/\s+/)[0].toLowerCase();
    if (KNOWN_ENGLISH_VERBS.has(firstWord) && !isPhrase(en)) {
      fixes.push({ key: entry.key, field: 'en', oldVal: en, newVal: 'to ' + en, reason: 'first_word_verb' });
      continue;
    }
  }

  return fixes;
}

// ── Step 3: Fix semantic failures from review ────────────────────

async function fixSemanticFailures(lang, entries) {
  const reviewPath = path.join(OUT_DIR, `${lang}-strict-review.json`);
  if (!fs.existsSync(reviewPath)) return [];

  const review = JSON.parse(fs.readFileSync(reviewPath, 'utf-8'));
  const semanticFails = (review.failure_examples || []).filter(
    ex => ex.issues.includes('semantic_fail') && ex.google && ex.google !== '?'
  );

  if (semanticFails.length === 0) return [];

  // Build lookup
  const entryMap = {};
  for (const e of entries) entryMap[e.key] = e;

  // For each semantic failure, check if Google's translation makes more sense
  const fixes = [];

  // Re-translate the failing words in bulk for fresh results
  const failWords = semanticFails.map(f => f.word).filter(w => entryMap[w]);
  if (failWords.length === 0) return [];

  const gtMap = await translateBatch(failWords, lang);

  for (const fail of semanticFails) {
    const entry = entryMap[fail.word];
    if (!entry) continue;

    const googleTrans = gtMap[fail.word];
    if (!googleTrans || googleTrans === '?' || googleTrans === entry.en) continue;

    // Clean up Google's translation
    let cleaned = googleTrans.toLowerCase().trim();

    // Don't accept if it's just a single letter or gibberish
    if (cleaned.length < 2) continue;

    // If our entry is a verb, ensure Google's starts with "to "
    if (entry.pos === 'v') {
      if (!cleaned.startsWith('to ')) {
        // Check if Google returned a conjugated form — if so, the infinitive might be fine
        // e.g., "they say" for a word we define as "to count" — both could be valid
        // Only replace if Google returned a noun/adj that clearly shows our POS is wrong
        const gtWords = cleaned.split(/\s+/);
        const firstGtWord = gtWords[0];
        // If Google gives a noun (no verb indicators), maybe our POS is wrong
        if (!['i', 'he', 'she', 'we', 'they', 'it', 'you', 'let', 'will', 'would', 'could', 'should', 'is', 'are', 'was', 'were', 'has', 'have', 'had', 'being', 'been'].includes(firstGtWord)) {
          // Google gave a plain noun/adj — our definition might be wrong
          if (cleaned.length <= 50) {
            fixes.push({
              key: fail.word,
              field: 'en',
              oldVal: entry.en,
              newVal: cleaned,
              reason: 'semantic_fix_noun',
              google: googleTrans
            });
            // Also fix POS
            if (entry.pos === 'v') {
              fixes.push({
                key: fail.word,
                field: 'pos',
                oldVal: 'v',
                newVal: 'n',
                reason: 'semantic_fix_pos'
              });
            }
          }
        }
        continue;
      }
      cleaned = cleaned; // keep as-is if starts with 'to '
    }

    // Cap length
    if (cleaned.length > 50) cleaned = cleaned.slice(0, 50);

    // Only replace if it's meaningfully different
    const ourBase = entry.en.toLowerCase().replace(/^to /, '').trim();
    const gtBase = cleaned.replace(/^to /, '').trim();
    if (ourBase === gtBase) continue;

    // Don't replace if Google just returned a different verb form
    // e.g., "to live" vs "I lived" — both valid
    // Only replace if there's zero word overlap
    const ourWords = new Set(ourBase.split(/[\s;,/]+/).filter(w => w.length > 2));
    const gtWordSet = new Set(gtBase.split(/[\s;,/]+/).filter(w => w.length > 2));
    let hasOverlap = false;
    for (const w of ourWords) {
      if (gtWordSet.has(w)) { hasOverlap = true; break; }
    }
    // If there IS overlap, our definition is probably fine
    if (hasOverlap) continue;

    fixes.push({
      key: fail.word,
      field: 'en',
      oldVal: entry.en,
      newVal: cleaned,
      reason: 'semantic_replace',
      google: googleTrans
    });
  }

  return fixes;
}

// ── Step 4: Fix false infinitives ────────────────────────────────

function fixFalseInfinitives(lang, entries) {
  const fixes = [];
  const falseInfs = FALSE_INFINITIVES[lang] || new Set();

  for (const entry of entries) {
    // Check explicit false infinitive list
    if (falseInfs.has(entry.key)) {
      if (entry.pos === 'v') {
        fixes.push({ key: entry.key, field: 'pos', oldVal: 'v', newVal: 'n', reason: 'false_infinitive_list' });
      }
      if (entry.en.startsWith('to ')) {
        fixes.push({ key: entry.key, field: 'en', oldVal: entry.en, newVal: entry.en.slice(3), reason: 'false_infinitive_strip_to' });
      }
    }

    // For non-listed entries: if pos=v but en doesn't start with "to " and en is clearly a noun
    // (Google would have caught this in step 3)

    // Also: entries where pos='v' but en is a clear noun (no verb in it)
    if (entry.pos === 'v' && entry.en.startsWith('to ')) {
      const afterTo = entry.en.slice(3).trim().split(/\s+/)[0].toLowerCase();
      // If the word after "to" is NOT a known verb, it might be a false infinitive
      // Common false patterns: "to water" (noun), "to place" (could be verb), "to name" (could be verb)
      // We only flag very obvious nouns
      const OBVIOUS_NOUNS_AFTER_TO = new Set([
        'water', 'house', 'city', 'money', 'time', 'day', 'night', 'morning',
        'people', 'friend', 'child', 'family', 'woman', 'man', 'mother', 'father',
        'brother', 'sister', 'husband', 'wife', 'room', 'bed', 'table', 'chair',
        'door', 'window', 'car', 'bus', 'train', 'plane', 'school', 'church',
        'hospital', 'restaurant', 'hotel', 'airport', 'station', 'street', 'road',
        'mountain', 'river', 'sea', 'lake', 'forest', 'garden', 'park', 'beach',
        'weather', 'rain', 'snow', 'sun', 'wind', 'sky', 'earth', 'fire',
        'food', 'bread', 'meat', 'fish', 'milk', 'coffee', 'tea', 'beer', 'wine',
        'book', 'letter', 'newspaper', 'music', 'film', 'game', 'sport', 'holiday',
      ]);
      // Note: many of these CAN be verbs (water, park, fish, etc.), so we DON'T auto-fix
      // Only the false_infinitive_list above is used for auto-fixing
    }
  }

  return fixes;
}

// ── Apply fixes to file ──────────────────────────────────────────

function applyFixes(lang, fixes) {
  if (fixes.length === 0) return 0;
  if (DRY_RUN) return fixes.length;

  const filePath = path.join(DICT_DIR, `${lang}.ts`);
  let content = fs.readFileSync(filePath, 'utf-8');
  let applied = 0;

  // Group fixes by key
  const fixesByKey = {};
  for (const fix of fixes) {
    if (!fixesByKey[fix.key]) fixesByKey[fix.key] = [];
    fixesByKey[fix.key].push(fix);
  }

  for (const [key, keyFixes] of Object.entries(fixesByKey)) {
    // Find the entry in the file
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const entryRegex = new RegExp(
      `(['"]${escapedKey}['"])\\s*:\\s*\\{([^}]+)\\}`,
      'g'
    );
    const match = entryRegex.exec(content);
    if (!match) continue;

    let entryBody = match[2];
    let changed = false;

    for (const fix of keyFixes) {
      if (fix.field === 'en') {
        // Replace en value
        const enRegex = /en:\s*(['"])((?:(?!\1).|\\.)*)(\1)/;
        const enMatch = entryBody.match(enRegex);
        if (enMatch) {
          const quote = enMatch[1];
          const newEn = fix.newVal.replace(/'/g, "\\'").replace(/"/g, '\\"');
          entryBody = entryBody.replace(enRegex, `en: ${quote}${newEn}${quote}`);
          changed = true;
        }
      } else if (fix.field === 'pos') {
        // Replace pos value
        const posRegex = /pos:\s*['"]([^'"]*)['"]/;
        const posMatch = entryBody.match(posRegex);
        if (posMatch) {
          entryBody = entryBody.replace(posRegex, `pos: '${fix.newVal}'`);
          changed = true;
        }
      }
    }

    if (changed) {
      content = content.slice(0, match.index) + match[0].replace(match[2], entryBody) + content.slice(match.index + match[0].length);
      applied++;
    }
  }

  fs.writeFileSync(filePath, content);
  return applied;
}

// ── Main ─────────────────────────────────────────────────────────

async function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  console.log(`=== Fix Remaining Issues (${DRY_RUN ? 'DRY RUN' : 'LIVE'}) ===\n`);

  const report = {};

  for (const lang of LANGUAGES) {
    console.log(`\n--- ${lang.toUpperCase()} ---`);
    const entries = parseDictionary(lang);
    console.log(`  ${entries.length} entries parsed`);

    // Step 2: Fix missing "to "
    const toFixes = fixMissingTo(entries, entries);
    console.log(`  Step 2 (missing 'to '): ${toFixes.length} fixes`);

    // Step 3: Fix semantic failures
    const semFixes = await fixSemanticFailures(lang, entries);
    console.log(`  Step 3 (semantic): ${semFixes.length} fixes`);

    // Step 4: Fix false infinitives
    const infFixes = fixFalseInfinitives(lang, entries);
    console.log(`  Step 4 (false infinitives): ${infFixes.length} fixes`);

    // Combine and deduplicate (semantic fixes take priority)
    const allFixes = [];
    const fixedKeys = new Set();

    // Semantic fixes first (they're based on Google re-translation)
    for (const fix of semFixes) {
      allFixes.push(fix);
      fixedKeys.add(fix.key + ':' + fix.field);
    }

    // Then infinitive fixes
    for (const fix of infFixes) {
      const k = fix.key + ':' + fix.field;
      if (!fixedKeys.has(k)) {
        allFixes.push(fix);
        fixedKeys.add(k);
      }
    }

    // Then "to " fixes (skip if already fixed by semantic)
    for (const fix of toFixes) {
      const k = fix.key + ':' + fix.field;
      if (!fixedKeys.has(k)) {
        allFixes.push(fix);
        fixedKeys.add(k);
      }
    }

    console.log(`  Total fixes: ${allFixes.length}`);

    // Apply
    const applied = applyFixes(lang, allFixes);
    console.log(`  Applied: ${applied} entries modified`);

    report[lang] = {
      to_fixes: toFixes.length,
      semantic_fixes: semFixes.length,
      infinitive_fixes: infFixes.length,
      total: allFixes.length,
      applied,
      examples: allFixes.slice(0, 10),
    };
  }

  // Write report
  const reportPath = path.join(OUT_DIR, 'fix-remaining-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log('\n=== SUMMARY ===');
  console.log('| Lang | to_fix | sem_fix | inf_fix | total | applied |');
  console.log('|------|--------|---------|---------|-------|---------|');
  let grandTotal = 0;
  for (const lang of LANGUAGES) {
    const r = report[lang];
    console.log(`| ${lang.toUpperCase().padEnd(4)} | ${String(r.to_fixes).padEnd(6)} | ${String(r.semantic_fixes).padEnd(7)} | ${String(r.infinitive_fixes).padEnd(7)} | ${String(r.total).padEnd(5)} | ${String(r.applied).padEnd(7)} |`);
    grandTotal += r.total;
  }
  console.log(`| ALL  |        |         |         | ${grandTotal}   |         |`);
  console.log(`\nReport: ${reportPath}`);
}

main().catch(e => { console.error(e); process.exit(1); });
