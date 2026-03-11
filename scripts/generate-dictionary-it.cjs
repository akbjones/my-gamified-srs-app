const fs = require('fs');
const path = require('path');

const DECK_PATH = path.join(__dirname, '..', 'src', 'data', 'italian', 'deck.json');
const DICT_PATH = path.join(__dirname, '..', 'src', 'data', 'dictionary', 'it.ts');

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
// 2. Read existing dictionary keys (if file exists)
// ============================================================
let existingEntries = {};
if (fs.existsSync(DICT_PATH)) {
  const dictContent = fs.readFileSync(DICT_PATH, 'utf8');
  const entryRe = /"([^"]+)":\s*\{\s*en:\s*"([^"]*)",\s*ipa:\s*"([^"]*)",\s*pos:\s*"([^"]*)"\s*\}/g;
  let em;
  while ((em = entryRe.exec(dictContent)) !== null) {
    existingEntries[em[1]] = { en: em[2], ipa: em[3], pos: em[4] };
  }
  console.log('Parsed existing entries:', Object.keys(existingEntries).length);
}

// ============================================================
// 3. Italian IPA generator (rules-based)
// ============================================================
function italianIPA(word) {
  const vowelPattern = /[aeiouàèéìòóù]/;
  const accentedVowel = /[àèéìòóù]/;

  let stressIdx = -1;
  for (let i = 0; i < word.length; i++) {
    if (accentedVowel.test(word[i])) {
      stressIdx = i;
      break;
    }
  }

  const normalized = word
    .replace(/à/g, 'a').replace(/è/g, 'e').replace(/é/g, 'e')
    .replace(/ì/g, 'i').replace(/ò/g, 'o').replace(/ó/g, 'o')
    .replace(/ù/g, 'u');

  let result = '';
  let i = 0;

  while (i < normalized.length) {
    const c = normalized[i];
    const next = i + 1 < normalized.length ? normalized[i + 1] : '';
    const next2 = i + 2 < normalized.length ? normalized[i + 2] : '';
    const prev = i > 0 ? normalized[i - 1] : '';

    if (i === stressIdx && vowelPattern.test(c)) {
      result += '\u02C8';
    }

    switch (c) {
      case 'a': result += 'a'; break;
      case 'e': result += 'e'; break;
      case 'i':
        if (vowelPattern.test(next) && next !== 'i' && prev !== 'g' && prev !== 'c') {
          result += 'j';
        } else {
          result += 'i';
        }
        break;
      case 'o': result += 'o'; break;
      case 'u':
        if (prev === 'q') { break; }
        if (prev === 'g' && /[ei]/.test(next)) { break; }
        if (vowelPattern.test(next) && next !== 'u') {
          result += 'w';
        } else {
          result += 'u';
        }
        break;
      case 'c':
        if (next === 'h') {
          result += 'k';
          i++;
        } else if (/[ei]/.test(next)) {
          result += 't\u0283';
        } else {
          result += 'k';
        }
        break;
      case 'g':
        if (next === 'l' && next2 === 'i') {
          result += '\u028E';
          i += 2;
          if (i + 1 < normalized.length && vowelPattern.test(normalized[i + 1]) && normalized[i + 1] !== 'i') {
            // gli before vowel: just palatal lateral
          } else {
            result += 'i';
          }
        } else if (next === 'n') {
          result += '\u0272';
          i++;
        } else if (next === 'h') {
          result += '\u0261';
          i++;
        } else if (/[ei]/.test(next)) {
          result += 'd\u0292';
        } else {
          result += '\u0261';
        }
        break;
      case 's':
        if (next === 'c' && /[ei]/.test(next2)) {
          result += '\u0283';
          i++;
        } else if (vowelPattern.test(prev) && vowelPattern.test(next)) {
          result += 'z';
        } else {
          result += 's';
        }
        break;
      case 'z':
        if (next === 'z') {
          result += 'tt\u0361s';
          i++;
        } else {
          result += 'ts';
        }
        break;
      case 'b': result += 'b'; break;
      case 'd': result += 'd'; break;
      case 'f': result += 'f'; break;
      case 'h': break; // silent
      case 'j': result += 'j'; break;
      case 'k': result += 'k'; break;
      case 'l':
        if (next === 'l') {
          result += 'l\u02D0';
          i++;
        } else {
          result += 'l';
        }
        break;
      case 'm':
        if (next === 'm') {
          result += 'm\u02D0';
          i++;
        } else {
          result += 'm';
        }
        break;
      case 'n':
        if (next === 'n') {
          result += 'n\u02D0';
          i++;
        } else {
          result += 'n';
        }
        break;
      case 'p':
        if (next === 'p') {
          result += 'p\u02D0';
          i++;
        } else {
          result += 'p';
        }
        break;
      case 'q':
        result += 'k';
        if (next === 'u') i++;
        break;
      case 'r':
        if (next === 'r') {
          result += 'r\u02D0';
          i++;
        } else {
          result += 'r';
        }
        break;
      case 't':
        if (next === 't') {
          result += 't\u02D0';
          i++;
        } else {
          result += 't';
        }
        break;
      case 'v': result += 'v'; break;
      case 'w': result += 'w'; break;
      case 'x': result += 'ks'; break;
      case 'y': result += 'j'; break;
      default: result += c;
    }
    i++;
  }

  return result || word;
}

// ============================================================
// 4. Part of speech guesser (Italian)
// ============================================================
function guessPos(word) {
  const w = word.toLowerCase();
  if (w.endsWith('mente')) return 'adv';
  if (w.endsWith('zione') || w.endsWith('sione') || w.endsWith('t\u00E0') || w.endsWith('ezza') || w.endsWith('ura') || w.endsWith('anza') || w.endsWith('enza')) return 'n';
  if (w.endsWith('ista') || w.endsWith('iere') || w.endsWith('tore') || w.endsWith('trice')) return 'n';
  if (w.endsWith('oso') || w.endsWith('osa') || w.endsWith('ivo') || w.endsWith('iva') || w.endsWith('bile') || w.endsWith('ato') || w.endsWith('ata') || w.endsWith('ito') || w.endsWith('ita')) return 'adj';
  if (w.endsWith('are') || w.endsWith('ere') || w.endsWith('ire') || w.endsWith('rre') || w.endsWith('rsi') || w.endsWith('arsi') || w.endsWith('ersi') || w.endsWith('irsi')) return 'v';
  if (w.endsWith('ando') || w.endsWith('endo')) return 'v';
  if (w.endsWith('iamo') || w.endsWith('ate') || w.endsWith('ete') || w.endsWith('ite')) return 'v';
  if (w.endsWith('avo') || w.endsWith('avi') || w.endsWith('ava') || w.endsWith('evo') || w.endsWith('evi') || w.endsWith('eva')) return 'v';
  return 'n';
}

