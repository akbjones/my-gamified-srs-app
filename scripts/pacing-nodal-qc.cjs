/**
 * Difficulty pacing & nodal quality audit.
 * Checks: word count progression by node, node description quality,
 * grammar tip distribution, tag distribution per node.
 */
const fs = require("fs");

const LANGS = [
  ["spanish","es"], ["italian","it"], ["french","fr"], ["portuguese","pt"],
  ["german","de"], ["dutch","nl"], ["swedish","sv"], ["welsh","cy"],
  ["hindi","hi"], ["turkish","tr"], ["russian","ru"]
];

// Load topic configs to check node descriptions
function loadTopicConfig(dir) {
  try {
    const content = fs.readFileSync("src/data/" + dir + "/topicConfig.ts", "utf8");
    const nodes = [];
    const re = /id:\s*['"]([^'"]+)['"].*?label:\s*['"]([^'"]+)['"]/gs;
    let m;
    while ((m = re.exec(content)) !== null) {
      nodes.push({ id: m[1], label: m[2] });
    }
    return nodes;
  } catch (e) {
    return null;
  }
}

console.log("╔══════════════════════════════════════════════════════╗");
console.log("║     DIFFICULTY PACING & NODAL QUALITY AUDIT         ║");
console.log("╚══════════════════════════════════════════════════════╝\n");

for (const [dir, code] of LANGS) {
  const deck = JSON.parse(fs.readFileSync("src/data/" + dir + "/deck.json", "utf8"));
  const topicConfig = loadTopicConfig(dir);

  console.log("\n━━━ " + code.toUpperCase() + " (" + dir + ") ━━━");

  // Build per-node stats
  const nodeStats = {};
  for (const card of deck) {
    const node = card.grammarNode || "unknown";
    if (!nodeStats[node]) nodeStats[node] = {
      count: 0, totalWords: 0, hasTip: 0,
      tags: { general: 0, travel: 0, work: 0, family: 0 },
      wordLens: [],
    };
    const s = nodeStats[node];
    s.count++;
    const wc = (card.target || "").trim().split(/\s+/).length;
    s.totalWords += wc;
    s.wordLens.push(wc);
    if (card.grammar && card.grammar.trim() !== "") s.hasTip++;
    for (const tag of (card.tags || [])) {
      if (s.tags.hasOwnProperty(tag)) s.tags[tag]++;
    }
  }

  // Sort nodes
  const sortedNodes = Object.entries(nodeStats).sort((a, b) => {
    const na = parseInt(a[0].replace("node-", "")) || 99;
    const nb = parseInt(b[0].replace("node-", "")) || 99;
    return na - nb;
  });

  // Print table
  console.log("Node        Cards  AvgWds  Tips%  Gen%  Trv%  Wrk%  Fam%");
  let prevAvg = 0;
  let pacingIssues = 0;
  for (const [node, s] of sortedNodes) {
    const avg = (s.totalWords / s.count).toFixed(1);
    const tipPct = (s.hasTip / s.count * 100).toFixed(0);
    const genPct = (s.tags.general / s.count * 100).toFixed(0);
    const trvPct = (s.tags.travel / s.count * 100).toFixed(0);
    const wrkPct = (s.tags.work / s.count * 100).toFixed(0);
    const famPct = (s.tags.family / s.count * 100).toFixed(0);

    // Flag pacing issues
    let flag = "";
    const nodeNum = parseInt(node.replace("node-", "")) || 0;
    if (nodeNum <= 5 && parseFloat(avg) > 14) flag = " ⚠️ TOO HARD for A1";
    if (nodeNum >= 30 && parseFloat(avg) < 5) flag = " ⚠️ TOO EASY for C1+";

    console.log(
      node.padEnd(12) +
      String(s.count).padStart(5) +
      String(avg).padStart(7) +
      String(tipPct + "%").padStart(6) +
      String(genPct + "%").padStart(5) +
      String(trvPct + "%").padStart(5) +
      String(wrkPct + "%").padStart(5) +
      String(famPct + "%").padStart(5) +
      flag
    );
  }

  // Check topic config quality
  if (topicConfig) {
    console.log("\n  Topic config: " + topicConfig.length + " nodes defined");
    const deckNodes = new Set(Object.keys(nodeStats));
    for (const tc of topicConfig) {
      if (!deckNodes.has(tc.id)) {
        console.log("  ⚠️ Config node " + tc.id + " (" + tc.label + ") has no cards in deck");
      }
    }
    for (const dn of deckNodes) {
      if (dn !== "unknown" && !topicConfig.find(t => t.id === dn)) {
        console.log("  ⚠️ Deck node " + dn + " not in topicConfig");
      }
    }
  }

  // Overall stats
  const totalTips = deck.filter(c => c.grammar && c.grammar.trim() !== "").length;
  console.log("\n  Total: " + deck.length + " cards | " + (totalTips / deck.length * 100).toFixed(1) + "% tips | " + sortedNodes.length + " nodes");
}
