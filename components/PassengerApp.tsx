
import React, { useState, useEffect, useRef } from 'react';
import { 
  Menu, Navigation, MessageSquare, ShieldCheck, MapPin, Loader2, Calendar, Clock, Lock, 
  Eye, EyeOff, Star, BellRing, X, ChevronRight, Check, History, CreditCard, User, 
  ArrowLeft, Save, Plus, Wallet, TrendingUp, Truck, Wrench, Siren, Disc, Briefcase,
  HeartPulse, LogOut, DollarSign, Share2, Phone, Award, CheckCircle2, Camera, ThumbsUp, CheckCircle, Car,
  Gift, ChevronDown, ChevronUp, XCircle, Trash2, Home, Building2, AlertCircle, RefreshCw
} from 'lucide-react';
import { RideStatus, DriverTarifa, Ride, MapEntity } from '../types';
import MapVisual from './MapVisual';
import Drawer from './Drawer';
import AssistantModal from './AssistantModal';
import EmergencyDirectory from './EmergencyDirectory';
import OffersList from './OffersList';
import DriverRegistration from './DriverRegistration'; 
import ChatModal from './ChatModal';
import NotificationToast, { NotificationType } from './NotificationToast';
import ApplicationStatus from './ApplicationStatus';
import { supabase } from '../services/supabase';
import { getSmartPriceAdvice } from '../services/geminiService';

interface PassengerAppProps {
  onBack: () => void;
}

const SOUNDS = {
  driverFound: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',
  driverArrived: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
  message: 'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3'
};

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
};

