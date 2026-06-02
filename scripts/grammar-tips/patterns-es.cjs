/**
 * Spanish grammar-tip patterns.
 *
 * Style guide for tips:
 *   - First-person "you tend to do X in English; here's the Spanish twist"
 *   - One concrete takeaway per tip, no academic notation
 *   - Mention the exact word/construction from the card when possible
 *   - 2-4 tip variants per pattern so different cards aren't identical
 */
module.exports = [

  // ── Por vs Para ─────────────────────────────────────────────────────
  {
    id: 'es-por-vs-para',
    priority: 90,
    match: t => /\bpor\b/i.test(t) || /\bpara\b/i.test(t),
    tips: [
      "Quick rule: `para` = destination or purpose (it's FOR him, in order TO eat). `por` = reason or exchange (BECAUSE of him, FOR ten euros). When in doubt ask 'why?' (por) or 'what for?' (para).",
      "`por` and `para` both translate as 'for' but never overlap: `por` looks backwards (cause), `para` looks forwards (goal). Mix them up and you'll say the opposite of what you mean.",
      "`para` is about endpoint and intent — destination, deadline, recipient. `por` is about cause, exchange, route, duration. English uses 'for' / 'by' / 'through' across both.",
    ],
  },

  // ── Ser vs Estar ────────────────────────────────────────────────────
  {
    id: 'es-ser-vs-estar',
    priority: 95,
    match: t => /\b(soy|eres|es|somos|sois|son)\b/i.test(t) && /\b(estoy|estás|está|estamos|estáis|están)\b/i.test(t),
    tips: [
      "`ser` and `estar` both = 'to be'. Rule of thumb: `ser` for identity and unchanging traits (es médico), `estar` for current condition or location (está cansado, está en casa).",
    ],
  },
  {
    id: 'es-estar-condition',
    priority: 75,
    match: t => /\b(estoy|estás|está|estamos|están)\b/i.test(t),
    tips: [
      "`estar` for how you ARE right now — mood, health, location, temporary state. Wrong: `soy cansado` (= I'm a tired *person*). Right: `estoy cansado` (= I'm tired *today*).",
      "Use `estar` when the answer could change tomorrow: location, feelings, ongoing actions. `estar + adjective` = it's a state, not a label.",
      "`está` covers 'is feeling / is located / is currently'. If the next word is a place or a temporary adjective, you almost always want `estar`.",
    ],
  },
  {
    id: 'es-ser-identity',
    priority: 70,
    match: t => /\b(soy|eres|es|somos|son)\b\s+(un|una|el|la|los|las|mi|tu|su)?\s*[a-záéíóúñ]+/i.test(t),
    tips: [
      "`ser` for what something IS, permanently — nationality, profession, day of the week, time, defining trait. `Es médico`, `es lunes`, `son las tres`.",
      "If you can replace 'is' with 'equals' in English, use `ser`. `Es importante` = importance equals this. With temporary descriptions you'd flip to `estar`.",
      "`ser` declares identity — the unchanging label of a person, object, or fact. Use it for permanence; reach for `estar` when it could change.",
    ],
  },

  // ── Gustar-family ───────────────────────────────────────────────────
  {
    id: 'es-gustar-construction',
    priority: 100,
    match: t => /\b(me|te|le|nos|os|les)\s+(gusta|gustan|encanta|encantan|interesa|interesan|importa|importan|duele|duelen|falta|faltan)\b/i.test(t),
    tips: [
      "`gustar` is backwards from English: the thing that pleases is the subject, not the person. `Me gusta la pizza` literally = 'pizza pleases me'. Plural thing? Use plural verb: `me gustan los libros`.",
      "Think 'X pleases me' for `me gusta X`. If X is plural, the verb agrees: `me gustan`. Same pattern with `encantar` (loves), `interesar` (interests), `doler` (hurts).",
      "Don't say `yo gusto la pizza` — that means 'I am pleasing to pizza'. The Spanish flips: pizza is doing the pleasing. Match the verb to the thing, not to you.",
    ],
  },

  // ── Reflexive verbs ──────────────────────────────────────────────────
  {
    id: 'es-reflexive',
    priority: 85,
    match: t => /\b(me|te|se|nos|os)\s+[a-záéíóúñ]+(?:o|as|a|amos|áis|an|í|aste|ó|amos|asteis|aron|ía|ías|íamos|íais|ían)\b/i.test(t),
    tips: [
      "Reflexive verbs use a pronoun (me/te/se/nos/os/se) before the verb. `Me llamo` = 'I call myself' = 'My name is'. The pronoun matches the subject — it's not optional.",
      "The `se` in `se llama` / `se ducha` isn't decorative — it's the marker that the action loops back on the subject. Skip it and the sentence breaks.",
      "Reflexive isn't always literal in English: `acordarse` = to remember, `quejarse` = to complain. If the dictionary entry ends in -se, you need a matching pronoun.",
    ],
  },

  // ── Tener for sensations ────────────────────────────────────────────
  {
    id: 'es-tener-sensation',
    priority: 95,
    match: t => /\b(tengo|tienes|tiene|tenemos|tenéis|tienen)\s+(hambre|sed|frío|calor|sueño|miedo|prisa|razón|suerte|vergüenza|años)\b/i.test(t),
    tips: [
      "Spanish says 'I have hunger' (`tengo hambre`), not 'I am hungry'. Same family: `tengo sed` (thirsty), `tengo frío` (cold), `tengo miedo` (afraid). 'I am' would mean you ARE hunger itself.",
      "Sensations and age all use `tener`: `tengo 25 años` = 'I have 25 years'. English uses 'be', Spanish uses 'have'. Saying `soy 25 años` makes no sense in Spanish.",
      "Watch for these: hambre, sed, sueño, frío, calor, miedo, prisa, suerte, razón. All take `tener`, not `ser/estar`. Easy trap when translating from English.",
    ],
  },

  // ── Hay (existential) ──────────────────────────────────────────────
  {
    id: 'es-hay',
    priority: 80,
    match: t => /\bhay\b/i.test(t),
    tips: [
      "`hay` = 'there is / there are'. It doesn't change for plural: `hay un libro` AND `hay tres libros`. Different verb than `tener` (to have). One word, no conjugation.",
      "Don't confuse `hay` (there is) with `ahí` (over there) or `ay` (ouch). `Hay` is the impersonal form of `haber` and never gets a subject.",
    ],
  },

  // ── Ir a + infinitive (future) ──────────────────────────────────────
  {
    id: 'es-ir-a-future',
    priority: 90,
    match: t => /\b(voy|vas|va|vamos|vais|van)\s+a\s+[a-záéíóúñ]+(?:ar|er|ir)\b/i.test(t),
    tips: [
      "`ir a + infinitive` = the casual future, like English 'going to'. `Voy a comer` = 'I'm going to eat'. Way more common in speech than the textbook future tense.",
      "Three pieces: form of `ir`, then `a`, then the dictionary form of the verb. Skip the `a` and the sentence breaks. Easier than learning future-tense endings.",
    ],
  },

  // ── Hacer (weather + time) ──────────────────────────────────────────
  {
    id: 'es-hace-weather-time',
    priority: 95,
    match: t => /\bhace\s+(frío|calor|sol|viento|fresco|buen|mal|años?|meses?|horas?|días?|semanas?)\b/i.test(t),
    tips: [
      "Spanish says 'it makes cold' for weather: `hace frío`, `hace calor`, `hace sol`. English uses 'it is'; Spanish doesn't. Saying `es frío` would mean something is *made of* cold.",
      "`hace` + time = 'ago': `hace dos años` = 'two years ago'. Same word for weather AND time-elapsed. Context decides.",
    ],
  },

  // ── Direct object pronouns lo/la/los/las ────────────────────────────
  {
    id: 'es-direct-object-pronoun',
    priority: 70,
    match: t => /(^|\s)(lo|la|los|las)\s+(veo|ves|ve|vemos|veis|ven|tengo|tienes|tiene|tomo|tomas|toma|miro|miras|mira|leo|lee|compro|compra|conozco)\b/i.test(t),
    tips: [
      "Object pronouns sit BEFORE the verb in Spanish: `lo veo` (I see it), not `veo lo`. The pronoun replaces the noun and matches its gender/number — lo (m), la (f), los (mp), las (fp).",
      "`lo/la/los/las` are 'it / them' — used when you don't repeat the noun. `Tengo el libro → lo tengo` (I have it). Before the verb, never after.",
    ],
  },

  // ── Indirect object pronouns le/les ─────────────────────────────────
  {
    id: 'es-indirect-object',
    priority: 65,
    match: t => /\ble\s+(doy|das|da|damos|dais|dan|digo|dices|dice|escribo|escribes|escribe|pregunto)\b/i.test(t),
    tips: [
      "`le` = 'to him/her/you-formal', `les` = 'to them/you-plural'. Indirect object — the recipient. `Le doy el libro` = 'I give the book to him/her'.",
      "Spanish often doubles up the recipient: `le doy el libro a María`. The `le` and `a María` BOTH say 'to María' — it's redundant by English standards but standard in Spanish.",
    ],
  },

  // ── Preterite vs Imperfect (past contrast) ──────────────────────────
  {
    id: 'es-preterite-action',
    priority: 60,
    match: t => /\b[a-záéíóúñ]+(é|aste|ó|amos|asteis|aron|í|iste|ió|imos|isteis|ieron)\b/i.test(t) && !/\bía|ías|íamos|íais|ían\b/i.test(t),
    tips: [
      "Preterite for completed past actions with a clear start/end: `comí pizza ayer` (I ate pizza yesterday). If you can pin it to a moment, use preterite.",
      "Endings `-é/-aste/-ó/-amos/-asteis/-aron` (for -ar) and `-í/-iste/-ió/-imos/-isteis/-ieron` (for -er/-ir) signal preterite. One discrete event in the past.",
      "Preterite frames the action as a unit: it started, it ended, it's done. Contrast with imperfect (-aba, -ía) which paints background or repetition.",
    ],
  },
  {
    id: 'es-imperfect-background',
    priority: 60,
    match: t => /\b[a-záéíóúñ]+(aba|abas|ábamos|abais|aban|ía|ías|íamos|íais|ían)\b/i.test(t),
    tips: [
      "Imperfect (`-aba/-ía` endings) paints background or habit: `de niño jugaba al fútbol` (as a kid I used to play football). No clear start or end.",
      "Use imperfect when describing what was going on, what used to happen, weather, age, or feelings in the past. `Era`, `tenía`, `hacía`. Background, not events.",
      "If you'd say 'used to' or 'was -ing' in English, Spanish wants imperfect. Preterite is for the single completed event that interrupts that background.",
    ],
  },

  // ── Subjunctive triggers ────────────────────────────────────────────
  {
    id: 'es-subjunctive-que',
    priority: 100,
    match: t => /\b(quiero|quieres|quiere|queremos|esperamos|espero|dudo|dudamos|temo|es\s+importante|es\s+necesario|es\s+posible)\s+que\s+/i.test(t),
    tips: [
      "After expressions of wish/doubt/emotion + `que`, Spanish switches to subjunctive. `Quiero que vengas` (not vienes) = 'I want you to come'. The wanting is real; the coming is hypothetical.",
      "Trigger phrase + `que` + subjunctive: `espero que tengas`, `es importante que sepas`. The first verb is real, the second is uncertain. Stem with -er/-ir verbs flips to -a; -ar verbs flip to -e.",
      "Subjunctive after `que` whenever the main clause expresses wanting, hoping, fearing, doubting, or judging importance. The endings (-e instead of -a, -a instead of -e) are the giveaway.",
    ],
  },
  {
    id: 'es-subjunctive-impersonal',
    priority: 95,
    match: t => /\bes\s+(bueno|malo|raro|extraño|posible|imposible|necesario|importante|mejor|peor)\s+que\b/i.test(t),
    tips: [
      "`Es + adjective + que` triggers subjunctive on the next verb: `es importante que sepas` (it's important that you know). Hypothetical situation, even if it sounds like a fact.",
      "Personal opinions framed as facts still use subjunctive: `es raro que diga eso` (it's strange that he says that). The strangeness is the speaker's reaction, not a neutral observation.",
    ],
  },

  // ── Diminutives -ito / -ita ─────────────────────────────────────────
  {
    id: 'es-diminutive',
    priority: 50,
    match: t => /\b[a-záéíóúñ]+(ito|ita|itos|itas|ico|ica|illo|illa)\b/i.test(t),
    tips: [
      "Diminutive suffixes (-ito/-ita) add 'small / cute / affectionate' — not always literal size. `Mi gatito` = 'my (dear little) cat'. Spanish uses these way more than English.",
      "`-ito` softens the word emotionally too: `un momentito` = 'just a sec', `cafecito` = 'a little coffee' (or a sweet way to say coffee). It's tone, not measurement.",
    ],
  },

  // ── Comparatives ────────────────────────────────────────────────────
  {
    id: 'es-comparative',
    priority: 65,
    match: t => /\b(más|menos)\s+\w+\s+que\b/i.test(t),
    tips: [
      "`más X que Y` = 'more X than Y', `menos X que Y` = 'less X than Y'. Use `que` (not `de`) before the thing you're comparing to.",
      "Switch `que` to `de` only when comparing with a number: `más de cinco` (more than five). With everything else: `que`.",
    ],
  },
  {
    id: 'es-tan-como',
    priority: 70,
    match: t => /\btan\s+\w+\s+como\b/i.test(t),
    tips: [
      "`tan X como Y` = 'as X as Y' — equal comparison. `Tan alto como tú` = 'as tall as you'. Don't substitute `que` here.",
    ],
  },

  // ── Negation patterns (no...nada, no...nunca) ───────────────────────
  {
    id: 'es-double-negative',
    priority: 75,
    match: t => /\bno\s+\w+\s+(nada|nunca|nadie|ningún|ninguna|ningunos|ningunas|jamás|tampoco)\b/i.test(t),
    tips: [
      "Spanish requires double negatives: `no como nada` = 'I don't eat anything'. English drops the second one; Spanish needs both. `Como nada` would mean 'I eat nothing' (rare and emphatic).",
      "When a negative word comes after the verb, `no` goes before it. `No vi a nadie`, `nunca lo hago`. Two negatives don't cancel — they reinforce.",
    ],
  },

  // ── Personal "a" before direct object ────────────────────────────────
  {
    id: 'es-personal-a',
    priority: 70,
    match: t => /\b(veo|ves|ve|visito|visitas|conozco|conoces|llamo|llamas|busco|escucho|invito|invitas|saludo|saludas|ayudo|ayudas|amo|amas|odio)\s+a\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+/i.test(t),
    tips: [
      "Before a person, Spanish inserts `a` even when no preposition is needed in English: `veo a María` = 'I see María'. This `a` has no English translation — it just marks the person as a direct object.",
      "Personal `a`: required before specific people, pets, or personified things. `Conozco a Juan` (yes) but `conozco la ciudad` (no, ciudad isn't a person).",
    ],
  },

  // ── Acabar de + infinitive (just did X) ─────────────────────────────
  {
    id: 'es-acabar-de',
    priority: 90,
    match: t => /\bacab[ao][a-z]*\s+de\s+[a-záéíóúñ]+(ar|er|ir)\b/i.test(t),
    tips: [
      "`acabar de + infinitive` = 'to have just done X'. `Acabo de comer` = 'I've just eaten'. Despite the English perfect tense, Spanish uses present.",
      "Don't translate literally — `acabar` here doesn't mean 'finish'. The whole phrase means 'just (now) did'. Tight pairing of immediacy.",
    ],
  },

  // ── Subject pronoun drop ────────────────────────────────────────────
  {
    id: 'es-skip-subject',
    priority: 30,
    match: t => /^\s*(?:yo|tú|él|ella|usted|nosotros|nosotras|vosotros|vosotras|ellos|ellas|ustedes)\s+/i.test(t),
    tips: [
      "Spanish usually skips subject pronouns — `como pizza` already means 'I eat pizza'. Adding `yo` (yo como pizza) signals emphasis or contrast, like saying 'I'M the one eating'.",
      "Subject pronouns are optional in Spanish: the verb ending tells you who. Native speakers drop them unless they're contrasting (I, not him) or clarifying.",
    ],
  },

  // ── Conmigo / contigo (irregular pronoun forms) ─────────────────────
  {
    id: 'es-conmigo-contigo',
    priority: 95,
    match: t => /\b(conmigo|contigo|consigo)\b/i.test(t),
    tips: [
      "`con + mí → conmigo`, `con + ti → contigo`, `con + sí → consigo`. Spanish glues 'with' onto these pronouns instead of writing them apart. Only these three contract.",
    ],
  },

  // ── Formal vs informal "you" — 3sg verbs double for usted ──────────
  // Fires on common verb forms that hide this duality: puede = he/she can
  // OR you (formal) can; puedes is only ever informal you.
  {
    id: 'es-formal-informal-you',
    priority: 88,
    match: t => /\b(puede|puedes|tiene|tienes|quiere|quieres|sabe|sabes|habla|hablas|come|comes|vive|vives|trabaja|trabajas|hace|haces|va|vas|viene|vienes|piensa|piensas|necesita|necesitas|cree|crees|debe|debes|está|estás)\b/i.test(t),
    tips: [
      "Spanish has TWO 'you's: `tú` (informal — friends, family, kids) and `usted` (formal — strangers, elders, work). They use DIFFERENT verb forms. `Tú puedes` but `usted puede` — same form as él/ella.",
      "If you see `puede`, it could mean 'he/she can' OR 'you (formal) can'. Context decides. The form `puedes` is unambiguous — always informal you. Spanish reuses 3rd-person verbs for the formal you.",
      "Default to `tú` with peers, `usted` when meeting someone older or in business. Latin Americans use `usted` more readily than Spaniards. Wrong tú can sound rude; wrong usted is just polite.",
      "Spain has a third pronoun: `vosotros` (you all, informal) with its own endings (-áis/-éis). Latin America uses `ustedes` for everyone plural. The `tú/usted` distinction is universal.",
    ],
  },

];
