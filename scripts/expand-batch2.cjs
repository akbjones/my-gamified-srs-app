/**
 * expand-batch2.cjs
 *
 * Add ~330 new cards for Nodes 9-14 to the Spanish deck.
 * Each node gets ~55 new natural, everyday sentences.
 *
 * Node 9:  Por vs Para (A2)
 * Node 10: Object Pronouns (A2)
 * Node 11: Present Subjunctive (B1)
 * Node 12: Commands / Imperatives (B1)
 * Node 13: Conditional (B1)
 * Node 14: Future & Compound Tenses (B1)
 *
 * Tags: "general" (always), plus "work", "travel", "family" — work boosted.
 * ~20% of cards include a grammar field.
 */

const fs = require('fs');
const path = require('path');

const DECK_PATH = path.join(__dirname, '..', 'src', 'data', 'spanish', 'deck.json');
const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf-8'));

console.log(`Current deck: ${deck.length} cards`);

// Track existing sentences to avoid duplicates
const existingTargets = new Set(deck.map(c => c.target.toLowerCase().trim()));

// ─── NEW CARDS BY GRAMMAR NODE ───────────────────────────────────

const newCardsByNode = {};

// ═══════════════════════════════════════════════════════════════
// NODE 9: Por vs Para (A2)
// ═══════════════════════════════════════════════════════════════
newCardsByNode[9] = [
  { target: "Este regalo es para ti.", english: "This gift is for you.", tags: ["general", "family"], grammar: "Para for intended recipient" },
  { target: "Gracias por todo.", english: "Thanks for everything.", tags: ["general"] },
  { target: "Paso por tu casa a las ocho.", english: "I'll swing by your house at eight.", tags: ["general", "family"], grammar: "Por for passing through / by a place" },
  { target: "Trabajo para una empresa de tecnología.", english: "I work for a tech company.", tags: ["general", "work"], grammar: "Para for employer / who you work for" },
  { target: "Te llamé por teléfono tres veces.", english: "I called you by phone three times.", tags: ["general"], grammar: "Por for means of communication" },
  { target: "Necesito esto para mañana.", english: "I need this for tomorrow.", tags: ["general", "work"], grammar: "Para for deadline" },
  { target: "Vamos a caminar por el parque.", english: "Let's walk through the park.", tags: ["general"], grammar: "Por for movement through a place" },
  { target: "Para mí, un café con leche.", english: "For me, a coffee with milk.", tags: ["general", "travel"] },
  { target: "Lo hice por ti.", english: "I did it for you.", tags: ["general", "family"], grammar: "Por for on behalf of / because of someone" },
  { target: "Estudio español para viajar por Latinoamérica.", english: "I study Spanish to travel through Latin America.", tags: ["general", "travel"], grammar: "Para for purpose; por for through" },
  { target: "¿Por qué no viniste a la fiesta?", english: "Why didn't you come to the party?", tags: ["general"] },
  { target: "Pagué veinte euros por la camiseta.", english: "I paid twenty euros for the shirt.", tags: ["general"], grammar: "Por for exchange / price paid" },
  { target: "Para ser extranjero, hablas muy bien.", english: "For a foreigner, you speak very well.", tags: ["general"], grammar: "Para for considering / given that" },
  { target: "Vengo por la mañana.", english: "I come in the morning.", tags: ["general", "work"], grammar: "Por for general time of day" },
  { target: "Esta carta es para el director.", english: "This letter is for the director.", tags: ["general", "work"], grammar: "Para for intended recipient" },
  { target: "Salgo para Madrid el lunes.", english: "I leave for Madrid on Monday.", tags: ["general", "travel"], grammar: "Para for destination" },
  { target: "Por lo menos tenemos el fin de semana.", english: "At least we have the weekend.", tags: ["general"] },
  { target: "No te preocupes por el dinero.", english: "Don't worry about the money.", tags: ["general", "family"] },
  { target: "Estoy aquí por una reunión.", english: "I'm here for a meeting.", tags: ["general", "work"], grammar: "Por for reason / cause" },
  { target: "Para llegar a tiempo, salimos temprano.", english: "To arrive on time, we left early.", tags: ["general", "travel"], grammar: "Para + infinitive for purpose / goal" },
  { target: "Hablo por experiencia.", english: "I speak from experience.", tags: ["general", "work"] },
  { target: "Voy por agua.", english: "I'm going for water.", tags: ["general"], grammar: "Por for in search of / to get" },
  { target: "Para el viernes necesito el informe.", english: "I need the report by Friday.", tags: ["general", "work"], grammar: "Para for deadline" },
  { target: "¿Por cuánto tiempo te quedas?", english: "For how long are you staying?", tags: ["general", "travel"], grammar: "Por for duration of time" },
  { target: "Esto es para la cena de esta noche.", english: "This is for tonight's dinner.", tags: ["general", "family"] },
  { target: "Caminamos por la playa al atardecer.", english: "We walked along the beach at sunset.", tags: ["general", "travel"] },
  { target: "Para mí es muy importante la familia.", english: "For me, family is very important.", tags: ["general", "family"], grammar: "Para mí for personal opinion" },
  { target: "Fui al médico por el dolor de espalda.", english: "I went to the doctor because of the back pain.", tags: ["general"], grammar: "Por for cause / reason" },
  { target: "Mandé el paquete por correo.", english: "I sent the package by mail.", tags: ["general"], grammar: "Por for means of delivery" },
  { target: "Para empezar, necesitamos un plan.", english: "To start, we need a plan.", tags: ["general", "work"] },
  { target: "Te cambio mi turno por el tuyo.", english: "I'll trade you my shift for yours.", tags: ["general", "work"], grammar: "Por for exchange / trade" },
  { target: "Estoy listo para el examen.", english: "I'm ready for the exam.", tags: ["general"] },
  { target: "Por suerte encontré un taxi.", english: "Luckily I found a taxi.", tags: ["general", "travel"] },
  { target: "Cocino para toda la familia.", english: "I cook for the whole family.", tags: ["general", "family"] },
  { target: "Viajamos por carretera.", english: "We traveled by road.", tags: ["general", "travel"], grammar: "Por for means of transport / route" },
  { target: "Para ser lunes, no está mal.", english: "For a Monday, it's not bad.", tags: ["general", "work"] },
  { target: "Pregunta por María cuando llegues.", english: "Ask for María when you arrive.", tags: ["general"], grammar: "Preguntar por — to ask for / about someone" },
  { target: "El vuelo es para las cinco de la tarde.", english: "The flight is for five in the afternoon.", tags: ["general", "travel"] },
  { target: "Me quedé en casa por la lluvia.", english: "I stayed home because of the rain.", tags: ["general"], grammar: "Por for cause" },
  { target: "Para variar, hoy no hay tráfico.", english: "For a change, there's no traffic today.", tags: ["general"] },
  { target: "Hago ejercicio por salud.", english: "I exercise for my health.", tags: ["general"], grammar: "Por for motivation / reason" },
  { target: "Todavía me quedan cosas por hacer.", english: "I still have things left to do.", tags: ["general", "work"] },
  { target: "Este parque es perfecto para los niños.", english: "This park is perfect for kids.", tags: ["general", "family"] },
  { target: "Por fin llegó el verano.", english: "Summer has finally arrived.", tags: ["general"] },
  { target: "Ahorro dinero para las vacaciones.", english: "I save money for vacation.", tags: ["general", "travel"] },
  { target: "No puedo ir por el trabajo.", english: "I can't go because of work.", tags: ["general", "work"], grammar: "Por for cause / obstacle" },
  { target: "Para serte sincero, no me gustó.", english: "To be honest with you, I didn't like it.", tags: ["general"] },
  { target: "Conduzco por esta calle todos los días.", english: "I drive down this street every day.", tags: ["general"] },
  { target: "Para colmo, se me olvidaron las llaves.", english: "To top it off, I forgot my keys.", tags: ["general"] },
  { target: "Brindamos por los novios.", english: "We toasted to the couple.", tags: ["general", "family"], grammar: "Por for in honor of" },
  { target: "Para cuando llegues, ya estará listo.", english: "By the time you arrive, it'll be ready.", tags: ["general", "family"] },
  { target: "Multiplicamos cinco por tres.", english: "We multiply five by three.", tags: ["general"], grammar: "Por for multiplication" },
  { target: "Para el cumpleaños de mi madre, vamos a un restaurante.", english: "For my mother's birthday, we're going to a restaurant.", tags: ["general", "family"] },
  { target: "Paseamos por el centro de la ciudad.", english: "We strolled through the city center.", tags: ["general", "travel"] },
  { target: "Por lo general, como en casa.", english: "Generally, I eat at home.", tags: ["general"] },
];

