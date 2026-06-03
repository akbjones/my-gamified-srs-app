const fs = require('fs');
const path = require('path');

const pt = require('../src/data/portuguese/deck.json');
const de = require('../src/data/german/deck.json');

function countTips(cards) {
  const tipCounts = {};
  for (const c of cards) {
    if (!c.grammar) continue;
    const tip = c.grammar.trim();
    if (!tipCounts[tip]) tipCounts[tip] = [];
    tipCounts[tip].push(c);
  }
  return tipCounts;
}

// Track how many times each replacement tip is used globally, to avoid new repetitions
class TipTracker {
  constructor() { this.counts = {}; }
  use(tip) {
    this.counts[tip] = (this.counts[tip] || 0) + 1;
    return this.counts[tip];
  }
  count(tip) { return this.counts[tip] || 0; }
}

// ===================== PORTUGUESE =====================

function generatePTFixes() {
  const fixes = [];
  const tipCounts = countTips(pt);
  const ptWithGrammar = pt.filter(c => c.grammar);
  const fixedIds = new Set();
  const tracker = new TipTracker();
  
  // PASS 1: Repetitive tips (20+)
  const repetitive = Object.entries(tipCounts)
    .filter(([t, ids]) => ids.length >= 20)
    .sort((a,b) => b[1].length - a[1].length);
  
  for (const [tip, cards] of repetitive) {
    for (const card of cards) {
      if (fixedIds.has(card.id)) continue;
      const replacement = generatePTTip(card, tracker);
      if (replacement && replacement !== tip) {
        fixes.push({ id: card.id, current_tip: tip, fixed_tip: replacement, issue: 'repetitive' });
        fixedIds.add(card.id);
        tracker.use(replacement);
      }
    }
  }
  
  // PASS 2: Mismatch/wrong tips
  for (const card of ptWithGrammar) {
    if (fixedIds.has(card.id)) continue;
    const issue = detectPTIssue(card);
    if (issue) {
      const replacement = generatePTTip(card, tracker);
      if (replacement && replacement !== card.grammar) {
        fixes.push({ id: card.id, current_tip: card.grammar, fixed_tip: replacement, issue: issue.type });
        fixedIds.add(card.id);
        tracker.use(replacement);
      }
    }
  }
  
  return fixes;
}

function detectPTIssue(card) {
  const tip = card.grammar;
  const sent = card.target;
  const eng = card.english;
  const tipL = tip.toLowerCase();
  const sentL = sent.toLowerCase();
  const engL = eng.toLowerCase();
  
  // Subjunctive tip but no subjunctive
  if ((tipL.includes('subjuntivo') || tipL.includes('subjunctive')) && !tipL.includes('vs') && !tipL.includes('contrast')) {
    const subjForms = /\b(seja|sejam|tenha|tenham|faça|façam|vá|vão|dê|deem|esteja|estejam|possa|possam|saiba|saibam|queira|haja|fosse|fossem|tivesse|tivessem|fizesse|pudesse|soubesse|quisesse|houvesse|estivesse)\b/i;
    if (!subjForms.test(sent) && !/\b(embora|talvez|oxalá|caso|mesmo que|a menos que|sem que|é bom que|quero que|espero que|duvido que)\b/i.test(sent)) {
      return { type: 'mismatch' };
    }
  }
  
  // 'Seja' tip but no 'seja'
  if (tipL.includes("'seja'") && !sentL.includes('seja') && !sentL.includes('sejam')) {
    return { type: 'mismatch' };
  }
  
  // Perfeito tip on present sentence
  if ((tipL.includes('pretérito perfeito') || tipL.includes('perfeito')) && !tipL.includes('imperfeito') && !tipL.includes('mais-que') && !tipL.includes('vs') && !tipL.includes('choose') && !tipL.includes('contrast')) {
    const pastVerbs = /\b(foi|fui|esteve|estive|teve|tive|fez|fiz|disse|quis|soube|pôde|deu|dei|veio|vim|trouxe|houve|pôs|vi|viu|ouviu|comprou|vendeu|pagou|trabalhou|estudou|falou|viajou|chegou|voltou|ficou|começou|terminou|aconteceu|nasceu|morreu|cresceu|conheceu|abriu|fechou|comeu|bebeu|dormiu|saiu|entrou)\b/i;
    const engPast = /\b(was|were|did|had|went|came|got|made|said|told|gave|took|saw|knew|found|thought|heard|left|felt|became|started)\b/i;
    if (!pastVerbs.test(sent) && !engPast.test(eng) && !/\b\w+(ou|aram|eu|iu|ei)\b/.test(sent)) {
      return { type: 'mismatch' };
    }
  }
  
  // Conditional tip but no conditional
  if ((tipL.includes('condicional') || tipL.includes('conditional')) && !tipL.includes('vs') && !tipL.includes('pairs with')) {
    if (!/\b\w+(aria|arias|aríamos|ariam|eria|erias|eríamos|eriam|iria|irias|iríamos|iriam)\b/i.test(sent)) {
      return { type: 'mismatch' };
    }
  }
  
  // Imperative tip but not imperative
  if (tipL.includes('imperativ') && !tipL.includes('vs')) {
    const impForms = /^(faz|faça|vai|vá|vem|venha|diz|diga|fala|fale|olha|olhe|para|pare|come|coma|abre|abra|fecha|feche|espera|espere|lê|leia|escreve|escreva|toma|tome|pega|pegue|liga|não )/i;
    if (!impForms.test(sent.replace(/^[¡¿]/, ''))) {
      return { type: 'mismatch' };
    }
  }
  
  // Pluperfect tip without pluperfect
  if ((tipL.includes('mais-que-perfeito') || tipL.includes('pluperfect')) && !tipL.includes('vs')) {
    const hasPlup = /\b(tinha|tínhamos|tinham)\b/i.test(sent) || /\b\w+ra\b/i.test(sent);
    if (!hasPlup) return { type: 'mismatch' };
  }
  
  // Future subjunctive tip without triggers
  if (tipL.includes('futuro do subjuntivo') || tipL.includes('future subjunctive')) {
    const futSubjForms = /\b(for|fizer|estiver|tiver|puder|souber|quiser|vier|trouxer|puser|disser|der|houver)\b/i;
    if (!futSubjForms.test(sent)) return { type: 'mismatch' };
  }
  
  // Conjugation table
  if (/eu \w+,\s*tu \w+,\s*ele \w+/i.test(tip)) return { type: 'irrelevant' };
  
  // Generic filler
  if (tip.length < 30) return { type: 'irrelevant' };
  
  return null;
}

