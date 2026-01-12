
import React, { useState, useEffect } from 'react';
import { 
  Menu, Navigation, MessageSquare, ShieldCheck, MapPin, Loader2, Calendar, Clock, Lock, 
  Eye, EyeOff, Star, BellRing, X, ChevronRight, Check, History, CreditCard, User, 
  ArrowLeft, Save, Plus, Wallet, TrendingUp, Truck, Wrench, Siren, Disc, Briefcase,
  // Added HeartPulse to fix the missing name error
  HeartPulse
} from 'lucide-react';
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

const MOCK_HISTORY = [
    { id: 'h1', date: 'Hoy, 10:30 AM', from: 'Casa', to: 'Plaza Cristal', price: 45, driver: 'Roberto G.', rating: 5 },
    { id: 'h2', date: 'Ayer, 08:15 PM', from: 'Gimnasio', to: 'Casa', price: 55, driver: 'Elena R.', rating: 4 },
    { id: 'h3', date: '12 May, 03:20 PM', from: 'Trabajo', to: 'Centro', price: 35, driver: 'Juan P.', rating: 5 },
];

const MOCK_WALLET = [
    { id: 'w1', type: 'charge', desc: 'Recarga OXXO Pay', amount: 500, date: '14 May' },
    { id: 'w2', type: 'payment', desc: 'Viaje a Plaza Cristal', amount: -45, date: '14 May' },
    { id: 'w3', type: 'payment', desc: 'Viaje a Centro', amount: -35, date: '12 May' },
];

