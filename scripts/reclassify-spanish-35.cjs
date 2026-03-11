/**
 * reclassify-spanish-35.cjs  (v2)
 *
 * Migrates the Spanish deck from OLD 26-node structure to NEW 35-node structure.
 * Improved classification with smarter content-based splitting.
 */

const fs = require('fs');
const path = require('path');

const DECK_PATH = path.join(__dirname, '..', 'src', 'data', 'spanish', 'deck.json');
let deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf-8'));
console.log('Starting cards:', deck.length);

// ─── Per-node targets ─────────────────────────────────────────
const TARGETS = {
  'node-01': 200, 'node-02': 150, 'node-03': 80,  'node-04': 150, 'node-05': 150,
  'node-06': 50,  'node-07': 100, 'node-08': 150,
  'node-09': 200, 'node-10': 150, 'node-11': 150, 'node-12': 80,  'node-13': 80,
  'node-14': 50,  'node-15': 200,
  'node-16': 180, 'node-17': 100, 'node-18': 100, 'node-19': 150, 'node-20': 100,
  'node-21': 130,
  'node-22': 100, 'node-23': 100, 'node-24': 80,  'node-25': 100, 'node-26': 80,
  'node-27': 100,
  'node-28': 90,  'node-29': 90,  'node-30': 90,  'node-31': 90,
  'node-32': 80,  'node-33': 80,  'node-34': 80,  'node-35': 80,
};

// ═══════════════════════════════════════════════════════════════
// CONTENT DETECTION PATTERNS
// ═══════════════════════════════════════════════════════════════

// ── Expressions / greetings ──────────────────────────────────
// Short fixed phrases, greetings, numbers, time, weather
function isExpression(t, e) {
  const words = t.split(/\s+/).length;
  // Very short sentences are usually expressions
  if (words <= 3) return true;
  // Common expression phrases
  if (/^(hola|adiós|gracias|sí|no|por favor|perdón|buenos días|buenas tardes|buenas noches|mucho gusto|de nada|lo siento|con permiso|disculpe|bienvenido|felicidades|salud|cuidado|claro|vale|exacto|perfecto|genial|enhorabuena|igualmente|hasta luego|hasta mañana|nos vemos|buen provecho|encantado|con mucho gusto|ojalá)\b/i.test(t)) return true;
  // Time expressions
  if (/\b(son las|es la una|a las|qué hora|del mediodía|de la mañana|de la tarde|de la noche)\b/i.test(t) && words <= 7) return true;
  // Weather
  if (/\b(hace (frío|calor|sol|viento|buen tiempo|mal tiempo)|está (lloviendo|nevando|nublado))\b/i.test(t) && words <= 6) return true;
  // Numbers / counting
  if (/\b(uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|veinte|treinta|cien|mil)\b/i.test(t) && words <= 5) return true;
  // Fixed social phrases
  if (/\b(qué tal|cómo estás|cómo te llamas|me llamo|qué pasa|no te preocupes|no hay problema|qué bien|qué lástima|feliz cumpleaños|feliz navidad|buen viaje)\b/i.test(t) && words <= 6) return true;
  return false;
}

