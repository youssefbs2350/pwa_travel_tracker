import React, { useState, useRef } from 'react';
import { 
  Camera, 
  Upload, 
  Link as LinkIcon, 
  Dices, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Sparkles,
  AlertCircle
} from 'lucide-react';

export interface AvatarPreset {
  id: string;
  name: string;
  url: string;
  category: 'adventurer' | 'portrait';
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  // 1. Aventuriers illustrés (DiceBear Adventurer)
  { id: 'adv-1', name: 'Félix (Baroudeur)', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix', category: 'adventurer' },
  { id: 'adv-2', name: 'Aneka (Globe-trotteuse)', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Aneka', category: 'adventurer' },
  { id: 'adv-3', name: 'Jack (Explorateur)', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Jack', category: 'adventurer' },
  { id: 'adv-4', name: 'Mila (Nomade)', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Mila', category: 'adventurer' },
  { id: 'adv-5', name: 'Léo (Randonneur)', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Leo', category: 'adventurer' },
  { id: 'adv-6', name: 'Aria (Alpiniste)', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Aria', category: 'adventurer' },
  { id: 'adv-7', name: 'Ethan (Navigateur)', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Ethan', category: 'adventurer' },
  { id: 'adv-8', name: 'Zoé (Surfeuse)', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Zoe', category: 'adventurer' },

  // 2. Portraits Voyageurs (Unsplash HD)
  { id: 'port-1', name: 'Youssef', url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150', category: 'portrait' },
  { id: 'port-2', name: 'Sarah', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', category: 'portrait' },
  { id: 'port-3', name: 'Ameni', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150', category: 'portrait' },
  { id: 'port-4', name: 'Lucas', url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150', category: 'portrait' },
  { id: 'port-5', name: 'Leïla', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', category: 'portrait' },
  { id: 'port-6', name: 'Marc', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', category: 'portrait' },
  { id: 'port-7', name: 'Chloé', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150', category: 'portrait' },
  { id: 'port-8', name: 'David', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', category: 'portrait' },
];

interface AvatarPickerProps {
  value: string;
  onChange: (avatarUrl: string) => void;
  label?: string;
  compact?: boolean;
}

export const AvatarPicker: React.FC<AvatarPickerProps> = ({
  value,
  onChange,
  label = 'Avatar du compte',
  compact = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'adventurer' | 'portrait' | 'upload' | 'url'>('adventurer');
  const [customUrl, setCustomUrl] = useState('');
  const [urlError, setUrlError] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Compression automatique côté client de l'image téléversée pour PWA / Offline
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Veuillez sélectionner un fichier image valide (PNG, JPEG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('L’image est trop volumineuse (max 5 Mo).');
      return;
    }

    setUploadError('');
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const maxSize = 256;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          onChange(compressedDataUrl);
        } else {
          onChange(event.target?.result as string);
        }
      };
      img.onerror = () => {
        setUploadError('Impossible de charger cette image.');
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Génération d'un avatar aléatoire DiceBear
  const handleRandomAvatar = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const seeds = ['Atlas', 'Sahara', 'Everest', 'BoraBora', 'Kyoto', 'Safari', 'Oasis', 'Aurora', 'Rio', 'Fjord', 'Cosmos', 'Zephyr'];
    const randomSeed = seeds[Math.floor(Math.random() * seeds.length)] + '-' + Math.floor(Math.random() * 1000);
    const generatedUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${randomSeed}`;
    onChange(generatedUrl);
  };

  const handleApplyUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) return;
    try {
      new URL(customUrl.trim());
      onChange(customUrl.trim());
      setUrlError(false);
    } catch {
      setUrlError(true);
    }
  };

  // 5 premiers presets pour la barre rapide
  const quickPresets = AVATAR_PRESETS.slice(0, 5);

  return (
    <div className="space-y-2.5">
      {/* Header / Active Avatar Badge */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
          <Sparkles className="w-3.5 h-3.5 text-brand-400" />
          <span>{label}</span>
        </label>
        <button
          type="button"
          onClick={handleRandomAvatar}
          className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 flex items-center space-x-1 transition-colors px-2 py-0.5 rounded-lg hover:bg-amber-500/10"
          title="Générer un avatar aléatoire"
        >
          <Dices className="w-3.5 h-3.5" />
          <span>Aléatoire</span>
        </button>
      </div>

      {/* Main Avatar Preview Bar */}
      <div className="p-2.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="relative flex-shrink-0 group cursor-pointer" onClick={() => setIsOpen(prev => !prev)}>
            <img
              src={value || AVATAR_PRESETS[0].url}
              alt="Avatar sélectionné"
              className="w-12 h-12 rounded-xl object-cover border-2 border-brand-500 shadow-md shadow-brand-500/20 bg-slate-800 transition-transform group-hover:scale-105"
              onError={(e) => {
                (e.target as HTMLImageElement).src = AVATAR_PRESETS[0].url;
              }}
            />
            <div className="absolute -bottom-1 -right-1 p-0.5 bg-brand-600 rounded-md text-white border border-slate-900 shadow">
              <Camera className="w-2.5 h-2.5" />
            </div>
          </div>

          <div className="min-w-0">
            <p className="text-xs font-bold text-white truncate">
              {AVATAR_PRESETS.find(p => p.url === value)?.name || (value.startsWith('data:') ? 'Photo personnalisée' : 'Avatar sélectionné')}
            </p>
            <p className="text-[10px] text-slate-400 truncate">
              Cliquez pour changer ou explorer la galerie
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(prev => !prev)}
          className="flex items-center space-x-1 text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 transition-colors flex-shrink-0"
        >
          <span>{isOpen ? 'Fermer' : 'Choisir'}</span>
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Quick Selection strip (when picker is closed) */}
      {!isOpen && !compact && (
        <div className="flex items-center space-x-2 pt-0.5">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold pl-1">
            Suggestions :
          </span>
          <div className="flex items-center space-x-1.5 overflow-x-auto py-1">
            {quickPresets.map(preset => {
              const isSelected = value === preset.url;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onChange(preset.url)}
                  title={preset.name}
                  className={`relative w-8 h-8 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                    isSelected
                      ? 'border-brand-400 ring-2 ring-brand-400/30 scale-105'
                      : 'border-slate-700 hover:border-slate-500 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={preset.url} alt={preset.name} className="w-full h-full object-cover bg-slate-800" />
                  {isSelected && (
                    <div className="absolute inset-0 bg-brand-500/20 flex items-center justify-center">
                      <Check className="w-3 h-3 text-brand-300 drop-shadow" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Expanded Avatar Gallery & Options */}
      {isOpen && (
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-750 shadow-xl space-y-3 animate-in fade-in zoom-in-95 duration-150">
          
          {/* Navigation Tabs */}
          <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('adventurer')}
              className={`py-1.5 rounded-lg transition-colors ${
                activeTab === 'adventurer'
                  ? 'bg-brand-600 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Aventuriers
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('portrait')}
              className={`py-1.5 rounded-lg transition-colors ${
                activeTab === 'portrait'
                  ? 'bg-brand-600 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Portraits
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`py-1.5 rounded-lg transition-colors flex items-center justify-center space-x-1 ${
                activeTab === 'upload'
                  ? 'bg-brand-600 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Upload className="w-3 h-3" />
              <span>Photo</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('url')}
              className={`py-1.5 rounded-lg transition-colors flex items-center justify-center space-x-1 ${
                activeTab === 'url'
                  ? 'bg-brand-600 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LinkIcon className="w-3 h-3" />
              <span>URL</span>
            </button>
          </div>

          {/* TAB 1: Aventuriers illustrés */}
          {activeTab === 'adventurer' && (
            <div className="space-y-2">
              <div className="grid grid-cols-4 gap-2.5 max-h-48 overflow-y-auto pr-1">
                {AVATAR_PRESETS.filter(p => p.category === 'adventurer').map(preset => {
                  const isSelected = value === preset.url;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => onChange(preset.url)}
                      className={`relative group flex flex-col items-center p-1.5 rounded-xl border text-center transition-all ${
                        isSelected
                          ? 'border-brand-400 bg-brand-500/10 shadow-md ring-1 ring-brand-400'
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-slate-800">
                        <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                        {isSelected && (
                          <div className="absolute top-1 right-1 p-0.5 bg-brand-500 text-white rounded-full shadow">
                            <Check className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-300 font-medium mt-1 truncate w-full">
                        {preset.name.split(' ')[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: Portraits Voyageurs réels */}
          {activeTab === 'portrait' && (
            <div className="space-y-2">
              <div className="grid grid-cols-4 gap-2.5 max-h-48 overflow-y-auto pr-1">
                {AVATAR_PRESETS.filter(p => p.category === 'portrait').map(preset => {
                  const isSelected = value === preset.url;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => onChange(preset.url)}
                      className={`relative group flex flex-col items-center p-1.5 rounded-xl border text-center transition-all ${
                        isSelected
                          ? 'border-brand-400 bg-brand-500/10 shadow-md ring-1 ring-brand-400'
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-slate-800">
                        <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                        {isSelected && (
                          <div className="absolute top-1 right-1 p-0.5 bg-brand-500 text-white rounded-full shadow">
                            <Check className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-300 font-medium mt-1 truncate w-full">
                        {preset.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: Téléversement de photo locale */}
          {activeTab === 'upload' && (
            <div className="space-y-2.5 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-5 border-2 border-dashed border-slate-700 hover:border-brand-500 bg-slate-950/60 hover:bg-slate-950 rounded-xl cursor-pointer transition-all flex flex-col items-center justify-center space-y-2 group"
              >
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 group-hover:bg-brand-500/20 text-brand-400 flex items-center justify-center border border-brand-500/20 transition-colors">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-200">
                    Cliquez pour choisir une photo
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    JPG, PNG, WebP (Optimisée et compressée automatiquement)
                  </p>
                </div>
              </div>

              {uploadError && (
                <div className="text-[11px] text-rose-400 flex items-center justify-center space-x-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{uploadError}</span>
                </div>
              )}

              {value.startsWith('data:') && (
                <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-950/50 border border-emerald-500/30 text-[11px] text-emerald-300">
                  <span className="flex items-center space-x-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Photo importée avec succès !</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => onChange(AVATAR_PRESETS[0].url)}
                    className="text-[10px] text-slate-400 hover:text-white underline"
                  >
                    Réinitialiser
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: URL personnalisée */}
          {activeTab === 'url' && (
            <form onSubmit={handleApplyUrl} className="space-y-2.5">
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400">Lien direct de l'image (HTTPS)</label>
                <div className="relative">
                  <LinkIcon className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="url"
                    value={customUrl}
                    onChange={e => {
                      setCustomUrl(e.target.value);
                      setUrlError(false);
                    }}
                    placeholder="https://exemple.com/mon-avatar.jpg"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              {urlError && (
                <p className="text-[10px] text-rose-400 flex items-center space-x-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>Veuillez entrer une adresse URL valide.</span>
                </p>
              )}

              <button
                type="submit"
                className="w-full py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center space-x-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Appliquer le lien</span>
              </button>
            </form>
          )}

          {/* Footer note */}
          <div className="pt-1 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
            <span>Compatible mode hors-ligne PWA</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white font-medium underline"
            >
              Terminé
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
