#!/usr/bin/env node
/**
 * Grammar Tips Audit Script
 *
 * Fixes or removes bad grammar tips across Spanish and Italian decks.
 * Categories of fixes:
 * 1. translation_only → remove (no grammar content)
 * 2. vague ser/estar → rewrite with proper explanations
 * 3. oversimplified → rewrite with accurate rules
 * 4. incomplete → expand or remove depending on subcategory
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ─── SER / ESTAR REWRITES ─────────────────────────────────────────────────────
const SER_ESTAR_MAP = {
  // SER uses
  'Ser for professions': 'Ser + profession: "Es médico." Ser defines what someone IS (identity/role), not how they feel.',
  'Ser for personality traits': 'Ser + personality: "Es amable." Ser describes character — who someone is by nature.',
  'Ser for personality': 'Ser + personality: "Es amable." Ser describes character — who someone is by nature.',
  'Ser for physical descriptions': 'Ser + physical traits: "Es alto." Ser for characteristics seen as defining, not temporary.',
  'Ser for events/occasions': 'Ser for events: "La fiesta es en mi casa." Events use ser for when/where they take place.',
  'Ser for events': 'Ser for events: "La fiesta es en mi casa." Events use ser for when/where they take place.',
  'Ser for scheduled events': 'Ser for scheduled events: "La reunión es a las 3." Use ser for when/where events happen.',
  'Ser for status': 'Ser for civil status: "Es soltero." Marital status uses ser — it defines identity, not a passing state.',
  'Ser for marital status': 'Ser for civil status: "Es casada." Marital status uses ser — it defines identity, not a passing state.',
  'Ser for relationship': 'Ser for relationships: "Es mi hermano." Ser defines who someone is to you.',
  'Ser for origin': 'Ser + de for origin: "Es de México." Where you come from is part of identity → ser.',
  'Ser for inherent quality': 'Ser for inherent qualities: "El hielo es frío." Use ser for properties that define what something IS.',
  'Ser for defining characteristics': 'Ser for defining characteristics: "El hielo es frío." Properties that define what something IS use ser.',
  'Ser for characteristics': 'Ser for characteristics: traits that define what something IS use ser, not estar.',
  'Ser for permanent features': 'Ser for defining features: "La casa es grande." Ser for traits seen as defining, not temporary.',
  'Ser for classification': 'Ser for classification: "Es un mamífero." Use ser to say what category something belongs to.',
  'Ser for roles/titles': 'Ser for roles: "Es el director." Ser defines what someone IS (identity/title).',
  'Ser for material': 'Ser + de for material: "Es de madera." What something is made of uses ser + de.',
  'Ser for language of content': 'Ser for identity: "La carta es en español." Ser defines what something IS.',
  'Ser for color': 'Ser for inherent color: "El cielo es azul." Use ser for colors seen as defining traits.',
  'Ser for price classification': 'Ser for price: "Es barato." Use ser to classify something as cheap/expensive in general.',
  'Ser for inherent facts': 'Ser for inherent facts: use ser for truths that define what something IS.',
  'Ser for time': 'Ser for time: "Son las tres." Time always uses ser.',
  'Ser for time expressions': 'Ser for time: "Son las tres." Time always uses ser.',
  'Ser for identity': 'Ser for identity: "Soy Ana." Use ser to say WHO or WHAT something is.',

  // ESTAR uses
  'Estar for location': 'Estar for location: "Está en Madrid." Physical position always uses estar (except events).',
  'Estar for location of objects': 'Estar for location: "Las llaves están en la mesa." Where something physically IS uses estar.',
  'Estar for temporary state': 'Estar for states/conditions: "Está cansado." Estar describes how someone feels or a resulting condition — not who they are.',
  'Estar for temporary states': 'Estar for states/conditions: "Está cansado." Estar describes how someone feels or a resulting condition — not who they are.',
  'Estar for temporary conditions': 'Estar for conditions: "Está roto." Use estar for the current state/condition of something.',
  'Estar for resulting state': 'Estar for resulting states: "Está roto." The door isn\'t broken by nature — it became broken. Result of change → estar.',
  'Estar for resulting states': 'Estar for resulting states: "Está cerrado." Use estar for states that result from an action or change.',
  'Estar for current condition': 'Estar for current condition: "¿Cómo estás?" How someone IS right now (condition, mood, health) → estar.',
  'Estar for condition': 'Estar for condition: "Está enfermo." Current health or state → estar.',
  'Estar for emotional state': 'Estar for emotions: "Está triste." How someone FEELS right now → estar (not who they are).',
  'Estar for emotional reactions': 'Estar for reactions: "Estoy sorprendido." Emotional reactions to events → estar.',
  'Estar for emotions about events': 'Estar for reactions: "Estoy contento de que..." Emotional reactions to specific situations → estar.',
  'Estar for temporary appearance': 'Estar for appearance now: "Estás muy guapa hoy." How someone LOOKS right now (vs. ser for general beauty).',
  'Estar for experience/taste': 'Estar for taste/experience: "La sopa está rica." How something tastes/seems RIGHT NOW → estar.',
  'Estar for position': 'Estar for position: "Está sentado." Physical posture or position → estar.',
  'Estar for readiness': 'Estar for readiness: "Está listo." Ready = a current state → estar. (Compare: "Es listo" = clever, with ser.)',
  'Estar for health conditions': 'Estar for health: "Está enfermo." Current health condition → estar.',
  'Estar for current temperature': 'Estar for current state: "El café está frío." How something IS right now → estar.',
  'Estar for dates': 'Estar for dates: "Estamos a 15 de marzo." The current date uses estar.',
  'Estar for temporary certainty': 'Estar + adjective for current state: "Estoy seguro." How you feel right now → estar.',

  // Combined
  'Ser for origin, estar + gerund for ongoing action': 'Ser + de for origin ("Es de España"), estar + gerund for actions in progress ("Está hablando"). Two different uses in one sentence.',
  'Ser for general truths, estar for temporary emotions': 'Ser describes what defines something ("El agua es fría" = water is cold by nature). Estar describes current states ("El agua está fría" = this water is cold right now).',
  'Ser for permanent traits: es amable = is kind.': 'Ser + personality adjective: "Es amable" = kind by nature. Ser describes character — who someone is, not how they currently feel.',
  'Estar in fixed expressions': 'Some expressions always use estar regardless of the general rules: "estar de acuerdo" (agree), "estar a punto de" (about to).',
};

// ─── GUSTAR-PATTERN VERBS ──────────────────────────────────────────────────────
const GUSTAR_EXPLANATION = (verb) =>
  `"${verb}" uses the gustar pattern: the thing causing the feeling is the subject. "Me ${verb.toLowerCase().replace(/\s.*/, '')}..." = "... is [feeling] to me." Use singular for one thing, plural for multiple.`;

const GUSTAR_VERBS = [
  'Fascinar', 'Interesar', 'Faltar', 'Sorprender', 'Doler', 'Sobrar',
  'Quedar', 'Preocupar', 'Aburrir', 'Convenir', 'Hacer falta', 'Parecer',
  'Dar miedo', 'Llamar la atención', 'Dar vergüenza', 'Extrañar',
  'Salir + adjective', 'Sentar bien/mal', 'Tocar', 'Resultar',
  'Dar pereza', 'Hacer ilusión', 'Hacer gracia', 'Dar pena', 'Flipar',
  'Importar',
];

