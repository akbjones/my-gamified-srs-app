/** Welsh grammar-tip patterns */
module.exports = [

  // ── Mae VSO order ──
  {
    id: 'cy-vso-mae',
    priority: 60,
    match: t => /^Mae\b/i.test(t),
    tips: [
      "Welsh starts with the verb: `Mae hi'n braf` (she/it is nice). Subject comes SECOND. The opposite of English's subject-first order.",
      "`Mae` carries the present-tense 'is/are' meaning. The whole sentence pivots around it: verb → subject → rest.",
    ],
  },

  // ── 'n linking particle ──
  {
    id: 'cy-yn-particle',
    priority: 90,
    match: t => /\b(dw|wyt|mae|maen|dyn|dych|dydych)\s+\w+'?n\b/i.test(t),
    tips: [
      "`yn` (often shortened to `'n` after a vowel) links the form of `bod` (to be) to an adjective or verb-noun. `Dw i'n hapus` (I am happy), `mae hi'n bwyta` (she is eating).",
      "Skip `'n` and the sentence is broken: `dw i hapus` is wrong. The `'n` is mandatory between the verb and what follows.",
    ],
  },

  // ── Dw i'n / Wyt ti'n / Mae hi'n pattern ──
  {
    id: 'cy-dwi-pattern',
    priority: 85,
    match: t => /\bDw\s+i'?n\b/i.test(t),
    tips: [
      "`Dw i'n` (I am ...) is the cornerstone of Welsh: subject-pronoun comes AFTER the verb. `Dw i'n hoffi coffi` = 'I like coffee'.",
      "Welsh always needs a subject pronoun — `dw` alone isn't enough. `Dw i'n`, `dwyt ti'n`, `mae e'n`, etc. The pronoun follows the verb.",
    ],
  },

  // ── Soft mutation triggers ──
  {
    id: 'cy-soft-mutation',
    priority: 75,
    match: t => /\b(yn|dau|dwy|dy|fy|ei|tri|chwe|i|o|am|ar|at|tan|dros|dan|drwy|gan|wrth)\s+(b|d|g|m|ll|rh|t|c|p|f)\w*/i.test(t),
    tips: [
      "Soft mutation: certain words trigger the next consonant to soften. p→b, t→d, c→g, b→f, d→dd, g→ (drop), m→f, ll→l, rh→r. Triggers: `yn`, `dau`, `dwy`, `dy`, `ei` (his), most preps.",
      "If a Welsh sentence looks 'wrong' compared to a dictionary form — that's probably a mutation. `Cath → fy nghath` (my cat, nasal); `cath → ei gath` (his cat, soft).",
    ],
  },

  // ── Nasal mutation ──
  {
    id: 'cy-nasal-mutation',
    priority: 85,
    match: t => /\bfy\s+(ngh|mh|nh|ng|m|n)\w/i.test(t) || /\byn\s+(mh|ngh|nh|m|ng|n)\w/i.test(t),
    tips: [
      "Nasal mutation hits after `fy` (my) and `yn` (in): p→mh, t→nh, c→ngh, b→m, d→n, g→ng. `Pen → fy mhen` (my head), `Caerdydd → yng Nghaerdydd` (in Cardiff).",
      "Welsh has THREE mutation systems — soft, nasal, aspirate. Nasal is the rarest but very common after `fy` (my) and `yn` (in/at). Sound shifts: voiced stops become nasals.",
    ],
  },

  // ── Aspirate mutation ──
  {
    id: 'cy-aspirate-mutation',
    priority: 80,
    match: t => /\b(ei|tri|chwe|a|â)\s+(ch|ph|th)\w/i.test(t),
    tips: [
      "Aspirate mutation: p→ph, t→th, c→ch — happens after `ei` (her), `tri`, `chwe`, `a` (and), `â` (with). `Cath → ei chath` (her cat).",
      "Aspirate is the easiest to spot — words start with `ch`, `ph`, or `th`. If you see those, the trigger is usually one of: `ei` (her), `tri`, `chwe`, `a`/`â`.",
    ],
  },

  // ── Negation: Dw i ddim ──
  {
    id: 'cy-negation-ddim',
    priority: 80,
    match: t => /\b(dw|dwyt|dyw|dydy|dydyn|dyn|dych|dydych|tydy|dydy)\s+\w+\s+ddim\b/i.test(t),
    tips: [
      "Negation in Welsh: insert `ddim` after the subject. `Dw i'n hapus` (I'm happy) → `dw i ddim yn hapus` (I'm not happy). Notice `yn` stays for adjectives.",
      "`Ddim` is a soft mutation of `dim` (nothing/none). It does the negation work. Order: verb + subject + ddim + rest.",
    ],
  },

  // ── Question with verb-fronted yes/no ──
  {
    id: 'cy-question-verb-first',
    priority: 75,
    match: t => /^(Ydy|Ydych|Wyt|Ydyn|Ydw)\b/i.test(t) || /\?$/.test(t),
    tips: [
      "Yes/no questions just front-load a different form of `bod`: `Wyt ti'n hapus?` (Are you happy?). The intonation rise matters too — like English question shape.",
      "Welsh has different question/affirmative verb forms. `Wyt` for 'are you?', `ydy` for 'is he/she/it?'. Use these in questions instead of `mae/dw`.",
    ],
  },

  // ── Wedi for perfect ──
  {
    id: 'cy-wedi-perfect',
    priority: 90,
    match: t => /\bwedi\s+\w+/i.test(t),
    tips: [
      "`wedi` + verb-noun = perfect tense ('have done X'). `Dw i wedi bwyta` (I have eaten). Replaces `yn` from the present pattern with `wedi`.",
      "Think of it as a slot system: `Dw i'n bwyta` (present) → `Dw i wedi bwyta` (perfect) → `Dw i'n mynd i fwyta` (future). The middle word changes the tense.",
    ],
  },

  // ── Conditional with byddwn / byddai ──
  {
    id: 'cy-conditional',
    priority: 90,
    match: t => /\b(byddwn|byddai|byddent|fyddwn|fyddai|fyddent|baswn|basai|basech|petai)\b/i.test(t),
    tips: [
      "Conditional forms (`byddwn`, `byddai`, `baswn`) = 'would'. `Byddwn i'n hoffi` (I would like). For 'if' clauses use `petai` or `pe bai`.",
      "Two conditional families: `bydd-` (modern, standard) and `bas-` (also modern, very common). Both translate as 'would (be)' + a following verb-noun.",
    ],
  },

  // ── Possession with gan/gen ──
  {
    id: 'cy-possession-gan',
    priority: 80,
    match: t => /\b(mae|oes)\s+\w+\s+(gen|gan|gyda)\s+\w/i.test(t),
    tips: [
      "Welsh expresses possession backwards: `Mae car gen i` literally = 'there is a car with me' = 'I have a car'. `Gen i` = me, `gen ti` = you, `gan + name` = with X.",
      "Northern Welsh uses `gen/gan`; southern uses `gyda` (`gyda fi`). Same meaning, different region. The structure is the same: existence + thing + 'with' + person.",
    ],
  },

  // ── Rhaid i for must ──
  {
    id: 'cy-rhaid-i',
    priority: 95,
    match: t => /\brhaid\s+i\b/i.test(t),
    tips: [
      "`Rhaid i + person + verb-noun` = 'must / has to'. `Rhaid i fi fynd` = 'I must go'. Literal: 'necessity to me to go'. Welsh frames obligation as a state of necessity.",
      "After `i + person`, soft mutation hits the verb-noun. `mynd → fynd`. `Rhaid i ti fwyta` (you must eat) — `bwyta` becomes `fwyta`.",
    ],
  },

  // ── 'r contracted article ──
  {
    id: 'cy-r-article',
    priority: 50,
    match: t => /\b\w'r\b/i.test(t),
    tips: [
      "`'r` is the contracted definite article — happens after a vowel: `mae'r` (the), `yn y` (in the) → `yn 'r` doesn't fit; that one stays full. The shortened `'r` triggers when something ending in a vowel meets `y/yr`.",
      "Welsh has multiple forms of 'the': `y` before consonants, `yr` before vowels, `'r` after vowels in the previous word. `Mae'r ci` = 'the dog is'.",
    ],
  },

];
