#!/usr/bin/env node
/**
 * Add essential survival/beginner phrases to node-01 of every language.
 * These are the ~20 phrases every absolute beginner needs first.
 *
 * - Checks if a similar card already exists (fuzzy match on English)
 * - If missing, creates a new card at priority 1
 * - If exists but wrong priority, boosts to priority 1
 */

const fs = require('fs');

// ── Survival phrases per language ────────────────────────────
// Format: [target, english, grammarTip?]
const PHRASES = {
  es: [
    ['Hola.', 'Hello.'],
    ['Buenos días.', 'Good morning.'],
    ['Buenas tardes.', 'Good afternoon.'],
    ['Buenas noches.', 'Good evening / Good night.'],
    ['Adiós.', 'Goodbye.'],
    ['Hasta luego.', 'See you later.'],
    ['Sí.', 'Yes.'],
    ['No.', 'No.'],
    ['Por favor.', 'Please.'],
    ['Gracias.', 'Thank you.'],
    ['De nada.', "You're welcome."],
    ['Lo siento.', "I'm sorry."],
    ['Perdón.', 'Excuse me.'],
    ['Me llamo...', 'My name is...', '"Me llamo" literally means "I call myself".'],
    ['No entiendo.', "I don't understand."],
    ['¿Habla inglés?', 'Do you speak English?'],
    ['¿Dónde está el baño?', 'Where is the toilet?'],
    ['¿Cuánto cuesta?', 'How much does it cost?'],
    ['¡Ayuda!', 'Help!'],
    ['Agua, por favor.', 'Water, please.'],
    ['La cuenta, por favor.', 'The bill, please.'],
  ],
  fr: [
    ['Bonjour.', 'Hello / Good morning.'],
    ['Bonsoir.', 'Good evening.'],
    ['Bonne nuit.', 'Good night.'],
    ['Au revoir.', 'Goodbye.'],
    ['À bientôt.', 'See you soon.'],
    ['Oui.', 'Yes.'],
    ['Non.', 'No.'],
    ["S'il vous plaît.", 'Please.', '"S\'il vous plaît" = "if it pleases you" – formal.'],
    ['Merci.', 'Thank you.'],
    ['De rien.', "You're welcome.", '"De rien" literally means "of nothing".'],
    ['Pardon.', "I'm sorry / Excuse me."],
    ['Excusez-moi.', 'Excuse me.'],
    ['Je m\'appelle...', 'My name is...'],
    ['Je ne comprends pas.', "I don't understand."],
    ['Parlez-vous anglais ?', 'Do you speak English?'],
    ['Où sont les toilettes ?', 'Where is the toilet?'],
    ['Combien ça coûte ?', 'How much does it cost?'],
    ['Au secours !', 'Help!'],
    ["De l'eau, s'il vous plaît.", 'Water, please.'],
    ["L'addition, s'il vous plaît.", 'The bill, please.'],
  ],
  it: [
    ['Ciao.', 'Hello / Goodbye (informal).', '"Ciao" works for both hello and goodbye.'],
    ['Buongiorno.', 'Good morning / Good day.'],
    ['Buonasera.', 'Good evening.'],
    ['Buonanotte.', 'Good night.'],
    ['Arrivederci.', 'Goodbye (formal).'],
    ['Sì.', 'Yes.'],
    ['No.', 'No.'],
    ['Per favore.', 'Please.'],
    ['Grazie.', 'Thank you.'],
    ['Prego.', "You're welcome."],
    ['Mi scusi.', "I'm sorry / Excuse me."],
    ['Mi chiamo...', 'My name is...'],
    ['Non capisco.', "I don't understand."],
    ['Parla inglese?', 'Do you speak English?'],
    ["Dov'è il bagno?", 'Where is the toilet?'],
    ['Quanto costa?', 'How much does it cost?'],
    ['Aiuto!', 'Help!'],
    ['Acqua, per favore.', 'Water, please.'],
    ['Il conto, per favore.', 'The bill, please.'],
  ],
  pt: [
    ['Olá.', 'Hello.'],
    ['Bom dia.', 'Good morning.'],
    ['Boa tarde.', 'Good afternoon.'],
    ['Boa noite.', 'Good evening / Good night.'],
    ['Tchau.', 'Goodbye (informal).'],
    ['Até logo.', 'See you later.'],
    ['Sim.', 'Yes.'],
    ['Não.', 'No.'],
    ['Por favor.', 'Please.'],
    ['Obrigado.', 'Thank you (male speaker).', 'Males say "obrigado", females say "obrigada".'],
    ['De nada.', "You're welcome."],
    ['Desculpe.', "I'm sorry / Excuse me."],
    ['Meu nome é...', 'My name is...'],
    ['Não entendo.', "I don't understand."],
    ['Você fala inglês?', 'Do you speak English?'],
    ['Onde fica o banheiro?', 'Where is the toilet?'],
    ['Quanto custa?', 'How much does it cost?'],
    ['Socorro!', 'Help!'],
    ['Água, por favor.', 'Water, please.'],
    ['A conta, por favor.', 'The bill, please.'],
  ],
  de: [
    ['Hallo.', 'Hello.'],
    ['Guten Morgen.', 'Good morning.'],
    ['Guten Abend.', 'Good evening.'],
    ['Gute Nacht.', 'Good night.'],
    ['Auf Wiedersehen.', 'Goodbye.'],
    ['Tschüss.', 'Bye (informal).'],
    ['Ja.', 'Yes.'],
    ['Nein.', 'No.'],
    ['Bitte.', 'Please / You\'re welcome.', '"Bitte" means both "please" and "you\'re welcome".'],
    ['Danke.', 'Thank you.'],
    ['Entschuldigung.', "Excuse me / I'm sorry."],
    ['Ich heiße...', 'My name is...', '"Ich heiße" literally means "I am called".'],
    ['Ich verstehe nicht.', "I don't understand."],
    ['Sprechen Sie Englisch?', 'Do you speak English?'],
    ['Wo ist die Toilette?', 'Where is the toilet?'],
    ['Was kostet das?', 'How much does this cost?'],
    ['Hilfe!', 'Help!'],
    ['Wasser, bitte.', 'Water, please.'],
    ['Die Rechnung, bitte.', 'The bill, please.'],
  ],
  nl: [
    ['Hallo.', 'Hello.'],
    ['Goedemorgen.', 'Good morning.'],
    ['Goedenavond.', 'Good evening.'],
    ['Goedenacht.', 'Good night.'],
    ['Tot ziens.', 'Goodbye.'],
    ['Doei.', 'Bye (informal).'],
    ['Ja.', 'Yes.'],
    ['Nee.', 'No.'],
    ['Alstublieft.', 'Please (formal).'],
    ['Dank u wel.', 'Thank you.'],
    ['Sorry.', 'Sorry.'],
    ['Pardon.', 'Excuse me.'],
    ['Ik heet...', 'My name is...'],
    ['Ik begrijp het niet.', "I don't understand."],
    ['Spreekt u Engels?', 'Do you speak English?'],
    ['Waar is het toilet?', 'Where is the toilet?'],
    ['Hoeveel kost dit?', 'How much does this cost?'],
    ['Help!', 'Help!'],
    ['Water, alstublieft.', 'Water, please.'],
    ['De rekening, alstublieft.', 'The bill, please.'],
  ],
  sv: [
    ['Hej.', 'Hello.'],
    ['God morgon.', 'Good morning.'],
    ['God kväll.', 'Good evening.'],
    ['God natt.', 'Good night.'],
    ['Hej då.', 'Goodbye.'],
    ['Vi ses.', 'See you.'],
    ['Ja.', 'Yes.'],
    ['Nej.', 'No.'],
    ['Tack.', 'Thank you / Please.', '"Tack" means both "thank you" and "please".'],
    ['Varsågod.', "You're welcome / Here you go."],
    ['Förlåt.', "I'm sorry."],
    ['Ursäkta.', 'Excuse me.'],
    ['Jag heter...', 'My name is...'],
    ['Jag förstår inte.', "I don't understand."],
    ['Talar du engelska?', 'Do you speak English?'],
    ['Var är toaletten?', 'Where is the toilet?'],
    ['Vad kostar det?', 'How much does it cost?'],
    ['Hjälp!', 'Help!'],
    ['Vatten, tack.', 'Water, please.'],
    ['Notan, tack.', 'The bill, please.'],
  ],
  cy: [
    ['Helo.', 'Hello.'],
    ['Bore da.', 'Good morning.', '"Bore" = morning, "da" = good. Adjectives come after nouns in Welsh.'],
    ['Prynhawn da.', 'Good afternoon.'],
    ['Noswaith dda.', 'Good evening.', '"Dda" is the soft mutation of "da" after feminine nouns.'],
    ['Nos da.', 'Good night.'],
    ['Hwyl fawr.', 'Goodbye.'],
    ['Ie.', 'Yes.'],
    ['Na.', 'No.'],
    ['Os gwelwch yn dda.', 'Please.', 'Literally "if you see well" – the Welsh way to say please.'],
    ['Diolch.', 'Thank you.'],
    ['Mae\'n ddrwg gen i.', "I'm sorry.", '"Mae\'n ddrwg gen i" literally means "it is bad with me".'],
    ['Esgusodwch fi.', 'Excuse me.'],
    ['Fy enw i yw...', 'My name is...'],
    ['Dw i ddim yn deall.', "I don't understand."],
    ["Dych chi'n siarad Saesneg?", 'Do you speak English?'],
    ["Ble mae'r toiled?", 'Where is the toilet?'],
    ['Faint mae hyn yn gostio?', 'How much does this cost?'],
    ['Help!', 'Help!'],
    ['Dŵr, os gwelwch yn dda.', 'Water, please.'],
    ["Y bil, os gwelwch yn dda.", 'The bill, please.'],
  ],
  hi: [
    ['नमस्ते।', 'Hello / Namaste.', '"नमस्ते" is used for hello, goodbye, and as a respectful greeting.'],
    ['सुप्रभात।', 'Good morning.'],
    ['शुभ रात्रि।', 'Good night.'],
    ['अलविदा।', 'Goodbye.'],
    ['फिर मिलेंगे।', 'See you again.'],
    ['हाँ।', 'Yes.'],
    ['नहीं।', 'No.'],
    ['कृपया।', 'Please.'],
    ['धन्यवाद।', 'Thank you.'],
    ['माफ़ कीजिए।', "I'm sorry / Excuse me."],
    ['मेरा नाम... है।', 'My name is...'],
    ['मुझे समझ नहीं आया।', "I don't understand."],
    ['क्या आप अंग्रेज़ी बोलते हैं?', 'Do you speak English?'],
    ['शौचालय कहाँ है?', 'Where is the toilet?'],
    ['यह कितने का है?', 'How much does this cost?'],
    ['मदद!', 'Help!'],
    ['पानी दीजिए।', 'Water, please.'],
    ['बिल दीजिए।', 'The bill, please.'],
  ],
  tr: [
    ['Merhaba.', 'Hello.'],
    ['Günaydın.', 'Good morning.'],
    ['İyi akşamlar.', 'Good evening.'],
    ['İyi geceler.', 'Good night.'],
    ['Hoşça kal.', 'Goodbye.', '"Hoşça kal" is said by the person leaving.'],
    ['Görüşürüz.', 'See you.'],
    ['Evet.', 'Yes.'],
    ['Hayır.', 'No.'],
    ['Lütfen.', 'Please.'],
    ['Teşekkürler.', 'Thank you.'],
    ['Rica ederim.', "You're welcome."],
    ['Özür dilerim.', "I'm sorry."],
    ['Pardon.', 'Excuse me.'],
    ['Benim adım...', 'My name is...'],
    ['Anlamıyorum.', "I don't understand."],
    ['İngilizce biliyor musunuz?', 'Do you speak English?'],
    ['Tuvalet nerede?', 'Where is the toilet?'],
    ['Bu ne kadar?', 'How much is this?'],
    ['İmdat!', 'Help!'],
    ['Su, lütfen.', 'Water, please.'],
    ['Hesap, lütfen.', 'The bill, please.'],
  ],
  ru: [
    ['Привет.', 'Hello (informal).'],
    ['Здравствуйте.', 'Hello (formal).', '"Здравствуйте" literally means "be healthy".'],
    ['Доброе утро.', 'Good morning.'],
    ['Добрый вечер.', 'Good evening.'],
    ['Спокойной ночи.', 'Good night.'],
    ['До свидания.', 'Goodbye.'],
    ['Пока.', 'Bye (informal).'],
    ['Да.', 'Yes.'],
    ['Нет.', 'No.'],
    ['Пожалуйста.', 'Please / You\'re welcome.', '"Пожалуйста" means both "please" and "you\'re welcome".'],
    ['Спасибо.', 'Thank you.'],
    ['Извините.', "I'm sorry / Excuse me."],
    ['Меня зовут...', 'My name is...', '"Меня зовут" literally means "they call me".'],
    ['Я не понимаю.', "I don't understand."],
    ['Вы говорите по-английски?', 'Do you speak English?'],
    ['Где туалет?', 'Where is the toilet?'],
    ['Сколько это стоит?', 'How much does this cost?'],
    ['Помогите!', 'Help!'],
    ['Воду, пожалуйста.', 'Water, please.'],
    ['Счёт, пожалуйста.', 'The bill, please.'],
  ],
};

