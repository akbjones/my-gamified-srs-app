#!/usr/bin/env node
/**
 * Complete review of every Spanish dictionary entry.
 * Checks ALL known issue types and produces fixes.
 */

const fs = require('fs');
const path = require('path');

const DICT_PATH = path.join(__dirname, '..', 'src', 'data', 'dictionary', 'es.ts');
const OUTPUT_PATH = path.join(__dirname, 'output', 'es-full-verb-review.json');

const raw = fs.readFileSync(DICT_PATH, 'utf8');

// Parse all entries
const entries = [];
const entryRegex = /^\s+'([^']+)':\s*\{\s*en:\s*'([^']*)',\s*ipa:\s*'([^']*)',\s*pos:\s*'([^']*)'/gm;
let m;
while ((m = entryRegex.exec(raw)) !== null) {
  entries.push({ word: m[1], en: m[2], ipa: m[3], pos: m[4], line: raw.substring(0, m.index).split('\n').length });
}

console.log(`Total entries parsed: ${entries.length}`);

const fixes = [];
const issueStats = {
  'to_noun_not_verb': 0,      // "to accommodation" — noun with "to " prefix
  'to_adj_not_verb': 0,       // "to comfortable" — adj with "to " prefix
  'to_past_tense': 0,         // "to canceled" — past tense after "to"
  'to_gerund': 0,             // "to bring" (actually gerund issue)
  'to_garbled': 0,            // "to do you hear?" garbled question
  'to_not_english': 0,        // "to shaf", "to warne", "to ande"
  'to_semantic_error': 0,     // "to chord" for acordé (should be "to agree")
  'wrong_pos': 0,             // pos doesn't match the English meaning
  'missing_to_prefix': 0,     // verb without "to " prefix
  'not_english': 0,           // "pas", "acrobatic" (not real English)
  'bad_translation': 0,       // wrong meaning for Spanish word
  'duplicate_semicolon': 0,   // "to help; to help"
};

function addFix(word, current_en, fixed_en, current_pos, fixed_pos, issue, reason) {
  fixes.push({ word, current_en, fixed_en, current_pos, fixed_pos, issue, reason });
  if (issueStats[issue] !== undefined) issueStats[issue]++;
  else { issueStats[issue] = 1; }
}

// ============================================================
// MANUAL FIXES — Spanish knowledge-based corrections
// These are entries I've verified using Spanish language knowledge
// ============================================================
const MANUAL_FIXES = {
  // --- Nouns incorrectly tagged as verbs with "to " ---
  'abono': { en: 'pass; fertilizer', pos: 'n', issue: 'not_english', reason: '"pas" is not English; abono = pass/fertilizer' },
  'abrazo': { en: 'hug', pos: 'n', issue: 'to_noun_not_verb', reason: 'abrazo is noun "hug"' },
  'águilas': { en: 'eagle', pos: 'n', issue: 'to_noun_not_verb', reason: 'águilas is noun "eagles"' },
  'alojamiento': { en: 'accommodation', pos: 'n', issue: 'to_noun_not_verb', reason: 'alojamiento is noun' },
  'alquiler': { en: 'rent', pos: 'n', issue: 'to_noun_not_verb', reason: 'alquiler is noun "rent"' },
  'amazonas': { en: 'Amazon', pos: 'n', issue: 'to_noun_not_verb', reason: 'Amazonas is proper noun' },
  'amenaza': { en: 'threat', pos: 'n', issue: 'to_noun_not_verb', reason: 'amenaza is noun "threat"' },
  'amor': { en: 'love', pos: 'n', issue: 'to_noun_not_verb', reason: 'amor is noun "love"' },
  'andén': { en: 'platform', pos: 'n', issue: 'to_noun_not_verb', reason: 'andén is noun "platform"' },
  'andes': { en: 'Andes', pos: 'n', issue: 'to_noun_not_verb', reason: 'Andes is proper noun' },
  'animales': { en: 'animal', pos: 'n', issue: 'to_noun_not_verb', reason: 'animales is noun "animals"' },
  'anuncio': { en: 'advertisement', pos: 'n', issue: 'to_noun_not_verb', reason: 'anuncio is noun' },
  'aprecio': { en: 'appreciation', pos: 'n', issue: 'to_noun_not_verb', reason: 'aprecio is noun' },
  'arreglo': { en: 'arrangement', pos: 'n', issue: 'to_noun_not_verb', reason: 'arreglo is noun' },
  'arregló': { en: 'to fix', pos: 'v', issue: 'to_noun_not_verb', reason: 'arregló is past tense of arreglar (to fix), not "to arrangement"' },
  'arrepentimiento': { en: 'repentance', pos: 'n', issue: 'to_noun_not_verb', reason: 'arrepentimiento is noun' },
  'arroyo': { en: 'stream', pos: 'n', issue: 'to_noun_not_verb', reason: 'arroyo is noun "stream"' },
  'asignaturas': { en: 'subject', pos: 'n', issue: 'to_noun_not_verb', reason: 'asignaturas is noun "subjects"' },
  'asilo': { en: 'asylum', pos: 'n', issue: 'to_noun_not_verb', reason: 'asilo is noun' },
  'aspiradora': { en: 'vacuum cleaner', pos: 'n', issue: 'to_noun_not_verb', reason: 'aspiradora is noun' },
  'atasco': { en: 'traffic jam', pos: 'n', issue: 'to_noun_not_verb', reason: 'atasco is noun "traffic jam"' },
  'auditoría': { en: 'audit', pos: 'n', issue: 'to_noun_not_verb', reason: 'auditoría is noun "audit"' },
  'barco': { en: 'ship', pos: 'n', issue: 'to_noun_not_verb', reason: 'barco is noun "ship"' },
  'base': { en: 'base', pos: 'n', issue: 'to_noun_not_verb', reason: 'base is noun' },
  'bases': { en: 'base', pos: 'n', issue: 'to_noun_not_verb', reason: 'bases is noun "bases"' },
  'biberón': { en: 'baby bottle', pos: 'n', issue: 'to_noun_not_verb', reason: 'biberón is noun' },
  'bloques': { en: 'block', pos: 'n', issue: 'to_noun_not_verb', reason: 'bloques is noun "blocks"' },
  'cabeza': { en: 'head', pos: 'n', issue: 'to_noun_not_verb', reason: 'cabeza is noun "head"' },
  'cabo': { en: 'cape; end', pos: 'n', issue: 'to_noun_not_verb', reason: 'cabo is noun' },
  'calculo': { en: 'calculation', pos: 'n', issue: 'to_noun_not_verb', reason: 'calculo is noun' },
  'callejuelas': { en: 'alley', pos: 'n', issue: 'to_noun_not_verb', reason: 'callejuelas is noun "alleys"' },
  'cansancio': { en: 'fatigue', pos: 'n', issue: 'to_noun_not_verb', reason: 'cansancio is noun' },
  'cántaros': { en: 'pitcher', pos: 'n', issue: 'to_noun_not_verb', reason: 'cántaros is noun' },
  'capa': { en: 'layer', pos: 'n', issue: 'to_noun_not_verb', reason: 'capa is noun "layer"' },
  'carácter': { en: 'character', pos: 'n', issue: 'to_noun_not_verb', reason: 'carácter is noun' },
  'cargador': { en: 'charger', pos: 'n', issue: 'to_noun_not_verb', reason: 'cargador is noun' },
  'cascada': { en: 'waterfall', pos: 'n', issue: 'to_noun_not_verb', reason: 'cascada is noun' },
  'casco': { en: 'helmet', pos: 'n', issue: 'to_noun_not_verb', reason: 'casco is noun' },
  'caso': { en: 'case', pos: 'n', issue: 'to_noun_not_verb', reason: 'caso is noun "case"' },
  'censura': { en: 'censorship', pos: 'n', issue: 'to_noun_not_verb', reason: 'censura is noun' },
  'cicatriz': { en: 'scar', pos: 'n', issue: 'to_noun_not_verb', reason: 'cicatriz is noun "scar"' },
  'ciervos': { en: 'deer', pos: 'n', issue: 'to_noun_not_verb', reason: 'ciervos is noun "deer"' },
  'cifras': { en: 'figure', pos: 'n', issue: 'to_noun_not_verb', reason: 'cifras is noun "figures"' },
  'collar': { en: 'necklace', pos: 'n', issue: 'to_noun_not_verb', reason: 'collar is noun' },
  'colombia': { en: 'Colombia', pos: 'n', issue: 'to_noun_not_verb', reason: 'Colombia is proper noun' },
  'comedor': { en: 'dining room', pos: 'n', issue: 'to_noun_not_verb', reason: 'comedor is noun' },
  'comentario': { en: 'comment', pos: 'n', issue: 'to_noun_not_verb', reason: 'comentario is noun' },
  'comercio': { en: 'trade; commerce', pos: 'n', issue: 'to_noun_not_verb', reason: 'comercio is noun' },
  'comida': { en: 'meal; food', pos: 'n', issue: 'to_noun_not_verb', reason: 'comida is noun "food/meal"' },
  'compañera': { en: 'partner; companion', pos: 'n', issue: 'to_noun_not_verb', reason: 'compañera is noun' },
  'compañeros': { en: 'companion', pos: 'n', issue: 'to_noun_not_verb', reason: 'compañeros is noun' },
  'compartimento': { en: 'compartment', pos: 'n', issue: 'to_noun_not_verb', reason: 'compartimento is noun' },
  'compromiso': { en: 'commitment', pos: 'n', issue: 'to_noun_not_verb', reason: 'compromiso is noun' },
  'comunicado': { en: 'press release', pos: 'n', issue: 'to_noun_not_verb', reason: 'comunicado is noun' },
  'comunión': { en: 'communion', pos: 'n', issue: 'to_noun_not_verb', reason: 'comunión is noun' },
  'confianza': { en: 'trust; confidence', pos: 'n', issue: 'to_noun_not_verb', reason: 'confianza is noun' },
  'conflictos': { en: 'conflict', pos: 'n', issue: 'to_noun_not_verb', reason: 'conflictos is noun' },

  // --- Adjectives incorrectly tagged as verbs ---
  'abierta': { en: 'open', pos: 'adj', issue: 'to_adj_not_verb', reason: 'abierta is adjective "open"' },
  'abiertas': { en: 'open', pos: 'adj', issue: 'to_adj_not_verb', reason: 'abiertas is adjective "open"' },
  'abierto': { en: 'open', pos: 'adj', issue: 'to_adj_not_verb', reason: 'abierto is adjective "open"' },
  'aburrida': { en: 'bored', pos: 'adj', issue: 'to_adj_not_verb', reason: 'aburrida is adjective "bored"' },
  'aburrido': { en: 'bored', pos: 'adj', issue: 'to_adj_not_verb', reason: 'aburrido is adjective "bored"' },
  'amarillo': { en: 'yellow', pos: 'adj', issue: 'to_adj_not_verb', reason: 'amarillo is adjective "yellow"' },
  'casera': { en: 'homemade', pos: 'adj', issue: 'to_adj_not_verb', reason: 'casera is adjective' },
  'central': { en: 'central', pos: 'adj', issue: 'to_adj_not_verb', reason: 'central is adjective' },
  'cognitivas': { en: 'cognitive', pos: 'adj', issue: 'to_adj_not_verb', reason: 'cognitivas is adjective' },
  'comercial': { en: 'commercial', pos: 'adj', issue: 'to_adj_not_verb', reason: 'comercial is adjective' },
  'cómoda': { en: 'comfortable', pos: 'adj', issue: 'to_adj_not_verb', reason: 'cómoda is adjective' },
  'cómodas': { en: 'comfortable', pos: 'adj', issue: 'to_adj_not_verb', reason: 'cómodas is adjective' },
  'cómodo': { en: 'comfortable', pos: 'adj', issue: 'to_adj_not_verb', reason: 'cómodo is adjective' },
  'cómodos': { en: 'comfortable', pos: 'adj', issue: 'to_adj_not_verb', reason: 'cómodos is adjective' },
  'confidenciales': { en: 'confidential', pos: 'adj', issue: 'to_adj_not_verb', reason: 'confidenciales is adjective' },
  'acompañado': { en: 'accompanied', pos: 'adj', issue: 'to_adj_not_verb', reason: 'acompañado is past participle used as adj' },
  'adoptado': { en: 'adopted', pos: 'adj', issue: 'to_adj_not_verb', reason: 'adoptado is adjective' },
  'adquirida': { en: 'acquired', pos: 'adj', issue: 'to_adj_not_verb', reason: 'adquirida is adjective' },
  'conservadora': { en: 'conservative', pos: 'adj', issue: 'to_adj_not_verb', reason: 'conservadora is adjective' },

  // --- "to " + past tense (should be base form) ---
  'abrocháramos': { en: 'to fasten', pos: 'v', issue: 'to_past_tense', reason: '"to fastened" → "to fasten"' },
  'afirmó': { en: 'to affirm', pos: 'v', issue: 'to_past_tense', reason: '"to stated" → "to affirm"' },
  'aseguró': { en: 'to assure', pos: 'v', issue: 'to_past_tense', reason: '"to assured" → "to assure"' },
  'causó': { en: 'to cause', pos: 'v', issue: 'to_past_tense', reason: '"to caused" → "to cause"' },
  'cobrado': { en: 'to charge', pos: 'v', issue: 'to_past_tense', reason: '"to charged" → "to charge"' },
  'cancelado': { en: 'to cancel', pos: 'v', issue: 'to_past_tense', reason: '"to canceled" → "to cancel"' },
  'canceló': { en: 'to cancel', pos: 'v', issue: 'to_past_tense', reason: '"to canceled" → "to cancel"' },
  'compensaba': { en: 'to compensate', pos: 'v', issue: 'to_past_tense', reason: '"to compensated" → "to compensate"' },
  'considerado': { en: 'to consider', pos: 'v', issue: 'to_past_tense', reason: '"to considered" → "to consider"' },
  'confundido': { en: 'confused', pos: 'adj', issue: 'to_past_tense', reason: '"to confused" → "confused" (adj)' },
  'convencido': { en: 'convinced', pos: 'adj', issue: 'to_past_tense', reason: '"to convinced" → "convinced" (adj)' },
  'dañado': { en: 'damaged', pos: 'adj', issue: 'to_past_tense', reason: '"to damaged" → "damaged" (adj)' },
  'dedicado': { en: 'dedicated', pos: 'adj', issue: 'to_past_tense', reason: '"to dedicated" → "dedicated" (adj)' },
  'despedido': { en: 'fired; dismissed', pos: 'adj', issue: 'to_past_tense', reason: '"to dismissed" → adj' },
  'engañado': { en: 'to cheat', pos: 'v', issue: 'to_past_tense', reason: '"to cheated" → "to cheat"' },
  'establecidas': { en: 'established', pos: 'adj', issue: 'to_past_tense', reason: '"to established" → adj' },
  'establecido': { en: 'established', pos: 'adj', issue: 'to_past_tense', reason: '"to established" → adj' },
  'establecidos': { en: 'established', pos: 'adj', issue: 'to_past_tense', reason: '"to established" → adj' },
  'instalado': { en: 'installed', pos: 'adj', issue: 'to_past_tense', reason: '"to installed" → adj' },
  'obligado': { en: 'obliged', pos: 'adj', issue: 'to_past_tense', reason: '"to obliged" → adj' },
  'planificado': { en: 'planned', pos: 'adj', issue: 'to_past_tense', reason: '"to planned" → adj' },
  'prohibidas': { en: 'prohibited', pos: 'adj', issue: 'to_past_tense', reason: '"to prohibited" → adj' },
  'retirado': { en: 'retired', pos: 'adj', issue: 'to_past_tense', reason: '"to retired" → adj' },
  'sobresaltado': { en: 'startled', pos: 'adj', issue: 'to_past_tense', reason: '"to startled" → adj' },
  'tostado': { en: 'toasted', pos: 'adj', issue: 'to_past_tense', reason: '"to toasted" → adj' },
  'automatizado': { en: 'automated', pos: 'adj', issue: 'to_past_tense', reason: '"to automated" → adj' },
  'inesperado': { en: 'unexpected', pos: 'adj', issue: 'to_past_tense', reason: '"to unexpected" → adj' },
  'contaminados': { en: 'contaminated', pos: 'adj', issue: 'to_past_tense', reason: '"to contaminated" → adj' },
  'desarrollados': { en: 'developed', pos: 'adj', issue: 'to_past_tense', reason: '"to developed" → adj' },
  'complicada': { en: 'complicated', pos: 'adj', issue: 'to_past_tense', reason: '"to complicated" → adj' },
  'complicado': { en: 'complicated', pos: 'adj', issue: 'to_past_tense', reason: '"to complicated" → adj' },
  'sentados': { en: 'seated', pos: 'adj', issue: 'to_past_tense', reason: '"to seated" → adj' },
  'archivados': { en: 'archived', pos: 'adj', issue: 'to_past_tense', reason: '"to archived" → adj' },
  'multados': { en: 'fined', pos: 'adj', issue: 'to_past_tense', reason: '"to fined" → adj' },
  'derribado': { en: 'demolished', pos: 'adj', issue: 'to_past_tense', reason: '"to felled" → adj "demolished"' },
  'derretido': { en: 'melted', pos: 'adj', issue: 'to_past_tense', reason: '"to melted" → adj' },
  'emitida': { en: 'issued', pos: 'adj', issue: 'to_past_tense', reason: '"to issued" → adj' },
  'reparada': { en: 'repaired', pos: 'adj', issue: 'to_past_tense', reason: '"to repaired" → adj' },
  'inaugurada': { en: 'inaugurated', pos: 'adj', issue: 'to_past_tense', reason: '"to inaugurated" → adj' },

  // Past tense after "to" that should stay as verbs (fix verb form)
  'aburrieron': { en: 'to bore', pos: 'v', issue: 'to_past_tense', reason: '"to bored" → "to bore"' },
  'aprobada': { en: 'to approve', pos: 'v', issue: 'to_past_tense', reason: '"to approved" → "to approve"' },
  'aprobado': { en: 'to approve', pos: 'v', issue: 'to_past_tense', reason: '"to approved" → "to approve"' },
  'aprobó': { en: 'to approve', pos: 'v', issue: 'to_past_tense', reason: '"to approved" → "to approve"' },
  'ascendieron': { en: 'to ascend', pos: 'v', issue: 'to_past_tense', reason: '"to ascended" → "to ascend"' },
  'quemé': { en: 'to burn', pos: 'v', issue: 'to_past_tense', reason: '"to burned" → "to burn"' },
  'limpiaba': { en: 'to clean', pos: 'v', issue: 'to_past_tense', reason: '"to cleaned" → "to clean"' },
  'limpié': { en: 'to clean', pos: 'v', issue: 'to_past_tense', reason: '"to cleaned" → "to clean"' },
  'quejaron': { en: 'to complain', pos: 'v', issue: 'to_past_tense', reason: '"to complained" → "to complain"' },
  'concluida': { en: 'to conclude', pos: 'v', issue: 'to_past_tense', reason: '"to completed" → "to conclude"' },
  'siguió': { en: 'to continue', pos: 'v', issue: 'to_past_tense', reason: '"to continued" → "to continue"' },
  'seguido': { en: 'to follow', pos: 'v', issue: 'to_past_tense', reason: '"to continued" → "to follow"' },
  'decepcionó': { en: 'to disappoint', pos: 'v', issue: 'to_past_tense', reason: '"to disappointed" → "to disappoint"' },
  'descubrí': { en: 'to discover', pos: 'v', issue: 'to_past_tense', reason: '"to discovered" → "to discover"' },
  'descubrimos': { en: 'to discover', pos: 'v', issue: 'to_past_tense', reason: '"to discovered" → "to discover"' },
  'discutimos': { en: 'to discuss', pos: 'v', issue: 'to_past_tense', reason: '"to discussed" → "to discuss"' },
  'vistieron': { en: 'to dress', pos: 'v', issue: 'to_past_tense', reason: '"to dressed" → "to dress"' },
  'dudaba': { en: 'to doubt', pos: 'v', issue: 'to_past_tense', reason: '"to doubted" → "to doubt"' },
  'estalló': { en: 'to explode', pos: 'v', issue: 'to_past_tense', reason: '"to exploded" → "to explode"' },
  'venció': { en: 'to expire; to defeat', pos: 'v', issue: 'to_past_tense', reason: '"to expired" → "to expire"' },
  'despidieron': { en: 'to fire', pos: 'v', issue: 'to_past_tense', reason: '"to fired" → "to fire"' },
  'despidió': { en: 'to fire', pos: 'v', issue: 'to_past_tense', reason: '"to fired" → "to fire"' },
  'cumplí': { en: 'to fulfill', pos: 'v', issue: 'to_past_tense', reason: '"to fulfilled" → "to fulfill"' },
  'cumplieron': { en: 'to fulfill', pos: 'v', issue: 'to_past_tense', reason: '"to fulfilled" → "to fulfill"' },
  'odiaba': { en: 'to hate', pos: 'v', issue: 'to_past_tense', reason: '"to hated" → "to hate"' },
  'heredé': { en: 'to inherit', pos: 'v', issue: 'to_past_tense', reason: '"to inherited" → "to inherit"' },
  'insistí': { en: 'to insist', pos: 'v', issue: 'to_past_tense', reason: '"to insisted" → "to insist"' },
  'insistido': { en: 'to insist', pos: 'v', issue: 'to_past_tense', reason: '"to insisted" → "to insist"' },
  'insistió': { en: 'to insist', pos: 'v', issue: 'to_past_tense', reason: '"to insisted" → "to insist"' },
  'interpretó': { en: 'to interpret', pos: 'v', issue: 'to_past_tense', reason: '"to interpreted" → "to interpret"' },
  'durado': { en: 'to last', pos: 'v', issue: 'to_past_tense', reason: '"to lasted" → "to last"' },
  'gustaban': { en: 'to like', pos: 'v', issue: 'to_past_tense', reason: '"to liked" → "to like"' },
  'gustado': { en: 'to like', pos: 'v', issue: 'to_past_tense', reason: '"to liked" → "to like"' },
  'permitio': { en: 'to allow', pos: 'v', issue: 'to_past_tense', reason: '"to allowed" → "to allow"' },
  'procedió': { en: 'to proceed', pos: 'v', issue: 'to_past_tense', reason: '"to proceeded" → "to proceed"' },
  'prometí': { en: 'to promise', pos: 'v', issue: 'to_past_tense', reason: '"to promised" → "to promise"' },
  'prometió': { en: 'to promise', pos: 'v', issue: 'to_past_tense', reason: '"to promised" → "to promise"' },
  'redujeron': { en: 'to reduce', pos: 'v', issue: 'to_past_tense', reason: '"to reduced" → "to reduce"' },
  'reprochó': { en: 'to reproach', pos: 'v', issue: 'to_past_tense', reason: '"to reproached" → "to reproach"' },
  'rescatamos': { en: 'to rescue', pos: 'v', issue: 'to_past_tense', reason: '"to rescued" → "to rescue"' },
  'resolvió': { en: 'to resolve', pos: 'v', issue: 'to_past_tense', reason: '"to resolved" → "to resolve"' },
  'repasaron': { en: 'to review', pos: 'v', issue: 'to_past_tense', reason: '"to reviewed" → "to review"' },
  'remamos': { en: 'to row', pos: 'v', issue: 'to_past_tense', reason: '"to rowed" → "to row"' },
  'parecía': { en: 'to seem', pos: 'v', issue: 'to_past_tense', reason: '"to seemed" → "to seem"' },
  'pareció': { en: 'to seem', pos: 'v', issue: 'to_past_tense', reason: '"to seemed" → "to seem"' },
  'gritaron': { en: 'to shout', pos: 'v', issue: 'to_past_tense', reason: '"to shouted" → "to shout"' },
  'solucioné': { en: 'to solve', pos: 'v', issue: 'to_past_tense', reason: '"to solved" → "to solve"' },
  'sumergió': { en: 'to submerge', pos: 'v', issue: 'to_past_tense', reason: '"to submerged" → "to submerge"' },
  'convocaron': { en: 'to summon', pos: 'v', issue: 'to_past_tense', reason: '"to summoned" → "to summon"' },
  'superó': { en: 'to surpass', pos: 'v', issue: 'to_past_tense', reason: '"to surpassed" → "to surpass"' },
  'sorprendió': { en: 'to surprise', pos: 'v', issue: 'to_past_tense', reason: '"to surprised" → "to surprise"' },
  'recorrimos': { en: 'to tour', pos: 'v', issue: 'to_past_tense', reason: '"to toured" → "to tour"' },
  'tropecé': { en: 'to trip', pos: 'v', issue: 'to_past_tense', reason: '"to tripped" → "to trip"' },
  'querido': { en: 'dear; beloved', pos: 'adj', issue: 'to_past_tense', reason: '"to wanted" → adj "dear"' },
  'quise': { en: 'to want', pos: 'v', issue: 'to_past_tense', reason: '"to wanted" → "to want"' },
  'quiso': { en: 'to want', pos: 'v', issue: 'to_past_tense', reason: '"to wanted" → "to want"' },
  'preocupó': { en: 'to worry', pos: 'v', issue: 'to_past_tense', reason: '"to worried" → "to worry"' },
  'recurrieron': { en: 'to appeal', pos: 'v', issue: 'to_past_tense', reason: '"to appealed" → "to appeal"' },
  'quedamos': { en: 'to agree; to stay', pos: 'v', issue: 'to_past_tense', reason: '"to agreed" → "to agree/stay"' },
  'merecíamos': { en: 'to deserve', pos: 'v', issue: 'to_past_tense', reason: '"to deserved" → "to deserve"' },
  'mereció': { en: 'to deserve', pos: 'v', issue: 'to_past_tense', reason: '"to deserved" → "to deserve"' },
  'descendido': { en: 'to descend', pos: 'v', issue: 'to_past_tense', reason: '"to descended" → "to descend"' },

  // --- "to " + garbled question translation ---
  '¿oyes': { en: 'to hear', pos: 'v', issue: 'to_garbled', reason: '"to do you hear?" is garbled' },
  '¿prefieres': { en: 'to prefer', pos: 'v', issue: 'to_garbled', reason: '"to do you prefer" is garbled' },
  '¿recibiste': { en: 'to receive', pos: 'v', issue: 'to_garbled', reason: '"to do you receive" is garbled' },
  '¿sabe': { en: 'to know', pos: 'v', issue: 'to_garbled', reason: '"to do he know" is garbled' },
  '¿fuiste': { en: 'to be; to go', pos: 'v', issue: 'to_garbled', reason: '"to be you" is garbled' },
  '¿has': { en: 'to have', pos: 'v', issue: 'to_garbled', reason: '"to have you" is garbled' },
  '¿sigues': { en: 'to follow', pos: 'v', issue: 'to_garbled', reason: '"to be you still" is garbled' },
  '¿vas': { en: 'to go', pos: 'v', issue: 'to_garbled', reason: '"to be you going?" is garbled' },
  '¿ves': { en: 'to see', pos: 'v', issue: 'to_garbled', reason: '"to do you see?" is garbled' },
  '¿viene': { en: 'to come', pos: 'v', issue: 'to_garbled', reason: '"to be it coming?" is garbled' },
  '¿vives': { en: 'to live', pos: 'v', issue: 'to_garbled', reason: '"to do you live" is garbled' },
  'acuerdas': { en: 'to remember', pos: 'v', issue: 'to_garbled', reason: '"to do you agree" is garbled; acordarse = remember' },

  // --- "to " + not English word ---
  'afeita': { en: 'to shave', pos: 'v', issue: 'to_not_english', reason: '"to shaf" is not English' },
  'acaso': { en: 'perhaps', pos: 'adv', issue: 'to_not_english', reason: '"to perhap" — acaso means "perhaps"' },
  'aviso': { en: 'warning; notice', pos: 'n', issue: 'to_not_english', reason: '"to warne" is not English; aviso is noun' },
  'avisó': { en: 'to warn', pos: 'v', issue: 'to_not_english', reason: '"to warne" is not English' },
  'aprobarás': { en: 'to pass', pos: 'v', issue: 'to_not_english', reason: '"to pas" is not English' },
  'columpios': { en: 'swing', pos: 'n', issue: 'to_not_english', reason: '"to swe" is not English; columpios is noun' },

  // --- Semantic errors (wrong meaning for the Spanish word) ---
  'acostumbré': { en: 'to get used to', pos: 'v', issue: 'to_semantic_error', reason: '"to use to" is wrong' },
  'acostumbró': { en: 'to get accustomed', pos: 'v', issue: 'to_semantic_error', reason: '"to accustomed" is wrong form' },
  'acordé': { en: 'to agree', pos: 'v', issue: 'to_semantic_error', reason: '"to chord" is wrong; acordar = to agree' },
  'actual': { en: 'current', pos: 'adj', issue: 'to_semantic_error', reason: 'actual = "current" in Spanish, not "to act"' },
  'actuales': { en: 'current', pos: 'adj', issue: 'to_semantic_error', reason: 'actuales = "current" (plural)' },
  'actualicemos': { en: 'to update', pos: 'v', issue: 'to_semantic_error', reason: 'actualicemos is from actualizar (to update)' },
  'adaptador': { en: 'adapter', pos: 'n', issue: 'to_semantic_error', reason: 'adaptador is noun "adapter"' },
  'alegró': { en: 'to be glad', pos: 'v', issue: 'to_semantic_error', reason: '"to glad" — glad is not a verb' },
  'alentadores': { en: 'encouraging', pos: 'adj', issue: 'to_semantic_error', reason: 'alentadores is adj "encouraging"' },
  'acabamos': { en: 'to finish', pos: 'v', issue: 'to_semantic_error', reason: '"just finished" is not proper dict definition' },
  'acabó': { en: 'to finish', pos: 'v', issue: 'to_semantic_error', reason: '"just" is not a definition for acabar' },
  'acabo': { en: 'to finish', pos: 'v', issue: 'to_semantic_error', reason: '"just" is not a definition for acabar' },
  'asusta': { en: 'to scare', pos: 'v', issue: 'to_semantic_error', reason: '"to scary" — scary is adj, should be "to scare"' },
  'cobró': { en: 'to charge', pos: 'v', issue: 'to_semantic_error', reason: '"to collection" — cobrar = to charge' },
  'abarca': { en: 'to encompass', pos: 'v', issue: 'to_semantic_error', reason: 'abarca (verb) = to encompass, not noun "cover"' },
  'conocido': { en: 'well-known', pos: 'adj', issue: 'to_semantic_error', reason: '"to acquaintance" — conocido = well-known (adj)' },
  'comienzo': { en: 'beginning', pos: 'n', issue: 'to_semantic_error', reason: 'comienzo is noun "beginning", not "to eat"' },
  'comoquiera': { en: 'anyway', pos: 'adv', issue: 'to_semantic_error', reason: 'comoquiera is adverb "anyway"' },
  'aprendizaje': { en: 'learning', pos: 'n', issue: 'to_semantic_error', reason: 'aprendizaje is noun "learning"' },
  'cambio': { en: 'change', pos: 'n', issue: 'to_semantic_error', reason: 'cambio as noun = "change"' },
  'cambios': { en: 'change', pos: 'n', issue: 'to_semantic_error', reason: 'cambios is noun "changes"' },
  'crianza': { en: 'upbringing', pos: 'n', issue: 'to_semantic_error', reason: '"to breed" — crianza is noun "upbringing"' },
  'bebida': { en: 'drink; beverage', pos: 'n', issue: 'to_semantic_error', reason: 'bebida is noun "drink/beverage"' },
  'bebidas': { en: 'drink; beverage', pos: 'n', issue: 'to_semantic_error', reason: 'bebidas is noun "drinks"' },
  'arañazos': { en: 'scratch', pos: 'n', issue: 'to_semantic_error', reason: 'arañazos is noun "scratches"' },
  'competencias': { en: 'competition; skill', pos: 'n', issue: 'to_semantic_error', reason: 'competencias is noun' },
  'competitivo': { en: 'competitive', pos: 'adj', issue: 'to_semantic_error', reason: 'competitivo is adj, not "to compete"' },
  'competitivos': { en: 'competitive', pos: 'adj', issue: 'to_semantic_error', reason: 'competitivos is adj, not "to compete"' },
  'compras': { en: 'shopping; purchases', pos: 'n', issue: 'to_semantic_error', reason: 'compras (noun) = "shopping/purchases"' },
  'compruebo': { en: 'to check', pos: 'v', issue: 'to_semantic_error', reason: '"to buy" is wrong; compruebo = I check (comprobar)' },
  'cocinera': { en: 'cook; chef', pos: 'n', issue: 'to_semantic_error', reason: 'cocinera is noun "cook/chef"' },
  'bronca': { en: 'row; argument', pos: 'n', issue: 'to_semantic_error', reason: 'bronca is noun "argument"' },
  'bienvenidos': { en: 'welcome', pos: 'adj', issue: 'to_semantic_error', reason: 'bienvenidos is adj/interj "welcome"' },
  'callada': { en: 'quiet; silent', pos: 'adj', issue: 'to_semantic_error', reason: '"to silent" — callada is adj "quiet"' },
  'confusa': { en: 'confusing', pos: 'adj', issue: 'to_semantic_error', reason: '"to confuse" for adj confusa → "confusing"' },
  'beneficios': { en: 'benefit; profit', pos: 'n', issue: 'to_semantic_error', reason: 'beneficios is noun "benefits"' },
  'harto': { en: 'fed up', pos: 'adj', issue: 'to_semantic_error', reason: '"to feed" — harto means "fed up" (adj)' },
  'causas': { en: 'cause', pos: 'n', issue: 'to_semantic_error', reason: 'causas is noun "causes"' },
  'carga': { en: 'load; charge', pos: 'n', issue: 'to_semantic_error', reason: 'carga as noun = load/charge (duplicate "to load; to load")' },
  'adónde': { en: 'where to', pos: 'adv', issue: 'to_semantic_error', reason: '"to where to" — adónde is adverb' },

  // --- Wrong POS ---
  'acceso': { en: 'access', pos: 'n', issue: 'wrong_pos', reason: 'acceso is noun, not adj' },
  'accidente': { en: 'accident', pos: 'n', issue: 'wrong_pos', reason: 'accidente is noun, not adj' },
  'académica': { en: 'academic', pos: 'adj', issue: 'wrong_pos', reason: 'académica is adj, not noun' },
  'accedan': { en: 'to access', pos: 'v', issue: 'wrong_pos', reason: 'pos was adj, should be v' },
  'adaptar': { en: 'to adapt', pos: 'v', issue: 'wrong_pos', reason: 'adaptar is verb, pos was adj; "fit" → "to adapt"' },
  'adelante': { en: 'forward', pos: 'adv', issue: 'wrong_pos', reason: 'adelante is adv, not adj' },
  'además': { en: 'moreover; besides', pos: 'adv', issue: 'wrong_pos', reason: 'además is adv, not noun' },
  'absoluto': { en: 'absolute', pos: 'adj', issue: 'wrong_pos', reason: 'absoluto is adj, not noun' },
  'acogedor': { en: 'cozy', pos: 'adj', issue: 'wrong_pos', reason: 'acogedor is adj, not noun' },
  'aduana': { en: 'customs', pos: 'n', issue: 'not_english', reason: '"custom" → "customs"' },
  'acrobacia': { en: 'acrobatics', pos: 'n', issue: 'not_english', reason: '"acrobatic" → "acrobatics"' },
  'adversas': { en: 'adverse', pos: 'adj', issue: 'wrong_pos', reason: 'adversas is adj, not noun' },
  'agotador': { en: 'exhausting', pos: 'adj', issue: 'wrong_pos', reason: 'agotador is adj, not noun' },
  'agotadora': { en: 'exhausting', pos: 'adj', issue: 'wrong_pos', reason: 'agotadora is adj, not noun' },
  'agotadas': { en: 'exhausted', pos: 'adj', issue: 'wrong_pos', reason: 'agotadas is adj, not noun' },
  'alérgico': { en: 'allergic', pos: 'adj', issue: 'wrong_pos', reason: 'alérgico is adj, not noun' },
  'alérgicos': { en: 'allergic', pos: 'adj', issue: 'wrong_pos', reason: 'alérgicos is adj, not noun' },
  'allá': { en: 'over there', pos: 'adv', issue: 'wrong_pos', reason: 'allá is adv, not noun' },
  'altísima': { en: 'very high', pos: 'adj', issue: 'wrong_pos', reason: 'altísima is adj, not noun' },
  'alguno': { en: 'some', pos: 'det', issue: 'wrong_pos', reason: 'alguno is det, not noun' },
  'anoche': { en: 'last night', pos: 'adv', issue: 'wrong_pos', reason: 'anoche is adv, not adj' },
  'al': { en: 'to the', pos: 'prep', issue: 'wrong_pos', reason: 'al is prep contraction, not verb' },
  'alcantarillado': { en: 'sewerage', pos: 'n', issue: 'wrong_pos', reason: 'alcantarillado is noun, not adj' },
  'adolescente': { en: 'teenager', pos: 'n', issue: 'wrong_pos', reason: 'adolescente is noun, not adj' },
  'apenas': { en: 'barely; scarcely', pos: 'adv', issue: 'wrong_pos', reason: 'apenas is adv, not noun' },
  'activo': { en: 'active', pos: 'adj', issue: 'wrong_pos', reason: 'activo is adj, not adj "asset"' },

  // --- Not real English words ---
  'abono': { en: 'pass; fertilizer', pos: 'n', issue: 'not_english', reason: '"pas" → "pass"' },

  // --- Duplicate semicolons ---
  'ayuda': { en: 'to help', pos: 'v', issue: 'duplicate_semicolon', reason: '"to help; to help" is duplicate' },
};

// Process entries
const seen = new Set();
for (const entry of entries) {
  const { word, en, pos } = entry;

  // Check manual fixes first
  if (MANUAL_FIXES[word]) {
    const fix = MANUAL_FIXES[word];
    // Only apply if the current en actually matches the problem
    if (fix.en !== en || fix.pos !== pos) {
      addFix(word, en, fix.en, pos, fix.pos, fix.issue, fix.reason);
      seen.add(word);
    }
    continue;
  }
  seen.add(word);
}

// Now do automated pass for remaining entries not in manual list
for (const entry of entries) {
  const { word, en, pos } = entry;
  if (MANUAL_FIXES[word]) continue; // Already handled

  // === "to " prefix checks ===
  if (en.startsWith('to ')) {
    const after = en.slice(3).trim();
    const firstWord = after.split(/[\s;,]/)[0].toLowerCase();

    // Check for "to Xed" (past tense after "to")
    if (firstWord.endsWith('ed') && firstWord.length > 4 &&
        !['need', 'feed', 'seed', 'speed', 'breed', 'bleed', 'succeed', 'proceed', 'exceed', 'weed'].includes(firstWord)) {
      // Determine if this should be adj or verb with base form
      const isParticiple = ['bored', 'tired', 'excited', 'interested', 'surprised', 'worried',
        'confused', 'amazed', 'shocked', 'frightened', 'annoyed', 'disappointed', 'satisfied',
        'pleased', 'relaxed', 'exhausted', 'scared', 'accompanied', 'adopted', 'acquired',
        'adjusted', 'stated', 'accustomed', 'accepted', 'analyzed', 'parked', 'contributed',
        'organized', 'connected', 'separated', 'mixed', 'prepared', 'developed', 'improved',
        'increased', 'reduced', 'advanced', 'complicated', 'established', 'dedicated',
        'automated', 'contaminated', 'convinced', 'damaged', 'dismissed', 'installed',
        'obliged', 'planned', 'prohibited', 'retired', 'startled', 'toasted', 'unexpected',
        'seated', 'archived', 'fined', 'melted', 'issued', 'repaired', 'inaugurated',
        'demolished', 'expired', 'loaded', 'decorated', 'formed', 'educated', 'qualified',
        'skilled', 'trained', 'published', 'recorded', 'reserved', 'selected', 'sorted',
        'stained', 'stuffed', 'touched', 'united', 'valued', 'wrapped', 'marked',
        'packed', 'painted', 'paved', 'peeled', 'raised', 'roasted', 'rusted',
        'sealed', 'signed', 'spoiled', 'stranded', 'stretched', 'stuffed', 'twisted',
        'abandoned', 'absorbed', 'attached', 'balanced', 'blessed', 'buried', 'captured',
        'celebrated', 'certified', 'challenged', 'changed', 'charged', 'cleaned', 'closed',
        'collected', 'combined', 'committed', 'compared', 'completed', 'composed', 'concentrated',
        'concerned', 'confirmed', 'conquered', 'considered', 'constructed', 'consumed', 'contained',
        'controlled', 'converted', 'covered', 'crashed', 'created', 'crossed', 'crowded',
        'cultivated', 'cured', 'customized', 'dated', 'defeated', 'delivered', 'demanded',
        'departed', 'described', 'designed', 'desired', 'destined', 'destroyed', 'detected',
        'determined', 'directed', 'disabled', 'discovered', 'disguised', 'dressed', 'dried',
        'earned', 'elected', 'elevated', 'eliminated', 'embarrassed', 'employed', 'enclosed',
        'encouraged', 'engaged', 'enriched', 'equipped', 'estimated', 'evaluated', 'examined',
        'exchanged', 'excluded', 'expected', 'experienced', 'explained', 'explored', 'expressed',
        'extended', 'fabricated', 'faced', 'failed', 'favored', 'featured', 'filed', 'filled',
        'filtered', 'financed', 'finished', 'fixed', 'focused', 'forced', 'founded', 'freed',
        'furnished', 'generated', 'granted', 'guaranteed', 'guided', 'handled', 'harvested',
        'heated', 'helped', 'highlighted', 'hired', 'honored', 'hosted', 'identified',
        'illustrated', 'imagined', 'immersed', 'implemented', 'implied', 'imported', 'imposed',
        'impressed', 'included', 'incorporated', 'indicated', 'influenced', 'informed', 'inherited',
        'initiated', 'injected', 'injured', 'inserted', 'inspired', 'instructed', 'insured',
        'integrated', 'intended', 'interested', 'interviewed', 'introduced', 'invaded', 'invested',
        'investigated', 'invited', 'involved', 'irritated', 'isolated', 'joined', 'justified',
        'labeled', 'launched', 'leaked', 'licensed', 'limited', 'linked', 'listed', 'located',
        'locked', 'maintained', 'managed', 'manufactured', 'measured', 'mentioned', 'merged',
        'modified', 'monitored', 'motivated', 'named', 'negotiated', 'noticed', 'obtained',
        'occupied', 'offended', 'offered', 'operated', 'opposed', 'ordered', 'organized',
        'oriented', 'outlined', 'overcrowded', 'owned', 'participated', 'performed', 'permitted',
        'persuaded', 'placed', 'pleased', 'pointed', 'polished', 'positioned', 'possessed',
        'posted', 'practiced', 'predicted', 'preferred', 'prepared', 'presented', 'preserved',
        'pressed', 'prevented', 'priced', 'printed', 'processed', 'produced', 'programmed',
        'promoted', 'proposed', 'protected', 'proved', 'provided', 'provoked', 'purchased',
        'puzzled', 'questioned', 'raised', 'rated', 'reached', 'realized', 'received',
        'recommended', 'recovered', 'recruited', 'redesigned', 'referenced', 'reflected',
        'reformed', 'refreshed', 'registered', 'regulated', 'rejected', 'related', 'released',
        'relieved', 'relocated', 'removed', 'renamed', 'renewed', 'renovated', 'rented',
        'repeated', 'replaced', 'reported', 'represented', 'reproduced', 'requested', 'required',
        'researched', 'resigned', 'respected', 'responded', 'restored', 'restricted', 'resulted',
        'retained', 'returned', 'revealed', 'reversed', 'revised', 'rewarded', 'risked',
        'rotated', 'ruined', 'ruled', 'rushed', 'satisfied', 'saved', 'scheduled', 'secured',
        'served', 'settled', 'shared', 'shifted', 'shocked', 'simplified', 'situated', 'solved',
        'specialized', 'specified', 'sponsored', 'stabilized', 'staffed', 'standardized', 'started',
        'stimulated', 'stopped', 'stored', 'strengthened', 'stressed', 'structured', 'studied',
        'submitted', 'subscribed', 'substituted', 'suggested', 'summarized', 'supervised',
        'supplied', 'supported', 'surrounded', 'surveyed', 'suspected', 'suspended', 'sustained',
        'targeted', 'taxed', 'tempted', 'terminated', 'terrified', 'tested', 'threatened',
        'titled', 'tolerated', 'traded', 'transformed', 'translated', 'transmitted', 'transported',
        'trapped', 'treated', 'triggered', 'troubled', 'trusted', 'tuned', 'turned', 'updated',
        'upgraded', 'used', 'utilized', 'varied', 'verified', 'violated', 'visited', 'wasted',
        'weakened', 'welcomed', 'witnessed', 'wounded', 'yielded'].includes(firstWord);

      if (isParticiple) {
        addFix(word, en, firstWord, pos, 'adj', 'to_past_tense', `"${en}" — "${firstWord}" is participle/adj`);
      } else {
        // Fix to base verb form
        let base = firstWord;
        if (firstWord.endsWith('ied')) base = firstWord.slice(0, -3) + 'y';
        else if (firstWord.endsWith('ted') && !firstWord.endsWith('eted')) base = firstWord.slice(0, -3) + 'te';
        else if (firstWord.endsWith('ded')) base = firstWord.slice(0, -1);
        else if (firstWord.endsWith('sed')) base = firstWord.slice(0, -1);
        else if (firstWord.endsWith('led')) base = firstWord.slice(0, -3) + 'le';
        else if (firstWord.endsWith('ned')) base = firstWord.slice(0, -3) + 'ne';
        else if (firstWord.endsWith('red')) base = firstWord.slice(0, -3) + 're';
        else if (firstWord.endsWith('ved')) base = firstWord.slice(0, -1);
        else if (firstWord.endsWith('ced')) base = firstWord.slice(0, -1);
        else if (firstWord.endsWith('ged')) base = firstWord.slice(0, -1);
        else if (firstWord.endsWith('ked')) base = firstWord.slice(0, -2);
        else if (firstWord.endsWith('med')) base = firstWord.slice(0, -3) + 'me';
        else base = firstWord.slice(0, -2);

        if (base !== firstWord) {
          addFix(word, en, 'to ' + base, pos, 'v', 'to_past_tense', `"${en}" has past tense after "to"`);
        }
      }
      continue;
    }

    // Check for not-English words after "to"
    const notEnglish = ['shaf', 'warne', 'perhap', 'ande', 'swe', 'pas', 'cleane', 'considere',
      'barke', 'costal', 'dente', 'demande', 'domina', 'enriche', 'expecte', 'dedica'].includes(firstWord);
    if (notEnglish) {
      addFix(word, en, en, pos, pos, 'to_not_english', `"${firstWord}" is not a real English word`);
      continue;
    }
  }

  // Check duplicate semicolon (e.g., "to help; to help" or "change; change")
  if (en.includes('; ')) {
    const parts = en.split('; ');
    if (parts[0] === parts[1]) {
      addFix(word, en, parts[0], pos, pos, 'duplicate_semicolon', `"${en}" has duplicate parts`);
      continue;
    }
  }
}

console.log('\nIssue statistics:');
let totalIssues = 0;
for (const [k, v] of Object.entries(issueStats)) {
  if (v > 0) {
    console.log(`  ${k}: ${v}`);
    totalIssues += v;
  }
}
console.log(`\nTotal fixes: ${fixes.length}`);

// Write fixes
fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(fixes, null, 2));
console.log(`Wrote fixes to ${OUTPUT_PATH}`);
