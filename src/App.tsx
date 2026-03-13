import React, { useState, useEffect, useLayoutEffect } from 'react';
import TopicMap from './components/TopicMap';
import StudySession from './components/StudySession';
import GamificationHub from './components/GamificationHub';
import PlacementTest from './components/PlacementTest';
import ChallengeScreen from './components/ChallengeScreen';
import StreakFlame from './components/StreakFlame';
import { QuestCard, MasteryMap, SessionState, UserStats, DailyStats, Language, LearningGoal, LANGUAGE_CONFIG, GOAL_CONFIG, ProgressState, ChallengeMode, ChallengeQuestion, BossRing } from './types';
import { MAIN_PATH, isNodeUnlocked, getNodeName } from './data/topicConfig';
import { handleAnswerLogic, saveCardProgress, getRetention, burySiblings, interleaveQueue } from './services/srsService';
import {
  migrateStorageKeys, loadMasteryMap, saveMasteryMap, loadUserStats, saveUserStats,
  loadDailyStats, saveDailyStats, resetAll,
  loadSettings, saveSettings,
  isPlacementComplete, setPlacementComplete, resetPlacement,
  loadProgressState, saveProgressState,
  loadVocabMap, saveVocabMap,
} from './services/storageService';
import type { StudySettings, AudioSpeed } from './services/storageService';
import {
  recordAnswer, updateStreak, checkAchievements, getAchievementsWithStatus,
} from './services/gamificationService';
import {
  selectTileCandidates, buildChallengeQuestions, shouldTriggerChallenge, isRingBetter, calculateBossRing, TOTAL_BOSSES,
} from './services/challengeService';
import { recordWordsFromCard } from './services/vocabService';
import { lookupWord as lookupEs } from './data/dictionary/es';
import { lookupWord as lookupIt } from './data/dictionary/it';
import { lookupWord as lookupFr } from './data/dictionary/fr';
import { lookupWord as lookupPt } from './data/dictionary/pt';
import { lookupWord as lookupDe } from './data/dictionary/de';
import VocabList from './components/VocabList';
import { Settings2, Minus, Plus, X, Sun, Moon, BookOpen, Globe, Plane, Briefcase, Heart, ChevronRight } from 'lucide-react';

const DICT_LOOKUP: Partial<Record<Language, (w: string) => any>> = {
  spanish: lookupEs,
  italian: lookupIt,
  french: lookupFr,
  portuguese: lookupPt,
  german: lookupDe,
};

type View = 'HOME' | 'TOPICS' | 'STUDY' | 'GAMIFICATION' | 'SETTINGS' | 'PLACEMENT' | 'CHALLENGE' | 'VOCAB';

// Deck loaders — static imports for available languages
// (dynamic import would be cleaner but static is simpler for Vite bundling)
import rawSpanishDeck from './data/spanish/deck.json';
import rawItalianDeck from './data/italian/deck.json';
import rawFrenchDeck from './data/french/deck.json';
import rawPortugueseDeck from './data/portuguese/deck.json';
import rawGermanDeck from './data/german/deck.json';