// ── Main ─────────────────────────────────────────────────────
const DECK_PATHS = {
  es: 'src/data/spanish/deck.json',
  fr: 'src/data/french/deck.json',
  it: 'src/data/italian/deck.json',
  pt: 'src/data/portuguese/deck.json',
  de: 'src/data/german/deck.json',
  nl: 'src/data/dutch/deck.json',
  sv: 'src/data/swedish/deck.json',
  cy: 'src/data/welsh/deck.json',
  hi: 'src/data/hindi/deck.json',
  tr: 'src/data/turkish/deck.json',
  ru: 'src/data/russian/deck.json',
};

const ID_PREFIXES = {
  es: 'es-', fr: 'fr-', it: 'it-', pt: 'pt-', de: 'de-',
  nl: 'nl-', sv: 'sv-', cy: 'cy-', hi: 'hi-', tr: 'tr-', ru: 'ru-',
};

let grandAdded = 0, grandBoosted = 0;

for (const [lang, phrases] of Object.entries(PHRASES)) {
  const deckPath = DECK_PATHS[lang];
  const deck = JSON.parse(fs.readFileSync(deckPath, 'utf8'));

  // Find max numeric ID
  let maxId = 0;
  deck.forEach(c => {
    const num = parseInt(String(c.id).replace(/\D/g, '')) || 0;
    if (num > maxId) maxId = num;
  });

  let added = 0, boosted = 0;

  // Get all node-01 English translations for fuzzy matching
  const node01English = new Set(
    deck.filter(c => c.grammarNode === 'node-01')
      .map(c => c.english.toLowerCase().replace(/[.,!?¿¡]/g, '').trim())
  );

  for (const phrase of phrases) {
    const [target, english, grammar] = phrase;
    const englishClean = english.toLowerCase().replace(/[.,!?¿¡]/g, '').trim();

    // Check if similar card exists
    const exists = deck.find(c => {
      const existingClean = c.english.toLowerCase().replace(/[.,!?¿¡]/g, '').trim();
      return existingClean === englishClean ||
             existingClean.includes(englishClean) ||
             englishClean.includes(existingClean);
    });

    if (exists) {
      // Boost priority if needed
      if (exists.priority !== 1) {
        exists.priority = 1;
        boosted++;
      }
    } else {
      // Add new card
      maxId++;
      const id = ID_PREFIXES[lang] + String(maxId).padStart(4, '0');
      const newCard = {
        id,
        target,
        english,
        audio: '',
        tags: ['general', 'travel'],
        grammarNode: 'node-01',
        priority: 1,
      };
      if (grammar) newCard.grammar = grammar;
      else newCard.grammar = '';

      deck.push(newCard);
      added++;
    }
  }

  fs.writeFileSync(deckPath, JSON.stringify(deck, null, 2) + '\n');
  console.log(`${lang.toUpperCase().padEnd(4)} added: ${added}, boosted: ${boosted}`);
  grandAdded += added;
  grandBoosted += boosted;
}

console.log(`\nTotal: ${grandAdded} new cards added, ${grandBoosted} existing cards boosted to priority 1`);