// ── Descriptions ─────────────────────────────────────────────
// Sentences about describing: hay, colors, sizes, adjectives, appearances
function isDescription(t, e) {
  // "hay" (there is/are) — strong signal
  if (/\bhay\b/i.test(t)) return true;
  // "es/son/está/están + adjective" patterns (description-focused)
  if (/\b(es|son|está|están)\s+(grande|pequeñ|bonit|fe[oa]|alt[oa]|baj[oa]|larg[oa]|cort[oa]|viej[oa]|nuev[oa]|llen[oa]|vací[oa]|modern[oa]|antig[oa]|cómod[oa]|elegant|hermosa?|important|famosa?|interesant|tranquil|ruid|limp[oa]|suci[oa]|clar[oa]|oscur[oa]|cálid[oa]|fresc[oa]|luminosa?|ampli[oa]|estrech[oa])/i.test(t)) return true;
  // Color descriptions
  if (/\b(rojo|azul|verde|amarillo|blanco|negro|gris|marrón|rosa|morado|naranja|color)\b/i.test(t) && /\b(es|son|tiene|lleva)\b/i.test(t)) return true;
  // Physical descriptions of things/places
  if (/\b(tiene\s+\w+\s+(habitacion|ventana|puerta|piso|metros|habitant|plant|cama)|mide|pesa)\b/i.test(t)) return true;
  // English "there is/are" confirms
  if (/\bthere (is|are)\b/i.test(e) && /\bhay\b/i.test(t)) return true;
  // "El/La [noun] es [adjective]" - pure description sentences
  if (/^(el|la|los|las|mi|tu|su|nuestr|este|esta|ese|esa)\s+\w+\s+(es|son|está|están)\s+/i.test(t)) {
    if (/\b(bonit|grande|pequeñ|alt|baj|nuev|viej|buen|mal|mejor|peor|más|menos|muy|bastante|demasiado|tan)\b/i.test(t)) return true;
  }
  return false;
}

// ── Irregular present verbs ──────────────────────────────────
// Only match when an irregular verb is the MAIN action (not just copula "es")
function hasIrregularPresentFocus(t) {
  // Strong irregular signals: stem-changing & unique forms as main verb
  // Excluding "es/son/está/están" which are copulas in most contexts
  if (/\b(soy|eres|somos)\b/i.test(t)) return true; // Identity ("soy profesor")
  if (/\b(estoy|estás|estamos)\b/i.test(t)) return true; // State
  if (/\b(voy|vas|va|vamos|van)\b/i.test(t) && !/\bva\s+a\b/i.test(t)) return true; // ir
  if (/\b(tengo|tienes|tenemos|tienen)\b/i.test(t)) return true;
  if (/\b(hago|haces|hacemos|hacen)\b/i.test(t)) return true;
  if (/\b(digo|dices|dice|decimos|dicen)\b/i.test(t)) return true;
  if (/\b(vengo|vienes|viene|venimos|vienen)\b/i.test(t)) return true;
  if (/\b(puedo|puedes|puede|podemos|pueden)\b/i.test(t)) return true;
  if (/\b(quiero|quieres|quiere|queremos|quieren)\b/i.test(t)) return true;
  if (/\b(sé|sabes|sabe|sabemos|saben)\b/i.test(t)) return true;
  if (/\b(pongo|pones|pone|ponemos|ponen)\b/i.test(t)) return true;
  if (/\b(salgo|sales|sale|salimos|salen)\b/i.test(t)) return true;
  if (/\b(doy|das|da|damos|dan)\b/i.test(t)) return true;
  if (/\b(veo|ves|ve|vemos|ven)\b/i.test(t) && !/\bven\s+(a|aquí)\b/i.test(t)) return true;
  if (/\b(conozco|conoces|conoce|conocemos|conocen)\b/i.test(t)) return true;
  if (/\b(oigo|oyes|oye|oímos|oyen)\b/i.test(t)) return true;
  if (/\b(traigo|traes|trae|traemos|traen)\b/i.test(t)) return true;
  // Stem-changing: e→ie, o→ue, e→i
  if (/\b(juego|juegas|juega|jugamos|juegan)\b/i.test(t)) return true;
  if (/\b(duermo|duermes|duerme|dormimos|duermen)\b/i.test(t)) return true;
  if (/\b(siento|sientes|siente|sentimos|sienten)\b/i.test(t)) return true;
  if (/\b(prefiero|prefieres|prefiere|preferimos|prefieren)\b/i.test(t)) return true;
  if (/\b(pienso|piensas|piensa|pensamos|piensan)\b/i.test(t)) return true;
  if (/\b(entiendo|entiendes|entiende|entendemos|entienden)\b/i.test(t)) return true;
  if (/\b(encuentro|encuentras|encuentra|encontramos|encuentran)\b/i.test(t)) return true;
  if (/\b(vuelvo|vuelves|vuelve|volvemos|vuelven)\b/i.test(t)) return true;
  if (/\b(cierro|cierras|cierra|cerramos|cierran)\b/i.test(t)) return true;
  if (/\b(pido|pides|pide|pedimos|piden)\b/i.test(t)) return true;
  if (/\b(sigo|sigues|sigue|seguimos|siguen)\b/i.test(t)) return true;
  return false;
}

