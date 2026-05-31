#!/usr/bin/env node
/**
 * Fix target-language grammar issues found by QC report.
 *
 * 1. Accent/spelling fixes: ES, IT, FR, NL, CY
 * 2. Gender agreement: HI
 * 3. Translation/grammar: RU
 * 4. Swedish: strip appended nonsense phrases, remove broken cards
 * 5. Turkish: remove corrupted/nonsensical cards, broader sweep for untranslated words in English
 * 6. Re-sort all affected decks by (node, priority, wordCount), reassign IDs, preserve audio
 */

const fs = require('fs');
const path = require('path');

const BASE = path.join(__dirname, '..');
const report = { fixes: {}, removals: {}, initialCounts: {}, finalCounts: {} };

function loadDeck(lang) {
  const p = path.join(BASE, 'src', 'data', lang, 'deck.json');
  const d = JSON.parse(fs.readFileSync(p, 'utf8'));
  report.initialCounts[lang] = d.length;
  return d;
}

function saveDeck(lang, deck) {
  const p = path.join(BASE, 'src', 'data', lang, 'deck.json');
  fs.writeFileSync(p, JSON.stringify(deck, null, 2) + '\n', 'utf8');
  report.finalCounts[lang] = deck.length;
}

function logFix(lang, id, desc) {
  if (!report.fixes[lang]) report.fixes[lang] = [];
  report.fixes[lang].push({ id, desc });
}

function logRemoval(lang, id, reason) {
  if (!report.removals[lang]) report.removals[lang] = [];
  report.removals[lang].push({ id, reason });
}

function wordCount(s) {
  return s.split(/\s+/).filter(Boolean).length;
}

function sortDeck(deck) {
  deck.sort((a, b) => {
    const nodeA = parseInt((a.grammarNode || '').replace('node-', '')) || 0;
    const nodeB = parseInt((b.grammarNode || '').replace('node-', '')) || 0;
    if (nodeA !== nodeB) return nodeA - nodeB;
    if ((a.priority || 99) !== (b.priority || 99)) return (a.priority || 99) - (b.priority || 99);
    return wordCount(a.target) - wordCount(b.target);
  });
}

function reassignIds(deck, prefix) {
  deck.forEach((card, i) => {
    card.id = `${prefix}-${String(i + 1).padStart(4, '0')}`;
  });
}

// ============================================================
// 1. SPANISH - accent fixes
// ============================================================
function fixSpanish() {
  const deck = loadDeck('spanish');
  for (const card of deck) {
    if (card.target === "Fue precisamente alli donde descubri mi pasion por la pintura.") {
      card.target = "Fue precisamente allí donde descubrí mi pasión por la pintura.";
      logFix('es', card.id, "Fixed missing accents: allí, descubrí, pasión");
    }
  }
  sortDeck(deck);
  reassignIds(deck, 'es');
  saveDeck('spanish', deck);
}

// ============================================================
// 2. ITALIAN - accent fix
// ============================================================
function fixItalian() {
  const deck = loadDeck('italian');
  for (const card of deck) {
    if (card.target.includes("necessità virtu") && card.target.includes("soluzione creativa")) {
      card.target = card.target.replace("virtu ", "virtù ");
      // also fix "virtu" at end of word if no space follows
      card.target = card.target.replace(/virtu(?!\w|ù)/, "virtù");
      logFix('it', card.id, "Fixed missing accent: virtù");
    }
  }
  sortDeck(deck);
  reassignIds(deck, 'it');
  saveDeck('italian', deck);
}

// ============================================================
// 3. FRENCH - accent fixes
// ============================================================
function fixFrench() {
  const deck = loadDeck('french');
  for (const card of deck) {
    if (card.target === "Ils dansaient quand la musique s'est arretee brusquement.") {
      card.target = "Ils dansaient quand la musique s'est arrêtée brusquement.";
      logFix('fr', card.id, "Fixed accents: arrêtée");
    }
    if (card.target === "Nous leur avons laisse un message.") {
      card.target = "Nous leur avons laissé un message.";
      logFix('fr', card.id, "Fixed accent: laissé");
    }
  }
  sortDeck(deck);
  reassignIds(deck, 'fr');
  saveDeck('french', deck);
}

