/**
 * Mega random-sample QC: 500 cards per language = 5500 total
 * Comprehensive checks with no false positives.
 */
const fs = require("fs");

const LANGS = [
  ["spanish","es"], ["italian","it"], ["french","fr"], ["portuguese","pt"],
  ["german","de"], ["dutch","nl"], ["swedish","sv"], ["welsh","cy"],
  ["hindi","hi"], ["turkish","tr"], ["russian","ru"]
];

function seededRandom(seed) {
  let s = seed;
  return function() {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function shuffle(arr, rng) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

let totalSampled = 0;
let totalIssues = 0;

console.log("╔══════════════════════════════════════════════════════════╗");
console.log("║     MEGA QC: 500 cards × 11 languages = 5500 cards     ║");
console.log("╚══════════════════════════════════════════════════════════╝\n");

for (const [dir, code] of LANGS) {
  const deck = JSON.parse(fs.readFileSync("src/data/" + dir + "/deck.json", "utf8"));
  const indices = shuffle(Array.from({length: deck.length}, (_, i) => i), seededRandom(123 + code.charCodeAt(0)));
  const sampleSize = Math.min(500, deck.length);
  const sample = indices.slice(0, sampleSize).map(i => deck[i]);
  totalSampled += sampleSize;

  const issues = [];

  for (const card of sample) {
    const target = (card.target || "").trim();
    const english = (card.english || "").trim();

    // 1. Empty/very short
    if (target.length < 3) issues.push({ id: card.id, type: "EMPTY_TARGET", d: target });
    if (english.length < 3) issues.push({ id: card.id, type: "EMPTY_ENGLISH", d: english });

    // 2. Wrong script detection (strict)
    if (code === "hi") {
      // Hindi should primarily be Devanagari
      const devaChars = (target.match(/[\u0900-\u097F]/g) || []).length;
      const latinChars = (target.match(/[a-zA-Z]/g) || []).length;
      if (latinChars > devaChars && target.length > 10) {
        issues.push({ id: card.id, type: "WRONG_SCRIPT", d: target.slice(0, 60) });
      }
    }
    if (code === "ru") {
      const cyrChars = (target.match(/[\u0400-\u04FF]/g) || []).length;
      const latinChars = (target.match(/[a-zA-Z]/g) || []).length;
      if (latinChars > cyrChars && target.length > 10) {
        issues.push({ id: card.id, type: "WRONG_SCRIPT", d: target.slice(0, 60) });
      }
    }

    // 3. Target identical to English (not translated)
    if (target.toLowerCase() === english.toLowerCase() && target.length > 5) {
      issues.push({ id: card.id, type: "NOT_TRANSLATED", d: target.slice(0, 60) });
    }

    // 4. Missing required fields
    if (!card.grammarNode) issues.push({ id: card.id, type: "NO_NODE", d: "" });
    if (!card.tags || card.tags.length === 0) issues.push({ id: card.id, type: "NO_TAGS", d: "" });
    if (!card.tags || !card.tags.includes("general")) issues.push({ id: card.id, type: "MISSING_GENERAL_TAG", d: "" });
    if (code !== "cy" && (!card.audio || card.audio.trim() === "")) issues.push({ id: card.id, type: "NO_AUDIO", d: "" });

    // 5. Extreme length mismatch
    const tw = target.split(/\s+/).length;
    const ew = english.split(/\s+/).length;
    if (tw > 4 && ew > 4 && (tw / ew > 5 || ew / tw > 5)) {
      issues.push({ id: card.id, type: "LENGTH_MISMATCH", d: "Target " + tw + "w, English " + ew + "w" });
    }

    // 6. Broken UTF-8 / replacement characters
    if (/\uFFFD|\\u[0-9a-fA-F]{4}/.test(target)) {
      issues.push({ id: card.id, type: "BROKEN_UNICODE", d: target.slice(0, 60) });
    }

    // 7. HTML/code remnants
    if (/<\/?[a-z][^>]*>/i.test(target) || /&[a-z]+;/i.test(target)) {
      issues.push({ id: card.id, type: "HTML_IN_TARGET", d: target.slice(0, 60) });
    }

    // 8. Very long grammar tips (> 300 chars = probably bad)
    if (card.grammar && card.grammar.length > 300) {
      issues.push({ id: card.id, type: "TIP_TOO_LONG", d: card.grammar.length + " chars" });
    }

    // 9. Duplicate detection
    // (handled separately below)
  }

  // Check for duplicates in sample
  const targetSet = {};
  for (const card of deck) {
    const t = (card.target || "").trim().toLowerCase();
    if (!targetSet[t]) targetSet[t] = 0;
    targetSet[t]++;
  }
  const dupes = Object.entries(targetSet).filter(([t, c]) => c > 1 && t.length > 0);
  if (dupes.length > 0) {
    issues.push({ id: "DECK", type: "DUPLICATES", d: dupes.length + " duplicate sentences in full deck" });
  }

  totalIssues += issues.length;

  // Print
  if (issues.length === 0) {
    console.log(code.toUpperCase() + ": ✅ " + sampleSize + " cards sampled – 0 issues");
  } else {
    console.log(code.toUpperCase() + ": " + sampleSize + " cards sampled – " + issues.length + " issues:");
    const byType = {};
    for (const issue of issues) {
      if (!byType[issue.type]) byType[issue.type] = [];
      byType[issue.type].push(issue);
    }
    for (const [type, typeIssues] of Object.entries(byType)) {
      if (typeIssues.length <= 2) {
        typeIssues.forEach(i => console.log("  [" + type + "] Card " + i.id + ": " + i.d));
      } else {
        console.log("  [" + type + "] " + typeIssues.length + " instances");
        typeIssues.slice(0, 2).forEach(i => console.log("    Card " + i.id + ": " + i.d));
      }
    }
  }
}

console.log("\n═══════════════════════════════════════════════");
console.log("TOTAL: " + totalSampled + " cards sampled, " + totalIssues + " issues found");
console.log("Overall quality: " + ((totalSampled - totalIssues) / totalSampled * 100).toFixed(2) + "%");
