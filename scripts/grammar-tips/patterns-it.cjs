/** Italian grammar-tip patterns — same shape as patterns-es.cjs */
module.exports = [

  // ── Piacere (gustar's twin) ──
  {
    id: 'it-piacere-construction',
    priority: 100,
    match: t => /\b(mi|ti|gli|le|ci|vi)\s+(piace|piacciono)\b/i.test(t),
    tips: [
      "`piacere` works backwards from English: the thing that pleases is the subject. `Mi piace la pizza` literally = 'pizza is pleasing to me'. Plural thing? Use `piacciono`: `mi piacciono i libri`.",
      "Don't say `io piaccio la pizza` — that means 'I'm pleasing to pizza'. The Italian flips: pizza does the pleasing. Match the verb to the thing, not to you.",
      "Same trap as Spanish `gustar`. `Piace` for singular, `piacciono` for plural. The 'liker' becomes the indirect object (mi/ti/gli/le/ci/vi).",
    ],
  },

  // ── Skip subject pronouns ──
  {
    id: 'it-skip-subject',
    priority: 35,
    match: t => /^\s*(io|tu|lui|lei|noi|voi|loro)\s+/i.test(t),
    tips: [
      "Italians drop subject pronouns — `mangio la pasta` already means 'I eat pasta'. Saying `io mangio la pasta` adds emphasis, like 'ME, I eat pasta'. Don't sprinkle io/tu around unless contrasting.",
      "The verb ending tells you who: `mangio` (I), `mangi` (you), `mangia` (he/she). Subject pronouns are for emphasis or clarity, not the default.",
    ],
  },

  // ── Essere vs Stare ──
  {
    id: 'it-essere-vs-stare',
    priority: 90,
    match: t => /\b(sono|sei|è|siamo|siete)\b/i.test(t) && /\b(sto|stai|sta|stiamo|state|stanno)\b/i.test(t),
    tips: [
      "`essere` = to be in general; `stare` = to feel/stay/be located, used for temporary states. `Sono italiano` (I am Italian — identity) vs `sto bene` (I am fine — state).",
    ],
  },
  {
    id: 'it-stare-state',
    priority: 80,
    match: t => /\b(sto|stai|sta|stiamo|state|stanno)\s+(bene|male|meglio|peggio|attento|attenta|zitto|zitta|tranquillo)\b/i.test(t),
    tips: [
      "`stare` for how you ARE right now: `come stai?` (how are you?), `sto bene` (I'm fine). With permanent traits switch to `essere`.",
      "Health, mood, brief states → `stare`. `Sto male` = I'm not feeling well (today). `Sono malato` = I'm ill (a condition).",
    ],
  },

  // ── Stare + gerundio (continuous) ──
  {
    id: 'it-stare-gerundio',
    priority: 95,
    match: t => /\b(sto|stai|sta|stiamo|state|stanno)\s+\w+(ando|endo)\b/i.test(t),
    tips: [
      "`stare + gerundio` = English '-ing now': `sto mangiando` = 'I'm eating (right now)'. Italian uses it less than English — bare present often does the job.",
      "Only use `stare + -ando/-endo` for emphasis on 'this very moment'. `Mangio adesso` and `sto mangiando adesso` both work; the gerundio adds 'in progress'.",
    ],
  },

  // ── Passato prossimo (avere/essere + p.p.) ──
  {
    id: 'it-passato-essere',
    priority: 95,
    match: t => /\b(sono|sei|è|siamo|siete|sono)\s+(andat[oai]|arrivat[oai]|partit[oai]|tornat[oai]|nat[oai]|mort[oai]|venuto|venuta|venuti|venute|stat[oai])\b/i.test(t),
    tips: [
      "Past tense with movement/change verbs uses `essere`: `sono andato` (I went), `è arrivata` (she arrived). The participle agrees with the subject: -o/-a/-i/-e.",
      "Auxiliary `essere` triggers agreement: a woman says `sono andata`, men say `sono andato`. With `avere` no agreement (almost ever).",
      "Movement and change verbs (andare, venire, partire, nascere, morire, diventare, stare) take `essere` in past. Most others take `avere`.",
    ],
  },
  {
    id: 'it-passato-avere',
    priority: 80,
    match: t => /\b(ho|hai|ha|abbiamo|avete|hanno)\s+\w+(ato|uto|ito)\b/i.test(t),
    tips: [
      "Passato prossimo = `avere/essere` + past participle. Most verbs use `avere`: `ho mangiato`, `ha visto`, `hanno detto`. No agreement on the participle.",
      "Regular endings: -are → -ato, -ere → -uto, -ire → -ito. Irregular ones (fatto, detto, preso, letto…) need to be learnt one by one.",
    ],
  },

  // ── Avere for sensations + age ──
  {
    id: 'it-avere-sensation',
    priority: 95,
    match: t => /\b(ho|hai|ha|abbiamo|avete|hanno)\s+(fame|sete|freddo|caldo|sonno|paura|fretta|ragione|torto|anni)\b/i.test(t),
    tips: [
      "Italian says 'I have hunger' (`ho fame`), not 'I am hungry'. Same with `ho sete`, `ho freddo`, `ho paura`, `ho 30 anni`. English uses 'be', Italian uses 'have'.",
      "These all take `avere`: fame, sete, sonno, freddo, caldo, paura, fretta, ragione, torto, voglia, anni. Saying `sono fame` is wrong — you'd be hunger itself.",
    ],
  },

  // ── Reflexive verbs ──
  {
    id: 'it-reflexive',
    priority: 85,
    match: t => /\b(mi|ti|si|ci|vi)\s+(chiamo|chiami|chiama|chiamiamo|chiamate|chiamano|alzo|alzi|alza|sveglio|svegli|sveglia|lavo|lavi|lava|preparo|prepari|prepara|vesto|vesti|veste)\b/i.test(t),
    tips: [
      "Reflexive verbs need a pronoun: `mi chiamo` (I call myself = my name is), `si lava` (he washes himself). The pronoun matches the subject — mi/ti/si/ci/vi/si.",
      "Reflexive isn't always literal in English: `ricordarsi` = to remember, `arrabbiarsi` = to get angry. If the dictionary form ends in -si, you need the matching pronoun.",
      "In compound tenses, reflexives ALWAYS take `essere` and the participle agrees: `mi sono lavato/lavata` depending on gender.",
    ],
  },

  // ── C'è / Ci sono (there is/are) ──
  {
    id: 'it-cè-ci-sono',
    priority: 95,
    match: t => /\b(c'è|ci\s+sono|c'era|c'erano|ci\s+sarà|ci\s+saranno)\b/i.test(t),
    tips: [
      "`c'è` for singular ('there is'), `ci sono` for plural ('there are'). `C'è una mela` vs `ci sono due mele`. Match the verb to the thing that exists.",
      "Don't say `c'è due mele` — once you go plural, you need `ci sono`. Past tense: `c'era / c'erano`. Future: `ci sarà / ci saranno`.",
    ],
  },

  // ── Bisogna / È necessario + che + subjunctive ──
  {
    id: 'it-subjunctive-trigger',
    priority: 100,
    match: t => /\b(voglio|vuoi|vuole|spero|speriamo|credo|non\s+credo|dubito|temo|bisogna|è\s+necessario|è\s+importante|è\s+possibile)\s+che\b/i.test(t),
    tips: [
      "After expressions of wish/doubt/opinion + `che`, Italian uses subjunctive (congiuntivo). `Voglio che tu venga` (not vieni) = 'I want you to come'.",
      "`Credo che sia` not `credo che è` — opinion verbs trigger congiuntivo. The endings: -are → -i/-i/-i/-iamo/-iate/-ino. -ere/-ire → -a/-a/-a/-iamo/-iate/-ano.",
      "`È necessario che`, `bisogna che`, `è importante che` → next verb in congiuntivo. The trigger phrase is real, the action is hypothetical.",
    ],
  },

  // ── Modal verbs (dovere, potere, volere) ──
  {
    id: 'it-modal-infinitive',
    priority: 80,
    match: t => /\b(devo|devi|deve|dobbiamo|dovete|devono|posso|puoi|può|possiamo|potete|possono|voglio|vuoi|vuole|vogliamo|volete|vogliono)\s+[a-zàèéìòù]+(are|ere|ire)\b/i.test(t),
    tips: [
      "Modal verbs (dovere, potere, volere) attach directly to the infinitive: `devo studiare`, `posso aiutare`, `voglio mangiare`. No preposition needed — unlike English's clunkier 'have to' / 'be able to'.",
      "If a reflexive verb follows a modal, the pronoun can sit before the modal OR attach to the infinitive: `mi devo alzare` = `devo alzarmi`. Both valid; sound the same.",
    ],
  },

  // ── Pronomi (object pronouns lo, la, li, le, mi, ti, ci, vi) ──
  {
    id: 'it-object-pronoun',
    priority: 60,
    match: t => /(^|\s)(lo|la|li|le|mi|ti|ci|vi)\s+(vedo|vedi|vede|vediamo|vedete|vedono|conosco|conosci|conosce|leggo|leggi|legge|prendo|prendi|prende|aspetto|aspetti|aspetta)\b/i.test(t),
    tips: [
      "Object pronouns sit BEFORE the verb: `lo vedo` (I see him/it), not `vedo lo`. Lo/la/li/le match gender and number of what they replace.",
      "Pronoun + verb is glued tight: `non lo conosco` (I don't know him). The pronoun never floats free.",
    ],
  },

  // ── Tu vs Lei (formal you) ──
  {
    id: 'it-formal-lei',
    priority: 70,
    match: t => /\bLei\s+(è|ha|può|deve|vuole|sa|conosce|parla|capisce)\b/.test(t),
    tips: [
      "Capital `Lei` = formal 'you' (singular). It uses 3rd-person singular verbs: `Lei è italiano?` = 'Are you (formal) Italian?'. Sounds like 'she' but means 'you'.",
      "Use `Lei` with people you don't know, in business, or with older folks. With friends and family, switch to `tu`. The verb changes too: `Lei viene / tu vieni`.",
    ],
  },

  // ── Da + time (since/for) ──
  {
    id: 'it-da-time',
    priority: 75,
    match: t => /\bda\s+\d+\s+(minuti|ore|giorni|settimane|mesi|anni)\b/i.test(t),
    tips: [
      "`da + time` = 'for' / 'since' with present tense: `vivo a Roma da tre anni` = 'I've been living in Rome for three years'. Italian uses present where English uses present perfect.",
      "Counterintuitive for English speakers: ongoing action → present tense + `da`. NOT past tense. `Studio italiano da un anno`, not `ho studiato`.",
    ],
  },

  // ── Ci (locative + replacement) ──
  {
    id: 'it-ci-locative',
    priority: 65,
    match: t => /\bci\s+(vado|vai|va|andiamo|andate|vanno|sono|sei|è|siamo|siete|sono)\b/i.test(t),
    tips: [
      "`ci` = 'there' (replacing a place). `Vai al cinema? Sì, ci vado` (Yes, I go there). Saves repeating the location.",
      "`ci` also gets glued to other constructions: `ci sono` (there is), `ci credo` (I believe in it). It's the small word doing a lot of work.",
    ],
  },

  // ── Diminutives -ino/-ina, -etto/-etta ──
  {
    id: 'it-diminutive',
    priority: 50,
    match: t => /\b[a-zàèéìòù]+(ino|ina|ini|ine|etto|etta|etti|ette)\b/i.test(t),
    tips: [
      "Italian diminutives (-ino/-etta etc.) often signal affection rather than literal smallness: `un caffettino` = 'a (nice little) coffee'. Cute, friendly tone.",
      "Diminutives change words too: `tavolo` (table) → `tavolino` (small table or coffee table), `un attimo` → `un attimino` (just a moment, friendlier).",
    ],
  },

  // ── Gender on inanimate nouns ───────────────────────────────────
  {
    id: 'it-gender-arbitrary',
    priority: 45,
    match: t => /(^|\s)(il|la|lo|i|le|gli|l'|un|una|un'|uno)\s*[a-zàèéìòù]+/i.test(t),
    tips: [
      "Italian nouns have GENDER: `il libro` (m), `la casa` (f). Arbitrary on objects — `la macchina` (the car) is feminine for no logical reason. Always learn nouns WITH their article.",
      "Endings hint at gender: `-o` usually masc (`il libro`), `-a` usually fem (`la casa`). But: `la mano` is feminine, `il problema` is masculine. The article tells you the truth.",
      "Three masculine articles depending on what follows: `il` (before consonant), `lo` (before s+consonant, gn, pn, ps, z, x), `l'` (before vowel). Plural: `i` and `gli`. Feminine simpler: `la`/`l'`/`le`.",
      "Plural: `-o → -i` (libro → libri, m), `-a → -e` (casa → case, f). Adjectives agree: `un bel libro`, `una bella casa`, `i bei libri`, `le belle case`.",
    ],
  },

];
