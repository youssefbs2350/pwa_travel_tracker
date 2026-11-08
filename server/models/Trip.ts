import mongoose, { Schema, Document } from 'mongoose';

export interface ITrip extends Document {
  userId: string;
  title: string;
  destination: string;
  country: string;
  startDate: string;
  endDate: string;
  coverImage: string;
  budgetTotal: number;
  currency: string;
  status: 'Brouillon' | 'Planifié' | 'En cours' | 'Terminé';
  participants: string[];
  itinerarySummary?: string;
  notes?: string;
  shareCode?: string;
  packingList?: any[];
  travelDocs?: any[];
  destinationMeta?: any;
  tripPace?: string;
  tripTheme?: string;
  travelStyle?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TripSchema = new Schema<ITrip>({
  userId: { type: String, required: true },
  title: { type: String, required: true },
  destination: { type: String, required: true },
  country: { type: String, default: '' },
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  coverImage: { type: String, default: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1200' },
  budgetTotal: { type: Number, default: 1500 },
  currency: { type: String, default: 'EUR' },
  status: { type: String, enum: ['Brouillon', 'Planifié', 'En cours', 'Terminé'], default: 'Planifié' },
  participants: { type: [String], default: [] },
  itinerarySummary: { type: String, default: '' },
  notes: { type: String, default: '' },
  shareCode: { type: String, default: '' },
  packingList: { type: [Schema.Types.Mixed], default: [] },
  travelDocs: { type: [Schema.Types.Mixed], default: [] },
  destinationMeta: { type: Schema.Types.Mixed, default: {} },
  tripPace: { type: String, default: 'Balanced' },
  tripTheme: { type: String, default: 'Culture & Gastronomie' },
  travelStyle: { type: String, default: 'Équilibré' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const TripModel = (mongoose.models.Trip as mongoose.Model<ITrip>) || mongoose.model<ITrip>('Trip', TripSchema);

