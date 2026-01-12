
import React, { useState, useEffect } from 'react';
import { 
  Menu, Navigation, MessageSquare, ShieldCheck, MapPin, Loader2, Calendar, Clock, Lock, 
  Eye, EyeOff, Star, BellRing, X, ChevronRight, Check, History, CreditCard, User, 
  ArrowLeft, Save, Plus, Wallet, TrendingUp, Truck, Wrench, Siren, Disc, Briefcase,
  HeartPulse, LogOut
} from 'lucide-react';
import { RideStatus, DriverOffer, Ride } from '../types';
import MapVisual from './MapVisual';
import Drawer from './Drawer';
import AssistantModal from './AssistantModal';
import EmergencyDirectory from './EmergencyDirectory';
import OffersList from './OffersList';
import DriverRegistration from './DriverRegistration'; 
import { supabase } from '../services/supabase';
import { getSmartPriceAdvice } from '../services/geminiService';

interface PassengerAppProps {
  onBack: () => void;
}

const PassengerApp: React.FC<PassengerAppProps> = ({ onBack }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'home' | 'profile' | 'history' | 'payment' | 'services'>('home');
  const [status, setStatus] = useState<RideStatus>(RideStatus.IDLE);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [driverRegOpen, setDriverRegOpen] = useState(false); 
  
  const [activePush, setActivePush] = useState<{title: string, message: string} | null>(null);
  const [availableOffers, setAvailableOffers] = useState<DriverOffer[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<DriverOffer | null>(null);
  const [activeRideId, setActiveRideId] = useState<string | null>(null);

  const [userProfile, setUserProfile] = useState({
      id: 'demo-user-id',
      name: 'Pasajero de Prueba',
      email: 'demo@zippy.mx',
      phone: '951 123 4567',
      cardName: 'DEMO USER',
      cardNumber: '**** **** **** 4455',
      cardExpiry: '12/28',
      cardCvv: '***'
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [pickup, setPickup] = useState('Mi ubicación actual');
  const [destination, setDestination] = useState('');
  const [calculatedPrice, setCalculatedPrice] = useState<number>(50);
  const [smartAdvice, setSmartAdvice] = useState<{advice: string, prob: number} | null>(null);

  // REALTIME OFFERS SUBSCRIPTION
  useEffect(() => {
    if (!activeRideId) return;

    const channel = supabase
      .channel(`ride-offers-${activeRideId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'ride_offers',
        filter: `ride_id=eq.${activeRideId}` 
      }, (payload) => {
        const newOffer = payload.new as any;
        const mappedOffer: DriverOffer = {
          id: newOffer.id,
          name: newOffer.driver_name || 'Conductor Zippy',
          rating: newOffer.driver_rating || 5.0,
          carModel: newOffer.car_model || 'Vehículo Zippy',
          carPlate: newOffer.car_plate || 'S/N',
          taxiNumber: newOffer.taxi_number || '0000',
          price: newOffer.offered_price,
          eta: newOffer.eta || 5,
          avatarUrl: newOffer.avatar_url || `https://ui-avatars.com/api/?name=C&background=random`,
          distance: newOffer.distance || 1.0,
          tripsCompleted: newOffer.trips_completed || 100
        };
        setAvailableOffers(prev => [mappedOffer, ...prev]);
        if ("vibrate" in navigator) navigator.vibrate(200);
      })
      .subscribe();

    const statusChannel = supabase
      .channel(`ride-status-${activeRideId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'rides',
        filter: `id=eq.${activeRideId}`
      }, (payload) => {
        const updatedRide = payload.new as Ride;
        if (updatedRide.status === RideStatus.ARRIVED) {
           setStatus(RideStatus.ARRIVED);
        } else if (updatedRide.status === RideStatus.IN_PROGRESS) {
           setStatus(RideStatus.IN_PROGRESS);
        } else if (updatedRide.status === RideStatus.COMPLETED) {
           setStatus(RideStatus.IDLE);
           alert("¡Has llegado a tu destino!");
        }
      })
      .subscribe();

    return () => { 
      supabase.removeChannel(channel); 
      supabase.removeChannel(statusChannel);
    };
  }, [activeRideId]);

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
          setTimeout(() => { setIsAuthenticated(true); setLoading(false); }, 800);
          return;
      }
      try {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;
          if (data.user) {
              setIsAuthenticated(true);
              setUserProfile(prev => ({ ...prev, id: data.user.id }));
          }
      } catch (error: any) { alert("Error: " + error.message); } finally { setLoading(false); }
  };

  const handleRequestRide = async () => {
      if (!destination) return alert("Por favor indica un destino.");
      setLoading(true);
      setStatus(RideStatus.REQUESTING);
      setAvailableOffers([]);
      
      try {
          const { data, error } = await supabase.from('rides').insert({
              passenger_id: userProfile.id,
              pickup_label: pickup,
              destination_label: destination,
              price: calculatedPrice,
              status: RideStatus.REQUESTING
          }).select().single();

          if (error) throw error;
          setActiveRideId(data.id);
      } catch (err: any) {
          console.error("DB Error:", err);
          // Fallback Mocks if DB fails or tables don't exist yet
          setTimeout(() => {
              setAvailableOffers([
                { id: 'd1', name: 'Roberto Gómez', rating: 4.9, carModel: 'Nissan Tsuru', carPlate: 'TX-102', taxiNumber: '0842', price: calculatedPrice, eta: 3, avatarUrl: 'https://ui-avatars.com/api/?name=Roberto+Gomez&background=003A70&color=fff', distance: 0.8, tripsCompleted: 1250 }
              ]);
          }, 2000);
      } finally {
          setLoading(false);
      }
  };

  const handleAcceptOffer = async (offer: DriverOffer) => {
      setSelectedDriver(offer);
      setLoading(true);
      try {
          if (activeRideId) {
              const { error } = await supabase.from('rides').update({
                  driver_id: offer.driver_id || offer.id,
                  status: RideStatus.ACCEPTED,
                  price: offer.price
              }).eq('id', activeRideId);
              if (error) throw error;
          }
          setStatus(RideStatus.ACCEPTED);
      } catch (err: any) {
          console.error("Error accepting offer:", err);
          setStatus(RideStatus.ACCEPTED);
      } finally {
          setLoading(false);
      }
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
           <div className="w-full max-sm bg-white rounded-[40px] shadow-2xl p-8 relative overflow-hidden">
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

  const renderProfile = () => (
      <div className="absolute inset-0 bg-gray-50 z-40 flex flex-col animate-fade-in overflow-y-auto">
          <header className="p-6 bg-white shadow-sm flex items-center gap-4">
              <button onClick={() => setView('home')} className="p-3 bg-gray-100 rounded-2xl text-zippy-dark"><ArrowLeft size={20}/></button>
              <h1 className="text-xl font-black text-zippy-dark uppercase tracking-tight">Mi Perfil</h1>
              <button onClick={onBack} className="ml-auto p-3 text-red-500 bg-red-50 rounded-2xl"><LogOut size={20}/></button>
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
                  {isEditingProfile && (
                      <button onClick={handleSaveProfile} className="w-full bg-zippy-dark text-white font-black py-4 rounded-2xl shadow-xl mt-4">GUARDAR CAMBIOS</button>
                  )}
              </div>
          </div>
      </div>
  );

  const renderHistory = () => (
      <div className="absolute inset-0 bg-gray-50 z-40 flex flex-col animate-fade-in overflow-y-auto">
          <header className="p-6 bg-white shadow-sm flex items-center gap-4">
              <button onClick={() => setView('home')} className="p-3 bg-gray-100 rounded-2xl text-zippy-dark"><ArrowLeft size={20}/></button>
              <h1 className="text-xl font-black text-zippy-dark uppercase tracking-tight">Mis Viajes</h1>
          </header>
          <div className="p-6 space-y-4 text-center">
              <p className="text-gray-400 font-bold py-10">Cargando historial real...</p>
          </div>
      </div>
  );

  return (
    <div className="relative w-full h-full bg-gray-100 overflow-hidden flex flex-col font-sans">
      <MapVisual status={status} />

      {view === 'profile' && renderProfile()}
      {view === 'history' && renderHistory()}
      {view === 'payment' && (<div>Payment View Mock</div>)}
      {view === 'services' && (<div>Services View Mock</div>)}

      {activePush && (
          <div className="fixed inset-0 z-[500] bg-zippy-dark/90 backdrop-blur-xl p-8 flex items-center justify-center animate-fade-in">
              <div className="bg-white w-full max-w-sm rounded-[40px] p-8 shadow-2xl relative border-4 border-zippy-main text-center">
                  <h3 className="text-2xl font-black text-zippy-dark mb-4">{activePush.title}</h3>
                  <p className="text-gray-500 font-bold leading-relaxed mb-8">{activePush.message}</p>
                  <button onClick={() => setActivePush(null)} className="w-full bg-zippy-dark text-white font-black py-5 rounded-3xl shadow-xl">ENTENDIDO</button>
              </div>
          </div>
      )}

      {view === 'home' && (
          <div className="absolute top-0 left-0 right-0 p-4 z-30 flex justify-between items-center">
            <button onClick={() => setDrawerOpen(true)} className="p-4 bg-white shadow-xl rounded-2xl text-zippy-dark active:scale-90 transition-transform"><Menu size={24}/></button>
            <div className="flex gap-2">
                <button onClick={onBack} className="p-4 bg-white shadow-xl rounded-2xl text-red-500 active:scale-90 transition-transform"><LogOut size={24}/></button>
                <button onClick={() => setAssistantOpen(true)} className="p-4 bg-zippy-dark text-zippy-accent shadow-xl rounded-2xl animate-pulse"><MessageSquare size={24}/></button>
            </div>
          </div>
      )}

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
                      <button onClick={handleRequestRide} disabled={loading} className="w-full bg-zippy-dark text-white font-black py-5 rounded-[24px] text-lg shadow-2xl active:scale-95 transition-all flex justify-center items-center gap-2">
                          {loading ? <Loader2 className="animate-spin" /> : 'ENCONTRAR ZIPPY'}
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

              {(status === RideStatus.ACCEPTED || status === RideStatus.ARRIVED || status === RideStatus.IN_PROGRESS) && selectedDriver && (
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
                      <div className={`p-4 rounded-2xl text-center font-black uppercase tracking-widest text-sm mb-4 ${status === RideStatus.ARRIVED ? 'bg-zippy-main text-zippy-dark animate-pulse' : status === RideStatus.IN_PROGRESS ? 'bg-zippy-dark text-zippy-accent' : 'bg-zippy-dark text-white'}`}>
                          {status === RideStatus.ARRIVED ? '¡TU ZIPPY HA LLEGADO!' : status === RideStatus.IN_PROGRESS ? 'VIAJE EN CURSO' : `LLEGA EN ${selectedDriver.eta} MINUTOS`}
                      </div>
                      <div className="flex gap-2">
                          <button className="flex-1 bg-gray-100 text-zippy-dark font-black py-4 rounded-2xl">MENSAJE</button>
                          <button onClick={() => setStatus(RideStatus.IDLE)} className="flex-1 bg-red-50 text-red-600 font-black py-4 rounded-2xl">CANCELAR</button>
                      </div>
                  </div>
              )}
          </div>
      )}

      <Drawer 
        isOpen={drawerOpen} 
        onClose={()=>setDrawerOpen(false)} 
        onLogout={onBack} 
        currentView={view} 
        onChangeView={setView} 
        onOpenEmergency={()=>setEmergencyOpen(true)} 
        onOpenDriverReg={()=>setDriverRegOpen(true)}
        userName={userProfile.name} 
      />
      <AssistantModal isOpen={assistantOpen} onClose={()=>setAssistantOpen(false)} />
      <EmergencyDirectory isOpen={emergencyOpen} onClose={()=>setEmergencyOpen(false)} />
      <DriverRegistration isOpen={driverRegOpen} onClose={()=>setDriverRegOpen(false)} userId={userProfile.id} />
    </div>
  );
};

export default PassengerApp;
