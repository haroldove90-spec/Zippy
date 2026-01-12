
import React, { useState, useEffect } from 'react';
import { User, Car, ShieldCheck, Briefcase, Eye, EyeOff, Loader2 } from 'lucide-react';
import { UserRole } from '../types';
import PassengerApp from './PassengerApp';
import DriverApp from './DriverApp';
import AdminDashboard from './AdminDashboard';
import InstallPwaPopup from './InstallPwaPopup';

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [role, setRole] = useState<UserRole | null>(null);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  
  // Admin credentials state
  const [adminUser, setAdminUser] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return (
      <div className="fixed inset-0 z-[100] bg-zippy-main flex items-center justify-center overflow-hidden">
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

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Credencial de administrador solicitada
    if (adminUser === 'admin' && adminPass === '123_admin') {
        setTimeout(() => {
            setRole(UserRole.ADMIN);
            setLoading(false);
            setShowAdminLogin(false);
        }, 1000);
    } else {
        alert("Credenciales de Administrador Incorrectas");
        setLoading(false);
    }
  };

  const handleBackToHome = () => {
    setRole(null);
  };

  const renderContent = () => {
    if (role === UserRole.PASSENGER) return <PassengerApp onBack={handleBackToHome} />;
    if (role === UserRole.DRIVER) return <DriverApp onBack={handleBackToHome} />;
    if (role === UserRole.ADMIN) return <AdminDashboard onBack={handleBackToHome} />;

    return (
      <div className="w-full h-screen bg-zippy-main flex flex-col items-center justify-center p-6 relative overflow-hidden animate-fade-in">
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
          <h1 className="text-3xl font-black text-zippy-dark mb-2">Bienvenido a <span className="text-white">Zippy</span></h1>
          <p className="text-zippy-dark/70 font-black uppercase text-[10px] tracking-[4px]">El Taxi que va contigo</p>
        </div>

        <div className="grid gap-4 w-full max-w-sm z-10 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <button 
              onClick={() => setRole(UserRole.PASSENGER)}
              className="group flex items-center p-5 bg-zippy-dark hover:bg-zippy-light border border-white/10 rounded-[32px] transition-all hover:scale-[1.05] shadow-2xl"
          >
              <div className="w-14 h-14 bg-zippy-accent text-zippy-dark rounded-2xl flex items-center justify-center mr-5 shadow-lg group-hover:rotate-12 transition-transform">
                  <User size={28} />
              </div>
              <div className="text-left">
                  <h3 className="font-black text-white text-xl">Soy Pasajero</h3>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Viajes rápidos</p>
              </div>
          </button>

          <button 
              onClick={() => setRole(UserRole.DRIVER)}
              className="group flex items-center p-5 bg-zippy-dark hover:bg-zippy-light border border-white/10 rounded-[32px] transition-all hover:scale-[1.05] shadow-2xl"
          >
              <div className="w-14 h-14 bg-white text-zippy-dark rounded-2xl flex items-center justify-center mr-5 shadow-lg group-hover:rotate-12 transition-transform">
                  <Car size={28} />
              </div>
              <div className="text-left">
                  <h3 className="font-black text-white text-xl">Soy Conductor</h3>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Gana dinero hoy</p>
              </div>
          </button>

          <button 
              onClick={() => setShowAdminLogin(true)}
              className="group flex items-center p-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-[24px] transition-all hover:scale-[1.02] mt-4"
          >
              <div className="w-10 h-10 bg-zippy-dark text-white rounded-xl flex items-center justify-center mr-4">
                  <ShieldCheck size={20} />
              </div>
              <div className="text-left">
                  <h3 className="font-black text-zippy-dark text-sm uppercase">Administrador</h3>
              </div>
          </button>
        </div>
        
        <p className="absolute bottom-6 text-[10px] font-black text-zippy-dark/40 uppercase tracking-widest">© 2025 Zippy Technologies</p>

        {/* ADMIN LOGIN MODAL */}
        {showAdminLogin && (
            <div className="fixed inset-0 z-[110] bg-zippy-dark/90 backdrop-blur-xl flex items-center justify-center p-6 animate-fade-in">
                <div className="bg-white w-full max-w-sm rounded-[40px] p-10 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-zippy-main"></div>
                    <button onClick={()=>setShowAdminLogin(false)} className="absolute top-6 right-6 text-gray-400 hover:text-zippy-dark"><ShieldCheck /></button>
                    
                    <h2 className="text-2xl font-black text-zippy-dark mb-8 text-center uppercase tracking-widest">Admin Control</h2>
                    
                    <form onSubmit={handleAdminLogin} className="space-y-4">
                        <input required placeholder="Usuario Admin" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-zippy-main font-bold" value={adminUser} onChange={e=>setAdminUser(e.target.value)} />
                        <div className="relative">
                            <input required type={showPass ? "text" : "password"} placeholder="Contraseña" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-zippy-main font-bold" value={adminPass} onChange={e=>setAdminPass(e.target.value)} />
                            <button type="button" onClick={()=>setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                                {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                        <button className="w-full bg-zippy-dark text-white font-black py-4 rounded-2xl shadow-xl hover:bg-zippy-light transition-all flex items-center justify-center gap-2">
                            {loading ? <Loader2 className="animate-spin" /> : 'ACCEDER AL PANEL'}
                        </button>
                    </form>
                </div>
            </div>
        )}
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