// ═══════════════════════════════════════════════════════════════
// NODE 10: Object Pronouns (A2)
// ═══════════════════════════════════════════════════════════════
newCardsByNode[10] = [
  { target: "Se lo dije ayer.", english: "I told him yesterday.", tags: ["general"], grammar: "Se lo — indirect + direct pronoun combo" },
  { target: "¿Me puedes ayudar un momento?", english: "Can you help me for a moment?", tags: ["general", "work"] },
  { target: "Te lo explico ahora.", english: "I'll explain it to you now.", tags: ["general"], grammar: "Te (indirect) + lo (direct) — double pronoun" },
  { target: "No la encuentro por ningún lado.", english: "I can't find it anywhere.", tags: ["general"], grammar: "La — direct object pronoun for feminine noun" },
  { target: "¿Les mandaste el correo?", english: "Did you send them the email?", tags: ["general", "work"], grammar: "Les — indirect object pronoun, plural" },
  { target: "Dámelo, por favor.", english: "Give it to me, please.", tags: ["general"], grammar: "Attached pronouns on affirmative command: me + lo" },
  { target: "Lo veo todos los días en el trabajo.", english: "I see him every day at work.", tags: ["general", "work"] },
  { target: "Nos invitaron a la boda.", english: "They invited us to the wedding.", tags: ["general", "family"] },
  { target: "Le pregunté pero no me contestó.", english: "I asked him but he didn't answer me.", tags: ["general"] },
  { target: "¿La puedo llamar mañana?", english: "Can I call her tomorrow?", tags: ["general", "work"] },
  { target: "No me lo puedo creer.", english: "I can't believe it.", tags: ["general"], grammar: "Me lo — double pronoun with modal verb" },
  { target: "Se lo prometí a mi hijo.", english: "I promised it to my son.", tags: ["general", "family"], grammar: "Se replaces le before lo/la" },
  { target: "Los vi en el supermercado.", english: "I saw them at the supermarket.", tags: ["general"] },
  { target: "Te quiero mucho.", english: "I love you a lot.", tags: ["general", "family"] },
  { target: "Le traje un café.", english: "I brought him a coffee.", tags: ["general", "work"] },
  { target: "No nos avisaron del cambio.", english: "They didn't tell us about the change.", tags: ["general", "work"], grammar: "Nos — indirect object, first person plural" },
  { target: "¿Me lo puedes repetir?", english: "Can you repeat that for me?", tags: ["general"] },
  { target: "Se las envié esta mañana.", english: "I sent them to her this morning.", tags: ["general", "work"], grammar: "Se las — se replaces le; las is feminine plural direct object" },
  { target: "La conozco desde hace años.", english: "I've known her for years.", tags: ["general"] },
  { target: "Le di las gracias al profesor.", english: "I thanked the teacher.", tags: ["general"] },
  { target: "¿Nos puedes llevar al aeropuerto?", english: "Can you take us to the airport?", tags: ["general", "travel"] },
  { target: "Lo siento, no lo sabía.", english: "I'm sorry, I didn't know.", tags: ["general"] },
  { target: "Les pedí que vinieran temprano.", english: "I asked them to come early.", tags: ["general", "work"] },
  { target: "Me encanta esta canción.", english: "I love this song.", tags: ["general"], grammar: "Me — indirect object with gustar-type verb (encantar)" },
  { target: "Te lo mando por correo.", english: "I'll send it to you by email.", tags: ["general", "work"] },
  { target: "Se lo conté a mi hermana.", english: "I told my sister about it.", tags: ["general", "family"] },
  { target: "No la toques, está caliente.", english: "Don't touch it, it's hot.", tags: ["general"] },
  { target: "Le compré un regalo a mi madre.", english: "I bought my mother a gift.", tags: ["general", "family"], grammar: "Le — indirect object; a mi madre clarifies recipient" },
  { target: "¿Me dejas tu bolígrafo?", english: "Can you lend me your pen?", tags: ["general", "work"] },
  { target: "Las puse en la mesa.", english: "I put them on the table.", tags: ["general"] },
  { target: "Nos lo pasamos muy bien.", english: "We had a great time.", tags: ["general", "family"] },
  { target: "Le dije que no se preocupara.", english: "I told him not to worry.", tags: ["general"] },
  { target: "No lo he probado nunca.", english: "I've never tried it.", tags: ["general", "travel"] },
  { target: "¿Te lo has pensado bien?", english: "Have you thought it through?", tags: ["general", "work"] },
  { target: "Me la presentó en una fiesta.", english: "He introduced her to me at a party.", tags: ["general"], grammar: "Me (indirect) + la (direct) — double pronoun" },
  { target: "Los llamé pero no contestaron.", english: "I called them but they didn't answer.", tags: ["general", "work"] },
  { target: "Le hace falta descansar.", english: "He needs to rest.", tags: ["general", "family"], grammar: "Le + hacer falta — indirect object with impersonal verb" },
  { target: "Ponlo aquí, por favor.", english: "Put it here, please.", tags: ["general"], grammar: "Lo attached to affirmative tú command" },
  { target: "Se lo dejé en su escritorio.", english: "I left it for him on his desk.", tags: ["general", "work"] },
  { target: "No me importa esperar.", english: "I don't mind waiting.", tags: ["general"] },
  { target: "Le preocupa el examen.", english: "The exam worries him.", tags: ["general"], grammar: "Le — indirect object with preocupar (gustar-type)" },
  { target: "Te las traigo mañana.", english: "I'll bring them to you tomorrow.", tags: ["general"] },
  { target: "Me lo dijeron en la oficina.", english: "They told me at the office.", tags: ["general", "work"] },
  { target: "No nos lo esperábamos.", english: "We weren't expecting it.", tags: ["general"] },
  { target: "Le cuesta levantarse temprano.", english: "He has a hard time getting up early.", tags: ["general"], grammar: "Le + costar — indirect object with costar" },
  { target: "Se lo regalé por su cumpleaños.", english: "I gave it to her for her birthday.", tags: ["general", "family"] },
  { target: "¿La ves? Está ahí al fondo.", english: "Do you see her? She's over there at the back.", tags: ["general"] },
  { target: "Me duele la cabeza.", english: "My head hurts.", tags: ["general"], grammar: "Me — indirect object with doler" },
  { target: "Le pedí el día libre al jefe.", english: "I asked the boss for the day off.", tags: ["general", "work"] },
  { target: "Se lo compré en el mercado.", english: "I bought it for her at the market.", tags: ["general", "travel"] },
  { target: "¿Nos lo confirmas antes del viernes?", english: "Can you confirm it for us before Friday?", tags: ["general", "work"] },
  { target: "Los recogí del colegio.", english: "I picked them up from school.", tags: ["general", "family"] },
  { target: "Me faltan dos páginas.", english: "I'm missing two pages.", tags: ["general", "work"], grammar: "Me + faltar — indirect object with faltar" },
  { target: "Le presté mi coche a mi hermano.", english: "I lent my car to my brother.", tags: ["general", "family"] },
  { target: "No te lo tomes a mal.", english: "Don't take it the wrong way.", tags: ["general"] },
];

