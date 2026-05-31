// Add remaining missing words as direct entries for better coverage
const fs = require('fs');
const path = require('path');

const dictPath = path.join(__dirname, '../src/data/dictionary/pt.ts');
const content = fs.readFileSync(dictPath, 'utf8');

// Get all currently missing words from the deck
const deck = require('../src/data/portuguese/deck.json');
const words = new Map();
deck.forEach(card => {
  const text = card.target;
  if (!text) return;
  text.toLowerCase()
    .replace(/[.,!?;:"()¡¿…—–\-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 0)
    .forEach(w => words.set(w, (words.get(w) || 0) + 1));
});

// Extract existing keys
const dictKeys = new Set();
const lines = content.split('\n');
const dictStart = lines.findIndex(l => l.includes('const dictionary: Record<string, DictEntry>'));
for (let i = dictStart; i < lines.length; i++) {
  const line = lines[i];
  const qm = line.match(/^\s+"([^"]+)":\s*\{/);
  if (qm) { dictKeys.add(qm[1].toLowerCase()); continue; }
  const bm = line.match(/^\s+([^\s:]+):\s*\{/);
  if (bm) { dictKeys.add(bm[1].toLowerCase()); continue; }
}

// Also add irregular/contraction keys
const irregularSection = content.match(/const IRREGULAR_MAP[\s\S]*?^};/m);
if (irregularSection) {
  const irrRegex = /([^\s,:{]+):\s*'[^']+'/g;
  let m;
  while ((m = irrRegex.exec(irregularSection[0])) !== null) {
    dictKeys.add(m[1].toLowerCase());
  }
}
const contractionSection = content.match(/const CONTRACTION_MAP[\s\S]*?^};/m);
if (contractionSection) {
  const conRegex = /'([^']+)':\s*\[/g;
  let m;
  while ((m = conRegex.exec(contractionSection[0])) !== null) {
    dictKeys.add(m[1].toLowerCase());
  }
}

// Find missing words
const missing = [];
for (const [word, count] of words) {
  if (!dictKeys.has(word)) {
    missing.push({ word, count });
  }
}
missing.sort((a, b) => b.count - a.count);

console.log('Total missing:', missing.length);
console.log('Missing 5+:', missing.filter(w => w.count >= 5).length);
console.log('Missing 2+:', missing.filter(w => w.count >= 2).length);

// Generate entries for all missing words with 2+ occurrences and as many 1-occurrence as possible
// These are primarily verb conjugations, plurals, and feminine/masculine forms

const newEntries = {};

