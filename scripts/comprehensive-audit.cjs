/**
 * Comprehensive audit of ALL 11 language decks and dictionaries.
 * Checks: dictionary quality, card quality, grammar tips, audio, tags, pacing.
 */
const fs = require("fs");
const path = require("path");

const LANGS = [
  ["spanish", "es"], ["italian", "it"], ["french", "fr"], ["portuguese", "pt"],
  ["german", "de"], ["dutch", "nl"], ["swedish", "sv"], ["welsh", "cy"],
  ["hindi", "hi"], ["turkish", "tr"], ["russian", "ru"]
];

// Script ranges for detection
const DEVANAGARI_RE = /[\u0900-\u097F]/;
const CYRILLIC_RE = /[\u0400-\u04FF]/;
const LATIN_RE = /[a-zA-Zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿŵŷẁỳ]/;
const ARABIC_RE = /[\u0600-\u06FF]/;
const CJK_RE = /[\u4E00-\u9FFF]/;

// Languages that should NOT have Latin script in target
const NON_LATIN_LANGS = {
  hi: { name: "Hindi", re: DEVANAGARI_RE, label: "Devanagari" },
  ru: { name: "Russian", re: CYRILLIC_RE, label: "Cyrillic" },
};

// Tokenizer: same logic as audit.cjs
function tokenize(text) {
  const words = new Set();
  text.split(/[\s,;:.!?¿¡""«»()\-––'…।॥؟\u200B\u200C\u200D]+/).forEach(function (w) {
    var clean = w.toLowerCase().replace(/^['']+|['']+$/g, '').replace(/[।॥]/g, '').trim();
    if (clean.length > 0 && !/^\d+$/.test(clean)) words.add(clean);
  });
  return words;
}

