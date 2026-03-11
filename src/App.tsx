import React, { useState, useEffect, useLayoutEffect } from 'react';
import TopicMap from './components/TopicMap';
import StudySession from './components/StudySession';
import GamificationHub from './components/GamificationHub';
import PlacementTest from './components/PlacementTest';
import ChallengeScreen from './components/ChallengeScreen';
import StreakFlame from './components/StreakFlame';
import { QuestCard, MasteryMap, SessionState, UserStats, DailyStats, Language, LearningGoal, LANGUAGE_CONFIG, GOAL_CONFIG, ProgressState, ChallengeMode, ChallengeQuestion, BossRing } from './types';
import { MAIN_PATH, isNodeUnlocked, getNodeName } from './data/topicConfig';
import { handleAnswerLogic, saveCardProgress, getRetention, burySiblings } from './services/srsService';
import {
  migrateStorageKeys, loadMasteryMap, loadUserStats, saveUserStats,
  loadDailyStats, saveDailyStats, resetAll,
  loadSettings, saveSettings,
  isPlacementComplete, setPlacementComplete, resetPlacement,
  loadProgressState, saveProgressState,
  loadVocabMap, saveVocabMap,
} from './services/storageService';
import type { StudySettings, AudioSpeed } from './services/storageService';
import {
  awardXP, updateStreak, checkAchievements, getAchievementsWithStatus,
  awardChallengeXP,
} from './services/gamificationService';
import {
  selectTileCandidates, buildChallengeQuestions, shouldTriggerChallenge, isRingBetter, calculateBossRing,
} from './services/challengeService';
import { recordWordsFromCard } from './services/vocabService';
import { lookupWord as lookupEs } from './data/dictionary/es';
import { lookupWord as lookupIt } from './data/dictionary/it';
import VocabList from './components/VocabList';
import { Settings2, Minus, Plus, X, Sun, Moon, Swords, BookOpen } from 'lucide-react';

const DICT_LOOKUP: Partial<Record<Language, (w: string) => any>> = {
  spanish: lookupEs,
  italian: lookupIt,
};

type View = 'HOME' | 'TOPICS' | 'STUDY' | 'GAMIFICATION' | 'SETTINGS' | 'PLACEMENT' | 'CHALLENGE' | 'VOCAB';

// Deck loaders — static imports for available languages
// (dynamic import would be cleaner but static is simpler for Vite bundling)
import rawSpanishDeck from './data/spanish/deck.json';
import rawItalianDeck from './data/italian/deck.json';

