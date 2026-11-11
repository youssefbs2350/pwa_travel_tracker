import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Cache de la connexion pour les fonctions serverless Vercel
// La connexion est réutilisée entre les invocations dans la même instance
let cachedPromise: Promise<typeof mongoose> | null = null;

export async function connectMongoDB(): Promise<boolean> {
  // Déjà connecté → réutilisation immédiate (pas de round-trip)
  if (mongoose.connection.readyState === 1) {
    return true;
  }

  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('[MongoDB] MONGO_URI non définie dans les variables d\'environnement.');
    return false;
  }

  try {
    if (!cachedPromise) {
      mongoose.set('strictQuery', false);
      cachedPromise = mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
        // Pool de connexions optimisé pour Vercel Serverless
        // (max 5 connexions par instance pour ne pas épuiser Atlas Free Tier)
        maxPoolSize: 5,
        minPoolSize: 1,
        // Reconnexion automatique rapide
        heartbeatFrequencyMS: 10000,
        socketTimeoutMS: 30000,
        connectTimeoutMS: 10000,
      });
    }
    await cachedPromise;
    console.log('[MongoDB] Connecté avec succès (pool actif)');
    return true;
  } catch (error) {
    cachedPromise = null; // Réinitialise pour permettre une prochaine tentative
    console.error('[MongoDB] Erreur de connexion:', (error as Error).message);
    return false;
  }
}
