/**
 * For each language, find all deck words NOT in the dictionary.
 * Outputs a per-language list of missing words with context (which card they appear in).
 */
const fs = require("fs");

const langs = [
  ["spanish","es"], ["italian","it"], ["french","fr"], ["portuguese","pt"],
  ["german","de"], ["dutch","nl"], ["swedish","sv"], ["welsh","cy"],
  ["hindi","hi"], ["turkish","tr"], ["russian","ru"]
];

for (const [dir, code] of langs) {
  const deck = JSON.parse(fs.readFileSync("src/data/" + dir + "/deck.json", "utf8"));
  const dictContent = fs.readFileSync("src/data/dictionary/" + code + ".ts", "utf8");

  // Extract dictionary keys (both quoted and unquoted)
  const dictKeys = new Set();
  let m;
  const re1 = /^\s+['"]([^'"]+)['"]\s*:/gm;
  while ((m = re1.exec(dictContent)) !== null) dictKeys.add(m[1].toLowerCase());
  // Match bare keys: word: { ... } (handles accented chars, Cyrillic, Devanagari, tremas etc.)
  const re2 = /^\s+([a-z\u00C0-\u024F\u0400-\u04FF\u0900-\u097F]+)\s*:\s*\{/gm;
  while ((m = re2.exec(dictContent)) !== null) dictKeys.add(m[1].toLowerCase());

  // Also check for helper maps (contractions, irregulars) that the lookupWord function resolves
  // Quoted keys: 'key': [...] or 'key': 'value'
  const mapRe = /['"]([^'"]+)['"]\s*:\s*(?:\[|['"])/gm;
  while ((m = mapRe.exec(dictContent)) !== null) dictKeys.add(m[1].toLowerCase());
  // Bare keys in maps: key: 'value' (e.g., IRREGULAR_MAP entries like tivesse: 'ter')
  const bareMapRe = /\b([a-z\u00C0-\u024F\u0400-\u04FF\u0900-\u097F]+)\s*:\s*'/gm;
  while ((m = bareMapRe.exec(dictContent)) !== null) dictKeys.add(m[1].toLowerCase());

  // Extract all unique words from deck
  const wordCounts = {};
  deck.forEach(function(c) {
    c.target.split(/[\s,;:.!?¿¡""«»()\-—–'…।॥؟]+/).forEach(function(w) {
      const clean = w.toLowerCase().replace(/^['']+|['']+$/g, '').replace(/[।॥]/g, '').trim();
      if (clean.length > 0 && !/^\d+$/.test(clean)) {
        if (!wordCounts[clean]) wordCounts[clean] = 0;
        wordCounts[clean]++;
      }
    });
  });

  // Find missing words, sorted by frequency (most common first)
  const missing = [];
  for (const [word, count] of Object.entries(wordCounts)) {
    if (!dictKeys.has(word)) {
      missing.push({ word, count });
    }
  }
  missing.sort((a, b) => b.count - a.count);

  const total = Object.keys(wordCounts).length;
  const found = total - missing.length;
  const pct = (found / total * 100).toFixed(1);

  console.log("\n=== " + code.toUpperCase() + " === " + found + "/" + total + " = " + pct + "% covered (" + missing.length + " missing)");
  // Show ALL missing words
  missing.forEach(function(m) {
    console.log("  " + m.word + " (x" + m.count + ")");
  });
}
