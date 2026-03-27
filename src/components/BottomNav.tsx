import React from 'react';
import { Home, BookOpen, Map, BarChart3 } from 'lucide-react';

export type Tab = 'home' | 'study' | 'map' | 'stats';

interface BottomNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const tabs: { id: Tab; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'study', label: 'Study', icon: BookOpen },
  { id: 'map', label: 'Map', icon: Map },
  { id: 'stats', label: 'Stats', icon: BarChart3 },
];

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[var(--bg-card)] border-t border-[var(--border-color)] lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {tabs.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
                isActive ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'
              }`}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-semibold leading-none">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
