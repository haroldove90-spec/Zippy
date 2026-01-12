import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

const InstallPwaPopup: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if device is iOS
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIosDevice);

    // Check if already in standalone mode
    const isInStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (isInStandalone) return;

    // Handle beforeinstallprompt for Android/Desktop
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show popup after a short delay for better UX
      setTimeout(() => setIsVisible(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // If iOS, just show popup (since we can't programmatically trigger install)
    if (isIosDevice) {
        setTimeout(() => setIsVisible(true), 3000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsVisible(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center pointer-events-none">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-auto transition-opacity" onClick={handleClose}></div>
      
      {/* Popup Content */}
      <div className="bg-white w-full max-w-md m-4 rounded-3xl p-6 shadow-2xl pointer-events-auto transform transition-all animate-slide-up relative overflow-hidden">
        
        {/* Decorative Background */}
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-zippy-dark to-zippy-light z-0"></div>
        <button onClick={handleClose} className="absolute top-4 right-4 z-10 p-1 bg-white/20 rounded-full text-white hover:bg-white/30">
            <X size={20} />
        </button>

        <div className="relative z-10 flex flex-col items-center mt-4">
            {/* Icon */}
            <div className="w-24 h-24 bg-white rounded-2xl p-1 shadow-lg -mt-12 mb-4">
                <img 
                    src="https://appdesignmex.com/zippy/zippyicono.png" 
                    alt="Zippy App Icon" 
                    className="w-full h-full object-contain rounded-xl"
                />
            </div>

            <h2 className="text-xl font-bold text-zippy-dark text-center mb-1">
                Instala Zippy Taxi
            </h2>
            <p className="text-gray-500 text-sm text-center mb-6 px-4">
                Agrega la app a tu inicio para una experiencia más rápida, segura y sin conexión.
            </p>

            {/* Install Button Logic */}
            {isIOS ? (
                <div className="w-full bg-gray-50 rounded-xl p-4 border border-gray-100 text-sm text-gray-600">
                    <p className="flex items-center gap-2 justify-center mb-2 font-semibold">
                        <Smartphone size={16} /> Para instalar en iOS:
                    </p>
                    <div className="flex items-center justify-between px-2">
                        <span>1. Toca el botón <strong>Compartir</strong></span>
                        <span className="text-blue-500 text-xl">⎋</span>
                    </div>
                    <div className="w-full h-px bg-gray-200 my-2"></div>
                    <div className="flex items-center justify-between px-2">
                        <span>2. Selecciona <strong>"Agregar a Inicio"</strong></span>
                        <span className="text-xl">⊞</span>
                    </div>
                </div>
            ) : (
                <button 
                    onClick={handleInstallClick}
                    className="w-full bg-zippy-accent hover:bg-yellow-400 text-zippy-dark font-bold py-3 rounded-xl shadow-lg shadow-yellow-500/30 flex items-center justify-center gap-2 transition-transform active:scale-95"
                >
                    <Download size={20} />
                    Instalar Aplicación
                </button>
            )}

            <button onClick={handleClose} className="mt-4 text-gray-400 text-xs font-medium hover:text-gray-600">
                Ahora no, continuar en web
            </button>
        </div>
      </div>
    </div>
  );
};

export default InstallPwaPopup;