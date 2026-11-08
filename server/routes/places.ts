import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { PlaceModel } from '../models/Place';

const router = Router();

// Helper: construit le filtre MongoDB selon le type d'id (ObjectId ou custom)
function buildIdFilter(id: string): Record<string, any> {
  if (mongoose.Types.ObjectId.isValid(id)) {
    return { $or: [{ _id: id }, { id }] };
  }
  return { id };
}

// GET places by tripId  (READ)
router.get('/', async (req: Request, res: Response) => {
  try {
    const tripId = req.query.tripId as string | undefined;
    const query: Record<string, any> = tripId ? { tripId } : {};
    const places = await PlaceModel.find(query).sort({ createdAt: -1 });
    res.json(places);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// GET single place by id  (READ ONE)
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const filter = buildIdFilter(id);
    const place = await PlaceModel.findOne(filter);
    if (!place) return res.status(404).json({ error: 'Lieu introuvable' });
    res.json({ ...place.toObject(), id: place.id || place._id });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST place — single or bulk  (CREATE)
router.post('/', async (req: Request, res: Response) => {
  try {
    if (Array.isArray(req.body)) {
      const places = await PlaceModel.insertMany(req.body);
      return res.status(201).json(places);
    }
    const place = new PlaceModel(req.body);
    await place.save();
    res.status(201).json(place);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// PUT place — update  (UPDATE)
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const filter = buildIdFilter(id);
    const updated = await PlaceModel.findOneAndUpdate(filter, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Lieu introuvable' });
    res.json({ ...updated.toObject(), id: updated.id || updated._id });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// DELETE place  (DELETE)
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const filter = buildIdFilter(id);
    const deleted = await PlaceModel.findOneAndDelete(filter);
    res.json({ message: 'Lieu supprimé', deleted: !!deleted });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
