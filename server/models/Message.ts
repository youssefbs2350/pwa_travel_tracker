import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  tripId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  message: string;
  timestamp: number;
  createdAt: Date;
}

const MessageSchema = new Schema<IMessage>({
  tripId: { type: String, required: true, index: true },
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  userAvatar: { type: String, default: '' },
  message: { type: String, required: true, trim: true },
  timestamp: { type: Number, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

export const MessageModel = (mongoose.models.Message as mongoose.Model<IMessage>) || mongoose.model<IMessage>('Message', MessageSchema);
