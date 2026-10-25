import React from 'react';
import { 
  Users, 
  Compass, 
  MapPin, 
  Calendar, 
  Wallet, 
  Sparkles, 
  AlertCircle, 
  CheckCircle, 
  Cpu, 
  Database, 
  Smartphone, 
  WifiOff, 
  ArrowRight,
  ShieldCheck,
  Layers
} from 'lucide-react';

interface TeamViewProps {
  onNavigateTab: (tabId: string) => void;
}

export const TeamView: React.FC<TeamViewProps> = ({ onNavigateTab }) => {
  const members = [
    {
      name: 'Utilisateurs & Profils',
      module: 'Authentification & Rôles',
      tabId: 'users',
      role: 'Module 1',
      crud: 'Gestion des comptes, profils, préférences de voyage et devises',
      advancedFeature: 'Authentification JWT sécurisée avec gestion fine des rôles (Traveler, Organizer, Admin)',
      icon: Users,
      color: 'from-indigo-600 to-indigo-800',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
    },
    {
      name: 'Voyages & Séjours',
      module: 'Itinéraires & Suivi',
      tabId: 'trips',
      role: 'Module 2',
      crud: 'Création, modification, suppression et suivi du cycle de vie des séjours',
      advancedFeature: 'Génération automatique d’itinéraire intelligent par IA selon le rythme et centres d’intérêt',
      icon: Compass,
      color: 'from-brand-600 to-brand-800',
      badgeColor: 'bg-brand-500/20 text-brand-300 border-brand-500/30'
    },
    {
      name: 'Destinations & Lieux',
      module: 'Cartographie & Proximité',
      tabId: 'places',
      role: 'Module 3',
      crud: 'Points d’intérêt, hôtels, restaurants, monuments, calcul de coûts et durées',
      advancedFeature: 'Carte interactive Leaflet et géolocalisation en direct avec calcul de proximité',
      icon: MapPin,
      color: 'from-sky-600 to-sky-800',
      badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30'
    },
    {
      name: 'Planning & Activités',
      module: 'Agenda & Optimisation',
      tabId: 'activities',
      role: 'Module 4',
      crud: 'Planning journalier (Jour 1, Jour 2...), créneaux horaires, bascule de statut en 1 clic',
      advancedFeature: 'Optimisation automatique du planning, ordonnancement intelligent et détection en temps réel des conflits horaires',
      icon: Calendar,
      color: 'from-teal-600 to-teal-800',
      badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/30'
    },
    {
      name: 'Budget & Dépenses',
      module: 'Finances & Split',
      tabId: 'budget',
      role: 'Module 5',
      crud: 'Saisie des dépenses, devises, catégories (transports, hébergement, restos)',
      advancedFeature: 'Analyse intelligente du budget : alertes de dépassement, projection IA et équilibrage des frais (Split)',
      icon: Wallet,
      color: 'from-emerald-600 to-emerald-800',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    },
    {
      name: 'Avis & Souvenirs',
      module: 'Journal & Recommandations',
      tabId: 'memories',
      role: 'Module 6',
      crud: 'Journal de bord photo, humeurs, récits d’aventures et notations 5 étoiles',
      advancedFeature: 'Moteur de recommandations personnalisées basé sur le score d’affinité voyageur et les avis',
      icon: Sparkles,
      color: 'from-pink-600 to-pink-800',
      badgeColor: 'bg-pink-500/20 text-pink-300 border-pink-500/30'
    },
    {
      name: 'Réclamations & Support',
      module: 'Assistance & Arbitrage',
      tabId: 'complaints',
      role: 'Module 7',
      crud: 'Déclaration de litiges de voyage (vols retardés, hébergement non conforme, préjudices)',
      advancedFeature: 'Workflow de résolution et timeline d’arbitrage avec accord d’indemnisations financières',
      icon: AlertCircle,
      color: 'from-rose-600 to-rose-800',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Overview Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-400">
              Projet Universitaire & Démarche d'Ingénierie
            </span>
            <h2 className="text-2xl font-extrabold text-white mt-1">
              Architecture Globale (7 Modules Intégrés)
            </h2>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            ✓ 100% Fonctionnel & Testable Hors-Ligne
          </span>
        </div>

        <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
          <strong>Travel Tracker</strong> réunit l'ensemble des besoins d'un voyageur (avant, pendant et après son voyage) dans une seule Progressive Web App installable. Les modules sont interconnectés de bout en bout pour garantir une cohérence totale de la donnée.
        </p>

        {/* PWA Architecture pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
            <div className="flex items-center space-x-1.5 text-brand-400 font-semibold">
              <Database className="w-4 h-4" />
              <span>IndexedDB Dexie</span>
            </div>
            <p className="text-[11px] text-slate-400">Persistance locale intégrale sans perte de données</p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
            <div className="flex items-center space-x-1.5 text-amber-400 font-semibold">
              <Smartphone className="w-4 h-4" />
              <span>PWA Installable</span>
            </div>
            <p className="text-[11px] text-slate-400">Web App Manifest v2 + Service Worker Workbox</p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
            <div className="flex items-center space-x-1.5 text-emerald-400 font-semibold">
              <WifiOff className="w-4 h-4" />
              <span>Offline-First</span>
            </div>
            <p className="text-[11px] text-slate-400">Cache tuiles de cartes et requêtes en avion</p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
            <div className="flex items-center space-x-1.5 text-purple-400 font-semibold">
              <Cpu className="w-4 h-4" />
              <span>Algorithmes IA</span>
            </div>
            <p className="text-[11px] text-slate-400">Optimisation planning, budget & affinités</p>
          </div>
        </div>
      </div>

      {/* Team Member Cards Grid */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center space-x-2">
          <Users className="w-5 h-5 text-brand-400" />
          <span>Fiches Modules & Fonctionnalités Avancées</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {members.map(m => {
            const Icon = m.icon;
            return (
              <div
                key={m.name}
                className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-lg hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div className="p-5 space-y-4">
                  {/* Top Bar with Member Name & Badge */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2.5 rounded-xl bg-gradient-to-br ${m.color} text-white shadow-md`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-white text-base">{m.name}</h4>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">{m.role}</span>
                      </div>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${m.badgeColor}`}>
                      {m.module}
                    </span>
                  </div>

                  {/* CRUD Details */}
                  <div className="space-y-1 text-xs">
                    <span className="font-bold text-slate-300">Partie CRUD :</span>
                    <p className="text-slate-400 leading-relaxed">{m.crud}</p>
                  </div>

                  {/* Advanced Feature Highlight */}
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                    <span className="font-bold text-amber-300 flex items-center space-x-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Fonctionnalité Avancée :</span>
                    </span>
                    <p className="text-slate-300 text-[11px] leading-relaxed">{m.advancedFeature}</p>
                  </div>
                </div>

                {/* Footer Link to Test the Module */}
                <div className="p-4 pt-0">
                  <button
                    onClick={() => onNavigateTab(m.tabId)}
                    className="w-full py-2 px-3 bg-slate-800 hover:bg-brand-600 hover:text-white text-slate-300 text-xs font-bold rounded-xl border border-slate-700/80 transition-colors flex items-center justify-center space-x-1.5"
                  >
                    <span>Tester le module de {m.name}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
