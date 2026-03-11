/**
 * reclassify-italian-35.cjs
 *
 * Migrates the Italian deck from OLD 26-node structure to NEW 35-node structure.
 * Content-based classification with Italian-specific grammar patterns.
 */

const fs = require('fs');
const path = require('path');

const DECK_PATH = path.join(__dirname, '..', 'src', 'data', 'italian', 'deck.json');
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
// CONTENT DETECTION PATTERNS (Italian)
// ═══════════════════════════════════════════════════════════════

// ── Expressions / greetings ──────────────────────────────────
// Short fixed phrases, greetings, numbers, time, weather
function isExpression(t, e) {
  const words = t.split(/\s+/).length;
  // Very short sentences are usually expressions
  if (words <= 3) return true;
  // Common Italian greetings and fixed phrases
  if (/^(ciao|buongiorno|buonasera|buonanotte|arrivederci|grazie|prego|scusa|scusi|sì|no|per favore|mi scusi|salve|benvenuto|benvenuta|congratulazioni|salute|attenzione|certo|esatto|perfetto|bravo|brava|benissimo|auguri|in bocca al lupo|crepi|bene|male|così così|magari|ecco|basta|dai|andiamo|forza|d'accordo|va bene|mamma mia|buon appetito|cin cin|a presto|a dopo|a domani|ci vediamo)\b/i.test(t)) return true;
  // Time expressions
  if (/\b(sono le|è l'una|alle|che ora|che ore sono|di mattina|di sera|di pomeriggio|di notte|mezzogiorno|mezzanotte)\b/i.test(t) && words <= 7) return true;
  // Weather
  if (/\b(fa (freddo|caldo|bel tempo|brutto tempo)|c'è (sole|vento|nebbia)|piove|nevica|è nuvoloso|tira vento)\b/i.test(t) && words <= 6) return true;
  // Numbers / counting
  if (/\b(uno|due|tre|quattro|cinque|sei|sette|otto|nove|dieci|venti|trenta|cento|mille)\b/i.test(t) && words <= 5) return true;
  // Fixed social phrases
  if (/\b(come stai|come sta|come va|come ti chiami|mi chiamo|che succede|non ti preoccupare|non c'è problema|che bello|che peccato|buon compleanno|buon natale|buon viaggio|piacere|molto lieto)\b/i.test(t) && words <= 6) return true;
  return false;
}

// ── Descriptions ─────────────────────────────────────────────
// Sentences about describing: c'è/ci sono, colors, sizes, adjectives
function isDescription(t, e) {
  // "c'è" / "ci sono" (there is/are) — strong signal
  if (/\bc'è\b/i.test(t) || /\bci sono\b/i.test(t)) return true;
  // "è/sono + adjective" patterns (description-focused)
  if (/\b(è|sono)\s+(grande|piccol[oa]|bell[oa]|brutt[oa]|alt[oa]|bass[oa]|lung[oa]|cort[oa]|vecchi[oa]|nuov[oa]|pien[oa]|vuot[oa]|modern[oa]|antic[oa]|comod[oa]|elegant[ei]|hermos[oa]|important[ei]|famos[oa]|interessant[ei]|tranquill[oa]|rumoros[oa]|pulit[oa]|sporc[oa]|chiar[oa]|scur[oa]|cald[oa]|fresc[oa]|luminos[oa]|ampi[oa]|strett[oa]|bellissim[oa]|pesant[ei]|legg[ei]r[oa])/i.test(t)) return true;
  // Color descriptions
  if (/\b(rosso|rossa|blu|verde|giallo|gialla|bianco|bianca|nero|nera|grigio|grigia|marrone|rosa|viola|arancione|color[ei])\b/i.test(t) && /\b(è|sono|ha|hanno|porta|indossa)\b/i.test(t)) return true;
  // Physical descriptions of things/places
  if (/\b(ha\s+\w+\s+(stanz[ea]|finestr[ea]|port[ea]|pian[oi]|metr[oi]|abitant|letto|camera)|misura|pesa)\b/i.test(t)) return true;
  // English "there is/are" confirms
  if (/\bthere (is|are)\b/i.test(e) && /\bc'è|ci sono\b/i.test(t)) return true;
  // "Il/La [noun] è [adjective]" - pure description sentences
  if (/^(il|la|lo|l'|i|le|gli|un|una|uno|un'|mio|mia|tuo|tua|suo|sua|nostr[oa]|questo|questa|quel|quella)\s+\w+\s+(è|sono)\s+/i.test(t)) {
    if (/\b(bell[oa]|grande|piccol|alt[oa]|bass[oa]|nuov|vecchi|buon|cattiv|miglior|peggior|più|meno|molto|abbastanza|troppo|così|bellissim|enorm|splendid)/i.test(t)) return true;
  }
  return false;
}

// ── Irregular present verbs ──────────────────────────────────
// Only match when an irregular verb is the MAIN action (not just copula "è")
function hasIrregularPresentFocus(t) {
  // essere — identity/state forms (NOT "è" as copula in descriptions)
  if (/\b(sono|sei|siamo|siete)\b/i.test(t) && !/\b(c'è|ci sono)\b/i.test(t)) return true;
  // avere
  if (/\b(ho|hai|ha|abbiamo|avete|hanno)\b/i.test(t) && !/\b(ho|hai|ha|abbiamo|avete|hanno)\s+\w+(ato|uto|ito|tto|sto|rso|rto|sso|nto|lto)\b/i.test(t)) return true;
  // andare
  if (/\b(vado|vai|va|andiamo|andate|vanno)\b/i.test(t)) return true;
  // fare
  if (/\b(faccio|fai|fa|facciamo|fate|fanno)\b/i.test(t)) return true;
  // dire
  if (/\b(dico|dici|dice|diciamo|dite|dicono)\b/i.test(t)) return true;
  // venire
  if (/\b(vengo|vieni|viene|veniamo|venite|vengono)\b/i.test(t)) return true;
  // potere
  if (/\b(posso|puoi|può|possiamo|potete|possono)\b/i.test(t)) return true;
  // volere
  if (/\b(voglio|vuoi|vuole|vogliamo|volete|vogliono)\b/i.test(t)) return true;
  // sapere
  if (/\b(so|sai|sa|sappiamo|sapete|sanno)\b/i.test(t)) return true;
  // uscire
  if (/\b(esco|esci|esce|usciamo|uscite|escono)\b/i.test(t)) return true;
  // dare
  if (/\b(do|dai|dà|diamo|date|danno)\b/i.test(t)) return true;
  // stare
  if (/\b(sto|stai|sta|stiamo|state|stanno)\b/i.test(t) && !/\bst(o|ai|a|iamo|ate|anno)\s+(per|bene|male|attent)\b/i.test(t)) return true;
  // bere
  if (/\b(bevo|bevi|beve|beviamo|bevete|bevono)\b/i.test(t)) return true;
  // tenere
  if (/\b(tengo|tieni|tiene|teniamo|tenete|tengono)\b/i.test(t)) return true;
  // rimanere
  if (/\b(rimango|rimani|rimane|rimaniamo|rimanete|rimangono)\b/i.test(t)) return true;
  // salire
  if (/\b(salgo|sali|sale|saliamo|salite|salgono)\b/i.test(t)) return true;
  // scegliere
  if (/\b(scelgo|scegli|sceglie|scegliamo|scegliete|scelgono)\b/i.test(t)) return true;
  // sedere
  if (/\b(siedo|siedi|siede|sediamo|sedete|siedono)\b/i.test(t)) return true;
  // porre
  if (/\b(pongo|poni|pone|poniamo|ponete|pongono)\b/i.test(t)) return true;
  // tradurre
  if (/\b(traduco|traduci|traduce|traduciamo|traducete|traducono)\b/i.test(t)) return true;
  // morire
  if (/\b(muoio|muori|muore|moriamo|morite|muoiono)\b/i.test(t)) return true;
  // dovere
  if (/\b(devo|devi|deve|dobbiamo|dovete|devono)\b/i.test(t)) return true;
  // conoscere (1st person -sco)
  if (/\b(conosco|conosci|conosce|conosciamo|conoscete|conoscono)\b/i.test(t)) return true;
  return false;
}

// ── Irregular passato prossimo participles ───────────────────
const IRREG_PASSATO = /\b(fatto|detto|scritto|visto|letto|preso|messo|aperto|chiuso|rotto|corso|morto|nato|stato|stata|stati|state|venuto|venuta|rimasto|rimasta|sceso|scesa|salito|salita|perso|speso|deciso|acceso|spento|ucciso|offeso|scelto|tradotto|ridotto|prodotto|distrutto|discusso|successo|commesso|permesso|promesso|espresso|compreso|sorpreso)\b/i;

// ── Past contrast markers ────────────────────────────────────
function isPastContrast(t) {
  // Must have contrast keywords AND imperfect or passato prossimo cues
  const hasContrast = /\b(mentre|quando|d'improvviso|all'improvviso|a quel punto|di colpo|improvvisamente|nel frattempo|intanto|quel giorno|quella volta|ma|però)\b/i.test(t);
  // Italian imperfect: -avo/-evo/-ivo endings
  const hasImperfect = /\b\w+(avo|avi|ava|avamo|avate|avano|evo|evi|eva|evamo|evate|evano|ivo|ivi|iva|ivamo|ivate|ivano)\b/.test(t) || /\b(ero|eri|era|eravamo|eravate|erano|avevo|avevi|aveva|avevamo|avevate|avevano)\b/i.test(t);
  // Passato prossimo: auxiliary + participle
  const hasPassato = /\b(ho|hai|ha|abbiamo|avete|hanno|sono|sei|è|siamo|siete)\s+\w+(ato|uto|ito|tto|sto|rso|rto|sso|nto|lto)\b/i.test(t);
  return hasContrast && (hasImperfect || hasPassato);
}

// ── Future vs compound tenses ────────────────────────────────
// Future: -erò, -erai, -erà, -eremo, -erete, -eranno; -irò, -arò, etc.
const FUTURE_FORMS = /\b\w*(erò|erai|erà|eremo|erete|eranno|arò|arai|arà|aremo|arete|aranno|irò|irai|irà|iremo|irete|iranno)\b/;
const FUTURE_IRREG = /\b(sarò|sarai|sarà|saremo|sarete|saranno|avrò|avrai|avrà|avremo|avrete|avranno|andrò|andrai|andrà|andremo|andrete|andranno|farò|farai|farà|faremo|farete|faranno|dirò|dirai|dirà|diremo|direte|diranno|verrò|verrai|verrà|verremo|verrete|verranno|potrò|potrai|potrà|potremo|potrete|potranno|dovrò|dovrai|dovrà|dovremo|dovrete|dovranno|vorrò|vorrai|vorrà|vorremo|vorrete|vorranno|saprò|saprai|saprà|sapremo|saprete|sapranno|terrò|terrai|terrà|terremo|terrete|terranno|rimarrò|rimarrai|rimarrà|rimarremo|rimarrete|rimarranno|vivrò|vivrai|vivrà|vivremo|vivrete|vivranno|vedrò|vedrai|vedrà|vedremo|vedrete|vedranno|berrò|berrai|berrà|berremo|berrete|berranno)\b/i;
// Compound: auxiliary (avere/essere in any tense) + past participle
const COMPOUND_TENSE = /\b(ho|hai|ha|abbiamo|avete|hanno|aveva|avevi|avevamo|avevate|avevano|avrò|avrai|avrà|avremo|avrete|avranno|avrei|avresti|avrebbe|avremmo|avreste|avrebbero|sono|sei|è|siamo|siete|ero|eri|era|eravamo|eravate|erano|sarò|sarai|sarà|saremo|sarete|saranno)\s+\w+(ato|uto|ito|tto|sto|rso|rto|sso|nto|lto)\b/i;

// ── Verb phrase / periphrasis (Italian) ──────────────────────
const VERB_PHRASE = /\b(stare per|mettersi a|metter[smci]i a|finire di|continuare a|smettere di|cominciare a|andare a|tornare a|riuscire a|stare\s+\w+ando|stare\s+\w+endo|essere\s+a punto di|essere\s+sul punto di|avere\s+appena|aver\s+appena)\b/i;

// ── Reported speech (Italian) ────────────────────────────────
const REPORTED_SPEECH = /\b(ha detto che|ho detto che|hanno detto che|ha raccontato che|ha spiegato che|ha commentato che|ha affermato che|ha assicurato che|ha chiesto (se|cosa|come|dove|quando|perché|chi)|ha risposto che|ha aggiunto che|ha menzionato che|mi ha detto|gli ho detto|le ho detto|ci ha detto|secondo (lui|lei|loro)|ha riferito che|ha dichiarato che|mi ha chiesto|gli ha chiesto|le ha chiesto|voleva sapere|diceva che|raccontava che|sosteneva che|affermava che|negava di|a suo dire|stando a quanto)\b/i;


// ═══════════════════════════════════════════════════════════════
// RECLASSIFICATION
// ═══════════════════════════════════════════════════════════════

function reclassify(card) {
  const t = card.target;
  const e = card.english;
  const old = card.grammarNode;

  // ── Old node-01 (present tense, 402 cards) ─────────────
  // Split into: node-01 (regular), node-02 (irregular), node-07 (descriptions), node-08 (expressions)
  if (old === 'node-01') {
    if (isExpression(t, e)) return 'node-08';
    if (isDescription(t, e)) return 'node-07';
    if (hasIrregularPresentFocus(t)) return 'node-02';
    return 'node-01'; // regular present (default)
  }

  // ── Old node-02 (essere vs stare, 209) → new node-03 ──
  if (old === 'node-02') return 'node-03';

  // ── Old node-03 (questions, 193) → new node-04 ─────────
  if (old === 'node-03') return 'node-04';

  // ── Old node-04 (articles & gender, 173) → new node-05 ─
  if (old === 'node-04') return 'node-05';

  // ── Old node-05 (piacere, 159) → new node-06 ──────────
  if (old === 'node-05') return 'node-06';

  // ── Old node-06 (passato prossimo, 135) → split 09/10 ──
  // node-09 = regular passato, node-10 = irregular passato
  if (old === 'node-06') {
    if (IRREG_PASSATO.test(t)) return 'node-10';
    return 'node-09';
  }

  // ── Old node-07 (imperfetto, 105) → split 11/12 ────────
  if (old === 'node-07') {
    if (isPastContrast(t)) return 'node-12';
    return 'node-11';
  }

  // ── Old node-08 (reflexive, 97) → new node-13 ──────────
  if (old === 'node-08') return 'node-13';

  // ── Old node-09 (per vs da, 100) → new node-14 ─────────
  if (old === 'node-09') return 'node-14';

  // ── Old node-10 (object pronouns, 98) → new node-15 ────
  if (old === 'node-10') return 'node-15';

  // ── Old node-11 (congiuntivo presente, 607) → new node-16
  if (old === 'node-11') return 'node-16';

  // ── Old node-12 (imperativo, 399) → new node-17 ────────
  if (old === 'node-12') return 'node-17';

  // ── Old node-13 (condizionale, 362) → new node-18 ──────
  if (old === 'node-13') return 'node-18';

  // ── Old node-14 (futuro/compound, 429) → split 19/21 ───
  if (old === 'node-14') {
    if (COMPOUND_TENSE.test(t)) return 'node-21';
    if (FUTURE_FORMS.test(t) || FUTURE_IRREG.test(t)) return 'node-19';
    // English clues
    if (/\b(will|shall|going to)\b/i.test(e)) return 'node-19';
    if (/\b(had\s+(been|done|already|never|just)|(have|has)\s+(been|already|never|just))\b/i.test(e)) return 'node-21';
    // Default: future
    return 'node-19';
  }

  // ── Old node-15 (relative clauses, 392) → new node-20 ──
  if (old === 'node-15') return 'node-20';

  // ── Old node-16 (congiuntivo imperfetto, 354) → new node-22
  if (old === 'node-16') return 'node-22';

  // ── Old node-17 (complex conditionals, 225) → new node-23
  if (old === 'node-17') return 'node-23';

  // ── Old node-18 (passive, 250) → new node-24 ──────────
  if (old === 'node-18') return 'node-24';

  // ── Old node-19 (advanced connectors, 265) → new node-25
  if (old === 'node-19') return 'node-25';

  // ── Old node-20 (mixed advanced, 163) → distribute ─────
  if (old === 'node-20') {
    if (VERB_PHRASE.test(t)) return 'node-26';
    if (REPORTED_SPEECH.test(t)) return 'node-27';
    return 'node-35'; // C2 mixed mastery
  }

  // ── Old node-21 (subjunctive nuances, 119) → new node-28
  if (old === 'node-21') return 'node-28';

  // ── Old node-22 (verb phrases, 117) → new node-26 ──────
  if (old === 'node-22') return 'node-26';

  // ── Old node-23 (reported speech, 113) → new node-27 ───
  if (old === 'node-23') return 'node-27';

  // ── Old node-24 (register, 105) → new node-29 ──────────
  if (old === 'node-24') return 'node-29';

  // ── Old node-25 (idiomatic, 103) → new node-30 ─────────
  if (old === 'node-25') return 'node-30';

  // ── Old node-26 (complex syntax, 109) → new node-31 ────
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
  const mark = diff > 20 ? ` >> OVER by ${diff}` : diff < -20 ? ` << UNDER by ${Math.abs(diff)}` : ' OK';
  console.log(`  ${n}: ${c} (target ${target})${mark}`);
});

// ═══════════════════════════════════════════════════════════════
// REDISTRIBUTION: Fill under-target nodes from over-target nodes
// ═══════════════════════════════════════════════════════════════

function redistribute() {
  // CRITICAL: Track cards already moved so we NEVER double-move
  const movedIds = new Set();

  // Helper: get current counts from deck (live, recalculated each call)
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

  // ── Fill C2 nodes (32, 33, 34) from over-target sources ────
  const c2Sinks = [
    { node: 'node-32', prefer: /\b(storia|racconto|romanzo|poema|narr|letterari|scrittore|autore|opera|personaggio|racconto|capitolo|lettura|traduz|pubblicare|editoriale|passato|remoto|antico|classico|fiaba|novella|lirica|prosa|verso|poesia|genere|trama|eroe|eroina)\b/i },
    { node: 'node-33', prefer: /\b(studi|ricerca|analisi|conclusion|ipotesi|teoria|evidenza|argomento|metodologia|risultato|dato|statistic|scientifico|università|professore|tesi|saggio|accademic|formale|relazione|abstract|convegno|dottorato|laurea|esame|docente|ricercatore|bibliograf)\b/i },
    { node: 'node-34', prefer: /\b(cultura|tradizion|costum|festival|celebr|region|locale|tipic|folclor|paese|eredità|identità|società|comunità|generazion|ancestral|proverbio|detto|modi di dire|cucina|gastronomia|artigianato|folklore|sagra|patrono|dialetto|usanza)\b/i },
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
      if (moved > 0) console.log(`  Redistributed ${moved} cards: ${source.node} -> ${sink.node}`);
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
      if (moved > 0) console.log(`  Redistributed ${moved} cards: ${source.node} -> ${sinkNode}`);
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
      if (moved > 0) console.log(`  Redistributed ${moved} cards: ${src} -> ${sink.node} (content match)`);
    }
  }

  // ── Fill remaining under-target A1/A2 nodes ─────────────────
  const a1a2Sinks = ['node-01', 'node-02', 'node-04', 'node-05', 'node-09', 'node-13', 'node-14', 'node-15'];
  for (const sinkNode of a1a2Sinks) {
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
        .sort((a, b) => a.target.split(/\s+/).length - b.target.split(/\s+/).length);

      let moved = 0;
      for (const card of sorted) {
        if (moved >= toMove) break;
        card.grammarNode = sinkNode;
        movedIds.add(card.id);
        moved++;
      }
      needed -= moved;
      if (moved > 0) console.log(`  Redistributed ${moved} cards: ${source.node} -> ${sinkNode}`);
    }
  }

  // ── Fill B1/B2 under-target nodes ───────────────────────────
  const b1b2Sinks = ['node-16', 'node-19', 'node-20', 'node-21'];
  for (const sinkNode of b1b2Sinks) {
    const counts = getCounts();
    const current = counts[sinkNode] || 0;
    const target = TARGETS[sinkNode];
    let needed = target - current;
    if (needed <= 0) continue;

    const sources = Object.entries(counts)
      .map(([n, cnt]) => ({ node: n, overflow: cnt - (TARGETS[n] || 0) }))
      .filter(x => x.overflow > 20)
      .sort((a, b) => b.overflow - a.overflow);

    for (const source of sources) {
      if (needed <= 0) break;
      const { cards: srcCards, overflow } = getOverflowCards(source.node);
      if (overflow <= 10) continue;

      const toMove = Math.min(needed, Math.floor(overflow * 0.25));
      const sorted = [...srcCards]
        .sort((a, b) => b.target.split(/\s+/).length - a.target.split(/\s+/).length);

      let moved = 0;
      for (const card of sorted) {
        if (moved >= toMove) break;
        card.grammarNode = sinkNode;
        movedIds.add(card.id);
        moved++;
      }
      needed -= moved;
      if (moved > 0) console.log(`  Redistributed ${moved} cards: ${source.node} -> ${sinkNode}`);
    }
  }

  console.log(`  Total cards moved: ${movedIds.size}`);
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
  const mark = diff > 20 ? ` >> OVER by ${diff}` : diff < -20 ? ` << -${Math.abs(diff)}` : ' OK';
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
  console.log(`Trimmed ${node}: ${nodeCards.length} -> ${target} (removed ${before - deck.length})`);
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
// GOAL TAG BALANCING (Italian keywords)
// ═══════════════════════════════════════════════════════════════
const travelWords = /\b(viagg|hotel|aeroporto|aere[oa]|volo|spiaggia|valigia|prenotaz|turismo|turista|bigliett|bagagli|destinazion|treno|autobus|stazione|taxi|metro|città|paese|montagna|museo|ristorante|cibo|mangiare|cenare|pranzare|piatto|menù|conto|mancia|negozio|comprare|mercato|prezzo|strada|mappa|macchina|guidare|volare|arrivare|partire|camminare|lontano|vicino|nord|sud|centro|parco|giardino|fiume|lago|mare|vacanz|ferie|rotta|guida|ostello|costa|isola|passaporto|dogana|barca|luogo|clima|sole|pioggia|freddo|caldo|neve|ponte|bosco|deserto|albergo|pensione|campeggio|escursion|gita|itinerario|venezia|roma|firenze|napoli|sicilia|toscana|sardegna)\b/i;
const workWords = /\b(lavor|aziend|uffici|capo|impiegat|riunion|progetto|relazion|contratto|stipendio|orario|squadra|colleg[ah]|affar|client|budget|scadenz|direttor|geren|professione|carriera|esperienza|presentazion|conferenza|posta|email|documento|tecnolog|software|sistema|problema|decidere|colloquio|curriculum|posto|dipartimento|settore|industria|certificat|diploma|titolo|responsabilità|agenda|computer|stampante|informatica|produttiv|efficien|investiment|beneficio|risultato|obiettivo|impresa|fabbrica|commerc|economia|finanz|marketing|vendita|acquist|sviluppo|gestione|organizzare)\b/i;
const familyWords = /\b(famigli|figlio|figlia|padre|madre|fratello|sorella|nonno|nonna|zio|zia|cugino|cugina|nipot|cognato|cognata|suocer|bambino|bambina|bebè|neonato|marito|moglie|sposo|sposa|coppia|fidanzat|matrimonio|nozze|casa|cucina|animale|cane|gatto|vicin|scuola|educazion|crescere|curare|insegnare|giocare|celebr|natale|compleanno|festa|tradizion|mamma|papà|amore|volere bene|sentire|emozion|felice|triste|preoccup|aiutare|vita|ricordo|foto|storia|dormire|svegliarsi|lavare|pulire|cucinare|bere|cantare|ballare|ridere|piangere|abbracciare|baciare|mancare|perdonare)\b/i;

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
  deck[i].audio = `it-${i + 1}.mp3`;
}

// ═══════════════════════════════════════════════════════════════
// FINAL REPORT
// ═══════════════════════════════════════════════════════════════
console.log('\n==========================================');
console.log('         FINAL DISTRIBUTION');
console.log('==========================================');
const finalDist = {};
for (const c of deck) finalDist[c.grammarNode] = (finalDist[c.grammarNode] || 0) + 1;
let totalCards = 0;
let underTarget = [];
Object.entries(finalDist).sort().forEach(([n, c]) => {
  const target = TARGETS[n];
  const diff = c - target;
  const pct = Math.round(c / target * 100);
  let mark = '';
  if (diff > 5) mark = ` >> +${diff}`;
  else if (diff < -10) { mark = ` << NEEDS +${Math.abs(diff)}`; underTarget.push({ node: n, need: Math.abs(diff) }); }
  else mark = ' OK';
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
  console.log(`\nWARNING: ${underTarget.length} nodes under target (need ${totalNeed} more cards):`);
  underTarget.forEach(x => console.log(`  ${x.node}: need +${x.need}`));
}

// Check for empty nodes
for (let i = 1; i <= 35; i++) {
  const nid = `node-${String(i).padStart(2, '0')}`;
  if (!finalDist[nid]) console.log(`WARNING: ${nid}: 0 cards -- EMPTY`);
}

// ─── Write ────────────────────────────────────────────────────
fs.writeFileSync(DECK_PATH, JSON.stringify(deck, null, 2) + '\n');
console.log('\nWritten to', DECK_PATH);
