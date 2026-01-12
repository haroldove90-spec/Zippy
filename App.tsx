
import React, { useState, useEffect } from 'react';
import { User, Car, ShieldCheck, Briefcase } from 'lucide-react';
import { UserRole } from './types';
import PassengerApp from './components/PassengerApp';
import DriverApp from './components/DriverApp';
import AdminDashboard from './components/AdminDashboard';
import ProviderApp from './components/ProviderApp';
import InstallPwaPopup from './components/InstallPwaPopup';

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [role, setRole] = useState<UserRole | null>(null);

  useEffect(() => {
    // 1. Splash screen timer
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);

    // 2. Load Saved Theme
    const savedTheme = localStorage.getItem('zippy-theme');
    if (savedTheme) {
      try {
        const theme = JSON.parse(savedTheme);
        const root = document.documentElement;
        root.style.setProperty('--zippy-main', theme.main);
        root.style.setProperty('--zippy-dark', theme.dark);
        root.style.setProperty('--zippy-light', theme.light);
        root.style.setProperty('--zippy-accent', theme.accent);
      } catch (e) {
        console.error("Error loading theme", e);
      }
    }

    // 3. Request Notification Permission globally
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        console.log("Estado de notificaciones:", permission);
      });
    }

    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return (
      <div className="fixed inset-0 z-[100] bg-zippy-main flex items-center justify-center overflow-hidden transition-colors duration-500">
        <div className="w-full h-full relative animate-fade-in flex flex-col items-center justify-center">
             <div className="w-full max-w-sm px-10">
                 <img 
                    src="https://tritex.com.mx/zippysplash.png" 
                    alt="Zippy Splash" 
                    className="w-full object-contain drop-shadow-2xl"
                 />
             </div>
             <div className="absolute bottom-10 left-0 right-0 flex justify-center">
                <div className="w-8 h-8 border-4 border-zippy-dark border-t-transparent rounded-full animate-spin"></div>
             </div>
        </div>
      </div>
    );
  }

  const handleBackToHome = () => {
    setRole(null);
  };

  const renderContent = () => {
    if (role === UserRole.PASSENGER) return <PassengerApp onBack={handleBackToHome} />;
    if (role === UserRole.DRIVER) return <DriverApp onBack={handleBackToHome} />;
    if (role === UserRole.ADMIN) return <AdminDashboard onBack={handleBackToHome} />;
    if (role === UserRole.PROVIDER) return <ProviderApp onBack={handleBackToHome} />;

    return (
      <div className="w-full h-screen bg-zippy-main flex flex-col items-center justify-center p-6 relative overflow-hidden animate-fade-in transition-colors duration-500">
        {/* Background Decor */}
        <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
           <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-white rounded-full filter blur-[100px]"></div>
           <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-zippy-accent rounded-full filter blur-[100px]"></div>
        </div>

        <div className="z-10 text-center mb-10">
          <img 
            src="https://tritex.com.mx/zippylogo.png" 
            alt="Zippy" 
            className="h-32 md:h-48 mx-auto mb-6 object-contain filter drop-shadow-xl animate-slide-up" 
          />
          <h1 className="text-3xl font-bold text-zippy-dark mb-2">Bienvenido a Zippy</h1>
          <p className="text-zippy-dark/70 font-medium">Selecciona tu perfil para ingresar</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl z-10 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          
          <button 
              onClick={() => setRole(UserRole.PASSENGER)}
              className="group flex items-center p-4 bg-zippy-dark hover:bg-zippy-light border border-white/20 rounded-2xl transition-all hover:scale-[1.02] shadow-xl"
          >
              <div className="w-12 h-12 bg-zippy-accent text-zippy-dark rounded-full flex items-center justify-center mr-4 shadow-lg group-hover:rotate-12 transition-transform">
                  <User size={24} />
              </div>
              <div className="text-left">
                  <h3 className="font-bold text-white text-lg">Soy Pasajero</h3>
                  <p className="text-xs text-gray-300">Solicita viajes rápidos</p>
              </div>
          </button>

          <button 
              onClick={() => setRole(UserRole.DRIVER)}
              className="group flex items-center p-4 bg-zippy-dark hover:bg-zippy-light border border-white/20 rounded-2xl transition-all hover:scale-[1.02] shadow-xl"
          >
              <div className="w-12 h-12 bg-white text-zippy-dark rounded-full flex items-center justify-center mr-4 shadow-lg group-hover:rotate-12 transition-transform">
                  <Car size={24} />
              </div>
              <div className="text-left">
                  <h3 className="font-bold text-white text-lg">Soy Conductor</h3>
                  <p className="text-xs text-gray-300">Gana dinero manejando</p>
              </div>
          </button>

          <button 
              onClick={() => setRole(UserRole.PROVIDER)}
              className="group flex items-center p-4 bg-white hover:bg-gray-50 border border-zippy-dark/10 rounded-2xl transition-all hover:scale-[1.02] shadow-xl"
          >
              <div className="w-12 h-12 bg-orange-500 text-white rounded-full flex items-center justify-center mr-4 shadow-lg group-hover:rotate-12 transition-transform">
                  <Briefcase size={24} />
              </div>
              <div className="text-left">
                  <h3 className="font-bold text-zippy-dark text-lg">Soy Proveedor</h3>
                  <p className="text-xs text-gray-500">Grúas, Mecánicos, Seguros...</p>
              </div>
          </button>

          <button 
              onClick={() => setRole(UserRole.ADMIN)}
              className="group flex items-center p-4 bg-gray-800 hover:bg-gray-700 border border-white/20 rounded-2xl transition-all hover:scale-[1.02] shadow-xl"
          >
              <div className="w-12 h-12 bg-gray-600 text-white rounded-full flex items-center justify-center mr-4 shadow-lg group-hover:rotate-12 transition-transform">
                  <ShieldCheck size={24} />
              </div>
              <div className="text-left">
                  <h3 className="font-bold text-white text-lg">Administrador</h3>
                  <p className="text-xs text-gray-300">Gestión y control</p>
              </div>
          </button>
        </div>
        
        <p className="absolute bottom-6 text-xs text-zippy-dark/60 font-medium">© 2024 Zippy Technologies</p>
      </div>
    );
  };

  return (
    <>
      {renderContent()}
      <InstallPwaPopup />
    </>
  );
}

export default App;
