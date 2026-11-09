import { Trip, Activity, Place, Expense } from '../types';
import { db } from '../db/database';

export interface ReadinessScore {
  totalScore: number; // 0-100
  breakdown: {
    documents: { score: number; max: 20; status: 'complete' | 'partial' | 'missing' };
    packing: { score: number; max: 25; status: 'complete' | 'partial' | 'missing' };
    activities: { score: number; max: 20; status: 'complete' | 'partial' | 'missing' };
    budget: { score: number; max: 15; status: 'complete' | 'partial' | 'missing' };
    insurance: { score: number; max: 10; status: 'complete' | 'partial' | 'missing' };
    participants: { score: number; max: 10; status: 'complete' | 'partial' | 'missing' };
  };
  level: 'beginner' | 'prepared' | 'expert' | 'perfect';
  levelLabel: string;
  suggestions: string[];
}

/**
 * Calcule le score de préparation d'un voyage (0-100%)
 * Analyse : Documents, Packing List, Planning, Budget, Assurance, Participants
 */
export async function calculateTripReadiness(trip: Trip): Promise<ReadinessScore> {
  const breakdown: ReadinessScore['breakdown'] = {
    documents: { score: 0, max: 20, status: 'missing' },
    packing: { score: 0, max: 25, status: 'missing' },
    activities: { score: 0, max: 20, status: 'missing' },
    budget: { score: 0, max: 15, status: 'missing' },
    insurance: { score: 0, max: 10, status: 'missing' },
    participants: { score: 0, max: 10, status: 'missing' }
  };

  const suggestions: string[] = [];

  // 1. Documents de voyage (20 points)
  const docs = trip.travelDocs || [];
  const hasFlightTicket = docs.some(d => d.category === 'Vol / Billet');
  const hasAccommodation = docs.some(d => d.category === 'Hôtel / Logement');
  const hasInsurance = docs.some(d => d.category === 'Assurance');
  const hasIdentity = docs.some(d => d.category === 'Identité / Visa');

  let docScore = 0;
  if (docs.length === 0) {
    breakdown.documents.status = 'missing';
    suggestions.push('📄 Ajoutez vos documents de voyage (billets, réservations)');
  } else if (docs.length < 3) {
    breakdown.documents.status = 'partial';
    docScore = 10;
    if (!hasFlightTicket) suggestions.push('✈️ Uploadez votre billet d\'avion');
    if (!hasAccommodation) suggestions.push('🏨 Ajoutez votre confirmation d\'hébergement');
  } else {
    breakdown.documents.status = 'complete';
    docScore = 20;
  }
  breakdown.documents.score = docScore;

  // 2. Packing List (25 points)
  const packingList = trip.packingList || [];
  const packedItems = packingList.filter(item => item.isPacked).length;
  const packingCompletion = packingList.length > 0 ? (packedItems / packingList.length) * 100 : 0;

  let packingScore = 0;
  if (packingList.length === 0) {
    breakdown.packing.status = 'missing';
    suggestions.push('🎒 Générez votre trousseau intelligent avec l\'IA');
  } else if (packingCompletion < 50) {
    breakdown.packing.status = 'partial';
    packingScore = Math.round((packingCompletion / 100) * 25);
    suggestions.push(`🧳 Complétez votre packing list (${packedItems}/${packingList.length} validés)`);
  } else if (packingCompletion < 100) {
    breakdown.packing.status = 'partial';
    packingScore = Math.round((packingCompletion / 100) * 25);
    suggestions.push(`✅ Finalisez votre trousseau (${packedItems}/${packingList.length})`);
  } else {
    breakdown.packing.status = 'complete';
    packingScore = 25;
  }
  breakdown.packing.score = packingScore;

  // 3. Planning & Activités (20 points)
  const activities = await db.activities.where('tripId').equals(trip.id).toArray();
  const places = await db.places.where('tripId').equals(trip.id).toArray();

  let activityScore = 0;
  if (activities.length === 0 && places.length === 0) {
    breakdown.activities.status = 'missing';
    suggestions.push('🗺️ Planifiez vos activités avec le générateur IA');
  } else if (activities.length < 3) {
    breakdown.activities.status = 'partial';
    activityScore = 10;
    suggestions.push('📅 Ajoutez plus d\'activités à votre planning journalier');
  } else {
    breakdown.activities.status = 'complete';
    activityScore = 20;
  }
  breakdown.activities.score = activityScore;

  // 4. Budget synchronisé (15 points)
  const expenses = await db.expenses.where('tripId').equals(trip.id).toArray();
  const hasBudget = trip.budgetTotal > 0;

  let budgetScore = 0;
  if (!hasBudget) {
    breakdown.budget.status = 'missing';
    suggestions.push('💰 Définissez votre budget prévisionnel');
  } else if (expenses.length === 0) {
    breakdown.budget.status = 'partial';
    budgetScore = 8;
    suggestions.push('💳 Synchronisez vos dépenses depuis le planning');
  } else {
    breakdown.budget.status = 'complete';
    budgetScore = 15;
  }
  breakdown.budget.score = budgetScore;

  // 5. Assurance & Documents obligatoires (10 points)
  let insuranceScore = 0;
  if (hasInsurance && hasIdentity) {
    breakdown.insurance.status = 'complete';
    insuranceScore = 10;
  } else if (hasInsurance || hasIdentity) {
    breakdown.insurance.status = 'partial';
    insuranceScore = 5;
    if (!hasInsurance) suggestions.push('🛡️ Ajoutez votre attestation d\'assurance voyage');
    if (!hasIdentity) suggestions.push('🪪 Vérifiez la validité de votre passeport/visa');
  } else {
    breakdown.insurance.status = 'missing';
    suggestions.push('🛡️ Souscrivez à une assurance voyage obligatoire');
  }
  breakdown.insurance.score = insuranceScore;

  // 6. Participants confirmés (10 points)
  const participants = trip.participants || [];
  let participantsScore = 0;
  if (participants.length === 0) {
    breakdown.participants.status = 'missing';
    suggestions.push('👥 Ajoutez les participants du voyage');
  } else if (participants.length === 1) {
    breakdown.participants.status = 'partial';
    participantsScore = 5;
  } else {
    breakdown.participants.status = 'complete';
    participantsScore = 10;
  }
  breakdown.participants.score = participantsScore;

  // Calcul du score total
  const totalScore = Math.round(
    breakdown.documents.score +
    breakdown.packing.score +
    breakdown.activities.score +
    breakdown.budget.score +
    breakdown.insurance.score +
    breakdown.participants.score
  );

  // Niveau de préparation
  let level: ReadinessScore['level'] = 'beginner';
  let levelLabel = '';
  
  if (totalScore >= 95) {
    level = 'perfect';
    levelLabel = '🏆 Parfait';
  } else if (totalScore >= 75) {
    level = 'expert';
    levelLabel = '🌟 Expert';
  } else if (totalScore >= 50) {
    level = 'prepared';
    levelLabel = '✅ Bien préparé';
  } else {
    level = 'beginner';
    levelLabel = '🚀 En préparation';
  }

  return {
    totalScore,
    breakdown,
    level,
    levelLabel,
    suggestions: suggestions.slice(0, 3) // Top 3 suggestions prioritaires
  };
}

/**
 * Retourne la couleur du badge selon le score
 */
export function getReadinessColor(score: number): {
  bg: string;
  text: string;
  border: string;
  ring: string;
} {
  if (score >= 95) {
    return {
      bg: 'bg-gradient-to-r from-amber-500 to-yellow-400',
      text: 'text-slate-950',
      border: 'border-amber-400',
      ring: 'ring-amber-500/50'
    };
  } else if (score >= 75) {
    return {
      bg: 'bg-gradient-to-r from-emerald-500 to-teal-400',
      text: 'text-white',
      border: 'border-emerald-400',
      ring: 'ring-emerald-500/50'
    };
  } else if (score >= 50) {
    return {
      bg: 'bg-gradient-to-r from-sky-500 to-blue-400',
      text: 'text-white',
      border: 'border-sky-400',
      ring: 'ring-sky-500/50'
    };
  } else {
    return {
      bg: 'bg-gradient-to-r from-slate-600 to-slate-500',
      text: 'text-white',
      border: 'border-slate-500',
      ring: 'ring-slate-500/50'
    };
  }
}
