import mongoose, { Schema, Document } from 'mongoose';

export interface IActivity extends Document {
  id?: string;
  tripId: string;
  placeId?: string;
  dayNumber: number;
  date: string;
  startTime: string;
  endTime: string;
  title: string;
  description?: string;
  cost: number;
  status: 'À faire' | 'En cours' | 'Terminé';
  orderIndex: number;
  createdAt: Date;
}

const ActivitySchema = new Schema<IActivity>({
  id: { type: String, index: true },
  tripId: { type: String, required: true, index: true },
  placeId: { type: String, default: null },
  dayNumber: { type: Number, required: true },
  date: { type: String, default: '' },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  cost: { type: Number, default: 0 },
  status: { type: String, enum: ['À faire', 'En cours', 'Terminé'], default: 'À faire' },
  orderIndex: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

export const ActivityModel = mongoose.model<IActivity>('Activity', ActivitySchema);