function generatePTTip(card, tracker) {
  const sent = card.target;
  const eng = card.english;
  const sentL = sent.toLowerCase();
  const engL = eng.toLowerCase();
  const node = card.grammarNode;
  const nodeNum = parseInt(node.replace('node-', ''));
  
  // Build a list of candidate tips, pick the best unused one
  const candidates = [];
  
  // --- HIGH PRIORITY: Specific grammar features found in the sentence ---
  
  // Subjunctive triggers
  const subjTrigger = sent.match(/\b(embora|talvez|oxalá|caso|mesmo que|a menos que|sem que|antes que|para que|desde que|até que)\b/i);
  if (subjTrigger) {
    candidates.push(`'${subjTrigger[1]}' always triggers the subjunctive – it signals uncertainty or a condition that may not be real.`);
  }
  
  // Emotion/desire + subjunctive
  const emotionSubj = sent.match(/\b(quero que|espero que|duvido que|é bom que|é importante que|é necessário que|lamento que|sinto que|prefiro que|é possível que|é provável que|não acredito que)\b/i);
  if (emotionSubj) {
    candidates.push(`'${emotionSubj[1]}' requires the subjunctive – expressions of desire, doubt, or emotion always trigger it in the subordinate clause.`);
  }
  
  // Se + imperfect subjunctive (specific verb)
  const seImpSubj = sent.match(/\bse\b.*?\b(fosse|tivesse|pudesse|soubesse|quisesse|fizesse|dissesse|viesse|houvesse|estivesse|morasse|trabalhasse|falasse|comprasse|vendesse|dormisse|ficasse|precisasse|existisse|chovesse|ganhasse|perdesse|mudasse|acabasse|começasse)\b/i);
  if (seImpSubj) {
    candidates.push(`'Se + ${seImpSubj[1]}' sets up a contrary-to-fact condition – describing a hypothetical situation that isn't currently true.`);
  }
  
  // Conditional verbs (specific)
  const condVerb = sent.match(/\b(\w+(?:aria|arias|aríamos|ariam|eria|erias|eríamos|eriam|iria|irias|iríamos|iriam))\b/i);
  if (condVerb) {
    const root = condVerb[1].replace(/(aria|arias|aríamos|ariam|eria|erias|eríamos|eriam|iria|irias|iríamos|iriam)$/i, '');
    candidates.push(`'${condVerb[1]}' is the conditional – it expresses what would happen. Formed by adding -ia endings to the infinitive stem.`);
  }
  
  // Future subjunctive forms
  const futSubj = sent.match(/\b(for|fizer|estiver|tiver|puder|souber|quiser|vier|trouxer|puser|disser|houver)\b/i);
  if (futSubj) {
    candidates.push(`'${futSubj[1]}' is a future subjunctive form – used after 'quando', 'se', 'enquanto' for actions that may happen in the future.`);
  }
  
  // Personal infinitive
  const persInf = sent.match(/\b(\w+r)(mos|em|es)\b/i);
  if (persInf && nodeNum > 10) {
    candidates.push(`The personal infinitive '${persInf[0]}' conjugates the infinitive for person – a uniquely Portuguese feature that simplifies complex clause structures.`);
  }
  
  // Ir + infinitive
  const irInf = sent.match(/\b(vou|vai|vamos|vão)\s+(\w+r)\b/i);
  if (irInf) {
    candidates.push(`'${irInf[1]} + ${irInf[2]}' is the informal future – far more natural in spoken Brazilian Portuguese than the simple future tense.`);
  }
  
  // Literary pluperfect (-ra)
  if (nodeNum >= 27) {
    const raForm = sent.match(/\b(\w{4,}[aeiou]ra)\b/i);
    if (raForm && !['agora', 'embora', 'ainda', 'hora', 'outra', 'primeira', 'sequer'].includes(raForm[1].toLowerCase())) {
      candidates.push(`'${raForm[1]}' uses the literary simple pluperfect (-ra ending) – elegant in formal writing but replaced by 'tinha + participle' in speech.`);
    }
  }
  
  // Relative pronouns
  const relPron = sent.match(/\b(cujo|cuja|cujos|cujas)\b/i);
  if (relPron) {
    candidates.push(`'${relPron[1]}' (whose) agrees with the possessed noun, not the possessor – one of the trickiest relative pronouns in Portuguese.`);
  }
  const relQuem = sent.match(/\b(com quem|para quem|de quem|por quem|a quem|em quem)\b/i);
  if (relQuem) {
    candidates.push(`'${relQuem[1]}' – after prepositions, use 'quem' for people. The preposition comes before the relative pronoun, unlike in informal English.`);
  }
  const relOnde = sent.match(/\b(onde|aonde)\b/i);
  if (relOnde && (engL.includes('where') || engL.includes('place'))) {
    candidates.push(`'${relOnde[1]}' introduces a relative clause about places – 'onde' for location, 'aonde' with verbs of motion (ir, levar).`);
  }
  
  // Passive se
  if (/\b\w+[aeiou]-se\b/i.test(sent) || /\bse\s+(pode|deve|precisa|consegue|faz|diz|sabe|fala|vende|compra|come|vê|ouve|usa|pensa|acredita|imagina|espera|procura|encontra|nota|percebe|observa)\b/i.test(sentL)) {
    const verb = sent.match(/\bse\s+(\w+)\b/i) || sent.match(/\b(\w+)-se\b/i);
    if (verb) {
      candidates.push(`'Se + ${verb[1]}' creates an impersonal/passive construction – very common in Portuguese for expressing general truths or what 'one does'.`);
    }
  }
  
  // Diminutives
  const dim = sent.match(/\b(\w+(?:inho|inha|inhos|inhas|zinho|zinha))\b/i);
  if (dim) {
    candidates.push(`'${dim[1]}' uses the diminutive – expressing smallness, affection, or casualness. Words ending in consonants typically use -zinho/-zinha.`);
  }
  
  // Augmentatives
  const aug = sent.match(/\b(\w+(?:ão|ões|ona|onas))\b/i);
  if (aug && sent.length < 60) {
    candidates.push(`Portuguese augmentatives (-ão/-ona) express large size or intensity, often with emotional undertones – can be admiring or pejorative.`);
  }
  
  // Contractions (be specific about which one)
  const contractions = {
    'do': 'de+o (of the)', 'da': 'de+a', 'dos': 'de+os', 'das': 'de+as',
    'no': 'em+o (in the)', 'na': 'em+a', 'nos': 'em+os', 'nas': 'em+as',
    'ao': 'a+o (to the)', 'à': 'a+a', 'aos': 'a+os', 'às': 'a+as',
    'pelo': 'por+o (by the)', 'pela': 'por+a', 'pelos': 'por+os', 'pelas': 'por+as',
    'num': 'em+um (in a)', 'numa': 'em+uma', 'nuns': 'em+uns', 'numas': 'em+umas',
    'dum': 'de+um (of a)', 'duma': 'de+uma'
  };
  for (const [form, expansion] of Object.entries(contractions)) {
    const regex = new RegExp(`\\b${form}\\b`, 'i');
    if (regex.test(sent)) {
      candidates.push(`'${form}' contracts ${expansion} – these fusions are mandatory in Portuguese, never written separately.`);
      break;
    }
  }
  
  // Ser vs estar
  if (/\b(é|são|somos|sou)\b/i.test(sent) && !sent.includes('está') && !sent.includes('estou')) {
    const serForm = sent.match(/\b(é|são|somos|sou)\b/i)[1];
    if (engL.includes('is') || engL.includes('are') || engL.includes("'m") || engL.includes("'re")) {
      candidates.push(`'${serForm}' (ser) – used for permanent qualities, identity, origin. Estar would imply a temporary state instead.`);
    }
  }
  if (/\b(está|estou|estamos|estão)\b/i.test(sent) && !sent.includes(' é ') && !sent.includes(' são ')) {
    const estarForm = sent.match(/\b(está|estou|estamos|estão)\b/i)[1];
    candidates.push(`'${estarForm}' (estar) – marks a temporary condition or location. Using 'ser' here would imply permanence.`);
  }
  
  // Ter expressions
  if (/\b(tenho|tem|temos|têm)\s+(que|de)\b/i.test(sent)) {
    candidates.push(`'Ter que/de + infinitive' expresses obligation (have to) – more colloquial than 'dever' and very common in spoken Portuguese.`);
  }
  
  // Ficar  
  if (/\bfic(o|a|am|amos|ou|ei|ava|avam|ará|aria)\b/i.test(sent)) {
    if (engL.includes('stay') || engL.includes('remain')) {
      candidates.push(`'Ficar' here means 'to stay/remain' – but it's also used for 'to become' (ficar triste), 'to be located' (fica na rua), and 'to keep' (ficar com).`);
    } else if (engL.includes('becom') || engL.includes('get ')) {
      candidates.push(`'Ficar' + adjective means 'to become/get' – one of ficar's most common uses. It implies a change of state.`);
    }
  }
  
  // Prepositions
  if (/\bpor\b/i.test(sent) && !sentL.includes('por que') && !sentL.includes('porque')) {
    candidates.push(`'Por' indicates cause, means, or exchange – it contrasts with 'para' which indicates purpose or destination.`);
  }
  if (/\bpara\b/i.test(sent) && sent.includes('para')) {
    if (/para\s+\w+r\b/i.test(sent)) {
      candidates.push(`'Para + infinitive' expresses purpose (in order to) – one of the most common uses of 'para' in Portuguese.`);
    }
  }
  
  // Gerund
  if (/\b(\w+ando|\w+endo|\w+indo)\b/i.test(sent)) {
    const gerund = sent.match(/\b(\w+(?:ando|endo|indo))\b/i)[1];
    candidates.push(`'${gerund}' is the gerund – Brazilian Portuguese uses 'estar + gerund' for ongoing actions, while European Portuguese prefers 'estar a + infinitive'.`);
  }
  
  // Negative constructions
  if (/\bninguém\b/i.test(sent)) {
    candidates.push(`'Ninguém' (nobody) can appear before the verb without 'não', or after it with 'não': both 'ninguém falou' and 'não falou ninguém' are correct.`);
  }
  if (/\bnenhum|nenhuma\b/i.test(sent)) {
    candidates.push(`'Nenhum/nenhuma' (none/no) is a stronger negation than 'não' – it emphasizes the complete absence of something.`);
  }
  
  // Algo/alguém/algum
  if (/\b(algo|alguém|algum|alguma|alguns|algumas)\b/i.test(sent)) {
    const indef = sent.match(/\b(algo|alguém|algum|alguma)\b/i)[1];
    candidates.push(`'${indef}' is an indefinite – Portuguese distinguishes between 'algo' (something), 'alguém' (someone), and 'algum/alguma' (some + noun).`);
  }
  
  // Questions
  if (sent.includes('?')) {
    const qWord = sent.match(/\b(Onde|Quando|Como|Quanto|Quem|Qual|Quais|Por que|Porque)\b/i);
    if (qWord) {
      candidates.push(`'${qWord[1]}' starts an information question – Portuguese question word order is often flexible, but the question word typically comes first.`);
    }
  }
  
  // Complex sentence structure (high nodes)
  if (nodeNum >= 25 && sent.length > 50) {
    const clauses = sent.split(/[,;]/).length;
    if (clauses >= 3) {
      candidates.push(`This ${clauses}-clause sentence demonstrates advanced Portuguese syntax – break it at commas to identify each clause's subject and verb.`);
    }
  }
  
  // Verb tense based on node
  if (nodeNum <= 3 && /\b(sou|é|são|estou|está|estão|tenho|tem|têm|faço|faz|fazem|vou|vai|vão)\b/i.test(sent)) {
    const verb = sent.match(/\b(sou|é|são|estou|está|estão|tenho|tem|têm|faço|faz|fazem|vou|vai|vão)\b/i)[1];
    candidates.push(`'${verb}' is an irregular present tense form – the most common Portuguese verbs are irregular and must be memorized.`);
  }
  
  // Pick the best candidate (least used so far)
  if (candidates.length === 0) {
    // Fallback tips based on what we can detect
    if (sent.length > 60) {
      candidates.push(`In longer Portuguese sentences, identify the main verb first – subordinate clauses add detail but the main clause carries the core meaning.`);
    } else if (/\b(muito|mais|menos|bastante|demais|tão|tanto)\b/i.test(sent)) {
      const intens = sent.match(/\b(muito|mais|menos|bastante|demais|tão|tanto)\b/i)[1];
      candidates.push(`'${intens}' modifies intensity – Portuguese has a rich system of intensifiers that add nuance beyond simple adjectives.`);
    } else {
      candidates.push(`Word order in Portuguese is flexible but SVO (subject-verb-object) is the default – deviations signal emphasis or style.`);
    }
  }
  
  // Sort candidates by usage count (ascending) and pick the least used
  candidates.sort((a, b) => (tracker.count(a) || 0) - (tracker.count(b) || 0));
  return candidates[0];
}