// ── Irregular preterite ──────────────────────────────────────
const IRREG_PRETERITE = /\b(fui|fuiste|fue|fuimos|fueron|hice|hiciste|hizo|hicimos|hicieron|dije|dijiste|dijo|dijimos|dijeron|tuve|tuviste|tuvo|tuvimos|tuvieron|estuve|estuviste|estuvo|estuvimos|estuvieron|pude|pudiste|pudo|pudimos|pudieron|puse|pusiste|puso|pusimos|pusieron|supe|supiste|supo|supimos|supieron|vine|viniste|vino|vinimos|vinieron|quise|quisiste|quiso|quisimos|quisieron|traje|trajiste|trajo|trajimos|trajeron|conduje|condujo|traduje|tradujo|anduvo|anduvimos|anduvieron|hubo)\b/i;

// ── Past contrast markers ────────────────────────────────────
function isPastContrast(t) {
  // Must have contrast keywords AND both imperfect and preterite forms
  const hasContrast = /\b(mientras|cuando|de repente|en ese momento|de pronto|ya|todavía|aquel día|esa vez|pero)\b/i.test(t);
  const hasImperfect = /\b\w+(aba|abas|ábamos|aban|ía|ías|íamos|ían)\b/.test(t);
  const hasPreterite = /\b\w+(é|ó|aron|ieron)\b/.test(t) || IRREG_PRETERITE.test(t);
  return hasContrast && (hasImperfect || hasPreterite);
}

// ── Future vs compound tenses ────────────────────────────────
const FUTURE_FORMS = /\b\w*(aré|arás|ará|aremos|arán|eré|erás|erá|eremos|erán|iré|irás|irá|iremos|irán)\b/;
const FUTURE_IRREG = /\b(sabré|sabrás|sabrá|sabremos|sabrán|tendré|tendrás|tendrá|tendremos|tendrán|podré|podrás|podrá|podremos|podrán|haré|harás|hará|haremos|harán|diré|dirás|dirá|diremos|dirán|vendré|vendrás|vendrá|vendremos|vendrán|saldré|saldrás|saldrá|saldremos|saldrán|pondré|pondrás|pondrá|pondremos|pondrán|querré|querrás|querrá|querremos|querrán|valdré|valdrás|valdrá|valdremos|valdrán)\b/i;
const COMPOUND_TENSE = /\b(he|has|ha|hemos|han|había|habías|habíamos|habían|habré|habrás|habrá|habremos|habrán|habría|habrías|habríamos|habrían)\s+\w+(ado|ido|to|cho|sto|so)\b/i;

// ── Verb phrase / periphrasis ────────────────────────────────
const VERB_PHRASE = /\b(acab[oa]\s+de|empez[oa]\s+a|comenz[oa]\s+a|dej[oa]\s+de|suel[oe]\s+|volv[ioí]\s+a|sigo\s+|llev[oa]\s+\w+ando|llev[oa]\s+\w+endo|está[ns]?\s+a punto de|estoy\s+por|ponerse\s+a|echarse\s+a|meterse\s+a|ir\s+a\s+\w+ar|ir\s+a\s+\w+er|ir\s+a\s+\w+ir)\b/i;

// ── Reported speech ──────────────────────────────────────────
const REPORTED_SPEECH = /\b(dijo que|dije que|dijeron que|contó que|explicó que|comentó que|afirmó que|aseguró que|preguntó (si|qué|cómo|dónde|cuándo|por qué)|respondió que|añadió que|mencionó que|me dijo|le dije|nos dijo|según (él|ella|ellos))\b/i;

