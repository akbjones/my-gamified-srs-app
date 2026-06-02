/** Dutch grammar-tip patterns */
module.exports = [

  // ── V2 rule with frontload ──
  {
    id: 'nl-v2-frontload',
    priority: 85,
    match: t => /^(Vandaag|Morgen|Gisteren|Soms|Vaak|Hier|Daar|In\s+\w+|Op\s+\w+|Na\s+\w+|Voor\s+\w+|Toen|Nu)\s+\w+/i.test(t),
    tips: [
      "Dutch follows V2 like German: the verb stays in second position. `Vandaag ga ik` (today I go), not `vandaag ik ga`. Subject jumps after the verb when something else opens the sentence.",
      "Inversion is mandatory: if anything but the subject is first, the subject moves behind the verb. `Morgen werkt hij` — not `morgen hij werkt`.",
    ],
  },

  // ── Perfectum with zijn ──
  {
    id: 'nl-perfect-zijn',
    priority: 95,
    match: t => /\b(ben|bent|is|zijn)\s+(gegaan|gekomen|geweest|gestorven|geboren|geworden|opgestaan|gevallen|gegroeid)\b/i.test(t),
    tips: [
      "Perfect tense with `zijn` for movement/change verbs: `ik ben gegaan` (I went), `hij is gestorven` (he died). Same split as French/Italian/German.",
      "Common `zijn` verbs: gaan, komen, blijven, worden, beginnen, sterven, vallen. Movement + change of state. Rest use `hebben`.",
    ],
  },
  {
    id: 'nl-perfect-hebben',
    priority: 75,
    match: t => /\b(heb|hebt|heeft|hebben)\s+\w*\s*\w+(en|d|t)\b/i.test(t) && /\bge\w+(en|d|t)\b/i.test(t),
    tips: [
      "Perfect = `hebben/zijn` + past participle. Most verbs use `hebben`: `ik heb gegeten`, `wij hebben gezien`. Participle to the END of the sentence.",
      "Participle endings: -t for most, -d when stem ends in voiced sound. `Werken → gewerkt`, `lezen → gelezen`. Watch the ge- prefix on regular verbs.",
    ],
  },

  // ── Modal verbs ──
  {
    id: 'nl-modal-infinitive',
    priority: 85,
    match: t => /\b(kan|kunt|kunnen|moet|moeten|wil|wilt|willen|mag|mogen|zal|zullen|hoef|hoeft|hoeven)\b/i.test(t) && /\b\w+en\b/i.test(t),
    tips: [
      "Modal verb in position 2, the infinitive jumps to the END: `Ik moet morgen vroeg opstaan`. Same bracket structure as German.",
      "Polite alternative to `willen`: `Ik zou graag…` (I would like…) for soft requests. `Ik wil` can sound demanding.",
    ],
  },

  // ── Separable prefixes ──
  {
    id: 'nl-separable-prefix',
    priority: 90,
    match: t => /\b(sta\s+\w*\s*op|kom\s+\w*\s*aan|kom\s+\w*\s*mee|ga\s+\w*\s*weg|maak\s+\w*\s*schoon|geef\s+\w*\s*op|haal\s+\w*\s*op|bel\s+\w*\s*op|ruim\s+\w*\s*op|zet\s+\w*\s*aan|zet\s+\w*\s*uit)\b/i.test(t),
    tips: [
      "Separable verbs split in main clauses: `opstaan` → `ik sta vroeg op`. The prefix goes to the END. In subordinate clauses, they glue back: `…dat ik vroeg opsta`.",
      "Common prefixes: op-, aan-, uit-, in-, mee-, af-, voor-, na-, om-, terug-. Same idea as German: the prefix marches off when the verb is conjugated.",
    ],
  },

  // ── Er + verb ──
  {
    id: 'nl-er-existential',
    priority: 90,
    match: t => /\ber\s+(is|zijn|was|waren|staat|staan|ligt|liggen|loopt|lopen|komt|komen)\b/i.test(t),
    tips: [
      "`er` has many uses; the most common is existential: `er is`, `er zijn` = 'there is / there are'. Don't try to translate `er` literally — it's just a filler subject.",
      "`er` also pairs with prepositions to replace 'it': `er aan denken` = 'to think of it', `er over praten` = 'to talk about it'. Glue to the start.",
    ],
  },

  // ── Reflexive verbs ──
  {
    id: 'nl-reflexive',
    priority: 85,
    match: t => /\b(me|je|zich|ons)\s+(was|wast|wassen|haast|haasten|herinner|herinneren|voel|voelen|verveel|vervelen|interesseer|amuseer)\b/i.test(t),
    tips: [
      "Reflexive pronouns: me / je / zich / ons / je / zich. `Ik herinner me` (I remember), `hij wast zich` (he washes himself).",
      "Many verbs are reflexive in Dutch but not English: `zich vervelen` (to be bored), `zich haasten` (to hurry). The `zich` form in the dictionary signals you need a pronoun.",
    ],
  },

  // ── Niet vs Geen ──
  {
    id: 'nl-niet-geen',
    priority: 80,
    match: t => /\b(niet|geen|nooit|niets|niemand|nergens)\b/i.test(t),
    tips: [
      "`geen` negates a noun without article: `ik heb geen geld` (I have no money). `Niet` negates everything else: `ik kom niet` (I'm not coming).",
      "If you'd say 'no X' in English, use `geen X` in Dutch. If you'd say 'not X' (verb / adjective / adverb), use `niet`.",
    ],
  },

  // ── Word order: time-manner-place ──
  {
    id: 'nl-tmp-order',
    priority: 60,
    match: t => /\b(morgen|vandaag|gisteren|nu|altijd|vaak|soms)\s+\w+\s+\w+\s+(in|naar|op|bij)\s+\w+/i.test(t),
    tips: [
      "Dutch sentence order: Time → Manner → Place. `Ik ga morgen met de trein naar Amsterdam` (I go tomorrow by train to Amsterdam). English is freer; Dutch wants this sequence.",
    ],
  },

  // ── Subordinating conjunctions push verb to end ──
  {
    id: 'nl-subordinate-verb-end',
    priority: 85,
    match: t => /\b(dat|omdat|als|wanneer|terwijl|hoewel|nadat|voordat|zodat|hoewel)\b/i.test(t),
    tips: [
      "Subordinating conjunctions (`dat`, `omdat`, `als`, `terwijl`, `nadat`) send the verb to the END of the clause: `Ik weet dat hij komt`.",
      "Tricky: `omdat` (because) sends the verb back; `want` (because) does NOT. Same English translation, different word order in Dutch.",
    ],
  },

  // ── De vs Het ──
  {
    id: 'nl-de-het',
    priority: 40,
    match: t => /\b(de|het)\s+\w+\b/i.test(t),
    tips: [
      "Dutch has two genders: `de` (common — about 75% of nouns) and `het` (neuter — about 25%). No reliable rule; learn the article with the noun.",
      "Plural is always `de`: `het kind` (the child) → `de kinderen` (the children). Singular needs you to remember which gender it is.",
    ],
  },

  // ── Possessive ──
  {
    id: 'nl-possessive',
    priority: 50,
    match: t => /\b(mijn|jouw|zijn|haar|onze|ons|jullie|hun)\s+\w+\b/i.test(t),
    tips: [
      "Possessive pronouns: mijn (my), jouw / je (your), zijn (his), haar (her), onze / ons (our), jullie (your pl), hun (their).",
      "`Ons` vs `onze`: `ons` only before `het`-words and singular neuter (`ons huis`); `onze` everywhere else (`onze auto`, `onze kinderen`).",
    ],
  },

  // ── Je / jij vs u (formal/informal you) ─────────────────────────
  {
    id: 'nl-je-u-formal',
    priority: 88,
    match: t => /\b(je|jij|jou|jouw|u|uw|jullie)\b/i.test(t),
    tips: [
      "Dutch has TWO 'you's: `je/jij` (informal — friends, family, peers) and `u` (formal — strangers, elders, business). They use DIFFERENT verb forms: `jij hebt` vs `u hebt` (or `u heeft`).",
      "`Je` (unstressed) vs `jij` (stressed/contrastive) — same word, just emphasis. Possessive: `je/jouw boek` (your book, informal) vs `uw boek` (formal).",
      "Modern Dutch trends toward `je` even with strangers, especially among younger speakers. But in customer service, with older people, or in writing — default to `u`. Belgian Dutch (Flemish) is more formal than Netherlands Dutch.",
      "Plural is always `jullie` (you guys) — no formal plural. Even when addressing a group formally, `jullie` works. For very formal writing only, `u` covers both singular and plural.",
    ],
  },

];
