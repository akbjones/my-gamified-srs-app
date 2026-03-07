/**
 * latam-quality-fix.cjs — Comprehensive quality + Latin American Spanish fixes.
 *
 * 1. Fix specific cards flagged during review (bad grammar, awkward phrasing, wrong translations)
 * 2. Systematic Spain-specific vocabulary → Latin American equivalents
 * 3. Fix missing ¿ marks on questions
 * 4. Fix "ojalá que" → "ojalá" (more natural)
 * 5. Fix invalid mixed conditionals
 * 6. Replace vosotros conjugations with ustedes equivalents
 */
const fs = require('fs');
const path = require('path');

const DECK_PATH = path.join(__dirname, '..', 'src', 'data', 'spanish', 'deck.json');
const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf-8'));

let stats = {
  specificFixes: 0,
  missingInvQuestion: 0,
  ojalaQue: 0,
  coger: 0,
  ordenador: 0,
  vosotros: 0,
  spainVocab: 0,
  englishFixes: 0,
  mixedConditional: 0,
};

// ═══════════════════════════════════════════
// 1. SPECIFIC CARD FIXES (from review agents)
// ═══════════════════════════════════════════

const specificFixes = {
  // Agent 1 (IDs 1-2000)
  92:   { english: "It's two blocks from here." },
  460:  { target: "El edificio no tiene ascensor y vivimos en el quinto piso.", english: "The building has no elevator and we live on the fifth floor." },
  509:  { target: "Prefiero la carne al pescado, pero me gustan los dos.", english: "I prefer meat to fish, but I like both." },
  632:  { target: "Se nos pinchó una rueda en medio de la carretera.", english: "We got a flat tire in the middle of the road." },
  1082: { english: "The accident left a scar on his forehead." },
  1168: { english: "It deeply unsettles me to know that so many people suffer injustices daily." },
  1662: { english: "Peruvian ceviche is prepared with fresh fish marinated in lime." },
  1910: { english: "To each their own; everyone has their own way of doing things." },
  1927: { target: "La sopa está rica; es una receta de mi abuela.", english: "The soup tastes great; it's my grandmother's recipe." },
  1932: { target: "Se los expliqué con detalle pero no los entendieron.", english: "I explained it to them in detail but they didn't understand." },

  // Agent 2 (IDs 2001-4000)
  2033: { target: "Dobla a la derecha en la esquina." },
  2034: { target: "Sigue derecho hasta el semáforo." },
  2187: { target: "¿Te llevas bien con tus vecinos?" },
  2292: { english: "I would have preferred that you had told me sooner." },
  2355: { target: "Me han dado un plantón." },
  2538: { target: "Más vale tarde que nunca.", english: "Better late than never." },
  2755: { english: "Cheap apartments for sale." },
  2856: { english: "My younger brother is one meter eighty tall." },
  3011: { target: "¿Cuántos son en tu familia?", english: "How many are in your family?" },
  3431: { target: "Si no trabajas aquí, no lo entiendes.", english: "If you don't work here, you don't understand." },
  3533: { target: "Si pudiera volver atrás, haría las cosas de otra manera." },
  3591: { target: "No creo que tarde mucho." },
  3614: { english: "I loved the movie we watched last night." },
  3653: { english: "My mother really liked the gift I bought her." },
  3679: { target: "Si hubiera tenido tu número, te habría llamado.", english: "If I had had your number, I would have called you." },
  3759: { english: "Apartments for sale in this area." },
  3909: { english: "It's really hard to get through reading this whole report." },

  // Agent 3 (IDs 4001-6000)
  4017: { target: "Mi abuelo está jubilado." },
  4074: { target: "Me duele la mano desde ayer.", english: "My hand has been hurting since yesterday." },
  4091: { english: "It's a beautiful night." },
  4093: { target: "Viene una tormenta esta tarde." },
  4095: { target: "La leche está caducada." },
  4254: { english: "Smartphones didn't use to exist." },
  4266: { english: "We didn't use to pay so much for electricity." },
  4328: { target: "Mi abuela cuida mucho su alimentación." },
  4367: { english: "I got fined for double parking." },
  4387: { english: "I'm going to send it to him by mail." },
  4423: { english: "Put it up there, please." },
  4548: { english: "You should rest, you don't look well." },
  4836: { target: "Las entradas se agotaron en pocas horas.", english: "The tickets sold out in a few hours." },
  4989: { english: "It's our turn to clean the house this weekend." },
  4991: { english: "It's my turn to present the report tomorrow." },
  4993: { english: "I can't find my wallet anywhere." },
  5079: { target: "Si llueve, iremos al museo en vez de a la playa.", english: "If it rains, we'll go to the museum instead of the beach." },
  5097: { target: "Si no encuentro hotel, dormiré en un albergue.", english: "If I can't find a hotel, I'll sleep in a hostel." },
  5119: { target: "No creo que el jefe acepte esa propuesta.", english: "I don't think the boss will accept that proposal." },
  5134: { target: "Podríamos hacer una fiesta sorpresa para mamá.", english: "We could throw a surprise party for mom." },
  5149: { target: "Si llueve, jugaremos a juegos de mesa en casa.", english: "If it rains, we'll play board games at home." },
  5213: { target: "No es bueno que los niños pasen tanto tiempo frente a la pantalla.", english: "It's not good for the kids to spend so much time in front of a screen." },
  5353: { english: "Mom loved the gift we gave her." },
  5368: { target: "Le leo un cuento a mi hija todas las noches.", english: "I read my daughter a story every night." },
  5387: { target: "Si hubiéramos tenido un mapa, no nos habríamos perdido.", english: "If we had had a map, we wouldn't have gotten lost." },
  5425: { target: "Nos habríamos quedado más tiempo si no se nos hubiera acabado el dinero." },
  5799: { target: "Una catedral con unas puertas enormes." },
  5881: { english: "I have three vacation days left." },
};

