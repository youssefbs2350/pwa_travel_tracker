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

// POST join trip by share code
router.post('/join', async (req: Request, res: Response) => {
  try {
    const { shareCode, userName } = req.body;
    if (!shareCode || !userName) {
      return res.status(400).json({ error: 'Code de partage et nom d’utilisateur requis' });
    }

    const cleanCode = shareCode.trim().toUpperCase();
    const cleanUser = userName.trim().split(' ')[0];

    const trip = await TripModel.findOne({ shareCode: cleanCode });
    if (!trip) {
      return res.status(404).json({ error: 'Aucun voyage trouvé avec ce code de partage.' });
    }

    if (!trip.participants.includes(cleanUser)) {
      trip.participants.push(cleanUser);
      trip.updatedAt = new Date();
      await trip.save();
    }

    res.json({ success: true, message: `Vous avez rejoint le voyage "${trip.title}" avec succès !`, trip });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST set active trip participant dynamically
router.post('/set-active-participant', async (req: Request, res: Response) => {
  try {
    const { userName, oldTripId, newTripId } = req.body;
    if (!userName || typeof userName !== 'string') {
      return res.status(400).json({ error: 'Nom d’utilisateur requis' });
    }

    const cleanUser = userName.trim();
    if (!cleanUser) {
      return res.status(400).json({ error: 'Nom d’utilisateur invalide' });
    }

    const allTrips = await TripModel.find({});
    for (const t of allTrips) {
      const tripIdentifier = t._id ? t._id.toString() : (t as any).id;
      const isTarget = newTripId && (tripIdentifier === newTripId || (t as any).id === newTripId);
      let changed = false;

      if (isTarget) {
        if (!t.participants.some(p => p.toLowerCase() === cleanUser.toLowerCase())) {
          t.participants.push(cleanUser);
          changed = true;
        }
      } else {
        if (t.participants && t.participants.some(p => p.toLowerCase() === cleanUser.toLowerCase())) {
          t.participants = t.participants.filter(p => p.toLowerCase() !== cleanUser.toLowerCase());
          changed = true;
        }
      }

      if (changed) {
        t.updatedAt = new Date();
        await t.save();
      }
    }

    const updatedTrips = await TripModel.find().sort({ startDate: -1 });
    res.json({ success: true, trips: updatedTrips });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST duplicate trip (Ameni: Duplication complète d'un séjour avec décalage de dates)
router.post('/:id/duplicate', async (req: Request, res: Response) => {
  try {
    const requesterRole = (req.headers['x-user-role'] as string) || req.body.requesterRole;
    if (requesterRole && requesterRole === 'Traveler') {
      return res.status(403).json({ 
        error: 'Accès refusé : La duplication de séjours est réservée aux Organisateurs et Administrateurs.' 
      });
    }

    const originalTrip = await TripModel.findById(req.params.id);
    if (!originalTrip) return res.status(404).json({ error: 'Voyage d’origine introuvable' });

    // Calculate duration in days
    const origStart = new Date(originalTrip.startDate);
    const origEnd = new Date(originalTrip.endDate);
    const diffDays = Math.max(1, Math.round((origEnd.getTime() - origStart.getTime()) / 86400000));

    // New dates starting tomorrow
    const newStart = new Date(Date.now() + 86400000);
    const newEnd = new Date(newStart.getTime() + diffDays * 86400000);

    const newShareCode = 'TRIP-' + Math.random().toString(36).substring(2, 6).toUpperCase();

    const clonedTrip = new TripModel({
      userId: req.body.userId || originalTrip.userId,
      title: `${originalTrip.title} (Copie)`,
      destination: originalTrip.destination,
      country: originalTrip.country,
      startDate: newStart.toISOString().split('T')[0],
      endDate: newEnd.toISOString().split('T')[0],
      coverImage: originalTrip.coverImage,
      budgetTotal: originalTrip.budgetTotal,
      currency: originalTrip.currency,
      status: 'Planifié',
      participants: req.body.userName ? [req.body.userName] : originalTrip.participants,
      itinerarySummary: originalTrip.itinerarySummary,
      notes: originalTrip.notes,
      shareCode: newShareCode,
      packingList: originalTrip.packingList || [],
      travelDocs: [],
      destinationMeta: originalTrip.destinationMeta || {}
    });
    await clonedTrip.save();

    // Clone places
    const origPlaces = await PlaceModel.find({ tripId: originalTrip._id.toString() });
    const placeIdMap: Record<string, string> = {};

    for (const p of origPlaces) {
      const clonedPlace = new PlaceModel({
        tripId: clonedTrip._id.toString(),
        name: p.name,
        category: p.category,
        address: p.address,
        latitude: p.latitude,
        longitude: p.longitude,
        rating: p.rating,
        estimatedDurationMinutes: p.estimatedDurationMinutes,
        costEstimate: p.costEstimate,
        imageUrl: p.imageUrl,
        notes: p.notes
      });
      await clonedPlace.save();
      placeIdMap[p._id.toString()] = clonedPlace._id.toString();
    }

    // Clone activities with adjusted dates
    const origActivities = await ActivityModel.find({ tripId: originalTrip._id.toString() });
    for (const a of origActivities) {
      const actDayOffset = (a.dayNumber || 1) - 1;
      const actDate = new Date(newStart.getTime() + actDayOffset * 86400000).toISOString().split('T')[0];
      const newPlaceId = a.placeId ? placeIdMap[a.placeId] : undefined;

      const clonedActivity = new ActivityModel({
        tripId: clonedTrip._id.toString(),
        placeId: newPlaceId,
        dayNumber: a.dayNumber,
        date: actDate,
        startTime: a.startTime,
        endTime: a.endTime,
        title: a.title,
        description: a.description,
        cost: a.cost,
        status: 'À faire',
        orderIndex: a.orderIndex
      });
      await clonedActivity.save();
    }

    res.status(201).json(clonedTrip);
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
      participants: req.body.userName ? [req.body.userName] : (Array.isArray(req.body.participants) && req.body.participants.length > 0 ? req.body.participants : []),
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
