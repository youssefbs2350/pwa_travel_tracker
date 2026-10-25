import mongoose, { Schema, Document } from 'mongoose';

export interface IMemory extends Document {
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
  mood: string;
  locationName: string;
  createdAt: Date;
}

const MemorySchema = new Schema<IMemory>({
  tripId: { type: String, required: true, index: true },
  tripTitle: { type: String, default: '' },
  placeId: { type: String, default: null },
  placeName: { type: String, default: '' },
  userId: { type: String, default: '' },
  userName: { type: String, default: 'Voyageur' },
  userRole: { type: String, default: 'Traveler' },
  title: { type: String, required: true },
  story: { type: String, required: true },
  date: { type: String, required: true },
  photos: { type: [String], default: [] },
  mood: { type: String, default: '✨ Magique' },
  locationName: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

export const MemoryModel = mongoose.model<IMemory>('Memory', MemorySchema);

export interface IReview extends Document {
  tripId?: string;
  placeId?: string;
  placeName: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  tags: string[];
  date: string;
  createdAt: Date;
}

const ReviewSchema = new Schema<IReview>({
  tripId: { type: String, index: true },
  placeId: { type: String },
  placeName: { type: String, required: true },
  userId: { type: String, required: true },
  userName: { type: String, default: 'Voyageur' },
  rating: { type: Number, default: 5 },
  comment: { type: String, required: true },
  tags: { type: [String], default: [] },
  date: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export const ReviewModel = mongoose.model<IReview>('Review', ReviewSchema);
