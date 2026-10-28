import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { useOffline } from '../../context/OfflineContext';

export const OfflineBanner: React.FC = () => {
  const { isOnline, pendingSyncCount } = useOffline();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-amber-500 text-slate-950 px-3 py-1.5 text-xs font-bold flex items-center justify-center space-x-2 shadow-md sticky top-0 z-50 transition-all border-b border-amber-600"
    >
      <WifiOff className="w-3.5 h-3.5 flex-shrink-0 animate-pulse text-slate-950" />
      <span>Vous n'êtes pas connecté à Internet (Mode Hors-Ligne actif)</span>
      {pendingSyncCount > 0 && (
        <span className="inline-flex items-center space-x-1 bg-slate-950 text-amber-300 px-2 py-0.5 rounded-full text-[10px] font-extrabold ml-1">
          <RefreshCw className="w-2.5 h-2.5 animate-spin" />
          <span>{pendingSyncCount} en attente</span>
        </span>
      )}
    </div>
  );
};
