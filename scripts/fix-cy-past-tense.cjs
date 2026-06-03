#!/usr/bin/env node
/**
 * Bulk-fix Welsh past tense / inflected forms in cy.ts where the English
 * meaning is just the infinitive ("to X") despite being a conjugated form.
 *
 * Skips multi-meaning entries (en contains ';') – those need manual review.
 * Skips entries where en doesn't start with "to ".
 */
const fs = require('fs');

const PATH = 'src/data/dictionary/cy.ts';
const src = fs.readFileSync(PATH, 'utf8');
const lines = src.split('\n');

// Common irregular English verb past tenses
const IRREGULAR_PAST = {
  'be': 'was', 'become': 'became', 'begin': 'began', 'bring': 'brought',
  'build': 'built', 'buy': 'bought', 'catch': 'caught', 'choose': 'chose',
  'come': 'came', 'cost': 'cost', 'cut': 'cut', 'do': 'did', 'drink': 'drank',
  'drive': 'drove', 'eat': 'ate', 'fall': 'fell', 'feel': 'felt', 'fight': 'fought',
  'find': 'found', 'fly': 'flew', 'forget': 'forgot', 'get': 'got', 'give': 'gave',
  'go': 'went', 'grow': 'grew', 'have': 'had', 'hear': 'heard', 'hide': 'hid',
  'hit': 'hit', 'hold': 'held', 'keep': 'kept', 'know': 'knew', 'leave': 'left',
  'lend': 'lent', 'let': 'let', 'lie': 'lay', 'lose': 'lost', 'make': 'made',
  'mean': 'meant', 'meet': 'met', 'pay': 'paid', 'put': 'put', 'read': 'read',
  'ride': 'rode', 'rise': 'rose', 'run': 'ran', 'say': 'said', 'see': 'saw',
  'sell': 'sold', 'send': 'sent', 'set': 'set', 'shake': 'shook', 'shine': 'shone',
  'shoot': 'shot', 'show': 'showed', 'shut': 'shut', 'sing': 'sang', 'sit': 'sat',
  'sleep': 'slept', 'speak': 'spoke', 'spend': 'spent', 'stand': 'stood',
  'steal': 'stole', 'sweep': 'swept', 'swim': 'swam', 'take': 'took', 'teach': 'taught',
  'tear': 'tore', 'tell': 'told', 'think': 'thought', 'throw': 'threw',
  'understand': 'understood', 'wake': 'woke', 'wear': 'wore', 'win': 'won',
  'write': 'wrote', 'work': 'worked',
};

// Words where the final consonant MUST be doubled in past tense.
// These are typically single-syllable verbs with short vowel + single consonant.
const DOUBLES = new Set([
  'stop','plan','beg','grab','rub','grip','tap','jog','log','wrap','clap','strip','trip','step','jam','swap','rob','sin','pin','win','spin','skin','knit','sit','fit','quit','hit','set','let','net','bet','plot','rot','dot','pat','rat','chat','mat','fat','flat','nod','prod','pet','prep','ban','can','fan','man','pad','sad','add'
]);

function pastTense(verb) {
  const v = verb.toLowerCase();
  if (IRREGULAR_PAST[v]) return IRREGULAR_PAST[v];
  // Regular past tense
  if (v.endsWith('e')) return v + 'd';
  if (/[bcdfghjklmnpqrstvwxz]y$/i.test(v)) return v.slice(0, -1) + 'ied';
  if (DOUBLES.has(v)) return v + v.slice(-1) + 'ed';
  return v + 'ed';
}

const SUFFIX_RULES = [
  { suf: 'aist',    form: 'you ___ed', label: '2sg past' },
  { suf: 'asant',   form: 'they ___ed', label: '3pl past' },
  { suf: 'aethpwyd', form: 'was ___ed', label: 'impersonal past' },
  { suf: 'pwyd',    form: 'was ___ed', label: 'impersonal past' },
  { suf: 'wyd',     form: 'was ___ed', label: 'impersonal past' },
  { suf: 'ais',     form: 'I ___ed', label: '1sg past' },
  { suf: 'och',     form: 'you ___ed', label: '2pl past' },
  { suf: 'odd',     form: '___ed', label: '3sg past' },
  { suf: 'wch',     form: '___!', label: '2pl imperative' },
];

let fixed = 0;
let skipped = 0;
const fixedSamples = [];

for (let i = 0; i < lines.length; i++) {
  // Match: "  'word': { en: 'to verb', ... pos: 'v', lemma: 'X' },"
  const m = lines[i].match(/^(\s*)'([^']+)':\s*\{\s*en:\s*'([^']+)',\s*(ipa:\s*'[^']*',\s*)?pos:\s*'v',\s*lemma:\s*'([^']+)'\s*\},?$/);
  if (!m) continue;

  const [, indent, word, currentEn, ipaPart, lemma] = m;
  if (word === lemma) continue;

  // Skip multi-meaning entries – too risky for automatic fix
  if (currentEn.includes(';')) { skipped++; continue; }

  // Must currently start with "to "
  if (!currentEn.startsWith('to ')) { skipped++; continue; }

  const verbEng = currentEn.slice(3).trim();
  // Reject if there's anything weird (e.g. parentheses already, multiple words idiomatic)
  if (/[(){}]/.test(verbEng)) { skipped++; continue; }

  let rule = null;
  for (const r of SUFFIX_RULES) {
    if (word.endsWith(r.suf)) { rule = r; break; }
  }
  if (!rule) continue;

  // Build the new English using past tense
  let formStr;
  if (rule.form.includes('___ed')) {
    const past = pastTense(verbEng);
    formStr = rule.form.replace('___ed', past);
  } else {
    formStr = rule.form.replace('___', verbEng);
  }
  const newEn = `${formStr} (${rule.label} of ${lemma})`;

  const ipa = (ipaPart || "ipa: '', ").trim();
  const newLine = `${indent}'${word}': { en: '${newEn}', ${ipa} pos: 'v', lemma: '${lemma}' },`;

  if (newLine !== lines[i]) {
    lines[i] = newLine;
    fixed++;
    if (fixedSamples.length < 30) fixedSamples.push({ word, old: currentEn, new: newEn });
  }
}

fs.writeFileSync(PATH, lines.join('\n'));
console.log(`Fixed ${fixed} entries, skipped ${skipped} (multi-meaning or non-"to" entries – manual review).`);
console.log('Samples:');
fixedSamples.forEach(s => console.log('  ' + s.word.padEnd(18) + ' "' + s.old + '" → "' + s.new + '"'));