// ============================================================
// 4. DUTCH - spelling fixes
// ============================================================
function fixDutch() {
  const deck = loadDeck('dutch');
  for (const card of deck) {
    if (card.target.includes("oorbellletjes")) {
      card.target = card.target.replace("oorbellletjes", "oorbelletjes");
      logFix('nl', card.id, "Fixed triple-l typo: oorbelletjes");
    }
    // Fix cafe -> café throughout
    if (card.target.includes(" cafe") && !card.target.includes("café")) {
      card.target = card.target.replace(/\bcafe\b/g, "café");
      logFix('nl', card.id, "Fixed missing accent: café");
    }
  }
  sortDeck(deck);
  reassignIds(deck, 'nl');
  saveDeck('dutch', deck);
}

// ============================================================
// 5. WELSH - mutation fix
// ============================================================
function fixWelsh() {
  const deck = loadDeck('welsh');
  for (const card of deck) {
    if (card.target === "Mae'r Urdd yn mudiad ieuenctid Cymraeg.") {
      card.target = "Mae'r Urdd yn fudiad ieuenctid Cymraeg.";
      logFix('cy', card.id, "Fixed soft mutation: mudiad -> fudiad after yn");
    }
  }
  sortDeck(deck);
  reassignIds(deck, 'cy');
  saveDeck('welsh', deck);
}

// ============================================================
// 6. HINDI - gender agreement + translation fix
// ============================================================
function fixHindi() {
  const deck = loadDeck('hindi');
  for (const card of deck) {
    if (card.target === "शीला रोज़ सुबह व्यायाम करता है।") {
      card.target = "शीला रोज़ सुबह व्यायाम करती है।";
      logFix('hi', card.id, "Fixed gender agreement: करता -> करती for female name शीला");
    }
    if (card.target === "दीपक की बात में वज़न है, हमें उसकी सलाह माननी चाहिए।" &&
        card.english.includes("her advice")) {
      card.english = card.english.replace("her advice", "his advice");
      logFix('hi', card.id, "Fixed English translation: her -> his for male name Deepak");
    }
  }
  sortDeck(deck);
  reassignIds(deck, 'hi');
  saveDeck('hindi', deck);
}

// ============================================================
// 7. RUSSIAN - translation mismatch + incomplete sentence
// ============================================================
function fixRussian() {
  const deck = loadDeck('russian');
  for (const card of deck) {
    // Fix translation mismatch: парке vs library
    if (card.target === "Водитель бегал утром в парке на прошлой неделе." &&
        card.english.includes("in the library")) {
      card.english = "The driver ran in the morning in the park last week.";
      logFix('ru', card.id, "Fixed English translation: library -> park to match Russian");
    }
    // Fix incomplete sentence: add an object
    if (card.target === "Он вёз домой." && card.english === "He was transporting home.") {
      card.target = "Он вёз груз домой.";
      card.english = "He was transporting cargo home.";
      logFix('ru', card.id, "Fixed incomplete sentence: added object 'груз/cargo'");
    }
  }
  sortDeck(deck);
  reassignIds(deck, 'ru');
  saveDeck('russian', deck);
}

