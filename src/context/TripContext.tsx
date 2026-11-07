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
      setActiveTripIdState(null);
      localStorage.removeItem(userStorageKey);
      return;
    }
    const target = trips.find(t => t.id === id);
    if (target && isPastTrip(target)) {
      alert("Un voyage au passé ne peut pas être actif.");
      return;
    }
    // Mise à jour locale pour CET utilisateur uniquement
    setActiveTripIdState(id);
    localStorage.setItem(userStorageKey, id);
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
