/**
 * Deep QC audit across all 11 languages.
 * Checks: sentence quality, difficulty pacing, vocab coverage,
 * nodal coverage, nodal quality, random sampling.
 */
const fs = require("fs");

const LANGS = [
  ["spanish","es"], ["italian","it"], ["french","fr"], ["portuguese","pt"],
  ["german","de"], ["dutch","nl"], ["swedish","sv"], ["welsh","cy"],
  ["hindi","hi"], ["turkish","tr"], ["russian","ru"]
];

const issues = {};
function addIssue(lang, category, msg) {
  if (!issues[lang]) issues[lang] = {};
  if (!issues[lang][category]) issues[lang][category] = [];
  issues[lang][category].push(msg);
}

for (const [dir, code] of LANGS) {
  const deck = JSON.parse(fs.readFileSync("src/data/" + dir + "/deck.json", "utf8"));

  // ══════════════════════════════════════════════════
  // 1. SENTENCE QUALITY CHECKS
  // ══════════════════════════════════════════════════
  const ids = new Set();
  for (const card of deck) {
    // Duplicate IDs
    if (ids.has(card.id)) addIssue(code, "duplicateId", "Duplicate id: " + card.id);
    ids.add(card.id);

    // Empty/missing fields
    if (!card.target || card.target.trim() === "") addIssue(code, "emptyTarget", "Card " + card.id + " has empty target");
    if (!card.english || card.english.trim() === "") addIssue(code, "emptyEn", "Card " + card.id + " has empty English");
    if (!card.grammarNode) addIssue(code, "noGrammarNode", "Card " + card.id + " has no grammarNode");

    // Suspiciously short sentences (< 3 words)
    if (card.target && card.target.trim().split(/\s+/).length < 2) {
      addIssue(code, "tooShort", "Card " + card.id + ": \"" + card.target.slice(0, 60) + "\"");
    }

    // Very long sentences (> 25 words) — might be too hard
    if (card.target && card.target.trim().split(/\s+/).length > 25) {
      addIssue(code, "tooLong", "Card " + card.id + " has " + card.target.trim().split(/\s+/).length + " words");
    }

    // English in target field (possible copy-paste errors)
    if (card.target && /\b(the|is|are|was|were|have|has|had|will|would|could|should|this|that|with|from|they|them|their|about|because|before|after|should|could|would)\b/i.test(card.target)) {
      // Only flag if it's not a code-switch/loanword scenario
      const engWordCount = (card.target.match(/\b(the|is|are|was|were|have|has|had|will|would|could|should|this|that|with|from|they|them|their)\b/gi) || []).length;
      if (engWordCount >= 3) {
        addIssue(code, "englishInTarget", "Card " + card.id + ": \"" + card.target.slice(0, 80) + "\"");
      }
    }

    // Target = English (exact match)
    if (card.target && card.english && card.target.trim().toLowerCase() === card.english.trim().toLowerCase()) {
      addIssue(code, "targetEqualsEn", "Card " + card.id + ": target identical to English");
    }

    // Duplicate sentences (same target)
    // (checked below)
  }

  // Duplicate targets
  const targetCounts = {};
  for (const card of deck) {
    const t = (card.target || "").trim().toLowerCase();
    if (!targetCounts[t]) targetCounts[t] = [];
    targetCounts[t].push(card.id);
  }
  for (const [t, cardIds] of Object.entries(targetCounts)) {
    if (cardIds.length > 1 && t.length > 0) {
      addIssue(code, "duplicateTarget", cardIds.length + "x: \"" + t.slice(0, 70) + "\" (ids: " + cardIds.slice(0, 3).join(",") + ")");
    }
  }

  // ══════════════════════════════════════════════════
  // 2. DIFFICULTY PACING
  // ══════════════════════════════════════════════════
  // Check that early nodes (node-01 to node-10) have shorter/simpler sentences
  // and later nodes progressively get longer
  const nodeWordAvgs = {};
  for (const card of deck) {
    const node = card.grammarNode || "unknown";
    if (!nodeWordAvgs[node]) nodeWordAvgs[node] = [];
    const wordCount = (card.target || "").trim().split(/\s+/).length;
    nodeWordAvgs[node].push(wordCount);
  }

  // Check A1 nodes aren't too complex
  for (let i = 1; i <= 5; i++) {
    const nodeName = "node-" + String(i).padStart(2, "0");
    const words = nodeWordAvgs[nodeName];
    if (words) {
      const avg = words.reduce((a, b) => a + b, 0) / words.length;
      if (avg > 12) {
        addIssue(code, "pacingTooHard", nodeName + " avg " + avg.toFixed(1) + " words (expected <12 for early node)");
      }
    }
  }
  // Check C1/C2 nodes aren't too simple
  for (let i = 30; i <= 35; i++) {
    const nodeName = "node-" + String(i).padStart(2, "0");
    const words = nodeWordAvgs[nodeName];
    if (words) {
      const avg = words.reduce((a, b) => a + b, 0) / words.length;
      if (avg < 5) {
        addIssue(code, "pacingTooEasy", nodeName + " avg " + avg.toFixed(1) + " words (expected >5 for advanced node)");
      }
    }
  }

  // ══════════════════════════════════════════════════
  // 3. NODAL COVERAGE
  // ══════════════════════════════════════════════════
  const nodeCounts = {};
  for (const card of deck) {
    const node = card.grammarNode || "unknown";
    if (!nodeCounts[node]) nodeCounts[node] = 0;
    nodeCounts[node]++;
  }

  // Check expected nodes exist (node-01 through node-35)
  for (let i = 1; i <= 35; i++) {
    const nodeName = "node-" + String(i).padStart(2, "0");
    if (!nodeCounts[nodeName]) {
      addIssue(code, "missingNode", "Missing node: " + nodeName);
    } else if (nodeCounts[nodeName] < 50) {
      addIssue(code, "thinNode", nodeName + " has only " + nodeCounts[nodeName] + " cards (expected 50+)");
    }
  }

  // Check for unexpected nodes
  for (const node of Object.keys(nodeCounts)) {
    if (node !== "unknown" && !/^node-\d{2}$/.test(node)) {
      addIssue(code, "badNodeName", "Unexpected node name: " + node + " (" + nodeCounts[node] + " cards)");
    }
  }

  // ══════════════════════════════════════════════════
  // 4. VOCAB DISTRIBUTION
  // ══════════════════════════════════════════════════
  const uniqueWords = new Set();
  for (const card of deck) {
    (card.target || "").split(/[\s,;:.!?¿¡""«»()\-—–'…।]+/).forEach(function(w) {
      const clean = w.toLowerCase().trim();
      if (clean.length > 0) uniqueWords.add(clean);
    });
  }

  if (uniqueWords.size < 3500) {
    addIssue(code, "lowVocab", "Only " + uniqueWords.size + " unique words (expected 3500+)");
  }

  // ══════════════════════════════════════════════════
  // 5. TAG COVERAGE
  // ══════════════════════════════════════════════════
  const tagCounts = { general: 0, travel: 0, work: 0, family: 0 };
  for (const card of deck) {
    const tags = card.tags || [];
    for (const tag of Object.keys(tagCounts)) {
      if (tags.includes(tag)) tagCounts[tag]++;
    }
  }

  const generalPct = (tagCounts.general / deck.length * 100).toFixed(0);
  if (parseInt(generalPct) < 90) {
    addIssue(code, "tagCoverage", "general tag only " + generalPct + "% (expected ~100%)");
  }
}

