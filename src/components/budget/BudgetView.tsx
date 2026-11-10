import React, { useState, useEffect, useMemo } from 'react';
import { 
  Wallet, 
  Plus, 
  TrendingUp, 
  AlertTriangle, 
  PieChart, 
  Users, 
  Trash2, 
  Receipt, 
  ShieldAlert,
  Sparkles,
  Edit3,
  UserCheck,
  Check
} from 'lucide-react';

import { useTrips } from '../../context/TripContext';
import { useAuth } from '../../context/AuthContext';
import { Expense, ExpenseCategory } from '../../types';
import { Modal } from '../common/Modal';
import { api } from '../../services/api';
import { db } from '../../db/database';
import { useAppCurrency } from '../../utils/currency';

/**
 * Calcule la répartition exacte d'un montant entre plusieurs participants
 * en répartissant les centimes restants pour que la somme des parts
 * corresponde toujours au centime près au montant initial.
 */
export function calculateSplitShares(
  totalAmount: number,
  participants: string[]
): Record<string, number> {
  const n = participants.length;
  if (n === 0) return {};
  if (n === 1) return { [participants[0]]: Math.round(totalAmount * 100) / 100 };

  const roundedTotal = Math.round(totalAmount * 100) / 100;
  const baseShare = Math.floor((roundedTotal / n) * 100) / 100;
  let remainderCents = Math.round((roundedTotal - baseShare * n) * 100);

  const result: Record<string, number> = {};
  participants.forEach((p, idx) => {
    const extra = idx < remainderCents ? 0.01 : 0;
    result[p] = Math.round((baseShare + extra) * 100) / 100;
  });

  return result;
}

const normalize = (s?: string) => (s || '').trim().toLowerCase();

