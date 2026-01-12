
import React, { useState, useEffect } from 'react';
import { Power, Map, Loader2, Lock, Eye, EyeOff, ShieldCheck, Star, Activity, Car, BellRing, X } from 'lucide-react';
import MapVisual from './MapVisual';
import { RideStatus } from '../types';
import { supabase } from '../services/supabase';

interface DriverAppProps {
  onBack: () => void;
}

const DriverApp: React.FC<DriverAppProps> = ({ onBack }) => {
  // Se establece isAuthenticated en true por defecto para desactivar el formulario de acceso
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [rideStatus, setRideStatus] = useState<RideStatus>(RideStatus.IDLE);
  const [loading, setLoading] = useState(false);
  
  // REALTIME NOTIFICATION STATE
  const [activePush, setActivePush] = useState<{title: string, message: string} | null>(null);

  // Auth
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // REALTIME LISTENER
  useEffect(() => {
    if (!isAuthenticated) return;

    const channel = supabase
      .channel('public:notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
        const { title, message, target } = payload.new;
        if (target === 'ALL' || target === 'DRIVERS') {
            setActivePush({ title, message });
            // Vibración si es compatible
            if ("vibrate" in navigator) navigator.vibrate([200, 100, 200]);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isAuthenticated]);

  const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      if (email === 'conductor' && password === '123_conductor') {
          setTimeout(() => { setIsAuthenticated(true); setLoading(false); }, 1000);
          return;
      }
      try {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;
          if (data.user) setIsAuthenticated(true);
      } catch (err: any) { alert(err.message); } finally { setLoading(false); }
  };

  if (!isAuthenticated) {
      return (
          <div className="w-full h-full bg-zippy-dark flex flex-col items-center justify-center p-6 animate-fade-in">
              <img src="https://tritex.com.mx/zippylogo.png" className="h-16 mb-12 filter invert" />
              <div className="bg-white p-10 rounded-[40px] w-full max-sm shadow-2xl relative">
                  <h2 className="text-2xl font-black text-center text-zippy-dark mb-8 uppercase tracking-widest">Conductor</h2>
                  <form onSubmit={handleLogin} className="space-y-5">
                      <input required placeholder="Usuario" className="w-full p-4 bg-gray-50 border rounded-2xl" value={email} onChange={e=>setEmail(e.target.value)} />
                      <input required type={showPassword ? "text" : "password"} placeholder="Contraseña" className="w-full p-4 bg-gray-50 border rounded-2xl" value={password} onChange={e=>setPassword(e.target.value)} />
                      <button className="w-full bg-zippy-dark text-white font-black py-5 rounded-3xl">INGRESAR</button>
                      <button type="button" onClick={onBack} className="w-full text-xs font-bold text-gray-400">VOLVER</button>
                  </form>
              </div>
          </div>
      );
  }

  return (
    <div className="w-full h-full bg-gray-100 flex flex-col relative overflow-hidden font-sans">
        <MapVisual status={isOnline ? rideStatus : 'OFFLINE'} />

        {/* PUSH OVERLAY */}
        {activePush && (
            <div className="fixed inset-0 z-[100] bg-zippy-dark/90 backdrop-blur-xl p-8 flex items-center justify-center animate-fade-in">
                <div className="bg-white w-full max-sm rounded-[40px] p-8 shadow-2xl relative border-4 border-zippy-main">
                    <div className="w-20 h-20 bg-zippy-main rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-xl animate-bounce">
                        <BellRing size={40} className="text-zippy-dark" />
                    </div>
                    <h3 className="text-2xl font-black text-zippy-dark text-center mb-4">{activePush.title}</h3>
                    <p className="text-gray-500 font-bold text-center leading-relaxed mb-8">{activePush.message}</p>
                    <button 
                        onClick={() => setActivePush(null)}
                        className="w-full bg-zippy-dark text-white font-black py-5 rounded-3xl shadow-xl active:scale-95 transition-transform"
                    >
                        ENTENDIDO
                    </button>
                </div>
            </div>
        )}

        <div className="absolute top-0 left-0 right-0 p-4 z-20 flex justify-between items-center bg-white/80 backdrop-blur-md border-b">
            <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <span className="font-black text-xs text-zippy-dark">{isOnline ? 'EN TURNO' : 'FUERA DE LÍNEA'}</span>
            </div>
            <button onClick={()=>setIsOnline(!isOnline)} className={`px-8 py-3 rounded-2xl font-black text-xs transition-all ${isOnline ? 'bg-red-500 text-white' : 'bg-zippy-main text-zippy-dark'}`}>
                {isOnline ? 'FINALIZAR' : 'COMENZAR'}
            </button>
        </div>

        {isOnline && (
            <div className="absolute top-20 left-4 right-4 z-20 grid grid-cols-2 gap-3">
                <div className="bg-white p-4 rounded-3xl shadow-lg border">
                    <p className="text-[10px] font-black text-gray-400 uppercase">Hoy</p>
                    <p className="text-lg font-black text-zippy-dark">$1,240</p>
                </div>
                <div className="bg-white p-4 rounded-3xl shadow-lg border">
                    <p className="text-[10px] font-black text-gray-400 uppercase">Rating</p>
                    <p className="text-lg font-black text-zippy-dark">4.9 ★</p>
                </div>
            </div>
        )}
    </div>
  );
};

export default DriverApp;
