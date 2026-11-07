import { ActivityModel } from '../models/Activity';
import { TripModel } from '../models/Trip';
import { PlaceModel } from '../models/Place';
import { UserModel } from '../models/User';
import { sendActivityAlertEmail } from '../mailer';
import { connectMongoDB } from '../db';

function timeToMinutes(t: string): number {
  if (!t || !t.includes(':')) return 540;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Service d'arrière-plan autonome :
 * Vérifie toutes les activités prévues dans moins de 10 minutes,
 * envoie l'e-mail d'alerte automatiquement et verrouille en BDD pour empêcher tout renvoi.
 * Fonctionne même lorsque l'utilisateur n'a pas l'application ouverte !
 */
export async function checkAndSendDueActivityAlerts(): Promise<{
  checked: number;
  alertedCount: number;
  details: string[];
}> {
  await connectMongoDB();

  const now = new Date();
  // Heure en UTC et heure en UTC+1 (fuseau utilisateur)
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
    const matchesDate = !act.date || act.date === todayUtc || act.date === todayLocal;
    if (!matchesDate) continue;

    const startMin = timeToMinutes(act.startTime);
    const diffLocal = startMin - localMinutes;
    const diffUtc = startMin - utcMinutes;

    const isDue = (diffLocal > 0 && diffLocal <= 10) || (diffUtc > 0 && diffUtc <= 10);

    if (isDue) {
      const minutesRemaining = (diffLocal > 0 && diffLocal <= 10) ? diffLocal : diffUtc;

      const trip = await TripModel.findOne({ id: act.tripId });
      const place = act.placeId ? await PlaceModel.findOne({ id: act.placeId }) : null;

      let recipientEmail = 'youssefbs2350@gmail.com';
      let recipientName = 'Voyageur';

      if (trip?.participants && trip.participants.length > 0) {
        const foundUser = await UserModel.findOne({ name: trip.participants[0] });
        if (foundUser?.email) {
          recipientEmail = foundUser.email;
          recipientName = foundUser.name;
        }
      }

      if (!recipientEmail || recipientEmail === 'noreply@traveltracker.app') {
        const defaultUser = await UserModel.findOne({ email: 'youssefbs2350@gmail.com' });
        recipientEmail = defaultUser?.email || 'youssefbs2350@gmail.com';
      }

      console.log(`[Auto-Alert Server] Envoi automatique pour "${act.title}" (${act.startTime}) à ${recipientEmail}`);

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
        act.alertSent = true;
        act.alertSentAt = new Date().toISOString();
        await act.save();
        alertedCount++;
        details.push(`Alerte envoyée pour "${act.title}" (${act.startTime}) à ${recipientEmail}`);
      } else {
        details.push(`Échec envoi "${act.title}": ${result.message}`);
      }
    }
  }

  return { checked: activities.length, alertedCount, details };
}