// ─── POR / PARA REWRITES ──────────────────────────────────────────────────────
const POR_PARA_MAP = {
  // Por
  'Por for cause / reason': '"Por" = because of / due to. Expresses the cause or motive behind something: "Llegué tarde por el tráfico."',
  'Por for cause': '"Por" = because of. Expresses what caused something: "Lo hice por ti" (I did it because of you).',
  'Por for cause / obstacle': '"Por" = because of. Expresses the cause or obstacle: "No salimos por la lluvia" (We didn\'t go out because of the rain).',
  'Por for duration of time': '"Por" for duration: "Estudié por dos horas." Por marks how long something lasted.',
  'Por for passing through / by a place': '"Por" = through/along: "Caminamos por el parque." Por for movement through or past a place.',
  'Por for movement through a place': '"Por" = through/along: "Caminamos por el parque." Por for movement through or past a place.',
  'Por for in search of / to get': '"Por" = to get/fetch: "Fui por pan." Going somewhere to pick something up.',
  'Por for in honor of': '"Por" = for the sake of / in honor of: "Brindamos por tu éxito."',
  'Por for multiplication': '"Por" in math: "Dos por tres son seis." Por for multiplication.',
  'Por for means of communication': '"Por" = via / by means of: "Lo dije por teléfono." Por for the method of communication.',
  'Por for means of transport / route': '"Por" = via / by way of: "Fuimos por la autopista." Por for the route or means of travel.',
  'Por for exchange / price paid': '"Por" = in exchange for: "Lo compré por diez euros." Por marks what you give to get something.',
  'Por for exchange / trade': '"Por" = in exchange for: "Cambié mi coche por uno nuevo." Por for swapping one thing for another.',
  'Por for general time of day': '"Por" for approximate time: "por la mañana" (in the morning), "por la noche" (at night). General time of day.',
  'Por for in search of': '"Por" = to go get: "Fui por el médico." Going in search of or to fetch.',

  // Para
  'Para for deadline': '"Para" = by/for (deadline): "Necesito esto para el lunes." Para sets the time limit.',
  'Para for destination': '"Para" = heading to: "Salgo para Madrid." Para for where you\'re going.',
  'Para for intended recipient': '"Para" = for (recipient): "Este regalo es para ti." Para marks who receives something.',
  'Para for employer / who you work for': '"Para" = for (employer): "Trabajo para Google." Para for who you work for.',
  'Para for considering / given that': '"Para" = considering: "Para ser niño, cocina muy bien." Surprising given the circumstances.',
  'Para for purpose; por for through': '"Para" = in order to (purpose). "Por" = through (place/means). Two different ideas.',

  // Quoted versions
  '"Por" — duration of time.': '"Por" for duration: "Estudié por dos horas." Por marks how long something lasted.',
  '"Por" — movement through a place.': '"Por" = through/along: "Caminamos por el parque." Por for movement through or past a place.',
  '"Por" — means of communication.': '"Por" = via: "Lo dije por teléfono." Por for the method of communication.',
  '"Por" — concern/about.': '"Por" = about / concerning: "Preguntó por ti." Por when asking or worrying about someone.',
  '"Por" — cause/reason.': '"Por" = because of: "Llegué tarde por el tráfico." Expresses the cause behind something.',
  '"Por" — general time of day.': '"Por" for approximate time: "por la mañana" (in the morning). General time of day, not a specific hour.',
  '"Por" — exchange.': '"Por" = in exchange for: "Lo compré por diez euros." Por marks what you give to get something.',
  '"Por" — price/exchange.': '"Por" = in exchange for: "Lo compré por diez euros." Por for what you pay or trade.',
  '"Por" — motivation/cause.': '"Por" = because of / motivated by: "Lo hice por amor." Por for the underlying cause or motivation.',
  '"Por" — on behalf of/because of.': '"Por" = on behalf of / because of: "Habló por todos nosotros." For speaking for someone or acting because of them.',
  '"Para" — deadline.': '"Para" = by (deadline): "Para el viernes." Para sets when something must be done.',
  '"Para" — destination.': '"Para" = heading to: "Salgo para Madrid." Para for where you\'re going.',
  '"Para" — recipient.': '"Para" = for (recipient): "Es para ti." Para marks who receives something.',
  '"Para" — purpose.': '"Para" = in order to: "Estudio para aprender." Para expresses the goal or purpose.',
  '"Para" — considering/in spite of.': '"Para" = considering: "Para ser nuevo, lo haces bien." Surprising given the circumstances.',
};

// ─── SUBJUNCTIVE TRIGGER REWRITES ──────────────────────────────────────────────
const SUBJUNCTIVE_MAP = {
  'Espero que + subjunctive — wish/hope trigger': 'Espero que + subjunctive: hoping about someone else\'s action triggers subjunctive. "Espero que vengas" (I hope you come).',
  'Es importante que + subjunctive — impersonal trigger': 'Es importante que + subjunctive: impersonal value judgments trigger subjunctive. "Es importante que estudies."',
  'Ojalá + subjunctive — wish/hope': 'Ojalá + subjunctive: expresses a wish. From Arabic "may God grant." "Ojalá llueva" (I hope it rains).',
  'Querer que + subjunctive — will/desire trigger': 'Querer que + subjunctive: wanting someone else to do something. "Quiero que vengas" (I want you to come). Different subjects → subjunctive.',
  'Negated truth claim + subjunctive': 'Negating a truth claim triggers subjunctive: "No creo que sea verdad." Denying certainty = uncertainty → subjunctive.',
  'Necesitar que + subjunctive': 'Necesitar que + subjunctive: needing someone else to act. "Necesito que me ayudes" (I need you to help me).',
  'Cuando + subjunctive for future actions': '"Cuando" + subjunctive for future: "Cuando llegues, llámame." When referring to future events, cuando triggers subjunctive.',
  'Es posible que + subjunctive — uncertainty': 'Es posible que + subjunctive: expressions of possibility trigger subjunctive. "Es posible que llueva."',
  'Subjunctive in adjective clause — unknown/nonexistent antecedent': 'Subjunctive in adjective clauses: when describing something unknown or that might not exist. "Busco alguien que hable francés."',
  'Pedir que + subjunctive — request': 'Pedir que + subjunctive: requesting someone do something. "Te pido que escuches." Requests about others\' actions → subjunctive.',
  'Emotion trigger + subjunctive': 'Emotions about someone else\'s actions trigger subjunctive: "Me alegra que estés aquí." The emotion is in the main clause, the trigger is in the que-clause.',
  'Aunque + subjunctive for hypothetical concession': 'Aunque + subjunctive = even if (hypothetical): "Aunque llueva, iré." Use subjunctive when the situation is hypothetical. Compare: aunque + indicative = although (fact).',
  'Dejar que + subjunctive — allowing': 'Dejar que + subjunctive: allowing someone to do something. "Deja que hable" (Let him speak).',
  'Es fundamental que + subjunctive': 'Es fundamental que + subjunctive: value judgments about necessity trigger subjunctive. "Es fundamental que entiendas."',
  'Puede que + subjunctive — possibility': 'Puede que + subjunctive = maybe/it\'s possible: "Puede que venga" (He might come). Possibility → subjunctive.',
  'Sin que + subjunctive': 'Sin que + subjunctive = without (someone doing something): "Salió sin que nadie lo viera." Always triggers subjunctive.',
  'Para que + subjunctive = so that': '"Para que" + subjunctive = so that: "Hablo despacio para que entiendas." Purpose involving another person → subjunctive.',
  'Puede que + subjunctive = maybe, it\'s possible that': 'Puede que + subjunctive = maybe: "Puede que llueva mañana." Expressing possibility always triggers subjunctive.',
  'A menos que + subjunctive = unless': '"A menos que" + subjunctive = unless: "Iré a menos que llueva." Conditions about uncertain events → subjunctive.',
  'Sin que + subjunctive = without (someone doing something)': '"Sin que" always triggers subjunctive: "Se fue sin que yo lo supiera" (He left without me knowing).',
  'Ojalá + imperfect subjunctive — wish unlikely to come true': 'Ojalá + imperfect subjunctive: a wish seen as unlikely. "Ojalá pudiera volar" (I wish I could fly). Past subjunctive = more remote/unlikely.',
  'Quería que + imperfect subjunctive — past wish/demand': 'Quería que + imperfect subjunctive: a past wish about someone else\'s action. "Quería que vinieras" (I wanted you to come).',
  'Quería que + imperfect subjunctive (supieras) — past wish/desire': 'Quería que + imperfect subjunctive: "Quería que lo supieras" (I wanted you to know). Past main clause + que → imperfect subjunctive.',
  'Emotion + que + imperfect subjunctive in past': 'Past emotion + que + imperfect subjunctive: "Me alegré de que estuvieras allí" (I was glad you were there). Past emotions → imperfect subjunctive.',
  'Impersonal expression + que + imperfect subjunctive': 'Past impersonal + que + imperfect subjunctive: "Era importante que estudiaras" (It was important that you studied). Past main clause → imperfect subjunctive.',
  'Esperaba que + subjunctive — hoping for uncertain outcome': 'Esperaba que + imperfect subjunctive: "Esperaba que llegaran" (I was hoping they\'d arrive). Past hope about uncertain outcome.',
  'Aconsejar que + imperfect subjunctive for past advice': 'Aconsejar que + imperfect subjunctive: "Me aconsejó que descansara" (She advised me to rest). Past advice → imperfect subjunctive.',
  'Como si + imperfect subjunctive = as if': '"Como si" always takes imperfect subjunctive: "Habla como si supiera todo" (He talks as if he knew everything).',
};

