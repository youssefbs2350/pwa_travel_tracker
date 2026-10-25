import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Plus, 
  Star, 
  Camera, 
  Heart, 
  MapPin, 
  Smile, 
  Trash2, 
  Compass, 
  ArrowRight,
  CheckCircle2,
  Calendar,
  Upload,
  Eye,
  ChevronLeft,
  ChevronRight,
  X,
  ShieldCheck,
  History,
  AlertCircle,
  User
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useTrips } from '../../context/TripContext';
import { useAuth } from '../../context/AuthContext';
import { Memory, Review, Recommendation, Place, Trip } from '../../types';
import { Modal } from '../common/Modal';
import { api } from '../../services/api';
import { db } from '../../db/database';
import { useAppCurrency } from '../../utils/currency';

export const MemoriesView: React.FC = () => {
  const { activeTrip, trips } = useTrips();
  const { currentUser } = useAuth();
  const { currency: userCurrency, format, convert } = useAppCurrency();
  
  const [activeTab, setActiveTab] = useState<'memories' | 'gallery' | 'history' | 'reviews' | 'recommendations'>('memories');
  const [memories, setMemories] = useState<Memory[]>([]);
  const [allSavedMemories, setAllSavedMemories] = useState<Memory[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [pastPlaces, setPastPlaces] = useState<{ place: Place; trip: Trip }[]>([]);

  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Lightbox / Memory Viewer State
  const [viewingMemoryIndex, setViewingMemoryIndex] = useState<number | null>(null);

  // Memory Form
  const [memTitle, setMemTitle] = useState('');
  const [memStory, setMemStory] = useState('');
  const [memMood, setMemMood] = useState<Memory['mood']>('✨ Magique');
  const [memLocation, setMemLocation] = useState('');
  const [memPhoto, setMemPhoto] = useState('');
  const [memPhotoPreview, setMemPhotoPreview] = useState('');
  const [selectedMemoryTripId, setSelectedMemoryTripId] = useState<string>('');
  const [selectedMemoryPlaceId, setSelectedMemoryPlaceId] = useState<string>('');
  const [tripPlaces, setTripPlaces] = useState<Place[]>([]);

  // Update selectedMemoryTripId when activeTrip is available
  useEffect(() => {
    if (activeTrip?.id && !selectedMemoryTripId) {
      setSelectedMemoryTripId(activeTrip.id);
    } else if (trips.length > 0 && !selectedMemoryTripId) {
      setSelectedMemoryTripId(trips[0].id);
    }
  }, [activeTrip?.id, trips]);

  // Load places for the selected trip in the memory form
  useEffect(() => {
    if (selectedMemoryTripId) {
      db.places.where('tripId').equals(selectedMemoryTripId).toArray().then(pls => {
        setTripPlaces(pls);
        if (pls.length > 0 && !selectedMemoryPlaceId) {
          setSelectedMemoryPlaceId(pls[0].id);
          setMemLocation(pls[0].name);
        } else if (pls.length === 0) {
          setSelectedMemoryPlaceId('');
        }
      });
    }
  }, [selectedMemoryTripId]);

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setMemPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Review Form (strictly bound to past visited places)
  const [selectedPastPlaceKey, setSelectedPastPlaceKey] = useState<string>('');
  const [revRating, setRevRating] = useState(5);
  const [revComment, setRevComment] = useState('');
  const [revTags, setRevTags] = useState('Incontournable, À refaire');

  // Filter past trips: status === 'Terminé' or past end date
  const isPastTrip = (t: Trip) => t.status === 'Terminé' || new Date(t.endDate) < new Date();
  const pastTrips = trips.filter(isPastTrip);

  const loadData = async () => {
    // Current trip memories
    if (activeTrip) {
      const mems = await api.memories.getByTrip(activeTrip.id);
      setMemories(mems);
    }
    
    // All saved memories across all trips for gallery review
    const allMems = await db.memories.toArray();
    setAllSavedMemories(allMems);

    // All reviews
    const revs = await db.reviews.toArray();
    setReviews(revs);

    // Load visited places from completed/past trips
    if (pastTrips.length > 0) {
      const pastTripIds = pastTrips.map(t => t.id);
      const allPlaces = await db.places.toArray();
      const visited = allPlaces
        .filter(p => pastTripIds.includes(p.tripId))
        .map(p => {
          const trip = pastTrips.find(t => t.id === p.tripId)!;
          return { place: p, trip };
        });
      setPastPlaces(visited);
      if (visited.length > 0 && !selectedPastPlaceKey) {
        setSelectedPastPlaceKey(`${visited[0].place.id}::${visited[0].trip.id}`);
      }
    } else {
      setPastPlaces([]);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTrip?.id, trips]);

  // Smart Recommendation Engine
  const getSmartRecommendations = (): Recommendation[] => {
    const userInterests = currentUser?.preferences.interests || ['Culture', 'Gastronomie'];
    const dest = activeTrip?.destination || 'Destination';

    const basePool: Recommendation[] = [
      {
        id: 'rec-1',
        title: `Visite secrète des ruelles d'artisans`,
        category: 'Monuments',
        destination: dest,
        score: userInterests.includes('Culture') ? 98 : 84,
        reason: 'Correspondance parfaite avec votre intérêt pour la Culture et le patrimoine historique.',
        estimatedCost: 20,
        suggestedDuration: '2h00',
        imageUrl: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&auto=format&fit=crop&q=80'
      },
      {
        id: 'rec-2',
        title: `Dégustation gastronomique chez l'habitant`,
        category: 'Restaurant',
        destination: dest,
        score: userInterests.includes('Gastronomie') ? 96 : 80,
        reason: 'Plébiscité par les voyageurs ayant le même profil gastronomique que vous.',
        estimatedCost: 40,
        suggestedDuration: '1h30',
        imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80'
      },
      {
        id: 'rec-3',
        title: `Point de vue panoramique au coucher du soleil`,
        category: 'Nature',
        destination: dest,
        score: userInterests.includes('Nature') ? 95 : 79,
        reason: 'Lieu photogénique idéal pour immortaliser votre séjour sans affluence.',
        estimatedCost: 0,
        suggestedDuration: '1h15',
        imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80'
      }
    ];

    return basePool.sort((a, b) => b.score - a.score);
  };

  const recommendations = getSmartRecommendations();

  const handleAdoptRecommendation = async (rec: Recommendation) => {
    if (!activeTrip) return;

    const newPlace: Place = {
      id: 'plc-rec-' + Date.now(),
      tripId: activeTrip.id,
      name: rec.title,
      category: rec.category,
      address: `${rec.destination} (Recommandation personnalisée)`,
      latitude: 35.6800 + Math.random() * 0.05,
      longitude: 139.7100 + Math.random() * 0.05,
      rating: 4.9,
      estimatedDurationMinutes: 90,
      costEstimate: rec.estimatedCost,
      imageUrl: rec.imageUrl,
      notes: `Ajouté depuis les recommandations personnalisées (${rec.reason})`,
      createdAt: new Date().toISOString()
    };

    await db.places.add(newPlace);
    confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    alert(`« ${rec.title} » a été ajouté à votre carte de voyage et liste de lieux !`);
    await loadData();
  };

  const handleCreateMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetTrip = trips.find(t => t.id === selectedMemoryTripId) || activeTrip;
    if (!targetTrip) {
      alert("Veuillez sélectionner un voyage valide.");
      return;
    }

    const targetPlace = tripPlaces.find(p => p.id === selectedMemoryPlaceId);
    const finalLocation = targetPlace ? targetPlace.name : (memLocation || targetTrip.destination);

    const defaultImg = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80';
    const finalPhoto = memPhotoPreview || memPhoto || defaultImg;
    await api.memories.create({
      tripId: targetTrip.id,
      tripTitle: targetTrip.title,
      placeId: selectedMemoryPlaceId || undefined,
      placeName: targetPlace?.name || undefined,
      userId: currentUser?.id || 'usr-default',
      userName: currentUser?.name || 'Voyageur',
      userRole: currentUser?.role || 'Traveler',
      title: memTitle,
      story: memStory,
      date: new Date().toISOString().split('T')[0],
      photos: [finalPhoto],
      mood: memMood,
      locationName: finalLocation
    });

    await loadData();
    setIsMemoryModalOpen(false);
    setMemTitle('');
    setMemStory('');
    setMemPhoto('');
    setMemPhotoPreview('');
    setMemLocation('');
    setSelectedMemoryPlaceId('');
    confetti({ particleCount: 50, spread: 50 });
  };

  const handleCreateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPastPlaceKey) {
      alert("Veuillez sélectionner un lieu visité lors d'un voyage passé.");
      return;
    }

    const [placeId, tripId] = selectedPastPlaceKey.split('::');
    const pastEntry = pastPlaces.find(p => p.place.id === placeId && p.trip.id === tripId);
    const placeName = pastEntry ? pastEntry.place.name : 'Lieu visité';
    const tripTitle = pastEntry ? pastEntry.trip.title : 'Voyage passé';
    const tripDestination = pastEntry ? pastEntry.trip.destination : '';

    const newRev: Review = {
      id: 'rev-' + Date.now(),
      tripId,
      tripTitle,
      tripDestination,
      placeId,
      placeName,
      userId: currentUser?.id || 'usr-default',
      userName: currentUser?.name || 'Voyageur',
      rating: Number(revRating),
      comment: revComment,
      tags: revTags.split(',').map(t => t.trim()).filter(Boolean),
      date: new Date().toISOString().split('T')[0],
      verifiedVisit: true
    };

    await db.reviews.add(newRev);
    await loadData();
    setIsReviewModalOpen(false);
    setRevComment('');
    confetti({ particleCount: 60, spread: 50 });
  };

  const handleDeleteMemory = async (id: string) => {
    await api.memories.delete(id);
    await loadData();
  };

  const moods: Memory['mood'][] = [
    '✨ Magique',
    '🤩 Époustouflant',
    '😌 Paisible',
    '🔥 Aventureux',
    '😋 Délicieux'
  ];

  // Viewer / Lightbox handlers
  const openMemoryViewer = (index: number) => {
    setViewingMemoryIndex(index);
  };

  const currentViewingMemory = viewingMemoryIndex !== null ? allSavedMemories[viewingMemoryIndex] : null;

  const handlePrevMemory = () => {
    if (viewingMemoryIndex !== null && viewingMemoryIndex > 0) {
      setViewingMemoryIndex(viewingMemoryIndex - 1);
    } else {
      setViewingMemoryIndex(allSavedMemories.length - 1);
    }
  };

  const handleNextMemory = () => {
    if (viewingMemoryIndex !== null && viewingMemoryIndex < allSavedMemories.length - 1) {
      setViewingMemoryIndex(viewingMemoryIndex + 1);
    } else {
      setViewingMemoryIndex(0);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-pink-500/10 text-pink-400 rounded-xl border border-pink-500/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-white">Avis & Souvenirs</h2>
            </div>
            <p className="text-sm text-slate-400 mt-0.5">
              Journal de bord visuel, retours d'expériences vérifiés et galerie de vos souvenirs.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {allSavedMemories.length > 0 && (
            <button
              onClick={() => openMemoryViewer(0)}
              className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-750 text-pink-300 border border-pink-500/40 rounded-xl text-xs font-bold transition-all shadow-sm"
              title="Revoir tous les souvenirs en mode galerie grand écran"
            >
              <Eye className="w-4 h-4 text-pink-400" />
              <span>Revoir les Souvenirs ({allSavedMemories.length})</span>
            </button>
          )}

          <button
            onClick={() => setIsMemoryModalOpen(true)}
            className="flex items-center space-x-2 px-3.5 py-2 bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-pink-600/25 transition-all"
          >
            <Camera className="w-4 h-4" />
            <span>Nouveau Souvenir</span>
          </button>

          <button
            onClick={() => setIsReviewModalOpen(true)}
            className="flex items-center space-x-2 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold rounded-xl shadow-lg shadow-amber-500/25 transition-all"
          >
            <Star className="w-4 h-4 fill-current" />
            <span>Donner un Avis</span>
          </button>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('memories')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'memories'
              ? 'bg-pink-600 text-white shadow-md shadow-pink-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>Journal du voyage ({memories.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('gallery')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'gallery'
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>🖼️ Galerie des Souvenirs Enregistrés ({allSavedMemories.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'history'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>🏛️ Historique & Visites ({pastTrips.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reviews')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'reviews'
              ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Star className="w-4 h-4" />
          <span>Avis Vérifiés ({reviews.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('recommendations')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'recommendations'
              ? 'bg-gradient-to-r from-amber-500 to-pink-500 text-slate-950 shadow-md font-extrabold'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Recommandations IA ({recommendations.length})</span>
        </button>
      </div>

      {/* TAB 1: SOUVENIRS JOURNAL (Current Active Trip) */}
      {activeTab === 'memories' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Souvenirs associés au séjour actif : <strong className="text-white">{activeTrip?.title}</strong></span>
            {memories.length > 0 && (
              <button
                onClick={() => openMemoryViewer(0)}
                className="text-pink-400 hover:underline flex items-center space-x-1"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Ouvrir en plein écran</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {memories.length === 0 ? (
              <div className="col-span-2 text-center py-12 p-6 rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 space-y-3">
                <Camera className="w-10 h-10 text-slate-600 mx-auto" />
                <h4 className="text-sm font-semibold text-slate-300">Aucun souvenir capturé pour ce séjour</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Partagez une photo, racontez une anecdote vécue ou décrivez vos émotions.
                </p>
                <button
                  onClick={() => setIsMemoryModalOpen(true)}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-pink-600/30 text-pink-300 border border-pink-500/40 rounded-xl text-xs font-semibold hover:bg-pink-600/50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Créer mon premier souvenir</span>
                </button>
              </div>
            ) : (
              memories.map((mem, idx) => (
                <div
                  key={mem.id}
                  onClick={() => openMemoryViewer(allSavedMemories.findIndex(m => m.id === mem.id))}
                  className="group rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 hover:border-pink-500/50 transition-all shadow-lg space-y-4 cursor-pointer"
                >
                  {/* Photo with hover badge */}
                  <div className="relative h-60 w-full overflow-hidden bg-slate-950">
                    <img
                      src={mem.photos[0]}
                      alt={mem.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                    
                    {/* Mood pill */}
                    <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white border border-slate-700/80 shadow">
                      {mem.mood}
                    </div>

                    <div className="absolute top-3 right-3 bg-pink-600/80 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Eye className="w-3 h-3" />
                      <span>Agrandir</span>
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 text-white space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                        <span className="flex items-center space-x-1 px-2 py-0.5 rounded-md bg-slate-950/80 text-pink-300 font-semibold border border-pink-500/30">
                          <MapPin className="w-3 h-3 text-pink-400" />
                          <span className="truncate max-w-[150px]">{mem.locationName || mem.placeName || 'Emplacement non précisé'}</span>
                        </span>
                        <span className="flex items-center space-x-1 px-2 py-0.5 rounded-md bg-slate-950/80 text-purple-300 font-semibold border border-purple-500/30">
                          <Compass className="w-3 h-3 text-purple-400" />
                          <span className="truncate max-w-[130px]">{mem.tripTitle || activeTrip?.title || 'Séjour'}</span>
                        </span>
                      </div>
                      <h3 className="text-base font-bold drop-shadow-sm truncate">{mem.title}</h3>
                    </div>
                  </div>

                  {/* Story narrative & Author info */}
                  <div className="p-4 pt-0 space-y-3" onClick={e => e.stopPropagation()}>
                    <p className="text-xs text-slate-300 leading-relaxed italic bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                      « {mem.story} »
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                      <div className="flex items-center space-x-2">
                        <span className="flex items-center space-x-1 text-slate-300 font-medium">
                          <User className="w-3 h-3 text-pink-400" />
                          <span>Ajouté par : <strong className="text-white">{mem.userName || 'Voyageur'}</strong> <span className="text-[10px] text-pink-300 font-semibold">({mem.userRole || 'Traveler'})</span></span>
                        </span>
                        <span>•</span>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{mem.date}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteMemory(mem.id)}
                        className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                        title="Supprimer ce souvenir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: DEDICATED SOUVENIR VIEWER / GALLERY (All Saved Memories) */}
      {activeTab === 'gallery' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Eye className="w-4 h-4 text-pink-400" />
                <span>Revoir les Souvenirs Enregistrés</span>
              </h3>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Consultez l'ensemble des {allSavedMemories.length} souvenirs photographiques et récits immortalisés à travers tous vos voyages.
              </p>
            </div>
            {allSavedMemories.length > 0 && (
              <button
                onClick={() => openMemoryViewer(0)}
                className="px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold rounded-xl text-xs shadow-lg transition-all"
              >
                Lancer le Diaporama Grand Format
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {allSavedMemories.map((mem, index) => (
              <div
                key={mem.id}
                onClick={() => openMemoryViewer(index)}
                className="group relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 hover:border-pink-500/60 transition-all cursor-pointer shadow-lg hover:shadow-pink-500/10"
              >
                <div className="relative h-48 w-full overflow-hidden bg-slate-950">
                  <img
                    src={mem.photos[0]}
                    alt={mem.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                  
                  <div className="absolute top-2.5 left-2.5 bg-slate-950/80 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[11px] font-bold text-white border border-slate-700/80">
                    {mem.mood}
                  </div>

                  <div className="absolute bottom-2.5 left-3 right-3 text-white space-y-1">
                    <div className="flex flex-wrap items-center gap-1 text-[10px]">
                      <span className="bg-slate-950/80 text-pink-300 font-semibold px-1.5 py-0.5 rounded border border-pink-500/30 truncate max-w-[130px]">
                        📍 {mem.locationName || mem.placeName || 'Lieu'}
                      </span>
                      <span className="bg-slate-950/80 text-purple-300 font-semibold px-1.5 py-0.5 rounded border border-purple-500/30 truncate max-w-[110px]">
                        ✈️ {mem.tripTitle || trips.find(t => t.id === mem.tripId)?.title || 'Séjour'}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold truncate drop-shadow">{mem.title}</h4>
                  </div>
                </div>

                <div className="p-3.5 space-y-2">
                  <div className="flex items-center space-x-1.5 text-[11px] text-slate-300">
                    <User className="w-3 h-3 text-pink-400 flex-shrink-0" />
                    <span className="truncate">Ajouté par : <strong className="text-white">{mem.userName || 'Voyageur'}</strong> <span className="text-[10px] text-pink-300 font-semibold">({mem.userRole || 'Traveler'})</span></span>
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-2 italic">
                    « {mem.story} »
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800">
                    <span>{mem.date}</span>
                    <span className="text-pink-400 font-medium group-hover:underline flex items-center space-x-1">
                      <span>Consulter</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: PAST TRIPS HISTORY & VISITED PLACES */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-500/30 text-xs text-purple-200 flex items-center space-x-3">
            <History className="w-6 h-6 text-purple-400 flex-shrink-0" />
            <div>
              <strong className="font-bold text-white">Historique Certifié des Voyages Passés :</strong>
              <p className="mt-0.5 text-slate-300">
                Seuls les lieux explorés au cours de ces séjours passés ({pastTrips.length} voyage(s) terminé(s)) sont éligibles à la publication d'un avis vérifié.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {pastTrips.length === 0 ? (
              <div className="text-center py-12 p-6 rounded-2xl bg-slate-900 border border-dashed border-slate-800 space-y-3">
                <History className="w-10 h-10 text-slate-600 mx-auto" />
                <h4 className="text-sm font-semibold text-slate-300">Aucun voyage passé dans l'historique</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Pour valider un séjour dans l'historique et débloquer les avis certifiés, marquez un voyage comme "Terminé" dans la section Voyages.
                </p>
              </div>
            ) : (
              pastTrips.map(trip => {
                const tripPlaces = pastPlaces.filter(p => p.trip.id === trip.id);
                return (
                  <div
                    key={trip.id}
                    className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-bold text-white text-base">{trip.title}</h4>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                            Séjour Passé
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {trip.destination} • {trip.startDate} au {trip.endDate}
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          if (tripPlaces.length > 0) {
                            setSelectedPastPlaceKey(`${tripPlaces[0].place.id}::${trip.id}`);
                          }
                          setIsReviewModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/40 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all self-start sm:self-auto"
                      >
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span>Rédiger un avis sur ce voyage</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-slate-300">
                        Lieux visités lors de ce séjour ({tripPlaces.length}) :
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                        {tripPlaces.map(({ place }) => (
                          <div
                            key={place.id}
                            className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs"
                          >
                            <div className="truncate mr-2">
                              <p className="font-semibold text-white truncate">{place.name}</p>
                              <span className="text-[10px] text-slate-400">{place.category}</span>
                            </div>
                            <button
                              onClick={() => {
                                setSelectedPastPlaceKey(`${place.id}::${trip.id}`);
                                setIsReviewModalOpen(true);
                              }}
                              className="text-[10px] bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-1 rounded font-bold transition-colors flex-shrink-0"
                            >
                              Évaluer
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 4: REVIEWS & RATINGS (VERIFIED VISITS ONLY) */}
      {activeTab === 'reviews' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <div>
                <strong className="text-white font-semibold">Garantie Avis Authentiques :</strong>
                <p className="text-slate-400 text-[11px]">
                  Les avis ci-dessous sont certifiés réels et proviennent exclusivement de lieux visités lors de séjours passés.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsReviewModalOpen(true)}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-md transition-colors flex-shrink-0"
            >
              Donner un Avis Vérifié
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map(rev => (
              <div
                key={rev.id}
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-white text-sm">{rev.placeName}</h4>
                    <p className="text-[11px] text-slate-400">Par {rev.userName} • {rev.date}</p>
                    {rev.tripDestination && (
                      <div className="mt-1 inline-flex items-center space-x-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>Visite vérifiée au séjour : {rev.tripDestination}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20 text-xs font-bold">
                    <Star className="w-3.5 h-3.5 fill-current mr-1" />
                    <span>{rev.rating}/5</span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed italic bg-slate-950/40 p-2.5 rounded-xl border border-slate-800">
                  « {rev.comment} »
                </p>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {rev.tags.map(t => (
                    <span key={t} className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md border border-slate-700">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: AI RECOMMENDATIONS ENGINE */}
      {activeTab === 'recommendations' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-pink-500/10 to-indigo-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-center space-x-3">
            <Sparkles className="w-6 h-6 text-amber-400 flex-shrink-0" />
            <div>
              <strong className="font-bold text-white">Algorithme d'affinité personnalisée :</strong>
              <p className="mt-0.5 text-slate-300">
                Ces recommandations sont calculées à partir de vos centres d'intérêt ({currentUser?.preferences.interests?.join(', ') || 'Culture'}) et des avis certifiés de la communauté.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recommendations.map(rec => (
              <div
                key={rec.id}
                className="group p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 transition-all shadow-xl flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="relative h-40 w-full rounded-xl overflow-hidden bg-slate-950">
                    <img
                      src={rec.imageUrl}
                      alt={rec.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 right-2 bg-gradient-to-r from-amber-500 to-pink-500 text-slate-950 px-2.5 py-0.5 rounded-full text-xs font-extrabold shadow">
                      {rec.score}% Match
                    </div>
                    <div className="absolute bottom-2 left-2 bg-slate-950/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-amber-300 font-semibold border border-amber-500/30">
                      {rec.category} • ~{rec.suggestedDuration}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                      {rec.title}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {rec.reason}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400">
                    {rec.estimatedCost > 0 
                      ? `~${format(convert(rec.estimatedCost, 'EUR'), userCurrency)}` 
                      : 'Gratuit'}
                  </span>
                  <button
                    onClick={() => handleAdoptRecommendation(rec)}
                    className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/40 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-sm"
                  >
                    <span>Ajouter au Voyage</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FULLSCREEN LIGHTBOX / SOUVENIR VIEWER */}
      {currentViewingMemory && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
            
            {/* Close button */}
            <button
              onClick={() => setViewingMemoryIndex(null)}
              className="absolute top-4 right-4 z-20 p-2 rounded-full bg-slate-950/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Photo Column with Nav Buttons */}
            <div className="relative flex-1 bg-black min-h-[300px] md:min-h-[480px] flex items-center justify-center overflow-hidden">
              <img
                src={currentViewingMemory.photos[0]}
                alt={currentViewingMemory.title}
                className="w-full h-full object-contain"
              />
              
              {/* Prev / Next buttons */}
              {allSavedMemories.length > 1 && (
                <>
                  <button
                    onClick={handlePrevMemory}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-950/80 hover:bg-slate-800 text-white transition-colors"
                    title="Souvenir précédent"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleNextMemory}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-950/80 hover:bg-slate-800 text-white transition-colors"
                    title="Souvenir suivant"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Counter pill */}
              <div className="absolute bottom-3 left-3 bg-slate-950/80 px-3 py-1 rounded-full text-xs text-white border border-slate-700">
                Souvenir {(viewingMemoryIndex ?? 0) + 1} / {allSavedMemories.length}
              </div>
            </div>

            {/* Narrative Story Details Column */}
            <div className="w-full md:w-80 p-6 flex flex-col justify-between space-y-4 bg-slate-900 border-t md:border-t-0 md:border-l border-slate-800 overflow-y-auto">
              <div className="space-y-4">
                <div className="inline-block bg-pink-500/10 border border-pink-500/30 text-pink-300 px-3 py-1 rounded-full text-xs font-bold">
                  {currentViewingMemory.mood}
                </div>

                <div>
                  <h3 className="text-xl font-bold text-white">{currentViewingMemory.title}</h3>
                </div>

                {/* Details context box */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center space-x-2 text-slate-300">
                    <User className="w-3.5 h-3.5 text-pink-400 flex-shrink-0" />
                    <span>Ajouté par : <strong className="text-white">{currentViewingMemory.userName || 'Voyageur'}</strong> <span className="text-[10px] text-pink-300 font-semibold">({currentViewingMemory.userRole || 'Traveler'})</span></span>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-300">
                    <Compass className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                    <span>Voyage : <strong className="text-white">{currentViewingMemory.tripTitle || trips.find(t => t.id === currentViewingMemory.tripId)?.title || 'Séjour'}</strong></span>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-pink-400 flex-shrink-0" />
                    <span>Emplacement : <strong className="text-white">{currentViewingMemory.locationName || 'Emplacement non précisé'}</strong></span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-slate-300 text-xs leading-relaxed italic">
                  « {currentViewingMemory.story} »
                </div>

                <div className="flex items-center space-x-2 text-xs text-slate-500 pt-2 border-t border-slate-800">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Capturé le {currentViewingMemory.date}</span>
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center">
                <button
                  onClick={handlePrevMemory}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-xs text-slate-300"
                >
                  ← Précédent
                </button>
                <button
                  onClick={handleNextMemory}
                  className="px-3 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 text-xs font-bold text-white shadow"
                >
                  Suivant →
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Modal: New Memory */}
      <Modal
        isOpen={isMemoryModalOpen}
        onClose={() => setIsMemoryModalOpen(false)}
        title="Créer un Souvenir de Voyage"
        subtitle="Immortalisez un moment fort, une photo locale et vos émotions"
      >
        <form onSubmit={handleCreateMemory} className="space-y-4">
          {/* Personne qui ajoute le souvenir */}
          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-full bg-pink-500/20 text-pink-400 border border-pink-500/40 flex items-center justify-center font-bold text-xs">
                {currentUser?.name?.[0] || 'V'}
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Personne qui ajoute ce souvenir :</span>
                <span className="font-bold text-white">{currentUser?.name || 'Voyageur'}</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30">
              {currentUser?.role || 'Traveler'}
            </span>
          </div>

          {/* Sélection du voyage */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Dans quel voyage ? <span className="text-pink-400">*</span>
            </label>
            <select
              required
              value={selectedMemoryTripId}
              onChange={e => setSelectedMemoryTripId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-pink-500"
            >
              {trips.map(trip => (
                <option key={trip.id} value={trip.id}>
                  ✈️ {trip.title} — {trip.destination} ({trip.status})
                </option>
              ))}
            </select>
          </div>

          {/* Sélection de l'emplacement exact */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Quel emplacement exactement ? <span className="text-pink-400">*</span>
            </label>
            {tripPlaces.length > 0 ? (
              <div className="space-y-2">
                <select
                  value={selectedMemoryPlaceId}
                  onChange={e => {
                    const val = e.target.value;
                    setSelectedMemoryPlaceId(val);
                    if (val === 'custom') {
                      setMemLocation('');
                    } else {
                      const p = tripPlaces.find(pl => pl.id === val);
                      if (p) setMemLocation(p.name);
                    }
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-pink-500"
                >
                  <option value="">Sélectionner un lieu visité du voyage...</option>
                  {tripPlaces.map(p => (
                    <option key={p.id} value={p.id}>
                      📍 {p.name} ({p.category} - {p.address})
                    </option>
                  ))}
                  <option value="custom">✍️ Autre emplacement / Saisie libre...</option>
                </select>

                {(selectedMemoryPlaceId === 'custom' || !selectedMemoryPlaceId) && (
                  <input
                    type="text"
                    required
                    value={memLocation}
                    onChange={e => setMemLocation(e.target.value)}
                    placeholder="Précisez l'emplacement exact (ex: Belvédère de la tour, Plage Nord...)"
                    className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-pink-500"
                  />
                )}
              </div>
            ) : (
              <input
                type="text"
                required
                value={memLocation}
                onChange={e => setMemLocation(e.target.value)}
                placeholder="ex: Quartier historique, Café central, Plage du coucher de soleil..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-pink-500"
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Titre du souvenir</label>
            <input
              type="text"
              required
              value={memTitle}
              onChange={e => setMemTitle(e.target.value)}
              placeholder="ex: Coucher de soleil féérique sur la baie"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-pink-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Humeur / Ressenti</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {moods.map(m => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setMemMood(m)}
                  className={`py-2 px-2 text-xs font-medium rounded-xl border text-center transition-all ${
                    memMood === m
                      ? 'bg-pink-600 text-white border-pink-500 font-bold'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Photo du souvenir</label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <label className="cursor-pointer flex items-center space-x-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs text-white font-medium transition-colors">
                  <Upload className="w-4 h-4 text-pink-400" />
                  <span>Importer depuis votre appareil</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoFileChange}
                    className="hidden"
                  />
                </label>
                {memPhotoPreview && (
                  <button
                    type="button"
                    onClick={() => setMemPhotoPreview('')}
                    className="text-xs text-rose-400 hover:underline"
                  >
                    Supprimer l'image
                  </button>
                )}
              </div>

              {memPhotoPreview ? (
                <div className="relative w-full h-36 rounded-xl overflow-hidden border border-pink-500/50">
                  <img src={memPhotoPreview} alt="Aperçu local" className="w-full h-full object-cover" />
                  <span className="absolute bottom-2 left-2 bg-slate-950/80 text-[10px] text-pink-300 px-2 py-0.5 rounded font-semibold">
                    ✓ Image locale prête
                  </span>
                </div>
              ) : (
                <div>
                  <span className="text-[11px] text-slate-400 block mb-1">Ou saisir une URL de photo :</span>
                  <input
                    type="url"
                    value={memPhoto}
                    onChange={e => setMemPhoto(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-pink-500"
                  />
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Récit & Anecdotes vécues</label>
            <textarea
              rows={3}
              required
              value={memStory}
              onChange={e => setMemStory(e.target.value)}
              placeholder="Ce qui a rendu ce moment inoubliable..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-pink-500"
            />
          </div>

          <div className="pt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsMemoryModalOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 text-sm font-semibold rounded-xl"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-pink-600 hover:bg-pink-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-pink-600/30"
            >
              Enregistrer le Souvenir
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Review (Strictly based on past visited places) */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        title="Donner un Avis Vérifié"
        subtitle="Seuls les lieux effectivement visités lors de séjours passés sont éligibles"
      >
        {pastPlaces.length === 0 ? (
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-xl bg-amber-950/60 border border-amber-500/40 text-amber-200 text-xs space-y-2">
              <div className="flex items-center space-x-2 text-amber-300 font-bold text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>Aucun lieu visité dans le passé trouvé</span>
              </div>
              <p className="leading-relaxed">
                Conformément à nos règles de certification, vous devez avoir réellement visité un lieu dans le cadre d'un <strong>voyage passé / terminé</strong> pour publier un avis.
              </p>
              <p className="leading-relaxed text-[11px] text-amber-300">
                Astuce : Rendez-vous dans la section <strong>Voyages</strong> et cliquez sur <em>« Terminer »</em> sur l'un de vos voyages pour l'inscrire dans l'historique de vos séjours passés.
              </p>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setIsReviewModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl"
              >
                Fermer
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreateReview} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Lieu visité lors d'un séjour passé
              </label>
              <select
                required
                value={selectedPastPlaceKey}
                onChange={e => setSelectedPastPlaceKey(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              >
                {pastPlaces.map(({ place, trip }) => (
                  <option key={`${place.id}::${trip.id}`} value={`${place.id}::${trip.id}`}>
                    {place.name} — Séjour : {trip.title} ({trip.destination})
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-emerald-400 mt-1 block">
                ✓ Lieu certifié présent dans votre historique de voyage
              </span>
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
                placeholder="Ressenti sur place, accueil, points forts constatés..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Tags (séparés par des virgules)</label>
              <input
                type="text"
                value={revTags}
                onChange={e => setRevTags(e.target.value)}
                placeholder="Incontournable, Gastronomie, Calme..."
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
                Publier l'Avis Vérifié
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