// ===================== GERMAN =====================

function generateDEFixes() {
  const fixes = [];
  const tipCounts = countTips(de);
  const deWithGrammar = de.filter(c => c.grammar);
  const fixedIds = new Set();
  const tracker = new TipTracker();
  
  const repetitive = Object.entries(tipCounts)
    .filter(([t, ids]) => ids.length >= 20)
    .sort((a,b) => b[1].length - a[1].length);
  
  for (const [tip, cards] of repetitive) {
    for (const card of cards) {
      if (fixedIds.has(card.id)) continue;
      const replacement = generateDETip(card, tracker);
      if (replacement && replacement !== tip) {
        fixes.push({ id: card.id, current_tip: tip, fixed_tip: replacement, issue: 'repetitive' });
        fixedIds.add(card.id);
        tracker.use(replacement);
      }
    }
  }
  
  for (const card of deWithGrammar) {
    if (fixedIds.has(card.id)) continue;
    const issue = detectDEIssue(card);
    if (issue) {
      const replacement = generateDETip(card, tracker);
      if (replacement && replacement !== card.grammar) {
        fixes.push({ id: card.id, current_tip: card.grammar, fixed_tip: replacement, issue: issue.type });
        fixedIds.add(card.id);
        tracker.use(replacement);
      }
    }
  }
  
  return fixes;
}

