/**
 * Generate fix files for all 4 Romance language dictionaries.
 *
 * Categories of issues:
 * 1. Garbled stems (Spanish verb stems used as "English" definitions)
 * 2. Misspelled English (Spanglish approximations)
 * 3. Wrong verb-lemma matching (word linked to wrong verb)
 * 4. Wrong definitions (noun defined as verb, etc.)
 * 5. Context bleed from sentence alignment
 * 6. Formatting issues (whitespace, punctuation)
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const OUTPUT = path.join(ROOT, 'scripts/output');
const norm = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

// ========== CORRECT MEANINGS DATABASE ==========

const ES_CORRECT = {
  // === Garbled stems ===
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
  'borrar': 'to delete, to erase',

  // === Misspelled English ===
  'acumulación': 'accumulation',
  'acústica': 'acoustic',
  'adicional': 'additional',
  'adquisitivo': 'acquisitive',
  'alarmante': 'alarming',
  'alérgico': 'allergic',
  'antelación': 'advance notice',
  'antiadherente': 'non-stick',
  'aproximadamente': 'approximately',
  'artesanal': 'artisanal, handcrafted',
  'ártico': 'arctic',
  'asimismo': 'likewise, also',
  'atentamente': 'attentively, sincerely',
  'atletismo': 'athletics',
  'auténtica': 'authentic (f)',
  'auténtico': 'authentic',
  'automáticamente': 'automatically',
  'beneficioso': 'beneficial',
  'bilingüismo': 'bilingualism',
  'biológico': 'biological',
  'biomédica': 'biomedical',
  'botánico': 'botanical',
  'borrosa': 'blurry',
  'bruscamente': 'abruptly',

  // === Non-verb words wrongly defined ===
  'autopista': 'highway, motorway',
  'autopistas': 'highways, motorways',
  'auxiliar': 'auxiliary, assistant',
  'bienestar': 'well-being, welfare',
  'acoso': 'harassment',
  'acera': 'sidewalk',
  'ahorros': 'savings',
  'seres': 'beings, creatures',
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

  // === Words wrongly linked to amar (root: am) ===
  'amable': 'kind, friendly',
  'amables': 'kind, friendly (pl)',
  'amarillo': 'yellow',
  'amazonas': 'Amazon',
  'amazónica': 'Amazonian',
  'ambas': 'both (f)',
  'ambición': 'ambition',
  'ambicioso': 'ambitious',
  'ambiental': 'environmental',
  'ambiente': 'environment, atmosphere',
  'ambivalente': 'ambivalent',
  'ambos': 'both',
  'ambulancia': 'ambulance',
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

  // === Words wrongly linked to caer (root: ca) ===
  'caballo': 'horse',
  'cabe': 'fits (caber)',
  'caben': 'fit (caber)',
  'cabeza': 'head',
  'cabezota': 'stubborn',
  'cabía': 'fit (caber)',
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
  'calcula': 'calculates',
  'calculada': 'calculated',
  'calculo': 'I calculate',
  'calidad': 'quality',
  'cálido': 'warm',
  'caliente': 'hot',
  'calla': 'be quiet',
  'calle': 'street',
  'calles': 'streets',
  'calma': 'calm',
  'calorías': 'calories',
  'caluroso': 'hot, warm',
  'calurosos': 'hot, warm (pl)',
  'calvo': 'bald',
  'cama': 'bed',
  'camarera': 'waitress',
  'camarero': 'waiter',
  'camareros': 'waiters',
  'cambios': 'changes',
  'caminos': 'paths, roads',
  'camisa': 'shirt',
  'camiseta': 't-shirt',
  'camisetas': 't-shirts',
  'campanas': 'bells',
  'campos': 'fields, countryside',
  'canalizamos': 'we channel',
  'canarias': 'Canary Islands',
  'cancela': 'cancels',
  'candidato': 'candidate',
  'candidatos': 'candidates',
  'canela': 'cinnamon',
  'cangrejos': 'crabs',
  'canguro': 'kangaroo, babysitter',
  'canoa': 'canoe',
  'cante': 'singing (flamenco)',
  'caña': 'beer (draft), reed',
  'cañón': 'canyon, cannon',
  'caótica': 'chaotic',
  'capa': 'layer, cape',
  'capaces': 'capable (pl)',
  'capacidad': 'capacity, ability',
  'capital': 'capital',
  'capitán': 'captain',
  'capitulo': 'chapter',
  'capítulos': 'chapters',
  'capoeira': 'capoeira',
  'captó': 'captured, caught',
  'cara': 'face, expensive',
  'carbono': 'carbon',
  'carece': 'lacks',
  'carecemos': 'we lack',
  'caribeñas': 'Caribbean (f pl)',
  'cariñosa': 'affectionate (f)',
  'cariñoso': 'affectionate',
  'carlos': 'Carlos (name)',
  'carmen': 'Carmen (name)',
  'carnaval': 'carnival',
  'carnavales': 'carnivals',
  'carne': 'meat',
  'carné': 'ID card',
  'caro': 'expensive',
  'caros': 'expensive (pl)',
  'carpeta': 'folder',
  'carpetas': 'folders',
  'carril': 'lane',
  'carriles': 'lanes',
  'carrito': 'cart, trolley',
  'carros': 'cars (Lat Am)',
  'carta': 'letter, menu',
  'cartagena': 'Cartagena',
  'cartas': 'letters, cards',
  'cartucho': 'cartridge',
  'catalán': 'Catalan',
  'catálogo': 'catalogue',
  'cataratas': 'waterfalls',
  'catedral': 'cathedral',
  'catedrales': 'cathedrals',
  'catorce': 'fourteen',
  'cautela': 'caution',
  'caza': 'hunting',
  'cazan': 'they hunt',

  // === Words wrongly linked to comer (root: com) ===
  'coma': 'coma, comma',
  'combustibles': 'fuels',
  'comedor': 'dining room',
  'comercial': 'commercial',
  'comercio': 'commerce, trade',
  'comercios': 'shops, businesses',
  'comete': 'commits',
  'cómics': 'comics',
  'comida': 'food, meal',
  'comienza': 'begins',
  'comienzo': 'beginning',
  'comisaría': 'police station',
  'como': 'like, as',
  'cómo': 'how',
  'cómoda': 'comfortable (f)',
  'cómodas': 'comfortable (f pl)',
  'cómodos': 'comfortable (pl)',
  'comoquiera': 'however',
  'companero': 'companion',
  'compañera': 'companion (f)',
  'compañeros': 'companions',
  'comparte': 'shares',
  'compensa': 'compensates',
  'compensaba': 'compensated',
  'compiten': 'they compete',
  'complace': 'pleases',
  'complejo': 'complex',
  'complicada': 'complicated (f)',
  'común': 'common',
  'comunidad': 'community',
  'comunión': 'communion',

  // === Words wrongly linked to leer (root: le) ===
  'leal': 'loyal',
  'lecciones': 'lessons',
  'leche': 'milk',
  'lechuga': 'lettuce',
  'lechugas': 'lettuces',
  'lectura': 'reading',
  'legal': 'legal',
  'legales': 'legal (pl)',
  'legua': 'league (distance)',
  'legumbres': 'legumes, pulses',
  'lejos': 'far',
  'lenguaje': 'language (system)',
  'lenguajes': 'languages',
  'lenguas': 'languages, tongues',
  'lenta': 'slow (f)',
  'lentejas': 'lentils',
  'lento': 'slow',
  'les': 'to them',
  'lesioné': 'I injured',
  'lesiones': 'injuries',
  'lesionó': 'injured',
  'letra': 'letter (character)',
  'letras': 'letters',
  'levante': 'Levante (region)',
  'ley': 'law',
  'leyes': 'laws',

  // === Words wrongly linked to huir (root: hu) ===
  'huecos': 'gaps, holes',
  'huele': 'smells',
  'huelen': 'they smell',
  'huelga': 'strike',
  'huerto': 'orchard, garden',
  'hueso': 'bone',
  'huevo': 'egg',
  'huevos': 'eggs',
  'humana': 'human (f)',
  'humanidad': 'humanity',
  'humano': 'human',
  'humanos': 'humans',
  'humeante': 'steaming',
  'humedales': 'wetlands',
  'húmedas': 'humid (f pl)',
  'huracán': 'hurricane',

  // === Words wrongly linked to crear (root: cre) ===
  'creativa': 'creative (f)',
  'creativo': 'creative',
  'crédito': 'credit',
  'creerían': 'they would believe',
  'creerías': 'you would believe',
  'creía': 'believed',
  'creíble': 'credible',
  'creído': 'believed, arrogant',
  'crema': 'cream',
  'creyó': 'believed',

  // Whitespace
  'íes': 'letters',
};

const IT_CORRECT = {
  // === Wrong meanings ===
  'nuotatore': 'swimmer',
  'nutrienti': 'nutrients',
  'parmigiana': 'Parmigiana (eggplant dish)',
  'programmatore': 'programmer',
  'rivestito': 'covered, coated',
  'spinse': 'pushed (past tense)',

  // === Words wrongly linked to stare (root: sta) – need to check ===
  'stadio': 'stadium',
  'stagione': 'season',
  'stabile': 'stable',

  // === Words wrongly linked to agire (root: agi) ===
  'agenzia': 'agency',
  'aggiornati': 'updated',
  'aggiunta': 'addition',
  'aggiunto': 'added',
  'aggravato': 'worsened',

  // === Words wrongly linked to amare (root: ama) ===
  'amaro': 'bitter',

  // === Words wrongly linked to dare (root: da) ===
  'dall': 'from the',
  'danneggiata': 'damaged (f)',
  'danneggiati': 'damaged (pl)',

  // === Words wrongly linked to dire (root: di) ===
  'dettagli': 'details',
  'di': 'of, from',

  // === Words wrongly linked to fare (root: fa) ===
  'faccia': 'face',

  // === Words wrongly linked to osare (root: osa) ===
  'oscuro': 'dark, obscure',
  'ospedale': 'hospital',

  // === Words wrongly linked to unire (root: uni) ===
  'undici': 'eleven',
};

const FR_CORRECT = {
  // === Wrong meanings ===
  'allusion': 'allusion, reference',
  'collaboration': 'collaboration, cooperation',
  'convergence': 'convergence',
  'camping': 'campsite, camping',
  'excuse': 'excuse, apology',
  'fatigue': 'fatigue, tiredness',
  'impatience': 'impatience',
  'intervention': 'intervention, speech',
  'parent': 'parent, relative',
  'rat': 'rat',
  'regret': 'regret',
  'vote': 'vote',
  'invitations': 'invitations',
  'modifications': 'modifications, changes',
  'variables': 'variable (adj/n)',

  // === Context bleed ===
  'combien': 'how much, how many',
};

const PT_CORRECT = {
  // PT has fewer issues – mostly clean
};

// ========== GENERATE FIX FILES ==========

function generateFixes(lang, correctMap) {
  const entries = JSON.parse(fs.readFileSync(path.join(OUTPUT, `${lang}-dict-entries.json`)));
  const fixes = [];

  for (const entry of entries) {
    const { word, en, pos, ipa } = entry;

    if (correctMap[word] !== undefined) {
      const fixed = correctMap[word];
      if (fixed !== en && fixed !== en.replace(/\s*\(\w+\)\s*$/, '').trim()) {
        // Check if current definition is actually wrong
        const currentClean = en.replace(/\s*\(\w+\)\s*$/, '').trim();
        if (currentClean !== fixed) {
          let issue = 'wrong definition';
          if (/^[a-záéíóúüñ]+$/i.test(en.trim()) && en.trim().length < 12) {
            issue = 'garbled stem (not English)';
          } else if (en.includes('(caer)') || en.includes('(amar)') || en.includes('(comer)') ||
                     en.includes('(leer)') || en.includes('(huir)') || en.includes('(crear)') ||
                     en.includes('(stare)') || en.includes('(agire)') || en.includes('(amare)') ||
                     en.includes('(dare)') || en.includes('(dire)') || en.includes('(fare)') ||
                     en.includes('(osare)') || en.includes('(unire)')) {
            issue = 'wrong verb-lemma match';
          } else if (en.includes(', after') || en.includes('over, ') || en === 'to stick' || en === 'to suit') {
            issue = 'context bleed from sentence alignment';
          }
          fixes.push({ word, current_en: en, fixed_en: fixed, issue });
        }
      }
    }
  }

  return fixes;
}

// Generate all fix files
const allResults = {};
for (const [lang, correctMap] of [['es', ES_CORRECT], ['it', IT_CORRECT], ['fr', FR_CORRECT], ['pt', PT_CORRECT]]) {
  const entries = JSON.parse(fs.readFileSync(path.join(OUTPUT, `${lang}-dict-entries.json`)));
  const fixes = generateFixes(lang, correctMap);

  allResults[lang] = { total: entries.length, flagged: fixes.length };

  const outPath = path.join(OUTPUT, `${lang}-dict-fixes.json`);
  fs.writeFileSync(outPath, JSON.stringify(fixes, null, 2));
  console.log(`${lang.toUpperCase()}: ${entries.length} total entries, ${fixes.length} fixes written to ${path.basename(outPath)}`);

  // Show worst examples
  const byIssue = {};
  for (const f of fixes) {
    if (!byIssue[f.issue]) byIssue[f.issue] = [];
    byIssue[f.issue].push(f);
  }
  for (const [issue, items] of Object.entries(byIssue)) {
    console.log(`  ${issue}: ${items.length}`);
    for (const item of items.slice(0, 3)) {
      console.log(`    ${item.word}: "${item.current_en}" → "${item.fixed_en}"`);
    }
  }
}
