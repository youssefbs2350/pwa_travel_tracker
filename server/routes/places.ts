import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { PlaceModel } from '../models/Place';

const router = Router();

function buildIdFilter(id: string) {
  if (mongoose.Types.ObjectId.isValid(id)) {
    return { $or: [{ _id: id }, { id }] };
  }
  return { id };
}

// GET places by tripId
router.get('/', async (req: Request, res: Response) => {
  try {
    const { tripId } = req.query;
    const query = tripId ? { tripId } : {};
    const places = await PlaceModel.find(query).sort({ createdAt: -1 });
    res.json(places);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST place (single or bulk array)
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

// DELETE place
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const filter = buildIdFilter(req.params.id);
    await PlaceModel.findOneAndDelete(filter);
    res.json({ message: 'Lieu supprimé de MongoDB' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