// Common word forms that need direct entries
const entries = {
  // Pronouns & determiners
  todos: { en: 'all; everyone', ipa: '/ˈto.dus/', pos: 'det' },
  eles: { en: 'they (m)', ipa: '/ˈe.lis/', pos: 'pron' },
  elas: { en: 'they (f)', ipa: '/ˈɛ.las/', pos: 'pron' },
  meus: { en: 'my (m pl)', ipa: '/ˈmews/', pos: 'det' },
  seus: { en: 'your; his; their (m pl)', ipa: '/ˈsews/', pos: 'det' },
  todas: { en: 'all (f)', ipa: '/ˈto.das/', pos: 'det' },
  outros: { en: 'others (m)', ipa: '/ˈow.tɾus/', pos: 'det' },
  muitos: { en: 'many (m)', ipa: '/ˈmũj.tus/', pos: 'det' },
  novas: { en: 'new (f pl)', ipa: '/ˈnɔ.vas/', pos: 'adj' },
  minhas: { en: 'my (f pl)', ipa: '/ˈmi.ɲas/', pos: 'det' },
  nossas: { en: 'our (f pl)', ipa: '/ˈnɔ.sas/', pos: 'det' },
  suas: { en: 'your; her; their (f pl)', ipa: '/ˈsu.as/', pos: 'det' },
  tantas: { en: 'so many (f)', ipa: '/ˈtɐ̃.tas/', pos: 'det' },
  umas: { en: 'some (f)', ipa: '/ˈu.mas/', pos: 'det' },

  // Common nouns (plurals)
  anos: { en: 'years', ipa: '/ˈɐ̃.nus/', pos: 'n' },
  filhos: { en: 'children; sons', ipa: '/ˈfi.ʎus/', pos: 'n' },
  dados: { en: 'data; dice', ipa: '/ˈda.dus/', pos: 'n' },
  horas: { en: 'hours', ipa: '/ˈɔ.ɾas/', pos: 'n' },
  amigos: { en: 'friends', ipa: '/a.ˈmi.ɡus/', pos: 'n' },
  documentos: { en: 'documents', ipa: '/do.ku.ˈmẽ.tus/', pos: 'n' },
  dias: { en: 'days', ipa: '/ˈdʒi.as/', pos: 'n' },
  vizinhos: { en: 'neighbors', ipa: '/vi.ˈzi.ɲus/', pos: 'n' },
  pessoas: { en: 'people; persons', ipa: '/pe.ˈso.as/', pos: 'n' },
  coisas: { en: 'things', ipa: '/ˈkoj.zas/', pos: 'n' },
  vezes: { en: 'times', ipa: '/ˈve.zis/', pos: 'n' },
  flores: { en: 'flowers', ipa: '/ˈflo.ɾis/', pos: 'n' },
  aulas: { en: 'classes; lessons', ipa: '/ˈaw.las/', pos: 'n' },
  juntos: { en: 'together', ipa: '/ˈʒũ.tus/', pos: 'adv' },
  erros: { en: 'errors; mistakes', ipa: '/ˈe.ʁus/', pos: 'n' },
  plantas: { en: 'plants', ipa: '/ˈplɐ̃.tas/', pos: 'n' },
  alunos: { en: 'students', ipa: '/a.ˈlu.nus/', pos: 'n' },
  olhos: { en: 'eyes', ipa: '/ˈo.ʎus/', pos: 'n' },
  desculpas: { en: 'apologies; excuses', ipa: '/des.ˈkuw.pas/', pos: 'n' },
  chaves: { en: 'keys', ipa: '/ˈʃa.vis/', pos: 'n' },
  notícias: { en: 'news', ipa: '/no.ˈtʃi.si.as/', pos: 'n' },
  funcionários: { en: 'employees', ipa: '/fũ.si.o.ˈna.ɾi.us/', pos: 'n' },
  fotos: { en: 'photos', ipa: '/ˈfɔ.tus/', pos: 'n' },
  minutos: { en: 'minutes', ipa: '/mi.ˈnu.tus/', pos: 'n' },
  resultados: { en: 'results', ipa: '/ʁe.zuw.ˈta.dus/', pos: 'n' },
  irmãos: { en: 'siblings; brothers', ipa: '/iʁ.ˈmɐ̃ws/', pos: 'n' },
  compras: { en: 'shopping; purchases', ipa: '/ˈkõ.pɾas/', pos: 'n' },
  filmes: { en: 'movies', ipa: '/ˈfiw.mis/', pos: 'n' },
  colegas: { en: 'colleagues', ipa: '/ko.ˈlɛ.ɡas/', pos: 'n' },
  ingressos: { en: 'tickets', ipa: '/ĩ.ˈɡɾe.sus/', pos: 'n' },
  últimos: { en: 'last ones (m)', ipa: '/ˈuw.tʃi.mus/', pos: 'adj' },
  felizes: { en: 'happy (pl)', ipa: '/fe.ˈli.zis/', pos: 'adj' },
  pais: { en: 'parents', ipa: '/ˈpajs/', pos: 'n' },
  ruas: { en: 'streets', ipa: '/ˈʁu.as/', pos: 'n' },
  livros: { en: 'books', ipa: '/ˈli.vɾus/', pos: 'n' },
  contas: { en: 'bills; accounts', ipa: '/ˈkõ.tas/', pos: 'n' },
  roupas: { en: 'clothes', ipa: '/ˈʁow.pas/', pos: 'n' },
  problemas: { en: 'problems', ipa: '/pɾo.ˈble.mas/', pos: 'n' },
  medidas: { en: 'measures', ipa: '/me.ˈdʒi.das/', pos: 'n' },
  dificuldades: { en: 'difficulties', ipa: '/dʒi.fi.kuw.ˈda.dʒis/', pos: 'n' },
  recursos: { en: 'resources', ipa: '/ʁe.ˈkuʁ.sus/', pos: 'n' },
  frutas: { en: 'fruits', ipa: '/ˈfɾu.tas/', pos: 'n' },
  mensagens: { en: 'messages', ipa: '/mẽ.ˈsa.ʒẽjs/', pos: 'n' },
  escadas: { en: 'stairs', ipa: '/es.ˈka.das/', pos: 'n' },
  artigos: { en: 'articles', ipa: '/aʁ.ˈtʃi.ɡus/', pos: 'n' },
  ingredientes: { en: 'ingredients', ipa: '/ĩ.ɡɾe.dʒi.ˈẽ.tʃis/', pos: 'n' },
  idiomas: { en: 'languages', ipa: '/i.dʒi.ˈo.mas/', pos: 'n' },
  preços: { en: 'prices', ipa: '/ˈpɾe.sus/', pos: 'n' },
  pratos: { en: 'dishes; plates', ipa: '/ˈpɾa.tus/', pos: 'n' },
  reuniões: { en: 'meetings', ipa: '/ʁe.u.ni.ˈõjs/', pos: 'n' },
  cabelos: { en: 'hair', ipa: '/ka.ˈbe.lus/', pos: 'n' },
  exercícios: { en: 'exercises', ipa: '/e.zeʁ.ˈsi.si.us/', pos: 'n' },
  providências: { en: 'measures; provisions', ipa: '/pɾo.vi.ˈdẽ.si.as/', pos: 'n' },
  palavras: { en: 'words', ipa: '/pa.ˈla.vɾas/', pos: 'n' },
  mudanças: { en: 'changes; moves', ipa: '/mu.ˈdɐ̃.sas/', pos: 'n' },
  convidados: { en: 'guests', ipa: '/kõ.vi.ˈda.dus/', pos: 'n' },
  árvores: { en: 'trees', ipa: '/ˈaʁ.vo.ɾis/', pos: 'n' },
  estudos: { en: 'studies', ipa: '/es.ˈtu.dus/', pos: 'n' },
  músicas: { en: 'songs; music', ipa: '/ˈmu.zi.kas/', pos: 'n' },
  variáveis: { en: 'variables', ipa: '/va.ɾi.ˈa.vejs/', pos: 'n' },
  procedimentos: { en: 'procedures', ipa: '/pɾo.se.dʒi.ˈmẽ.tus/', pos: 'n' },
  participantes: { en: 'participants', ipa: '/paʁ.tʃi.si.ˈpɐ̃.tʃis/', pos: 'n' },
  braços: { en: 'arms', ipa: '/ˈbɾa.sus/', pos: 'n' },
  consequências: { en: 'consequences', ipa: '/kõ.se.ˈkwẽ.si.as/', pos: 'n' },
  emergências: { en: 'emergencies', ipa: '/e.meʁ.ˈʒẽ.si.as/', pos: 'n' },
  negócios: { en: 'businesses; deals', ipa: '/ne.ˈɡɔ.si.us/', pos: 'n' },
  dúvidas: { en: 'doubts', ipa: '/ˈdu.vi.das/', pos: 'n' },
  críticas: { en: 'criticisms', ipa: '/ˈkɾi.tʃi.kas/', pos: 'n' },
  alterações: { en: 'changes; alterations', ipa: '/aw.te.ɾa.ˈsõjs/', pos: 'n' },
  condições: { en: 'conditions', ipa: '/kõ.dʒi.ˈsõjs/', pos: 'n' },
  circunstâncias: { en: 'circumstances', ipa: '/siʁ.kũs.ˈtɐ̃.si.as/', pos: 'n' },
  conclusões: { en: 'conclusions', ipa: '/kõ.klu.ˈzõjs/', pos: 'n' },
  critérios: { en: 'criteria', ipa: '/kɾi.ˈtɛ.ɾi.us/', pos: 'n' },
  políticas: { en: 'policies; political (f pl)', ipa: '/po.ˈli.tʃi.kas/', pos: 'n' },
  públicas: { en: 'public (f pl)', ipa: '/ˈpu.bli.kas/', pos: 'adj' },
  investigações: { en: 'investigations', ipa: '/ĩ.ves.tʃi.ɡa.ˈsõjs/', pos: 'n' },
  limitações: { en: 'limitations', ipa: '/li.mi.ta.ˈsõjs/', pos: 'n' },
  informações: { en: 'information', ipa: '/ĩ.foʁ.ma.ˈsõjs/', pos: 'n' },
  hipóteses: { en: 'hypotheses', ipa: '/i.ˈpɔ.te.zis/', pos: 'n' },
  oportunidades: { en: 'opportunities', ipa: '/o.poʁ.tu.ni.ˈda.dʒis/', pos: 'n' },
  manhãs: { en: 'mornings', ipa: '/ma.ˈɲɐ̃s/', pos: 'n' },
  momentos: { en: 'moments', ipa: '/mo.ˈmẽ.tus/', pos: 'n' },
  tempos: { en: 'times; periods', ipa: '/ˈtẽ.pus/', pos: 'n' },
  argumentos: { en: 'arguments', ipa: '/aʁ.ɡu.ˈmẽ.tus/', pos: 'n' },
  planos: { en: 'plans', ipa: '/ˈplɐ̃.nus/', pos: 'n' },
  cartas: { en: 'letters; cards', ipa: '/ˈkaʁ.tas/', pos: 'n' },
  bons: { en: 'good (m pl)', ipa: '/ˈbõs/', pos: 'adj' },
  jovens: { en: 'young people', ipa: '/ˈʒɔ.vẽjs/', pos: 'n' },
  dentes: { en: 'teeth', ipa: '/ˈdẽ.tʃis/', pos: 'n' },
  normas: { en: 'norms; rules', ipa: '/ˈnoʁ.mas/', pos: 'n' },
  fins: { en: 'ends; purposes', ipa: '/ˈfĩs/', pos: 'n' },
  partes: { en: 'parts', ipa: '/ˈpaʁ.tʃis/', pos: 'n' },
  termos: { en: 'terms', ipa: '/ˈteʁ.mus/', pos: 'n' },
  necessárias: { en: 'necessary (f pl)', ipa: '/ne.se.ˈsa.ɾi.as/', pos: 'adj' },

  // Adjectives (common forms)
  perdido: { en: 'lost', ipa: '/peʁ.ˈdʒi.du/', pos: 'adj' },
  atrasado: { en: 'late; delayed', ipa: '/a.tɾa.ˈza.du/', pos: 'adj' },
  preparado: { en: 'prepared; ready', ipa: '/pɾe.pa.ˈɾa.du/', pos: 'adj' },
  ligado: { en: 'connected; turned on', ipa: '/li.ˈɡa.du/', pos: 'adj' },
  estudado: { en: 'studied', ipa: '/es.tu.ˈda.du/', pos: 'adj' },
  terminado: { en: 'finished', ipa: '/teʁ.mi.ˈna.du/', pos: 'adj' },
  saído: { en: 'gone out', ipa: '/sa.ˈi.du/', pos: 'adj' },
  combinado: { en: 'agreed; combined', ipa: '/kõ.bi.ˈna.du/', pos: 'adj' },
  decidido: { en: 'decided', ipa: '/de.si.ˈdʒi.du/', pos: 'adj' },
  crescido: { en: 'grown', ipa: '/kɾe.ˈsi.du/', pos: 'adj' },
  comprado: { en: 'bought', ipa: '/kõ.ˈpɾa.du/', pos: 'adj' },
  resolvido: { en: 'resolved; solved', ipa: '/ʁe.zow.ˈvi.du/', pos: 'adj' },
  acontecido: { en: 'happened', ipa: '/a.kõ.te.ˈsi.du/', pos: 'adj' },
  conseguido: { en: 'achieved; obtained', ipa: '/kõ.se.ˈɡi.du/', pos: 'adj' },
  mudado: { en: 'changed', ipa: '/mu.ˈda.du/', pos: 'adj' },
  chegado: { en: 'arrived', ipa: '/ʃe.ˈɡa.du/', pos: 'adj' },
  aprovado: { en: 'approved', ipa: '/a.pɾo.ˈva.du/', pos: 'adj' },
  parado: { en: 'stopped; still', ipa: '/pa.ˈɾa.du/', pos: 'adj' },
  esforçado: { en: 'hard-working', ipa: '/es.foʁ.ˈsa.du/', pos: 'adj' },
  descoberto: { en: 'discovered', ipa: '/des.ko.ˈbɛʁ.tu/', pos: 'adj' },
  quebrado: { en: 'broken', ipa: '/ke.ˈbɾa.du/', pos: 'adj' },
  atrasada: { en: 'late; delayed (f)', ipa: '/a.tɾa.ˈza.da/', pos: 'adj' },
  organizada: { en: 'organized (f)', ipa: '/oʁ.ɡa.ni.ˈza.da/', pos: 'adj' },
  preocupado: { en: 'worried', ipa: '/pɾe.o.ku.ˈpa.du/', pos: 'adj' },
  fechada: { en: 'closed (f)', ipa: '/fe.ˈʃa.da/', pos: 'adj' },
  divertida: { en: 'fun; amusing (f)', ipa: '/dʒi.veʁ.ˈtʃi.da/', pos: 'adj' },
  difíceis: { en: 'difficult (pl)', ipa: '/dʒi.ˈfi.sejs/', pos: 'adj' },
  sociais: { en: 'social (pl)', ipa: '/so.si.ˈajs/', pos: 'adj' },
  muitas: { en: 'many (f)', ipa: '/ˈmũj.tas/', pos: 'det' },
  diferentes: { en: 'different (pl)', ipa: '/dʒi.fe.ˈɾẽ.tʃis/', pos: 'adj' },

  // Common verbs/forms the lookup might miss
  ajuda: { en: 'help; helps', ipa: '/a.ˈʒu.da/', pos: 'n' },
  espera: { en: 'wait; waiting', ipa: '/es.ˈpɛ.ɾa/', pos: 'n' },
  dança: { en: 'dance', ipa: '/ˈdɐ̃.sa/', pos: 'n' },

  // Informal/slang
  nóis: { en: 'we (informal nós)', ipa: '/ˈnɔjs/', pos: 'pron' },

  // More nouns
  olhada: { en: 'look; glance', ipa: '/o.ˈʎa.da/', pos: 'n' },
  vagas: { en: 'vacancies; spots', ipa: '/ˈva.ɡas/', pos: 'n' },
  ideias: { en: 'ideas', ipa: '/i.ˈdej.as/', pos: 'n' },
  redes: { en: 'networks; nets', ipa: '/ˈʁe.dʒis/', pos: 'n' },
  jogos: { en: 'games', ipa: '/ˈʒɔ.ɡus/', pos: 'n' },
  sapatos: { en: 'shoes', ipa: '/sa.ˈpa.tus/', pos: 'n' },
  móveis: { en: 'furniture', ipa: '/ˈmɔ.vejs/', pos: 'n' },
  quartos: { en: 'rooms; bedrooms', ipa: '/ˈkwaʁ.tus/', pos: 'n' },
  produtos: { en: 'products', ipa: '/pɾo.ˈdu.tus/', pos: 'n' },
  notas: { en: 'notes; grades', ipa: '/ˈnɔ.tas/', pos: 'n' },
  cortinas: { en: 'curtains', ipa: '/koʁ.ˈtʃi.nas/', pos: 'n' },
  moradores: { en: 'residents', ipa: '/mo.ɾa.ˈdo.ɾis/', pos: 'n' },
  novos: { en: 'new (m pl)', ipa: '/ˈnɔ.vus/', pos: 'adj' },
  respostas: { en: 'answers', ipa: '/ʁes.ˈpos.tas/', pos: 'n' },
  melhores: { en: 'better (pl)', ipa: '/me.ˈʎɔ.ɾis/', pos: 'adj' },
  cadeiras: { en: 'chairs', ipa: '/ka.ˈdej.ɾas/', pos: 'n' },
  cansados: { en: 'tired (m pl)', ipa: '/kɐ̃.ˈsa.dus/', pos: 'adj' },
  prontos: { en: 'ready (m pl)', ipa: '/ˈpɾõ.tus/', pos: 'adj' },
  gatos: { en: 'cats', ipa: '/ˈɡa.tus/', pos: 'n' },
  brasileiras: { en: 'Brazilian (f pl)', ipa: '/bɾa.zi.ˈlej.ɾas/', pos: 'adj' },
  barulhentos: { en: 'noisy', ipa: '/ba.ɾu.ˈʎẽ.tus/', pos: 'adj' },
  domingos: { en: 'Sundays', ipa: '/do.ˈmĩ.ɡus/', pos: 'n' },
  instruções: { en: 'instructions', ipa: '/ĩs.tɾu.ˈsõjs/', pos: 'n' },
  praias: { en: 'beaches', ipa: '/ˈpɾaj.as/', pos: 'n' },
  meninos: { en: 'boys', ipa: '/me.ˈni.nus/', pos: 'n' },
  gaúchos: { en: 'gauchos; from RS', ipa: '/ɡa.ˈu.ʃus/', pos: 'n' },
  relatórios: { en: 'reports', ipa: '/ʁe.la.ˈtɔ.ɾi.us/', pos: 'n' },
  vendas: { en: 'sales', ipa: '/ˈvẽ.das/', pos: 'n' },
  consultas: { en: 'appointments; consultations', ipa: '/kõ.ˈsuw.tas/', pos: 'n' },
  comidas: { en: 'foods', ipa: '/ko.ˈmi.das/', pos: 'n' },
  projetos: { en: 'projects', ipa: '/pɾo.ˈʒɛ.tus/', pos: 'n' },
  textos: { en: 'texts', ipa: '/ˈtes.tus/', pos: 'n' },
  tarefas: { en: 'tasks', ipa: '/ta.ˈɾɛ.fas/', pos: 'n' },
  eventos: { en: 'events', ipa: '/e.ˈvẽ.tus/', pos: 'n' },
  papéis: { en: 'papers; roles', ipa: '/pa.ˈpɛjs/', pos: 'n' },
  quadros: { en: 'frames; paintings', ipa: '/ˈkwa.dɾus/', pos: 'n' },
  séries: { en: 'series (pl)', ipa: '/ˈsɛ.ɾis/', pos: 'n' },
  ligações: { en: 'calls; connections', ipa: '/li.ɡa.ˈsõjs/', pos: 'n' },
  próprias: { en: 'own (f pl)', ipa: '/ˈpɾɔ.pɾi.as/', pos: 'adj' },
  presentes: { en: 'presents; gifts', ipa: '/pɾe.ˈzẽ.tʃis/', pos: 'n' },
  ondas: { en: 'waves', ipa: '/ˈõ.das/', pos: 'n' },
  malas: { en: 'suitcases', ipa: '/ˈma.las/', pos: 'n' },
  amigas: { en: 'friends (f)', ipa: '/a.ˈmi.ɡas/', pos: 'n' },
  lindas: { en: 'beautiful (f pl)', ipa: '/ˈlĩ.das/', pos: 'adj' },
  tesouros: { en: 'treasures', ipa: '/te.ˈzow.ɾus/', pos: 'n' },
  primos: { en: 'cousins', ipa: '/ˈpɾi.mus/', pos: 'n' },
  provas: { en: 'tests; evidence', ipa: '/ˈpɾɔ.vas/', pos: 'n' },
  verduras: { en: 'vegetables', ipa: '/veʁ.ˈdu.ɾas/', pos: 'n' },
  direitos: { en: 'rights', ipa: '/dʒi.ˈɾej.tus/', pos: 'n' },
  cidades: { en: 'cities', ipa: '/si.ˈda.dʒis/', pos: 'n' },
  valores: { en: 'values', ipa: '/va.ˈlo.ɾis/', pos: 'n' },
  regras: { en: 'rules', ipa: '/ˈʁe.ɡɾas/', pos: 'n' },
  obras: { en: 'works; construction', ipa: '/ˈɔ.bɾas/', pos: 'n' },
  detalhes: { en: 'details', ipa: '/de.ˈta.ʎis/', pos: 'n' },
  sentimentos: { en: 'feelings', ipa: '/sẽ.tʃi.ˈmẽ.tus/', pos: 'n' },
  sonhos: { en: 'dreams', ipa: '/ˈso.ɲus/', pos: 'n' },
  clientes: { en: 'clients; customers', ipa: '/kli.ˈẽ.tʃis/', pos: 'n' },
  pontos: { en: 'points', ipa: '/ˈpõ.tus/', pos: 'n' },
  opções: { en: 'options', ipa: '/op.ˈsõjs/', pos: 'n' },
  países: { en: 'countries', ipa: '/pa.ˈi.zis/', pos: 'n' },
  feriados: { en: 'holidays', ipa: '/fe.ɾi.ˈa.dus/', pos: 'n' },
  despesas: { en: 'expenses', ipa: '/des.ˈpe.zas/', pos: 'n' },
  maiores: { en: 'bigger; greater', ipa: '/ma.ˈjɔ.ɾis/', pos: 'adj' },
  impostos: { en: 'taxes', ipa: '/ĩ.ˈpos.tus/', pos: 'n' },
  empresas: { en: 'companies', ipa: '/ẽ.ˈpɾe.zas/', pos: 'n' },
  prêmios: { en: 'prizes; awards', ipa: '/ˈpɾe.mi.us/', pos: 'n' },
  desafios: { en: 'challenges', ipa: '/de.za.ˈfi.us/', pos: 'n' },
  esforços: { en: 'efforts', ipa: '/es.ˈfoʁ.sus/', pos: 'n' },
  empregos: { en: 'jobs', ipa: '/ẽ.ˈpɾe.ɡus/', pos: 'n' },
  objetivos: { en: 'objectives; goals', ipa: '/ob.ʒe.ˈtʃi.vus/', pos: 'n' },
  prioridades: { en: 'priorities', ipa: '/pɾi.o.ɾi.ˈda.dʒis/', pos: 'n' },
  demissões: { en: 'dismissals', ipa: '/de.mi.ˈsõjs/', pos: 'n' },
  números: { en: 'numbers', ipa: '/ˈnu.me.ɾus/', pos: 'n' },
  comentários: { en: 'comments', ipa: '/ko.mẽ.ˈta.ɾi.us/', pos: 'n' },
  nuvens: { en: 'clouds', ipa: '/ˈnu.vẽjs/', pos: 'n' },
  mãos: { en: 'hands', ipa: '/ˈmɐ̃ws/', pos: 'n' },
  pernas: { en: 'legs', ipa: '/ˈpɛʁ.nas/', pos: 'n' },
  lados: { en: 'sides', ipa: '/ˈla.dus/', pos: 'n' },
  ovos: { en: 'eggs', ipa: '/ˈo.vus/', pos: 'n' },
  botas: { en: 'boots', ipa: '/ˈbɔ.tas/', pos: 'n' },
  cores: { en: 'colors', ipa: '/ˈko.ɾis/', pos: 'n' },
  promessas: { en: 'promises', ipa: '/pɾo.ˈme.sas/', pos: 'n' },
  sabores: { en: 'flavors', ipa: '/sa.ˈbo.ɾis/', pos: 'n' },
  tradições: { en: 'traditions', ipa: '/tɾa.dʒi.ˈsõjs/', pos: 'n' },
  comunidades: { en: 'communities', ipa: '/ko.mu.ni.ˈda.dʒis/', pos: 'n' },
  regiões: { en: 'regions', ipa: '/ʁe.ʒi.ˈõjs/', pos: 'n' },
  gerações: { en: 'generations', ipa: '/ʒe.ɾa.ˈsõjs/', pos: 'n' },
  lágrimas: { en: 'tears', ipa: '/ˈla.ɡɾi.mas/', pos: 'n' },
  ruínas: { en: 'ruins', ipa: '/ʁu.ˈi.nas/', pos: 'n' },
  décadas: { en: 'decades', ipa: '/ˈdɛ.ka.das/', pos: 'n' },
  nações: { en: 'nations', ipa: '/na.ˈsõjs/', pos: 'n' },
  amizades: { en: 'friendships', ipa: '/a.mi.ˈza.dʒis/', pos: 'n' },
  vantagens: { en: 'advantages', ipa: '/vɐ̃.ˈta.ʒẽjs/', pos: 'n' },
  atividades: { en: 'activities', ipa: '/a.tʃi.vi.ˈda.dʒis/', pos: 'n' },
  demandas: { en: 'demands', ipa: '/de.ˈmɐ̃.das/', pos: 'n' },
  exceções: { en: 'exceptions', ipa: '/e.se.ˈsõjs/', pos: 'n' },
  escolhas: { en: 'choices', ipa: '/es.ˈko.ʎas/', pos: 'n' },
  qualidades: { en: 'qualities', ipa: '/kwa.li.ˈda.dʒis/', pos: 'n' },
  milhões: { en: 'millions', ipa: '/mi.ˈʎõjs/', pos: 'n' },
  responsabilidades: { en: 'responsibilities', ipa: '/ʁes.põ.sa.bi.li.ˈda.dʒis/', pos: 'n' },
  contribuições: { en: 'contributions', ipa: '/kõ.tɾi.bu.i.ˈsõjs/', pos: 'n' },
  implicações: { en: 'implications', ipa: '/ĩ.pli.ka.ˈsõjs/', pos: 'n' },
  publicações: { en: 'publications', ipa: '/pu.bli.ka.ˈsõjs/', pos: 'n' },
  considerações: { en: 'considerations', ipa: '/kõ.si.de.ɾa.ˈsõjs/', pos: 'n' },
  capítulos: { en: 'chapters', ipa: '/ka.ˈpi.tu.lus/', pos: 'n' },
  reflexões: { en: 'reflections', ipa: '/ʁe.flek.ˈsõjs/', pos: 'n' },
  disposições: { en: 'dispositions; provisions', ipa: '/dʒis.po.zi.ˈsõjs/', pos: 'n' },
  evidências: { en: 'evidence', ipa: '/e.vi.ˈdẽ.si.as/', pos: 'n' },
  transformações: { en: 'transformations', ipa: '/tɾɐ̃s.foʁ.ma.ˈsõjs/', pos: 'n' },
  inscrições: { en: 'registrations; inscriptions', ipa: '/ĩs.kɾi.ˈsõjs/', pos: 'n' },
  alternativas: { en: 'alternatives', ipa: '/aw.teʁ.na.ˈtʃi.vas/', pos: 'n' },
  frutos: { en: 'fruits; results', ipa: '/ˈfɾu.tus/', pos: 'n' },

  // Misc high-value words
  após: { en: 'after', ipa: '/a.ˈpɔs/', pos: 'prep' },
  úteis: { en: 'useful (pl)', ipa: '/ˈu.tejs/', pos: 'adj' },
  invés: { en: 'instead (ao invés)', ipa: '/ĩ.ˈves/', pos: 'n' },
  louca: { en: 'crazy (f)', ipa: '/ˈlow.ka/', pos: 'adj' },
  destruído: { en: 'destroyed', ipa: '/des.tɾu.ˈi.du/', pos: 'adj' },
  construído: { en: 'built; constructed', ipa: '/kõs.tɾu.ˈi.du/', pos: 'adj' },
  inscrito: { en: 'enrolled; registered', ipa: '/ĩs.ˈkɾi.tu/', pos: 'adj' },
  avançado: { en: 'advanced', ipa: '/a.vɐ̃.ˈsa.du/', pos: 'adj' },
  feita: { en: 'made; done (f)', ipa: '/ˈfej.ta/', pos: 'adj' },
  promovido: { en: 'promoted', ipa: '/pɾo.mo.ˈvi.du/', pos: 'adj' },
  demitido: { en: 'fired; dismissed', ipa: '/de.mi.ˈtʃi.du/', pos: 'adj' },
  proibido: { en: 'prohibited; forbidden', ipa: '/pɾo.i.ˈbi.du/', pos: 'adj' },
  inaugurada: { en: 'inaugurated (f)', ipa: '/i.naw.ɡu.ˈɾa.da/', pos: 'adj' },
  suspensas: { en: 'suspended (f pl)', ipa: '/sus.ˈpẽ.sas/', pos: 'adj' },
  confirmada: { en: 'confirmed (f)', ipa: '/kõ.fiʁ.ˈma.da/', pos: 'adj' },
};

