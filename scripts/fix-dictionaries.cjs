#!/usr/bin/env node
/**
 * Comprehensive dictionary fix script — Phase 2.
 *
 * Approach: Parse → Fix → Write (no regex on source code)
 * 1. Split each .ts file into pre-dict / dict-body / post-dict zones
 * 2. Parse dict body into JS object via vm.runInNewContext()
 * 3. Apply fix rules to in-memory object
 * 4. Serialize back to clean TypeScript
 * 5. Reassemble file, preserving all helper code byte-for-byte
 * 6. Validate entry counts and key preservation
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const DRY_RUN = process.argv.includes('--dry-run');
const VERBOSE = process.argv.includes('--verbose');

// ══════════════════════════════════════════════════════════════
// DATA: Metadata, overrides, word lists
// ══════════════════════════════════════════════════════════════

const METADATA_KEYS = new Set([
  'continuousStem', 'futureStem', 'isTransitive', 'pastForms',
  'presentStem', 'presentStem23', 'pastParticiple', 'pastpl',
  'pastsg', 'conditional', 'future', 'imperfect', 'preterite',
  'subjunctive', 'auxiliary', 'imperative', 'isPerfective',
  'past', 'the',
]);

// ── Per-language curated overrides (Rule 12) ─────────────────
// These run FIRST and are never overridden by later rules.
const OVERRIDES = {
  hi: {
    'खाना': { en: 'food; to eat', pos: 'n' },
    'होना': { en: 'to be', pos: 'v' },
    'चलें': { en: 'to walk, to go', pos: 'v', lemma: 'चलना' },
    'चल': { en: 'to walk, to go', pos: 'v', lemma: 'चलना' },
    'चलता': { en: 'to walk, to go', pos: 'v', lemma: 'चलना' },
    'चलती': { en: 'to walk, to go', pos: 'v', lemma: 'चलना' },
    'गाना': { en: 'song; to sing', pos: 'v' },
    'मिलना': { en: 'to meet; to be found', pos: 'v' },
    'बिना': { en: 'without', pos: 'postp' },
    'वाली': { en: '-wali (one who; with)', pos: 'part' },
    'वाला': { en: '-wala (one who; with)', pos: 'part' },
    'वाले': { en: '-wale (ones who; with)', pos: 'part' },
    'लगाना': { en: 'to apply, to attach', pos: 'v' },
    'लगाकर': { en: 'to apply, to attach', pos: 'v', lemma: 'लगाना' },
    'निकल': { en: 'to come out, to emerge', pos: 'v', lemma: 'निकलना' },
    'खेत': { en: 'field, farmland', pos: 'n' },
    'बजे': { en: "o'clock", pos: 'postp' },
    'बज': { en: 'to ring, to strike (time)', pos: 'v' },
    'खाते': { en: 'to eat; food', pos: 'v', lemma: 'खाना' },
    'खाता': { en: 'to eat; account', pos: 'v', lemma: 'खाना' },
    'खाती': { en: 'to eat; food', pos: 'v', lemma: 'खाना' },
    'सूचना': { en: 'information; notice', pos: 'n' },
    // Polysemy fixes
    'सबसे': { en: 'most; from all', pos: 'adv' },
    'तेज़': { en: 'fast; sharp; intense; bright', pos: 'adj' },
    'कौन': { en: 'who; (कौन सा) which', pos: 'pron' },
    'सा': { en: 'like; (कौन सा) which (m)', pos: 'part' },
    'सी': { en: 'like; (कौन सी) which (f)', pos: 'part' },
    'से': { en: 'from; with; than; by', pos: 'postp' },
    'का': { en: 'of (m)', pos: 'postp' },
    'की': { en: 'of (f)', pos: 'postp' },
    'के': { en: 'of (pl)', pos: 'postp' },
    'को': { en: 'to; (object marker)', pos: 'postp' },
    'ने': { en: '(subject marker for past)', pos: 'postp' },
    'और': { en: 'and; more', pos: 'conj' },
    'या': { en: 'or', pos: 'conj' },
    'भी': { en: 'also; even', pos: 'part' },
    'तो': { en: 'so; then', pos: 'part' },
    'ही': { en: 'only; just (emphatic)', pos: 'part' },
    'बता': { en: 'to tell', pos: 'v', lemma: 'बताना' },
    'बताना': { en: 'to tell', pos: 'v' },
    'बोल': { en: 'to speak', pos: 'v', lemma: 'बोलना' },
    'देख': { en: 'to see; to look', pos: 'v', lemma: 'देखना' },
    'सुन': { en: 'to listen; to hear', pos: 'v', lemma: 'सुनना' },
    'जा': { en: 'to go', pos: 'v', lemma: 'जाना' },
    'आ': { en: 'to come', pos: 'v', lemma: 'आना' },
    'दे': { en: 'to give', pos: 'v', lemma: 'देना' },
    'ले': { en: 'to take', pos: 'v', lemma: 'लेना' },
    'कर': { en: 'to do', pos: 'v', lemma: 'करना' },
    'भूख': { en: 'hunger', pos: 'n' },
    // Verb forms missing lemma — manually curated
    'योग': { en: 'yoga', pos: 'n' },
    'घूमने': { en: 'to roam, to wander', pos: 'v', lemma: 'घूमना' },
    'घूमती': { en: 'to roam, to wander', pos: 'v', lemma: 'घूमना' },
    'घूमता': { en: 'to roam, to wander', pos: 'v', lemma: 'घूमना' },
    'घूमते': { en: 'to roam, to wander', pos: 'v', lemma: 'घूमना' },
    'हँसते': { en: 'to laugh', pos: 'v', lemma: 'हँसना' },
    'हँसती': { en: 'to laugh', pos: 'v', lemma: 'हँसना' },
    'हँसता': { en: 'to laugh', pos: 'v', lemma: 'हँसना' },
    'हँसाता': { en: 'to make laugh', pos: 'v', lemma: 'हँसाना' },
    'सुनाती': { en: 'to narrate, to tell', pos: 'v', lemma: 'सुनाना' },
    'सुनाता': { en: 'to narrate, to tell', pos: 'v', lemma: 'सुनाना' },
    'सुनाते': { en: 'to narrate, to tell', pos: 'v', lemma: 'सुनाना' },
    'उठकर': { en: 'to get up', pos: 'v', lemma: 'उठना' },
    'उठने': { en: 'to get up', pos: 'v', lemma: 'उठना' },
    'उठाए': { en: 'to raise', pos: 'v', lemma: 'उठाना' },
    'उठाकर': { en: 'to raise', pos: 'v', lemma: 'उठाना' },
    'उठाने': { en: 'to raise, to lift', pos: 'v', lemma: 'उठाना' },
    'खाने': { en: 'to eat; food', pos: 'v', lemma: 'खाना' },
    'खाकर': { en: 'to eat', pos: 'v', lemma: 'खाना' },
    'खींचने': { en: 'to pull, to drag', pos: 'v', lemma: 'खींचना' },
    'खोलने': { en: 'to open', pos: 'v', lemma: 'खोलना' },
    'गिरने': { en: 'to fall', pos: 'v', lemma: 'गिरना' },
    'डालने': { en: 'to pour, to put', pos: 'v', lemma: 'डालना' },
    'चलो': { en: 'to walk, to go', pos: 'v', lemma: 'चलना' },
    'करने': { en: 'to do', pos: 'v', lemma: 'करना' },
    'जाने': { en: 'to go; to know', pos: 'v', lemma: 'जाना' },
    'उगता': { en: 'to rise, to grow', pos: 'v', lemma: 'उगना' },
    'दौड़ती': { en: 'to run', pos: 'v', lemma: 'दौड़ना' },
    'दौड़ते': { en: 'to run', pos: 'v', lemma: 'दौड़ना' },
    'रोती': { en: 'to cry', pos: 'v', lemma: 'रोना' },
    'रोता': { en: 'to cry', pos: 'v', lemma: 'रोना' },
    'बोलती': { en: 'to speak', pos: 'v', lemma: 'बोलना' },
    'बोलता': { en: 'to speak', pos: 'v', lemma: 'बोलना' },
    'बोलते': { en: 'to speak', pos: 'v', lemma: 'बोलना' },
    'पढ़ती': { en: 'to read, to study', pos: 'v', lemma: 'पढ़ना' },
    'पढ़ता': { en: 'to read, to study', pos: 'v', lemma: 'पढ़ना' },
    'पढ़ते': { en: 'to read, to study', pos: 'v', lemma: 'पढ़ना' },
    'लिखती': { en: 'to write', pos: 'v', lemma: 'लिखना' },
    'लिखता': { en: 'to write', pos: 'v', lemma: 'लिखना' },
    'लिखते': { en: 'to write', pos: 'v', lemma: 'लिखना' },
    'सोती': { en: 'to sleep', pos: 'v', lemma: 'सोना' },
    'सोता': { en: 'to sleep', pos: 'v', lemma: 'सोना' },
    'सोते': { en: 'to sleep', pos: 'v', lemma: 'सोना' },
    'गाती': { en: 'to sing', pos: 'v', lemma: 'गाना' },
    'गाता': { en: 'to sing', pos: 'v', lemma: 'गाना' },
    'गाते': { en: 'to sing', pos: 'v', lemma: 'गाना' },
    'नाचती': { en: 'to dance', pos: 'v', lemma: 'नाचना' },
    'नाचता': { en: 'to dance', pos: 'v', lemma: 'नाचना' },
    'नाचते': { en: 'to dance', pos: 'v', lemma: 'नाचना' },
    'खेलती': { en: 'to play', pos: 'v', lemma: 'खेलना' },
    'खेलता': { en: 'to play', pos: 'v', lemma: 'खेलना' },
    'खेलते': { en: 'to play', pos: 'v', lemma: 'खेलना' },
    'पीती': { en: 'to drink', pos: 'v', lemma: 'पीना' },
    'पीता': { en: 'to drink', pos: 'v', lemma: 'पीना' },
    'पीते': { en: 'to drink', pos: 'v', lemma: 'पीना' },
    'सीखती': { en: 'to learn', pos: 'v', lemma: 'सीखना' },
    'सीखता': { en: 'to learn', pos: 'v', lemma: 'सीखना' },
    'सीखते': { en: 'to learn', pos: 'v', lemma: 'सीखना' },
    'बनाती': { en: 'to make', pos: 'v', lemma: 'बनाना' },
    'बनाता': { en: 'to make', pos: 'v', lemma: 'बनाना' },
    'बनाते': { en: 'to make', pos: 'v', lemma: 'बनाना' },
    'सुनती': { en: 'to listen', pos: 'v', lemma: 'सुनना' },
    'सुनता': { en: 'to listen', pos: 'v', lemma: 'सुनना' },
    'सुनते': { en: 'to listen', pos: 'v', lemma: 'सुनना' },
    'देखती': { en: 'to see, to watch', pos: 'v', lemma: 'देखना' },
    'देखता': { en: 'to see, to watch', pos: 'v', lemma: 'देखना' },
    'देखते': { en: 'to see, to watch', pos: 'v', lemma: 'देखना' },
    'धोती': { en: 'to wash', pos: 'v', lemma: 'धोना' },
    'धोता': { en: 'to wash', pos: 'v', lemma: 'धोना' },
    'धोते': { en: 'to wash', pos: 'v', lemma: 'धोना' },
    'पकाती': { en: 'to cook', pos: 'v', lemma: 'पकाना' },
    'पकाता': { en: 'to cook', pos: 'v', lemma: 'पकाना' },
    'पकाते': { en: 'to cook', pos: 'v', lemma: 'पकाना' },
    'सिलती': { en: 'to sew', pos: 'v', lemma: 'सिलना' },
    'बुनती': { en: 'to weave', pos: 'v', lemma: 'बुनना' },
    'काटती': { en: 'to cut', pos: 'v', lemma: 'काटना' },
    'काटता': { en: 'to cut', pos: 'v', lemma: 'काटना' },
    'काटते': { en: 'to cut', pos: 'v', lemma: 'काटना' },
    'मिलकर': { en: 'to meet; together', pos: 'v', lemma: 'मिलना' },
    'टहलने': { en: 'to stroll, to walk', pos: 'v', lemma: 'टहलना' },
    // ── Exhaustive verb form audit (107 entries) ──
    'आइए': { en: 'to come', pos: 'v', lemma: 'आना' },
    'उगते': { en: 'to grow', pos: 'v', lemma: 'उगना' },
    'उड़ती': { en: 'to fly', pos: 'v', lemma: 'उड़ना' },
    'उड़ाया': { en: 'to fly', pos: 'v', lemma: 'उड़ाना' },
    'कराई': { en: 'to do', pos: 'v', lemma: 'करना' },
    'कहकर': { en: 'to say', pos: 'v', lemma: 'कहना' },
    'कूदकर': { en: 'to jump', pos: 'v', lemma: 'कूदना' },
    'ख़रीदता': { en: 'to buy', pos: 'v', lemma: 'ख़रीदना' },
    'खेलकर': { en: 'to play', pos: 'v', lemma: 'खेलना' },
    'खेला': { en: 'to play', pos: 'v', lemma: 'खेलना' },
    'खेलो': { en: 'to play', pos: 'v', lemma: 'खेलना' },
    'खो': { en: 'to lose', pos: 'v', lemma: 'खोना' },
    'खोलकर': { en: 'to open', pos: 'v', lemma: 'खोलना' },
    'खोलता': { en: 'to open', pos: 'v', lemma: 'खोलना' },
    'गाए': { en: 'to sing', pos: 'v', lemma: 'गाना' },
    'गाकर': { en: 'to sing', pos: 'v', lemma: 'गाना' },
    'गिना': { en: 'to count', pos: 'v', lemma: 'गिनना' },
    'गिरा': { en: 'to fall', pos: 'v', lemma: 'गिरना' },
    'चढ़ते': { en: 'to climb', pos: 'v', lemma: 'चढ़ना' },
    'चलकर': { en: 'to walk', pos: 'v', lemma: 'चलना' },
    'चलाई': { en: 'to drive', pos: 'v', lemma: 'चलाना' },
    'चलाकर': { en: 'to drive', pos: 'v', lemma: 'चलाना' },
    'चलिए': { en: 'to walk', pos: 'v', lemma: 'चलना' },
    'चाहते': { en: 'to want', pos: 'v', lemma: 'चाहना' },
    'चाहिए': { en: 'should, to need', pos: 'v', lemma: 'चाहना' },
    'छूकर': { en: 'to touch', pos: 'v', lemma: 'छूना' },
    'जाइए': { en: 'to go', pos: 'v', lemma: 'जाना' },
    'जाए': { en: 'to go', pos: 'v', lemma: 'जाना' },
    'जानता': { en: 'to know', pos: 'v', lemma: 'जानना' },
    'जीतता': { en: 'to win', pos: 'v', lemma: 'जीतना' },
    'जीता': { en: 'to win', pos: 'v', lemma: 'जीतना' },
    'जीती': { en: 'to win', pos: 'v', lemma: 'जीतना' },
    'डालकर': { en: 'to put', pos: 'v', lemma: 'डालना' },
    'ढकी': { en: 'to cover', pos: 'v', lemma: 'ढकना' },
    'ढके': { en: 'to cover', pos: 'v', lemma: 'ढकना' },
    'ढोया': { en: 'to carry', pos: 'v', lemma: 'ढोना' },
    'दर्शाता': { en: 'to show', pos: 'v', lemma: 'दर्शाना' },
    'दिखने': { en: 'to appear', pos: 'v', lemma: 'दिखना' },
    'दिखाता': { en: 'to show', pos: 'v', lemma: 'दिखाना' },
    'दिखाया': { en: 'to show', pos: 'v', lemma: 'दिखाना' },
    'दिखे': { en: 'to appear', pos: 'v', lemma: 'दिखना' },
    'देकर': { en: 'to give', pos: 'v', lemma: 'देना' },
    'देखकर': { en: 'to see', pos: 'v', lemma: 'देखना' },
    'देने': { en: 'to give', pos: 'v', lemma: 'देना' },
    'दौड़ने': { en: 'to run', pos: 'v', lemma: 'दौड़ना' },
    'नचाए': { en: 'to make dance', pos: 'v', lemma: 'नचाना' },
    'निकलने': { en: 'to come out', pos: 'v', lemma: 'निकलना' },
    'निकालकर': { en: 'to remove', pos: 'v', lemma: 'निकालना' },
    'निभाने': { en: 'to fulfill', pos: 'v', lemma: 'निभाना' },
    'पकड़ो': { en: 'to catch', pos: 'v', lemma: 'पकड़ना' },
    'पकाई': { en: 'to cook', pos: 'v', lemma: 'पकाना' },
    'पड़ते': { en: 'to fall', pos: 'v', lemma: 'पड़ना' },
    'पढ़ने': { en: 'to read', pos: 'v', lemma: 'पढ़ना' },
    'पढ़ाते': { en: 'to teach', pos: 'v', lemma: 'पढ़ाना' },
    'पधारिए': { en: 'to come', pos: 'v', lemma: 'पधारना' },
    'पहचाना': { en: 'to recognize', pos: 'v', lemma: 'पहचानना' },
    'पहनती': { en: 'to wear', pos: 'v', lemma: 'पहनना' },
    'पीकर': { en: 'to drink', pos: 'v', lemma: 'पीना' },
    'पीने': { en: 'to drink', pos: 'v', lemma: 'पीना' },
    'पीया': { en: 'to drink', pos: 'v', lemma: 'पीना' },
    'बचकर': { en: 'to escape', pos: 'v', lemma: 'बचना' },
    'बढ़ता': { en: 'to grow', pos: 'v', lemma: 'बढ़ना' },
    'बनने': { en: 'to become', pos: 'v', lemma: 'बनना' },
    'बना': { en: 'to become', pos: 'v', lemma: 'बनना' },
    'बनाए': { en: 'to make', pos: 'v', lemma: 'बनाना' },
    'बनाकर': { en: 'to make', pos: 'v', lemma: 'बनाना' },
    'बनाने': { en: 'to make', pos: 'v', lemma: 'बनाना' },
    'बुलाते': { en: 'to call', pos: 'v', lemma: 'बुलाना' },
    'बुलाया': { en: 'to call', pos: 'v', lemma: 'बुलाना' },
    'बेचता': { en: 'to sell', pos: 'v', lemma: 'बेचना' },
    'बैठे': { en: 'to sit', pos: 'v', lemma: 'बैठना' },
    'बोलने': { en: 'to speak', pos: 'v', lemma: 'बोलना' },
    'भरकर': { en: 'to fill', pos: 'v', lemma: 'भरना' },
    'भरे': { en: 'to fill', pos: 'v', lemma: 'भरना' },
    'भेजता': { en: 'to send', pos: 'v', lemma: 'भेजना' },
    'माना': { en: 'to accept', pos: 'v', lemma: 'मानना' },
    'मानी': { en: 'to accept', pos: 'v', lemma: 'मानना' },
    'मारकर': { en: 'to hit', pos: 'v', lemma: 'मारना' },
    'रखकर': { en: 'to keep', pos: 'v', lemma: 'रखना' },
    'रखने': { en: 'to keep', pos: 'v', lemma: 'रखना' },
    'रखे': { en: 'to keep', pos: 'v', lemma: 'रखना' },
    'रहकर': { en: 'to stay', pos: 'v', lemma: 'रहना' },
    'रहने': { en: 'to stay', pos: 'v', lemma: 'रहना' },
    'रहिए': { en: 'to stay', pos: 'v', lemma: 'रहना' },
    'रुको': { en: 'to stop, to wait', pos: 'v', lemma: 'रुकना' },
    'रोते': { en: 'to cry', pos: 'v', lemma: 'रोना' },
    'लगाई': { en: 'to apply', pos: 'v', lemma: 'लगाना' },
    'लगाए': { en: 'to apply', pos: 'v', lemma: 'लगाना' },
    'लाइए': { en: 'to bring', pos: 'v', lemma: 'लाना' },
    'लाती': { en: 'to bring', pos: 'v', lemma: 'लाना' },
    'लाते': { en: 'to bring', pos: 'v', lemma: 'लाना' },
    'लिखकर': { en: 'to write', pos: 'v', lemma: 'लिखना' },
    'लेने': { en: 'to take', pos: 'v', lemma: 'लेना' },
    'सकें': { en: 'to be able', pos: 'v', lemma: 'सकना' },
    'समझकर': { en: 'to understand', pos: 'v', lemma: 'समझना' },
    'समझता': { en: 'to understand', pos: 'v', lemma: 'समझना' },
    'समझती': { en: 'to understand', pos: 'v', lemma: 'समझना' },
    'समझे': { en: 'to understand', pos: 'v', lemma: 'समझना' },
    'सिखाती': { en: 'to teach', pos: 'v', lemma: 'सिखाना' },
    'सिखाते': { en: 'to teach', pos: 'v', lemma: 'सिखाना' },
    'सुनाई': { en: 'to narrate', pos: 'v', lemma: 'सुनाना' },
    'सोचता': { en: 'to think', pos: 'v', lemma: 'सोचना' },
    'सोचती': { en: 'to think', pos: 'v', lemma: 'सोचना' },
    'होकर': { en: 'to be', pos: 'v', lemma: 'होना' },
    'होने': { en: 'to be', pos: 'v', lemma: 'होना' },
    // Compound/hyphenated words
    'एक-दूसरे': { en: 'each other', pos: 'pron' },
    'ख़ुशी-ग़म': { en: 'joys and sorrows', pos: 'n' },
    'इधर-उधर': { en: 'here and there', pos: 'adv' },
    'सुबह-सवेरे': { en: 'early morning', pos: 'adv' },
    'ख़ुशी': { en: 'happiness', pos: 'n' },
    'लगाता': { en: 'to apply, to attach', pos: 'v', lemma: 'लगाना' },
    'लगाओ': { en: 'to apply, to attach', pos: 'v', lemma: 'लगाना' },
    // ── Issue 1: Verb forms with bare translations (no "to") ──
    'अपनाना': { en: 'to adopt, to embrace', pos: 'v' },
    'अपनाई': { en: 'to adopt, to embrace', pos: 'v', lemma: 'अपनाना' },
    'अपनाया': { en: 'to adopt, to embrace', pos: 'v', lemma: 'अपनाना' },
    'उतरना': { en: 'to descend, to get off', pos: 'v' },
    'उतरा': { en: 'to descend, to get off', pos: 'v', lemma: 'उतरना' },
    'जोतना': { en: 'to plough', pos: 'v' },
    'जोता': { en: 'to plough', pos: 'v', lemma: 'जोतना' },
    'ठहरना': { en: 'to stop, to wait', pos: 'v' },
    'ठहरो': { en: 'to stop, to wait', pos: 'v', lemma: 'ठहरना' },
    'दिखना': { en: 'to appear, to be seen', pos: 'v' },
    'दिखेंगे': { en: 'to appear, to be seen', pos: 'v', lemma: 'दिखना' },
    'निकालना': { en: 'to remove, to take out', pos: 'v' },
    'निकालने': { en: 'to remove, to take out', pos: 'v', lemma: 'निकालना' },
    'निकाला': { en: 'to remove, to take out', pos: 'v', lemma: 'निकालना' },
    'निकाली': { en: 'to remove, to take out', pos: 'v', lemma: 'निकालना' },
    'निकाले': { en: 'to remove, to take out', pos: 'v', lemma: 'निकालना' },
    'निकालो': { en: 'to remove, to take out', pos: 'v', lemma: 'निकालना' },
    'बताना': { en: 'to tell, to explain', pos: 'v' },
    'बतानी': { en: 'to tell, to explain', pos: 'v', lemma: 'बताना' },
    'बताया': { en: 'to tell, to explain', pos: 'v', lemma: 'बताना' },
    // ── Misclassified verbs (should be nouns/adjectives) ──
    'तैराई': { en: 'swimming', pos: 'n' },
    'पत्ते': { en: 'leaves', pos: 'n' },
    'बूँदें': { en: 'drops', pos: 'n' },
    'रवाना': { en: 'departed, sent off', pos: 'adj' },
    'रसोइए': { en: 'cooks', pos: 'n' },
    // ── Issue 2: Hindi names (Name; literal meaning) ──
    'अंजलि': { en: 'Anjali; offering, tribute', pos: 'n' },
    'अंकित': { en: 'Ankit; marked, inscribed', pos: 'n' },
    'अजय': { en: 'Ajay; unconquered', pos: 'n' },
    'अनिल': { en: 'Anil; wind', pos: 'n' },
    'अनीता': { en: 'Anita; grace', pos: 'n' },
    'अमित': { en: 'Amit; boundless', pos: 'n' },
    'आदित्य': { en: 'Aditya; sun', pos: 'n' },
    'आशा': { en: 'Asha; hope', pos: 'n' },
    'उषा': { en: 'Usha; dawn', pos: 'n' },
    'कमल': { en: 'Kamal; lotus', pos: 'n' },
    'कमला': { en: 'Kamala; lotus', pos: 'n' },
    'कविता': { en: 'Kavita; poem', pos: 'n' },
    'कुणाल': { en: 'Kunal; lotus', pos: 'n' },
    'गीता': { en: 'Geeta; song', pos: 'n' },
    'गौरव': { en: 'Gaurav; pride', pos: 'n' },
    'गोपाल': { en: 'Gopal; cowherd', pos: 'n' },
    'ज्योति': { en: 'Jyoti; flame, light', pos: 'n' },
    'दिव्या': { en: 'Divya; divine', pos: 'n' },
    'दीपक': { en: 'Deepak; lamp', pos: 'n' },
    'नरेश': { en: 'Naresh; lord of men', pos: 'n' },
    'निखिल': { en: 'Nikhil; whole, complete', pos: 'n' },
    'निशा': { en: 'Nisha; night', pos: 'n' },
    'नीता': { en: 'Neeta; led, guided', pos: 'n' },
    'नेहा': { en: 'Neha; affection', pos: 'n' },
    'पंकज': { en: 'Pankaj; lotus', pos: 'n' },
    'पूजा': { en: 'Pooja; prayer, worship', pos: 'n' },
    'प्रदीप': { en: 'Pradeep; light, lamp', pos: 'n' },
    'प्रिया': { en: 'Priya; beloved', pos: 'n' },
    'ममता': { en: 'Mamta; maternal love', pos: 'n' },
    'मनीष': { en: 'Manish; lord of mind', pos: 'n' },
    'मनोज': { en: 'Manoj; born of mind', pos: 'n' },
    'मीना': { en: 'Meena; fish, gem', pos: 'n' },
    'मीरा': { en: 'Meera; ocean, sea', pos: 'n' },
    'मोहन': { en: 'Mohan; enchanting', pos: 'n' },
    'रमेश': { en: 'Ramesh; lord of Lakshmi', pos: 'n' },
    'रश्मि': { en: 'Rashmi; ray of light', pos: 'n' },
    'राजेश': { en: 'Rajesh; lord of kings', pos: 'n' },
    'राहुल': { en: 'Rahul; son of Buddha', pos: 'n' },
    'रानी': { en: 'Rani; queen', pos: 'n' },
    'रवि': { en: 'Ravi; sun', pos: 'n' },
    'रीता': { en: 'Rita; truth, order', pos: 'n' },
    'रेखा': { en: 'Rekha; line', pos: 'n' },
    'ललित': { en: 'Lalit; elegant, beautiful', pos: 'n' },
    'लक्ष्मी': { en: 'Lakshmi; goddess of wealth', pos: 'n' },
    'वरुण': { en: 'Varun; god of water', pos: 'n' },
    'विकास': { en: 'Vikas; development', pos: 'n' },
    'शिल्पा': { en: 'Shilpa; sculpture', pos: 'n' },
    'शीला': { en: 'Sheela; virtuous', pos: 'n' },
    'शोभा': { en: 'Shobha; beauty, grace', pos: 'n' },
    'श्याम': { en: 'Shyam; dark, Krishna', pos: 'n' },
    'संजय': { en: 'Sanjay; triumphant', pos: 'n' },
    'सचिन': { en: 'Sachin; pure, true', pos: 'n' },
    'सपना': { en: 'Sapna; dream', pos: 'n' },
    'सरला': { en: 'Sarla; simple, straight', pos: 'n' },
    'सविता': { en: 'Savita; sun', pos: 'n' },
    'सीता': { en: 'Sita; furrow', pos: 'n' },
    'सुनीता': { en: 'Sunita; well-led, virtuous', pos: 'n' },
    'सुनील': { en: 'Sunil; deep blue', pos: 'n' },
    'सुरेश': { en: 'Suresh; lord of gods', pos: 'n' },
    'सुषमा': { en: 'Sushma; beautiful', pos: 'n' },
    'स्वाति': { en: 'Swati; star, raindrop', pos: 'n' },
    'हरि': { en: 'Hari; god, green', pos: 'n' },
  },
  cy: {
    'maen': { en: 'stone; (maen nhw) they are', pos: 'n' },
    'arfer': { en: 'to practice; usually, habit', pos: 'v' },
    'pobi': { en: 'to bake', pos: 'v' },
    'gwylio': { en: 'to watch', pos: 'v' },
    'canlyniadau': { en: 'results', pos: 'n' },
    'canlyniad': { en: 'result', pos: 'n' },
  },
  de: {
    'ihre': { en: 'her; your (formal)', pos: 'det' },
    'ihren': { en: 'her; your (formal)', pos: 'det' },
    'guten': { en: 'good', pos: 'adj', lemma: 'gut' },
    'neuer': { en: 'new', pos: 'adj', lemma: 'neu' },
    'einer': { en: 'one; a', pos: 'det' },
    'verschiedenen': { en: 'different, various', pos: 'adj', lemma: 'verschieden' },
    'samstags': { en: 'Saturdays', pos: 'adv' },
    'abendessen': { en: 'dinner', pos: 'n' },
    'sein': { en: 'to be; his', pos: 'v' },
    'autobiographischen': { en: 'autobiographical', pos: 'adj' },
    'bayerischen': { en: 'Bavarian', pos: 'adj' },
    'rente': { en: 'pension, retirement', pos: 'n' },
    'beiden': { en: 'both', pos: 'det' },
    'dritten': { en: 'third', pos: 'adj', lemma: 'dritte' },
    'ersten': { en: 'first', pos: 'adj', lemma: 'erste' },
    'einzigen': { en: 'only, sole', pos: 'adj', lemma: 'einzig' },
    'kurzen': { en: 'short', pos: 'adj', lemma: 'kurz' },
    'stolzen': { en: 'proud', pos: 'adj', lemma: 'stolz' },
    'erdbeben': { en: 'earthquake', pos: 'n' },
    'rücken': { en: 'back (body)', pos: 'n' },
    'waschbecken': { en: 'sink, washbasin', pos: 'n' },
    'lieblingsessen': { en: 'favourite food', pos: 'n' },
    'felsen': { en: 'rock, cliff', pos: 'n' },
    'eine': { en: 'a; one', pos: 'det' },
    // Polysemy and case fixes
    'das': { en: 'the; that; which', pos: 'det' },
    'der': { en: 'the; who; which', pos: 'det' },
    'die': { en: 'the; who; which', pos: 'det' },
    'den': { en: 'the; whom', pos: 'det' },
    'dem': { en: 'the; whom', pos: 'det' },
    'des': { en: "the; of the", pos: 'det' },
    'ihnen': { en: 'to them; to you (formal)', pos: 'pron' },
    'ihm': { en: 'to him; to it', pos: 'pron' },
    'ihr': { en: 'her; you (plural); to her', pos: 'pron' },
    'mir': { en: 'to me; me', pos: 'pron' },
    'dir': { en: 'to you', pos: 'pron' },
    'uns': { en: 'us; to us', pos: 'pron' },
    'euch': { en: 'you (plural); to you', pos: 'pron' },
    'sich': { en: 'oneself; himself; herself; themselves', pos: 'pron' },
    'frage': { en: 'question; to ask', pos: 'n' },
    'fragen': { en: 'to ask; questions', pos: 'v' },
    'antwort': { en: 'answer; reply', pos: 'n' },
    'schön': { en: 'beautiful; nice', pos: 'adj' },
    'gut': { en: 'good; well', pos: 'adj' },
    'siehst': { en: 'to see', pos: 'v', lemma: 'sehen' },
    'sehen': { en: 'to see', pos: 'v' },
    'zu': { en: 'to; too', pos: 'prep' },
    'beim': { en: 'at the', pos: 'prep' },
    'vom': { en: 'from the', pos: 'prep' },
    'zum': { en: 'to the', pos: 'prep' },
    'zur': { en: 'to the', pos: 'prep' },
    'ins': { en: 'into the', pos: 'prep' },
    'ans': { en: 'to the', pos: 'prep' },
    'aufs': { en: 'onto the', pos: 'prep' },
  },
  tr: {
    'musunuz': { en: '(question particle)', pos: 'part' },
    'mısınız': { en: '(question particle)', pos: 'part' },
    'misiniz': { en: '(question particle)', pos: 'part' },
    'musun': { en: '(question particle)', pos: 'part' },
    'mısın': { en: '(question particle)', pos: 'part' },
    'misin': { en: '(question particle)', pos: 'part' },
  },
  ru: {
    'ничуть': { en: 'not at all', pos: 'adv' },
    'хоть': { en: 'at least', pos: 'part' },
  },
};

// ── Hindi false infinitives (nouns ending in ना) ────────────
const HINDI_FALSE_INFINITIVES = new Set([
  'योजना', 'कमरा', 'सपना', 'अपना', 'नमूना', 'ज़माना', 'खज़ाना', 'गाना',
  'ठिकाना', 'बहाना', 'निशाना', 'तराना', 'दीवाना', 'मस्ताना',
  'पुराना', 'सुहाना', 'बेगाना', 'ज़ुबाना', 'अफ़साना', 'फ़साना',
  'सूचना', // information
]);

// ── Hindi participle suffixes (Rule 9) ──────────────────────
const HINDI_VERB_SUFFIXES = ['ता', 'ती', 'ते', 'या', 'ई', 'ए', 'कर', 'ो', 'ूँ', 'ें', 'ाओ', 'इए', 'ूंगा', 'ूंगी', 'ेगा', 'ेगी', 'ेंगे', 'ेंगी'];

// Hindi nouns that happen to end in verb-like suffixes
const HINDI_NOUN_EXCEPTIONS = new Set([
  'कविता', 'सुविधा', 'कठिनाई', 'लड़की', 'लड़ाई', 'दवाई', 'सफ़ाई',
  'पढ़ाई', 'कमाई', 'सिलाई', 'धुलाई', 'बुनाई', 'कढ़ाई', 'चढ़ाई',
  'मिठाई', 'रुलाई', 'लुगाई', 'ठंडाई', 'तैयारी', 'बीमारी', 'नौकरी',
  'बारी', 'गाड़ी', 'छुट्टी', 'रोटी', 'खिड़की', 'पत्नी', 'नानी',
  'दादी', 'बेटी', 'सहेली', 'बहनजी', 'भाभी', 'चाची', 'मौसी',
  'दीदी', 'आंटी', 'मम्मी', 'पापी', 'नदी', 'जमीन', 'रात',
  'बात', 'सड़क', 'किताबें', 'कहानियाँ', 'कविताएँ', 'आँखें',
  'चिट्ठी', 'गली', 'टोपी', 'साड़ी', 'धोती', 'चप्पल',
]);

// ── Known English verbs (for typo detection, Rule 13) ────────
const KNOWN_ENGLISH_VERBS = new Set([
  'accept','achieve','act','add','admit','advise','afford','agree','aim','allow','announce','answer','appear','apply','argue','arrange','arrive','ask','attack','avoid',
  'bake','bang','bathe','be','beat','become','begin','behave','believe','belong','bend','bet','bite','blow','boil','borrow','bounce','bow','break','breathe','bring','brush','build','burn','burst','buy',
  'call','camp','care','carry','catch','cause','celebrate','change','charge','chat','check','choose','clap','clean','clear','climb','close','collect','come','communicate','compare','compete','complain','complete','concentrate','confirm','connect','consider','consist','contact','contain','continue','contribute','control','cook','copy','correct','cost','could','count','cover','crash','create','cross','cry','cut',
  'damage','dance','dare','deal','decide','deliver','demand','deny','depend','describe','design','destroy','develop','die','dig','direct','disappear','discover','discuss','divide','do','doubt','drag','draw','dream','dress','drink','drive','drop','dry',
  'earn','eat','employ','encourage','enjoy','enter','escape','examine','exchange','excite','excuse','exercise','exist','expect','experience','explain','explore','express','extend',
  'face','fail','fall','fancy','feed','feel','fight','fill','find','finish','fit','fix','float','fly','fold','follow','forbid','force','forget','forgive','form','found','freeze','frighten',
  'gain','gather','get','give','go','grab','greet','grow','guess','guide',
  'handle','hang','happen','hate','have','head','hear','heat','help','hide','hit','hold','hope','hug','hunt','hurry','hurt',
  'identify','ignore','imagine','impress','improve','include','increase','influence','inform','injure','insist','install','intend','interest','introduce','invent','invite','involve',
  'join','joke','judge','jump',
  'keep','kick','kill','kiss','kneel','knock','know',
  'lack','land','last','laugh','lay','lead','lean','learn','leave','lend','let','lie','lift','light','like','limit','link','listen','live','load','lock','look','lose','love',
  'make','manage','mark','match','matter','may','mean','measure','meet','melt','mention','might','mind','miss','mix','model','move','must',
  'name','need','negotiate','nod','note','notice',
  'obey','object','observe','obtain','occur','offer','open','operate','order','organise','organize','ought','owe','own',
  'pack','paint','park','pass','pay','perform','permit','persuade','phone','pick','place','plan','plant','play','please','point','pour','practice','pray','prefer','prepare','present','press','pretend','prevent','produce','promise','protect','prove','provide','publish','pull','pump','punch','punish','push','put',
  'qualify','question',
  'race','rain','raise','reach','read','realise','realize','receive','recognize','recommend','record','recover','reduce','refer','reflect','refuse','regard','regret','reject','relate','release','remain','remember','remind','remove','rent','repair','repeat','replace','reply','report','represent','request','require','rescue','resign','resist','rest','result','retire','return','reveal','ring','rise','risk','rob','roll','rub','ruin','run','rush',
  'sail','satisfy','save','say','scare','score','scratch','scream','search','see','seem','select','sell','send','separate','serve','set','settle','shake','shall','shape','share','shave','shelter','shift','shine','shoot','shop','shout','show','shut','sigh','sign','sing','sink','sit','ski','sleep','slide','slip','smell','smile','smoke','snow','solve','sort','sound','speak','speed','spell','spend','spill','split','spoil','spot','spread','spring',
  'stain','stand','stare','start','stay','steal','stick','stop','store','stretch','strike','struggle','study','submit','succeed','suffer','suggest','suit','supply','support','suppose','surprise','surround','survive','suspect','swallow','swim','swing','switch',
  'take','talk','taste','teach','tear','tell','tend','test','thank','think','throw','tidy','tie','touch','tour','translate','trap','travel','treat','trick','trip','trust','try','turn','type',
  'understand','unite','use',
  'vary','visit','vote',
  'wait','wake','walk','wander','want','warn','wash','waste','watch','wave','wear','weigh','welcome','whisper','will','win','wish','wonder','work','worry','would','wound','wrap','write',
  'yawn','yell',
]);

// ── Words to capitalise (Rule 11) ───────────────────────────
const CAPITALISE_WORDS = new Set([
  // Cities & countries
  'india','delhi','mumbai','kolkata','chennai','bangalore','hyderabad','jaipur','agra','varanasi','lucknow','pune','ahmedabad','goa','kashmir','rajasthan','kerala','punjab','gujarat','bengal','bihar','assam','nepal','pakistan','china','japan','america','england','london','paris','africa','asia','europe','moscow','berlin','rome','madrid','lisbon','amsterdam','stockholm','cardiff','swansea','istanbul','ankara','wales','scotland','ireland','france','spain','italy','germany','portugal','turkey','russia','sweden','brazil','mexico','canada','australia','austria','switzerland','belgium','norway','denmark','finland','greece','egypt','korea','taiwan','singapore','malaysia','thailand','vietnam','indonesia','philippines','argentina','colombia','chile','peru','cuba','israel',
  // Languages
  'hindi','english','urdu','sanskrit','arabic','persian','french','german','spanish','chinese','japanese','korean','bengali','tamil','telugu','marathi','gujarati','punjabi','malayalam','kannada','thai','tibetan','portuguese','italian','russian','turkish','polish','dutch','swedish','norwegian','danish','finnish','greek','latin','hebrew','welsh','czech','hungarian','romanian','bulgarian','serbian','croatian','ukrainian','swahili','afrikaans',
  // Festivals & holidays
  'diwali','holi','eid','navratri','dussehra','janmashtami','pongal','onam','lohri','chhath','christmas','easter','ramadan','halloween','thanksgiving','passover','hanukkah',
  // Honorifics & titles
  'mrs','mr','ms','dr','sir','madam',
  // Historical/religious figures
  'buddha','gandhi','nehru','shakespeare','mozart','beethoven','darwin','einstein','newton','aristotle','plato','socrates',
  // Names
  'sharma','gupta','singh','kumar','arjun','radha','sita','hanuman',
  // Months
  'january','february','march','april','may','june','july','august','september','october','november','december',
  // Days
  'monday','tuesday','wednesday','thursday','friday','saturday','sunday',
  // Additional cities
  'aberystwyth','antalya','bangor','barcelona','bastille','bologna','bordeaux','bhopal','breda',
  'cappadocia','caernarfon','carmarthen','chandigarh','cologne','curitiba','dehradun','deventer',
  'dresden','dublin','eindhoven','florence','frankfurt','gothenburg','groningen',
  'gwalior','hamburg','hanover','heidelberg','holyhead','indore','kanpur','kiruna',
  'leiden','lund','lyon','maastricht','marseille','milan','munich','nagpur',
  'naples','nice','patna','ranchi','recife','rotterdam',
  'salvador','seville','shimla','stuttgart','tokyo','toulouse','turin',
  'udaipur','utrecht','valencia','venice',
  // Regions & geographic
  'aegean','baltic','bavarian','bosphorus','caribbean','himalayas',
  'mediterranean','patagonia','pyrenees','rhine','sardinia','scandinavia','sicily',
  'snowdon','snowdonia','tuscany',
  // Cultural
  'carnival','celtic','colosseum','gothic','koningsdag','nobel',
  'oktoberfest','olympic','olympics','roman','sinterklaas',
  // Welsh
  'cymraeg','cymru','eisteddfod','mabinogi','nadolig','senedd',
  // Indian proper nouns
  'indian','hindu','hinduism','muslim','islam','islamic','sikh','sikhism',
  'buddhist','jain','jainism','christian','christianity','parsi',
  'ambedkar','tagore','mahavir','mahabharata','ramayana',
  'amritsar','jodhpur','mathura','darjeeling','rishikesh','haridwar',
  'ayodhya','prayagraj','ujjain','ludhiana','kochi','mysore','srinagar',
  'rajasthani','tibetan','tibet','afghan','afghanistan',
  'pakistani','nepali','bangladeshi','sri lankan',
  // Other missing proper nouns
  'korean','thai','vietnamese','indonesian','malaysian',
  'iranian','iraqi','egyptian','brazilian','mexican','canadian',
]);

// ── Language config ──────────────────────────────────────────
const LANGUAGES = [
  { code: 'es', file: 'src/data/dictionary/es.ts', varName: 'dictionary' },
  { code: 'hi', file: 'src/data/dictionary/hi.ts', varName: 'dictionary' },
  { code: 'it', file: 'src/data/dictionary/it.ts', varName: 'dictionary' },
  { code: 'de', file: 'src/data/dictionary/de.ts', varName: 'DICT' },
  { code: 'tr', file: 'src/data/dictionary/tr.ts', varName: 'dictionary' },
  { code: 'ru', file: 'src/data/dictionary/ru.ts', varName: 'dictionary' },
  { code: 'cy', file: 'src/data/dictionary/cy.ts', varName: 'dict' },
  { code: 'fr', file: 'src/data/dictionary/fr.ts', varName: 'dictionary' },
  { code: 'nl', file: 'src/data/dictionary/nl.ts', varName: 'dictionary' },
  { code: 'pt', file: 'src/data/dictionary/pt.ts', varName: 'dictionary' },
  { code: 'sv', file: 'src/data/dictionary/sv.ts', varName: 'dictionary' },
];

// ══════════════════════════════════════════════════════════════
// INFRASTRUCTURE: Split / Parse / Serialize / Validate
// ══════════════════════════════════════════════════════════════

function splitFile(content, varName) {
  const patterns = [
    new RegExp(`((?:export\\s+)?const\\s+${varName}\\s*:\\s*Record<[^>]+>\\s*=\\s*)\\{`, 'm'),
    new RegExp(`((?:export\\s+)?const\\s+${varName}\\s*=\\s*)\\{`, 'm'),
  ];
  let match = null;
  for (const pat of patterns) { match = content.match(pat); if (match) break; }
  if (!match) throw new Error(`Could not find dictionary declaration for '${varName}'`);

  const declEnd = match.index + match[0].length;
  const preDictCode = content.slice(0, declEnd - 1);

  let depth = 1, i = declEnd;
  while (i < content.length && depth > 0) {
    const ch = content[i];
    if (ch === '{') depth++;
    else if (ch === '}') depth--;
    if (ch === "'" || ch === '"' || ch === '`') {
      const q = ch; i++;
      while (i < content.length) { if (content[i] === '\\') { i += 2; continue; } if (content[i] === q) break; i++; }
    }
    i++;
  }
  const closingBrace = i - 1;
  const dictBody = content.slice(declEnd, closingBrace);
  let postStart = closingBrace;
  while (postStart < content.length && content[postStart] !== ';') postStart++;
  postStart++;
  return { preDictCode, dictBody, postDictCode: content.slice(postStart) };
}

function parseDictBody(dictBody) {
  const cleaned = dictBody.replace(/^\s*\/\/\s*REMOVED:.*$/gm, '');
  try { return vm.runInNewContext('({' + cleaned + '})', {}, { timeout: 10000 }); }
  catch (e) { throw new Error(`Failed to parse dict body: ${e.message}`); }
}

function serializeDict(dict) {
  const lines = [];
  for (const [key, entry] of Object.entries(dict)) {
    const escKey = key.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const escEn = (entry.en || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const escIpa = (entry.ipa || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    let line = `  '${escKey}': { en: '${escEn}', ipa: '${escIpa}', pos: '${entry.pos || 'n'}'`;
    if (entry.lemma) { line += `, lemma: '${entry.lemma.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`; }
    line += ' },';
    lines.push(line);
  }
  return '\n' + lines.join('\n') + '\n';
}

function validate(originalKeys, removedKeys, addedKeys, finalDict) {
  const errors = [];
  for (const key of originalKeys) { if (!removedKeys.has(key) && !finalDict[key]) errors.push(`Missing: '${key}'`); }
  for (const key of Object.keys(finalDict)) { if (!originalKeys.has(key) && !addedKeys.has(key)) errors.push(`Unexpected: '${key}'`); }
  return errors;
}

// ══════════════════════════════════════════════════════════════
// FIX RULES — executed in order
// ══════════════════════════════════════════════════════════════

function applyFixes(dict, lang) {
  const stats = { metadataRemoved: 0, posFix: 0, translationFix: 0, totalEntries: Object.keys(dict).length };
  const overridden = new Set(); // track overridden keys so later rules don't clobber them

  // ── Rule 3: Remove metadata entries ──
  for (const key of METADATA_KEYS) {
    if (dict[key]) { delete dict[key]; stats.metadataRemoved++; }
  }
  // Also remove English-word metadata with empty IPA
  for (const [key, entry] of Object.entries(dict)) {
    if (/^[a-zA-Z]+$/.test(key) && entry.ipa === '' &&
        ['present','past','imperative','isPerfective','to','the','be','do','e','s','u','ey'].includes(key)) {
      delete dict[key]; stats.metadataRemoved++;
    }
  }

  // ── Rule 12: Per-language curated overrides (run FIRST) ──
  // Can both UPDATE existing entries and ADD missing ones
  const langOverrides = OVERRIDES[lang] || {};
  for (const [key, override] of Object.entries(langOverrides)) {
    if (dict[key]) {
      Object.assign(dict[key], override);
    } else {
      // Add new entry (for compound/hyphenated words etc.)
      dict[key] = { en: override.en, ipa: '', pos: override.pos, ...(override.lemma ? { lemma: override.lemma } : {}) };
    }
    overridden.add(key);
    stats.translationFix++;
  }

  // ── Rule 0: Fix infinitive verbs tagged as nouns ──
  for (const [key, entry] of Object.entries(dict)) {
    if (overridden.has(key)) continue;
    if (entry.pos !== 'n') continue;
    if (entry.lemma) continue;

    // Hindi: words ending in ना
    if (lang === 'hi' && key.endsWith('ना') && !HINDI_FALSE_INFINITIVES.has(key)) {
      if (entry.en && !entry.en.startsWith('to ')) entry.en = 'to ' + entry.en;
      entry.pos = 'v';
      stats.posFix++;
      continue;
    }
    // All langs: en starts with 'to ' but pos is 'n'
    if (entry.en && entry.en.startsWith('to ') && !entry.lemma) {
      entry.pos = 'v';
      stats.posFix++;
    }
  }

  // ── Rule 9: Hindi participle suffix POS fix ──
  if (lang === 'hi') {
    for (const [key, entry] of Object.entries(dict)) {
      if (overridden.has(key)) continue;
      if (entry.pos !== 'n') continue;
      if (HINDI_NOUN_EXCEPTIONS.has(key)) continue;

      // Check if this word ends in a verb suffix AND has a lemma pointing to a verb
      if (entry.lemma && dict[entry.lemma] && dict[entry.lemma].pos === 'v') {
        entry.pos = 'v';
        stats.posFix++;
        continue;
      }

      // Check if word ends in known verb suffixes and en looks verb-like
      const hasVerbSuffix = HINDI_VERB_SUFFIXES.some(s => key.endsWith(s));
      if (hasVerbSuffix && entry.en) {
        const enLower = entry.en.toLowerCase();
        // English translations that suggest verb action
        if (enLower.match(/^(go|goes|going|went|gone|come|comes|coming|came|run|runs|running|ran|walk|walks|walking|walked|eat|eats|eating|ate|drink|drinks|drinking|drank|sit|sits|sitting|sat|stand|stands|standing|stood|sleep|sleeps|sleeping|slept|sing|sings|singing|sang|dance|dances|dancing|danced|play|plays|playing|played|read|reads|reading|write|writes|writing|wrote|give|gives|giving|gave|take|takes|taking|took|make|makes|making|made|say|says|saying|said|tell|tells|telling|told|ask|asks|asking|asked|see|sees|seeing|saw|look|looks|looking|looked|hear|hears|hearing|heard|feel|feels|feeling|felt|think|thinks|thinking|thought|know|knows|knowing|knew|want|wants|wanting|wanted|need|needs|needing|needed|like|likes|liking|liked|love|loves|loving|loved|start|starts|starting|started|stop|stops|stopping|stopped|open|opens|opening|opened|close|closes|closing|closed|turn|turns|turning|turned|move|moves|moving|moved|put|puts|putting|get|gets|getting|got|find|finds|finding|found|keep|keeps|keeping|kept|hold|holds|holding|held|bring|brings|bringing|brought|send|sends|sending|sent|leave|leaves|leaving|left|stay|stays|staying|stayed|live|lives|living|lived|buy|buys|buying|bought|sell|sells|selling|sold|win|wins|winning|won|lose|loses|losing|lost|try|tries|trying|tried|help|helps|helping|helped|show|shows|showing|showed|call|calls|calling|called|wait|waits|waiting|waited|meet|meets|meeting|met|join|joins|joining|joined|build|builds|building|built|break|breaks|breaking|broke|cut|cuts|cutting|hit|hits|hitting|catch|catches|catching|caught|throw|throws|throwing|threw|carry|carries|carrying|carried|pull|pulls|pulling|pulled|push|pushes|pushing|pushed|pick|picks|picking|picked|drop|drops|dropping|dropped|fill|fills|filling|filled|clean|cleans|cleaning|cleaned|wash|washes|washing|washed|cook|cooks|cooking|cooked|drive|drives|driving|drove|fly|flies|flying|flew|swim|swims|swimming|swam|climb|climbs|climbing|climbed|fall|falls|falling|fell|grow|grows|growing|grew|change|changes|changing|changed|follow|follows|following|followed|lead|leads|leading|led|teach|teaches|teaching|taught|learn|learns|learning|learned|study|studies|studying|studied|work|works|working|worked|plant|plants|planting|planted|bite|bites|biting|bit|blow|blows|blowing|blew|adopt|adopts|adopting|adopted|land|lands|landing|landed|surge|surges|surging|surged|getting up|picking up|putting|setting|lifting|cutting)$/i)) {
          entry.pos = 'v';
          stats.posFix++;
        }
      }
    }
  }

  // ── Rule 1: Lemma-based POS propagation ──
  for (const [key, entry] of Object.entries(dict)) {
    if (overridden.has(key)) continue;
    if (!entry.lemma) continue;
    const lemmaEntry = dict[entry.lemma];
    if (!lemmaEntry) continue;
    if ((lemmaEntry.pos === 'v' || (lemmaEntry.en && lemmaEntry.en.startsWith('to '))) && entry.pos !== 'v') {
      entry.pos = 'v';
      stats.posFix++;
    }
  }

  // ── Rule 1b: REVERSE lemma propagation — if lemma is NOT a verb, strip "to" ──
  // Catches German noun plurals (Blumen→Blume), adj declensions (guten→gut) tagged as verbs
  for (const [key, entry] of Object.entries(dict)) {
    if (overridden.has(key)) continue;
    if (!entry.lemma || !entry.en) continue;
    const lemmaEntry = dict[entry.lemma];
    if (!lemmaEntry) continue;
    // If lemma is NOT a verb, this entry shouldn't be one either
    if (lemmaEntry.pos !== 'v' && !(lemmaEntry.en && lemmaEntry.en.startsWith('to '))) {
      if (entry.en.startsWith('to ')) {
        entry.en = entry.en.slice(3).trim();
        stats.translationFix++;
      }
      if (entry.pos === 'v') {
        entry.pos = lemmaEntry.pos; // inherit lemma's POS
        stats.posFix++;
      }
    }
  }

  // ── Rule 2: False "to + noun/adj" removal (expanded) ──
  // If pos is NOT 'v' and en starts with 'to ', check if the English word is actually a verb
  // If it's NOT a known verb, strip the 'to ' and fix POS
  for (const [key, entry] of Object.entries(dict)) {
    if (overridden.has(key)) continue;
    if (!entry.en || !entry.en.startsWith('to ')) continue;
    if (entry.pos === 'v') continue;
    if (entry.lemma) continue; // handled by Rule 1b

    const enWord = entry.en.slice(3).trim().toLowerCase();
    // If this is a KNOWN English verb, make it pos:'v' (it's a real verb with wrong POS)
    if (KNOWN_ENGLISH_VERBS.has(enWord)) {
      entry.pos = 'v';
      stats.posFix++;
      continue;
    }
    // Otherwise strip the false 'to ' prefix
    entry.en = entry.en.slice(3).trim();
    // Determine correct POS from the English word
    const ADJ_SUFFIX = /^.*(ical|ible|able|ious|eous|ful|less|ish|ive|ous|ant|ent|al|ar|ic|ern|ese|ian|ary|ory)$/i;
    if (ADJ_SUFFIX.test(entry.en)) {
      entry.pos = 'adj';
    } else {
      entry.pos = 'n'; // default to noun
    }
    stats.translationFix++;
  }

  // ── Rule 2b: pos:'v' entries where en is 'to X' but X is NOT a known verb ──
  // These are verbs in the target language but got wrong English translations
  for (const [key, entry] of Object.entries(dict)) {
    if (overridden.has(key)) continue;
    if (!entry.en || !entry.en.startsWith('to ')) continue;
    if (entry.pos !== 'v') continue;

    const enWord = entry.en.slice(3).trim().toLowerCase();
    // Skip if it's a known verb — that's correct
    if (KNOWN_ENGLISH_VERBS.has(enWord)) continue;
    // Skip compound verbs like "to ice-skate", "to give birth"
    if (enWord.includes(' ') || enWord.includes('-')) continue;
    // Skip if it has a lemma pointing to a real verb — it IS a verb, just bad translation
    if (entry.lemma && dict[entry.lemma]?.pos === 'v') continue;

    // This is "to X" where X is not a known verb and no verb lemma
    // It's likely a noun/adj wrongly tagged as verb
    entry.en = entry.en.slice(3).trim();
    entry.pos = 'n';
    stats.translationFix++;
  }

  // ── Rule 10: Verb translation normalisation (AGGRESSIVE) ──
  // ALWAYS ensure pos:'v' entries have "to" prefix. Use lemma if available, else add "to" directly.
  const BAD_TO_PREFIX = /^(the|a|an|my|your|his|her|its|our|their|this|that|these|those|i|he|she|it|we|they|you|not|no|very|too|also|just|still|already|never|always|often|here|there|now|then|so|but|and|or|if|when|where|how|what|who|which|why|because)\b/i;

  // First pass: ensure infinitive forms (no lemma field) all start with "to "
  // ALSO normalise polysemy: "do; make" → "to do; to make"
  for (const [key, entry] of Object.entries(dict)) {
    if (overridden.has(key)) continue;
    if (entry.pos !== 'v') continue;
    if (!entry.en) continue;

    // If en has semicolon, ensure each part starts with "to "
    if (entry.en.includes(';')) {
      const parts = entry.en.split(';').map(p => p.trim());
      const fixed = parts.map(p => {
        if (!p) return p;
        if (p.startsWith('to ')) return p;
        // Don't prefix obvious nouns
        if (BAD_TO_PREFIX.test(p)) return p;
        return 'to ' + p;
      }).join('; ');
      if (fixed !== entry.en) {
        entry.en = fixed;
        stats.translationFix++;
      }
      continue;
    }

    // Single-meaning entries
    if (entry.en.startsWith('to ')) continue;

    // If has lemma, copy from lemma
    if (entry.lemma) {
      const lemmaEntry = dict[entry.lemma];
      if (lemmaEntry && lemmaEntry.en) {
        if (lemmaEntry.en.includes(';')) {
          // Use whole thing if all parts have "to" or apply same logic
          const lemmaParts = lemmaEntry.en.split(';').map(p => p.trim());
          const allHaveTo = lemmaParts.every(p => p.startsWith('to '));
          if (allHaveTo) { entry.en = lemmaEntry.en; stats.translationFix++; continue; }
          // Find "to X" part
          const toPart = lemmaParts.find(p => p.startsWith('to '));
          if (toPart) { entry.en = toPart; stats.translationFix++; continue; }
          // Just fix the lemma's en with to prefix on each part
          entry.en = lemmaParts.map(p => p.startsWith('to ') || BAD_TO_PREFIX.test(p) ? p : 'to ' + p).join('; ');
          stats.translationFix++;
          continue;
        } else if (lemmaEntry.en.startsWith('to ')) {
          entry.en = lemmaEntry.en; stats.translationFix++; continue;
        } else if (!BAD_TO_PREFIX.test(lemmaEntry.en)) {
          // Lemma's en doesn't have "to" — prefix it on the lemma AND on this entry
          entry.en = 'to ' + lemmaEntry.en;
          stats.translationFix++;
          continue;
        }
      }
    }

    // Only prefix "to" if the English is a single known verb word
    const en = entry.en.trim().toLowerCase();
    if (KNOWN_ENGLISH_VERBS.has(en) && !BAD_TO_PREFIX.test(en)) {
      entry.en = 'to ' + en;
      stats.translationFix++;
    }
    // Do NOT blindly prefix "to" to multi-word phrases or unknown words
  }

  // ── Rule 10b: Cleanup — strip bad "to " prefixes from previous runs ──
  const BAD_TO = /^to (the |an |my |your |his |her |its |our |their |this |that |these |those |i |he |she |it |we |they |you |not |no |very |too |also |just |still |already |never |always |often |here |there |now |then |so |but |and |or |if |when |where |how |what |who |which |why |because )/i;
  for (const [key, entry] of Object.entries(dict)) {
    if (!entry.en || !BAD_TO.test(entry.en)) continue;
    entry.en = entry.en.slice(3).trim(); // strip "to "
    if (entry.pos === 'v') entry.pos = 'n'; // likely not a verb
    stats.translationFix++;
  }

  // ── Rule 13: English translation typo fixer ──
  for (const [key, entry] of Object.entries(dict)) {
    if (overridden.has(key)) continue;
    if (!entry.en || !entry.en.startsWith('to ')) continue;
    const verb = entry.en.slice(3).trim().toLowerCase();
    if (KNOWN_ENGLISH_VERBS.has(verb)) continue; // already valid

    // Try removing trailing 'e' (watche→watch, teache→teach, bake is valid so skip)
    if (verb.endsWith('e') && verb.length > 3) {
      const trimmed = verb.slice(0, -1);
      if (KNOWN_ENGLISH_VERBS.has(trimmed)) {
        entry.en = 'to ' + trimmed;
        stats.translationFix++;
        continue;
      }
    }
    // Try adding trailing 'e' (bak→bake, mak→make)
    if (!verb.endsWith('e') && verb.length > 2) {
      const withE = verb + 'e';
      if (KNOWN_ENGLISH_VERBS.has(withE)) {
        entry.en = 'to ' + withE;
        stats.translationFix++;
        continue;
      }
    }
    // Try fixing doubled consonant (runn→run, swimm→swim)
    if (verb.length > 3 && verb[verb.length-1] === verb[verb.length-2]) {
      const deduped = verb.slice(0, -1);
      if (KNOWN_ENGLISH_VERBS.has(deduped)) {
        entry.en = 'to ' + deduped;
        stats.translationFix++;
        continue;
      }
    }
  }

  // ── Rule 5: Semicolon dedup (careful — don't destroy dual meanings) ──
  for (const [key, entry] of Object.entries(dict)) {
    if (overridden.has(key)) continue;
    if (!entry.en || !entry.en.includes(';') || !entry.lemma) continue;
    const parts = entry.en.split(';').map(p => p.trim());
    if (parts.length !== 2) continue;
    const verbPart = parts.find(p => p.startsWith('to '));
    const otherPart = parts.find(p => !p.startsWith('to '));
    if (!verbPart || !otherPart) continue;
    const v = verbPart.slice(3).toLowerCase(), o = otherPart.toLowerCase();
    // Only collapse if same root (to spend; spent → to spend)
    if (v.length >= 3 && o.length >= 3 && v.slice(0, 3) === o.slice(0, 3)) {
      entry.en = verbPart; entry.pos = 'v';
    }
  }

  // ── Rule 7: Strip "a/an" from noun translations ──
  for (const [key, entry] of Object.entries(dict)) {
    if (overridden.has(key)) continue;
    if (entry.pos === 'n' && entry.en && /^(a |an )/i.test(entry.en)) {
      entry.en = entry.en.replace(/^(a |an )/i, '');
      stats.translationFix++;
    }
  }

  // ── Rule 16: Fix 'phrase' POS entries ──
  // These are conjugated verb forms wrongly tagged as 'phrase' (mostly Turkish)
  // Use Stanza NLP data to find the correct lemma and fix POS
  try {
    const nlpResults = JSON.parse(fs.readFileSync('scripts/nlp-qc-results.json', 'utf8'));
    const nlpLang = nlpResults[lang] || {};
    const verbLemmas = nlpLang.verb_lemmas || {};

    for (const [key, entry] of Object.entries(dict)) {
      if (entry.pos !== 'phrase') continue;
      if (overridden.has(key)) continue;

      // Check if Stanza identified this as a verb with a lemma
      const stanzaInfo = verbLemmas[key];
      if (stanzaInfo && stanzaInfo.lemma) {
        // Find the lemma's infinitive form in our dict
        // Turkish infinitives end in -mek/-mak
        const possibleInf = [stanzaInfo.lemma + 'mek', stanzaInfo.lemma + 'mak', stanzaInfo.lemma];
        let lemmaKey = null;
        for (const inf of possibleInf) {
          if (dict[inf] && dict[inf].pos === 'v') { lemmaKey = inf; break; }
        }
        if (lemmaKey) {
          entry.pos = 'v';
          entry.lemma = lemmaKey;
          entry.en = dict[lemmaKey].en;
          stats.posFix++;
          continue;
        }
      }

      // Fallback: if no Stanza data, change phrase→n (at least it won't show as verb)
      entry.pos = 'n';
      stats.posFix++;
    }
  } catch (e) {
    // NLP results file not found — just fix phrase→n
    for (const [key, entry] of Object.entries(dict)) {
      if (entry.pos === 'phrase') { entry.pos = 'n'; stats.posFix++; }
    }
  }

  // ── Rule 15: Apply NLP-derived corrections (Stanza lemmas + POS) ──
  try {
    const nlpCorrections = JSON.parse(fs.readFileSync('scripts/nlp-corrections.json', 'utf8'));
    const langCorr = nlpCorrections[lang] || {};
    for (const [word, corr] of Object.entries(langCorr)) {
      if (overridden.has(word)) continue;
      if (!dict[word]) continue;
      const entry = dict[word];
      // Apply lemma if Stanza found one and it exists in our dict
      if (corr.lemma && dict[corr.lemma] && !entry.lemma) {
        entry.lemma = corr.lemma;
        stats.translationFix++;
      }
      // DISABLED: POS upgrades from NLP were too aggressive and caused damage
      // Only apply POS changes through curated overrides (Rule 12) or lemma propagation (Rule 1)
      // Fix verb translations: if verb has lemma now, copy lemma's "to X" translation
      if (entry.pos === 'v' && entry.lemma && entry.en && !entry.en.startsWith('to ') && !entry.en.includes(';')) {
        const lemmaEntry = dict[entry.lemma];
        if (lemmaEntry && lemmaEntry.en && lemmaEntry.en.startsWith('to ')) {
          entry.en = lemmaEntry.en;
          stats.translationFix++;
        }
      }
    }
  } catch (e) {
    // NLP corrections file not found — skip
  }

  // ── Rule 15b: Fix verbs without "to" using raw Stanza lemma data ──
  try {
    const nlpRaw = JSON.parse(fs.readFileSync('scripts/nlp-qc-results.json', 'utf8'));
    const verbLemmas = nlpRaw[lang]?.verb_lemmas || {};

    for (const [key, entry] of Object.entries(dict)) {
      if (overridden.has(key)) continue;
      if (entry.pos !== 'v') continue;
      if (entry.en && entry.en.startsWith('to ')) continue;
      if (entry.en && entry.en.includes(';')) continue;
      if (entry.lemma) continue; // already has lemma, handled by Rule 10

      const stanza = verbLemmas[key];
      if (!stanza || !stanza.lemma) continue;

      // Turkish infinitives end in -mek/-mak, try to find them
      const stem = stanza.lemma;
      const candidates = [stem, stem + 'mek', stem + 'mak', stem + 'nak', stem + 'nek',
                          stem + 'na', stem + 'ne', stem + 'ть', stem + 'ти',  // Russian
                          stem + 'er', stem + 'ir', stem + 're', stem + 'ar',  // Romance
                          stem + 'en', stem + 'eln', stem + 'ern',             // Germanic
                          stem + 'a',                                           // Swedish
                          ];
      let found = false;
      for (const c of candidates) {
        if (dict[c] && dict[c].pos === 'v' && dict[c].en && dict[c].en.startsWith('to ')) {
          entry.lemma = c;
          entry.en = dict[c].en;
          stats.translationFix++;
          found = true;
          break;
        }
      }
    }
  } catch (e) { /* no Stanza data */ }

  // ── Rule 15c: AGGRESSIVE bare verb fix — prefix "to " to any remaining pos:'v' without "to " ──
  // Cleans up subjects/auxiliaries from the existing translation first.
  const SUBJECT_PFX = /^(I|he|she|it|we|they|you|one|someone|there) /i;
  const AUX_PFX = /^(am|is|are|was|were|been|be|being|have|has|had|do|does|did|will|would|shall|should|can|could|may|might|must)\s+/i;
  const ING_NOUNS = /^(meeting|building|writing|painting|drawing|reading|swimming|running|walking|cooking|cleaning|warning|opening|ending|beginning|feeling|meaning|saying|hearing|setting|showing|teaching|learning|earning)$/i;

  for (const [key, entry] of Object.entries(dict)) {
    if (overridden.has(key)) continue;
    if (entry.pos !== 'v') continue;
    if (!entry.en) continue;
    if (entry.en.startsWith('to ')) continue;
    if (entry.en.includes(';')) continue;

    // If has lemma and lemma's en starts with "to ", copy
    if (entry.lemma && dict[entry.lemma]) {
      const le = dict[entry.lemma];
      if (le.en) {
        if (le.en.startsWith('to ')) { entry.en = le.en; stats.translationFix++; continue; }
        if (le.en.includes(';')) {
          const tp = le.en.split(';').map(s => s.trim()).find(s => s.startsWith('to '));
          if (tp) { entry.en = tp; stats.translationFix++; continue; }
        }
      }
    }

    // Clean and prefix "to "
    let cleaned = entry.en.trim();
    cleaned = cleaned.replace(SUBJECT_PFX, '').replace(AUX_PFX, '').trim();
    if (!cleaned) continue;
    // Lowercase first letter (verbs are not capitalised)
    cleaned = cleaned[0].toLowerCase() + cleaned.slice(1);
    // Strip -ing if not a noun-like word
    if (cleaned.match(/\w+ing$/) && !ING_NOUNS.test(cleaned)) {
      const base = cleaned.replace(/ing$/, '');
      if (base.match(/([bcdfgklmnprst])\1$/) && base.length > 3) cleaned = base.slice(0, -1);
      else cleaned = base;
    }
    entry.en = 'to ' + cleaned;
    stats.translationFix++;
  }

  // ── Rule 16: Standardise polysemy notation — / becomes ; everywhere ──
  for (const [key, entry] of Object.entries(dict)) {
    if (overridden.has(key)) continue;
    if (!entry.en || !entry.en.includes('/')) continue;
    // Don't touch URLs or fractions like 1/2
    if (/https?:|\d\/\d/.test(entry.en)) continue;
    // Replace / with ; (with proper spacing)
    entry.en = entry.en.replace(/\s*\/\s*/g, '; ');
    stats.translationFix++;
  }

  // ── Rule 11: Capitalisation (run LAST) ──
  // ONLY capitalise if the entry is a noun (pos:'n') AND the lowercase word is in our list
  // Adjectives/verbs/adverbs etc. should never have their words capitalised mid-translation
  for (const [key, entry] of Object.entries(dict)) {
    if (!entry.en) continue;
    // Skip non-noun POS to avoid capitalising adjectives like "nice"
    if (entry.pos && entry.pos !== 'n') continue;
    const words = entry.en.split(/(\s+|[;,])/);
    let changed = false;
    for (let i = 0; i < words.length; i++) {
      const w = words[i].trim().toLowerCase();
      if (CAPITALISE_WORDS.has(w) && words[i] !== words[i].charAt(0).toUpperCase() + words[i].slice(1)) {
        words[i] = words[i].charAt(0).toUpperCase() + words[i].slice(1);
        changed = true;
      }
    }
    if (changed) { entry.en = words.join(''); stats.translationFix++; }
  }

  stats.finalEntries = Object.keys(dict).length;
  return stats;
}