const PassengerApp: React.FC<PassengerAppProps> = ({ onBack }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'home' | 'profile' | 'history' | 'payment' | 'services'>('home');
  const [status, setStatus] = useState<RideStatus>(RideStatus.IDLE);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  
  const [activePush, setActivePush] = useState<{title: string, message: string} | null>(null);
  const [availableOffers, setAvailableOffers] = useState<DriverOffer[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<DriverOffer | null>(null);

  // Perfil State
  const [userProfile, setUserProfile] = useState({
      name: 'Pasajero de Prueba',
      email: 'demo@zippy.mx',
      phone: '951 123 4567',
      cardName: 'DEMO USER',
      cardNumber: '**** **** **** 4455',
      cardExpiry: '12/28',
      cardCvv: '***'
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
              setLoading(false);
          }, 800);
          return;
      }
      try {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;
          if (data.user) {
              setIsAuthenticated(true);
          }
      } catch (error: any) { alert("Error: " + error.message); } finally { setLoading(false); }
  };

  const handleRequestRide = () => {
      if (!destination) return alert("Por favor indica un destino.");
      setStatus(RideStatus.REQUESTING);
      setTimeout(() => {
          setAvailableOffers(MOCK_OFFERS);
      }, 2000);
  };

  const handleAcceptOffer = (offer: DriverOffer) => {
      setSelectedDriver(offer);
      setStatus(RideStatus.ACCEPTED);
      setTimeout(() => setStatus(RideStatus.ARRIVED), 5000);
  };

  const handleSaveProfile = () => {
      setLoading(true);
      setTimeout(() => {
          setIsEditingProfile(false);
          setLoading(false);
          alert("Perfil actualizado correctamente");
      }, 1000);
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

  // --- RENDERING SUB-VIEWS ---

  const renderProfile = () => (
      <div className="absolute inset-0 bg-gray-50 z-40 flex flex-col animate-fade-in overflow-y-auto">
          <header className="p-6 bg-white shadow-sm flex items-center gap-4">
              <button onClick={() => setView('home')} className="p-3 bg-gray-100 rounded-2xl text-zippy-dark"><ArrowLeft size={20}/></button>
              <h1 className="text-xl font-black text-zippy-dark uppercase tracking-tight">Mi Perfil</h1>
          </header>
          
          <div className="p-6 space-y-6 pb-24">
              <div className="flex flex-col items-center">
                  <div className="w-32 h-32 bg-zippy-main rounded-[40px] p-1 shadow-xl border-4 border-white mb-4 relative">
                      <img src={`https://ui-avatars.com/api/?name=${userProfile.name}&background=random`} alt="Avatar" className="w-full h-full object-cover rounded-[36px]" />
                      <button className="absolute bottom-0 right-0 p-3 bg-zippy-dark text-white rounded-2xl shadow-lg"><Plus size={16}/></button>
                  </div>
                  <h3 className="text-xl font-black text-zippy-dark">{userProfile.name}</h3>
                  <p className="text-[10px] font-black text-zippy-main uppercase tracking-widest">Miembro desde May 2024</p>
              </div>

              <div className="bg-white rounded-[32px] p-6 shadow-sm space-y-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Datos Personales</h4>
                    <button onClick={() => setIsEditingProfile(!isEditingProfile)} className="text-zippy-dark font-black text-xs uppercase underline">
                        {isEditingProfile ? 'Cancelar' : 'Editar'}
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                      <div>
                          <label className="text-[9px] font-black text-gray-400 uppercase tracking-tighter mb-1 block ml-2">Nombre Completo</label>
                          <input disabled={!isEditingProfile} value={userProfile.name} onChange={e=>setUserProfile({...userProfile, name: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-zippy-dark outline-none focus:border-zippy-main border border-transparent" />
                      </div>
                      <div>
                          <label className="text-[9px] font-black text-gray-400 uppercase tracking-tighter mb-1 block ml-2">Correo Electrónico</label>
                          <input disabled={!isEditingProfile} value={userProfile.email} onChange={e=>setUserProfile({...userProfile, email: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-zippy-dark outline-none" />
                      </div>
                      <div>
                          <label className="text-[9px] font-black text-gray-400 uppercase tracking-tighter mb-1 block ml-2">Teléfono</label>
                          <input disabled={!isEditingProfile} value={userProfile.phone} onChange={e=>setUserProfile({...userProfile, phone: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-zippy-dark outline-none" />
                      </div>
                  </div>
              </div>

              <div className="bg-zippy-dark rounded-[32px] p-6 shadow-xl text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 opacity-10"><CreditCard size={150} /></div>
                  <h4 className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-6">Tarjeta Predeterminada</h4>
                  <div className="space-y-6 relative z-10">
                      <p className="text-xl font-bold tracking-[4px]">{userProfile.cardNumber}</p>
                      <div className="flex justify-between items-end">
                          <div>
                              <p className="text-[8px] font-black text-white/40 uppercase">Titular</p>
                              <p className="text-sm font-bold uppercase">{userProfile.cardName}</p>
                          </div>
                          <div className="text-right">
                              <p className="text-[8px] font-black text-white/40 uppercase">Expira</p>
                              <p className="text-sm font-bold">{userProfile.cardExpiry}</p>
                          </div>
                      </div>
                  </div>
              </div>

              {isEditingProfile && (
                  <button onClick={handleSaveProfile} className="w-full bg-zippy-main text-zippy-dark font-black py-5 rounded-[24px] shadow-xl flex items-center justify-center gap-2">
                      {loading ? <Loader2 className="animate-spin" /> : <Save size={20}/>}
                      GUARDAR CAMBIOS
                  </button>
              )}
          </div>
      </div>
  );

  const renderHistory = () => (
      <div className="absolute inset-0 bg-gray-50 z-40 flex flex-col animate-fade-in overflow-y-auto">
          <header className="p-6 bg-white shadow-sm flex items-center gap-4">
              <button onClick={() => setView('home')} className="p-3 bg-gray-100 rounded-2xl text-zippy-dark"><ArrowLeft size={20}/></button>
              <h1 className="text-xl font-black text-zippy-dark uppercase tracking-tight">Mis Viajes</h1>
          </header>
          <div className="p-6 space-y-4">
              {MOCK_HISTORY.map(ride => (
                  <div key={ride.id} className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                          <div>
                              <p className="text-[10px] font-black text-zippy-main uppercase tracking-widest">{ride.date}</p>
                              <h4 className="font-black text-zippy-dark text-lg">${ride.price}</h4>
                          </div>
                          <div className="flex items-center gap-1 text-yellow-500">
                              <Star size={14} fill="currentColor" />
                              <span className="text-xs font-black">{ride.rating}</span>
                          </div>
                      </div>
                      <div className="space-y-2 border-l-2 border-dashed border-gray-100 ml-2 pl-4 py-1">
                          <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <p className="text-xs font-bold text-gray-500">{ride.from}</p>
                          </div>
                          <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              <p className="text-xs font-bold text-zippy-dark">{ride.to}</p>
                          </div>
                      </div>
                      <div className="flex items-center gap-3 pt-2 border-t border-gray-50">
                          <img src={`https://ui-avatars.com/api/?name=${ride.driver}`} className="w-8 h-8 rounded-full" />
                          <p className="text-xs font-black text-gray-400">Conducido por <span className="text-zippy-dark">{ride.driver}</span></p>
                      </div>
                  </div>
              ))}
          </div>
      </div>
  );

  const renderPayment = () => (
      <div className="absolute inset-0 bg-gray-50 z-40 flex flex-col animate-fade-in overflow-y-auto">
          <header className="p-6 bg-white shadow-sm flex items-center gap-4">
              <button onClick={() => setView('home')} className="p-3 bg-gray-100 rounded-2xl text-zippy-dark"><ArrowLeft size={20}/></button>
              <h1 className="text-xl font-black text-zippy-dark uppercase tracking-tight">Billetera</h1>
          </header>
          
          <div className="p-6 space-y-6">
              <div className="bg-zippy-main p-8 rounded-[40px] shadow-2xl relative overflow-hidden">
                  <div className="absolute -bottom-10 -right-10 opacity-10"><Wallet size={180} /></div>
                  <p className="text-[10px] font-black text-zippy-dark/50 uppercase tracking-[0.2em] mb-2">Zippy Cash</p>
                  <h2 className="text-5xl font-black text-zippy-dark mb-8">$1,245.00</h2>
                  <div className="flex gap-3">
                      <button className="flex-1 bg-zippy-dark text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg">
                          <Plus size={18} /> RECARGAR
                      </button>
                      <button className="p-4 bg-white/30 backdrop-blur-md rounded-2xl text-zippy-dark"><TrendingUp size={24}/></button>
                  </div>
              </div>

              <div>
                  <h3 className="text-xs font-black text-zippy-dark uppercase tracking-widest mb-4 ml-2">Movimientos Recientes</h3>
                  <div className="space-y-2">
                      {MOCK_WALLET.map(tx => (
                          <div key={tx.id} className="bg-white p-4 rounded-2xl shadow-sm flex items-center justify-between border border-gray-50">
                              <div className="flex items-center gap-3">
                                  <div className={`p-3 rounded-xl ${tx.type === 'charge' ? 'bg-green-100 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                      {tx.type === 'charge' ? <Plus size={18}/> : <ArrowLeft size={18} className="rotate-180"/>}
                                  </div>
                                  <div>
                                      <p className="text-sm font-black text-zippy-dark">{tx.desc}</p>
                                      <p className="text-[10px] font-bold text-gray-400">{tx.date}</p>
                                  </div>
                              </div>
                              <span className={`font-black ${tx.type === 'charge' ? 'text-green-500' : 'text-red-500'}`}>
                                  {tx.type === 'charge' ? '+' : ''}${Math.abs(tx.amount)}
                              </span>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      </div>
  );

  const renderServices = () => (
      <div className="absolute inset-0 bg-gray-50 z-40 flex flex-col animate-fade-in overflow-y-auto">
          <header className="p-6 bg-white shadow-sm flex items-center gap-4">
              <button onClick={() => setView('home')} className="p-3 bg-gray-100 rounded-2xl text-zippy-dark"><ArrowLeft size={20}/></button>
              <h1 className="text-xl font-black text-zippy-dark uppercase tracking-tight">Asistencia</h1>
          </header>
          
          <div className="p-6 space-y-8">
              <div className="grid grid-cols-2 gap-4">
                  {[
                      { id: 'grua', icon: Truck, label: 'Grúas', color: 'bg-orange-500' },
                      { id: 'mecanico', icon: Wrench, label: 'Taller', color: 'bg-blue-600' },
                      { id: 'ambulancia', icon: HeartPulse, label: 'Salud', color: 'bg-red-600' },
                      { id: 'seguro', icon: ShieldCheck, label: 'Seguro', color: 'bg-green-600' },
                  ].map(s => (
                      <button key={s.id} className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 flex flex-col items-center gap-3 active:scale-95 transition-all">
                          <div className={`p-4 rounded-2xl ${s.color} text-white shadow-lg`}><s.icon size={28}/></div>
                          <span className="text-xs font-black text-zippy-dark uppercase tracking-widest">{s.label}</span>
                      </button>
                  ))}
              </div>

              <div>
                  <h3 className="text-xs font-black text-zippy-dark uppercase tracking-widest mb-4 ml-2">Proveedores Destacados</h3>
                  <div className="space-y-4">
                      {[
                          { name: 'Grúas El Rayo', type: 'Servicio 24h', rating: 4.9, dist: '2.5 km' },
                          { name: 'Mecánica Express', type: 'Especialista', rating: 4.7, dist: '4.1 km' },
                      ].map((p, i) => (
                          <div key={i} className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 flex justify-between items-center">
                              <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-zippy-dark"><Briefcase size={24}/></div>
                                  <div>
                                      <h4 className="font-black text-zippy-dark">{p.name}</h4>
                                      <p className="text-[10px] font-bold text-gray-400 uppercase">{p.type} • {p.dist}</p>
                                  </div>
                              </div>
                              <button className="p-3 bg-zippy-main rounded-2xl text-zippy-dark"><ChevronRight size={20}/></button>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      </div>
  );

  return (
    <div className="relative w-full h-full bg-gray-100 overflow-hidden flex flex-col font-sans">
      <MapVisual status={status} />

      {/* RENDER ACTIVE VIEW OVER MAP */}
      {view === 'profile' && renderProfile()}
      {view === 'history' && renderHistory()}
      {view === 'payment' && renderPayment()}
      {view === 'services' && renderServices()}

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
      {view === 'home' && (
          <div className="absolute top-0 left-0 right-0 p-4 z-30 flex justify-between items-center">
            <button onClick={() => setDrawerOpen(true)} className="p-4 bg-white shadow-xl rounded-2xl text-zippy-dark active:scale-90 transition-transform"><Menu size={24}/></button>
            <button onClick={() => setAssistantOpen(true)} className="p-4 bg-zippy-dark text-zippy-accent shadow-xl rounded-2xl animate-pulse"><MessageSquare size={24}/></button>
          </div>
      )}

      {/* BOTTOM PANELS (ONLY ON HOME) */}
      {view === 'home' && (
          <div className="absolute inset-x-0 bottom-0 z-30 pointer-events-none p-4 max-h-[70vh] flex flex-col overflow-hidden">
              
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
                          <div className="text-right">
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Tu Oferta</span>
                              {smartAdvice && <span className="text-[9px] font-bold text-zippy-main">{smartAdvice.advice}</span>}
                          </div>
                      </div>

                      <button onClick={handleRequestRide} className="w-full bg-zippy-dark text-white font-black py-5 rounded-[24px] text-lg shadow-2xl active:scale-95 transition-all">
                          ENCONTRAR ZIPPY
                      </button>
                  </div>
              )}

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
      )}

      <Drawer isOpen={drawerOpen} onClose={()=>setDrawerOpen(false)} onLogout={onBack} currentView={view} onChangeView={setView} onOpenEmergency={()=>setEmergencyOpen(true)} userName={userProfile.name} />
      <AssistantModal isOpen={assistantOpen} onClose={()=>setAssistantOpen(false)} />
      <EmergencyDirectory isOpen={emergencyOpen} onClose={()=>setEmergencyOpen(false)} />
    </div>
  );
};

export default PassengerApp;
