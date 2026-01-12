
import React, { useState, useEffect } from 'react';
import { 
    Briefcase, Truck, Wrench, Shield, Disc, HeartPulse, 
    LogOut, Power, CheckCircle, AlertTriangle, MapPin, 
    Phone, Clock, Star, Loader2, DollarSign, Eye, EyeOff
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { ProviderCategory } from '../types';

interface ProviderAppProps {
  onBack: () => void;
}

const SERVICE_OPTIONS: { id: ProviderCategory; label: string; icon: any; color: string }[] = [
    { id: 'GRUA', label: 'Grúas y Remolque', icon: Truck, color: 'bg-orange-500' },
    { id: 'MECANICO', label: 'Taller Mecánico', icon: Wrench, color: 'bg-blue-600' },
    { id: 'AMBULANCIA', label: 'Ambulancia Privada', icon: HeartPulse, color: 'bg-red-600' },
    { id: 'LLANTERA', label: 'Llantera Móvil', icon: Disc, color: 'bg-gray-800' },
    { id: 'SEGURO', label: 'Ajustador de Seguros', icon: Shield, color: 'bg-green-600' },
];

const ProviderApp: React.FC<ProviderAppProps> = ({ onBack }) => {
  // --- STATE ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  
  // User Data
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(false);

  // Form Data
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProviderCategory>('GRUA');
  const [showPassword, setShowPassword] = useState(false);

  // Load Session
  useEffect(() => {
      const checkSession = async () => {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
              setUserId(session.user.id);
              // CHECK ROLE BEFORE ACCESS
              const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
              
              if (profile) {
                  if (profile.role === 'PROVIDER') {
                       setProfile(profile);
                       setIsOnline(profile.status === 'online');
                       setIsAuthenticated(true);
                  } else {
                       // USER IS NOT A PROVIDER (LOCK)
                       // Force 'register' mode to upgrade
                       setAuthMode('register');
                       setEmail(session.user.email || '');
                       setBusinessName(profile.full_name || '');
                       setPhone(profile.phone || '');
                       // Do not set isAuthenticated
                  }
              }
          }
      };
      checkSession();
  }, []);

  const fetchProfile = async (uid: string) => {
      setLoading(true);
      const { data } = await supabase.from('profiles').select('*').eq('id', uid).single();
      if (data) {
          setProfile(data);
          setIsOnline(data.status === 'online');
          setIsAuthenticated(true);
      }
      setLoading(false);
  };

  // --- HANDLERS ---
  const handleAuth = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      try {
          if (authMode === 'register') {
              // REGISTER OR UPGRADE
              const { data: { session } } = await supabase.auth.getSession();
              let currentUserId = session?.user?.id;

              if (!currentUserId) {
                 const { data, error } = await supabase.auth.signUp({ email, password });
                 if (error) throw error;
                 currentUserId = data.user?.id;
              }

              if (currentUserId) {
                  // Create or Upgrade Provider Profile with UPSERT
                  const { error: profileError } = await supabase.from('profiles').upsert({
                      id: currentUserId,
                      email: email,
                      full_name: businessName,
                      phone: phone,
                      role: 'PROVIDER', // FORCE ROLE
                      service_type: selectedCategory,
                      status: 'offline'
                  });

                  if (profileError) throw profileError;
                  
                  setUserId(currentUserId);
                  await fetchProfile(currentUserId);
                  alert("Registro de Proveedor Exitoso");
              }
          } else {
              // LOGIN
              const { data, error } = await supabase.auth.signInWithPassword({ email, password });
              if (error) throw error;
              if (data.user) {
                   const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
                   if (profile && profile.role !== 'PROVIDER') {
                       // LOCK
                       setUserId(data.user.id);
                       setAuthMode('register');
                       setBusinessName(profile.full_name || '');
                       alert("Tu cuenta no es de Proveedor. Completa los datos para activar tu negocio.");
                   } else {
                       setUserId(data.user.id);
                       await fetchProfile(data.user.id);
                   }
              }
          }
      } catch (e: any) {
          alert("Error: " + e.message);
      } finally {
          setLoading(false);
      }
  };

  const toggleStatus = async () => {
      if (!userId) return;
      const newStatus = isOnline ? 'offline' : 'online';
      setIsOnline(!isOnline); // Optimistic UI
      
      const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', userId);
      if (error) {
          setIsOnline(isOnline); // Revert on error
          alert("Error al cambiar estado");
      }
  };

  const handleLogout = async () => {
      await supabase.auth.signOut();
      setIsAuthenticated(false);
      onBack();
  };

  // --- ICONS HELPER ---
  const getCategoryIcon = (cat: string) => {
      const service = SERVICE_OPTIONS.find(s => s.id === cat);
      const Icon = service ? service.icon : Briefcase;
      return <Icon size={24} className="text-white" />;
  };

  // --- RENDER LOGIN ---
  if (!isAuthenticated) {
      return (
          <div className="w-full h-full bg-gray-50 flex flex-col items-center justify-center p-6 overflow-y-auto">
             <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-orange-500 rounded-2xl mx-auto flex items-center justify-center shadow-lg mb-4">
                        <Briefcase size={40} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-zippy-dark">Zippy Proveedores</h1>
                    <p className="text-gray-500 text-sm">Gestiona tus servicios auxiliares</p>
                </div>

                <form onSubmit={handleAuth} className="bg-white rounded-3xl p-8 shadow-xl space-y-4">
                    {authMode === 'register' && (
                        <>
                            <div className="bg-orange-50 p-3 rounded-lg border border-orange-200 text-xs text-orange-800 mb-2">
                              {userId ? 'Actualiza tu perfil para ofrecer servicios.' : 'Registra tu negocio para empezar.'}
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Nombre del Negocio</label>
                                <input required type="text" value={businessName} onChange={e=>setBusinessName(e.target.value)} className="w-full bg-gray-100 p-3 rounded-xl outline-none border border-transparent focus:border-orange-500" placeholder="Ej. Grúas El Rápido" />
                            </div>
                            
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Teléfono</label>
                                <input required type="tel" value={phone} onChange={e=>setPhone(e.target.value)} className="w-full bg-gray-100 p-3 rounded-xl outline-none border border-transparent focus:border-orange-500" placeholder="55 1234 5678" />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Tipo de Servicio</label>
                                <div className="grid grid-cols-1 gap-2">
                                    {SERVICE_OPTIONS.map((opt) => (
                                        <button 
                                            key={opt.id}
                                            type="button"
                                            onClick={() => setSelectedCategory(opt.id)}
                                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${selectedCategory === opt.id ? 'bg-orange-50 border-orange-500 shadow-sm' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
                                        >
                                            <div className={`p-2 rounded-lg ${opt.color}`}>
                                                <opt.icon size={16} className="text-white" />
                                            </div>
                                            <span className={`text-sm font-bold ${selectedCategory === opt.id ? 'text-zippy-dark' : 'text-gray-600'}`}>{opt.label}</span>
                                            {selectedCategory === opt.id && <CheckCircle size={16} className="ml-auto text-orange-500" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase ml-1">Correo Electrónico</label>
                        <input required type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full bg-gray-100 p-3 rounded-xl outline-none border border-transparent focus:border-orange-500" placeholder="correo@negocio.com" disabled={!!userId} />
                    </div>
                    
                    {!userId && (
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Contraseña</label>
                            <div className="relative">
                                <input 
                                    required 
                                    type={showPassword ? "text" : "password"} 
                                    value={password} 
                                    onChange={e=>setPassword(e.target.value)} 
                                    className="w-full bg-gray-100 p-3 rounded-xl outline-none border border-transparent focus:border-orange-500 pr-10" 
                                    placeholder="******" 
                                />
                                <button 
                                    type="button" 
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                    )}

                    <button disabled={loading} className="w-full bg-orange-500 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-orange-600 transition-colors flex justify-center items-center gap-2">
                        {loading ? <Loader2 className="animate-spin" /> : (authMode === 'login' ? 'Iniciar Sesión' : userId ? 'Activar Negocio' : 'Registrar Negocio')}
                    </button>

                    {!userId && (
                        <button type="button" onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="block w-full text-center text-sm font-bold text-orange-600 mt-4">
                            {authMode === 'login' ? '¿Nuevo proveedor? Regístrate aquí' : '¿Ya tienes cuenta? Inicia sesión'}
                        </button>
                    )}
                    
                    {userId ? (
                        <button type="button" onClick={() => {setUserId(null); setAuthMode('login');}} className="block w-full text-center text-xs text-red-400 font-medium mt-4">
                            Cancelar / Cerrar sesión
                        </button>
                    ) : (
                        <button type="button" onClick={onBack} className="block w-full text-center text-xs text-gray-400 font-medium">
                            Regresar al inicio
                        </button>
                    )}
                </form>
             </div>
          </div>
      );
  }

  // --- DASHBOARD ---
  // ... (Rest of code remains same)
  const serviceConfig = SERVICE_OPTIONS.find(s => s.id === profile?.service_type) || SERVICE_OPTIONS[0];

  return (
    <div className="w-full h-full bg-gray-100 flex flex-col font-sans">
        {/* Header */}
        <div className={`p-6 pb-12 rounded-b-[40px] shadow-lg transition-colors duration-500 ${isOnline ? serviceConfig.color : 'bg-gray-800'}`}>
            <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                        {serviceConfig.icon && <serviceConfig.icon size={24} className="text-white" />}
                    </div>
                    <div>
                        <h2 className="text-white font-bold text-lg leading-tight">{profile?.full_name || 'Mi Negocio'}</h2>
                        <span className="text-white/80 text-xs font-medium uppercase tracking-wider">{serviceConfig.label}</span>
                    </div>
                </div>
                <button onClick={handleLogout} className="bg-white/10 p-2 rounded-full text-white hover:bg-white/20">
                    <LogOut size={20} />
                </button>
            </div>

            <div className="flex justify-between items-end">
                <div>
                    <p className="text-white/60 text-xs font-bold uppercase mb-1">Estado Actual</p>
                    <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-400 animate-pulse' : 'bg-red-500'}`}></div>
                        <span className="text-white font-bold text-2xl">{isOnline ? 'En Servicio' : 'Desconectado'}</span>
                    </div>
                </div>
                <button 
                    onClick={toggleStatus}
                    className={`p-4 rounded-full shadow-xl border-4 border-white/10 transition-transform active:scale-95 ${isOnline ? 'bg-white text-zippy-dark' : 'bg-red-500 text-white'}`}
                >
                    <Power size={32} />
                </button>
            </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 -mt-6">
            
            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                    <div className="bg-blue-50 w-10 h-10 rounded-full flex items-center justify-center mb-2">
                        <Phone size={20} className="text-blue-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-zippy-dark">0</h3>
                    <p className="text-xs text-gray-500 font-bold uppercase">Llamadas Hoy</p>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                    <div className="bg-green-50 w-10 h-10 rounded-full flex items-center justify-center mb-2">
                        <DollarSign size={20} className="text-green-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-zippy-dark">$0</h3>
                    <p className="text-xs text-gray-500 font-bold uppercase">Ganancias Est.</p>
                </div>
            </div>

            {/* Active Requests List (Empty State for MVP) */}
            <h3 className="font-bold text-zippy-dark mb-4 text-lg">Solicitudes Entrantes</h3>
            
            {isOnline ? (
                <div className="flex flex-col items-center justify-center py-12 bg-white rounded-3xl border border-gray-200 border-dashed">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 animate-pulse">
                        <MapPin size={32} className="text-blue-500" />
                    </div>
                    <h4 className="font-bold text-gray-700">Esperando clientes...</h4>
                    <p className="text-xs text-gray-400 text-center max-w-[200px] mt-2">
                        Tu negocio es visible para usuarios cercanos en el mapa.
                    </p>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-12 bg-gray-200 rounded-3xl">
                    <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center mb-4">
                        <Power size={32} className="text-gray-500" />
                    </div>
                    <h4 className="font-bold text-gray-600">Estás desconectado</h4>
                    <p className="text-xs text-gray-500 text-center mt-2">
                        Activa el servicio para recibir trabajo.
                    </p>
                </div>
            )}

            {/* Info Banner */}
            <div className="mt-6 bg-orange-50 border border-orange-100 p-4 rounded-2xl flex gap-3">
                <AlertTriangle className="text-orange-500 shrink-0" />
                <div>
                    <h4 className="font-bold text-orange-700 text-sm">Recuerda</h4>
                    <p className="text-xs text-orange-600 leading-relaxed">
                        Mantén tu ubicación actualizada. Los usuarios de Zippy te contactarán directamente al número registrado: <span className="font-mono font-bold">{profile?.phone}</span>
                    </p>
                </div>
            </div>
        </div>
    </div>
  );
};

export default ProviderApp;
