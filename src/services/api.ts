import { db, SyncItem } from '../db/database';
import { Trip, Place, Activity, Expense, Memory, Review, Complaint, Recommendation } from '../types';

export const isServerOnline = async (): Promise<boolean> => {
  if (!navigator.onLine) return false;
  try {
    const res = await fetch('/api/health', { method: 'GET', signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
};

export const api = {
  // TRIPS (Ameni)
  trips: {
    async getAll(): Promise<Trip[]> {
      try {
        const res = await fetch('/api/trips');
        if (res.ok) {
          const list = await res.json();
          const formatted = list.map((t: any) => ({ ...t, id: t._id || t.id }));
          await db.trips.bulkPut(formatted);
          return formatted;
        }
      } catch (err) {
        console.log('[API] Récupération depuis IndexedDB (Hors-ligne)');
      }
      return db.trips.toArray();
    },

    async create(tripData: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>): Promise<Trip> {
      const tempId = 'trip-' + Date.now();
      const localTrip: Trip = {
        ...tripData,
        id: tempId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      try {
        const res = await fetch('/api/trips', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(tripData)
        });
        if (res.ok) {
          const created = await res.json();
          const finalTrip = { ...created, id: created._id || created.id };
          await db.trips.put(finalTrip);
          return finalTrip;
        }
      } catch (err) {
        console.log('[API] Mode Hors-ligne : Trip enregistré dans IndexedDB + file d’attente');
      }

      await db.trips.put(localTrip);
      await db.syncQueue.add({
        type: 'CREATE',
        collection: 'trips',
        data: localTrip,
        timestamp: new Date().toISOString()
      });
      return localTrip;
    },

    async update(id: string, updates: Partial<Trip>): Promise<void> {
      await db.trips.update(id, updates);
      try {
        await fetch(`/api/trips/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        });
      } catch {
        await db.syncQueue.add({
          type: 'UPDATE',
          collection: 'trips',
          data: { id, ...updates },
          timestamp: new Date().toISOString()
        });
      }
    },

    async delete(id: string): Promise<void> {
      await db.trips.delete(id);
      try {
        await fetch(`/api/trips/${id}`, { method: 'DELETE' });
      } catch {
        await db.syncQueue.add({
          type: 'DELETE',
          collection: 'trips',
          data: { id },
          timestamp: new Date().toISOString()
        });
      }
    },

    async joinByCode(shareCode: string, userName: string): Promise<{ success: boolean; message: string; trip?: Trip }> {
      const code = shareCode.trim().toUpperCase();
      const user = userName.trim().split(' ')[0];

      // Try server first
      try {
        const res = await fetch('/api/trips/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ shareCode: code, userName: user })
        });
        if (res.ok) {
          const data = await res.json();
          const trip = { ...data.trip, id: data.trip._id || data.trip.id };
          await db.trips.put(trip);
          return { success: true, message: data.message, trip };
        } else {
          const err = await res.json();
          return { success: false, message: err.error || 'Code invalide.' };
        }
      } catch {
        // Fallback local search in IndexedDB
        const localTrip = await db.trips.filter(t => (t.shareCode || '').toUpperCase() === code).first();
        if (localTrip) {
          if (!localTrip.participants.includes(user)) {
            localTrip.participants.push(user);
            localTrip.updatedAt = new Date().toISOString();
            await db.trips.put(localTrip);
          }
          return { success: true, message: `Vous avez rejoint "${localTrip.title}" !`, trip: localTrip };
        }
        return { success: false, message: 'Aucun voyage trouvé avec ce code de partage (mode hors-ligne).' };
      }
    },

    async switchActiveParticipant(userName: string, oldTripId: string | null, newTripId: string | null): Promise<void> {
      const cleanUser = userName.trim();
      if (!cleanUser) return;

      // 1. Mise à jour immédiate dans Dexie IndexedDB
      try {
        const localTrips = await db.trips.toArray();
        for (const t of localTrips) {
          let updated = false;
          let parts = [...(t.participants || [])];
          const isTarget = newTripId && t.id === newTripId;

          if (isTarget) {
            if (!parts.some(p => p.toLowerCase() === cleanUser.toLowerCase())) {
              parts.push(cleanUser);
              updated = true;
            }
          } else if (parts.some(p => p.toLowerCase() === cleanUser.toLowerCase())) {
            parts = parts.filter(p => p.toLowerCase() !== cleanUser.toLowerCase());
            updated = true;
          }

          if (updated) {
            await db.trips.update(t.id, { participants: parts, updatedAt: new Date().toISOString() });
          }
        }
      } catch (err) {
        console.warn('[API] Erreur mise à jour participants locale Dexie:', err);
      }

      // 2. Appel serveur vers MongoDB
      try {
        await fetch('/api/trips/set-active-participant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userName: cleanUser, oldTripId, newTripId })
        });
      } catch {
        console.log('[API] Changement de participant enregistré hors-ligne');
      }
    },

    async duplicate(id: string, userId: string = 'usr-default', userName: string = 'Moi'): Promise<Trip> {
      try {
        const res = await fetch(`/api/trips/${id}/duplicate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, userName })
        });
        if (res.ok) {
          const cloned = await res.json();
          const finalTrip = { ...cloned, id: cloned._id || cloned.id };
          await db.trips.put(finalTrip);
          return finalTrip;
        }
      } catch (err) {
        console.warn('[API] Duplication via mode local:', err);
      }

      // Offline fallback clone directly from Dexie
      const orig = await db.trips.get(id);
      if (!orig) throw new Error('Voyage source introuvable');

      const newId = 'trip-' + Date.now();
      const start = new Date(Date.now() + 86400000);
      const origStart = new Date(orig.startDate);
      const origEnd = new Date(orig.endDate);
      const diff = Math.max(1, Math.round((origEnd.getTime() - origStart.getTime()) / 86400000));
      const end = new Date(start.getTime() + diff * 86400000);

      const clonedTrip: Trip = {
        ...orig,
        id: newId,
        title: `${orig.title} (Copie)`,
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
        status: 'Planifié',
        shareCode: 'TRIP-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await db.trips.put(clonedTrip);
      return clonedTrip;
    },

    async generateItinerary(payload: { destination: string; days: number; pace: string; theme: string }): Promise<any> {
      try {
        const res = await fetch('/api/trips/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          const result = await res.json();
          const trip = { ...result.trip, id: result.trip._id || result.trip.id };
          await db.trips.put(trip);
          if (result.place) {
            await db.places.put({ ...result.place, id: result.place._id || result.place.id });
          }
          if (result.activity) {
            await db.activities.put({ ...result.activity, id: result.activity._id || result.activity.id });
          }
          return trip;
        }
      } catch (err) {
        console.log('[API] Itinéraire généré en mode local/hors-ligne');
      }
      return null;
    }
  },

  // PLACES (Hedi)
  places: {
    async getByTrip(tripId: string): Promise<Place[]> {
      const localPlaces = await db.places.where('tripId').equals(tripId).toArray();
      try {
        const res = await fetch(`/api/places?tripId=${tripId}`);
        if (res.ok) {
          const list = await res.json();
          if (list.length > 0) {
            const formatted = list.map((p: any) => ({ ...p, id: p.id || p._id }));
            await db.places.bulkPut(formatted);
            return formatted;
          } else if (localPlaces.length > 0) {
            // Synchroniser les lieux locaux générés par l'IA vers MongoDB
            fetch('/api/places', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(localPlaces)
            }).catch(() => {});
            return localPlaces;
          }
          return [];
        }
      } catch {
        console.log('[API] Lieux récupérés depuis IndexedDB');
      }
      return localPlaces;
    },

    async create(place: Omit<Place, 'id' | 'createdAt'>): Promise<Place> {
      const tempId = 'plc-' + Date.now();
      const localPlace: Place = {
        ...place,
        id: tempId,
        createdAt: new Date().toISOString()
      };

      try {
        const res = await fetch('/api/places', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(place)
        });
        if (res.ok) {
          const created = await res.json();
          const finalPlace = { ...created, id: created._id || created.id };
          await db.places.put(finalPlace);
          return finalPlace;
        }
      } catch {
        console.log('[API] Lieu enregistré hors-ligne');
      }

      await db.places.put(localPlace);
      await db.syncQueue.add({
        type: 'CREATE',
        collection: 'places',
        data: localPlace,
        timestamp: new Date().toISOString()
      });
      return localPlace;
    },

    async update(id: string, updates: Partial<Place>): Promise<void> {
      await db.places.update(id, updates);
      try {
        await fetch(`/api/places/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        });
      } catch {
        await db.syncQueue.add({
          type: 'UPDATE',
          collection: 'places',
          data: { id, ...updates },
          timestamp: new Date().toISOString()
        });
      }
    },

    async delete(id: string): Promise<void> {
      await db.places.delete(id);
      try {
        await fetch(`/api/places/${id}`, { method: 'DELETE' });
      } catch {
        await db.syncQueue.add({
          type: 'DELETE',
          collection: 'places',
          data: { id },
          timestamp: new Date().toISOString()
        });
      }
    }
  },

  // ACTIVITIES (Youssef)
  activities: {
    async getByTrip(tripId: string): Promise<Activity[]> {
      const localActs = await db.activities.where('tripId').equals(tripId).toArray();
      try {
        const res = await fetch(`/api/activities?tripId=${tripId}`);
        if (res.ok) {
          const list = await res.json();
          if (list.length > 0) {
            const formatted = list.map((a: any) => ({ ...a, id: a.id || a._id }));
            await db.activities.bulkPut(formatted);
            return formatted;
          } else if (localActs.length > 0) {
            // Synchroniser le planning IA local vers MongoDB
            fetch('/api/activities', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(localActs)
            }).catch(() => {});
            return localActs.sort((a, b) => a.dayNumber - b.dayNumber || a.startTime.localeCompare(b.startTime));
          }
          return [];
        }
      } catch {
        console.log('[API] Activités lues depuis IndexedDB');
      }
      return localActs.sort((a, b) => a.dayNumber - b.dayNumber || a.startTime.localeCompare(b.startTime));
    },

    async create(activity: Omit<Activity, 'id' | 'createdAt'>): Promise<Activity> {
      const tempId = 'act-' + Date.now();
      const localAct: Activity = {
        ...activity,
        id: tempId,
        createdAt: new Date().toISOString()
      };

      try {
        const res = await fetch('/api/activities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(activity)
        });
        if (res.ok) {
          const created = await res.json();
          const finalAct = { ...created, id: created._id || created.id };
          await db.activities.put(finalAct);
          return finalAct;
        }
      } catch {
        console.log('[API] Activité enregistrée en cache local');
      }

      await db.activities.put(localAct);
      await db.syncQueue.add({
        type: 'CREATE',
        collection: 'activities',
        data: localAct,
        timestamp: new Date().toISOString()
      });
      return localAct;
    },

    async update(id: string, updates: Partial<Activity>): Promise<void> {
      await db.activities.update(id, updates);
      try {
        await fetch(`/api/activities/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        });
      } catch {
        await db.syncQueue.add({
          type: 'UPDATE',
          collection: 'activities',
          data: { id, ...updates },
          timestamp: new Date().toISOString()
        });
      }
    },

    async delete(id: string): Promise<void> {
      await db.activities.delete(id);
      try {
        await fetch(`/api/activities/${id}`, { method: 'DELETE' });
      } catch {
        await db.syncQueue.add({
          type: 'DELETE',
          collection: 'activities',
          data: { id },
          timestamp: new Date().toISOString()
        });
      }
    },

    async optimize(tripId: string, dayNumber: number, bufferMinutes: number = 15): Promise<Activity[]> {
      try {
        const res = await fetch('/api/activities/optimize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tripId, dayNumber, bufferMinutes })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.activities && Array.isArray(data.activities)) {
            const formatted = data.activities.map((a: any) => ({ ...a, id: a.id || a._id }));
            await db.activities.bulkPut(formatted);
            return formatted;
          }
        }
      } catch {
        console.log('[API] Optimisation locale hors-ligne');
      }
      return [];
    },

    async sendAlertEmail(params: {
      to: string;
      userName?: string;
      activityTitle: string;
      startTime: string;
      locationName?: string;
      locationAddress?: string;
      tripTitle?: string;
      minutesRemaining?: number;
    }): Promise<{ sent: boolean; message: string }> {
      try {
        const res = await fetch('/api/activities/alert-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params)
        });
        if (res.ok) {
          return await res.json();
        }
      } catch (err) {
        console.warn('[API Alert Email Error]:', err);
      }
      return { sent: false, message: 'Alerte simulée (hors-ligne)' };
    }
  },

  // EXPENSES (Nour)
  expenses: {
    async getByTrip(tripId: string): Promise<Expense[]> {
      const localExps = await db.expenses.where('tripId').equals(tripId).toArray();
      try {
        const res = await fetch(`/api/expenses?tripId=${tripId}`);
        if (res.ok) {
          const list = await res.json();
          if (list.length > 0) {
            const formatted = list.map((e: any) => ({ ...e, id: e.id || e._id }));
            await db.expenses.bulkPut(formatted);
            return formatted;
          } else if (localExps.length > 0) {
            // Synchroniser les dépenses générées par l'IA vers MongoDB
            fetch('/api/expenses', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(localExps)
            }).catch(() => {});
            return localExps;
          }
          return [];
        }
      } catch {
        console.log('[API] Dépenses lues depuis IndexedDB');
      }
      return localExps;
    },

    async create(expense: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense> {
      const tempId = 'exp-' + Date.now();
      const localExp: Expense = {
        ...expense,
        id: tempId,
        createdAt: new Date().toISOString()
      };

      try {
        const res = await fetch('/api/expenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(expense)
        });
        if (res.ok) {
          const created = await res.json();
          const finalExp = { ...created, id: created._id || created.id };
          await db.expenses.put(finalExp);
          return finalExp;
        }
      } catch {
        console.log('[API] Dépense sauvegardée hors-ligne');
      }

      await db.expenses.put(localExp);
      await db.syncQueue.add({
        type: 'CREATE',
        collection: 'expenses',
        data: localExp,
        timestamp: new Date().toISOString()
      });
      return localExp;
    },

    async delete(id: string): Promise<void> {
      await db.expenses.delete(id);
      try {
        await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
      } catch {
        await db.syncQueue.add({
          type: 'DELETE',
          collection: 'expenses',
          data: { id },
          timestamp: new Date().toISOString()
        });
      }
    }
  },

  // MEMORIES & REVIEWS (Nourhene)
  memories: {
    async getByTrip(tripId: string): Promise<Memory[]> {
      try {
        const res = await fetch(`/api/memories?tripId=${tripId}`);
        if (res.ok) {
          const list = await res.json();
          const formatted = list.map((m: any) => ({ ...m, id: m._id || m.id }));
          await db.memories.bulkPut(formatted);
          return formatted;
        }
      } catch {
        console.log('[API] Souvenirs lus depuis IndexedDB');
      }
      return db.memories.where('tripId').equals(tripId).toArray();
    },

    async create(memory: Omit<Memory, 'id' | 'createdAt'>): Promise<Memory> {
      const tempId = 'mem-' + Date.now();
      const localMem: Memory = {
        ...memory,
        id: tempId,
        createdAt: new Date().toISOString()
      };

      try {
        const res = await fetch('/api/memories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(memory)
        });
        if (res.ok) {
          const created = await res.json();
          const finalMem = { ...created, id: created._id || created.id };
          await db.memories.put(finalMem);
          return finalMem;
        }
      } catch {
        console.log('[API] Souvenir sauvegardé hors-ligne');
      }

      await db.memories.put(localMem);
      await db.syncQueue.add({
        type: 'CREATE',
        collection: 'memories',
        data: localMem,
        timestamp: new Date().toISOString()
      });
      return localMem;
    },

    async delete(id: string): Promise<void> {
      await db.memories.delete(id);
      try {
        await fetch(`/api/memories/${id}`, { method: 'DELETE' });
      } catch {
        await db.syncQueue.add({
          type: 'DELETE',
          collection: 'memories',
          data: { id },
          timestamp: new Date().toISOString()
        });
      }
    },

    async getRecommendations(destination: string): Promise<Recommendation[]> {
      try {
        const res = await fetch(`/api/memories/recommendations?destination=${encodeURIComponent(destination)}`);
        if (res.ok) {
          return await res.json();
        }
      } catch {
        console.log('[API] Recommandations locales');
      }
      return [];
    }
  },

  // COMPLAINTS (Amine)
  complaints: {
    async getByTrip(tripId: string): Promise<Complaint[]> {
      try {
        const res = await fetch(`/api/complaints?tripId=${tripId}`);
        if (res.ok) {
          const list = await res.json();
          const formatted = list.map((c: any) => ({ ...c, id: c._id || c.id }));
          await db.complaints.bulkPut(formatted);
          return formatted;
        }
      } catch {
        console.log('[API] Réclamations lues depuis IndexedDB');
      }
      return db.complaints.where('tripId').equals(tripId).toArray();
    },

    async create(complaint: Omit<Complaint, 'id' | 'createdAt' | 'updatedAt'>): Promise<Complaint> {
      const tempId = 'cmp-' + Date.now();
      const localComp: Complaint = {
        ...complaint,
        id: tempId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      try {
        const res = await fetch('/api/complaints', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(complaint)
        });
        if (res.ok) {
          const created = await res.json();
          const finalComp = { ...created, id: created._id || created.id };
          await db.complaints.put(finalComp);
          return finalComp;
        }
      } catch {
        console.log('[API] Réclamation sauvegardée hors-ligne');
      }

      await db.complaints.put(localComp);
      await db.syncQueue.add({
        type: 'CREATE',
        collection: 'complaints',
        data: localComp,
        timestamp: new Date().toISOString()
      });
      return localComp;
    },

    async update(id: string, updates: Partial<Complaint>): Promise<void> {
      await db.complaints.update(id, updates);
      try {
        await fetch(`/api/complaints/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        });
      } catch {
        await db.syncQueue.add({
          type: 'UPDATE',
          collection: 'complaints',
          data: { id, ...updates },
          timestamp: new Date().toISOString()
        });
      }
    },

    async delete(id: string): Promise<void> {
      await db.complaints.delete(id);
      try {
        await fetch(`/api/complaints/${id}`, { method: 'DELETE' });
      } catch {
        await db.syncQueue.add({
          type: 'DELETE',
          collection: 'complaints',
          data: { id },
          timestamp: new Date().toISOString()
        });
      }
    }
  },

  // OUTBOX SYNC QUEUE: Flush offline mutations to MongoDB
  syncQueue: {
    async count(): Promise<number> {
      return db.syncQueue.count();
    },

    async replay(): Promise<{ success: boolean; count: number }> {
      const pending = await db.syncQueue.toArray();
      if (pending.length === 0) return { success: true, count: 0 };

      try {
        const res = await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mutations: pending })
        });

        if (res.ok) {
          await db.syncQueue.clear();
          console.log(`[Sync] ${pending.length} actions hors-ligne synchronisées avec succès vers MongoDB !`);
          return { success: true, count: pending.length };
        }
      } catch (err) {
        console.warn('[Sync] Échec de la synchronisation vers MongoDB (serveur non joignable).');
      }
      return { success: false, count: 0 };
    }
  }
};
