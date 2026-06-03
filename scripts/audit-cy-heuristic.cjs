#!/usr/bin/env node
// Welsh dict heuristic audit
const fs = require('fs');
const content = fs.readFileSync('src/data/dictionary/cy.ts', 'utf8');
const re = /^\s*'([^']+)':\s*{\s*en:\s*'([^']*)'.*?pos:\s*'([^']+)'/;
const entries = [];
for (const line of content.split('\n')) {
  const m = line.match(re);
  if (m) entries.push({ word: m[1], en: m[2], pos: m[3] });
}
console.log('Total entries:', entries.length);

const welshNames = [
  'bryn','madog','heledd','elin','siân','sian','efa','aled','cerys','carys','gareth','owain','rhys','tomos','huw','dai','iolo','seren','llinos','meinir','gwen','meirion','deryn','peredur','arthur','myrddin','idris','dylan','rhodri','gwyneth','glenys','ceri','ffion','catrin','angharad','bethan','meleri'
];

console.log('\n=== Welsh proper names treated as common nouns/adjectives ===');
for (const name of welshNames) {
  const entry = entries.find(e => e.word === name);
  if (entry && (entry.pos === 'n' || entry.pos === 'adj')) {
    console.log('  ' + name.padEnd(12) + '= [' + entry.en + ']  (' + entry.pos + ')');
  }
}

console.log('\n=== Self-referencing entries (Welsh word === English) – top 30 ===');
let count = 0;
const selfRef = entries.filter(e => e.word.length >= 4 && e.word.toLowerCase() === e.en.toLowerCase() && e.pos === 'n');
console.log('  Total self-referencing nouns:', selfRef.length);
for (const e of selfRef.slice(0, 30)) {
  console.log('  ' + e.word.padEnd(15) + '= [' + e.en + ']  (' + e.pos + ')');
}

console.log("\n=== Verbs without 'to' prefix – top 30 ===");
const vMissingTo = entries.filter(e => e.pos === 'v' && !e.en.startsWith('to ') && !e.en.startsWith('to;') && !e.en.startsWith('(to)') && !e.en.startsWith("don't"));
console.log('  Total verbs without "to":', vMissingTo.length);
for (const e of vMissingTo.slice(0, 30)) {
  console.log('  ' + e.word.padEnd(15) + '= [' + e.en + ']  (' + e.pos + ')');
}

// Save lists for fixing
fs.mkdirSync('scripts/output', { recursive: true });
fs.writeFileSync('scripts/output/cy-heuristic-audit.json', JSON.stringify({
  proper_names: welshNames.map(n => ({ name: n, entry: entries.find(e => e.word === n) })).filter(x => x.entry),
  self_referencing_nouns: selfRef,
  verbs_missing_to: vMissingTo,
}, null, 2));
console.log('\nWrote scripts/output/cy-heuristic-audit.json');
