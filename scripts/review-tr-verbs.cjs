#!/usr/bin/env node
/**
 * Comprehensive Turkish dictionary review + fix script.
 * Checks EVERY single entry for all known issue types and generates fixes.
 *
 * Issue types detected:
 *  1) "to " prefix on non-verb entries
 *  2) verb conjugated forms with erroneous "to " prefix (only -mak/-mek infinitives should have it)
 *  3) missing "to " on -mak/-mek infinitives
 *  4) garbage semicolons (first part is unrelated context-bleed word)
 *  5) wrong meaning (verified against Turkish knowledge)
 *  6) backslash/escaped-quote garbled entries (truncated at apostrophe)
 *  7) truncated translations (ending with period, etc.)
 *  8) wrong POS
 */

const fs = require('fs');
const path = require('path');

const DICT_PATH = path.join(__dirname, '..', 'src', 'data', 'dictionary', 'tr.ts');
const OUTPUT_PATH = path.join(__dirname, 'output', 'tr-full-verb-review.json');

const src = fs.readFileSync(DICT_PATH, 'utf8');
const lines = src.split('\n');

// Parse all entries with line numbers - handle escaped quotes properly
const entries = [];
const entryLineMap = {}; // key -> line index

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  // Match entries, handling both single and double quoted keys
  const match = line.match(/^\s*['"]([^'"]+)['"]\s*:\s*\{(.+)\}\s*,?\s*$/);
  if (!match) continue;

  const key = match[1];
  const body = match[2];

  // Parse en value - handle escaped single quotes inside
  // The raw pattern is: en: 'some text with \' escaped quotes'
  const enMatch = body.match(/en:\s*'((?:[^'\\]|\\.)*)'/);
  const en = enMatch ? enMatch[1].replace(/\\'/g, "'") : '';

  const pos = body.match(/pos:\s*'([^']*)'/)?.[1] || '';
  const ipa = body.match(/ipa:\s*'([^']*)'/)?.[1] || '';
  const lemma = body.match(/lemma:\s*'([^']*)'/)?.[1] || undefined;

  entries.push({ key, en, pos, ipa, lemma, lineIdx: i, rawLine: line });
  entryLineMap[key] = i;
}

console.log(`Total entries parsed: ${entries.length}`);

// ============================================================
// COMPREHENSIVE MANUAL FIXES MAP
// These are hand-verified against Turkish language knowledge
// ============================================================
const MANUAL_FIXES = {};

function manualFix(key, en, pos, lemma, issueType, note) {
  MANUAL_FIXES[key] = { en, pos, lemma, issueType, note };
}