// ═══════════════════════════════════════════════════════════════
// NODE 11: Present Subjunctive (B1)
// ═══════════════════════════════════════════════════════════════
newCardsByNode[11] = [
  { target: "Espero que llegues a tiempo.", english: "I hope you arrive on time.", tags: ["general"], grammar: "Espero que + subjunctive — wish/hope trigger" },
  { target: "Quiero que sepas la verdad.", english: "I want you to know the truth.", tags: ["general", "family"] },
  { target: "Es importante que hables con él.", english: "It's important that you talk to him.", tags: ["general", "work"], grammar: "Es importante que + subjunctive — impersonal trigger" },
  { target: "Dudo que tenga tiempo esta semana.", english: "I doubt he has time this week.", tags: ["general", "work"] },
  { target: "Ojalá haga buen tiempo mañana.", english: "I hope the weather is good tomorrow.", tags: ["general", "travel"], grammar: "Ojalá + subjunctive — wish/hope" },
  { target: "No creo que sea buena idea.", english: "I don't think it's a good idea.", tags: ["general"] },
  { target: "Mi madre quiere que la llame más.", english: "My mother wants me to call her more.", tags: ["general", "family"], grammar: "Querer que + subjunctive — will/desire trigger" },
  { target: "Es necesario que terminemos hoy.", english: "It's necessary that we finish today.", tags: ["general", "work"] },
  { target: "Espero que te mejores pronto.", english: "I hope you feel better soon.", tags: ["general", "family"] },
  { target: "No es verdad que cueste tanto.", english: "It's not true that it costs that much.", tags: ["general"], grammar: "Negated truth claim + subjunctive" },
  { target: "Necesito que me envíes el archivo.", english: "I need you to send me the file.", tags: ["general", "work"], grammar: "Necesitar que + subjunctive" },
  { target: "Antes de que te vayas, firma esto.", english: "Before you leave, sign this.", tags: ["general", "work"], grammar: "Antes de que always takes subjunctive" },
  { target: "Me alegra que estés aquí.", english: "I'm glad you're here.", tags: ["general", "family"] },
  { target: "Es raro que no conteste el teléfono.", english: "It's strange that he's not answering the phone.", tags: ["general"] },
  { target: "Prefiero que me lo digas directamente.", english: "I prefer that you tell me directly.", tags: ["general", "work"] },
  { target: "Cuando llegues a casa, llámame.", english: "When you get home, call me.", tags: ["general", "family"], grammar: "Cuando + subjunctive for future actions" },
  { target: "Quiero que vengas a la cena.", english: "I want you to come to the dinner.", tags: ["general", "family"] },
  { target: "Es posible que llueva esta tarde.", english: "It's possible it'll rain this afternoon.", tags: ["general"], grammar: "Es posible que + subjunctive — uncertainty" },
  { target: "No creo que encuentre trabajo tan rápido.", english: "I don't think he'll find a job that fast.", tags: ["general", "work"] },
  { target: "Ojalá pueda ir a tu boda.", english: "I hope I can go to your wedding.", tags: ["general", "family"] },
  { target: "Es mejor que salgamos temprano.", english: "It's better that we leave early.", tags: ["general", "travel"] },
  { target: "Siento que tengas que pasar por esto.", english: "I'm sorry you have to go through this.", tags: ["general"] },
  { target: "Dile que me llame cuando pueda.", english: "Tell him to call me when he can.", tags: ["general", "work"] },
  { target: "No quiero que te preocupes por nada.", english: "I don't want you to worry about anything.", tags: ["general", "family"] },
  { target: "Busco un hotel que tenga piscina.", english: "I'm looking for a hotel that has a pool.", tags: ["general", "travel"], grammar: "Subjunctive in adjective clause — unknown/nonexistent antecedent" },
  { target: "Es una lástima que no puedas venir.", english: "It's a shame you can't come.", tags: ["general"] },
  { target: "Necesito que alguien me ayude con esto.", english: "I need someone to help me with this.", tags: ["general", "work"] },
  { target: "Espero que les guste la comida.", english: "I hope they like the food.", tags: ["general", "family"] },
  { target: "Quiero que todo salga bien.", english: "I want everything to go well.", tags: ["general"] },
  { target: "A menos que llueva, vamos a la playa.", english: "Unless it rains, we're going to the beach.", tags: ["general", "travel"], grammar: "A menos que always takes subjunctive" },
  { target: "Me pide que llegue antes de las nueve.", english: "He asks me to arrive before nine.", tags: ["general", "work"], grammar: "Pedir que + subjunctive — request" },
  { target: "No hay nadie que sepa la respuesta.", english: "There's no one who knows the answer.", tags: ["general"], grammar: "Subjunctive after negative existential" },
  { target: "Es probable que cambiemos de oficina.", english: "It's likely we'll change offices.", tags: ["general", "work"] },
  { target: "Ojalá tenga un buen día.", english: "I hope you have a good day.", tags: ["general"] },
  { target: "Me sorprende que no lo sepas.", english: "I'm surprised you don't know.", tags: ["general"], grammar: "Emotion trigger + subjunctive" },
  { target: "Aunque llueva, voy a salir.", english: "Even if it rains, I'm going out.", tags: ["general"], grammar: "Aunque + subjunctive for hypothetical concession" },
  { target: "Quiero que mis hijos sean felices.", english: "I want my children to be happy.", tags: ["general", "family"] },
  { target: "Hace falta que hablemos del presupuesto.", english: "We need to talk about the budget.", tags: ["general", "work"] },
  { target: "No es seguro que venga mañana.", english: "It's not certain he'll come tomorrow.", tags: ["general"] },
  { target: "Deja que te ayude con las maletas.", english: "Let me help you with the suitcases.", tags: ["general", "travel"], grammar: "Dejar que + subjunctive — allowing" },
  { target: "Espero que disfrutes del viaje.", english: "I hope you enjoy the trip.", tags: ["general", "travel"] },
  { target: "Mientras no trabajes aquí, no entiendes.", english: "Unless you work here, you don't understand.", tags: ["general", "work"] },
  { target: "Me encanta que seas tan honesto.", english: "I love that you're so honest.", tags: ["general", "family"] },
  { target: "Que yo sepa, la tienda cierra a las ocho.", english: "As far as I know, the store closes at eight.", tags: ["general"] },
  { target: "No dejes que te molesten.", english: "Don't let them bother you.", tags: ["general", "work"] },
  { target: "Es fundamental que lleguemos puntuales.", english: "It's essential that we arrive on time.", tags: ["general", "work"], grammar: "Es fundamental que + subjunctive" },
  { target: "Para que entiendas, te lo voy a explicar.", english: "So that you understand, I'll explain it to you.", tags: ["general"], grammar: "Para que always takes subjunctive" },
  { target: "Ojalá encontremos un buen restaurante.", english: "I hope we find a good restaurant.", tags: ["general", "travel"] },
  { target: "No parece que vaya a mejorar.", english: "It doesn't seem like it's going to improve.", tags: ["general"] },
  { target: "Quiero que descanses este fin de semana.", english: "I want you to rest this weekend.", tags: ["general", "family"] },
  { target: "Puede que tengamos que cancelar la reunión.", english: "We might have to cancel the meeting.", tags: ["general", "work"], grammar: "Puede que + subjunctive — possibility" },
  { target: "Es hora de que busques otro empleo.", english: "It's time you looked for another job.", tags: ["general", "work"] },
  { target: "Lamento que no hayas podido venir.", english: "I'm sorry you weren't able to come.", tags: ["general", "family"] },
  { target: "Sin que nadie se dé cuenta, salimos.", english: "Without anyone noticing, we left.", tags: ["general"], grammar: "Sin que + subjunctive" },
  { target: "Recomiendo que pruebes la paella.", english: "I recommend you try the paella.", tags: ["general", "travel"] },
];

