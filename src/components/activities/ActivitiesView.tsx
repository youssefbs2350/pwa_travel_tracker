import React, { useState, useEffect } from 'react';
import { 
  CalendarDays, 
  Plus, 
  Sparkles, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Circle, 
  Trash2, 
  MapPin, 
  DollarSign,
  Edit3,
  CheckCircle,
  ArrowRight,
  ShieldCheck,
  Lock
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useTrips } from '../../context/TripContext';
import { useAuth } from '../../context/AuthContext';
import { Activity, ActivityStatus, Place } from '../../types';
import { Modal } from '../common/Modal';
import { api } from '../../services/api';
import { db } from '../../db/database';
import { useAppCurrency } from '../../utils/currency';

function timeToMinutes(t: string): number {
  if (!t || !t.includes(':')) return 540; // 09:00
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(totalMin: number): string {
  const normalized = Math.max(0, Math.min(23 * 60 + 59, totalMin));
  const h = Math.floor(normalized / 60).toString().padStart(2, '0');
  const m = (normalized % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export const ActivitiesView: React.FC = () => {
  const { activeTrip } = useTrips();
  const { currentUser } = useAuth();
  const { currency: userCurrency, format, convert } = useAppCurrency();
  const isPastTrip = activeTrip?.status === 'Terminé' || (activeTrip?.endDate ? new Date(activeTrip.endDate) < new Date() : false);
  const canManagePlanning = !isPastTrip; // Admin, Organizer et Voyageur peuvent modifier le planning sur un voyage actif
  const [activities, setActivities] = useState<Activity[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [dayNumber, setDayNumber] = useState(1);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:00');
  const [placeId, setPlaceId] = useState('');
  const [cost, setCost] = useState(0);
  const [description, setDescription] = useState('');

  // AI Suggestions supplémentaires
  const [addedActivitySuggestions, setAddedActivitySuggestions] = useState<string[]>([]);
  const cityName = activeTrip?.destination ? activeTrip.destination.split(',')[0].trim() : 'Destination';

  const activitySuggestions = [
    {
      idKey: 'sug-act-1',
      title: `⛵ Croisière Côtière & Coucher de Soleil (${cityName})`,
      category: 'Nature' as const,
      startTime: '17:30',
      endTime: '19:30',
      cost: 30,
      description: `Moment magique sur l'eau pour admirer le littoral et les reflets du soleil couchant.`,
      imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80',
      duration: 120
    },
    {
      idKey: 'sug-act-2',
      title: `🍳 Atelier Culinaire & Dégustation Gourmande (${cityName})`,
      category: 'Restaurant' as const,
      startTime: '11:00',
      endTime: '13:00',
      cost: 40,
      description: `Préparation avec un chef local de spécialités typiques suivie d'un déjeuner festif.`,
      imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80',
      duration: 120
    },
    {
      idKey: 'sug-act-3',
      title: `🎭 Soirée Spectacle Culturel & Musique Traditionnelle (${cityName})`,
      category: 'Monuments' as const,
      startTime: '20:30',
      endTime: '22:30',
      cost: 25,
      description: `Immersion artistique nocturne : performance folklorique et ambiance locale.`,
      imageUrl: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&auto=format&fit=crop&q=80',
      duration: 120
    }
  ];

  const handleAddSuggestedActivity = async (sug: typeof activitySuggestions[0]) => {
    if (!activeTrip) return;
    const baseLat = places.length > 0 ? places[0].latitude : 41.3851;
    const baseLon = places.length > 0 ? places[0].longitude : 2.1734;

    const placeId = `plc-sug-act-${Date.now()}`;
    const newPlace: Place = {
      id: placeId,
      tripId: activeTrip.id,
      name: sug.title,
      category: sug.category,
      address: `${sug.title}, ${activeTrip.destination}`,
      latitude: baseLat + (Math.random() - 0.5) * 0.02,
      longitude: baseLon + (Math.random() - 0.5) * 0.02,
      rating: 4.8,
      estimatedDurationMinutes: sug.duration,
      costEstimate: sug.cost,
      imageUrl: sug.imageUrl,
      notes: `Activité suggérée par l'IA pour le Jour ${selectedDay}`,
      createdAt: new Date().toISOString()
    };
    await api.places.create(newPlace);

    const targetDate = activities.find(a => a.dayNumber === selectedDay)?.date || activeTrip.startDate;
    const newAct: Activity = {
      id: `act-sug-${Date.now()}`,
      tripId: activeTrip.id,
      placeId: placeId,
      dayNumber: selectedDay,
      date: targetDate,
      startTime: sug.startTime,
      endTime: sug.endTime,
      title: sug.title,
      description: sug.description,
      cost: sug.cost,
      status: 'À faire',
      orderIndex: activities.filter(a => a.dayNumber === selectedDay).length,
      createdAt: new Date().toISOString()
    };
    await api.activities.create(newAct);

    if (sug.cost > 0) {
      await api.expenses.create({
        tripId: activeTrip.id,
        title: `Activité : ${sug.title}`,
        category: sug.category === 'Restaurant' ? 'Nourriture' : 'Activités',
        amount: sug.cost,
        currency: activeTrip.currency,
        date: targetDate,
        paidBy: currentUser?.name || 'Moi',
        splitWith: activeTrip.participants,
        notes: `Dépense issue de la suggestion IA du Jour ${selectedDay}`
      });
    }

    setAddedActivitySuggestions(prev => [...prev, sug.idKey]);
    await loadData();
    confetti({ particleCount: 70, spread: 60 });
    setToastMessage(`« ${sug.title} » ajoutée avec succès au planning du Jour ${selectedDay} et au budget !`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = async () => {
    if (!activeTrip) return;
    const actList = await api.activities.getByTrip(activeTrip.id);
    const plcList = await api.places.getByTrip(activeTrip.id);
    setActivities(actList);
    setPlaces(plcList);
  };

  useEffect(() => {
    loadData();
  }, [activeTrip?.id]);

  const getDaysArray = () => {
    if (!activeTrip) return [1];
    const d1 = new Date(activeTrip.startDate);
    const d2 = new Date(activeTrip.endDate);
    const diffDays = Math.max(1, Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    return Array.from({ length: diffDays }, (_, i) => i + 1);
  };

  const days = getDaysArray();

  // Detect schedule overlap / crossings
  const getConflicts = (day: number) => {
    const dayActs = activities
      .filter(a => a.dayNumber === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    const conflicts: { id1: string; id2: string; message: string; act1Title: string; act2Title: string }[] = [];

    for (let i = 0; i < dayActs.length - 1; i++) {
      const current = dayActs[i];
      const next = dayActs[i + 1];
      if (current.endTime > next.startTime) {
        conflicts.push({
          id1: current.id,
          id2: next.id,
          act1Title: current.title,
          act2Title: next.title,
          message: `Croisement horaire : « ${current.title} » (${current.startTime} - ${current.endTime}) empiète sur « ${next.title} » (${next.startTime} - ${next.endTime})`
        });
      }
    }
    return conflicts;
  };

  const dayConflicts = getConflicts(selectedDay);

  // ALGORITHME AVANCÉ : OPTIMISATION SANS CROISEMENT (YOUSSEF)
  const handleAutoOptimize = async () => {
    setIsOptimizing(true);
    await new Promise(r => setTimeout(r, 600));

    const dayActs = activities
      .filter(a => a.dayNumber === selectedDay)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    if (dayActs.length === 0) {
      setIsOptimizing(false);
      return;
    }

    const bufferMinutes = 15; // 15 min de battement pour déplacement
    let lastEndMin = 0;

    for (let i = 0; i < dayActs.length; i++) {
      const act = dayActs[i];
      let startMin = timeToMinutes(act.startTime);
      let endMin = timeToMinutes(act.endTime);

      // Conserver la durée originale de l'activité
      let duration = endMin - startMin;
      if (duration <= 0) duration = 90;

      if (i === 0) {
        lastEndMin = startMin + duration;
        const newEnd = minutesToTime(lastEndMin);
        await api.activities.update(act.id, { endTime: newEnd, orderIndex: i });
      } else {
        // Si l'activité démarre avant la fin de la précédente -> CROISEMENT !
        if (startMin < lastEndMin) {
          startMin = lastEndMin + bufferMinutes;
          endMin = startMin + duration;
        } else {
          endMin = startMin + duration;
        }

        const newStart = minutesToTime(startMin);
        const newEnd = minutesToTime(endMin);
        lastEndMin = endMin;

        await api.activities.update(act.id, {
          startTime: newStart,
          endTime: newEnd,
          orderIndex: i
        });
      }
    }

    await loadData();
    setIsOptimizing(false);
    confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    setToastMessage('Planning réajusté avec succès : aucun croisement d’horaire !');
    setTimeout(() => setToastMessage(null), 4000);
  };

  // ALGORITHME IA AVANCÉ : GÉNÉRATION DU PLANNING BASÉ SUR LE VOYAGE EN COURS,
  // LES LIEUX À VISITER ET LA DISTANCE LA PLUS COURTE (TSP / PLUS PROCHE VOISIN)
  const handleGenerateAIPlanningWithShortestPath = async () => {
    if (!activeTrip) return;
    setIsOptimizing(true);
    await new Promise(r => setTimeout(r, 700));

    // 1. Lieux associés au voyage actif
    let currentPlaces = await db.places.where('tripId').equals(activeTrip.id).toArray();

    // S'il n'y a pas de lieux, en générer avec géolocalisation cohérente
    if (currentPlaces.length === 0) {
      const city = activeTrip.destination.split(',')[0].trim();
      const baseLat = 41.3879;
      const baseLon = 2.1699;
      const initialPlaces: Place[] = [
        {
          id: 'plc-ai-1-' + Date.now(),
          tripId: activeTrip.id,
          name: `Trésors historiques & Monuments de ${city}`,
          category: 'Monuments',
          address: `${city} – Centre Historique`,
          latitude: baseLat + 0.004,
          longitude: baseLon + 0.003,
          rating: 4.9,
          estimatedDurationMinutes: 90,
          costEstimate: 20,
          imageUrl: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600&auto=format&fit=crop&q=80',
          createdAt: new Date().toISOString()
        },
        {
          id: 'plc-ai-2-' + Date.now(),
          tripId: activeTrip.id,
          name: `Restaurant Gastronomique Local`,
          category: 'Restaurant',
          address: `${city} – Rue Gourmande`,
          latitude: baseLat + 0.007,
          longitude: baseLon + 0.005,
          rating: 4.8,
          estimatedDurationMinutes: 75,
          costEstimate: 35,
          imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
          createdAt: new Date().toISOString()
        },
        {
          id: 'plc-ai-3-' + Date.now(),
          tripId: activeTrip.id,
          name: `Parc Panoramique & Belvédère`,
          category: 'Nature',
          address: `${city} – Belvédère`,
          latitude: baseLat + 0.012,
          longitude: baseLon + 0.009,
          rating: 4.7,
          estimatedDurationMinutes: 80,
          costEstimate: 0,
          imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80',
          createdAt: new Date().toISOString()
        },
        {
          id: 'plc-ai-4-' + Date.now(),
          tripId: activeTrip.id,
          name: `Marché Typique & Artisans`,
          category: 'Shopping',
          address: `${city} – Halles centrales`,
          latitude: baseLat + 0.002,
          longitude: baseLon + 0.001,
          rating: 4.6,
          estimatedDurationMinutes: 60,
          costEstimate: 15,
          imageUrl: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&auto=format&fit=crop&q=80',
          createdAt: new Date().toISOString()
        }
      ];
      await db.places.bulkAdd(initialPlaces);
      currentPlaces = initialPlaces;
    }

    // 2. Ordonnancement par la distance la plus courte (TSP Greedy)
    const unvisited = [...currentPlaces];
    const orderedPlaces: { place: Place; distanceToNextKm: number }[] = [];

    let curr = unvisited.shift()!;
    while (unvisited.length > 0) {
      let closestIdx = 0;
      let minDistance = calculateDistanceKm(
        curr.latitude, curr.longitude,
        unvisited[0].latitude, unvisited[0].longitude
      );

      for (let i = 1; i < unvisited.length; i++) {
        const dist = calculateDistanceKm(
          curr.latitude, curr.longitude,
          unvisited[i].latitude, unvisited[i].longitude
        );
        if (dist < minDistance) {
          minDistance = dist;
          closestIdx = i;
        }
      }

      orderedPlaces.push({ place: curr, distanceToNextKm: minDistance });
      curr = unvisited.splice(closestIdx, 1)[0];
    }
    orderedPlaces.push({ place: curr, distanceToNextKm: 0 });

    // 3. Calcul du planning et répartition sans chevauchement
    const tripDaysCount = days.length;
    const itemsPerDay = Math.max(1, Math.ceil(orderedPlaces.length / tripDaysCount));

    // Supprimer anciennes activités pour générer le planning optimisé
    const oldActs = await db.activities.where('tripId').equals(activeTrip.id).toArray();
    await db.activities.bulkDelete(oldActs.map(a => a.id));

    const newActivities: Activity[] = [];
    const tripStartDate = new Date(activeTrip.startDate);

    orderedPlaces.forEach(({ place, distanceToNextKm }, index) => {
      const day = Math.min(tripDaysCount, Math.floor(index / itemsPerDay) + 1);
      const stepInDay = index % itemsPerDay;

      const actDate = new Date(tripStartDate.getTime() + (day - 1) * 86400000)
        .toISOString()
        .split('T')[0];

      // Durée estimée selon le lieu
      const visitDurationMin = place.estimatedDurationMinutes || (place.category === 'Restaurant' ? 75 : 90);
      
      // Horaires séquentiels + trajet
      let startMin = 540 + stepInDay * (visitDurationMin + 30); // 09:00
      if (startMin >= 720 && startMin < 810) {
        startMin = 810; // Pause repas 12:00-13:30
      }
      const endMin = startMin + visitDurationMin;

      newActivities.push({
        id: 'act-tsp-' + Date.now() + '-' + index,
        tripId: activeTrip.id,
        placeId: place.id,
        dayNumber: day,
        date: actDate,
        startTime: minutesToTime(startMin),
        endTime: minutesToTime(endMin),
        title: place.name,
        description: `Étape optimisée IA (Trajet plus court : ~${distanceToNextKm} km vers l'étape suivante). Durée de visite estimée : ${visitDurationMin} min.`,
        cost: place.costEstimate || 0,
        status: 'À faire',
        orderIndex: stepInDay,
        createdAt: new Date().toISOString()
      });
    });

    await db.activities.bulkAdd(newActivities);
    await loadData();
    setIsOptimizing(false);
    confetti({ particleCount: 90, spread: 70, origin: { y: 0.5 } });
    setToastMessage(`Planning IA généré par distance la plus courte ! ${orderedPlaces.length} étapes réparties et temps de visite calibrés.`);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleToggleStatus = async (act: Activity) => {
    const nextStatus: ActivityStatus =
      act.status === 'À faire' ? 'En cours' : act.status === 'En cours' ? 'Terminé' : 'À faire';

    await api.activities.update(act.id, { status: nextStatus });
    await loadData();
  };

  const handleOpenEdit = (act: Activity) => {
    setEditingActivity(act);
    setTitle(act.title);
    setDayNumber(act.dayNumber);
    setStartTime(act.startTime);
    setEndTime(act.endTime);
    setPlaceId(act.placeId || '');
    setCost(act.cost);
    setDescription(act.description || '');
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingActivity) return;

    await api.activities.update(editingActivity.id, {
      title,
      dayNumber: Number(dayNumber),
      startTime,
      endTime,
      placeId: placeId || undefined,
      cost: Number(cost),
      description
    });

    await loadData();
    setIsEditModalOpen(false);
    setEditingActivity(null);
  };

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTrip) return;

    await api.activities.create({
      tripId: activeTrip.id,
      placeId: placeId || undefined,
      dayNumber: Number(dayNumber),
      date: activeTrip.startDate,
      startTime,
      endTime,
      title,
      description,
      cost: Number(cost),
      status: 'À faire',
      orderIndex: activities.length
    });

    await loadData();
    setIsAddModalOpen(false);
    setTitle('');
    setDescription('');
    setCost(0);
  };

  const handleDeleteActivity = async (id: string) => {
    await api.activities.delete(id);
    await loadData();
  };

  const currentDayActivities = activities
    .filter(a => a.dayNumber === selectedDay)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const completedCount = currentDayActivities.filter(a => a.status === 'Terminé').length;

  return (
    <div className="space-y-6">
      {/* Header with Member Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-teal-500/10 text-teal-400 rounded-xl border border-teal-500/20">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-white">Planning & Activités</h2>
            </div>
            <p className="text-sm text-slate-400 mt-0.5">
              Ordonnancement journalier, détection des croisements et réajustement automatique sans chevauchement.
            </p>
          </div>
        </div>

        {isPastTrip ? (
          <div className="flex items-center space-x-2 px-3.5 py-2 bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold self-start sm:self-auto">
            <Lock className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>Séjour archivé : Planning en lecture seule</span>
          </div>
        ) : canManagePlanning ? (
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <button
              onClick={handleGenerateAIPlanningWithShortestPath}
              disabled={isOptimizing}
              className="flex items-center space-x-2 px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-extrabold rounded-xl shadow-lg shadow-amber-500/25 transition-all transform hover:-translate-y-0.5 disabled:opacity-50"
              title="Génère un planning IA optimisé en ordonnant les lieux par la distance la plus courte et en calculant les durées de visite et trajets"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>Générer Planning IA (Distance la plus courte)</span>
            </button>

            <button
              onClick={handleAutoOptimize}
              disabled={isOptimizing || currentDayActivities.length < 2}
              className={`flex items-center space-x-2 px-3 py-2 text-xs font-extrabold rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-50 ${
                dayConflicts.length > 0
                  ? 'bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 animate-pulse'
                  : 'bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950'
              }`}
              title="Ajuste automatiquement les horaires pour éliminer tout croisement tout en conservant la durée de chaque visite"
            >
              <Sparkles className={`w-4 h-4 ${isOptimizing ? 'animate-spin' : ''}`} />
              <span>{isOptimizing ? 'Ajustement...' : dayConflicts.length > 0 ? 'Supprimer les Croisements' : 'Ajuster Horaires'}</span>
            </button>

            <button
              onClick={() => {
                setDayNumber(selectedDay);
                setIsAddModalOpen(true);
              }}
              className="flex items-center space-x-2 px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-teal-600/25 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter Activité</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-2 px-3.5 py-2 bg-slate-800/80 rounded-xl border border-slate-700 text-xs text-slate-300 self-start sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
            <span>Rôle Voyageur : Suivi personnel de l'agenda</span>
          </div>
        )}
      </div>

      {/* Toast Feedback Alert */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center space-x-2 shadow-lg animate-bounce">
          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Days Tabs Selector */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
        {days.map(d => {
          const actsForD = activities.filter(a => a.dayNumber === d);
          const hasConflict = getConflicts(d).length > 0;
          return (
            <button
              key={d}
              onClick={() => setSelectedDay(d)}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex-shrink-0 transition-all border flex items-center space-x-2 ${
                selectedDay === d
                  ? 'bg-teal-500 text-slate-950 border-teal-400 shadow-md shadow-teal-500/20'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>Jour {d}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                selectedDay === d ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-400'
              }`}>
                {actsForD.length}
              </span>
              {hasConflict && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" title="Croisement d'horaire détecté !" />
              )}
            </button>
          );
        })}
      </div>

      {/* Conflict / Overlap Banner (with 1-click solve) */}
      {dayConflicts.length > 0 ? (
        <div className="p-4 rounded-2xl bg-rose-950/70 border border-rose-500/50 text-rose-100 text-xs space-y-3 shadow-xl">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5 animate-pulse" />
              <div className="space-y-1">
                <h4 className="font-bold text-rose-200 text-sm">
                  {dayConflicts.length} croisement(s) d'horaires détecté(s) sur le Jour {selectedDay}
                </h4>
                {dayConflicts.map((c, i) => (
                  <p key={i} className="text-rose-200/90 leading-relaxed">• {c.message}</p>
                ))}
              </div>
            </div>

            {canManagePlanning && (
              <button
                onClick={handleAutoOptimize}
                disabled={isOptimizing}
                className="px-3.5 py-2 bg-rose-500 hover:bg-rose-400 text-slate-950 font-extrabold rounded-xl text-xs shadow-md flex items-center space-x-1.5 flex-shrink-0 transition-transform hover:scale-105"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Décaler & Supprimer les Croisements</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Confirmed No-Crossing Banner */
        currentDayActivities.length > 1 && (
          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span><strong>Planning Optimisé :</strong> Aucun croisement d'horaires sur cette journée.</span>
            </div>
            <span className="text-[10px] text-emerald-400/80">Battement fluide entre visites</span>
          </div>
        )
      )}

      {/* Day Progress Summary */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs">
        <div className="flex items-center space-x-3">
          <span className="text-slate-400">Progression du Jour {selectedDay} :</span>
          <span className="font-bold text-white">
            {completedCount} / {currentDayActivities.length} activités réalisées
          </span>
        </div>
        <div className="w-32 bg-slate-800 h-2 rounded-full overflow-hidden">
          <div
            className="bg-teal-500 h-full rounded-full transition-all duration-500"
            style={{
              width: `${currentDayActivities.length > 0 ? (completedCount / currentDayActivities.length) * 100 : 0}%`
            }}
          />
        </div>
      </div>

      {/* AI Smart Suggestions for extra activities */}
      {activeTrip && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-slate-900 to-teal-500/10 border border-amber-500/30 space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
              <h3 className="text-sm sm:text-base font-bold text-white">
                ✨ Autres suggestions IA pour votre planning à {cityName}
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
              Inspiration Jour {selectedDay}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Complétez votre agenda avec ces activités recommandées. Cliquez sur « Ajouter au planning » pour les insérer directement dans le Jour {selectedDay}.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            {activitySuggestions.map(sug => {
              const isAdded = addedActivitySuggestions.includes(sug.idKey) || activities.some(a => a.title === sug.title);
              return (
                <div key={sug.idKey} className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-col justify-between space-y-2 hover:border-amber-500/40 transition-colors">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-teal-300 text-[11px] bg-slate-800 px-2 py-0.5 rounded-md">
                        {sug.category}
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        🕒 {sug.startTime} - {sug.endTime} • {sug.cost > 0 ? `${sug.cost} €` : 'Gratuit'}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-white leading-tight">{sug.title}</h4>
                    <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">{sug.description}</p>
                  </div>

                  <button
                    onClick={() => handleAddSuggestedActivity(sug)}
                    disabled={isAdded}
                    className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
                      isAdded
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                        : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Ajouté au planning</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Ajouter au Jour {selectedDay}</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Activities Timeline List */}
      <div className="space-y-3">
        {currentDayActivities.length === 0 ? (
          <div className="text-center py-12 p-6 rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 space-y-3">
            <CalendarDays className="w-10 h-10 text-slate-600 mx-auto" />
            <h4 className="text-sm font-semibold text-slate-300">Aucune activité pour le Jour {selectedDay}</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Planifiez vos visites, restaurants ou moments de détente pour cette journée.
            </p>
            <button
              onClick={() => {
                setDayNumber(selectedDay);
                setIsAddModalOpen(true);
              }}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-teal-600/30 text-teal-300 border border-teal-500/40 rounded-xl text-xs font-semibold hover:bg-teal-600/50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ajouter la première activité</span>
            </button>
          </div>
        ) : (
          currentDayActivities.map((act, index) => {
            const linkedPlace = places.find(p => p.id === act.placeId);
            const hasConflict = dayConflicts.some(c => c.id1 === act.id || c.id2 === act.id);

            return (
              <div
                key={act.id}
                className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-2xl border transition-all gap-4 ${
                  hasConflict
                    ? 'bg-rose-950/30 border-rose-500/60 ring-1 ring-rose-500/40'
                    : act.status === 'Terminé'
                    ? 'bg-slate-900/50 border-slate-800/80 opacity-75'
                    : act.status === 'En cours'
                    ? 'bg-teal-950/30 border-teal-500/40 shadow-md ring-1 ring-teal-500/30'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Time badge & Status Toggle */}
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleToggleStatus(act)}
                    className="p-1 rounded-lg text-slate-400 hover:text-teal-400 transition-colors"
                    title={`Statut actuel : ${act.status} (Cliquer pour changer)`}
                  >
                    {act.status === 'Terminé' ? (
                      <CheckCircle2 className="w-5 h-5 text-teal-400 fill-teal-400/20" />
                    ) : act.status === 'En cours' ? (
                      <Clock className="w-5 h-5 text-amber-400 animate-spin" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-500" />
                    )}
                  </button>

                  <div className="flex flex-col">
                    <span className={`text-xs font-mono font-bold ${hasConflict ? 'text-rose-400 underline decoration-rose-500' : 'text-teal-300'}`}>
                      {act.startTime} - {act.endTime}
                    </span>
                    <span className="text-[10px] text-slate-500">Étape #{index + 1}</span>
                  </div>
                </div>

                {/* Title & Linked Place */}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center space-x-2">
                    <h4 className={`text-sm font-bold ${
                      act.status === 'Terminé' ? 'line-through text-slate-400' : 'text-white'
                    }`}>
                      {act.title}
                    </h4>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      act.status === 'Terminé'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : act.status === 'En cours'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {act.status}
                    </span>
                    {hasConflict && (
                      <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded-full font-bold">
                        ⚠️ Croisement
                      </span>
                    )}
                  </div>

                  {linkedPlace && (
                    <div className="flex items-center space-x-1 text-xs text-brand-400">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span>{linkedPlace.name} ({linkedPlace.category})</span>
                    </div>
                  )}

                  {act.description && (
                    <p className="text-xs text-slate-400">{act.description}</p>
                  )}
                </div>

                {/* Cost, Edit, and Delete */}
                <div className="flex items-center space-x-3 self-end sm:self-center">
                  {act.cost > 0 && (
                    <div className="text-xs font-bold text-amber-400 flex items-center space-x-1 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                      <DollarSign className="w-3 h-3" />
                      <span>{format(convert(act.cost, activeTrip?.currency || 'EUR'), userCurrency)}</span>
                    </div>
                  )}

                  {canManagePlanning && (
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleOpenEdit(act)}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        title="Modifier l'horaire ou les détails"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteActivity(act.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Add Activity */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Ajouter une Activité au Planning"
        subtitle={`Planification pour le Jour ${dayNumber}`}
      >
        <form onSubmit={handleCreateActivity} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Titre de l'activité</label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="ex: Visite de la Sagrada Familia ou Dégustation de tapas"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Jour</label>
              <select
                value={dayNumber}
                onChange={e => setDayNumber(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
              >
                {days.map(d => (
                  <option key={d} value={d}>Jour {d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Heure de début</label>
              <input
                type="time"
                required
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Heure de fin</label>
              <input
                type="time"
                required
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Rattacher à un lieu du séjour
            </label>
            <select
              value={placeId}
              onChange={e => setPlaceId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
            >
              <option value="">Aucun lieu spécifique (temps libre / transport)</option>
              {places.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.category})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Coût estimé (€)</label>
            <input
              type="number"
              min="0"
              value={cost}
              onChange={e => setCost(Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Notes ou instructions</label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Numéro de réservation, point de rendez-vous..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
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
              className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-teal-600/30"
            >
              Enregistrer l'Activité
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Activity & Time Slots */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Modifier l'Activité & ses Horaires"
        subtitle="Ajustez l'horaire pour éviter les chevauchements"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Titre</label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Jour</label>
              <select
                value={dayNumber}
                onChange={e => setDayNumber(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
              >
                {days.map(d => (
                  <option key={d} value={d}>Jour {d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Heure de début</label>
              <input
                type="time"
                required
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Heure de fin</label>
              <input
                type="time"
                required
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Lieu associé</label>
            <select
              value={placeId}
              onChange={e => setPlaceId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
            >
              <option value="">Aucun lieu spécifique</option>
              {places.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.category})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Coût (€)</label>
            <input
              type="number"
              min="0"
              value={cost}
              onChange={e => setCost(Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Notes</label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="pt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 text-sm font-semibold rounded-xl"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-teal-600/30"
            >
              Enregistrer les Modifications
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
