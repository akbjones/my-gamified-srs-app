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

class TipTracker {
  constructor() { this.counts = {}; }
  use(tip) { this.counts[tip] = (this.counts[tip] || 0) + 1; return this.counts[tip]; }
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
      if (replacement && replacement !== tip && tracker.count(replacement) < 8) {
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
      if (replacement && replacement !== card.grammar && tracker.count(replacement) < 8) {
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
  
  // Subjunctive tip but no subjunctive
  if ((tipL.includes('subjuntivo') || tipL.includes('subjunctive')) && !tipL.includes('vs') && !tipL.includes('contrast')) {
    const subjForms = /\b(seja|sejam|tenha|tenham|faça|façam|vá|vão|dê|deem|esteja|estejam|possa|possam|saiba|saibam|queira|haja|fosse|fossem|tivesse|tivessem|fizesse|pudesse|soubesse|quisesse|houvesse|estivesse)\b/i;
    if (!subjForms.test(sent) && !/\b(embora|talvez|oxalá|caso|mesmo que|a menos que|sem que|é bom que|quero que|espero que|duvido que)\b/i.test(sent)) {
      return { type: 'mismatch' };
    }
  }
  
  if (tipL.includes("'seja'") && !sentL.includes('seja') && !sentL.includes('sejam')) return { type: 'mismatch' };
  
  // Perfeito tip on present sentence
  if ((tipL.includes('pretérito perfeito') || (tipL.includes('perfeito') && !tipL.includes('imperfeito') && !tipL.includes('mais-que'))) && !tipL.includes('vs') && !tipL.includes('choose') && !tipL.includes('contrast')) {
    const pastVerbs = /\b(foi|fui|esteve|estive|teve|tive|fez|fiz|disse|quis|soube|pôde|deu|dei|veio|vim|trouxe|houve|pôs|vi|viu|ouviu|comprou|vendeu|pagou|trabalhou|estudou|falou|viajou|chegou|voltou|ficou|começou|terminou|aconteceu|nasceu|morreu|cresceu|conheceu|abriu|fechou|comeu|bebeu|dormiu|saiu|entrou)\b/i;
    const engPast = /\b(was|were|did|had|went|came|got|made|said|told|gave|took|saw|knew|found|thought|heard|left|felt|became|started)\b/i;
    if (!pastVerbs.test(sent) && !engPast.test(eng)) return { type: 'mismatch' };
  }
  
  // Conditional tip but no conditional
  if ((tipL.includes('condicional') || tipL.includes('conditional')) && !tipL.includes('vs') && !tipL.includes('pairs with')) {
    if (!/\b\w+(aria|arias|aríamos|ariam|eria|erias|eríamos|eriam|iria|irias|iríamos|iriam)\b/i.test(sent)) return { type: 'mismatch' };
  }
  
  // Imperative tip but not imperative
  if (tipL.includes('imperativ') && !tipL.includes('vs')) {
    if (!/^(faz|faça|vai|vá|vem|venha|diz|diga|fala|fale|olha|olhe|para|pare|come|coma|abre|abra|fecha|feche|espera|espere|lê|leia|escreve|escreva|toma|tome|pega|pegue|liga|não )/i.test(sent)) return { type: 'mismatch' };
  }
  
  // Pluperfect tip without pluperfect
  if ((tipL.includes('mais-que-perfeito') || tipL.includes('pluperfect')) && !tipL.includes('vs')) {
    if (!/\b(tinha|tínhamos|tinham)\b/i.test(sent) && !/\b\w+[aeiou]ra\b/i.test(sent)) return { type: 'mismatch' };
  }
  
  // Future subjunctive tip without forms
  if (tipL.includes('futuro do subjuntivo') || tipL.includes('future subjunctive')) {
    if (!/\b(for|fizer|estiver|tiver|puder|souber|quiser|vier|trouxer|puser|disser|houver)\b/i.test(sent)) return { type: 'mismatch' };
  }
  
  if (/eu \w+,\s*tu \w+,\s*ele \w+/i.test(tip)) return { type: 'irrelevant' };
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
  
  const candidates = [];
  
  // Subjunctive triggers
  const subjTrigger = sent.match(/\b(embora|talvez|oxalá|caso|mesmo que|a menos que|sem que|antes que|para que|desde que|até que)\b/i);
  if (subjTrigger) candidates.push(`'${subjTrigger[1]}' always triggers the subjunctive – it signals uncertainty or a condition that may not be real.`);
  
  // Emotion/desire + subjunctive
  const emotionSubj = sent.match(/\b(quero que|espero que|duvido que|é bom que|é importante que|é necessário que|lamento que|sinto que|prefiro que|é possível que|é provável que|não acredito que)\b/i);
  if (emotionSubj) candidates.push(`'${emotionSubj[1]}' requires the subjunctive – expressions of desire, doubt, or emotion always trigger it.`);
  
  // Se + imperfect subjunctive
  const seImpSubj = sent.match(/\bse\b.*?\b(fosse|tivesse|pudesse|soubesse|quisesse|fizesse|viesse|houvesse|estivesse|morasse|trabalhasse|falasse|comprasse|vendesse|dormisse|ficasse|precisasse|existisse|ganhasse|perdesse|mudasse|acabasse|começasse|chovesse|acontecesse|surgisse|vivesse|saísse|desse|dissesse|trouxesse|pusesse|visse|ouvisse|sentisse|pedisse|seguisse|servisse|coubesse|valesse)\b/i);
  if (seImpSubj) candidates.push(`'Se + ${seImpSubj[1]}' creates a contrary-to-fact condition – the main clause uses the conditional to complete the hypothesis.`);
  
  // Specific conditional verbs
  const condVerb = sent.match(/\b(gostaria|poderia|deveria|faria|seria|teria|diria|viria|ficaria|daria|levaria|tomaria|precisaria|conseguiria|compraria|venderia|escreveria|leria|dormiria|comeria|beberia|sairia|voltaria|começaria|terminaria|trabalharia|estudaria|moraria|viajaria|pagaria|iria|estaria|saberia|veria|ouviria|pediria|sentiria|correria|abriria|fecharia|mudaria|pensaria|ligaria|mandaria|deixaria|aceitaria|recusaria|permitiria|proibiria)\b/i);
  if (condVerb) candidates.push(`'${condVerb[1]}' – conditional tense, expressing what would happen. Note the characteristic -ia ending added to the infinitive stem.`);
  
  // Future subjunctive forms
  const futSubj = sent.match(/\b(for|fizer|estiver|tiver|puder|souber|quiser|vier|trouxer|puser|disser|houver)\b/i);
  if (futSubj) candidates.push(`'${futSubj[1]}' – future subjunctive, used after 'quando', 'se', 'enquanto' for events that may happen. Unique to Portuguese among Romance languages.`);
  
  // Personal infinitive
  const persInf = sent.match(/\b(\w+r)(mos|em)\b/i);
  if (persInf && nodeNum > 10) candidates.push(`'${persInf[0]}' is a personal infinitive – conjugating the infinitive for person. This uniquely Portuguese form often replaces subjunctive clauses.`);
  
  // Ir + infinitive
  const irInf = sent.match(/\b(vou|vai|vamos|vão)\s+(\w+r)\b/i);
  if (irInf) candidates.push(`'${irInf[1]} + ${irInf[2]}' – the informal future, far more common in speech than the simple future (-ei, -á, -emos, -ão).`);
  
  // Literary pluperfect
  if (nodeNum >= 27) {
    const raForm = sent.match(/\b(\w{4,}[aeiou]ra)\b/i);
    const exceptions = ['agora', 'embora', 'ainda', 'hora', 'outra', 'primeira', 'sequer', 'para', 'cara', 'rara', 'clara', 'pura', 'cura', 'futura', 'estrutura', 'cultura', 'natura', 'figura', 'procura'];
    if (raForm && !exceptions.includes(raForm[1].toLowerCase())) {
      candidates.push(`'${raForm[1]}' – literary simple pluperfect (-ra ending). In modern speech, 'tinha + participle' is the norm.`);
    }
  }
  
  // Relative pronouns
  const relCujo = sent.match(/\b(cujo|cuja|cujos|cujas)\b/i);
  if (relCujo) candidates.push(`'${relCujo[1]}' (whose) agrees in gender/number with the possessed noun, not the possessor – one of the trickiest Portuguese connectors.`);
  
  const relQuem = sent.match(/\b(com quem|para quem|de quem|por quem|a quem|em quem)\b/i);
  if (relQuem) candidates.push(`'${relQuem[1]}' – preposition + 'quem' for people in relative clauses. The preposition must come before the relative pronoun.`);
  
  // Passive se (impersonal)
  const passiveSe = sent.match(/\bse\s+(pode|deve|precisa|consegue|faz|diz|sabe|fala|vende|compra|come|vê|ouve|usa|pensa|acredita|imagina|espera|procura|encontra|nota|percebe|observa|trata|admite|supõe|pressupõe|sustenta|mantém|considera)\b/i);
  if (passiveSe) candidates.push(`'Se ${passiveSe[1]}' – impersonal construction with 'se', expressing a general statement about what 'one does' or 'is done'.`);
  
  const enclitSe = sent.match(/\b(\w+)-se\b/i);
  if (enclitSe && !passiveSe) candidates.push(`'${enclitSe[1]}-se' – the enclitic '-se' can be reflexive or impersonal/passive depending on context.`);
  
  // Diminutives
  const dim = sent.match(/\b(\w+(?:inho|inha|inhos|inhas|zinho|zinha|zinhos|zinhas))\b/i);
  if (dim) candidates.push(`'${dim[1]}' – diminutive suffix expressing smallness, affection, or informality, not just physical size.`);
  
  // Contractions (specific to this sentence)
  const cList = [
    ['do', 'de+o'], ['da', 'de+a'], ['dos', 'de+os'], ['das', 'de+as'],
    ['no', 'em+o'], ['na', 'em+a'], ['nos', 'em+os'], ['nas', 'em+as'],
    ['ao', 'a+o'], ['à', 'a+a'], ['aos', 'a+os'], ['às', 'a+as'],
    ['pelo', 'por+o'], ['pela', 'por+a'], ['pelos', 'por+os'], ['pelas', 'por+as'],
    ['num', 'em+um'], ['numa', 'em+uma']
  ];
  for (const [form, exp] of cList) {
    if (new RegExp(`\\b${form}\\b`, 'i').test(sent)) {
      candidates.push(`'${form}' contracts ${exp} – mandatory in Portuguese, these preposition+article fusions are never written separately.`);
      break;
    }
  }
  
  // Ser vs estar (with context)
  if (/\b(é|são|somos|sou)\b/i.test(sent) && !sentL.includes('está') && !sentL.includes('estou')) {
    const f = sent.match(/\b(é|são|somos|sou)\b/i)[1];
    candidates.push(`'${f}' (ser) – for permanent qualities, identity, origin. Using estar would imply a temporary state.`);
  }
  if (/\b(está|estou|estamos|estão)\b/i.test(sent) && !sentL.includes(' é ') && !sentL.includes(' são ')) {
    const f = sent.match(/\b(está|estou|estamos|estão)\b/i)[1];
    candidates.push(`'${f}' (estar) – marks a temporary condition, emotion, or location. Ser would imply permanence.`);
  }
  
  // Ter que/de
  if (/\b(tenho|tem|temos|têm)\s+(que|de)\b/i.test(sent)) {
    candidates.push(`'Ter que/de + infinitive' – obligation (have to), more colloquial than 'dever' and standard in spoken Portuguese.`);
  }
  
  // Ficar
  const ficarMatch = sent.match(/\bfic(o|a|am|amos|ou|ei|ava|avam|ará|aria|asse|assem)\b/i);
  if (ficarMatch) {
    if (engL.includes('stay') || engL.includes('remain')) candidates.push(`'Ficar' here means 'to stay/remain' – one of its many meanings alongside 'to become', 'to be located', and 'to keep'.`);
    else if (engL.includes('becom') || engL.includes('get ')) candidates.push(`'Ficar' + adjective = 'to become/get' – implies a change of state, very frequent in everyday Portuguese.`);
    else candidates.push(`'Ficar' is multi-purpose: stay, become, be located, keep – context determines which meaning applies here.`);
  }
  
  // Por vs para
  if (/\bpor\b/i.test(sent) && !sentL.includes('por que') && !sentL.includes('porque') && !sentL.includes('por favor')) {
    candidates.push(`'Por' indicates cause, means, or exchange – contrast with 'para' which signals purpose or destination.`);
  }
  if (/\bpara\s+\w+r\b/i.test(sent)) candidates.push(`'Para + infinitive' expresses purpose (in order to) – one of the most frequent constructions in Portuguese.`);
  
  // Gerund
  const gerund = sent.match(/\b(\w+(?:ando|endo|indo))\b/i);
  if (gerund) candidates.push(`'${gerund[1]}' – gerund form for ongoing action. Brazilian Portuguese prefers 'estar + gerund' over European Portuguese's 'estar a + infinitive'.`);
  
  // Negative pronouns
  if (/\bninguém\b/i.test(sent)) candidates.push(`'Ninguém' (nobody) – can precede the verb alone or follow it with 'não': both are grammatical.`);
  if (/\b(nenhum|nenhuma)\b/i.test(sent)) candidates.push(`'Nenhum/nenhuma' (none/not any) – stronger than simple 'não', emphasizing complete absence.`);
  
  // Onde as relative
  if (/\bonde\b/i.test(sent) && (engL.includes('where') || engL.includes('place'))) {
    candidates.push(`'Onde' introduces a relative clause about places – use 'aonde' with verbs of motion (ir, levar) for 'to where'.`);
  }
  
  // Segundo o qual, etc.
  if (/\b(segundo o qual|segundo a qual|no qual|na qual|pelo qual|pela qual|do qual|da qual)\b/i.test(sent)) {
    const form = sent.match(/\b(segundo o qual|segundo a qual|no qual|na qual|pelo qual|pela qual|do qual|da qual)\b/i)[1];
    candidates.push(`'${form}' – a formal relative construction. 'O qual/a qual' agrees with the antecedent in gender and is used after prepositions.`);
  }
  
  // Questions
  if (sent.includes('?')) {
    const qWord = sent.match(/\b(Onde|Quando|Como|Quanto|Quem|Qual|Quais)\b/i);
    if (qWord) candidates.push(`'${qWord[1]}' starts an information question – Portuguese question word order is flexible, but the question word typically leads.`);
  }
  
  // Complex clauses (high nodes)
  if (nodeNum >= 25 && sent.length > 60) {
    const clauses = sent.split(/[,;]/).length;
    if (clauses >= 3) candidates.push(`This ${clauses}-clause sentence shows advanced syntax – identify each clause's subject and verb at commas to parse the structure.`);
  }
  
  // Irregular present tense
  if (nodeNum <= 3) {
    const irregPres = sent.match(/\b(sou|é|são|estou|está|estão|tenho|tem|têm|faço|faz|fazem|vou|vai|vão|sei|sabe|sabem|dou|dá|dão|posso|pode|podem|quero|quer|querem|venho|vem|vêm|ponho|põe|põem|digo|diz|dizem|trago|traz|trazem|ouço|ouve|ouvem|peço|pede|pedem|perco|perde|perdem|durmo|dorme|dormem|sigo|segue|seguem|minto|mente|mentem|sinto|sente|sentem|sirvo|serve|servem)\b/i);
    if (irregPres) candidates.push(`'${irregPres[1]}' – irregular present tense. The most common Portuguese verbs are irregular and must be memorized individually.`);
  }
  
  // Pick least-used candidate, but ONLY if count < 8
  candidates.sort((a, b) => (tracker.count(a) || 0) - (tracker.count(b) || 0));
  for (const c of candidates) {
    if (tracker.count(c) < 8) return c;
  }
  
  // If all candidates are overused, return null (don't fix this card)
  return null;
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
      if (replacement && replacement !== tip && tracker.count(replacement) < 8) {
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
      if (replacement && replacement !== card.grammar && tracker.count(replacement) < 8) {
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
  
  if ((tipL.includes('konjunktiv') || tipL.includes('subjunctive')) && !tipL.includes('vs')) {
    if (!/\b(wäre|hätte|könnte|würde|müsste|sollte|dürfte|möchte|käme|gäbe|wüsste|ginge|fände|bräuchte|täte|sei|seien|als ob)\b/i.test(sent)) return { type: 'mismatch' };
  }
  
  if (tipL.includes('passiv') && !tipL.includes('vs') && !tipL.includes('aktiv')) {
    if (!/\b(wird|werden|wurde|wurden|worden|geworden)\b/i.test(sent)) return { type: 'mismatch' };
  }
  
  if (tipL.includes('separable verbs are everywhere')) {
    if (!/\b(an|auf|aus|ein|mit|vor|zu|ab|weg|um|nach|her|hin|los|zurück|zusammen|teil|fest)\b[.!?]?\s*$/i.test(sent)) return { type: 'mismatch' };
  }
  
  if ((tipL.includes('präteritum') || tipL.includes('simple past')) && !tipL.includes('vs') && !tipL.includes('perfekt') && !tipL.includes('prefer')) {
    if (!/\b(war|waren|hatte|hatten|wurde|wurden|konnte|konnten|musste|wollte|sollte|durfte|ging|kam|sah|gab|nahm|sprach|fand|stand|lag|saß|lief|fuhr|flog|trug|schlief|blieb|schrieb|las|aß|trank|wusste|kannte|brachte|dachte|begann|bekam|verstand|vergaß|hielt|rief|fiel|schlug|zog|stieg|sang|bat|half|ließ|verlor|gewann)\b/i.test(sent)) return { type: 'mismatch' };
  }
  
  if (tipL.includes('perfekt') && !tipL.includes('vs') && !tipL.includes('präteritum')) {
    if (!/\b(habe|hast|hat|haben|habt|bin|bist|ist|sind|seid)\b/i.test(sent) || !/\bge\w+/i.test(sent)) return { type: 'mismatch' };
  }
  
  if (tipL.includes('dativ') && !tipL.includes('vs') && !tipL.includes('akkusativ') && !tipL.includes('wechsel')) {
    if (!/\b(mit|nach|bei|seit|von|zu|aus|außer|gegenüber|zum|zur|beim|vom|mir|dir|ihm|ihr|uns|ihnen|dem|einem|meinem|seinem|ihrem|keinem|jedem|welchem)\b/i.test(sent)) return { type: 'mismatch' };
  }
  
  if (tipL.includes('genitiv') && !tipL.includes('vs')) {
    if (!/\b(des|eines|meines|seines|ihres|unseres|wegen|trotz|während|statt|aufgrund|innerhalb|außerhalb)\b/i.test(sent)) return { type: 'mismatch' };
  }
  
  if (tipL.includes('imperativ') && !tipL.includes('vs')) {
    const hasImp = /^(Komm|Geh|Fahr|Nimm|Gib|Sieh|Schau|Lies|Schreib|Sprich|Sag|Mach|Bring|Hol|Kauf|Iss|Trink|Schlaf|Lauf|Ruf|Steh|Sitz|Halt|Lass|Trag|Wirf|Öffne|Schließ|Dreh|Hör|Warte|Hilf|Pass|Setz|Stell|Leg|Zieh|Werd|Hab|Sei)\b/i.test(sent);
    const hasSieImp = /\b\w+en\s+Sie\b/i.test(sent);
    if (!hasImp && !hasSieImp) return { type: 'mismatch' };
  }
  
  if (/ich \w+,\s*du \w+,\s*er \w+/i.test(tip)) return { type: 'irrelevant' };
  if (tipL.includes("'sein'") && tipL.includes('ich bin') && tipL.includes('du bist')) return { type: 'irrelevant' };
  if (tipL.includes("'haben'") && tipL.includes('ich habe') && tipL.includes('du hast') && tipL.includes('er hat')) return { type: 'irrelevant' };
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
  
  // Konjunktiv II
  const konjForm = sent.match(/\b(wäre|hätte|könnte|würde|müsste|sollte|dürfte|möchte|käme|gäbe|wüsste|ginge|fände|bräuchte|täte)\b/i);
  if (konjForm) {
    const map = { 'wäre': 'sein (ist)', 'hätte': 'haben (hat)', 'könnte': 'können (kann)', 'würde': 'werden (wird)', 'müsste': 'müssen (muss)', 'sollte': 'sollen (soll)', 'dürfte': 'dürfen (darf)', 'möchte': 'mögen (mag)', 'käme': 'kommen (kommt)', 'gäbe': 'geben (gibt)', 'wüsste': 'wissen (weiß)', 'ginge': 'gehen (geht)', 'fände': 'finden (findet)', 'bräuchte': 'brauchen (braucht)' };
    candidates.push(`'${konjForm[1]}' – Konjunktiv II of ${map[konjForm[1].toLowerCase()] || konjForm[1]}, softening this into a hypothetical or polite expression.`);
  }
  
  // Wenn
  if (/\bwenn\b/i.test(sent)) {
    if (konjForm) candidates.push(`'Wenn' + Konjunktiv II creates a conditional ('if...would') – the verb goes to the end of the wenn-clause.`);
    else candidates.push(`'Wenn' (if/when) sends the verb to the clause end – the main clause then starts with the verb (inversion).`);
  }
  
  // Subordinating conjunctions
  if (/\bdass\b/i.test(sent)) candidates.push(`'Dass' (that) introduces a noun clause – verb goes to the end. Often replaceable by dropping 'dass' and using V2 order.`);
  if (/\bweil\b/i.test(sent)) candidates.push(`'Weil' (because) triggers verb-final order in the subordinate clause – in formal style, the rule is strict.`);
  if (/\bobwohl\b/i.test(sent)) candidates.push(`'Obwohl' (although) – concessive subordinate clause with verb-final order, signaling a contrast between expectation and reality.`);
  if (/\bob\b/i.test(sent) && (engL.includes('whether') || engL.includes('if'))) candidates.push(`'Ob' (whether/if) introduces an indirect yes/no question – verb goes to the clause end.`);
  if (/\bnachdem\b/i.test(sentL)) candidates.push(`'Nachdem' (after) requires tense shift: nachdem-clause uses an earlier tense (Perfekt→Präsens, Plusquamperfekt→Präteritum).`);
  if (/\bbevor\b/i.test(sentL)) candidates.push(`'Bevor' (before) – subordinating conjunction with verb-final. Both clauses usually share the same tense.`);
  if (/\bwährend\b/i.test(sentL)) candidates.push(`'Während' (while/whereas) – dual meaning: temporal (simultaneous) or contrastive (whereas). Context determines which.`);
  if (/\bseitdem\b/i.test(sentL)) candidates.push(`'Seitdem' (since then/ever since) – verb goes to the clause end, referring to an action that has continued since a past point.`);
  if (/\bsobald\b/i.test(sentL)) candidates.push(`'Sobald' (as soon as) – subordinating conjunction pushing the verb to clause end. Often pairs with Perfekt in the sobald-clause.`);
  if (/\bindem\b/i.test(sentL)) candidates.push(`'Indem' (by doing) – expresses the means or method. Verb goes to the clause end.`);
  if (/\bals\b/i.test(sent) && !sent.includes(' als ')) {
    // als at start = when (past single event)
    if (/^Als\b/i.test(sent)) candidates.push(`'Als' (when – for past single events) sends the verb to the clause end. Use 'wenn' for repeated or future events.`);
  }
  
  // Separable verbs
  const pfxEnd = sent.match(/\b(an|auf|aus|ein|mit|vor|zu|ab|weg|um|nach|her|hin|los|zurück|zusammen|teil|fest)\b[.!?]\s*$/i);
  if (pfxEnd) candidates.push(`Prefix '${pfxEnd[1]}' at the end – the separable verb splits in main clauses, with the prefix jumping to the sentence end.`);
  
  // Modal verbs
  const modal = sent.match(/\b(kann|kannst|können|könnt|muss|musst|müssen|müsst|will|willst|wollen|wollt|soll|sollst|sollen|sollt|darf|darfst|dürfen|dürft|mag|magst|mögen|möchte|möchtest|möchten)\b/i);
  if (modal && !konjForm) {
    const infMatch = sent.match(/\b(\w+(?:en|ern|eln))\b[.!?]?\s*$/);
    if (infMatch) {
      candidates.push(`'${modal[1]}' (modal) pushes '${infMatch[1]}' to the infinitive at the sentence end – the modal verb frame is fundamental to German.`);
    }
  }
  
  // Passive
  if (/\b(wird|werden|wurde|wurden)\b/i.test(sent) && /\bge\w+(t|en)\b/i.test(sent)) {
    const pp = sent.match(/\b(ge\w+(?:t|en))\b/i)[1];
    candidates.push(`Passive construction: 'werden + ${pp}' – focus shifts from the doer to the action. Agent can be added with 'von + dative'.`);
  }
  
  // Reflexive
  const refl = sent.match(/\b(mich|dich|sich|uns|euch)\b/i);
  if (refl) {
    // Try to find the associated verb
    const words = sent.split(/\s+/).map(w => w.replace(/[.,!?]/g, ''));
    const rIdx = words.findIndex(w => w.toLowerCase() === refl[1].toLowerCase());
    // The verb is usually right before or 1-2 positions before
    let verb = null;
    for (let i = Math.max(0, rIdx-2); i <= Math.min(words.length-1, rIdx+2); i++) {
      if (i !== rIdx && /^[a-zäöü]/i.test(words[i]) && words[i].length > 2 && !/^(mich|dich|sich|uns|euch|ich|du|er|sie|es|wir|ihr|nicht|auch|noch|schon|sehr|ganz|immer|heute|morgen|gestern|hier|dort|jetzt|dann|aber|und|oder|denn|dass|weil|wenn|ob|als|so|da|doch|mal|nur|gut|gern|oft|leider|wirklich|eigentlich|natürlich|vielleicht)$/i.test(words[i])) {
        verb = words[i]; break;
      }
    }
    if (verb) candidates.push(`'${refl[1]}' – reflexive pronoun for '${verb}'. German requires it even when English doesn't (e.g., 'sich freuen' = 'to be happy').`);
    else candidates.push(`'${refl[1]}' – reflexive pronoun. Many German verbs are inherently reflexive where English equivalents aren't.`);
  }
  
  // Comparative
  const compMatch = sent.match(/\b(\w+er)\s+als\b/i);
  if (compMatch) candidates.push(`'${compMatch[1]} als' – comparative. Some adjectives also umlaut: groß→größer, alt→älter, lang→länger, jung→jünger.`);
  
  // Superlative
  if (/\b(am\s+\w+sten)\b/i.test(sent)) {
    const sup = sent.match(/\b(am\s+\w+sten)\b/i)[1];
    candidates.push(`'${sup}' – superlative (predicative). The attributive form uses 'der/die/das ...ste' with appropriate adjective endings.`);
  }
  
  // Two-way prepositions
  const twoWay = { 'in': 'in', 'an': 'at/on', 'auf': 'on', 'über': 'over/about', 'unter': 'under/among', 'vor': 'before/in front of', 'hinter': 'behind', 'neben': 'next to', 'zwischen': 'between' };
  for (const [prep, meaning] of Object.entries(twoWay)) {
    if (new RegExp(`\\b${prep}\\b`, 'i').test(sent)) {
      if (/\b(dem|einem|meinem|seinem|ihrem|keinem|jedem)\b/i.test(sent)) {
        candidates.push(`'${prep}' (${meaning}) + dative = location. Accusative would indicate direction/movement toward.`);
      } else if (/\b(den|einen|meinen|seinen|ihren|keinen|jeden)\b/i.test(sent)) {
        candidates.push(`'${prep}' (${meaning}) + accusative = direction/movement. Dative would indicate static location.`);
      }
      break;
    }
  }
  
  // Dative prepositions
  const datP = { 'mit': 'with', 'nach': 'after/to', 'bei': 'at/near', 'seit': 'since/for', 'von': 'from/of', 'zu': 'to', 'aus': 'from/out of', 'außer': 'except', 'gegenüber': 'opposite' };
  for (const [p, m] of Object.entries(datP)) {
    if (new RegExp(`\\b${p}\\b`, 'i').test(sent)) {
      candidates.push(`'${p}' (${m}) always governs the dative case – no exceptions.`);
      break;
    }
  }
  
  // Accusative prepositions
  const accP = { 'durch': 'through', 'für': 'for', 'gegen': 'against', 'ohne': 'without', 'um': 'around/at' };
  for (const [p, m] of Object.entries(accP)) {
    if (new RegExp(`\\b${p}\\b`, 'i').test(sent)) {
      candidates.push(`'${p}' (${m}) always takes accusative – no exceptions.`);
      break;
    }
  }
  
  // Genitive
  const gen = sent.match(/\b(des|eines)\s+(\w+(?:s|es))\b/i);
  if (gen) candidates.push(`'${gen[0]}' – genitive case showing possession. Masculine/neuter nouns add -s or -es.`);
  
  // Perfekt
  if (/\b(habe|hast|hat|haben|habt)\b/i.test(sent) && /\b(ge\w+(?:t|en))\b/i.test(sent)) {
    const pp = sent.match(/\b(ge\w+(?:t|en))\b/i)[1];
    candidates.push(`Perfekt: 'haben' + '${pp}' – standard spoken past tense. The participle goes to the clause end.`);
  }
  if (/\b(bin|bist|ist|sind)\b/i.test(sent) && /\b(ge\w+en)\b/i.test(sent)) {
    const pp = sent.match(/\b(ge\w+en)\b/i)[1];
    candidates.push(`Perfekt with 'sein' + '${pp}' – motion/change-of-state verbs use 'sein' as the auxiliary.`);
  }
  
  // Präteritum
  if (/\b(war|waren)\b/i.test(sent) && !sentL.includes('wurde')) candidates.push(`'War/waren' (was/were) – Präteritum of 'sein', preferred over Perfekt even in spoken German.`);
  if (/\b(hatte|hatten)\b/i.test(sent)) candidates.push(`'Hatte/hatten' – Präteritum of 'haben', commonly used in speech alongside 'sein' and the modals.`);
  
  // Relative clauses
  const relCl = sent.match(/,\s*(der|die|das|den|dem|dessen|deren|denen)\s+/i);
  if (relCl) {
    const caseMap = { 'der': 'nom. masc.', 'die': 'nom./acc. fem./pl.', 'das': 'nom./acc. neut.', 'den': 'acc. masc./dat. pl.', 'dem': 'dat. masc./neut.', 'dessen': 'gen. masc./neut.', 'deren': 'gen. fem./pl.', 'denen': 'dat. pl.' };
    candidates.push(`'${relCl[1]}' (${caseMap[relCl[1].toLowerCase()]}) introduces a relative clause – its case depends on its role within that clause.`);
  }
  
  // Um...zu
  if (/\bum\b.*\bzu\b.*\b\w+en\b/i.test(sent)) candidates.push(`'Um...zu + infinitive' = in order to. 'Zu' sits before the infinitive, splitting into separable verbs: 'um ein|zu|kaufen'.`);
  
  // Zu + infinitive
  if (/\bzu\s+\w+en\b/i.test(sent) && !sentL.includes('um zu')) candidates.push(`'Zu + infinitive' – used after many verbs and adjectives, similar to English 'to + verb' constructions.`);
  
  // Negation
  if (/\bnicht\b/i.test(sent) && !/\b(kein|keine)\b/i.test(sent)) {
    candidates.push(`'Nicht' placement follows strict rules – typically before what it negates, and always before the final verb element (participle/infinitive/prefix).`);
  }
  if (/\b(kein|keine|keinen|keinem|keiner)\b/i.test(sent)) {
    candidates.push(`'${sent.match(/\b(kein|keine|keinen|keinem|keiner)\b/i)[1]}' negates nouns directly – replaces the indefinite article with matching endings.`);
  }
  
  // Questions
  if (sent.includes('?')) {
    const qWord = sent.match(/^(Wer|Was|Wo|Wann|Warum|Wie|Welch\w*|Wessen|Wem|Wen|Wohin|Woher|Worüber|Wofür|Woran|Worauf|Worin|Womit)\b/i);
    if (qWord) candidates.push(`'${qWord[1]}' starts a W-question – verb follows in V2 position, just like in statements.`);
    else if (/^(Ist|Sind|Hat|Haben|Kann|Muss|Will|Soll|Darf|Wird|Hast|Bist|Habt|Seid|Möchtest|Möchten)\b/i.test(sent)) {
      candidates.push(`Yes/no question – verb takes V1 position. German doesn't need a 'do' auxiliary.`);
    }
  }
  
  // Compound nouns
  const longNoun = sent.match(/\b([A-ZÄÖÜ]\w{11,})\b/);
  if (longNoun) candidates.push(`'${longNoun[1]}' – compound noun. The last component determines gender; earlier components modify meaning.`);
  
  // Imperative
  if (/^(Komm|Geh|Fahr|Nimm|Gib|Sieh|Schau|Lies|Schreib|Sprich|Sag|Mach|Bring|Hol|Kauf|Iss|Trink|Schlaf|Lauf|Ruf|Steh|Sitz|Halt|Lass|Trag|Wirf|Öffne|Schließ|Dreh|Hör|Warte|Hilf|Pass|Setz|Stell|Leg|Zieh)\b/i.test(sent)) {
    const impV = sent.match(/^(\w+)/)[1];
    candidates.push(`'${impV}!' – du-imperative, formed by dropping -st. Strong verbs with e→i keep the change (gib!, nimm!).`);
  }
  
  // Es gibt
  if (/\bes gibt\b/i.test(sentL)) candidates.push(`'Es gibt' (there is/are) takes accusative – the thing that exists is the object.`);
  
  // Adjective endings
  const adjMatch = sent.match(/\b(der|die|das|dem|den|des|ein|eine|einem|einer|eines|einen)\s+(\w+(?:e|er|es|en|em))\s+([A-ZÄÖÜ]\w+)\b/);
  if (adjMatch) candidates.push(`Adjective '${adjMatch[2]}' – its ending depends on the article type, case, and noun gender. After definite articles, usually -e or -en.`);
  
  // Pick least-used, capped at 8
  candidates.sort((a, b) => (tracker.count(a) || 0) - (tracker.count(b) || 0));
  for (const c of candidates) {
    if (tracker.count(c) < 8) return c;
  }
  return null;
}

// ==================== MAIN ====================

console.log('Generating fixes...');
const ptFixes = generatePTFixes();
const deFixes = generateDEFixes();

const outDir = path.join(__dirname, 'output');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

fs.writeFileSync(path.join(outDir, 'pt-tip-fixes.json'), JSON.stringify(ptFixes, null, 2));
fs.writeFileSync(path.join(outDir, 'de-tip-fixes.json'), JSON.stringify(deFixes, null, 2));

console.log('\n=== PORTUGUESE ===');
console.log('Total checked:', pt.filter(c => c.grammar).length);
console.log('Total flagged:', ptFixes.length);
const ptByType = {};
for (const f of ptFixes) ptByType[f.issue] = (ptByType[f.issue] || 0) + 1;
console.log('Breakdown:', JSON.stringify(ptByType));

const ptRepTips = {};
for (const f of ptFixes) { ptRepTips[f.fixed_tip] = (ptRepTips[f.fixed_tip] || 0) + 1; }
const ptMaxRep = Math.max(...Object.values(ptRepTips));
console.log('Max replacement tip repetition:', ptMaxRep);
const ptUnique = Object.keys(ptRepTips).length;
console.log('Unique replacement tips:', ptUnique, 'of', ptFixes.length, 'fixes');

console.log('\n=== GERMAN ===');
console.log('Total checked:', de.filter(c => c.grammar).length);
console.log('Total flagged:', deFixes.length);
const deByType = {};
for (const f of deFixes) deByType[f.issue] = (deByType[f.issue] || 0) + 1;
console.log('Breakdown:', JSON.stringify(deByType));

const deRepTips = {};
for (const f of deFixes) { deRepTips[f.fixed_tip] = (deRepTips[f.fixed_tip] || 0) + 1; }
const deMaxRep = Math.max(...Object.values(deRepTips));
console.log('Max replacement tip repetition:', deMaxRep);
const deUnique = Object.keys(deRepTips).length;
console.log('Unique replacement tips:', deUnique, 'of', deFixes.length, 'fixes');
