/**
 * Grammar Node Classifier for Spanish Deck
 *
 * Assigns each card to one of 20 CEFR grammar nodes based on
 * sentence structure analysis and grammar tip keywords.
 */

import { readFileSync, writeFileSync } from 'fs';

const deckPath = new URL('../src/data/spanish/deck.json', import.meta.url).pathname;
const deck = JSON.parse(readFileSync(deckPath, 'utf8'));

// Strip accents for regex matching (JS \w doesn't match á é í ó ú ñ ü)
function norm(s) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

// ─── Classification ────────────────────────────────────────────────────

function classify(card) {
  const raw = card.target || '';
  const t = norm(raw);         // accent-stripped for regex
  const g = norm(card.grammar || '');
  const words = raw.split(/\s+/).length;
  const isQuestion = raw.startsWith('¿');

  const scores = new Array(20).fill(0);

  // ── Node 17: Si clauses (Complex conditionals) ──
  if (/\bsi\s+\w+(iera|ara|iese|ase)\b/.test(t)) scores[16] += 12;
  if (/\bsi\b/.test(t) && /\w+(aria|eria|iria)\b/.test(t)) scores[16] += 10;
  if (/si clause|conditional.*si|si.*conditional|condicional.*si/i.test(g)) scores[16] += 14;
  if (/\bsi hubiera\b|\bsi pudiera\b|\bsi tuviera\b|\bsi fuera\b/.test(t)) scores[16] += 12;

  // ── Node 16: Imperfect subjunctive ──
  const impfSubjMatch = t.match(/\w+(iera|ieras|ieramos|ieran|iese|ieses|iesemos|iesen|ara|aras|aramos|aran)\b/g);
  if (impfSubjMatch && !(/\bsi\s/.test(t))) scores[15] += 8;
  if (/\bquisiera\b|\bpudiera\b|\bdebiera\b/.test(t)) scores[15] += 7;
  if (/imperfect subjunctive|past subjunctive|subjuntivo imperfecto|subjuntivo pasado/.test(g)) scores[15] += 14;
  // Careful: -ara/-iera can be preterite too (hablara vs habló). Weight lower if no subjunctive trigger.
  if (impfSubjMatch && /\bque\b|\bpara que\b|\bcomo si\b|\bojalá\b/.test(t)) scores[15] += 5;

  // ── Node 11: Present subjunctive ──
  // Only count "que" as subjunctive trigger when preceded by trigger verbs/expressions, NOT comparatives
  const subjTriggerWords = /\b(espero que|quiero que|necesito que|es importante que|es necesario que|es posible que|dudo que|no creo que|ojala|para que|antes de que|despues de que|sin que|a menos que|con tal de que|hasta que|cuando|aunque|es mejor que|prefiero que|sugiero que|recomiendo que|pido que|dejo que|hace falta que|es probable que)\b/;
  if (subjTriggerWords.test(t) && !impfSubjMatch) scores[10] += 9;
  if (/\bojala\b/.test(t)) scores[10] += 8;
  if (/subjunctive|subjuntivo/.test(g) && !/imperfect|past|pasado/.test(g)) scores[10] += 12;
  if (/\bpara que\b/.test(t) && !impfSubjMatch) scores[10] += 6;
  // que + present subjunctive verb pattern (approximate: -e/-es/-emos/-en after trigger)
  if (subjTriggerWords.test(t)) scores[10] += 4;

  // ── Node 13: Conditional ──
  if (/\w+(aria|arias|ariamos|arian|eria|erias|eriamos|erian|iria|irias|iriamos|irian)\b/.test(t) && !(/\bsi\s/.test(t))) scores[12] += 7;
  if (/\b(seria|tendria|podria|haria|diria|querria|vendria|sabria|pondria|gustaria|deberia|habria|estaria|iria|daria|viviria|compraria|necesitaria|preferiria|me gustaria)\b/.test(t)) scores[12] += 8;
  if (/conditional|condicional/.test(g) && !/si clause/.test(g)) scores[12] += 12;
  if (/\bme gustaria\b/.test(t)) scores[12] += 6;

  // ── Node 14: Future & perfect tenses ──
  if (/\w+(are|aras|ara|aremos|aran|ere|eras|era|eremos|eran|ire|iras|ira|iremos|iran)\b/.test(t) && !/\b(para|era|eras|eran|fuera|tuviera)\b/.test(t)) scores[13] += 5;
  if (/\b(sera|tendra|podra|hara|dira|vendra|sabra|pondra|saldra|habra|querra|valdra|ira)\b/.test(t)) scores[13] += 8;
  if (/\b(he|has|ha|hemos|han)\s+\w+(ado|ido|to|cho|so|sto|erto)\b/.test(t)) scores[13] += 9;
  if (/\b(habia|habias|habiamos|habian)\s+\w+(ado|ido|to|cho|so|sto|erto)\b/.test(t)) scores[13] += 8;
  if (/\b(voy a|vas a|va a|vamos a|van a)\s+\w+r\b/.test(t)) scores[13] += 5;
  if (/future|futuro|compound|perfect|perfecto|haber/.test(g)) scores[13] += 12;

  // ── Node 6: Preterite ──
  if (/\b(ayer|anoche|la semana pasada|el mes pasado|el ano pasado|hace\s+\w+\s+(anos|meses|dias|semanas)|una vez|de repente|entonces)\b/.test(t)) scores[5] += 6;
  if (/\b(fue|fui|fuiste|fuimos|fueron|dijo|hizo|tuvo|tuve|puso|puse|vino|vine|supo|supe|quiso|quise|pudo|pude|dio|vi|vio|estuvo|estuve)\b/.test(t)) scores[5] += 6;
  // -ó, -aron, -ieron endings (common preterite markers)
  if (/\w+o\b/.test(t) && /\b\w{3,}o\b/.test(t)) { /* too ambiguous, skip */ }
  if (/\w+(aron|ieron)\b/.test(t)) scores[5] += 6;
  if (/\w+(aste|iste)\b/.test(t)) scores[5] += 5;
  if (/preterit|preterito|indefinido/.test(g)) scores[5] += 12;

  // ── Node 7: Imperfect ──
  if (/\b(siempre|todos los dias|cada dia|a menudo|frecuentemente|de nino|de pequeno|cuando era|mientras|solia)\b/.test(t)) scores[6] += 6;
  if (/\b(era|eras|eramos|eran|estaba|estabas|estabamos|estaban|tenia|tenias|teniamos|tenian|habia|hacia|decia|podia|queria|sabia|venia|iba|ibas|ibamos|iban|vivia|viviamos|vivian)\b/.test(t)) scores[6] += 6;
  // -aba/-ía verb endings
  if (/\w+(aba|abas|abamos|aban)\b/.test(t)) scores[6] += 6;
  if (/\w+(ia|ias|iamos|ian)\b/.test(t) && !/\b(seria|tendria|podria|haria|diria|querria|me gustaria|deberia|habria)\b/.test(t)) scores[6] += 5;
  if (/imperfect|imperfecto/.test(g) && !/subjunctive|subjuntivo/.test(g)) scores[6] += 12;

  // ── Node 8: Reflexive verbs ──
  if (/\b(me|te|se|nos)\s+(despierto|despiertas|despierta|levanto|levantas|levanta|acuesto|acuestas|acuesta|ducho|duchas|ducha|visto|vistes|siento|sientes|siente|quedo|quedas|queda|llamo|llamas|llama|preocupo|preocupas|preocupa|lavo|lavas|lava)\b/.test(t)) scores[7] += 9;
  if (/\w+(arse|erse|irse)\b/.test(t)) scores[7] += 6;
  if (/reflexive|reflexivo|pronominal/.test(g)) scores[7] += 12;
  // me/te/se + verb (but not "se" passive or impersonal)
  if (/\b(me|te|nos)\s+\w+[oaei]\b/.test(t)) scores[7] += 4;

  // ── Node 12: Commands (imperative) ──
  if (/\b(ven|di|haz|sal|se|pon|ten|dime|dame|hazme|ponme|digame|traigame|venga|vaya|haga|diga|ponga|tenga|traiga|salga)\b/.test(t)) scores[11] += 8;
  if (/\bno\s+(hagas|digas|vayas|pongas|tengas|salgas|vengas|comas|bebas|toques|olvides|te preocupes|lo|la|les)\b/.test(t)) scores[11] += 8;
  if (/command|imperative|imperativo/.test(g)) scores[11] += 12;
  // Starts with a verb in imperative form
  if (/^(no\s+)?(ven|di|haz|sal|pon|ten|mira|escucha|espera|toma|cuidate|dime|dame)(\s|$|,|\.)/.test(t)) scores[11] += 7;

  // ── Node 2: Ser vs estar ──
  // Both ser AND estar forms in same sentence
  if (/\b(es|son|soy|eres|somos)\b/.test(t) && /\b(esta|estan|estoy|estas|estamos)\b/.test(t)) scores[1] += 12;
  if (/\bser\b.*\bestar\b|\bestar\b.*\bser\b|ser vs|estar vs/.test(g)) scores[1] += 14;
  if (/\b(ser|estar)\b/.test(g) && /\b(temporary|permanent|location|state|characteristic|condition)\b/.test(g)) scores[1] += 10;
  // Single ser/estar usage in short sentences (teaching the concept)
  if (words <= 8 && (/\b(es|son|soy|eres)\b/.test(t) || /\b(esta|estan|estoy|estas)\b/.test(t))) scores[1] += 3;

  // ── Node 5: Gustar & similar ──
  if (/\b(me|te|le|nos|les)\s+(gusta|gustan|encanta|encantan|interesa|interesan|importa|importan|molesta|molestan|fascina|fascinan|preocupa|preocupan|parece|parecen|duele|duelen|falta|faltan|sobra|sobran|apetece|apetecen|conviene|queda|quedan)\b/.test(t)) scores[4] += 10;
  if (/gustar|encantar|interesar|importar|parecer|doler|faltar/.test(g)) scores[4] += 12;

  // ── Node 9: Por vs para ──
  if (/\bpor\b/.test(t) && /\bpara\b/.test(t)) scores[8] += 10;
  if (/\bpor\b.*\bpara\b|\bpara\b.*\bpor\b|por vs|para vs/.test(g)) scores[8] += 14;
  if (/\b(por|para)\b/.test(g) && /\b(reason|purpose|exchange|duration|cause|goal|recipient|destinatario)\b/.test(g)) scores[8] += 8;

  // ── Node 10: Object pronouns ──
  if (/\b(me lo|me la|me los|me las|te lo|te la|te los|te las|se lo|se la|se los|se las|nos lo|nos la)\b/.test(t)) scores[9] += 12;
  if (/object pronoun|pronombre|direct object|indirect object|lo\/la|le\/les|complemento/.test(g)) scores[9] += 12;
  // Single object pronoun before verb
  if (/\b(lo|la|los|las|le|les)\s+(dije|digo|dimos|dan|di|doy|compre|traje|mande|envie|preste|regale)\b/.test(t)) scores[9] += 7;

  // ── Node 18: Passive & impersonal ──
  if (/\bse\s+(habla|vende|venden|necesita|necesitan|busca|buscan|dice|puede|pueden|ofrece|ofrecen|acepta|aceptan|permite|permiten|prohibe|prohiben|recomienda|recomiendan|alquila|alquilan|sirve|sirven|usa|usan|utiliza|utilizan|conoce|conocen|construyo|construyeron)\b/.test(t)) scores[17] += 9;
  if (/\bfue\s+\w+(ado|ido)\b/.test(t)) scores[17] += 9;
  if (/passive|pasiva|impersonal|se\s+(passive|impersonal)/.test(g)) scores[17] += 12;

  // ── Node 15: Relative clauses ──
  if (/\b(lo que|el que|la que|los que|las que|en donde|en el que|en la que|con quien|para quien|por lo que|segun el cual|cuyo|cuya|cuyos|cuyas|a quien|de quien)\b/.test(t)) scores[14] += 9;
  if (/relative clause|relativo|relative pronoun|oracion de relativo/.test(g)) scores[14] += 12;

  // ── Node 19: Advanced connectors ──
  if (/\b(sin embargo|no obstante|por lo tanto|en consecuencia|a pesar de|pese a|en cambio|por el contrario|ademas|asimismo|de hecho|en efecto|es decir|o sea|en otras palabras|mientras que|dado que|puesto que|ya que|con el fin de|a fin de|siempre y cuando|siempre que|en cuanto|tan pronto como|a medida que|debido a|por otro lado|en primer lugar|en conclusion|en resumen)\b/.test(t)) scores[18] += 10;
  if (/connector|conector|linking|discourse|marcador/.test(g)) scores[18] += 12;

  // ── Node 3: Common questions ──
  if (isQuestion) scores[2] += 5;
  if (isQuestion && /\b(como|cuando|donde|que|quien|cual|cuanto|cuantos|cuantas|por que|adonde|de donde)\b/.test(t)) scores[2] += 4;
  if (/question|interrogative|pregunta/.test(g)) scores[2] += 10;

  // ── Node 4: Articles & gender ──
  if (/article|articulo|gender|genero|masculine|feminine|masculino|femenino|el\/la|un\/una|concordancia/.test(g)) scores[3] += 12;
  // Short noun phrases emphasizing articles
  if (words <= 5 && /\b(el|la|los|las|un|una|unos|unas)\s+\w+\b/.test(t)) scores[3] += 3;

  // ── Node 20: Mixed advanced (idioms & advanced) ──
  if (/idiom|idiomatic|modismo|expression|expresion|slang|colloquial|refran|dicho/.test(g)) scores[19] += 14;
  if (words >= 25) scores[19] += 3;

  // ── Node 1: Present tense (default/fallback for simple sentences) ──
  if (/present tense|presente|indicative|indicativo/.test(g) && !/subjunctive|subjuntivo/.test(g)) scores[0] += 10;
  // Basic verbs in present, only if no complex grammar dominates
  const maxOther = Math.max(...scores.slice(1));
  if (maxOther < 5) {
    if (/\b(soy|eres|es|somos|son|tengo|tienes|tiene|tenemos|tienen|hablo|hablas|habla|hablamos|hablan|como|comes|come|comemos|comen|vivo|vives|vive|vivimos|viven|trabajo|trabajas|trabaja|estudio|estudias|estudia|quiero|puedo|necesito|hay|voy|vas|va|vamos|van|hago|hace|digo|dice|pongo|salgo|se|conozco|conoce)\b/.test(t)) {
      scores[0] += 4;
    }
  }

  // Find winner
  const maxScore = Math.max(...scores);

  if (maxScore === 0) {
    return assignByComplexity(raw, words, isQuestion);
  }

  return scores.indexOf(maxScore) + 1;
}

