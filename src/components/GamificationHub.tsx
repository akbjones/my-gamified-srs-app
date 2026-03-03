import React from 'react';
import { Achievement, UserStats } from '../types';
import { Lock, Unlock } from 'lucide-react';
import { getXPProgress } from '../services/gamificationService';

interface GamificationHubProps {
  stats: UserStats;
  achievements: Achievement[];
  retention: number;
  onBack: () => void;
}

const GamificationHub: React.FC<GamificationHubProps> = ({ stats, achievements, retention, onBack }) => {
  const { current, needed, percent } = getXPProgress(stats.xp);
  const nextLevelXp = (stats.level) * 100;

  return (
    <div className="max-w-md mx-auto space-y-6 animate-fade-in pb-12 pt-10">
      <button onClick={onBack} className="btn-ghost text-xs">← Back</button>

      {/* Profile Header */}
      <div className="stat-card p-6 border-indigo-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-100/50 blur-3xl rounded-full -mr-12 -mt-12 pointer-events-none" />
        <div className="relative z-10 flex items-center gap-5">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl border-2 border-indigo-300 flex items-center justify-center text-2xl shrink-0">
            🧙‍♂️
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <h1 className="text-xl font-black text-slate-800">Level {stats.level}</h1>
            <p className="text-indigo-500 text-sm font-bold">{stats.xp} XP</p>
            <div>
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                <span>Next Level</span>
                <span>{percent}%</span>
              </div>
              <div className="progress-rail">
                <div
                  className="progress-fill bg-gradient-to-r from-indigo-500 to-purple-500"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <div className="text-right text-[10px] text-slate-400 mt-1 font-mono">
                {stats.xp} / {nextLevelXp}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-2">
        <div className="stat-card text-center py-3">
          <div className="text-xl font-black text-amber-500">{stats.streak}</div>
          <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Streak</div>
        </div>
        <div className="stat-card text-center py-3">
          <div className="text-xl font-black text-blue-500">{stats.totalReviews}</div>
          <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Reviews</div>
        </div>
        <div className="stat-card text-center py-3">
          <div className="text-xl font-black text-slate-700">{stats.cardsLearned}</div>
          <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Learned</div>
        </div>
        <div className="stat-card text-center py-3">
          <div className="text-xl font-black text-emerald-500">{retention}%</div>
          <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Retention</div>
        </div>
      </div>

      {/* Achievements */}
      <div>
        <h2 className="text-sm font-black mb-3 text-slate-400 uppercase tracking-widest">Achievements</h2>
        <div className="grid grid-cols-2 gap-3">
          {achievements.map(achievement => (
            <div
              key={achievement.id}
              className={`stat-card transition-all relative overflow-hidden group ${
                achievement.unlocked
                  ? 'border-indigo-200'
                  : 'opacity-50 grayscale'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="text-xl">{achievement.icon}</div>
                {achievement.unlocked ? (
                  <Unlock size={12} className="text-emerald-500" />
                ) : (
                  <Lock size={12} className="text-slate-400" />
                )}
              </div>
              <h3 className={`font-bold text-sm mb-0.5 ${
                achievement.unlocked ? 'text-slate-800' : 'text-slate-400'
              }`}>
                {achievement.title}
              </h3>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                {achievement.description}
              </p>
              {achievement.unlocked && (
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-xl" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GamificationHub;
