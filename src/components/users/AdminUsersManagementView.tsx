import React, { useState } from 'react';
import { 
  Shield, 
  Users, 
  UserPlus, 
  Trash2, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  Lock, 
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { Modal } from '../common/Modal';

export const AdminUsersManagementView: React.FC = () => {
  const { currentUser, allUsers, isAdmin, updateUserRole, register } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);
  const [notification, setNotification] = useState<{ text: string; error?: boolean } | null>(null);

  // New user form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [selectedRole, setSelectedRole] = useState<UserRole>('Traveler');

  // STRICT ACCESS CONTROL: IF NOT ADMIN, REJECT ACCESS!
  if (!isAdmin) {
    return (
      <div className="min-h-[500px] flex items-center justify-center p-6">
        <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900 border border-rose-500/40 text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center border border-rose-500/30">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">Accès Réservé à l'Administrateur</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Vous êtes connecté avec le rôle <strong className="text-amber-300 font-semibold">{currentUser?.role}</strong>. La gestion des comptes utilisateurs et l'attribution des privilèges est strictement réservée au profil <strong>Admin</strong>.
          </p>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-500">
            Règle de sécurité : Seul l'administrateur peut gérer les utilisateurs à part.
          </div>
        </div>
      </div>
    );
  }

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    const res = await updateUserRole(userId, newRole);
    if (res.success) {
      setNotification({ text: `Rôle mis à jour avec succès : ${newRole}` });
    } else {
      setNotification({ text: res.message || 'Erreur lors de la modification', error: true });
    }
    setTimeout(() => setNotification(null), 4000);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    const res = await register(name, email, password, {
      currency: 'EUR',
      travelPace: 'Balanced',
      interests: ['Culture'],
      theme: 'dark'
    });

    if (res.success) {
      // If Admin selected another role, update it immediately
      if (selectedRole !== 'Traveler') {
        const created = allUsers.find(u => u.email === email);
        if (created) await updateUserRole(created.id, selectedRole);
      }
      setIsNewUserModalOpen(false);
      setName('');
      setEmail('');
      setNotification({ text: `Utilisateur « ${name} » créé avec succès.` });
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

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-white">Gestion des Utilisateurs & Rôles</h2>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                Espace Exclusif Admin
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-0.5">
              Supervision des comptes utilisateurs, attribution des privilèges et sécurité des accès.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsNewUserModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-extrabold rounded-xl shadow-lg shadow-amber-500/20 transition-all self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Créer un Utilisateur</span>
        </button>
      </div>

      {/* Notification banner */}
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
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400">Total Comptes</span>
          <p className="text-2xl font-bold text-white mt-1">{allUsers.length}</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400">Voyageurs (Travelers)</span>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{countTravelers}</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400">Organisateurs</span>
          <p className="text-2xl font-bold text-sky-400 mt-1">{countOrganizers}</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400">Administrateurs</span>
          <p className="text-2xl font-bold text-amber-400 mt-1">{countAdmins}</p>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          <div className="flex items-center space-x-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
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
                {r === 'all' ? 'Tous les rôles' : r}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Rechercher par nom ou email..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-3">Utilisateur</th>
                <th className="py-3 px-3">Email</th>
                <th className="py-3 px-3">Rôle Actuel</th>
                <th className="py-3 px-3 text-right">Attribuer un Nouveau Rôle (Action Admin)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-3 flex items-center space-x-2.5">
                    <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover border border-slate-700" />
                    <span className="font-bold text-white truncate">{user.name}</span>
                  </td>
                  <td className="py-3 px-3 text-slate-400">{user.email}</td>
                  <td className="py-3 px-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      user.role === 'Admin' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                      user.role === 'Organizer' ? 'bg-sky-500/20 text-sky-300 border-sky-500/40' :
                      'bg-slate-800 text-slate-300 border-slate-700'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="inline-flex space-x-1">
                      {(['Traveler', 'Organizer', 'Admin'] as UserRole[]).map(r => (
                        <button
                          key={r}
                          onClick={() => handleRoleChange(user.id, r)}
                          className={`px-2.5 py-1 text-[10px] rounded-lg font-bold border transition-all ${
                            user.role === r
                              ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                              : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white hover:bg-slate-750'
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create User */}
      <Modal
        isOpen={isNewUserModalOpen}
        onClose={() => setIsNewUserModalOpen(false)}
        title="Créer un Utilisateur (Admin)"
        subtitle="Enregistrez un nouveau compte directement avec son rôle"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Prénom de l'utilisateur</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="ex: Julien"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Adresse Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="julien@traveltracker.io"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Mot de passe temporaire</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Rôle attribué par l'Admin</label>
            <select
              value={selectedRole}
              onChange={e => setSelectedRole(e.target.value as UserRole)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
            >
              <option value="Traveler">Traveler (Voyageur)</option>
              <option value="Organizer">Organizer (Organisateur de séjours)</option>
              <option value="Admin">Admin (Administrateur)</option>
            </select>
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
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold rounded-xl shadow-lg shadow-amber-500/30"
            >
              Créer le Compte
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
