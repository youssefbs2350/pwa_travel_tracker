import Dexie, { Table } from 'dexie';
import { User, Trip, Place, Activity, Expense, Memory, Review, Complaint } from '../types';

export interface SyncItem {
  id?: number;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  collection: 'trips' | 'places' | 'activities' | 'expenses' | 'memories' | 'complaints';
  data: any;
  timestamp: string;
}

export class TravelTrackerDB extends Dexie {
  users!: Table<User, string>;
  trips!: Table<Trip, string>;
  places!: Table<Place, string>;
  activities!: Table<Activity, string>;
  expenses!: Table<Expense, string>;
  memories!: Table<Memory, string>;
  reviews!: Table<Review, string>;
  complaints!: Table<Complaint, string>;
  syncQueue!: Table<SyncItem, number>;

  constructor() {
    super('TravelTrackerPWA_DB');
    this.version(2).stores({
      users: 'id, email, role',
      trips: 'id, userId, status, destination, startDate',
      places: 'id, tripId, category, rating',
      activities: 'id, tripId, date, status, orderIndex',
      expenses: 'id, tripId, category, date',
      memories: 'id, tripId, date',
      reviews: 'id, tripId, placeId, rating',
      complaints: 'id, tripId, userId, status, priority',
      syncQueue: '++id, collection, timestamp'
    });
  }
}

export const db = new TravelTrackerDB();

// Sync initial data from MongoDB API to local IndexedDB for Offline-First experience
export async function syncFromMongoDB(): Promise<boolean> {
  try {
    const res = await fetch('/api/trips');
    if (!res.ok) return false;

    const [tripsRes, usersRes, placesRes, activitiesRes, expensesRes, memoriesRes, complaintsRes, reviewsRes] = await Promise.all([
      fetch('/api/trips').then(r => r.json()),
      fetch('/api/users').then(r => r.json()),
      fetch('/api/places').then(r => r.json()),
      fetch('/api/activities').then(r => r.json()),
      fetch('/api/expenses').then(r => r.json()),
      fetch('/api/memories').then(r => r.json()),
      fetch('/api/complaints').then(r => r.json()),
      fetch('/api/memories/reviews').then(r => r.json())
    ]);

    // Format _id from MongoDB into id if necessary
    const formatItem = (item: any) => ({
      ...item,
      id: item._id ? item._id.toString() : item.id
    });

    if (tripsRes?.length) await db.trips.bulkPut(tripsRes.map(formatItem));
    if (usersRes?.length) await db.users.bulkPut(usersRes.map(formatItem));
    if (placesRes?.length) await db.places.bulkPut(placesRes.map(formatItem));
    if (activitiesRes?.length) await db.activities.bulkPut(activitiesRes.map(formatItem));
    if (expensesRes?.length) await db.expenses.bulkPut(expensesRes.map(formatItem));
    if (memoriesRes?.length) await db.memories.bulkPut(memoriesRes.map(formatItem));
    if (complaintsRes?.length) await db.complaints.bulkPut(complaintsRes.map(formatItem));
    if (reviewsRes?.length) await db.reviews.bulkPut(reviewsRes.map(formatItem));

    console.log('[Offline Engine] IndexedDB synchronisé avec succès depuis MongoDB !');
    return true;
  } catch (err) {
    console.warn('[Offline Engine] Impossible de contacter MongoDB (mode hors-ligne actif ou réseau indisponible). Données locales conservées.');
    return false;
  }
}

export async function initializeDatabase() {
  const synced = await syncFromMongoDB();
  if (synced) return;

  // Fallback: If MongoDB was not reachable on first startup, ensure minimal seed in IndexedDB
  const count = await db.trips.count();
  if (count === 0) {
    console.log('[Offline Engine] Base locale initialisée pour premier démarrage.');
    const initialTrip = {
      id: 'trip-1',
      userId: 'usr-2',
      title: 'Voyage Culturel & Gastronomique au Japon',
      destination: 'Tokyo & Kyoto',
      country: 'Japon',
      startDate: '2026-11-10',
      endDate: '2026-11-20',
      coverImage: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1200',
      budgetTotal: 3200,
      currency: 'EUR',
      status: 'En cours' as const,
      participants: ['Youssef', 'Chaima', 'Ameni'],
      itinerarySummary: 'Circuit combinant temples historiques, gastronomie raffinée et modernité tokyoïte.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await db.trips.put(initialTrip);

    await db.places.bulkPut([
      {
        id: 'plc-1',
        tripId: 'trip-1',
        name: 'Sanctuaire Meiji Jingu',
        category: 'Monuments',
        address: '1-1 Yoyogikamizonocho, Shibuya City, Tokyo',
        latitude: 35.6764,
        longitude: 139.6993,
        rating: 4.8,
        estimatedDurationMinutes: 120,
        costEstimate: 0,
        imageUrl: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600',
        createdAt: new Date().toISOString()
      },
      {
        id: 'plc-2',
        tripId: 'trip-1',
        name: 'Marché de Tsukiji & Street Food',
        category: 'Restaurant',
        address: '4 Chome Tsukiji, Chuo City, Tokyo',
        latitude: 35.6655,
        longitude: 139.7707,
        rating: 4.9,
        estimatedDurationMinutes: 90,
        costEstimate: 35,
        imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600',
        createdAt: new Date().toISOString()
      }
    ]);

    await db.activities.bulkPut([
      {
        id: 'act-1',
        tripId: 'trip-1',
        placeId: 'plc-1',
        dayNumber: 1,
        date: '2026-11-10',
        startTime: '09:00',
        endTime: '11:00',
        title: 'Visite spirituelle au Sanctuaire Meiji',
        description: 'Promenade dans la forêt sacrée et découverte du torii géant.',
        cost: 0,
        status: 'Terminé',
        orderIndex: 0,
        createdAt: new Date().toISOString()
      },
      {
        id: 'act-2',
        tripId: 'trip-1',
        placeId: 'plc-2',
        dayNumber: 1,
        date: '2026-11-10',
        startTime: '12:00',
        endTime: '13:30',
        title: 'Dégustation Street Food à Tsukiji',
        description: 'Sashimis frais, brochettes yakitori et omelette japonaise tamagoyaki.',
        cost: 35,
        status: 'En cours',
        orderIndex: 1,
        createdAt: new Date().toISOString()
      }
    ]);

    await db.expenses.bulkPut([
      {
        id: 'exp-1',
        tripId: 'trip-1',
        title: 'Hébergement Ryokan traditionnel',
        category: 'Hébergement',
        amount: 850,
        currency: 'EUR',
        date: '2026-11-10',
        paidBy: 'Youssef',
        splitWith: ['Youssef', 'Chaima', 'Ameni'],
        createdAt: new Date().toISOString()
      },
      {
        id: 'exp-2',
        tripId: 'trip-1',
        title: 'Repas gastronomique Tsukiji',
        category: 'Nourriture',
        amount: 105,
        currency: 'EUR',
        date: '2026-11-10',
        paidBy: 'Chaima',
        splitWith: ['Youssef', 'Chaima', 'Ameni'],
        createdAt: new Date().toISOString()
      }
    ]);
  }
}