// ══════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════

function processLanguage({ code, file: filePath, varName }) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Processing: ${code.toUpperCase()} (${filePath})`);
  console.log('='.repeat(60));

  const content = fs.readFileSync(filePath, 'utf8');
  let preDictCode, dictBody, postDictCode;
  try { ({ preDictCode, dictBody, postDictCode } = splitFile(content, varName)); }
  catch (e) { console.error(`  ERROR splitting: ${e.message}`); return null; }

  let dict;
  try { dict = parseDictBody(dictBody); console.log(`  Parsed: ${Object.keys(dict).length} entries`); }
  catch (e) { console.error(`  ERROR parsing: ${e.message}`); return null; }

  const originalKeys = new Set(Object.keys(dict));
  const stats = applyFixes(dict, code);
  console.log(`  Fixes: metadata=${stats.metadataRemoved}, pos=${stats.posFix}, translation=${stats.translationFix}`);
  console.log(`  Entries: ${stats.totalEntries} → ${stats.finalEntries}`);

  const serialized = serializeDict(dict);
  const output = preDictCode + ' {' + serialized + '};' + postDictCode;

  const removedKeys = new Set();
  const addedKeys = new Set();
  for (const key of originalKeys) { if (!dict[key]) removedKeys.add(key); }
  for (const key of Object.keys(dict)) { if (!originalKeys.has(key)) addedKeys.add(key); }

  try {
    const reparsed = parseDictBody(serialized);
    const errors = validate(originalKeys, removedKeys, addedKeys, reparsed);
    if (errors.length) { console.error('  VALIDATION ERRORS:', errors.slice(0, 5)); return null; }
    console.log(`  Validation: PASS (${Object.keys(reparsed).length} entries)`);
  } catch (e) { console.error(`  VALIDATION ERROR: ${e.message}`); return null; }

  if (!DRY_RUN) {
    fs.writeFileSync(filePath, output);
    console.log(`  Written: ${filePath}`);
  } else {
    console.log(`  DRY RUN: would write ${output.length} bytes`);
  }
  return stats;
}

console.log(`Dictionary Fix Script v2 ${DRY_RUN ? '(DRY RUN)' : ''}`);
console.log(`Processing ${LANGUAGES.length} languages...\n`);

const grand = { metadata: 0, pos: 0, translation: 0, errors: 0 };
for (const lang of LANGUAGES) {
  const s = processLanguage(lang);
  if (s) { grand.metadata += s.metadataRemoved; grand.pos += s.posFix; grand.translation += s.translationFix; }
  else { grand.errors++; }
}

console.log(`\n${'='.repeat(60)}`);
console.log(`GRAND TOTALS: metadata=${grand.metadata}, pos=${grand.pos}, translation=${grand.translation}, errors=${grand.errors}`);
console.log(grand.errors ? '⚠️  Errors occurred.' : '✅ All done.');
if (grand.errors) process.exit(1);
