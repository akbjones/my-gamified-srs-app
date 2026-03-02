import React, { useState } from 'react';
import { QuestCard } from '../types';
import { MAIN_PATH, isNodeUnlocked } from '../data/topicConfig';
import { Settings2, Minus, Plus, X } from 'lucide-react';

interface SessionMenuProps {
  category: string;
  topic: string;
  topicName: string;
  deck: QuestCard[];
  onStart: () => void;
  onBack: () => void;
  onSettings: () => void;
  dailyNewCount: number;
  dailyNewLimit: number;
  onUpdateLimit: (limit: number) => void;
}

const SessionMenu: React.FC<SessionMenuProps> = ({
  category, topic, topicName, deck, onStart, onBack, onSettings,
  dailyNewCount, dailyNewLimit, onUpdateLimit,
}) => {
  const [showTools, setShowTools] = useState(false);

  const filtered = deck.filter(c => c.topic === topic);
  const now = Date.now();

  // Reviews come from ALL unlocked nodes (unified deck)
  const allUnlockedCards = deck.filter(c => {
    const nodeIdx = MAIN_PATH.findIndex(n => n.id === c.topic);
    return nodeIdx >= 0 && isNodeUnlocked(nodeIdx, deck);
  });
  const reviewsDue = allUnlockedCards.filter(
    c => c.mastery > 0 && (c.dueDate ? c.dueDate <= now : true)
  ).length;

  // New cards only from this node
  const totalNewInTopic = filtered.filter(c => c.mastery === 0).length;
  const dailyLeft = Math.max(0, dailyNewLimit - dailyNewCount);
  const newAvailable = Math.min(totalNewInTopic, dailyLeft);

  const totalCards = filtered.length;
  const masteredCards = filtered.filter(c => c.mastery === 2).length;
  const topicProgress = totalCards > 0 ? Math.round((masteredCards / totalCards) * 100) : 0;

  const adjustLimit = (delta: number) => {
    const next = Math.max(1, Math.min(50, dailyNewLimit + delta));
    onUpdateLimit(next);
  };

  return (
    <section className="space-y-6 pt-10 animate-fade-in">
      {/* Header */}
      <header className="flex justify-between items-start">
        <div>
          <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">{category}</div>
          <h2 className="text-3xl font-black tracking-tight text-slate-100">{topicName}</h2>
        </div>
        <button
          onClick={() => setShowTools(prev => !prev)}
          className={`p-2.5 rounded-lg border transition-all ${
            showTools
              ? 'border-blue-500/50 text-blue-400 bg-blue-500/10'
              : 'border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-500'
          }`}
        >
          <Settings2 size={18} />
        </button>
      </header>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-[9px] font-bold uppercase text-slate-500 tracking-widest mb-1.5">
          <span>Progress</span>
          <span>{topicProgress}%</span>
        </div>
        <div className="progress-rail">
          <div className="progress-fill bg-blue-500" style={{ width: `${topicProgress}%` }} />
        </div>
      </div>

      {/* Tools Panel */}
      {showTools && (
        <div className="stat-card animate-fade-in space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Custom Study</h3>
            <button onClick={() => setShowTools(false)} className="text-slate-600 hover:text-slate-400 transition-colors">
              <X size={16} />
            </button>
          </div>

          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">New Cards / Day</div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => adjustLimit(-5)}
                className="w-9 h-9 rounded-lg border border-slate-700 text-slate-400 flex items-center justify-center hover:border-slate-500 hover:text-slate-200 transition-all active:scale-95"
              >
                <Minus size={14} />
              </button>
              <button
                onClick={() => adjustLimit(-1)}
                className="w-9 h-9 rounded-lg border border-slate-700 text-slate-400 flex items-center justify-center hover:border-slate-500 hover:text-slate-200 transition-all active:scale-95 text-xs font-bold"
              >
                -1
              </button>
              <div className="flex-1 text-center">
                <div className="text-3xl font-black text-slate-100">{dailyNewLimit}</div>
              </div>
              <button
                onClick={() => adjustLimit(1)}
                className="w-9 h-9 rounded-lg border border-slate-700 text-slate-400 flex items-center justify-center hover:border-slate-500 hover:text-slate-200 transition-all active:scale-95 text-xs font-bold"
              >
                +1
              </button>
              <button
                onClick={() => adjustLimit(5)}
                className="w-9 h-9 rounded-lg border border-slate-700 text-slate-400 flex items-center justify-center hover:border-slate-500 hover:text-slate-200 transition-all active:scale-95"
              >
                <Plus size={14} />
              </button>
            </div>
            <div className="flex justify-between mt-2 text-[9px] text-slate-600 font-bold uppercase tracking-widest">
              <span>Min: 1</span>
              <span>Max: 50</span>
            </div>
          </div>
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className={`stat-card ${reviewsDue > 0 ? 'border-orange-500/30 bg-orange-500/5' : ''}`}>
          <div className={`text-[10px] mb-1 uppercase font-bold tracking-widest ${
            reviewsDue > 0 ? 'text-orange-400' : 'text-slate-500'
          }`}>
            Due Reviews
          </div>
          <div className={`text-3xl font-black ${reviewsDue > 0 ? 'text-orange-400' : 'text-slate-400'}`}>
            {reviewsDue}
          </div>
        </div>

        <div className="stat-card border-blue-500/30 bg-blue-500/5">
          <div className="text-[10px] text-blue-400 mb-1 uppercase font-bold tracking-widest">New Today</div>
          <div className="text-3xl font-black text-blue-400 flex items-baseline">
            {newAvailable}
            <span className="text-sm text-blue-400/40 ml-2 font-bold">/ {dailyLeft}</span>
          </div>
        </div>
      </div>

      {/* Daily progress */}
      <div>
        <div className="flex justify-between text-[9px] font-bold uppercase text-slate-500 tracking-widest mb-1.5">
          <span>Daily Intake</span>
          <span>{dailyNewCount} / {dailyNewLimit}</span>
        </div>
        <div className="progress-rail">
          <div
            className="progress-fill bg-slate-400"
            style={{ width: `${Math.min(100, (dailyNewCount / dailyNewLimit) * 100)}%` }}
          />
        </div>
      </div>

      {/* Actions */}
      <button
        onClick={onStart}
        disabled={reviewsDue === 0 && newAvailable === 0}
        className="w-full py-4 btn-primary rounded-xl"
      >
        {reviewsDue === 0 && newAvailable === 0 ? 'All Caught Up' : 'Start Session'}
      </button>

      <button onClick={onBack} className="w-full py-3 btn-ghost text-center">
        ← Back to Map
      </button>
    </section>
  );
};

export default SessionMenu;
