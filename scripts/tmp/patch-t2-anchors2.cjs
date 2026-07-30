#!/usr/bin/env node
// Re-anchor 14 Tier-2 tips (pt 6, de 2, nl 2, sv 4) whose citations were all <3 chars.
const fs = require('fs');
const FIX = {
  portuguese: {
    'pt-0500': "'PF' on a 'cardápio' (menu) stands for 'prato feito' – a cheap, filling set meal of rice, beans, meat and salad, found all over Brazil.",
    'pt-0623': "'Moro no centro' shows 'no' = 'em' + 'o' (in the, masculine). 'Na' is 'em' + 'a'. Both are mandatory.",
    'pt-0698': "'O problema do trânsito': 'do' = 'de' + 'o' (of the, masculine). You'll almost never see 'de o' written out.",
    'pt-0747': "'Vai à academia': 'à' = 'a' + 'a' (to the, feminine) – the famous 'crase', marked with its own accent.",
    'pt-1454': "'Te falei' = I told you: 'te' is the informal object pronoun. Brazilians pair 'te' with 'você' even though it belongs to 'tu'.",
    'pt-3338': "'Se eu tenho tempo': 'se' + the indicative expresses general truths and habits.",
  },
  german: {
    'de-0339': "'Ob' (whether) introduces an indirect yes/no question, and the verb moves to the end: 'ob das richtig ist'.",
    'de-0812': "'Um den See herum': 'um' (around) always takes the accusative – 'den See', no exceptions.",
  },
  dutch: {
    'nl-1109': "'Wij danken u': 'u' is the formal you, used in polite situations.",
    'nl-3322': "'Ik ga zo weg' = I'm leaving in a moment: 'zo' is a very casual 'soon'.",
  },
  swedish: {
    'sv-0690': "In 'jag är ny här', 'ny' agrees with its noun: 'ny' with en-words, 'nytt' with ett-words, 'nya' in definite and plural forms.",
    'sv-1205': "'Jag saknar er' = I miss you: 'er' is both the plural-you object and 'your'; context decides.",
    'sv-1585': "'Inte bestämt sig än' = not decided yet: 'än' (yet) sits at the end of a negative sentence.",
    'sv-3448': "'Gå ut och äta' = go out and eat: 'ut' is a verb particle, as in 'ta ut' (take out) and 'se ut' (appear).",
  },
};
for (const [lang, fixes] of Object.entries(FIX)) {
  const dir = `docs/tip-clarity2/${lang}`;
  for (const f of fs.readdirSync(dir).filter(f => /^out-\d+\.json$/.test(f))) {
    const p = dir + '/' + f;
    const arr = JSON.parse(fs.readFileSync(p));
    let ch = false;
    for (const e of arr) if (fixes[e.id]) { e.tip = fixes[e.id]; ch = true; console.log('patched', e.id); }
    if (ch) fs.writeFileSync(p, JSON.stringify(arr, null, 1) + '\n');
  }
}
