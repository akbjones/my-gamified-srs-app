/**
 * Generate comprehensive fix files for ES/IT/FR/PT dictionaries.
 * Produces: scripts/output/{es,it,fr,pt}-dict-fixes.json
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const OUTPUT = path.join(ROOT, 'scripts/output');

// ========== SPANISH CORRECTIONS ==========
const ES_FIXES = {
  // --- Garbled stems (truncated Spanish words used as English) ---
  'abordar': { en: 'to board, to approach', issue: 'garbled stem' },
  'acampar': { en: 'to camp', issue: 'garbled stem' },
  'acortar': { en: 'to shorten', issue: 'garbled stem' },
  'acostar': { en: 'to lie down, to go to bed', issue: 'garbled stem' },
  'agendar': { en: 'to schedule', issue: 'garbled stem' },
  'aislar': { en: 'to isolate', issue: 'garbled stem' },
  'almacenar': { en: 'to store', issue: 'garbled stem' },
  'afirmar': { en: 'to affirm, to state', issue: 'garbled stem' },
  'analizar': { en: 'to analyze', issue: 'garbled stem' },
  'anotar': { en: 'to note down', issue: 'garbled stem' },
  'aplazar': { en: 'to postpone', issue: 'garbled stem' },
  'atropellar': { en: 'to run over', issue: 'garbled stem' },
  'aumentar': { en: 'to increase', issue: 'garbled stem' },
  'automatizar': { en: 'to automate', issue: 'garbled stem' },
  'borrar': { en: 'to delete, to erase', issue: 'garbled stem' },
  'actualizar': { en: 'to update', issue: 'garbled stem' },
  'agotar': { en: 'to exhaust, to run out', issue: 'garbled stem' },

  // --- Misspelled English ---
  'acumulación': { en: 'accumulation', issue: 'misspelled English' },
  'acústica': { en: 'acoustic', issue: 'misspelled English' },
  'adicional': { en: 'additional', issue: 'misspelled English' },
  'adquisitivo': { en: 'acquisitive', issue: 'misspelled English' },
  'alarmante': { en: 'alarming', issue: 'misspelled English' },
  'alérgico': { en: 'allergic', issue: 'misspelled English' },
  'antelación': { en: 'advance notice', issue: 'misspelled English' },
  'antiadherente': { en: 'non-stick', issue: 'misspelled English' },
  'aproximadamente': { en: 'approximately', issue: 'misspelled English' },
  'artesanal': { en: 'artisanal, handcrafted', issue: 'misspelled English' },
  'ártico': { en: 'arctic', issue: 'misspelled English' },
  'asimismo': { en: 'likewise, also', issue: 'misspelled English' },
  'atentamente': { en: 'attentively, sincerely', issue: 'misspelled English' },
  'atletismo': { en: 'athletics', issue: 'misspelled English' },
  'auténtica': { en: 'authentic (f)', issue: 'misspelled English' },
  'auténtico': { en: 'authentic', issue: 'misspelled English' },
  'automáticamente': { en: 'automatically', issue: 'misspelled English' },
  'beneficioso': { en: 'beneficial', issue: 'misspelled English' },
  'bilingüismo': { en: 'bilingualism', issue: 'misspelled English' },
  'biológico': { en: 'biological', issue: 'misspelled English' },
  'biomédica': { en: 'biomedical', issue: 'misspelled English' },
  'botánico': { en: 'botanical', issue: 'misspelled English' },
  'borrosa': { en: 'blurry', issue: 'misspelled English' },
  'bruscamente': { en: 'abruptly', issue: 'misspelled English' },

  // --- Wrong definitions (not verb-lemma) ---
  'acera': { en: 'sidewalk', issue: 'wrong meaning (was "steel")' },
  'acoso': { en: 'harassment', issue: 'garbled stem' },
  'actual': { en: 'current, present', issue: 'wrong meaning (was "to act")' },
  'actuales': { en: 'current (pl)', issue: 'wrong meaning' },
  'adaptador': { en: 'adapter', issue: 'wrong meaning (was verb def)' },
  'ahorros': { en: 'savings', issue: 'wrong meaning (was "to save")' },
  'alojamiento': { en: 'accommodation', issue: 'wrong meaning' },
  'andén': { en: 'platform (train)', issue: 'wrong verb-lemma match' },
  'andes': { en: 'Andes', issue: 'wrong verb-lemma match' },
  'andina': { en: 'Andean', issue: 'wrong verb-lemma match' },
  'aprendizaje': { en: 'learning', issue: 'wrong meaning' },
  'asistente': { en: 'assistant, attendee', issue: 'wrong meaning' },
  'asistentes': { en: 'assistants, attendees', issue: 'wrong meaning' },
  'aspiradora': { en: 'vacuum cleaner', issue: 'wrong meaning' },
  'atacama': { en: 'Atacama', issue: 'wrong verb-lemma match' },
  'autopista': { en: 'highway, motorway', issue: 'garbled stem' },
  'autopistas': { en: 'highways, motorways', issue: 'garbled stem' },
  'auxiliar': { en: 'auxiliary, assistant', issue: 'garbled stem' },
  'bienestar': { en: 'well-being, welfare', issue: 'garbled stem' },
  'alimentaria': { en: 'food-related, dietary', issue: 'wrong meaning' },
  'seres': { en: 'beings, creatures', issue: 'wrong meaning (was "to be")' },

  // --- Wrong verb-lemma: amar (root: am) ---
  'amable': { en: 'kind, friendly', issue: 'wrong verb-lemma: matched to amar' },
  'amables': { en: 'kind, friendly (pl)', issue: 'wrong verb-lemma: matched to amar' },
  'amarillo': { en: 'yellow', issue: 'wrong verb-lemma: matched to amar' },
  'amazonas': { en: 'Amazon', issue: 'wrong verb-lemma: matched to amar' },
  'amazónica': { en: 'Amazonian', issue: 'wrong verb-lemma: matched to amar' },
  'ambas': { en: 'both (f)', issue: 'wrong verb-lemma: matched to amar' },
  'ambición': { en: 'ambition', issue: 'wrong verb-lemma: matched to amar' },
  'ambicioso': { en: 'ambitious', issue: 'wrong verb-lemma: matched to amar' },
  'ambiental': { en: 'environmental', issue: 'wrong verb-lemma: matched to amar' },
  'ambiente': { en: 'environment, atmosphere', issue: 'wrong verb-lemma: matched to amar' },
  'ambivalente': { en: 'ambivalent', issue: 'wrong verb-lemma: matched to amar' },
  'ambos': { en: 'both', issue: 'wrong verb-lemma: matched to amar' },
  'ambulancia': { en: 'ambulance', issue: 'wrong verb-lemma: matched to amar' },
  'ambulante': { en: 'traveling, itinerant', issue: 'wrong verb-lemma: matched to amar' },
  'amenaza': { en: 'threat', issue: 'wrong verb-lemma: matched to amar' },
  'amenazada': { en: 'threatened', issue: 'wrong verb-lemma: matched to amar' },
  'amenazados': { en: 'threatened (pl)', issue: 'wrong verb-lemma: matched to amar' },
  'américa': { en: 'America', issue: 'wrong verb-lemma: matched to amar' },
  'amiga': { en: 'friend (f)', issue: 'wrong verb-lemma: matched to amar' },
  'amigo': { en: 'friend', issue: 'wrong verb-lemma: matched to amar' },
  'amigos': { en: 'friends', issue: 'wrong verb-lemma: matched to amar' },
  'amistades': { en: 'friendships', issue: 'wrong verb-lemma: matched to amar' },
  'amor': { en: 'love', issue: 'wrong verb-lemma: matched to amar' },
  'amplia': { en: 'wide, broad', issue: 'wrong verb-lemma: matched to amar' },
  'amplía': { en: 'expands, broadens', issue: 'wrong verb-lemma: matched to amar' },
  'ampliado': { en: 'expanded, broadened', issue: 'wrong verb-lemma: matched to amar' },

  // --- Wrong verb-lemma: caer (root: ca) ---
  'caballo': { en: 'horse', issue: 'wrong verb-lemma: matched to caer' },
  'cabe': { en: 'fits (caber)', issue: 'wrong verb-lemma: matched to caer' },
  'caben': { en: 'fit (caber)', issue: 'wrong verb-lemma: matched to caer' },
  'cabeza': { en: 'head', issue: 'wrong verb-lemma: matched to caer' },
  'cabezota': { en: 'stubborn', issue: 'wrong verb-lemma: matched to caer' },
  'cabía': { en: 'fit (past, caber)', issue: 'wrong verb-lemma: matched to caer' },
  'cabo': { en: 'end, cape', issue: 'wrong verb-lemma: matched to caer' },
  'cada': { en: 'each, every', issue: 'wrong verb-lemma: matched to caer' },
  'cadena': { en: 'chain, channel', issue: 'wrong verb-lemma: matched to caer' },
  'caduca': { en: 'expired', issue: 'wrong verb-lemma: matched to caer' },
  'caducada': { en: 'expired', issue: 'wrong verb-lemma: matched to caer' },
  'caja': { en: 'box, cash register', issue: 'wrong verb-lemma: matched to caer' },
  'cajas': { en: 'boxes', issue: 'wrong verb-lemma: matched to caer' },
  'cajero': { en: 'ATM, cashier', issue: 'wrong verb-lemma: matched to caer' },
  'cajeros': { en: 'ATMs, cashiers', issue: 'wrong verb-lemma: matched to caer' },
  'cala': { en: 'cove, inlet', issue: 'wrong verb-lemma: matched to caer' },
  'calcula': { en: 'calculates', issue: 'wrong verb-lemma: matched to caer' },
  'calculada': { en: 'calculated', issue: 'wrong verb-lemma: matched to caer' },
  'calculo': { en: 'I calculate', issue: 'wrong verb-lemma: matched to caer' },
  'calidad': { en: 'quality', issue: 'wrong verb-lemma: matched to caer' },
  'cálido': { en: 'warm', issue: 'wrong verb-lemma: matched to caer' },
  'caliente': { en: 'hot', issue: 'wrong verb-lemma: matched to caer' },
  'calla': { en: 'be quiet', issue: 'wrong verb-lemma: matched to caer' },
  'calle': { en: 'street', issue: 'wrong verb-lemma: matched to caer' },
  'calles': { en: 'streets', issue: 'wrong verb-lemma: matched to caer' },
  'calma': { en: 'calm', issue: 'wrong verb-lemma: matched to caer' },
  'calorías': { en: 'calories', issue: 'wrong verb-lemma: matched to caer' },
  'caluroso': { en: 'hot, warm', issue: 'wrong verb-lemma: matched to caer' },
  'calurosos': { en: 'hot, warm (pl)', issue: 'wrong verb-lemma: matched to caer' },
  'calvo': { en: 'bald', issue: 'wrong verb-lemma: matched to caer' },
  'cama': { en: 'bed', issue: 'wrong verb-lemma: matched to caer' },
  'camarera': { en: 'waitress', issue: 'wrong verb-lemma: matched to caer' },
  'camarero': { en: 'waiter', issue: 'wrong verb-lemma: matched to caer' },
  'camareros': { en: 'waiters', issue: 'wrong verb-lemma: matched to caer' },
  'cambios': { en: 'changes', issue: 'wrong verb-lemma: matched to caer' },
  'caminos': { en: 'paths, roads', issue: 'wrong verb-lemma: matched to caer' },
  'camisa': { en: 'shirt', issue: 'wrong verb-lemma: matched to caer' },
  'camiseta': { en: 't-shirt', issue: 'wrong verb-lemma: matched to caer' },
  'camisetas': { en: 't-shirts', issue: 'wrong verb-lemma: matched to caer' },
  'campanas': { en: 'bells', issue: 'wrong verb-lemma: matched to caer' },
  'campos': { en: 'fields, countryside', issue: 'wrong verb-lemma: matched to caer' },
  'canalizamos': { en: 'we channel', issue: 'wrong verb-lemma: matched to caer' },
  'canarias': { en: 'Canary Islands', issue: 'wrong verb-lemma: matched to caer' },
  'cancela': { en: 'cancels', issue: 'wrong verb-lemma: matched to caer' },
  'candidato': { en: 'candidate', issue: 'wrong verb-lemma: matched to caer' },
  'candidatos': { en: 'candidates', issue: 'wrong verb-lemma: matched to caer' },
  'canela': { en: 'cinnamon', issue: 'wrong verb-lemma: matched to caer' },
  'cangrejos': { en: 'crabs', issue: 'wrong verb-lemma: matched to caer' },
  'canguro': { en: 'kangaroo, babysitter', issue: 'wrong verb-lemma: matched to caer' },
  'canoa': { en: 'canoe', issue: 'wrong verb-lemma: matched to caer' },
  'cante': { en: 'singing (flamenco)', issue: 'wrong verb-lemma: matched to caer' },
  'caña': { en: 'beer (draft), reed', issue: 'wrong verb-lemma: matched to caer' },
  'cañón': { en: 'canyon, cannon', issue: 'wrong verb-lemma: matched to caer' },
  'caótica': { en: 'chaotic', issue: 'wrong verb-lemma: matched to caer' },
  'capa': { en: 'layer, cape', issue: 'wrong verb-lemma: matched to caer' },
  'capaces': { en: 'capable (pl)', issue: 'wrong verb-lemma: matched to caer' },
  'capacidad': { en: 'capacity, ability', issue: 'wrong verb-lemma: matched to caer' },
  'capital': { en: 'capital', issue: 'wrong verb-lemma: matched to caer' },
  'capitán': { en: 'captain', issue: 'wrong verb-lemma: matched to caer' },
  'capitulo': { en: 'chapter', issue: 'wrong verb-lemma: matched to caer' },
  'capítulos': { en: 'chapters', issue: 'wrong verb-lemma: matched to caer' },
  'capoeira': { en: 'capoeira', issue: 'wrong verb-lemma: matched to caer' },
  'captó': { en: 'captured, caught', issue: 'wrong verb-lemma: matched to caer' },
  'cara': { en: 'face, expensive', issue: 'wrong verb-lemma: matched to caer' },
  'carbono': { en: 'carbon', issue: 'wrong verb-lemma: matched to caer' },
  'carece': { en: 'lacks', issue: 'wrong verb-lemma: matched to caer' },
  'carecemos': { en: 'we lack', issue: 'wrong verb-lemma: matched to caer' },
  'caribeñas': { en: 'Caribbean (f pl)', issue: 'wrong verb-lemma: matched to caer' },
  'cariñosa': { en: 'affectionate (f)', issue: 'wrong verb-lemma: matched to caer' },
  'cariñoso': { en: 'affectionate', issue: 'wrong verb-lemma: matched to caer' },
  'carlos': { en: 'Carlos (name)', issue: 'wrong verb-lemma: matched to caer' },
  'carmen': { en: 'Carmen (name)', issue: 'wrong verb-lemma: matched to caer' },
  'carnaval': { en: 'carnival', issue: 'wrong verb-lemma: matched to caer' },
  'carnavales': { en: 'carnivals', issue: 'wrong verb-lemma: matched to caer' },
  'carne': { en: 'meat', issue: 'wrong verb-lemma: matched to caer' },
  'carné': { en: 'ID card', issue: 'wrong verb-lemma: matched to caer' },
  'caro': { en: 'expensive', issue: 'wrong verb-lemma: matched to caer' },
  'caros': { en: 'expensive (pl)', issue: 'wrong verb-lemma: matched to caer' },
  'carpeta': { en: 'folder', issue: 'wrong verb-lemma: matched to caer' },
  'carpetas': { en: 'folders', issue: 'wrong verb-lemma: matched to caer' },
  'carril': { en: 'lane', issue: 'wrong verb-lemma: matched to caer' },
  'carriles': { en: 'lanes', issue: 'wrong verb-lemma: matched to caer' },
  'carrito': { en: 'cart, trolley', issue: 'wrong verb-lemma: matched to caer' },
  'carros': { en: 'cars (Lat Am)', issue: 'wrong verb-lemma: matched to caer' },
  'carta': { en: 'letter, menu', issue: 'wrong verb-lemma: matched to caer' },
  'cartagena': { en: 'Cartagena', issue: 'wrong verb-lemma: matched to caer' },
  'cartas': { en: 'letters, cards', issue: 'wrong verb-lemma: matched to caer' },
  'cartucho': { en: 'cartridge', issue: 'wrong verb-lemma: matched to caer' },
  'catalán': { en: 'Catalan', issue: 'wrong verb-lemma: matched to caer' },
  'catálogo': { en: 'catalogue', issue: 'wrong verb-lemma: matched to caer' },
  'cataratas': { en: 'waterfalls', issue: 'wrong verb-lemma: matched to caer' },
  'catedral': { en: 'cathedral', issue: 'wrong verb-lemma: matched to caer' },
  'catedrales': { en: 'cathedrals', issue: 'wrong verb-lemma: matched to caer' },
  'catorce': { en: 'fourteen', issue: 'wrong verb-lemma: matched to caer' },
  'cautela': { en: 'caution', issue: 'wrong verb-lemma: matched to caer' },
  'caza': { en: 'hunting', issue: 'wrong verb-lemma: matched to caer' },
  'cazan': { en: 'they hunt', issue: 'wrong verb-lemma: matched to caer' },

  // --- Wrong verb-lemma: comer (root: com) ---
  'coma': { en: 'coma, comma', issue: 'wrong verb-lemma: matched to comer' },
  'combustibles': { en: 'fuels', issue: 'wrong verb-lemma: matched to comer' },
  'comedor': { en: 'dining room', issue: 'wrong verb-lemma: matched to comer' },
  'comercial': { en: 'commercial', issue: 'wrong verb-lemma: matched to comer' },
  'comercio': { en: 'commerce, trade', issue: 'wrong verb-lemma: matched to comer' },
  'comercios': { en: 'shops, businesses', issue: 'wrong verb-lemma: matched to comer' },
  'comete': { en: 'commits', issue: 'wrong verb-lemma: matched to comer' },
  'cómics': { en: 'comics', issue: 'wrong verb-lemma: matched to comer' },
  'comida': { en: 'food, meal', issue: 'wrong verb-lemma: matched to comer' },
  'comienza': { en: 'begins', issue: 'wrong verb-lemma: matched to comer' },
  'comienzo': { en: 'beginning', issue: 'wrong verb-lemma: matched to comer' },
  'comisaría': { en: 'police station', issue: 'wrong verb-lemma: matched to comer' },
  'como': { en: 'like, as', issue: 'wrong verb-lemma: matched to comer' },
  'cómo': { en: 'how', issue: 'wrong verb-lemma: matched to comer' },
  'cómoda': { en: 'comfortable (f)', issue: 'wrong verb-lemma: matched to comer' },
  'cómodas': { en: 'comfortable (f pl)', issue: 'wrong verb-lemma: matched to comer' },
  'cómodos': { en: 'comfortable (pl)', issue: 'wrong verb-lemma: matched to comer' },
  'comoquiera': { en: 'however', issue: 'wrong verb-lemma: matched to comer' },
  'companero': { en: 'companion', issue: 'wrong verb-lemma: matched to comer' },
  'compañera': { en: 'companion (f)', issue: 'wrong verb-lemma: matched to comer' },
  'compañeros': { en: 'companions', issue: 'wrong verb-lemma: matched to comer' },
  'comparte': { en: 'shares', issue: 'wrong verb-lemma: matched to comer' },
  'compensa': { en: 'compensates', issue: 'wrong verb-lemma: matched to comer' },
  'compensaba': { en: 'compensated', issue: 'wrong verb-lemma: matched to comer' },
  'compiten': { en: 'they compete', issue: 'wrong verb-lemma: matched to comer' },
  'complace': { en: 'pleases', issue: 'wrong verb-lemma: matched to comer' },
  'complejo': { en: 'complex', issue: 'wrong verb-lemma: matched to comer' },
  'complicada': { en: 'complicated (f)', issue: 'wrong verb-lemma: matched to comer' },
  'común': { en: 'common', issue: 'wrong verb-lemma: matched to comer' },
  'comunidad': { en: 'community', issue: 'wrong verb-lemma: matched to comer' },
  'comunión': { en: 'communion', issue: 'wrong verb-lemma: matched to comer' },

  // --- Wrong verb-lemma: leer (root: le) ---
  'leal': { en: 'loyal', issue: 'wrong verb-lemma: matched to leer' },
  'lecciones': { en: 'lessons', issue: 'wrong verb-lemma: matched to leer' },
  'leche': { en: 'milk', issue: 'wrong verb-lemma: matched to leer' },
  'lechuga': { en: 'lettuce', issue: 'wrong verb-lemma: matched to leer' },
  'lechugas': { en: 'lettuces', issue: 'wrong verb-lemma: matched to leer' },
  'lectura': { en: 'reading', issue: 'wrong verb-lemma: matched to leer' },
  'legal': { en: 'legal', issue: 'wrong verb-lemma: matched to leer' },
  'legales': { en: 'legal (pl)', issue: 'wrong verb-lemma: matched to leer' },
  'legua': { en: 'league (distance)', issue: 'wrong verb-lemma: matched to leer' },
  'legumbres': { en: 'legumes, pulses', issue: 'wrong verb-lemma: matched to leer' },
  'lejos': { en: 'far', issue: 'wrong verb-lemma: matched to leer' },
  'lenguaje': { en: 'language (system)', issue: 'wrong verb-lemma: matched to leer' },
  'lenguajes': { en: 'languages', issue: 'wrong verb-lemma: matched to leer' },
  'lenguas': { en: 'languages, tongues', issue: 'wrong verb-lemma: matched to leer' },
  'lenta': { en: 'slow (f)', issue: 'wrong verb-lemma: matched to leer' },
  'lentejas': { en: 'lentils', issue: 'wrong verb-lemma: matched to leer' },
  'lento': { en: 'slow', issue: 'wrong verb-lemma: matched to leer' },
  'les': { en: 'to them', issue: 'wrong verb-lemma: matched to leer' },
  'lesioné': { en: 'I injured', issue: 'wrong verb-lemma: matched to leer' },
  'lesiones': { en: 'injuries', issue: 'wrong verb-lemma: matched to leer' },
  'lesionó': { en: 'injured', issue: 'wrong verb-lemma: matched to leer' },
  'letra': { en: 'letter (character)', issue: 'wrong verb-lemma: matched to leer' },
  'letras': { en: 'letters', issue: 'wrong verb-lemma: matched to leer' },
  'levante': { en: 'Levante (region)', issue: 'wrong verb-lemma: matched to leer' },
  'ley': { en: 'law', issue: 'wrong verb-lemma: matched to leer' },
  'leyes': { en: 'laws', issue: 'wrong verb-lemma: matched to leer' },

  // --- Wrong verb-lemma: huir (root: hu) ---
  'huecos': { en: 'gaps, holes', issue: 'wrong verb-lemma: matched to huir' },
  'huele': { en: 'smells', issue: 'wrong verb-lemma: matched to huir' },
  'huelen': { en: 'they smell', issue: 'wrong verb-lemma: matched to huir' },
  'huelga': { en: 'strike', issue: 'wrong verb-lemma: matched to huir' },
  'huerto': { en: 'orchard, garden', issue: 'wrong verb-lemma: matched to huir' },
  'hueso': { en: 'bone', issue: 'wrong verb-lemma: matched to huir' },
  'huevo': { en: 'egg', issue: 'wrong verb-lemma: matched to huir' },
  'huevos': { en: 'eggs', issue: 'wrong verb-lemma: matched to huir' },
  'humana': { en: 'human (f)', issue: 'wrong verb-lemma: matched to huir' },
  'humanidad': { en: 'humanity', issue: 'wrong verb-lemma: matched to huir' },
  'humano': { en: 'human', issue: 'wrong verb-lemma: matched to huir' },
  'humanos': { en: 'humans', issue: 'wrong verb-lemma: matched to huir' },
  'humeante': { en: 'steaming', issue: 'wrong verb-lemma: matched to huir' },
  'humedales': { en: 'wetlands', issue: 'wrong verb-lemma: matched to huir' },
  'húmedas': { en: 'humid (f pl)', issue: 'wrong verb-lemma: matched to huir' },
  'huracán': { en: 'hurricane', issue: 'wrong verb-lemma: matched to huir' },

  // --- Wrong verb-lemma: crear (root: cre) ---
  'creativa': { en: 'creative (f)', issue: 'wrong verb-lemma: matched to crear' },
  'creativo': { en: 'creative', issue: 'wrong verb-lemma: matched to crear' },
  'crédito': { en: 'credit', issue: 'wrong verb-lemma: matched to crear' },
  'creerían': { en: 'they would believe', issue: 'wrong verb-lemma: matched to crear' },
  'creerías': { en: 'you would believe', issue: 'wrong verb-lemma: matched to crear' },
  'creía': { en: 'believed', issue: 'wrong verb-lemma: matched to crear' },
  'creíble': { en: 'credible', issue: 'wrong verb-lemma: matched to crear' },
  'creído': { en: 'believed, arrogant', issue: 'wrong verb-lemma: matched to crear' },
  'crema': { en: 'cream', issue: 'wrong verb-lemma: matched to crear' },
  'creyó': { en: 'believed', issue: 'wrong verb-lemma: matched to crear' },

  // --- Whitespace ---
  'íes': { en: 'letters', issue: 'trailing whitespace' },
};

// ========== ITALIAN CORRECTIONS ==========
const IT_FIXES = {
  // --- Wrong meanings ---
  'nuotatore': { en: 'swimmer', issue: 'wrong meaning (was "to swim")' },
  'nutrienti': { en: 'nutrients', issue: 'wrong meaning (was "to nourish")' },
  'parmigiana': { en: 'Parmigiana (eggplant dish)', issue: 'wrong meaning (was "to seem")' },
  'programmatore': { en: 'programmer', issue: 'wrong meaning (was "to plan")' },
  'rivestito': { en: 'covered, coated', issue: 'wrong meaning (was "to reveal")' },
  'spinse': { en: 'pushed (past tense)', issue: 'wrong meaning (was "to push" infinitive)' },

  // --- Wrong verb-lemma: parere (root: par) ---
  'paracadute': { en: 'parachute', issue: 'wrong verb-lemma: matched to parere' },
  'paradiso': { en: 'paradise', issue: 'wrong verb-lemma: matched to parere' },
  'parco': { en: 'park', issue: 'wrong verb-lemma: matched to parere' },
  'parecchio': { en: 'quite a lot, several', issue: 'wrong verb-lemma: matched to parere' },
  'parente': { en: 'relative', issue: 'wrong verb-lemma: matched to parere' },
  'parentela': { en: 'relatives, kinship', issue: 'wrong verb-lemma: matched to parere' },
  'pareti': { en: 'walls', issue: 'wrong verb-lemma: matched to parere' },
  'parigi': { en: 'Paris', issue: 'wrong verb-lemma: matched to parere' },
  'park': { en: 'park', issue: 'wrong verb-lemma: matched to parere' },
  'parmigiano': { en: 'Parmesan', issue: 'wrong verb-lemma: matched to parere' },
  'parole': { en: 'words', issue: 'wrong verb-lemma: matched to parere' },
  'part': { en: 'part', issue: 'wrong verb-lemma: matched to parere' },
  'parziale': { en: 'partial', issue: 'wrong verb-lemma: matched to parere' },
  'parallele': { en: 'parallel', issue: 'wrong verb-lemma: matched to parere' },

  // --- Wrong verb-lemma: stare (root: sta) ---
  'stabile': { en: 'stable', issue: 'wrong verb-lemma: matched to stare' },
  'stadio': { en: 'stadium', issue: 'wrong verb-lemma: matched to stare' },
  'staffe': { en: 'stirrups, brackets', issue: 'wrong verb-lemma: matched to stare' },
  'stagione': { en: 'season', issue: 'wrong verb-lemma: matched to stare' },
  'stammi': { en: 'stay with me (stare)', issue: 'wrong verb-lemma: matched to stare' },
  'stanotte': { en: 'tonight', issue: 'wrong verb-lemma: matched to stare' },
  'stante': { en: 'standing, current', issue: 'wrong verb-lemma: matched to stare' },
  'stanza': { en: 'room', issue: 'wrong verb-lemma: matched to stare' },
  'stasera': { en: 'this evening, tonight', issue: 'wrong verb-lemma: matched to stare' },
  'statua': { en: 'statue', issue: 'wrong verb-lemma: matched to stare' },
  'stazione': { en: 'station', issue: 'wrong verb-lemma: matched to stare' },
  'stella': { en: 'star', issue: 'wrong verb-lemma: matched to stare' },
  'stelle': { en: 'stars', issue: 'wrong verb-lemma: matched to stare' },
  'stessa': { en: 'same (f), herself', issue: 'wrong verb-lemma: matched to stare' },
  'stesso': { en: 'same, himself', issue: 'wrong verb-lemma: matched to stare' },
  'stile': { en: 'style', issue: 'wrong verb-lemma: matched to stare' },
  'stima': { en: 'esteem, estimate', issue: 'wrong verb-lemma: matched to stare' },
  'stipendi': { en: 'salaries', issue: 'wrong verb-lemma: matched to stare' },
  'stipendio': { en: 'salary, wage', issue: 'wrong verb-lemma: matched to stare' },
  'stira': { en: 'irons (clothes)', issue: 'wrong verb-lemma: matched to stare' },
  'stiravo': { en: 'I was ironing', issue: 'wrong verb-lemma: matched to stare' },
  'stivale': { en: 'boot', issue: 'wrong verb-lemma: matched to stare' },
  'stivali': { en: 'boots', issue: 'wrong verb-lemma: matched to stare' },
  'stomaco': { en: 'stomach', issue: 'wrong verb-lemma: matched to stare' },
  'storia': { en: 'history, story', issue: 'wrong verb-lemma: matched to stare' },
  'storico': { en: 'historical', issue: 'wrong verb-lemma: matched to stare' },
  'storie': { en: 'stories', issue: 'wrong verb-lemma: matched to stare' },
  'storta': { en: 'twisted, sprained', issue: 'wrong verb-lemma: matched to stare' },
  'strada': { en: 'street, road', issue: 'wrong verb-lemma: matched to stare' },
  'strade': { en: 'streets, roads', issue: 'wrong verb-lemma: matched to stare' },
  'strana': { en: 'strange (f)', issue: 'wrong verb-lemma: matched to stare' },
  'strano': { en: 'strange', issue: 'wrong verb-lemma: matched to stare' },
  'strategia': { en: 'strategy', issue: 'wrong verb-lemma: matched to stare' },
  'stress': { en: 'stress', issue: 'wrong verb-lemma: matched to stare' },
  'stretta': { en: 'tight (f), handshake', issue: 'wrong verb-lemma: matched to stare' },
  'stretto': { en: 'narrow, tight', issue: 'wrong verb-lemma: matched to stare' },
  'stringe': { en: 'tightens, squeezes', issue: 'wrong verb-lemma: matched to stare' },
  'strisce': { en: 'stripes, crosswalk', issue: 'wrong verb-lemma: matched to stare' },
  'strumento': { en: 'instrument, tool', issue: 'wrong verb-lemma: matched to stare' },
  'strumenti': { en: 'instruments, tools', issue: 'wrong verb-lemma: matched to stare' },
  'struttura': { en: 'structure', issue: 'wrong verb-lemma: matched to stare' },
  'stucco': { en: 'stucco, plaster', issue: 'wrong verb-lemma: matched to stare' },
  'studente': { en: 'student', issue: 'wrong verb-lemma: matched to stare' },
  'studenti': { en: 'students', issue: 'wrong verb-lemma: matched to stare' },
  'studi': { en: 'studies', issue: 'wrong verb-lemma: matched to stare' },
  'stufi': { en: 'fed up', issue: 'wrong verb-lemma: matched to stare' },
  'stupendo': { en: 'wonderful, stunning', issue: 'wrong verb-lemma: matched to stare' },
  'stupido': { en: 'stupid', issue: 'wrong verb-lemma: matched to stare' },

  // --- Wrong verb-lemma: amare (root: am) ---
  'amaro': { en: 'bitter', issue: 'wrong verb-lemma: matched to amare' },
  'ambientale': { en: 'environmental', issue: 'wrong verb-lemma: matched to amare' },
  'ambiente': { en: 'environment', issue: 'wrong verb-lemma: matched to amare' },
  'ambizione': { en: 'ambition', issue: 'wrong verb-lemma: matched to amare' },
  'ambizioso': { en: 'ambitious', issue: 'wrong verb-lemma: matched to amare' },
  'ambulanza': { en: 'ambulance', issue: 'wrong verb-lemma: matched to amare' },
  'americana': { en: 'American (f)', issue: 'wrong verb-lemma: matched to amare' },
  'amica': { en: 'friend (f)', issue: 'wrong verb-lemma: matched to amare' },
  'amiche': { en: 'friends (f)', issue: 'wrong verb-lemma: matched to amare' },
  'amici': { en: 'friends', issue: 'wrong verb-lemma: matched to amare' },
  'amicizia': { en: 'friendship', issue: 'wrong verb-lemma: matched to amare' },
  'amico': { en: 'friend', issue: 'wrong verb-lemma: matched to amare' },
  'ammalato': { en: 'sick, ill', issue: 'wrong verb-lemma: matched to amare' },
  'ammesso': { en: 'admitted, allowed', issue: 'wrong verb-lemma: matched to amare' },
  'amore': { en: 'love', issue: 'wrong verb-lemma: matched to amare' },
  'ampio': { en: 'wide, broad', issue: 'wrong verb-lemma: matched to amare' },

  // --- Wrong verb-lemma: agire ---
  'agenzia': { en: 'agency', issue: 'wrong verb-lemma: matched to agire' },
  'aggiornati': { en: 'updated', issue: 'wrong verb-lemma: matched to agire' },
  'aggiunta': { en: 'addition', issue: 'wrong verb-lemma: matched to agire' },
  'aggiunto': { en: 'added', issue: 'wrong verb-lemma: matched to agire' },
  'aggravato': { en: 'worsened', issue: 'wrong verb-lemma: matched to agire' },

  // --- Wrong verb-lemma: dare ---
  'dall': { en: 'from the', issue: 'wrong verb-lemma: matched to dare' },
  'danneggiata': { en: 'damaged (f)', issue: 'wrong verb-lemma: matched to dare' },
  'danneggiati': { en: 'damaged (pl)', issue: 'wrong verb-lemma: matched to dare' },

  // --- Wrong verb-lemma: dire ---
  'dettagli': { en: 'details', issue: 'wrong verb-lemma: matched to dire' },
  'di': { en: 'of, from', issue: 'wrong verb-lemma: matched to dire' },

  // --- Wrong verb-lemma: fare ---
  'faccia': { en: 'face', issue: 'wrong verb-lemma: matched to fare' },

  // --- Wrong verb-lemma: osare ---
  'oscuro': { en: 'dark, obscure', issue: 'wrong verb-lemma: matched to osare' },
  'ospedale': { en: 'hospital', issue: 'wrong verb-lemma: matched to osare' },

  // --- Wrong verb-lemma: unire ---
  'undici': { en: 'eleven', issue: 'wrong verb-lemma: matched to unire' },
};

// ========== FRENCH CORRECTIONS ==========
const FR_FIXES = {
  'allusion': { en: 'allusion, reference', issue: 'context bleed: was "over, alluding"' },
  'collaboration': { en: 'collaboration, cooperation', issue: 'context bleed: was "to stick"' },
  'convergence': { en: 'convergence', issue: 'context bleed: was "to suit"' },
  'camping': { en: 'campsite, camping', issue: 'noun defined as verb' },
  'excuse': { en: 'excuse, apology', issue: 'noun defined as verb' },
  'fatigue': { en: 'fatigue, tiredness', issue: 'context bleed: was "tired, after"' },
  'impatience': { en: 'impatience', issue: 'noun defined as verb' },
  'intervention': { en: 'intervention, speech', issue: 'noun defined as verb' },
  'parent': { en: 'parent, relative', issue: 'wrong meaning: was "by, through"' },
  'rat': { en: 'rat', issue: 'wrong meaning: was "to miss, to fail"' },
  'regret': { en: 'regret', issue: 'noun defined as verb' },
  'vote': { en: 'vote', issue: 'noun defined as verb' },
  'invitations': { en: 'invitations', issue: 'noun defined as verb' },
  'modifications': { en: 'modifications, changes', issue: 'noun defined as verb' },
  'variables': { en: 'variable (adj/n)', issue: 'noun defined as verb' },
  'combien': { en: 'how much, how many', issue: 'truncated definition' },
};

// ========== PORTUGUESE CORRECTIONS ==========
const PT_FIXES = {
  // PT is clean – no significant issues found
};

// ========== BUILD FIX FILES ==========
function buildFixFile(lang, fixMap) {
  const entries = JSON.parse(fs.readFileSync(path.join(OUTPUT, `${lang}-dict-entries.json`)));
  const entryMap = {};
  for (const e of entries) entryMap[e.word] = e;

  const fixes = [];
  for (const [word, fix] of Object.entries(fixMap)) {
    const entry = entryMap[word];
    if (!entry) continue;

    // Only include if the current definition is actually wrong
    const currentClean = entry.en.replace(/\s*\(\w+\)\s*$/,'').trim();
    if (currentClean === fix.en) continue;

    fixes.push({
      word,
      current_en: entry.en,
      fixed_en: fix.en,
      issue: fix.issue
    });
  }

  return fixes;
}

for (const [lang, fixMap] of [['es', ES_FIXES], ['it', IT_FIXES], ['fr', FR_FIXES], ['pt', PT_FIXES]]) {
  const fixes = buildFixFile(lang, fixMap);
  const outPath = path.join(OUTPUT, `${lang}-dict-fixes.json`);
  fs.writeFileSync(outPath, JSON.stringify(fixes, null, 2));

  const entries = JSON.parse(fs.readFileSync(path.join(OUTPUT, `${lang}-dict-entries.json`)));
  console.log(`${lang.toUpperCase()}: ${entries.length} total, ${fixes.length} fixes`);

  // Show issue breakdown
  const byType = {};
  for (const f of fixes) {
    const type = f.issue.split(':')[0].trim();
    byType[type] = (byType[type] || 0) + 1;
  }
  for (const [type, count] of Object.entries(byType)) {
    console.log(`  ${type}: ${count}`);
  }

  // Worst examples
  console.log('  Worst examples:');
  const worst = fixes.filter(f => f.issue.includes('matched to caer') || f.issue.includes('context bleed') || f.issue.includes('wrong meaning') || f.issue.includes('garbled'));
  for (const f of worst.slice(0, 5)) {
    console.log(`    ${f.word}: "${f.current_en}" → "${f.fixed_en}"`);
  }
}
