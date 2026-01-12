
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
  
  const [pushTitle, setPushTitle] = useState('');
  const [pushMessage, setPushMessage] = useState('');
  const [pushTarget, setPushTarget] = useState<'ALL' | 'DRIVERS' | 'PASSENGERS'>('ALL');
  const [pushLoading, setPushLoading] = useState(false);

  const [mediaItems, setMediaItems] = useState<any[]>([]);
  const [filterMedia, setFilterMedia] = useState('all');

  // LIVE ENTITIES FEED
  useEffect(() => {
    if (activeTab !== 'live_map') return;

    const fetchEntities = async () => {
        const { data } = await supabase.from('profiles').select('id, full_name, lat, lng, role, status').not('lat', 'is', null);
        if (data) {
            setLiveEntities(data.map(p => ({
                id: p.id,
                type: p.role === 'DRIVER' ? 'driver' : 'passenger',
                lat: p.lat || 0,
                lng: p.lng || 0,
                label: p.full_name,
                status: p.status
            })));
        }
    };
    
    fetchEntities();
    const interval = setInterval(fetchEntities, 5000);

    return () => clearInterval(interval);
  }, [activeTab]);

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

  const SidebarItem = ({ id, icon: Icon, label, badge }: any) => (
    <button onClick={() => { setActiveTab(id); if(window.innerWidth < 768) setSidebarOpen(false); }}
      className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all mb-2 ${activeTab === id ? 'bg-zippy-dark text-white font-black shadow-xl scale-[1.02]' : 'text-zippy-dark/70 hover:bg-white/60 font-bold'}`}>
      <Icon size={20} /> <span className="flex-1 text-left">{label}</span>
      {badge && <span className="bg-red-500 text-white text-[10px] px-2 py-1 rounded-full animate-bounce font-black">{badge}</span>}
    </button>
  );

  return (
    <div className="w-full h-full bg-gray-50 flex relative overflow-hidden font-sans">
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
            {activeTab === 'live_map' && (
                <div className="absolute inset-0 z-0">
                    <MapVisual status="live_map" entities={liveEntities} />
                </div>
            )}

            {activeTab === 'dashboard' && (
                <div className="p-10 grid grid-cols-1 md:grid-cols-4 gap-6 animate-fade-in">
                    <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Conductores</p>
                        <h3 className="text-4xl font-black text-zippy-dark">--</h3>
                    </div>
                    <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Viajes Activos</p>
                        <h3 className="text-4xl font-black text-zippy-dark">--</h3>
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
                                <input type="text" value={pushTitle} onChange={(e) => setPushTitle(e.target.value)} placeholder="Título" className="w-full p-4 bg-gray-50 border rounded-2xl" />
                                <textarea value={pushMessage} onChange={(e) => setPushMessage(e.target.value)} placeholder="Mensaje" rows={4} className="w-full p-4 bg-gray-50 border rounded-2xl resize-none" />
                            </div>
                            <div className="space-y-6">
                                <button onClick={handleSendPush} disabled={pushLoading} className="w-full bg-zippy-main text-zippy-dark font-black py-5 rounded-[24px] shadow-xl flex items-center justify-center gap-3">
                                    {pushLoading ? <Loader2 className="animate-spin" /> : <Send size={20} />} ENVIAR AHORA
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
