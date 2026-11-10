import React, { useState, useEffect, useMemo } from 'react';
import { 
  User, 
  Shield, 
  Settings, 
  Globe, 
  Compass, 
  Sparkles, 
  CheckCircle2,
  Mail,
  Sun,
  Moon,
  Heart,
  Phone,
  AlertTriangle,
  Award,
  MapPin,
  Camera
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useTrips } from '../../context/TripContext';
import { AvatarPicker, AVATAR_PRESETS } from '../common/AvatarPicker';
import { GoogleIcon } from '../auth/GoogleAuthModal';
import { EmergencyInfo } from '../../types';
import { computeBadges } from '../../utils/badges';
import { db } from '../../db/database';

export const UserProfileView: React.FC = () => {
  const { currentUser, updatePreferences, updateAvatar, updateEmergencyInfo } = useAuth();
  const { theme, setTheme } = useTheme();
  const { trips } = useTrips();
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [emergencySaveSuccess, setEmergencySaveSuccess] = useState(false);

  // ── Emergency Info local state ──
  const [bloodType, setBloodType] = useState<EmergencyInfo['bloodType']>(currentUser?.emergencyInfo?.bloodType || '');
  const [allergies, setAllergies] = useState(currentUser?.emergencyInfo?.allergies || '');
  const [emergencyName, setEmergencyName] = useState(currentUser?.emergencyInfo?.emergencyContact?.name || '');
  const [emergencyPhone, setEmergencyPhone] = useState(currentUser?.emergencyInfo?.emergencyContact?.phone || '');

  // ── Badge computation (offline from IndexedDB) ──
  const [expenses, setExpenses] = useState<any[]>([]);
  const [memories, setMemories] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const allExpenses = await db.expenses.toArray();
      const allMemories = await db.memories.toArray();
      setExpenses(allExpenses);
      setMemories(allMemories);
    })();
  }, [trips]);

  // Sync emergency fields when currentUser changes
  useEffect(() => {
    if (currentUser?.emergencyInfo) {
      setBloodType(currentUser.emergencyInfo.bloodType || '');
      setAllergies(currentUser.emergencyInfo.allergies || '');
      setEmergencyName(currentUser.emergencyInfo.emergencyContact?.name || '');
      setEmergencyPhone(currentUser.emergencyInfo.emergencyContact?.phone || '');
    }
  }, [currentUser?.id]);

  const badges = useMemo(() => computeBadges(trips, expenses, memories), [trips, expenses, memories]);
  const unlockedCount = badges.filter(b => b.unlocked).length;
  const uniqueCountries = new Set(trips.map(t => t.country?.trim()).filter(Boolean));

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

  const handleSaveEmergency = async () => {
    const info: EmergencyInfo = {
      bloodType: bloodType || '',
      allergies,
      emergencyContact: {
        name: emergencyName,
        phone: emergencyPhone
      }
    };
    await updateEmergencyInfo(info);
    setEmergencySaveSuccess(true);
    setTimeout(() => setEmergencySaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* ── Hero Profile Card ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600/20 via-slate-900 to-indigo-900/20 border border-slate-800 shadow-xl">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-4 right-8 text-6xl">✈️</div>
          <div className="absolute bottom-4 left-12 text-4xl">🌍</div>
          <div className="absolute top-1/2 right-1/3 text-3xl">🧭</div>
        </div>
        
        <div className="relative p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            {/* Avatar */}
            <div className="relative group">
              <img
                src={currentUser?.avatar || AVATAR_PRESETS[0].url}
                alt={currentUser?.name}
                className="w-24 h-24 rounded-2xl object-cover border-3 border-brand-500/60 shadow-lg shadow-brand-500/20 ring-4 ring-slate-900"
              />
              <div className="absolute -bottom-1 -right-1 p-1.5 bg-slate-900 rounded-lg border border-slate-700">
                <div className={`w-3 h-3 rounded-full ${currentUser ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left space-y-2">
              <div>
                <h2 className="text-2xl font-bold text-white">{currentUser?.name}</h2>
                <p className="text-sm text-slate-400 flex items-center justify-center sm:justify-start space-x-1.5 mt-0.5">
                  <Mail className="w-3.5 h-3.5" />
                  <span>{currentUser?.email}</span>
                </p>
              </div>
              
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className={`inline-flex items-center space-x-1.5 text-xs font-bold px-3 py-1 rounded-full border ${
                  currentUser?.role === 'Admin' ? 'bg-amber-500/15 text-amber-300 border-amber-500/40' :
                  currentUser?.role === 'Organizer' ? 'bg-sky-500/15 text-sky-300 border-sky-500/40' :
                  'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                }`}>
                  <Shield className="w-3.5 h-3.5" />
                  <span>{currentUser?.role === 'Traveler' ? 'Voyageur' : currentUser?.role === 'Organizer' ? 'Organisateur' : 'Admin'}</span>
                </span>
                {(currentUser?.authProvider === 'google' || currentUser?.googleId) && (
                  <span className="inline-flex items-center space-x-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-sky-300 border border-slate-700">
                    <GoogleIcon className="w-3 h-3" />
                    <span>Google</span>
                  </span>
                )}
              </div>

              {/* Quick stats row */}
              <div className="flex items-center justify-center sm:justify-start gap-4 pt-1">
                <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-brand-400" />
                  <span><strong className="text-white">{uniqueCountries.size}</strong> pays</span>
                </div>
                <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                  <Globe className="w-3.5 h-3.5 text-emerald-400" />
                  <span><strong className="text-white">{trips.length}</strong> voyages</span>
                </div>
                <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                  <Camera className="w-3.5 h-3.5 text-pink-400" />
                  <span><strong className="text-white">{memories.length}</strong> souvenirs</span>
                </div>
                <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <span><strong className="text-white">{unlockedCount}</strong>/{badges.length} badges</span>
                </div>
              </div>
            </div>
          </div>

          {/* Avatar picker underneath */}
          <div className="mt-4 pt-4 border-t border-slate-800/60">
            <AvatarPicker
              value={currentUser?.avatar || AVATAR_PRESETS[0].url}
              onChange={async (newAvatar) => {
                if (updateAvatar) {
                  await updateAvatar(newAvatar);
                  setSaveSuccess(true);
                  setTimeout(() => setSaveSuccess(false), 2500);
                }
              }}
              label="Changer de photo"
            />
          </div>
        </div>
      </div>

      {saveSuccess && (
        <div className="px-4 py-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center space-x-2 animate-pulse">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Préférences enregistrées avec succès !</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ═══ LEFT COLUMN ═══ */}
        <div className="lg:col-span-1 space-y-6">

          {/* ── Fiche Médicale & Contact d'Urgence (Offline) ── */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-red-950/40 via-slate-900 to-slate-900 border border-red-500/30 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2.5 bg-red-500/15 rounded-xl border border-red-500/30">
                  <Heart className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">En cas d'urgence 🚑</h3>
                  <p className="text-[11px] text-slate-400">Hors-ligne via cache PWA</p>
                </div>
              </div>
              {emergencySaveSuccess && (
                <div className="px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[11px] font-semibold flex items-center space-x-1 animate-pulse">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Sauvegardé</span>
                </div>
              )}
            </div>

            {/* Groupe sanguin */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-red-300/80 flex items-center space-x-1.5">
                <span>🩸</span>
                <span>Groupe sanguin</span>
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const).map(bt => (
                  <button
                    key={bt}
                    onClick={() => setBloodType(bt)}
                    className={`py-1.5 text-xs font-bold rounded-lg border transition-all ${
                      bloodType === bt
                        ? 'bg-red-500 text-white border-red-400 shadow-md ring-2 ring-red-400/40'
                        : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white hover:border-slate-600'
                    }`}
                  >
                    {bt}
                  </button>
                ))}
              </div>
            </div>

            {/* Allergies */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-red-300/80 flex items-center space-x-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Allergies majeures</span>
              </label>
              <textarea
                value={allergies}
                onChange={e => setAllergies(e.target.value)}
                placeholder="Ex : Pénicilline, Arachides..."
                rows={2}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500/50 resize-none"
              />
            </div>

            {/* Contact d'urgence */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-red-300/80 flex items-center space-x-1.5">
                <Phone className="w-3.5 h-3.5" />
                <span>Contact d'urgence</span>
              </label>
              <input
                type="text"
                value={emergencyName}
                onChange={e => setEmergencyName(e.target.value)}
                placeholder="Nom (ex : Maman, Dr. Martin...)"
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500/50"
              />
              <input
                type="tel"
                value={emergencyPhone}
                onChange={e => setEmergencyPhone(e.target.value)}
                placeholder="Téléphone (ex : +33 6 12 34 56 78)"
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500/50"
              />
            </div>

            <button
              onClick={handleSaveEmergency}
              className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all flex items-center justify-center space-x-2 shadow-md hover:shadow-red-500/25"
            >
              <Heart className="w-4 h-4" />
              <span>Enregistrer ma fiche d'urgence</span>
            </button>

            <p className="text-[10px] text-red-300/60 leading-relaxed text-center">
              🔒 Stocké localement — accessible <strong className="text-red-200/80">sans connexion internet</strong>
            </p>
          </div>
        </div>

        {/* ═══ RIGHT COLUMN ═══ */}
        <div className="lg:col-span-2 space-y-6">

          {/* ── Préférences du Voyageur ── */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
              <Settings className="w-5 h-5 text-brand-400" />
              <h3 className="text-base font-bold text-white">Personnalisation du Voyageur</h3>
            </div>

            {/* Currency */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                <Globe className="w-4 h-4 text-brand-400" />
                <span>Devise principale :</span>
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {[
                  { code: 'EUR', flag: '🇪🇺', symbol: '€' },
                  { code: 'USD', flag: '🇺🇸', symbol: '$' },
                  { code: 'TND', flag: '🇹🇳', symbol: 'DT' },
                  { code: 'GBP', flag: '🇬🇧', symbol: '£' },
                  { code: 'CAD', flag: '🇨🇦', symbol: '$' },
                  { code: 'CHF', flag: '🇨🇭', symbol: 'CHF' },
                  { code: 'JPY', flag: '🇯🇵', symbol: '¥' },
                ].map(curr => (
                  <button
                    key={curr.code}
                    onClick={() => handleCurrencyChange(curr.code)}
                    className={`py-2.5 px-1 text-center rounded-xl border transition-all ${
                      currentUser?.preferences?.currency === curr.code
                        ? 'bg-brand-600 text-white border-brand-500 shadow-md ring-2 ring-brand-400/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white hover:border-slate-600'
                    }`}
                  >
                    <div className="text-base leading-none">{curr.flag}</div>
                    <div className="text-[10px] font-bold mt-1">{curr.code}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Pace */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                <Compass className="w-4 h-4 text-amber-400" />
                <span>Rythme de visite :</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { key: 'Relaxed' as const, label: '🧘 Relaxé', desc: 'Profiter sans se presser' },
                  { key: 'Balanced' as const, label: '⚖️ Équilibré', desc: 'Activités & repos' },
                  { key: 'Intense' as const, label: '⚡ Intensif', desc: 'Voir un max de choses' },
                ]).map(p => (
                  <button
                    key={p.key}
                    onClick={() => handlePaceChange(p.key)}
                    className={`py-3 px-2 rounded-xl border transition-all text-center ${
                      currentUser?.preferences?.travelPace === p.key
                        ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-md'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white hover:border-slate-600'
                    }`}
                  >
                    <div className="text-xs font-bold">{p.label}</div>
                    <div className={`text-[10px] mt-0.5 ${currentUser?.preferences?.travelPace === p.key ? 'text-slate-800' : 'text-slate-500'}`}>{p.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Theme */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                <Sun className="w-4 h-4 text-amber-400" />
                <span>Apparence :</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => { setTheme('light'); updatePreferences({ theme: 'light' }); }}
                  className={`py-3 px-3 rounded-xl border flex items-center justify-center space-x-2 transition-all ${
                    theme === 'light'
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-bold'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  <Sun className="w-4 h-4" />
                  <span className="text-xs font-semibold">Mode Jour</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setTheme('dark'); updatePreferences({ theme: 'dark' }); }}
                  className={`py-3 px-3 rounded-xl border flex items-center justify-center space-x-2 transition-all ${
                    theme === 'dark'
                      ? 'bg-brand-600 text-white border-brand-500 shadow-md font-bold'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  <Moon className="w-4 h-4" />
                  <span className="text-xs font-semibold">Mode Nuit</span>
                </button>
              </div>
            </div>

            {/* Interests */}
            <div className="space-y-3 pt-3 border-t border-slate-800">
              <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-pink-400" />
                <span>Centres d'intérêt :</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {interestOptions.map(interest => {
                  const isSelected = currentUser?.preferences?.interests?.includes(interest);
                  return (
                    <button
                      key={interest}
                      onClick={() => toggleInterest(interest)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-medium border flex items-center space-x-1.5 transition-all ${
                        isSelected
                          ? 'bg-pink-500/20 text-pink-300 border-pink-500/50 shadow-sm'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-750 hover:text-white'
                      }`}
                    >
                      <span>{interest}</span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-pink-400" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Passeport Virtuel & Badges ── */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-950/30 via-slate-900 to-indigo-950/20 border border-amber-500/20 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-amber-500/15 rounded-xl border border-amber-500/30">
                  <Award className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <span>Passeport Virtuel</span>
                    <span className="text-lg">🛂</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">Badges débloqués selon vos aventures</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-amber-400">{unlockedCount}<span className="text-base text-slate-500">/{badges.length}</span></div>
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Badges</p>
              </div>
            </div>

            {/* Badge Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {badges.map(badge => (
                <div
                  key={badge.id}
                  className={`p-4 rounded-xl border transition-all ${
                    badge.unlocked
                      ? 'bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/40 shadow-md shadow-amber-500/10'
                      : 'bg-slate-950/50 border-slate-800 opacity-60'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`text-3xl ${badge.unlocked ? '' : 'grayscale opacity-40'}`}>
                      {badge.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className={`text-sm font-bold ${badge.unlocked ? 'text-amber-300' : 'text-slate-500'}`}>
                          {badge.label}
                        </h4>
                        {badge.unlocked && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        )}
                      </div>
                      <p className={`text-[11px] mt-0.5 ${badge.unlocked ? 'text-slate-400' : 'text-slate-600'}`}>
                        {badge.description}
                      </p>
                      <div className="mt-2 space-y-1">
                        <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${
                              badge.unlocked
                                ? 'bg-gradient-to-r from-amber-500 to-emerald-400'
                                : 'bg-slate-600'
                            }`}
                            style={{ width: `${badge.progress ?? 0}%` }}
                          />
                        </div>
                        <p className={`text-[10px] font-medium ${badge.unlocked ? 'text-amber-400/80' : 'text-slate-600'}`}>
                          {badge.progressLabel}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-slate-500 text-center">
              💡 Les badges se débloquent automatiquement — continuez à voyager !
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
