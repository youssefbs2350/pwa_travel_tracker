import React, { useState, useEffect } from 'react';
import { 
  AlertCircle, 
  Plus, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ShieldAlert, 
  FileText, 
  DollarSign, 
  User, 
  Calendar,
  MessageSquare,
  ShieldCheck,
  Send,
  Sparkles,
  Lock,
  Mail,
  Bot,
  Zap,
  Check,
  RotateCcw,
  Info,
  History,
  ArrowRight,
  UserCheck,
  FolderOpen,
  Inbox
} from 'lucide-react';

import { useTrips } from '../../context/TripContext';
import { useAuth } from '../../context/AuthContext';
import { Complaint, ComplaintPriority, ComplaintStatus, ComplaintHistoryEntry } from '../../types';
import { Modal } from '../common/Modal';
import { api } from '../../services/api';
import { predictComplaintWithAI, AIPredictionResult } from '../../utils/complaintAI';

type ViewTab = 'my_complaints' | 'all' | 'pending';

export const ComplaintsView: React.FC = () => {
  const { activeTrip } = useTrips();
  const { currentUser } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Navigation Tabs: "Mes réclamations créées" vs "Toutes" vs "À traiter"
  const [activeTab, setActiveTab] = useState<ViewTab>(
    currentUser?.role === 'Traveler' ? 'my_complaints' : 'all'
  );
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Complaint['category']>('Transport / Vol');
  const [priority, setPriority] = useState<ComplaintPriority>('Haute');
  const [description, setDescription] = useState('');
  const [requestedCompensation, setRequestedCompensation] = useState('200 EUR');

  // AI Prediction & User Manual Override States
  const [aiPrediction, setAiPrediction] = useState<AIPredictionResult | null>(null);
  const [isManualCategory, setIsManualCategory] = useState(false);
  const [isManualPriority, setIsManualPriority] = useState(false);

  // Status Notification Toast / Banner (Email notification feedback)
  const [statusNotification, setStatusNotification] = useState<{
    type: 'success' | 'info' | 'error';
    message: string;
  } | null>(null);

  // Admin / Organizer resolution notes state
  const [resolutionNoteInput, setResolutionNoteInput] = useState('');
  const [awardedCompensationInput, setAwardedCompensationInput] = useState('');

  // Real-time AI Classification & Urgency Assessment
  useEffect(() => {
    if (title.trim().length >= 3 || description.trim().length >= 3) {
      const pred = predictComplaintWithAI(title, description);
      setAiPrediction(pred);

      // Auto-assign category if not manually overridden
      if (!isManualCategory) {
        setCategory(pred.category);
      }
      // Auto-assign urgency level if not manually overridden
      if (!isManualPriority) {
        setPriority(pred.priority);
      }
    } else {
      setAiPrediction(null);
    }
  }, [title, description, isManualCategory, isManualPriority]);

  // Reset manual overrides and revert to AI predictions
  const handleResetToAIPrediction = () => {
    if (aiPrediction) {
      setCategory(aiPrediction.category);
      setPriority(aiPrediction.priority);
    }
    setIsManualCategory(false);
    setIsManualPriority(false);
  };

  const loadComplaints = async () => {
    if (!activeTrip) return;
    const items = await api.complaints.getByTrip(activeTrip.id);
    setComplaints(items);
  };

  useEffect(() => {
    loadComplaints();
  }, [activeTrip?.id]);

  const handleCreateComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTrip) {
      alert("Veuillez sélectionner un voyage valide.");
      return;
    }

    if (activeTrip.status === 'Brouillon') {
      alert("Action refusée : Vous ne pouvez pas déposer de réclamation sur un voyage encore au statut Brouillon.");
      return;
    }

    const created = await api.complaints.create({
      tripId: activeTrip.id,
      userId: currentUser?.id || 'usr-default',
      userEmail: currentUser?.email,
      userName: currentUser?.name || 'Voyageur',
      title,
      category,
      priority,
      status: 'Soumis',
      description,
      requestedCompensation,
      incidentDate: new Date().toISOString().split('T')[0]
    });

    await loadComplaints();
    if (created) {
      setSelectedComplaint(created);
    }
    setIsAddModalOpen(false);
    setTitle('');
    setDescription('');
    setIsManualCategory(false);
    setIsManualPriority(false);
    setAiPrediction(null);
  };

  // Advanced Feature: Workflow Resolution & Arbitration + Email Notification + History Entry
  const handleUpdateStatus = async (id: string, newStatus: ComplaintStatus) => {
    const res = await api.complaints.update(id, {
      status: newStatus,
      resolutionNotes: resolutionNoteInput || selectedComplaint?.resolutionNotes,
      awardedCompensation: awardedCompensationInput || selectedComplaint?.awardedCompensation,
      byUserId: currentUser?.id,
      byUserName: currentUser?.name || 'Support Travel Tracker',
      byUserRole: currentUser?.role || 'Admin'
    });

    if (res?.emailSent) {
      setStatusNotification({
        type: 'success',
        message: `✉️ Notification email envoyée avec succès à l'auteur de la réclamation !`
      });
    } else if (res?.emailStatusMessage) {
      setStatusNotification({
        type: 'info',
        message: `Statut mis à jour (${res.emailStatusMessage})`
      });
    }

    await loadComplaints();
    if (selectedComplaint && selectedComplaint.id === id) {
      const updatedHistory: ComplaintHistoryEntry[] = res?.history || [
        ...(selectedComplaint.history || []),
        {
          id: 'hist-' + Date.now(),
          action: newStatus === 'Résolu' 
            ? 'Arbitrage Favorable & Résolution' 
            : newStatus === 'Rejeté' 
            ? 'Dossier Rejeté & Clôturé' 
            : 'Prise en charge & Mise en analyse',
          date: new Date().toISOString(),
          byUserId: currentUser?.id,
          byUserName: currentUser?.name || 'Support Travel Tracker',
          byUserRole: currentUser?.role || 'Admin',
          previousStatus: selectedComplaint.status,
          newStatus,
          note: resolutionNoteInput || selectedComplaint.resolutionNotes || '',
          awardedCompensation: awardedCompensationInput || selectedComplaint.awardedCompensation || '',
          emailSent: !!res?.emailSent
        }
      ];

      setSelectedComplaint(prev => prev ? {
        ...prev,
        status: newStatus,
        resolutionNotes: resolutionNoteInput || prev.resolutionNotes,
        awardedCompensation: awardedCompensationInput || prev.awardedCompensation,
        history: updatedHistory
      } : null);
    }
    setResolutionNoteInput('');

    setTimeout(() => {
      setStatusNotification(null);
    }, 6000);
  };

  const getPriorityColor = (p: ComplaintPriority) => {
    switch (p) {
      case 'Urgente': return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'Haute': return 'bg-orange-500/20 text-orange-300 border-orange-500/40';
      case 'Moyenne': return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'Basse': return 'bg-slate-700/60 text-slate-300 border-slate-600';
    }
  };

  const getStatusBadge = (s: ComplaintStatus) => {
    switch (s) {
      case 'Soumis':
        return <span className="bg-sky-500/20 text-sky-300 border border-sky-500/40 px-2.5 py-0.5 rounded-full text-[10px] font-bold">Soumis</span>;
      case 'En cours d\'analyse':
        return <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center space-x-1"><Clock className="w-2.5 h-2.5 animate-spin" /><span>En Analyse</span></span>;
      case 'Résolu':
        return <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center space-x-1"><CheckCircle2 className="w-2.5 h-2.5" /><span>Résolu</span></span>;
      case 'Rejeté':
        return <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center space-x-1"><XCircle className="w-2.5 h-2.5" /><span>Rejeté</span></span>;
    }
  };

  // Build complete chronological timeline / history of treatment
  const getComplaintTimeline = (complaint: Complaint): ComplaintHistoryEntry[] => {
    if (complaint.history && complaint.history.length > 0) {
      return complaint.history;
    }

    // Synthesize history for complaints created prior to audit log
    const fallback: ComplaintHistoryEntry[] = [
      {
        id: 'init-1',
        action: 'Création & Dépôt du dossier',
        date: complaint.createdAt || new Date().toISOString(),
        byUserName: complaint.userName || 'Voyageur',
        byUserRole: 'Traveler',
        newStatus: 'Soumis',
        note: complaint.description ? (complaint.description.slice(0, 90) + '...') : 'Dépôt initial du litige.',
        awardedCompensation: complaint.requestedCompensation,
        emailSent: false
      }
    ];

    if (complaint.status !== 'Soumis' || complaint.resolutionNotes || complaint.awardedCompensation) {
      fallback.push({
        id: 'upd-2',
        action: complaint.status === 'Résolu' 
          ? 'Arbitrage Favorable & Résolution' 
          : complaint.status === 'Rejeté' 
          ? 'Dossier Rejeté & Clôturé' 
          : 'Prise en charge & Mise en analyse',
        date: complaint.updatedAt || complaint.createdAt,
        byUserName: 'Organisateur / Support',
        byUserRole: 'Admin',
        previousStatus: 'Soumis',
        newStatus: complaint.status,
        note: complaint.resolutionNotes || 'Traitement du dossier enregistré.',
        awardedCompensation: complaint.awardedCompensation || '',
        emailSent: true
      });
    }

    return fallback;
  };

  const canManageComplaints = currentUser?.role === 'Admin' || currentUser?.role === 'Organizer';
  const canCreateComplaint = currentUser?.role === 'Traveler' || currentUser?.role === 'Organizer' || currentUser?.role === 'Admin';
  const isTraveler = currentUser?.role === 'Traveler';

  // Check if a complaint was created by the currently logged-in user
  const isCreatedByCurrentUser = (c: Complaint) => {
    return c.userId === currentUser?.id || (currentUser?.name && c.userName === currentUser.name);
  };

  // User-created complaints
  const myCreatedComplaints = complaints.filter(isCreatedByCurrentUser);

  // Filter based on active tab
  const tabFilteredComplaints = complaints.filter(c => {
    if (isTraveler || activeTab === 'my_complaints') {
      return isCreatedByCurrentUser(c);
    }
    if (activeTab === 'pending') {
      return c.status === 'Soumis' || c.status === "En cours d'analyse";
    }
    return true; // 'all' for Admin / Organizer
  });

  // Final filtered list including status filter
  const visibleComplaints = tabFilteredComplaints.filter(c => {
    return filterStatus === 'all' || c.status === filterStatus;
  });

  // Quick stats
  const myTotalCount = myCreatedComplaints.length;
  const myInProgressCount = myCreatedComplaints.filter(c => c.status === 'Soumis' || c.status === "En cours d'analyse").length;
  const myResolvedCount = myCreatedComplaints.filter(c => c.status === 'Résolu').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-white">Réclamations &amp; Support</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>IA &amp; Historique de Traitement</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-0.5">
              Historique complet de traitement, diagnostic IA et liste personnalisée des réclamations créées.
            </p>
          </div>
        </div>

        {canCreateComplaint && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center space-x-2 px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-600/25 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Déposer une Réclamation</span>
          </button>
        )}
      </div>

      {/* Role permission info banner */}
      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-amber-400" />
          <span>
            Connecté en tant que <strong className="text-white">{currentUser?.name}</strong> (Rôle : <span className="text-amber-300 font-bold">{currentUser?.role}</span>).
          </span>
        </div>
        <span className="text-slate-400">
          {canManageComplaints ? '✓ Pouvoir d\'arbitrage & notifications email actifs' : 'Vue voyageur (dépôt & suivi temps réel)'}
        </span>
      </div>

      {/* Quick Summary Cards (Mes réclamations créées) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400 font-medium">Mes réclamations créées</div>
            <div className="text-lg font-bold text-white mt-0.5">{myTotalCount}</div>
          </div>
          <div className="p-2.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <FolderOpen className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400 font-medium">En cours d'analyse</div>
            <div className="text-lg font-bold text-amber-400 mt-0.5">{myInProgressCount}</div>
          </div>
          <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400 font-medium">Résolues &amp; Indemnisées</div>
            <div className="text-lg font-bold text-emerald-400 mt-0.5">{myResolvedCount}</div>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Grid: Tickets List & Details / Resolution Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Tickets List */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Main Navigation Tabs: Mes créations vs Toutes vs À traiter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
            <div className="flex items-center space-x-1.5 overflow-x-auto">
              <button
                onClick={() => setActiveTab('my_complaints')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
                  activeTab === 'my_complaints'
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>Mes Réclamations Créées ({myTotalCount})</span>
              </button>

              {canManageComplaints && (
                <>
                  <button
                    onClick={() => setActiveTab('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
                      activeTab === 'all'
                        ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    <Inbox className="w-3.5 h-3.5" />
                    <span>Toutes ({complaints.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('pending')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
                      activeTab === 'pending'
                        ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>À Traiter ({complaints.filter(c => c.status === 'Soumis' || c.status === "En cours d'analyse").length})</span>
                  </button>
                </>
              )}
            </div>

            <span className="text-xs text-slate-500 self-end sm:self-auto font-mono">
              {visibleComplaints.length} affichée(s)
            </span>
          </div>

          {/* Secondary Filter: Filter by Status */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
            {['all', 'Soumis', 'En cours d\'analyse', 'Résolu', 'Rejeté'].map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors whitespace-nowrap ${
                  filterStatus === s
                    ? 'bg-slate-800 text-white border-slate-600 font-bold'
                    : 'bg-slate-950/60 text-slate-500 border-slate-800 hover:text-slate-300'
                }`}
              >
                {s === 'all' ? 'Tous les statuts' : s}
              </button>
            ))}
          </div>

          {/* Confidentiality info banner */}
          {activeTab === 'my_complaints' && (
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-400 flex items-center space-x-2">
              <Lock className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Vos réclamations créées : vous suivez ici l'historique complet des arbitrages et recevez des emails de notification.</span>
            </div>
          )}

          {/* Complaints List Cards */}
          <div className="space-y-3">
            {visibleComplaints.length === 0 ? (
              <div className="text-center py-12 p-6 rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <h4 className="text-sm font-semibold text-slate-300">
                  {activeTab === 'my_complaints'
                    ? 'Vous n\'avez créé aucune réclamation dans cette catégorie'
                    : 'Aucune réclamation trouvée pour ce filtre'}
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  En cas de vol retardé, d'annulation d'hôtel ou de frais imprévu, utilisez le bouton « Déposer une Réclamation ».
                </p>
              </div>
            ) : (
              visibleComplaints.map(comp => {
                const isMine = isCreatedByCurrentUser(comp);
                const timeline = getComplaintTimeline(comp);
                const isSelected = selectedComplaint?.id === comp.id;

                return (
                  <div
                    key={comp.id}
                    onClick={() => setSelectedComplaint(comp)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                      isSelected
                        ? 'bg-slate-800/95 border-rose-500 ring-1 ring-rose-500/50 shadow-lg'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${getPriorityColor(comp.priority)}`}>
                            {comp.priority}
                          </span>
                          <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                            {comp.category}
                          </span>
                          {isMine && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold flex items-center space-x-1">
                              <span>👤 Créé par vous</span>
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-white mt-1">{comp.title}</h4>
                      </div>

                      <div className="flex-shrink-0">
                        {getStatusBadge(comp.status)}
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2">
                      {comp.description}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800">
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>{comp.userName}</span>
                        </div>
                        <span className="text-slate-600">•</span>
                        <div className="flex items-center space-x-1 text-sky-400 font-medium">
                          <History className="w-3 h-3" />
                          <span>{timeline.length} étape(s) d'historique</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>Incident : {comp.incidentDate}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Detail & Full Treatment History / Timeline Panel */}
        <div className="lg:col-span-1 space-y-4">
          {selectedComplaint ? (
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-500 uppercase">Dossier #{selectedComplaint.id}</span>
                  {isCreatedByCurrentUser(selectedComplaint) && (
                    <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full font-bold">
                      Votre réclamation
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold text-white mt-1">{selectedComplaint.title}</h3>
                <div className="mt-2 flex items-center justify-between">
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${getPriorityColor(selectedComplaint.priority)}`}>
                    Priorité {selectedComplaint.priority}
                  </span>
                  {getStatusBadge(selectedComplaint.status)}
                </div>
              </div>

              {/* Traveler & Email Info */}
              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Auteur du signalement :</span>
                  <span className="font-semibold text-white">{selectedComplaint.userName}</span>
                </div>
                {selectedComplaint.userEmail && (
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center space-x-1">
                      <Mail className="w-3 h-3 text-sky-400" />
                      <span>Email notifié :</span>
                    </span>
                    <span className="font-mono text-sky-300 text-[11px]">{selectedComplaint.userEmail}</span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Description circonstanciée :</label>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                  {selectedComplaint.description}
                </div>
              </div>

              {/* Compensation request & award */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60">
                  <span className="text-slate-400">Dédommagement réclamé :</span>
                  <span className="font-bold text-amber-300">{selectedComplaint.requestedCompensation || 'Non spécifié'}</span>
                </div>
                {selectedComplaint.awardedCompensation && (
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-200">
                    <span>Accordé par le support :</span>
                    <span className="font-bold">{selectedComplaint.awardedCompensation}</span>
                  </div>
                )}
              </div>

              {/* Resolution Notes */}
              {selectedComplaint.resolutionNotes && (
                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-xs space-y-1">
                  <span className="font-bold text-white flex items-center space-x-1">
                    <MessageSquare className="w-3 h-3 text-indigo-400" />
                    <span>Dernière réponse du Support :</span>
                  </span>
                  <p className="text-slate-300 italic">{selectedComplaint.resolutionNotes}</p>
                </div>
              )}

              {/* Status Feedback Notification Toast */}
              {statusNotification && (
                <div className={`p-3 rounded-xl text-xs flex items-start space-x-2 border transition-all ${
                  statusNotification.type === 'success'
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-200'
                    : 'bg-sky-500/15 border-sky-500/30 text-sky-200'
                }`}>
                  <Mail className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-400" />
                  <span className="font-semibold leading-relaxed">{statusNotification.message}</span>
                </div>
              )}

              {/* Historique de Traitement (Timeline d'audit étape par étape) */}
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white flex items-center space-x-1.5">
                    <History className="w-3.5 h-3.5 text-sky-400" />
                    <span>Historique de Traitement ({getComplaintTimeline(selectedComplaint).length} étapes)</span>
                  </label>
                  <span className="text-[10px] text-slate-500">Audit Trail</span>
                </div>

                <div className="relative pl-5 space-y-3 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                  {getComplaintTimeline(selectedComplaint).map((entry, idx) => (
                    <div key={entry.id || idx} className="relative group">
                      {/* Stepper Dot */}
                      <div className={`absolute -left-5 top-1 w-4 h-4 rounded-full flex items-center justify-center border text-[9px] ${
                        entry.newStatus === 'Résolu'
                          ? 'bg-emerald-950 border-emerald-500 text-emerald-400'
                          : entry.newStatus === 'Rejeté'
                          ? 'bg-rose-950 border-rose-500 text-rose-400'
                          : entry.newStatus === "En cours d'analyse"
                          ? 'bg-amber-950 border-amber-500 text-amber-400'
                          : 'bg-sky-950 border-sky-500 text-sky-400'
                      }`}>
                        {entry.newStatus === 'Résolu' ? '✓' : entry.newStatus === 'Rejeté' ? '✕' : entry.newStatus === "En cours d'analyse" ? '⏳' : '●'}
                      </div>

                      <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-2.5 text-xs space-y-1.5">
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="font-bold text-white text-[11px]">{entry.action}</span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(entry.date).toLocaleString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>

                        <div className="flex items-center space-x-1.5 text-[10px] text-slate-400">
                          <UserCheck className="w-3 h-3 text-slate-500" />
                          <span>Par : <strong className="text-slate-300">{entry.byUserName}</strong> ({entry.byUserRole || 'Support'})</span>
                        </div>

                        {entry.previousStatus && entry.previousStatus !== entry.newStatus ? (
                          <div className="flex items-center space-x-1 text-[10px]">
                            <span className="text-slate-500">Statut :</span>
                            <span className="text-slate-400">{entry.previousStatus}</span>
                            <ArrowRight className="w-2.5 h-2.5 text-slate-600" />
                            <span className="font-bold text-sky-300">{entry.newStatus}</span>
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-400">
                            Statut : <span className="font-semibold text-sky-300">{entry.newStatus}</span>
                          </div>
                        )}

                        {entry.awardedCompensation && (
                          <div className="p-1.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[10px] font-semibold flex items-center space-x-1">
                            <span>💰 Dédommagement accordé :</span>
                            <span>{entry.awardedCompensation}</span>
                          </div>
                        )}

                        {entry.note && (
                          <p className="text-slate-300 italic text-[10px] bg-slate-900/60 p-2 rounded-lg border border-slate-800 leading-relaxed">
                            « {entry.note} »
                          </p>
                        )}

                        {entry.emailSent && (
                          <div className="text-[10px] text-emerald-400 flex items-center space-x-1 pt-0.5">
                            <Mail className="w-3 h-3" />
                            <span>Notification par email expédiée au voyageur</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Admin / Organizer Actions */}
              {canManageComplaints && (
                <div className="space-y-3 pt-3 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-amber-300 flex items-center space-x-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Arbitrage (Notification email automatique)</span>
                    </label>
                    <Mail className="w-3.5 h-3.5 text-sky-400" />
                  </div>

                  <input
                    type="text"
                    value={awardedCompensationInput}
                    onChange={e => setAwardedCompensationInput(e.target.value)}
                    placeholder="ex: Bon de 150 EUR + Nuit remboursée"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                  />

                  <textarea
                    rows={2}
                    value={resolutionNoteInput}
                    onChange={e => setResolutionNoteInput(e.target.value)}
                    placeholder="Motif de la décision ou instructions d'indemnisation (consigné dans l'historique et l'email)..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                  />

                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      onClick={() => handleUpdateStatus(selectedComplaint.id, 'En cours d\'analyse')}
                      className="py-1.5 px-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-[10px] font-bold"
                    >
                      En Analyse
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedComplaint.id, 'Résolu')}
                      className="py-1.5 px-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold shadow"
                    >
                      Accepter
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedComplaint.id, 'Rejeté')}
                      className="py-1.5 px-2 bg-rose-900/40 hover:bg-rose-900/80 text-rose-300 border border-rose-500/30 rounded-lg text-[10px] font-bold"
                    >
                      Rejeter
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-2 text-xs text-slate-500">
              <FileText className="w-8 h-8 mx-auto text-slate-600" />
              <p>Sélectionnez une réclamation pour voir les détails, l'historique de traitement et les actions d'arbitrage.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Add Complaint with Advanced AI Assistant */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsManualCategory(false);
          setIsManualPriority(false);
          setAiPrediction(null);
        }}
        title="Déposer une Réclamation"
        subtitle="Classification intelligente par IA et alerte automatique"
      >
        <form onSubmit={handleCreateComplaint} className="space-y-4">
          {/* Contexte voyage et déclarant */}
          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Voyage rattaché :</span>
              <span className="font-bold text-white">✈️ {activeTrip?.title} ({activeTrip?.destination})</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Voyageur déclarant :</span>
              <span className="font-semibold text-rose-300">👤 {currentUser?.name || 'Voyageur'} {currentUser?.email ? `(${currentUser.email})` : ''}</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-300">Motif ou intitulé du litige</label>
              <span className="text-[10px] text-amber-400 font-bold flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
                <span>IA Active</span>
              </span>
            </div>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="ex: Vol annulé sans solution d'hébergement ou Bagage perdu à l'aéroport"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Description détaillée des faits</label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Expliquez la situation, l'impact sur vos vacances, les justificatifs et démarches déjà engagées..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* Real-time AI Analysis Card */}
          {aiPrediction && (
            <div className={`p-3.5 rounded-xl border space-y-2.5 transition-all ${
              aiPrediction.isCritical
                ? 'bg-rose-950/40 border-rose-500/50 text-rose-200'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Bot className={`w-4 h-4 ${aiPrediction.isCritical ? 'text-rose-400' : 'text-amber-400'}`} />
                  <span className="font-bold text-xs">
                    Diagnostic IA en temps réel
                  </span>
                </div>
                <div className="flex items-center space-x-1.5 text-[10px]">
                  <span className="px-2 py-0.5 rounded-full bg-slate-900/80 border border-slate-700 font-semibold text-slate-300">
                    Confiance : {aiPrediction.confidence}%
                  </span>
                  <span className={`px-2 py-0.5 rounded-full font-bold ${
                    aiPrediction.urgencyScore >= 65
                      ? 'bg-rose-500/30 text-rose-300 border border-rose-500/50'
                      : aiPrediction.urgencyScore >= 40
                      ? 'bg-orange-500/30 text-orange-300 border border-orange-500/50'
                      : 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50'
                  }`}>
                    Urgence : {aiPrediction.urgencyScore}/100
                  </span>
                </div>
              </div>

              {aiPrediction.isCritical && (
                <div className="p-2 rounded-lg bg-rose-500/20 border border-rose-500/40 text-[11px] text-rose-200 font-semibold flex items-center space-x-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                  <span>Alerte Critique : incident majeur lié à la sécurité, santé ou blocage immédiat.</span>
                </div>
              )}

              {aiPrediction.detectedKeywords.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-[10px] text-slate-400">Mots-clés repérés :</span>
                  {aiPrediction.detectedKeywords.map((kw, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-slate-900/90 border border-slate-700/80 text-amber-300 font-medium">
                      {kw}
                    </span>
                  ))}
                </div>
              )}

              <p className="text-[11px] text-slate-300 leading-relaxed">
                {aiPrediction.explanation}
              </p>

              {aiPrediction.recommendedAction && (
                <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800 text-[11px] text-sky-200 flex items-start space-x-1.5">
                  <Zap className="w-3.5 h-3.5 text-sky-400 flex-shrink-0 mt-0.5" />
                  <span><strong>Conseil IA :</strong> {aiPrediction.recommendedAction}</span>
                </div>
              )}

              {(isManualCategory || isManualPriority) && (
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[11px]">
                  <span className="text-slate-400">Valeurs modifiées manuellement</span>
                  <button
                    type="button"
                    onClick={handleResetToAIPrediction}
                    className="text-amber-400 hover:text-amber-300 flex items-center space-x-1 font-semibold underline underline-offset-2"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Réaligner sur l'IA</span>
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">Catégorie</label>
                {aiPrediction && !isManualCategory && (
                  <span className="text-[9px] text-emerald-400 font-bold flex items-center space-x-0.5">
                    <Check className="w-2.5 h-2.5" />
                    <span>Auto IA</span>
                  </span>
                )}
              </div>
              <select
                value={category}
                onChange={e => {
                  setCategory(e.target.value as Complaint['category']);
                  setIsManualCategory(true);
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
              >
                <option value="Transport / Vol">Transport / Vol</option>
                <option value="Hôtel / Logement">Hôtel / Logement</option>
                <option value="Activité / Guide">Activité / Guide</option>
                <option value="Frais imprévu">Frais imprévu</option>
                <option value="Bagage">Bagage</option>
                <option value="Autre">Autre</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">Degré d'urgence</label>
                {aiPrediction && !isManualPriority && (
                  <span className="text-[9px] text-amber-400 font-bold flex items-center space-x-0.5">
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>Prédit IA</span>
                  </span>
                )}
              </div>
              <select
                value={priority}
                onChange={e => {
                  setPriority(e.target.value as ComplaintPriority);
                  setIsManualPriority(true);
                }}
                className={`w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-rose-500 font-bold ${
                  priority === 'Urgente'
                    ? 'text-rose-400'
                    : priority === 'Haute'
                    ? 'text-orange-400'
                    : priority === 'Moyenne'
                    ? 'text-amber-300'
                    : 'text-slate-300'
                }`}
              >
                <option value="Basse">🟢 Basse (Remarque simple)</option>
                <option value="Moyenne">🟡 Moyenne (Désagrément)</option>
                <option value="Haute">🟠 Haute (Préjudice financier/logistique)</option>
                <option value="Urgente">🔴 Urgente (Critique / Bloqué / Santé)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Dédommagement ou compensation souhaitée</label>
            <input
              type="text"
              value={requestedCompensation}
              onChange={e => setRequestedCompensation(e.target.value)}
              placeholder="ex: Remboursement 180 EUR, nuitée ou bon d'achat"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="pt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                setIsAddModalOpen(false);
                setIsManualCategory(false);
                setIsManualPriority(false);
                setAiPrediction(null);
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 text-sm font-semibold rounded-xl"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-rose-600/30 flex items-center space-x-1.5"
            >
              <Send className="w-4 h-4" />
              <span>Transmettre le Dossier</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
