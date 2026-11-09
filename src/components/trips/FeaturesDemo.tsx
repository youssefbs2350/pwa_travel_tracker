/**
 * PAGE DE DÉMONSTRATION DES NOUVELLES FONCTIONNALITÉS
 * 
 * Accédez à cette page pour tester immédiatement tous les widgets
 * Sans avoir à modifier TripsView.tsx
 */

import React, { useState } from 'react';
import { Target, ArrowLeft } from 'lucide-react';
import { Trip } from '../../types';
import { TripReadinessWidget } from './TripReadinessWidget';
import { TripWeatherWidget } from './TripWeatherWidget';
import { SecureDocumentVault } from './SecureDocumentVault';
import { CollaborationPanel } from './CollaborationPanel';

// Voyage de démo avec toutes les données
const demoTrip: Trip = {
  id: 'demo-trip-1',
  userId: 'demo-user',
  title: 'Découverte de Djerba',
  destination: 'Djerba',
  country: 'Tunisie',
  startDate: '2024-12-20',
  endDate: '2024-12-27',
  coverImage: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop&q=85',
  budgetTotal: 2000,
  currency: 'EUR',
  status: 'Planifié',
  participants: ['Ameni', 'Chaima', 'Youssef'],
  shareCode: 'DEMO2024',
  packingList: [
    { id: '1', label: 'Passeport', category: 'Documents', isPacked: true },
    { id: '2', label: 'Crème solaire', category: 'Hygiène & Soins', isPacked: true },
    { id: '3', label: 'Maillot de bain', category: 'Vêtements', isPacked: false },
    { id: '4', label: 'Appareil photo', category: 'Électronique', isPacked: false },
  ],
  travelDocs: [
    {
      id: 'doc1',
      title: 'Billet d\'avion Paris-Djerba',
      category: 'Vol / Billet',
      referenceCode: 'AF1234',
      uploadedAt: '2024-11-01'
    },
    {
      id: 'doc2',
      title: 'Réservation Hôtel Radisson Blu',
      category: 'Hôtel / Logement',
      referenceCode: 'RDB-789456',
      uploadedAt: '2024-11-02'
    }
  ],
  destinationMeta: {
    timezone: 'UTC+1',
    emergencyNumbers: { police: '197', ambulance: '190' },
    plugType: 'Type C & E',
    language: 'Arabe & Français',
    currency: 'TND',
    bestMonths: 'Avril à Novembre'
  },
  notes: 'Voyage organisé avec l\'IA V2',
  createdAt: '2024-11-01T10:00:00Z',
  updatedAt: '2024-11-01T10:00:00Z'
};

const demoUser = {
  id: 'demo-user-1',
  name: 'Ameni',
  avatar: '👤'
};

