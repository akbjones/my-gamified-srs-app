#!/usr/bin/env node
/**
 * Detect Turkish subject-verb agreement bugs.
 *
 * Pattern: subject pronoun (Sen/Biz/Siz/Onlar/Ben) at sentence start, but the
 * sentence ends with a verb in the wrong person form. The most common bug is
 * subject = Sen/Biz/Siz with verb in 3sg form (no agreement suffix).
 *
 * Examples found in big-final-audit:
 *   "Sen plajda çalışmıyor."      should be çalışmıyorsun
 *   "Sen evde okumuyor."          should be okumuyorsun
 *   "Siz okulda gitmiyor."        should be gitmiyorsunuz
 *   "Biz mutfakta gelmiyor."      should be gelmiyoruz
 */
const fs = require('fs');

const deck = JSON.parse(fs.readFileSync('src/data/turkish/deck.json', 'utf8'));

// Subject → required verb agreement endings
const SUBJ_ENDINGS = {
  'Ben':  ['ım','im','um','üm','m','yım','yim','yum','yüm','dum','dım','dim','düm'],
  'Sen':  ['sın','sin','sun','sün','n','sundur','sındur','sunuz'],
  'Biz':  ['ız','iz','uz','üz','k','duk','dık','dik','dük'],
  'Siz':  ['sınız','siniz','sunuz','sünüz','dınız','diniz','dunuz','dünüz','niz','nız'],
  'Onlar': ['lar','ler','dılar','diler','dular','düler','tılar','tiler'],
};

// Common 3sg verb endings (these are the WRONG forms when subject is non-3sg)
// The target ends in one of these AND the subject is Sen/Biz/Siz/Onlar (not Ben).
// Note: many of these are ambiguous, so we be conservative.
const THIRD_SG_PRESENT_CONT = /\b\w+(?:ı|i|u|ü|a|e)yor\.?$/;     // -yor (3sg pres cont)
const THIRD_SG_PAST_DI      = /\b\w+(?:dı|di|du|dü|tı|ti|tu|tü)\.?$/;   // -dı/-di (3sg past)
const THIRD_SG_FUTURE       = /\b\w+(?:acak|ecek)\.?$/;                  // -acak/-ecek
const THIRD_SG_AORIST_R     = /\b\w+(?:ır|ir|ur|ür|ar|er|r)\.?$/;        // -ır/-er
const THIRD_PL_LAR          = /\b\w+(?:lar|ler)\.?$/;                    // 3pl

function checkAgreement(target) {
  // Find the subject pronoun if it starts the sentence
  const t = target.trim();
  let subj = null;
  for (const s of Object.keys(SUBJ_ENDINGS)) {
    if (t.startsWith(s + ' ')) { subj = s; break; }
  }
  if (!subj) return null;
  if (subj === 'Ben') return null;  // Ben + 3sg is uncommon but harder to detect

  // Get last word of sentence (ignoring punctuation)
  const cleanEnd = t.replace(/[\.!\?]+$/, '').trim();
  const lastWord = cleanEnd.split(/\s+/).pop();
  if (!lastWord) return null;
  const lw = lastWord.toLowerCase();

  // Required endings for the detected subject
  const required = SUBJ_ENDINGS[subj];
  // If the verb ends in any required ending, agreement is OK
  for (const end of required) {
    if (lw.endsWith(end)) return null;
  }

  // If verb appears to be 3sg or 3pl (lar/ler with non-Onlar subject), flag it
  // 3sg present cont (-yor) without -sun/-sunuz/-uz/-lar
  if (THIRD_SG_PRESENT_CONT.test(t)) {
    return { subj, lastWord, kind: 'pres_cont_3sg_with_non3sg_subj' };
  }
  if (THIRD_SG_PAST_DI.test(t) && (subj === 'Sen' || subj === 'Biz' || subj === 'Siz')) {
    return { subj, lastWord, kind: 'past_3sg_with_non3sg_subj' };
  }
  if (THIRD_SG_FUTURE.test(t) && (subj === 'Sen' || subj === 'Biz' || subj === 'Siz')) {
    return { subj, lastWord, kind: 'future_3sg_with_non3sg_subj' };
  }
  if (THIRD_PL_LAR.test(t) && (subj === 'Sen' || subj === 'Biz' || subj === 'Siz')) {
    return { subj, lastWord, kind: '3pl_lar_with_non3pl_subj' };
  }
  return null;
}

const flagged = [];
for (const card of deck) {
  const result = checkAgreement(card.target);
  if (result) {
    flagged.push({ ...card, _agreement: result });
  }
}

console.log('Flagged Turkish cards: ' + flagged.length);
const byKind = {};
for (const c of flagged) byKind[c._agreement.kind] = (byKind[c._agreement.kind] || 0) + 1;
console.log();
console.log('Breakdown by kind:');
for (const [k, n] of Object.entries(byKind)) console.log('  ' + k + ': ' + n);

console.log();
console.log('Sample 30:');
for (const c of flagged.slice(0, 30)) {
  console.log('  ' + c.id + ' [' + c._agreement.subj + ' / ' + c._agreement.kind + ' / ' + c._agreement.lastWord + ']');
  console.log('    ' + c.target);
  console.log('    → ' + c.english);
}

fs.writeFileSync('/tmp/tr-agreement-bugs.json', JSON.stringify(flagged, null, 2));
console.log();
console.log('Saved /tmp/tr-agreement-bugs.json');
