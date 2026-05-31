const fs = require("fs");
const lang = process.argv[2] || "german";
const deck = JSON.parse(fs.readFileSync("src/data/" + lang + "/deck.json", "utf8"));
const nodes = {};
deck.forEach(function(c) {
  const node = c.grammarNode || "unknown";
  if (!nodes[node]) nodes[node] = {total: 0, withTip: 0, noTipIds: []};
  nodes[node].total++;
  if (c.grammar && c.grammar.trim() !== "") {
    nodes[node].withTip++;
  } else {
    nodes[node].noTipIds.push(c.id);
  }
});
const sorted = Object.entries(nodes).sort(function(a, b) { return b[1].total - a[1].total; });
let totalGap = 0;
sorted.forEach(function(e) {
  const gap = e[1].total - e[1].withTip;
  totalGap += gap;
  const pct = (e[1].withTip / e[1].total * 100).toFixed(0);
  console.log(e[0].substring(0, 45).padEnd(47) + e[1].withTip + "/" + e[1].total + " = " + pct.padStart(3) + "% (gap: " + gap + ")");
});
console.log("\nTotal gap: " + totalGap + " cards need tips");
console.log("Need ~" + Math.ceil(deck.length * 0.35 - deck.filter(c => c.grammar && c.grammar.trim() !== "").length) + " more tips to reach 35%");