// ═══════════════════════════════════════════════════════════════
// RECLASSIFICATION
// ═══════════════════════════════════════════════════════════════

function reclassify(card) {
  const t = card.target;
  const e = card.english;
  const old = card.grammarNode;

  // ── Old node-01 (present tense, 470 cards) ─────────────
  // Split into: node-01 (regular), node-02 (irregular), node-07 (descriptions), node-08 (expressions)
  if (old === 'node-01') {
    if (isExpression(t, e)) return 'node-08';
    if (isDescription(t, e)) return 'node-07';
    if (hasIrregularPresentFocus(t)) return 'node-02';
    return 'node-01'; // regular present (default)
  }

  // ── Old node-02 (ser/estar, 469) → new node-03 ────────
  if (old === 'node-02') return 'node-03';

  // ── Old node-03 (questions, 470) → new node-04 ────────
  if (old === 'node-03') return 'node-04';

  // ── Old node-04 (articles/gender, 468) → new node-05 ──
  if (old === 'node-04') return 'node-05';

  // ── Old node-05 (gustar, 300) → new node-06 ───────────
  if (old === 'node-05') return 'node-06';

  // ── Old node-06 (past tense, 905) → split 09/10 ───────
  // node-09 = regular preterite, node-10 = irregular preterite
  if (old === 'node-06') {
    if (IRREG_PRETERITE.test(t)) return 'node-10';
    return 'node-09';
  }

  // ── Old node-07 (imperfect, 554) → split 11/12 ────────
  if (old === 'node-07') {
    if (isPastContrast(t)) return 'node-12';
    return 'node-11';
  }

  // ── Old node-08 (reflexive, 300) → new node-13 ────────
  if (old === 'node-08') return 'node-13';

  // ── Old node-09 (prepositions, 250) → new node-14 ─────
  if (old === 'node-09') return 'node-14';

  // ── Old node-10 (object pronouns, 698) → new node-15 ──
  if (old === 'node-10') return 'node-15';

  // ── Old node-11 (subjunctive, 430) → new node-16 ──────
  if (old === 'node-11') return 'node-16';

  // ── Old node-12 (imperative, 300) → new node-17 ───────
  if (old === 'node-12') return 'node-17';

  // ── Old node-13 (conditional, 300) → new node-18 ──────
  if (old === 'node-13') return 'node-18';

  // ── Old node-14 (future/compound, 700) → split 19/21 ──
  if (old === 'node-14') {
    if (COMPOUND_TENSE.test(t)) return 'node-21';
    if (FUTURE_FORMS.test(t) || FUTURE_IRREG.test(t)) return 'node-19';
    // English clues
    if (/\b(will|shall|going to)\b/i.test(e)) return 'node-19';
    if (/\b(had\s+(been|done|already|never|just)|(have|has)\s+(been|already|never|just))\b/i.test(e)) return 'node-21';
    // Default: compound if it has participle, else future
    return 'node-19';
  }

  // ── Old node-15 (relative clauses, 388) → new node-20 ─
  if (old === 'node-15') return 'node-20';

  // ── Old node-16 (impf subjunctive, 300) → new node-22 ─
  if (old === 'node-16') return 'node-22';

  // ── Old node-17 (complex conditionals, 233) → new 23 ──
  if (old === 'node-17') return 'node-23';

  // ── Old node-18 (passive, 219) → new node-24 ──────────
  if (old === 'node-18') return 'node-24';

  // ── Old node-19 (connectors, 218) → new node-25 ───────
  if (old === 'node-19') return 'node-25';

  // ── Old node-20 (mixed advanced, 114) → distribute ─────
  if (old === 'node-20') {
    if (VERB_PHRASE.test(t)) return 'node-26';
    if (REPORTED_SPEECH.test(t)) return 'node-27';
    return 'node-35'; // C2 mixed mastery
  }

  // ── Old node-21 (subj nuances, 42) → new node-28 ──────
  if (old === 'node-21') return 'node-28';

  // ── Old node-22 (verb phrases, 95) → new node-26 ──────
  if (old === 'node-22') return 'node-26';

  // ── Old node-23 (reported speech, 77) → new node-27 ───
  if (old === 'node-23') return 'node-27';

  // ── Old node-24 (register, 78) → new node-29 ──────────
  if (old === 'node-24') return 'node-29';

  // ── Old node-25 (idiomatic, 75) → new node-30 ─────────
  if (old === 'node-25') return 'node-30';

  // ── Old node-26 (complex syntax, 60) → new node-31 ────
  if (old === 'node-26') return 'node-31';

  console.warn('Unmapped card:', card.id, old);
  return old;
}

