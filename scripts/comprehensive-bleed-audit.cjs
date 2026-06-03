/**
 * Comprehensive audit of ES/IT/FR/PT dictionaries.
 * Detects:
 * 1. Wrong verb-infinitive matching (noun/adj defined as unrelated verb)
 * 2. Context bleed from sentence alignment
 * 3. Garbled/non-English definitions
 * 4. Wrong meanings
 * 5. Wrong POS tags
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const OUTPUT = path.join(ROOT, 'scripts/output');

// ========== SPANISH ==========
function auditSpanish() {
  const entries = JSON.parse(fs.readFileSync(path.join(OUTPUT, 'es-dict-entries.json')));
  const fixes = [];

  // Known correct meanings for commonly mismatched words
  const knownMeanings = {
    // Words wrongly matched to "amar" (to love)
    'amable': { en: 'kind, friendly', pos: 'adj' },
    'amables': { en: 'kind, friendly (pl)', pos: 'adj' },
    'amarillo': { en: 'yellow', pos: 'adj' },
    'amazonas': { en: 'Amazon', pos: 'n' },
    'amazónica': { en: 'Amazonian', pos: 'adj' },
    'ambas': { en: 'both (f)', pos: 'det' },
    'ambición': { en: 'ambition', pos: 'n' },
    'ambicioso': { en: 'ambitious', pos: 'adj' },
    'ambiental': { en: 'environmental', pos: 'adj' },
    'ambiente': { en: 'environment, atmosphere', pos: 'n' },
    'ambivalente': { en: 'ambivalent', pos: 'adj' },
    'ambos': { en: 'both', pos: 'det' },
    'ambulante': { en: 'traveling, itinerant', pos: 'adj' },
    'amenaza': { en: 'threat', pos: 'n' },
    'amenazada': { en: 'threatened', pos: 'adj' },
    'amenazados': { en: 'threatened (pl)', pos: 'adj' },
    'américa': { en: 'America', pos: 'n' },
    'amiga': { en: 'friend (f)', pos: 'n' },
    'amigo': { en: 'friend', pos: 'n' },
    'amigos': { en: 'friends', pos: 'n' },
    'amistades': { en: 'friendships', pos: 'n' },
    'amor': { en: 'love', pos: 'n' },
    'amplia': { en: 'wide, broad', pos: 'adj' },
    'amplía': { en: 'expands, broadens', pos: 'v' },
    'ampliado': { en: 'expanded, broadened', pos: 'adj' },

    // Words wrongly matched to "animar" (to encourage)
    'animal': { en: 'animal', pos: 'n' },
    'animales': { en: 'animals', pos: 'n' },

    // Words wrongly matched to "caer" (to fall)
    'caballo': { en: 'horse', pos: 'n' },
    'cabe': { en: 'fits (caber)', pos: 'v' },
    'caben': { en: 'fit (caber)', pos: 'v' },
    'cabeza': { en: 'head', pos: 'n' },
    'cabezota': { en: 'stubborn', pos: 'adj' },
    'cabía': { en: 'fit (past, caber)', pos: 'v' },
    'cabo': { en: 'end, cape', pos: 'n' },
    'cada': { en: 'each, every', pos: 'det' },
    'cadena': { en: 'chain, channel', pos: 'n' },
    'caduca': { en: 'expired', pos: 'adj' },
    'caducada': { en: 'expired', pos: 'adj' },
    'caja': { en: 'box, cash register', pos: 'n' },
    'cajas': { en: 'boxes', pos: 'n' },
    'cajero': { en: 'ATM, cashier', pos: 'n' },
    'cajeros': { en: 'ATMs, cashiers', pos: 'n' },
    'cala': { en: 'cove, inlet', pos: 'n' },

    // Garbled definitions
    'abordar': { en: 'to board, to approach', pos: 'v' },
    'acampar': { en: 'to camp', pos: 'v' },
    'acera': { en: 'sidewalk', pos: 'n' },
    'acortar': { en: 'to shorten', pos: 'v' },
    'acoso': { en: 'harassment', pos: 'n' },
    'ahorros': { en: 'savings', pos: 'n' },
    'seres': { en: 'beings, creatures', pos: 'n' },
    'aspiradora': { en: 'vacuum cleaner', pos: 'n' },

    // Clearly wrong definitions
    'accidente': { en: 'accident', pos: 'n' },
    'ajedrez': { en: 'chess', pos: 'n' },
    'afirmar': { en: 'to affirm, to state', pos: 'v' },
    'actualizar': { en: 'to update', pos: 'v' },
    'actual': { en: 'current, present', pos: 'adj' },
    'actuales': { en: 'current, present (pl)', pos: 'adj' },
    'actualicé': { en: 'I updated (actualizar)', pos: 'v' },
    'actualicemos': { en: 'let\'s update (actualizar)', pos: 'v' },
    'actualicen': { en: 'update (subj., actualizar)', pos: 'v' },
    'actualices': { en: 'update (subj., actualizar)', pos: 'v' },
    'adaptador': { en: 'adapter', pos: 'n' },
    'aprendizaje': { en: 'learning', pos: 'n' },
    'asistente': { en: 'assistant, attendee', pos: 'n' },
    'asistentes': { en: 'assistants, attendees', pos: 'n' },
    'atacama': { en: 'Atacama', pos: 'n' },
    'andén': { en: 'platform (train)', pos: 'n' },
    'andes': { en: 'Andes', pos: 'n' },
    'andina': { en: 'Andean', pos: 'adj' },
    'alojamiento': { en: 'accommodation', pos: 'n' },
    'almacenar': { en: 'to store', pos: 'v' },
    'ante': { en: 'before, in the face of', pos: 'prep' },
    'aumentar': { en: 'to increase', pos: 'v' },
    'auxiliar': { en: 'auxiliary, assistant', pos: 'adj' },
    'bienestar': { en: 'well-being, welfare', pos: 'n' },
    'autopista': { en: 'highway, motorway', pos: 'n' },
    'autopistas': { en: 'highways, motorways', pos: 'n' },
    'borrar': { en: 'to delete, to erase', pos: 'v' },
    'agendar': { en: 'to schedule', pos: 'v' },
    'agotan': { en: 'exhaust, run out', pos: 'v' },
    'agotar': { en: 'to exhaust, to run out', pos: 'v' },
    'agotaremos': { en: 'we will exhaust', pos: 'v' },
    'agotaron': { en: 'they exhausted', pos: 'v' },
    'atropellar': { en: 'to run over', pos: 'v' },
    'acostar': { en: 'to put to bed, to lie down', pos: 'v' },
    'alarmante': { en: 'alarming', pos: 'adj' },
    'alimentaria': { en: 'food-related, dietary', pos: 'adj' },
    'amanecer': { en: 'dawn, sunrise', pos: 'n' },
  };

  for (const entry of entries) {
    const { word, en, pos, ipa } = entry;

    // Check known corrections
    if (knownMeanings[word]) {
      const correct = knownMeanings[word];
      if (en !== correct.en) {
        fixes.push({
          word,
          current_en: en,
          fixed_en: correct.en,
          issue: `wrong definition: "${en}" should be "${correct.en}"`,
          fixed_pos: correct.pos !== pos ? correct.pos : undefined
        });
        continue;
      }
    }

    // Check for garbled definitions (just the Spanish stem repeated)
    if (/^[a-záéíóúüñ]+$/.test(en.toLowerCase()) && en.length < 15 && !/^(a|an|at|or|no|on|oh|ah|us|up|if|it|is|in|of|to|do|so|go|am|be|he|me|my|we|ad|al|as|hi)$/i.test(en)) {
      // Check if it looks like a truncated Spanish word
      if (!isRealEnglishWord(en.toLowerCase())) {
        fixes.push({
          word,
          current_en: en,
          fixed_en: '???',
          issue: `garbled definition: "${en}" is not English`
        });
      }
    }

    // Check for wrong verb matching – word defined as unrelated verb
    // Pattern: noun/adj/proper-noun with "(verb)" lemma reference that doesn't match
    const lemmaMatch = en.match(/\((\w+)\)$/);
    if (lemmaMatch) {
      const lemma = lemmaMatch[1];
      // Check if the word stem plausibly derives from the lemma
      if (!wordDerivesfromLemma(word, lemma)) {
        fixes.push({
          word,
          current_en: en,
          fixed_en: '???',
          issue: `wrong lemma match: "${word}" wrongly linked to "${lemma}"`
        });
      }
    }

    // Check for verb definitions on clearly non-verb words
    if (/^to /.test(en) && pos === 'n') {
      const lemmaRef = en.match(/\((\w+)\)/);
      if (lemmaRef) {
        const lemma = lemmaRef[1];
        if (!wordDerivesfromLemma(word, lemma)) {
          fixes.push({
            word,
            current_en: en,
            fixed_en: '???',
            issue: `noun with wrong verb definition: linked to "${lemma}"`
          });
        }
      }
    }
  }

  return fixes;
}

// Simple check: does the word share a reasonable prefix with the lemma?
function wordDerivesfromLemma(word, lemma) {
  // Remove verb endings
  const lemmaRoot = lemma.replace(/(ar|er|ir|arse|erse|irse|are|ere|ire|arsi|ersi|irsi)$/, '');
  const wordClean = word.replace(/[áéíóúü]/g, c => 'aeiouu'['áéíóúü'.indexOf(c)]);
  const lemmaClean = lemmaRoot.replace(/[áéíóúü]/g, c => 'aeiouu'['áéíóúü'.indexOf(c)]);

  if (lemmaClean.length < 3) return true; // Too short to judge

  // Word should start with the lemma root (or close)
  return wordClean.startsWith(lemmaClean) || wordClean.startsWith(lemmaClean.slice(0, -1));
}

// Very basic English word check
function isRealEnglishWord(w) {
  const commonEnglish = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'up', 'out', 'off', 'down', 'over', 'under',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
    'do', 'does', 'did', 'will', 'would', 'shall', 'should', 'may', 'might',
    'can', 'could', 'must', 'need', 'dare', 'ought', 'used', 'go', 'come',
    'get', 'make', 'know', 'think', 'take', 'see', 'look', 'find', 'give',
    'tell', 'say', 'ask', 'work', 'seem', 'feel', 'try', 'leave', 'call',
    'keep', 'let', 'begin', 'show', 'hear', 'play', 'run', 'move', 'live',
    'ace', 'art', 'arm', 'ago', 'aid', 'aim', 'air', 'all', 'also',
    'age', 'add', 'ash', 'ate', 'awe', 'axe', 'aye', 'bad', 'bag',
    'ban', 'bar', 'bat', 'bay', 'bed', 'bet', 'big', 'bit', 'bow',
    'box', 'boy', 'bud', 'bug', 'bus', 'buy', 'cab', 'cap', 'car',
    'cat', 'cop', 'cow', 'cry', 'cup', 'cut', 'dad', 'dam', 'day',
    'dew', 'dig', 'dim', 'dip', 'dog', 'dot', 'dry', 'due', 'dug',
    'dye', 'ear', 'eat', 'egg', 'end', 'era', 'eve', 'eye', 'fan',
    'far', 'fat', 'fee', 'few', 'fig', 'fin', 'fit', 'fix', 'fly',
    'fog', 'foe', 'folk', 'fond', 'fool', 'foot', 'ford', 'forest',
    'fox', 'fun', 'fur', 'gag', 'gap', 'gas', 'gem', 'gin', 'god',
    'got', 'gum', 'gun', 'gut', 'guy', 'gym', 'ham', 'hat', 'hay',
    'hen', 'hid', 'him', 'hip', 'hit', 'hog', 'hop', 'hot', 'how',
    'hub', 'hug', 'hut', 'ice', 'ill', 'inn', 'ion', 'its', 'jam',
    'jar', 'jaw', 'jet', 'job', 'jog', 'joy', 'jug', 'key', 'kid',
    'kin', 'kit', 'lab', 'lad', 'lag', 'lap', 'law', 'lay', 'led',
    'leg', 'let', 'lid', 'lie', 'lip', 'lit', 'log', 'lot', 'low',
    'mad', 'man', 'map', 'mat', 'met', 'mid', 'mix', 'mob', 'mod',
    'mom', 'mop', 'mud', 'mug', 'nap', 'net', 'new', 'nil', 'nod',
    'nor', 'not', 'now', 'nut', 'oak', 'odd', 'oil', 'old', 'one',
    'opt', 'ore', 'our', 'out', 'owe', 'owl', 'own', 'pad', 'pan',
    'pat', 'pay', 'pea', 'pen', 'pet', 'pie', 'pig', 'pin', 'pit',
    'pod', 'pop', 'pot', 'pub', 'pun', 'pup', 'put', 'rag', 'ram',
    'ran', 'rat', 'raw', 'ray', 'red', 'rib', 'rid', 'rig', 'rim',
    'rip', 'rob', 'rod', 'rot', 'row', 'rub', 'rug', 'rum', 'run',
    'rut', 'sad', 'sag', 'sat', 'saw', 'say', 'sea', 'set', 'sew',
    'shy', 'sin', 'sip', 'sir', 'sit', 'six', 'ski', 'sky', 'sly',
    'sob', 'sod', 'son', 'sow', 'spa', 'spy', 'sum', 'sun', 'tab',
    'tag', 'tan', 'tap', 'tar', 'tax', 'tea', 'ten', 'the', 'tie',
    'tin', 'tip', 'toe', 'ton', 'too', 'top', 'tot', 'tow', 'toy',
    'try', 'tub', 'tug', 'two', 'urn', 'use', 'van', 'vat', 'vet',
    'via', 'vim', 'vow', 'wad', 'wag', 'war', 'was', 'wax', 'way',
    'web', 'wed', 'wet', 'who', 'why', 'wig', 'win', 'wit', 'woe',
    'wok', 'won', 'woo', 'wow', 'yet', 'you', 'zen', 'zip', 'zoo',
    'reef', 'bass', 'lava', 'solo', 'cola', 'polo', 'salsa', 'tango',
    'delta', 'alpha', 'omega', 'plaza', 'arena', 'fiesta', 'siesta',
    'mesa', 'panda', 'pasta', 'prima', 'flora', 'fauna', 'karma',
    'drama', 'yoga', 'gala', 'ultra', 'extra', 'macro', 'micro',
    'metro', 'retro', 'disco', 'motto', 'tempo', 'lotto',
  ]);
  return commonEnglish.has(w);
}

// ========== RUN FOR ALL LANGUAGES ==========

// For ES, run the detailed audit
const esFixes = auditSpanish();
console.log(`\nES: ${esFixes.length} issues found`);
for (const f of esFixes.slice(0, 30)) {
  console.log(`  ${f.word}: "${f.current_en}" → "${f.fixed_en}" (${f.issue})`);
}
if (esFixes.length > 30) console.log(`  ... and ${esFixes.length - 30} more`);

// Save preliminary results
fs.writeFileSync(path.join(OUTPUT, 'es-preliminary-fixes.json'), JSON.stringify(esFixes, null, 2));