// ============================================================
// 5. TRANSLATIONS map
// ============================================================
const TRANSLATIONS = {
  // --- A ---
  'a': 'to / at', 'abbastanza': 'enough / quite', 'abbigliamento': 'clothing',
  'abbracciare': 'to hug', 'abbraccio': 'hug', 'abitare': 'to live / reside',
  'abito': 'dress / suit', 'abitudine': 'habit', 'accadere': 'to happen',
  'accanto': 'next to / beside', 'accendere': 'to turn on / light',
  'accento': 'accent', 'accettare': 'to accept', 'accesso': 'access',
  'acciaio': 'steel', 'accidente': 'accident', 'accogliere': 'to welcome',
  'accomodarsi': 'to sit down / make oneself comfortable',
  'accompagnare': 'to accompany', 'accordo': 'agreement',
  'accorgersi': 'to realize / notice', 'accusare': 'to accuse',
  'aceto': 'vinegar', 'acqua': 'water', 'acquistare': 'to buy / purchase',
  'acquisto': 'purchase', 'adatto': 'suitable', 'addirittura': 'even / actually',
  'addormentarsi': 'to fall asleep', 'adesso': 'now',
  'adolescente': 'teenager', 'adulto': 'adult', 'aereo': 'airplane',
  'aeroporto': 'airport', 'affare': 'deal / business', 'affari': 'business',
  'affascinante': 'fascinating', 'affatto': 'at all',
  'affermare': 'to affirm / state', 'affetto': 'affection',
  'affidare': 'to entrust', 'affittare': 'to rent', 'affitto': 'rent',
  'affollato': 'crowded', 'affrontare': 'to face / confront',
  'agenzia': 'agency', 'aggiungere': 'to add', 'agire': 'to act',
  'agosto': 'August', 'agricoltura': 'agriculture',
  'aiutare': 'to help', 'aiuto': 'help', 'al': 'to the (m)',
  'alba': 'dawn', 'albergo': 'hotel', 'albero': 'tree',
  'alcolico': 'alcoholic', 'alcuno': 'some / any', 'allegro': 'cheerful / happy',
  'allenamento': 'training', 'allenarsi': 'to train / work out',
  'allergia': 'allergy', 'alloggio': 'accommodation',
  'allora': 'then / so', 'almeno': 'at least',
  'alto': 'tall / high', 'altrettanto': 'equally / likewise',
  'altrimenti': 'otherwise', 'altro': 'other / another',
  'alunno': 'pupil / student', 'alzare': 'to raise / lift',
  'alzarsi': 'to get up / stand up', 'amare': 'to love',
  'amaro': 'bitter', 'ambiente': 'environment',
  'ambizione': 'ambition', 'amicizia': 'friendship',
  'amico': 'friend (m)', 'amica': 'friend (f)',
  'ammalato': 'sick / ill', 'ammettere': 'to admit',
  'ammirare': 'to admire', 'amore': 'love',
  'ampio': 'wide / broad', 'analisi': 'analysis',
  'anche': 'also / too / even', 'ancora': 'still / yet / again',
  'andare': 'to go', 'anello': 'ring', 'angelo': 'angel',
  'angolo': 'corner / angle', 'anima': 'soul',
  'animale': 'animal', 'anno': 'year', 'annoiarsi': 'to get bored',
  'annunciare': 'to announce', 'annuncio': 'announcement / ad',
  'ansia': 'anxiety', 'ansioso': 'anxious',
  'antico': 'ancient / old', 'antipatico': 'unpleasant / unlikable',
  'anzi': 'on the contrary / rather', 'anziano': 'elderly',
  'ape': 'bee', 'aperto': 'open', 'appartamento': 'apartment',
  'appartenere': 'to belong', 'appena': 'just / as soon as',
  'appetito': 'appetite', 'applicare': 'to apply',
  'applicazione': 'application', 'appoggiare': 'to lean / support',
  'apportare': 'to bring / contribute', 'apposta': 'on purpose',
  'apprezzare': 'to appreciate', 'approfittare': 'to take advantage',
  'approfondire': 'to deepen / explore', 'approvare': 'to approve',
  'appuntamento': 'appointment / date', 'appunto': 'exactly / precisely',
  'aprile': 'April', 'aprire': 'to open',
  'arancia': 'orange (fruit)', 'arancione': 'orange (color)',
  'architetto': 'architect', 'architettura': 'architecture',
  'area': 'area', 'argento': 'silver', 'argomento': 'topic / argument',
  'aria': 'air', 'arma': 'weapon', 'armadio': 'wardrobe / closet',
  'arrabbiare': 'to anger', 'arrabbiarsi': 'to get angry',
  'arrabbiato': 'angry', 'arredamento': 'furniture / furnishing',
  'arrestare': 'to arrest', 'arrivare': 'to arrive',
  'arrivederci': 'goodbye', 'arrivo': 'arrival',
  'arrosto': 'roast', 'arte': 'art', 'articolo': 'article',
  'artista': 'artist', 'ascensore': 'elevator',
  'asciugamano': 'towel', 'asciugare': 'to dry',
  'ascoltare': 'to listen', 'ascolto': 'listening',
  'aspettare': 'to wait', 'aspetto': 'aspect / appearance',
  'aspirapolvere': 'vacuum cleaner', 'assaggiare': 'to taste / try',
  'assai': 'very / quite', 'assegnare': 'to assign',
  'assicurare': 'to assure / insure', 'assicurazione': 'insurance',
  'assistere': 'to assist / attend', 'associazione': 'association',
  'assolutamente': 'absolutely', 'assoluto': 'absolute',
  'assomigliare': 'to resemble', 'assumere': 'to hire / assume',
  'assurdo': 'absurd', 'atmosfera': 'atmosphere',
  'attaccamento': 'attachment', 'attaccare': 'to attack / attach',
  'atteggiamento': 'attitude', 'attendere': 'to wait',
  'attento': 'attentive / careful', 'attenzione': 'attention',
  'atterrare': 'to land', 'attesa': 'wait / expectation',
  'attimo': 'moment', 'attirare': 'to attract',
  'attivare': 'to activate', 'attivo': 'active',
  'atto': 'act', 'attore': 'actor', 'attorno': 'around',
  'attraversare': 'to cross', 'attraverso': 'through / across',
  'attrice': 'actress', 'attuale': 'current',
  'attualmente': 'currently', 'augurare': 'to wish',
  'augurio': 'wish', 'aula': 'classroom',
  'aumentare': 'to increase', 'aumento': 'increase',
  'autobus': 'bus', 'automobile': 'car',
  'autore': 'author', 'autorevole': 'authoritative',
  'autorizzare': 'to authorize', 'autostrada': 'highway',
  'autunno': 'autumn / fall', 'avanti': 'forward / ahead',
  'avere': 'to have', 'avvenire': 'to happen / future',
  'avventura': 'adventure', 'avvertire': 'to warn / feel',
  'avviare': 'to start / launch', 'avvicinarsi': 'to approach / get closer',
  'avviso': 'notice / warning', 'avvocato': 'lawyer',
  'azienda': 'company / firm', 'azione': 'action',
  'azzurro': 'light blue',
  // --- B ---
  'babbo': 'dad', 'baciare': 'to kiss', 'bacio': 'kiss',
  'badare': 'to take care / mind', 'baffi': 'mustache',
  'bagaglio': 'luggage', 'bagnare': 'to wet', 'bagnato': 'wet',
  'bagno': 'bathroom / bath', 'balcone': 'balcony',
  'ballare': 'to dance', 'ballo': 'dance',
  'bambina': 'girl / child (f)', 'bambino': 'child / boy',
  'banca': 'bank', 'banco': 'desk / counter',
  'banda': 'band', 'bandiera': 'flag',
  'bar': 'bar / cafe', 'barba': 'beard', 'barca': 'boat',
  'base': 'base / basis', 'basico': 'basic', 'basso': 'low / short',
  'bastare': 'to be enough', 'battaglia': 'battle',
  'battere': 'to beat / hit', 'batteria': 'battery / drums',
  'bello': 'beautiful / nice', 'bene': 'well / good',
  'benedire': 'to bless', 'beneficio': 'benefit',
  'benessere': 'well-being', 'benvenuto': 'welcome',
  'benzina': 'gasoline', 'bere': 'to drink',
  'bevanda': 'beverage / drink', 'bianco': 'white',
  'bibita': 'soft drink', 'biblioteca': 'library',
  'bicchiere': 'glass (drinking)', 'bicicletta': 'bicycle',
  'biglietto': 'ticket', 'bilancio': 'budget / balance',
  'binario': 'platform / track', 'biondo': 'blond',
  'birra': 'beer', 'bisognare': 'to be necessary',
  'bisogno': 'need', 'bloccare': 'to block',
  'blu': 'blue', 'bocca': 'mouth',
  'bolletta': 'bill / utility bill', 'borsa': 'bag / purse / stock market',
  'bosco': 'forest / woods', 'bottega': 'shop / workshop',
  'bottiglia': 'bottle', 'braccio': 'arm',
  'bravo': 'good / clever', 'breve': 'brief / short',
  'brillante': 'brilliant / shiny', 'brindare': 'to toast',
  'brindisi': 'toast (drink)', 'brutto': 'ugly / bad',
  'buca': 'hole', 'bugia': 'lie',
  'buio': 'dark / darkness', 'buongiorno': 'good morning',
  'buono': 'good', 'burro': 'butter', 'busta': 'envelope',
  'buttare': 'to throw',
  // --- C ---
  'cadere': 'to fall', 'caduta': 'fall',
  'caffè': 'coffee / cafe', 'calcio': 'soccer / kick',
  'caldo': 'hot / warm', 'calendario': 'calendar',
  'calma': 'calm', 'calmare': 'to calm', 'calmo': 'calm',
  'calore': 'heat / warmth', 'calza': 'stocking',
  'calzatura': 'footwear', 'cambiamento': 'change',
  'cambiare': 'to change', 'cambio': 'change / exchange',
  'camera': 'room / bedroom', 'cameriere': 'waiter',
  'cameriera': 'waitress', 'camicia': 'shirt',
  'camminare': 'to walk', 'camminata': 'walk',
  'cammino': 'path / journey', 'campagna': 'countryside / campaign',
  'campione': 'champion / sample', 'campo': 'field',
  'cancellare': 'to cancel / erase', 'candela': 'candle',
  'cane': 'dog', 'cantante': 'singer', 'cantare': 'to sing',
  'canzone': 'song', 'capace': 'capable',
  'capacità': 'ability / capacity', 'capelli': 'hair',
  'capire': 'to understand', 'capitale': 'capital',
  'capitare': 'to happen', 'capitolo': 'chapter',
  'capo': 'head / boss / chief', 'capolavoro': 'masterpiece',
  'cappello': 'hat', 'cappotto': 'coat',
  'cappuccino': 'cappuccino', 'carattere': 'character / personality',
  'caratteristica': 'characteristic', 'carcere': 'prison',
  'caricare': 'to load / charge', 'carico': 'load / cargo',
  'carino': 'cute / nice', 'carne': 'meat',
  'caro': 'dear / expensive', 'carriera': 'career',
  'carro': 'cart / wagon', 'carta': 'paper / card / map',
  'casa': 'house / home', 'casalingo': 'domestic / homemade',
  'caso': 'case / chance', 'cassa': 'cash register / box',
  'cassetto': 'drawer', 'castello': 'castle',
  'catalogo': 'catalogue', 'categoria': 'category',
  'catena': 'chain', 'cattivo': 'bad / naughty',
  'causa': 'cause', 'causare': 'to cause',
  'cavallo': 'horse', 'celebrare': 'to celebrate',
  'celebre': 'famous', 'cena': 'dinner',
  'cenare': 'to have dinner', 'centesimo': 'cent / hundredth',
  'centinaio': 'about a hundred', 'centro': 'center / downtown',
  'cercare': 'to look for / search', 'cereale': 'cereal',
  'cerimonia': 'ceremony', 'certamente': 'certainly',
  'certezza': 'certainty', 'certificato': 'certificate',
  'certo': 'certain / sure / of course', 'cervello': 'brain',
  'che': 'that / which / what', 'chi': 'who',
  'chiacchierare': 'to chat', 'chiacchierata': 'chat',
  'chiamare': 'to call', 'chiamarsi': 'to be called',
  'chiamata': 'call', 'chiaro': 'clear / light',
  'chiave': 'key', 'chiedere': 'to ask',
  'chiesa': 'church', 'chilo': 'kilo',
  'chimica': 'chemistry', 'chitarra': 'guitar',
  'chiudere': 'to close', 'chiuso': 'closed',
  'ci': 'us / there / ourselves', 'ciao': 'hello / goodbye',
  'ciascuno': 'each / every', 'cibo': 'food',
  'cielo': 'sky / heaven', 'cifra': 'figure / number',
  'cinema': 'cinema / movies', 'cinese': 'Chinese',
  'cinque': 'five', 'cintura': 'belt',
  'cioccolato': 'chocolate', 'circa': 'about / approximately',
  'circondare': 'to surround', 'circostanza': 'circumstance',
  'citare': 'to quote / cite', 'città': 'city',
  'cittadino': 'citizen', 'civile': 'civil',
  'civiltà': 'civilization', 'classe': 'class',
  'classico': 'classic', 'cliente': 'client / customer',
  'clima': 'climate', 'clinica': 'clinic',
  'coda': 'tail / queue', 'codice': 'code',
  'coerente': 'coherent', 'cogliere': 'to seize / pick',
  'cognome': 'surname', 'coincidenza': 'coincidence',
  'coinvolgere': 'to involve', 'colazione': 'breakfast',
  'collaborare': 'to collaborate', 'collaborazione': 'collaboration',
  'collega': 'colleague', 'collegamento': 'connection / link',
  'collegare': 'to connect / link', 'collegio': 'boarding school',
  'collina': 'hill', 'collo': 'neck',
  'collocare': 'to place / put', 'colonnello': 'colonel',
  'colore': 'color', 'colpa': 'fault / blame',
  'colpire': 'to hit / strike', 'colpo': 'blow / hit / shot',
  'coltello': 'knife', 'coltivare': 'to cultivate / grow',
  'comandare': 'to command', 'comando': 'command',
  'combattere': 'to fight', 'combinare': 'to combine',
  'come': 'how / like / as', 'cominciare': 'to begin / start',
  'commento': 'comment', 'commerciale': 'commercial',
  'commercio': 'commerce / trade', 'commesso': 'shop assistant',
  'commettere': 'to commit', 'commissione': 'commission',
  'commuovere': 'to move / touch emotionally',
  'comodamente': 'comfortably', 'comodo': 'comfortable / convenient',
  'compagnia': 'company / companionship', 'compagno': 'companion / partner',
  'comparire': 'to appear', 'compassione': 'compassion',
  'competenza': 'competence / skill', 'competere': 'to compete',
  'compiere': 'to accomplish / turn (age)', 'compilare': 'to fill in / compile',
  'compito': 'task / homework', 'compleanno': 'birthday',
  'completamente': 'completely', 'completare': 'to complete',
  'completo': 'complete / full', 'complicato': 'complicated',
  'complimento': 'compliment', 'comportamento': 'behavior',
  'comportare': 'to involve', 'comportarsi': 'to behave',
  'comporre': 'to compose', 'comprare': 'to buy',
  'comprendere': 'to understand / include', 'comprensione': 'understanding',
  'comune': 'common / municipality', 'comunicare': 'to communicate',
  'comunicazione': 'communication', 'comunità': 'community',
  'comunque': 'anyway / however', 'con': 'with',
  'concentrare': 'to concentrate', 'concentrarsi': 'to concentrate',
  'concepire': 'to conceive', 'concerto': 'concert',
  'concetto': 'concept', 'concludere': 'to conclude',
  'conclusione': 'conclusion', 'concorso': 'competition / contest',
  'condannare': 'to condemn', 'condividere': 'to share',
  'condizione': 'condition', 'condurre': 'to lead / drive',
  'conferenza': 'conference / lecture', 'confermare': 'to confirm',
  'confessare': 'to confess', 'confidare': 'to confide',
  'confine': 'border / boundary', 'conflitto': 'conflict',
  'confondere': 'to confuse', 'confrontare': 'to compare',
  'confronto': 'comparison', 'confusione': 'confusion',
  'congresso': 'congress', 'conoscenza': 'knowledge / acquaintance',
  'conoscere': 'to know / meet', 'conquista': 'conquest',
  'consapevole': 'aware', 'consegnare': 'to deliver',
  'conseguenza': 'consequence', 'conseguire': 'to achieve',
  'conservare': 'to preserve / keep', 'considerare': 'to consider',
  'consigliare': 'to advise / recommend', 'consiglio': 'advice / council',
  'consistere': 'to consist', 'contadino': 'farmer',
  'contare': 'to count', 'contatto': 'contact',
  'contemporaneo': 'contemporary', 'contenere': 'to contain',
  'contento': 'happy / content', 'contenuto': 'content',
  'contesto': 'context', 'continuare': 'to continue',
  'continuo': 'continuous', 'conto': 'account / bill / count',
  'contorno': 'side dish / outline', 'contrario': 'opposite / contrary',
  'contratto': 'contract', 'contribuire': 'to contribute',
  'contributo': 'contribution', 'controllare': 'to check / control',
  'controllo': 'control / check', 'convincere': 'to convince',
  'convivere': 'to live together', 'cooperare': 'to cooperate',
  'coperta': 'blanket / cover', 'copertura': 'coverage',
  'coppia': 'couple / pair', 'coprire': 'to cover',
  'coraggio': 'courage', 'coraggioso': 'courageous / brave',
  'corda': 'rope / string', 'cordiale': 'warm / cordial',
  'corpo': 'body', 'correggere': 'to correct',
  'corrente': 'current', 'correre': 'to run',
  'corretto': 'correct', 'corridoio': 'hallway / corridor',
  'corrispondere': 'to correspond', 'corsa': 'race / run',
  'corso': 'course', 'corte': 'court',
  'cortese': 'polite / courteous', 'cortile': 'courtyard',
  'corto': 'short', 'cosa': 'thing / what',
  'coscienza': 'conscience / consciousness', 'costa': 'coast',
  'costare': 'to cost', 'costretto': 'forced / compelled',
  'costruire': 'to build', 'costruzione': 'construction / building',
  'costume': 'costume / custom', 'cotone': 'cotton',
  'cravatta': 'tie', 'creare': 'to create',
  'creativo': 'creative', 'creatura': 'creature',
  'credere': 'to believe', 'credito': 'credit',
  'crescere': 'to grow', 'crescita': 'growth',
  'crisi': 'crisis', 'critica': 'criticism',
  'criticare': 'to criticize', 'critico': 'critical / critic',
  'croce': 'cross', 'crollare': 'to collapse',
  'cronaca': 'news / chronicle', 'crudele': 'cruel',
  'cucchiaio': 'spoon', 'cucina': 'kitchen / cooking',
  'cucinare': 'to cook', 'cugino': 'cousin',
  'cui': 'which / whom', 'cultura': 'culture',
  'culturale': 'cultural', 'cuocere': 'to cook',
  'cuore': 'heart', 'cura': 'care / cure',
  'curare': 'to treat / cure', 'curiosità': 'curiosity',
  'curioso': 'curious',
  // --- D ---
  'da': 'from / since / at', 'dappertutto': 'everywhere',
  'dare': 'to give', 'data': 'date (calendar)',
  'dato': 'given / data', 'davanti': 'in front of',
  'davvero': 'really / truly', 'debito': 'debt',
  'debole': 'weak', 'decidere': 'to decide',
  'decisione': 'decision', 'deciso': 'determined / decided',
  'dedicare': 'to dedicate', 'dedicarsi': 'to devote oneself',
  'definire': 'to define', 'definizione': 'definition',
  'dei': 'of the (m pl)', 'del': 'of the (m)',
  'della': 'of the (f)', 'delle': 'of the (f pl)',
  'dello': 'of the (m)', 'deluso': 'disappointed',
  'democrazia': 'democracy', 'denaro': 'money',
  'dente': 'tooth', 'dentro': 'inside / within',
  'denunciare': 'to report / denounce', 'depositare': 'to deposit',
  'deposito': 'deposit / warehouse', 'depressione': 'depression',
  'deputato': 'deputy / representative', 'descrivere': 'to describe',
  'descrizione': 'description', 'deserto': 'desert',
  'desiderare': 'to wish / desire', 'desiderio': 'wish / desire',
  'destinare': 'to destine / assign', 'destinazione': 'destination',
  'destino': 'destiny / fate', 'destra': 'right (direction)',
  'destro': 'right', 'dettaglio': 'detail',
  'detto': 'said / so-called', 'di': 'of / from',
  'dialogo': 'dialogue', 'diario': 'diary',
  'dicembre': 'December', 'dichiarare': 'to declare',
  'dichiarazione': 'declaration', 'dieci': 'ten',
  'dieta': 'diet', 'dietro': 'behind / back',
  'difendere': 'to defend', 'difesa': 'defense',
  'difetto': 'defect / flaw', 'differenza': 'difference',
  'differente': 'different', 'difficile': 'difficult',
  'difficoltà': 'difficulty', 'diffondere': 'to spread / broadcast',
  'diffuso': 'widespread', 'digitale': 'digital',
  'dignità': 'dignity', 'dimagrire': 'to lose weight',
  'dimensione': 'dimension / size', 'dimenticare': 'to forget',
  'dimenticarsi': 'to forget', 'dimissioni': 'resignation',
  'dimostrare': 'to demonstrate / show', 'dinamico': 'dynamic',
  'dio': 'god', 'dipendere': 'to depend',
  'dipingere': 'to paint', 'diploma': 'diploma',
  'dire': 'to say / tell', 'diretto': 'direct',
  'direttore': 'director / manager', 'direzione': 'direction',
  'dirigere': 'to direct / manage', 'diritto': 'right / law / straight',
  'discorso': 'speech / discourse', 'discoteca': 'disco / nightclub',
  'discreto': 'discreet / fair', 'discussione': 'discussion / argument',
  'discutere': 'to discuss / argue', 'disegnare': 'to draw / design',
  'disegno': 'drawing / design', 'disgraziato': 'unfortunate / wretch',
  'disoccupato': 'unemployed', 'disoccupazione': 'unemployment',
  'disordine': 'disorder / mess', 'dispiacere': 'to be sorry / displease',
  'disponibile': 'available', 'disposizione': 'arrangement / disposal',
  'disposto': 'willing / arranged', 'distanza': 'distance',
  'distinguere': 'to distinguish', 'distrarre': 'to distract',
  'distribuire': 'to distribute', 'distribuzione': 'distribution',
  'distruggere': 'to destroy', 'disturbare': 'to disturb',
  'disturbo': 'disturbance / trouble', 'dito': 'finger',
  'diva': 'diva', 'divano': 'sofa / couch',
  'diventare': 'to become', 'diverso': 'different / various',
  'divertente': 'fun / funny', 'divertimento': 'fun / entertainment',
  'divertire': 'to amuse', 'divertirsi': 'to have fun',
  'dividere': 'to divide / share', 'divieto': 'ban / prohibition',
  'divorzio': 'divorce', 'dizionario': 'dictionary',
  'docente': 'teacher / professor', 'documento': 'document',
  'dodici': 'twelve', 'dolce': 'sweet / dessert',
  'dolore': 'pain / grief', 'domanda': 'question / request',
  'domandare': 'to ask', 'domandarsi': 'to wonder',
  'domani': 'tomorrow', 'domenica': 'Sunday',
  'domestico': 'domestic', 'dominare': 'to dominate',
  'donna': 'woman', 'dopo': 'after / later',
  'dopodomani': 'day after tomorrow', 'doppio': 'double',
  'dormire': 'to sleep', 'dottore': 'doctor',
  'dottoressa': 'doctor (f)', 'dove': 'where',
  'dovere': 'must / to have to / duty', 'dovunque': 'wherever / everywhere',
  'dramma': 'drama', 'dritto': 'straight',
  'droga': 'drug', 'dubbio': 'doubt',
  'dubitare': 'to doubt', 'due': 'two',
  'dunque': 'therefore / so', 'duomo': 'cathedral',
  'durante': 'during', 'durare': 'to last',
  'duro': 'hard / tough',
  // --- E ---
  'e': 'and', 'eccellente': 'excellent',
  'eccezionale': 'exceptional', 'eccezione': 'exception',
  'ecco': 'here is / there is', 'economia': 'economy',
  'economico': 'economic / affordable', 'edicola': 'newsstand',
  'edificio': 'building', 'editore': 'publisher / editor',
  'edizione': 'edition', 'educazione': 'education / upbringing',
  'effetto': 'effect', 'efficace': 'effective',
  'efficiente': 'efficient', 'egli': 'he',
  'egoista': 'selfish', 'elaborare': 'to elaborate / process',
  'elegante': 'elegant', 'elementare': 'elementary',
  'elemento': 'element', 'elenco': 'list',
  'elettrico': 'electric', 'elettronico': 'electronic',
  'elezione': 'election', 'eliminare': 'to eliminate',
  'emergenza': 'emergency', 'emozione': 'emotion',
  'energia': 'energy', 'enorme': 'enormous',
  'ente': 'body / organization', 'entrare': 'to enter',
  'entrata': 'entrance / entry', 'entro': 'within / by',
  'entusiasmo': 'enthusiasm', 'entusiasta': 'enthusiastic',
  'epoca': 'era / epoch', 'eppure': 'yet / nevertheless',
  'equilibrio': 'balance / equilibrium', 'erba': 'grass / herb',
  'erede': 'heir', 'errore': 'error / mistake',
  'esagerare': 'to exaggerate', 'esame': 'exam / examination',
  'esaminare': 'to examine', 'esattamente': 'exactly',
  'esatto': 'exact', 'esaurire': 'to exhaust / run out',
  'escludere': 'to exclude', 'escursione': 'excursion / hike',
  'eseguire': 'to execute / perform', 'esempio': 'example',
  'esercitare': 'to exercise / practice', 'esercito': 'army',
  'esercizio': 'exercise', 'esigenza': 'need / requirement',
  'esigere': 'to demand / require', 'esistere': 'to exist',
  'esitare': 'to hesitate', 'esperienza': 'experience',
  'esperto': 'expert', 'esplorare': 'to explore',
  'esporre': 'to expose / display', 'espressione': 'expression',
  'esprimere': 'to express', 'essa': 'she / it (f)',
  'essere': 'to be', 'essi': 'they',
  'esso': 'it / he', 'est': 'east',
  'estate': 'summer', 'estendere': 'to extend',
  'estero': 'abroad / foreign', 'estetica': 'aesthetics',
  'estremo': 'extreme', 'età': 'age',
  'eterno': 'eternal', 'etica': 'ethics',
  'etichetta': 'label / etiquette', 'europeo': 'European',
  'evento': 'event', 'eventuale': 'possible / potential',
  'evidente': 'evident / obvious', 'evitare': 'to avoid',
  'evoluzione': 'evolution',
  // --- F ---
  'fa': 'ago / does', 'fabbrica': 'factory',
  'fabbricare': 'to manufacture', 'faccenda': 'task / chore',
  'faccia': 'face', 'facile': 'easy',
  'facilità': 'ease', 'facilitare': 'to facilitate',
  'facilmente': 'easily', 'facoltà': 'faculty / ability',
  'fame': 'hunger', 'famiglia': 'family',
  'familiare': 'familiar / family member', 'famoso': 'famous',
  'fantasia': 'fantasy / imagination', 'fantastico': 'fantastic',
  'fare': 'to do / make', 'farmacia': 'pharmacy',
  'farmaco': 'medicine / drug', 'fase': 'phase',
  'fatica': 'effort / fatigue', 'faticare': 'to struggle / toil',
  'fatto': 'fact / done', 'fattore': 'factor',
  'fattoria': 'farm', 'fattura': 'invoice / bill',
  'favola': 'fairy tale / fable', 'favore': 'favor',
  'favorevole': 'favorable', 'favorire': 'to favor',
  'favorito': 'favorite', 'fazzoletto': 'handkerchief / tissue',
  'febbraio': 'February', 'febbre': 'fever',
  'fede': 'faith', 'fedele': 'faithful / loyal',
  'felice': 'happy', 'felicità': 'happiness',
  'femmina': 'female', 'fenomeno': 'phenomenon',
  'ferire': 'to injure / wound', 'ferita': 'wound / injury',
  'fermare': 'to stop', 'fermarsi': 'to stop (oneself)',
  'fermata': 'stop (bus/train)', 'fermo': 'still / motionless',
  'feroce': 'fierce / ferocious', 'ferro': 'iron',
  'ferrovia': 'railway', 'festa': 'party / holiday / celebration',
  'festeggiare': 'to celebrate', 'fiamma': 'flame',
  'fianco': 'side / hip', 'fidarsi': 'to trust',
  'fiducia': 'trust / confidence', 'fiera': 'fair / trade show',
  'fiero': 'proud', 'figlia': 'daughter',
  'figlio': 'son', 'figli': 'children / sons',
  'figura': 'figure / shape', 'figurarsi': 'to imagine',
  'fila': 'row / line / queue', 'film': 'film / movie',
  'filo': 'thread / wire', 'filosofia': 'philosophy',
  'filosofo': 'philosopher', 'filtro': 'filter',
  'finale': 'final / ending', 'finalmente': 'finally',
  'finanza': 'finance', 'finanziare': 'to finance',
  'finanziario': 'financial', 'finché': 'until / as long as',
  'fine': 'end', 'finestra': 'window',
  'fingere': 'to pretend', 'finire': 'to finish / end',
  'finito': 'finished / over', 'fino': 'until / up to / fine',
  'fiore': 'flower', 'firmare': 'to sign',
  'fisico': 'physical / physicist', 'fissare': 'to fix / stare at',
  'fisso': 'fixed', 'fiume': 'river',
  'foglia': 'leaf', 'foglio': 'sheet (of paper)',
  'folla': 'crowd', 'fondamentale': 'fundamental',
  'fondare': 'to found', 'fondo': 'bottom / fund / background',
  'fontana': 'fountain', 'fonte': 'source / spring',
  'forbici': 'scissors', 'forchetta': 'fork',
  'foresta': 'forest', 'forma': 'form / shape',
  'formaggio': 'cheese', 'formare': 'to form / train',
  'formazione': 'training / formation', 'formula': 'formula',
  'fornire': 'to provide / supply', 'forno': 'oven',
  'forse': 'maybe / perhaps', 'forte': 'strong / loud',
  'fortuna': 'luck / fortune', 'fortunato': 'lucky / fortunate',
  'forza': 'strength / force', 'forzare': 'to force',
  'foto': 'photo', 'fotografia': 'photography / photograph',
  'fra': 'between / among / in (time)', 'fragile': 'fragile',
  'francese': 'French', 'frase': 'sentence / phrase',
  'fratello': 'brother', 'freddo': 'cold',
  'frequentare': 'to attend / frequent', 'frequente': 'frequent',
  'fresco': 'fresh / cool', 'fretta': 'hurry / haste',
  'frigorifero': 'refrigerator', 'frontiera': 'border / frontier',
  'fronte': 'forehead / front', 'frutta': 'fruit',
  'frutto': 'fruit / result', 'fuggire': 'to flee / escape',
  'fulmine': 'lightning', 'fumare': 'to smoke',
  'fumo': 'smoke', 'funzionare': 'to work / function',
  'funzione': 'function', 'fuoco': 'fire',
  'fuori': 'outside / out', 'furbo': 'clever / sly',
  'furioso': 'furious', 'furto': 'theft',
  'futuro': 'future',
  // --- G ---
  'galera': 'jail', 'galleria': 'gallery / tunnel',
  'gamba': 'leg', 'gara': 'race / competition',
  'garage': 'garage', 'garantire': 'to guarantee',
  'garanzia': 'guarantee', 'gatto': 'cat',
  'gelato': 'ice cream / frozen', 'gelosia': 'jealousy',
  'geloso': 'jealous', 'gemello': 'twin',
  'generale': 'general', 'generalmente': 'generally',
  'generare': 'to generate', 'generazione': 'generation',
  'genere': 'type / kind / genre / gender', 'generoso': 'generous',
  'geniale': 'brilliant / ingenious', 'genio': 'genius',
  'genitore': 'parent', 'genitori': 'parents',
  'gennaio': 'January', 'gente': 'people',
  'gentile': 'kind / polite', 'gentilezza': 'kindness',
  'genuino': 'genuine', 'geografia': 'geography',
  'gestire': 'to manage', 'gesto': 'gesture',
  'gestione': 'management', 'gettare': 'to throw',
  'ghiaccio': 'ice', 'già': 'already / yes',
  'giacca': 'jacket', 'giallo': 'yellow',
  'giapponese': 'Japanese', 'giardino': 'garden',
  'ginnastica': 'gymnastics', 'ginocchio': 'knee',
  'giocare': 'to play', 'giocatore': 'player',
  'giocattolo': 'toy', 'gioco': 'game / play',
  'gioia': 'joy', 'gioiello': 'jewel',
  'giornale': 'newspaper', 'giornaliero': 'daily',
  'giornalista': 'journalist', 'giornata': 'day (duration)',
  'giorno': 'day', 'giovane': 'young',
  'giovedì': 'Thursday', 'gioventù': 'youth',
  'girare': 'to turn / go around', 'giro': 'tour / ride / round',
  'gita': 'trip / excursion', 'giù': 'down',
  'giudicare': 'to judge', 'giudice': 'judge',
  'giudizio': 'judgment / opinion', 'giugno': 'June',
  'giungere': 'to arrive / reach', 'giurare': 'to swear',
  'giustizia': 'justice', 'giusto': 'right / fair / just',
  'globale': 'global', 'gloria': 'glory',
  'godere': 'to enjoy', 'gola': 'throat',
  'gomma': 'rubber / eraser / tire', 'gonna': 'skirt',
  'governo': 'government', 'grado': 'degree / grade',
  'grafico': 'graphic / chart', 'grande': 'big / large / great',
  'grandezza': 'greatness / size', 'grasso': 'fat / greasy',
  'gratuito': 'free (no cost)', 'grave': 'serious / severe',
  'grazia': 'grace', 'grazie': 'thank you / thanks',
  'greco': 'Greek', 'gridare': 'to shout / scream',
  'grigio': 'grey', 'griglia': 'grill',
  'grosso': 'big / large / thick', 'gruppo': 'group',
  'guadagnare': 'to earn', 'guadagno': 'earnings / profit',
  'guaio': 'trouble', 'guanto': 'glove',
  'guardare': 'to look at / watch', 'guardia': 'guard',
  'guarire': 'to heal / recover', 'guerra': 'war',
  'guida': 'guide / driving', 'guidare': 'to drive / guide',
  'gusto': 'taste / flavor',
  // --- I ---
  'idea': 'idea', 'ideale': 'ideal',
  'identità': 'identity', 'ignorare': 'to ignore',
  'il': 'the (m)', 'illegale': 'illegal',
  'illuminare': 'to illuminate', 'illusione': 'illusion',
  'illustrare': 'to illustrate', 'imbarazzante': 'embarrassing',
  'imbarazzo': 'embarrassment', 'immaginare': 'to imagine',
  'immaginazione': 'imagination', 'immagine': 'image',
  'immediato': 'immediate', 'immenso': 'immense',
  'immigrare': 'to immigrate', 'immobile': 'motionless / real estate',
  'imparare': 'to learn', 'impedire': 'to prevent / hinder',
  'impegnare': 'to commit / engage', 'impegnarsi': 'to commit oneself',
  'impegno': 'commitment / engagement', 'imperatore': 'emperor',
  'impiegare': 'to employ / use', 'impiegato': 'employee / clerk',
  'impiego': 'employment / job', 'importante': 'important',
  'importanza': 'importance', 'importare': 'to matter / import',
  'impossibile': 'impossible', 'imposta': 'tax / shutter',
  'impressionante': 'impressive', 'impressione': 'impression',
  'impresa': 'enterprise / company', 'improvvisamente': 'suddenly',
  'improvviso': 'sudden', 'in': 'in / into / to',
  'incantevole': 'enchanting', 'incapace': 'incapable',
  'incaricare': 'to entrust / assign', 'incarico': 'assignment / task',
  'incendio': 'fire', 'incerto': 'uncertain',
  'incidente': 'accident', 'includere': 'to include',
  'incomodare': 'to inconvenience', 'incontrare': 'to meet',
  'incontro': 'meeting / encounter', 'incoraggiare': 'to encourage',
  'incredibile': 'incredible', 'indicare': 'to indicate / point out',
  'indicazione': 'indication / direction', 'indice': 'index / sign',
  'indietro': 'back / behind', 'indifferente': 'indifferent',
  'indipendente': 'independent', 'indipendenza': 'independence',
  'indirizzo': 'address', 'indossare': 'to wear',
  'indovinare': 'to guess', 'industria': 'industry',
  'industriale': 'industrial', 'inedito': 'unpublished / new',
  'infanzia': 'childhood', 'infatti': 'in fact / indeed',
  'infelice': 'unhappy', 'inferiore': 'lower / inferior',
  'infermiere': 'nurse', 'inferno': 'hell',
  'infinito': 'infinite', 'influenza': 'influence / flu',
  'influenzare': 'to influence', 'informare': 'to inform',
  'informarsi': 'to inquire', 'informazione': 'information',
  'ingegnere': 'engineer', 'ingegneria': 'engineering',
  'ingiusto': 'unjust / unfair', 'inglese': 'English',
  'ingrediente': 'ingredient', 'ingresso': 'entrance',
  'iniziale': 'initial', 'inizialmente': 'initially',
  'iniziare': 'to start / begin', 'iniziativa': 'initiative',
  'inizio': 'beginning / start', 'innamorarsi': 'to fall in love',
  'innamorato': 'in love', 'innanzitutto': 'first of all',
  'innocente': 'innocent', 'inoltre': 'moreover / furthermore',
  'inquilino': 'tenant', 'inquinamento': 'pollution',
  'insalata': 'salad', 'insegnamento': 'teaching',
  'insegnante': 'teacher', 'insegnare': 'to teach',
  'inseguire': 'to chase / pursue', 'inserire': 'to insert',
  'insieme': 'together', 'insistere': 'to insist',
  'insomma': 'in short / well', 'installare': 'to install',
  'intelligente': 'intelligent', 'intendere': 'to intend / mean',
  'intenso': 'intense', 'intenzione': 'intention',
  'interessante': 'interesting', 'interessare': 'to interest',
  'interesse': 'interest', 'interiore': 'inner / interior',
  'interno': 'internal / inside', 'intero': 'whole / entire',
  'interpretare': 'to interpret', 'interpretazione': 'interpretation',
  'interrompere': 'to interrupt', 'intervento': 'intervention / speech',
  'intervista': 'interview', 'intimo': 'intimate',
  'intorno': 'around', 'introdurre': 'to introduce',
  'introduzione': 'introduction', 'inutile': 'useless',
  'invece': 'instead', 'inventare': 'to invent',
  'invenzione': 'invention', 'inverno': 'winter',
  'investimento': 'investment', 'investire': 'to invest / run over',
  'inviare': 'to send', 'invitare': 'to invite',
  'invito': 'invitation', 'io': 'I',
  'ipotesi': 'hypothesis', 'ira': 'anger / wrath',
  'ironico': 'ironic', 'iscrizione': 'registration / enrollment',
  'isola': 'island', 'ispirare': 'to inspire',
  'ispirazione': 'inspiration', 'istante': 'instant / moment',
  'istituto': 'institute', 'istituzione': 'institution',
  'istruzione': 'education / instruction', 'italiano': 'Italian',
  'itinerario': 'itinerary',
  // --- L ---
  'l': 'the', 'la': 'the (f) / her / it',
  'labbro': 'lip', 'laboratorio': 'laboratory / workshop',
  'ladro': 'thief', 'lago': 'lake',
  'lamentarsi': 'to complain', 'lampada': 'lamp',
  'lana': 'wool', 'lanciare': 'to throw / launch',
  'largo': 'wide / broad', 'lasciare': 'to leave / let',
  'lato': 'side', 'latte': 'milk',
  'lattina': 'can (drink)', 'laurea': 'degree (university)',
  'laurearsi': 'to graduate', 'lavanderia': 'laundry',
  'lavare': 'to wash', 'lavarsi': 'to wash oneself',
  'lavastoviglie': 'dishwasher', 'lavatrice': 'washing machine',
  'lavorare': 'to work', 'lavoratore': 'worker',
  'lavoro': 'work / job', 'le': 'the (f pl) / her / them',
  'leale': 'loyal', 'legale': 'legal',
  'legare': 'to tie / bind', 'legge': 'law',
  'leggere': 'to read', 'leggero': 'light / slight',
  'legno': 'wood', 'lei': 'she / her / you (formal)',
  'lento': 'slow', 'lenzuolo': 'sheet (bed)',
  'leone': 'lion', 'lettera': 'letter',
  'letteratura': 'literature', 'letto': 'bed',
  'lettore': 'reader', 'lettura': 'reading',
  'lezione': 'lesson / lecture', 'li': 'them (m)',
  'liberare': 'to free / liberate', 'liberazione': 'liberation',
  'libertà': 'freedom / liberty', 'libero': 'free',
  'libreria': 'bookshop / bookcase', 'libro': 'book',
  'liceo': 'high school', 'licenza': 'license / leave',
  'licenziare': 'to fire / dismiss', 'limite': 'limit',
  'limonata': 'lemonade', 'limone': 'lemon',
  'linea': 'line', 'lingua': 'language / tongue',
  'linguaggio': 'language (formal)', 'liquido': 'liquid',
  'lista': 'list', 'litigare': 'to argue / quarrel',
  'livello': 'level', 'lo': 'the (m) / him / it',
  'locale': 'local / place', 'località': 'locality / place',
  'lontano': 'far / distant', 'loro': 'they / them / their',
  'lotta': 'fight / struggle', 'lottare': 'to fight / struggle',
  'luce': 'light', 'luglio': 'July',
  'lui': 'he / him', 'luna': 'moon',
  'lunedì': 'Monday', 'lungo': 'long / along',
  'luogo': 'place', 'lusso': 'luxury',
  // --- M ---
  'ma': 'but', 'macchina': 'car / machine',
  'madre': 'mother', 'maestro': 'teacher / master',
  'magari': 'maybe / I wish', 'maggio': 'May',
  'maggioranza': 'majority', 'maggiore': 'bigger / older / major',
  'magia': 'magic', 'magico': 'magical',
  'maglia': 'sweater / jersey', 'magnifico': 'magnificent',
  'magro': 'thin / lean', 'mai': 'never / ever',
  'maiale': 'pig / pork', 'malattia': 'illness / disease',
  'male': 'bad / badly / evil', 'malgrado': 'despite',
  'mamma': 'mom', 'mancanza': 'lack / absence',
  'mancare': 'to miss / lack / be missing', 'mandare': 'to send',
  'mangiare': 'to eat', 'maniera': 'manner / way',
  'manifestare': 'to manifest / demonstrate', 'manifestazione': 'demonstration / event',
  'mano': 'hand', 'mantenere': 'to maintain / keep',
  'marca': 'brand', 'mare': 'sea',
  'marito': 'husband', 'marmo': 'marble',
  'marrone': 'brown', 'martedì': 'Tuesday',
  'marzo': 'March', 'maschera': 'mask',
  'maschile': 'masculine / male', 'maschio': 'male',
  'massa': 'mass', 'massimo': 'maximum / greatest',
  'materiale': 'material', 'materia': 'subject / matter',
  'matematica': 'mathematics', 'matrimonio': 'marriage / wedding',
  'mattina': 'morning', 'mattino': 'morning',
  'maturo': 'mature / ripe', 'meccanico': 'mechanic / mechanical',
  'media': 'average / media', 'medicinale': 'medicine',
  'medicina': 'medicine', 'medico': 'doctor / medical',
  'medio': 'average / middle', 'meglio': 'better (adv)',
  'membro': 'member', 'memoria': 'memory',
  'meno': 'less / minus', 'mensa': 'canteen',
  'mensile': 'monthly', 'mente': 'mind',
  'mentire': 'to lie', 'mentre': 'while',
  'menu': 'menu', 'meravigliarsi': 'to wonder / be amazed',
  'meraviglia': 'wonder / marvel', 'meraviglioso': 'wonderful / marvelous',
  'mercato': 'market', 'merce': 'goods / merchandise',
  'mercoledì': 'Wednesday', 'meritare': 'to deserve',
  'merito': 'merit', 'mese': 'month',
  'messaggio': 'message', 'mestiere': 'trade / profession',
  'meta': 'goal / destination', 'metà': 'half',
  'metallo': 'metal', 'metodo': 'method',
  'metro': 'meter / subway', 'mettere': 'to put / place',
  'mettersi': 'to put on / start', 'mezzanotte': 'midnight',
  'mezzo': 'half / means / middle', 'mezzogiorno': 'noon / south',
  'mi': 'me / myself', 'mica': 'not at all',
  'miele': 'honey', 'migliaia': 'thousands',
  'miglioramento': 'improvement', 'migliorare': 'to improve',
  'migliore': 'better / best', 'mila': 'thousand (pl)',
  'milione': 'million', 'militare': 'military / soldier',
  'mille': 'thousand', 'minaccia': 'threat',
  'minacciare': 'to threaten', 'minerale': 'mineral',
  'minestra': 'soup', 'minimo': 'minimum / smallest',
  'ministero': 'ministry', 'ministro': 'minister',
  'minore': 'smaller / younger / minor', 'minoranza': 'minority',
  'minuto': 'minute', 'mio': 'my / mine',
  'miracolo': 'miracle', 'miseria': 'poverty / misery',
  'missione': 'mission', 'mistero': 'mystery',
  'misterioso': 'mysterious', 'misura': 'measure / size',
  'misurare': 'to measure', 'mite': 'mild / gentle',
  'mobile': 'piece of furniture / mobile', 'moda': 'fashion',
  'modello': 'model', 'moderato': 'moderate',
  'moderno': 'modern', 'modesto': 'modest',
  'modo': 'way / manner', 'moglie': 'wife',
  'molto': 'very / much / a lot', 'momento': 'moment',
  'monarchia': 'monarchy', 'mondiale': 'world / global',
  'mondo': 'world', 'moneta': 'coin / currency',
  'montagna': 'mountain', 'montare': 'to mount / assemble',
  'monte': 'mountain / mount', 'monumento': 'monument',
  'morale': 'moral / morale', 'morbido': 'soft',
  'mordere': 'to bite', 'morire': 'to die',
  'morte': 'death', 'morto': 'dead',
  'mostra': 'exhibition / show', 'mostrare': 'to show',
  'motivo': 'reason / motive', 'moto': 'motorcycle / motion',
  'motore': 'engine / motor', 'movimento': 'movement',
  'multa': 'fine / ticket', 'municipio': 'town hall',
  'muovere': 'to move', 'muoversi': 'to move (oneself)',
  'muro': 'wall', 'museo': 'museum',
  'musica': 'music', 'musicale': 'musical',
  'musicista': 'musician', 'mutuo': 'mortgage / mutual',
  // --- N ---
  'nascere': 'to be born', 'nascita': 'birth',
  'nascondere': 'to hide', 'nascondersi': 'to hide (oneself)',
  'naso': 'nose', 'nastro': 'ribbon / tape',
  'natale': 'Christmas / birth', 'natura': 'nature',
  'naturale': 'natural', 'naturalmente': 'naturally / of course',
  'nave': 'ship', 'nazionale': 'national',
  'nazione': 'nation', 'ne': 'of it / of them / some',
  'neanche': 'not even / neither', 'nebbia': 'fog',
  'necessario': 'necessary', 'necessità': 'necessity / need',
  'negare': 'to deny', 'negativo': 'negative',
  'negozio': 'shop / store', 'nemico': 'enemy',
  'nemmeno': 'not even', 'neppure': 'not even',
  'nero': 'black', 'nervoso': 'nervous',
  'nessuno': 'no one / nobody / none', 'netto': 'net / clean / clear',
  'neve': 'snow', 'nevicare': 'to snow',
  'niente': 'nothing', 'nipote': 'nephew / niece / grandchild',
  'no': 'no', 'nobile': 'noble',
  'nocivo': 'harmful', 'noi': 'we / us',
  'noia': 'boredom', 'noioso': 'boring',
  'noleggiare': 'to rent / hire', 'nome': 'name / noun',
  'nominare': 'to name / appoint', 'non': 'not',
  'nonno': 'grandfather', 'nonna': 'grandmother',
  'nonni': 'grandparents', 'nonostante': 'despite / although',
  'nord': 'north', 'normale': 'normal',
  'normalmente': 'normally', 'norma': 'norm / rule',
  'nostalgia': 'nostalgia / homesickness', 'nostro': 'our / ours',
  'nota': 'note', 'notare': 'to notice',
  'notevole': 'notable / remarkable', 'notizia': 'news / piece of news',
  'noto': 'known / well-known', 'notte': 'night',
  'notturno': 'nocturnal / night', 'novanta': 'ninety',
  'nove': 'nine', 'novella': 'short story',
  'novembre': 'November', 'novità': 'novelty / news',
  'nozze': 'wedding', 'nudo': 'naked / bare',
  'nulla': 'nothing', 'numero': 'number',
  'numeroso': 'numerous', 'nuotare': 'to swim',
  'nuoto': 'swimming', 'nuovo': 'new',
  'nutrire': 'to nourish / feed', 'nuvola': 'cloud',
  // --- O ---
  'o': 'or', 'obbligare': 'to oblige / force',
  'obbligo': 'obligation', 'obiettivo': 'objective / goal',
  'occasione': 'occasion / opportunity', 'occhiale': 'eyeglasses',
  'occhiali': 'glasses', 'occhiata': 'glance',
  'occhio': 'eye', 'occidentale': 'western',
  'occidente': 'west', 'occorrere': 'to need / be necessary',
  'occupare': 'to occupy', 'occuparsi': 'to take care of',
  'occupato': 'busy / occupied', 'occupazione': 'occupation / job',
  'oceano': 'ocean', 'odiare': 'to hate',
  'odio': 'hate / hatred', 'odore': 'smell / odor',
  'offendere': 'to offend', 'offerta': 'offer',
  'offrire': 'to offer', 'oggetto': 'object / thing',
  'oggi': 'today', 'ogni': 'every / each',
  'ognuno': 'everyone / each one', 'olio': 'oil',
  'oltre': 'beyond / besides / over', 'ombra': 'shadow / shade',
  'ombrello': 'umbrella', 'onestà': 'honesty',
  'onesto': 'honest', 'onore': 'honor',
  'opera': 'work / opera', 'operaio': 'worker',
  'operare': 'to operate', 'operazione': 'operation',
  'opinione': 'opinion', 'opportunità': 'opportunity',
  'opposto': 'opposite', 'oppure': 'or / otherwise',
  'ora': 'now / hour / time', 'orario': 'schedule / timetable',
  'ordinare': 'to order / arrange', 'ordine': 'order',
  'orecchio': 'ear', 'organizzare': 'to organize',
  'organizzazione': 'organization', 'orgoglio': 'pride',
  'orgoglioso': 'proud', 'orientale': 'eastern',
  'oriente': 'east', 'originale': 'original',
  'origine': 'origin', 'orizzonte': 'horizon',
  'ormai': 'by now / at this point', 'oro': 'gold',
  'orologio': 'clock / watch', 'orribile': 'horrible',
  'orrore': 'horror', 'orto': 'vegetable garden',
  'osare': 'to dare', 'oscuro': 'dark / obscure',
  'ospedale': 'hospital', 'ospitare': 'to host',
  'ospite': 'guest / host', 'osservare': 'to observe',
  'osservazione': 'observation', 'ossigeno': 'oxygen',
  'ostacolo': 'obstacle', 'ottenere': 'to obtain / get',
  'ottimo': 'excellent / very good', 'otto': 'eight',
  'ottobre': 'October', 'ovest': 'west',
  'ovunque': 'everywhere / wherever', 'ovviamente': 'obviously',
  'ovvio': 'obvious',
  // --- P ---
  'pace': 'peace', 'padrone': 'owner / master',
  'padre': 'father', 'paesaggio': 'landscape',
  'paese': 'country / village', 'paga': 'pay / salary',
  'pagamento': 'payment', 'pagare': 'to pay',
  'pagina': 'page', 'paio': 'pair',
  'palazzo': 'palace / building', 'palcoscenico': 'stage',
  'palestra': 'gym', 'palla': 'ball',
  'pallone': 'ball (large)', 'pane': 'bread',
  'panino': 'sandwich', 'panna': 'cream',
  'panorama': 'panorama / view', 'pantaloni': 'pants / trousers',
  'papa': 'pope', 'papà': 'dad',
  'parcheggiare': 'to park', 'parcheggio': 'parking',
  'parco': 'park', 'parecchio': 'quite a lot / several',
  'parente': 'relative', 'parentela': 'relatives / kinship',
  'parere': 'to seem / opinion', 'parete': 'wall (inside)',
  'pari': 'equal / even', 'parlamento': 'parliament',
  'parlare': 'to speak / talk', 'parola': 'word',
  'parte': 'part / side', 'partecipare': 'to participate',
  'partecipazione': 'participation', 'partenza': 'departure',
  'particolare': 'particular / special', 'particolarmente': 'particularly',
  'partire': 'to leave / depart', 'partita': 'match / game',
  'partito': 'party (political)', 'partner': 'partner',
  'parziale': 'partial', 'passaggio': 'passage / ride',
  'passaporto': 'passport', 'passare': 'to pass / spend (time)',
  'passato': 'past', 'passeggero': 'passenger',
  'passeggiare': 'to walk / stroll', 'passeggiata': 'walk / stroll',
  'passione': 'passion', 'passo': 'step / pace',
  'pasta': 'pasta / dough', 'pasticceria': 'pastry shop',
  'pasto': 'meal', 'patata': 'potato',
  'patente': 'license (driving)', 'patria': 'homeland',
  'paura': 'fear', 'pausa': 'break / pause',
  'pavimento': 'floor', 'paziente': 'patient',
  'pazienza': 'patience', 'pazzo': 'crazy / mad',
  'peccato': 'sin / pity', 'peggio': 'worse (adv)',
  'peggiore': 'worse / worst', 'pelle': 'skin / leather',
  'pena': 'punishment / pity', 'pendere': 'to hang / lean',
  'penisola': 'peninsula', 'penna': 'pen',
  'pensare': 'to think', 'pensiero': 'thought',
  'pensione': 'pension / guesthouse', 'pentirsi': 'to regret',
  'pepe': 'pepper (spice)', 'per': 'for / in order to',
  'pera': 'pear', 'perché': 'why / because',
  'percorso': 'route / path', 'perdere': 'to lose',
  'perdita': 'loss', 'perdonare': 'to forgive',
  'perdono': 'forgiveness', 'perfetto': 'perfect',
  'perfino': 'even', 'pericolo': 'danger',
  'pericoloso': 'dangerous', 'periferia': 'outskirts / suburbs',
  'periodo': 'period', 'permettere': 'to allow / permit',
  'permesso': 'permission / permit', 'però': 'however / but',
  'persona': 'person', 'personaggio': 'character (fiction)',
  'personale': 'personal / staff', 'personalità': 'personality',
  'pesante': 'heavy', 'pesare': 'to weigh',
  'pesca': 'fishing / peach', 'pescare': 'to fish',
  'pesce': 'fish', 'peso': 'weight',
  'pessimo': 'terrible / very bad', 'petto': 'chest / breast',
  'pezzo': 'piece', 'piacere': 'to like / pleasure',
  'piacevole': 'pleasant', 'piangere': 'to cry / weep',
  'piano': 'floor / plan / slowly / piano', 'pianta': 'plant / map',
  'piantare': 'to plant', 'pianura': 'plain',
  'piatto': 'plate / dish / flat', 'piazza': 'square (town)',
  'piccolo': 'small / little', 'piede': 'foot',
  'pieno': 'full', 'pietà': 'pity / mercy',
  'pietra': 'stone', 'pigro': 'lazy',
  'pioggia': 'rain', 'piovere': 'to rain',
  'piscina': 'swimming pool', 'pisello': 'pea',
  'pista': 'track / trail / runway', 'pittore': 'painter',
  'pittura': 'painting', 'più': 'more / plus',
  'piuttosto': 'rather', 'plastica': 'plastic',
  'platea': 'audience / stalls', 'poco': 'little / few',
  'poesia': 'poetry / poem', 'poeta': 'poet',
  'poi': 'then / afterwards', 'poiché': 'since / because',
  'polemico': 'controversial', 'politica': 'politics / policy',
  'politico': 'political / politician', 'polizia': 'police',
  'poliziotto': 'policeman', 'pollice': 'thumb',
  'pollo': 'chicken', 'poltrona': 'armchair',
  'polvere': 'dust / powder', 'pomeriggio': 'afternoon',
  'pomodoro': 'tomato', 'ponte': 'bridge',
  'popolare': 'popular / folk', 'popolazione': 'population',
  'popolo': 'people / nation', 'porre': 'to put / place',
  'porta': 'door', 'portafogli': 'wallet',
  'portare': 'to bring / carry / wear', 'porto': 'port / harbor',
  'porzione': 'portion', 'posizione': 'position',
  'possedere': 'to own / possess', 'possibile': 'possible',
  'possibilità': 'possibility', 'posta': 'mail / post',
  'postino': 'postman', 'posto': 'place / seat',
  'potente': 'powerful', 'potenza': 'power',
  'potere': 'to be able / can / power', 'povero': 'poor',
  'povertà': 'poverty', 'pranzo': 'lunch',
  'pratica': 'practice', 'praticamente': 'practically',
  'praticare': 'to practice', 'pratico': 'practical',
  'prato': 'meadow / lawn', 'precedente': 'previous',
  'preciso': 'precise / exact', 'preferenza': 'preference',
  'preferibile': 'preferable', 'preferire': 'to prefer',
  'preferito': 'favorite', 'pregare': 'to pray / beg',
  'preghiera': 'prayer', 'pregio': 'quality / merit',
  'prego': 'you are welcome / please', 'premere': 'to press',
  'premiare': 'to reward', 'premio': 'prize / award',
  'prendere': 'to take / get', 'prenotare': 'to book / reserve',
  'prenotazione': 'reservation / booking', 'preoccupare': 'to worry',
  'preoccuparsi': 'to worry', 'preoccupato': 'worried',
  'preoccupazione': 'worry / concern', 'preparare': 'to prepare',
  'prepararsi': 'to get ready', 'preparazione': 'preparation',
  'presa': 'grip / socket', 'presentare': 'to present / introduce',
  'presentarsi': 'to introduce oneself', 'presentazione': 'presentation',
  'presente': 'present', 'presenza': 'presence',
  'presidente': 'president', 'presso': 'at / near / with',
  'prestare': 'to lend', 'prestito': 'loan',
  'presto': 'soon / early / quickly', 'pretendere': 'to demand / expect',
  'prevalere': 'to prevail', 'prevedere': 'to foresee / predict',
  'prevenire': 'to prevent', 'previsione': 'forecast',
  'prezioso': 'precious / valuable', 'prezzo': 'price',
  'prigione': 'prison', 'prigioniero': 'prisoner',
  'prima': 'before / first', 'primavera': 'spring',
  'primo': 'first', 'principale': 'main / principal',
  'principalmente': 'mainly', 'principe': 'prince',
  'principessa': 'princess', 'principio': 'principle / beginning',
  'privato': 'private', 'privilegio': 'privilege',
  'privo': 'devoid / lacking', 'probabile': 'probable / likely',
  'probabilmente': 'probably', 'problema': 'problem',
  'procedere': 'to proceed', 'procedura': 'procedure',
  'processo': 'process / trial', 'prodotto': 'product',
  'produrre': 'to produce', 'produzione': 'production',
  'professionale': 'professional', 'professione': 'profession',
  'professore': 'professor / teacher', 'professoressa': 'professor (f)',
  'profilo': 'profile', 'profitto': 'profit',
  'profondamente': 'deeply', 'profondo': 'deep / profound',
  'profumo': 'perfume / scent', 'progetto': 'project / plan',
  'programma': 'program / plan', 'programmare': 'to plan / program',
  'progresso': 'progress', 'proibire': 'to prohibit',
  'promessa': 'promise', 'promettere': 'to promise',
  'promuovere': 'to promote', 'pronto': 'ready / hello (phone)',
  'pronuncia': 'pronunciation', 'pronunciare': 'to pronounce',
  'propaganda': 'propaganda', 'proporre': 'to propose',
  'proposito': 'purpose / intention', 'proposta': 'proposal',
  'proprietà': 'property / ownership', 'proprietario': 'owner',
  'proprio': 'own / really / exactly', 'prosa': 'prose',
  'proseguire': 'to continue / proceed', 'prossimo': 'next / near',
  'protagonista': 'protagonist', 'proteggere': 'to protect',
  'protesta': 'protest', 'protestare': 'to protest',
  'protezione': 'protection', 'prova': 'proof / test / trial',
  'provare': 'to try / feel / prove', 'provenire': 'to come from',
  'provincia': 'province', 'provocare': 'to provoke / cause',
  'prudente': 'prudent / careful', 'pubblico': 'public / audience',
  'pubblicare': 'to publish', 'pubblicazione': 'publication',
  'pubblicità': 'advertising / ad', 'pugile': 'boxer',
  'pulire': 'to clean', 'pulito': 'clean',
  'punta': 'tip / point', 'puntare': 'to aim / point',
  'punto': 'point / dot', 'puntuale': 'punctual',
  'purché': 'provided that', 'pure': 'also / even / pure',
  'puro': 'pure', 'purtroppo': 'unfortunately',
  // --- Q ---
  'qua': 'here', 'quaderno': 'notebook',
  'quadro': 'painting / picture / framework', 'qualche': 'some / a few',
  'qualcosa': 'something', 'qualcuno': 'someone / somebody',
  'quale': 'which / what', 'qualità': 'quality',
  'qualsiasi': 'any / whatever', 'qualunque': 'any / whatever',
  'quando': 'when', 'quantità': 'quantity / amount',
  'quanto': 'how much / how many', 'quaranta': 'forty',
  'quartiere': 'neighborhood / district', 'quarto': 'fourth / quarter',
  'quasi': 'almost / nearly', 'quattordici': 'fourteen',
  'quattro': 'four', 'quello': 'that',
  'questione': 'question / issue', 'questo': 'this',
  'qui': 'here', 'quiete': 'quiet / calm',
  'quindi': 'therefore / so', 'quindici': 'fifteen',
  'quotidiano': 'daily / newspaper',
  // --- R ---
  'rabbia': 'anger / rage', 'raccogliere': 'to collect / gather',
  'raccolta': 'collection', 'raccomandare': 'to recommend',
  'raccontare': 'to tell / narrate', 'racconto': 'story / tale',
  'radice': 'root', 'radio': 'radio',
  'ragazza': 'girl', 'ragazzino': 'boy (young)',
  'ragazzo': 'boy / boyfriend', 'raggio': 'ray / beam',
  'raggiungere': 'to reach / achieve', 'ragione': 'reason',
  'ragionamento': 'reasoning', 'ragionare': 'to reason / think',
  'rallentare': 'to slow down', 'ramo': 'branch',
  'rapido': 'fast / quick', 'rapporto': 'report / relationship',
  'rappresentare': 'to represent', 'rappresentazione': 'representation',
  'raro': 'rare', 'rassegna': 'review / festival',
  'reagire': 'to react', 'reale': 'real / royal',
  'realista': 'realist', 'realizzare': 'to realize / achieve',
  'realtà': 'reality', 'reato': 'crime / offense',
  'reazione': 'reaction', 'recente': 'recent',
  'recentemente': 'recently', 'recitare': 'to act / recite',
  'reclamo': 'complaint', 'reddito': 'income',
  'regalare': 'to give (as gift)', 'regalo': 'gift / present',
  'reggere': 'to hold / support', 'regime': 'regime / diet',
  'regina': 'queen', 'regione': 'region',
  'regista': 'director (film)', 'registrare': 'to record / register',
  'registrazione': 'recording / registration', 'regno': 'kingdom / realm',
  'regola': 'rule', 'regolare': 'regular / to regulate',
  'regolamento': 'regulation', 'relativo': 'relative',
  'relazione': 'relationship / report', 'religione': 'religion',
  'religioso': 'religious', 'rendere': 'to make / render / give back',
  'rendersi': 'to realize', 'repubblica': 'republic',
  'reputazione': 'reputation', 'residenza': 'residence',
  'resistenza': 'resistance', 'resistere': 'to resist',
  'respirare': 'to breathe', 'respiro': 'breath',
  'responsabile': 'responsible', 'responsabilità': 'responsibility',
  'restare': 'to stay / remain', 'restauro': 'restoration',
  'restituire': 'to return / give back', 'resto': 'rest / change (money)',
  'rete': 'net / network', 'ricco': 'rich',
  'ricchezza': 'wealth / richness', 'ricerca': 'research / search',
  'ricercare': 'to search / research', 'ricetta': 'recipe / prescription',
  'ricevere': 'to receive', 'richiamare': 'to call back',
  'richiedere': 'to require / request', 'richiesta': 'request',
  'riconoscere': 'to recognize', 'ricordare': 'to remember',
  'ricordarsi': 'to remember', 'ricordo': 'memory / souvenir',
  'ricorrere': 'to resort / recur', 'ridere': 'to laugh',
  'ridurre': 'to reduce', 'riduzione': 'reduction',
  'riempire': 'to fill', 'rientrare': 'to return / come back',
  'riferimento': 'reference', 'riferire': 'to report / refer',
  'rifiutare': 'to refuse', 'rifiuto': 'refusal / waste',
  'riflettere': 'to reflect / think', 'riflessione': 'reflection',
  'riforma': 'reform', 'riga': 'line / row',
  'rigido': 'rigid / harsh', 'riguardare': 'to concern / regard',
  'riguardo': 'regard / respect', 'rilassarsi': 'to relax',
  'rilevante': 'relevant', 'rilievo': 'relief / importance',
  'rimanere': 'to remain / stay', 'rimedio': 'remedy',
  'rimpiangere': 'to regret', 'rincrescere': 'to be sorry',
  'rinfrescare': 'to refresh', 'ringraziare': 'to thank',
  'rinnovare': 'to renew', 'rinunciare': 'to give up / renounce',
  'riparare': 'to repair / fix', 'ripetere': 'to repeat',
  'riportare': 'to bring back / report', 'riposare': 'to rest',
  'riposarsi': 'to rest', 'riposo': 'rest',
  'ripresa': 'recovery / resumption', 'risata': 'laugh',
  'rischiare': 'to risk', 'rischio': 'risk',
  'riserva': 'reserve', 'riservare': 'to reserve',
  'riso': 'rice / laughter', 'risolvere': 'to solve / resolve',
  'risorsa': 'resource', 'risparmio': 'saving',
  'risparmiare': 'to save (money)', 'rispettare': 'to respect',
  'rispetto': 'respect', 'rispondere': 'to answer / reply',
  'risposta': 'answer / reply', 'ristorante': 'restaurant',
  'risultare': 'to result / turn out', 'risultato': 'result',
  'ritardare': 'to delay', 'ritardo': 'delay / late',
  'ritenere': 'to consider / believe', 'ritirare': 'to withdraw',
  'ritirarsi': 'to withdraw / retire', 'ritmo': 'rhythm',
  'rito': 'rite / ritual', 'ritornare': 'to return',
  'ritorno': 'return', 'ritratto': 'portrait',
  'ritrovare': 'to find again', 'riunione': 'meeting',
  'riunire': 'to reunite / gather', 'riuscire': 'to succeed / manage',
  'riva': 'shore / bank', 'rivelare': 'to reveal',
  'rivelazione': 'revelation', 'rivista': 'magazine',
  'rivolgersi': 'to turn to / address', 'rivoluzione': 'revolution',
  'roba': 'stuff / things', 'robusto': 'robust / sturdy',
  'romantico': 'romantic', 'romanzo': 'novel',
  'rompere': 'to break', 'rosa': 'pink / rose',
  'rosso': 'red', 'rovinare': 'to ruin',
  'rovina': 'ruin', 'rubare': 'to steal',
  'rumore': 'noise', 'rumoroso': 'noisy',
  'ruolo': 'role', 'ruota': 'wheel',
  // --- S ---
  'sabato': 'Saturday', 'sabbia': 'sand',
  'sacco': 'sack / bag / a lot', 'sacrificio': 'sacrifice',
  'saggio': 'wise / essay', 'sala': 'hall / room',
  'salario': 'salary', 'sale': 'salt',
  'salire': 'to go up / climb', 'salita': 'climb / ascent',
  'salone': 'living room / hall', 'saltare': 'to jump / skip',
  'salumeria': 'deli', 'salutare': 'to greet',
  'salute': 'health', 'saluto': 'greeting',
  'salvare': 'to save / rescue', 'sangue': 'blood',
  'sano': 'healthy', 'santo': 'saint / holy',
  'sapere': 'to know', 'sapone': 'soap',
  'sapore': 'flavor / taste', 'sbagliare': 'to make a mistake',
  'sbagliato': 'wrong / mistaken', 'sbaglio': 'mistake',
  'sbrigarsi': 'to hurry up', 'scala': 'staircase / scale',
  'scalare': 'to climb', 'scambiare': 'to exchange',
  'scambio': 'exchange', 'scandalo': 'scandal',
  'scappare': 'to run away / escape', 'scarpa': 'shoe',
  'scatola': 'box', 'scegliere': 'to choose',
  'scelta': 'choice', 'scena': 'scene',
  'scendere': 'to go down / descend', 'scheda': 'card / form',
  'schema': 'scheme / diagram', 'schermo': 'screen',
  'scherzare': 'to joke', 'scherzo': 'joke / prank',
  'schiena': 'back (body)', 'schifo': 'disgust',
  'sciare': 'to ski', 'scienza': 'science',
  'scienziato': 'scientist', 'sciocco': 'foolish / silly',
  'sciogliere': 'to melt / dissolve', 'sciopero': 'strike',
  'scolastico': 'scholastic / school', 'scomparire': 'to disappear',
  'scommessa': 'bet', 'scommettere': 'to bet',
  'sconosciuto': 'unknown / stranger', 'sconto': 'discount',
  'scontro': 'clash / collision', 'scoperta': 'discovery',
  'scopo': 'purpose / aim', 'scoppiare': 'to burst / explode',
  'scoprire': 'to discover', 'scorso': 'last / past',
  'scrittore': 'writer', 'scrittura': 'writing',
  'scrivania': 'desk', 'scrivere': 'to write',
  'scuola': 'school', 'scuro': 'dark',
  'scusa': 'excuse / apology', 'scusare': 'to excuse',
  'scusarsi': 'to apologize', 'se': 'if / whether',
  'secco': 'dry', 'secolo': 'century',
  'secondo': 'second / according to', 'sede': 'headquarters / seat',
  'sedersi': 'to sit down', 'sedia': 'chair',
  'segnalare': 'to signal / report', 'segnale': 'signal / sign',
  'segnare': 'to mark / score', 'segno': 'sign / mark',
  'segretario': 'secretary', 'segreto': 'secret',
  'seguente': 'following', 'seguire': 'to follow',
  'seguito': 'following / continuation', 'sei': 'six',
  'selezionare': 'to select', 'selezione': 'selection',
  'sembrare': 'to seem / appear', 'seme': 'seed',
  'semplice': 'simple', 'semplicemente': 'simply',
  'sempre': 'always', 'sensazione': 'sensation / feeling',
  'sensibile': 'sensitive', 'senso': 'sense / meaning / direction',
  'sentiero': 'path / trail', 'sentimento': 'feeling / sentiment',
  'sentire': 'to hear / feel', 'sentirsi': 'to feel',
  'senza': 'without', 'separare': 'to separate',
  'sera': 'evening', 'serata': 'evening (event)',
  'sereno': 'serene / clear', 'serie': 'series',
  'serio': 'serious', 'serpente': 'snake',
  'servire': 'to serve / need', 'servizio': 'service',
  'sessanta': 'sixty', 'sete': 'thirst',
  'settanta': 'seventy', 'sette': 'seven',
  'settembre': 'September', 'settimana': 'week',
  'settimanale': 'weekly', 'settore': 'sector',
  'severo': 'strict / severe', 'sfida': 'challenge',
  'sfidare': 'to challenge', 'sforzo': 'effort',
  'sfortuna': 'bad luck', 'sfortunato': 'unlucky',
  'sguardo': 'look / gaze', 'si': 'oneself / one',
  'sia': 'both / whether', 'siccome': 'since / as',
  'sicuramente': 'surely / certainly', 'sicurezza': 'safety / security',
  'sicuro': 'safe / sure / certain', 'significare': 'to mean',
  'significativo': 'significant', 'significato': 'meaning',
  'signor': 'Mr.', 'signora': 'Mrs. / lady',
  'signore': 'gentleman / sir', 'signorina': 'Miss / young lady',
  'silenzio': 'silence', 'silenzioso': 'silent / quiet',
  'simbolo': 'symbol', 'simile': 'similar',
  'simpatico': 'nice / likeable', 'sincero': 'sincere',
  'sindaco': 'mayor', 'singolo': 'single / individual',
  'sinistra': 'left (direction)', 'sistema': 'system',
  'sistemare': 'to arrange / fix', 'sito': 'site / website',
  'situazione': 'situation', 'smettere': 'to stop / quit',
  'sociale': 'social', 'società': 'society / company',
  'soddisfare': 'to satisfy', 'soddisfatto': 'satisfied',
  'soddisfazione': 'satisfaction', 'sofferenza': 'suffering',
  'soffitto': 'ceiling', 'soffrire': 'to suffer',
  'soggetto': 'subject', 'soggiorno': 'living room / stay',
  'sognare': 'to dream', 'sogno': 'dream',
  'soldi': 'money', 'sole': 'sun',
  'solito': 'usual', 'solitudine': 'loneliness / solitude',
  'sollevare': 'to lift / raise', 'solo': 'alone / only',
  'soltanto': 'only / just', 'soluzione': 'solution',
  'somma': 'sum / amount', 'sonno': 'sleep / sleepiness',
  'sopportare': 'to bear / stand', 'sopra': 'above / over / on',
  'soprattutto': 'above all / especially', 'sorella': 'sister',
  'sorgere': 'to rise / arise', 'sorprendente': 'surprising',
  'sorprendere': 'to surprise', 'sorpresa': 'surprise',
  'sorridere': 'to smile', 'sorriso': 'smile',
  'sorte': 'fate / luck', 'sospettare': 'to suspect',
  'sostanza': 'substance', 'sostegno': 'support',
  'sostenere': 'to support / maintain', 'sostituire': 'to replace',
  'sotto': 'under / below', 'sottolineare': 'to underline / emphasize',
  'spagnolo': 'Spanish', 'spalla': 'shoulder',
  'sparare': 'to shoot', 'sparire': 'to disappear',
  'spaventare': 'to frighten', 'spazio': 'space',
  'specchio': 'mirror', 'speciale': 'special',
  'specialista': 'specialist', 'specie': 'species / kind',
  'specifico': 'specific', 'spedire': 'to send / ship',
  'spegnere': 'to turn off', 'spendere': 'to spend',
  'speranza': 'hope', 'sperare': 'to hope',
  'spesa': 'expense / shopping', 'spesso': 'often / thick',
  'spettacolo': 'show / spectacle', 'spiaggia': 'beach',
  'spiegare': 'to explain', 'spiegazione': 'explanation',
  'spingere': 'to push', 'spirito': 'spirit / wit',
  'splendido': 'splendid', 'sporco': 'dirty',
  'sport': 'sport', 'sportivo': 'sporty / athletic',
  'sposare': 'to marry', 'sposarsi': 'to get married',
  'spostare': 'to move / shift', 'spuntino': 'snack',
  'squadra': 'team', 'stabile': 'stable',
  'stabilire': 'to establish', 'stadio': 'stadium',
  'stagione': 'season', 'stamattina': 'this morning',
  'stampa': 'press / print', 'stampare': 'to print',
  'stancare': 'to tire', 'stancarsi': 'to get tired',
  'stanco': 'tired', 'stanza': 'room',
  'stare': 'to stay / be', 'stasera': 'this evening / tonight',
  'stato': 'state / been', 'statua': 'statue',
  'stazione': 'station', 'stella': 'star',
  'stesso': 'same / self', 'stile': 'style',
  'stipendio': 'salary / wage', 'stomaco': 'stomach',
  'storia': 'history / story', 'storico': 'historical',
  'strada': 'street / road', 'straniero': 'foreigner / foreign',
  'strano': 'strange', 'straordinario': 'extraordinary',
  'strategia': 'strategy', 'stretto': 'narrow / tight',
  'strumento': 'instrument / tool', 'struttura': 'structure',
  'studente': 'student', 'studentessa': 'student (f)',
  'studiare': 'to study', 'studio': 'study / office',
  'stupendo': 'wonderful / stunning', 'stupido': 'stupid',
  'su': 'on / up / about', 'subire': 'to suffer / undergo',
  'subito': 'immediately / right away', 'succedere': 'to happen',
  'successo': 'success / happened', 'successivo': 'following / next',
  'succo': 'juice', 'sud': 'south',
  'sufficiente': 'sufficient / enough', 'suggerire': 'to suggest',
  'sugo': 'sauce / juice', 'suo': 'his / her / its',
  'suonare': 'to play (instrument) / ring', 'suono': 'sound',
  'superare': 'to overcome / exceed', 'superficie': 'surface',
  'superiore': 'upper / superior', 'supermercato': 'supermarket',
  'supporto': 'support', 'supporre': 'to suppose',
  'sveglia': 'alarm clock', 'svegliare': 'to wake',
  'svegliarsi': 'to wake up', 'sviluppare': 'to develop',
  'sviluppo': 'development', 'svolgere': 'to carry out',
  // --- T ---
  'tacere': 'to be silent', 'taglia': 'size',
  'tagliare': 'to cut', 'tale': 'such / so',
  'talento': 'talent', 'tanto': 'so much / so many / a lot',
  'tappa': 'stop / stage', 'tappeto': 'carpet / rug',
  'tardi': 'late', 'tasca': 'pocket',
  'tassa': 'tax / fee', 'tassista': 'taxi driver',
  'tavola': 'table', 'tavolo': 'table',
  'tazza': 'cup / mug', 'tè': 'tea',
  'teatro': 'theater', 'tecnica': 'technique',
  'tecnico': 'technical / technician', 'tecnologia': 'technology',
  'tedesco': 'German', 'telefonare': 'to phone / call',
  'telefonata': 'phone call', 'telefono': 'telephone',
  'televisione': 'television', 'televisore': 'TV set',
  'tema': 'theme / topic / essay', 'temere': 'to fear',
  'temperatura': 'temperature', 'tempesta': 'storm',
  'tempio': 'temple', 'tempo': 'time / weather',
  'tendenza': 'tendency / trend', 'tendere': 'to tend',
  'tenere': 'to hold / keep', 'tenero': 'tender / soft',
  'tensione': 'tension', 'tentare': 'to try / attempt',
  'tentativo': 'attempt', 'teoria': 'theory',
  'termine': 'term / end', 'terra': 'earth / land / ground',
  'terrazzo': 'terrace', 'terreno': 'ground / land / terrain',
  'terribile': 'terrible', 'territorio': 'territory',
  'terrore': 'terror', 'terzo': 'third',
  'tesi': 'thesis', 'tesoro': 'treasure / darling',
  'tessera': 'card / pass', 'tessuto': 'fabric / tissue',
  'testa': 'head', 'testimone': 'witness',
  'testo': 'text', 'tetto': 'roof',
  'ti': 'you (obj) / yourself', 'timido': 'shy / timid',
  'tipo': 'type / kind / guy', 'tipico': 'typical',
  'tirare': 'to pull / throw', 'titolo': 'title',
  'toccare': 'to touch', 'togliere': 'to remove / take off',
  'tono': 'tone', 'tornare': 'to return / come back',
  'torre': 'tower', 'torta': 'cake',
  'torto': 'wrong', 'totale': 'total',
  'tra': 'between / among / in (time)', 'traccia': 'trace / track',
  'tradire': 'to betray', 'tradizione': 'tradition',
  'tradizionale': 'traditional', 'tradurre': 'to translate',
  'traduzione': 'translation', 'traffico': 'traffic',
  'tragedia': 'tragedy', 'tramonto': 'sunset',
  'tranquillo': 'calm / quiet', 'tranne': 'except',
  'trarre': 'to draw / pull', 'trascorrere': 'to spend (time)',
  'trasferimento': 'transfer', 'trasferire': 'to transfer',
  'trasferirsi': 'to move (relocate)', 'trasformare': 'to transform',
  'trasmettere': 'to transmit / broadcast', 'trasportare': 'to transport',
  'trasporto': 'transport', 'trattamento': 'treatment',
  'trattare': 'to treat / deal with', 'tratto': 'trait / stretch',
  'tre': 'three', 'tredici': 'thirteen',
  'treno': 'train', 'trenta': 'thirty',
  'tribunale': 'court / tribunal', 'triste': 'sad',
  'tristezza': 'sadness', 'troppo': 'too much / too',
  'trovare': 'to find', 'trovarsi': 'to be (located)',
  'trucco': 'trick / makeup', 'tu': 'you',
  'tuo': 'your / yours', 'turismo': 'tourism',
  'turista': 'tourist', 'turno': 'turn / shift',
  'tuttavia': 'however / nevertheless', 'tutto': 'all / everything',
  'tutti': 'everyone / all',
  // --- U ---
  'ubbidire': 'to obey', 'ubriaco': 'drunk',
  'uccello': 'bird', 'uccidere': 'to kill',
  'udire': 'to hear', 'ufficiale': 'official / officer',
  'ufficio': 'office', 'uguale': 'equal / same',
  'ultimamente': 'lately / recently', 'ultimo': 'last / latest',
  'umano': 'human', 'umido': 'humid / damp',
  'umile': 'humble', 'umore': 'mood / humor',
  'un': 'a / an (m)', 'una': 'a / an (f)',
  'undici': 'eleven', 'unico': 'unique / only',
  'unione': 'union', 'unire': 'to unite / join',
  'unità': 'unity / unit', 'università': 'university',
  'universo': 'universe', 'uno': 'one / a',
  'uomo': 'man', 'uovo': 'egg',
  'urgente': 'urgent', 'urlare': 'to shout / scream',
  'usare': 'to use', 'uscire': 'to go out / exit',
  'uscita': 'exit / outing', 'uso': 'use',
  'utente': 'user', 'utile': 'useful',
  'utilizzare': 'to use / utilize',
  // --- V ---
  'vacanza': 'vacation / holiday', 'valere': 'to be worth',
  'valigia': 'suitcase', 'valle': 'valley',
  'valore': 'value', 'valutare': 'to evaluate',
  'vantaggio': 'advantage', 'vario': 'various',
  'vasto': 'vast', 'vecchio': 'old',
  'vedere': 'to see', 'veloce': 'fast / quick',
  'velocità': 'speed', 'vendere': 'to sell',
  'vendita': 'sale', 'venerdì': 'Friday',
  'venire': 'to come', 'vento': 'wind',
  'veramente': 'really / truly', 'verde': 'green',
  'vergogna': 'shame', 'vergognarsi': 'to be ashamed',
  'verità': 'truth', 'vero': 'true / real',
  'versare': 'to pour / pay', 'versione': 'version',
  'verso': 'towards / verse', 'vestire': 'to dress',
  'vestirsi': 'to get dressed', 'vestito': 'dress / suit / dressed',
  'vetrina': 'shop window', 'vetro': 'glass (material)',
  'vi': 'you (pl obj) / there', 'via': 'street / away',
  'viaggiare': 'to travel', 'viaggio': 'trip / journey',
  'vicino': 'near / close / neighbor', 'video': 'video',
  'vietare': 'to prohibit / forbid', 'villa': 'villa',
  'villaggio': 'village', 'vincere': 'to win',
  'vino': 'wine', 'violento': 'violent',
  'violenza': 'violence', 'visione': 'vision / view',
  'visita': 'visit', 'visitare': 'to visit',
  'viso': 'face', 'vista': 'view / sight',
  'vita': 'life', 'vittima': 'victim',
  'vittoria': 'victory', 'vivace': 'lively / vivid',
  'vivere': 'to live', 'vivo': 'alive / living',
  'voce': 'voice', 'voglia': 'desire / want',
  'voi': 'you (pl)', 'volare': 'to fly',
  'volentieri': 'gladly / willingly', 'volere': 'to want',
  'volo': 'flight', 'volontà': 'will / willpower',
  'volta': 'time (occurrence) / turn', 'voltare': 'to turn',
  'volume': 'volume', 'vostro': 'your (pl)',
  'votare': 'to vote', 'voto': 'vote / grade',
  // --- Z ---
  'zaino': 'backpack', 'zero': 'zero',
  'zia': 'aunt', 'zio': 'uncle',
  'zitto': 'quiet / silent', 'zona': 'zone / area',
  'zoo': 'zoo', 'zucchero': 'sugar',
  'zuppa': 'soup',
};

