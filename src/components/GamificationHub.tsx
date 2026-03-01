import React from 'react';
import { Achievement, UserStats } from '../types';
import { Lock, Unlock } from 'lucide-react';
import { getXPProgress } from '../services/gamificationService';

interface GamificationHubProps {
  stats: UserStats;
  achievements: Achievement[];
  onBack: () => void;
}

const GamificationHub: React.FC<GamificationHubProps> = ({ stats, achievements, onBack }) => {
  const { current, needed, percent } = getXPProgress(stats.xp);
  const nextLevelXp = (stats.level) * 100;

  return (
    <div className="max-w-md mx-auto space-y-10 animate-fade-in pb-12">
      <button
        onClick={onBack}
        className="text-slate-500 text-xs font-bold uppercase tracking-widest hover:text-slate-300"
      >
        ← Return
      </button>

      {/* Profile Header */}
      <div className="bg-gradient-to-r from-indigo-900/50 to-slate-800 border-2 border-indigo-500/20 p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none" />
        <div className="relative z-10 flex items-center gap-6">
          <div className="w-20 h-20 bg-slate-900 border-4 border-indigo-500 flex items-center justify-center text-3xl">
            🧙‍♂️
          </div>
          <div className="flex-1 space-y-2">
            <h1 className="text-2xl font-black uppercase">Level {stats.level}</h1>
            <p className="text-indigo-400 text-sm font-bold">{stats.xp} XP Total</p>
            <div className="mt-3">
              <div className="flex justify-between text-[9px] font-black uppercase tracking-wider text-slate-500 mb-1">
                <span>To Level {stats.level + 1}</span>
                <span>{percent}%</span>
              </div>
              <div className="h-3 bg-slate-900 overflow-hidden border border-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <div className="text-right text-[9px] text-slate-600 mt-1 font-mono">
                {stats.xp} / {nextLevelXp} XP
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-800 border border-slate-700 p-4 text-center">
          <div className="text-2xl font-black text-amber-500">{stats.streak}</div>
          <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Streak</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 p-4 text-center">
          <div className="text-2xl font-black text-blue-500">{stats.totalReviews}</div>
          <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Reviews</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 p-4 text-center">
          <div className="text-2xl font-black text-emerald-500">{stats.cardsLearned}</div>
          <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Learned</div>
        </div>
      </div>

      {/* Achievements */}
      <div>
        <h2 className="text-xl font-black mb-4 flex items-center gap-3 uppercase">
          <span className="text-amber-400">🏆</span> Achievements
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {achievements.map(achievement => (
            <div
              key={achievement.id}
              className={`p-5 border-2 transition-all relative overflow-hidden group
                ${achievement.unlocked
                  ? 'bg-slate-800 border-indigo-500/30'
                  : 'bg-slate-900/50 border-slate-800 opacity-60 grayscale'
                }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="text-2xl">{achievement.icon}</div>
                {achievement.unlocked ? (
                  <Unlock size={14} className="text-green-400" />
                ) : (
                  <Lock size={14} className="text-slate-600" />
                )}
              </div>
              <h3
                className={`font-bold text-sm mb-1 ${
                  achievement.unlocked ? 'text-slate-100' : 'text-slate-500'
                }`}
              >
                {achievement.title}
              </h3>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                {achievement.description}
              </p>
              {achievement.unlocked && (
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GamificationHub;