// ── WRONG MEANINGS / POS ──────────────────────────────────────
manualFix('a', 'but, and', 'conj', undefined, 'wrong-meaning', '"a" is a Turkish conjunction/discourse particle');
manualFix('acaba', 'I wonder', 'adv', undefined, 'wrong-meaning', 'adverb not verb');
manualFix('acele', 'hurry, rush', 'n', undefined, 'garbage-semicolon', '"otherwise" is garbage');
manualFix('acı', 'bitter, spicy; pain', 'adj', undefined, 'wrong-meaning', '"angle" is wrong');
manualFix('acılar', 'pains', 'n', 'acı', 'wrong-meaning', '"angle" is wrong');
manualFix('acısız', 'painless', 'adj', undefined, 'garbage-semicolon', '"raw" is garbage');
manualFix('açık', 'open, clear', 'adj', undefined, 'wrong-meaning', '"he" is completely wrong');
manualFix('adı', 'its name', 'n', undefined, 'wrong-meaning', '"ordinary" is wrong; adı = name+poss');
manualFix('adımıdır', 'is the step of', 'n', 'adım', 'wrong-meaning', 'not a verb');
manualFix('afiyet', 'health, appetite', 'n', undefined, 'garbage-semicolon', '"madam" is garbage');
manualFix('ağ', 'net, network', 'n', undefined, 'garbage-semicolon', '"difference" is garbage');
manualFix('ait', 'belonging to', 'adj', undefined, 'garbage-semicolon', '"archaeologists" is garbage');
manualFix('akdeniz', 'Mediterranean', 'n', undefined, 'garbage-semicolon', '"born" is garbage');
manualFix('aile', 'family', 'n', undefined, 'wrong-meaning', '"to result; family" - result is garbage');
manualFix('altında', 'under', 'postp', undefined, 'wrong-pos', 'postposition not noun');
manualFix('altından', 'from under', 'postp', undefined, 'wrong-pos', 'postposition not noun');
manualFix('anne', 'mother', 'n', undefined, 'wrong-meaning', '"family; mother" - family is garbage');
manualFix('bana', 'to me', 'pron', undefined, 'wrong-meaning', 'pronoun not verb');
manualFix('bir', 'a, one', 'det', undefined, 'wrong-pos', 'determiner');
manualFix('da', 'also, too', 'conj', undefined, 'wrong-pos', 'conjunction/particle');
manualFix('de', 'also, too', 'conj', undefined, 'wrong-pos', 'conjunction/particle');
manualFix('değil', 'not', 'part', undefined, 'wrong-pos', 'negation particle');
manualFix('diye', 'saying, in order to', 'conj', undefined, 'wrong-meaning', 'conjunction');
manualFix('her', 'every, each', 'det', undefined, 'wrong-pos', 'determiner');
manualFix('için', 'for, in order to', 'postp', undefined, 'wrong-pos', 'postposition');
manualFix('sana', 'to you', 'pron', undefined, 'wrong-meaning', 'pronoun not verb');
manualFix('benim', 'my, mine', 'pron', undefined, 'wrong-meaning', 'pronoun');

// ── BACKSLASH/APOSTROPHE GARBLED (verified reconstructions) ──
// These entries had escaped quotes that got mangled in translation.
// The raw file has patterns like: en: 'don\'t; hurt' which means the actual
// translation includes an apostrophe but was also polluted with semicolon garbage.

