import React, { useState, useEffect, useRef } from 'react';
import { Users, MessageCircle, Send, Wifi, WifiOff, Circle } from 'lucide-react';
import { Trip } from '../../types';
import { collaborationService, type CollaborationUser, type CollaborationMessage } from '../../services/collaboration';

interface CollaborationPanelProps {
  trip: Trip;
  currentUser: {
    id: string;
    name: string;
    avatar: string;
  };
  participants: string[]; // Names of trip participants
  allUsers: any[]; // All users from AuthContext to get avatars
}

const AVATAR_COLORS = [
  'bg-brand-500',
  'bg-sky-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-pink-500',
  'bg-purple-500',
  'bg-teal-500',
  'bg-rose-500'
];

export const CollaborationPanel: React.FC<CollaborationPanelProps> = ({ 
  trip, 
  currentUser, 
  participants,
  allUsers 
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<CollaborationUser[]>([]);
  const [messages, setMessages] = useState<CollaborationMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [showChat, setShowChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Convertir les participants du voyage en CollaborationUsers
  const getTripParticipantUsers = (): CollaborationUser[] => {
    return participants
      .filter(participantName => participantName !== currentUser.name) // Exclude current user
      .map((participantName, index) => {
        // Try to find user in allUsers to get real avatar
        const realUser = allUsers.find(u => u.name === participantName);
        
        return {
          id: realUser?.id || `participant-${index}`,
          name: participantName,
          avatar: realUser?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${participantName}`,
          color: AVATAR_COLORS[index % AVATAR_COLORS.length]
        };
      });
  };

  // Générer des messages initiaux réalistes basés sur les vrais participants
  const generateInitialMessages = (): CollaborationMessage[] => {
    const tripParticipants = getTripParticipantUsers();
    if (tripParticipants.length === 0) return [];

    const firstParticipant = tripParticipants[0];
    const secondParticipant = tripParticipants.length > 1 ? tripParticipants[1] : null;

    const messages: CollaborationMessage[] = [];

    // Premier message du premier participant
    messages.push({
      id: 'msg-init-1',
      userId: firstParticipant.id,
      userName: firstParticipant.name,
      userAvatar: firstParticipant.avatar,
      message: `Salut ! Vous êtes prêts pour ${trip.destination} ? 🎉`,
      timestamp: Date.now() - 7200000 // Il y a 2 heures
    });

    // Deuxième message si un deuxième participant existe
    if (secondParticipant) {
      messages.push({
        id: 'msg-init-2',
        userId: secondParticipant.id,
        userName: secondParticipant.name,
        userAvatar: secondParticipant.avatar,
        message: `Oui ! J'ai hâte d'y être 😊`,
        timestamp: Date.now() - 7000000
      });

      messages.push({
        id: 'msg-init-3',
        userId: firstParticipant.id,
        userName: firstParticipant.name,
        userAvatar: firstParticipant.avatar,
        message: `N'oubliez pas de vérifier vos passeports avant le départ !`,
        timestamp: Date.now() - 6800000
      });
    }

    return messages;
  };

  useEffect(() => {
    // Initialiser la collaboration
    const collabUser: CollaborationUser = {
      ...currentUser,
      color: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]
    };

    collaborationService.connect();
    collaborationService.joinTrip(trip.id, collabUser);

    // En mode mock, remplacer les utilisateurs simulés par les vrais participants
    const realParticipants = getTripParticipantUsers();
    if (realParticipants.length > 0) {
      setOnlineUsers(realParticipants);
      setIsConnected(true);

      // Charger les messages initiaux basés sur les vrais participants
      const initialMessages = generateInitialMessages();
      if (initialMessages.length > 0) {
        setMessages(initialMessages);
      }
    }

    // Listeners
    const handleConnected = () => setIsConnected(true);
    const handleDisconnected = () => setIsConnected(false);
    const handleUsersUpdated = (users: CollaborationUser[]) => {
      // En mode mock, toujours utiliser les vrais participants
      const realParticipants = getTripParticipantUsers();
      setOnlineUsers(realParticipants.length > 0 ? realParticipants : users);
    };
    const handleChatMessage = (msg: CollaborationMessage) => {
      setMessages(prev => [...prev, msg]);
      scrollToBottom();
    };
    const handleUserTyping = (user: CollaborationUser) => {
      if (user.id !== currentUser.id) {
        setTypingUsers(prev => new Set(prev).add(user.name));
        setTimeout(() => {
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(user.name);
            return newSet;
          });
        }, 3000);
      }
    };
    const handleEvent = (event: any) => {
      // Notification toast pour les événements
      if (event.user.id !== currentUser.id) {
        showEventNotification(event);
      }
    };

    collaborationService.on('connected', handleConnected);
    collaborationService.on('disconnected', handleDisconnected);
    collaborationService.on('online-users-updated', handleUsersUpdated);
    collaborationService.on('chat-message', handleChatMessage);
    collaborationService.on('user-typing', handleUserTyping);
    collaborationService.on('event', handleEvent);

    return () => {
      collaborationService.off('connected', handleConnected);
      collaborationService.off('disconnected', handleDisconnected);
      collaborationService.off('online-users-updated', handleUsersUpdated);
      collaborationService.off('chat-message', handleChatMessage);
      collaborationService.off('user-typing', handleUserTyping);
      collaborationService.off('event', handleEvent);
      collaborationService.leaveTrip();
    };
  }, [trip.id, currentUser.id, participants, allUsers]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;

    collaborationService.sendMessage(messageInput.trim());
    setMessageInput('');

    // Simuler une réponse d'un vrai participant aléatoire après un délai
    const otherParticipants = getTripParticipantUsers();
    if (otherParticipants.length > 0) {
      setTimeout(() => {
        const randomParticipant = otherParticipants[Math.floor(Math.random() * otherParticipants.length)];
        const mockReply: CollaborationMessage = {
          id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          userId: randomParticipant.id,
          userName: randomParticipant.name,
          userAvatar: randomParticipant.avatar,
          message: getSmartReply(messageInput, randomParticipant.name),
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, mockReply]);
        scrollToBottom();
      }, 1500 + Math.random() * 2000);
    }
  };

  const getSmartReply = (message: string, responderName: string): string => {
    const lowerMsg = message.toLowerCase();
    
    if (lowerMsg.includes('bonjour') || lowerMsg.includes('salut') || lowerMsg.includes('hello')) {
      return `Salut ${currentUser.name} ! Comment vas-tu ? 😊`;
    }
    if (lowerMsg.includes('restaurant') || lowerMsg.includes('manger') || lowerMsg.includes('dîner')) {
      return `Bonne idée ! J'ai vu un super resto près de l'hôtel 🍽️`;
    }
    if (lowerMsg.includes('heure') || lowerMsg.includes('quand')) {
      return `Je propose vers 19h30, ça vous convient ?`;
    }
    if (lowerMsg.includes('merci') || lowerMsg.includes('thank')) {
      return `De rien ${currentUser.name} ! On est là pour s'organiser ensemble 👍`;
    }
    if (lowerMsg.includes('départ') || lowerMsg.includes('partir') || lowerMsg.includes('voyage')) {
      return `N'oublie pas de vérifier tes documents de voyage !`;
    }
    if (lowerMsg.includes('vol') || lowerMsg.includes('avion') || lowerMsg.includes('billet')) {
      return `J'ai déjà checké mon billet, tout est OK de mon côté ✈️`;
    }
    if (lowerMsg.includes('hôtel') || lowerMsg.includes('hébergement') || lowerMsg.includes('hotel')) {
      return `J'ai hâte de voir l'hôtel ! Les photos ont l'air super 🏨`;
    }
    if (lowerMsg.includes('?')) {
      return `Bonne question ! Laisse-moi vérifier et je te dis ça 🔍`;
    }
    
    // Réponses génériques avec le nom du responder
    const genericReplies = [
      `D'accord, noté ! 👍`,
      `Parfait, on fait comme ça alors`,
      `Super idée ${currentUser.name} ! Je suis partant`,
      `OK, on se tient au courant`,
      `Génial, merci de l'info !`,
      `Ça marche pour moi 😊`,
      `Complètement d'accord avec toi !`,
      `Bonne initiative ${currentUser.name} 💪`
    ];
    
    return genericReplies[Math.floor(Math.random() * genericReplies.length)];
  };

  const handleTyping = () => {
    collaborationService.emitTyping();

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      // Stop typing indicator
    }, 1000);
  };

  const showEventNotification = (event: any) => {
    // Simple notification (peut être amélioré avec un toast)
    console.log(`[Collaboration] ${event.user.name} - ${event.type}`, event.data);
  };

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 to-slate-850">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Users className="w-5 h-5 text-brand-400" />
            {onlineUsers.length > 0 && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900"></span>
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Collaboration</h3>
            <div className="flex items-center space-x-1.5 text-xs">
              {isConnected ? (
                <>
                  <Wifi className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">{onlineUsers.length} en ligne</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 text-slate-500" />
                  <span className="text-slate-500">Hors ligne</span>
                </>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowChat(!showChat)}
          className="relative px-3 py-1.5 text-xs font-semibold text-brand-400 hover:bg-brand-500/10 rounded-lg border border-brand-500/30 transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          {messages.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {messages.length}
            </span>
          )}
        </button>
      </div>

      {/* Online Users */}
      <div className="p-3 space-y-2">
        <h4 className="text-xs font-bold text-slate-400 uppercase">
          Participants du voyage ({onlineUsers.length}/{participants.length - 1})
        </h4>
        {onlineUsers.length === 0 ? (
          <div className="text-xs text-slate-500 text-center py-4">
            <Users className="w-8 h-8 mx-auto mb-2 text-slate-700" />
            <p>Vous êtes le seul participant</p>
            <p className="text-[10px] mt-1">Invitez d'autres personnes à rejoindre ce voyage</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {onlineUsers.map(user => {
              // Find real user for avatar
              const realUser = allUsers.find(u => u.name === user.name);
              const avatarSrc = realUser?.avatar || user.avatar;
              
              return (
                <div key={user.id} className="flex items-center space-x-2 p-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors">
                  <img 
                    src={avatarSrc} 
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-white truncate">{user.name}</div>
                    <div className="flex items-center space-x-1 text-[10px] text-emerald-400">
                      <Circle className="w-2 h-2 fill-current animate-pulse" />
                      <span>En ligne</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Chat Panel */}
      {showChat && (
        <div className="border-t border-slate-800 bg-slate-950/40">
          <div className="h-64 flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {messages.length === 0 ? (
                <div className="text-center text-xs text-slate-500 py-8">
                  <MessageCircle className="w-8 h-8 mx-auto mb-2 text-slate-700" />
                  <p>Aucun message pour le moment</p>
                  <p className="text-[10px] mt-1">Commencez la conversation avec {participants.length} participant{participants.length > 1 ? 's' : ''}</p>
                </div>
              ) : (
                messages.map(msg => {
                  // Try to find real user for avatar
                  const msgUser = allUsers.find(u => u.name === msg.userName);
                  const avatarSrc = msgUser?.avatar || msg.userAvatar;
                  
                  return (
                    <div key={msg.id} className={`flex items-start space-x-2 ${msg.userId === currentUser.id ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      <img 
                        src={avatarSrc} 
                        alt={msg.userName}
                        className="w-6 h-6 rounded-full flex-shrink-0 object-cover"
                      />
                      <div className={`flex-1 max-w-[75%] ${msg.userId === currentUser.id ? 'items-end' : 'items-start'}`}>
                        <div className="flex items-center space-x-1.5 mb-0.5">
                          <span className="text-[10px] font-semibold text-slate-400">{msg.userName}</span>
                          <span className="text-[9px] text-slate-600">
                            {new Date(msg.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className={`p-2 rounded-lg text-xs ${
                          msg.userId === currentUser.id 
                            ? 'bg-brand-600 text-white' 
                            : 'bg-slate-800 text-slate-200'
                        }`}>
                          {msg.message}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Typing Indicator */}
            {typingUsers.size > 0 && (
              <div className="px-3 py-1 text-[10px] text-slate-400 italic">
                {Array.from(typingUsers).join(', ')} {typingUsers.size > 1 ? 'sont' : 'est'} en train d'écrire...
              </div>
            )}

            {/* Input */}
            <div className="p-3 border-t border-slate-800">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={e => {
                    setMessageInput(e.target.value);
                    handleTyping();
                  }}
                  onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Écrivez un message..."
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                  disabled={!isConnected}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim() || !isConnected}
                  className="p-2 bg-brand-600 hover:bg-brand-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