for (const card of deck) {
  if (specificFixes[card.id]) {
    const fix = specificFixes[card.id];
    if (fix.target) card.target = fix.target;
    if (fix.english) card.english = fix.english;
    stats.specificFixes++;
  }
}

// ═══════════════════════════════════════════
// 2. FIX MISSING ¿ ON QUESTIONS
// ═══════════════════════════════════════════

for (const card of deck) {
  // If it ends with ? but doesn't start with ¿ (accounting for leading whitespace)
  const t = card.target.trim();
  if (t.endsWith('?') && !t.startsWith('¿')) {
    card.target = '¿' + t;
    stats.missingInvQuestion++;
  }
}

// ═══════════════════════════════════════════
// 3. FIX "OJALÁ QUE" → "OJALÁ" (more natural)
// ═══════════════════════════════════════════

for (const card of deck) {
  if (/\bojal[aá]\s+que\b/i.test(card.target)) {
    card.target = card.target.replace(/\b(ojal[aá])\s+que\b/gi, '$1');
    stats.ojalaQue++;
  }
}

// ═══════════════════════════════════════════
// 4. SPAIN → LATIN AMERICAN VOCABULARY
// ═══════════════════════════════════════════

// 4a. coger → tomar (when meaning "to take/catch" — vulgar in LatAm)
// Be careful: "recoger" (to pick up) is fine, "escoger" (to choose) is fine
for (const card of deck) {
  const before = card.target;
  // Match "coger" as a standalone verb (not recoger, escoger, acoger)
  card.target = card.target.replace(/\b(?<!re|es|a)cog(er|emos|éis|en|í|ió|ieron|ía|ías|íamos|ían|iendo|ido|e|es|a|as|amos|an)\b/gi, (match) => {
    const suffix = match.slice(3); // everything after "cog"
    // Map coger conjugations to tomar
    const map = {
      'er': 'ar', 'emos': 'amos', 'éis': 'áis', 'en': 'an',
      'í': 'é', 'ió': 'ó', 'ieron': 'aron', 'ía': 'aba', 'ías': 'abas',
      'íamos': 'ábamos', 'ían': 'aban', 'iendo': 'ando', 'ido': 'ado',
      'e': 'a', 'es': 'as', 'a': 'e', 'as': 'es', 'an': 'en',
    };
    const lowerSuffix = suffix.toLowerCase();
    if (map[lowerSuffix] !== undefined) {
      const replacement = 'tom' + map[lowerSuffix];
      // Preserve case of first letter
      return match[0] === match[0].toUpperCase()
        ? replacement.charAt(0).toUpperCase() + replacement.slice(1)
        : replacement;
    }
    return match;
  });
  if (card.target !== before) {
    // Also fix English if it says "catch" where it should say "take"
    stats.coger++;
  }
}

// 4b. ordenador → computadora
for (const card of deck) {
  const before = card.target;
  card.target = card.target.replace(/\bordenador(es)?\b/gi, (match) => {
    if (match.toLowerCase() === 'ordenadores') return match[0] === 'O' ? 'Computadoras' : 'computadoras';
    return match[0] === 'O' ? 'Computadora' : 'computadora';
  });
  if (card.target !== before) {
    card.english = card.english.replace(/\bcomputer\b/gi, 'computer'); // keep as is
    stats.ordenador++;
  }
}

