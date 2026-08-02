#!/usr/bin/env node
// 3 Korean tips cite the dictionary form (눈, 감사드리다, 찾아뵈다) while the card
// carries an inflected one (눈이, 감사드리는, 찾아뵈어요). Re-anchor to the form
// that actually appears — the matcher stays strict.
const fs = require('fs');
const FIX = {
  'ko-1251': "눈이 와요 (nuni wayo) = it's snowing. On its own 눈 (nun) is both snow and eye - context decides.",
  'ko-1877': '감사드리는 (gamsadeurineun) is the humble form of thanking - used for someone above you, like a teacher.',
  'ko-1882': '찾아뵈어요 (chajaboeeoyo) is the humble word for visiting someone senior, not the everyday 만나요 (mannayo).',
};
const dir = 'docs/tip-clarity2/korean';
let n = 0;
for (const f of fs.readdirSync(dir).filter(f => /^out-\d+\.json$/.test(f))) {
  const p = dir + '/' + f;
  const arr = JSON.parse(fs.readFileSync(p, 'utf8'));
  let ch = false;
  for (const e of arr) if (FIX[String(e.id)]) { e.tip = FIX[String(e.id)]; ch = true; n++; console.log('patched', e.id, 'in', f); }
  if (ch) fs.writeFileSync(p, JSON.stringify(arr, null, 1) + '\n');
}
console.log('patched', n);
