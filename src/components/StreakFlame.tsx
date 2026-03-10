import React from 'react';
import { StreakTier } from '../types';
import { getStreakTier } from '../services/gamificationService';
import { Zap, Flame, Snowflake } from 'lucide-react';

interface StreakFlameProps {
  streak: number;
  freezes: number;
  size?: 'sm' | 'lg';
}

const TIER_CONFIG: Record<StreakTier, { emoji: string; color: string; label: string; glowClass: string }> = {
  none: { emoji: '', color: 'text-[var(--text-muted)]', label: '', glowClass: '' },
  small: { emoji: '', color: 'text-orange-500', label: '', glowClass: '' },
  big: { emoji: '', color: 'text-orange-500', label: '', glowClass: 'drop-shadow-[0_0_6px_rgba(249,115,22,0.4)]' },
  blue: { emoji: '', color: 'text-blue-400', label: '', glowClass: 'drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]' },
  lightning: { emoji: '', color: 'text-yellow-400', label: '', glowClass: 'drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]' },
};

const StreakFlame: React.FC<StreakFlameProps> = ({ streak, freezes, size = 'lg' }) => {
  const tier = getStreakTier(streak);
  const config = TIER_CONFIG[tier];
  const isLg = size === 'lg';

  return (
    <div className="flex flex-col items-center">
      {/* Flame / icon */}
      <div className={`flex items-center justify-center ${config.glowClass}`}>
        {tier === 'lightning' ? (
          <Zap
            size={isLg ? 36 : 14}
            className={`${config.color} fill-yellow-400 animate-flame`}
          />
        ) : tier === 'none' ? (
          <div className={`${isLg ? 'text-2xl' : 'text-sm'} ${config.color}`}>
            <Flame size={isLg ? 28 : 14} className="text-[var(--text-faint)]" />
          </div>
        ) : (
          <Flame
            size={isLg ? (tier === 'big' || tier === 'blue' ? 36 : 28) : 14}
            className={`${config.color} ${tier !== 'small' ? 'fill-current' : ''} animate-flame`}
          />
        )}
      </div>

      {/* Streak count */}
      <div className={`font-black font-mono ${config.color} ${isLg ? 'text-3xl mt-1' : 'text-[10px]'}`}>
        {streak}{isLg ? '' : 'd'}
      </div>
      {isLg && (
        <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mt-0.5">
          {streak === 1 ? 'day' : 'days'}
        </div>
      )}

      {/* Freeze indicators */}
      {isLg && freezes > 0 && (
        <div className="flex gap-1 mt-2">
          {Array.from({ length: freezes }).map((_, i) => (
            <Snowflake key={i} size={12} className="text-cyan-400" />
          ))}
        </div>
      )}
    </div>
  );
};

export default StreakFlame;
