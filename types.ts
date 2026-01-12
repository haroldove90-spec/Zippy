
export enum RideStatus {
  IDLE = 'IDLE',
  REQUESTING = 'REQUESTING',
  NEGOTIATING = 'NEGOTIATING',
  ACCEPTED = 'ACCEPTED',
  ARRIVED = 'ARRIVED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  RATING = 'RATING',
  SCHEDULED = 'SCHEDULED'
}

export enum UserRole {
  PASSENGER = 'PASSENGER',
  DRIVER = 'DRIVER',
  ADMIN = 'ADMIN',
  PROVIDER = 'PROVIDER'
}

export type ProviderCategory = 'GRUA' | 'AMBULANCIA' | 'SEGURO' | 'MECANICO' | 'LLANTERA';

export interface RideRequest {
  pickup: string;
  destination: string;
  price: number; 
  distance: number;
  vehicleType: 'basic' | 'comfort';
  paymentMethod: 'cash' | 'card';
  scheduledTime?: string;
  pin?: string;
}

export interface DriverOffer {
  id: string;
  name: string;
  rating: number;
  carModel: string;
  carPlate: string;
  taxiNumber: string;
  price: number;
  eta: number;
  avatarUrl: string;
  distance: number;
  tripsCompleted: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
}

export interface DriverDocuments {
  license?: string;
  insurance?: string;
  id_card?: string;
  vehicle_registration?: string;
}

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  avatar_url?: string;
  rating: number;
  role: string;
  car_model?: string;
  car_plate?: string;
  taxi_number?: string;
  verification_status?: 'verified' | 'pending' | 'rejected' | 'unverified';
  documents?: DriverDocuments;
}

export interface MapEntity {
  id: string;
  type: 'driver' | 'passenger' | 'provider';
  lat: number;
  lng: number;
  label: string;
  status?: string;
}
