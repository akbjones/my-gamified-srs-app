// Script-teacher content-pack types (docs/script-teacher-scoping.md §2.1).
//
// Pack DATA lives in JSON (hangul.json …) so generate-audio.cjs can require()
// it and the authoring/verify agent scripts can read-modify-write it id-stably
// (the Hindi-pass idiom). These types are the thin compile-time contract.

import type { Language } from '../../types';

export type ScriptId = 'hangul' | 'cyrillic' | 'devanagari' | 'kana';

export type ScriptItemKind =
  | 'letter'     // a base glyph (jamo, Cyrillic letter, Devanagari consonant/vowel)
  | 'modifier'   // attaches to letters: matras, dakuten, tense/aspirated marks taught as rules
  | 'composed'   // built from components: Hangul syllable block, consonant+matra
  | 'word';      // a real deck word all of whose characters are learned (context drill)

export interface ScriptItem {
  id: string;              // 'sc-ko-0001' — stable forever (id-stable-apply rule)
  kind: ScriptItemKind;
  glyph: string;           // 'ㄱ' | 'в' | 'का' | '한'
  sound: string;           // display pronunciation: 'g/k'
  romanization: string;    // canonical answer key: 'g'
  mnemonic: string;        // ≤200 chars, shape→sound story (letters/modifiers; '' for composed/word)
  level: number;           // 1..N
  similar?: string[];      // ids of confusables → discrimination drills
  components?: string[];   // 'composed' items: constituent item ids, in tap order
  /** Snapshot from the language's own deck at authoring time — never resolved at runtime. */
  exampleWord?: { target: string; english: string; deckCardId: string };
  audio: string;           // 'sc-ko-0001.mp3' — flat in public/quest-audio
}

export interface ScriptLevel {
  level: number;
  title: string;
  itemIds: string[];
  /** Cumulative deck words readable after finishing levels 1..N — precomputed
   *  at authoring time (computing it live would load the whole deck chunk). */
  readableWordCount: number;
}

/** Per-script review-input config (LOCKED decision 2): audio-led where the
 *  sound contrast IS the lesson (Devanagari retroflex/dental, aspiration;
 *  Cyrillic confusables) — typed/choice romanization can't express what the
 *  learner is meant to discriminate. */
export interface ScriptDrillConfig {
  /** Prompt modes eligible for recall drills (pick-the-glyph). */
  recallPrompts: Array<'audio' | 'romanization'>;
  /** Prompt mode for discrimination drills over a similar-set. */
  discriminationPrompt: 'audio' | 'romanization';
}

export interface ScriptPack {
  scriptId: ScriptId;
  /** OPTIONAL: a deck-less teaser pack (kana before a Japanese launch) has no
   *  Language — exampleWords + the readable-words counter are disabled then. */
  language?: Language;
  name: string;            // 'Hangul'
  tagline: string;         // 'Read Korean in about 3 days'
  drill?: ScriptDrillConfig; // engine defaults apply when absent
  items: ScriptItem[];
  levels: ScriptLevel[];
}
