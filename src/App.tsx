import React, { useState, useEffect } from 'react';
import TopicMap from './components/TopicMap';
import StudySession from './components/StudySession';
import GamificationHub from './components/GamificationHub';
import { QuestCard, MasteryMap, SessionState, UserStats, DailyStats } from './types';
import { MAIN_PATH, isNodeUnlocked } from './data/topicConfig';
import { handleAnswerLogic, saveCardProgress, getRetention } from './services/srsService';
import {
  loadMasteryMap, loadUserStats, saveUserStats,
  loadDailyStats, saveDailyStats, resetAll,
  loadSettings, saveSettings,
} from './services/storageService';
import type { StudySettings } from './services/storageService';
import {
  awardXP, updateStreak, checkAchievements, getAchievementsWithStatus,
} from './services/gamificationService';
import { Settings2, Minus, Plus, X } from 'lucide-react';
import rawDeck from './data/deck.json';

type View = 'LANGUAGES' | 'TOPICS' | 'STUDY' | 'GAMIFICATION' | 'SETTINGS';

// Transform raw deck.json cards into QuestCards mapped to linear path nodes
const buildDeck = (raw: typeof rawDeck, masteryMap: MasteryMap): QuestCard[] => {
  const sorted = [...raw].sort((a, b) => a.id - b.id);
  const cards: QuestCard[] = [];

  for (const node of MAIN_PATH) {
    const slice = sorted.slice(node.cardSlice[0], node.cardSlice[1]);
    for (const rawCard of slice) {
      const id = String(rawCard.id);
      const saved = masteryMap[id];
      cards.push({
        id,
        target: rawCard.target,
        english: rawCard.english,
        category: node.tier,
        topic: node.id,
        audio: rawCard.audio,
        mastery: (saved?.mastery as number) ?? 0,
        step: (saved?.step as number) ?? 0,
        dueDate: (saved?.dueDate as number) ?? undefined,
        interval: (saved?.interval as number) ?? 0,
        ease: (saved?.ease as number) ?? 2.5,
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
  return MAIN_PATH[MAIN_PATH.length - 1]; // all complete, return last
};

const App: React.FC = () => {
  const [view, setView] = useState<View>('LANGUAGES');
  const [deck, setDeck] = useState<QuestCard[]>([]);
  const [masteryMap, setMasteryMap] = useState<MasteryMap>({});
  const [userStats, setUserStats] = useState<UserStats>(loadUserStats());
  const [dailyStats, setDailyStats] = useState<DailyStats>(loadDailyStats());
  const [settings, setSettings] = useState<StudySettings>(loadSettings());
  const [showTools, setShowTools] = useState(false);
  const [session, setSession] = useState<SessionState>({
    language: 'Spanish',
    topic: '',
    queue: [],
    currentIndex: 0,
    isFlipped: false,
    finishedCount: 0,
    newCardsSeen: 0,
  });

  useEffect(() => {
    const map = loadMasteryMap();
    setMasteryMap(map);
    setDeck(buildDeck(rawDeck, map));
  }, []);

  // Re-merge deck when masteryMap changes
  useEffect(() => {
    if (deck.length > 0) {
      setDeck(prev =>
        prev.map(c => {
          const saved = masteryMap[c.id];
          return saved
            ? { ...c, mastery: (saved.mastery as number) ?? c.mastery, step: (saved.step as number) ?? c.step, dueDate: (saved.dueDate as number) ?? c.dueDate, interval: (saved.interval as number) ?? c.interval, ease: (saved.ease as number) ?? c.ease }
            : c;
        })
      );
    }
  }, [masteryMap]);

  const handleStartSession = () => {
    const now = Date.now();
    const currentNode = getCurrentNode(deck);

    // Reviews: from ALL unlocked nodes (one unified deck)
    const allUnlockedCards = deck.filter(c => {
      const nodeIdx = MAIN_PATH.findIndex(n => n.id === c.topic);
      return nodeIdx >= 0 && isNodeUnlocked(nodeIdx, deck);
    });
    const reviews = allUnlockedCards.filter(
      c => c.mastery > 0 && (c.dueDate ? c.dueDate <= now : true)
    );

    // New cards: from the current frontier node
    const dailyLimitRemaining = settings.dailyNewLimit - dailyStats.newCardsCount;
    const nodeCards = deck.filter(c => c.topic === currentNode.id);
    const newCards = nodeCards
      .filter(c => c.mastery === 0)
      .slice(0, Math.max(0, dailyLimitRemaining));

    if (reviews.length === 0 && newCards.length === 0) return;

    // Update streak on session start
    const updatedStats = updateStreak(userStats);
    setUserStats(updatedStats);
    saveUserStats(updatedStats);

    setSession({
      language: 'Spanish',
      topic: currentNode.id,
      queue: [...reviews, ...newCards].map(c => ({ ...c, step: c.step || 0 })),
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
      const newMap = saveCardProgress(card, masteryMap);
      setMasteryMap(newMap);
    });

    // Daily new card tracking
    if (isNewCard && rating !== 'AGAIN') {
      const newDaily = { ...dailyStats, newCardsCount: dailyStats.newCardsCount + 1 };
      setDailyStats(newDaily);
      saveDailyStats(newDaily);
    }

    // XP and gamification
    const { stats: newStats, xpGained, leveledUp } = awardXP(rating, userStats);

    // Count graduated cards
    const updatedCard = updates.queue?.[updates.queue.length - 1] || currentCard;
    if (updatedCard.mastery === 2 && currentCard.mastery < 2) {
      newStats.cardsLearned = newStats.cardsLearned + 1;
    }

    setUserStats(newStats);
    saveUserStats(newStats);

    checkAchievements(newStats, masteryMap, deck);

    setSession(prev => ({ ...prev, ...updates }));
  };

  const handleUpdateSettings = (newSettings: StudySettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
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
    const nodeIdx = MAIN_PATH.findIndex(n => n.id === c.topic);
    return nodeIdx >= 0 && isNodeUnlocked(nodeIdx, deck);
  });
  const reviewsDue = allUnlockedCards.filter(
    c => c.mastery > 0 && (c.dueDate ? c.dueDate <= now : true)
  ).length;
  const dailyLeft = Math.max(0, settings.dailyNewLimit - dailyStats.newCardsCount);
  const newAvailable = currentNode
    ? Math.min(deck.filter(c => c.topic === currentNode.id && c.mastery === 0).length, dailyLeft)
    : 0;
  const hasCards = reviewsDue > 0 || newAvailable > 0;

  return (
    <div className="max-w-md mx-auto min-h-screen p-5 pb-20 font-mono">
      {view === 'LANGUAGES' && (
        <section className="animate-fade-in">
          {/* Header */}
          <header className="pt-10 pb-6">
            <h1 className="text-5xl font-black italic tracking-tighter text-blue-500 text-center">LangLab</h1>

            <div className="flex justify-center gap-8 mt-5">
              <button onClick={() => setView('GAMIFICATION')} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors">
                <span className="text-amber-500 text-sm">⚡</span>
                <span className="text-xs font-bold">{userStats.streak}-day streak</span>
              </button>
              <button onClick={() => setView('GAMIFICATION')} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors">
                <span className="text-blue-500 text-sm">▲</span>
                <span className="text-xs font-bold">Level {userStats.level}</span>
              </button>
            </div>
          </header>

          {/* Language selection — Spanish */}
          <div className="stat-card p-4 mb-3 border-blue-500/20">
            <div className="flex items-center gap-3">
              <div
                className="w-6 h-4 rounded-[3px] flex-shrink-0"
                style={{ background: 'linear-gradient(to bottom, #c60b1e 30%, #ffc400 30%, #ffc400 70%, #c60b1e 70%)' }}
              />
              <div className="text-lg font-black text-slate-800">Spanish</div>
            </div>
          </div>

          {/* Current node indicator */}
          {currentNode && (() => {
            const nodeTotal = deck.filter(c => c.topic === currentNode.id).length;
            const nodeGraduated = deck.filter(c => c.topic === currentNode.id && c.mastery === 2).length;
            const nodePercent = nodeTotal > 0 ? Math.round((nodeGraduated / nodeTotal) * 100) : 0;
            return (
              <div className="stat-card p-4 mb-3">
                <div className="flex items-center justify-between mb-2.5">
                  <div>
                    <div className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ color: currentNode.color }}>
                      {currentNode.tier}
                    </div>
                    <div className="text-sm font-black">{currentNode.name}</div>
                  </div>
                  <button
                    onClick={() => setShowTools(prev => !prev)}
                    className={`p-2 rounded-lg border transition-all ${
                      showTools
                        ? 'border-blue-500/50 text-blue-400 bg-blue-500/10'
                        : 'border-slate-300 text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <Settings2 size={16} />
                  </button>
                </div>
                <div className="progress-rail">
                  <div className="progress-fill" style={{ width: `${nodePercent}%`, background: currentNode.color }} />
                </div>
              </div>
            );
          })()}

          {/* Tools Panel */}
          {showTools && (
            <div className="stat-card animate-fade-in space-y-4 mb-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Settings</h3>
                <button onClick={() => setShowTools(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <X size={16} />
                </button>
              </div>

              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">New Cards / Day</div>
                <div className="flex items-center gap-3">
                  <button onClick={() => adjustLimit(-5)} className="w-9 h-9 rounded-lg border border-slate-300 text-slate-400 flex items-center justify-center hover:border-slate-400 hover:text-slate-600 transition-all active:scale-95">
                    <Minus size={14} />
                  </button>
                  <button onClick={() => adjustLimit(-1)} className="w-9 h-9 rounded-lg border border-slate-300 text-slate-400 flex items-center justify-center hover:border-slate-400 hover:text-slate-600 transition-all active:scale-95 text-xs font-bold">
                    -1
                  </button>
                  <div className="flex-1 text-center">
                    <div className="text-3xl font-black">{settings.dailyNewLimit}</div>
                  </div>
                  <button onClick={() => adjustLimit(1)} className="w-9 h-9 rounded-lg border border-slate-300 text-slate-400 flex items-center justify-center hover:border-slate-400 hover:text-slate-600 transition-all active:scale-95 text-xs font-bold">
                    +1
                  </button>
                  <button onClick={() => adjustLimit(5)} className="w-9 h-9 rounded-lg border border-slate-300 text-slate-400 flex items-center justify-center hover:border-slate-400 hover:text-slate-600 transition-all active:scale-95">
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              <button
                onClick={() => { resetAll(); window.location.reload(); }}
                className="w-full py-3 rounded-lg border border-red-300 text-red-500 text-[10px] font-bold uppercase tracking-widest hover:bg-red-50 transition-colors"
              >
                Reset All Data
              </button>
            </div>
          )}

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className={`stat-card text-center py-3 ${reviewsDue > 0 ? 'border-orange-400/40' : ''}`}>
              <div className={`text-lg font-black ${reviewsDue > 0 ? 'text-orange-500' : 'text-slate-400'}`}>{reviewsDue}</div>
              <div className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Due</div>
            </div>
            <div className="stat-card text-center py-3 border-blue-400/40">
              <div className="text-lg font-black text-blue-500">{newAvailable}</div>
              <div className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">New</div>
            </div>
          </div>

          {/* Study button */}
          <button
            onClick={handleStartSession}
            disabled={!hasCards}
            className="w-full py-5 btn-primary rounded-xl text-base mb-4"
          >
            {!hasCards ? 'All Caught Up' : 'Study'}
          </button>

          {/* Progress map link */}
          <button
            onClick={() => setView('TOPICS')}
            className="w-full stat-card p-0 overflow-hidden text-left transition-all hover:border-slate-400 group cursor-pointer mb-3"
          >
            <div className="h-1 bg-slate-200">
              <div className="h-full bg-blue-500 transition-all" style={{ width: `${getTotalProgress()}%` }} />
            </div>
            <div className="p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest group-hover:text-slate-600 transition-colors">
                <span>Progress Map</span>
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </div>
            </div>
          </button>

          {/* Add language - subtle inline link */}
          <div className="text-center">
            <button className="text-[10px] font-bold text-slate-400 tracking-widest hover:text-slate-600 transition-colors">
              + Add Language
            </button>
          </div>
        </section>
      )}

      {view === 'TOPICS' && (
        <TopicMap
          cards={deck}
          onBack={() => setView('LANGUAGES')}
        />
      )}

      {view === 'STUDY' && (
        <StudySession
          session={session}
          onAnswer={handleAnswer}
          onAbort={() => setView('LANGUAGES')}
          topicCards={deck.filter(c => c.topic === session.topic)}
        />
      )}

      {view === 'GAMIFICATION' && (
        <GamificationHub
          stats={userStats}
          achievements={getAchievementsWithStatus(userStats, masteryMap, deck)}
          retention={getTotalRetention()}
          onBack={() => setView('LANGUAGES')}
        />
      )}

      {view === 'SETTINGS' && (
        <section className="space-y-8 pt-10 px-4 animate-fade-in text-center">
          <button
            onClick={() => setView('LANGUAGES')}
            className="text-slate-500 text-xs font-bold uppercase tracking-widest hover:text-slate-300"
          >
            ← Return
          </button>
          <h2 className="text-2xl font-black text-slate-100 mb-2 uppercase">System</h2>
          <button
            onClick={() => { resetAll(); window.location.reload(); }}
            className="w-full py-5 border-2 border-red-900/50 text-red-500 text-xs font-bold uppercase tracking-widest hover:bg-red-900/20 transition-colors"
          >
            Purge Data
          </button>
        </section>
      )}
    </div>
  );
};

export default App;