manualFix('ağrıtmak', "to cause pain", 'v', undefined, 'backslash-garbled', "don't; hurt → cause pain");
manualFix('ağzı', 'mouth', 'n', 'ağız', 'backslash-garbled', "everyone's garbled");
manualFix('al', 'take, buy; red', 'v', undefined, 'backslash-garbled', "it's; al garbled");
manualFix('alalım', "let's take", 'v', 'almak', 'backslash-garbled', "let's truncated");
manualFix('alamıyorum', "can't get", 'v', 'almak', 'backslash-garbled', "can't truncated");
manualFix('almadım', "didn't buy", 'v', 'almak', 'backslash-garbled', "haven't truncated");
manualFix('almasaydık', "if we hadn't taken", 'v', 'almak', 'backslash-garbled', "we hadn't truncated");
manualFix('altındayım', 'I am under', 'n', undefined, 'backslash-garbled', "i'm truncated");
manualFix('amcamın', "my uncle's", 'n', undefined, 'backslash-garbled', "truncated at apostrophe");
manualFix('anlamadığını', "that you didn't understand", 'v', 'anlamak', 'backslash-garbled', "you don't truncated");
manualFix('anlamı', 'its meaning', 'n', 'anlam', 'backslash-garbled', "there's garbled");
manualFix('anlatırım', 'I narrate', 'v', 'anlatmak', 'backslash-garbled', "fairy; i'll garbled");
manualFix('anneannemin', "my grandmother's", 'n', undefined, 'backslash-garbled', "truncated");
manualFix('annemin', "my mother's", 'n', undefined, 'backslash-garbled', "truncated");
manualFix('arasındaki', 'between', 'adj', undefined, 'backslash-garbled', "children's garbled");
manualFix('arkadaşımın', "my friend's", 'n', undefined, 'backslash-garbled', "truncated");
manualFix('arkadaşımla', 'with my friend', 'n', undefined, 'backslash-garbled', "i'll garbled");
manualFix('arkadaşının', "your friend's", 'n', undefined, 'backslash-garbled', "truncated");
manualFix('ayarlandı', 'was adjusted', 'v', 'ayarlamak', 'backslash-garbled', "don't garbled");
manualFix('ayısının', "of the bear", 'n', 'ayı', 'backslash-garbled', "truncated");
manualFix('babamın', "my father's", 'n', undefined, 'backslash-garbled', "truncated");
manualFix('bakalım', "let's see", 'v', 'bakmak', 'backslash-garbled', "let's truncated");
manualFix('bakarım', 'I look after', 'v', 'bakmak', 'backslash-garbled', "i'll garbled");
manualFix('bakarız', 'we look after', 'v', 'bakmak', 'backslash-garbled', "we'll garbled");
manualFix('bakmayın', "don't look", 'v', 'bakmak', 'backslash-garbled', "don't garbled");
manualFix('başlangıç', 'beginning, start', 'n', undefined, 'backslash-garbled', "garbled");
manualFix('başlayalım', "let's start", 'v', 'başlamak', 'backslash-garbled', "let's truncated");
manualFix('bekleyelim', "let's wait", 'v', 'beklemek', 'backslash-garbled', "let's truncated");
manualFix('bırakalım', "let's leave", 'v', 'bırakmak', 'backslash-garbled', "let's truncated");
manualFix('bırakırım', 'I leave', 'v', 'bırakmak', 'backslash-garbled', "i'll truncated");
manualFix('bırakmayın', "don't leave", 'v', 'bırakmak', 'backslash-garbled', "don't truncated");
manualFix('bilmiyorsunuz', "you don't know", 'v', 'bilmek', 'backslash-garbled', "truncated");
manualFix('bulamadım', "couldn't find", 'v', 'bulmak', 'backslash-garbled', "truncated");
manualFix('bulamıyorum', "can't find", 'v', 'bulmak', 'backslash-garbled', "truncated");
manualFix('buyurun', 'here you are, please', 'intj', undefined, 'backslash-garbled', "garbled");
manualFix('çalışalım', "let's work", 'v', 'çalışmak', 'backslash-garbled', "let's truncated");
manualFix('çalışırım', 'I work', 'v', 'çalışmak', 'backslash-garbled', "i'll truncated");
manualFix('çıkalım', "let's go out", 'v', 'çıkmak', 'backslash-garbled', "let's truncated");
manualFix('çıkmayın', "don't go out", 'v', 'çıkmak', 'backslash-garbled', "don't truncated");
manualFix('dayanamıyorum', "can't stand it", 'v', 'dayanmak', 'backslash-garbled', "truncated");
manualFix('değildir', 'is not', 'v', undefined, 'backslash-garbled', "isn't truncated");
manualFix('değilim', 'I am not', 'v', undefined, 'backslash-garbled', "i'm truncated");
manualFix('değilmiş', 'apparently is not', 'v', undefined, 'backslash-garbled', "isn't truncated");
manualFix('değilsin', 'you are not', 'v', undefined, 'backslash-garbled', "truncated");
manualFix('denemiyorum', "can't try", 'v', 'denemek', 'backslash-garbled', "truncated");
manualFix('deyim', 'idiom, expression', 'n', undefined, 'backslash-garbled', "garbled");
manualFix('dinlenelim', "let's rest", 'v', 'dinlenmek', 'backslash-garbled', "let's truncated");
manualFix('doğranmış', 'chopped', 'adj', undefined, 'backslash-garbled', "it's garbled");
manualFix('dokunmayın', "don't touch", 'v', 'dokunmak', 'backslash-garbled', "don't truncated");
manualFix('dolayısıyla', 'therefore', 'adv', undefined, 'backslash-garbled', "there's truncated");
manualFix('dönelim', "let's return", 'v', 'dönmek', 'backslash-garbled', "let's truncated");
manualFix('düşünelim', "let's think", 'v', 'düşünmek', 'backslash-garbled', "let's truncated");
manualFix('edebileceğini', 'that he/she can do', 'v', 'etmek', 'backslash-garbled', "truncated");
manualFix('edemiyorum', "can't do", 'v', 'etmek', 'backslash-garbled', "truncated");
manualFix('edelim', "let's do", 'v', 'etmek', 'backslash-garbled', "let's truncated");
manualFix('edememişler', "they couldn't do", 'v', 'etmek', 'backslash-garbled', "truncated");
manualFix('etmeyeceğim', "I won't do", 'v', 'etmek', 'backslash-garbled', "truncated");
manualFix('etmeyeceğini', "that he/she won't do", 'v', 'etmek', 'backslash-garbled', "truncated");
manualFix('etmeyelim', "let's not do", 'v', 'etmek', 'backslash-garbled', "let's truncated");
manualFix('eşimin', "my spouse's", 'n', undefined, 'backslash-garbled', "truncated");
manualFix('fikrini', 'opinion', 'n', 'fikir', 'backslash-garbled', "people's garbled");
manualFix('gidelim', "let's go", 'v', 'gitmek', 'backslash-garbled', "let's truncated");
manualFix('gidemiyorum', "can't go", 'v', 'gitmek', 'backslash-garbled', "truncated");
manualFix('gidiyorsunuz', 'you are going', 'v', 'gitmek', 'backslash-garbled', "truncated");
manualFix('gitmeyeceğim', "I won't go", 'v', 'gitmek', 'backslash-garbled', "truncated");
manualFix('gitmeyeceğini', "that he won't go", 'v', 'gitmek', 'backslash-garbled', "truncated");
manualFix('gitmeyelim', "let's not go", 'v', 'gitmek', 'backslash-garbled', "let's truncated");
manualFix('görelim', "let's see", 'v', 'görmek', 'backslash-garbled', "let's truncated");
manualFix('göremiyorum', "can't see", 'v', 'görmek', 'backslash-garbled', "truncated");
manualFix('görüşelim', "let's talk", 'v', 'görüşmek', 'backslash-garbled', "let's truncated");
manualFix('götürelim', "let's take there", 'v', 'götürmek', 'backslash-garbled', "let's truncated");
manualFix('güneşin', 'of the sun', 'n', 'güneş', 'backslash-garbled', "truncated");
manualFix('halasının', 'of his/her aunt', 'n', 'hala', 'backslash-garbled', "truncated");
manualFix('hatırlamıyorum', "don't remember", 'v', 'hatırlamak', 'backslash-garbled', "truncated");
manualFix('hazırlanmıyorum', "not getting ready", 'v', 'hazırlanmak', 'backslash-garbled', "truncated");
manualFix('istemiyorsunuz', "you don't want", 'v', 'istemek', 'backslash-garbled', "truncated");
manualFix('istemiyorum', "don't want", 'v', 'istemek', 'backslash-garbled', "truncated");
manualFix('iyileşmiyorum', "not getting better", 'v', 'iyileşmek', 'backslash-garbled', "truncated");
manualFix('izleyelim', "let's watch", 'v', 'izlemek', 'backslash-garbled', "let's truncated");
manualFix('kalmayalım', "let's not stay", 'v', 'kalmak', 'backslash-garbled', "let's truncated");
manualFix('kardeşimin', "my sibling's", 'n', undefined, 'backslash-garbled', "truncated");
manualFix('karşılaşmayalım', "let's not encounter", 'v', 'karşılaşmak', 'backslash-garbled', "let's truncated");
manualFix('katılalım', "let's join", 'v', 'katılmak', 'backslash-garbled', "let's truncated");
manualFix('kızının', 'of his/her daughter', 'n', 'kız', 'backslash-garbled', "truncated");
manualFix('komşumun', "my neighbor's", 'n', undefined, 'backslash-garbled', "truncated");
manualFix('konuşalım', "let's talk", 'v', 'konuşmak', 'backslash-garbled', "let's truncated");
manualFix('konuşmayalım', "let's not talk", 'v', 'konuşmak', 'backslash-garbled', "let's truncated");
manualFix('konuşmuyorsun', "you're not talking", 'v', 'konuşmak', 'backslash-garbled', "truncated");
manualFix('kullanmayın', "don't use", 'v', 'kullanmak', 'backslash-garbled', "don't truncated");
manualFix('kurtaralım', "let's save", 'v', 'kurtarmak', 'backslash-garbled', "let's truncated");
manualFix('müdürün', 'of the manager', 'n', 'müdür', 'backslash-garbled', "truncated");
manualFix('nasihatçinin', 'of the advisor', 'n', undefined, 'backslash-garbled', "truncated");
manualFix('nedenini', 'the reason', 'n', 'neden', 'backslash-garbled', "don't garbled");
manualFix('oğlunun', 'of his/her son', 'n', 'oğul', 'backslash-garbled', "truncated");
manualFix('okulun', 'of the school', 'n', 'okul', 'backslash-garbled', "truncated");
manualFix('okuyalım', "let's read", 'v', 'okumak', 'backslash-garbled', "let's truncated");
manualFix('olmayabilir', 'might not be', 'v', 'olmak', 'backslash-garbled', "truncated");
manualFix('olmayalım', "let's not be", 'v', 'olmak', 'backslash-garbled', "let's truncated");
manualFix('olmuyor', "doesn't work, doesn't happen", 'v', 'olmak', 'backslash-garbled', "truncated");
manualFix('oturalım', "let's sit", 'v', 'oturmak', 'backslash-garbled', "let's truncated");
manualFix('öğrenelim', "let's learn", 'v', 'öğrenmek', 'backslash-garbled', "let's truncated");
manualFix('öğretmenin', 'of the teacher', 'n', 'öğretmen', 'backslash-garbled', "truncated");
manualFix('öğretmeninin', "of his/her teacher", 'n', 'öğretmen', 'backslash-garbled', "truncated");
manualFix('ödeyemiyorum', "can't pay", 'v', 'ödemek', 'backslash-garbled', "truncated");
manualFix('seçelim', "let's choose", 'v', 'seçmek', 'backslash-garbled', "let's truncated");
manualFix('sevmiyorum', "don't like", 'v', 'sevmek', 'backslash-garbled', "truncated");
manualFix('sormayın', "don't ask", 'v', 'sormak', 'backslash-garbled', "don't truncated");
manualFix('söylemiyorum', "not saying", 'v', 'söylemek', 'backslash-garbled', "truncated");
manualFix('sürelim', "let's spread", 'v', 'sürmek', 'backslash-garbled', "let's truncated");
manualFix('taşıyalım', "let's carry", 'v', 'taşımak', 'backslash-garbled', "let's truncated");
manualFix('temizleyelim', "let's clean", 'v', 'temizlemek', 'backslash-garbled', "let's truncated");
manualFix('toplayalım', "let's gather", 'v', 'toplamak', 'backslash-garbled', "let's truncated");
manualFix('ulaşamıyorum', "can't reach", 'v', 'ulaşmak', 'backslash-garbled', "truncated");
manualFix('unutmayın', "don't forget", 'v', 'unutmak', 'backslash-garbled', "don't truncated");
manualFix('uyuyamıyorum', "can't sleep", 'v', 'uyumak', 'backslash-garbled', "truncated");
manualFix('uyuyalım', "let's sleep", 'v', 'uyumak', 'backslash-garbled', "let's truncated");
manualFix('vapurun', 'of the ferry', 'n', 'vapur', 'backslash-garbled', "truncated");
manualFix('verelim', "let's give", 'v', 'vermek', 'backslash-garbled', "let's truncated");
manualFix('yapalım', "let's do", 'v', 'yapmak', 'backslash-garbled', "let's truncated");
manualFix('yapmayalım', "let's not do", 'v', 'yapmak', 'backslash-garbled', "let's truncated");
manualFix('yapmayın', "don't do", 'v', 'yapmak', 'backslash-garbled', "don't truncated");
manualFix('yapmıyorsun', "you're not doing", 'v', 'yapmak', 'backslash-garbled', "truncated");
manualFix('yapamıyorum', "can't do", 'v', 'yapmak', 'backslash-garbled', "truncated");
manualFix('yaşamıyorum', "not living", 'v', 'yaşamak', 'backslash-garbled', "truncated");
manualFix('yazalım', "let's write", 'v', 'yazmak', 'backslash-garbled', "let's truncated");
manualFix('yemeyelin', "let's not eat", 'v', 'yemek', 'backslash-garbled', "truncated");
manualFix('yemeyelim', "let's not eat", 'v', 'yemek', 'backslash-garbled', "let's truncated");
manualFix('yerleşelim', "let's settle", 'v', 'yerleşmek', 'backslash-garbled', "let's truncated");
manualFix('yiyorsunuz', 'you are eating', 'v', 'yemek', 'backslash-garbled', "truncated");
manualFix('yürüyelim', "let's walk", 'v', 'yürümek', 'backslash-garbled', "let's truncated");

