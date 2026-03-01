import React, { useState, useEffect } from 'react';
import TopicMap from './components/TopicMap';
import SessionMenu from './components/SessionMenu';
import StudySession from './components/StudySession';
import GamificationHub from './components/GamificationHub';
import { QuestCard, MasteryMap, SessionState, UserStats, DailyStats } from './types';
import { SKILL_TREE, ALL_TOPICS } from './data/topicConfig';
import { handleAnswerLogic, saveCardProgress } from './services/srsService';
import {
  loadMasteryMap, loadUserStats, saveUserStats,
  loadDailyStats, saveDailyStats, resetAll,
  loadSettings, saveSettings,
} from './services/storageService';
import type { StudySettings } from './services/storageService';
import {
  awardXP, updateStreak, checkAchievements, getAchievementsWithStatus,
} from './services/gamificationService';
import rawDeck from './data/deck.json';

type View = 'LANGUAGES' | 'TOPICS' | 'MENU' | 'STUDY' | 'GAMIFICATION' | 'SETTINGS';

// Transform raw deck.json cards into QuestCards with proper topic/category
const buildDeck = (raw: typeof rawDeck, masteryMap: MasteryMap): QuestCard[] => {
  const sorted = [...raw].sort((a, b) => a.id - b.id);
  const cards: QuestCard[] = [];

  for (const tier of SKILL_TREE) {
    const allTierTopics = [
      ...tier.mainTopics,
      ...(tier.sideLeft?.topics || []),
      ...(tier.sideRight?.topics || []),
    ];

    for (const topic of allTierTopics) {
      if (topic.cardSlice[0] === -1) continue; // placeholder topic, no cards

      const slice = sorted.slice(topic.cardSlice[0], topic.cardSlice[1]);
      for (const rawCard of slice) {
        const id = String(rawCard.id);
        const saved = masteryMap[id];
        cards.push({
          id,
          target: rawCard.target,
          english: rawCard.english,
          category: tier.tier,
          topic: topic.id,
          audio: rawCard.audio,
          mastery: (saved?.mastery as number) ?? 0,
          step: (saved?.step as number) ?? 0,
          dueDate: (saved?.dueDate as number) ?? undefined,
          interval: (saved?.interval as number) ?? 0,
          ease: (saved?.ease as number) ?? 2.5,
        });
      }
    }
  }

  return cards;
};