const DECK_MAP: Partial<Record<Language, any[]>> = {
  spanish: rawSpanishDeck,
  italian: rawItalianDeck,
  french: rawFrenchDeck,
  portuguese: rawPortugueseDeck,
  german: rawGermanDeck,
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
  const [tileCardIds, setTileCardIds] = useState<Set<string>>(new Set());
  const [pendingChallenge, setPendingChallenge] = useState<ChallengeMode | null>(null);
  const [challengeQuestions, setChallengeQuestions] = useState<ChallengeQuestion[]>([]);
  const [showTools, setShowTools] = useState(false);
  // Undo stack for going back to previous cards
  const [answerHistory, setAnswerHistory] = useState<Array<{
    session: SessionState;
    masteryMap: MasteryMap;
    userStats: UserStats;
  }>>([]);
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
    const baseNewLimit = studyMore ? Math.max(10, dailyLimitRemaining) : Math.max(0, dailyLimitRemaining);
    // Cap new cards at 10 when no reviews exist (prevents flooding after focus switch)
    const newLimit = reviews.length === 0 ? Math.min(baseNewLimit, 10) : baseNewLimit;
    const nodeCards = deck.filter(c => c.topic === currentNode.id && !c.isSuspended);
    const newCards = nodeCards
      .filter(c => c.mastery === 0)
      .slice(0, newLimit);

    if (reviews.length === 0 && newCards.length === 0) return;

    // Update streak on session start
    const updatedStats = updateStreak(userStats);
    setUserStats(updatedStats);
    saveUserStats(updatedStats, lang);

    // Interleave new cards among reviews, then bury siblings
    const interleaved = interleaveQueue(reviews, newCards);
    const queue = burySiblings(
      interleaved.map(c => ({ ...c, step: c.step || 0 }))
    );

    // Select tile challenge cards by ID (indices shift during mini-loops)
    const tileIndices = selectTileCandidates(queue);
    setTileCardIds(new Set(tileIndices.map(i => queue[i].id)));
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
    setAnswerHistory([]);
    setView('STUDY');
  };

  const handleAnswer = (rating: 'AGAIN' | 'HARD' | 'GOOD' | 'EASY') => {
    // Save snapshot for undo (limit to 20 entries)
    setAnswerHistory(prev => [...prev.slice(-19), {
      session: { ...session },
      masteryMap: { ...masteryMap },
      userStats: { ...userStats },
    }]);

    const currentCard = session.queue[session.currentIndex];
    const isNewCard = currentCard.mastery === 0;

    const { sessionUpdates: updates, updatedCard } = handleAnswerLogic(rating, currentCard, session, (card) => {
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

    // Track answer + count graduated cards
    const newStats = recordAnswer(userStats);
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

  const handleUndoAnswer = () => {
    if (answerHistory.length === 0) return;
    const prev = answerHistory[answerHistory.length - 1];
    setSession(prev.session);
    setMasteryMap(prev.masteryMap);
    saveMasteryMap(prev.masteryMap, lang);
    setUserStats(prev.userStats);
    saveUserStats(prev.userStats, lang);
    setAnswerHistory(h => h.slice(0, -1));
  };

  const handleStartChallenge = () => {
    if (!pendingChallenge) return;
    // Build questions from recently studied cards
    const recentCards = deck.filter(c => c.mastery >= 1 && !c.isSuspended);
    const count = pendingChallenge === 'boss' ? 8 : 4;
    const questions = buildChallengeQuestions(recentCards, count);
    if (questions.length === 0) {
      // Truly no eligible cards — go home
      setPendingChallenge(null);
      setView('HOME');
      return;
    }
    setChallengeQuestions(questions);
    setView('CHALLENGE');
  };

  const handleChallengeComplete = (results: boolean[], elapsedMs: number) => {
    const correctCount = results.filter(Boolean).length;
    const newStats = { ...userStats };

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
    <div className={`mx-auto min-h-screen ${view === 'STUDY' || view === 'PLACEMENT' || view === 'CHALLENGE' ? 'max-w-lg px-0 pt-0 pb-0' : 'max-w-md px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-20'}`}>
      {view === 'HOME' && (
        <section className="animate-fade-in">
          {/* Header row: title + language + theme toggle */}
          <header className="pt-6 pb-5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {/* Atom icon */}
              <svg viewBox="-2 -2 36 36" className="w-11 h-11 text-[var(--accent)]" fill="none" overflow="visible">
                {/* Orbit paths (using <path> so animateMotion works) */}
                <path id="orb1" d="M2,16 A14,5 0 1,0 30,16 A14,5 0 1,0 2,16" stroke="currentColor" strokeWidth="1.2" opacity="0.5" />
                <g transform="rotate(60 16 16)">
                  <path id="orb2" d="M2,16 A14,5 0 1,0 30,16 A14,5 0 1,0 2,16" stroke="currentColor" strokeWidth="1.2" opacity="0.5" />
                </g>
                <path d="M2,16 A14,5 0 1,0 30,16 A14,5 0 1,0 2,16" stroke="currentColor" strokeWidth="1.2" opacity="0.5" transform="rotate(120 16 16)" />
                {/* Electrons orbiting along paths */}
                <circle r="1.3" fill="currentColor">
                  <animateMotion dur="3s" repeatCount="indefinite"><mpath href="#orb1" /></animateMotion>
                </circle>
                <g transform="rotate(60 16 16)">
                  <circle r="1.3" fill="currentColor">
                    <animateMotion dur="4s" repeatCount="indefinite"><mpath href="#orb2" /></animateMotion>
                  </circle>
                </g>
                {/* Nucleus */}
                <circle cx="16" cy="16" r="2.5" fill="currentColor">
                  <animate attributeName="r" values="2.5;3;2.5" dur="2s" repeatCount="indefinite" />
                </circle>
              </svg>
              <h1 className="text-2xl font-black tracking-[0.2em] uppercase text-[var(--accent)]" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                LANGLAB
              </h1>
            </div>
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

          {/* Combined stats + progress card */}
          <div className="stat-card p-4 mb-3">
            <div className="flex items-center justify-between">
              {/* Streak flame */}
              <div>
                <StreakFlame streak={userStats.streak} freezes={userStats.streakFreezes ?? 0} size="lg" />
              </div>

              {/* Experiment + current topic */}
              <div className="text-right">
                {currentNode && (
                  <div className="text-[10px] font-semibold uppercase tracking-widest mb-1 text-[var(--text-secondary)]">
                    {currentNode.tier} &middot; {getNodeName(currentNode.id, lang)}
                  </div>
                )}
                <div className="text-sm font-extrabold text-[var(--text-primary)]">
                  Experiment {Math.min(progressState.nextBossIndex + 1, TOTAL_BOSSES)} of {TOTAL_BOSSES}
                </div>
              </div>
            </div>

            {/* Boss progress bar */}
            <div className="progress-rail mt-3">
              <div
                className="progress-fill bg-[var(--accent)]"
                style={{ width: `${Math.min(((progressState.cumulativeNewCards % 150) / 150) * 100, 100)}%` }}
              />
            </div>

            {/* Two navigation links */}
            <div className="grid grid-cols-2 gap-2 mt-2.5">
              <button
                onClick={() => setView('GAMIFICATION')}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest text-[var(--accent)] border border-[var(--accent)]/30 bg-[var(--accent)]/5 hover:bg-[var(--accent)]/10 active:scale-95 transition-all"
              >
                <span>Stats</span>
                <ChevronRight size={11} />
              </button>
              <button
                onClick={() => setView('TOPICS')}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest text-[var(--accent)] border border-[var(--accent)]/30 bg-[var(--accent)]/5 hover:bg-[var(--accent)]/10 active:scale-95 transition-all"
              >
                <span>Map</span>
                <span className="opacity-50">&middot;</span>
                <span>{getTotalProgress()}%</span>
                <ChevronRight size={11} />
              </button>
            </div>
          </div>

          {/* Placement test CTA — compact banner, shown until completed */}
          {!isPlacementComplete(lang) && (
            <div className="stat-card px-3 py-2.5 mb-3 border-amber-500/30 flex items-center gap-3">
              <p className="flex-1 text-xs text-[var(--text-secondary)] leading-snug">
                Know some {LANGUAGE_CONFIG[lang].name}? <span className="text-[var(--text-muted)]">Skip ahead with a 2-min test.</span>
              </p>
              <button
                onClick={() => setView('PLACEMENT')}
                className="shrink-0 px-3.5 py-1.5 btn-primary rounded-lg text-[10px]"
              >
                Test
              </button>
              <button
                onClick={() => {
                  setPlacementComplete(lang);
                  setDeck(prev => [...prev]);
                }}
                className="shrink-0 text-[10px] text-[var(--text-muted)] font-bold hover:text-[var(--text-secondary)] transition-colors"
              >
                Skip
              </button>
            </div>
          )}

          {/* Category focus — prominent selector */}
          <div className="mb-3">
            <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-2">Vocab Focus</div>
            <div className="grid grid-cols-4 gap-1.5">
              {(['general', 'travel', 'work', 'family'] as LearningGoal[]).map(g => {
                const cfg = GOAL_CONFIG[g];
                const isSelected = goal === g;
                const Icon = g === 'general' ? Globe : g === 'travel' ? Plane : g === 'work' ? Briefcase : Heart;
                return (
                  <button
                    key={g}
                    onClick={() => handleGoalChange(g)}
                    className={`flex flex-col items-center gap-1 py-2.5 rounded-xl transition-all border ${
                      isSelected
                        ? 'border-[var(--accent)]/40 bg-[var(--accent)]/10 text-[var(--accent)]'
                        : 'border-[var(--border-color)] text-[var(--text-muted)] hover:border-[var(--border-hover)] hover:text-[var(--text-secondary)]'
                    }`}
                  >
                    <Icon size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">{cfg.name}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-[var(--text-muted)] font-medium text-center mt-1.5">
              {goal === 'general' ? 'Well-rounded vocabulary' : GOAL_CONFIG[goal].description}
            </p>
          </div>

          {/* Study button with counts on the right */}
          <button
            onClick={() => handleStartSession()}
            disabled={!hasCards}
            className="w-full py-4 btn-primary rounded-xl text-base mb-3"
          >
            {!hasCards ? (
              'All Caught Up'
            ) : (
              <div className="flex items-center justify-center gap-3">
                <span className="font-extrabold text-base">Study</span>
                <span className="text-white/40">·</span>
                <div className="flex items-center gap-2 text-[11px] font-bold opacity-85">
                  {reviewsDue > 0 && (
                    <span>{reviewsDue} due</span>
                  )}
                  {reviewsDue > 0 && newAvailable > 0 && (
                    <span className="text-white/40">+</span>
                  )}
                  {newAvailable > 0 && (
                    <span>{newAvailable} new</span>
                  )}
                </div>
              </div>
            )}
          </button>

          {/* Study more when caught up — starts a new session without changing daily limit */}
          {!hasCards && (
            <button
              onClick={() => handleStartSession(true)}
              className="w-full py-3 rounded-xl bg-[var(--bg-card)] border border-[var(--accent)]/30 text-[var(--accent)] text-sm font-bold hover:bg-[var(--accent)]/10 active:bg-[var(--accent)]/20 transition-colors mb-3 -mt-1"
            >
              Study More Cards
            </button>
          )}

          {/* Vocab list button */}
          {Object.keys(vocabMap).length > 0 && (
            <button
              onClick={() => setView('VOCAB')}
              className="stat-card p-3.5 mb-3 w-full text-left transition-all hover:border-[var(--border-hover)] active:scale-[0.99] group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="shrink-0 w-10 h-10 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center">
                  <BookOpen size={18} className="text-[var(--accent)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-0.5">
                    Vocabulary
                  </div>
                  <div className="text-sm font-bold text-[var(--text-primary)]">
                    {Object.keys(vocabMap).length} words seen
                  </div>
                </div>
                <ChevronRight size={14} className="text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-all group-hover:translate-x-0.5" />
              </div>
            </button>
          )}

          {/* Settings — gear icon expandable */}
          <div className="flex justify-center">
            <button
              onClick={() => setShowTools(prev => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-[10px] font-semibold uppercase tracking-widest ${
                showTools
                  ? 'text-[var(--accent)] bg-[var(--accent)]/10'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
            >
              <Settings2 size={13} />
              <span>Settings</span>
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
                      settings.autoPlayAudio ? 'bg-[var(--accent)]' : 'bg-[var(--border-color)]'
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
                            ? 'border-[var(--accent)]/40 bg-[var(--accent)]/10 text-[var(--accent)]'
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
                    className="w-full text-[11px] px-2.5 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-inset)] text-[var(--text-secondary)] placeholder:text-[var(--text-faint)] focus:outline-none focus:border-[var(--accent)]/40"
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
          onUndoAnswer={handleUndoAnswer}
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
          tileCardIds={tileCardIds}
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
          lookupFn={DICT_LOOKUP[lang] ?? undefined}
        />
      )}

      {view === 'PLACEMENT' && (
        <PlacementTest
          deck={deck}
          lang={lang}
          userStats={userStats}
          masteryMap={masteryMap}
          onComplete={(newMasteryMap, newUserStats, fastTrackedCount) => {
            setMasteryMap(newMasteryMap);
            setUserStats(newUserStats);
            // Bump cumulative new cards so bosses become available to fight
            if (fastTrackedCount > 0) {
              const newProgress = { ...progressState, cumulativeNewCards: progressState.cumulativeNewCards + fastTrackedCount };
              setProgressState(newProgress);
              saveProgressState(newProgress, lang);
            }
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
