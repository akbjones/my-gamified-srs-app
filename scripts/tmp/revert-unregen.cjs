#!/usr/bin/env node
// The TTS key died mid-regen: 204 of 869 replaced cards got new audio, 665 did
// not. Never ship a card whose audio says a different sentence than the text —
// so restore the ORIGINAL text for the 665 that have no matching clip. They
// stay flagged in docs/hi-quality/ and get re-applied when a key works again.
const { execSync } = require('child_process');
const fs = require('fs');
const failed = new Set(JSON.parse(fs.readFileSync('/private/tmp/regen-failed.json', 'utf8')).map(String));
const orig = JSON.parse(execSync('git show HEAD:src/data/hindi/deck.json', { maxBuffer: 1 << 28 }).toString());
const origById = new Map(orig.map(c => [String(c.id), c]));
const p = 'src/data/hindi/deck.json';
const deck = JSON.parse(fs.readFileSync(p, 'utf8'));
let reverted = 0;
for (const c of deck) {
  const id = String(c.id);
  if (!failed.has(id)) continue;
  const o = origById.get(id);
  if (!o) continue;
  c.target = o.target; c.english = o.english;
  if (o.tokens) c.tokens = o.tokens;
  reverted++;
}
fs.writeFileSync(p, JSON.stringify(deck, null, 2) + '\n');
fs.writeFileSync('docs/hi-quality/pending-regen.json', JSON.stringify([...failed], null, 1));
console.log(`reverted ${reverted} cards to original text (no matching audio yet)`);
console.log(`kept ${869 - reverted} replacements that DO have fresh audio`);
console.log('pending list → docs/hi-quality/pending-regen.json');
