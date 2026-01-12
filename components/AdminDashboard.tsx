
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, Car, Map, History, DollarSign, 
  MapPin, TrendingUp, Settings, LogOut, CheckCircle, 
  AlertTriangle, Menu, X, Activity, Star, BellRing, Send, Loader2, Info, Search, Filter, ClipboardList
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

  // DATOS DE PRUEBA (PLANTILLAS)
  const pushTemplates = [
    { title: "¡Bono Nocturno!", message: "Gana 20% más por viaje esta noche entre 10 PM y 2 AM. ¡Conéctate ya!", target: 'DRIVERS' as const },
    { title: "¡Cupón de Regalo!", message: "Usa el código ZIPPYGRATIS para obtener un 50% de descuento en tu próximo viaje.", target: 'PASSENGERS' as const },
    { title: "Actualización de Sistema", message: "Zippy estará en mantenimiento hoy a las 3:00 AM. Agradecemos tu comprensión.", target: 'ALL' as const },
    { title: "Alerta de Lluvia", message: "Se reportan lluvias fuertes. Conduce con precaución y aprovecha la alta demanda.", target: 'DRIVERS' as const },
  ];

  // DATOS DE MUESTRA MEJORADOS
  const mockDrivers = [
    { id: '1', full_name: 'Roberto Gómez', car_model: 'Nissan Tsuru', car_plate: 'TX-102', rating: 4.9, status: 'online', email: 'roberto@zippy.mx', trips: 1250 },
    { id: '2', full_name: 'Elena Rodríguez', car_model: 'Hyundai Accent', car_plate: 'TX-554', rating: 4.8, status: 'busy', email: 'elena@zippy.mx', trips: 840 },
    { id: '3', full_name: 'Marcos Solis', car_model: 'Toyota Yaris', car_plate: 'TX-009', rating: 3.5, status: 'offline', email: 'marcos@zippy.mx', trips: 12 },
    { id: '4', full_name: 'Lucía Fernández', car_model: 'Chevrolet Aveo', car_plate: 'TX-882', rating: 5.0, status: 'online', email: 'lucia@zippy.mx', trips: 2100 }
  ];

  const mockPassengers = [
    { id: 'p1', full_name: 'Carlos Slim', email: 'carlos@mail.com', trips: 45, rating: 5.0, status: 'online' },
    { id: 'p2', full_name: 'Ximena Duque', email: 'ximena@mail.com', trips: 12, rating: 4.7, status: 'offline' },
    { id: 'p3', full_name: 'Juan Osorio', email: 'josorio@mail.com', trips: 150, rating: 4.9, status: 'online' },
    { id: 'p4', full_name: 'Beatriz Ramos', email: 'bramos@mail.com', trips: 8, rating: 4.5, status: 'online' }
  ];

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
          alert(`Mensaje enviado con éxito.`);
          setPushTitle('');
          setPushMessage('');
      } catch (e: any) { alert("Error: " + e.message); } finally { setPushLoading(false); }
  };

  const applyTemplate = (template: typeof pushTemplates[0]) => {
    setPushTitle(template.title);
    setPushMessage(template.message);
    setPushTarget(template.target);
  };

  useEffect(() => {
    if (activeTab !== 'live_map') return;
    const updateEntities = () => {
        const center = { lat: 19.4326, lng: -99.1332 };
        const entities: MapEntity[] = [
            ...mockDrivers.filter(d => d.status !== 'offline').map(d => ({
                id: d.id, type: 'driver' as const, label: `${d.full_name} (${d.car_plate})`, 
                lat: center.lat + (Math.random() - 0.5) * 0.015, lng: center.lng + (Math.random() - 0.5) * 0.015,
                status: d.status
            })),
            ...mockPassengers.filter(p => p.status === 'online').map(p => ({
                id: p.id, type: 'passenger' as const, label: p.full_name,
                lat: center.lat + (Math.random() - 0.5) * 0.015, lng: center.lng + (Math.random() - 0.5) * 0.015,
                status: 'online'
            }))
        ];
        setLiveEntities(entities);
    };
    updateEntities();
    const interval = setInterval(updateEntities, 4000);
    return () => clearInterval(interval);
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
      <div className={`fixed md:relative inset-y-0 left-0 z-50 w-72 bg-zippy-main flex flex-col transition-transform duration-500 border-r border-zippy-dark/5 shadow-2xl ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-8 flex justify-between items-center">
           <img src="https://tritex.com.mx/zippylogo.png" alt="Zippy Admin" className="h-10 object-contain" />
           <button onClick={() => setSidebarOpen(false)} className="md:hidden text-zippy-dark"><X /></button>
        </div>
        <nav className="flex-1 px-4 space-y-4">
           <div>
               <p className="text-[10px] font-black text-zippy-dark/30 uppercase tracking-[0.2em] mb-4 px-4">Centro de Control</p>
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
             <button onClick={onBack} className="w-full flex items-center justify-center gap-3 p-4 text-red-600 bg-red-50 hover:bg-red-100 rounded-3xl font-black transition-colors">
                <LogOut size={20} /> SALIR
             </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white p-6 shadow-sm flex justify-between items-center z-10">
            <div className="flex items-center gap-4">
                <button onClick={()=>setSidebarOpen(true)} className="md:hidden p-2 text-zippy-dark"><Menu /></button>
                <h1 className="text-2xl font-black text-zippy-dark uppercase tracking-tight">{activeTab}</h1>
            </div>
            <div className="w-10 h-10 bg-zippy-dark rounded-2xl flex items-center justify-center text-white font-black">AD</div>
        </header>

        <main className="flex-1 overflow-y-auto relative">
            {activeTab === 'dashboard' && (
                <div className="p-10 grid grid-cols-1 md:grid-cols-4 gap-6 animate-fade-in">
                    <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Conductores</p>
                        <h3 className="text-4xl font-black text-zippy-dark">{mockDrivers.length}</h3>
                    </div>
                    <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Pasajeros</p>
                        <h3 className="text-4xl font-black text-zippy-dark">{mockPassengers.length}</h3>
                    </div>
                    <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Viajes Hoy</p>
                        <h3 className="text-4xl font-black text-zippy-dark">128</h3>
                    </div>
                    <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Ingresos</p>
                        <h3 className="text-4xl font-black text-zippy-dark">$45k</h3>
                    </div>
                </div>
            )}

            {activeTab === 'live_map' && (
                <div className="absolute inset-0 animate-fade-in">
                    <MapVisual status="live_map" entities={liveEntities} />
                    <div className="absolute top-6 left-6 z-20 bg-white/90 backdrop-blur-md p-6 rounded-[32px] shadow-2xl">
                        <h3 className="text-xs font-black text-zippy-dark uppercase tracking-widest mb-4">Monitor de Red</h3>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div> Conductores en ruta
                            </div>
                            <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                                <div className="w-3 h-3 bg-zippy-main rounded-full"></div> Pasajeros buscando
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'push' && (
                <div className="p-10 max-w-4xl mx-auto space-y-8 animate-fade-in">
                    <div className="bg-white p-8 rounded-[40px] shadow-xl border border-gray-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-zippy-main rounded-2xl text-zippy-dark">
                                <BellRing size={24} />
                            </div>
                            <h3 className="text-xl font-black text-zippy-dark uppercase tracking-tight">Nuevo Envío Masivo</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-2">Título de la Notificación</label>
                                    <input 
                                        type="text" 
                                        value={pushTitle} 
                                        onChange={(e) => setPushTitle(e.target.value)}
                                        placeholder="Ej: ¡Nuevo Bono!"
                                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-zippy-main font-bold text-zippy-dark"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-2">Mensaje</label>
                                    <textarea 
                                        value={pushMessage}
                                        onChange={(e) => setPushMessage(e.target.value)}
                                        placeholder="Escribe el contenido aquí..."
                                        rows={4}
                                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-zippy-main font-bold text-zippy-dark resize-none"
                                    />
                                </div>
                            </div>
                            
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-2">Público Objetivo</label>
                                    <div className="grid grid-cols-1 gap-2">
                                        {(['ALL', 'DRIVERS', 'PASSENGERS'] as const).map((t) => (
                                            <button 
                                                key={t}
                                                onClick={() => setPushTarget(t)}
                                                className={`p-4 rounded-2xl border-2 transition-all text-left font-black text-xs uppercase tracking-widest flex justify-between items-center ${
                                                    pushTarget === t ? 'bg-zippy-dark text-white border-zippy-dark' : 'bg-white text-gray-400 border-gray-50 hover:bg-gray-50'
                                                }`}
                                            >
                                                {t === 'ALL' ? 'Todos los Usuarios' : t === 'DRIVERS' ? 'Solo Conductores' : 'Solo Pasajeros'}
                                                {pushTarget === t && <CheckCircle size={16} />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                
                                <button 
                                    onClick={handleSendPush}
                                    disabled={pushLoading}
                                    className="w-full bg-zippy-main text-zippy-dark font-black py-5 rounded-[24px] shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                >
                                    {pushLoading ? <Loader2 className="animate-spin" /> : <Send size={20} />}
                                    ENVIAR AHORA
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* DATOS DE PRUEBA / PLANTILLAS */}
                    <div>
                        <div className="flex items-center gap-3 mb-6 px-2">
                            <ClipboardList className="text-zippy-dark" size={20} />
                            <h3 className="text-sm font-black text-zippy-dark uppercase tracking-widest">Plantillas de Prueba</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {pushTemplates.map((template, idx) => (
                                <button 
                                    key={idx}
                                    onClick={() => applyTemplate(template)}
                                    className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-md transition-all text-left group"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <h4 className="font-black text-zippy-dark group-hover:text-zippy-main transition-colors">{template.title}</h4>
                                        <span className="text-[8px] font-black px-2 py-1 bg-gray-100 rounded-full text-gray-400 uppercase">
                                            {template.target === 'ALL' ? 'Global' : template.target}
                                        </span>
                                    </div>
                                    <p className="text-xs font-bold text-gray-500 line-clamp-2">{template.message}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {(activeTab === 'drivers' || activeTab === 'users') && (
                <div className="p-10 animate-fade-in">
                    <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    <tr>
                                        <th className="px-8 py-6">Usuario</th>
                                        <th className="px-8 py-6">Info</th>
                                        <th className="px-8 py-6">Viajes</th>
                                        <th className="px-8 py-6">Rating</th>
                                        <th className="px-8 py-6">Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {(activeTab === 'drivers' ? mockDrivers : mockPassengers).map((user: any) => (
                                        <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-gray-100 rounded-2xl overflow-hidden">
                                                        <img src={`https://ui-avatars.com/api/?name=${user.full_name}&background=random`} alt="U" />
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-zippy-dark">{user.full_name}</p>
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase">{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 font-bold text-xs text-gray-600">
                                                {user.car_model ? `${user.car_model} (${user.car_plate})` : 'Pasajero VIP'}
                                            </td>
                                            <td className="px-8 py-6 font-black text-zippy-dark">{user.trips}</td>
                                            <td className="px-8 py-6 font-black text-yellow-600 flex items-center gap-1">
                                                <Star size={14} fill="currentColor" /> {user.rating}
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                    user.status === 'online' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                                                }`}>
                                                    {user.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
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
