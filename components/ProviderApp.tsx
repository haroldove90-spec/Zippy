
import React, { useState, useEffect, useRef } from 'react';
import { 
    Briefcase, Truck, Wrench, Shield, Disc, HeartPulse, 
    LogOut, Power, CheckCircle, AlertTriangle, MapPin, 
    Phone, Clock, Star, Loader2, DollarSign, Eye, EyeOff,
    User, ChevronRight, XCircle, Camera, Save
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { ProviderCategory } from '../types';

interface ProviderAppProps {
  onBack: () => void;
}

interface ServiceRequest {
    id: string;
    customer_name: string;
    description: string;
    location: string;
    price: number;
    time: string;
    distance: string;
}

const SERVICE_OPTIONS: { id: ProviderCategory; label: string; icon: any; color: string; lightColor: string }[] = [
    { id: 'GRUA', label: 'Grúas y Remolque', icon: Truck, color: 'bg-orange-500', lightColor: 'bg-orange-50' },
    { id: 'MECANICO', label: 'Taller Mecánico', icon: Wrench, color: 'bg-blue-600', lightColor: 'bg-blue-50' },
    { id: 'AMBULANCIA', label: 'Ambulancia Privada', icon: HeartPulse, color: 'bg-red-600', lightColor: 'bg-red-50' },
    { id: 'LLANTERA', label: 'Llantera Móvil', icon: Disc, color: 'bg-gray-800', lightColor: 'bg-gray-50' },
    { id: 'SEGURO', label: 'Ajustador de Seguros', icon: Shield, color: 'bg-green-600', lightColor: 'bg-green-50' },
];

const MOCK_REQUESTS: ServiceRequest[] = [
    { id: '1', customer_name: 'Juan Pérez', description: 'Batería descargada, requiere paso de corriente.', location: 'Av. Libertad #452', price: 250, time: 'Hace 5 min', distance: '1.2 km' },
    { id: '2', customer_name: 'María García', description: 'Neumático ponchado, requiere cambio por refacción.', location: 'Calle Morelos esq. Juárez', price: 180, time: 'Hace 12 min', distance: '2.5 km' },
    { id: '3', customer_name: 'Roberto Gómez', description: 'Falla mecánica, el auto no arranca. Posible marcha.', location: 'Estacionamiento Multiplaza', price: 400, time: 'Hace 20 min', distance: '4.8 km' }
];

const ProviderApp: React.FC<ProviderAppProps> = ({ onBack }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [requests, setRequests] = useState<ServiceRequest[]>(MOCK_REQUESTS);

  // Form Data
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProviderCategory>('GRUA');
  const [showPassword, setShowPassword] = useState(false);

  // Avatar Upload State
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
      const checkSession = async () => {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
              setUserId(session.user.id);
              const { data: profileData } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
              if (profileData && profileData.role === 'PROVIDER') {
                  setProfile(profileData);
                  setIsOnline(profileData.status === 'online');
                  setIsAuthenticated(true);
                  fetchRealRequests();
              }
          }
      };
      checkSession();
  }, []);

  const fetchRealRequests = async () => {
      const { data, error } = await supabase
        .from('provider_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (data && data.length > 0) {
          setRequests(data.map(r => ({
              id: r.id,
              customer_name: r.customer_name,
              description: r.description,
              location: r.location_label,
              price: r.price,
              time: 'Ahora',
              distance: 'Cerca de ti'
          })));
      }
  };

  const handleAuth = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      
      try {
          // Validate email format
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email)) {
             throw new Error("Formato de correo inválido. Debes usar una dirección real (ej: usuario@gmail.com).");
          }

          if (authMode === 'register') {
              if (password.length < 6) throw new Error("La contraseña debe ser mayor a 6 dígitos.");
              if (!businessName.trim()) throw new Error("Nombre de negocio obligatorio.");

              const { data, error } = await supabase.auth.signUp({ 
                  email, 
                  password,
                  options: {
                      data: { 
                        full_name: businessName, 
                        phone,
                        role: 'PROVIDER'
                      }
                  }
              });

              if (error) throw error;

              if (data.user) {
                  const { error: profileError } = await supabase.from('profiles').upsert({
                      id: data.user.id, 
                      email, 
                      full_name: businessName, 
                      phone, 
                      role: 'PROVIDER', 
                      service_type: selectedCategory, 
                      status: 'offline'
                  });
                  
                  if (profileError) console.warn("Error al persistir perfil:", profileError);

                  if (data.session) {
                      setUserId(data.user.id);
                      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
                      if (profileData) setProfile(profileData);
                      setIsAuthenticated(true);
                  } else {
                      alert("Registro exitoso. Revisa tu email para confirmar tu cuenta Partner.");
                      setAuthMode('login');
                  }
              }
          } else {
              const { data, error } = await supabase.auth.signInWithPassword({ email, password });
              if (error) throw error;

              if (data.user) {
                  const { data: profileData, error: fetchError } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
                  
                  if (fetchError || !profileData || profileData.role !== 'PROVIDER') {
                      await supabase.auth.signOut();
                      throw new Error("Acceso denegado: Esta cuenta no es de Proveedor o no tiene perfil.");
                  }

                  setUserId(data.user.id);
                  setProfile(profileData);
                  setIsAuthenticated(true);
                  fetchRealRequests();
              }
          }
      } catch (e: any) { 
          alert("Error de Registro/Acceso: " + (e.message || "Ocurrió un error inesperado")); 
      } finally { 
          setLoading(false); 
      }
  };

  const toggleStatus = async () => {
      const newStatus = isOnline ? 'offline' : 'online';
      const prev = isOnline;
      setIsOnline(!isOnline);
      if (userId) {
          const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', userId);
          if (error) {
              alert("No se pudo actualizar el estado en red: " + error.message);
              setIsOnline(prev);
          }
      }
  };

  const handleAcceptRequest = (id: string) => {
      alert(`Servicio #${id} aceptado. Contactando al cliente...`);
      setRequests(prev => prev.filter(r => r.id !== id));
  };
  
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        alert("La imagen debe pesar menos de 5MB");
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveAvatar = async () => {
    if (!avatarFile || !profile?.id) return;
    setLoading(true);
    
    try {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `avatars/${profile.id}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('zippy-media')
          .upload(fileName, avatarFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('zippy-media').getPublicUrl(fileName);
        
        const { error } = await supabase.from('profiles').update({
            avatar_url: data.publicUrl
        }).eq('id', profile.id);

        if (error) throw error;
        
        setProfile((prev: any) => ({ ...prev, avatar_url: data.publicUrl }));
        setAvatarFile(null);
        setAvatarPreview(null);
        alert("Logo actualizado correctamente.");
    } catch (err: any) {
        alert("Error al subir imagen: " + err.message);
    } finally {
        setLoading(false);
    }
  };

  if (!isAuthenticated) {
      return (
          <div className="w-full h-full bg-gray-50 flex flex-col items-center justify-center p-6 overflow-y-auto">
             <div className="w-full max-w-sm">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-orange-500 rounded-3xl mx-auto flex items-center justify-center shadow-2xl mb-3 animate-bounce">
                        <Briefcase size={32} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-black text-zippy-dark">Zippy Business</h1>
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-1">Servicios de Auxilio Vial</p>
                </div>
                <form onSubmit={handleAuth} className="bg-white rounded-[32px] p-6 shadow-2xl space-y-3 border border-gray-100">
                    <h2 className="text-lg font-black text-center text-zippy-dark uppercase">
                        {authMode === 'login' ? 'Ingreso Partner' : 'Registro de Partner'}
                    </h2>
                    {authMode === 'register' && (
                        <>
                            <input required type="text" value={businessName} onChange={e=>setBusinessName(e.target.value)} className="w-full bg-gray-50 p-3 rounded-xl outline-none border border-gray-100 focus:border-orange-500 font-bold text-sm" placeholder="Nombre del Negocio" />
                            <input required type="tel" value={phone} onChange={e=>setPhone(e.target.value)} className="w-full bg-gray-50 p-3 rounded-xl outline-none border border-gray-100 focus:border-orange-500 font-bold text-sm" placeholder="Teléfono de contacto" />
                            <div className="grid grid-cols-1 gap-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase ml-2 mb-1">Categoría de Servicio</label>
                                {SERVICE_OPTIONS.map((opt) => (
                                    <button key={opt.id} type="button" onClick={() => setSelectedCategory(opt.id)} className={`flex items-center gap-3 p-2 rounded-xl border-2 transition-all ${selectedCategory === opt.id ? 'bg-orange-50 border-orange-500' : 'bg-white border-gray-50'}`}>
                                        <div className={`p-1.5 rounded-lg ${opt.color}`}><opt.icon size={14} className="text-white" /></div>
                                        <span className="text-xs font-black text-zippy-dark">{opt.label}</span>
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                    
                    {/* FIXED INPUT TYPE AND PLACEHOLDER */}
                    <input required type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full bg-gray-50 p-3 rounded-xl outline-none border border-gray-100 focus:border-orange-500 font-bold text-sm" placeholder="Correo Electrónico" />
                    
                    <div className="relative">
                        <input required type={showPassword ? "text" : "password"} value={password} onChange={e=>setPassword(e.target.value)} className="w-full bg-gray-50 p-3 rounded-xl outline-none border border-gray-100 focus:border-orange-500 font-bold text-sm" placeholder="Contraseña" />
                        <button type="button" onClick={()=>setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                    <button className="w-full bg-orange-500 text-white font-black py-3 rounded-xl shadow-xl hover:scale-[1.02] transition-transform uppercase tracking-widest text-xs">
                        {loading ? <Loader2 className="animate-spin mx-auto w-5 h-5" /> : authMode === 'login' ? 'INGRESAR AL PANEL' : 'CREAR CUENTA'}
                    </button>
                    <button type="button" onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="w-full text-[10px] font-black text-orange-600 uppercase tracking-widest text-center mt-2 underline">
                        {authMode === 'login' ? '¿Eres nuevo? Regístrate aquí' : '¿Ya tienes cuenta? Entra aquí'}
                    </button>
                    <button type="button" onClick={onBack} className="w-full text-[9px] font-black text-gray-400 uppercase tracking-widest text-center mt-3">Volver al inicio</button>
                </form>
             </div>
          </div>
      );
  }

  const serviceConfig = SERVICE_OPTIONS.find(s => s.id === (profile?.service_type || 'GRUA')) || SERVICE_OPTIONS[0];

  return (
    <div className="w-full h-full bg-gray-50 flex flex-col font-sans overflow-hidden">
        {/* Modern Header */}
        <div className={`p-8 pb-14 rounded-b-[50px] shadow-2xl transition-all duration-700 relative ${isOnline ? serviceConfig.color : 'bg-gray-800'}`}>
            <div className="absolute top-0 right-0 p-10 opacity-10"><serviceConfig.icon size={150} /></div>
            <div className="flex justify-between items-start mb-8 relative z-10">
                <div className="flex items-center gap-4">
                    <div 
                        className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/30 shadow-inner overflow-hidden relative cursor-pointer group"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {profile?.avatar_url || avatarPreview ? (
                            <img src={avatarPreview || profile.avatar_url} className="w-full h-full object-cover" />
                        ) : (
                            <serviceConfig.icon size={28} className="text-white" />
                        )}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera size={16} className="text-white" />
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handleAvatarChange} accept="image/*" className="hidden" />
                    </div>
                    <div>
                        <h2 className="text-white font-black text-xl leading-none">{profile?.full_name || 'Zippy Partner'}</h2>
                        <span className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em]">{serviceConfig.label}</span>
                    </div>
                </div>
                <button onClick={onBack} className="bg-white/10 p-3 rounded-2xl text-white backdrop-blur-sm"><LogOut size={20} /></button>
            </div>
            
            {/* Show Save Button if avatar changed */}
            {avatarFile && (
                <div className="absolute top-20 left-8 z-50 animate-fade-in">
                    <button 
                        onClick={handleSaveAvatar} 
                        disabled={loading}
                        className="bg-white text-zippy-dark px-4 py-2 rounded-xl text-xs font-black shadow-lg flex items-center gap-2 hover:bg-gray-100 transition-colors"
                    >
                        {loading ? <Loader2 size={12} className="animate-spin"/> : <Save size={12}/>} Guardar Logo
                    </button>
                </div>
            )}

            <div className="flex justify-between items-end relative z-10">
                <div>
                    <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-1">Tu Estado</p>
                    <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full ${isOnline ? 'bg-green-400 animate-pulse' : 'bg-red-500'}`}></div>
                        <span className="text-white font-black text-3xl tracking-tighter">{isOnline ? 'ACTIVO' : 'PAUSADO'}</span>
                    </div>
                </div>
                <button onClick={toggleStatus} className={`p-6 rounded-[32px] shadow-2xl transition-all active:scale-90 ${isOnline ? 'bg-white text-zippy-dark' : 'bg-red-500 text-white animate-pulse'}`}>
                    <Power size={32} />
                </button>
            </div>
        </div>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-y-auto p-6 -mt-8 relative z-20">
            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white p-6 rounded-[32px] shadow-xl border border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Hoy</p>
                    <div className="flex items-center gap-2">
                        <DollarSign size={16} className="text-green-500" />
                        <span className="text-2xl font-black text-zippy-dark">$1,250</span>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[32px] shadow-xl border border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Rating</p>
                    <div className="flex items-center gap-2">
                        <Star size={16} className="text-yellow-500 fill-yellow-500" />
                        <span className="text-2xl font-black text-zippy-dark">4.9</span>
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-center mb-6 px-2">
                <h3 className="font-black text-zippy-dark uppercase tracking-widest text-sm">Servicios en Zona</h3>
                <span className="bg-orange-100 text-orange-600 text-[10px] font-black px-3 py-1 rounded-full">{requests.length} NUEVOS</span>
            </div>

            {isOnline ? (
                <div className="space-y-4">
                    {requests.map((req) => (
                        <div key={req.id} className="bg-white rounded-[32px] p-6 shadow-xl border border-gray-50 flex flex-col gap-4 animate-slide-up">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-zippy-dark"><User size={20} /></div>
                                    <div>
                                        <h4 className="font-black text-zippy-dark">{req.customer_name}</h4>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase">{req.time} • {req.distance}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="block text-xl font-black text-zippy-dark">${req.price}</span>
                                    <span className="text-[10px] font-black text-green-500 uppercase">Tarifa</span>
                                </div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-2xl">
                                <p className="text-xs font-bold text-gray-600 leading-relaxed italic">"{req.description}"</p>
                                <div className="flex items-center gap-2 mt-3 text-zippy-dark">
                                    <MapPin size={14} className="text-red-500" />
                                    <span className="text-[10px] font-black uppercase tracking-tight">{req.location}</span>
                                </div>
                            </div>
                            <div className="flex gap-3 mt-2">
                                <button onClick={() => setRequests(prev => prev.filter(r => r.id !== req.id))} className="flex-1 py-4 rounded-2xl bg-gray-100 text-gray-400 font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-colors">Ignorar</button>
                                <button onClick={() => handleAcceptRequest(req.id)} className={`flex-[2] py-4 rounded-2xl text-white font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 ${serviceConfig.color}`}>
                                    <CheckCircle size={16} /> Tomar Servicio
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-gray-100 border-2 border-dashed border-gray-200 rounded-[40px] py-16 px-10 text-center animate-fade-in">
                    <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto flex items-center justify-center mb-6">
                        <Power size={40} className="text-gray-400" />
                    </div>
                    <h4 className="font-black text-gray-500 text-lg uppercase tracking-widest">Estás desconectado</h4>
                    <p className="text-xs text-gray-400 font-bold leading-relaxed mt-2 max-w-[200px] mx-auto">Activa tu estado para empezar a recibir solicitudes de clientes cercanos.</p>
                </div>
            )}
        </div>
    </div>
  );
};

export default ProviderApp;
