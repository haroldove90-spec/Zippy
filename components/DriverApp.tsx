
import React, { useState, useEffect } from 'react';
import { 
  Power, Map, Loader2, Star, BellRing, X, Navigation, CheckCircle, TrendingUp, 
  DollarSign, LogOut, Phone, MessageCircle, Navigation2, Minus, Plus, 
  User, History, Wallet, ChevronRight, Camera, Save, MapPin, Calendar, Clock,
  ArrowLeft, Mail, ShieldCheck, CreditCard, Filter
} from 'lucide-react';
import MapVisual from './MapVisual';
import { RideStatus, Ride } from '../types';
import { supabase } from '../services/supabase';

interface DriverAppProps {
  onBack: () => void;
}

const DriverApp: React.FC<DriverAppProps> = ({ onBack }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [view, setView] = useState<'home' | 'history' | 'profile' | 'wallet'>('home');
  const [rideStatus, setRideStatus] = useState<RideStatus>(RideStatus.IDLE);
  const [loading, setLoading] = useState(false);
  const [availableRides, setAvailableRides] = useState<Ride[]>([]);
  const [activeRide, setActiveRide] = useState<Ride | null>(null);
  
  // Negotiation & Profile States
  const [negotiationPrices, setNegotiationPrices] = useState<{[key: string]: number}>({});
  const [driverProfile, setDriverProfile] = useState({
      id: 'demo-driver-id',
      name: 'Roberto Gómez',
      email: 'roberto@zippy.mx',
      phone: '951 888 7766',
      rating: 4.9,
      carModel: 'Nissan Tsuru',
      carPlate: 'TX-102',
      carColor: 'Blanco / Amarillo',
      taxiNumber: '0842',
      tripsToday: 12,
      earningsToday: 1240,
      licenseStatus: 'Verificada'
  });
  const [isEditing, setIsEditing] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // REALTIME MARKETPLACE SUBSCRIPTION (LOGICA INTACTA)
  useEffect(() => {
    if (!isAuthenticated || !isOnline || view !== 'home') return;

    const fetchRides = async () => {
        const { data } = await supabase.from('rides').select('*').eq('status', RideStatus.REQUESTING);
        if (data) {
            setAvailableRides(data);
            const prices: {[key: string]: number} = {};
            data.forEach(r => prices[r.id] = r.price);
            setNegotiationPrices(prices);
        }
    };
    fetchRides();

    const channel = supabase
      .channel('public:rides')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'rides', filter: `status=eq.${RideStatus.REQUESTING}` }, (payload) => {
        const newRide = payload.new as Ride;
        setAvailableRides(prev => [newRide, ...prev]);
        setNegotiationPrices(prev => ({...prev, [newRide.id]: newRide.price}));
        if ("vibrate" in navigator) navigator.vibrate([200, 100, 200]);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rides' }, (payload) => {
        const updated = payload.new as Ride;
        if (updated.status !== RideStatus.REQUESTING) {
            setAvailableRides(prev => prev.filter(r => r.id !== updated.id));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isAuthenticated, isOnline, view]);

  const handleMakeOffer = async (ride: Ride) => {
      setLoading(true);
      const offeredPrice = negotiationPrices[ride.id] || ride.price;
      try {
          const { error } = await supabase.from('ride_offers').insert({
              ride_id: ride.id,
              driver_id: driverProfile.id,
              driver_name: driverProfile.name,
              car_model: driverProfile.carModel,
              car_plate: driverProfile.carPlate,
              taxi_number: driverProfile.taxiNumber,
              offered_price: offeredPrice,
              eta: 5
          });
          if (error) throw error;
          alert(`Oferta enviada por $${offeredPrice}. Esperando al pasajero...`);
      } catch (err: any) {
          alert("Error al enviar oferta: " + err.message);
      } finally {
          setLoading(false);
      }
  };

  const handleUpdateRideStatus = async (newStatus: RideStatus) => {
      if (!activeRide) return;
      try {
          await supabase.from('rides').update({ status: newStatus }).eq('id', activeRide.id);
          setRideStatus(newStatus);
          if (newStatus === RideStatus.IDLE) setActiveRide(null);
      } catch (err) { setRideStatus(newStatus); }
  };

  const adjustPrice = (rideId: string, amount: number) => {
    setNegotiationPrices(prev => ({ ...prev, [rideId]: Math.max((prev[rideId] || 0) + amount, 0) }));
  };

  const handleSaveProfile = () => {
    setLoading(true);
    setTimeout(() => {
      setIsEditing(false);
      setLoading(false);
      alert("Perfil actualizado correctamente");
    }, 1000);
  };

  // --- VIEWS ---

  const renderProfile = () => (
    <div className="absolute inset-0 bg-gray-50 z-40 flex flex-col animate-fade-in overflow-y-auto pb-24">
      <header className="p-6 bg-white shadow-sm flex items-center gap-4 sticky top-0 z-10">
          <button onClick={() => setView('home')} className="p-3 bg-gray-100 rounded-2xl text-zippy-dark"><ArrowLeft size={20}/></button>
          <h1 className="text-xl font-black text-zippy-dark uppercase tracking-tight flex-1">Mi Cuenta</h1>
          <button onClick={onBack} className="p-3 bg-red-50 text-red-500 rounded-2xl"><LogOut size={20}/></button>
      </header>
      
      <div className="p-6 space-y-6">
        <div className="flex flex-col items-center">
            <div className="w-28 h-28 bg-zippy-dark rounded-[36px] p-1 shadow-2xl relative mb-4">
                <img src={`https://ui-avatars.com/api/?name=${driverProfile.name}&background=003A70&color=fff`} className="w-full h-full rounded-[32px] object-cover" />
                <button className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-xl border-4 border-gray-50 shadow-md">
                    <Camera size={16}/>
                </button>
            </div>
            <h2 className="text-xl font-black text-zippy-dark">{driverProfile.name}</h2>
            <div className="flex items-center gap-1 text-white font-black text-[10px] uppercase bg-blue-700 px-4 py-2 rounded-full mt-2 shadow-sm">
                <Star size={12} className="fill-zippy-accent text-zippy-accent" /> {driverProfile.rating} • Conductor Zippy Pro
            </div>
        </div>

        <div className="bg-white rounded-[32px] p-6 shadow-sm space-y-6 border border-gray-100">
            <div className="flex justify-between items-center border-b pb-3">
                <div className="flex items-center gap-2">
                    <User size={18} className="text-zippy-dark" />
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Datos Editables</h4>
                </div>
                <button onClick={() => setIsEditing(!isEditing)} className="text-blue-700 text-xs font-black uppercase underline decoration-2">
                    {isEditing ? 'Cancelar' : 'Editar'}
                </button>
            </div>
            
            <div className="space-y-4">
                <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Nombre Completo</label>
                    <div className="relative">
                        <input 
                            disabled={!isEditing} 
                            value={driverProfile.name} 
                            onChange={e=>setDriverProfile({...driverProfile, name: e.target.value})} 
                            className={`w-full p-4 bg-gray-50 rounded-2xl font-bold border-2 outline-none transition-all ${isEditing ? 'border-blue-600/20 focus:border-blue-600' : 'border-transparent'}`} 
                        />
                    </div>
                </div>
                <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">WhatsApp / Celular</label>
                    <div className="relative">
                        <input 
                            disabled={!isEditing} 
                            value={driverProfile.phone} 
                            onChange={e=>setDriverProfile({...driverProfile, phone: e.target.value})} 
                            className={`w-full p-4 bg-gray-50 rounded-2xl font-bold border-2 outline-none transition-all ${isEditing ? 'border-blue-600/20 focus:border-blue-600' : 'border-transparent'}`} 
                        />
                    </div>
                </div>
                <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Correo Electrónico</label>
                    <div className="relative">
                        <input 
                            disabled={!isEditing} 
                            value={driverProfile.email} 
                            onChange={e=>setDriverProfile({...driverProfile, email: e.target.value})} 
                            className={`w-full p-4 bg-gray-50 rounded-2xl font-bold border-2 outline-none transition-all ${isEditing ? 'border-blue-600/20 focus:border-blue-600' : 'border-transparent'}`} 
                        />
                    </div>
                </div>
            </div>
        </div>

        <div className="bg-zippy-dark rounded-[32px] p-6 shadow-xl text-white space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <ShieldCheck size={80} />
            </div>
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                <ShieldCheck size={18} className="text-zippy-accent" />
                <h4 className="text-[10px] font-black text-white/60 uppercase tracking-widest">Datos del Vehículo y Certificación</h4>
            </div>
            <div className="grid grid-cols-2 gap-6">
                <div>
                    <p className="text-[9px] font-black text-white/40 uppercase mb-1">Modelo</p>
                    <p className="font-bold text-sm">{driverProfile.carModel}</p>
                </div>
                <div>
                    <p className="text-[9px] font-black text-white/40 uppercase mb-1">Placas</p>
                    <p className="font-bold text-sm">{driverProfile.carPlate}</p>
                </div>
                <div>
                    <p className="text-[9px] font-black text-white/40 uppercase mb-1">N. Económico</p>
                    <p className="font-bold text-sm">#{driverProfile.taxiNumber}</p>
                </div>
                <div>
                    <p className="text-[9px] font-black text-white/40 uppercase mb-1">Licencia</p>
                    <span className="text-[10px] font-black bg-white/10 px-2 py-1 rounded text-zippy-accent">{driverProfile.licenseStatus}</span>
                </div>
            </div>
        </div>
        
        {isEditing && (
          <button 
            onClick={handleSaveProfile} 
            disabled={loading} 
            className="w-full bg-blue-600 text-white font-black py-5 rounded-[24px] shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Save size={22} />} GUARDAR CAMBIOS
          </button>
        )}
      </div>
    </div>
  );

  const renderHistory = () => (
    <div className="absolute inset-0 bg-gray-50 z-40 flex flex-col animate-fade-in overflow-y-auto pb-24">
      <header className="p-6 bg-white shadow-sm flex items-center gap-4 sticky top-0 z-10">
          <button onClick={() => setView('home')} className="p-3 bg-gray-100 rounded-2xl text-zippy-dark"><ArrowLeft size={20}/></button>
          <h1 className="text-xl font-black text-zippy-dark uppercase tracking-tight">Historial de Viajes</h1>
      </header>
      
      <div className="p-6 space-y-4">
          <div className="bg-blue-900 p-8 rounded-[40px] shadow-2xl flex justify-between items-center mb-6 relative overflow-hidden">
              <div className="absolute -bottom-4 -right-4 text-white/5"><TrendingUp size={120} /></div>
              <div className="relative z-10">
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Balance General</p>
                  <p className="text-4xl font-black text-white leading-none tracking-tighter">$1,240.00</p>
                  <div className="flex items-center gap-2 mt-3">
                      <span className="text-[10px] font-black bg-blue-600/20 text-blue-100 px-2 py-1 rounded-full">+12 Viajes Hoy</span>
                  </div>
              </div>
              <div className="p-4 bg-white/10 rounded-3xl backdrop-blur-sm border border-white/10">
                  <TrendingUp size={32} className="text-zippy-accent" />
              </div>
          </div>

          <div className="flex justify-between items-center px-2">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Viajes Realizados</h3>
              <Filter size={16} className="text-gray-400" />
          </div>

          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 space-y-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-gray-50 rounded-xl">
                            <Calendar size={14} className="text-blue-700" />
                        </div>
                        <span className="text-xs font-bold text-gray-500">24 Mayo 2024 • 14:32</span>
                    </div>
                    <span className="text-lg font-black text-zippy-dark leading-none">${150 + item * 10}.00</span>
                </div>
                <div className="space-y-3 pl-2 border-l-2 border-dashed border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.4)]"></div>
                        <p className="text-[10px] font-black text-gray-400 truncate uppercase tracking-tight">Cruce de Av. Juárez y 5 de Mayo</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.4)]"></div>
                        <p className="text-[10px] font-black text-zippy-dark truncate uppercase tracking-tight">Colonia Residencial del Parque</p>
                    </div>
                </div>
                <div className="pt-4 border-t border-gray-50 flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 bg-green-50 rounded-full flex items-center justify-center">
                            <CheckCircle size={10} className="text-green-500" />
                        </div>
                        <span className="text-[9px] font-black text-green-600 uppercase">Cobrado</span>
                    </div>
                    <button className="text-[10px] font-black text-blue-700/50 hover:text-blue-700 uppercase flex items-center gap-1">
                        Detalles <ChevronRight size={12} />
                    </button>
                </div>
            </div>
          ))}
      </div>
    </div>
  );

  const renderWallet = () => (
    <div className="absolute inset-0 bg-gray-50 z-40 flex flex-col animate-fade-in overflow-y-auto pb-24">
      <header className="p-6 bg-white shadow-sm flex items-center gap-4 sticky top-0 z-10">
          <button onClick={() => setView('home')} className="p-3 bg-gray-100 rounded-2xl text-zippy-dark"><ArrowLeft size={20}/></button>
          <h1 className="text-xl font-black text-zippy-dark uppercase tracking-tight">Mi Billetera</h1>
      </header>
      <div className="p-8 flex flex-col items-center justify-center h-full text-center">
          <div className="w-28 h-28 bg-blue-900 rounded-[40px] flex items-center justify-center mb-6 shadow-2xl shadow-blue-900/20">
              <CreditCard size={48} className="text-zippy-accent" />
          </div>
          <h3 className="text-2xl font-black text-zippy-dark">Zippy Wallet</h3>
          <p className="text-gray-400 font-bold text-sm mt-3 leading-relaxed max-w-[240px]">Próximamente: Gestiona tus depósitos, retiros instantáneos y bonos de lealtad aquí.</p>
          <button className="mt-8 px-10 py-4 bg-gray-100 text-gray-400 font-black rounded-3xl text-xs uppercase tracking-widest cursor-not-allowed">Configurar CLABE</button>
      </div>
    </div>
  );

  if (!isAuthenticated) {
      return (
          <div className="w-full h-full bg-zippy-dark flex flex-col items-center justify-center p-6 animate-fade-in">
              <img src="https://tritex.com.mx/zippylogo.png" className="h-16 mb-12 filter invert" />
              <div className="bg-white p-10 rounded-[40px] w-full max-sm shadow-2xl relative">
                  <h2 className="text-2xl font-black text-center text-zippy-dark mb-8 uppercase tracking-widest">Conductor</h2>
                  <form onSubmit={(e) => { e.preventDefault(); setIsAuthenticated(true); }} className="space-y-5">
                      <input required placeholder="Usuario" className="w-full p-4 bg-gray-50 border rounded-2xl font-bold" value={email} onChange={e=>setEmail(e.target.value)} />
                      <input required type="password" placeholder="Contraseña" className="w-full p-4 bg-gray-50 border rounded-2xl font-bold" value={password} onChange={e=>setPassword(e.target.value)} />
                      <button className="w-full bg-blue-700 text-white font-black py-4 rounded-3xl shadow-xl active:scale-95 transition-all uppercase tracking-widest text-xs">Ingresar al Panel</button>
                      <button type="button" onClick={onBack} className="w-full text-[10px] font-black text-gray-400 uppercase tracking-widest text-center mt-2">Volver al Inicio</button>
                  </form>
              </div>
          </div>
      );
  }

  return (
    <div className="w-full h-full bg-gray-100 flex flex-col relative overflow-hidden font-sans">
        <MapVisual status={isOnline ? (rideStatus === RideStatus.IDLE ? 'ADMIN_HEATMAP' : rideStatus) : 'OFFLINE'} />

        {/* Dynamic Views Overlays */}
        {view === 'profile' && renderProfile()}
        {view === 'history' && renderHistory()}
        {view === 'wallet' && renderWallet()}

        {/* Global Header - Botones en Azul para máxima visibilidad */}
        <div className="absolute top-0 left-0 right-0 p-4 z-20 flex justify-between items-center bg-white/90 backdrop-blur-md border-b shadow-sm">
            <div className="flex items-center gap-3">
                <button 
                  onClick={() => setView('profile')} 
                  className="w-11 h-11 rounded-2xl overflow-hidden border-2 border-blue-700 shadow-lg active:scale-90 transition-transform"
                >
                    <img src={`https://ui-avatars.com/api/?name=${driverProfile.name}&background=003A70&color=fff`} className="w-full h-full object-cover" />
                </button>
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                        <span className="font-black text-[10px] text-zippy-dark uppercase tracking-tight">{isOnline ? 'En Turno' : 'Desconectado'}</span>
                    </div>
                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{driverProfile.taxiNumber}</span>
                </div>
            </div>
            
            <button 
                onClick={()=>setIsOnline(!isOnline)} 
                className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase transition-all shadow-xl active:scale-95 ${isOnline ? 'bg-red-600 text-white' : 'bg-blue-700 text-white'}`}
            >
                {isOnline ? 'Finalizar Turno' : 'Comenzar Turno'}
            </button>
        </div>

        {/* Main Content Area (Home) - Solicitudes de Viaje */}
        {isOnline && !activeRide && view === 'home' && (
            <div className="absolute top-24 left-4 right-4 z-20 flex flex-col gap-4 max-h-[60vh] overflow-y-auto pointer-events-none pb-10">
                <div className="mt-2 space-y-4 pointer-events-auto">
                    <div className="flex items-center justify-between bg-blue-900/95 backdrop-blur-md px-5 py-3 rounded-full shadow-2xl border border-white/10">
                        <h3 className="text-[9px] font-black text-white uppercase tracking-[0.2em]">Solicitudes Disponibles</h3>
                        <div className="w-2 h-2 bg-zippy-accent rounded-full animate-ping"></div>
                    </div>
                    
                    {availableRides.length === 0 ? (
                        <div className="bg-white/80 p-10 rounded-[40px] text-center backdrop-blur-md border border-gray-100 shadow-xl">
                            <Loader2 className="animate-spin text-blue-700 mx-auto mb-4" size={32} />
                            <p className="text-[10px] font-black text-zippy-dark uppercase tracking-widest leading-relaxed">Localizando pasajeros cerca de tu posición...</p>
                        </div>
                    ) : (
                        availableRides.map(ride => (
                            <div key={ride.id} className="bg-white p-6 rounded-[40px] shadow-2xl border border-gray-50 flex flex-col gap-4 animate-slide-up hover:border-blue-700/20 transition-all">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Precio Ofertado</p>
                                        <div className="flex items-center gap-3">
                                            <h4 className="font-black text-zippy-dark text-3xl tracking-tighter">${negotiationPrices[ride.id] || ride.price}</h4>
                                            {negotiationPrices[ride.id] !== ride.price && (
                                              <span className="text-xs font-bold text-gray-300 line-through decoration-red-400/50">${ride.price}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 px-3 py-2 rounded-2xl flex flex-col items-end">
                                        <div className="flex items-center text-[10px] font-black text-zippy-dark">
                                            <Star size={10} className="text-zippy-accent mr-1 fill-zippy-accent" /> 4.8
                                        </div>
                                        <span className="text-[8px] font-black text-gray-400 uppercase mt-0.5">Efectivo</span>
                                    </div>
                                </div>
                                
                                <div className="space-y-2 bg-gray-50/50 p-4 rounded-3xl border border-gray-50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                        <p className="text-[9px] font-bold text-gray-500 truncate uppercase tracking-tight">{ride.pickup_label}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                                        <p className="text-[9px] font-black text-zippy-dark truncate uppercase tracking-tight">{ride.destination_label}</p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    <button onClick={() => adjustPrice(ride.id, -5)} className="p-4 bg-gray-100 rounded-2xl text-blue-700 active:scale-90 transition-transform">
                                        <Minus size={20}/>
                                    </button>
                                    <div className="flex-1 flex gap-2">
                                        {[5, 10, 20].map(amt => (
                                          <button 
                                            key={amt} 
                                            onClick={() => adjustPrice(ride.id, amt)} 
                                            className="flex-1 py-4 bg-blue-600 text-white text-[10px] font-black rounded-2xl shadow-sm border border-blue-700 active:bg-blue-800 active:scale-95 transition-all"
                                          >
                                            +{amt}
                                          </button>
                                        ))}
                                    </div>
                                    <button onClick={() => adjustPrice(ride.id, 5)} className="p-4 bg-gray-100 rounded-2xl text-blue-700 active:scale-90 transition-transform">
                                        <Plus size={20}/>
                                    </button>
                                </div>

                                <button 
                                  onClick={() => handleMakeOffer(ride)} 
                                  className="w-full bg-blue-700 text-white font-black py-5 rounded-[28px] flex items-center justify-center gap-3 shadow-2xl shadow-blue-700/30 hover:scale-[1.02] active:scale-95 transition-all uppercase text-xs tracking-widest"
                                >
                                    <CheckCircle size={20} /> Enviar Contraoferta
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        )}

        {/* Bottom Navigation (Sticky at bottom) */}
        <div className="absolute bottom-0 inset-x-0 p-4 z-30 pointer-events-none">
            {isOnline && activeRide ? (
                /* Viaje Activo Controles - Botones en Azul */
                <div className="pointer-events-auto bg-white rounded-[40px] p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] border-4 border-blue-700 animate-slide-up">
                    <div className="flex justify-between items-center mb-6">
                        <div className="max-w-[70%]">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Viaje en Curso</p>
                            <h3 className="text-xl font-black text-zippy-dark leading-tight tracking-tight">{activeRide.destination_label}</h3>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-[9px] font-black bg-blue-700 text-white px-2 py-0.5 rounded-full uppercase">Pasajero VIP</span>
                                <span className="text-[9px] font-black text-gray-400 uppercase">4.8 ★</span>
                            </div>
                        </div>
                        <p className="text-4xl font-black text-zippy-dark tracking-tighter">${activeRide.price}</p>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3 mb-6">
                        <button 
                          onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(activeRide.destination_label)}`)} 
                          className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-[28px] text-blue-700 border border-gray-100 active:bg-blue-700 active:text-white transition-all"
                        >
                            <Navigation2 size={24} className="mb-1.5" />
                            <span className="text-[8px] font-black uppercase">Navegar</span>
                        </button>
                        <a 
                          href="tel:9511234567" 
                          className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-[28px] text-blue-700 border border-gray-100 active:bg-blue-700 active:text-white transition-all"
                        >
                            <Phone size={24} className="mb-1.5" />
                            <span className="text-[8px] font-black uppercase">Llamar</span>
                        </a>
                        <button className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-[28px] text-blue-700 border border-gray-100 active:bg-blue-700 active:text-white transition-all">
                            <MessageCircle size={24} className="mb-1.5" />
                            <span className="text-[8px] font-black uppercase">Chat</span>
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3">
                        {rideStatus === RideStatus.ACCEPTED && (
                            <button 
                                onClick={() => handleUpdateRideStatus(RideStatus.ARRIVED)} 
                                className="w-full bg-blue-700 text-white font-black py-5 rounded-[28px] shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all text-xs tracking-widest uppercase"
                            >
                                <MapPin size={20} /> Ya llegué al punto
                            </button>
                        )}
                        {rideStatus === RideStatus.ARRIVED && (
                            <button 
                                onClick={() => handleUpdateRideStatus(RideStatus.IN_PROGRESS)} 
                                className="w-full bg-blue-700 text-white font-black py-5 rounded-[28px] shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all text-xs tracking-widest uppercase ring-4 ring-blue-700/20"
                            >
                                <TrendingUp size={20} /> Iniciar Viaje
                            </button>
                        )}
                        {rideStatus === RideStatus.IN_PROGRESS && (
                            <button 
                                onClick={() => handleUpdateRideStatus(RideStatus.IDLE)} 
                                className="w-full bg-green-600 text-white font-black py-5 rounded-[28px] shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all text-xs tracking-widest uppercase"
                            >
                                <DollarSign size={20} /> Cobrar y Finalizar
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                /* Tab Bar Navigation - Fondo Azul Oscuro y Tabs en Azul Brillante */
                <div className="pointer-events-auto bg-blue-950/95 backdrop-blur-2xl rounded-[36px] p-2.5 flex items-center justify-between shadow-2xl border border-white/10 mx-2 mb-2">
                    <button onClick={() => setView('home')} className={`flex-1 flex flex-col items-center py-3.5 rounded-2xl transition-all ${view === 'home' ? 'bg-blue-600 text-white shadow-lg' : 'text-white/40 hover:text-white/60'}`}>
                        <Map size={22} className={view === 'home' ? 'fill-white/10' : ''} />
                        <span className="text-[8px] font-black uppercase mt-1.5 tracking-widest">En Turno</span>
                    </button>
                    <button onClick={() => setView('history')} className={`flex-1 flex flex-col items-center py-3.5 rounded-2xl transition-all ${view === 'history' ? 'bg-blue-600 text-white shadow-lg' : 'text-white/40 hover:text-white/60'}`}>
                        <History size={22} className={view === 'history' ? 'fill-white/10' : ''} />
                        <span className="text-[8px] font-black uppercase mt-1.5 tracking-widest">Viajes</span>
                    </button>
                    <button onClick={() => setView('wallet')} className={`flex-1 flex flex-col items-center py-3.5 rounded-2xl transition-all ${view === 'wallet' ? 'bg-blue-600 text-white shadow-lg' : 'text-white/40 hover:text-white/60'}`}>
                        <Wallet size={22} className={view === 'wallet' ? 'fill-white/10' : ''} />
                        <span className="text-[8px] font-black uppercase mt-1.5 tracking-widest">Pagos</span>
                    </button>
                    <button onClick={() => setView('profile')} className={`flex-1 flex flex-col items-center py-3.5 rounded-2xl transition-all ${view === 'profile' ? 'bg-blue-600 text-white shadow-lg' : 'text-white/40 hover:text-white/60'}`}>
                        <User size={22} className={view === 'profile' ? 'fill-white/10' : ''} />
                        <span className="text-[8px] font-black uppercase mt-1.5 tracking-widest">Perfil</span>
                    </button>
                </div>
            )}
        </div>
    </div>
  );
};

export default DriverApp;
