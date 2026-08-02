#!/usr/bin/env node
// Add ttsText to every Hindi card containing एसी so the voice says the LETTERS
// (ए.सी.) instead of reading it as a word. Display text is untouched.
const fs = require('fs');
const p = 'src/data/hindi/deck.json';
const deck = JSON.parse(fs.readFileSync(p, 'utf8'));
let n = 0;
for (const c of deck) {
  if (!c.target || !c.target.includes('एसी')) continue;
  const tts = c.target.replace(/एसी/g, 'ए.सी.');
  if (c.ttsText !== tts) { c.ttsText = tts; n++; console.log(`${c.id}: ${c.target}\n   tts → ${tts}`); }
}
fs.writeFileSync(p, JSON.stringify(deck, null, 2) + '\n');
console.log(`\nset ttsText on ${n} cards`);
