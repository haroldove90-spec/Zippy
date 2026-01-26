

import React, { useState, useEffect, useRef } from 'react';
import { 
  Power, Map, Loader2, Star, BellRing, X, Navigation, CheckCircle, TrendingUp, 
  DollarSign, LogOut, Phone, MessageCircle, Navigation2, Minus, Plus, 
  User, History, Wallet, ChevronRight, Camera, Save, MapPin, Calendar, Clock,
  ArrowLeft, Mail, ShieldCheck, CreditCard, Filter, Eye, EyeOff, Smartphone, Shield, Wind, VolumeX, AlertOctagon,
  Gift, Trash2, Share2, Siren, MessageSquare, Car, ChevronDown, ChevronUp,
  // FIX: Import XCircle icon for use in the history view.
  XCircle
} from 'lucide-react';
import MapVisual from './MapVisual';
import { RideStatus, Ride } from '../types';
import { supabase } from '../services/supabase';
import DriverRegistration from './DriverRegistration';
import ChatModal from './ChatModal';
import EmergencyDirectory from './EmergencyDirectory';
import NotificationToast, { NotificationType } from './NotificationToast';

interface DriverAppProps {
  onBack: () => void;
}

// Enhanced Sound Assets
const SOUNDS = {
  newRequest: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3', // Ping
  assigned: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',    // Success
  cancel: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',      // Error/Cancel
  message: 'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3'      // Message Pop
};