export const BudgetView: React.FC = () => {
  const { trips, activeTrip } = useTrips();
  const { currentUser } = useAuth();
  const { currency: userCurrency, format, convert } = useAppCurrency();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [categoryViewScope, setCategoryViewScope] = useState<'personal' | 'trip'>('personal');
  const canManageAllExpenses = currentUser?.role === 'Admin' || currentUser?.role === 'Organizer';

  const currentUserName = currentUser?.name?.trim() || 'Moi';
  const tripCurrency = activeTrip?.currency || 'EUR';

  // ---------------------------------------------------------
  // 1. Budget personnel indépendant par utilisateur et destination
  // ---------------------------------------------------------
  const budgetStorageKey = useMemo(() => {
    const userKey = currentUser?.id || currentUserName;
    const destKey = activeTrip?.destination ? normalize(activeTrip.destination) : (activeTrip?.id || 'default');
    return `tt_personal_budget_${userKey}_${destKey}`;
  }, [currentUser?.id, currentUserName, activeTrip?.destination, activeTrip?.id]);

  const [personalBudget, setPersonalBudget] = useState<number>(() => {
    const saved = localStorage.getItem(budgetStorageKey);
    if (saved !== null && !isNaN(Number(saved)) && Number(saved) > 0) {
      return Number(saved);
    }
    return activeTrip?.budgetTotal || 2000;
  });

  const [budgetInput, setBudgetInput] = useState<number>(personalBudget);

  useEffect(() => {
    const saved = localStorage.getItem(budgetStorageKey);
    if (saved !== null && !isNaN(Number(saved)) && Number(saved) > 0) {
      setPersonalBudget(Number(saved));
      setBudgetInput(Number(saved));
    } else if (activeTrip?.budgetTotal) {
      setPersonalBudget(activeTrip.budgetTotal);
      setBudgetInput(activeTrip.budgetTotal);
    } else {
      setPersonalBudget(2000);
      setBudgetInput(2000);
    }
  }, [budgetStorageKey, activeTrip?.budgetTotal]);

  const handleSavePersonalBudget = (newAmount: number) => {
    if (newAmount <= 0) return;
    localStorage.setItem(budgetStorageKey, String(newAmount));
    setPersonalBudget(newAmount);
    setIsBudgetModalOpen(false);
  };

  // ---------------------------------------------------------
  // 2. Participants éligibles ayant choisi la même destination
  // ---------------------------------------------------------
  const [platformUsers, setPlatformUsers] = useState<string[]>(['Ameni', 'Chaima', 'Youssef']);

  useEffect(() => {
    db.users.toArray().then(users => {
      if (users && users.length > 0) {
        setPlatformUsers(users.map(u => u.name));
      }
    }).catch(() => {});
  }, []);

  const sameDestinationParticipants = useMemo(() => {
    if (!activeTrip) return [];
    const activeDest = normalize(activeTrip.destination);
    const set = new Set<string>();

    // Participants du voyage actif
    (activeTrip.participants || []).forEach(p => {
      if (p && p.trim()) set.add(p.trim());
    });

    // Participants des voyages ayant la même destination
    trips.forEach(t => {
      const tDest = normalize(t.destination);
      if (tDest === activeDest || (tDest && activeDest && (tDest.includes(activeDest) || activeDest.includes(tDest)))) {
        (t.participants || []).forEach(p => {
          if (p && p.trim()) set.add(p.trim());
        });
      }
    });

    // Membres de la plateforme ayant choisi cette destination
    platformUsers.forEach(uName => {
      const hasTrip = trips.some(t => {
        const tDest = normalize(t.destination);
        const matches = tDest === activeDest || (tDest && activeDest && (tDest.includes(activeDest) || activeDest.includes(tDest)));
        return matches && (t.participants || []).some(p => normalize(p) === normalize(uName));
      });
      if (hasTrip) {
        set.add(uName);
      }
    });

    // Si aucun participant tiers n'est encore lié explicitement à cette destination,
    // proposer les autres voyageurs enregistrés (ex: Ameni) pour permettre le split à destination
    if (set.size <= 1) {
      platformUsers.forEach(uName => {
        if (normalize(uName) !== normalize(currentUserName)) {
          set.add(uName);
        }
      });
    }

    if (currentUserName) {
      set.add(currentUserName);
    }

    return Array.from(set);
  }, [activeTrip, trips, platformUsers, currentUserName]);

  // Autres participants de la même destination sélectionnables pour le split
  const eligibleSplitPartners = useMemo(() => {
    return sameDestinationParticipants.filter(p => normalize(p) !== normalize(currentUserName) && normalize(p) !== 'moi');
  }, [sameDestinationParticipants, currentUserName]);

  // Form states pour l'ajout de dépense (SANS CHAMP "Payé par")
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Nourriture');
  const [amount, setAmount] = useState<number>(100);
  const [expenseCurrency, setExpenseCurrency] = useState<string>(activeTrip?.currency || 'EUR');
  const [date, setDate] = useState('');
  const [selectedSplitPartners, setSelectedSplitPartners] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [customPartnerInput, setCustomPartnerInput] = useState('');

  const loadExpenses = async () => {
    if (!activeTrip) return;
    const items = await api.expenses.getByTrip(activeTrip.id);
    setExpenses(items);
  };

  useEffect(() => {
    loadExpenses();
    if (activeTrip?.currency) {
      setExpenseCurrency(activeTrip.currency);
    }
  }, [activeTrip?.id]);

  const categories: ExpenseCategory[] = ['Hébergement', 'Transport', 'Nourriture', 'Activités', 'Shopping', 'Santé', 'Autre'];

  // ---------------------------------------------------------
  // Calcul de la part individuelle pour un participant
  // ---------------------------------------------------------
  const getUserShare = (exp: Expense, userName: string): number => {
    if (!userName) return exp.amount;
    const uNorm = normalize(userName);

    // 1. Détails exacts enregistrés
    if (exp.splitDetails && Object.keys(exp.splitDetails).length > 0) {
      const directKey = Object.keys(exp.splitDetails).find(k => {
        const kNorm = normalize(k);
        return kNorm === uNorm || (kNorm === 'moi' && (uNorm === 'moi' || normalize(exp.paidBy) === uNorm));
      });
      if (directKey) return exp.splitDetails[directKey];

      const inSplit = (exp.splitWith || []).some(p => normalize(p) === uNorm || (normalize(p) === 'moi' && normalize(exp.paidBy) === uNorm));
      if (!inSplit) return 0;
    }

    // 2. Détermination dynamique des bénéficiaires
    const beneficiaries = (exp.splitWith && exp.splitWith.length > 0)
      ? exp.splitWith
      : [exp.paidBy || userName];

    const isBeneficiary = beneficiaries.some(p => {
      const pNorm = normalize(p);
      return pNorm === uNorm || (pNorm === 'moi' && (uNorm === 'moi' || normalize(exp.paidBy) === uNorm));
    });

    if (!isBeneficiary) {
      return 0;
    }

    const shares = calculateSplitShares(exp.amount, beneficiaries);
    const shareKey = Object.keys(shares).find(k => {
      const kNorm = normalize(k);
      return kNorm === uNorm || (kNorm === 'moi' && (uNorm === 'moi' || normalize(exp.paidBy) === uNorm));
    });

    return shareKey ? shares[shareKey] : (exp.amount / (beneficiaries.length || 1));
  };

  // Calcul des montants convertis et des parts
  const convertedExpenses = expenses.map(e => {
    const userShare = getUserShare(e, currentUserName);
    const expenseCurr = e.currency || tripCurrency;
    return {
      ...e,
      userShare,
      convertedAmount: convert(e.amount, expenseCurr),
      convertedUserShare: convert(userShare, expenseCurr)
    };
  });

  // KPI Dépenses personnelles
  const totalSpent = Math.round(convertedExpenses.reduce((sum, e) => sum + e.convertedUserShare, 0) * 100) / 100;
  const budgetTotal = Math.round(convert(personalBudget, tripCurrency) * 100) / 100;
  const remainingBudget = Math.round((budgetTotal - totalSpent) * 100) / 100;
  const percentSpent = Math.min(100, Math.round((totalSpent / (budgetTotal || 1)) * 100));

  // Répartition par catégorie
  const categoryTotals = categories.map(cat => {
    const total = Math.round(
      convertedExpenses.filter(e => e.category === cat).reduce((s, e) => s + e.convertedUserShare, 0) * 100
    ) / 100;
    const pct = totalSpent > 0 ? Math.round((total / totalSpent) * 100) : 0;
    return { category: cat, total, pct };
  }).filter(c => c.total > 0);

  // Estimation du budget final IA
  const tripDurationDays = activeTrip
    ? Math.max(1, Math.ceil((new Date(activeTrip.endDate).getTime() - new Date(activeTrip.startDate).getTime()) / (1000 * 60 * 60 * 24)))
    : 7;
  const dailyAverage = totalSpent / (expenses.length > 0 ? Math.min(tripDurationDays, Math.max(1, expenses.length)) : 1);
  const projectedTotal = Math.round(dailyAverage * tripDurationDays);

  // ---------------------------------------------------------
  // Calcul en direct pour le formulaire d'ajout
  // ---------------------------------------------------------
  const liveSplitBeneficiaries = useMemo(() => {
    if (selectedSplitPartners.length === 0) {
      return [currentUserName];
    }
    return [currentUserName, ...selectedSplitPartners];
  }, [currentUserName, selectedSplitPartners]);

  const liveShares = useMemo(() => {
    return calculateSplitShares(Number(amount) || 0, liveSplitBeneficiaries);
  }, [amount, liveSplitBeneficiaries]);

  const toggleSplitPartner = (partner: string) => {
    setSelectedSplitPartners(prev =>
      prev.includes(partner) ? prev.filter(p => p !== partner) : [...prev, partner]
    );
  };

  const handleAddCustomPartner = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customPartnerInput.trim();
    if (!clean) return;
    if (!eligibleSplitPartners.some(p => normalize(p) === normalize(clean))) {
      setPlatformUsers(prev => [...prev, clean]);
    }
    if (!selectedSplitPartners.includes(clean)) {
      setSelectedSplitPartners(prev => [...prev, clean]);
    }
    setCustomPartnerInput('');
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTrip) return;

    const beneficiaries = selectedSplitPartners.length > 0 
      ? [currentUserName, ...selectedSplitPartners] 
      : [currentUserName];

    const finalShares = calculateSplitShares(Number(amount), beneficiaries);

    await api.expenses.create({
      tripId: activeTrip.id,
      title,
      category,
      amount: Number(amount),
      currency: expenseCurrency || tripCurrency,
      date: date || new Date().toISOString().split('T')[0],
      paidBy: currentUserName,
      splitWith: beneficiaries,
      splitDetails: finalShares,
      notes
    });

    await loadExpenses();
    setIsAddModalOpen(false);
    setTitle('');
    setNotes('');
    setSelectedSplitPartners([]);
  };

  const handleDeleteExpense = async (id: string) => {
    await api.expenses.delete(id);
    await loadExpenses();
  };

  const handleSyncBudgetFromPlanning = async () => {
    if (!activeTrip) return;
    const acts = await db.activities.where('tripId').equals(activeTrip.id).toArray();
    if (acts.length === 0) {
      alert("Aucune activité trouvée dans le planning pour ce voyage.");
      return;
    }

    const currentExpenses = await db.expenses.where('tripId').equals(activeTrip.id).toArray();
    const existingTitles = new Set(currentExpenses.map(e => e.title.toLowerCase()));

    const newExpenses: Expense[] = [];
    acts.filter(a => a.cost > 0).forEach((act, idx) => {
      const expTitle = `Activité : ${act.title}`;
      if (!existingTitles.has(expTitle.toLowerCase())) {
        newExpenses.push({
          id: `exp-sync-${idx}-${Date.now()}`,
          tripId: activeTrip.id,
          title: expTitle,
          category: act.title.toLowerCase().includes('dîner') || act.title.toLowerCase().includes('repas') || act.title.toLowerCase().includes('saveurs') ? 'Nourriture' : 'Activités',
          amount: act.cost,
          currency: activeTrip.currency,
          date: act.date,
          paidBy: currentUserName,
          splitWith: [currentUserName],
          splitDetails: { [currentUserName]: act.cost },
          notes: 'Dépense prévisionnelle issue directement du planning',
          createdAt: new Date().toISOString()
        });
      }
    });

    if (newExpenses.length > 0) {
      await db.expenses.bulkAdd(newExpenses);
      alert(`${newExpenses.length} dépense(s) issue(s) du planning ont été synchronisées dans votre budget !`);
      await loadExpenses();
    } else {
      alert("Toutes les activités payantes du planning sont déjà présentes dans vos dépenses de budget.");
    }
  };

  // Liste des dépenses partagées pour l'affichage récapitulatif
  const sharedExpensesList = convertedExpenses.filter(e => e.splitWith && e.splitWith.length > 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-white">Gestion du Budget</h2>
              <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
                Destination : {activeTrip?.destination || 'Destination'}
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-0.5">
              Budget personnel indépendant, suivi individuel et calcul automatique du partage des frais (split).
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleSyncBudgetFromPlanning}
            className="flex items-center space-x-2 px-3.5 py-2 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 text-xs font-extrabold rounded-xl shadow-lg transition-all"
            title="Synchronise et pré-remplit les dépenses du budget directement depuis les activités du planning"
          >
            <Sparkles className="w-4 h-4" />
            <span>Synchroniser avec le Planning</span>
          </button>

          <button
            onClick={() => {
              setDate(new Date().toISOString().split('T')[0]);
              setSelectedSplitPartners([]);
              setIsAddModalOpen(true);
            }}
            className="flex items-center space-x-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/25 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter Dépense</span>
          </button>
        </div>
      </div>

      {/* Alerte dépassement du budget personnel */}
      {totalSpent > budgetTotal && (
        <div className="p-4 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-200 text-xs flex items-center space-x-3 shadow-lg animate-pulse">
          <ShieldAlert className="w-6 h-6 text-rose-400 flex-shrink-0" />
          <div>
            <strong className="font-bold text-rose-300 text-sm">Alerte Dépassement de Budget Personnel :</strong>
            <p className="mt-0.5 text-rose-100">
              Vos dépenses personnelles ont dépassé votre budget alloué de {format(totalSpent - budgetTotal, userCurrency)}. Nous recommandons de réduire les dépenses de restauration ou d'activités.
            </p>
          </div>
        </div>
      )}

      {/* Cartes KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Carte 1 : Budget Personnel Alloué avec modification */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1 relative">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium">Mon Budget Personnel</span>
            <button
              onClick={() => {
                setBudgetInput(personalBudget);
                setIsBudgetModalOpen(true);
              }}
              className="text-emerald-400 hover:text-emerald-300 transition-colors p-1 rounded-lg hover:bg-slate-800 text-[11px] flex items-center space-x-1"
              title="Modifier mon budget personnel"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Modifier</span>
            </button>
          </div>
          <div className="text-2xl font-bold text-white">
            {format(budgetTotal, userCurrency)}
          </div>
          <p className="text-[11px] text-slate-500">
            {tripCurrency !== userCurrency 
              ? `Converti depuis ${personalBudget} ${tripCurrency}` 
              : `Défini pour ${activeTrip?.destination || 'cette destination'}`}
          </p>
        </div>

        {/* Carte 2 : Total Dépensé (Part personnelle uniquement) */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Ma Part Dépensée</span>
            <Receipt className="w-4 h-4 text-emerald-400" />
          </div>
          <div className={`text-2xl font-bold ${totalSpent > budgetTotal ? 'text-rose-400' : 'text-emerald-400'}`}>
            {format(totalSpent, userCurrency)}
          </div>
          <p className="text-[11px] text-slate-500">{percentSpent}% de votre budget consommé</p>
        </div>

        {/* Carte 3 : Solde Restant */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Solde Restant</span>
            <TrendingUp className="w-4 h-4 text-sky-400" />
          </div>
          <div className={`text-2xl font-bold ${remainingBudget < 0 ? 'text-rose-400' : 'text-sky-400'}`}>
            {format(remainingBudget, userCurrency)}
          </div>
          <p className="text-[11px] text-slate-500">Disponible sur votre budget personnel</p>
        </div>

        {/* Carte 4 : Projection IA */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Projection Finale IA</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400">
            ~{format(projectedTotal, userCurrency)}
          </div>
          <p className="text-[11px] text-slate-500">Estimé selon votre rythme de dépense</p>
        </div>
      </div>

      {/* Répartition par Catégorie (Plein format après suppression de la section équilibrage) */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center space-x-2">
          <PieChart className="w-4 h-4 text-emerald-400" />
          <span>Répartition de Mes Dépenses par Catégorie</span>
        </h3>

        {categoryTotals.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">Aucune dépense enregistrée pour le moment.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categoryTotals.map(item => (
              <div key={item.category} className="space-y-1 bg-slate-850/60 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">{item.category}</span>
                  <span className="text-slate-400 font-semibold">
                    {format(item.total, userCurrency)} ({item.pct}%)
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Encart visuel dédié : Calcul et Récapitulatif du Split entre participants */}
      {sharedExpensesList.length > 0 && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-emerald-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Détail du Calcul de Split Partagé entre Participants ({sharedExpensesList.length})</span>
            </h3>
            <span className="text-xs text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              Même destination : {activeTrip?.destination}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {sharedExpensesList.map(exp => {
              const beneficiaries = exp.splitWith || [];
              const shares = exp.splitDetails && Object.keys(exp.splitDetails).length > 0
                ? exp.splitDetails
                : calculateSplitShares(exp.amount, beneficiaries);

              return (
                <div key={exp.id} className="p-3.5 rounded-xl bg-slate-850 border border-slate-750 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white text-xs truncate" title={exp.title}>{exp.title}</span>
                    <span className="text-xs font-bold text-emerald-400 ml-2 whitespace-nowrap">
                      Total : {exp.amount} {exp.currency || tripCurrency}
                    </span>
                  </div>

                  <div className="pt-1.5 border-t border-slate-750/70 space-y-1 text-xs">
                    {beneficiaries.map(partner => {
                      const shareVal = shares[partner] !== undefined ? shares[partner] : getUserShare(exp, partner);
                      const isMe = normalize(partner) === normalize(currentUserName) || normalize(partner) === 'moi';

                      return (
                        <div key={partner} className="flex justify-between items-center">
                          <span className={isMe ? 'font-bold text-emerald-300' : 'text-slate-300'}>
                            {isMe ? `Ma part (${currentUserName})` : `Part de ${partner}`} :
                          </span>
                          <span className={`font-mono font-bold ${isMe ? 'text-emerald-400' : 'text-slate-200'}`}>
                            {shareVal.toFixed(2)} {exp.currency || tripCurrency}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tableau récapitulatif détaillé des dépenses */}
      {/* SANS AUCUNE COLONNE "Payé par" conformément à votre demande */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Receipt className="w-4 h-4 text-emerald-400" />
            <span>Historique détaillé des dépenses ({expenses.length})</span>
          </h3>
          <span className="text-xs text-slate-400">
            Destination : <strong className="text-slate-200">{activeTrip?.destination}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Libellé</th>
                <th className="py-2.5 px-3">Catégorie</th>
                <th className="py-2.5 px-3">Calcul du Partage (Split)</th>
                <th className="py-2.5 px-3 text-right">Ma part</th>
                <th className="py-2.5 px-3 text-right">Montant total</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {convertedExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-500">
                    Aucune dépense enregistrée. Cliquez sur « Ajouter Dépense » pour en créer une.
                  </td>
                </tr>
              ) : (
                convertedExpenses.map(exp => {
                  const isShared = exp.splitWith && exp.splitWith.length > 1;
                  const isCurrentUserBeneficiary = exp.userShare > 0;
                  const beneficiaries = exp.splitWith || [];
                  const shares = exp.splitDetails && Object.keys(exp.splitDetails).length > 0
                    ? exp.splitDetails
                    : calculateSplitShares(exp.amount, beneficiaries);

                  return (
                    <tr key={exp.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 whitespace-nowrap text-slate-400">{exp.date}</td>
                      <td className="py-2.5 px-3 font-semibold text-white">{exp.title}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                          {exp.category}
                        </span>
                      </td>

                      {/* Colonne Calcul du Partage bien visible avec montants exacts de chaque participant */}
                      <td className="py-2.5 px-3">
                        {isShared ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-emerald-400">
                              <Users className="w-3 h-3" />
                              <span>Partagé ({beneficiaries.length} pers.) :</span>
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {beneficiaries.map(partner => {
                                const shareVal = shares[partner] !== undefined ? shares[partner] : getUserShare(exp, partner);
                                const isMe = normalize(partner) === normalize(currentUserName) || normalize(partner) === 'moi';

                                return (
                                  <span
                                    key={partner}
                                    className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                                      isMe 
                                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold' 
                                        : 'bg-slate-800 text-slate-300 border-slate-700'
                                    }`}
                                  >
                                    {isMe ? 'Moi' : partner} : {shareVal.toFixed(2)} {exp.currency || tripCurrency}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center space-x-1 text-[11px] text-slate-400">
                            <UserCheck className="w-3 h-3 text-slate-500" />
                            <span>Individuel (100% à ma charge)</span>
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-right whitespace-nowrap font-bold">
                        {isCurrentUserBeneficiary ? (
                          <div>
                            <span className="text-emerald-400 font-extrabold text-sm">
                              {format(exp.convertedUserShare, userCurrency)}
                            </span>
                            {(exp.currency || tripCurrency) !== userCurrency && (
                              <div className="text-[10px] text-slate-500 font-normal">
                                {exp.userShare} {exp.currency || tripCurrency}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-500 italic text-[11px]">Non concerné(e)</span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-right whitespace-nowrap font-semibold text-slate-300">
                        <div>{format(exp.convertedAmount, userCurrency)}</div>
                        {(exp.currency || tripCurrency) !== userCurrency && (
                          <div className="text-[10px] text-slate-500 font-normal">
                            {exp.amount} {exp.currency || tripCurrency}
                          </div>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        {(canManageAllExpenses || normalize(exp.paidBy) === normalize(currentUserName) || normalize(exp.paidBy) === 'moi') ? (
                          <button
                            onClick={() => handleDeleteExpense(exp.id)}
                            className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                            title="Supprimer la dépense"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-600">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1 : Modifier Mon Budget Personnel */}
      <Modal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        title="Définir mon Budget Personnel"
        subtitle={`Destination : ${activeTrip?.destination || 'Séjour en cours'} — Budget propre à votre compte (${currentUserName})`}
      >
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSavePersonalBudget(Number(budgetInput));
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Montant du budget alloué ({tripCurrency})
            </label>
            <input
              type="number"
              min="1"
              step="1"
              required
              value={budgetInput}
              onChange={e => setBudgetInput(Number(e.target.value))}
              placeholder="ex: 1500"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-base font-bold text-white focus:outline-none focus:border-emerald-500"
            />
            <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
              Ce budget est strictement <strong>personnel et indépendant</strong> de celui des autres voyageurs. Il est lié à votre profil pour la destination <strong>{activeTrip?.destination}</strong>.
            </p>
          </div>

          <div className="pt-2 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsBudgetModalOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 text-sm font-semibold rounded-xl"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-600/30"
            >
              Enregistrer mon budget
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 2 : Ajouter une Dépense (SANS LE CHAMP "Payé par") */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Ajouter une Dépense"
        subtitle={`Enregistrez une facture et partagez les frais entre participants voyageant à ${activeTrip?.destination || 'cette destination'}`}
      >
        <form onSubmit={handleCreateExpense} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Libellé de la dépense</label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="ex: Billets musée, Resto sushi, Taxi aéroport..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">Montant total de la facture</label>
              <input
                type="number"
                min="0.5"
                step="0.01"
                required
                value={amount}
                onChange={e => setAmount(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Devise</label>
              <select
                value={expenseCurrency}
                onChange={e => setExpenseCurrency(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                {['EUR', 'USD', 'TND', 'GBP', 'CAD', 'CHF', 'JPY'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Catégorie</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as ExpenseCategory)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Section Partage des Frais (Split Expenses) */}
          <div className="pt-2 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-200">
                Partager cette facture avec d'autres participants :
              </label>
              <span className="text-[11px] text-emerald-400 font-medium">
                Destination : {activeTrip?.destination}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {eligibleSplitPartners.map(partner => {
                  const isSelected = selectedSplitPartners.includes(partner);
                  return (
                    <button
                      type="button"
                      key={partner}
                      onClick={() => toggleSplitPartner(partner)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all flex items-center space-x-1.5 ${
                        isSelected
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 shadow-sm shadow-emerald-500/20 font-bold'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600 hover:text-slate-200'
                      }`}
                    >
                      <span>{partner}</span>
                      {isSelected ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <span className="font-bold">+</span>}
                    </button>
                  );
                })}
              </div>

              {/* Champ d'ajout rapide d'un compagnon pour cette destination si besoin */}
              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="text"
                  value={customPartnerInput}
                  onChange={e => setCustomPartnerInput(e.target.value)}
                  placeholder="Ajouter un autre voyageur (ex: Ameni)..."
                  className="bg-slate-800/80 border border-slate-750 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-emerald-500 flex-1"
                />
                <button
                  type="button"
                  onClick={handleAddCustomPartner}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg border border-slate-700"
                >
                  Ajouter
                </button>
              </div>

              <p className="text-[11px] text-slate-400">
                {selectedSplitPartners.length === 0
                  ? '💡 Aucun participant sélectionné : la facture reste 100% à votre charge.'
                  : `Compagnons sélectionnés : ${selectedSplitPartners.join(', ')}`}
              </p>
            </div>

            {/* Récapitulatif du calcul automatique de répartition bien visible */}
            <div className="p-3.5 rounded-xl bg-slate-850 border border-emerald-500/40 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-200 font-bold border-b border-slate-750 pb-2">
                <span className="flex items-center space-x-1.5">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span>
                    {selectedSplitPartners.length === 0
                      ? 'Dépense individuelle (1 participant)'
                      : `Calcul du Split (${liveSplitBeneficiaries.length} participants) :`}
                  </span>
                </span>
                <span className="text-emerald-400 font-extrabold text-sm">
                  Total : {amount || 0} {expenseCurrency}
                </span>
              </div>

              {selectedSplitPartners.length === 0 ? (
                <div className="text-slate-300 text-xs py-1">
                  <span>Ma part ({currentUserName}) : </span>
                  <strong className="text-emerald-400 font-bold">{amount || 0} {expenseCurrency}</strong>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Le montant total est imputé uniquement sur votre budget personnel.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 pt-1">
                  <div className="flex justify-between items-center text-slate-100 bg-emerald-500/10 px-2.5 py-1.5 rounded-lg border border-emerald-500/20">
                    <span className="font-bold text-emerald-300">Ma part ({currentUserName}) :</span>
                    <strong className="text-emerald-400 font-extrabold text-sm">
                      {liveShares[currentUserName]?.toFixed(2)} {expenseCurrency}
                    </strong>
                  </div>
                  {selectedSplitPartners.map(partner => (
                    <div key={partner} className="flex justify-between items-center text-slate-300 px-2.5 py-1 bg-slate-800/60 rounded-lg">
                      <span className="font-medium">Part de {partner} :</span>
                      <span className="font-semibold text-slate-100">
                        {liveShares[partner]?.toFixed(2)} {expenseCurrency}
                      </span>
                    </div>
                  ))}
                  <div className="text-[11px] text-slate-400 pt-1.5 border-t border-slate-750 flex justify-between">
                    <span>Somme exacte vérifiée :</span>
                    <span className="font-mono font-bold text-slate-300">
                      {Object.values(liveShares).reduce((s, v) => s + v, 0).toFixed(2)} {expenseCurrency}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Remarques ou reçu</label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Notes diverses ou informations de paiement..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="pt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 text-sm font-semibold rounded-xl"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-600/30"
            >
              Enregistrer la Dépense
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
