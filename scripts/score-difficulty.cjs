#!/usr/bin/env node
/**
 * Score every card's difficulty and write back to the priority field (1 = easiest).
 *
 * Score components (lower = easier):
 *  - sentence word count           weight 3.0
 *  - vocabulary rarity (avg log-rank in frequency table)   weight 2.0
 *  - long-word factor (avg syllables per word)             weight 1.0
 *  - subordinate-clause hint (presence of common conj)     weight 1.5
 *  - non-A1 grammar markers (specific suffixes/forms per language) weight 2.0
 *
 * The score is a relative ranking within each language. After scoring, we
 * sort ascending and assign priority = 1..N. Existing priority values are overwritten.
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

const FREQ = {
  spanish:    'scripts/frequency-es.json',
  french:     'scripts/frequency-fr.json',
  italian:    'scripts/frequency-it.json',
  portuguese: 'scripts/frequency-pt.json',
  german:     'scripts/frequency-de.json',
  dutch:      'scripts/frequency-nl.json',
  swedish:    'scripts/frequency-sv.json',
  welsh:      'scripts/frequency-cy.json',
  hindi:      'scripts/frequency-hi.json',
  turkish:    'scripts/frequency-tr.json',
  russian:    'scripts/frequency-ru.json',
};

// Per-language non-A1 markers (regex patterns appearing in target sentences)
// These signal intermediate-or-higher grammar features.
const ADVANCED_MARKERS = {
  spanish:    [/[a-záéíóúñ]ría\b/i,/[a-záéíóúñ]ría\s/i,/(haya|hayas|hayan|hubiera|hubiese|fuera|fuese)\b/i,/se\s+\w+ó\b/i],
  french:    [/(eût|fût|aurait|serait|aurions|seraient)\b/i,/(que je|que tu|qu'il|qu'elle|qu'on)\s+\w+sse\b/i],
  italian:   [/(ebbi|fui|sarebbe|sarei|avesse|fosse|abbia|abbiano)\b/i,/\b\w+rebbe\b/i],
  portuguese:[/(seria|haveria|tivesse|fosse|estivesse|houvesse)\b/i,/\b\w+ria\b/i],
  german:    [/(hätte|wäre|würde|hätten|wären|würden|gewesen|gehabt)\b/i,/zu\s+\w+en\b/i],
  dutch:     [/(zou|zouden|zoude|hadde|ware|waren\s+geweest)\b/i],
  swedish:   [/(skulle|hade|vore|hade\s+varit)\b/i],
  welsh:     [
    // Conditional / subjunctive verb forms
    /\b(byddai|byddent|byddwn|bydden|byddech|byddet|byddwch|fyddwn|fyddai|fyddent|fydden)\b/i,
    /\b(petai|petaem|petaen|fyddai|fydden|baswn|basai|basent|basent|bai|bawn|baet|baen|bait|baech)\b/i,
    /\b(allen|allech|allwn|gallen|gallech|gallai|gallent|gallai)\b/i,
    /\bpe\s+(bai|bawn|baet|baen|bait|baech)\b/i,
    // Conditional/perfect with 'wedi'
    /\bwedi\s+\w+i\b/i,
    // Past tense verb endings (preterite): -ais, -aist, -odd, -on, -och, -ant on multi-syllable verbs
    /\b\w{4,}(?:ais|aist|aist|odd|on|och|asant|ant)\b/i,
    // Imperfect/conditional endings: -em, -ent, -ai, -ech (on multi-syllable verbs)
    /\b\w{5,}(?:em|ent|ech)\b/i,
    // Nasal mutations (advanced): fy + nasal mutated noun
    /\bfy\s+(?:ngh|mh|nh|ng|m|n)\w/i,
    // Aspirate mutations after ei (her), tri, chwe
    /\bei\s+(?:th|ch|ph)\w/i,
    /\b(?:tri|chwe)\s+(?:ch|ph|th)\w/i,
    // Subordinate / complex constructions
    /\b(er|tra|wedi|tra'n|cyn|nes|hyd|rhag|wrth|ar ôl)\s+(?:i\s+\w|\w+i\b|\w+o\b|\w+u\b)/i,
    // Passive constructions
    /\b(wnaethpwyd|cafodd|cafwyd|caiff|ceir)\b/i,
    // Soft-mutated past tense after auxiliary 'wnaeth/wnaethon'
    /\b(wnaeth|wnaethon|wnaethant|wnest|wnaethoch)\s+\w/i,
    // 'os' (if) clauses
    /\bos\s+\w/i,
  ],
  hindi:     [/(होगा|होगी|होंगे|थी|थे|गया था|गई थी|रहा था|रही थी|जाएगा|जाएगी)/, /\sकि\s/, /\sहोता\s/],
  turkish:   [/(saydı|saydık|saydım|seydi|seydik|sa-?\s|se-?\s)/, /\bki\s/, /\b(yor)du\b/, /\b\w+(mIş|miş|mış|muş|müş)\b/, /-iyor\s+olabilir/, /\b\w+sa\s+\w+rdı\b/],
  russian:   [/(бы\s|если\s+бы)/, /\b\w+(ший|щий|щая|щее|щие|вший|вшая|вшее)\b/, /\b(чтобы|поскольку|невзирая|несмотря)\b/],
};

// Subordinate-clause / connector words across many languages – presence boosts difficulty
const SUB_CLAUSE = /\b(although|because|while|whereas|nevertheless|despite|however|moreover|hence|therefore|wherein|whereby|que|qui|donc|cependant|néanmoins|wenn|weil|während|wobei|jedoch|obwohl|desde\s+que|porque|aunque|sin\s+embargo|sebbene|nonostante|tuttavia|чтобы|поскольку|однако|тем\s+не\s+менее|hoewel|terwijl|niettemin|ändock|trotz|چونکه|कि|यद्यपि|हालाँकि|rağmen|ancak|fakat|hâlbuki)\b/i;

function syllableCountApprox(word) {
  // Quick approximation: count vowel groups
  const vowels = (word.toLowerCase().match(/[aeiouyäöüáéíóúàèìòùâêîôûãõçáéíóúíâê]/g) || []).length;
  return Math.max(1, vowels);
}

function tokenize(s) {
  return s.split(/[\s।,!?;:""''()––…¿¡«»\.]+/).filter(t => t && t.length > 0);
}

// Tier offset: pushes each tier's band up by a fixed amount so C1/C2 idioms
// (lexically short but culturally advanced) don't appear too early.
// Tunable via env var TIER_WEIGHT (default 8). Set to 0 to disable.
const TIER_WEIGHT = parseFloat(process.env.TIER_WEIGHT || '8');
const TIER_INDEX = {
  'node-01':0,'node-02':0,'node-03':0,'node-04':0,'node-05':0,'node-06':0,'node-07':0,'node-08':0,
  'node-09':1,'node-10':1,'node-11':1,'node-12':1,'node-13':1,'node-14':1,'node-15':1,
  'node-16':2,'node-17':2,'node-18':2,'node-19':2,'node-20':2,'node-21':2,
  'node-22':3,'node-23':3,'node-24':3,'node-25':3,'node-26':3,'node-27':3,
  'node-28':4,'node-29':4,'node-30':4,'node-31':4,
  'node-32':5,'node-33':5,'node-34':5,'node-35':5,
};

function scoreCard(card, freqMap, lang) {
  const target = card.target || '';
  const tokens = tokenize(target);
  const n = tokens.length || 1;

  // 1. Word count (linear, but cap at 25 for outliers)
  const wcScore = Math.min(n, 25);

  // 2. Vocab rarity – for each token, find its rank in the frequency map
  // Lower rank = more common. Use log-rank to compress.
  let rankSum = 0;
  let rankCount = 0;
  let maxLogRank = 0;
  for (const t of tokens) {
    const k = t.toLowerCase();
    let lr;
    if (freqMap.has(k)) {
      lr = Math.log10(1 + freqMap.get(k));
    } else {
      // Unknown word – treat as rare (high rank)
      lr = Math.log10(1 + 5000);
    }
    rankSum += lr;
    rankCount++;
    if (lr > maxLogRank) maxLogRank = lr;
  }
  const avgLogRank = rankCount > 0 ? rankSum / rankCount : 4;

  // 3. Long-word factor – avg syllables per word
  let sylSum = 0;
  for (const t of tokens) sylSum += syllableCountApprox(t);
  const avgSyl = sylSum / n;

  // 4. Sub-clause hit
  const hasSub = SUB_CLAUSE.test(target) || SUB_CLAUSE.test(card.english || '') ? 1 : 0;

  // 5. Advanced grammar marker per language
  const markers = ADVANCED_MARKERS[lang] || [];
  let advHits = 0;
  for (const re of markers) if (re.test(target)) advHits++;

  // Tier offset based on grammar node (A1=0 ... C2=5)
  const tierIdx = TIER_INDEX[card.grammarNode] ?? 0;
  const tierBoost = tierIdx * TIER_WEIGHT;

  // Composite (weights tunable)
  // - Word count: 3.0 (short sentences are easier)
  // - Avg vocab rarity: 3.0 (boosted from 2.0 – every uncommon word counts)
  // - Max vocab rarity: 2.5 (NEW – the single rarest word punishes short sentences
  //   with one rare word like "Mae hi'n glaear heddiw" where the word count is
  //   small but `glaear` is rare)
  // - Avg syllables: 1.0
  // - Sub-clause hit: 1.5
  // - Advanced grammar markers: 2.0 (per hit, capped at 3)
  // - Tier offset: TIER_WEIGHT * tierIdx
  const score =
    3.0 * wcScore +
    3.0 * avgLogRank +
    2.5 * maxLogRank +
    1.0 * avgSyl +
    1.5 * hasSub +
    2.0 * Math.min(advHits, 3) +
    tierBoost;

  return score;
}

function buildFreqMap(freqPath) {
  const data = JSON.parse(fs.readFileSync(freqPath, 'utf8'));
  // Frequency files: array of {key, freq}. Map word→rank (1 = most common).
  const map = new Map();
  data.forEach((entry, i) => {
    map.set(entry.key.toLowerCase(), i + 1);
  });
  return map;
}

const langArg = process.argv[2];
const langs = langArg ? [langArg] : Object.keys(DECKS);

for (const lang of langs) {
  if (!DECKS[lang]) { console.error('unknown lang: ' + lang); continue; }
  const freqMap = buildFreqMap(FREQ[lang]);
  const deck = JSON.parse(fs.readFileSync(DECKS[lang], 'utf8'));

  // Score each card
  const scored = deck.map(c => ({ card: c, score: scoreCard(c, freqMap, lang) }));
  scored.sort((a, b) => a.score - b.score);

  // Assign priority = 1..N
  scored.forEach((s, i) => { s.card.priority = i + 1; });

  // Sample report: easiest 5, middle 5, hardest 5
  const easiest = scored.slice(0, 5);
  const middle = scored.slice(Math.floor(scored.length / 2), Math.floor(scored.length / 2) + 5);
  const hardest = scored.slice(-5);

  console.log('═'.repeat(80));
  console.log(' ' + lang.toUpperCase() + '  (' + deck.length + ' cards)');
  console.log('═'.repeat(80));
  console.log('Easiest 5 (priority 1-5, score ' + easiest[0].score.toFixed(1) + '–' + easiest[4].score.toFixed(1) + '):');
  for (const s of easiest) console.log('  [' + s.score.toFixed(1) + '] ' + s.card.id + '  ' + s.card.target);
  console.log();
  console.log('Middle 5 (around priority ' + Math.floor(scored.length/2) + '):');
  for (const s of middle) console.log('  [' + s.score.toFixed(1) + '] ' + s.card.id + '  ' + s.card.target);
  console.log();
  console.log('Hardest 5 (priority ' + (deck.length - 4) + '–' + deck.length + ', score ' + hardest[0].score.toFixed(1) + '–' + hardest[4].score.toFixed(1) + '):');
  for (const s of hardest) console.log('  [' + s.score.toFixed(1) + '] ' + s.card.id + '  ' + s.card.target.slice(0, 100));
  console.log();

  // Write back
  fs.writeFileSync(DECKS[lang], JSON.stringify(deck, null, 2) + '\n');
}
