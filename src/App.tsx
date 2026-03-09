import React, { useState, useEffect } from 'react';
import TopicMap from './components/TopicMap';
import StudySession from './components/StudySession';
import GamificationHub from './components/GamificationHub';
import { QuestCard, MasteryMap, SessionState, UserStats, DailyStats, Language, LearningGoal, LANGUAGE_CONFIG, GOAL_CONFIG } from './types';
import { MAIN_PATH, isNodeUnlocked } from './data/topicConfig';
import { handleAnswerLogic, saveCardProgress, getRetention, burySiblings } from './services/srsService';
import {
  migrateStorageKeys, loadMasteryMap, loadUserStats, saveUserStats,
  loadDailyStats, saveDailyStats, resetAll,
  loadSettings, saveSettings,
} from './services/storageService';
import type { StudySettings, AudioSpeed } from './services/storageService';
import {
  awardXP, updateStreak, checkAchievements, getAchievementsWithStatus,
} from './services/gamificationService';
import { Settings2, Minus, Plus, X, Sun, Moon, Volume2, VolumeX, Zap } from 'lucide-react';

type View = 'HOME' | 'TOPICS' | 'STUDY' | 'GAMIFICATION' | 'SETTINGS';

// Deck loaders — static imports for available languages
// (dynamic import would be cleaner but static is simpler for Vite bundling)
import rawSpanishDeck from './data/spanish/deck.json';

const DECK_MAP: Partial<Record<Language, any[]>> = {
  spanish: rawSpanishDeck,
};

// Transform raw deck.json cards into QuestCards mapped to linear path nodes
// Now with dynamic slicing based on filtered card count
const buildDeck = (
  raw: any[],
  masteryMap: MasteryMap,
  goal: LearningGoal
): QuestCard[] => {
  const sorted = [...raw].sort((a: any, b: any) => a.id - b.id);

  // Filter by goal tags (all goals filter by their tag, including general)
  const filtered = sorted.filter((card: any) => {
    const tags: string[] = card.tags || [];
    return tags.includes(goal);
  });

  // Dynamic node slicing: distribute cards evenly across 20 nodes
  const perNode = Math.ceil(filtered.length / MAIN_PATH.length);
  const cards: QuestCard[] = [];

  for (let i = 0; i < MAIN_PATH.length; i++) {
    const node = MAIN_PATH[i];
    const start = i * perNode;
    const end = Math.min(start + perNode, filtered.length);
    const slice = filtered.slice(start, end);

    for (const rawCard of slice) {
      const id = String(rawCard.id);
      const saved = masteryMap[id];
      cards.push({
        id,
        target: rawCard.target,
        english: rawCard.english,
        category: node.tier,
        topic: node.id,
        audio: rawCard.audio || '',
        grammar: rawCard.grammar || undefined,
        tags: rawCard.tags || ['general'],
        mastery: (saved?.mastery as number) ?? 0,
        step: (saved?.step as number) ?? 0,
        dueDate: (saved?.dueDate as number) ?? undefined,
        interval: (saved?.interval as number) ?? 0,
        ease: (saved?.ease as number) ?? 2.5,
        failCount: (saved?.failCount as number) ?? 0,
        isLeech: (saved?.isLeech as boolean) ?? false,
        isSuspended: (saved?.isSuspended as boolean) ?? false,
      });
    }
  }

  return cards;
};

// Find the current frontier node (first incomplete unlocked node)
const getCurrentNode = (deck: QuestCard[]) => {
  for (let i = 0; i < MAIN_PATH.length; i++) {
    if (!isNodeUnlocked(i, deck)) continue;
    const node = MAIN_PATH[i];
    const nodeCards = deck.filter(c => c.topic === node.id);
    const graduated = nodeCards.filter(c => c.mastery === 2).length;
    if (nodeCards.length === 0 || graduated < nodeCards.length) return node;
  }
  return MAIN_PATH[MAIN_PATH.length - 1];
};

