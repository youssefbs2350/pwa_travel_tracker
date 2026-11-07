import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Lock,
  Sun,
  CloudSun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudFog,
  CloudDrizzle,
  Thermometer,
  Bell,
  BellRing,
  Send,
  Check
} from 'lucide-react';
import { useTrips } from '../../context/TripContext';
import { useAuth } from '../../context/AuthContext';
import { Activity, ActivityStatus, Place } from '../../types';
import { Modal } from '../common/Modal';
import { api } from '../../services/api';
import { db } from '../../db/database';
import { useAppCurrency } from '../../utils/currency';
import { fetchActivityWeather, ActivityWeatherData } from '../../services/weather';

const WeatherIcon: React.FC<{ iconName: string; className?: string }> = ({ iconName, className }) => {
  switch (iconName) {
    case 'Sun': return <Sun className={className} />;
    case 'CloudSun': return <CloudSun className={className} />;
    case 'Cloud': return <Cloud className={className} />;
    case 'CloudRain': return <CloudRain className={className} />;
    case 'CloudSnow': return <CloudSnow className={className} />;
    case 'CloudLightning': return <CloudLightning className={className} />;
    case 'CloudFog': return <CloudFog className={className} />;
    case 'CloudDrizzle': return <CloudDrizzle className={className} />;
    default: return <Sun className={className} />;
  }
};

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
  const [activityWeatherMap, setActivityWeatherMap] = useState<Record<string, ActivityWeatherData>>({});

  // Horloge dynamique et alertes intelligentes
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isSendingAlertEmail, setIsSendingAlertEmail] = useState<boolean>(false);
  const [alertEmailStatus, setAlertEmailStatus] = useState<string | null>(null);
  const alertedActivitiesRef = useRef<Set<string>>(new Set());

  // Déterminer le jour actuel du voyage selon la date réelle du jour
  const getCurrentDayOfTrip = useCallback((): number => {
    if (!activeTrip?.startDate) return 1;
    const start = new Date(activeTrip.startDate);
    start.setHours(0, 0, 0, 0);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diff = Math.floor((now.getTime() - start.getTime()) / 86400000) + 1;
    if (diff < 1) return 1;
    const maxDay = activeTrip.endDate 
      ? Math.max(1, Math.floor((new Date(activeTrip.endDate).getTime() - start.getTime()) / 86400000) + 1)
      : Math.max(...activities.map(a => a.dayNumber || 1), 7);
    return Math.min(diff, maxDay);
  }, [activeTrip?.startDate, activeTrip?.endDate, activities]);

  // Initialiser automatiquement au jour courant du séjour lors du changement de voyage
  useEffect(() => {
    if (activeTrip) {
      const currentDay = getCurrentDayOfTrip();
      setSelectedDay(currentDay);
    }
  }, [activeTrip?.id]);

  // Horloge en direct mise à jour toutes les 10 secondes
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const handleSendAlertEmail = async (act: Activity, minutesLeft: number) => {
    const targetEmail = currentUser?.email || 'tstststststs55@gmail.com';
    const linkedPlace = places.find(p => p.id === act.placeId);
    setIsSendingAlertEmail(true);
    setAlertEmailStatus('Alerte email envoyée automatiquement...');

    const res = await api.activities.sendAlertEmail({
      to: targetEmail,
      userName: currentUser?.name || 'Voyageur',
      activityTitle: act.title,
      startTime: act.startTime,
      locationName: linkedPlace?.name,
      locationAddress: linkedPlace?.address,
      tripTitle: activeTrip?.title || activeTrip?.destination,
      minutesRemaining: minutesLeft
    });

    setIsSendingAlertEmail(false);
    if (res.sent) {
      setAlertEmailStatus(`✓ Email automatique envoyé à ${targetEmail}`);
      alertedActivitiesRef.current.add(act.id);
      // Verrouille en BDD pour garantir qu'elle ne peut plus être renvoyée
      try {
        await api.activities.update(act.id, { alertSent: true });
        await loadData();
      } catch (e) {
        console.error('Error updating alertSent flag:', e);
      }
      setToastMessage(`Alerte email envoyée automatiquement à ${targetEmail} (départ dans ${minutesLeft} min) !`);
    } else {
      setAlertEmailStatus(res.message || 'Alerte simulée');
      setToastMessage(`Alerte : ${res.message}`);
    }
    setTimeout(() => {
      setToastMessage(null);
    }, 5000);
  };

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

  // Detect schedule overlap / crossings (tri et calcul stricts en minutes)
  const getConflicts = (day: number) => {
    const dayActs = activities
      .filter(a => a.dayNumber === day)
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

    const conflicts: { id1: string; id2: string; message: string; act1Title: string; act2Title: string }[] = [];

    for (let i = 0; i < dayActs.length - 1; i++) {
      const current = dayActs[i];
      const next = dayActs[i + 1];
      const currentEnd = timeToMinutes(current.endTime);
      const nextStart = timeToMinutes(next.startTime);
      if (currentEnd > nextStart) {
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
    await new Promise(r => setTimeout(r, 300));

    const dayActs = activities
      .filter(a => a.dayNumber === selectedDay)
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

    if (dayActs.length === 0) {
      setIsOptimizing(false);
      return;
    }

    const bufferMinutes = 15; // 15 min de battement pour déplacement
    const updatedDayActs: Activity[] = [];
    let lastEndMin = 0;

    for (let i = 0; i < dayActs.length; i++) {
      const act = dayActs[i];
      let startMin = timeToMinutes(act.startTime);
      let endMin = timeToMinutes(act.endTime);

      let duration = endMin - startMin;
      if (duration <= 0) duration = 90;

      let newStartMin = startMin;
      let newEndMin = endMin;

      if (i === 0) {
        newStartMin = Math.max(startMin, 540); // 09:00 au plus tôt
        newEndMin = newStartMin + duration;
        lastEndMin = newEndMin;
      } else {
        if (startMin < lastEndMin) {
          newStartMin = lastEndMin + bufferMinutes;
          newEndMin = newStartMin + duration;
        } else {
          newEndMin = newStartMin + duration;
        }
        lastEndMin = newEndMin;
      }

      updatedDayActs.push({
        ...act,
        startTime: minutesToTime(newStartMin),
        endTime: minutesToTime(newEndMin),
        orderIndex: i
      });
    }

    // 1. Mettre à jour React state immédiatement pour fluidité visuelle
    setActivities(prev => prev.map(a => updatedDayActs.find(u => u.id === a.id) || a));

    // 2. Persister immédiatement dans Dexie (IndexedDB local)
    await db.activities.bulkPut(updatedDayActs);

    // 3. Persister sur l'API MongoDB
    try {
      if (activeTrip) {
        await api.activities.optimize(activeTrip.id, selectedDay, bufferMinutes);
      }
    } catch {
      await Promise.all(
        updatedDayActs.map(u =>
          api.activities.update(u.id, {
            startTime: u.startTime,
            endTime: u.endTime,
            orderIndex: u.orderIndex
          })
        )
      );
    }

    // 4. Synchroniser avec MongoDB
    await loadData();
    setIsOptimizing(false);
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
    if (!editingActivity || !activeTrip) return;

    const tripStart = new Date(activeTrip.startDate);
    const actDate = new Date(tripStart.getTime() + (Number(dayNumber) - 1) * 86400000).toISOString().split('T')[0];

    await api.activities.update(editingActivity.id, {
      title,
      dayNumber: Number(dayNumber),
      date: actDate,
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

    const tripStart = new Date(activeTrip.startDate);
    const actDate = new Date(tripStart.getTime() + (Number(dayNumber) - 1) * 86400000).toISOString().split('T')[0];

    await api.activities.create({
      tripId: activeTrip.id,
      placeId: placeId || undefined,
      dayNumber: Number(dayNumber),
      date: actDate,
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
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  const completedCount = currentDayActivities.filter(a => a.status === 'Terminé').length;

  // Charger la météo de chaque activité du jour sélectionné en parallèle
  useEffect(() => {
    if (!activeTrip || currentDayActivities.length === 0) return;

    let isMounted = true;
    const loadWeatherForCurrentDay = async () => {
      const tripStart = new Date(activeTrip.startDate);

      const promises = currentDayActivities.map(async act => {
        const linkedPlace = places.find(p => p.id === act.placeId);
        const lat = linkedPlace?.latitude ?? places[0]?.latitude;
        const lon = linkedPlace?.longitude ?? places[0]?.longitude;

        if (lat !== undefined && lon !== undefined) {
          const actDate = act.date || new Date(tripStart.getTime() + (act.dayNumber - 1) * 86400000).toISOString().split('T')[0];
          const weather = await fetchActivityWeather(lat, lon, actDate);
          return { id: act.id, weather };
        }
        return null;
      });

      const results = await Promise.all(promises);
      if (!isMounted) return;

      const newMap: Record<string, ActivityWeatherData> = {};
      results.forEach(r => {
        if (r && r.weather) {
          newMap[r.id] = r.weather;
        }
      });
      setActivityWeatherMap(prev => ({ ...prev, ...newMap }));
    };

    loadWeatherForCurrentDay();

    return () => {
      isMounted = false;
    };
  }, [selectedDay, activities, places, activeTrip?.id]);

  // Calcul temps réel & statut dynamique des activités sur TOUT le séjour
  const nowMin = currentTime.getHours() * 60 + currentTime.getMinutes();
  const timeFormatted = `${String(currentTime.getHours()).padStart(2, '0')}:${String(currentTime.getMinutes()).padStart(2, '0')}`;
  const todayDateStr = currentTime.toISOString().split('T')[0];
  const currentTripDay = getCurrentDayOfTrip();

  // Position temporelle du jour sélectionné
  const isSelectedDayPast = selectedDay < currentTripDay;
  const isSelectedDayToday = selectedDay === currentTripDay;
  const isSelectedDayFuture = selectedDay > currentTripDay;

  // Activités prévues AUJOURD'HUI sur l'ensemble du séjour (date réelle d'aujourd'hui)
  const todayTripActivities = activities.filter(act => {
    if (act.date) {
      return act.date.split('T')[0] === todayDateStr;
    }
    return act.dayNumber === currentTripDay;
  }).sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  // Détection de la prochaine activité d'aujourd'hui pour l'alerte email automatique
  const todayUpcoming = todayTripActivities
    .filter(act => timeToMinutes(act.startTime) > nowMin && act.status !== 'Terminé')
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  const todayNextActivity = todayUpcoming[0] || null;
  const todayMinUntilNext = todayNextActivity ? timeToMinutes(todayNextActivity.startTime) - nowMin : null;
  const isTodayImminent = todayMinUntilNext !== null && todayMinUntilNext > 0 && todayMinUntilNext <= 10;

  // Effet d'alerte automatique par email à 10 minutes du départ (exclusivement pour les activités d'aujourd'hui)
  useEffect(() => {
    if (!todayNextActivity || todayMinUntilNext === null) return;
    if (todayMinUntilNext > 0 && todayMinUntilNext <= 10) {
      if (!alertedActivitiesRef.current.has(todayNextActivity.id)) {
        alertedActivitiesRef.current.add(todayNextActivity.id);
        handleSendAlertEmail(todayNextActivity, todayMinUntilNext);
      }
    }
  }, [todayMinUntilNext, todayNextActivity?.id]);

  // Activités analysées pour le widget selon la journée sélectionnée
  const ongoingActivity = isSelectedDayToday
    ? currentDayActivities.find(act => {
        const s = timeToMinutes(act.startTime);
        const e = timeToMinutes(act.endTime);
        return nowMin >= s && nowMin < e;
      })
    : null;

  const nextUpcomingActivity = isSelectedDayToday
    ? currentDayActivities
        .filter(act => timeToMinutes(act.startTime) > nowMin && act.status !== 'Terminé')
        .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))[0] || null
    : isSelectedDayFuture
    ? currentDayActivities[0] || null
    : null;

  const minUntilNext = (isSelectedDayToday && nextUpcomingActivity)
    ? timeToMinutes(nextUpcomingActivity.startTime) - nowMin
    : null;

  const isNextImminent = isSelectedDayToday && minUntilNext !== null && minUntilNext > 0 && minUntilNext <= 10;

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

      {/* 🔔 WIDGET TEMPS RÉEL : NOTIFICATION INTELLIGENTE & PLANNING DYNAMIQUE */}
      {activeTrip && (
        <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/95 via-slate-850 to-slate-900/95 shadow-xl p-4 sm:p-5 space-y-4">
          {/* Header du Widget Live */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="p-2.5 bg-gradient-to-br from-teal-500/20 to-indigo-500/20 text-teal-300 rounded-xl border border-teal-500/30">
                  <Bell className="w-5 h-5" />
                </div>
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500"></span>
                </span>
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-bold text-white">Suivi en Direct & Alertes Intelligentes</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/30 font-semibold font-mono">
                    LIVE
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-slate-400 mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-teal-400" />
                  <span>Heure système : <strong className="text-white font-mono">{timeFormatted}</strong></span>
                  <span>•</span>
                  <span>
                    {isSelectedDayToday ? (
                      <span className="text-teal-300 font-semibold">Jour {selectedDay} (Aujourd'hui)</span>
                    ) : isSelectedDayPast ? (
                      <span className="text-slate-400">Jour {selectedDay} (Passé)</span>
                    ) : (
                      <span className="text-indigo-300">Jour {selectedDay} (À venir)</span>
                    )} • {activeTrip.title || activeTrip.destination}
                  </span>
                </div>
              </div>
            </div>

            {/* Notification automatique */}
            <div className="flex items-center space-x-2 text-xs bg-slate-950/80 px-3 py-1.5 rounded-xl border border-teal-500/30 text-teal-300">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
              <span className="font-semibold">Alerte email automatique (10 min avant)</span>
              <span className="text-[10px] text-slate-400 font-normal hidden sm:inline">
                &bull; {currentUser?.email || 'tstststststs55@gmail.com'}
              </span>
            </div>
          </div>

          {/* Rappel compact si alerte imminente sur le jour réel pendant la consultation d'un autre jour */}
          {!isSelectedDayToday && isTodayImminent && todayNextActivity && (
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-rose-950/90 via-amber-950/80 to-rose-950/90 border border-rose-500/60 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-pulse">
              <div className="flex items-center space-x-2">
                <BellRing className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span className="text-rose-200">
                  <strong>Alerte en direct Aujourd'hui (Jour {currentTripDay}) :</strong> « {todayNextActivity.title} » débute dans <strong>{todayMinUntilNext} min</strong> ({todayNextActivity.startTime}) !
                </span>
              </div>
              <button
                onClick={() => setSelectedDay(currentTripDay)}
                className="px-2.5 py-1 bg-rose-500 text-slate-950 text-xs font-bold rounded-lg self-start sm:self-auto hover:bg-rose-400 transition-colors"
              >
                Voir Aujourd'hui
              </button>
            </div>
          )}

          {/* Affichage différencié selon le jour consulté : Passé / Futur / Aujourd'hui */}
          {isSelectedDayPast ? (
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <span className="font-bold text-white">Jour {selectedDay} terminé (Journée passée)</span>
                  <p className="text-slate-400 text-[11px] mt-0.5">Toutes les étapes de cette journée sont achevées.</p>
                </div>
              </div>
              {currentTripDay !== selectedDay && (
                <button
                  onClick={() => setSelectedDay(currentTripDay)}
                  className="px-3 py-1.5 bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors self-start sm:self-auto"
                >
                  <span>Aller à Aujourd'hui (Jour {currentTripDay})</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          ) : isSelectedDayFuture ? (
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <CalendarDays className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-white">Jour {selectedDay} à venir</span>
                  <p className="text-slate-400 text-[11px] mt-0.5">{currentDayActivities.length} activité(s) planifiée(s) pour cette journée.</p>
                </div>
              </div>
              {currentTripDay !== selectedDay && (
                <button
                  onClick={() => setSelectedDay(currentTripDay)}
                  className="px-3 py-1.5 bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors self-start sm:self-auto"
                >
                  <span>Revenir à Aujourd'hui (Jour {currentTripDay})</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Section A : ALERTE DÉPART IMMINENT (≤ 10 min) */}
              {isNextImminent && nextUpcomingActivity && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-rose-950/80 via-amber-950/60 to-rose-950/80 border-2 border-rose-500/70 shadow-lg shadow-rose-950/50 space-y-3 animate-pulse">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-rose-500 text-slate-950 rounded-xl">
                        <BellRing className="w-5 h-5 animate-bounce" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs uppercase font-extrabold tracking-wider text-rose-300">
                            Alerte Départ Imminent (≤ 10 min)
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-rose-500 text-slate-950 text-xs font-black">
                            Dans {minUntilNext} min !
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-white mt-0.5">
                          « {nextUpcomingActivity.title} » débute à {nextUpcomingActivity.startTime}
                        </h4>
                      </div>
                    </div>

                    {/* Badge statut automatique (aucun bouton manuel) */}
                    <div className="flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-900/90 border border-rose-500/30 text-rose-200 self-start sm:self-auto shadow-sm">
                      {isSendingAlertEmail ? (
                        <>
                          <Clock className="w-3.5 h-3.5 animate-spin text-amber-400" />
                          <span>Envoi email automatique...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{alertEmailStatus || `Alerte email envoyée automatiquement`}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Détails du lieu et météo pour l'activité imminente */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-rose-500/20 text-xs">
                    {places.find(p => p.id === nextUpcomingActivity.placeId) && (
                      <span className="text-rose-200 flex items-center space-x-1">
                        <MapPin className="w-3.5 h-3.5 text-rose-400" />
                        <span>Lieu : <strong>{places.find(p => p.id === nextUpcomingActivity.placeId)?.name}</strong></span>
                      </span>
                    )}
                    {activityWeatherMap[nextUpcomingActivity.id] && (
                      <span className="text-amber-200 flex items-center space-x-1">
                        <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                        <span>Météo : {activityWeatherMap[nextUpcomingActivity.id].emoji} {activityWeatherMap[nextUpcomingActivity.id].temperature}°C ({activityWeatherMap[nextUpcomingActivity.id].label})</span>
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Section B : ACTIVITÉ EN COURS */}
              {ongoingActivity ? (
                <div className="p-4 rounded-xl bg-slate-950/70 border border-teal-500/40 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-ping" />
                      <span className="text-xs uppercase font-extrabold tracking-wider text-teal-300">
                        Activité en cours actuellement
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-400">
                        ({ongoingActivity.startTime} → {ongoingActivity.endTime})
                      </span>
                    </div>

                    <button
                      onClick={() => handleToggleStatus(ongoingActivity)}
                      className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 border border-teal-500/30 transition-colors self-start sm:self-auto"
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-teal-400" />
                      <span>Marquer terminée</span>
                    </button>
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-white">« {ongoingActivity.title} »</h4>
                    {ongoingActivity.description && (
                      <p className="text-xs text-slate-300 mt-1">{ongoingActivity.description}</p>
                    )}
                  </div>
                </div>
              ) : nextUpcomingActivity && !isNextImminent ? (
                /* Section C : Pas d'activité en cours, mais prochaine étape planifiée plus tard */
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-400 font-medium">Prochaine étape aujourd'hui :</span>
                      <span className="font-bold text-white">« {nextUpcomingActivity.title} »</span>
                    </div>
                    <div className="flex items-center space-x-2 text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      <span>
                        Prévue à <strong className="text-teal-300">{nextUpcomingActivity.startTime}</strong> (dans {Math.floor((minUntilNext || 0) / 60) > 0 ? `${Math.floor((minUntilNext || 0) / 60)}h ` : ''}{(minUntilNext || 0) % 60} min)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5 text-[11px] text-teal-400 bg-slate-900/90 px-2.5 py-1.5 rounded-lg border border-slate-800 self-start sm:self-auto">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span>
                    <span>Alerte email automatique déclenchée à 10 min</span>
                  </div>
                </div>
              ) : currentDayActivities.length > 0 && !ongoingActivity && !nextUpcomingActivity ? (
                /* Section D : Toutes les activités du jour sont passées */
                <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 text-xs text-slate-400 flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-400" />
                  <span>Toutes les activités prévues pour le Jour {selectedDay} sont achevées pour aujourd'hui !</span>
                </div>
              ) : null}
            </>
          )}
        </div>
      )}

      {/* Days Tabs Selector */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
        {days.map(d => {
          const actsForD = activities.filter(a => a.dayNumber === d);
          const hasConflict = getConflicts(d).length > 0;
          const isDayToday = d === currentTripDay;
          const isDayPast = d < currentTripDay;

          return (
            <button
              key={d}
              onClick={() => setSelectedDay(d)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex-shrink-0 transition-all border flex items-center space-x-2 ${
                selectedDay === d
                  ? 'bg-teal-500 text-slate-950 border-teal-400 shadow-md shadow-teal-500/20'
                  : isDayToday
                  ? 'bg-teal-950/60 text-teal-300 border-teal-500/50 hover:bg-teal-900/50'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>Jour {d}</span>
              {isDayToday && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-wider ${
                  selectedDay === d ? 'bg-slate-950 text-teal-300' : 'bg-teal-400 text-slate-950'
                }`}>
                  Aujourd'hui
                </span>
              )}
              {isDayPast && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${
                  selectedDay === d ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-400'
                }`}>
                  ✓ Fait
                </span>
              )}
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <span className="text-slate-400">Progression du Jour {selectedDay} :</span>
            <span className="font-bold text-white">
              {completedCount} / {currentDayActivities.length} activités réalisées
            </span>
          </div>

          {/* Météo globale du jour */}
          {Object.values(activityWeatherMap)[0] && (
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-800/90 border border-slate-700 text-slate-200">
              <Thermometer className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-slate-400">Météo prévisionnelle :</span>
              <span className="font-bold">{Object.values(activityWeatherMap)[0].emoji} {Object.values(activityWeatherMap)[0].temperature}°C</span>
              <span className="text-slate-300 font-medium">({Object.values(activityWeatherMap)[0].label})</span>
            </div>
          )}
        </div>

        <div className="w-full sm:w-32 bg-slate-800 h-2 rounded-full overflow-hidden">
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
            const weather = activityWeatherMap[act.id];
            const isActivityDone = isSelectedDayPast || act.status === 'Terminé';

            return (
              <div
                key={act.id}
                className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-2xl border transition-all gap-4 ${
                  hasConflict
                    ? 'bg-rose-950/30 border-rose-500/60 ring-1 ring-rose-500/40'
                    : isActivityDone
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
                    title={`Statut : ${isActivityDone ? 'Terminé (Passé)' : act.status} (Cliquer pour basculer)`}
                  >
                    {isActivityDone ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-400/20" />
                    ) : act.status === 'En cours' ? (
                      <Clock className="w-5 h-5 text-amber-400 animate-spin" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-500" />
                    )}
                  </button>

                  <div className="flex flex-col">
                    <span className={`text-xs font-mono font-bold ${hasConflict ? 'text-rose-400 underline decoration-rose-500' : isActivityDone ? 'text-slate-400' : 'text-teal-300'}`}>
                      {act.startTime} - {act.endTime}
                    </span>
                    <span className="text-[10px] text-slate-500">Étape #{index + 1}</span>
                  </div>
                </div>

                {/* Title, Weather & Exact Location */}
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center space-x-2">
                    <h4 className={`text-sm font-bold ${
                      isActivityDone ? 'line-through text-slate-400' : 'text-white'
                    }`}>
                      {act.title}
                    </h4>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      isActivityDone
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : act.status === 'En cours'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {isSelectedDayPast ? 'Passé (Done)' : act.status}
                    </span>
                    {hasConflict && (
                      <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded-full font-bold">
                        ⚠️ Croisement
                      </span>
                    )}
                  </div>

                  {/* Badges Météo et Emplacement Exact */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Badge Météo */}
                    {weather ? (
                      <div
                        className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border shadow-sm transition-all ${
                          weather.isRainy
                            ? 'bg-blue-950/40 border-blue-500/40 text-blue-200'
                            : 'bg-amber-950/30 border-amber-500/30 text-amber-200'
                        }`}
                        title={`Météo pour le ${weather.dateStr} : ${weather.label} (${weather.tempMin}°C à ${weather.tempMax}°C)`}
                      >
                        <WeatherIcon iconName={weather.iconName} className={`w-3.5 h-3.5 ${weather.isRainy ? 'text-blue-400' : 'text-amber-400'}`} />
                        <span>{weather.emoji}</span>
                        <span className="font-extrabold">{weather.temperature}°C</span>
                        <span className="text-[11px] text-slate-300 font-normal">• {weather.label}</span>
                        {weather.isRainy && (
                          <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1 rounded font-semibold">☔ Parapluie</span>
                        )}
                      </div>
                    ) : (
                      <div className="inline-flex items-center space-x-1 text-slate-500 text-[11px] px-2 py-0.5 rounded bg-slate-800/40">
                        <Sun className="w-3 h-3 text-slate-600 animate-pulse" />
                        <span>Météo...</span>
                      </div>
                    )}

                    {/* Badge Emplacement Exact */}
                    {linkedPlace ? (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${linkedPlace.latitude},${linkedPlace.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800/90 hover:bg-slate-750 text-emerald-300 border border-emerald-500/30 transition-colors shadow-sm group"
                        title={`Emplacement exact : ${linkedPlace.name} - ${linkedPlace.address}. Cliquer pour ouvrir dans Google Maps`}
                      >
                        <MapPin className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 group-hover:scale-110 transition-transform" />
                        <span className="font-semibold text-white truncate max-w-[150px] sm:max-w-[220px]">
                          {linkedPlace.name}
                        </span>
                        {linkedPlace.address && (
                          <span className="text-slate-400 text-[11px] hidden md:inline truncate max-w-[140px]">
                            ({linkedPlace.address})
                          </span>
                        )}
                        <span className="text-[10px] text-emerald-400/80 font-mono">
                          [{linkedPlace.latitude.toFixed(2)}, {linkedPlace.longitude.toFixed(2)}]
                        </span>
                      </a>
                    ) : (
                      <div className="inline-flex items-center space-x-1 text-xs text-slate-400 px-2 py-0.5 rounded bg-slate-800/40">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        <span>{activeTrip?.destination || 'Destination'}</span>
                      </div>
                    )}
                  </div>

                  {act.description && (
                    <p className="text-xs text-slate-400 leading-relaxed">{act.description}</p>
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
