#!/usr/bin/env node
/* Welsh heavy-repeat demoter.
 *
 * For each of the 22+ tips appearing 10+ times in Welsh, this script:
 *   1. Identifies which cards currently bear the tip
 *   2. Detects which cards actually DEMONSTRATE the rule (via per-tip detector)
 *   3. Keeps the tip on the best N cards (default 2)
 *   4. Strips it from all other cards
 *
 * The detectors are conservative — when in doubt about whether a card
 * demonstrates the rule, the card LOSES the tip. Better tip-less than wrong.
 *
 *   node scripts/welsh-demote.cjs            # dry run with counts + best-cards
 *   node scripts/welsh-demote.cjs --fix      # apply strip
 */

const fs = require('fs');

const args = process.argv.slice(2);
const fix = args.includes('--fix');

const DECK_PATH = 'src/data/welsh/deck.json';
const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf8'));

// For each heavy-repeat tip: a matcher (substring of the tip — exact-prefix
// match is brittle so use a recognizable substring) and a card detector.
// Card detector returns a numeric quality score (higher = better demo);
// 0 means the card does NOT demonstrate the rule and should lose the tip.
//
// The KEEP value is how many top-scoring cards retain the tip.
const RULES = [
  {
    name: 'mutation-intro-178',
    tipMatch: /Welsh changes the START of a word/,
    keep: 2,
    score: (target) => {
      // Strong demo: card prominently features mutation.
      // Heuristic — any of the classic mutation triggers + mutated form.
      const mutations = [
        /\bfy\s+(?:mh|nh|ngh|m|n|ng)/i,         // fy + nasal mutation
        /\bei\s+(?:b|d|f|g|l|m|r)/i,            // ei (his) + soft mutation
        /\bdau\s+/i, /\bdwy\s+/i,               // numbers triggering mutation
        /\b(?:y|yr)\s+(?:f|b|d|g)\w+\s*$/i,      // y + soft-mutated feminine noun
      ];
      let s = 0;
      for (const re of mutations) if (re.test(target)) s += 2;
      // Bonus for short, clear cards
      if (target.length < 40) s += 1;
      return s;
    },
  },
  {
    name: 'mae-vso-52',
    tipMatch: /^Mae = is \/ are \(present\)/,
    keep: 2,
    score: (target) => {
      // Best demo: card starts with "Mae" and is short
      if (!/^Mae\b/.test(target)) return 0;
      let s = 5;
      if (target.length < 30) s += 3;
      return s;
    },
  },
  {
    name: 'yn-linker-47',
    tipMatch: /^The little 'n is mandatory/,
    keep: 2,
    score: (target) => {
      // Demo: card uses "X'n" (pronoun-contracted yn linker)
      if (!/\b(Dw|Mae|Ti'|i'n|hi'n|fe'n|fo'n|nhw'n|chi'n)\b/i.test(target)) return 0;
      if (!/'n\s+\w/.test(target)) return 0;
      let s = 5;
      if (target.length < 30) s += 2;
      return s;
    },
  },
  {
    name: 'soft-mutation-rules-31',
    tipMatch: /^Soft mutation: p→b, t→d, c→g/,
    keep: 2,
    score: (target) => {
      // Restrict to reliable SM triggers: dau/dwy (numbers), dy (your sg),
      // ei (his). yn + verbnoun does NOT cause SM so it's excluded.
      const triggers = /\b(dau|dwy|tri|dy|ei)\s+(b|d|f|g|l|m|r)\w/;
      if (!triggers.test(target)) return 0;
      let s = 5;
      if (target.length < 35) s += 2;
      return s;
    },
  },
  {
    name: 'feminine-y-mutation-31',
    tipMatch: /feminine nouns also soft-mutate after the article/,
    keep: 2,
    score: (target) => {
      // Match y/yr + actual soft-mutated initial (f-, dd-, l-, r-).
      // Dictionary b/m/p/t-words don't demo the rule (masculine or unmutated).
      if (!/\b(y|yr)\s+(f|dd|l|r)\w/.test(target)) return 0;
      let s = 4;
      if (target.length < 30) s += 2;
      return s;
    },
  },
  {
    name: 'numbers-mutation-31',
    tipMatch: /^Numbers cause mutation/,
    keep: 2,
    score: (target) => {
      // Require dau/dwy followed by an actually-soft-mutated initial.
      // Other numbers (tri, pedwar) have noun-specific behaviour — exclude.
      if (!/\b(dau|dwy)\s+(b|d|f|g|l|r|m)\w/.test(target)) return 0;
      let s = 5;
      if (target.length < 35) s += 2;
      return s;
    },
  },
  {
    name: 'past-odd-20',
    tipMatch: /^Past tense for he\/she ends in -odd/,
    keep: 2,
    score: (target) => {
      // Card has a verb ending in -odd
      if (!/\b\w+odd\b/.test(target)) return 0;
      let s = 5;
      if (target.length < 35) s += 2;
      return s;
    },
  },
  {
    name: 'past-endings-20',
    tipMatch: /^Past person endings: -ais/,
    keep: 2,
    score: (target) => {
      // Card has a verb in past tense (-ais/-aist/-odd/-on/-och/-on)
      if (!/\b\w+(ais|aist|odd|och)\b/.test(target)) return 0;
      let s = 5;
      if (target.length < 35) s += 2;
      return s;
    },
  },
  {
    name: 'roedd-19',
    tipMatch: /^"To be" has its own past: roedd/,
    keep: 2,
    score: (target) => {
      if (!/\broedd\w*\b/i.test(target)) return 0;
      let s = 5;
      if (target.length < 35) s += 2;
      return s;
    },
  },
  {
    name: 'past-vso-19',
    tipMatch: /^Past tense keeps Verb-Subject-Object/,
    keep: 2,
    score: (target) => {
      // Card starts with a past-tense verb form
      if (!/^\w+(odd|ais|aist|on|och)\b/i.test(target)) return 0;
      let s = 5;
      if (target.length < 35) s += 2;
      return s;
    },
  },
  {
    name: 'fy-nasal-12',
    tipMatch: /^Nasal mutation after fy/,
    keep: 2,
    score: (target) => {
      // Require unambiguous NM initials (mh-, nh-, ngh-).
      // m/n/ng can also be dictionary forms so they don't demo the rule.
      if (!/\bfy\s+(mh|nh|ngh)\w/i.test(target)) return 0;
      let s = 6;
      if (target.length < 30) s += 2;
      return s;
    },
  },
  {
    name: 'wedi-perfect-12',
    tipMatch: /^wedi \+ verbnoun = perfect tense/,
    keep: 2,
    score: (target) => {
      if (!/\bwedi\s+(?!awr|tri|deg|chwech|saith|wyth|naw|dau)\w/i.test(target)) return 0;
      let s = 5;
      if (target.length < 35) s += 2;
      return s;
    },
  },
  {
    name: 'three-mutations-12',
    tipMatch: /^Three Welsh mutations: soft, nasal, aspirate/,
    keep: 1, // generic intro — one host is enough
    score: (target) => {
      // Generic intro — any card with any mutation is fine
      const muts = /(fy\s+(mh|nh|ngh|m|n|ng)|ei\s+(b|d|f|g)|dau\s+(b|d|g))/i;
      if (!muts.test(target)) return 0;
      let s = 3;
      if (target.length < 30) s += 1;
      return s;
    },
  },
  {
    name: 'ym-yng-12',
    tipMatch: /^yn becomes ym before m, yng before ng/,
    keep: 2,
    score: (target) => {
      if (!/\b(ym|yng)\s+\w/i.test(target)) return 0;
      let s = 6;
      if (target.length < 35) s += 2;
      return s;
    },
  },
  {
    name: 'yn-contraction-11',
    tipMatch: /^yn \(often 'n after a vowel\) links/,
    keep: 2,
    score: (target) => {
      if (!/\b(Dw i'n|hi'n|fe'n|fo'n|nhw'n|chi'n)\b/i.test(target)) return 0;
      let s = 5;
      if (target.length < 30) s += 2;
      return s;
    },
  },
  {
    name: 'vso-start-11',
    tipMatch: /^Welsh sentences start with the verb/,
    keep: 1,
    score: (target) => {
      // Best demo: verb-first short clear cards
      if (!/^(Mae|Dw|Roedd|Bydd|Mi|Aeth|Aeth|Cafodd)\b/.test(target)) return 0;
      let s = 4;
      if (target.length < 25) s += 2;
      return s;
    },
  },
  {
    name: 'yn-adj-vs-vn-11',
    tipMatch: /^yn \+ adjective = state/,
    keep: 2,
    score: (target) => {
      // Card has both yn + adjective and yn + verbnoun (rare); failing that
      // any clear yn-linker example
      if (!/'n\s+\w+/.test(target)) return 0;
      let s = 4;
      if (target.length < 30) s += 2;
      return s;
    },
  },
  {
    name: 'slot-system-11',
    tipMatch: /^Slot system: Dw i'n bwyta/,
    keep: 1, // generic intro — minimal host count
    score: (target) => {
      // Demo: cards combining bod + 'n / wedi / mynd i
      if (!/(Dw i'n|i wedi|mynd i)/i.test(target)) return 0;
      let s = 3;
      if (target.length < 30) s += 1;
      return s;
    },
  },
  {
    name: 'nasal-stops-11',
    tipMatch: /^Nasal mutation makes voiced stops nasal/,
    keep: 2,
    score: (target) => {
      // Require unambiguous NM initials: mh-, nh-, ngh- (the demo forms).
      if (!/\b(fy|yn|ym|yng)\s+(mh|nh|ngh)\w/i.test(target)) return 0;
      let s = 5;
      if (target.length < 35) s += 2;
      return s;
    },
  },
  {
    name: 'newydd-11',
    tipMatch: /^`Newydd` is a close cousin/,
    keep: 2,
    score: (target) => {
      if (!/\bnewydd\b/i.test(target)) return 0;
      let s = 6;
      if (target.length < 35) s += 2;
      return s;
    },
  },
  {
    name: 'vso-default-10',
    tipMatch: /^Verb-Subject-Object \(VSO\) is the default/,
    keep: 1,
    score: (target) => {
      if (!/^(Mae|Dw|Roedd|Bydd|Aeth|Cafodd|Daeth|Wnaeth)\b/.test(target)) return 0;
      let s = 4;
      if (target.length < 25) s += 2;
      return s;
    },
  },
  {
    name: 'mae-3p-be-10',
    tipMatch: /^`Mae` is the 3rd-person 'be' form/,
    keep: 1,
    score: (target) => {
      if (!/^Mae\b/.test(target)) return 0;
      let s = 4;
      if (target.length < 25) s += 2;
      return s;
    },
  },
  // ---- 5-9x tier ----
  {
    name: 'conditional-forms-9',
    tipMatch: /^Conditional forms \(`byddwn`, `byddai`, `baswn`\)/,
    keep: 2,
    score: (target) => {
      if (!/\b(byddwn|byddai|byddent|baswn|basai|hoffwn|hoffai)\b/i.test(target)) return 0;
      let s = 5;
      if (target.length < 40) s += 2;
      return s;
    },
  },
  {
    name: 'two-conditionals-9',
    tipMatch: /^Two conditional families: `bydd-` \(modern, standard\)/,
    keep: 2,
    score: (target) => {
      if (!/\b(byddwn|byddai|byddent|baswn|basai|basent)\b/i.test(target)) return 0;
      let s = 5;
      if (target.length < 40) s += 2;
      return s;
    },
  },
  {
    name: 'welsh-genders-8',
    tipMatch: /^Welsh nouns have TWO genders/,
    keep: 1, // generic
    score: (target) => {
      // Demo: a card showing y + fem soft-mut, or fy + nasal-mut
      if (!/\b(y|yr)\s+(f|dd|l|r)\w|\bfy\s+(mh|nh|ngh)\w/.test(target)) return 0;
      let s = 4;
      if (target.length < 35) s += 2;
      return s;
    },
  },
  {
    name: 'fem-sing-y-sm-8',
    tipMatch: /^Feminine singular nouns SOFT-MUTATE after the article/,
    keep: 2,
    score: (target) => {
      if (!/\b(y|yr|'r)\s+(f|dd|l|r)\w/.test(target)) return 0;
      let s = 5;
      if (target.length < 35) s += 2;
      return s;
    },
  },
  {
    name: 'adj-fem-sm-8',
    tipMatch: /^Adjectives after feminine singular nouns ALSO soft-mutate/,
    keep: 2,
    score: (target) => {
      // Demo: a feminine noun + an SM'd adjective
      // Approximated by: fem-noun-context (cath/merch/etc.) + adj-starting-with f/dd/l/r
      // Hard to do robustly. Use a loose heuristic: y + (f|dd|l|r)\w+\s+(f|dd|l|r)\w
      if (!/\b(y|yr|'r)\s+\w+\s+(f|dd|l|r)\w/.test(target)) return 0;
      let s = 4;
      if (target.length < 40) s += 2;
      return s;
    },
  },
  {
    name: 'num-gender-8',
    tipMatch: /^Numbers from 2 also have gendered forms/,
    keep: 2,
    score: (target) => {
      if (!/\b(dau|dwy)\s+\w/.test(target)) return 0;
      let s = 5;
      if (target.length < 35) s += 2;
      return s;
    },
  },
  {
    name: 'hoffwn-compact-8',
    tipMatch: /^Compact alternative: `Hoffwn i \.\.\.`/,
    keep: 2,
    score: (target) => {
      if (!/\bHoffwn\b/i.test(target)) return 0;
      let s = 6;
      if (target.length < 35) s += 2;
      return s;
    },
  },
  {
    name: 'rwyn-shortens-7',
    tipMatch: /^`Rwy'n` shortens `Rydw i'n`/,
    keep: 1, // moved tip — most demos use Dw i'n, not Rwy'n
    score: (target) => {
      // Demo only if Rwy'n actually appears
      if (!/\bRwy'n\b/i.test(target)) return 0;
      let s = 7;
      if (target.length < 30) s += 2;
      return s;
    },
  },
  {
    name: 'plural-pronouns-7',
    tipMatch: /^Plural: `dyn ni'n` \/ `rydym ni'n`/,
    keep: 2,
    score: (target) => {
      if (!/\b(dyn ni'n|rydym ni'n|dych chi'n|rydych chi'n|ni'n|chi'n)\b/i.test(target)) return 0;
      let s = 5;
      if (target.length < 35) s += 2;
      return s;
    },
  },
  {
    name: 'dw-rwy-rydw-formality-7',
    tipMatch: /^`Dw i'n` \(informal\) \/ `Rwy'n` \(slightly more formal\)/,
    keep: 1, // generic info — minimal host
    score: (target) => {
      if (!/^(Dw i'n|Rwy'n|Rydw i'n)\b/i.test(target)) return 0;
      let s = 5;
      if (target.length < 25) s += 2;
      return s;
    },
  },
  {
    name: 'subject-pronoun-needed-7',
    tipMatch: /^Welsh always needs a subject pronoun/,
    keep: 1,
    score: (target) => {
      // Demo: card with explicit subject pronoun after bod
      if (!/^(Dw|Mae|Bydd|Roedd)\s+(i|e|hi|ni|nhw|chi|ti)\b/i.test(target)) return 0;
      let s = 5;
      if (target.length < 30) s += 2;
      return s;
    },
  },
  {
    name: 'yn-adj-sm-7',
    tipMatch: /^`yn` triggers soft mutation before adjectives/,
    keep: 2,
    score: (target) => {
      // Demo: 'n/yn + an SM-adjective initial (d-, f-, g-, dd-, l-)
      // Excluding b/m since b/m can also be dictionary forms.
      if (!/'n\s+(d|f|g|dd|l)\w/i.test(target)) return 0;
      let s = 5;
      if (target.length < 30) s += 2;
      return s;
    },
  },
  {
    name: 'ddim-negation-7',
    tipMatch: /^`Ddim` is a soft mutation of `dim`/,
    keep: 2,
    score: (target) => {
      if (!/\bddim\b/i.test(target)) return 0;
      let s = 5;
      if (target.length < 35) s += 2;
      return s;
    },
  },
  {
    name: 'cond-pronoun-sm-7',
    tipMatch: /^Soft mutation after the conditional pronoun/,
    keep: 2,
    score: (target) => {
      // Demo: byddwn/byddai + fronted SM verb-noun (f-, d-, g-)
      if (!/\b(byddwn|byddai|baswn)\s+i?'?n?\s+(f|d|g)\w/i.test(target)) return 0;
      let s = 5;
      if (target.length < 40) s += 2;
      return s;
    },
  },
  {
    name: 'yes-no-questions-6',
    tipMatch: /^Yes\/no questions just front a different form of `bod`/,
    keep: 1,
    score: (target) => {
      if (!/^(Wyt|Ydy|Oes|Dych)\b/i.test(target)) return 0;
      let s = 5;
      if (target.length < 30) s += 2;
      return s;
    },
  },
  {
    name: 'question-verb-forms-6',
    tipMatch: /^Welsh has different question\/affirmative verb forms/,
    keep: 1,
    score: (target) => {
      if (!/^(Wyt|Ydy|Oes|Dych)\b/i.test(target)) return 0;
      let s = 5;
      if (target.length < 30) s += 2;
      return s;
    },
  },
  {
    name: 'oes-existence-6',
    tipMatch: /^Existence questions use `oes`/,
    keep: 2,
    score: (target) => {
      if (!/\bOes\b/.test(target)) return 0;
      let s = 6;
      if (target.length < 35) s += 2;
      return s;
    },
  },
  {
    name: 'particle-a-6',
    tipMatch: /^Question particle `A` is optional/,
    keep: 1,
    score: (target) => {
      // Demo: any question card
      if (!/\?$/.test(target)) return 0;
      let s = 3;
      if (target.length < 30) s += 2;
      return s;
    },
  },
  {
    name: 'negation-ddim-6',
    tipMatch: /^Negation in Welsh: insert `ddim` after the subject/,
    keep: 2,
    score: (target) => {
      if (!/\bddim\b/i.test(target)) return 0;
      let s = 5;
      if (target.length < 35) s += 2;
      return s;
    },
  },
  {
    name: 'bydd-future-6',
    tipMatch: /^`Bydd` = 'will be'/,
    keep: 2,
    score: (target) => {
      if (!/^Bydd\b/.test(target)) return 0;
      let s = 6;
      if (target.length < 35) s += 2;
      return s;
    },
  },
  // 5x tier
  {
    name: 'verb-shape-negate-5',
    tipMatch: /^Some verbs negate by changing form/,
    keep: 1,
    score: (target) => {
      if (!/\b(dwyt|dyw|dydy|dydyn)\b/i.test(target)) return 0;
      let s = 5;
      if (target.length < 35) s += 2;
      return s;
    },
  },
  {
    name: 'roedd-was-5',
    tipMatch: /^`Roedd` = 'was\/were'/,
    keep: 2,
    score: (target) => {
      if (!/^Roedd\b/.test(target)) return 0;
      let s = 6;
      if (target.length < 35) s += 2;
      return s;
    },
  },
  {
    name: 'imperfect-paradigm-5',
    tipMatch: /^Full imperfect: `roeddwn i, roeddet ti/,
    keep: 1,
    score: (target) => {
      if (!/\b(roeddwn|roeddet|roedd|roedden|roeddech)\b/i.test(target)) return 0;
      let s = 5;
      if (target.length < 40) s += 2;
      return s;
    },
  },
  {
    name: 'formal-nid-5',
    tipMatch: /^Formal\/written: `Nid yw e'n hapus`/,
    keep: 1,
    score: (target) => {
      if (!/\bNid\s+yw/i.test(target)) return 0;
      let s = 7;
      if (target.length < 35) s += 2;
      return s;
    },
  },
  {
    name: 'past-vs-imperf-5',
    tipMatch: /^Compare past simple vs imperfect/,
    keep: 1,
    score: (target) => {
      // Need imperfect (roedd*) AND past (verb+odd/ais)
      if (!(/\broedd/i.test(target) && /\w+(odd|ais)\b/i.test(target))) return 0;
      let s = 6;
      return s;
    },
  },
  {
    name: 'doeddwn-neg-5',
    tipMatch: /^Negative: `doeddwn i ddim`/,
    keep: 1,
    score: (target) => {
      if (!/\b(doeddwn|doeddet|doedd|doedden|doeddech)\b/i.test(target)) return 0;
      let s = 7;
      if (target.length < 40) s += 2;
      return s;
    },
  },
  {
    name: 'bydd-future-paradigm-5',
    tipMatch: /^Full future of `bod`: `byddaf i/,
    keep: 1,
    score: (target) => {
      if (!/\b(byddaf|byddi|bydd|byddwn|byddwch|byddan)\b/i.test(target)) return 0;
      let s = 5;
      if (target.length < 35) s += 2;
      return s;
    },
  },
  {
    name: 'future-yn-vn-5',
    tipMatch: /^Future \+ yn \+ verb-noun = simple future/,
    keep: 1,
    score: (target) => {
      if (!/^Bydd\w*\s+\w+\s+(yn|'n)\s+\w/i.test(target)) return 0;
      let s = 5;
      if (target.length < 40) s += 2;
      return s;
    },
  },
  {
    name: 'fydd-neg-5',
    tipMatch: /^Negate by softening: `bydd → fydd`/,
    keep: 1,
    score: (target) => {
      if (!/^Fydd\b/i.test(target)) return 0;
      let s = 7;
      if (target.length < 35) s += 2;
      return s;
    },
  },
];

const removedCardIds = new Set();
const removedByRule = {};

for (const rule of RULES) {
  const hosts = deck.filter(c => c.grammar && rule.tipMatch.test(c.grammar));
  if (!hosts.length) {
    console.log('  ! ' + rule.name + ': no host cards found');
    continue;
  }
  const scored = hosts.map(c => ({ card: c, score: rule.score(c.target) }));
  // Sort by score desc, then by id asc for stable selection
  scored.sort((a, b) => (b.score - a.score) || String(a.card.id).localeCompare(String(b.card.id)));
  // Only keep cards with score > 0 — if no host demonstrates the rule, strip ALL
  const eligible = scored.filter(s => s.score > 0).slice(0, rule.keep);
  const keepIds = new Set(eligible.map(s => s.card.id));
  const removeIds = scored.filter(s => !keepIds.has(s.card.id)).map(s => s.card.id);
  for (const id of removeIds) removedCardIds.add(id);
  removedByRule[rule.name] = { hosts: hosts.length, removed: removeIds.length, kept: keepIds.size };
  const keptLabel = eligible.length === 0
    ? 'NONE-eligible'
    : [...keepIds].slice(0, 2).join(', ') + ' (scores: ' + eligible.slice(0,2).map(e => e.score).join(',') + ')';
  console.log('  ' + rule.name.padEnd(28) + ' hosts=' + String(hosts.length).padStart(3) +
              ' kept=' + eligible.length +
              ' strip=' + removeIds.length +
              '   ' + keptLabel);
}

console.log('\nTotal cards to strip:', removedCardIds.size);

if (fix) {
  let stripped = 0;
  for (const card of deck) {
    if (removedCardIds.has(card.id)) {
      delete card.grammar;
      stripped++;
    }
  }
  fs.writeFileSync(DECK_PATH, JSON.stringify(deck, null, 2));
  console.log('Welsh deck written; stripped:', stripped);
}
