#!/usr/bin/env node
/**
 * Word-level alignment for Italian and Portuguese flashcards.
 * Processes deck.json → outputs {lang}-alignments.json
 */

const fs = require('fs');
const path = require('path');

const BASE = '/Users/antoinevj/Documents/GitHub/my-gamified-srs-app/.claude/worktrees/agitated-boyd';
const OUT = path.join(BASE, 'scripts/output');

// ─── Utility ────────────────────────────────────────────────────────────────

function stripPunct(w) {
  return w.replace(/^[¿¡«"'(…]+/, '').replace(/[.!?,;:»"')…\-]+$/, '');
}

function tokenize(sentence) {
  return sentence.split(/\s+/).map(w => stripPunct(w).toLowerCase()).filter(Boolean);
}

// ─── Italian contractions ───────────────────────────────────────────────────

const IT_CONTRACTIONS = {
  // preposition + article
  "al": ["a", "il"], "allo": ["a", "lo"], "alla": ["a", "la"],
  "ai": ["a", "i"], "agli": ["a", "gli"], "alle": ["a", "le"],
  "del": ["di", "il"], "dello": ["di", "lo"], "della": ["di", "la"],
  "dei": ["di", "i"], "degli": ["di", "gli"], "delle": ["di", "le"],
  "dal": ["da", "il"], "dallo": ["da", "lo"], "dalla": ["da", "la"],
  "dai": ["da", "i"], "dagli": ["da", "gli"], "dalle": ["da", "le"],
  "nel": ["in", "il"], "nello": ["in", "lo"], "nella": ["in", "la"],
  "nei": ["in", "i"], "negli": ["in", "gli"], "nelle": ["in", "le"],
  "sul": ["su", "il"], "sullo": ["su", "lo"], "sulla": ["su", "la"],
  "sui": ["su", "i"], "sugli": ["su", "gli"], "sulle": ["su", "le"],
  "col": ["con", "il"], "coi": ["con", "i"],
};

// Elisions: l', dell', nell', un', d', c', s', quest', quell'
function expandItalian(token) {
  // Handle elisions with apostrophe
  if (token.includes("'") || token.includes("'")) {
    const apos = token.replace("'", "'");
    const parts = apos.split("'");
    if (parts.length === 2 && parts[1]) {
      const prefix = parts[0].toLowerCase();
      const suffix = parts[1].toLowerCase();
      // common elisions
      const elisionMap = {
        "l": ["il/la", suffix],
        "un": ["un", suffix],
        "d": ["di", suffix],
        "c": ["ci", suffix],
        "s": ["si", suffix],
        "dell": ["di", suffix],
        "nell": ["in", suffix],
        "dall": ["da", suffix],
        "sull": ["su", suffix],
        "all": ["a", suffix],
        "quest": ["questo/a", suffix],
        "quell": ["quello/a", suffix],
        "qual": ["quale", suffix],
        "bell": ["bello/a", suffix],
        "anch": ["anche", suffix],
        "com": ["come", suffix],
        "cos": ["cosa", suffix],
        "tutt": ["tutto/a", suffix],
      };
      if (elisionMap[prefix]) {
        return elisionMap[prefix];
      }
      // fallback: just split
      return [prefix, suffix];
    }
  }
  // Handle contractions
  if (IT_CONTRACTIONS[token]) {
    return IT_CONTRACTIONS[token];
  }
  return [token];
}

// ─── Portuguese contractions ────────────────────────────────────────────────

const PT_CONTRACTIONS = {
  // em + article
  "no": ["em", "o"], "na": ["em", "a"], "nos": ["em", "os"], "nas": ["em", "as"],
  "num": ["em", "um"], "numa": ["em", "uma"], "nuns": ["em", "uns"], "numas": ["em", "umas"],
  "neste": ["em", "este"], "nesta": ["em", "esta"], "nestes": ["em", "estes"], "nestas": ["em", "estas"],
  "nesse": ["em", "esse"], "nessa": ["em", "essa"], "nesses": ["em", "esses"], "nessas": ["em", "essas"],
  "naquele": ["em", "aquele"], "naquela": ["em", "aquela"],
  "naqueles": ["em", "aqueles"], "naquelas": ["em", "aquelas"],
  "naquilo": ["em", "aquilo"], "nisso": ["em", "isso"], "nisto": ["em", "isto"],
  "nalgum": ["em", "algum"], "nalguma": ["em", "alguma"],
  // de + article
  "do": ["de", "o"], "da": ["de", "a"], "dos": ["de", "os"], "das": ["de", "as"],
  "dum": ["de", "um"], "duma": ["de", "uma"], "duns": ["de", "uns"], "dumas": ["de", "umas"],
  "deste": ["de", "este"], "desta": ["de", "esta"], "destes": ["de", "estes"], "destas": ["de", "estas"],
  "desse": ["de", "esse"], "dessa": ["de", "essa"], "desses": ["de", "esses"], "dessas": ["de", "essas"],
  "daquele": ["de", "aquele"], "daquela": ["de", "aquela"],
  "daqueles": ["de", "aqueles"], "daquelas": ["de", "aquelas"],
  "daquilo": ["de", "aquilo"], "disso": ["de", "isso"], "disto": ["de", "isto"],
  // a + article (crase handled separately)
  "ao": ["a", "o"], "aos": ["a", "os"],
  "à": ["a", "a"], "às": ["a", "as"],
  "àquele": ["a", "aquele"], "àquela": ["a", "aquela"],
  "àqueles": ["a", "aqueles"], "àquelas": ["a", "aquelas"],
  "àquilo": ["a", "aquilo"],
  // por + article
  "pelo": ["por", "o"], "pela": ["por", "a"], "pelos": ["por", "os"], "pelas": ["por", "as"],
  // para + article (colloquial)
  "pro": ["para", "o"], "pra": ["para", "a"], "pros": ["para", "os"], "pras": ["para", "as"],
};

function expandPortuguese(token) {
  if (PT_CONTRACTIONS[token]) {
    return PT_CONTRACTIONS[token];
  }
  return [token];
}

// ─── Italian word meanings ──────────────────────────────────────────────────

const IT_MEANINGS = {
  // Pronouns
  "io": "I", "tu": "you", "lui": "he", "lei": "she", "noi": "we",
  "voi": "you (pl)", "loro": "they", "me": "me", "te": "you",
  "ci": "us/there", "vi": "you (pl)", "si": "oneself",
  "mi": "me/my", "ti": "you/your", "lo": "him/it", "la": "her/it",
  "li": "them (m)", "le": "them (f)/her", "ne": "of it/some",
  "questo": "this", "questa": "this", "questi": "these", "queste": "these",
  "quello": "that", "quella": "that", "quelli": "those", "quelle": "those",
  "chi": "who", "che": "that/what", "cosa": "thing/what",
  "quale": "which", "quali": "which (pl)",
  "quanto": "how much", "quanta": "how much", "quanti": "how many", "quante": "how many",
  "dove": "where", "quando": "when", "come": "how", "perché": "why/because",
  "tutto": "everything/all", "tutta": "all", "tutti": "everyone/all", "tutte": "all",
  "niente": "nothing", "nulla": "nothing",
  "qualcosa": "something", "qualcuno": "someone",
  "ognuno": "everyone", "ciascuno": "each one",
  "stesso": "same/self", "stessa": "same/self",
  "proprio": "own", "propria": "own",
  "altro": "other", "altra": "other", "altri": "others", "altre": "others",

  // Articles
  "il": "the", "lo": "the", "la": "the", "i": "the",
  "gli": "the", "le": "the",
  "un": "a/an", "uno": "a/an", "una": "a/an",

  // Prepositions
  "di": "of", "a": "to/at", "da": "from/by", "in": "in",
  "con": "with", "su": "on", "per": "for", "tra": "between",
  "fra": "between", "senza": "without", "dopo": "after",
  "prima": "before/first", "durante": "during", "verso": "toward",
  "contro": "against", "oltre": "beyond", "fino": "until",
  "sotto": "under", "sopra": "above", "dentro": "inside",
  "fuori": "outside", "dietro": "behind", "davanti": "in front of",
  "vicino": "near", "lontano": "far", "insieme": "together",
  "circa": "about/around", "tranne": "except", "secondo": "according to",
  "attraverso": "through", "lungo": "along", "nonostante": "despite",
  "malgrado": "despite", "mediante": "by means of",

  // Conjunctions
  "e": "and", "ed": "and", "o": "or", "ma": "but",
  "però": "however", "anche": "also", "né": "neither/nor",
  "se": "if", "quando": "when", "mentre": "while",
  "perché": "because/why", "poiché": "since", "quindi": "therefore",
  "dunque": "therefore", "oppure": "or else", "anzi": "rather",
  "cioè": "that is", "infatti": "in fact", "eppure": "yet",
  "altrimenti": "otherwise", "benché": "although",

  // Common verbs (infinitive meanings)
  "è": "to be (is)", "sono": "to be (am/are)", "sei": "to be (are)",
  "siamo": "to be (are)", "siete": "to be (are)",
  "era": "to be (was)", "ero": "to be (was)", "eri": "to be (were)",
  "eravamo": "to be (were)", "eravate": "to be (were)", "erano": "to be (were)",
  "ha": "to have (has)", "ho": "to have (have)", "hai": "to have (have)",
  "abbiamo": "to have (have)", "avete": "to have (have)", "hanno": "to have (have)",
  "aveva": "to have (had)", "avevo": "to have (had)", "avevi": "to have (had)",
  "avevamo": "to have (had)", "avevate": "to have (had)", "avevano": "to have (had)",
  "fa": "to do/make (does)", "faccio": "to do/make (do)", "fai": "to do/make (do)",
  "facciamo": "to do/make (do)", "fate": "to do/make (do)", "fanno": "to do/make (do)",
  "faceva": "to do/make (did)", "facevo": "to do/make (did)",
  "va": "to go (goes)", "vado": "to go (go)", "vai": "to go (go)",
  "andiamo": "to go (go)", "andate": "to go (go)", "vanno": "to go (go)",
  "andava": "to go (went)", "andavo": "to go (went)",
  "viene": "to come (comes)", "vengo": "to come (come)", "vieni": "to come (come)",
  "veniamo": "to come (come)", "venite": "to come (come)", "vengono": "to come (come)",
  "veniva": "to come (came)", "venivo": "to come (came)",
  "dice": "to say (says)", "dico": "to say (say)", "dici": "to say (say)",
  "diciamo": "to say (say)", "dite": "to say (say)", "dicono": "to say (say)",
  "diceva": "to say (said)", "dicevo": "to say (said)",
  "sa": "to know (knows)", "so": "to know (know)", "sai": "to know (know)",
  "sappiamo": "to know (know)", "sapete": "to know (know)", "sanno": "to know (know)",
  "sapeva": "to know (knew)", "sapevo": "to know (knew)",
  "può": "to be able (can)", "posso": "to be able (can)", "puoi": "to be able (can)",
  "possiamo": "to be able (can)", "potete": "to be able (can)", "possono": "to be able (can)",
  "poteva": "to be able (could)", "potevo": "to be able (could)",
  "deve": "to have to (must)", "devo": "to have to (must)", "devi": "to have to (must)",
  "dobbiamo": "to have to (must)", "dovete": "to have to (must)", "devono": "to have to (must)",
  "doveva": "to have to (had to)", "dovevo": "to have to (had to)",
  "vuole": "to want (wants)", "voglio": "to want (want)", "vuoi": "to want (want)",
  "vogliamo": "to want (want)", "volete": "to want (want)", "vogliono": "to want (want)",
  "voleva": "to want (wanted)", "volevo": "to want (wanted)",
  "sta": "to stay/be (is)", "sto": "to stay/be (am)", "stai": "to stay/be (are)",
  "stiamo": "to stay/be (are)", "state": "to stay/be (are)", "stanno": "to stay/be (are)",
  "stava": "to stay/be (was)", "stavo": "to stay/be (was)",
  "dà": "to give (gives)", "do": "to give (give)", "dai": "to give (give)",
  "diamo": "to give (give)", "date": "to give (give)", "danno": "to give (give)",
  "dava": "to give (gave)", "davo": "to give (gave)",

  // Common -are verbs
  "lavora": "to work (works)", "lavoro": "to work (work)", "lavori": "to work (work)",
  "lavoriamo": "to work (work)", "lavorate": "to work (work)", "lavorano": "to work (work)",
  "lavorava": "to work (worked)", "lavoravo": "to work (worked)", "lavorato": "to work (worked)",
  "parla": "to speak (speaks)", "parlo": "to speak (speak)", "parli": "to speak (speak)",
  "parliamo": "to speak (speak)", "parlate": "to speak (speak)", "parlano": "to speak (speak)",
  "parlava": "to speak (spoke)", "parlavo": "to speak (spoke)", "parlato": "to speak (spoken)",
  "mangia": "to eat (eats)", "mangio": "to eat (eat)", "mangi": "to eat (eat)",
  "mangiamo": "to eat (eat)", "mangiate": "to eat (eat)", "mangiano": "to eat (eat)",
  "mangiava": "to eat (ate)", "mangiavo": "to eat (ate)", "mangiato": "to eat (eaten)",
  "gioca": "to play (plays)", "gioco": "to play (play)", "giochi": "to play (play)",
  "giochiamo": "to play (play)", "giocate": "to play (play)", "giocano": "to play (play)",
  "guarda": "to watch (watches)", "guardo": "to watch (watch)", "guardi": "to watch (watch)",
  "guardiamo": "to watch (watch)", "guardate": "to watch (watch)", "guardano": "to watch (watch)",
  "compra": "to buy (buys)", "compro": "to buy (buy)", "compri": "to buy (buy)",
  "compriamo": "to buy (buy)", "comprate": "to buy (buy)", "comprano": "to buy (buy)",
  "paga": "to pay (pays)", "pago": "to pay (pay)", "paghi": "to pay (pay)",
  "paghiamo": "to pay (pay)", "pagate": "to pay (pay)", "pagano": "to pay (pay)",
  "chiama": "to call (calls)", "chiamo": "to call (call)", "chiami": "to call (call)",
  "chiamiamo": "to call (call)", "chiamate": "to call (call)", "chiamano": "to call (call)",
  "porta": "to bring (brings)", "porto": "to bring (bring)", "porti": "to bring (bring)",
  "portiamo": "to bring (bring)", "portate": "to bring (bring)", "portano": "to bring (bring)",
  "trova": "to find (finds)", "trovo": "to find (find)", "trovi": "to find (find)",
  "troviamo": "to find (find)", "trovate": "to find (find)", "trovano": "to find (find)",
  "arriva": "to arrive (arrives)", "arrivo": "to arrive (arrive)", "arrivi": "to arrive (arrive)",
  "arriviamo": "to arrive (arrive)", "arrivate": "to arrive (arrive)", "arrivano": "to arrive (arrive)",
  "passa": "to pass (passes)", "passo": "to pass (pass)", "passi": "to pass (pass)",
  "passiamo": "to pass (pass)", "passate": "to pass (pass)", "passano": "to pass (pass)",
  "cammina": "to walk (walks)", "cammino": "to walk (walk)", "cammini": "to walk (walk)",
  "camminiamo": "to walk (walk)", "camminate": "to walk (walk)", "camminano": "to walk (walk)",
  "aspetta": "to wait (waits)", "aspetto": "to wait (wait)", "aspetti": "to wait (wait)",
  "aspettiamo": "to wait (wait)", "aspettate": "to wait (wait)", "aspettano": "to wait (wait)",
  "pensa": "to think (thinks)", "penso": "to think (think)", "pensi": "to think (think)",
  "pensiamo": "to think (think)", "pensate": "to think (think)", "pensano": "to think (think)",
  "conta": "to count (counts)", "conto": "to count (count)", "conti": "to count (count)",
  "contiamo": "to count (count)", "contate": "to count (count)", "contano": "to count (count)",
  "prepara": "to prepare (prepares)", "preparo": "to prepare (prepare)", "prepari": "to prepare (prepare)",
  "cucina": "to cook (cooks)", "cucino": "to cook (cook)", "cucini": "to cook (cook)",
  "studia": "to study (studies)", "studio": "to study (study)", "studi": "to study (study)",
  "studiamo": "to study (study)", "studiate": "to study (study)", "studiano": "to study (study)",
  "insegna": "to teach (teaches)", "insegno": "to teach (teach)", "insegni": "to teach (teach)",
  "impara": "to learn (learns)", "imparo": "to learn (learn)", "impari": "to learn (learn)",
  "abita": "to live (lives)", "abito": "to live (live)", "abiti": "to live (live)",
  "abitiamo": "to live (live)", "abitate": "to live (live)", "abitano": "to live (live)",
  "viaggia": "to travel (travels)", "viaggio": "to travel (travel)", "viaggi": "to travel (travel)",
  "viaggiamo": "to travel (travel)", "viaggiate": "to travel (travel)", "viaggiano": "to travel (travel)",
  "cambia": "to change (changes)", "cambio": "to change (change)", "cambi": "to change (change)",
  "canta": "to sing (sings)", "canto": "to sing (sing)", "canti": "to sing (sing)",
  "balla": "to dance (dances)", "ballo": "to dance (dance)", "balli": "to dance (dance)",
  "nuota": "to swim (swims)", "nuoto": "to swim (swim)", "nuoti": "to swim (swim)",
  "suona": "to play music (plays)", "suono": "to play music (play)", "suoni": "to play music (play)",
  "torna": "to return (returns)", "torno": "to return (return)", "torni": "to return (return)",
  "cerca": "to search (searches)", "cerco": "to search (search)", "cerchi": "to search (search)",
  "prova": "to try (tries)", "provo": "to try (try)", "provi": "to try (try)",
  "ama": "to love (loves)", "amo": "to love (love)", "ami": "to love (love)",
  "amiamo": "to love (love)", "amate": "to love (love)", "amano": "to love (love)",
  "spera": "to hope (hopes)", "spero": "to hope (hope)", "speri": "to hope (hope)",
  "entra": "to enter (enters)", "entro": "to enter (enter)", "entri": "to enter (enter)",
  "ricorda": "to remember", "ricordo": "to remember", "ricordi": "to remember",
  "inizia": "to start (starts)", "inizio": "to start (start)", "inizi": "to start (start)",
  "finisca": "to finish (subj)", "finisce": "to finish (finishes)", "finisco": "to finish (finish)",

  // Common -ere verbs
  "legge": "to read (reads)", "leggo": "to read (read)", "leggi": "to read (read)",
  "leggiamo": "to read (read)", "leggete": "to read (read)", "leggono": "to read (read)",
  "leggeva": "to read (read)", "letto": "to read (read)",
  "scrive": "to write (writes)", "scrivo": "to write (write)", "scrivi": "to write (write)",
  "scriviamo": "to write (write)", "scrivete": "to write (write)", "scrivono": "to write (write)",
  "scritto": "to write (written)",
  "prende": "to take (takes)", "prendo": "to take (take)", "prendi": "to take (take)",
  "prendiamo": "to take (take)", "prendete": "to take (take)", "prendono": "to take (take)",
  "preso": "to take (taken)",
  "vede": "to see (sees)", "vedo": "to see (see)", "vedi": "to see (see)",
  "vediamo": "to see (see)", "vedete": "to see (see)", "vedono": "to see (see)",
  "vedeva": "to see (saw)", "visto": "to see (seen)",
  "crede": "to believe (believes)", "credo": "to believe (believe)", "credi": "to believe (believe)",
  "mette": "to put (puts)", "metto": "to put (put)", "metti": "to put (put)",
  "mettiamo": "to put (put)", "mettete": "to put (put)", "mettono": "to put (put)",
  "messo": "to put (put)",
  "vive": "to live (lives)", "vivo": "to live (live)", "vivi": "to live (live)",
  "viviamo": "to live (live)", "vivete": "to live (live)", "vivono": "to live (live)",
  "chiude": "to close (closes)", "chiudo": "to close (close)", "chiudi": "to close (close)",
  "beve": "to drink (drinks)", "bevo": "to drink (drink)", "bevi": "to drink (drink)",
  "beviamo": "to drink (drink)", "bevete": "to drink (drink)", "bevono": "to drink (drink)",
  "corre": "to run (runs)", "corro": "to run (run)", "corri": "to run (run)",
  "corriamo": "to run (run)", "correte": "to run (run)", "corrono": "to run (run)",
  "piove": "to rain (rains)",
  "conosce": "to know (knows)", "conosco": "to know (know)", "conosci": "to know (know)",
  "conosciamo": "to know (know)", "conoscete": "to know (know)", "conoscono": "to know (know)",
  "risponde": "to answer", "rispondo": "to answer", "rispondi": "to answer",
  "chiedere": "to ask", "chiede": "to ask (asks)", "chiedo": "to ask (ask)", "chiedi": "to ask (ask)",
  "scende": "to descend", "scendo": "to descend", "scendi": "to descend",
  "spende": "to spend", "spendo": "to spend", "spendi": "to spend",
  "piace": "to like (pleases)", "piacciono": "to like (please)",

  // Common -ire verbs
  "apre": "to open (opens)", "apro": "to open (open)", "apri": "to open (open)",
  "apriamo": "to open (open)", "aprite": "to open (open)", "aprono": "to open (open)",
  "aperto": "to open (opened)",
  "dorme": "to sleep (sleeps)", "dormo": "to sleep (sleep)", "dormi": "to sleep (sleep)",
  "dormiamo": "to sleep (sleep)", "dormite": "to sleep (sleep)", "dormono": "to sleep (sleep)",
  "parte": "to leave (leaves)", "parto": "to leave (leave)", "parti": "to leave (leave)",
  "partiamo": "to leave (leave)", "partite": "to leave (leave)", "partono": "to leave (leave)",
  "sente": "to hear (hears)", "sento": "to hear (hear)", "senti": "to hear (hear)",
  "sentiamo": "to hear (hear)", "sentite": "to hear (hear)", "sentono": "to hear (hear)",
  "capisce": "to understand", "capisco": "to understand", "capisci": "to understand",
  "capiamo": "to understand", "capite": "to understand", "capiscono": "to understand",
  "preferisce": "to prefer", "preferisco": "to prefer", "preferisci": "to prefer",
  "preferiamo": "to prefer", "preferite": "to prefer", "preferiscono": "to prefer",
  "offre": "to offer (offers)", "offro": "to offer (offer)", "offri": "to offer (offer)",
  "segue": "to follow (follows)", "seguo": "to follow (follow)", "segui": "to follow (follow)",
  "esce": "to go out (goes out)", "esco": "to go out (go out)", "esci": "to go out (go out)",
  "usciamo": "to go out (go out)", "escono": "to go out (go out)",
  "costruisce": "to build", "costruisco": "to build", "costruisci": "to build",
  "pulisce": "to clean", "pulisco": "to clean", "pulisci": "to clean",
  "unisce": "to unite", "unisco": "to unite", "unisci": "to unite",
  "colpisce": "to hit", "colpisco": "to hit", "colpisci": "to hit",
  "finisce": "to finish", "finisco": "to finish", "finisci": "to finish",
  "spedisce": "to send", "spedisco": "to send", "spedisci": "to send",
  "gestisce": "to manage", "gestisco": "to manage", "gestisci": "to manage",
  "suggerisce": "to suggest", "suggerisco": "to suggest", "suggerisci": "to suggest",
  "definisce": "to define", "definisco": "to define", "definisci": "to define",
  "divertire": "to amuse", "diverte": "to amuse", "diverto": "to amuse",
  "servire": "to serve", "serve": "to serve (serves)", "servo": "to serve",

  // Reflexive pronouns already covered in pronouns
  // Past participles / gerunds
  "stato": "been", "stata": "been", "stati": "been", "state": "been",
  "avuto": "had", "fatto": "done/made", "fatta": "done/made",
  "andato": "gone", "andata": "gone", "andati": "gone", "andate": "gone",
  "venuto": "come", "venuta": "come", "venuti": "come",
  "detto": "said", "detta": "said",
  "dato": "given", "data": "given",
  "potuto": "been able", "dovuto": "had to", "voluto": "wanted",
  "saputo": "known", "conosciuto": "known",
  "sentito": "heard/felt", "capito": "understood",
  "vissuto": "lived", "bevuto": "drunk",
  "corso": "run", "chiesto": "asked", "risposto": "answered",
  "tornato": "returned", "tornata": "returned",
  "trovato": "found", "trovata": "found",
  "lasciato": "left", "lasciata": "left",
  "portato": "brought", "portata": "brought",
  "comprato": "bought", "comprata": "bought",
  "pagato": "paid", "pagata": "paid",
  "passato": "passed/spent", "passata": "passed",
  "cambiato": "changed", "cambiata": "changed",
  "cercato": "searched", "cercata": "searched",
  "provato": "tried", "provata": "tried",
  "amato": "loved", "amata": "loved",
  "preparato": "prepared", "preparata": "prepared",
  "cucinato": "cooked", "cucinata": "cooked",
  "studiato": "studied", "studiata": "studied",
  "lavorato": "worked",
  "parlato": "spoken", "mangiato": "eaten",
  "guardato": "watched", "giocato": "played",
  "cantato": "sung", "ballato": "danced",
  "nuotato": "swum", "suonato": "played (music)",
  "iniziato": "started", "finito": "finished",
  "dormito": "slept", "partito": "left", "partita": "left",
  "aperto": "opened", "chiuso": "closed",
  "perso": "lost", "persa": "lost",
  "imparato": "learned",

  // Gerunds
  "facendo": "doing/making", "andando": "going", "venendo": "coming",
  "dicendo": "saying", "leggendo": "reading", "scrivendo": "writing",
  "prendendo": "taking", "vedendo": "seeing", "mettendo": "putting",
  "bevendo": "drinking", "correndo": "running",
  "mangiando": "eating", "parlando": "speaking", "lavorando": "working",
  "studiando": "studying", "giocando": "playing", "guardando": "watching",
  "cucinando": "cooking", "cantando": "singing", "ballando": "dancing",
  "viaggiando": "traveling", "camminando": "walking", "cercando": "searching",
  "aspettando": "waiting", "pensando": "thinking",

  // Future/conditional
  "sarà": "will be", "avrà": "will have", "farà": "will do",
  "andrà": "will go", "verrà": "will come", "dirà": "will say",
  "potrà": "will be able", "dovrà": "will have to", "vorrà": "will want",
  "sarei": "would be", "avrei": "would have", "farei": "would do",
  "andrei": "would go", "verrei": "would come", "direi": "would say",
  "potrei": "could", "dovrei": "should", "vorrei": "would want",

  // Subjunctive
  "sia": "be (subj)", "abbia": "have (subj)", "faccia": "do (subj)",
  "vada": "go (subj)", "venga": "come (subj)", "dica": "say (subj)",
  "possa": "can (subj)", "debba": "must (subj)", "voglia": "want (subj)",
  "stia": "be (subj)", "sappia": "know (subj)",
  "fosse": "were (subj)", "avesse": "had (subj)", "potesse": "could (subj)",

  // Imperative
  "guarda": "look!", "senti": "listen!", "dimmi": "tell me",
  "fammi": "make me", "dammi": "give me", "vieni": "come!",

  // Common nouns
  "casa": "house", "uomo": "man", "donna": "woman", "bambino": "child",
  "bambina": "girl", "ragazzo": "boy", "ragazza": "girl",
  "padre": "father", "madre": "mother", "fratello": "brother", "sorella": "sister",
  "figlio": "son", "figlia": "daughter", "famiglia": "family",
  "amico": "friend", "amica": "friend (f)",
  "tempo": "time/weather", "anno": "year", "mese": "month",
  "settimana": "week", "giorno": "day", "ora": "hour/now",
  "mattina": "morning", "pomeriggio": "afternoon", "sera": "evening",
  "notte": "night", "oggi": "today", "domani": "tomorrow", "ieri": "yesterday",
  "vita": "life", "mondo": "world", "paese": "country",
  "città": "city", "via": "street", "strada": "road",
  "acqua": "water", "cibo": "food", "pane": "bread",
  "vino": "wine", "caffè": "coffee", "latte": "milk",
  "carne": "meat", "pesce": "fish", "frutta": "fruit",
  "verdura": "vegetables", "formaggio": "cheese",
  "libro": "book", "scuola": "school", "lavoro": "work/job",
  "ufficio": "office", "negozio": "shop", "ristorante": "restaurant",
  "hotel": "hotel", "ospedale": "hospital", "museo": "museum",
  "chiesa": "church", "piazza": "square", "parco": "park",
  "mare": "sea", "montagna": "mountain", "fiume": "river",
  "lago": "lake", "spiaggia": "beach", "isola": "island",
  "sole": "sun", "luna": "moon", "stella": "star",
  "cielo": "sky", "terra": "earth/ground", "aria": "air",
  "fuoco": "fire", "pioggia": "rain", "neve": "snow",
  "vento": "wind", "albero": "tree", "fiore": "flower",
  "giardino": "garden", "campo": "field",
  "porta": "door", "finestra": "window", "tavolo": "table",
  "sedia": "chair", "letto": "bed", "cucina": "kitchen",
  "bagno": "bathroom", "camera": "room", "stanza": "room",
  "macchina": "car", "treno": "train", "autobus": "bus",
  "aereo": "airplane", "bicicletta": "bicycle",
  "mano": "hand", "testa": "head", "occhio": "eye",
  "occhi": "eyes", "bocca": "mouth", "cuore": "heart",
  "corpo": "body", "braccio": "arm", "gamba": "leg",
  "piede": "foot", "dito": "finger",
  "nome": "name", "numero": "number", "problema": "problem",
  "parte": "part", "modo": "way", "tipo": "type",
  "idea": "idea", "cosa": "thing", "punto": "point",
  "posto": "place", "esempio": "example", "momento": "moment",
  "volta": "time (occasion)", "storia": "story/history",
  "persona": "person", "gente": "people",
  "domanda": "question", "risposta": "answer",
  "soldi": "money", "prezzo": "price", "costo": "cost",
  "borsa": "bag/purse", "vestito": "dress/suit",
  "scarpe": "shoes", "cappello": "hat",
  "cane": "dog", "gatto": "cat", "animale": "animal",
  "musica": "music", "canzone": "song", "film": "movie",
  "foto": "photo", "telefono": "phone", "computer": "computer",
  "internet": "internet", "email": "email",
  "colore": "color", "rosso": "red", "blu": "blue",
  "verde": "green", "giallo": "yellow", "bianco": "white",
  "nero": "black", "grigio": "gray",

  // Common adjectives
  "grande": "big", "piccolo": "small", "piccola": "small",
  "buono": "good", "buona": "good", "cattivo": "bad", "cattiva": "bad",
  "bello": "beautiful", "bella": "beautiful", "brutto": "ugly",
  "nuovo": "new", "nuova": "new", "vecchio": "old", "vecchia": "old",
  "giovane": "young", "alto": "tall", "alta": "tall",
  "basso": "short", "bassa": "short",
  "lungo": "long", "lunga": "long", "corto": "short", "corta": "short",
  "caldo": "hot", "calda": "hot", "freddo": "cold", "fredda": "cold",
  "facile": "easy", "difficile": "difficult",
  "importante": "important", "possibile": "possible",
  "necessario": "necessary", "necessaria": "necessary",
  "diverso": "different", "diversa": "different",
  "uguale": "equal/same", "simile": "similar",
  "vero": "true", "vera": "true", "falso": "false",
  "giusto": "right/correct", "sbagliato": "wrong",
  "primo": "first", "ultima": "last", "ultimo": "last",
  "migliore": "better/best", "peggiore": "worse/worst",
  "forte": "strong", "debole": "weak",
  "felice": "happy", "triste": "sad",
  "stanco": "tired", "stanca": "tired",
  "contento": "happy", "contenta": "happy",
  "pronto": "ready", "pronta": "ready",
  "libero": "free", "libera": "free",
  "pieno": "full", "piena": "full", "vuoto": "empty", "vuota": "empty",
  "aperto": "open", "aperta": "open", "chiuso": "closed", "chiusa": "closed",
  "solo": "alone/only", "sola": "alone",
  "sicuro": "sure/safe", "sicura": "sure/safe",
  "certo": "certain", "certa": "certain",
  "dolce": "sweet", "amaro": "bitter",
  "fresco": "fresh/cool", "fresca": "fresh/cool",
  "ricco": "rich", "ricca": "rich", "povero": "poor", "povera": "poor",
  "tranquillo": "calm", "tranquilla": "calm",
  "particolare": "particular", "speciale": "special",
  "italiano": "Italian", "italiana": "Italian",

  // Adverbs
  "non": "not", "molto": "very/much", "molta": "much",
  "molti": "many", "molte": "many",
  "poco": "little/few", "poca": "little", "pochi": "few", "poche": "few",
  "più": "more/most", "meno": "less/least",
  "troppo": "too much", "troppa": "too much",
  "sempre": "always", "mai": "never", "spesso": "often",
  "ancora": "still/again", "già": "already", "appena": "just/barely",
  "subito": "immediately", "presto": "soon/early", "tardi": "late",
  "qui": "here", "qua": "here", "lì": "there", "là": "there",
  "bene": "well", "male": "badly",
  "così": "so/like this", "proprio": "really/own",
  "forse": "maybe", "davvero": "really", "veramente": "truly",
  "abbastanza": "enough", "quasi": "almost", "solo": "only",
  "almeno": "at least", "soprattutto": "especially",
  "insieme": "together", "soltanto": "only",

  // Misc high-frequency
  "sì": "yes", "no": "no", "grazie": "thank you",
  "prego": "you're welcome", "scusa": "excuse me", "scusi": "excuse me (formal)",
  "per favore": "please", "buongiorno": "good morning",
  "buonasera": "good evening", "arrivederci": "goodbye",
  "ciao": "hello/bye", "salve": "hello",
  "c'è": "there is", "ci sono": "there are",
  "ecco": "here is/are",
};

// ─── Portuguese word meanings ───────────────────────────────────────────────

const PT_MEANINGS = {
  // Pronouns
  "eu": "I", "tu": "you", "ele": "he", "ela": "she",
  "você": "you", "vocês": "you (pl)",
  "nós": "we", "eles": "they (m)", "elas": "they (f)",
  "me": "me", "te": "you", "se": "oneself",
  "nos": "us", "lhe": "him/her", "lhes": "them",
  "meu": "my", "minha": "my", "meus": "my", "minhas": "my",
  "teu": "your", "tua": "your", "teus": "your", "tuas": "your",
  "seu": "his/her/your", "sua": "his/her/your", "seus": "his/her/your", "suas": "his/her/your",
  "nosso": "our", "nossa": "our", "nossos": "our", "nossas": "our",
  "dele": "his", "dela": "her", "deles": "their (m)", "delas": "their (f)",
  "este": "this", "esta": "this", "estes": "these", "estas": "these",
  "esse": "that", "essa": "that", "esses": "those", "essas": "those",
  "aquele": "that (far)", "aquela": "that (far)", "aqueles": "those (far)", "aquelas": "those (far)",
  "isto": "this", "isso": "that", "aquilo": "that (far)",
  "quem": "who", "que": "that/what/which", "qual": "which",
  "quais": "which (pl)", "quanto": "how much", "quanta": "how much",
  "quantos": "how many", "quantas": "how many",
  "onde": "where", "quando": "when", "como": "how/like",
  "por que": "why", "porque": "because",
  "tudo": "everything", "todo": "all/every", "toda": "all/every",
  "todos": "all/everyone", "todas": "all",
  "nada": "nothing", "ninguém": "nobody",
  "algo": "something", "alguém": "someone",
  "algum": "some", "alguma": "some", "alguns": "some", "algumas": "some",
  "nenhum": "none", "nenhuma": "none",
  "cada": "each", "mesmo": "same/self", "mesma": "same/self",
  "outro": "other", "outra": "other", "outros": "others", "outras": "others",
  "próprio": "own", "própria": "own",

  // Articles
  "o": "the", "a": "the/to", "os": "the", "as": "the",
  "um": "a/one", "uma": "a/one", "uns": "some", "umas": "some",

  // Prepositions
  "de": "of/from", "em": "in", "para": "for/to", "por": "for/by",
  "com": "with", "sem": "without", "sobre": "about/on",
  "entre": "between", "até": "until/even", "desde": "since",
  "após": "after", "durante": "during", "contra": "against",
  "sob": "under", "perante": "before/facing",

  // Conjunctions
  "e": "and", "ou": "or", "mas": "but", "porém": "however",
  "nem": "neither/nor", "se": "if", "enquanto": "while",
  "embora": "although", "portanto": "therefore",
  "então": "then/so", "pois": "because/then",
  "ainda": "still/yet", "já": "already",

  // Common verbs - ser/estar
  "é": "to be (is)", "sou": "to be (am)", "somos": "to be (are)",
  "são": "to be (are)", "era": "to be (was)", "foi": "to be (was)",
  "será": "will be", "seria": "would be", "seja": "be (subj)",
  "fosse": "were (subj)",
  "está": "to be (is)", "estou": "to be (am)", "estamos": "to be (are)",
  "estão": "to be (are)", "estava": "to be (was)", "esteve": "to be (was)",
  "estará": "will be", "estaria": "would be", "esteja": "be (subj)",
  "sido": "been", "estado": "been",

  // ter/haver
  "tem": "to have (has)", "tenho": "to have (have)", "temos": "to have (have)",
  "têm": "to have (have)", "tinha": "to have (had)", "teve": "to have (had)",
  "terá": "will have", "teria": "would have", "tenha": "have (subj)",
  "tido": "had",
  "há": "there is/ago", "havia": "there was",

  // fazer
  "faz": "to do/make (does)", "faço": "to do/make (do)", "fazemos": "to do/make (do)",
  "fazem": "to do/make (do)", "fazia": "to do/make (did)", "fez": "to do/make (did)",
  "fará": "will do", "faria": "would do", "faça": "do (subj)",
  "feito": "done/made", "feita": "done/made",

  // ir
  "vai": "to go (goes)", "vou": "to go (go)", "vamos": "to go (go)",
  "vão": "to go (go)", "ia": "to go (was going)", "foi": "to go (went)",
  "irá": "will go", "iria": "would go", "vá": "go (subj)",
  "ido": "gone",

  // vir
  "vem": "to come (comes)", "venho": "to come (come)", "vimos": "to come (come)",
  "vêm": "to come (come)", "vinha": "to come (came)", "veio": "to come (came)",
  "virá": "will come", "viria": "would come", "venha": "come (subj)",
  "vindo": "come/coming",

  // poder
  "pode": "can", "posso": "can", "podemos": "can",
  "podem": "can", "podia": "could", "pôde": "could",
  "poderá": "will be able", "poderia": "could", "possa": "can (subj)",
  "podido": "been able",

  // dever
  "deve": "must/should", "devo": "must", "devemos": "must",
  "devem": "must", "devia": "should", "deveu": "owed",
  "deverá": "will have to", "deveria": "should", "deva": "must (subj)",

  // querer
  "quer": "to want (wants)", "quero": "to want (want)", "queremos": "to want (want)",
  "querem": "to want (want)", "queria": "to want (wanted)", "quis": "to want (wanted)",
  "quiser": "want (future subj)",

  // saber/conhecer
  "sabe": "to know (knows)", "sei": "to know (know)", "sabemos": "to know (know)",
  "sabem": "to know (know)", "sabia": "to know (knew)", "soube": "to know (knew)",
  "saiba": "know (subj)",
  "conhece": "to know (knows)", "conheço": "to know (know)", "conhecemos": "to know (know)",
  "conhecem": "to know (know)", "conhecia": "to know (knew)", "conheceu": "to know (knew)",

  // dar
  "dá": "to give (gives)", "dou": "to give (give)", "damos": "to give (give)",
  "dão": "to give (give)", "dava": "to give (gave)", "deu": "to give (gave)",
  "dado": "given",

  // dizer
  "diz": "to say (says)", "digo": "to say (say)", "dizemos": "to say (say)",
  "dizem": "to say (say)", "dizia": "to say (said)", "disse": "to say (said)",
  "dito": "said",

  // ver
  "vê": "to see (sees)", "vejo": "to see (see)", "vemos": "to see (see)",
  "veem": "to see (see)", "via": "to see (saw)", "viu": "to see (saw)",
  "visto": "seen",

  // pôr
  "põe": "to put (puts)", "ponho": "to put (put)", "pomos": "to put (put)",
  "põem": "to put (put)", "punha": "to put (put)", "pôs": "to put (put)",
  "posto": "put/placed",

  // Common -ar verbs
  "fala": "to speak (speaks)", "falo": "to speak (speak)", "falamos": "to speak (speak)",
  "falam": "to speak (speak)", "falava": "to speak (spoke)", "falou": "to speak (spoke)",
  "falado": "spoken",
  "mora": "to live (lives)", "moro": "to live (live)", "moramos": "to live (live)",
  "moram": "to live (live)", "morava": "to live (lived)", "morou": "to live (lived)",
  "trabalha": "to work (works)", "trabalho": "to work (work)", "trabalhamos": "to work (work)",
  "trabalham": "to work (work)", "trabalhava": "to work (worked)", "trabalhou": "to work (worked)",
  "trabalhado": "worked",
  "estuda": "to study (studies)", "estudo": "to study (study)", "estudamos": "to study (study)",
  "estudam": "to study (study)", "estudava": "to study (studied)", "estudou": "to study (studied)",
  "compra": "to buy (buys)", "compro": "to buy (buy)", "compramos": "to buy (buy)",
  "compram": "to buy (buy)", "comprava": "to buy (bought)", "comprou": "to buy (bought)",
  "comprado": "bought",
  "paga": "to pay (pays)", "pago": "to pay (pay)", "pagamos": "to pay (pay)",
  "pagam": "to pay (pay)", "pagava": "to pay (paid)", "pagou": "to pay (paid)",
  "pago": "paid",
  "chama": "to call (calls)", "chamo": "to call (call)", "chamamos": "to call (call)",
  "chamam": "to call (call)",
  "gosta": "to like (likes)", "gosto": "to like (like)", "gostamos": "to like (like)",
  "gostam": "to like (like)", "gostava": "to like (liked)", "gostou": "to like (liked)",
  "precisa": "to need (needs)", "preciso": "to need (need)", "precisamos": "to need (need)",
  "precisam": "to need (need)",
  "pensa": "to think (thinks)", "penso": "to think (think)", "pensamos": "to think (think)",
  "pensam": "to think (think)",
  "fica": "to stay/be (stays)", "fico": "to stay/be (stay)", "ficamos": "to stay/be (stay)",
  "ficam": "to stay/be (stay)", "ficava": "to stay/be (stayed)", "ficou": "to stay/be (stayed)",
  "chega": "to arrive (arrives)", "chego": "to arrive (arrive)", "chegamos": "to arrive (arrive)",
  "chegam": "to arrive (arrive)",
  "come": "to eat (eats)", "como": "to eat (eat)", "comemos": "to eat (eat)",
  "comem": "to eat (eat)", "comia": "to eat (ate)", "comeu": "to eat (ate)",
  "comido": "eaten",
  "toma": "to take (takes)", "tomo": "to take (take)", "tomamos": "to take (take)",
  "tomam": "to take (take)",
  "passa": "to pass (passes)", "passo": "to pass (pass)", "passamos": "to pass (pass)",
  "passam": "to pass (pass)",
  "leva": "to take/carry", "levo": "to take/carry", "levamos": "to take/carry",
  "levam": "to take/carry",
  "deixa": "to leave/let", "deixo": "to leave/let", "deixamos": "to leave/let",
  "deixam": "to leave/let",
  "ajuda": "to help (helps)", "ajudo": "to help (help)", "ajudamos": "to help (help)",
  "ajudam": "to help (help)",
  "olha": "to look (looks)", "olho": "to look (look)", "olhamos": "to look (look)",
  "olham": "to look (look)",
  "conversa": "to chat (chats)", "converso": "to chat (chat)",
  "cozinha": "to cook (cooks)", "cozinho": "to cook (cook)",
  "viaja": "to travel (travels)", "viajo": "to travel (travel)",
  "anda": "to walk (walks)", "ando": "to walk (walk)",
  "joga": "to play (plays)", "jogo": "to play (play)",
  "canta": "to sing (sings)", "canto": "to sing (sing)",
  "dança": "to dance (dances)", "danço": "to dance (dance)",
  "nada": "to swim (swims)", "nadamos": "to swim (swim)",
  "ensina": "to teach (teaches)", "ensino": "to teach (teach)",
  "aprende": "to learn (learns)", "aprendo": "to learn (learn)",
  "espera": "to wait (waits)", "espero": "to wait/hope",
  "volta": "to return (returns)", "volto": "to return (return)",
  "entra": "to enter (enters)", "entro": "to enter (enter)",
  "lembra": "to remember", "lembro": "to remember",
  "acha": "to think/find", "acho": "to think/find",
  "usa": "to use (uses)", "uso": "to use (use)",
  "tenta": "to try (tries)", "tento": "to try (try)",
  "começa": "to start (starts)", "começo": "to start (start)",
  "termina": "to finish (finishes)", "termino": "to finish (finish)",
  "acorda": "to wake up", "acordo": "to wake up",

  // Common -er verbs
  "escreve": "to write (writes)", "escrevo": "to write (write)",
  "escrevemos": "to write (write)", "escrevem": "to write (write)",
  "escrito": "written",
  "lê": "to read (reads)", "leio": "to read (read)",
  "lemos": "to read (read)", "leem": "to read (read)",
  "bebe": "to drink (drinks)", "bebo": "to drink (drink)",
  "bebemos": "to drink (drink)", "bebem": "to drink (drink)",
  "corre": "to run (runs)", "corro": "to run (run)",
  "corremos": "to run (run)", "correm": "to run (run)",
  "vive": "to live (lives)", "vivo": "to live (live)",
  "vivemos": "to live (live)", "vivem": "to live (live)",
  "morre": "to die (dies)", "morreu": "to die (died)",
  "cresce": "to grow (grows)", "cresceu": "to grow (grew)",
  "recebe": "to receive (receives)", "recebo": "to receive (receive)",
  "entende": "to understand", "entendo": "to understand",
  "responde": "to answer", "respondo": "to answer",
  "acontece": "to happen (happens)", "aconteceu": "to happen (happened)",
  "parece": "to seem (seems)", "parecer": "to seem",
  "pertence": "to belong", "pertenço": "to belong",
  "reconhece": "to recognize", "reconheço": "to recognize",
  "nasce": "to be born", "nasceu": "to be born (was born)",

  // Common -ir verbs
  "abre": "to open (opens)", "abro": "to open (open)",
  "abrimos": "to open (open)", "abrem": "to open (open)",
  "aberto": "open/opened",
  "parte": "to leave (leaves)", "parto": "to leave (leave)",
  "sai": "to go out (goes out)", "saio": "to go out (go out)",
  "saímos": "to go out (go out)", "saem": "to go out (go out)",
  "saiu": "to go out (went out)",
  "dorme": "to sleep (sleeps)", "durmo": "to sleep (sleep)",
  "dormimos": "to sleep (sleep)", "dormem": "to sleep (sleep)",
  "sente": "to feel (feels)", "sinto": "to feel (feel)",
  "sentimos": "to feel (feel)", "sentem": "to feel (feel)",
  "ouve": "to hear (hears)", "ouço": "to hear (hear)",
  "ouvimos": "to hear (hear)", "ouvem": "to hear (hear)",
  "serve": "to serve (serves)", "sirvo": "to serve (serve)",
  "segue": "to follow (follows)", "sigo": "to follow (follow)",
  "pede": "to ask for", "peço": "to ask for",
  "decide": "to decide", "decido": "to decide",
  "consegue": "to manage/get", "consigo": "to manage/get",
  "descobre": "to discover", "descubro": "to discover",
  "permite": "to allow", "permito": "to allow",
  "prefere": "to prefer", "prefiro": "to prefer",
  "sobe": "to go up", "subo": "to go up",
  "desce": "to go down", "desço": "to go down",

  // Gerunds
  "fazendo": "doing/making", "indo": "going", "vindo": "coming",
  "sendo": "being", "tendo": "having", "dando": "giving",
  "dizendo": "saying", "vendo": "seeing", "pondo": "putting",
  "falando": "speaking", "trabalhando": "working", "estudando": "studying",
  "comendo": "eating", "bebendo": "drinking", "dormindo": "sleeping",
  "correndo": "running", "lendo": "reading", "escrevendo": "writing",
  "cozinhando": "cooking", "viajando": "traveling", "cantando": "singing",
  "dançando": "dancing", "jogando": "playing", "nadando": "swimming",
  "andando": "walking", "esperando": "waiting", "pensando": "thinking",
  "olhando": "looking", "comprando": "buying",

  // Common nouns
  "casa": "house", "homem": "man", "mulher": "woman",
  "menino": "boy", "menina": "girl", "criança": "child",
  "pai": "father", "mãe": "mother", "irmão": "brother", "irmã": "sister",
  "filho": "son", "filha": "daughter", "família": "family",
  "amigo": "friend", "amiga": "friend (f)",
  "tempo": "time/weather", "ano": "year", "mês": "month",
  "semana": "week", "dia": "day", "hora": "hour",
  "manhã": "morning", "tarde": "afternoon", "noite": "night",
  "hoje": "today", "amanhã": "tomorrow", "ontem": "yesterday",
  "vida": "life", "mundo": "world", "país": "country",
  "cidade": "city", "rua": "street",
  "água": "water", "comida": "food", "pão": "bread",
  "café": "coffee", "leite": "milk", "cerveja": "beer",
  "carne": "meat", "peixe": "fish", "fruta": "fruit",
  "arroz": "rice", "feijão": "beans",
  "livro": "book", "escola": "school", "trabalho": "work/job",
  "escritório": "office", "loja": "shop", "restaurante": "restaurant",
  "hospital": "hospital", "igreja": "church",
  "praia": "beach", "rio": "river", "mar": "sea",
  "montanha": "mountain", "sol": "sun", "chuva": "rain",
  "céu": "sky", "terra": "earth", "árvore": "tree",
  "flor": "flower", "jardim": "garden",
  "porta": "door", "janela": "window", "mesa": "table",
  "cadeira": "chair", "cama": "bed", "cozinha": "kitchen",
  "banheiro": "bathroom", "quarto": "room/bedroom",
  "carro": "car", "ônibus": "bus", "trem": "train",
  "avião": "airplane",
  "mão": "hand", "cabeça": "head", "olho": "eye",
  "olhos": "eyes", "boca": "mouth", "coração": "heart",
  "corpo": "body", "braço": "arm", "perna": "leg", "pé": "foot",
  "nome": "name", "número": "number", "problema": "problem",
  "parte": "part", "modo": "way", "tipo": "type",
  "ideia": "idea", "coisa": "thing", "lugar": "place",
  "exemplo": "example", "momento": "moment", "vez": "time (occasion)",
  "história": "story/history", "pessoa": "person", "gente": "people",
  "pergunta": "question", "resposta": "answer",
  "dinheiro": "money", "preço": "price",
  "roupa": "clothing", "sapato": "shoe", "sapatos": "shoes",
  "cão": "dog", "gato": "cat", "cachorro": "dog",
  "música": "music", "filme": "movie",
  "foto": "photo", "telefone": "phone",
  "cor": "color", "vermelho": "red", "azul": "blue",
  "verde": "green", "amarelo": "yellow", "branco": "white",
  "preto": "black",
  "centro": "center/downtown", "apartamento": "apartment",
  "empresa": "company", "projeto": "project",
  "curso": "course", "aula": "class/lesson",
  "jogo": "game", "festa": "party",
  "viagem": "trip", "caminho": "path/way",
  "lado": "side", "fim": "end", "início": "beginning",
  "razão": "reason", "forma": "form/way",
  "grupo": "group", "equipe": "team",
  "língua": "language", "palavra": "word",
  "conta": "account/bill", "carta": "letter",

  // Common adjectives
  "grande": "big", "pequeno": "small", "pequena": "small",
  "bom": "good", "boa": "good", "mau": "bad", "má": "bad",
  "bonito": "beautiful", "bonita": "beautiful",
  "novo": "new", "nova": "new", "velho": "old", "velha": "old",
  "jovem": "young", "alto": "tall", "alta": "tall",
  "baixo": "short/low", "baixa": "short/low",
  "longo": "long", "longa": "long", "curto": "short", "curta": "short",
  "quente": "hot", "frio": "cold", "fria": "cold",
  "fácil": "easy", "difícil": "difficult",
  "importante": "important", "possível": "possible",
  "necessário": "necessary", "necessária": "necessary",
  "diferente": "different", "igual": "equal",
  "verdadeiro": "true", "falso": "false",
  "certo": "right/certain", "certa": "right/certain",
  "errado": "wrong", "errada": "wrong",
  "primeiro": "first", "primeira": "first",
  "último": "last", "última": "last",
  "melhor": "better/best", "pior": "worse/worst",
  "forte": "strong", "fraco": "weak",
  "feliz": "happy", "triste": "sad",
  "cansado": "tired", "cansada": "tired",
  "pronto": "ready", "pronta": "ready",
  "livre": "free", "cheio": "full", "cheia": "full",
  "vazio": "empty", "vazia": "empty",
  "aberto": "open", "aberta": "open", "fechado": "closed", "fechada": "closed",
  "só": "alone/only", "sozinho": "alone", "sozinha": "alone",
  "rico": "rich", "rica": "rich", "pobre": "poor",
  "tranquilo": "calm", "tranquila": "calm",
  "lindo": "beautiful", "linda": "beautiful",
  "favorito": "favorite", "favorita": "favorite",
  "brasileiro": "Brazilian", "brasileira": "Brazilian",
  "português": "Portuguese", "portuguesa": "Portuguese",
  "perto": "near", "longe": "far",
  "junto": "together", "juntos": "together", "juntas": "together",

  // Adverbs
  "não": "not", "muito": "very/much", "muita": "much",
  "muitos": "many", "muitas": "many",
  "pouco": "little/few", "poucos": "few", "poucas": "few",
  "mais": "more/most", "menos": "less/least",
  "demais": "too much",
  "sempre": "always", "nunca": "never", "jamais": "never",
  "às vezes": "sometimes",
  "ainda": "still/yet", "já": "already",
  "agora": "now", "logo": "soon", "depois": "after/later",
  "antes": "before", "cedo": "early", "tarde": "late",
  "aqui": "here", "ali": "there", "lá": "there",
  "bem": "well", "mal": "badly",
  "assim": "like this/so", "talvez": "maybe",
  "realmente": "really", "bastante": "enough/quite",
  "quase": "almost", "apenas": "only/just",
  "também": "also", "tão": "so", "então": "then/so",

  // Misc
  "sim": "yes", "não": "no", "obrigado": "thank you (m)",
  "obrigada": "thank you (f)", "por favor": "please",
  "desculpa": "excuse me", "desculpe": "excuse me",
  "bom dia": "good morning", "boa tarde": "good afternoon",
  "boa noite": "good night", "tchau": "bye", "olá": "hello",
};

// ─── Alignment engine ───────────────────────────────────────────────────────

function buildAlignments(deckPath, meanings, expandFn, langPrefix) {
  const raw = fs.readFileSync(deckPath, 'utf8');
  const deck = JSON.parse(raw);
  const alignments = {};

  let processed = 0;
  for (const card of deck) {
    const cardId = typeof card.id === 'number' ? `${langPrefix}-${card.id}` : String(card.id);
    const sentence = card.target || '';
    if (!sentence) continue;

    // Tokenize and expand contractions
    const rawTokens = sentence.split(/\s+/).map(w => stripPunct(w).toLowerCase()).filter(Boolean);
    const tokens = [];
    for (const tok of rawTokens) {
      const expanded = expandFn(tok);
      tokens.push(...expanded);
    }

    // Also keep original tokens for lookup (some contracted forms have meanings)
    const allTokens = [...new Set([...rawTokens.map(w => stripPunct(w).toLowerCase()), ...tokens])].filter(Boolean);

    for (const word of allTokens) {
      if (!word || word.length === 0) continue;

      let meaning = meanings[word];
      if (!meaning) {
        // Try to infer meaning for common patterns
        // Italian -mente adverbs
        if (word.endsWith('mente') && word.length > 6) {
          meaning = word.slice(0, -5) + '... (-ly)';
        }
        // Italian -zione nouns
        else if (word.endsWith('zione') && word.length > 6) {
          meaning = word; // keep as-is if unknown
        }
        // Portuguese -mente adverbs
        else if (word.endsWith('mente') && word.length > 6) {
          meaning = word.slice(0, -5) + '... (-ly)';
        }
      }

      if (!meaning) {
        meaning = word; // fallback: use the word itself
      }

      if (!alignments[word]) {
        alignments[word] = [];
      }
      alignments[word].push({ en: meaning, card: cardId });
    }

    processed++;
    if (processed % 500 === 0) {
      process.stderr.write(`  ${langPrefix}: ${processed}/${deck.length} cards processed\n`);
    }
  }

  process.stderr.write(`  ${langPrefix}: ${processed}/${deck.length} cards processed (done)\n`);
  return { alignments };
}

// ─── Main ───────────────────────────────────────────────────────────────────

console.log('Processing Italian...');
const itResult = buildAlignments(
  path.join(BASE, 'src/data/italian/deck.json'),
  IT_MEANINGS,
  expandItalian,
  'it'
);
const itWords = Object.keys(itResult.alignments).length;
const itEntries = Object.values(itResult.alignments).reduce((s, a) => s + a.length, 0);
console.log(`Italian: ${itWords} unique words, ${itEntries} total occurrences`);
fs.writeFileSync(path.join(OUT, 'it-alignments.json'), JSON.stringify(itResult, null, 2));

console.log('\nProcessing Portuguese...');
const ptResult = buildAlignments(
  path.join(BASE, 'src/data/portuguese/deck.json'),
  PT_MEANINGS,
  expandPortuguese,
  'pt'
);
const ptWords = Object.keys(ptResult.alignments).length;
const ptEntries = Object.values(ptResult.alignments).reduce((s, a) => s + a.length, 0);
console.log(`Portuguese: ${ptWords} unique words, ${ptEntries} total occurrences`);
fs.writeFileSync(path.join(OUT, 'pt-alignments.json'), JSON.stringify(ptResult, null, 2));

console.log('\nDone! Files written to:');
console.log(`  ${path.join(OUT, 'it-alignments.json')}`);
console.log(`  ${path.join(OUT, 'pt-alignments.json')}`);
