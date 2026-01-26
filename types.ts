
export enum RideStatus {
  IDLE = 'IDLE',
  REQUESTING = 'REQUESTING',
  NEGOTIATING = 'NEGOTIATING',
  ACCEPTED = 'ACCEPTED',
  ARRIVED = 'ARRIVED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  RATING = 'RATING',
  SCHEDULED = 'SCHEDULED',
  CANCELLED = 'CANCELLED'
}

export enum UserRole {
  PASSENGER = 'PASSENGER',
  DRIVER = 'DRIVER',
  ADMIN = 'ADMIN',
  PROVIDER = 'PROVIDER'
}

export type ProviderCategory = 'GRUA' | 'AMBULANCIA' | 'SEGURO' | 'MECANICO' | 'LLANTERA';

export interface Ride {
  id: string;
  passenger_id: string;
  driver_id?: string;
  pickup_label: string;
  destination_label: string;
  price: number;
  status: RideStatus;
  created_at?: string;
  scheduled_for?: string;
  // For history detail view
  driver_name?: string;
  driver_avatar_url?: string;
  rating_given?: number;
}

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

export interface DriverTarifa {
  id: string;
  ride_id?: string;
  driver_id?: string;
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
  lat?: number;
  lng?: number;
  is_online?: boolean;
  // Payment fields
  card_name?: string;
  card_last4?: string;
  card_expiry?: string;
  card_brand?: string;
  // Saved Addresses
  saved_home?: string;
  saved_work?: string;
}

export interface MapEntity {
  id: string;
  type: 'driver' | 'passenger' | 'provider';
  lat: number;
  lng: number;
  label: string;
  status?: string;
}

export interface DriverApplication {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  email: string;
  car_model: string;
  car_plate: string;
  car_year: string;
  car_color: string;
  selfie_url?: string;
  license_photo_url?: string;
  ine_front_url?: string;
  car_photo_front_url?: string;
  car_photo_back_url?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}