const PassengerApp: React.FC<PassengerAppProps> = ({ onBack }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'home' | 'profile' | 'history' | 'payment' | 'services'>('home');
  const [status, setStatus] = useState<RideStatus>(RideStatus.IDLE);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [driverRegOpen, setDriverRegOpen] = useState(false); 
  const [chatOpen, setChatOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false); 
  const [addCardOpen, setAddCardOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [viewingHistoryDetail, setViewingHistoryDetail] = useState<Ride | null>(null);
  
  const [toast, setToast] = useState<{msg: string, type: NotificationType, visible: boolean}>({ msg: '', type: 'info', visible: false });

  const [showThankYouScreen, setShowThankYouScreen] = useState(false);
  const [driverApplicationStatus, setDriverApplicationStatus] = useState<string | null>(null);
  const [driverStatusViewOpen, setDriverStatusViewOpen] = useState(false);

  const [availableTarifas, setAvailableTarifas] = useState<DriverTarifa[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<(DriverTarifa & { phone?: string }) | null>(null);
  const [activeRide, setActiveRide] = useState<Ride | null>(null);
  const [viewingDriver, setViewingDriver] = useState<DriverTarifa | null>(null);
  const [nearbyDrivers, setNearbyDrivers] = useState<MapEntity[]>([]);

  const [passengerLocation, setPassengerLocation] = useState<[number, number]>([19.5430, -99.1955]); 
  const [destinationCoords, setDestinationCoords] = useState<[number, number]>([19.5108, -99.2335]);
  const [routeStart, setRouteStart] = useState<[number, number] | undefined>(undefined);
  const [routeEnd, setRouteEnd] = useState<[number, number] | undefined>(undefined);
  const [tripDistance, setTripDistance] = useState<string>('');
  
  const [history, setHistory] = useState<Ride[]>([]);

  const [rating, setRating] = useState(0);
  const [tipAmount, setTipAmount] = useState<number>(0);
  const [customTip, setCustomTip] = useState('');
  const [showCustomTipInput, setShowCustomTipInput] = useState(false);

  const [userProfile, setUserProfile] = useState({
      id: '', name: '', email: '', phone: '', avatar_url: '', card_name: '', card_last4: '', card_expiry: '', card_brand: '', saved_home: '', saved_work: ''
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [pickup, setPickup] = useState('Av. Mario Colín, Tlalnepantla');
  const [destination, setDestination] = useState('');
  const [calculatedPrice, setCalculatedPrice] = useState<number>(50);
  const [smartAdvice, setSmartAdvice] = useState<{advice: string, prob: number} | null>(null);

  const playSound = (soundUrl: string) => {
      const audio = new Audio(soundUrl);
      audio.play().catch(e => console.warn('Audio play failed:', e));
  };

  const showToast = (msg: string, type: NotificationType) => {
      setToast({ msg, type, visible: true });
  };

  const sendSystemNotification = (title: string, body: string) => {
      if (Notification.permission === 'granted') {
          new Notification(title, { body, icon: 'https://tritex.com.mx/zippyicono.png', badge: 'https://tritex.com.mx/zippyicono.png' });
      }
  };

  useEffect(() => {
    const checkSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
            if (profile) {
                setUserProfile(prev => ({ 
                  ...prev, 
                  id: session.user.id, name: profile.full_name || 'Usuario Zippy', email: profile.email || '', phone: profile.phone || '', avatar_url: profile.avatar_url || '', card_name: profile.card_name, card_last4: profile.card_last4, card_expiry: profile.card_expiry, card_brand: profile.card_brand, saved_home: profile.saved_home, saved_work: profile.saved_work,
                }));
                setDriverApplicationStatus(profile.verification_status || 'unverified');
                setIsAuthenticated(true);
            }
        }
    };
    checkSession();
  }, []);

  useEffect(() => {
    if (view === 'history' && userProfile.id) {
        const fetchHistory = async () => {
            const { data, error } = await supabase.from('rides')
                .select('*')
                .eq('passenger_id', userProfile.id)
                .in('status', ['COMPLETED', 'CANCELLED'])
                .order('created_at', { ascending: false });
            if (data) setHistory(data as Ride[]);
        }
        fetchHistory();
    }
  }, [view, userProfile.id]);

  useEffect(() => {
      if (status === RideStatus.ACCEPTED || status === RideStatus.ARRIVED) {
          const driverEntity = nearbyDrivers.find(d => d.id === selectedDriver?.driver_id);
          if (driverEntity) { setRouteStart([driverEntity.lat, driverEntity.lng]); setRouteEnd(passengerLocation); const dist = calculateDistance(driverEntity.lat, driverEntity.lng, passengerLocation[0], passengerLocation[1]); setTripDistance(`${dist.toFixed(2)} km`); } 
          else if (selectedDriver) { setRouteStart([19.5437, -99.1962]); setRouteEnd(passengerLocation); }
      } else if (status === RideStatus.IN_PROGRESS) {
          setRouteStart(passengerLocation); setRouteEnd(destinationCoords); const dist = calculateDistance(passengerLocation[0], passengerLocation[1], destinationCoords[0], destinationCoords[1]); setTripDistance(`${dist.toFixed(2)} km`);
      } else { setRouteStart(undefined); setRouteEnd(undefined); setTripDistance(''); }
  }, [status, nearbyDrivers, selectedDriver, passengerLocation, destinationCoords]);

  useEffect(() => {
    if (status !== RideStatus.IDLE && status !== RideStatus.ACCEPTED && status !== RideStatus.ARRIVED) return;
    const fetchDrivers = async () => {
        const { data } = await supabase.from('profiles').select('id, full_name, lat, lng, car_model').eq('role', 'DRIVER').eq('status', 'online').neq('lat', null);
        if (data) { setNearbyDrivers(data.map(d => ({ id: d.id, type: 'driver', lat: d.lat, lng: d.lng, label: d.car_model || 'Taxi Zippy', status: 'online' })) as MapEntity[]); }
    };
    fetchDrivers();
    const interval = setInterval(fetchDrivers, 5000);
    return () => clearInterval(interval);
  }, [status]);

  useEffect(() => {
    if (!activeRide?.id) return;
    const activeRideId = activeRide.id;

    const channel = supabase.channel(`ride-offers-${activeRideId}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ride_offers', filter: `ride_id=eq.${activeRideId}` }, (payload) => {
        const newOffer = payload.new as any;
        const mappedTarifa: DriverTarifa = { id: newOffer.id, ride_id: newOffer.ride_id, driver_id: newOffer.driver_id, name: newOffer.driver_name || 'Conductor Zippy', rating: newOffer.driver_rating || 5.0, carModel: newOffer.car_model || 'Vehículo Zippy', carPlate: newOffer.car_plate || 'S/N', taxiNumber: newOffer.taxi_number || '0000', price: newOffer.offered_price, eta: newOffer.eta || 5, avatarUrl: newOffer.avatar_url || `https://ui-avatars.com/api/?name=C&background=random`, distance: newOffer.distance || 1.0, tripsCompleted: newOffer.trips_completed || 100 };
        setAvailableTarifas(prev => { if (prev.some(t => t.id === mappedTarifa.id)) return prev; return [mappedTarifa, ...prev]; });
        if ("vibrate" in navigator) navigator.vibrate(200);
        showToast(`Nueva oferta de ${mappedTarifa.name}: $${mappedTarifa.price}`, 'info');
      }).subscribe();

    const statusChannel = supabase.channel(`ride-status-${activeRideId}`).on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rides', filter: `id=eq.${activeRideId}` }, async (payload) => {
        const updatedRide = payload.new as Ride;
        if (updatedRide.status === RideStatus.ACCEPTED) {
           setStatus(RideStatus.ACCEPTED); 
           if (!selectedDriver && updatedRide.driver_id) {
               const { data: driverData } = await supabase.from('profiles').select('*').eq('id', updatedRide.driver_id).single();
               if (driverData) { setSelectedDriver({ id: 'assigned-' + updatedRide.driver_id, ride_id: updatedRide.id, driver_id: driverData.id, name: driverData.full_name, rating: driverData.rating || 5.0, carModel: driverData.car_model || 'Vehículo', carPlate: driverData.car_plate || '---', taxiNumber: driverData.taxi_number || '---', price: updatedRide.price, eta: 5, avatarUrl: driverData.avatar_url || '', distance: 0, tripsCompleted: 0, phone: driverData.phone }); }
           }
           playSound(SOUNDS.driverFound); sendSystemNotification('¡Conductor Asignado!', 'Tu Zippy va en camino.'); if ("vibrate" in navigator) navigator.vibrate([100, 50, 100]); showToast('¡Conductor asignado! Tu Zippy va en camino.', 'success');
        } 
        if (updatedRide.status === RideStatus.ARRIVED) { setStatus(RideStatus.ARRIVED); playSound(SOUNDS.driverArrived); sendSystemNotification('¡Tu Zippy llegó!', 'El conductor te espera en el punto.'); if ("vibrate" in navigator) navigator.vibrate([500, 200, 500, 200, 500]); showToast('¡Tu Zippy ha llegado! El conductor te espera.', 'warning'); } 
        else if (updatedRide.status === RideStatus.IN_PROGRESS) { setStatus(RideStatus.IN_PROGRESS); showToast('Viaje iniciado. Disfruta tu trayecto.', 'info'); } 
        else if (updatedRide.status === RideStatus.COMPLETED) { setStatus(RideStatus.RATING); if ("vibrate" in navigator) navigator.vibrate([100, 50, 100]); showToast('Has llegado a tu destino.', 'success'); }
      }).subscribe();
      
    const msgChannel = supabase.channel(`passenger_messages:${userProfile.id}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const msg = payload.new;
        if (activeRideId && msg.ride_id === activeRideId && msg.sender_id !== userProfile.id) { setChatOpen(true); playSound(SOUNDS.message); sendSystemNotification('Nuevo Mensaje', 'El conductor te ha enviado un mensaje.'); if ("vibrate" in navigator) navigator.vibrate(100); }
    }).subscribe();

    return () => { supabase.removeChannel(channel); supabase.removeChannel(statusChannel); supabase.removeChannel(msgChannel); };
  }, [activeRide?.id, userProfile.id, selectedDriver]);

  useEffect(() => {
      if (!selectedDriver?.driver_id || status === RideStatus.IDLE || status === RideStatus.COMPLETED) return;
      const driverTrackingChannel = supabase.channel(`track-driver-${selectedDriver.driver_id}`).on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${selectedDriver.driver_id}` }, (payload) => {
          const newLat = payload.new.lat; const newLng = payload.new.lng; if (newLat && newLng) { setNearbyDrivers(prev => { const exists = prev.some(d => d.id === selectedDriver.driver_id); if (exists) { return prev.map(d => d.id === selectedDriver.driver_id ? { ...d, lat: newLat, lng: newLng } : d); } else { return [...prev, { id: selectedDriver.driver_id!, type: 'driver', lat: newLat, lng: newLng, label: selectedDriver.carModel }]; } }); }
      }).subscribe();
      return () => { supabase.removeChannel(driverTrackingChannel); };
  }, [selectedDriver, status]);

  useEffect(() => {
    const fetchAdvice = async () => { if (pickup && destination && calculatedPrice > 0) { const result = await getSmartPriceAdvice(pickup, destination, calculatedPrice); setSmartAdvice({ advice: result.advice, prob: result.successProbability }); } };
    const timer = setTimeout(fetchAdvice, 1000);
    return () => clearTimeout(timer);
  }, [pickup, destination, calculatedPrice]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (authMode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) {
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
          if (profile) {
            setUserProfile(prev => ({
              ...prev, id: data.user!.id, name: profile.full_name || 'Usuario', email: profile.email || '', phone: profile.phone || '', avatar_url: profile.avatar_url || '', card_name: profile.card_name, card_last4: profile.card_last4, card_expiry: profile.card_expiry, card_brand: profile.card_brand, saved_home: profile.saved_home, saved_work: profile.saved_work,
            }));
            setIsAuthenticated(true);
          }
        }
      } else { // Register Mode
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: 'PASSENGER'
            }
          }
        });
        if (error) throw error;
        alert('¡Registro exitoso! Revisa tu correo para confirmar tu cuenta antes de iniciar sesión.');
        setAuthMode('login'); // Switch back to login view
      }
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestRide = async () => {
      if (!destination) return alert("Por favor indica un destino."); if (Notification.permission === 'default') { Notification.requestPermission(); } setLoading(true);
      try {
          const { data, error } = await supabase.from('rides').insert({ passenger_id: userProfile.id, pickup_label: pickup, destination_label: destination, pickup_address: pickup, destination_address: destination, price: calculatedPrice, status: RideStatus.REQUESTING, pickup_lat: passengerLocation[0], pickup_lng: passengerLocation[1] }).select().single(); if (error) throw error;
          setActiveRide(data); setStatus(RideStatus.REQUESTING); setAvailableTarifas([]); showToast("Solicitando conductores...", "info");
      } catch (err: any) { alert("Error: " + err.message); } finally { setLoading(false); }
  };
  
  const handleScheduleRide = async (scheduledFor: string) => {
      if (!destination) return alert("Por favor indica un destino."); setLoading(true);
      try {
          const { data, error } = await supabase.from('rides').insert({ passenger_id: userProfile.id, pickup_label: pickup, destination_label: destination, price: calculatedPrice, status: RideStatus.SCHEDULED, scheduled_for: scheduledFor, pickup_lat: passengerLocation[0], pickup_lng: passengerLocation[1] }).select().single(); if (error) throw error;
          setActiveRide(data); setStatus(RideStatus.SCHEDULED); setScheduleModalOpen(false); showToast(`Viaje programado para ${new Date(scheduledFor).toLocaleTimeString()}`, 'success');
      } catch (err: any) { alert("Error al programar: " + err.message); } finally { setLoading(false); }
  };

  const handleAcceptTarifa = async (tarifa: DriverTarifa) => {
      let driverPhone = ''; if (tarifa.driver_id) { const { data } = await supabase.from('profiles').select('phone').eq('id', tarifa.driver_id).single(); if (data) driverPhone = data.phone; } setSelectedDriver({ ...tarifa, phone: driverPhone }); setLoading(true);
      try { if (activeRide?.id) { const { error } = await supabase.rpc('accept_ride_offer', { ride_uuid: activeRide.id, offer_uuid: tarifa.id }); if (error) throw error; } setStatus(RideStatus.ACCEPTED); showToast("Has aceptado al conductor.", "success"); } catch (err: any) { alert("Error: " + err.message); } finally { setLoading(false); }
  };

  const handleCallDriver = () => selectedDriver?.phone ? window.location.href = `tel:${selectedDriver.phone}` : showToast("Sin número disponible", 'error');
  const handleShareTrip = async () => { if (navigator.share) { try { await navigator.share({ title: 'Viaje Zippy', text: `Voy en taxi a ${destination}.`, url: 'https://zippy.mx' }); } catch (err) { console.error(err); } } else { showToast('Enlace copiado', 'info'); } };

  const handleFinishRide = async () => {
      setLoading(true);
      try { if (tipAmount > 0 && selectedDriver) { await supabase.from('notifications').insert({ title: '¡Propina!', message: `Pasajero envió $${tipAmount}.00 MXN.`, target: 'DRIVERS' }); } setShowThankYouScreen(true); } 
      catch (err) { console.error(err); setStatus(RideStatus.IDLE); } finally { setLoading(false); }
  };

  const handleCloseThankYouScreen = () => { setShowThankYouScreen(false); setStatus(RideStatus.IDLE); setRating(0); setTipAmount(0); setCustomTip(''); setShowCustomTipInput(false); setActiveRide(null); setSelectedDriver(null); setAvailableTarifas([]); showToast("¡Gracias por viajar con Zippy!", 'success'); };
  const handleCancelRide = async () => {
      if (!activeRide?.id) return;
      const confirmCancel = window.confirm("¿Seguro que deseas cancelar el viaje?");
      if (confirmCancel) {
          try { setLoading(true); const { error } = await supabase.from('rides').update({ status: 'CANCELLED' }).eq('id', activeRide.id); if (error) throw error;
              setStatus(RideStatus.IDLE); setActiveRide(null); setSelectedDriver(null); setAvailableTarifas([]); showToast("Viaje cancelado.", "info");
          } catch (err: any) { alert("Error al cancelar: " + err.message); } finally { setLoading(false); }
      }
  };
  
  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.from('profiles').update({ full_name: userProfile.name, phone: userProfile.phone, email: userProfile.email, saved_home: userProfile.saved_home, saved_work: userProfile.saved_work }).eq('id', userProfile.id); if (error) throw error;
      setIsEditingProfile(false); showToast('Perfil guardado', 'success');
    } catch(err: any) { showToast('Error al guardar', 'error'); } finally { setLoading(false); }
  };
  
  const handleRequestService = (serviceName: string) => showToast(`Servicio ${serviceName} solicitado`, 'info');
  const handleAvatarChange = (e: any) => { if(e.target.files[0]) { setAvatarFile(e.target.files[0]); setAvatarPreview(URL.createObjectURL(e.target.files[0])); setIsEditingProfile(true); }};
  
  const handleSaveCard = async (cardData: any) => {
    setLoading(true);
    try {
        const { error } = await supabase.from('profiles').update({ card_name: cardData.name, card_last4: cardData.number.slice(-4), card_expiry: cardData.expiry, card_brand: cardData.brand }).eq('id', userProfile.id); if (error) throw error;
        setUserProfile(prev => ({ ...prev, card_name: cardData.name, card_last4: cardData.number.slice(-4), card_expiry: cardData.expiry, card_brand: cardData.brand }));
        showToast('Tarjeta guardada con éxito', 'success'); setAddCardOpen(false);
    } catch(err: any) { showToast('Error al guardar la tarjeta', 'error'); console.error(err); } finally { setLoading(false); }
  };

  const handleDeleteCard = async () => {
    if (!confirm('¿Seguro que quieres eliminar esta tarjeta?')) return; setLoading(true);
    try {
        const { error } = await supabase.from('profiles').update({ card_name: null, card_last4: null, card_expiry: null, card_brand: null }).eq('id', userProfile.id); if (error) throw error;
        setUserProfile(prev => ({ ...prev, card_name: '', card_last4: '', card_expiry: '', card_brand: '' })); showToast('Tarjeta eliminada', 'info');
    } catch (err: any) { showToast('Error al eliminar la tarjeta', 'error'); } finally { setLoading(false); }
  };

  const renderThankYouScreen = () => ( <div className="fixed inset-0 z-[100] bg-zippy-dark/90 backdrop-blur-xl flex flex-col items-center justify-center p-6 animate-fade-in"> <div className="bg-white p-10 rounded-[40px] w-full max-w-sm shadow-2xl text-center"> <div className="w-24 h-24 bg-zippy-main rounded-full mx-auto flex items-center justify-center text-zippy-dark mb-6 shadow-xl animate-bounce"> <ThumbsUp size={48} /> </div> <h2 className="text-2xl font-black text-zippy-dark mb-2">¡Gracias por tu viaje!</h2> <p className="text-gray-500 font-medium mb-8">Tu calificación nos ayuda a mejorar Zippy para todos.</p> {tipAmount > 0 && ( <div className="bg-green-50 p-3 rounded-xl border border-green-100 mb-8"> <p className="text-green-700 font-bold text-sm">Tu propina de ${tipAmount} ha sido enviada.</p> </div> )} <button onClick={handleCloseThankYouScreen} className="w-full bg-zippy-dark text-white font-black py-4 rounded-2xl shadow-xl hover:bg-zippy-light transition-all">Finalizar</button> </div> </div> );
  const renderDriverProfileModal = () => { if (!viewingDriver) return null; return ( <div className="fixed inset-0 z-[70] bg-zippy-dark/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"> <div className="bg-white w-full max-w-sm rounded-[40px] overflow-hidden shadow-2xl relative animate-slide-up h-[80vh] flex flex-col"> <button onClick={() => setViewingDriver(null)} className="absolute top-4 right-4 z-10 p-2 bg-black/20 text-white rounded-full hover:bg-black/40 backdrop-blur-sm transition-colors"><X size={20} /></button> <div className="h-1/3 bg-zippy-dark relative"><img src={viewingDriver.avatarUrl} className="w-full h-full object-cover opacity-80" alt="Driver" /><div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div><div className="absolute bottom-6 left-6 text-white"><h2 className="text-3xl font-black leading-none mb-1">{viewingDriver.name}</h2><div className="flex items-center gap-2 text-xs font-bold opacity-90 uppercase tracking-widest"><span className="bg-zippy-accent text-zippy-dark px-2 py-0.5 rounded">★ {viewingDriver.rating}</span><span>• {viewingDriver.tripsCompleted} Viajes</span></div></div></div> <div className="flex-1 bg-white relative -mt-6 rounded-t-[32px] p-6 overflow-y-auto"><div className="flex items-center gap-2 mb-6 bg-green-50 p-3 rounded-2xl border border-green-100"><ShieldCheck size={20} className="text-green-600" /><div><h4 className="font-black text-green-800 text-xs uppercase tracking-wide">Conductor Verificado</h4><p className="text-[10px] text-green-600 font-medium">Documentación y antecedentes validados.</p></div></div><div className="space-y-4 mb-6"><h3 className="text-sm font-black text-zippy-dark uppercase tracking-widest border-b border-gray-100 pb-2">Vehículo</h3><div className="flex items-center justify-between"><div><p className="font-bold text-gray-800 text-lg">{viewingDriver.carModel}</p><p className="text-xs text-gray-400 font-medium">Placas: <span className="font-mono text-gray-600 bg-gray-100 px-1 rounded">{viewingDriver.carPlate}</span></p></div><div className="text-right"><p className="text-xs text-gray-400 font-bold uppercase">No. Económico</p><p className="text-xl font-black text-zippy-dark">{viewingDriver.taxiNumber}</p></div></div></div></div> <div className="p-4 border-t border-gray-100 bg-white"><button onClick={() => { handleAcceptTarifa(viewingDriver); setViewingDriver(null); }} className="w-full bg-zippy-dark text-white font-black py-4 rounded-2xl shadow-xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform"><Check size={20} /> ACEPTAR VIAJE POR ${viewingDriver.price}</button></div> </div> </div> ); };
  const renderProfile = () => ( <div className="absolute inset-0 z-40 bg-gray-50 flex flex-col overflow-y-auto animate-slide-up pb-24"> <div className="bg-zippy-main p-8 pt-10 rounded-b-[40px] shadow-xl relative"> <button onClick={() => setView('home')} className="absolute top-4 left-4 p-2 bg-white/20 rounded-full hover:bg-white/30 text-zippy-dark"><ArrowLeft size={20} /></button> <div className="flex flex-col items-center"> <div className="relative group"> <div className="w-28 h-28 rounded-full border-4 border-white shadow-xl overflow-hidden mb-4 relative bg-zippy-dark"> <img src={avatarPreview || userProfile.avatar_url || `https://ui-avatars.com/api/?name=${userProfile.name}&background=random`} className="w-full h-full object-cover" /> </div> <label className="absolute bottom-0 right-0 p-2 bg-zippy-dark rounded-full text-white shadow-lg cursor-pointer hover:scale-110 transition-transform"> <Camera size={16} /> <input type="file" ref={fileInputRef} onChange={handleAvatarChange} className="hidden" accept="image/*" /> </label> </div> <h2 className="text-2xl font-black text-zippy-dark uppercase tracking-tight">{userProfile.name}</h2> <p className="text-xs font-bold text-zippy-dark/60 uppercase tracking-widest mt-1">Pasajero VIP</p> </div> </div> <div className="p-6 space-y-6"> <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 space-y-4"> <h3 className="text-sm font-black text-zippy-dark uppercase tracking-widest border-b border-gray-100 pb-2">Información Personal</h3> <div> <label className="text-[10px] font-bold text-gray-400 uppercase">Nombre</label> <input value={userProfile.name} onChange={e=>setUserProfile({...userProfile, name: e.target.value})} className="w-full font-bold text-zippy-dark border-b border-gray-100 py-1 outline-none focus:border-zippy-main" disabled={!isEditingProfile} /> </div> <div> <label className="text-[10px] font-bold text-gray-400 uppercase">Teléfono</label> <input value={userProfile.phone} onChange={e=>setUserProfile({...userProfile, phone: e.target.value})} className="w-full font-bold text-zippy-dark border-b border-gray-100 py-1 outline-none focus:border-zippy-main" disabled={!isEditingProfile} /> </div> <div> <label className="text-[10px] font-bold text-gray-400 uppercase">Email</label> <input value={userProfile.email} onChange={e=>setUserProfile({...userProfile, email: e.target.value})} className="w-full font-bold text-zippy-dark border-b border-gray-100 py-1 outline-none focus:border-zippy-main" disabled={!isEditingProfile} /> </div> </div> <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 space-y-4"> <h3 className="text-sm font-black text-zippy-dark uppercase tracking-widest border-b border-gray-100 pb-2">Direcciones Guardadas</h3> <div> <label className="text-[10px] font-bold text-gray-400 uppercase">Casa</label> <input value={userProfile.saved_home} onChange={e=>setUserProfile({...userProfile, saved_home: e.target.value})} className="w-full font-bold text-zippy-dark border-b border-gray-100 py-1 outline-none focus:border-zippy-main" disabled={!isEditingProfile} /> </div> <div> <label className="text-[10px] font-bold text-gray-400 uppercase">Trabajo</label> <input value={userProfile.saved_work} onChange={e=>setUserProfile({...userProfile, saved_work: e.target.value})} className="w-full font-bold text-zippy-dark border-b border-gray-100 py-1 outline-none focus:border-zippy-main" disabled={!isEditingProfile} /> </div> </div> <button onClick={isEditingProfile ? handleSaveProfile : () => setIsEditingProfile(true)} className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 ${isEditingProfile ? 'bg-zippy-dark text-white' : 'bg-gray-200 text-gray-500'}`}> {isEditingProfile ? <><Save size={18} /> Guardar Cambios</> : 'Editar Perfil'} </button> </div> </div> );
  const renderHistory = () => ( <div className="absolute inset-0 z-40 bg-gray-50 flex flex-col overflow-y-auto animate-slide-up pb-24"> <div className="bg-white p-6 shadow-sm sticky top-0 z-10 flex items-center gap-4"> <button onClick={() => setView('home')} className="p-2 hover:bg-gray-100 rounded-full"><ArrowLeft size={20} className="text-zippy-dark" /></button> <h2 className="text-xl font-black text-zippy-dark uppercase tracking-tight">Mis Viajes</h2> </div> <div className="p-4 space-y-3"> {history.length === 0 ? (<div className="text-center p-10 text-gray-400"><History size={32} className="mx-auto mb-4"/> <p className="font-bold">Aún no tienes viajes</p></div>) : (history.map((ride) => ( <button key={ride.id} onClick={() => setViewingHistoryDetail(ride)} className="w-full bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-left hover:border-zippy-main transition-colors"> <div className="flex justify-between items-start mb-2"> <span className="text-[10px] font-black text-gray-400 uppercase">Hace {Math.ceil((Date.now() - new Date(ride.created_at!).getTime()) / 86400000)} días</span> <span className="font-bold text-zippy-dark">${ride.price}.00</span> </div> <div className="flex items-center gap-3"> <div className={`p-2 rounded-xl ${ride.status === RideStatus.COMPLETED ? 'bg-green-50' : 'bg-red-50'}`}><MapPin size={16} className={ride.status === RideStatus.COMPLETED ? 'text-green-600' : 'text-red-600'}/></div> <div> <p className="font-bold text-zippy-dark text-sm">{ride.destination_label}</p> <p className={`text-[10px] font-bold uppercase ${ride.status === RideStatus.COMPLETED ? 'text-green-600' : 'text-red-600'}`}>{ride.status === RideStatus.COMPLETED ? 'Completado' : 'Cancelado'}</p> </div> </div> </button> )))} </div> </div> );
  const renderHistoryDetail = () => { if (!viewingHistoryDetail) return null; const ride = viewingHistoryDetail; const isCompleted = ride.status === RideStatus.COMPLETED; return ( <div className="absolute inset-0 z-50 bg-gray-50 flex flex-col animate-slide-up"> <div className="flex-shrink-0 relative h-48 bg-gray-200"> <MapVisual status="COMPLETED" routeStart={[19.5430, -99.1955]} routeEnd={[19.5108, -99.2335]} /> <div className="absolute inset-0 bg-black/30"></div> <button onClick={() => setViewingHistoryDetail(null)} className="absolute top-4 left-4 p-2 bg-white/20 text-white rounded-full hover:bg-white/30 backdrop-blur-sm"><ArrowLeft size={20} /></button> <div className="absolute bottom-4 left-4 text-white"> <h2 className="text-2xl font-black">Detalle del Viaje</h2> <p className="text-xs font-bold opacity-80">{new Date(ride.created_at!).toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p> </div> </div> <div className="flex-1 overflow-y-auto p-6 space-y-6"> <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 space-y-4"> <div className="flex items-center justify-between"> <h3 className="text-sm font-black text-zippy-dark uppercase tracking-widest">Recibo</h3> <span className={`text-xs font-black uppercase px-2 py-1 rounded-full ${isCompleted ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{isCompleted ? 'Pagado' : 'Cancelado'}</span> </div> <div className="space-y-2 border-t border-gray-100 pt-4"> <div className="flex justify-between text-sm"><span className="font-medium text-gray-500">Tarifa de viaje</span><span className="font-bold text-gray-800">${ride.price}.00</span></div> <div className="flex justify-between text-sm"><span className="font-medium text-gray-500">Propina</span><span className="font-bold text-gray-800">$0.00</span></div> <div className="flex justify-between text-lg border-t border-dashed mt-2 pt-2"><span className="font-black text-zippy-dark">Total</span><span className="font-black text-zippy-dark">${ride.price}.00</span></div> </div> </div> {isCompleted && ride.driver_name && ( <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100"> <h3 className="text-sm font-black text-zippy-dark uppercase tracking-widest mb-4">Tu Conductor</h3> <div className="flex items-center gap-4"> <img src={ride.driver_avatar_url} className="w-14 h-14 rounded-full object-cover border-2 border-zippy-main" /> <div> <p className="font-bold text-zippy-dark text-lg">{ride.driver_name}</p> <div className="flex items-center gap-1 text-yellow-500"> {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={14} className={i < (ride.rating_given || 0) ? 'fill-current' : 'text-gray-200'}/>)} </div> </div> </div> </div> )} <div className="grid grid-cols-2 gap-3 pt-4"> <button className="py-4 rounded-xl bg-gray-100 text-gray-600 font-black text-xs uppercase flex items-center justify-center gap-2"><AlertCircle size={16}/>Reportar Problema</button> <button className="py-4 rounded-xl bg-zippy-main text-zippy-dark font-black text-xs uppercase flex items-center justify-center gap-2"><RefreshCw size={16}/>Volver a Pedir</button> </div> </div> </div>); };
  const renderPayment = () => ( <div className="absolute inset-0 z-40 bg-gray-50 flex flex-col overflow-y-auto animate-slide-up pb-24"> <div className="bg-zippy-dark text-white p-8 pt-10 rounded-b-[40px] shadow-xl relative"> <button onClick={() => setView('home')} className="absolute top-4 left-4 p-2 bg-white/10 rounded-full hover:bg-white/20"><ArrowLeft size={20} /></button> <h2 className="text-xl font-black uppercase tracking-tight">Billetera</h2> </div> <div className="p-6"> <h3 className="font-black text-zippy-dark text-sm uppercase tracking-widest mb-4">Métodos de Pago</h3> <div className="space-y-3"> <button className="w-full bg-white p-4 rounded-2xl shadow-sm border-2 border-zippy-main flex items-center gap-4"> <div className="p-2 bg-green-50 text-green-600 rounded-xl"><DollarSign size={20}/></div> <span className="font-bold text-gray-700">Efectivo</span> <div className="ml-auto w-5 h-5 bg-zippy-main rounded-full border-2 border-zippy-dark flex items-center justify-center"><Check size={12}/></div> </button> {userProfile.card_last4 ? ( <div className="w-full bg-white p-4 rounded-2xl shadow-sm border-2 border-transparent flex items-center gap-4"> <div className="p-2 bg-gray-100 text-gray-500 rounded-xl"><CreditCard size={20}/></div> <div className="flex-1"><p className="font-bold text-gray-700">Terminada en {userProfile.card_last4}</p><p className="text-xs text-gray-400 font-bold">{userProfile.card_brand || 'Tarjeta'} • Exp {userProfile.card_expiry}</p></div> <button onClick={handleDeleteCard} className="p-2 text-gray-300 hover:text-red-500"><Trash2 size={16}/></button> </div> ) : ( <button onClick={() => setAddCardOpen(true)} className="w-full bg-white p-4 rounded-2xl shadow-sm border-2 border-dashed border-gray-200 flex items-center gap-4 hover:border-zippy-main transition-colors"> <div className="p-2 bg-gray-50 text-gray-400 rounded-xl"><Plus size={20}/></div> <span className="font-bold text-gray-500">Agregar Tarjeta</span> </button> )} </div> </div> </div> );
  const renderServices = () => ( <div className="absolute inset-0 z-40 bg-gray-50 flex flex-col overflow-y-auto animate-slide-up pb-24"> <div className="bg-white p-6 shadow-sm sticky top-0 z-10 flex items-center gap-4"> <button onClick={() => setView('home')} className="p-2 hover:bg-gray-100 rounded-full"><ArrowLeft size={20} className="text-zippy-dark" /></button> <h2 className="text-xl font-black text-zippy-dark uppercase tracking-tight">Servicios</h2> </div> <div className="p-6 grid grid-cols-2 gap-4"> <button onClick={()=>handleRequestService('Taxi')} className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 flex flex-col items-center gap-3 hover:border-zippy-main transition-colors"> <div className="p-4 bg-zippy-main/10 rounded-full text-zippy-dark"><Car size={32} /></div> <span className="font-black text-zippy-dark text-sm">Taxi</span> </button> <button onClick={()=>handleRequestService('Envíos')} className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 flex flex-col items-center gap-3 hover:border-zippy-main transition-colors"> <div className="p-4 bg-blue-50 rounded-full text-blue-600"><Truck size={32} /></div> <span className="font-black text-gray-700 text-sm">Envíos</span> </button> <button onClick={()=>handleRequestService('Fletes')} className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 flex flex-col items-center gap-3 hover:border-zippy-main transition-colors"> <div className="p-4 bg-orange-50 rounded-full text-orange-600"><Briefcase size={32} /></div> <span className="font-black text-gray-700 text-sm">Fletes</span> </button> <button onClick={()=>handleRequestService('Asistencia')} className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 flex flex-col items-center gap-3 hover:border-zippy-main transition-colors"> <div className="p-4 bg-red-50 rounded-full text-red-600"><Wrench size={32} /></div> <span className="font-black text-gray-700 text-sm">Asistencia</span> </button> </div> </div> );
  const renderRatingView = () => ( <div className="absolute inset-x-0 bottom-0 z-[60] pointer-events-none p-0 flex flex-col overflow-hidden h-[90vh]"> <div className="pointer-events-auto bg-white rounded-t-[40px] p-8 shadow-[0_-10px_40px_rgba(0,0,0,0.2)] animate-slide-up flex flex-col h-full relative"> <div className="flex flex-col items-center mb-6 text-center"> <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-zippy-main to-zippy-dark mb-4"> <img src={selectedDriver?.avatarUrl || "https://ui-avatars.com/api/?name=C&background=random"} alt="Driver" className="w-full h-full rounded-full object-cover border-4 border-white" /> </div> <h2 className="text-2xl font-black text-zippy-dark mb-1">¿Qué tal tu viaje con {selectedDriver?.name?.split(' ')[0]}?</h2> </div> <div className="flex justify-center gap-3 mb-4"> {[1, 2, 3, 4, 5].map((star) => ( <button key={star} onClick={() => setRating(star)} className={`transition-all active:scale-90 ${star <= rating ? 'text-zippy-accent scale-110' : 'text-gray-200'}`}> <Star size={40} className="fill-current" /> </button> ))} </div> <div className="flex-1 overflow-y-auto -mx-8 px-8 py-4"> <div className="my-2"> <h3 className="text-center font-black text-zippy-dark text-sm uppercase tracking-widest mb-4">Añadir Propina (Opcional)</h3> <div className="flex justify-center gap-2 mb-4"> {[10, 20, 50].map((amount) => ( <button key={amount} onClick={() => { setTipAmount(amount); setCustomTip(''); setShowCustomTipInput(false); }} className={`px-5 py-3 rounded-full font-black text-sm border-2 transition-all ${tipAmount === amount && !showCustomTipInput ? 'bg-zippy-dark text-white border-zippy-dark' : 'bg-gray-100 text-gray-500 border-gray-100'}`} > ${amount} </button> ))} <button onClick={() => { setShowCustomTipInput(true); setTipAmount(0); setCustomTip(''); }} className={`px-5 py-3 rounded-full font-black text-sm border-2 transition-all ${showCustomTipInput ? 'bg-zippy-dark text-white border-zippy-dark' : 'bg-gray-100 text-gray-500 border-gray-100'}`} > Otro </button> </div> {showCustomTipInput && ( <div className="relative w-full max-w-xs mx-auto animate-fade-in"> <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zippy-dark font-black text-lg">$</span> <input type="number" value={customTip} onChange={(e) => { setCustomTip(e.target.value); setTipAmount(Number(e.target.value)); }} className="w-full bg-gray-50 border-2 border-gray-100 rounded-full py-3 pl-10 pr-4 text-center font-black text-xl text-zippy-dark outline-none focus:border-zippy-main" placeholder="0" autoFocus /> </div> )} </div> </div> <button onClick={handleFinishRide} disabled={loading || rating === 0} className="w-full bg-zippy-dark text-white font-black py-5 rounded-[24px] shadow-xl text-sm uppercase tracking-widest flex items-center justify-center gap-2 mt-auto disabled:opacity-50 flex-shrink-0" > {loading ? <Loader2 className="animate-spin" /> : (tipAmount > 0 ? `Enviar y Pagar Propina ($${tipAmount})` : 'ENVIAR CALIFICACIÓN')} </button> </div> </div> );

  return (
    <div className="relative w-full h-full bg-gray-100 overflow-hidden flex flex-col font-sans">
      <NotificationToast message={toast.msg} type={toast.type} isVisible={toast.visible} onClose={() => setToast({ ...toast, visible: false })} />
      <MapVisual status={status === RideStatus.RATING ? RideStatus.COMPLETED : status} entities={nearbyDrivers} userLocation={passengerLocation} routeStart={routeStart} routeEnd={routeEnd} />
      {tripDistance && (status === RideStatus.ACCEPTED || status === RideStatus.ARRIVED || status === RideStatus.IN_PROGRESS) && ( <div className="absolute top-24 left-1/2 -translate-x-1/2 z-30 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-xl border border-zippy-dark/10 flex items-center gap-2 animate-slide-down"> <Navigation size={14} className="text-zippy-dark" /> <span className="text-xs font-black text-zippy-dark">{tripDistance}</span> </div> )}
      {showThankYouScreen && renderThankYouScreen()}
      {viewingDriver && renderDriverProfileModal()}
      {view === 'home' && status !== RideStatus.RATING && ( <div className="absolute top-0 left-0 right-0 p-4 z-30 flex justify-between items-center"> <button onClick={() => setDrawerOpen(true)} className="p-4 bg-white shadow-xl rounded-2xl text-zippy-dark active:scale-90 transition-transform"><Menu size={24}/></button> <div className="flex gap-2"> <button onClick={onBack} className="p-4 bg-white shadow-xl rounded-2xl text-red-500 active:scale-90 transition-transform"><LogOut size={24}/></button> <button onClick={() => setAssistantOpen(true)} className="p-4 bg-zippy-dark text-zippy-accent shadow-xl rounded-2xl animate-pulse"><MessageSquare size={24}/></button> </div> </div> )}
      {view === 'home' && status !== RideStatus.RATING && ( <div className={`absolute inset-x-0 bottom-0 z-30 pointer-events-none p-0 flex flex-col overflow-hidden transition-transform duration-300 ease-in-out ${isMinimized ? 'translate-y-[85%]' : 'translate-y-0'}`}> <div className="pointer-events-auto flex justify-end px-4 pb-2"> <button onClick={() => setIsMinimized(!isMinimized)} className="bg-white text-zippy-dark p-2 rounded-full shadow-lg border border-gray-100 hover:bg-gray-50 active:scale-90 transition-transform"> {isMinimized ? <ChevronUp size={24} /> : <ChevronDown size={24} />} </button> </div> 
      {status === RideStatus.IDLE && ( <div className="pointer-events-auto bg-white rounded-t-[40px] p-8 shadow-2xl border-t border-gray-100 animate-slide-up pb-10"> <div className="text-center mb-8"> <img src="https://tritex.com.mx/zippylogo.png" className="h-8 mx-auto mb-2 object-contain" /> <h2 className="text-2xl font-black text-zippy-dark tracking-tight">¿A dónde <span className="text-zippy-main">vamos?</span></h2> </div> <div className="space-y-4 mb-6"> <div className="bg-gray-50 p-4 rounded-2xl flex items-center gap-4 border border-gray-100"> <MapPin size={20} className="text-green-500" /> <input type="text" value={pickup} onChange={e=>setPickup(e.target.value)} placeholder="¿Dónde te recogemos?" className="bg-transparent w-full font-bold outline-none text-zippy-dark" /> </div> <div className="bg-gray-50 p-4 rounded-2xl flex items-center gap-4 border border-gray-100 focus-within:border-zippy-main relative"> <Navigation size={20} className="text-red-500 flex-shrink-0" /> <input type="text" value={destination} onChange={e=>setDestination(e.target.value)} placeholder="¿A dónde vas?" className="bg-transparent w-full font-bold outline-none text-zippy-dark" /> <div className="flex gap-2"><button onClick={() => userProfile.saved_home && setDestination(userProfile.saved_home)} className="p-2 bg-gray-200 rounded-full hover:bg-zippy-main/50"><Home size={14}/></button><button onClick={() => userProfile.saved_work && setDestination(userProfile.saved_work)} className="p-2 bg-gray-200 rounded-full hover:bg-zippy-main/50"><Building2 size={14}/></button></div></div> </div> <div className="flex items-center justify-between mb-6 bg-gray-50 p-4 rounded-2xl"> <div className="flex items-center gap-3"> <span className="text-2xl font-black text-zippy-dark">$</span> <input type="number" value={calculatedPrice} onChange={e=>setCalculatedPrice(Number(e.target.value))} className="bg-transparent text-2xl font-black text-zippy-dark outline-none w-20" /> </div> <div className="text-right"> <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">TU TARIFA</span> {smartAdvice && <span className="text-[9px] font-bold text-zippy-main">{smartAdvice.advice}</span>} </div> </div> <div className="flex gap-2"><button onClick={handleRequestRide} disabled={loading} className="flex-1 w-full bg-zippy-dark text-white font-black py-5 rounded-[24px] text-lg shadow-2xl active:scale-95 transition-all flex justify-center items-center gap-2"> {loading ? <Loader2 className="animate-spin" /> : 'AHORA'} </button><button onClick={()=> setScheduleModalOpen(true)} className="p-5 bg-gray-100 text-zippy-dark rounded-2xl shadow-inner"><Calendar size={24}/></button></div> </div> )}
      {status === RideStatus.SCHEDULED && activeRide && ( <div className="pointer-events-auto bg-white rounded-t-[40px] p-8 shadow-2xl animate-slide-up text-center"> <Clock size={32} className="mx-auto text-zippy-main mb-4"/> <h3 className="text-xl font-black text-zippy-dark uppercase">Viaje Programado</h3> <p className="text-gray-500 font-bold mb-4">Destino: {activeRide.destination_label}</p> <div className="bg-gray-50 p-4 rounded-2xl mb-6"> <p className="text-sm font-bold text-gray-500">Tu viaje se solicitará el</p> <p className="text-2xl font-black text-zippy-dark">{new Date(activeRide.scheduled_for!).toLocaleString('es-MX', { weekday: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p> </div> <button onClick={handleCancelRide} className="w-full bg-red-50 text-red-600 font-black py-4 rounded-2xl shadow-lg">Cancelar Viaje</button> </div>)}
      {status === RideStatus.REQUESTING && ( <div className="pointer-events-auto bg-white rounded-t-[40px] p-6 shadow-2xl flex-1 flex flex-col overflow-hidden animate-slide-up h-[60vh]"> <div className="flex justify-between items-center mb-6"> <h3 className="text-xl font-black text-zippy-dark uppercase tracking-tight">Conductores Cerca</h3> <button onClick={()=>setStatus(RideStatus.IDLE)} className="p-2 text-gray-400"><X size={20}/></button> </div> <div className="flex-1 overflow-y-auto"> <OffersList tarifas={availableTarifas} onAccept={handleAcceptTarifa} onDecline={(id) => setAvailableTarifas(prev => prev.filter(o => o.id !== id))} onViewProfile={setViewingDriver} /> </div> </div> )} {(status === RideStatus.ACCEPTED || status === RideStatus.ARRIVED || status === RideStatus.IN_PROGRESS) && selectedDriver && ( <div className="pointer-events-auto bg-white rounded-t-[40px] shadow-[0_-10px_40px_rgba(0,0,0,0.15)] animate-slide-up relative overflow-hidden"> <div className="bg-green-600 px-6 py-2 flex items-center justify-between"> <div className="flex items-center gap-2 text-white"> <ShieldCheck size={16} /> <span className="text-[10px] font-black uppercase tracking-widest">Conductor 100% Verificado</span> </div> <button onClick={handleCancelRide} className="flex items-center gap-1 bg-white/20 hover:bg-white/30 px-2 py-1 rounded-lg transition-colors"> <XCircle size={12} className="text-white" /> <span className="text-[9px] font-black text-white uppercase">Cancelar</span> </button> </div> <div className="p-6 pb-8"> <div className="flex items-start justify-between mb-6"> <div className="flex items-center gap-4"> <div className="w-16 h-16 rounded-full p-1 bg-gradient-to-tr from-zippy-main to-zippy-dark"> <img src={selectedDriver.avatarUrl} alt="Driver" className="w-full h-full rounded-full object-cover border-2 border-white" /> </div> <div> <h2 className="text-2xl font-black text-zippy-dark leading-none mb-1">{selectedDriver.name}</h2> <div className="flex items-center gap-2 text-gray-500 text-[10px] font-bold uppercase"> <span>★ {selectedDriver.rating}</span> <span>•</span> <span>{selectedDriver.tripsCompleted} Viajes</span> </div> </div> </div> <div className={`px-3 py-1.5 rounded-lg font-black text-[9px] uppercase tracking-widest ${status === RideStatus.ARRIVED ? 'bg-zippy-main text-zippy-dark animate-pulse' : 'bg-zippy-dark text-white'}`}> {status === RideStatus.ARRIVED ? '¡Llegó!' : status === RideStatus.IN_PROGRESS ? 'En Viaje' : '3 min'} </div> </div> <div className="flex gap-4 mb-6 bg-gray-50 p-4 rounded-3xl border border-gray-100"> <div className="flex-1 flex flex-col justify-center"> <h3 className="font-bold text-zippy-dark text-sm">{selectedDriver.carModel}</h3> <div className="flex items-center gap-3 mt-1"> <div className="bg-white border border-gray-200 px-2 py-1 rounded text-xs font-mono font-bold text-gray-600">{selectedDriver.carPlate}</div> <span className="text-[10px] font-black text-gray-400 uppercase">Econ. {selectedDriver.taxiNumber}</span> </div> </div> </div> <div className="grid grid-cols-4 gap-2"> <button onClick={handleCallDriver} className="flex flex-col items-center justify-center p-3 bg-gray-100 rounded-2xl active:scale-95 transition-transform hover:bg-zippy-main/20"><Phone size={20} className="text-zippy-dark mb-1" /><span className="text-[8px] font-black uppercase text-gray-500">Llamar</span></button> <button onClick={() => setChatOpen(true)} className="flex flex-col items-center justify-center p-3 bg-gray-100 rounded-2xl active:scale-95 transition-transform hover:bg-zippy-main/20"><MessageSquare size={20} className="text-zippy-dark mb-1" /><span className="text-[8px] font-black uppercase text-gray-500">Chat</span></button> <button onClick={handleShareTrip} className="flex flex-col items-center justify-center p-3 bg-gray-100 rounded-2xl active:scale-95 transition-transform hover:bg-zippy-main/20"><Share2 size={20} className="text-zippy-dark mb-1" /><span className="text-[8px] font-black uppercase text-gray-500">Compartir</span></button> <button onClick={() => setEmergencyOpen(true)} className="flex flex-col items-center justify-center p-3 bg-red-50 rounded-2xl border border-red-100 active:scale-95 transition-transform"><Siren size={20} className="text-red-600 mb-1 animate-pulse" /><span className="text-[8px] font-black uppercase text-red-600">SOS</span></button> </div> </div> </div> )} </div> )}
      <Drawer isOpen={drawerOpen} onClose={()=>setDrawerOpen(false)} onLogout={onBack} currentView={view} onChangeView={setView} onOpenEmergency={()=>setEmergencyOpen(true)} onOpenDriverReg={()=>setDriverRegOpen(true)} userName={userProfile.name} driverApplicationStatus={driverApplicationStatus} onOpenDriverStatus={() => setDriverStatusViewOpen(true)} />
      <AssistantModal isOpen={assistantOpen} onClose={()=>setAssistantOpen(false)} />
      <EmergencyDirectory isOpen={emergencyOpen} onClose={()=>setEmergencyOpen(false)} />
      <DriverRegistration isOpen={driverRegOpen} onClose={()=>setDriverRegOpen(false)} userId={userProfile.id} onRegistrationComplete={() => { setDriverRegOpen(false); const refetchProfile = async () => { const { data: profile } = await supabase.from('profiles').select('verification_status').eq('id', userProfile.id).single(); if (profile) { setDriverApplicationStatus(profile.verification_status || 'pending'); } }; refetchProfile(); }} />
      {status === RideStatus.RATING && renderRatingView()}
      {view === 'profile' && renderProfile()}
      {view === 'history' && !viewingHistoryDetail && renderHistory()}
      {viewingHistoryDetail && renderHistoryDetail()}
      {view === 'payment' && renderPayment()}
      {view === 'services' && renderServices()}
      {addCardOpen && <AddCardModal onClose={() => setAddCardOpen(false)} onSave={handleSaveCard} loading={loading} />}
      {scheduleModalOpen && <ScheduleRideModal onClose={() => setScheduleModalOpen(false)} onSchedule={handleScheduleRide} loading={loading} />}
      {driverStatusViewOpen && <ApplicationStatus isOpen={driverStatusViewOpen} onClose={() => setDriverStatusViewOpen(false)} status={driverApplicationStatus} />}
      <ChatModal isOpen={chatOpen} onClose={() => setChatOpen(false)} onEndChat={() => { setChatOpen(false); showToast("Chat finalizado", "info"); }} rideId={activeRide?.id || ''} currentUserRole="PASSENGER" currentUserId={userProfile.id} counterpartName={selectedDriver?.name || 'Conductor'} counterpartPhone={selectedDriver?.phone} />
      {!isAuthenticated && ( <div className="fixed inset-0 z-[100] bg-zippy-dark/95 backdrop-blur-xl flex items-center justify-center p-6 animate-fade-in"> <div className="bg-white p-8 rounded-[40px] w-full max-w-sm shadow-2xl overflow-hidden relative"> <div className="absolute top-0 left-0 w-full h-2 bg-zippy-main"></div> <div className="text-center mb-8"> <img src="https://tritex.com.mx/zippylogo.png" className="h-10 mx-auto mb-4 object-contain" /> <h2 className="text-2xl font-black text-zippy-dark uppercase tracking-tight">{authMode === 'login' ? 'Bienvenido' : 'Crear Cuenta'}</h2> <p className="text-gray-400 text-xs font-bold mt-1">Ingresa tus datos para continuar</p> </div> <form onSubmit={handleAuth} className="space-y-4"> {authMode === 'register' && ( <input required placeholder="Nombre Completo" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:border-zippy-main transition-colors" value={fullName} onChange={e=>setFullName(e.target.value)} /> )} <input required type="email" placeholder="Correo Electrónico" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:border-zippy-main transition-colors" value={email} onChange={e=>setEmail(e.target.value)} /> <div className="relative"> <input required type={showPassword ? "text" : "password"} placeholder="Contraseña" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:border-zippy-main transition-colors" value={password} onChange={e=>setPassword(e.target.value)} /> <button type="button" onClick={()=>setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-zippy-dark"> {showPassword ? <EyeOff size={20} /> : <Eye size={20} />} </button> </div> <button className="w-full bg-zippy-dark text-white font-black py-4 rounded-2xl shadow-xl hover:bg-zippy-light transition-all flex items-center justify-center gap-2 mt-4 active:scale-95"> {loading ? <Loader2 className="animate-spin" /> : authMode === 'login' ? 'INICIAR SESIÓN' : 'REGISTRARME'} </button> <div className="text-center mt-6"> <button type="button" onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="text-zippy-main font-black text-xs uppercase tracking-widest hover:underline decoration-2 underline-offset-4"> {authMode === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia Sesión'} </button> </div> </form> <button onClick={onBack} className="absolute top-4 right-4 p-2 text-gray-300 hover:text-gray-500"><X size={20} /></button> </div> </div> )}
    </div>
  );
};

const AddCardModal = ({ onClose, onSave, loading }: { onClose: () => void, onSave: (data: any) => void, loading: boolean }) => {
    const [cardData, setCardData] = useState({ number: '', name: '', expiry: '', cvv: '' }); const [cardBrand, setCardBrand] = useState('');
    const formatCardNumber = (value: string) => { const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, ''); const matches = v.match(/\d{4,16}/g); const match = (matches && matches[0]) || ''; const parts = []; for (let i = 0, len = match.length; i < len; i += 4) { parts.push(match.substring(i, i + 4)); } if (parts.length) return parts.join(' '); return value; };
    const formatExpiry = (value: string) => { const v = value.replace(/[^0-9]/gi, ''); if (v.length >= 3) return `${v.slice(0, 2)}/${v.slice(2, 4)}`; return v; };
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => { let { name, value } = e.target; if (name === 'number') { value = formatCardNumber(value); if (value.startsWith('4')) setCardBrand('Visa'); else if (value.startsWith('5')) setCardBrand('Mastercard'); else setCardBrand(''); } if (name === 'expiry') value = formatExpiry(value); if (name === 'cvv') value = value.replace(/[^0-9]/gi, '').slice(0, 4); setCardData(prev => ({ ...prev, [name]: value })); };
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave({ ...cardData, brand: cardBrand, number: cardData.number.replace(/\s/g, '') }); };
    return ( <div className="fixed inset-0 z-[100] bg-zippy-dark/90 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in"> <div className="bg-white w-full max-w-sm rounded-[32px] shadow-2xl overflow-hidden relative"> <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full text-gray-400 hover:text-zippy-dark z-20"><X size={20} /></button> <div className="p-6"> <h2 className="text-xl font-black text-zippy-dark uppercase mb-6">Agregar Tarjeta</h2> <form onSubmit={handleSubmit} className="space-y-4"> <input name="number" value={cardData.number} onChange={handleInputChange} maxLength={19} placeholder="Número de Tarjeta" className="w-full p-3 bg-gray-50 rounded-xl font-bold text-sm" /> <input name="name" value={cardData.name} onChange={handleInputChange} placeholder="Nombre en la Tarjeta" className="w-full p-3 bg-gray-50 rounded-xl font-bold text-sm" /> <div className="grid grid-cols-2 gap-3"> <input name="expiry" value={cardData.expiry} onChange={handleInputChange} maxLength={5} placeholder="MM/AA" className="w-full p-3 bg-gray-50 rounded-xl font-bold text-sm" /> <input name="cvv" value={cardData.cvv} onChange={handleInputChange} maxLength={4} placeholder="CVV" className="w-full p-3 bg-gray-50 rounded-xl font-bold text-sm" /> </div> <button disabled={loading} className="w-full bg-zippy-dark text-white font-black py-4 rounded-2xl shadow-xl flex items-center justify-center gap-2"> {loading ? <Loader2 className="animate-spin"/> : 'Guardar Tarjeta'} </button> </form> </div> </div> </div> );
};

const ScheduleRideModal = ({ onClose, onSchedule, loading }: { onClose: () => void, onSchedule: (datetime: string) => void, loading: boolean }) => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [time, setTime] = useState(new Date(Date.now() + 3600000).toTimeString().substring(0,5));

    const handleSubmit = () => {
        const scheduledDateTime = new Date(`${date}T${time}`);
        if (scheduledDateTime < new Date()) { alert("Selecciona una hora futura."); return; }
        onSchedule(scheduledDateTime.toISOString());
    };
    
    return ( <div className="fixed inset-0 z-[100] bg-zippy-dark/90 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in"> <div className="bg-white w-full max-w-sm rounded-[32px] shadow-2xl p-6 relative"> <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full text-gray-400"><X size={20}/></button> <div className="text-center mb-6"> <Calendar size={32} className="mx-auto text-zippy-main mb-2"/> <h2 className="text-xl font-black text-zippy-dark uppercase">Programar Viaje</h2> </div> <div className="space-y-4"> <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl font-bold text-sm"/> <input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl font-bold text-sm"/> </div> <button onClick={handleSubmit} disabled={loading} className="w-full bg-zippy-dark text-white font-black py-4 rounded-2xl shadow-xl mt-6"> {loading ? <Loader2 className="animate-spin mx-auto"/> : 'Confirmar Horario'} </button> </div> </div> );
};

export default PassengerApp;