// ═══════════════════════════════════════════════════════════════
// NODE 12: Commands / Imperatives (B1)
// ═══════════════════════════════════════════════════════════════
newCardsByNode[12] = [
  { target: "No te preocupes, todo va a salir bien.", english: "Don't worry, everything will be fine.", tags: ["general", "family"] },
  { target: "Dime qué necesitas.", english: "Tell me what you need.", tags: ["general", "work"], grammar: "Tú affirmative command: di + me" },
  { target: "Ven aquí un momento.", english: "Come here for a moment.", tags: ["general"] },
  { target: "No toques eso, por favor.", english: "Don't touch that, please.", tags: ["general", "family"] },
  { target: "Siéntese, por favor.", english: "Please, have a seat.", tags: ["general", "work"], grammar: "Usted command: siéntese — formal" },
  { target: "Apaga la luz cuando salgas.", english: "Turn off the light when you leave.", tags: ["general"] },
  { target: "Escucha, tengo que decirte algo.", english: "Listen, I have to tell you something.", tags: ["general"] },
  { target: "No le digas nada todavía.", english: "Don't tell him anything yet.", tags: ["general", "work"], grammar: "Negative tú command uses subjunctive: no digas" },
  { target: "Pásame la sal, por favor.", english: "Pass me the salt, please.", tags: ["general", "family"] },
  { target: "Sal de ahí ahora mismo.", english: "Get out of there right now.", tags: ["general"] },
  { target: "No te olvides de llamar al dentista.", english: "Don't forget to call the dentist.", tags: ["general"] },
  { target: "Envíeme el presupuesto por correo.", english: "Send me the budget by email.", tags: ["general", "work"], grammar: "Usted command: envíe + me" },
  { target: "Pon la mesa, que ya está la cena.", english: "Set the table, dinner's ready.", tags: ["general", "family"] },
  { target: "No corras por el pasillo.", english: "Don't run in the hallway.", tags: ["general", "family"] },
  { target: "Haz la tarea antes de jugar.", english: "Do your homework before playing.", tags: ["general", "family"], grammar: "Irregular tú command: haz (hacer)" },
  { target: "Llámame cuando llegues.", english: "Call me when you arrive.", tags: ["general", "travel"] },
  { target: "Ten cuidado con el escalón.", english: "Be careful with the step.", tags: ["general"], grammar: "Irregular tú command: ten (tener)" },
  { target: "No comas tan rápido.", english: "Don't eat so fast.", tags: ["general", "family"] },
  { target: "Abre la ventana, hace mucho calor.", english: "Open the window, it's very hot.", tags: ["general"] },
  { target: "Trae el paraguas por si acaso.", english: "Bring the umbrella just in case.", tags: ["general", "travel"] },
  { target: "No te vayas todavía.", english: "Don't go yet.", tags: ["general", "family"] },
  { target: "Sé paciente, ya casi estamos.", english: "Be patient, we're almost there.", tags: ["general"], grammar: "Irregular tú command: sé (ser)" },
  { target: "Cierra la puerta con llave.", english: "Lock the door.", tags: ["general"] },
  { target: "No hables tan alto en la biblioteca.", english: "Don't talk so loud in the library.", tags: ["general"] },
  { target: "Léete las instrucciones primero.", english: "Read the instructions first.", tags: ["general", "work"] },
  { target: "Ponte el abrigo, que hace frío.", english: "Put your coat on, it's cold.", tags: ["general", "family"], grammar: "Reflexive tú command: ponte (ponerse)" },
  { target: "No dejes todo para el último momento.", english: "Don't leave everything for the last minute.", tags: ["general", "work"] },
  { target: "Siga todo recto y gire a la derecha.", english: "Go straight ahead and turn right.", tags: ["general", "travel"], grammar: "Usted commands: siga, gire — for directions" },
  { target: "Espera un momento, ahora vuelvo.", english: "Wait a moment, I'll be right back.", tags: ["general"] },
  { target: "Cuéntame qué pasó.", english: "Tell me what happened.", tags: ["general"] },
  { target: "No te sientes ahí, está mojado.", english: "Don't sit there, it's wet.", tags: ["general"] },
  { target: "Prueba este plato, está delicioso.", english: "Try this dish, it's delicious.", tags: ["general", "travel"] },
  { target: "Avísame cuando termines.", english: "Let me know when you finish.", tags: ["general", "work"] },
  { target: "No gastes tanto dinero en tonterías.", english: "Don't spend so much money on nonsense.", tags: ["general", "family"] },
  { target: "Busca en el cajón de abajo.", english: "Look in the bottom drawer.", tags: ["general"] },
  { target: "Acuéstate temprano, mañana hay que madrugar.", english: "Go to bed early, we have to get up early tomorrow.", tags: ["general", "family"] },
  { target: "Pregúntale al recepcionista.", english: "Ask the receptionist.", tags: ["general", "travel"] },
  { target: "No llegues tarde otra vez.", english: "Don't be late again.", tags: ["general", "work"] },
  { target: "Coge lo que necesites.", english: "Take whatever you need.", tags: ["general"] },
  { target: "Cállate un segundo, estoy hablando.", english: "Be quiet for a second, I'm talking.", tags: ["general"], grammar: "Reflexive tú command: cállate (callarse)" },
  { target: "Mira, ahí está el museo.", english: "Look, there's the museum.", tags: ["general", "travel"] },
  { target: "No te rindas, lo estás haciendo bien.", english: "Don't give up, you're doing great.", tags: ["general", "work"] },
  { target: "Firma aquí abajo, por favor.", english: "Sign here at the bottom, please.", tags: ["general", "work"] },
  { target: "Recoge tus cosas del suelo.", english: "Pick your things up off the floor.", tags: ["general", "family"] },
  { target: "No me interrumpas, por favor.", english: "Don't interrupt me, please.", tags: ["general", "work"] },
  { target: "Deja de quejarte y haz algo.", english: "Stop complaining and do something.", tags: ["general"] },
  { target: "Descansa, te lo mereces.", english: "Rest, you deserve it.", tags: ["general", "work"] },
  { target: "Ve al supermercado y compra leche.", english: "Go to the supermarket and buy milk.", tags: ["general"], grammar: "Irregular tú command: ve (ir)" },
  { target: "Perdone, ¿me puede indicar el camino?", english: "Excuse me, can you show me the way?", tags: ["general", "travel"] },
  { target: "No hagas ruido, el bebé está durmiendo.", english: "Don't make noise, the baby is sleeping.", tags: ["general", "family"] },
  { target: "Respira hondo y tranquilízate.", english: "Take a deep breath and calm down.", tags: ["general"] },
  { target: "Sígueme, te enseño la oficina.", english: "Follow me, I'll show you the office.", tags: ["general", "work"] },
  { target: "No abras la puerta a desconocidos.", english: "Don't open the door to strangers.", tags: ["general", "family"] },
  { target: "Déjame pensarlo un poco.", english: "Let me think about it.", tags: ["general", "work"] },
  { target: "Sube el volumen, no oigo nada.", english: "Turn up the volume, I can't hear anything.", tags: ["general"] },
];

