const fs = require('fs');
const path = require('path');

// Common English words that shouldn't appear in target sentences
const englishWords = new Set([
  'the', 'is', 'are', 'was', 'were', 'have', 'has', 'had', 'been', 'being',
  'do', 'does', 'did', 'will', 'would', 'could', 'should', 'shall', 'might',
  'can', 'may', 'must', 'need', 'want', 'like', 'love', 'hate', 'think',
  'know', 'believe', 'understand', 'remember', 'forget', 'see', 'hear',
  'feel', 'make', 'take', 'give', 'get', 'put', 'say', 'tell', 'ask',
  'use', 'find', 'go', 'come', 'try', 'leave', 'call', 'keep', 'let',
  'begin', 'seem', 'help', 'show', 'turn', 'play', 'run', 'move',
  'live', 'long', 'look', 'after', 'before', 'also', 'just', 'about',
  'because', 'but', 'and', 'or', 'if', 'when', 'where', 'while', 'that',
  'this', 'these', 'those', 'with', 'from', 'into', 'through', 'during',
  'before', 'after', 'above', 'below', 'between', 'under', 'again',
  'further', 'then', 'once', 'here', 'there', 'all', 'each', 'every',
  'both', 'few', 'more', 'most', 'other', 'some', 'such', 'only',
  'own', 'same', 'than', 'too', 'very', 'just', 'because', 'not',
  'what', 'which', 'who', 'whom', 'why', 'how', 'your', 'their',
  'his', 'her', 'its', 'our', 'my', 'you', 'we', 'they', 'he', 'she', 'it',
  'me', 'him', 'us', 'them', 'myself', 'yourself', 'himself', 'herself',
  'itself', 'ourselves', 'themselves', 'enough', 'every', 'everything',
  'everyone', 'everywhere', 'nothing', 'nobody', 'nowhere', 'something',
  'someone', 'somewhere', 'anything', 'anyone', 'anywhere',
  'always', 'never', 'often', 'sometimes', 'usually', 'already',
  'still', 'yet', 'soon', 'now', 'today', 'tomorrow', 'yesterday',
  'morning', 'afternoon', 'evening', 'night', 'week', 'month', 'year',
  'time', 'day', 'people', 'way', 'water', 'been', 'many', 'then',
  'them', 'two', 'how', 'been', 'first', 'new', 'now', 'old', 'great',
  'high', 'small', 'large', 'next', 'last', 'much', 'big',
  'even', 'back', 'well', 'down', 'off', 'away', 'out',
  'really', 'actually', 'certainly', 'definitely', 'probably',
  'perhaps', 'maybe', 'however', 'although', 'though', 'unless',
  'until', 'whether', 'while', 'since', 'without', 'within',
  'family', 'children', 'mother', 'father', 'sister', 'brother',
  'house', 'school', 'work', 'money', 'world', 'country', 'city',
  'book', 'food', 'car', 'door', 'room', 'table', 'chair',
  'beautiful', 'happy', 'sad', 'good', 'bad', 'important',
  'different', 'possible', 'ready', 'sure', 'free', 'right', 'wrong',
  'early', 'late', 'fast', 'slow', 'hard', 'easy', 'hot', 'cold',
  'clean', 'young', 'open', 'close', 'near', 'far',
  'please', 'thank', 'thanks', 'sorry', 'excuse',
  'hello', 'goodbye', 'yes', 'no', 'okay',
]);

// Words shared between Dutch/Swedish and English (false positives to exclude)
const dutchEnglishShared = new Set([
  'van', 'de', 'het', 'en', 'in', 'is', 'dat', 'een', 'er', 'was',
  'op', 'voor', 'met', 'als', 'aan', 'om', 'al', 'over', 'uit', 'door',
  'men', 'test', 'pen', 'piano', 'film', 'restaurant', 'hotel', 'sport',
  'computer', 'internet', 'radio', 'tv', 'bus', 'taxi', 'yoga', 'camping',
  'email', 'weekend', 'baby', 'alarm', 'mode', 'uniform', 'team', 'service',
  'online', 'management', 'marketing', 'design', 'project', 'concept',
  'agenda', 'data', 'extra', 'super', 'info', 'status', 'campus', 'video',
  'museum', 'centrum', 'plan', 'stage', 'scanner', 'trainer', 'format',
  'conflict', 'moment', 'accent', 'concert', 'radar', 'terminal', 'sensor',
  'monitor', 'basis', 'crisis', 'virus', 'bonus', 'media', 'arena',
  // Dutch words that look English
  'me', 'we', 'die', 'was', 'been', 'her', 'man', 'hem', 'ten', 'had',
  'nog', 'dan', 'want', 'wel', 'kan', 'zou', 'of', 'maar', 'meer',
  'heel', 'open', 'leven', 'even', 'later', 'water', 'onder', 'winter',
  'zomer', 'landen', 'modern', 'premier', 'diner', 'theater', 'manager',
  'partner', 'computer', 'kilometer', 'meter', 'liter', 'scanner', 'scanner',
]);

