
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, Car, Map, History, DollarSign, 
  MapPin, TrendingUp, Settings, LogOut, CheckCircle, 
  AlertTriangle, Menu, X, Activity, Star, BellRing, Send, Loader2, Info
} from 'lucide-react';
import { generateAdminReport } from '../services/geminiService';
import MapVisual from './MapVisual';
import { supabase } from '../services/supabase';
import { MapEntity } from '../types';

interface AdminDashboardProps {
  onBack: () => void;
}

type AdminView = 'dashboard' | 'users' | 'drivers' | 'live_map' | 'push' | 'settings';

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<AdminView>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [liveEntities, setLiveEntities] = useState<MapEntity[]>([]);
  
  // PUSH STATE
  const [pushTitle, setPushTitle] = useState('');
  const [pushMessage, setPushMessage] = useState('');
  const [pushTarget, setPushTarget] = useState<'ALL' | 'DRIVERS' | 'PASSENGERS'>('ALL');
  const [pushLoading, setPushLoading] = useState(false);

  // DATOS DE MUESTRA
  const [mockDrivers] = useState([
    { id: '1', full_name: 'Roberto Gómez', car_model: 'Nissan Tsuru', car_plate: 'TX-102', rating: 4.9, status: 'online', verification_status: 'verified', trips: 1250 },
    { id: '2', full_name: 'Elena Rodríguez', car_model: 'Hyundai Accent', car_plate: 'TX-554', rating: 4.8, status: 'busy', verification_status: 'verified', trips: 840 },
    { id: '3', full_name: 'Marcos Solis', car_model: 'Toyota Yaris', car_plate: 'TX-009', rating: 3.5, status: 'offline', verification_status: 'pending', trips: 12 },
    { id: '4', full_name: 'Lucía Fernández', car_model: 'Chevrolet Aveo', car_plate: 'TX-882', rating: 5.0, status: 'online', verification_status: 'verified', trips: 2100 }
  ]);

  const [mockPassengers] = useState([
    { id: 'p1', full_name: 'Carlos Slim', email: 'carlos@mail.com', trips: 45, rating: 5.0, status: 'online' },
    { id: 'p2', full_name: 'Ximena Duque', email: 'ximena@mail.com', trips: 12, rating: 4.7, status: 'offline' }
  ]);

  const handleSendPush = async () => {
      if (!pushTitle.trim() || !pushMessage.trim()) return alert("Por favor completa el título y el mensaje.");
      setPushLoading(true);
      try {
          const { error } = await supabase.from('notifications').insert({
              title: pushTitle,
              message: pushMessage,
              target: pushTarget
          });
          if (error) throw error;
          alert(`Mensaje enviado con éxito a: ${pushTarget === 'ALL' ? 'Toda la red Zippy' : pushTarget === 'DRIVERS' ? 'Conductores' : 'Pasajeros'}`);
          setPushTitle('');
          setPushMessage('');
      } catch (e: any) {
          alert("Error al enviar: " + e.message);
      } finally {
          setPushLoading(false);
      }
  };

  useEffect(() => {
    if (activeTab !== 'live_map') return;
    const center = { lat: 19.4326, lng: -99.1332 };
    const entities: MapEntity[] = [
        ...mockDrivers.filter(d => d.status !== 'offline').map(d => ({
            id: d.id, type: 'driver' as const, label: `${d.full_name} (${d.car_plate})`, 
            lat: center.lat + (Math.random() - 0.5) * 0.01, lng: center.lng + (Math.random() - 0.5) * 0.01,
            status: d.status
        }))
    ];
    setLiveEntities(entities);
  }, [activeTab]);

  const SidebarItem = ({ id, icon: Icon, label, badge }: any) => (
    <button onClick={() => { setActiveTab(id); if(window.innerWidth < 768) setSidebarOpen(false); }}
      className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all mb-2 ${activeTab === id ? 'bg-zippy-dark text-white font-black shadow-xl scale-[1.02]' : 'text-zippy-dark/70 hover:bg-white/60 font-bold'}`}>
      <Icon size={20} /> <span className="flex-1 text-left">{label}</span>
      {badge && <span className="bg-red-500 text-white text-[10px] px-2 py-1 rounded-full animate-bounce font-black">{badge}</span>}
    </button>
  );

  return (
    <div className="w-full h-full bg-gray-50 flex relative overflow-hidden font-sans">
      {/* SIDEBAR */}
      <div className={`fixed md:relative inset-y-0 left-0 z-50 w-72 bg-zippy-main flex flex-col transition-transform duration-500 ease-in-out border-r border-zippy-dark/5 shadow-2xl ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-8 flex justify-between items-center">
           <img src="https://tritex.com.mx/zippylogo.png" alt="Zippy Admin" className="h-10 object-contain drop-shadow-md" />
           <button onClick={() => setSidebarOpen(false)} className="md:hidden text-zippy-dark"><X /></button>
        </div>
        
        <nav className="flex-1 px-4 space-y-8 overflow-y-auto">
           <div>
               <p className="text-[10px] font-black text-zippy-dark/30 uppercase tracking-[0.2em] mb-4 px-4">Operaciones</p>
               <SidebarItem id="dashboard" icon={LayoutDashboard} label="Resumen" />
               <SidebarItem id="live_map" icon={Map} label="Mapa Real" badge="LIVE" />
               <SidebarItem id="push" icon={BellRing} label="Push Masivo" />
           </div>
           <div>
               <p className="text-[10px] font-black text-zippy-dark/30 uppercase tracking-[0.2em] mb-4 px-4">Usuarios</p>
               <SidebarItem id="drivers" icon={Car} label="Conductores" />
               <SidebarItem id="users" icon={Users} label="Pasajeros" />
           </div>
        </nav>
        
        <div className="p-6">
             <button onClick={onBack} className="w-full flex items-center justify-center gap-3 p-4 text-red-600 bg-red-50 hover:bg-red-100 rounded-3xl font-black transition-colors shadow-sm">
                <LogOut size={20} /> CERRAR PANEL
             </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white p-6 shadow-sm flex justify-between items-center z-10 border-b border-gray-100">
            <div className="flex items-center gap-4">
                <button onClick={()=>setSidebarOpen(true)} className="md:hidden p-2 text-zippy-dark"><Menu /></button>
                <h1 className="text-2xl font-black text-zippy-dark uppercase tracking-tight">{activeTab.replace('_', ' ')}</h1>
            </div>
            <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                    <p className="text-xs font-black text-zippy-dark/40 uppercase">Admin de Turno</p>
                    <p className="text-sm font-black text-zippy-dark">Zippy HQ Control</p>
                </div>
                <div className="w-10 h-10 bg-zippy-dark rounded-2xl flex items-center justify-center text-white font-black">AD</div>
            </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-10">
            {activeTab === 'dashboard' && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-fade-in">
                    <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 hover:shadow-xl transition-shadow">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4"><Car size={24} /></div>
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Conductores</p>
                        <h3 className="text-4xl font-black text-zippy-dark mt-1">{mockDrivers.length}</h3>
                    </div>
                </div>
            )}

            {/* --- PUSH SYSTEM --- */}
            {activeTab === 'push' && (
                <div className="max-w-4xl mx-auto animate-slide-up">
                    <div className="bg-white rounded-[40px] shadow-2xl overflow-hidden border border-gray-100">
                        <div className="bg-zippy-dark p-12 text-white relative overflow-hidden">
                            <div className="absolute top-[-20px] right-[-20px] p-10 opacity-10 rotate-12 scale-150"><BellRing size={200} /></div>
                            <h2 className="text-4xl font-black mb-3">Push Broadcast</h2>
                            <p className="text-white/60 font-bold text-lg">Comunicación instantánea con toda la plataforma Zippy.</p>
                        </div>
                        
                        <div className="p-10 space-y-10">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-[0.2em]">Seleccionar Destinatarios</label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {(['ALL', 'DRIVERS', 'PASSENGERS'] as const).map(target => (
                                        <button 
                                            key={target}
                                            onClick={() => setPushTarget(target)}
                                            className={`p-5 rounded-3xl border-2 transition-all font-black text-sm flex items-center justify-center gap-3 ${
                                                pushTarget === target ? 'bg-zippy-main border-zippy-main text-zippy-dark shadow-xl scale-[1.02]' : 'bg-white border-gray-100 text-gray-400 hover:border-zippy-main/30'
                                            }`}
                                        >
                                            {target === 'ALL' && <Users size={18}/>}
                                            {target === 'DRIVERS' && <Car size={18}/>}
                                            {target === 'PASSENGERS' && <Users size={18}/>}
                                            {target === 'ALL' ? 'TODOS' : target === 'DRIVERS' ? 'CONDUCTORES' : 'PASAJEROS'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-[0.2em]">Asunto / Título</label>
                                    <input 
                                        value={pushTitle} 
                                        onChange={e=>setPushTitle(e.target.value)}
                                        placeholder="Ej. Bono Nocturno Activado" 
                                        className="w-full p-6 bg-gray-50 border border-gray-100 rounded-3xl outline-none focus:border-zippy-main font-black text-lg placeholder:text-gray-300" 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-[0.2em]">Cuerpo del Mensaje</label>
                                    <textarea 
                                        rows={5}
                                        value={pushMessage} 
                                        onChange={e=>setPushMessage(e.target.value)}
                                        placeholder="Escribe el mensaje que recibirá el usuario..." 
                                        className="w-full p-6 bg-gray-50 border border-gray-100 rounded-3xl outline-none focus:border-zippy-main font-bold resize-none text-lg placeholder:text-gray-300" 
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-5 p-8 bg-blue-50 rounded-[32px] text-blue-800 border border-blue-100 shadow-inner">
                                <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg"><Info size={24} /></div>
                                <p className="text-sm font-bold leading-relaxed">
                                    Esta alerta aparecerá instantáneamente en las pantallas de los usuarios seleccionados, bloqueando otras acciones hasta que sea leída. Úsala para avisos críticos de seguridad o promociones.
                                </p>
                            </div>

                            <button 
                                onClick={handleSendPush}
                                disabled={pushLoading}
                                className="w-full bg-zippy-dark text-white font-black py-7 rounded-[32px] text-xl shadow-2xl hover:bg-zippy-light transition-all flex items-center justify-center gap-4 disabled:opacity-50 active:scale-95 group"
                            >
                                {pushLoading ? <Loader2 className="animate-spin" /> : (
                                    <>
                                        <Send size={28} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /> 
                                        LANZAR NOTIFICACIÓN PUSH
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