// Additional backslash entries found in further analysis
manualFix('açmadı', "didn't open", 'v', 'açmak', 'backslash-garbled', "didn't garbled");
manualFix('değmesin', "let it not touch", 'v', 'değmek', 'backslash-garbled', "garbled");
manualFix('etmemişiz', "we haven't done", 'v', 'etmek', 'backslash-garbled', "garbled");
manualFix('gelmemiş', "hasn't come", 'v', 'gelmek', 'backslash-garbled', "garbled");
manualFix('gitmişiz', "we've gone", 'v', 'gitmek', 'backslash-garbled', "garbled");
manualFix('gülüyorum', "I'm laughing", 'v', 'gülmek', 'backslash-garbled', "garbled");
manualFix('içiyorum', "I'm drinking", 'v', 'içmek', 'backslash-garbled', "garbled");
manualFix('izliyorum', "I'm watching", 'v', 'izlemek', 'backslash-garbled', "garbled");
manualFix('zorlanıyorum', "I'm struggling", 'v', 'zorlanmak', 'backslash-garbled', "garbled");
manualFix('zorlaşıyor', "it's getting harder", 'v', 'zorlaşmak', 'backslash-garbled', "garbled");

// ============================================================
// AUTOMATED DETECTION + FIX GENERATION
// ============================================================

