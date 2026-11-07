import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

let cachedPromise: Promise<typeof mongoose> | null = null;

export async function connectMongoDB(): Promise<boolean> {
  if (mongoose.connection.readyState === 1) {
    return true;
  }

  const ATLAS_FALLBACK_URI = 'mongodb+srv://youssefbs11_db_user:kc0DIrCVbznUYSEs@gogywt5.mongodb.net/traveltracker?retryWrites=true&w=majority&authSource=admin';
  const uri = process.env.MONGO_URI || ATLAS_FALLBACK_URI;

  try {
    if (!cachedPromise) {
      mongoose.set('strictQuery', false);
      cachedPromise = mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
      });
    }
    await cachedPromise;
    console.log('[MongoDB] Connecté avec succès');
    return true;
  } catch (error) {
    cachedPromise = null;
    console.error('[MongoDB] Erreur de connexion:', (error as Error).message);
    return false;
  }
}
