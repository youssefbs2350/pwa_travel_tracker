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
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useTrips } from '../../context/TripContext';
import { useAuth } from '../../context/AuthContext';
import { Place, PlaceCategory, Review } from '../../types';
import { Modal } from '../common/Modal';
import { api } from '../../services/api';
import { db } from '../../db/database';
import { useAppCurrency } from '../../utils/currency';
import L from 'leaflet';

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

  // Review on visited place control
  const isTripVisited = activeTrip?.status === 'Terminé' || (activeTrip?.endDate ? new Date(activeTrip.endDate) < new Date() : false);
  const [placeForReview, setPlaceForReview] = useState<Place | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [revRating, setRevRating] = useState(5);
  const [revComment, setRevComment] = useState('');
  const [revTags, setRevTags] = useState('Incontournable, À recommander');

  // AI Suggestions supplémentaires
  const [addedSuggestions, setAddedSuggestions] = useState<string[]>([]);
  const cityName = activeTrip?.destination ? activeTrip.destination.split(',')[0].trim() : 'Destination';

  const placeSuggestions = [
    {
      idKey: 'sug-p-1',
      name: `Rooftop Panoramique & Bar Tapas (${cityName})`,
      category: 'Restaurant' as const,
      desc: `Vue imprenable à 360° et dégustation de produits du terroir.`,
      cost: 20,
      duration: 90,
      rating: 4.9,
      imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=80',
      latOffset: 0.007,
      lonOffset: 0.006
    },
    {
      idKey: 'sug-p-2',
      name: `Belvédère Secret & Parc Botanique (${cityName})`,
      category: 'Nature' as const,
      desc: `Havre de paix verdoyant et coucher de soleil idyllique hors des foules.`,
      cost: 0,
      duration: 75,
      rating: 4.8,
      imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80',
      latOffset: -0.009,
      lonOffset: -0.008
    },
    {
      idKey: 'sug-p-3',
      name: `Galerie Historique & Ateliers d'Art (${cityName})`,
      category: 'Monuments' as const,
      desc: `Rencontre avec les artisans locaux et découverte du patrimoine vivant.`,
      cost: 12,
      duration: 100,
      rating: 4.7,
      imageUrl: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&auto=format&fit=crop&q=80',
      latOffset: 0.005,
      lonOffset: -0.011
    }
  ];

  const handleAddSuggestedPlace = async (sug: typeof placeSuggestions[0]) => {
    if (!activeTrip) return;
    const baseLat = places.length > 0 ? places[0].latitude : 41.3851;
    const baseLon = places.length > 0 ? places[0].longitude : 2.1734;

    const newPlace: Place = {
      id: `plc-sug-${Date.now()}`,
      tripId: activeTrip.id,
      name: sug.name,
      category: sug.category,
      address: `${sug.name}, ${activeTrip.destination}`,
      latitude: baseLat + sug.latOffset,
      longitude: baseLon + sug.lonOffset,
      rating: sug.rating,
      estimatedDurationMinutes: sug.duration,
      costEstimate: sug.cost,
      imageUrl: sug.imageUrl,
      notes: `Lieu suggéré par l'IA pour compléter votre séjour à ${cityName}.`,
      createdAt: new Date().toISOString()
    };

    await api.places.create(newPlace);
    setPlaces(prev => [...prev, newPlace]);
    setAddedSuggestions(prev => [...prev, sug.idKey]);
    confetti({ particleCount: 60, spread: 50 });

    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([newPlace.latitude, newPlace.longitude], 14, { duration: 1.2 });
    }
  };

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

    await db.reviews.add(newRev);
    confetti({ particleCount: 50, spread: 50 });
    alert(`Merci ! Votre avis certifié sur « ${placeForReview.name} » a été enregistré.`);
    setIsReviewModalOpen(false);
    setRevComment('');
    setPlaceForReview(null);
  };

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState<PlaceCategory>('Monuments');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState(35.6764);
  const [longitude, setLongitude] = useState(139.6993);
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
        // Fallback default coordinates if user denies permission
        setUserLocation({ lat: 35.6764, lng: 139.6993 });
      },
      { timeout: 8000 }
    );
  };

  // Initialize and update Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const defaultCenter: [number, number] = places.length > 0
        ? [places[0].latitude, places[0].longitude]
        : [35.6764, 139.6993];

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
      }
    }
  }, [places, filteredCategory, searchQuery]);

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
      await loadPlaces();
    }
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

      {/* AI Smart Suggestions for extra places */}
      {activeTrip && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-slate-900 to-sky-500/10 border border-amber-500/30 space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
              <h3 className="text-sm sm:text-base font-bold text-white">
                ✨ Autres suggestions IA pour enrichir votre séjour à {cityName}
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
              Recommandations Intelligentes
            </span>
          </div>
          <p className="text-xs text-slate-400">
            L'IA a déniché ces pépites supplémentaires pour votre destination. Ajoutez-les sur votre carte en un clic !
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            {placeSuggestions.map(sug => {
              const isAdded = addedSuggestions.includes(sug.idKey) || places.some(p => p.name === sug.name);
              return (
                <div key={sug.idKey} className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-col justify-between space-y-2 hover:border-amber-500/40 transition-colors">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-amber-300 text-[11px] bg-slate-800 px-2 py-0.5 rounded-md">
                        {sug.category}
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        ⭐ {sug.rating} • {sug.cost > 0 ? `${sug.cost} €` : 'Gratuit'}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-white leading-tight">{sug.name}</h4>
                    <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">{sug.desc}</p>
                  </div>

                  <button
                    onClick={() => handleAddSuggestedPlace(sug)}
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
                        <span>Ajouté sur la carte</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Ajouter à la carte</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
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
                        <span className="text-[10px] text-sky-400 hover:underline flex items-center space-x-0.5">
                          <ExternalLink className="w-3 h-3" />
                          <span>Carte</span>
                        </span>

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
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            handleDeletePlace(place.id);
                          }}
                          className="text-slate-500 hover:text-rose-400 p-1"
                          title="Supprimer ce lieu"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

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
