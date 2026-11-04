import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

let cachedPromise: Promise<typeof mongoose> | null = null;

export async function connectMongoDB(): Promise<boolean> {
  if (mongoose.connection.readyState === 1) {
    return true;
  }

  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/traveltracker';

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
