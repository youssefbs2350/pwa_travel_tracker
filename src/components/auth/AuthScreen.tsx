import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  Lock, 
  Mail, 
  User, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
  ArrowLeft,
  RotateCcw,
  MapPin,
  Wallet,
  Camera,
  Users,
  ChevronRight,
  ChevronLeft,
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { AvatarPicker, AVATAR_PRESETS } from '../common/AvatarPicker';
import { GoogleAuthModal, GoogleIcon } from './GoogleAuthModal';

type AuthMode = 'LOGIN' | 'REGISTER' | 'FORGOT_PASSWORD';

const SHOWCASE_DESTINATIONS = [
  {
    title: 'Kyoto & Tokyo, Japon',
    tag: 'Culture & Gastronomie',
    desc: 'Circuits sur-mesure, sanctuaires millénaires et découvertes locales géolocalisées.',
    image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1000&auto=format&fit=crop&q=80',
    stat: '10 Jours • 18 Activités',
    badge: 'Circuit phare'
  },
  {
    title: 'Côte Amalfitaine, Italie',
    tag: 'Paysages & Détente',
    desc: 'Budget partagé, conversion multi-devises automatique et équilibrage des dépenses.',
    image: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=1000&auto=format&fit=crop&q=80',
    stat: '7 Jours • Budget Maîtrisé',
    badge: 'Évasion'
  },
  {
    title: 'Santorin & Cyclades, Grèce',
    tag: 'Aventure & Couchers de soleil',
    desc: 'Collaboration d\'équipe, carnet de route détaillé et galerie photo partagée.',
    image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1000&auto=format&fit=crop&q=80',
    stat: '5 Jours • Voyageurs Connectés',
    badge: 'Inspiration'
  }
];

