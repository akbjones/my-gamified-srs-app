/** Swedish grammar-tip patterns */
module.exports = [

  // ── V2 rule with frontload ──
  {
    id: 'sv-v2-frontload',
    priority: 85,
    match: t => /^(Idag|I\s+morgon|I\s+går|Här|Där|Nu|Då|Ibland|Ofta|På|I)\s+\w+/i.test(t),
    tips: [
      "Swedish is V2: the verb is always the second element. `Idag äter jag pizza` (today I eat pizza), not `idag jag äter`. Subject jumps after the verb.",
      "If anything but the subject opens the sentence, the subject inverts. Same rule as German/Dutch. `I morgon kommer han` — never `i morgon han kommer`.",
    ],
  },

  // ── Present tense one-form rule ──
  {
    id: 'sv-present-one-form',
    priority: 70,
    match: t => /\b(jag|du|han|hon|den|det|vi|ni|de)\s+\w+(r|ar|er)\b/i.test(t),
    tips: [
      "Swedish present tense is the same for all persons: `jag talar`, `du talar`, `han talar`. The verb form never changes by person. Easy compared to most European languages.",
      "Endings tell you the verb group: -ar (group 1, regular), -er (group 2), -r on stems ending in vowel (group 3), zero (group 4 irregular). But the present form stays the same for every subject.",
    ],
  },

  // ── Past tense (-ade / -de / -te / vowel change) ──
  {
    id: 'sv-past-tense',
    priority: 70,
    match: t => /\b\w+(ade|de|te|dde|tte)\b/i.test(t),
    tips: [
      "Swedish past tense endings: -ade (group 1, most regular), -de or -te (group 2 depending on voiced/voiceless stem). `Tittade`, `läste`, `köpte`. Same form for all subjects.",
      "Group 4 verbs have vowel changes instead of endings: `dricka → drack`, `gå → gick`, `se → såg`. Memorise the principal parts — they're highly irregular but very common.",
    ],
  },

  // ── Supinum (perfect tense) ──
  {
    id: 'sv-supinum-perfect',
    priority: 90,
    match: t => /\b(har|hade)\s+\w+(at|t|tt|it)\b/i.test(t),
    tips: [
      "Perfect tense uses `har + supinum`: `jag har talat`, `vi har sett`. The supinum is the form ending -at / -t / -tt / -it — distinct from past tense.",
      "Don't confuse supinum with the past tense. Past: `jag åt` (I ate). Perfect: `jag har ätit` (I have eaten). Same root, different endings, different uses.",
    ],
  },

  // ── Definite forms (suffixed article) ──
  {
    id: 'sv-definite-suffix',
    priority: 65,
    match: t => /\b\w+(en|et|na|or|er|et|n)\b/i.test(t) && /^[a-zåäö]/i.test(t),
    tips: [
      "Swedish puts 'the' as a suffix: `hund` (a dog) → `hunden` (the dog). `Hus` → `huset`. No separate word like English 'the'. Stick it on the end.",
      "Two genders (common -n, neuter -t): `bilen` (the car, common) vs `huset` (the house, neuter). The article suffix tells you which gender.",
    ],
  },

  // ── Object pronouns ──
  {
    id: 'sv-object-pronouns',
    priority: 55,
    match: t => /\b(mig|dig|honom|henne|oss|er|dem)\b/i.test(t),
    tips: [
      "Object pronouns: mig (me), dig (you), honom (him), henne (her), oss (us), er (you pl), dem (them). Place after the verb: `jag ser dig`.",
      "In writing, `dem` is the standard object form for 'them' — but in speech, Swedes often say `dom` for both subject and object. Spelling stays formal.",
    ],
  },

  // ── Reflexive ──
  {
    id: 'sv-reflexive',
    priority: 80,
    match: t => /\b(mig|dig|sig|oss|er)\s+(tvättar|tvättade|klär|klädde|reser|reste|skyndar|skyndade|gifter|gifte|sätter|satte)\b/i.test(t),
    tips: [
      "Reflexive uses object pronouns: mig / dig / sig / oss / er / sig. `Jag tvättar mig` (I wash myself), `han klär sig` (he gets dressed).",
      "`sig` covers him/her/it/them when the reflexive points back to the same subject. Don't use `honom/henne/dem` here.",
    ],
  },

  // ── Inte placement ──
  {
    id: 'sv-inte-placement',
    priority: 75,
    match: t => /\b\w+\s+inte\b/i.test(t),
    tips: [
      "`inte` (not) goes AFTER the verb in main clauses: `jag äter inte pizza` (I don't eat pizza). Watch the position — putting `inte` first is wrong.",
      "In subordinate clauses, `inte` moves BEFORE the verb: `att jag inte äter pizza` (that I don't eat pizza). Main vs subordinate flips it.",
    ],
  },

  // ── Subordinate word order (BIFF rule) ──
  {
    id: 'sv-biff-rule',
    priority: 85,
    match: t => /\b(att|när|om|därför\s+att|eftersom|medan|innan|efter\s+att|fastän)\b/i.test(t),
    tips: [
      "BIFF rule: in subordinate clauses (`att`, `när`, `om`, `eftersom`), `inte` goes BEFORE the conjugated verb: `Jag vet att han inte kommer` (I know that he isn't coming).",
      "Subordinating conjunctions don't push the verb to the very end (that's German). But they DO flip the inte/verb order. Main: `verb + inte`. Sub: `inte + verb`.",
    ],
  },

  // ── Compound nouns ──
  {
    id: 'sv-compounds',
    priority: 50,
    match: t => /\b\w{10,}\b/i.test(t),
    tips: [
      "Swedish loves compound nouns — long words made of smaller ones. `Tandborste` = tooth + brush. Break them apart to read: `tand` + `borste`. The last piece carries the gender.",
      "If you see a 15-letter word, don't panic. It's almost certainly 2-3 words glued together. Read left to right, find the main noun on the right.",
    ],
  },

  // ── Att + infinitive ──
  {
    id: 'sv-att-infinitive',
    priority: 70,
    match: t => /\batt\s+\w+(a|å|ö)\b/i.test(t),
    tips: [
      "`att + infinitive` = English 'to + verb': `att äta` (to eat), `att gå` (to go). Most Swedish infinitives end in -a; a few end in -å, -ö, -å.",
      "After modal verbs (`kan`, `vill`, `måste`), drop the `att`: `jag vill äta` (I want to eat). Modal + bare infinitive only.",
    ],
  },

  // ── Det är ──
  {
    id: 'sv-det-ar',
    priority: 90,
    match: t => /\bdet\s+(är|var|finns|fanns)\b/i.test(t),
    tips: [
      "`det är` = 'it is / there is'. `Det finns` = 'there is/are' for existence. `Det är en bil` (it is a car) vs `det finns en bil` (there is a car).",
      "`Det är` doesn't care about gender or number of what follows: `det är en bok`, `det är böcker`. Always `det är` in front, regardless.",
    ],
  },

  // ── Du is universal — no formal/informal split (du-reform) ───────
  {
    id: 'sv-du-universal',
    priority: 80,
    match: t => /\b(du|ni|dig|dej|er|din|ditt|dina|er|ert|era)\b/i.test(t),
    tips: [
      "Swedish only has ONE 'you' in modern use: `du`. Use it with strangers, your boss, the king — everyone. The formal `Ni` is essentially extinct outside very formal letters.",
      "This is unusual for European languages. Spanish, French, German, Russian all distinguish formal/informal — Swedish dropped it in the 1960s-70s ('du-reformen'). Don't reach for a formal 'you'; it doesn't exist.",
      "`Ni` survives only as the plural 'you' (you all). Some older speakers or very formal contexts use `Ni` for one stranger, but it can actually sound stiff or even sarcastic. Default to `du`.",
      "Possessives are straightforward: `din/ditt/dina` (your, singular) matching the noun's gender and number. `Er/ert/era` for plural 'your'. No formality dimension to worry about.",
    ],
  },

];