const DriverApp: React.FC<DriverAppProps> = ({ onBack }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isApplying, setIsApplying] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [view, setView] = useState<'home' | 'history' | 'profile' | 'wallet'>('home');
  const [rideStatus, setRideStatus] = useState<RideStatus>(RideStatus.IDLE);
  const [loading, setLoading] = useState(false);
  const [availableRides, setAvailableRides] = useState<Ride[]>([]);
  const [activeRide, setActiveRide] = useState<Ride | null>(null);
  const [isPanelMinimized, setIsPanelMinimized] = useState(false); 
  const [isRequestsMinimized, setIsRequestsMinimized] = useState(false); 
  
  // TOAST STATE
  const [toast, setToast] = useState<{msg: string, type: NotificationType, visible: boolean}>({ msg: '', type: 'info', visible: false });
  const [tipNotification, setTipNotification] = useState<{message: string, amount: number} | null>(null);

  const [showPassengerModal, setShowPassengerModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<Ride | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  
  const [pendingOffer, setPendingOffer] = useState<{ rideId: string, offerId: string } | null>(null);
  
  const [requestPassenger, setRequestPassenger] = useState<{name: string, rating: number, trips: number, photo: string, phone?: string} | null>(null);
  const [currentLocation, setCurrentLocation] = useState<[number, number]>([19.5437, -99.1962]);

  const [negotiationPrices, setNegotiationPrices] = useState<{[key: string]: number}>({});
  
  const [driverProfile, setDriverProfile] = useState({
      id: '', name: '', email: '', phone: '', rating: 4.9, carModel: '', carPlate: '', carColor: '', taxiNumber: '', avatarUrl: '', tripsToday: 0, earningsToday: 0, licenseStatus: ''
  });

  const [history, setHistory] = useState<Ride[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  
  // Auth States
  const [isEditing, setIsEditing] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const playSound = (soundUrl: string) => {
      const audio = new Audio(soundUrl);
      audio.play().catch(e => console.warn('Audio play failed:', e));
  };

  const showToast = (msg: string, type: NotificationType) => {
      setToast({ msg, type, visible: true });
  };

  useEffect(() => {
    const checkSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
            if (profile) {
                setDriverProfile(prev => ({ 
                    ...prev, 
                    id: session.user.id, name: profile.full_name || 'Conductor Zippy', email: profile.email || '', taxiNumber: profile.taxi_number || 'S/N', carModel: profile.car_model || 'Vehículo', carPlate: profile.car_plate || '---', phone: profile.phone || '', avatarUrl: profile.avatar_url || ''
                }));
                setIsAuthenticated(true);
                if (profile.status === 'online') setIsOnline(true);
            }
        }
    };
    checkSession();
  }, []);

  useEffect(() => {
    if (view === 'history' && driverProfile.id) {
        const fetchHistory = async () => {
            const { data } = await supabase.from('rides').select('*').eq('driver_id', driverProfile.id).in('status', ['COMPLETED', 'CANCELLED']).order('created_at', { ascending: false });
            if (data) setHistory(data as Ride[]);
        }
        fetchHistory();
    }
    if (view === 'wallet' && driverProfile.id) {
        const fetchEarnings = async () => {
            const { data } = await supabase.from('rides').select('price').eq('driver_id', driverProfile.id).eq('status', 'COMPLETED');
            if (data) { const total = data.reduce((sum, ride) => sum + ride.price, 0); setTotalEarnings(total); }
        }
        fetchEarnings();
    }
  }, [view, driverProfile.id]);

  useEffect(() => {
    if (!isAuthenticated || !isOnline || !activeRide || !driverProfile.id) return;
    const updateLocation = () => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    setCurrentLocation([latitude, longitude]);
                    await supabase.from('profiles').update({ lat: latitude, lng: longitude }).eq('id', driverProfile.id);
                },
                (error) => console.error("Error GPS:", error),
                { enableHighAccuracy: true }
            );
        }
    };
    updateLocation();
    const intervalId = setInterval(updateLocation, 10000);
    return () => clearInterval(intervalId);
  }, [isAuthenticated, isOnline, activeRide, driverProfile.id]);


  useEffect(() => {
    if (!isAuthenticated || !isOnline || view !== 'home') return;
    const fetchRides = async () => {
        const { data: ridesData } = await supabase.from('rides').select('*').eq('status', RideStatus.REQUESTING);
        if (ridesData) { setAvailableRides(ridesData); ridesData.forEach(r => setNegotiationPrices(prev => ({...prev, [r.id]: r.price}))); }
        if (driverProfile.id) {
            const { data: activeData } = await supabase.from('rides').select('*').eq('driver_id', driverProfile.id).in('status', ['ACCEPTED', 'ARRIVED', 'IN_PROGRESS']).single();
            if (activeData) { setActiveRide(activeData); setRideStatus(activeData.status as RideStatus); if (activeData.passenger_id) fetchPassengerDetails(activeData.passenger_id); }
        }
    };
    fetchRides();

    const channel = supabase.channel('driver_rides_channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'rides', filter: `status=eq.${RideStatus.REQUESTING}` }, (payload) => {
        const newRide = payload.new as Ride;
        setAvailableRides(prev => { if (prev.find(r => r.id === newRide.id)) return prev; return [newRide, ...prev]; });
        setNegotiationPrices(prev => ({...prev, [newRide.id]: newRide.price}));
        playSound(SOUNDS.newRequest); if ("vibrate" in navigator) navigator.vibrate([200, 100, 200]);
        showToast(`Nueva solicitud en ${newRide.pickup_label}`, 'warning');
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rides' }, (payload) => {
        const updated = payload.new as Ride;
        if (updated.status !== RideStatus.REQUESTING) setAvailableRides(prev => prev.filter(r => r.id !== updated.id));
        if (updated.driver_id === driverProfile.id && updated.status === RideStatus.ACCEPTED) {
            setPendingOffer(null); playSound(SOUNDS.assigned); if ("vibrate" in navigator) navigator.vibrate([500, 200, 500]); setActiveRide(updated); setRideStatus(RideStatus.ACCEPTED); if (updated.passenger_id) fetchPassengerDetails(updated.passenger_id);
            showToast('¡Pasajero confirmó! Ve al punto de recogida.', 'success');
        }
        if (pendingOffer && updated.id === pendingOffer.rideId && updated.status === RideStatus.CANCELLED) {
             setPendingOffer(null); playSound(SOUNDS.cancel); if ("vibrate" in navigator) navigator.vibrate([1000]);
             showToast('El viaje fue cancelado por el pasajero.', 'error');
        } else if (activeRide && activeRide.id === activeRide.id && (updated.status === RideStatus.CANCELLED || (updated.status === RideStatus.IDLE && rideStatus !== RideStatus.COMPLETED))) {
             playSound(SOUNDS.cancel); if ("vibrate" in navigator) navigator.vibrate([1000]); setActiveRide(null); setRideStatus(RideStatus.IDLE);
             showToast('El viaje ha sido cancelado por el pasajero.', 'error');
        }
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'rides' }, (payload) => {
          const deletedId = payload.old.id;
          setAvailableRides(prev => prev.filter(r => r.id !== deletedId));
          if (pendingOffer && pendingOffer.rideId === deletedId) { setPendingOffer(null); playSound(SOUNDS.cancel); showToast('La solicitud de viaje fue cancelada.', 'error'); }
          if (activeRide && activeRide.id === deletedId) { playSound(SOUNDS.cancel); if ("vibrate" in navigator) navigator.vibrate([1000]); setActiveRide(null); setRideStatus(RideStatus.IDLE); showToast('El viaje fue cancelado.', 'error'); }
      }).subscribe();
      
    const msgChannel = supabase.channel(`driver_messages:${driverProfile.id}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const msg = payload.new;
        if (activeRide && msg.ride_id === activeRide.id && msg.sender_id !== driverProfile.id) { setChatOpen(true); playSound(SOUNDS.message); if ("vibrate" in navigator) navigator.vibrate(100); }
    }).subscribe();
    
    const notifChannel = supabase.channel(`driver_notifications_global`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: "target=eq.DRIVERS" }, (payload) => {
        const notif = payload.new;
        if (notif.title === '¡Propina!') {
           const amountMatch = notif.message.match(/\$(\d+)/);
           const amount = amountMatch ? parseInt(amountMatch[1]) : 0;
           setTipNotification({ message: notif.message, amount }); playSound(SOUNDS.assigned); if ("vibrate" in navigator) navigator.vibrate([200, 200, 200]); setTimeout(() => setTipNotification(null), 8000);
        }
    }).subscribe();

    return () => { supabase.removeChannel(channel); supabase.removeChannel(msgChannel); supabase.removeChannel(notifChannel); };
  }, [isAuthenticated, isOnline, view, driverProfile.id, activeRide, rideStatus, pendingOffer]); 

  const fetchPassengerDetails = async (passengerId: string) => {
      const { data } = await supabase.from('profiles').select('full_name, rating, avatar_url, phone').eq('id', passengerId).single();
      if (data) { setRequestPassenger({ name: data.full_name || 'Pasajero Zippy', rating: data.rating || 5.0, trips: 1, photo: data.avatar_url || `https://ui-avatars.com/api/?name=${data.full_name}&background=random`, phone: data.phone }); }
  };

  const handleAuth = async (e: React.FormEvent) => {
      e.preventDefault(); setLoading(true);
      try {
          if (authMode === 'login') {
              const { data, error } = await supabase.auth.signInWithPassword({ email, password });
              if (error) throw error;
              if (data.user) {
                  const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
                  setDriverProfile(prev => ({ ...prev, id: data.user!.id, name: profile.full_name, email: profile.email, taxiNumber: profile.taxi_number, carModel: profile.car_model, carPlate: profile.car_plate, phone: profile.phone, avatarUrl: profile.avatar_url }));
                  setIsAuthenticated(true);
              }
          } else {
              const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName, role: 'DRIVER' } } });
              if (error) throw error;
              alert('¡Registro exitoso! Revisa tu correo para confirmar. Luego, podrás iniciar sesión para completar tu perfil de conductor.');
              setAuthMode('login');
          }
      } catch (err: any) { alert("Error: " + err.message); } finally { setLoading(false); }
  };

  const handleAcceptRequest = async () => {
      if (!selectedRequest) return; setShowPassengerModal(false); setLoading(true);
      const offeredPrice = negotiationPrices[selectedRequest.id] || selectedRequest.price;
      try {
          const { data, error } = await supabase.from('ride_offers').insert({
              ride_id: selectedRequest.id, driver_id: driverProfile.id, driver_name: driverProfile.name, car_model: driverProfile.carModel, car_plate: driverProfile.carPlate, taxi_number: driverProfile.taxiNumber, offered_price: offeredPrice, price: offeredPrice, eta: 5, avatar_url: driverProfile.avatarUrl
          }).select().single();
          if (error) throw error;
          if (data) { setPendingOffer({ rideId: selectedRequest.id, offerId: data.id }); showToast('Oferta enviada. Esperando al pasajero...', 'info'); }
      } catch (err: any) { alert("Error: " + err.message); } finally { setLoading(false); }
  };
  
  const handleCancelOffer = async () => {
      if (!pendingOffer) return; if (!confirm("¿Seguro que quieres cancelar tu oferta? El pasajero ya no podrá aceptarla.")) return; setLoading(true);
      try {
          const { error } = await supabase.from('ride_offers').delete().eq('id', pendingOffer.offerId);
          if (error) throw error;
          setPendingOffer(null); showToast('Oferta cancelada.', 'info');
      } catch (err: any) { alert("Error al cancelar la oferta: " + err.message); } finally { setLoading(false); }
  };

  const handleUpdateRideStatus = async (newStatus: RideStatus) => {
      if (!activeRide) return;
      try {
          const { error } = await supabase.rpc('driver_update_status', { ride_uuid: activeRide.id, new_status: newStatus, lat: currentLocation[0], lng: currentLocation[1] });
          if (error) throw error;
          setRideStatus(newStatus);
          if (newStatus === RideStatus.ARRIVED) { playSound(SOUNDS.newRequest); showToast('Notificando llegada al pasajero...', 'info'); }
          if (newStatus === RideStatus.COMPLETED) {
               setDriverProfile(prev => ({ ...prev, tripsToday: prev.tripsToday + 1, earningsToday: prev.earningsToday + activeRide.price }));
               showToast('Viaje finalizado con éxito', 'success');
          }
          if (newStatus === RideStatus.IDLE) setActiveRide(null);
      } catch (err) { console.error(err); setRideStatus(newStatus); }
  };

  const handleOpenRequest = (ride: Ride) => { setSelectedRequest(ride); fetchPassengerDetails(ride.passenger_id); setShowPassengerModal(true); };
  const handleShareTrip = async () => { if (!activeRide) return; const shareData = { title: 'Viaje Zippy', text: `Llevando pasajero a ${activeRide.destination_label}.`, url: 'https://zippy.mx' }; if (navigator.share) { try { await navigator.share(shareData); } catch (err) { console.error(err); } } else { showToast('Enlace copiado al portapapeles', 'info'); } };
  const handleDeleteRide = async (rideId: string) => { if (confirm("¿Descartar?")) { setAvailableRides(prev => prev.filter(r => r.id !== rideId)); } };
  const adjustPrice = (rideId: string, amount: number) => setNegotiationPrices(prev => ({ ...prev, [rideId]: Math.max((prev[rideId] || 0) + amount, 0) }));
  const handleCallPassenger = () => requestPassenger?.phone ? window.location.href = `tel:${requestPassenger.phone}` : showToast("Sin número disponible", 'error');
  const handleAvatarChange = (e: any) => { if(e.target.files[0]) { setAvatarFile(e.target.files[0]); setAvatarPreview(URL.createObjectURL(e.target.files[0])); setIsEditing(true); }};
  const handleSaveProfile = async () => { setLoading(true); setTimeout(() => { setLoading(false); setIsEditing(false); showToast("Perfil actualizado", "success"); }, 1000); };

  const renderPassengerModal = () => {
      if (!selectedRequest || !requestPassenger) return null;
      const price = negotiationPrices[selectedRequest.id] || selectedRequest.price;
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zippy-dark/80 backdrop-blur-md animate-fade-in">
            <div className="bg-white w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl relative animate-slide-up">
                <button className="absolute top-4 right-4 z-20 flex items-center gap-1 bg-red-600/10 hover:bg-red-600/20 px-3 py-1.5 rounded-full transition-colors"><AlertOctagon size={14} className="text-red-600" /><span className="text-[10px] font-black text-red-600">SOS</span></button>
                <div className="bg-zippy-dark p-6 pt-10 text-center relative overflow-hidden">
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-zippy-main to-white shadow-xl mb-3"><img src={requestPassenger.photo} className="w-full h-full rounded-full object-cover border-4 border-zippy-dark" /></div>
                        <h2 className="text-2xl font-black text-white tracking-tight">{requestPassenger.name}</h2>
                        <div className="flex items-center gap-3 mt-2 text-white/80 text-xs font-bold bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm">
                            <div className="flex items-center gap-1"><Star size={12} className="fill-zippy-accent text-zippy-accent" /> {requestPassenger.rating}</div>
                            <span>{requestPassenger.trips} viajes</span>
                        </div>
                    </div>
                </div>
                <div className="p-6 space-y-6">
                    <div className="flex gap-4">
                        <div className="flex flex-col items-center pt-1"><div className="w-3 h-3 rounded-full bg-zippy-main"></div><div className="w-0.5 flex-1 bg-gray-200 my-1 border-l-2 border-dashed"></div><div className="w-3 h-3 rounded-full bg-red-500"></div></div>
                        <div className="flex-1 space-y-6">
                            <div><p className="text-[10px] font-black text-gray-400 uppercase">Recoger en</p><h3 className="font-bold text-zippy-dark text-lg leading-tight">{selectedRequest.pickup_label}</h3></div>
                            <div><p className="text-[10px] font-black text-gray-400 uppercase">Destino</p><h3 className="font-bold text-zippy-dark text-lg leading-tight">{selectedRequest.destination_label}</h3></div>
                        </div>
                        <div className="text-right"><p className="text-2xl font-black text-zippy-dark">${price}</p></div>
                    </div>
                </div>
                <div className="p-6 pt-0 grid grid-cols-2 gap-3">
                    <button onClick={() => setShowPassengerModal(false)} className="py-4 rounded-2xl bg-red-50 text-red-600 font-black text-xs uppercase hover:bg-red-100">Rechazar</button>
                    <button onClick={handleAcceptRequest} className="py-4 rounded-2xl bg-zippy-main text-zippy-dark font-black text-xs uppercase shadow-xl hover:scale-[1.02] flex items-center justify-center gap-2"><CheckCircle size={16} /> Enviar Oferta</button>
                </div>
            </div>
        </div>
      );
  };

  const renderProfile = () => (
    <div className="absolute inset-0 z-40 bg-gray-100 flex flex-col overflow-y-auto animate-slide-up pb-24">
        <div className="bg-zippy-dark text-white p-8 pt-10 rounded-b-[40px] shadow-xl relative">
            <button onClick={() => setView('home')} className="absolute top-4 left-4 p-2 bg-white/10 rounded-full hover:bg-white/20"><ArrowLeft size={20} /></button>
            <div className="flex flex-col items-center">
                <div className="relative group">
                    <div className="w-28 h-28 rounded-full border-4 border-zippy-main shadow-2xl overflow-hidden mb-4 relative">
                        <img src={avatarPreview || driverProfile.avatarUrl || `https://ui-avatars.com/api/?name=${driverProfile.name}&background=003A70&color=fff`} className="w-full h-full object-cover" />
                    </div>
                    <label className="absolute bottom-0 right-0 p-2 bg-zippy-main rounded-full text-zippy-dark shadow-lg cursor-pointer hover:scale-110 transition-transform">
                        <Camera size={16} />
                        <input type="file" ref={fileInputRef} onChange={handleAvatarChange} className="hidden" accept="image/*" />
                    </label>
                </div>
                <h2 className="text-2xl font-black uppercase tracking-tight">{driverProfile.name}</h2>
                <div className="flex items-center gap-2 mt-2 text-zippy-main font-bold text-sm bg-white/10 px-4 py-1 rounded-full">
                    <Star size={14} className="fill-zippy-main" /> {driverProfile.rating} Rating
                </div>
            </div>
        </div>
        <div className="p-6 space-y-6">
            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 space-y-4">
                <h3 className="text-sm font-black text-zippy-dark uppercase tracking-widest border-b border-gray-100 pb-2">Información Personal</h3>
                <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Nombre</label>
                    <input value={driverProfile.name} onChange={e=>setDriverProfile({...driverProfile, name: e.target.value})} className="w-full font-bold text-zippy-dark border-b border-gray-100 py-1 outline-none focus:border-zippy-main" disabled={!isEditing} />
                </div>
                <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Teléfono</label>
                    <input value={driverProfile.phone} onChange={e=>setDriverProfile({...driverProfile, phone: e.target.value})} className="w-full font-bold text-zippy-dark border-b border-gray-100 py-1 outline-none focus:border-zippy-main" disabled={!isEditing} />
                </div>
                <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Email</label>
                    <input value={driverProfile.email} onChange={e=>setDriverProfile({...driverProfile, email: e.target.value})} className="w-full font-bold text-zippy-dark border-b border-gray-100 py-1 outline-none focus:border-zippy-main" disabled={!isEditing} />
                </div>
            </div>
            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 space-y-4">
                <h3 className="text-sm font-black text-zippy-dark uppercase tracking-widest border-b border-gray-100 pb-2">Vehículo</h3>
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-gray-100 rounded-xl text-gray-500"><Car size={24} /></div>
                    <div>
                        <p className="font-bold text-zippy-dark">{driverProfile.carModel}</p>
                        <p className="text-xs text-gray-400 font-bold">{driverProfile.carPlate}</p>
                    </div>
                    <div className="ml-auto text-right">
                        <p className="text-[10px] text-gray-400 uppercase font-bold">Unidad</p>
                        <p className="text-xl font-black text-zippy-dark">{driverProfile.taxiNumber}</p>
                    </div>
                </div>
            </div>
            <button onClick={isEditing ? handleSaveProfile : () => setIsEditing(true)} className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 ${isEditing ? 'bg-zippy-main text-zippy-dark' : 'bg-zippy-dark text-white'}`}>
                {isEditing ? <><Save size={18} /> Guardar Cambios</> : 'Editar Perfil'}
            </button>
            <button onClick={onBack} className="w-full py-4 rounded-2xl bg-red-50 text-red-600 font-black text-sm uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 mt-4 hover:bg-red-100 transition-colors">
                <LogOut size={18} /> Cerrar Sesión
            </button>
        </div>
    </div>
  );

  const renderHistory = () => (
    <div className="absolute inset-0 z-40 bg-gray-50 flex flex-col overflow-y-auto animate-slide-up pb-24">
        <div className="bg-white p-6 shadow-sm sticky top-0 z-10 flex items-center gap-4">
            <button onClick={() => setView('home')} className="p-2 hover:bg-gray-100 rounded-full"><ArrowLeft size={20} className="text-zippy-dark" /></button>
            <h2 className="text-xl font-black text-zippy-dark uppercase tracking-tight">Historial</h2>
        </div>
        <div className="p-4 space-y-3">
            {history.length === 0 ? (<div className="text-center p-10 text-gray-400"><History size={32} className="mx-auto mb-4"/> <p className="font-bold">Aún no tienes viajes</p></div>) : (history.map((ride) => (
                <div key={ride.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${ride.status === 'COMPLETED' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                            {ride.status === 'COMPLETED' ? <CheckCircle size={18} /> : <XCircle size={18} />}
                        </div>
                        <div>
                            <p className="font-bold text-zippy-dark text-sm">{ride.destination_label}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase">{new Date(ride.created_at!).toLocaleDateString()} • {ride.status === 'COMPLETED' ? 'Completado' : 'Cancelado'}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-lg font-black text-zippy-dark">${ride.price}</p>
                    </div>
                </div>
            )))}
        </div>
    </div>
  );

  const renderWallet = () => (
    <div className="absolute inset-0 z-40 bg-gray-50 flex flex-col overflow-y-auto animate-slide-up pb-24">
        <div className="bg-zippy-dark text-white p-8 pt-10 rounded-b-[40px] shadow-xl relative">
            <button onClick={() => setView('home')} className="absolute top-4 left-4 p-2 bg-white/10 rounded-full hover:bg-white/20"><ArrowLeft size={20} /></button>
            <p className="text-center text-[10px] font-black uppercase tracking-[0.2em] opacity-70 mb-2">Ganancias Totales</p>
            <h2 className="text-5xl font-black text-center mb-6">${totalEarnings.toFixed(2)}</h2>
            <div className="flex justify-center gap-4">
                <button className="bg-zippy-main text-zippy-dark px-6 py-3 rounded-xl font-black text-xs uppercase shadow-lg active:scale-95 transition-transform flex items-center gap-2">
                    <DollarSign size={16} /> Retirar
                </button>
            </div>
        </div>
        <div className="p-6">
            <h3 className="font-black text-zippy-dark text-sm uppercase tracking-widest mb-4">Movimientos Recientes</h3>
            <div className="space-y-3">
                {history.filter(r => r.status === 'COMPLETED').slice(0, 5).map(ride => (
                    <div key={ride.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-zippy-dark/5 rounded-xl"><TrendingUp size={18} className="text-zippy-dark" /></div>
                            <div>
                                <p className="font-bold text-gray-800 text-xs">Viaje a {ride.destination_label}</p>
                                <p className="text-[9px] text-gray-400 font-bold">{new Date(ride.created_at!).toLocaleString()}</p>
                            </div>
                        </div>
                        <span className="font-black text-green-600 text-sm">+$ {ride.price.toFixed(2)}</span>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );

  if (!isAuthenticated) {
      return (
          <div className="w-full h-full bg-zippy-dark flex flex-col items-center justify-center p-6 animate-fade-in">
              <img src="https://tritex.com.mx/zippylogo.png" className="h-12 mb-8 filter invert" />
              <div className="bg-white p-6 rounded-[32px] w-full max-w-sm shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-2 bg-blue-600"></div>
                  <h2 className="text-lg font-black text-center text-zippy-dark mb-4 uppercase tracking-widest">{authMode === 'login' ? 'Conductor' : 'Registro de Acceso'}</h2>
                  <form onSubmit={handleAuth} className="space-y-3">
                      {authMode === 'register' && (<input required placeholder="Nombre Completo" className="w-full p-3 bg-gray-50 border rounded-xl font-bold text-sm" value={fullName} onChange={e=>setFullName(e.target.value)} />)}
                      <input required type="email" placeholder="Correo Electrónico" className="w-full p-3 bg-gray-50 border rounded-xl font-bold text-sm" value={email} onChange={e=>setEmail(e.target.value)} />
                      <div className="relative"><input required type={showPassword ? "text" : "password"} placeholder="Contraseña" className="w-full p-3 bg-gray-50 border rounded-xl font-bold text-sm" value={password} onChange={e=>setPassword(e.target.value)} /><button type="button" onClick={()=>setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
                      <button className="w-full bg-blue-700 text-white font-black py-3 rounded-xl shadow-lg active:scale-95 transition-all uppercase tracking-wide text-xs">{loading ? <Loader2 className="animate-spin mx-auto w-5 h-5" /> : authMode === 'login' ? 'Ingresar al Panel' : 'Crear mi Acceso'}</button>
                      <button type="button" onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="w-full text-[10px] font-black text-blue-700 uppercase tracking-widest mt-2 underline text-center block hover:text-blue-800">{authMode === 'login' ? '¿No tienes acceso? Regístrate aquí' : '¿Ya tienes acceso? Ingresa aquí'}</button>
                      <button type="button" onClick={onBack} className="w-full text-[9px] font-black text-gray-400 uppercase tracking-widest text-center mt-3 block">Volver al Inicio</button>
                  </form>
              </div>
              <DriverRegistration isOpen={isApplying} onClose={() => setIsApplying(false)} />
          </div>
      );
  }

  return (
    <div className="w-full h-full bg-gray-100 flex flex-col relative overflow-hidden font-sans">
        <NotificationToast message={toast.msg} type={toast.type} isVisible={toast.visible} onClose={() => setToast({ ...toast, visible: false })} />
        <MapVisual status={isOnline ? (rideStatus === RideStatus.IDLE ? 'ADMIN_HEATMAP' : rideStatus) : 'OFFLINE'} userLocation={isOnline ? currentLocation : undefined} />
        {tipNotification && (<div className="absolute top-20 inset-x-4 z-50 animate-slide-down"><div className="bg-zippy-main text-zippy-dark p-4 rounded-2xl shadow-2xl flex items-center gap-4 border-2 border-white"><div className="bg-white p-2 rounded-full shadow-sm"><Gift size={24} className="text-zippy-dark" /></div><div className="flex-1"><h4 className="font-black uppercase text-sm">¡Nueva Propina!</h4><p className="text-xs font-bold opacity-80">{tipNotification.message}</p></div><span className="text-xl font-black bg-white px-3 py-1 rounded-lg shadow-sm">${tipNotification.amount}</span></div></div>)}
        {view === 'profile' && renderProfile()}{view === 'history' && renderHistory()}{view === 'wallet' && renderWallet()}{showPassengerModal && renderPassengerModal()}
        
        <div className="absolute top-0 left-0 right-0 p-4 z-20 flex justify-between items-center bg-white/90 backdrop-blur-md border-b shadow-sm">
            <div className="flex items-center gap-3"><button onClick={() => setView('profile')} className="w-11 h-11 rounded-2xl overflow-hidden border-2 border-blue-700 shadow-lg active:scale-90 transition-transform"><img src={driverProfile.avatarUrl || `https://ui-avatars.com/api/?name=${driverProfile.name}&background=003A70&color=fff`} className="w-full h-full object-cover" /></button><div className="flex flex-col"><div className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div><span className="font-black text-[10px] text-zippy-dark uppercase tracking-tight">{isOnline ? 'En Turno' : 'Desconectado'}</span></div><span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Unidad {driverProfile.taxiNumber}</span></div></div>
            <button onClick={()=>setIsOnline(!isOnline)} className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase transition-all shadow-xl active:scale-95 ${isOnline ? 'bg-red-600 text-white' : 'bg-blue-700 text-white'}`}>{isOnline ? 'Finalizar Turno' : 'Comenzar Turno'}</button>
        </div>

        {isOnline && pendingOffer && !activeRide && view === 'home' && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-full max-w-sm px-4">
                <div className="bg-white/90 p-10 rounded-[40px] text-center backdrop-blur-md border border-gray-100 shadow-2xl animate-fade-in">
                    <Loader2 className="animate-spin text-blue-700 mx-auto mb-6" size={48} />
                    <h3 className="text-xl font-black text-zippy-dark uppercase tracking-tight mb-2">Oferta Enviada</h3>
                    <p className="text-sm font-bold text-gray-500 leading-relaxed mb-8">Esperando la confirmación del pasajero. Te notificaremos en cuanto acepte.</p>
                    <button onClick={handleCancelOffer} disabled={loading} className="w-full bg-red-50 text-red-600 font-black py-4 rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all text-xs tracking-widest uppercase hover:bg-red-100">
                        {loading ? <Loader2 className="animate-spin" /> : <><X size={16}/> Cancelar Oferta</>}
                    </button>
                </div>
            </div>
        )}

        {isOnline && !activeRide && !pendingOffer && view === 'home' && (
            <div className={`absolute top-24 left-4 right-4 z-20 flex flex-col gap-4 max-h-[60vh] transition-all duration-300 ${isRequestsMinimized ? 'h-12 overflow-hidden' : 'overflow-y-auto'}`}>
                <div className="mt-2 space-y-4 pointer-events-auto pb-10">
                    <div className="flex items-center justify-between bg-blue-900/95 backdrop-blur-md px-5 py-3 rounded-full shadow-2xl border border-white/10">
                        <div className="flex items-center gap-2">
                            <h3 className="text-[9px] font-black text-white uppercase tracking-[0.2em]">Tarifas Solicitadas</h3>
                            <div className="w-2 h-2 bg-zippy-accent rounded-full animate-ping"></div>
                        </div>
                        <button onClick={() => setIsRequestsMinimized(!isRequestsMinimized)} className="text-white hover:bg-white/20 rounded-full p-1 transition-colors">
                            {isRequestsMinimized ? <ChevronDown size={16}/> : <ChevronUp size={16}/>}
                        </button>
                    </div>
                    {!isRequestsMinimized && (
                        availableRides.length === 0 ? (<div className="bg-white/80 p-10 rounded-[40px] text-center backdrop-blur-md border border-gray-100 shadow-xl"><Loader2 className="animate-spin text-blue-700 mx-auto mb-4" size={32} /><p className="text-[10px] font-black text-zippy-dark uppercase tracking-widest leading-relaxed">Localizando pasajeros cerca de tu posición...</p></div>) : (availableRides.map(ride => (<div key={ride.id} className="bg-white p-6 rounded-[40px] shadow-2xl border border-gray-50 flex flex-col gap-4 animate-slide-up hover:border-blue-700/20 transition-all"><div className="flex justify-between items-start"><div><div className="flex items-center gap-2 mb-1"><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Tarifa Sugerida</p><button onClick={(e) => { e.stopPropagation(); handleDeleteRide(ride.id); }} className="flex items-center gap-1 px-2 py-1 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition-colors group"><Trash2 size={12} /><span className="text-[9px] font-black uppercase">Borrar</span></button></div><div className="flex items-center gap-3"><h4 className="font-black text-zippy-dark text-3xl tracking-tighter">${negotiationPrices[ride.id] || ride.price}</h4>{negotiationPrices[ride.id] !== ride.price && (<span className="text-xs font-bold text-gray-300 line-through decoration-red-400/50">${ride.price}</span>)}</div></div><div className="bg-gray-50 px-3 py-2 rounded-2xl flex flex-col items-end"><div className="flex items-center text-[10px] font-black text-zippy-dark"><Star size={10} className="text-zippy-accent mr-1 fill-zippy-accent" /> 4.8</div><span className="text-[8px] font-black text-gray-400 uppercase mt-0.5">Efectivo</span></div></div><div className="space-y-2 bg-gray-50/50 p-4 rounded-3xl border border-gray-50"><div className="flex items-center gap-3"><div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div><p className="text-[9px] font-bold text-gray-500 truncate uppercase tracking-tight">{ride.pickup_label}</p></div><div className="flex items-center gap-3"><div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div><p className="text-[9px] font-black text-zippy-dark truncate uppercase tracking-tight">{ride.destination_label}</p></div></div><div className="flex items-center gap-2"><button onClick={() => adjustPrice(ride.id, -5)} className="p-4 bg-gray-100 rounded-2xl text-blue-700 active:scale-90 transition-transform"><Minus size={20}/></button><div className="flex-1 flex gap-2">{[5, 10, 20].map(amt => (<button key={amt} onClick={() => adjustPrice(ride.id, amt)} className="flex-1 py-4 bg-blue-600 text-white text-[10px] font-black rounded-2xl shadow-sm border border-blue-700 active:bg-blue-800 active:scale-95 transition-all">+{amt}</button>))}</div><button onClick={() => adjustPrice(ride.id, 5)} className="p-4 bg-gray-100 rounded-2xl text-blue-700 active:scale-90 transition-transform"><Plus size={20}/></button></div><button onClick={() => handleOpenRequest(ride)} className="w-full bg-blue-700 text-white font-black py-5 rounded-[28px] flex items-center justify-center gap-3 shadow-2xl shadow-blue-700/30 hover:scale-[1.02] active:scale-95 transition-all uppercase text-xs tracking-widest"><Eye size={20} /> Ver Perfil del Pasajero</button></div>)))
                    )}
                </div>
            </div>
        )}

        <div className={`absolute inset-x-0 bottom-0 z-30 pointer-events-none p-0 flex flex-col transition-transform duration-300 ease-in-out ${isPanelMinimized ? 'translate-y-[85%]' : 'translate-y-0'}`}>
            {(isOnline && (activeRide || view === 'home')) && (
                <div className="pointer-events-auto flex justify-end px-4 pb-2">
                    <button onClick={() => setIsPanelMinimized(!isPanelMinimized)} className="bg-white text-zippy-dark p-2 rounded-full shadow-lg border border-gray-100 hover:bg-gray-50 active:scale-90 transition-transform">
                        {isPanelMinimized ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                    </button>
                </div>
            )}
            {isOnline && activeRide ? (
                <div className="pointer-events-auto bg-white rounded-[40px] p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] border-4 border-blue-700 animate-slide-up">
                    <div className="flex justify-between items-center mb-6"><div className="max-w-[70%]"><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Viaje en Curso</p><h3 className="text-xl font-black text-zippy-dark leading-tight tracking-tight">{activeRide.destination_label}</h3></div><p className="text-4xl font-black text-zippy-dark tracking-tighter">${activeRide.price}</p></div>
                    <div className="grid grid-cols-4 gap-2 mb-6">
                        <button onClick={handleCallPassenger} className="flex flex-col items-center justify-center p-3 bg-gray-100 rounded-2xl active:scale-95 transition-transform hover:bg-zippy-main/20"><Phone size={20} className="text-zippy-dark mb-1" /><span className="text-[8px] font-black uppercase text-gray-500">Llamar</span></button>
                        <button onClick={() => setChatOpen(true)} className="flex flex-col items-center justify-center p-3 bg-gray-100 rounded-2xl active:scale-95 transition-transform hover:bg-zippy-main/20"><MessageSquare size={20} className="text-zippy-dark mb-1" /><span className="text-[8px] font-black uppercase text-gray-500">Chat</span></button>
                        <button onClick={handleShareTrip} className="flex flex-col items-center justify-center p-3 bg-gray-100 rounded-2xl active:scale-95 transition-transform hover:bg-zippy-main/20"><Share2 size={20} className="text-zippy-dark mb-1" /><span className="text-[8px] font-black uppercase text-gray-500">Compartir</span></button>
                        <button onClick={() => setEmergencyOpen(true)} className="flex flex-col items-center justify-center p-3 bg-red-50 rounded-2xl border border-red-100 active:scale-95 transition-transform"><Siren size={20} className="text-red-600 mb-1 animate-pulse" /><span className="text-[8px] font-black uppercase text-red-600">SOS</span></button>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                        {rideStatus === RideStatus.ACCEPTED && (<button onClick={() => handleUpdateRideStatus(RideStatus.ARRIVED)} className="w-full bg-blue-700 text-white font-black py-5 rounded-[28px] shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all text-xs tracking-widest uppercase"><MapPin size={20} /> Ya llegué al punto</button>)}
                        {rideStatus === RideStatus.ARRIVED && (<button onClick={() => handleUpdateRideStatus(RideStatus.IN_PROGRESS)} className="w-full bg-blue-700 text-white font-black py-5 rounded-[28px] shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all text-xs tracking-widest uppercase ring-4 ring-blue-700/20"><TrendingUp size={20} /> Iniciar Viaje</button>)}
                        {rideStatus === RideStatus.IN_PROGRESS && (<button onClick={() => handleUpdateRideStatus(RideStatus.COMPLETED)} className="w-full bg-green-600 text-white font-black py-5 rounded-[28px] shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all text-xs tracking-widest uppercase"><DollarSign size={20} /> Cobrar y Finalizar</button>)}
                        {rideStatus === RideStatus.COMPLETED && (<button onClick={() => handleUpdateRideStatus(RideStatus.IDLE)} className="w-full bg-gray-800 text-white font-black py-5 rounded-[28px] shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all text-xs tracking-widest uppercase"><CheckCircle size={20} /> Cerrar Viaje</button>)}
                    </div>
                </div>
            ) : (
                <div className="pointer-events-auto bg-blue-950/95 backdrop-blur-2xl rounded-[36px] p-2.5 flex items-center justify-between shadow-2xl border border-white/10 mx-2 mb-2">
                    <button onClick={() => setView('home')} className={`flex-1 flex flex-col items-center py-3.5 rounded-2xl transition-all ${view === 'home' ? 'bg-blue-600 text-white shadow-lg' : 'text-white/40 hover:text-white/60'}`}><Map size={22} className={view === 'home' ? 'fill-white/10' : ''} /><span className="text-[8px] font-black uppercase mt-1.5 tracking-widest">En Turno</span></button>
                    <button onClick={() => setView('history')} className={`flex-1 flex flex-col items-center py-3.5 rounded-2xl transition-all ${view === 'history' ? 'bg-blue-600 text-white shadow-lg' : 'text-white/40 hover:text-white/60'}`}><History size={22} className={view === 'history' ? 'fill-white/10' : ''} /><span className="text-[8px] font-black uppercase mt-1.5 tracking-widest">Viajes</span></button>
                    <button onClick={() => setView('wallet')} className={`flex-1 flex flex-col items-center py-3.5 rounded-2xl transition-all ${view === 'wallet' ? 'bg-blue-600 text-white shadow-lg' : 'text-white/40 hover:text-white/60'}`}><Wallet size={22} className={view === 'wallet' ? 'fill-white/10' : ''} /><span className="text-[8px] font-black uppercase mt-1.5 tracking-widest">Pagos</span></button>
                    <button onClick={() => setView('profile')} className={`flex-1 flex flex-col items-center py-3.5 rounded-2xl transition-all ${view === 'profile' ? 'bg-blue-600 text-white shadow-lg' : 'text-white/40 hover:text-white/60'}`}><User size={22} className={view === 'profile' ? 'fill-white/10' : ''} /><span className="text-[8px] font-black uppercase mt-1.5 tracking-widest">Perfil</span></button>
                </div>
            )}
        </div>

        <ChatModal isOpen={chatOpen} onClose={() => setChatOpen(false)} onEndChat={() => { setChatOpen(false); showToast("Chat finalizado", "info"); }} rideId={activeRide?.id || ''} currentUserRole="DRIVER" currentUserId={driverProfile.id} counterpartName={requestPassenger?.name || 'Pasajero'} counterpartPhone={requestPassenger?.phone} />
        <EmergencyDirectory isOpen={emergencyOpen} onClose={()=>setEmergencyOpen(false)} />
    </div>
  );
};

export default DriverApp;