function detectDEIssue(card) {
  const tip = card.grammar;
  const sent = card.target;
  const tipL = tip.toLowerCase();
  const sentL = sent.toLowerCase();
  
  // Konjunktiv tip but no Konjunktiv
  if ((tipL.includes('konjunktiv') || tipL.includes('subjunctive')) && !tipL.includes('vs')) {
    const konjForms = /\b(wäre|hätte|könnte|würde|müsste|sollte|dürfte|möchte|käme|gäbe|wüsste|ginge|fände|bräuchte|täte|sei|seien|als ob)\b/i;
    if (!konjForms.test(sent)) return { type: 'mismatch' };
  }
  
  // Passive tip but no passive
  if (tipL.includes('passiv') && !tipL.includes('vs') && !tipL.includes('aktiv')) {
    if (!/\b(wird|werden|wurde|wurden|worden|geworden)\b/i.test(sent)) return { type: 'mismatch' };
  }
  
  // Separable verb generic tip
  if (tipL.includes('separable verbs are everywhere')) {
    const endsWithPrefix = /\b(an|auf|aus|ein|mit|vor|zu|ab|weg|um|nach|her|hin|los|zurück|zusammen|teil|fest)\b[.!?]?\s*$/i;
    if (!endsWithPrefix.test(sent)) return { type: 'mismatch' };
  }
  
  // Präteritum tip but no past forms
  if ((tipL.includes('präteritum') || tipL.includes('simple past')) && !tipL.includes('vs') && !tipL.includes('perfekt') && !tipL.includes('prefer')) {
    const prätForms = /\b(war|waren|hatte|hatten|wurde|wurden|konnte|konnten|musste|wollte|sollte|durfte|ging|kam|sah|gab|nahm|sprach|fand|stand|lag|saß|lief|fuhr|flog|trug|schlief|blieb|schrieb|las|aß|trank|wusste|kannte|brachte|dachte|begann|bekam|verstand|vergaß|hielt|rief|fiel|schlug|zog|stieg|sang|bat|half|ließ|verlor|gewann)\b/i;
    if (!prätForms.test(sent)) return { type: 'mismatch' };
  }
  
  // Perfekt tip but no Perfekt
  if (tipL.includes('perfekt') && !tipL.includes('vs') && !tipL.includes('präteritum')) {
    if (!/\b(habe|hast|hat|haben|habt|bin|bist|ist|sind|seid)\b/i.test(sent) || !/\bge\w+/i.test(sent)) {
      return { type: 'mismatch' };
    }
  }
  
  // Dative tip but no dative markers
  if (tipL.includes('dativ') && !tipL.includes('vs') && !tipL.includes('akkusativ') && !tipL.includes('wechsel')) {
    const datMarkers = /\b(mit|nach|bei|seit|von|zu|aus|außer|gegenüber|zum|zur|beim|vom|mir|dir|ihm|ihr|uns|ihnen|dem|einem|meinem|seinem|ihrem|keinem|jedem|welchem)\b/i;
    if (!datMarkers.test(sent)) return { type: 'mismatch' };
  }
  
  // Genitive tip but no genitive
  if (tipL.includes('genitiv') && !tipL.includes('vs')) {
    const genMarkers = /\b(des|eines|meines|seines|ihres|unseres|wegen|trotz|während|statt|aufgrund|innerhalb|außerhalb)\b/i;
    if (!genMarkers.test(sent)) return { type: 'mismatch' };
  }
  
  // Imperative tip but no imperative
  if (tipL.includes('imperativ') && !tipL.includes('vs')) {
    const hasImp = /^(Komm|Geh|Fahr|Nimm|Gib|Sieh|Schau|Lies|Schreib|Sprich|Sag|Mach|Bring|Hol|Kauf|Iss|Trink|Schlaf|Lauf|Ruf|Steh|Sitz|Halt|Lass|Trag|Wirf|Öffne|Schließ|Dreh|Hör|Warte|Hilf|Pass|Setz|Stell|Leg|Zieh|Werd|Hab|Sei)\b/i.test(sent);
    const hasSieImp = /\b\w+en\s+Sie\b/i.test(sent);
    if (!hasImp && !hasSieImp) return { type: 'mismatch' };
  }
  
  // Conjugation table
  if (/ich \w+,\s*du \w+,\s*er \w+/i.test(tip)) return { type: 'irrelevant' };
  if (tipL.includes("'sein'") && tipL.includes('ich bin') && tipL.includes('du bist')) return { type: 'irrelevant' };
  if (tipL.includes("'haben'") && tipL.includes('ich habe') && tipL.includes('du hast') && tipL.includes('er hat')) return { type: 'irrelevant' };
  
  // Generic
  if (tip.length < 30) return { type: 'irrelevant' };
  
  return null;
}

