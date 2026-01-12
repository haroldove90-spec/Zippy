
import React, { useState, useEffect } from 'react';
import { Menu, Navigation, MessageSquare, ShieldCheck, MapPin, Loader2, Calendar, Clock, Lock, Eye, EyeOff, Star, BellRing, X } from 'lucide-react';
import { RideStatus, DriverOffer } from '../types';
import MapVisual from './MapVisual';
import Drawer from './Drawer';
import AssistantModal from './AssistantModal';
import EmergencyDirectory from './EmergencyDirectory';
import { supabase } from '../services/supabase';
import { getSmartPriceAdvice } from '../services/geminiService';

interface PassengerAppProps {
  onBack: () => void;
}

const PassengerApp: React.FC<PassengerAppProps> = ({ onBack }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [view, setView] = useState<'home' | 'profile' | 'history' | 'payment' | 'services'>('home');
  const [status, setStatus] = useState<RideStatus>(RideStatus.IDLE);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  
  // Realtime Push Notifications
  const [activePush, setActivePush] = useState<{title: string, message: string} | null>(null);

  // Inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [calculatedPrice, setCalculatedPrice] = useState<number>(50);
  const [smartAdvice, setSmartAdvice] = useState<{advice: string, prob: number} | null>(null);

  // Listener para mensajes masivos
  useEffect(() => {
    if (!isAuthenticated) return;

    const channel = supabase
      .channel('passenger-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
        const { title, message, target } = payload.new;
        if (target === 'ALL' || target === 'PASSENGERS') {
            setActivePush({ title, message });
            if ("vibrate" in navigator) navigator.vibrate([200, 100, 200]);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isAuthenticated]);

  useEffect(() => {
    const fetchAdvice = async () => {
        if (pickup && destination && calculatedPrice > 0) {
            const result = await getSmartPriceAdvice(pickup, destination, calculatedPrice);
            setSmartAdvice({ advice: result.advice, prob: result.successProbability });
        }
    };
    const timer = setTimeout(fetchAdvice, 1000);
    return () => clearTimeout(timer);
  }, [pickup, destination, calculatedPrice]);

  const handleAuth = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);

      if (email === 'pasajero' && password === '123_pasajero') {
          setTimeout(() => {
              setIsAuthenticated(true);
              setUserId('mock-passenger-id');
              setLoading(false);
          }, 1000);
          return;
      }

      try {
          if (authMode === 'register') {
              const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } });
              if (error) throw error;
              alert("Registro exitoso. Revisa tu email.");
          } else {
              const { data, error } = await supabase.auth.signInWithPassword({ email, password });
              if (error) throw error;
              if (data.user) {
                  setUserId(data.user.id);
                  setIsAuthenticated(true);
              }
          }
      } catch (error: any) { 
          alert("Error: " + error.message); 
      } finally { 
          setLoading(false); 
      }
  };

  if (!isAuthenticated) {
    return (
        <div className="w-full h-full bg-zippy-main flex items-center justify-center p-6 animate-fade-in">
           <div className="w-full max-w-sm bg-white rounded-[40px] shadow-2xl p-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-zippy-dark/10"></div>
              <img src="https://appdesignmex.com/zippy/zippylogo.png" className="h-12 mx-auto mb-8" />
              <h2 className="text-center font-black text-zippy-dark text-xl mb-6 uppercase tracking-widest">Pasajero</h2>
              
              <form onSubmit={handleAuth} className="space-y-4">
                  {authMode === 'register' && (
                      <input required placeholder="Nombre completo" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-zippy-main" value={fullName} onChange={e=>setFullName(e.target.value)} />
                  )}
                  <input required placeholder="Usuario o Email" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-zippy-main" value={email} onChange={e=>setEmail(e.target.value)} />
                  <div className="relative">
                      <input required type={showPassword ? "text" : "password"} placeholder="Contraseña" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-zippy-main" value={password} onChange={e=>setPassword(e.target.value)} />
                      <button type="button" onClick={()=>setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                  </div>
                  <button className="w-full bg-zippy-dark text-white font-black py-4 rounded-2xl shadow-xl hover:scale-[1.02] transition-transform flex items-center justify-center gap-2">
                      {loading ? <Loader2 className="animate-spin" /> : 'INGRESAR A ZIPPY'}
                  </button>
                  <button type="button" onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="w-full text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      {authMode === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Entra'}
                  </button>
                  <button type="button" onClick={onBack} className="w-full text-[10px] font-black text-red-400 uppercase tracking-widest mt-2">Volver al Inicio</button>
              </form>
           </div>
        </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-gray-100 overflow-hidden flex flex-col font-sans">
      <MapVisual status={status} />

      {/* PUSH ALERT OVERLAY */}
      {activePush && (
          <div className="fixed inset-0 z-[500] bg-zippy-dark/90 backdrop-blur-xl p-8 flex items-center justify-center animate-fade-in">
              <div className="bg-white w-full max-w-sm rounded-[40px] p-8 shadow-2xl relative border-4 border-zippy-main text-center">
                  <div className="w-20 h-20 bg-zippy-main rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-xl animate-bounce">
                      <BellRing size={40} className="text-zippy-dark" />
                  </div>
                  <h3 className="text-2xl font-black text-zippy-dark mb-4">{activePush.title}</h3>
                  <p className="text-gray-500 font-bold leading-relaxed mb-8">{activePush.message}</p>
                  <button 
                      onClick={() => setActivePush(null)}
                      className="w-full bg-zippy-dark text-white font-black py-5 rounded-3xl shadow-xl active:scale-95 transition-transform"
                  >
                      ENTENDIDO
                  </button>
              </div>
          </div>
      )}

      {/* NAVBAR */}
      <div className="absolute top-0 left-0 right-0 p-4 z-30 flex justify-between items-center">
        <button onClick={() => setDrawerOpen(true)} className="p-4 bg-white shadow-xl rounded-2xl text-zippy-dark active:scale-90 transition-transform"><Menu size={24}/></button>
        <button onClick={() => setAssistantOpen(true)} className="p-4 bg-zippy-dark text-zippy-accent shadow-xl rounded-2xl animate-pulse"><MessageSquare size={24}/></button>
      </div>

      {/* RIDE REQUEST UI */}
      <div className="absolute inset-x-0 bottom-0 z-30 pointer-events-none p-4">
          {status === RideStatus.IDLE && (
              <div className="pointer-events-auto bg-white rounded-[40px] p-8 shadow-2xl border border-gray-100 animate-slide-up">
                  <div className="w-12 h-1 bg-gray-100 rounded-full mx-auto mb-6"></div>
                  <h2 className="text-2xl font-black text-zippy-dark mb-6">¿A dónde <span className="text-zippy-main">vamos?</span></h2>
                  
                  <div className="space-y-4 mb-8">
                      <div className="bg-gray-50 p-4 rounded-2xl flex items-center gap-4 border border-gray-100 focus-within:border-zippy-main transition-colors">
                          <MapPin size={20} className="text-green-500" />
                          <input type="text" value={pickup} onChange={e=>setPickup(e.target.value)} placeholder="¿Dónde te recogemos?" className="bg-transparent w-full font-bold outline-none text-zippy-dark" />
                      </div>
                      <div className="bg-gray-50 p-4 rounded-2xl flex items-center gap-4 border border-gray-100 focus-within:border-zippy-main transition-colors">
                          <Navigation size={20} className="text-red-500" />
                          <input type="text" value={destination} onChange={e=>setDestination(e.target.value)} placeholder="¿A dónde vas?" className="bg-transparent w-full font-bold outline-none text-zippy-dark" />
                      </div>
                  </div>

                  {smartAdvice && (
                      <div className="mb-6 bg-zippy-dark text-white p-4 rounded-3xl flex items-center justify-between shadow-xl animate-fade-in border border-white/10">
                          <div className="flex items-center gap-3">
                              <div className="p-2 bg-zippy-accent rounded-xl text-zippy-dark shadow-lg"><Star size={16} fill="currentColor" /></div>
                              <div>
                                  <p className="text-[10px] font-black uppercase text-zippy-accent/70 tracking-widest">AI Price Advice</p>
                                  <p className="text-xs font-bold leading-tight">{smartAdvice.advice}</p>
                              </div>
                          </div>
                          <div className="text-right">
                              <p className="text-xl font-black text-zippy-accent">{smartAdvice.prob}%</p>
                              <p className="text-[8px] font-black uppercase opacity-60">Éxito</p>
                          </div>
                      </div>
                  )}

                  <button className="w-full bg-zippy-dark text-white font-black py-5 rounded-[24px] text-lg shadow-2xl hover:scale-[1.02] active:scale-95 transition-all">
                      ENCONTRAR ZIPPY
                  </button>
              </div>
          )}
      </div>

      <Drawer isOpen={drawerOpen} onClose={()=>setDrawerOpen(false)} onLogout={onBack} currentView={view} onChangeView={setView} onOpenEmergency={()=>setEmergencyOpen(true)} userName="Pasajero Prueba" />
      <AssistantModal isOpen={assistantOpen} onClose={()=>setAssistantOpen(false)} />
      <EmergencyDirectory isOpen={emergencyOpen} onClose={()=>setEmergencyOpen(false)} />
    </div>
  );
};

export default PassengerApp;
