
import React from 'react';
import { X, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

interface ApplicationStatusProps {
  isOpen: boolean;
  onClose: () => void;
  status: string | null;
}

const ApplicationStatus: React.FC<ApplicationStatusProps> = ({ isOpen, onClose, status }) => {
  if (!isOpen) return null;

  const getStatusDetails = () => {
    switch (status) {
      case 'pending':
      case 'pending_revision':
        return {
          icon: Clock,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-50',
          title: 'Solicitud en Revisión',
          message: 'Nuestro equipo está validando tus documentos. Este proceso puede tardar de 24 a 48 horas. Te notificaremos cualquier actualización.',
        };
      case 'rejected':
        return {
          icon: AlertTriangle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          title: 'Solicitud Rechazada',
          message: 'Se encontró un problema con tu solicitud. Por favor, contacta a soporte para obtener más detalles y conocer los siguientes pasos.',
        };
      case 'verified':
         return {
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          title: '¡Solicitud Aprobada!',
          message: '¡Felicidades! Ya eres parte de la flota Zippy. Cierra sesión e ingresa como conductor para empezar a recibir viajes.',
        };
      default:
        return {
          icon: AlertTriangle,
          color: 'text-gray-500',
          bgColor: 'bg-gray-50',
          title: 'Estado Desconocido',
          message: 'No pudimos determinar el estado de tu solicitud. Por favor, intenta de nuevo más tarde o contacta a soporte.',
        };
    }
  };

  const details = getStatusDetails();
  const Icon = details.icon;

  return (
    <div className="fixed inset-0 z-[100] bg-zippy-dark/90 backdrop-blur-xl flex flex-col items-center justify-center p-4 animate-fade-in">
      <div className="bg-white w-full max-w-sm rounded-[32px] shadow-2xl overflow-hidden relative p-8 text-center">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full text-gray-400 hover:text-zippy-dark">
          <X size={20} />
        </button>

        <div className={`w-20 h-20 ${details.bgColor} rounded-full mx-auto flex items-center justify-center text-zippy-dark mb-6 shadow-inner`}>
          <Icon size={40} className={details.color} />
        </div>

        <h2 className="text-2xl font-black text-zippy-dark mb-2">{details.title}</h2>
        <p className="text-gray-500 font-medium text-sm leading-relaxed mb-8">{details.message}</p>
        
        <button 
          onClick={onClose}
          className="w-full bg-zippy-dark text-white font-black py-4 rounded-2xl shadow-xl hover:bg-zippy-light transition-all text-sm uppercase"
        >
          Entendido
        </button>
      </div>
    </div>
  );
};

export default ApplicationStatus;
