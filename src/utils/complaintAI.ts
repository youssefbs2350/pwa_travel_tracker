import { ComplaintPriority } from '../types';

export type ComplaintCategory = 
  | 'Transport / Vol' 
  | 'Hôtel / Logement' 
  | 'Activité / Guide' 
  | 'Frais imprévu' 
  | 'Bagage' 
  | 'Autre';

export interface AIPredictionResult {
  category: ComplaintCategory;
  priority: ComplaintPriority;
  confidence: number; // 0 - 100%
  urgencyScore: number; // 0 - 100
  detectedKeywords: string[];
  explanation: string;
  recommendedAction: string;
  isCritical: boolean;
}

// ─── Semantic Dictionaries ──────────────────────────────────────────────────

interface TermRule {
  term: string;
  weight: number;
}

const CATEGORY_RULES: Record<ComplaintCategory, TermRule[]> = {
  'Transport / Vol': [
    { term: 'vol annulé', weight: 12 },
    { term: 'vol retardé', weight: 10 },
    { term: 'vol raté', weight: 10 },
    { term: 'retard de vol', weight: 10 },
    { term: 'refus d\'embarquement', weight: 12 },
    { term: 'surbooking', weight: 10 },
    { term: 'compagnie aérienne', weight: 8 },
    { term: 'avion', weight: 7 },
    { term: 'vol', weight: 5 },
    { term: 'aéroport', weight: 7 },
    { term: 'embarquement', weight: 7 },
    { term: 'escale', weight: 7 },
    { term: 'correspondance', weight: 8 },
    { term: 'terminal', weight: 5 },
    { term: 'piste', weight: 5 },
    { term: 'train', weight: 8 },
    { term: 'sncf', weight: 8 },
    { term: 'tgv', weight: 8 },
    { term: 'gare', weight: 7 },
    { term: 'retard train', weight: 10 },
    { term: 'quai', weight: 5 },
    { term: 'bus', weight: 6 },
    { term: 'navette', weight: 6 },
    { term: 'taxi', weight: 6 },
    { term: 'vtc', weight: 6 },
    { term: 'chauffeur', weight: 6 },
    { term: 'uber', weight: 6 },
    { term: 'location voiture', weight: 8 },
    { term: 'véhicule de location', weight: 8 },
    { term: 'crevaison', weight: 6 },
    { term: 'panne voiture', weight: 8 },
    { term: 'péage', weight: 4 },
    { term: 'air france', weight: 8 },
    { term: 'tunisair', weight: 8 },
    { term: 'transavia', weight: 8 },
    { term: 'ryanair', weight: 8 },
    { term: 'easyjet', weight: 8 }
  ],

  'Hôtel / Logement': [
    { term: 'punaises de lit', weight: 15 },
    { term: 'punaise de lit', weight: 15 },
    { term: 'insalubre', weight: 12 },
    { term: 'saleté', weight: 8 },
    { term: 'cafard', weight: 10 },
    { term: 'cafards', weight: 10 },
    { term: 'moisissure', weight: 10 },
    { term: 'odeur nauséabonde', weight: 9 },
    { term: 'pas d\'eau chaude', weight: 9 },
    { term: 'eau coupée', weight: 9 },
    { term: 'climatisation en panne', weight: 9 },
    { term: 'clim cassée', weight: 8 },
    { term: 'chauffage en panne', weight: 8 },
    { term: 'chambre sale', weight: 9 },
    { term: 'draps sales', weight: 9 },
    { term: 'matelas taché', weight: 8 },
    { term: 'hôtel', weight: 7 },
    { term: 'hotel', weight: 7 },
    { term: 'chambre', weight: 7 },
    { term: 'logement', weight: 7 },
    { term: 'hébergement', weight: 7 },
    { term: 'airbnb', weight: 8 },
    { term: 'booking', weight: 7 },
    { term: 'réception', weight: 5 },
    { term: 'check-in', weight: 6 },
    { term: 'check-out', weight: 5 },
    { term: 'clé cassée', weight: 6 },
    { term: 'serrure', weight: 6 },
    { term: 'bruit assourdissant', weight: 8 },
    { term: 'tapage nocturne', weight: 9 },
    { term: 'travaux dans l\'hôtel', weight: 8 },
    { term: 'vue sur poubelle', weight: 6 },
    { term: 'surréservation hôtel', weight: 11 },
    { term: 'caution logement', weight: 7 }
  ],

  'Activité / Guide': [
    { term: 'guide absent', weight: 14 },
    { term: 'guide en retard', weight: 9 },
    { term: 'excursion annulée', weight: 12 },
    { term: 'activité annulée', weight: 12 },
    { term: 'musée fermé', weight: 9 },
    { term: 'monument fermé', weight: 9 },
    { term: 'faux guide', weight: 11 },
    { term: 'arnaque guide', weight: 11 },
    { term: 'billet non valide', weight: 10 },
    { term: 'ticket refusé', weight: 10 },
    { term: 'activité non conforme', weight: 9 },
    { term: 'guide', weight: 7 },
    { term: 'excursion', weight: 7 },
    { term: 'visite guidée', weight: 8 },
    { term: 'visite', weight: 5 },
    { term: 'musée', weight: 6 },
    { term: 'monument', weight: 6 },
    { term: 'plongée', weight: 7 },
    { term: 'randonnée', weight: 7 },
    { term: 'safari', weight: 8 },
    { term: 'animateur', weight: 6 },
    { term: 'croisière', weight: 7 },
    { term: 'spectacle', weight: 6 },
    { term: 'entrée payée', weight: 6 },
    { term: 'ski', weight: 6 },
    { term: 'moniteur', weight: 6 }
  ],

  'Bagage': [
    { term: 'bagage perdu', weight: 15 },
    { term: 'valise perdue', weight: 15 },
    { term: 'bagage égaré', weight: 14 },
    { term: 'perte de bagage', weight: 14 },
    { term: 'bagage endommagé', weight: 12 },
    { term: 'valise cassée', weight: 12 },
    { term: 'vol dans la valise', weight: 14 },
    { term: 'serrure forcée', weight: 11 },
    { term: 'retard bagage', weight: 11 },
    { term: 'tapis à bagages', weight: 8 },
    { term: 'livraison de bagage', weight: 8 },
    { term: 'soute', weight: 7 },
    { term: 'bagage cabine', weight: 6 },
    { term: 'valise', weight: 7 },
    { term: 'bagage', weight: 7 },
    { term: 'sac à dos', weight: 6 },
    { term: 'étiquette bagage', weight: 6 },
    { term: 'affaires personnelles volées', weight: 10 }
  ],

  'Frais imprévu': [
    { term: 'double débit', weight: 14 },
    { term: 'débité deux fois', weight: 14 },
    { term: 'surfacturation', weight: 12 },
    { term: 'frais cachés', weight: 11 },
    { term: 'frais imprévus', weight: 10 },
    { term: 'frais abusifs', weight: 11 },
    { term: 'caution non restituée', weight: 13 },
    { term: 'caution volée', weight: 13 },
    { term: 'escroquerie', weight: 12 },
    { term: 'arnaque financière', weight: 12 },
    { term: 'supplément injustifié', weight: 10 },
    { term: 'taxe de séjour abusive', weight: 8 },
    { term: 'commission bancaire', weight: 7 },
    { term: 'taux de change frauduleux', weight: 9 },
    { term: 'pourboire forcé', weight: 7 },
    { term: 'facture', weight: 6 },
    { term: 'surcoût', weight: 8 },
    { term: 'remboursement refusé', weight: 9 },
    { term: 'carte bancaire débitée', weight: 9 },
    { term: 'prélèvement inconnu', weight: 10 }
  ],

  'Autre': [
    { term: 'remarque', weight: 2 },
    { term: 'avis', weight: 2 },
    { term: 'question', weight: 2 },
    { term: 'suggestion', weight: 2 }
  ]
};

