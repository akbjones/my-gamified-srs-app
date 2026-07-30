#!/usr/bin/env node
// Re-anchor the 7 quote-rule failures to a word that appears in each card's
// target sentence (doctrine: fix the tip, never loosen the matcher). Patches
// each tip in whichever rewritten-/filled- file currently holds it.
const fs = require('fs');
const FIXES = [
  { lang: 'italian', id: 'it-1944', tip: "Da' questo libro uses the short tu command: da', di', fa', va', sta' all cut to one syllable, the apostrophe marking the drop." },
  { lang: 'italian', id: 'it-1754', tip: "Before a vowel, lo and la both drop to l', giving l'ho fatto. So l'ho could stand for lo or la." },
  { lang: 'portuguese', id: 'pt-0790', tip: "Tô is casual shorthand for estou: Eu tô precisando = I'm needing. You write estou but say tô." },
  { lang: 'portuguese', id: 'pt-0879', tip: "Tô is casual shorthand for estou: Eu tô na correria = I'm in a rush. Spoken, not written." },
  { lang: 'swedish', id: 'sv-0659', tip: "In Hur gammal är du, du is the only 'you' Swedish needs, from strangers to bosses. Formal Ni is gone." },
  { lang: 'swedish', id: 'sv-1689', tip: "Hur vill du betala: du works for everyone since the 1960s du-reform, strangers and bosses alike." },
  { lang: 'swedish', id: 'sv-0051', tip: "Counting up: en, två, tre, fyra, fem. Watch två, said 'tvoo' with the å like the o in 'more'." },
];

for (const fx of FIXES) {
  const dir = `docs/tips-wave-b/${fx.lang}`;
  let done = false;
  for (const f of fs.readdirSync(dir).filter(f => /^(rewritten|filled)-.*\.json$/.test(f))) {
    const p = `${dir}/${f}`;
    const arr = JSON.parse(fs.readFileSync(p, 'utf8'));
    const e = arr.find(x => x.id === fx.id);
    if (e) { e.tip = fx.tip; fs.writeFileSync(p, JSON.stringify(arr, null, 1) + '\n'); console.log(`patched ${fx.id} in ${f} (${fx.tip.length} chars)`); done = true; break; }
  }
  if (!done) console.log(`!! ${fx.id} not found`);
}