function generateDETip(card, tracker) {
  const sent = card.target;
  const eng = card.english;
  const sentL = sent.toLowerCase();
  const engL = eng.toLowerCase();
  const node = card.grammarNode;
  const nodeNum = parseInt(node.replace('node-', ''));
  
  const candidates = [];
  
  // --- Konjunktiv II ---
  const konjForm = sent.match(/\b(wäre|hätte|könnte|würde|müsste|sollte|dürfte|möchte|käme|gäbe|wüsste|ginge|fände|bräuchte|täte)\b/i);
  if (konjForm) {
    const indicativeMap = { 'wäre': 'ist/sind', 'hätte': 'hat/haben', 'könnte': 'kann/können', 'würde': 'wird/werden', 'müsste': 'muss/müssen', 'sollte': 'soll/sollen', 'dürfte': 'darf/dürfen', 'möchte': 'mag/mögen', 'käme': 'kommt', 'gäbe': 'gibt', 'wüsste': 'weiß', 'ginge': 'geht', 'fände': 'findet', 'bräuchte': 'braucht' };
    const ind = indicativeMap[konjForm[1].toLowerCase()];
    if (ind) {
      candidates.push(`'${konjForm[1]}' is the Konjunktiv II of '${ind}' – softening the statement into a hypothetical or polite expression.`);
    }
  }
  
  // Wenn + clause
  if (/\bwenn\b/i.test(sent)) {
    if (konjForm) {
      candidates.push(`'Wenn' + Konjunktiv II creates a conditional: 'if...would' – the verb goes to the end of the wenn-clause.`);
    } else {
      candidates.push(`'Wenn' pushes the verb to the clause end – after the wenn-clause, the main clause starts with the conjugated verb (V1 inversion).`);
    }
  }
  
  // Dass
  if (/\bdass\b/i.test(sent)) {
    candidates.push(`'Dass' (that) introduces a noun clause with verb-final order – the subject often comes right after 'dass' and the verb at the very end.`);
  }
  
  // Weil
  if (/\bweil\b/i.test(sent)) {
    candidates.push(`'Weil' (because) pushes the verb to the clause end – in formal German, this verb-final rule is strict. Casual speech sometimes bends it.`);
  }
  
  // Obwohl
  if (/\bobwohl\b/i.test(sent)) {
    candidates.push(`'Obwohl' (although) introduces a concessive clause – the verb moves to the end, and the main clause follows with V2 or V1 order.`);
  }
  
  // Ob
  if (/\bob\b/i.test(sent) && engL.includes('whether') || engL.includes('if')) {
    candidates.push(`'Ob' (whether/if) introduces indirect yes/no questions – the verb goes to the end of the ob-clause.`);
  }
  
  // Nachdem
  if (/\bnachdem\b/i.test(sentL)) {
    candidates.push(`'Nachdem' (after) requires a shift in tense: the nachdem-clause uses an earlier tense than the main clause (Perfekt→Präsens, Plusquamperfekt→Präteritum).`);
  }
  
  // Bevor
  if (/\bbevor\b/i.test(sentL)) {
    candidates.push(`'Bevor' (before) sends the verb to the clause end – both clauses usually share the same tense, unlike 'nachdem'.`);
  }
  
  // Während
  if (/\bwährend\b/i.test(sentL)) {
    candidates.push(`'Während' means both 'while' (temporal) and 'whereas' (contrast) – context determines the meaning. As a conjunction, it triggers verb-final order.`);
  }
  
  // Separable verbs (prefix at end)
  const prefixAtEnd = sent.match(/\b(an|auf|aus|ein|mit|vor|zu|ab|weg|um|nach|her|hin|los|zurück|zusammen|teil|fest)\b[.!?]\s*$/i);
  if (prefixAtEnd) {
    candidates.push(`The prefix '${prefixAtEnd[1]}' at the sentence end is the separated part of the verb – in main clauses, separable prefixes always jump to the end.`);
  }
  
  // Modal verbs (specific)
  const modal = sent.match(/\b(kann|kannst|können|könnt|muss|musst|müssen|müsst|will|willst|wollen|wollt|soll|sollst|sollen|sollt|darf|darfst|dürfen|dürft|mag|magst|mögen|möchte|möchtest|möchten)\b/i);
  if (modal) {
    const modalInfs = { 'kann': 'können (can)', 'kannst': 'können (can)', 'können': 'können (can)', 'könnt': 'können (can)',
      'muss': 'müssen (must)', 'musst': 'müssen (must)', 'müssen': 'müssen (must)', 'müsst': 'müssen (must)',
      'will': 'wollen (want)', 'willst': 'wollen (want)', 'wollen': 'wollen (want)', 'wollt': 'wollen (want)',
      'soll': 'sollen (should)', 'sollst': 'sollen (should)', 'sollen': 'sollen (should)', 'sollt': 'sollen (should)',
      'darf': 'dürfen (may)', 'darfst': 'dürfen (may)', 'dürfen': 'dürfen (may)', 'dürft': 'dürfen (may)',
      'mag': 'mögen (like)', 'magst': 'mögen (like)', 'mögen': 'mögen (like)',
      'möchte': 'möchten (would like)', 'möchtest': 'möchten (would like)', 'möchten': 'möchten (would like)' };
    const infMatch = sent.match(/\b(\w+(?:en|ern|eln))\b[.!?]?\s*$/);
    if (infMatch) {
      candidates.push(`'${modal[1]}' (${modalInfs[modal[1].toLowerCase()]?.split(' ')[0] || modal[1]}) pushes '${infMatch[1]}' to the infinitive at the sentence end – the modal verb frame is a core German pattern.`);
    } else {
      const inf = modalInfs[modal[1].toLowerCase()] || modal[1];
      candidates.push(`'${modal[1]}' is from ${inf} – modal verbs take V2 position and send the main verb to the infinitive at the clause end.`);
    }
  }
  
  // Passive voice
  if (/\b(wird|werden|wurde|wurden)\b/i.test(sent) && /\bge\w+(t|en)\b/i.test(sent)) {
    const passAux = sent.match(/\b(wird|werden|wurde|wurden)\b/i)[1];
    const pp = sent.match(/\b(ge\w+(?:t|en))\b/i)[1];
    candidates.push(`'${passAux}...${pp}' forms the passive – the agent (doer) can be added with 'von + dative' but is often omitted when unknown or unimportant.`);
  }
  
  // Reflexive (specific)
  const refl = sent.match(/\b(mich|dich|sich|uns|euch)\b/i);
  if (refl) {
    // Find the verb it goes with
    const words = sent.split(/\s+/);
    const reflIdx = words.findIndex(w => w.toLowerCase().replace(/[.,!?]/g, '') === refl[1].toLowerCase());
    if (reflIdx > 0) {
      const verb = words[reflIdx - 1] || words[reflIdx + 1];
      candidates.push(`'${refl[1]}' is the reflexive pronoun for '${verb?.replace(/[.,!?]/g, '')}' – this verb requires a reflexive pronoun in German even though English often doesn't.`);
    }
  }
  
  // Comparative
  const comp = sent.match(/\b(\w+er)\s+als\b/i);
  if (comp) {
    const base = comp[1].replace(/er$/, '');
    candidates.push(`'${comp[1]} als' – comparative form. Some adjectives also take an umlaut: groß→größer, alt→älter, lang→länger.`);
  }
  
  // Two-way prepositions with case detection
  const twoWayPreps = { 'in': 'in', 'an': 'at/on', 'auf': 'on', 'über': 'over/about', 'unter': 'under', 'vor': 'in front of/before', 'hinter': 'behind', 'neben': 'next to', 'zwischen': 'between' };
  for (const [prep, meaning] of Object.entries(twoWayPreps)) {
    const prepRegex = new RegExp(`\\b${prep}\\b`, 'i');
    if (prepRegex.test(sent)) {
      if (/\b(dem|einem|meinem|seinem|ihrem|keinem|jedem)\b/i.test(sent)) {
        candidates.push(`'${prep}' (${meaning}) + dative here = location/state. With accusative it would mean movement toward. The case makes all the difference.`);
      } else if (/\b(den|einen|meinen|seinen|ihren|keinen|jeden)\b/i.test(sent)) {
        candidates.push(`'${prep}' (${meaning}) + accusative here = direction/movement. With dative it would indicate static location.`);
      }
      break;
    }
  }
  
  // Dative prepositions
  const datPreps = { 'mit': 'with', 'nach': 'after/to', 'bei': 'at/near', 'seit': 'since', 'von': 'from/of', 'zu': 'to', 'aus': 'from/out of', 'außer': 'except', 'gegenüber': 'opposite' };
  for (const [prep, meaning] of Object.entries(datPreps)) {
    const regex = new RegExp(`\\b${prep}\\b`, 'i');
    if (regex.test(sent)) {
      candidates.push(`'${prep}' (${meaning}) always governs the dative – the noun/pronoun that follows must show dative endings.`);
      break;
    }
  }
  
  // Accusative prepositions
  const accPreps = { 'durch': 'through', 'für': 'for', 'gegen': 'against', 'ohne': 'without', 'um': 'around/at' };
  for (const [prep, meaning] of Object.entries(accPreps)) {
    const regex = new RegExp(`\\b${prep}\\b`, 'i');
    if (regex.test(sent)) {
      candidates.push(`'${prep}' (${meaning}) always takes the accusative – no exceptions to this rule.`);
      break;
    }
  }
  
  // Genitive
  const genMatch = sent.match(/\b(des|eines)\s+(\w+(?:s|es))\b/i);
  if (genMatch) {
    candidates.push(`'${genMatch[0]}' shows genitive case – indicating possession. Masculine/neuter nouns add -s or -es in genitive.`);
  }
  
  // Perfekt with haben
  if (/\b(habe|hast|hat|haben|habt)\b/i.test(sent) && /\b(ge\w+(?:t|en))\b/i.test(sent)) {
    const pp = sent.match(/\b(ge\w+(?:t|en))\b/i)[1];
    candidates.push(`Perfekt: 'haben' + '${pp}' at the clause end – this is the standard way to talk about the past in spoken German.`);
  }
  
  // Perfekt with sein
  if (/\b(bin|bist|ist|sind|seid)\b/i.test(sent) && /\b(ge\w+en)\b/i.test(sent)) {
    const pp = sent.match(/\b(ge\w+en)\b/i)[1];
    candidates.push(`Perfekt with 'sein' + '${pp}' – verbs of motion (gehen, kommen) or change of state (werden, sterben) use 'sein' instead of 'haben'.`);
  }
  
  // Präteritum sein/haben
  if (/\b(war|waren)\b/i.test(sent) && !sentL.includes('wurde')) {
    candidates.push(`'War/waren' (was/were) is Präteritum of 'sein' – one of the few verbs where simple past is preferred over Perfekt in everyday speech.`);
  }
  if (/\b(hatte|hatten)\b/i.test(sent)) {
    candidates.push(`'Hatte/hatten' is Präteritum of 'haben' – like 'sein' and the modals, 'haben' commonly uses Präteritum even in spoken German.`);
  }
  
  // Relative clauses
  const relClause = sent.match(/,\s*(der|die|das|den|dem|dessen|deren|denen)\s+/i);
  if (relClause) {
    const caseMap = { 'der': 'nominative masculine', 'die': 'nominative feminine/plural', 'das': 'nominative neuter', 'den': 'accusative masculine', 'dem': 'dative', 'dessen': 'genitive masculine/neuter', 'deren': 'genitive feminine/plural', 'denen': 'dative plural' };
    candidates.push(`'${relClause[1]}' introduces a relative clause (${caseMap[relClause[1].toLowerCase()] || relClause[1]}) – its case depends on its role within the relative clause, not the main clause.`);
  }
  
  // Um...zu
  if (/\bum\b.*\bzu\b.*\b\w+en\b/i.test(sent)) {
    candidates.push(`'Um...zu + infinitive' expresses purpose (in order to) – 'zu' sits directly before the infinitive, splitting separable verbs: 'um ein|zu|kaufen'.`);
  }
  
  // Negation
  if (/\bnicht\b/i.test(sent)) {
    if (/\bnicht\b.*\b\w+en\b[.!?]?\s*$/i.test(sent)) {
      candidates.push(`'Nicht' comes before the infinitive/participle/prefix at the sentence end – its position follows a predictable pattern in German clause structure.`);
    } else {
      candidates.push(`'Nicht' negates the element that follows it – placement is key: before adjectives, adverbs, and prepositional phrases.`);
    }
  }
  if (/\b(kein|keine|keinen|keinem|keiner|keines)\b/i.test(sent)) {
    const kein = sent.match(/\b(kein|keine|keinen|keinem|keiner|keines)\b/i)[1];
    candidates.push(`'${kein}' negates the noun directly (like 'not a/no') – it takes the same endings as 'ein' and replaces the indefinite article.`);
  }
  
  // Questions
  if (sent.includes('?')) {
    const qWord = sent.match(/^(Wer|Was|Wo|Wann|Warum|Wie|Welch\w*|Wessen|Wem|Wen|Wohin|Woher|Worüber|Wofür|Woran|Worauf|Worin|Womit)\b/i);
    if (qWord) {
      candidates.push(`'${qWord[1]}' starts a W-question – the verb follows in second position (V2), just like in statements.`);
    } else if (/^[A-ZÄÖÜ]/.test(sent)) {
      const firstWord = sent.match(/^(\w+)/)[1];
      if (/^(Ist|Sind|Hat|Haben|Kann|Muss|Will|Soll|Darf|Wird|Werden|War|Hatte|Konnte|Musste|Wollte|Sollte|Durfte|Hast|Bist|Habt|Seid|Möchtest|Möchten|Dürft)\b/i.test(sent)) {
        candidates.push(`Yes/no questions start with the verb (V1) – '${firstWord}' leads because German doesn't use an auxiliary like English 'do'.`);
      }
    }
  }
  
  // Compound nouns
  const longNoun = sent.match(/\b([A-ZÄÖÜ]\w{11,})\b/);
  if (longNoun) {
    candidates.push(`'${longNoun[1]}' is a compound noun – German joins nouns freely. The last element determines gender and the first elements modify meaning.`);
  }
  
  // Adjective endings
  const adjEnd = sent.match(/\b(der|die|das|dem|den|des|ein|eine|einem|einer|eines|einen)\s+(\w+(?:e|er|es|en|em))\s+([A-ZÄÖÜ]\w+)\b/);
  if (adjEnd) {
    candidates.push(`The adjective '${adjEnd[2]}' takes its ending from the article type and case – after definite articles, adjectives usually end in -e or -en.`);
  }
  
  // Es gibt
  if (/\bes gibt\b/i.test(sentL)) {
    candidates.push(`'Es gibt' (there is/are) always takes accusative – the thing that 'exists' is the accusative object, not the subject.`);
  }
  
  // Imperative
  if (/^(Komm|Geh|Fahr|Nimm|Gib|Sieh|Schau|Lies|Schreib|Sprich|Sag|Mach|Bring|Hol|Kauf|Iss|Trink|Schlaf|Lauf|Ruf|Steh|Sitz|Halt|Lass|Trag|Wirf|Öffne|Schließ|Dreh|Hör|Warte|Hilf|Pass|Setz|Stell|Leg|Zieh|Werd|Hab|Sei)\b/i.test(sent)) {
    const impVerb = sent.match(/^(\w+)/)[1];
    candidates.push(`'${impVerb}!' – du-imperative. Strong verbs with e→i change keep it (gib!, nimm!, lies!), but e→ie verbs don't (sieh, not *sieh).`);
  }
  
  // V2 rule
  if (nodeNum <= 5) {
    const words = sent.split(/\s+/);
    if (words.length >= 3 && !sent.includes('?')) {
      candidates.push(`The verb sits in second position – even when a time/place expression starts the sentence, the verb stays second and the subject moves after it.`);
    }
  }
  
  // Fallback
  if (nodeNum >= 25 && sent.length > 60) {
    const clauses = sent.split(/[,;]/).length;
    candidates.push(`This ${clauses}-clause sentence shows advanced German syntax – find the V2 verb in the main clause first, then decode each subordinate clause.`);
  }
  
  if (candidates.length === 0) {
    if (sent.length > 60) {
      candidates.push(`Complex German sentences nest clauses – identify the main verb in V2 position to find the sentence's core meaning.`);
    } else {
      candidates.push(`German word order is more fixed than it seems – the verb position (V2 in main clauses, V-final in subordinates) is the key structural anchor.`);
    }
  }
  
  candidates.sort((a, b) => (tracker.count(a) || 0) - (tracker.count(b) || 0));
  return candidates[0];
}

