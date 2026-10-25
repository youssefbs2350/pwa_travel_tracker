import React from 'react';
import { Download, Smartphone, Monitor, CheckCircle, Share2, PlusSquare } from 'lucide-react';
import { Modal } from './Modal';
import { useOffline } from '../../context/OfflineContext';

interface PwaInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PwaInstallModal: React.FC<PwaInstallModalProps> = ({ isOpen, onClose }) => {
  const { canInstall, promptInstall, isInstalled } = useOffline();

  const handleInstallClick = async () => {
    const success = await promptInstall();
    if (success) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Installer Travel Tracker PWA"
      subtitle="Profitez de l'expérience hors ligne, des notifications et d'un accès instantané sans passer par les stores d'applications."
    >
      <div className="space-y-6">
        {/* Banner */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-brand-900/60 to-slate-800 border border-brand-500/30 flex items-center space-x-4">
          <div className="p-3 bg-brand-500/20 text-brand-400 rounded-xl border border-brand-400/30">
            <Download className="w-8 h-8" />
          </div>
          <div>
            <h4 className="font-semibold text-white">Application Progressive Web App</h4>
            <p className="text-sm text-slate-300">
              Fonctionne en plein écran, charge sans réseau internet en voyage et ne prend que quelques Mo.
            </p>
          </div>
        </div>

        {isInstalled ? (
          <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 flex items-center space-x-3">
            <CheckCircle className="w-6 h-6 text-emerald-400 flex-shrink-0" />
            <div>
              <p className="font-semibold">Application déjà installée !</p>
              <p className="text-xs text-emerald-300 mt-0.5">
                Vous utilisez actuellement Travel Tracker en mode autonome.
              </p>
            </div>
          </div>
        ) : canInstall ? (
          <div className="space-y-3">
            <button
              onClick={handleInstallClick}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-bold rounded-xl shadow-lg shadow-brand-500/25 flex items-center justify-center space-x-2 transition-all transform hover:-translate-y-0.5"
            >
              <Download className="w-5 h-5" />
              <span>Installer maintenant en 1 clic</span>
            </button>
            <p className="text-xs text-center text-slate-400">
              Navigateur compatible PWA détecté (Chrome, Edge, Brave, Opera)
            </p>
          </div>
        ) : null}

        {/* Guides for desktop and iOS Safari */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
            <div className="flex items-center space-x-2 text-brand-400 font-semibold text-sm">
              <Smartphone className="w-4 h-4" />
              <span>Sur iPhone / iPad (Safari)</span>
            </div>
            <ol className="text-xs text-slate-300 space-y-2 pl-4 list-decimal">
              <li>Appuyez sur le bouton de partage <Share2 className="w-3.5 h-3.5 inline mx-1 text-brand-400" /> dans Safari.</li>
              <li>Faites défiler vers le bas et sélectionnez <span className="text-white font-medium">« Sur l'écran d'accueil »</span> <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-brand-400" />.</li>
              <li>Appuyez sur <span className="text-brand-300 font-medium">Ajouter</span> en haut à droite.</li>
            </ol>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
            <div className="flex items-center space-x-2 text-amber-400 font-semibold text-sm">
              <Monitor className="w-4 h-4" />
              <span>Sur PC & Mac (Chrome / Edge)</span>
            </div>
            <ol className="text-xs text-slate-300 space-y-2 pl-4 list-decimal">
              <li>Cliquez sur l'icône d'installation dans la barre d'adresse URL.</li>
              <li>Ou ouvrez le menu <strong>⋮</strong> puis <span className="text-white font-medium">« Installer Travel Tracker »</span>.</li>
              <li>L'icône apparaîtra sur votre bureau et barre des tâches.</li>
            </ol>
          </div>
        </div>

        {/* Offline storage note */}
        <div className="text-xs text-slate-400 bg-slate-950 p-3 rounded-lg border border-slate-800">
          💡 <strong>Astuce Voyageur :</strong> Une fois installée, l’application reste entièrement opérationnelle dans l'avion ou en zone blanche grâce à IndexedDB et son Service Worker.
        </div>
      </div>
    </Modal>
  );
};
