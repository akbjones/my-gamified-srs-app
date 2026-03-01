import React, { useState } from 'react';
import { QuestCard } from '../types';
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

  const reviewsDue = filtered.filter(
    c => c.mastery > 0 && (c.dueDate ? c.dueDate <= now : true)
  ).length;

  const totalNewInTopic = filtered.filter(c => c.mastery === 0).length;
  const dailyLeft = Math.max(0, dailyNewLimit - dailyNewCount);
  const newAvailable = Math.min(totalNewInTopic, dailyLeft);

  const adjustLimit = (delta: number) => {
    const next = Math.max(1, Math.min(50, dailyNewLimit + delta));
    onUpdateLimit(next);
  };

  return (
    <section className="space-y-8 pt-10 animate-fade-in">
      <header className="flex justify-between items-start">
        <div className="space-y-1">
          <h1 className="text-xs tracking-[0.2em] text-blue-500 font-extrabold uppercase">
            {category}
          </h1>
          <h2 className="text-4xl font-black tracking-tighter text-slate-100 uppercase italic">
            {topicName}_
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTools(prev => !prev)}
            className={`p-2 border-2 transition-all ${
              showTools
                ? 'border-blue-500 text-blue-500 bg-blue-500/10'
                : 'border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-500'
            }`}
          >
            <Settings2 size={18} />
          </button>
          <button
            onClick={onSettings}
            className="text-2xl text-slate-600 hover:text-slate-400 transition-colors"
          >
            ⚙️
          </button>
        </div>
      </header>

      {/* Tools Panel */}
      {showTools && (
        <div className="border-2 border-slate-700 bg-slate-800/80 p-5 animate-fade-in space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Custom Study
            </h3>
            <button onClick={() => setShowTools(false)} className="text-slate-600 hover:text-slate-400">
              <X size={16} />
            </button>
          </div>

          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
              New Cards / Day
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => adjustLimit(-5)}
                className="w-10 h-10 border-2 border-slate-600 text-slate-400 flex items-center justify-center hover:border-slate-400 hover:text-slate-200 transition-all active:translate-y-0.5"
              >
                <Minus size={16} />
              </button>
              <button
                onClick={() => adjustLimit(-1)}
                className="w-10 h-10 border-2 border-slate-600 text-slate-400 flex items-center justify-center hover:border-slate-400 hover:text-slate-200 transition-all active:translate-y-0.5 text-xs font-bold"
              >
                -1
              </button>
              <div className="flex-1 text-center">
                <div className="text-3xl font-black text-slate-100">{dailyNewLimit}</div>
              </div>
              <button
                onClick={() => adjustLimit(1)}
                className="w-10 h-10 border-2 border-slate-600 text-slate-400 flex items-center justify-center hover:border-slate-400 hover:text-slate-200 transition-all active:translate-y-0.5 text-xs font-bold"
              >
                +1
              </button>
              <button
                onClick={() => adjustLimit(5)}
                className="w-10 h-10 border-2 border-slate-600 text-slate-400 flex items-center justify-center hover:border-slate-400 hover:text-slate-200 transition-all active:translate-y-0.5"
              >
                <Plus size={16} />
              </button>
            </div>
            <div className="flex justify-between mt-2 text-[9px] text-slate-600 font-bold uppercase tracking-widest">
              <span>Min: 1</span>
              <span>Max: 50</span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div
          className={`p-6 border-2 transition-colors ${
            reviewsDue > 0
              ? 'border-orange-500/50 bg-orange-500/10'
              : 'border-slate-700 bg-slate-800'
          }`}
        >
          <div
            className={`text-[10px] mb-1 uppercase font-bold tracking-widest ${
              reviewsDue > 0 ? 'text-orange-500' : 'text-slate-500'
            }`}
          >
            Due Reviews
          </div>
          <div
            className={`text-4xl font-black ${
              reviewsDue > 0 ? 'text-orange-500' : 'text-slate-400'
            }`}
          >
            {reviewsDue}
          </div>
        </div>

        <div className="p-6 border-2 border-blue-500/30 bg-blue-500/10">
          <div className="text-[10px] text-blue-500 mb-1 uppercase font-bold tracking-widest">
            New / Limit
          </div>
          <div className="text-4xl font-black text-blue-500 flex items-baseline">
            {newAvailable}
            <span className="text-sm text-blue-500/50 ml-2 font-bold">/ {dailyLeft}</span>
          </div>
        </div>
      </div>

      <div className="px-1">
        <div className="flex justify-between text-[10px] font-bold uppercase text-slate-500 mb-2">
          <span>Daily Intake</span>
          <span>{dailyNewCount} / {dailyNewLimit}</span>
        </div>
        <div className="h-3 w-full bg-slate-800 overflow-hidden border border-slate-700">
          <div
            className="h-full bg-slate-300 transition-all duration-500"
            style={{ width: `${(dailyNewCount / dailyNewLimit) * 100}%` }}
          />
        </div>
      </div>

      <button
        onClick={onStart}
        disabled={reviewsDue === 0 && newAvailable === 0}
        className="w-full py-6 bg-slate-100 disabled:bg-slate-700 disabled:text-slate-500 text-slate-900 text-sm tracking-[0.2em] font-bold uppercase transition-all btn-large hover:translate-y-1 disabled:hover:translate-y-0"
        style={{
          boxShadow: reviewsDue === 0 && newAvailable === 0 ? 'none' : '0 6px 0 #64748b',
        }}
      >
        {reviewsDue === 0 && newAvailable === 0 ? 'All Caught Up' : 'Initialize Session'}
      </button>

      <button
        onClick={onBack}
        className="w-full py-4 text-xs text-slate-500 font-bold uppercase tracking-widest underline decoration-2 underline-offset-4 hover:text-slate-300"
      >
        Return to Map
      </button>
    </section>
  );
};

export default SessionMenu;