// Apply reclassification
for (const card of deck) {
  card.grammarNode = reclassify(card);
}

// ─── Report initial distribution ─────────────────────────────
console.log('\n=== After reclassification (before trimming) ===');
let dist = {};
for (const c of deck) dist[c.grammarNode] = (dist[c.grammarNode] || 0) + 1;
Object.entries(dist).sort().forEach(([n, c]) => {
  const target = TARGETS[n] || '??';
  const diff = c - target;
  const mark = diff > 20 ? ` ⬆ OVER by ${diff}` : diff < -20 ? ` ⬇ UNDER by ${Math.abs(diff)}` : ' ✓';
  console.log(`  ${n}: ${c} (target ${target})${mark}`);
});

// ═══════════════════════════════════════════════════════════════
// REDISTRIBUTION: Fill under-target nodes from over-target nodes
// ═══════════════════════════════════════════════════════════════

function redistribute() {
  // Track cards already moved so we don't double-move
  const movedIds = new Set();

  // Helper: get current counts from deck (live)
  function getCounts() {
    const counts = {};
    for (const c of deck) counts[c.grammarNode] = (counts[c.grammarNode] || 0) + 1;
    return counts;
  }

  // Helper: get over-target cards from a node (excluding already-moved)
  function getOverflowCards(node) {
    const target = TARGETS[node] || 0;
    const cards = deck.filter(c => c.grammarNode === node && !movedIds.has(c.id));
    const overflow = cards.length - target;
    return { cards, overflow };
  }

  // ── Fill C2 nodes from over-target sources ──────────────────
  const c2Sinks = [
    { node: 'node-32', prefer: /\b(historia|cuento|novela|poema|narr|literari|escrit|autor|obra|personaje|relato|capítulo|lectur|traduc|publicar|editorial|pasado|remoto|antiguo|clásic)\b/i },
    { node: 'node-33', prefer: /\b(estudi|investig|análisis|conclusi|hipótesis|teoría|evidenci|argument|metodolog|resultado|dato|estadístic|científic|universid|profesor|tesis|ensayo|académic|formal|informe|abstract)\b/i },
    { node: 'node-34', prefer: /\b(cultura|tradici|costumbr|festival|celebr|region|local|típic|folklor|pueblo|herenci|identid|sociedad|comunid|generaci|ancestr|refrán|dicho|modismo)\b/i },
  ];

  for (const sink of c2Sinks) {
    const counts = getCounts();
    const current = counts[sink.node] || 0;
    const target = TARGETS[sink.node];
    let needed = target - current;
    if (needed <= 0) continue;

    // Find best sources (most overflow)
    const sources = Object.entries(counts)
      .map(([n, cnt]) => ({ node: n, overflow: cnt - (TARGETS[n] || 0) }))
      .filter(x => x.overflow > 40)
      .sort((a, b) => b.overflow - a.overflow);

    for (const source of sources) {
      if (needed <= 0) break;
      const { cards: srcCards, overflow } = getOverflowCards(source.node);
      if (overflow <= 20) continue;

      // Score: prefer content match, then longer sentences
      const scored = srcCards
        .filter(c => c.target.split(/\s+/).length >= 8)
        .map(c => ({
          card: c,
          score: (sink.prefer.test(c.target + ' ' + c.english) ? 10 : 0) + c.target.split(/\s+/).length * 0.3
        }));
      scored.sort((a, b) => b.score - a.score);

      const toMove = Math.min(needed, Math.floor(overflow * 0.3));
      let moved = 0;
      for (const s of scored) {
        if (moved >= toMove) break;
        s.card.grammarNode = sink.node;
        movedIds.add(s.card.id);
        moved++;
      }
      needed -= moved;
      if (moved > 0) console.log(`  Redistributed ${moved} cards: ${source.node} → ${sink.node}`);
    }
  }

  // ── Fill C1 under-target nodes (28, 29, 30, 31) ────────────
  const c1Sinks = ['node-28', 'node-29', 'node-30', 'node-31'];
  for (const sinkNode of c1Sinks) {
    const counts = getCounts();
    const current = counts[sinkNode] || 0;
    const target = TARGETS[sinkNode];
    let needed = target - current;
    if (needed <= 0) continue;

    const sources = Object.entries(counts)
      .map(([n, cnt]) => ({ node: n, overflow: cnt - (TARGETS[n] || 0) }))
      .filter(x => x.overflow > 30)
      .sort((a, b) => b.overflow - a.overflow);

    for (const source of sources) {
      if (needed <= 0) break;
      const { cards: srcCards, overflow } = getOverflowCards(source.node);
      if (overflow <= 10) continue;

      const toMove = Math.min(needed, Math.floor(overflow * 0.2));
      const sorted = [...srcCards]
        .filter(c => c.target.split(/\s+/).length >= 7)
        .sort((a, b) => b.target.split(/\s+/).length - a.target.split(/\s+/).length);

      let moved = 0;
      for (const card of sorted) {
        if (moved >= toMove) break;
        card.grammarNode = sinkNode;
        movedIds.add(card.id);
        moved++;
      }
      needed -= moved;
      if (moved > 0) console.log(`  Redistributed ${moved} cards: ${source.node} → ${sinkNode}`);
    }
  }

  // ── Fill node-07 (descriptions) and node-08 (expressions) ──
  const a1Sinks = [
    { node: 'node-07', detect: isDescription },
    { node: 'node-08', detect: isExpression },
  ];
  for (const sink of a1Sinks) {
    const counts = getCounts();
    const current = counts[sink.node] || 0;
    const target = TARGETS[sink.node];
    let needed = target - current;
    if (needed <= 0) continue;

    const overSources = ['node-03', 'node-04', 'node-05', 'node-06', 'node-09', 'node-11'];
    for (const src of overSources) {
      if (needed <= 0) break;
      const { cards: srcCards, overflow } = getOverflowCards(src);
      if (overflow <= 10) continue;

      const matched = srcCards.filter(c => sink.detect(c.target, c.english));
      const toMove = Math.min(needed, matched.length, Math.floor(overflow * 0.3));
      let moved = 0;
      for (const card of matched) {
        if (moved >= toMove) break;
        card.grammarNode = sink.node;
        movedIds.add(card.id);
        moved++;
      }
      needed -= moved;
      if (moved > 0) console.log(`  Redistributed ${moved} cards: ${src} → ${sink.node} (content match)`);
    }
  }
}