// ─── TENSE/ASPECT REWRITES ────────────────────────────────────────────────────
const TENSE_MAP = {
  'Imperfect for habitual past actions': 'Imperfect for habitual past: "Jugaba todos los días" (I used to play every day). Use imperfect for repeated past actions, routines, and "used to."',
  'Imperfect for descriptions in the past': 'Imperfect for past descriptions: "Era alto y tenía pelo negro." Use imperfect to set the scene — describing people, places, weather, time in the past.',
  'Imperfect for simultaneous actions': 'Imperfect for simultaneous past actions: "Mientras yo cocinaba, él leía." Two ongoing actions happening at the same time → both in imperfect.',
  'Imperfect for weather in the past': 'Imperfect for past weather: "Llovía mucho." Weather descriptions in the past use imperfect — they set the scene.',
  'Imperfect for time in the past': 'Imperfect for past time: "Eran las tres." Telling time in the past always uses imperfect.',
  'Present tense for scheduled departures': 'Present tense for scheduled events: "El tren sale a las 8." Spanish uses present tense for fixed schedules, like English "leaves at 8."',
  'Present tense for scheduled events': 'Present tense for scheduled events: "El tren sale a las 8." Spanish uses present tense for fixed schedules.',
  'Future tense for speculation / probability in present': 'Future for speculation: "¿Dónde estará?" (Where could he be?). Spanish uses future tense to guess about the present.',
  'Future for conjecture about present time': 'Future for conjecture: "Serán las tres" (It must be about 3). Spanish uses future tense to express guesses about the present.',
  'Future for probability / speculation about present': 'Future for probability: "Tendrá unos 30 años" (He must be about 30). The future tense can express guesses about now.',
  'Future for conjecture about someone\'s age': 'Future for guessing age: "Tendrá unos 40 años" (He must be about 40). Future tense = speculation about the present.',
  'Future perfect for assumption': 'Future perfect for assumption: "Ya habrá llegado" (He must have arrived by now). Future perfect = guessing about the recent past.',
  'Future perfect for completed action before a deadline': 'Future perfect for deadline: "Para junio habré terminado" (By June I\'ll have finished). Action completed before a future point.',
  'Future perfect for probability about recent past': 'Future perfect for guessing about the past: "Se habrá perdido" (He must have gotten lost). Speculation about what already happened.',
  'Future perfect for projected completion': 'Future perfect for projecting completion: "Para entonces ya habré terminado." Expressing that something will be done by a future time.',
  'Future perfect for speculation about unknown past event': 'Future perfect for past speculation: "¿Qué habrá pasado?" (What could have happened?). Guessing about past events.',
  'Future perfect for anticipated completion': 'Future perfect: "Habré terminado para las 5." Expresses an action that will be completed before a future moment.',
  'Present perfect — life experience': 'Present perfect (pretérito perfecto) for life experience: "He viajado a Japón." Have you ever done X? Life experience up to now.',
  'Past perfect — action completed before another past action': 'Past perfect (pluscuamperfecto): "Ya había comido cuando llegaste." An action completed BEFORE another past action.',
  'Past perfect — first-time experience in the past': 'Past perfect: "Nunca había visto nieve." First-time experience from a past perspective — hadn\'t done X before that point.',
  'Past perfect — completed action before past reference': 'Past perfect: "Cuando llegué, ya se había ido." Action completed before another past event.',
  'Past perfect — action completed before arrival': 'Past perfect: "Cuando llegamos, ya había empezado." The pluperfect shows one past action was already done before another.',
  'Future perfect — completion before a deadline': 'Future perfect: "Para el viernes habré terminado." An action that will be complete before a future point.',
  'Future perfect for probability about the past': 'Future perfect for past guessing: "Habrá sido difícil" (It must have been hard). Speculation about a past event.',
};

// ─── CONDITIONAL REWRITES ──────────────────────────────────────────────────────
const CONDITIONAL_MAP = {
  'Conditional for advice — yo en tu lugar + conditional': '"Yo en tu lugar" + conditional: "Yo en tu lugar, hablaría con ella." Common pattern for giving advice — If I were you, I would...',
  'Me gustaría — polite wish with conditional': '"Me gustaría" = I would like. Conditional of gustar for polite wishes. More polite than "quiero."',
  'Podrías — polite request with conditional': '"Podrías" = could you? Conditional of poder for polite requests. "¿Podrías ayudarme?" Softer than "¿Puedes...?"',
  'Conditional for polite request': 'Conditional for polite requests: "¿Podría ver el menú?" Using conditional makes requests softer and more formal.',
  'Conditional for hypothetical result': 'Conditional for hypothetical result: "Si tuviera dinero, viajaría." The conditional clause answers "what would happen if..."',
  'Nos gustaría — polite conditional request': '"Nos gustaría" = We would like. Conditional of gustar for polite group wishes. More formal than "queremos."',
  'Conditional of importar — very formal polite request': '"¿Le importaría...?" = Would you mind...? Very formal polite request using conditional of importar.',
  'Podrías — conditional of poder for polite requests': '"¿Podrías...?" = Could you...? Conditional of poder makes requests polite. "¿Podrías repetir?" = Could you repeat?',
  'Deberías — conditional of deber for gentle suggestions': '"Deberías" = You should. Conditional of deber for gentle advice. Softer than the direct "debes."',
  'Conditional of fiarse — reflexive verb in conditional': 'Conditional of reflexive verb fiarse: "No me fiaría" = I wouldn\'t trust. Reflexive pronoun stays before the conditional form.',
  'Si fuera tú — if I were you, common advice pattern': '"Si fuera tú..." = If I were you... Imperfect subjunctive of ser + conditional for advice: "Si fuera tú, lo haría."',
  'Mixed conditional — past condition, present result': 'Mixed conditional: past condition → present result. "Si hubiera estudiado, ahora sabría." Pluperfect subjunctive + conditional present.',
  'Mixed conditional — past condition + present consequence': 'Mixed conditional: "Si no hubiera llovido, estaríamos en la playa." Past condition (pluperfect subjunctive) with present consequence (conditional).',
};

// ─── PRONOUN REWRITES ──────────────────────────────────────────────────────────
const PRONOUN_MAP = {
  'Se lo — indirect + direct pronoun combo': 'Double object pronouns: indirect (le/les) + direct (lo/la) → "se lo." Le becomes se before lo/la to avoid "le lo." "Se lo dije" = I told it to him.',
  'Te (indirect) + lo (direct) — double pronoun': 'Double pronouns: indirect + direct. "Te lo dije" = I told it to you. Indirect pronoun (te) goes first, then direct (lo).',
  'Les — indirect object pronoun, plural': '"Les" = to them (indirect object): "Les dije la verdad" = I told them the truth. Plural of le.',
  'Me lo — double pronoun with modal verb': 'Double pronouns with modals: "Me lo puede dar" or "Puede dármelo." Pronouns go before conjugated verb OR attached to infinitive.',
  'Se replaces le before lo/la': 'When le/les comes before lo/la/los/las, le becomes "se" to avoid cacophony: "Le lo di" → "Se lo di."',
  'Se las — se replaces le; las is feminine plural direct object': '"Se las" = le + las → se replaces le before direct object. "Se las di" = I gave them (f.) to him/her.',
  'Le — indirect object; a mi madre clarifies recipient': '"Le" = to him/her/you(formal). Often clarified with "a + person": "Le dije a mi madre" = I told my mother.',
  'Me (indirect) + la (direct) — double pronoun': 'Double pronouns: "Me la trajo" = He brought it (f.) to me. Indirect (me) before direct (la).',
  'Le + costar — indirect object with costar': '"Le cuesta" = it\'s hard for him/her. Costar uses indirect object like gustar: "Me cuesta entender" = It\'s hard for me to understand.',
  'Le — indirect object pronoun: I told (to) him': '"Le" = indirect object (to him/her): "Le dije" = I told (to) him. Shows who receives the action.',
  'Les — indirect object pronoun for plural: to them': '"Les" = to them: "Les envié un mensaje" = I sent them a message. Plural indirect object pronoun.',
  'Se lo — when le/les + lo/la, le becomes se to avoid \'le lo\'': 'Sound rule: le + lo would sound awkward, so "le" becomes "se": "Se lo dije" (I told it to him), not "le lo dije."',
  'Nos — indirect object, first person plural': '"Nos" = to us (indirect object): "Nos dijo la verdad" = He told us the truth.',
  'Lo attached to affirmative tú command': 'Pronouns attach to affirmative commands: "Hazlo" (Do it). The pronoun goes at the end as one word.',
  'Tú affirmative command: di + me': 'Pronouns attach to affirmative tú commands: "Dime" = Tell me. "Di" (irregular command of decir) + "me."',
};

