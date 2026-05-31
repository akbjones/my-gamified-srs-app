#!/usr/bin/env node
/**
 * Detect near-duplicate clusters across all 11 languages.
 *
 * Strategy: skeletonize each card by replacing names, place names, and numbers
 * with placeholders. Cards with identical skeletons (and at least one placeholder)
 * are clustered.
 */
const fs = require('fs');

const DECKS = {
  spanish:    'src/data/spanish/deck.json',
  french:     'src/data/french/deck.json',
  italian:    'src/data/italian/deck.json',
  portuguese: 'src/data/portuguese/deck.json',
  german:     'src/data/german/deck.json',
  dutch:      'src/data/dutch/deck.json',
  swedish:    'src/data/swedish/deck.json',
  welsh:      'src/data/welsh/deck.json',
  hindi:      'src/data/hindi/deck.json',
  turkish:    'src/data/turkish/deck.json',
  russian:    'src/data/russian/deck.json',
};

// Per-language entity sets. For Latin-script we use heuristic + hand-list.
// For Cyrillic / Devanagari we rely on hand-lists.

const ES_NAMES = new Set('Juan Pedro Carlos María Ana Luis Ángel Sofía Pablo Lucía Diego Andrés Marta Elena Sara Manuel Antonio Miguel Jorge Laura Carmen Isabel Cristina Inés Daniel Mateo Hugo Leo Pilar Rosa Marina Valeria Camila Jaime Raúl Ricardo Eduardo Fernando Diana Beatriz Adrián Iván Adela Julián Tomás Patricia'.split(/\s+/));
const ES_PLACES = new Set('Madrid Barcelona Valencia Sevilla Bilbao Granada Zaragoza Málaga Toledo Salamanca España Argentina México Colombia Chile Perú Brasil Italia Francia Alemania Portugal Inglaterra Estados Unidos Cuba Japón China Rusia Europa América'.split(/\s+/));

const FR_NAMES = new Set('Pierre Paul Jacques Louis Marie Sophie Claire Anne Jean Henri Marc Luc Jules Émile Antoine Julie Camille Léa Manon Chloé Lucas Hugo Léo Théo Mathieu Nicolas Olivier François Christophe Patrick Catherine Isabelle Sandrine Valérie Sylvie Nathalie Hélène Cécile Charlotte Margot Élise Adèle Pauline Inès Sarah Léna'.split(/\s+/));
const FR_PLACES = new Set('Paris Lyon Marseille Toulouse Nice Bordeaux Lille Strasbourg Rennes Nantes Montpellier France Italie Espagne Allemagne Belgique Suisse Maroc Algérie Tunisie Sénégal Québec Canada Japon Chine Russie Europe Amérique'.split(/\s+/));

const IT_NAMES = new Set('Marco Luca Giovanni Giuseppe Antonio Francesco Andrea Stefano Roberto Paolo Maria Anna Giulia Sara Chiara Laura Elena Federica Silvia Valentina Sofia Alessia Aurora Beatrice Alessandro Davide Matteo Lorenzo Tommaso Riccardo Simone Fabio Gianni Gianluca Marta Carla Rita Pietro Salvatore Angela Cristina Stefania Camilla Sofia'.split(/\s+/));
const IT_PLACES = new Set('Roma Milano Napoli Torino Firenze Venezia Bologna Genova Palermo Catania Bari Verona Italia Francia Spagna Germania Inghilterra Portogallo Grecia Svizzera Russia Cina Giappone Stati Uniti Europa America'.split(/\s+/));

const PT_NAMES = new Set('João Pedro Carlos Maria Ana Sofia Lucas Hugo Tiago Rui André Bruno Marco Paulo José Manuel António Filipe Diogo Mariana Joana Rita Beatriz Catarina Inês Patrícia Cláudia Cristina Helena Sara Vânia Diana Camila Letícia Gabriela Renata Bianca'.split(/\s+/));
const PT_PLACES = new Set('Lisboa Porto Coimbra Braga Faro Funchal Madeira São Paulo Rio Brasília Salvador Recife Fortaleza Curitiba Belém Manaus Portugal Brasil Espanha Itália França Inglaterra Alemanha Argentina África Europa América'.split(/\s+/));

