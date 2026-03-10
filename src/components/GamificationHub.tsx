import React from 'react';
import { Achievement, UserStats, BossRecord } from '../types';
import { Lock, Unlock, Swords } from 'lucide-react';
import { getXPProgress } from '../services/gamificationService';
import { getBossForIndex } from '../data/bossArt';
import StreakFlame from './StreakFlame';

interface GamificationHubProps {
  stats: UserStats;
  achievements: Achievement[];
  retention: number;
  onBack: () => void;
  bossRecords: BossRecord[];
  nextBossIndex: number;
}

const RING_STYLES = {
  none: 'border-[var(--border-color)] opacity-40',
  bronze: 'border-amber-600/60 bg-amber-500/5',
  silver: 'border-slate-400/60 bg-slate-400/5',
  gold: 'border-yellow-400/60 bg-yellow-400/10',
};

const RING_EMOJI = { none: '', bronze: '🥉', silver: '🥈', gold: '👑' };

const GamificationHub: React.FC<GamificationHubProps> = ({ stats, achievements, retention, onBack, bossRecords, nextBossIndex }) => {
  const { current, needed, percent } = getXPProgress(stats.xp);
  const nextLevelXp = (stats.level) * 100;

  return (
    <div className="max-w-md mx-auto space-y-6 animate-fade-in pb-12 pt-10">
      <button onClick={onBack} className="btn-ghost text-xs">&larr; Back</button>

      {/* Profile Header with Streak */}
      <div className="stat-card p-6 border-indigo-500/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 blur-3xl rounded-full -mr-12 -mt-12 pointer-events-none" />
        <div className="relative z-10 flex items-center gap-5">
          <StreakFlame streak={stats.streak} freezes={stats.streakFreezes ?? 0} size="lg" />
          <div className="flex-1 min-w-0 space-y-2">
            <h1 className="text-xl font-black text-[var(--text-primary)]">Level {stats.level}</h1>
            <p className="text-indigo-500 text-sm font-bold">{stats.xp} XP</p>
            <div>
              <div className="progress-rail">
                <div
                  className="progress-fill bg-gradient-to-r from-indigo-500 to-purple-500"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-2">
        <div className="stat-card text-center py-3 px-1">
          <div className="text-lg font-black text-amber-500">{stats.streak}</div>
          <div className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wide">Streak</div>
        </div>
        <div className="stat-card text-center py-3 px-1">
          <div className="text-lg font-black text-blue-500">{stats.totalReviews}</div>
          <div className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wide">Reviews</div>
        </div>
        <div className="stat-card text-center py-3 px-1">
          <div className="text-lg font-black text-[var(--text-primary)]">{stats.cardsLearned}</div>
          <div className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wide">Learned</div>
        </div>
        <div className="stat-card text-center py-3 px-1">
          <div className="text-lg font-black text-emerald-500">{retention}%</div>
          <div className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wide">Recall</div>
        </div>
      </div>

      {/* Boss Battle Trophy Room */}
      <div>
        <h2 className="text-sm font-black mb-3 text-[var(--text-secondary)] uppercase tracking-widest flex items-center gap-2">
          <Swords size={14} />
          Boss Battles
        </h2>
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: 22 }).map((_, i) => {
            const record = bossRecords.find(r => r.bossIndex === i);
            const boss = getBossForIndex(i);
            const isNext = i === nextBossIndex;
            const isLocked = i > nextBossIndex;
            const ring = record?.bestRing || 'none';

            return (
              <div
                key={i}
                className={`relative rounded-xl border-2 p-2 text-center transition-all ${
                  isNext
                    ? 'border-red-500/50 bg-red-500/5 animate-pulse-glow'
                    : record
                    ? RING_STYLES[ring]
                    : RING_STYLES.none
                }`}
              >
                {record && ring !== 'none' && (
                  <div className="text-sm mb-0.5">{RING_EMOJI[ring]}</div>
                )}
                {isLocked && !record && (
                  <Lock size={12} className="mx-auto mb-0.5 text-[var(--text-faint)]" />
                )}
                {isNext && !record && (
                  <Swords size={12} className="mx-auto mb-0.5 text-red-500" />
                )}
                <div className={`text-[9px] font-bold font-mono ${
                  record ? 'text-[var(--text-primary)]' : 'text-[var(--text-faint)]'
                }`}>
                  {i + 1}
                </div>
              </div>
            );
          })}
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
