
import React from 'react';
import { Phone, Siren, Flame, ShieldAlert, HeartPulse, HardHat, AlertTriangle, X } from 'lucide-react';

interface EmergencyDirectoryProps {
  isOpen: boolean;
  onClose: () => void;
}

const EMERGENCY_NUMBERS = [
    { name: "EMERGENCIAS 911", phone: "911", icon: Siren, color: "bg-red-600", textColor: "text-white", large: true },
    { name: "Policía Municipal", phone: "287 875-3166", icon: ShieldAlert, color: "bg-blue-900", textColor: "text-white" },
    { name: "Tránsito Vial", phone: "287 875-0664", phone2: "287 889-9894", icon: AlertTriangle, color: "bg-yellow-500", textColor: "text-black" },
    { name: "Protección Civil", phone: "287 163-5268", icon: HardHat, color: "bg-orange-500", textColor: "text-white" },
    { name: "Cruz Ambar", phone: "287 107-1970", icon: HeartPulse, color: "bg-white", textColor: "text-red-600", border: "border-2 border-red-100" },
    { name: "Bomberos", phone: "287 875-1475", icon: Flame, color: "bg-red-700", textColor: "text-white" },
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
                    <div className="p-3 bg-red-600 rounded-2xl shadow-lg animate-pulse-slow">
                        <Siren size={32} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white leading-none">Emergencias</h2>
                        <p className="text-white/70 text-sm font-medium mt-1">Tuxtepec, Oax.</p>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="p-4 space-y-3 overflow-y-auto -mt-4 pb-8">
                {EMERGENCY_NUMBERS.map((item, index) => (
                    <div key={index} className={`relative rounded-2xl shadow-sm overflow-hidden ${item.large ? 'mb-2 shadow-lg scale-[1.02]' : ''}`}>
                         {/* Card Body */}
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
                                     {item.phone2 && (
                                         <a href={`tel:${item.phone2.replace(/\s/g, '')}`} className={`flex items-center gap-2 font-mono font-bold hover:underline ${item.textColor} opacity-90`}>
                                             <Phone size={14} /> {item.phone2}
                                         </a>
                                     )}
                                 </div>
                             </div>
                             
                             {/* Call Action Button */}
                             <a 
                                href={`tel:${item.phone.replace(/\s/g, '')}`}
                                className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-md active:scale-90 transition-transform"
                             >
                                 <Phone size={20} className="text-zippy-dark" />
                             </a>
                         </div>
                    </div>
                ))}
                
                <p className="text-center text-xs text-gray-400 mt-4 px-6">
                    Presiona el botón de teléfono para llamar inmediatamente. Tu ubicación actual puede ser requerida por el operador.
                </p>
            </div>
        </div>
    </div>
  );
};

export default EmergencyDirectory;
