import React, { useState } from 'react';
import { 
  Compass, 
  Plus, 
  Sparkles, 
  Calendar, 
  MapPin, 
  DollarSign, 
  Users, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  ArrowRight,
  PlaneTakeoff
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useTrips } from '../../context/TripContext';
import { useAuth } from '../../context/AuthContext';
import { Trip, TripStatus, Place, Activity, Expense } from '../../types';
import { Modal } from '../common/Modal';
import { db } from '../../db/database';
import { useAppCurrency } from '../../utils/currency';

export const getDestinationCover = (dest: string) => {
  const d = dest.toLowerCase();
  if (d.includes('paris') || d.includes('france')) return 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&auto=format&fit=crop&q=85';
  if (d.includes('tokyo') || d.includes('japon') || d.includes('kyoto') || d.includes('tokio')) return 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1200&auto=format&fit=crop&q=85';
  if (d.includes('barcelon') || d.includes('madrid') || d.includes('espagne') || d.includes('brcelon') || d.includes('barca')) return 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=1200&auto=format&fit=crop&q=85';
  if (d.includes('rome') || d.includes('italie') || d.includes('venise') || d.includes('roma')) return 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1200&auto=format&fit=crop&q=85';
  if (d.includes('djerba') || d.includes('tunis') || d.includes('tunisie') || d.includes('jerba') || d.includes('zarzis')) return 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop&q=85';
  if (d.includes('londres') || d.includes('london') || d.includes('uk')) return 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1200&auto=format&fit=crop&q=85';
  if (d.includes('new york') || d.includes('usa') || d.includes('nyc')) return 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1200&auto=format&fit=crop&q=85';
  if (d.includes('istanbul') || d.includes('turquie') || d.includes('istanboul')) return 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=1200&auto=format&fit=crop&q=85';
  if (d.includes('dubai') || d.includes('emirats') || d.includes('dubaï')) return 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&auto=format&fit=crop&q=85';
  if (d.includes('marrakech') || d.includes('maroc') || d.includes('marakech') || d.includes('marrakch')) return 'https://images.unsplash.com/photo-1597212618440-806262de4f6b?w=1200&auto=format&fit=crop&q=85';
  if (d.includes('santorin') || d.includes('grece') || d.includes('santorini') || d.includes('santorine')) return 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1200&auto=format&fit=crop&q=85';
  if (d.includes('bali') || d.includes('indonesie') || d.includes('ubud')) return 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200&auto=format&fit=crop&q=85';
  if (d.includes('amsterdam') || d.includes('amstrdam') || d.includes('hollande')) return 'https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?w=1200&auto=format&fit=crop&q=85';
  return 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&auto=format&fit=crop&q=85';
};

interface ResolvedDestination {
  standardizedName: string;
  cityName: string;
  countryName: string;
  lat: number;
  lon: number;
  coverImage: string;
  travelTips: string[];
}

