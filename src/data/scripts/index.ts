// Script-teacher pack manifest — the DECK_LOADERS pattern (App.tsx) at pack
// scale: HOME can know a pack exists for a language without loading it; the
// JSON itself lazy-loads via dynamic import (Rollup auto-chunks it — small
// enough to stay in the SW precache, so NO vite.config/manualChunks change).
//
// hangul.json is currently a 14-item STUB (L1 slice + 3 composed blocks) so
// the engine and UI are buildable/testable — P2 replaces it wholesale with the
// full authored + adversarially-verified pack.

import type { Language } from '../../types';
import type { ScriptId, ScriptPack } from './types';

export interface ScriptPackRef {
  scriptId: ScriptId;
  loader: () => Promise<ScriptPack>;
}

export const SCRIPT_PACKS: Partial<Record<Language, ScriptPackRef>> = {
  korean: {
    scriptId: 'hangul',
    loader: () => import('./hangul.json').then(m => m.default as unknown as ScriptPack),
  },
  // russian → cyrillic (P3), hindi → devanagari (P3); kana is gated on the
  // Japanese launch decision (docs/script-teacher-scoping.md, locked decision 5).
};

export const scriptPackFor = (lang: Language): ScriptPackRef | undefined => SCRIPT_PACKS[lang];