const fixes = [];
const stats = {
  total: entries.length,
  checked: 0,
  fixed: 0,
  byType: {}
};

function addFix(key, entry, newEn, newPos, newLemma, issueType, note) {
  fixes.push({
    key,
    issueType,
    note,
    old: { en: entry.en, pos: entry.pos },
    new: { en: newEn, pos: newPos, lemma: newLemma === undefined ? undefined : newLemma }
  });
  stats.fixed++;
  stats.byType[issueType] = (stats.byType[issueType] || 0) + 1;
}

const isInfinitive = (key) => key.endsWith('mak') || key.endsWith('mek');

// Set of garbage first-words commonly seen in context bleed
const GARBAGE_WORDS = new Set([
  'flowers', 'fisherman', 'chemist', 'quantum', 'company', 'archaeologists',
  'born', 'time', 'children', 'everyone', 'fairy', 'sorry', 'evenings',
  'people', 'fresh', 'beautiful', 'doctor', 'school', 'market', 'train',
  'water', 'village', 'brother', 'another', 'very', 'great', 'ancient',
  'late', 'old', 'cold', 'heavy', 'early', 'right', 'first', 'hard',
  'come', 'all', 'not', 'the', 'tax', 'sun', 'mind', 'bloomed',
  'it', 'he', 'she', 'we', 'they', 'i', 'you', 'my', 'his', 'her',
  'our', 'their', 'your', 'madam', 'difference', 'uncle', 'aunt',
  're', 'neighbor', 'always', 'otherwise', 'raw', 'shops', 'rang',
  'left', 'result', 'fix', 'stop', 'going', 'a', 'favorite',
  'steps', 'turns', 'wear', 'speak', 'drink', 'watch', 'laugh',
  'breathing', 'stairs', 'ring', 'bell', 'mite', 'wanted',
  'building', 'anyone', 'house', 'family', 'key', 'bag',
]);

