
import React, { useEffect } from 'react';
import { BellRing, CheckCircle, AlertTriangle, XCircle, MessageSquare } from 'lucide-react';

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'message';

interface NotificationToastProps {
  message: string;
  type: NotificationType;
  isVisible: boolean;
  onClose: () => void;
  title?: string;
}

const NotificationToast: React.FC<NotificationToastProps> = ({ message, type, isVisible, onClose, title }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000); // Auto close after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const getStyles = () => {
    switch (type) {
      case 'success': return { bg: 'bg-green-500', icon: CheckCircle, title: '¡Éxito!' };
      case 'warning': return { bg: 'bg-zippy-main', icon: AlertTriangle, title: 'Atención' };
      case 'error': return { bg: 'bg-red-500', icon: XCircle, title: 'Cancelado' };
      case 'message': return { bg: 'bg-blue-600', icon: MessageSquare, title: 'Nuevo Mensaje' };
      default: return { bg: 'bg-zippy-dark', icon: BellRing, title: 'Notificación' };
    }
  };

  const style = getStyles();
  const Icon = style.icon;

  return (
    <div className="fixed top-4 left-4 right-4 z-[200] animate-slide-down pointer-events-none flex justify-center">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex pointer-events-auto border border-gray-100">
        <div className={`${style.bg} w-2`}></div>
        <div className="p-4 flex items-center gap-3 flex-1">
          <div className={`p-2 rounded-full ${style.bg} bg-opacity-10`}>
             <Icon size={24} className={type === 'warning' ? 'text-zippy-dark' : 'text-gray-800'} style={{ color: type === 'warning' ? '#003A70' : undefined }} />
          </div>
          <div className="flex-1">
            <h4 className="font-black text-zippy-dark text-sm uppercase tracking-wide">{title || style.title}</h4>
            <p className="text-xs font-bold text-gray-500 leading-tight">{message}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-300 hover:text-gray-500">
            <XCircle size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationToast;
