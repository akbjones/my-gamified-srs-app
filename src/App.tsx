import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import TopicMap from './components/TopicMap';
import StudySession from './components/StudySession';
import AddMoreCardsPanel from './components/AddMoreCardsPanel';
import GamificationHub from './components/GamificationHub';
import PlacementTest from './components/PlacementTest';
import ChallengeScreen from './components/ChallengeScreen';
import StreakFlame from './components/StreakFlame';
import SyncSettings from './components/SyncSettings';
import CheckInScreen from './components/CheckInScreen';
import ScriptTeacher from './components/ScriptTeacher';
import { QuestCard, MasteryMap, SessionState, UserStats, DailyStats, Language, LearningGoal, LANGUAGE_CONFIG, GOAL_CONFIG, ProgressState, ChallengeMode, ChallengeQuestion, BossRing } from './types';
import { MAIN_PATH, isNodeUnlocked, getNodeName, getChapterForNode, chapterIndex } from './data/topicConfig';
import { handleAnswerLogic, saveCardProgress, getRetention, burySiblings, isCardDue } from './services/srsService';
import { preloadCardAudio } from './services/audioService';
import {
  migrateStorageKeys, loadMasteryMap, saveMasteryMap, loadUserStats, saveUserStats,
  loadDailyStats, saveDailyStats, resetAll, loadScriptMap,
  exportAllProgress, importAllProgress,
  loadSettings, saveSettings,
  isPlacementComplete, setPlacementComplete,
  isPlacementTaken, isCheckinDone, setCheckinDone,
  loadProgressState, saveProgressState,
  loadVocabMap, saveVocabMap,
  loadFavorites, saveFavorites,
  getDailyLimitFor, getSessionLimitFor, setDailyLimitFor, setSessionLimitFor,
  getGoalFor, setGoalFor,
} from './services/storageService';
import type { StudySettings, AudioSpeed } from './services/storageService';
import { initSync, onSynced, onReset as syncOnReset, isSyncConfigured, getCode as getSyncCode } from './services/syncService';
import { scriptPackFor } from './data/scripts';
import type { ScriptPack } from './data/scripts/types';
import { scriptSummary } from './services/scriptSrsService';
import {
  recordAnswer, updateStreak, checkAchievements, getAchievementsWithStatus,
} from './services/gamificationService';
import {
  buildChallengeQuestions, shouldTriggerChallenge, isRingBetter, calculateBossRing, TOTAL_BOSSES,
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
import { lookupWord as lookupJa } from './data/dictionary/ja';
import VocabList from './components/VocabList';
import FavoritesList from './components/FavoritesList';
import ListenMode from './components/ListenMode';
import Onboarding from './components/Onboarding';
import { Cloud, Settings2, Minus, Plus, X, Sun, Moon, BookOpen, Globe, Plane, Briefcase, Heart, ChevronRight, ChevronDown, Bell, BellOff, Star, PenTool, Flame, BarChart3, CheckCheck, CalendarDays, Volume2, Library as LibraryIcon, Milestone } from 'lucide-react';
import {
  loadNotificationPrefs, saveNotificationPrefs, requestNotificationPermission,
  isNotificationSupported, onSessionComplete, initNotifications,
  shouldShowNotificationPrompt, dismissPrompt, cancelScheduledNotifications,
  type NotificationPrefs,
} from './services/notificationService';
import {
  trackAppOpened, maybeSendExistingProgressSnapshot,
  trackLanguageSelected, trackDeckSelected,
  trackReviewSessionStarted, trackReviewSessionCompleted, recordSessionAnswer,
} from './services/analyticsService';

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
  japanese: lookupJa,
};

type View = 'HOME' | 'TOPICS' | 'STUDY' | 'GAMIFICATION' | 'SETTINGS' | 'PLACEMENT' | 'CHALLENGE' | 'VOCAB' | 'FAVORITES' | 'LISTEN' | 'CHECKIN' | 'SCRIPT';

// Deck loaders – DYNAMIC imports so each language's deck.json is its own chunk,
// fetched on demand. Keeps the main bundle small (~1 MB vs ~5 MB) and only pulls
// the deck a visitor actually studies – a big first-load + per-visit egress win.
// Chunks are named `deck-<lang>` (see vite.config.ts manualChunks) and are
// runtime-cached by the service worker, not precached.
const DECK_LOADERS: Record<Language, () => Promise<any[]>> = {
  spanish: () => import('./data/spanish/deck.json').then(m => m.default),
  italian: () => import('./data/italian/deck.json').then(m => m.default),
  french: () => import('./data/french/deck.json').then(m => m.default),
  portuguese: () => import('./data/portuguese/deck.json').then(m => m.default),
  german: () => import('./data/german/deck.json').then(m => m.default),
  dutch: () => import('./data/dutch/deck.json').then(m => m.default),
  swedish: () => import('./data/swedish/deck.json').then(m => m.default),
  welsh: () => import('./data/welsh/deck.json').then(m => m.default),
  hindi: () => import('./data/hindi/deck.json').then(m => m.default),
  turkish: () => import('./data/turkish/deck.json').then(m => m.default),
  russian: () => import('./data/russian/deck.json').then(m => m.default),
  indonesian: () => import('./data/indonesian/deck.json').then(m => m.default),
  greek: () => import('./data/greek/deck.json').then(m => m.default),
  korean: () => import('./data/korean/deck.json').then(m => m.default),
  japanese: () => import('./data/japanese/deck.json').then(m => m.default),
};

// Languages registered in the platform (Language union, registry, audio)
// but deliberately absent from the picker until they reach 3,933-card
// parity. Japanese is reachable only via its ?starter=ja link.
const HIDDEN_UNTIL_PARITY: readonly Language[] = ['japanese'];

// ── Locked shareable starter mode ────────────────────────────────
// Opening the app with ?starter=es boots straight into the curated
// 300-card Spanish starter deck and locks the app to it – the language
// switcher is disabled so a visitor can ONLY use the Spanish starter.
// Same deploy, auto-updates via the starter manifest. Add more starters
// here by mapping their code → deck.
const STARTER_PARAM = typeof window !== 'undefined'
  ? new URLSearchParams(window.location.search).get('starter')
  : null;
