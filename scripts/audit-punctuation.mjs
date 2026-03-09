import { readFileSync } from 'fs';

const deck = JSON.parse(readFileSync('src/data/spanish/deck.json', 'utf8'));
const issues = [];

for (const c of deck) {
  const t = c.target;

  // Double opening question marks
  const qCount = (t.match(/¿/g) || []).length;
  if (qCount > 1) {
    issues.push({ id: c.id, issue: `double ¿ (${qCount})`, target: t });
  }

  // Double opening exclamation marks
  const eCount = (t.match(/¡/g) || []).length;
  if (eCount > 1) {
    issues.push({ id: c.id, issue: `double ¡ (${eCount})`, target: t });
  }

  // Missing closing ? after ¿
  if (t.includes('¿') && t.indexOf('?') === -1) {
    issues.push({ id: c.id, issue: 'missing ?', target: t });
  }

  // Missing closing ! after ¡
  if (t.includes('¡') && t.indexOf('!') === -1) {
    issues.push({ id: c.id, issue: 'missing !', target: t });
  }

  // Double periods (not ellipsis)
  if (/\.\.(?!\.)/.test(t)) {
    issues.push({ id: c.id, issue: 'double period', target: t });
  }

  // Question mark without ¿
  if (t.indexOf('?') !== -1 && t.indexOf('¿') === -1) {
    issues.push({ id: c.id, issue: '? without ¿', target: t });
  }

  // Exclamation without ¡
  if (t.indexOf('!') !== -1 && t.indexOf('¡') === -1) {
    issues.push({ id: c.id, issue: '! without ¡', target: t });
  }

  // Nested ¿ inside already-open question (like ¿...¿...?)
  const qMatches = [...t.matchAll(/¿/g)];
  const closeQMatches = [...t.matchAll(/\?/g)];
  if (qMatches.length > 1 && closeQMatches.length < qMatches.length) {
    if (!issues.find(i => i.id === c.id && i.issue.startsWith('double'))) {
      issues.push({ id: c.id, issue: 'mismatched ¿/?', target: t });
    }
  }
}

console.log(`Total issues found: ${issues.length}\n`);
for (const i of issues) {
  console.log(`[${i.id}] ${i.issue}`);
  console.log(`  ${i.target}\n`);
}