const App: React.FC = () => {
  const [view, setView] = useState<View>('HOME');
  const [deck, setDeck] = useState<QuestCard[]>([]);
  const [masteryMap, setMasteryMap] = useState<MasteryMap>({});
  const [settings, setSettings] = useState<StudySettings>(() => {
    migrateStorageKeys(); // one-time migration of old keys
    return loadSettings();
  });
  const [userStats, setUserStats] = useState<UserStats>(() => loadUserStats(settings.selectedLanguage));
  const [dailyStats, setDailyStats] = useState<DailyStats>(() => loadDailyStats(settings.selectedLanguage));
  const [showTools, setShowTools] = useState(false);
  const [bonusCards, setBonusCards] = useState(5);
  const [session, setSession] = useState<SessionState>({
    language: settings.selectedLanguage,
    topic: '',
    queue: [],
    currentIndex: 0,
    isFlipped: false,
    finishedCount: 0,
    newCardsSeen: 0,
  });

  const lang = settings.selectedLanguage;
  const goal = settings.learningGoal;

  // Load deck when language or goal changes
  useEffect(() => {
    const rawDeck = DECK_MAP[lang];
    if (!rawDeck) return;
    const map = loadMasteryMap(lang);
    setMasteryMap(map);
    setDeck(buildDeck(rawDeck, map, goal));
    setUserStats(loadUserStats(lang));
    setDailyStats(loadDailyStats(lang));
  }, [lang, goal]);

  // Re-merge deck when masteryMap changes
  useEffect(() => {
    if (deck.length > 0) {
      setDeck(prev =>
        prev.map(c => {
          const saved = masteryMap[c.id];
          return saved
            ? {
                ...c,
                mastery: (saved.mastery as number) ?? c.mastery,
                step: (saved.step as number) ?? c.step,
                dueDate: (saved.dueDate as number) ?? c.dueDate,
                interval: (saved.interval as number) ?? c.interval,
                ease: (saved.ease as number) ?? c.ease,
                failCount: (saved.failCount as number) ?? c.failCount,
                isLeech: (saved.isLeech as boolean) ?? c.isLeech,
                isSuspended: (saved.isSuspended as boolean) ?? c.isSuspended,
              }
            : c;
        })
      );
    }
  }, [masteryMap]);

  // Dark mode effect
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', settings.theme === 'dark');
  }, [settings.theme]);

  const handleStartSession = (studyMore = false) => {
    const now = Date.now();
    const currentNode = getCurrentNode(deck);

    // Reviews: from ALL unlocked nodes, excluding suspended cards
    const allUnlockedCards = deck.filter(c => {
      if (c.isSuspended) return false;
      const nodeIdx = MAIN_PATH.findIndex(n => n.id === c.topic);
      return nodeIdx >= 0 && isNodeUnlocked(nodeIdx, deck);
    });
    const reviews = allUnlockedCards.filter(
      c => c.mastery > 0 && (c.dueDate ? c.dueDate <= now : true)
    );

    // New cards: from the current frontier node, excluding suspended
    // When "Study More" is clicked, always add at least 10 new cards
    const dailyLimitRemaining = settings.dailyNewLimit - dailyStats.newCardsCount;
    const newLimit = studyMore ? Math.max(10, dailyLimitRemaining) : Math.max(0, dailyLimitRemaining);
    const nodeCards = deck.filter(c => c.topic === currentNode.id && !c.isSuspended);
    const newCards = nodeCards
      .filter(c => c.mastery === 0)
      .slice(0, newLimit);

    if (reviews.length === 0 && newCards.length === 0) return;

    // Update streak on session start
    const updatedStats = updateStreak(userStats);
    setUserStats(updatedStats);
    saveUserStats(updatedStats, lang);

    // Apply sibling burying to the queue
    const queue = burySiblings(
      [...reviews, ...newCards].map(c => ({ ...c, step: c.step || 0 }))
    );

    setSession({
      language: lang,
      topic: currentNode.id,
      queue,
      currentIndex: 0,
      isFlipped: false,
      finishedCount: 0,
      newCardsSeen: 0,
    });
    setView('STUDY');
  };

  const handleAnswer = (rating: 'AGAIN' | 'HARD' | 'GOOD' | 'EASY') => {
    const currentCard = session.queue[session.currentIndex];
    const isNewCard = currentCard.mastery === 0;

    const updates = handleAnswerLogic(rating, currentCard, session, (card) => {
      const newMap = saveCardProgress(card, masteryMap, lang);
      setMasteryMap(newMap);
    });

    // Daily new card tracking
    if (isNewCard && rating !== 'AGAIN') {
      const newDaily = { ...dailyStats, newCardsCount: dailyStats.newCardsCount + 1 };
      setDailyStats(newDaily);
      saveDailyStats(newDaily, lang);
    }

    // XP and gamification
    const { stats: newStats, xpGained, leveledUp } = awardXP(rating, userStats);

    // Count graduated cards
    const updatedCard = updates.queue?.[updates.queue.length - 1] || currentCard;
    if (updatedCard.mastery === 2 && currentCard.mastery < 2) {
      newStats.cardsLearned = newStats.cardsLearned + 1;
    }

    setUserStats(newStats);
    saveUserStats(newStats, lang);

    checkAchievements(newStats, masteryMap, deck, lang);

    setSession(prev => ({ ...prev, ...updates }));
  };

  const handleUpdateSettings = (newSettings: StudySettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleLanguageChange = (newLang: Language) => {
    handleUpdateSettings({ ...settings, selectedLanguage: newLang });
  };

  const handleGoalChange = (newGoal: LearningGoal) => {
    handleUpdateSettings({ ...settings, learningGoal: newGoal });
  };

  const adjustLimit = (delta: number) => {
    const next = Math.max(1, Math.min(50, settings.dailyNewLimit + delta));
    handleUpdateSettings({ ...settings, dailyNewLimit: next });
  };

  // Computed stats
  const getTotalProgress = () => {
    if (deck.length === 0) return 0;
    return Math.round((deck.filter(c => c.mastery === 2).length / deck.length) * 100);
  };

  const getTotalRetention = () => getRetention(deck);

  const currentNode = deck.length > 0 ? getCurrentNode(deck) : null;

  const now = Date.now();
  const allUnlockedCards = deck.filter(c => {
    if (c.isSuspended) return false;
    const nodeIdx = MAIN_PATH.findIndex(n => n.id === c.topic);
    return nodeIdx >= 0 && isNodeUnlocked(nodeIdx, deck);
  });
  const reviewsDue = allUnlockedCards.filter(
    c => c.mastery > 0 && (c.dueDate ? c.dueDate <= now : true)
  ).length;
  const dailyLeft = Math.max(0, settings.dailyNewLimit - dailyStats.newCardsCount);
  const newAvailable = currentNode
    ? Math.min(deck.filter(c => c.topic === currentNode.id && c.mastery === 0 && !c.isSuspended).length, dailyLeft)
    : 0;
  const hasCards = reviewsDue > 0 || newAvailable > 0;

  const availableLanguages: Language[] = Object.keys(DECK_MAP) as Language[];

  const toggleTheme = () => {
    handleUpdateSettings({ ...settings, theme: settings.theme === 'dark' ? 'light' : 'dark' });
  };

  return (
    <div className={`max-w-md mx-auto min-h-screen ${view === 'STUDY' ? 'px-3 pt-0 pb-0' : 'p-5 pb-20'}`}>
      {view === 'HOME' && (
        <section className="animate-fade-in">
          {/* Header row: title + theme toggle */}
          <header className="pt-6 pb-5 flex items-center justify-between">
            <h1 className="text-4xl font-black italic tracking-tighter text-blue-500">LangLab</h1>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
              title={settings.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {settings.theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </header>

          {/* Study section — the main action */}
          {currentNode && (() => {
            const nodeTotal = deck.filter(c => c.topic === currentNode.id).length;
            const nodeGraduated = deck.filter(c => c.topic === currentNode.id && c.mastery === 2).length;
            const nodePercent = nodeTotal > 0 ? Math.round((nodeGraduated / nodeTotal) * 100) : 0;
            return (
              <div className="stat-card p-4 mb-3">
                <div className="flex items-center justify-between mb-2.5">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-widest mb-0.5" style={{ color: currentNode.color }}>
                      {currentNode.tier}
                    </div>
                    <div className="text-sm font-extrabold text-[var(--text-primary)]">{currentNode.name}</div>
                  </div>
                  <button
                    onClick={() => setView('GAMIFICATION')}
                    className="flex items-center gap-1.5 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                  >
                    <Zap size={12} className="text-amber-500 fill-amber-500" />
                    <span className="text-[10px] font-bold font-mono">{userStats.streak}d</span>
                  </button>
                </div>
                <div className="progress-rail">
                  <div className="progress-fill" style={{ width: `${nodePercent}%`, background: currentNode.color }} />
                </div>
              </div>
            );
          })()}

          {/* Stats + Study */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className={`stat-card text-center py-3 ${reviewsDue > 0 ? 'border-orange-400/40' : ''}`}>
              <div className={`text-lg font-extrabold font-mono ${reviewsDue > 0 ? 'text-orange-500' : 'text-[var(--text-muted)]'}`}>{reviewsDue}</div>
              <div className="text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-wider">Due</div>
            </div>
            <div className="stat-card text-center py-3 border-blue-400/40">
              <div className="text-lg font-extrabold font-mono text-blue-500">{newAvailable}</div>
              <div className="text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-wider">New</div>
            </div>
          </div>

          <button
            onClick={() => handleStartSession()}
            disabled={!hasCards}
            className="w-full py-5 btn-primary rounded-xl text-base mb-3"
          >
            {!hasCards ? 'All Caught Up' : 'Study'}
          </button>

          {/* Add more cards when caught up */}
          {!hasCards && (
            <div className="flex items-center gap-2 mb-3 -mt-1">
              <button
                onClick={() => setBonusCards(prev => Math.max(1, prev - 5))}
                className="w-10 h-10 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)] font-bold text-sm hover:border-[var(--border-hover)] hover:text-[var(--text-secondary)] active:scale-95 transition-all flex items-center justify-center"
              >
                &minus;
              </button>
              <button
                onClick={() => {
                  handleUpdateSettings({ ...settings, dailyNewLimit: settings.dailyNewLimit + bonusCards });
                }}
                className="flex-1 py-3 rounded-xl bg-[var(--bg-card)] border border-blue-500/30 text-blue-500 text-xs font-bold hover:bg-blue-500/10 active:bg-blue-500/20 transition-colors"
              >
                + {bonusCards} More Cards
              </button>
              <button
                onClick={() => setBonusCards(prev => Math.min(50, prev + 5))}
                className="w-10 h-10 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)] font-bold text-sm hover:border-[var(--border-hover)] hover:text-[var(--text-secondary)] active:scale-95 transition-all flex items-center justify-center"
              >
                +
              </button>
            </div>
          )}

          {/* Progress map link */}
          <button
            onClick={() => setView('TOPICS')}
            className="w-full stat-card p-0 overflow-hidden text-left transition-all hover:border-[var(--border-hover)] group cursor-pointer mb-6"
          >
            <div className="h-1 bg-[var(--progress-bg)]">
              <div className="h-full bg-blue-500 transition-all" style={{ width: `${getTotalProgress()}%` }} />
            </div>
            <div className="p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-widest group-hover:text-[var(--text-secondary)] transition-colors">
                <span>Progress Map</span>
                <span className="transition-transform group-hover:translate-x-1">&rarr;</span>
              </div>
            </div>
          </button>

          {/* Language + Goal selection — less prominent, below the fold */}
          <div className="space-y-3 mb-4">
            <div className="flex gap-1.5">
              {(['spanish', 'italian', 'french', 'german'] as Language[]).map(l => {
                const cfg = LANGUAGE_CONFIG[l];
                const isAvailable = availableLanguages.includes(l);
                const isSelected = lang === l;
                return (
                  <button
                    key={l}
                    onClick={() => isAvailable && handleLanguageChange(l)}
                    disabled={!isAvailable}
                    className={`flex-1 py-2 rounded-lg text-center transition-all border ${
                      isSelected
                        ? 'border-blue-500/40 bg-blue-500/10 text-blue-500'
                        : isAvailable
                          ? 'border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--border-hover)]'
                          : 'border-[var(--border-color)] text-[var(--text-faint)] cursor-not-allowed'
                    }`}
                  >
                    <div className="text-[11px] font-bold uppercase tracking-wider">{cfg.name}</div>
                  </button>
                );
              })}
            </div>
            <div className="flex gap-1.5">
              {(['general', 'travel', 'work', 'family'] as LearningGoal[]).map(g => {
                const cfg = GOAL_CONFIG[g];
                const isSelected = goal === g;
                return (
                  <button
                    key={g}
                    onClick={() => handleGoalChange(g)}
                    className={`flex-1 py-2 rounded-lg text-center transition-all border ${
                      isSelected
                        ? 'border-blue-500/40 bg-blue-500/10 text-blue-500'
                        : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--border-hover)]'
                    }`}
                  >
                    <div className="text-[11px] font-bold uppercase tracking-wider">{cfg.name}</div>
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-[var(--text-faint)] text-center leading-relaxed">
              {goal === 'general'
                ? `${deck.length.toLocaleString()} cards — well-rounded vocabulary`
                : `${deck.length.toLocaleString()} cards — ${GOAL_CONFIG[goal].name.toLowerCase()}-focused with shared foundations`}
            </p>
          </div>

          {/* Settings — gear icon expandable */}
          <div className="flex justify-center">
            <button
              onClick={() => setShowTools(prev => !prev)}
              className={`p-2 rounded-lg transition-all ${
                showTools
                  ? 'text-blue-400 bg-blue-500/10'
                  : 'text-[var(--text-faint)] hover:text-[var(--text-muted)]'
              }`}
            >
              <Settings2 size={16} />
            </button>
          </div>

          {showTools && (
            <div className="stat-card animate-fade-in space-y-4 mt-2 mb-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest">Settings</h3>
                <button onClick={() => setShowTools(false)} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
                  <X size={14} />
                </button>
              </div>

              <div>
                <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-3">New Cards / Day</div>
                <div className="flex items-center gap-3">
                  <button onClick={() => adjustLimit(-5)} className="w-9 h-9 rounded-lg border border-[var(--border-color)] text-[var(--text-muted)] flex items-center justify-center hover:border-[var(--border-hover)] hover:text-[var(--text-secondary)] transition-all active:scale-95">
                    <Minus size={14} />
                  </button>
                  <button onClick={() => adjustLimit(-1)} className="w-9 h-9 rounded-lg border border-[var(--border-color)] text-[var(--text-muted)] flex items-center justify-center hover:border-[var(--border-hover)] hover:text-[var(--text-secondary)] transition-all active:scale-95 text-xs font-bold font-mono">
                    -1
                  </button>
                  <div className="flex-1 text-center">
                    <div className="text-3xl font-extrabold font-mono text-[var(--text-primary)]">{settings.dailyNewLimit}</div>
                  </div>
                  <button onClick={() => adjustLimit(1)} className="w-9 h-9 rounded-lg border border-[var(--border-color)] text-[var(--text-muted)] flex items-center justify-center hover:border-[var(--border-hover)] hover:text-[var(--text-secondary)] transition-all active:scale-95 text-xs font-bold font-mono">
                    +1
                  </button>
                  <button onClick={() => adjustLimit(5)} className="w-9 h-9 rounded-lg border border-[var(--border-color)] text-[var(--text-muted)] flex items-center justify-center hover:border-[var(--border-hover)] hover:text-[var(--text-secondary)] transition-all active:scale-95">
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* Audio settings */}
              <div className="pt-3 border-t border-[var(--border-color)] space-y-3">
                <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest">Audio</div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--text-secondary)]">Auto-play</span>
                  <button
                    onClick={() => handleUpdateSettings({ ...settings, autoPlayAudio: !settings.autoPlayAudio })}
                    className={`w-10 h-6 rounded-full transition-all relative ${
                      settings.autoPlayAudio ? 'bg-blue-500' : 'bg-[var(--border-color)]'
                    }`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${
                      settings.autoPlayAudio ? 'left-5' : 'left-1'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--text-secondary)]">Speed</span>
                  <div className="flex gap-1">
                    {([0.6, 0.8, 1.0] as AudioSpeed[]).map(s => (
                      <button
                        key={s}
                        onClick={() => handleUpdateSettings({ ...settings, audioSpeed: s })}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold font-mono transition-all border ${
                          settings.audioSpeed === s
                            ? 'border-blue-500/40 bg-blue-500/10 text-blue-500'
                            : 'border-[var(--border-color)] text-[var(--text-muted)] hover:border-[var(--border-hover)]'
                        }`}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-[var(--text-secondary)]">Google TTS</span>
                    {settings.googleTtsApiKey ? (
                      <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Active</span>
                    ) : (
                      <span className="text-[10px] font-bold text-[var(--text-faint)] uppercase tracking-wider">Browser TTS</span>
                    )}
                  </div>
                  <input
                    type="password"
                    placeholder="API key (optional)"
                    value={settings.googleTtsApiKey || ''}
                    onChange={(e) => handleUpdateSettings({ ...settings, googleTtsApiKey: e.target.value || undefined })}
                    className="w-full text-[11px] px-2.5 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-inset)] text-[var(--text-secondary)] placeholder:text-[var(--text-faint)] focus:outline-none focus:border-blue-500/40"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-[var(--border-color)]">
                <button
                  onClick={() => { resetAll(); window.location.reload(); }}
                  className="text-[10px] text-[var(--text-faint)] hover:text-red-400 transition-colors"
                >
                  Reset all data
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {view === 'TOPICS' && (
        <TopicMap
          cards={deck}
          onBack={() => setView('HOME')}
        />
      )}

      {view === 'STUDY' && (
        <StudySession
          session={session}
          onAnswer={handleAnswer}
          onAbort={() => setView('HOME')}
          onStudyMore={() => handleStartSession(true)}
          hasMoreCards={(() => {
            const now = Date.now();
            const currentNode = getCurrentNode(deck);
            const allUnlockedCards = deck.filter(c => {
              if (c.isSuspended) return false;
              const nodeIdx = MAIN_PATH.findIndex(n => n.id === c.topic);
              return nodeIdx >= 0 && isNodeUnlocked(nodeIdx, deck);
            });
            const reviews = allUnlockedCards.filter(
              c => c.mastery > 0 && (c.dueDate ? c.dueDate <= now : true)
            );
            const dailyLimitRemaining = settings.dailyNewLimit - dailyStats.newCardsCount;
            const nodeCards = deck.filter(c => c.topic === currentNode.id && !c.isSuspended);
            const newCards = nodeCards.filter(c => c.mastery === 0).slice(0, Math.max(0, dailyLimitRemaining));
            return reviews.length > 0 || newCards.length > 0;
          })()}
          topicCards={deck.filter(c => c.topic === session.topic)}
          autoPlayAudio={settings.autoPlayAudio}
          audioSpeed={settings.audioSpeed}
          googleTtsApiKey={settings.googleTtsApiKey}
        />
      )}

      {view === 'GAMIFICATION' && (
        <GamificationHub
          stats={userStats}
          achievements={getAchievementsWithStatus(userStats, masteryMap, deck, lang)}
          retention={getTotalRetention()}
          onBack={() => setView('HOME')}
        />
      )}

    </div>
  );
};

export default App;