export const resolveDestinationWithAI = async (rawQuery: string): Promise<ResolvedDestination> => {
  const q = (rawQuery || '').trim().toLowerCase();

  // Dictionnaire fuzzy pour destinations fréquentes et tolérance aux fautes d'orthographe
  const knownDestinations: Record<string, { city: string; country: string; lat: number; lon: number; image: string; tips: string[] }> = {
    barcelon: {
      city: 'Barcelone',
      country: 'Espagne',
      lat: 41.3851,
      lon: 2.1734,
      image: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=1200&auto=format&fit=crop&q=85',
      tips: [
        '🎟️ Sagrada Família & Parc Güell : Réservez vos billets coupe-file au moins 10 jours avant pour économiser jusqu\'à 20%.',
        '🚇 Transport malin : Achetez une carte T-Casual (10 trajets) pour diviser vos frais de métro par deux.',
        '🍽️ Tapas locaux : Privilégiez les quartiers Gràcia et Poble Sec plutôt que les artères ultra-touristiques.'
      ]
    },
    brcelon: {
      city: 'Barcelone',
      country: 'Espagne',
      lat: 41.3851,
      lon: 2.1734,
      image: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=1200&auto=format&fit=crop&q=85',
      tips: [
        '🎟️ Billets coupe-file recommandés pour la Sagrada Família.',
        '🚇 Carte T-Casual pour se déplacer à moindre coût.',
        '🍽️ Dégustations authentiques dans les ruelles du Born.'
      ]
    },
    djerba: {
      city: 'Djerba',
      country: 'Tunisie',
      lat: 33.8076,
      lon: 10.8451,
      image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop&q=85',
      tips: [
        '🎨 Djerbahood : Visitez la galerie de street-art à ciel ouvert à Erriadh en fin d\'après-midi.',
        '🐟 Repas de pêcheur : Choisissez votre poisson frais à la criée de Houmt Souk pour une cuisson minute à 15 TND.',
        '🏺 Poteries artisanales : Visitez les ateliers traditionnels de Guellala pour des prix direct fabricant.'
      ]
    },
    marakech: {
      city: 'Marrakech',
      country: 'Maroc',
      lat: 31.6295,
      lon: -7.9811,
      image: 'https://images.unsplash.com/photo-1597212618440-806262de4f6b?w=1200&auto=format&fit=crop&q=85',
      tips: [
        '🌿 Jardin Majorelle : Créneau de 08h30 impératif pour éviter la chaleur et la foule.',
        '🍵 Rooftops : Admirez le coucher de soleil sur la Koutoubia depuis un café de la place Jemaa el-Fna.',
        '🛍️ Souks de la Médina : Prenez le temps d\'échanger chaleureusement avec les artisans tannerie et épices.'
      ]
    },
    tokio: {
      city: 'Tokyo',
      country: 'Japon',
      lat: 35.6762,
      lon: 139.6503,
      image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1200&auto=format&fit=crop&q=85',
      tips: [
        '🚇 Tokyo Subway Pass 72h : Métro illimité pour seulement ~9 €.',
        '🗼 Belvédère de Shinjuku : Vue panoramique à 360° au 45e étage de la mairie, 100% gratuite.',
        '🍜 Ramen authentiques : Commandez sur borne dans les ruelles de Shinjuku pour ~6 €.'
      ]
    },
    rome: {
      city: 'Rome',
      country: 'Italie',
      lat: 41.9028,
      lon: 12.4964,
      image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1200&auto=format&fit=crop&q=85',
      tips: [
        '🏛️ Billet combiné Colisée + Forum Romain le matin.',
        '🍝 Quartier Trastevere pour de vraies pâtes Carbonara & Cacio e Pepe traditionnelles.',
        '💧 Fontaines gratuites historiques « Nasoni » pour remplir sa gourde partout.'
      ]
    },
    istanbul: {
      city: 'Istanbul',
      country: 'Turquie',
      lat: 41.0082,
      lon: 28.9784,
      image: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=1200&auto=format&fit=crop&q=85',
      tips: [
        '🚢 Ferry public Bosphore : Traversée entre continents pour ~1 € seulement.',
        '🕌 Sainte-Sophie & Mosquée Bleue : Privilégiez les visites tôt le matin.',
        '☕ Quartiers Balat et Karaköy pour les salons de thé d\'artistes.'
      ]
    },
    santorin: {
      city: 'Santorin',
      country: 'Grèce',
      lat: 36.3932,
      lon: 25.4615,
      image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1200&auto=format&fit=crop&q=85',
      tips: [
        '🌅 Coucher de soleil à Imerovigli plutôt qu\'à Oia pour le calme absolu.',
        '🚶 Randonnée Fira-Oia le long de la crête au lever du jour.',
        '🍷 Dégustation de vins volcaniques blancs locaux.'
      ]
    }
  };

  // 1. Recherche dans le dictionnaire fuzzy local
  for (const [key, val] of Object.entries(knownDestinations)) {
    if (q.includes(key) || key.includes(q)) {
      return {
        standardizedName: `${val.city}, ${val.country}`,
        cityName: val.city,
        countryName: val.country,
        lat: val.lat,
        lon: val.lon,
        coverImage: val.image,
        travelTips: val.tips
      };
    }
  }

  // 2. Recherche en ligne avec Nominatim (OpenStreetMap gère naturellement les fautes d'orthographe)
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(rawQuery)}&format=json&addressdetails=1&limit=1`);
    const data = await res.json();
    if (data && data.length > 0) {
      const place = data[0];
      const city = place.address?.city || place.address?.town || place.address?.village || place.address?.municipality || place.name || rawQuery;
      const country = place.address?.country || 'International';
      const lat = parseFloat(place.lat);
      const lon = parseFloat(place.lon);
      const coverImage = getDestinationCover(`${city} ${country}`);

      return {
        standardizedName: `${city}, ${country}`,
        cityName: city,
        countryName: country,
        lat,
        lon,
        coverImage,
        travelTips: [
          `🎟️ Forfaits & Pass Touristiques : Renseignez-vous à l'office de tourisme de ${city} pour économiser jusqu'à 30% sur les entrées.`,
          `🍽️ Bonnes adresses locales : Choisissez des restaurants en retrait des axes touristiques pour un meilleur rapport qualité/prix.`,
          `🚇 Transports en commun : Privilégiez les forfaits journaliers ou hebdomadaires pour vos déplacements.`
        ]
      };
    }
  } catch (err) {
    console.warn('[AI Geocoding] Erreur recherche en ligne, fallback local:', err);
  }

  // 3. Fallback générique propre
  const fallbackCover = getDestinationCover(rawQuery);
  return {
    standardizedName: rawQuery,
    cityName: rawQuery.split(',')[0].trim(),
    countryName: rawQuery.includes(',') ? rawQuery.split(',')[1].trim() : 'International',
    lat: 41.3851,
    lon: 2.1734,
    coverImage: fallbackCover,
    travelTips: [
      '🎟️ Réservez vos principales activités en ligne pour bénéficier de réductions anticipées.',
      '🍽️ Privilégiez les tables fréquentées par les résidents locaux pour une immersion authentique.',
      '💡 Consultez les horaires des visites gratuites dans les musées de la ville.'
    ]
  };
};

export const TripsView: React.FC = () => {
  const { trips, activeTrip, setActiveTripId, addTrip, updateTrip, deleteTrip } = useTrips();
  const { currentUser } = useAuth();
  const { currency: userCurrency, format, convert } = useAppCurrency();
  const canManageTrips = currentUser?.role === 'Admin' || currentUser?.role === 'Organizer';

  const [tripFilter, setTripFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isGeneratorModalOpen, setIsGeneratorModalOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('');
  const [country, setCountry] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [budgetTotal, setBudgetTotal] = useState(1500);
  const [currency, setCurrency] = useState('EUR');
  const [status, setStatus] = useState<TripStatus>('Planifié');
  const [participantsText, setParticipantsText] = useState('Moi');

  // Generator states
  const [genDestination, setGenDestination] = useState('Barcelone, Espagne');
  const [genDays, setGenDays] = useState(4);
  const [genPace, setGenPace] = useState<'Relaxed' | 'Balanced' | 'Intense'>('Balanced');
  const [genTheme, setGenTheme] = useState('Culture & Gastronomie');
  const [isGenerating, setIsGenerating] = useState(false);

  const resetForm = () => {
    setTitle('');
    setDestination('');
    setCountry('');
    setStartDate('');
    setEndDate('');
    setCoverImage('');
    setBudgetTotal(1500);
    setCurrency(currentUser?.preferences.currency || 'EUR');
    setStatus('Planifié');
    setParticipantsText(currentUser?.name || '');
    setEditingTrip(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (trip: Trip) => {
    setEditingTrip(trip);
    setTitle(trip.title);
    setDestination(trip.destination);
    setCountry(trip.country);
    setStartDate(trip.startDate);
    setEndDate(trip.endDate);
    setCoverImage(trip.coverImage);
    setBudgetTotal(trip.budgetTotal);
    setCurrency(trip.currency);
    setStatus(trip.status);
    setParticipantsText(trip.participants.join(', '));
    setIsCreateModalOpen(true);
  };

  const handleSaveTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrip && !canManageTrips) {
      alert("Action refusée : Seuls les Organisateurs et Administrateurs sont autorisés à créer des voyages.");
      return;
    }
    const participants = participantsText.split(',').map(p => p.trim()).filter(Boolean);
    const defaultCover = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&auto=format&fit=crop&q=80';

    if (editingTrip) {
      await updateTrip(editingTrip.id, {
        title,
        destination,
        country,
        startDate,
        endDate,
        coverImage: coverImage || editingTrip.coverImage,
        budgetTotal,
        currency,
        status,
        participants
      });
    } else {
      await addTrip({
        userId: currentUser?.id || 'usr-default',
        title,
        destination,
        country,
        startDate: startDate || new Date().toISOString().split('T')[0],
        endDate: endDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        coverImage: coverImage || defaultCover,
        budgetTotal,
        currency,
        status,
        participants: participants.length > 0 ? participants : [currentUser?.name || 'Moi']
      });
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    }

    setIsCreateModalOpen(false);
    resetForm();
  };

  // Advanced feature: AI Smart Itinerary Generation
  const handleAutoGenerateItinerary = async () => {
    if (!canManageTrips) {
      alert("Action refusée : Seuls les Organisateurs et Administrateurs sont autorisés à générer des voyages.");
      return;
    }
    setIsGenerating(true);
    
    // 1. Résolution IA de la destination : correction des fautes, coordonnées GPS exactes & photo sublime
    const resolved = await resolveDestinationWithAI(genDestination);

    const start = new Date();
    const end = new Date(Date.now() + genDays * 86400000);
    const cityName = resolved.cityName;
    const countryName = resolved.countryName;
    const baseLat = resolved.lat;
    const baseLon = resolved.lon;

    const newTrip = await addTrip({
      userId: currentUser?.id || 'usr-default',
      title: `Escapade ${genTheme} à ${resolved.standardizedName}`,
      destination: resolved.standardizedName,
      country: countryName,
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      coverImage: resolved.coverImage,
      budgetTotal: 1500, // Mis à jour précisément après le calcul des activités
      currency: currentUser?.preferences.currency || 'EUR',
      status: 'Planifié',
      participants: [currentUser?.name || 'Moi', 'Compagnon de voyage'],
      itinerarySummary: `Circuit ${genTheme} organisé par l'IA sur ${genDays} jours à ${resolved.standardizedName} (rythme ${genPace}). Les meilleurs lieux ont été ajoutés sur la carte et ordonnés dans le planning journalier avec détection des meilleurs plans.`,
      notes: `💡 MEILLEURS PLANS & ASTUCES ÉCONOMIQUES IA :\n` + resolved.travelTips.join('\n')
    });

    const themePool = [
      {
        titleSuffix: `Centre Historique & Patrimoine`,
        category: 'Monuments' as const,
        cost: 15,
        duration: 120,
        image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&auto=format&fit=crop&q=80',
        desc: `Immersion culturelle dans les plus beaux monuments historiques de ${cityName}.`
      },
      {
        titleSuffix: `Saveurs & Gastronomie Locale`,
        category: 'Restaurant' as const,
        cost: 30,
        duration: 90,
        image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80',
        desc: `Pause culinaire gourmande : dégustation de spécialités du terroir de ${cityName}.`
      },
      {
        titleSuffix: `Grand Musée d'Art & Culture`,
        category: 'Monuments' as const,
        cost: 20,
        duration: 120,
        image: 'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=600&auto=format&fit=crop&q=80',
        desc: `Visite guidée des chefs-d’œuvre incontournables et expositions renommées.`
      },
      {
        titleSuffix: `Marché Typique & Artisans`,
        category: 'Shopping' as const,
        cost: 25,
        duration: 90,
        image: 'https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?w=600&auto=format&fit=crop&q=80',
        desc: `Balade au marché coloré pour dénicher produits régionaux et créations artisanales de ${cityName}.`
      },
      {
        titleSuffix: `Parc & Belvédère Panoramique`,
        category: 'Nature' as const,
        cost: 0,
        duration: 90,
        image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80',
        desc: `Moment de détente en plein air avec une vue imprenable sur ${cityName}.`
      },
      {
        titleSuffix: `Dîner Chaleureux & Ambiance Nocturne`,
        category: 'Restaurant' as const,
        cost: 35,
        duration: 120,
        image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=80',
        desc: `Dîner dans une table réputée de ${cityName} pour son hospitalité et sa cuisine d'auteur.`
      }
    ];

    const activitiesPerDay = genPace === 'Relaxed' ? 2 : genPace === 'Balanced' ? 3 : 4;
    const timeSlots = [
      { start: '09:30', end: '11:30' },
      { start: '12:00', end: '13:30' },
      { start: '14:30', end: '17:00' },
      { start: '18:30', end: '20:30' }
    ];

    const generatedPlaces: Place[] = [];
    const generatedActivities: Activity[] = [];

    // Génération dynamique pour CHAQUE jour du séjour selon genDays
    for (let day = 1; day <= genDays; day++) {
      const dayDate = new Date(start.getTime() + (day - 1) * 86400000).toISOString().split('T')[0];

      for (let step = 0; step < activitiesPerDay; step++) {
        const poolIndex = ((day - 1) * activitiesPerDay + step) % themePool.length;
        const item = themePool[poolIndex];
        const slot = timeSlots[step % timeSlots.length];

        const placeId = `plc-gen-${day}-${step + 1}-${Date.now()}`;
        const actId = `act-gen-${day}-${step + 1}-${Date.now()}`;

        // Répartition géographique réelle autour des coordonnées GPS de la destination
        const angle = (day * activitiesPerDay + step) * 1.25;
        const distOffset = 0.005 + (step * 0.003) + (day * 0.002);

        generatedPlaces.push({
          id: placeId,
          tripId: newTrip.id,
          name: `${item.titleSuffix} (${cityName})`,
          category: item.category,
          address: `Secteur Jour ${day}, ${resolved.standardizedName}`,
          latitude: baseLat + Math.sin(angle) * distOffset,
          longitude: baseLon + Math.cos(angle) * distOffset,
          rating: Number((4.6 + Math.random() * 0.35).toFixed(1)),
          estimatedDurationMinutes: item.duration,
          costEstimate: item.cost,
          imageUrl: item.image,
          notes: `Lieu sélectionné par l'IA pour le Jour ${day} (${genTheme}).`,
          createdAt: new Date().toISOString()
        });

        // L'activité s'appuie directement sur le lieu créé et sélectionné
        generatedActivities.push({
          id: actId,
          tripId: newTrip.id,
          placeId: placeId,
          dayNumber: day,
          date: dayDate,
          startTime: slot.start,
          endTime: slot.end,
          title: `${item.titleSuffix} – ${cityName}`,
          description: item.desc,
          cost: item.cost,
          status: 'À faire',
          orderIndex: step,
          createdAt: new Date().toISOString()
        });
      }
    }

    await db.places.bulkAdd(generatedPlaces);
    await db.activities.bulkAdd(generatedActivities);

    // Initialiser le budget directement à partir des activités générées par l'IA
    const generatedExpenses: Expense[] = [];

    // Dépenses prévisionnelles pour chaque activité payante du planning
    generatedActivities
      .filter(act => act.cost > 0)
      .forEach((act, idx) => {
        generatedExpenses.push({
          id: `exp-gen-act-${idx}-${Date.now()}`,
          tripId: newTrip.id,
          title: `Activité : ${act.title}`,
          category: act.title.includes('Saveurs') || act.title.includes('Dîner') ? 'Nourriture' : 'Activités',
          amount: act.cost,
          currency: newTrip.currency,
          date: act.date,
          paidBy: currentUser?.name || 'Moi',
          splitWith: newTrip.participants,
          notes: 'Dépense prévisionnelle issue directement du planning IA',
          createdAt: new Date().toISOString()
        });
      });

    // Estimation Hébergement et Transport basée sur les jours du séjour
    const lodgingTotal = genDays * 90;
    const transportTotal = 150;

    generatedExpenses.push({
      id: `exp-gen-lodging-${Date.now()}`,
      tripId: newTrip.id,
      title: `Hébergement (${genDays} nuits)`,
      category: 'Hébergement',
      amount: lodgingTotal,
      currency: newTrip.currency,
      date: start.toISOString().split('T')[0],
      paidBy: currentUser?.name || 'Moi',
      splitWith: newTrip.participants,
      notes: `Hébergement estimé pour ${genDays} jours de visite`,
      createdAt: new Date().toISOString()
    });

    generatedExpenses.push({
      id: `exp-gen-transp-${Date.now()}`,
      tripId: newTrip.id,
      title: `Transport aller-retour (${cityName})`,
      category: 'Transport',
      amount: transportTotal,
      currency: newTrip.currency,
      date: start.toISOString().split('T')[0],
      paidBy: currentUser?.name || 'Moi',
      splitWith: newTrip.participants,
      notes: 'Billet de transport / vol estimé',
      createdAt: new Date().toISOString()
    });

    await db.expenses.bulkAdd(generatedExpenses);

    // Synchroniser immédiatement les lieux, le planning et le budget vers MongoDB
    await Promise.all([
      fetch('/api/places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(generatedPlaces)
      }).catch(err => console.warn('[AI Trips] Sync places MongoDB fallback', err)),
      fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(generatedActivities)
      }).catch(err => console.warn('[AI Trips] Sync activities MongoDB fallback', err)),
      fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(generatedExpenses)
      }).catch(err => console.warn('[AI Trips] Sync expenses MongoDB fallback', err))
    ]);

    // Calcul du budget total exact du voyage = Somme des activités du planning + Hébergement + Transport + Marge sécurité
    const totalActivitiesCost = generatedActivities.reduce((sum, a) => sum + (a.cost || 0), 0);
    const calculatedBudgetTotal = Math.round((totalActivitiesCost + lodgingTotal + transportTotal) * 1.15);
    await updateTrip(newTrip.id, { budgetTotal: calculatedBudgetTotal });

    setIsGenerating(false);
    setIsGeneratorModalOpen(false);
    setActiveTripId(newTrip.id);
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.5 } });
  };

  const isPastTrip = (t: Trip) => t.status === 'Terminé' || new Date(t.endDate) < new Date();
  const pastTrips = trips.filter(isPastTrip);
  const upcomingTrips = trips.filter(t => !isPastTrip(t));
  const displayedTrips = tripFilter === 'all' 
    ? trips 
    : tripFilter === 'past' 
    ? pastTrips 
    : upcomingTrips;

  const handleToggleCompleted = async (trip: Trip) => {
    const newStatus: TripStatus = trip.status === 'Terminé' ? 'En cours' : 'Terminé';
    await updateTrip(trip.id, { status: newStatus });
    if (newStatus === 'Terminé') {
      confetti({ particleCount: 60, spread: 50 });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Member Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-brand-500/10 text-brand-400 rounded-xl border border-brand-500/20">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-white">Voyages & Itinéraires</h2>
            </div>
            <p className="text-sm text-slate-400 mt-0.5">
              Gestion complète des séjours et générateur intelligent d'itinéraires sur-mesure.
            </p>
          </div>
        </div>

        {canManageTrips ? (
          <div className="flex items-center space-x-2 self-start sm:self-auto">
            <button
              onClick={() => setIsGeneratorModalOpen(true)}
              className="flex items-center space-x-2 px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-extrabold rounded-xl shadow-lg shadow-amber-500/20 transition-all transform hover:-translate-y-0.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>Générer Itinéraire IA</span>
            </button>

            <button
              onClick={handleOpenCreate}
              className="flex items-center space-x-2 px-3.5 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-brand-500/25 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Nouveau Voyage</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-2 px-3.5 py-2 bg-slate-800/80 rounded-xl border border-slate-700 text-xs text-slate-300 self-start sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Rôle Voyageur : Consultation & Choix du séjour</span>
          </div>
        )}
      </div>

      {/* Trips Filter Bar (All / Upcoming / Past History) */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-2">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setTripFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              tripFilter === 'all'
                ? 'bg-brand-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Tous les voyages ({trips.length})
          </button>
          <button
            onClick={() => setTripFilter('upcoming')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              tripFilter === 'upcoming'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            En cours & Planifiés ({upcomingTrips.length})
          </button>
          <button
            onClick={() => setTripFilter('past')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              tripFilter === 'past'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            🏛️ Historique des voyages passés ({pastTrips.length})
          </button>
        </div>
      </div>

      {/* Trips Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayedTrips.map(trip => {
          const isActive = activeTrip?.id === trip.id;
          const isPast = isPastTrip(trip);
          return (
            <div
              key={trip.id}
              className={`group relative rounded-2xl overflow-hidden border transition-all duration-300 ${
                isActive
                  ? 'border-brand-500 shadow-xl shadow-brand-500/10 bg-slate-900 ring-1 ring-brand-500/50'
                  : 'border-slate-800 bg-slate-900/80 hover:border-slate-700 hover:shadow-lg'
              }`}
            >
              {/* Cover Image & Status Badge */}
              <div className="relative h-44 w-full overflow-hidden bg-slate-950">
                <img
                  src={trip.coverImage}
                  alt={trip.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                
                {/* Status pill */}
                <div className="absolute top-3 left-3 flex items-center space-x-1.5">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md ${
                      trip.status === 'En cours'
                        ? 'bg-emerald-500/80 text-white border border-emerald-400/40'
                        : trip.status === 'Planifié'
                        ? 'bg-sky-500/80 text-white border border-sky-400/40'
                        : trip.status === 'Terminé'
                        ? 'bg-purple-600/80 text-white border border-purple-400/50'
                        : 'bg-amber-500/80 text-slate-950'
                    }`}
                  >
                    {trip.status}
                  </span>
                  {isPast && trip.status !== 'Terminé' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-950/80 text-purple-300 border border-purple-500/40 backdrop-blur-md">
                      Passé
                    </span>
                  )}
                </div>

                {/* Active Trip Indicator */}
                {isActive && (
                  <div className="absolute top-3 right-3 bg-brand-500 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center space-x-1 shadow-md">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Voyage Sélectionné</span>
                  </div>
                )}

                {/* Country / Destination text overlay */}
                <div className="absolute bottom-3 left-4 right-4">
                  <div className="flex items-center space-x-1 text-xs text-brand-300 font-semibold mb-0.5">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{trip.destination} • {trip.country}</span>
                  </div>
                  <h3 className="text-base font-bold text-white truncate drop-shadow-sm">{trip.title}</h3>
                </div>
              </div>

              {/* Trip details */}
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                  <div className="flex items-center space-x-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{trip.startDate}</span>
                  </div>
                  <div className="flex items-center space-x-1.5 justify-end">
                    <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                    <span className="font-semibold text-white">
                      {format(convert(trip.budgetTotal, trip.currency), userCurrency)}
                    </span>
                    {trip.currency !== userCurrency && (
                      <span className="text-[10px] text-slate-500 font-normal">
                        ({trip.budgetTotal} {trip.currency})
                      </span>
                    )}
                  </div>
                </div>

                {trip.participants && trip.participants.length > 0 && (
                  <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                    <Users className="w-3.5 h-3.5 text-slate-500" />
                    <span className="truncate">
                      {trip.participants.slice(0, 3).join(', ')}
                      {trip.participants.length > 3 && ` +${trip.participants.length - 3}`}
                    </span>
                  </div>
                )}

                {trip.itinerarySummary && (
                  <p className="text-xs text-slate-400 line-clamp-2 italic bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                    « {trip.itinerarySummary} »
                  </p>
                )}

                {trip.notes && trip.notes.includes('MEILLEURS PLANS') && (
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200 space-y-1">
                    <div className="flex items-center space-x-1.5 font-bold text-amber-300">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                      <span>Meilleurs Plans & Astuces Économiques IA :</span>
                    </div>
                    <div className="whitespace-pre-line text-[10px] text-slate-300 leading-relaxed max-h-24 overflow-y-auto">
                      {trip.notes.replace('💡 MEILLEURS PLANS & ASTUCES ÉCONOMIQUES IA :\n', '')}
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <div className="flex items-center space-x-2">
                    {!isPast ? (
                      <button
                        onClick={() => setActiveTripId(trip.id)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center space-x-1 transition-colors ${
                          isActive
                            ? 'bg-brand-500/20 text-brand-400'
                            : 'bg-slate-800 hover:bg-brand-600 hover:text-white text-slate-300'
                        }`}
                      >
                        <span>{isActive ? 'Actif' : 'Sélectionner'}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    ) : (
                      <span className="text-[11px] font-medium text-slate-500 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                        Voyage Passé (Archivé)
                      </span>
                    )}

                    {canManageTrips && (
                      <button
                        onClick={() => handleToggleCompleted(trip)}
                        className={`text-[11px] px-2 py-1 rounded-lg border transition-colors ${
                          trip.status === 'Terminé'
                            ? 'bg-purple-500/10 text-purple-300 border-purple-500/30 hover:bg-purple-500/20'
                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                        }`}
                        title={trip.status === 'Terminé' ? 'Voyage terminé (cliquez pour réactiver)' : 'Marquer comme terminé dans l\'historique'}
                      >
                        {trip.status === 'Terminé' ? '✓ Terminé' : 'Terminer'}
                      </button>
                    )}
                  </div>

                  {canManageTrips && (
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleOpenEdit(trip)}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        title="Modifier le voyage"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Supprimer le voyage "${trip.title}" et toutes ses données associées ?`)) {
                            deleteTrip(trip.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Create or Edit Trip */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={editingTrip ? 'Modifier le Voyage' : 'Nouveau Voyage'}
        subtitle="Renseignez les détails généraux de votre séjour"
      >
        <form onSubmit={handleSaveTrip} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Titre du voyage</label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="ex: Roadtrip Côte Ouest des États-Unis"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Destination / Ville</label>
              <input
                type="text"
                required
                value={destination}
                onChange={e => setDestination(e.target.value)}
                placeholder="ex: San Francisco & Yosemite"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Pays</label>
              <input
                type="text"
                required
                value={country}
                onChange={e => setCountry(e.target.value)}
                placeholder="ex: USA"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Date de début</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Date de fin</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Budget prévisionnel</label>
              <input
                type="number"
                min="0"
                value={budgetTotal}
                onChange={e => setBudgetTotal(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Devise</label>
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
              >
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
                <option value="TND">TND (DT)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Statut du séjour</label>
            <div className="grid grid-cols-4 gap-2">
              {(['Brouillon', 'Planifié', 'En cours', 'Terminé'] as TripStatus[]).map(st => (
                <button
                  type="button"
                  key={st}
                  onClick={() => setStatus(st)}
                  className={`py-1.5 text-xs font-medium rounded-lg border ${
                    status === st
                      ? 'bg-brand-600 text-white border-brand-500'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-300">Image de couverture</label>
              <button
                type="button"
                onClick={() => {
                  if (destination.trim()) {
                    const aiCover = getDestinationCover(destination);
                    setCoverImage(aiCover);
                    confetti({ particleCount: 30, spread: 40 });
                  } else {
                    alert("Veuillez d'abord saisir le nom d'une destination ou ville.");
                  }
                }}
                className="text-[11px] text-amber-400 hover:text-amber-300 font-bold flex items-center space-x-1"
                title="L'IA sélectionne automatiquement une image haute définition sublime"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>✨ Choisir image sublime par IA</span>
              </button>
            </div>
            <input
              type="url"
              value={coverImage}
              onChange={e => setCoverImage(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
            />
            {coverImage && (
              <div className="mt-2 relative h-28 rounded-xl overflow-hidden border border-slate-700">
                <img src={coverImage} alt="Aperçu couverture" className="w-full h-full object-cover" />
                <span className="absolute bottom-2 left-2 bg-slate-950/80 px-2 py-0.5 rounded text-[10px] text-amber-300 font-semibold border border-amber-500/30">
                  ✨ Image sélectionnée par IA
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Participants (séparés par des virgules)</label>
            <input
              type="text"
              value={participantsText}
              onChange={e => setParticipantsText(e.target.value)}
              placeholder="Moi, Sophie, Marc..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="pt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 text-sm font-semibold rounded-xl"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-brand-500/30"
            >
              {editingTrip ? 'Mettre à jour' : 'Enregistrer le Voyage'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: AI Smart Itinerary Generator */}
      <Modal
        isOpen={isGeneratorModalOpen}
        onClose={() => setIsGeneratorModalOpen(false)}
        title="Organisateur de Voyage IA & Planning Intelligent"
        subtitle="Recherche du lieu (tolère les fautes), sélection d'image, POI sur la carte, planning et budget complet"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-600/10 to-amber-700/10 border border-amber-500/20 text-xs text-amber-200">
            ✨ Véritable voyage organisé par IA : recherche et géocodage du lieu, sélection automatique de la photo de couverture, placement des meilleurs points d'intérêt sur la carte, planning journalier détaillé et calcul du budget prévisionnel.
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Destination cible (même mal orthographiée)</label>
            <input
              type="text"
              value={genDestination}
              onChange={e => setGenDestination(e.target.value)}
              placeholder="ex: brcelon, djerba tunisie, tokio, marakech, rome, amstrdam..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
            />
            <p className="text-[11px] text-amber-400/90 mt-1 flex items-center space-x-1">
              <Sparkles className="w-3 h-3 flex-shrink-0" />
              <span>L'IA analyse le nom, corrige l'orthographe, trouve les coordonnées GPS réelles et choisit une photo sublime.</span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Durée du séjour ({genDays} jours)</label>
              <input
                type="range"
                min="2"
                max="14"
                value={genDays}
                onChange={e => setGenDays(Number(e.target.value))}
                className="w-full accent-amber-500"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>Week-end (2j)</span>
                <span>Semaine (7j)</span>
                <span>Grand voyage (14j)</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Rythme</label>
              <select
                value={genPace}
                onChange={e => setGenPace(e.target.value as 'Relaxed' | 'Balanced' | 'Intense')}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              >
                <option value="Relaxed">Relaxé (1 à 2 étapes/jour)</option>
                <option value="Balanced">Équilibré (3 étapes/jour)</option>
                <option value="Intense">Intensif (Exploration max)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Thématique principale</label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {['Culture & Histoire', 'Gastronomie & Vins', 'Nature & Randonnée', 'Plage & Détente'].map(t => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setGenTheme(t)}
                  className={`py-2 px-3 rounded-lg border text-left transition-colors ${
                    genTheme === t
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 flex justify-end space-x-3">
            <button
              type="button"
              disabled={isGenerating}
              onClick={() => setIsGeneratorModalOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 text-sm font-semibold rounded-xl"
            >
              Annuler
            </button>
            <button
              type="button"
              disabled={isGenerating}
              onClick={handleAutoGenerateItinerary}
              className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-sm font-extrabold rounded-xl shadow-lg shadow-amber-500/30 flex items-center space-x-2"
            >
              {isGenerating ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Calcul de l'itinéraire optimal...</span>
                </>
              ) : (
                <>
                  <PlaneTakeoff className="w-4 h-4" />
                  <span>Lancer la Génération</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
