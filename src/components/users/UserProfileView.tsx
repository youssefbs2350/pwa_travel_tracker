import React, { useState } from 'react';
import { 
  User, 
  Shield, 
  Key, 
  Settings, 
  Globe, 
  Compass, 
  Sparkles, 
  Lock, 
  Copy, 
  CheckCircle2,
  Mail,
  Calendar
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const UserProfileView: React.FC = () => {
  const { currentUser, updatePreferences } = useAuth();
  const [copiedToken, setCopiedToken] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleCopyToken = () => {
    if (currentUser?.token) {
      navigator.clipboard.writeText(currentUser.token);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  const interestOptions = ['Culture', 'Gastronomie', 'Monuments', 'Nature', 'Aventure', 'Plage', 'Shopping'];

  const toggleInterest = async (interest: string) => {
    if (!currentUser) return;
    const current = currentUser.preferences?.interests || [];
    const updated = current.includes(interest)
      ? current.filter(i => i !== interest)
      : [...current, interest];
    await updatePreferences({ interests: updated });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handlePaceChange = async (pace: 'Relaxed' | 'Balanced' | 'Intense') => {
    await updatePreferences({ travelPace: pace });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleCurrencyChange = async (currency: string) => {
    await updatePreferences({ currency });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-brand-500/10 text-brand-400 rounded-xl border border-brand-500/20">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Mon Profil & Préférences</h2>
            <p className="text-sm text-slate-400 mt-0.5">
              Gérez vos paramètres personnels, devise de référence et centres d'intérêt de voyage.
            </p>
          </div>
        </div>

        {saveSuccess && (
          <div className="px-3.5 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center space-x-1.5 animate-pulse">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Préférences enregistrées</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Personal Identity Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
            <div className="flex items-center space-x-4">
              <img
                src={currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                alt={currentUser?.name}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-brand-500 shadow-md"
              />
              <div className="space-y-1">
                <h3 className="font-bold text-white text-lg">{currentUser?.name}</h3>
                <p className="text-xs text-slate-400 flex items-center space-x-1">
                  <Mail className="w-3.5 h-3.5" />
                  <span className="truncate">{currentUser?.email}</span>
                </p>
                <div className="inline-flex items-center space-x-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Rôle : {currentUser?.role}</span>
                </div>
              </div>
            </div>

            {/* Role Notice */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 space-y-1">
              <div className="flex items-center space-x-1.5 text-slate-300 font-semibold">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Statut du Rôle :</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Votre rôle <strong className="text-white font-semibold">({currentUser?.role})</strong> détermine vos autorisations dans l'application. Conformément aux règles de sécurité, seul l'administrateur peut modifier les rôles dans la section dédiée.
              </p>
            </div>

            {/* JWT Token session display */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300 flex items-center space-x-1">
                  <Key className="w-3.5 h-3.5 text-brand-400" />
                  <span>Jeton de Session JWT</span>
                </span>
                <button
                  onClick={handleCopyToken}
                  className="text-[11px] text-brand-400 hover:text-brand-300 flex items-center space-x-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedToken ? 'Copié !' : 'Copier'}</span>
                </button>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[10px] text-brand-300 break-all leading-tight select-all">
                {currentUser?.token || 'jwt-bearer-active-session'}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Preferences editor */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
              <Settings className="w-5 h-5 text-brand-400" />
              <h3 className="text-base font-bold text-white">Personnalisation du Voyageur</h3>
            </div>

            {/* Currency selector */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                <Globe className="w-4 h-4 text-brand-400" />
                <span>Devise principale de l'application :</span>
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {[
                  { code: 'EUR', label: 'EUR (€)' },
                  { code: 'USD', label: 'USD ($)' },
                  { code: 'TND', label: 'TND (DT)' },
                  { code: 'GBP', label: 'GBP (£)' },
                  { code: 'CAD', label: 'CAD ($)' },
                  { code: 'CHF', label: 'CHF' },
                  { code: 'JPY', label: 'JPY (¥)' },
                ].map(curr => (
                  <button
                    key={curr.code}
                    onClick={() => handleCurrencyChange(curr.code)}
                    className={`py-2 px-1 text-center text-xs font-bold rounded-xl border transition-all ${
                      currentUser?.preferences?.currency === curr.code
                        ? 'bg-brand-600 text-white border-brand-500 shadow-md ring-2 ring-brand-400/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    <div>{curr.code}</div>
                  </button>
                ))}
              </div>
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-[11px] text-slate-400 leading-relaxed">
                ℹ️ <strong className="text-slate-300">Conversion en temps réel :</strong> Tous les montants (budgets de voyages, dépenses, activités, recommandations) sont automatiquement convertis dans votre devise active (<span className="text-brand-300 font-bold">{currentUser?.preferences?.currency || 'EUR'}</span>) selon le cours de change officiel.
              </div>
            </div>

            {/* Pace selector */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                <Compass className="w-4 h-4 text-amber-400" />
                <span>Rythme de visite préféré :</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Relaxed', 'Balanced', 'Intense'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => handlePaceChange(p)}
                    className={`py-2 text-xs font-medium rounded-xl border transition-all ${
                      currentUser?.preferences?.travelPace === p
                        ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-md'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    {p === 'Relaxed' ? 'Relaxé' : p === 'Balanced' ? 'Équilibré' : 'Intensif'}
                  </button>
                ))}
              </div>
            </div>

            {/* Interests */}
            <div className="space-y-3 pt-3 border-t border-slate-800">
              <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-pink-400" />
                <span>Centres d'intérêt pour les recommandations automatiques :</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {interestOptions.map(interest => {
                  const isSelected = currentUser?.preferences?.interests?.includes(interest);
                  return (
                    <button
                      key={interest}
                      onClick={() => toggleInterest(interest)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center space-x-1.5 transition-all ${
                        isSelected
                          ? 'bg-pink-500/20 text-pink-300 border-pink-500/50 shadow-sm'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-750'
                      }`}
                    >
                      <span>{interest}</span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-pink-400" />}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-slate-400">
                Ces préférences alimentent le moteur de recommandations de lieux et d'activités.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
