
import React from 'react';
import { Star, Car, Check, X, Eye } from 'lucide-react';
import { DriverOffer } from '../types';

interface OffersListProps {
  offers: DriverOffer[];
  onAccept: (offer: DriverOffer) => void;
  onDecline: (id: string) => void;
  onViewProfile?: (offer: DriverOffer) => void; // New prop
}

const OffersList: React.FC<OffersListProps> = ({ offers, onAccept, onDecline, onViewProfile }) => {
  if (offers.length === 0) {
    return (
      <div className="text-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zippy-dark mx-auto mb-4"></div>
        <p className="text-zippy-dark font-medium">Buscando conductores cercanos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-20">
      {offers.map((offer) => (
        <div key={offer.id} className="bg-white rounded-xl p-4 border border-gray-200 shadow-md flex flex-col gap-3">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden border-2 border-zippy-main">
                <img src={offer.avatarUrl} alt={offer.name} className="w-full h-full object-cover" />
              </div>
              <div>
                <h4 className="font-bold text-zippy-dark text-lg">{offer.name}</h4>
                <div className="flex items-center text-sm text-gray-500">
                  <Star className="w-3 h-3 text-zippy-accent fill-zippy-accent" />
                  <span className="ml-1 font-bold">{offer.rating}</span>
                  <span className="mx-1">•</span>
                  <span className="font-mono text-xs bg-gray-100 px-1 rounded">{offer.taxiNumber}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
                <span className="block text-xl font-bold text-zippy-dark">${offer.price}</span>
                <span className="text-xs text-gray-400">{offer.eta} min</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
            <div className="flex items-center gap-2">
                <Car className="w-4 h-4 text-zippy-dark" />
                <span className="font-medium">{offer.carModel}</span>
                <span className="text-xs bg-white border px-1 rounded">{offer.carPlate}</span>
            </div>
          </div>

          <div className="flex gap-2 mt-1">
            <button 
                onClick={() => onViewProfile && onViewProfile(offer)}
                className="flex-1 py-3 rounded-lg bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition-colors flex justify-center items-center gap-2"
            >
                <Eye className="w-4 h-4" /> Perfil
            </button>
            <button 
                onClick={() => onAccept(offer)}
                className="flex-[2] py-3 rounded-lg bg-zippy-dark text-white font-bold hover:bg-zippy-light transition-colors flex justify-center items-center gap-2 shadow-lg"
            >
                <Check className="w-5 h-5" /> Aceptar
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default OffersList;