// ─── Urgency Scoring Rules ──────────────────────────────────────────────────

interface UrgencyTrigger {
  term: string;
  points: number;
  isCritical?: boolean;
}

const URGENCY_TRIGGERS: UrgencyTrigger[] = [
  // Niveau Critique / Vital / Sécurité immédiate
  { term: 'urgence', points: 40, isCritical: true },
  { term: 'urgent', points: 30, isCritical: true },
  { term: 'danger', points: 40, isCritical: true },
  { term: 'dangereux', points: 35, isCritical: true },
  { term: 'accident', points: 45, isCritical: true },
  { term: 'blessé', points: 45, isCritical: true },
  { term: 'blessure', points: 40, isCritical: true },
  { term: 'hôpital', points: 50, isCritical: true },
  { term: 'médecin', points: 35, isCritical: true },
  { term: 'ambulance', points: 50, isCritical: true },
  { term: 'intoxication alimentaire', points: 40, isCritical: true },
  { term: 'intoxication', points: 35, isCritical: true },
  { term: 'police', points: 40, isCritical: true },
  { term: 'agression', points: 50, isCritical: true },
  { term: 'menacé', points: 40, isCritical: true },
  { term: 'passeport perdu', points: 45, isCritical: true },
  { term: 'passeport volé', points: 45, isCritical: true },
  { term: 'sans papiers', points: 40, isCritical: true },
  { term: 'sans abri', points: 45, isCritical: true },
  { term: 'bloqué à l\'aéroport', points: 35, isCritical: true },
  { term: 'bloqué à la frontière', points: 45, isCritical: true },
  { term: 'dehors la nuit', points: 40, isCritical: true },
  { term: 'expulsé', points: 40, isCritical: true },

  // Urgence Haute (logistique bloquante, préjudice financier fort)
  { term: 'vol annulé', points: 30 },
  { term: 'bagage perdu', points: 30 },
  { term: 'valise perdue', points: 30 },
  { term: 'chambre indisponible', points: 28 },
  { term: 'punaises de lit', points: 28 },
  { term: 'insalubre', points: 25 },
  { term: 'volé', points: 28 },
  { term: 'vol de', points: 25 },
  { term: 'escroquerie', points: 25 },
  { term: 'arnaque', points: 22 },
  { term: 'remboursement immédiat', points: 22 },
  { term: 'bloqué', points: 20 },
  { term: 'coincé', points: 20 },
  { term: 'surbooking', points: 24 },
  { term: 'double débit', points: 22 },
  { term: 'caution non restituée', points: 20 },

  // Urgence Moyenne (inconfort, retards, prestations non honorées)
  { term: 'retard', points: 15 },
  { term: 'guide absent', points: 18 },
  { term: 'activité annulée', points: 16 },
  { term: 'climatisation', points: 12 },
  { term: 'pas d\'eau chaude', points: 15 },
  { term: 'sale', points: 12 },
  { term: 'bruit', points: 10 },
  { term: 'cassé', points: 10 },
  { term: 'endommagé', points: 14 },
  { term: 'décevant', points: 8 },
  { term: 'non conforme', points: 12 },
  { term: 'attente', points: 8 },

  // Urgence Basse (demande d'info, suggestion)
  { term: 'remarque', points: 4 },
  { term: 'suggestion', points: 3 },
  { term: 'information', points: 3 },
  { term: 'conseil', points: 3 },
  { term: 'accueil', points: 5 },
  { term: 'petit déjeuner', points: 4 },
  { term: 'wifi', points: 5 }
];

