#!/usr/bin/env node
/**
 * Post-process Russian semantic fixes:
 * 1. Revert bad replacements (past tense verbs where original was fine, synonyms, etc.)
 * 2. Clean up remaining good fixes (proper formatting)
 * 3. Also fix entries where Google was right but original had truncation/garbage
 */

const fs = require('fs');
const path = require('path');

const DICT_PATH = path.join(__dirname, '..', 'src', 'data', 'dictionary', 'ru.ts');
const fixes = require('./output/ru-semantic-fixes.json');

let content = fs.readFileSync(DICT_PATH, 'utf-8');

// ── Reverts: cases where the original was BETTER or Google is wrong ──
const reverts = new Map();
// ── Manual overrides: cases where neither original nor Google is ideal ──
const overrides = new Map();

for (const f of fixes) {
  const key = f.key;
  const old = f.oldEn;
  const nw = f.newEn;
  const pos = f.pos;

  // 1. "to saw", "to took", "to drove" etc – Google gave English past tense,
  //    but the dictionary should have the infinitive meaning
  if (pos === 'v' && /^to (saw|took|drove|met|stood|went|came|gave|made|ran|ate|drank|sang|wrote|read|bought|sold|found|knew|said|told|got|thought|brought|felt|put|left|had|did|been|kept|let|lost|paid|sat|sent|set|spent|taught|threw|wore|won|broke|chose|drew|fell|flew|grew|held|hid|hung|led|lay|lit|meant|rode|rang|rose|shook|shot|shut|slept|slid|spoke|stole|stuck|struck|swept|swam|swung|tore|woke|wove|fought|forgot|forgave|froze|ground|knelt|leapt|shone|sowed|spun|sprang|stung|stank|strode|strung|swore|typed|wept|wound|wrung|abandoned|cooked|objected)($| )/.test(nw)) {
    // If original was truncated/broken, provide a corrected infinitive
    if (old.includes('\\') || old.length <= 3) {
      // Keep the Google translation but fix it to infinitive form
      // We'll handle these in overrides below
    } else if (!old.includes('\\')) {
      // Original was fine, revert
      reverts.set(key, old);
      continue;
    }
  }

  // 2. Identical translations (no real change)
  if (old.replace(/^to /, '').trim() === nw.replace(/^to /, '').trim()) {
    reverts.set(key, old);
    continue;
  }

  // 3. Google gave "fast" for "быстро" (quickly) – both valid, keep original
  // 4. Revert synonym swaps where original was perfectly correct
  const synonymReverts = {
    'быстро': 'quickly',
    'веселее': 'more cheerful',
    'домом': 'house',
    'дому': 'house',
    'городов': 'city',
    'города': 'city',
    'блин': 'pancake; damn',
    'зато': 'but then; on the other hand',
    'всеми': 'all; whole',
    'жены': 'wife',
  };
  if (synonymReverts[key]) {
    reverts.set(key, synonymReverts[key]);
    continue;
  }

  // 5. Fix "to I'm ...", "to i saw" etc – these are conjugated forms, clean them up
  if (pos === 'v') {
    let cleaned = nw;
    // Remove personal pronouns from verb translations
    cleaned = cleaned.replace(/^to (i'm |i am |i was |i will |i |you |he |she |it |we |we're |they |they're |you're |he's |she's |it's )/i, 'to ');
    // "to we're running" -> "to run"
    cleaned = cleaned.replace(/^to (we're |they're |he's |she's |it's )/, 'to ');
    // Remove "'ll", "'re" etc
    cleaned = cleaned.replace(/^to (i'll |you'll |he'll |she'll |we'll |they'll )/, 'to ');

    if (cleaned !== nw) {
      overrides.set(key, cleaned);
      continue;
    }
  }
}

// ── Specific manual overrides for tricky entries ──
const manualFixes = {
  // Broken originals that need proper translations
  'войти': { en: 'to enter; to come in', pos: 'v' },
  'волнуюсь': { en: 'to worry; to be nervous', pos: 'v' },
  'ест': { en: 'to eat', pos: 'v' },
  'ешь': { en: 'to eat', pos: 'v' },
  'ездит': { en: 'to drive; to ride', pos: 'v' },
  'держи': { en: 'to hold (imperative)', pos: 'v' },
  'возразил': { en: 'to object', pos: 'v' },
  'возьмите': { en: 'to take (imperative)', pos: 'v' },
  'бросил': { en: 'to throw; to quit', pos: 'v' },
  'готовил': { en: 'to cook; to prepare', pos: 'v' },
  'готовила': { en: 'to cook; to prepare', pos: 'v' },
  'засияла': { en: 'to shine; to light up', pos: 'v' },
  'возил': { en: 'to transport; to drive', pos: 'v' },
};

// Apply reverts
let revertCount = 0;
for (const [key, oldEn] of reverts) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(\\s*'${escaped}':\\s*\\{\\s*en:\\s*')([^']*)(')`, '');
  const escapedVal = oldEn.replace(/'/g, "\\'");
  if (content.match(re)) {
    content = content.replace(re, `$1${escapedVal}$3`);
    revertCount++;
  }
}

// Apply overrides
let overrideCount = 0;
for (const [key, val] of overrides) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(\\s*'${escaped}':\\s*\\{\\s*en:\\s*')([^']*)(')`, '');
  const escapedVal = val.replace(/'/g, "\\'");
  if (content.match(re)) {
    content = content.replace(re, `$1${escapedVal}$3`);
    overrideCount++;
  }
}

// Apply manual fixes
let manualCount = 0;
for (const [key, fix] of Object.entries(manualFixes)) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(\\s*'${escaped}':\\s*\\{\\s*en:\\s*')([^']*)(')`, '');
  const escapedVal = fix.en.replace(/'/g, "\\'");
  if (content.match(re)) {
    content = content.replace(re, `$1${escapedVal}$3`);
    manualCount++;
  }
}

fs.writeFileSync(DICT_PATH, content);
console.log(`Reverted: ${revertCount}`);
console.log(`Overrides: ${overrideCount}`);
console.log(`Manual fixes: ${manualCount}`);
console.log(`Net fixes remaining: ${fixes.length - revertCount}`);