for (const e of entries) {
  stats.checked++;

  // Apply manual fix if available
  if (MANUAL_FIXES[e.key]) {
    const f = MANUAL_FIXES[e.key];
    addFix(e.key, e, f.en, f.pos, f.lemma, f.issueType, f.note);
    continue;
  }

  // CHECK 1: Backslash/escaped-quote entries not in manual fixes
  // These have apostrophes in the translation that the parser decoded
  if (e.rawLine.includes("\\'")) {
    // The entry has escaped quotes - check if the decoded version makes sense
    // Many of these are like "don't; X" or "let's; X" patterns
    const rawEn = e.rawLine.match(/en:\s*'((?:[^'\\]|\\.)*)'/)?.[1] || '';
    if (rawEn.includes("\\'")) {
      // Has escaped apostrophe - check if it also has garbage semicolons
      const decoded = rawEn.replace(/\\'/g, "'");
      if (decoded.includes(';')) {
        const parts = decoded.split(';').map(s => s.trim());
        // Try to reconstruct: usually the last part is the real meaning
        const lastPart = parts[parts.length - 1];
        addFix(e.key, e, lastPart, e.pos, e.lemma, 'backslash-garbled', `apostrophe entry with garbage semicolon`);
      } else {
        // Apostrophe only, probably fine as-is after decoding
        // But check if it still has "to " prefix on conjugated form
        if (e.pos === 'v' && decoded.startsWith('to ') && !isInfinitive(e.key)) {
          addFix(e.key, e, decoded.replace(/^to /, ''), 'v', e.lemma, 'to-on-conjugated', '"to " on conjugated + apostrophe');
        }
        // Otherwise the apostrophe version is OK
      }
      continue;
    }
  }

  // CHECK 2: "to " on conjugated verb forms (not infinitives)
  if (e.pos === 'v' && e.en.startsWith('to ') && !isInfinitive(e.key)) {
    let cleanEn = e.en.replace(/^to /, '').replace(/\.$/, '');
    // Also handle garbage semicolons inside
    if (cleanEn.includes(';')) {
      const parts = cleanEn.split(';').map(s => s.trim());
      // Check if first part is garbage
      if (GARBAGE_WORDS.has(parts[0].toLowerCase())) {
        cleanEn = parts[1] || parts[0];
      } else {
        cleanEn = parts[parts.length - 1]; // take last part as most relevant
      }
    }
    addFix(e.key, e, cleanEn, 'v', e.lemma, 'to-on-conjugated', '"to " prefix on conjugated verb form');
    continue;
  }

  // CHECK 3: Garbage semicolons on non-verb entries
  if (e.en.includes(';') && !isInfinitive(e.key)) {
    const parts = e.en.split(';').map(s => s.trim());
    if (parts.length >= 2) {
      const first = parts[0].toLowerCase();
      const second = parts[1];

      // If first part starts with "to " - it's context bleed from verb
      if (first.startsWith('to ')) {
        addFix(e.key, e, second, e.pos, e.lemma, 'garbage-semicolon', `"${parts[0]}" is context bleed`);
        continue;
      }

      // If first part is a known garbage word
      if (GARBAGE_WORDS.has(first)) {
        addFix(e.key, e, second, e.pos, e.lemma, 'garbage-semicolon', `"${parts[0]}" is context bleed`);
        continue;
      }

      // If first part is very short (1-3 chars) and doesn't match the word
      if (first.length <= 3 && first !== second.toLowerCase().substring(0, first.length)) {
        addFix(e.key, e, second, e.pos, e.lemma, 'garbage-semicolon', `"${parts[0]}" is likely garbage`);
        continue;
      }
    }
  }

  // CHECK 4: Trailing period
  if (e.en.endsWith('.') && !e.en.endsWith('etc.') && !e.en.endsWith('Mr.') && !e.en.endsWith('Dr.')) {
    addFix(e.key, e, e.en.replace(/\.$/, ''), e.pos, e.lemma, 'trailing-period', 'removed trailing period');
    continue;
  }

  // CHECK 5: Missing "to " on -mak/-mek infinitives
  if (isInfinitive(e.key) && e.pos === 'v' && !e.en.startsWith('to ')) {
    let cleanEn = e.en;
    if (cleanEn.includes(';')) {
      const parts = cleanEn.split(';').map(s => s.trim());
      cleanEn = parts[parts.length - 1];
    }
    addFix(e.key, e, 'to ' + cleanEn, 'v', e.lemma, 'missing-to', 'added "to " to infinitive');
    continue;
  }

  // CHECK 6: "to " on non-verb POS
  if (e.en.startsWith('to ') && e.pos !== 'v') {
    addFix(e.key, e, e.en.replace(/^to /, ''), e.pos, e.lemma, 'to-on-non-verb', '"to " prefix on non-verb');
    continue;
  }
}

