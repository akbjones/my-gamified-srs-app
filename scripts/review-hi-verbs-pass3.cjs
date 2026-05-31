#!/usr/bin/env node
/**
 * Hindi dictionary review — PASS 3
 * Add missing lemmas to verb conjugations + fix remaining garbled entries.
 */

const fs = require('fs');
const path = require('path');

const DICT_PATH = path.join(__dirname, '..', 'src', 'data', 'dictionary', 'hi.ts');
const OUTPUT_PATH = path.join(__dirname, 'output', 'hi-full-verb-review.json');

const src = fs.readFileSync(DICT_PATH, 'utf8');

const entries = [];
const lineRegex = /^\s*['"]([^'"]+)['"]\s*:\s*\{([^}]+)\}/gm;
let m;
while ((m = lineRegex.exec(src)) !== null) {
  const en = m[2].match(/en:\s*'((?:[^'\\]|\\.)*)'/)?.[1]?.replace(/\\'/g, "'") || '';
  const pos = m[2].match(/pos:\s*'((?:[^'\\]|\\.)*)'/)?.[1] || '';
  const lemma = m[2].match(/lemma:\s*'((?:[^'\\]|\\.)*)'/)?.[1] || undefined;
  entries.push({ key: m[1], en, pos, lemma });
}
console.log(`Total entries parsed: ${entries.length}`);

