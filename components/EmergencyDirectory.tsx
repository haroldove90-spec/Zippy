
import React from 'react';
import { Phone, Siren, Flame, ShieldAlert, HeartPulse, HardHat, AlertTriangle, X, ShieldCheck } from 'lucide-react';

interface EmergencyDirectoryProps {
  isOpen: boolean;
  onClose: () => void;
}

const EMERGENCY_NUMBERS = [
    { name: "EMERGENCIAS (NACIONAL)", phone: "911", icon: Siren, color: "bg-red-600", textColor: "text-white", large: true },
    { name: "Denuncia Anónima", phone: "089", icon: ShieldCheck, color: "bg-zippy-dark", textColor: "text-white" },
    { name: "Cruz Roja Oaxaca", phone: "951 516 4455", icon: HeartPulse, color: "bg-white", textColor: "text-red-600", border: "border-2 border-red-100" },
    { name: "Bomberos Oaxaca", phone: "951 514 0022", icon: Flame, color: "bg-red-700", textColor: "text-white" },
    { name: "Policía Estatal Oaxaca", phone: "951 501 5045", icon: ShieldAlert, color: "bg-blue-900", textColor: "text-white" },
    { name: "Ángeles Verdes (Carretera)", phone: "078", icon: HardHat, color: "bg-green-700", textColor: "text-white" },
    { name: "Tránsito del Estado", phone: "951 501 5043", icon: AlertTriangle, color: "bg-yellow-500", textColor: "text-black" },
];

const EmergencyDirectory: React.FC<EmergencyDirectoryProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
        <div className="bg-gray-100 w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-zippy-dark p-6 pb-8 relative">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/10 rounded-full text-white hover:bg-white/20">
                    <X size={20} />
                </button>
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-red-600 rounded-2xl shadow-lg animate-pulse">
                        <Siren size={32} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white leading-none">Emergencias</h2>
                        <p className="text-white/70 text-sm font-medium mt-1">Estado de Oaxaca, Méx.</p>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="p-4 space-y-3 overflow-y-auto -mt-4 pb-8">
                {EMERGENCY_NUMBERS.map((item, index) => (
                    <div key={index} className={`relative rounded-2xl shadow-sm overflow-hidden ${item.large ? 'mb-2 shadow-lg scale-[1.02]' : ''}`}>
                         <div className={`p-4 flex items-center gap-4 ${item.color} ${item.border || ''}`}>
                             <div className={`p-3 rounded-full flex-shrink-0 bg-white/20 backdrop-blur-md`}>
                                 <item.icon size={item.large ? 32 : 24} className={item.textColor === 'text-black' ? 'text-black' : 'text-white'} />
                             </div>
                             <div className="flex-1">
                                 <h3 className={`font-bold ${item.large ? 'text-xl uppercase' : 'text-md'} ${item.textColor}`}>{item.name}</h3>
                                 <div className="flex flex-col gap-1 mt-1">
                                     <a href={`tel:${item.phone.replace(/\s/g, '')}`} className={`flex items-center gap-2 font-mono font-bold hover:underline ${item.textColor} opacity-90`}>
                                         <Phone size={14} /> {item.phone}
                                     </a>
                                 </div>
                             </div>
                             
                             <a 
                                href={`tel:${item.phone.replace(/\s/g, '')}`}
                                className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-md active:scale-90 transition-transform"
                             >
                                 <Phone size={20} className="text-zippy-dark" />
                             </a>
                         </div>
                    </div>
                ))}
                
                <p className="text-center text-[10px] font-black text-gray-400 uppercase tracking-widest mt-4 px-6">
                    Llamada directa • Servicio 24/7
                </p>
            </div>
        </div>
    </div>
  );
};

export default EmergencyDirectory;
