import { Router, Request, Response } from 'express';
import { MemoryModel, ReviewModel } from '../models/Memory';
import { UserModel } from '../models/User';

const router = Router();

// GET memories by tripId
router.get('/', async (req: Request, res: Response) => {
  try {
    const { tripId } = req.query;
    const query = tripId ? { tripId } : {};
    const memories = await MemoryModel.find(query).sort({ date: -1 });
    res.json(memories);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST memory
router.post('/', async (req: Request, res: Response) => {
  try {
    const memory = new MemoryModel(req.body);
    await memory.save();
    res.status(201).json(memory);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// DELETE memory
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await MemoryModel.findByIdAndDelete(req.params.id);
    res.json({ message: 'Souvenir supprimé de MongoDB' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// GET reviews
router.get('/reviews', async (req: Request, res: Response) => {
  try {
    const reviews = await ReviewModel.find().sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST review
router.post('/reviews', async (req: Request, res: Response) => {
  try {
    const review = new ReviewModel(req.body);
    await review.save();
    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// GET /api/memories/recommendations (Nourhene Feature: Affinity AI engine)
router.get('/recommendations', async (req: Request, res: Response) => {
  try {
    const { userId, destination = 'Tokyo' } = req.query;
    const user = userId ? await UserModel.findById(userId) : null;
    const interests = user?.preferences?.interests || ['Culture', 'Gastronomie'];

    const pool = [
      {
        id: 'rec-1',
        title: `Visite secrète des ruelles d'artisans`,
        category: 'Monuments',
        destination,
        score: interests.includes('Culture') ? 98 : 84,
        reason: 'Correspondance avec votre intérêt pour la Culture et le patrimoine.',
        estimatedCost: 20,
        suggestedDuration: '2h00',
        imageUrl: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600'
      },
      {
        id: 'rec-2',
        title: `Dégustation gastronomique chez l'habitant`,
        category: 'Restaurant',
        destination,
        score: interests.includes('Gastronomie') ? 96 : 80,
        reason: 'Recommandé par les voyageurs passionnés de saveurs locales.',
        estimatedCost: 40,
        suggestedDuration: '1h30',
        imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600'
      },
      {
        id: 'rec-3',
        title: `Point de vue panoramique au coucher du soleil`,
        category: 'Nature',
        destination,
        score: interests.includes('Nature') ? 95 : 79,
        reason: 'Spot naturel très bien noté par les voyageurs.',
        estimatedCost: 0,
        suggestedDuration: '1h15',
        imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600'
      }
    ];

    res.json(pool.sort((a, b) => b.score - a.score));
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