const DE_NAMES = new Set('Hans Klaus Peter Hans Karl Otto Werner Heinz Günter Wolfgang Dieter Helmut Franz Joachim Hans-Peter Maria Anna Petra Brigitte Christine Monika Gabi Sabine Andrea Susanne Jutta Renate Elisabeth Helga Ursula Gertrud Karin Birgit Anja Tanja Sandra Lisa Sarah Lena Lara Mia Emma Hannah Maximilian Jonas Niklas Felix Tim Ben Leon Paul'.split(/\s+/));
const DE_PLACES = new Set('Berlin München Hamburg Köln Frankfurt Stuttgart Düsseldorf Leipzig Dresden Hannover Nürnberg Bremen Deutschland Österreich Schweiz Frankreich Spanien Italien Niederlande Polen Russland China Japan Türkei Europa Amerika USA'.split(/\s+/));

const NL_NAMES = new Set('Jan Piet Klaas Hans Henk Willem Cornelis Johannes Maria Anna Petra Saskia Annemarie Lieke Eva Sophie Lotte Anouk Fleur Sanne Lisa Tess Bas Daan Sven Lars Stijn Tim Jeroen Mark Bart Erik Maarten Pieter Lucas Gijs Niels Tom Jens'.split(/\s+/));
const NL_PLACES = new Set('Amsterdam Rotterdam Den Haag Utrecht Eindhoven Groningen Tilburg Almere Breda Nijmegen Apeldoorn Haarlem Nederland België Duitsland Frankrijk Spanje Italië Engeland Polen Rusland China Europa Amerika'.split(/\s+/));

const SV_NAMES = new Set('Anders Erik Johan Karl Lars Niklas Per Sven Bo Stefan Jonas Magnus Mikael Fredrik Daniel Anna Eva Maria Karin Lena Birgitta Christina Margareta Linnea Sara Emma Hanna Lina Klara Ida Ebba Frida Astrid'.split(/\s+/));
const SV_PLACES = new Set('Stockholm Göteborg Malmö Uppsala Västerås Örebro Linköping Helsingborg Norrköping Jönköping Sverige Norge Danmark Finland Tyskland Frankrike Spanien Italien England Polen Ryssland Kina Europa USA Amerika'.split(/\s+/));

const CY_NAMES = new Set('Aled Dafydd Geraint Gwyn Iolo Owain Rhys Tomos Cai Aron Bran Cadog Dewi Emyr Glyn Hywel Llion Cefin Aled Sian Catrin Carys Bethan Eleri Lowri Megan Nia Rhiannon Sara Anna Alys Anwen Heledd Ffion Cerys Esyllt Tegwen'.split(/\s+/));
const CY_PLACES = new Set('Caerdydd Abertawe Wrecsam Casnewydd Bangor Aberystwyth Llandudno Caerfyrddin Cymru Lloegr Iwerddon Yr Alban Ffrainc Sbaen Yr Almaen Yr Eidal Tsieina Japan'.split(/\s+/));

const TR_NAMES = new Set('Ahmet Mehmet Ali Mustafa Hüseyin Hasan İbrahim Osman Salih Ömer Yusuf Kemal Süleyman Recep Murat Burak Cem Emre Deniz Berk Onur Tolga Erkan Sinan Tarık Levent Mert Caner Kerem Ayşe Fatma Hatice Emine Zeynep Hatice Meryem Sevgi Burcu Sema Hilal Esra Pınar Selin Elif Nehir Defne Yağmur Naz Doğa Banu Berna'.split(/\s+/));
const TR_PLACES = new Set('İstanbul Ankara İzmir Bursa Adana Gaziantep Konya Antalya Diyarbakır Mersin Kayseri Eskişehir Samsun Trabzon Denizli Türkiye Almanya Fransa İngiltere İtalya Yunanistan Rusya Çin Japonya Avrupa Amerika ABD'.split(/\s+/));

