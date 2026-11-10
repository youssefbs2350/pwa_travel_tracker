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
  Info
} from 'lucide-react';

import { useTrips } from '../../context/TripContext';
import { useAuth } from '../../context/AuthContext';
import { Complaint, ComplaintPriority, ComplaintStatus } from '../../types';
import { Modal } from '../common/Modal';
import { api } from '../../services/api';
import { predictComplaintWithAI, AIPredictionResult } from '../../utils/complaintAI';

export const ComplaintsView: React.FC = () => {
  const { activeTrip } = useTrips();
  const { currentUser } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
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

  // Admin / Organizer resolution notes state
  const [resolutionNoteInput, setResolutionNoteInput] = useState('');
  const [awardedCompensationInput, setAwardedCompensationInput] = useState('');

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

    await api.complaints.create({
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
    setIsAddModalOpen(false);
    setTitle('');
    setDescription('');
    setIsManualCategory(false);
    setIsManualPriority(false);
    setAiPrediction(null);
  };

  // Advanced Feature: Workflow Resolution & Arbitration + Email Notification
  const handleUpdateStatus = async (id: string, newStatus: ComplaintStatus) => {
    const res = await api.complaints.update(id, {
      status: newStatus,
      resolutionNotes: resolutionNoteInput || selectedComplaint?.resolutionNotes,
      awardedCompensation: awardedCompensationInput || selectedComplaint?.awardedCompensation
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
      setSelectedComplaint(prev => prev ? {
        ...prev,
        status: newStatus,
        resolutionNotes: resolutionNoteInput || prev.resolutionNotes,
        awardedCompensation: awardedCompensationInput || prev.awardedCompensation
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

  const canManageComplaints = currentUser?.role === 'Admin' || currentUser?.role === 'Organizer';
  const canCreateComplaint = currentUser?.role === 'Traveler';
  const isTraveler = currentUser?.role === 'Traveler';

  // Confidentialité stricte : un voyageur ne peut voir QUE ses propres réclamations
  const visibleComplaints = complaints.filter(comp => {
    if (isTraveler) {
      return comp.userId === currentUser?.id || (currentUser?.name && comp.userName === currentUser.name);
    }
    return true; // Les organisateurs et admins accèdent à toutes les réclamations pour arbitrage
  });

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
              <h2 className="text-xl font-bold text-white">Réclamations & Support</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>IA &amp; Notifications Mail</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-0.5">
              Prédiction automatique par IA des types et de l'urgence des litiges avec suivi email en temps réel.
            </p>
          </div>
        </div>

        {canCreateComplaint ? (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center space-x-2 px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-600/25 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Déposer une Réclamation</span>
          </button>
        ) : (
          <div className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-amber-300 font-semibold self-start sm:self-auto">
            Mode Arbitrage & Traitement (Réservé Voyageur pour le dépôt)
          </div>
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

      {/* Grid: Tickets List & Details / Resolution Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Tickets List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {['all', 'Soumis', 'En cours d\'analyse', 'Résolu'].map(s => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                    filterStatus === s
                      ? 'bg-rose-600 text-white border-rose-500 font-bold'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {s === 'all' ? 'Toutes' : s}
                </button>
              ))}
            </div>
            <span className="text-xs text-slate-500">{visibleComplaints.length} dossier(s)</span>
          </div>

          {/* Bannière de confidentialité voyageur */}
          {isTraveler && (
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 flex items-center space-x-2">
              <Lock className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Espace confidentiel : seules vos réclamations personnelles vous sont visibles. Vous recevrez un email à chaque changement de statut.</span>
            </div>
          )}

          <div className="space-y-3">
            {visibleComplaints.length === 0 ? (
              <div className="text-center py-12 p-6 rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <h4 className="text-sm font-semibold text-slate-300">
                  {isTraveler ? 'Vous n\'avez aucune réclamation en cours' : 'Aucune réclamation enregistrée pour ce voyage'}
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Tout se déroule parfaitement sur ce séjour. En cas de vol retardé ou imprévu d'hôtel, déposez un ticket.
                </p>
              </div>
            ) : (
              visibleComplaints
                .filter(c => filterStatus === 'all' || c.status === filterStatus)
                .map(comp => (
                  <div
                    key={comp.id}
                    onClick={() => setSelectedComplaint(comp)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                      selectedComplaint?.id === comp.id
                        ? 'bg-slate-800/90 border-rose-500 ring-1 ring-rose-500/50 shadow-lg'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${getPriorityColor(comp.priority)}`}>
                            {comp.priority}
                          </span>
                          <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                            {comp.category}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white">{comp.title}</h4>
                      </div>

                      <div className="flex-shrink-0">
                        {getStatusBadge(comp.status)}
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2">
                      {comp.description}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800">
                      <div className="flex items-center space-x-1.5">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>{comp.userName}</span>
                        {comp.userEmail && (
                          <span className="text-slate-600 font-mono text-[10px]">({comp.userEmail})</span>
                        )}
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>Incident : {comp.incidentDate}</span>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* Right Column: Detail & Arbitration Panel */}
        <div className="lg:col-span-1 space-y-4">
          {selectedComplaint ? (
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <span className="text-[10px] font-mono text-slate-500 uppercase">Dossier #{selectedComplaint.id}</span>
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
                  <span>Déclarant :</span>
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
                <label className="text-xs font-semibold text-slate-400">Description du voyageur :</label>
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

              {/* Admin / Organizer Actions */}
              {canManageComplaints && (
                <div className="space-y-3 pt-3 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-amber-300 flex items-center space-x-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Arbitrage (Email automatique au voyageur)</span>
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
                    placeholder="Motif de la décision ou instructions d'indemnisation (inclus dans l'email)..."
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
              <p>Sélectionnez une réclamation pour voir les détails, justificatifs et timeline d'arbitrage.</p>
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