// ============================================================
// 5b. Irregular verb forms -> infinitive map
// ============================================================
const IRREGULAR_FORMS = {
  // --- essere ---
  'sono': 'essere', 'sei': 'essere', 'è': 'essere', 'siamo': 'essere', 'siete': 'essere',
  'era': 'essere', 'ero': 'essere', 'eri': 'essere', 'eravamo': 'essere', 'eravate': 'essere', 'erano': 'essere',
  'fui': 'essere', 'fosti': 'essere', 'fu': 'essere', 'fummo': 'essere', 'foste': 'essere', 'furono': 'essere',
  'sarò': 'essere', 'sarai': 'essere', 'sarà': 'essere', 'saremo': 'essere', 'sarete': 'essere', 'saranno': 'essere',
  'sarei': 'essere', 'saresti': 'essere', 'sarebbe': 'essere', 'saremmo': 'essere', 'sareste': 'essere', 'sarebbero': 'essere',
  'sia': 'essere', 'siate': 'essere', 'siano': 'essere',
  'fossi': 'essere', 'fosse': 'essere', 'fossimo': 'essere', 'fossero': 'essere',
  'essendo': 'essere', 'stato': 'essere', 'stata': 'essere', 'stati': 'essere', 'state': 'essere',
  'sii': 'essere',
  // --- avere ---
  'ho': 'avere', 'hai': 'avere', 'ha': 'avere', 'abbiamo': 'avere', 'avete': 'avere', 'hanno': 'avere',
  'avevo': 'avere', 'avevi': 'avere', 'aveva': 'avere', 'avevamo': 'avere', 'avevate': 'avere', 'avevano': 'avere',
  'ebbi': 'avere', 'avesti': 'avere', 'ebbe': 'avere', 'avemmo': 'avere', 'aveste': 'avere', 'ebbero': 'avere',
  'avrò': 'avere', 'avrai': 'avere', 'avrà': 'avere', 'avremo': 'avere', 'avrete': 'avere', 'avranno': 'avere',
  'avrei': 'avere', 'avresti': 'avere', 'avrebbe': 'avere', 'avremmo': 'avere', 'avreste': 'avere', 'avrebbero': 'avere',
  'abbia': 'avere', 'abbiate': 'avere', 'abbiano': 'avere',
  'avessi': 'avere', 'avesse': 'avere', 'avessimo': 'avere', 'avessero': 'avere',
  'avendo': 'avere', 'avuto': 'avere', 'abbi': 'avere',
  // --- fare ---
  'faccio': 'fare', 'fai': 'fare', 'facciamo': 'fare', 'fate': 'fare', 'fanno': 'fare',
  'facevo': 'fare', 'facevi': 'fare', 'faceva': 'fare', 'facevamo': 'fare', 'facevano': 'fare',
  'feci': 'fare', 'facesti': 'fare', 'fece': 'fare', 'facemmo': 'fare', 'fecero': 'fare',
  'farò': 'fare', 'farai': 'fare', 'farà': 'fare', 'faremo': 'fare', 'farete': 'fare', 'faranno': 'fare',
  'farei': 'fare', 'faresti': 'fare', 'farebbe': 'fare', 'faremmo': 'fare', 'farebbero': 'fare',
  'faccia': 'fare', 'facciate': 'fare', 'facciano': 'fare',
  'facessi': 'fare', 'facesse': 'fare', 'facessimo': 'fare', 'facessero': 'fare',
  'facendo': 'fare', 'fatto': 'fare', 'fatta': 'fare', 'fatti': 'fare', 'fatte': 'fare',
  // --- andare ---
  'vado': 'andare', 'vai': 'andare', 'va': 'andare', 'andiamo': 'andare', 'andate': 'andare', 'vanno': 'andare',
  'andavo': 'andare', 'andavi': 'andare', 'andava': 'andare', 'andavamo': 'andare', 'andavano': 'andare',
  'andai': 'andare', 'andasti': 'andare', 'andò': 'andare', 'andammo': 'andare', 'andarono': 'andare',
  'andrò': 'andare', 'andrai': 'andare', 'andrà': 'andare', 'andremo': 'andare', 'andranno': 'andare',
  'andrei': 'andare', 'andresti': 'andare', 'andrebbe': 'andare', 'andremmo': 'andare', 'andrebbero': 'andare',
  'vada': 'andare', 'vadano': 'andare',
  'andassi': 'andare', 'andasse': 'andare', 'andassimo': 'andare', 'andassero': 'andare',
  'andando': 'andare', 'andato': 'andare', 'andata': 'andare',
  // --- dire ---
  'dico': 'dire', 'dici': 'dire', 'dice': 'dire', 'diciamo': 'dire', 'dite': 'dire', 'dicono': 'dire',
  'dicevo': 'dire', 'dicevi': 'dire', 'diceva': 'dire', 'dicevamo': 'dire', 'dicevano': 'dire',
  'dissi': 'dire', 'dicesti': 'dire', 'disse': 'dire', 'dicemmo': 'dire', 'dissero': 'dire',
  'dirò': 'dire', 'dirai': 'dire', 'dirà': 'dire', 'diremo': 'dire', 'diranno': 'dire',
  'direi': 'dire', 'diresti': 'dire', 'direbbe': 'dire', 'diremmo': 'dire', 'direbbero': 'dire',
  'dica': 'dire', 'diciate': 'dire', 'dicano': 'dire',
  'dicessi': 'dire', 'dicesse': 'dire', 'dicessimo': 'dire', 'dicessero': 'dire',
  'dicendo': 'dire', 'detto': 'dire', 'detta': 'dire', 'detti': 'dire',
  'di': 'dire',
  // --- venire ---
  'vengo': 'venire', 'vieni': 'venire', 'viene': 'venire', 'veniamo': 'venire', 'venite': 'venire', 'vengono': 'venire',
  'venivo': 'venire', 'veniva': 'venire', 'venivamo': 'venire', 'venivano': 'venire',
  'venni': 'venire', 'venisti': 'venire', 'venne': 'venire', 'venimmo': 'venire', 'vennero': 'venire',
  'verrò': 'venire', 'verrai': 'venire', 'verrà': 'venire', 'verremo': 'venire', 'verranno': 'venire',
  'verrei': 'venire', 'verresti': 'venire', 'verrebbe': 'venire', 'verremmo': 'venire', 'verrebbero': 'venire',
  'venga': 'venire', 'vengano': 'venire',
  'venissi': 'venire', 'venisse': 'venire', 'venissimo': 'venire', 'venissero': 'venire',
  'venendo': 'venire', 'venuto': 'venire', 'venuta': 'venire',
  // --- potere ---
  'posso': 'potere', 'puoi': 'potere', 'può': 'potere', 'possiamo': 'potere', 'potete': 'potere', 'possono': 'potere',
  'potevo': 'potere', 'potevi': 'potere', 'poteva': 'potere', 'potevamo': 'potere', 'potevano': 'potere',
  'potei': 'potere', 'poté': 'potere', 'poterono': 'potere',
  'potrò': 'potere', 'potrai': 'potere', 'potrà': 'potere', 'potremo': 'potere', 'potranno': 'potere',
  'potrei': 'potere', 'potresti': 'potere', 'potrebbe': 'potere', 'potremmo': 'potere', 'potrebbero': 'potere',
  'possa': 'potere', 'possiate': 'potere', 'possano': 'potere',
  'potessi': 'potere', 'potesse': 'potere', 'potessimo': 'potere', 'potessero': 'potere',
  'potendo': 'potere', 'potuto': 'potere',
  // --- dovere ---
  'devo': 'dovere', 'devi': 'dovere', 'deve': 'dovere', 'dobbiamo': 'dovere', 'dovete': 'dovere', 'devono': 'dovere',
  'dovevo': 'dovere', 'dovevi': 'dovere', 'doveva': 'dovere', 'dovevamo': 'dovere', 'dovevano': 'dovere',
  'dovetti': 'dovere', 'dovette': 'dovere', 'dovettero': 'dovere',
  'dovrò': 'dovere', 'dovrai': 'dovere', 'dovrà': 'dovere', 'dovremo': 'dovere', 'dovranno': 'dovere',
  'dovrei': 'dovere', 'dovresti': 'dovere', 'dovrebbe': 'dovere', 'dovremmo': 'dovere', 'dovrebbero': 'dovere',
  'debba': 'dovere', 'debbano': 'dovere',
  'dovessi': 'dovere', 'dovesse': 'dovere', 'dovessimo': 'dovere', 'dovessero': 'dovere',
  'dovendo': 'dovere', 'dovuto': 'dovere',
  // --- volere ---
  'voglio': 'volere', 'vuoi': 'volere', 'vuole': 'volere', 'vogliamo': 'volere', 'volete': 'volere', 'vogliono': 'volere',
  'volevo': 'volere', 'volevi': 'volere', 'voleva': 'volere', 'volevamo': 'volere', 'volevano': 'volere',
  'volli': 'volere', 'volesti': 'volere', 'volle': 'volere', 'volemmo': 'volere', 'vollero': 'volere',
  'vorrò': 'volere', 'vorrai': 'volere', 'vorrà': 'volere', 'vorremo': 'volere', 'vorranno': 'volere',
  'vorrei': 'volere', 'vorresti': 'volere', 'vorrebbe': 'volere', 'vorremmo': 'volere', 'vorrebbero': 'volere',
  'voglia': 'volere', 'vogliate': 'volere', 'vogliano': 'volere',
  'volessi': 'volere', 'volesse': 'volere', 'volessimo': 'volere', 'volessero': 'volere',
  'volendo': 'volere', 'voluto': 'volere',
  // --- sapere ---
  'so': 'sapere', 'sai': 'sapere', 'sa': 'sapere', 'sappiamo': 'sapere', 'sapete': 'sapere', 'sanno': 'sapere',
  'sapevo': 'sapere', 'sapevi': 'sapere', 'sapeva': 'sapere', 'sapevamo': 'sapere', 'sapevano': 'sapere',
  'seppi': 'sapere', 'sapesti': 'sapere', 'seppe': 'sapere', 'sapemmo': 'sapere', 'seppero': 'sapere',
  'saprò': 'sapere', 'saprai': 'sapere', 'saprà': 'sapere', 'sapremo': 'sapere', 'sapranno': 'sapere',
  'saprei': 'sapere', 'sapresti': 'sapere', 'saprebbe': 'sapere', 'sapremmo': 'sapere', 'saprebbero': 'sapere',
  'sappia': 'sapere', 'sappiate': 'sapere', 'sappiano': 'sapere',
  'sapessi': 'sapere', 'sapesse': 'sapere', 'sapessimo': 'sapere', 'sapessero': 'sapere',
  'sapendo': 'sapere', 'saputo': 'sapere',
  // --- stare ---
  'sto': 'stare', 'stai': 'stare', 'sta': 'stare', 'stiamo': 'stare', 'stanno': 'stare',
  'stavo': 'stare', 'stavi': 'stare', 'stava': 'stare', 'stavamo': 'stare', 'stavano': 'stare',
  'stetti': 'stare', 'steste': 'stare', 'stette': 'stare', 'stemmo': 'stare', 'stettero': 'stare',
  'starò': 'stare', 'starai': 'stare', 'starà': 'stare', 'staremo': 'stare', 'staranno': 'stare',
  'starei': 'stare', 'staresti': 'stare', 'starebbe': 'stare', 'staremmo': 'stare', 'starebbero': 'stare',
  'stia': 'stare', 'stiano': 'stare',
  'stessi': 'stare', 'stesse': 'stare', 'stessimo': 'stare', 'stessero': 'stare',
  'stando': 'stare',
  // --- dare ---
  'do': 'dare', 'dai': 'dare', 'dà': 'dare', 'diamo': 'dare', 'danno': 'dare',
  'davo': 'dare', 'davi': 'dare', 'dava': 'dare', 'davamo': 'dare', 'davano': 'dare',
  'diedi': 'dare', 'desti': 'dare', 'diede': 'dare', 'demmo': 'dare', 'diedero': 'dare',
  'darò': 'dare', 'darai': 'dare', 'darà': 'dare', 'daremo': 'dare', 'daranno': 'dare',
  'darei': 'dare', 'daresti': 'dare', 'darebbe': 'dare', 'daremmo': 'dare', 'darebbero': 'dare',
  'dia': 'dare', 'diano': 'dare',
  'dessi': 'dare', 'desse': 'dare', 'dessimo': 'dare', 'dessero': 'dare',
  'dando': 'dare', 'dato': 'dare',
  // --- bere ---
  'bevo': 'bere', 'bevi': 'bere', 'beve': 'bere', 'beviamo': 'bere', 'bevete': 'bere', 'bevono': 'bere',
  'bevevo': 'bere', 'beveva': 'bere', 'bevevano': 'bere',
  'bevvi': 'bere', 'bevve': 'bere', 'bevvero': 'bere',
  'berrò': 'bere', 'berrai': 'bere', 'berrà': 'bere', 'berremo': 'bere', 'berranno': 'bere',
  'berrei': 'bere', 'berresti': 'bere', 'berrebbe': 'bere', 'berremmo': 'bere', 'berebbero': 'bere',
  'beva': 'bere', 'bevano': 'bere',
  'bevessi': 'bere', 'bevesse': 'bere', 'bevessero': 'bere',
  'bevendo': 'bere', 'bevuto': 'bere',
  // --- tenere ---
  'tengo': 'tenere', 'tieni': 'tenere', 'tiene': 'tenere', 'teniamo': 'tenere', 'tengono': 'tenere',
  'tenevo': 'tenere', 'teneva': 'tenere', 'tenevano': 'tenere',
  'tenni': 'tenere', 'tenne': 'tenere', 'tennero': 'tenere',
  'terrò': 'tenere', 'terrai': 'tenere', 'terrà': 'tenere', 'terremo': 'tenere', 'terranno': 'tenere',
  'terrei': 'tenere', 'terresti': 'tenere', 'terrebbe': 'tenere', 'terremmo': 'tenere', 'terrebbero': 'tenere',
  'tenga': 'tenere', 'tengano': 'tenere',
  'tenessi': 'tenere', 'tenesse': 'tenere', 'tenessero': 'tenere',
  'tenendo': 'tenere', 'tenuto': 'tenere',
  // --- uscire ---
  'esco': 'uscire', 'esci': 'uscire', 'esce': 'uscire', 'usciamo': 'uscire', 'uscite': 'uscire', 'escono': 'uscire',
  'uscivo': 'uscire', 'usciva': 'uscire', 'uscivano': 'uscire',
  'uscii': 'uscire', 'uscì': 'uscire', 'uscirono': 'uscire',
  'uscirò': 'uscire', 'uscirai': 'uscire', 'uscirà': 'uscire', 'usciremo': 'uscire', 'usciranno': 'uscire',
  'uscirei': 'uscire', 'uscirebbe': 'uscire',
  'esca': 'uscire', 'escano': 'uscire',
  'uscissi': 'uscire', 'uscisse': 'uscire',
  'uscendo': 'uscire', 'uscito': 'uscire',
  // --- morire ---
  'muoio': 'morire', 'muori': 'morire', 'muore': 'morire', 'moriamo': 'morire', 'muoiono': 'morire',
  'morivo': 'morire', 'moriva': 'morire', 'morivano': 'morire',
  'morii': 'morire', 'morì': 'morire', 'morirono': 'morire',
  'morirò': 'morire', 'morirai': 'morire', 'morirà': 'morire', 'moriremo': 'morire', 'moriranno': 'morire',
  'morirei': 'morire', 'morirebbe': 'morire',
  'muoia': 'morire', 'muoiano': 'morire',
  'morissi': 'morire', 'morisse': 'morire',
  'morendo': 'morire', 'morto': 'morire', 'morta': 'morire',
  // --- porre ---
  'pongo': 'porre', 'poni': 'porre', 'pone': 'porre', 'poniamo': 'porre', 'ponete': 'porre', 'pongono': 'porre',
  'ponevo': 'porre', 'poneva': 'porre', 'ponevano': 'porre',
  'posi': 'porre', 'pose': 'porre', 'posero': 'porre',
  'porrò': 'porre', 'porrai': 'porre', 'porrà': 'porre', 'porremo': 'porre', 'porranno': 'porre',
  'porrei': 'porre', 'porrebbe': 'porre',
  'ponga': 'porre', 'pongano': 'porre',
  'ponessi': 'porre', 'ponesse': 'porre',
  'ponendo': 'porre', 'posto': 'porre',
  // --- condurre ---
  'conduco': 'condurre', 'conduci': 'condurre', 'conduce': 'condurre', 'conduciamo': 'condurre', 'conducono': 'condurre',
  'conducevo': 'condurre', 'conduceva': 'condurre', 'conducevano': 'condurre',
  'condussi': 'condurre', 'condusse': 'condurre', 'condussero': 'condurre',
  'condurrò': 'condurre', 'condurrai': 'condurre', 'condurrà': 'condurre',
  'condurrei': 'condurre', 'condurrebbe': 'condurre',
  'conduca': 'condurre', 'conducano': 'condurre',
  'conducessi': 'condurre', 'conducesse': 'condurre',
  'conducendo': 'condurre', 'condotto': 'condurre',
  // --- tradurre ---
  'traduco': 'tradurre', 'traduci': 'tradurre', 'traduce': 'tradurre', 'traduciamo': 'tradurre', 'traducono': 'tradurre',
  'traducevo': 'tradurre', 'traduceva': 'tradurre',
  'tradussi': 'tradurre', 'tradusse': 'tradurre', 'tradussero': 'tradurre',
  'tradurrò': 'tradurre', 'tradurrà': 'tradurre',
  'tradurrei': 'tradurre', 'tradurrebbe': 'tradurre',
  'traduca': 'tradurre', 'traducano': 'tradurre',
  'traducendo': 'tradurre', 'tradotto': 'tradurre',
  // --- ridurre ---
  'riduco': 'ridurre', 'riduci': 'ridurre', 'riduce': 'ridurre', 'riduciamo': 'ridurre', 'riducono': 'ridurre',
  'riducevo': 'ridurre', 'riduceva': 'ridurre',
  'ridussi': 'ridurre', 'ridusse': 'ridurre', 'ridussero': 'ridurre',
  'ridurrò': 'ridurre', 'ridurrà': 'ridurre',
  'ridurrei': 'ridurre', 'ridurrebbe': 'ridurre',
  'riduca': 'ridurre', 'riducano': 'ridurre',
  'riducendo': 'ridurre', 'ridotto': 'ridurre',
  // --- produrre ---
  'produco': 'produrre', 'produci': 'produrre', 'produce': 'produrre', 'produciamo': 'produrre', 'producono': 'produrre',
  'producevo': 'produrre', 'produceva': 'produrre',
  'produssi': 'produrre', 'produsse': 'produrre', 'produssero': 'produrre',
  'produrrò': 'produrre', 'produrrà': 'produrre',
  'producendo': 'produrre', 'prodotto': 'produrre',
  // --- rimanere ---
  'rimango': 'rimanere', 'rimani': 'rimanere', 'rimane': 'rimanere', 'rimaniamo': 'rimanere', 'rimangono': 'rimanere',
  'rimanevo': 'rimanere', 'rimaneva': 'rimanere', 'rimanevano': 'rimanere',
  'rimasi': 'rimanere', 'rimase': 'rimanere', 'rimasero': 'rimanere',
  'rimarrò': 'rimanere', 'rimarrai': 'rimanere', 'rimarrà': 'rimanere', 'rimarremo': 'rimanere', 'rimarranno': 'rimanere',
  'rimarrei': 'rimanere', 'rimarrebbe': 'rimanere',
  'rimanga': 'rimanere', 'rimangano': 'rimanere',
  'rimanessi': 'rimanere', 'rimanesse': 'rimanere',
  'rimanendo': 'rimanere', 'rimasto': 'rimanere', 'rimasta': 'rimanere',
  // --- vedere ---
  'vedo': 'vedere', 'vedi': 'vedere', 'vede': 'vedere', 'vediamo': 'vedere', 'vedete': 'vedere', 'vedono': 'vedere',
  'vedevo': 'vedere', 'vedeva': 'vedere', 'vedevano': 'vedere',
  'vidi': 'vedere', 'vide': 'vedere', 'videro': 'vedere',
  'vedrò': 'vedere', 'vedrai': 'vedere', 'vedrà': 'vedere', 'vedremo': 'vedere', 'vedranno': 'vedere',
  'vedrei': 'vedere', 'vedresti': 'vedere', 'vedrebbe': 'vedere', 'vedremmo': 'vedere', 'vedrebbero': 'vedere',
  'veda': 'vedere', 'vedano': 'vedere',
  'vedessi': 'vedere', 'vedesse': 'vedere', 'vedessero': 'vedere',
  'vedendo': 'vedere', 'visto': 'vedere', 'vista': 'vedere', 'veduto': 'vedere',
  // --- prendere ---
  'prendo': 'prendere', 'prendi': 'prendere', 'prende': 'prendere', 'prendiamo': 'prendere', 'prendono': 'prendere',
  'prendevo': 'prendere', 'prendeva': 'prendere', 'prendevano': 'prendere',
  'presi': 'prendere', 'prese': 'prendere', 'presero': 'prendere',
  'prenderò': 'prendere', 'prenderà': 'prendere',
  'prenderei': 'prendere', 'prenderebbe': 'prendere',
  'prenda': 'prendere', 'prendano': 'prendere',
  'prendessi': 'prendere', 'prendesse': 'prendere',
  'prendendo': 'prendere', 'preso': 'prendere', 'presa': 'prendere',
  // --- mettere ---
  'metto': 'mettere', 'metti': 'mettere', 'mette': 'mettere', 'mettiamo': 'mettere', 'mettono': 'mettere',
  'mettevo': 'mettere', 'metteva': 'mettere', 'mettevano': 'mettere',
  'misi': 'mettere', 'mise': 'mettere', 'misero': 'mettere',
  'metterò': 'mettere', 'metterà': 'mettere',
  'metterei': 'mettere', 'metterebbe': 'mettere',
  'metta': 'mettere', 'mettano': 'mettere',
  'mettessi': 'mettere', 'mettesse': 'mettere',
  'mettendo': 'mettere', 'messo': 'mettere', 'messa': 'mettere',
  // --- scrivere ---
  'scrivo': 'scrivere', 'scrivi': 'scrivere', 'scrive': 'scrivere', 'scriviamo': 'scrivere', 'scrivono': 'scrivere',
  'scrivevo': 'scrivere', 'scriveva': 'scrivere',
  'scrissi': 'scrivere', 'scrisse': 'scrivere', 'scrissero': 'scrivere',
  'scriverò': 'scrivere', 'scriverà': 'scrivere',
  'scriverei': 'scrivere', 'scriverebbe': 'scrivere',
  'scriva': 'scrivere', 'scrivano': 'scrivere',
  'scrivendo': 'scrivere', 'scritto': 'scrivere', 'scritta': 'scrivere',
  // --- leggere ---
  'leggo': 'leggere', 'leggi': 'leggere', 'legge': 'leggere', 'leggiamo': 'leggere', 'leggono': 'leggere',
  'leggevo': 'leggere', 'leggeva': 'leggere',
  'lessi': 'leggere', 'lesse': 'leggere', 'lessero': 'leggere',
  'leggerò': 'leggere', 'leggerà': 'leggere',
  'leggerei': 'leggere', 'leggerebbe': 'leggere',
  'legga': 'leggere', 'leggano': 'leggere',
  'leggendo': 'leggere', 'letto': 'leggere',
  // --- chiudere ---
  'chiudo': 'chiudere', 'chiudi': 'chiudere', 'chiude': 'chiudere', 'chiudiamo': 'chiudere', 'chiudono': 'chiudere',
  'chiudevo': 'chiudere', 'chiudeva': 'chiudere',
  'chiusi': 'chiudere', 'chiuse': 'chiudere', 'chiusero': 'chiudere',
  'chiuderò': 'chiudere', 'chiuderà': 'chiudere',
  'chiuderei': 'chiudere', 'chiuderebbe': 'chiudere',
  'chiuda': 'chiudere', 'chiudano': 'chiudere',
  'chiudendo': 'chiudere', 'chiuso': 'chiudere',
  // --- vincere ---
  'vinco': 'vincere', 'vinci': 'vincere', 'vince': 'vincere', 'vinciamo': 'vincere', 'vincono': 'vincere',
  'vincevo': 'vincere', 'vinceva': 'vincere',
  'vinsi': 'vincere', 'vinse': 'vincere', 'vinsero': 'vincere',
  'vincerò': 'vincere', 'vincerà': 'vincere',
  'vincerei': 'vincere', 'vincerebbe': 'vincere',
  'vinca': 'vincere', 'vincano': 'vincere',
  'vincendo': 'vincere', 'vinto': 'vincere', 'vinta': 'vincere',
  // --- perdere ---
  'perdo': 'perdere', 'perdi': 'perdere', 'perde': 'perdere', 'perdiamo': 'perdere', 'perdono': 'perdere',
  'perdevo': 'perdere', 'perdeva': 'perdere',
  'persi': 'perdere', 'perse': 'perdere', 'persero': 'perdere',
  'perderò': 'perdere', 'perderà': 'perdere',
  'perderei': 'perdere', 'perderebbe': 'perdere',
  'perda': 'perdere', 'perdano': 'perdere',
  'perdendo': 'perdere', 'perso': 'perdere', 'persa': 'perdere', 'perduto': 'perdere',
  // --- crescere ---
  'cresco': 'crescere', 'cresci': 'crescere', 'cresce': 'crescere', 'cresciamo': 'crescere', 'crescono': 'crescere',
  'crescevo': 'crescere', 'cresceva': 'crescere',
  'crebbi': 'crescere', 'crebbe': 'crescere', 'crebbero': 'crescere',
  'crescerò': 'crescere', 'crescerà': 'crescere',
  'crescendo': 'crescere', 'cresciuto': 'crescere',
  // --- nascere ---
  'nasco': 'nascere', 'nasci': 'nascere', 'nasce': 'nascere', 'nasciamo': 'nascere', 'nascono': 'nascere',
  'nascevo': 'nascere', 'nasceva': 'nascere',
  'nacqui': 'nascere', 'nacque': 'nascere', 'nacquero': 'nascere',
  'nascerò': 'nascere', 'nascerà': 'nascere',
  'nascendo': 'nascere', 'nato': 'nascere', 'nata': 'nascere', 'nati': 'nascere',
  // --- cadere ---
  'cado': 'cadere', 'cadi': 'cadere', 'cade': 'cadere', 'cadiamo': 'cadere', 'cadono': 'cadere',
  'cadevo': 'cadere', 'cadeva': 'cadere',
  'caddi': 'cadere', 'cadde': 'cadere', 'caddero': 'cadere',
  'cadrò': 'cadere', 'cadrai': 'cadere', 'cadrà': 'cadere',
  'cadrei': 'cadere', 'cadrebbe': 'cadere',
  'cada': 'cadere', 'cadano': 'cadere',
  'cadendo': 'cadere', 'caduto': 'cadere',
  // --- scegliere ---
  'scelgo': 'scegliere', 'scegli': 'scegliere', 'sceglie': 'scegliere', 'scegliamo': 'scegliere', 'scelgono': 'scegliere',
  'sceglievo': 'scegliere', 'sceglieva': 'scegliere',
  'scelsi': 'scegliere', 'scelse': 'scegliere', 'scelsero': 'scegliere',
  'sceglierò': 'scegliere', 'sceglierà': 'scegliere',
  'sceglierei': 'scegliere', 'sceglierebbe': 'scegliere',
  'scelga': 'scegliere', 'scelgano': 'scegliere',
  'scegliendo': 'scegliere', 'scelto': 'scegliere', 'scelta': 'scegliere',
  // --- togliere ---
  'tolgo': 'togliere', 'togli': 'togliere', 'toglie': 'togliere', 'togliamo': 'togliere', 'tolgono': 'togliere',
  'toglievo': 'togliere', 'toglieva': 'togliere',
  'tolsi': 'togliere', 'tolse': 'togliere', 'tolsero': 'togliere',
  'toglierò': 'togliere', 'toglierà': 'togliere',
  'toglierei': 'togliere', 'toglierebbe': 'togliere',
  'tolga': 'togliere', 'tolgano': 'togliere',
  'togliendo': 'togliere', 'tolto': 'togliere',
  // --- piangere ---
  'piango': 'piangere', 'piangi': 'piangere', 'piange': 'piangere', 'piangiamo': 'piangere', 'piangono': 'piangere',
  'piansi': 'piangere', 'pianse': 'piangere', 'piansero': 'piangere',
  'piangendo': 'piangere', 'pianto': 'piangere',
  // --- rompere ---
  'rompo': 'rompere', 'rompi': 'rompere', 'rompe': 'rompere', 'rompiamo': 'rompere', 'rompono': 'rompere',
  'ruppi': 'rompere', 'ruppe': 'rompere', 'ruppero': 'rompere',
  'rompendo': 'rompere', 'rotto': 'rompere', 'rotta': 'rompere',
  // --- spendere ---
  'spendo': 'spendere', 'spendi': 'spendere', 'spende': 'spendere', 'spendiamo': 'spendere', 'spendono': 'spendere',
  'spesi': 'spendere', 'spese': 'spendere', 'spesero': 'spendere',
  'spendendo': 'spendere', 'speso': 'spendere',
  // --- chiedere ---
  'chiedo': 'chiedere', 'chiedi': 'chiedere', 'chiede': 'chiedere', 'chiediamo': 'chiedere', 'chiedono': 'chiedere',
  'chiedevo': 'chiedere', 'chiedeva': 'chiedere',
  'chiesi': 'chiedere', 'chiese': 'chiedere', 'chiesero': 'chiedere',
  'chiederò': 'chiedere', 'chiederà': 'chiedere',
  'chiederei': 'chiedere', 'chiederebbe': 'chiedere',
  'chieda': 'chiedere', 'chiedano': 'chiedere',
  'chiedendo': 'chiedere', 'chiesto': 'chiedere', 'chiesta': 'chiedere',
  // --- rispondere ---
  'rispondo': 'rispondere', 'rispondi': 'rispondere', 'risponde': 'rispondere', 'rispondiamo': 'rispondere', 'rispondono': 'rispondere',
  'risposi': 'rispondere', 'rispose': 'rispondere', 'risposero': 'rispondere',
  'rispondendo': 'rispondere', 'risposto': 'rispondere',
  // --- conoscere ---
  'conosco': 'conoscere', 'conosci': 'conoscere', 'conosce': 'conoscere', 'conosciamo': 'conoscere', 'conoscono': 'conoscere',
  'conoscevo': 'conoscere', 'conosceva': 'conoscere',
  'conobbi': 'conoscere', 'conobbe': 'conoscere', 'conobbero': 'conoscere',
  'conoscendo': 'conoscere', 'conosciuto': 'conoscere', 'conosciuta': 'conoscere',
  // --- accendere ---
  'accendo': 'accendere', 'accendi': 'accendere', 'accende': 'accendere',
  'accesi': 'accendere', 'accese': 'accendere',
  'accendendo': 'accendere', 'acceso': 'accendere',
  // --- spegnere ---
  'spengo': 'spegnere', 'spengi': 'spegnere', 'spenge': 'spegnere', 'spegniamo': 'spegnere', 'spengono': 'spegnere',
  'spensi': 'spegnere', 'spense': 'spegnere',
  'spegnendo': 'spegnere', 'spento': 'spegnere',
  // --- decidere ---
  'decido': 'decidere', 'decidi': 'decidere', 'decide': 'decidere', 'decidiamo': 'decidere', 'decidono': 'decidere',
  'decisi': 'decidere', 'decise': 'decidere', 'decisero': 'decidere',
  'decidendo': 'decidere', 'deciso': 'decidere',
  // --- correre ---
  'corro': 'correre', 'corri': 'correre', 'corre': 'correre', 'corriamo': 'correre', 'corrono': 'correre',
  'corsi': 'correre', 'corse': 'correre', 'corsero': 'correre',
  'correndo': 'correre', 'corso': 'correre',
  // --- vivere ---
  'vivo': 'vivere', 'vivi': 'vivere', 'vive': 'vivere', 'viviamo': 'vivere', 'vivono': 'vivere',
  'vissi': 'vivere', 'visse': 'vivere', 'vissero': 'vivere',
  'vivrò': 'vivere', 'vivrai': 'vivere', 'vivrà': 'vivere', 'vivremo': 'vivere', 'vivranno': 'vivere',
  'vivrei': 'vivere', 'vivrebbe': 'vivere',
  'vivendo': 'vivere', 'vissuto': 'vivere',
  // --- ridere ---
  'rido': 'ridere', 'ridi': 'ridere', 'ride': 'ridere', 'ridiamo': 'ridere', 'ridono': 'ridere',
  'risi': 'ridere', 'rise': 'ridere', 'risero': 'ridere',
  'ridendo': 'ridere', 'riso': 'ridere',
  // --- sorridere ---
  'sorrido': 'sorridere', 'sorridi': 'sorridere', 'sorride': 'sorridere',
  'sorrisi': 'sorridere', 'sorrise': 'sorridere',
  'sorridendo': 'sorridere', 'sorriso': 'sorridere',
  // --- distruggere ---
  'distruggo': 'distruggere', 'distruggi': 'distruggere', 'distrugge': 'distruggere',
  'distrussi': 'distruggere', 'distrusse': 'distruggere', 'distrussero': 'distruggere',
  'distruggendo': 'distruggere', 'distrutto': 'distruggere',
  // --- proteggere ---
  'proteggo': 'proteggere', 'proteggi': 'proteggere', 'protegge': 'proteggere',
  'protessi': 'proteggere', 'protesse': 'proteggere',
  'proteggendo': 'proteggere', 'protetto': 'proteggere',
  // --- dipingere ---
  'dipingo': 'dipingere', 'dipingi': 'dipingere', 'dipinge': 'dipingere',
  'dipinsi': 'dipingere', 'dipinse': 'dipingere',
  'dipingendo': 'dipingere', 'dipinto': 'dipingere',
  // --- convincere ---
  'convinco': 'convincere', 'convinci': 'convincere', 'convince': 'convincere',
  'convinsi': 'convincere', 'convinse': 'convincere',
  'convincendo': 'convincere', 'convinto': 'convincere',
  // --- riuscire ---
  'riesco': 'riuscire', 'riesci': 'riuscire', 'riesce': 'riuscire', 'riusciamo': 'riuscire', 'riescono': 'riuscire',
  'riuscii': 'riuscire', 'riuscì': 'riuscire',
  'riuscirò': 'riuscire', 'riuscirà': 'riuscire',
  'riuscirei': 'riuscire', 'riuscirebbe': 'riuscire',
  'riesca': 'riuscire', 'riescano': 'riuscire',
  'riuscendo': 'riuscire', 'riuscito': 'riuscire',
};