console.log('\n--- Redistribution ---');
redistribute();

// ─── Report after redistribution ─────────────────────────────
console.log('\n=== After redistribution (before trimming) ===');
dist = {};
for (const c of deck) dist[c.grammarNode] = (dist[c.grammarNode] || 0) + 1;
Object.entries(dist).sort().forEach(([n, c]) => {
  const target = TARGETS[n] || '??';
  const diff = c - target;
  const mark = diff > 20 ? ` ⬆ OVER by ${diff}` : diff < -20 ? ` ⬇ -${Math.abs(diff)}` : ' ✓';
  console.log(`  ${n}: ${c} (target ${target})${mark}`);
});

// ═══════════════════════════════════════════════════════════════
// TRIM over-target nodes (keep best by quality score)
// ═══════════════════════════════════════════════════════════════

function scoreCard(c) {
  let score = 0;
  if (c.grammar) score += 3;
  if (c.tags && c.tags.length >= 2) score += 1;
  const words = c.target.split(/\s+/).length;
  if (words >= 5 && words <= 10) score += 1;
  if (words >= 3 && words <= 12) score += 0.5;
  score += Math.random() * 0.5;
  return score;
}

for (const [node, target] of Object.entries(TARGETS)) {
  const nodeCards = deck.filter(c => c.grammarNode === node);
  if (nodeCards.length <= target) continue;

  const scored = nodeCards.map(c => ({ card: c, score: scoreCard(c) }));
  scored.sort((a, b) => b.score - a.score);
  const keepIds = new Set(scored.slice(0, target).map(s => s.card.id));
  const before = deck.length;
  deck = deck.filter(c => c.grammarNode !== node || keepIds.has(c.id));
  console.log(`Trimmed ${node}: ${nodeCards.length} → ${target} (removed ${before - deck.length})`);
}

