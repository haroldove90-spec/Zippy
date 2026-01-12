import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, Sparkles } from 'lucide-react';
import { ChatMessage } from '../types';
import { chatWithZippy } from '../services/geminiService';

interface AssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AssistantModal: React.FC<AssistantModalProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
      { id: '1', role: 'model', text: '¡Hola! Soy Zippy. ¿En qué puedo ayudarte hoy con tu viaje?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userText = input;
    setInput('');
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: userText };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    // Format history for Gemini
    const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
    }));

    const responseText = await chatWithZippy(userText, history);
    
    setLoading(false);
    setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'model', text: responseText }]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zippy-dark/60 backdrop-blur-sm">
      <div className="bg-zippy-main w-full max-w-md h-[600px] rounded-2xl flex flex-col shadow-2xl border border-white/30 overflow-hidden">
        {/* Header - Green */}
        <div className="bg-zippy-main p-4 flex justify-between items-center border-b border-zippy-dark/10">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-zippy-dark rounded-full text-white">
                    <Bot size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-zippy-dark">Asistente Zippy</h3>
                    <p className="text-xs text-zippy-dark/70 font-bold flex items-center gap-1">
                        <Sparkles size={10} /> IA Powered
                    </p>
                </div>
            </div>
            <button onClick={onClose} className="text-zippy-dark hover:bg-white/20 p-1 rounded-full transition-colors">
                <X size={24} />
            </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-md ${
                        msg.role === 'user' 
                        ? 'bg-zippy-dark text-white font-medium rounded-tr-none' 
                        : 'bg-white text-zippy-dark font-medium rounded-tl-none border border-zippy-dark/10'
                    }`}>
                        {msg.text}
                    </div>
                </div>
            ))}
            {loading && (
                <div className="flex justify-start">
                    <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-zippy-dark/10 shadow-md">
                        <div className="flex gap-1">
                            <span className="w-2 h-2 bg-zippy-dark rounded-full animate-bounce"></span>
                            <span className="w-2 h-2 bg-zippy-dark rounded-full animate-bounce delay-100"></span>
                            <span className="w-2 h-2 bg-zippy-dark rounded-full animate-bounce delay-200"></span>
                        </div>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-zippy-main border-t border-zippy-dark/10">
            <div className="flex gap-2">
                <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Escribe tu mensaje..."
                    className="flex-1 bg-white text-zippy-dark rounded-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-zippy-dark placeholder-gray-400 border border-zippy-dark/10 shadow-inner"
                />
                <button 
                    onClick={handleSend}
                    disabled={!input.trim() || loading}
                    className="bg-zippy-dark text-white p-3 rounded-full hover:bg-zippy-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
                >
                    <Send size={20} />
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AssistantModal;