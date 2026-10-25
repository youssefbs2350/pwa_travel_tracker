import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface OfflineContextType {
  isOnline: boolean;
  isForcedOffline: boolean;
  canInstall: boolean;
  isInstalled: boolean;
  pendingSyncCount: number;
  toggleForceOffline: () => void;
  promptInstall: () => Promise<boolean>;
  syncData: () => Promise<void>;
  refreshPendingCount: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export const OfflineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [networkOnline, setNetworkOnline] = useState<boolean>(navigator.onLine);
  const [isForcedOffline, setIsForcedOffline] = useState<boolean>(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);

  const refreshPendingCount = async () => {
    try {
      const count = await api.syncQueue.count();
      setPendingSyncCount(count);
    } catch {
      setPendingSyncCount(0);
    }
  };

  useEffect(() => {
    refreshPendingCount();

    const handleOnline = async () => {
      setNetworkOnline(true);
      await refreshPendingCount();
      // Auto-sync when coming back online
      if (!isForcedOffline) {
        await api.syncQueue.replay();
        await refreshPendingCount();
      }
    };

    const handleOffline = () => {
      setNetworkOnline(false);
      refreshPendingCount();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // PWA install prompt handler
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setCanInstall(true);
      console.log('[PWA] Événement beforeinstallprompt capturé avec succès. Application téléchargeable et installable !');
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
      setDeferredPrompt(null);
      console.log('[PWA] Application installée avec succès sur le système.');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    const interval = setInterval(refreshPendingCount, 4000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
      clearInterval(interval);
    };
  }, [isForcedOffline]);

  const isOnline = !isForcedOffline && networkOnline;

  const toggleForceOffline = async () => {
    const next = !isForcedOffline;
    setIsForcedOffline(next);
    if (!next) {
      // Re-enabled online: sync to MongoDB
      await api.syncQueue.replay();
      await refreshPendingCount();
    }
  };

  const promptInstall = async (): Promise<boolean> => {
    if (!deferredPrompt) {
      return false;
    }
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      setIsInstalled(true);
      setCanInstall(false);
      setDeferredPrompt(null);
      return true;
    }
    return false;
  };

  const syncData = async () => {
    if (!isOnline) return;
    await api.syncQueue.replay();
    await refreshPendingCount();
  };

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        isForcedOffline,
        canInstall,
        isInstalled,
        pendingSyncCount,
        toggleForceOffline,
        promptInstall,
        syncData,
        refreshPendingCount
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
};
