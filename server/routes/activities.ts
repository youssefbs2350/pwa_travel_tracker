import { Router, Request, Response } from 'express';
import { ActivityModel } from '../models/Activity';

const router = Router();

function timeToMinutes(t: string): number {
  if (!t || !t.includes(':')) return 540; // 09:00 default
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(totalMin: number): string {
  const normalized = Math.max(0, Math.min(23 * 60 + 59, totalMin));
  const h = Math.floor(normalized / 60).toString().padStart(2, '0');
  const m = (normalized % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

// GET activities by tripId
router.get('/', async (req: Request, res: Response) => {
  try {
    const { tripId } = req.query;
    const query = tripId ? { tripId } : {};
    const activities = await ActivityModel.find(query).sort({ dayNumber: 1, startTime: 1 });
    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST activity (single or bulk array)
router.post('/', async (req: Request, res: Response) => {
  try {
    if (Array.isArray(req.body)) {
      const activities = await ActivityModel.insertMany(req.body);
      return res.status(201).json(activities);
    }
    const activity = new ActivityModel(req.body);
    await activity.save();
    res.status(201).json(activity);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// PUT update status or details
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const activity = await ActivityModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!activity) return res.status(404).json({ error: 'Activité non trouvée' });
    res.json(activity);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// DELETE activity
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await ActivityModel.findByIdAndDelete(req.params.id);
    res.json({ message: 'Activité supprimée de MongoDB' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST /api/activities/optimize (Youssef: Algorithme d'optimisation sans croisement horaire)
router.post('/optimize', async (req: Request, res: Response) => {
  try {
    const { tripId, dayNumber, bufferMinutes = 15 } = req.body;
    const acts = await ActivityModel.find({ tripId, dayNumber }).sort({ startTime: 1 });

    if (acts.length === 0) {
      return res.json({ message: 'Aucune activité à optimiser pour ce jour.', activities: [] });
    }

    let lastEndTimeMinutes = 0;

    for (let i = 0; i < acts.length; i++) {
      const act = acts[i];
      let startMin = timeToMinutes(act.startTime);
      let endMin = timeToMinutes(act.endTime);

      // Calcul de la durée prévue (minimum 30 min)
      let duration = endMin - startMin;
      if (duration <= 0) duration = 90;

      if (i === 0) {
        // La première activité démarre à son heure prévue ou 09:00
        lastEndTimeMinutes = startMin + duration;
        act.endTime = minutesToTime(lastEndTimeMinutes);
      } else {
        // Pour les activités suivantes : suppression de tout croisement / chevauchement
        if (startMin < lastEndTimeMinutes) {
          // Croisement détecté ! On décale l'activité après la fin de la précédente + temps de battement
          startMin = lastEndTimeMinutes + Number(bufferMinutes);
          endMin = startMin + duration;
        } else {
          endMin = startMin + duration;
        }

        act.startTime = minutesToTime(startMin);
        act.endTime = minutesToTime(endMin);
        lastEndTimeMinutes = endMin;
      }

      act.orderIndex = i;
      await act.save();
    }

    const updated = await ActivityModel.find({ tripId, dayNumber }).sort({ startTime: 1 });
    res.json({ 
      message: 'Planning optimisé sans aucun croisement d’horaire !', 
      activities: updated 
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
