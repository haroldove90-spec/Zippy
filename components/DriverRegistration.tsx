
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
  onRegistrationComplete: () => void;
}

const DriverRegistration: React.FC<DriverRegistrationProps> = ({ isOpen, onClose, userId, onRegistrationComplete }) => {
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
      if (file.size > 5 * 1024 * 1024) {
          alert("La imagen es demasiado pesada. El máximo es 5MB.");
          return;
      }
      setFiles(prev => ({ ...prev, [key]: file }));
      setPreviews(prev => ({ ...prev, [key]: URL.createObjectURL(file) }));
    }
  };

  const handleSubmit = async () => {
    if (!formData.fullName || !formData.phone || !formData.email) {
        alert("Faltan datos personales básicos.");
        setStep(1);
        return;
    }

    setLoading(true);
    try {
      const uploadPromises = Object.entries(files).map(async ([key, val]) => {
        const file = val as File | null;
        if (!file) return { key, url: null };
        
        const fileExt = file.name.split('.').pop();
        const fileName = `reg_${userId || 'anon'}_${key}_${Date.now()}.${fileExt}`;
        const filePath = `drivers/${fileName}`;

        const { data, error } = await supabase.storage.from('zippy-media').upload(filePath, file, { cacheControl: '3600', upsert: true });
        
        if (error) { throw new Error(`Error al subir la imagen ${key}.`); }

        const { data: { publicUrl } } = supabase.storage.from('zippy-media').getPublicUrl(data.path);
        return { key, url: publicUrl };
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      const urls: any = {};
      uploadedUrls.forEach(item => { urls[item.key] = item.url; });

      const { error: appError } = await supabase.from('driver_applications').insert({
        user_id: userId, full_name: formData.fullName, phone: formData.phone, email: formData.email, license_id: formData.licenseId, ine_id: formData.ineId, car_model: formData.carModel, car_plate: formData.carPlate, car_year: formData.carYear, car_color: formData.carColor, selfie_url: urls.selfie, license_photo_url: urls.license, ine_front_url: urls.ineFront, car_photo_front_url: urls.carFront, car_photo_back_url: urls.carBack, status: 'pending'
      });
      if (appError) throw appError;

      if (userId) {
          const { error: profileError } = await supabase.from('profiles').update({ verification_status: 'pending' }).eq('id', userId);
          if (profileError) console.warn("Could not update profile status:", profileError.message);
      }
      
      setCompleted(true);
      onRegistrationComplete();
    } catch (err: any) {
      alert("Error en el Registro de Conductor: " + (err.message || "Error desconocido"));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const StepIndicator = () => ( <div className="flex justify-between items-center px-6 mb-4 mt-8"> {[1, 2, 3, 4].map((s) => ( <div key={s} className="flex items-center"> <div className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-[10px] transition-all ${ step === s ? 'bg-zippy-dark text-white scale-110 shadow-lg ring-2 ring-offset-1 ring-zippy-dark' : step > s ? 'bg-zippy-main text-zippy-dark' : 'bg-gray-100 text-gray-400' }`}> {step > s ? <CheckCircle size={12} /> : s} </div> {s < 4 && <div className={`w-6 md:w-12 h-0.5 mx-1 rounded-full ${step > s ? 'bg-zippy-main' : 'bg-gray-100'}`} />} </div> ))} </div> );
  const MediaInput = ({ label, id, icon: Icon, preview }: any) => ( <div className="space-y-1"> <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">{label}</label> <div className="relative group"> <input type="file" accept="image/*" capture="environment" onChange={(e) => handleFileChange(e, id)} className="hidden" id={`file-${id}`} /> <label htmlFor={`file-${id}`} className={`w-full h-20 rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden ${ preview ? 'border-zippy-main bg-zippy-main/5' : 'border-gray-200 bg-gray-50 hover:border-zippy-dark/20' }`} > {preview ? ( <img src={preview} alt="Preview" className="w-full h-full object-cover" /> ) : ( <> <Icon size={18} className="text-gray-400 mb-1" /> <span className="text-[8px] font-black text-gray-400 uppercase">Toca para foto</span> </> )} {preview && ( <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"> <Camera size={18} className="text-white" /> </div> )} </label> </div> </div> );

  return (
    <div className="fixed inset-0 z-[100] bg-zippy-dark/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-lg flex justify-between items-center mb-4 px-1"> <div className="flex items-center gap-3"> <div className="p-2 bg-zippy-main rounded-xl text-zippy-dark shadow-lg"> <Car size={18} /> </div> <div> <h2 className="text-lg font-black text-white uppercase tracking-tight leading-none">Registro Conductor</h2> <p className="text-white/40 text-[9px] font-black uppercase tracking-widest mt-0.5">Zippy Partner</p> </div> </div> <button onClick={onClose} className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors md:hidden"> <X size={18} /> </button> </div>
      <div className="bg-white w-full max-w-lg rounded-[24px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] relative">
        <button onClick={onClose} className="absolute top-4 right-4 z-20 p-2 bg-gray-50 rounded-full text-gray-400 hover:bg-gray-100 hover:text-zippy-dark transition-all shadow-sm" aria-label="Cerrar formulario"> <X size={20} /> </button>
        {completed ? ( <div className="h-full flex flex-col items-center justify-center text-center space-y-6 p-10 animate-fade-in min-h-[400px]"> <div className="w-20 h-20 bg-zippy-main rounded-[32px] flex items-center justify-center text-zippy-dark shadow-xl animate-bounce"> <CheckCircle size={40} /> </div> <div> <h3 className="text-2xl font-black text-zippy-dark mb-2">¡Solicitud Enviada!</h3> <p className="text-gray-400 text-sm font-medium max-w-[280px] mx-auto leading-relaxed">Hemos recibido tus datos. Nuestro equipo revisará tu documentación en 24-48 horas.</p> </div> <button onClick={onClose} className="bg-zippy-dark text-white font-black text-xs uppercase tracking-widest px-8 py-4 rounded-xl shadow-xl hover:scale-105 transition-transform w-full">VOLVER AL INICIO</button> </div> ) : ( <> <div className="w-full h-1.5 bg-gray-100"> <div className="h-full bg-zippy-main transition-all duration-300 ease-out" style={{ width: `${(step / 4) * 100}%` }} ></div> </div> <div className="flex-1 overflow-y-auto p-5 md:p-6"> <StepIndicator /> {step === 1 && ( <div className="space-y-3 animate-slide-up"> <div className="flex items-center gap-2 mb-3 bg-gray-50 p-2 rounded-lg w-fit"> <User size={14} className="text-zippy-dark" /> <h4 className="font-black text-zippy-dark uppercase text-[10px] tracking-widest">Datos Personales</h4> </div> <div> <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Nombre Completo</label> <input value={formData.fullName} onChange={e=>setFormData({...formData, fullName: e.target.value})} className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl font-bold text-sm outline-none focus:border-zippy-main focus:bg-white transition-all text-zippy-dark" /> </div> <div> <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">WhatsApp / Celular</label> <input type="tel" value={formData.phone} onChange={e=>setFormData({...formData, phone: e.target.value})} className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl font-bold text-sm outline-none focus:border-zippy-main focus:bg-white transition-all text-zippy-dark" /> </div> <div> <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Correo Electrónico</label> <input type="email" value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})} className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl font-bold text-sm outline-none focus:border-zippy-main focus:bg-white transition-all text-zippy-dark" /> </div> <div> <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">CURP o INE (Folio)</label> <input value={formData.ineId} onChange={e=>setFormData({...formData, ineId: e.target.value})} className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl font-bold text-sm outline-none focus:border-zippy-main focus:bg-white transition-all text-zippy-dark" /> </div> </div> )} {step === 2 && ( <div className="space-y-3 animate-slide-up"> <div className="flex items-center gap-2 mb-3 bg-gray-50 p-2 rounded-lg w-fit"> <Car size={14} className="text-zippy-dark" /> <h4 className="font-black text-zippy-dark uppercase text-[10px] tracking-widest">Datos del Vehículo</h4> </div> <div> <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Marca y Modelo</label> <input placeholder="Ej: Nissan Versa" value={formData.carModel} onChange={e=>setFormData({...formData, carModel: e.target.value})} className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl font-bold text-sm outline-none focus:border-zippy-main focus:bg-white transition-all text-zippy-dark" /> </div> <div className="grid grid-cols-2 gap-3"> <div> <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Placas</label> <input value={formData.carPlate} onChange={e=>setFormData({...formData, carPlate: e.target.value})} className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl font-bold text-sm outline-none focus:border-zippy-main focus:bg-white transition-all text-zippy-dark" /> </div> <div> <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Año</label> <input value={formData.carYear} onChange={e=>setFormData({...formData, carYear: e.target.value})} className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl font-bold text-sm outline-none focus:border-zippy-main focus:bg-white transition-all text-zippy-dark" /> </div> </div> <div> <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Color del Auto</label> <input value={formData.carColor} onChange={e=>setFormData({...formData, carColor: e.target.value})} className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl font-bold text-sm outline-none focus:border-zippy-main focus:bg-white transition-all text-zippy-dark" /> </div> <div> <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Número de Licencia</label> <input value={formData.licenseId} onChange={e=>setFormData({...formData, licenseId: e.target.value})} className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl font-bold text-sm outline-none focus:border-zippy-main focus:bg-white transition-all text-zippy-dark" /> </div> </div> )} {step === 3 && ( <div className="space-y-4 animate-slide-up"> <div className="flex items-center gap-2 mb-3 bg-gray-50 p-2 rounded-lg w-fit"> <FileText size={14} className="text-zippy-dark" /> <h4 className="font-black text-zippy-dark uppercase text-[10px] tracking-widest">Documentación</h4> </div> <div className="grid grid-cols-2 gap-4"> <MediaInput label="Licencia (Frente)" id="license" icon={ShieldCheck} preview={previews.license} /> <MediaInput label="INE (Frente)" id="ineFront" icon={User} preview={previews.ineFront} /> </div> <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex gap-3 items-center"> <Smartphone size={16} className="text-blue-600 flex-shrink-0" /> <p className="text-[9px] font-bold text-blue-800 leading-tight uppercase">Asegúrate de que los textos sean legibles y sin reflejos.</p> </div> </div> )} {step === 4 && ( <div className="space-y-4 animate-slide-up"> <div className="flex items-center gap-2 mb-3 bg-gray-50 p-2 rounded-lg w-fit"> <Camera size={14} className="text-zippy-dark" /> <h4 className="font-black text-zippy-dark uppercase text-[10px] tracking-widest">Fotos Finales</h4> </div> <MediaInput label="Tu Selfie (Perfil)" id="selfie" icon={User} preview={previews.selfie} /> <div className="grid grid-cols-2 gap-4"> <MediaInput label="Auto (Frente)" id="carFront" icon={ImageIcon} preview={previews.carFront} /> <MediaInput label="Auto (Atrás)" id="carBack" icon={ImageIcon} preview={previews.carBack} /> </div> </div> )} </div> <div className="p-5 border-t border-gray-100 bg-gray-50/50 flex gap-3"> {step > 1 && ( <button onClick={() => setStep(step - 1)} className="flex-1 py-3 rounded-xl bg-white border border-gray-200 text-gray-400 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors shadow-sm" > <ChevronLeft size={14} /> Atrás </button> )} {step < 4 ? ( <button onClick={() => setStep(step + 1)} className="flex-[2] py-3 rounded-xl bg-zippy-dark text-white font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 hover:bg-zippy-light transition-colors active:scale-95" > Siguiente <ChevronRight size={14} /> </button> ) : ( <button onClick={handleSubmit} disabled={loading} className="flex-[2] py-3 rounded-xl bg-zippy-main text-zippy-dark font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 hover:brightness-105 transition-all active:scale-95" > {loading ? <Loader2 className="animate-spin w-4 h-4" /> : 'Finalizar Registro'} </button> )} </div> </> )}
      </div>
    </div>
  );
};

export default DriverRegistration;