// 4c. móvil → celular
for (const card of deck) {
  const before = card.target;
  card.target = card.target.replace(/\bmóvil(es)?\b/gi, (match) => {
    if (match.toLowerCase() === 'móviles') return match[0] === 'M' ? 'Celulares' : 'celulares';
    return match[0] === 'M' ? 'Celular' : 'celular';
  });
  // Fix "el móvil" → "el celular" (both masculine, no article change needed)
  if (card.target !== before) stats.spainVocab++;
}

// 4d. zumo → jugo
for (const card of deck) {
  const before = card.target;
  card.target = card.target.replace(/\bzumo(s)?\b/gi, (match) => {
    if (match.toLowerCase() === 'zumos') return match[0] === 'Z' ? 'Jugos' : 'jugos';
    return match[0] === 'Z' ? 'Jugo' : 'jugo';
  });
  if (card.target !== before) {
    card.english = card.english.replace(/\bjuice\b/i, 'juice'); // keep
    stats.spainVocab++;
  }
}

// 4e. conducir → manejar (when talking about driving)
for (const card of deck) {
  const before = card.target;
  // Only replace "conducir" as infinitive and common conjugations
  // "conducir" in LatAm → "manejar"
  card.target = card.target
    .replace(/\bconducir\b/g, 'manejar')
    .replace(/\bConduzco\b/g, 'Manejo')
    .replace(/\bconduzco\b/g, 'manejo')
    .replace(/\bconduces\b/g, 'manejas')
    .replace(/\bconduce\b/g, 'maneja')
    .replace(/\bconducimos\b/g, 'manejamos')
    .replace(/\bconducen\b/g, 'manejan')
    .replace(/\bconducía\b/g, 'manejaba')
    .replace(/\bconducías\b/g, 'manejabas')
    .replace(/\bconducíamos\b/g, 'manejábamos')
    .replace(/\bconducían\b/g, 'manejaban')
    .replace(/\bconduje\b/g, 'manejé')
    .replace(/\bcondujo\b/g, 'manejó')
    .replace(/\bcondujeron\b/g, 'manejaron')
    .replace(/\bcondujiste\b/g, 'manejaste')
    .replace(/\bconduciendo\b/g, 'manejando');
  if (card.target !== before) stats.spainVocab++;
}

// 4f. aparcar → estacionar(se)
for (const card of deck) {
  const before = card.target;
  card.target = card.target
    .replace(/\baparcar\b/g, 'estacionar')
    .replace(/\bAparcar\b/g, 'Estacionar')
    .replace(/\baparco\b/g, 'estaciono')
    .replace(/\baparcas\b/g, 'estacionas')
    .replace(/\baparca\b/g, 'estaciona')
    .replace(/\baparcamos\b/g, 'estacionamos')
    .replace(/\baparcan\b/g, 'estacionan')
    .replace(/\baparcé\b/g, 'estacioné')
    .replace(/\baparcó\b/g, 'estacionó')
    .replace(/\baparcado\b/g, 'estacionado')
    .replace(/\baparcando\b/g, 'estacionando')
    .replace(/\baparcamiento\b/g, 'estacionamiento')
    .replace(/\bAparcamiento\b/g, 'Estacionamiento');
  if (card.target !== before) stats.spainVocab++;
}

// 4g. carné de conducir → licencia de manejar / licencia de conducir
for (const card of deck) {
  const before = card.target;
  card.target = card.target.replace(/\bcarné de conducir\b/gi, 'licencia de conducir');
  if (card.target !== before) stats.spainVocab++;
}

// 4h. vale (as interjection) → dale / okay / listo
// Only match "vale" at start of sentence or standalone, NOT as verb form of "valer"
for (const card of deck) {
  const before = card.target;
  // "Vale, ..." at start → "Dale, ..."
  // ", vale." at end → ", dale." or ", ¿no?"
  // ", vale?" → ", ¿no?"
  card.target = card.target.replace(/^Vale,/g, 'Dale,');
  card.target = card.target.replace(/^vale,/g, 'dale,');
  card.target = card.target.replace(/, vale\.$/g, ', dale.');
  card.target = card.target.replace(/, vale\?$/g, ', ¿no?');
  card.target = card.target.replace(/, ¿vale\?$/g, ', ¿dale?');
  if (card.target !== before) stats.spainVocab++;
}