// ─── Main AI Prediction Function ────────────────────────────────────────────

export function predictComplaintWithAI(
  title: string, 
  description: string, 
  incidentDate?: string
): AIPredictionResult {
  const fullText = `${title || ''} ${description || ''}`.toLowerCase().trim();
  const detectedKeywords: string[] = [];

  if (fullText.length < 3) {
    return {
      category: 'Transport / Vol',
      priority: 'Moyenne',
      confidence: 40,
      urgencyScore: 25,
      detectedKeywords: [],
      explanation: 'Saisissez le titre ou la description de l\'incident pour activer l\'analyse automatique.',
      recommendedAction: 'Décrivez précisément les faits survenus, la date et les préjudices constatés.',
      isCritical: false
    };
  }

  // 1. Calculate Category Scores
  const categoryScores: Record<ComplaintCategory, number> = {
    'Transport / Vol': 0,
    'Hôtel / Logement': 0,
    'Activité / Guide': 0,
    'Bagage': 0,
    'Frais imprévu': 0,
    'Autre': 0
  };

  for (const [cat, rules] of Object.entries(CATEGORY_RULES) as [ComplaintCategory, TermRule[]][]) {
    for (const rule of rules) {
      if (fullText.includes(rule.term)) {
        categoryScores[cat] += rule.weight;
        if (!detectedKeywords.includes(rule.term)) {
          detectedKeywords.push(rule.term);
        }
      }
    }
  }

  // Find winner category
  let bestCategory: ComplaintCategory = 'Transport / Vol';
  let highestScore = 0;

  for (const [cat, score] of Object.entries(categoryScores) as [ComplaintCategory, number][]) {
    if (score > highestScore) {
      highestScore = score;
      bestCategory = cat;
    }
  }

  // If score is 0, check fallback hints
  if (highestScore === 0) {
    if (fullText.includes('billet') || fullText.includes('gare') || fullText.includes('trajet')) {
      bestCategory = 'Transport / Vol';
    } else if (fullText.includes('nuit') || fullText.includes('dormir') || fullText.includes('séjour')) {
      bestCategory = 'Hôtel / Logement';
    } else if (fullText.includes('euro') || fullText.includes('argent') || fullText.includes('payé')) {
      bestCategory = 'Frais imprévu';
    } else {
      bestCategory = 'Autre';
    }
  }

  // 2. Calculate Urgency Score
  let urgencyPoints = 10; // Baseline
  let isCritical = false;

  for (const trigger of URGENCY_TRIGGERS) {
    if (fullText.includes(trigger.term)) {
      urgencyPoints += trigger.points;
      if (trigger.isCritical) {
        isCritical = true;
      }
      if (!detectedKeywords.includes(trigger.term)) {
        detectedKeywords.push(trigger.term);
      }
    }
  }

  // Boost urgency if amount requested is high (> 300)
  if (/\b([3-9]\d{2}|\d{4,})\s*(€|\$|eur|tnd)/i.test(fullText)) {
    urgencyPoints += 15;
    detectedKeywords.push('montant financier élevé');
  }

  // Normalize urgency score between 0 and 100
  const normalizedUrgency = Math.min(100, Math.max(5, urgencyPoints));

  let priority: ComplaintPriority = 'Basse';
  if (isCritical || normalizedUrgency >= 65) {
    priority = 'Urgente';
  } else if (normalizedUrgency >= 40) {
    priority = 'Haute';
  } else if (normalizedUrgency >= 20) {
    priority = 'Moyenne';
  } else {
    priority = 'Basse';
  }

  // 3. Compute Confidence Score
  const keywordCount = detectedKeywords.length;
  let confidence = Math.min(98, 55 + (keywordCount * 9) + (highestScore > 15 ? 15 : highestScore));
  if (fullText.length > 50 && keywordCount >= 2) confidence = Math.max(confidence, 85);

  // 4. Generate Meaningful Explanation and Action Recommendations
  let explanation = '';
  let recommendedAction = '';

  switch (bestCategory) {
    case 'Transport / Vol':
      explanation = priority === 'Urgente'
        ? `Alerte IA Transport Critique : Incident majeur avec blocage logistique ou annulation immédiate (${detectedKeywords.slice(0, 3).join(', ')}). Priorité Urgente requise.`
        : `L'IA a identifié un préjudice de transport aérien ou ferroviaire (${detectedKeywords.slice(0, 3).join(', ')}). Priorité qualifiée en ${priority}.`;
      recommendedAction = 'Conservez vos cartes d\'embarquement, billets et attestations de retard délivrées par le transporteur pour l\'indemnisation forfaitaire (règlement UE 261/2004 si applicable).';
      break;

    case 'Hôtel / Logement':
      explanation = priority === 'Urgente' || priority === 'Haute'
        ? `L'IA détecte une défaillance d'hébergement sévère ou sanitaire (${detectedKeywords.slice(0, 3).join(', ')}). Nécessite un relogement ou dédommagement rapide.`
        : `Désagrément lié à la qualité ou conformité du logement (${detectedKeywords.slice(0, 3).join(', ')}).`;
      recommendedAction = 'Prenez des photos et vidéos horodatées des lieux et demandez immédiatement une trace écrite à la réception avant tout arbitrage.';
      break;

    case 'Bagage':
      explanation = `Détection Bagagerie : Incident survenu lors du transport ou de la livraison de vos effets (${detectedKeywords.slice(0, 3).join(', ')}). Urgence évaluée à ${priority}.`;
      recommendedAction = 'Déposez obligatoirement un constat d\'irrégularité (PIR) au guichet bagages de l\'aéroport et conservez vos reçus d\'achats de première nécessité.';
      break;

    case 'Activité / Guide':
      explanation = `Analyse IA Excursion : Activité programmée non conforme, annulée ou guide non présent (${detectedKeywords.slice(0, 3).join(', ')}).`;
      recommendedAction = 'Joignez vos vouchers d\'activité et capture d\'écran des échanges pour obtenir le remboursement intégral de la prestation.';
      break;

    case 'Frais imprévu':
      explanation = `Analyse Financière IA : Débit contesté, caution ou surfacturation anormale (${detectedKeywords.slice(0, 3).join(', ')}). Sévérité ${priority}.`;
      recommendedAction = 'Fournissez un extrait de compte bancaire ou reçu justificatif montrant le montant exact du préjudice financier.';
      break;

    default:
      explanation = `L'IA a catégorisé la réclamation en "${bestCategory}" avec un niveau de priorité "${priority}".`;
      recommendedAction = 'Complétez les détails chronologiques pour accélérer la résolution de votre dossier.';
      break;
  }

  return {
    category: bestCategory,
    priority,
    confidence,
    urgencyScore: normalizedUrgency,
    detectedKeywords: detectedKeywords.slice(0, 6),
    explanation,
    recommendedAction,
    isCritical
  };
}