// ============================================================
// Write output JSON
// ============================================================
const outputDir = path.dirname(OUTPUT_PATH);
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(fixes, null, 2));

console.log('\n=== REVIEW COMPLETE ===');
console.log(`Total entries: ${stats.total}`);
console.log(`Entries checked: ${stats.checked}`);
console.log(`Fixes generated: ${stats.fixed}`);
console.log('\nBy issue type:');
for (const [type, count] of Object.entries(stats.byType).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${type}: ${count}`);
}
console.log(`\nOutput written to: ${OUTPUT_PATH}`);

// ============================================================
// APPLY FIXES to tr.ts - line-by-line replacement
// ============================================================
console.log('\n=== APPLYING FIXES ===');

// Re-read fresh copy
let fileContent = fs.readFileSync(DICT_PATH, 'utf8');
let fileLines = fileContent.split('\n');
let applied = 0;
let failed = 0;

// Build a map of key -> fix for fast lookup
const fixMap = {};
for (const f of fixes) {
  fixMap[f.key] = f;
}

// Process each line
for (let i = 0; i < fileLines.length; i++) {
  const line = fileLines[i];
  const match = line.match(/^\s*['"]([^'"]+)['"]\s*:\s*\{(.+)\}\s*,?\s*$/);
  if (!match) continue;

  const key = match[1];
  if (!fixMap[key]) continue;

  const f = fixMap[key];
  const newEn = f.new.en.replace(/'/g, "\\'");
  const newPos = f.new.pos;
  const newLemma = f.new.lemma;

  // Rebuild the line
  // Extract ipa from current line
  const ipaMatch = match[2].match(/ipa:\s*'([^']*)'/);
  const ipa = ipaMatch ? ipaMatch[1] : '';

  // Check if line currently has a lemma
  const currentLemma = match[2].match(/lemma:\s*'([^']*)'/)?.[1];

  // Determine final lemma
  let finalLemma = newLemma !== undefined ? newLemma : currentLemma;

  // Build new line
  const indent = line.match(/^(\s*)/)[1];
  const quoteChar = line.match(/^\s*(['"])/)[1];
  let newLine = `${indent}${quoteChar}${key}${quoteChar}: { en: '${newEn}', ipa: '${ipa}', pos: '${newPos}'`;
  if (finalLemma) {
    newLine += `, lemma: '${finalLemma}'`;
  }
  newLine += ' },';

  fileLines[i] = newLine;
  applied++;
}

fs.writeFileSync(DICT_PATH, fileLines.join('\n'));

console.log(`Applied: ${applied}`);
console.log(`Failed: ${fixes.length - applied}`);
console.log(`\nDone! Check ${DICT_PATH}`);
