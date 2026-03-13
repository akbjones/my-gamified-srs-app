import { Language } from '../types';

/**
 * Node-level grammar nudges for the placement test.
 * Shown after revealing the English translation to prompt
 * the user to think about sentence structure, not just vocabulary.
 *
 * Per-language: each language gets nudges phrased for its own grammar.
 * Falls back to a generic English description if no entry exists.
 */

export const GRAMMAR_NUDGES: Partial<Record<Language, Record<string, string>>> = {
  spanish: {
    // ── A1 — Foundations ──────────────────────────────────────────
    'node-01': 'This sentence uses regular present tense — notice the -ar, -er, -ir verb endings for everyday actions.',
    'node-02': 'This sentence features an irregular present verb — stems change or forms are unique (soy, tengo, voy, hago, digo).',
    'node-03': 'This sentence distinguishes "ser" (identity, traits, origin) from "estar" (states, location, conditions).',
    'node-04': 'This sentence uses a question structure — notice the interrogative words (qué, cómo, dónde, cuándo) and inverted punctuation.',
    'node-05': 'This sentence demonstrates grammatical gender — nouns are masculine or feminine, and articles/adjectives must agree.',
    'node-06': 'This sentence uses a "reverse construction" verb like gustar — the thing liked is the subject, not the person.',
    'node-07': 'This sentence uses descriptive language — adjectives, "hay" (there is/are), colors, sizes, and basic characterization.',
    'node-08': 'This sentence uses a common expression — greetings, numbers, time, weather, or fixed everyday phrases.',

    // ── A2 — Past & Pronouns ──────────────────────────────────────
    'node-09': 'This sentence uses the preterite with regular verbs — completed, one-time past actions with standard -é/-aste/-ó endings.',
    'node-10': 'This sentence uses an irregular preterite form — verbs with stem changes (tuvo, hizo, fue, dijo, puso) in the past.',
    'node-11': 'This sentence uses the imperfect tense — habitual, ongoing, or background actions in the past (-aba/-ía endings).',
    'node-12': 'This sentence contrasts preterite vs imperfect — deciding which past tense fits based on completion vs background.',
    'node-13': 'This sentence uses a reflexive verb — the action is performed on oneself (me lavo, se despierta, nos sentamos).',
    'node-14': 'This sentence distinguishes "por" (cause, exchange, duration) from "para" (purpose, destination, deadline).',
    'node-15': 'This sentence uses object pronouns — direct (lo, la, los, las), indirect (le, les), or combined placement.',

    // ── B1 — Moods & Complex Tenses ──────────────────────────────
    'node-16': 'This sentence uses the present subjunctive — triggered by wishes, doubts, emotions, or hypothetical situations.',
    'node-17': 'This sentence uses the imperative — giving commands, instructions, or polite requests (tú, usted, nosotros forms).',
    'node-18': 'This sentence uses the conditional — expressing what would happen, polite requests, or hypothetical outcomes.',
    'node-19': 'This sentence uses the simple future tense — upcoming actions, plans, or probability (hablaré, tendrá, iremos).',
    'node-20': 'This sentence uses a relative clause — "que", "quien", "donde", or "cuyo" to connect and describe within clauses.',
    'node-21': 'This sentence uses a compound tense — haber + participle for pluperfect, future perfect, or conditional perfect.',

    // ── B2 — Advanced Grammar ─────────────────────────────────────
    'node-22': 'This sentence uses the imperfect subjunctive — hypothetical past, wishes, or "si" clauses (-ara/-iera endings).',
    'node-23': 'This sentence uses a complex conditional — "si hubiera…, habría…" (if X had happened, Y would have happened).',
    'node-24': 'This sentence uses a passive or impersonal construction — "se" as a marker for general statements or passive voice.',
    'node-25': 'This sentence uses advanced discourse connectors — sin embargo, no obstante, por lo tanto, a pesar de que, etc.',
    'node-26': 'This sentence uses a verb phrase — llevar + gerund, acabar de + infinitive, ponerse a + infinitive, and similar.',
    'node-27': 'This sentence uses reported speech (estilo indirecto) — conveying what someone said with tense and reference shifts.',

    // ── C1 — Refinement ───────────────────────────────────────────
    'node-28': 'This sentence explores subjunctive nuances — mood contrasts with "como si", "el hecho de que", or "no creo que".',
    'node-29': 'This sentence uses formal or literary register — usted forms, passato remoto, academic markers, or elevated style.',
    'node-30': 'This sentence uses an idiomatic expression — proverbs, fixed phrases, or colloquial constructions of native speakers.',
    'node-31': 'This sentence uses complex syntax — participial clauses, multiple subordination, or nominalization patterns.',

    // ── C2 — Mastery ──────────────────────────────────────────────
    'node-32': 'This sentence uses literary tenses or narrative style — literary past, poetic register, or storytelling constructions.',
    'node-33': 'This sentence uses academic or professional discourse — formal argumentation, technical register, structured reasoning.',
    'node-34': 'This sentence reflects cultural fluency — culturally embedded expressions, regional variation, or proverb usage.',
    'node-35': 'This sentence combines multiple advanced patterns — near-native complexity across grammar, register, and idiom.',
  },
  italian: {
    // ── A1 — Foundations ──────────────────────────────────────────
    'node-01': 'This sentence uses the presente indicativo — regular -are, -ere, -ire verb conjugation for everyday actions.',
    'node-02': 'This sentence features an irregular present verb — unique forms like sono, ho, vado, faccio, dico, vengo.',
    'node-03': 'This sentence distinguishes "essere" (identity, origin) from "stare" (states, conditions, progressive).',
    'node-04': 'This sentence uses a question structure — interrogative words (che, come, dove, quando, perché) and word order.',
    'node-05': 'This sentence demonstrates articles and gender — il/lo/la/i/gli/le agree with nouns in gender and number.',
    'node-06': 'This sentence uses a "reverse construction" verb like piacere — the thing liked is the subject, not the person.',
    'node-07': 'This sentence uses descriptive language — adjectives, "c\'è/ci sono" (there is/are), and basic characterization.',
    'node-08': 'This sentence uses a common expression — greetings, numbers, time, weather, or fixed everyday phrases.',

    // ── A2 — Past & Pronouns ──────────────────────────────────────
    'node-09': 'This sentence uses the passato prossimo with regular verbs — avere/essere + regular past participles (-ato/-uto/-ito).',
    'node-10': 'This sentence uses an irregular passato prossimo — irregular participles (fatto, detto, scritto) or essere-verbs.',
    'node-11': 'This sentence uses the imperfetto — habitual, ongoing, or background actions in the past (-avo/-evo/-ivo endings).',
    'node-12': 'This sentence contrasts passato prossimo vs imperfetto — choosing the right past tense for the context.',
    'node-13': 'This sentence uses a reflexive verb — the action is performed on oneself (mi lavo, si sveglia, ci sediamo).',
    'node-14': 'This sentence distinguishes "per" (purpose, duration, exchange) from "da" (origin, agent, since, at someone\'s place).',
    'node-15': 'This sentence uses object pronouns — direct (lo, la, li, le), indirect (gli, le), combined, ne, and ci.',

    // ── B1 — Moods & Complex Tenses ──────────────────────────────
    'node-16': 'This sentence uses the congiuntivo presente — triggered by opinions, emotions, doubt, or necessity (che + subjunctive).',
    'node-17': 'This sentence uses the imperativo — commands and requests. Negative tu-form uses "non" + infinitive.',
    'node-18': 'This sentence uses the condizionale — expressing what would happen, polite requests, or hypothetical outcomes.',
    'node-19': 'This sentence uses the futuro semplice — upcoming actions, plans, or conjecture/probability.',
    'node-20': 'This sentence uses a relative clause — "che", "cui", "il quale", or "dove" to connect and describe.',
    'node-21': 'This sentence uses a compound tense — avere/essere + participle for trapassato, futuro anteriore, or condizionale passato.',

    // ── B2 — Advanced Grammar ─────────────────────────────────────
    'node-22': 'This sentence uses the congiuntivo imperfetto — hypothetical past, wishes, or "se" clauses (-assi/-essi/-issi).',
    'node-23': 'This sentence uses a complex periodo ipotetico — "se avessi…, avrei…" (if X had happened, Y would have happened).',
    'node-24': 'This sentence uses a passive or impersonal construction — "si" impersonale or "venire" + past participle.',
    'node-25': 'This sentence uses advanced discourse connectors — tuttavia, pertanto, nonostante, malgrado, purché, etc.',
    'node-26': 'This sentence uses a verb phrase — stare per + infinitive, mettersi a, finire di, continuare a, and similar.',
    'node-27': 'This sentence uses reported speech (discorso indiretto) — conveying what someone said with tense and reference shifts.',

    // ── C1 — Refinement ───────────────────────────────────────────
    'node-28': 'This sentence explores congiuntivo nuances — mood contrasts with "come se", "il fatto che", or "non credo che".',
    'node-29': 'This sentence uses formal or literary register — Lei form, passato remoto, academic markers, or elevated style.',
    'node-30': 'This sentence uses an idiomatic expression — proverbs, fixed phrases, or colloquial constructions of native speakers.',
    'node-31': 'This sentence uses complex syntax — participial clauses, multiple subordination, or nominalization patterns.',

    // ── C2 — Mastery ──────────────────────────────────────────────
    'node-32': 'This sentence uses literary tenses or narrative style — passato remoto in prose, poetic register, or narrative forms.',
    'node-33': 'This sentence uses academic or professional discourse — formal argumentation, technical register, structured reasoning.',
    'node-34': 'This sentence reflects cultural fluency — culturally embedded expressions, regional variation, or proverb usage.',
    'node-35': 'This sentence combines multiple advanced patterns — near-native complexity across grammar, register, and idiom.',
  },
  french: {
    // ── A1 — Foundations ──────────────────────────────────────────
    'node-01': 'This sentence uses regular present tense — notice the -er, -ir, -re verb endings for everyday actions.',
    'node-02': 'This sentence features an irregular present verb — unique stems or forms (suis, ai, vais, fais, dis, vois).',
    'node-03': 'This sentence contrasts "être" (identity, origin, state) with "avoir" (possession, age, avoir-expressions like j\'ai faim).',
    'node-04': 'This sentence uses a question structure — est-ce que, inversion, or interrogative words (qui, que, où, comment, pourquoi).',
    'node-05': 'This sentence demonstrates articles and gender — le/la/les, un/une/des, du/de la (partitive), and adjective agreement.',
    'node-06': 'This sentence uses a "reverse construction" verb like plaire — the thing liked is the subject, not the person (ça me plaît).',
    'node-07': 'This sentence uses descriptive language — adjectives, "il y a" (there is/are), colors, sizes, and characterization.',
    'node-08': 'This sentence uses a common expression — greetings, numbers, time, weather, or fixed everyday phrases.',

    // ── A2 — Past & Pronouns ──────────────────────────────────────
    'node-09': 'This sentence uses the passé composé with regular verbs — avoir/être + past participle (-é/-i/-u).',
    'node-10': 'This sentence uses an irregular passé composé — irregular participles (fait, dit, vu, pris, mis) or être-verbs.',
    'node-11': 'This sentence uses the imparfait — habitual, ongoing, or background actions in the past (-ais/-ait/-ions endings).',
    'node-12': 'This sentence contrasts passé composé vs imparfait — choosing the right past tense based on completion vs background.',
    'node-13': 'This sentence uses a reflexive verb — "se" + verb where the action is performed on oneself (se laver, se réveiller).',
    'node-14': 'This sentence distinguishes "pour" (purpose, destination, in favor of) from "par" (means, agent, through, per).',
    'node-15': 'This sentence uses object pronouns — direct (le, la, les), indirect (lui, leur), y, en, and pronoun placement.',

    // ── B1 — Moods & Complex Tenses ──────────────────────────────
    'node-16': 'This sentence uses the subjonctif présent — triggered by wishes, doubt, emotions, necessity (il faut que, je veux que).',
    'node-17': 'This sentence uses the impératif — commands and requests. Negative uses "ne…pas" around the verb.',
    'node-18': 'This sentence uses the conditionnel — expressing what would happen, polite requests, or hypothetical outcomes.',
    'node-19': 'This sentence uses the futur simple — upcoming actions, plans, or predictions (je parlerai, il viendra, nous irons).',
    'node-20': 'This sentence uses a relative clause — "qui", "que", "dont", "où", or "lequel" to connect and describe.',
    'node-21': 'This sentence uses a compound tense — avoir/être + participle for plus-que-parfait, futur antérieur, or conditionnel passé.',

    // ── B2 — Advanced Grammar ─────────────────────────────────────
    'node-22': 'This sentence uses the subjonctif imparfait — literary past subjunctive or formal registers (-asse/-isse/-usse).',
    'node-23': 'This sentence uses a complex conditional — "si j\'avais…, j\'aurais…" (if X had happened, Y would have happened).',
    'node-24': 'This sentence uses a passive or impersonal construction — "on" as impersonal, "être" + past participle, or "il est" structures.',
    'node-25': 'This sentence uses advanced discourse connectors — cependant, néanmoins, par conséquent, malgré, bien que, etc.',
    'node-26': 'This sentence uses a verb phrase — venir de + infinitive, être en train de, se mettre à, finir par, and similar.',
    'node-27': 'This sentence uses reported speech (discours indirect) — conveying what someone said with tense and reference shifts.',

    // ── C1 — Refinement ───────────────────────────────────────────
    'node-28': 'This sentence explores subjonctif nuances — mood contrasts with "comme si", "le fait que", or "je ne pense pas que".',
    'node-29': 'This sentence uses formal or literary register — vous form, elevated vocabulary, academic markers, or written style.',
    'node-30': 'This sentence uses an idiomatic expression — proverbs, fixed phrases, or colloquial constructions of native speakers.',
    'node-31': 'This sentence uses complex syntax — participial clauses, multiple subordination, or nominalization patterns.',

    // ── C2 — Mastery ──────────────────────────────────────────────
    'node-32': 'This sentence uses the passé simple or literary tenses — literary narrative past, rarely used in speech.',
    'node-33': 'This sentence uses academic or professional discourse — formal argumentation, technical register, structured reasoning.',
    'node-34': 'This sentence reflects cultural fluency — culturally embedded expressions, regional variation, or proverb usage.',
    'node-35': 'This sentence combines multiple advanced patterns — near-native complexity across grammar, register, and idiom.',
  },
  portuguese: {
    // ── A1 — Foundations ──────────────────────────────────────────
    'node-01': 'Regular -ar/-er/-ir verbs follow predictable patterns in the present tense.',
    'node-02': 'Irregular present verbs have unique stems or endings (sou, tenho, vou, faço, digo).',
    'node-03': '"Ser" expresses identity, origin, and traits; "estar" expresses states, location, and conditions.',
    'node-04': 'Question words (o que, como, onde, quando, por que) form the basis of everyday questions.',
    'node-05': 'Nouns are masculine or feminine; articles (o/a/os/as, um/uma) and adjectives must agree.',
    'node-06': '"Gostar de" and similar verbs use an indirect construction — the person likes, not the thing.',
    'node-07': 'Adjectives, "tem/há" (there is/are), colors, and sizes describe people and things.',
    'node-08': 'Greetings, numbers, time, weather, and fixed everyday phrases used in daily life.',

    // ── A2 — Past & Pronouns ──────────────────────────────────────
    'node-09': 'Regular pretérito perfeito uses standard endings (-ei/-ou/-amos/-aram) for completed past actions.',
    'node-10': 'Irregular pretérito perfeito has stem changes (fez, foi, teve, disse, pôs) in the past.',
    'node-11': 'Pretérito imperfeito describes habitual, ongoing, or background actions in the past (-ava/-ia endings).',
    'node-12': 'Choosing between perfeito (completed) and imperfeito (ongoing/habitual) depends on the context.',
    'node-13': 'Reflexive verbs use "se" — the action is performed on oneself (me lavo, se levanta, nos sentamos).',
    'node-14': '"Por" indicates cause, exchange, or duration; "para" indicates purpose, destination, or deadline.',
    'node-15': 'Object pronouns (me, te, o/a, lhe, nos) replace direct and indirect objects in a sentence.',

    // ── B1 — Moods & Complex Tenses ──────────────────────────────
    'node-16': 'Present subjunctive is triggered by wishes, doubts, emotions, or hypothetical situations (que eu fale).',
    'node-17': 'Imperative forms give commands and instructions — affirmative and negative forms differ.',
    'node-18': 'Conditional expresses what would happen, polite requests, or hypothetical outcomes (-ia endings).',
    'node-19': 'Future tense covers upcoming actions, plans, or probability (falarei, terá, iremos).',
    'node-20': 'Relative clauses use "que", "quem", "onde", or "cujo" to connect and describe within clauses.',
    'node-21': 'Compound tenses use ter + participle for pluperfect, future perfect, or conditional perfect.',

    // ── B2 — Advanced Grammar ─────────────────────────────────────
    'node-22': 'Imperfect subjunctive handles hypothetical past, wishes, or "se" clauses (-asse/-esse/-isse endings).',
    'node-23': 'Complex conditionals use "se tivesse…, teria…" (if X had happened, Y would have happened).',
    'node-24': 'Passive voice uses "ser + participle"; impersonal "se" marks general statements.',
    'node-25': 'Advanced connectors include porém, contudo, portanto, apesar de, embora, no entanto.',
    'node-26': 'Verb phrases combine verbs: acabar de + infinitive, estar a + infinitive, começar a + infinitive.',
    'node-27': 'Reported speech (discurso indireto) conveys what someone said with tense and reference shifts.',

    // ── C1 — Refinement ───────────────────────────────────────────
    'node-28': 'Subjunctive nuances involve mood contrasts with "como se", "o facto de que", or "não creio que".',
    'node-29': 'Formal register uses "o senhor/a senhora", elevated vocabulary, and academic markers.',
    'node-30': 'Idiomatic expressions, proverbs, and colloquial constructions reflect native-speaker fluency.',
    'node-31': 'Complex syntax includes participial clauses, multiple subordination, and nominalization.',

    // ── C2 — Mastery ──────────────────────────────────────────────
    'node-32': 'Literary tenses (pretérito mais-que-perfeito simples) and narrative style appear in formal writing.',
    'node-33': 'Academic discourse uses formal argumentation, technical register, and structured reasoning.',
    'node-34': 'Cultural fluency involves culturally embedded expressions, regional variation, and proverb usage.',
    'node-35': 'Advanced mastery combines multiple patterns — near-native complexity across grammar, register, and idiom.',
  },
  german: {
    // ── A1 — Foundations ──────────────────────────────────────────
    'node-01': 'This sentence uses greetings or introductions — everyday phrases for meeting people and basic social interaction.',
    'node-02': 'This sentence uses regular present tense — notice the verb endings: -e, -st, -t, -en for standard verbs.',
    'node-03': 'This sentence contrasts "sein" (identity, traits, location) with "haben" (possession, age, expressions like "ich habe Hunger").',
    'node-04': 'This sentence demonstrates grammatical gender — German nouns are der (masculine), die (feminine), or das (neuter), and articles must agree.',
    'node-05': 'This sentence shows V2 word order — in German main clauses, the conjugated verb ALWAYS goes in second position.',
    'node-06': 'This sentence uses the accusative case — direct objects and certain prepositions (für, durch, gegen, ohne, um) trigger accusative.',
    'node-07': 'This sentence involves food, drink, or ordering — vocabulary and phrases used in restaurants, cafés, and shops.',
    'node-08': 'This sentence uses a separable verb — the prefix detaches in main clauses: "aufmachen" → "Ich mache die Tür auf."',
    'node-09': 'This sentence uses the Perfekt (present perfect) — haben/sein + past participle for completed past actions.',
    'node-10': 'This sentence uses the dative case — indirect objects and prepositions like mit, bei, nach, aus, zu, von, seit trigger dative.',
    'node-11': 'This sentence uses a modal verb — können, müssen, dürfen, sollen, wollen, or mögen. The main verb goes to the end as infinitive.',
    'node-12': 'This sentence involves time expressions and daily routine — clock times, days, habits, and scheduling vocabulary.',
    'node-13': 'This sentence uses negation — "nicht" negates verbs/adjectives/adverbs; "kein" negates nouns (replaces ein/eine).',
    'node-14': 'This sentence uses a two-way preposition (in, an, auf, über, unter, vor, hinter, neben, zwischen) — accusative for motion, dative for location.',
    'node-15': 'This sentence uses pronouns or reflexive verbs — personal pronouns change by case; reflexive verbs use sich/mich/dich.',

    // ── A2 — Expanding Grammar ──────────────────────────────────
    'node-16': 'This sentence uses comparatives or superlatives — mehr/weniger, -er ending, am -sten, or irregular forms (besser, am besten).',
    'node-17': 'This sentence involves directions and transport — navigation, public transit, and movement vocabulary.',
    'node-18': 'This sentence uses a subordinate clause — conjunctions like weil, dass, wenn, ob, als push the verb to the END of the clause.',
    'node-19': 'This sentence uses the imperative — commands and requests in du, ihr, or Sie form.',
    'node-20': 'This sentence uses adjective endings — adjectives before nouns get endings based on gender, case, and article type (strong/weak/mixed).',

    // ── B1 — Intermediate ───────────────────────────────────────
    'node-21': 'This sentence uses the genitive case — showing possession ("des Mannes", "der Frau") or with genitive prepositions (wegen, trotz, während).',
    'node-22': 'This sentence uses a relative clause — "der/die/das" as relative pronouns, with the verb at the end of the clause.',
    'node-23': 'This sentence uses the passive voice — "werden + past participle" where the subject receives the action.',
    'node-24': 'This sentence uses Konjunktiv II — "würde + infinitive" or stem-changed forms (wäre, hätte, könnte) for hypotheticals and polite requests.',
    'node-25': 'This sentence uses Konjunktiv I (indirect speech) — conveying what someone said: "Er sagt, er sei krank."',
    'node-26': 'This sentence uses an infinitive construction — "um…zu" (in order to), "ohne…zu" (without), "statt…zu" (instead of).',
    'node-27': 'This sentence uses advanced connectors — obwohl, trotzdem, allerdings, dennoch, außerdem, deshalb, and similar.',

    // ── B2 — Advanced ───────────────────────────────────────────
    'node-28': 'This sentence features noun compounds — German builds complex words by joining nouns: Handschuh (hand+shoe = glove).',
    'node-29': 'This sentence uses an extended adjective construction — participial attributes before the noun create dense, literary phrases.',
    'node-30': 'This sentence uses a double infinitive or complex verb chain — modal verbs in perfect tense keep infinitive form.',
    'node-31': 'This sentence uses formal register — elevated vocabulary, complex structures, and professional or academic tone.',
    'node-32': 'This sentence uses an idiomatic expression — proverbs, fixed phrases, or figurative constructions common among native speakers.',

    // ── C1/C2 — Mastery ─────────────────────────────────────────
    'node-33': 'This sentence uses advanced subjunctive — "als ob" + Konjunktiv II, complex hypotheticals, or literary subjunctive forms.',
    'node-34': 'This sentence uses academic or professional German — formal argumentation, technical register, or structured discourse.',
    'node-35': 'This sentence uses modal particles (doch, mal, ja, eben, halt, schon) — subtle words that add nuance and speaker attitude.',
  },
  dutch: {
    'node-01': 'This sentence uses basic greetings — "hallo", "goedemorgen", "hoe gaat het?" are daily essentials in Dutch.',
    'node-02': 'This sentence uses a regular present-tense verb — Dutch verbs drop -en and add -t for jij/hij: werken → ik werk, hij werkt.',
    'node-03': 'This sentence uses zijn (to be) or hebben (to have) — the two most important Dutch verbs with irregular forms.',
    'node-04': 'This sentence involves article choice — Dutch has "de" (common) and "het" (neuter). There\'s no reliable rule; you memorize each noun\'s gender.',
    'node-05': 'This sentence shows V2 word order — the conjugated verb must be the second element in main clauses, even after time or place phrases.',
    'node-06': 'This sentence uses numbers or time expressions — Dutch tells time with "half" meaning half TO the next hour: "half drie" = 2:30.',
    'node-07': 'This sentence is about food or ordering — "lekker" (tasty) and "alstublieft" (please) are essential restaurant Dutch.',
    'node-08': 'This sentence uses a separable verb — the prefix detaches in main clauses: "opbellen" → "Ik bel je op." The prefix goes to the end.',
    'node-09': 'This sentence uses the perfectum — hebben/zijn + past participle. Most verbs use hebben; motion/state-change verbs use zijn.',
    'node-10': 'This sentence uses object pronouns — me/mij, je/jou, hem, haar, ons, jullie, hen/hun. Short forms are common in speech.',
    'node-11': 'This sentence uses a modal verb — kunnen (can), moeten (must), mogen (may), willen (want). The main verb goes to the end as infinitive.',
    'node-12': 'This sentence involves daily routine or reflexive verbs — "zich wassen" (to wash oneself), "zich aankleden" (to get dressed).',
    'node-13': 'This sentence uses negation — "niet" negates verbs/adjectives/adverbs, "geen" negates indefinite nouns: "Ik heb geen tijd."',
    'node-14': 'This sentence uses prepositions — "in", "op", "aan", "bij", "met", "voor" each have specific spatial and abstract uses in Dutch.',
    'node-15': 'This sentence uses adjective agreement or comparison — adjectives before de-words get -e, before het-words with een: no -e. Comparatives add -er.',
    'node-16': 'This sentence uses the imperfectum (simple past) — weak verbs add -te/-de based on the \'t kofschip rule; strong verbs change their vowel.',
    'node-17': 'This sentence involves directions or transport — "links", "rechts", "rechtdoor", and Dutch cycling culture vocabulary.',
    'node-18': 'This sentence has a subordinate clause — after dat, omdat, als, wanneer, the verb goes to the END of the clause.',
    'node-19': 'This sentence uses the imperative — just use the verb stem: "Kom!" (Come!), "Wacht even!" (Wait a moment!).',
    'node-20': 'This sentence uses a diminutive — -je, -tje, -pje, -etje, -kje make things small/cute. Dutch uses diminutives far more than English.',
    'node-21': 'This sentence uses a relative clause — "die" for de-words, "dat" for het-words. The verb goes to the end of the relative clause.',
    'node-22': 'This sentence uses the passive voice — worden + past participle (action) or zijn + past participle (state/result).',
    'node-23': 'This sentence uses "er" — one of the trickiest Dutch words. It can mean "there", "of it", or be a placeholder subject.',
    'node-24': 'This sentence uses future (zullen + infinitive) or conditional (zou/zouden + infinitive) to express plans or hypotheticals.',
    'node-25': 'This sentence uses advanced connectors — "hoewel" (although), "zodra" (as soon as), "tenzij" (unless) with verb-final order.',
    'node-26': 'This sentence uses an infinitive construction — "om te + infinitive" expresses purpose: "Ik ga naar de winkel om boodschappen te doen."',
    'node-27': 'This sentence uses reported speech — Dutch shifts tense back like English: "Hij zei dat hij ziek was" (He said he was sick).',
    'node-28': 'This sentence uses a Dutch idiom — expressions like "de kat uit de boom kijken" (wait and see) add color to your Dutch.',
    'node-29': 'This sentence shows formal (u) vs informal (je/jij) register — "u" is for strangers, officials, elders; "je" for friends and peers.',
    'node-30': 'This sentence features compound words — Dutch freely combines nouns: "zonnebloem" (sunflower), "huissleutel" (house key).',
    'node-31': 'This sentence demonstrates advanced word order — multiple verbs cluster at the end, and inversion after adverbial phrases.',
    'node-32': 'This sentence uses literary or formal written Dutch — structures rarely heard in speech but common in books and newspapers.',
    'node-33': 'This sentence uses academic Dutch — formal argumentation, hedging, and structured discourse for professional contexts.',
    'node-34': 'This sentence reflects Dutch culture — "gezelligheid", directness, and cultural references that show deep familiarity.',
    'node-35': 'This sentence combines multiple advanced structures — subordination, particle verbs, and idiomatic usage at near-native level.',
  },
  // swedish: add when that language gets a deck
};

/** Get a grammar nudge for a node in the given language. Falls back to Spanish, then empty string. */
export function getGrammarNudge(nodeId: string, lang: Language): string {
  return GRAMMAR_NUDGES[lang]?.[nodeId]
    ?? GRAMMAR_NUDGES.spanish?.[nodeId]
    ?? '';
}
