import React, { useState, useMemo } from 'react';
import { VocabMap, VocabEntry, Language, ConjugationTable } from '../types';
import { isCommonWord } from '../services/vocabService';
import { ChevronLeft, Search, Clock, AlertTriangle, ChevronDown } from 'lucide-react';
import type { DictEntry } from '../data/dictionary/es';
import { conjugate as conjugateEs } from '../data/conjugation/es';
import { conjugate as conjugateIt } from '../data/conjugation/it';
import { conjugate as conjugateFr } from '../data/conjugation/fr';
import { conjugate as conjugatePt } from '../data/conjugation/pt';

type SortMode = 'recent' | 'tricky';

interface VocabListProps {
  vocabMap: VocabMap;
  language: Language;
  onBack: () => void;
  lookupFn?: (word: string) => DictEntry | null;
}

const CONJUGATE_FNS: Partial<Record<Language, (inf: string) => ConjugationTable | null>> = {
  spanish: conjugateEs,
  italian: conjugateIt,
  french: conjugateFr,
  portuguese: conjugatePt,
};

const PERSON_LABELS: Record<string, string[]> = {
  spanish: ['yo', 'tú', 'él', 'nosotros', 'vosotros', 'ellos'],
  italian: ['io', 'tu', 'lui', 'noi', 'voi', 'loro'],
  french: ['je', 'tu', 'il', 'nous', 'vous', 'ils'],
  portuguese: ['eu', 'tu', 'ele', 'nós', 'vós', 'eles'],
};

const TENSE_LABELS: Record<string, string> = {
  present: 'Present', preterite: 'Preterite', imperfect: 'Imperfect',
  future: 'Future', conditional: 'Conditional', subjunctive: 'Subjunctive',
};

/** Extract infinitive from translation strings like "to hug (abbracciare)" */
function extractInfinitive(translation: string): string | null {
  const paren = translation.match(/\(([^)]+)\)/);
  if (paren) return paren[1].trim().toLowerCase();
  return null;
}

