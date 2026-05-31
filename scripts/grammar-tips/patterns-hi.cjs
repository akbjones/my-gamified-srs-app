/** Hindi grammar-tip patterns */
module.exports = [

  // ── Hai (auxiliary at end) ──
  {
    id: 'hi-hai-auxiliary',
    priority: 80,
    match: t => /\sहै[।!?]?\s*$/i.test(t) || /\sहैं[।!?]?\s*$/i.test(t),
    tips: [
      "Hindi sentences end with the auxiliary `है` (is) or `हैं` (are). Word order: Subject-Object-Verb-Auxiliary. `मैं हिन्दी पढ़ता हूँ` (I learn Hindi) ends with `हूँ` (am).",
      "`है` = is, `हैं` = are/is-honorific. The auxiliary agrees with the subject's number and respect level, not just plural/singular.",
    ],
  },

  // ── करता हूँ / करती हूँ (gender on the participle) ──
  {
    id: 'hi-gender-participle',
    priority: 90,
    match: t => /\s\w+ता\s+हूँ\b/i.test(t) || /\s\w+ती\s+हूँ\b/i.test(t),
    tips: [
      "Hindi verbs agree with the speaker's gender. Men say `करता हूँ` (I do — m), women say `करती हूँ` (I do — f). Same for `जाता/जाती`, `खाता/खाती`. English doesn't gender verbs; Hindi does.",
      "The `-ता` / `-ती` is the gendered participle. `-ते` is the plural/honorific form. Always match it to who's doing the action.",
    ],
  },

  // ── Postpositions instead of prepositions ──
  {
    id: 'hi-postpositions',
    priority: 70,
    match: t => /\s(में|पर|से|को|का|की|के|तक)\s/i.test(t),
    tips: [
      "Hindi uses postpositions, not prepositions: the word for 'in' comes AFTER the noun. `घर में` = 'house in' = 'in the house'. Tape this to your brain: it's backwards from English.",
      "Common postpositions: `में` (in), `पर` (on), `से` (from/by), `को` (to), `तक` (until). Each forces the noun to take its oblique form.",
    ],
  },

  // ── ने marker for ergative past ──
  {
    id: 'hi-ne-ergative',
    priority: 95,
    match: t => /\s(ने|ने\s+\w+)\s/i.test(t) && /\s\w+(ा|ी|े)\s/i.test(t),
    tips: [
      "In Hindi past tense, transitive verbs take `ने` after the subject: `मैंने खाना खाया` (I ate food). The verb then agrees with the OBJECT, not the subject — bizarre for English speakers.",
      "`ने` only on transitive verbs. `मैं गया` (I went — no ne, intransitive) vs `मैंने देखा` (I saw — ne, transitive). This is called ergativity.",
      "If you add `ने`, the verb stops agreeing with you and starts agreeing with what you're doing things to. `मैंने रोटी खाई` (I ate bread — खाई because रोटी is feminine).",
    ],
  },

  // ── को for indirect/specific direct object ──
  {
    id: 'hi-ko-marker',
    priority: 75,
    match: t => /\s\w+\s+को\s/i.test(t),
    tips: [
      "`को` marks specific people, definite direct objects, or indirect objects (to/for someone). `राम को बुलाओ` (call Ram) — specific. `बच्चे को खाना दो` (give the child food) — recipient.",
      "Indefinite objects skip `को`: `एक किताब लाओ` (bring a book) vs `इस किताब को लाओ` (bring this book — specific). The marker indicates definiteness.",
    ],
  },

  // ── Tu / Tum / Aap (formality) ──
  {
    id: 'hi-formality',
    priority: 65,
    match: t => /\b(तू|तुम|आप)\b/i.test(t),
    tips: [
      "Three 'you' forms: `तू` (intimate, kids/lovers/disrespect), `तुम` (informal friends), `आप` (formal/respectful). Wrong one is rude. Default to `आप` with new people.",
      "Each takes a different verb form: `तू है`, `तुम हो`, `आप हैं`. The honorific `आप` uses plural verbs even for one person, like Spanish `usted` with 3rd-person verbs.",
    ],
  },

  // ── रहा है (continuous present) ──
  {
    id: 'hi-continuous',
    priority: 90,
    match: t => /\s\w+\s+रह[ायीे]\s+(हूँ|है|हैं|हो)\b/i.test(t),
    tips: [
      "Continuous tense: verb stem + `रहा/रही/रहे` (gendered) + `है` (auxiliary). `मैं खा रहा हूँ` = I am eating (m). Like English '-ing'.",
      "Watch the gender on `रहा/रही`: men `रहा`, women `रही`, plurals or formal `रहे`. The auxiliary at the end agrees with person.",
    ],
  },

  // ── Future tense (-गा/गी) ──
  {
    id: 'hi-future-tense',
    priority: 90,
    match: t => /\s\w+(ूँगा|ूँगी|ोगे|ोगी|एगा|एगी|एंगे)\b/i.test(t),
    tips: [
      "Future tense glues a gender-aware ending: m -गा, f -गी, plural -गे. `मैं जाऊँगा` (I will go — m), `मैं जाऊँगी` (I will go — f). Same person, different ending by gender.",
      "Quick formula: verb stem + person ending + ga/gi/ge. `करूँगा` = कर (do) + ूँ (I) + गा (m future). Three layers in one suffix.",
    ],
  },

  // ── Adjective gender agreement ──
  {
    id: 'hi-adjective-agreement',
    priority: 70,
    match: t => /\s(अच्छ[ायीे]|बड़[ायीे]|छोट[ायीे]|पुरान[ायीे]|नय[ायीे])\b/i.test(t),
    tips: [
      "Hindi adjectives ending in -ा change with the noun: -ा (m sg), -ी (f), -े (m pl / oblique). `अच्छा लड़का` (good boy) → `अच्छी लड़की` (good girl) → `अच्छे लड़के` (good boys).",
      "Only -ा ending adjectives change. Words like `सुंदर` (beautiful), `लाल` (red) stay invariable. Look at the dictionary form to know if you'll need to inflect.",
    ],
  },

  // ── Honorific plural ──
  {
    id: 'hi-honorific-plural',
    priority: 60,
    match: t => /\s(पिताजी|माताजी|दादीजी|गुरुजी|भैया|दीदी)\b/i.test(t),
    tips: [
      "Adding `जी` shows respect. Family terms get extra honorifics: `पिताजी` (respected father), `माताजी` (respected mother). Use these forms with elders and in formal contexts.",
      "Even when talking about one respected person, use plural verbs: `पिताजी आए हैं` (father has come — plural verb on a single father out of respect).",
    ],
  },

  // ── Compound verbs (X करना) ──
  {
    id: 'hi-compound-karna',
    priority: 65,
    match: t => /\s\w+\s+(करना|करता|करती|करते|किया|की|किए|करूँगा|करूँगी)\b/i.test(t),
    tips: [
      "Compound verbs use a noun/adj + `करना` (to do): `इंतज़ार करना` (to wait), `मदद करना` (to help), `बात करना` (to talk). The `करना` carries tense and agreement.",
      "Easier than memorizing single verbs: most English actions become a noun + `करना` in Hindi. `Phone करना` (to phone), `try करना` — works for English loanwords too.",
    ],
  },

  // ── Sirf/Bhi/Hi particles ──
  {
    id: 'hi-emphasis-particles',
    priority: 55,
    match: t => /\s(सिर्फ|भी|ही|तो)\s/i.test(t),
    tips: [
      "Tiny words carry emphasis: `भी` (also), `ही` (only/exactly), `सिर्फ` (just), `तो` (well/then). Position matters — they usually follow the word they emphasize.",
      "`मैं भी जाऊँगा` (I'll go too) — `भी` after the subject. `मैं ही जाऊँगा` (I'll go — only me) — `ही` makes 'I' exclusive. Subtle shifts of meaning.",
    ],
  },

];
