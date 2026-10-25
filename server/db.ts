import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/traveltracker';

export async function connectMongoDB(): Promise<boolean> {
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[MongoDB] Connecté avec succès à : ${MONGO_URI}`);
    return true;
  } catch (error) {
    console.error(`[MongoDB] Erreur de connexion à ${MONGO_URI}:`, (error as Error).message);
    return false;
  }
}
