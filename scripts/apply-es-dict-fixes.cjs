#!/usr/bin/env node
/**
 * Complete review + apply fixes for ALL Spanish dictionary entries.
 * Checks every single entry for all known issue types.
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
  entries.push({ word: m[1], en: m[2], ipa: m[3], pos: m[4] });
}
console.log(`Total entries parsed: ${entries.length}`);

// ============================================================
// COMPREHENSIVE MANUAL FIX MAP
// Key = Spanish word, Value = { en, pos, issue, reason }
// ============================================================
const FIXES = {
  // ====== NOUNS incorrectly with "to " prefix and pos='v' ======
  'águilas': { en: 'eagle', pos: 'n', issue: 'to_noun_not_verb' },
  'alojamiento': { en: 'accommodation', pos: 'n', issue: 'to_noun_not_verb' },
  'alquiler': { en: 'rent', pos: 'n', issue: 'to_noun_not_verb' },
  'amazonas': { en: 'Amazon', pos: 'n', issue: 'to_noun_not_verb' },
  'amenaza': { en: 'threat', pos: 'n', issue: 'to_noun_not_verb' },
  'amor': { en: 'love', pos: 'n', issue: 'to_noun_not_verb' },
  'andén': { en: 'platform', pos: 'n', issue: 'to_noun_not_verb' },
  'andes': { en: 'Andes', pos: 'n', issue: 'to_noun_not_verb' },
  'animales': { en: 'animal', pos: 'n', issue: 'to_noun_not_verb' },
  'anuncio': { en: 'advertisement', pos: 'n', issue: 'to_noun_not_verb' },
  'aprecio': { en: 'appreciation', pos: 'n', issue: 'to_noun_not_verb' },
  'arreglo': { en: 'arrangement', pos: 'n', issue: 'to_noun_not_verb' },
  'arrepentimiento': { en: 'repentance', pos: 'n', issue: 'to_noun_not_verb' },
  'arroyo': { en: 'stream', pos: 'n', issue: 'to_noun_not_verb' },
  'asignaturas': { en: 'subject', pos: 'n', issue: 'to_noun_not_verb' },
  'asilo': { en: 'asylum', pos: 'n', issue: 'to_noun_not_verb' },
  'aspiradora': { en: 'vacuum cleaner', pos: 'n', issue: 'to_noun_not_verb' },
  'atasco': { en: 'traffic jam', pos: 'n', issue: 'to_noun_not_verb' },
  'auditoría': { en: 'audit', pos: 'n', issue: 'to_noun_not_verb' },
  'barco': { en: 'ship', pos: 'n', issue: 'to_noun_not_verb' },
  'base': { en: 'base', pos: 'n', issue: 'to_noun_not_verb' },
  'bases': { en: 'base', pos: 'n', issue: 'to_noun_not_verb' },
  'biberón': { en: 'baby bottle', pos: 'n', issue: 'to_noun_not_verb' },
  'bloques': { en: 'block', pos: 'n', issue: 'to_noun_not_verb' },
  'cabeza': { en: 'head', pos: 'n', issue: 'to_noun_not_verb' },
  'cabo': { en: 'cape; end', pos: 'n', issue: 'to_noun_not_verb' },
  'calculo': { en: 'calculation', pos: 'n', issue: 'to_noun_not_verb' },
  'callejuelas': { en: 'alley', pos: 'n', issue: 'to_noun_not_verb' },
  'cansancio': { en: 'fatigue', pos: 'n', issue: 'to_noun_not_verb' },
  'cántaros': { en: 'pitcher', pos: 'n', issue: 'to_noun_not_verb' },
  'capa': { en: 'layer', pos: 'n', issue: 'to_noun_not_verb' },
  'carácter': { en: 'character', pos: 'n', issue: 'to_noun_not_verb' },
  'cargador': { en: 'charger', pos: 'n', issue: 'to_noun_not_verb' },
  'cascada': { en: 'waterfall', pos: 'n', issue: 'to_noun_not_verb' },
  'casco': { en: 'helmet', pos: 'n', issue: 'to_noun_not_verb' },
  'caso': { en: 'case', pos: 'n', issue: 'to_noun_not_verb' },
  'censura': { en: 'censorship', pos: 'n', issue: 'to_noun_not_verb' },
  'cicatriz': { en: 'scar', pos: 'n', issue: 'to_noun_not_verb' },
  'ciervos': { en: 'deer', pos: 'n', issue: 'to_noun_not_verb' },
  'cifras': { en: 'figure', pos: 'n', issue: 'to_noun_not_verb' },
  'collar': { en: 'necklace', pos: 'n', issue: 'to_noun_not_verb' },
  'colombia': { en: 'Colombia', pos: 'n', issue: 'to_noun_not_verb' },
  'comedor': { en: 'dining room', pos: 'n', issue: 'to_noun_not_verb' },
  'comentario': { en: 'comment', pos: 'n', issue: 'to_noun_not_verb' },
  'comercio': { en: 'trade; commerce', pos: 'n', issue: 'to_noun_not_verb' },
  'comida': { en: 'meal; food', pos: 'n', issue: 'to_noun_not_verb' },
  'compañera': { en: 'partner; companion', pos: 'n', issue: 'to_noun_not_verb' },
  'compañeros': { en: 'companion', pos: 'n', issue: 'to_noun_not_verb' },
  'compartimento': { en: 'compartment', pos: 'n', issue: 'to_noun_not_verb' },
  'compromiso': { en: 'commitment', pos: 'n', issue: 'to_noun_not_verb' },
  'comunicado': { en: 'press release', pos: 'n', issue: 'to_noun_not_verb' },
  'comunión': { en: 'communion', pos: 'n', issue: 'to_noun_not_verb' },
  'confianza': { en: 'trust; confidence', pos: 'n', issue: 'to_noun_not_verb' },
  'conflictos': { en: 'conflict', pos: 'n', issue: 'to_noun_not_verb' },
  'consumo': { en: 'consumption', pos: 'n', issue: 'to_noun_not_verb' },
  'crédito': { en: 'credit', pos: 'n', issue: 'to_noun_not_verb' },
  'crímenes': { en: 'crime', pos: 'n', issue: 'to_noun_not_verb' },
  'crisis': { en: 'crisis', pos: 'n', issue: 'to_noun_not_verb' },
  'criterios': { en: 'criterion', pos: 'n', issue: 'to_noun_not_verb' },
  'cuadra': { en: 'block', pos: 'n', issue: 'to_noun_not_verb' },
  'cumplimiento': { en: 'compliance', pos: 'n', issue: 'to_noun_not_verb' },
  'débito': { en: 'debit', pos: 'n', issue: 'to_noun_not_verb' },
  'decisiones': { en: 'decision', pos: 'n', issue: 'to_noun_not_verb' },
  'depósito': { en: 'deposit', pos: 'n', issue: 'to_noun_not_verb' },
  'descanso': { en: 'rest; break', pos: 'n', issue: 'to_noun_not_verb' },
  'descubrimientos': { en: 'discovery', pos: 'n', issue: 'to_noun_not_verb' },
  'dominio': { en: 'domain', pos: 'n', issue: 'to_noun_not_verb' },
  'ejercicio': { en: 'exercise', pos: 'n', issue: 'to_noun_not_verb' },
  'entrega': { en: 'delivery', pos: 'n', issue: 'to_noun_not_verb' },
  'estufa': { en: 'stove', pos: 'n', issue: 'to_noun_not_verb' },
  'felpudo': { en: 'doormat', pos: 'n', issue: 'to_noun_not_verb' },
  'fregadero': { en: 'sink', pos: 'n', issue: 'to_noun_not_verb' },
  'herida': { en: 'wound', pos: 'n', issue: 'to_noun_not_verb' },
  'huevos': { en: 'egg', pos: 'n', issue: 'to_noun_not_verb' },
  'mostrador': { en: 'counter', pos: 'n', issue: 'to_noun_not_verb' },
  'paquete': { en: 'package', pos: 'n', issue: 'to_noun_not_verb' },
  'paquetes': { en: 'package', pos: 'n', issue: 'to_noun_not_verb' },
  'recogida': { en: 'collection', pos: 'n', issue: 'to_noun_not_verb' },
  'rescate': { en: 'rescue', pos: 'n', issue: 'to_noun_not_verb' },
  'silencio': { en: 'silence', pos: 'n', issue: 'to_noun_not_verb' },
  'columpios': { en: 'swing', pos: 'n', issue: 'to_noun_not_verb' },
  'aviso': { en: 'warning; notice', pos: 'n', issue: 'to_noun_not_verb' },
  'cuentas': { en: 'account', pos: 'n', issue: 'to_noun_not_verb' },
  'logro': { en: 'achievement', pos: 'n', issue: 'to_noun_not_verb' },
  'logró': { en: 'to achieve', pos: 'v', issue: 'to_noun_not_verb', reason: '"to achievement" → "to achieve"' },
  'ventajas': { en: 'advantage', pos: 'n', issue: 'to_noun_not_verb' },
  'pasillo': { en: 'aisle; hallway', pos: 'n', issue: 'to_noun_not_verb' },
  'detenimiento': { en: 'care; detail', pos: 'n', issue: 'to_noun_not_verb', reason: 'detenimiento is noun, not "to arrest"' },
  'entrenador': { en: 'coach; trainer', pos: 'n', issue: 'to_noun_not_verb' },
  'cortesía': { en: 'courtesy', pos: 'n', issue: 'to_noun_not_verb' },
  'crema': { en: 'cream', pos: 'n', issue: 'to_noun_not_verb' },
  'factores': { en: 'factor', pos: 'n', issue: 'to_noun_not_verb' },
  'intento': { en: 'attempt', pos: 'n', issue: 'to_noun_not_verb', reason: 'intento is noun "attempt"' },
  'queja': { en: 'complaint', pos: 'n', issue: 'to_noun_not_verb' },
  'quejas': { en: 'complaint', pos: 'n', issue: 'to_noun_not_verb' },
  'daño': { en: 'damage', pos: 'n', issue: 'to_noun_not_verb' },
  'danza': { en: 'dance', pos: 'n', issue: 'to_noun_not_verb' },
  'debate': { en: 'debate', pos: 'n', issue: 'to_noun_not_verb' },
  'detalle': { en: 'detail', pos: 'n', issue: 'to_noun_not_verb' },
  'detalles': { en: 'detail', pos: 'n', issue: 'to_noun_not_verb' },
  'salsa': { en: 'sauce; salsa', pos: 'n', issue: 'to_noun_not_verb', reason: '"to dip" — salsa is noun' },
  'doble': { en: 'double', pos: 'adj', issue: 'to_noun_not_verb' },
  'gotas': { en: 'drop', pos: 'n', issue: 'to_noun_not_verb' },
  'vivienda': { en: 'housing; dwelling', pos: 'n', issue: 'to_noun_not_verb', reason: '"to dwell" — vivienda is noun' },
  'experiencia': { en: 'experience', pos: 'n', issue: 'to_noun_not_verb' },
  'experiencias': { en: 'experience', pos: 'n', issue: 'to_noun_not_verb' },
  'excusas': { en: 'excuse', pos: 'n', issue: 'to_noun_not_verb' },
  'vendaje': { en: 'bandage', pos: 'n', issue: 'to_noun_not_verb' },
  'tos': { en: 'cough', pos: 'n', issue: 'to_noun_not_verb' },
  'ganado': { en: 'cattle; livestock', pos: 'n', issue: 'to_noun_not_verb' },
  'reto': { en: 'challenge', pos: 'n', issue: 'to_noun_not_verb' },
  'mando': { en: 'command; control', pos: 'n', issue: 'to_noun_not_verb' },
  'consumidores': { en: 'consumer', pos: 'n', issue: 'to_noun_not_verb' },
  'culpa': { en: 'blame; fault', pos: 'n', issue: 'to_noun_not_verb' },
  'junta': { en: 'board; meeting', pos: 'n', issue: 'to_noun_not_verb' },
  'negro': { en: 'black', pos: 'adj', issue: 'to_adj_not_verb' },
  'ducha': { en: 'shower', pos: 'n', issue: 'to_noun_not_verb' },
  'echo': { en: 'throw; miss', pos: 'n', issue: 'to_noun_not_verb', reason: 'echo as standalone = throw/miss (echar form)' },
  'ganas': { en: 'desire; eagerness', pos: 'n', issue: 'to_noun_not_verb' },
  'cumplido': { en: 'compliment', pos: 'n', issue: 'to_noun_not_verb' },
  'cumplidos': { en: 'compliment', pos: 'n', issue: 'to_noun_not_verb' },
  'recortes': { en: 'cut; clipping', pos: 'n', issue: 'to_noun_not_verb' },

  // ====== ADJECTIVES incorrectly with "to " prefix ======
  'abierta': { en: 'open', pos: 'adj', issue: 'to_adj_not_verb' },
  'abiertas': { en: 'open', pos: 'adj', issue: 'to_adj_not_verb' },
  'abierto': { en: 'open', pos: 'adj', issue: 'to_adj_not_verb' },
  'aburrida': { en: 'bored', pos: 'adj', issue: 'to_adj_not_verb' },
  'aburrido': { en: 'bored', pos: 'adj', issue: 'to_adj_not_verb' },
  'amarillo': { en: 'yellow', pos: 'adj', issue: 'to_adj_not_verb' },
  'casera': { en: 'homemade', pos: 'adj', issue: 'to_adj_not_verb' },
  'central': { en: 'central', pos: 'adj', issue: 'to_adj_not_verb' },
  'cognitivas': { en: 'cognitive', pos: 'adj', issue: 'to_adj_not_verb' },
  'comercial': { en: 'commercial', pos: 'adj', issue: 'to_adj_not_verb' },
  'cómoda': { en: 'comfortable', pos: 'adj', issue: 'to_adj_not_verb' },
  'cómodas': { en: 'comfortable', pos: 'adj', issue: 'to_adj_not_verb' },
  'cómodo': { en: 'comfortable', pos: 'adj', issue: 'to_adj_not_verb' },
  'cómodos': { en: 'comfortable', pos: 'adj', issue: 'to_adj_not_verb' },
  'confidenciales': { en: 'confidential', pos: 'adj', issue: 'to_adj_not_verb' },
  'acompañado': { en: 'accompanied', pos: 'adj', issue: 'to_adj_not_verb' },
  'adoptado': { en: 'adopted', pos: 'adj', issue: 'to_adj_not_verb' },
  'adquirida': { en: 'acquired', pos: 'adj', issue: 'to_adj_not_verb' },
  'conservadora': { en: 'conservative', pos: 'adj', issue: 'to_adj_not_verb' },
  'dormido': { en: 'asleep', pos: 'adj', issue: 'to_adj_not_verb' },
  'impresionante': { en: 'awesome; impressive', pos: 'adj', issue: 'to_adj_not_verb' },
  'morena': { en: 'brunette; dark-haired', pos: 'adj', issue: 'to_adj_not_verb' },
  'correcto': { en: 'correct', pos: 'adj', issue: 'to_adj_not_verb' },
  'correctamente': { en: 'correctly', pos: 'adv', issue: 'to_adj_not_verb' },
  'decisivo': { en: 'decisive', pos: 'adj', issue: 'to_adj_not_verb' },
  'educativo': { en: 'educational', pos: 'adj', issue: 'to_adj_not_verb' },
  'educativos': { en: 'educational', pos: 'adj', issue: 'to_adj_not_verb' },
  'cualquier': { en: 'any', pos: 'det', issue: 'to_adj_not_verb' },
  'preocupado': { en: 'worried; concerned', pos: 'adj', issue: 'to_adj_not_verb' },
  'mejores': { en: 'better; best', pos: 'adj', issue: 'to_adj_not_verb' },
  'debido': { en: 'due; owed', pos: 'adj', issue: 'to_adj_not_verb' },
  'incluso': { en: 'even; including', pos: 'adv', issue: 'to_adj_not_verb' },

  // ====== "to " + past tense → fix to base form or adjective ======
  'abrocháramos': { en: 'to fasten', pos: 'v', issue: 'to_past_tense' },
  'afirmó': { en: 'to affirm', pos: 'v', issue: 'to_past_tense' },
  'aseguró': { en: 'to assure', pos: 'v', issue: 'to_past_tense' },
  'causó': { en: 'to cause', pos: 'v', issue: 'to_past_tense' },
  'cobrado': { en: 'to charge', pos: 'v', issue: 'to_past_tense' },
  'cancelado': { en: 'to cancel', pos: 'v', issue: 'to_past_tense' },
  'canceló': { en: 'to cancel', pos: 'v', issue: 'to_past_tense' },
  'compensaba': { en: 'to compensate', pos: 'v', issue: 'to_past_tense' },
  'considerado': { en: 'to consider', pos: 'v', issue: 'to_past_tense' },
  'confundido': { en: 'confused', pos: 'adj', issue: 'to_past_tense' },
  'convencido': { en: 'convinced', pos: 'adj', issue: 'to_past_tense' },
  'dañado': { en: 'damaged', pos: 'adj', issue: 'to_past_tense' },
  'dedicado': { en: 'dedicated', pos: 'adj', issue: 'to_past_tense' },
  'despedido': { en: 'fired; dismissed', pos: 'adj', issue: 'to_past_tense' },
  'engañado': { en: 'to cheat', pos: 'v', issue: 'to_past_tense' },
  'establecidas': { en: 'established', pos: 'adj', issue: 'to_past_tense' },
  'establecido': { en: 'established', pos: 'adj', issue: 'to_past_tense' },
  'establecidos': { en: 'established', pos: 'adj', issue: 'to_past_tense' },
  'instalado': { en: 'installed', pos: 'adj', issue: 'to_past_tense' },
  'obligado': { en: 'obliged', pos: 'adj', issue: 'to_past_tense' },
  'planificado': { en: 'planned', pos: 'adj', issue: 'to_past_tense' },
  'prohibidas': { en: 'prohibited', pos: 'adj', issue: 'to_past_tense' },
  'retirado': { en: 'retired', pos: 'adj', issue: 'to_past_tense' },
  'sobresaltado': { en: 'startled', pos: 'adj', issue: 'to_past_tense' },
  'tostado': { en: 'toasted', pos: 'adj', issue: 'to_past_tense' },
  'automatizado': { en: 'automated', pos: 'adj', issue: 'to_past_tense' },
  'inesperado': { en: 'unexpected', pos: 'adj', issue: 'to_past_tense' },
  'contaminados': { en: 'contaminated', pos: 'adj', issue: 'to_past_tense' },
  'desarrollados': { en: 'developed', pos: 'adj', issue: 'to_past_tense' },
  'complicada': { en: 'complicated', pos: 'adj', issue: 'to_past_tense' },
  'complicado': { en: 'complicated', pos: 'adj', issue: 'to_past_tense' },
  'sentados': { en: 'seated', pos: 'adj', issue: 'to_past_tense' },
  'archivados': { en: 'archived', pos: 'adj', issue: 'to_past_tense' },
  'multados': { en: 'fined', pos: 'adj', issue: 'to_past_tense' },
  'derribado': { en: 'demolished', pos: 'adj', issue: 'to_past_tense' },
  'derretido': { en: 'melted', pos: 'adj', issue: 'to_past_tense' },
  'emitida': { en: 'issued', pos: 'adj', issue: 'to_past_tense' },
  'reparada': { en: 'repaired', pos: 'adj', issue: 'to_past_tense' },
  'inaugurada': { en: 'inaugurated', pos: 'adj', issue: 'to_past_tense' },
  'aburrieron': { en: 'to bore', pos: 'v', issue: 'to_past_tense' },
  'aprobada': { en: 'to approve', pos: 'v', issue: 'to_past_tense' },
  'aprobado': { en: 'to approve', pos: 'v', issue: 'to_past_tense' },
  'aprobó': { en: 'to approve', pos: 'v', issue: 'to_past_tense' },
  'ascendieron': { en: 'to ascend', pos: 'v', issue: 'to_past_tense' },
  'quemé': { en: 'to burn', pos: 'v', issue: 'to_past_tense' },
  'limpiaba': { en: 'to clean', pos: 'v', issue: 'to_past_tense' },
  'limpié': { en: 'to clean', pos: 'v', issue: 'to_past_tense' },
  'quejaron': { en: 'to complain', pos: 'v', issue: 'to_past_tense' },
  'concluida': { en: 'to conclude', pos: 'v', issue: 'to_past_tense' },
  'siguió': { en: 'to follow', pos: 'v', issue: 'to_past_tense' },
  'seguido': { en: 'to follow', pos: 'v', issue: 'to_past_tense' },
  'decepcionó': { en: 'to disappoint', pos: 'v', issue: 'to_past_tense' },
  'descubrí': { en: 'to discover', pos: 'v', issue: 'to_past_tense' },
  'descubrimos': { en: 'to discover', pos: 'v', issue: 'to_past_tense' },
  'discutimos': { en: 'to discuss', pos: 'v', issue: 'to_past_tense' },
  'vistieron': { en: 'to dress', pos: 'v', issue: 'to_past_tense' },
  'dudaba': { en: 'to doubt', pos: 'v', issue: 'to_past_tense' },
  'estalló': { en: 'to explode', pos: 'v', issue: 'to_past_tense' },
  'venció': { en: 'to defeat; to expire', pos: 'v', issue: 'to_past_tense' },
  'despidieron': { en: 'to fire', pos: 'v', issue: 'to_past_tense' },
  'despidió': { en: 'to fire', pos: 'v', issue: 'to_past_tense' },
  'cumplí': { en: 'to fulfill', pos: 'v', issue: 'to_past_tense' },
  'cumplieron': { en: 'to fulfill', pos: 'v', issue: 'to_past_tense' },
  'odiaba': { en: 'to hate', pos: 'v', issue: 'to_past_tense' },
  'heredé': { en: 'to inherit', pos: 'v', issue: 'to_past_tense' },
  'insistí': { en: 'to insist', pos: 'v', issue: 'to_past_tense' },
  'insistido': { en: 'to insist', pos: 'v', issue: 'to_past_tense' },
  'insistió': { en: 'to insist', pos: 'v', issue: 'to_past_tense' },
  'interpretó': { en: 'to interpret', pos: 'v', issue: 'to_past_tense' },
  'durado': { en: 'to last', pos: 'v', issue: 'to_past_tense' },
  'gustaban': { en: 'to like', pos: 'v', issue: 'to_past_tense' },
  'gustado': { en: 'to like', pos: 'v', issue: 'to_past_tense' },
  'permitio': { en: 'to allow', pos: 'v', issue: 'to_past_tense' },
  'procedió': { en: 'to proceed', pos: 'v', issue: 'to_past_tense' },
  'prometí': { en: 'to promise', pos: 'v', issue: 'to_past_tense' },
  'prometió': { en: 'to promise', pos: 'v', issue: 'to_past_tense' },
  'redujeron': { en: 'to reduce', pos: 'v', issue: 'to_past_tense' },
  'reprochó': { en: 'to reproach', pos: 'v', issue: 'to_past_tense' },
  'rescatamos': { en: 'to rescue', pos: 'v', issue: 'to_past_tense' },
  'resolvió': { en: 'to resolve', pos: 'v', issue: 'to_past_tense' },
  'repasaron': { en: 'to review', pos: 'v', issue: 'to_past_tense' },
  'remamos': { en: 'to row', pos: 'v', issue: 'to_past_tense' },
  'parecía': { en: 'to seem', pos: 'v', issue: 'to_past_tense' },
  'pareció': { en: 'to seem', pos: 'v', issue: 'to_past_tense' },
  'gritaron': { en: 'to shout', pos: 'v', issue: 'to_past_tense' },
  'solucioné': { en: 'to solve', pos: 'v', issue: 'to_past_tense' },
  'sumergió': { en: 'to submerge', pos: 'v', issue: 'to_past_tense' },
  'convocaron': { en: 'to summon', pos: 'v', issue: 'to_past_tense' },
  'superó': { en: 'to surpass', pos: 'v', issue: 'to_past_tense' },
  'sorprendió': { en: 'to surprise', pos: 'v', issue: 'to_past_tense' },
  'recorrimos': { en: 'to tour', pos: 'v', issue: 'to_past_tense' },
  'tropecé': { en: 'to trip', pos: 'v', issue: 'to_past_tense' },
  'querido': { en: 'dear; beloved', pos: 'adj', issue: 'to_past_tense' },
  'quise': { en: 'to want', pos: 'v', issue: 'to_past_tense' },
  'quiso': { en: 'to want', pos: 'v', issue: 'to_past_tense' },
  'preocupó': { en: 'to worry', pos: 'v', issue: 'to_past_tense' },
  'recurrieron': { en: 'to appeal', pos: 'v', issue: 'to_past_tense' },
  'quedamos': { en: 'to agree; to stay', pos: 'v', issue: 'to_past_tense' },
  'merecíamos': { en: 'to deserve', pos: 'v', issue: 'to_past_tense' },
  'mereció': { en: 'to deserve', pos: 'v', issue: 'to_past_tense' },
  'descendido': { en: 'to descend', pos: 'v', issue: 'to_past_tense' },
  'despertó': { en: 'to wake up', pos: 'v', issue: 'to_past_tense', reason: '"to awoke" → "to wake up"' },

  // ====== Garbled question translations ======
  '¿oyes': { en: 'to hear', pos: 'v', issue: 'to_garbled' },
  '¿prefieres': { en: 'to prefer', pos: 'v', issue: 'to_garbled' },
  '¿recibiste': { en: 'to receive', pos: 'v', issue: 'to_garbled' },
  '¿sabe': { en: 'to know', pos: 'v', issue: 'to_garbled' },
  '¿fuiste': { en: 'to be; to go', pos: 'v', issue: 'to_garbled' },
  '¿has': { en: 'to have', pos: 'v', issue: 'to_garbled' },
  '¿sigues': { en: 'to follow', pos: 'v', issue: 'to_garbled' },
  '¿vas': { en: 'to go', pos: 'v', issue: 'to_garbled' },
  '¿ves': { en: 'to see', pos: 'v', issue: 'to_garbled' },
  '¿viene': { en: 'to come', pos: 'v', issue: 'to_garbled' },
  '¿vives': { en: 'to live', pos: 'v', issue: 'to_garbled' },
  'acuerdas': { en: 'to remember', pos: 'v', issue: 'to_garbled' },

  // ====== Not English words ======
  'afeita': { en: 'to shave', pos: 'v', issue: 'to_not_english', reason: '"to shaf"' },
  'acaso': { en: 'perhaps', pos: 'adv', issue: 'to_not_english', reason: '"to perhap"' },
  'avisó': { en: 'to warn', pos: 'v', issue: 'to_not_english', reason: '"to warne"' },
  'aprobarás': { en: 'to pass', pos: 'v', issue: 'to_not_english', reason: '"to pas"' },
  'abono': { en: 'pass; fertilizer', pos: 'n', issue: 'not_english', reason: '"pas" → "pass"' },
  'aduana': { en: 'customs', pos: 'n', issue: 'not_english', reason: '"custom" → "customs"' },
  'acrobacia': { en: 'acrobatics', pos: 'n', issue: 'not_english', reason: '"acrobatic" → "acrobatics"' },

  // ====== Semantic errors (wrong translation) ======
  'acostumbré': { en: 'to get used to', pos: 'v', issue: 'to_semantic_error' },
  'acostumbró': { en: 'to get accustomed', pos: 'v', issue: 'to_semantic_error' },
  'acordé': { en: 'to agree', pos: 'v', issue: 'to_semantic_error', reason: '"to chord" is wrong' },
  'actual': { en: 'current', pos: 'adj', issue: 'to_semantic_error' },
  'actuales': { en: 'current', pos: 'adj', issue: 'to_semantic_error' },
  'actualicemos': { en: 'to update', pos: 'v', issue: 'to_semantic_error' },
  'adaptador': { en: 'adapter', pos: 'n', issue: 'to_semantic_error' },
  'alegró': { en: 'to be glad', pos: 'v', issue: 'to_semantic_error' },
  'alentadores': { en: 'encouraging', pos: 'adj', issue: 'to_semantic_error' },
  'acabamos': { en: 'to finish', pos: 'v', issue: 'to_semantic_error' },
  'acabó': { en: 'to finish', pos: 'v', issue: 'to_semantic_error' },
  'acabo': { en: 'to finish', pos: 'v', issue: 'to_semantic_error' },
  'asusta': { en: 'to scare', pos: 'v', issue: 'to_semantic_error', reason: '"to scary"' },
  'cobró': { en: 'to charge', pos: 'v', issue: 'to_semantic_error', reason: '"to collection"' },
  'abarca': { en: 'to encompass', pos: 'v', issue: 'to_semantic_error' },
  'conocido': { en: 'well-known', pos: 'adj', issue: 'to_semantic_error' },
  'comienzo': { en: 'beginning', pos: 'n', issue: 'to_semantic_error', reason: '"to eat" — comienzo is noun' },
  'comoquiera': { en: 'anyway', pos: 'adv', issue: 'to_semantic_error' },
  'aprendizaje': { en: 'learning', pos: 'n', issue: 'to_semantic_error' },
  'cambio': { en: 'change', pos: 'n', issue: 'to_semantic_error' },
  'cambios': { en: 'change', pos: 'n', issue: 'to_semantic_error' },
  'crianza': { en: 'upbringing', pos: 'n', issue: 'to_semantic_error' },
  'bebida': { en: 'drink; beverage', pos: 'n', issue: 'to_semantic_error' },
  'bebidas': { en: 'drink; beverage', pos: 'n', issue: 'to_semantic_error' },
  'arañazos': { en: 'scratch', pos: 'n', issue: 'to_semantic_error' },
  'competencias': { en: 'competition; skill', pos: 'n', issue: 'to_semantic_error' },
  'competitivo': { en: 'competitive', pos: 'adj', issue: 'to_semantic_error' },
  'competitivos': { en: 'competitive', pos: 'adj', issue: 'to_semantic_error' },
  'compras': { en: 'shopping; purchases', pos: 'n', issue: 'to_semantic_error' },
  'compruebo': { en: 'to check', pos: 'v', issue: 'to_semantic_error', reason: '"to buy" is wrong' },
  'cocinera': { en: 'cook; chef', pos: 'n', issue: 'to_semantic_error' },
  'bronca': { en: 'argument; row', pos: 'n', issue: 'to_semantic_error' },
  'bienvenidos': { en: 'welcome', pos: 'adj', issue: 'to_semantic_error' },
  'callada': { en: 'quiet; silent', pos: 'adj', issue: 'to_semantic_error' },
  'confusa': { en: 'confusing', pos: 'adj', issue: 'to_semantic_error' },
  'beneficios': { en: 'benefit; profit', pos: 'n', issue: 'to_semantic_error' },
  'harto': { en: 'fed up', pos: 'adj', issue: 'to_semantic_error', reason: '"to feed" is wrong' },
  'causas': { en: 'cause', pos: 'n', issue: 'to_semantic_error' },
  'carga': { en: 'load; charge', pos: 'n', issue: 'to_semantic_error' },
  'adónde': { en: 'where to', pos: 'adv', issue: 'to_semantic_error' },
  'arregló': { en: 'to fix', pos: 'v', issue: 'to_semantic_error', reason: '"to arrangement" → "to fix"' },
  'marcaron': { en: 'to score', pos: 'v', issue: 'to_semantic_error', reason: '"to score" — actually OK but was not a verb-to issue' },
  'cicatrizado': { en: 'scarred; healed', pos: 'adj', issue: 'to_semantic_error', reason: '"to scar" — cicatrizado is adj' },
  'sonríe': { en: 'to smile', pos: 'v', issue: null },  // OK - smile IS a verb
  'sonrió': { en: 'to smile', pos: 'v', issue: null },  // OK
  'encantaría': { en: 'to love', pos: 'v', issue: null }, // OK in context
  'mandó': { en: 'to order; to send', pos: 'v', issue: 'to_semantic_error', reason: 'mandó is verb form, not "to command"' },
  'delegado': { en: 'delegate', pos: 'n', issue: 'to_noun_not_verb' },
  'ochocientos': { en: 'eight hundred', pos: 'n', issue: 'to_semantic_error', reason: '"to eight hundred" — number, not verb' },
  'abrazo': { en: 'hug', pos: 'n', issue: 'to_noun_not_verb' },

  // Entries where "to X" but the Spanish word is clearly from a different verb/noun
  'hechas': { en: 'done; made', pos: 'adj', issue: 'to_semantic_error', reason: '"to done, made, fact" — hechas is adj' },
  'hecho': { en: 'done; made; fact', pos: 'n', issue: 'to_semantic_error', reason: '"to done, made, fact" — hecho is noun/adj' },
  'sido': { en: 'to be', pos: 'v', issue: 'to_semantic_error', reason: '"to been" → "to be"' },
  'podido': { en: 'to be able', pos: 'v', issue: 'to_semantic_error', reason: '"to been able" → "to be able"' },

  // ====== Wrong POS entries ======
  'acceso': { en: 'access', pos: 'n', issue: 'wrong_pos' },
  'accidente': { en: 'accident', pos: 'n', issue: 'wrong_pos' },
  'académica': { en: 'academic', pos: 'adj', issue: 'wrong_pos' },
  'accedan': { en: 'to access', pos: 'v', issue: 'wrong_pos' },
  'adaptar': { en: 'to adapt', pos: 'v', issue: 'wrong_pos' },
  'adelante': { en: 'forward', pos: 'adv', issue: 'wrong_pos' },
  'además': { en: 'moreover; besides', pos: 'adv', issue: 'wrong_pos' },
  'absoluto': { en: 'absolute', pos: 'adj', issue: 'wrong_pos' },
  'acogedor': { en: 'cozy', pos: 'adj', issue: 'wrong_pos' },
  'adversas': { en: 'adverse', pos: 'adj', issue: 'wrong_pos' },
  'agotador': { en: 'exhausting', pos: 'adj', issue: 'wrong_pos' },
  'agotadora': { en: 'exhausting', pos: 'adj', issue: 'wrong_pos' },
  'agotadas': { en: 'exhausted', pos: 'adj', issue: 'wrong_pos' },
  'alérgico': { en: 'allergic', pos: 'adj', issue: 'wrong_pos' },
  'alérgicos': { en: 'allergic', pos: 'adj', issue: 'wrong_pos' },
  'allá': { en: 'over there', pos: 'adv', issue: 'wrong_pos' },
  'altísima': { en: 'very high', pos: 'adj', issue: 'wrong_pos' },
  'alguno': { en: 'some', pos: 'det', issue: 'wrong_pos' },
  'anoche': { en: 'last night', pos: 'adv', issue: 'wrong_pos' },
  'al': { en: 'to the', pos: 'prep', issue: 'wrong_pos' },
  'alcantarillado': { en: 'sewerage', pos: 'n', issue: 'wrong_pos' },
  'adolescente': { en: 'teenager', pos: 'n', issue: 'wrong_pos' },
  'apenas': { en: 'barely; scarcely', pos: 'adv', issue: 'wrong_pos' },
  'activo': { en: 'active', pos: 'adj', issue: 'wrong_pos' },

  // ====== Duplicate semicolons ======
  // Will be caught by automated pass
};

const issueStats = {};
const fixes = [];

function addFix(word, current_en, fixed_en, current_pos, fixed_pos, issue) {
  fixes.push({ word, current_en, fixed_en, current_pos, fixed_pos, issue });
  issueStats[issue] = (issueStats[issue] || 0) + 1;
}

// Process all entries
for (const entry of entries) {
  const { word, en, pos } = entry;

  // Check manual fix
  if (FIXES[word] && FIXES[word].issue !== null) {
    const fix = FIXES[word];
    // Only apply if there's actually a change
    if (fix.en !== en || fix.pos !== pos) {
      addFix(word, en, fix.en, pos, fix.pos, fix.issue);
    }
    continue;
  }

  // Skip manually verified OK entries
  if (FIXES[word] && FIXES[word].issue === null) continue;

  // Automated: duplicate semicolons
  if (en.includes('; ')) {
    const parts = en.split('; ');
    if (parts[0] === parts[1]) {
      addFix(word, en, parts[0], pos, pos, 'duplicate_semicolon');
      continue;
    }
  }

  // Automated: remaining "to Xed" patterns not in manual list
  if (en.startsWith('to ')) {
    const after = en.slice(3).trim();
    const fw = after.split(/[\s;,]/)[0];
    if (fw.endsWith('ed') && fw.length > 4 &&
        !['need', 'feed', 'seed', 'speed', 'breed', 'bleed', 'succeed', 'proceed', 'exceed', 'weed'].includes(fw)) {
      // Base form
      let base = fw;
      if (fw.endsWith('ied')) base = fw.slice(0, -3) + 'y';
      else if (fw.endsWith('ated')) base = fw.slice(0, -1);
      else if (fw.endsWith('eted')) base = fw.slice(0, -1);
      else if (fw.endsWith('ited')) base = fw.slice(0, -1);
      else if (fw.endsWith('uted')) base = fw.slice(0, -1);
      else if (fw.endsWith('oted')) base = fw.slice(0, -1);
      else if (fw.endsWith('ted')) base = fw.slice(0, -2);
      else if (fw.endsWith('ded')) base = fw.slice(0, -1);
      else if (fw.endsWith('sed')) base = fw.slice(0, -1);
      else if (fw.endsWith('led')) base = fw.slice(0, -3) + 'le';
      else if (fw.endsWith('ned')) base = fw.slice(0, -3) + 'ne';
      else if (fw.endsWith('red')) base = fw.slice(0, -3) + 're';
      else if (fw.endsWith('ved')) base = fw.slice(0, -1);
      else if (fw.endsWith('ced')) base = fw.slice(0, -1);
      else if (fw.endsWith('ged')) base = fw.slice(0, -1);
      else if (fw.endsWith('ked')) base = fw.slice(0, -2);
      else if (fw.endsWith('med')) base = fw.slice(0, -3) + 'me';
      else if (fw.endsWith('ped')) base = fw.slice(0, -3) + 'pe';
      else base = fw.slice(0, -2);

      if (base !== fw) {
        addFix(word, en, 'to ' + base, pos, 'v', 'to_past_tense');
      }
      continue;
    }

    // "to Xing" gerund patterns
    if (fw.endsWith('ing') && fw.length > 5 && fw !== 'bring' && fw !== 'sing' && fw !== 'ring' && fw !== 'string' && fw !== 'spring' && fw !== 'swing' && fw !== 'cling' && fw !== 'sting') {
      let base = fw.slice(0, -3);
      // running → run (double consonant)
      if (/([^aeiou])\1$/.test(base)) base = base.slice(0, -1);
      // making → make (silent e)
      else if (base.endsWith('at') || base.endsWith('ak') || base.endsWith('id') || base.endsWith('iv') ||
               base.endsWith('os') || base.endsWith('iz') || base.endsWith('us') || base.endsWith('am') ||
               base.endsWith('it') || base.endsWith('op') || base.endsWith('ov') || base.endsWith('un') ||
               base.endsWith('ur') || base.endsWith('ut') || base.endsWith('ad') || base.endsWith('ag')) {
        base = base + 'e';
      }
      addFix(word, en, 'to ' + base, pos, 'v', 'to_gerund');
      continue;
    }
  }
}

// Stats
console.log('\nIssue statistics:');
let total = 0;
for (const [k, v] of Object.entries(issueStats).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${k}: ${v}`);
  total += v;
}
console.log(`\nTotal fixes: ${total}`);

// Write fixes JSON
fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(fixes, null, 2));
console.log(`Wrote ${OUTPUT_PATH}`);

// ============================================================
// APPLY FIXES TO DICTIONARY FILE
// ============================================================
let modified = raw;
let appliedCount = 0;

for (const fix of fixes) {
  // Build regex to find the entry and replace en and pos
  const escaped = fix.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const enEscaped = fix.current_en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const posEscaped = fix.current_pos.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Match: 'word': { en: 'current_en', ipa: '...', pos: 'current_pos'
  const pattern = new RegExp(
    `('${escaped}':\\s*\\{\\s*en:\\s*)'${enEscaped}'(,\\s*ipa:\\s*'[^']*',\\s*pos:\\s*)'${posEscaped}'`,
  );

  const fixedEn = fix.fixed_en.replace(/'/g, "\\'");
  const replacement = `$1'${fixedEn}'$2'${fix.fixed_pos}'`;

  if (pattern.test(modified)) {
    modified = modified.replace(pattern, replacement);
    appliedCount++;
  } else {
    console.log(`WARNING: Could not find pattern for "${fix.word}" (en: "${fix.current_en}", pos: "${fix.current_pos}")`);
  }
}

fs.writeFileSync(DICT_PATH, modified);
console.log(`\nApplied ${appliedCount}/${fixes.length} fixes to ${DICT_PATH}`);