// ═══════════════════════════════════════════════════════════════
// NODE 13: Conditional (B1)
// ═══════════════════════════════════════════════════════════════
newCardsByNode[13] = [
  { target: "Yo en tu lugar buscaría otro trabajo.", english: "In your place, I would look for another job.", tags: ["general", "work"], grammar: "Conditional for advice — yo en tu lugar + conditional" },
  { target: "Me gustaría viajar a Japón.", english: "I would like to travel to Japan.", tags: ["general", "travel"], grammar: "Me gustaría — polite wish with conditional" },
  { target: "¿Podrías cerrar la ventana?", english: "Could you close the window?", tags: ["general"], grammar: "Podrías — polite request with conditional" },
  { target: "Si tuviera más tiempo, aprendería a tocar la guitarra.", english: "If I had more time, I would learn to play guitar.", tags: ["general"], grammar: "Si + imperfect subjunctive + conditional — hypothetical" },
  { target: "Sería mejor empezar temprano.", english: "It would be better to start early.", tags: ["general", "work"] },
  { target: "No haría eso si fuera tú.", english: "I wouldn't do that if I were you.", tags: ["general"] },
  { target: "¿Te importaría bajar la música?", english: "Would you mind turning down the music?", tags: ["general"], grammar: "Conditional for polite request" },
  { target: "Deberías ir al médico.", english: "You should go to the doctor.", tags: ["general", "family"] },
  { target: "Con más práctica, hablarías mejor.", english: "With more practice, you would speak better.", tags: ["general"] },
  { target: "Me encantaría conocer a tu familia.", english: "I would love to meet your family.", tags: ["general", "family"] },
  { target: "Si ganara la lotería, dejaría de trabajar.", english: "If I won the lottery, I would stop working.", tags: ["general", "work"] },
  { target: "¿Podrías enviarme el documento antes del lunes?", english: "Could you send me the document before Monday?", tags: ["general", "work"] },
  { target: "Yo no diría nada por ahora.", english: "I wouldn't say anything for now.", tags: ["general", "work"] },
  { target: "Nos vendría bien un descanso.", english: "A break would do us good.", tags: ["general", "work"] },
  { target: "Si pudiera elegir, viviría cerca del mar.", english: "If I could choose, I would live near the sea.", tags: ["general"] },
  { target: "Tendría que pensármelo.", english: "I would have to think about it.", tags: ["general"] },
  { target: "¿Querrías venir con nosotros?", english: "Would you like to come with us?", tags: ["general", "travel"] },
  { target: "Si lloviera, nos quedaríamos en casa.", english: "If it rained, we would stay home.", tags: ["general", "family"] },
  { target: "Eso costaría demasiado.", english: "That would cost too much.", tags: ["general"] },
  { target: "Deberíamos salir ya para no llegar tarde.", english: "We should leave now so we're not late.", tags: ["general", "travel"] },
  { target: "Si supiera la respuesta, te la diría.", english: "If I knew the answer, I would tell you.", tags: ["general"], grammar: "Si + imperfect subjunctive + conditional" },
  { target: "Con un poco de suerte, conseguiríamos el contrato.", english: "With a bit of luck, we would get the contract.", tags: ["general", "work"] },
  { target: "Me iría de vacaciones ahora mismo.", english: "I would go on vacation right now.", tags: ["general", "travel"] },
  { target: "¿Podrías repetir eso más despacio?", english: "Could you repeat that more slowly?", tags: ["general", "travel"] },
  { target: "Si no trabajara tanto, pasaría más tiempo con mis hijos.", english: "If I didn't work so much, I would spend more time with my kids.", tags: ["general", "family", "work"] },
  { target: "Sería genial ir todos juntos.", english: "It would be great to all go together.", tags: ["general", "family"] },
  { target: "Yo diría que tiene razón.", english: "I would say she's right.", tags: ["general"] },
  { target: "Si viviera más cerca, vendría a pie.", english: "If I lived closer, I would come on foot.", tags: ["general", "travel"] },
  { target: "¿Te gustaría cenar fuera esta noche?", english: "Would you like to eat out tonight?", tags: ["general", "family"] },
  { target: "No debería comer tanto dulce.", english: "I shouldn't eat so many sweets.", tags: ["general"] },
  { target: "Con más personal, terminaríamos antes.", english: "With more staff, we would finish sooner.", tags: ["general", "work"], grammar: "Conditional for hypothetical result" },
  { target: "Si fuera posible, cambiaría mi horario.", english: "If it were possible, I would change my schedule.", tags: ["general", "work"] },
  { target: "Haría cualquier cosa por mi familia.", english: "I would do anything for my family.", tags: ["general", "family"] },
  { target: "¿Podrías ayudarme con la mudanza?", english: "Could you help me with the move?", tags: ["general"] },
  { target: "Creo que sería mejor esperar.", english: "I think it would be better to wait.", tags: ["general", "work"] },
  { target: "Si tuviera coche, te llevaría.", english: "If I had a car, I would give you a ride.", tags: ["general"] },
  { target: "Valdría la pena intentarlo.", english: "It would be worth trying.", tags: ["general"], grammar: "Valdría la pena — conditional of valer" },
  { target: "¿Sabrías llegar sin GPS?", english: "Would you know how to get there without GPS?", tags: ["general", "travel"] },
  { target: "Si hablara mejor español, pediría un traslado.", english: "If I spoke better Spanish, I would request a transfer.", tags: ["general", "work"] },
  { target: "Nos gustaría reservar una mesa para cuatro.", english: "We would like to reserve a table for four.", tags: ["general", "travel"], grammar: "Nos gustaría — polite conditional request" },
  { target: "Si estuviera en tu situación, hablaría con ella.", english: "If I were in your situation, I would talk to her.", tags: ["general"] },
  { target: "Eso no pasaría en una empresa seria.", english: "That wouldn't happen at a serious company.", tags: ["general", "work"] },
  { target: "A mí me parecería bien cambiar la fecha.", english: "I would be fine with changing the date.", tags: ["general", "work"] },
  { target: "Si pudiera volver atrás, haría las cosas diferente.", english: "If I could go back, I would do things differently.", tags: ["general"] },
  { target: "Deberías probar la comida de aquí.", english: "You should try the food here.", tags: ["general", "travel"] },
  { target: "Si no lloviera, iríamos al parque.", english: "If it weren't raining, we would go to the park.", tags: ["general", "family"] },
  { target: "¿Le importaría esperar un momento?", english: "Would you mind waiting a moment?", tags: ["general", "work"], grammar: "Conditional of importar — very formal polite request" },
  { target: "Yo que tú no aceptaría esa oferta.", english: "If I were you, I wouldn't accept that offer.", tags: ["general", "work"], grammar: "Yo que tú + conditional — giving advice" },
  { target: "Nos encantaría que vinieras a la boda.", english: "We would love for you to come to the wedding.", tags: ["general", "family"] },
  { target: "Con este tráfico, tardaríamos una hora.", english: "With this traffic, it would take us an hour.", tags: ["general", "travel"] },
  { target: "Si me subieran el sueldo, estaría más contento.", english: "If they gave me a raise, I would be happier.", tags: ["general", "work"] },
  { target: "Diría que tiene unos treinta años.", english: "I would say he's about thirty years old.", tags: ["general"] },
  { target: "Si no costara tanto, iría todos los años.", english: "If it didn't cost so much, I would go every year.", tags: ["general", "travel"] },
  { target: "¿Podrías echarle un ojo a esto?", english: "Could you take a look at this?", tags: ["general", "work"] },
  { target: "Me mudaría a otra ciudad sin pensarlo.", english: "I would move to another city without thinking twice.", tags: ["general"] },
];

