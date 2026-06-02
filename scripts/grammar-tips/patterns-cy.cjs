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
      "Verb-Subject-Object (VSO) is the default Welsh word order. To shift focus, you can front a different element (with `mai` for non-verb fronting), but the unmarked sentence stays VSO.",
      "`Mae` is the 3rd-person 'be' form. For 'I am' you'd use `Dw i'n` or `Rwy'n`. The opening verb form already tells you who the subject is.",
    ],
  },

  // ── 'n linking particle ──
  {
    id: 'cy-yn-particle',
    priority: 75,
    match: t => /\b(dw|wyt|mae|maen|dyn|dych|dydych|rwy'?|rwyt|rydw|rydym|rydych)\s+\w*'?n\b/i.test(t),
    tips: [
      "`yn` (often shortened to `'n` after a vowel) links the form of `bod` (to be) to an adjective or verb-noun. `Dw i'n hapus` (I am happy), `mae hi'n bwyta` (she is eating).",
      "Skip `'n` and the sentence is broken: `dw i hapus` is wrong. The `'n` is mandatory between the verb and what follows.",
      "Two flavors: `yn + adjective` (state, like 'I am sad'), `yn + verb-noun` (action, like 'I am running'). Same little word, different roles.",
      "`yn` triggers soft mutation before adjectives: `da → yn dda`, `prysur → yn brysur`. Before verb-nouns there's no mutation: `yn cerdded`, `yn rhedeg`.",
    ],
  },

  // ── Dw i'n / Rwy'n / Rydw i'n ──
  {
    id: 'cy-dwi-pattern',
    priority: 85,
    match: t => /^(Dw\s+i'?n|Rwy'?n|Rydw\s+i'?n|Rydym|Wyt\s+ti'?n)\b/i.test(t),
    tips: [
      "`Dw i'n` (informal) / `Rwy'n` (slightly more formal) / `Rydw i'n` (formal) all mean 'I am ...'. Choose by register, not meaning.",
      "Welsh always needs a subject pronoun — `dw` alone isn't enough. `Dw i'n`, `dwyt ti'n`, `mae e'n`, etc. The pronoun follows the verb.",
      "`Rwy'n` shortens `Rydw i'n` — both work for the spoken language; `dw i'n` is the most casual. Books often use `Rydw i'n` for formality.",
      "Plural: `dyn ni'n` / `rydym ni'n` (we are), `dych chi'n` / `rydych chi'n` (you all are). Same `'n` particle holds everything together.",
    ],
  },

  // ── Soft mutation triggers ──
  {
    id: 'cy-soft-mutation',
    priority: 65,
    match: t => /\b(yn|dau|dwy|dy|fy|ei|tri|chwe|i|o|am|ar|at|tan|dros|dan|drwy|gan|wrth|heb)\s+(b|d|g|m|ll|rh|t|c|p|f)\w*/i.test(t),
    tips: [
      "Soft mutation: certain words trigger the next consonant to soften. p→b, t→d, c→g, b→f, d→dd, g→ (drop), m→f, ll→l, rh→r. Triggers: `yn`, `dau`, `dwy`, `dy`, `ei` (his), most prepositions.",
      "If a Welsh sentence looks 'wrong' compared to a dictionary form — that's probably a mutation. `Cath → fy nghath` (my cat, nasal); `cath → ei gath` (his cat, soft).",
      "Soft mutation is the most common — feminine nouns also soft-mutate after the article `y`: `cath → y gath` (the cat). The form changes visibly.",
      "Numbers trigger it: `dau gi` (two dogs, soft), `dwy ferch` (two girls, soft). After numbers 2, the noun softens — but 3 (`tri/tair`) doesn't trigger soft for masc, only aspirate.",
    ],
  },

  // ── Nasal mutation ──
  {
    id: 'cy-nasal-mutation',
    priority: 85,
    match: t => /\bfy\s+(ngh|mh|nh|ng|m|n)\w/i.test(t) || /\byn\s+(mh|ngh|nh|m|ng|n)\w/i.test(t) || /\byng\s+\w/i.test(t),
    tips: [
      "Nasal mutation hits after `fy` (my) and `yn` (in): p→mh, t→nh, c→ngh, b→m, d→n, g→ng. `Pen → fy mhen` (my head), `Caerdydd → yng Nghaerdydd` (in Cardiff).",
      "Welsh has THREE mutation systems — soft, nasal, aspirate. Nasal is the rarest but very common after `fy` (my) and `yn` (in/at).",
      "`yn` becomes `ym` before m-mutation and `yng` before ng-mutation. `Yn Caerdydd → yng Nghaerdydd` (in Cardiff). Spelling tracks the sound.",
      "Sound shifts: voiced stops become nasals. Hardest mutation to spot because the consonant itself transforms into a different letter combination.",
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
      "Useful gender check: `ei` (his) triggers soft mutation, `ei` (her) triggers aspirate. `Ei gath` (his cat — soft) vs `ei chath` (her cat — aspirate).",
      "`A` (and) only aspirate-mutates the very next word, and only if it starts p/t/c. `Coffi a the` (coffee and tea — th from t). Common in lists.",
    ],
  },

  // ── Negation: Dw i ddim ──
  {
    id: 'cy-negation-ddim',
    priority: 80,
    match: t => /\b(dw|dwyt|dyw|dydy|dydyn|dyn|dych|dydych|tydy|dydy|nid|ni)\s+\w+\s+ddim\b/i.test(t) || /\bddim\b/i.test(t),
    tips: [
      "Negation in Welsh: insert `ddim` after the subject. `Dw i'n hapus` (I'm happy) → `dw i ddim yn hapus` (I'm not happy). Notice `yn` stays for adjectives.",
      "`Ddim` is a soft mutation of `dim` (nothing/none). It does the negation work. Order: verb + subject + ddim + rest.",
      "Some verbs negate by changing form: `dw → dwy(t)`, `mae → dyw/dydy`. You'll see different shapes for the same root depending on positive/negative/question.",
      "Formal/written: `Nid yw e'n hapus` instead of `dyw e ddim yn hapus`. Same meaning, more literary register. `Nid` fronts the negation.",
    ],
  },

  // ── Question with verb-fronted yes/no ──
  {
    id: 'cy-question-verb-first',
    priority: 70,
    match: t => /^(Ydy|Ydych|Wyt|Ydyn|Ydw|Oes|A\s+oes|A\s+ydy|A\s+yw)\b/i.test(t) || /\?$/.test(t),
    tips: [
      "Yes/no questions just front a different form of `bod`: `Wyt ti'n hapus?` (Are you happy?). The intonation rise matters too — like English question shape.",
      "Welsh has different question/affirmative verb forms. `Wyt` for 'are you?', `ydy` for 'is he/she/it?'. Use these in questions instead of `mae/dw`.",
      "Existence questions use `oes`: `Oes coffi?` (Is there coffee?). Compare to `Ydy'r coffi yn dda?` (Is the coffee good?) — `oes` for unknown existence, `ydy` for specific identification.",
      "Question particle `A` is optional in spoken Welsh: `A oes ...?` or just `Oes ...?`. Adding `A` makes it formal/literary.",
    ],
  },

  // ── Wedi for perfect ──
  {
    id: 'cy-wedi-perfect',
    priority: 80,
    match: t => /\bwedi\s+\w+/i.test(t),
    tips: [
      "`wedi` + verb-noun = perfect tense ('have done X'). `Dw i wedi bwyta` (I have eaten). Replaces `yn` from the present pattern with `wedi`.",
      "Think of it as a slot system: `Dw i'n bwyta` (present) → `Dw i wedi bwyta` (perfect) → `Dw i'n mynd i fwyta` (future). The middle word changes the tense.",
      "Negate with `ddim wedi`: `Dw i ddim wedi bwyta` (I haven't eaten). The `ddim` slots in before `wedi`.",
      "`Newydd` is a close cousin: `Dw i newydd fwyta` (I've just eaten). `Wedi` = generic perfect, `newydd` = 'just now'.",
    ],
  },

  // ── Conditional ──
  {
    id: 'cy-conditional',
    priority: 88,
    match: t => /\b(byddwn|byddai|byddent|fyddwn|fyddai|fyddent|baswn|basai|basech|petai|pe\s+bai|petawn|hoffwn|hoffai)\b/i.test(t),
    tips: [
      "Conditional forms (`byddwn`, `byddai`, `baswn`) = 'would'. `Byddwn i'n hoffi` (I would like). For 'if' clauses use `petai` or `pe bai`.",
      "Two conditional families: `bydd-` (modern, standard) and `bas-` (also modern, very common). Both translate as 'would (be)' + a following verb-noun.",
      "Compact alternative: `Hoffwn i ...` (I would like to ...) — `hoffwn` already has the conditional baked in. Common in polite requests.",
      "Soft mutation after the conditional pronoun: `Byddwn i'n bwyta → fwyta`. The verb-noun after `yn` keeps its original form; after a fronted object it'll soft-mutate.",
    ],
  },

  // ── Possession with gan/gen/gyda ──
  {
    id: 'cy-possession-gan',
    priority: 80,
    match: t => /\b(mae|oes|does)\s+\w+\s+(gen|gan|gyda|'da)\s+\w/i.test(t),
    tips: [
      "Welsh expresses possession backwards: `Mae car gen i` literally = 'there is a car with me' = 'I have a car'. `Gen i` = me, `gen ti` = you, `gan + name` = with X.",
      "Northern Welsh uses `gen/gan`; southern uses `gyda` (`gyda fi`). Same meaning, different region. The structure is the same: existence + thing + 'with' + person.",
      "Negate with `does dim`: `Does dim car gen i` (I don't have a car — literally 'there isn't a car with me'). The thing owned goes after `dim`.",
      "Question: `Oes car gen ti?` (Have you got a car?). Uses the existential `oes` because you're asking about existence-with-person.",
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
      "Past obligation: `Roedd rhaid i mi fynd` (I had to go). Future: `Bydd rhaid i mi fynd` (I'll have to go). The `rhaid` part stays put; the auxiliary marks tense.",
      "Negate with `does dim rhaid`: `Does dim rhaid i fi fynd` (I don't have to go). Distinct from `dydw i ddim yn cael` (I'm not allowed) — necessity vs permission.",
    ],
  },

  // ── 'r contracted article ──
  {
    id: 'cy-r-article',
    priority: 50,
    match: t => /\b\w'r\b/i.test(t),
    tips: [
      "`'r` is the contracted definite article — happens after a vowel: `mae'r ci` (the dog is). Sticks to the preceding vowel.",
      "Welsh has multiple forms of 'the': `y` before consonants, `yr` before vowels, `'r` after vowels in the previous word. `Mae'r ci` vs `mae yr afal` (the apple is).",
      "After consonants, the article is `y`: `y dyn` (the man), `y plant` (the children). Before vowels (including 'h'), `yr`: `yr afal`, `yr hen`.",
      "Feminine nouns soft-mutate after `y/yr/'r`: `cath → y gath` (the cat). Masculine and plural don't mutate after the article.",
    ],
  },

  // ── Past tense -odd ──
  {
    id: 'cy-past-odd',
    priority: 82,
    match: t => /\b[A-Za-zâêîôûŵŷ]+odd\s+/i.test(t),
    tips: [
      "Welsh simple past 3rd person singular ends in `-odd`: `prynodd` (he/she bought), `gwelodd` (he/she saw), `coginiodd` (he/she cooked). Comes from `prynu`, `gweld`, `coginio`.",
      "Past tense in Welsh uses different person endings: -ais (I), -aist (you sg), -odd (he/she), -on (we), -och (you pl), -on (they). Stick to the verb-noun stem.",
      "Verb-Subject-Object survives in past: `Prynodd Siân fara` (Siân bought bread). Verb first, then subject, then object — same VSO as present.",
      "Different past form for `bod`: `roedd e/hi` (he/she was) — uses imperfect for state, not perfect. Don't use `bododd` (it doesn't exist).",
    ],
  },

  // ── Past tense -ais / -aist (1st/2nd person) ──
  {
    id: 'cy-past-ais',
    priority: 80,
    match: t => /\b[A-Za-zâêîôûŵŷ]+(ais|aist|asom|asoch|asant)\b/i.test(t),
    tips: [
      "Past 1st-person singular ends in `-ais`: `prynais i` (I bought), `gwelais i` (I saw). The `i` pronoun follows the verb.",
      "Full past paradigm: -ais (I), -aist (you sg), -odd (he/she), -on/-asom (we), -och/-asoch (you pl), -on/-asant (they). The `-as-` forms feel more literary.",
      "Past keeps VSO order: `Gwelais i Dafydd` (I saw Dafydd). Verb (with personal ending) + pronoun + object. The pronoun isn't optional in spoken Welsh.",
      "`Bod` (to be) has irregular past forms: `roeddwn i, roeddet ti, roedd e, roedden ni, roeddech chi, roedden nhw`. Don't expect the -ais pattern here.",
    ],
  },

  // ── Imperative -wch (plural/formal) ──
  {
    id: 'cy-imperative-wch',
    priority: 85,
    match: t => /^[A-Z]\w+wch\b/i.test(t) || /\s[a-z]\w+wch\s/i.test(t),
    tips: [
      "Imperative ending `-wch` is formal/plural: `Eisteddwch` (sit down), `Cymerwch` (take), `Edrychwch` (look). Use this with `chi` (formal/group address).",
      "Singular/informal imperative drops the ending or uses the bare stem: `Eistedd!`, `Cymer!`, `Edrych!`. Compare to plural/formal `-wch`.",
      "Common polite request structure: imperative + `os gwelwch yn dda` (please). `Eisteddwch, os gwelwch yn dda` (Please sit down).",
      "Negative imperative uses `peidiwch â + verb-noun` (don't): `Peidiwch â mynd` (don't go). For informal singular: `Paid â mynd`.",
    ],
  },

  // ── Does dim / Nid oes — no existence ──
  {
    id: 'cy-does-dim',
    priority: 88,
    match: t => /\b(Does\s+dim|Nid\s+oes|Doedd\s+dim|Fydd\s+dim)\b/i.test(t),
    tips: [
      "`Does dim` = 'there isn't / there's no'. `Does dim coffi` (there's no coffee). Negation of existence — different from negating an action.",
      "Past form: `Doedd dim` (there wasn't). Future: `Fydd dim` (there won't be). Each tense has its own existential negation form.",
      "Formal/written: `Nid oes` instead of `does`. `Nid oes neb yma` (there's nobody here). Same meaning, different register.",
      "Pair with `gen/gyda` for possession: `Does dim car gen i` (I don't have a car). The negation structure stays — only the prepositional phrase changes.",
    ],
  },

  // ── Verb-noun ('infinitive') usage ──
  {
    id: 'cy-verb-noun',
    priority: 45,
    match: t => /\byn\s+[a-z]+(o|u|i|io|au)\b/i.test(t),
    tips: [
      "Welsh verbs work via a 'verb-noun' (similar to gerund/infinitive). `Bwyta` (to eat / eating), `cerdded` (to walk / walking). One form, many uses.",
      "After `yn`, verb-noun = continuous action: `dw i'n bwyta` (I'm eating). After `wedi`, verb-noun = perfect: `dw i wedi bwyta` (I've eaten).",
      "Verb-noun also acts like a noun: `mae bwyta'n bwysig` (eating is important). You can use it as a subject, object, or after prepositions.",
      "Welsh verb-nouns end in many ways: `-o` (coginio), `-i` (codi), `-u` (canu), `-io` (mwynhau), `-au` (mwynhau), or just bare stem (gweld). No single rule.",
    ],
  },

  // ── Imperfect roedd ──
  {
    id: 'cy-roedd-imperfect',
    priority: 78,
    match: t => /\b(Roedd|Roeddwn|Roeddet|Roedden|Roeddech|Doedd)\b/i.test(t),
    tips: [
      "`Roedd` = 'was/were' (3rd person), past continuous/state form of `bod`. `Roedd e'n hapus` (he was happy). Different from past simple.",
      "Full imperfect: `roeddwn i, roeddet ti, roedd e/hi, roedden ni, roeddech chi, roedden nhw`. The 3rd-person form is the most common.",
      "Compare past simple vs imperfect: `Roeddwn i'n bwyta` (I was eating) vs `bwytais i` (I ate). One ongoing, the other completed.",
      "Negative: `doeddwn i ddim` (I wasn't), `doedd e ddim` (he wasn't). The `r-` of `roedd` becomes `d-` for negation, plus `ddim`.",
    ],
  },

  // ── Future bydd ──
  {
    id: 'cy-future-bydd',
    priority: 80,
    match: t => /\b(Bydd|Byddaf|Byddwch|Byddwn|Byddan|Fydd)\b/i.test(t),
    tips: [
      "`Bydd` = 'will be' (3rd person), future of `bod`. `Bydd hi'n bwrw glaw` (It'll rain). Most common future form in conversation.",
      "Full future of `bod`: `byddaf i, byddi di, bydd e/hi, byddwn ni, byddwch chi, byddan nhw`. Often written and spoken with the pronoun.",
      "Future + yn + verb-noun = simple future: `Bydda i'n mynd` (I'll go). The structure mirrors the present tense, just with `bydd` forms.",
      "Negate by softening: `bydd → fydd`. `Fydd hi ddim yn dod` (She won't come). Same `ddim` particle as other tenses.",
    ],
  },

  // ── Numbers (Welsh decimal system) ──
  {
    id: 'cy-numbers',
    priority: 65,
    match: t => /\b(un|dau|dwy|tri|tair|pedwar|pedair|pump|chwech|saith|wyth|naw|deg|deuddeg|pymtheg|ugain|hanner)\b/i.test(t),
    tips: [
      "Welsh numbers 1-10 have masculine and feminine forms: `dau/dwy` (2), `tri/tair` (3), `pedwar/pedair` (4). Match the noun's gender.",
      "Numbers trigger mutations: `dau gi` (two dogs — soft), `tri chi` (three dogs — aspirate). Different number, different mutation.",
      "Modern decimal counting (1, 2, ... 10, 11, 12 ...) is common in everyday speech, but the traditional vigesimal system (counts by 20) still appears, especially for dates and time.",
      "Number agreement is singular: `pum afal` (five apples — apple stays singular!). Welsh, like many languages, counts on a singular noun after the number.",
    ],
  },

  // ── Comparative yn fwy / yn well ──
  {
    id: 'cy-comparative',
    priority: 75,
    match: t => /\b(yn\s+fwy|yn\s+llai|yn\s+well|yn\s+waeth|na'?n?|nag|mwy|llai)\b/i.test(t),
    tips: [
      "Comparatives: `yn fwy` (bigger), `yn llai` (smaller), `yn well` (better), `yn waeth` (worse). Use `na`/`nag` for 'than'.",
      "`Na` before consonants, `nag` before vowels: `mwy na deg` (more than ten), `mwy nag ugain` (more than twenty). Like English a/an.",
      "Superlative form ends in `-af` (often soft-mutated as `-aF` or `-haf`): `gorau` (best), `mwyaf` (biggest). Use the article `y/yr` before it.",
      "Equality: `mor + adj + â` = 'as ... as'. `Mor fawr â` (as big as). Triggers soft mutation on the adjective.",
    ],
  },

  // ── Direct/Indirect Object ──
  {
    id: 'cy-direct-object',
    priority: 50,
    match: t => /\b(ei|eu|ein|eich|fy)\s+\w+/i.test(t),
    tips: [
      "Possessive pronouns: `fy` (my), `dy` (your), `ei` (his/her), `ein` (our), `eich` (your pl), `eu` (their). Each triggers its own mutation on the noun.",
      "Mutation by possessive: `fy` (nasal), `dy/ei-his` (soft), `ei-her/eu` (aspirate), `ein/eich` (none). The same pattern = different meanings.",
      "Pronouns can double for emphasis: `fy nghi i` (my dog), with the `i` at the end mirroring the `fy`. Spoken Welsh adds the echo pronoun routinely.",
      "Direct object of a verb often uses the possessive: `fy ngweld i` (to see me — literally 'my seeing me'). Welsh objects can ride along as possessives in verb-noun phrases.",
    ],
  },

  // ── Mai/taw — focused statement ──
  {
    id: 'cy-mai-taw',
    priority: 80,
    match: t => /\b(mai|taw)\b/i.test(t),
    tips: [
      "`Mai` (or southern `taw`) introduces a focused embedded clause: `Dw i'n meddwl mai John sy'n iawn` (I think it's John who's right). 'It is X that ...' structure.",
      "Use `mai/taw` after verbs of thinking, knowing, saying when you're emphasizing a noun, not the action. The non-verb element is fronted.",
      "Compare `bod`-clauses (for verb-based facts) vs `mai`-clauses (for focused nouns). `Dw i'n meddwl bod e'n iawn` (I think he's right — fact) vs `mai e sy'n iawn` (it's him who's right — focus).",
      "Always followed by the fronted element + then a verb. `Mai yfory bydda i'n mynd` (it's tomorrow I'll be going). Used for any focus, not just people.",
    ],
  },

  // ── Wrth + verb-noun ──
  {
    id: 'cy-wrth-verbnoun',
    priority: 65,
    match: t => /\bwrth\s+[a-z]+(o|u|i|io|au|d)\b/i.test(t),
    tips: [
      "`Wrth + verb-noun` = 'while ...': `Wrth gerdded, gwelais y ci` (While walking, I saw the dog). Triggers soft mutation on the verb-noun.",
      "`Wrth` also means 'by/near' as a preposition: `wrth y drws` (by the door). Context tells you 'while-doing' vs 'next-to'.",
      "Compare to `pan` (when): `pan welais` (when I saw) vs `wrth weld` (while seeing). `Pan` introduces a finite clause; `wrth` introduces a verb-noun phrase.",
      "Useful for simultaneous actions: `Wrth fwyta, edrychais i'r teledu` (While eating, I watched TV). One short clause, soft mutation on the verb-noun.",
    ],
  },

  // ── Dim ond — only ──
  {
    id: 'cy-dim-ond',
    priority: 70,
    match: t => /\bdim\s+ond\b/i.test(t),
    tips: [
      "`Dim ond` = 'only / just': `Dim ond te, diolch` (Just tea, thanks). Literally 'nothing but'. Restrictive.",
      "Place `dim ond` before what's being limited: `dim ond fi` (only me), `dim ond unwaith` (only once). Adjective/noun follows directly.",
      "Alternative: `dim ond + verb` = 'only do X': `dim ond aros` (just wait). Verb-noun follows; same construction.",
      "More emphatic than `yn unig` (alone/solely), which goes after the noun: `fi'n unig` (just me, by myself). Subtle distinction.",
    ],
  },

  // ── Pan / pryd — when ──
  {
    id: 'cy-pan-pryd',
    priority: 68,
    match: t => /\b(pan|pryd)\b/i.test(t),
    tips: [
      "`Pan` = 'when' in statements: `Pan ddes i, roedd hi'n cysgu` (When I came, she was sleeping). Triggers soft mutation on the next verb.",
      "`Pryd` = 'when' in questions: `Pryd wyt ti'n dod?` (When are you coming?). Two different words for two roles.",
      "Don't mix them up — using `pryd` in a statement (or `pan` in a question) sounds off. English uses 'when' for both, Welsh splits the work.",
      "`Pan` often shifts the following verb: `Pan ges i amser` (When I had time) — `ces → ges` from soft mutation triggered by `pan`.",
    ],
  },

  // ── Yn ôl — back/again ──
  {
    id: 'cy-yn-ol',
    priority: 60,
    match: t => /\byn\s+ôl\b/i.test(t),
    tips: [
      "`Yn ôl` = 'back / according to': `mynd yn ôl` (to go back), `yn ôl yr hanes` (according to the story).",
      "Useful with time: `flwyddyn yn ôl` (a year ago), `awr yn ôl` (an hour ago). Welsh literally says 'a year back'.",
      "As 'according to': `yn ôl y BBC` (according to the BBC), `yn ôl Mam` (according to Mom). Quote a source.",
      "`Yn ôl` triggers no mutation. The phrase functions as a compound preposition or adverb depending on what it follows.",
    ],
  },

  // ── Cael — get/be ──
  {
    id: 'cy-cael-passive',
    priority: 78,
    match: t => /\b(cael|caf|cei|caiff|cawn|cewch|cânt|ces|cest|cafodd|cawson|cawsoch|cawsant)\b/i.test(t),
    tips: [
      "`Cael` = 'to get, receive'. Used to build the passive: `Cafodd y llyfr ei brynu` (the book was bought). Literally 'got its buying'.",
      "Passive structure: `cael + ei/eu + verb-noun`. The possessive (`ei/eu`) agrees with the subject's gender/number; the verb-noun stays as is.",
      "Past simple: `ces i, cest ti, cafodd e/hi, cawson ni, cawsoch chi, cawson nhw`. Irregular but very frequent.",
      "Also means 'to have' in some idioms: `cael cinio` (to have lunch), `cael cawod` (to have a shower). Watch context.",
    ],
  },

  // ── Eisiau — want ──
  {
    id: 'cy-eisiau-want',
    priority: 80,
    match: t => /\b(eisiau|isio|moyn)\b/i.test(t),
    tips: [
      "`Eisiau` (or northern `isio`, southern `moyn`) = 'to want'. `Dw i eisiau coffi` (I want coffee). No `yn` before `eisiau`!",
      "`Eisiau` is the major exception to the `yn`-rule. Even though `dw i eisiau` looks like it should have `'n`, it doesn't — `eisiau` is special.",
      "Want to do something: `eisiau + verb-noun`. `Dw i eisiau mynd` (I want to go). Direct, no preposition needed.",
      "Southern Welsh: `moyn` more common. `Dw i moyn coffi`. Same structure, just regional preference.",
    ],
  },

  // ── Common particles a/y/yr ──
  {
    id: 'cy-particle-y',
    priority: 35,
    match: t => /^(Y|Yr|A)\s+/i.test(t),
    tips: [
      "`Y` (before consonants) and `yr` (before vowels) = 'the'. Definite article, no plural form needed.",
      "`A` at sentence start (in questions, before verb) = question particle. Often dropped in spoken Welsh: `(A) wyt ti'n dod?`.",
      "Article `y` triggers soft mutation on feminine singular nouns: `y gath` (the cat — from `cath`). Masculine and plural stay as-is.",
      "Two `a`s to keep apart: `a` (and, aspirate trigger) vs `â` (with, also aspirate but different meaning). The accent distinguishes them.",
    ],
  },

  // ── Ti vs chi (informal singular vs formal / plural you) ────────
  {
    id: 'cy-ti-chi-formal',
    priority: 88,
    match: t => /\b(ti|chi|dy|eich|wyt|ydych|dych|dwyt|dydych)\b/i.test(t),
    tips: [
      "Welsh has TWO 'you's: `ti` (informal singular — friends, family, kids, God in prayer) and `chi` (formal singular AND plural). They use DIFFERENT verb forms: `wyt ti'n` (are you, informal) vs `ydych chi'n` (are you, formal/plural).",
      "`Chi` works as BOTH formal singular and plural (like English 'you' covers both). With one stranger → chi. With a group of friends → also chi. With one friend → ti.",
      "Possessives shift: `dy lyfr` (your book, informal — triggers soft mutation) vs `eich llyfr` (your book, formal/plural — no mutation). Same pattern across all your-pronouns.",
      "Welsh is less strict about formality than German or Russian. Many speakers default to `chi` with adults they don't know, but `ti` spreads quickly once you're on first-name terms.",
    ],
  },

];
