import React from 'react';
import { Home, LayoutGrid, PlusCircle, MessageSquare, User as UserIcon } from 'lucide-react';

export type ActiveTab = 'home' | 'categories' | 'sell' | 'messages' | 'profile';

interface BottomNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  unreadMessagesCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  unreadMessagesCount
}) => {
  const tabs = [
    { id: 'home' as ActiveTab, label: 'Home', icon: Home },
    { id: 'categories' as ActiveTab, label: 'Categories', icon: LayoutGrid },
    { id: 'sell' as ActiveTab, label: 'Sell Now', icon: PlusCircle, isPrimary: true },
    { id: 'messages' as ActiveTab, label: 'Messages', icon: MessageSquare, badge: unreadMessagesCount },
    { id: 'profile' as ActiveTab, label: 'Account', icon: UserIcon }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-lg border-t border-slate-800/90 text-slate-300 pb-safe md:hidden shadow-2xl">
      <div className="grid grid-cols-5 items-center h-16 max-w-md mx-auto px-1.5">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          if (tab.isPrimary) {
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className="flex flex-col items-center justify-center -mt-5 relative group cursor-pointer focus:outline-hidden"
                aria-label="Sell a product on ANATECH MARKET"
              >
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-cyan-500 via-teal-400 to-amber-400 text-slate-950 flex items-center justify-center shadow-lg shadow-cyan-500/30 group-active:scale-95 transition-all border-3 border-slate-900 dark:border-slate-950 ring-2 ring-cyan-400/30">
                  <Icon className="w-6 h-6 stroke-[2.5]" />
                </div>
                <span className="text-[10px] font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 to-amber-300 bg-clip-text text-transparent mt-1">
                  {tab.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center min-h-[48px] py-1 transition-all relative cursor-pointer focus:outline-hidden ${
                isActive ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-115 text-cyan-400 drop-shadow-[0_2px_8px_rgba(6,182,212,0.4)]' : ''}`} />
                {typeof tab.badge === 'number' && tab.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-[9px] font-black flex items-center justify-center shadow-xs">
                    {tab.badge > 9 ? '9+' : tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] tracking-tight mt-1 truncate max-w-[60px] ${isActive ? 'text-cyan-300 font-bold' : 'text-slate-400 font-medium'}`}>
                {tab.label}
              </span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee] mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