// ═══════════════════════════════════════════════════════════════
// NODE 14: Future & Compound Tenses (B1)
// ═══════════════════════════════════════════════════════════════
newCardsByNode[14] = [
  { target: "Ya habrán llegado a esta hora.", english: "They must have arrived by now.", tags: ["general"], grammar: "Future perfect for probability about the past" },
  { target: "Mañana te llamaré por la tarde.", english: "I'll call you tomorrow afternoon.", tags: ["general", "family"] },
  { target: "¿Habrás terminado para las cinco?", english: "Will you have finished by five?", tags: ["general", "work"], grammar: "Future perfect for completed action before a deadline" },
  { target: "Creo que lloverá este fin de semana.", english: "I think it'll rain this weekend.", tags: ["general"] },
  { target: "He vivido aquí toda mi vida.", english: "I've lived here my whole life.", tags: ["general"], grammar: "Present perfect — life experience" },
  { target: "Nunca he estado en Sudamérica.", english: "I've never been to South America.", tags: ["general", "travel"] },
  { target: "¿Quién será a esta hora?", english: "Who could that be at this hour?", tags: ["general"], grammar: "Future tense for speculation / probability in present" },
  { target: "Ya habíamos comido cuando llegaron.", english: "We had already eaten when they arrived.", tags: ["general", "family"], grammar: "Past perfect — action completed before another past action" },
  { target: "El próximo año estudiaré un máster.", english: "Next year I'll study for a master's degree.", tags: ["general", "work"] },
  { target: "¿Has visto las noticias hoy?", english: "Have you seen the news today?", tags: ["general"] },
  { target: "Todavía no he desayunado.", english: "I still haven't had breakfast.", tags: ["general"] },
  { target: "Serán las tres de la tarde.", english: "It must be about three in the afternoon.", tags: ["general"], grammar: "Future for conjecture about present time" },
  { target: "Cuando vuelva, ya habrán cerrado.", english: "When I get back, they'll have already closed.", tags: ["general", "travel"] },
  { target: "He trabajado aquí cinco años.", english: "I've worked here for five years.", tags: ["general", "work"] },
  { target: "El mes que viene nos mudaremos.", english: "Next month we'll move.", tags: ["general", "family"] },
  { target: "Nunca había visto algo así.", english: "I had never seen anything like that.", tags: ["general"], grammar: "Past perfect — first-time experience in the past" },
  { target: "¿Cuánto costará el billete?", english: "How much will the ticket cost?", tags: ["general", "travel"] },
  { target: "Ya he hecho las maletas.", english: "I've already packed my suitcases.", tags: ["general", "travel"] },
  { target: "Habré terminado el informe para el viernes.", english: "I'll have finished the report by Friday.", tags: ["general", "work"], grammar: "Future perfect — completion before a deadline" },
  { target: "¿Has probado la nueva cafetería?", english: "Have you tried the new café?", tags: ["general"] },
  { target: "Estará en una reunión, por eso no contesta.", english: "He's probably in a meeting, that's why he's not answering.", tags: ["general", "work"], grammar: "Future for probability / speculation about present" },
  { target: "Nunca habíamos viajado juntos.", english: "We had never traveled together.", tags: ["general", "travel"] },
  { target: "Te prometo que no volverá a pasar.", english: "I promise it won't happen again.", tags: ["general", "work"] },
  { target: "He pensado mucho en lo que dijiste.", english: "I've thought a lot about what you said.", tags: ["general", "family"] },
  { target: "Dentro de un año habremos pagado todo.", english: "In a year we'll have paid for everything.", tags: ["general"] },
  { target: "¿Cuándo volverás de tu viaje?", english: "When will you come back from your trip?", tags: ["general", "travel"] },
  { target: "Ya había salido cuando me llamaste.", english: "I had already left when you called me.", tags: ["general"], grammar: "Past perfect — completed action before past reference" },
  { target: "Este verano iré a visitar a mis abuelos.", english: "This summer I'll go visit my grandparents.", tags: ["general", "family"] },
  { target: "¿Has hablado con el jefe sobre el proyecto?", english: "Have you talked to the boss about the project?", tags: ["general", "work"] },
  { target: "Supongo que tendrá unos cuarenta años.", english: "I guess he's about forty years old.", tags: ["general"], grammar: "Future for conjecture about someone's age" },
  { target: "Hemos recibido muchas quejas esta semana.", english: "We've received a lot of complaints this week.", tags: ["general", "work"] },
  { target: "Pronto sabremos los resultados.", english: "We'll know the results soon.", tags: ["general", "work"] },
  { target: "Ya he leído ese libro dos veces.", english: "I've already read that book twice.", tags: ["general"] },
  { target: "Para entonces ya habré encontrado trabajo.", english: "By then I'll have found a job.", tags: ["general", "work"], grammar: "Future perfect — anticipated completion" },
  { target: "Nos habíamos perdido en el centro.", english: "We had gotten lost in the city center.", tags: ["general", "travel"] },
  { target: "¿Vendrás a la cena del viernes?", english: "Will you come to Friday's dinner?", tags: ["general", "family"] },
  { target: "Le he dicho mil veces que tenga cuidado.", english: "I've told him a thousand times to be careful.", tags: ["general", "family"] },
  { target: "¿Habrá sitio en el restaurante?", english: "Will there be room at the restaurant?", tags: ["general", "travel"], grammar: "Future of haber for speculation" },
  { target: "Todavía no hemos decidido adónde ir.", english: "We still haven't decided where to go.", tags: ["general", "travel"] },
  { target: "El año que viene cambiaré de trabajo.", english: "Next year I'll change jobs.", tags: ["general", "work"] },
  { target: "Ya habían cerrado cuando llegamos.", english: "They had already closed when we arrived.", tags: ["general", "travel"], grammar: "Past perfect — action completed before arrival" },
  { target: "Seguro que ya lo habrás oído.", english: "I'm sure you'll have heard about it already.", tags: ["general"], grammar: "Future perfect for assumption" },
  { target: "He aprendido mucho en este trabajo.", english: "I've learned a lot at this job.", tags: ["general", "work"] },
  { target: "¿A qué hora saldrá el tren?", english: "What time will the train leave?", tags: ["general", "travel"] },
  { target: "Nos hemos mudado tres veces este año.", english: "We've moved three times this year.", tags: ["general", "family"] },
  { target: "Ya habíamos hablado de esto antes.", english: "We had already talked about this before.", tags: ["general", "work"] },
  { target: "No creo que tardaré mucho.", english: "I don't think I'll take long.", tags: ["general"] },
  { target: "Se habrá olvidado de la reunión.", english: "He must have forgotten about the meeting.", tags: ["general", "work"], grammar: "Future perfect for probability about recent past" },
  { target: "He conocido a gente muy interesante aquí.", english: "I've met very interesting people here.", tags: ["general", "travel"] },
  { target: "¿Alguna vez has cocinado paella?", english: "Have you ever cooked paella?", tags: ["general"] },
  { target: "Para junio ya habremos acabado las obras.", english: "By June we'll have finished the construction.", tags: ["general", "work"], grammar: "Future perfect for projected completion" },
  { target: "Nunca había probado la comida tailandesa.", english: "I had never tried Thai food.", tags: ["general"] },
  { target: "¿Me ayudarás con la mudanza el sábado?", english: "Will you help me with the move on Saturday?", tags: ["general", "family"] },
  { target: "He intentado llamarte varias veces.", english: "I've tried calling you several times.", tags: ["general"] },
  { target: "No sé qué habrá pasado.", english: "I don't know what could have happened.", tags: ["general"], grammar: "Future perfect for speculation about unknown past event" },
];