const RU_NAMES = new Set('Иван Виктор Александр Сергей Андрей Дмитрий Алексей Михаил Николай Владимир Юрий Олег Игорь Анатолий Леонид Анна Екатерина Мария Ольга Наталья Светлана Татьяна Елена Ирина Лариса Любовь Галина Виктория Юлия Надежда Полина София Алина Дарья Ксения Антон Олег Илья Кирилл Максим Артём Денис Никита Глеб Богдан Степан Семён'.split(/\s+/));
const RU_PLACES = new Set('Москва Петербург Санкт-Петербург Новосибирск Екатеринбург Казань Нижний Самара Челябинск Омск Ростов Уфа Красноярск Пермь Воронеж Волгоград Россия Украина Беларусь Германия Франция Англия Италия Испания Япония Китай Европа Америка'.split(/\s+/));

const HI_NAMES = new Set('राहुल रमेश सुनील मनोज नरेश मोहन कुणाल धीरज कमल भारत विकास रवि अनिल आदित्य रोहित अमन दीपक हरीश प्रदीप गोपाल श्याम अजय संजय प्रशांत सचिन गौरव ललित सुरेश उमेश शरद नितिन राजेश तरुण अरुण हेमंत राम कृष्ण अर्जुन प्रिया सुनीता पूजा नेहा दिव्या आशा कविता कमला रश्मि उषा सीमा मीना राधा सीता गीता पद्मा रीना मीरा अंजलि श्वेता ज्योति रेखा आरती मनीषा रिया शोभा ममता किरण सरला तारा चित्रा लता सरोज नीना सरिता उमा दीपा रत्ना नंदिनी सुषमा सोनम सोनाली भारती'.split(/\s+/));
const HI_PLACES = new Set('दिल्ली मुंबई कोलकाता चेन्नई बैंगलोर हैदराबाद पुणे अहमदाबाद जयपुर चंडीगढ़ लखनऊ कानपुर आगरा वाराणसी बनारस गोवा केरल उत्तराखंड गुजरात पंजाब हरियाणा राजस्थान महाराष्ट्र कर्नाटक तमिलनाडु बिहार झारखंड ओडिशा छत्तीसगढ़ शिमला मनाली नैनीताल उदयपुर जोधपुर मसूरी दार्जिलिंग हरिद्वार ऋषिकेश अमृतसर सूरत नागपुर भोपाल ग्वालियर इंदौर रांची पटना कोची मैसूर तिरुपति देहरादून'.split(/\s+/));

const ENT = {
  spanish: { names: ES_NAMES, places: ES_PLACES, useCapitalHeuristic: true },
  french: { names: FR_NAMES, places: FR_PLACES, useCapitalHeuristic: true },
  italian: { names: IT_NAMES, places: IT_PLACES, useCapitalHeuristic: true },
  portuguese: { names: PT_NAMES, places: PT_PLACES, useCapitalHeuristic: true },
  german: { names: DE_NAMES, places: DE_PLACES, useCapitalHeuristic: false }, // German nouns are capitalized
  dutch: { names: NL_NAMES, places: NL_PLACES, useCapitalHeuristic: true },
  swedish: { names: SV_NAMES, places: SV_PLACES, useCapitalHeuristic: true },
  welsh: { names: CY_NAMES, places: CY_PLACES, useCapitalHeuristic: true },
  turkish: { names: TR_NAMES, places: TR_PLACES, useCapitalHeuristic: true },
  hindi: { names: HI_NAMES, places: HI_PLACES, useCapitalHeuristic: false },
  russian: { names: RU_NAMES, places: RU_PLACES, useCapitalHeuristic: false },
};

