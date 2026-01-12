
import React, { useState, useRef } from 'react';
import { 
  X, User, Car, FileText, Camera, Upload, CheckCircle, 
  ChevronRight, ChevronLeft, Loader2, Smartphone, ShieldCheck,
  Image as ImageIcon
} from 'lucide-react';
import { supabase } from '../services/supabase';

interface DriverRegistrationProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
}

const DriverRegistration: React.FC<DriverRegistrationProps> = ({ isOpen, onClose, userId }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    licenseId: '',
    ineId: '',
    carModel: '',
    carPlate: '',
    carYear: '',
    carColor: '',
  });

  // Media State
  const [files, setFiles] = useState<{ [key: string]: File | null }>({
    selfie: null,
    license: null,
    ineFront: null,
    carFront: null,
    carBack: null,
  });

  const [previews, setPreviews] = useState<{ [key: string]: string }>({
    selfie: '',
    license: '',
    ineFront: '',
    carFront: '',
    carBack: '',
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
    const file = e.target.files?.[0];
    if (file) {
      setFiles(prev => ({ ...prev, [key]: file }));
      setPreviews(prev => ({ ...prev, [key]: URL.createObjectURL(file) }));
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // 1. Upload images to Supabase Storage
      const uploadPromises = Object.entries(files).map(async ([key, val]) => {
        // Cast the value to File | null to ensure properties like 'name' are accessible
        const file = val as File | null;
        if (!file) return { key, url: null };
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId || 'anon'}_${key}_${Date.now()}.${fileExt}`;
        const { data, error } = await supabase.storage
          .from('zippy-media')
          .upload(`drivers/${fileName}`, file);
        
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from('zippy-media').getPublicUrl(data.path);
        return { key, url: publicUrl };
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      const urls: any = {};
      uploadedUrls.forEach(item => { urls[item.key] = item.url; });

      // 2. Save data to database
      const { error } = await supabase.from('driver_applications').insert({
        user_id: userId,
        full_name: formData.fullName,
        phone: formData.phone,
        email: formData.email,
        license_id: formData.licenseId,
        ine_id: formData.ineId,
        car_model: formData.carModel,
        car_plate: formData.carPlate,
        car_year: formData.carYear,
        car_color: formData.carColor,
        selfie_url: urls.selfie,
        license_photo_url: urls.license,
        ine_front_url: urls.ineFront,
        car_photo_front_url: urls.carFront,
        car_photo_back_url: urls.carBack,
      });

      if (error) throw error;
      setCompleted(true);
    } catch (err: any) {
      alert("Error al enviar solicitud: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const StepIndicator = () => (
    <div className="flex justify-between items-center px-8 mb-8">
      {[1, 2, 3, 4].map((s) => (
        <div key={s} className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-all ${
            step === s ? 'bg-zippy-dark text-white scale-110 shadow-lg' : 
            step > s ? 'bg-zippy-main text-zippy-dark' : 'bg-gray-200 text-gray-400'
          }`}>
            {step > s ? <CheckCircle size={16} /> : s}
          </div>
          {s < 4 && <div className={`w-10 h-0.5 mx-2 ${step > s ? 'bg-zippy-main' : 'bg-gray-200'}`} />}
        </div>
      ))}
    </div>
  );

  const MediaInput = ({ label, id, icon: Icon, preview }: any) => (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">{label}</label>
      <div className="relative group">
        <input 
          type="file" 
          accept="image/*" 
          capture="environment"
          onChange={(e) => handleFileChange(e, id)}
          className="hidden" 
          id={`file-${id}`} 
        />
        <label 
          htmlFor={`file-${id}`}
          className={`w-full h-32 rounded-[24px] border-2 border-dashed flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden ${
            preview ? 'border-zippy-main bg-zippy-main/5' : 'border-gray-200 bg-gray-50 hover:border-zippy-dark/20'
          }`}
        >
          {preview ? (
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <>
              <Icon size={24} className="text-gray-400 mb-2" />
              <span className="text-[10px] font-black text-gray-400 uppercase">Toca para capturar</span>
            </>
          )}
          {preview && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
               <Camera size={24} className="text-white" />
            </div>
          )}
        </label>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] bg-zippy-dark/95 backdrop-blur-xl flex flex-col animate-fade-in">
      {/* Header */}
      <div className="p-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-zippy-main rounded-2xl text-zippy-dark">
            <Car size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight">Registro de Conductor</h2>
            <p className="text-white/40 text-[9px] font-black uppercase tracking-widest">Zippy Partner Program</p>
          </div>
        </div>
        <button onClick={onClose} className="p-3 bg-white/10 rounded-full text-white hover:bg-white/20">
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-32">
        {completed ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-6 animate-fade-in">
             <div className="w-24 h-24 bg-zippy-main rounded-[40px] flex items-center justify-center text-zippy-dark shadow-2xl">
                <CheckCircle size={48} />
             </div>
             <h3 className="text-3xl font-black text-white">¡Solicitud Enviada!</h3>
             <p className="text-white/60 font-medium max-w-[280px]">Hemos recibido tus datos correctamente. Nuestro equipo revisará tu documentación y te contactaremos en un plazo de 24-48 horas.</p>
             <button onClick={onClose} className="bg-white text-zippy-dark font-black px-10 py-4 rounded-3xl shadow-xl">VOLVER AL INICIO</button>
          </div>
        ) : (
          <div className="bg-white rounded-[40px] p-8 shadow-2xl animate-slide-up">
            <StepIndicator />

            {step === 1 && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center gap-2 mb-2">
                   <User size={18} className="text-zippy-dark" />
                   <h4 className="font-black text-zippy-dark uppercase text-sm tracking-widest">Datos Personales</h4>
                </div>
                <input placeholder="Nombre Completo" value={formData.fullName} onChange={e=>setFormData({...formData, fullName: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold" />
                <input placeholder="WhatsApp / Celular" type="tel" value={formData.phone} onChange={e=>setFormData({...formData, phone: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold" />
                <input placeholder="Correo Electrónico" type="email" value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold" />
                <input placeholder="CURP o INE (Folio)" value={formData.ineId} onChange={e=>setFormData({...formData, ineId: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold" />
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center gap-2 mb-2">
                   <Car size={18} className="text-zippy-dark" />
                   <h4 className="font-black text-zippy-dark uppercase text-sm tracking-widest">Datos del Vehículo</h4>
                </div>
                <input placeholder="Marca y Modelo (Ej: Nissan Versa)" value={formData.carModel} onChange={e=>setFormData({...formData, carModel: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold" />
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="Placas" value={formData.carPlate} onChange={e=>setFormData({...formData, carPlate: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold" />
                  <input placeholder="Año" value={formData.carYear} onChange={e=>setFormData({...formData, carYear: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold" />
                </div>
                <input placeholder="Color del Auto" value={formData.carColor} onChange={e=>setFormData({...formData, carColor: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold" />
                <input placeholder="Número de Licencia" value={formData.licenseId} onChange={e=>setFormData({...formData, licenseId: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold" />
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-center gap-2 mb-2">
                   <FileText size={18} className="text-zippy-dark" />
                   <h4 className="font-black text-zippy-dark uppercase text-sm tracking-widest">Documentación</h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <MediaInput label="Licencia (Frente)" id="license" icon={ShieldCheck} preview={previews.license} />
                  <MediaInput label="INE (Frente)" id="ineFront" icon={User} preview={previews.ineFront} />
                </div>
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex gap-3">
                    <Smartphone size={20} className="text-blue-500 flex-shrink-0" />
                    <p className="text-[10px] font-bold text-blue-700 leading-relaxed uppercase">Asegúrate de que los textos sean legibles y no haya reflejos de luz.</p>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-center gap-2 mb-2">
                   <Camera size={18} className="text-zippy-dark" />
                   <h4 className="font-black text-zippy-dark uppercase text-sm tracking-widest">Fotos Finales</h4>
                </div>
                <MediaInput label="Tu Selfie (Perfil)" id="selfie" icon={User} preview={previews.selfie} />
                <div className="grid grid-cols-2 gap-4">
                  <MediaInput label="Auto (Frente)" id="carFront" icon={ImageIcon} preview={previews.carFront} />
                  <MediaInput label="Auto (Atrás)" id="carBack" icon={ImageIcon} preview={previews.carBack} />
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="mt-10 flex gap-4">
              {step > 1 && (
                <button 
                  onClick={() => setStep(step - 1)}
                  className="flex-1 py-4 rounded-2xl bg-gray-100 text-gray-400 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  <ChevronLeft size={16} /> Atrás
                </button>
              )}
              
              {step < 4 ? (
                <button 
                  onClick={() => setStep(step + 1)}
                  className="flex-[2] py-4 rounded-2xl bg-zippy-dark text-white font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2"
                >
                  Siguiente <ChevronRight size={16} />
                </button>
              ) : (
                <button 
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-[2] py-4 rounded-2xl bg-zippy-main text-zippy-dark font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" /> : 'Finalizar Registro'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverRegistration;
