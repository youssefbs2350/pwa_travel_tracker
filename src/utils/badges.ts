import { Trip, Expense, Memory, TravelerBadge } from '../types';

/**
 * Calcule les badges voyageur en fonction des données du profil.
 * Tout est calculé côté client à partir des données IndexedDB (offline-first).
 */
export function computeBadges(
  trips: Trip[],
  expenses: Expense[],
  memories: Memory[]
): TravelerBadge[] {
  const completedTrips = trips.filter(t => t.status === 'Terminé');
  const uniqueCountries = new Set(trips.map(t => t.country?.trim()).filter(Boolean));
  const totalBudget = trips.reduce((sum, t) => sum + (t.budgetTotal || 0), 0);
  const totalSpent = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const budgetRatio = totalBudget > 0 ? totalSpent / totalBudget : 1;

  return [
    {
      id: 'first_flight',
      label: 'Premier Vol',
      description: 'Créer votre tout premier voyage',
      icon: '✈️',
      unlocked: trips.length >= 1,
      progress: Math.min(trips.length, 1) * 100,
      progressLabel: `${Math.min(trips.length, 1)}/1 voyage`
    },
    {
      id: 'explorer',
      label: 'Explorateur',
      description: 'Visiter 3 pays différents',
      icon: '🧭',
      unlocked: uniqueCountries.size >= 3,
      progress: Math.min((uniqueCountries.size / 3) * 100, 100),
      progressLabel: `${uniqueCountries.size}/3 pays`
    },
    {
      id: 'budget_master',
      label: 'Maître du Budget',
      description: 'Terminer un voyage en restant sous le budget prévu',
      icon: '💰',
      unlocked: completedTrips.some(trip => {
        const tripExpenses = expenses.filter(e => e.tripId === trip.id);
        const spent = tripExpenses.reduce((s, e) => s + (e.amount || 0), 0);
        return trip.budgetTotal > 0 && spent <= trip.budgetTotal;
      }),
      progress: totalBudget > 0 ? Math.min(Math.round((1 - Math.max(budgetRatio - 1, 0)) * 100), 100) : 0,
      progressLabel: totalBudget > 0 ? `${Math.round(budgetRatio * 100)}% du budget utilisé` : 'Aucun budget'
    },
    {
      id: 'globetrotter',
      label: 'Globe-Trotteur',
      description: 'Terminer 5 voyages',
      icon: '🌍',
      unlocked: completedTrips.length >= 5,
      progress: Math.min((completedTrips.length / 5) * 100, 100),
      progressLabel: `${completedTrips.length}/5 voyages terminés`
    },
    {
      id: 'memory_keeper',
      label: 'Gardien des Souvenirs',
      description: 'Enregistrer 10 souvenirs de voyage',
      icon: '📸',
      unlocked: memories.length >= 10,
      progress: Math.min((memories.length / 10) * 100, 100),
      progressLabel: `${memories.length}/10 souvenirs`
    },
    {
      id: 'all_terrain',
      label: 'Baroudeur Tout-Terrain',
      description: 'Visiter 7 pays différents',
      icon: '🎒',
      unlocked: uniqueCountries.size >= 7,
      progress: Math.min((uniqueCountries.size / 7) * 100, 100),
      progressLabel: `${uniqueCountries.size}/7 pays`
    }
  ];
}
