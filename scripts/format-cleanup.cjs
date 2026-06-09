#!/usr/bin/env node
/* Cross-language tip format cleanup:
 *   1. Replace em-dashes (—) with en-dashes (–)
 *   2. Lowercase ALL-CAPS English emphasis words (FOR, BOTH, INSIDE, …)
 *      while preserving linguistic acronyms (SOV, V2, VSO, etc.)
 */

const fs = require('fs');

const LANGS = ['spanish','italian','french','portuguese','german','dutch','swedish','welsh','turkish','hindi','russian'];

// English emphasis words that are commonly SHOUTED in our tips.
// Lowercase these. Other all-caps tokens (acronyms, proper nouns) stay.
const SHOUTED_EMPHASIS = new Set([
  'FOR','BECAUSE','FROM','TO','WITH','IN','ON','BY','AT','OF','OFF',
  'INTO','ONTO','OUT','UP','DOWN','OVER','UNDER',
  'INSIDE','OUTSIDE','BEFORE','AFTER','DURING','THROUGH','ACROSS',
  'SUBJECT','OBJECT','OWNED','OWNER','AGENT','PATIENT','SOURCE','GOAL',
  'BOTH','AND','OR','BUT','NOT','NEVER','ALWAYS','SOMETIMES','OFTEN',
  'ALL','NONE','MANY','FEW','SOME','MORE','LESS','FIRST','SECOND','THIRD',
  'FINAL','INITIAL','EVERY','EACH','ANY','SAME','DIFFERENT','LAST',
  'TWO','THREE','FOUR','FIVE','SIX','ONE',
  'LOOKS','ARE','IS','HAS','HAD','DOES','DOING','GOES','GOING','BEEN','BEING',
  'ONLY','EXACTLY','JUST','REALLY','TRULY','REVERSED','BACKWARDS',
  'PERMANENTLY','TEMPORARILY','PERMANENT','TEMPORARY',
  'MUST','MAY','WILL','CAN','SHOULD','WOULD','COULD',
  'BEFORE','AFTER','UNTIL','BY','SINCE','NOW','RIGHT',
  'SHE','HE','IT','THEY','WE','YOU','ME','US','HIM','HER','THEM',
  'MY','YOUR','HIS','HERS','OUR','THEIR','OWN','OWNS',
  'WHO','WHAT','WHEN','WHERE','WHY','HOW','WHICH',
  'YES','NO','MAYBE',
  'GOOD','BAD','BIG','SMALL','OLD','NEW',
  'ABLE','UNABLE',
  // Linguistic terms commonly shouted in tips
  'ACCUSATIVE','NOMINATIVE','DATIVE','GENITIVE','INSTRUMENTAL','LOCATIVE',
  'SINGULAR','PLURAL','MASCULINE','FEMININE','NEUTER','GENDER',
  'GRAMMATICAL','MUTATE','MUTATES','MUTATED','SOFT','HARD','NASAL',
  'SPEAKER','LISTENER','SPEECH','WRITTEN',
  'EXCEPT','EXCEPTION','OPPOSITE','NEAR','FAR',
  'ALSO','TOO','EVEN','STILL','YET',
  'INFERRED','REPORTED','LIKED','BLOCKS','FEELS','PREDICTABLE',
  'SEPARATELY','SPACE','START','THING','WAY','WERE','WORKING',
  'CLAUSE','SENTENCE','VERB','NOUN','ADJECTIVE','ADVERB','ARTICLE',
  'END','THE','PARA','INTE',
]);

// Acronyms / abbreviations to KEEP as caps (don't lowercase these even
// if they would otherwise trigger the rule). Most aren't in the emphasis
// list above anyway, but list defensively.
const PRESERVE_CAPS = new Set([
  'SOV','SVO','VSO','OSV','V2','V3','OVS','VOS',
  'ICE','VAT','BTW','GDP','IPA','OK',
  'BR','PT','BBC','NS','GVB','OV','KLM',
  'EU','USA','UK','US',
  'DR','MRS','MR',
  'BGN','PCGN','UTF',
]);

let totalEmDash = 0;
let totalShoutFixes = 0;

for (const lang of LANGS) {
  const path = 'src/data/' + lang + '/deck.json';
  const deck = JSON.parse(fs.readFileSync(path, 'utf8'));
  let emDashFix = 0;
  let shoutFix = 0;
  for (const card of deck) {
    if (!card.grammar) continue;
    let g = card.grammar;
    // Em-dash → en-dash
    if (g.includes('—')) {
      g = g.replaceAll('—', '–');
      emDashFix++;
    }
    // Lowercase shouted emphasis
    g = g.replace(/\b[A-Z]{3,}\b/g, (token) => {
      if (PRESERVE_CAPS.has(token)) return token;
      if (SHOUTED_EMPHASIS.has(token)) {
        shoutFix++;
        return token.toLowerCase();
      }
      return token;
    });
    if (g !== card.grammar) card.grammar = g;
  }
  if (emDashFix || shoutFix) {
    fs.writeFileSync(path, JSON.stringify(deck, null, 2));
    console.log(lang.padEnd(11), 'em-dashes fixed:', emDashFix, ' shouts lowered:', shoutFix);
  }
  totalEmDash += emDashFix;
  totalShoutFixes += shoutFix;
}

console.log('\nTotal em-dashes fixed:', totalEmDash);
console.log('Total shouts lowered:', totalShoutFixes);
