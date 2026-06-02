/** German grammar-tip patterns */
module.exports = [

  // ── V2 rule (verb in second position) ──
  {
    id: 'de-v2-with-frontload',
    priority: 80,
    match: t => /^(Heute|Morgen|Gestern|Manchmal|Oft|Hier|Dort|Im\s+\w+|Am\s+\w+|Vor\s+\w+|Nach\s+\w+|In\s+\w+|Zuerst)\s+\w+/i.test(t),
    tips: [
      "Statement starts with something other than the subject? The verb still goes second: `Heute gehe ich ins Kino` (not `Heute ich gehe`). Subject jumps behind the verb to keep V2.",
      "German is strict about V2: the conjugated verb is the SECOND element, no matter what. Count: [1: Heute] [2: gehe] [3: ich ins Kino].",
      "Inversion required: if anything other than the subject opens a sentence, swap the verb and subject. `Morgen kommt er` — never `Morgen er kommt`.",
    ],
  },

  // ── Perfekt with sein ──
  {
    id: 'de-perfekt-sein',
    priority: 95,
    match: t => /\b(bin|bist|ist|sind|seid)\s+(gegangen|gekommen|gefahren|geblieben|gelaufen|geflogen|gestorben|geboren|geworden|aufgestanden|eingeschlafen)\b/i.test(t),
    tips: [
      "Perfekt with `sein` is for movement and change of state: `ich bin gegangen` (I went), `er ist gestorben` (he died). Almost all others use `haben`.",
      "Memorize the `sein` verbs: gehen, kommen, fahren, fliegen, laufen, schwimmen, sterben, geboren, werden, bleiben. If the action moves you or changes you, sein.",
      "Auxiliary `sein` doesn't trigger any agreement — unlike French/Italian. `Ich bin gegangen` / `sie ist gegangen` — participle stays the same.",
    ],
  },
  {
    id: 'de-perfekt-haben',
    priority: 75,
    match: t => /\b(habe|hast|hat|haben|habt)\s+\w*?\w+(en|t)\b/i.test(t) && /\bge\w+(en|t)\b/i.test(t),
    tips: [
      "Perfekt = `haben/sein` + past participle. Most verbs take `haben`: `ich habe gegessen`, `er hat gesehen`. Participle goes to the END of the clause.",
      "Watch where the participle lands: `Ich habe gestern Pizza gegessen.` Sandwich structure — auxiliary near the front, participle at the very end.",
    ],
  },

  // ── Modal verbs (kann/will/soll/muss/mag/darf) ──
  {
    id: 'de-modal-infinitive',
    priority: 85,
    match: t => /\b(kann|kannst|können|könnt|will|willst|wollen|wollt|soll|sollst|sollen|sollt|muss|musst|müssen|müsst|mag|magst|mögen|mögt|darf|darfst|dürfen|dürft|möchte|möchtest|möchten|möchtet)\b/i.test(t),
    tips: [
      "Modal verb in position 2, the infinitive jumps to the END: `Ich muss morgen früh aufstehen.` Bracket structure — modal sandwiches everything between them.",
      "`möchte` (would like) is more polite than `will` (want). Wrong-feeling for English speakers: `ich will einen Kaffee` sounds blunt. `Ich möchte einen Kaffee` is what you actually want to say.",
      "Modal endings: ich/er forms have no -t, NO -e on first person. `Ich kann`, `er kann`, `wir können`. Don't conjugate like a regular verb.",
    ],
  },

  // ── Separable prefixes ──
  {
    id: 'de-separable-prefix',
    priority: 90,
    match: t => /\b(rufe?\s+\w+\s+an|stehe?\s+\w*\s*auf|sehe?\s+\w*\s*aus|gehe?\s+\w*\s*aus|gehe?\s+\w*\s*ein|fange?\s+\w*\s*an|komme?\s+\w*\s*an|fahre?\s+\w*\s*ab|kaufe?\s+\w*\s*ein|mache?\s+\w*\s*auf|mache?\s+\w*\s*zu|hole?\s+\w*\s*ab)\b/i.test(t),
    tips: [
      "Separable prefixes split off and march to the end: `aufstehen` → `ich stehe um 7 Uhr auf`. The prefix (auf) sits at the very end of the clause.",
      "In subordinate clauses or with modals, they glue back together: `Ich muss aufstehen` (no split). In main clauses, they ALWAYS split.",
      "Common ones: an-, auf-, aus-, ein-, mit-, ab-, zu-, vor-, weg-, hin-, her-. Look up the verb in its full form; in a sentence, expect the split.",
    ],
  },

  // ── Dative-only prepositions ──
  {
    id: 'de-dative-preposition',
    priority: 90,
    match: t => /\b(mit|aus|bei|nach|von|zu|seit|gegenüber)\s+(dem|der|den|einem|einer|einen)\b/i.test(t),
    tips: [
      "`mit/aus/bei/nach/von/zu/seit/gegenüber` always take dative. Articles change: der → dem, die → der, das → dem, die(pl) → den (+ -n on the noun in plural).",
      "Memorize as a mantra: 'mit, aus, bei, nach, von, zu, seit, gegenüber — DATIVE'. No exceptions, no thinking required.",
      "After these prepositions you'll see `dem/der/den` (definite) or `einem/einer/einem` (indefinite). If you write `den` (acc) here, that's wrong.",
    ],
  },

  // ── Accusative-only prepositions ──
  {
    id: 'de-accusative-preposition',
    priority: 90,
    match: t => /\b(für|durch|gegen|ohne|um|bis|wider|entlang)\s+(den|die|das|einen|eine|ein)\b/i.test(t),
    tips: [
      "`für/durch/gegen/ohne/um/bis/wider` always take accusative. Articles: der → den, die → die, das → das. Quick memo: 'für, durch, gegen, ohne, um'.",
      "Watch `für` — it always triggers accusative even when English-speakers want to add an extra word: `für mich` (for me), `für dich` (for you), `für den Mann`.",
    ],
  },

  // ── Dative for indirect object ──
  {
    id: 'de-dative-indirect-object',
    priority: 65,
    match: t => /\b(gebe|gibst|gibt|geben|gebt|sage|sagst|sagt|sagen|schreibe|schreibst|schreibt|schreiben|zeige|zeigst|zeigt|zeigen|bringe|bringst|bringt|bringen)\s+(dem|der|den|einem|einer|mir|dir|ihm|ihr|uns|euch|ihnen)\b/i.test(t),
    tips: [
      "The indirect object (the receiver) goes in dative: `ich gebe dem Mann das Buch`. `Dem Mann` = to the man. English doesn't always need 'to' — German doesn't either, but uses dative case.",
      "Pronoun forms in dative: mir, dir, ihm, ihr, uns, euch, ihnen. `Ich helfe dir` = 'I help you' (dir, not dich — helfen takes dative).",
    ],
  },

  // ── Dass + verb at end ──
  {
    id: 'de-dass-verb-end',
    priority: 95,
    match: t => /\b(dass|weil|wenn|ob|obwohl|damit|während)\b/i.test(t),
    tips: [
      "Subordinating conjunctions (`dass`, `weil`, `wenn`, `ob`, `obwohl`) send the verb to the END of the clause: `Ich weiß, dass er morgen kommt`.",
      "Two main culprits English speakers forget: `weil` (because) and `dass` (that). Both shove the verb to the back. `Weil er müde ist`, not `weil er ist müde`.",
      "Subordinate clause = comma + conjunction + …everything… + verb. Verb is the FINAL word, separated by no comma from the rest.",
    ],
  },

  // ── Würde + infinitive (polite conditional) ──
  {
    id: 'de-würde-conditional',
    priority: 80,
    match: t => /\b(würde|würdest|würden|würdet)\s+\w+(en|n)\b/i.test(t),
    tips: [
      "`würde + infinitive` = the polite/hypothetical 'would': `ich würde gern kommen` (I'd like to come). Easier than memorising irregular Konjunktiv II forms.",
      "Watch the infinitive position — `würde` near the front, verb at the very END: `Ich würde dir das Buch geben.`",
    ],
  },

  // ── Sich + reflexive ──
  {
    id: 'de-reflexive-sich',
    priority: 85,
    match: t => /\b(mich|dich|sich|uns|euch)\s+\w+(e|st|t|en)\b/i.test(t) && /\b(freue|freust|freut|freuen|erinnere|erinnerst|erinnert|erinnern|wasche|wäschst|wäscht|waschen|fühle|fühlst|fühlt|fühlen|treffe|triffst|trifft|treffen|setze|setzt|setzen|interessiere)\b/i.test(t),
    tips: [
      "German reflexive: pronouns mich/dich/sich/uns/euch/sich. `Ich freue mich` = 'I'm happy / I look forward to'. The `mich` is mandatory — without it the verb means something else.",
      "Many verbs are reflexive in German but not in English: `sich erinnern` (to remember), `sich freuen` (to be happy), `sich treffen` (to meet). Learn them as a pair: verb + sich.",
    ],
  },

  // ── Negation kein vs nicht ──
  {
    id: 'de-kein-negation',
    priority: 70,
    match: t => /\b(kein|keine|keinen|keinem|keiner)\b/i.test(t),
    tips: [
      "`kein` = 'no / not a' — negates a noun directly. `Ich habe kein Geld` (I have no money), not `ich habe nicht Geld`. Use `kein` instead of `nicht` when negating a noun with no article or with `ein/eine`.",
      "`kein` agrees like the indefinite article `ein`: keinen (m acc), keine (f), keinem (m dat), etc. Same endings as ein/eine just with k- in front.",
    ],
  },

  // ── Zu + infinitive ──
  {
    id: 'de-zu-infinitive',
    priority: 75,
    match: t => /\b\w+,\s+\w+\s+zu\s+\w+(en|n)\b/i.test(t) || /\bum\s+zu\s+\w+(en|n)\b/i.test(t),
    tips: [
      "`um...zu + infinitive` = 'in order to': `Ich gehe joggen, um fit zu bleiben` (I jog to stay fit). The infinitive goes to the end with `zu` right before it.",
      "Plain `zu + infinitive` after certain verbs: `Ich versuche zu lernen` (I try to learn). Comma not always required; `zu` and the verb stick together.",
    ],
  },

  // ── Der/die/das as relative pronoun ──
  {
    id: 'de-relative-clause',
    priority: 75,
    match: t => /,\s+(der|die|das|den|dem|denen|deren|dessen)\b/i.test(t),
    tips: [
      "Relative pronouns (der/die/das + cases) match the noun's gender but take the case from their role in the relative clause. `Der Mann, der dort steht` (m, nominative subject).",
      "Comma rule: every relative clause needs a comma before AND after. Then the conjugated verb goes to the END of the relative clause.",
    ],
  },

  // ── Articles + gender ──
  {
    id: 'de-articles',
    priority: 40,
    match: t => /\b(der|die|das|den|dem|den|des)\s+[A-ZÄÖÜ]\w+/i.test(t),
    tips: [
      "German has 3 genders (der/die/das) and 4 cases — and the article changes for both. Don't try to predict gender from meaning (das Mädchen = the girl). Learn the article with the noun.",
      "Quick reminder: nominative der/die/das, accusative den/die/das, dative dem/der/dem, genitive des/der/des. Memorise the table; you'll need it constantly.",
    ],
  },

  // ── Möchte (polite want) ──
  {
    id: 'de-möchte-polite',
    priority: 90,
    match: t => /\bich\s+möchte\b/i.test(t),
    tips: [
      "`möchte` = 'would like' — the polite form for ordering, requesting, expressing wishes. `Ich möchte einen Kaffee` is the natural way to order a coffee. `Ich will` sounds demanding.",
      "Use `möchte` whenever you'd say 'I'd like' in English. The verb form is technically subjunctive of `mögen`, but think of it as a fixed polite verb.",
    ],
  },

  // ── Du-form imperative ──
  {
    id: 'de-imperative-du',
    priority: 80,
    match: t => /^(Komm|Geh|Mach|Sag|Hör|Schau|Iss|Nimm|Hilf|Gib|Bleib|Lies|Sieh)!?\b/i.test(t),
    tips: [
      "Du-imperative drops the -st: `Du kommst → Komm!`. No subject pronoun. Strong-vowel-change verbs keep the change: `du gibst → Gib!`, `du nimmst → Nimm!`.",
      "Add `mal` or `bitte` to soften: `Komm mal her!` (just come here), `Hilf mir bitte` (help me please). Without softening, imperatives can sound abrupt.",
    ],
  },

  // ── Du vs Sie (formal/informal you) — the biggest social trap ─────
  {
    id: 'de-du-sie-formal',
    priority: 88,
    match: t => /\b(du|Sie|Ihnen|Ihr|Ihre|Ihren|dich|dir)\b/.test(t),
    tips: [
      "German has TWO 'you's: `du` (informal — family, friends, kids, peers) and `Sie` (formal — strangers, work, anyone you don't know well). Capital-S `Sie` is required.",
      "`Sie` looks like `sie` (she/they). The capital matters: `Sie sind` = you (formal) are; `sie sind` = they are. Verbs are always plural with Sie even for one person.",
      "Default to `Sie` with anyone you'd address as Mr/Mrs in English. Wrong `du` can sound rude or condescending. Germans take this seriously — wait for them to suggest `wir können uns duzen` (we can switch to du).",
      "Plural: `ihr` (informal — you guys) vs `Sie` (formal — same form as singular formal). `Wie geht es euch?` (informal) vs `Wie geht es Ihnen?` (formal).",
    ],
  },

];
