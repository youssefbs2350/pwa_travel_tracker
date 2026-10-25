import React, { useState } from 'react';
import { 
  Compass, 
  MapPin, 
  Shield, 
  LogOut, 
  ChevronDown, 
  Plus, 
  Lock, 
  UserCheck 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTrips } from '../../context/TripContext';
import { UserRole } from '../../types';

interface NavbarProps {
  onOpenNewTripModal: () => void;
  onNavigateTab: (tabId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenNewTripModal, onNavigateTab }) => {
  const { currentUser, isAdmin, updateUserRole, allUsers, switchUser, logout } = useAuth();
  const { trips, activeTrip, setActiveTripId } = useTrips();
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showTripDropdown, setShowTripDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const roles: UserRole[] = ['Traveler', 'Organizer', 'Admin'];

  const handleRoleChange = async (newRole: UserRole) => {
    if (!currentUser) return;
    if (!isAdmin) {
      alert("Action refusÃ©e : Seul un Administrateur (Admin) a l'autorisation de modifier les rÃ´les.");
      return;
    }
    const res = await updateUserRole(currentUser.id, newRole);
    if (!res.success) {
      alert(res.message);
    }
    setShowRoleDropdown(false);
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-2">
            
            {/* Logo & Brand */}
            <div 
              onClick={() => onNavigateTab('overview')}
              className="flex items-center space-x-3 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-brand-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
                <Compass className="w-6 h-6 animate-[spin_12s_linear_infinite]" />
              </div>
              <div className="hidden sm:block">
                <div className="flex items-center space-x-1.5">
                  <span className="font-extrabold text-lg text-white tracking-tight">Travel Tracker</span>
                  <span className="text-[10px] font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                    PWA
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Gestion intelligente de vos voyages</p>
              </div>
            </div>

            {/* Active Trip Selector (Cascade Filter) */}
            <div className="relative">
              <button
                onClick={() => setShowTripDropdown(prev => !prev)}
                className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-750 border border-slate-700/80 rounded-xl px-3 py-1.5 text-sm font-medium text-slate-200 transition-all shadow-sm"
              >
                <MapPin className="w-4 h-4 text-brand-400 flex-shrink-0" />
                <span className="max-w-[120px] sm:max-w-[180px] truncate">
                  {activeTrip ? activeTrip.title : 'SÃ©lectionner un voyage'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showTripDropdown && (
                <div className="absolute left-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-1 z-50">
                  <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    Mes Voyages Disponibles
                  </div>
                  <div className="max-h-56 overflow-y-auto">
                    {trips.map(trip => (
                      <button
                        key={trip.id}
                        onClick={() => {
                          setActiveTripId(trip.id);
                          setShowTripDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-slate-800 transition-colors ${
                          activeTrip?.id === trip.id ? 'bg-brand-500/10 text-brand-400 font-semibold' : 'text-slate-300'
                        }`}
                      >
                        <span className="truncate">{trip.title}</span>
                        <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded ml-2 flex-shrink-0">
                          {trip.destination}
                        </span>
                      </button>
                    ))}
                  </div>
                  {/* Only Organizer & Admin can create a new trip */}
                  {(currentUser?.role === 'Admin' || currentUser?.role === 'Organizer') ? (
                    <div className="p-2 border-t border-slate-800">
                      <button
                        onClick={() => {
                          setShowTripDropdown(false);
                          onOpenNewTripModal();
                        }}
                        className="w-full py-1.5 px-3 bg-brand-600/20 hover:bg-brand-600/30 text-brand-300 border border-brand-500/40 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Nouveau Voyage</span>
                      </button>
                    </div>
                  ) : (
                    <div className="p-2 border-t border-slate-800 text-center">
                      <span className="text-[10px] text-slate-400">
                        Mode Voyageur (Consultation active)
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Controls: Offline toggle, PWA Install, Role Badge (Admin-only modification), User Profile */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              
              {/* Role Badge: STRICT ADMIN PERMISSION */}
              {isAdmin ? (
                <div className="relative">
                  <button
                    onClick={() => setShowRoleDropdown(prev => !prev)}
                    className="flex items-center space-x-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 rounded-xl px-2.5 py-1.5 text-xs text-amber-300 transition-colors"
                    title="En tant qu'Admin, vous pouvez modifier les rôles"
                  >
                    <Shield className="w-3.5 h-3.5 text-amber-400" />
                    <span className="font-bold">Admin (Gestionnaire des Rôles)</span>
                    <ChevronDown className="w-3 h-3 text-amber-400" />
                  </button>

                  {showRoleDropdown && (
                    <div className="absolute right-0 mt-2 w-52 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-1.5 z-50 text-xs">
                      <div className="px-3 py-1.5 font-semibold text-slate-400 border-b border-slate-800">
                        Modifier mon rôle (Admin)
                      </div>
                      {roles.map(r => (
                        <button
                          key={r}
                          onClick={() => handleRoleChange(r)}
                          className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-800 ${
                            currentUser?.role === r ? 'text-amber-400 font-bold bg-amber-500/10' : 'text-slate-300'
                          }`}
                        >
                          <span>{r}</span>
                          {currentUser?.role === r && <UserCheck className="w-3.5 h-3.5" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* Non-admin: Locked Role Badge */
                <div 
                  className="flex items-center space-x-1.5 bg-slate-800/80 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 select-none"
                  title="Rôle verrouillé. Seul l'administrateur peut modifier les rôles."
                >
                  <Lock className="w-3 h-3 text-slate-400" />
                  <span className="font-semibold">{currentUser?.role}</span>
                </div>
              )}

              {/* User Menu & Logout */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(prev => !prev)}
                  className="flex items-center space-x-2 pl-1 cursor-pointer group focus:outline-none"
                >
                  <img
                    src={currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                    alt={currentUser?.name}
                    className="w-8 h-8 rounded-full border border-brand-400 object-cover group-hover:ring-2 group-hover:ring-brand-400 transition-all"
                  />
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl py-2 z-50 text-xs">
                    <div className="px-3 py-2 border-b border-slate-800">
                      <p className="font-bold text-white truncate">{currentUser?.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{currentUser?.email}</p>
                      <div className="mt-1 inline-flex items-center space-x-1 text-[10px] text-amber-300 font-semibold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        <Shield className="w-3 h-3" />
                        <span>Rôle : {currentUser?.role}</span>
                      </div>
                    </div>

                    <div className="p-1 space-y-0.5">
                      {!isAdmin && (
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            onNavigateTab('profile');
                          }}
                          className="w-full text-left px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center space-x-2"
                        >
                          <UserCheck className="w-3.5 h-3.5 text-brand-400" />
                          <span>Mon Profil & Préférences</span>
                        </button>
                      )}

                      {isAdmin && (
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            onNavigateTab('admin-users');
                          }}
                          className="w-full text-left px-3 py-2 text-amber-300 hover:bg-amber-500/10 rounded-lg transition-colors flex items-center space-x-2 font-semibold"
                        >
                          <Shield className="w-3.5 h-3.5 text-amber-400" />
                          <span>Gestion Utilisateurs (Admin)</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          logout();
                        }}
                        className="w-full text-left px-3 py-2 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors flex items-center space-x-2 font-semibold"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Se Déconnecter</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </header>

    </>
  );
};
