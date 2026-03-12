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
  // german / dutch / portuguese / swedish: add when those languages get decks
};

/** Get a grammar nudge for a node in the given language. Falls back to Spanish, then empty string. */
export function getGrammarNudge(nodeId: string, lang: Language): string {
  return GRAMMAR_NUDGES[lang]?.[nodeId]
    ?? GRAMMAR_NUDGES.spanish?.[nodeId]
    ?? '';
}
