const fs = require("fs");
const langs = [
  ["spanish","es"], ["italian","it"], ["french","fr"], ["portuguese","pt"],
  ["german","de"], ["dutch","nl"], ["swedish","sv"], ["welsh","cy"],
  ["hindi","hi"], ["turkish","tr"], ["russian","ru"]
];
for (const [lang, code] of langs) {
  const deck = JSON.parse(fs.readFileSync("src/data/" + lang + "/deck.json", "utf8"));
  const dictContent = fs.readFileSync("src/data/dictionary/" + code + ".ts", "utf8");

  const words = new Set();
  deck.forEach(function(c) {
    c.target.split(/[\s,;:.!?¿¡""«»()\-—–'…।॥؟]+/).forEach(function(w) {
      var clean = w.toLowerCase().replace(/^['']+|['']+$/g, '').replace(/[।॥]/g, '').trim();
      if (clean.length > 0 && !/^\d+$/.test(clean)) words.add(clean);
    });
  });

  // Match quoted keys, unquoted keys, and map entries
  const dictKeys = new Set();
  var m;
  var re1 = /^\s+['"]([^'"]+)['"]\s*:/gm;
  while ((m = re1.exec(dictContent)) !== null) dictKeys.add(m[1].toLowerCase());
  var re2 = /^\s+([a-záàâãéèêíìîóòôõúùûüçñäöüßðþæøåŵŷâêîôûẁỳ\u0400-\u04FF\u0900-\u097F]+)\s*:\s*\{/gm;
  while ((m = re2.exec(dictContent)) !== null) dictKeys.add(m[1].toLowerCase());
  // Also match helper maps
  var re3 = /['"]([^'"]+)['"]\s*:\s*(?:\[|['"])/gm;
  while ((m = re3.exec(dictContent)) !== null) dictKeys.add(m[1].toLowerCase());

  var found = 0;
  words.forEach(function(w) { if (dictKeys.has(w)) found++; });
  var coverage = (found / words.size * 100).toFixed(1);

  var withTips = deck.filter(function(c) { return c.grammar && c.grammar.trim() !== ""; }).length;
  var tipPct = (withTips / deck.length * 100).toFixed(1);

  console.log(code.toUpperCase() + ": " + dictKeys.size + " entries | " + found + "/" + words.size + " = " + coverage + "% | tips: " + tipPct + "%");
}
