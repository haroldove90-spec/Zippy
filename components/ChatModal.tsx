
import React, { useState, useEffect, useRef } from 'react';
import { Send, X, Phone, User, CheckCheck, Minus, MessageSquareOff } from 'lucide-react';
import { supabase } from '../services/supabase';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  rideId: string;
  currentUserRole: 'DRIVER' | 'PASSENGER';
  currentUserId: string;
  counterpartName: string;
  counterpartPhone?: string;
  onEndChat?: () => void; // New prop for explicit ending
}

interface Message {
  id: string;
  ride_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  role: 'DRIVER' | 'PASSENGER';
}

const MESSAGE_SOUND = 'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3'; // Pop sound

const ChatModal: React.FC<ChatModalProps> = ({ 
  isOpen, onClose, rideId, currentUserRole, currentUserId, counterpartName, counterpartPhone, onEndChat 
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // Scroll to bottom when opening
  useEffect(() => {
      if (isOpen) {
          scrollToBottom();
      }
  }, [isOpen]);

  useEffect(() => {
    if (!rideId) return;

    // 1. Fetch initial messages
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('ride_id', rideId)
        .order('created_at', { ascending: true });
      
      if (data) {
        setMessages(data as Message[]);
        if (isOpen) scrollToBottom();
      }
    };

    fetchMessages();

    // 2. Subscribe to new messages
    const channel = supabase.channel(`chat_room:${rideId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `ride_id=eq.${rideId}`
      }, (payload) => {
        const newMsg = payload.new as Message;
        
        // Avoid adding duplicate if we just sent it
        setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
        });
        
        if (isOpen) scrollToBottom();
        
        // Play sound ONLY if the message is from the other person
        if (newMsg.sender_id !== currentUserId) {
            const audio = new Audio(MESSAGE_SOUND);
            audio.play().catch(e => console.log('Audio blocked', e));
            if ("vibrate" in navigator) navigator.vibrate(50);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [rideId, currentUserId]); // Removed isOpen from dependency to keep connection alive

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    
    // Validación básica de ID de viaje
    if (!rideId) {
        alert("Error: No hay un viaje activo asociado.");
        return;
    }

    setSending(true);
    const msgContent = input.trim();
    setInput(''); // Clear immediately for better UX

    try {
        const { error } = await supabase.from('messages').insert({
            ride_id: rideId,
            sender_id: currentUserId,
            content: msgContent,
            role: currentUserRole
        });

        if (error) {
            console.error("Supabase insert error:", error);
            alert(`No se pudo enviar el mensaje: ${error.message || 'Error de conexión'}`);
            setInput(msgContent); // Restore input on error
        }
    } catch (err: any) {
        console.error("Error sending message:", err);
        alert(`Error inesperado: ${err.message}`);
        setInput(msgContent);
    } finally {
        setSending(false);
        scrollToBottom();
    }
  };

  const handleCall = () => {
      if (counterpartPhone) {
          window.location.href = `tel:${counterpartPhone}`;
      } else {
          alert("Número no disponible.");
      }
  };

  const handleEndChat = () => {
      if(onEndChat) onEndChat();
      else onClose();
  };

  // Removed "if (!isOpen) return null;" to keep component mounted and persistant
  
  return (
    <div className={`fixed inset-0 z-[200] items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in ${isOpen ? 'flex' : 'hidden'}`}>
        {/* Modal Container: Tamaño acotado, centrado */}
        <div className="bg-white w-full max-w-md h-[75vh] max-h-[600px] rounded-[32px] overflow-hidden shadow-2xl flex flex-col relative animate-slide-up border border-gray-200">
            
            {/* Header */}
            <div className="bg-zippy-main p-4 flex justify-between items-center shadow-md z-10">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-black/10 transition-colors" title="Minimizar">
                            <Minus size={24} className="text-zippy-dark" />
                        </button>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-zippy-dark rounded-full flex items-center justify-center text-white relative">
                            <User size={20} />
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-zippy-main"></div>
                        </div>
                        <div>
                            <h3 className="font-black text-zippy-dark text-base leading-none">{counterpartName}</h3>
                            <p className="text-[10px] font-bold text-zippy-dark/70 uppercase tracking-wide">En viaje activo</p>
                        </div>
                    </div>
                </div>
                <div className="flex gap-1">
                    <button onClick={handleCall} className="p-2.5 bg-white rounded-full text-zippy-dark shadow-sm active:scale-95 transition-transform hover:bg-gray-50" title="Llamar">
                        <Phone size={18} />
                    </button>
                    <button onClick={handleEndChat} className="p-2.5 bg-red-100 rounded-full text-red-600 shadow-sm active:scale-95 transition-transform hover:bg-red-200" title="Finalizar Chat">
                        <MessageSquareOff size={18} />
                    </button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 bg-[#e5ddd5] overflow-y-auto p-4 flex flex-col gap-2 relative">
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundSize: '400px' }}></div>
                
                {messages.length === 0 && (
                    <div className="text-center mt-8">
                        <p className="text-[10px] font-bold bg-white/90 inline-block px-3 py-1.5 rounded-lg shadow-sm text-gray-500 uppercase tracking-wide">
                            Inicio del chat con {counterpartName}
                        </p>
                    </div>
                )}

                {messages.map((msg) => {
                    const isMe = msg.sender_id === currentUserId;
                    return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} relative z-10 mb-1`}>
                            <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm shadow-sm ${
                                isMe 
                                ? 'bg-[#d9fdd3] text-gray-800 rounded-tr-none' 
                                : 'bg-white text-gray-800 rounded-tl-none'
                            }`}>
                                <p className="leading-snug text-sm">{msg.content}</p>
                                <div className="flex items-center justify-end gap-1 mt-0.5 opacity-60">
                                    <span className="text-[9px] font-bold">
                                        {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </span>
                                    {isMe && <CheckCheck size={12} className="text-blue-500" />}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-white p-3 border-t border-gray-200 flex gap-2 items-center z-10">
                <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Escribe un mensaje..."
                    className="flex-1 bg-gray-100 rounded-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-zippy-main text-gray-700 font-medium text-sm"
                />
                <button 
                    onClick={handleSend}
                    disabled={!input.trim() || sending}
                    className={`p-3 rounded-full bg-zippy-dark text-white shadow-lg transition-transform active:scale-95 flex items-center justify-center ${(!input.trim() || sending) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-zippy-light'}`}
                >
                    <Send size={18} />
                </button>
            </div>
        </div>
    </div>
  );
};

export default ChatModal;
