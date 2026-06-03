/** Portuguese (BR) grammar-tip patterns */
module.exports = [

  // ── Estar com + sensation ──
  {
    id: 'pt-estar-com-sensation',
    priority: 100,
    match: t => /\b(estou|está|estamos|estão|estive|esteve|estávamos|estavam)\s+com\s+(fome|sede|sono|frio|calor|medo|pressa|raiva|saudade)\b/i.test(t),
    tips: [
      "Portuguese says 'I am with hunger' (`estou com fome`) – different from Spanish (`tengo`) and French (`j'ai faim`). Same structure for `estou com sede` (thirsty), `estou com pressa` (in a hurry).",
      "Sensations use `estar com` + noun, not `ter`. `Tenho fome` exists but Brazilians prefer `estou com fome`. The `com` makes it about the temporary state, not possession.",
      "Watch: fome, sede, sono, frio, calor, medo, pressa, raiva, saudade – all take `estar com` in BR. Direct translation 'I am hungry' (`sou faminto`) sounds bizarre.",
    ],
  },

  // ── A gente (informal we) ──
  {
    id: 'pt-a-gente',
    priority: 95,
    match: t => /\ba\s+gente\b/i.test(t),
    tips: [
      "`a gente` (literally 'the people') = informal `nós` (we). Conjugates as 3rd singular: `a gente vai`, NOT `a gente vamos`. Brazilians use this constantly.",
      "If `a gente` confuses you: think of it as 'us folks'. Singular verb form, plural meaning. `A gente quer pizza` = 'we want pizza'.",
    ],
  },

  // ── Você as default 'you' ──
  {
    id: 'pt-voce-default',
    priority: 60,
    match: t => /\bvocê\b/i.test(t),
    tips: [
      "In Brazil, `você` is the default 'you' – even for friends and family. `Tu` exists but is regional (mostly the South). Use `você` everywhere and you're safe.",
      "`Você` conjugates as 3rd singular (like `ele/ela`): `você é`, `você tem`, `você fala`. Don't try to use the `tu` forms unless you're learning European Portuguese.",
    ],
  },

  // ── Ser vs Estar (PT) ──
  {
    id: 'pt-ser-estar',
    priority: 90,
    match: t => /\b(sou|é|somos|são)\b/i.test(t) && /\b(estou|está|estamos|estão)\b/i.test(t),
    tips: [
      "`ser` for identity and permanence (sou brasileiro, é importante). `Estar` for state, location, temporary condition (estou cansado, está em casa).",
    ],
  },
  {
    id: 'pt-estar-condition',
    priority: 75,
    match: t => /\b(estou|está|estamos|estão)\s+(cansad[oa]|feliz|triste|nervoso[a]?|brav[oa]|alegre|ocupad[oa]|preocupad[oa]|doente)\b/i.test(t),
    tips: [
      "`estar` for how you ARE right now – mood, health, location, temporary state. Wrong: `sou cansado` (I'm a tired *person*). Right: `estou cansado` (I'm tired *today*).",
      "If the state could change tomorrow → `estar`. Permanent traits → `ser`. `Ele é nervoso` = he's a nervous type (always). `Ele está nervoso` = he's nervous right now.",
    ],
  },

  // ── Crase à ──
  {
    id: 'pt-crase',
    priority: 95,
    match: t => /\bà\s+(escola|igreja|festa|casa|cidade|praia|noite|tarde|manhã|aula|consulta|reunião|loja|farmácia)\b/i.test(t),
    tips: [
      "`à` is the famous `crase` – contraction of `a + a` (to the, feminine). `Vou à escola` = `vou a + a escola`. Watch for the grave accent – that's how you spot it.",
      "Crase only happens before feminine words. `Vou ao cinema` (masc) keeps `ao`. `Vou à praia` (fem) gets `à` with the accent.",
    ],
  },

  // ── Pretérito perfeito (simple past) ──
  // \b is ASCII-only; uses lookaround + min stem so it doesn't false-match
  // common -i / -ou nouns (like "favoritou" doesn't exist, but "carlou" might).
  {
    id: 'pt-preterito-perfeito',
    priority: 75,
    match: t => {
      // Regular preterite endings – restrictive: require 2+ letter stem
      if (/(?<![a-záéíóúâêîôûãõç])[a-záéíóúâêîôûãõç]{2,}(?:aste|astes|aram|este|estes|eram|iste|istes|iram|iu|eu|ou)(?![a-záéíóúâêîôûãõç])/i.test(t)) return true;
      // Irregular preterites
      if (/(?<![a-záéíóúâêîôûãõç])(fui|foste|foi|fomos|fostes|foram|tive|tiveste|teve|tivemos|tivestes|tiveram|fiz|fizeste|fez|fizemos|fizestes|fizeram|disse|dissemos|disseram|vi|viste|viu|vimos|vistes|viram|vim|vieste|veio|viemos|vieram|dei|deste|deu|demos|deram|pus|puseste|pôs)(?![a-záéíóúâêîôûãõç])/i.test(t)) return true;
      return false;
    },
    tips: [
      "Portuguese preterite is a one-word past tense (no `tenho feito` aux). Endings: -ar verbs → -ei/-aste/-ou/-amos/-aram. `Falei`, `comi`, `parti`.",
      "Where English says 'I ate', Portuguese says `comi`. Where English says 'I have eaten', Portuguese ALSO uses `comi` most of the time. The simple past does both jobs.",
    ],
  },

  // ── Imperfeito (habitual past / background) ──
  // NOTE: \b is ASCII-only – uses lookaround over accented chars instead.
  // -ia collides with many nouns (família, história, polícia, dia, tia).
  {
    id: 'pt-imperfeito',
    priority: 75,
    match: t => {
      // -ava/-avam are reliably verb forms; few nouns end this way
      if (/(?<![a-záéíóúâêîôûãõç])[a-záéíóúâêîôûãõç]{2,}(?:ava|avas|ávamos|aváveis|avam)(?![a-záéíóúâêîôûãõç])/i.test(t)) return true;
      // Irregular imperfeito of ser/ir/ter
      if (/(?<![a-záéíóúâêîôûãõç])(era|eras|éramos|éreis|eram|ia|ias|íamos|íeis|iam|tinha|tinhas|tínhamos|tínheis|tinham)(?![a-záéíóúâêîôûãõç])/i.test(t)) {
        // Exclude noun "ia" as a noun is impossible – "ia" only exists as verb (imperfect of ir)
        // But still exclude common -ia-ending nouns
        const NOUN_IA = /^(família|história|polícia|farmácia|democracia|geografia|filosofia|economia|teoria|biografia|categoria|fotografia|criança|infância|esperança|distância|importância|paciência|presença|tendência|experiência|consciência|preferência|ciência|justiça|notícia|delícia|caricia|magia|alegria|graça|herança|frequência|elegância|essência|circunstância)$/i;
        const matches = t.match(/(?<![a-záéíóúâêîôûãõç])[a-záéíóúâêîôûãõç]{2,}(?:ia|ias|íamos|íeis|iam)(?![a-záéíóúâêîôûãõç])/gi) || [];
        return matches.some(w => !NOUN_IA.test(w)) || /(?<![a-záéíóúâêîôûãõç])(era|eras|éramos|tinha|tinhas)(?![a-záéíóúâêîôûãõç])/i.test(t);
      }
      return false;
    },
    tips: [
      "Imperfeito (`-ava/-ia` endings) paints background or habit: `quando era criança, jogava futebol` (as a kid, I used to play football). No clear endpoint.",
      "Use imperfeito for `was -ing`, `used to`, weather, age, time-of-day in the past. `Era`, `tinha`, `fazia`. Contrast with the preterite for sharp events.",
    ],
  },

  // ── Reflexive verbs ──
  {
    id: 'pt-reflexive',
    priority: 85,
    match: t => /\b(me|te|se|nos)\s+(chamo|chama|chamamos|chamam|levanto|levanta|deito|deitamos|visto|vestimos|sento|sentamos|preparo|preparamos|lembro|lembramos|esqueço|esquecemos)\b/i.test(t),
    tips: [
      "Reflexive verbs need a pronoun: `me chamo` (I'm called), `se levanta` (gets up). The pronoun matches the subject – me/te/se/nos/se.",
      "Not always reflexive in English: `lembrar-se` = to remember, `esquecer-se` = to forget. The `-se` in the dictionary form tells you a pronoun is needed.",
    ],
  },

  // ── Subjunctive triggers ──
  {
    id: 'pt-subjunctive-trigger',
    priority: 100,
    match: t => /\b(quero|quer|queremos|querem|espero|esperamos|duvido|é\s+importante|é\s+necessário|talvez|tomara)\s+que\b/i.test(t),
    tips: [
      "After expressions of wish/doubt/emotion + `que`, Portuguese switches to subjunctive: `quero que você venha` (not vem). The wanting is real; the coming is hypothetical.",
      "`Talvez` (maybe) ALWAYS triggers subjunctive: `talvez chova` = 'maybe it'll rain'. Endings: -ar verbs → -e, -er/-ir verbs → -a.",
    ],
  },

  // ── Modal + infinitive ──
  {
    id: 'pt-modal-infinitive',
    priority: 80,
    match: t => /\b(posso|pode|podemos|podem|quero|quer|queremos|querem|preciso|precisa|precisamos|preciso|devo|deve|devemos|devem)\s+\w+(ar|er|ir)\b/i.test(t),
    tips: [
      "Modal verbs attach directly to the infinitive: `preciso estudar`, `quero comer`. No preposition between. `Preciso de estudar` would be European Portuguese, not Brazilian.",
      "`Tenho que + infinitive` = 'I have to': `tenho que sair` (I have to leave). Common alternative to `preciso/devo`.",
    ],
  },

  // ── Object pronouns (PT BR style) ──
  {
    id: 'pt-object-pronoun',
    priority: 55,
    match: t => /\b(me|te|nos|se)\s+(vê|vejo|conhece|conheço|ama|amo|chama|esperar|esperamos)\b/i.test(t),
    tips: [
      "In Brazilian Portuguese, object pronouns go BEFORE the verb in most cases: `me vê` (sees me), not `vê-me`. The European Portuguese hyphenated form is uncommon in BR.",
      "Watch for spoken BR habits: `me dá` (give me), `me espera` (wait for me). Pronoun first, verb second. Less hyphens, more flow.",
    ],
  },

  // ── Tem (use of ter as 'there is') ──
  {
    id: 'pt-ter-existential',
    priority: 90,
    match: t => /\btem\s+(uma?|um|alguma?|algum|muito[as]?|poucos?|pouca|vários?|várias?)\s+\w+/i.test(t),
    tips: [
      "Brazilians use `tem` for 'there is/are' instead of `há`: `tem uma farmácia aqui` = 'there's a pharmacy here'. Same `ter` (to have) doing double duty.",
      "`Há` exists in PT but sounds formal/written. `Tem` is what you'll hear in speech. Same word as the verb 'to have' – context tells you which.",
    ],
  },

  // ── Por vs Para ──
  {
    id: 'pt-por-vs-para',
    priority: 80,
    match: t => /\b(por|para)\b/i.test(t),
    tips: [
      "`por` = reason, exchange, route, duration. `para` = destination, purpose, recipient. `Trabalho por dinheiro` (cause) vs `trabalho para o futuro` (goal).",
      "When merging with articles: `por + o → pelo`, `por + a → pela`, `por + os → pelos`, `por + as → pelas`. These contractions are mandatory.",
    ],
  },

  // ── Gostar de ──
  {
    id: 'pt-gostar-de',
    priority: 95,
    match: t => /\b(gosto|gosta|gostamos|gostam|gostei|gostou)\s+de\b/i.test(t),
    tips: [
      "Portuguese `gostar` always takes `de`: `gosto de pizza`, `gosto de você`. Drop the `de` and the sentence breaks. English `like` has no preposition; Portuguese needs one.",
      "Different from Spanish `gustar` (which flips the subject). Portuguese `gostar` works straightforwardly: subject + gostar + de + thing.",
    ],
  },

  // ── Diminutives -inho/-inha ──
  {
    id: 'pt-diminutive',
    priority: 50,
    match: t => /\b\w+(inho|inha|inhos|inhas|zinho|zinha)\b/i.test(t),
    tips: [
      "Diminutives `-inho/-inha` add 'small / cute / friendly' – often emotional rather than literal. `Um cafezinho` = 'a (lovely little) coffee'. Brazilians sprinkle these everywhere.",
      "`-inho` softens tone: `um momentinho` (just a sec), `obrigadinho` (thanks, friendly). Not about size – about warmth.",
    ],
  },

  // ── Estar + gerúndio (continuous) ──
  {
    id: 'pt-estar-gerundio',
    priority: 90,
    match: t => /\b(estou|está|estamos|estão|estava|estavam)\s+\w+(ando|endo|indo)\b/i.test(t),
    tips: [
      "`estar + gerúndio` = English '-ing right now': `estou comendo` = 'I'm eating'. Brazilians use this WAY more than Spanish/Italian use their gerundios.",
      "Endings: -ar → -ando, -er → -endo, -ir → -indo. `Comendo`, `bebendo`, `dormindo`. Always paired with `estar`.",
    ],
  },

  // ── Tu vs você (regional formality + verb forms) ─────────────────
  {
    id: 'pt-tu-voce-formal',
    priority: 88,
    match: t => /\b(tu|você|vocês|o\s+senhor|a\s+senhora|os\s+senhores|as\s+senhoras)\b/i.test(t),
    tips: [
      "Portuguese has TWO main 'you's: `tu` (informal – Portugal and southern Brazil) and `você` (universal – informal in Brazil, semi-formal in Portugal). They use DIFFERENT verb forms: `tu falas` vs `você fala`.",
      "Brazilian Portuguese: `você` is the default. Most Brazilians never say `tu`. `Você fala português?` is what you'll hear, with 3rd-person verbs.",
      "European Portuguese: `tu` is for close friends/family, `você` is slightly more distant. For real formality, drop the pronoun and use `o senhor` (m) / `a senhora` (f): `O senhor sabe...?`.",
      "Plural: `vocês` is universal. Portugal also has `vós` but it's extinct in speech. Just use `vocês` and you're safe everywhere.",
    ],
  },

  // ── Gender on inanimate nouns ───────────────────────────────────
  {
    id: 'pt-gender-arbitrary',
    priority: 45,
    match: t => /(^|\s)(o|a|os|as|um|uma|uns|umas|do|da|dos|das|no|na|nos|nas)\s+[a-záéíóúâêîôûãõç]+/i.test(t),
    tips: [
      "Portuguese nouns have GENDER: `o livro` (m), `a casa` (f). Arbitrary on objects. Always learn the article WITH the noun, never just `livro` alone.",
      "Endings hint at gender: `-o` usually masc (`o livro`), `-a` usually fem (`a casa`). Exceptions: `o problema`, `o dia`, `a mão` (the hand, irregular).",
      "Adjectives agree with the noun's gender and number: `o carro vermelho`, `a casa vermelha`, `os carros vermelhos`, `as casas vermelhas`. One adjective, four forms.",
      "Articles + prepositions contract: `de + o → do`, `de + a → da`, `em + o → no`, `em + a → na`. Same gender info still applies – `na casa` is feminine.",
    ],
  },

];
