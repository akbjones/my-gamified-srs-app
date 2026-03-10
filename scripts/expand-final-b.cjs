/**
 * expand-final-b.cjs
 *
 * Add ~543 new cards for nodes 11-20 (B1-B2 grammar) to the Spanish deck.
 * ~54 cards per node covering:
 *   Node 11: Comparatives & Superlatives (B1)
 *   Node 12: Future & Conditional (B1)
 *   Node 13: Present Subjunctive (B1)
 *   Node 14: Commands & Imperatives (B1)
 *   Node 15: Relative Clauses (B1)
 *   Node 16: Imperfect Subjunctive (B2)
 *   Node 17: Conditionals II & III (B2)
 *   Node 18: Passive & Impersonal (B2)
 *   Node 19: Advanced Connectors (B2)
 *   Node 20: Mastery (B2)
 *
 * Tags boosted for "work" (~35%) to address underrepresentation.
 * ~20% of cards include a grammar explanation field.
 */

const fs = require('fs');
const path = require('path');

const DECK_PATH = path.join(__dirname, '..', 'src', 'data', 'spanish', 'deck.json');
const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf-8'));

console.log(`Current deck: ${deck.length} cards`);

// Track existing sentences to avoid duplicates
const existingTargets = new Set(deck.map(c => c.target.toLowerCase().trim()));

// Find the highest existing ID
let nextId = Math.max(...deck.map(c => c.id)) + 1;

// ─── NEW CARDS BY GRAMMAR NODE ───────────────────────────────────

