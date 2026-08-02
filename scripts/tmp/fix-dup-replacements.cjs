#!/usr/bin/env node
// Two replacements landed on the SAME new sentence as another card's
// replacement. Give the later one a distinct sentence teaching the same node.
const fs = require('fs');
const FIX = {
  // node-22 (passive): collided with hi-1178's "मेहमानों को चाय दी गई।"
  'hi-2197': { target: 'मुझे यह किताब तोहफ़े में दी गई।', english: 'I was given this book as a gift.' },
  // node-24 (jitna…utna correlative): collided with hi-2359's "जितनी जल्दी निकलोगे…"
  'hi-2391': { target: 'जितना ज़्यादा पढ़ोगे, उतना अच्छा लिखोगे।', english: "The more you read, the better you'll write." },
};
const dir = 'docs/hi-quality/verify';
let n = 0;
for (const f of fs.readdirSync(dir).filter(f => /^out-\d+\.json$/.test(f))) {
  const p = dir + '/' + f;
  const arr = JSON.parse(fs.readFileSync(p, 'utf8'));
  let ch = false;
  for (const e of arr) {
    const fx = FIX[String(e.id)];
    if (fx) { e.target = fx.target; e.english = fx.english; ch = true; n++; console.log(`patched ${e.id} in ${f}`); }
  }
  if (ch) fs.writeFileSync(p, JSON.stringify(arr, null, 1) + '\n');
}
console.log(`patched ${n}`);
