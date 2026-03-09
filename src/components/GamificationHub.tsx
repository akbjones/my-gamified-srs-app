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
      <button onClick={onBack} className="btn-ghost text-xs">&larr; Back</button>

      {/* Profile Header */}
      <div className="stat-card p-6 border-indigo-500/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 blur-3xl rounded-full -mr-12 -mt-12 pointer-events-none" />
        <div className="relative z-10 flex items-center gap-5">
          <div className="w-16 h-16 bg-[var(--bg-inset)] rounded-2xl border-2 border-indigo-500/40 flex items-center justify-center shrink-0">
            <span className="text-2xl font-black font-mono text-indigo-500">{stats.level}</span>
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <h1 className="text-xl font-black text-[var(--text-primary)]">Level {stats.level}</h1>
            <p className="text-indigo-500 text-sm font-bold">{stats.xp} XP</p>
            <div>
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                <span>Next Level</span>
                <span>{percent}%</span>
              </div>
              <div className="progress-rail">
                <div
                  className="progress-fill bg-gradient-to-r from-indigo-500 to-purple-500"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <div className="text-right text-[10px] text-[var(--text-muted)] mt-1 font-mono">
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
          <div className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">Streak</div>
        </div>
        <div className="stat-card text-center py-3">
          <div className="text-xl font-black text-blue-500">{stats.totalReviews}</div>
          <div className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">Reviews</div>
        </div>
        <div className="stat-card text-center py-3">
          <div className="text-xl font-black text-[var(--text-primary)]">{stats.cardsLearned}</div>
          <div className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">Learned</div>
        </div>
        <div className="stat-card text-center py-3">
          <div className="text-xl font-black text-emerald-500">{retention}%</div>
          <div className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">Retention</div>
        </div>
      </div>

      {/* Achievements */}
      <div>
        <h2 className="text-sm font-black mb-3 text-[var(--text-secondary)] uppercase tracking-widest">Achievements</h2>
        <div className="grid grid-cols-2 gap-3">
          {achievements.map(achievement => (
            <div
              key={achievement.id}
              className={`stat-card transition-all relative overflow-hidden group ${
                achievement.unlocked
                  ? 'border-indigo-500/30'
                  : 'opacity-50 grayscale'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="w-10 h-10 rounded-xl bg-[var(--bg-inset)] border border-[var(--border-color)] flex items-center justify-center text-xs font-black font-mono text-[var(--text-secondary)]">
                  {achievement.icon}
                </div>
                {achievement.unlocked ? (
                  <Unlock size={12} className="text-emerald-500" />
                ) : (
                  <Lock size={12} className="text-[var(--text-muted)]" />
                )}
              </div>
              <h3 className={`font-bold text-sm mb-0.5 ${
                achievement.unlocked ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'
              }`}>
                {achievement.title}
              </h3>
              <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">
                {achievement.description}
              </p>
              {achievement.unlocked && (
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-xl" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GamificationHub;
