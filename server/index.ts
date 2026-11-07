import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectMongoDB } from './db';
import { seedMongoDBIfEmpty } from './seed';

// Routes
import userRoutes from './routes/users';
import tripRoutes from './routes/trips';
import placeRoutes from './routes/places';
import activityRoutes from './routes/activities';
import expenseRoutes from './routes/expenses';
import memoryRoutes from './routes/memories';
import complaintRoutes from './routes/complaints';
import syncRoutes from './routes/sync';
import cronRoutes from './routes/cron';
import { checkAndSendDueActivityAlerts } from './services/alertChecker';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 1. Middleware pour connecter MongoDB AVANT toute route (essentiel pour Serverless Vercel)
app.use(async (req, res, next) => {
  try {
    await connectMongoDB();
  } catch (err) {
    console.error('[MongoDB Middleware Error]', err);
  }
  next();
});

// 2. Health check endpoints
const healthHandler = (_req: express.Request, res: express.Response) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  res.json({
    status: 'ok',
    service: 'Travel Tracker MongoDB API',
    database: isDbConnected ? 'connected' : 'disconnected',
    hasMongoUri: !!process.env.MONGO_URI,
    time: new Date()
  });
};
app.get('/api/health', healthHandler);
app.get('/health', healthHandler);

// 3. API Routes avec préfixe /api
app.use('/api/users', userRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/places', placeRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/memories', memoryRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/cron', cronRoutes);

// 4. Fallback direct routes (sans préfixe /api si le rewrite Vercel le retire)
app.use('/users', userRoutes);
app.use('/trips', tripRoutes);
app.use('/places', placeRoutes);
app.use('/activities', activityRoutes);
app.use('/expenses', expenseRoutes);
app.use('/memories', memoryRoutes);
app.use('/complaints', complaintRoutes);
app.use('/sync', syncRoutes);
app.use('/cron', cronRoutes);

// 5. Arrière-plan : vérification autonome des alertes toutes les 60 secondes
setInterval(() => {
  checkAndSendDueActivityAlerts().catch(err => {
    console.error('[Background Alert Checker Error]', (err as Error).message);
  });
}, 60000);

async function startServer() {
  const isConnected = await connectMongoDB();
  if (isConnected) {
    await seedMongoDBIfEmpty();
  } else {
    console.warn('[Server] MongoDB non connecté. Le serveur fonctionne en attente de reconnexion.');
  }

  app.listen(PORT, () => {
    console.log(`[Express] Serveur API en écoute sur http://localhost:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
