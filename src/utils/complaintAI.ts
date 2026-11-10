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
  suggestedCompensation: string;
  compensationExplanation: string;
  detectedAmount?: number;
  currency?: string;
  isFinancialEmergency?: boolean;
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
    { term: 'bagage retardé', weight: 12 },
    { term: 'bagage endommagé', weight: 12 },
    { term: 'valise cassée', weight: 12 },
    { term: 'fermeture éclair cassée', weight: 8 },
    { term: 'roulette cassée', weight: 8 },
    { term: 'contenu volé', weight: 14 },
    { term: 'vol dans bagage', weight: 14 },
    { term: 'tapis bagage', weight: 6 },
    { term: 'livraison bagage', weight: 8 },
    { term: 'valise', weight: 7 },
    { term: 'bagage', weight: 7 },
    { term: 'sac à dos', weight: 6 },
    { term: 'étiquette bagage', weight: 6 },
    { term: 'affaires personnelles volées', weight: 10 }
  ],

  'Frais imprévu': [
    { term: 'enlèvement d\'un montant', weight: 16 },
    { term: 'enlèvement', weight: 13 },
    { term: 'prélèvement frauduleux', weight: 16 },
    { term: 'prélèvement non autorisé', weight: 16 },
    { term: 'prélèvement abusif', weight: 14 },
    { term: 'débité sans accord', weight: 16 },
    { term: 'débit frauduleux', weight: 16 },
    { term: 'double débit', weight: 15 },
    { term: 'débité deux fois', weight: 15 },
    { term: 'surfacturation', weight: 14 },
    { term: 'frais cachés', weight: 12 },
    { term: 'frais imprévus', weight: 11 },
    { term: 'frais abusifs', weight: 13 },
    { term: 'caution non restituée', weight: 15 },
    { term: 'caution volée', weight: 15 },
    { term: 'caution débitée', weight: 14 },
    { term: 'caution prélevée', weight: 14 },
    { term: 'escroquerie', weight: 14 },
    { term: 'arnaque financière', weight: 14 },
    { term: 'supplément injustifié', weight: 11 },
    { term: 'taxe de séjour abusive', weight: 9 },
    { term: 'commission bancaire', weight: 8 },
    { term: 'taux de change frauduleux', weight: 10 },
    { term: 'pourboire forcé', weight: 8 },
    { term: 'facture', weight: 6 },
    { term: 'surcoût', weight: 9 },
    { term: 'remboursement refusé', weight: 11 },
    { term: 'carte bancaire débitée', weight: 11 },
    { term: 'prélèvement inconnu', weight: 13 },
    { term: 'carte piratée', weight: 15 },
    { term: 'vol d\'argent', weight: 15 }
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
  // Niveau Critique / Vital / Sécurité immédiate / Fraude majeure
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

  // Détection financière critique : enlèvement d'argent, débits frauduleux
  { term: 'enlèvement d\'un montant', points: 45, isCritical: true },
  { term: 'enlèvement de', points: 35, isCritical: true },
  { term: 'enlèvement', points: 28 },
  { term: 'débité sans accord', points: 45, isCritical: true },
  { term: 'prélèvement frauduleux', points: 45, isCritical: true },
  { term: 'retrait frauduleux', points: 45, isCritical: true },
  { term: 'carte piratée', points: 45, isCritical: true },
  { term: 'escroquerie', points: 32, isCritical: true },
  { term: 'vol d\'argent', points: 40, isCritical: true },
  { term: 'caution non restituée', points: 28 },
  { term: 'caution prélevée', points: 30 },
  { term: 'caution débitée', points: 30 },
  { term: 'prélèvement abusif', points: 28 },
  { term: 'somme importante', points: 30 },
  { term: 'montant important', points: 30 },
  { term: 'surfacturation abusive', points: 26 },

  // Urgence Haute (logistique bloquante, préjudice financier fort)
  { term: 'vol annulé', points: 30 },
  { term: 'bagage perdu', points: 30 },
  { term: 'valise perdue', points: 30 },
  { term: 'chambre indisponible', points: 28 },
  { term: 'punaises de lit', points: 28 },
  { term: 'insalubre', points: 25 },
  { term: 'volé', points: 28 },
  { term: 'vol de', points: 25 },
  { term: 'arnaque', points: 24 },
  { term: 'remboursement immédiat', points: 24 },
  { term: 'bloqué', points: 20 },
  { term: 'coincé', points: 20 },
  { term: 'surbooking', points: 24 },
  { term: 'double débit', points: 24 },

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

// ─── Financial Extraction & Analysis ────────────────────────────────────────

export interface FinancialAssessment {
  detectedAmount?: number;
  currency: string;
  isImportantAmount: boolean;
  isUnauthorizedCharge: boolean;
  rawMention?: string;
}

export function extractFinancialImpact(text: string): FinancialAssessment {
  const normalized = text.toLowerCase();

  // Keywords indicating unauthorized debit / unexpected removal
  const unauthorizedKeywords = [
    'enlèvement', 'enlevé', 'débité', 'débit', 'prélèvement', 'prélevé',
    'retrait', 'retiré', 'caution', 'escroquerie', 'arnaque', 'surfacturation',
    'double débit', 'frais abusifs', 'vol d\'argent', 'somme retirée',
    'carte piratée', 'fraude', 'sans mon accord', 'sans autorisation', 'prélevée', 'débitée'
  ];

  const isUnauthorizedCharge = unauthorizedKeywords.some(kw => normalized.includes(kw));

  // Regex for extracting amount and currency: 850€, 1200 EUR, 1 500 euros, 500$, 800 TND, 2500 dinars
  const amountRegex = /(\b\d+(?:[\s.,]\d{3})*(?:[.,]\d{1,2})?)\s*(€|eur|euros?|tnd|dinars?|\$|usd|gbp|£)/i;
  const reverseRegex = /(€|\$|£)\s*(\b\d+(?:[\s.,]\d{3})*(?:[.,]\d{1,2})?)/i;

  let amount: number | undefined;
  let currency = 'EUR';
  let rawMention: string | undefined;

  const match = normalized.match(amountRegex);
  if (match) {
    const rawNum = match[1].replace(/\s+/g, '').replace(',', '.');
    const parsed = parseFloat(rawNum);
    if (!isNaN(parsed) && parsed > 0) {
      amount = parsed;
      const curr = match[2].toUpperCase();
      if (curr.includes('TND') || curr.includes('DINAR')) currency = 'TND';
      else if (curr.includes('$') || curr.includes('USD')) currency = 'USD';
      else if (curr.includes('£') || curr.includes('GBP')) currency = 'GBP';
      else currency = 'EUR';
      rawMention = match[0];
    }
  } else {
    const revMatch = normalized.match(reverseRegex);
    if (revMatch) {
      const rawNum = revMatch[2].replace(/\s+/g, '').replace(',', '.');
      const parsed = parseFloat(rawNum);
      if (!isNaN(parsed) && parsed > 0) {
        amount = parsed;
        const curr = revMatch[1];
        if (curr === '$') currency = 'USD';
        else if (curr === '£') currency = 'GBP';
        else currency = 'EUR';
        rawMention = revMatch[0];
      }
    }
  }

  // Threshold: >= 200 is important, >= 500 is major/critical
  const isImportantAmount = (amount !== undefined && amount >= 200) ||
    normalized.includes('montant important') ||
    normalized.includes('somme importante') ||
    normalized.includes('somme énorme');

  return {
    detectedAmount: amount,
    currency,
    isImportantAmount,
    isUnauthorizedCharge,
    rawMention
  };
}

// ─── AI Compensation Prediction ─────────────────────────────────────────────

function computePredictedCompensation(
  category: ComplaintCategory,
  priority: ComplaintPriority,
  fullText: string,
  fin: FinancialAssessment
): { suggestedCompensation: string; compensationExplanation: string } {
  // 1. Direct explicit amount identified (financial damage)
  if (fin.detectedAmount && fin.detectedAmount > 0) {
    const amt = fin.detectedAmount;
    const cur = fin.currency;

    if (fin.isUnauthorizedCharge || category === 'Frais imprévu') {
      if (priority === 'Urgente' || amt >= 500) {
        const bonus = Math.round(amt * 0.15);
        return {
          suggestedCompensation: `${amt} ${cur} (Remboursement intégral immédiat + ${bonus} ${cur} dédommagement préjudice)`,
          compensationExplanation: `L'IA a identifié un enlèvement ou débit bancaire direct de ${amt} ${cur}. Compte tenu de la criticité Urgente, un remboursement intégral immédiat sous 48h majoré de 15% pour préjudice financier est recommandé.`
        };
      }
      return {
        suggestedCompensation: `${amt} ${cur} (Remboursement intégral du montant contesté)`,
        compensationExplanation: `Montant exact du préjudice financier identifié : ${amt} ${cur}. Remboursement intégral préconisé sur présentation du justificatif ou relevé bancaire.`
      };
    }

    if (category === 'Bagage') {
      const capped = Math.min(amt, 1300);
      return {
        suggestedCompensation: `${capped} ${cur} (Indemnisation valeur déclarée / Convention de Montréal)`,
        compensationExplanation: `Estimation basée sur la valeur déclarée de vos effets (${amt} ${cur}) dans la limite du plafond légal international des transporteurs (1 288 DTS, env. 1 300 €).`
      };
    }

    if (category === 'Hôtel / Logement') {
      return {
        suggestedCompensation: `${amt} ${cur} (Remboursement hébergement + relogement pris en charge)`,
        compensationExplanation: `Montant d'hébergement litigieux de ${amt} ${cur} : annulation sans frais et remboursement complet des nuitées contestées.`
      };
    }

    return {
      suggestedCompensation: `${amt} ${cur} (Indemnisation équivalente au montant subi)`,
      compensationExplanation: `Prise en charge intégrale de la dépense ou du préjudice de ${amt} ${cur}.`
    };
  }

  // 2. No explicit amount: contextual prediction based on legal frameworks and urgency
  switch (category) {
    case 'Transport / Vol':
      if (fullText.includes('annulé') || fullText.includes('refus d\'embarquement') || fullText.includes('surbooking')) {
        return {
          suggestedCompensation: '400 EUR (Indemnité forfaitaire légale UE 261/2004 + Billet alternatif)',
          compensationExplanation: 'Le règlement européen CE 261/2004 accorde une indemnité forfaitaire automatique de 250 € à 600 € selon la distance du vol en cas d\'annulation ou refus d\'embarquement.'
        };
      }
      if (fullText.includes('retard')) {
        return {
          suggestedCompensation: '250 EUR à 400 EUR (Indemnisation forfaitaire retard supérieur à 3h)',
          compensationExplanation: 'Pour tout retard à l\'arrivée dépassant 3 heures, la compagnie aérienne est légalement tenue d\'indemniser entre 250 € et 400 €.'
        };
      }
      return {
        suggestedCompensation: priority === 'Urgente' ? '350 EUR (Assistance et dédommagement prioritaire)' : '180 EUR',
        compensationExplanation: `Indemnisation estimée par l'IA pour préjudice de transport de sévérité ${priority}.`
      };

    case 'Hôtel / Logement':
      if (fullText.includes('punaises') || fullText.includes('insalubre') || priority === 'Urgente') {
        return {
          suggestedCompensation: '100% remboursement de la réservation + Relogement d\'urgence & 100 EUR bon voyage',
          compensationExplanation: 'Condition sanitaire ou de sécurité intenable : remboursement intégral de l\'hébergement et indemnisation du trouble de jouissance.'
        };
      }
      if (priority === 'Haute') {
        return {
          suggestedCompensation: 'Remboursement 50% à 100% de la première nuitée + bon de 50 EUR',
          compensationExplanation: 'Désagrément majeur d\'équipement ou de conformité de chambre.'
        };
      }
      return {
        suggestedCompensation: '50 EUR en bon d\'achat séjour ou remboursement partiel',
        compensationExplanation: 'Compensation forfaitaire pour désagrément de confort léger.'
      };

    case 'Bagage':
      if (fullText.includes('perdu') || fullText.includes('volé')) {
        return {
          suggestedCompensation: 'Jusqu\'à 1 300 EUR (Convention de Montréal) + 120 EUR achats de première nécessité',
          compensationExplanation: 'Plafond légal international de la Convention de Montréal pour perte ou destruction de bagage enregistré.'
        };
      }
      return {
        suggestedCompensation: '120 EUR à 200 EUR (Remboursement de valise ou frais de dépannage)',
        compensationExplanation: 'Dédommagement pour bagage retardé ou coque endommagée au déchargement.'
      };

    case 'Activité / Guide':
      return {
        suggestedCompensation: 'Remboursement 100% de l\'excursion + 40 EUR bon d\'activité',
        compensationExplanation: 'Annulation ou non-conformité de la prestation touristique payée d\'avance.'
      };

    case 'Frais imprévu':
      return {
        suggestedCompensation: priority === 'Urgente' ? '300 EUR (Remboursement d\'urgence du débit)' : '120 EUR',
        compensationExplanation: 'Prise en charge du surcoût, de la caution bloquée ou des frais bancaires injustifiés.'
      };

    default:
      if (priority === 'Urgente') {
        return {
          suggestedCompensation: '300 EUR (Prise en charge d\'urgence prioritaire)',
          compensationExplanation: 'Compensation recommandée pour dossier critique.'
        };
      }
      if (priority === 'Haute') {
        return {
          suggestedCompensation: '150 EUR (Dédommagement préjudice direct)',
          compensationExplanation: 'Compensation adaptée à un litige à fort impact.'
        };
      }
      return {
        suggestedCompensation: '50 EUR en bon de réduction voyage',
        compensationExplanation: 'Geste commercial pour signalement de qualité.'
      };
  }
}

// ─── Main AI Prediction Function ────────────────────────────────────────────

export function predictComplaintWithAI(
  title: string, 
  description: string, 
  incidentDate?: string
): AIPredictionResult {
  const fullText = `${title || ''} ${description || ''}`.toLowerCase().trim();
  const detectedKeywords: string[] = [];

  // Financial assessment
  const fin = extractFinancialImpact(fullText);

  if (fullText.length < 3) {
    return {
      category: 'Transport / Vol',
      priority: 'Moyenne',
      confidence: 40,
      urgencyScore: 25,
      detectedKeywords: [],
      explanation: 'Saisissez le motif ou la description de l\'incident pour activer l\'analyse prédictive.',
      recommendedAction: 'Décrivez précisément les faits survenus, la date et les préjudices constatés.',
      isCritical: false,
      suggestedCompensation: '150 EUR',
      compensationExplanation: 'Estimation standard en attente de détails sur le litige.'
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

  // If unauthorized charge / financial withdrawal is found, prioritize 'Frais imprévu'
  if (fin.isUnauthorizedCharge || (fin.detectedAmount && fin.detectedAmount > 0 && !categoryScores['Transport / Vol'] && !categoryScores['Hôtel / Logement'] && !categoryScores['Bagage'])) {
    categoryScores['Frais imprévu'] += 25;
  }

  let bestCategory: ComplaintCategory = 'Autre';
  let highestScore = 0;

  for (const [cat, score] of Object.entries(categoryScores) as [ComplaintCategory, number][]) {
    if (score > highestScore) {
      highestScore = score;
      bestCategory = cat;
    }
  }

  if (highestScore === 0) {
    bestCategory = 'Transport / Vol';
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

  // Critical Financial Assessment : Important amount removal / unauthorized debit
  let isFinancialEmergency = false;
  if (fin.isImportantAmount || fin.isUnauthorizedCharge) {
    if (fin.detectedAmount && fin.detectedAmount >= 500) {
      urgencyPoints += 50;
      isCritical = true;
      isFinancialEmergency = true;
      detectedKeywords.unshift(`enlèvement important (${fin.detectedAmount} ${fin.currency})`);
    } else if (fin.detectedAmount && fin.detectedAmount >= 200) {
      urgencyPoints += 35;
      if (fin.isUnauthorizedCharge) {
        isCritical = true;
        isFinancialEmergency = true;
      }
      detectedKeywords.unshift(`débit contesté (${fin.detectedAmount} ${fin.currency})`);
    } else if (fin.isUnauthorizedCharge) {
      urgencyPoints += 30;
      isFinancialEmergency = true;
      detectedKeywords.unshift('enlèvement / prélèvement indu');
    }
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
  let confidence = Math.min(98, 55 + (keywordCount * 8) + (highestScore > 15 ? 15 : highestScore));
  if (fullText.length > 50 && keywordCount >= 2) confidence = Math.max(confidence, 88);

  // 4. Compute AI Predicted Compensation
  const { suggestedCompensation, compensationExplanation } = computePredictedCompensation(
    bestCategory,
    priority,
    fullText,
    fin
  );

  // 5. Generate Meaningful Explanation and Action Recommendations
  let explanation = '';
  let recommendedAction = '';

  if (isFinancialEmergency) {
    explanation = `Alerte Financière IA Critique : L'IA a détecté un enlèvement ou débit bancaire significatif${fin.detectedAmount ? ` de ${fin.detectedAmount} ${fin.currency}` : ''} sans accord. Qualification immédiate en Priorité Urgente pour déclencher le blocage bancaire et la procédure de rétrofacturation (chargeback).`;
    recommendedAction = 'Contactez immédiatement votre établissement bancaire pour faire opposition ou contester l\'opération, et joignez ici une capture d\'écran du débit sur votre relevé pour obtenir le remboursement intégral.';
  } else {
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
  }

  return {
    category: bestCategory,
    priority,
    confidence,
    urgencyScore: normalizedUrgency,
    detectedKeywords: detectedKeywords.slice(0, 6),
    explanation,
    recommendedAction,
    isCritical,
    suggestedCompensation,
    compensationExplanation,
    detectedAmount: fin.detectedAmount,
    currency: fin.currency,
    isFinancialEmergency
  };
}