// ─── RELATIVE CLAUSE REWRITES ──────────────────────────────────────────────────
const RELATIVE_MAP = {
  'En que — in which, relative with preposition': '"En que" = in which/on which: "El día en que llegó" = The day on which he arrived. Preposition + que for things.',
  'A quien — whom, direct object with preposition a': '"A quien" = whom (with personal a): "La persona a quien vi" = The person whom I saw.',
  'Cuyo — whose, agrees with the possessed noun': '"Cuyo/a/os/as" = whose. Agrees with the POSSESSED noun, not the owner: "El hombre cuya hija..." (whose daughter).',
  'En el que — in which, preposition + article + que': '"En el que" = in which: "La casa en la que vivo" = The house in which I live. More specific than just "que."',
  'Del que — about which, contraction de + el + que': '"Del que" = of/about which: "El tema del que hablamos." Contraction of de + el + que.',
  'Lo que — what/the thing that, refers to abstract ideas': '"Lo que" = what / the thing that: "Lo que dices es verdad" = What you say is true. For abstract or unspecified things.',
  'De lo que — about which, with neuter lo for abstract things': '"De lo que" = about which (abstract): "De lo que hablamos" = What we talked about. Neuter lo for ideas, not physical objects.',
  'Al que — preposition a + el que for indirect objects': '"Al que" = to whom/which: "El amigo al que escribí" = The friend to whom I wrote.',
  'Cuyas — feminine plural of cuyo, agreeing with clases': '"Cuyas" = whose (f. pl.): Cuyo agrees in gender/number with the noun it precedes, not the owner.',
  'En que — on which, for temporal relative clauses': '"En que" for time: "El año en que nací" = The year in which I was born. Used for temporal relative clauses.',
  'Con quienes — with whom, plural': '"Con quienes" = with whom (plural): preposition + quienes for people in formal relative clauses.',
  'Con quien — with whom, used after prepositions': '"Con quien" = with whom: "La persona con quien hablé." Preposition + quien for people.',
  'Con quien — preposition + quien for people': '"Con quien" = with whom: "La persona con quien trabajo." Use preposition + quien when referring to people.',
  'Por la que — for which, compound relative': '"Por la que" = for which: "La razón por la que vine" = The reason for which I came.',
  'Por la cual — for which, more formal than por la que': '"Por la cual" = for which (formal): "La razón por la cual..." More literary than "por la que" but same meaning.',
  'whose (relative possessive).': '"Cuyo/a" = whose: a relative possessive that agrees with the possessed noun. "El autor cuyo libro leí" = The author whose book I read.',
  'Que as relative pronoun referring to people': '"Que" as relative pronoun: "La chica que vino" = The girl who came. "Que" works for both people and things in Spanish.',
};

// ─── IMPERSONAL SE / PASSIVE REWRITES ──────────────────────────────────────────
const SE_MAP = {
  'Se impersonal — no specific subject': '"Se" impersonal: no specific subject. "Se vive bien aquí" = One lives well here / People live well here. Like English "one" or "people."',
  'Se pasiva — passive se with plural noun': 'Passive "se" with plural noun: "Se venden coches" = Cars are sold. The verb agrees with the noun (plural). Very common in signs and announcements.',
  'Se dice que — impersonal \'they say that\'': '"Se dice que..." = It is said that / They say that. Impersonal se for general statements. No specific person saying it.',
  'Se puede + infinitive — impersonal \'one can\'': '"Se puede" + infinitive = One can / You can: "Aquí se puede fumar." Impersonal way to state what\'s allowed.',
  'Se cree que — impersonal belief': '"Se cree que..." = It is believed that. Impersonal se for widely-held beliefs without attributing to anyone specific.',
  'Se vive — impersonal se with intransitive verb': '"Se vive" = one lives / people live. Impersonal se with intransitive verbs: "Se vive bien aquí" = People live well here.',
  'Se trabaja — impersonal se, general statement': '"Se trabaja" = one works / people work. Impersonal se for general truths: "Se trabaja mucho aquí."',
  'Se tarda — impersonal for duration': '"Se tarda" = it takes (time). Impersonal: "Se tarda dos horas" = It takes two hours. No specific person.',
  'Se aprende — impersonal se + gerund': '"Se aprende" = one learns. Impersonal se: "Se aprende practicando" = You learn by practicing.',
  'Se pasiva — the subject is camisetas, the verb agrees with it': 'Passive se: the verb agrees with the grammatical subject. "Se venden camisetas" (camisetas = subject, plural → venden).',
  'Se dice que — impersonal \'it is said that\'': '"Se dice que..." = It is said that. Impersonal se for common knowledge or rumors.',
  'Passive voice with ser + participle + por': 'Passive with ser: "Fue escrito por Cervantes" = It was written by Cervantes. Ser + participle + por (agent). Less common than passive se.',
  'Passive with ser — emphasizes the action done to us': 'Passive with ser emphasizes the action: "Fuimos invitados" = We were invited. Focus on what happened, not who did it.',
  'Se + present perfect: se ha demostrado — impersonal perfect tense': '"Se ha demostrado" = It has been shown. Impersonal se works in all tenses: "Se ha dicho que..." = It has been said that...',
  'Se me — accidental se construction': '"Se me" = accidental/unintentional. "Se me cayó" = It fell on me / I dropped it (accidentally). Removes blame — it just happened.',
};

// ─── COMMAND (IMPERATIVE) REWRITES ─────────────────────────────────────────────
const COMMAND_MAP = {
  'Usted command: siéntese — formal': 'Formal usted command: "Siéntese" = Sit down (formal). Formed from subjunctive + pronoun attached: siente + se.',
  'Usted command: envíe + me': 'Formal usted command with pronoun: "Envíeme" = Send me. Subjunctive form + pronoun attached.',
  'Irregular tú command: haz (hacer)': 'Irregular tú command: "Haz" (do/make). Eight verbs have irregular tú commands: haz, di, sal, ven, ten, pon, sé, ve.',
  'Irregular tú command: ten (tener)': 'Irregular tú command: "Ten" (have/hold). One of eight irregular tú commands: haz, di, sal, ven, ten, pon, sé, ve.',
  'Irregular tú command: sé (ser)': 'Irregular tú command: "Sé" (be). One of eight irregular tú commands: haz, di, sal, ven, ten, pon, sé, ve.',
  'Irregular tú command: ve (ir)': 'Irregular tú command: "Ve" (go). From ir. One of eight irregular tú commands: haz, di, sal, ven, ten, pon, sé, ve.',
  'Reflexive tú command: ponte (ponerse)': 'Reflexive tú command: "Ponte" = Put on (yourself). Irregular command "pon" + reflexive "te" attached.',
  'Reflexive tú command: cállate (callarse)': 'Reflexive tú command: "Cállate" = Be quiet. Regular command "calla" + reflexive "te" attached.',
  'Usted commands: siga, gire — for directions': 'Formal usted commands for directions: "Siga recto, gire a la derecha." Subjunctive forms used as polite commands.',
  'Imperative + pronouns attached: trae + me + lo = tráemelo': 'Command + double pronouns: "Tráemelo" = Bring it to me. Pronouns attach in order: indirect (me) + direct (lo). Note accent added.',
  'Sal — irregular tú imperative of salir': 'Irregular tú command: "Sal" (go out/leave). From salir. One of eight irregular tú commands.',
  'Ponte — tú imperative of ponerse, pronoun attached': '"Ponte" = Put it on / Put on (yourself). Irregular command "pon" + reflexive "te."',
  'Ten — irregular tú imperative of tener': '"Ten" = Have/Hold (command). Irregular tú command of tener. "Ten cuidado" = Be careful.',
  'Di — irregular tú imperative of decir': '"Di" = Say/Tell (command). Irregular tú command of decir. "Dime la verdad" = Tell me the truth.',
  'Imperative ustedes: cerrad (cerrar)': 'Vosotros command: "Cerrad" = Close (you all). Formed by replacing -r of infinitive with -d: cerrar → cerrad. Spain only.',
};

