import React, { useState, useMemo } from 'react';
import { ChevronLeft, Star, Trash2, Search, BookOpen, BookText } from 'lucide-react';
import { FavoriteMap, Language } from '../types';
import { saveFavorites } from '../services/storageService';

interface FavoritesListProps {
  favoritesMap: FavoriteMap;
  language: Language;
  onBack: () => void;
  onChange: (map: FavoriteMap) => void;
}

type SortMode = 'recent' | 'alpha';
type KindFilter = 'all' | 'vocab' | 'grammar' | 'etymology';

const FavoritesList: React.FC<FavoritesListProps> = ({ favoritesMap, language, onBack, onChange }) => {
  const [sort, setSort] = useState<SortMode>('recent');
  const [query, setQuery] = useState('');
  const [kindFilter, setKindFilter] = useState<KindFilter>('all');

  const allArr = useMemo(() => Object.values(favoritesMap), [favoritesMap]);

  // Count entries per kind so chips can show counts. Legacy entries (no
  // `kind` field) count as vocab.
  const kindCounts = useMemo(() => {
    const c: Record<KindFilter, number> = { all: allArr.length, vocab: 0, grammar: 0, etymology: 0 };
    for (const e of allArr) {
      const k = e.kind ?? 'vocab';
      if (k === 'vocab' || k === 'grammar' || k === 'etymology') c[k]++;
    }
    return c;
  }, [allArr]);

  const entries = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = allArr.filter(e => {
      const k = e.kind ?? 'vocab';
      if (kindFilter !== 'all' && k !== kindFilter) return false;
      if (!q) return true;
      // Search across all relevant text fields per kind
      const haystack = [
        e.word,
        e.translation,
        e.lemma,
        e.grammarTip,
        e.etymologyOrigin,
        e.etymologyNote,
        (e.etymologyCognates || []).join(' '),
      ].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(q);
    });
    return [...filtered].sort((a, b) =>
      sort === 'recent' ? b.savedAt - a.savedAt : a.word.localeCompare(b.word),
    );
  }, [allArr, sort, query, kindFilter]);

  const removeEntry = (key: string) => {
    const next = { ...favoritesMap };
    delete next[key];
    saveFavorites(next, language);
    onChange(next);
  };

  // Find the storage key for an entry — vocab uses the raw word; grammar uses
  // a __g__-prefixed normalized tip; etymology uses __e__-prefixed word. We
  // can't reverse-engineer the key from the entry alone, so look it up in the
  // map. This is O(n) per delete but n is small.
  const keyFor = (entry: typeof allArr[0]): string | null => {
    for (const [k, v] of Object.entries(favoritesMap)) {
      if (v.savedAt === entry.savedAt && v.word === entry.word) return k;
    }
    return null;
  };

  const fmtDate = (ts: number) => {
    const d = new Date(ts);
    const diffDays = Math.floor((Date.now() - ts) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={onBack}
          className="p-2 -ml-2 rounded-lg hover:bg-[var(--bg-card-hover)] active:scale-95 transition"
          aria-label="Back"
        >
          <ChevronLeft size={20} className="text-[var(--text-secondary)]" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Star size={18} className="text-yellow-400" fill="currentColor" />
            <h1 className="text-xl font-black text-[var(--text-primary)]">Favorites</h1>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            {Object.keys(favoritesMap).length} item{Object.keys(favoritesMap).length === 1 ? '' : 's'} saved
          </p>
        </div>
      </div>

      {Object.keys(favoritesMap).length === 0 ? (
        <div className="text-center py-12 text-[var(--text-muted)]">
          <Star size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No favorites yet.</p>
          <p className="text-xs mt-2 max-w-[18rem] mx-auto">
            Tap Save on any word's popup, any Grammar Tip, or any Etymology modal during study.
          </p>
        </div>
      ) : (
        <>
          {/* Search + sort controls */}
          <div className="space-y-2 mb-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search favorites…"
                className="w-full pl-9 pr-3 py-2 text-sm bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSort('recent')}
                className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition ${
                  sort === 'recent'
                    ? 'bg-[var(--accent)] text-white'
                    : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]'
                }`}
              >
                Recent
              </button>
              <button
                onClick={() => setSort('alpha')}
                className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition ${
                  sort === 'alpha'
                    ? 'bg-[var(--accent)] text-white'
                    : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]'
                }`}
              >
                A → Z
              </button>
            </div>
            {/* Kind filter chips — vocab / grammar / etymology. Replaces the
                older POS chips since the list now holds three distinct kinds
                of saved items. */}
            <div className="flex gap-1.5 overflow-x-auto -mx-4 px-4 pb-1 scrollbar-thin">
              {([
                { key: 'all', label: 'All', color: 'border-[var(--accent)]/40 bg-[var(--accent)]/10 text-[var(--accent)]' },
                { key: 'vocab', label: 'Vocab', color: 'border-blue-500/40 bg-blue-500/10 text-blue-500' },
                { key: 'grammar', label: 'Grammar', color: 'border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400' },
                { key: 'etymology', label: 'Etymology', color: 'border-violet-500/40 bg-violet-500/10 text-violet-500' },
              ] as Array<{ key: KindFilter; label: string; color: string }>).map(({ key, label, color }) => {
                const count = kindCounts[key] || 0;
                if (count === 0 && key !== 'all') return null;
                const active = kindFilter === key;
                return (
                  <button
                    key={key}
                    onClick={() => setKindFilter(key)}
                    className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all border whitespace-nowrap ${
                      active
                        ? color
                        : 'border-[var(--border-color)] text-[var(--text-muted)] hover:border-[var(--border-hover)]'
                    }`}
                  >
                    <span>{label}</span>
                    <span className={`text-[9px] font-mono ${active ? 'opacity-70' : 'opacity-50'}`}>{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* List — render by kind */}
          <div className="space-y-2">
            {entries.map(e => {
              const kind = e.kind ?? 'vocab';
              const key = keyFor(e);
              return (
                <div
                  key={`${e.word}-${e.savedAt}`}
                  className={`flex items-start gap-3 px-3 py-3 border rounded-lg ${
                    kind === 'grammar'
                      ? 'bg-amber-500/5 border-amber-500/30'
                      : kind === 'etymology'
                      ? 'bg-violet-500/5 border-violet-500/30'
                      : 'bg-[var(--bg-card)] border-[var(--border-color)]'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    {kind === 'vocab' && (
                      <>
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="font-bold text-[var(--text-primary)]">{e.word}</span>
                          {e.lemma && e.lemma.toLowerCase() !== e.word.toLowerCase() && (
                            <span className="text-xs text-[var(--text-muted)]">→ {e.lemma}</span>
                          )}
                          {e.ipa && (
                            <span className="text-xs text-blue-500 font-mono">/{e.ipa}/</span>
                          )}
                          {e.pos && (
                            <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)] bg-[var(--bg-inset)] px-1 py-0.5 rounded">
                              {e.pos}
                            </span>
                          )}
                        </div>
                        {e.translation && (
                          <div className="text-sm text-[var(--text-secondary)] mt-0.5">{e.translation}</div>
                        )}
                      </>
                    )}
                    {kind === 'grammar' && (
                      <>
                        <div className="flex items-center gap-1.5 mb-1">
                          <BookOpen size={12} className="text-amber-500" />
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Grammar tip</span>
                        </div>
                        <p className="text-sm text-[var(--text-primary)] leading-relaxed">{e.grammarTip}</p>
                      </>
                    )}
                    {kind === 'etymology' && (
                      <>
                        <div className="flex items-center gap-1.5 mb-1">
                          <BookText size={12} className="text-violet-500" />
                          <span className="text-[10px] font-bold uppercase tracking-wider text-violet-500">Etymology</span>
                        </div>
                        <div className="text-base font-black text-violet-700 dark:text-violet-200 tracking-tight">{e.word}</div>
                        {e.etymologyOrigin && (
                          <div className="text-xs font-bold text-violet-600 dark:text-violet-300 mt-0.5">{e.etymologyOrigin}</div>
                        )}
                        {e.etymologyNote && (
                          <p className="text-xs text-[var(--text-secondary)] italic mt-1 leading-relaxed">{e.etymologyNote}</p>
                        )}
                        {e.etymologyCognates && e.etymologyCognates.length > 0 && (
                          <div className="text-[11px] text-[var(--text-muted)] mt-1">
                            <span className="font-bold">Cognates: </span>{e.etymologyCognates.join(', ')}
                          </div>
                        )}
                      </>
                    )}
                    {e.example && (
                      <div className="text-[11px] text-[var(--text-muted)] italic mt-1 line-clamp-2">
                        “{e.example}”
                      </div>
                    )}
                    <div className="text-[10px] text-[var(--text-muted)] mt-1">saved {fmtDate(e.savedAt)}</div>
                  </div>
                  <button
                    onClick={() => key && removeEntry(key)}
                    className="p-1.5 rounded text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 transition"
                    aria-label="Remove from favorites"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default FavoritesList;
