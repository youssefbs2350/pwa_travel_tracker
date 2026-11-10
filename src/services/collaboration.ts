import React from 'react';

/**
 * Service de collaboration en temps réel pour les voyages
 * Gère les messages de discussion et les participants réels par voyage
 * Synchronisé avec MongoDB (Vercel) + BroadcastChannel + Cache local
 */

export interface CollaborationUser {
  id: string;
  name: string;
  avatar: string;
  color: string;
  role?: string;
  isOnline?: boolean;
}

export interface CollaborationEvent {
  type: 'activity-added' | 'expense-added' | 'place-added' | 'document-uploaded' | 'message' | 'typing';
  user: CollaborationUser;
  data: any;
  timestamp: number;
}

export interface CollaborationMessage {
  id: string;
  tripId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  message: string;
  timestamp: number;
}

class CollaborationService {
  private currentTripId: string | null = null;
  private currentUser: CollaborationUser | null = null;
  private eventCallbacks: Map<string, Function[]> = new Map();
  private realParticipants: CollaborationUser[] = [];
  private broadcastChannel: BroadcastChannel | null = null;
  private pollingTimer: any = null;

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel('travel_tracker_collab_bus');
        this.broadcastChannel.onmessage = (event) => {
          const data = event.data;
          if (!data) return;
          if (data.type === 'NEW_MESSAGE' && data.message) {
            const msg: CollaborationMessage = data.message;
            if (msg.tripId === this.currentTripId) {
              const current = this.getTripMessages(this.currentTripId);
              if (!current.some(m => m.id === msg.id || (m.timestamp === msg.timestamp && m.userId === msg.userId))) {
                const updated = [...current, msg];
                this.saveTripMessages(this.currentTripId, updated);
                this.trigger('chat-message', msg);
              }
            }
          }
        };
      } catch (err) {
        console.warn('[Collaboration] BroadcastChannel non supporté:', err);
      }
    }
  }

  /**
   * Initialise le service de collaboration
   */
  connect() {
    this.trigger('connected', {});
  }

  /**
   * Déconnexion propre
   */
  disconnect() {
    this.stopPolling();
    this.eventCallbacks.clear();
    this.currentTripId = null;
  }

  /**
   * Définit les participants réels du voyage
   */
  setTripParticipants(participants: CollaborationUser[]) {
    this.realParticipants = participants;
    this.trigger('online-users-updated', this.realParticipants);
  }

  /**
   * Récupère les messages enregistrés localement pour un voyage donné
   */
  getTripMessages(tripId: string): CollaborationMessage[] {
    try {
      const raw = localStorage.getItem(`trip_collab_messages_${tripId}`);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Erreur lecture messages voyage:', e);
    }
    return [];
  }

  /**
   * Enregistre les messages pour un voyage
   */
  private saveTripMessages(tripId: string, messages: CollaborationMessage[]) {
    try {
      localStorage.setItem(`trip_collab_messages_${tripId}`, JSON.stringify(messages));
    } catch (e) {
      console.warn('Erreur sauvegarde messages voyage:', e);
    }
  }

  /**
   * Charge les messages depuis MongoDB et met à jour le cache local
   */
  async fetchRemoteMessages(tripId: string): Promise<CollaborationMessage[]> {
    try {
      const res = await fetch(`/api/trips/${tripId}/messages`);
      if (res.ok) {
        const remoteList = await res.json();
        const formatted: CollaborationMessage[] = remoteList.map((m: any) => ({
          id: m._id || m.id,
          tripId: m.tripId,
          userId: m.userId,
          userName: m.userName,
          userAvatar: m.userAvatar,
          message: m.message,
          timestamp: m.timestamp || new Date(m.createdAt).getTime()
        }));

        // Fusionner avec le cache local pour ne rien perdre
        const local = this.getTripMessages(tripId);
        const map = new Map<string, CollaborationMessage>();
        local.forEach(m => map.set(m.id, m));
        formatted.forEach(m => map.set(m.id, m));

        const merged = Array.from(map.values()).sort((a, b) => a.timestamp - b.timestamp);
        this.saveTripMessages(tripId, merged);
        this.trigger('chat-history', merged);
        return merged;
      }
    } catch (err) {
      // mode hors ligne : conservation des données locales
    }
    return this.getTripMessages(tripId);
  }

  /**
   * Démarre la synchronisation active (polling toutes les 3,5s)
   */
  startPolling(tripId: string) {
    this.stopPolling();
    this.pollingTimer = setInterval(() => {
      if (this.currentTripId === tripId) {
        this.fetchRemoteMessages(tripId);
      }
    }, 3500);
  }

  /**
   * Arrête le polling
   */
  stopPolling() {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
  }

  /**
   * Rejoint un voyage pour la collaboration
   */
  joinTrip(tripId: string, user: CollaborationUser, tripParticipants?: CollaborationUser[]) {
    this.currentTripId = tripId;
    this.currentUser = user;

    if (tripParticipants && tripParticipants.length > 0) {
      this.realParticipants = tripParticipants;
    }

    setTimeout(() => {
      this.trigger('online-users-updated', this.realParticipants);
      const history = this.getTripMessages(tripId);
      this.trigger('chat-history', history);
      // Récupération immédiate depuis le serveur MongoDB
      this.fetchRemoteMessages(tripId);
      // Démarrage du polling régulier
      this.startPolling(tripId);
    }, 50);
  }

  /**
   * Quitte le voyage actuel
   */
  leaveTrip() {
    this.stopPolling();
    this.currentTripId = null;
  }

  /**
   * Émet un événement
   */
  emitEvent(event: Omit<CollaborationEvent, 'user' | 'timestamp'>) {
    if (!this.currentTripId || !this.currentUser) return;

    const fullEvent: CollaborationEvent = {
      ...event,
      user: this.currentUser,
      timestamp: Date.now()
    };
    this.trigger('event', fullEvent);
    this.trigger(`event:${event.type}`, fullEvent);
  }

  /**
   * Envoie un message dans le chat du voyage et le synchronise sur MongoDB + participants
   */
  async sendMessage(message: string): Promise<CollaborationMessage | null> {
    if (!this.currentTripId || !this.currentUser || !message.trim()) return null;

    const tempId = `msg-${this.currentTripId}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const chatMessage: CollaborationMessage = {
      id: tempId,
      tripId: this.currentTripId,
      userId: this.currentUser.id,
      userName: this.currentUser.name,
      userAvatar: this.currentUser.avatar,
      message: message.trim(),
      timestamp: Date.now()
    };

    // 1. Sauvegarde locale immédiate (Optimistic UI)
    const currentMessages = this.getTripMessages(this.currentTripId);
    const updated = [...currentMessages, chatMessage];
    this.saveTripMessages(this.currentTripId, updated);
    this.trigger('chat-message', chatMessage);

    // 2. Diffusion instantanée aux autres onglets ouverts via BroadcastChannel
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({
          type: 'NEW_MESSAGE',
          message: chatMessage
        });
      } catch (e) {
        console.warn('[Collaboration] Erreur envoi broadcast:', e);
      }
    }

    // 3. Envoi au serveur MongoDB sur Vercel
    try {
      const res = await fetch(`/api/trips/${this.currentTripId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: this.currentUser.id,
          userName: this.currentUser.name,
          userAvatar: this.currentUser.avatar,
          message: message.trim(),
          timestamp: chatMessage.timestamp
        })
      });

      if (res.ok) {
        const saved = await res.json();
        // Mettre à jour l'ID définitif MongoDB si nécessaire
        chatMessage.id = saved._id || saved.id || tempId;
      }
    } catch (err) {
      console.log('[Collaboration] Message stocké localement (Hors-ligne)');
    }

    return chatMessage;
  }

  /**
   * Indique que l'utilisateur tape
   */
  emitTyping() {
    if (!this.currentTripId || !this.currentUser) return;
    this.trigger('user-typing', this.currentUser);
  }

  /**
   * Enregistre un callback pour un événement
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
   * Récupère la liste des participants
   */
  getOnlineUsers(): CollaborationUser[] {
    return this.realParticipants;
  }

  /**
   * Déclenche les callbacks
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

export const collaborationService = new CollaborationService();

/**
 * Hook React pour utiliser la collaboration
 */
export function useCollaboration(tripId: string | null, user: CollaborationUser | null) {
  const [onlineUsers, setOnlineUsers] = React.useState<CollaborationUser[]>([]);
  const [isConnected, setIsConnected] = React.useState(false);

  React.useEffect(() => {
    if (!tripId || !user) return;

    collaborationService.connect();
    collaborationService.joinTrip(tripId, user);

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