// ==================== MAIN ====================

console.log('Generating fixes...');
const ptFixes = generatePTFixes();
const deFixes = generateDEFixes();

const outDir = path.join(__dirname, 'output');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

fs.writeFileSync(path.join(outDir, 'pt-tip-fixes.json'), JSON.stringify(ptFixes, null, 2));
fs.writeFileSync(path.join(outDir, 'de-tip-fixes.json'), JSON.stringify(deFixes, null, 2));

// Summary
console.log('\n=== PORTUGUESE ===');
console.log('Total checked:', pt.filter(c => c.grammar).length);
console.log('Total flagged:', ptFixes.length);
const ptByType = {};
for (const f of ptFixes) ptByType[f.issue] = (ptByType[f.issue] || 0) + 1;
console.log('Breakdown:', JSON.stringify(ptByType));

// Check replacement tip diversity
const ptRepTips = {};
for (const f of ptFixes) { ptRepTips[f.fixed_tip] = (ptRepTips[f.fixed_tip] || 0) + 1; }
const ptDupes = Object.entries(ptRepTips).filter(([t,c]) => c >= 10).sort((a,b) => b[1]-a[1]);
console.log('Replacement tips used 10+ times:', ptDupes.length);
for (const [t,c] of ptDupes.slice(0,5)) console.log(`  [${c}x] ${t.substring(0,80)}`);

console.log('\n=== GERMAN ===');
console.log('Total checked:', de.filter(c => c.grammar).length);
console.log('Total flagged:', deFixes.length);
const deByType = {};
for (const f of deFixes) deByType[f.issue] = (deByType[f.issue] || 0) + 1;
console.log('Breakdown:', JSON.stringify(deByType));

const deRepTips = {};
for (const f of deFixes) { deRepTips[f.fixed_tip] = (deRepTips[f.fixed_tip] || 0) + 1; }
const deDupes = Object.entries(deRepTips).filter(([t,c]) => c >= 10).sort((a,b) => b[1]-a[1]);
console.log('Replacement tips used 10+ times:', deDupes.length);
for (const [t,c] of deDupes.slice(0,5)) console.log(`  [${c}x] ${t.substring(0,80)}`);