// ══════════════════════════════════════════════════
// OUTPUT REPORT
// ══════════════════════════════════════════════════
console.log("╔══════════════════════════════════════════════════════╗");
console.log("║           DEEP QC AUDIT — ALL 11 LANGUAGES          ║");
console.log("╚══════════════════════════════════════════════════════╝\n");

for (const [dir, code] of LANGS) {
  const langIssues = issues[code] || {};
  const totalIssues = Object.values(langIssues).reduce((a, b) => a + b.length, 0);

  console.log("━━━ " + code.toUpperCase() + " (" + dir + ") ━━━ " + totalIssues + " issues");

  for (const [cat, msgs] of Object.entries(langIssues)) {
    if (msgs.length <= 5) {
      msgs.forEach(m => console.log("  [" + cat + "] " + m));
    } else {
      msgs.slice(0, 3).forEach(m => console.log("  [" + cat + "] " + m));
      console.log("  [" + cat + "] ... and " + (msgs.length - 3) + " more");
    }
  }
  if (totalIssues === 0) console.log("  ✅ No issues found");
  console.log("");
}

// Summary table
console.log("\n═══ SUMMARY TABLE ═══");
console.log("Lang  DupID  DupTgt  Empty  Short  Long  EngInTgt  Pacing  Nodes  Vocab  Tags");
for (const [dir, code] of LANGS) {
  const i = issues[code] || {};
  const row = [
    code.toUpperCase().padEnd(5),
    String((i.duplicateId || []).length).padStart(5),
    String((i.duplicateTarget || []).length).padStart(7),
    String(((i.emptyTarget || []).length + (i.emptyEn || []).length)).padStart(6),
    String((i.tooShort || []).length).padStart(6),
    String((i.tooLong || []).length).padStart(5),
    String((i.englishInTarget || []).length).padStart(9),
    String(((i.pacingTooHard || []).length + (i.pacingTooEasy || []).length)).padStart(7),
    String(((i.missingNode || []).length + (i.thinNode || []).length + (i.badNodeName || []).length)).padStart(6),
    String((i.lowVocab || []).length).padStart(6),
    String((i.tagCoverage || []).length).padStart(5),
  ];
  console.log(row.join(""));
}
