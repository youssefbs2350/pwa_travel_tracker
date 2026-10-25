import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
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

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/places', placeRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/memories', memoryRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/sync', syncRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Travel Tracker MongoDB API', time: new Date() });
});

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

startServer();