const VocabList: React.FC<VocabListProps> = ({ vocabMap, language, onBack, lookupFn }) => {
  const [search, setSearch] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('recent');
  const [showCommon, setShowCommon] = useState(false);
  const [expandedWord, setExpandedWord] = useState<string | null>(null);
  const [conjTense, setConjTense] = useState('present');

  // Try to get conjugation table for a vocab entry
  const getConjugation = (entry: VocabEntry): ConjugationTable | null => {
    if (entry.pos !== 'v') return null;
    const conjugateFn = CONJUGATE_FNS[language];
    if (!conjugateFn) return null;

    // Try the word itself as an infinitive
    const result = conjugateFn(entry.word);
    if (result) return result;

    // Try extracting infinitive from translation
    const t = getTranslation(entry);
    const inf = extractInfinitive(t);
    if (inf) {
      const r = conjugateFn(inf);
      if (r) return r;
    }

    return null;
  };

  // Always prefer fresh dictionary lookup over cached translations
  const getTranslation = (entry: VocabEntry): string => {
    if (lookupFn) {
      const fresh = lookupFn(entry.word);
      if (fresh?.en && fresh.en !== 'see context') return fresh.en;
    }
    if (entry.translation && entry.translation !== 'see context') return entry.translation;
    return entry.translation;
  };

  // Prefer fresh POS from dictionary over stale cached value
  const getPos = (entry: VocabEntry): string | undefined => {
    if (lookupFn) {
      const fresh = lookupFn(entry.word);
      if (fresh?.pos) return fresh.pos;
    }
    return entry.pos;
  };

  const allEntries = useMemo(() => Object.values(vocabMap), [vocabMap]);

  const { mainWords, commonWords } = useMemo(() => {
    const main: VocabEntry[] = [];
    const common: VocabEntry[] = [];
    for (const entry of allEntries) {
      if (isCommonWord(entry.word, language)) {
        common.push(entry);
      } else {
        main.push(entry);
      }
    }
    return { mainWords: main, commonWords: common };
  }, [allEntries, language]);

  const sortFn = (a: VocabEntry, b: VocabEntry) => {
    if (sortMode === 'recent') {
      return b.lastSeen - a.lastSeen; // newest first
    }
    // tricky: most failed first, then most seen
    if (b.timesFailed !== a.timesFailed) return b.timesFailed - a.timesFailed;
    return b.timesSeen - a.timesSeen;
  };

  const filterFn = (entry: VocabEntry) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return entry.word.includes(q) || entry.translation.toLowerCase().includes(q);
  };

  const filteredMain = useMemo(
    () => mainWords.filter(filterFn).sort(sortFn),
    [mainWords, search, sortMode],
  );

  const filteredCommon = useMemo(
    () => commonWords.filter(filterFn).sort(sortFn),
    [commonWords, search, sortMode],
  );

  const POS_COLORS: Record<string, string> = {
    n: 'text-blue-500 bg-blue-500/10',
    v: 'text-emerald-500 bg-emerald-500/10',
    adj: 'text-purple-500 bg-purple-500/10',
    adv: 'text-amber-500 bg-amber-500/10',
    prep: 'text-rose-500 bg-rose-500/10',
    conj: 'text-gray-500 bg-gray-500/10',
    det: 'text-gray-500 bg-gray-500/10',
    pron: 'text-cyan-500 bg-cyan-500/10',
  };

  const renderEntry = (entry: VocabEntry) => {
    const isExpanded = expandedWord === entry.word;
    const pos = getPos(entry);
    const conjTable = isExpanded ? getConjugation({ ...entry, pos }) : null;
    const personLabels = PERSON_LABELS[language] || PERSON_LABELS.spanish;

    return (
      <div
        key={entry.word}
        className="border-b border-[var(--border-color)] last:border-b-0"
      >
        <div
          className="flex items-center gap-3 py-2.5 px-3 cursor-pointer hover:bg-[var(--bg-inset)] transition-colors"
          onClick={() => setExpandedWord(isExpanded ? null : entry.word)}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[var(--text-primary)] truncate">
                {entry.word}
              </span>
              {pos && (
                <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${POS_COLORS[pos] || 'text-gray-500 bg-gray-500/10'}`}>
                  {pos}
                </span>
              )}
            </div>
            {(() => {
              const t = getTranslation(entry);
              return t && t !== 'see context' ? (
                <div className="text-xs text-[var(--text-secondary)] truncate mt-0.5">
                  {t}
                </div>
              ) : null;
            })()}
            {pos === 'v' && !isExpanded && (
              <div className="text-[9px] text-emerald-500/60 font-semibold mt-0.5">
                Tap to conjugate
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 shrink-0 text-[10px] font-mono">
            <span className="text-[var(--text-muted)]">{entry.timesSeen}x</span>
            {entry.timesFailed > 0 && (
              <span className="text-red-500 font-bold">{entry.timesFailed}F</span>
            )}
            {pos === 'v' && (
              <ChevronDown size={12} className={`text-emerald-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            )}
          </div>
        </div>

        {/* Conjugation table (verbs only, when expanded) */}
        {isExpanded && conjTable && (
          <div className="px-3 pb-3 animate-fade-in">
            <div className="flex flex-wrap gap-1 mb-2">
              {Object.keys(conjTable.tenses).map(tense => (
                <button
                  key={tense}
                  onClick={() => setConjTense(tense)}
                  className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider transition-all ${
                    conjTense === tense
                      ? 'bg-blue-500/15 text-blue-500'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                  }`}
                >
                  {TENSE_LABELS[tense] || tense}
                </button>
              ))}
            </div>
            {conjTable.tenses[conjTense] && (
              <div className="space-y-1">
                {conjTable.tenses[conjTense].map((form, i) => (
                  <div key={i} className="flex items-baseline gap-2">
                    <span className="text-[10px] text-[var(--text-faint)] font-mono w-16 text-right shrink-0">
                      {personLabels[i]}
                    </span>
                    <span className="text-xs text-[var(--text-primary)] font-semibold">
                      {form}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="animate-fade-in max-w-md mx-auto px-4 pt-4 pb-20">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onBack}
          className="p-2 -ml-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1">
          <h2 className="text-lg font-extrabold text-[var(--text-primary)]">My Words</h2>
          <p className="text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-widest">
            {allEntries.length} words encountered
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" />
        <input
          type="text"
          placeholder="Search words..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-faint)] focus:outline-none focus:border-blue-500/40"
        />
      </div>

      {/* Sort toggle */}
      <div className="flex gap-1.5 mb-4">
        <button
          onClick={() => setSortMode('recent')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${
            sortMode === 'recent'
              ? 'border-blue-500/40 bg-blue-500/10 text-blue-500'
              : 'border-[var(--border-color)] text-[var(--text-muted)] hover:border-[var(--border-hover)]'
          }`}
        >
          <Clock size={11} />
          Recent
        </button>
        <button
          onClick={() => setSortMode('tricky')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${
            sortMode === 'tricky'
              ? 'border-red-500/40 bg-red-500/10 text-red-500'
              : 'border-[var(--border-color)] text-[var(--text-muted)] hover:border-[var(--border-hover)]'
          }`}
        >
          <AlertTriangle size={11} />
          Tricky
        </button>
      </div>
      {sortMode === 'tricky' && (
        <p className="text-[10px] text-[var(--text-muted)] -mt-2 mb-3 leading-relaxed">
          Sorted by most failed first — words you struggle with the most.
        </p>
      )}

      {/* Main word list */}
      {filteredMain.length === 0 && filteredCommon.length === 0 ? (
        <div className="text-center py-12 text-[var(--text-muted)]">
          <p className="text-sm">
            {search ? 'No words match your search.' : 'Study some cards to start building your word list.'}
          </p>
        </div>
      ) : (
        <>
          <div className="stat-card p-0 overflow-hidden mb-4">
            {filteredMain.map(renderEntry)}
          </div>

          {/* Common words — collapsed by default */}
          {filteredCommon.length > 0 && (
            <div className="mb-4">
              <button
                onClick={() => setShowCommon(!showCommon)}
                className="flex items-center gap-2 w-full py-2 text-[10px] font-semibold text-[var(--text-faint)] uppercase tracking-widest hover:text-[var(--text-muted)] transition-colors"
              >
                <ChevronDown size={12} className={`transition-transform ${showCommon ? 'rotate-180' : ''}`} />
                Common Words ({filteredCommon.length})
              </button>
              {showCommon && (
                <div className="stat-card p-0 overflow-hidden animate-fade-in">
                  {filteredCommon.map(renderEntry)}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default VocabList;
