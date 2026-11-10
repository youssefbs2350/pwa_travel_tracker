import React, { useState, useEffect } from 'react';
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
  PlaneTakeoff,
  Copy,
  Check,
  Luggage,
  FileText,
  Download,
  Printer,
  Share2,
  Clock,
  ExternalLink,
  RefreshCw,
  X,
  ChevronRight,
  Info,
  Shield,
  Layers,
  Search,
  Upload,
  Target,
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudFog,
  CloudDrizzle,
  CloudSun,
  AlertTriangle,
  TrendingUp,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  MessageCircle,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useTrips } from '../../context/TripContext';
import { useAuth } from '../../context/AuthContext';
import { Trip, TripStatus, Place, Activity, Expense, PackingItem, PackingCategory, TravelDoc, TravelDocCategory } from '../../types';
import { Modal } from '../common/Modal';
import { db } from '../../db/database';
import { useAppCurrency } from '../../utils/currency';
import { 
  generateFullSmartTrip, 
  generateSmartPackingList, 
  resolveDestinationIntelligence, 
  DESTINATIONS_DB 
} from '../../services/aiTripPlanner';
import { exportTripToIcs, printTripRoadbook, openInGoogleCalendar } from '../../utils/calendarExport';
import { calculateTripReadiness, getReadinessColor, type ReadinessScore } from '../../utils/tripReadiness';
import { fetchTripWeatherMock, type TripWeatherData } from '../../services/tripWeather';
import { encryptData, decryptData, maskSensitiveNumber, checkPasswordStrength } from '../../utils/encryption';
import { collaborationService, type CollaborationUser } from '../../services/collaboration';
import { TripReadinessWidget } from './TripReadinessWidget';
import { TripWeatherWidget } from './TripWeatherWidget';
import { SecureDocumentVault } from './SecureDocumentVault';
import { CollaborationPanel } from './CollaborationPanel';

