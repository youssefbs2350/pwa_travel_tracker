import React, { useState } from 'react';
import { 
  Users, 
  Shield, 
  Key, 
  Settings, 
  UserPlus, 
  CheckCircle, 
  Globe, 
  Compass, 
  Sparkles,
  Lock,
  Copy,
  AlertTriangle,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { User, UserRole } from '../../types';
import { Modal } from '../common/Modal';

export const UsersView: React.FC = () => {
  const { currentUser, allUsers, isAdmin, updateUserRole, updatePreferences, register } = useAuth();
  const [copiedToken, setCopiedToken] = useState(false);
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ text: string; error?: boolean } | null>(null);

  // New user form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('Traveler');
  const [currency, setCurrency] = useState('EUR');
  const [pace, setPace] = useState<'Relaxed' | 'Balanced' | 'Intense'>('Balanced');

  const handleCopyToken = () => {
    if (currentUser?.token) {
      navigator.clipboard.writeText(currentUser.token);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  const handleRoleChange = async (targetUserId: string, newRole: UserRole) => {
    if (!isAdmin) {
      setActionMessage({ text: "Action interdite : Seul l'administrateur peut modifier les rôles.", error: true });
      setTimeout(() => setActionMessage(null), 4000);
      return;
    }

    const res = await updateUserRole(targetUserId, newRole);
    if (res.success) {
      setActionMessage({ text: `Rôle mis à jour avec succès : ${newRole}` });
    } else {
      setActionMessage({ text: res.message || 'Erreur lors du changement de rôle', error: true });
    }
    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    const res = await register(name, email, role, {
      currency,
      travelPace: pace,
      interests: ['Culture', 'Gastronomie'],
      theme: 'dark'
    });

    if (res.success) {
      setName('');
      setEmail('');
      setIsNewUserModalOpen(false);
      setActionMessage({ text: 'Nouvel utilisateur créé avec succès.' });
      setTimeout(() => setActionMessage(null), 4000);
    } else {
      setActionMessage({ text: res.message || 'Erreur lors de la création', error: true });
    }
  };

  const interestOptions = ['Culture', 'Gastronomie', 'Monuments', 'Nature', 'Aventure', 'Plage', 'Shopping'];

  const toggleInterest = (interest: string) => {
    if (!currentUser) return;
    const current = currentUser.preferences.interests || [];
    const updated = current.includes(interest)
      ? current.filter(i => i !== interest)
      : [...current, interest];
    updatePreferences({ interests: updated });
  };

  return (
    <div className="space-y-6">
      {/* Header with Member Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-white">Utilisateurs & Profils</h2>
            </div>
            <p className="text-sm text-slate-400 mt-0.5">
              Authentification JWT, gestion sécurisée des rôles (Admin uniquement) et préférences voyageur.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsNewUserModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/25 transition-all self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Créer un Profil</span>
        </button>
      </div>

      {/* Action Notification Alert */}
      {actionMessage && (
        <div className={`p-4 rounded-xl border text-xs flex items-center space-x-2.5 transition-all ${
          actionMessage.error 
            ? 'bg-rose-950/70 border-rose-500/50 text-rose-200' 
            : 'bg-emerald-950/70 border-emerald-500/50 text-emerald-200'
        }`}>
          {actionMessage.error ? <AlertTriangle className="w-4 h-4 flex-shrink-0" /> : <CheckCircle className="w-4 h-4 flex-shrink-0" />}
          <span>{actionMessage.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Active User Profile & JWT Token Inspector */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
            <div className="flex items-center space-x-4">
              <img
                src={currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                alt={currentUser?.name}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-500 shadow-md"
              />
              <div>
                <h3 className="font-bold text-white text-lg">{currentUser?.name}</h3>
                <p className="text-xs text-slate-400">{currentUser?.email}</p>
                <div className="mt-2 inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-semibold">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Rôle : {currentUser?.role}</span>
                </div>
              </div>
            </div>

            {/* Role assignment rule display */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-300 flex items-center space-x-1.5">
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  <span>Permission de Rôle</span>
                </span>
                {isAdmin ? (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded font-bold">
                    ✓ Autorisé (Admin)
                  </span>
                ) : (
                  <span className="text-[10px] bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded flex items-center space-x-1">
                    <Lock className="w-2.5 h-2.5" />
                    <span>Verrouillé</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {isAdmin 
                  ? "Vous êtes Administrateur : vous pouvez modifier le rôle de n'importe quel compte dans le tableau d'administration ci-dessous."
                  : "🔒 Règle de sécurité : Le rôle ne peut être modifié que par l'administrateur (Admin). Votre compte est actuellement non modifiable sans droits d'administration."}
              </p>
            </div>

            {/* JWT Token Simulation Box */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300 flex items-center space-x-1">
                  <Key className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Jeton JWT (Stocké en Session)</span>
                </span>
                <button
                  onClick={handleCopyToken}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedToken ? 'Copié !' : 'Copier'}</span>
                </button>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-indigo-300 break-all leading-tight select-all">
                {currentUser?.token || 'jwt-bearer-token-none'}
              </div>
              <div className="text-[11px] text-slate-400 flex items-center space-x-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>Session active sécurisée.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Admin User Management & Personal Preferences */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Admin Table (Only Admin can modify roles) */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Gestion des Comptes & Attribution des Rôles</h3>
              </div>
              <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                {allUsers.length} utilisateurs enregistrés
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Utilisateur</th>
                    <th className="py-2.5 px-3">Email</th>
                    <th className="py-2.5 px-3">Rôle Actuel</th>
                    <th className="py-2.5 px-3 text-right">Modifier le Rôle {isAdmin ? '(Admin)' : '(Verrouillé)'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {allUsers.map(user => (
                    <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-2.5 px-3 flex items-center space-x-2">
                        <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-full object-cover" />
                        <span className="font-semibold text-white truncate">{user.name}</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">{user.email}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          user.role === 'Admin' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                          user.role === 'Organizer' ? 'bg-sky-500/20 text-sky-300 border-sky-500/40' :
                          'bg-slate-800 text-slate-300 border-slate-700'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {isAdmin ? (
                          <div className="inline-flex space-x-1">
                            {(['Traveler', 'Organizer', 'Admin'] as UserRole[]).map(r => (
                              <button
                                key={r}
                                onClick={() => handleRoleChange(user.id, r)}
                                className={`px-2 py-1 text-[10px] rounded font-semibold border transition-all ${
                                  user.role === r
                                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                                }`}
                              >
                                {r}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic flex items-center justify-end space-x-1">
                            <Lock className="w-3 h-3" />
                            <span>Modification réservée à l'Admin</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Preferences Section */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
              <Settings className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-white">Mes Préférences de Voyage</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                  <Globe className="w-4 h-4 text-brand-400" />
                  <span>Devise par défaut :</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['EUR', 'USD', 'TND', 'GBP'].map(curr => (
                    <button
                      key={curr}
                      onClick={() => updatePreferences({ currency: curr })}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                        currentUser?.preferences.currency === curr
                          ? 'bg-brand-600 text-white border-brand-500 shadow-md'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                    >
                      {curr}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                  <Compass className="w-4 h-4 text-amber-400" />
                  <span>Rythme de séjour préféré :</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Relaxed', 'Balanced', 'Intense'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => updatePreferences({ travelPace: p })}
                      className={`py-2 text-xs font-medium rounded-xl border transition-all ${
                        currentUser?.preferences.travelPace === p
                          ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-md'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                    >
                      {p === 'Relaxed' ? 'Relaxé' : p === 'Balanced' ? 'Équilibré' : 'Intensif'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-slate-800">
              <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-pink-400" />
                <span>Centres d'intérêt pour les recommandations automatiques :</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {interestOptions.map(interest => {
                  const isSelected = currentUser?.preferences.interests?.includes(interest);
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
                      {isSelected && <CheckCircle className="w-3 h-3 text-pink-400" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Modal: Create User */}
      <Modal
        isOpen={isNewUserModalOpen}
        onClose={() => setIsNewUserModalOpen(false)}
        title="Créer un nouveau profil voyageur"
        subtitle="Enregistrez un nouveau compte avec son rôle"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Nom complet</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="ex: Amina Khelil"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Adresse Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="amina@traveltracker.io"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Rôle initial</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value as UserRole)}
                disabled={!isAdmin}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50"
              >
                <option value="Traveler">Traveler (Voyageur)</option>
                <option value="Organizer">Organizer (Organisateur)</option>
                <option value="Admin">Admin (Administrateur)</option>
              </select>
              {!isAdmin && (
                <p className="text-[10px] text-slate-500 mt-1">Défini sur Traveler par défaut (Admin requis pour changer).</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Devise</label>
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
                <option value="TND">TND (DT)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsNewUserModalOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 text-sm font-semibold rounded-xl"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-600/30"
            >
              Enregistrer
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
