/**
 * Service de collaboration en temps réel via WebSocket
 * Permet aux participants d'un voyage de voir les actions en direct
 * 
 * MODE MOCK PAR DÉFAUT - Pour activer WebSocket réel:
 * 1. Installez: npm install socket.io-client
 * 2. Décommentez l'import Socket.io en haut
 * 3. Changez USE_MOCK_MODE à false
 */

// import { io, Socket } from 'socket.io-client';

// Configuration: true = mode mock (pas besoin de serveur), false = WebSocket réel
const USE_MOCK_MODE = true;

export interface CollaborationUser {
  id: string;
  name: string;
  avatar: string;
  color: string;
}

export interface CollaborationEvent {
  type: 'activity-added' | 'expense-added' | 'place-added' | 'document-uploaded' | 'message' | 'typing';
  user: CollaborationUser;
  data: any;
  timestamp: number;
}

export interface CollaborationMessage {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  message: string;
  timestamp: number;
}

class CollaborationService {
  private socket: any = null;
  private currentTripId: string | null = null;
  private currentUser: CollaborationUser | null = null;
  private onlineUsers: Map<string, CollaborationUser> = new Map();
  private eventCallbacks: Map<string, Function[]> = new Map();
  private mockMessages: CollaborationMessage[] = [];
  private mockOnlineUsers: CollaborationUser[] = [];

  /**
   * Initialise la connexion WebSocket (ou mode mock)
   */
  connect(serverUrl: string = 'http://localhost:5000') {
    if (USE_MOCK_MODE) {
      console.log('[Collaboration] Running in MOCK mode (no WebSocket server needed)');
      this.setupMockData();
      this.trigger('connected', {});
      return;
    }

    if (this.socket?.connected) {
      console.warn('[Collaboration] Already connected');
      return;
    }

    // Pour activer WebSocket réel, installez socket.io-client et décommentez:
    // this.socket = io(serverUrl, {
    //   transports: ['websocket'],
    //   reconnection: true,
    //   reconnectionDelay: 1000,
    //   reconnectionAttempts: 5
    // });

    this.setupSocketListeners();
  }

  /**
   * Déconnexion propre
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.onlineUsers.clear();
    this.eventCallbacks.clear();
  }

  /**
   * Rejoint un voyage pour la collaboration
   */
  joinTrip(tripId: string, user: CollaborationUser) {
    this.currentTripId = tripId;
    this.currentUser = user;

    if (USE_MOCK_MODE) {
      // Simule des utilisateurs en ligne
      setTimeout(() => {
        this.trigger('online-users-updated', this.mockOnlineUsers);
      }, 500);
      return;
    }

    if (!this.socket) {
      console.error('[Collaboration] Socket not initialized');
      return;
    }

    this.socket.emit('join-trip', { tripId, user });
  }

  /**
   * Quitte le voyage actuel
   */
  leaveTrip() {
    if (!this.currentTripId) return;

    if (USE_MOCK_MODE) {
      this.currentTripId = null;
      return;
    }

    if (!this.socket) return;

    this.socket.emit('leave-trip', { tripId: this.currentTripId, userId: this.currentUser?.id });
    this.currentTripId = null;
    this.onlineUsers.clear();
  }

  /**
   * Envoie un événement de collaboration
   */
  emitEvent(event: Omit<CollaborationEvent, 'user' | 'timestamp'>) {
    if (!this.currentTripId || !this.currentUser) return;

    if (USE_MOCK_MODE) {
      const fullEvent: CollaborationEvent = {
        ...event,
        user: this.currentUser,
        timestamp: Date.now()
      };
      this.trigger('event', fullEvent);
      this.trigger(`event:${event.type}`, fullEvent);
      return;
    }

    if (!this.socket) return;

    this.socket.emit('collaboration-event', {
      tripId: this.currentTripId,
      event: {
        ...event,
        user: this.currentUser,
        timestamp: Date.now()
      }
    });
  }

  /**
   * Envoie un message dans le chat du voyage
   */
  sendMessage(message: string) {
    if (!this.currentTripId || !this.currentUser) return;

    const chatMessage: CollaborationMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: this.currentUser.id,
      userName: this.currentUser.name,
      userAvatar: this.currentUser.avatar,
      message,
      timestamp: Date.now()
    };

