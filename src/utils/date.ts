/**
 * Utilitaires de gestion des dates avec préservation du fuseau horaire local.
 * Évite les décalages de dates provoqués par le passage en UTC (.toISOString()).
 */

/**
 * Parse une chaîne de date (ex: "2026-11-08" ou "2026-11-08T00:00:00Z") en objet Date local à minuit (00:00:00).
 */
export function parseLocalDate(dateStr?: string | null): Date {
  if (!dateStr) {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  }
  const clean = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr.trim();
  const parts = clean.split('-').map(Number);
  if (parts.length !== 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  }
  return new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0);
}

/**
 * Formate un objet Date en chaîne "YYYY-MM-DD" selon l'heure locale (évite .toISOString() et son décalage UTC).
 */
export function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Retourne la date d'aujourd'hui à minuit (00:00:00) en heure locale.
 */
export function getTodayLocalDate(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
}

/**
 * Retourne la date d'aujourd'hui au format "YYYY-MM-DD" en heure locale.
 */
export function getTodayLocalDateStr(): string {
  return formatLocalDate(getTodayLocalDate());
}

/**
 * Calcule la date exacte d'un jour spécifique de voyage (Jour 1 = startDate).
 */
export function getDateForTripDay(startDateStr: string, dayNumber: number): Date {
  const base = parseLocalDate(startDateStr);
  return new Date(base.getFullYear(), base.getMonth(), base.getDate() + (dayNumber - 1), 0, 0, 0, 0);
}

/**
 * Formate une date courte en français (ex: "dim. 8 nov.").
 */
export function formatDayShort(date: Date): string {
  return date.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });
}

/**
 * Formate une date complète en français (ex: "Dimanche 8 novembre 2026").
 */
export function formatDayFull(date: Date): string {
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

/**
 * Interface représentant le statut temporel d'un voyage par rapport au calendrier réel.
 */
export interface TripTemporalStatus {
  status: 'future' | 'current' | 'past' | 'no_dates';
  currentDay: number | null; // Jour actuel (1..N) si le voyage est en cours AUJOURD'HUI, null si futur ou passé
  isCurrent: boolean;        // Le séjour est en cours aujourd'hui
  isFuture: boolean;         // Le séjour est planifié pour plus tard
  isPast: boolean;           // Le séjour est déjà achevé
  daysDifference: number;    // Nombre de jours restants (si futur) ou écoulés (si passé)
  totalDays: number;         // Nombre total de jours prévus pour le séjour
  startDate: Date;
  endDate: Date;
}

/**
 * Calcule avec précision le statut temporel du voyage par rapport à la date réelle d'aujourd'hui.
 */
export function computeTripTemporalStatus(
  startDateStr?: string | null,
  endDateStr?: string | null,
  maxActivityDay: number = 1
): TripTemporalStatus {
  if (!startDateStr) {
    const today = getTodayLocalDate();
    return {
      status: 'no_dates',
      currentDay: 1,
      isCurrent: true,
      isFuture: false,
      isPast: false,
      daysDifference: 0,
      totalDays: Math.max(1, maxActivityDay),
      startDate: today,
      endDate: today
    };
  }

  const tripStart = parseLocalDate(startDateStr);
  const totalDays = endDateStr
    ? Math.max(1, Math.round((parseLocalDate(endDateStr).getTime() - tripStart.getTime()) / 86400000) + 1)
    : Math.max(1, maxActivityDay);

  const tripEndDay = new Date(tripStart.getFullYear(), tripStart.getMonth(), tripStart.getDate() + (totalDays - 1), 0, 0, 0, 0);
  const tripEnd = new Date(tripStart.getFullYear(), tripStart.getMonth(), tripStart.getDate() + (totalDays - 1), 23, 59, 59, 999);
  const today = getTodayLocalDate();

  // 1. Voyage dans le futur : aujourd'hui est strictement avant la date de début
  if (today.getTime() < tripStart.getTime()) {
    const daysUntil = Math.round((tripStart.getTime() - today.getTime()) / 86400000);
    return {
      status: 'future',
      currentDay: null,
      isCurrent: false,
      isFuture: true,
      isPast: false,
      daysDifference: daysUntil,
      totalDays,
      startDate: tripStart,
      endDate: tripEnd
    };
  }

  // 2. Voyage terminé dans le passé : aujourd'hui est strictement après la date de fin
  if (today.getTime() > tripEndDay.getTime()) {
    const daysSince = Math.round((today.getTime() - tripEndDay.getTime()) / 86400000);
    return {
      status: 'past',
      currentDay: null,
      isCurrent: false,
      isFuture: false,
      isPast: true,
      daysDifference: daysSince,
      totalDays,
      startDate: tripStart,
      endDate: tripEnd
    };
  }

  // 3. Voyage actuellement EN COURS !
  // Si le voyage a débuté hier (07/11) et aujourd'hui (08/11) : (08 - 07) = 1 jour -> Jour 2
  const dayIndex = Math.floor((today.getTime() - tripStart.getTime()) / 86400000) + 1;
  const currentDay = Math.min(Math.max(1, dayIndex), totalDays);

  return {
    status: 'current',
    currentDay,
    isCurrent: true,
    isFuture: false,
    isPast: false,
    daysDifference: 0,
    totalDays,
    startDate: tripStart,
    endDate: tripEnd
  };
}
