/**
 * expand-final-top.cjs
 * Add the final 56 cards to reach exactly 5000.
 * Mixed across nodes/levels, boosting work tag slightly.
 */

const fs = require('fs');
const path = require('path');

const DECK_PATH = path.join(__dirname, '..', 'src', 'data', 'spanish', 'deck.json');
const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf-8'));

console.log(`Current deck: ${deck.length} cards`);

const existingTargets = new Set(deck.map(c => c.target.toLowerCase().trim()));
let nextId = Math.max(...deck.map(c => c.id)) + 1;

const newCards = [
  // Node 1 — Present Tense (A1)
  { target: "Siempre llego tarde los lunes.", english: "I always arrive late on Mondays.", tags: ["general", "work"] },
  { target: "Mi hermana canta muy bien.", english: "My sister sings very well.", tags: ["general", "family"] },
  { target: "Necesito comprar pan después del trabajo.", english: "I need to buy bread after work.", tags: ["general", "work"] },
  { target: "Los niños corren por el parque.", english: "The kids run through the park.", tags: ["general", "family"] },

  // Node 2 — Ser vs Estar (A1)
  { target: "La sopa está muy caliente todavía.", english: "The soup is still very hot.", tags: ["general"] },
  { target: "Mi jefe es de Colombia.", english: "My boss is from Colombia.", tags: ["general", "work"] },
  { target: "Estamos cansados de tanto caminar.", english: "We're tired from walking so much.", tags: ["general", "travel"] },

  // Node 3 — Common Questions (A1)
  { target: "¿Cuándo empieza la junta?", english: "When does the meeting start?", tags: ["general", "work"] },
  { target: "¿Dónde dejaste las llaves del coche?", english: "Where did you leave the car keys?", tags: ["general", "family"] },
  { target: "¿Por qué no viniste a la fiesta?", english: "Why didn't you come to the party?", tags: ["general"] },

  // Node 4 — Articles & Gender (A1)
  { target: "El problema es que no tenemos tiempo.", english: "The problem is that we don't have time.", tags: ["general", "work"], grammar: "El problema — masculine despite -a ending" },
  { target: "La mano me duele desde ayer.", english: "My hand has hurt since yesterday.", tags: ["general"], grammar: "La mano — feminine despite -o ending" },

  // Node 5 — Gustar & Similar (A1)
  { target: "Me encanta la comida de mi abuela.", english: "I love my grandmother's cooking.", tags: ["general", "family"] },
  { target: "¿Te molesta el ruido de la calle?", english: "Does the street noise bother you?", tags: ["general", "travel"] },

  // Node 6 — Pretérito (A2)
  { target: "Ayer firmé el contrato nuevo.", english: "Yesterday I signed the new contract.", tags: ["general", "work"] },
  { target: "No pude dormir en toda la noche.", english: "I couldn't sleep all night.", tags: ["general"] },
  { target: "¿Qué dijiste? No te escuché.", english: "What did you say? I didn't hear you.", tags: ["general"] },

  // Node 7 — Imperfecto (A2)
  { target: "De pequeño jugaba al fútbol todos los días.", english: "As a kid I played soccer every day.", tags: ["general", "family"] },
  { target: "Antes no había tantos coches en esta calle.", english: "Before there weren't so many cars on this street.", tags: ["general"] },

  // Node 8 — Reflexive Verbs (A2)
  { target: "Me visto rápido porque llego tarde.", english: "I get dressed quickly because I'm running late.", tags: ["general", "work"] },
  { target: "Nos conocimos en una conferencia.", english: "We met at a conference.", tags: ["general", "work"] },

  // Node 9 — Por vs Para (A2)
  { target: "Gracias por ayudarme con la mudanza.", english: "Thanks for helping me with the move.", tags: ["general", "family"] },
  { target: "Este informe es para el director.", english: "This report is for the director.", tags: ["general", "work"] },
  { target: "Paso por tu casa a las ocho.", english: "I'll come by your house at eight.", tags: ["general", "family"] },

  // Node 10 — Object Pronouns (A2)
  { target: "Se lo expliqué tres veces y no entiende.", english: "I explained it to him three times and he doesn't understand.", tags: ["general", "work"] },
  { target: "Cómpramelo cuando vayas al centro.", english: "Buy it for me when you go downtown.", tags: ["general"] },

  // Node 11 — Present Subjunctive (B1)
  { target: "Espero que te mejores pronto.", english: "I hope you get better soon.", tags: ["general", "family"] },
  { target: "No creo que llueva esta tarde.", english: "I don't think it'll rain this afternoon.", tags: ["general"] },
  { target: "Quiero que me expliques qué pasó.", english: "I want you to explain to me what happened.", tags: ["general", "family"] },

  // Node 12 — Commands (B1)
  { target: "No toques eso, está caliente.", english: "Don't touch that, it's hot.", tags: ["general", "family"] },
  { target: "Dígame su nombre y apellido, por favor.", english: "Tell me your first and last name, please.", tags: ["general", "work"] },

  // Node 13 — Conditional (B1)
  { target: "¿Podrías enviarme el archivo por correo?", english: "Could you send me the file by email?", tags: ["general", "work"] },
  { target: "Yo en tu lugar buscaría otro trabajo.", english: "If I were you, I'd look for another job.", tags: ["general", "work"] },

  // Node 14 — Future & Compound (B1)
  { target: "Mañana sabremos los resultados del examen.", english: "Tomorrow we'll know the exam results.", tags: ["general"] },
  { target: "Ya habrán llegado a estas horas.", english: "They must have arrived by now.", tags: ["general", "travel"] },

  // Node 15 — Relative Clauses (B1)
  { target: "La empresa en la que trabajo tiene buen ambiente.", english: "The company I work at has a good atmosphere.", tags: ["general", "work"] },
  { target: "El chico cuya madre es doctora está en mi clase.", english: "The boy whose mother is a doctor is in my class.", tags: ["general", "family"] },

  // Node 16 — Imperfect Subjunctive (B2)
  { target: "Si tuviera más dinero, viajaría por toda Asia.", english: "If I had more money, I'd travel all over Asia.", tags: ["general", "travel"] },
  { target: "Le pedí que me ayudara con el proyecto.", english: "I asked him to help me with the project.", tags: ["general", "work"] },
  { target: "Ojalá pudiera tomarme unos días libres.", english: "I wish I could take a few days off.", tags: ["general", "work"] },

  // Node 17 — Conditionals II & III (B2)
  { target: "Si hubieras estudiado más, habrías aprobado.", english: "If you had studied more, you would have passed.", tags: ["general"] },
  { target: "Si no hubiera llovido, habríamos ido a la playa.", english: "If it hadn't rained, we would have gone to the beach.", tags: ["general", "travel"] },

  // Node 18 — Passive & Impersonal (B2)
  { target: "Se necesitan voluntarios para el evento.", english: "Volunteers are needed for the event.", tags: ["general", "work"] },
  { target: "La reunión fue cancelada por el director.", english: "The meeting was cancelled by the director.", tags: ["general", "work"] },
  { target: "Aquí se come muy bien y muy barato.", english: "You eat very well and cheaply here.", tags: ["general", "travel"] },

  // Node 19 — Advanced Connectors (B2)
  { target: "No me convence la idea; sin embargo, lo voy a intentar.", english: "The idea doesn't convince me; however, I'm going to try it.", tags: ["general", "work"] },
  { target: "A pesar de la lluvia, salimos a pasear.", english: "Despite the rain, we went for a walk.", tags: ["general"] },
  { target: "No solo llegó tarde, sino que además no pidió disculpas.", english: "Not only did he arrive late, but he also didn't apologize.", tags: ["general", "work"] },

  // Node 20 — Mastery (B2)
  { target: "Digan lo que digan, voy a seguir adelante.", english: "Whatever they say, I'm going to keep going.", tags: ["general"] },
  { target: "Llevo años queriendo aprender a tocar la guitarra.", english: "I've been wanting to learn to play the guitar for years.", tags: ["general"] },
  { target: "Ni que fueras el jefe para hablarme así.", english: "It's not like you're the boss to talk to me like that.", tags: ["general", "work"] },
  { target: "Se me hace raro no verla por aquí.", english: "It feels weird not seeing her around here.", tags: ["general", "family"] },
  { target: "Por mucho que insistas, no voy a cambiar de opinión.", english: "No matter how much you insist, I'm not going to change my mind.", tags: ["general"] },
  { target: "¿Cómo es que nadie se dio cuenta?", english: "How is it that nobody noticed?", tags: ["general", "work"] },
  { target: "Haga lo que haga, siempre le critican.", english: "Whatever he does, they always criticize him.", tags: ["general", "work"], grammar: "Reduplicative subjunctive: haga lo que haga — whatever (he/she) does" },
  { target: "Llevamos una hora esperando el autobús.", english: "We've been waiting for the bus for an hour.", tags: ["general", "travel"] },
];

let added = 0;
let skipped = 0;

for (const card of newCards) {
  const key = card.target.toLowerCase().trim();
  if (existingTargets.has(key)) {
    skipped++;
    continue;
  }
  existingTargets.add(key);
  deck.push({ id: nextId++, ...card });
  added++;
}

fs.writeFileSync(DECK_PATH, JSON.stringify(deck, null, 2));
console.log(`Added: ${added}, Skipped: ${skipped}`);
console.log(`Final deck size: ${deck.length} cards`);
