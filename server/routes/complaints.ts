import { Router, Request, Response } from 'express';
import { ComplaintModel } from '../models/Complaint';

const router = Router();

// GET complaints by tripId
router.get('/', async (req: Request, res: Response) => {
  try {
    const { tripId } = req.query;
    const query = tripId ? { tripId } : {};
    const complaints = await ComplaintModel.find(query).sort({ createdAt: -1 });
    res.json(complaints);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST complaint
router.post('/', async (req: Request, res: Response) => {
  try {
    const complaint = new ComplaintModel(req.body);
    await complaint.save();
    res.status(201).json(complaint);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// PUT arbitrate / update status (Admin / Organizer action)
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { status, awardedCompensation, resolutionNotes } = req.body;
    const complaint = await ComplaintModel.findByIdAndUpdate(
      req.params.id,
      {
        status,
        awardedCompensation,
        resolutionNotes,
        updatedAt: new Date()
      },
      { new: true }
    );
    if (!complaint) return res.status(404).json({ error: 'Réclamation non trouvée' });
    res.json(complaint);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// DELETE complaint
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await ComplaintModel.findByIdAndDelete(req.params.id);
    res.json({ message: 'Réclamation supprimée de MongoDB' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
