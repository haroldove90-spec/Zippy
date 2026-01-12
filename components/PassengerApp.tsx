
import React, { useState, useEffect } from 'react';
import { Menu, Navigation, MessageSquare, ShieldCheck, MapPin, Loader2, Calendar, Clock, Lock, Eye, EyeOff, Star, BellRing, X, ChevronRight, Check } from 'lucide-react';
import { RideStatus, DriverOffer } from '../types';
import MapVisual from './MapVisual';
import Drawer from './Drawer';
import AssistantModal from './AssistantModal';
import EmergencyDirectory from './EmergencyDirectory';
import OffersList from './OffersList';
import { supabase } from '../services/supabase';
import { getSmartPriceAdvice } from '../services/geminiService';

interface PassengerAppProps {
  onBack: () => void;
}

const MOCK_OFFERS: DriverOffer[] = [
    { id: 'd1', name: 'Roberto Gómez', rating: 4.9, carModel: 'Nissan Tsuru', carPlate: 'TX-102', taxiNumber: '0842', price: 45, eta: 3, avatarUrl: 'https://ui-avatars.com/api/?name=Roberto+Gomez&background=003A70&color=fff', distance: 0.8, tripsCompleted: 1250 },
    { id: 'd2', name: 'Elena Rodríguez', rating: 4.8, carModel: 'Hyundai Accent', carPlate: 'TX-554', taxiNumber: '1120', price: 55, eta: 5, avatarUrl: 'https://ui-avatars.com/api/?name=Elena+Rodriguez&background=A9D300&color=003A70', distance: 1.2, tripsCompleted: 840 },
    { id: 'd3', name: 'Lucía Fernández', rating: 5.0, carModel: 'Chevrolet Aveo', carPlate: 'TX-882', taxiNumber: '0015', price: 60, eta: 2, avatarUrl: 'https://ui-avatars.com/api/?name=Lucia+Fernandez&background=FFD300&color=003A70', distance: 0.5, tripsCompleted: 2100 }
];

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
  
  const [activePush, setActivePush] = useState<{title: string, message: string} | null>(null);
  const [availableOffers, setAvailableOffers] = useState<DriverOffer[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<DriverOffer | null>(null);

  // Inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [pickup, setPickup] = useState('Mi ubicación actual');
  const [destination, setDestination] = useState('');
  const [calculatedPrice, setCalculatedPrice] = useState<number>(50);
  const [smartAdvice, setSmartAdvice] = useState<{advice: string, prob: number} | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    const channel = supabase
      .channel('passenger-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
        const { title, message, target } = payload.new;
        if (target === 'ALL' || target === 'PASSENGERS') {
            setActivePush({ title, message });
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
      if ((email === 'pasajero' || email === 'demo') && password === '123_pasajero') {
          setTimeout(() => {
              setIsAuthenticated(true);
              setUserId('mock-passenger-id');
              setLoading(false);
          }, 800);
          return;
      }
      try {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;
          if (data.user) {
              setUserId(data.user.id);
              setIsAuthenticated(true);
          }
      } catch (error: any) { alert("Error: " + error.message); } finally { setLoading(false); }
  };

  const handleRequestRide = () => {
      if (!destination) return alert("Por favor indica un destino.");
      setStatus(RideStatus.REQUESTING);
      // Simular llegada de ofertas
      setTimeout(() => {
          setAvailableOffers(MOCK_OFFERS);
      }, 2000);
  };

  const handleAcceptOffer = (offer: DriverOffer) => {
      setSelectedDriver(offer);
      setStatus(RideStatus.ACCEPTED);
      // Simular llegada del conductor
      setTimeout(() => setStatus(RideStatus.ARRIVED), 5000);
  };

  if (!isAuthenticated) {
    return (
        <div className="w-full h-full bg-zippy-main flex items-center justify-center p-6 animate-fade-in">
           <div className="w-full max-w-sm bg-white rounded-[40px] shadow-2xl p-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-zippy-dark/10"></div>
              <img src="https://tritex.com.mx/zippylogo.png" className="h-12 mx-auto mb-8" />
              <h2 className="text-center font-black text-zippy-dark text-xl mb-6 uppercase tracking-widest">Pasajero</h2>
              
              <form onSubmit={handleAuth} className="space-y-4">
                  <input required placeholder="Usuario (demo)" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-zippy-main font-bold" value={email} onChange={e=>setEmail(e.target.value)} />
                  <div className="relative">
                      <input required type={showPassword ? "text" : "password"} placeholder="Contraseña (123_pasajero)" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-zippy-main font-bold" value={password} onChange={e=>setPassword(e.target.value)} />
                      <button type="button" onClick={()=>setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                  </div>
                  <button className="w-full bg-zippy-dark text-white font-black py-4 rounded-2xl shadow-xl hover:scale-[1.02] transition-transform flex items-center justify-center gap-2">
                      {loading ? <Loader2 className="animate-spin" /> : 'INGRESAR A ZIPPY'}
                  </button>
                  <button type="button" onClick={onBack} className="w-full text-[10px] font-black text-gray-400 uppercase tracking-widest mt-4">Volver al Inicio</button>
              </form>
           </div>
        </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-gray-100 overflow-hidden flex flex-col font-sans">
      <MapVisual status={status} />

      {/* PUSH ALERT */}
      {activePush && (
          <div className="fixed inset-0 z-[500] bg-zippy-dark/90 backdrop-blur-xl p-8 flex items-center justify-center animate-fade-in">
              <div className="bg-white w-full max-w-sm rounded-[40px] p-8 shadow-2xl relative border-4 border-zippy-main text-center">
                  <h3 className="text-2xl font-black text-zippy-dark mb-4">{activePush.title}</h3>
                  <p className="text-gray-500 font-bold leading-relaxed mb-8">{activePush.message}</p>
                  <button onClick={() => setActivePush(null)} className="w-full bg-zippy-dark text-white font-black py-5 rounded-3xl shadow-xl">ENTENDIDO</button>
              </div>
          </div>
      )}

      {/* NAVBAR */}
      <div className="absolute top-0 left-0 right-0 p-4 z-30 flex justify-between items-center">
        <button onClick={() => setDrawerOpen(true)} className="p-4 bg-white shadow-xl rounded-2xl text-zippy-dark active:scale-90 transition-transform"><Menu size={24}/></button>
        <button onClick={() => setAssistantOpen(true)} className="p-4 bg-zippy-dark text-zippy-accent shadow-xl rounded-2xl animate-pulse"><MessageSquare size={24}/></button>
      </div>

      {/* BOTTOM PANELS */}
      <div className="absolute inset-x-0 bottom-0 z-30 pointer-events-none p-4 max-h-[70vh] flex flex-col overflow-hidden">
          
          {/* IDLE: Pedir viaje */}
          {status === RideStatus.IDLE && (
              <div className="pointer-events-auto bg-white rounded-[40px] p-8 shadow-2xl border border-gray-100 animate-slide-up">
                  <h2 className="text-2xl font-black text-zippy-dark mb-6 tracking-tight">¿A dónde <span className="text-zippy-main">vamos?</span></h2>
                  <div className="space-y-4 mb-6">
                      <div className="bg-gray-50 p-4 rounded-2xl flex items-center gap-4 border border-gray-100">
                          <MapPin size={20} className="text-green-500" />
                          <input type="text" value={pickup} onChange={e=>setPickup(e.target.value)} placeholder="¿Dónde te recogemos?" className="bg-transparent w-full font-bold outline-none text-zippy-dark" />
                      </div>
                      <div className="bg-gray-50 p-4 rounded-2xl flex items-center gap-4 border border-gray-100 focus-within:border-zippy-main">
                          <Navigation size={20} className="text-red-500" />
                          <input type="text" value={destination} onChange={e=>setDestination(e.target.value)} placeholder="¿A dónde vas?" className="bg-transparent w-full font-bold outline-none text-zippy-dark" />
                      </div>
                  </div>

                  <div className="flex items-center justify-between mb-6 bg-gray-50 p-4 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-black text-zippy-dark">$</span>
                        <input type="number" value={calculatedPrice} onChange={e=>setCalculatedPrice(Number(e.target.value))} className="bg-transparent text-2xl font-black text-zippy-dark outline-none w-20" />
                      </div>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tu Oferta</span>
                  </div>

                  <button onClick={handleRequestRide} className="w-full bg-zippy-dark text-white font-black py-5 rounded-[24px] text-lg shadow-2xl active:scale-95 transition-all">
                      ENCONTRAR ZIPPY
                  </button>
              </div>
          )}

          {/* REQUESTING: Ver ofertas */}
          {status === RideStatus.REQUESTING && (
              <div className="pointer-events-auto bg-white rounded-t-[40px] p-6 shadow-2xl flex-1 flex flex-col overflow-hidden animate-slide-up">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-black text-zippy-dark uppercase tracking-tight">Conductores Cerca</h3>
                      <button onClick={()=>setStatus(RideStatus.IDLE)} className="p-2 text-gray-400"><X size={20}/></button>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                      <OffersList 
                          offers={availableOffers} 
                          onAccept={handleAcceptOffer} 
                          onDecline={(id) => setAvailableOffers(prev => prev.filter(o => o.id !== id))}
                      />
                  </div>
              </div>
          )}

          {/* ACCEPTED / ARRIVED: Viaje activo */}
          {(status === RideStatus.ACCEPTED || status === RideStatus.ARRIVED) && selectedDriver && (
              <div className="pointer-events-auto bg-white rounded-[40px] p-8 shadow-2xl border border-zippy-main animate-slide-up">
                  <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-2xl bg-zippy-main overflow-hidden border-2 border-zippy-dark">
                              <img src={selectedDriver.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                          </div>
                          <div>
                              <h4 className="font-black text-zippy-dark text-xl">{selectedDriver.name}</h4>
                              <p className="text-xs font-black text-gray-400 uppercase">{selectedDriver.carModel} • {selectedDriver.carPlate}</p>
                          </div>
                      </div>
                      <div className="text-right">
                          <p className="text-2xl font-black text-zippy-dark leading-none">${selectedDriver.price}</p>
                          <p className="text-[10px] font-black text-zippy-main uppercase tracking-widest mt-1">Efectivo</p>
                      </div>
                  </div>
                  <div className={`p-4 rounded-2xl text-center font-black uppercase tracking-widest text-sm mb-4 ${status === RideStatus.ARRIVED ? 'bg-zippy-main text-zippy-dark animate-pulse' : 'bg-zippy-dark text-white'}`}>
                      {status === RideStatus.ARRIVED ? '¡TU ZIPPY HA LLEGADO!' : `LLEGA EN ${selectedDriver.eta} MINUTOS`}
                  </div>
                  <div className="flex gap-2">
                      <button className="flex-1 bg-gray-100 text-zippy-dark font-black py-4 rounded-2xl">MENSAJE</button>
                      <button onClick={() => setStatus(RideStatus.IDLE)} className="flex-1 bg-red-50 text-red-600 font-black py-4 rounded-2xl">CANCELAR</button>
                  </div>
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