// ============================================================
// 5c. Build set of known infinitives from TRANSLATIONS + deck
// ============================================================
const knownInfinitives = new Set();
const infPattern = /^[a-zàèéìòóù]+(are|ere|ire|rre|rsi|arsi|ersi|irsi)$/;
for (const key of Object.keys(TRANSLATIONS)) {
  if (infPattern.test(key)) knownInfinitives.add(key);
}
for (const w of allWords) {
  if (infPattern.test(w)) knownInfinitives.add(w);
}
console.log('Known infinitives:', knownInfinitives.size);

// ============================================================
// 5d. findInfinitive(word) - resolve conjugated form to infinitive
// ============================================================
function findInfinitive(word) {
  const w = word.toLowerCase();

  // 1. Check irregular forms map first
  if (IRREGULAR_FORMS[w]) return IRREGULAR_FORMS[w];

  // 2. Strip Italian pronoun suffixes
  // Italian attaches pronouns to infinitives, gerunds, and imperatives
  const pronounSuffixes = [
    'glielo', 'gliela', 'glieli', 'gliele', 'gliene',
    'melo', 'mela', 'meli', 'mele', 'mene',
    'telo', 'tela', 'teli', 'tele', 'tene',
    'selo', 'sela', 'seli', 'sele', 'sene',
    'celo', 'cela', 'celi', 'cele', 'cene',
    'velo', 'vela', 'veli', 'vele', 'vene',
    'gli', 'mi', 'ti', 'ci', 'vi', 'si',
    'lo', 'la', 'li', 'le', 'ne'
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

  // Restore doubled consonant for imperatives: dammi -> da + mmi -> dare
  // fallo -> fa + llo -> fare, dimmi -> di + mmi -> dire
  const imperativeMap = {
    'damm': 'dare', 'dimm': 'dire', 'famm': 'fare', 'fall': 'fare',
    'dall': 'dare', 'dill': 'dire', 'fann': 'fare', 'dann': 'dare',
    'vamm': 'andare', 'stamm': 'stare',
  };
  for (const [stem, inf] of Object.entries(imperativeMap)) {
    if (stripped.startsWith(stem)) return inf;
  }

  // 3. Check if the word is already an infinitive
  if (infPattern.test(w)) {
    if (knownInfinitives.has(w)) return w;
  }

  // 4. Strip accents for stem matching
  const noAccent = stripped
    .replace(/à/g, 'a').replace(/è/g, 'e').replace(/é/g, 'e')
    .replace(/ì/g, 'i').replace(/ò/g, 'o').replace(/ó/g, 'o')
    .replace(/ù/g, 'u');

  // 5. Italian verb ending heuristics
  const verbEndings = [
    // Gerunds
    { suffix: 'ando', replace: 'are' },
    { suffix: 'endo', replace: 'ere' },
    // Present -iamo
    { suffix: 'iamo', replace: 'are' },
    { suffix: 'iamo', replace: 'ere' },
    { suffix: 'iamo', replace: 'ire' },
    // Present -ate/-ete/-ite
    { suffix: 'ate', replace: 'are' },
    { suffix: 'ete', replace: 'ere' },
    { suffix: 'ite', replace: 'ire' },
    // Present -ano/-ono
    { suffix: 'ano', replace: 'are' },
    { suffix: 'ono', replace: 'ere' },
    { suffix: 'ono', replace: 'ire' },
    // Past participles
    { suffix: 'ato', replace: 'are' },
    { suffix: 'ata', replace: 'are' },
    { suffix: 'ati', replace: 'are' },
    { suffix: 'uto', replace: 'ere' },
    { suffix: 'uta', replace: 'ere' },
    { suffix: 'uti', replace: 'ere' },
    { suffix: 'ito', replace: 'ire' },
    { suffix: 'ita', replace: 'ire' },
    { suffix: 'iti', replace: 'ire' },
    // Imperfetto
    { suffix: 'avo', replace: 'are' },
    { suffix: 'avi', replace: 'are' },
    { suffix: 'ava', replace: 'are' },
    { suffix: 'avamo', replace: 'are' },
    { suffix: 'avate', replace: 'are' },
    { suffix: 'avano', replace: 'are' },
    { suffix: 'evo', replace: 'ere' },
    { suffix: 'evi', replace: 'ere' },
    { suffix: 'eva', replace: 'ere' },
    { suffix: 'evano', replace: 'ere' },
    { suffix: 'ivo', replace: 'ire' },
    { suffix: 'ivi', replace: 'ire' },
    { suffix: 'iva', replace: 'ire' },
    { suffix: 'ivano', replace: 'ire' },
    // Present singular -a/-e/-i
    { suffix: 'a', replace: 'are' },
    { suffix: 'e', replace: 'ere' },
    { suffix: 'e', replace: 'ire' },
    { suffix: 'i', replace: 'ire' },
    { suffix: 'o', replace: 'are' },
    { suffix: 'o', replace: 'ere' },
    { suffix: 'o', replace: 'ire' },
  ];

  for (const { suffix, replace } of verbEndings) {
    if (noAccent.endsWith(suffix) && noAccent.length > suffix.length + 1) {
      const stem = noAccent.slice(0, -suffix.length) + replace;
      if (knownInfinitives.has(stem)) return stem;
      // Try reflexive form too
      const reflexive = stem.replace(/are$/, 'arsi').replace(/ere$/, 'ersi').replace(/ire$/, 'irsi');
      if (knownInfinitives.has(reflexive)) return reflexive;
    }
  }

  // 6. Try removing 1-7 chars from the end and adding -are/-ere/-ire
  const endings = ['are', 'ere', 'ire'];
  for (let cut = 1; cut <= 7 && cut < noAccent.length; cut++) {
    const stem = noAccent.slice(0, -cut);
    if (stem.length < 2) continue;
    for (const ending of endings) {
      const candidate = stem + ending;
      if (knownInfinitives.has(candidate)) return candidate;
      // Try reflexive
      const reflexive = candidate + 'si';
      if (knownInfinitives.has(reflexive)) return reflexive;
    }
  }

  return null;
}

// ============================================================
// 6. Cognate detection for missing words (Italian -> English)
// ============================================================
function guessCognate(word) {
  const w = word.toLowerCase();
  const transforms = [
    [/zione$/, 'tion'],
    [/sione$/, 'sion'],
    [/tà$/, 'ty'],
    [/mente$/, 'ly'],
    [/oso$/, 'ous'],
    [/osa$/, 'ous'],
    [/ivo$/, 'ive'],
    [/iva$/, 'ive'],
    [/bile$/, 'ble'],
    [/ibile$/, 'ible'],
    [/abile$/, 'able'],
    [/enza$/, 'ence'],
    [/anza$/, 'ance'],
    [/ario$/, 'ary'],
    [/ismo$/, 'ism'],
    [/ista$/, 'ist'],
    [/ura$/, 'ure'],
    [/ico$/, 'ic'],
    [/ica$/, 'ic'],
    [/ale$/, 'al'],
    [/ente$/, 'ent'],
    [/ante$/, 'ant'],
    [/ione$/, 'ion'],
  ];

  for (const [pattern, replacement] of transforms) {
    if (pattern.test(w)) {
      const english = w.replace(pattern, replacement)
        .replace(/à/g, 'a').replace(/è/g, 'e').replace(/é/g, 'e')
        .replace(/ì/g, 'i').replace(/ò/g, 'o').replace(/ó/g, 'o')
        .replace(/ù/g, 'u');
      return english;
    }
  }
  return null;
}

// ============================================================
// 7. Generate entries for all words
// ============================================================
const existingKeys = new Set(Object.keys(existingEntries));
const missing = allWords.filter(w => !existingKeys.has(w));
console.log('Missing words:', missing.length);

const newEntries = {};

for (const word of missing) {
  let translation = TRANSLATIONS[word];

  if (!translation) {
    const inf = findInfinitive(word);
    if (inf) {
      const infTranslation = TRANSLATIONS[inf] || TRANSLATIONS[inf.replace(/si$/, '').replace(/rsi$/, 're')] || null;
      if (infTranslation) {
        translation = infTranslation + ' (' + inf + ')';
      }
    }
  }

  if (!translation) {
    const cognate = guessCognate(word);
    if (cognate) {
      translation = cognate;
    } else {
      translation = 'see context';
    }
  }

  const ipa = italianIPA(word);
  const pos = guessPos(word);

  newEntries[word] = { en: translation, ipa: ipa, pos: pos };
}

console.log('Generated', Object.keys(newEntries).length, 'new entries');

// ============================================================
// 8. Build the complete dictionary file
// ============================================================
const allEntries = { ...existingEntries };
for (const [k, v] of Object.entries(newEntries)) {
  if (!allEntries[k]) {
    allEntries[k] = v;
  }
}

// Also add all TRANSLATIONS words even if not in deck
for (const [k, v] of Object.entries(TRANSLATIONS)) {
  if (!allEntries[k]) {
    allEntries[k] = { en: v, ipa: italianIPA(k), pos: guessPos(k) };
  }
}

// ============================================================
// 8b. Post-process: add infinitive references to verb entries
// ============================================================
for (const [key, entry] of Object.entries(allEntries)) {
  if (entry.pos === 'v') continue;
  const inf = findInfinitive(key);
  if (inf && (TRANSLATIONS[inf] || TRANSLATIONS[inf.replace(/si$/, '').replace(/rsi$/, 're')])) {
    entry.pos = 'v';
  }
}

// Strip prior infinitive annotations
for (const [key, entry] of Object.entries(allEntries)) {
  if (entry.pos !== 'v') continue;
  entry.en = entry.en.replace(/\s*\([a-zàèéìòóù]+(?:si|rsi|rre|are|ere|ire)?\)/g, '').trim();
}

let infinitiveAdded = 0;
let infinitiveReplaced = 0;
for (const [key, entry] of Object.entries(allEntries)) {
  if (entry.pos !== 'v') continue;
  if (infPattern.test(key)) continue;

  const inf = findInfinitive(key);
  if (!inf) continue;

  const infTranslation = TRANSLATIONS[inf] || TRANSLATIONS[inf.replace(/si$/, '').replace(/rsi$/, 're')] || null;

  if (TRANSLATIONS[key] && entry.en && entry.en !== 'see context') {
    entry.en = entry.en + ' (' + inf + ')';
    infinitiveAdded++;
  } else {
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

const sortedKeys = Object.keys(allEntries).sort((a, b) => a.localeCompare(b, 'it'));
console.log('Total dictionary entries:', sortedKeys.length);

// ============================================================
// 9. Write output
// ============================================================
let output = `// Italian -> English dictionary with IPA phonetics
// Auto-generated by generate-dictionary-it.cjs

export interface DictEntry {
  en: string;   // English translation
  ipa: string;  // IPA pronunciation
  pos?: string; // Part of speech: n, v, adj, adv, prep, conj, det, pron
}

// Lookup helper: strips punctuation, lowercases, tries base forms
export function lookupWord(word: string): DictEntry | null {
  const clean = word.toLowerCase().replace(/[.,!?;:\\"\\"""''()—–\\-]/g, '').trim();
  if (!clean) return null;

  // Direct match
  if (dictionary[clean]) return dictionary[clean];

  // Strip attached pronouns (Italian attaches pronouns to infinitives, gerunds, imperatives)
  const pronounSuffixes = ['glielo', 'gliela', 'glieli', 'gliele', 'gliene', 'melo', 'mela', 'meli', 'mele', 'mene', 'telo', 'tela', 'teli', 'tele', 'tene', 'selo', 'sela', 'seli', 'sele', 'sene', 'celo', 'cela', 'celi', 'cele', 'cene', 'velo', 'vela', 'veli', 'vele', 'vene', 'gli', 'mi', 'ti', 'ci', 'vi', 'si', 'lo', 'la', 'li', 'le', 'ne'];
  for (const pronoun of pronounSuffixes) {
    if (clean.endsWith(pronoun) && clean.length > pronoun.length + 2) {
      const stripped = clean.slice(0, -pronoun.length);
      if (dictionary[stripped]) return dictionary[stripped];
      // Infinitive with pronoun: farlo -> fare (need to add back -re/-e)
      if (stripped.endsWith('ar') || stripped.endsWith('er') || stripped.endsWith('ir')) {
        const inf = stripped + 'e';
        if (dictionary[inf]) return dictionary[inf];
      }
      if (stripped.endsWith('r')) {
        const inf1 = stripped + 'e';
        if (dictionary[inf1]) return dictionary[inf1];
        const inf2 = stripped + 'si';
        if (dictionary[inf2]) return dictionary[inf2];
      }
    }
  }

  // Try common verb endings -> infinitive approximations
  const verbEndings = [
    { suffix: 'ando', replace: 'are' },
    { suffix: 'endo', replace: 'ere' },
    { suffix: 'iamo', replace: 'are' },
    { suffix: 'iamo', replace: 'ere' },
    { suffix: 'iamo', replace: 'ire' },
    { suffix: 'ate', replace: 'are' },
    { suffix: 'ete', replace: 'ere' },
    { suffix: 'ite', replace: 'ire' },
    { suffix: 'ano', replace: 'are' },
    { suffix: 'ono', replace: 'ere' },
    { suffix: 'ono', replace: 'ire' },
    { suffix: 'ato', replace: 'are' },
    { suffix: 'uto', replace: 'ere' },
    { suffix: 'ito', replace: 'ire' },
    { suffix: 'ava', replace: 'are' },
    { suffix: 'eva', replace: 'ere' },
    { suffix: 'iva', replace: 'ire' },
  ];

  for (const { suffix, replace } of verbEndings) {
    if (clean.endsWith(suffix)) {
      const stem = clean.slice(0, -suffix.length) + replace;
      if (dictionary[stem]) return dictionary[stem];
    }
  }

  // Try removing plural -i / -e / -s
  if (clean.endsWith('i') && dictionary[clean.slice(0, -1) + 'o']) return dictionary[clean.slice(0, -1) + 'o'];
  if (clean.endsWith('i') && dictionary[clean.slice(0, -1) + 'e']) return dictionary[clean.slice(0, -1) + 'e'];
  if (clean.endsWith('e') && dictionary[clean.slice(0, -1) + 'a']) return dictionary[clean.slice(0, -1) + 'a'];

  // Try removing gender suffix -a/-o
  if (clean.endsWith('a') && dictionary[clean.slice(0, -1) + 'o']) return dictionary[clean.slice(0, -1) + 'o'];
  if (clean.endsWith('o') && dictionary[clean.slice(0, -1) + 'a']) return dictionary[clean.slice(0, -1) + 'a'];

  return null;
}

`;

output += 'export const dictionary: Record<string, DictEntry> = {\n';

for (const key of sortedKeys) {
  const e = allEntries[key];
  const en = (e.en || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  const ipa = (e.ipa || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  const pos = e.pos || 'n';
  output += `  "${key}": { en: "${en}", ipa: "${ipa}", pos: "${pos}" },\n`;
}

output += '};\n';

fs.writeFileSync(DICT_PATH, output, 'utf8');
console.log('Dictionary written to', DICT_PATH);
console.log('File size:', (output.length / 1024).toFixed(1), 'KB');
