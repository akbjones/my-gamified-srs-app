import { readFileSync } from 'fs';

const deck = JSON.parse(readFileSync('src/data/spanish/deck.json', 'utf8'));
const issues = [];

// Common English words that shouldn't appear in Spanish field
const englishWords = /\b(the|is|are|was|were|have|has|had|will|would|could|should|with|from|that|this|they|their|them|what|when|where|which|who|how|because|about|into|through|during|before|after|between|under|over|very|just|also|than|more|some|only|other|been|being|having|going|doing|saying|getting|making|coming|taking|giving|finding|thinking|telling|asking|working|calling|trying|needing|becoming|leaving|putting|meaning|keeping|letting|beginning|showing|hearing|playing|running|moving|living|believing|bringing|happening|writing|providing|sitting|standing|losing|paying|meeting|including|continuing|setting|learning|changing|leading|understanding|watching|following|stopping|creating|speaking|reading|allowing|adding|spending|growing|opening|walking|winning|teaching|offering|remembering|loving|considering|appearing|buying|waiting|serving|dying|sending|building|staying|falling|cutting|reaching|killing|raising|passing|selling|requiring|reporting|deciding|pulling)\b/i;

// Common Spanish words that shouldn't appear in English field
const spanishWords = /\b(el|la|los|las|un|una|unos|unas|del|al|por|para|con|sin|pero|como|más|muy|también|después|antes|sobre|entre|hasta|desde|donde|cuando|porque|aunque|mientras|según|hacia|durante|mediante|sino|pues|así|aquí|allí|ahora|entonces|siempre|nunca|ya|aún|todavía|además|quizás|apenas|casi|tampoco|bastante|demasiado|algo|nada|nadie|alguien|todo|cada|otro|mismo|propio|nuevo|bueno|malo|grande|pequeño|mejor|peor|primer|último)\b/i;

for (const c of deck) {
  const t = c.target || '';
  const e = c.english || '';

  // Empty fields
  if (!t.trim()) issues.push({ id: c.id, issue: 'empty target', target: t, english: e });
  if (!e.trim()) issues.push({ id: c.id, issue: 'empty english', target: t, english: e });

  // No ending punctuation on target
  if (t.trim() && !/[.!?…]$/.test(t.trim())) {
    issues.push({ id: c.id, issue: 'no ending punctuation (target)', target: t });
  }

  // No ending punctuation on english
  if (e.trim() && !/[.!?…]$/.test(e.trim())) {
    issues.push({ id: c.id, issue: 'no ending punctuation (english)', english: e });
  }

  // Leading/trailing whitespace
  if (t !== t.trim()) issues.push({ id: c.id, issue: 'whitespace in target', target: JSON.stringify(t) });
  if (e !== e.trim()) issues.push({ id: c.id, issue: 'whitespace in english', english: JSON.stringify(e) });

  // Double spaces
  if (t.includes('  ')) issues.push({ id: c.id, issue: 'double space in target', target: t });
  if (e.includes('  ')) issues.push({ id: c.id, issue: 'double space in english', english: e });

  // Target appears to be English (high confidence check - multiple English words)
  const engMatches = t.match(englishWords);
  if (engMatches) {
    const engWordCount = t.split(/\s+/).filter(w => englishWords.test(w)).length;
    const totalWords = t.split(/\s+/).length;
    if (engWordCount >= 3 && engWordCount / totalWords > 0.4) {
      issues.push({ id: c.id, issue: 'target may be English', target: t });
    }
  }

  // English field appears to be Spanish
  const spaMatches = e.match(spanishWords);
  if (spaMatches) {
    const spaWordCount = e.split(/\s+/).filter(w => spanishWords.test(w)).length;
    const totalWords = e.split(/\s+/).length;
    if (spaWordCount >= 3 && spaWordCount / totalWords > 0.4) {
      issues.push({ id: c.id, issue: 'english may be Spanish', english: e });
    }
  }

  // Target and English are identical
  if (t.trim().toLowerCase() === e.trim().toLowerCase()) {
    issues.push({ id: c.id, issue: 'target = english', target: t, english: e });
  }

  // Unclosed parentheses
  const tOpen = (t.match(/\(/g) || []).length;
  const tClose = (t.match(/\)/g) || []).length;
  if (tOpen !== tClose) issues.push({ id: c.id, issue: 'unclosed parens (target)', target: t });
  const eOpen = (e.match(/\(/g) || []).length;
  const eClose = (e.match(/\)/g) || []).length;
  if (eOpen !== eClose) issues.push({ id: c.id, issue: 'unclosed parens (english)', english: e });

  // Unclosed quotes
  const tQuotes = (t.match(/"/g) || []).length;
  if (tQuotes % 2 !== 0) issues.push({ id: c.id, issue: 'unclosed quotes (target)', target: t });
  const eQuotes = (e.match(/"/g) || []).length;
  if (eQuotes % 2 !== 0) issues.push({ id: c.id, issue: 'unclosed quotes (english)', english: e });

  // Very short sentences (likely fragments)
  if (t.split(/\s+/).length < 2) issues.push({ id: c.id, issue: 'very short target (1 word)', target: t });

  // Very long sentences (might be multiple merged)
  if (t.split(/\s+/).length > 25) issues.push({ id: c.id, issue: 'very long target (' + t.split(/\s+/).length + ' words)', target: t });
}

// Check duplicates
const targetMap = new Map();
for (const c of deck) {
  const key = c.target.trim().toLowerCase();
  if (targetMap.has(key)) {
    targetMap.get(key).push(c.id);
  } else {
    targetMap.set(key, [c.id]);
  }
}
for (const [target, ids] of targetMap) {
  if (ids.length > 1) {
    // Only flag if same tags (duplicates across different goals are expected)
    const cards = ids.map(id => deck.find(c => c.id === id));
    const tagSets = cards.map(c => (c.tags || []).sort().join(','));
    const uniqueTags = new Set(tagSets);
    if (uniqueTags.size < ids.length) {
      issues.push({ id: ids.join(','), issue: `duplicate target (${ids.length}x, same tags)`, target });
    }
  }
}

// Group by issue type
const byType = {};
for (const i of issues) {
  byType[i.issue] = byType[i.issue] || [];
  byType[i.issue].push(i);
}

console.log(`Total issues: ${issues.length}\n`);
for (const [type, items] of Object.entries(byType).sort((a, b) => b[1].length - a[1].length)) {
  console.log(`=== ${type} (${items.length}) ===`);
  // Show first 5 examples
  for (const i of items.slice(0, 5)) {
    const display = i.target || i.english || '';
    console.log(`  [${i.id}] ${display.substring(0, 80)}`);
  }
  if (items.length > 5) console.log(`  ... and ${items.length - 5} more`);
  console.log();
}
