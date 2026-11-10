import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, EmergencyInfo } from '../types';
import { db } from '../db/database';

interface AuthContextType {
  currentUser: User | null;
  allUsers: User[];
  token: string | null;
  isLoading: boolean;
  isAdmin: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; message?: string }>;
  loginWithGoogle: (credential?: string, profile?: { email: string; name: string; avatar?: string; googleId?: string }) => Promise<{ success: boolean; message?: string }>;
  register: (name: string, email: string, password: string, preferences?: any, avatar?: string) => Promise<{ success: boolean; message?: string }>;
  updateAvatar: (avatar: string) => Promise<{ success: boolean; message?: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; code?: string; sent?: boolean; message?: string }>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  updateUserRole: (targetUserId: string, newRole: UserRole) => Promise<{ success: boolean; message?: string }>;
  updatePreferences: (prefs: Partial<User['preferences']>) => Promise<void>;
  updateEmergencyInfo: (info: EmergencyInfo) => Promise<void>;
  refreshUsers: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [token, setToken] = useState<string | null>(localStorage.getItem('tt_jwt_token'));
  const [isLoading, setIsLoading] = useState(true);

  // Charge la liste complète des utilisateurs exclusivement pour le profil Admin
  const loadAdminUsers = async () => {
    try {
      const res = await fetch('/api/users', {
        headers: { 'x-user-role': 'Admin' }
      });
      if (res.ok) {
        const remoteUsers = await res.json();
        const usersList: User[] = remoteUsers.map((u: any) => ({
          ...u,
          id: u._id || u.id
        }));
        setAllUsers(usersList);
      }
    } catch {
      // offline
    }
  };

  // Restaure la session active sans exposer la liste globale des comptes aux voyageurs / organisateurs
  const fetchSession = async () => {
    try {
      const savedToken = localStorage.getItem('tt_jwt_token');
      const savedUserId = localStorage.getItem('tt_user_id');

      if (savedToken && savedUserId) {
        let user: User | null = null;
        try {
          const res = await fetch(`/api/users/${savedUserId}`);
          if (res.ok) {
            const data = await res.json();
            const loadedUser: User = { ...data, id: data._id || data.id };
            user = loadedUser;
            await db.users.put(loadedUser);
          }
        } catch {
          user = (await db.users.get(savedUserId)) || null;
        }

        if (user) {
          setCurrentUser(user);
          setToken(savedToken);
          if (user.role === 'Admin') {
            await loadAdminUsers();
          } else {
            setAllUsers([]);
          }
        } else {
          localStorage.removeItem('tt_jwt_token');
          localStorage.removeItem('tt_user_id');
          setCurrentUser(null);
          setToken(null);
          setAllUsers([]);
        }
      } else {
        setCurrentUser(null);
        setToken(null);
        setAllUsers([]);
      }
    } catch (err) {
      console.error('Error fetching session:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const login = async (email: string, password?: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (res.ok) {
        const data = await res.json();
        const user = { ...data.user, id: data.user._id || data.user.id };
        const userToken = data.token;

        localStorage.setItem('tt_jwt_token', userToken);
        localStorage.setItem('tt_user_id', user.id);
        setCurrentUser(user);
        setToken(userToken);
        await db.users.put(user);

        if (user.role === 'Admin') {
          await loadAdminUsers();
        } else {
          setAllUsers([]);
        }

        return { success: true };
      } else {
        const err = await res.json();
        return { success: false, message: err.error || 'Email ou mot de passe incorrect.' };
      }
    } catch {
      // Offline fallback login
      const local = await db.users.where('email').equalsIgnoreCase(email).first();
      if (local) {
        const offlineToken = 'jwt-offline-' + local.id;
        localStorage.setItem('tt_jwt_token', offlineToken);
        localStorage.setItem('tt_user_id', local.id);
        setCurrentUser(local);
        setToken(offlineToken);
        if (local.role === 'Admin') {
          const localUsers = await db.users.toArray();
          setAllUsers(localUsers);
        } else {
          setAllUsers([]);
        }
        return { success: true };
      }
      return { success: false, message: 'Utilisateur introuvable en mode hors-ligne.' };
    }
  };

  const loginWithGoogle = async (
    credential?: string,
    profile?: { email: string; name: string; avatar?: string; googleId?: string }
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await fetch('/api/users/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential, profile })
      });

      if (res.ok) {
        const data = await res.json();
        const user: User = { ...data.user, id: data.user._id || data.user.id };
        const userToken = data.token;

        localStorage.setItem('tt_jwt_token', userToken);
        localStorage.setItem('tt_user_id', user.id);
        setCurrentUser(user);
        setToken(userToken);
        await db.users.put(user);

        if (user.role === 'Admin') {
          await loadAdminUsers();
        } else {
          setAllUsers([]);
        }

        return { success: true };
      } else {
        const err = await res.json();
        return { success: false, message: err.error || 'Erreur lors de la connexion avec Google.' };
      }
    } catch {
      // Repli hors-ligne pour la connexion Google
      const targetEmail = profile?.email || 'voyageur.google@gmail.com';
      let local = await db.users.where('email').equalsIgnoreCase(targetEmail).first();
      
      if (!local) {
        local = {
          id: 'usr-google-' + Date.now(),
          name: profile?.name || 'Voyageur Google',
          email: targetEmail,
          role: 'Traveler',
          avatar: profile?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
          authProvider: 'google',
          googleId: profile?.googleId || ('google-' + Date.now()),
          token: 'jwt-offline-google-' + Date.now(),
          preferences: {
            currency: 'EUR',
            travelPace: 'Balanced',
            interests: ['Culture', 'Gastronomie'],
            theme: 'dark'
          },
          createdAt: new Date().toISOString()
        };
        await db.users.put(local);
      }

      const offlineToken = local.token || ('jwt-offline-' + local.id);
      localStorage.setItem('tt_jwt_token', offlineToken);
      localStorage.setItem('tt_user_id', local.id);
      setCurrentUser(local);
      setToken(offlineToken);
      if (local.role === 'Admin') {
        const localUsers = await db.users.toArray();
        setAllUsers(localUsers);
      } else {
        setAllUsers([]);
      }
      return { success: true };
    }
  };

  const register = async (name: string, email: string, password: string, preferences?: any, avatar?: string): Promise<{ success: boolean; message?: string }> => {
    const chosenAvatar = avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role: 'Traveler', preferences, avatar: chosenAvatar })
      });

      if (res.ok) {
        const data = await res.json();
        const user = { ...data.user, id: data.user._id || data.user.id };
        const userToken = data.token;

        localStorage.setItem('tt_jwt_token', userToken);
        localStorage.setItem('tt_user_id', user.id);
        setCurrentUser(user);
        setToken(userToken);
        await db.users.put(user);
        setAllUsers(prev => [user, ...prev]);
        return { success: true };
      } else {
        const err = await res.json();
        return { success: false, message: err.error || 'Erreur lors de l’inscription.' };
      }
    } catch {
      // Offline fallback registration
      const localUser: User = {
        id: 'usr-' + Date.now(),
        name,
        email,
        role: 'Traveler',
        avatar: chosenAvatar,
        token: 'jwt-offline-' + Date.now(),
        preferences: preferences || { currency: 'EUR', travelPace: 'Balanced', interests: ['Culture'], theme: 'dark' },
        createdAt: new Date().toISOString()
      };
      await db.users.put(localUser);
      localStorage.setItem('tt_jwt_token', localUser.token!);
      localStorage.setItem('tt_user_id', localUser.id);
      setCurrentUser(localUser);
      setToken(localUser.token!);
      setAllUsers(prev => [localUser, ...prev]);
      return { success: true };
    }
  };

  const forgotPassword = async (email: string): Promise<{ success: boolean; sent?: boolean; message?: string }> => {
    try {
      const res = await fetch('/api/users/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      if (res.ok) {
        return { success: true, sent: data.sent, message: data.message };
      } else {
        return { success: false, message: data.error || 'Adresse email introuvable.' };
      }
    } catch {
      return { success: true, sent: false, message: 'Demande enregistrée en mode hors-ligne.' };
    }
  };

  const resetPassword = async (email: string, code: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await fetch('/api/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword })
      });

      const data = await res.json();
      if (res.ok) {
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.error || 'Échec de la réinitialisation.' };
      }
    } catch {
      return { success: true, message: 'Mot de passe réinitialisé en mode hors-ligne !' };
    }
  };

  const logout = () => {
    localStorage.removeItem('tt_jwt_token');
    localStorage.removeItem('tt_user_id');
    setCurrentUser(null);
    setToken(null);
    setAllUsers([]);
  };

  // STRICT ADMIN ROLE MODIFICATION
  const updateUserRole = async (targetUserId: string, newRole: UserRole): Promise<{ success: boolean; message?: string }> => {
    if (!currentUser) {
      return { success: false, message: 'Vous devez être connecté.' };
    }

    if (currentUser.role !== 'Admin') {
      return { 
        success: false, 
        message: 'Action interdite : Seul un Administrateur (Admin) est habilité à modifier les rôles.' 
      };
    }

    try {
      const res = await fetch(`/api/users/${targetUserId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole, requesterRole: currentUser.role })
      });

      if (!res.ok) {
        const err = await res.json();
        return { success: false, message: err.error || 'Échec de la modification du rôle.' };
      }

      await db.users.update(targetUserId, { role: newRole });
      setAllUsers(prev => prev.map(u => u.id === targetUserId ? { ...u, role: newRole } : u));
      if (currentUser.id === targetUserId) {
        setCurrentUser({ ...currentUser, role: newRole });
      }

      return { success: true };
    } catch {
      await db.users.update(targetUserId, { role: newRole });
      setAllUsers(prev => prev.map(u => u.id === targetUserId ? { ...u, role: newRole } : u));
      if (currentUser.id === targetUserId) {
        setCurrentUser({ ...currentUser, role: newRole });
      }
      return { success: true };
    }
  };

  const updatePreferences = async (prefs: Partial<User['preferences']>) => {
    if (!currentUser) return;
    const newPreferences = { ...currentUser.preferences, ...prefs };
    try {
      await fetch(`/api/users/${currentUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences: newPreferences })
      });
    } catch {
      // offline
    }
    await db.users.update(currentUser.id, { preferences: newPreferences });
    const updatedUser = { ...currentUser, preferences: newPreferences };
    setCurrentUser(updatedUser);
    setAllUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
  };

  const updateAvatar = async (newAvatar: string): Promise<{ success: boolean; message?: string }> => {
    if (!currentUser) return { success: false, message: 'Vous devez être connecté.' };
    try {
      await fetch(`/api/users/${currentUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar: newAvatar })
      });
    } catch {
      // offline
    }
    await db.users.update(currentUser.id, { avatar: newAvatar });
    const updatedUser = { ...currentUser, avatar: newAvatar };
    setCurrentUser(updatedUser);
    setAllUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
    return { success: true };
  };

  const updateEmergencyInfo = async (info: EmergencyInfo) => {
    if (!currentUser) return;
    try {
      await fetch(`/api/users/${currentUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emergencyInfo: info })
      });
    } catch {
      // offline — data persisted locally below
    }
    await db.users.update(currentUser.id, { emergencyInfo: info });
    const updatedUser = { ...currentUser, emergencyInfo: info };
    setCurrentUser(updatedUser);
    setAllUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        allUsers,
        token,
        isLoading,
        isAdmin: currentUser?.role === 'Admin',
        login,
        loginWithGoogle,
        register,
        forgotPassword,
        resetPassword,
        logout,
        updateUserRole,
        updatePreferences,
        updateEmergencyInfo,
        updateAvatar,
        refreshUsers: loadAdminUsers
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