function assignByComplexity(raw, words, isQuestion) {
  if (words <= 3) return 1;   // single words / short phrases
  if (isQuestion && words <= 8) return 3;  // short questions
  if (words <= 6) return 1;   // basic present
  if (words <= 10) return 4;  // articles & structure
  if (words <= 15) return 9;  // mid-complexity
  if (words <= 20) return 15; // longer = more advanced
  return 20;                  // very complex = mastery
}

// ─── Run ───────────────────────────────────────────────────────────────

console.log('Classifying', deck.length, 'cards...\n');

const nodeCounts = new Array(20).fill(0);

for (const card of deck) {
  const node = classify(card);
  card.grammarNode = `node-${String(node).padStart(2, '0')}`;
  nodeCounts[node - 1]++;
}

const nodeNames = [
  'Present tense', 'Ser vs estar', 'Common questions', 'Articles & gender',
  'Gustar & similar', 'Preterite', 'Imperfect', 'Reflexive verbs',
  'Por vs para', 'Object pronouns', 'Present subjunctive', 'Commands',
  'Conditional', 'Future & perfect', 'Relative clauses', 'Imperfect subjunctive',
  'Complex conditionals', 'Passive & impersonal', 'Advanced connectors', 'Mixed advanced'
];

console.log('Node distribution (all cards):');
for (let i = 0; i < 20; i++) {
  console.log(`  node-${String(i+1).padStart(2,'0')} ${nodeNames[i].padEnd(24)} ${String(nodeCounts[i]).padStart(5)}`);
}
console.log(`  ${'TOTAL'.padEnd(31)} ${deck.length}`);

// Per-goal
console.log('\nPer-goal node counts:');
for (const goal of ['general', 'travel', 'work', 'family']) {
  const gc = deck.filter(c => (c.tags || []).includes(goal));
  const gn = new Array(20).fill(0);
  gc.forEach(c => gn[parseInt(c.grammarNode.replace('node-', '')) - 1]++);
  const line = gn.map(n => String(n).padStart(4)).join('');
  console.log(`  ${goal.padEnd(8)} (${gc.length}): ${line}`);
}

// Samples
console.log('\nSample cards:');
for (const id of [1, 8, 14, 50, 100, 500, 1000, 2500, 3000, 4000, 5000, 6000, 7000]) {
  const c = deck.find(d => d.id === id);
  if (c) {
    const nn = parseInt(c.grammarNode.replace('node-', '')) - 1;
    console.log(`  #${String(c.id).padStart(4)} → ${c.grammarNode} (${nodeNames[nn].padEnd(22)}) "${c.target.substring(0, 55)}"`);
  }
}

writeFileSync(deckPath, JSON.stringify(deck, null, 2));
console.log('\n✓ Updated deck.json');