const DECK_MAP: Partial<Record<Language, any[]>> = {
  spanish: rawSpanishDeck,
  italian: rawItalianDeck,
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

  // Group cards by their grammarNode field (set by classify-grammar script)
  // Falls back to positional slicing for cards without grammarNode
  const nodeMap = new Map<string, typeof filtered>();
  for (const node of MAIN_PATH) nodeMap.set(node.id, []);

  for (const rawCard of filtered) {
    const nodeId = rawCard.grammarNode || null;
    if (nodeId && nodeMap.has(nodeId)) {
      nodeMap.get(nodeId)!.push(rawCard);
    } else {
      // Fallback: assign to first node
      nodeMap.get(MAIN_PATH[0].id)!.push(rawCard);
    }
  }

  const cards: QuestCard[] = [];

  for (const node of MAIN_PATH) {
    const nodeCards = nodeMap.get(node.id) || [];
    // Sort cards within each node by word count (shortest first)
    // so beginners get simple sentences before complex ones
    nodeCards.sort((a: any, b: any) => {
      const aWords = (a.target || '').split(/\s+/).length;
      const bWords = (b.target || '').split(/\s+/).length;
      return aWords - bWords || a.id - b.id; // tiebreak by id
    });
    for (const rawCard of nodeCards) {
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
  const [progressState, setProgressState] = useState<ProgressState>(() => loadProgressState(settings.selectedLanguage));
  const [vocabMap, setVocabMap] = useState(() => loadVocabMap(settings.selectedLanguage));
  const [tileCardIndices, setTileCardIndices] = useState<number[]>([]);
  const [pendingChallenge, setPendingChallenge] = useState<ChallengeMode | null>(null);
  const [challengeQuestions, setChallengeQuestions] = useState<ChallengeQuestion[]>([]);
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
    setProgressState(loadProgressState(lang));
    setVocabMap(loadVocabMap(lang));
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

  // Dark mode: useLayoutEffect runs synchronously before browser paint,
  // preventing the flash that useEffect causes on initial load / restore.
  useLayoutEffect(() => {
    document.documentElement.classList.toggle('dark', settings.theme === 'dark');
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

    // Select tile challenge cards (objectively graded)
    const tiles = selectTileCandidates(queue);
    setTileCardIndices(tiles);
    setPendingChallenge(null);

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

      // Track cumulative new cards for challenge triggers
      const newCumulative = progressState.cumulativeNewCards + 1;
      const trigger = shouldTriggerChallenge(progressState, newCumulative);
      if (trigger) {
        setPendingChallenge(trigger);
      }
      const newProgress = { ...progressState, cumulativeNewCards: newCumulative };
      setProgressState(newProgress);
      saveProgressState(newProgress, lang);
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

    // Track vocabulary
    const lookupFn = DICT_LOOKUP[lang] ?? (() => null);
    const newVocab = recordWordsFromCard(currentCard.target, vocabMap, lookupFn, rating === 'AGAIN');
    setVocabMap(newVocab);
    saveVocabMap(newVocab, lang);

    setSession(prev => ({ ...prev, ...updates }));
  };

  const handleStartChallenge = () => {
    if (!pendingChallenge) return;
    // Build questions from recently studied cards
    const recentCards = deck.filter(c => c.mastery >= 1 && !c.isSuspended);
    const count = pendingChallenge === 'boss' ? 8 : 4;
    const questions = buildChallengeQuestions(recentCards, count);
    if (questions.length < count) {
      // Not enough eligible cards — skip this challenge
      setPendingChallenge(null);
      return;
    }
    setChallengeQuestions(questions);
    setView('CHALLENGE');
  };

  const handleChallengeComplete = (results: boolean[], elapsedMs: number) => {
    const correctCount = results.filter(Boolean).length;
    const xpGained = awardChallengeXP(pendingChallenge || 'checkpoint', correctCount);
    const newStats = { ...userStats, xp: userStats.xp + xpGained };
    newStats.level = Math.floor(newStats.xp / 100) + 1;

    // Update boss records
    if (pendingChallenge === 'boss') {
      const ring = calculateBossRing(correctCount, results.length, elapsedMs);
      const bossIdx = progressState.nextBossIndex;
      const newProgress = { ...progressState };

      if (ring !== 'none') {
        // Boss defeated
        const existingRecord = newProgress.bossRecords.find(r => r.bossIndex === bossIdx);
        if (existingRecord) {
          if (isRingBetter(ring, existingRecord.bestRing)) {
            existingRecord.bestRing = ring;
          }
        } else {
          newProgress.bossRecords.push({
            bossIndex: bossIdx,
            bestRing: ring,
            completedAt: Date.now(),
          });
        }
        newProgress.nextBossIndex = Math.min(bossIdx + 1, 21);
        newProgress.lastBossAt = newProgress.cumulativeNewCards;
      }

      setProgressState(newProgress);
      saveProgressState(newProgress, lang);
    } else {
      // Checkpoint — just update lastCheckpointAt
      const newProgress = { ...progressState, lastCheckpointAt: progressState.cumulativeNewCards };
      setProgressState(newProgress);
      saveProgressState(newProgress, lang);
    }

    setUserStats(newStats);
    saveUserStats(newStats, lang);
    setPendingChallenge(null);
    setView('HOME');
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
    const newTheme = settings.theme === 'dark' ? 'light' : 'dark';
    // Apply class IMMEDIATELY (before React re-render) to prevent flash
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    handleUpdateSettings({ ...settings, theme: newTheme });
  };

  return (
    <div className={`mx-auto min-h-screen ${view === 'STUDY' || view === 'PLACEMENT' || view === 'CHALLENGE' ? 'max-w-lg px-0 pt-0 pb-0' : 'max-w-md p-5 pb-20'}`}>
      {view === 'HOME' && (
        <section className="animate-fade-in">
          {/* Header row: title + language + theme toggle */}
          <header className="pt-6 pb-5 flex items-center justify-between">
            <h1 className="text-4xl font-black italic tracking-tighter text-blue-500">LangLab</h1>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  const langs: Language[] = ['spanish', 'italian', 'french', 'german'];
                  const available = langs.filter(l => availableLanguages.includes(l));
                  if (available.length <= 1) return;
                  const idx = available.indexOf(lang);
                  handleLanguageChange(available[(idx + 1) % available.length]);
                }}
                className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-[var(--border-color)] text-[var(--text-muted)] hover:border-[var(--border-hover)] hover:text-[var(--text-secondary)] transition-all"
              >
                {LANGUAGE_CONFIG[lang].name}
              </button>
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                title={settings.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {settings.theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>
          </header>

          {/* Streak flame + Boss progress */}
          <button
            onClick={() => setView('GAMIFICATION')}
            className="stat-card p-4 mb-3 w-full text-left hover:border-[var(--border-hover)] active:scale-[0.99] transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between">
              {/* Streak flame */}
              <div>
                <StreakFlame streak={userStats.streak} freezes={userStats.streakFreezes ?? 0} size="lg" />
              </div>

              {/* Boss progress */}
              <div className="text-right">
                {currentNode && (
                  <div className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: currentNode.color }}>
                    {currentNode.tier} &middot; {getNodeName(currentNode.id, lang)}
                  </div>
                )}
                <div className="text-sm font-extrabold text-[var(--text-primary)] mb-0.5">
                  Boss {Math.min(progressState.nextBossIndex + 1, 22)} of 22
                </div>
                {(() => {
                  const cardsToNextBoss = 150 - (progressState.cumulativeNewCards % 150);
                  return (
                    <div className="text-[10px] text-[var(--text-muted)] font-mono font-bold">
                      Next boss in {cardsToNextBoss} cards
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Boss progress bar */}
            <div className="progress-rail mt-3">
              <div
                className="progress-fill bg-red-500"
                style={{ width: `${Math.min(((progressState.cumulativeNewCards % 150) / 150) * 100, 100)}%` }}
              />
            </div>
            <div className="text-[9px] text-[var(--text-faint)] font-bold uppercase tracking-widest text-center mt-2">
              Tap for stats &amp; boss trophies
            </div>
          </button>

          {/* Placement test CTA — shown once per language until completed */}
          {!isPlacementComplete(lang) && (
            <div className="stat-card p-4 mb-3 border-amber-500/30">
              <p className="text-sm font-bold text-[var(--text-primary)] mb-1">
                Already know some {LANGUAGE_CONFIG[lang].name}?
              </p>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-3">
                Take a 2-minute placement test to skip what you already know.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setView('PLACEMENT')}
                  className="flex-1 py-2.5 btn-primary rounded-lg text-xs"
                >
                  Take Test
                </button>
                <button
                  onClick={() => {
                    setPlacementComplete(lang);
                    setDeck(prev => [...prev]); // force re-render
                  }}
                  className="px-4 py-2.5 rounded-lg text-xs text-[var(--text-muted)] font-bold hover:text-[var(--text-secondary)] transition-colors"
                >
                  Skip
                </button>
              </div>
            </div>
          )}

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
            className="w-full stat-card p-0 overflow-hidden text-left transition-all hover:border-[var(--border-hover)] group cursor-pointer mb-4"
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

          {/* Vocab list link */}
          {Object.keys(vocabMap).length > 0 && (
            <button
              onClick={() => setView('VOCAB')}
              className="w-full stat-card p-0 overflow-hidden text-left transition-all hover:border-[var(--border-hover)] group cursor-pointer mb-4"
            >
              <div className="p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-widest group-hover:text-[var(--text-secondary)] transition-colors">
                  <BookOpen size={14} />
                  <span>My Words ({Object.keys(vocabMap).length})</span>
                  <span className="transition-transform group-hover:translate-x-1">&rarr;</span>
                </div>
              </div>
            </button>
          )}

          {/* Goal selection */}
          <div className="space-y-3 mb-4">
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
                ? 'Well-rounded vocabulary'
                : `${GOAL_CONFIG[goal].description}`}
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

              <div className="pt-2 border-t border-[var(--border-color)] space-y-2">
                {isPlacementComplete(lang) && (
                  <button
                    onClick={() => {
                      resetPlacement(lang);
                      setDeck(prev => [...prev]); // force re-render
                    }}
                    className="block text-[10px] text-[var(--text-faint)] hover:text-amber-400 transition-colors"
                  >
                    Reset placement test
                  </button>
                )}
                <button
                  onClick={() => { resetAll(); window.location.reload(); }}
                  className="block text-[10px] text-[var(--text-faint)] hover:text-red-400 transition-colors"
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
          language={lang}
          onBack={() => setView('HOME')}
        />
      )}

      {view === 'STUDY' && (
        <StudySession
          session={session}
          onAnswer={handleAnswer}
          onAbort={() => { setPendingChallenge(null); setView('HOME'); }}
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
          tileCardIndices={tileCardIndices}
          pendingChallenge={pendingChallenge}
          onStartChallenge={handleStartChallenge}
        />
      )}

      {view === 'CHALLENGE' && (
        <ChallengeScreen
          mode={pendingChallenge || 'checkpoint'}
          questions={challengeQuestions}
          bossIndex={progressState.nextBossIndex}
          onComplete={handleChallengeComplete}
          onAbort={() => { setPendingChallenge(null); setView('HOME'); }}
          language={lang}
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
          bossRecords={progressState.bossRecords}
          nextBossIndex={progressState.nextBossIndex}
          language={lang}
        />
      )}

      {view === 'VOCAB' && (
        <VocabList
          vocabMap={vocabMap}
          language={lang}
          onBack={() => setView('HOME')}
        />
      )}

      {view === 'PLACEMENT' && (
        <PlacementTest
          deck={deck}
          lang={lang}
          userStats={userStats}
          masteryMap={masteryMap}
          onComplete={(newMasteryMap, newUserStats) => {
            setMasteryMap(newMasteryMap);
            setUserStats(newUserStats);
            setView('HOME');
          }}
          onSkip={() => {
            setPlacementComplete(lang);
            setView('HOME');
          }}
          autoPlayAudio={settings.autoPlayAudio}
          audioSpeed={settings.audioSpeed}
          googleTtsApiKey={settings.googleTtsApiKey}
        />
      )}

    </div>
  );
};

export default App;