// ============================================================
// 8. SWEDISH - strip appended nonsense, remove broken cards
// ============================================================
function fixSwedish() {
  let deck = loadDeck('swedish');
  const initialLen = deck.length;

  // Patterns to strip from target sentences
  const stripPatterns = [
    /,?\s*innan det blir för sent att ändra sig!*$/,
    /,?\s*så att vi hinner med tåget till Stockholm!*$/,
  ];

  // Broader sweep patterns
  const broadStripPatterns = [
    /,?\s*innan det blir\b[^.]*$/,
    /\s+ibland snart\b[^.]*$/,
    /\s+ofta snart\b[^.]*$/,
  ];

  // Cards to remove (broken/nonsensical)
  const removeIds = new Set();

  // First pass: identify cards to remove
  for (const card of deck) {
    // Remove specific broken cards from QC report
    if (card.target === "Var så snäll varje dag." && card.english === "Please every day.") {
      removeIds.add(card.id);
      logRemoval('sv', card.id, "Nonsensical/incomplete: 'Please every day'");
    }
    if (card.target === "Vad gör du här ibland väl?" ||
        (card.target.includes("ibland väl") && card.english.includes("sometimes I suppose"))) {
      removeIds.add(card.id);
      logRemoval('sv', card.id, "Unnatural auto-generated: 'ibland väl'");
    }
    if (card.target === "Inga problem tillsammans." && card.english === "No problems together.") {
      removeIds.add(card.id);
      logRemoval('sv', card.id, "Nonsensical fragment: 'No problems together'");
    }
    if (card.target.includes("Vi ska ha det trevligt för att kunna nå våra gemensamma mål snart")) {
      removeIds.add(card.id);
      logRemoval('sv', card.id, "Incoherent auto-generated: nice time -> reach goals");
    }
    if (card.target.includes("ofta snart") || card.english.includes("often soon")) {
      removeIds.add(card.id);
      logRemoval('sv', card.id, "Contradictory adverbs: 'ofta snart' / 'often soon'");
    }
    if (card.target.includes("Se norrskenet, så att vi hinner med tåget")) {
      // Will be stripped not removed - keep it as "Se norrskenet."
    }
    if (card.target.includes("på kvällen med familjen") &&
        (card.target.includes("artonhundratalet") || card.target.includes("nittonhundratalet"))) {
      removeIds.add(card.id);
      logRemoval('sv', card.id, "Absurd: historical statement + 'in the evening with the family'");
    }
    if (card.target === "Hon vill inte sluta efter jobbet nu." && card.english === "She doesn't want to stop after work now.") {
      // Ambiguous but not broken - leave it
    }
  }

  // Remove broken cards
  deck = deck.filter(c => !removeIds.has(c.id));

  // Second pass: strip appended nonsense
  for (const card of deck) {
    let changed = false;
    let origTarget = card.target;
    let origEnglish = card.english;

    for (const pat of stripPatterns) {
      if (pat.test(card.target)) {
        card.target = card.target.replace(pat, '').trim();
        // Clean up trailing punctuation
        if (!card.target.endsWith('.') && !card.target.endsWith('!') && !card.target.endsWith('?')) {
          card.target += '.';
        }
        changed = true;
      }
    }

    // Broader sweep
    for (const pat of broadStripPatterns) {
      if (pat.test(card.target)) {
        card.target = card.target.replace(pat, '').trim();
        if (!card.target.endsWith('.') && !card.target.endsWith('!') && !card.target.endsWith('?')) {
          card.target += '.';
        }
        changed = true;
      }
    }

    // Also strip corresponding English nonsense
    if (changed) {
      // Strip English equivalents
      card.english = card.english
        .replace(/,?\s*before it's too late to change (your|one's) mind!*$/i, '')
        .replace(/,?\s*so that we (make it|catch) (to )?the train to Stockholm!*$/i, '')
        .replace(/\s+sometimes soon\b.*$/i, '')
        .replace(/\s+often soon\b.*$/i, '')
        .trim();
      if (!card.english.endsWith('.') && !card.english.endsWith('!') && !card.english.endsWith('?')) {
        card.english += '.';
      }
      logFix('sv', card.id, `Stripped appended nonsense: "${origTarget}" -> "${card.target}"`);
    }
  }

  console.log(`Swedish: removed ${initialLen - deck.length} cards, applied strip fixes`);

  sortDeck(deck);
  reassignIds(deck, 'sv');
  saveDeck('swedish', deck);
}

