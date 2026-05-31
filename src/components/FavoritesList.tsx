import React, { useState, useMemo } from 'react';
import { ChevronLeft, Star, Trash2, Search } from 'lucide-react';
import { FavoriteMap, Language } from '../types';
import { saveFavorites } from '../services/storageService';

interface FavoritesListProps {
  favoritesMap: FavoriteMap;
  language: Language;
  onBack: () => void;
  onChange: (map: FavoriteMap) => void;
}

type SortMode = 'recent' | 'alpha';

const FavoritesList: React.FC<FavoritesListProps> = ({ favoritesMap, language, onBack, onChange }) => {
  const [sort, setSort] = useState<SortMode>('recent');
  const [query, setQuery] = useState('');

  const entries = useMemo(() => {
    const arr = Object.values(favoritesMap);
    const q = query.trim().toLowerCase();
    const filtered = q
      ? arr.filter(e =>
          e.word.includes(q) ||
          (e.translation || '').toLowerCase().includes(q) ||
          (e.lemma || '').toLowerCase().includes(q),
        )
      : arr;
    return [...filtered].sort((a, b) =>
      sort === 'recent' ? b.savedAt - a.savedAt : a.word.localeCompare(b.word),
    );
  }, [favoritesMap, sort, query]);

  const removeWord = (word: string) => {
    const next = { ...favoritesMap };
    delete next[word];
    saveFavorites(next, language);
    onChange(next);
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
            <h1 className="text-xl font-black text-[var(--text-primary)]">Favourites</h1>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            {Object.keys(favoritesMap).length} word{Object.keys(favoritesMap).length === 1 ? '' : 's'} saved
          </p>
        </div>
      </div>

      {Object.keys(favoritesMap).length === 0 ? (
        <div className="text-center py-12 text-[var(--text-muted)]">
          <Star size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No favourites yet.</p>
          <p className="text-xs mt-2 max-w-[18rem] mx-auto">
            Tap any word during study, then click the ⭐ in the popup to save it here.
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
                placeholder="Search favourites…"
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
          </div>

          {/* List */}
          <div className="space-y-1.5">
            {entries.map(e => (
              <div
                key={e.word}
                className="flex items-start gap-3 px-3 py-2.5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg"
              >
                <div className="flex-1 min-w-0">
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
                  <div className="text-sm text-[var(--text-secondary)] mt-0.5">{e.translation}</div>
                  {e.example && (
                    <div className="text-[11px] text-[var(--text-muted)] italic mt-0.5 line-clamp-2">
                      “{e.example}”
                    </div>
                  )}
                  <div className="text-[10px] text-[var(--text-muted)] mt-1">saved {fmtDate(e.savedAt)}</div>
                </div>
                <button
                  onClick={() => removeWord(e.word)}
                  className="p-1.5 rounded text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 transition"
                  aria-label="Remove from favourites"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default FavoritesList;
