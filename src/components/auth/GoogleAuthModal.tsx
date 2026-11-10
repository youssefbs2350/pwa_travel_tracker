import React, { useState } from 'react';
import { X, Sparkles, CheckCircle2, User, Mail, Info, ShieldCheck } from 'lucide-react';

export const GoogleIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.64v3.03h3.88c2.27-2.09 3.665-5.17 3.665-9.11z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.13C3.27 21.43 7.35 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.57H1.25C.45 8.15 0 9.99 0 12s.45 3.85 1.25 5.43l4.03-3.14z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.27 2.57 1.25 6.57l4.03 3.14c.95-2.83 3.6-4.96 6.72-4.96z"
    />
  </svg>
);

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAccount: (profile: { email: string; name: string; avatar?: string; googleId?: string }) => void;
  isSubmitting?: boolean;
}

const DEMO_GOOGLE_ACCOUNTS = [
  {
    name: 'Alexandre Voyageur',
    email: 'alexandre.google@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    googleId: '109823471029384712093'
  },
  {
    name: 'Sophie Martin',
    email: 'sophie.martin.travel@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
    googleId: '102938471928374615243'
  }
];

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  isOpen,
  onClose,
  onSelectAccount,
  isSubmitting = false
}) => {
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);

  if (!isOpen) return null;

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail) return;
    onSelectAccount({
      email: customEmail.trim(),
      name: customName.trim() || customEmail.split('@')[0],
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      googleId: 'custom-google-' + Date.now()
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 space-y-5 text-white relative"
        role="dialog"
        aria-modal="true"
        aria-labelledby="google-modal-title"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 pr-8">
          <div className="p-2.5 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shadow-inner">
            <GoogleIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 id="google-modal-title" className="text-base font-bold text-white flex items-center space-x-2">
              <span>Connexion avec Google</span>
            </h3>
            <p className="text-xs text-slate-400">Authentification Google Identity Services</p>
          </div>
        </div>

        {/* Info box: production vs dev mode */}
        <div className="p-3 rounded-xl bg-sky-950/40 border border-sky-500/30 text-xs text-sky-200 flex items-start space-x-2.5 leading-relaxed">
          <Info className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-sky-100">Environnement local / Démonstration</p>
            <p className="text-[11px] text-sky-300">
              Choisissez un compte Google de test ci-dessous pour vous connecter immédiatement, ou saisissez votre e-mail Google.
            </p>
          </div>
        </div>

        {/* Account Selector List */}
        {!isCustomMode ? (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-300">Sélectionnez un compte Google :</p>
            
            <div className="space-y-2">
              {DEMO_GOOGLE_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => onSelectAccount(acc)}
                  className="w-full p-3 rounded-xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700 hover:border-brand-500/50 flex items-center space-x-3 text-left transition-all group disabled:opacity-50"
                >
                  <img
                    src={acc.avatar}
                    alt={acc.name}
                    className="w-10 h-10 rounded-full object-cover border border-slate-600 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white group-hover:text-brand-300 transition-colors truncate">
                      {acc.name}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{acc.email}</p>
                  </div>
                  <ShieldCheck className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors flex-shrink-0" />
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setIsCustomMode(true)}
              className="w-full py-2.5 text-xs text-slate-400 hover:text-white border border-dashed border-slate-700 hover:border-slate-500 rounded-xl transition-colors flex items-center justify-center space-x-2"
            >
              <User className="w-3.5 h-3.5" />
              <span>Utiliser un autre compte Google</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleCustomSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Nom / Prénom Google</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  placeholder="ex: Thomas Bernard"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Adresse e-mail Google</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={customEmail}
                  onChange={e => setCustomEmail(e.target.value)}
                  placeholder="nom@gmail.com"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <button
                type="button"
                onClick={() => setIsCustomMode(false)}
                className="w-1/3 py-2 rounded-xl border border-slate-700 text-xs text-slate-300 hover:bg-slate-800"
              >
                Retour
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !customEmail}
                className="w-2/3 py-2 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-bold text-xs rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Connexion...' : 'Valider ce compte'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Production setup hint */}
        <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center space-x-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400/80 flex-shrink-0" />
          <span>
            En production : renseignez <code className="text-amber-300/90 font-mono bg-slate-800 px-1 py-0.5 rounded">VITE_GOOGLE_CLIENT_ID</code> dans <code className="text-slate-400 font-mono">.env</code>.
          </span>
        </div>
      </div>
    </div>
  );
};
