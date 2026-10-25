import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  Plus, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  PieChart, 
  Users, 
  DollarSign, 
  Trash2, 
  Receipt,
  ArrowRight,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useTrips } from '../../context/TripContext';
import { useAuth } from '../../context/AuthContext';
import { Expense, ExpenseCategory } from '../../types';
import { Modal } from '../common/Modal';
import { api } from '../../services/api';
import { db } from '../../db/database';
import { useAppCurrency } from '../../utils/currency';

export const BudgetView: React.FC = () => {
  const { activeTrip } = useTrips();
  const { currentUser } = useAuth();
  const { currency: userCurrency, format, convert } = useAppCurrency();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const canManageAllExpenses = currentUser?.role === 'Admin' || currentUser?.role === 'Organizer';

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Nourriture');
  const [amount, setAmount] = useState<number>(45);
  const [expenseCurrency, setExpenseCurrency] = useState<string>(activeTrip?.currency || 'EUR');
  const [date, setDate] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [splitWith, setSplitWith] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const loadExpenses = async () => {
    if (!activeTrip) return;
    const items = await api.expenses.getByTrip(activeTrip.id);
    setExpenses(items);
  };

  useEffect(() => {
    loadExpenses();
    if (activeTrip?.participants && activeTrip.participants.length > 0) {
      setPaidBy(activeTrip.participants[0]);
      setSplitWith(activeTrip.participants);
    }
    if (activeTrip?.currency) {
      setExpenseCurrency(activeTrip.currency);
    }
  }, [activeTrip?.id]);

  const categories: ExpenseCategory[] = ['Hébergement', 'Transport', 'Nourriture', 'Activités', 'Shopping', 'Santé', 'Autre'];

  const tripCurrency = activeTrip?.currency || 'EUR';

  // Calculations: convert all amounts dynamically to user preferred currency
  const convertedExpenses = expenses.map(e => ({
    ...e,
    convertedAmount: convert(e.amount, e.currency || tripCurrency)
  }));

  const totalSpent = Math.round(convertedExpenses.reduce((sum, e) => sum + e.convertedAmount, 0) * 100) / 100;
  const budgetTotal = Math.round(convert(activeTrip?.budgetTotal || 2000, tripCurrency) * 100) / 100;
  const remainingBudget = Math.round((budgetTotal - totalSpent) * 100) / 100;
  const percentSpent = Math.min(100, Math.round((totalSpent / (budgetTotal || 1)) * 100));

  // Category breakdown
  const categoryTotals = categories.map(cat => {
    const total = Math.round(
      convertedExpenses.filter(e => e.category === cat).reduce((s, e) => s + e.convertedAmount, 0) * 100
    ) / 100;
    const pct = totalSpent > 0 ? Math.round((total / totalSpent) * 100) : 0;
    return { category: cat, total, pct };
  }).filter(c => c.total > 0);

  // Smart Budget Forecast: estimate total at trip end
  const tripDurationDays = activeTrip
    ? Math.max(1, Math.ceil((new Date(activeTrip.endDate).getTime() - new Date(activeTrip.startDate).getTime()) / (1000 * 60 * 60 * 24)))
    : 7;
  const dailyAverage = totalSpent / (expenses.length > 0 ? Math.min(tripDurationDays, Math.max(1, expenses.length)) : 1);
  const projectedTotal = Math.round(dailyAverage * tripDurationDays);

  // Advanced Feature: Peer-to-peer Expense Split Settlement ("Qui doit combien à qui")
  const calculateSettlement = () => {
    const participants = activeTrip?.participants || ['Moi'];
    const balances: Record<string, number> = {};
    participants.forEach(p => balances[p] = 0);

    convertedExpenses.forEach(e => {
      const payer = e.paidBy;
      const beneficiaries = e.splitWith && e.splitWith.length > 0 ? e.splitWith : participants;
      const share = e.convertedAmount / beneficiaries.length;

      balances[payer] = (balances[payer] || 0) + e.convertedAmount;
      beneficiaries.forEach(b => {
        balances[b] = (balances[b] || 0) - share;
      });
    });

    // Generate settlement suggestions
    const creditors: { name: string; amount: number }[] = [];
    const debtors: { name: string; amount: number }[] = [];

    Object.entries(balances).forEach(([name, bal]) => {
      if (bal > 0.01) creditors.push({ name, amount: bal });
      else if (bal < -0.01) debtors.push({ name, amount: -bal });
    });

    const settlements: { from: string; to: string; amount: number }[] = [];
    let cIdx = 0;
    let dIdx = 0;

    while (cIdx < creditors.length && dIdx < debtors.length) {
      const creditor = creditors[cIdx];
      const debtor = debtors[dIdx];
      const settleAmount = Math.min(creditor.amount, debtor.amount);

      if (settleAmount > 0.5) {
        settlements.push({
          from: debtor.name,
          to: creditor.name,
          amount: Math.round(settleAmount)
        });
      }

      creditor.amount -= settleAmount;
      debtor.amount -= settleAmount;

      if (creditor.amount < 0.01) cIdx++;
      if (debtor.amount < 0.01) dIdx++;
    }

    return settlements;
  };

  const settlements = calculateSettlement();

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTrip) return;

    await api.expenses.create({
      tripId: activeTrip.id,
      title,
      category,
      amount: Number(amount),
      currency: expenseCurrency || tripCurrency,
      date: date || new Date().toISOString().split('T')[0],
      paidBy: paidBy || activeTrip.participants[0] || 'Moi',
      splitWith: splitWith.length > 0 ? splitWith : activeTrip.participants,
      notes
    });

    await loadExpenses();
    setIsAddModalOpen(false);
    setTitle('');
    setNotes('');
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
          paidBy: currentUser?.name || 'Moi',
          splitWith: activeTrip.participants || ['Moi'],
          notes: 'Dépense prévisionnelle issue directement du planning',
          createdAt: new Date().toISOString()
        });
      }
    });

    if (newExpenses.length > 0) {
      await db.expenses.bulkAdd(newExpenses);
      confetti({ particleCount: 60, spread: 50 });
      alert(`${newExpenses.length} dépense(s) issue(s) du planning ont été synchronisées dans votre budget !`);
      await loadExpenses();
    } else {
      alert("Toutes les activités payantes du planning sont déjà présentes dans vos dépenses de budget.");
    }
  };

  const toggleSplitParticipant = (p: string) => {
    setSplitWith(prev => 
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with Member Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-white">Budget & Dépenses</h2>
            </div>
            <p className="text-sm text-slate-400 mt-0.5">
              Suivi multi-catégories, alertes intelligentes de dépassement et partage de frais (split).
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
              setIsAddModalOpen(true);
            }}
            className="flex items-center space-x-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/25 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter Dépense</span>
          </button>
        </div>
      </div>

      {/* Over-budget Warning Alert */}
      {totalSpent > budgetTotal && (
        <div className="p-4 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-200 text-xs flex items-center space-x-3 shadow-lg animate-pulse">
          <ShieldAlert className="w-6 h-6 text-rose-400 flex-shrink-0" />
          <div>
            <strong className="font-bold text-rose-300 text-sm">Alerte Dépassement de Budget :</strong>
            <p className="mt-0.5 text-rose-100">
              Vous avez dépassé votre budget prévisionnel de {format(totalSpent - budgetTotal, userCurrency)}. Nous recommandons de réduire les dépenses restauration ou activités d'ici la fin du séjour.
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Budget */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Budget Alloué</span>
            <DollarSign className="w-4 h-4 text-brand-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {format(budgetTotal, userCurrency)}
          </div>
          <p className="text-[11px] text-slate-500">
            {tripCurrency !== userCurrency 
              ? `Converti depuis ${activeTrip?.budgetTotal} ${tripCurrency}` 
              : 'Défini lors de la création'}
          </p>
        </div>

        {/* Card 2: Spent */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Dépensé</span>
            <Receipt className="w-4 h-4 text-emerald-400" />
          </div>
          <div className={`text-2xl font-bold ${totalSpent > budgetTotal ? 'text-rose-400' : 'text-emerald-400'}`}>
            {format(totalSpent, userCurrency)}
          </div>
          <p className="text-[11px] text-slate-500">{percentSpent}% du budget consommé</p>
        </div>

        {/* Card 3: Remaining */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Solde Restant</span>
            <TrendingUp className="w-4 h-4 text-sky-400" />
          </div>
          <div className={`text-2xl font-bold ${remainingBudget < 0 ? 'text-rose-400' : 'text-sky-400'}`}>
            {format(remainingBudget, userCurrency)}
          </div>
          <p className="text-[11px] text-slate-500">Pour les jours restants</p>
        </div>

        {/* Card 4: Forecast */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Projection Finale IA</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400">
            ~{format(projectedTotal, userCurrency)}
          </div>
          <p className="text-[11px] text-slate-500">Estimé selon le rythme quotidien</p>
        </div>
      </div>

      {/* Visual Progress Bar & Categories Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Categories Breakdown */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <PieChart className="w-4 h-4 text-emerald-400" />
            <span>Répartition par Catégorie de Dépenses</span>
          </h3>

          <div className="space-y-3">
            {categoryTotals.map(item => (
              <div key={item.category} className="space-y-1">
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
        </div>

        {/* Peer-to-Peer Settlement (Split Equilibre) */}
        <div className="lg:col-span-1 p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Users className="w-4 h-4 text-sky-400" />
            <span>Équilibrage des Comptes (Split)</span>
          </h3>

          <p className="text-xs text-slate-400 leading-relaxed">
            Algorithme de simplification de dettes entre compagnons de voyage :
          </p>

          <div className="space-y-2">
            {settlements.length === 0 ? (
              <div className="p-3 rounded-xl bg-slate-800/40 text-center text-xs text-slate-400">
                ✨ Comptes parfaitement équilibrés entre tous les membres !
              </div>
            ) : (
              settlements.map((s, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2 truncate">
                    <span className="font-semibold text-rose-300 truncate">{s.from}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="font-semibold text-emerald-300 truncate">{s.to}</span>
                  </div>
                  <span className="font-bold text-white bg-slate-900 px-2 py-0.5 rounded border border-slate-700 flex-shrink-0 ml-2">
                    {format(s.amount, userCurrency)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Expenses History Table */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center space-x-2">
          <Receipt className="w-4 h-4 text-emerald-400" />
          <span>Historique détaillé des dépenses ({expenses.length})</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Libellé</th>
                <th className="py-2.5 px-3">Catégorie</th>
                <th className="py-2.5 px-3">Payé par</th>
                <th className="py-2.5 px-3">Partage</th>
                <th className="py-2.5 px-3 text-right">Montant</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {convertedExpenses.map(exp => (
                <tr key={exp.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-3 whitespace-nowrap text-slate-400">{exp.date}</td>
                  <td className="py-2.5 px-3 font-semibold text-white">{exp.title}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                      {exp.category}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-medium text-emerald-400">{exp.paidBy}</td>
                  <td className="py-2.5 px-3 text-slate-400">
                    {exp.splitWith && exp.splitWith.length > 0 ? exp.splitWith.join(', ') : 'Tous'}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-white whitespace-nowrap">
                    <div>{format(exp.convertedAmount, userCurrency)}</div>
                    {(exp.currency || tripCurrency) !== userCurrency && (
                      <div className="text-[10px] text-slate-500 font-normal">
                        {exp.amount} {exp.currency || tripCurrency}
                      </div>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {(canManageAllExpenses || exp.paidBy === currentUser?.name) ? (
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
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add Expense */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Ajouter une Dépense"
        subtitle="Enregistrez une sortie d'argent et gérez le partage entre voyageurs"
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
              <label className="block text-xs font-semibold text-slate-300 mb-1">Montant</label>
              <input
                type="number"
                min="0.5"
                step="0.5"
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

          <div className="grid grid-cols-2 gap-4">
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
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Payé par</label>
              <select
                value={paidBy}
                onChange={e => setPaidBy(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                {activeTrip?.participants.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Partagé entre qui ? (Cliquez pour cocher/décocher)
            </label>
            <div className="flex flex-wrap gap-2">
              {activeTrip?.participants.map(p => {
                const isSelected = splitWith.includes(p);
                return (
                  <button
                    type="button"
                    key={p}
                    onClick={() => toggleSplitParticipant(p)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                      isSelected
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {p} {isSelected ? '✓' : ''}
                  </button>
                );
              })}
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