export const getDestinationCover = (dest: string): string => {
  const d = (dest || '').toLowerCase();
  if (d.includes('paris') || d.includes('france')) return 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&auto=format&fit=crop&q=85';
  if (d.includes('tokyo') || d.includes('japon') || d.includes('kyoto') || d.includes('tokio')) return 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1200&auto=format&fit=crop&q=85';
  if (d.includes('barcelon') || d.includes('madrid') || d.includes('espagne') || d.includes('brcelon') || d.includes('barca')) return 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=1200&auto=format&fit=crop&q=85';
  if (d.includes('rome') || d.includes('italie') || d.includes('venise') || d.includes('roma')) return 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1200&auto=format&fit=crop&q=85';
  if (d.includes('djerba') || d.includes('tunis') || d.includes('tunisie') || d.includes('jerba') || d.includes('zarzis') || d.includes('tozeur')) return 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop&q=85';
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

export const TripsView: React.FC = () => {
  const { 
    trips, 
    activeTrip, 
    setActiveTripId, 
    addTrip, 
    updateTrip, 
    deleteTrip, 
    duplicateTrip,
    joinTripByCode 
  } = useTrips();
  const { currentUser, allUsers } = useAuth();
  const { currency: userCurrency, format, convert } = useAppCurrency();
  const canManageTrips = currentUser?.role === 'Admin' || currentUser?.role === 'Organizer';

  // Filters & Modals
  const [tripFilter, setTripFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isGeneratorModalOpen, setIsGeneratorModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joinFeedback, setJoinFeedback] = useState<string | null>(null);

  // Packing List Modal State
  const [packingModalTrip, setPackingModalTrip] = useState<Trip | null>(null);
  const [selectedPackingCategory, setSelectedPackingCategory] = useState<string>('all');
  const [newPackingLabel, setNewPackingLabel] = useState('');
  const [newPackingCat, setNewPackingCat] = useState<PackingCategory>('Vêtements');

  // Documents Vault Modal State
  const [docsModalTrip, setDocsModalTrip] = useState<Trip | null>(null);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocCategory, setNewDocCategory] = useState<TravelDocCategory>('Vol / Billet');
  const [newDocCode, setNewDocCode] = useState('');
  const [newDocNotes, setNewDocNotes] = useState('');
  const [newDocFileUrl, setNewDocFileUrl] = useState('');

  // Features Modal State (Score, Weather, Vault, Collaboration)
  const [showFeaturesModal, setShowFeaturesModal] = useState(false);
  const [selectedFeatureTrip, setSelectedFeatureTrip] = useState<Trip | null>(null);
  const [activeFeatureTab, setActiveFeatureTab] = useState<'score' | 'weather' | 'vault' | 'collab'>('score');

  // Editing Trip
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [copiedShareCode, setCopiedShareCode] = useState<string | null>(null);

  // Form states for manual create/edit
  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('');
  const [country, setCountry] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [budgetTotal, setBudgetTotal] = useState(1500);
  const [currency, setCurrency] = useState('EUR');
  const [status, setStatus] = useState<TripStatus>('Planifié');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [extraParticipantText, setExtraParticipantText] = useState('');
  const [aiDestinationSuggestion, setAiDestinationSuggestion] = useState<string | null>(null);

  // AI Generator States
  const [genDestination, setGenDestination] = useState('Djerba, Tunisie');
  const [genDays, setGenDays] = useState(4);
  const [genStartDate, setGenStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [genPace, setGenPace] = useState<'Relaxed' | 'Balanced' | 'Intense'>('Balanced');
  const [genTheme, setGenTheme] = useState('Culture & Histoire');
  const [genBudgetTier, setGenBudgetTier] = useState<'Économique' | 'Équilibré' | 'Confort'>('Équilibré');
  const [genGroupType, setGenGroupType] = useState<'Solo' | 'Couple' | 'Amis' | 'Famille'>('Couple');
  const [genParticipants, setGenParticipants] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>('');

  const isPastTrip = (t: Trip) => t.status === 'Terminé' || (t.endDate ? new Date(t.endDate) < new Date() : false);
  const pastTrips = trips.filter(isPastTrip);
  const upcomingTrips = trips.filter(t => !isPastTrip(t));
  const displayedTrips = tripFilter === 'all' 
    ? trips 
    : tripFilter === 'past' 
    ? pastTrips 
    : upcomingTrips;

  // Lifecycle & Countdown Helper
  const getTripCountdownBadge = (trip: Trip) => {
    if (trip.status === 'Terminé' || isPastTrip(trip)) {
      return {
        label: '🏛️ Historique Passé',
        className: 'bg-purple-950/80 text-purple-300 border-purple-600/40'
      };
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(trip.startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(trip.endDate);
    end.setHours(23, 59, 59, 999);

    if (today >= start && today <= end) {
      const currentDay = Math.min(
        Math.ceil((end.getTime() - start.getTime()) / 86400000),
        Math.max(1, Math.floor((today.getTime() - start.getTime()) / 86400000) + 1)
      );
      const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000));
      return {
        label: `🟢 En direct • Jour ${currentDay}/${totalDays}`,
        className: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 animate-pulse'
      };
    }

    if (today < start) {
      const diffDays = Math.ceil((start.getTime() - today.getTime()) / 86400000);
      return {
        label: `⏳ J-${diffDays} avant départ`,
        className: 'bg-amber-950/80 text-amber-300 border-amber-500/40'
      };
    }

    return {
      label: 'Planifié',
      className: 'bg-sky-950/80 text-sky-300 border-sky-500/40'
    };
  };

  const copyShareCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedShareCode(code);
    setTimeout(() => setCopiedShareCode(null), 2500);
  };

  const resetForm = () => {
    setTitle('');
    setDestination('');
    setCountry('');
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate(new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0]);
    setCoverImage('');
    setBudgetTotal(1500);
    setCurrency(currentUser?.preferences.currency || 'EUR');
    setStatus('Planifié');
    setSelectedParticipants(currentUser ? [currentUser.name] : ['Moi']);
    setExtraParticipantText('');
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
    setSelectedParticipants(trip.participants || []);
    setExtraParticipantText('');
    setIsCreateModalOpen(true);
  };

  const handleToggleParticipant = (name: string) => {
    setSelectedParticipants(prev => 
      prev.includes(name) ? prev.filter(p => p !== name) : [...prev, name]
    );
  };

  const handleSaveTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrip && !canManageTrips) {
      alert("Action refusée : Seuls les Organisateurs et Administrateurs sont autorisés à créer des voyages.");
      return;
    }

    const extra = extraParticipantText.split(',').map(p => p.trim()).filter(Boolean);
    const combinedParticipants = Array.from(new Set([...selectedParticipants, ...extra]));
    const finalParticipants = combinedParticipants.length > 0 ? combinedParticipants : [currentUser?.name || 'Moi'];
    const finalCover = coverImage || getDestinationCover(destination);
    const finalShareCode = editingTrip?.shareCode || 'TRIP-' + Math.random().toString(36).substring(2, 6).toUpperCase();

    if (editingTrip) {
      await updateTrip(editingTrip.id, {
        title,
        destination,
        country,
        startDate,
        endDate,
        coverImage: finalCover,
        budgetTotal,
        currency,
        status,
        participants: finalParticipants
      });
    } else {
      await addTrip({
        userId: currentUser?.id || 'usr-default',
        title,
        destination,
        country: country || (destination.includes(',') ? destination.split(',')[1].trim() : 'International'),
        startDate: startDate || new Date().toISOString().split('T')[0],
        endDate: endDate || new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
        coverImage: finalCover,
        budgetTotal,
        currency,
        status,
        participants: finalParticipants,
        shareCode: finalShareCode,
        packingList: [],
        travelDocs: []
      });
    }

    setIsCreateModalOpen(false);
    resetForm();
  };

  // SUPERCHARGED AI GENERATOR V2
  const handleAutoGenerateItinerary = async () => {
    if (!canManageTrips) {
      alert("Action refusée : La génération d'itinéraires IA est réservée aux Organisateurs et Administrateurs.");
      return;
    }
    setIsGenerating(true);
    setGenerationStep('🔍 Détection intelligente & géocodage de la destination...');

    try {
      await new Promise(r => setTimeout(r, 400));
      setGenerationStep('🏛️ Sélection des meilleurs points d’intérêt & calcul GPS...');

      const result = await generateFullSmartTrip({
        destinationQuery: genDestination,
        days: genDays,
        pace: genPace,
        theme: genTheme,
        budgetTier: genBudgetTier,
        groupType: genGroupType,
        userId: currentUser?.id || 'usr-default',
        userName: currentUser?.name || 'Moi',
        userCurrency: currentUser?.preferences.currency || 'EUR',
        selectedParticipants: genParticipants.length > 0 ? genParticipants : [currentUser?.name || 'Moi'],
        customStartDate: genStartDate
      });

      setGenerationStep('📅 Agencement du planning journalier sans chevauchement...');
      await new Promise(r => setTimeout(r, 400));

      setGenerationStep('🎒 Préparation du trousseau intelligent & du budget prévisionnel...');
      const createdTrip = await addTrip(result.trip);

      // Save generated places linked to new trip
      const placesWithTripId = result.places.map((p, idx) => ({
        ...p,
        id: `plc-ai-${createdTrip.id}-${idx + 1}-${Date.now()}`,
        tripId: createdTrip.id,
        createdAt: new Date().toISOString()
      }));

      // Map place names to their newly generated IDs for activities
      const placeMap: Record<string, string> = {};
      placesWithTripId.forEach(p => {
        placeMap[p.name] = p.id;
      });

      const activitiesWithTripId = result.activities.map((a, idx) => ({
        ...a,
        id: `act-ai-${createdTrip.id}-${idx + 1}-${Date.now()}`,
        tripId: createdTrip.id,
        placeId: placeMap[a.title] || placesWithTripId[0]?.id,
        createdAt: new Date().toISOString()
      }));

      const expensesWithTripId = result.expenses.map((e, idx) => ({
        ...e,
        id: `exp-ai-${createdTrip.id}-${idx + 1}-${Date.now()}`,
        tripId: createdTrip.id,
        createdAt: new Date().toISOString()
      }));

      await db.places.bulkAdd(placesWithTripId);
      await db.activities.bulkAdd(activitiesWithTripId);
      await db.expenses.bulkAdd(expensesWithTripId);

      // Sync to MongoDB in background
      Promise.all([
        fetch('/api/places', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(placesWithTripId)
        }),
        fetch('/api/activities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(activitiesWithTripId)
        }),
        fetch('/api/expenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(expensesWithTripId)
        })
      ]).catch(err => console.warn('[AI Trips] Sync MongoDB fallback', err));

      setActiveTripId(createdTrip.id);
      setIsGeneratorModalOpen(false);
    } catch (err) {
      console.error('Erreur lors de la génération IA:', err);
      alert("Une erreur est survenue lors de la génération. Veuillez réessayer.");
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  const handleJoinTripSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;
    setJoinFeedback(null);
    const res = await joinTripByCode(joinCodeInput.trim());
    if (res.success) {
      setJoinFeedback(res.message);
      setTimeout(() => {
        setIsJoinModalOpen(false);
        setJoinCodeInput('');
        setJoinFeedback(null);
      }, 1500);
    } else {
      setJoinFeedback(res.message);
    }
  };

  // Packing List actions
  const handleTogglePackItem = async (trip: Trip, itemId: string) => {
    const currentList = trip.packingList || [];
    const updated = currentList.map(item => 
      item.id === itemId ? { ...item, isPacked: !item.isPacked } : item
    );
    await updateTrip(trip.id, { packingList: updated });
    setPackingModalTrip(prev => prev ? { ...prev, packingList: updated } : null);
  };

  const handleAddPackItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!packingModalTrip || !newPackingLabel.trim()) return;
    const newItem: PackingItem = {
      id: `pack-${Date.now()}`,
      label: newPackingLabel.trim(),
      category: newPackingCat,
      isPacked: false,
      assignedTo: currentUser?.name
    };
    const updated = [...(packingModalTrip.packingList || []), newItem];
    await updateTrip(packingModalTrip.id, { packingList: updated });
    setPackingModalTrip(prev => prev ? { ...prev, packingList: updated } : null);
    setNewPackingLabel('');
  };

  const handleDeletePackItem = async (trip: Trip, itemId: string) => {
    const updated = (trip.packingList || []).filter(item => item.id !== itemId);
    await updateTrip(trip.id, { packingList: updated });
    setPackingModalTrip(prev => prev ? { ...prev, packingList: updated } : null);
  };

  const handleRegeneratePackingList = async (trip: Trip) => {
    const dest = await resolveDestinationIntelligence(trip.destination);
    const days = Math.max(2, Math.ceil((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / 86400000));
    const generated = generateSmartPackingList(dest, days, trip.title);
    await updateTrip(trip.id, { packingList: generated });
    setPackingModalTrip(prev => prev ? { ...prev, packingList: generated } : null);
  };

  // Travel Documents actions
  const handleAddDocSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docsModalTrip || !newDocTitle.trim()) return;
    const currentUserId = currentUser?.id || 'usr-default';
    const currentUserName = currentUser?.name || 'Moi';
    const newDoc: TravelDoc = {
      id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId: currentUserId,
      userName: currentUserName,
      isPrivate: true,
      title: newDocTitle.trim(),
      category: newDocCategory,
      referenceCode: newDocCode.trim() || undefined,
      notes: newDocNotes.trim() || undefined,
      fileUrl: newDocFileUrl || undefined,
      uploadedAt: new Date().toISOString()
    };
    const updated = [...(docsModalTrip.travelDocs || []), newDoc];
    await updateTrip(docsModalTrip.id, { travelDocs: updated });
    setDocsModalTrip(prev => prev ? { ...prev, travelDocs: updated } : null);
    setNewDocTitle('');
    setNewDocCode('');
    setNewDocNotes('');
    setNewDocFileUrl('');
  };

  const handleDeleteDoc = async (trip: Trip, docId: string) => {
    const updated = (trip.travelDocs || []).filter(d => d.id !== docId);
    await updateTrip(trip.id, { travelDocs: updated });
    setDocsModalTrip(prev => prev ? { ...prev, travelDocs: updated } : null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setNewDocFileUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Export handlers
  const handleExportIcs = async (trip: Trip) => {
    const acts = await db.activities.where('tripId').equals(trip.id).toArray();
    exportTripToIcs(trip, acts);
  };

  const handleOpenGoogleCalendar = async (trip: Trip) => {
    const acts = await db.activities.where('tripId').equals(trip.id).toArray();
    openInGoogleCalendar(trip, acts);
  };

  const handlePrintRoadbook = async (trip: Trip) => {
    const [places, acts, exps] = await Promise.all([
      db.places.where('tripId').equals(trip.id).toArray(),
      db.activities.where('tripId').equals(trip.id).toArray(),
      db.expenses.where('tripId').equals(trip.id).toArray()
    ]);
    printTripRoadbook(trip, places, acts, exps, userCurrency);
  };

  const handleDuplicate = async (trip: Trip) => {
    if (confirm(`Dupliquer le voyage "${trip.title}" et toutes ses étapes ?`)) {
      await duplicateTrip(trip.id);
    }
  };

  const handleToggleCompleted = async (trip: Trip) => {
    const newStatus: TripStatus = trip.status === 'Terminé' ? 'En cours' : 'Terminé';
    await updateTrip(trip.id, { status: newStatus });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 shadow-md">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-gradient-to-tr from-brand-600 to-amber-500 text-white rounded-xl shadow-lg shadow-brand-500/20">
            <Compass className="w-6 h-6 animate-[spin_20s_linear_infinite]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-white">Voyages & Itinéraires</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
                IA V2 Active
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Générateur intelligent d'itinéraires sur-mesure, trousseau de valise IA, export agenda & documents de voyage.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Join with code button */}
          <button
            onClick={() => setIsJoinModalOpen(true)}
            className="flex items-center space-x-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors shadow-sm"
          >
            <Share2 className="w-4 h-4 text-brand-400" />
            <span>Rejoindre avec un Code</span>
          </button>

          {canManageTrips ? (
            <>
              <button
                onClick={() => setIsGeneratorModalOpen(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 text-xs font-extrabold rounded-xl shadow-lg shadow-amber-500/25 transition-all transform hover:-translate-y-0.5"
              >
                <Sparkles className="w-4 h-4 text-slate-950" />
                <span>Générer Itinéraire IA V2</span>
              </button>

              <button
                onClick={handleOpenCreate}
                className="flex items-center space-x-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-brand-500/25 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Nouveau Voyage</span>
              </button>
            </>
          ) : (
            <div className="flex items-center space-x-2 px-3.5 py-2 bg-slate-800/80 rounded-xl border border-slate-700 text-xs text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Rôle Voyageur : Consultation & Choix</span>
            </div>
          )}
        </div>
      </div>

      {/* Trips Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
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
            🏛️ Historique Passé ({pastTrips.length})
          </button>
        </div>

        <div className="text-[11px] text-slate-400 hidden sm:block">
          {activeTrip ? (
            <span>Voyage actif : <strong className="text-white">{activeTrip.title}</strong></span>
          ) : (
            <span>Sélectionnez un voyage ci-dessous pour l'activer</span>
          )}
        </div>
      </div>

      {/* Trips Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayedTrips.map(trip => {
          const isActive = activeTrip?.id === trip.id;
          const isPast = isPastTrip(trip);
          const countdown = getTripCountdownBadge(trip);
          const packingCount = trip.packingList?.length || 0;
          const packedCount = trip.packingList?.filter(i => i.isPacked).length || 0;
          const docsCount = trip.travelDocs?.length || 0;

          return (
            <div
              key={trip.id}
              className={`group relative rounded-2xl overflow-hidden border transition-all duration-300 flex flex-col justify-between ${
                isActive
                  ? 'border-brand-500 shadow-xl shadow-brand-500/15 bg-slate-900 ring-1 ring-brand-500/40'
                  : 'border-slate-800 bg-slate-900/80 hover:border-slate-700 hover:shadow-lg'
              }`}
            >
              <div>
                {/* Cover Image & Badges */}
                <div className="relative h-48 w-full overflow-hidden bg-slate-950">
                  <img
                    src={trip.coverImage}
                    alt={trip.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                  {/* Top-left: Status & Countdown pills */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold backdrop-blur-md shadow-sm border ${
                        trip.status === 'En cours'
                          ? 'bg-emerald-500/90 text-white border-emerald-400/50'
                          : trip.status === 'Planifié'
                          ? 'bg-sky-500/90 text-white border-sky-400/50'
                          : trip.status === 'Terminé'
                          ? 'bg-purple-600/90 text-white border-purple-400/50'
                          : 'bg-amber-500/90 text-slate-950 border-amber-400/50'
                      }`}
                    >
                      {trip.status}
                    </span>

                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border backdrop-blur-md shadow-sm ${countdown.className}`}>
                      {countdown.label}
                    </span>
                  </div>

                  {/* Top-right: Active trip indicator & Share code button */}
                  <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
                    {isActive && (
                      <div className="bg-brand-500 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center space-x-1 shadow-md">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Actif</span>
                      </div>
                    )}

                    {trip.shareCode && (
                      <button
                        onClick={() => copyShareCode(trip.shareCode!)}
                        className="px-2 py-0.5 bg-slate-950/80 hover:bg-slate-900 border border-slate-700/80 rounded-lg text-[10px] text-slate-300 font-mono flex items-center space-x-1 backdrop-blur-md transition-colors"
                        title="Cliquer pour copier le code de partage du voyage"
                      >
                        {copiedShareCode === trip.shareCode ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400 font-bold">Copié !</span>
                          </>
                        ) : (
                          <>
                            <Share2 className="w-3 h-3 text-amber-400" />
                            <span>{trip.shareCode}</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Destination overlay text */}
                  <div className="absolute bottom-3 left-4 right-4">
                    <div className="flex items-center space-x-1 text-xs text-brand-300 font-semibold mb-0.5">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{trip.destination} • {trip.country}</span>
                    </div>
                    <h3 className="text-base font-bold text-white truncate drop-shadow-md">{trip.title}</h3>
                  </div>
                </div>

                {/* Trip Details Body */}
                <div className="p-4 space-y-3.5">
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
                    </div>
                  </div>

                  {/* Participants : Le Voyageur voit le nombre de participants, Admin & Organisateur voient la liste complète */}
                  <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                    <Users className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    {currentUser?.role === 'Traveler' ? (
                      <span className="font-medium text-slate-300">
                        {trip.participants?.length || 0} participant{(trip.participants?.length || 0) > 1 ? 's' : ''} au voyage
                      </span>
                    ) : (
                      <span className="truncate font-medium text-slate-300" title={trip.participants && trip.participants.length > 0 ? 'Participants : ' + trip.participants.join(', ') : 'Aucun participant'}>
                        <strong className="text-amber-300 font-semibold">{trip.participants?.length || 0} participant{(trip.participants?.length || 0) > 1 ? 's' : ''} :</strong> {trip.participants && trip.participants.length > 0 ? trip.participants.join(', ') : 'Aucun'}
                      </span>
                    )}
                  </div>

                  {/* Destination Meta Highlights */}
                  {trip.destinationMeta && (
                    <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-300 grid grid-cols-2 gap-1.5">
                      {trip.destinationMeta.timezone && (
                        <div className="truncate text-slate-400" title={trip.destinationMeta.timezone}>
                          ⏰ {trip.destinationMeta.timezone.split(' ')[0]}
                        </div>
                      )}
                      {trip.destinationMeta.emergencyNumbers && (
                        <div className="truncate text-amber-300" title={`Police: ${trip.destinationMeta.emergencyNumbers.police} | Médical: ${trip.destinationMeta.emergencyNumbers.ambulance}`}>
                          🚨 Urgence: {trip.destinationMeta.emergencyNumbers.police}
                        </div>
                      )}
                      {trip.destinationMeta.plugType && (
                        <div className="truncate text-slate-400" title={trip.destinationMeta.plugType}>
                          🔌 {trip.destinationMeta.plugType.split('(')[0]}
                        </div>
                      )}
                      {trip.destinationMeta.bestMonths && (
                        <div className="truncate text-emerald-400" title={trip.destinationMeta.bestMonths}>
                          ☀️ {trip.destinationMeta.bestMonths}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Summary */}
                  {trip.itinerarySummary && (
                    <p className="text-xs text-slate-400 line-clamp-2 italic bg-slate-950/40 p-2 rounded-lg border border-slate-800/80">
                      « {trip.itinerarySummary} »
                    </p>
                  )}

                  {/* Feature Quick Badges: Packing & Docs */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => setPackingModalTrip(trip)}
                      className={`flex-1 flex items-center justify-center space-x-1.5 py-1.5 px-2 rounded-xl border text-[11px] font-semibold transition-colors ${
                        packingCount > 0 && packedCount === packingCount
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                          : packingCount > 0
                          ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                          : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                    >
                      <Luggage className="w-3.5 h-3.5" />
                      <span>Valise {packingCount > 0 ? `(${packedCount}/${packingCount})` : ''}</span>
                    </button>

                    <button
                      onClick={() => setDocsModalTrip(trip)}
                      className={`flex-1 flex items-center justify-center space-x-1.5 py-1.5 px-2 rounded-xl border text-[11px] font-semibold transition-colors ${
                        docsCount > 0
                          ? 'bg-sky-500/10 text-sky-300 border-sky-500/30 hover:bg-sky-500/20'
                          : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Documents {docsCount > 0 ? `(${docsCount})` : ''}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom Actions Footer */}
              <div className="p-3 pt-2 border-t border-slate-800 flex items-center justify-between gap-1.5">
                <div className="flex items-center space-x-1 flex-shrink-0">
                  {!isPast ? (
                    <button
                      onClick={() => setActiveTripId(trip.id)}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg flex items-center space-x-1 transition-colors ${
                        isActive
                          ? 'bg-brand-500/25 text-brand-300 border border-brand-500/40'
                          : 'bg-slate-800 hover:bg-brand-600 hover:text-white text-slate-300'
                      }`}
                      title={isActive ? 'Voyage actuellement actif' : 'Activer ce voyage'}
                    >
                      <span>{isActive ? 'Actif' : 'Sélectionner'}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  ) : (
                    <span 
                      className="text-[10px] font-semibold text-purple-300 bg-purple-950/80 px-2 py-0.5 rounded-md border border-purple-800/60 flex-shrink-0" 
                      title="Voyage archivé"
                    >
                      Archivé
                    </span>
                  )}

                  {canManageTrips && (
                    <button
                      onClick={() => handleToggleCompleted(trip)}
                      className={`text-[10px] px-1.5 py-0.5 rounded-md border transition-colors flex-shrink-0 ${
                        trip.status === 'Terminé'
                          ? 'bg-purple-500/10 text-purple-300 border-purple-500/30 hover:bg-purple-500/20'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                      title={trip.status === 'Terminé' ? 'Cliquer pour réactiver' : 'Marquer comme terminé'}
                    >
                      {trip.status === 'Terminé' ? '✓' : 'Finir'}
                    </button>
                  )}
                </div>

                <div className="flex items-center space-x-1 flex-wrap justify-end gap-y-1">
                  {/* Open in Google Calendar (Bouton compact avec icône) */}
                  <button
                    onClick={() => handleOpenGoogleCalendar(trip)}
                    className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 rounded-lg border border-blue-500/30 transition-all flex items-center justify-center flex-shrink-0"
                    title="Google Calendar : synchroniser et ouvrir directement dans l'agenda"
                  >
                    <Calendar className="w-4 h-4 text-blue-400" />
                  </button>

                  {/* Print Roadbook */}
                  <button
                    onClick={() => handlePrintRoadbook(trip)}
                    className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors flex-shrink-0"
                    title="Imprimer / Fiche Voyage PDF"
                  >
                    <Printer className="w-4 h-4" />
                  </button>

                  {/* Chat / Discussion de l'équipe */}
                  <button
                    onClick={() => {
                      setSelectedFeatureTrip(trip);
                      setActiveFeatureTab('collab');
                      setShowFeaturesModal(true);
                    }}
                    className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors flex-shrink-0"
                    title="Discussion de l'équipe (Chat en direct)"
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-400" />
                  </button>

                  {/* Fonctionnalités Avancées */}
                  <button
                    onClick={() => {
                      setSelectedFeatureTrip(trip);
                      setShowFeaturesModal(true);
                    }}
                    className="p-1.5 text-slate-400 hover:text-brand-400 hover:bg-brand-500/10 rounded-lg transition-colors group relative flex-shrink-0"
                    title="Fonctionnalités avancées"
                  >
                    <Target className="w-4 h-4" />
                    <span className="absolute -top-6 right-0 bg-brand-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                      NOUVEAU
                    </span>
                  </button>

                  {canManageTrips && (
                    <>
                      {/* Duplicate */}
                      <button
                        onClick={() => handleDuplicate(trip)}
                        className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors flex-shrink-0"
                        title="Dupliquer ce voyage"
                      >
                        <Copy className="w-4 h-4" />
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => handleOpenEdit(trip)}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex-shrink-0"
                        title="Modifier"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => {
                          if (confirm(`Supprimer définitivement "${trip.title}" ?`)) {
                            deleteTrip(trip.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors flex-shrink-0"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL 1: AI GENERATOR V2 */}
      <Modal
        isOpen={isGeneratorModalOpen}
        onClose={() => !isGenerating && setIsGeneratorModalOpen(false)}
        title="Générateur d'Itinéraire IA V2 & Organisateur Complet"
        subtitle="Détection de destination avec tolérance orthographique, planning dynamique, valise intelligente & budget prévisionnel"
      >
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/15 via-amber-600/10 to-amber-700/15 border border-amber-500/30 text-xs text-amber-200">
            ✨ <strong>Moteur IA V2</strong> : Analyse la destination, corrige l'orthographe, sélectionne de véritables points d'intérêt, organise les créneaux horaires sans conflit, injecte le budget et prépare votre trousseau de valise.
          </div>

          {/* Destination input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Destination / Ville (Tolérance aux fautes d'orthographe)
            </label>
            <input
              type="text"
              value={genDestination}
              onChange={e => setGenDestination(e.target.value)}
              placeholder="ex: djerba, brcelon, tokio, rome, marakech, paris, tozeur..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
            />
            {/* Quick popular pills */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {['Tunis, Tunisie', 'Djerba, Tunisie', 'Tozeur, Tunisie', 'Sousse, Tunisie', 'Hammamet, Tunisie', 'Barcelone, Espagne', 'Paris, France', 'Rome, Italie', 'Madrid, Espagne', 'Istanbul, Turquie', 'Tokyo, Japon', 'New York, États-Unis'].map(dest => (
                <button
                  type="button"
                  key={dest}
                  onClick={() => setGenDestination(dest)}
                  className={`text-[10px] px-2 py-0.5 rounded-lg border transition-colors ${
                    genDestination === dest
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  {dest.split(',')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Duration & Start date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Durée du séjour ({genDays} jours)
              </label>
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
                <span>Circuit (14j)</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Date de départ</label>
              <input
                type="date"
                value={genStartDate}
                onChange={e => setGenStartDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Pace & Budget tier */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Rythme de visite</label>
              <select
                value={genPace}
                onChange={e => setGenPace(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="Relaxed">🌿 Relaxé (1 à 2 étapes/j)</option>
                <option value="Balanced">⚖️ Équilibré (3 étapes/j)</option>
                <option value="Intense">⚡ Intensif (4 étapes/j)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Profil de Budget</label>
              <select
                value={genBudgetTier}
                onChange={e => setGenBudgetTier(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="Économique">🎒 Éco / Backpacker (~45€/n)</option>
                <option value="Équilibré">🏨 Équilibré (~95€/n)</option>
                <option value="Confort">💎 Confort / Premium (~190€/n)</option>
              </select>
            </div>
          </div>

          {/* Theme selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Thématique Principale</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                'Culture & Histoire', 
                'Gastronomie & Vins', 
                'Nature & Randonnée', 
                'Plage & Détente', 
                'Aventure & Découverte'
              ].map(t => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setGenTheme(t)}
                  className={`py-1.5 px-2.5 rounded-lg border text-xs text-left transition-colors truncate ${
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

          {/* Real Participants from Platform Users */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Associer des membres du projet au séjour
            </label>
            <div className="flex flex-wrap gap-2">
              {allUsers.map(user => {
                const isSelected = genParticipants.includes(user.name);
                return (
                  <button
                    type="button"
                    key={user.id}
                    onClick={() => {
                      setGenParticipants(prev => 
                        prev.includes(user.name) ? prev.filter(p => p !== user.name) : [...prev, user.name]
                      );
                    }}
                    className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-xl border text-xs transition-all ${
                      isSelected
                        ? 'bg-brand-600/30 text-brand-300 border-brand-500 font-semibold'
                        : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    <img src={user.avatar} alt={user.name} className="w-4 h-4 rounded-full object-cover" />
                    <span>{user.name}</span>
                    {isSelected && <Check className="w-3 h-3 text-brand-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Generating step indicator */}
          {isGenerating && (
            <div className="p-3 rounded-xl bg-slate-900 border border-amber-500/30 text-xs text-amber-300 flex items-center space-x-2 animate-pulse">
              <Sparkles className="w-4 h-4 text-amber-400 animate-spin flex-shrink-0" />
              <span>{generationStep || 'Calcul de l’itinéraire optimal...'}</span>
            </div>
          )}

          <div className="pt-3 flex justify-end space-x-3 border-t border-slate-800">
            <button
              type="button"
              disabled={isGenerating}
              onClick={() => setIsGeneratorModalOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold rounded-xl"
            >
              Annuler
            </button>
            <button
              type="button"
              disabled={isGenerating}
              onClick={handleAutoGenerateItinerary}
              className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-extrabold rounded-xl shadow-lg shadow-amber-500/25 flex items-center space-x-2"
            >
              {isGenerating ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Génération en cours...</span>
                </>
              ) : (
                <>
                  <PlaneTakeoff className="w-4 h-4" />
                  <span>Lancer la Génération IA</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL 2: SMART PACKING LIST */}
      <Modal
        isOpen={!!packingModalTrip}
        onClose={() => setPackingModalTrip(null)}
        title={`Valise Intelligente • ${packingModalTrip?.title || ''}`}
        subtitle="Checklist dynamique adaptée à la météo et aux activités prévues"
      >
        {packingModalTrip && (
          <div className="space-y-4">
            {/* Progress Bar */}
            {(() => {
              const list = packingModalTrip.packingList || [];
              const total = list.length;
              const packed = list.filter(i => i.isPacked).length;
              const pct = total > 0 ? Math.round((packed / total) * 100) : 0;
              return (
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">Progression de la Valise :</span>
                    <span className="font-bold text-amber-400">{packed} / {total} articles emballés ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })()}

            {/* Category filter pills & Regenerate button */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <div className="flex flex-wrap gap-1">
                {['all', 'Vêtements', 'Documents', 'Hygiène & Soins', 'Électronique', 'Spécifique Destination'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedPackingCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                      selectedPackingCategory === cat
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {cat === 'all' ? 'Tous' : cat}
                  </button>
                ))}
              </div>

              <button
                onClick={() => handleRegeneratePackingList(packingModalTrip)}
                className="text-[11px] text-amber-400 hover:text-amber-300 font-bold flex items-center space-x-1"
                title="Régénérer automatiquement selon la destination et la météo"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Régénérer IA</span>
              </button>
            </div>

            {/* Packing Items List */}
            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {(() => {
                const list = packingModalTrip.packingList || [];
                const filtered = selectedPackingCategory === 'all'
                  ? list
                  : list.filter(i => i.category === selectedPackingCategory);

                if (filtered.length === 0) {
                  return (
                    <div className="text-center py-6 text-xs text-slate-500">
                      Aucun article dans cette catégorie. Ajoutez-en un ci-dessous !
                    </div>
                  );
                }

                return filtered.map(item => (
                  <div
                    key={item.id}
                    onClick={() => handleTogglePackItem(packingModalTrip, item.id)}
                    className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      item.isPacked
                        ? 'bg-emerald-950/30 border-emerald-500/30 text-slate-400 line-through'
                        : 'bg-slate-800/60 border-slate-700/80 text-white hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 truncate">
                      <div className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                        item.isPacked ? 'bg-emerald-500 border-emerald-400 text-slate-950' : 'border-slate-600'
                      }`}>
                        {item.isPacked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className="text-xs truncate">{item.label}</span>
                    </div>

                    <div className="flex items-center space-x-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                        {item.category}
                      </span>
                      <button
                        onClick={() => handleDeletePackItem(packingModalTrip, item.id)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ));
              })()}
            </div>

            {/* Add New Item Form */}
            <form onSubmit={handleAddPackItem} className="pt-2 border-t border-slate-800 flex gap-2">
              <input
                type="text"
                value={newPackingLabel}
                onChange={e => setNewPackingLabel(e.target.value)}
                placeholder="Ajouter un article (ex: Maillot de bain)..."
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
              <select
                value={newPackingCat}
                onChange={e => setNewPackingCat(e.target.value as PackingCategory)}
                className="bg-slate-800 border border-slate-700 rounded-xl px-2 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="Vêtements">Vêtements</option>
                <option value="Documents">Documents</option>
                <option value="Hygiène & Soins">Hygiène</option>
                <option value="Électronique">Électro</option>
                <option value="Spécifique Destination">Spécifique</option>
              </select>
              <button
                type="submit"
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl"
              >
                Ajouter
              </button>
            </form>
          </div>
        )}
      </Modal>

      {/* MODAL 3: TRAVEL DOCUMENTS & VAULT */}
      <Modal
        isOpen={!!docsModalTrip}
        onClose={() => setDocsModalTrip(null)}
        title={`Coffre-fort Documents • ${docsModalTrip?.title || ''}`}
        subtitle="Billets d'avion, vouchers d'hôtel et polices d'assurance sécurisés pour vos voyages"
      >
        {docsModalTrip && (
          <div className="space-y-4">
            {/* Existing Documents List */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {(docsModalTrip.travelDocs || []).filter(d => d.userId === (currentUser?.id || 'usr-default') || (!d.userId && docsModalTrip.userId === (currentUser?.id || 'usr-default'))).length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500 space-y-1">
                  <FileText className="w-8 h-8 text-slate-600 mx-auto" />
                  <p>Aucun document ou bon de réservation enregistré.</p>
                </div>
              ) : (
                (docsModalTrip.travelDocs || []).filter(d => d.userId === (currentUser?.id || 'usr-default') || (!d.userId && docsModalTrip.userId === (currentUser?.id || 'usr-default'))).map(doc => (
                  <div key={doc.id} className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-between gap-3 text-xs">
                    <div className="space-y-0.5 truncate">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white truncate">{doc.title}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-600/40 font-semibold">
                          {doc.category}
                        </span>
                      </div>
                      {doc.referenceCode && (
                        <p className="text-[11px] text-amber-300 font-mono">
                          Réf / PNR : {doc.referenceCode}
                        </p>
                      )}
                      {doc.notes && <p className="text-[10px] text-slate-400 italic truncate">{doc.notes}</p>}
                    </div>

                    <div className="flex items-center space-x-2 flex-shrink-0">
                      {doc.fileUrl && (
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-[10px] font-semibold flex items-center space-x-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Voir</span>
                        </a>
                      )}
                      <button
                        onClick={() => handleDeleteDoc(docsModalTrip, doc.id)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add Document Form */}
            <form onSubmit={handleAddDocSubmit} className="pt-3 border-t border-slate-800 space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  setSelectedFeatureTrip(docsModalTrip);
                  setActiveFeatureTab('vault');
                  setShowFeaturesModal(true);
                  setDocsModalTrip(null);
                }}
                className="w-full py-2 bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-indigo-600/20 hover:from-indigo-600/30 hover:to-purple-600/30 text-indigo-300 border border-indigo-500/40 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all mb-3 shadow-sm"
              >
                <Shield className="w-4 h-4 text-indigo-400" />
                <span>Ouvrir mon Coffre-Fort Chiffré Personnel (AES-256)</span>
              </button>

              <span className="block text-xs font-bold text-white">Ajouter un justificatif ou voucher personnel</span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  value={newDocTitle}
                  onChange={e => setNewDocTitle(e.target.value)}
                  placeholder="ex: Billet Aller-Retour TU712"
                  className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                />
                <select
                  value={newDocCategory}
                  onChange={e => setNewDocCategory(e.target.value as TravelDocCategory)}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-2 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="Vol / Billet">Vol / Billet</option>
                  <option value="Hôtel / Logement">Hôtel / Logement</option>
                  <option value="Assurance">Assurance voyage</option>
                  <option value="Identité / Visa">Identité / Visa</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={newDocCode}
                  onChange={e => setNewDocCode(e.target.value)}
                  placeholder="Code PNR / Réf réservation (ex: 6K9L2Z)"
                  className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                />
                <label className="flex items-center justify-center space-x-2 px-3 py-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl text-xs text-slate-300 cursor-pointer">
                  <Upload className="w-3.5 h-3.5 text-sky-400" />
                  <span className="truncate">{newDocFileUrl ? 'Pièce jointe prête ✓' : 'Joindre un fichier / photo'}</span>
                  <input type="file" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newDocNotes}
                  onChange={e => setNewDocNotes(e.target.value)}
                  placeholder="Remarques (ex: Borne 2A, bagage 10kg inclus)"
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>

      {/* MODAL 4: JOIN TRIP WITH CODE */}
      <Modal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        title="Rejoindre un Voyage Organisé"
        subtitle="Saisissez le code de partage à 6 caractères transmis par l'organisateur"
      >
        <form onSubmit={handleJoinTripSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Code de Partage (ex: TRIP-7X4K)
            </label>
            <input
              type="text"
              required
              value={joinCodeInput}
              onChange={e => setJoinCodeInput(e.target.value.toUpperCase())}
              placeholder="TRIP-XXXX"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-center text-lg font-mono font-bold tracking-widest text-amber-400 focus:outline-none focus:border-amber-500"
            />
          </div>

          {joinFeedback && (
            <div className={`p-3 rounded-xl text-xs ${
              joinFeedback.includes('succès') || joinFeedback.includes('rejoint')
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                : 'bg-rose-950/80 text-rose-300 border border-rose-500/40'
            }`}>
              {joinFeedback}
            </div>
          )}

          <div className="pt-2 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsJoinModalOpen(false)}
              className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl"
            >
              Fermer
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-brand-500/25"
            >
              Valider & Rejoindre
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 5: MANUAL CREATE / EDIT TRIP */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={editingTrip ? 'Modifier le Voyage' : 'Nouveau Voyage'}
        subtitle="Renseignez les détails généraux de votre séjour"
      >
        <form onSubmit={handleSaveTrip} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Titre du voyage</label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="ex: Roadtrip Côte Ouest ou Échappée Djerba"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Destination / Ville</label>
              <input
                type="text"
                required
                value={destination}
                onChange={e => setDestination(e.target.value)}
                placeholder="ex: Djerba"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Pays</label>
              <input
                type="text"
                value={country}
                onChange={e => setCountry(e.target.value)}
                placeholder="ex: Tunisie"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* Suggestions de destinations réelles certifiées */}
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block mb-1">
              ✨ Destinations suggérées (photos et informations certifiées) :
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { city: 'Djerba', country: 'Tunisie', cover: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop&q=85' },
                { city: 'Tunis', country: 'Tunisie', cover: 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?w=1200&auto=format&fit=crop&q=85' },
                { city: 'Tozeur', country: 'Tunisie', cover: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=1200&auto=format&fit=crop&q=85' },
                { city: 'Paris', country: 'France', cover: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&auto=format&fit=crop&q=85' },
                { city: 'Rome', country: 'Italie', cover: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1200&auto=format&fit=crop&q=85' },
                { city: 'Barcelone', country: 'Espagne', cover: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=1200&auto=format&fit=crop&q=85' },
                { city: 'Tokyo', country: 'Japon', cover: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1200&auto=format&fit=crop&q=85' },
              ].map(sug => (
                <button
                  type="button"
                  key={sug.city}
                  onClick={() => {
                    setDestination(sug.city);
                    setCountry(sug.country);
                    setCoverImage(sug.cover);
                    if (!title || title.startsWith('Voyage à') || title.startsWith('Échappée à')) {
                      setTitle(`Échappée à ${sug.city}`);
                    }
                  }}
                  className={`text-[10px] px-2 py-0.5 rounded-lg border transition-all ${
                    destination.toLowerCase() === sug.city.toLowerCase()
                      ? 'bg-brand-500/25 text-brand-300 border-brand-500/50 font-bold'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  📍 {sug.city} ({sug.country})
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
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

          <div className="grid grid-cols-2 gap-3">
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
                <option value="TND">TND (DT)</option>
                <option value="USD">USD ($)</option>
                <option value="GBP">GBP (£)</option>
                <option value="JPY">JPY (¥)</option>
              </select>
            </div>
          </div>

          {/* Cover image with AI helper */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-300">Photo de couverture</label>
              <button
                type="button"
                onClick={() => {
                  if (destination.trim()) {
                    setCoverImage(getDestinationCover(destination));
                  } else {
                    alert("Saisissez d'abord une destination.");
                  }
                }}
                className="text-[11px] text-amber-400 hover:text-amber-300 font-bold flex items-center space-x-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Trouver image HD par IA</span>
              </button>
            </div>
            <input
              type="url"
              value={coverImage}
              onChange={e => setCoverImage(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          {/* Select real project members as participants */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Participants parmi les membres du projet
            </label>
            <div className="flex flex-wrap gap-2">
              {allUsers.map(user => {
                const isSelected = selectedParticipants.includes(user.name);
                return (
                  <button
                    type="button"
                    key={user.id}
                    onClick={() => handleToggleParticipant(user.name)}
                    className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-xl border text-xs transition-all ${
                      isSelected
                        ? 'bg-brand-600/30 text-brand-300 border-brand-500 font-semibold'
                        : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    <img src={user.avatar} alt={user.name} className="w-4 h-4 rounded-full object-cover" />
                    <span>{user.name}</span>
                    {isSelected && <Check className="w-3 h-3 text-brand-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-3 flex justify-end space-x-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold rounded-xl"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-brand-500/30"
            >
              {editingTrip ? 'Mettre à jour' : 'Enregistrer le Voyage'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ========== MODAL FONCTIONNALITÉS AVANCÉES ========== */}
      <Modal
        isOpen={showFeaturesModal}
        onClose={() => {
          setShowFeaturesModal(false);
          setSelectedFeatureTrip(null);
          setActiveFeatureTab('score'); // Reset to first tab
        }}
        title="Outils de Voyage"
        subtitle={selectedFeatureTrip ? `${selectedFeatureTrip.title} • ${selectedFeatureTrip.destination}` : ''}
      >
        {selectedFeatureTrip && (
          <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar">
            
            {/* Onglets de navigation */}
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3 sticky top-0 bg-slate-900 z-10">
              <button 
                onClick={() => setActiveFeatureTab('score')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  activeFeatureTab === 'score' 
                    ? 'bg-brand-600 text-white' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                🎯 Score
              </button>
              <button 
                onClick={() => setActiveFeatureTab('weather')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  activeFeatureTab === 'weather' 
                    ? 'bg-brand-600 text-white' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                🌦️ Météo
              </button>
              <button 
                onClick={() => setActiveFeatureTab('vault')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  activeFeatureTab === 'vault' 
                    ? 'bg-brand-600 text-white' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                🔐 Coffre
              </button>
              <button 
                onClick={() => setActiveFeatureTab('collab')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  activeFeatureTab === 'collab' 
                    ? 'bg-brand-600 text-white' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                🤝 Collab
              </button>
            </div>

            {/* ========== WIDGET 1: SCORE DE PRÉPARATION ========== */}
            {activeFeatureTab === 'score' && (
              <div className="space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <span className="text-2xl">🎯</span>
                    <span>Score de Préparation du Voyage</span>
                  </h3>
                  <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 font-bold">
                    NOUVEAU
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Évaluation intelligente de votre état de préparation avec suggestions personnalisées
                </p>
                <TripReadinessWidget trip={selectedFeatureTrip} />
              </div>
            )}

            {/* ========== WIDGET 2: MÉTÉO INTELLIGENTE ========== */}
            {activeFeatureTab === 'weather' && (
              <div className="space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <span className="text-2xl">🌦️</span>
                    <span>Météo & Prévisions</span>
                  </h3>
                  <span className="text-xs bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded-full border border-sky-500/30 font-bold">
                    TEMPS RÉEL
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Conditions actuelles + prévisions 7 jours avec alertes automatiques
                </p>
                <TripWeatherWidget 
                  trip={selectedFeatureTrip} 
                  latitude={35.5} 
                  longitude={10.8} 
                />
              </div>
            )}

            {/* ========== WIDGET 3: COFFRE-FORT SÉCURISÉ ========== */}
            {activeFeatureTab === 'vault' && (
              <div className="space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <span className="text-2xl">🔐</span>
                    <span>Coffre-Fort Documents Chiffrés</span>
                  </h3>
                  <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30 font-bold flex items-center space-x-1">
                    <span>🛡️</span>
                    <span>AES-256</span>
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Protection militaire pour vos passeports, cartes bancaires et documents sensibles
                </p>
                <SecureDocumentVault 
                  trip={selectedFeatureTrip} 
                  currentUser={currentUser} 
                  onUpdateTrip={async (updates) => {
                    await updateTrip(selectedFeatureTrip.id, updates);
                    // Recharger le voyage pour refléter les changements
                    const updatedTrip = trips.find(t => t.id === selectedFeatureTrip.id);
                    if (updatedTrip) setSelectedFeatureTrip(updatedTrip);
                  }}
                />
              </div>
            )}

            {/* ========== WIDGET 4: COLLABORATION TEMPS RÉEL ========== */}
            {activeFeatureTab === 'collab' && currentUser && (
              <div className="space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <span className="text-2xl">🤝</span>
                    <span>Collaboration Temps Réel</span>
                  </h3>
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                    <span className="text-xs text-emerald-400 font-bold">LIVE</span>
                  </div>
                </div>
                <p className="text-xs text-slate-400">
                  Chat intégré, participants en ligne et notifications d'activité en direct
                </p>
                <CollaborationPanel 
                  trip={selectedFeatureTrip} 
                  currentUser={{
                    id: currentUser.id,
                    name: currentUser.name,
                    avatar: currentUser.avatar
                  }}
                  participants={selectedFeatureTrip.participants || []}
                  allUsers={allUsers}
                />
              </div>
            )}

          </div>
        )}
      </Modal>
    </div>
  );
};