const newCardsByNode = {

  // ═══════════════════════════════════════════════════════════════
  // NODE 11: Comparatives & Superlatives (B1)
  // más/menos que, tan...como, mejor/peor, el/la más, -ísimo
  // ═══════════════════════════════════════════════════════════════
  11: [
    { target: "Este restaurante es más caro que el de la esquina.", english: "This restaurant is more expensive than the one on the corner.", tags: ["general", "travel"], grammar: "Más + adjective + que — basic comparative" },
    { target: "Mi hermana es más alta que yo, pero yo soy más rápido.", english: "My sister is taller than me, but I'm faster.", tags: ["general", "family"] },
    { target: "Este proyecto es menos complicado de lo que pensaba.", english: "This project is less complicated than I thought.", tags: ["general", "work"], grammar: "Menos + adj + de lo que — less than what (clause comparison)" },
    { target: "Tu café está tan caliente como el mío.", english: "Your coffee is as hot as mine.", tags: ["general"] },
    { target: "No soy tan paciente como mi madre.", english: "I'm not as patient as my mother.", tags: ["general", "family"], grammar: "Tan + adjective + como — as...as comparison" },
    { target: "Este hotel es mejor que el del año pasado.", english: "This hotel is better than last year's.", tags: ["general", "travel"] },
    { target: "La comida de hoy está peor que la de ayer.", english: "Today's food is worse than yesterday's.", tags: ["general"] },
    { target: "Es el edificio más alto de la ciudad.", english: "It's the tallest building in the city.", tags: ["general", "travel"], grammar: "El/la más + adj + de — superlative with definite article" },
    { target: "Esta es la peor reunión que he tenido en mi vida.", english: "This is the worst meeting I've ever had.", tags: ["general", "work"] },
    { target: "Mi abuela cocina mejor que nadie.", english: "My grandmother cooks better than anyone.", tags: ["general", "family"] },
    { target: "El examen fue facilísimo, terminé en media hora.", english: "The exam was super easy, I finished in half an hour.", tags: ["general"], grammar: "-ísimo suffix — absolute superlative, meaning 'extremely'" },
    { target: "Hoy hace muchísimo calor, no quiero salir.", english: "It's extremely hot today, I don't want to go out.", tags: ["general"] },
    { target: "Este informe tiene más errores que el anterior.", english: "This report has more errors than the previous one.", tags: ["general", "work"] },
    { target: "Tengo menos experiencia que los otros candidatos.", english: "I have less experience than the other candidates.", tags: ["general", "work"] },
    { target: "Es la mejor oferta que hemos recibido hasta ahora.", english: "It's the best offer we've received so far.", tags: ["general", "work"], grammar: "La mejor — irregular superlative of bueno" },
    { target: "Mi hijo mayor es más responsable que el pequeño.", english: "My oldest son is more responsible than the youngest.", tags: ["general", "family"], grammar: "Mayor/menor — comparative for age (older/younger)" },
    { target: "Cuanto más estudio, menos entiendo este tema.", english: "The more I study, the less I understand this topic.", tags: ["general"], grammar: "Cuanto más...menos — the more...the less" },
    { target: "Esta ciudad tiene tantos parques como la nuestra.", english: "This city has as many parks as ours.", tags: ["general", "travel"], grammar: "Tanto/a/os/as + noun + como — as much/many...as" },
    { target: "El vuelo de la mañana es más barato que el de la tarde.", english: "The morning flight is cheaper than the afternoon one.", tags: ["general", "travel"] },
    { target: "Eres el mejor compañero de equipo que he tenido.", english: "You're the best teammate I've ever had.", tags: ["general", "work"] },
    { target: "Mi piso es más pequeño que el tuyo, pero más céntrico.", english: "My apartment is smaller than yours, but more central.", tags: ["general"] },
    { target: "Este vino es tan bueno como el que probamos en Italia.", english: "This wine is as good as the one we tried in Italy.", tags: ["general", "travel"] },
    { target: "La presentación de hoy fue mucho mejor que la de la semana pasada.", english: "Today's presentation was much better than last week's.", tags: ["general", "work"] },
    { target: "Es la persona más amable que conozco.", english: "She's the kindest person I know.", tags: ["general"] },
    { target: "Cada vez trabajo más horas y duermo menos.", english: "I work more and more hours and sleep less and less.", tags: ["general", "work"], grammar: "Cada vez más/menos — more and more / less and less" },
    { target: "Este plato está riquísimo, tienes que probarlo.", english: "This dish is delicious, you have to try it.", tags: ["general"] },
    { target: "Mi jefa tiene más paciencia que un santo.", english: "My boss has more patience than a saint.", tags: ["general", "work"] },
    { target: "No hay nada peor que esperar sin saber qué pasa.", english: "There's nothing worse than waiting without knowing what's happening.", tags: ["general"] },
    { target: "Este mes hemos vendido el doble que el mes pasado.", english: "This month we've sold twice as much as last month.", tags: ["general", "work"], grammar: "El doble que — twice as much as" },
    { target: "La playa está cerquísima del hotel, a cinco minutos.", english: "The beach is really close to the hotel, five minutes away.", tags: ["general", "travel"] },
    { target: "Tengo tantas ganas de vacaciones como tú.", english: "I want a vacation as much as you do.", tags: ["general", "travel"] },
    { target: "Es el peor tráfico que he visto en mi vida.", english: "It's the worst traffic I've ever seen.", tags: ["general", "travel"] },
    { target: "Mi hermano menor cocina mejor que yo.", english: "My younger brother cooks better than me.", tags: ["general", "family"] },
    { target: "Esta tarea es más urgente que las demás.", english: "This task is more urgent than the rest.", tags: ["general", "work"] },
    { target: "El tren es más cómodo que el autobús para viajar.", english: "The train is more comfortable than the bus for traveling.", tags: ["general", "travel"] },
    { target: "Estoy contentísima con los resultados del equipo.", english: "I'm extremely happy with the team's results.", tags: ["general", "work"] },
    { target: "Tu idea es mejor que la mía, vamos con esa.", english: "Your idea is better than mine, let's go with that.", tags: ["general", "work"] },
    { target: "Hoy me siento peor que ayer, creo que tengo fiebre.", english: "I feel worse today than yesterday, I think I have a fever.", tags: ["general"] },
    { target: "Mi padre es mayor que mi madre por tres años.", english: "My father is older than my mother by three years.", tags: ["general", "family"] },
    { target: "No gano tanto como mis compañeros de departamento.", english: "I don't earn as much as my coworkers in the department.", tags: ["general", "work"] },
    { target: "Es la ciudad más bonita que he visitado.", english: "It's the most beautiful city I've visited.", tags: ["general", "travel"] },
    { target: "Llegar tarde es peor que no llegar.", english: "Arriving late is worse than not arriving.", tags: ["general", "work"] },
    { target: "Mi prima es la más joven de todos los primos.", english: "My cousin is the youngest of all the cousins.", tags: ["general", "family"] },
    { target: "Este verano ha sido el más caluroso de la década.", english: "This summer has been the hottest of the decade.", tags: ["general"] },
    { target: "Cuanto antes terminemos, mejor para todos.", english: "The sooner we finish, the better for everyone.", tags: ["general", "work"], grammar: "Cuanto antes...mejor — the sooner...the better" },
    { target: "Mi abuelo es el más gracioso de la familia.", english: "My grandfather is the funniest in the family.", tags: ["general", "family"] },
    { target: "Es muchísimo más difícil de lo que parece.", english: "It's much more difficult than it seems.", tags: ["general", "work"] },
    { target: "Esta calle es menos ruidosa que la avenida principal.", english: "This street is less noisy than the main avenue.", tags: ["general", "travel"] },
    { target: "No conozco a nadie más trabajador que ella.", english: "I don't know anyone more hardworking than her.", tags: ["general", "work"] },
    { target: "La versión nueva del programa es rapidísima.", english: "The new version of the program is super fast.", tags: ["general", "work"] },
    { target: "Estos zapatos son más cómodos que los otros.", english: "These shoes are more comfortable than the other ones.", tags: ["general"] },
    { target: "Es el mejor café que he tomado en mucho tiempo.", english: "It's the best coffee I've had in a long time.", tags: ["general"] },
    { target: "Tu hijo es tan educado como su madre.", english: "Your son is as polite as his mother.", tags: ["general", "family"] },
    { target: "El apartamento nuevo es tres veces más grande que el viejo.", english: "The new apartment is three times bigger than the old one.", tags: ["general"] },
  ],

  // ═══════════════════════════════════════════════════════════════
  // NODE 12: Future & Conditional (B1)
  // Simple future (-é/-ás/-á), conditional (-ía), ir a + infinitive
  // ═══════════════════════════════════════════════════════════════
  12: [
    { target: "Mañana te enviaré el informe por correo.", english: "I'll send you the report by email tomorrow.", tags: ["general", "work"], grammar: "Simple future: enviar → enviaré — regular -ar future" },
    { target: "¿Vendrás a la cena del viernes?", english: "Will you come to Friday's dinner?", tags: ["general", "family"] },
    { target: "El año que viene viajaremos a Japón.", english: "Next year we'll travel to Japan.", tags: ["general", "travel"] },
    { target: "No creo que podremos terminar hoy.", english: "I don't think we'll be able to finish today.", tags: ["general", "work"], grammar: "Poder → podré/podremos — irregular future stem podr-" },
    { target: "Algún día tendré mi propia empresa.", english: "Someday I'll have my own company.", tags: ["general", "work"], grammar: "Tener → tendré — irregular future stem tendr-" },
    { target: "¿Cuánto costará arreglar el coche?", english: "How much will it cost to fix the car?", tags: ["general"] },
    { target: "Te llamaré en cuanto llegue al hotel.", english: "I'll call you as soon as I get to the hotel.", tags: ["general", "travel"] },
    { target: "Me gustaría cambiar de trabajo el año que viene.", english: "I'd like to change jobs next year.", tags: ["general", "work"], grammar: "Conditional: gustar → gustaría — polite wishes" },
    { target: "¿Podrías ayudarme con esta presentación?", english: "Could you help me with this presentation?", tags: ["general", "work"], grammar: "Conditional of poder for polite requests" },
    { target: "Yo en tu lugar no aceptaría esa oferta.", english: "If I were you, I wouldn't accept that offer.", tags: ["general", "work"] },
    { target: "Habrá mucha gente en el concierto esta noche.", english: "There will be a lot of people at the concert tonight.", tags: ["general"], grammar: "Haber → habrá — irregular future, there will be" },
    { target: "¿Te importaría cerrar la ventana? Hace frío.", english: "Would you mind closing the window? It's cold.", tags: ["general"] },
    { target: "Si tuviera más dinero, viajaría por todo el mundo.", english: "If I had more money, I'd travel the whole world.", tags: ["general", "travel"] },
    { target: "El lunes sabremos los resultados de la entrevista.", english: "On Monday we'll know the interview results.", tags: ["general", "work"], grammar: "Saber → sabremos — irregular future stem sabr-" },
    { target: "¿Cuándo saldrá el próximo tren a Barcelona?", english: "When will the next train to Barcelona leave?", tags: ["general", "travel"], grammar: "Salir → saldrá — irregular future stem saldr-" },
    { target: "No sé si podré ir a la boda de tu hermana.", english: "I don't know if I'll be able to go to your sister's wedding.", tags: ["general", "family"] },
    { target: "Me encantaría conocer a tu familia algún día.", english: "I'd love to meet your family someday.", tags: ["general", "family"] },
    { target: "Esta tarde lloverá, llévate el paraguas.", english: "It will rain this afternoon, take your umbrella.", tags: ["general"] },
    { target: "¿Dónde pondremos todas estas cajas?", english: "Where will we put all these boxes?", tags: ["general"], grammar: "Poner → pondremos — irregular future stem pondr-" },
    { target: "Nos mudaremos a un piso más grande en junio.", english: "We'll move to a bigger apartment in June.", tags: ["general", "family"] },
    { target: "¿Querrías venir a cenar con nosotros el sábado?", english: "Would you like to come have dinner with us on Saturday?", tags: ["general", "family"], grammar: "Querer → querrías — irregular conditional stem querr-" },
    { target: "Si me dan el puesto, empezaré en septiembre.", english: "If they give me the position, I'll start in September.", tags: ["general", "work"] },
    { target: "Será difícil encontrar vuelos baratos en agosto.", english: "It'll be hard to find cheap flights in August.", tags: ["general", "travel"] },
    { target: "Yo no haría eso, puede traer problemas.", english: "I wouldn't do that, it could cause problems.", tags: ["general", "work"] },
    { target: "¿A qué hora llegarás mañana a la oficina?", english: "What time will you arrive at the office tomorrow?", tags: ["general", "work"] },
    { target: "Dentro de cinco años habré terminado la carrera.", english: "In five years I'll have finished my degree.", tags: ["general"], grammar: "Future perfect: habré + past participle — completed future" },
    { target: "¿Me dirás la verdad si te pregunto algo?", english: "Will you tell me the truth if I ask you something?", tags: ["general"], grammar: "Decir → dirás — irregular future stem dir-" },
    { target: "Con este tráfico, tardaremos una hora más.", english: "With this traffic, it'll take us an hour longer.", tags: ["general", "travel"] },
    { target: "¿Qué harías si te tocara la lotería?", english: "What would you do if you won the lottery?", tags: ["general"] },
    { target: "No te preocupes, todo saldrá bien.", english: "Don't worry, everything will turn out fine.", tags: ["general"] },
    { target: "La empresa abrirá una nueva oficina en Lisboa.", english: "The company will open a new office in Lisbon.", tags: ["general", "work"] },
    { target: "Te prometo que no volveré a llegar tarde.", english: "I promise I won't be late again.", tags: ["general", "work"] },
    { target: "¿Crees que cabremos todos en el coche?", english: "Do you think we'll all fit in the car?", tags: ["general", "travel"], grammar: "Caber → cabremos — irregular future stem cabr-" },
    { target: "Si pudiera elegir, trabajaría desde casa.", english: "If I could choose, I'd work from home.", tags: ["general", "work"] },
    { target: "Después de la reunión iré directo al aeropuerto.", english: "After the meeting I'll go straight to the airport.", tags: ["general", "work", "travel"] },
    { target: "Seguramente nevará este fin de semana.", english: "It'll probably snow this weekend.", tags: ["general"] },
    { target: "¿Cuántas personas vendrán a la fiesta?", english: "How many people will come to the party?", tags: ["general"] },
    { target: "Si no fuera tan caro, compraría ese piso.", english: "If it weren't so expensive, I'd buy that apartment.", tags: ["general"] },
    { target: "El mes que viene celebraremos el aniversario de la empresa.", english: "Next month we'll celebrate the company anniversary.", tags: ["general", "work"] },
    { target: "No podré quedarme mucho rato, tengo otra cita.", english: "I won't be able to stay long, I have another appointment.", tags: ["general"] },
    { target: "¿Te gustaría probar la comida típica de aquí?", english: "Would you like to try the local food here?", tags: ["general", "travel"] },
    { target: "Creo que hará buen tiempo el fin de semana.", english: "I think the weather will be nice this weekend.", tags: ["general"] },
    { target: "Les diré a mis padres que vamos a visitarlos.", english: "I'll tell my parents we're going to visit them.", tags: ["general", "family"] },
    { target: "¿Cuánto valdrá este cuadro dentro de diez años?", english: "How much will this painting be worth in ten years?", tags: ["general"], grammar: "Valer → valdrá — irregular future stem valdr-" },
    { target: "Si tuviera vacaciones ahora, me iría a la playa.", english: "If I had vacation now, I'd go to the beach.", tags: ["general", "travel"] },
    { target: "El jefe nos comunicará la decisión el viernes.", english: "The boss will communicate the decision to us on Friday.", tags: ["general", "work"] },
    { target: "Mañana a esta hora ya estaremos en el avión.", english: "Tomorrow at this time we'll already be on the plane.", tags: ["general", "travel"] },
    { target: "¿Me prestarías tu portátil un momento?", english: "Would you lend me your laptop for a moment?", tags: ["general", "work"] },
    { target: "El técnico vendrá a arreglar la calefacción el martes.", english: "The technician will come to fix the heating on Tuesday.", tags: ["general"] },
    { target: "Si ahorro bastante, el verano que viene iré a México.", english: "If I save enough, next summer I'll go to Mexico.", tags: ["general", "travel"] },
    { target: "No creo que lo terminaré a tiempo, hay demasiado.", english: "I don't think I'll finish it on time, there's too much.", tags: ["general", "work"] },
    { target: "¿Irás a ver a tus abuelos en Navidad?", english: "Will you go see your grandparents at Christmas?", tags: ["general", "family"] },
    { target: "Con más práctica, hablarás español con fluidez.", english: "With more practice, you'll speak Spanish fluently.", tags: ["general"] },
    { target: "Yo diría que necesitamos al menos dos semanas más.", english: "I'd say we need at least two more weeks.", tags: ["general", "work"], grammar: "Decir → diría — conditional for softened opinions" },
  ],

  // ═══════════════════════════════════════════════════════════════
  // NODE 13: Present Subjunctive (B1)
  // Wishes, doubts, emotions, impersonal expressions, que + subjunctive
  // ═══════════════════════════════════════════════════════════════
  13: [
    { target: "Espero que tengas un buen viaje.", english: "I hope you have a good trip.", tags: ["general", "travel"], grammar: "Esperar que + subjunctive — expressing hopes" },
    { target: "No creo que llueva esta tarde.", english: "I don't think it will rain this afternoon.", tags: ["general"], grammar: "No creer que + subjunctive — expressing doubt" },
    { target: "Quiero que me digas la verdad.", english: "I want you to tell me the truth.", tags: ["general"] },
    { target: "Es importante que llegues puntual a la entrevista.", english: "It's important that you arrive on time to the interview.", tags: ["general", "work"], grammar: "Es + adjective + que + subjunctive — impersonal trigger" },
    { target: "Ojalá consiga el trabajo que quiero.", english: "I hope I get the job I want.", tags: ["general", "work"], grammar: "Ojalá + subjunctive — strong wish" },
    { target: "Me alegra que estés bien después del viaje.", english: "I'm glad you're well after the trip.", tags: ["general", "travel"] },
    { target: "No quiero que te preocupes por mí.", english: "I don't want you to worry about me.", tags: ["general", "family"] },
    { target: "Es necesario que todos firmen el contrato.", english: "It's necessary that everyone signs the contract.", tags: ["general", "work"] },
    { target: "Dudo que terminen el proyecto a tiempo.", english: "I doubt they'll finish the project on time.", tags: ["general", "work"], grammar: "Dudar que + subjunctive — expressing doubt" },
    { target: "Me sorprende que no sepas dónde está la estación.", english: "I'm surprised you don't know where the station is.", tags: ["general", "travel"] },
    { target: "Necesito que me envíes el archivo antes del mediodía.", english: "I need you to send me the file before noon.", tags: ["general", "work"] },
    { target: "Ojalá haga buen tiempo el día de la boda.", english: "I hope the weather is nice on the wedding day.", tags: ["general", "family"] },
    { target: "Es una pena que no puedas venir a la fiesta.", english: "It's a shame you can't come to the party.", tags: ["general"] },
    { target: "No es verdad que sea tan difícil como dicen.", english: "It's not true that it's as hard as they say.", tags: ["general"], grammar: "Negated truth statements trigger subjunctive" },
    { target: "Mi madre quiere que la llame todos los domingos.", english: "My mother wants me to call her every Sunday.", tags: ["general", "family"] },
    { target: "Espero que el vuelo no se retrase.", english: "I hope the flight isn't delayed.", tags: ["general", "travel"] },
    { target: "Es mejor que hablemos de esto en persona.", english: "It's better that we talk about this in person.", tags: ["general", "work"] },
    { target: "Me molesta que la gente hable durante la película.", english: "It bothers me that people talk during the movie.", tags: ["general"] },
    { target: "No creo que haya entradas disponibles para el concierto.", english: "I don't think there are tickets available for the concert.", tags: ["general"] },
    { target: "Quiero que mi hijo estudie lo que le haga feliz.", english: "I want my son to study whatever makes him happy.", tags: ["general", "family"] },
    { target: "Es raro que no haya contestado al correo.", english: "It's strange that he hasn't replied to the email.", tags: ["general", "work"], grammar: "Es raro que + subjunctive — emotion/judgment trigger" },
    { target: "Ojalá nos den el día libre el viernes.", english: "I hope they give us Friday off.", tags: ["general", "work"] },
    { target: "Me da miedo que se pierdan en la ciudad.", english: "I'm afraid they'll get lost in the city.", tags: ["general", "travel"] },
    { target: "Es posible que cambiemos la fecha de la reunión.", english: "It's possible that we'll change the meeting date.", tags: ["general", "work"], grammar: "Es posible que + subjunctive — possibility trigger" },
    { target: "No quiero que pienses que no me importa.", english: "I don't want you to think I don't care.", tags: ["general"] },
    { target: "Espero que mi familia venga a verme pronto.", english: "I hope my family comes to see me soon.", tags: ["general", "family"] },
    { target: "Es fundamental que el equipo trabaje unido.", english: "It's essential that the team works together.", tags: ["general", "work"] },
    { target: "Me encanta que mis hijos se lleven bien.", english: "I love that my kids get along well.", tags: ["general", "family"] },
    { target: "Dudo que encontremos hotel a estas alturas.", english: "I doubt we'll find a hotel at this point.", tags: ["general", "travel"] },
    { target: "Es probable que el jefe apruebe el presupuesto.", english: "It's likely that the boss will approve the budget.", tags: ["general", "work"] },
    { target: "Necesito que alguien me explique cómo funciona esto.", english: "I need someone to explain to me how this works.", tags: ["general", "work"] },
    { target: "Me preocupa que mi padre no cuide su salud.", english: "It worries me that my father doesn't take care of his health.", tags: ["general", "family"] },
    { target: "Ojalá podamos vernos antes de que te vayas.", english: "I hope we can see each other before you leave.", tags: ["general"] },
    { target: "No es justo que unos trabajen más que otros.", english: "It's not fair that some work more than others.", tags: ["general", "work"] },
    { target: "Quiero que sepas que estoy muy orgullosa de ti.", english: "I want you to know that I'm very proud of you.", tags: ["general", "family"] },
    { target: "Es increíble que ya hayan vendido todas las entradas.", english: "It's unbelievable that they've already sold all the tickets.", tags: ["general"] },
    { target: "Me fastidia que siempre llegues tarde a las reuniones.", english: "It annoys me that you always arrive late to meetings.", tags: ["general", "work"] },
    { target: "Espero que disfrutes de tus vacaciones.", english: "I hope you enjoy your vacation.", tags: ["general", "travel"] },
    { target: "No estoy seguro de que sea la mejor opción.", english: "I'm not sure it's the best option.", tags: ["general", "work"], grammar: "No estar seguro de que + subjunctive — uncertainty" },
    { target: "Es horrible que haya tanto tráfico a esta hora.", english: "It's horrible that there's so much traffic at this time.", tags: ["general"] },
    { target: "Quiero que nos reunamos para hablar del proyecto.", english: "I want us to meet to talk about the project.", tags: ["general", "work"] },
    { target: "Ojalá mi hermano consiga plaza en esa universidad.", english: "I hope my brother gets a spot at that university.", tags: ["general", "family"] },
    { target: "Es normal que estés nervioso antes de la entrevista.", english: "It's normal that you're nervous before the interview.", tags: ["general", "work"] },
    { target: "Me alegra mucho que hayas decidido venir.", english: "I'm very glad you've decided to come.", tags: ["general"] },
    { target: "No creo que valga la pena discutir por eso.", english: "I don't think it's worth arguing about that.", tags: ["general"] },
    { target: "Es urgente que revisemos estos números antes del lunes.", english: "It's urgent that we review these numbers before Monday.", tags: ["general", "work"] },
    { target: "Me da pena que se vayan tan pronto.", english: "It makes me sad that they're leaving so soon.", tags: ["general", "family"] },
    { target: "Espero que no haya mucha cola en el aeropuerto.", english: "I hope there's not a long line at the airport.", tags: ["general", "travel"] },
    { target: "No me parece bien que tomes esa decisión solo.", english: "I don't think it's right for you to make that decision alone.", tags: ["general", "work"] },
    { target: "Es maravilloso que por fin tengamos vacaciones.", english: "It's wonderful that we finally have vacation.", tags: ["general", "travel"] },
    { target: "Necesito que me confirmes si vienes o no.", english: "I need you to confirm whether you're coming or not.", tags: ["general"] },
    { target: "Ojalá encontremos un buen sitio para cenar.", english: "I hope we find a good place to have dinner.", tags: ["general", "travel"] },
    { target: "Me molesta que no me avisen con antelación.", english: "It bothers me that they don't let me know in advance.", tags: ["general", "work"] },
    { target: "Es lógico que quieras pasar más tiempo con tu familia.", english: "It's logical that you want to spend more time with your family.", tags: ["general", "family"] },
  ],

  // ═══════════════════════════════════════════════════════════════
  // NODE 14: Commands & Imperatives (B1)
  // Tú/usted/vosotros affirmative & negative, pronoun placement
  // ═══════════════════════════════════════════════════════════════
  14: [
    { target: "Dime qué necesitas y te ayudo.", english: "Tell me what you need and I'll help you.", tags: ["general", "work"], grammar: "Decir → di (tú imperative, irregular)" },
    { target: "No te olvides de traer los documentos mañana.", english: "Don't forget to bring the documents tomorrow.", tags: ["general", "work"], grammar: "Negative tú command: no + present subjunctive" },
    { target: "Ven aquí un momento, por favor.", english: "Come here for a moment, please.", tags: ["general"], grammar: "Venir → ven (irregular tú imperative)" },
    { target: "No toques eso, está muy caliente.", english: "Don't touch that, it's very hot.", tags: ["general"] },
    { target: "Siéntese, por favor, el doctor lo atenderá en seguida.", english: "Please sit down, the doctor will see you right away.", tags: ["general"], grammar: "Usted imperative: sentarse → siéntese" },
    { target: "Hazme un favor y cierra la puerta al salir.", english: "Do me a favor and close the door on your way out.", tags: ["general", "work"], grammar: "Hacer → haz (irregular tú imperative)" },
    { target: "No le digas nada a tu hermano todavía.", english: "Don't say anything to your brother yet.", tags: ["general", "family"] },
    { target: "Ponlo en la mesa de la cocina.", english: "Put it on the kitchen table.", tags: ["general"], grammar: "Poner → pon (irregular tú) + lo (pronoun attached)" },
    { target: "Escucha, tengo algo importante que contarte.", english: "Listen, I have something important to tell you.", tags: ["general"] },
    { target: "No corras por el pasillo, que te puedes caer.", english: "Don't run in the hallway, you might fall.", tags: ["general", "family"] },
    { target: "Envíeme el presupuesto por correo electrónico.", english: "Send me the budget by email.", tags: ["general", "work"], grammar: "Usted imperative with pronoun: envíe + me" },
    { target: "Sal de casa ahora o llegarás tarde.", english: "Leave the house now or you'll be late.", tags: ["general"], grammar: "Salir → sal (irregular tú imperative)" },
    { target: "No te preocupes tanto, todo va a salir bien.", english: "Don't worry so much, everything's going to be fine.", tags: ["general", "family"] },
    { target: "Trae la cuenta, por favor.", english: "Bring the check, please.", tags: ["general", "travel"] },
    { target: "Ten cuidado con esa escalera, es muy vieja.", english: "Be careful with that ladder, it's very old.", tags: ["general"], grammar: "Tener → ten (irregular tú imperative)" },
    { target: "No gastes todo el dinero en tonterías.", english: "Don't spend all the money on nonsense.", tags: ["general", "family"] },
    { target: "Dígame su nombre y apellido, por favor.", english: "Tell me your first and last name, please.", tags: ["general", "work"], grammar: "Usted formal imperative: decir → diga + me" },
    { target: "Pásame la sal, ¿quieres?", english: "Pass me the salt, will you?", tags: ["general"] },
    { target: "No dejes las llaves dentro del coche.", english: "Don't leave the keys inside the car.", tags: ["general", "travel"] },
    { target: "Llama a tu madre, que está preocupada.", english: "Call your mother, she's worried.", tags: ["general", "family"] },
    { target: "Ve al supermercado y compra leche y pan.", english: "Go to the supermarket and buy milk and bread.", tags: ["general"], grammar: "Ir → ve (irregular tú imperative)" },
    { target: "No comas tan rápido, te va a sentar mal.", english: "Don't eat so fast, it'll upset your stomach.", tags: ["general"] },
    { target: "Firme aquí abajo, por favor.", english: "Sign here at the bottom, please.", tags: ["general", "work"] },
    { target: "Apaga la luz cuando salgas de la habitación.", english: "Turn off the light when you leave the room.", tags: ["general"] },
    { target: "No abras ese archivo, puede tener un virus.", english: "Don't open that file, it might have a virus.", tags: ["general", "work"] },
    { target: "Espera un momento, ahora mismo estoy contigo.", english: "Wait a moment, I'll be right with you.", tags: ["general", "work"] },
    { target: "Recoge tu cuarto antes de salir.", english: "Clean up your room before going out.", tags: ["general", "family"] },
    { target: "No te vayas sin despedirte de los abuelos.", english: "Don't leave without saying goodbye to grandma and grandpa.", tags: ["general", "family"] },
    { target: "Compruebe que todos los datos son correctos.", english: "Check that all the data is correct.", tags: ["general", "work"], grammar: "Usted imperative: comprobar → compruebe" },
    { target: "Dame cinco minutos y te atiendo.", english: "Give me five minutes and I'll attend to you.", tags: ["general", "work"], grammar: "Dar → da (tú) + me — pronoun attached to affirmative" },
    { target: "No pierdas la calma, lo solucionaremos.", english: "Don't lose your cool, we'll sort it out.", tags: ["general", "work"] },
    { target: "Sube el volumen, no se oye nada.", english: "Turn up the volume, you can't hear anything.", tags: ["general"] },
    { target: "No dejes para mañana lo que puedas hacer hoy.", english: "Don't leave for tomorrow what you can do today.", tags: ["general", "work"] },
    { target: "Cuéntame qué pasó en la reunión.", english: "Tell me what happened at the meeting.", tags: ["general", "work"] },
    { target: "Prueba este plato, está buenísimo.", english: "Try this dish, it's really good.", tags: ["general", "travel"] },
    { target: "No hables tan alto, los niños están durmiendo.", english: "Don't talk so loud, the kids are sleeping.", tags: ["general", "family"] },
    { target: "Acuéstate temprano, mañana tienes examen.", english: "Go to bed early, you have an exam tomorrow.", tags: ["general", "family"] },
    { target: "Sé paciente, ya casi estamos.", english: "Be patient, we're almost there.", tags: ["general"], grammar: "Ser → sé (irregular tú imperative)" },
    { target: "No le cuentes esto a nadie, es un secreto.", english: "Don't tell anyone about this, it's a secret.", tags: ["general"] },
    { target: "Rellene este formulario y entréguelo en recepción.", english: "Fill out this form and hand it in at reception.", tags: ["general", "work"] },
    { target: "Coge el paraguas, que va a llover.", english: "Take the umbrella, it's going to rain.", tags: ["general"] },
    { target: "No te metas en lo que no te importa.", english: "Don't get involved in what's none of your business.", tags: ["general"] },
    { target: "Pide lo que quieras, yo invito.", english: "Order whatever you want, my treat.", tags: ["general", "travel"] },
    { target: "No te acuestes tarde, que mañana madrugas.", english: "Don't go to bed late, you have an early morning tomorrow.", tags: ["general", "family"] },
    { target: "Devuélveme el libro cuando lo termines.", english: "Return the book to me when you finish it.", tags: ["general"] },
    { target: "No aparques ahí, es zona de carga y descarga.", english: "Don't park there, it's a loading zone.", tags: ["general", "travel"] },
    { target: "Mira los resultados del trimestre y dime qué opinas.", english: "Look at the quarterly results and tell me what you think.", tags: ["general", "work"] },
    { target: "Lávate las manos antes de comer.", english: "Wash your hands before eating.", tags: ["general", "family"] },
    { target: "No te rindas ahora, falta muy poco.", english: "Don't give up now, there's very little left.", tags: ["general", "work"] },
    { target: "Reserva una mesa para cuatro, por favor.", english: "Book a table for four, please.", tags: ["general", "travel"] },
    { target: "No conduzcas tan rápido, me pones nervioso.", english: "Don't drive so fast, you're making me nervous.", tags: ["general", "travel"] },
    { target: "Haz la cama antes de irte al colegio.", english: "Make the bed before you go to school.", tags: ["general", "family"] },
    { target: "Disculpe, repita la dirección, no la he entendido.", english: "Excuse me, repeat the address, I didn't understand it.", tags: ["general", "travel"] },
    { target: "Mándame un mensaje cuando llegues a casa.", english: "Send me a message when you get home.", tags: ["general", "family"] },
  ],

  // ═══════════════════════════════════════════════════════════════
  // NODE 15: Relative Clauses (B1)
  // que, quien, donde, lo que, el/la cual, cuyo
  // ═══════════════════════════════════════════════════════════════
  15: [
    { target: "El profesor que nos dio la clase es muy exigente.", english: "The teacher who gave us the class is very demanding.", tags: ["general"] },
    { target: "La cafetería donde desayunamos tiene wifi gratis.", english: "The cafe where we have breakfast has free wifi.", tags: ["general", "travel"] },
    { target: "Lo que más me estresa del trabajo son los plazos.", english: "What stresses me most about work is the deadlines.", tags: ["general", "work"], grammar: "Lo que — what/that which, for abstract ideas" },
    { target: "La empresa donde hice las prácticas me ofreció un puesto.", english: "The company where I did my internship offered me a position.", tags: ["general", "work"] },
    { target: "El tipo con quien hablé en la fiesta era argentino.", english: "The guy I talked to at the party was Argentinian.", tags: ["general"], grammar: "Con quien — with whom, after prepositions for people" },
    { target: "La maleta que facturé no ha llegado todavía.", english: "The suitcase I checked in hasn't arrived yet.", tags: ["general", "travel"] },
    { target: "Lo que dijo mi jefa me dejó sin palabras.", english: "What my boss said left me speechless.", tags: ["general", "work"] },
    { target: "El parque donde jugábamos de niños ya no existe.", english: "The park where we used to play as kids no longer exists.", tags: ["general", "family"] },
    { target: "La chica cuyo padre es médico vive en mi bloque.", english: "The girl whose father is a doctor lives in my building.", tags: ["general"], grammar: "Cuyo/a — whose, agrees with the possessed noun, not the owner" },
    { target: "El colegio donde estudié está en el centro.", english: "The school where I studied is in the city center.", tags: ["general"] },
    { target: "Las personas que conocí en el congreso eran muy interesantes.", english: "The people I met at the conference were very interesting.", tags: ["general", "work"] },
    { target: "Lo que necesitamos es más tiempo, no más gente.", english: "What we need is more time, not more people.", tags: ["general", "work"] },
    { target: "El bar donde quedamos siempre está lleno los viernes.", english: "The bar where we always meet is full on Fridays.", tags: ["general"] },
    { target: "La compañera con la que comparto despacho es muy maja.", english: "The colleague I share an office with is very nice.", tags: ["general", "work"], grammar: "Con la que — with whom (female), preposition + article + que" },
    { target: "El pueblo donde veranea mi tía es precioso.", english: "The town where my aunt spends summers is lovely.", tags: ["general", "family", "travel"] },
    { target: "Lo que me contaste ayer me tiene preocupado.", english: "What you told me yesterday has me worried.", tags: ["general"] },
    { target: "El museo donde trabajaba mi padre cerró hace años.", english: "The museum where my father used to work closed years ago.", tags: ["general", "family"] },
    { target: "El motivo por el que renuncié fue el horario.", english: "The reason I quit was the schedule.", tags: ["general", "work"], grammar: "Por el que — for which, compound relative pronoun" },
    { target: "La tienda donde compro el café ha subido los precios.", english: "The store where I buy coffee has raised its prices.", tags: ["general"] },
    { target: "El proyecto en el que trabajamos lleva seis meses de retraso.", english: "The project we're working on is six months behind.", tags: ["general", "work"] },
    { target: "Lo que me pasa es que no puedo concentrarme.", english: "What's happening with me is that I can't concentrate.", tags: ["general", "work"] },
    { target: "La persona a la que llamé no me devolvió la llamada.", english: "The person I called didn't return my call.", tags: ["general", "work"], grammar: "A la que — whom (direct object with preposition a)" },
    { target: "El aeropuerto desde donde volamos es bastante pequeño.", english: "The airport we fly from is quite small.", tags: ["general", "travel"] },
    { target: "La reunión en la que participé fue productiva.", english: "The meeting I participated in was productive.", tags: ["general", "work"] },
    { target: "Lo que echo de menos es la comida casera.", english: "What I miss is homemade food.", tags: ["general", "family"] },
    { target: "El barrio donde crecí era más seguro antes.", english: "The neighborhood where I grew up used to be safer.", tags: ["general"] },
    { target: "El tipo que arregló el ordenador hizo un buen trabajo.", english: "The guy who fixed the computer did a good job.", tags: ["general", "work"] },
    { target: "La playa a la que fuimos estaba completamente vacía.", english: "The beach we went to was completely empty.", tags: ["general", "travel"] },
    { target: "Lo que no entiendo es para qué sirve esta reunión.", english: "What I don't understand is what this meeting is for.", tags: ["general", "work"] },
    { target: "Las primas con las que crecí viven en otra ciudad.", english: "The cousins I grew up with live in another city.", tags: ["general", "family"], grammar: "Con las que — with whom (plural feminine)" },
    { target: "El momento en que supe la noticia me puse a llorar.", english: "The moment I found out the news I started crying.", tags: ["general"] },
    { target: "El taller donde llevan el coche mis padres es de confianza.", english: "The garage where my parents take the car is trustworthy.", tags: ["general", "family"] },
    { target: "La aplicación que uso para traducir es muy buena.", english: "The app I use for translating is very good.", tags: ["general", "work"] },
    { target: "Lo que hiciste por nosotros no lo olvidaré nunca.", english: "What you did for us I'll never forget.", tags: ["general", "family"] },
    { target: "El edificio donde está mi oficina tiene diez pisos.", english: "The building where my office is has ten floors.", tags: ["general", "work"] },
    { target: "La forma en la que hablas con los clientes es genial.", english: "The way you talk to clients is great.", tags: ["general", "work"], grammar: "En la que — in which, relative with preposition" },
    { target: "El sitio donde aparcamos era zona azul.", english: "The place where we parked was a paid parking zone.", tags: ["general", "travel"] },
    { target: "La razón por la cual no fui era que estaba enfermo.", english: "The reason I didn't go was that I was sick.", tags: ["general"] },
    { target: "Lo que me gusta de esta ciudad es que nunca duerme.", english: "What I like about this city is that it never sleeps.", tags: ["general", "travel"] },
    { target: "El amigo que me recomendó este libro tenía razón.", english: "The friend who recommended this book to me was right.", tags: ["general"] },
    { target: "Los clientes para los que trabajo son muy exigentes.", english: "The clients I work for are very demanding.", tags: ["general", "work"], grammar: "Para los que — for whom, preposition + article + que" },
    { target: "La habitación donde dormí tenía unas vistas increíbles.", english: "The room where I slept had incredible views.", tags: ["general", "travel"] },
    { target: "El curso que estoy haciendo es online.", english: "The course I'm taking is online.", tags: ["general", "work"] },
    { target: "Lo que pasa es que no hay suficiente personal.", english: "The thing is that there isn't enough staff.", tags: ["general", "work"] },
    { target: "El vecino cuyo perro ladra todo el día me tiene harto.", english: "The neighbor whose dog barks all day drives me crazy.", tags: ["general"] },
    { target: "La conferencia a la que asistí fue sobre inteligencia artificial.", english: "The conference I attended was about artificial intelligence.", tags: ["general", "work"] },
    { target: "Los familiares con quienes celebramos la Navidad viven lejos.", english: "The family members we celebrate Christmas with live far away.", tags: ["general", "family"] },
    { target: "El restaurante donde celebramos el cumpleaños cerró.", english: "The restaurant where we celebrated the birthday closed.", tags: ["general", "family"] },
    { target: "Lo que de verdad importa es la salud.", english: "What truly matters is health.", tags: ["general"] },
    { target: "La zona donde alquilamos el apartamento era muy turística.", english: "The area where we rented the apartment was very touristy.", tags: ["general", "travel"] },
    { target: "El compañero al que le pedí ayuda estaba ocupado.", english: "The colleague I asked for help was busy.", tags: ["general", "work"] },
    { target: "La plaza donde quedamos está al lado de la catedral.", english: "The square where we're meeting is next to the cathedral.", tags: ["general", "travel"] },
    { target: "Lo que deberías hacer es hablar con recursos humanos.", english: "What you should do is talk to human resources.", tags: ["general", "work"] },
    { target: "El pueblo donde nació mi abuelo tiene quinientos habitantes.", english: "The town where my grandfather was born has five hundred inhabitants.", tags: ["general", "family"] },
  ],

  // ═══════════════════════════════════════════════════════════════
  // NODE 16: Imperfect Subjunctive (B2)
  // Past subjunctive triggers, wishes, hypotheticals, -ra/-se forms
  // ═══════════════════════════════════════════════════════════════
  16: [
    { target: "Si tuviera más tiempo, aprendería a tocar la guitarra.", english: "If I had more time, I'd learn to play the guitar.", tags: ["general"], grammar: "Si + imperfect subjunctive + conditional — hypothetical" },
    { target: "Me pidió que le enviara el informe antes del viernes.", english: "He asked me to send him the report before Friday.", tags: ["general", "work"], grammar: "Pedir que + imperfect subjunctive — reported request" },
    { target: "Ojalá pudiera tomarme unas vacaciones ahora mismo.", english: "I wish I could take a vacation right now.", tags: ["general", "travel"] },
    { target: "No esperaba que la reunión durara tanto.", english: "I didn't expect the meeting to last so long.", tags: ["general", "work"] },
    { target: "Si yo fuera tú, pediría un aumento.", english: "If I were you, I'd ask for a raise.", tags: ["general", "work"], grammar: "Si yo fuera tú — if I were you, common hypothetical" },
    { target: "Me gustaría que mi familia viviera más cerca.", english: "I'd like my family to live closer.", tags: ["general", "family"] },
    { target: "El jefe quería que terminásemos el proyecto para junio.", english: "The boss wanted us to finish the project by June.", tags: ["general", "work"], grammar: "-ásemos — alternative imperfect subjunctive form (-se ending)" },
    { target: "Si hablaras con ella, entenderías su punto de vista.", english: "If you talked to her, you'd understand her point of view.", tags: ["general"] },
    { target: "Me sorprendió que no supiera nada del cambio.", english: "I was surprised she didn't know anything about the change.", tags: ["general", "work"] },
    { target: "Ojalá hubiera más oportunidades de empleo aquí.", english: "I wish there were more job opportunities here.", tags: ["general", "work"] },
    { target: "Si pudiéramos elegir la fecha, iríamos en septiembre.", english: "If we could choose the date, we'd go in September.", tags: ["general", "travel"] },
    { target: "No creía que fuera tan difícil encontrar piso.", english: "I didn't think it would be so hard to find an apartment.", tags: ["general"] },
    { target: "Me recomendó que buscara trabajo en otra empresa.", english: "She recommended that I look for a job at another company.", tags: ["general", "work"] },
    { target: "Si viviera en la playa, iría a correr cada mañana.", english: "If I lived on the beach, I'd go for a run every morning.", tags: ["general", "travel"] },
    { target: "Era necesario que todos los empleados hicieran el curso.", english: "It was necessary for all employees to take the course.", tags: ["general", "work"] },
    { target: "Ojalá mis hijos fueran más responsables.", english: "I wish my kids were more responsible.", tags: ["general", "family"] },
    { target: "Si ganara más, ahorraría para comprar una casa.", english: "If I earned more, I'd save to buy a house.", tags: ["general", "work"] },
    { target: "Me dijo que no me preocupara tanto por el trabajo.", english: "He told me not to worry so much about work.", tags: ["general", "work"] },
    { target: "Si pudiera volver atrás, estudiaría otra carrera.", english: "If I could go back, I'd study a different degree.", tags: ["general"] },
    { target: "Dudaba que el proyecto saliera adelante.", english: "I doubted the project would go ahead.", tags: ["general", "work"] },
    { target: "Me habría gustado que vinieras a la boda.", english: "I would have liked you to come to the wedding.", tags: ["general", "family"] },
    { target: "Si no lloviera tanto, iríamos a la playa.", english: "If it weren't raining so much, we'd go to the beach.", tags: ["general", "travel"] },
    { target: "No había nadie que supiera arreglar el problema.", english: "There was no one who knew how to fix the problem.", tags: ["general", "work"], grammar: "Nadie que + subjunctive — nonexistent antecedent trigger" },
    { target: "Ojalá tuviera un trabajo con horario flexible.", english: "I wish I had a job with flexible hours.", tags: ["general", "work"] },
    { target: "Le pedí que me acompañara al médico.", english: "I asked him to go with me to the doctor.", tags: ["general", "family"] },
    { target: "Si supieras lo que ha pasado, no te lo creerías.", english: "If you knew what happened, you wouldn't believe it.", tags: ["general"] },
    { target: "No pensaba que fuera tan complicado mudarme.", english: "I didn't think moving would be so complicated.", tags: ["general"] },
    { target: "Si trabajara menos horas, pasaría más tiempo con mis hijos.", english: "If I worked fewer hours, I'd spend more time with my kids.", tags: ["general", "family", "work"] },
    { target: "Era imprescindible que llegaran antes de las nueve.", english: "It was essential that they arrived before nine.", tags: ["general", "work"] },
    { target: "Ojalá encontrara un vuelo más barato.", english: "I wish I could find a cheaper flight.", tags: ["general", "travel"] },
    { target: "Me sugirió que hablara directamente con el director.", english: "He suggested I speak directly with the director.", tags: ["general", "work"] },
    { target: "Si no estuviera tan cansado, saldría contigo.", english: "If I weren't so tired, I'd go out with you.", tags: ["general"] },
    { target: "No quería que mis padres se enteraran de lo que pasó.", english: "I didn't want my parents to find out what happened.", tags: ["general", "family"] },
    { target: "Si tuviéramos coche, no dependeríamos del transporte público.", english: "If we had a car, we wouldn't depend on public transport.", tags: ["general", "travel"] },
    { target: "Buscaba un hotel que estuviera cerca de la estación.", english: "I was looking for a hotel that was close to the station.", tags: ["general", "travel"], grammar: "Buscaba + que + subjunctive — seeking something uncertain/nonspecific" },
    { target: "Ojalá pudiera pasar más tiempo con mi familia.", english: "I wish I could spend more time with my family.", tags: ["general", "family"] },
    { target: "Me pidieron que preparara un informe de resultados.", english: "They asked me to prepare a results report.", tags: ["general", "work"] },
    { target: "Si no fuera por mi equipo, no habría aguantado.", english: "If it weren't for my team, I wouldn't have lasted.", tags: ["general", "work"] },
    { target: "Necesitaba alguien que hablara japonés.", english: "I needed someone who spoke Japanese.", tags: ["general", "work"] },
    { target: "Ojalá hiciera mejor tiempo este fin de semana.", english: "I wish the weather were better this weekend.", tags: ["general"] },
    { target: "Esperaba que me llamaran para la entrevista.", english: "I was hoping they'd call me for the interview.", tags: ["general", "work"] },
    { target: "Si viviéramos más cerca, nos veríamos más a menudo.", english: "If we lived closer, we'd see each other more often.", tags: ["general", "family"] },
    { target: "Le aconsejé que no firmara el contrato tan rápido.", english: "I advised him not to sign the contract so quickly.", tags: ["general", "work"] },
    { target: "Si me tocara la lotería, dejaría el trabajo mañana.", english: "If I won the lottery, I'd quit my job tomorrow.", tags: ["general", "work"] },
    { target: "No encontramos ningún restaurante que abriera tan tarde.", english: "We couldn't find any restaurant that was open so late.", tags: ["general", "travel"] },
    { target: "Ojalá existiera un tren directo a esa ciudad.", english: "I wish there were a direct train to that city.", tags: ["general", "travel"] },
    { target: "Me parecía raro que no contestara al teléfono.", english: "I thought it was strange that he wasn't answering the phone.", tags: ["general"] },
    { target: "Si no tuviera tantas reuniones, sería más productivo.", english: "If I didn't have so many meetings, I'd be more productive.", tags: ["general", "work"] },
    { target: "Quería que mis padres conocieran a mi pareja.", english: "I wanted my parents to meet my partner.", tags: ["general", "family"] },
    { target: "Si la empresa ofreciera formación, me apuntaría.", english: "If the company offered training, I'd sign up.", tags: ["general", "work"] },
    { target: "No había ningún asiento que estuviera libre.", english: "There wasn't a single seat that was free.", tags: ["general", "travel"] },
    { target: "Si supiera cocinar tan bien como mi madre, invitaría gente cada semana.", english: "If I could cook as well as my mother, I'd invite people over every week.", tags: ["general", "family"] },
    { target: "Prefería que me lo dijeras en persona.", english: "I preferred that you tell me in person.", tags: ["general"] },
    { target: "Ojalá hubiera empezado a ahorrar antes.", english: "I wish I had started saving earlier.", tags: ["general"], grammar: "Ojalá + pluperfect subjunctive — regret about the past" },
  ],

  // ═══════════════════════════════════════════════════════════════
  // NODE 17: Conditionals II & III (B2)
  // Si + imperfect subjunctive + conditional, si + pluperfect sub + conditional perfect
  // ═══════════════════════════════════════════════════════════════
  17: [
    { target: "Si hubiera salido antes, no habría perdido el tren.", english: "If I had left earlier, I wouldn't have missed the train.", tags: ["general", "travel"], grammar: "Type III: si + pluperfect subjunctive + conditional perfect" },
    { target: "Si tuviera un jardín, plantaría tomates y hierbas.", english: "If I had a garden, I'd plant tomatoes and herbs.", tags: ["general"] },
    { target: "No habría aceptado el puesto si hubiera sabido las condiciones.", english: "I wouldn't have accepted the position if I'd known the conditions.", tags: ["general", "work"] },
    { target: "Si me hubieran avisado, habría preparado la presentación.", english: "If they had warned me, I would have prepared the presentation.", tags: ["general", "work"], grammar: "Type III conditional — past counterfactual" },
    { target: "Si viviera en otra ciudad, tendría que empezar de cero.", english: "If I lived in another city, I'd have to start from scratch.", tags: ["general"] },
    { target: "Habríamos llegado a tiempo si no hubiera habido tráfico.", english: "We would have arrived on time if there hadn't been traffic.", tags: ["general", "travel"] },
    { target: "Si hablara chino, podría trabajar en su oficina de Pekín.", english: "If I spoke Chinese, I could work in their Beijing office.", tags: ["general", "work"] },
    { target: "Si me lo hubieras dicho antes, habría cambiado los planes.", english: "If you had told me earlier, I would have changed the plans.", tags: ["general"] },
    { target: "Si ganara el doble, me compraría una casa en la playa.", english: "If I earned twice as much, I'd buy a house on the beach.", tags: ["general"] },
    { target: "No habría ido a esa entrevista si hubiera sabido cómo era la empresa.", english: "I wouldn't have gone to that interview if I'd known what the company was like.", tags: ["general", "work"] },
    { target: "Si tuviéramos más presupuesto, contrataríamos a dos personas más.", english: "If we had more budget, we'd hire two more people.", tags: ["general", "work"] },
    { target: "Si hubiera estudiado medicina, ahora sería doctor.", english: "If I had studied medicine, I'd be a doctor now.", tags: ["general"], grammar: "Mixed conditional: pluperfect sub + simple conditional (past cause, present result)" },
    { target: "Si no lloviera, iríamos al parque con los niños.", english: "If it weren't raining, we'd go to the park with the kids.", tags: ["general", "family"] },
    { target: "Si hubiéramos reservado antes, habríamos conseguido mejor precio.", english: "If we had booked earlier, we would have gotten a better price.", tags: ["general", "travel"] },
    { target: "Si tuviera coche, te llevaría al aeropuerto.", english: "If I had a car, I'd take you to the airport.", tags: ["general", "travel"] },
    { target: "No me habría mudado si hubiera sabido lo caro que es todo aquí.", english: "I wouldn't have moved if I had known how expensive everything is here.", tags: ["general"] },
    { target: "Si supiera programar, montaría mi propia aplicación.", english: "If I knew how to code, I'd build my own app.", tags: ["general", "work"] },
    { target: "Si hubieras venido a la cena, habrías conocido a mi jefe.", english: "If you had come to dinner, you would have met my boss.", tags: ["general", "work"] },
    { target: "Si no trabajara tanto, tendría más tiempo para mi familia.", english: "If I didn't work so much, I'd have more time for my family.", tags: ["general", "family", "work"] },
    { target: "Si no hubiera llovido, la boda habría sido al aire libre.", english: "If it hadn't rained, the wedding would have been outdoors.", tags: ["general", "family"] },
    { target: "Si me ofrecieran un traslado a Londres, lo pensaría.", english: "If they offered me a transfer to London, I'd think about it.", tags: ["general", "work", "travel"] },
    { target: "Si hubiera cogido el otro camino, habríamos llegado antes.", english: "If I had taken the other road, we would have arrived sooner.", tags: ["general", "travel"] },
    { target: "Si tuviera mejor sueldo, no necesitaría un segundo trabajo.", english: "If I had a better salary, I wouldn't need a second job.", tags: ["general", "work"] },
    { target: "Si hubiéramos sabido que estabas aquí, te habríamos invitado.", english: "If we had known you were here, we would have invited you.", tags: ["general"] },
    { target: "Si pudiera elegir, viviría en un pueblo pequeño.", english: "If I could choose, I'd live in a small town.", tags: ["general"] },
    { target: "No habría comprado ese coche si hubiera visto las reseñas.", english: "I wouldn't have bought that car if I had seen the reviews.", tags: ["general"] },
    { target: "Si me dieran más responsabilidades, estaría más motivado.", english: "If they gave me more responsibilities, I'd be more motivated.", tags: ["general", "work"] },
    { target: "Si hubiera aprendido inglés de joven, ahora no tendría tantos problemas.", english: "If I had learned English when I was young, I wouldn't have so many problems now.", tags: ["general"], grammar: "Mixed: pluperfect subjunctive + simple conditional" },
    { target: "Si tuviera vacaciones, iría a ver a mis padres.", english: "If I had vacation, I'd go see my parents.", tags: ["general", "family", "travel"] },
    { target: "Si nos hubiéramos levantado antes, habríamos visto el amanecer.", english: "If we had gotten up earlier, we would have seen the sunrise.", tags: ["general", "travel"] },
    { target: "Si no existiera el correo electrónico, todo sería más lento.", english: "If email didn't exist, everything would be slower.", tags: ["general", "work"] },
    { target: "Si hubiera podido, habría ido a tu graduación.", english: "If I could have, I would have gone to your graduation.", tags: ["general", "family"] },
    { target: "Si tuviéramos una terraza, haríamos barbacoas los fines de semana.", english: "If we had a terrace, we'd have barbecues on weekends.", tags: ["general", "family"] },
    { target: "Si me hubieran dado el día libre, habría ido al médico.", english: "If they had given me the day off, I would have gone to the doctor.", tags: ["general", "work"] },
    { target: "Si pudiera teletrabajar, ahorraría mucho en transporte.", english: "If I could work remotely, I'd save a lot on transportation.", tags: ["general", "work"], grammar: "Conditional II: hypothetical present/future" },
    { target: "No habríamos discutido si me hubieras escuchado.", english: "We wouldn't have argued if you had listened to me.", tags: ["general", "family"] },
    { target: "Si la oficina estuviera más cerca, iría andando.", english: "If the office were closer, I'd walk.", tags: ["general", "work"] },
    { target: "Si hubiera hecho la reserva antes, tendríamos mejor hotel.", english: "If I had made the reservation earlier, we'd have a better hotel.", tags: ["general", "travel"] },
    { target: "Si no tuviera tantos gastos, podría viajar más.", english: "If I didn't have so many expenses, I could travel more.", tags: ["general", "travel"] },
    { target: "Si hubieras aceptado el trabajo, ahora estarías en Nueva York.", english: "If you had accepted the job, you'd be in New York now.", tags: ["general", "work"] },
    { target: "Si pudiera retroceder en el tiempo, cambiaría muchas cosas.", english: "If I could go back in time, I'd change many things.", tags: ["general"] },
    { target: "No habría pasado nada si hubiéramos seguido las instrucciones.", english: "Nothing would have happened if we had followed the instructions.", tags: ["general", "work"] },
    { target: "Si viviéramos en el campo, los niños jugarían más al aire libre.", english: "If we lived in the countryside, the kids would play outside more.", tags: ["general", "family"] },
    { target: "Si me hubiera preparado mejor, habría hecho una mejor entrevista.", english: "If I had prepared better, I would have done a better interview.", tags: ["general", "work"] },
    { target: "Si no fuera tan tarde, pasaríamos por casa de tu madre.", english: "If it weren't so late, we'd stop by your mother's house.", tags: ["general", "family"] },
    { target: "Si hubieras probado ese restaurante, te habría encantado.", english: "If you had tried that restaurant, you would have loved it.", tags: ["general", "travel"] },
    { target: "Si la empresa cerrara, no sabría qué hacer.", english: "If the company closed, I wouldn't know what to do.", tags: ["general", "work"] },
    { target: "Si hubieran cancelado el vuelo, habríamos perdido la conexión.", english: "If they had canceled the flight, we would have missed the connection.", tags: ["general", "travel"] },
    { target: "Si no tuviera esta reunión, me iría a casa temprano.", english: "If I didn't have this meeting, I'd go home early.", tags: ["general", "work"] },
    { target: "Si hubiéramos comprado las entradas antes, habríamos ahorrado dinero.", english: "If we had bought the tickets earlier, we would have saved money.", tags: ["general", "travel"] },
    { target: "Si conociera a alguien en esa empresa, pediría una recomendación.", english: "If I knew someone at that company, I'd ask for a referral.", tags: ["general", "work"] },
    { target: "Si hubiera hecho más ejercicio, estaría en mejor forma.", english: "If I had exercised more, I'd be in better shape.", tags: ["general"] },
    { target: "Si pudiera hablar con el director, le propondría mi idea.", english: "If I could speak with the director, I'd propose my idea.", tags: ["general", "work"] },
    { target: "Si no hubiera nevado, el vuelo no se habría retrasado.", english: "If it hadn't snowed, the flight wouldn't have been delayed.", tags: ["general", "travel"] },
  ],

  // ═══════════════════════════════════════════════════════════════
  // NODE 18: Passive & Impersonal (B2)
  // ser + past participle, se pasiva, se impersonal, third person plural impersonal
  // ═══════════════════════════════════════════════════════════════
  18: [
    { target: "El contrato fue firmado por ambas partes ayer.", english: "The contract was signed by both parties yesterday.", tags: ["general", "work"], grammar: "Passive with ser: ser + past participle + por (agent)" },
    { target: "Aquí se habla español y portugués.", english: "Spanish and Portuguese are spoken here.", tags: ["general", "travel"], grammar: "Se pasiva refleja — passive se with intransitive meaning" },
    { target: "Se necesitan programadores con experiencia en Python.", english: "Programmers with Python experience are needed.", tags: ["general", "work"] },
    { target: "La reunión fue cancelada por falta de quórum.", english: "The meeting was canceled due to lack of quorum.", tags: ["general", "work"] },
    { target: "Se prohíbe fumar en todo el edificio.", english: "Smoking is prohibited in the entire building.", tags: ["general", "work"], grammar: "Se impersonal — impersonal se for rules and regulations" },
    { target: "El edificio fue construido en los años cincuenta.", english: "The building was built in the fifties.", tags: ["general"] },
    { target: "Se busca camarero con experiencia para restaurante céntrico.", english: "Experienced waiter wanted for downtown restaurant.", tags: ["general", "work"] },
    { target: "La decisión fue tomada sin consultar al equipo.", english: "The decision was made without consulting the team.", tags: ["general", "work"] },
    { target: "Se ruega silencio durante la conferencia.", english: "Silence is requested during the conference.", tags: ["general", "work"] },
    { target: "Los resultados fueron publicados esta mañana.", english: "The results were published this morning.", tags: ["general", "work"] },
    { target: "Dicen que van a subir los precios el mes que viene.", english: "They say they're going to raise prices next month.", tags: ["general"], grammar: "Third person plural impersonal — dicen que (they say)" },
    { target: "Se venden pisos nuevos con garaje incluido.", english: "New apartments with garage included are for sale.", tags: ["general"] },
    { target: "La carretera fue cortada por las obras.", english: "The road was closed due to construction.", tags: ["general", "travel"] },
    { target: "Se recomienda reservar con antelación.", english: "It is recommended to book in advance.", tags: ["general", "travel"], grammar: "Se impersonal — impersonal recommendation" },
    { target: "El puente fue inaugurado por el alcalde.", english: "The bridge was inaugurated by the mayor.", tags: ["general"] },
    { target: "Se puede pagar con tarjeta o en efectivo.", english: "You can pay by card or in cash.", tags: ["general", "travel"] },
    { target: "Los empleados fueron informados del cambio por correo.", english: "The employees were informed of the change by email.", tags: ["general", "work"] },
    { target: "Se alquila habitación en piso compartido.", english: "Room for rent in a shared apartment.", tags: ["general"] },
    { target: "La propuesta fue rechazada por la junta directiva.", english: "The proposal was rejected by the board of directors.", tags: ["general", "work"] },
    { target: "Se dice que esta ciudad es la más segura del país.", english: "It's said that this city is the safest in the country.", tags: ["general", "travel"], grammar: "Se dice que — it is said that, impersonal report" },
    { target: "El proyecto fue financiado por inversores privados.", english: "The project was funded by private investors.", tags: ["general", "work"] },
    { target: "No se permite la entrada con mochilas grandes.", english: "Entry with large backpacks is not allowed.", tags: ["general", "travel"] },
    { target: "La carta fue entregada en mano esta mañana.", english: "The letter was hand-delivered this morning.", tags: ["general", "work"] },
    { target: "Se cree que la economía mejorará el próximo trimestre.", english: "It's believed that the economy will improve next quarter.", tags: ["general", "work"], grammar: "Se cree que — it is believed that" },
    { target: "Este plato se prepara con aceite de oliva y ajo.", english: "This dish is prepared with olive oil and garlic.", tags: ["general"] },
    { target: "Las obras fueron terminadas antes de lo previsto.", english: "The construction was completed ahead of schedule.", tags: ["general", "work"] },
    { target: "Se espera una respuesta antes del viernes.", english: "A response is expected before Friday.", tags: ["general", "work"] },
    { target: "El paquete fue enviado ayer y debería llegar mañana.", english: "The package was sent yesterday and should arrive tomorrow.", tags: ["general"] },
    { target: "Se nota que has trabajado mucho en este proyecto.", english: "You can tell you've worked a lot on this project.", tags: ["general", "work"], grammar: "Se nota que — it's noticeable that, impersonal observation" },
    { target: "La exposición fue visitada por más de diez mil personas.", english: "The exhibition was visited by more than ten thousand people.", tags: ["general", "travel"] },
    { target: "Se ofrece puesto de trabajo con contrato indefinido.", english: "Job position offered with permanent contract.", tags: ["general", "work"] },
    { target: "Los datos fueron analizados por el departamento de marketing.", english: "The data was analyzed by the marketing department.", tags: ["general", "work"] },
    { target: "Se sabe que el ejercicio es bueno para la salud.", english: "It's known that exercise is good for health.", tags: ["general"] },
    { target: "La ley fue aprobada por unanimidad.", english: "The law was approved unanimously.", tags: ["general"] },
    { target: "Se avisa a los pasajeros que el vuelo lleva retraso.", english: "Passengers are advised that the flight is delayed.", tags: ["general", "travel"] },
    { target: "El informe fue redactado por el equipo de investigación.", english: "The report was drafted by the research team.", tags: ["general", "work"] },
    { target: "Se agradece la puntualidad de todos los asistentes.", english: "The punctuality of all attendees is appreciated.", tags: ["general", "work"] },
    { target: "Las entradas fueron agotadas en menos de una hora.", english: "The tickets were sold out in less than an hour.", tags: ["general"] },
    { target: "Se comenta que habrá cambios en la dirección.", english: "There are rumors there will be changes in management.", tags: ["general", "work"], grammar: "Se comenta que — it's being said that, rumor" },
    { target: "La empresa fue fundada en mil novecientos noventa y cinco.", english: "The company was founded in nineteen ninety-five.", tags: ["general", "work"] },
    { target: "Se solicitan voluntarios para el evento del sábado.", english: "Volunteers are requested for Saturday's event.", tags: ["general"] },
    { target: "El acuerdo fue alcanzado después de largas negociaciones.", english: "The agreement was reached after lengthy negotiations.", tags: ["general", "work"] },
    { target: "Se ve que está contento con el resultado.", english: "You can see he's happy with the result.", tags: ["general", "work"] },
    { target: "La obra fue dirigida por un director muy conocido.", english: "The play was directed by a very well-known director.", tags: ["general"] },
    { target: "Se comunica a los vecinos que mañana cortarán el agua.", english: "Residents are informed that water will be cut off tomorrow.", tags: ["general"] },
    { target: "Los ganadores fueron anunciados al final de la ceremonia.", english: "The winners were announced at the end of the ceremony.", tags: ["general"] },
    { target: "Se pide a los clientes que rellenen la encuesta de satisfacción.", english: "Customers are asked to fill out the satisfaction survey.", tags: ["general", "work"] },
    { target: "La autopista fue ampliada a tres carriles por sentido.", english: "The highway was widened to three lanes in each direction.", tags: ["general", "travel"] },
    { target: "Se han tomado medidas para mejorar la seguridad.", english: "Measures have been taken to improve safety.", tags: ["general", "work"], grammar: "Se han tomado — impersonal se with compound tense" },
    { target: "El hotel fue renovado completamente el año pasado.", english: "The hotel was completely renovated last year.", tags: ["general", "travel"] },
    { target: "Se ruega no molestar; estamos en horario de trabajo.", english: "Please do not disturb; we are during work hours.", tags: ["general", "work"] },
    { target: "La nueva política fue bien recibida por los empleados.", english: "The new policy was well received by the employees.", tags: ["general", "work"] },
    { target: "Se requiere experiencia previa para este puesto.", english: "Previous experience is required for this position.", tags: ["general", "work"] },
    { target: "Las calles fueron decoradas para las fiestas del pueblo.", english: "The streets were decorated for the town's festival.", tags: ["general", "travel"] },
  ],

  // ═══════════════════════════════════════════════════════════════
  // NODE 19: Advanced Connectors (B2)
  // sin embargo, no obstante, a pesar de, por lo tanto, dado que, puesto que, etc.
  // ═══════════════════════════════════════════════════════════════
  19: [
    { target: "No tengo experiencia; sin embargo, aprendo muy rápido.", english: "I don't have experience; however, I learn very quickly.", tags: ["general", "work"], grammar: "Sin embargo — however, formal contrast connector" },
    { target: "A pesar de la lluvia, decidimos salir a pasear.", english: "Despite the rain, we decided to go for a walk.", tags: ["general"], grammar: "A pesar de — despite, concessive connector" },
    { target: "El proyecto va bien; no obstante, hay que vigilar los plazos.", english: "The project is going well; nevertheless, we need to watch the deadlines.", tags: ["general", "work"], grammar: "No obstante — nevertheless, formal contrast" },
    { target: "Dado que no hay presupuesto, tendremos que posponerlo.", english: "Given that there's no budget, we'll have to postpone it.", tags: ["general", "work"], grammar: "Dado que — given that, causal connector" },
    { target: "Hemos superado las ventas del año pasado; por lo tanto, habrá bonificaciones.", english: "We've exceeded last year's sales; therefore, there will be bonuses.", tags: ["general", "work"], grammar: "Por lo tanto — therefore, consequence connector" },
    { target: "A pesar de estar cansado, se quedó a ayudar hasta el final.", english: "Despite being tired, he stayed to help until the end.", tags: ["general", "work"] },
    { target: "Puesto que ya tenemos los datos, podemos empezar el análisis.", english: "Since we already have the data, we can start the analysis.", tags: ["general", "work"], grammar: "Puesto que — since/given that, causal" },
    { target: "Aunque parezca fácil, requiere mucha concentración.", english: "Even though it seems easy, it requires a lot of concentration.", tags: ["general", "work"] },
    { target: "La oferta era buena; no obstante, decidí quedarme en mi empresa.", english: "The offer was good; nevertheless, I decided to stay at my company.", tags: ["general", "work"] },
    { target: "Mientras tanto, podemos ir preparando la documentación.", english: "In the meantime, we can start preparing the documentation.", tags: ["general", "work"], grammar: "Mientras tanto — in the meantime, temporal connector" },
    { target: "A pesar de los problemas, el equipo sacó el proyecto adelante.", english: "Despite the problems, the team pushed the project forward.", tags: ["general", "work"] },
    { target: "Es más, creo que deberíamos ampliar el equipo.", english: "What's more, I think we should expand the team.", tags: ["general", "work"], grammar: "Es más — what's more, additive intensifier" },
    { target: "En cuanto terminemos la reunión, te envío el resumen.", english: "As soon as we finish the meeting, I'll send you the summary.", tags: ["general", "work"] },
    { target: "Por un lado quiero irme de viaje; por otro, necesito ahorrar.", english: "On one hand I want to go on a trip; on the other, I need to save.", tags: ["general", "travel"], grammar: "Por un lado...por otro — on one hand...on the other" },
    { target: "Ya que estás aquí, quédate a cenar con nosotros.", english: "Since you're here, stay for dinner with us.", tags: ["general", "family"], grammar: "Ya que — since/now that, causal" },
    { target: "No aprobé el examen; en cambio, mi hermana sacó la nota más alta.", english: "I didn't pass the exam; on the other hand, my sister got the highest grade.", tags: ["general", "family"], grammar: "En cambio — on the other hand, contrast" },
    { target: "A pesar de que le avisé, llegó tarde igualmente.", english: "Even though I warned him, he arrived late anyway.", tags: ["general", "work"] },
    { target: "Siempre y cuando cumplas los plazos, no habrá problema.", english: "As long as you meet the deadlines, there won't be a problem.", tags: ["general", "work"], grammar: "Siempre y cuando — as long as, conditional connector" },
    { target: "En primer lugar, hay que definir los objetivos del proyecto.", english: "First of all, we need to define the project objectives.", tags: ["general", "work"], grammar: "En primer lugar — first of all, ordering connector" },
    { target: "De ahí que mucha gente esté buscando trabajo en el extranjero.", english: "That's why many people are looking for jobs abroad.", tags: ["general", "work"], grammar: "De ahí que + subjunctive — that's why, consequence" },
    { target: "Ni siquiera me dio las gracias después de ayudarle.", english: "He didn't even thank me after I helped him.", tags: ["general", "work"], grammar: "Ni siquiera — not even, emphatic negation" },
    { target: "Aparte de eso, el viaje fue fantástico.", english: "Other than that, the trip was fantastic.", tags: ["general", "travel"] },
    { target: "Así y todo, decidimos continuar con el plan original.", english: "Even so, we decided to continue with the original plan.", tags: ["general", "work"], grammar: "Así y todo — even so, concessive connector" },
    { target: "De hecho, es la primera vez que vengo a esta ciudad.", english: "In fact, it's the first time I've been to this city.", tags: ["general", "travel"], grammar: "De hecho — in fact, clarifying connector" },
    { target: "En lo que respecta al presupuesto, todavía estamos ajustando cifras.", english: "Regarding the budget, we're still adjusting figures.", tags: ["general", "work"], grammar: "En lo que respecta a — regarding, topic connector" },
    { target: "Con tal de que me avises con tiempo, puedo organizarme.", english: "As long as you let me know in advance, I can organize myself.", tags: ["general", "work"], grammar: "Con tal de que + subjunctive — provided that" },
    { target: "Es decir, tenemos que encontrar otra solución.", english: "That is to say, we have to find another solution.", tags: ["general", "work"], grammar: "Es decir — that is to say, clarifying" },
    { target: "A pesar de no conocer a nadie, me sentí muy a gusto.", english: "Despite not knowing anyone, I felt very comfortable.", tags: ["general", "travel"] },
    { target: "En definitiva, la reunión fue una pérdida de tiempo.", english: "In short, the meeting was a waste of time.", tags: ["general", "work"], grammar: "En definitiva — in short/ultimately, concluding connector" },
    { target: "Salvo que haya un imprevisto, llegaremos a las cinco.", english: "Unless something unexpected happens, we'll arrive at five.", tags: ["general", "travel"], grammar: "Salvo que + subjunctive — unless" },
    { target: "Por consiguiente, debemos replantear la estrategia.", english: "Consequently, we must rethink the strategy.", tags: ["general", "work"], grammar: "Por consiguiente — consequently, formal consequence" },
    { target: "A fin de cuentas, lo que importa es que estemos juntos.", english: "At the end of the day, what matters is that we're together.", tags: ["general", "family"], grammar: "A fin de cuentas — at the end of the day, concluding" },
    { target: "Tanto es así que decidieron mudarse a otra ciudad.", english: "So much so that they decided to move to another city.", tags: ["general", "family"], grammar: "Tanto es así que — so much so that, consequence" },
    { target: "En cuanto a tu pregunta, la respuesta es no.", english: "Regarding your question, the answer is no.", tags: ["general", "work"], grammar: "En cuanto a — regarding, topic introduction" },
    { target: "A medida que pasa el tiempo, me acostumbro más al trabajo.", english: "As time goes by, I get more used to the job.", tags: ["general", "work"], grammar: "A medida que — as/in proportion to, progressive" },
    { target: "Dicho esto, pasemos al siguiente punto del orden del día.", english: "That said, let's move on to the next item on the agenda.", tags: ["general", "work"], grammar: "Dicho esto — that said, transitional" },
    { target: "A menos que cambien las cosas, me buscaré otro trabajo.", english: "Unless things change, I'll look for another job.", tags: ["general", "work"], grammar: "A menos que + subjunctive — unless" },
    { target: "En resumidas cuentas, necesitamos más personal.", english: "In a nutshell, we need more staff.", tags: ["general", "work"], grammar: "En resumidas cuentas — in a nutshell, summarizing" },
    { target: "Con respecto a la fecha de entrega, aún no la hemos confirmado.", english: "Regarding the delivery date, we haven't confirmed it yet.", tags: ["general", "work"] },
    { target: "A pesar de todo, sigo pensando que fue una buena decisión.", english: "Despite everything, I still think it was a good decision.", tags: ["general"] },
    { target: "Por mucho que insistas, no voy a cambiar de opinión.", english: "No matter how much you insist, I'm not going to change my mind.", tags: ["general"], grammar: "Por mucho que + subjunctive — no matter how much" },
    { target: "En otras palabras, el plan ha fracasado.", english: "In other words, the plan has failed.", tags: ["general", "work"], grammar: "En otras palabras — in other words, rephrasing" },
    { target: "Aun así, merece la pena intentarlo.", english: "Even so, it's worth trying.", tags: ["general"] },
    { target: "De todas formas, te agradezco que me lo hayas contado.", english: "In any case, I appreciate you telling me.", tags: ["general"] },
    { target: "En vista de que no hay acuerdo, aplazamos la votación.", english: "In view of the lack of agreement, we're postponing the vote.", tags: ["general", "work"], grammar: "En vista de que — in view of, causal based on evidence" },
    { target: "Bien es verdad que podríamos haberlo hecho mejor.", english: "It is true that we could have done it better.", tags: ["general", "work"], grammar: "Bien es verdad que — it is true that, concessive" },
    { target: "Por más que lo intento, no consigo hablar con el servicio técnico.", english: "No matter how hard I try, I can't reach tech support.", tags: ["general", "work"] },
    { target: "De modo que al final nos quedamos sin vacaciones.", english: "So in the end we were left without a vacation.", tags: ["general", "travel"], grammar: "De modo que — so/in such a way that, consequence" },
    { target: "En cualquier caso, avísame si necesitas algo.", english: "In any case, let me know if you need anything.", tags: ["general", "work"] },
    { target: "A raíz de la pandemia, muchas empresas adoptaron el teletrabajo.", english: "As a result of the pandemic, many companies adopted remote work.", tags: ["general", "work"], grammar: "A raíz de — as a result of, causal origin" },
    { target: "De lo contrario, perderemos la oportunidad.", english: "Otherwise, we'll lose the opportunity.", tags: ["general", "work"], grammar: "De lo contrario — otherwise, conditional consequence" },
    { target: "Ahora bien, eso no significa que debamos rendirnos.", english: "Now then, that doesn't mean we should give up.", tags: ["general", "work"], grammar: "Ahora bien — now then/however, counterpoint" },
    { target: "Con independencia de lo que digan, seguiré adelante.", english: "Regardless of what they say, I'll move forward.", tags: ["general", "work"] },
    { target: "Total, que al final no fuimos a ningún sitio.", english: "So basically, in the end we didn't go anywhere.", tags: ["general", "travel"], grammar: "Total que — so basically (colloquial summarizing)" },
  ],

  // ═══════════════════════════════════════════════════════════════
  // NODE 20: Mastery (B2)
  // Mixed advanced grammar, idioms, register variation, complex sentences
  // ═══════════════════════════════════════════════════════════════
  20: [
    { target: "Por mucho que me cueste admitirlo, tenías razón desde el principio.", english: "As much as it's hard for me to admit it, you were right from the beginning.", tags: ["general"], grammar: "Por mucho que + subjunctive — concessive clause" },
    { target: "De haber sabido la verdad, nunca habría aceptado el puesto.", english: "Had I known the truth, I would never have accepted the position.", tags: ["general", "work"], grammar: "De + infinitive perfect — formal conditional alternative to si + pluperfect" },
    { target: "Llevo toda la semana intentando que me contesten del seguro.", english: "I've been trying all week to get the insurance company to answer.", tags: ["general"], grammar: "Llevar + time + gerund — duration of ongoing action" },
    { target: "Se me olvidó por completo que teníamos reunión hoy.", english: "I completely forgot we had a meeting today.", tags: ["general", "work"] },
    { target: "Ya que sacas el tema, hay algo que quiero comentarte.", english: "Since you bring it up, there's something I want to tell you.", tags: ["general", "work"] },
    { target: "Tiene pinta de que va a llover toda la tarde.", english: "It looks like it's going to rain all afternoon.", tags: ["general"], grammar: "Tener pinta de — to look like, colloquial impression" },
    { target: "No me extraña que esté tan agotada con tanto trabajo.", english: "No wonder she's so exhausted with so much work.", tags: ["general", "work"] },
    { target: "Resulta que el vuelo que reservé ni siquiera existe.", english: "It turns out the flight I booked doesn't even exist.", tags: ["general", "travel"], grammar: "Resulta que — it turns out that, unexpected discovery" },
    { target: "Se lo dije con toda la delicadeza del mundo, pero se enfadó igual.", english: "I told her as delicately as possible, but she got angry anyway.", tags: ["general", "family"] },
    { target: "No hay quien entienda estas instrucciones.", english: "Nobody can understand these instructions.", tags: ["general", "work"], grammar: "No hay quien + subjunctive — nobody can/it's impossible" },
    { target: "A estas alturas del proyecto, no podemos cambiar de rumbo.", english: "At this stage of the project, we can't change course.", tags: ["general", "work"] },
    { target: "Lo que es yo, me quedo en casa este fin de semana.", english: "As for me, I'm staying home this weekend.", tags: ["general"], grammar: "Lo que es yo — as for me, emphatic personal stance" },
    { target: "Habría que plantearse si merece la pena seguir así.", english: "We should consider whether it's worth continuing like this.", tags: ["general", "work"], grammar: "Habría que — one should/we ought to, impersonal obligation" },
    { target: "Si no llega a ser por ti, no lo habría conseguido.", english: "If it hadn't been for you, I wouldn't have made it.", tags: ["general", "family"], grammar: "Si no llega a ser por — if it hadn't been for, colloquial counterfactual" },
    { target: "Estoy hasta arriba de correos sin contestar.", english: "I'm swamped with unanswered emails.", tags: ["general", "work"], grammar: "Estar hasta arriba de — to be swamped with" },
    { target: "Ni se te ocurra decirle nada a tu hermana todavía.", english: "Don't you dare say anything to your sister yet.", tags: ["general", "family"], grammar: "Ni se te ocurra — don't you dare, emphatic prohibition" },
    { target: "Total, que después de tantas vueltas, volvimos al plan original.", english: "So basically, after going round and round, we went back to the original plan.", tags: ["general", "work"] },
    { target: "Como sigas llegando tarde, te van a echar una bronca.", english: "If you keep arriving late, they're going to give you a telling off.", tags: ["general", "work"], grammar: "Como + subjunctive — informal warning/threat (if you...)" },
    { target: "Nada más llegar al aeropuerto, nos enteramos de que el vuelo estaba cancelado.", english: "As soon as we arrived at the airport, we found out the flight was canceled.", tags: ["general", "travel"], grammar: "Nada más + infinitive — as soon as" },
    { target: "Le tengo mucho cariño a este barrio, llevo viviendo aquí veinte años.", english: "I'm very fond of this neighborhood, I've been living here for twenty years.", tags: ["general"] },
    { target: "No es que no quiera ir, es que no puedo.", english: "It's not that I don't want to go, it's that I can't.", tags: ["general"], grammar: "No es que + subjunctive — it's not that, softened denial" },
    { target: "Me consta que la información es correcta, la verifiqué yo mismo.", english: "I can confirm the information is correct, I verified it myself.", tags: ["general", "work"], grammar: "Me consta que — I can confirm/I know for a fact" },
    { target: "Ojalá me hubieran dicho eso antes de firmar el contrato.", english: "I wish they had told me that before I signed the contract.", tags: ["general", "work"] },
    { target: "Que yo sepa, nadie ha confirmado la fecha de la reunión.", english: "As far as I know, no one has confirmed the meeting date.", tags: ["general", "work"] },
    { target: "Haga lo que haga, nunca parece suficiente.", english: "Whatever I do, it never seems to be enough.", tags: ["general", "work"], grammar: "Haga lo que haga — whatever I do, reduplicative subjunctive" },
    { target: "La cuestión es que no tenemos margen para equivocarnos.", english: "The issue is that we don't have room for error.", tags: ["general", "work"] },
    { target: "Es una lástima que no pudiéramos vernos durante mi viaje.", english: "It's a shame we couldn't see each other during my trip.", tags: ["general", "travel"] },
    { target: "Con lo que me costó preparar la cena, nadie se la comió.", english: "After all the effort I put into making dinner, nobody ate it.", tags: ["general", "family"], grammar: "Con lo que — given how much, expressing frustration" },
    { target: "Tengo entendido que van a reestructurar la empresa.", english: "I understand they're going to restructure the company.", tags: ["general", "work"], grammar: "Tener entendido que — to understand/be told that" },
    { target: "Por si fuera poco, además nos subieron el alquiler.", english: "As if that weren't enough, they also raised our rent.", tags: ["general"], grammar: "Por si fuera poco — as if that weren't enough" },
    { target: "No tenía ni idea de que hoy fuera festivo.", english: "I had no idea that today was a holiday.", tags: ["general"] },
    { target: "Sea como sea, tenemos que entregar el informe el lunes.", english: "Be that as it may, we have to submit the report on Monday.", tags: ["general", "work"], grammar: "Sea como sea — be that as it may, concessive reduplicative" },
    { target: "Me da la sensación de que algo no va bien en la oficina.", english: "I get the feeling that something isn't right at the office.", tags: ["general", "work"] },
    { target: "Donde caben dos, caben tres; que se venga tu hermano.", english: "Where two fit, three fit; let your brother come along.", tags: ["general", "family"], grammar: "Proverb: donde caben dos, caben tres — the more the merrier" },
    { target: "A no ser que me digan lo contrario, seguiré con el plan.", english: "Unless they tell me otherwise, I'll continue with the plan.", tags: ["general", "work"], grammar: "A no ser que + subjunctive — unless" },
    { target: "Hablé con el casero para que nos bajara el alquiler.", english: "I talked to the landlord so that he would lower the rent.", tags: ["general"] },
    { target: "Siendo sincero, no estoy seguro de poder con todo.", english: "Being honest, I'm not sure I can handle everything.", tags: ["general", "work"], grammar: "Siendo + adjective — being..., gerund clause for stance" },
    { target: "Me llamó la atención que nadie dijera nada en la reunión.", english: "It caught my attention that nobody said anything at the meeting.", tags: ["general", "work"] },
    { target: "Vengas cuando vengas, siempre serás bienvenido en esta casa.", english: "Whenever you come, you'll always be welcome in this house.", tags: ["general", "family"], grammar: "Vengas cuando vengas — whenever you come, subjunctive reduplicative" },
    { target: "Lo cierto es que no estamos preparados para este cambio.", english: "The truth is we're not ready for this change.", tags: ["general", "work"] },
    { target: "A falta de un plan mejor, sigamos con este.", english: "In the absence of a better plan, let's stick with this one.", tags: ["general", "work"], grammar: "A falta de — in the absence of / for lack of" },
    { target: "De no ser por el apoyo de mi familia, no habría terminado la carrera.", english: "If it hadn't been for my family's support, I wouldn't have finished my degree.", tags: ["general", "family"], grammar: "De no ser por — if it weren't for, formal counterfactual" },
    { target: "Se enteró de casualidad, por un comentario de un compañero.", english: "He found out by chance, from a colleague's comment.", tags: ["general", "work"] },
    { target: "No hace falta que me lo repitas, ya me ha quedado claro.", english: "You don't need to repeat it, it's already clear to me.", tags: ["general"] },
    { target: "Mal que me pese, tengo que reconocer que tenía razón.", english: "Much as I hate to admit it, I have to acknowledge he was right.", tags: ["general"], grammar: "Mal que me pese — much as I hate to admit it" },
    { target: "Cada vez que intento organizarme, surge algo imprevisto.", english: "Every time I try to get organized, something unexpected comes up.", tags: ["general", "work"] },
    { target: "Con lo bien que estábamos antes de los cambios.", english: "Things were so good before the changes.", tags: ["general", "work"], grammar: "Con lo bien que — given how well, nostalgic/contrasting" },
    { target: "No tengo claro si debería haberle dicho la verdad.", english: "I'm not sure if I should have told him the truth.", tags: ["general"] },
    { target: "Me hace mucha ilusión que vengáis todos a la cena de Navidad.", english: "I'm really excited that you're all coming to the Christmas dinner.", tags: ["general", "family"], grammar: "Hacer ilusión — to be excited/thrilled about" },
    { target: "El caso es que nadie se hace responsable del error.", english: "The thing is that nobody takes responsibility for the mistake.", tags: ["general", "work"] },
    { target: "A lo largo de mi carrera, he aprendido a adaptarme a los cambios.", english: "Throughout my career, I've learned to adapt to changes.", tags: ["general", "work"], grammar: "A lo largo de — throughout, temporal span" },
    { target: "Pase lo que pase, cuento contigo.", english: "Whatever happens, I'm counting on you.", tags: ["general", "family"], grammar: "Pase lo que pase — whatever happens, subjunctive reduplicative" },
    { target: "No deja de sorprenderme lo rápido que pasa el tiempo.", english: "It never ceases to amaze me how fast time goes by.", tags: ["general"], grammar: "No dejar de — to not cease to, continuous" },
    { target: "En el fondo, lo que todos queremos es tranquilidad.", english: "Deep down, what we all want is peace and quiet.", tags: ["general", "family"] },
  ],
};

