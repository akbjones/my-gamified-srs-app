#!/usr/bin/env node
// Direct fixes for the two entries the user named, plus the घूम family's IPA:
// घ is a VOICED aspirate (ɡʱ) — some forms had ɡʰ (voiceless marker) and a
// spurious schwa (ɡʰuːməneː → ɡʱuːmneː).
const fs = require('fs');
const p = 'src/data/dictionary/hi.ts';
let s = fs.readFileSync(p, 'utf8');
const reps = [
  // नागा — was "a miss; a skipped day": add the everyday sense it carries in बिना नागा
  [`'नागा': { en: 'a miss; a skipped day'`, `'नागा': { en: 'a missed day; a break in a routine; an absence'`],
  // घूम family — align every inflected form with the lemma's full sense range + fix IPA
  [`'घूमता': { en: 'to roam, to wander', ipa: 'ɡʱuːmtaː'`, `'घूमता': { en: 'to roam; to wander; to travel around; to visit (a place); to go sightseeing', ipa: 'ɡʱuːmtaː'`],
  [`'घूमते': { en: 'to roam, to wander', ipa: 'ɡʱuːmteː'`, `'घूमते': { en: 'to roam; to wander; to travel around; to visit (a place); to go sightseeing', ipa: 'ɡʱuːmteː'`],
  [`'घूमने': { en: 'to roam; to wander; to visit (a place); to go around', ipa: 'ɡʰuːməneː'`, `'घूमने': { en: 'to roam; to wander; to travel around; to visit (a place); to go sightseeing', ipa: 'ɡʱuːmneː'`],
];
let n = 0;
for (const [a, b] of reps) {
  if (s.includes(a)) { s = s.replace(a, b); n++; } else console.log('MISS:', a.slice(0, 50));
}
fs.writeFileSync(p, s);
console.log(`applied ${n}/${reps.length}`);