// ═══ FIXES: add lemma to verb forms + fix garbled ═══════════════════════════
const FIXES = {
  // Verb forms needing lemma
  'अटका': { en: 'to stick', pos: 'v', lemma: 'अटकना' },
  'उगाई': { en: 'to grow', pos: 'v', lemma: 'उगाना' },
  'उगाया': { en: 'to grow', pos: 'v', lemma: 'उगाना' },
  'उड़': { en: 'to fly', pos: 'v', lemma: 'उड़ना' },
  'उड़ाई': { en: 'to fly', pos: 'v', lemma: 'उड़ाना' },
  'उमड़': { en: 'to surge', pos: 'v', lemma: 'उमड़ना' },
  'कट': { en: 'to cut', pos: 'v', lemma: 'कटना' },
  'कटवाए': { en: 'to get cut', pos: 'v', lemma: 'कटवाना' },
  'कटी': { en: 'to cut', pos: 'v', lemma: 'कटना' },
  'कर': { en: 'to do', pos: 'v', lemma: 'करना' },
  'करवाओ': { en: 'to get done', pos: 'v', lemma: 'करवाना' },
  'करवानी': { en: 'to get done', pos: 'v', lemma: 'करवाना' },
  'कह': { en: 'to say', pos: 'v', lemma: 'कहना' },
  'कहने': { en: 'to say', pos: 'v', lemma: 'कहना' },
  'कहे': { en: 'to say', pos: 'v', lemma: 'कहना' },
  'काँपते': { en: 'to tremble', pos: 'v', lemma: 'काँपना' },
  'काटे': { en: 'to cut', pos: 'v', lemma: 'काटना' },
  'काटो': { en: 'to cut', pos: 'v', lemma: 'काटना' },
  'ख़रीदने': { en: 'to buy', pos: 'v', lemma: 'ख़रीदना' },
  'ख़रीदा': { en: 'to buy', pos: 'v', lemma: 'ख़रीदना' },
  'ख़रीदीं': { en: 'to buy', pos: 'v', lemma: 'ख़रीदना' },
  'खोदा': { en: 'to dig', pos: 'v', lemma: 'खोदना' },
  'खोदी': { en: 'to dig', pos: 'v', lemma: 'खोदना' },
  'खोला': { en: 'to open', pos: 'v', lemma: 'खोलना' },
  'खोली': { en: 'to open', pos: 'v', lemma: 'खोलना' },
  'खोलो': { en: 'to open', pos: 'v', lemma: 'खोलना' },
  'घबराओ': { en: 'to panic', pos: 'v', lemma: 'घबराना' },
  'चढ़': { en: 'to climb', pos: 'v', lemma: 'चढ़ना' },
  'चढ़ा': { en: 'to climb', pos: 'v', lemma: 'चढ़ना' },
  'जगाओ': { en: 'to wake up', pos: 'v', lemma: 'जगाना' },
  'जा': { en: 'to go', pos: 'v', lemma: 'जाना' },
  'जाँचा': { en: 'to check', pos: 'v', lemma: 'जाँचना' },
  'जाँची': { en: 'to check', pos: 'v', lemma: 'जाँचना' },
  'जाग': { en: 'to wake up', pos: 'v', lemma: 'जागना' },
  'जानते': { en: 'to know', pos: 'v', lemma: 'जानना' },
  'जीतने': { en: 'to win', pos: 'v', lemma: 'जीतना' },
  'टपक': { en: 'to drip', pos: 'v', lemma: 'टपकना' },
  'टहल': { en: 'to stroll', pos: 'v', lemma: 'टहलना' },
  'टिकेगी': { en: 'to last', pos: 'v', lemma: 'टिकना' },
  'ठहरो': { en: 'to wait; to stop', pos: 'v', lemma: 'ठहरना' },
  'ढूँढ': { en: 'to search; to find', pos: 'v', lemma: 'ढूँढना' },
  'ढोईं': { en: 'to carry', pos: 'v', lemma: 'ढोना' },
  'ढोते': { en: 'to carry', pos: 'v', lemma: 'ढोना' },
  'तलो': { en: 'to fry', pos: 'v', lemma: 'तलना' },
  'तैरने': { en: 'to swim', pos: 'v', lemma: 'तैरना' },
  'तोड़ने': { en: 'to break', pos: 'v', lemma: 'तोड़ना' },
  'तोड़े': { en: 'to break', pos: 'v', lemma: 'तोड़ना' },
  'तौलने': { en: 'to weigh', pos: 'v', lemma: 'तौलना' },
  'तौले': { en: 'to weigh', pos: 'v', lemma: 'तौलना' },
  'दर्शाया': { en: 'to depict', pos: 'v', lemma: 'दर्शाना' },
  'दिखाओ': { en: 'to show', pos: 'v', lemma: 'दिखाना' },
  'दिखाने': { en: 'to show', pos: 'v', lemma: 'दिखाना' },
  'दिखेंगे': { en: 'to be seen', pos: 'v', lemma: 'दिखना' },
  'धो': { en: 'to wash', pos: 'v', lemma: 'धोना' },
  'नहाते': { en: 'to bathe', pos: 'v', lemma: 'नहाना' },
  'निगल': { en: 'to swallow', pos: 'v', lemma: 'निगलना' },
  'पकाओ': { en: 'to cook', pos: 'v', lemma: 'पकाना' },
  'पकाया': { en: 'to cook', pos: 'v', lemma: 'पकाना' },
  'पचने': { en: 'to digest', pos: 'v', lemma: 'पचना' },
  'पढ़ाया': { en: 'to teach', pos: 'v', lemma: 'पढ़ाना' },
  'परोस': { en: 'to serve', pos: 'v', lemma: 'परोसना' },
  'परोसा': { en: 'to serve', pos: 'v', lemma: 'परोसना' },
  'परोसी': { en: 'to serve', pos: 'v', lemma: 'परोसना' },
  'परोसो': { en: 'to serve', pos: 'v', lemma: 'परोसना' },
  'पहनते': { en: 'to wear', pos: 'v', lemma: 'पहनना' },
  'पहनने': { en: 'to wear', pos: 'v', lemma: 'पहनना' },
  'पहनी': { en: 'to wear', pos: 'v', lemma: 'पहनना' },
  'पिया': { en: 'to drink', pos: 'v', lemma: 'पीना' },
  'पिलाया': { en: 'to feed', pos: 'v', lemma: 'पिलाना' },
  'पीसो': { en: 'to grind', pos: 'v', lemma: 'पीसना' },
  'पुकारा': { en: 'to call', pos: 'v', lemma: 'पुकारना' },
  'पूछते': { en: 'to ask', pos: 'v', lemma: 'पूछना' },
  'पूछने': { en: 'to ask', pos: 'v', lemma: 'पूछना' },
  'पूछा': { en: 'to ask', pos: 'v', lemma: 'पूछना' },
  'पूछे': { en: 'to ask', pos: 'v', lemma: 'पूछना' },
  'फँसाया': { en: 'to trap', pos: 'v', lemma: 'फँसाना' },
  'फिसल': { en: 'to slip', pos: 'v', lemma: 'फिसलना' },
  'फिसलकर': { en: 'to slip', pos: 'v', lemma: 'फिसलना' },
  'फेंको': { en: 'to throw', pos: 'v', lemma: 'फेंकना' },
  'फैल': { en: 'to spread', pos: 'v', lemma: 'फैलना' },
  'फैला': { en: 'to spread', pos: 'v', lemma: 'फैलना' },
  'फैलाओ': { en: 'to spread', pos: 'v', lemma: 'फैलाना' },
  'फैली': { en: 'to spread', pos: 'v', lemma: 'फैलना' },
  'फैले': { en: 'to spread', pos: 'v', lemma: 'फैलना' },
  'बचाए': { en: 'to save', pos: 'v', lemma: 'बचाना' },
  'बजाते': { en: 'to play (instrument)', pos: 'v', lemma: 'बजाना' },
  'बजाया': { en: 'to play (instrument)', pos: 'v', lemma: 'बजाना' },
  'बढ़ने': { en: 'to grow; to increase', pos: 'v', lemma: 'बढ़ना' },
  'बढ़ेगा': { en: 'to increase', pos: 'v', lemma: 'बढ़ना' },
  'बताइए': { en: 'to tell', pos: 'v', lemma: 'बताना' },
  'बदलने': { en: 'to change', pos: 'v', lemma: 'बदलना' },
  'बदलवाई': { en: 'to replace', pos: 'v', lemma: 'बदलवाना' },
  'बदली': { en: 'to change', pos: 'v', lemma: 'बदलना' },
  'बनवाने': { en: 'to get made', pos: 'v', lemma: 'बनवाना' },
  'बनाईं': { en: 'to make', pos: 'v', lemma: 'बनाना' },
  'बाँटा': { en: 'to distribute', pos: 'v', lemma: 'बाँटना' },
  'बिक': { en: 'to sell', pos: 'v', lemma: 'बिकना' },
  'बिताया': { en: 'to spend', pos: 'v', lemma: 'बिताना' },
  'बुन': { en: 'to weave', pos: 'v', lemma: 'बुनना' },
  'बुलाई': { en: 'to call', pos: 'v', lemma: 'बुलाना' },
  'बुलाओ': { en: 'to call', pos: 'v', lemma: 'बुलाना' },
  'बेचने': { en: 'to sell', pos: 'v', lemma: 'बेचना' },
  'बैठिए': { en: 'to sit down', pos: 'v', lemma: 'बैठना' },
  'बोई': { en: 'to sow', pos: 'v', lemma: 'बोना' },
  'बोओगे': { en: 'to sow', pos: 'v', lemma: 'बोना' },
  'बोते': { en: 'to sow', pos: 'v', lemma: 'बोना' },
  'बोल': { en: 'to speak', pos: 'v', lemma: 'बोलना' },
  'भरने': { en: 'to fill', pos: 'v', lemma: 'भरना' },
  'भागे': { en: 'to run', pos: 'v', lemma: 'भागना' },
  'भिजवाई': { en: 'to send', pos: 'v', lemma: 'भिजवाना' },
  'भीगते': { en: 'to get wet', pos: 'v', lemma: 'भीगना' },
  'भीगने': { en: 'to get wet', pos: 'v', lemma: 'भीगना' },
  'भुने': { en: 'to roast', pos: 'v', lemma: 'भूनना' },
  'भेंगी': { en: 'to squint', pos: 'v', lemma: 'भेंगना' },
  'भेजते': { en: 'to send', pos: 'v', lemma: 'भेजना' },
  'भेजा': { en: 'to send', pos: 'v', lemma: 'भेजना' },
  'भेजी': { en: 'to send', pos: 'v', lemma: 'भेजना' },
  'भेजो': { en: 'to send', pos: 'v', lemma: 'भेजना' },
  'मनाते': { en: 'to celebrate', pos: 'v', lemma: 'मनाना' },
  'मनाया': { en: 'to celebrate', pos: 'v', lemma: 'मनाना' },
  'मारा': { en: 'to hit', pos: 'v', lemma: 'मारना' },
  'मिलाएँ': { en: 'to mix', pos: 'v', lemma: 'मिलाना' },
  'मिलिए': { en: 'to meet', pos: 'v', lemma: 'मिलना' },
  'रुक': { en: 'to stop', pos: 'v', lemma: 'रुकना' },
  'रुकिए': { en: 'to stop; to wait', pos: 'v', lemma: 'रुकना' },
  'रुकी': { en: 'to stop', pos: 'v', lemma: 'रुकना' },
  'रुकेंगे': { en: 'to stop', pos: 'v', lemma: 'रुकना' },
  'रो': { en: 'to cry', pos: 'v', lemma: 'रोना' },
  'लटककर': { en: 'to hang', pos: 'v', lemma: 'लटकना' },
  'लड़ी': { en: 'to fight', pos: 'v', lemma: 'लड़ना' },
  'लपेटकर': { en: 'to wrap', pos: 'v', lemma: 'लपेटना' },
  'ले': { en: 'to take', pos: 'v', lemma: 'लेना' },
  'लौट': { en: 'to return', pos: 'v', lemma: 'लौटना' },
  'सकते': { en: 'can', pos: 'v', lemma: 'सकना' },
  'सके': { en: 'could', pos: 'v', lemma: 'सकना' },
  'समझाई': { en: 'to explain', pos: 'v', lemma: 'समझाना' },
  'समझाया': { en: 'to explain', pos: 'v', lemma: 'समझाना' },
  'समझो': { en: 'to understand', pos: 'v', lemma: 'समझना' },
  'सिखा': { en: 'to teach', pos: 'v', lemma: 'सिखाना' },
  'सिखाया': { en: 'to teach', pos: 'v', lemma: 'सिखाना' },
  'सीख': { en: 'to learn', pos: 'v', lemma: 'सीखना' },
  'सीखने': { en: 'to learn', pos: 'v', lemma: 'सीखना' },
  'सुखाने': { en: 'to dry', pos: 'v', lemma: 'सुखाना' },
  'सुझाई': { en: 'to suggest', pos: 'v', lemma: 'सुझाना' },
  'सुन': { en: 'to listen', pos: 'v', lemma: 'सुनना' },
  'सुनकर': { en: 'to hear', pos: 'v', lemma: 'सुनना' },
  'सुलाया': { en: 'to put to sleep', pos: 'v', lemma: 'सुलाना' },
  'सेंकी': { en: 'to bake', pos: 'v', lemma: 'सेंकना' },
  'सोचा': { en: 'to think', pos: 'v', lemma: 'सोचना' },
  'सोचे': { en: 'to think', pos: 'v', lemma: 'सोचना' },
  'हँस': { en: 'to laugh', pos: 'v', lemma: 'हँसना' },
  'हटा': { en: 'to remove', pos: 'v', lemma: 'हटाना' },
  'हटाया': { en: 'to remove', pos: 'v', lemma: 'हटाना' },

  // Remaining garbled/wrong entries
  'हांडी': { en: 'earthen pot; handi', pos: 'n' },
  'साफ़': { en: 'clean; clear', pos: 'adj' },
};