// ─── NOUN GENDER REWRITES ──────────────────────────────────────────────────────
const GENDER_MAP = {
  'El problema — masculine despite -a ending': '"El problema" is masculine. Many -ma words from Greek are masculine: problema, tema, sistema, programa, clima, idioma.',
  'La mano — feminine despite -o ending': '"La mano" is feminine — one of very few -o nouns that are feminine. Memorize it as an exception.',
  'El agua — feminine noun uses el before it': '"El agua" — feminine noun using "el" for sound: feminine nouns starting with stressed "a-" take "el" not "la" but stay feminine: "el agua fría."',
  'El mapa — masculine despite -a ending': '"El mapa" is masculine. Not all -a nouns are feminine — mapa is an exception to memorize.',
  'El mapa — masculine despite -a ending (Greek origin)': '"El mapa" is masculine. Some -a nouns from Greek/other origins are masculine: mapa, problema, tema, sistema.',
  'El sistema — masculine despite -a ending': '"El sistema" is masculine. Many -ma/-ta words from Greek are masculine: sistema, problema, tema, programa.',
  'El clima — masculine despite -a ending': '"El clima" is masculine. Greek-origin -ma words are masculine: clima, problema, tema, sistema, programa.',
  'El día — masculine despite -a ending': '"El día" is masculine — an exception. "Buenos días" (good days) shows the masculine adjective form.',
  'El planeta — masculine despite -a ending': '"El planeta" is masculine. Many -a words from Greek/Latin are masculine: planeta, problema, mapa.',
  'El tema — masculine despite -a ending': '"El tema" is masculine. Greek-origin -ma words: tema, problema, sistema, clima, programa — all masculine.',
  'El tema — masculine despite -a ending (Greek origin)': '"El tema" is masculine. Greek-origin -ma words: tema, problema, sistema, clima — all masculine.',
  'La foto — feminine (short for fotografía)': '"La foto" — feminine because it\'s short for "la fotografía." Shortened words keep the gender of the full word.',
  'El poema — masculine despite -a ending': '"El poema" is masculine. Greek-origin -ma words: poema, tema, problema, sistema — all masculine.',
  'La radio — feminine (short for radioemisora)': '"La radio" — feminine because it\'s short for "la radioemisora." Gender follows the full word.',
  'El programa — masculine despite -a ending': '"El programa" is masculine. Greek-origin -ma words: programa, problema, tema, sistema — all masculine.',
  'La moto — feminine (short for motocicleta)': '"La moto" — feminine because it\'s short for "la motocicleta." Keeps gender of the full word.',
  'La señal — feminine, despite not ending in -a': '"La señal" is feminine. Many -al words are feminine (señal, capital, catedral) though others are masculine (animal, canal).',
  'El for masculine nouns': 'Definite article "el" goes with masculine singular nouns. "La" for feminine. Article must agree in gender and number.',
  'El idioma — masculine despite -a ending': '"El idioma" is masculine. Greek-origin -ma words are masculine: idioma, problema, tema, sistema.',
};

// ─── REFLEXIVE VERB REWRITES ───────────────────────────────────────────────────
const REFLEXIVE_MAP = {
  'Escribirse — reciprocal': '"Escribirse" = to write to each other. The "se" here is reciprocal: "Nos escribimos" = We write to each other.',
  'Parecerse — reciprocal': '"Parecerse" = to resemble each other. Reciprocal: "Nos parecemos" = We look alike.',
  'Llamarse — reciprocal': '"Llamarse" can be reciprocal: "Nos llamamos" = We call each other. Also reflexive: "Me llamo Ana" = I\'m called Ana.',
  'Reciprocal reflexive': 'Reciprocal "se": plural reflexive pronouns (nos, os, se) can mean "each other." "Se ayudan" = They help each other.',
  'Despertarse — reflexive for self': '"Despertarse" = to wake (oneself) up. The reflexive shows you do it to yourself: "Me despierto a las 7."',
  'Irse — reflexive changes meaning from ir': '"Irse" = to leave/go away (different from "ir" = to go). The reflexive changes the meaning: "Me voy" = I\'m leaving.',
  'Reunirse — reciprocal reflexive': '"Reunirse" = to meet/gather. Reciprocal: "Nos reunimos los lunes" = We meet on Mondays.',
  'Quedarse — reflexive for staying': '"Quedarse" = to stay/remain. Different from "quedar" (to arrange to meet). "Me quedé en casa" = I stayed home.',
  'Caerse — reflexive for accidental': '"Caerse" = to fall down (accidentally). Reflexive adds accidental nuance: "Me caí" = I fell (it happened to me).',
  'Equivocarse — reflexive for making a mistake': '"Equivocarse" = to make a mistake / be wrong. "Me equivoqué" = I was wrong. Always reflexive.',
  'Dedicarse a — reflexive for occupation': '"Dedicarse a" = to work as / dedicate oneself to. "¿A qué te dedicas?" = What do you do (for work)?',
  'Echarse de menos — reciprocal': '"Echarse de menos" = to miss each other. "Nos echamos de menos" = We miss each other.',
  'Acordarse de — reflexive for remembering': '"Acordarse de" = to remember (always reflexive + de). "Me acuerdo de ti" = I remember you. Compare: "acordar" (no se) = to agree.',
  'Encontrarse — reciprocal': '"Encontrarse" = to meet/run into each other. "Nos encontramos en el café" = We met at the café.',
  'Llevarse bien — reciprocal': '"Llevarse bien" = to get along. Reciprocal: "Nos llevamos bien" = We get along well.',
  'Darse cuenta — reflexive idiom': '"Darse cuenta de" = to realize. Fixed reflexive expression: "Me di cuenta de que..." = I realized that...',
  'reflexive construction meaning to fall asleep (unintentionally).': '"Dormirse" = to fall asleep (unintentionally). "Se me durmió la pierna" = My leg fell asleep. The reflexive adds the accidental nuance.',
  'Acordarse de — to remember. Always with \'de\' + object': '"Acordarse de" = to remember. Always reflexive + de: "Me acuerdo de ese día." Without "de" is a common mistake.',
  'Fijarse en — to pay attention to, to notice': '"Fijarse en" = to notice / pay attention to. Always reflexive + en: "¿Te fijaste en eso?" = Did you notice that?',
};

// ─── CONNECTOR REWRITES ────────────────────────────────────────────────────────
const CONNECTOR_MAP = {
  'Sin embargo — however, introduces contrast': '"Sin embargo" = however. Formal connector that introduces a contrasting idea. Placed at the start of the clause.',
  'No obstante — nevertheless, formal contrast': '"No obstante" = nevertheless. Very formal connector for contrast, common in written/academic Spanish.',
  'Por lo tanto — therefore, introduces consequence': '"Por lo tanto" = therefore. Introduces a logical consequence of what was just said.',
  'Por consiguiente — consequently, formal cause-effect': '"Por consiguiente" = consequently. Formal connector linking cause to effect.',
  'Es más — what\'s more, escalation connector': '"Es más" = what\'s more / moreover. Escalates or adds to a previous point.',
  'Dado que — given that, formal cause': '"Dado que" = given that / since. Formal causal connector: "Dado que llueve, nos quedamos."',
  'En cuanto a — regarding, topic introduction': '"En cuanto a" = regarding / as for. Introduces a new topic or shifts focus.',
  'De hecho — in fact, emphasis connector': '"De hecho" = in fact / actually. Reinforces or contrasts with what was expected.',
  'En definitiva — all in all, concluding connector': '"En definitiva" = all in all / in short. Used to summarize or conclude.',
  'En primer lugar — first of all, sequence connector': '"En primer lugar" = first of all. Sequence connector for organizing arguments.',
  'A medida que — as (gradual progression)': '"A medida que" = as (gradual): "A medida que crecía, aprendía más." Shows two things progressing together.',
  'Ahora bien — now then/however, introduces reservation': '"Ahora bien" = now then / however. Introduces a reservation or counterpoint to what was just said.',
  'Puesto que — since, formal cause': '"Puesto que" = since / given that. Formal causal connector: "Puesto que no vino, empezamos sin él."',
  'Dicho de otro modo — in other words, rephrasing': '"Dicho de otro modo" = in other words. Introduces a rephrasing or clarification.',
  'Por eso = that\'s why, because of that': '"Por eso" = that\'s why / because of that. Connects a cause to its consequence: "Llovía, por eso me quedé."',
  'Por suerte = luckily, fortunately': '"Por suerte" = luckily. Introduces a fortunate outcome: "Por suerte, llegamos a tiempo."',
  'Por cierto = by the way': '"Por cierto" = by the way. Introduces a related but tangential comment.',
  'Por aquí = around here': '"Por aquí" = around here / this way. "Por" for approximate location or direction.',
  'Menos mal que — thank goodness that, relief expression': '"Menos mal que..." = Thank goodness that... Expresses relief: "Menos mal que llegaste."',
  'Por lo general = generally, usually': '"Por lo general" = generally / usually. Expresses what\'s typical: "Por lo general, como a las 2."',
  'Por más que — no matter how much': '"Por más que" + subjunctive = no matter how much: "Por más que intento, no puedo." Concessive construction.',
};

