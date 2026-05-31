/**
 * Random-sample QC: pick 200 random cards per language
 * and check for a comprehensive set of quality issues.
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

const allIssues = {};
let totalSampled = 0;
let totalIssues = 0;

for (const [dir, code] of LANGS) {
  const deck = JSON.parse(fs.readFileSync("src/data/" + dir + "/deck.json", "utf8"));
  const rng = seededRandom(42 + LANGS.indexOf([dir, code].join(",")));
  const indices = shuffle(Array.from({length: deck.length}, (_, i) => i), seededRandom(42));
  const sample = indices.slice(0, 200).map(i => deck[i]);

  const issues = [];
  totalSampled += sample.length;

  for (const card of sample) {
    const target = (card.target || "").trim();
    const english = (card.english || "").trim();
    const node = card.grammarNode || "";
    const tags = card.tags || [];

    // 1. Empty or very short target
    if (target.length < 5) {
      issues.push({ id: card.id, type: "TOO_SHORT", detail: "Target: \"" + target + "\"" });
    }

    // 2. Untranslated / placeholder English
    if (english.length < 5) {
      issues.push({ id: card.id, type: "BAD_ENGLISH", detail: "English: \"" + english + "\"" });
    }

    // 3. Target contains English words (possible bad generation)
    const engWords = (target.match(/\b(the|and|but|because|however|therefore|should|would|could|although|between|through|without|children|people|something|everything|nothing|everyone|someone|anything)\b/gi) || []);
    if (engWords.length >= 2 && code !== "cy") { // Welsh sometimes borrows English
      issues.push({ id: card.id, type: "ENGLISH_IN_TARGET", detail: "Found: " + engWords.join(", ") });
    }

    // 4. Suspicious characters (wrong script for the language)
    if (code === "hi" && /[a-zA-Z]{3,}/.test(target)) {
      issues.push({ id: card.id, type: "WRONG_SCRIPT", detail: "Latin chars in Hindi: \"" + target.slice(0, 60) + "\"" });
    }
    if (code === "ru" && /[a-zA-Z]{3,}/.test(target)) {
      issues.push({ id: card.id, type: "WRONG_SCRIPT", detail: "Latin chars in Russian: \"" + target.slice(0, 60) + "\"" });
    }
    if (["es","it","fr","pt","de","nl","sv"].includes(code) && /[\u0400-\u04FF]/.test(target)) {
      issues.push({ id: card.id, type: "WRONG_SCRIPT", detail: "Cyrillic in Romance/Germanic: \"" + target.slice(0, 60) + "\"" });
    }

    // 5. Missing grammar node
    if (!node || node === "unknown") {
      issues.push({ id: card.id, type: "NO_NODE", detail: "No grammar node assigned" });
    }

    // 6. Missing tags
    if (tags.length === 0) {
      issues.push({ id: card.id, type: "NO_TAGS", detail: "No tags assigned" });
    } else if (!tags.includes("general")) {
      issues.push({ id: card.id, type: "NO_GENERAL_TAG", detail: "Missing 'general' tag" });
    }

    // 7. Missing audio (except Welsh which we know is being generated)
    if (code !== "cy" && (!card.audio || card.audio.trim() === "")) {
      issues.push({ id: card.id, type: "NO_AUDIO", detail: "No audio field" });
    }

    // 8. Target/English mismatch (English way longer/shorter than expected)
    const targetWords = target.split(/\s+/).length;
    const engWords2 = english.split(/\s+/).length;
    if (targetWords > 3 && engWords2 > 3) {
      const ratio = targetWords / engWords2;
      if (ratio > 4 || ratio < 0.25) {
        issues.push({ id: card.id, type: "LENGTH_MISMATCH", detail: "Target " + targetWords + " words vs English " + engWords2 + " words (ratio " + ratio.toFixed(1) + ")" });
      }
    }

    // 9. Grammar tip quality (if present)
    if (card.grammar && card.grammar.trim() !== "") {
      const tip = card.grammar.trim();
      // Check for conjugation patterns (bad)
      if (/\b(yo|tú|él|ella|nosotros|ellos)\b.*[-–]/.test(tip) && code === "es") {
        issues.push({ id: card.id, type: "CONJ_PATTERN_TIP", detail: "Tip may contain conjugation pattern" });
      }
      // Check for very short/useless tips
      if (tip.length < 15) {
        issues.push({ id: card.id, type: "SHORT_TIP", detail: "Very short tip: \"" + tip + "\"" });
      }
      // Check for duplicate tips (same tip on different cards in sample)
    }

    // 10. Repeated punctuation or formatting issues
    if (/[!?]{3,}/.test(target) || /\.{4,}/.test(target)) {
      issues.push({ id: card.id, type: "BAD_PUNCTUATION", detail: "Excessive punctuation: \"" + target.slice(0, 60) + "\"" });
    }

    // 11. Bracket/placeholder remnants
    if (/\[|\]|\{|\}|<|>|TODO|FIXME|XXX/i.test(target)) {
      issues.push({ id: card.id, type: "PLACEHOLDER", detail: "Bracket/placeholder in target: \"" + target.slice(0, 60) + "\"" });
    }
    if (/\[|\]|\{|\}|<|>|TODO|FIXME|XXX/i.test(english)) {
      issues.push({ id: card.id, type: "PLACEHOLDER", detail: "Bracket/placeholder in English: \"" + english.slice(0, 60) + "\"" });
    }
  }

  allIssues[code] = issues;
  totalIssues += issues.length;

  // Print summary for this language
  console.log("\n━━━ " + code.toUpperCase() + " ━━━ sampled " + sample.length + " cards → " + issues.length + " issues");
  if (issues.length === 0) {
    console.log("  ✅ All 200 sampled cards look good");
  } else {
    // Group by type
    const byType = {};
    for (const issue of issues) {
      if (!byType[issue.type]) byType[issue.type] = [];
      byType[issue.type].push(issue);
    }
    for (const [type, typeIssues] of Object.entries(byType)) {
      console.log("  " + type + " (" + typeIssues.length + "):");
      typeIssues.slice(0, 3).forEach(i => console.log("    Card " + i.id + ": " + i.detail));
      if (typeIssues.length > 3) console.log("    ... and " + (typeIssues.length - 3) + " more");
    }
  }
}

console.log("\n╔══════════════════════════════════════════════════════╗");
console.log("║  RANDOM SAMPLE SUMMARY: " + totalSampled + " cards, " + totalIssues + " issues  ║");
console.log("╚══════════════════════════════════════════════════════╝");

// Quality score per language
console.log("\nQuality Score (200 - issues / 200 cards):");
for (const [dir, code] of LANGS) {
  const issueCount = allIssues[code].length;
  const score = ((200 - issueCount) / 200 * 100).toFixed(1);
  const bar = "█".repeat(Math.floor(score / 5)) + "░".repeat(20 - Math.floor(score / 5));
  console.log("  " + code.toUpperCase() + " " + bar + " " + score + "% (" + issueCount + " issues)");
}