// ─── Apply ──────────────────────────────────────────────────────────────────
const fixes = [];
for (const e of entries) {
  const fix = FIXES[e.key];
  if (!fix) continue;

  const enChanged = fix.en !== e.en;
  const posChanged = fix.pos !== e.pos;
  const lemmaAdded = fix.lemma && fix.lemma !== e.lemma;

  if (!enChanged && !posChanged && !lemmaAdded) continue;

  let issueType;
  if (e.en.startsWith('to ') && fix.pos !== 'v') issueType = 'to-prefix-on-non-verb';
  else if (lemmaAdded && !enChanged && !posChanged) issueType = 'missing-lemma';
  else if (e.en.includes(';') && fix.en !== e.en) issueType = 'garbage-semicolon';
  else if (enChanged) issueType = 'wrong-meaning';
  else issueType = 'wrong-pos';

  fixes.push({
    key: e.key,
    issueType,
    note: 'Hindi review pass 3',
    old: { en: e.en, pos: e.pos },
    new: { en: fix.en, pos: fix.pos, lemma: fix.lemma || null },
  });
}

console.log(`Pass 3 fixes: ${fixes.length}`);

// Count by type
const counts = {};
for (const f of fixes) {
  counts[f.issueType] = (counts[f.issueType] || 0) + 1;
}
for (const [t, c] of Object.entries(counts)) console.log(`  ${t}: ${c}`);