// ─── MERGE NEW CARDS ─────────────────────────────────────────────

let added = 0;
let skipped = 0;

for (const [node, cards] of Object.entries(newCardsByNode)) {
  for (const card of cards) {
    const key = card.target.toLowerCase().trim();
    if (existingTargets.has(key)) {
      skipped++;
      continue;
    }

    const newCard = {
      id: nextId++,
      target: card.target,
      english: card.english,
      audio: "",
      tags: card.tags,
    };

    if (card.grammar) {
      newCard.grammar = card.grammar;
    }

    deck.push(newCard);
    existingTargets.add(key);
    added++;
  }
}

// ─── WRITE UPDATED DECK ─────────────────────────────────────────

fs.writeFileSync(DECK_PATH, JSON.stringify(deck, null, 2) + '\n', 'utf-8');

console.log(`Added: ${added} cards`);
console.log(`Skipped (duplicates): ${skipped}`);
console.log(`New total: ${deck.length} cards`);

// Tag distribution summary
const tagCounts = {};
deck.forEach(c => (c.tags || []).forEach(t => { tagCounts[t] = (tagCounts[t] || 0) + 1; }));
const total = deck.length;
console.log('\nTag distribution:');
for (const [tag, count] of Object.entries(tagCounts).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${tag}: ${count} (${(count / total * 100).toFixed(1)}%)`);
}

const grammarCount = deck.filter(c => c.grammar).length;
console.log(`\nCards with grammar: ${grammarCount} (${(grammarCount / total * 100).toFixed(1)}%)`);

// Per-node summary
console.log('\nCards per node in this batch:');
for (const [node, cards] of Object.entries(newCardsByNode)) {
  console.log(`  Node ${node}: ${cards.length} cards defined`);
}
