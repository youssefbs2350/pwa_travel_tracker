import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  WifiOff, 
  Database, 
  Server, 
  RotateCw, 
  CheckCircle2, 
  AlertTriangle, 
  Activity, 
  ShieldCheck,
  Send
} from 'lucide-react';
import { Modal } from './Modal';
import { useOffline } from '../../context/OfflineContext';
import { api } from '../../services/api';

interface ConnectionControlModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConnectionControlModal: React.FC<ConnectionControlModalProps> = ({ isOpen, onClose }) => {
  const { isOnline, isForcedOffline, toggleForceOffline, pendingSyncCount, syncData } = useOffline();

  const [isChecking, setIsChecking] = useState(false);
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [mongoStatus, setMongoStatus] = useState<string>('Vérification...');

  const runDiagnostic = async () => {
    setIsChecking(true);
    const start = performance.now();

    try {
      const res = await fetch('/api/health', { method: 'GET', signal: AbortSignal.timeout(3000) });
      const elapsed = Math.round(performance.now() - start);
      setLatencyMs(elapsed);

      if (res.ok) {
        setServerStatus('online');
        setMongoStatus('Connecté (Port 27017)');
      } else {
        setServerStatus('offline');
        setMongoStatus('Inaccessible');
      }
    } catch {
      setServerStatus('offline');
      setLatencyMs(null);
      setMongoStatus('Serveur non joignable (Mode local/hors-ligne actif)');
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      runDiagnostic();
    }
  }, [isOpen]);

  const handleSyncClick = async () => {
    setIsChecking(true);
    await syncData();
    await runDiagnostic();
    setIsChecking(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Contrôle & Diagnostic de la Connexion"
      subtitle="Supervision en temps réel du réseau, de l'API Express et de la base MongoDB"
    >
      <div className="space-y-5">
        
        {/* Status Dashboard Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          
          {/* Card 1: Internet / Browser Connectivity */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-semibold flex items-center space-x-1.5">
                {isOnline ? <Wifi className="w-4 h-4 text-emerald-400" /> : <WifiOff className="w-4 h-4 text-amber-400" />}
                <span>Réseau Navigateur</span>
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                isOnline ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}>
                {isOnline ? 'Connecté' : 'Déconnecté'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {isForcedOffline ? 'Mode simulation hors-ligne activé' : isOnline ? 'Liaison internet active' : 'Pas de signal réseau détecté'}
            </p>
          </div>

          {/* Card 2: Express Server & Latency */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-semibold flex items-center space-x-1.5">
                <Server className="w-4 h-4 text-sky-400" />
                <span>Serveur API Express</span>
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                serverStatus === 'online' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              }`}>
                {serverStatus === 'online' ? 'Port 5000 OK' : 'Hors-ligne'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {latencyMs !== null ? `Latence de réponse : ${latencyMs} ms` : 'Réponse en attente'}
            </p>
          </div>

          {/* Card 3: MongoDB Database */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-semibold flex items-center space-x-1.5">
                <Database className="w-4 h-4 text-emerald-400" />
                <span>Base MongoDB</span>
              </span>
              <span className="text-[10px] font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                127.0.0.1:27017
              </span>
            </div>
            <p className="text-[11px] text-slate-300 truncate">
              {mongoStatus}
            </p>
          </div>

          {/* Card 4: Local Cache & Sync Queue */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-semibold flex items-center space-x-1.5">
                <Activity className="w-4 h-4 text-amber-400" />
                <span>File d'Attente Sync</span>
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                pendingSyncCount > 0 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slate-800 text-slate-400'
              }`}>
                {pendingSyncCount} en attente
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {pendingSyncCount > 0 ? 'Actions prêtes à être envoyées à MongoDB' : 'Toutes les données sont synchronisées'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="p-4 rounded-2xl bg-slate-850 border border-slate-800 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Contrôles Manuels de Connexion
          </h4>

          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={runDiagnostic}
              disabled={isChecking}
              className="flex items-center space-x-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-750 text-white rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
              <span>Tester la Connexion</span>
            </button>

            <button
              onClick={toggleForceOffline}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                isForcedOffline
                  ? 'bg-amber-500 text-slate-950 font-bold border-amber-400'
                  : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700'
              }`}
            >
              {isForcedOffline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              <span>{isForcedOffline ? 'Désactiver Simulation Hors-Ligne' : 'Simuler Coupure Réseau'}</span>
            </button>

            {pendingSyncCount > 0 && isOnline && (
              <button
                onClick={handleSyncClick}
                disabled={isChecking}
                className="flex items-center space-x-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all ml-auto"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Pousser vers MongoDB ({pendingSyncCount})</span>
              </button>
            )}
          </div>
        </div>

        {/* Security & Offline summary */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1">
          <div className="flex items-center space-x-1.5 text-brand-400 font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>Tolérance aux Pannes & Mode Avion :</span>
          </div>
          <p className="leading-relaxed">
            Même si votre serveur local ou votre box internet est éteinte, Travel Tracker PWA continue de fonctionner sans interruption en stockant vos voyages, activités et budget dans le cache IndexedDB de votre navigateur.
          </p>
        </div>

      </div>
    </Modal>
  );
};
