import { Router, Request, Response } from 'express';
import { ComplaintModel } from '../models/Complaint';
import { UserModel } from '../models/User';
import { TripModel } from '../models/Trip';
import { sendComplaintStatusEmail } from '../mailer';

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
    const complaintData = { ...req.body };
    if (!complaintData.userEmail && complaintData.userId) {
      try {
        const user = await UserModel.findById(complaintData.userId);
        if (user?.email) complaintData.userEmail = user.email;
      } catch {
        // ignore
      }
    }

    // Initialize complaint history audit trail
    const initialHistoryEntry = {
      id: 'hist-' + Date.now(),
      action: 'Création & Dépôt du dossier',
      date: new Date().toISOString(),
      byUserId: complaintData.userId,
      byUserName: complaintData.userName || 'Voyageur',
      byUserRole: 'Traveler',
      newStatus: 'Soumis',
      note: complaintData.description 
        ? (complaintData.description.length > 120 ? complaintData.description.slice(0, 120) + '...' : complaintData.description)
        : 'Dépôt initial de la réclamation avec analyse IA.',
      awardedCompensation: complaintData.requestedCompensation || '',
      emailSent: false
    };
    complaintData.history = [initialHistoryEntry];

    const complaint = new ComplaintModel(complaintData);
    await complaint.save();
    res.status(201).json(complaint);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// PUT arbitrate / update status (Admin / Organizer action) + Notification Email + History Log
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { status, awardedCompensation, resolutionNotes, byUserId, byUserName, byUserRole } = req.body;
    
    // Find existing to detect status change
    const existing = await ComplaintModel.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Réclamation non trouvée' });

    const previousStatus = existing.status;
    const isStatusChanged = status && status !== previousStatus;

    if (status !== undefined) existing.status = status;
    if (awardedCompensation !== undefined) existing.awardedCompensation = awardedCompensation;
    if (resolutionNotes !== undefined) existing.resolutionNotes = resolutionNotes;
    existing.updatedAt = new Date();

    let emailSent = false;
    let emailStatusMessage = '';

    // If status changed, notify the traveler by email
    if (isStatusChanged) {
      let targetEmail = existing.userEmail;
      let userName = existing.userName;

      if (!targetEmail && existing.userId) {
        try {
          const user = await UserModel.findById(existing.userId);
          if (user?.email) {
            targetEmail = user.email;
            if (!userName || userName === 'Voyageur') userName = user.name;
          }
        } catch {
          // ignore
        }
      }

      let tripTitle = '';
      if (existing.tripId) {
        try {
          const trip = await TripModel.findById(existing.tripId);
          if (trip?.title) tripTitle = trip.title;
        } catch {
          // ignore
        }
      }

      if (targetEmail) {
        try {
          const mailRes = await sendComplaintStatusEmail({
            to: targetEmail,
            userName,
            complaintTitle: existing.title,
            category: existing.category,
            previousStatus,
            newStatus: existing.status,
            tripTitle,
            resolutionNotes: existing.resolutionNotes,
            awardedCompensation: existing.awardedCompensation,
            complaintId: existing._id?.toString() || existing.id,
          });
          emailSent = mailRes.sent;
          emailStatusMessage = mailRes.message;
        } catch (mailErr) {
          emailSent = false;
          emailStatusMessage = (mailErr as Error).message;
        }
      } else {
        emailStatusMessage = 'Aucun email trouvé pour ce voyageur.';
      }
    }

    // Append treatment step to History audit trail
    let historyAction = 'Mise à jour du dossier';
    if (existing.status === 'Résolu') {
      historyAction = 'Arbitrage Favorable & Résolution';
    } else if (existing.status === 'Rejeté') {
      historyAction = 'Dossier Rejeté & Clôturé';
    } else if (existing.status === "En cours d'analyse") {
      historyAction = 'Prise en charge & Mise en analyse';
    }

    if (!Array.isArray(existing.history)) {
      existing.history = [];
    }

    existing.history.push({
      id: 'hist-' + Date.now(),
      action: historyAction,
      date: new Date().toISOString(),
      byUserId: byUserId || '',
      byUserName: byUserName || 'Organisateur / Support',
      byUserRole: byUserRole || 'Admin',
      previousStatus,
      newStatus: existing.status,
      note: resolutionNotes || existing.resolutionNotes || '',
      awardedCompensation: awardedCompensation || existing.awardedCompensation || '',
      emailSent
    });

    await existing.save();

    res.json({
      ...existing.toObject(),
      emailSent,
      emailStatusMessage
    });
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
