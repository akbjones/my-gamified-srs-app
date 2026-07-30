#!/usr/bin/env node
// Re-anchor 5 Tier-2 tips (it 1, fr 4) whose only citations were <3-char words.
const fs = require('fs');
const FIX = {
  italian: {
    'it-1754': "Before a vowel, both 'lo' and 'la' drop to l', giving 'l'ho già fatto' (I already did it). So 'l'ho' could stand for 'lo' or 'la'.",
  },
  french: {
    'fr-0465': "When inverting with 'il/elle/on', add '-t-' between vowels for sound: 'a-t-il un frère ?', 'va-t-elle ?'",
    'fr-0587': "'Du' = 'de' + 'le', a mandatory contraction: 'le bureau du directeur' = the director's office. Likewise 'des' = 'de' + 'les'.",
    'fr-1924': "'Me' + 'en': 'me' comes first and drops its e before a vowel: 'il m'en a donné' = he gave me some.",
    'fr-2691': "'Or' opening a sentence means 'now' or 'however': 'Or, personne n'avait prévu...' introduces a new, often contradictory fact.",
  },
};
for (const [lang, fixes] of Object.entries(FIX)) {
  const dir = `docs/tip-clarity2/${lang}`;
  for (const f of fs.readdirSync(dir).filter(f => /^out-\d+\.json$/.test(f))) {
    const p = dir + '/' + f;
    const arr = JSON.parse(fs.readFileSync(p));
    let ch = false;
    for (const e of arr) if (fixes[e.id]) { e.tip = fixes[e.id]; ch = true; console.log('patched', e.id, 'in', f); }
    if (ch) fs.writeFileSync(p, JSON.stringify(arr, null, 1) + '\n');
  }
}
