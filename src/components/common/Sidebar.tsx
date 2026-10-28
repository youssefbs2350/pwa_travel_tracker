import React from 'react';
import { 
  LayoutDashboard, 
  Map, 
  Compass, 
  CalendarDays, 
  Wallet, 
  Sparkles, 
  AlertCircle, 
  Users, 
  Shield,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export interface TabItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
  adminOnly?: boolean;
}

export const navigationTabs: TabItem[] = [
  { id: 'overview', label: 'Vue d\'ensemble', icon: LayoutDashboard },
  { id: 'trips', label: 'Voyages', icon: Compass },
  { id: 'places', label: 'Destinations & Carte', icon: Map },
  { id: 'activities', label: 'Planning & Activités', icon: CalendarDays },
  { id: 'budget', label: 'Budget & Dépenses', icon: Wallet },
  { id: 'memories', label: 'Avis & Souvenirs', icon: Sparkles },
  { id: 'complaints', label: 'Réclamations', icon: AlertCircle },
  { id: 'profile', label: 'Mon Profil', icon: UserCheck },
  { id: 'admin-users', label: 'Gestion Users', icon: Shield, badge: 'Admin', adminOnly: true },
];

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tabId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const { isAdmin } = useAuth();

  // Filter tabs: hide admin-users from non-admins, and hide 'memories' & 'profile' from Admin per user specification
  const visibleTabs = navigationTabs.filter(tab => {
    if (tab.adminOnly && !isAdmin) return false;
    if (isAdmin && (tab.id === 'memories' || tab.id === 'profile')) return false;
    return true;
  });

  return (
    <>
      {/* Desktop Sidebar (Left) */}
      <aside aria-label="Navigation principale" className="hidden lg:flex flex-col w-64 bg-slate-900 border-r border-slate-800 p-4 space-y-6 flex-shrink-0 min-h-[calc(100vh-4rem)]">
        <div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
            Navigation
          </div>
          <nav className="space-y-1">
            {visibleTabs.map(tab => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectTab(tab.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? tab.adminOnly
                        ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 font-extrabold shadow-md'
                        : 'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-md shadow-brand-500/20 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center space-x-3 truncate">
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? (tab.adminOnly ? 'text-slate-950' : 'text-white') : 'text-slate-400'}`} />
                    <span className="truncate">{tab.label}</span>
                  </div>
                  {tab.badge && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                      isActive ? 'bg-slate-950 text-amber-300' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav aria-label="Navigation mobile" className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 py-1 px-2">
        <div className="flex items-center justify-around overflow-x-auto scrollbar-none py-1">
          {visibleTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`flex flex-col items-center justify-center p-1 rounded-lg min-w-[56px] transition-colors ${
                  isActive ? 'text-brand-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-5 h-5 mb-0.5" />
                <span className="text-[10px] truncate max-w-[56px]">{tab.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
