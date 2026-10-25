import React, { createContext, useContext, useState, useEffect } from 'react';
import { Trip } from '../types';
import { api } from '../services/api';

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
  // normalize to end of day
  end.setHours(23, 59, 59, 999);
  return end.getTime() < now.getTime();
};

export const TripProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [activeTripId, setActiveTripIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshTrips = async () => {
    try {
      const all = await api.trips.getAll();
      setTrips(all);

      // Rule: Past trips CANNOT be active.
      const activeCandidates = all.filter(t => !isPastTrip(t));

      setActiveTripIdState(prev => {
        // If current active is still valid and not past
        const current = all.find(t => t.id === prev);
        if (current && !isPastTrip(current)) {
          return current.id;
        }
        // Fallback to first non-past trip, or null if all are in the past
        return activeCandidates.length > 0 ? activeCandidates[0].id : null;
      });
    } catch (err) {
      console.error('Failed to load trips', err);
    } finally {
      setIsLoading(false);
    }
  };

  const setActiveTripId = (id: string | null) => {
    if (!id) {
      setActiveTripIdState(null);
      return;
    }
    const target = trips.find(t => t.id === id);
    if (target && isPastTrip(target)) {
      alert("Un voyage au passé ne peut pas être actif.");
      return;
    }
    setActiveTripIdState(id);
  };

  useEffect(() => {
    refreshTrips();
  }, []);

  const activeTrip = trips.find(t => t.id === activeTripId && !isPastTrip(t)) || null;

  const addTrip = async (tripData: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>): Promise<Trip> => {
    const newTrip = await api.trips.create(tripData);
    await refreshTrips();
    if (!isPastTrip(newTrip)) {
      setActiveTripIdState(newTrip.id);
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
