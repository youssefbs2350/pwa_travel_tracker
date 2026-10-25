import { Router, Request, Response } from 'express';
import { TripModel } from '../models/Trip';
import { PlaceModel } from '../models/Place';
import { ActivityModel } from '../models/Activity';
import { ExpenseModel } from '../models/Expense';
import { MemoryModel } from '../models/Memory';
import { ComplaintModel } from '../models/Complaint';

const router = Router();

interface SyncMutation {
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  collection: 'trips' | 'places' | 'activities' | 'expenses' | 'memories' | 'complaints';
  data: any;
}

// POST /api/sync : Replays all offline queued mutations into MongoDB
router.post('/', async (req: Request, res: Response) => {
  const { mutations } = req.body as { mutations: SyncMutation[] };
  if (!mutations || !Array.isArray(mutations)) {
    return res.status(400).json({ error: 'Format de synchronisation invalide.' });
  }

  const results: { success: boolean; collection: string; action: string; id?: string }[] = [];

  for (const mut of mutations) {
    try {
      let Model: any;
      switch (mut.collection) {
        case 'trips': Model = TripModel; break;
        case 'places': Model = PlaceModel; break;
        case 'activities': Model = ActivityModel; break;
        case 'expenses': Model = ExpenseModel; break;
        case 'memories': Model = MemoryModel; break;
        case 'complaints': Model = ComplaintModel; break;
      }

      if (!Model) continue;

      if (mut.type === 'CREATE') {
        const item = new Model(mut.data);
        await item.save();
        results.push({ success: true, collection: mut.collection, action: 'CREATE', id: item._id });
      } else if (mut.type === 'UPDATE') {
        const id = mut.data._id || mut.data.id;
        await Model.findByIdAndUpdate(id, mut.data, { new: true });
        results.push({ success: true, collection: mut.collection, action: 'UPDATE', id });
      } else if (mut.type === 'DELETE') {
        const id = mut.data._id || mut.data.id;
        await Model.findByIdAndDelete(id);
        results.push({ success: true, collection: mut.collection, action: 'DELETE', id });
      }
    } catch (err) {
      results.push({ success: false, collection: mut.collection, action: mut.type });
    }
  }

  res.json({ message: 'Synchronisation vers MongoDB terminée.', processedCount: results.length, details: results });
});

export default router;
