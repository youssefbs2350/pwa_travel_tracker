import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { ActivityModel } from '../models/Activity';
import { sendActivityAlertEmail } from '../mailer';

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

function buildIdFilter(id: string) {
  if (mongoose.Types.ObjectId.isValid(id)) {
    return { $or: [{ _id: id }, { id }] };
  }
  return { id };
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

// PUT update status or details (gère ObjectId et id custom sans CastError)
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const filter = buildIdFilter(req.params.id);
    const activity = await ActivityModel.findOneAndUpdate(filter, req.body, { new: true });
    if (!activity) return res.status(404).json({ error: 'Activité non trouvée' });
    res.json(activity);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// DELETE activity (gère ObjectId et id custom sans CastError)
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const filter = buildIdFilter(req.params.id);
    await ActivityModel.findOneAndDelete(filter);
    res.json({ message: 'Activité supprimée de MongoDB' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST /api/activities/optimize (Algorithme d'optimisation sans croisement horaire)
router.post('/optimize', async (req: Request, res: Response) => {
  try {
    const { tripId, dayNumber, bufferMinutes = 15 } = req.body;
    const dayNum = Number(dayNumber);
    const acts = await ActivityModel.find({ tripId, dayNumber: dayNum });

    if (acts.length === 0) {
      return res.json({ message: 'Aucune activité à optimiser pour ce jour.', activities: [] });
    }

    // Tri numérique en minutes pour éliminer tout bug de tri alphabétique
    acts.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

    let lastEndTimeMinutes = 0;

    for (let i = 0; i < acts.length; i++) {
      const act = acts[i];
      let startMin = timeToMinutes(act.startTime);
      let endMin = timeToMinutes(act.endTime);

      let duration = endMin - startMin;
      if (duration <= 0) duration = 90;

      if (i === 0) {
        startMin = Math.max(startMin, 540); // Au plus tôt 09:00
        endMin = startMin + duration;
        lastEndTimeMinutes = endMin;
      } else {
        if (startMin < lastEndTimeMinutes) {
          startMin = lastEndTimeMinutes + Number(bufferMinutes);
          endMin = startMin + duration;
        } else {
          endMin = startMin + duration;
        }
        lastEndTimeMinutes = endMin;
      }

      act.startTime = minutesToTime(startMin);
      act.endTime = minutesToTime(endMin);
      act.orderIndex = i;
      await act.save();
    }

    const updated = await ActivityModel.find({ tripId, dayNumber: dayNum });
    updated.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
    res.json({ 
      message: 'Planning optimisé sans aucun croisement d’horaire !', 
      activities: updated 
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST /api/activities/alert-email (Notification intelligente par email pour activité imminente)
router.post('/alert-email', async (req: Request, res: Response) => {
  try {
    const { to, userName, activityTitle, startTime, locationName, locationAddress, tripTitle, minutesRemaining } = req.body;
    if (!to || !activityTitle || !startTime) {
      return res.status(400).json({ error: 'Champs obligatoires manquants (to, activityTitle, startTime).' });
    }

    const result = await sendActivityAlertEmail({
      to,
      userName,
      activityTitle,
      startTime,
      locationName,
      locationAddress,
      tripTitle,
      minutesRemaining: Number(minutesRemaining) || 15
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