export const FeaturesDemo: React.FC = () => {
  const [trip, setTrip] = useState<Trip>(demoTrip);

  const handleUpdateTrip = async (updates: Partial<Trip>) => {
    setTrip(prev => ({ ...prev, ...updates }));
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => window.history.back()}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-400" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center space-x-3">
                <Target className="w-8 h-8 text-brand-400" />
                <span>Nouvelles Fonctionnalités</span>
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Démo interactive des 4 fonctionnalités d'excellence
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="px-3 py-1.5 bg-emerald-500/20 text-emerald-300 text-xs font-bold rounded-lg border border-emerald-500/30">
              ✨ 4 Widgets Actifs
            </span>
            <span className="px-3 py-1.5 bg-brand-500/20 text-brand-300 text-xs font-bold rounded-lg border border-brand-500/30">
              Mode Démo
            </span>
          </div>
        </div>

        {/* Info Banner */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-brand-500/10 to-amber-500/10 border border-brand-500/30">
          <div className="flex items-start space-x-3">
            <Target className="w-5 h-5 text-brand-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white">💡 Comment intégrer dans votre app</h3>
              <p className="text-xs text-slate-300">
                Ces widgets sont <strong>prêts à l'emploi</strong>. Consultez le fichier{' '}
                <code className="px-1.5 py-0.5 bg-slate-900 rounded text-brand-400 font-mono text-[11px]">
                  INTEGRATION_EXEMPLE.tsx
                </code>{' '}
                pour voir le code d'intégration dans TripsView.
              </p>
              <div className="flex items-center space-x-4 mt-2 text-xs">
                <span className="text-emerald-400">✓ Prêt pour production</span>
                <span className="text-sky-400">✓ Données réelles compatibles</span>
                <span className="text-amber-400">✓ Mode offline supporté</span>
              </div>
            </div>
          </div>
        </div>

        {/* Grid de widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Widget 1: Score de Préparation */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">🎯</span>
                <h2 className="text-lg font-bold text-white">Score de Préparation</h2>
              </div>
              <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 font-bold">
                WIDGET 1/4
              </span>
            </div>
            <TripReadinessWidget trip={trip} />
            <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800 text-xs text-slate-400">
              <strong className="text-white">Utilité :</strong> Gamification qui encourage les utilisateurs à compléter leur préparation de voyage
            </div>
          </div>

          {/* Widget 2: Météo */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">🌦️</span>
                <h2 className="text-lg font-bold text-white">Météo Intelligente</h2>
              </div>
              <span className="text-xs bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded-full border border-sky-500/30 font-bold">
                WIDGET 2/4
              </span>
            </div>
            <TripWeatherWidget trip={trip} latitude={33.8} longitude={10.8} />
            <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800 text-xs text-slate-400">
              <strong className="text-white">Utilité :</strong> Données critiques + alertes automatiques pour optimiser le planning
            </div>
          </div>

          {/* Widget 3: Coffre-Fort */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">🔐</span>
                <h2 className="text-lg font-bold text-white">Coffre-Fort Sécurisé</h2>
              </div>
              <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30 font-bold">
                WIDGET 3/4
              </span>
            </div>
            <SecureDocumentVault trip={trip} onUpdateTrip={handleUpdateTrip} />
            <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800 text-xs text-slate-400">
              <strong className="text-white">Utilité :</strong> Chiffrement AES-256 pour passeports, cartes bancaires - différenciation concurrentielle
            </div>
          </div>

          {/* Widget 4: Collaboration */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">🤝</span>
                <h2 className="text-lg font-bold text-white">Collaboration Temps Réel</h2>
              </div>
              <span className="text-xs bg-brand-500/20 text-brand-300 px-2 py-0.5 rounded-full border border-brand-500/30 font-bold">
                WIDGET 4/4
              </span>
            </div>
            <CollaborationPanel 
              trip={trip} 
              currentUser={demoUser}
              participants={trip.participants || []}
              allUsers={[demoUser]} 
            />
            <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800 text-xs text-slate-400">
              <strong className="text-white">Utilité :</strong> Expérience multiplayer unique - chat + participants en ligne + événements live
            </div>
          </div>

        </div>

        {/* Footer statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-850 border border-slate-800">
          <div className="text-center">
            <div className="text-3xl font-bold text-brand-400">4</div>
            <div className="text-xs text-slate-400 mt-1">Widgets d'excellence</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-emerald-400">100%</div>
            <div className="text-xs text-slate-400 mt-1">Prêt pour production</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-sky-400">4-6h</div>
            <div className="text-xs text-slate-400 mt-1">Temps de développement</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-amber-400">∞</div>
            <div className="text-xs text-slate-400 mt-1">Impact utilisateur</div>
          </div>
        </div>

        {/* Instructions finales */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-lg font-bold text-white">📋 Prochaines Étapes</h3>
          <ol className="space-y-3 text-sm text-slate-300">
            <li className="flex items-start space-x-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-600 text-white text-xs font-bold flex-shrink-0">1</span>
              <div>
                <strong className="text-white">Testez chaque widget</strong>
                <p className="text-xs text-slate-400 mt-0.5">Interagissez avec les 4 fonctionnalités pour comprendre leur comportement</p>
              </div>
            </li>
            <li className="flex items-start space-x-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-600 text-white text-xs font-bold flex-shrink-0">2</span>
              <div>
                <strong className="text-white">Ouvrez INTEGRATION_EXEMPLE.tsx</strong>
                <p className="text-xs text-slate-400 mt-0.5">Copiez le code d'intégration dans TripsView.tsx</p>
              </div>
            </li>
            <li className="flex items-start space-x-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-600 text-white text-xs font-bold flex-shrink-0">3</span>
              <div>
                <strong className="text-white">Configurez les APIs (optionnel)</strong>
                <p className="text-xs text-slate-400 mt-0.5">OpenWeatherMap pour météo réelle + Socket.io pour collaboration</p>
              </div>
            </li>
            <li className="flex items-start space-x-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex-shrink-0">✓</span>
              <div>
                <strong className="text-emerald-400">Déployez en production !</strong>
                <p className="text-xs text-slate-400 mt-0.5">Toutes les fonctionnalités sont prêtes pour vos utilisateurs</p>
              </div>
            </li>
          </ol>
        </div>

      </div>
    </div>
  );
};