    if (USE_MOCK_MODE) {
      this.mockMessages.push(chatMessage);
      this.trigger('chat-message', chatMessage);
      
      // Simule une réponse automatique
      setTimeout(() => {
        const mockReply: CollaborationMessage = {
          id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          userId: 'mock-user-1',
          userName: this.mockOnlineUsers[0]?.name || 'Marie',
          userAvatar: this.mockOnlineUsers[0]?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marie',
          message: this.getMockReply(message),
          timestamp: Date.now()
        };
        this.trigger('chat-message', mockReply);
      }, 1500 + Math.random() * 2000);
      return;
    }

    if (!this.socket) return;

    this.socket.emit('chat-message', {
      tripId: this.currentTripId,
      message: chatMessage
    });
  }

  /**
   * Indique que l'utilisateur est en train de taper
   */
  emitTyping() {
    if (!this.currentTripId || !this.currentUser) return;

    if (USE_MOCK_MODE) {
      // En mode mock, on simule juste l'événement localement
      return;
    }

    if (!this.socket) return;

    this.socket.emit('user-typing', {
      tripId: this.currentTripId,
      user: this.currentUser
    });
  }

  /**
   * Enregistre un callback pour un type d'événement
   */
  on(eventType: string, callback: Function) {
    if (!this.eventCallbacks.has(eventType)) {
      this.eventCallbacks.set(eventType, []);
    }
    this.eventCallbacks.get(eventType)!.push(callback);
  }

  /**
   * Supprime un callback
   */
  off(eventType: string, callback: Function) {
    const callbacks = this.eventCallbacks.get(eventType);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Récupère la liste des utilisateurs en ligne
   */
  getOnlineUsers(): CollaborationUser[] {
    if (USE_MOCK_MODE) {
      return this.mockOnlineUsers;
    }
    return Array.from(this.onlineUsers.values());
  }

  /**
   * Configuration des listeners Socket.IO
   */
  private setupSocketListeners() {
    if (USE_MOCK_MODE || !this.socket) return;

    // Connexion établie
    this.socket.on('connect', () => {
      console.log('[Collaboration] Connected to server');
      this.trigger('connected', {});
    });

    // Déconnexion
    this.socket.on('disconnect', () => {
      console.log('[Collaboration] Disconnected from server');
      this.onlineUsers.clear();
      this.trigger('disconnected', {});
    });

    // Utilisateurs en ligne mis à jour
    this.socket.on('online-users', (users: CollaborationUser[]) => {
      this.onlineUsers.clear();
      users.forEach(user => {
        if (user.id !== this.currentUser?.id) {
          this.onlineUsers.set(user.id, user);
        }
      });
      this.trigger('online-users-updated', users);
    });

    // Événement de collaboration reçu
    this.socket.on('collaboration-event', (event: CollaborationEvent) => {
      this.trigger('event', event);
      this.trigger(`event:${event.type}`, event);
    });

    // Message de chat reçu
    this.socket.on('chat-message', (message: CollaborationMessage) => {
      this.trigger('chat-message', message);
    });

    // Utilisateur en train de taper
    this.socket.on('user-typing', (user: CollaborationUser) => {
      this.trigger('user-typing', user);
    });

    // Erreur
    this.socket.on('error', (error: any) => {
      console.error('[Collaboration] Socket error:', error);
      this.trigger('error', error);
    });
  }

  /**
   * Configure les données mockées pour le mode démo
   */
  private setupMockData() {
    this.mockOnlineUsers = [
      {
        id: 'mock-user-1',
        name: 'Marie Laurent',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marie',
        color: 'bg-emerald-500'
      },
      {
        id: 'mock-user-2',
        name: 'Thomas Dubois',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Thomas',
        color: 'bg-sky-500'
      },
      {
        id: 'mock-user-3',
        name: 'Alex Martin',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
        color: 'bg-amber-500'
      }
    ];

    // Messages initiaux du chat mock
    this.mockMessages = [
      {
        id: 'msg-1',
        userId: 'mock-user-2',
        userName: 'Thomas Dubois',
        userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Thomas',
        message: 'Salut ! J\'ai réservé le restaurant pour ce soir',
        timestamp: Date.now() - 3600000
      },
      {
        id: 'msg-2',
        userId: 'mock-user-1',
        userName: 'Marie Laurent',
        userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marie',
        message: 'Super ! À quelle heure ?',
        timestamp: Date.now() - 3300000
      },
      {
        id: 'msg-3',
        userId: 'mock-user-2',
        userName: 'Thomas Dubois',
        userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Thomas',
        message: '20h00. N\'oubliez pas vos passeports pour demain !',
        timestamp: Date.now() - 3000000
      }
    ];

    // Charge les messages initiaux
    setTimeout(() => {
      this.mockMessages.forEach(msg => {
        this.trigger('chat-message', msg);
      });
    }, 100);
  }

  /**
   * Génère une réponse mockée intelligente
   */
  private getMockReply(message: string): string {
    const lowerMsg = message.toLowerCase();
    
    if (lowerMsg.includes('bonjour') || lowerMsg.includes('salut') || lowerMsg.includes('hello')) {
      return 'Salut ! Comment ça va ? 😊';
    }
    if (lowerMsg.includes('restaurant') || lowerMsg.includes('manger')) {
      return 'Bonne idée ! J\'ai vu un super resto près de l\'hôtel 🍽️';
    }
    if (lowerMsg.includes('heure') || lowerMsg.includes('quand')) {
      return 'Je propose vers 19h30, ça vous va ?';
    }
    if (lowerMsg.includes('merci') || lowerMsg.includes('thank')) {
      return 'De rien ! On est là pour s\'organiser ensemble 👍';
    }
    if (lowerMsg.includes('départ') || lowerMsg.includes('partir')) {
      return 'N\'oubliez pas de vérifier vos passeports et billets !';
    }
    if (lowerMsg.includes('?')) {
      return 'Bonne question ! Je vérifie et je te dis ça 🔍';
    }
    
    // Réponses génériques
    const genericReplies = [
      'D\'accord, noté ! 👍',
      'Parfait, on fait comme ça alors',
      'Super idée ! Je suis partant',
      'OK, on se tient au courant',
      'Génial, merci de l\'info !',
      'Ça marche pour moi 😊'
    ];
    
    return genericReplies[Math.floor(Math.random() * genericReplies.length)];
  }

  /**
   * Déclenche les callbacks enregistrés
   */
  private trigger(eventType: string, data: any) {
    const callbacks = this.eventCallbacks.get(eventType);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[Collaboration] Error in callback for ${eventType}:`, error);
        }
      });
    }
  }
}

// Instance singleton
export const collaborationService = new CollaborationService();

/**
 * Hook React pour utiliser la collaboration
 */
export function useCollaboration(tripId: string | null, user: CollaborationUser | null) {
  const [onlineUsers, setOnlineUsers] = React.useState<CollaborationUser[]>([]);
  const [isConnected, setIsConnected] = React.useState(false);

  React.useEffect(() => {
    if (!tripId || !user) return;

    // Connexion
    collaborationService.connect();
    collaborationService.joinTrip(tripId, user);

    // Listeners
    const handleConnected = () => setIsConnected(true);
    const handleDisconnected = () => setIsConnected(false);
    const handleUsersUpdated = (users: CollaborationUser[]) => setOnlineUsers(users);

    collaborationService.on('connected', handleConnected);
    collaborationService.on('disconnected', handleDisconnected);
    collaborationService.on('online-users-updated', handleUsersUpdated);

    return () => {
      collaborationService.off('connected', handleConnected);
      collaborationService.off('disconnected', handleDisconnected);
      collaborationService.off('online-users-updated', handleUsersUpdated);
      collaborationService.leaveTrip();
    };
  }, [tripId, user?.id]);

  return {
    onlineUsers,
    isConnected,
    emitEvent: collaborationService.emitEvent.bind(collaborationService),
    sendMessage: collaborationService.sendMessage.bind(collaborationService),
    emitTyping: collaborationService.emitTyping.bind(collaborationService),
    on: collaborationService.on.bind(collaborationService),
    off: collaborationService.off.bind(collaborationService)
  };
}

// Note: Ajouter "import React from 'react';" en haut du fichier si utilisé en React
import React from 'react';
