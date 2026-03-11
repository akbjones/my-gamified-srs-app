#!/usr/bin/env node
/**
 * fix-pos-es.cjs
 *
 * Fixes ~103 misclassified entries in src/data/dictionary/es.ts.
 * (Actual count: 97 entries across accented and unaccented variants.)
 * A prior auto-generation script matched words to the nearest verb by prefix,
 * causing many nouns to be tagged as pos:"v" with wrong translations.
 *
 * Categories fixed:
 *  1. Words ending in -ción/-sión (nouns wrongly tagged as verbs)
 *  2. Words ending in -ón that are nouns (camión, canción, salón, etc.)
 *  3. Words ending in -ería (shops/places, all nouns)
 *  4. Words ending in -ía that are clearly nouns (alegría, compañía, etc.)
 *  5. Other specific fixes (café, estrés, comité, abrigo, abril, etc.)
 */

const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'src', 'data', 'dictionary', 'es.ts');

// ── Comprehensive fixes map ──────────────────────────────────────────────────
// Key = Spanish word exactly as it appears in the dictionary
// Value = { en: correct English translation, pos: correct part of speech }

const FIXES = {
  // ═══════════════════════════════════════════════════════════════════════════
  // 1. Words ending in -ción/-sión  (ALL are nouns)
  // ═══════════════════════════════════════════════════════════════════════════

  // Currently pos:"v" → should be pos:"n" with correct noun translation
  // -- Unaccented variants --
  "comunicacion":    { en: "communication", pos: "n" },
  "decision":        { en: "decision", pos: "n" },
  "explicacion":     { en: "explanation", pos: "n" },
  "formacion":       { en: "training / education", pos: "n" },
  "habitacion":      { en: "room / bedroom", pos: "n" },
  "informacion":     { en: "information", pos: "n" },
  "negociacion":     { en: "negotiation", pos: "n" },
  "opinion":         { en: "opinion", pos: "n" },
  "pasion":          { en: "passion", pos: "n" },
  "situacion":       { en: "situation", pos: "n" },

  // -- Accented -ción variants --
  "actualización":   { en: "update", pos: "n" },
  "actuación":       { en: "performance / acting", pos: "n" },
  "adaptación":      { en: "adaptation", pos: "n" },
  "alimentación":    { en: "food / nutrition", pos: "n" },
  "ambición":        { en: "ambition", pos: "n" },
  "aplicación":      { en: "application", pos: "n" },
  "aprobación":      { en: "approval", pos: "n" },
  "cancelación":     { en: "cancellation", pos: "n" },
  "comunicación":    { en: "communication", pos: "n" },
  "concentración":   { en: "concentration", pos: "n" },
  "construcción":    { en: "construction", pos: "n" },
  "contribución":    { en: "contribution", pos: "n" },
  "conversación":    { en: "conversation", pos: "n" },
  "corrupción":      { en: "corruption", pos: "n" },
  "decepción":       { en: "disappointment", pos: "n" },
  "declaración":     { en: "declaration / statement", pos: "n" },
  "dedicación":      { en: "dedication", pos: "n" },
  "duración":        { en: "duration", pos: "n" },
  "educación":       { en: "education", pos: "n" },
  "estación":        { en: "station / season", pos: "n" },
  "evaluación":      { en: "evaluation", pos: "n" },
  "explicación":     { en: "explanation", pos: "n" },
  "exploración":     { en: "exploration", pos: "n" },
  "expresión":       { en: "expression", pos: "n" },
  "formación":       { en: "training / education", pos: "n" },
  "habitación":      { en: "room / bedroom", pos: "n" },
  "iluminación":     { en: "lighting / illumination", pos: "n" },
  "imaginación":     { en: "imagination", pos: "n" },
  "inauguración":    { en: "inauguration / opening", pos: "n" },
  "información":     { en: "information", pos: "n" },
  "instalación":     { en: "installation", pos: "n" },
  "interpretación":  { en: "interpretation", pos: "n" },
  "intervención":    { en: "intervention", pos: "n" },
  "investigación":   { en: "investigation / research", pos: "n" },
  "invitación":      { en: "invitation", pos: "n" },
  "lección":         { en: "lesson", pos: "n" },
  "negociación":     { en: "negotiation", pos: "n" },
  "obligación":      { en: "obligation", pos: "n" },
  "operación":       { en: "operation", pos: "n" },
  "opinión":         { en: "opinion", pos: "n" },
  "organización":    { en: "organization", pos: "n" },
  "participación":   { en: "participation", pos: "n" },
  "preocupación":    { en: "worry / concern", pos: "n" },
  "preparación":     { en: "preparation", pos: "n" },
  "presentación":    { en: "presentation", pos: "n" },
  "producción":      { en: "production", pos: "n" },
  "recomendación":   { en: "recommendation", pos: "n" },
  "renovación":      { en: "renovation / renewal", pos: "n" },
  "reparación":      { en: "repair", pos: "n" },
  "sección":         { en: "section", pos: "n" },
  "separación":      { en: "separation", pos: "n" },
  "situación":       { en: "situation", pos: "n" },
  "superación":      { en: "self-improvement / overcoming", pos: "n" },
  "tradición":       { en: "tradition", pos: "n" },
  "traducción":      { en: "translation", pos: "n" },
  "transformación":  { en: "transformation", pos: "n" },
  "transición":      { en: "transition", pos: "n" },
  "ubicación":       { en: "location", pos: "n" },

  // -- Accented -sión variants --
  "comisión":        { en: "commission", pos: "n" },
  "compasión":       { en: "compassion", pos: "n" },
  "comprensión":     { en: "comprehension / understanding", pos: "n" },
  "decisión":        { en: "decision", pos: "n" },
  "inclusión":       { en: "inclusion", pos: "n" },
  "lesión":          { en: "injury / lesion", pos: "n" },
  "pasión":          { en: "passion", pos: "n" },

  // Currently pos:"v" but with verb-style translation → fix both
  "creaciones":      { en: "creations", pos: "n" },
  "pensiones":       { en: "pensions", pos: "n" },

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. Words ending in -ón that are nouns (not verbs)
  // ═══════════════════════════════════════════════════════════════════════════

  "café":            { en: "coffee / cafe", pos: "n" },
  "cajón":           { en: "drawer / crate", pos: "n" },
  "camión":          { en: "truck", pos: "n" },
  "canción":         { en: "song", pos: "n" },
  "perdón":          { en: "forgiveness / sorry", pos: "n" },
  "región":          { en: "region", pos: "n" },
  "region":          { en: "region", pos: "n" },
  "salón":           { en: "living room / hall", pos: "n" },
  "escalón":         { en: "step / stair", pos: "n" },

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. Words ending in -ería (shops/places/things — ALL are nouns)
  // ═══════════════════════════════════════════════════════════════════════════

  "batería":         { en: "battery / drums", pos: "n" },
  "cafetería":       { en: "cafeteria / coffee shop", pos: "n" },
  "estantería":      { en: "shelving / bookcase", pos: "n" },
  "extranjería":     { en: "immigration office", pos: "n" },
  "ferretería":      { en: "hardware store", pos: "n" },
  "ingeniería":      { en: "engineering", pos: "n" },
  "jardinería":      { en: "gardening", pos: "n" },
  "joyería":         { en: "jewelry store", pos: "n" },
  "lavandería":      { en: "laundromat / laundry", pos: "n" },
  "librería":        { en: "bookstore", pos: "n" },
  "lotería":         { en: "lottery", pos: "n" },
  "mensajería":      { en: "messaging / courier service", pos: "n" },
  "panadería":       { en: "bakery", pos: "n" },
  "peluquería":      { en: "hair salon / barbershop", pos: "n" },
  "repostería":      { en: "pastry / baking", pos: "n" },
  "tontería":        { en: "nonsense / silly thing", pos: "n" },

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. Words ending in -ía that are clearly nouns
  // ═══════════════════════════════════════════════════════════════════════════

  "alegría":         { en: "joy / happiness", pos: "n" },
  "compañía":        { en: "company / companionship", pos: "n" },

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. Other specific fixes
  // ═══════════════════════════════════════════════════════════════════════════

  "abrigo":          { en: "coat / shelter", pos: "n" },
  "abrigos":         { en: "coats", pos: "n" },
  "abril":           { en: "April", pos: "n" },
  "comité":          { en: "committee", pos: "n" },
  "estrés":          { en: "stress", pos: "n" },
};