// ─── MERGE NEW CARDS ─────────────────────────────────────────────
let nextId = deck[deck.length - 1].id + 1;
let addedCount = 0;
let skippedDupes = 0;

for (const [nodeStr, cards] of Object.entries(newCardsByNode)) {
  for (const card of cards) {
    const key = card.target.toLowerCase().trim();
    if (existingTargets.has(key)) {
      skippedDupes++;
      continue;
    }
    existingTargets.add(key);
    deck.push({
      id: nextId++,
      target: card.target,
      english: card.english,
      audio: "",
      tags: card.tags,
      ...(card.grammar ? { grammar: card.grammar } : {}),
    });
    addedCount++;
  }
}

console.log(`\nAdded ${addedCount} new cards (skipped ${skippedDupes} duplicates)`);
console.log(`New total: ${deck.length} cards`);

// Tag distribution
const finalTagCounts = {};
for (const card of deck) {
  for (const tag of card.tags) {
    finalTagCounts[tag] = (finalTagCounts[tag] || 0) + 1;
  }
}
console.log('\nFinal tag distribution:');
for (const [tag, count] of Object.entries(finalTagCounts)) {
  console.log(`  ${tag}: ${count} (${(count / deck.length * 100).toFixed(1)}%)`);
}

// Grammar stats
const grammarCount = deck.filter(c => c.grammar).length;
console.log(`\nCards with grammar: ${grammarCount}/${deck.length} (${(grammarCount / deck.length * 100).toFixed(1)}%)`);

// Per-node counts
console.log('\nNew cards per node:');
for (const [nodeStr, cards] of Object.entries(newCardsByNode)) {
  const added = cards.filter(c => !existingTargets.has('__skip__')).length;
  console.log(`  Node ${nodeStr}: ${cards.length} defined`);
}

// Write
fs.writeFileSync(DECK_PATH, JSON.stringify(deck, null, 2));
console.log(`\nWrote expanded deck: ${deck.length} cards`);
