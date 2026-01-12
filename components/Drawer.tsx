
import React, { useState, useEffect } from 'react';
import { X, User, History, CreditCard, Settings, HelpCircle, LogOut, Map, Wrench, Siren, Car, Briefcase } from 'lucide-react';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  currentView: string;
  onChangeView: (view: 'home' | 'profile' | 'history' | 'payment' | 'services') => void;
  onOpenEmergency: () => void;
  userName?: string;
}

const Drawer: React.FC<DrawerProps> = ({ isOpen, onClose, onLogout, onChangeView, onOpenEmergency, currentView, userName = "Usuario" }) => {
  const handleNav = (view: 'home' | 'profile' | 'history' | 'payment' | 'services') => {
    onChangeView(view);
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-zippy-dark/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      
      {/* Drawer - GREEN */}
      <div 
        className={`fixed top-0 left-0 w-3/4 max-w-xs h-full bg-zippy-main z-50 transform transition-transform duration-300 ease-out shadow-2xl border-r border-white/20 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="p-6 flex flex-col h-full overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
             <div className="w-28">
                 <img src="https://tritex.com.mx/zippylogo.png" alt="Zippy Logo" className="w-full object-contain filter drop-shadow-lg" />
             </div>
             <button onClick={onClose} className="p-2 text-zippy-dark hover:bg-white/20 rounded-full">
               <X className="w-6 h-6" />
             </button>
          </div>

          <div className="flex items-center gap-4 mb-8 p-4 bg-zippy-dark rounded-xl shadow-lg transform hover:scale-[1.02] transition-transform cursor-pointer" onClick={() => handleNav('profile')}>
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden border-2 border-zippy-accent">
                <img src={`https://ui-avatars.com/api/?name=${userName}&background=random`} alt="User" className="w-full h-full object-cover" />
            </div>
            <div>
                <h3 className="font-bold text-white truncate max-w-[120px]">{userName}</h3>
                <p className="text-xs text-zippy-accent flex items-center">5.0 ★ Pasajero VIP</p>
            </div>
          </div>

          <nav className="flex-1 space-y-2">
            <button 
                onClick={() => handleNav('home')} 
                className={`w-full flex items-center gap-4 p-3 rounded-lg transition-colors text-left font-medium ${currentView === 'home' ? 'bg-white/20 text-zippy-dark font-bold' : 'text-zippy-dark hover:bg-white/10'}`}
            >
                <Map className="w-5 h-5" />
                <span>Mapa / Viaje</span>
            </button>
            <button 
                onClick={() => handleNav('services')} 
                className={`w-full flex items-center gap-4 p-3 rounded-lg transition-colors text-left font-medium ${currentView === 'services' ? 'bg-white/20 text-zippy-dark font-bold' : 'text-zippy-dark hover:bg-white/10'}`}
            >
                <Wrench className="w-5 h-5" />
                <span>Asistencia y Servicios</span>
            </button>
            <button 
                onClick={() => { onOpenEmergency(); onClose(); }}
                className="w-full flex items-center gap-4 p-3 rounded-lg transition-colors text-left font-medium text-red-600 bg-red-50 hover:bg-red-100"
            >
                <Siren className="w-5 h-5 animate-pulse" />
                <span className="font-bold">Números de Emergencia</span>
            </button>
            
            <div className="h-px bg-zippy-dark/10 my-2"></div>
            
            <button 
                onClick={() => handleNav('profile')} 
                className={`w-full flex items-center gap-4 p-3 rounded-lg transition-colors text-left font-medium ${currentView === 'profile' ? 'bg-white/20 text-zippy-dark font-bold' : 'text-zippy-dark hover:bg-white/10'}`}
            >
                <User className="w-5 h-5" />
                <span>Mi Perfil</span>
            </button>
            <button 
                onClick={() => handleNav('history')} 
                className={`w-full flex items-center gap-4 p-3 rounded-lg transition-colors text-left font-medium ${currentView === 'history' ? 'bg-white/20 text-zippy-dark font-bold' : 'text-zippy-dark hover:bg-white/10'}`}
            >
                <History className="w-5 h-5" />
                <span>Mis Viajes</span>
            </button>
            <button 
                onClick={() => handleNav('payment')} 
                className={`w-full flex items-center gap-4 p-3 rounded-lg transition-colors text-left font-medium ${currentView === 'payment' ? 'bg-white/20 text-zippy-dark font-bold' : 'text-zippy-dark hover:bg-white/10'}`}
            >
                <CreditCard className="w-5 h-5" />
                <span>Pago y Billetera</span>
            </button>

            {/* UPSELL SECTION */}
            <div className="mt-6 mb-2">
                <p className="text-xs font-bold text-zippy-dark/50 uppercase px-3 mb-2">Trabaja con Zippy</p>
                <button 
                    onClick={() => { alert("Para registrarte como Conductor, cerraremos tu sesión. Por favor ingresa en la opción 'Soy Conductor' del menú principal."); onLogout(); }}
                    className="w-full flex items-center gap-4 p-3 rounded-lg transition-colors text-left font-medium text-zippy-dark hover:bg-zippy-accent/20"
                >
                    <Car className="w-5 h-5" />
                    <span>Quiero ser Conductor</span>
                </button>
                <button 
                    onClick={() => { alert("Para registrarte como Proveedor, cerraremos tu sesión. Por favor ingresa en la opción 'Soy Proveedor' del menú principal."); onLogout(); }}
                    className="w-full flex items-center gap-4 p-3 rounded-lg transition-colors text-left font-medium text-zippy-dark hover:bg-zippy-accent/20"
                >
                    <Briefcase className="w-5 h-5" />
                    <span>Quiero ser Proveedor</span>
                </button>
            </div>
          </nav>

          <div className="mt-auto pt-6 border-t border-zippy-dark/10">
             <button 
                onClick={onLogout}
                className="w-full flex items-center gap-4 p-3 text-red-600 hover:bg-red-500/10 rounded-lg transition-colors font-bold"
             >
                <LogOut className="w-5 h-5" />
                <span>Cerrar Sesión</span>
             </button>
             <p className="text-xs text-zippy-dark/60 mt-4 text-center font-semibold">Zippy v2.3.0</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Drawer;
