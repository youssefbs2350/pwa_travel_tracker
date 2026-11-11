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

// ── Cache-Control middleware ──────────────────────────────────────────────
// GET de données stables → stale-while-revalidate pour Vercel Edge
// Mutations et données sensibles → no-store
app.use((req, res, next) => {
  if (req.method === 'GET') {
    if (/^\/(api\/)?(places|activities|expenses|memories)/.test(req.path)) {
      // Données stables : CDN peut servir depuis cache 5 min, revalider en arrière-plan
      res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    } else if (/^\/(api\/)?(trips)/.test(req.path)) {
      // Voyages : cache court 2 min
      res.setHeader('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=300');
    } else if (/^\/(api\/)?(health|cron)/.test(req.path)) {
      res.setHeader('Cache-Control', 'public, s-maxage=30');
    } else {
      // users, auth et tout le reste → jamais cachées
      res.setHeader('Cache-Control', 'private, no-cache, no-store');
    }
  } else {
    // POST / PUT / DELETE → jamais cachées
    res.setHeader('Cache-Control', 'no-cache, no-store');
  }
  next();
});
// ─────────────────────────────────────────────────────────────────────────

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

// Endpoint direct pour Vercel Cron et surveillance d'alertes autonome
const cronHandler = async (_req: express.Request, res: express.Response) => {
  try {
    const result = await checkAndSendDueActivityAlerts();
    res.json({
      success: true,
      service: 'Auto Alert Cron Engine',
      timestamp: new Date().toISOString(),
      ...result
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: (err as Error).message
    });
  }
};
app.all('/api/cron/check-alerts', cronHandler);
app.all('/api/cron', cronHandler);
app.all('/api/activities/check-alerts', cronHandler);
app.all('/cron/check-alerts', cronHandler);
app.all('/cron', cronHandler);
app.all('/check-alerts', cronHandler);

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
