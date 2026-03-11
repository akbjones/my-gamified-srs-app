import React, { useState, useMemo } from 'react';
import { VocabMap, VocabEntry, Language } from '../types';
import { isCommonWord } from '../services/vocabService';
import { ChevronLeft, Search, Clock, AlertTriangle, ChevronDown } from 'lucide-react';

type SortMode = 'recent' | 'tricky';

interface VocabListProps {
  vocabMap: VocabMap;
  language: Language;
  onBack: () => void;
}

const VocabList: React.FC<VocabListProps> = ({ vocabMap, language, onBack }) => {
  const [search, setSearch] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('recent');
  const [showCommon, setShowCommon] = useState(false);

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

  const renderEntry = (entry: VocabEntry) => (
    <div
      key={entry.word}
      className="flex items-center gap-3 py-2.5 px-3 border-b border-[var(--border-color)] last:border-b-0"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-[var(--text-primary)] truncate">
            {entry.word}
          </span>
          {entry.pos && (
            <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${POS_COLORS[entry.pos] || 'text-gray-500 bg-gray-500/10'}`}>
              {entry.pos}
            </span>
          )}
        </div>
        {entry.translation && (
          <div className="text-xs text-[var(--text-secondary)] truncate mt-0.5">
            {entry.translation}
          </div>
        )}
      </div>
      <div className="flex items-center gap-3 shrink-0 text-[10px] font-mono">
        <span className="text-[var(--text-muted)]">{entry.timesSeen}x</span>
        {entry.timesFailed > 0 && (
          <span className="text-red-500 font-bold">{entry.timesFailed}F</span>
        )}
      </div>
    </div>
  );

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
