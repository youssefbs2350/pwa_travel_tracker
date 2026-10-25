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
  }
}
