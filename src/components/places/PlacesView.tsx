import React, { useState, useEffect, useRef } from 'react';

import { 
  MapPin, 
  Plus, 
  Navigation, 
  Star, 
  Clock, 
  Trash2, 
  LocateFixed, 
  Layers, 
  Utensils, 
  Landmark, 
  Hotel, 
  Trees, 
  Sun, 
  ShoppingBag,
  ExternalLink,
  Search,
  Lock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Pencil,
  Save,
  X
} from 'lucide-react';
import { useTrips } from '../../context/TripContext';
import { useAuth } from '../../context/AuthContext';
import { Place, PlaceCategory, Review } from '../../types';
import { Modal } from '../common/Modal';
import { api } from '../../services/api';
import { db } from '../../db/database';
import { useAppCurrency } from '../../utils/currency';
import { resolveDestinationIntelligence } from '../../services/aiTripPlanner';
import L from 'leaflet';
import confetti from 'canvas-confetti';

export const PlacesView: React.FC = () => {
  const { activeTrip } = useTrips();
  const { currentUser } = useAuth();
  const { currency: userCurrency, format, convert } = useAppCurrency();
  const canManagePlaces = currentUser?.role === 'Admin' || currentUser?.role === 'Organizer';
  const [places, setPlaces] = useState<Place[]>([]);
  const [filteredCategory, setFilteredCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedPlaceForMap, setSelectedPlaceForMap] = useState<Place | null>(null);

  // --- États modal EDIT (Update) ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPlace, setEditingPlace] = useState<Place | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState<PlaceCategory>('Monuments');
  const [editAddress, setEditAddress] = useState('');
  const [editRating, setEditRating] = useState(5);
  const [editDuration, setEditDuration] = useState(90);
  const [editCost, setEditCost] = useState(0);
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Review on visited place control
  const isTripVisited = activeTrip?.status === 'Terminé' || (activeTrip?.endDate ? new Date(activeTrip.endDate) < new Date() : false);
  const [placeForReview, setPlaceForReview] = useState<Place | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [revRating, setRevRating] = useState(5);
  const [revComment, setRevComment] = useState('');
  const [revTags, setRevTags] = useState('Incontournable, À recommander');

  // AI Suggestions supplémentaires
  const [addedSuggestions, setAddedSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState<string[]>([]);
  const cityName = activeTrip?.destination ? activeTrip.destination.split(',')[0].trim() : 'Destination';

  // --- Geocoding de la destination ---
  const geocodeDestination = async (destination: string, country?: string): Promise<[number, number]> => {
    // Construit une requête propre : prend la 2e partie après la virgule si elle existe
    // ex: "Djerba la Douce, Tunisie" → essaie d'abord "Djerba, Tunisie", puis "Tunisie"
    const parts = destination.split(',').map(s => s.trim());
    const rawCity = parts[0];
    const rawCountry = parts[1] || country || '';

    // Nettoie les adjectifs poétiques : garde le 1er mot significatif de la ville
    // ex: "Djerba la Douce" → "Djerba" | "Tokyo & Kyoto" → "Tokyo"
    const cleanCity = rawCity.split(/\s+(?:la|le|les|et|&|the)\s+/i)[0].split('&')[0].trim();

    const queries = [
      cleanCity && rawCountry ? `${cleanCity}, ${rawCountry}` : null,
      rawCountry ? rawCountry : null,
      destination // dernier recours : requête originale
    ].filter(Boolean) as string[];

    for (const query of queries) {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`
        );
        const data = await res.json();
        if (data && data.length > 0) {
          return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        }
      } catch {
        // tentative suivante
      }
    }
    return [48.8566, 2.3522]; // Paris comme fallback neutre
  };

  const [destinationCoords, setDestinationCoords] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (!activeTrip?.destination) return;
    geocodeDestination(activeTrip.destination, activeTrip.country).then(coords => setDestinationCoords(coords));
  }, [activeTrip?.destination, activeTrip?.country]);
  // ------------------------------------

  // =====================================================================
  // VRAIS LIEUX via Nominatim (OpenStreetMap) + Wikimedia Photos
  // =====================================================================

  // Cherche de vrais lieux via Nominatim avec countrycodes pour rester dans le bon pays
  const fetchRealPlaceByType = async (
    amenityType: string,
    city: string,
    country: string
  ): Promise<{ name: string; lat: number; lon: number; address: string } | null> => {

    const COUNTRY_CODES: Record<string, string> = {
      tunisie: 'tn', france: 'fr', japon: 'jp', japan: 'jp', maroc: 'ma', morocco: 'ma',
      espagne: 'es', spain: 'es', italie: 'it', italy: 'it', allemagne: 'de', germany: 'de',
      'royaume-uni': 'gb', uk: 'gb', 'états-unis': 'us', usa: 'us', turquie: 'tr', turkey: 'tr',
      egypte: 'eg', egypt: 'eg', grece: 'gr', greece: 'gr', portugal: 'pt',
      algerie: 'dz', algeria: 'dz', belgique: 'be', belgium: 'be', suisse: 'ch', switzerland: 'ch',
      italia: 'it', rome: 'it',
    };

    const countryCode = COUNTRY_CODES[country.toLowerCase().trim()] || '';
    const countryParam = countryCode ? `&countrycodes=${countryCode}` : '';
    const [centerLat, centerLon] = destinationCoords ?? [0, 0];

    // Stratégie : cherche le type dans la ville, prend le premier résultat valide
    const urls = [
      `https://nominatim.openstreetmap.org/search?amenity=${amenityType}&city=${encodeURIComponent(city)}&format=json&limit=10${countryParam}`,
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(amenityType)}&city=${encodeURIComponent(city)}&format=json&limit=10${countryParam}`,
    ];

    for (const url of urls) {
      try {
        const res = await fetch(url, { headers: { 'Accept-Language': 'fr,en' } });
        const data = await res.json();
        if (!data || data.length === 0) continue;

        // Extrait le nom depuis display_name si name est absent
        const extractName = (d: any): string => {
          if (d.name && d.name.trim().length > 1) return d.name.trim();
          // Nominatim met souvent le nom comme premier segment de display_name
          const first = d.display_name?.split(',')[0]?.trim();
          if (first && first.length > 1 && !first.match(/^\d/)) return first;
          return '';
        };

        // Filtre : doit avoir un nom ET être proche de la destination
        const valid = data.filter((d: any) => {
          const name = extractName(d);
          if (!name) return false;
          if (centerLat && centerLon) {
            const dLat = Math.abs(parseFloat(d.lat) - centerLat);
            const dLon = Math.abs(parseFloat(d.lon) - centerLon);
            if (dLat > 1.5 || dLon > 1.5) return false;
          }
          return true;
        });

        if (valid.length > 0) {
          const pick = valid[Math.floor(Math.random() * Math.min(valid.length, 5))];
          const name = extractName(pick);
          const address = pick.display_name?.split(',').slice(0, 3).join(', ') || `${city}, ${country}`;
          return { name, lat: parseFloat(pick.lat), lon: parseFloat(pick.lon), address };
        }
      } catch {
        continue;
      }
    }
    return null;
  };

  // Cherche une vraie photo sur Wikimedia Commons par nom de lieu + ville
  const fetchWikimediaPhoto = async (placeName: string, city: string, category: string): Promise<string> => {
    // Photos de fallback de qualité par catégorie
    const fallbacks: Record<string, string> = {
      Restaurant: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80',
      Nature: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&auto=format&fit=crop&q=80',
      Monuments: 'https://images.unsplash.com/photo-1568797629192-789acf8e4df3?w=600&auto=format&fit=crop&q=80',
    };

    try {
      const searchTerm = `${placeName} ${city}`;
      const wikiRes = await fetch(
        `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(searchTerm)}&prop=pageimages&format=json&pithumbsize=600&origin=*`
      );
      const wikiData = await wikiRes.json();
      const pages = wikiData?.query?.pages;
      if (pages) {
        const page = Object.values(pages)[0] as { thumbnail?: { source: string } };
        if (page?.thumbnail?.source) {
          const src = page.thumbnail.source;
          // Rejette les images qui sont des cartes géographiques ou drapeaux (trop petites ou SVG)
          if (!src.includes('.svg') && !src.includes('Flag') && !src.includes('map') && !src.includes('Map')) {
            return src;
          }
        }
      }
    } catch { /* silencieux */ }

    try {
      const commonsRes = await fetch(
        `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(placeName + ' ' + city)}&srnamespace=6&format=json&origin=*&srlimit=3`
      );
      const commonsData = await commonsRes.json();
      const results = commonsData?.query?.search;
      if (results?.length > 0) {
        // Essaie les 3 premiers résultats pour éviter cartes/logos
        for (const result of results) {
          const fileName = result.title.replace('File:', '');
          // Filtre les noms de fichiers qui semblent être des cartes
          if (fileName.toLowerCase().includes('map') || fileName.toLowerCase().includes('flag') ||
              fileName.toLowerCase().includes('logo') || fileName.endsWith('.svg')) continue;

          const imgRes = await fetch(
            `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(fileName)}&prop=imageinfo&iiprop=url|mime&format=json&origin=*`
          );
          const imgData = await imgRes.json();
          const imgPages = imgData?.query?.pages;
          if (imgPages) {
            const imgPage = Object.values(imgPages)[0] as { imageinfo?: { url: string; mime: string }[] };
            const info = imgPage?.imageinfo?.[0];
            // Accepte seulement les vraies photos (jpeg/png, pas svg)
            if (info?.url && info.mime?.startsWith('image/') && !info.mime.includes('svg')) {
              return info.url;
            }
          }
        }
      }
    } catch { /* silencieux */ }

    return fallbacks[category] || fallbacks['Monuments'];
  };

  // Configuration complète des catégories disponibles pour les suggestions
  const SUGGESTION_CATEGORIES = [
    { type: 'restaurant', label: 'Restaurant' as PlaceCategory, icon: '🍽️', cost: 20, duration: 90,
      desc: (city: string) => `Savourez la cuisine locale authentique de ${city}.` },
    { type: 'park', label: 'Nature' as PlaceCategory, icon: '🌿', cost: 0, duration: 75,
      desc: (city: string) => `Espace naturel et verdoyant au cœur de ${city}.` },
    { type: 'museum', label: 'Monuments' as PlaceCategory, icon: '🏛️', cost: 12, duration: 100,
      desc: (city: string) => `Découvrez le patrimoine historique de ${city}.` },
    { type: 'hotel', label: 'Hébergement' as PlaceCategory, icon: '🏨', cost: 80, duration: 1440,
      desc: (city: string) => `Hébergement confortable pour votre séjour à ${city}.` },
    { type: 'beach', label: 'Plage' as PlaceCategory, icon: '🏖️', cost: 0, duration: 180,
      desc: (city: string) => `Profitez des plages magnifiques de ${city}.` },
    { type: 'attraction', label: 'Monuments' as PlaceCategory, icon: '🎯', cost: 15, duration: 120,
      desc: (city: string) => `Attraction incontournable à visiter à ${city}.` },
  ];

  // Catégorie sélectionnée par l'utilisateur pour les suggestions
  const [selectedSuggestionCategory, setSelectedSuggestionCategory] = useState<typeof SUGGESTION_CATEGORIES[0] | null>(null);

  // État des suggestions chargées dynamiquement
  const [realSuggestions, setRealSuggestions] = useState<{
    idKey: string;
    name: string;
    category: PlaceCategory;
    desc: string;
    cost: number;
    duration: number;
    rating: number;
    lat: number;
    lon: number;
    address: string;
    imageUrl: string;
  }[]>([]);
  const [loadingRealSuggestions, setLoadingRealSuggestions] = useState(false);

  // Charge 3 vrais lieux quand l'utilisateur sélectionne une catégorie
  const handleSelectSuggestionCategory = async (cat: typeof SUGGESTION_CATEGORIES[0]) => {
    if (!destinationCoords || !activeTrip) return;
    setSelectedSuggestionCategory(cat);
    setLoadingRealSuggestions(true);
    setRealSuggestions([]);

    const cleanCity = cityName.split(/\s+(?:la|le|les|et|&|the)\s+/i)[0].split('&')[0].trim();
    const country = activeTrip.country || '';
    const [centerLat, centerLon] = destinationCoords;

    // Cherche 3 lieux différents du même type (en variant le rayon et l'offset)
    const results = await Promise.all([0, 1, 2].map(async (i) => {
      try {
        const countryCode = ({
          tunisie:'tn', france:'fr', japon:'jp', japan:'jp', maroc:'ma', morocco:'ma',
          espagne:'es', spain:'es', italie:'it', italy:'it', allemagne:'de', germany:'de',
          'royaume-uni':'gb', uk:'gb', 'états-unis':'us', usa:'us', turquie:'tr', turkey:'tr',
          egypte:'eg', egypt:'eg', grece:'gr', greece:'gr', portugal:'pt',
          algerie:'dz', algeria:'dz', belgique:'be', belgium:'be', suisse:'ch', switzerland:'ch',
        } as Record<string,string>)[country.toLowerCase().trim()] || '';
        const countryParam = countryCode ? `&countrycodes=${countryCode}` : '';

        // Chaque itération utilise une limite différente pour obtenir des résultats variés
        const url = `https://nominatim.openstreetmap.org/search?amenity=${cat.type}&city=${encodeURIComponent(cleanCity)}&format=json&limit=${10 + i * 5}${countryParam}`;
        const res = await fetch(url, { headers: { 'Accept-Language': 'fr,en' } });
        const data = await res.json();
        if (!data || data.length === 0) return null;

        const extractName = (d: any): string => {
          if (d.name?.trim().length > 1) return d.name.trim();
          const first = d.display_name?.split(',')[0]?.trim();
          return (first && first.length > 1 && !first.match(/^\d/)) ? first : '';
        };

        const valid = data.filter((d: any) => {
          const name = extractName(d);
          if (!name) return false;
          const dLat = Math.abs(parseFloat(d.lat) - centerLat);
          const dLon = Math.abs(parseFloat(d.lon) - centerLon);
          return dLat <= 1.5 && dLon <= 1.5;
        });

        if (valid.length === 0) return null;

        // Prend un résultat différent selon l'index pour la variété
        const pick = valid[Math.min(i * 2, valid.length - 1)];
        const name = extractName(pick);
        const address = pick.display_name?.split(',').slice(0, 3).join(', ') || `${cleanCity}, ${country}`;
        const imageUrl = await fetchWikimediaPhoto(name, cleanCity, cat.label);

        return {
          idKey: `sug-cat-${cat.type}-${i}-${Date.now()}`,
          name: name || `${cat.label} — ${cleanCity}`,
          category: cat.label,
          desc: cat.desc(cleanCity),
          cost: cat.cost,
          duration: cat.duration,
          rating: parseFloat((4.2 + Math.random() * 0.7).toFixed(1)),
          lat: parseFloat(pick.lat),
          lon: parseFloat(pick.lon),
          address: address || `${cleanCity}, ${country}`,
          imageUrl,
        };
      } catch {
        return null;
      }
    }));

    // Dédupliquer les suggestions pour éviter tout lieu redondant
    const uniqueSugs: typeof realSuggestions = [];
    const seenSugKeys = new Set<string>();
    for (const r of results) {
      if (!r || !r.name || r.name.length < 2) continue;
      const k = r.name.toLowerCase().trim();
      if (!seenSugKeys.has(k) && !places.some(p => p.name.toLowerCase().trim() === k)) {
        seenSugKeys.add(k);
        uniqueSugs.push(r);
      }
    }
    setRealSuggestions(uniqueSugs);
    setLoadingRealSuggestions(false);
  };

  // Ajoute un vrai lieu sur la carte — vérifie d'abord qu'il n'existe pas déjà
  const handleAddRealSuggestion = async (sug: typeof realSuggestions[0]) => {
    if (!activeTrip) return;

    // Empêche la duplication : vérifie si un lieu avec ce nom existe déjà
    const alreadyExists = places.some(p =>
      p.name.toLowerCase().trim() === sug.name.toLowerCase().trim()
    );
    if (alreadyExists) {
      setAddedSuggestions(prev => [...prev, sug.idKey]);
      return;
    }

    setLoadingSuggestions(prev => [...prev, sug.idKey]);

    const newPlace: Place = {
      id: `plc-real-${Date.now()}`,
      tripId: activeTrip.id,
      name: sug.name,
      category: sug.category,
      address: sug.address,
      latitude: sug.lat,
      longitude: sug.lon,
      rating: sug.rating,
      estimatedDurationMinutes: sug.duration,
      costEstimate: sug.cost,
      imageUrl: sug.imageUrl,
      notes: `Lieu réel trouvé sur OpenStreetMap pour votre séjour à ${cityName}.`,
      createdAt: new Date().toISOString(),
    };

    await api.places.create(newPlace);
    setPlaces(prev => [...prev, newPlace]);
    setAddedSuggestions(prev => [...prev, sug.idKey]);
    setLoadingSuggestions(prev => prev.filter(k => k !== sug.idKey));
    confetti({ particleCount: 60, spread: 50 });

    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([newPlace.latitude, newPlace.longitude], 15, { duration: 1.2 });
    }
  };
  // =====================================================================

  const handleOpenReview = (place: Place) => {
    if (!isTripVisited) {
      alert("Contrôle de conformité : Vous ne pouvez donner votre avis que sur un lieu effectivement visité lors d'un séjour terminé.");
      return;
    }
    setPlaceForReview(place);
    setIsReviewModalOpen(true);
  };

  const handleSubmitPlaceReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!placeForReview || !activeTrip) return;

    const newRev: Review = {
      id: 'rev-' + Date.now(),
      tripId: activeTrip.id,
      tripTitle: activeTrip.title,
      tripDestination: activeTrip.destination,
      placeId: placeForReview.id,
      placeName: placeForReview.name,
      userId: currentUser?.id || 'usr-default',
      userName: currentUser?.name || 'Voyageur',
      rating: Number(revRating),
      comment: revComment,
      tags: revTags.split(',').map(t => t.trim()).filter(Boolean),
      date: new Date().toISOString().split('T')[0],
      verifiedVisit: true
    };

    await api.memories.createReview(newRev);
    alert(`Merci ! Votre avis certifié sur « ${placeForReview.name} » a été enregistré.`);
    setIsReviewModalOpen(false);
    setRevComment('');
    setPlaceForReview(null);
  };

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState<PlaceCategory>('Monuments');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState(0);
  const [longitude, setLongitude] = useState(0);

  // Pré-remplit les coords du formulaire avec la destination géocodée
  useEffect(() => {
    if (destinationCoords) {
      setLatitude(destinationCoords[0]);
      setLongitude(destinationCoords[1]);
    }
  }, [destinationCoords]);
  const [rating, setRating] = useState(5);
  const [duration, setDuration] = useState(90);
  const [cost, setCost] = useState(10);
  const [imageUrl, setImageUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [locationSearch, setLocationSearch] = useState('');
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [locationSearchStatus, setLocationSearchStatus] = useState<string | null>(null);

  const handleSearchLocation = async () => {
    const query = locationSearch || name || address;
    if (!query.trim()) return;
    setIsSearchingLocation(true);
    setLocationSearchStatus(null);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`);
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        setLatitude(lat);
        setLongitude(lon);
        if (!address) setAddress(data[0].display_name);
        setLocationSearchStatus(`✓ Localisé : ${data[0].display_name.split(',').slice(0, 3).join(', ')}`);
      } else {
        setLocationSearchStatus('Lieu introuvable. Essayez avec un nom plus précis ou avec la ville.');
      }
    } catch {
      setLocationSearchStatus('Erreur de géocodage réseau. Vous pouvez vérifier votre connexion.');
    } finally {
      setIsSearchingLocation(false);
    }
  };

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  const loadPlaces = async () => {
    if (!activeTrip) return;
    const items = await api.places.getByTrip(activeTrip.id);
    setPlaces(items);
  };

  useEffect(() => {
    loadPlaces();
  }, [activeTrip?.id]);

  // Haversine formula to compute distance in km
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
  };

  // Advanced feature: HTML5 Geolocation
  const handleLocateUser = () => {
    if (!navigator.geolocation) {
      alert('La géolocalisation n’est pas prise en charge par votre navigateur.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(coords);
        setIsLocating(false);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([coords.lat, coords.lng], 13);
          L.circleMarker([coords.lat, coords.lng], {
            radius: 8,
            color: '#38bdf8',
            fillColor: '#0ea5e9',
            fillOpacity: 0.9
          })
            .addTo(mapInstanceRef.current)
            .bindPopup('<b>📍 Vous êtes ici</b><br>Position en direct')
            .openPopup();
        }
      },
      err => {
        console.warn('Geolocation error:', err.message);
        setIsLocating(false);
        // Ne pas forcer une position si l'utilisateur refuse la géolocalisation
      },
      { timeout: 8000 }
    );
  };

  // Re-centrer la carte sur la destination quand les coords arrivent et qu'il n'y a pas de lieux
  useEffect(() => {
    if (!destinationCoords || !mapInstanceRef.current || places.length > 0) return;
    mapInstanceRef.current.flyTo(destinationCoords, 12, { duration: 1.5 });
  }, [destinationCoords]);

  // Initialize and update Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Priorité : 1er lieu existant → coordonnées geocodées de la destination → Paris
      const defaultCenter: [number, number] = places.length > 0
        ? [places[0].latitude, places[0].longitude]
        : destinationCoords ?? [48.8566, 2.3522];

      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: 12,
        zoomControl: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map);

      markersRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    // Refresh markers & polyline
    if (markersRef.current && mapInstanceRef.current) {
      markersRef.current.clearLayers();

      const displayed = places.filter(p => {
        const matchCat = filteredCategory === 'all' || p.category === filteredCategory;
        const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchCat && matchSearch;
      });

      const latLngs: [number, number][] = [];

      displayed.forEach(p => {
        latLngs.push([p.latitude, p.longitude]);

        // Custom HTML marker for clean UX
        const markerHtml = `
          <div style="background-color: #0284c7; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; border: 2px solid white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.4); font-size: 14px;">
            📍
          </div>
        `;
        const customIcon = L.divIcon({
          html: markerHtml,
          className: 'custom-leaflet-marker',
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        });

        const marker = L.marker([p.latitude, p.longitude], { icon: customIcon });
        const costStr = p.costEstimate > 0 
          ? format(convert(p.costEstimate, activeTrip?.currency || 'EUR'), userCurrency)
          : 'Gratuit';
        marker.bindPopup(`
          <div style="padding: 2px; min-width: 170px;">
            <img src="${p.imageUrl}" style="width: 100%; height: 90px; object-fit: cover; border-radius: 6px; margin-bottom: 6px;" />
            <strong style="color: #38bdf8; font-size: 13px;">${p.name}</strong><br>
            <span style="font-size: 11px; color: #94a3b8;">${p.category} • ⭐ ${p.rating}/5</span><br>
            <span style="font-size: 11px; color: #cbd5e1;">⏱️ ${p.estimatedDurationMinutes} min • ~${costStr}</span>
          </div>
        `);
        markersRef.current?.addLayer(marker);
      });

      // Tracé d'itinéraire polyline reliant les étapes dans l'ordre
      if (latLngs.length > 1) {
        const polyline = L.polyline(latLngs, {
          color: '#38bdf8',
          weight: 4,
          opacity: 0.8,
          dashArray: '8, 8'
        });
        markersRef.current.addLayer(polyline);
        mapInstanceRef.current.fitBounds(polyline.getBounds(), { padding: [40, 40] });
      } else if (latLngs.length === 1) {
        mapInstanceRef.current.setView(latLngs[0], 13);
      } else if (destinationCoords) {
        // Aucun lieu encore : centrer sur la destination géocodée
        mapInstanceRef.current.setView(destinationCoords, 12);
      }
    }
  }, [places, filteredCategory, searchQuery, destinationCoords]);

  // Center on specific place when card is clicked
  const handleFocusPlaceOnMap = (place: Place) => {
    setSelectedPlaceForMap(place);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([place.latitude, place.longitude], 15, { duration: 1 });
    }
  };

  const handleCreatePlace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTrip) return;

    await api.places.create({
      tripId: activeTrip.id,
      name,
      category,
      address,
      latitude: Number(latitude),
      longitude: Number(longitude),
      rating: Number(rating),
      estimatedDurationMinutes: Number(duration),
      costEstimate: Number(cost),
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80',
      notes
    });
    await loadPlaces();
    setIsAddModalOpen(false);
    setName('');
    setAddress('');
    setNotes('');
  };

  const handleDeletePlace = async (id: string) => {
    if (confirm('Supprimer ce lieu du voyage ?')) {
      await api.places.delete(id);
      setPlaces(prev => prev.filter(p => p.id !== id));
    }
  };

  // --- EDIT handlers (UPDATE) ---
  const handleOpenEdit = (place: Place) => {
    setEditingPlace(place);
    setEditName(place.name);
    setEditCategory(place.category);
    setEditAddress(place.address);
    setEditRating(place.rating);
    setEditDuration(place.estimatedDurationMinutes);
    setEditCost(place.costEstimate);
    setEditImageUrl(place.imageUrl || '');
    setEditNotes(place.notes || '');
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlace) return;
    setIsSavingEdit(true);

    const updates: Partial<Place> = {
      name: editName,
      category: editCategory,
      address: editAddress,
      rating: Number(editRating),
      estimatedDurationMinutes: Number(editDuration),
      costEstimate: Number(editCost),
      imageUrl: editImageUrl,
      notes: editNotes,
    };

    await api.places.update(editingPlace.id, updates);
    setPlaces(prev => prev.map(p =>
      p.id === editingPlace.id ? { ...p, ...updates } : p
    ));
    setIsSavingEdit(false);
    setIsEditModalOpen(false);
    setEditingPlace(null);
  };

  const categories: PlaceCategory[] = ['Monuments', 'Restaurant', 'Hébergement', 'Nature', 'Plage', 'Shopping', 'Autre'];

  const getCategoryIcon = (cat: PlaceCategory) => {
    switch (cat) {
      case 'Restaurant': return Utensils;
      case 'Monuments': return Landmark;
      case 'Hébergement': return Hotel;
      case 'Nature': return Trees;
      case 'Plage': return Sun;
      case 'Shopping': return ShoppingBag;
      default: return MapPin;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Member Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/20">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-white">Destinations & Lieux</h2>
            </div>
            <p className="text-sm text-slate-400 mt-0.5">
              Carte interactive, géolocalisation temps réel et calcul de proximité.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <button
            onClick={handleLocateUser}
            disabled={isLocating}
            className="flex items-center space-x-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-semibold rounded-xl border border-sky-500/30 transition-all"
            title="Activer la géolocalisation"
          >
            <LocateFixed className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
            <span>{isLocating ? 'Recherche GPS...' : 'Me Localiser'}</span>
          </button>

          {canManagePlaces ? (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center space-x-2 px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-sky-600/25 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter un Lieu</span>
            </button>
          ) : (
            <div className="flex items-center space-x-2 px-3 py-2 bg-slate-800/80 rounded-xl border border-slate-700 text-xs text-slate-300">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
              <span>Mode Voyageur (Exploration)</span>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Map Container */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-xl">
        <div className="absolute top-4 left-4 z-20 flex flex-wrap gap-2 max-w-[80%]">
          <div className="bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-700/80 shadow-lg flex items-center space-x-1">
            <button
              onClick={() => setFilteredCategory('all')}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                filteredCategory === 'all'
                  ? 'bg-sky-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Tous ({places.length})
            </button>
            {categories.slice(0, 4).map(c => (
              <button
                key={c}
                onClick={() => setFilteredCategory(c)}
                className={`px-2 py-1 text-xs rounded-lg transition-colors ${
                  filteredCategory === c
                    ? 'bg-sky-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Map DOM Element */}
        <div ref={mapContainerRef} className="h-80 sm:h-96 w-full z-10" />

        {/* Proximity calculation note */}
        {userLocation && (
          <div className="absolute bottom-4 left-4 z-20 bg-slate-900/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-sky-500/40 text-xs text-sky-300 flex items-center space-x-2 shadow-lg">
            <Navigation className="w-3.5 h-3.5 animate-pulse" />
            <span>Position GPS active : Distances calculées en temps réel.</span>
          </div>
        )}
      </div>

      {/* Suggestions Lieux Réels via OpenStreetMap */}
      {activeTrip && (
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-amber-500/30 space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
              <h3 className="text-sm sm:text-base font-bold text-white">
                ✨ Lieux réels à découvrir à {cityName}
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
              Données OpenStreetMap
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Sélectionnez une catégorie pour découvrir 3 vrais établissements près de votre destination.
          </p>

          {/* Boutons de sélection de catégorie */}
          <div className="flex flex-wrap gap-2 pt-1">
            {SUGGESTION_CATEGORIES.map(cat => (
              <button
                key={cat.type}
                onClick={() => handleSelectSuggestionCategory(cat)}
                disabled={loadingRealSuggestions}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  selectedSuggestionCategory?.type === cat.type
                    ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-amber-500/50 hover:text-amber-300'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* État de chargement */}
          {loadingRealSuggestions && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-slate-800 border border-slate-700 rounded-xl p-3 space-y-2 animate-pulse">
                  <div className="h-24 bg-slate-700 rounded-lg w-full" />
                  <div className="h-3 bg-slate-700 rounded w-1/3" />
                  <div className="h-4 bg-slate-700 rounded w-3/4" />
                  <div className="h-3 bg-slate-700 rounded w-full" />
                  <div className="h-7 bg-slate-700 rounded-lg mt-2" />
                </div>
              ))}
            </div>
          )}

          {/* Aucun résultat */}
          {!loadingRealSuggestions && selectedSuggestionCategory && realSuggestions.length === 0 && (
            <div className="text-center py-4 text-slate-400 text-xs">
              <AlertCircle className="w-5 h-5 mx-auto mb-1 text-amber-500/60" />
              Aucun {selectedSuggestionCategory.label.toLowerCase()} trouvé à proximité. Essayez une autre catégorie.
            </div>
          )}

          {/* Message initial — aucune catégorie sélectionnée */}
          {!loadingRealSuggestions && !selectedSuggestionCategory && (
            <div className="text-center py-4 text-slate-500 text-xs">
              <Sparkles className="w-5 h-5 mx-auto mb-1 text-amber-500/40" />
              Choisissez une catégorie ci-dessus pour voir des suggestions réelles.
            </div>
          )}

          {/* Grille des vrais lieux */}
          {!loadingRealSuggestions && realSuggestions.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              {realSuggestions.map(sug => {
                const isAdded = addedSuggestions.includes(sug.idKey) || places.some(p => p.name === sug.name);
                const isLoading = loadingSuggestions.includes(sug.idKey);
                return (
                  <div key={sug.idKey} className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden flex flex-col hover:border-amber-500/40 transition-colors">
                    {/* Photo réelle du lieu */}
                    <div className="relative h-28 w-full bg-slate-800">
                      <img
                        src={sug.imageUrl}
                        alt={sug.name}
                        className="w-full h-full object-cover"
                        onError={e => {
                          // Si la photo échoue, fallback par catégorie
                          const fallbacks: Record<string, string> = {
                            Restaurant: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80',
                            Nature: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&auto=format&fit=crop&q=80',
                            Monuments: 'https://images.unsplash.com/photo-1539785695328-4d7bbfc52568?w=600&auto=format&fit=crop&q=80',
                          };
                          (e.target as HTMLImageElement).src = fallbacks[sug.category] || fallbacks['Monuments'];
                        }}
                      />
                      <div className="absolute top-2 left-2 bg-slate-950/80 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] text-amber-300 font-semibold border border-amber-500/30">
                        {sug.category || 'Lieu'}
                      </div>
                      <div className="absolute top-2 right-2 bg-amber-500 text-slate-950 px-2 py-0.5 rounded-md text-[10px] font-bold">
                        ⭐ {sug.rating}
                      </div>
                    </div>

                    <div className="p-3 flex flex-col flex-1 justify-between space-y-2 bg-slate-900">
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-white leading-tight line-clamp-2">
                          {sug.name || '—'}
                        </h4>
                        <p className="text-[10px] text-slate-400 truncate">
                          📍 {sug.address || `${cityName}`}
                        </p>
                        <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">
                          {sug.desc || `Découvrez ce lieu à ${cityName}.`}
                        </p>
                        <div className="flex items-center space-x-2 text-[10px] text-slate-400 pt-1">
                          <span>⏱ {sug.duration} min</span>
                          <span>•</span>
                          <span className="text-amber-400 font-semibold">{sug.cost > 0 ? `~${sug.cost} €` : 'Gratuit'}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleAddRealSuggestion(sug)}
                        disabled={isAdded || isLoading}
                        className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
                          isAdded
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                            : isLoading
                            ? 'bg-slate-700 text-slate-400 cursor-wait border border-slate-600'
                            : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Ajouté sur la carte</span>
                          </>
                        ) : isLoading ? (
                          <>
                            <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                            </svg>
                            <span>Ajout en cours...</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>+ Ajouter à la carte</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Places Cards Grid */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <span>Points d'intérêt du voyage</span>
            <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
              {places.length} lieux
            </span>
          </h3>

          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Rechercher un lieu par nom..."
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 w-full sm:w-64"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {places
            .filter(p => {
              const matchCat = filteredCategory === 'all' || p.category === filteredCategory;
              const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
              return matchCat && matchSearch;
            })
            .map(place => {
              const Icon = getCategoryIcon(place.category);
              const distanceKm = userLocation
                ? calculateDistance(userLocation.lat, userLocation.lng, place.latitude, place.longitude)
                : null;

              return (
                <div
                  key={place.id}
                  onClick={() => handleFocusPlaceOnMap(place)}
                  className={`group p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    selectedPlaceForMap?.id === place.id
                      ? 'bg-slate-800/90 border-sky-500 ring-1 ring-sky-500'
                      : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                  }`}
                >
                  <div className="relative h-32 w-full rounded-xl overflow-hidden mb-3 bg-slate-950">
                    <img
                      src={place.imageUrl}
                      alt={place.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2 bg-slate-950/80 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] text-sky-300 font-semibold flex items-center space-x-1 border border-sky-500/30">
                      <Icon className="w-3 h-3" />
                      <span>{place.category}</span>
                    </div>

                    <div className="absolute top-2 right-2 bg-amber-500 text-slate-950 px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center space-x-0.5 shadow">
                      <Star className="w-2.5 h-2.5 fill-current" />
                      <span>{place.rating}</span>
                    </div>

                    {distanceKm && (
                      <div className="absolute bottom-2 left-2 bg-emerald-950/80 backdrop-blur-md text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded text-[10px] font-semibold flex items-center space-x-1">
                        <Navigation className="w-2.5 h-2.5" />
                        <span>À {distanceKm} km</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="text-sm font-bold text-white group-hover:text-sky-400 transition-colors truncate">
                      {place.name}
                    </h4>
                    <p className="text-xs text-slate-400 truncate">{place.address}</p>

                    <div className="flex items-center justify-between text-xs text-slate-300 pt-2 border-t border-slate-800">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{place.estimatedDurationMinutes} min</span>
                      </div>
                      <span className="font-semibold text-amber-400">
                        {place.costEstimate > 0 
                          ? `~${format(convert(place.costEstimate, activeTrip?.currency || 'EUR'), userCurrency)}` 
                          : 'Gratuit'}
                      </span>
                    </div>

                    {place.notes && (
                      <p className="text-[11px] text-slate-400 italic line-clamp-1 pt-1">
                        « {place.notes} »
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            // 1. Scroll vers la carte
                            mapContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            // 2. Zoom sur le lieu avec flyTo
                            setTimeout(() => {
                              mapInstanceRef.current?.flyTo([place.latitude, place.longitude], 16, { duration: 1.2 });
                              setSelectedPlaceForMap(place);
                            }, 400);
                          }}
                          className="text-[10px] text-sky-400 hover:text-sky-300 hover:underline flex items-center space-x-0.5 transition-colors"
                          title="Voir sur la carte"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Voir sur carte</span>
                        </button>

                        {/* Contrôle avis sur lieu visité uniquement */}
                        {isTripVisited ? (
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              handleOpenReview(place);
                            }}
                            className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-[10px] font-bold flex items-center space-x-1 border border-amber-500/40 transition-colors"
                            title="Ce lieu a été visité lors d'un séjour terminé : vous pouvez déposer un avis"
                          >
                            <Star className="w-2.5 h-2.5 fill-current text-amber-400" />
                            <span>Donner mon avis</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              handleOpenReview(place);
                            }}
                            className="px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-400 hover:text-slate-300 text-[10px] flex items-center space-x-1 border border-slate-700/80"
                            title="Avis verrouillé : vous ne pouvez donner votre avis que dans un lieu visité (séjour terminé)"
                          >
                            <Lock className="w-2.5 h-2.5 text-amber-500/80" />
                            <span>Avis (verrouillé)</span>
                          </button>
                        )}
                      </div>

                      {canManagePlaces && (
                        <div className="flex items-center space-x-1">
                          {/* Bouton EDIT */}
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              handleOpenEdit(place);
                            }}
                            className="text-slate-500 hover:text-sky-400 p-1 transition-colors"
                            title="Modifier ce lieu"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          {/* Bouton DELETE */}
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              handleDeletePlace(place.id);
                            }}
                            className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                            title="Supprimer ce lieu"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Modal: EDIT Place (UPDATE) */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); setEditingPlace(null); }}
        title={`✏️ Modifier — ${editingPlace?.name || 'Lieu'}`}
        subtitle="Modifiez les informations de ce lieu"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Nom du lieu</label>
              <input
                value={editName}
                onChange={e => setEditName(e.target.value)}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Catégorie</label>
              <select
                value={editCategory}
                onChange={e => setEditCategory(e.target.value as PlaceCategory)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
              >
                {(['Monuments','Restaurant','Hébergement','Nature','Plage','Shopping','Autre'] as PlaceCategory[]).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Adresse</label>
            <input
              value={editAddress}
              onChange={e => setEditAddress(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Note ⭐</label>
              <input
                type="number" min="1" max="5" step="0.1"
                value={editRating}
                onChange={e => setEditRating(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Durée (min)</label>
              <input
                type="number" min="0"
                value={editDuration}
                onChange={e => setEditDuration(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Coût (€)</label>
              <input
                type="number" min="0"
                value={editCost}
                onChange={e => setEditCost(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">URL Image</label>
            <input
              value={editImageUrl}
              onChange={e => setEditImageUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Notes</label>
            <textarea
              value={editNotes}
              onChange={e => setEditNotes(e.target.value)}
              rows={2}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500 resize-none"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => { setIsEditModalOpen(false); setEditingPlace(null); }}
              className="flex items-center space-x-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-xl"
            >
              <X className="w-4 h-4" />
              <span>Annuler</span>
            </button>
            <button
              type="submit"
              disabled={isSavingEdit}
              className="flex items-center space-x-1 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-sky-600/25 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSavingEdit ? 'Enregistrement...' : 'Enregistrer'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add Place */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Ajouter une Destination ou un Lieu"
        subtitle="Recherchez un point d'intérêt par son nom pour le positionner sur la carte"
      >
        <form onSubmit={handleCreatePlace} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Nom du lieu</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => {
                setName(e.target.value);
                if (!locationSearch) setLocationSearch(e.target.value);
              }}
              placeholder="ex: Musée du Louvre ou Café de Flore"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Place Search on Map */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
            <label className="block text-xs font-semibold text-sky-300">
              Localiser sur la carte (recherche par nom ou adresse)
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={locationSearch}
                onChange={e => setLocationSearch(e.target.value)}
                placeholder="ex: Tour Eiffel, Paris ou Shibuya Crossing, Tokyo"
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
              />
              <button
                type="button"
                onClick={handleSearchLocation}
                disabled={isSearchingLocation}
                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 flex-shrink-0 disabled:opacity-50"
              >
                <Search className={`w-3.5 h-3.5 ${isSearchingLocation ? 'animate-spin' : ''}`} />
                <span>{isSearchingLocation ? 'Recherche...' : 'Localiser'}</span>
              </button>
            </div>
            {locationSearchStatus && (
              <p className={`text-[11px] font-medium ${locationSearchStatus.startsWith('✓') ? 'text-emerald-400' : 'text-amber-400'}`}>
                {locationSearchStatus}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Catégorie</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as PlaceCategory)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Note (1 à 5)</label>
              <input
                type="number"
                min="1"
                max="5"
                step="0.1"
                value={rating}
                onChange={e => setRating(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Adresse ou Ville</label>
            <input
              type="text"
              required
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="Quartier, Rue, Ville"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Coordonnées GPS déterminées automatiquement */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Latitude (automatique)</label>
              <input
                type="number"
                step="0.0001"
                readOnly
                value={latitude}
                className="w-full bg-slate-850 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 cursor-not-allowed opacity-80"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Longitude (automatique)</label>
              <input
                type="number"
                step="0.0001"
                readOnly
                value={longitude}
                className="w-full bg-slate-850 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 cursor-not-allowed opacity-80"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Durée estimée (minutes)</label>
              <input
                type="number"
                min="15"
                step="15"
                value={duration}
                onChange={e => setDuration(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Coût estimé (€)</label>
              <input
                type="number"
                min="0"
                value={cost}
                onChange={e => setCost(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">URL Photo</label>
            <input
              type="url"
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Notes & Conseils</label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Horaires d'ouverture, réservation conseillée..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
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
              className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-sky-600/30"
            >
              Ajouter le Lieu
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Donner un avis certifié sur ce lieu visité */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        title={`Donner un Avis Vérifié — ${placeForReview?.name || 'Lieu'}`}
        subtitle="Contrôle de conformité : séjour terminé validé dans votre historique"
      >
        <form onSubmit={handleSubmitPlaceReview} className="space-y-4">
          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
            <span>Ce lieu fait partie de votre séjour <strong>{activeTrip?.title}</strong>, dont les dates sont passées / terminées.</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Note globale ({revRating}/5 étoiles)</label>
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map(st => (
                <button
                  type="button"
                  key={st}
                  onClick={() => setRevRating(st)}
                  className={`p-2 rounded-xl transition-all ${
                    st <= revRating
                      ? 'text-amber-400 bg-amber-500/20'
                      : 'text-slate-600 bg-slate-800'
                  }`}
                >
                  <Star className="w-6 h-6 fill-current" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Commentaire d'expérience vécue</label>
            <textarea
              rows={3}
              required
              value={revComment}
              onChange={e => setRevComment(e.target.value)}
              placeholder="Ressenti sur place, accueil, propreté, accessibilité..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Tags (séparés par des virgules)</label>
            <input
              type="text"
              value={revTags}
              onChange={e => setRevTags(e.target.value)}
              placeholder="Incontournable, Famille, Panoramique..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="pt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsReviewModalOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 text-sm font-semibold rounded-xl"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-extrabold rounded-xl shadow-lg shadow-amber-500/30"
            >
              Publier l'Avis Certifié
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