const App: React.FC = () => {
  const [view, setView] = useState<View>('LANGUAGES');
  const [activeTopicId, setActiveTopicId] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [deck, setDeck] = useState<QuestCard[]>([]);
  const [masteryMap, setMasteryMap] = useState<MasteryMap>({});
  const [userStats, setUserStats] = useState<UserStats>(loadUserStats());
  const [dailyStats, setDailyStats] = useState<DailyStats>(loadDailyStats());
  const [settings, setSettings] = useState<StudySettings>(loadSettings());
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

  const handleSelectTopic = (topicId: string, category: string) => {
    setActiveTopicId(topicId);
    setActiveCategory(category);
    setView('MENU');
  };

  const handleStartSession = () => {
    const now = Date.now();
    const topicCards = deck.filter(c => c.topic === activeTopicId);

    const reviews = topicCards.filter(
      c => c.mastery > 0 && (c.dueDate ? c.dueDate <= now : true)
    );

    const dailyLimitRemaining = settings.dailyNewLimit - dailyStats.newCardsCount;
    const newCards = topicCards
      .filter(c => c.mastery === 0)
      .slice(0, Math.max(0, dailyLimitRemaining));

    if (reviews.length === 0 && newCards.length === 0) return;

    // Update streak on session start
    const updatedStats = updateStreak(userStats);
    setUserStats(updatedStats);
    saveUserStats(updatedStats);

    setSession({
      language: 'Spanish',
      topic: activeTopicId,
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

  const getTotalCompletion = () => {
    if (deck.length === 0) return 0;
    const mastered = deck.filter(c => c.mastery === 2).length;
    return Math.round((mastered / deck.length) * 100);
  };

  return (
    <div className="max-w-md mx-auto min-h-screen p-4 pb-20 font-mono">
      {view === 'LANGUAGES' && (
        <section className="space-y-6 pt-8 animate-fade-in">
          <header className="text-center mb-10">
            <h1 className="text-4xl font-black italic tracking-tighter text-blue-500">QUEST.</h1>
            <p className="text-[10px] tracking-[0.3em] text-slate-500 font-bold uppercase mt-2">
              Linguistic Core
            </p>
          </header>

          <button
            onClick={() => setView('TOPICS')}
            className="w-full p-6 bg-slate-800 border-2 border-slate-600 text-left transition-all hover:border-blue-500 active:translate-y-1 group"
            style={{ boxShadow: '0 6px 0 #0f172a' }}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-red-600 border-2 border-slate-400 flex items-center justify-center text-[10px] text-white font-black">
                {getTotalCompletion()}%
              </div>
              <div>
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Course Status
                </div>
                <div className="text-xl font-black uppercase text-slate-100">Spanish</div>
                <div className="text-[10px] text-red-500 font-black uppercase tracking-widest mt-1">
                  Mastery Level: {getTotalCompletion()}%
                </div>
              </div>
            </div>
          </button>

          <button
            onClick={() => setView('GAMIFICATION')}
            className="w-full p-4 bg-slate-800/50 border-2 border-indigo-900/50 text-left transition-all hover:border-indigo-500 active:translate-y-1"
            style={{ boxShadow: '0 4px 0 #0f172a' }}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏆</span>
              <div>
                <div className="text-sm font-black uppercase text-indigo-400">
                  Level {userStats.level}
                </div>
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                  {userStats.xp} XP · {userStats.streak} Day Streak
                </div>
              </div>
            </div>
          </button>

          <div className="pt-6">
            <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4 text-center">
              Protocol Expansion
            </h3>
            <div className="grid grid-cols-2 gap-3 opacity-40">
              {['French', 'German', 'Italian', 'Russian', 'Japanese', 'Chinese'].map(l => (
                <div
                  key={l}
                  className="p-3 bg-slate-800/30 border border-slate-700 flex justify-between items-center"
                >
                  <span className="text-xs font-bold uppercase text-slate-500">{l}</span>
                  <span className="text-[10px]">🔒</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {view === 'TOPICS' && (
        <TopicMap
          cards={deck}
          onSelectTopic={handleSelectTopic}
          onBack={() => setView('LANGUAGES')}
        />
      )}

      {view === 'MENU' && (
        <SessionMenu
          category={activeCategory}
          topic={activeTopicId}
          topicName={ALL_TOPICS.find(t => t.id === activeTopicId)?.name || activeTopicId}
          deck={deck}
          onStart={handleStartSession}
          onBack={() => setView('TOPICS')}
          onSettings={() => setView('SETTINGS')}
          dailyNewCount={dailyStats.newCardsCount}
          dailyNewLimit={settings.dailyNewLimit}
          onUpdateLimit={(limit) => handleUpdateSettings({ ...settings, dailyNewLimit: limit })}
        />
      )}

      {view === 'STUDY' && (
        <StudySession
          session={session}
          onAnswer={handleAnswer}
          onAbort={() => setView('MENU')}
          topicCards={deck.filter(c => c.topic === activeTopicId)}
        />
      )}

      {view === 'GAMIFICATION' && (
        <GamificationHub
          stats={userStats}
          achievements={getAchievementsWithStatus(userStats, masteryMap, deck)}
          onBack={() => setView('LANGUAGES')}
        />
      )}

      {view === 'SETTINGS' && (
        <section className="space-y-8 pt-10 px-4 animate-fade-in text-center">
          <button
            onClick={() => setView('MENU')}
            className="text-slate-500 text-xs font-bold uppercase tracking-widest hover:text-slate-300"
          >
            ← Return
          </button>
          <h2 className="text-2xl font-black text-slate-100 mb-2 uppercase">System</h2>
          <button
            onClick={() => {
              resetAll();
              window.location.reload();
            }}
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
