import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Sparkles, 
  Users, 
  Camera, 
  AlertCircle, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Shield, 
  Layers, 
  Wallet,
  Play
} from 'lucide-react';
import { useTrips } from '../../context/TripContext';
import { useAuth } from '../../context/AuthContext';
import { Place, Activity, Expense, Memory, Complaint } from '../../types';
import { db } from '../../db/database';
import { useAppCurrency } from '../../utils/currency';

interface OverviewViewProps {
  onNavigateTab: (tabId: string) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({ onNavigateTab }) => {
  const { activeTrip } = useTrips();
  const { currentUser, isAdmin } = useAuth();
  const { currency: userCurrency, format, convert } = useAppCurrency();

  const [places, setPlaces] = useState<Place[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);

  useEffect(() => {
    if (!activeTrip) return;
    const loadOverviewData = async () => {
      const plcs = await db.places.where('tripId').equals(activeTrip.id).toArray();
      const acts = await db.activities.where('tripId').equals(activeTrip.id).toArray();
      const exps = await db.expenses.where('tripId').equals(activeTrip.id).toArray();
      const mems = await db.memories.where('tripId').equals(activeTrip.id).toArray();
      const cmps = await db.complaints.where('tripId').equals(activeTrip.id).toArray();

      setPlaces(plcs);
      setActivities(acts);
      setExpenses(exps);
      setMemories(mems);
      setComplaints(cmps);
    };

    loadOverviewData();
  }, [activeTrip?.id]);

  if (!activeTrip) {
    return (
      <div className="text-center py-20 p-8 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <Compass className="w-12 h-12 text-brand-400 mx-auto animate-spin" />
        <h3 className="text-lg font-bold text-white">Aucun voyage sélectionné</h3>
        <p className="text-sm text-slate-400">Veuillez sélectionner ou créer un voyage pour afficher le tableau de bord.</p>
        <button
          onClick={() => onNavigateTab('trips')}
          className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl"
        >
          Voir mes voyages
        </button>
      </div>
    );
  }

  const tripCurrency = activeTrip.currency || 'EUR';
  const totalSpent = Math.round(
    expenses.reduce((s, e) => s + convert(e.amount, e.currency || tripCurrency), 0) * 100
  ) / 100;
  const budgetTotal = Math.round(convert(activeTrip.budgetTotal, tripCurrency) * 100) / 100;
  const remainingBudget = Math.round((budgetTotal - totalSpent) * 100) / 100;
  const completedActivities = activities.filter(a => a.status === 'Terminé').length;

  return (
    <div className="space-y-6">
      
      {/* Hero Banner for Active Trip */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl">
        <div className="relative h-64 sm:h-72 w-full overflow-hidden">
          <img
            src={activeTrip.coverImage}
            alt={activeTrip.title}
            className="w-full h-full object-cover object-center filter brightness-[0.65]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
          
          <div className="absolute top-4 left-4 flex flex-wrap gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-brand-500/80 backdrop-blur-md text-white border border-brand-400/40 shadow">
              {activeTrip.status}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-900/80 backdrop-blur-md text-slate-300 border border-slate-700">
              {activeTrip.destination} • {activeTrip.country}
            </span>
          </div>

          <div className="absolute bottom-5 left-5 right-5 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1 text-white">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight drop-shadow-md">
                {activeTrip.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
                <span className="flex items-center space-x-1.5">
                  <Calendar className="w-4 h-4 text-brand-400" />
                  <span>{activeTrip.startDate} au {activeTrip.endDate}</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <Users className="w-4 h-4 text-amber-400" />
                  <span>{activeTrip.participants.join(', ')}</span>
                </span>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('places')}
              className="px-4 py-2 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white text-xs font-bold rounded-xl shadow-lg shadow-brand-500/25 flex items-center space-x-2 self-start md:self-auto transition-transform hover:scale-105"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Ouvrir la Carte & Itinéraire</span>
            </button>
          </div>
        </div>
      </div>

      {/* Global Module Pipeline (Visual flow showing the cohesive chain) */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-white flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Chaîne Intégrée du Voyage (Cohérence Globale) :</span>
          </span>
          <span className="text-slate-400 text-[11px]">Tous les modules connectés entre eux</span>
        </div>

        <div className={`grid grid-cols-2 sm:grid-cols-3 ${isAdmin ? 'lg:grid-cols-5' : 'lg:grid-cols-6'} gap-2`}>
          {[
            { id: 'trips', title: '1. Voyage', desc: 'Circuit & IA', icon: Compass, color: 'text-brand-400 border-brand-500/30' },
            { id: 'places', title: '2. Carte', desc: `${places.length} POI GPS`, icon: Layers, color: 'text-sky-400 border-sky-500/30' },
            { id: 'activities', title: '3. Planning', desc: `${completedActivities}/${activities.length} faits`, icon: Calendar, color: 'text-teal-400 border-teal-500/30' },
            { id: 'budget', title: '4. Budget', desc: `${format(totalSpent, userCurrency)} / ${format(budgetTotal, userCurrency)}`, icon: Wallet, color: 'text-emerald-400 border-emerald-500/30' },
            ...(!isAdmin ? [{ id: 'memories', title: '5. Souvenirs', desc: `${memories.length} récits`, icon: Camera, color: 'text-pink-400 border-pink-500/30' }] : []),
            { id: 'complaints', title: isAdmin ? '5. Arbitrage' : '6. Support', desc: `${complaints.length} litige(s)`, icon: AlertCircle, color: 'text-rose-400 border-rose-500/30' }
          ].map(step => {
            const Icon = step.icon;
            return (
              <div
                key={step.id}
                onClick={() => onNavigateTab(step.id)}
                className={`p-3 rounded-xl bg-slate-800/60 border hover:bg-slate-800 cursor-pointer transition-all ${step.color}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <Icon className="w-4 h-4" />
                  <ArrowRight className="w-3 h-3 text-slate-500" />
                </div>
                <h4 className="text-xs font-bold text-white truncate">{step.title}</h4>
                <p className="text-[10px] text-slate-400 truncate">{step.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Modules previews */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Module Youssef: Upcoming Planning timeline */}
        <div className="lg:col-span-1 p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-teal-400" />
              <span>Prochaines Activités</span>
            </h3>
            <button
              onClick={() => onNavigateTab('activities')}
              className="text-xs text-teal-400 hover:underline flex items-center space-x-1"
            >
              <span>Planning</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2.5">
            {activities.slice(0, 3).map(act => (
              <div key={act.id} className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/60 flex items-center justify-between text-xs">
                <div className="space-y-0.5 truncate">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-teal-300 text-[11px] font-bold">{act.startTime}</span>
                    <span className="font-semibold text-white truncate">{act.title}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Jour {act.dayNumber}</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded font-medium flex-shrink-0 ml-2 ${
                  act.status === 'Terminé' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-300'
                }`}>
                  {act.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Module Nour: Budget snapshot & alert */}
        <div className="lg:col-span-1 p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Wallet className="w-4 h-4 text-emerald-400" />
              <span>Santé Financière</span>
            </h3>
            <button
              onClick={() => onNavigateTab('budget')}
              className="text-xs text-emerald-400 hover:underline flex items-center space-x-1"
            >
              <span>Détails</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-baseline">
              <span className="text-2xl font-bold text-white">
                {format(totalSpent, userCurrency)} <span className="text-xs font-normal text-slate-400">/ {format(budgetTotal, userCurrency)}</span>
              </span>
              <span className={`text-xs font-bold ${remainingBudget < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {format(remainingBudget, userCurrency)} restant
              </span>
            </div>

            <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  totalSpent > budgetTotal
                    ? 'bg-rose-500'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                }`}
                style={{ width: `${Math.min(100, (totalSpent / (budgetTotal || 1)) * 100)}%` }}
              />
            </div>

            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300 space-y-1">
              <div className="flex items-center justify-between font-semibold">
                <span>Dernière dépense :</span>
                <span className="text-emerald-400">
                  {expenses.length > 0 
                    ? format(convert(expenses[expenses.length - 1].amount, expenses[expenses.length - 1].currency || tripCurrency), userCurrency) 
                    : 'Aucune'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                {expenses.length > 0 ? expenses[expenses.length - 1].title : 'Budget vierge'}
              </p>
            </div>
          </div>
        </div>

        {/* 3rd Column: Souvenirs for Travelers / Arbitrage summary for Admin */}
        {!isAdmin ? (
          <div className="lg:col-span-1 p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Camera className="w-4 h-4 text-pink-400" />
                <span>Dernier Souvenir</span>
              </h3>
              <button
                onClick={() => onNavigateTab('memories')}
                className="text-xs text-pink-400 hover:underline flex items-center space-x-1"
              >
                <span>Galerie</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {memories.length > 0 ? (
              <div className="space-y-3">
                <div className="relative h-28 rounded-xl overflow-hidden bg-slate-950">
                  <img
                    src={memories[0].photos[0]}
                    alt={memories[0].title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 bg-slate-950/80 px-2 py-0.5 rounded text-[10px] text-white">
                    {memories[0].mood}
                  </div>
                </div>
                <h4 className="text-xs font-bold text-white truncate">{memories[0].title}</h4>
                <p className="text-[11px] text-slate-400 line-clamp-2 italic">
                  « {memories[0].story} »
                </p>
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-slate-500 space-y-2">
                <Camera className="w-8 h-8 mx-auto text-slate-600" />
                <p>Aucun souvenir encore immortalisé.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="lg:col-span-1 p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Shield className="w-4 h-4 text-amber-400" />
                <span>Supervision Admin & Arbitrage</span>
              </h3>
              <button
                onClick={() => onNavigateTab('complaints')}
                className="text-xs text-amber-400 hover:underline flex items-center space-x-1"
              >
                <span>Litiges</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <div className="flex items-center justify-between font-semibold">
                  <span>Dossiers d'assistance :</span>
                  <span className="text-rose-400 font-bold">{complaints.length} réclamation(s)</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {complaints.filter(c => c.status === 'Soumis').length} nouveau(x) dossier(s) en attente d'arbitrage
                </p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <span>Rôle Administrateur :</span>
                <span className="px-2 py-0.5 rounded font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[10px]">
                  Plein Pouvoir
                </span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
