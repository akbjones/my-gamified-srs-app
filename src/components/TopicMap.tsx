import React, { useState } from 'react';
import { QuestCard } from '../types';
import { SKILL_TREE, UNLOCK_THRESHOLD } from '../data/topicConfig';
import { ChevronLeft, ChevronRight, Target } from 'lucide-react';

interface TopicMapProps {
  cards: QuestCard[];
  onSelectTopic: (topicId: string, category: string) => void;
  onBack: () => void;
}

type ViewFocus = 'LEFT' | 'CENTER' | 'RIGHT';

const TopicMap: React.FC<TopicMapProps> = ({ cards, onSelectTopic, onBack }) => {
  const [focus, setFocus] = useState<ViewFocus>('CENTER');

  const getTopicProgress = (topicId: string) => {
    const topicCards = cards.filter(c => c.topic === topicId);
    if (topicCards.length === 0) return 0;
    const mastered = topicCards.filter(c => c.mastery === 2).length;
    return Math.round((mastered / topicCards.length) * 100);
  };

  const getTierProgress = (tier: string) => {
    const tierCards = cards.filter(c => c.category === tier);
    if (tierCards.length === 0) return 0;
    const mastered = tierCards.filter(c => c.mastery === 2).length;
    return Math.round((mastered / tierCards.length) * 100);
  };

  const getTotalProgress = () => {
    if (cards.length === 0) return 0;
    const mastered = cards.filter(c => c.mastery === 2).length;
    return Math.round((mastered / cards.length) * 100);
  };

  const getReviewCount = (topicId: string) => {
    const now = Date.now();
    return cards.filter(
      c => c.topic === topicId && c.mastery > 0 && (c.dueDate ? c.dueDate <= now : true)
    ).length;
  };

  // Unlock logic: need 70% mastery in previous tier
  const tierUnlockStatus = SKILL_TREE.map((tier, idx) => {
    if (idx === 0) return false; // Novice always unlocked
    const prevTier = SKILL_TREE[idx - 1];
    const prevProgress = getTierProgress(prevTier.tier);
    return prevProgress < UNLOCK_THRESHOLD * 100;
  });

  const BOX_WIDTH = 'w-72';
  const BOX_PX = 288;
  const GAP_PX = 48;
  const SHIFT_AMOUNT = BOX_PX + GAP_PX;

  const getTransform = () => {
    if (focus === 'LEFT') return `translateX(${SHIFT_AMOUNT}px)`;
    if (focus === 'RIGHT') return `translateX(-${SHIFT_AMOUNT}px)`;
    return 'translateX(0px)';
  };

  const Trunk = ({ height = 'h-12', locked = false }: { height?: string; locked?: boolean }) => (
    <div className={`trunk-line ${height} ${locked ? 'opacity-30' : ''}`}
      style={{ background: locked ? '#334155' : '#e2e8f0' }}
    />
  );

  const CategoryHeader = ({ title, locked = false, color }: { title: string; locked?: boolean; color: string }) => (
    <div className="flex flex-col items-center">
      <Trunk height="h-10" locked={locked} />
      <div
        className={`${BOX_WIDTH} flex items-center justify-center py-3 border-3 text-white font-black tracking-[0.4em] z-30 uppercase text-[14px]`}
        style={{
          background: locked ? '#1e293b' : color,
          borderColor: locked ? '#334155' : color,
          opacity: locked ? 0.4 : 1,
          boxShadow: locked ? 'none' : `0 6px 0 ${color}44`,
        }}
      >
        {locked && '🔒 '}{title}
      </div>
      <Trunk height="h-8" locked={locked} />
    </div>
  );

  const NavArrow = ({ direction, onClick, isFlashing }: { direction: 'LEFT' | 'RIGHT'; onClick: () => void; isFlashing?: boolean }) => (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={`absolute top-1/2 -translate-y-1/2 text-blue-500 transition-all z-[100]
        ${direction === 'LEFT' ? 'left-[-64px]' : 'right-[-64px]'}
        ${isFlashing ? 'nav-flash' : 'opacity-80'}
      `}
    >
      {direction === 'LEFT' ? <ChevronLeft size={48} strokeWidth={5} /> : <ChevronRight size={48} strokeWidth={5} />}
    </button>
  );

  const ModuleBox = ({ label, topicId, tier, isLocked, onClick, children, hasLeftContent, hasRightContent }: {
    label: string; topicId: string; tier: string; isLocked?: boolean; onClick: () => void;
    children?: React.ReactNode; hasLeftContent?: boolean; hasRightContent?: boolean;
  }) => {
    const percent = getTopicProgress(topicId);
    const reviewCount = getReviewCount(topicId);
    const hasCards = cards.some(c => c.topic === topicId);

    return (
      <div className="flex flex-col items-center relative z-20">
        {!isLocked && label === '1' && focus === 'CENTER' && (
          <>
            {hasLeftContent && <NavArrow direction="LEFT" onClick={() => setFocus('LEFT')} isFlashing />}
            {hasRightContent && <NavArrow direction="RIGHT" onClick={() => setFocus('RIGHT')} isFlashing />}
          </>
        )}

        <button
          onClick={onClick}
          disabled={isLocked || !hasCards}
          className={`${BOX_WIDTH} p-8 module-block relative ${isLocked || !hasCards ? 'locked' : 'active'}`}
        >
          {!isLocked && reviewCount > 0 && (
            <div className="absolute -top-4 -right-4 bg-red-600 text-white text-[14px] font-black w-10 h-10 flex items-center justify-center border-2 border-slate-300 z-30">
              {reviewCount}
            </div>
          )}

          <div className="flex justify-center w-full">
            <span className="text-5xl font-black text-slate-100">{label}</span>
          </div>

          <div className="w-full mt-6">
            <div className="progress-rail border-2 border-slate-600">
              {!isLocked && <div className="progress-fill" style={{ width: `${percent}%` }} />}
            </div>
            {!isLocked && hasCards && (
              <div className="flex justify-between mt-2 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                <span>Mastery</span>
                <span>{percent}%</span>
              </div>
            )}
            {!isLocked && !hasCards && (
              <div className="text-center mt-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                Coming Soon
              </div>
            )}
          </div>
        </button>
        {children}
      </div>
    );
  };

  const SideColumn = ({ title, options, locked = false, direction = 'left' }: {
    title: string; options: { label: string; topicId: string; tier: string; onClick: () => void }[];
    locked?: boolean; direction?: 'left' | 'right';
  }) => (
    <div className={`absolute top-[64px] flex items-center z-10
      ${direction === 'left' ? 'right-[calc(100%+48px)]' : 'left-[calc(100%+48px)]'}`}
    >
      <div className="flex flex-col items-center translate-y-[-32px] relative">
        {!locked && focus !== 'CENTER' && (
          <button
            onClick={() => setFocus('CENTER')}
            className={`absolute top-[-60px] ${direction === 'left' ? 'right-4' : 'left-4'} text-blue-500 hover:scale-110 transition-transform flex flex-col items-center gap-1`}
          >
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Center</span>
            {direction === 'left' ? <ChevronRight size={48} strokeWidth={6} /> : <ChevronLeft size={48} strokeWidth={6} />}
          </button>
        )}

        <div
          className={`absolute h-[6px] w-[48px] top-8 ${direction === 'left' ? 'left-full' : 'right-full'}`}
          style={{ background: locked ? '#334155' : '#e2e8f0' }}
        />

        <div className={`text-[12px] font-black tracking-widest uppercase h-14 ${BOX_WIDTH} flex items-center justify-center px-4 border-2 whitespace-nowrap relative z-20
          ${locked ? 'text-slate-600 border-slate-700 bg-slate-800/50' : 'text-slate-200 border-slate-500 bg-slate-800'}`}
          style={{ boxShadow: locked ? 'none' : '0 6px 0 #0f172a' }}
        >
          {title}
        </div>

        {options.map((opt, idx) => {
          const hasCards = cards.some(c => c.topic === opt.topicId);
          return (
            <React.Fragment key={idx}>
              <div className="trunk-line h-10" style={{ background: locked ? '#334155' : '#475569' }} />
              <button
                onClick={opt.onClick}
                disabled={locked || !hasCards}
                className={`${BOX_WIDTH} py-6 px-4 module-block relative
                  ${locked || !hasCards ? 'locked' : 'active'}`}
              >
                <span className="text-sm font-black tracking-widest uppercase text-slate-300">{opt.label}</span>
                <div className="mt-3 w-full h-2 border-2 border-slate-600 overflow-hidden bg-slate-900">
                  <div className="h-full bg-blue-500" style={{ width: `${getTopicProgress(opt.topicId)}%` }} />
                </div>
                {!hasCards && !locked && (
                  <div className="text-[9px] text-slate-600 font-bold uppercase mt-2 tracking-widest">Coming Soon</div>
                )}
                {getReviewCount(opt.topicId) > 0 && !locked && hasCards && (
                  <div className="absolute -top-2 -right-2 w-7 h-7 bg-red-600 border-2 border-slate-300 flex items-center justify-center text-[12px] text-white font-black">!</div>
                )}
              </button>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );

  return (
    <section className="pt-1 pb-32 animate-fade-in w-full min-h-screen overflow-x-hidden relative">
      <header className="flex items-center justify-between px-4 sticky left-0 right-0 top-0 bg-slate-900 text-slate-100 z-[110] py-6 border-b-4 border-slate-600 mb-0">
        <button onClick={onBack} className="bg-slate-700 text-white p-2 hover:bg-slate-600 transition-colors">
          <ChevronLeft size={24} />
        </button>
        <div className="flex flex-col items-center">
          <h1 className="text-2xl font-black tracking-tighter uppercase italic leading-none">Spanish</h1>
          <div className="flex items-center gap-2 mt-1">
            <Target size={14} className="text-blue-500" />
            <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Protocol V3</span>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <div className="text-[14px] font-black text-slate-300 uppercase">{getTotalProgress()}%</div>
        </div>
      </header>

      <div
        className="flex flex-col items-center w-full px-4 relative mx-auto mt-8 grid-viewport"
        style={{ transform: getTransform() }}
      >
        {SKILL_TREE.map((tier, tierIdx) => {
          const isLocked = tierUnlockStatus[tierIdx];
          const hasLeft = !!tier.sideLeft;
          const hasRight = !!tier.sideRight;

          return (
            <React.Fragment key={tier.tier}>
              <CategoryHeader title={tier.tier} locked={isLocked} color={tier.color} />

              {tier.mainTopics.map((topic, topicIdx) => (
                <React.Fragment key={topic.id}>
                  <ModuleBox
                    label={String(topicIdx + 1)}
                    topicId={topic.id}
                    tier={tier.tier}
                    isLocked={isLocked}
                    onClick={() => onSelectTopic(topic.id, tier.tier)}
                    hasLeftContent={topicIdx === 0 && hasLeft && !isLocked}
                    hasRightContent={topicIdx === 0 && hasRight && !isLocked}
                  >
                    {topicIdx === 0 && tier.sideLeft && (
                      <SideColumn
                        title={tier.sideLeft.title}
                        direction="left"
                        locked={isLocked}
                        options={tier.sideLeft.topics.map(t => ({
                          label: t.name,
                          topicId: t.id,
                          tier: tier.tier,
                          onClick: () => onSelectTopic(t.id, tier.tier),
                        }))}
                      />
                    )}
                    {topicIdx === 0 && tier.sideRight && (
                      <SideColumn
                        title={tier.sideRight.title}
                        direction="right"
                        locked={isLocked}
                        options={tier.sideRight.topics.map(t => ({
                          label: t.name,
                          topicId: t.id,
                          tier: tier.tier,
                          onClick: () => onSelectTopic(t.id, tier.tier),
                        }))}
                      />
                    )}
                  </ModuleBox>

                  {topicIdx < tier.mainTopics.length - 1 && <Trunk height="h-8" locked={isLocked} />}
                </React.Fragment>
              ))}
            </React.Fragment>
          );
        })}

        <div className="h-64" />
      </div>
    </section>
  );
};

export default TopicMap;
