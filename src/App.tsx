import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import TopicMap from './components/TopicMap';
import StudySession from './components/StudySession';
import GamificationHub from './components/GamificationHub';
import PlacementTest from './components/PlacementTest';
import ChallengeScreen from './components/ChallengeScreen';
import StreakFlame from './components/StreakFlame';
import { QuestCard, MasteryMap, SessionState, UserStats, DailyStats, Language, LearningGoal, LANGUAGE_CONFIG, GOAL_CONFIG, ProgressState, ChallengeMode, ChallengeQuestion, BossRing } from './types';
import { MAIN_PATH, isNodeUnlocked, getNodeName, getChapterForNode, chapterIndex } from './data/topicConfig';
import { handleAnswerLogic, saveCardProgress, getRetention, burySiblings, interleaveQueue } from './services/srsService';
import {
  migrateStorageKeys, loadMasteryMap, saveMasteryMap, loadUserStats, saveUserStats,
  loadDailyStats, saveDailyStats, resetAll,
  loadSettings, saveSettings,
  isPlacementComplete, setPlacementComplete, resetPlacement,
  loadProgressState, saveProgressState,
  loadVocabMap, saveVocabMap,
  loadFavorites, saveFavorites,
  getDailyLimitFor, getSessionLimitFor, setDailyLimitFor, setSessionLimitFor,
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
import { lookupWord as lookupNl } from './data/dictionary/nl';
import { lookupWord as lookupSv } from './data/dictionary/sv';
import { lookupWord as lookupCy } from './data/dictionary/cy';
import { lookupWord as lookupHi } from './data/dictionary/hi';
import { lookupWord as lookupTr } from './data/dictionary/tr';
import { lookupWord as lookupRu } from './data/dictionary/ru';
import VocabList from './components/VocabList';
import FavoritesList from './components/FavoritesList';
import ListenMode from './components/ListenMode';
import Onboarding from './components/Onboarding';
import { Settings2, Minus, Plus, X, Sun, Moon, BookOpen, Globe, Plane, Briefcase, Heart, ChevronRight, ChevronDown, Bell, BellOff, Star, PenTool, Flame, BarChart3, CheckCheck, CalendarDays, Volume2 } from 'lucide-react';
import {
  loadNotificationPrefs, saveNotificationPrefs, requestNotificationPermission,
  isNotificationSupported, onSessionComplete, initNotifications,
  shouldShowNotificationPrompt, dismissPrompt, cancelScheduledNotifications,
  type NotificationPrefs,
} from './services/notificationService';

const DICT_LOOKUP: Partial<Record<Language, (w: string) => any>> = {
  spanish: lookupEs,
  italian: lookupIt,
  french: lookupFr,
  portuguese: lookupPt,
  german: lookupDe,
  dutch: lookupNl,
  swedish: lookupSv,
  welsh: lookupCy,
  hindi: lookupHi,
  turkish: lookupTr,
  russian: lookupRu,
};

type View = 'HOME' | 'TOPICS' | 'STUDY' | 'GAMIFICATION' | 'SETTINGS' | 'PLACEMENT' | 'CHALLENGE' | 'VOCAB' | 'FAVORITES' | 'LISTEN';

// Deck loaders — static imports for available languages
// (dynamic import would be cleaner but static is simpler for Vite bundling)
import rawSpanishDeck from './data/spanish/deck.json';
import rawItalianDeck from './data/italian/deck.json';
import rawFrenchDeck from './data/french/deck.json';
import rawPortugueseDeck from './data/portuguese/deck.json';
import rawGermanDeck from './data/german/deck.json';
import rawDutchDeck from './data/dutch/deck.json';
import rawSwedishDeck from './data/swedish/deck.json';
import rawWelshDeck from './data/welsh/deck.json';
import rawHindiDeck from './data/hindi/deck.json';
import rawTurkishDeck from './data/turkish/deck.json';
import rawRussianDeck from './data/russian/deck.json';

const DECK_MAP: Partial<Record<Language, any[]>> = {
  spanish: rawSpanishDeck,
  italian: rawItalianDeck,
  french: rawFrenchDeck,
  portuguese: rawPortugueseDeck,
  german: rawGermanDeck,
  dutch: rawDutchDeck,
  swedish: rawSwedishDeck,
  welsh: rawWelshDeck,
  hindi: rawHindiDeck,
  turkish: rawTurkishDeck,
  russian: rawRussianDeck,
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

  // Difficulty-ordered single stream: sort ALL cards by priority (computed difficulty rank),
  // not grouped by grammar node. Theme filtering happens later via Vocab Focus.
  // Cards without a priority fall to the end.
  const allRawCards: any[] = [];
  for (const node of MAIN_PATH) {
    const nodeCards = nodeMap.get(node.id) || [];
    for (const c of nodeCards) {
      allRawCards.push({ ...c, _nodeTier: node.tier, _nodeId: node.id });
    }
  }
  allRawCards.sort((a: any, b: any) => {
    const pa = a.priority ?? 999999;
    const pb = b.priority ?? 999999;
    if (pa !== pb) return pa - pb;
    return String(a.id).localeCompare(String(b.id));
  });

  for (const rawCard of allRawCards) {
    const id = String(rawCard.id);
    const saved = masteryMap[id];
    cards.push({
      id,
      target: rawCard.target,
      english: rawCard.english,
      category: rawCard._nodeTier,
      topic: rawCard._nodeId,
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
      priority: rawCard.priority ?? 999999,
    });
  }

  return cards;
};

// Language-specific level names
const CHALLENGE_NAMES: Record<Language, string> = {
  spanish: 'Level',
  italian: 'Level',
  french: 'Level',
  portuguese: 'Level',
  german: 'Level',
  dutch: 'Level',
  swedish: 'Level',
  welsh: 'Level',
  hindi: 'Level',
  turkish: 'Level',
  russian: 'Level',
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
  const [favoritesMap, setFavoritesMap] = useState(() => loadFavorites(settings.selectedLanguage));
  const [tileCardIds, setTileCardIds] = useState<Set<string>>(new Set());
  const [pendingChallenge, setPendingChallenge] = useState<ChallengeMode | null>(null);
  const [challengeQuestions, setChallengeQuestions] = useState<ChallengeQuestion[]>([]);
  const [showTools, setShowTools] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [showGoalMenu, setShowGoalMenu] = useState(false);
  // Progress bento expansion state — persisted so the user's preference
  // sticks across reloads.
  const [showProgressBento, setShowProgressBento] = useState(() => {
    try { return localStorage.getItem('progress_expanded') === '1'; } catch { return false; }
  });
  const toggleProgressBento = () => {
    setShowProgressBento(prev => {
      const next = !prev;
      try { localStorage.setItem('progress_expanded', next ? '1' : '0'); } catch {}
      return next;
    });
  };
  const [showLangPicker, setShowLangPicker] = useState(() => !localStorage.getItem('quest_first_launch_done'));
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem('onboarding_complete'));
  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>(() => loadNotificationPrefs());
  const [showNotifPrompt, setShowNotifPrompt] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);
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
    setFavoritesMap(loadFavorites(lang));
  }, [lang, goal]);

  // Refresh favorites whenever user lands on the home page —
  // they may have starred new words during study/vocab views.
  useEffect(() => {
    if (view === 'HOME') {
      setFavoritesMap(loadFavorites(lang));
    }
  }, [view, lang]);

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

  // ─── Notifications: init on startup + gentle prompt check ──
  useEffect(() => {
    if (!isNotificationSupported()) return;
    const dueCount = deck.filter(c => c.mastery > 0 && c.dueDate && c.dueDate <= Date.now()).length;
    initNotifications(dueCount, userStats.streak);
    // Check if we should show the gentle prompt
    if (shouldShowNotificationPrompt()) {
      setShowNotifPrompt(true);
    }
  }, [deck.length]); // re-run once deck is loaded

  const handleToggleNotifications = async (enable: boolean) => {
    if (enable) {
      const granted = await requestNotificationPermission();
      if (!granted) return; // user denied — don't enable
      const newPrefs = { ...notifPrefs, enabled: true };
      setNotifPrefs(newPrefs);
      saveNotificationPrefs(newPrefs);
      const dueCount = deck.filter(c => c.mastery > 0 && c.dueDate && c.dueDate <= Date.now()).length;
      await initNotifications(dueCount, userStats.streak);
    } else {
      const newPrefs = { ...notifPrefs, enabled: false };
      setNotifPrefs(newPrefs);
      saveNotificationPrefs(newPrefs);
      await cancelScheduledNotifications();
    }
  };

  const handleChangeReminderTime = (time: string) => {
    const newPrefs = { ...notifPrefs, reminderTime: time };
    setNotifPrefs(newPrefs);
    saveNotificationPrefs(newPrefs);
    if (newPrefs.enabled) {
      const dueCount = deck.filter(c => c.mastery > 0 && c.dueDate && c.dueDate <= Date.now()).length;
      initNotifications(dueCount, userStats.streak);
    }
  };

  const handleStartSession = (studyMore: boolean | number = false) => {
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
    // When "Study More" is clicked, use the session card limit setting
    const sessionLimit = getSessionLimitFor(settings, lang);
    const dailyLimitRemaining = getDailyLimitFor(settings, lang) - dailyStats.newCardsCount;
    const explicitCount = typeof studyMore === 'number';
    const studyMoreCount = explicitCount ? (studyMore as number) : (studyMore ? sessionLimit : 0);
    const baseNewLimit = studyMore ? Math.max(studyMoreCount, dailyLimitRemaining) : Math.max(0, dailyLimitRemaining);
    // Cap new cards at session limit when no reviews exist — UNLESS the user
    // explicitly typed a count in the "Want more? Study X extra cards" input.
    // Previous bug: typing 20 was clipped to 10 because the cap fired anyway.
    const newLimit = (reviews.length === 0 && !explicitCount)
      ? Math.min(baseNewLimit, sessionLimit)
      : baseNewLimit;
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
      const newMap = saveCardProgress(card, lang);
      setMasteryMap(newMap);
    });

    // CRITICAL: every save below reads fresh from localStorage before mutating,
    // not from the React closure. Otherwise two rapid handleAnswer calls (user
    // rating cards faster than React re-renders) would both base their saves on
    // the stale closure value, and the second would silently erase the first's
    // increment. This is the bug behind the "morning progress disappeared" reports.

    // Daily new card tracking
    if (isNewCard && rating !== 'AGAIN') {
      const freshDaily = loadDailyStats(lang);
      const newDaily = { ...freshDaily, newCardsCount: freshDaily.newCardsCount + 1 };
      setDailyStats(newDaily);
      saveDailyStats(newDaily, lang);

      // Track cumulative new cards
      const freshProgress = loadProgressState(lang);
      const newProgress = { ...freshProgress, cumulativeNewCards: freshProgress.cumulativeNewCards + 1 };
      setProgressState(newProgress);
      saveProgressState(newProgress, lang);
    }

    // Track answer + count graduated cards (load fresh stats so concurrent
    // increments don't overwrite each other)
    const freshStats = loadUserStats(lang);
    const newStats = recordAnswer(freshStats);
    if (updatedCard.mastery === 2 && currentCard.mastery < 2) {
      newStats.cardsLearned = newStats.cardsLearned + 1;
    }
    setUserStats(newStats);
    saveUserStats(newStats, lang);

    checkAchievements(newStats, masteryMap, deck, lang);

    // Track vocabulary (also fresh-load so we don't lose words from rapid answers)
    const lookupFn = DICT_LOOKUP[lang] ?? (() => null);
    const freshVocab = loadVocabMap(lang);
    const newVocab = recordWordsFromCard(currentCard.target, freshVocab, lookupFn, rating === 'AGAIN');
    setVocabMap(newVocab);
    saveVocabMap(newVocab, lang);

    try {
      setSession(prev => ({ ...prev, ...updates }));
    } catch (e) {
      console.error('setSession failed:', e);
    }
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

  // Per-language: adjusts only the current language's override, not the global default.
  const adjustLimit = (delta: number) => {
    const current = getDailyLimitFor(settings, lang);
    const next = Math.max(1, Math.min(50, current + delta));
    handleUpdateSettings(setDailyLimitFor(settings, lang, next));
  };

  const adjustSessionLimit = (delta: number) => {
    const current = getSessionLimitFor(settings, lang);
    const next = Math.max(5, Math.min(50, current + delta));
    handleUpdateSettings(setSessionLimitFor(settings, lang, next));
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
  const dailyLeft = Math.max(0, getDailyLimitFor(settings, lang) - dailyStats.newCardsCount);
  const newAvailable = currentNode
    ? Math.min(deck.filter(c => c.topic === currentNode.id && c.mastery === 0 && !c.isSuspended).length, dailyLeft)
    : 0;
  const hasCards = reviewsDue > 0 || newAvailable > 0;

  const availableLanguages: Language[] = Object.keys(DECK_MAP) as Language[];

  // Close language dropdown when clicking outside
  useEffect(() => {
    if (!showLangDropdown) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target as Node)) {
        setShowLangDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showLangDropdown]);

  const toggleTheme = () => {
    const newTheme = settings.theme === 'dark' ? 'light' : 'dark';
    // Apply class IMMEDIATELY (before React re-render) to prevent flash
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    handleUpdateSettings({ ...settings, theme: newTheme });
  };

  return (
    <div className={`mx-auto min-h-screen ${view === 'STUDY' || view === 'PLACEMENT' || view === 'CHALLENGE' ? 'max-w-lg px-0 pt-0 pb-0' : 'max-w-md px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-20'}`}>
      {/* First-time onboarding carousel */}
      {showOnboarding && (
        <Onboarding onComplete={() => {
          localStorage.setItem('onboarding_complete', 'true');
          setShowOnboarding(false);
        }} />
      )}

      {/* First-time language selection overlay */}
      {showLangPicker && !showOnboarding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-primary)]">
          <div className="w-full max-w-sm px-6 animate-slide-up">
            <div className="text-center mb-8">
              <div className="text-5xl mb-4">
                <Globe size={48} className="mx-auto text-[var(--accent)]" />
              </div>
              <h2 className="text-2xl font-black text-[var(--text-primary)] mb-2">Choose your language</h2>
              <p className="text-sm text-[var(--text-muted)]">You can switch anytime from the header</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {availableLanguages.map(l => (
                  <button
                    key={l}
                    onClick={() => {
                      handleLanguageChange(l);
                      localStorage.setItem('quest_first_launch_done', 'true');
                      setShowLangPicker(false);
                    }}
                    className="stat-card p-4 flex items-center justify-center hover:border-[var(--accent)]/40 hover:bg-[var(--accent)]/5 transition-all active:scale-95"
                  >
                    <span className="text-sm font-bold text-[var(--text-primary)]">{LANGUAGE_CONFIG[l].name}</span>
                  </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {view === 'HOME' && (
        <section className="animate-fade-in">
          {/* Header row: title + language picker */}
          <header className="pt-3 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {/* Animated atom — in-app logo (PWA home-screen icon is separate, see public/icon.svg) */}
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
              <div className="relative" ref={langDropdownRef}>
                <button
                  onClick={() => setShowLangDropdown(prev => !prev)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold border border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--accent)]/40 hover:text-[var(--accent)] active:scale-95 transition-all"
                >
                  <span>{LANGUAGE_CONFIG[lang].name}</span>
                  <ChevronDown size={14} className={`transition-transform ${showLangDropdown ? 'rotate-180' : ''}`} />
                </button>
                {showLangDropdown && (
                  <div className="absolute right-0 top-full mt-1.5 w-56 stat-card p-2 z-40 animate-fade-in shadow-lg">
                    {availableLanguages.map(l => (
                      <button
                        key={l}
                        onClick={() => {
                          handleLanguageChange(l);
                          setShowLangDropdown(false);
                        }}
                        className={`w-full flex items-center gap-2.5 px-3.5 py-3 rounded-lg text-sm font-semibold transition-all ${
                          l === lang
                            ? 'bg-[var(--accent)]/10 text-[var(--accent)]'
                            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] active:scale-[0.98]'
                        }`}
                      >
                        <span>{LANGUAGE_CONFIG[l].name}</span>
                        {l === lang && <span className="ml-auto text-[10px] font-bold uppercase tracking-wider opacity-60">active</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Placement test CTA — compact banner, shown until completed */}
          {!isPlacementComplete(lang) && (
            <div className="stat-card px-3 py-2.5 mb-2 border-amber-500/30 flex items-center gap-2">
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
                className="shrink-0 p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-inset)] transition-all"
                aria-label="Dismiss placement test prompt"
                title="Dismiss"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Study button — primary action, generous size so it dominates the home view */}
          <button
            onClick={() => handleStartSession()}
            disabled={!hasCards}
            className="w-full py-7 btn-primary rounded-2xl text-lg mb-3"
          >
            {!hasCards ? (
              'All Caught Up'
            ) : (
              <div className="flex items-baseline justify-center gap-2.5">
                <span className="font-extrabold text-xl">Study</span>
                {reviewsDue > 0 && (
                  <>
                    <span className="text-white/40">·</span>
                    <span className="text-[13px] font-bold opacity-85">{reviewsDue} to review</span>
                  </>
                )}
              </div>
            )}
          </button>

          {/* Listen — secondary, passive listening mode. Only shown when the
              user has at least a handful of seen cards to play through. */}
          {(() => {
            const playableCount = deck.filter(c => (c.interval || 0) > 0 && !c.isSuspended).length;
            if (playableCount < 5) return null;
            return (
              <button
                onClick={() => setView('LISTEN')}
                className="w-full mb-3 -mt-1 py-2.5 flex items-center justify-center gap-2 text-[12px] font-bold text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
              >
                <Volume2 size={14} />
                <span>Or listen passively</span>
                <span className="text-[10px] opacity-60">· {playableCount} cards</span>
              </button>
            );
          })()}

          {/* Today's progress + streak — tappable to reveal Bento stats below.
              Default collapsed so the dashboard stays minimal; user opens
              the deeper stats when curious. */}
          {(() => {
            const dailyGoal = getDailyLimitFor(settings, lang);
            const dailyDone = dailyStats.newCardsCount;
            const pct = dailyGoal > 0 ? Math.min(100, Math.round((dailyDone / dailyGoal) * 100)) : 0;
            const streak = userStats.streak;
            return (
              <>
                <button
                  onClick={toggleProgressBento}
                  className="w-full stat-card px-5 py-4 mb-2 flex items-center gap-5 hover:border-[var(--border-hover)] active:scale-[0.995] transition-all text-left"
                  aria-expanded={showProgressBento}
                  aria-controls="progress-bento"
                >
                  {/* Progress bar */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between mb-2">
                      <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Today</span>
                      <span className="text-sm font-mono font-bold text-[var(--text-primary)]">
                        {dailyDone} <span className="text-[var(--text-muted)] font-normal">/ {dailyGoal}</span>
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full bg-[var(--bg-inset)] overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[var(--accent)] to-violet-400 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  {/* Streak counter */}
                  <div className="shrink-0 flex flex-col items-center gap-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Streak</span>
                    <div className="flex items-center gap-1">
                      <Flame
                        size={18}
                        className={streak > 0 ? 'text-orange-500 fill-orange-500/30' : 'text-[var(--text-faint)]'}
                      />
                      <span className={`text-lg font-black font-mono ${streak > 0 ? 'text-orange-500' : 'text-[var(--text-muted)]'}`}>
                        {streak}
                      </span>
                    </div>
                  </div>
                  {/* Expand chevron */}
                  <ChevronDown
                    size={16}
                    className={`shrink-0 text-[var(--text-muted)] transition-transform ${showProgressBento ? 'rotate-180' : ''}`}
                  />
                </button>

                {/* Bento — 4 calm stats that mean something. No XP, no badges.
                    Words = vocab breadth; Memory = long-term retention rate;
                    Learned = cards fully memorized; Days = total practice days. */}
                {showProgressBento && (() => {
                  const wordsCount = Object.keys(vocabMap).length;
                  const cardsLearned = userStats.cardsLearned;
                  const allDeckCards = deck.filter(c => !c.isSuspended);
                  const longTerm = allDeckCards.filter(c => (c.interval || 0) >= 21).length;
                  const memoryPct = allDeckCards.length > 0
                    ? Math.round((longTerm / allDeckCards.length) * 100)
                    : 0;
                  // Approximate days active: 1 + days between firstSeen and now
                  // when there's at least 1 review. Calm proxy, no streak guilt.
                  const firstReviewTs = userStats.totalReviews > 0
                    ? Math.min(...Object.values(vocabMap).map(v => v.firstSeen).filter(Boolean), Date.now())
                    : Date.now();
                  const daysActive = userStats.totalReviews > 0
                    ? Math.max(1, Math.ceil((Date.now() - firstReviewTs) / 86400000))
                    : 0;
                  return (
                    <div id="progress-bento" className="grid grid-cols-2 gap-2 mb-3 animate-fade-in">
                      <div className="stat-card p-4">
                        <BookOpen size={14} className="text-[var(--text-muted)] mb-1.5" />
                        <div className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1">Words</div>
                        <div className="text-2xl font-mono font-black text-[var(--text-primary)] leading-none">{wordsCount.toLocaleString()}</div>
                        <div className="text-[10px] text-[var(--text-muted)] mt-1 leading-tight">unique words in sentences</div>
                      </div>
                      <div className="stat-card p-4">
                        <BarChart3 size={14} className="text-[var(--text-muted)] mb-1.5" />
                        <div className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1">Memory</div>
                        <div className="text-2xl font-mono font-black text-[var(--text-primary)] leading-none">{memoryPct}%</div>
                        <div className="text-[10px] text-[var(--text-muted)] mt-1 leading-tight">long-term recall (3+ weeks)</div>
                      </div>
                      <div className="stat-card p-4">
                        <CheckCheck size={14} className="text-[var(--text-muted)] mb-1.5" />
                        <div className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1">Learned</div>
                        <div className="text-2xl font-mono font-black text-[var(--text-primary)] leading-none">{cardsLearned.toLocaleString()}</div>
                        <div className="text-[10px] text-[var(--text-muted)] mt-1 leading-tight">cards in long memory</div>
                      </div>
                      <div className="stat-card p-4">
                        <CalendarDays size={14} className="text-[var(--text-muted)] mb-1.5" />
                        <div className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1">Days</div>
                        <div className="text-2xl font-mono font-black text-[var(--text-primary)] leading-none">{daysActive}</div>
                        <div className="text-[10px] text-[var(--text-muted)] mt-1 leading-tight">days you've practiced</div>
                      </div>
                    </div>
                  );
                })()}
              </>
            );
          })()}

          {/* When caught up: explicit next-step suggestions instead of a tiny
              "or study more" link that's easy to miss. */}
          {!hasCards && (
            <div className="w-full mb-3 -mt-1 p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center gap-2 text-[12px]">
              <span className="text-[var(--text-muted)]">Want more? Study</span>
              <input
                id="study-more-count"
                type="number"
                defaultValue={10}
                min={1}
                max={100}
                className="w-14 py-1 rounded-md bg-transparent border border-[var(--border-color)] text-center text-[13px] font-semibold text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)]"
              />
              <button
                onClick={() => {
                  const input = document.getElementById('study-more-count') as HTMLInputElement;
                  const count = input ? parseInt(input.value) || 10 : 10;
                  handleStartSession(count);
                }}
                className="text-[var(--accent)] font-bold hover:underline active:scale-95 transition"
              >
                extra cards →
              </button>
            </div>
          )}

          {/* Quick-access grid: Topics + Vocabulary + Favourites — 3-col, taller cards */}
          {(() => {
            const vocabCount = Object.keys(vocabMap).length;
            const hasVocab = vocabCount > 0;
            const favCount = Object.keys(favoritesMap).length;
            const hasFav = favCount > 0;
            return (
            <div className="grid grid-cols-3 gap-2 mb-3">
              <button
                onClick={() => setView('TOPICS')}
                className="stat-card p-4 text-left transition-all hover:border-[var(--border-hover)] active:scale-[0.99] cursor-pointer flex flex-col gap-2"
              >
                <div className="w-11 h-11 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center">
                  <BookOpen size={20} className="text-[var(--accent)]" />
                </div>
                <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                  Topics
                </div>
                <div className="text-xs font-bold text-[var(--text-primary)] leading-tight">
                  Browse all
                </div>
              </button>

              <button
                onClick={() => hasVocab && setView('VOCAB')}
                disabled={!hasVocab}
                className={`stat-card p-4 text-left transition-all flex flex-col gap-2 ${
                  hasVocab
                    ? 'hover:border-[var(--border-hover)] active:scale-[0.99] cursor-pointer'
                    : 'grayscale opacity-50 cursor-default'
                }`}
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${hasVocab ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-[var(--bg-inset)] border border-[var(--border-color)]'}`}>
                  <PenTool size={20} className={hasVocab ? 'text-blue-500' : 'text-[var(--text-muted)]'} />
                </div>
                <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                  Vocab
                </div>
                <div className="text-xs font-bold text-[var(--text-primary)] leading-tight">
                  {vocabCount}
                </div>
              </button>

              <button
                onClick={() => hasFav && setView('FAVORITES')}
                disabled={!hasFav}
                className={`stat-card p-4 text-left transition-all flex flex-col gap-2 ${
                  hasFav
                    ? 'hover:border-[var(--border-hover)] active:scale-[0.99] cursor-pointer'
                    : 'grayscale opacity-50 cursor-default'
                }`}
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${hasFav ? 'bg-yellow-400/10 border border-yellow-400/30' : 'bg-[var(--bg-inset)] border border-[var(--border-color)]'}`}>
                  <Star size={20} className={hasFav ? 'text-yellow-500' : 'text-[var(--text-muted)]'} fill={hasFav ? 'currentColor' : 'none'} />
                </div>
                <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                  Favs
                </div>
                <div className="text-xs font-bold text-[var(--text-primary)] leading-tight">
                  {favCount}
                </div>
              </button>
            </div>
            );
          })()}

          {/* Focus + Settings — 2-col row, equal width, matching horizontal layouts */}
          <div className="grid grid-cols-2 gap-2 mb-3 relative">
            {(() => {
              const CurrentIcon = goal === 'general' ? Globe : goal === 'travel' ? Plane : goal === 'work' ? Briefcase : Heart;
              return (
                <button
                  onClick={() => setShowGoalMenu(prev => !prev)}
                  className="stat-card p-5 text-left transition-all hover:border-[var(--border-hover)] active:scale-[0.99] flex items-center gap-3"
                >
                  <div className="w-12 h-12 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center shrink-0">
                    <CurrentIcon size={22} className="text-[var(--accent)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-0.5">
                      Focus
                    </div>
                    <div className="text-sm font-bold text-[var(--text-primary)] leading-tight truncate">
                      {GOAL_CONFIG[goal].name}
                    </div>
                  </div>
                  <ChevronDown size={16} className={`text-[var(--text-muted)] shrink-0 transition-transform ${showGoalMenu ? 'rotate-180' : ''}`} />
                </button>
              );
            })()}
            <button
              onClick={() => setShowTools(prev => !prev)}
              className={`stat-card p-5 text-left transition-all hover:border-[var(--border-hover)] active:scale-[0.99] flex items-center gap-3 ${
                showTools ? 'border-[var(--accent)]/40 bg-[var(--accent)]/5' : ''
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-slate-500/10 border border-slate-500/20 flex items-center justify-center shrink-0">
                <Settings2 size={22} className="text-slate-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-0.5">
                  Settings
                </div>
                <div className="text-sm font-bold text-[var(--text-primary)] leading-tight truncate">
                  {getDailyLimitFor(settings, lang)} new/day
                </div>
              </div>
              <ChevronDown size={16} className={`text-[var(--text-muted)] shrink-0 transition-transform ${showTools ? 'rotate-180' : ''}`} />
            </button>
            {showGoalMenu && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setShowGoalMenu(false)} />
                <div className="absolute left-0 right-0 top-full mt-1.5 z-30 stat-card p-1.5 animate-fade-in">
                  {(['general', 'travel', 'work', 'family'] as LearningGoal[]).map(g => {
                    const cfg = GOAL_CONFIG[g];
                    const isSelected = goal === g;
                    const Icon = g === 'general' ? Globe : g === 'travel' ? Plane : g === 'work' ? Briefcase : Heart;
                    return (
                      <button
                        key={g}
                        onClick={() => { handleGoalChange(g); setShowGoalMenu(false); }}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all ${
                          isSelected
                            ? 'bg-[var(--accent)]/10 text-[var(--accent)]'
                            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-inset)]'
                        }`}
                      >
                        <Icon size={14} />
                        <div className="text-left flex-1 min-w-0">
                          <div className="text-xs font-bold">{cfg.name}</div>
                          <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
                            {g === 'general' ? 'Well-rounded vocabulary' : cfg.description}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Notification prompt (after 3rd session) */}
          {showNotifPrompt && (
            <div className="w-full mb-2 p-3 rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/5 flex items-center gap-3">
              <Bell size={18} className="text-[var(--accent)] shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[var(--text-primary)]">Enable study reminders?</p>
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Get a daily nudge so you never miss a review.</p>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button
                  onClick={async () => {
                    setShowNotifPrompt(false);
                    await handleToggleNotifications(true);
                  }}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[var(--accent)] text-white"
                >
                  Sure
                </button>
                <button
                  onClick={() => {
                    setShowNotifPrompt(false);
                    dismissPrompt();
                  }}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                >
                  Later
                </button>
              </div>
            </div>
          )}

          {showTools && (
            <div className="stat-card animate-fade-in space-y-4 mt-2 mb-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest">Settings</h3>
                <button onClick={() => setShowTools(false)} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
                  <X size={14} />
                </button>
              </div>

              <div>
                <div className="flex items-baseline justify-between mb-3">
                  <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest">New Cards / Day</div>
                  <div className="text-[9px] font-semibold text-[var(--text-muted)] tracking-wide">for {LANGUAGE_CONFIG[lang].name}</div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => adjustLimit(-5)} className="w-9 h-9 rounded-lg border border-[var(--border-color)] text-[var(--text-muted)] flex items-center justify-center hover:border-[var(--border-hover)] hover:text-[var(--text-secondary)] transition-all active:scale-95">
                    <Minus size={14} />
                  </button>
                  <button onClick={() => adjustLimit(-1)} className="w-9 h-9 rounded-lg border border-[var(--border-color)] text-[var(--text-muted)] flex items-center justify-center hover:border-[var(--border-hover)] hover:text-[var(--text-secondary)] transition-all active:scale-95 text-xs font-bold font-mono">
                    -1
                  </button>
                  <div className="flex-1 text-center">
                    <div className="text-3xl font-extrabold font-mono text-[var(--text-primary)]">{getDailyLimitFor(settings, lang)}</div>
                  </div>
                  <button onClick={() => adjustLimit(1)} className="w-9 h-9 rounded-lg border border-[var(--border-color)] text-[var(--text-muted)] flex items-center justify-center hover:border-[var(--border-hover)] hover:text-[var(--text-secondary)] transition-all active:scale-95 text-xs font-bold font-mono">
                    +1
                  </button>
                  <button onClick={() => adjustLimit(5)} className="w-9 h-9 rounded-lg border border-[var(--border-color)] text-[var(--text-muted)] flex items-center justify-center hover:border-[var(--border-hover)] hover:text-[var(--text-secondary)] transition-all active:scale-95">
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-[var(--border-color)]">
                <div className="flex items-baseline justify-between mb-3">
                  <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest">Cards per Session</div>
                  <div className="text-[9px] font-semibold text-[var(--text-muted)] tracking-wide">for {LANGUAGE_CONFIG[lang].name}</div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => adjustSessionLimit(-5)} className="w-9 h-9 rounded-lg border border-[var(--border-color)] text-[var(--text-muted)] flex items-center justify-center hover:border-[var(--border-hover)] hover:text-[var(--text-secondary)] transition-all active:scale-95">
                    <Minus size={14} />
                  </button>
                  <button onClick={() => adjustSessionLimit(-1)} className="w-9 h-9 rounded-lg border border-[var(--border-color)] text-[var(--text-muted)] flex items-center justify-center hover:border-[var(--border-hover)] hover:text-[var(--text-secondary)] transition-all active:scale-95 text-xs font-bold font-mono">
                    -1
                  </button>
                  <div className="flex-1 text-center">
                    <div className="text-3xl font-extrabold font-mono text-[var(--text-primary)]">{getSessionLimitFor(settings, lang)}</div>
                  </div>
                  <button onClick={() => adjustSessionLimit(1)} className="w-9 h-9 rounded-lg border border-[var(--border-color)] text-[var(--text-muted)] flex items-center justify-center hover:border-[var(--border-hover)] hover:text-[var(--text-secondary)] transition-all active:scale-95 text-xs font-bold font-mono">
                    +1
                  </button>
                  <button onClick={() => adjustSessionLimit(5)} className="w-9 h-9 rounded-lg border border-[var(--border-color)] text-[var(--text-muted)] flex items-center justify-center hover:border-[var(--border-hover)] hover:text-[var(--text-secondary)] transition-all active:scale-95">
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* Appearance */}
              <div className="pt-3 border-t border-[var(--border-color)] space-y-3">
                <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest">Appearance</div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--text-secondary)]">Theme</span>
                  <div className="flex gap-1">
                    {(['light', 'dark'] as const).map(t => (
                      <button
                        key={t}
                        onClick={() => handleUpdateSettings({ ...settings, theme: t })}
                        className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all border flex items-center gap-1.5 ${
                          settings.theme === t
                            ? 'border-[var(--accent)]/40 bg-[var(--accent)]/10 text-[var(--accent)]'
                            : 'border-[var(--border-color)] text-[var(--text-muted)] hover:border-[var(--border-hover)]'
                        }`}
                      >
                        {t === 'dark' ? <Moon size={11} /> : <Sun size={11} />}
                        {t}
                      </button>
                    ))}
                  </div>
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

              {/* Notification reminders */}
              {isNotificationSupported() && (
                <div className="pt-3 border-t border-[var(--border-color)] space-y-3">
                  <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest">Reminders</div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[var(--text-secondary)] flex items-center gap-1.5">
                      {notifPrefs.enabled ? <Bell size={12} /> : <BellOff size={12} />}
                      Daily reminder
                    </span>
                    <button
                      onClick={() => handleToggleNotifications(!notifPrefs.enabled)}
                      className={`w-10 h-6 rounded-full transition-all relative ${
                        notifPrefs.enabled ? 'bg-[var(--accent)]' : 'bg-[var(--border-color)]'
                      }`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${
                        notifPrefs.enabled ? 'left-5' : 'left-1'
                      }`} />
                    </button>
                  </div>
                  {notifPrefs.enabled && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[var(--text-secondary)]">Remind at</span>
                      <input
                        type="time"
                        value={notifPrefs.reminderTime}
                        onChange={(e) => handleChangeReminderTime(e.target.value)}
                        className="text-[11px] px-2 py-1 rounded-lg border border-[var(--border-color)] bg-[var(--bg-inset)] text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)]/40"
                      />
                    </div>
                  )}
                  {notifPrefs.enabled && Notification.permission === 'denied' && (
                    <p className="text-[10px] text-amber-500">
                      Notifications are blocked. Please enable them in your browser settings.
                    </p>
                  )}
                </div>
              )}

              {/* Flagged Words */}
              <div className="pt-3 border-t border-[var(--border-color)] space-y-3">
                <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest">Flagged Words</div>
                {(() => {
                  const flags = JSON.parse(localStorage.getItem('quest_flagged_words') || '[]');
                  if (flags.length === 0) {
                    return <p className="text-[11px] text-[var(--text-muted)]">No words flagged. Tap "⚑ Flag as wrong" on any word's definition popover to report it.</p>;
                  }
                  return (
                    <>
                      <p className="text-[11px] text-[var(--text-muted)]">{flags.length} word{flags.length === 1 ? '' : 's'} flagged. Copy and send to me to fix.</p>
                      <div className="max-h-40 overflow-y-auto bg-[var(--bg-inset)] rounded p-2 text-[10px] font-mono text-[var(--text-secondary)] space-y-1">
                        {flags.map((f: any, i: number) => (
                          <div key={i}>{f.language}: <span className="text-[var(--accent)]">{f.word}</span> = "{f.currentTranslation}" ({f.currentPos})</div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(JSON.stringify(flags, null, 2));
                            const btn = event?.target as HTMLElement;
                            if (btn) { btn.textContent = '✓ Copied'; setTimeout(() => { btn.textContent = 'Copy all'; }, 1500); }
                          }}
                          className="text-[10px] px-2 py-1 rounded border border-[var(--border-color)] hover:border-[var(--accent)] text-[var(--text-secondary)]"
                        >
                          Copy all
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Clear all flagged words?')) {
                              localStorage.removeItem('quest_flagged_words');
                              setShowTools(false);
                              setTimeout(() => setShowTools(true), 50);
                            }
                          }}
                          className="text-[10px] px-2 py-1 rounded border border-[var(--border-color)] hover:border-red-500 text-[var(--text-faint)]"
                        >
                          Clear
                        </button>
                      </div>
                    </>
                  );
                })()}
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
          onAbort={() => {
            setPendingChallenge(null);
            setView('HOME');
            // Schedule notification after session ends
            const dueCount = deck.filter(c => c.mastery > 0 && c.dueDate && c.dueDate <= Date.now()).length;
            onSessionComplete(dueCount, userStats.streak);
          }}
          onStudyMore={(count: number) => handleStartSession(count)}
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

      {view === 'FAVORITES' && (
        <FavoritesList
          favoritesMap={favoritesMap}
          language={lang}
          onBack={() => {
            // refresh in case user toggled favorites from another view
            setFavoritesMap(loadFavorites(lang));
            setView('HOME');
          }}
          onChange={(next) => {
            setFavoritesMap(next);
            saveFavorites(next, lang);
          }}
        />
      )}

      {view === 'LISTEN' && (
        <ListenMode
          cards={deck.filter(c => (c.interval || 0) > 0 && !c.isSuspended)}
          language={lang}
          audioSpeed={settings.audioSpeed}
          googleTtsApiKey={settings.googleTtsApiKey}
          onExit={() => setView('HOME')}
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