function tokenize(s) {
  return s.replace(/[।,!?;:।'"“”‘’()—–…¿¡«»\.]+/g, ' ').split(/\s+/).filter(t => t.length > 0);
}

function skeletonize(target, ent) {
  const tokens = tokenize(target);
  const skel = tokens.map((t, i) => {
    if (ent.names.has(t)) return '[NAME]';
    if (ent.places.has(t)) return '[PLACE]';
    if (/^[0-9]+$/.test(t)) return '[NUM]';
    if (/^[०-९]+$/.test(t)) return '[NUM]';
    // Latin numerics word forms (en list — these may appear in some langs)
    if (i > 0 && ent.useCapitalHeuristic && /^[A-ZÀ-ÝŞİĞÜÖÇĞÄÖÜß][a-zà-ÿşığüöçğäöü]+$/.test(t)) {
      // Capitalized non-sentence-initial word: likely proper noun
      return '[PROP]';
    }
    return t;
  });
  return skel.join(' ');
}

const summary = {};

for (const [lang, deckPath] of Object.entries(DECKS)) {
  const deck = JSON.parse(fs.readFileSync(deckPath, 'utf8'));
  const ent = ENT[lang];
  const groups = new Map();
  for (const card of deck) {
    const skel = skeletonize(card.target, ent);
    if (!groups.has(skel)) groups.set(skel, []);
    groups.get(skel).push(card);
  }
  const clusters = [];
  for (const [skel, cards] of groups) {
    if (cards.length < 2) continue;
    if (!skel.includes('[NAME]') && !skel.includes('[PLACE]') && !skel.includes('[NUM]') && !skel.includes('[PROP]')) continue;
    clusters.push({ skel, cards });
  }
  clusters.sort((a, b) => b.cards.length - a.cards.length);

  const totalCardsInClusters = clusters.reduce((s, c) => s + c.cards.length, 0);
  const dups = clusters.reduce((s, c) => s + (c.cards.length - 1), 0);

  summary[lang] = {
    totalCards: deck.length,
    clusters: clusters.length,
    cardsInClusters: totalCardsInClusters,
    duplicatesAboveCanonical: dups,
    distribution: clusters.reduce((acc, c) => { acc[c.cards.length] = (acc[c.cards.length] || 0) + 1; return acc; }, {}),
    largestCluster: clusters[0] ? { size: clusters[0].cards.length, skel: clusters[0].skel } : null,
  };

  fs.writeFileSync(`scripts/dup-clusters-${lang}.json`, JSON.stringify({
    lang, totalCards: deck.length, clusters: clusters.map(c => ({
      skeleton: c.skel,
      count: c.cards.length,
      cards: c.cards.map(card => ({ id: card.id, priority: card.priority, target: card.target, english: card.english, grammarNode: card.grammarNode })),
    })),
  }, null, 2));
}

console.log('Cross-language duplicate detection results:');
console.log();
console.log('Lang   Cards  Clusters   InClusters  Dups   Largest  ExampleSkel');
console.log('─'.repeat(120));
for (const [lang, s] of Object.entries(summary)) {
  const ex = s.largestCluster ? s.largestCluster.skel.slice(0, 50) + (s.largestCluster.skel.length > 50 ? '…' : '') : '';
  console.log([
    lang.padEnd(7),
    String(s.totalCards).padStart(5),
    String(s.clusters).padStart(8),
    String(s.cardsInClusters).padStart(11),
    String(s.duplicatesAboveCanonical).padStart(6),
    String(s.largestCluster ? s.largestCluster.size : 0).padStart(8),
    '  ' + ex,
  ].join(''));
}
console.log();
console.log('Distribution per language (cluster size → count):');
for (const [lang, s] of Object.entries(summary)) {
  const sizes = Object.entries(s.distribution).sort((a,b) => Number(b[0]) - Number(a[0]));
  console.log('  ' + lang.padEnd(11) + sizes.map(([k,v]) => k + 'x:' + v).join(' '));
}
