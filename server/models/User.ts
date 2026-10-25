import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: 'Traveler' | 'Organizer' | 'Admin';
  avatar: string;
  resetPasswordCode?: string;
  resetPasswordExpires?: Date;
  preferences: {
    currency: string;
    travelPace: 'Relaxed' | 'Balanced' | 'Intense';
    interests: string[];
    theme: string;
  };
  createdAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['Traveler', 'Organizer', 'Admin'], default: 'Traveler' },
  avatar: { type: String, default: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150' },
  resetPasswordCode: { type: String, default: null },
  resetPasswordExpires: { type: Date, default: null },
  preferences: {
    currency: { type: String, default: 'EUR' },
    travelPace: { type: String, enum: ['Relaxed', 'Balanced', 'Intense'], default: 'Balanced' },
    interests: { type: [String], default: ['Culture', 'Gastronomie'] },
    theme: { type: String, default: 'dark' }
  },
  createdAt: { type: Date, default: Date.now }
});

// Pre-save hook: Hash password before saving to MongoDB (async without next for Mongoose 8/9)
UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password!, salt);
});

// Method to verify candidate password
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

export const UserModel = mongoose.model<IUser>('User', UserSchema);
