import mongoose, { Schema, Document } from 'mongoose';

export interface IPlace extends Document {
  id?: string;
  tripId: string;
  name: string;
  category: 'Monuments' | 'Restaurant' | 'Hébergement' | 'Nature' | 'Plage' | 'Shopping' | 'Autre';
  address: string;
  latitude: number;
  longitude: number;
  rating: number;
  estimatedDurationMinutes: number;
  costEstimate: number;
  imageUrl: string;
  notes?: string;
  createdAt: Date;
}

const PlaceSchema = new Schema<IPlace>({
  id: { type: String, index: true },
  tripId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['Monuments', 'Restaurant', 'Hébergement', 'Nature', 'Plage', 'Shopping', 'Autre'],
    default: 'Monuments' 
  },
  address: { type: String, default: '' },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  rating: { type: Number, default: 4.5 },
  estimatedDurationMinutes: { type: Number, default: 90 },
  costEstimate: { type: Number, default: 0 },
  imageUrl: { type: String, default: '' },
  notes: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

export const PlaceModel = mongoose.model<IPlace>('Place', PlaceSchema);
