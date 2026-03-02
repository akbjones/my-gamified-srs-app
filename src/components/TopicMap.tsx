import React, { useRef, useEffect } from 'react';
import { QuestCard } from '../types';
import { MAIN_PATH, SIDE_BRANCHES, isNodeUnlocked } from '../data/topicConfig';
import { ChevronLeft, Lock, Check } from 'lucide-react';

interface TopicMapProps {
  cards: QuestCard[];
  onBack: () => void;
}

const TopicMap: React.FC<TopicMapProps> = ({ cards, onBack }) => {
  const activeRef = useRef<HTMLDivElement>(null);

  const getNodeProgress = (nodeId: string) => {
    const nodeCards = cards.filter(c => c.topic === nodeId);
    if (nodeCards.length === 0) return { graduated: 0, total: 0, percent: 0 };
    const graduated = nodeCards.filter(c => c.mastery === 2).length;
    return { graduated, total: nodeCards.length, percent: Math.round((graduated / nodeCards.length) * 100) };
  };

  const getReviewCount = (nodeId: string) => {
    const now = Date.now();
    return cards.filter(
      c => c.topic === nodeId && c.mastery > 0 && (c.dueDate ? c.dueDate <= now : true)
    ).length;
  };

  const getTotalProgress = () => {
    if (cards.length === 0) return 0;
    return Math.round((cards.filter(c => c.mastery === 2).length / cards.length) * 100);
  };

  // Find the first incomplete unlocked node (the "current" node)
  const currentNodeIndex = MAIN_PATH.findIndex((node, idx) => {
    if (!isNodeUnlocked(idx, cards)) return false;
    const { percent } = getNodeProgress(node.id);
    return percent < 100;
  });

  // Auto-scroll to the current active node
  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  return (
    <section className="animate-fade-in min-h-screen pb-24">
      {/* Header */}
      <header className="flex items-center justify-between py-5 mb-4">
        <button onClick={onBack} className="btn-ghost flex items-center gap-1">
          <ChevronLeft size={16} />
          <span>Back</span>
        </button>
        <div className="text-center">
          <h1 className="text-lg font-black uppercase tracking-tight">Spanish</h1>
        </div>
        <div className="text-sm font-black text-blue-500">{getTotalProgress()}%</div>
      </header>

      {/* Linear path */}
      <div className="relative pl-8">
        {/* Trunk line */}
        <div className="absolute left-[15px] top-0 bottom-0 w-[2px] bg-slate-800" />

        {MAIN_PATH.map((node, idx) => {
          const unlocked = isNodeUnlocked(idx, cards);
          const { graduated, total, percent } = getNodeProgress(node.id);
          const reviews = getReviewCount(node.id);
          const isComplete = percent >= 100;
          const isCurrent = idx === currentNodeIndex;
          const prevTier = idx > 0 ? MAIN_PATH[idx - 1].tier : null;
          const showTierLabel = node.tier !== prevTier;

          // Side branches that unlock at this node
          const sideBranches = (node.sideBranchIds || [])
            .map(id => SIDE_BRANCHES.find(sb => sb.id === id))
            .filter(Boolean);

          return (
            <div key={node.id}>
              {/* Tier divider */}
              {showTierLabel && (
                <div className="flex items-center gap-2 mb-3 -ml-8 mt-2">
                  <div className="w-1.5 h-5 rounded-full" style={{ background: unlocked ? node.color : '#334155' }} />
                  <span
                    className="text-[10px] font-black uppercase tracking-widest"
                    style={{ color: unlocked ? node.color : '#475569' }}
                  >
                    {node.tier}
                  </span>
                </div>
              )}

              {/* Node */}
              <div
                ref={isCurrent ? activeRef : undefined}
                className="relative mb-4"
              >
                {/* Dot on trunk line */}
                <div
                  className={`absolute -left-8 top-4 w-[12px] h-[12px] rounded-full border-2 z-10 ${
                    isComplete
                      ? 'border-emerald-500 bg-emerald-500'
                      : isCurrent
                        ? 'border-blue-500 bg-blue-500 animate-pulse-glow'
                        : unlocked
                          ? 'border-slate-500 bg-slate-800'
                          : 'border-slate-700 bg-slate-900'
                  }`}
                  style={{ left: '-21px' }}
                />

                {/* Node card */}
                <div
                  className={`w-full text-left rounded-xl p-4 transition-all relative ${
                    !unlocked
                      ? 'bg-slate-800/20 border border-slate-800/50 opacity-35'
                      : isCurrent
                        ? 'stat-card border-blue-500/30'
                        : isComplete
                          ? 'stat-card border-emerald-500/20'
                          : 'stat-card'
                  }`}
                >
                  {/* Review badge */}
                  {reviews > 0 && unlocked && (
                    <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center z-10">
                      {reviews}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {!unlocked && <Lock size={14} className="text-slate-700" />}
                      {isComplete && <Check size={14} className="text-emerald-500" />}
                      <span className={`font-bold text-sm ${
                        !unlocked ? 'text-slate-600' : 'text-slate-200'
                      }`}>
                        {node.name}
                      </span>
                    </div>
                    {unlocked && (
                      <span className={`text-xs font-bold ${
                        isComplete ? 'text-emerald-500' : percent > 0 ? 'text-blue-400' : 'text-slate-600'
                      }`}>
                        {graduated}/{total}
                      </span>
                    )}
                  </div>

                  {unlocked && (
                    <div className="progress-rail mt-2.5">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${percent}%`,
                          background: isComplete ? '#22c55e' : node.color,
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Side branches */}
                {sideBranches.length > 0 && unlocked && (
                  <div className="ml-6 mt-2 space-y-1.5">
                    {sideBranches.map(sb => sb && (
                      <div
                        key={sb.id}
                        className="flex items-center gap-2 py-2 px-3 rounded-lg bg-slate-800/30 border border-slate-800/50 opacity-50"
                      >
                        <span className="text-xs">{sb.icon}</span>
                        <span className="text-[10px] font-bold text-slate-500">{sb.name}</span>
                        <span className="text-[8px] font-bold text-slate-600 uppercase tracking-wider ml-auto">Soon</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default TopicMap;