// 4i. piso (apartment) → departamento/apartamento
// Be careful: "piso" also means "floor" — only replace when meaning "apartment"
for (const card of deck) {
  const before = card.target;
  // Patterns where "piso" clearly means apartment
  if (/\b(mi|tu|su|nuestro|un|el|este|ese|nuevo|primer|segundo|pequeño)\s+piso\b/i.test(card.target) &&
      !/\bpiso\s+(de\s+)?(arriba|abajo|bajo|principal)\b/i.test(card.target) &&
      !/\bquinto\s+piso\b/i.test(card.target) &&
      !/\bprimer\s+piso\b/i.test(card.target) &&
      !/\bsegundo\s+piso\b/i.test(card.target) &&
      !/\btercer\s+piso\b/i.test(card.target) &&
      !/\búltimo\s+piso\b/i.test(card.target)) {
    // Check English to confirm it means apartment, not floor
    if (/\b(apartment|flat|place)\b/i.test(card.english)) {
      card.target = card.target.replace(/\bpisos\b/g, 'departamentos');
      card.target = card.target.replace(/\bPisos\b/g, 'Departamentos');
      card.target = card.target.replace(/\bpiso\b/g, 'departamento');
      card.target = card.target.replace(/\bPiso\b/g, 'Departamento');
      stats.spainVocab++;
    }
  }
  // "Se venden pisos" → "Se venden departamentos"
  if (/se\s+venden\s+pisos/i.test(card.target)) {
    card.target = card.target.replace(/pisos/g, 'departamentos');
    if (card.target !== before) stats.spainVocab++;
  }
}

// 4j. "coche" → "carro" (both understood everywhere, but carro is more LatAm)
for (const card of deck) {
  const before = card.target;
  card.target = card.target
    .replace(/\bcoches\b/g, 'carros')
    .replace(/\bCoches\b/g, 'Carros')
    .replace(/\bcoche\b/g, 'carro')
    .replace(/\bCoche\b/g, 'Carro');
  if (card.target !== before) stats.spainVocab++;
}

// ═══════════════════════════════════════════
// 5. VOSOTROS → USTEDES
// ═══════════════════════════════════════════

// Common vosotros endings and their ustedes equivalents
const vosotrosPatterns = [
  // Present indicative -áis/-éis/-ís
  { pattern: /\b(\w+)áis\b/g, check: (w) => true },
  { pattern: /\b(\w+)éis\b/g, check: (w) => true },
  // Imperative/present -ad/-ed/-id
];

// Instead of complex regex, let's find specific vosotros forms and fix them case by case
for (const card of deck) {
  const t = card.target;
  const before = t;

  // Detect common vosotros conjugation endings
  // -áis → -an (present), -éis → -en (present), -asteis → -aron, -isteis → -ieron
  // -aréis → -arán, -eréis → -erán, -iréis → -irán
  // -aríais → -arían, -eríais → -erían, -iríais → -irían

  // Present: habláis → hablan, coméis → comen, vivís → viven
  // But be careful not to match words that naturally end in these patterns

  // Check for "vosotros/vosotras" pronoun — dead giveaway
  if (/\bvosotros\b/i.test(t) || /\bvosotras\b/i.test(t)) {
    card.target = card.target
      .replace(/\bvosotros\b/g, 'ustedes')
      .replace(/\bVosotros\b/g, 'Ustedes')
      .replace(/\bvosotras\b/g, 'ustedes')
      .replace(/\bVosotras\b/g, 'Ustedes');

    // Also need to fix verb conjugation in the same sentence
    // Present: -áis → -an, -éis → -en
    card.target = card.target.replace(/(\w+)áis\b/g, '$1an');
    card.target = card.target.replace(/(\w+)éis\b/g, '$1en');

    // "os" object pronoun → "les"/"se"
    // This is complex, so only do the obvious ones
    card.target = card.target.replace(/\bos\s+/g, 'les ');

    stats.vosotros++;
  }

  // Also check for "sois" (vosotros form of ser) without "vosotros" pronoun
  if (/\bsois\b/.test(t) && !/\bustedes\b/i.test(t)) {
    card.target = card.target.replace(/\bsois\b/g, 'son');
    if (card.target !== before) stats.vosotros++;
  }

  // "tenéis" → "tienen", "sabéis" → "saben", "queréis" → "quieren"
  if (/\btenéis\b/.test(t)) { card.target = card.target.replace(/\btenéis\b/g, 'tienen'); stats.vosotros++; }
  if (/\bsabéis\b/.test(t)) { card.target = card.target.replace(/\bsabéis\b/g, 'saben'); stats.vosotros++; }
  if (/\bqueréis\b/.test(t)) { card.target = card.target.replace(/\bqueréis\b/g, 'quieren'); stats.vosotros++; }
  if (/\bestáis\b/.test(t)) { card.target = card.target.replace(/\bestáis\b/g, 'están'); stats.vosotros++; }
  if (/\bhabéis\b/.test(t)) { card.target = card.target.replace(/\bhabéis\b/g, 'han'); stats.vosotros++; }
  if (/\bpodéis\b/.test(t)) { card.target = card.target.replace(/\bpodéis\b/g, 'pueden'); stats.vosotros++; }
  if (/\bdebéis\b/.test(t)) { card.target = card.target.replace(/\bdebéis\b/g, 'deben'); stats.vosotros++; }
  if (/\bvenís\b/.test(t)) { card.target = card.target.replace(/\bvenís\b/g, 'vienen'); stats.vosotros++; }
  if (/\bponéis\b/.test(t)) { card.target = card.target.replace(/\bponéis\b/g, 'ponen'); stats.vosotros++; }
  if (/\bhacéis\b/.test(t)) { card.target = card.target.replace(/\bhacéis\b/g, 'hacen'); stats.vosotros++; }
  if (/\bdecís\b/.test(t)) { card.target = card.target.replace(/\bdecís\b/g, 'dicen'); stats.vosotros++; }
}