// ═══════════════════════════════════════════════════════════════
// DEDUPLICATION
// ═══════════════════════════════════════════════════════════════
const seen = new Set();
const beforeDedup = deck.length;
deck = deck.filter(c => {
  const key = c.target.toLowerCase().trim();
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});
if (beforeDedup !== deck.length) {
  console.log(`Deduplicated: removed ${beforeDedup - deck.length} duplicates`);
}

// ═══════════════════════════════════════════════════════════════
// Remove too-long cards (>14 words)
// ═══════════════════════════════════════════════════════════════
const tooLong = deck.filter(c => c.target.split(/\s+/).length > 14);
if (tooLong.length > 0) {
  console.log(`\nRemoved ${tooLong.length} cards over 14-word limit`);
  const longIds = new Set(tooLong.map(c => c.id));
  deck = deck.filter(c => !longIds.has(c.id));
}

// ═══════════════════════════════════════════════════════════════
// GOAL TAG BALANCING
// ═══════════════════════════════════════════════════════════════
const travelWords = /\b(viaj|hotel|aeropuerto|avion|avión|vuelo|playa|maleta|reserv|turismo|turista|billete|equipaje|destino|tren|autobús|estación|taxi|metro|ciudad|país|montaña|museo|restaurante|comida|comer|cenar|almorzar|plato|menú|menu|cuenta|propina|tienda|comprar|mercado|precio|calle|mapa|coche|conducir|volar|llegar|salir|caminar|lejos|cerca|norte|sur|centro|parque|jardín|río|lago|mar|vacacion|feriado|ruta|guía|hostal|costa|isla|pasaporte|aduana|barco|parad|lugar|clima|sol|lluvia|frío|calor|nieve|puente|bosque|desierto)\b/i;
const workWords = /\b(trabaj|empresa|oficin|jefe|emplead|reunión|proyecto|informe|contrato|salario|sueldo|horario|equipo|colega|negoci|client|presupuest|plazo|gerente|director|profesión|carrera|experiencia|presentación|conferencia|correo|email|documento|tecnolog|software|sistema|problema|decidir|entrevista|currículum|puesto|departamento|sector|industria|certificad|diploma|título|responsabilid|agenda|computador|ordenador|impresora|informática|productiv|eficien|inversión|beneficio|resultado|objetivo)\b/i;
const familyWords = /\b(famili|hijo|hija|padre|madre|hermano|hermana|abuel|tío|tía|primo|prima|sobrin|cuñad|suegr|nieto|nieta|bebé|niño|niña|esposo|esposa|marido|pareja|novi|boda|hogar|casa|cocina|mascota|perro|gato|vecin|colegio|escuela|educación|crianz|cuidar|enseñar|jugar|celebr|navidad|cumpleaños|fiesta|tradición|mamá|papá|amor|querer|sentir|emoción|feliz|triste|preocup|ayudar|vida|recuerdo|foto|historia|dormir|despertar|lavar|limpiar|cocinar|beber|cantar|bailar|reír|llorar|abrazar|besar|extrañar|perdonar)\b/i;