// Starter decks are lazy too – the curated Spanish starter (and the Spanish
// deck it hydrates from) only load when the app is in ?starter= mode.
const STARTER_LOADERS: Partial<Record<Language, () => Promise<any[]>>> = {
  spanish: () => import('./data/starterDecks').then(m => m.SPANISH_STARTER),
  // Japanese: the whole deck IS the starter (300 graded cards at launch);
  // manifest-hydrated so parity expansion needs zero rework.
  japanese: () => import('./data/japaneseStarter').then(m => m.JAPANESE_STARTER),
};
const STARTER_LANG_BY_CODE: Record<string, Language> = { es: 'spanish', ja: 'japanese' };
const STARTER_LOCK: Language | null =
  STARTER_PARAM && STARTER_LANG_BY_CODE[STARTER_PARAM] ? STARTER_LANG_BY_CODE[STARTER_PARAM] : null;

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
      tokens: rawCard.tokens || undefined,
      tags: rawCard.tags || ['general'],
      mastery: (saved?.mastery as number) ?? 0,
      step: (saved?.step as number) ?? 0,
      dueDate: (saved?.dueDate as number) ?? undefined,
      interval: (saved?.interval as number) ?? 0,
      ease: (saved?.ease as number) ?? 2.5,
      failCount: (saved?.failCount as number) ?? 0,
      isLeech: (saved?.isLeech as boolean) ?? false,
      isSuspended: (saved?.isSuspended as boolean) ?? false,
      // FSRS memory state (undefined for cards not yet reviewed under FSRS –
      // the engine then migrates them from interval/ease on first review).
      stability: (saved?.stability as number) ?? undefined,
      difficulty: (saved?.difficulty as number) ?? undefined,
      fsrsState: (saved?.fsrsState as number) ?? undefined,
      reps: (saved?.reps as number) ?? undefined,
      lapses: (saved?.lapses as number) ?? undefined,
      lastReview: (saved?.lastReview as number) ?? undefined,
      learningStep: (saved?.learningStep as number) ?? undefined,
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
  indonesian: 'Level',
  greek: 'Level',
  korean: 'Level',
  japanese: 'Level',
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
  // One-shot toast shown on HOME after placement test completes. Auto-dismisses.
  const [placementToast, setPlacementToast] = useState<string | null>(null);
  const [settings, setSettings] = useState<StudySettings>(() => {
    migrateStorageKeys(); // one-time migration of old keys
    const loaded = loadSettings();
    // Locked starter link forces the language regardless of saved settings.
    return STARTER_LOCK ? { ...loaded, selectedLanguage: STARTER_LOCK } : loaded;
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
  // Pressing Study when new cards would join the queue asks first — a session
  // should never silently grow by the whole remaining daily allowance.
  const [studyConfirm, setStudyConfirm] = useState(false);
  const [showGoalMenu, setShowGoalMenu] = useState(false);
  const [showLibraryMenu, setShowLibraryMenu] = useState(false);
  const [showLangPicker, setShowLangPicker] = useState(() => !STARTER_LOCK && !localStorage.getItem('quest_first_launch_done'));
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem('onboarding_complete'));
  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>(() => loadNotificationPrefs());
  const [showNotifPrompt, setShowNotifPrompt] = useState(false);
  // One-time sync-discoverability nudge (task: sync is invisible unless the
  // user wanders into Settings). Shown once, only to users with meaningful
  // progress to protect; 'Later' dismisses forever (device-local flag).
  const [showSyncNudge, setShowSyncNudge] = useState(false);
  // Rating tally for the session in progress – evidence for the one-shot
  // difficulty check-in screen (CHECKIN view).
  const [sessionTally, setSessionTally] = useState({ noIdea: 0, hard: 0, good: 0, easy: 0 });
  // Script teacher (alphabet mode) – the pack lazy-loads for languages that
  // have one; progress is its own storage track (quest_script_<lang>).
  const [scriptPack, setScriptPack] = useState<ScriptPack | null>(null);
  const [scriptProgress, setScriptProgress] = useState<MasteryMap>({});
  const langDropdownRef = useRef<HTMLDivElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);
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
  // In locked starter mode force the 'general' goal so all 300 curated
  // cards show (they all carry the 'general' tag) and the goal switcher
  // can't strand the learner on an empty filtered deck.
  const goal = STARTER_LOCK ? 'general' : getGoalFor(settings, lang);

  // Cross-device sync: wire background pull/push to the app lifecycle. When a
  // background pull brings in newer progress from another device, rehydrate by
  // reloading – but never mid-session (the guard reads the view via a ref so it
  // stays fresh inside the once-registered listener). No-ops unless sync is on.
  const viewRef = useRef(view);
  viewRef.current = view;
  useEffect(() => {
    initSync();
    return onSynced(() => {
      const v = viewRef.current;
      if (v === 'STUDY' || v === 'CHALLENGE' || v === 'PLACEMENT' || v === 'LISTEN' || v === 'SCRIPT') return;
      window.location.reload();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load deck when language or goal changes. Decks are code-split, so the load
  // is async; a `cancelled` guard drops a stale result if the user switches
  // language before the previous deck chunk resolves.
  useEffect(() => {
    let cancelled = false;
    const loadRaw = STARTER_LOCK ? STARTER_LOADERS[lang] : DECK_LOADERS[lang];
    if (!loadRaw) return;
    // Drop the previous language's cards immediately. If the new deck chunk
    // can't load (offline + never downloaded), the old language's sentences
    // must not keep rendering under the new language's label.
    setDeck([]);
    setSession(prev => prev.language === lang && prev.queue.length === 0 ? prev : {
      language: lang, topic: '', queue: [], currentIndex: 0, isFlipped: false, finishedCount: 0, newCardsSeen: 0,
    });
    loadRaw().then(rawDeck => {
      if (cancelled || !rawDeck) return;
      const map = loadMasteryMap(lang);
      setMasteryMap(map);
      setDeck(buildDeck(rawDeck, map, goal));
      setUserStats(loadUserStats(lang));
      setDailyStats(loadDailyStats(lang));
      setProgressState(loadProgressState(lang));
      setVocabMap(loadVocabMap(lang));
      setFavoritesMap(loadFavorites(lang));
    }).catch(() => { /* deck chunk failed to load – leave deck empty; UI stays on home */ });
    return () => { cancelled = true; };
  }, [lang, goal]);

  // Script teacher: load this language's pack (tiny lazy chunk) + progress.
  // Languages without a pack simply never render the banner or SCRIPT view.
  useEffect(() => {
    let cancelled = false;
    setScriptPack(null);
    setScriptProgress(loadScriptMap(lang));
    // Starter-lock no longer suppresses packs: the Japanese starter SHIPS
    // with the kana teacher ("learn the script first" is the point of the
    // link). Languages without a pack (Spanish starter) are unaffected.
    const ref = scriptPackFor(lang);
    if (!ref) return;
    ref.loader()
      .then(p => { if (!cancelled) setScriptPack(p); })
      .catch(() => { /* pack chunk failed – entry points just don't render */ });
    return () => { cancelled = true; };
  }, [lang]);

  // Auto-dismiss the placement toast after 6s. Click to dismiss earlier.
  useEffect(() => {
    if (!placementToast) return;
    const t = setTimeout(() => setPlacementToast(null), 6000);
    return () => clearTimeout(t);
  }, [placementToast]);

  // Refresh favorites whenever user lands on the home page –
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

  // ─── Analytics: app_opened + one-time retroactive snapshot ──
  // Both are no-ops when VITE_POSTHOG_KEY is unset or the user opted out.
  useEffect(() => {
    trackAppOpened();
    maybeSendExistingProgressSnapshot();
  }, []);

  // Analytics: fire review_session_completed once the queue is exhausted
  // (the "Session Complete!" screen). Aborting mid-session never emits it.
  useEffect(() => {
    if (view === 'STUDY' && session.queue.length > 0 && session.currentIndex >= session.queue.length) {
      trackReviewSessionCompleted();
    }
  }, [view, session.currentIndex, session.queue.length]);

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

  // Sync nudge trigger: sync backend configured, not already paired, never
  // dismissed, real progress on this device (>=20 reviews), not a locked
  // starter demo. Delay a beat so it never slams the first paint, and skip
  // the session entirely if the notification prompt already claimed it.
  const notifClaimedSessionRef = useRef(false);
  if (showNotifPrompt) notifClaimedSessionRef.current = true;
  useEffect(() => {
    if (STARTER_LOCK || !isSyncConfigured() || getSyncCode()) return;
    if (localStorage.getItem('quest_sync_nudge_done')) return;
    if (userStats.totalReviews < 20) return;
    if (notifClaimedSessionRef.current) return; // notif prompt owns this session; nudge waits for the next visit
    const t = window.setTimeout(() => setShowSyncNudge(true), 1500);
    return () => window.clearTimeout(t);
  }, [userStats.totalReviews, showNotifPrompt]);

  const handleToggleNotifications = async (enable: boolean) => {
    if (enable) {
      const granted = await requestNotificationPermission();
      if (!granted) return; // user denied – don't enable
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

  // `newFromNode` keeps an explicit count sourced from the CURRENT node (the
  // graded progression) instead of the whole unlocked pool — that pool is only
  // for the "add bonus cards" panels.
  const handleStartSession = (studyMore: boolean | number = false, newFromNode = false) => {
    setSessionTally({ noIdea: 0, hard: 0, good: 0, easy: 0 });
    const now = Date.now();
    const currentNode = getCurrentNode(deck);

    // Reviews: from ALL unlocked nodes, excluding suspended cards
    const allUnlockedCards = deck.filter(c => {
      if (c.isSuspended) return false;
      const nodeIdx = MAIN_PATH.findIndex(n => n.id === c.topic);
      return nodeIdx >= 0 && isNodeUnlocked(nodeIdx, deck);
    });
    const reviews = allUnlockedCards.filter(
      c => c.mastery > 0 && isCardDue(c, now)
    );

    // New cards come from the current frontier node (graded progression).
    // Model A: a normal Study press = due reviews + the WHOLE remaining daily
    // new-card allowance in one go (no per-session sub-cap, no prompt). An
    // explicit numeric count (the "add more" panels) means EXACTLY that many –
    // including 0 – and is allowed to exceed the daily allowance.
    const dailyLimitRemaining = getDailyLimitFor(settings, lang) - dailyStats.newCardsCount;
    const explicitCount = typeof studyMore === 'number';
    const newLimit = explicitCount
      ? (studyMore as number)
      : Math.max(0, dailyLimitRemaining);
    // Source pool for new cards: stay inside the current topic for normal
    // sessions, but expand to every unlocked card when the user explicitly
    // typed a bonus count. Otherwise typing 40 only returns whatever's left
    // in the current node (often 10 or fewer late in a topic).
    const nodeCards = deck.filter(c => c.topic === currentNode.id && !c.isSuspended);
    const sourceForNew = (explicitCount && !newFromNode) ? allUnlockedCards : nodeCards;
    const newCards = sourceForNew
      .filter(c => c.mastery === 0)
      .slice(0, newLimit);

    if (reviews.length === 0 && newCards.length === 0) return;

    // Analytics: session start (also fires first_review_started once per
    // device). Aggregate counters reset here; no card content is sent.
    trackReviewSessionStarted(lang, goal);

    // Update streak on session start
    const updatedStats = updateStreak(userStats);
    setUserStats(updatedStats);
    saveUserStats(updatedStats, lang);

    // Anki-style order: clear today's due reviews first, then meet the new
    // cards at the end of the session (no interleaving).
    const ordered = [...reviews, ...newCards];
    const queue = burySiblings(
      ordered.map(c => ({ ...c, step: c.step || 0 }))
    );

    // Warm the audio cache for this session's queue while we're (probably)
    // online. The service worker caches every fetched clip, so once warmed
    // the whole session keeps audio through a mid-session disconnection —
    // previously a never-played card had no cached clip and went silent.
    queue.slice(0, 60).forEach(c => preloadCardAudio(c.audio));

    // Tile-rearrange challenge removed (2026-07-22): no cards are promoted to
    // the tile game any more, so study is pure flashcards. tileCardIds stays
    // empty → StudySession never renders WordTileChallenge.
    setTileCardIds(new Set());
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

    // Analytics: feed the session aggregates (counts only, no card text).
    recordSessionAnswer(isNewCard, rating !== 'AGAIN');
    // Difficulty check-in evidence
    setSessionTally(t => ({
      noIdea: t.noIdea + (rating === 'AGAIN' ? 1 : 0),
      hard: t.hard + (rating === 'HARD' ? 1 : 0),
      good: t.good + (rating === 'GOOD' ? 1 : 0),
      easy: t.easy + (rating === 'EASY' ? 1 : 0),
    }));

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
    const newVocab = recordWordsFromCard(currentCard, freshVocab, lookupFn, rating === 'AGAIN');
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
      // Truly no eligible cards – go home
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
      // Checkpoint – just update lastCheckpointAt
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

  // Progress is device-only (no account), so let users back it up / move it.
  const handleExportProgress = () => {
    try {
      const blob = new Blob([exportAllProgress()], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `langlab-progress-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      alert('Could not export your progress.');
    }
  };

  const handleImportProgress = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // let the same file be picked again later
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (!confirm('Import this backup? It overwrites your current progress on this device.')) return;
      const res = importAllProgress(String(reader.result || ''));
      if (res.ok) {
        alert(`Restored ${res.imported} progress records. Reloading…`);
        window.location.reload();
      } else {
        alert(res.error || 'Could not import that file.');
      }
    };
    reader.onerror = () => alert('Could not read that file.');
    reader.readAsText(file);
  };

  const handleLanguageChange = (newLang: Language) => {
    if (STARTER_LOCK) return; // locked starter link – no switching languages
    trackLanguageSelected(newLang); // analytics: language name only
    handleUpdateSettings({ ...settings, selectedLanguage: newLang });
  };

  const handleGoalChange = (newGoal: LearningGoal) => {
    if (STARTER_LOCK) return; // goal is pinned to 'general' in starter mode
    trackDeckSelected(lang, newGoal); // analytics: deck = language + goal slug
    handleUpdateSettings(setGoalFor(settings, lang, newGoal));
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
    c => c.mastery > 0 && isCardDue(c, now)
  ).length;
  const dailyLeft = Math.max(0, getDailyLimitFor(settings, lang) - dailyStats.newCardsCount);
  const newAvailable = currentNode
    ? Math.min(deck.filter(c => c.topic === currentNode.id && c.mastery === 0 && !c.isSuspended).length, dailyLeft)
    : 0;
  const hasCards = reviewsDue > 0 || newAvailable > 0;

  const availableLanguages: Language[] = STARTER_LOCK
    ? [STARTER_LOCK]
    : (Object.keys(DECK_LOADERS) as Language[]).filter(l => !HIDDEN_UNTIL_PARITY.includes(l));

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
    <div className={`mx-auto min-h-screen ${view === 'STUDY' || view === 'PLACEMENT' || view === 'CHALLENGE' || view === 'SCRIPT' ? 'max-w-lg px-0 pt-0 pb-0' : 'max-w-md px-5 pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))]'}`}>
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
                    <span className="text-sm font-bold text-[var(--text-primary)] whitespace-nowrap">
                      {LANGUAGE_CONFIG[l].name}
                      {LANGUAGE_CONFIG[l].variety && (
                        <span className="ml-1 text-[9px] font-semibold text-[var(--text-muted)]">({LANGUAGE_CONFIG[l].variety})</span>
                      )}
                    </span>
                  </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {view === 'HOME' && placementToast && (
        <div
          className="fixed left-1/2 -translate-x-1/2 top-[max(1rem,env(safe-area-inset-top))] z-[10000] max-w-md w-[calc(100%-2rem)] px-4 py-3 rounded-xl bg-emerald-500/20 border border-emerald-500/50 backdrop-blur-md shadow-lg animate-fade-in cursor-pointer"
          onClick={() => setPlacementToast(null)}
        >
          <div className="flex items-center gap-2">
            <div className="text-emerald-400 text-lg">✓</div>
            <div className="text-sm font-bold text-[var(--text-primary)] leading-tight">
              {placementToast}
            </div>
          </div>
        </div>
      )}
      {view === 'HOME' && (
        <section className="animate-fade-in">
          {/* Header row: title + language picker */}
          <header className="pt-2 pb-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Animated atom – in-app logo (PWA home-screen icon is separate, see public/icon.svg) */}
              <svg viewBox="-2 -2 36 36" className="w-9 h-9 text-[var(--accent)]" fill="none" overflow="visible">
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
              <h1 className="text-xl font-black tracking-[0.15em] uppercase text-[var(--accent)]" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                LANGLAB
              </h1>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="relative" ref={langDropdownRef}>
                <button
                  onClick={() => { if (!STARTER_LOCK) setShowLangDropdown(prev => !prev); }}
                  disabled={!!STARTER_LOCK}
                  title={STARTER_LOCK ? 'Spanish starter deck' : undefined}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-bold border border-violet-500/40 bg-violet-500/15 text-violet-600 dark:text-violet-300 transition-all ${STARTER_LOCK ? 'opacity-90 cursor-default' : 'hover:bg-violet-500/25 active:scale-95'}`}
                >
                  <span>{LANGUAGE_CONFIG[lang].name}{STARTER_LOCK && ' · Starter'}</span>
                  {!STARTER_LOCK && <ChevronDown size={14} className={`transition-transform ${showLangDropdown ? 'rotate-180' : ''}`} />}
                </button>
                {showLangDropdown && !STARTER_LOCK && (
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
                        <span className="whitespace-nowrap">
                          {LANGUAGE_CONFIG[l].name}
                          {LANGUAGE_CONFIG[l].variety && (
                            <span className="ml-1 text-[10px] font-medium text-[var(--text-muted)]">({LANGUAGE_CONFIG[l].variety})</span>
                          )}
                        </span>
                        {l === lang && <span className="ml-auto text-[11px] font-bold uppercase tracking-wider opacity-60">active</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Script-teacher entry – languages with a non-Latin script get a
              "learn the alphabet" track. Full card for fresh starters, then a
              compact pill once started/dismissed; gone when mastered. Soft
              gate only – never blocks Study or placement. */}
          {scriptPack && (() => {
            const s = scriptSummary(scriptPack, scriptProgress);
            if (s.mastered) return null;
            const started = s.seen > 0;
            const dismissed = !!settings.scriptIntroDismissed?.[lang];
            if (!started && !dismissed && userStats.totalReviews < 20) {
              return (
                <div className="stat-card p-4 mb-2.5 border-[var(--accent)]/30">
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <BookOpen size={16} className="text-[var(--accent)]" />
                      <span className="text-sm font-black text-[var(--text-primary)]">Learn {scriptPack.name} first</span>
                    </div>
                    <button
                      onClick={() => handleUpdateSettings({ ...settings, scriptIntroDismissed: { ...settings.scriptIntroDismissed, [lang]: true } })}
                      className="text-[var(--text-faint)] hover:text-[var(--text-secondary)] transition-colors -mt-1 -mr-1 p-1"
                      aria-label="Not now"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-3">
                    {scriptPack.tagline} – short lessons with memory hooks for every character,
                    so the cards below stop looking like squiggles.
                  </p>
                  <button
                    onClick={() => setView('SCRIPT')}
                    className="w-full py-2.5 rounded-xl text-sm font-bold bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90 active:scale-[0.98] transition"
                  >
                    Start with the alphabet
                  </button>
                </div>
              );
            }
            return (
              <button
                onClick={() => setView('SCRIPT')}
                className="w-full flex items-center gap-2 px-3.5 py-2.5 mb-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] active:scale-[0.99] transition text-left"
              >
                <BookOpen size={14} className="text-[var(--accent)] shrink-0" />
                <span className="text-xs font-bold text-[var(--text-primary)]">{scriptPack.name}</span>
                <span className="text-[11px] text-[var(--text-muted)]">{s.graduated}/{s.total} mastered{s.dueCount > 0 && ` · ${s.dueCount} due`}</span>
                <ChevronRight size={14} className="ml-auto text-[var(--text-faint)]" />
              </button>
            );
          })()}

          {/* Pre-study confirm – shown instead of the Study button when new
              cards would join the queue, so the size of the session is always
              the user's choice. */}
          {studyConfirm ? (
            <div className="stat-card px-4 py-4 mb-2 animate-fade-in">
              <p className="text-sm text-[var(--text-secondary)] text-center mb-3">
                {reviewsDue > 0
                  ? `${reviewsDue} ${reviewsDue === 1 ? 'review' : 'reviews'} due. How many new cards today?`
                  : 'How many new cards today?'}
              </p>
              <AddMoreCardsPanel
                defaultCount={newAvailable}
                onStart={(count) => { setStudyConfirm(false); handleStartSession(count, true); }}
              />
              <div className="flex gap-2 mt-2">
                {reviewsDue > 0 && (
                  <button
                    onClick={() => { setStudyConfirm(false); handleStartSession(0, true); }}
                    className="flex-1 py-2.5 rounded-xl border border-[var(--border-color)] text-sm font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] active:scale-95 transition"
                  >
                    Reviews only
                  </button>
                )}
                <button
                  onClick={() => setStudyConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] active:scale-95 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
          /* Study button – primary action, generous size so it dominates the home view */
          <button
            onClick={() => {
              if (!STARTER_LOCK && !isPlacementComplete(lang)) {
                // Full-screen fork (PlacementTest intro) – no dismissible modal.
                // Locked starter links skip placement entirely.
                setView('PLACEMENT');
              } else if (newAvailable > 0) {
                // New cards would join this session – ask how many first
                // rather than silently adding the whole daily allowance.
                setStudyConfirm(true);
              } else {
                handleStartSession(0, true); // reviews only
              }
            }}
            disabled={!hasCards}
            className="w-full py-6 btn-primary rounded-2xl text-lg mb-2"
          >
            {!hasCards ? (
              'All Caught Up'
            ) : (
              <div className="flex items-baseline justify-center gap-2.5">
                <span className="font-extrabold text-xl">Study</span>
                {reviewsDue > 0 && (
                  <>
                    <span className="text-white/40">·</span>
                    <span className="text-sm font-bold opacity-85">{reviewsDue} to review</span>
                  </>
                )}
              </div>
            )}
          </button>
          )}

          {/* When all reviews are done, offer an inline way to pull more
              cards into today's queue. Same panel that appears at the end
              of a study session – bringing it up-front so the user isn't
              stuck at "All caught up" when they still want to learn. */}
          {!hasCards && isPlacementComplete(lang) && (
            <>
              <AddMoreCardsPanel
                variant="home"
                defaultCount={getDailyLimitFor(settings, lang)}
                onStart={(count) => handleStartSession(count)}
              />
              <p className="text-[11px] text-center text-[var(--text-muted)] -mt-1 mb-2">
                That’s today’s {getDailyLimitFor(settings, lang)} new cards done – add more above, or change the daily amount in Settings.
              </p>
            </>
          )}

          {/* Bonus session – explicit "study N extra" affordance. Always visible
              when there are unseen cards left in the current topic so the user
              can push past the daily limit deliberately. Sized for thumb access
              and prominent enough not to get missed. */}
          {/* Listen – secondary, passive listening mode. Only shown when the
              user has at least a handful of seen cards to play through. */}
          {(() => {
            const playableCount = deck.filter(c => (c.interval || 0) > 0 && !c.isSuspended).length;
            if (playableCount < 5) return null;
            return (
              <button
                onClick={() => setView('LISTEN')}
                className="w-full mb-2 px-3 py-2.5 flex items-center justify-center gap-2 text-sm font-bold text-[var(--text-secondary)] bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl hover:border-[var(--accent)]/40 hover:text-[var(--accent)] hover:bg-[var(--accent)]/5 active:scale-[0.99] transition-all"
              >
                <Volume2 size={14} />
                <span>Listen passively to cards you've seen</span>
              </button>
            );
          })()}

          {/* Today's progress + streak – tappable to reveal Bento stats below.
              Default collapsed so the dashboard stays minimal; user opens
              the deeper stats when curious. */}
          {(() => {
            const dailyGoal = getDailyLimitFor(settings, lang);
            const dailyDone = dailyStats.newCardsCount;
            const pct = dailyGoal > 0 ? Math.min(100, Math.round((dailyDone / dailyGoal) * 100)) : 0;
            const streak = userStats.streak;
            return (
              <>
                <div
                  className="w-full stat-card px-4 py-3 mb-2 flex items-center gap-4"
                >
                  {/* Progress bar */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between mb-2">
                      <span className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)]">Today</span>
                      <span className="text-sm font-extrabold text-[var(--text-primary)] tabular-nums">
                        {dailyDone} <span className="text-[var(--text-muted)]">/ {dailyGoal}</span>
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
                    <span className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)]">Streak</span>
                    <div className="flex items-center gap-1">
                      <Flame
                        size={18}
                        className={streak > 0 ? 'text-orange-500 fill-orange-500/30' : 'text-[var(--text-faint)]'}
                      />
                      <span className={`text-sm font-extrabold tabular-nums ${streak > 0 ? 'text-orange-500' : 'text-[var(--text-muted)]'}`}>
                        {streak}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            );
          })()}

          {/* Units / Vocab / Favorites moved into the Settings panel below
              to keep the home view focused on the primary action (Study)
              and the streak. They're still one tap away. */}

          {/* Focus / Library / Settings – 3-col row, vertical tiles
              (icon top, label below) so each fits cleanly on a 375px
              phone. All three full-color so none reads as subordinate.
              Library replaces what used to be the standalone Topics/Vocab/
              Favorites grid – the dropdown lists those three destinations. */}
          <div className="grid grid-cols-3 gap-2 mb-2 relative">
            {(() => {
              const CurrentIcon = goal === 'general' ? Globe : goal === 'travel' ? Plane : goal === 'work' ? Briefcase : Heart;
              return (
                <button
                  onClick={() => setShowGoalMenu(prev => !prev)}
                  className={`stat-card p-2.5 transition-all hover:border-[var(--border-hover)] active:scale-[0.99] flex flex-col items-center gap-1.5 ${showGoalMenu ? 'border-[var(--accent)]/40 bg-[var(--accent)]/5' : ''}`}
                >
                  <div className="w-9 h-9 rounded-lg bg-[var(--accent)]/15 border border-[var(--accent)]/30 flex items-center justify-center">
                    <CurrentIcon size={16} className="text-[var(--accent)]" />
                  </div>
                  <div className="text-sm font-bold text-[var(--text-primary)] leading-tight text-center truncate w-full">
                    {GOAL_CONFIG[goal].name}
                  </div>
                </button>
              );
            })()}
            <button
              onClick={() => setShowLibraryMenu(prev => !prev)}
              className={`stat-card p-2.5 transition-all hover:border-[var(--border-hover)] active:scale-[0.99] flex flex-col items-center gap-1.5 ${showLibraryMenu ? 'border-blue-500/40 bg-blue-500/5' : ''}`}
            >
              <div className="w-9 h-9 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center">
                <LibraryIcon size={16} className="text-blue-500" />
              </div>
              <div className="text-sm font-bold text-[var(--text-primary)] leading-tight">
                Library
              </div>
            </button>
            <button
              onClick={() => setShowTools(prev => !prev)}
              className={`stat-card p-2.5 transition-all hover:border-[var(--border-hover)] active:scale-[0.99] flex flex-col items-center gap-1.5 ${showTools ? 'border-slate-500/40 bg-slate-500/5' : ''}`}
            >
              <div className="w-9 h-9 rounded-lg bg-slate-500/15 border border-slate-500/30 flex items-center justify-center">
                <Settings2 size={16} className="text-slate-500" />
              </div>
              <div className="text-sm font-bold text-[var(--text-primary)] leading-tight">
                Settings
              </div>
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
                          <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                            {g === 'general' ? 'Well-rounded vocabulary' : cfg.description}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {showLibraryMenu && (() => {
              const vocabCount = Object.keys(vocabMap).length;
              const favCount = Object.keys(favoritesMap).length;
              const items = [
                { key: 'units',  label: 'Units',     sub: 'Grammar curriculum map',                                          Icon: Milestone, color: 'text-[var(--accent)]', onClick: () => setView('TOPICS'),    available: true },
                { key: 'vocab',  label: 'Vocab',     sub: vocabCount > 0 ? `${vocabCount} words you've seen` : 'Start studying to fill this',  Icon: PenTool,  color: 'text-blue-500',        onClick: () => setView('VOCAB'),     available: vocabCount > 0 },
                { key: 'favs',   label: 'Favorites', sub: favCount > 0 ? `${favCount} saved items` : 'Tap Save in a popup to fill this',     Icon: Star,     color: 'text-yellow-500',      onClick: () => setView('FAVORITES'), available: favCount > 0 },
              ];
              return (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setShowLibraryMenu(false)} />
                  <div className="absolute left-0 right-0 top-full mt-1.5 z-30 stat-card p-1.5 animate-fade-in">
                    {items.map(it => (
                      <button
                        key={it.key}
                        onClick={() => { if (it.available) { it.onClick(); setShowLibraryMenu(false); } }}
                        disabled={!it.available}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all text-left ${
                          it.available
                            ? 'text-[var(--text-secondary)] hover:bg-[var(--bg-inset)]'
                            : 'text-[var(--text-faint)] cursor-default'
                        }`}
                      >
                        <it.Icon size={14} className={it.available ? it.color : ''} />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold">{it.label}</div>
                          <div className="text-[11px] text-[var(--text-muted)] mt-0.5">{it.sub}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              );
            })()}
          </div>

          {/* Notification prompt – centered modal with backdrop instead of
              a bottom-of-screen panel. Triggers after the 3rd session. Tap
              backdrop or Later to dismiss; "Enable" fires the permission
              flow. */}
          {showSyncNudge && (
            <div
              className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
              onClick={() => { setShowSyncNudge(false); localStorage.setItem('quest_sync_nudge_done', '1'); }}
            >
              <div
                className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 max-w-sm w-full shadow-2xl"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex justify-center mb-3">
                  <div className="w-12 h-12 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/30 flex items-center justify-center">
                    <Cloud size={22} className="text-[var(--accent)]" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-[var(--text-primary)] text-center mb-1.5">New: sync across devices</h3>
                <p className="text-sm text-[var(--text-muted)] text-center mb-5">
                  Study on your phone and computer with one shared progress. No account – just a private code that links your devices.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setShowSyncNudge(false); localStorage.setItem('quest_sync_nudge_done', '1'); }}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-[var(--bg-inset)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] active:scale-95 transition"
                  >
                    Later
                  </button>
                  <button
                    onClick={() => {
                      setShowSyncNudge(false);
                      localStorage.setItem('quest_sync_nudge_done', '1');
                      setShowTools(true); // Settings is the tools panel on HOME (there is no SETTINGS view)
                      setTimeout(() => document.getElementById('sync-settings')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 250);
                    }}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-[var(--accent)] text-white active:scale-95 transition"
                  >
                    Set up
                  </button>
                </div>
              </div>
            </div>
          )}
          {showNotifPrompt && (
            <div
              className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
              onClick={() => { setShowNotifPrompt(false); dismissPrompt(); }}
            >
              <div
                className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 max-w-sm w-full shadow-2xl"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex justify-center mb-3">
                  <div className="w-12 h-12 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/30 flex items-center justify-center">
                    <Bell size={22} className="text-[var(--accent)]" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-[var(--text-primary)] text-center mb-1.5">Daily study reminder?</h3>
                <p className="text-sm text-[var(--text-muted)] text-center mb-5">A gentle nudge so you never miss a review.</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowNotifPrompt(false);
                      dismissPrompt();
                    }}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-[var(--bg-inset)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] active:scale-95 transition"
                  >
                    Not now
                  </button>
                  <button
                    onClick={async () => {
                      setShowNotifPrompt(false);
                      await handleToggleNotifications(true);
                    }}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90 active:scale-95 transition"
                  >
                    Enable
                  </button>
                </div>
              </div>
            </div>
          )}

          {showTools && (
            <div className="stat-card animate-fade-in space-y-5 mt-2 mb-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wide">Settings</h3>
                <button onClick={() => setShowTools(false)} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div>
                <div className="flex items-baseline justify-between mb-3">
                  <div className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide">New Cards / Day</div>
                  <div className="text-[11px] font-semibold text-[var(--text-muted)] tracking-wide">for {LANGUAGE_CONFIG[lang].name}</div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => adjustLimit(-5)} className="w-9 h-9 rounded-lg border border-[var(--border-color)] text-[var(--text-muted)] flex items-center justify-center hover:border-[var(--border-hover)] hover:text-[var(--text-secondary)] transition-all active:scale-95">
                    <Minus size={14} />
                  </button>
                  <button onClick={() => adjustLimit(-1)} className="w-9 h-9 rounded-lg border border-[var(--border-color)] text-[var(--text-muted)] flex items-center justify-center hover:border-[var(--border-hover)] hover:text-[var(--text-secondary)] transition-all active:scale-95 text-xs font-bold font-mono">
                    -1
                  </button>
                  <div className="flex-1 text-center">
                    <div className="text-4xl font-extrabold font-mono text-[var(--text-primary)]">{getDailyLimitFor(settings, lang)}</div>
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
                  <div className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide">Cards per Session</div>
                  <div className="text-[11px] font-semibold text-[var(--text-muted)] tracking-wide">for {LANGUAGE_CONFIG[lang].name}</div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => adjustSessionLimit(-5)} className="w-9 h-9 rounded-lg border border-[var(--border-color)] text-[var(--text-muted)] flex items-center justify-center hover:border-[var(--border-hover)] hover:text-[var(--text-secondary)] transition-all active:scale-95">
                    <Minus size={14} />
                  </button>
                  <button onClick={() => adjustSessionLimit(-1)} className="w-9 h-9 rounded-lg border border-[var(--border-color)] text-[var(--text-muted)] flex items-center justify-center hover:border-[var(--border-hover)] hover:text-[var(--text-secondary)] transition-all active:scale-95 text-xs font-bold font-mono">
                    -1
                  </button>
                  <div className="flex-1 text-center">
                    <div className="text-4xl font-extrabold font-mono text-[var(--text-primary)]">{getSessionLimitFor(settings, lang)}</div>
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
              <div className="pt-4 border-t border-[var(--border-color)] space-y-3">
                <div className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide">Appearance</div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text-primary)] font-semibold">Theme</span>
                  <div className="flex gap-1">
                    {(['light', 'dark'] as const).map(t => (
                      <button
                        key={t}
                        onClick={() => handleUpdateSettings({ ...settings, theme: t })}
                        className={`px-3.5 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all border flex items-center gap-1.5 ${
                          settings.theme === t
                            ? 'border-[var(--accent)]/40 bg-[var(--accent)]/10 text-[var(--accent)]'
                            : 'border-[var(--border-color)] text-[var(--text-muted)] hover:border-[var(--border-hover)]'
                        }`}
                      >
                        {t === 'dark' ? <Moon size={12} /> : <Sun size={12} />}
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Audio settings */}
              <div className="pt-4 border-t border-[var(--border-color)] space-y-3">
                <div className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide">Audio</div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text-primary)] font-semibold">Auto-play</span>
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
                  <span className="text-sm text-[var(--text-primary)] font-semibold">Speed</span>
                  <div className="flex gap-1.5">
                    {([0.6, 0.8, 1.0] as AudioSpeed[]).map(s => (
                      <button
                        key={s}
                        onClick={() => handleUpdateSettings({ ...settings, audioSpeed: s })}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold font-mono transition-all border ${
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

              </div>

              {/* Notification reminders */}
              {isNotificationSupported() && (
                <div className="pt-4 border-t border-[var(--border-color)] space-y-3">
                  <div className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide">Reminders</div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[var(--text-primary)] font-semibold flex items-center gap-1.5">
                      {notifPrefs.enabled ? <Bell size={14} /> : <BellOff size={14} />}
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
              <div className="pt-4 border-t border-[var(--border-color)] space-y-3">
                <div className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide">Flagged Words</div>
                {(() => {
                  const flags = JSON.parse(localStorage.getItem('quest_flagged_words') || '[]');
                  if (flags.length === 0) {
                    return <p className="text-[11px] text-[var(--text-muted)]">No words flagged. Tap "Flag as wrong" on any word's definition popover to report it.</p>;
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
                            if (btn) { btn.textContent = 'Copied'; setTimeout(() => { btn.textContent = 'Copy all'; }, 1500); }
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

              {/* Cross-device sync (opt-in, accountless sync code). Renders
                  nothing unless the Supabase env is configured. */}
              <SyncSettings />

              {/* Backup – a device-local JSON backup, and the durable recovery
                  path if a sync code is lost. */}
              <div className="pt-4 border-t border-[var(--border-color)] space-y-2">
                <div className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide">Back up your progress</div>
                <p className="text-[11px] text-[var(--text-muted)] leading-snug">
                  Download all progress on this device as a file. Useful before clearing browser data – and it's your recovery path if you ever lose your sync code.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleExportProgress}
                    className="flex-1 px-3 py-2.5 text-sm font-bold text-[var(--accent)] border border-[var(--accent)]/30 rounded-lg hover:bg-[var(--accent)]/10 active:scale-95 transition-all"
                  >
                    Export
                  </button>
                  <button
                    onClick={() => backupInputRef.current?.click()}
                    className="flex-1 px-3 py-2.5 text-sm font-bold text-[var(--accent)] border border-[var(--accent)]/30 rounded-lg hover:bg-[var(--accent)]/10 active:scale-95 transition-all"
                  >
                    Import
                  </button>
                  <input
                    ref={backupInputRef}
                    type="file"
                    accept="application/json,.json"
                    className="hidden"
                    onChange={handleImportProgress}
                  />
                </div>
              </div>

              {/* Placement – framed as the benefit, always recoverable. */}
              <div className="pt-4 border-t border-[var(--border-color)] space-y-2">
                <div className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide">Your level</div>
                {!STARTER_LOCK && (
                  <button
                    onClick={() => {
                      setShowTools(false);
                      setView('PLACEMENT');
                    }}
                    className="w-full px-3 py-2.5 text-sm font-bold text-[var(--accent)] border border-[var(--accent)]/30 rounded-lg hover:bg-[var(--accent)]/10 active:scale-95 transition-all"
                  >
                    {isPlacementTaken(lang)
                      ? 'Retake placement test'
                      : 'Skip ahead – take the placement test'}
                  </button>
                )}
              </div>

              {/* Danger zone – reset actions. Confirms required so the user
                  can't accidentally wipe progress. Styled in muted red so it
                  reads as serious but doesn't draw the eye like a CTA. */}
              <div className="pt-4 border-t border-[var(--border-color)] space-y-3">
                <div className="text-xs font-bold text-red-500/80 uppercase tracking-wide">Danger zone</div>
                <button
                  onClick={async () => {
                    if (confirm('Reset ALL data across every language? This wipes streaks, progress, mastery, favorites, vocab – everything. Cannot be undone.')) {
                      await syncOnReset(); // wipe cloud + bump epoch so a synced device drops its copy too
                      resetAll();
                      window.location.reload();
                    }
                  }}
                  className="w-full px-3 py-2.5 text-sm font-bold text-red-600 dark:text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/10 active:scale-95 transition-all"
                >
                  Reset all data
                </button>
              </div>
            </div>
          )}

          {/* Version log – build info pinned to the very bottom of the home
              view so users can quote the exact build when reporting issues. */}
          <div className="mt-3 pt-3 border-t border-[var(--border-color)] flex items-center justify-center gap-2 text-xs font-semibold text-[var(--text-muted)] tabular-nums">
            <span>{__APP_SHA__}</span>
            <span>·</span>
            <span>{__APP_BUILD_DATE__}</span>
          </div>
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
            // One-shot difficulty check-in: a full screen (not a popup), once
            // per language, after there's real evidence – >=25 lifetime reviews
            // and >=8 answers in the session that just ended.
            const answered = sessionTally.noIdea + sessionTally.hard + sessionTally.good + sessionTally.easy;
            if (!STARTER_LOCK && !isCheckinDone(lang) && userStats.totalReviews >= 25 && answered >= 8) {
              setView('CHECKIN');
            } else {
              setView('HOME');
            }
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

      {view === 'CHECKIN' && (
        <CheckInScreen
          lang={lang}
          tally={sessionTally}
          easedLimitPreview={{
            from: getDailyLimitFor(settings, lang),
            to: Math.max(5, Math.floor(getDailyLimitFor(settings, lang) / 2)),
          }}
          onTooEasy={() => {
            setCheckinDone(lang);
            setView('PLACEMENT'); // level check → skip ahead properly
          }}
          onAboutRight={() => {
            setCheckinDone(lang);
            setView('HOME');
          }}
          onTooHard={() => {
            setCheckinDone(lang);
            const from = getDailyLimitFor(settings, lang);
            const to = Math.max(5, Math.floor(from / 2));
            handleUpdateSettings(setDailyLimitFor(settings, lang, to));
            setView('HOME');
          }}
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
            // Concrete signal that placement actually moved their progress.
            // Without this users complained "did anything happen?" because the
            // graduated cards' due dates are 4-10 days out – they don't show
            // up in TODAY's queue.
            setPlacementToast(
              fastTrackedCount > 0
                ? `Placement saved – ${fastTrackedCount.toLocaleString()} cards marked as known`
                : `Placement complete – starting from the beginning`
            );
            setView('HOME');
          }}
          onSkip={() => {
            // "I'm new – start from zero": decline placement and go straight
            // into the first session (what the user was trying to do).
            setPlacementComplete(lang);
            setDeck(prev => [...prev]);
            handleStartSession();
          }}
          onExit={() => setView('HOME')}
          onLearnScript={scriptPack && !scriptSummary(scriptPack, scriptProgress).mastered ? () => setView('SCRIPT') : undefined}
          scriptName={scriptPack?.name}
          autoPlayAudio={settings.autoPlayAudio}
          audioSpeed={settings.audioSpeed}
          googleTtsApiKey={settings.googleTtsApiKey}
        />
      )}

      {view === 'SCRIPT' && scriptPack && (
        <ScriptTeacher
          pack={scriptPack}
          lang={lang}
          progress={scriptProgress}
          onProgressChange={setScriptProgress}
          onSessionStart={() => {
            // A study day is a study day: script sessions feed the streak but
            // never cardsLearned/totalReviews (fully separate track).
            const updated = updateStreak(loadUserStats(lang));
            setUserStats(updated);
            saveUserStats(updated, lang);
          }}
          onExit={() => setView('HOME')}
          autoPlayAudio={settings.autoPlayAudio}
          audioSpeed={settings.audioSpeed}
          googleTtsApiKey={settings.googleTtsApiKey}
        />
      )}

    </div>
  );
};

export default App;
