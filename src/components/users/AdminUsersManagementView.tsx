import React, { useState } from 'react';
import { 
  Shield, 
  Users, 
  UserPlus, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert,
  Heart,
  Phone,
  Mail,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Droplets
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole, User } from '../../types';
import { Modal } from '../common/Modal';
import { AvatarPicker, AVATAR_PRESETS } from '../common/AvatarPicker';

export const AdminUsersManagementView: React.FC = () => {
  const { currentUser, allUsers, isAdmin, updateUserRole, register } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);
  const [notification, setNotification] = useState<{ text: string; error?: boolean } | null>(null);
  const [expandedEmergency, setExpandedEmergency] = useState<string | null>(null);
  const [showEmergencyPanel, setShowEmergencyPanel] = useState(false);

  // New user form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [selectedRole, setSelectedRole] = useState<UserRole>('Traveler');
  const [avatar, setAvatar] = useState(AVATAR_PRESETS[0].url);

  // STRICT ACCESS CONTROL: IF NOT ADMIN, REJECT ACCESS!
  if (!isAdmin) {
    return (
      <div className="min-h-[500px] flex items-center justify-center p-6">
        <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900 border border-rose-500/40 text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center border border-rose-500/30">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">Accès Réservé</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            La gestion des utilisateurs est réservée aux administrateurs.
          </p>
        </div>
      </div>
    );
  }

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    const res = await updateUserRole(userId, newRole);
    if (res.success) {
      setNotification({ text: `Rôle mis à jour → ${newRole}` });
    } else {
      setNotification({ text: res.message || 'Erreur lors de la modification', error: true });
    }
    setTimeout(() => setNotification(null), 4000);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    const res = await register(
      name, 
      email, 
      password, 
      { currency: 'EUR', travelPace: 'Balanced', interests: ['Culture'], theme: 'dark' },
      avatar
    );

    if (res.success) {
      if (selectedRole !== 'Traveler') {
        const created = allUsers.find(u => u.email === email);
        if (created) await updateUserRole(created.id, selectedRole);
      }
      setIsNewUserModalOpen(false);
      setName('');
      setEmail('');
      setAvatar(AVATAR_PRESETS[0].url);
      setNotification({ text: `✅ Compte « ${name} » créé avec succès !` });
    } else {
      setNotification({ text: res.message || 'Erreur de création', error: true });
    }
    setTimeout(() => setNotification(null), 4000);
  };

  const filteredUsers = allUsers.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const countTravelers = allUsers.filter(u => u.role === 'Traveler').length;
  const countOrganizers = allUsers.filter(u => u.role === 'Organizer').length;
  const countAdmins = allUsers.filter(u => u.role === 'Admin').length;
  const usersWithEmergency = allUsers.filter(u => u.emergencyInfo && (u.emergencyInfo.bloodType || u.emergencyInfo.allergies || u.emergencyInfo.emergencyContact?.name));

  const getRoleStyle = (role: string) => {
    switch (role) {
      case 'Admin': return 'bg-amber-500/15 text-amber-300 border-amber-500/40';
      case 'Organizer': return 'bg-sky-500/15 text-sky-300 border-sky-500/40';
      default: return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'Admin': return '🛡️ Admin';
      case 'Organizer': return '📋 Organisateur';
      default: return '✈️ Voyageur';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950/30 via-slate-900 to-slate-900 border border-amber-500/20 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-amber-500/15 text-amber-400 rounded-xl border border-amber-500/30">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Gestion des Utilisateurs</h2>
            <p className="text-sm text-slate-400 mt-0.5">
              {allUsers.length} comptes enregistrés — Supervisez les rôles et les fiches d'urgence.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsNewUserModalOpen(true)}
          className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-extrabold rounded-xl shadow-lg shadow-amber-500/20 transition-all self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Nouveau Compte</span>
        </button>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`p-3.5 rounded-xl border text-xs flex items-center space-x-2 transition-all ${
          notification.error ? 'bg-rose-950/70 border-rose-500/50 text-rose-200' : 'bg-emerald-950/70 border-emerald-500/50 text-emerald-200'
        }`}>
          {notification.error ? <AlertTriangle className="w-4 h-4 flex-shrink-0" /> : <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
          <span>{notification.text}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
          <div className="text-2xl mb-1">👥</div>
          <p className="text-2xl font-bold text-white">{allUsers.length}</p>
          <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Total</span>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
          <div className="text-2xl mb-1">✈️</div>
          <p className="text-2xl font-bold text-emerald-400">{countTravelers}</p>
          <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Voyageurs</span>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
          <div className="text-2xl mb-1">📋</div>
          <p className="text-2xl font-bold text-sky-400">{countOrganizers}</p>
          <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Organisateurs</span>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
          <div className="text-2xl mb-1">🛡️</div>
          <p className="text-2xl font-bold text-amber-400">{countAdmins}</p>
          <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Admins</span>
        </div>
      </div>

      {/* Tab: Utilisateurs / Fiches médicales */}
      <div className="flex items-center space-x-1 p-1 rounded-xl bg-slate-900 border border-slate-800">
        <button
          onClick={() => setShowEmergencyPanel(false)}
          className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            !showEmergencyPanel
              ? 'bg-brand-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Comptes & Rôles</span>
        </button>
        <button
          onClick={() => setShowEmergencyPanel(true)}
          className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            showEmergencyPanel
              ? 'bg-red-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>Fiches Médicales</span>
          {usersWithEmergency.length > 0 && (
            <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              showEmergencyPanel ? 'bg-white/20 text-white' : 'bg-red-500/20 text-red-300'
            }`}>
              {usersWithEmergency.length}
            </span>
          )}
        </button>
      </div>

      {/* ═══ TAB 1: Comptes & Rôles ═══ */}
      {!showEmergencyPanel && (
        <div className="space-y-4">
          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex items-center space-x-1 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              {['all', 'Traveler', 'Organizer', 'Admin'].map(r => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                    roleFilter === r
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {r === 'all' ? 'Tous' : r === 'Traveler' ? '✈️ Voyageurs' : r === 'Organizer' ? '📋 Orga.' : '🛡️ Admin'}
                </button>
              ))}
            </div>

            <div className="relative flex-1 sm:max-w-xs">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Rechercher un utilisateur..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* User Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredUsers.map(user => (
              <div
                key={user.id}
                className={`p-4 rounded-2xl border transition-all hover:shadow-lg ${
                  user.id === currentUser?.id
                    ? 'bg-gradient-to-br from-brand-600/10 to-slate-900 border-brand-500/30 shadow-md shadow-brand-500/10'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  {/* User info */}
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="relative flex-shrink-0">
                      <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-xl object-cover border-2 border-slate-700" />
                      {user.id === currentUser?.id && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-brand-500 rounded-full border-2 border-slate-900 flex items-center justify-center">
                          <span className="text-[8px]">✓</span>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-white truncate">
                        {user.name}
                        {user.id === currentUser?.id && <span className="text-[10px] text-brand-400 ml-1.5">(vous)</span>}
                      </h4>
                      <p className="text-[11px] text-slate-500 truncate flex items-center space-x-1">
                        <Mail className="w-3 h-3 flex-shrink-0" />
                        <span>{user.email}</span>
                      </p>
                      <span className={`inline-flex items-center mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${getRoleStyle(user.role)}`}>
                        {getRoleLabel(user.role)}
                      </span>
                    </div>
                  </div>

                  {/* Emergency badge indicator */}
                  {user.emergencyInfo && (user.emergencyInfo.bloodType || user.emergencyInfo.emergencyContact?.name) && (
                    <div className="flex-shrink-0 p-1.5 rounded-lg bg-red-500/10 border border-red-500/20" title="Fiche médicale renseignée">
                      <Heart className="w-3.5 h-3.5 text-red-400" />
                    </div>
                  )}
                </div>

                {/* Role buttons */}
                <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-800/60">
                  <span className="text-[10px] text-slate-500 mr-1">Rôle →</span>
                  {(['Traveler', 'Organizer', 'Admin'] as UserRole[]).map(r => (
                    <button
                      key={r}
                      onClick={() => handleRoleChange(user.id, r)}
                      className={`flex-1 py-1.5 text-[10px] rounded-lg font-bold border transition-all ${
                        user.role === r
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                          : 'bg-slate-800/60 text-slate-500 border-slate-700/60 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      {r === 'Traveler' ? 'Voyageur' : r === 'Organizer' ? 'Orga.' : 'Admin'}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12 text-slate-500 text-sm">
              Aucun utilisateur ne correspond à votre recherche.
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB 2: Fiches Médicales d'Urgence ═══ */}
      {showEmergencyPanel && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/20 flex items-start space-x-3">
            <Heart className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-white">Fiches Médicales des Voyageurs</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Vue d'ensemble des informations d'urgence renseignées par chaque utilisateur. 
                Ces données sont stockées localement sur chaque appareil et synchronisées quand le réseau est disponible.
              </p>
            </div>
          </div>

          {usersWithEmergency.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="text-4xl">🩺</div>
              <p className="text-sm text-slate-400">Aucun utilisateur n'a encore renseigné sa fiche médicale.</p>
              <p className="text-[11px] text-slate-500">Les voyageurs peuvent compléter leur fiche depuis leur profil.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {allUsers.map(user => {
                const info = user.emergencyInfo;
                const hasMedical = info && (info.bloodType || info.allergies || info.emergencyContact?.name);
                const isExpanded = expandedEmergency === user.id;

                return (
                  <div
                    key={user.id}
                    className={`rounded-2xl border transition-all overflow-hidden ${
                      hasMedical
                        ? 'bg-gradient-to-br from-red-950/20 to-slate-900 border-red-500/20 hover:border-red-500/40'
                        : 'bg-slate-900/50 border-slate-800/50 opacity-50'
                    }`}
                  >
                    {/* Card Header */}
                    <button
                      onClick={() => hasMedical && setExpandedEmergency(isExpanded ? null : user.id)}
                      className="w-full p-4 flex items-center justify-between text-left"
                      disabled={!hasMedical}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-xl object-cover border border-slate-700 flex-shrink-0" />
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-white truncate">{user.name}</h4>
                          <div className="flex items-center space-x-2 mt-0.5">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${getRoleStyle(user.role)}`}>
                              {getRoleLabel(user.role)}
                            </span>
                            {info?.bloodType && (
                              <span className="inline-flex items-center space-x-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-300 border border-red-500/30">
                                <Droplets className="w-2.5 h-2.5" />
                                <span>{info.bloodType}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {hasMedical && (
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          {!isExpanded && info?.emergencyContact?.name && (
                            <span className="text-[10px] text-slate-500 hidden sm:block">📞 {info.emergencyContact.name}</span>
                          )}
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-slate-500" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-500" />
                          )}
                        </div>
                      )}
                      {!hasMedical && (
                        <span className="text-[10px] text-slate-600 italic">Non renseignée</span>
                      )}
                    </button>

                    {/* Expanded Details */}
                    {isExpanded && hasMedical && (
                      <div className="px-4 pb-4 space-y-3 border-t border-red-500/10 pt-3">
                        {/* Blood Type */}
                        {info?.bloodType && (
                          <div className="flex items-center space-x-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                            <div className="p-2 bg-red-500/15 rounded-lg">
                              <Droplets className="w-4 h-4 text-red-400" />
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Groupe sanguin</span>
                              <p className="text-sm font-bold text-red-300">{info.bloodType}</p>
                            </div>
                          </div>
                        )}

                        {/* Allergies */}
                        {info?.allergies && (
                          <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                            <div className="p-2 bg-amber-500/15 rounded-lg mt-0.5">
                              <AlertTriangle className="w-4 h-4 text-amber-400" />
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Allergies majeures</span>
                              <p className="text-xs text-amber-300 mt-0.5 leading-relaxed">{info.allergies}</p>
                            </div>
                          </div>
                        )}

                        {/* Emergency Contact */}
                        {info?.emergencyContact?.name && (
                          <div className="flex items-center space-x-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                            <div className="p-2 bg-emerald-500/15 rounded-lg">
                              <Phone className="w-4 h-4 text-emerald-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Contact d'urgence</span>
                              <p className="text-sm font-bold text-white truncate">{info.emergencyContact.name}</p>
                              {info.emergencyContact.phone && (
                                <a
                                  href={`tel:${info.emergencyContact.phone}`}
                                  className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
                                >
                                  📞 {info.emergencyContact.phone}
                                </a>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal: Create User */}
      <Modal
        isOpen={isNewUserModalOpen}
        onClose={() => setIsNewUserModalOpen(false)}
        title="Nouveau Compte Utilisateur"
        subtitle="Créez un compte avec un rôle prédéfini"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <AvatarPicker
            value={avatar}
            onChange={setAvatar}
            label="Avatar"
            compact
          />

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Prénom</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="ex: Julien"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="julien@traveltracker.io"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Mot de passe temporaire</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Rôle</label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: 'Traveler' as UserRole, label: '✈️ Voyageur' },
                { value: 'Organizer' as UserRole, label: '📋 Organisateur' },
                { value: 'Admin' as UserRole, label: '🛡️ Admin' },
              ]).map(r => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setSelectedRole(r.value)}
                  className={`py-2.5 text-xs font-bold rounded-xl border transition-all ${
                    selectedRole === r.value
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsNewUserModalOpen(false)}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 text-sm font-semibold rounded-xl transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-sm font-bold rounded-xl shadow-lg shadow-amber-500/30 transition-all"
            >
              Créer le Compte
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