// Merge with existing
let existing = [];
if (fs.existsSync(OUTPUT_PATH)) {
  existing = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf8'));
}
const existingKeys = new Set(existing.map(f => f.key));
const newFixes = fixes.filter(f => !existingKeys.has(f.key));
const allFixes = [...existing, ...newFixes];
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(allFixes, null, 2));
console.log(`Merged: ${existing.length} + ${newFixes.length} = ${allFixes.length} total`);

// Apply to file
let patched = fs.readFileSync(DICT_PATH, 'utf8');
let applied = 0;

for (const fix of fixes) {
  const key = fix.key;
  const oldEn = fix.old.en.replace(/'/g, "\\'");
  const newEn = fix.new.en.replace(/'/g, "\\'");
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  let changed = false;

  // Replace en if changed
  if (fix.old.en !== fix.new.en) {
    const enPattern = new RegExp(
      `(['"]${escapedKey}['"]\\s*:\\s*\\{[^}]*?)en:\\s*'${oldEn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'`,
    );
    const newPatched = patched.replace(enPattern, `$1en: '${newEn}'`);
    if (newPatched !== patched) { patched = newPatched; changed = true; }
  }

  // Replace pos if changed
  if (fix.old.pos !== fix.new.pos) {
    const posPattern = new RegExp(
      `(['"]${escapedKey}['"]\\s*:\\s*\\{[^}]*?)pos:\\s*'${fix.old.pos}'`,
    );
    const newPatched = patched.replace(posPattern, `$1pos: '${fix.new.pos}'`);
    if (newPatched !== patched) { patched = newPatched; changed = true; }
  }

  // Add lemma if needed
  if (fix.new.lemma) {
    const lemmaExist = new RegExp(`['"]${escapedKey}['"]\\s*:\\s*\\{[^}]*lemma:`);
    if (!lemmaExist.test(patched)) {
      const addPattern = new RegExp(
        `(['"]${escapedKey}['"]\\s*:\\s*\\{[^}]*pos:\\s*'[^']*')(\\s*\\})`,
      );
      const newPatched = patched.replace(addPattern, `$1, lemma: '${fix.new.lemma}'$2`);
      if (newPatched !== patched) { patched = newPatched; changed = true; }
    }
  }

  if (changed) applied++;
}

if (applied > 0) {
  fs.writeFileSync(DICT_PATH, patched);
  console.log(`Applied ${applied} fixes to ${DICT_PATH}`);
}
