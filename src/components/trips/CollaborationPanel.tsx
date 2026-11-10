import React, { useState, useEffect, useRef } from 'react';
import { Users, MessageCircle, Send, Wifi, Circle, Sparkles, UserCheck } from 'lucide-react';
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
  allUsers: any[]; // All users from AuthContext
}

const AVATAR_COLORS = [
  'bg-amber-500',
  'bg-sky-500',
  'bg-emerald-500',
  'bg-brand-500',
  'bg-pink-500',
  'bg-purple-500',
  'bg-teal-500',
  'bg-rose-500'
];

export const CollaborationPanel: React.FC<CollaborationPanelProps> = ({ 
  trip, 
  currentUser, 
  participants = [],
  allUsers = []
}) => {
  const [isConnected, setIsConnected] = useState(true);
  const [messages, setMessages] = useState<CollaborationMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [showChat, setShowChat] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Build the list of real participants for this trip
  const tripParticipants: CollaborationUser[] = React.useMemo(() => {
    // Collect all participant names
    const namesSet = new Set<string>();
    if (currentUser?.name) namesSet.add(currentUser.name);
    participants.forEach(p => {
      if (p && p.trim()) namesSet.add(p.trim());
    });

    const list: CollaborationUser[] = [];
    let colorIdx = 0;

    namesSet.forEach(name => {
      const isCurrent = name === currentUser?.name;
      const matchedUser = allUsers.find(u => u.name?.toLowerCase() === name.toLowerCase());

      list.push({
        id: isCurrent ? currentUser.id : (matchedUser?.id || `user-${name}`),
        name,
        avatar: matchedUser?.avatar || (isCurrent ? currentUser.avatar : `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`),
        color: AVATAR_COLORS[colorIdx % AVATAR_COLORS.length],
        role: matchedUser?.role || (isCurrent ? 'Moi' : 'Voyageur'),
        isOnline: isCurrent || true
      });
      colorIdx++;
    });

    return list;
  }, [participants, currentUser, allUsers]);

  // Load and subscribe to trip-specific conversation
  useEffect(() => {
    collaborationService.connect();

    const collabUser: CollaborationUser = {
      ...currentUser,
      color: 'bg-emerald-500',
      isOnline: true
    };

    collaborationService.joinTrip(trip.id, collabUser, tripParticipants);

    // Load persisted messages strictly unique to this trip
    const stored = collaborationService.getTripMessages(trip.id);
    setMessages(stored);

    const handleChatMessage = (msg: CollaborationMessage) => {
      if (msg.tripId === trip.id) {
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        scrollToBottom();
      }
    };

    collaborationService.on('chat-message', handleChatMessage);

    return () => {
      collaborationService.off('chat-message', handleChatMessage);
      collaborationService.leaveTrip();
    };
  }, [trip.id, currentUser.id, tripParticipants]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 80);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageInput.trim()) return;

    const text = messageInput.trim();
    setMessageInput('');
    const newMsg = await collaborationService.sendMessage(text);
    if (newMsg) {
      setMessages(prev => {
        if (prev.some(m => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
      scrollToBottom();
    }
  };

  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 to-slate-850">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Users className="w-5 h-5 text-emerald-400" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-slate-900 animate-pulse"></span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <span>Espace Équipe • {trip.destination}</span>
            </h3>
            <div className="flex items-center space-x-1.5 text-xs">
              <Wifi className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400 font-semibold">{tripParticipants.length} participant(s) réels</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowChat(!showChat)}
          className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all flex items-center space-x-1.5 ${
            showChat 
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
              : 'text-slate-400 hover:text-white border-slate-700 bg-slate-800'
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          <span>Discussion ({messages.length})</span>
        </button>
      </div>

      {/* Real Participants Row */}
      <div className="p-3 bg-slate-950/60 border-b border-slate-800/80">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Participants au séjour ({tripParticipants.length})
          </span>
          <span className="text-[10px] text-slate-500">
            Code séjour : <strong className="text-amber-400 font-mono">{trip.shareCode || 'TRIP'}</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {tripParticipants.map(user => {
            const isMe = user.id === currentUser.id || user.name === currentUser.name;

            return (
              <div 
                key={user.id} 
                className={`flex items-center space-x-2.5 p-2 rounded-xl border transition-all ${
                  isMe 
                    ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-200' 
                    : 'bg-slate-900 border-slate-800 text-slate-300'
                }`}
              >
                <div className="relative flex-shrink-0">
                  <img 
                    src={user.avatar} 
                    alt={user.name}
                    className="w-7 h-7 rounded-full object-cover border border-slate-700"
                  />
                  <Circle className={`w-2.5 h-2.5 absolute -bottom-0.5 -right-0.5 fill-current ${
                    isMe ? 'text-emerald-400' : 'text-sky-400'
                  }`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-white truncate flex items-center space-x-1">
                    <span>{user.name}</span>
                    {isMe && <span className="text-[10px] text-emerald-400 font-semibold">(Moi)</span>}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {user.role}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat Panel - Unique to this trip */}
      {showChat && (
        <div className="bg-slate-950/40 flex flex-col h-72">
          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {messages.length === 0 ? (
              <div className="text-center text-xs text-slate-500 py-8 space-y-2">
                <Sparkles className="w-8 h-8 mx-auto text-emerald-500/40" />
                <p className="font-semibold text-slate-400">
                  Aucun message pour le moment pour ce voyage.
                </p>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                  Les échanges ici sont strictement réservés aux participants de <strong>{trip.title}</strong>.
                </p>
              </div>
            ) : (
              messages.map(msg => {
                const isMyMessage = msg.userId === currentUser.id || msg.userName === currentUser.name;
                const matchedUser = allUsers.find(u => u.name === msg.userName);
                const avatarSrc = matchedUser?.avatar || msg.userAvatar;

                return (
                  <div 
                    key={msg.id} 
                    className={`flex items-start space-x-2 ${
                      isMyMessage ? 'flex-row-reverse space-x-reverse' : ''
                    }`}
                  >
                    <img 
                      src={avatarSrc} 
                      alt={msg.userName}
                      className="w-6 h-6 rounded-full flex-shrink-0 object-cover mt-0.5 border border-slate-700"
                    />
                    <div className={`max-w-[80%] ${isMyMessage ? 'items-end text-right' : 'items-start text-left'}`}>
                      <div className="flex items-center space-x-1.5 mb-1 px-1">
                        <span className={`text-[10px] font-bold ${isMyMessage ? 'text-emerald-400' : 'text-slate-300'}`}>
                          {msg.userName} {isMyMessage && '✓'}
                        </span>
                        <span className="text-[9px] text-slate-500">
                          {new Date(msg.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className={`p-2.5 rounded-2xl text-xs break-words shadow-sm ${
                        isMyMessage 
                          ? 'bg-emerald-600 text-white rounded-tr-none' 
                          : 'bg-slate-800 text-slate-200 border border-slate-700/60 rounded-tl-none'
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

          {/* Input Bar */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 bg-slate-900/90 flex items-center space-x-2">
            <input
              type="text"
              value={messageInput}
              onChange={e => setMessageInput(e.target.value)}
              placeholder={`Écrire aux participants (${currentUser.name})...`}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={!messageInput.trim()}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold rounded-xl text-xs transition-colors flex items-center space-x-1 shadow-md"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Envoyer</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
