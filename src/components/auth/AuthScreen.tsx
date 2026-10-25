import React, { useState } from 'react';
import { 
  Compass, 
  Lock, 
  Mail, 
  User, 
  Shield, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
  ArrowLeft,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

type AuthMode = 'LOGIN' | 'REGISTER' | 'FORGOT_PASSWORD';

export const AuthScreen: React.FC = () => {
  const { login, register, forgotPassword, resetPassword } = useAuth();
  
  const [mode, setMode] = useState<AuthMode>('LOGIN');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register preferences
  const [currency, setCurrency] = useState('EUR');
  const [travelPace, setTravelPace] = useState<'Relaxed' | 'Balanced' | 'Intense'>('Balanced');

  // Forgot password states
  const [resetStep, setResetStep] = useState<1 | 2>(1);
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Status feedback
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetMessages = () => {
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setIsSubmitting(true);

    if (!email || !password) {
      setErrorMsg('Veuillez renseigner votre email et mot de passe.');
      setIsSubmitting(false);
      return;
    }

    const res = await login(email, password);
    if (!res.success) {
      setErrorMsg(res.message || 'Identifiants invalides.');
    }
    setIsSubmitting(false);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setIsSubmitting(true);

    if (!name || name.trim().length < 2) {
      setErrorMsg('Le nom doit contenir au moins 2 caractères.');
      setIsSubmitting(false);
      return;
    }

    if (!email || !email.includes('@')) {
      setErrorMsg('Veuillez renseigner une adresse email valide.');
      setIsSubmitting(false);
      return;
    }

    if (!password || password.length < 6) {
      setErrorMsg('Le mot de passe doit comporter au moins 6 caractères.');
      setIsSubmitting(false);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Les deux mots de passe ne correspondent pas.');
      setIsSubmitting(false);
      return;
    }

    const res = await register(name, email, password, {
      currency,
      travelPace,
      interests: ['Culture', 'Gastronomie'],
      theme: 'dark'
    });

    if (!res.success) {
      setErrorMsg(res.message || 'Erreur lors de l\'inscription.');
    }
    setIsSubmitting(false);
  };

  // Step 1: Request reset code
  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setIsSubmitting(true);

    if (!email || !email.includes('@')) {
      setErrorMsg('Veuillez fournir une adresse email valide.');
      setIsSubmitting(false);
      return;
    }

    const res = await forgotPassword(email);
    if (res.success) {
      setResetStep(2);
      setSuccessMsg('Un e-mail de réinitialisation contenant votre code OTP a été envoyé à votre boîte de messagerie. Consultez votre boîte de réception (et vos spams).');
    } else {
      setErrorMsg(res.message || 'Adresse email introuvable.');
    }
    setIsSubmitting(false);
  };

  // Step 2: Validate code & set new password
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setIsSubmitting(true);

    if (!resetCode || resetCode.length < 6) {
      setErrorMsg('Le code de sécurité doit contenir 6 chiffres.');
      setIsSubmitting(false);
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setErrorMsg('Le nouveau mot de passe doit comporter au moins 6 caractères.');
      setIsSubmitting(false);
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrorMsg('Les nouveaux mots de passe ne correspondent pas.');
      setIsSubmitting(false);
      return;
    }

    const res = await resetPassword(email, resetCode, newPassword);
    if (res.success) {
      setSuccessMsg(res.message);
      setTimeout(() => {
        setMode('LOGIN');
        setPassword(newPassword);
        setResetStep(1);
      }, 2000);
    } else {
      setErrorMsg(res.message);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden">
      {/* Ambient background gradients */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-brand-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 z-10">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-brand-600 to-amber-500 shadow-xl shadow-brand-500/20 text-white mb-2">
            <Compass className="w-8 h-8 animate-[spin_16s_linear_infinite]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Travel Tracker <span className="text-brand-400 text-lg">PWA</span>
          </h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Plateforme intelligente de planification et gestion de voyages
          </p>
        </div>

        {/* Main Auth Box */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-md space-y-5">
          
          {/* Top navigation tabs (when not in forgot password) */}
          {mode !== 'FORGOT_PASSWORD' ? (
            <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setMode('LOGIN');
                  resetMessages();
                }}
                className={`py-2 rounded-lg transition-all ${
                  mode === 'LOGIN'
                    ? 'bg-brand-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Se Connecter
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('REGISTER');
                  resetMessages();
                }}
                className={`py-2 rounded-lg transition-all ${
                  mode === 'REGISTER'
                    ? 'bg-brand-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Créer un Compte
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2 pb-1 border-b border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setMode('LOGIN');
                  resetMessages();
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h2 className="text-sm font-bold text-white flex items-center space-x-1.5">
                <KeyRound className="w-4 h-4 text-amber-400" />
                <span>Réinitialisation du Mot de Passe</span>
              </h2>
            </div>
          )}

          {/* Feedback messages */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-200 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-200 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* 1. LOGIN MODE */}
          {mode === 'LOGIN' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Adresse Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="nom@exemple.com"
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">Mot de passe</label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('FORGOT_PASSWORD');
                      resetMessages();
                    }}
                    className="text-[11px] text-brand-400 hover:text-brand-300 hover:underline"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-10 py-2 text-sm text-white focus:outline-none focus:border-brand-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-bold rounded-xl shadow-lg shadow-brand-500/25 flex items-center justify-center space-x-2 transition-all transform hover:-translate-y-0.5 disabled:opacity-50"
              >
                <span>{isSubmitting ? 'Contrôle de connexion...' : 'Se Connecter'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* 2. REGISTER MODE */}
          {mode === 'REGISTER' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Prénom</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="ex: Sarah"
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Adresse Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="sarah@exemple.com"
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Mot de passe</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Min. 6 car."
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Confirmation</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Identique"
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Devise préférée</label>
                  <select
                    value={currency}
                    onChange={e => setCurrency(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="EUR">EUR (€)</option>
                    <option value="USD">USD ($)</option>
                    <option value="TND">TND (DT)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Rythme voyage</label>
                  <select
                    value={travelPace}
                    onChange={e => setTravelPace(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="Relaxed">Relaxé</option>
                    <option value="Balanced">Équilibré</option>
                    <option value="Intense">Intensif</option>
                  </select>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 flex items-center space-x-2">
                <Shield className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>Rôle initial attribué : <strong className="text-white">Traveler</strong>. Seul l'administrateur peut modifier les privilèges ultérieurement.</span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-bold rounded-xl shadow-lg shadow-brand-500/25 flex items-center justify-center space-x-2 transition-all transform hover:-translate-y-0.5 disabled:opacity-50"
              >
                <span>{isSubmitting ? 'Création du compte...' : 'Finaliser l\'Inscription'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* 3. FORGOT PASSWORD MODE */}
          {mode === 'FORGOT_PASSWORD' && (
            <div className="space-y-4">
              {resetStep === 1 ? (
                /* Step 1: Email */
                <form onSubmit={handleRequestCode} className="space-y-4">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Saisissez l'adresse email liée à votre compte. Un code de vérification vous sera envoyé par email pour réinitialiser votre mot de passe.
                  </p>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Adresse Email</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="nom@exemple.com"
                        className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
                  >
                    <span>{isSubmitting ? 'Vérification...' : 'Recevoir le Code de Sécurité'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                /* Step 2: Code + New Password */
                <form onSubmit={handleResetSubmit} className="space-y-3.5">
                  {/* Adresse email strictement en mode affichage / lecture seule non modifiable */}
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2.5 min-w-0 mr-2">
                      <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex-shrink-0">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] text-slate-400 block font-medium">Adresse email destinataire du code :</span>
                        <span className="font-bold text-white truncate block">{email}</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-amber-300 border border-slate-700 flex items-center space-x-1 flex-shrink-0 text-[10px] font-semibold">
                      <Lock className="w-3 h-3 text-amber-400" />
                      <span>Mode affichage fixe</span>
                    </span>
                  </div>

                  <div className="p-3 bg-brand-500/10 border border-brand-500/30 rounded-xl text-xs text-brand-300 flex items-start space-x-2.5">
                    <Mail className="w-4 h-4 flex-shrink-0 text-brand-400 mt-0.5" />
                    <span className="leading-relaxed">
                      Un code de sécurité unique à 6 chiffres a été expédié à <strong>{email}</strong>. Seule la personne ayant accès à cette boîte de messagerie peut valider la réinitialisation.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Code de confirmation reçu par e-mail (6 chiffres)</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={resetCode}
                      onChange={e => setResetCode(e.target.value)}
                      placeholder="123456"
                      className="w-full font-mono text-center tracking-widest text-lg bg-slate-800 border border-slate-700 rounded-xl py-2 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Nouveau mot de passe</label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Min. 6 caractères"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Confirmer le nouveau mot de passe</label>
                    <input
                      type="password"
                      required
                      value={confirmNewPassword}
                      onChange={e => setConfirmNewPassword(e.target.value)}
                      placeholder="Répétez le mot de passe"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/25 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>{isSubmitting ? 'Mise à jour...' : 'Valider le Nouveau Mot de Passe'}</span>
                  </button>
                </form>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