// ═══════════════════════════════════════════
// 6. FIX ENGLISH TRANSLATION ISSUES (bulk)
// ═══════════════════════════════════════════

for (const card of deck) {
  const before = card.english;

  // "didn't used to" → "didn't use to"
  card.english = card.english.replace(/didn't used to/g, "didn't use to");
  card.english = card.english.replace(/Didn't used to/g, "Didn't use to");

  // "It is my turn" → "It's my turn" (more natural)
  card.english = card.english.replace(/^It is (my|our|your|his|her|their) turn/g, "It's $1 turn");

  // "I cannot" → "I can't" (more natural for flashcards)
  card.english = card.english.replace(/\bI cannot\b/g, "I can't");

  if (card.english !== before) stats.englishFixes++;
}

// ═══════════════════════════════════════════
// 7. ALSO FIX GRAMMAR NOTES referencing Spain-specific terms
// ═══════════════════════════════════════════

for (const card of deck) {
  if (card.grammar) {
    card.grammar = card.grammar
      .replace(/\bordenador\b/gi, 'computadora')
      .replace(/\bcoche\b/gi, 'carro')
      .replace(/\bmóvil\b/gi, 'celular')
      .replace(/\bvosotros\b/gi, 'ustedes');
  }
}

// ═══════════════════════════════════════════
// WRITE & REPORT
// ═══════════════════════════════════════════

fs.writeFileSync(DECK_PATH, JSON.stringify(deck, null, 2));

console.log('=== LATIN AMERICAN + QUALITY FIX RESULTS ===\n');
console.log(`Specific card fixes:       ${stats.specificFixes}`);
console.log(`Missing ¿ added:           ${stats.missingInvQuestion}`);
console.log(`"Ojalá que" → "Ojalá":     ${stats.ojalaQue}`);
console.log(`"Coger" → "Tomar":         ${stats.coger}`);
console.log(`"Ordenador" → "Computadora": ${stats.ordenador}`);
console.log(`Vosotros → Ustedes:        ${stats.vosotros}`);
console.log(`Spain vocab → LatAm:       ${stats.spainVocab}`);
console.log(`English naturalness fixes: ${stats.englishFixes}`);
console.log('');

// Verify: check for any remaining Spain-specific terms
const remaining = {
  coger: 0, ordenador: 0, vosotros: 0, movil: 0, zumo: 0, aparcar: 0, coche: 0
};
for (const c of deck) {
  const t = c.target.toLowerCase();
  if (/\b(?<!re|es|a)coger\b/.test(t) || /\b(?<!re|es|a)cog[eéií]\w*\b/.test(t)) remaining.coger++;
  if (/\bordenador/.test(t)) remaining.ordenador++;
  if (/\bvosotros/.test(t) || /\bsois\b/.test(t)) remaining.vosotros++;
  if (/\bmóvil\b/.test(t)) remaining.movil++;
  if (/\bzumo/.test(t)) remaining.zumo++;
  if (/\baparcar/.test(t) || /\baparcamiento/.test(t)) remaining.aparcar++;
  if (/\bcoche\b/.test(t)) remaining.coche++;
}
console.log('Remaining Spain-specific terms:');
for (const [term, count] of Object.entries(remaining)) {
  console.log(`  ${term}: ${count}`);
}

// Quick count
console.log(`\nTotal deck: ${deck.length} cards`);
