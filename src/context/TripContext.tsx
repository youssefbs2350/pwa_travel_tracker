import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Trip } from '../types';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

interface TripContextType {
  trips: Trip[];
  activeTrip: Trip | null;
  activeTripId: string | null;
  isLoading: boolean;
  setActiveTripId: (id: string | null) => void;
  addTrip: (tripData: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Trip>;
  updateTrip: (id: string, updates: Partial<Trip>) => Promise<void>;
  deleteTrip: (id: string) => Promise<void>;
  duplicateTrip: (id: string) => Promise<Trip>;
  joinTripByCode: (code: string) => Promise<{ success: boolean; message: string; trip?: Trip }>;
  refreshTrips: () => Promise<void>;
}

const TripContext = createContext<TripContextType | undefined>(undefined);

export const isPastTrip = (trip: Trip): boolean => {
  if (!trip) return false;
  if (trip.status === 'Terminé') return true;
  if (!trip.endDate) return false;
  const end = new Date(trip.endDate);
  const now = new Date();
  end.setHours(23, 59, 59, 999);
  return end.getTime() < now.getTime();
};

export const TripProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [activeTripId, setActiveTripIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Clé de persistance locale spécifique à chaque utilisateur
  const userStorageKey = currentUser?.id 
    ? `tt_active_trip_user_${currentUser.id}` 
    : 'tt_active_trip_guest';

  const refreshTrips = useCallback(async () => {
    try {
      const all = await api.trips.getAll();
      setTrips(all);

      const activeCandidates = all.filter(t => !isPastTrip(t));

      // Récupérer le voyage précédemment choisi par CET utilisateur
      const savedForUser = localStorage.getItem(userStorageKey);
      const isSavedValid = savedForUser && all.some(t => t.id === savedForUser && !isPastTrip(t));

      if (isSavedValid) {
        setActiveTripIdState(savedForUser);
        if (currentUser?.name) {
          const uName = currentUser.name.trim();
          const targetTrip = all.find(t => t.id === savedForUser);
          if (targetTrip && !(targetTrip.participants || []).some(p => p.toLowerCase() === uName.toLowerCase())) {
            api.trips.switchActiveParticipant(uName, null, savedForUser);
            setTrips(prev => prev.map(t => {
              if (t.id === savedForUser) {
                return { ...t, participants: [...(t.participants || []), uName] };
              }
              return { ...t, participants: (t.participants || []).filter(p => p.toLowerCase() !== uName.toLowerCase()) };
            }));
          }
        }
      } else {
        // Recherche prioritaire : voyage où l'utilisateur participe ou est créateur
        const myTrip = currentUser 
          ? activeCandidates.find(t => 
              t.userId === currentUser.id || 
              (t.participants && t.participants.some(p => p.toLowerCase().includes(currentUser.name.toLowerCase())))
            )
          : null;

        const defaultCandidate = myTrip ? myTrip.id : (activeCandidates.length > 0 ? activeCandidates[0].id : null);
        setActiveTripIdState(defaultCandidate);
        if (defaultCandidate) {
          localStorage.setItem(userStorageKey, defaultCandidate);
        }
      }
    } catch (err) {
      console.error('Failed to load trips', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.id, currentUser?.name, userStorageKey]);

  // Re-synchroniser quand l'utilisateur change de compte
  useEffect(() => {
    refreshTrips();
  }, [refreshTrips]);

  const setActiveTripId = (id: string | null) => {
    if (!id) {
      const prevId = activeTripId;
      setActiveTripIdState(null);
      localStorage.removeItem(userStorageKey);
      if (currentUser?.name) {
        const uName = currentUser.name.trim();
        setTrips(prev => prev.map(t => ({
          ...t,
          participants: (t.participants || []).filter(p => p.toLowerCase() !== uName.toLowerCase())
        })));
        api.trips.switchActiveParticipant(uName, prevId, null);
      }
      return;
    }
    const target = trips.find(t => t.id === id);
    if (target && isPastTrip(target)) {
      alert("Un voyage au passé ne peut pas être actif.");
      return;
    }

    const prevId = activeTripId;
    setActiveTripIdState(id);
    localStorage.setItem(userStorageKey, id);

    // Synchronisation dynamique des participants
    if (currentUser?.name) {
      const uName = currentUser.name.trim();

      // 1. Mise à jour instantanée du state React (réactivité immédiate sans rechargement)
      setTrips(prev => prev.map(t => {
        if (t.id === id) {
          const hasUser = (t.participants || []).some(p => p.toLowerCase() === uName.toLowerCase());
          const nextParts = hasUser ? (t.participants || []) : [...(t.participants || []), uName];
          return { ...t, participants: nextParts };
        }
        if ((t.participants || []).some(p => p.toLowerCase() === uName.toLowerCase())) {
          return {
            ...t,
            participants: (t.participants || []).filter(p => p.toLowerCase() !== uName.toLowerCase())
          };
        }
        return t;
      }));

      // 2. Persistance locale Dexie + synchronisation backend MongoDB
      api.trips.switchActiveParticipant(uName, prevId, id);
    }
  };

  const activeTrip = trips.find(t => t.id === activeTripId && !isPastTrip(t)) || null;

  const addTrip = async (tripData: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>): Promise<Trip> => {
    const newTrip = await api.trips.create(tripData);
    await refreshTrips();
    if (!isPastTrip(newTrip)) {
      setActiveTripIdState(newTrip.id);
      localStorage.setItem(userStorageKey, newTrip.id);
    }
    return newTrip;
  };

  const updateTrip = async (id: string, updates: Partial<Trip>) => {
    await api.trips.update(id, updates);
    await refreshTrips();
  };

  const deleteTrip = async (id: string) => {
    await api.trips.delete(id);
    await refreshTrips();
  };

  const duplicateTrip = async (id: string): Promise<Trip> => {
    const cloned = await api.trips.duplicate(id, currentUser?.id, currentUser?.name);
    await refreshTrips();
    setActiveTripIdState(cloned.id);
    localStorage.setItem(userStorageKey, cloned.id);
    return cloned;
  };

  const joinTripByCode = async (code: string): Promise<{ success: boolean; message: string; trip?: Trip }> => {
    const res = await api.trips.joinByCode(code, currentUser?.name || 'Moi');
    if (res.success && res.trip) {
      await refreshTrips();
      setActiveTripIdState(res.trip.id);
      localStorage.setItem(userStorageKey, res.trip.id);
    }
    return res;
  };

  return (
    <TripContext.Provider
      value={{
        trips,
        activeTrip,
        activeTripId,
        isLoading,
        setActiveTripId,
        addTrip,
        updateTrip,
        deleteTrip,
        duplicateTrip,
        joinTripByCode,
        refreshTrips
      }}
    >
      {children}
    </TripContext.Provider>
  );
};

export const useTrips = () => {
  const context = useContext(TripContext);
  if (!context) {
    throw new Error('useTrips must be used within a TripProvider');
  }
  return context;
};
