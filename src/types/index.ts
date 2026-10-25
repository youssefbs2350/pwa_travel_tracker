export type UserRole = 'Traveler' | 'Organizer' | 'Admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  token?: string;
  preferences: {
    currency: string; // EUR, USD, TND, GBP, JPY
    travelPace: 'Relaxed' | 'Balanced' | 'Intense';
    interests: string[]; // Culture, Gastronomie, Nature, Aventure, Plage, Shopping
    theme: 'dark' | 'light';
  };
  createdAt: string;
}

export type TripStatus = 'Brouillon' | 'Planifié' | 'En cours' | 'Terminé';

export interface Trip {
  id: string;
  userId: string;
  title: string;
  destination: string;
  country: string;
  startDate: string;
  endDate: string;
  coverImage: string;
  budgetTotal: number;
  currency: string;
  status: TripStatus;
  participants: string[];
  notes?: string;
  itinerarySummary?: string;
  createdAt: string;
  updatedAt: string;
}

export type PlaceCategory = 'Monuments' | 'Restaurant' | 'Hébergement' | 'Nature' | 'Plage' | 'Shopping' | 'Autre';

export interface Place {
  id: string;
  tripId: string;
  name: string;
  category: PlaceCategory;
  address: string;
  latitude: number;
  longitude: number;
  rating: number; // 1 to 5
  estimatedDurationMinutes: number;
  costEstimate: number;
  imageUrl: string;
  notes?: string;
  createdAt: string;
}

export type ActivityStatus = 'À faire' | 'En cours' | 'Terminé';

export interface Activity {
  id: string;
  tripId: string;
  placeId?: string;
  dayNumber: number; // Day 1, Day 2...
  date: string;
  startTime: string; // "09:00"
  endTime: string;   // "11:30"
  title: string;
  description?: string;
  cost: number;
  status: ActivityStatus;
  orderIndex: number;
  createdAt: string;
}

export type ExpenseCategory = 'Hébergement' | 'Transport' | 'Nourriture' | 'Activités' | 'Shopping' | 'Santé' | 'Autre';

export interface Expense {
  id: string;
  tripId: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  currency: string;
  date: string;
  paidBy: string; // user name or participant
  splitWith: string[]; // list of participants sharing this expense
  receiptImage?: string;
  notes?: string;
  createdAt: string;
}

export interface Memory {
  id: string;
  tripId: string;
  tripTitle?: string;
  placeId?: string;
  placeName?: string;
  userId?: string;
  userName?: string;
  userRole?: string;
  title: string;
  story: string;
  date: string;
  photos: string[];
  mood: '🤩 Époustouflant' | '✨ Magique' | '😌 Paisible' | '🔥 Aventureux' | '😋 Délicieux';
  locationName: string;
  createdAt: string;
}

export interface Review {
  id: string;
  tripId?: string;
  tripTitle?: string;
  tripDestination?: string;
  placeId?: string;
  placeName: string;
  userId: string;
  userName: string;
  rating: number; // 1 - 5
  comment: string;
  tags: string[];
  date: string;
  verifiedVisit?: boolean;
}

export type ComplaintPriority = 'Basse' | 'Moyenne' | 'Haute' | 'Urgente';
export type ComplaintStatus = 'Soumis' | 'En cours d\'analyse' | 'Résolu' | 'Rejeté';

export interface Complaint {
  id: string;
  tripId: string;
  userId: string;
  userName: string;
  title: string;
  category: 'Transport / Vol' | 'Hôtel / Logement' | 'Activité / Guide' | 'Frais imprévu' | 'Bagage' | 'Autre';
  priority: ComplaintPriority;
  status: ComplaintStatus;
  description: string;
  requestedCompensation?: string;
  awardedCompensation?: string;
  resolutionNotes?: string;
  incidentDate: string;
  updatedAt: string;
  createdAt: string;
}

export interface Recommendation {
  id: string;
  title: string;
  category: PlaceCategory;
  destination: string;
  score: number; // percentage match
  reason: string;
  estimatedCost: number;
  imageUrl: string;
  suggestedDuration: string;
}