// ── Main ─────────────────────────────────────────────────────────────────────

let src = fs.readFileSync(FILE, 'utf8');
const original = src;

let fixed = 0;
let skipped = 0;
const report = [];

for (const [word, { en, pos }] of Object.entries(FIXES)) {
  // Build a regex that matches the entire dictionary entry line for this word.
  // We need to escape special regex chars in the word (accented chars are fine,
  // but we need to escape things like "(" etc., though Spanish words don't have those).
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Match:  "word": { en: "...", ipa: "...", pos: "..." }
  const re = new RegExp(
    `("${escaped}":\\s*\\{\\s*en:\\s*)"([^"]*)"(,\\s*ipa:\\s*"[^"]*",\\s*pos:\\s*)"([^"]*)"`,
  );

  const m = src.match(re);
  if (!m) {
    skipped++;
    console.warn(`  SKIP (not found): "${word}"`);
    continue;
  }

  const oldEn  = m[2];
  const oldPos = m[4];

  // Check if anything actually needs changing
  if (oldEn === en && oldPos === pos) {
    skipped++;
    continue;
  }

  // Replace
  src = src.replace(re, `$1"${en}"$3"${pos}"`);
  fixed++;

  const changes = [];
  if (oldEn !== en)  changes.push(`en: "${oldEn}" → "${en}"`);
  if (oldPos !== pos) changes.push(`pos: "${oldPos}" → "${pos}"`);
  report.push(`  ✓ ${word}: ${changes.join(', ')}`);
}

if (fixed === 0) {
  console.log('No changes needed — all entries already correct.');
  process.exit(0);
}

fs.writeFileSync(FILE, src, 'utf8');

console.log(`\n=== fix-pos-es.cjs — Results ===\n`);
console.log(`Fixed:   ${fixed}`);
console.log(`Skipped: ${skipped} (not found or already correct)\n`);
console.log(`Changes:\n${report.join('\n')}\n`);
console.log(`File written: ${FILE}`);
