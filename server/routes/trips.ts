import { Router, Request, Response } from 'express';
import { TripModel } from '../models/Trip';
import { PlaceModel } from '../models/Place';
import { ActivityModel } from '../models/Activity';

const router = Router();

// GET all trips
router.get('/', async (req: Request, res: Response) => {
  try {
    const trips = await TripModel.find().sort({ startDate: -1 });
    res.json(trips);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// GET single trip
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const trip = await TripModel.findById(req.params.id);
    if (!trip) return res.status(404).json({ error: 'Voyage introuvable' });
    res.json(trip);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST create trip : Réservé aux Organisateurs (Organizer) et Administrateurs (Admin)
router.post('/', async (req: Request, res: Response) => {
  try {
    const requesterRole = (req.headers['x-user-role'] as string) || req.body.requesterRole;
    if (requesterRole && requesterRole === 'Traveler') {
      return res.status(403).json({ 
        error: 'Accès refusé : La création de voyages est réservée aux profils Organisateur (Organizer) et Administrateur (Admin).' 
      });
    }

    const trip = new TripModel(req.body);
    await trip.save();
    res.status(201).json(trip);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// PUT update trip : Réservé aux Organisateurs et Admins
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const requesterRole = (req.headers['x-user-role'] as string) || req.body.requesterRole;
    if (requesterRole && requesterRole === 'Traveler') {
      return res.status(403).json({ 
        error: 'Accès refusé : Seul un Organisateur ou un Administrateur peut modifier un séjour.' 
      });
    }

    const trip = await TripModel.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    if (!trip) return res.status(404).json({ error: 'Voyage introuvable' });
    res.json(trip);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// DELETE trip : Réservé aux Organisateurs et Admins
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const requesterRole = req.headers['x-user-role'] as string;
    if (requesterRole && requesterRole === 'Traveler') {
      return res.status(403).json({ 
        error: 'Accès refusé : Seul un Organisateur ou un Administrateur peut supprimer un séjour.' 
      });
    }

    const tripId = req.params.id;
    await TripModel.findByIdAndDelete(tripId);
    await PlaceModel.deleteMany({ tripId });
    await ActivityModel.deleteMany({ tripId });
    res.json({ message: 'Voyage et données associées supprimés de MongoDB.' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST /api/trips/generate (Ameni: Générateur d'itinéraire IA réservé aux Organisateurs & Admins)
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const requesterRole = (req.headers['x-user-role'] as string) || req.body.requesterRole;
    if (requesterRole && requesterRole === 'Traveler') {
      return res.status(403).json({ 
        error: 'Accès refusé : La génération d’itinéraires est réservée aux profils Organisateur et Admin.' 
      });
    }

    const { destination, days = 4, pace = 'Balanced', theme = 'Culture & Gastronomie', userId = 'usr-default' } = req.body;

    const start = new Date();
    const end = new Date(Date.now() + days * 86400000);

    const trip = new TripModel({
      userId,
      title: `Escapade ${theme} à ${destination}`,
      destination,
      country: destination.includes(',') ? destination.split(',')[1].trim() : 'International',
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      coverImage: 'https://images.unsplash.com/photo-1511527661048-7fe73d85e9a4?w=1200&auto=format&fit=crop&q=80',
      budgetTotal: days * (pace === 'Intense' ? 220 : 160),
      currency: 'EUR',
      status: 'Planifié',
      participants: ['Moi', 'Compagnon de voyage'],
      itinerarySummary: `Circuit optimisé généré par IA pour un rythme ${pace} sur ${days} jours.`
    });
    await trip.save();

    const place = new PlaceModel({
      tripId: trip._id.toString(),
      name: `Centre Historique de ${destination.split(',')[0]}`,
      category: 'Monuments',
      address: `Cœur de ville, ${destination}`,
      latitude: 41.3879,
      longitude: 2.1699,
      rating: 4.8,
      estimatedDurationMinutes: 120,
      costEstimate: 0,
      imageUrl: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600'
    });
    await place.save();

    const activity = new ActivityModel({
      tripId: trip._id.toString(),
      placeId: place._id.toString(),
      dayNumber: 1,
      date: start.toISOString().split('T')[0],
      startTime: '09:30',
      endTime: '12:00',
      title: `Visite guidée : Trésors de ${destination.split(',')[0]}`,
      description: 'Parcours architectural optimisé sans file d’attente.',
      cost: 20,
      status: 'À faire',
      orderIndex: 0
    });
    await activity.save();

    res.status(201).json({ trip, place, activity });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
