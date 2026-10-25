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
  Lock
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useTrips } from '../../context/TripContext';
import { useAuth } from '../../context/AuthContext';
import { Complaint, ComplaintPriority, ComplaintStatus } from '../../types';
import { Modal } from '../common/Modal';
import { api } from '../../services/api';

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
  const [aiUrgencyExplanation, setAiUrgencyExplanation] = useState<string>('');

  // AI Evaluation of Urgency
  const evaluateUrgencyWithAI = (textToAnalyze: string, cat: string) => {
    const t = (textToAnalyze + ' ' + cat).toLowerCase();
    if (
      t.includes('annulé') || t.includes('passeport') || t.includes('urgence') || 
      t.includes('accident') || t.includes('hôpital') || t.includes('médical') || 
      t.includes('bloqué') || t.includes('sécurité') || t.includes('danger') || 
      t.includes('volé') || t.includes('sans abri') || t.includes('coincé')
    ) {
      return { 
        level: 'Urgente' as ComplaintPriority, 
        reason: 'IA Détection critique : Impact immédiat sur la sécurité, les vols ou l\'assistance médicale.' 
      };
    }
    if (
      t.includes('bagage') || t.includes('perdu') || t.includes('frais') || 
      t.includes('hôtel') || t.includes('logement') || t.includes('remboursement') || 
      t.includes('surcoût') || t.includes('retard') || t.includes('train')
    ) {
      return { 
        level: 'Haute' as ComplaintPriority, 
        reason: 'IA Détection : Préjudice logistique ou financier direct nécessitant une indemnisation rapide.' 
      };
    }
    if (
      t.includes('guide') || t.includes('activité') || t.includes('bruit') || 
      t.includes('propreté') || t.includes('climatisation') || t.includes('service')
    ) {
      return { 
        level: 'Moyenne' as ComplaintPriority, 
        reason: 'IA Détection : Désagrément d\'agrément sans urgence vitale ou logistique.' 
      };
    }
    return { 
      level: 'Basse' as ComplaintPriority, 
      reason: 'IA Détection : Remarque générale ou demande d\'information standard.' 
    };
  };

  // Run AI urgency check whenever title, description, or category changes
  useEffect(() => {
    if (title || description) {
      const { level, reason } = evaluateUrgencyWithAI(`${title} ${description}`, category);
      setPriority(level);
      setAiUrgencyExplanation(reason);
    }
  }, [title, description, category]);

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
  };

  // Advanced Feature: Workflow Resolution & Arbitration (Amine)
  const handleUpdateStatus = async (id: string, newStatus: ComplaintStatus) => {
    await api.complaints.update(id, {
      status: newStatus,
      resolutionNotes: resolutionNoteInput || selectedComplaint?.resolutionNotes,
      awardedCompensation: awardedCompensationInput || selectedComplaint?.awardedCompensation
    });
    if (newStatus === 'Résolu') {
      confetti({ particleCount: 60, spread: 60 });
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
      {/* Header with Member Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-white">Réclamations & Support</h2>
            </div>
            <p className="text-sm text-slate-400 mt-0.5">
              Gestion des litiges, timeline d'assistance et arbitrage des indemnisations.
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
            Connecté en tant que <strong className="text-white">{currentUser?.name}</strong> (Rôle: <span className="text-amber-300 font-bold">{currentUser?.role}</span>).
          </span>
        </div>
        <span className="text-slate-400">
          {canManageComplaints ? '✓ Pouvoir d\'arbitrage & résolution actif' : 'Vue voyageur (dépôt & suivi)'}
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
              <span>Espace confidentiel : seules vos réclamations personnelles vous sont visibles. Les autres voyageurs ne peuvent pas voir vos dossiers.</span>
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

        {/* Right Column: Detail & Arbitration Panel (Amine Feature) */}
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

              {/* Admin / Organizer Actions */}
              {canManageComplaints && (
                <div className="space-y-3 pt-3 border-t border-slate-800">
                  <label className="text-xs font-bold text-amber-300 flex items-center space-x-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Arbitrage & Résolution (Admin / Organizer)</span>
                  </label>

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
                    placeholder="Motif de la décision ou instructions d'indemnisation..."
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

      {/* Modal: Add Complaint */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Déposer une Réclamation"
        subtitle="Signalez un préjudice ou imprévu sur votre voyage pour prise en charge"
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
              <span className="font-semibold text-rose-300">👤 {currentUser?.name || 'Voyageur'}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Motif du litige</label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="ex: Bagage endommagé ou Retard de train > 3h"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Catégorie</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as Complaint['category'])}
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
                <span className="text-[10px] text-amber-400 font-bold flex items-center space-x-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>IA Autonome</span>
                </span>
              </div>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as ComplaintPriority)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500 font-bold text-amber-300"
              >
                <option value="Basse">🟢 Basse (Simple retour)</option>
                <option value="Moyenne">🟡 Moyenne</option>
                <option value="Haute">🟠 Haute (Impact financier)</option>
                <option value="Urgente">🔴 Urgente (Bloqué sur place / Critique)</option>
              </select>
            </div>
          </div>

          {aiUrgencyExplanation && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-200 flex items-start space-x-2">
              <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-300">Évaluation de l'IA en temps réel :</strong>
                <p className="mt-0.5 text-slate-300 text-[11px] leading-relaxed">{aiUrgencyExplanation}</p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Dédommagement ou compensation souhaitée</label>
            <input
              type="text"
              value={requestedCompensation}
              onChange={e => setRequestedCompensation(e.target.value)}
              placeholder="ex: Remboursement 180 EUR ou Billet de retour"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Description circonstanciée</label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Décrivez avec précision la chronologie des faits, les préjudices subis et les démarches déjà entreprises..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
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