// Check which already exist and filter
let addCount = 0;
const toAdd = {};
for (const [key, val] of Object.entries(entries)) {
  if (!dictKeys.has(key)) {
    toAdd[key] = val;
    addCount++;
  }
}

console.log(`\nWill add ${addCount} new entries (${Object.keys(entries).length - addCount} already exist)`);

// Generate and insert
const entryLines = [];
const sorted = Object.keys(toAdd).sort((a, b) => a.localeCompare(b, 'pt'));
for (const key of sorted) {
  const e = toAdd[key];
  const needsQuotes = /[^a-zA-ZÀ-ÖØ-öø-ÿĩĨũŨɐ0-9_]/.test(key) || /^\d/.test(key);
  const k = needsQuotes ? `"${key}"` : key;
  const enEscaped = e.en.replace(/'/g, "\\'");
  entryLines.push(`  ${k}: { en: '${enEscaped}', ipa: '${e.ipa}', pos: '${e.pos}' },`);
}

const insertText = '\n  // ── Additional expanded coverage (batch 2) ──\n' + entryLines.join('\n') + '\n';

const currentContent = fs.readFileSync(dictPath, 'utf8');
const closingBrace = currentContent.lastIndexOf('};');
const newContent = currentContent.slice(0, closingBrace) + insertText + currentContent.slice(closingBrace);
fs.writeFileSync(dictPath, newContent, 'utf8');
console.log('Batch 2 injection complete!');
