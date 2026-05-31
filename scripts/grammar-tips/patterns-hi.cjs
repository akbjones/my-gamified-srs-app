/** Hindi grammar-tip patterns — deeply tailored to the gaps English speakers fall into. */

// shorthand for Devanagari char class
const D = '[ऀ-ॿ]';

module.exports = [

  // ── Sentence-final auxiliary ──
  {
    id: 'hi-hai-auxiliary',
    priority: 75,
    match: t => /\s(है|हैं|हूँ|हो|था|थी|थे)[।!?.\s]*$/i.test(t),
    tips: [
      "Hindi sentences end with the auxiliary `है` (is) or `हैं` (are/respect). Word order: Subject – Object – Verb – Auxiliary. `मैं हिंदी पढ़ता हूँ` literally = 'I Hindi learn-m am' = 'I learn Hindi'.",
      "Auxiliary placement is non-negotiable: it's always the LAST word. English puts 'is/are' between subject and rest; Hindi shoves it to the end. Watch for `है/हैं/हूँ/हो` as the tell.",
      "Don't skip the auxiliary — `मैं डॉक्टर` alone isn't a sentence; you need `हूँ` at the end: `मैं डॉक्टर हूँ` (I am a doctor). The auxiliary carries 'is/am/are'.",
      "Six present-tense auxiliaries: हूँ (I am), है (he/she/it is), हैं (we/they/you-respect are), हो (you-informal are). Pick the one matching the subject's person and respect level.",
    ],
  },

  // ── Gender on participles (m -ता / f -ती) ──
  {
    id: 'hi-gender-on-verb',
    priority: 95,
    match: t => /\s[ऀ-ॿ]+(ता|ती|ते)\s/i.test(t),
    tips: [
      "Hindi verbs agree with the SPEAKER's gender. Men say `मैं करता हूँ` (I do — m), women say `मैं करती हूँ` (I do — f). English verbs don't gender; Hindi does — every present-tense sentence.",
      "Endings to memorise: -ता (m sg), -ती (f sg), -ते (m pl OR respect). Same root, three endings. `जाता` (he goes), `जाती` (she goes), `जाते` (they go / you-respect go).",
      "Easy mistake: a woman saying `मैं करता हूँ` sounds wrong to a native. Match the participle to YOUR gender as the speaker — every time, no exceptions.",
      "When in doubt with formal/plural: use `-ते`. `आप क्या करते हैं?` = 'What do you do?' (respectful, plural-shaped). The plural-style ending doubles as the polite form.",
      "Even in third person, the verb tracks the subject's gender: `राम जाता है` (Ram goes — m), `सीता जाती है` (Sita goes — f). Hindi puts gender everywhere English hides it.",
    ],
  },

  // ── Postpositions ──
  {
    id: 'hi-postpositions',
    priority: 80,
    match: t => /\s(में|पर|से|को|के\s+लिए|के\s+पास|के\s+साथ|के\s+बारे\s+में|के\s+अंदर|के\s+बाहर|के\s+आगे|के\s+पीछे|तक|पर)\b/i.test(t),
    tips: [
      "Hindi puts position words AFTER the noun. `घर में` literally = 'house in' = 'in the house'. Flip the English order in your head: noun first, position word second.",
      "Common postpositions: `में` (in), `पर` (on), `से` (from/by), `को` (to), `तक` (until/up to). Each forces the noun before it into 'oblique' form (vowel changes).",
      "Compound postpositions chain `के`: `के लिए` (for), `के पास` (near), `के साथ` (with), `के बारे में` (about). Memorise as fixed phrases — they're everywhere.",
      "After a postposition, the noun shifts case: `लड़का` (boy) → `लड़के को` (to the boy). The -ा becomes -े because of the following postposition. Sneaky shift.",
      "Two-word concept becomes three in Hindi: `for the boy` = `लड़के के लिए` — three pieces. English squishes 'for' onto a single word; Hindi spreads it.",
    ],
  },

  // ── ने ergative marker (past transitive) ──
  {
    id: 'hi-ne-ergative',
    priority: 100,
    match: t => /\s(ने)\s/i.test(t),
    tips: [
      "Past-tense transitive verbs use the ergative `ने` after the subject: `मैंने खाना खाया` (I ate food). The verb stops agreeing with you and starts agreeing with the OBJECT instead. Wild for English speakers.",
      "`ने` only with transitive verbs in past tenses. `मैं गया` (I went — no ने, intransitive) vs `मैंने देखा` (I saw — ने, transitive). The intransitive verbs always skip ने.",
      "Verb agrees with the object after `ने`: `मैंने रोटी खाई` (I ate bread — खाई because रोटी is f sg). `मैंने रोटियाँ खाईं` (plural). The subject (मैं) becomes irrelevant for agreement.",
      "If the object has its own `को` marker, the verb defaults to masculine singular: `मैंने राम को देखा`. The `को` blocks the object from triggering agreement, so the verb sits in neutral.",
      "Subject forms with ने: `मैंने` (I), `तूने` (you-intimate), `तुमने` (you), `आपने` (you-resp), `इसने/उसने` (he/she), `इन्होंने/उन्होंने` (they). These are the 'past transitive' subject forms.",
    ],
  },

  // ── को marker for specific direct objects + dative ──
  {
    id: 'hi-ko-marker',
    priority: 85,
    match: t => /\s[ऀ-ॿ]+\s+को\s/i.test(t),
    tips: [
      "`को` marks two things: (1) specific direct objects (`राम को बुलाओ` — call Ram), (2) indirect objects / recipients (`बच्चे को खाना दो` — give the child food).",
      "Specific or definite? Add `को`. `एक किताब लाओ` (bring a book — unspecific) vs `इस किताब को लाओ` (bring this book — specific). English uses 'a' vs 'this'; Hindi uses absence vs `को`.",
      "Use `को` for people, named animals, and definite things: `मुझे राम को देखना है` (I need to see Ram). Skipping it would sound generic, like 'see some Ram'.",
      "`को` doubles as the dative case: 'to me / to you / to him'. `मुझको / तुझको / उसको` are full forms; the contracted `मुझे / तुझे / उसे` are more common in speech.",
      "When `को` marks the object, the verb sits in the default masculine-singular form: `राम ने सीता को देखा` (Ram saw Sita) — verb stays `देखा`, not `देखी`.",
    ],
  },

  // ── Levels of "you" — तू / तुम / आप ──
  {
    id: 'hi-formality',
    priority: 85,
    match: t => /\b(तू|तुम|आप)\b/i.test(t),
    tips: [
      "Three 'you' levels: `तू` (very intimate or rude — lovers, kids, gods, sometimes insults), `तुम` (casual friends), `आप` (formal / respectful / plural). Wrong one is socially loud.",
      "Default to `आप` with new people. Tu/तू sounds aggressive without context. Tum/तुम is for established friendships. Only family elders or close mates get तू.",
      "Verb agreement: `तू है`, `तुम हो`, `आप हैं`. Each `you` triggers a different verb ending. Mixing them (`तुम है`) sounds illiterate.",
      "Even though `आप` refers to one person, it takes plural verbs (हैं, करते हैं, etc.). Same trick as Spanish `usted` with 3rd-person verbs.",
      "Hindi is gradient about respect: you can shift mid-conversation if intimacy grows. Watch what locals call YOU and mirror them — that's the safest signal.",
    ],
  },

  // ── रहा है / रही है / रहे हैं — continuous tense ──
  {
    id: 'hi-continuous',
    priority: 95,
    match: t => /\s(रह[ायीे]\s+(हूँ|है|हैं|हो|था|थी|थे))\b/i.test(t),
    tips: [
      "Continuous tense: verb stem + `रहा/रही/रहे` (gendered) + auxiliary. `मैं खा रहा हूँ` = 'I am eating'. The `रहा/रही/रहे` is the 'doing -ing' chunk.",
      "Gender on the middle word: men `रहा`, women `रही`, plural/respect `रहे`. So a woman writes `मैं खा रही हूँ`, a man `मैं खा रहा हूँ`. Same action, different middle word.",
      "Continuous past: swap the auxiliary. `मैं खा रहा था` = 'I was eating' (m). `मैं खा रही थी` = 'I was eating' (f). Three pieces: stem + रहा/रही + था/थी.",
      "Don't say `मैं खा हूँ` — without `रहा/रही/रहे`, you're just stating 'I eat' (habit), not 'I am eating right now'. The middle word makes it ongoing.",
    ],
  },

  // ── Habitual past (-ता था) ──
  {
    id: 'hi-habitual-past',
    priority: 80,
    match: t => /\s[ऀ-ॿ]+(ता|ती|ते)\s+(था|थी|थे)\b/i.test(t),
    tips: [
      "Habitual past: -ता/-ती/-ते (gendered) + था/थी/थे. `मैं हर दिन दौड़ता था` = 'I used to run every day'. Two-word chunk = English's 'used to'.",
      "Tells of a thing you DID regularly in the past. Different from `रहा था` (continuous past — were in the middle of it) vs `-ता था` (used to do, repeatedly).",
      "Auxiliary at the end carries gender + number: `था` (m sg), `थी` (f sg), `थे` (m pl / respect), `थीं` (f pl). Match it to the subject.",
    ],
  },

  // ── Simple past (-ा / -ी / -े on the verb) ──
  {
    id: 'hi-simple-past',
    priority: 70,
    match: t => /\s[ऀ-ॿ]+(या|यी|ये|ई|ईं)\b/i.test(t),
    tips: [
      "Simple past in Hindi marks a completed event. Forms: `गया` (went m sg), `गई` (went f sg), `गए` (went m pl), `गईं` (went f pl). Match to subject (or object if `ने` is used).",
      "Watch for vowel-stem verbs: they take an extra 'य' or 'ई': `जाना → गया/गई`, `पीना → पिया/पी`. Memorise the past-tense forms — irregularity is common.",
      "If you see `ने`, then the past-tense verb agrees with the OBJECT not the subject. Without `ने`, it agrees with the subject. The marker tells you which way.",
    ],
  },

  // ── Future tense -गा / -गी / -गे ──
  {
    id: 'hi-future-tense',
    priority: 95,
    match: t => /\s[ऀ-ॿ]+(ूँगा|ूँगी|ोगे|ोगी|एगा|एगी|एंगे|ेंगे|ेंगी)\b/i.test(t),
    tips: [
      "Future is the verb stem + person-ending + gender marker -गा/-गी/-गे. `मैं जाऊँगा` (I will go — m), `मैं जाऊँगी` (I will go — f). The final part flags gender.",
      "Person endings packed into the suffix: ूँ (I), ो (you-तुम), ए (he/she), एं (we/they). Then -गा / -गी / -गे tacks on. Three layers of information in one chunk.",
      "Negative future = simply `नहीं` before the verb: `मैं नहीं जाऊँगा` (I won't go). No special 'will-not' form; just stick `नहीं` in.",
      "Polite future with आप: `आप जाएंगे` (you will go — respect). Plural form even for one person; -गे, never -गा.",
    ],
  },

  // ── Adjective gender agreement (-ा -ी -े) ──
  {
    id: 'hi-adj-agreement',
    priority: 75,
    match: t => /\s(अच्छ|बड़|छोट|पुरान|नय|काल|गोर|लंब|मोट|पतल|लाल|पीला|हरा|नील)[ायीे]\b/i.test(t),
    tips: [
      "Hindi adjectives ending in -ा change with the noun: -ा (m sg), -ी (f sg), -े (m pl OR oblique-case before postposition). `अच्छा लड़का / अच्छी लड़की / अच्छे लड़के`.",
      "Only -ा adjectives change. Invariable ones (सुंदर, लाल) stay the same regardless of noun. Look at the dictionary form to see if you'll need to inflect.",
      "Watch the oblique trap: `अच्छा लड़का` (good boy — direct) → `अच्छे लड़के को` (to the good boy — oblique). The postposition forces both adjective AND noun to shift to -े.",
    ],
  },

  // ── नहीं placement (negation) ──
  {
    id: 'hi-negation',
    priority: 85,
    match: t => /\bनहीं\b/i.test(t),
    tips: [
      "`नहीं` (no/not) sits right before the verb: `मैं नहीं जाऊँगा` (I won't go), `वह नहीं आया` (he didn't come). English wraps 'do not'; Hindi just stacks `नहीं` in front.",
      "For 'never', use `कभी नहीं`: `मैं कभी नहीं आऊँगा` (I will never come). Two separate words, both before the verb. Combine for emphasis.",
      "`न` (also 'no/not') is the more formal/poetic version of `नहीं`. You'll see it in `न मैं न तू` (neither I nor you) or `न करो` (don't do it).",
      "Negative imperatives drop down to `मत`: `मत जाओ` (don't go). Not `नहीं जाओ`. The negation form depends on the verb mood.",
    ],
  },

  // ── Conditional अगर...तो ──
  {
    id: 'hi-conditional',
    priority: 95,
    match: t => /\b(अगर|यदि)\b/i.test(t),
    tips: [
      "Conditional uses `अगर...तो` (if...then): `अगर तुम आओगे तो मैं भी आऊँगा` = 'if you come, then I'll come too'. The `तो` ties the two halves; English often drops 'then'.",
      "`यदि` is the formal version of `अगर`. Both = 'if', interchangeable; `यदि` shows up in writing and formal speech.",
      "Hypothetical 'if I were... I would...' uses subjunctive verbs in both halves: `अगर मैं होता तो जाता` (if I were... I would go). The `-ता था` style for both.",
      "If you skip `तो`, the sentence works but sounds less polished. Native speakers use it for clarity, like a comma that means 'now here's the consequence'.",
    ],
  },

  // ── Comparatives with से ──
  {
    id: 'hi-comparative',
    priority: 80,
    match: t => /\s[ऀ-ॿ]+\s+से\s+(बड़|छोट|बेहतर|खराब|अच्छ|कम|ज़्यादा|अधिक)/i.test(t),
    tips: [
      "Comparative in Hindi: `X Y से बड़ा है` literally = 'X is bigger from Y' = 'X is bigger than Y'. The `से` does double duty as 'from' and 'than'.",
      "Order matters: thing being compared TO comes first with `से`, then the adjective. `मोबाइल लैपटॉप से छोटा है` = 'mobile is smaller than laptop'.",
      "Superlative uses `सबसे + adjective`: `सबसे बड़ा` (the biggest). Literally 'from-all big'. No 'the' needed; the structure makes it superlative.",
      "Equal comparison: `X Y के बराबर है` (X is equal to Y) or `X Y जितना बड़ा है` (X is as big as Y). Multiple constructions for 'as...as'.",
    ],
  },

  // ── Question words ──
  {
    id: 'hi-question-words',
    priority: 70,
    match: t => /\b(क्या|कौन|कब|कहाँ|क्यों|कैसे|कितना|कितनी|कितने)\b/i.test(t),
    tips: [
      "Question words: `क्या` (what / yes-no marker), `कौन` (who), `कब` (when), `कहाँ` (where), `क्यों` (why), `कैसे` (how), `कितना/कितनी/कितने` (how much/many).",
      "`क्या` at the start of a sentence often makes it a yes/no question: `क्या तुम जाओगे?` = 'Will you go?'. In the middle, it means 'what': `तुम क्या करोगे?` = 'What will you do?'.",
      "Word order in questions stays Subject-Object-Verb. You just slot the question word where you'd put the asked-about thing: `तुम कहाँ रहते हो?` (where do you live?).",
      "`कितना` agrees with the noun like an adjective: `कितना पानी` (m), `कितनी चाय` (f), `कितने लोग` (m pl). It's a question word AND a quantity adjective.",
    ],
  },

  // ── Possession with का / की / के ──
  {
    id: 'hi-possessive-ka',
    priority: 75,
    match: t => /\s[ऀ-ॿ]+\s+(का|की|के)\s+[ऀ-ॿ]+/i.test(t),
    tips: [
      "`का / की / के` = possession ('of'). Order is owner FIRST + linker + thing: `राम का घर` = 'Ram's house' (lit. 'Ram of house'). English uses 's; Hindi uses three forms.",
      "Pick the form by the GENDER of the thing owned, not the owner: `राम का घर` (m), `राम की किताब` (f), `राम के बच्चे` (m pl). Wrong agreement = wrong sentence.",
      "Pronouns have built-in possessives: `मेरा/मेरी/मेरे` (my), `तेरा/तेरी/तेरे` (your-intimate), `तुम्हारा/तुम्हारी/तुम्हारे` (your-familiar), `उसका/उसकी/उसके` (his/her). Still gender-agree with the thing.",
      "`के + postposition` is everywhere: `के पास` (near), `के लिए` (for). The `के` form here is the oblique — it joins to the next postposition.",
    ],
  },

  // ── होना — to be / to happen ──
  {
    id: 'hi-hona-verb',
    priority: 80,
    match: t => /\b(होगा|होगी|होंगे|होंगी|हो|होता|होती|होते|हुआ|हुई|हुए|थे|थीं)\b/i.test(t),
    tips: [
      "`होना` (to be / to happen / to become) is the most flexible verb in Hindi. Forms: `है` (is), `था` (was), `होगा` (will be), `हुआ` (became/happened). It powers the auxiliary too.",
      "Don't confuse `है` (is) with `हो` (you are) or `हुआ` (happened/became). Same root, different uses. Context tells you which: `दिन हो गया` = 'it became day', not 'a day is'.",
      "`होगा` is the future of होना: 'will be'. Can also mean 'probably is': `वह घर पर होगा` = 'he will be at home' OR 'he's probably at home'. Tone of voice resolves it.",
    ],
  },

  // ── Passive (X जाता है) ──
  {
    id: 'hi-passive',
    priority: 85,
    match: t => /\s[ऀ-ॿ]+(या|यी|ये|ी|ा|े)\s+ज[ाा][ऀ-ॿ]*\b/i.test(t),
    tips: [
      "Hindi passive: past participle + form of `जाना` (to go). `यह काम किया जाता है` = 'this work is done'. The `जाना` becomes the auxiliary; the agent is often dropped.",
      "Different from English: passive is much rarer in Hindi. Used mainly for impersonal statements: `यहाँ हिंदी बोली जाती है` (Hindi is spoken here). Native speech prefers active.",
      "Agent in passive marked by `से` (by): `यह किताब राम से लिखी गई` (this book was written by Ram). The `से` matches English 'by' here.",
    ],
  },

  // ── भी / ही emphasis particles ──
  {
    id: 'hi-emphasis-bhi-hi',
    priority: 65,
    match: t => /\s(भी|ही|तो)\s/i.test(t),
    tips: [
      "`भी` (also/even) sits AFTER the word it emphasises: `मैं भी जाऊँगा` (I'll go too — emphasis on 'I'). `मैं कल भी जाऊँगा` (I'll go tomorrow too — emphasis on 'tomorrow').",
      "`ही` (exactly/only) narrows: `मैं ही जाऊँगा` = 'only I will go'. `यही किताब` = 'this very book'. It's pointier than English 'just'.",
      "`तो` is a connector with attitude: 'well', 'as for', 'then'. `मैं तो नहीं जाऊँगा` = 'well, I won't go (whatever others do)'. Adds contrast or assertion.",
      "Position is critical: `मैं भी कल जाऊँगा` (I'll go tomorrow too — same as others) vs `मैं कल भी जाऊँगा` (I'll go tomorrow again, in addition to today). Move the particle, change the emphasis.",
    ],
  },

  // ── Compound verbs (X लेना / X देना / X जाना) ──
  {
    id: 'hi-compound-verb',
    priority: 70,
    match: t => /\s[ऀ-ॿ]+\s+(लिया|ली|लीं|लेना|दिया|दी|देना|दे|गया|गयी|गए|जाना)\b/i.test(t),
    tips: [
      "Compound verbs glue a main verb to a 'colouring' verb: `पी जाना` (to drink up — completion), `कह देना` (to say outright — finality), `सो लेना` (to sleep a bit — for oneself).",
      "The second verb (जाना, देना, लेना) shades the meaning rather than translating literally. `खा लेना` doesn't mean 'eat take' — it means 'go ahead and eat (for yourself)'.",
      "Choosing the right helper verb is subtle. `देना` (give) = for someone else. `लेना` (take) = for yourself. `जाना` (go) = completion / drastically.",
    ],
  },

  // ── Compound verbs with करना ──
  {
    id: 'hi-compound-karna',
    priority: 60,
    match: t => /\s[ऀ-ॿ]+\s+(करना|करता|करती|करते|किया|की|करूँगा|करूँगी)\b/i.test(t),
    tips: [
      "Many English actions become noun + `करना` in Hindi: `इंतज़ार करना` (to wait), `मदद करना` (to help), `बात करना` (to talk), `कोशिश करना` (to try). The `करना` carries tense and gender.",
      "Works for English loanwords too: `phone करना`, `try करना`, `online करना`. Mash an English noun with `करना` and you've made a verb. Common in modern Hindi.",
      "When `करना` is part of a compound, the FIRST noun stays neutral and `करना` carries all the agreement. `मैंने मदद की` (I helped — की because मदद is f).",
    ],
  },

  // ── Imperative levels (कर / करो / करिए / कीजिए) ──
  {
    id: 'hi-imperative-levels',
    priority: 80,
    match: t => /^[ऀ-ॿ]+(िए|िये|ो)[।!?.\s]*$/i.test(t) || /^(मत|न)\s+/i.test(t),
    tips: [
      "Four imperative levels matching the four 'you' forms: `कर` (तू, intimate), `करो` (तुम, casual), `कीजिए` (आप, polite), `किया कीजिएगा` (extra polite request). Match to the 'you' you're using.",
      "Polite request adds -इए / -इये: `सुनिए` (please listen), `बैठिए` (please sit). Used with strangers and elders. Without it, you sound abrupt.",
      "Negative imperative uses `मत` (informal) or `न` (formal): `मत जाओ` (don't go — to friend), `न जाइए` (please don't go — to elder). Different word for 'don't' depending on respect level.",
    ],
  },

  // ── Relative pronoun जो...वह ──
  {
    id: 'hi-relative-jo-vah',
    priority: 90,
    match: t => /\b(जो|जिसने|जिसका|जिसकी|जिसके|जिसमें|जिनको|जिनके|जिनसे)\b/i.test(t),
    tips: [
      "Hindi splits relative clauses: `जो...वह` (who/which...that). `जो लड़का आया वह मेरा भाई है` = 'the boy who came, he is my brother'. The `वह` echoes back the subject.",
      "English smashes into one clause: 'the boy who came is my brother'. Hindi splits into two: relative clause first (जो), then main clause (वह). Pause between them feels natural.",
      "Case forms of जो: `जो` (who-nom), `जिसको / जिसे` (whom-acc), `जिसका/की/के` (whose), `जिसमें` (in which), `जिससे` (from which). Each fits a different slot.",
    ],
  },

  // ── Subjunctive / optative (-े ending) ──
  {
    id: 'hi-subjunctive',
    priority: 75,
    match: t => /\b(शायद|उम्मीद|काश|बशर्ते|जब\s+तक)\b/i.test(t),
    tips: [
      "Hindi subjunctive: bare verb stem + ending like present but without -ता: `मैं जाऊँ` (that I go), `वह आए` (that he come). Used after 'maybe', 'hope', 'if', wishes.",
      "Trigger words: `शायद` (maybe), `काश` (if only), `बशर्ते` (provided that). After these, the verb shifts: `शायद वह आए` = 'maybe he comes/will come'.",
      "`उम्मीद है कि...` (I hope that...) is followed by the subjunctive: `उम्मीद है कि वह जल्दी आए` = 'I hope he comes soon'. The wish is the trigger.",
    ],
  },

  // ── कुछ / कोई — something/someone ──
  {
    id: 'hi-kuch-koi',
    priority: 60,
    match: t => /\b(कुछ|कोई)\b/i.test(t),
    tips: [
      "`कुछ` = 'something / some / a little' (for things, abstract). `कोई` = 'someone / any (person)'. Use कुछ with stuff, कोई with people.",
      "Combined with `नहीं`: `कुछ नहीं` (nothing), `कोई नहीं` (no one). Hindi doesn't double-negate; just add `नहीं` and you've got 'nothing/no one'.",
      "Question form: `कुछ है?` (is there something?), `कोई है?` (is anyone there?). Same words, different intonation.",
    ],
  },

  // ── वाला construction ──
  {
    id: 'hi-vala-construction',
    priority: 70,
    match: t => /\s[ऀ-ॿ]+(वाला|वाली|वाले)\b/i.test(t),
    tips: [
      "`वाला/वाली/वाले` builds 'the X-ish one / the one with X / the X-seller': `लाल वाली किताब` (the red one — book), `चाय वाला` (the chai seller). Super common, no direct English equivalent.",
      "Attached to verb-stems, it means 'about to' or 'one who does': `जाने वाला` (one about to go / one who goes), `लिखने वाला` (the writer/author).",
      "Gender-agrees with the noun: `वाला` (m sg), `वाली` (f sg), `वाले` (m pl / oblique). It's a fully inflected suffix-adjective hybrid.",
    ],
  },

  // ── लगना — to seem / to feel / to start ──
  {
    id: 'hi-lagna',
    priority: 75,
    match: t => /\b(लगता|लगती|लगते|लगा|लगी|लगे|लगेगा|लगेगी)\b/i.test(t),
    tips: [
      "`लगना` is a chameleon: 'to seem', 'to feel', 'to begin', 'to be attached to', 'to take (time)'. `मुझे ठंड लग रही है` = 'I feel cold' (cold is attaching to me).",
      "Time expressions: `इसमें एक घंटा लगा` = 'this took an hour' (literally 'one hour attached to this'). For 'how long does it take' use `कितना समय लगता है?`.",
      "`लगना` for opinions: `मुझे लगता है कि...` = 'I think that...' (literally 'to me it seems that...'). The opinion comes to YOU; you don't actively form it.",
      "`लगना + infinitive` = start: `वह रोने लगा` = 'he started to cry'. Verb in oblique + लगना marks the beginning of an action.",
    ],
  },

  // ── को for the experiencer (मुझे, तुझे, उसे...) ──
  {
    id: 'hi-experiencer-dative',
    priority: 90,
    match: t => /\b(मुझे|मुझको|तुझे|तुझको|उसे|उसको|हमें|हमको|आपको|उन्हें|उनको)\s/i.test(t),
    tips: [
      "Feelings, needs, and unintended events use the dative (`को`) for the person experiencing: `मुझे भूख लगी है` = 'I feel hunger' (lit. 'to me hunger is attaching'). The 'I' isn't the doer.",
      "Common pattern: `<person> को <feeling/need> है`. `मुझे प्यास है` (I'm thirsty), `उसको ठंड लगती है` (he feels cold), `तुम्हें क्या चाहिए?` (what do you need?).",
      "Subject forms shift to oblique + को: `मैं → मुझको / मुझे`, `तुम → तुम्हें`, `वह → उसे/उसको`. Memorise these — they're not optional with experience verbs.",
      "English says 'I want / I feel / I know'; Hindi often says 'to me there is wanting / there is feeling / it is known'. Subject becomes recipient. Restructure your sentence in your head before speaking.",
    ],
  },

  // ── Possession 'have' = के पास ──
  {
    id: 'hi-have-ke-pas',
    priority: 80,
    match: t => /\s(के\s+पास|के\s+साथ)\s/i.test(t),
    tips: [
      "Hindi doesn't have 'have' as a verb. To say 'I have a car', say `मेरे पास कार है` = 'near me a car is'. The thing OWNED is the subject; you're 'near' it.",
      "Family and inherent traits use `का/की/के`: `मेरे दो भाई हैं` (I have two brothers — possession), not `मेरे पास दो भाई हैं` (that would mean 'I'm near my brothers'). Different have.",
      "`के साथ` = 'with' (alongside): `मेरे साथ आओ` = 'come with me'. Often confused with `के पास` (near, in possession). साथ = physical 'with'; पास = ownership-style 'have'.",
    ],
  },

  // ── चाहिए — need / want / should ──
  {
    id: 'hi-chahiye',
    priority: 85,
    match: t => /\b(चाहिए|चाहिये)\b/i.test(t),
    tips: [
      "`चाहिए` = 'is needed / wanted / should'. Goes with the experiencer in dative: `मुझे पानी चाहिए` = 'I need water' (lit. 'to me water is needed'). Doesn't conjugate — invariable.",
      "For 'should/ought to': `मुझे जाना चाहिए` = 'I should go' (infinitive + चाहिए). The infinitive `जाना` carries no agreement; the चाहिए marks obligation.",
      "Past 'wanted/needed': `मुझे पानी चाहिए था` (m) / `थी` (f matching water — wait, पानी is m so था). The auxiliary agrees with the thing wanted.",
    ],
  },

  // ── Honorific verbs / family terms ──
  {
    id: 'hi-honorific-jee',
    priority: 50,
    match: t => /\s[ऀ-ॿ]+जी\s/i.test(t),
    tips: [
      "Adding `जी` shows respect or warmth. Family elders get it baked in: `पिताजी` (father), `माताजी` (mother), `दादीजी` (granny). Names too: `रामजी`, `सरकारजी`.",
      "Even when talking ABOUT one respected person, use plural verbs: `पिताजी आए हैं` = 'father has come' (plural verb on a single father, out of respect).",
    ],
  },

  // ── ने... को for transitive past with definite object ──
  {
    id: 'hi-ne-ko-combo',
    priority: 95,
    match: t => /\s(ने)\s.*\s(को)\s/i.test(t),
    tips: [
      "`ने...को` combo: subject takes `ने` (ergative), object takes `को` (specific). With BOTH markers, the verb sits in default masculine singular — neither subject nor object triggers agreement.",
      "`मैंने राम को देखा` = 'I saw Ram'. Verb `देखा` doesn't change for who Ram is — both markers cancel out. Wild rule, but consistent.",
    ],
  },

];
