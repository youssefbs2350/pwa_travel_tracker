import { ActivityModel } from '../models/Activity';
import { TripModel } from '../models/Trip';
import { PlaceModel } from '../models/Place';
import { UserModel } from '../models/User';
import { sendActivityAlertEmail } from '../mailer';
import { connectMongoDB } from '../db';
import mongoose from 'mongoose';

function timeToMinutes(t: string): number {
  if (!t || !t.includes(':')) return 540;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Service d'arrière-plan autonome pour tout le séjour :
 * - Analyse TOUTES les activités du séjour (Jour 1, Jour 2, Jour 3, etc.)
 * - Détecte celles prévues pour le jour actuel qui débutent dans ≤ 10 minutes
 * - Envoie l'alerte email à tous les voyageurs associés au voyage (créateur et participants)
 * - Empêche strictement tout doublon grâce à alertSent: true
 */
export async function checkAndSendDueActivityAlerts(): Promise<{
  checked: number;
  alertedCount: number;
  details: string[];
}> {
  await connectMongoDB();

  const now = new Date();
  // Fuseaux horaires : UTC et UTC+1 (fuseau utilisateur France / Tunisie / Europe centrale)
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const localMinutes = ((now.getUTCHours() + 1) % 24) * 60 + now.getUTCMinutes();

  const todayUtc = now.toISOString().split('T')[0];
  const dLocal = new Date(now.getTime() + 3600000);
  const todayLocal = dLocal.toISOString().split('T')[0];

  // Sélectionne toutes les activités non terminées qui n'ont pas encore reçu d'alerte
  const activities = await ActivityModel.find({
    status: { $ne: 'Terminé' },
    $or: [{ alertSent: false }, { alertSent: { $exists: false } }]
  });

  const details: string[] = [];
  let alertedCount = 0;

  for (const act of activities) {
    // 1. Récupération du voyage associé
    const tripFilter = mongoose.Types.ObjectId.isValid(act.tripId)
      ? { $or: [{ _id: act.tripId }, { id: act.tripId }] }
      : { id: act.tripId };
    const trip = await TripModel.findOne(tripFilter);

    // 2. Calcul de la date exacte de l'activité sur le séjour (Jour 1, Jour 2, ..., Jour N)
    let activityDateStr: string | null = null;
    if (act.date) {
      activityDateStr = act.date.includes('T') ? act.date.split('T')[0] : act.date.trim();
    } else if (trip?.startDate) {
      // Déduire la date réelle en UTC : startDate + (dayNumber - 1) jours
      const [y, m, d] = trip.startDate.split('T')[0].split('-').map(Number);
      const dayOffset = Math.max(0, (Number(act.dayNumber) || 1) - 1);
      const computedDate = new Date(Date.UTC(y, m - 1, d + dayOffset));
      activityDateStr = computedDate.toISOString().split('T')[0];
    }

    // 3. Vérification si l'activité a lieu AUJOURD'HUI (strictement sur la date réelle d'aujourd'hui)
    const isToday = activityDateStr ? (activityDateStr === todayUtc || activityDateStr === todayLocal) : false;
    if (!isToday) {
      continue;
    }

    // 4. Calcul du temps restant avant le début de l'activité (<= 10 min)
    const startMin = timeToMinutes(act.startTime);
    const diffLocal = startMin - localMinutes;
    const diffUtc = startMin - utcMinutes;

    const isDue = (diffLocal > 0 && diffLocal <= 10) || (diffUtc > 0 && diffUtc <= 10);
    if (!isDue) {
      continue;
    }

    const minutesRemaining = (diffLocal > 0 && diffLocal <= 10) ? diffLocal : diffUtc;
    const place = act.placeId ? await PlaceModel.findOne({ id: act.placeId }) : null;

    // 5. Collecter tous les destinataires du voyage (créateur + participants enregistrés)
    // Permet à deux voyageurs ou plus ayant le même voyage de recevoir chacun l'alerte
    const recipientsMap = new Map<string, string>(); // email -> name

    // A) Créateur du voyage
    if (trip?.userId) {
      const creatorFilter = mongoose.Types.ObjectId.isValid(trip.userId)
        ? { $or: [{ _id: trip.userId }, { id: trip.userId }] }
        : { id: trip.userId };
      const creator = await UserModel.findOne(creatorFilter);
      if (creator?.email) {
        recipientsMap.set(creator.email.toLowerCase().trim(), creator.name);
      }
    }

    // B) Participants du voyage
    if (trip?.participants && Array.isArray(trip.participants)) {
      for (const pName of trip.participants) {
        if (!pName || pName.toLowerCase().includes('compagnon')) continue;
        const participantUser = await UserModel.findOne({
          name: { $regex: new RegExp(`^${pName.trim()}$`, 'i') }
        });
        if (participantUser?.email) {
          recipientsMap.set(participantUser.email.toLowerCase().trim(), participantUser.name);
        }
      }
    }

    // C) Fallback si aucun email trouvé
    if (recipientsMap.size === 0) {
      recipientsMap.set('youssefbs2350@gmail.com', 'Voyageur');
    }

    let emailSentToAtLeastOne = false;

    // 6. Envoi des emails à chaque voyageur concerné
    for (const [recipientEmail, recipientName] of recipientsMap.entries()) {
      console.log(`[Auto-Alert Server] Envoi pour "${act.title}" (Jour ${act.dayNumber || 1}, ${act.startTime}) à ${recipientEmail}`);

      const result = await sendActivityAlertEmail({
        to: recipientEmail,
        userName: recipientName,
        activityTitle: act.title,
        startTime: act.startTime,
        locationName: place?.name,
        locationAddress: place?.address,
        tripTitle: trip?.title || trip?.destination,
        minutesRemaining
      });

      if (result.sent) {
        emailSentToAtLeastOne = true;
        details.push(`Alerte envoyée pour "${act.title}" (Jour ${act.dayNumber || 1}, ${act.startTime}) à ${recipientEmail}`);
      } else {
        details.push(`Échec envoi "${act.title}" à ${recipientEmail}: ${result.message}`);
      }
    }

    // 7. Verrouillage définitif en base de données : une seule alerte par activité
    if (emailSentToAtLeastOne) {
      act.alertSent = true;
      act.alertSentAt = new Date().toISOString();
      await act.save();
      alertedCount++;
    }
  }

  return { checked: activities.length, alertedCount, details };
}
