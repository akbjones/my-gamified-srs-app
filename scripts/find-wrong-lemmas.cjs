/**
 * Find entries where a word is wrongly linked to a verb lemma.
 * Uses a more careful derivation check:
 * - The word must share a meaningful root with the lemma
 * - Proper nouns, common nouns, adjectives that happen to look like conjugations
 *   but are actually different words should be flagged
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const OUTPUT = path.join(ROOT, 'scripts/output');

function normalize(s) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function getVerbRoot(lemma, lang) {
  const n = normalize(lemma);
  if (lang === 'es') return n.replace(/(arse|erse|irse|ar|er|ir)$/, '');
  if (lang === 'it') return n.replace(/(arsi|ersi|irsi|are|ere|ire)$/, '');
  if (lang === 'fr') return n.replace(/(er|ir|re|oir)$/, '');
  if (lang === 'pt') return n.replace(/(ar|er|ir)$/, '');
  return n;
}

function isLikelyDerivedFrom(word, lemma, lang) {
  const w = normalize(word);
  const root = getVerbRoot(lemma, lang);

  if (root.length < 3) return true; // Too short to tell

  // Direct prefix match (most common case for verb conjugations)
  if (w.startsWith(root)) return true;

  // Common stem changes in Spanish
  if (lang === 'es') {
    // e→ie: pensar→pienso, entender→entiende
    // o→ue: poder→puedo, dormir→duermo
    // Allow if root minus last char matches
    if (w.startsWith(root.slice(0, -2))) return true;
    // Reflexive pronouns attached: acostarse → acuest... (o→ue change + pronoun)
    // Need at least 3 chars in common
    const common = commonPrefix(w, root);
    if (common >= 3 || (common >= 2 && root.length <= 4)) return true;
  }

  if (lang === 'it') {
    const common = commonPrefix(w, root);
    if (common >= 3 || (common >= 2 && root.length <= 4)) return true;
  }

  if (lang === 'fr') {
    const common = commonPrefix(w, root);
    if (common >= 3 || (common >= 2 && root.length <= 4)) return true;
  }

  if (lang === 'pt') {
    const common = commonPrefix(w, root);
    if (common >= 3 || (common >= 2 && root.length <= 4)) return true;
  }

  return false;
}

function commonPrefix(a, b) {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return i;
}

// ===== SPANISH-SPECIFIC KNOWN WRONG MATCHES =====
// These are words that look like they could be verb forms but aren't
const ES_WRONG_MATCHES = {
  // Words wrongly matched to "amar" (to love) – root "am"
  'amable': 'kind, friendly',
  'amables': 'kind, friendly (pl)',
  'amarillo': 'yellow',
  'amazónica': 'Amazonian',
  'amazonas': 'Amazon',
  'ambas': 'both (f)',
  'ambición': 'ambition',
  'ambicioso': 'ambitious',
  'ambiental': 'environmental',
  'ambiente': 'environment, atmosphere',
  'ambivalente': 'ambivalent',
  'ambos': 'both',
  'ambulante': 'traveling, itinerant',
  'amenaza': 'threat',
  'amenazada': 'threatened',
  'amenazados': 'threatened (pl)',
  'américa': 'America',
  'amiga': 'friend (f)',
  'amigo': 'friend',
  'amigos': 'friends',
  'amistades': 'friendships',
  'amor': 'love',
  'amplia': 'wide, broad',
  'amplía': 'expands, broadens',
  'ampliado': 'expanded, broadened',
  'ambulancia': 'ambulance',

  // Words wrongly matched to "caer" (to fall) – root "ca"
  'caballo': 'horse',
  'cabeza': 'head',
  'cabezota': 'stubborn',
  'cabo': 'end, cape',
  'cada': 'each, every',
  'cadena': 'chain, channel',
  'caduca': 'expired',
  'caducada': 'expired',
  'caja': 'box, cash register',
  'cajas': 'boxes',
  'cajero': 'ATM, cashier',
  'cajeros': 'ATMs, cashiers',
  'cala': 'cove, inlet',

  // Words wrongly matched to "animar" – root "anim"
  'animal': 'animal',
  'animales': 'animals',

  // Words wrongly matched to other verbs
  'adaptador': 'adapter',
  'alojamiento': 'accommodation',
  'aprendizaje': 'learning',
  'asistente': 'assistant, attendee',
  'asistentes': 'assistants, attendees',
  'aspiradora': 'vacuum cleaner',
  'alimentaria': 'food-related, dietary',
  'andén': 'platform (train)',
  'andes': 'Andes',
  'andina': 'Andean',
  'atacama': 'Atacama',
  'actual': 'current, present',
  'actuales': 'current (pl)',
  'ahorros': 'savings',
  'seres': 'beings, creatures',
  'acera': 'sidewalk',
  'acoso': 'harassment',
  'amanecer': 'dawn, sunrise',

  // Wrong definitions from garbled auto-generation
  'abordar': 'to board, to approach',
  'acampar': 'to camp',
  'acortar': 'to shorten',
  'acostar': 'to lie down, to go to bed',
  'agendar': 'to schedule',
  'aislar': 'to isolate',
  'almacenar': 'to store',
  'afirmar': 'to affirm, to state',
  'analizar': 'to analyze',
  'anotar': 'to note down',
  'aplazar': 'to postpone',
  'atropellar': 'to run over',
  'aumentar': 'to increase',
  'automatizar': 'to automate',
  'auxiliar': 'auxiliary, assistant',
  'bienestar': 'well-being, welfare',
  'borrar': 'to delete, to erase',
  'autopista': 'highway, motorway',
  'autopistas': 'highways, motorways',
};

// Now let me scan the entire ES file for ALL wrong lemma references
function findAllWrongLemmas(lang) {
  const entries = JSON.parse(fs.readFileSync(path.join(OUTPUT, `${lang}-dict-entries.json`)));
  const wrong = [];

  for (const entry of entries) {
    const { word, en, pos } = entry;

    // Check lemma reference in definition
    const lemmaMatch = en.match(/\((\w+)\)\s*$/);
    if (!lemmaMatch) continue;

    const lemma = lemmaMatch[1];
    if (!isLikelyDerivedFrom(word, lemma, lang)) {
      wrong.push({ word, en, lemma, pos });
    }
  }

  return wrong;
}

// Run for ES
console.log('\n=== SPANISH: Words with wrong lemma references ===');
const esWrong = findAllWrongLemmas('es');
console.log(`Found ${esWrong.length} entries with potentially wrong lemma links:`);
for (const w of esWrong) {
  const known = ES_WRONG_MATCHES[w.word];
  console.log(`  ${w.word} → "${w.en}" (linked to ${w.lemma})${known ? ` – should be: "${known}"` : ''}`);
}

// Also check for words that match known wrong matches but don't have lemma refs
console.log('\n=== SPANISH: Known wrong definitions (no lemma ref) ===');
const entries = JSON.parse(fs.readFileSync(path.join(OUTPUT, 'es-dict-entries.json')));
for (const entry of entries) {
  const known = ES_WRONG_MATCHES[entry.word];
  if (known && !entry.en.includes('(') && entry.en !== known) {
    console.log(`  ${entry.word}: "${entry.en}" → should be: "${known}"`);
  }
}

// Run for IT
console.log('\n=== ITALIAN: Words with wrong lemma references ===');
const itWrong = findAllWrongLemmas('it');
console.log(`Found ${itWrong.length} entries`);
for (const w of itWrong.slice(0, 30)) {
  console.log(`  ${w.word} → "${w.en}" (linked to ${w.lemma})`);
}
if (itWrong.length > 30) console.log(`  ... and ${itWrong.length - 30} more`);

// Run for FR
console.log('\n=== FRENCH: Words with wrong lemma references ===');
const frWrong = findAllWrongLemmas('fr');
console.log(`Found ${frWrong.length} entries`);
for (const w of frWrong.slice(0, 30)) {
  console.log(`  ${w.word} → "${w.en}" (linked to ${w.lemma})`);
}
if (frWrong.length > 30) console.log(`  ... and ${frWrong.length - 30} more`);

// Run for PT
console.log('\n=== PORTUGUESE: Words with wrong lemma references ===');
const ptWrong = findAllWrongLemmas('pt');
console.log(`Found ${ptWrong.length} entries`);
for (const w of ptWrong.slice(0, 30)) {
  console.log(`  ${w.word} → "${w.en}" (linked to ${w.lemma})`);
}
if (ptWrong.length > 30) console.log(`  ... and ${ptWrong.length - 30} more`);