// ─── ITALIAN SPECIFIC REWRITES ─────────────────────────────────────────────────
const ITALIAN_VAGUE_MAP = {
  'Common Italian expression used in everyday conversation. These set phrases should be memorized as whole units.': '',  // Remove — adds nothing
  'Common Italian greeting. Ciao is informal (hello/bye), Buongiorno is formal (good morning/day), Arrivederci is formal goodbye.': 'Italian greetings vary by formality: "Ciao" (informal, hello/bye), "Buongiorno" (formal, until afternoon), "Arrivederci" (formal goodbye). Formal = Lei, informal = tu.',
  'Essential courtesy expression. Grazie (thanks), Prego (you\'re welcome), Scusa/Scusi (sorry, informal/formal).': 'Courtesy words shift with formality: "Scusa" (tu, informal) vs "Scusi" (Lei, formal). "Prego" means "you\'re welcome" but also "please, go ahead."',
  'Imperative for instructions: commonly used in recipes, directions, and everyday requests.': 'Imperative mood for instructions: tu form drops the -s (parla!, scrivi!). Lei form uses subjunctive (parli!, scriva!). -are verbs swap: tu = -a, Lei = -i.',
  'Basic response word. "Va bene" (ok), "D\'accordo" (agreed), "Certo" (of course).': '',  // Remove
  'Common Italian saying using impersonal si.': '"Si" impersonal: "Si dice che..." = People say that... "Si" + 3rd person verb for general statements without a specific subject.',
  'Idiomatic: combinarne di tutti i colori.': '"Combinarne di tutti i colori" = to get up to all sorts of mischief. "Ne" is a partitive pronoun here — "of them/of it."',
};

const ITALIAN_INCOMPLETE_MAP = {
  'Formal Lei imperative.': 'Formal Lei imperative: uses the subjunctive form. -are → -i (parli!), -ere → -a (scriva!), -ire → -a (senta!). Opposite of tu forms.',
  'Formal imperative.': 'Formal imperative (Lei): uses subjunctive forms. -are → -i, -ere/-ire → -a. "Scusi" (excuse me), "Prego, si accomodi" (please, sit down).',
  'Formal negative imperative.': 'Formal negative imperative (Lei): "Non" + subjunctive form. "Non si preoccupi" = Don\'t worry. Same structure as affirmative Lei, just add "non."',
  'Future perfect for past speculation.': 'Future perfect for past speculation: "Sarà stato difficile" = It must have been hard. Italian uses futuro anteriore to guess about past events.',
  '\'Nel caso\' + subjunctive.': '"Nel caso" + subjunctive = in case: "Nel caso piova, porta l\'ombrello." Hypothetical situations always trigger the subjunctive.',
  '\'Si\' passivante with plural nouns.': '"Si" passivante with plural: verb agrees with the noun. "Si vendono case" = Houses are sold. The noun is the grammatical subject.',
  'Formal bureaucratic register.': '',  // Remove — just a register label
  'Informal/colloquial register.': '',
  'Ultra-formal epistolary register.': '',
  'Informal dismissive.': '',
  'Colloquial emphatic denial.': '',
  'Formal academic register.': '',
  'Legal/bureaucratic register.': '',
  'Standard formal letter closing in Italian business correspondence.': '',
  'Inverted conditional without \'se\'.': 'Inverted conditional: dropping "se" and using subjunctive alone. "Avessi saputo, sarei venuto" = Had I known, I would have come. Literary/formal style.',
  'Formal participial construction.': 'Participial construction: using a past participle as a clause. "Finito il lavoro, uscì" = Having finished the work, he went out. Common in formal Italian.',
  'Correlative comparatives.': 'Correlative comparatives: "Più... più..." = The more... the more. "Più studio, più imparo" = The more I study, the more I learn.',
  'Formal absolute participial clause.': 'Absolute participial clause: "Detto questo, passiamo oltre" = That said, let\'s move on. The participle has its own implied subject. Formal/written.',
  'Gerundio used for ongoing manner.': 'Gerundio for manner: "Rispose ridendo" = He answered laughing. The gerund (-ando/-endo) describes HOW an action is performed.',
};

// ─── IDIOM TIPS TO REMOVE (just definitions, no grammar) ──────────────────────
const IDIOMS_TO_REMOVE = new Set([
  'Al fin y al cabo — at the end of the day, after all',
  'Tener mano izquierda — to be tactful/diplomatic',
  'Ir tirando — to get by, to manage',
  'Estar hecho polvo — to be exhausted/destroyed',
  'Importar un bledo — to not care at all',
  'Hacérsele bola — to feel overwhelming/tedious',
  'Quedarse en blanco — to go blank, forget everything',
  'Dar gato por liebre — to rip someone off, deceive',
  'No pegar ojo — not to sleep a wink',
  'Poner verde — to badmouth, criticize harshly',
  'Tomar el pelo — to pull someone\'s leg, joke',
  'Irse el santo al cielo — to lose one\'s train of thought',
  'No quedar más remedio que — to have no choice but to',
  'Si por mí fuera — if it were up to me',
  'Estar en las mismas — no change, stuck in same situation',
  'A estas alturas — at this point/stage',
  'Andarse con rodeos — to beat around the bush',
  'Dar el brazo a torcer — to give in, to back down',
  'Ponerse al día — to catch up / to get up to date',
  'Quedarse de piedra — to be stunned/shocked',
  'Con las manos en la masa — red-handed, caught in the act',
  'A la legua — from a mile away, obviously',
  'Venir a cuento — to be relevant/pertinent',
  'Echar una mano — to give a hand, help out',
  'Pasársele por alto — to overlook something',
  'Ponerse las pilas — to get one\'s act together, buckle down',
  'Echar la bronca — to tell someone off, to scold',
  'Ser pan comido — to be a piece of cake, very easy',
  'Ir al grano — to get to the point',
  'Pillar lejos — colloquial for \'to be far away from someone\'',
]);

