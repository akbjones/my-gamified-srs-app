const fs = require('fs');
const path = require('path');

const DECK_PATH = path.join(__dirname, '..', 'src', 'data', 'spanish', 'deck.json');
const DICT_PATH = path.join(__dirname, '..', 'src', 'data', 'dictionary', 'es.ts');

// ============================================================
// 1. Read deck, extract unique words
// ============================================================
const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf8'));
const wordSet = new Set();
deck.forEach(c => {
  c.target.toLowerCase()
    .replace(/[¿¡.,!?;:"""''()—–\-\d\/]/g, ' ')
    .split(/\s+/)
    .forEach(w => { if (w.length > 0) wordSet.add(w); });
});
const allWords = [...wordSet].sort();
console.log('Unique words in deck:', allWords.length);

// ============================================================
// 2. Read existing dictionary keys
// ============================================================
const dictContent = fs.readFileSync(DICT_PATH, 'utf8');
const existingKeys = new Set();
const re = /"([^"]+)":\s*\{\s*en:/g;
let m;
while ((m = re.exec(dictContent)) !== null) {
  existingKeys.add(m[1]);
}
console.log('Existing dictionary entries:', existingKeys.size);

// Extract existing entries to preserve them
const existingEntries = {};
const entryRe = /"([^"]+)":\s*\{\s*en:\s*"([^"]*)",\s*ipa:\s*"([^"]*)",\s*pos:\s*"([^"]*)"\s*\}/g;
let em;
while ((em = entryRe.exec(dictContent)) !== null) {
  existingEntries[em[1]] = { en: em[2], ipa: em[3], pos: em[4] };
}
console.log('Parsed existing entries:', Object.keys(existingEntries).length);

const missing = allWords.filter(w => !existingKeys.has(w));
console.log('Missing words:', missing.length);

// ============================================================
// 3. Spanish IPA generator (rules-based, Latin American)
// ============================================================
function spanishIPA(word) {
  // Find stress position
  let stressIdx = -1;
  const vowelPattern = /[aeiouáéíóúü]/;
  const accentedVowel = /[áéíóú]/;
  
  // Check for explicit accent
  for (let i = 0; i < word.length; i++) {
    if (accentedVowel.test(word[i])) {
      stressIdx = i;
      break;
    }
  }
  
  // Normalize accented vowels for processing
  const normalized = word
    .replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i')
    .replace(/ó/g, 'o').replace(/ú/g, 'u').replace(/ü/g, 'u');
  
  let result = '';
  let i = 0;
  
  while (i < normalized.length) {
    const c = normalized[i];
    const next = i + 1 < normalized.length ? normalized[i + 1] : '';
    const prev = i > 0 ? normalized[i - 1] : '';
    const isStart = i === 0 || /[.\s]/.test(prev);
    const afterNasal = /[nmn]/.test(prev);
    const afterL = prev === 'l';
    
    // Add stress mark before stressed vowel
    if (i === stressIdx && vowelPattern.test(c)) {
      result += 'ˈ';
    }
    
    switch (c) {
      case 'a': result += 'a'; break;
      case 'e': result += 'e'; break;
      case 'i':
        // i as semivowel before another vowel
        if (vowelPattern.test(next) && next !== 'i') {
          result += 'j';
        } else {
          result += 'i';
        }
        break;
      case 'o': result += 'o'; break;
      case 'u':
        if (prev === 'q') { break; } // qu - u is silent
        if (prev === 'g' && /[ei]/.test(next)) { break; } // gue/gui - u is silent
        if (vowelPattern.test(next)) {
          result += 'w';
        } else {
          result += 'u';
        }
        break;
      case 'b':
      case 'v':
        if (isStart || afterNasal) {
          result += 'b';
        } else {
          result += 'β';
        }
        break;
      case 'c':
        if (next === 'h') {
          result += 'tʃ';
          i++; // skip h
        } else if (/[ei]/.test(next)) {
          result += 's'; // Latin American
        } else {
          result += 'k';
        }
        break;
      case 'd':
        if (isStart || afterNasal || afterL) {
          result += 'd';
        } else {
          result += 'ð';
        }
        break;
      case 'f': result += 'f'; break;
      case 'g':
        if (next === 'u' && i + 2 < normalized.length && /[ei]/.test(normalized[i + 2])) {
          result += 'ɡ'; // gue/gui
        } else if (/[ei]/.test(next)) {
          result += 'x';
        } else if (isStart || afterNasal) {
          result += 'ɡ';
        } else {
          result += 'ɣ';
        }
        break;
      case 'h': break; // silent
      case 'j': result += 'x'; break;
      case 'k': result += 'k'; break;
      case 'l':
        if (next === 'l') {
          result += 'ʝ';
          i++;
        } else {
          result += 'l';
        }
        break;
      case 'm': result += 'm'; break;
      case 'n': result += 'n'; break;
      case 'ñ': result += 'ɲ'; break;
      case 'p': result += 'p'; break;
      case 'q':
        result += 'k';
        if (next === 'u') i++; // skip u in qu
        break;
      case 'r':
        if (isStart || (prev === 'n' || prev === 'l' || prev === 's')) {
          result += 'r';
        } else if (next === 'r') {
          result += 'r';
          i++;
        } else {
          result += 'ɾ';
        }
        break;
      case 's': result += 's'; break;
      case 't': result += 't'; break;
      case 'w': result += 'w'; break;
      case 'x':
        if (isStart) {
          result += 's';
        } else {
          result += 'ks';
        }
        break;
      case 'y':
        if (!vowelPattern.test(next) && i === normalized.length - 1) {
          result += 'i'; // y at end = vowel
        } else {
          result += 'ʝ';
        }
        break;
      case 'z': result += 's'; break; // Latin American
      default: result += c;
    }
    i++;
  }
  
  // Add syllable dots (simplified: between consonant clusters)
  // This is a rough approximation
  let ipa = result;
  
  // Add default stress if no accent mark was found
  if (stressIdx === -1) {
    // Spanish stress rules:
    // Words ending in vowel, n, s: stress penultimate syllable
    // Words ending in consonant (not n/s): stress last syllable
    // We already have ˈ if accented, so skip if present
    if (!ipa.includes('ˈ')) {
      // Simple: don't add stress mark for very short words
      // For longer words it's complex, so we skip automatic stress
    }
  }
  
  return ipa || word;
}

// ============================================================
// 4. Part of speech guesser
// ============================================================
function guessPos(word) {
  const w = word.toLowerCase();
  // Adverbs
  if (w.endsWith('mente')) return 'adv';
  // Nouns - feminine abstract
  if (w.endsWith('ción') || w.endsWith('sión') || w.endsWith('dad') || w.endsWith('tud') || w.endsWith('eza') || w.endsWith('ura') || w.endsWith('anza') || w.endsWith('encia') || w.endsWith('ancia')) return 'n';
  // Nouns - agent
  if (w.endsWith('ista') || w.endsWith('ero') || w.endsWith('era') || w.endsWith('dor') || w.endsWith('dora') || w.endsWith('tor') || w.endsWith('tora')) return 'n';
  // Nouns - diminutive/augmentative
  if (w.endsWith('ito') || w.endsWith('ita') || w.endsWith('illo') || w.endsWith('illa')) return 'n';
  // Adjectives
  if (w.endsWith('oso') || w.endsWith('osa') || w.endsWith('ivo') || w.endsWith('iva') || w.endsWith('ble') || w.endsWith('nte') || w.endsWith('ado') || w.endsWith('ada') || w.endsWith('ido') || w.endsWith('ida')) return 'adj';
  if (w.endsWith('al') || w.endsWith('ar') && w.length > 4) return 'adj';
  // Verbs - infinitives
  if (w.endsWith('ar') || w.endsWith('er') || w.endsWith('ir') || w.endsWith('ír') || w.endsWith('ér')) return 'v';
  // Verb conjugations
  if (w.endsWith('amos') || w.endsWith('emos') || w.endsWith('imos') || w.endsWith('ando') || w.endsWith('iendo') || w.endsWith('aron') || w.endsWith('ieron') || w.endsWith('aría') || w.endsWith('ería') || w.endsWith('iría')) return 'v';
  if (w.endsWith('aba') || w.endsWith('ían') || w.endsWith('aban') || w.endsWith('aste') || w.endsWith('iste')) return 'v';
  if (w.endsWith('ará') || w.endsWith('erá') || w.endsWith('irá') || w.endsWith('arán') || w.endsWith('erán') || w.endsWith('irán')) return 'v';
  if (w.endsWith('aré') || w.endsWith('eré') || w.endsWith('iré')) return 'v';
  // Gerund
  if (w.endsWith('ando') || w.endsWith('iendo')) return 'v';
  // Default
  return 'n';
}

// ============================================================
// 5. Common Spanish words translation map (~1500 entries)
// ============================================================
const TRANSLATIONS = {
  // --- A ---
  'a': 'to / at', 'abajo': 'down / below', 'abandonar': 'to abandon', 'abierta': 'open (f)',
  'abierto': 'open', 'abogado': 'lawyer', 'abogada': 'lawyer (f)', 'abrazar': 'to hug / to embrace', 'abrazo': 'hug',
  'abre': 'opens', 'abren': 'they open', 'abrigo': 'coat', 'abril': 'April',
  'abrir': 'to open', 'absoluto': 'absolute', 'abstracto': 'abstract', 'abuela': 'grandmother',
  'abuelo': 'grandfather', 'abuelos': 'grandparents', 'aburrido': 'boring / bored',
  'acá': 'here', 'acabar': 'to finish', 'academia': 'academy', 'acceso': 'access',
  'accidente': 'accident', 'acción': 'action', 'aceite': 'oil', 'aceptar': 'to accept',
  'acerca': 'about', 'acercar': 'to approach', 'ácido': 'acid', 'aclarar': 'to clarify',
  'acompañar': 'to accompany', 'aconsejar': 'to advise', 'acordar': 'to agree / remember',
  'acostumbrar': 'to be accustomed', 'actividad': 'activity', 'activo': 'active',
  'acto': 'act', 'actor': 'actor', 'actriz': 'actress', 'actual': 'current',
  'actualmente': 'currently', 'actuar': 'to act', 'acuerdo': 'agreement',
  'adelante': 'forward / ahead', 'además': 'moreover / besides', 'adentro': 'inside',
  'adiós': 'goodbye', 'adivinar': 'to guess', 'admitir': 'to admit',
  'adónde': 'where to', 'adoptar': 'to adopt', 'adulto': 'adult',
  'aeropuerto': 'airport', 'afectar': 'to affect', 'afición': 'hobby',
  'afuera': 'outside', 'agencia': 'agency', 'agenda': 'agenda / planner',
  'agente': 'agent', 'agotado': 'exhausted / sold out', 'agradable': 'pleasant',
  'agradecer': 'to thank', 'agregar': 'to add', 'agricultura': 'agriculture',
  'agua': 'water', 'aguantar': 'to endure', 'águila': 'eagle', 'aguja': 'needle',
  'ahí': 'there', 'ahora': 'now', 'ahorrar': 'to save (money)', 'aire': 'air',
  'ajo': 'garlic', 'al': 'to the', 'ala': 'wing', 'alcalde': 'mayor',
  'alcanzar': 'to reach', 'aldea': 'village', 'alegre': 'happy / cheerful',
  'alegría': 'joy / happiness', 'alejar': 'to move away', 'alemán': 'German',
  'alfombra': 'carpet / rug', 'algo': 'something', 'algodón': 'cotton',
  'alguien': 'someone', 'algún': 'some', 'alguno': 'some', 'alguna': 'some (f)',
  'algunas': 'some (f pl)', 'algunos': 'some (pl)', 'alimentar': 'to feed',
  'alimento': 'food / nourishment', 'alivio': 'relief', 'allá': 'over there',
  'allí': 'there', 'alma': 'soul', 'almacén': 'warehouse / store',
  'almohada': 'pillow', 'almorzar': 'to have lunch', 'almuerzo': 'lunch',
  'alojar': 'to lodge / to host', 'alojarse': 'to stay (accommodation)', 'alojamiento': 'accommodation', 'alquilar': 'to rent', 'alquiler': 'rent',
  'alrededor': 'around', 'alto': 'tall / high', 'altura': 'height',
  'alumno': 'student', 'alumna': 'student (f)', 'amable': 'kind',
  'amar': 'to love', 'amarillo': 'yellow', 'ambiente': 'environment / atmosphere',
  'ambos': 'both', 'amenaza': 'threat', 'amigo': 'friend', 'amiga': 'friend (f)',
  'amistad': 'friendship', 'amor': 'love', 'amplio': 'wide / broad',
  'análisis': 'analysis', 'ancho': 'wide', 'anciano': 'elderly',
  'andar': 'to walk', 'ángel': 'angel', 'ángulo': 'angle',
  'anillo': 'ring', 'animal': 'animal', 'ánimo': 'spirit / mood',
  'anoche': 'last night', 'anterior': 'previous', 'antes': 'before',
  'antiguo': 'old / ancient', 'anual': 'annual', 'anunciar': 'to announce',
  'anuncio': 'announcement / ad', 'añadir': 'to add', 'año': 'year',
  'años': 'years', 'apagar': 'to turn off', 'aparato': 'device / apparatus',
  'aparecer': 'to appear', 'apartamento': 'apartment', 'apellido': 'last name',
  'apenas': 'barely / hardly', 'apertura': 'opening', 'apetito': 'appetite',
  'aplicar': 'to apply', 'aplicación': 'application', 'apoyar': 'to support',
  'apoyo': 'support', 'apreciar': 'to appreciate', 'aprender': 'to learn',
  'aprobar': 'to approve / pass', 'aprovechar': 'to take advantage',
  'apto': 'suitable / fit', 'apuntar': 'to point / note down',
  'aquel': 'that (over there)', 'aquella': 'that (f, over there)',
  'aquí': 'here', 'araña': 'spider', 'árbol': 'tree', 'archivo': 'file / archive',
  'área': 'area', 'arena': 'sand', 'argentino': 'Argentine',
  'armario': 'closet / wardrobe', 'arquitecto': 'architect',
  'arquitectura': 'architecture', 'arrancar': 'to start / pull out',
  'arreglar': 'to fix / arrange', 'arriba': 'up / above', 'arroz': 'rice',
  'arte': 'art', 'artículo': 'article', 'artista': 'artist',
  'asado': 'roasted / barbecue', 'asegurar': 'to ensure / insure',
  'así': 'like this / so', 'asiento': 'seat', 'asistir': 'to attend',
  'asociar': 'to associate', 'aspecto': 'aspect / appearance',
  'aspirar': 'to aspire', 'asunto': 'matter / issue',
  'atacar': 'to attack', 'ataque': 'attack', 'atención': 'attention',
  'atender': 'to attend to / serve', 'atento': 'attentive',
  'aterrizar': 'to land', 'atleta': 'athlete', 'atmósfera': 'atmosphere',
  'atrás': 'back / behind', 'atrasar': 'to delay', 'atrever': 'to dare',
  'atrevido': 'daring / bold', 'aún': 'still / yet', 'aun': 'even',
  'aunque': 'although / even though', 'autobús': 'bus', 'automóvil': 'automobile',
  'autor': 'author', 'autoridad': 'authority', 'avanzar': 'to advance',
  'ave': 'bird', 'avenida': 'avenue', 'aventura': 'adventure',
  'avión': 'airplane', 'avisar': 'to warn / notify', 'ayer': 'yesterday',
  'ayuda': 'help', 'ayudar': 'to help', 'ayuntamiento': 'city hall',
  'azúcar': 'sugar', 'azul': 'blue',
  // --- B ---
  'bailar': 'to dance', 'baile': 'dance', 'bajar': 'to go down / lower',
  'bajo': 'low / short / under', 'balcón': 'balcony', 'balón': 'ball',
  'banco': 'bank / bench', 'banda': 'band', 'bandera': 'flag',
  'baño': 'bathroom / bath', 'bar': 'bar', 'barato': 'cheap',
  'barba': 'beard', 'barco': 'boat / ship', 'barrio': 'neighborhood',
  'base': 'base / basis', 'básico': 'basic', 'bastante': 'enough / quite',
  'basura': 'trash / garbage', 'batalla': 'battle', 'batería': 'battery / drums',
  'beber': 'to drink', 'bebé': 'baby', 'bebida': 'drink / beverage',
  'bello': 'beautiful', 'beneficio': 'benefit', 'besar': 'to kiss',
  'beso': 'kiss', 'biblioteca': 'library', 'bicicleta': 'bicycle',
  'bien': 'well / good', 'bienvenido': 'welcome', 'billete': 'ticket / bill',
  'blanco': 'white', 'bloque': 'block', 'blusa': 'blouse',
  'boca': 'mouth', 'boda': 'wedding', 'bodega': 'cellar / warehouse',
  'boleto': 'ticket', 'bolsa': 'bag / purse / stock market',
  'bolsillo': 'pocket', 'bomba': 'bomb / pump', 'bombero': 'firefighter',
  'bonito': 'pretty / nice', 'borde': 'edge / border', 'bosque': 'forest',
  'bota': 'boot', 'botella': 'bottle', 'botón': 'button',
  'brazo': 'arm', 'breve': 'brief / short', 'brillante': 'brilliant / shiny',
  'broma': 'joke', 'brújula': 'compass', 'buen': 'good',
  'bueno': 'good', 'buena': 'good (f)', 'buenos': 'good (pl)',
  'bufanda': 'scarf', 'buscar': 'to search / look for', 'búsqueda': 'search',
  // --- C ---
  'caballo': 'horse', 'cabeza': 'head', 'cable': 'cable',
  'cabo': 'end / cape', 'cada': 'each / every', 'cadena': 'chain / channel',
  'caer': 'to fall', 'café': 'coffee / brown', 'caja': 'box / cash register',
  'cajón': 'drawer', 'calcetín': 'sock', 'cálculo': 'calculation',
  'calendario': 'calendar', 'calidad': 'quality', 'caliente': 'hot',
  'calle': 'street', 'calma': 'calm', 'calor': 'heat / warmth',
  'cama': 'bed', 'cámara': 'camera / chamber', 'camarero': 'waiter',
  'cambiar': 'to change', 'cambio': 'change / exchange', 'caminar': 'to walk',
  'camino': 'path / road / way', 'camión': 'truck', 'camisa': 'shirt',
  'camiseta': 'T-shirt', 'campamento': 'camp', 'campaña': 'campaign',
  'campeón': 'champion', 'campo': 'field / countryside', 'canal': 'channel',
  'canasta': 'basket', 'cancelar': 'to cancel', 'canción': 'song',
  'candidato': 'candidate', 'cansado': 'tired', 'cansar': 'to tire',
  'cantante': 'singer', 'cantar': 'to sing', 'cantidad': 'quantity / amount',
  'capaz': 'capable', 'capital': 'capital', 'capitán': 'captain',
  'capítulo': 'chapter', 'cara': 'face', 'carácter': 'character',
  'característica': 'characteristic', 'cargado': 'loaded / charged',
  'cargar': 'to load / charge', 'cargo': 'charge / position',
  'cariño': 'affection / darling', 'carne': 'meat', 'carnicería': 'butcher shop',
  'caro': 'expensive', 'carrera': 'career / race', 'carretera': 'highway / road',
  'carro': 'car / cart', 'carta': 'letter / card / menu',
  'cartel': 'poster / sign', 'cartera': 'wallet / portfolio',
  'casa': 'house / home', 'casar': 'to marry', 'casi': 'almost',
  'caso': 'case', 'castigar': 'to punish', 'castillo': 'castle',
  'causa': 'cause', 'causar': 'to cause', 'cebolla': 'onion',
  'celebrar': 'to celebrate', 'celoso': 'jealous', 'cena': 'dinner',
  'cenar': 'to have dinner', 'centro': 'center / downtown',
  'cerca': 'near / close', 'cercano': 'nearby', 'cerdo': 'pig / pork',
  'cerebro': 'brain', 'ceremonia': 'ceremony', 'cero': 'zero',
  'cerrar': 'to close', 'cerveza': 'beer', 'césped': 'lawn / grass',
  'chaqueta': 'jacket', 'charla': 'talk / chat', 'charlar': 'to chat',
  'chica': 'girl', 'chico': 'boy', 'chino': 'Chinese',
  'chiste': 'joke', 'chocolate': 'chocolate', 'chofer': 'driver',
  'choque': 'crash / shock', 'cielo': 'sky / heaven', 'cien': 'hundred',
  'ciencia': 'science', 'científico': 'scientific / scientist',
  'cierto': 'certain / true', 'cifra': 'figure / number',
  'cine': 'cinema / movies', 'cinturón': 'belt', 'círculo': 'circle',
  'cita': 'date / appointment / quote', 'ciudad': 'city',
  'ciudadano': 'citizen', 'civil': 'civil', 'claro': 'clear / of course',
  'clase': 'class', 'clásico': 'classic', 'clave': 'key (adj)',
  'cliente': 'client / customer', 'clima': 'climate / weather',
  'clínica': 'clinic', 'cobrar': 'to charge / collect',
  'cocina': 'kitchen / cooking', 'cocinar': 'to cook', 'cocinero': 'cook / chef',
  'coche': 'car', 'código': 'code', 'coger': 'to take / grab',
  'cola': 'tail / queue / glue', 'colección': 'collection',
  'colegio': 'school', 'colgar': 'to hang', 'colina': 'hill',
  'collar': 'necklace', 'colocar': 'to place / put',
  'colombiano': 'Colombian', 'color': 'color', 'columna': 'column',
  'combatir': 'to fight / combat', 'combinación': 'combination',
  'combinar': 'to combine', 'comedor': 'dining room',
  'comentar': 'to comment', 'comentario': 'comment',
  'comenzar': 'to begin / start', 'comer': 'to eat',
  'comercial': 'commercial', 'comercio': 'commerce / trade',
  'comida': 'food / meal', 'comienzo': 'beginning',
  'comisión': 'commission', 'como': 'like / as / how',
  'cómo': 'how', 'cómodo': 'comfortable', 'compañero': 'companion / partner',
  'compañía': 'company', 'comparar': 'to compare',
  'compartir': 'to share', 'competencia': 'competition / competence',
  'competir': 'to compete', 'complejo': 'complex',
  'completar': 'to complete', 'completo': 'complete / full',
  'complicado': 'complicated', 'componer': 'to compose',
  'comportamiento': 'behavior', 'compra': 'purchase',
  'comprar': 'to buy', 'comprender': 'to understand',
  'comprobar': 'to check / verify', 'compromiso': 'commitment',
  'computadora': 'computer', 'común': 'common',
  'comunicación': 'communication', 'comunicar': 'to communicate',
  'comunidad': 'community', 'con': 'with',
  'concentrar': 'to concentrate', 'concepto': 'concept',
  'conciencia': 'conscience / awareness', 'concierto': 'concert',
  'conclusión': 'conclusion', 'concreto': 'concrete / specific',
  'condición': 'condition', 'conducir': 'to drive',
  'conductor': 'driver', 'conectar': 'to connect',
  'conexión': 'connection', 'confianza': 'trust / confidence',
  'confiar': 'to trust', 'confirmar': 'to confirm',
  'conflicto': 'conflict', 'confundir': 'to confuse',
  'confusión': 'confusion', 'conjunto': 'set / group',
  'conmigo': 'with me', 'conocer': 'to know / meet',
  'conocido': 'known / acquaintance', 'conocimiento': 'knowledge',
  'conquista': 'conquest', 'conseguir': 'to get / achieve',
  'consejo': 'advice / council', 'conservar': 'to preserve / keep',
  'considerar': 'to consider', 'consigo': 'with oneself',
  'constante': 'constant', 'constitución': 'constitution',
  'construir': 'to build', 'construcción': 'construction',
  'consulta': 'consultation', 'consultar': 'to consult',
  'consumir': 'to consume', 'consumo': 'consumption',
  'contacto': 'contact', 'contar': 'to count / tell',
  'contener': 'to contain', 'contenido': 'content',
  'contento': 'happy / content', 'contestar': 'to answer',
  'contexto': 'context', 'contigo': 'with you',
  'continuar': 'to continue', 'continuo': 'continuous',
  'contra': 'against', 'contrario': 'opposite / contrary',
  'contrato': 'contract', 'contribuir': 'to contribute',
  'control': 'control', 'controlar': 'to control',
  'convencer': 'to convince', 'conveniente': 'convenient',
  'conversación': 'conversation', 'conversar': 'to converse',
  'convertir': 'to convert / become', 'copa': 'glass / cup / trophy',
  'copia': 'copy', 'copiar': 'to copy', 'corazón': 'heart',
  'corbata': 'tie', 'cordero': 'lamb', 'corona': 'crown',
  'correcto': 'correct', 'corregir': 'to correct',
  'correo': 'mail / email', 'correr': 'to run',
  'corresponder': 'to correspond', 'corriente': 'current / ordinary',
  'cortar': 'to cut', 'corte': 'cut / court',
  'cortina': 'curtain', 'corto': 'short',
  'cosa': 'thing', 'cosecha': 'harvest / crop',
  'costa': 'coast', 'costar': 'to cost', 'costumbre': 'custom / habit',
  'crear': 'to create', 'crecer': 'to grow',
  'crecimiento': 'growth', 'crédito': 'credit',
  'creer': 'to believe', 'criado': 'servant',
  'criar': 'to raise / breed', 'crimen': 'crime',
  'crisis': 'crisis', 'cristal': 'glass / crystal',
  'crítica': 'criticism / review', 'criticar': 'to criticize',
  'cruce': 'crossing / intersection', 'cruel': 'cruel',
  'cruz': 'cross', 'cruzar': 'to cross',
  'cuaderno': 'notebook', 'cuadra': 'block (street)',
  'cuadro': 'painting / picture / chart', 'cual': 'which',
  'cuál': 'which', 'cualidad': 'quality / trait',
  'cualquier': 'any', 'cualquiera': 'anyone / whichever',
  'cuando': 'when', 'cuándo': 'when (question)',
  'cuanto': 'as much as', 'cuánto': 'how much',
  'cuántos': 'how many', 'cuarto': 'room / quarter / fourth',
  'cuatro': 'four', 'cubrir': 'to cover',
  'cuchara': 'spoon', 'cuchillo': 'knife',
  'cuello': 'neck', 'cuenta': 'account / bill / count',
  'cuento': 'story / tale', 'cuerda': 'rope / string',
  'cuero': 'leather', 'cuerpo': 'body',
  'cuesta': 'slope / it costs', 'cueva': 'cave',
  'cuidado': 'care / careful', 'cuidar': 'to take care of',
  'culpa': 'blame / fault / guilt', 'culpable': 'guilty',
  'cultivar': 'to cultivate / grow', 'cultura': 'culture',
  'cultural': 'cultural', 'cumbre': 'summit / peak',
  'cumpleaños': 'birthday', 'cumplir': 'to fulfill / turn (age)',
  'cura': 'cure / priest', 'curar': 'to cure / heal',
  'curiosidad': 'curiosity', 'curioso': 'curious',
  'curso': 'course', 'curva': 'curve',
  // --- D ---
  'dama': 'lady', 'daño': 'damage / harm', 'dar': 'to give',
  'dato': 'data / fact', 'datos': 'data', 'de': 'of / from',
  'debajo': 'under / beneath', 'deber': 'must / to owe / duty',
  'debido': 'due to / proper', 'débil': 'weak',
  'decidir': 'to decide', 'decir': 'to say / tell',
  'decisión': 'decision', 'declarar': 'to declare',
  'dedicar': 'to dedicate', 'dedo': 'finger / toe',
  'defender': 'to defend', 'defensa': 'defense',
  'definir': 'to define', 'dejar': 'to leave / let / stop',
  'del': 'of the', 'delante': 'in front', 'delgado': 'thin / slim',
  'delicado': 'delicate', 'delicioso': 'delicious',
  'delito': 'crime / offense', 'demanda': 'demand / lawsuit',
  'demás': 'the rest / others', 'demasiado': 'too much',
  'democracia': 'democracy', 'demostrar': 'to demonstrate',
  'dentista': 'dentist', 'dentro': 'inside / within',
  'departamento': 'department / apartment', 'depender': 'to depend',
  'deporte': 'sport', 'deportivo': 'sporty / sports',
  'depositar': 'to deposit', 'depósito': 'deposit / tank',
  'derecho': 'right / law / straight', 'derecha': 'right (direction)',
  'desafío': 'challenge', 'desarrollar': 'to develop',
  'desarrollo': 'development', 'desastre': 'disaster',
  'desayunar': 'to have breakfast', 'desayuno': 'breakfast',
  'descansar': 'to rest', 'descanso': 'rest / break',
  'describir': 'to describe', 'descripción': 'description',
  'descubrir': 'to discover', 'descuento': 'discount',
  'desde': 'from / since', 'desear': 'to wish / desire',
  'desempeñar': 'to perform / play a role', 'desempleo': 'unemployment',
  'deseo': 'wish / desire', 'desesperado': 'desperate',
  'desgracia': 'misfortune', 'desierto': 'desert',
  'despacio': 'slowly', 'despedir': 'to fire / say goodbye',
  'despertar': 'to wake up', 'después': 'after / later',
  'destino': 'destination / destiny', 'destruir': 'to destroy',
  'detalle': 'detail', 'detener': 'to stop / detain',
  'detrás': 'behind', 'deuda': 'debt',
  'devolver': 'to return (something)', 'día': 'day',
  'diablo': 'devil', 'diálogo': 'dialogue',
  'diario': 'daily / diary', 'dibujar': 'to draw',
  'dibujo': 'drawing', 'diccionario': 'dictionary',
  'diciembre': 'December', 'diente': 'tooth',
  'dieta': 'diet', 'diferencia': 'difference',
  'diferente': 'different', 'difícil': 'difficult',
  'dificultad': 'difficulty', 'digital': 'digital',
  'dinero': 'money', 'dirección': 'direction / address',
  'directo': 'direct', 'director': 'director / manager',
  'dirigir': 'to direct / manage', 'disciplina': 'discipline',
  'disco': 'disc / record', 'discurso': 'speech',
  'discusión': 'discussion / argument', 'discutir': 'to discuss / argue',
  'diseñar': 'to design', 'diseño': 'design',
  'disfrutar': 'to enjoy', 'disponer': 'to have available',
  'disponible': 'available', 'distancia': 'distance',
  'distinguir': 'to distinguish', 'distinto': 'different / distinct',
  'distribuir': 'to distribute', 'distrito': 'district',
  'diversión': 'fun / entertainment', 'diverso': 'diverse / various',
  'divertido': 'fun / funny', 'divertir': 'to amuse / have fun',
  'dividir': 'to divide', 'divorcio': 'divorce',
  'doble': 'double', 'doctor': 'doctor', 'doctora': 'doctor (f)',
  'documento': 'document', 'dolor': 'pain',
  'dominar': 'to dominate / master', 'domingo': 'Sunday',
  'don': 'Mr. (title)', 'doña': 'Mrs. (title)',
  'donde': 'where', 'dónde': 'where (question)',
  'dormir': 'to sleep', 'dormitorio': 'bedroom',
  'dos': 'two', 'drama': 'drama',
  'droga': 'drug', 'ducha': 'shower',
  'duda': 'doubt', 'dudar': 'to doubt',
  'dueño': 'owner', 'dulce': 'sweet / candy',
  'durante': 'during', 'durar': 'to last',
  'duro': 'hard / tough',
  // --- E ---
  'e': 'and (before i/hi)', 'echar': 'to throw / pour',
  'economía': 'economy', 'económico': 'economic / affordable',
  'edad': 'age', 'edición': 'edition', 'edificio': 'building',
  'educación': 'education', 'educar': 'to educate',
  'efecto': 'effect', 'eficaz': 'effective / efficient',
  'ejemplo': 'example', 'ejército': 'army',
  'el': 'the (m)', 'él': 'he', 'elaborar': 'to elaborate / make',
  'elección': 'election / choice', 'electricidad': 'electricity',
  'eléctrico': 'electric', 'electrónico': 'electronic',
  'elegante': 'elegant', 'elegir': 'to choose',
  'elemento': 'element', 'eliminar': 'to eliminate',
  'ella': 'she', 'ellas': 'they (f)', 'ellos': 'they (m)',
  'embajada': 'embassy', 'embarazo': 'pregnancy',
  'emergencia': 'emergency', 'emisión': 'emission / broadcast',
  'emoción': 'emotion', 'emocional': 'emotional',
  'emocionante': 'exciting', 'empezar': 'to start / begin',
  'empleado': 'employee', 'empleo': 'employment / job',
  'empresa': 'company / business', 'empresario': 'entrepreneur / businessman',
  'empujar': 'to push', 'en': 'in / on / at',
  'enamorado': 'in love', 'encantado': 'delighted / enchanted',
  'encantar': 'to love (something)', 'encanto': 'charm',
  'encargado': 'person in charge', 'encargar': 'to order / put in charge',
  'encender': 'to turn on / light', 'encerrar': 'to lock up / enclose',
  'encima': 'on top / above', 'encontrar': 'to find',
  'encuentro': 'meeting / encounter', 'enemigo': 'enemy',
  'energía': 'energy', 'enero': 'January',
  'enfermedad': 'illness / disease', 'enfermero': 'nurse',
  'enfermo': 'sick / ill', 'enfocar': 'to focus',
  'enfoque': 'approach / focus', 'enfrentar': 'to face / confront',
  'enfrente': 'in front / across', 'engañar': 'to deceive',
  'enorme': 'enormous', 'enriquecer': 'to enrich',
  'ensalada': 'salad', 'ensayar': 'to rehearse',
  'ensayo': 'essay / rehearsal', 'enseñar': 'to teach / show',
  'enseñanza': 'teaching / education', 'entender': 'to understand',
  'enterar': 'to find out', 'entero': 'whole / entire',
  'enterrar': 'to bury', 'entonces': 'then / so',
  'entrada': 'entrance / ticket', 'entrar': 'to enter',
  'entre': 'between / among', 'entregar': 'to deliver / hand over',
  'entrenador': 'coach / trainer', 'entrenar': 'to train',
  'entrenamiento': 'training', 'entrevista': 'interview',
  'entusiasmo': 'enthusiasm', 'enviar': 'to send',
  'envidia': 'envy', 'envolver': 'to wrap',
  'época': 'era / period / season', 'equilibrio': 'balance / equilibrium',
  'equipo': 'team / equipment', 'equivocado': 'wrong / mistaken',
  'equivocarse': 'to be wrong / make a mistake', 'error': 'error / mistake',
  'es': 'is', 'esa': 'that (f)', 'escala': 'scale / stopover',
  'escalera': 'stairs / ladder', 'escándalo': 'scandal',
  'escapar': 'to escape', 'escena': 'scene',
  'escenario': 'stage / scenario', 'escoger': 'to choose',
  'escolar': 'school (adj)', 'esconder': 'to hide',
  'escribir': 'to write', 'escritor': 'writer',
  'escritorio': 'desk', 'escritura': 'writing',
  'escuchar': 'to listen', 'escuela': 'school',
  'escultura': 'sculpture', 'ese': 'that',
  'esfuerzo': 'effort', 'eso': 'that (neuter)',
  'espacio': 'space', 'espalda': 'back (body)',
  'español': 'Spanish', 'especial': 'special',
  'especialista': 'specialist', 'especie': 'species / kind',
  'específico': 'specific', 'espectáculo': 'show / spectacle',
  'espejo': 'mirror', 'esperanza': 'hope',
  'esperar': 'to wait / hope / expect', 'espíritu': 'spirit',
  'esposa': 'wife', 'esposo': 'husband',
  'esquí': 'skiing', 'esquina': 'corner',
  'esta': 'this (f)', 'estable': 'stable',
  'establecer': 'to establish', 'estación': 'station / season',
  'estado': 'state / status', 'estadounidense': 'American (US)',
  'estante': 'shelf', 'estar': 'to be (state)',
  'este': 'this / east', 'estilo': 'style',
  'estimar': 'to estimate / esteem', 'estirar': 'to stretch',
  'esto': 'this (neuter)', 'estómago': 'stomach',
  'estrategia': 'strategy', 'estrecho': 'narrow / tight',
  'estrella': 'star', 'estrés': 'stress',
  'estructura': 'structure', 'estudiante': 'student',
  'estudiar': 'to study', 'estudio': 'study / studio',
  'etapa': 'stage / phase', 'eterno': 'eternal',
  'europeo': 'European', 'evaluar': 'to evaluate',
  'evento': 'event', 'evidente': 'evident / obvious',
  'evitar': 'to avoid', 'evolución': 'evolution',
  'exacto': 'exact', 'examen': 'exam',
  'examinar': 'to examine', 'excelente': 'excellent',
  'excepción': 'exception', 'exceso': 'excess',
  'excluir': 'to exclude', 'excursión': 'excursion / trip',
  'excusa': 'excuse', 'exigir': 'to demand / require',
  'existir': 'to exist', 'éxito': 'success',
  'exitoso': 'successful', 'experiencia': 'experience',
  'experto': 'expert', 'explicar': 'to explain',
  'explicación': 'explanation', 'explorar': 'to explore',
  'explosión': 'explosion', 'exportar': 'to export',
  'exposición': 'exhibition', 'expresar': 'to express',
  'expresión': 'expression', 'extender': 'to extend',
  'extensión': 'extension', 'exterior': 'exterior / foreign',
  'extranjero': 'foreign / foreigner', 'extraño': 'strange / stranger',
  'extraordinario': 'extraordinary', 'extremo': 'extreme',
  // --- F ---
  'fábrica': 'factory', 'fabricar': 'to manufacture',
  'fácil': 'easy', 'facilitar': 'to facilitate',
  'factor': 'factor', 'factura': 'invoice / bill',
  'facultad': 'faculty / school', 'falda': 'skirt',
  'falso': 'false', 'falta': 'lack / mistake / fault',
  'faltar': 'to be missing / lack', 'fama': 'fame',
  'familia': 'family', 'familiar': 'family member / familiar',
  'famoso': 'famous', 'fantasía': 'fantasy',
  'fantástico': 'fantastic', 'farmacia': 'pharmacy',
  'fase': 'phase', 'favor': 'favor',
  'favorito': 'favorite', 'fe': 'faith',
  'febrero': 'February', 'fecha': 'date (calendar)',
  'felicidad': 'happiness', 'felicitar': 'to congratulate',
  'feliz': 'happy', 'femenino': 'feminine',
  'fenómeno': 'phenomenon', 'feo': 'ugly',
  'feria': 'fair / market', 'ferrocarril': 'railroad',
  'festival': 'festival', 'fiable': 'reliable',
  'ficha': 'card / token', 'fiebre': 'fever',
  'fiel': 'faithful / loyal', 'fiesta': 'party / holiday',
  'figura': 'figure / shape', 'fijar': 'to fix / set',
  'fijo': 'fixed', 'fila': 'row / line',
  'filósofo': 'philosopher', 'filosofía': 'philosophy',
  'fin': 'end', 'final': 'final / end',
  'finalmente': 'finally', 'financiero': 'financial',
  'fino': 'fine / thin', 'firma': 'signature / firm',
  'firmar': 'to sign', 'firme': 'firm / steady',
  'físico': 'physical / physicist', 'flaco': 'skinny',
  'flor': 'flower', 'florero': 'vase',
  'fondo': 'bottom / fund / background', 'forma': 'form / shape / way',
  'formación': 'training / formation', 'formal': 'formal',
  'formar': 'to form / train', 'fórmula': 'formula',
  'foro': 'forum', 'fortuna': 'fortune',
  'foto': 'photo', 'fotografía': 'photography / photograph',
  'fracaso': 'failure', 'francés': 'French',
  'frase': 'sentence / phrase', 'frecuencia': 'frequency',
  'frecuente': 'frequent', 'frente': 'front / forehead',
  'fresa': 'strawberry', 'fresco': 'fresh / cool',
  'frío': 'cold', 'frontera': 'border / frontier',
  'fruta': 'fruit', 'fuego': 'fire',
  'fuente': 'source / fountain', 'fuera': 'outside',
  'fuerte': 'strong', 'fuerza': 'force / strength',
  'fuga': 'escape / leak', 'fumar': 'to smoke',
  'función': 'function / show', 'funcionar': 'to work / function',
  'funcionario': 'official / civil servant', 'fundamental': 'fundamental',
  'fundar': 'to found', 'furia': 'fury',
  'fútbol': 'soccer / football', 'futuro': 'future',
  // --- G ---
  'gafas': 'glasses', 'galería': 'gallery',
  'galleta': 'cookie / cracker', 'gallina': 'hen / chicken',
  'gallo': 'rooster', 'ganar': 'to win / earn',
  'ganas': 'desire / urge', 'garaje': 'garage',
  'garantía': 'guarantee', 'garantizar': 'to guarantee',
  'garganta': 'throat', 'gas': 'gas',
  'gasolina': 'gasoline', 'gastar': 'to spend / waste',
  'gasto': 'expense', 'gato': 'cat',
  'general': 'general', 'generación': 'generation',
  'generoso': 'generous', 'genial': 'great / brilliant',
  'gente': 'people', 'geografía': 'geography',
  'gerente': 'manager', 'gesto': 'gesture',
  'gigante': 'giant', 'gimnasio': 'gym',
  'global': 'global', 'globo': 'balloon / globe',
  'gloria': 'glory', 'gobierno': 'government',
  'gol': 'goal (sports)', 'golpe': 'hit / blow / coup',
  'gordo': 'fat', 'gorra': 'cap',
  'gota': 'drop', 'gozar': 'to enjoy',
  'grabar': 'to record', 'gracia': 'grace / humor',
  'gracias': 'thank you', 'grado': 'degree / grade',
  'gran': 'great / big', 'grande': 'big / great',
  'granja': 'farm', 'grasa': 'fat / grease',
  'gratis': 'free (no cost)', 'grave': 'serious / grave',
  'gris': 'gray', 'gritar': 'to shout / scream',
  'grito': 'shout / scream', 'grupo': 'group',
  'guante': 'glove', 'guapo': 'handsome / attractive',
  'guardar': 'to keep / save / store', 'guardia': 'guard',
  'guerra': 'war', 'guía': 'guide',
  'gustar': 'to like / please', 'gusto': 'taste / pleasure',
  // --- H ---
  'ha': 'has (auxiliary)', 'haber': 'to have (auxiliary)',
  'habitación': 'room', 'habitante': 'inhabitant',
  'habitar': 'to inhabit', 'hábito': 'habit',
  'habitual': 'habitual / usual', 'hablar': 'to speak / talk',
  'hace': 'ago / makes / does', 'hacer': 'to do / make',
  'hacia': 'toward', 'hacienda': 'estate / treasury',
  'hallar': 'to find', 'hambre': 'hunger',
  'hamburguesa': 'hamburger', 'han': 'have (auxiliary, they)',
  'harina': 'flour', 'hasta': 'until / up to',
  'hay': 'there is / there are', 'he': 'I have (auxiliary)',
  'helado': 'ice cream / frozen', 'hembra': 'female',
  'herencia': 'inheritance / heritage', 'herida': 'wound / injury',
  'herido': 'injured / wounded', 'hermana': 'sister',
  'hermano': 'brother', 'hermoso': 'beautiful',
  'héroe': 'hero', 'herramienta': 'tool',
  'hervir': 'to boil', 'hielo': 'ice',
  'hierba': 'grass / herb', 'hierro': 'iron',
  'hija': 'daughter', 'hijo': 'son',
  'hijos': 'children / sons', 'hilo': 'thread',
  'himno': 'hymn / anthem', 'hipótesis': 'hypothesis',
  'historia': 'history / story', 'histórico': 'historic',
  'hogar': 'home / hearth', 'hoja': 'leaf / sheet',
  'hola': 'hello', 'hombre': 'man',
  'hombro': 'shoulder', 'honor': 'honor',
  'hora': 'hour / time', 'horario': 'schedule / timetable',
  'horizonte': 'horizon', 'horno': 'oven',
  'horror': 'horror', 'hospital': 'hospital',
  'hotel': 'hotel', 'hoy': 'today',
  'hueco': 'hole / hollow', 'huelga': 'strike',
  'huella': 'footprint / trace', 'hueso': 'bone',
  'huevo': 'egg', 'huir': 'to flee',
  'humanidad': 'humanity', 'humano': 'human',
  'humedad': 'humidity / moisture', 'húmedo': 'humid / damp',
  'humilde': 'humble', 'humor': 'humor / mood',
  'hundir': 'to sink',
  // --- I ---
  'idea': 'idea', 'ideal': 'ideal',
  'identidad': 'identity', 'identificar': 'to identify',
  'idioma': 'language', 'iglesia': 'church',
  'ignorar': 'to ignore', 'igual': 'equal / same',
  'igualdad': 'equality', 'ilegal': 'illegal',
  'iluminación': 'lighting', 'iluminar': 'to illuminate',
  'ilusión': 'illusion / excitement', 'imagen': 'image',
  'imaginar': 'to imagine', 'imaginación': 'imagination',
  'imitar': 'to imitate', 'impacto': 'impact',
  'impedir': 'to prevent / impede', 'imperio': 'empire',
  'imponer': 'to impose', 'importancia': 'importance',
  'importante': 'important', 'importar': 'to matter / import',
  'imposible': 'impossible', 'impresión': 'impression',
  'impresionante': 'impressive', 'impresionar': 'to impress',
  'imprimir': 'to print', 'impuesto': 'tax',
  'impulso': 'impulse', 'incapaz': 'incapable',
  'incendio': 'fire (blaze)', 'incluir': 'to include',
  'incluso': 'even / including', 'incómodo': 'uncomfortable',
  'incorporar': 'to incorporate', 'increíble': 'incredible',
  'independencia': 'independence', 'independiente': 'independent',
  'indicar': 'to indicate', 'índice': 'index / rate',
  'indígena': 'indigenous', 'indio': 'Indian',
  'individual': 'individual', 'industria': 'industry',
  'industrial': 'industrial', 'infantil': 'children\'s / childish',
  'inferior': 'inferior / lower', 'infinito': 'infinite',
  'influencia': 'influence', 'influir': 'to influence',
  'información': 'information', 'informar': 'to inform',
  'informe': 'report', 'ingeniero': 'engineer',
  'inglés': 'English', 'ingrediente': 'ingredient',
  'ingresar': 'to enter / deposit', 'ingreso': 'income / entry',
  'inicial': 'initial', 'iniciar': 'to start / initiate',
  'inicio': 'beginning / start', 'injusticia': 'injustice',
  'inmediato': 'immediate', 'inmenso': 'immense',
  'inmigración': 'immigration', 'inocente': 'innocent',
  'innovación': 'innovation', 'inquietud': 'concern / restlessness',
  'insecto': 'insect', 'insistir': 'to insist',
  'instalar': 'to install', 'instante': 'instant / moment',
  'institución': 'institution', 'instituto': 'institute',
  'instrucción': 'instruction', 'instrumento': 'instrument',
  'inteligencia': 'intelligence', 'inteligente': 'intelligent',
  'intención': 'intention', 'intenso': 'intense',
  'intentar': 'to try / attempt', 'intento': 'attempt',
  'interés': 'interest', 'interesante': 'interesting',
  'interesar': 'to interest', 'interior': 'interior / inner',
  'internacional': 'international', 'internet': 'internet',
  'interno': 'internal', 'interpretar': 'to interpret',
  'intervenir': 'to intervene', 'íntimo': 'intimate',
  'introducir': 'to introduce / insert', 'introducción': 'introduction',
  'inútil': 'useless', 'invasión': 'invasion',
  'inventar': 'to invent', 'invento': 'invention',
  'inversión': 'investment', 'invertir': 'to invest',
  'investigación': 'investigation / research', 'investigar': 'to investigate / research',
  'invierno': 'winter', 'invitación': 'invitation',
  'invitado': 'guest', 'invitar': 'to invite',
  'ir': 'to go', 'isla': 'island',
  'italiano': 'Italian', 'izquierdo': 'left',
  'izquierda': 'left (direction)',
  // --- J ---
  'jabón': 'soap', 'jamás': 'never / ever',
  'jamón': 'ham', 'jardín': 'garden',
  'jefe': 'boss / chief', 'jefa': 'boss (f)',
  'joven': 'young / young person', 'joya': 'jewel',
  'juego': 'game', 'jueves': 'Thursday',
  'juez': 'judge', 'jugador': 'player',
  'jugar': 'to play', 'jugo': 'juice',
  'juguete': 'toy', 'juicio': 'trial / judgment',
  'julio': 'July', 'junio': 'June',
  'juntar': 'to join / gather', 'junto': 'together',
  'juntos': 'together (pl)', 'jurar': 'to swear',
  'justicia': 'justice', 'justo': 'fair / just / exactly',
  'juventud': 'youth', 'juzgar': 'to judge',
  // --- K ---
  'kilo': 'kilo', 'kilómetro': 'kilometer',
  // --- L ---
  'la': 'the (f)', 'labio': 'lip',
  'labor': 'work / labor', 'laboratorio': 'laboratory',
  'lado': 'side', 'ladrillo': 'brick',
  'ladrón': 'thief', 'lago': 'lake',
  'lágrima': 'tear (drop)', 'lamentar': 'to regret',
  'lámpara': 'lamp', 'lana': 'wool',
  'lanzar': 'to throw / launch', 'lápiz': 'pencil',
  'largo': 'long', 'las': 'the (f pl)',
  'lástima': 'pity / shame', 'lata': 'can / tin',
  'lateral': 'lateral / side', 'latino': 'Latin',
  'lavar': 'to wash', 'lavadora': 'washing machine',
  'le': 'to him / to her', 'lección': 'lesson',
  'leche': 'milk', 'lector': 'reader',
  'lectura': 'reading', 'leer': 'to read',
  'legal': 'legal', 'lejano': 'distant / far',
  'lejos': 'far', 'lengua': 'tongue / language',
  'lenguaje': 'language (system)', 'lento': 'slow',
  'leña': 'firewood', 'león': 'lion',
  'les': 'to them', 'lesión': 'injury',
  'letra': 'letter (character)', 'letrero': 'sign',
  'levantar': 'to lift / raise', 'ley': 'law',
  'leyenda': 'legend', 'libertad': 'freedom / liberty',
  'libre': 'free', 'libro': 'book',
  'líder': 'leader', 'ligero': 'light / slight',
  'límite': 'limit', 'limón': 'lemon',
  'limpiar': 'to clean', 'limpio': 'clean',
  'línea': 'line', 'lío': 'mess / trouble',
  'líquido': 'liquid', 'liso': 'smooth / straight',
  'lista': 'list / ready', 'listo': 'ready / clever',
  'literatura': 'literature', 'litro': 'liter',
  'llamar': 'to call', 'llamada': 'call',
  'llano': 'flat / plain', 'llave': 'key',
  'llegada': 'arrival', 'llegar': 'to arrive',
  'llenar': 'to fill', 'lleno': 'full',
  'llevar': 'to carry / wear / take', 'llorar': 'to cry',
  'llover': 'to rain', 'lluvia': 'rain',
  'lo': 'it / him (obj)', 'loco': 'crazy',
  'lógico': 'logical', 'lograr': 'to achieve / manage',
  'logro': 'achievement', 'los': 'the (m pl)',
  'lucha': 'fight / struggle', 'luchar': 'to fight / struggle',
  'lugar': 'place', 'lujo': 'luxury',
  'luna': 'moon', 'lunes': 'Monday',
  'luz': 'light',
  // --- M ---
  'madera': 'wood', 'madre': 'mother',
  'maduro': 'mature / ripe', 'maestro': 'teacher / master',
  'magia': 'magic', 'mágico': 'magical',
  'magnífico': 'magnificent', 'mal': 'bad / badly',
  'maleta': 'suitcase', 'malo': 'bad',
  'mamá': 'mom', 'mancha': 'stain / spot',
  'mandar': 'to send / order', 'mando': 'command / remote',
  'manejar': 'to manage / drive', 'manera': 'way / manner',
  'manga': 'sleeve', 'manifestación': 'demonstration / manifestation',
  'mano': 'hand', 'manta': 'blanket',
  'mantener': 'to maintain / keep', 'mantequilla': 'butter',
  'manual': 'manual', 'manzana': 'apple / block',
  'mañana': 'morning / tomorrow', 'mapa': 'map',
  'máquina': 'machine', 'mar': 'sea',
  'maravilla': 'wonder / marvel', 'maravilloso': 'wonderful / marvelous',
  'marca': 'brand / mark', 'marcar': 'to mark / dial',
  'marcha': 'march / gear', 'marchar': 'to march / go',
  'marco': 'frame / framework', 'marido': 'husband',
  'marinero': 'sailor', 'mariposa': 'butterfly',
  'marrón': 'brown', 'martes': 'Tuesday',
  'marzo': 'March', 'más': 'more / most',
  'masa': 'mass / dough', 'máscara': 'mask',
  'masculino': 'masculine', 'matar': 'to kill',
  'matemáticas': 'mathematics', 'materia': 'matter / subject',
  'material': 'material', 'matrimonio': 'marriage',
  'máximo': 'maximum', 'mayo': 'May',
  'mayor': 'bigger / older / main', 'mayoría': 'majority',
  'me': 'me / myself', 'mecánico': 'mechanic / mechanical',
  'mecanismo': 'mechanism', 'medalla': 'medal',
  'mediano': 'medium', 'medianoche': 'midnight',
  'medicina': 'medicine', 'médico': 'doctor / medical',
  'medida': 'measure / size', 'medio': 'half / middle / means',
  'mediodía': 'noon / midday', 'medir': 'to measure',
  'mejor': 'better / best', 'mejorar': 'to improve',
  'memoria': 'memory', 'mencionar': 'to mention',
  'menor': 'smaller / younger / minor', 'menos': 'less / minus',
  'mensaje': 'message', 'mensual': 'monthly',
  'mente': 'mind', 'mentir': 'to lie',
  'mentira': 'lie', 'menú': 'menu',
  'mercado': 'market', 'merecer': 'to deserve',
  'mes': 'month', 'mesa': 'table',
  'meta': 'goal / finish line', 'metal': 'metal',
  'método': 'method', 'metro': 'meter / subway',
  'mezcla': 'mix / mixture', 'mezclar': 'to mix',
  'mi': 'my', 'mí': 'me (after preposition)',
  'miedo': 'fear', 'miel': 'honey',
  'miembro': 'member', 'mientras': 'while / meanwhile',
  'miércoles': 'Wednesday', 'mil': 'thousand',
  'milagro': 'miracle', 'militar': 'military',
  'millón': 'million', 'mina': 'mine',
  'mineral': 'mineral', 'mínimo': 'minimum',
  'ministerio': 'ministry', 'ministro': 'minister',
  'minoría': 'minority', 'minuto': 'minute',
  'mío': 'mine', 'mirada': 'look / gaze',
  'mirar': 'to look / watch', 'misión': 'mission',
  'mismo': 'same / self', 'misterio': 'mystery',
  'misterioso': 'mysterious', 'mitad': 'half',
  'mito': 'myth', 'mochila': 'backpack',
  'moda': 'fashion', 'modelo': 'model',
  'moderno': 'modern', 'modificar': 'to modify',
  'modo': 'mode / way', 'molestar': 'to bother / annoy',
  'molesto': 'annoying / annoyed', 'momento': 'moment',
  'moneda': 'coin / currency', 'mono': 'monkey / cute',
  'montaña': 'mountain', 'montar': 'to ride / mount / assemble',
  'monte': 'mount / hill', 'montón': 'pile / lots',
  'monumento': 'monument', 'morado': 'purple',
  'moral': 'moral', 'morder': 'to bite',
  'moreno': 'dark-haired / dark-skinned', 'morir': 'to die',
  'mosca': 'fly (insect)', 'mostrar': 'to show',
  'motivo': 'reason / motive', 'moto': 'motorcycle',
  'motor': 'motor / engine', 'mover': 'to move',
  'movimiento': 'movement', 'mozo': 'young man / waiter',
  'muchacho': 'boy / young man', 'muchacha': 'girl / young woman',
  'mucho': 'much / a lot', 'mucha': 'much (f)',
  'muchos': 'many', 'muchas': 'many (f)',
  'mudanza': 'move (relocation)', 'mudar': 'to move / change',
  'mueble': 'furniture', 'muela': 'molar / tooth',
  'muerte': 'death', 'muerto': 'dead',
  'muestra': 'sample / sign', 'mujer': 'woman / wife',
  'multa': 'fine / ticket', 'mundial': 'worldwide / world',
  'mundo': 'world', 'muñeca': 'doll / wrist',
  'municipio': 'municipality', 'mural': 'mural',
  'muro': 'wall', 'músculo': 'muscle',
  'museo': 'museum', 'música': 'music',
  'músico': 'musician', 'muy': 'very',
  // --- N ---
  'nacer': 'to be born', 'nacimiento': 'birth',
  'nación': 'nation', 'nacional': 'national',
  'nada': 'nothing', 'nadar': 'to swim',
  'nadie': 'nobody', 'naranja': 'orange',
  'nariz': 'nose', 'narración': 'narration',
  'narrar': 'to narrate', 'natural': 'natural',
  'naturaleza': 'nature', 'nave': 'ship / nave',
  'navegar': 'to navigate / sail', 'navidad': 'Christmas',
  'necesario': 'necessary', 'necesidad': 'necessity / need',
  'necesitar': 'to need', 'negar': 'to deny',
  'negativo': 'negative', 'negocio': 'business',
  'negociar': 'to negotiate', 'negro': 'black',
  'nervio': 'nerve', 'nervioso': 'nervous',
  'ni': 'neither / nor', 'nido': 'nest',
  'niebla': 'fog', 'nieta': 'granddaughter',
  'nieto': 'grandson', 'nieve': 'snow',
  'ningún': 'no / none', 'ninguno': 'none / no one',
  'ninguna': 'none (f)', 'niña': 'girl / child (f)',
  'niño': 'boy / child', 'niños': 'children',
  'nivel': 'level', 'no': 'no / not',
  'noble': 'noble', 'noche': 'night',
  'nombrar': 'to name / appoint', 'nombre': 'name',
  'normal': 'normal', 'norma': 'rule / norm',
  'norte': 'north', 'nos': 'us / ourselves',
  'nosotros': 'we', 'nota': 'note / grade',
  'notar': 'to notice', 'noticia': 'news',
  'noticias': 'news (pl)', 'novela': 'novel',
  'noveno': 'ninth', 'noviembre': 'November',
  'novio': 'boyfriend / groom', 'novia': 'girlfriend / bride',
  'nube': 'cloud', 'nublado': 'cloudy',
  'nuclear': 'nuclear', 'nudo': 'knot',
  'nuestro': 'our', 'nuestra': 'our (f)',
  'nueve': 'nine', 'nuevo': 'new',
  'nueva': 'new (f)', 'número': 'number',
  'nunca': 'never', 'nutritivo': 'nutritious',
  // --- O ---
  'o': 'or', 'obedecer': 'to obey',
  'objetivo': 'objective / goal', 'objeto': 'object',
  'obligar': 'to force / oblige', 'obligación': 'obligation',
  'obra': 'work (art/construction)', 'obrero': 'worker',
  'observar': 'to observe', 'obstáculo': 'obstacle',
  'obtener': 'to obtain', 'obvio': 'obvious',
  'ocasión': 'occasion / opportunity', 'occidental': 'western',
  'océano': 'ocean', 'octubre': 'October',
  'ocultar': 'to hide / conceal', 'ocupar': 'to occupy',
  'ocupado': 'busy / occupied', 'ocurrir': 'to occur / happen',
  'odiar': 'to hate', 'odio': 'hatred',
  'oeste': 'west', 'ofender': 'to offend',
  'oferta': 'offer / sale', 'oficial': 'official',
  'oficina': 'office', 'oficio': 'trade / craft',
  'ofrecer': 'to offer', 'oído': 'ear (inner) / hearing',
  'oír': 'to hear', 'ojo': 'eye',
  'ola': 'wave', 'oler': 'to smell',
  'olor': 'smell / odor', 'olvidar': 'to forget',
  'olvido': 'forgetfulness', 'once': 'eleven',
  'ópera': 'opera', 'operación': 'operation',
  'operar': 'to operate', 'opinión': 'opinion',
  'opinar': 'to think / have an opinion', 'oportunidad': 'opportunity',
  'oponer': 'to oppose', 'oposición': 'opposition',
  'optar': 'to opt / choose', 'optimista': 'optimistic',
  'orden': 'order', 'ordenar': 'to order / organize',
  'ordenador': 'computer', 'oreja': 'ear (outer)',
  'organismo': 'organism / organization', 'organización': 'organization',
  'organizar': 'to organize', 'orgullo': 'pride',
  'orgulloso': 'proud', 'oriental': 'eastern',
  'origen': 'origin', 'original': 'original',
  'orilla': 'shore / bank', 'oro': 'gold',
  'oscuro': 'dark', 'oso': 'bear',
  'otoño': 'autumn / fall', 'otro': 'other / another',
  'otra': 'other (f)', 'otros': 'others',
  'otras': 'others (f)', 'oveja': 'sheep',
  // --- P ---
  'paciencia': 'patience', 'paciente': 'patient',
  'padre': 'father', 'padres': 'parents',
  'pagar': 'to pay', 'página': 'page',
  'pago': 'payment', 'país': 'country',
  'paisaje': 'landscape', 'pájaro': 'bird',
  'palabra': 'word', 'palacio': 'palace',
  'pálido': 'pale', 'palma': 'palm',
  'palo': 'stick / pole', 'pan': 'bread',
  'panadería': 'bakery', 'pantalla': 'screen',
  'pantalón': 'pants / trousers', 'pantalones': 'pants',
  'pañuelo': 'handkerchief', 'papá': 'dad',
  'papel': 'paper / role', 'paquete': 'package',
  'par': 'pair / couple', 'para': 'for / in order to',
  'parada': 'stop / bus stop', 'paraguas': 'umbrella',
  'parar': 'to stop', 'parecer': 'to seem / appear',
  'pared': 'wall', 'pareja': 'couple / partner',
  'pariente': 'relative', 'parlamento': 'parliament',
  'paro': 'unemployment / stop', 'parque': 'park',
  'párrafo': 'paragraph', 'parte': 'part',
  'participar': 'to participate', 'participación': 'participation',
  'particular': 'particular / private', 'partido': 'game / match / party (political)',
  'partir': 'to depart / split', 'pasado': 'past / last',
  'pasajero': 'passenger', 'pasar': 'to pass / happen / spend (time)',
  'pasaporte': 'passport', 'pasear': 'to take a walk',
  'paseo': 'walk / stroll', 'pasillo': 'hallway / corridor',
  'pasión': 'passion', 'paso': 'step / passage',
  'pasta': 'pasta / paste', 'pastel': 'cake / pastel',
  'pastor': 'shepherd / pastor', 'pata': 'paw / leg (animal)',
  'patata': 'potato', 'patria': 'homeland',
  'patrimonio': 'heritage / patrimony', 'patrón': 'boss / pattern',
  'paz': 'peace', 'pecho': 'chest / breast',
  'pedazo': 'piece', 'pedir': 'to ask for / order',
  'pegar': 'to hit / stick / glue', 'pelear': 'to fight',
  'película': 'movie / film', 'peligro': 'danger',
  'peligroso': 'dangerous', 'pelo': 'hair',
  'pelota': 'ball', 'pena': 'pity / sorrow / penalty',
  'pensar': 'to think', 'pensamiento': 'thought',
  'pensión': 'pension / guesthouse', 'peor': 'worse / worst',
  'pequeño': 'small / little', 'pequeña': 'small (f)',
  'pera': 'pear', 'percibir': 'to perceive',
  'perder': 'to lose', 'pérdida': 'loss',
  'perdón': 'sorry / pardon', 'perdonar': 'to forgive',
  'perfecto': 'perfect', 'perfil': 'profile',
  'perfume': 'perfume', 'periódico': 'newspaper',
  'periodista': 'journalist', 'período': 'period',
  'permiso': 'permission', 'permitir': 'to allow / permit',
  'pero': 'but', 'perro': 'dog',
  'perseguir': 'to chase / pursue', 'persona': 'person',
  'personaje': 'character', 'personal': 'personal / staff',
  'personalidad': 'personality', 'perspectiva': 'perspective',
  'pertenecer': 'to belong', 'pesado': 'heavy / boring',
  'pesar': 'to weigh / despite', 'pesca': 'fishing',
  'pescado': 'fish (food)', 'pescar': 'to fish',
  'peso': 'weight / peso (currency)', 'petición': 'request / petition',
  'petróleo': 'oil / petroleum', 'pez': 'fish (alive)',
  'piano': 'piano', 'pie': 'foot',
  'piedra': 'stone / rock', 'piel': 'skin / leather',
  'pierna': 'leg', 'pieza': 'piece / room',
  'piloto': 'pilot', 'pintar': 'to paint',
  'pintor': 'painter', 'pintura': 'painting / paint',
  'piña': 'pineapple', 'piscina': 'swimming pool',
  'piso': 'floor / apartment', 'pista': 'clue / track / runway',
  'placer': 'pleasure', 'plan': 'plan',
  'planchar': 'to iron', 'planeta': 'planet',
  'plano': 'flat / plan / map', 'planta': 'plant / floor',
  'plantar': 'to plant', 'plantear': 'to raise / pose',
  'plata': 'silver / money', 'plataforma': 'platform',
  'plátano': 'banana / plantain', 'plato': 'plate / dish',
  'playa': 'beach', 'plaza': 'square / plaza',
  'plazo': 'deadline / term', 'pleno': 'full / complete',
  'pluma': 'feather / pen', 'población': 'population',
  'pobre': 'poor', 'pobreza': 'poverty',
  'poco': 'little / few', 'poca': 'little (f)',
  'pocos': 'few', 'pocas': 'few (f)',
  'poder': 'to be able / can / power', 'poderoso': 'powerful',
  'poema': 'poem', 'poesía': 'poetry',
  'poeta': 'poet', 'policía': 'police / police officer',
  'política': 'politics / policy', 'político': 'political / politician',
  'pollo': 'chicken', 'polvo': 'dust / powder',
  'poner': 'to put / place', 'popular': 'popular',
  'por': 'for / by / through', 'porcentaje': 'percentage',
  'porción': 'portion', 'porque': 'because',
  'porqué': 'reason', 'portal': 'portal / entrance',
  'portero': 'doorman / goalkeeper', 'porvenir': 'future',
  'posibilidad': 'possibility', 'posible': 'possible',
  'posición': 'position', 'positivo': 'positive',
  'posterior': 'subsequent / posterior', 'postre': 'dessert',
  'potencia': 'power / potential', 'práctica': 'practice',
  'practicar': 'to practice', 'práctico': 'practical',
  'precio': 'price', 'precioso': 'precious / beautiful',
  'preciso': 'precise / necessary', 'preferir': 'to prefer',
  'pregunta': 'question', 'preguntar': 'to ask (a question)',
  'premio': 'prize / award', 'prensa': 'press',
  'preocupación': 'worry / concern', 'preocupar': 'to worry',
  'preparar': 'to prepare', 'preparación': 'preparation',
  'presencia': 'presence', 'presentar': 'to present / introduce',
  'presentación': 'presentation', 'presente': 'present',
  'presidente': 'president', 'presión': 'pressure',
  'préstamo': 'loan', 'prestar': 'to lend',
  'presupuesto': 'budget', 'pretender': 'to intend / claim',
  'prevenir': 'to prevent', 'previo': 'previous / prior',
  'primario': 'primary', 'primavera': 'spring',
  'primero': 'first', 'primera': 'first (f)',
  'primo': 'cousin', 'princesa': 'princess',
  'principal': 'main / principal', 'príncipe': 'prince',
  'principio': 'beginning / principle', 'prioridad': 'priority',
  'prisa': 'hurry', 'prisión': 'prison',
  'privado': 'private', 'privilegio': 'privilege',
  'probable': 'probable', 'probar': 'to try / taste / prove',
  'problema': 'problem', 'procedimiento': 'procedure',
  'proceso': 'process', 'producción': 'production',
  'producir': 'to produce', 'producto': 'product',
  'productor': 'producer', 'profesión': 'profession',
  'profesional': 'professional', 'profesor': 'professor / teacher',
  'profesora': 'professor (f) / teacher (f)', 'profundo': 'deep / profound',
  'programa': 'program', 'programar': 'to program / schedule',
  'progreso': 'progress', 'prohibir': 'to prohibit / forbid',
  'promesa': 'promise', 'prometer': 'to promise',
  'promoción': 'promotion', 'pronto': 'soon',
  'pronunciar': 'to pronounce', 'propiedad': 'property',
  'propio': 'own', 'proponer': 'to propose',
  'proporción': 'proportion', 'proporcionar': 'to provide',
  'propósito': 'purpose', 'propuesta': 'proposal',
  'prosperidad': 'prosperity', 'protección': 'protection',
  'proteger': 'to protect', 'protesta': 'protest',
  'protestar': 'to protest', 'provecho': 'benefit / profit',
  'provincia': 'province', 'provocar': 'to provoke / cause',
  'próximo': 'next / near', 'proyecto': 'project',
  'prueba': 'test / proof / trial', 'publicar': 'to publish',
  'publicidad': 'advertising / publicity', 'público': 'public',
  'pueblo': 'town / people', 'puente': 'bridge',
  'puerta': 'door', 'puerto': 'port / harbor',
  'pues': 'well / since / then', 'puesto': 'position / post / stand',
  'pulgar': 'thumb', 'pulmón': 'lung',
  'punto': 'point / dot', 'puro': 'pure',
  // --- Q ---
  'que': 'that / which / than', 'qué': 'what',
  'quedar': 'to stay / remain / be left', 'quejar': 'to complain',
  'queja': 'complaint', 'quemar': 'to burn',
  'querer': 'to want / love', 'querido': 'dear / beloved',
  'queso': 'cheese', 'quien': 'who',
  'quién': 'who (question)', 'quieto': 'still / quiet',
  'química': 'chemistry', 'quince': 'fifteen',
  'quitar': 'to remove / take away',
  // --- R ---
  'rabia': 'rage / rabies', 'ración': 'portion / ration',
  'radio': 'radio / radius', 'raíz': 'root',
  'rama': 'branch', 'ramo': 'bouquet / branch',
  'rango': 'rank / range', 'rápido': 'fast / quick',
  'raro': 'rare / strange', 'rasgo': 'feature / trait',
  'rato': 'while / moment', 'ratón': 'mouse',
  'rayo': 'ray / lightning', 'raza': 'race (people) / breed',
  'razón': 'reason', 'razonable': 'reasonable',
  'reacción': 'reaction', 'reaccionar': 'to react',
  'real': 'real / royal', 'realidad': 'reality',
  'realizar': 'to carry out / achieve', 'realmente': 'really',
  'rebelde': 'rebel', 'receta': 'recipe / prescription',
  'recibir': 'to receive', 'recibo': 'receipt',
  'reciente': 'recent', 'recoger': 'to pick up / collect',
  'recomendar': 'to recommend', 'recomendación': 'recommendation',
  'reconocer': 'to recognize', 'recordar': 'to remember / remind',
  'recorrer': 'to travel through', 'recorrido': 'route / journey',
  'recreo': 'recess / recreation', 'recto': 'straight',
  'recuerdo': 'memory / souvenir', 'recurso': 'resource',
  'red': 'network / net', 'redactar': 'to write / draft',
  'reducir': 'to reduce', 'referencia': 'reference',
  'referir': 'to refer', 'reflejar': 'to reflect',
  'reflejo': 'reflection / reflex', 'reforma': 'reform',
  'refresco': 'soft drink / refreshment', 'refrigerador': 'refrigerator',
  'refugio': 'shelter / refuge', 'regalar': 'to give (a gift)',
  'regalo': 'gift / present', 'regar': 'to water / irrigate',
  'región': 'region', 'regional': 'regional',
  'regla': 'rule / ruler', 'regresar': 'to return / go back',
  'regreso': 'return', 'regular': 'regular / so-so',
  'reina': 'queen', 'reino': 'kingdom',
  'reír': 'to laugh', 'relación': 'relationship / relation',
  'relacionar': 'to relate', 'relajar': 'to relax',
  'religión': 'religion', 'religioso': 'religious',
  'reloj': 'clock / watch', 'remedio': 'remedy',
  'rendir': 'to yield / perform', 'renovar': 'to renew',
  'renta': 'rent / income', 'renunciar': 'to resign / give up',
  'reparar': 'to repair', 'repartir': 'to distribute / share',
  'repasar': 'to review', 'repente': 'sudden (de repente = suddenly)',
  'repetir': 'to repeat', 'reportaje': 'report / story',
  'reportar': 'to report', 'representar': 'to represent',
  'representante': 'representative', 'república': 'republic',
  'requerir': 'to require', 'requisito': 'requirement',
  'reserva': 'reservation / reserve', 'reservar': 'to reserve',
  'resfriado': 'cold (illness)', 'residencia': 'residence',
  'resistencia': 'resistance', 'resistir': 'to resist',
  'resolver': 'to solve / resolve', 'respetar': 'to respect',
  'respecto': 'respect / regard', 'respeto': 'respect',
  'respirar': 'to breathe', 'responder': 'to respond / answer',
  'responsabilidad': 'responsibility', 'responsable': 'responsible',
  'respuesta': 'answer / response', 'restaurante': 'restaurant',
  'resto': 'rest / remainder', 'resultado': 'result',
  'resultar': 'to turn out / result', 'resumen': 'summary',
  'retirar': 'to withdraw / remove', 'reto': 'challenge',
  'retorno': 'return', 'retraso': 'delay',
  'retrato': 'portrait', 'reunión': 'meeting / reunion',
  'reunir': 'to gather / meet', 'revelar': 'to reveal',
  'revista': 'magazine', 'revolución': 'revolution',
  'rey': 'king', 'rezar': 'to pray',
  'rico': 'rich / delicious', 'ridículo': 'ridiculous',
  'riesgo': 'risk', 'rincón': 'corner (inside)',
  'río': 'river', 'riqueza': 'wealth / richness',
  'ritmo': 'rhythm', 'rito': 'rite / ritual',
  'robar': 'to steal / rob', 'roca': 'rock',
  'rodar': 'to roll / film', 'rodear': 'to surround',
  'rodilla': 'knee', 'rojo': 'red',
  'rollo': 'roll / bore', 'romano': 'Roman',
  'romper': 'to break', 'ropa': 'clothes / clothing',
  'rosa': 'pink / rose', 'rostro': 'face',
  'roto': 'broken', 'rubio': 'blond',
  'rueda': 'wheel', 'ruido': 'noise',
  'ruina': 'ruin', 'rumbo': 'direction / course',
  'rural': 'rural', 'ruta': 'route',
  'rutina': 'routine',
  // --- S ---
  'sábado': 'Saturday', 'saber': 'to know (facts)',
  'sabio': 'wise', 'sabor': 'flavor / taste',
  'sacar': 'to take out / get', 'saco': 'sack / jacket',
  'sacrificio': 'sacrifice', 'sagrado': 'sacred',
  'sal': 'salt', 'sala': 'room / living room / hall',
  'salario': 'salary', 'salchicha': 'sausage',
  'saldo': 'balance (account)', 'salida': 'exit / departure',
  'salir': 'to go out / leave', 'salsa': 'sauce / salsa',
  'saltar': 'to jump', 'salto': 'jump',
  'salud': 'health', 'saludable': 'healthy',
  'saludar': 'to greet', 'saludo': 'greeting',
  'salvaje': 'wild / savage', 'salvar': 'to save / rescue',
  'san': 'saint', 'sangre': 'blood',
  'sano': 'healthy', 'santo': 'saint / holy',
  'satisfacción': 'satisfaction', 'satisfecho': 'satisfied',
  'secar': 'to dry', 'sección': 'section',
  'seco': 'dry', 'secretario': 'secretary',
  'secreto': 'secret', 'sector': 'sector',
  'secuencia': 'sequence', 'secundario': 'secondary',
  'sed': 'thirst', 'seda': 'silk',
  'seguida': 'continued (en seguida = right away)',
  'seguir': 'to follow / continue', 'según': 'according to',
  'segundo': 'second', 'seguridad': 'security / safety',
  'seguro': 'sure / safe / insurance', 'seis': 'six',
  'selección': 'selection', 'seleccionar': 'to select',
  'selva': 'jungle / forest', 'semana': 'week',
  'semanal': 'weekly', 'semejante': 'similar',
  'semilla': 'seed', 'sencillo': 'simple / single',
  'sendero': 'path / trail', 'sensación': 'sensation / feeling',
  'sensible': 'sensitive', 'sentar': 'to sit / seat',
  'sentido': 'sense / meaning / direction', 'sentimiento': 'feeling',
  'sentir': 'to feel', 'señal': 'signal / sign',
  'señalar': 'to point out / indicate', 'señor': 'Mr. / sir',
  'señora': 'Mrs. / madam', 'separar': 'to separate',
  'septiembre': 'September', 'ser': 'to be (identity)',
  'serie': 'series', 'serio': 'serious',
  'serpiente': 'snake', 'servicio': 'service',
  'servir': 'to serve', 'sesión': 'session',
  'setenta': 'seventy', 'severo': 'severe / strict',
  'si': 'if', 'sí': 'yes',
  'siempre': 'always', 'sierra': 'mountain range / saw',
  'siete': 'seven', 'siglo': 'century',
  'significado': 'meaning', 'significar': 'to mean',
  'signo': 'sign / symbol', 'siguiente': 'following / next',
  'silencio': 'silence', 'silencioso': 'silent / quiet',
  'silla': 'chair', 'sillón': 'armchair',
  'símbolo': 'symbol', 'similar': 'similar',
  'simpático': 'nice / friendly', 'simple': 'simple',
  'sin': 'without', 'sincero': 'sincere',
  'sino': 'but rather', 'sinónimo': 'synonym',
  'síntoma': 'symptom', 'sistema': 'system',
  'sitio': 'place / site', 'situación': 'situation',
  'situar': 'to situate / locate', 'sobrar': 'to be left over',
  'sobre': 'on / about / over / envelope', 'sobrevivir': 'to survive',
  'sobrino': 'nephew', 'sobrina': 'niece',
  'social': 'social', 'sociedad': 'society',
  'socio': 'partner / member', 'sol': 'sun',
  'soldado': 'soldier', 'soledad': 'loneliness / solitude',
  'soler': 'to usually do', 'solicitar': 'to request / apply',
  'solicitud': 'application / request', 'sólido': 'solid',
  'solo': 'alone / only', 'sólo': 'only',
  'soltar': 'to release / let go', 'solución': 'solution',
  'solucionar': 'to solve', 'sombra': 'shadow / shade',
  'sombrero': 'hat', 'sonar': 'to sound / ring',
  'sonreír': 'to smile', 'sonrisa': 'smile',
  'soñar': 'to dream', 'sopa': 'soup',
  'soportar': 'to bear / support', 'sordo': 'deaf',
  'sorprender': 'to surprise', 'sorpresa': 'surprise',
  'sospechar': 'to suspect', 'sostener': 'to hold / sustain',
  'su': 'his / her / your / their', 'suave': 'soft / smooth',
  'subir': 'to go up / climb / upload', 'suceder': 'to happen',
  'suceso': 'event', 'sucio': 'dirty',
  'sudar': 'to sweat', 'sudor': 'sweat',
  'suegra': 'mother-in-law', 'suegro': 'father-in-law',
  'sueldo': 'salary', 'suelo': 'floor / ground / soil',
  'sueño': 'dream / sleep', 'suerte': 'luck',
  'suficiente': 'sufficient / enough', 'sufrir': 'to suffer',
  'sugerir': 'to suggest', 'sujeto': 'subject',
  'suma': 'sum', 'sumar': 'to add up',
  'superior': 'superior / upper', 'superar': 'to overcome / surpass',
  'superficie': 'surface', 'supermercado': 'supermarket',
  'suponer': 'to suppose / assume', 'sur': 'south',
  'surgir': 'to arise / emerge', 'suspender': 'to suspend / fail',
  'sustancia': 'substance', 'sustituir': 'to substitute / replace',
  'suyo': 'his / hers / yours / theirs',
  // --- T ---
  'tabla': 'board / table / chart', 'tal': 'such / so',
  'taller': 'workshop', 'tamaño': 'size',
  'también': 'also / too', 'tampoco': 'neither / not either',
  'tan': 'so / such', 'tanto': 'so much',
  'tapa': 'lid / cover / tapa', 'tapar': 'to cover',
  'tardar': 'to take (time) / be late', 'tarde': 'afternoon / late',
  'tarea': 'task / homework', 'tarjeta': 'card',
  'taxi': 'taxi', 'taza': 'cup / mug',
  'te': 'you / yourself', 'té': 'tea',
  'teatro': 'theater', 'techo': 'roof / ceiling',
  'técnica': 'technique', 'técnico': 'technical / technician',
  'tecnología': 'technology', 'tejer': 'to weave / knit',
  'tela': 'fabric / cloth', 'teléfono': 'telephone',
  'televisión': 'television', 'tema': 'topic / theme',
  'temblar': 'to tremble / shake', 'temer': 'to fear',
  'temperatura': 'temperature', 'temporada': 'season',
  'temprano': 'early', 'tendencia': 'tendency / trend',
  'tender': 'to tend / hang out', 'tenedor': 'fork',
  'tener': 'to have', 'tensión': 'tension',
  'teoría': 'theory', 'tercero': 'third',
  'terminar': 'to finish / end', 'término': 'term / end',
  'ternura': 'tenderness', 'terreno': 'land / terrain',
  'terrible': 'terrible', 'territorio': 'territory',
  'terror': 'terror', 'tesis': 'thesis',
  'tesoro': 'treasure', 'testigo': 'witness',
  'texto': 'text', 'ti': 'you (after preposition)',
  'tiempo': 'time / weather', 'tienda': 'store / shop',
  'tierra': 'earth / land / ground', 'tigre': 'tiger',
  'tijeras': 'scissors', 'timbre': 'doorbell / stamp',
  'tío': 'uncle', 'tía': 'aunt',
  'tipo': 'type / guy', 'tirar': 'to throw / pull',
  'título': 'title / degree', 'toalla': 'towel',
  'tocar': 'to touch / play (instrument)', 'todavía': 'still / yet',
  'todo': 'all / everything', 'toda': 'all (f)',
  'todos': 'all / everyone', 'todas': 'all (f pl)',
  'tomar': 'to take / drink', 'tomate': 'tomato',
  'tono': 'tone', 'tonto': 'silly / foolish',
  'tormenta': 'storm', 'toro': 'bull',
  'torre': 'tower', 'tortilla': 'tortilla / omelet',
  'total': 'total', 'totalmente': 'totally',
  'trabajador': 'worker / hardworking', 'trabajar': 'to work',
  'trabajo': 'work / job', 'tradición': 'tradition',
  'tradicional': 'traditional', 'traducción': 'translation',
  'traducir': 'to translate', 'traer': 'to bring',
  'tráfico': 'traffic', 'tragar': 'to swallow',
  'traje': 'suit / outfit', 'trampa': 'trap / cheat',
  'tranquilo': 'calm / quiet', 'tranquilidad': 'tranquility',
  'transformar': 'to transform', 'transporte': 'transport',
  'tras': 'after / behind', 'trasladar': 'to transfer / move',
  'tratamiento': 'treatment', 'tratar': 'to treat / try / deal with',
  'trato': 'deal / treatment', 'través': 'through (a través de)',
  'trece': 'thirteen', 'treinta': 'thirty',
  'tremendo': 'tremendous', 'tren': 'train',
  'tres': 'three', 'tribu': 'tribe',
  'tribunal': 'court / tribunal', 'trigo': 'wheat',
  'triste': 'sad', 'tristeza': 'sadness',
  'triunfar': 'to triumph', 'triunfo': 'triumph / victory',
  'tronco': 'trunk', 'tropa': 'troop',
  'trozo': 'piece / chunk', 'trueno': 'thunder',
  'tú': 'you (informal)', 'tumba': 'tomb / grave',
  'turismo': 'tourism', 'turista': 'tourist',
  'turno': 'turn / shift', 'tuyo': 'yours',
  // --- U ---
  'u': 'or (before o/ho)', 'ubicar': 'to locate',
  'último': 'last / latest', 'última': 'last (f)',
  'un': 'a / an / one', 'una': 'a / an / one (f)',
  'único': 'only / unique', 'unidad': 'unit / unity',
  'uniforme': 'uniform', 'unión': 'union',
  'unir': 'to unite / join', 'universal': 'universal',
  'universidad': 'university', 'universo': 'universe',
  'uno': 'one', 'unos': 'some',
  'unas': 'some (f)', 'urbano': 'urban',
  'urgencia': 'urgency', 'urgente': 'urgent',
  'usar': 'to use', 'uso': 'use',
  'usted': 'you (formal)', 'ustedes': 'you all (formal)',
  'usuario': 'user', 'útil': 'useful',
  'utilizar': 'to utilize / use', 'uva': 'grape',
  // --- V ---
  'vaca': 'cow', 'vacación': 'vacation',
  'vacaciones': 'vacation / holidays', 'vacío': 'empty',
  'valer': 'to be worth', 'válido': 'valid',
  'valiente': 'brave', 'valle': 'valley',
  'valor': 'value / courage', 'valorar': 'to value / assess',
  'variado': 'varied', 'variar': 'to vary',
  'variedad': 'variety', 'varios': 'several / various',
  'varias': 'several (f)', 'varón': 'male',
  'vaso': 'glass (drinking)', 'vecino': 'neighbor',
  'vegetal': 'vegetable / plant', 'vehículo': 'vehicle',
  'veinte': 'twenty', 'vejez': 'old age',
  'vela': 'candle / sail', 'velocidad': 'speed / velocity',
  'vena': 'vein', 'vencer': 'to defeat / overcome',
  'vendedor': 'seller / salesperson', 'vender': 'to sell',
  'venir': 'to come', 'venta': 'sale',
  'ventaja': 'advantage', 'ventana': 'window',
  'ver': 'to see', 'verano': 'summer',
  'verbo': 'verb', 'verdad': 'truth',
  'verdadero': 'true / real', 'verde': 'green',
  'verdura': 'vegetable', 'vergüenza': 'shame / embarrassment',
  'verificar': 'to verify', 'versión': 'version',
  'verso': 'verse', 'vestido': 'dress / dressed',
  'vestir': 'to dress', 'veterinario': 'veterinarian',
  'vez': 'time (occurrence)', 'vía': 'way / route / track',
  'viajar': 'to travel', 'viaje': 'trip / travel',
  'viajero': 'traveler', 'víctima': 'victim',
  'victoria': 'victory', 'vida': 'life',
  'video': 'video', 'vidrio': 'glass (material)',
  'viejo': 'old', 'vieja': 'old (f)',
  'viento': 'wind', 'viernes': 'Friday',
  'vigilar': 'to watch / guard', 'vigor': 'vigor',
  'vinagre': 'vinegar', 'vino': 'wine',
  'violencia': 'violence', 'violento': 'violent',
  'virgen': 'virgin', 'virtud': 'virtue',
  'visión': 'vision', 'visita': 'visit',
  'visitar': 'to visit', 'vista': 'view / sight',
  'vital': 'vital', 'vivienda': 'housing / dwelling',
  'vivir': 'to live', 'vivo': 'alive / lively',
  'vocabulario': 'vocabulary', 'volar': 'to fly',
  'volcán': 'volcano', 'volumen': 'volume',
  'voluntad': 'will / willpower', 'voluntario': 'volunteer / voluntary',
  'volver': 'to return / come back', 'votar': 'to vote',
  'voto': 'vote', 'voz': 'voice',
  'vuelo': 'flight', 'vuelta': 'return / turn / lap',
  // --- Y ---
  'y': 'and', 'ya': 'already / now',
  'yo': 'I',
  // --- Z ---
  'zanahoria': 'carrot', 'zapato': 'shoe',
  'zapatilla': 'slipper / sneaker', 'zona': 'zone / area',
  // --- Reflexive & missing verbs ---
  'afeitar': 'to shave', 'afeitarse': 'to shave (oneself)',
  'acostar': 'to put to bed', 'acostarse': 'to go to bed / to lie down',
  'levantarse': 'to get up',
  'sentarse': 'to sit down',
  'duchar': 'to shower', 'ducharse': 'to take a shower',
  'vestirse': 'to get dressed',
  'despertarse': 'to wake up',
  'peinar': 'to comb', 'peinarse': 'to comb one\'s hair',
  'maquillar': 'to apply makeup', 'maquillarse': 'to put on makeup',
  'quejarse': 'to complain',
  'preocuparse': 'to worry',
  'enojar': 'to anger', 'enojarse': 'to get angry',
  'aburrir': 'to bore', 'aburrirse': 'to get bored',
  'mudarse': 'to move (house)',
  'negarse': 'to refuse',
  'arrepentir': 'to make regret', 'arrepentirse': 'to regret',
  'convertirse': 'to become',
  'dedicarse': 'to dedicate oneself',
  'adaptar': 'to adapt', 'adaptarse': 'to adapt',
  'quedarse': 'to stay',
  'dar cuenta': 'to report', 'darse cuenta': 'to realize',
  'irse': 'to leave',
  'reírse': 'to laugh',
  'divertirse': 'to have fun',
  'despedirse': 'to say goodbye',
  'reunirse': 'to meet / get together',
  'desarrollarse': 'to develop',
  'recuperar': 'to recover', 'recuperarse': 'to recover',
  'comunicarse': 'to communicate',
  'comprometer': 'to compromise', 'comprometerse': 'to commit',
  // --- More missing verbs ---
  'abrochar': 'to fasten / to buckle', 'abrocharse': 'to fasten',
  'absorber': 'to absorb', 'actualizar': 'to update',
  'adormecer': 'to make sleepy', 'adormecerse': 'to fall asleep',
  'afectar': 'to affect', 'ajustar': 'to adjust',
  'alegrar': 'to make happy', 'alegrarse': 'to be glad',
  'animar': 'to encourage / to cheer up', 'animarse': 'to cheer up',
  'apetecer': 'to feel like / to crave',
  'aprobar': 'to approve / to pass',
  'asustar': 'to scare', 'asustarse': 'to be scared',
  'atrever': 'to dare', 'atreverse': 'to dare',
  'bañar': 'to bathe', 'bañarse': 'to bathe / swim',
  'callar': 'to be quiet', 'callarse': 'to shut up',
  'cansar': 'to tire', 'cansarse': 'to get tired',
  'dar': 'to give', 'darse': 'to give oneself',
  'despedir': 'to fire / to say goodbye',
  'divertir': 'to amuse', 'divertir': 'to amuse',
  'enamorar': 'to charm', 'enamorarse': 'to fall in love',
  'enfadar': 'to anger', 'enfadarse': 'to get angry',
  'equivocar': 'to make a mistake', 'equivocarse': 'to be wrong',
  'esforzar': 'to strain', 'esforzarse': 'to make an effort',
  'estacionar': 'to park', 'inaugurar': 'to inaugurate',
  'matricular': 'to register', 'matricularse': 'to enroll',
  'negar': 'to deny', 'olvidar': 'to forget', 'olvidarse': 'to forget',
  'oponer': 'to oppose', 'oponerse': 'to oppose',
  'portar': 'to carry', 'portarse': 'to behave',
  'quedar': 'to remain / to be left',
  'referir': 'to refer', 'referirse': 'to refer to',
  'relajar': 'to relax', 'relajarse': 'to relax',
  'retirar': 'to remove / to withdraw', 'retirarse': 'to retire / to withdraw',
  'sentar': 'to seat', 'sentir': 'to feel', 'sentirse': 'to feel',
  'tropezar': 'to trip / to stumble',
};

// ============================================================
// 5b. Irregular verb forms → infinitive map
// ============================================================
const IRREGULAR_FORMS = {
  // --- ser ---
  'soy': 'ser', 'eres': 'ser', 'somos': 'ser', 'sois': 'ser', 'son': 'ser',
  'fui': 'ser', 'fue': 'ser', 'fuimos': 'ser', 'fueron': 'ser',
  'era': 'ser', 'eras': 'ser', 'éramos': 'ser', 'eran': 'ser',
  'sea': 'ser', 'seas': 'ser', 'seamos': 'ser', 'sean': 'ser',
  'seré': 'ser', 'serás': 'ser', 'será': 'ser', 'seremos': 'ser', 'serán': 'ser',
  'sería': 'ser', 'serías': 'ser', 'seríamos': 'ser', 'serían': 'ser',
  'fuera': 'ser', 'fueras': 'ser', 'fuéramos': 'ser', 'fueran': 'ser',
  'fuese': 'ser', 'fuesen': 'ser', 'siendo': 'ser', 'sido': 'ser',
  // --- estar ---
  'estoy': 'estar', 'estás': 'estar', 'está': 'estar', 'estamos': 'estar', 'están': 'estar',
  'estaba': 'estar', 'estabas': 'estar', 'estábamos': 'estar', 'estaban': 'estar',
  'estuve': 'estar', 'estuvo': 'estar', 'estuvimos': 'estar', 'estuvieron': 'estar',
  'esté': 'estar', 'estés': 'estar', 'estemos': 'estar', 'estén': 'estar',
  'estuviera': 'estar', 'estuvieras': 'estar', 'estuviéramos': 'estar', 'estuvieran': 'estar',
  'estaré': 'estar', 'estará': 'estar', 'estaremos': 'estar', 'estarán': 'estar',
  'estaría': 'estar', 'estarían': 'estar',
  // --- ir ---
  'voy': 'ir', 'vas': 'ir', 'va': 'ir', 'vamos': 'ir', 'van': 'ir',
  'iba': 'ir', 'ibas': 'ir', 'íbamos': 'ir', 'iban': 'ir',
  'vaya': 'ir', 'vayas': 'ir', 'vayamos': 'ir', 'vayan': 'ir',
  'iré': 'ir', 'irás': 'ir', 'irá': 'ir', 'iremos': 'ir', 'irán': 'ir',
  'iría': 'ir', 'irías': 'ir', 'iríamos': 'ir', 'irían': 'ir',
  'yendo': 'ir', 'ido': 'ir',
  // --- tener ---
  'tengo': 'tener', 'tienes': 'tener', 'tiene': 'tener', 'tenemos': 'tener', 'tienen': 'tener',
  'tuve': 'tener', 'tuvo': 'tener', 'tuvimos': 'tener', 'tuvieron': 'tener',
  'tenía': 'tener', 'tenías': 'tener', 'teníamos': 'tener', 'tenían': 'tener',
  'tendré': 'tener', 'tendrás': 'tener', 'tendrá': 'tener', 'tendremos': 'tener', 'tendrán': 'tener',
  'tendría': 'tener', 'tendrías': 'tener', 'tendríamos': 'tener', 'tendrían': 'tener',
  'tenga': 'tener', 'tengas': 'tener', 'tengamos': 'tener', 'tengan': 'tener',
  'tuviera': 'tener', 'tuvieras': 'tener', 'tuviéramos': 'tener', 'tuvieran': 'tener',
  'teniendo': 'tener', 'tenido': 'tener',
  // --- hacer ---
  'hago': 'hacer', 'haces': 'hacer', 'hace': 'hacer', 'hacemos': 'hacer', 'hacen': 'hacer',
  'hice': 'hacer', 'hizo': 'hacer', 'hicimos': 'hacer', 'hicieron': 'hacer',
  'hacía': 'hacer', 'hacías': 'hacer', 'hacíamos': 'hacer', 'hacían': 'hacer',
  'haré': 'hacer', 'harás': 'hacer', 'hará': 'hacer', 'haremos': 'hacer', 'harán': 'hacer',
  'haría': 'hacer', 'harías': 'hacer', 'haríamos': 'hacer', 'harían': 'hacer',
  'haga': 'hacer', 'hagas': 'hacer', 'hagamos': 'hacer', 'hagan': 'hacer',
  'hiciera': 'hacer', 'hicieras': 'hacer', 'hiciéramos': 'hacer', 'hicieran': 'hacer',
  'haciendo': 'hacer', 'hecho': 'hacer',
  // --- poder ---
  'puedo': 'poder', 'puedes': 'poder', 'puede': 'poder', 'podemos': 'poder', 'pueden': 'poder',
  'pude': 'poder', 'pudo': 'poder', 'pudimos': 'poder', 'pudieron': 'poder',
  'podía': 'poder', 'podías': 'poder', 'podíamos': 'poder', 'podían': 'poder',
  'podré': 'poder', 'podrás': 'poder', 'podrá': 'poder', 'podremos': 'poder', 'podrán': 'poder',
  'podría': 'poder', 'podrías': 'poder', 'podríamos': 'poder', 'podrían': 'poder',
  'pueda': 'poder', 'puedas': 'poder', 'podamos': 'poder', 'puedan': 'poder',
  'pudiera': 'poder', 'pudieras': 'poder', 'pudiéramos': 'poder', 'pudieran': 'poder',
  'pudiendo': 'poder', 'podido': 'poder',
  // --- decir ---
  'digo': 'decir', 'dices': 'decir', 'dice': 'decir', 'decimos': 'decir', 'dicen': 'decir',
  'dije': 'decir', 'dijo': 'decir', 'dijimos': 'decir', 'dijeron': 'decir',
  'decía': 'decir', 'decías': 'decir', 'decíamos': 'decir', 'decían': 'decir',
  'diré': 'decir', 'dirás': 'decir', 'dirá': 'decir', 'diremos': 'decir', 'dirán': 'decir',
  'diría': 'decir', 'dirías': 'decir', 'diríamos': 'decir', 'dirían': 'decir',
  'diga': 'decir', 'digas': 'decir', 'digamos': 'decir', 'digan': 'decir',
  'dijera': 'decir', 'dijeras': 'decir', 'dijéramos': 'decir', 'dijeran': 'decir',
  'diciendo': 'decir', 'dicho': 'decir',
  // --- poner ---
  'pongo': 'poner', 'pones': 'poner', 'pone': 'poner', 'ponemos': 'poner', 'ponen': 'poner',
  'puse': 'poner', 'puso': 'poner', 'pusimos': 'poner', 'pusieron': 'poner',
  'ponía': 'poner', 'ponías': 'poner', 'poníamos': 'poner', 'ponían': 'poner',
  'pondré': 'poner', 'pondrás': 'poner', 'pondrá': 'poner', 'pondremos': 'poner', 'pondrán': 'poner',
  'pondría': 'poner', 'pondrías': 'poner', 'pondríamos': 'poner', 'pondrían': 'poner',
  'ponga': 'poner', 'pongas': 'poner', 'pongamos': 'poner', 'pongan': 'poner',
  'pusiera': 'poner', 'pusieras': 'poner', 'pusiéramos': 'poner', 'pusieran': 'poner',
  'poniendo': 'poner', 'puesto': 'poner',
  // --- venir ---
  'vengo': 'venir', 'vienes': 'venir', 'viene': 'venir', 'venimos': 'venir', 'vienen': 'venir',
  'vine': 'venir', 'vino': 'venir', 'vinimos': 'venir', 'vinieron': 'venir',
  'venía': 'venir', 'venías': 'venir', 'veníamos': 'venir', 'venían': 'venir',
  'vendré': 'venir', 'vendrás': 'venir', 'vendrá': 'venir', 'vendremos': 'venir', 'vendrán': 'venir',
  'vendría': 'venir', 'vendrías': 'venir', 'vendríamos': 'venir', 'vendrían': 'venir',
  'venga': 'venir', 'vengas': 'venir', 'vengamos': 'venir', 'vengan': 'venir',
  'viniera': 'venir', 'vinieras': 'venir', 'viniéramos': 'venir', 'vinieran': 'venir',
  'viniendo': 'venir', 'venido': 'venir',
  // --- salir ---
  'salgo': 'salir', 'sales': 'salir', 'sale': 'salir', 'salimos': 'salir', 'salen': 'salir',
  'salí': 'salir', 'salió': 'salir', 'salieron': 'salir', 'salía': 'salir',
  'saldré': 'salir', 'saldrás': 'salir', 'saldrá': 'salir', 'saldremos': 'salir', 'saldrán': 'salir',
  'saldría': 'salir', 'saldrías': 'salir', 'saldríamos': 'salir', 'saldrían': 'salir',
  'salga': 'salir', 'salgas': 'salir', 'salgamos': 'salir', 'salgan': 'salir',
  'saliera': 'salir', 'saliéramos': 'salir', 'saliendo': 'salir',
  // --- querer ---
  'quiero': 'querer', 'quieres': 'querer', 'quiere': 'querer', 'queremos': 'querer', 'quieren': 'querer',
  'quise': 'querer', 'quiso': 'querer', 'quisimos': 'querer', 'quisieron': 'querer',
  'quería': 'querer', 'querías': 'querer', 'queríamos': 'querer', 'querían': 'querer',
  'querré': 'querer', 'querrás': 'querer', 'querrá': 'querer', 'querremos': 'querer', 'querrán': 'querer',
  'querría': 'querer', 'querrías': 'querer', 'querríamos': 'querer', 'querrían': 'querer',
  'quiera': 'querer', 'quieras': 'querer', 'queramos': 'querer', 'quieran': 'querer',
  'quisiera': 'querer', 'quisieras': 'querer', 'quisiéramos': 'querer', 'quisieran': 'querer',
  'queriendo': 'querer', 'querido': 'querer',
  // --- saber ---
  'sé': 'saber', 'sabes': 'saber', 'sabe': 'saber', 'sabemos': 'saber', 'saben': 'saber',
  'supe': 'saber', 'supo': 'saber', 'supimos': 'saber', 'supieron': 'saber',
  'sabía': 'saber', 'sabías': 'saber', 'sabíamos': 'saber', 'sabían': 'saber',
  'sabré': 'saber', 'sabrás': 'saber', 'sabrá': 'saber', 'sabremos': 'saber', 'sabrán': 'saber',
  'sabría': 'saber', 'sabrías': 'saber', 'sabríamos': 'saber', 'sabrían': 'saber',
  'sepa': 'saber', 'sepas': 'saber', 'sepamos': 'saber', 'sepan': 'saber',
  'supiera': 'saber', 'supieras': 'saber', 'supiéramos': 'saber', 'supieran': 'saber',
  'sabiendo': 'saber', 'sabido': 'saber',
  // --- dar ---
  'doy': 'dar', 'das': 'dar', 'da': 'dar', 'damos': 'dar', 'dan': 'dar',
  'di': 'dar', 'dio': 'dar', 'dimos': 'dar', 'dieron': 'dar',
  'daba': 'dar', 'dabas': 'dar', 'dábamos': 'dar', 'daban': 'dar',
  'daré': 'dar', 'darás': 'dar', 'dará': 'dar', 'daremos': 'dar', 'darán': 'dar',
  'daría': 'dar', 'darías': 'dar', 'daríamos': 'dar', 'darían': 'dar',
  'dé': 'dar', 'des': 'dar', 'demos': 'dar', 'den': 'dar',
  'diera': 'dar', 'dieras': 'dar', 'diéramos': 'dar', 'dieran': 'dar',
  'dando': 'dar', 'dado': 'dar',
  // --- ver ---
  'veo': 'ver', 'ves': 'ver', 've': 'ver', 'vemos': 'ver', 'ven': 'ver',
  'vi': 'ver', 'vio': 'ver', 'vimos': 'ver', 'vieron': 'ver',
  'veía': 'ver', 'veías': 'ver', 'veíamos': 'ver', 'veían': 'ver',
  'veré': 'ver', 'verás': 'ver', 'verá': 'ver', 'veremos': 'ver', 'verán': 'ver',
  'vería': 'ver', 'verías': 'ver', 'veríamos': 'ver', 'verían': 'ver',
  'vea': 'ver', 'veas': 'ver', 'veamos': 'ver', 'vean': 'ver',
  'viera': 'ver', 'vieras': 'ver', 'viéramos': 'ver', 'vieran': 'ver',
  'viendo': 'ver', 'visto': 'ver',
  // --- haber ---
  'he': 'haber', 'has': 'haber', 'ha': 'haber', 'hemos': 'haber', 'han': 'haber',
  'había': 'haber', 'habías': 'haber', 'habíamos': 'haber', 'habían': 'haber',
  'hubo': 'haber', 'hube': 'haber', 'hubimos': 'haber', 'hubieron': 'haber',
  'habré': 'haber', 'habrás': 'haber', 'habrá': 'haber', 'habremos': 'haber', 'habrán': 'haber',
  'habría': 'haber', 'habrías': 'haber', 'habríamos': 'haber', 'habrían': 'haber',
  'haya': 'haber', 'hayas': 'haber', 'hayamos': 'haber', 'hayan': 'haber',
  'hubiera': 'haber', 'hubieras': 'haber', 'hubiéramos': 'haber', 'hubieran': 'haber',
  'habiendo': 'haber', 'habido': 'haber',
  // --- traer ---
  'traigo': 'traer', 'traes': 'traer', 'trae': 'traer', 'traemos': 'traer', 'traen': 'traer',
  'traje': 'traer', 'trajo': 'traer', 'trajimos': 'traer', 'trajeron': 'traer',
  'traía': 'traer', 'traería': 'traer', 'traerá': 'traer',
  'traiga': 'traer', 'traigas': 'traer', 'traigan': 'traer',
  'trayendo': 'traer', 'traído': 'traer',
  // --- caer ---
  'caigo': 'caer', 'caes': 'caer', 'cae': 'caer', 'caemos': 'caer', 'caen': 'caer',
  'caí': 'caer', 'cayó': 'caer', 'caímos': 'caer', 'cayeron': 'caer',
  'caía': 'caer', 'caería': 'caer', 'caerá': 'caer',
  'caiga': 'caer', 'caigas': 'caer', 'caigan': 'caer',
  'cayendo': 'caer', 'caído': 'caer',
  // --- oír ---
  'oigo': 'oír', 'oyes': 'oír', 'oye': 'oír', 'oímos': 'oír', 'oyen': 'oír',
  'oí': 'oír', 'oyó': 'oír', 'oyeron': 'oír',
  'oía': 'oír', 'oiré': 'oír', 'oiría': 'oír',
  'oiga': 'oír', 'oigas': 'oír', 'oigan': 'oír',
  'oyendo': 'oír', 'oído': 'oír',
  // --- conducir ---
  'conduzco': 'conducir', 'conduces': 'conducir', 'conduce': 'conducir', 'conducimos': 'conducir', 'conducen': 'conducir',
  'conduje': 'conducir', 'condujo': 'conducir', 'condujimos': 'conducir', 'condujeron': 'conducir',
  'conducía': 'conducir', 'conduciré': 'conducir', 'conduciría': 'conducir',
  'conduzca': 'conducir', 'conduzcas': 'conducir', 'conduzcan': 'conducir',
  'conduciendo': 'conducir', 'conducido': 'conducir',
  // --- seguir ---
  'sigo': 'seguir', 'sigues': 'seguir', 'sigue': 'seguir', 'seguimos': 'seguir', 'siguen': 'seguir',
  'seguí': 'seguir', 'siguió': 'seguir', 'siguieron': 'seguir',
  'seguía': 'seguir', 'seguiré': 'seguir', 'seguiría': 'seguir',
  'siga': 'seguir', 'sigas': 'seguir', 'sigan': 'seguir',
  'siguiendo': 'seguir', 'seguido': 'seguir',
  // --- pedir ---
  'pido': 'pedir', 'pides': 'pedir', 'pide': 'pedir', 'pedimos': 'pedir', 'piden': 'pedir',
  'pedí': 'pedir', 'pidió': 'pedir', 'pidieron': 'pedir',
  'pedía': 'pedir', 'pediré': 'pedir', 'pediría': 'pedir',
  'pida': 'pedir', 'pidas': 'pedir', 'pidan': 'pedir',
  'pidiendo': 'pedir', 'pedido': 'pedir',
  // --- dormir ---
  'duermo': 'dormir', 'duermes': 'dormir', 'duerme': 'dormir', 'dormimos': 'dormir', 'duermen': 'dormir',
  'dormí': 'dormir', 'durmió': 'dormir', 'durmieron': 'dormir',
  'dormía': 'dormir', 'dormiré': 'dormir', 'dormiría': 'dormir',
  'duerma': 'dormir', 'duermas': 'dormir', 'duerman': 'dormir',
  'durmiendo': 'dormir', 'dormido': 'dormir',
  // --- morir ---
  'muero': 'morir', 'mueres': 'morir', 'muere': 'morir', 'morimos': 'morir', 'mueren': 'morir',
  'morí': 'morir', 'murió': 'morir', 'murieron': 'morir',
  'moría': 'morir', 'moriré': 'morir', 'moriría': 'morir',
  'muera': 'morir', 'mueras': 'morir', 'mueran': 'morir',
  'muriendo': 'morir', 'muerto': 'morir',
  // --- conocer ---
  'conozco': 'conocer', 'conoces': 'conocer', 'conoce': 'conocer', 'conocemos': 'conocer', 'conocen': 'conocer',
  'conocí': 'conocer', 'conoció': 'conocer', 'conocieron': 'conocer',
  'conocía': 'conocer', 'conoceré': 'conocer', 'conocería': 'conocer',
  'conozca': 'conocer', 'conozcas': 'conocer', 'conozcan': 'conocer',
  'conociendo': 'conocer', 'conocido': 'conocer',
  // --- sentir ---
  'siento': 'sentir', 'sientes': 'sentir', 'siente': 'sentir', 'sentimos': 'sentir', 'sienten': 'sentir',
  'sentí': 'sentir', 'sintió': 'sentir', 'sintieron': 'sentir',
  'sentía': 'sentir', 'sentiré': 'sentir', 'sentiría': 'sentir',
  'sienta': 'sentir', 'sientas': 'sentir', 'sintiéramos': 'sentir', 'sintieran': 'sentir',
  'sintiendo': 'sentir', 'sentido': 'sentir',
  // --- pensar ---
  'pienso': 'pensar', 'piensas': 'pensar', 'piensa': 'pensar', 'pensamos': 'pensar', 'piensan': 'pensar',
  'pensé': 'pensar', 'pensó': 'pensar', 'pensaron': 'pensar',
  'pensaba': 'pensar', 'pensaré': 'pensar', 'pensaría': 'pensar',
  'piense': 'pensar', 'pienses': 'pensar', 'piensen': 'pensar',
  'pensando': 'pensar', 'pensado': 'pensar',
  // --- volver ---
  'vuelvo': 'volver', 'vuelves': 'volver', 'vuelve': 'volver', 'volvemos': 'volver', 'vuelven': 'volver',
  'volví': 'volver', 'volvió': 'volver', 'volvieron': 'volver',
  'volvía': 'volver', 'volveré': 'volver', 'volvería': 'volver',
  'vuelva': 'volver', 'vuelvas': 'volver', 'vuelvan': 'volver',
  'volviendo': 'volver', 'vuelto': 'volver',
  // --- encontrar ---
  'encuentro': 'encontrar', 'encuentras': 'encontrar', 'encuentra': 'encontrar', 'encontramos': 'encontrar', 'encuentran': 'encontrar',
  'encontré': 'encontrar', 'encontró': 'encontrar', 'encontraron': 'encontrar',
  'encontraba': 'encontrar', 'encontraré': 'encontrar', 'encontraría': 'encontrar',
  'encuentre': 'encontrar', 'encuentres': 'encontrar', 'encuentren': 'encontrar',
  'encontrando': 'encontrar', 'encontrado': 'encontrar',
  // --- contar ---
  'cuento': 'contar', 'cuentas': 'contar', 'cuenta': 'contar', 'contamos': 'contar', 'cuentan': 'contar',
  'conté': 'contar', 'contó': 'contar', 'contaron': 'contar',
  'contaba': 'contar', 'contaré': 'contar', 'contaría': 'contar',
  'cuente': 'contar', 'cuentes': 'contar', 'cuenten': 'contar',
  'contando': 'contar', 'contado': 'contar',
  // --- recordar ---
  'recuerdo': 'recordar', 'recuerdas': 'recordar', 'recuerda': 'recordar', 'recordamos': 'recordar', 'recuerdan': 'recordar',
  'recordé': 'recordar', 'recordó': 'recordar', 'recordaron': 'recordar',
  'recordaba': 'recordar', 'recordaré': 'recordar', 'recordaría': 'recordar',
  'recuerde': 'recordar', 'recuerdes': 'recordar', 'recuerden': 'recordar',
  'recordando': 'recordar', 'recordado': 'recordar',
  // --- jugar ---
  'juego': 'jugar', 'juegas': 'jugar', 'juega': 'jugar', 'jugamos': 'jugar', 'juegan': 'jugar',
  'jugué': 'jugar', 'jugó': 'jugar', 'jugaron': 'jugar',
  'jugaba': 'jugar', 'jugaré': 'jugar', 'jugaría': 'jugar',
  'juegue': 'jugar', 'juegues': 'jugar', 'jueguen': 'jugar',
  'jugando': 'jugar', 'jugado': 'jugar',
  // --- empezar ---
  'empiezo': 'empezar', 'empiezas': 'empezar', 'empieza': 'empezar', 'empezamos': 'empezar', 'empiezan': 'empezar',
  'empecé': 'empezar', 'empezó': 'empezar', 'empezaron': 'empezar',
  'empezaba': 'empezar', 'empezaré': 'empezar', 'empezaría': 'empezar',
  'empiece': 'empezar', 'empieces': 'empezar', 'empiecen': 'empezar',
  'empezando': 'empezar', 'empezado': 'empezar',
  // --- entender ---
  'entiendo': 'entender', 'entiendes': 'entender', 'entiende': 'entender', 'entendemos': 'entender', 'entienden': 'entender',
  'entendí': 'entender', 'entendió': 'entender', 'entendieron': 'entender',
  'entendía': 'entender', 'entenderé': 'entender', 'entendería': 'entender',
  'entienda': 'entender', 'entiendas': 'entender', 'entiendan': 'entender',
  'entendiendo': 'entender', 'entendido': 'entender',
  // --- perder ---
  'pierdo': 'perder', 'pierdes': 'perder', 'pierde': 'perder', 'perdemos': 'perder', 'pierden': 'perder',
  'perdí': 'perder', 'perdió': 'perder', 'perdieron': 'perder',
  'perdía': 'perder', 'perderé': 'perder', 'perdería': 'perder',
  'pierda': 'perder', 'pierdas': 'perder', 'pierdan': 'perder',
  'perdiendo': 'perder', 'perdido': 'perder',
  // --- mover ---
  'muevo': 'mover', 'mueves': 'mover', 'mueve': 'mover', 'movemos': 'mover', 'mueven': 'mover',
  'moví': 'mover', 'movió': 'mover', 'movieron': 'mover',
  'movía': 'mover', 'moveré': 'mover', 'movería': 'mover',
  'mueva': 'mover', 'muevas': 'mover', 'muevan': 'mover',
  'moviendo': 'mover', 'movido': 'mover',
  // --- elegir ---
  'elijo': 'elegir', 'eliges': 'elegir', 'elige': 'elegir', 'elegimos': 'elegir', 'eligen': 'elegir',
  'elegí': 'elegir', 'eligió': 'elegir', 'eligieron': 'elegir',
  'elegía': 'elegir', 'elegiré': 'elegir', 'elegiría': 'elegir',
  'elija': 'elegir', 'elijas': 'elegir', 'elijan': 'elegir',
  'eligiendo': 'elegir', 'elegido': 'elegir',
  // --- crecer ---
  'crezco': 'crecer', 'creces': 'crecer', 'crece': 'crecer', 'crecemos': 'crecer', 'crecen': 'crecer',
  'crecí': 'crecer', 'creció': 'crecer', 'crecieron': 'crecer',
  'crecía': 'crecer', 'creceré': 'crecer', 'crecería': 'crecer',
  'crezca': 'crecer', 'crezcas': 'crecer', 'crezcan': 'crecer',
  'creciendo': 'crecer', 'crecido': 'crecer',
  // --- producir ---
  'produzco': 'producir', 'produces': 'producir', 'produce': 'producir', 'producimos': 'producir', 'producen': 'producir',
  'produje': 'producir', 'produjo': 'producir', 'produjimos': 'producir', 'produjeron': 'producir',
  'producía': 'producir', 'produciré': 'producir', 'produciría': 'producir',
  'produzca': 'producir', 'produzcas': 'producir', 'produzcan': 'producir',
  'produciendo': 'producir', 'producido': 'producir',
  // --- destruir ---
  'destruyo': 'destruir', 'destruyes': 'destruir', 'destruye': 'destruir', 'destruimos': 'destruir', 'destruyen': 'destruir',
  'destruí': 'destruir', 'destruyó': 'destruir', 'destruyeron': 'destruir',
  'destruía': 'destruir', 'destruiré': 'destruir', 'destruiría': 'destruir',
  'destruya': 'destruir', 'destruyas': 'destruir', 'destruyan': 'destruir',
  'destruyendo': 'destruir', 'destruido': 'destruir',
  // --- construir ---
  'construyo': 'construir', 'construyes': 'construir', 'construye': 'construir', 'construimos': 'construir', 'construyen': 'construir',
  'construí': 'construir', 'construyó': 'construir', 'construyeron': 'construir',
  'construía': 'construir', 'construiré': 'construir', 'construiría': 'construir',
  'construya': 'construir', 'construyas': 'construir', 'construyan': 'construir',
  'construyendo': 'construir', 'construido': 'construir',
  // --- incluir ---
  'incluyo': 'incluir', 'incluyes': 'incluir', 'incluye': 'incluir', 'incluimos': 'incluir', 'incluyen': 'incluir',
  'incluí': 'incluir', 'incluyó': 'incluir', 'incluyeron': 'incluir',
  'incluía': 'incluir', 'incluiré': 'incluir', 'incluiría': 'incluir',
  'incluya': 'incluir', 'incluyas': 'incluir', 'incluyan': 'incluir',
  'incluyendo': 'incluir', 'incluido': 'incluir',
  // --- huir ---
  'huyo': 'huir', 'huyes': 'huir', 'huye': 'huir', 'huimos': 'huir', 'huyen': 'huir',
  'huí': 'huir', 'huyó': 'huir', 'huyeron': 'huir',
  'huía': 'huir', 'huiré': 'huir', 'huiría': 'huir',
  'huya': 'huir', 'huyas': 'huir', 'huyan': 'huir',
  'huyendo': 'huir', 'huido': 'huir',
  // --- reír ---
  'río': 'reír', 'ríes': 'reír', 'ríe': 'reír', 'reímos': 'reír', 'ríen': 'reír',
  'reí': 'reír', 'rió': 'reír', 'rieron': 'reír',
  'reía': 'reír', 'reiré': 'reír', 'reiría': 'reír',
  'ría': 'reír', 'rías': 'reír', 'rían': 'reír',
  'riendo': 'reír', 'reído': 'reír',
};

// ============================================================
// 5c. Build set of known infinitives from TRANSLATIONS + deck
// ============================================================
const knownInfinitives = new Set();
const infPattern = /^[a-záéíóúüñ]+(ar|er|ir|arse|erse|irse|ír|ér)$/;
for (const key of Object.keys(TRANSLATIONS)) {
  if (infPattern.test(key)) knownInfinitives.add(key);
}
// Also extract infinitives from deck words
for (const w of allWords) {
  if (infPattern.test(w)) knownInfinitives.add(w);
}
console.log('Known infinitives:', knownInfinitives.size);

// ============================================================
// 5d. findInfinitive(word) — resolve conjugated form to infinitive
// ============================================================
function findInfinitive(word) {
  const w = word.toLowerCase();

  // 1. Check irregular forms map first
  if (IRREGULAR_FORMS[w]) return IRREGULAR_FORMS[w];

  // 2. Strip pronoun suffixes (me, te, se, nos, os, le, les, lo, la, los, las, melo, mela, etc.)
  const pronounSuffixes = [
    'melos', 'melas', 'telos', 'telas', 'selos', 'selas', 'noslos', 'noslas',
    'melo', 'mela', 'telo', 'tela', 'selo', 'sela',
    'les', 'los', 'las', 'nos',
    'me', 'te', 'se', 'le', 'lo', 'la', 'os'
  ];
  let stripped = w;
  for (const suffix of pronounSuffixes) {
    if (stripped.endsWith(suffix) && stripped.length > suffix.length + 2) {
      stripped = stripped.slice(0, -suffix.length);
      break;
    }
  }
  // Re-check irregular forms after stripping
  if (stripped !== w && IRREGULAR_FORMS[stripped]) return IRREGULAR_FORMS[stripped];

  // 3. Check if the word is already an infinitive
  if (/^[a-záéíóúüñ]+(ar|er|ir|arse|erse|irse)$/.test(w)) {
    if (knownInfinitives.has(w)) return w;
  }

  // 4. Strip accents for stem matching
  const noAccent = stripped
    .replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i')
    .replace(/ó/g, 'o').replace(/ú/g, 'u');

  // 5. Try removing 1–7 chars from the end and adding -ar/-er/-ir
  const endings = ['ar', 'er', 'ir'];
  for (let cut = 1; cut <= 7 && cut < noAccent.length; cut++) {
    const stem = noAccent.slice(0, -cut);
    if (stem.length < 2) continue;
    for (const ending of endings) {
      const candidate = stem + ending;
      if (knownInfinitives.has(candidate)) return candidate;
      // Try reflexive form too
      const reflexive = candidate + 'se';
      if (knownInfinitives.has(reflexive)) return reflexive;
    }
  }

  // 6. Also try with the full word (no cut) + se for reflexive
  if (knownInfinitives.has(w + 'se')) return w + 'se';

  return null;
}

// ============================================================
// 6. Cognate detection for missing words
// ============================================================
function guessCognate(word) {
  const w = word.toLowerCase();
  // Common Spanish→English cognate transformations
  const transforms = [
    // -ción → -tion
    [/ción$/, 'tion'],
    // -sión → -sion
    [/sión$/, 'sion'],
    // -dad → -ty
    [/dad$/, 'ty'],
    // -mente → -ly
    [/mente$/, 'ly'],
    // -oso → -ous
    [/oso$/, 'ous'],
    // -osa → -ous
    [/osa$/, 'ous'],
    // -ivo → -ive
    [/ivo$/, 'ive'],
    // -iva → -ive
    [/iva$/, 'ive'],
    // -ble → -ble
    [/ble$/, 'ble'],
    // -ncia → -nce
    [/ncia$/, 'nce'],
    // -ncia → -ncy
    [/encia$/, 'ency'],
    // -ancia → -ance
    [/ancia$/, 'ance'],
    // -ico → -ic
    [/ico$/, 'ic'],
    // -ica → -ic
    [/ica$/, 'ic'],
    // -ista → -ist
    [/ista$/, 'ist'],
    // -ismo → -ism
    [/ismo$/, 'ism'],
    // -al → -al
    [/al$/, 'al'],
    // -ente → -ent
    [/ente$/, 'ent'],
    // -ante → -ant
    [/ante$/, 'ant'],
    // -ura → -ure
    [/ura$/, 'ure'],
    // -ión → -ion
    [/ión$/, 'ion'],
  ];

  for (const [pattern, replacement] of transforms) {
    if (pattern.test(w)) {
      const english = w.replace(pattern, replacement)
        .replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i')
        .replace(/ó/g, 'o').replace(/ú/g, 'u').replace(/ñ/g, 'n');
      return english;
    }
  }
  return null;
}

// ============================================================
// 7. Generate entries for missing words
// ============================================================
const newEntries = {};

for (const word of missing) {
  // Look up in our translation map first
  let translation = TRANSLATIONS[word];

  if (!translation) {
    // Try to find the infinitive for verb forms
    const inf = findInfinitive(word);
    if (inf) {
      const infTranslation = TRANSLATIONS[inf] || TRANSLATIONS[inf.replace(/se$/, '')] || null;
      if (infTranslation) {
        translation = infTranslation + ' (' + inf + ')';
      }
    }
  }

  if (!translation) {
    // Try cognate detection
    const cognate = guessCognate(word);
    if (cognate) {
      translation = cognate;
    } else {
      // Use 'see context' as fallback
      translation = 'see context';
    }
  }

  const ipa = spanishIPA(word);
  const pos = guessPos(word);

  newEntries[word] = { en: translation, ipa: ipa, pos: pos };
}

console.log('Generated', Object.keys(newEntries).length, 'new entries');

// ============================================================
// 8. Build the complete dictionary file
// ============================================================
// Merge existing + new, sorted
const allEntries = { ...existingEntries };
for (const [k, v] of Object.entries(newEntries)) {
  if (!allEntries[k]) {
    allEntries[k] = v;
  }
}

// ============================================================
// 8b. Post-process: add infinitive references to ALL verb entries
// Also fix non-verb entries that are actually verb forms
// ============================================================
// First pass: fix pos for words that are clearly verbs but tagged as nouns
for (const [key, entry] of Object.entries(allEntries)) {
  if (entry.pos === 'v') continue;
  const inf = findInfinitive(key);
  if (inf && (TRANSLATIONS[inf] || TRANSLATIONS[inf.replace(/se$/, '')])) {
    entry.pos = 'v';
  }
}

// First: strip any previous infinitive annotations from verb entries (from prior runs)
for (const [key, entry] of Object.entries(allEntries)) {
  if (entry.pos !== 'v') continue;
  // Remove all (infinitive) patterns: e.g., "to open (abrir)" → "to open"
  entry.en = entry.en.replace(/\s*\([a-záéíóúüñ]+(?:se|ír|ér)?\)/g, '').trim();
}

let infinitiveAdded = 0;
let infinitiveReplaced = 0;
for (const [key, entry] of Object.entries(allEntries)) {
  if (entry.pos !== 'v') continue;

  // Skip if it's already an infinitive
  if (/^[a-záéíóúüñ]+(ar|er|ir|arse|erse|irse|ír|ér)$/.test(key)) continue;

  const inf = findInfinitive(key);
  if (!inf) continue;

  const infTranslation = TRANSLATIONS[inf] || TRANSLATIONS[inf.replace(/se$/, '')] || null;

  // Only preserve the hand-curated translation if the word itself is in TRANSLATIONS
  // Otherwise, always use the infinitive's translation (more reliable than auto-generated)
  if (TRANSLATIONS[key] && entry.en && entry.en !== 'see context') {
    // Hand-curated entry → keep its specific translation, append infinitive
    entry.en = entry.en + ' (' + inf + ')';
    infinitiveAdded++;
  } else {
    // Auto-generated entry → always use infinitive's translation
    if (infTranslation) {
      entry.en = infTranslation + ' (' + inf + ')';
    } else {
      entry.en = '(' + inf + ')';
    }
    infinitiveReplaced++;
    infinitiveAdded++;
  }
}
console.log('Added infinitive references to', infinitiveAdded, 'verb entries (' + infinitiveReplaced + ' bad translations replaced)');

const sortedKeys = Object.keys(allEntries).sort((a, b) => a.localeCompare(b, 'es'));
console.log('Total dictionary entries:', sortedKeys.length);

// Read the original file to preserve the header (interface + lookupWord function)
const headerEnd = dictContent.indexOf('export const dictionary');
const header = dictContent.substring(0, headerEnd);

let output = header;
output += 'export const dictionary: Record<string, DictEntry> = {\n';

for (const key of sortedKeys) {
  const e = allEntries[key];
  const en = e.en.replace(/'/g, "\\'").replace(/"/g, '\\"');
  const ipa = (e.ipa || '').replace(/'/g, "\\'").replace(/"/g, '\\"');
  const pos = e.pos || 'n';
  output += `  "${key}": { en: "${en}", ipa: "${ipa}", pos: "${pos}" },\n`;
}

output += '};\n';

fs.writeFileSync(DICT_PATH, output, 'utf8');
console.log('Dictionary written to', DICT_PATH);
console.log('File size:', (output.length / 1024).toFixed(1), 'KB');
