
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, Car, Map, History, DollarSign, 
  MapPin, TrendingUp, Settings, LogOut, CheckCircle, 
  AlertTriangle, Menu, X, Activity, Star, BellRing, Send, Loader2, Info, Search, Filter, ClipboardList,
  Image as ImageIcon, Eye, FileText, Camera
} from 'lucide-react';
import { generateAdminReport } from '../services/geminiService';
import MapVisual from './MapVisual';
import { supabase } from '../services/supabase';
import { MapEntity } from '../types';

interface AdminDashboardProps {
  onBack: () => void;
}

type AdminView = 'dashboard' | 'users' | 'drivers' | 'live_map' | 'push' | 'media' | 'settings';

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

  // MEDIA STATE
  const [mediaItems, setMediaItems] = useState<any[]>([]);
  const [filterMedia, setFilterMedia] = useState('all');

  // DATOS DE PRUEBA (PLANTILLAS)
  const pushTemplates = [
    { title: "¡Bono Nocturno!", message: "Gana 20% más por viaje esta noche entre 10 PM y 2 AM. ¡Conéctate ya!", target: 'DRIVERS' as const },
    { title: "¡Cupón de Regalo!", message: "Usa el código ZIPPYGRATIS para obtener un 50% de descuento en tu próximo viaje.", target: 'PASSENGERS' as const },
    { title: "Actualización de Sistema", message: "Zippy estará en mantenimiento hoy a las 3:00 AM. Agradecemos tu comprensión.", target: 'ALL' as const },
  ];

  const mockDrivers = [
    { id: '1', full_name: 'Roberto Gómez', car_model: 'Nissan Tsuru', car_plate: 'TX-102', rating: 4.9, status: 'online', email: 'roberto@zippy.mx', trips: 1250 },
    { id: '2', full_name: 'Elena Rodríguez', car_model: 'Hyundai Accent', car_plate: 'TX-554', rating: 4.8, status: 'busy', email: 'elena@zippy.mx', trips: 840 },
    { id: '4', full_name: 'Lucía Fernández', car_model: 'Chevrolet Aveo', car_plate: 'TX-882', rating: 5.0, status: 'online', email: 'lucia@zippy.mx', trips: 2100 }
  ];

  const mockPassengers = [
    { id: 'p1', full_name: 'Carlos Slim', email: 'carlos@mail.com', trips: 45, rating: 5.0, status: 'online' },
    { id: 'p3', full_name: 'Juan Osorio', email: 'josorio@mail.com', trips: 150, rating: 4.9, status: 'online' }
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

  useEffect(() => {
    if (activeTab === 'media') {
        // Cargar imágenes de ejemplo para la sección de medios
        setMediaItems([
            { id: 1, type: 'selfie', url: 'https://ui-avatars.com/api/?name=Roberto+Gomez&size=512', owner: 'Roberto Gómez', date: '14 May' },
            { id: 2, type: 'car', url: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=400', owner: 'Elena R.', date: '13 May' },
            { id: 3, type: 'document', url: 'https://images.unsplash.com/photo-1589330694653-ded6df03f754?auto=format&fit=crop&q=80&w=400', owner: 'Lucía F.', date: '12 May' },
            { id: 4, type: 'car', url: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&q=80&w=400', owner: 'Marcos S.', date: '11 May' },
        ]);
    }
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
               <SidebarItem id="media" icon={ImageIcon} label="Centro de Medios" />
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
                </div>
            )}

            {activeTab === 'media' && (
                <div className="p-10 space-y-8 animate-fade-in">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <h3 className="text-xl font-black text-zippy-dark uppercase">Galería de Documentos y Fotos</h3>
                        <div className="flex gap-2">
                            {['all', 'selfie', 'car', 'document'].map(f => (
                                <button key={f} onClick={() => setFilterMedia(f)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterMedia === f ? 'bg-zippy-dark text-white' : 'bg-white text-gray-400'}`}>
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {mediaItems.filter(i => filterMedia === 'all' || i.type === filterMedia).map(item => (
                            <div key={item.id} className="bg-white rounded-[32px] overflow-hidden shadow-xl border border-gray-100 group">
                                <div className="aspect-square relative overflow-hidden">
                                    <img src={item.url} alt="Media" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    <div className="absolute top-2 right-2 px-2 py-1 bg-zippy-main text-zippy-dark text-[8px] font-black rounded-lg uppercase">
                                        {item.type}
                                    </div>
                                </div>
                                <div className="p-4">
                                    <p className="font-black text-zippy-dark text-sm truncate">{item.owner}</p>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.date}</p>
                                    <div className="flex gap-2 mt-4">
                                        <button className="flex-1 bg-zippy-dark text-white p-2 rounded-xl flex items-center justify-center"><Eye size={14}/></button>
                                        <button className="flex-1 bg-green-100 text-green-600 p-2 rounded-xl flex items-center justify-center"><CheckCircle size={14}/></button>
                                        <button className="flex-1 bg-red-100 text-red-600 p-2 rounded-xl flex items-center justify-center"><AlertTriangle size={14}/></button>
                                    </div>
                                </div>
                            </div>
                        ))}
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
                </div>
            )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