// ─── MISC SPANISH TIPS TO REWRITE ──────────────────────────────────────────────
const MISC_ES_MAP = {
  'Aunque + indicative — although (stating a fact)': '"Aunque" + indicative = although (known fact): "Aunque llueve, salgo." Compare: aunque + subjunctive = even if (hypothetical).',
  'Aunque + indicative for stating a known fact': '"Aunque" + indicative = although (known fact): "Aunque llueve, salgo." Compare: aunque + subjunctive = even if (hypothetical).',
  'Lo que — what/that which, for abstract ideas': '"Lo que" = what / that which: "Lo que dices es verdad." Used for abstract ideas or things not yet identified.',
  'Lo before estar + gerund, or attached: estoy buscándolo': 'Object pronouns go before conjugated verbs ("Lo estoy buscando") OR attach to the gerund ("Estoy buscándolo"). Both are correct.',
  'Quedar for fit': '"Quedar" for fit/appearance: "Te queda bien" = It looks good on you / It fits you well. Uses indirect object like gustar.',
  'Caer mal for disliking people': '"Caer mal" = to not like someone (as a person). "Me cae mal" = I don\'t like him. Uses gustar pattern — the person is the subject.',
  'Pasar for what\'s happening to someone': '"Pasar" for what\'s happening: "¿Qué te pasa?" = What\'s wrong with you? / What\'s happening to you? Indirect object marks the affected person.',
  'Quedar + quantity for remaining': '"Quedar" for remaining: "Quedan tres" = Three are left. Like gustar pattern — the remaining thing is the subject.',
  'so...that construction for emphasis.': '"Tan...que" = so...that: "Es tan alto que no cabe." Intensifier + adjective/adverb + que + result clause.',
  'basic question for asking location.': '"¿Dónde está...?" for asking where something is. Estar for location, dónde with accent for questions.',
  'asking the price of something.': '"¿Cuánto cuesta?" = How much does it cost? "Cuánto" with accent for question words.',
  'literally "to sound"; figuratively "to ring a bell."': '"Sonar" = to ring a bell / sound familiar. "Me suena" = It sounds familiar to me. Uses gustar-like construction.',
  'why (for what reason)?': '"¿Por qué?" (two words, with accent) = Why? "Porque" (one word, no accent) = Because. The accent and spacing matter.',
  'for what purpose?': '"¿Para qué?" = What for? / For what purpose? Compare: "¿Por qué?" = Why? (cause). Para qué asks about the goal.',
  'literally "to please"; the thing liked is the subject.': '"Gustar" literally = to please. The thing liked is the subject: "Me gusta el café" = Coffee pleases me. Not "I like coffee" structure.',
  'the more...the more.': '"Cuanto más...más..." = The more...the more: "Cuanto más estudio, más aprendo." Correlative comparative structure.',
  'not only...but also.': '"No solo...sino también..." = Not only...but also. "Sino" is used after a negative to introduce the real/correct thing.',
  'not only...but.': '"No solo...sino..." = Not only...but. "Sino" contrasts after a negative: "No es rojo, sino azul."',
  'Si + pluperfect subjunctive for past contrary-to-fact conditions': '"Si" + pluperfect subjunctive for unreal past: "Si hubiera sabido, habría ido." If I had known, I would have gone. The condition can never be fulfilled.',
  'Haga lo que haga — whatever I do, reduplicative subjunctive': '"Haga lo que haga" = whatever I do. Subjunctive repeated: verb + lo que + same verb. Universal concession pattern.',
  'Que yo sepa — as far as I know, with subjunctive of saber': '"Que yo sepa" = as far as I know. Subjunctive because it signals uncertainty — I\'m not sure this is complete information.',
  'Que yo sepa — as far as I know, epistemic marker': '"Que yo sepa" = as far as I know. Uses subjunctive of saber because it marks uncertainty.',
  'Para mí for personal opinion': '"Para mí" = in my opinion / for me: "Para mí, es demasiado caro." Para + person for personal perspective.',
  'Para mí = in my opinion': '"Para mí" = in my opinion: "Para mí, es mejor así." Para + person for personal viewpoint.',
  'Preguntar por — to ask for / about someone': '"Preguntar por" = to ask about/for someone: "Preguntó por ti" = He asked about you. The preposition "por" is required.',
  'Le + hacer falta — indirect object with impersonal verb': '"Hacerle falta" = to need (gustar pattern): "Le hace falta descansar" = He needs to rest. Indirect object + hacer falta.',
  'Por + infinitive = remaining to be done': '"Por" + infinitive = still to be done: "Queda mucho por hacer" = There\'s a lot left to do.',
  'Arreglárselas — to manage/cope, reflexive idiom': '"Arreglárselas" = to manage/cope. Reflexive + las (fixed): "Ya me las arreglaré" = I\'ll figure it out. "Las" has no specific referent.',
  'You are known by the company you keep.': '',  // Remove — just a proverb meaning, no grammar
  'Common Spanish proverb — not everything is as it appears.': '',
  'Everyone has their own way of doing things.': '',
  'idiomatic expression for helping.': '',
  'Idiomatic: se me cayó el alma al suelo — my heart sank': '"Se me cayó el alma al suelo" — accidental se construction (se + indirect object). Literally "my soul fell to the floor on me." The "se me" removes agency.',
  'Idiomatic: costar un ojo de la cara — very expensive': '"Costar un ojo de la cara" — uses gustar-like construction with indirect object. "Me costó un ojo de la cara" = It cost me an arm and a leg.',
  'Idiomatic: estar hasta las narices — to be fed up': '"Estar hasta las narices" — estar + preposition phrase for emotional state. Similar: "estar harto/a" (to be fed up).',
};

// ─── ITALIAN OVERSIMPLIFIED PATTERNS ───────────────────────────────────────────
const ITALIAN_QUESTION_TIP = 'Yes/no questions in Italian mainly use rising intonation. Word order can stay the same, though subject-verb inversion is also possible for emphasis.';

const ITALIAN_IMPERFETTO_GENERAL = 'Imperfetto for habitual/ongoing past: describes what used to happen, background descriptions, and ongoing states. Endings: -avo, -avi, -ava, -avamo, -avate, -avano (-are verbs).';

const ITALIAN_IMPERFETTO_VS_PP = 'Imperfetto vs passato prossimo: imperfetto for ongoing/background actions, passato prossimo for completed/sudden events. "Dormivo (background) quando è suonato (sudden event)."';

// ─── ITALIAN TRANSLATION_ONLY — these get removed ──────────────────────────────
// We'll pattern-match these

// ─── SINGLE VERB CONJUGATION LISTINGS (incomplete) — remove ────────────────────
// Patterns like "Correr (regular -er): corro, corres..." or "Ir: 2nd person = vas."

// ========================================================================
// MAIN PROCESSING
// ========================================================================

