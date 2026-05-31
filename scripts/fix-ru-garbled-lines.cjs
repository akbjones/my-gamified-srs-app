#!/usr/bin/env node
/**
 * Fix garbled lines in ru.ts where apostrophe handling went wrong.
 * These lines have patterns like:
 *   en: 'let\'s; come on'' → should be en: 'let\'s; come on'
 *   en: 'one\'s own's own (gen.)' → should be en: 'one\'s own'
 * We match by key and replace the entire { ... } portion.
 */

const fs = require('fs');
const DICT_PATH = '/Users/antoinevj/Documents/GitHub/my-gamified-srs-app/.claude/worktrees/agitated-boyd/src/data/dictionary/ru.ts';

let content = fs.readFileSync(DICT_PATH, 'utf-8');
const lines = content.split('\n');

// Corrections: key → full correct en value (as it appears in source, with \' for apostrophes)
const corrections = {
  'встретимся': { en: "let\\'s meet", pos: 'v', lemma: 'встретиться' },
  'вчерашней': { en: "yesterday\\'s", pos: 'adj' },
  'выпьем': { en: "let\\'s drink", pos: 'v', lemma: 'выпить' },
  'давай': { en: "let\\'s; come on", pos: 'part' },
  'давайте': { en: "let\\'s; come on", pos: 'part' },
  'держусь': { en: "to hold on", pos: 'v', lemma: 'держаться' },
  'детская': { en: "children\\'s; nursery", pos: 'adj' },
  'детской': { en: "children\\'s", pos: 'adj' },
  'детскую': { en: "children\\'s", pos: 'adj' },
  'жаль': { en: "it\\'s a pity; too bad", pos: 'adv' },
  'завтрашнее': { en: "tomorrow\\'s", pos: 'adj' },
  'завтрашней': { en: "tomorrow\\'s", pos: 'adj' },
  'завтрашнему': { en: "tomorrow\\'s", pos: 'adj' },
  'закончим': { en: "let\\'s finish", pos: 'v', lemma: 'закончить' },
  'идём': { en: "let\\'s go; we\\'re going", pos: 'v', lemma: 'идти' },
  'новогоднюю': { en: "New Year\\'s", pos: 'adj' },
  'обменяемся': { en: "let\\'s exchange", pos: 'v', lemma: 'обменяться' },
  'останемся': { en: "let\\'s stay", pos: 'v', lemma: 'остаться' },
  'поболтаем': { en: "let\\'s chat", pos: 'v', lemma: 'поболтать' },
  'поговорим': { en: "let\\'s talk", pos: 'v', lemma: 'поговорить' },
  'поедем': { en: "let\\'s go (by vehicle)", pos: 'v', lemma: 'поехать' },
  'поехали': { en: "let\\'s go; went (by vehicle)", pos: 'v', lemma: 'поехать' },
  'пойдём': { en: "let\\'s go", pos: 'v', lemma: 'пойти' },
  'попробуем': { en: "let\\'s try", pos: 'v', lemma: 'попробовать' },
  'пора': { en: "it\\'s time", pos: 'n' },
  'поэтому': { en: "therefore; that\\'s why", pos: 'adv' },
  'причёсываюсь': { en: "to comb one\\'s hair", pos: 'v', lemma: 'причёсываться' },
  'своего': { en: "one\\'s own", pos: 'pron' },
  'своей': { en: "one\\'s own", pos: 'pron' },
  'свои': { en: "one\\'s own", pos: 'pron' },
  'своим': { en: "one\\'s own", pos: 'pron' },
  'своих': { en: "one\\'s own", pos: 'pron' },
  'свой': { en: "one\\'s own", pos: 'pron' },
  'свою': { en: "one\\'s own", pos: 'pron' },
  'своя': { en: "one\\'s own", pos: 'pron' },
  'сходим': { en: "let\\'s go (on foot)", pos: 'v', lemma: 'сходить' },
  'уберём': { en: "let\\'s clean up", pos: 'v', lemma: 'убрать' },
  'умываюсь': { en: "to wash one\\'s face", pos: 'v', lemma: 'умываться' },
  'читательский': { en: "reading (adj.); reader\\'s", pos: 'adj' },
};

let fixCount = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  for (const [key, fix] of Object.entries(corrections)) {
    const prefix = `  '${key}': `;
    if (line.startsWith(prefix)) {
      // Extract existing IPA from the line
      const ipaMatch = line.match(/ipa:\s*'([^']*)'/);
      const ipa = ipaMatch ? ipaMatch[1] : '';

      // Extract existing lemma
      const lemmaMatch = line.match(/lemma:\s*'([^']*)'/);
      const existingLemma = lemmaMatch ? lemmaMatch[1] : null;
      const lemma = fix.lemma || existingLemma;

      // Reconstruct the line
      let newLine = `  '${key}': { en: '${fix.en}', ipa: '${ipa}', pos: '${fix.pos}'`;
      if (lemma) {
        newLine += `, lemma: '${lemma}'`;
      }
      newLine += ' },';

      if (lines[i] !== newLine) {
        lines[i] = newLine;
        fixCount++;
        console.log(`  Fixed: ${key}`);
      }
      break;
    }
  }
}

fs.writeFileSync(DICT_PATH, lines.join('\n'));
console.log(`\nFixed ${fixCount} garbled entries`);
