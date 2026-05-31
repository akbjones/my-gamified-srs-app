#!/usr/bin/env node
/**
 * Direct fix for entries with corrupted apostrophe escaping.
 * These entries have garbled en values from bad regex replacements.
 * We find them by line and replace the entire en value.
 */

const fs = require('fs');
const DICT_PATH = '/Users/antoinevj/Documents/GitHub/my-gamified-srs-app/.claude/worktrees/agitated-boyd/src/data/dictionary/ru.ts';

let lines = fs.readFileSync(DICT_PATH, 'utf-8').split('\n');

// Map of key → correct en value (WITHOUT surrounding quotes)
// These all have apostrophes that need proper escaping
const fixes = {
  'встретимся': "let\\'s meet",
  'вчерашней': "yesterday\\'s",
  'выпьем': "let\\'s drink",
  'давай': "let\\'s; come on",
  'давайте': "let\\'s; come on",
  'держусь': "to hold on; to keep one\\'s composure",
  'детская': "children\\'s; nursery",
  'детской': "children\\'s",
  'детскую': "children\\'s",
  'жаль': "it\\'s a pity; too bad",
  'завтрашнее': "tomorrow\\'s",
  'завтрашней': "tomorrow\\'s",
  'завтрашнему': "tomorrow\\'s",
  'закончим': "let\\'s finish",
  'идём': "let\\'s go; we\\'re going",
  'новогоднюю': "New Year\\'s",
  'обменяемся': "let\\'s exchange",
  'останемся': "let\\'s stay",
  'поболтаем': "let\\'s chat",
  'поговорим': "let\\'s talk",
  'поедем': "let\\'s go (by vehicle)",
  'поехали': "let\\'s go; went (by vehicle)",
  'пойдём': "let\\'s go",
  'попробуем': "let\\'s try",
  'пора': "it\\'s time",
  'поэтому': "therefore; that\\'s why",
  'причёсываюсь': "to comb one\\'s hair",
  'своего': "one\\'s own",
  'своей': "one\\'s own",
  'свои': "one\\'s own",
  'своим': "one\\'s own",
  'своих': "one\\'s own",
  'свой': "one\\'s own",
  'свою': "one\\'s own",
  'своя': "one\\'s own",
  'сходим': "let\\'s go (on foot)",
  'уберём': "let\\'s clean up",
  'умываюсь': "to wash one\\'s face",
  'читательский': "reading (adj.); reader\\'s",
};

let fixCount = 0;

for (let i = 0; i < lines.length; i++) {
  for (const [key, correctEn] of Object.entries(fixes)) {
    // Match a line that starts with this key
    const keyPattern = `  '${key}': { en: '`;
    if (lines[i].trimStart().startsWith(`'${key}':`)) {
      // Replace the en value — find the en: '...' portion
      const enStart = lines[i].indexOf("en: '");
      if (enStart === -1) continue;

      // Find where en value starts
      const valueStart = enStart + 5; // after "en: '"

      // Find the closing quote — need to handle escaped quotes
      let j = valueStart;
      while (j < lines[i].length) {
        if (lines[i][j] === "'" && lines[i][j-1] !== '\\') break;
        j++;
      }

      // Replace
      const before = lines[i].substring(0, valueStart);
      const after = lines[i].substring(j);
      const newLine = before + correctEn + after;

      if (newLine !== lines[i]) {
        lines[i] = newLine;
        fixCount++;
        console.log(`  Fixed: ${key}`);
      }
      break;
    }
  }
}

fs.writeFileSync(DICT_PATH, lines.join('\n'));
console.log(`\nFixed ${fixCount} entries with apostrophes`);