// ============================================================
// 9. TURKISH - remove corrupted cards + broader sweep
// ============================================================
function fixTurkish() {
  let deck = loadDeck('turkish');
  const initialLen = deck.length;

  // QC-reported cards to remove (critical/high severity)
  const qcRemoveTargets = new Set([
    "Turistler pastaı konser salonunda gitti.",
    "Fotoğrafçı böreki göl kenarında bıraktı.",
    "Babam kebapi camide geldi.",
    "Komşular eczaneden sabırla tamir etti.",
    "Bu sincap dün sabah pazarlandı.",
    "Başkan gün batımında ekşi kebap dağda geldi.",
    "Doktor her pazar zor salata bankada sattı.",
    "Bu lale her ay bestelendi.",
  ]);

  // QC-reported cards with English translation issues to remove
  const qcRemoveByEnglish = [
    /doing binicilik/i,
    /doing halter/i,
    /\bbulut\b/i,
    /\bpansiyon\b/i,
    /\bmuhabir\b/i,
    /\bbilek\b.*\bkonser salonu\b/i,
    /\bhamam\b.*\bberrak\b/i,
    /\bberrak\b.*\bmuhabir\b/i,
  ];

  // Broader sweep: common Turkish words that should never appear in the English field
  const turkishWordsInEnglish = [
    'bulut', 'halter', 'muhabir', 'kuru', 'sogan', 'soğan',
    'pansiyon', 'berrak', 'bilek', 'binicilik',
    'hamam', 'çarşı', 'konser salonu', 'kebap', 'kebabi',
    'pazar', 'pazarı', 'çay', 'ayran', 'dolmuş',
    'kuş', 'börek', 'baklava', 'maden', 'kervansaray',
    'tekke', 'medrese', 'araba', 'otobüs',
    'dondurma', 'lokum', 'paça', 'pilav',
    'konak', 'lokanta', 'çeşme', 'köy', 'köprü',
    'cami', 'minare', 'saray', 'kale',
  ];

  // But some Turkish words are legitimately used in English (loan words / proper nouns)
  const allowedTurkish = new Set([
    'kebab', 'baklava', 'yogurt', 'yoghurt', 'doner', 'döner',
    'istanbul', 'ankara', 'turkish', 'turkey',
    'pasha', 'sultan', 'ottoman', 'bazaar', 'caravanserai',
    'imam', 'minaret', 'mosque',
  ]);

  let removed = 0;

  deck = deck.filter(card => {
    // Check QC reported targets
    if (qcRemoveTargets.has(card.target)) {
      logRemoval('tr', card.id, `QC-reported corrupted card: "${card.target.substring(0, 60)}..."`);
      removed++;
      return false;
    }

    // Check QC reported English patterns
    for (const pat of qcRemoveByEnglish) {
      if (pat.test(card.english)) {
        logRemoval('tr', card.id, `QC-reported untranslated Turkish in English: "${card.english.substring(0, 60)}..."`);
        removed++;
        return false;
      }
    }

    // Broader sweep: check for Turkish words in English field
    const englishLower = card.english.toLowerCase();
    for (const tw of turkishWordsInEnglish) {
      const twLower = tw.toLowerCase();
      if (allowedTurkish.has(twLower)) continue;
      // Use word boundary check
      const regex = new RegExp(`\\b${twLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(englishLower)) {
        logRemoval('tr', card.id, `Untranslated Turkish '${tw}' in English: "${card.english.substring(0, 80)}"`);
        removed++;
        return false;
      }
    }

    // Check for completely broken English (random word soup indicators)
    // Pattern: "The X verbed the Y at the Z" where it makes no semantic sense
    // Check for accusative suffix errors: common patterns like "kebapi", "pastaı", "böreki"
    if (/\w+[ıiuü](?:\s|$)/.test(card.target) && /\bcame\b.*\bat the\b/.test(card.english)) {
      // Possible broken accusative + wrong English
      // Only flag if English is also broken
      if (/\bcame\s+the\b/.test(card.english) || /\bwent\s+the\b/.test(card.english) || /\bwrote\s+.*\bkebab\b/.test(card.english)) {
        logRemoval('tr', card.id, `Broken grammar pattern: "${card.english.substring(0, 80)}"`);
        removed++;
        return false;
      }
    }

    // Fix the QC-reported translation issue (tr-1088)
    if (card.target === "Hasan okuldan şaşkınlıkla geldi." && card.english === "Hasan started surprisingly from school.") {
      card.english = "Hasan came from school in surprise.";
      logFix('tr', card.id, "Fixed broken English translation");
    }

    return true;
  });

  console.log(`Turkish: removed ${removed} cards (from ${initialLen} to ${deck.length})`);

  sortDeck(deck);
  reassignIds(deck, 'tr');
  saveDeck('turkish', deck);
}

// ============================================================
// RUN ALL FIXES
// ============================================================
console.log("=== QC Grammar Fix Script ===\n");

fixSpanish();
fixItalian();
fixFrench();
fixDutch();
fixWelsh();
fixHindi();
fixRussian();
fixSwedish();
fixTurkish();

// Print report
console.log("\n=== REPORT ===\n");

console.log("FIXES APPLIED:");
for (const [lang, fixes] of Object.entries(report.fixes)) {
  console.log(`\n  ${lang.toUpperCase()} (${fixes.length} fixes):`);
  for (const f of fixes) {
    console.log(`    ${f.id}: ${f.desc}`);
  }
}

console.log("\nCARDS REMOVED:");
for (const [lang, removals] of Object.entries(report.removals)) {
  console.log(`\n  ${lang.toUpperCase()} (${removals.length} cards removed):`);
  for (const r of removals) {
    console.log(`    ${r.id}: ${r.reason}`);
  }
}

console.log("\nCARD COUNTS:");
for (const lang of Object.keys(report.initialCounts).sort()) {
  const initial = report.initialCounts[lang];
  const final = report.finalCounts[lang];
  const diff = initial - final;
  console.log(`  ${lang}: ${initial} -> ${final}${diff > 0 ? ` (-${diff})` : ''}`);
}