const swedishEnglishShared = new Set([
  'i', 'den', 'det', 'en', 'att', 'och', 'av', 'till', 'med', 'som',
  'om', 'var', 'men', 'nu', 'under', 'ner', 'ut', 'in', 'hem', 'far',
  // Swedish words that look English  
  'test', 'film', 'restaurant', 'hotel', 'sport', 'bus', 'taxi', 'yoga',
  'computer', 'internet', 'radio', 'tv', 'email', 'weekend', 'baby',
  'design', 'plan', 'service', 'team', 'management', 'marketing', 'online',
  'video', 'museum', 'campus', 'arena', 'format', 'concept', 'data',
  'monitor', 'sensor', 'radar', 'terminal', 'bonus', 'virus', 'media',
  'modern', 'partner', 'meter', 'liter', 'kilometer', 'diner',
  'semester', 'center', 'scanner',
]);

function hasEnglishLeakage(target, lang) {
  const shared = lang === 'nl' ? dutchEnglishShared : swedishEnglishShared;
  const words = target.toLowerCase().replace(/[^a-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ\-]/g, ' ').split(/\s+/).filter(w => w.length > 2);
  const englishFound = [];
  
  for (const word of words) {
    if (shared.has(word)) continue;
    // Skip proper nouns (names, cities) - they start with uppercase in original
    if (englishWords.has(word)) {
      // Check if this word appears as capitalized in original (proper noun)
      const regex = new RegExp('\\b' + word.charAt(0).toUpperCase() + word.slice(1) + '\\b');
      if (!regex.test(target)) {
        englishFound.push(word);
      }
    }
  }
  return englishFound;
}

function isGibberish(text) {
  // Check for repeated characters, random letter sequences
  if (/(.)\1{4,}/.test(text)) return true;
  // Check for very short target with no real words
  if (text.length < 3) return true;
  // Check for obviously broken encoding
  if (/[\x00-\x08\x0e-\x1f]/.test(text)) return true;
  return false;
}

function checkMismatch(target, english, lang) {
  // Basic heuristics for mismatch detection
  const issues = [];
  
  // If target is very short but english is very long (or vice versa)
  const targetWords = target.split(/\s+/).length;
  const englishWords_ = english.split(/\s+/).length;
  const ratio = targetWords / englishWords_;
  
  // Extreme length mismatches (more than 3x difference)
  if (ratio > 3.5 || ratio < 0.25) {
    if (targetWords > 3 && englishWords_ > 3) { // Only flag if both are substantial
      issues.push(`Length ratio ${ratio.toFixed(1)} (${targetWords} vs ${englishWords_} words)`);
    }
  }
  
  // Check if target sentence is identical to english (copy-paste error)
  if (target.toLowerCase() === english.toLowerCase()) {
    issues.push('Target identical to English');
  }
  
  return issues;
}

function validateDeck(cards, lang) {
  const flagged = [];
  
  for (const card of cards) {
    const id = lang === 'nl' ? card.id : card.id;
    const target = card.target || '';
    const english = card.english || '';
    
    // Check for missing fields
    if (!target || !english) {
      flagged.push({ id: String(id), issue: 'GARBAGE', reason: `Missing ${!target ? 'target' : 'english'} text` });
      continue;
    }
    
    // Check for gibberish
    if (isGibberish(target)) {
      flagged.push({ id: String(id), issue: 'GARBAGE', reason: `Target appears to be gibberish: "${target.substring(0, 50)}"` });
      continue;
    }
    
    // Check target = english (copy-paste)
    if (target.toLowerCase().trim() === english.toLowerCase().trim()) {
      flagged.push({ id: String(id), issue: 'MISMATCH', reason: 'Target identical to English translation' });
      continue;
    }
    
    // Check for English leakage
    const leaked = hasEnglishLeakage(target, lang);
    if (leaked.length >= 2) {
      // Multiple English words in target is suspicious
      flagged.push({ id: String(id), issue: 'MIXED', reason: `English words in target: ${leaked.join(', ')} – "${target.substring(0, 80)}"` });
      continue;
    }
    
    // Check mismatch
    const mismatchIssues = checkMismatch(target, english, lang);
    if (mismatchIssues.length > 0) {
      flagged.push({ id: String(id), issue: 'MISMATCH', reason: mismatchIssues.join('; ') + ` – target: "${target.substring(0, 60)}" / english: "${english.substring(0, 60)}"` });
    }
  }
  
  return {
    total: cards.length,
    flagged,
    ok_count: cards.length - flagged.length
  };
}

// Process Dutch
const nlCards = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'dutch', 'deck.json'), 'utf8'));
const nlResult = validateDeck(nlCards, 'nl');
fs.writeFileSync(path.join(__dirname, 'output', 'nl-card-validation.json'), JSON.stringify(nlResult, null, 2));
console.log('=== DUTCH ===');
console.log(`Total: ${nlResult.total}, Flagged: ${nlResult.flagged.length}, OK: ${nlResult.ok_count}`);
nlResult.flagged.forEach(f => console.log(`  [${f.issue}] #${f.id}: ${f.reason}`));

// Process Swedish
const svCards = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'swedish', 'deck.json'), 'utf8'));
const svResult = validateDeck(svCards, 'sv');
fs.writeFileSync(path.join(__dirname, 'output', 'sv-card-validation.json'), JSON.stringify(svResult, null, 2));
console.log('\n=== SWEDISH ===');
console.log(`Total: ${svResult.total}, Flagged: ${svResult.flagged.length}, OK: ${svResult.ok_count}`);
svResult.flagged.forEach(f => console.log(`  [${f.issue}] #${f.id}: ${f.reason}`));