function processSpanishDeck() {
  const deckPath = resolve(ROOT, 'src/data/spanish/deck.json');
  const deck = JSON.parse(readFileSync(deckPath, 'utf8'));

  let fixed = 0, removed = 0, kept = 0;

  for (const card of deck) {
    if (!card.grammar) { kept++; continue; }

    const tip = card.grammar;
    let newTip = null;
    let action = 'keep';

    // 1. Translation-only — remove
    if (/^to\s+\w+[\s\/]/.test(tip) && tip.length < 50 && !tip.includes('subjunctive') && !tip.includes('pronoun')) {
      if (tip.startsWith('to ') && (tip.endsWith('.') || tip.endsWith('something.') || tip.endsWith('with.'))) {
        newTip = '';
        action = 'remove';
      }
    }

    // 2. Ser/Estar — rewrite
    if (action === 'keep' && SER_ESTAR_MAP[tip]) {
      newTip = SER_ESTAR_MAP[tip];
      action = 'fix';
    }

    // 3. Gustar pattern verbs
    if (action === 'keep' && /works like gustar$/.test(tip)) {
      const verb = tip.replace(' works like gustar', '');
      newTip = GUSTAR_EXPLANATION(verb);
      action = 'fix';
    }

    // 4. Por/Para
    if (action === 'keep' && POR_PARA_MAP[tip]) {
      newTip = POR_PARA_MAP[tip];
      action = 'fix';
    }

    // 5. Subjunctive triggers
    if (action === 'keep' && SUBJUNCTIVE_MAP[tip]) {
      newTip = SUBJUNCTIVE_MAP[tip];
      action = 'fix';
    }

    // 6. Tense/aspect
    if (action === 'keep' && TENSE_MAP[tip]) {
      newTip = TENSE_MAP[tip];
      action = 'fix';
    }

    // 7. Conditional
    if (action === 'keep' && CONDITIONAL_MAP[tip]) {
      newTip = CONDITIONAL_MAP[tip];
      action = 'fix';
    }

    // 8. Pronouns
    if (action === 'keep' && PRONOUN_MAP[tip]) {
      newTip = PRONOUN_MAP[tip];
      action = 'fix';
    }

    // 9. Relative clauses
    if (action === 'keep' && RELATIVE_MAP[tip]) {
      newTip = RELATIVE_MAP[tip];
      action = 'fix';
    }

    // 10. Impersonal/passive se
    if (action === 'keep' && SE_MAP[tip]) {
      newTip = SE_MAP[tip];
      action = 'fix';
    }

    // 11. Commands
    if (action === 'keep' && COMMAND_MAP[tip]) {
      newTip = COMMAND_MAP[tip];
      action = 'fix';
    }

    // 12. Noun gender
    if (action === 'keep' && GENDER_MAP[tip]) {
      newTip = GENDER_MAP[tip];
      action = 'fix';
    }

    // 13. Reflexive verbs
    if (action === 'keep' && REFLEXIVE_MAP[tip]) {
      newTip = REFLEXIVE_MAP[tip];
      action = 'fix';
    }

    // 14. Connectors
    if (action === 'keep' && CONNECTOR_MAP[tip]) {
      newTip = CONNECTOR_MAP[tip];
      action = 'fix';
    }

    // 15. Misc rewrites
    if (action === 'keep' && MISC_ES_MAP[tip] !== undefined) {
      newTip = MISC_ES_MAP[tip];
      action = newTip === '' ? 'remove' : 'fix';
    }

    // 16. Idioms to remove
    if (action === 'keep' && IDIOMS_TO_REMOVE.has(tip)) {
      newTip = '';
      action = 'remove';
    }

    // 17. Single verb form listings — remove (e.g., "Ir: 2nd person = vas.")
    if (action === 'keep' && /^\w+:\s+(2nd|3rd|1st)\s+person\s*(plural)?\s*=\s*\w+\.$/.test(tip)) {
      newTip = '';
      action = 'remove';
    }

    // 18. Regular verb conjugation listings — remove (e.g., "Correr (regular -er): corro, corres...")
    if (action === 'keep' && /^\w+\s+\(regular\s+-[aei]r\):\s+\w+,\s+\w+/.test(tip)) {
      newTip = '';
      action = 'remove';
    }

    // 19. Stem-change verb listings without explanation
    if (action === 'keep' && /^\w+\s+\([eou]→[ieou]+\s+stem-change\):\s+\w+,\s+\w+/.test(tip)) {
      // Rewrite to explain the pattern
      const match = tip.match(/^(\w+)\s+\(([eou])→([ieou]+)\s+stem-change\)/);
      if (match) {
        const [, verb, from, to] = match;
        newTip = `"${verb}" has a ${from}→${to} stem change: the "${from}" in the stem becomes "${to}" when stressed (all singular + 3rd plural). Nosotros/vosotros keep the original stem.`;
        action = 'fix';
      }
    }

    // 20. Irregular preterite listings
    if (action === 'keep' && /^\w+\s+\(irregular\s+preterite\):\s+\w+,\s+\w+/.test(tip)) {
      const match = tip.match(/^(\w+)\s+\(irregular\s+preterite\):\s+(\w+)/);
      if (match) {
        const [, verb, firstForm] = match;
        newTip = `"${verb}" has an irregular preterite stem (${firstForm}...). These irregular preterites share the same endings: -e, -iste, -o, -imos, -isteis, -ieron. No accents needed.`;
        action = 'fix';
      }
    }

    // 21. Conseguir-type preterite listings
    if (action === 'keep' && /^\w+\s+\([eou]→[ieou]+\s+preterite\):\s+/.test(tip)) {
      newTip = '';
      action = 'remove';
    }

    // Apply
    if (action === 'remove') {
      delete card.grammar;
      removed++;
    } else if (action === 'fix' && newTip) {
      card.grammar = newTip;
      fixed++;
    } else {
      kept++;
    }
  }

  writeFileSync(deckPath, JSON.stringify(deck, null, 2) + '\n');
  console.log(`Spanish: ${fixed} fixed, ${removed} removed, ${kept} kept`);
}

function processItalianDeck() {
  const deckPath = resolve(ROOT, 'src/data/italian/deck.json');
  const deck = JSON.parse(readFileSync(deckPath, 'utf8'));

  let fixed = 0, removed = 0, kept = 0;

  for (const card of deck) {
    if (!card.grammar) { kept++; continue; }

    const tip = card.grammar;
    let newTip = null;
    let action = 'keep';

    // 1. Vague tips
    if (ITALIAN_VAGUE_MAP[tip] !== undefined) {
      newTip = ITALIAN_VAGUE_MAP[tip];
      action = newTip === '' ? 'remove' : 'fix';
    }

    // 2. Incomplete tips
    if (action === 'keep' && ITALIAN_INCOMPLETE_MAP[tip] !== undefined) {
      newTip = ITALIAN_INCOMPLETE_MAP[tip];
      action = newTip === '' ? 'remove' : 'fix';
    }

    // 3. Question intonation tip — fix
    if (action === 'keep' && tip === 'Yes/no questions in Italian use rising intonation — no word order change needed. The verb stays in the same position.') {
      newTip = ITALIAN_QUESTION_TIP;
      action = 'fix';
    }
    if (action === 'keep' && tip === 'Yes/no questions in Italian use rising intonation \u2014 no word order change needed.') {
      newTip = ITALIAN_QUESTION_TIP;
      action = 'fix';
    }

    // 4. Single-verb imperfetto examples — replace with general rule
    if (action === 'keep' && /^Imperfetto:\s+\w+\s+\(\w+\)\s+for\s+(habitual|ongoing)\s+past/.test(tip)) {
      newTip = ITALIAN_IMPERFETTO_GENERAL;
      action = 'fix';
    }
    // Also match variants like "Imperfetto: era (essere) for descriptions in the past."
    if (action === 'keep' && /^Imperfetto:\s+\w+\s+\(\w+\)\s+for\s+(past\s+)?(descriptions?|age|weather|past\s+state|past\s+description|past\s+atmosphere|past\s+possession|habitual\s+past\s+state|ongoing\s+past)/.test(tip)) {
      newTip = ITALIAN_IMPERFETTO_GENERAL;
      action = 'fix';
    }
    // Imperfetto with time expression
    if (action === 'keep' && /^Imperfetto:\s+\w+\s+\(\w+\)\s+with\s+'/.test(tip)) {
      newTip = ITALIAN_IMPERFETTO_GENERAL;
      action = 'fix';
    }
    // Imperfetto for ongoing past feeling/mental state
    if (action === 'keep' && /^Imperfetto:\s+\w+\s+\(\w+\)\s+for\s+ongoing\s+past\s+(feeling|mental\s+state)/.test(tip)) {
      newTip = ITALIAN_IMPERFETTO_GENERAL;
      action = 'fix';
    }

    // 5. Imperfetto vs passato prossimo contrast — replace with general rule
    if (action === 'keep' && /^Imperfetto\s+\(\w+\)\s+for\s+\w+\s+\+\s+passato\s+prossimo\s+\(/.test(tip)) {
      newTip = ITALIAN_IMPERFETTO_VS_PP;
      action = 'fix';
    }
    // Also match "Imperfetto (X) for background/ongoing + passato prossimo"
    if (action === 'keep' && /^Imperfetto\s+\(/.test(tip) && /passato\s+prossimo/.test(tip)) {
      newTip = ITALIAN_IMPERFETTO_VS_PP;
      action = 'fix';
    }

    // 6. Italian translation_only patterns
    // Connector translations: "X" — 'Y'  or  'X' means 'Y'
    if (action === 'keep' && /^["'"].+["'"]\s*(—|means)\s*["']/.test(tip) && tip.length < 80 && !/verb|pronoun|subjunctive|conjugat/i.test(tip)) {
      newTip = '';
      action = 'remove';
    }
    // "X" — 'Y', connector type
    if (action === 'keep' && /^"[^"]+"\s+—\s+'[^']+'(,\s+\w+\s+connector)?\.?$/.test(tip)) {
      newTip = '';
      action = 'remove';
    }

    // 7. Idiom/proverb translations
    if (action === 'keep' && /^['"].+['"]\s*=\s*.+$/.test(tip) && tip.length < 80 && !/verb|pronoun|subject|conjugat/i.test(tip)) {
      newTip = '';
      action = 'remove';
    }

    // 8. Slang/filler definitions
    if (action === 'keep' && /^(Slang|'Boh'|Italian proverb|Proverb|Traditional)/.test(tip) && tip.length < 80) {
      newTip = '';
      action = 'remove';
    }

    // Apply
    if (action === 'remove') {
      delete card.grammar;
      removed++;
    } else if (action === 'fix' && newTip) {
      card.grammar = newTip;
      fixed++;
    } else {
      kept++;
    }
  }

  writeFileSync(deckPath, JSON.stringify(deck, null, 2) + '\n');
  console.log(`Italian: ${fixed} fixed, ${removed} removed, ${kept} kept`);
}

// Run
processSpanishDeck();
processItalianDeck();
console.log('\nDone! Grammar tips audit complete.');