let tagsFixed = 0;
for (const c of deck) {
  if (!c.tags || c.tags.length === 0) c.tags = ['general'];
  if (c.tags.length >= 2) continue;

  const text = (c.target + ' ' + c.english).toLowerCase();
  const candidates = [];
  if (travelWords.test(text) && !c.tags.includes('travel')) candidates.push('travel');
  if (workWords.test(text) && !c.tags.includes('work')) candidates.push('work');
  if (familyWords.test(text) && !c.tags.includes('family')) candidates.push('family');
  if (!c.tags.includes('general')) candidates.push('general');

  if (candidates.length > 0) {
    c.tags.push(candidates[0]);
    tagsFixed++;
  }
}
console.log(`Fixed tags on ${tagsFixed} single-tag cards`);

// ═══════════════════════════════════════════════════════════════
// SORT & RE-SEQUENCE
// ═══════════════════════════════════════════════════════════════
const nodeOrder = (n) => {
  const m = n.match(/node-(\d+)/);
  return m ? parseInt(m[1]) : 999;
};
deck.sort((a, b) => nodeOrder(a.grammarNode) - nodeOrder(b.grammarNode));

for (let i = 0; i < deck.length; i++) {
  deck[i].id = i + 1;
  deck[i].audio = `es-${i + 1}.mp3`;
}

// ═══════════════════════════════════════════════════════════════
// FINAL REPORT
// ═══════════════════════════════════════════════════════════════
console.log('\n══════════════════════════════════════════');
console.log('         FINAL DISTRIBUTION');
console.log('══════════════════════════════════════════');
const finalDist = {};
for (const c of deck) finalDist[c.grammarNode] = (finalDist[c.grammarNode] || 0) + 1;
let totalCards = 0;
let underTarget = [];
Object.entries(finalDist).sort().forEach(([n, c]) => {
  const target = TARGETS[n];
  const diff = c - target;
  const pct = Math.round(c / target * 100);
  let mark = '';
  if (diff > 5) mark = ` ⬆ +${diff}`;
  else if (diff < -10) { mark = ` ⬇ NEEDS +${Math.abs(diff)}`; underTarget.push({ node: n, need: Math.abs(diff) }); }
  else mark = ' ✓';
  console.log(`  ${n}: ${c}/${target} (${pct}%)${mark}`);
  totalCards += c;
});

const goalStats = { general: 0, travel: 0, work: 0, family: 0 };
for (const c of deck) for (const t of c.tags) if (goalStats[t] !== undefined) goalStats[t]++;
console.log('\nGoal tags:');
Object.entries(goalStats).forEach(([g, c]) =>
  console.log(`  ${g}: ${c} (${Math.round(c / deck.length * 100)}%)`)
);

const singleTag = deck.filter(c => c.tags.length === 1).length;
console.log('\nSingle-tag remaining:', singleTag);
console.log('Total cards:', totalCards);

if (underTarget.length > 0) {
  const totalNeed = underTarget.reduce((s, x) => s + x.need, 0);
  console.log(`\n⚠ ${underTarget.length} nodes under target (need ${totalNeed} more cards):`);
  underTarget.forEach(x => console.log(`  ${x.node}: need +${x.need}`));
}

// Check for empty nodes
for (let i = 1; i <= 35; i++) {
  const nid = `node-${String(i).padStart(2, '0')}`;
  if (!finalDist[nid]) console.log(`⚠ ${nid}: 0 cards — EMPTY`);
}

// ─── Write ────────────────────────────────────────────────────
fs.writeFileSync(DECK_PATH, JSON.stringify(deck, null, 2) + '\n');
console.log('\nWritten to', DECK_PATH);