export const AuthScreen: React.FC = () => {
  const { login, loginWithGoogle, register, forgotPassword, resetPassword } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  const [mode, setMode] = useState<AuthMode>('LOGIN');
  const [activeSlide, setActiveSlide] = useState(0);

  // Auto-slide showcase destinations
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % SHOWCASE_DESTINATIONS.length);
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register preferences
  const [currency, setCurrency] = useState('EUR');
  const [travelPace, setTravelPace] = useState<'Relaxed' | 'Balanced' | 'Intense'>('Balanced');
  const [avatar, setAvatar] = useState(AVATAR_PRESETS[0].url);

  // Forgot password states
  const [resetStep, setResetStep] = useState<1 | 2>(1);
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Google OAuth states
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Status feedback
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  // Initialize Google Identity Services SDK if Client ID is configured
  useEffect(() => {
    if (!googleClientId) return;

    const initGsi = () => {
      if (typeof window !== 'undefined' && (window as any).google?.accounts?.id) {
        try {
          (window as any).google.accounts.id.initialize({
            client_id: googleClientId,
            callback: async (response: { credential: string }) => {
              if (response?.credential) {
                setIsGoogleLoading(true);
                resetMessages();
                const res = await loginWithGoogle(response.credential);
                if (!res.success) {
                  setErrorMsg(res.message || 'Échec de la connexion avec Google.');
                }
                setIsGoogleLoading(false);
              }
            }
          });
        } catch (err) {
          console.warn('Erreur initialisation Google Identity Services:', err);
        }
      }
    };

    if ((window as any).google?.accounts?.id) {
      initGsi();
    } else {
      const timer = setInterval(() => {
        if ((window as any).google?.accounts?.id) {
          initGsi();
          clearInterval(timer);
        }
      }, 400);
      return () => clearInterval(timer);
    }
  }, [googleClientId]);

  const handleGoogleSignInClick = () => {
    resetMessages();
    if (googleClientId && (window as any).google?.accounts?.id) {
      try {
        (window as any).google.accounts.id.prompt();
        return;
      } catch {
        // Fallback to modal selector
      }
    }
    setShowGoogleModal(true);
  };

  const handleSelectGoogleAccount = async (profile: { email: string; name: string; avatar?: string; googleId?: string }) => {
    setIsGoogleLoading(true);
    resetMessages();
    const res = await loginWithGoogle(undefined, profile);
    setIsGoogleLoading(false);
    if (res.success) {
      setShowGoogleModal(false);
    } else {
      setErrorMsg(res.message || 'Échec de la connexion avec Google.');
    }
  };

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

    const res = await register(
      name, 
      email, 
      password, 
      {
        currency,
        travelPace,
        interests: ['Culture', 'Gastronomie'],
        theme: 'dark'
      },
      avatar
    );

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

  const currShowcase = SHOWCASE_DESTINATIONS[activeSlide];

  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden flex flex-col justify-between">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-brand-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Navbar */}
      <header className="relative z-20 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
              <Compass className="w-6 h-6 animate-[spin_20s_linear_infinite]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg text-white tracking-tight">Travel Tracker</span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">Planification intelligente de vos voyages</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-amber-400 hover:text-amber-300 transition-all hover:scale-105 active:scale-95 shadow-sm"
              title={theme === 'dark' ? 'Activer le Mode Jour (Day Mode)' : 'Activer le Mode Nuit (Night Mode)'}
              aria-label="Basculer le mode jour / nuit"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content: Split Landing Page (Left: Presentation & Showcase, Right: Auth Form) */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 flex-1 flex items-center w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center w-full">
          
          {/* LEFT COLUMN: Presentation & Dynamic Visual Showcase (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Tagline */}
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-white">
                Planifiez, vivez et partagez vos voyages <span className="bg-gradient-to-r from-brand-400 via-sky-300 to-amber-300 bg-clip-text text-transparent">sans friction</span>.
              </h1>
              
              <p className="text-sm sm:text-base text-slate-400 max-w-xl leading-relaxed">
                L'application tout-en-un pour voyageurs et organisateurs. Itinéraires précis, cartes interactives, santé financière multi-devises et album de souvenirs collaboratif.
              </p>
            </div>

            {/* Dynamic Visual Showcase Card */}
            <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl group">
              <div className="relative h-60 sm:h-72 w-full overflow-hidden">
                <img
                  src={currShowcase.image}
                  alt={currShowcase.title}
                  className="w-full h-full object-cover object-center filter brightness-[0.70] transition-all duration-700 ease-out transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                {/* Top Badge */}
                <div className="absolute top-3 left-3 flex items-center space-x-2">
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-brand-600/90 text-white backdrop-blur-md shadow">
                    {currShowcase.badge}
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-900/80 text-slate-300 border border-slate-700 backdrop-blur-md">
                    {currShowcase.tag}
                  </span>
                </div>

                {/* Slide Controls */}
                <div className="absolute top-3 right-3 flex items-center space-x-1">
                  <button
                    onClick={() => setActiveSlide((activeSlide - 1 + SHOWCASE_DESTINATIONS.length) % SHOWCASE_DESTINATIONS.length)}
                    aria-label="Destination précédente"
                    className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 backdrop-blur-md border border-slate-700 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setActiveSlide((activeSlide + 1) % SHOWCASE_DESTINATIONS.length)}
                    aria-label="Destination suivante"
                    className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 backdrop-blur-md border border-slate-700 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Bottom Card Info */}
                <div className="absolute bottom-4 left-4 right-4 space-y-1">
                  <div className="flex items-center justify-between text-xs text-amber-300 font-semibold">
                    <span className="flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{currShowcase.title}</span>
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-900/90 border border-slate-700 text-[10px] text-slate-300">
                      {currShowcase.stat}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 line-clamp-2">
                    {currShowcase.desc}
                  </p>
                </div>
              </div>

              {/* Carousel Indicators */}
              <div className="p-2.5 bg-slate-900/90 border-t border-slate-800 flex items-center justify-center space-x-2">
                {SHOWCASE_DESTINATIONS.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveSlide(idx)}
                    aria-label={`Aller au slide ${idx + 1}`}
                    className={`h-1.5 rounded-full transition-all ${
                      activeSlide === idx ? 'w-6 bg-brand-400' : 'w-2 bg-slate-700 hover:bg-slate-600'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* 4 Feature Highlights Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                  <MapPin className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-white">Cartes & GPS</h4>
                <p className="text-[10px] text-slate-400 leading-tight">Points d'intérêt géolocalisés et durées</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Wallet className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-white">Budget Partagé</h4>
                <p className="text-[10px] text-slate-400 leading-tight">Multi-devises et balance en temps réel</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                <div className="w-7 h-7 rounded-lg bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400">
                  <Camera className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-white">Souvenirs & Photos</h4>
                <p className="text-[10px] text-slate-400 leading-tight">Récits de voyage et galerie interactive</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Users className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-white">Participants</h4>
                <p className="text-[10px] text-slate-400 leading-tight">Voyageurs synchronisés dynamiquement</p>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Authentication & Access Portal (5 cols) */}
          <div className="lg:col-span-5 w-full">
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl space-y-5">
              
              {/* Box Header */}
              <div className="space-y-1 text-center">
                <h2 className="text-xl font-bold text-white">
                  {mode === 'LOGIN' ? 'Espace de Connexion' : mode === 'REGISTER' ? 'Créer un Compte' : 'Récupération de compte'}
                </h2>
                <p className="text-xs text-slate-400">
                  {mode === 'LOGIN' 
                    ? 'Accédez à vos séjours et vos données de voyage' 
                    : mode === 'REGISTER' 
                    ? 'Rejoignez la communauté des voyageurs' 
                    : 'Suivez les instructions pour réinitialiser votre accès'}
                </p>
              </div>

              {/* Mode Switch Tabs */}
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
                  <h3 className="text-xs font-bold text-white flex items-center space-x-1.5">
                    <KeyRound className="w-4 h-4 text-amber-400" />
                    <span>Réinitialisation du Mot de Passe</span>
                  </h3>
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
                <div className="space-y-4">
                  {/* Google Sign In Button */}
                  <button
                    type="button"
                    onClick={handleGoogleSignInClick}
                    disabled={isSubmitting || isGoogleLoading}
                    className="w-full py-2.5 px-4 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-750 hover:border-slate-500 text-white font-semibold text-xs sm:text-sm flex items-center justify-center space-x-3 transition-all duration-200 shadow-sm hover:shadow active:scale-[0.99] disabled:opacity-60"
                  >
                    <GoogleIcon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                    <span>{isGoogleLoading ? 'Connexion Google en cours...' : 'Se connecter avec Google'}</span>
                  </button>

                  {/* Separator */}
                  <div className="relative flex items-center justify-center py-0.5">
                    <div className="border-t border-slate-800 w-full"></div>
                    <span className="bg-slate-900 px-3 text-[11px] uppercase tracking-wider text-slate-500 font-semibold absolute">
                      ou par e-mail
                    </span>
                  </div>

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
                      disabled={isSubmitting || isGoogleLoading}
                      className="w-full py-3 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-bold rounded-xl shadow-lg shadow-brand-500/25 flex items-center justify-center space-x-2 transition-all transform hover:-translate-y-0.5 disabled:opacity-50"
                    >
                      <span>{isSubmitting ? 'Contrôle de connexion...' : 'Se Connecter'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              )}

              {/* 2. REGISTER MODE */}
              {mode === 'REGISTER' && (
                <div className="space-y-3.5">
                  {/* Google Sign Up Button */}
                  <button
                    type="button"
                    onClick={handleGoogleSignInClick}
                    disabled={isSubmitting || isGoogleLoading}
                    className="w-full py-2.5 px-4 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-750 hover:border-slate-500 text-white font-semibold text-xs sm:text-sm flex items-center justify-center space-x-3 transition-all duration-200 shadow-sm hover:shadow active:scale-[0.99] disabled:opacity-60"
                  >
                    <GoogleIcon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                    <span>{isGoogleLoading ? 'Création Google en cours...' : 'S\'inscrire avec Google'}</span>
                  </button>

                  {/* Separator */}
                  <div className="relative flex items-center justify-center py-0.5">
                    <div className="border-t border-slate-800 w-full"></div>
                    <span className="bg-slate-900 px-3 text-[11px] uppercase tracking-wider text-slate-500 font-semibold absolute">
                      ou inscription manuelle
                    </span>
                  </div>

                  <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                    <AvatarPicker
                      value={avatar}
                      onChange={setAvatar}
                      label="Avatar du voyageur (personnalisable)"
                    />

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Prénom / Nom</label>
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
                        <input
                          type="password"
                          required
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          placeholder="Min. 6 car."
                          className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Confirmation</label>
                        <input
                          type="password"
                          required
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                          placeholder="Répétez"
                          className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500 transition-colors"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Devise Principale</label>
                        <select
                          value={currency}
                          onChange={e => setCurrency(e.target.value)}
                          className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                        >
                          <option value="EUR">EUR (€)</option>
                          <option value="USD">USD ($)</option>
                          <option value="TND">TND (DT)</option>
                          <option value="GBP">GBP (£)</option>
                          <option value="JPY">JPY (¥)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Rythme Souhaité</label>
                        <select
                          value={travelPace}
                          onChange={e => setTravelPace(e.target.value as any)}
                          className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                        >
                          <option value="Relaxed">Détendu (2 act./j)</option>
                          <option value="Balanced">Équilibré (3 act./j)</option>
                          <option value="Intense">Intense (4 act./j)</option>
                        </select>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting || isGoogleLoading}
                      className="w-full py-3 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-bold rounded-xl shadow-lg shadow-brand-500/25 flex items-center justify-center space-x-2 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 mt-2"
                    >
                      <span>{isSubmitting ? 'Création du compte...' : 'Créer Mon Compte'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              )}

              {/* 3. FORGOT PASSWORD MODE */}
              {mode === 'FORGOT_PASSWORD' && (
                <div className="space-y-4">
                  {resetStep === 1 ? (
                    <form onSubmit={handleRequestCode} className="space-y-4">
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Entrez l'adresse email associée à votre compte. Nous vous transmettrons un code de sécurité à 6 chiffres par e-mail.
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
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-lg shadow-amber-600/25 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
                      >
                        <KeyRound className="w-4 h-4" />
                        <span>{isSubmitting ? 'Transmission en cours...' : 'Recevoir le Code de Sécurité'}</span>
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleResetSubmit} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Destinataire de la réinitialisation</label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                          <input
                            type="email"
                            readOnly
                            disabled
                            value={email}
                            className="w-full bg-slate-950/70 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-300 font-semibold cursor-not-allowed select-none opacity-90"
                          />
                        </div>
                        <div className="flex items-center justify-between mt-1 text-[11px]">
                          <span className="text-slate-400">Le code OTP a été envoyé à cette adresse.</span>
                          <button
                            type="button"
                            onClick={() => {
                              setResetStep(1);
                              setResetCode('');
                              resetMessages();
                            }}
                            className="text-amber-400 hover:text-amber-300 underline font-medium"
                          >
                            Changer d'email
                          </button>
                        </div>
                      </div>

                      <div className="p-3 bg-brand-500/10 border border-brand-500/30 rounded-xl text-xs text-brand-300 flex items-start space-x-2.5">
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-brand-400 mt-0.5" />
                        <span className="leading-relaxed">
                          Un code de sécurité unique à 6 chiffres a été expédié à <strong>{email}</strong>.
                        </span>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Code de confirmation (6 chiffres)</label>
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
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Confirmer le mot de passe</label>
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
      </main>

      {/* Google Auth Modal (Selector & Dev simulator) */}
      <GoogleAuthModal
        isOpen={showGoogleModal}
        onClose={() => setShowGoogleModal(false)}
        onSelectAccount={handleSelectGoogleAccount}
        isSubmitting={isGoogleLoading}
      />

      {/* Footer */}
      <footer className="relative z-20 border-t border-slate-900 bg-slate-950/80 py-4 text-center text-xs text-slate-500">
        <p>© 2026 Travel Tracker PWA • Plateforme de Gestion de Voyages Intelligente</p>
      </footer>
    </div>
  );
};