// Parse dictionary keys from .ts file
function parseDictKeys(dictContent) {
  const keys = new Set();
  let m;
  var re1 = /^\s+['"]([^'"]+)['"]\s*:/gm;
  while ((m = re1.exec(dictContent)) !== null) keys.add(m[1].toLowerCase());
  var re2 = /^\s+([a-záàâãéèêíìîóòôõúùûüçñäöüßðþæøåŵŷâêîôûẁỳ\u0400-\u04FF\u0900-\u097F\u011E-\u011F\u0130-\u0131\u015E-\u015F\u00C7\u00E7]+)\s*:\s*\{/gm;
  while ((m = re2.exec(dictContent)) !== null) keys.add(m[1].toLowerCase());
  var re3 = /['"]([^'"]+)['"]\s*:\s*(?:\[|['"])/gm;
  while ((m = re3.exec(dictContent)) !== null) keys.add(m[1].toLowerCase());
  return keys;
}

// Parse dictionary entries with their English translations and POS
function parseDictEntries(dictContent) {
  const entries = [];
  // Match: 'key': { en: 'translation', ipa: '...', pos: '...' }
  const re = /['"]([^'"]+)['"]\s*:\s*\{\s*en:\s*['"]([^'"]*)['"]\s*,\s*ipa:\s*['"][^'"]*['"]\s*(?:,\s*pos:\s*['"]([^'"]*)['"]\s*)?\}/g;
  let m;
  while ((m = re.exec(dictContent)) !== null) {
    entries.push({ key: m[1], en: m[2], pos: m[3] || '' });
  }
  return entries;
}

// ══════════════════════════════════════════════════════════════
// MAIN AUDIT
// ══════════════════════════════════════════════════════════════

const allResults = {};

for (const [dir, code] of LANGS) {
  const result = {
    dictionary: { total: 0, issues: [] },
    cards: { total: 0, issues: [] },
    tips: { total: 0, withTips: 0, issues: [] },
    audio: { total: 0, withAudio: 0, missing: 0, zeroByte: 0, issues: [] },
    tags: { issues: [] },
    pacing: { issues: [] },
    coverage: 0,
  };

  const deck = JSON.parse(fs.readFileSync("src/data/" + dir + "/deck.json", "utf8"));
  const dictContent = fs.readFileSync("src/data/dictionary/" + code + ".ts", "utf8");
  const dictKeys = parseDictKeys(dictContent);
  const dictEntries = parseDictEntries(dictContent);

  result.cards.total = deck.length;

  // ══════════════════════════════════════════════════
  // 1. DICTIONARY QUALITY
  // ══════════════════════════════════════════════════
  result.dictionary.total = dictEntries.length;

  for (const entry of dictEntries) {
    const { key, en, pos } = entry;

    // Non-ASCII in English field (Devanagari, Cyrillic, Arabic, CJK)
    if (DEVANAGARI_RE.test(en) || CYRILLIC_RE.test(en) || ARABIC_RE.test(en) || CJK_RE.test(en)) {
      result.dictionary.issues.push({ type: "NON_ASCII_EN", detail: key + " => " + en.slice(0, 60) });
    }

    // Very short English (1-2 chars) that aren't legitimate (a, I, to are ok)
    if (en.trim().length <= 2 && !["a", "i", "to", "or", "an", "in", "on", "at", "up", "no", "so", "if", "do", "be", "me", "we", "he", "us", "my"].includes(en.trim().toLowerCase())) {
      result.dictionary.issues.push({ type: "SHORT_EN", detail: key + " => '" + en + "'" });
    }

    // Verb without "to " prefix
    if (pos === 'v' && en.length > 0) {
      const enLower = en.toLowerCase().trim();
      // Allow entries like "food; to eat" or compound definitions
      if (!enLower.startsWith("to ") && !enLower.includes("; to ") && !enLower.includes(", to ") && !enLower.includes("to ")) {
        // Only flag if it doesn't look like a verb form
        if (!/^(be|have|go|do|get|make|see|say|come|take|know|give|find|think|tell|put|let|keep|set|run|read|grow|draw|show|hear|play|move|live|cut|hit|pay|meet|stand|hold|bring|lose|write|sit|speak|lead|begin|feel|seem|leave|call|try|ask|use|need|turn|start|might|may|can|will|would|could|should|shall)\b/.test(enLower)) {
          result.dictionary.issues.push({ type: "VERB_NO_TO", detail: key + " (pos=v) => '" + en.slice(0, 50) + "'" });
        }
      }
    }

    // "to X, to Y" pattern (likely corruption or overly verbose)
    if (/to \w+.*,\s*to \w+.*,\s*to \w+/i.test(en)) {
      result.dictionary.issues.push({ type: "MULTI_TO", detail: key + " => " + en.slice(0, 80) });
    }

    // Self-referential translation (English same as key)
    if (en.toLowerCase().trim() === key.toLowerCase().trim() && en.length > 2) {
      result.dictionary.issues.push({ type: "SELF_REF", detail: key + " => '" + en + "'" });
    }
  }

  // Dictionary coverage
  const deckWords = new Set();
  deck.forEach(function (c) {
    tokenize(c.target).forEach(function (w) { deckWords.add(w); });
  });
  let found = 0;
  deckWords.forEach(function (w) { if (dictKeys.has(w)) found++; });
  result.coverage = deckWords.size > 0 ? (found / deckWords.size * 100) : 0;

  // ══════════════════════════════════════════════════
  // 2. CARD QUALITY
  // ══════════════════════════════════════════════════

  // Duplicate targets
  const targetMap = {};
  for (const card of deck) {
    const t = (card.target || "").trim().toLowerCase();
    if (!targetMap[t]) targetMap[t] = [];
    targetMap[t].push(card.id);
  }
  for (const [t, ids] of Object.entries(targetMap)) {
    if (ids.length > 1 && t.length > 0) {
      result.cards.issues.push({ type: "DUP_TARGET", detail: ids.length + "x: \"" + t.slice(0, 60) + "\" (ids: " + ids.slice(0, 3).join(", ") + ")" });
    }
  }

  // Duplicate english
  const englishMap = {};
  for (const card of deck) {
    const e = (card.english || "").trim().toLowerCase();
    if (!englishMap[e]) englishMap[e] = [];
    englishMap[e].push(card.id);
  }
  for (const [e, ids] of Object.entries(englishMap)) {
    if (ids.length > 2 && e.length > 0) {
      result.cards.issues.push({ type: "DUP_ENGLISH", detail: ids.length + "x: \"" + e.slice(0, 60) + "\"" });
    }
  }

  for (const card of deck) {
    const target = (card.target || "").trim();
    const english = (card.english || "").trim();

    // Empty fields
    if (target.length === 0) {
      result.cards.issues.push({ type: "EMPTY_TARGET", detail: "Card " + card.id });
    }
    if (english.length === 0) {
      result.cards.issues.push({ type: "EMPTY_ENGLISH", detail: "Card " + card.id });
    }

    // Target === English (untranslated)
    if (target.toLowerCase() === english.toLowerCase() && target.length > 3) {
      result.cards.issues.push({ type: "UNTRANSLATED", detail: "Card " + card.id + ": \"" + target.slice(0, 50) + "\"" });
    }

    // Script detection for non-Latin languages
    if (NON_LATIN_LANGS[code]) {
      const scriptInfo = NON_LATIN_LANGS[code];
      const latinChars = (target.match(/[a-zA-Z]/g) || []).length;
      const scriptChars = (target.match(new RegExp(scriptInfo.re.source, 'g')) || []).length;
      if (latinChars > 3 && latinChars > scriptChars * 0.3 && target.length > 10) {
        result.cards.issues.push({ type: "WRONG_SCRIPT", detail: "Card " + card.id + ": " + latinChars + " Latin chars in " + scriptInfo.label + " text: \"" + target.slice(0, 60) + "\"" });
      }
    }

    // Welsh: check for English words that shouldn't be there
    if (code === "cy") {
      const commonEnglish = /\b(the|is|are|was|were|have|has|had|this|that|with|from|they|them|their|about|because|before|after|should|could|would)\b/gi;
      const matches = target.match(commonEnglish) || [];
      if (matches.length >= 3) {
        result.cards.issues.push({ type: "ENGLISH_IN_TARGET", detail: "Card " + card.id + ": \"" + target.slice(0, 60) + "\"" });
      }
    }
  }

  // Node distribution & sentence length
  const nodeStats = {};
  for (const card of deck) {
    const node = card.grammarNode || "unknown";
    if (!nodeStats[node]) nodeStats[node] = { count: 0, wordLens: [] };
    nodeStats[node].count++;
    const wc = (card.target || "").trim().split(/\s+/).length;
    nodeStats[node].wordLens.push(wc);
  }

  // A1 nodes (01-05) with avg > 12
  for (let i = 1; i <= 5; i++) {
    const nodeName = "node-" + String(i).padStart(2, "0");
    const stats = nodeStats[nodeName];
    if (stats) {
      const avg = stats.wordLens.reduce((a, b) => a + b, 0) / stats.wordLens.length;
      if (avg > 12) {
        result.cards.issues.push({ type: "A1_TOO_COMPLEX", detail: nodeName + " avg " + avg.toFixed(1) + " words (expected <12)" });
      }
    }
  }

  // C1+ nodes (26-35) with avg < 5
  for (let i = 26; i <= 35; i++) {
    const nodeName = "node-" + String(i).padStart(2, "0");
    const stats = nodeStats[nodeName];
    if (stats) {
      const avg = stats.wordLens.reduce((a, b) => a + b, 0) / stats.wordLens.length;
      if (avg < 5) {
        result.cards.issues.push({ type: "C1_TOO_SIMPLE", detail: nodeName + " avg " + avg.toFixed(1) + " words (expected >5)" });
      }
    }
  }

  // Grammar tip quality: "X = Y" where X not in target
  for (const card of deck) {
    const tip = (card.grammar || "").trim();
    if (!tip) continue;
    const target = (card.target || "").toLowerCase();

    // Check for "X = Y" pattern where X is not in target
    const eqMatch = tip.match(/^['"]?([^='"]{1,40})['"]?\s*=\s*/);
    if (eqMatch) {
      const word = eqMatch[1].trim().toLowerCase();
      if (word.length > 1 && !target.includes(word)) {
        result.cards.issues.push({ type: "TIP_IRRELEVANT", detail: "Card " + card.id + ": tip mentions '" + word + "' not in target" });
      }
    }
  }

  // ══════════════════════════════════════════════════
  // 3. GRAMMAR TIPS
  // ══════════════════════════════════════════════════
  const tipsCards = deck.filter(c => c.grammar && c.grammar.trim() !== "");
  result.tips.total = deck.length;
  result.tips.withTips = tipsCards.length;

  for (const card of tipsCards) {
    const tip = card.grammar.trim();

    // Conjugation patterns
    if (/[-\/][oa]s?[-\/][oa]s?\b/.test(tip) ||
        /करता\s*\/\s*करती\s*\/\s*करते/.test(tip) ||
        /-[eo]\/-[ea]s?\/-[ea]m?os\b/.test(tip) ||
        /\b(yo|tú|él|nosotros|vosotros|ellos)\b.*[-\/]/.test(tip) ||
        /\b(ich|du|er|wir|ihr|sie)\b.*[-\/].*[-\/]/.test(tip)) {
      result.tips.issues.push({ type: "CONJUGATION_PATTERN", detail: "Card " + card.id + ": \"" + tip.slice(0, 80) + "\"" });
    }

    // Too long
    if (tip.length > 200) {
      result.tips.issues.push({ type: "TIP_TOO_LONG", detail: "Card " + card.id + ": " + tip.length + " chars" });
    }

    // "word = definition" where word not in target
    const target = (card.target || "").toLowerCase();
    const defMatch = tip.match(/^['"]?([^='"]{1,30})['"]?\s*=\s*['"]?([^'"]{1,60})/);
    if (defMatch) {
      const word = defMatch[1].trim().toLowerCase();
      if (word.length > 1 && !target.includes(word)) {
        result.tips.issues.push({ type: "TIP_WORD_NOT_IN_TARGET", detail: "Card " + card.id + ": '" + word + "' not in target" });
      }
    }
  }

  // ══════════════════════════════════════════════════
  // 4. AUDIO
  // ══════════════════════════════════════════════════
  result.audio.total = deck.length;
  let audioMissing = 0;
  let audioZeroByte = 0;
  const missingExamples = [];
  const zeroByteExamples = [];

  for (const card of deck) {
    if (!card.audio || card.audio.trim() === "") {
      result.audio.issues.push({ type: "NO_AUDIO_FIELD", detail: "Card " + card.id });
      continue;
    }
    result.audio.withAudio++;
    const audioPath = path.join("public/quest-audio", card.audio);
    if (!fs.existsSync(audioPath)) {
      audioMissing++;
      if (missingExamples.length < 5) missingExamples.push(card.audio);
    } else {
      const stat = fs.statSync(audioPath);
      if (stat.size === 0) {
        audioZeroByte++;
        if (zeroByteExamples.length < 5) zeroByteExamples.push(card.audio);
      }
    }
  }
  result.audio.missing = audioMissing;
  result.audio.zeroByte = audioZeroByte;
  if (audioMissing > 0) {
    result.audio.issues.push({ type: "MISSING_FILES", detail: audioMissing + " missing (e.g. " + missingExamples.join(", ") + ")" });
  }
  if (audioZeroByte > 0) {
    result.audio.issues.push({ type: "ZERO_BYTE", detail: audioZeroByte + " zero-byte files (e.g. " + zeroByteExamples.join(", ") + ")" });
  }

  // ══════════════════════════════════════════════════
  // 5. TAGS
  // ══════════════════════════════════════════════════
  const tagCounts = { general: 0, travel: 0, work: 0, family: 0 };
  let emptyTags = 0;
  for (const card of deck) {
    const tags = card.tags || [];
    if (tags.length === 0) emptyTags++;
    for (const tag of Object.keys(tagCounts)) {
      if (tags.includes(tag)) tagCounts[tag]++;
    }
  }
  if (emptyTags > 0) {
    result.tags.issues.push({ type: "EMPTY_TAGS", detail: emptyTags + " cards with empty tags array" });
  }
  for (const [tag, count] of Object.entries(tagCounts)) {
    const pct = (count / deck.length * 100);
    if (pct < 30) {
      result.tags.issues.push({ type: "LOW_TAG", detail: tag + ": " + pct.toFixed(1) + "% (<30%)" });
    }
  }
  result.tags.counts = tagCounts;

  // ══════════════════════════════════════════════════
  // 6. PACING / NODE QUALITY
  // ══════════════════════════════════════════════════
  const nodeAvgs = [];
  for (let i = 1; i <= 35; i++) {
    const nodeName = "node-" + String(i).padStart(2, "0");
    const stats = nodeStats[nodeName];
    if (!stats) {
      result.pacing.issues.push({ type: "MISSING_NODE", detail: nodeName + " has no cards" });
      nodeAvgs.push({ node: nodeName, avg: 0, count: 0 });
      continue;
    }
    if (stats.count < 50) {
      result.pacing.issues.push({ type: "THIN_NODE", detail: nodeName + " has only " + stats.count + " cards (<50)" });
    }
    if (stats.count > 200) {
      result.pacing.issues.push({ type: "FAT_NODE", detail: nodeName + " has " + stats.count + " cards (>200)" });
    }
    const avg = stats.wordLens.reduce((a, b) => a + b, 0) / stats.wordLens.length;
    nodeAvgs.push({ node: nodeName, avg, count: stats.count });
  }

  // Check monotonically increasing complexity
  // Compare A1 (01-10) avg vs B2 (16-25) avg
  const a1Avgs = nodeAvgs.filter((_, i) => i < 10 && nodeAvgs[i].count > 0).map(n => n.avg);
  const b2Avgs = nodeAvgs.filter((_, i) => i >= 15 && i < 25 && nodeAvgs[i].count > 0).map(n => n.avg);
  if (a1Avgs.length > 0 && b2Avgs.length > 0) {
    const a1Mean = a1Avgs.reduce((a, b) => a + b, 0) / a1Avgs.length;
    const b2Mean = b2Avgs.reduce((a, b) => a + b, 0) / b2Avgs.length;
    if (a1Mean > b2Mean) {
      result.pacing.issues.push({ type: "INVERTED_PACING", detail: "A1 avg (" + a1Mean.toFixed(1) + " words) > B2 avg (" + b2Mean.toFixed(1) + " words)" });
    }
  }

  result.nodeAvgs = nodeAvgs;
  allResults[code] = result;
}

// ══════════════════════════════════════════════════════════════
// OUTPUT REPORT
// ══════════════════════════════════════════════════════════════

console.log("╔═══════════════════════════════════════════════════════════════════╗");
console.log("║           COMPREHENSIVE AUDIT – ALL 11 LANGUAGES                ║");
console.log("╚═══════════════════════════════════════════════════════════════════╝");
console.log("");

for (const [dir, code] of LANGS) {
  const r = allResults[code];
  const totalIssues = r.dictionary.issues.length + r.cards.issues.length +
    r.tips.issues.length + r.audio.issues.length + r.tags.issues.length + r.pacing.issues.length;

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  " + code.toUpperCase() + " (" + dir + ") – " + totalIssues + " total issues");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  // 1. Dictionary
  const tipPct = (r.tips.withTips / r.tips.total * 100).toFixed(1);
  console.log("\n  [DICTIONARY] " + r.dictionary.total + " entries | Coverage: " + r.coverage.toFixed(1) + "% of deck words");
  printIssues(r.dictionary.issues, 8);

  // 2. Cards
  console.log("\n  [CARDS] " + r.cards.total + " cards");
  printIssues(r.cards.issues, 8);

  // 3. Tips
  console.log("\n  [GRAMMAR TIPS] " + r.tips.withTips + "/" + r.tips.total + " = " + tipPct + "%");
  printIssues(r.tips.issues, 8);

  // 4. Audio
  console.log("\n  [AUDIO] " + r.audio.withAudio + "/" + r.audio.total + " have audio | " + r.audio.missing + " missing files | " + r.audio.zeroByte + " zero-byte");
  printIssues(r.audio.issues, 5);

  // 5. Tags
  const tc = r.tags.counts;
  console.log("\n  [TAGS] general=" + tc.general + " travel=" + tc.travel + " work=" + tc.work + " family=" + tc.family);
  printIssues(r.tags.issues, 5);

  // 6. Pacing
  console.log("\n  [PACING] Node distribution:");
  // Print mini table of node avgs
  let nodeTable = "    ";
  for (let i = 0; i < r.nodeAvgs.length; i++) {
    const n = r.nodeAvgs[i];
    nodeTable += String(i + 1).padStart(2) + ":" + String(n.count).padStart(4) + "/" + n.avg.toFixed(1).padStart(4) + "  ";
    if ((i + 1) % 7 === 0) {
      console.log(nodeTable);
      nodeTable = "    ";
    }
  }
  if (nodeTable.trim()) console.log(nodeTable);
  console.log("    (format: nodeNum: cards/avgWords)");
  printIssues(r.pacing.issues, 5);

  console.log("");
}

// ══════════════════════════════════════════════════════════════
// SUMMARY TABLE
// ══════════════════════════════════════════════════════════════

console.log("╔═══════════════════════════════════════════════════════════════════════════════════════╗");
console.log("║                              CROSS-LANGUAGE SUMMARY                                  ║");
console.log("╚═══════════════════════════════════════════════════════════════════════════════════════╝");
console.log("");

// Header
console.log(
  "Lang".padEnd(6) +
  "Cards".padStart(6) +
  "Dict".padStart(6) +
  "Cov%".padStart(7) +
  "Tips%".padStart(7) +
  "DupTgt".padStart(7) +
  "DupEng".padStart(7) +
  "Audio".padStart(7) +
  "MissAu".padStart(7) +
  "EmptyTg".padStart(8) +
  "DictIss".padStart(8) +
  "CardIss".padStart(8) +
  "TipIss".padStart(7) +
  "PaceIss".padStart(8)
);
console.log("-".repeat(99));

for (const [dir, code] of LANGS) {
  const r = allResults[code];
  const tipPct = (r.tips.withTips / r.tips.total * 100).toFixed(1);
  const dupTargets = r.cards.issues.filter(i => i.type === "DUP_TARGET").length;
  const dupEnglish = r.cards.issues.filter(i => i.type === "DUP_ENGLISH").length;

  console.log(
    code.toUpperCase().padEnd(6) +
    String(r.cards.total).padStart(6) +
    String(r.dictionary.total).padStart(6) +
    r.coverage.toFixed(1).padStart(7) +
    tipPct.padStart(7) +
    String(dupTargets).padStart(7) +
    String(dupEnglish).padStart(7) +
    String(r.audio.withAudio).padStart(7) +
    String(r.audio.missing).padStart(7) +
    String(r.tags.issues.filter(i => i.type === "EMPTY_TAGS").reduce((a, i) => a + parseInt(i.detail), 0)).padStart(8) +
    String(r.dictionary.issues.length).padStart(8) +
    String(r.cards.issues.length).padStart(8) +
    String(r.tips.issues.length).padStart(7) +
    String(r.pacing.issues.length).padStart(8)
  );
}

// Issue type summary
console.log("\n\n--- ISSUE TYPE BREAKDOWN ---\n");
const allIssueTypes = {};
for (const [, code] of LANGS) {
  const r = allResults[code];
  const allIssues = [
    ...r.dictionary.issues, ...r.cards.issues, ...r.tips.issues,
    ...r.audio.issues, ...r.tags.issues, ...r.pacing.issues
  ];
  for (const issue of allIssues) {
    if (!allIssueTypes[issue.type]) allIssueTypes[issue.type] = { count: 0, langs: new Set() };
    allIssueTypes[issue.type].count++;
    allIssueTypes[issue.type].langs.add(code.toUpperCase());
  }
}

const sortedTypes = Object.entries(allIssueTypes).sort((a, b) => b[1].count - a[1].count);
for (const [type, info] of sortedTypes) {
  console.log("  " + type.padEnd(25) + String(info.count).padStart(5) + " instances  (" + [...info.langs].join(", ") + ")");
}

// Grand total
const grandTotal = sortedTypes.reduce((a, [, info]) => a + info.count, 0);
console.log("\n  GRAND TOTAL: " + grandTotal + " issues across all languages");

// ══════════════════════════════════════════════════════════════
// HELPER: print issues with truncation
// ══════════════════════════════════════════════════════════════
function printIssues(issues, maxShow) {
  if (issues.length === 0) {
    console.log("    No issues found");
    return;
  }

  // Group by type
  const byType = {};
  for (const issue of issues) {
    if (!byType[issue.type]) byType[issue.type] = [];
    byType[issue.type].push(issue);
  }

  for (const [type, typeIssues] of Object.entries(byType)) {
    const show = Math.min(typeIssues.length, maxShow);
    console.log("    [" + type + "] " + typeIssues.length + " issues:");
    for (let i = 0; i < show; i++) {
      console.log("      - " + typeIssues[i].detail);
    }
    if (typeIssues.length > show) {
      console.log("      ... and " + (typeIssues.length - show) + " more");
    }
  }
}
